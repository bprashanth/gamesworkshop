// DUNE//EATER (Rover Run v1.2). Each square: decide go/avoid on partial information,
// then the rest of the last square's cards flip, then pick 2 cards of the square you
// just crossed. The cards are drawn as a graph, one lane per suit, so correlations show.
import { newRun, play } from './engine.js';
import { Screen, COLS, MAP, SX, SY, INK, DIM, FAINT, SAND, contourDots, routeDots } from './screen.js';
import * as fx from './effects.js';

const [map, deckFile] = await Promise.all(['map.json', 'deck.json'].map(f => fetch(f).then(r => r.json())));
const sols = deckFile.sols, rules = deckFile.rules, N = sols[0].length;
let sol = 0, deck = sols[0];
const params = new URLSearchParams(location.search), speed = Number(params.get('speed') || 1);
if (params.has('film')) document.documentElement.classList.add('film');

// ---------- one page: size the screen so map + cards fit the window ----------
const main = document.querySelector('main');
function fit() {
  const below = document.querySelector('.below').getBoundingClientRect().height || 170;
  const w = Math.min(1280, innerWidth - 24, (innerHeight - below - 44) / (ROWS_RATIO));
  main.style.maxWidth = `${Math.max(320, Math.floor(w))}px`;
}
const ROWS_RATIO = 31 * 1.9 / COLS;
fit();
const screen = new Screen(document.getElementById('screen'));
const contours = contourDots(map), route = routeDots(map);
const first = Array.from({ length: N + 1 }, (_, r) => r < N ? route.findIndex(d => d.row === r) : route.length - 1);

// ---------- memory: past runs and every card ever looked at ----------
const KEY = 'rover-run.claude.v1.2.frozen';
let memory = { runs: [], looked: {} };
try { memory = { ...memory, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
const seen = () => (memory.looked[sol] ??= {});                    // square -> suits seen, any run
const solRuns = () => memory.runs.filter(r => (r.sol ?? 0) === sol);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch {} };

// ---------- state ----------
const LOOK = 2;
let mode = 'intro', run = newRun(deck, rules), stop = null, clock = 0, anim = null, effect = null, replay = null;
let shown = {}, pickCol = null, lastAt = 0, introStart = 0, queued = null;

// ---------- suits: three levels each, drawn as lanes of a graph ----------
const SUITS = [
  { name: 'slope', get: r => r.slope, levels: ['flat', 'tilted', 'steep'], dash: '' },
  { name: 'ground', get: r => r.ground, levels: ['firm', 'soft', 'sand'], dash: '1 3' },
  { name: 'dust', get: r => r.dust, levels: ['clear', 'haze', 'storm'], dash: '5 3' },
  { name: 'battery', get: r => (r.ground === 'sand' || r.dust === 'storm') ? '–' : r.battery < 0 ? '−1' : '0', levels: ['0', '−1', '–'], dash: '6 2 1 2' },
];
const ALL = SUITS.map(s => s.name);
const deadly = (suit, v) => (suit === 'ground' && v === 'sand') || (suit === 'dust' && v === 'storm') || (suit === 'battery' && v === '–');
const word = v => (v === 'sand' || v === 'storm') ? v.toUpperCase() : v;

const cardsEl = document.getElementById('cards');
function paintCards() {
  const W = cardsEl.clientWidth || 600, L = 58, top = 14, LH = 30, cw = (W - L - 4) / N, H = top + SUITS.length * LH + 2;
  const cx = c => L + (c + 0.5) * cw, ly = (lane, lv) => top + lane * LH + LH * (0.8 - lv * 0.3);
  const deciding = mode === 'play' ? run.pos : null;
  let svg = '';
  // column numbers, and the square being decided
  for (let c = 0; c < N; c++) {
    const on = c === deciding || c === pickCol;
    svg += `<text x="${cx(c)}" y="10" class="${on ? 'num on' : 'num'}">${c + 1}</text>`;
    if (c === deciding) svg += `<rect x="${L + c * cw + 1}" y="${top - 1}" width="${cw - 2}" height="${SUITS.length * LH}" class="deciding"/>`;
  }
  SUITS.forEach((s, lane) => {
    svg += `<text x="0" y="${top + lane * LH + LH * 0.58}" class="lane">${s.name}</text>`;
    svg += `<line x1="${L}" x2="${W - 4}" y1="${top + (lane + 1) * LH - 0.5}" y2="${top + (lane + 1) * LH - 0.5}" class="sep"/>`;
    let prev = null;
    for (let c = 0; c < N; c++) {
      const v = s.get(deck[c]), lv = s.levels.indexOf(v), up = shown[c]?.includes(s.name);
      const x = cx(c), y = ly(lane, lv), x0 = L + c * cw + 2, y0 = top + lane * LH + 3, w = cw - 4, h = LH - 6;
      if (up) {
        if (prev) svg += `<line x1="${prev[0]}" y1="${prev[1]}" x2="${x}" y2="${y}" stroke-dasharray="${s.dash}" class="trace"/>`;
        svg += deadly(s.name, v) ? `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" class="dead"><title>${word(v)}</title></rect>`
                                 : `<circle cx="${x}" cy="${y}" r="2.6" class="dot"><title>${word(v)}</title></circle>`;
        prev = [x, y];
        continue;
      }
      prev = null;
      if (mode === 'pick' && c === pickCol) svg += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="2" class="pick" data-suit="${s.name}"/><text x="${x}" y="${y0 + h / 2 + 4}" class="q">${lane + 1}</text>`;
      else if (seen()[c]?.includes(s.name)) svg += `<circle cx="${x}" cy="${y}" r="2.6" class="ghost"><title>${word(v)} (earlier run)</title></circle>`;
      else if (c < run.pos || c === pickCol) svg += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="2" class="back"/>`;
    }
  });
  cardsEl.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg>`;
}
cardsEl.addEventListener('click', e => { const s = e.target.dataset?.suit; if (s) look(s); });

// ---------- drawing the screen ----------
const dotPx = d => screen.px(d.dx, d.dy);
function drawMap(list, { contourAlpha = 1, live = true } = {}) {
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: contourAlpha * 0.75 }); }
  const moves = Object.fromEntries(run.log.map(l => [l.pos, l.move]));
  const blink = 0.3 + 0.7 * Math.abs(Math.sin(clock * 3));
  route.forEach((d, i) => {
    const [x, y] = dotPx(d), move = moves[d.row];
    if (d.row < run.pos && move === 'go') list.push({ x, y, c: '#fff', s: 1.7 });
    else if (d.row < run.pos && move === 'avoid') { if (i % 6 < 3) list.push({ x, y, c: '#fff', s: 1.5 }); }
    else if (live && mode === 'play' && d.row === run.pos) list.push({ x, y, c: '#fff', a: blink, s: 1.8 });
    else if (i % 4 < 2) list.push({ x, y, c: '#d8d8d2', a: 0.9, s: 1.3 });
  });
}
function normalAt(i) {
  const a = route[Math.max(0, i - 4)], b = route[Math.min(route.length - 1, i + 4)];
  const ux = (b.dx - a.dx) * screen.cw / SX, uy = (b.dy - a.dy) * screen.ch / SY, n = Math.hypot(ux, uy) || 1;
  return [-uy / n, ux / n];
}
function ticks(list, label) {
  for (let r = 0; r <= N; r++) {
    const [x, y] = dotPx(route[first[r]]), [nx, ny] = normalAt(first[r]);
    for (const k of [-9, -7, -5, 5, 7, 9]) list.push({ x: x + nx * k, y: y + ny * k, c: INK, a: 0.8, s: 1.2 });
  }
  if (label === null || label === undefined || label >= N) return;
  const mid = Math.floor((first[label] + first[label + 1]) / 2), [x, y] = dotPx(route[mid]), [nx, ny] = normalAt(mid);
  const side = ny > 0 ? -1 : 1;
  screen.text(list, Math.round((x + nx * 22 * side) / screen.cw) - 1, (y + ny * 22 * side) / screen.ch - 0.5, String(label + 1), INK);
}
function ring(list, at, radius, c = INK, a = 1) {
  const [cx, cy] = dotPx(at), rx = radius * screen.cw / SX * 1.5, ry = radius * screen.ch / SY * 1.5;
  for (let k = 0; k < 28; k++) list.push({ x: cx + Math.cos(k / 28 * 6.283) * rx, y: cy + Math.sin(k / 28 * 6.283) * ry, c, a, s: 0.9 });
}
// A sand pit or storm is drawn only once its card has been seen.
function hazardMark(list, c, sh = shown) {
  const mid = route[Math.floor((first[c] + first[c + 1]) / 2)], [cx, cy] = dotPx(mid);
  if (deck[c].ground === 'sand' && sh[c]?.includes('ground'))
    for (let k = 0; k < 40; k++) { const t = k * 0.55, r = 1.3 * t; list.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r * 0.9, c: SAND, s: 0.9 }); }
  else if (deck[c].dust === 'storm' && sh[c]?.includes('dust'))
    for (let k = 0; k < 5; k++) for (let j = 0; j < 7; j++) list.push({ x: cx - 18 + j * 4 + k * 3, y: cy - 12 + k * 6 + j * 0.6, c: SAND, a: 1 - j / 9, s: 0.9 });
}
function marks(list, log, sh = shown) {
  for (const l of log) { if (l.stop === 'sample') ring(list, route[first[l.pos]], 4.5); hazardMark(list, l.pos, sh); }
}
function rover(list, i) { const [x, y] = dotPx(route[Math.min(route.length - 1, Math.max(0, Math.round(i)))]); list.push({ x, y, c: INK, s: 4.5 }); }
const cells = (n, of, on = '▮', off = '▯') => on.repeat(Math.max(0, n)) + off.repeat(Math.max(0, of - n));
const BELOW = MAP.row + MAP.rows;                         // first text row under the map
function title(list, right) {
  screen.text(list, 3, 0.3, 'DUNE//EATER', INK);
  if (right) screen.text(list, COLS - 3 - right.length, 0.3, right, INK);
}
function hud(list, battery = run.battery) {
  const right = `battery ${cells(battery, Math.max(rules.battery, battery))}   stops ${cells(run.stops, rules.stops, '◆', '◇')}   score ${run.score}`;
  title(list, right);
  if (battery <= 2) screen.text(list, COLS - 3 - right.length + 8, 0.3, cells(battery, battery), '#e07a5f');
}
function legendLine(list) {
  screen.text(list, 3, BELOW + 0.7, '━ driven  ╍ avoided  ┄ ahead  ● rover  ○ sample  ◍ sand  ≋ storm', DIM);
  const t = 'lines closer together = steep';
  screen.text(list, COLS - 3 - t.length, BELOW + 0.7, t, DIM);
}
function promptLine(list) {
  const row = BELOW + 2.2;
  let col = 3;
  const put = (t, c, hit, inv) => { screen.text(list, col, row, t, c, hit); if (inv) list[list.length - 1].inv = true; col += t.length; };
  if (mode === 'pick') {
    const done = shown[pickCol] ?? [];
    put(`square ${pickCol + 1} crossed`, INK); col += 4;
    put(`pick ${LOOK - done.length} of its cards to see `, DIM); col += 1;
    SUITS.forEach((s, i) => { put(` ${i + 1} ${s.name} `, done.includes(s.name) ? FAINT : INK, s.name, done.includes(s.name)); put(' '); });
    return;
  }
  if (mode !== 'play') return;
  put(`square ${run.pos + 1}/${N}`, INK); col += 4;
  put('stop ', DIM);
  const none = run.stops === 0;
  put(' · none ', none ? FAINT : INK, 'none', stop === null); put(' ');
  put(' R +2 battery ', none ? FAINT : INK, 'recharge', stop === 'recharge'); put(' ');
  put(' S +1 sample ', none ? FAINT : INK, 'sample', stop === 'sample');
  col += 4; put('then ', DIM);
  put(' G go ', INK, 'go'); put(' ');
  put(' A avoid −2 ', INK, 'avoid');
}
function frame() {
  screen.hits = [];
  const list = [];
  if (mode === 'intro') return introFrame(list);
  if (mode === 'replay' || mode === 'over') return replayFrame(list);
  drawMap(list);
  ticks(list, mode === 'play' ? run.pos : pickCol);
  marks(list, run.log);
  if (anim?.ring) ring(list, route[first[anim.from]], anim.ring);
  rover(list, anim ? anim.at : first[run.pos]);
  hud(list, anim?.battery ?? run.battery);
  if (anim?.label) screen.text(list, anim.label.col, anim.label.row, anim.label.t, INK);
  legendLine(list);
  promptLine(list);
  return list;
}

function introFrame(list) {
  const t = clock - introStart;
  drawMap(list, { contourAlpha: Math.min(1, t / 1.2), live: false });
  const k = Math.min(route.length, Math.floor(route.length * Math.max(0, t - 0.8) / 2.2));
  for (let i = 0; i < k; i++) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: INK, s: 1.2 }); }
  if (k) rover(list, k - 1);
  title(list, memory.runs.length ? `best ${best()}` : '');
  if (t > 3) {
    screen.text(list, 3, BELOW + 0.7, `${N} squares of the real Perseverance route. Go or avoid each one. Reach the end.`, DIM);
    screen.text(list, 3, BELOW + 1.7, `After a square, pick ${LOOK} of its 4 cards to see. The other ${4 - LOOK} flip after your next move.`, DIM);
    screen.text(list, 3, BELOW + 2.7, 'You have enough battery to drive straight through.', INK);
    if (Math.sin(clock * 4) > -0.3) { screen.text(list, COLS - 13, BELOW + 2.7, ' P  start ', INK, 'start'); list[list.length - 1].inv = true; }
  }
  return list;
}
const best = () => Math.max(0, ...solRuns().map(r => r.score));

// ---------- a turn ----------
const reveal = c => { if (c >= 0 && c < N) { shown[c] = [...ALL]; const m = seen(); m[c] = [...ALL]; } };
function commit(move) {
  if (mode !== 'play') return;
  const before = run, after = play(deck, run, stop, move);
  if (after === before) return;
  mode = 'anim';
  const from = before.pos, a0 = first[from], a1 = first[from + 1];
  const dead = after.end === 'sand' || after.end === 'storm', steps = [];
  if (stop === 'recharge') steps.push({ dur: 0.55, run: (u, s) => { s.battery = before.battery + (u > 0.5 ? 2 : 1); s.label = label(a0, '+2'); } });
  if (stop === 'sample') steps.push({ dur: 0.55, run: (u, s) => { s.ring = 1 + u * 3.5; s.label = label(a0, '+1'); } });
  const midBattery = before.battery + (stop === 'recharge' ? 2 : 0), len = (a1 - a0) * (dead ? 0.45 : 1);
  steps.push({ dur: Math.min(1.3, 0.35 + len / 220), run: (u, s) => { s.at = a0 + len * easeIO(u); s.battery = midBattery; } });
  // the past becomes fully known: the last square's hidden cards flip
  steps.push({ dur: 0.05, once: true, run: () => { run = after; stop = null; reveal(from - 1); if (after.end) reveal(from); save(); paintCards(); } });
  steps.push({ dur: dead ? 1.0 : after.end === 'battery' ? 0.7 : 0.45, run: (u, s) => { s.at = a0 + len; s.battery = after.battery; } });
  anim = { from, at: a0, battery: before.battery, steps, i: 0, t0: clock };
  run = { ...before, stops: after.stops, score: before.score };
  paintCards();
}
const easeIO = u => u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
function label(at, t) { const [x, y] = dotPx(route[at]); return { col: Math.round(x / screen.cw) + 2, row: Math.max(MAP.row, Math.round(y / screen.ch) - 2), t }; }
function stepAnim() {
  if (!anim) return;
  let step = anim.steps[anim.i];
  while (step && clock - anim.t0 >= step.dur / speed) { step.run(1, anim); anim.t0 += step.dur / speed; step = anim.steps[++anim.i]; }
  if (step) { delete anim.label; delete anim.ring; if (!step.once) step.run((clock - anim.t0) / (step.dur / speed), anim); return; }
  lastAt = anim.at; const from = anim.from; anim = null;
  if (run.end) return finishRun();
  pickCol = from; mode = 'pick';                        // the attention budget: what will you look at?
  paintCards();
  const k = queued; queued = null; if (k) input(k);
}
function look(suit) {
  if (mode !== 'pick' || shown[pickCol]?.includes(suit)) return;
  (shown[pickCol] ??= []).push(suit);
  const m = seen(); if (!(m[pickCol] ??= []).includes(suit)) m[pickCol].push(suit);
  save();
  if (shown[pickCol].length >= LOOK) { mode = 'play'; pickCol = null; }
  paintCards();
}

// ---------- end of a run ----------
function finishRun() {
  memory.runs.push({ sol, log: run.log, end: run.end, score: run.score, at: Date.now() });
  save(); paintCards();
  if (run.end === 'finish') return startReplay();
  const frozen = frame(), { width, height } = screen.canvas.getBoundingClientRect(), [rx, ry] = dotPx(route[Math.round(lastAt)]);
  effect = { f: { storm: () => fx.storm(frozen, width, height), battery: () => fx.battery(frozen, width, height), sand: () => fx.sand(frozen, width, height, rx, ry) }[run.end](), t0: clock };
  mode = 'dead';
}
function startReplay() { mode = 'replay'; replay = { t0: clock, run, shown: { ...shown } }; paintCards(); }
function replayFrame(list) {
  const r0 = replay.run, t = Math.max(0, clock - replay.t0 - 0.6) * speed, k = Math.min(r0.log.length, t / 0.5);
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: 0.7 }); }
  for (const old of solRuns().slice(-6, -1)) {             // earlier runs, faint
    const last = old.log[old.log.length - 1], a = first[last.pos], b = first[last.pos + 1];
    const end = old.end === 'finish' ? route.length : old.end === 'battery' ? b : a + Math.round((b - a) * 0.45);
    for (let i = 0; i < end; i += 2) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: DIM, a: 0.5 }); }
  }
  route.forEach((d, i) => { if (i % 4 < 2) { const [x, y] = dotPx(d); list.push({ x, y, c: DIM, a: 0.6, s: 1.2 }); } });
  let head = first[0];
  r0.log.forEach((l, j) => {
    if (j > k) return;
    const u = Math.min(1, k - j), a0 = first[l.pos], a1 = first[l.pos + 1];
    const deadHere = j === r0.log.length - 1 && (r0.end === 'sand' || r0.end === 'storm');
    const span = (a1 - a0) * (deadHere ? 0.45 : 1) * Math.max(0, (u - 0.3) / 0.7);
    for (let i = a0; i <= a0 + span; i++) { if (l.move === 'avoid' && i % 6 >= 3) continue; const [x, y] = dotPx(route[i]); list.push({ x, y, c: '#fff', s: 1.7 }); }
    head = a0 + span;
    if (l.stop === 'sample' && u > 0) ring(list, route[a0], 1 + 3.5 * Math.min(1, u / 0.3));
    if (u >= 1) hazardMark(list, l.pos, replay.shown);
  });
  rover(list, head);
  const over = k >= r0.log.length;
  if (over && r0.end !== 'finish') { const [x, y] = dotPx(route[Math.round(head)]); screen.text(list, Math.round(x / screen.cw) + 1, Math.round(y / screen.ch) - 1, `✕ ${r0.end}`, '#e07a5f'); }
  // the battery as a graph, under the map
  const base = BELOW + 0.4, H = 2.4, W = 46, pts = [rules.battery, ...r0.log.map(l => l.to)];
  screen.text(list, 3, base + 1.4, 'battery', DIM);
  for (let j = 0; j < Math.min(pts.length - 1, k); j++)
    for (let s = 0; s <= 10; s++) { const v = pts[j] + (pts[j + 1] - pts[j]) * (s / 10); list.push({ x: (12 + (j + s / 10) * W / N) * screen.cw, y: (base + H - Math.max(0, v) / 14 * H) * screen.ch, c: INK, s: 0.9 }); }
  for (let s = 0; s <= W; s++) list.push({ x: (12 + s) * screen.cw, y: (base + H) * screen.ch, c: FAINT, s: 0.7 });
  if (over) {
    const samples = r0.log.filter(l => l.stop === 'sample').length, rows = r0.score - samples - (r0.end === 'finish' ? rules.finishBonus : 0);
    title(list, `score ${r0.score}   squares ${rows} · samples ${samples}${r0.end === 'finish' ? ` · finish +${rules.finishBonus}` : ''}   best ${best()}`);
    if (Math.sin(clock * 4) > -0.3) { screen.text(list, COLS - 17, BELOW + 2.2, ' P  play again ', INK, 'again'); list[list.length - 1].inv = true; }
    if (solRuns().some(r => r.end === 'finish') && sol < sols.length - 1) screen.text(list, COLS - 42, BELOW + 2.2, ' N  new sol: new weather ', INK, 'nextsol');
    if (mode !== 'over') { mode = 'over'; paintCards(); }
  } else title(list);
  const h = screen.canvas.getBoundingClientRect().height, scan = h * (clock - replay.t0) / 0.7;
  return scan > h * 1.2 ? list : list.filter(d => d.y < scan).map(d => ({ ...d, a: (d.a ?? 1) * Math.min(1, (scan - d.y) / 80) }));
}

// ---------- loop & input ----------
function tick(ms) {
  clock = ms / 1000;
  stepAnim();
  if (anim) lastAt = anim.at;
  if (mode === 'dead') { const out = effect.f((clock - effect.t0) * speed); if (out) screen.draw(out); else { effect = null; startReplay(); } }
  else screen.draw(frame());
  paintPad();
  requestAnimationFrame(tick);
}
function newGame() { run = newRun(deck, rules); stop = null; shown = {}; pickCol = null; anim = null; mode = 'play'; paintCards(); }
function input(k) {
  if (mode === 'anim') { queued = k; return; }
  if ((mode === 'intro' || mode === 'over') && ['p', 'start', 'again'].includes(k)) return newGame();
  if (mode === 'over' && ['n', 'nextsol'].includes(k) && sol < sols.length - 1 && solRuns().some(r => r.end === 'finish')) { sol++; deck = sols[sol]; window.rover.deck = deck; return newGame(); }
  if (mode === 'pick') { const s = SUITS.find((x, i) => k === x.name || k === String(i + 1)); if (s) look(s.name); return; }
  if (mode !== 'play') return;
  if ((k === 'r' || k === 'recharge') && run.stops) stop = stop === 'recharge' ? null : 'recharge';
  else if ((k === 's' || k === 'sample') && run.stops) stop = stop === 'sample' ? null : 'sample';
  else if (k === '.' || k === 'none' || k === ' ') stop = null;
  else if (k === 'g' || k === 'go') commit('go');
  else if (k === 'a' || k === 'avoid') commit('avoid');
  paintCards();
}
addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey) input(e.key.toLowerCase()); });
screen.canvas.addEventListener('pointerdown', e => {
  const b = screen.canvas.getBoundingClientRect(), h = screen.hit(e.clientX - b.left, e.clientY - b.top);
  if (h) input(h); else if (mode === 'intro' || mode === 'over') input('p');
});
addEventListener('resize', () => { fit(); screen.resize(); paintCards(); });
const pad = document.getElementById('pad');
pad.addEventListener('click', e => { const k = e.target.dataset?.k; if (k) input(k); });
function paintPad() {
  pad.classList.toggle('over', mode === 'intro' || mode === 'over');
  for (const b of pad.querySelectorAll('button')) b.classList.toggle('on', b.dataset.k === (stop ?? 'none') && mode === 'play');
}
window.rover = { get state() { return { mode, run, stop, memory, sol, shown } }, input, deck };
paintCards();
requestAnimationFrame(ms => { introStart = ms / 1000; tick(ms); });
