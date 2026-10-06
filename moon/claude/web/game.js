// Moon Run: the sealed 14-square board. Forked from Rover Run v1.11's game.js; the look, the panels
// and the controls are Rover's, the vocabulary and rules are rewritten for the Moon.
// 14 squares = 14 strips of a real south-pole map. Each square: five measurement cards, and on a
// separate row what happened there. What happens on a square follows from the square BEFORE it,
// so nothing ahead is ever shown before a move (the lesson from REUSE.md §8).
// Easy: the whole board, outcomes too (the debrief view). Medium: every card of every square
// behind you. Hard: pick 2 of the 5 cards of each square you pass. Model: a team's rules drive
// (Medium information); when its rules disagree it stops: MODEL NEEDS YOU.
import { newRun, act, bestScore, RULES } from './engine.js';
import { Screen, COLS, MAP, SX, SY, DW, DH, INK, DIM, SAND, contourDots, routeDots, shadeDots } from './screen.js';
import * as fx from './effects.js';
import { SYMBOLS } from './symbols.js';
import { decide, describe, OUTCOME_WORD } from './moon.js';
import { EXAMPLE_MODELS } from './models.js';

const [map, routeFile] = await Promise.all([new URLSearchParams(location.search).get('mapfile') ?? 'map.json', 'data/route.json'].map(f => fetch(f).then(r => r.json())));   // ?mapfile= for prototype comparisons
const deck = routeFile.squares, N = deck.length;
const params = new URLSearchParams(location.search), speed = Number(params.get('speed') || 1);
const backdrop = params.get('map') ?? 'shade';               // 'contours' | 'shade' (prototype comparison)


// ---------- one page: size the map so map + cards + graph fit the window ----------
const main = document.querySelector('main');
const ROWS_RATIO = 26 * 1.9 / COLS, SIDE = 220;
function fit() {
  const rest = [...document.querySelectorAll('.bar, .panel')].reduce((h, el) => h + el.getBoundingClientRect().height + 8, 0) || 330;
  const w = Math.min(1240, innerWidth - 24 - SIDE, (innerHeight - rest - 30) / ROWS_RATIO);
  main.style.maxWidth = `${Math.max(320, Math.floor(w)) + SIDE + 24}px`;
}
fit();
const screen = new Screen(document.getElementById('screen'));
function alignStrips() {
  const b = map.strips ?? [0, 1], W = screen.canvas.getBoundingClientRect().width;
  const left = (MAP.col + b[0] * MAP.cols) * screen.cw, right = W - (MAP.col + b[b.length - 1] * MAP.cols) * screen.cw;
  main.style.setProperty('--stripL', `${left}px`); main.style.setProperty('--stripR', `${right}px`); main.style.setProperty('--n', N);
}
const contours = contourDots(map), route = routeDots(map), shadows = backdrop === 'shade' ? shadeDots(map) : [];
const first = Array.from({ length: N + 1 }, (_, r) => r < N ? route.findIndex(d => d.row === r) : route.length - 1);

// ---------- memory ----------
const KEY = 'moon-run.claude.v1';
let memory = { runs: [], level: 'medium', model: 'room' };
try { memory = { ...memory, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch {} };
const team = params.get('team') ?? null;

// ---------- suits: five measurements, then what happened ----------
const SUITS = [
  { name: 'light', levels: ['sun', 'shade', 'dark'] },
  { name: 'temp', label: 'temperature', levels: ['warm', 'cool', 'cold'] },
  { name: 'ground', levels: ['firm', 'loose', 'rocky'] },
  { name: 'slope', levels: ['flat', 'slope', 'steep'] },
  { name: 'battery', levels: ['full', 'low', 'dead'] },
  { name: 'outcome', levels: ['safe', 'power', 'frozen', 'stuck'] },
];
const MEASURE = SUITS.slice(0, 5).map(s => s.name);
const failed = (suit, v) => suit === 'outcome' && v !== 'safe';
const word = (suit, v) => suit === 'outcome' ? (v === 'safe' ? 'safe' : v.toUpperCase()) : v;   // POWER, FROZEN, STUCK
const level = () => memory.level;
const LOOKS = 2;                                             // Hard: cards you may turn over per square passed

let mode = 'intro', run = newRun(deck, RULES), clock = 0, anim = null, effect = null, replay = null;
let shown = {}, pickCol = null, introStart = 0, queued = [], fatal = null, hoverCol = null, selected = null, before = new Set();
let model = null, ask = null, tally = { auto: 0, human: 0 }, fired = new Set(), overNote = '';

// ---------- cards ----------
const cardsEl = document.getElementById('cards');
function buildCards() {
  cardsEl.innerHTML = SUITS.map(s => Array.from({ length: N }, (_, c) => `<div class="card${s.name === 'outcome' ? ' out' : ''}" data-col="${c}" data-suit="${s.name}"></div>`).join('')).join('');
}
const isUp = (c, suit) => !!shown[c]?.includes(suit);
function paintCards() {
  const deciding = ['play', 'ask'].includes(mode) || (mode === 'anim' && anim?.model) ? run.pos : null;
  for (const el of cardsEl.querySelectorAll('.card')) {
    const c = +el.dataset.col, suit = el.dataset.suit, v = deck[c][suit];
    const up = isUp(c, suit), pick = mode === 'pick' && c === pickCol && !up && suit !== 'outcome';
    const flip = el.classList.contains('flip'), hit = selected && up && selected.suit === suit && selected.v === v;
    el.className = 'card' + (suit === 'outcome' ? ' out' : '') + (up ? ' up' : pick ? ' pick' : ' back') + (flip ? ' flip' : '')
      + (c === deciding && suit === 'outcome' && !up ? ' next' : '') + (up && failed(suit, v) ? ' hazard' : '')
      + (fatal && fatal.c === c && suit === 'outcome' ? ' fatal' : '') + (hit ? ' match' : '') + (selected && before.has(c) ? ' before' : '')
      + (fired.has(`${c}:${suit}`) ? ' fired' : '');
    el.innerHTML = up ? `${SYMBOLS[suit][v]}<i>${word(suit, v)}</i>` : pick ? '<span>?</span>' : `<span>${c + 1}</span>`;
  }
  paintGraph();
}
// click a seen card: the same value lights up everywhere, and the square AFTER each is outlined
cardsEl.addEventListener('click', e => {
  const el = e.target.closest('.card'); if (!el) return;
  if (mode === 'pick' && +el.dataset.col === pickCol) return look(el.dataset.suit);
  if (!el.classList.contains('up')) { selected = null; before = new Set(); return paintCards(); }
  const suit = el.dataset.suit, v = deck[+el.dataset.col][suit];
  selected = selected && selected.suit === suit && selected.v === v ? null : { suit, v };
  before = new Set();
  if (selected) for (let c = 0; c < N - 1; c++) if (deck[c][suit] === v && isUp(c, suit)) before.add(c + 1);
  paintCards();
});
cardsEl.addEventListener('pointerover', e => { const el = e.target.closest('.card'); hoverCol = el ? +el.dataset.col : null; });
cardsEl.addEventListener('pointerleave', () => { hoverCol = null; });
function flipAll(then) {
  const cards = [...cardsEl.querySelectorAll('.card.up')];
  if (!cards.length) return then();
  cards.forEach(el => el.classList.add('flip'));
  setTimeout(() => { then(); requestAnimationFrame(() => cardsEl.querySelectorAll('.card.flip').forEach(el => el.classList.remove('flip'))); }, 360);
}

// ---------- graph: light as a step line, slope as a terrain band, ground ● and temperature × ----------
const graphEl = document.getElementById('graph');
function paintGraph() {
  const W = graphEl.clientWidth || 600, H = graphEl.clientHeight || 90, box = graphEl.getBoundingClientRect();
  const firstRow = [...cardsEl.querySelectorAll('.card[data-suit="light"]')];
  const cols = firstRow.map(el => { const r = el.getBoundingClientRect(); return r.left - box.left + r.width / 2; });
  if (!cols.length) return;
  const colW = cols.length > 1 ? cols[1] - cols[0] : W, half = colW / 2, top = 6, bottom = H - 4;
  const lightY = v => top + ['sun', 'shade', 'dark'].indexOf(v) * 8, base = bottom - 30, ly = lv => base - lv * (base - top - 44) / 2;
  let svg = '';
  for (let c = 1; c < N; c++) svg += `<line x1="${cols[c] - half}" x2="${cols[c] - half}" y1="${top}" y2="${bottom}" class="strip"/>`;
  for (const lv of [0, 1, 2]) svg += `<line x1="0" x2="${W}" y1="${ly(lv)}" y2="${ly(lv)}" class="guide"/>`;
  for (let c = 0; c < N; c++) if (isUp(c, 'slope')) {
    const lv = SUITS[3].levels.indexOf(deck[c].slope), h = 9 + lv * 8;
    svg += `<rect x="${cols[c] - half + 1}" y="${bottom - h}" width="${colW - 2}" height="${h}" class="terrain"/>`;
    svg += `<text x="${cols[c]}" y="${bottom - 2}" class="lab slope">${deck[c].slope}</text>`;
  }
  // light: a step line across the top, sun high, dark low; a gap where the card is unseen
  let seg = [];
  const flush = () => { if (seg.length) svg += `<polyline points="${seg.map(p => p.join(',')).join(' ')}" class="bat"/>`; seg = []; };
  for (let c = 0; c < N; c++) {
    if (!isUp(c, 'light')) { flush(); continue; }
    const y = lightY(deck[c].light);
    seg.push([cols[c] - half + 2, y], [cols[c] + half - 2, y]);
    if (deck[c].light !== 'sun' && !(c && isUp(c - 1, 'light') && deck[c - 1].light === deck[c].light)) svg += `<text x="${cols[c] - half + 4}" y="${y + 9}" class="lab">${deck[c].light}</text>`;
  }
  flush();
  [[2, '1.5 3', 'dot', 'ground', ['firm', 'loose', 'rocky']], [1, '5 3', 'x', 'temp', ['warm', 'cool', 'cold']]].forEach(([k, dash, mark, name, levels]) => {
    let prev = null;
    for (let c = 0; c < N; c++) {
      if (!isUp(c, name)) { prev = null; continue; }
      const v = deck[c][name], x = cols[c] + (mark === 'dot' ? -5 : 5), y = ly(levels.indexOf(v));
      if (prev) svg += `<line x1="${prev[0]}" y1="${prev[1]}" x2="${x}" y2="${y}" stroke-dasharray="${dash}" class="trace"/>`;
      svg += mark === 'dot' ? `<circle cx="${x}" cy="${y}" r="2.4" class="dot"/>` : `<path d="M${x - 3} ${y - 3} l6 6 M${x + 3} ${y - 3} l-6 6" class="x"/>`;
      if (levels.indexOf(v) > 0) svg += `<text x="${x}" y="${mark === 'dot' ? y + 13 : y - 7}" class="lab mid">${v}</text>`;
      prev = [x, y];
    }
  });
  // what happened: a filled mark on the top line where a square failed
  for (let c = 0; c < N; c++) if (isUp(c, 'outcome') && deck[c].outcome !== 'safe')
    svg += `<text x="${cols[c]}" y="${bottom - 22}" class="lab mid hot">${OUTCOME_WORD[deck[c].outcome]}</text>`;
  graphEl.innerHTML = `<svg width="${W}" height="${H}">${svg}</svg>`;
  paintLives();
}
function paintLives() {
  const el = document.getElementById('lives'); if (!el) return;
  const html = `<span class="hearts">${'♥'.repeat(run.lives)}<i>${'♥'.repeat(Math.max(0, RULES.lives - run.lives))}</i></span>`;
  if (el.innerHTML !== html) el.innerHTML = html;
}

// ---------- one typed line: what to do now ----------
const sayEl = document.getElementById('say');
let sayText = '', sayT0 = 0;
const WHY = { finish: 'the rover made it across', power: 'POWER LOSS: the batteries drained', frozen: 'FROZEN: the rover froze', stuck: 'STUCK: the wheels dug in' };
function sayFor() {
  const sq = Math.min(run.pos + 1, N);
  if (mode === 'intro') return level() === 'model' ? `press play: the ${model?.name ?? 'model'} drives` : 'press play to start';
  if (mode === 'pick') { const n = LOOKS - (shown[pickCol]?.filter(s => s !== 'outcome').length ?? 0); return `look back: click ${n} card${n === 1 ? '' : 's'} of square ${pickCol + 1}`; }
  if (mode === 'play') return `go or avoid square ${sq} · +1 a square driven, +3 to finish, −2 a failure`;
  if (mode === 'ask') return 'MODEL NEEDS YOU · its rules disagree about square ' + sq + ' · go or avoid?';
  if (mode === 'anim' && anim?.model) return `the model drives · square ${sq}`;
  if (mode === 'dead' && !run.end) { const d = run.log[run.log.length - 1]?.died; return `${WHY[d]} on square ${run.pos + 1} · ${run.lives} ${run.lives === 1 ? 'life' : 'lives'} left`; }
  if (mode === 'over') return `${WHY[run.end] ?? ''} · ${overNote}`;
  if (['dead', 'replay'].includes(mode)) return WHY[run.end] ?? sayText;
  return sayText;
}
function paintSay() {
  const t = sayFor();
  if (t !== sayText) { sayText = t; sayT0 = clock; }
  const n = Math.min(sayText.length, Math.floor((clock - sayT0) * 45));
  const txt = sayText.slice(0, n);
  if (sayEl.dataset.t !== txt) { sayEl.dataset.t = txt; sayEl.textContent = txt; }
}

// ---------- drawing the screen ----------
const dotPx = d => screen.px(d.dx, d.dy);
function stripLines(list, a = 1) {
  const b = map.strips; if (!b) return;
  for (let i = 1; i < b.length - 1; i++) for (let dy = 0; dy < DH; dy += 3) { const [x, y] = screen.px(b[i] * (DW - 1), dy); list.push({ x, y, c: '#3a3a38', a, s: 0.8 }); }
  if (hoverCol !== null) for (const i of [hoverCol, hoverCol + 1]) for (let dy = 0; dy < DH; dy += 2) { const [x, y] = screen.px(b[i] * (DW - 1), dy); list.push({ x, y, c: INK, a: 0.8, s: 1.1 }); }
}
function drawMap(list, { contourAlpha = 1, live = true } = {}) {
  for (const d of shadows) { const [x, y] = dotPx(d); list.push({ x, y, c: '#5d6c86', a: d.a * contourAlpha, s: 0.8 }); }
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: contourAlpha * 0.75 }); }
  stripLines(list, contourAlpha);
  const moves = Object.fromEntries(run.log.filter(l => l.crossed).map(l => [l.pos, l.action]));
  const blink = 0.3 + 0.7 * Math.abs(Math.sin(clock * 3));
  route.forEach((d, i) => {
    const [x, y] = dotPx(d), move = moves[d.row];
    if (d.row < run.pos && move === 'go') list.push({ x, y, c: '#fff', s: 1.7 });
    else if (d.row < run.pos && move === 'avoid') { if (i % 6 < 3) list.push({ x, y, c: '#fff', s: 1.5 }); }
    else if (live && ['play', 'ask'].includes(mode) && d.row === run.pos) list.push({ x, y, c: '#fff', a: blink, s: 1.8 });
    else if (i % 4 < 2) list.push({ x, y, c: '#d8d8d2', a: 0.9, s: 1.3 });
  });
}
function normalAt(i) {
  const a = route[Math.max(0, i - 4)], b = route[Math.min(route.length - 1, i + 4)];
  const ux = (b.dx - a.dx) * screen.cw / SX, uy = (b.dy - a.dy) * screen.ch / SY, n = Math.hypot(ux, uy) || 1;
  return [-uy / n, ux / n];
}
function ticks(list) {
  for (let r = 0; r <= N; r++) {
    const [x, y] = dotPx(route[first[r]]), [nx, ny] = normalAt(first[r]);
    for (const k of [-9, -7, -5, 5, 7, 9]) list.push({ x: x + nx * k, y: y + ny * k, c: INK, a: 0.8, s: 1.2 });
  }
}
// a failure is drawn on the map only once its outcome card has been seen
function hazardMark(list, c, sh = shown) {
  if (deck[c].outcome === 'safe' || !sh[c]?.includes('outcome')) return;
  const mid = route[Math.floor((first[c] + first[c + 1]) / 2)], [cx, cy] = dotPx(mid), o = deck[c].outcome;
  if (o === 'stuck') for (let k = 0; k < 40; k++) { const t = k * 0.55, r = 1.3 * t; list.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r * 0.9, c: SAND, s: 0.9 }); }
  else if (o === 'frozen') for (let k = 0; k < 6; k++) for (let j = 2; j < 14; j += 2) list.push({ x: cx + Math.cos(k * Math.PI / 3) * j, y: cy + Math.sin(k * Math.PI / 3) * j, c: '#dfe8f0', s: 0.9 });
  else for (let k = -10; k <= 10; k += 2) list.push({ x: cx + k, y: cy - 10 + Math.abs(k) * 0.4, c: SAND, s: 0.9 }, { x: cx + k, y: cy + 10 - Math.abs(k) * 0.4, c: SAND, s: 0.9 });
}
function rover(list, i) { const [x, y] = dotPx(route[Math.min(route.length - 1, Math.max(0, Math.round(i)))]); list.push({ x, y, c: INK, s: 4.5 }); }
function frame() {
  screen.hits = [];
  const list = [];
  if (mode === 'intro') return introFrame(list);
  if (mode === 'replay' || mode === 'over') return replayFrame(list);
  drawMap(list);
  ticks(list);
  for (let c = 0; c < N; c++) hazardMark(list, c);
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

// ---------- a turn ----------
const revealBoard = () => { for (let c = 0; c < N; c++) shown[c] = SUITS.map(s => s.name); };
// passing a square (driven or detoured) shows what happened there; Medium/Model also show all its cards
function passed(c) {
  const add = level() === 'hard' ? ['outcome'] : SUITS.map(s => s.name);
  shown[c] = [...new Set([...(shown[c] ?? []), ...add])];
}
function commit(action, how = 'you') {
  if (!['play', 'ask'].includes(mode)) return;
  const was = run, after = act(deck, run, action);
  if (after === was) return;
  if (how !== 'model' && level() === 'model') { tally.human++; after.log[after.log.length - 1].who = 'human'; }
  else if (level() === 'model') { tally.auto++; after.log[after.log.length - 1].who = 'model'; }
  ask = null; fired = new Set();
  mode = 'anim';
  const from = was.pos, a0 = first[from], a1 = first[from + 1], steps = [];
  const died = after.log[after.log.length - 1].died ?? (after.end !== 'finish' ? after.end : null);
  const len = (a1 - a0) * (died ? 0.45 : 1);
  steps.push({ dur: Math.min(1.3, 0.35 + len / 220), run: (u, s) => { s.at = a0 + len * easeIO(u); } });
  steps.push({ dur: 0.05, once: true, run: () => { run = after; passed(from); fatal = died ? { c: from } : null; paintCards(); } });
  steps.push({ dur: died ? 1.0 : 0.45, run: (u, s) => { s.at = a0 + len; } });
  anim = { from, at: a0, steps, i: 0, t0: clock, model: level() === 'model' };
  paintCards();
}
const easeIO = u => u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
function stepAnim() {
  if (!anim) return;
  let step = anim.steps[anim.i];
  while (step && clock - anim.t0 >= step.dur / speed) { step.run(1, anim); anim.t0 += step.dur / speed; step = anim.steps[++anim.i]; }
  if (step) { if (!step.once) step.run((clock - anim.t0) / (step.dur / speed), anim); return; }
  anim = null;
  if (run.end) return finishRun();
  if (run.log[run.log.length - 1]?.died) return loseLife();
  next();
}
// after a move: Hard picks cards of the square just passed; Model decides; otherwise wait
function next() {
  pickCol = null; mode = 'play';
  if (level() === 'hard' && run.pos > 0) {
    const c = run.pos - 1, have = (shown[c] ?? []).filter(s => s !== 'outcome').length;
    if (have < LOOKS) { pickCol = c; mode = 'pick'; }
  }
  paintCards();
  if (mode === 'play' && level() === 'model') return modelMove();
  const k = queued.shift(); if (k) input(k);
}
function look(suit) {
  if (mode !== 'pick' || suit === 'outcome' || shown[pickCol]?.includes(suit)) return;
  (shown[pickCol] ??= []).push(suit);
  if (shown[pickCol].filter(s => s !== 'outcome').length >= LOOKS) { mode = 'play'; pickCol = null; }
  paintCards();
}
// ---------- the model drives ----------
// It sees every card of every square behind it (Medium information) and decides the square ahead.
function modelMove() {
  const p = run.pos;
  const lastDied = run.log[run.log.length - 1]?.died && run.log[run.log.length - 1].pos === p;
  if (lastDied) return later(() => commit('avoid', 'model'));            // it just failed here: the failure is now known
  if (p === 0) return later(() => commit('go', 'model'));                // nothing behind it yet
  const h = deck.slice(0, p).map(o => ({ ...o, outcome: o.outcome === 'safe' ? null : o.outcome }));
  const d = decide(model.rules, h, p - 1);
  fired = new Set([...d.danger, ...d.safe].flatMap(r => cardsFor(r, p - 1)));
  paintCards();
  if (d.action === 'ask') { ask = d; mode = 'ask'; paintCards(); paintAsk(); return; }
  later(() => commit(d.action === 'nogo' ? 'avoid' : 'go', 'model'));
}
const later = f => setTimeout(f, 650 / speed);
// the cards a rule looked at, to outline them while it decides
function cardsFor(r, t) {
  const n = r.type === 'persists' ? r.n : (r.n ?? 1), out = [];
  for (let k = 0; k < n; k++) out.push(`${t - k}:${r.a.key}`);
  if (r.b) out.push(`${t}:${r.b.key}`);
  return out;
}
function paintAsk() {
  const el = document.getElementById('ask'), key = document.getElementById('key');
  el.hidden = !ask; key.hidden = !!ask;
  if (!ask) return;
  el.innerHTML = '<b>MODEL NEEDS YOU</b>' + ask.danger.map(r => `<p><span class="act no">NO GO</span>${describe(r)}</p>`).join('')
    + ask.safe.map(r => `<p><span class="act go">GO</span>${describe(r)}</p>`).join('');
}
// a death with lives left: the death screen, then the rover is back before that square
function deathEffect(d) {
  const frozen = frame(), { width, height } = screen.canvas.getBoundingClientRect();
  if (d === 'frozen') return fx.frost(frozen, width, height);
  if (d === 'stuck') { const [x, y] = dotPx(route[Math.round(first[run.pos] + (first[run.pos + 1] - first[run.pos]) * 0.45)]); return fx.sand(frozen, width, height, x, y); }
  return fx.battery(frozen, width, height);
}
function loseLife() {
  queued = [];
  effect = { f: deathEffect(run.log[run.log.length - 1].died), t0: clock, resume: true };
  mode = 'dead'; paintCards();
}
// ---------- end of a run ----------
function finishRun() {
  queued = [];
  const rec = { level: level(), model: level() === 'model' ? model?.name : null, team, log: run.log, end: run.end, score: run.score, best: bestScore(deck), tally: { ...tally }, at: Date.now() };
  memory.runs.push(rec); save();
  fetch('/api/run', { method: 'POST', body: JSON.stringify({ kind: 'sealed', ...rec }) }).catch(() => {});
  paintCards();
  if (run.end === 'finish') return startReplay();
  effect = { f: deathEffect(run.end), t0: clock };
  mode = 'dead';
}
function startReplay() { mode = 'replay'; replay = { t0: clock, run, shown: { ...shown } }; paintCards(); }
function replayFrame(list) {
  const moves = replay.run.log.filter(l => !l.died || replay.run.end === l.died && l === replay.run.log[replay.run.log.length - 1]), r0 = replay.run;
  const t = Math.max(0, clock - replay.t0 - 0.6) * speed, k = Math.min(moves.length, t / 0.5);
  for (const d of shadows) { const [x, y] = dotPx(d); list.push({ x, y, c: '#5d6c86', a: d.a * 0.8, s: 0.8 }); }
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: 0.7 }); }
  stripLines(list, 0.8);
  route.forEach((d, i) => { if (i % 4 < 2) { const [x, y] = dotPx(d); list.push({ x, y, c: DIM, a: 0.6, s: 1.2 }); } });
  let head = first[0];
  moves.forEach((l, j) => {
    if (j > k) return;
    const u = Math.min(1, k - j), a0 = first[l.pos], a1 = first[l.pos + 1];
    const deadHere = l.died;
    const span = (a1 - a0) * (deadHere ? 0.45 : 1) * Math.max(0, (u - 0.3) / 0.7);
    for (let i = a0; i <= a0 + span; i++) {
      if (l.action === 'avoid' && i % 6 >= 3) continue;
      const [x, y] = dotPx(route[i]); list.push({ x, y, c: l.who === 'human' ? '#f2d36b' : '#fff', s: 1.7 });
    }
    head = a0 + span;
    if (u >= 1) hazardMark(list, l.pos, replay.shown);
  });
  rover(list, head);
  const over = k >= moves.length;
  if (over && r0.end !== 'finish') {
    const [x, y] = dotPx(route[Math.round(head)]);
    for (let d = -8; d <= 8; d += 2) list.push({ x: x + d, y: y + d, c: '#e07a5f', s: 1.1 }, { x: x + d, y: y - d, c: '#e07a5f', s: 1.1 });
  }
  if (over && mode !== 'over') {
    const deaths = r0.log.filter(l => l.died).length, squares = r0.log.filter(l => l.action === 'go' && !l.died).length;
    const who = level() === 'model' ? ` · model ${tally.auto}, you ${tally.human}` : '';
    document.getElementById('status').textContent = `score ${r0.score} of ${bestScore(deck)}${who}`;
    overNote = `${squares} squares driven${r0.end === 'finish' ? `, +${RULES.finishBonus} finish` : ''}${deaths ? `, −${deaths * RULES.failCost} for ${deaths} failure${deaths === 1 ? '' : 's'}` : ''}`;
    mode = 'over'; paintCards();
  }
  const h = screen.canvas.getBoundingClientRect().height, scan = h * (clock - replay.t0) / 0.7;
  return scan > h * 1.2 ? list : list.filter(d => d.y < scan).map(d => ({ ...d, a: (d.a ?? 1) * Math.min(1, (scan - d.y) / 80) }));
}

// ---------- loop & input ----------
function tick(ms) {
  clock = ms / 1000;
  stepAnim();
  if (mode === 'dead') {
    const out = effect.f((clock - effect.t0) * speed);
    if (out) screen.draw(out);
    else if (effect.resume) { effect = null; next(); }
    else { effect = null; startReplay(); }
  } else screen.draw(frame());
  paintControls();
  paintSay();
  requestAnimationFrame(tick);
}
function fresh() {
  run = newRun(deck, RULES); shown = {}; pickCol = null; anim = null; fatal = null; selected = null; before = new Set();
  ask = null; fired = new Set(); tally = { auto: 0, human: 0 }; paintAsk();
  document.getElementById('status').textContent = '';
}
function newGame() {
  mode = 'reset';
  flipAll(() => { fresh(); if (level() === 'easy') revealBoard(); next(); });
}
function input(k) {
  if (mode === 'anim') { if (level() !== 'model') queued.push(k); return; }
  if ((mode === 'intro' || mode === 'over') && ['p', 'start', 'again', 'enter'].includes(k)) return newGame();
  if (mode === 'pick') { const s = SUITS.find((x, i) => k === x.name || k === String(i + 1)); if (s) look(s.name); return; }
  const action = { g: 'go', go: 'go', a: 'avoid', avoid: 'avoid' }[k];
  if (mode === 'ask' && action) return commit(action, 'human');
  if (mode === 'play' && level() !== 'model' && action) commit(action);
}
addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey) input(e.key.toLowerCase()); });
screen.canvas.addEventListener('pointerdown', () => { if (mode === 'intro' || mode === 'over') input('p'); });
addEventListener('resize', () => { fit(); screen.resize(); alignStrips(); paintCards(); });
function resetAll() {
  if (mode === 'anim' || mode === 'reset' || mode === 'dead') return;
  mode = 'reset';
  flipAll(() => { fresh(); mode = 'intro'; introStart = clock; paintCards(); });
}
document.getElementById('reset').addEventListener('click', resetAll);
const modesEl = document.getElementById('modes');
const paintModes = () => {
  modesEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.mode === level()));
  document.getElementById('models').hidden = level() !== 'model';
};
modesEl.addEventListener('click', e => {
  const m = e.target.dataset?.mode; if (!m || m === level() || mode === 'anim' || mode === 'dead') return;
  memory.level = m; save(); paintModes();
  if (mode !== 'intro') newGame(); else { fresh(); paintCards(); }
});

// ---------- the models: example models, plus any a representative locked on the server ----------
const modelsEl = document.getElementById('models');
let models = [...EXAMPLE_MODELS];
async function loadModels() {
  try {
    const s = await fetch('/api/state').then(r => r.json());
    const teams = Object.values(s.models ?? {}).map(m => ({ id: 'team:' + m.team, name: `team ${m.team}`, rules: m.rules }));
    models = [...teams, ...EXAMPLE_MODELS];
  } catch {}
  if (team && models.some(m => m.id === 'team:' + team)) memory.model = 'team:' + team;
  model = models.find(m => m.id === memory.model) ?? models[0];
  paintModels();
}
function paintModels() {
  modelsEl.innerHTML = '<p class="h">model</p>' + models.map(m => `<button data-id="${m.id}" class="${m === model ? 'on' : ''}">${m.name}<small>${m.rules.length} rule${m.rules.length === 1 ? '' : 's'}</small></button>`).join('')
    + `<ol class="rules">${model.rules.map(r => `<li>${describe(r)}</li>`).join('')}</ol>`;
}
modelsEl.addEventListener('click', e => {
  const id = e.target.closest('button')?.dataset.id; if (!id || mode === 'anim' || mode === 'ask') return;
  model = models.find(m => m.id === id); memory.model = id; save(); paintModels();
  if (mode !== 'intro') resetAll();
});

// ---------- controls ----------
const controls = document.getElementById('controls');
controls.addEventListener('click', e => { const k = e.target.closest('button')?.dataset.k; if (k) input(k); });
let shownControls = '';
function paintControls() {
  const view = mode === 'intro' ? 'start' : mode === 'over' ? 'over' : mode === 'ask' ? 'play' : mode === 'play' && level() !== 'model' ? 'play' : 'wait';
  if (view === shownControls) return;
  shownControls = view;
  const b = (k, key, rest, off) => `<button data-k="${k}"${off ? ' disabled' : ''}><u>${key}</u>${rest}</button>`;
  controls.innerHTML = view === 'start' ? b('start', 'P', 'lay') : view === 'over' ? b('again', 'P', 'lay again')
    : b('go', 'G', 'o', view !== 'play') + b('avoid', 'A', 'void', view !== 'play');
  document.body.classList.toggle('asking', mode === 'ask');
}

// ---------- the card key, drawn from the same symbols ----------
document.getElementById('key').innerHTML = '<tr><th></th><th>low</th><th>mid</th><th>high</th></tr>' + SUITS.slice(0, 5).map(s =>
  `<tr><td>${s.label ?? s.name}</td>${s.levels.map(v => `<td>${SYMBOLS[s.name][v]}</td>`).join('')}</tr>`).join('')
  + `<tr class="outkey"><td>happened</td>${['power', 'frozen', 'stuck'].map(v => `<td class="haz" title="${OUTCOME_WORD[v]}">${SYMBOLS.outcome[v]}</td>`).join('')}</tr>`;

window.rover = { get state() { return { mode, run, shown, level: level(), pickCol, ask: ask && { danger: ask.danger.map(describe), safe: ask.safe.map(describe) }, tally, model: model?.name } }, input, deck, setLevel: m => modesEl.querySelector(`[data-mode=${m}]`).click(), setModel: id => modelsEl.querySelector(`[data-id="${id}"]`)?.click() };
main.style.setProperty('--n', N);
buildCards(); paintModes(); await loadModels(); paintCards(); fit(); screen.resize(); alignStrips(); paintCards();
requestAnimationFrame(ms => { introStart = ms / 1000; tick(ms); });
