// Rover Run v2: two decks, slope printed on the map, a turn track, a call per row,
// a new sol every run, and a notebook that tests the player's rule against the data.
import { newRun, act, canAct, danger } from './engine.js';
import { Screen, COLS, MAP, SX, SY, INK, DIM, FAINT, SAND, contourDots, routeDots } from '../web/screen.js';
import * as fx from '../web/effects.js';

const [map, deckFile] = await Promise.all(['map.json', 'deck.json'].map(f => fetch(f).then(r => r.json())));
const sols = deckFile.sols, rules = deckFile.rules, N = sols[0].length;
const screen = new Screen(document.getElementById('screen'));
const params = new URLSearchParams(location.search), speed = Number(params.get('speed') || 1);
if (params.has('film')) { document.documentElement.classList.add('film'); screen.resize(); }
const contours = contourDots(map), route = routeDots(map);
const first = Array.from({ length: N + 1 }, (_, r) => r < N ? route.findIndex(d => d.row === r) : route.length - 1);
const SLOPE = { flat: 'flat', tilted: 'tilted', steep: 'STEEP' };
const SLOPE_GLYPH = { flat: '▁', tilted: '▄', steep: '█' };

// ---------- memory: every run, every observed transition, kept rules ----------
const KEY = 'rover-run.claude.v2';
let memory = { runs: [], pairs: [], rules: [] };
try { memory = { ...memory, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch {} };

// ---------- state ----------
let sol = memory.runs.length % sols.length, deck = sols[sol];
let mode = 'intro', run = newRun(deck, rules), call = null, clock = 0, anim = null, effect = null, replay = null, nudge = 0;
let flipped = new Set(), lastAt = 0, introStart = 0;

// ---------- cards: ground, dust, and the call you made ----------
const SUITS = [
  ['ground', 'firm · soft · SAND', { firm: '▪', soft: '∴', sand: '◍' }],
  ['dust', 'clear · haze · STORM', { clear: '○', haze: '◌', storm: '≋' }],
];
const cardsEl = document.getElementById('cards');
function buildCards() {
  cardsEl.innerHTML = '';
  for (const [suit, states] of [...SUITS, ['call', 'safe = no SAND, no STORM']]) {
    const label = document.createElement('div');
    label.className = 'suit'; label.innerHTML = `${suit}<small>${states}</small>`;
    cardsEl.append(label);
    for (let r = 0; r < N; r++) {
      const c = document.createElement('div');
      c.className = suit === 'call' ? 'card callcard' : 'card'; c.dataset.row = r; c.dataset.suit = suit;
      cardsEl.append(c);
    }
  }
}
function paintCards() {
  const calls = Object.fromEntries(run.log.filter(l => l.action !== 'sample').map(l => [l.pos, l]));
  for (const el of cardsEl.querySelectorAll('.card')) {
    const r = Number(el.dataset.row), suit = el.dataset.suit;
    if (suit === 'call') {
      const c = calls[r];
      el.className = 'card callcard' + (c ? (c.right ? ' right' : ' wrong') : '') + (mode === 'play' && r === run.pos ? ' next' : '');
      el.innerHTML = c ? `<b>${c.right ? '✓' : '✗'}</b><i>${c.arg}</i>` : (mode === 'play' && r === run.pos && call ? `<i>${call}?</i>` : '');
      continue;
    }
    const glyphs = SUITS.find(s => s[0] === suit)[2], value = deck[r][suit];
    const up = flipped.has(r), peek = !up && run.peeks[r]?.includes(suit);
    el.className = 'card' + (up ? ' up' : '') + (peek ? ' up peek' : '') + (mode === 'play' && r === run.pos ? ' next' : '')
      + ((up || peek) && (value === 'sand' || value === 'storm') ? ' hazard' : '') + ((up || peek) && (value === 'soft' || value === 'haze') ? ' warn' : '');
    el.innerHTML = up || peek ? `<b>${glyphs[value]}</b><i>${value === 'sand' || value === 'storm' ? value.toUpperCase() : value}</i>` : `<span>${r + 1}</span>`;
  }
  paintNotebook();
}

// ---------- notebook: what came next, and one rule tested against it ----------
const nb = document.getElementById('notebook');
function recordPairs(row) {
  // a pair needs this row and the next row both flipped
  for (const [a, b] of [[row - 1, row], [row, row + 1]]) {
    if (a < 0 || b >= N || !flipped.has(a) || !flipped.has(b)) continue;
    memory.pairs.push({ sol, g: deck[a].ground, d: deck[a].dust, slope: deck[b].slope, ng: deck[b].ground, nd: deck[b].dust });
  }
}
const IFS = { soft: p => p.g === 'soft', firm: p => p.g === 'firm', haze: p => p.d === 'haze', clear: p => p.d === 'clear' };
const ANDS = { 'any slope': () => true, flat: p => p.slope === 'flat', tilted: p => p.slope === 'tilted', steep: p => p.slope === 'steep', 'not steep': p => p.slope !== 'steep' };
const THENS = { 'has SAND': p => p.ng === 'sand', 'has STORM': p => p.nd === 'storm', 'is safe': p => p.ng !== 'sand' && p.nd !== 'storm' };
const test = r => { const m = memory.pairs.filter(p => IFS[r.if](p) && ANDS[r.and](p)); return [m.filter(THENS[r.then]).length, m.length]; };
// How a rule did across every row pair seen so far, in every run.
const verdict = ([h, n]) => !n ? ['', 'no cases yet'] : h === n ? ['held', `always · ${h} of ${n}`] : h === 0 ? ['broke', `never · 0 of ${n}`] : ['some', `sometimes · ${h} of ${n} · cards and map can't decide this one; a sample can`];
function cell(filter, glyphOf) {
  const ps = memory.pairs.filter(filter);
  return ps.length ? ps.slice(-24).map(glyphOf).join('') + (ps.length > 24 ? `+${ps.length - 24}` : '') : '<em>·</em>';
}
function paintNotebook() {
  const slopeOf = p => SLOPE_GLYPH[p.slope];
  const grid = (rowsDef, cols) => `<table><tr><th></th>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr>${rowsDef.map(([name, f]) =>
    `<tr><th>${name}</th>${cols.map(([, g]) => `<td>${cell(p => f(p) && g(p), slopeOf)}</td>`).join('')}</tr>`).join('')}</table>`;
  const kept = memory.rules.map((r, i) => { const [c, t] = verdict(test(r)); return `<li>if <b>${r.if}</b>, ${r.and}, next row <b>${r.then}</b> <span class="${c}">${t}</span> <button data-drop="${i}">remove</button></li>`; }).join('');
  const sel = (name, opts, v) => `<select data-r="${name}">${Object.keys(opts).map(o => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
  const draft = nb.draft ?? (nb.draft = { if: 'soft', and: 'any slope', then: 'has SAND' }), [vc, vt] = verdict(test(draft));
  nb.innerHTML = `
    <div class="plot"><h3>what came next <small>${memory.pairs.length} pairs · each mark is the next row's slope ▁ flat ▄ tilted █ steep</small></h3>
      ${grid([['firm', IFS.firm], ['soft', IFS.soft]], [['safe ground', p => p.ng !== 'sand'], ['SAND', p => p.ng === 'sand']])}
      ${grid([['clear', IFS.clear], ['haze', IFS.haze]], [['safe sky', p => p.nd !== 'storm'], ['STORM', p => p.nd === 'storm']])}
    </div>
    <div class="rule ${mode === 'over' ? 'ask' : ''}"><h3>one rule <small>when x happens, y also happens</small></h3>
      <p>if a row shows ${sel('if', IFS, draft.if)} and the next row is ${sel('and', ANDS, draft.and)} on the map,<br>the next row ${sel('then', THENS, draft.then)}
      <span class="${vc}">${vt}</span> <button data-keep>keep</button></p>
      <p class="hint">tested against every pair of rows you have seen, in every run</p>
      <ul>${kept}</ul></div>`;
}
nb.addEventListener('change', e => { if (e.target.dataset.r) { nb.draft[e.target.dataset.r] = e.target.value; paintNotebook(); } });
nb.addEventListener('click', e => {
  if (e.target.dataset.keep !== undefined) { memory.rules.push({ ...nb.draft }); save(); paintNotebook(); }
  if (e.target.dataset.drop !== undefined) { memory.rules.splice(Number(e.target.dataset.drop), 1); save(); paintNotebook(); }
});

// ---------- drawing ----------
const dotPx = d => screen.px(d.dx, d.dy);
function normalAt(i) {
  const a = route[Math.max(0, i - 4)], b = route[Math.min(route.length - 1, i + 4)];
  const ux = (b.dx - a.dx) * screen.cw / SX, uy = (b.dy - a.dy) * screen.ch / SY, n = Math.hypot(ux, uy) || 1;
  return [-uy / n, ux / n];
}
function drawMap(list, { contourAlpha = 1, live = true } = {}) {
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: contourAlpha * 0.75 }); }
  const moves = Object.fromEntries(run.log.filter(l => l.action !== 'sample').map(l => [l.pos, l.action]));
  const blink = 0.3 + 0.7 * Math.abs(Math.sin(clock * 3));
  route.forEach((d, i) => {
    const [x, y] = dotPx(d), move = moves[d.row];
    if (d.row < run.pos && move === 'go') list.push({ x, y, c: '#fff', s: 1.7 });
    else if (d.row < run.pos && move === 'avoid') { if (i % 6 < 3) list.push({ x, y, c: '#fff', s: 1.5 }); }
    else if (live && mode === 'play' && d.row === run.pos) list.push({ x, y, c: '#fff', a: blink, s: 1.8 });
    else if (i % 4 < 2) list.push({ x, y, c: '#d8d8d2', a: 0.9, s: 1.3 });
  });
}
// The printed slope marker on every row, plus ticks at row boundaries.
function slopeMarks(list, next) {
  for (let r = 0; r <= N; r++) {
    const [x, y] = dotPx(route[first[r]]), [nx, ny] = normalAt(first[r]);
    for (const k of [-9, -7, -5, 5, 7, 9]) list.push({ x: x + nx * k, y: y + ny * k, c: INK, a: 0.8, s: 1.2 });
  }
  for (let r = 0; r < N; r++) {
    const mid = Math.floor((first[r] + first[r + 1]) / 2), [x, y] = dotPx(route[mid]), [nx, ny] = normalAt(mid);
    const side = ny > 0 ? -1 : 1, t = r === next ? `${r + 1} ${SLOPE[deck[r].slope]}` : SLOPE_GLYPH[deck[r].slope];
    const off = r === next ? 22 : 14, col = Math.round((x + nx * off * side) / screen.cw) - (r === next ? Math.floor(t.length / 2) : 0);
    screen.text(list, col, (y + ny * off * side) / screen.ch - 0.5, t, r === next ? INK : DIM);
  }
}
function ring(list, at, radius, c = INK, a = 1) {
  const [cx, cy] = dotPx(at), rx = radius * screen.cw / SX * 1.5, ry = radius * screen.ch / SY * 1.5;
  for (let k = 0; k < 28; k++) list.push({ x: cx + Math.cos(k / 28 * 6.283) * rx, y: cy + Math.sin(k / 28 * 6.283) * ry, c, a, s: 0.9 });
}
function hazardMark(list, row, d = deck, a = 1) {
  const mid = route[Math.floor((first[row] + first[row + 1]) / 2)], [cx, cy] = dotPx(mid);
  if (d[row].ground === 'sand') for (let k = 0; k < 40; k++) { const t = k * 0.55, r = 1.3 * t; list.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r * 0.9, c: SAND, a, s: 0.9 }); }
  else if (d[row].dust === 'storm') for (let k = 0; k < 5; k++) for (let j = 0; j < 7; j++) list.push({ x: cx - 18 + j * 4 + k * 3, y: cy - 12 + k * 6 + j * 0.6, c: SAND, a: a * (1 - j / 9), s: 0.9 });
}
function marks(list, r0, d = deck) {
  r0.log.forEach(l => {
    if (l.action === 'sample') ring(list, route[first[l.pos]], 4.5);
    else if (danger(d[l.pos]) && (l.action === 'avoid' || r0.end)) hazardMark(list, l.pos, d);
  });
}
function rover(list, i) { const [x, y] = dotPx(route[Math.min(route.length - 1, Math.max(0, Math.round(i)))]); list.push({ x, y, c: INK, s: 4.5 }); }
function hud(list) {
  screen.text(list, 3, 1, 'JEZERO / PERSEVERANCE', INK);
  screen.text(list, 3, 2, `rim climb · sol ${sol + 1}: new weather, same laws`, DIM);
  const left = run.turns - run.turn;
  const right = `turns ${'▮'.repeat(left)}${'▯'.repeat(run.turn)}   calls ${run.right}/${run.calls}   score ${run.score}`;
  screen.text(list, COLS - 3 - right.length, 1, right, INK);
  if (left <= 4) screen.text(list, COLS - 3 - right.length + 6, 1, '▮'.repeat(left), '#e07a5f');
}
function prompt(list) {
  const row = MAP.row + MAP.rows + 2, needCall = !call && clock - nudge < 1.2 && Math.sin(clock * 12) > 0;
  let col = 3;
  const put = (t, c, hit, inv) => { screen.text(list, col, row, t, c, hit); if (inv) list[list.length - 1].inv = true; col += t.length; };
  put(`row ${run.pos + 1}/${N}`, INK); col += 3;
  put('call ', DIM);
  put(' Y safe ', INK, 'safe', call === 'safe' || needCall); put(' ');
  put(' N danger ', INK, 'danger', call === 'danger' || needCall);
  col += 4; put('then ', DIM);
  put(' G go ', call ? INK : DIM, 'go'); put(' ');
  put(' A avoid ', call && canAct(run, 'avoid') ? INK : DIM, 'avoid');
  col += 4; put('or sample ', DIM);
  const peeked = run.peeks[run.pos] ?? [], can = canAct(run, 'sample');
  put(' 1 ground ', can && !peeked.includes('ground') ? INK : FAINT, 'ground'); put(' ');
  put(' 2 dust ', can && !peeked.includes('dust') ? INK : FAINT, 'dust');
  screen.text(list, 3, MAP.row + MAP.rows + 0.6, `turns: go 1 · avoid ${rules.avoidTurns} · sample 1`, DIM);
}
function footer(list, t = 'real terrain + route · simulated hazards') { screen.text(list, COLS - 3 - t.length, MAP.row + MAP.rows + 0.6, t, FAINT); }
function frame() {
  screen.hits = [];
  const list = [];
  if (mode === 'intro') return introFrame(list);
  if (mode === 'replay' || mode === 'over') return replayFrame(list);
  drawMap(list);
  slopeMarks(list, mode === 'play' ? run.pos : undefined);
  marks(list, run);
  if (anim?.ring) ring(list, route[first[anim.from]], anim.ring);
  if (anim?.verdict) { const [x, y] = dotPx(route[Math.round(anim.at)]); screen.text(list, Math.round(x / screen.cw) + 1, y / screen.ch - 1.6, anim.verdict, anim.verdict === '✓' ? INK : '#e07a5f'); }
  rover(list, anim ? anim.at : first[run.pos]);
  hud(list);
  if (mode === 'play') prompt(list);
  footer(list);
  return list;
}

function introFrame(list) {
  const t = clock - introStart;
  drawMap(list, { contourAlpha: Math.min(1, t / 1.2), live: false });
  const k = Math.min(route.length, Math.floor(route.length * Math.max(0, t - 0.8) / 2.2));
  for (let i = 0; i < k; i++) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: INK, s: 1.2 }); }
  if (k) rover(list, k - 1);
  if (t > 3) {
    slopeMarks(list);
    const base = MAP.row + MAP.rows + 1;
    screen.text(list, 3, 1, 'ROVER RUN', INK);
    screen.text(list, 3, 2, `sol ${sol + 1} · every run is a new sol: same route, new weather, same laws of nature`, DIM);
    screen.text(list, 3, base - 1, `${N} rows, ${rules.turns} turns. SAND or STORM ends the run. Slope is printed on the map.`, DIM);
    screen.text(list, 3, base, 'Each row: call it safe or danger, then go, avoid, or sample one of its cards.', DIM);
    screen.text(list, 3, base + 1, 'Score: rows driven + calls right + 3 for the finish.   map: ▁ flat  ▄ tilted  █ STEEP', INK);
    if (Math.sin(clock * 4) > -0.3) { screen.text(list, COLS - 13, base + 1, ' P  start ', INK, 'start'); list[list.length - 1].inv = true; }
  }
  return list;
}

// ---------- a turn ----------
function commit(action, arg) {
  if (mode !== 'play') return;
  if ((action === 'go' || action === 'avoid') && !call) { nudge = clock; return; }
  const before = run, after = act(deck, run, action, action === 'sample' ? arg : call);
  if (after === before) return;
  mode = 'anim';
  const from = before.pos, a0 = first[from], a1 = first[from + 1];
  const dead = after.end === 'sand' || after.end === 'storm', steps = [];
  if (action === 'sample') {
    steps.push({ dur: 0.6, run: (u, s) => { s.ring = 1 + u * 3.5; } });
    steps.push({ dur: 0.05, once: true, run: () => { run = after; paintCards(); } });
  } else {
    const len = (a1 - a0) * (dead ? 0.45 : 1), dur = (action === 'avoid' ? 0.7 : 0.35) + len / 320;
    steps.push({ dur, run: (u, s) => { s.at = a0 + len * (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2); } });
    steps.push({ dur: 0.05, once: true, run: () => { flipped.add(from); run = after; call = null; recordPairs(from); save(); paintCards(); } });
    steps.push({ dur: dead ? 1.0 : 0.55, run: (u, s) => { s.at = a0 + len; s.verdict = after.log[after.log.length - 1].right ? '✓' : '✗'; } });
  }
  anim = { from, at: a0, steps, i: 0, t0: clock };
}
function stepAnim() {
  if (!anim) return;
  let step = anim.steps[anim.i];
  while (step && clock - anim.t0 >= step.dur / speed) { step.run(1, anim); anim.t0 += step.dur / speed; step = anim.steps[++anim.i]; }
  if (step) { delete anim.ring; delete anim.verdict; if (!step.once) step.run((clock - anim.t0) / (step.dur / speed), anim); return; }
  lastAt = anim.at; anim = null;
  if (run.end) return finishRun();
  mode = 'play';
  paintCards();
  const k = queued; queued = null;
  if (k) input(k);
}

// ---------- end of a run ----------
function finishRun() {
  memory.runs.push({ sol, log: run.log, end: run.end, score: run.score, right: run.right, calls: run.calls, at: Date.now() });
  save();
  if (run.end === 'finish') return startReplay();
  const frozen = frame(), { width, height } = screen.canvas.getBoundingClientRect(), [rx, ry] = dotPx(route[Math.round(lastAt)]);
  effect = { f: { storm: () => fx.storm(frozen, width, height), time: () => fx.battery(frozen, width, height), sand: () => fx.sand(frozen, width, height, rx, ry) }[run.end](), t0: clock };
  mode = 'dead';
}
function startReplay() { mode = 'replay'; replay = { t0: clock, run, deck, sol, n: memory.runs.length }; paintCards(); }
const best = () => Math.max(0, ...memory.runs.map(r => r.score));
function replayFrame(list) {
  const r0 = replay.run, moves = r0.log, t = Math.max(0, clock - replay.t0 - 0.6) * speed, k = Math.min(moves.length, t / 0.4);
  for (const d of contours) { const [x, y] = dotPx(d); list.push({ x, y, c: d.c, a: 0.7 }); }
  for (const old of memory.runs.slice(-6, -1)) {           // earlier runs (other sols), faint
    const lm = old.log.filter(l => l.action !== 'sample'), last = lm[lm.length - 1];
    const end = !last ? 0 : old.end === 'finish' ? route.length : first[last.pos] + (old.end === 'time' ? first[last.pos + 1] - first[last.pos] : Math.round((first[last.pos + 1] - first[last.pos]) * 0.45));
    for (let i = 0; i < end; i += 2) { const [x, y] = dotPx(route[i]); list.push({ x, y, c: DIM, a: 0.5 }); }
  }
  route.forEach((d, i) => { if (i % 4 < 2) { const [x, y] = dotPx(d); list.push({ x, y, c: DIM, a: 0.6, s: 1.2 }); } });
  let head = first[0], cur;
  moves.forEach((l, j) => {
    if (j > k) return;
    const u = Math.min(1, k - j), a0 = first[l.pos], a1 = first[l.pos + 1];
    cur = l;
    if (l.action === 'sample') { ring(list, route[a0], 1 + 3.5 * Math.min(1, u / 0.4)); return; }
    const deadHere = j === moves.length - 1 && (r0.end === 'sand' || r0.end === 'storm');
    const span = (a1 - a0) * (deadHere ? 0.45 : 1) * u;
    for (let i = a0; i <= a0 + span; i++) { if (l.action === 'avoid' && i % 6 >= 3) continue; const [x, y] = dotPx(route[i]); list.push({ x, y, c: '#fff', s: 1.7 }); }
    head = a0 + span;
    if (u >= 1 && danger(replay.deck[l.pos])) hazardMark(list, l.pos, replay.deck);
  });
  rover(list, head);
  const over = k >= moves.length;
  if (over && r0.end !== 'finish') { const [x, y] = dotPx(route[Math.round(head)]); screen.text(list, Math.round(x / screen.cw) + 1, Math.round(y / screen.ch) - 1, `✕ ${r0.end === 'time' ? 'out of turns' : r0.end}`, '#e07a5f'); }
  screen.text(list, 3, 1, `SOL ${replay.sol + 1} · RUN ${replay.n}  replay`, INK);
  if (cur) { const row = replay.deck[cur.pos]; screen.text(list, 3, 2, `row ${cur.pos + 1}  ${row.slope} · ${row.ground === 'sand' ? 'SAND' : row.ground} · ${row.dust === 'storm' ? 'STORM' : row.dust}`, DIM); }
  // calls along the bottom, like a lab sheet
  const base = MAP.row + MAP.rows + 1.9, shown = moves.slice(0, Math.floor(k)).filter(l => l.action !== 'sample');
  screen.text(list, 3, base, 'calls', DIM);
  shown.forEach((l, j) => screen.text(list, 10 + j * 2, base, l.right ? '✓' : '✗', l.right ? INK : '#e07a5f'));
  if (over) {
    const s = `score ${r0.score}   rows ${r0.rows} · calls ${r0.right}${r0.end === 'finish' ? ` · finish +${rules.finishBonus}` : ''}   best ${best()}`;
    screen.text(list, COLS - 3 - s.length, 1, s, INK);
    screen.text(list, 3, base + 1.2, 'write one rule below, then', DIM);
    if (Math.sin(clock * 4) > -0.3) { screen.text(list, 31, base + 1.2, ' P  next sol ', INK, 'again'); list[list.length - 1].inv = true; }
    if (mode !== 'over') { mode = 'over'; paintNotebook(); }
  }
  footer(list);
  const h = screen.canvas.getBoundingClientRect().height, scan = h * (clock - replay.t0) / 0.7;
  return scan > h * 1.2 ? list : list.filter(d => d.y < scan).map(d => ({ ...d, a: (d.a ?? 1) * Math.min(1, (scan - d.y) / 80) }));
}

// ---------- loop & input ----------
function tick(ms) {
  clock = ms / 1000;
  stepAnim();
  if (mode === 'dead') { const out = effect.f((clock - effect.t0) * speed); if (out) screen.draw(out); else { effect = null; startReplay(); } }
  else screen.draw(frame());
  paintPad();
  requestAnimationFrame(tick);
}
function newGame() {
  sol = memory.runs.length % sols.length; deck = sols[sol]; window.rover.deck = deck;
  run = newRun(deck, rules); call = null; flipped = new Set(); anim = null; mode = 'play';
  paintCards();
}
let queued = null;                                     // one key typed during an animation
function input(k) {
  if (mode === 'anim') { queued = k; return; }
  if ((mode === 'intro' || mode === 'over') && ['p', 'start', 'again'].includes(k)) return newGame();
  if (mode !== 'play') return;
  if (k === 'y' || k === 'safe') call = call === 'safe' ? null : 'safe';
  else if (k === 'n' || k === 'danger') call = call === 'danger' ? null : 'danger';
  else if (k === 'g' || k === 'go') commit('go');
  else if (k === 'a' || k === 'avoid') commit('avoid');
  else if (k === '1' || k === 'ground') commit('sample', 'ground');
  else if (k === '2' || k === 'dust') commit('sample', 'dust');
  paintCards();
}
addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey && e.target.tagName !== 'SELECT') input(e.key.toLowerCase()); });
screen.canvas.addEventListener('pointerdown', e => {
  const b = screen.canvas.getBoundingClientRect(), h = screen.hit(e.clientX - b.left, e.clientY - b.top);
  if (h) input(h); else if (mode === 'intro' || mode === 'over') input('p');
});
addEventListener('resize', () => screen.resize());
const pad = document.getElementById('pad');
pad.addEventListener('click', e => { const k = e.target.dataset?.k; if (k) input(k); });
function paintPad() {
  pad.classList.toggle('over', mode === 'intro' || mode === 'over');
  for (const b of pad.querySelectorAll('button')) b.classList.toggle('on', b.dataset.k === call && mode === 'play');
}
window.rover = { get state() { return { mode, run, call, memory, sol } }, input, deck,
  keepRule(r) { if (IFS[r.if] && ANDS[r.and] && THENS[r.then]) { memory.rules.push(r); save(); paintNotebook(); return test(r); } return null; } };
buildCards(); paintCards();
requestAnimationFrame(ms => { introStart = ms / 1000; tick(ms); });
