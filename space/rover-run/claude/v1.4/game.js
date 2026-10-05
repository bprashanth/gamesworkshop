// Rover Run v1.4 (MARS). Each turn: go, avoid or recharge. Decide on partial information,
// then the rest of the last square's cards flip, then pick 2 cards of the square you
// just crossed. Three stacked panels: the map, a graph of everything seen, the cards.
import { newRun, act } from './engine.js';
import { Screen, COLS, MAP, SX, SY, INK, DIM, FAINT, SAND, contourDots, routeDots } from './screen.js';
import * as fx from './effects.js';
import { SYMBOLS } from './symbols.js';

const [map, deckFile] = await Promise.all(['map.json', 'deck.json'].map(f => fetch(f).then(r => r.json())));
const sols = deckFile.sols, rules = deckFile.rules, N = sols[0].length;
let sol = 0, deck = sols[0];
const params = new URLSearchParams(location.search), speed = Number(params.get('speed') || 1);
if (params.has('film')) document.documentElement.classList.add('film');

// ---------- one page: size the screen so map + cards fit the window ----------
const main = document.querySelector('main');
function fit() {
  const below = [...document.querySelectorAll('.panel, .bar')].reduce((h, el) => h + el.getBoundingClientRect().height + 8, 0) || 320;
  const w = Math.min(1280, innerWidth - 24, (innerHeight - below - 28) / ROWS_RATIO);
  main.style.maxWidth = `${Math.max(320, Math.floor(w))}px`;
}
const ROWS_RATIO = 26 * 1.9 / COLS;
fit();
const screen = new Screen(document.getElementById('screen'));
const contours = contourDots(map), route = routeDots(map);
const first = Array.from({ length: N + 1 }, (_, r) => r < N ? route.findIndex(d => d.row === r) : route.length - 1);

// ---------- memory: past runs and every card ever looked at ----------
const KEY = 'rover-run.claude.v1.4.frozen';
let memory = { runs: [], looked: {} };
try { memory = { ...memory, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
const seen = () => (memory.looked[sol] ??= {});                    // square -> suits seen, any run
const solRuns = () => memory.runs.filter(r => (r.sol ?? 0) === sol);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch {} };

// ---------- state ----------
const LOOK = 2;
let mode = 'intro', run = newRun(deck, rules), clock = 0, anim = null, effect = null, replay = null;
let shown = {}, pickCol = null, lastAt = 0, introStart = 0, queued = null;

// ---------- suits: three levels each ----------
const SUITS = [
  { name: 'slope', get: r => r.slope, levels: ['flat', 'tilted', 'steep'], dash: '7 3' },
  { name: 'ground', get: r => r.ground, levels: ['firm', 'soft', 'sand'], dash: '1.5 3' },
  { name: 'dust', get: r => r.dust, levels: ['clear', 'haze', 'storm'], dash: '5 2 1.5 2' },
  { name: 'battery', get: r => (r.ground === 'sand' || r.dust === 'storm') ? '–' : r.battery < 0 ? '−1' : '0', levels: ['0', '−1', '–'] },
];
const ALL = SUITS.map(s => s.name);
const deadly = (suit, v) => (suit === 'ground' && v === 'sand') || (suit === 'dust' && v === 'storm');
const warning = (suit, v) => (suit === 'ground' && v === 'soft') || (suit === 'dust' && v === 'haze');
const word = v => (v === 'sand' || v === 'storm') ? v.toUpperCase() : v === 'tilted' ? 'slope' : v;

// ---------- cards panel: bordered cards, symbol + word ----------
const cardsEl = document.getElementById('cards');
function buildCards() {
  cardsEl.innerHTML = '<div></div>' + Array.from({ length: N }, (_, c) => `<div class="colnum" data-col="${c}">${c + 1}</div>`).join('');
  for (const s of SUITS) {
    cardsEl.insertAdjacentHTML('beforeend', `<div class="suit">${s.name}</div>`);
    for (let c = 0; c < N; c++) cardsEl.insertAdjacentHTML('beforeend', `<div class="card" data-col="${c}" data-suit="${s.name}"></div>`);
  }
}
function paintCards() {
  const deciding = mode === 'play' ? run.pos : null;
  for (const el of cardsEl.querySelectorAll('.colnum')) el.classList.toggle('on', +el.dataset.col === deciding || +el.dataset.col === pickCol);
  for (const el of cardsEl.querySelectorAll('.card')) {
    const c = +el.dataset.col, suit = el.dataset.suit, s = SUITS.find(x => x.name === suit), v = s.get(deck[c]);
    const up = !!shown[c]?.includes(suit), ghost = !up && !!seen()[c]?.includes(suit), pick = mode === 'pick' && c === pickCol && !up;
    el.className = 'card' + (up ? ' up' : ghost ? ' ghost' : pick ? ' pick' : ' back')
      + (c === deciding ? ' next' : '') + ((up || ghost) && deadly(suit, v) ? ' hazard' : '') + ((up || ghost) && warning(suit, v) ? ' warn' : '');
    el.innerHTML = up || ghost ? `${SYMBOLS[suit][v]}<i>${word(v)}</i>` : pick ? `<span>${ALL.indexOf(suit) + 1}</span>` : `<span>${c + 1}</span>`;
  }
  paintGraph();
}
cardsEl.addEventListener('click', e => { const el = e.target.closest('.card'); if (el && mode === 'pick' && +el.dataset.col === pickCol) look(el.dataset.suit); });

// ---------- graph panel: battery and every seen card as lines, one shared x with the cards ----------
const graphEl = document.getElementById('graph');
function paintGraph() {
  const W = graphEl.clientWidth || 600, H = graphEl.clientHeight || 90, box = cardsEl.getBoundingClientRect();
  const cols = [...cardsEl.querySelectorAll('.colnum')].map(el => { const r = el.getBoundingClientRect(); return r.left - box.left + r.width / 2; });
  if (!cols.length) return;
  const half = (cols[1] - cols[0]) / 2, top = 6, bottom = H - 6, maxB = Math.max(10, ...run.log.map(l => l.to), run.battery);
  const by = b => bottom - (Math.max(0, b) / maxB) * (bottom - top), ly = (lv, off) => bottom - 4 - lv * (bottom - top - 8) / 2 + off;
  let svg = '';
  for (const lv of [0, 1, 2]) svg += `<line x1="${cols[0] - half}" x2="${W}" y1="${ly(lv, 0)}" y2="${ly(lv, 0)}" class="guide"/>`;
  svg += ['low', 'mid', 'high'].map((t, lv) => `<text x="0" y="${ly(lv, 0) + 3}" class="axis">${t}</text>`).join('');
  // battery: always known (it is the meter), from the start of the run to now
  const pts = [[cols[0] - half, by(rules.battery)], ...run.log.map(l => [l.action === 'recharge' ? (l.pos ? cols[l.pos - 1] : cols[0] - half) : cols[l.pos], by(l.to)])];
  if (pts.length > 1) svg += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" class="bat"/>`;
  svg += `<circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="2.4" class="dot"/>`;
  // slope, ground, dust: only cards you have seen this run; gaps where you didn't look
  SUITS.slice(0, 3).forEach((s, k) => {
    const off = (k - 1) * 3;
    let prev = null;
    for (let c = 0; c < N; c++) {
      if (!shown[c]?.includes(s.name)) { prev = null; continue; }
      const v = s.get(deck[c]), x = cols[c], y = ly(s.levels.indexOf(v), off);
      if (prev) svg += `<line x1="${prev[0]}" y1="${prev[1]}" x2="${x}" y2="${y}" stroke-dasharray="${s.dash}" class="trace"/>`;
      svg += deadly(s.name, v) ? `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" class="dot"/>` : `<circle cx="${x}" cy="${y}" r="1.8" class="dot"/>`;
      prev = [x, y];
    }
  });
  graphEl.innerHTML = `<svg width="${W}" height="${H}">${svg}</svg>`;
  document.getElementById('batnow').textContent = run.battery;
  document.getElementById('turnsnow').textContent = run.turns - run.turn;
}

// ---------- drawing the screen ----------
const dotPx = d => screen.px(d.dx, d.dy);
function drawMap(list, { contourAlpha = 1, live = true } = {}) {
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: contourAlpha * 0.75 }); }
  const moves = Object.fromEntries(run.log.filter(l => l.action !== 'recharge').map(l => [l.pos, l.action]));
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
  for (const l of log) {
    if (l.action === 'recharge') { const [x, y] = dotPx(route[first[l.pos]]); list.push({ x: x - 7, y, c: INK, s: 0.9 }, { x: x + 7, y, c: INK, s: 0.9 }, { x, y: y - 7, c: INK, s: 0.9 }, { x, y: y + 7, c: INK, s: 0.9 }); }
    else hazardMark(list, l.pos, sh);
  }
}
function rover(list, i) { const [x, y] = dotPx(route[Math.min(route.length - 1, Math.max(0, Math.round(i)))]); list.push({ x, y, c: INK, s: 4.5 }); }
const BELOW = MAP.row + MAP.rows;                         // the text row under the map
function frame() {
  screen.hits = [];
  const list = [];
  if (mode === 'intro') return introFrame(list);
  if (mode === 'replay' || mode === 'over') return replayFrame(list);
  drawMap(list);
  ticks(list, mode === 'play' ? run.pos : pickCol);
  marks(list, run.log);
  rover(list, anim ? anim.at : first[run.pos]);
  return list;
}

function introFrame(list) {
  const t = clock - introStart;
  drawMap(list, { contourAlpha: Math.min(1, t / 1.2), live: false });
  const k = Math.min(route.length, Math.floor(route.length * Math.max(0, t - 0.8) / 2.2));
  for (let i = 0; i < k; i++) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: INK, s: 1.2 }); }
  if (k) rover(list, k - 1);
  return list;
}
const best = () => Math.max(0, ...solRuns().map(r => r.score));

// ---------- a turn ----------
const reveal = c => { if (c >= 0 && c < N) { shown[c] = [...ALL]; const m = seen(); m[c] = [...ALL]; } };
function commit(action) {
  if (mode !== 'play') return;
  const before = run, after = act(deck, run, action);
  if (after === before) return;
  mode = 'anim';
  const from = before.pos, a0 = first[from], a1 = first[from + 1], steps = [];
  if (action === 'recharge') {
    steps.push({ dur: 0.6, run: (u, s) => { s.at = a0; } });
    steps.push({ dur: 0.05, once: true, run: () => { run = after; save(); paintCards(); } });
    if (after.end) steps.push({ dur: 0.6, run: (u, s) => { s.at = a0; } });
    anim = { from, at: a0, steps, i: 0, t0: clock, still: true };
    return paintCards();
  }
  const dead = after.end === 'sand' || after.end === 'storm', len = (a1 - a0) * (dead ? 0.45 : 1);
  steps.push({ dur: Math.min(1.3, 0.35 + len / 220), run: (u, s) => { s.at = a0 + len * easeIO(u); } });
  // the past becomes fully known: the last square's hidden cards flip
  steps.push({ dur: 0.05, once: true, run: () => { run = after; reveal(from - 1); if (after.end) reveal(from); save(); paintCards(); } });
  steps.push({ dur: dead ? 1.0 : after.end ? 0.7 : 0.45, run: (u, s) => { s.at = a0 + len; } });
  anim = { from, at: a0, steps, i: 0, t0: clock };
  paintCards();
}
const easeIO = u => u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
function stepAnim() {
  if (!anim) return;
  let step = anim.steps[anim.i];
  while (step && clock - anim.t0 >= step.dur / speed) { step.run(1, anim); anim.t0 += step.dur / speed; step = anim.steps[++anim.i]; }
  if (step) { if (!step.once) step.run((clock - anim.t0) / (step.dur / speed), anim); return; }
  lastAt = anim.at; const { from, still } = anim; anim = null;
  if (run.end) return finishRun();
  if (still) mode = 'play';                             // a recharge doesn't cross a square
  else { pickCol = from; mode = 'pick'; }                // the attention budget: what will you look at?
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
  const end = { storm: () => fx.storm(frozen, width, height), sand: () => fx.sand(frozen, width, height, rx, ry) }[run.end] ?? (() => fx.battery(frozen, width, height));
  effect = { f: end(), t0: clock };
  mode = 'dead';
}
function startReplay() { mode = 'replay'; replay = { t0: clock, run, shown: { ...shown } }; paintCards(); }
function replayFrame(list) {
  const moves = replay.run.log.filter(l => l.action !== 'recharge'), r0 = replay.run;
  const t = Math.max(0, clock - replay.t0 - 0.6) * speed, k = Math.min(moves.length, t / 0.5);
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: 0.7 }); }
  for (const old of solRuns().slice(-6, -1)) {             // earlier runs, faint
    const mv = old.log.filter(l => l.action !== 'recharge'), last = mv[mv.length - 1];
    if (!last) continue;
    const a = first[last.pos], b = first[last.pos + 1];
    const end = old.end === 'finish' ? route.length : (old.end === 'sand' || old.end === 'storm') ? a + Math.round((b - a) * 0.45) : b;
    for (let i = 0; i < end; i += 2) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: DIM, a: 0.5 }); }
  }
  route.forEach((d, i) => { if (i % 4 < 2) { const [x, y] = dotPx(d); list.push({ x, y, c: DIM, a: 0.6, s: 1.2 }); } });
  let head = first[0];
  moves.forEach((l, j) => {
    if (j > k) return;
    const u = Math.min(1, k - j), a0 = first[l.pos], a1 = first[l.pos + 1];
    const deadHere = j === moves.length - 1 && (r0.end === 'sand' || r0.end === 'storm');
    const span = (a1 - a0) * (deadHere ? 0.45 : 1) * Math.max(0, (u - 0.3) / 0.7);
    for (let i = a0; i <= a0 + span; i++) { if (l.action === 'avoid' && i % 6 >= 3) continue; const [x, y] = dotPx(route[i]); list.push({ x, y, c: '#fff', s: 1.7 }); }
    head = a0 + span;
    if (u >= 1) hazardMark(list, l.pos, replay.shown);
  });
  rover(list, head);
  const over = k >= moves.length;
  if (over && r0.end !== 'finish') {                     // where it broke: a cross of dots
    const [x, y] = dotPx(route[Math.round(head)]);
    for (let d = -8; d <= 8; d += 2) list.push({ x: x + d, y: y + d, c: '#e07a5f', s: 1.1 }, { x: x + d, y: y - d, c: '#e07a5f', s: 1.1 });
  }
  if (over && mode !== 'over') {
    const squares = r0.score - (r0.end === 'finish' ? rules.finishBonus : 0);
    const why = { finish: `+${rules.finishBonus} for finishing`, sand: 'sand', storm: 'storm', battery: 'battery ran out', time: 'out of turns' }[r0.end];
    document.getElementById('status').textContent = `score ${r0.score} · ${squares} squares · ${why} · best ${best()}`;
    mode = 'over'; paintCards();
  }
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
  paintControls();
  requestAnimationFrame(tick);
}
function newGame() { run = newRun(deck, rules); shown = {}; pickCol = null; anim = null; mode = 'play'; document.getElementById('status').textContent = ''; paintCards(); }
const canNewSol = () => sol < sols.length - 1 && solRuns().some(r => r.end === 'finish');
function input(k) {
  if (mode === 'anim') { queued = k; return; }
  if ((mode === 'intro' || mode === 'over') && ['p', 'start', 'again', 'enter'].includes(k)) return newGame();
  if (mode === 'over' && ['n', 'nextsol'].includes(k) && canNewSol()) { sol++; deck = sols[sol]; window.rover.deck = deck; return newGame(); }
  if (mode === 'pick') { const s = SUITS.find((x, i) => k === x.name || k === String(i + 1)); if (s) look(s.name); return; }
  if (mode !== 'play') return;
  const action = { g: 'go', go: 'go', a: 'avoid', avoid: 'avoid', r: 'recharge', recharge: 'recharge' }[k];
  if (action) commit(action);
}
addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey) input(e.key.toLowerCase()); });
screen.canvas.addEventListener('pointerdown', () => { if (mode === 'intro' || mode === 'over') input('p'); });
addEventListener('resize', () => { fit(); screen.resize(); paintCards(); });

// ---------- controls: in the bar above the map, so it plays on a phone too ----------
const controls = document.getElementById('controls');
controls.addEventListener('click', e => { const k = e.target.closest('button')?.dataset.k; if (k) input(k); });
let shownControls = '';
function paintControls() {
  const view = mode === 'intro' ? 'start' : mode === 'over' ? 'over' + canNewSol() : mode === 'play' ? 'play' : mode === 'pick' ? 'wait' : shownControls || 'wait';
  if (view === shownControls) return;
  shownControls = view;
  const b = (k, key, rest, off) => `<button data-k="${k}"${off ? ' disabled' : ''}><u>${key}</u>${rest}</button>`;
  controls.innerHTML = view === 'start' ? b('start', 'P', 'lay')
    : view.startsWith('over') ? b('again', 'P', 'lay again') + (canNewSol() ? b('nextsol', 'N', 'ew sol') : '')
    : b('go', 'G', 'o', view !== 'play') + b('avoid', 'A', 'void', view !== 'play') + b('recharge', 'R', 'echarge', view !== 'play');
}

// ---------- the card key, drawn from the same symbols as the cards ----------
document.getElementById('key').innerHTML = '<tr><th></th><th>low</th><th>mid</th><th>high</th></tr>' + SUITS.map(s =>
  `<tr><td>${s.name}</td>${s.levels.map(v => `<td class="${deadly(s.name, v) ? 'haz' : ''}">${SYMBOLS[s.name][v]}</td>`).join('')}</tr>`).join('');

window.rover = { get state() { return { mode, run, memory, sol, shown } }, input, deck };
buildCards(); paintCards(); fit(); screen.resize();
requestAnimationFrame(ms => { introStart = ms / 1000; tick(ms); });
