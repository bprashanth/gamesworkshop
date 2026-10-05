import { newRun, play } from './engine.js';
import { Screen, COLS, MAP, SX, SY, INK, DIM, FAINT, SAND, contourDots, routeDots } from './screen.js';
import * as fx from './effects.js';

const [map, deckFile] = await Promise.all(['map.json', 'deck.json'].map(f => fetch(f).then(r => r.json())));
const sols = deckFile.sols, rules = deckFile.rules, N = sols[0].length;
let sol = 0, deck = sols[0];
const screen = new Screen(document.getElementById('screen'));
const contours = contourDots(map), route = routeDots(map);
const first = Array.from({ length: N + 1 }, (_, r) => r < N ? route.findIndex(d => d.row === r) : route.length - 1);

// ---------- memory: past runs and every card ever looked at ----------
const KEY = 'rover-run.claude.v1.1';   // own memory, separate from later versions
let memory = { runs: [], seen: {} };
try { memory = { ...memory, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
const seen = () => ((memory.looked ??= {})[sol] ??= {});          // row -> suits looked at, any run
const solRuns = () => memory.runs.filter(r => (r.sol ?? 0) === sol);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch {} };

// ---------- state ----------
let mode = 'intro', run = newRun(deck, rules), stop = null, clock = 0, anim = null, effect = null, replay = null;
let shown = {}, pickRow = null;                                  // this run: row -> the 2 suits you chose to look at
const LOOK = 2;
const params = new URLSearchParams(location.search);
const speed = Number(params.get('speed') || 1);
if (params.has('film')) { document.documentElement.classList.add('film'); screen.resize(); }

// ---------- cards ----------
const SUITS = [
  ['slope', r => r.slope, { flat: '▁▁▁', tilted: '▁▃▅', steep: '▂▅█' }],
  ['ground', r => r.ground, { firm: '▪', soft: '∴', sand: '◍' }],
  ['dust', r => r.dust, { clear: '○', haze: '◌', storm: '≋' }],
  ['battery', r => (r.ground === 'sand' || r.dust === 'storm') ? '–' : String(r.battery).replace('-', '−'), {}],
];
const cardsEl = document.getElementById('cards');
function buildCards() {
  cardsEl.innerHTML = '';
  for (const [suit] of SUITS) {
    const label = document.createElement('div');
    label.className = 'suit'; label.textContent = suit;
    cardsEl.append(label);
    for (let r = 0; r < N; r++) {
      const c = document.createElement('div');
      c.className = 'card'; c.dataset.row = r; c.dataset.suit = suit;
      c.addEventListener('click', () => { if (mode === 'pick' && r === pickRow) look(suit); });
      cardsEl.append(c);
    }
  }
}
function paintCards() {
  for (const el of cardsEl.querySelectorAll('.card')) {
    const r = Number(el.dataset.row), [, get, glyphs] = SUITS.find(s => s[0] === el.dataset.suit);
    const suit = el.dataset.suit, value = get(deck[r]), up = !!shown[r]?.includes(suit), ghost = !up && !!seen()[r]?.includes(suit);
    el.classList.toggle('pick', mode === 'pick' && r === pickRow && !up);
    el.classList.toggle('unseen', r < run.pos && r !== pickRow && !up && !ghost);   // passed, never looked at
    el.classList.toggle('up', up);
    el.classList.toggle('ghost', ghost);
    el.classList.toggle('next', mode === 'play' && r === run.pos);
    el.classList.toggle('hazard', (up || ghost) && (value === 'sand' || value === 'storm'));
    el.classList.toggle('warn', (up || ghost) && (value === 'soft' || value === 'haze'));
    el.innerHTML = up || ghost
      ? `<b>${glyphs[value] ?? value}</b><i>${glyphs[value] ? (value === 'sand' || value === 'storm' ? value.toUpperCase() : value) : ''}</i>`
      : `<span>${r + 1}</span>`;
  }
}

// ---------- drawing ----------
const dotPx = d => screen.px(d.dx, d.dy);
function drawMap(list, { contourAlpha = 1, routeDone = run.pos, live = true, runOverride } = {}) {
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: contourAlpha * 0.75 }); }
  const r0 = runOverride ?? run, moves = Object.fromEntries(r0.log.map(l => [l.pos, l.move]));
  const blink = 0.3 + 0.7 * Math.abs(Math.sin(clock * 3));
  route.forEach((d, i) => {
    const [x, y] = dotPx(d), move = moves[d.row];
    if (d.row < routeDone && move === 'go') list.push({ x, y, c: '#fff', s: 1.7 });
    else if (d.row < routeDone && move === 'avoid') { if (i % 6 < 3) list.push({ x, y, c: '#fff', s: 1.5 }); }
    else if (live && mode === 'play' && d.row === run.pos) list.push({ x, y, c: '#fff', a: blink, s: 1.8 });
    else if (i % 4 < 2) list.push({ x, y, c: '#d8d8d2', a: 0.9, s: 1.3 });
  });
}
// Row ticks across the route at each boundary, as on the printed sheet; the next row gets its number.
function normalAt(i) {
  const a = route[Math.max(0, i - 4)], b = route[Math.min(route.length - 1, i + 4)];
  const ux = (b.dx - a.dx) * screen.cw / SX, uy = (b.dy - a.dy) * screen.ch / SY, n = Math.hypot(ux, uy) || 1;
  return [-uy / n, ux / n];
}
function ticks(list, next) {
  for (let r = 0; r <= N; r++) {
    const [x, y] = dotPx(route[first[r]]), [nx, ny] = normalAt(first[r]);
    for (const k of [-9, -7, -5, 5, 7, 9]) list.push({ x: x + nx * k, y: y + ny * k, c: INK, a: 0.8, s: 1.2 });
  }
  if (next === undefined || next >= N) return;
  const mid = Math.floor((first[next] + first[next + 1]) / 2), [x, y] = dotPx(route[mid]), [nx, ny] = normalAt(mid);
  const side = ny > 0 ? -1 : 1;  // keep the label above the line
  screen.text(list, Math.round((x + nx * 22 * side) / screen.cw) - 1, (y + ny * 22 * side) / screen.ch - 0.5, String(next + 1), INK);
}
function ring(list, at, radius, c = INK, a = 1) {
  const [cx, cy] = screen.px(at.dx, at.dy);
  const rx = radius * screen.cw / SX * 1.5, ry = radius * screen.ch / SY * 1.5;
  for (let k = 0; k < 28; k++) list.push({ x: cx + Math.cos(k / 28 * 6.283) * rx, y: cy + Math.sin(k / 28 * 6.283) * ry, c, a, s: 0.9 });
}
// A sand pit or storm is drawn only if you looked at the card that shows it.
function hazardMark(list, row, a = 1, sh = shown) {
  const mid = route[Math.floor((first[row] + first[row + 1]) / 2)], [cx, cy] = dotPx(mid);
  if (deck[row].ground === 'sand' && sh[row]?.includes('ground')) {
    for (let k = 0; k < 40; k++) { const t = k * 0.55, r = 1.3 * t; list.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r * 0.9, c: SAND, a, s: 0.9 }); }
  } else if (deck[row].dust === 'storm' && sh[row]?.includes('dust')) {
    for (let k = 0; k < 5; k++) for (let j = 0; j < 7; j++) list.push({ x: cx - 18 + j * 4 + k * 3, y: cy - 12 + k * 6 + j * 0.6, c: SAND, a: a * (1 - j / 9), s: 0.9 });
  }
}
function marks(list, r0, a = 1) {
  r0.log.forEach(l => {
    if (l.stop === 'sample') ring(list, route[first[l.pos]], 4.5, INK, a);
    hazardMark(list, l.pos, a);
  });
}
function rover(list, i, c = INK) {
  const [x, y] = dotPx(route[Math.min(route.length - 1, Math.max(0, Math.round(i)))]);
  list.push({ x, y, c, s: 4.5 });
}
const cells = (n, of, on = '▮', off = '▯') => on.repeat(Math.max(0, n)) + off.repeat(Math.max(0, of - n));
function hud(list, battery = run.battery) {
  screen.text(list, 3, 1, 'JEZERO / PERSEVERANCE', INK);
  screen.text(list, 3, 2, `rover run · sol ${sol + 1}`, DIM);
  const bat = `battery ${cells(battery, Math.max(rules.battery, battery))}`;
  const right = `${bat}   stops ${cells(run.stops, rules.stops, '◆', '◇')}   score ${run.score}`;
  screen.text(list, COLS - 3 - right.length, 1, right, INK);
  if (battery <= 2) screen.text(list, COLS - 3 - right.length + 8, 1, cells(battery, battery), '#e07a5f');
}
function prompt(list) {
  const row = MAP.row + MAP.rows + 2;
  let col = 3;
  const put = (t, c, hit, inv) => { screen.text(list, col, row, t, c, hit); if (inv) list[list.length - 1].inv = true; col += t.length; };
  put(`row ${run.pos + 1}/${N}`, INK); col += 5;
  put('stop ', DIM);
  const none = run.stops === 0;
  put(' · none ', none ? FAINT : INK, 'none', stop === null);
  put(' ');
  put(' R +2 battery ', none ? FAINT : INK, 'recharge', stop === 'recharge');
  put(' ');
  put(' S +1 sample ', none ? FAINT : INK, 'sample', stop === 'sample');
  col += 5;
  put('then ', DIM);
  put(' G go ', INK, 'go'); put(' ');
  put(' A avoid −2 ', INK, 'avoid');
}
function pickPrompt(list) {
  const row = MAP.row + MAP.rows + 2, done = shown[pickRow] ?? [];
  let col = 3;
  const put = (t, c, hit, inv) => { screen.text(list, col, row, t, c, hit); if (inv) list[list.length - 1].inv = true; col += t.length; };
  put(`row ${pickRow + 1} done`, INK); col += 4;
  put(`look at ${LOOK - done.length} more of its 4 cards `, DIM); col += 1;
  SUITS.forEach(([suit], i) => { put(` ${i + 1} ${suit} `, done.includes(suit) ? FAINT : INK, suit, done.includes(suit)); put(' '); });
}
function footer(list, t = 'real terrain + route · simulated hazards') {
  screen.text(list, COLS - 3 - t.length, MAP.row + MAP.rows + 0.6, t, FAINT);
}
function frame() {
  screen.hits = [];
  const list = [];
  if (mode === 'intro') return introFrame(list);
  if (mode === 'replay' || mode === 'over') return replayFrame(list);
  drawMap(list);
  ticks(list, mode === 'play' ? run.pos : mode === 'pick' ? pickRow : undefined);
  marks(list, run);
  if (anim?.ring) ring(list, route[first[anim.from]], anim.ring, INK);
  rover(list, anim ? anim.at : first[run.pos]);
  hud(list, anim?.battery ?? run.battery);
  if (anim?.label) screen.text(list, anim.label.col, anim.label.row, anim.label.t, INK);
  if (mode === 'play') prompt(list);
  if (mode === 'pick') pickPrompt(list);
  footer(list);
  return list;
}

// ---------- intro ----------
function introFrame(list) {
  const t = clock - introStart;
  drawMap(list, { contourAlpha: Math.min(1, t / 1.2), routeDone: 0, live: false });
  const k = Math.min(route.length, Math.floor(route.length * Math.max(0, t - 0.8) / 2.2));
  for (let i = 0; i < k; i++) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: INK, s: 1.2 }); }
  if (k) rover(list, k - 1);
  if (t > 3) {
    const base = MAP.row + MAP.rows + 1;
    screen.text(list, 3, 1, 'ROVER RUN', INK);
    screen.text(list, 3, 2, `sol ${sol + 1}`, DIM);
    screen.text(list, 3, base - 1, `${N} rows of the real Perseverance route. Reach the end of row ${N}.`, DIM);
    screen.text(list, 3, base, `Each row: maybe stop, then Go or Avoid. Then look at ${LOOK} of that row's 4 cards.`, DIM);
    screen.text(list, 3, base + 1, 'You have enough battery to drive straight through.', INK);
    const blink = Math.sin(clock * 4) > -0.3;
    if (blink) screen.text(list, COLS - 13, base + 1, ' P  start ', INK, 'start'), list[list.length - 1].inv = true;
    if (memory.runs.length) screen.text(list, COLS - 3 - `best ${best()}`.length, 1, `best ${best()}`, DIM);
  }
  return list;
}
let introStart = 0;
const best = () => Math.max(0, ...solRuns().map(r => r.score));

// ---------- a turn ----------
function commit(move) {
  if (mode !== 'play') return;
  const before = run, after = play(deck, run, stop, move);
  if (after === before) return;
  mode = 'anim';
  const from = before.pos, a0 = first[from], a1 = first[from + 1];
  const dead = after.end === 'sand' || after.end === 'storm';
  const steps = [];
  if (stop === 'recharge') steps.push({ dur: 0.55, run: (u, s) => { s.battery = before.battery + (u > 0.5 ? 2 : 1); s.label = label(a0, '+2'); } });
  if (stop === 'sample') steps.push({ dur: 0.55, run: (u, s) => { s.ring = 1 + u * 3.5; s.label = label(a0, '+1'); } });
  const midBattery = before.battery + (stop === 'recharge' ? 2 : 0);
  const len = (a1 - a0) * (dead ? 0.45 : 1);
  steps.push({ dur: Math.min(1.3, 0.35 + len / 220), run: (u, s) => { s.at = a0 + len * easeIO(u); s.battery = midBattery; s.move = move; } });
  steps.push({ dur: 0.05, run: () => { run = after; stop = null; pickRow = from; paintCards(); } });
  steps.push({ dur: dead ? 0.9 : after.end === 'battery' ? 0.6 : 0.25, run: (u, s) => { s.at = a0 + len; s.battery = after.battery; } });
  anim = { from, at: a0, battery: before.battery, steps, i: 0, t0: clock, dead, move };
  run = { ...before, stops: after.stops, score: before.score };
}
const easeIO = u => u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
function label(at, t) {
  const [x, y] = dotPx(route[at]);
  return { col: Math.round(x / screen.cw) + 2, row: Math.max(MAP.row, Math.round(y / screen.ch) - 2), t };
}
function stepAnim() {
  if (!anim) return;
  let step = anim.steps[anim.i];
  while (step && clock - anim.t0 >= step.dur / speed) { step.run(1, anim); anim.t0 += step.dur / speed; step = anim.steps[++anim.i]; }
  if (step) { delete anim.label; delete anim.ring; step.run((clock - anim.t0) / (step.dur / speed), anim); return; }
  anim = null;
  if (run.end) return finishRun();
  mode = 'pick';                                         // the attention budget: choose what to look at
  paintCards();
}
function look(suit) {
  if (mode !== 'pick' || shown[pickRow]?.includes(suit)) return;
  (shown[pickRow] ??= []).push(suit);
  const mem = seen(); if (!(mem[pickRow] ??= []).includes(suit)) mem[pickRow].push(suit);
  save();
  if (shown[pickRow].length >= LOOK) { mode = 'play'; pickRow = null; }
  paintCards();
}

// ---------- end of a run ----------
function finishRun() {
  const last = run.log[run.log.length - 1].pos, fatal = { sand: 'ground', storm: 'dust' }[run.end];
  if (fatal && !shown[last]?.includes(fatal)) (shown[last] ??= []).push(fatal);   // you see what killed you
  pickRow = null; paintCards();
  memory.runs.push({ sol, log: run.log, end: run.end, score: run.score, shown, at: Date.now() });
  save();
  const frozen = frame();
  const { width, height } = screen.canvas.getBoundingClientRect();
  if (run.end === 'finish') return startReplay();
  const [rx, ry] = dotPx(route[Math.round(lastAt)]);
  const make = { storm: () => fx.storm(frozen, width, height), battery: () => fx.battery(frozen, width, height), sand: () => fx.sand(frozen, width, height, rx, ry) }[run.end];
  effect = { f: make(), t0: clock };
  mode = 'dead';
}
let lastAt = 0;
function startReplay() {
  mode = 'replay';
  replay = { t0: clock, run, n: solRuns().length, shown: { ...shown } };
  paintCards();
}
const ROWDUR = 0.5;
function replayFrame(list) {
  const r0 = replay.run, t = Math.max(0, clock - replay.t0 - 0.6) * speed;
  const k = Math.min(r0.log.length, t / ROWDUR);              // rows replayed so far (fractional)
  const done = Math.floor(k), cur = r0.log[Math.min(done, r0.log.length - 1)];
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: 0.7 }); }
  // previous runs: faint traces
  for (const old of solRuns().slice(-6, -1)) {
    const end = old.end === 'finish' ? route.length : first[old.log[old.log.length - 1].pos + (old.end === 'battery' || old.end === 'time' ? 1 : 0)] + (old.end === 'sand' || old.end === 'storm' ? Math.round((first[old.log[old.log.length - 1].pos + 1] - first[old.log[old.log.length - 1].pos]) * 0.45) : 0);
    for (let i = 0; i < end; i += 2) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: DIM, a: 0.5 }); }
  }
  route.forEach((d, i) => { if (i % 4 < 2) { const [x, y] = dotPx(d); list.push({ x, y, c: DIM, a: 0.6, s: 1.2 }); } });
  // this run, drawn on as in the film
  const partial = { ...r0, log: r0.log.slice(0, done) };
  let headAt = first[0];
  r0.log.forEach((l, j) => {
    if (j > k) return;
    const u = Math.min(1, k - j), a0 = first[l.pos], a1 = first[l.pos + 1];
    const deadHere = j === r0.log.length - 1 && (r0.end === 'sand' || r0.end === 'storm');
    const span = (a1 - a0) * (deadHere ? 0.45 : 1) * Math.max(0, (u - 0.3) / 0.7);
    for (let i = a0; i <= a0 + span; i++) { if (l.move === 'avoid' && i % 6 >= 3) continue; const [x, y] = dotPx(route[i]); list.push({ x, y, c: '#fff', s: 1.7 }); }
    headAt = a0 + span;
    if (l.stop === 'sample' && u > 0) ring(list, route[a0], 1 + 3.5 * Math.min(1, u / 0.3));
    if (l.stop === 'recharge' && u > 0) { const [x, y] = dotPx(route[a0]); list.push({ x: x - 6, y, c: INK, s: 0.9 }, { x: x + 6, y, c: INK, s: 0.9 }, { x, y: y - 6, c: INK, s: 0.9 }, { x, y: y + 6, c: INK, s: 0.9 }); }
    if (u >= 1) hazardMark(list, l.pos, 1, replay.shown);
  });
  rover(list, headAt);
  const over = k >= r0.log.length;
  if (over && r0.end !== 'finish') {
    const [x, y] = dotPx(route[Math.round(headAt)]);
    screen.text(list, Math.round(x / screen.cw) + 1, Math.round(y / screen.ch) - 1, `✕ ${r0.end}`, '#e07a5f');
  }
  // top: run number and the reading at the replay head (like the film's readings)
  screen.text(list, 3, 1, `SOL ${sol + 1} · RUN ${replay.n}  replay`, INK);
  if (cur) {
    const row = deck[cur.pos], sh = replay.shown[cur.pos] ?? [], v = k => sh.includes(k) ? (['sand', 'storm'].includes(row[k]) ? row[k].toUpperCase() : row[k]) : '?';
    screen.text(list, 3, 2, `row ${cur.pos + 1}  slope ${v('slope')} · ground ${v('ground')} · dust ${v('dust')}`, DIM);
  }
  // battery curve along the bottom
  const base = MAP.row + MAP.rows + 1.9, H = 2.2, W = 40;
  const pts = [rules.battery, ...r0.log.map(l => l.to)];
  screen.text(list, 3, base - 0.9, 'battery', DIM);
  for (let j = 0; j < Math.min(pts.length - 1, k); j++) {
    for (let s = 0; s <= 10; s++) {
      const u = j + s / 10, v = pts[j] + (pts[j + 1] - pts[j]) * (s / 10);
      list.push({ x: (12 + u * W / N) * screen.cw, y: (base + H - Math.max(0, v) / 14 * H) * screen.ch, c: INK, s: 0.9 });
    }
  }
  for (let s = 0; s <= W; s += 1) list.push({ x: (12 + s) * screen.cw, y: (base + H) * screen.ch, c: FAINT, s: 0.7 });
  if (over) {
    const samples = r0.log.filter(l => l.stop === 'sample').length, rows = r0.score - samples - (r0.end === 'finish' ? rules.finishBonus : 0);
    const s = `score ${r0.score}   rows ${rows} · samples ${samples}${r0.end === 'finish' ? ` · finish +${rules.finishBonus}` : ''}   best ${best()}`;
    screen.text(list, COLS - 3 - s.length, 1, s, INK);
    if (Math.sin(clock * 4) > -0.3) { screen.text(list, COLS - 17, base + 1, ' P  play again ', INK, 'again'); list[list.length - 1].inv = true; }
    if (solRuns().some(r => r.end === 'finish') && sol < sols.length - 1) {
      const t = ' N  new sol: same route, new weather ';
      screen.text(list, COLS - 3 - t.length, base + 2.2, t, INK, 'nextsol');
    }
    mode = 'over';
  }
  footer(list);
  const h = screen.canvas.getBoundingClientRect().height, scan = h * (clock - replay.t0) / 0.7;
  return scan > h * 1.2 ? list : list.filter(d => d.y < scan).map(d => ({ ...d, a: (d.a ?? 1) * Math.min(1, (scan - d.y) / 80) }));
}

// ---------- loop & input ----------
function tick(ms) {
  clock = ms / 1000;
  stepAnim();
  if (anim) lastAt = anim.at;
  if (mode === 'dead') {
    const out = effect.f((clock - effect.t0) * speed);
    if (out) screen.draw(out); else { effect = null; startReplay(); }
  } else screen.draw(frame());
  paintPad();
  requestAnimationFrame(tick);
}
function newGame() {
  run = newRun(deck, rules); stop = null; shown = {}; pickRow = null; anim = null; mode = 'play';
  paintCards();
}
function input(k) {
  if ((mode === 'intro' || mode === 'over') && (k === 'p' || k === 'start' || k === 'again')) return newGame();
  if (mode === 'over' && (k === 'n' || k === 'nextsol') && sol < sols.length - 1 && solRuns().some(r => r.end === 'finish')) {
    sol++; deck = sols[sol]; window.rover.deck = deck; return newGame();
  }
  if (mode === 'pick') { const suit = SUITS.find(([s], i) => k === s || k === String(i + 1))?.[0]; if (suit) look(suit); return; }
  if (mode !== 'play') return;
  if ((k === 'r' || k === 'recharge') && run.stops) stop = stop === 'recharge' ? null : 'recharge';
  else if ((k === 's' || k === 'sample') && run.stops) stop = stop === 'sample' ? null : 'sample';
  else if (k === '.' || k === 'none' || k === ' ') stop = null;
  else if (k === 'g' || k === 'go') commit('go');
  else if (k === 'a' || k === 'avoid') commit('avoid');
}
addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey) input(e.key.toLowerCase()); });
screen.canvas.addEventListener('pointerdown', e => {
  const b = screen.canvas.getBoundingClientRect(), h = screen.hit(e.clientX - b.left, e.clientY - b.top);
  if (h) input(h); else if (mode === 'intro' || mode === 'over') input('p');
});
addEventListener('resize', () => screen.resize());
const pad = document.getElementById('pad');
pad.addEventListener('click', e => { const k = e.target.dataset?.k; if (k) input(k); });
function paintPad() {
  pad.classList.toggle('over', mode === 'intro' || mode === 'over');
  for (const b of pad.querySelectorAll('button')) b.classList.toggle('on', b.dataset.k === (stop ?? 'none') && mode === 'play');
}
buildCards(); paintCards();
requestAnimationFrame(ms => { introStart = ms / 1000; tick(ms); });
window.rover = { get state() { return { mode, run, stop, memory, sol, shown } }, input, deck };
