// Moon Run simulator and checks (ROVER_COMPETES §19). node tools/sim.mjs [--quiet]
// Plays every strategy on the archive (asks answered by an oracle and by a cautious person), on 20
// unseen histories, and on the sealed 14-square route with Rover's scoring; then checks the designed
// lessons. Exit code 1 if a check fails.
import { readFileSync } from 'node:fs';
import { evaluate, decide, describe, lawOutcome, fires, GRADUATE } from '../web/moon.js';
import { newRun, act, bestScore, RULES } from '../web/engine.js';
import { EXAMPLE_MODELS } from '../web/models.js';
import { room, cluster } from '../web/audience.js';

const read = f => JSON.parse(readFileSync(new URL(`../web/data/${f}`, import.meta.url)));
const archive = read('archive.json').histories, holdout = read('holdout.json').histories;
const route = read('route.json').squares, sudden = read('sudden.json').cases;
const quiet = process.argv.includes('--quiet');
const log = (...a) => { if (!quiet) console.log(...a); };
const P = (key, value, n, then) => ({ type: 'persists', a: { key, value }, n, then });
const B = (key, value, then) => ({ type: 'before', a: { key, value }, then });
const W = (key, value, key2, value2, then, n = 1) => ({ type: 'with', a: { key, value }, n, b: { key: key2, value: value2 }, then });

// ---------- strategies: a function (history-so-far, t) -> 'go' | 'nogo' | 'ask' ----------
const model = rules => ({ rules, f: (h, t) => decide(rules, h, t).action });
let seed = 3; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const M = Object.fromEntries(EXAMPLE_MODELS.map(m => [m.id, m.rules]));
const STRATS = {
  'always GO': { f: () => 'go' },
  'always NO GO': { f: () => 'nogo' },
  'random': { f: () => rand() < 0.5 ? 'go' : 'nogo' },
  'one card: dark': model([B('light', 'dark', 'any')]),
  'one card: shade or dark': model([B('light', 'shade or dark', 'any')]),
  'one card: loose': model([B('ground', 'loose', 'any')]),
  'one card: steep': model([B('slope', 'steep', 'any')]),
  'one card: cold': model([B('temp', 'cold', 'any')]),
  'one card: low battery': model([B('battery', 'low or dead', 'any')]),
  'BEFORE only (dark, loose, shade)': model(M.single),
  'PERSISTS only (shadow 3)': model([P('light', 'shade or dark', 3, 'power')]),
  'WITH only (dark+cold, loose+steep)': model([W('light', 'dark', 'temp', 'cold', 'frozen'), W('ground', 'loose', 'slope', 'steep', 'stuck')]),
  'partial: no frozen rule': model([P('light', 'shade or dark', 3, 'power'), W('ground', 'loose', 'slope', 'steep', 'stuck'), W('light', 'shade', 'ground', 'firm', 'safe', 2)]),
  'partial: no firm exception': model([P('light', 'shade or dark', 3, 'power'), W('light', 'dark', 'temp', 'cold', 'frozen'), W('ground', 'loose', 'slope', 'steep', 'stuck')]),
  'battery watchers (late)': model(M.late),
  'shadow only (any)': model(M.shadow),
  'a good room (intended)': model(M.room),
  'a sharp room': model(M.sharp),
};
// a room that keeps every rule its simulated audience graduated (no cap, no choice)
const everything = [...new Map(['A', 'B', 'C', 'D'].flatMap(t => cluster(room(archive, t))).map(c => [JSON.stringify(c.rule), c.rule])).values()];
STRATS[`every graduated rule (${everything.length})`] = model(everything);

// ---------- scoring ----------
// Histories: one decision per step until the failure. Asks resolved by `human`: 'oracle' | 'nogo'.
function histories(f, hs, human) {
  const c = { caught: 0, missed: 0, fa: 0, go: 0, ask: 0 };
  for (const { obs } of hs) for (let t = 0; t < obs.length - 1; t++) {
    if (obs[t].outcome) break;
    let a = f(obs, t); const fail = !!obs[t + 1].outcome;
    if (a === 'ask') { c.ask++; a = human === 'oracle' ? (fail ? 'nogo' : 'go') : 'nogo'; }
    if (fail && a === 'nogo') c.caught++; else if (fail) c.missed++; else if (a === 'nogo') c.fa++; else c.go++;
  }
  const r = c.caught / Math.max(1, c.caught + c.missed), p = c.caught / Math.max(1, c.caught + c.fa);
  c.v = r + p ? Math.round(200 * r * p / (r + p)) : 0;
  return c;
}
// The sealed route with Rover's economy: +1 a driven square, +3 to finish, 3 lives; after a death
// the failure is known, so the retry avoids it. The model sees every card behind it (Medium).
function sealed(f, human) {
  let s = newRun(route, RULES), asks = 0, deaths = 0;
  const h = route.map(o => ({ ...o, outcome: o.outcome === 'safe' ? null : o.outcome }));
  while (!s.end) {
    const p = s.pos, retry = s.log.at(-1)?.died && s.log.at(-1).pos === p;
    let a = retry ? 'nogo' : p === 0 ? 'go' : f(h.slice(0, p), p - 1);
    if (a === 'ask') { asks++; a = human === 'oracle' ? (route[p].outcome === 'safe' ? 'go' : 'nogo') : 'nogo'; }
    s = act(route, s, a === 'nogo' ? 'avoid' : 'go');
    if (s.log.at(-1).died) deaths++;
  }
  return { score: s.score, end: s.end, asks, deaths };
}

// ---------- the table ----------
const rows = [];
for (const [name, st] of Object.entries(STRATS)) {
  const runs = name === 'random' ? 50 : 1, acc = { a: 0, u: 0, so: 0, sc: 0, asks: 0, sasks: 0, deaths: 0 };
  for (let i = 0; i < runs; i++) {
    const a = histories(st.f, archive, 'oracle'), u = histories(st.f, holdout, 'oracle');
    const so = sealed(st.f, 'oracle'), sc = sealed(st.f, 'nogo');
    acc.a += a.v; acc.u += u.v; acc.so += so.score; acc.sc += sc.score; acc.asks += a.ask; acc.sasks += so.asks; acc.deaths += so.deaths;
    if (i === 0) acc.detail = a;
  }
  const k = x => Math.round(x / runs * 10) / 10;
  rows.push({ name, archive: k(acc.a), unseen: k(acc.u), sealed: k(acc.so), sealedCautious: k(acc.sc), asks: k(acc.asks), sealedAsks: k(acc.sasks), deaths: k(acc.deaths), d: acc.detail });
}
log(`\nsealed route: best possible ${bestScore(route)} (${route.filter(q => q.outcome === 'safe').length} safe squares + ${RULES.finishBonus})`);
log('strategy'.padEnd(36), 'archive', 'unseen', 'asks', '| sealed', '(cautious)', 'asks', 'deaths');
for (const r of rows) log(r.name.padEnd(36), String(r.archive).padStart(7), String(r.unseen).padStart(6), String(r.asks).padStart(4), '|', String(r.sealed).padStart(6), String(r.sealedCautious).padStart(10), String(r.sealedAsks).padStart(4), String(r.deaths).padStart(6));

// ---------- checks ----------
const H = archive.map(h => h.obs), ev = r => evaluate(r, H), row = n => rows.find(r => r.name === n);
const checks = [];
const check = (ok, what) => { checks.push([ok, what]); };
const fails = archive.flatMap(h => h.obs.filter(o => o.outcome).map(o => o.outcome));
const bal = ['power', 'frozen', 'stuck'].map(o => fails.filter(f => f === o).length);
check(Math.max(...bal) - Math.min(...bal) <= 1 && Math.min(...bal) >= 3, `failures balanced (power ${bal[0]}, frozen ${bal[1]}, stuck ${bal[2]})`);
check(archive.length >= 15 && archive.length <= 20 && H.flat().length >= 80 && H.flat().length <= 120, `archive size: ${archive.length} histories, ${H.flat().length} observations`);
check(archive.every(h => h.obs.every((o, t) => t === 0 || (lawOutcome(h.obs, t - 1) ?? null) === (o.outcome ?? null) || h.luck.includes(t - 1))), 'every archive outcome follows the hidden laws (2 lucky escapes)');
// evaluator: good, partial, overfit, lagging
for (const r of [W('light', 'shade or dark', 'ground', 'loose or rocky', 'power', 3), W('light', 'dark', 'temp', 'cold', 'frozen'), W('ground', 'loose', 'slope', 'steep', 'stuck'), W('light', 'shade', 'ground', 'firm', 'safe', 2)])
  check(ev(r).verdict === 'graduates', `intended rule graduates: ${describe(r)} (${ev(r).score})`);
for (const r of [B('light', 'dark', 'frozen'), B('temp', 'cold', 'frozen'), B('ground', 'loose', 'stuck'), B('slope', 'steep', 'stuck'), B('light', 'shade', 'power'), B('light', 'sun', 'safe')]) {
  const e = ev(r); check(e.verdict === 'keep testing' && e.score >= 15, `single card is plausible but keeps testing: ${describe(r)} (${e.score}, caught ${e.caught} of ${e.failures})`);
}
check(ev(B('battery', 'dead', 'power')).verdict === 'too late', `lagging: "${describe(B('battery', 'dead', 'power'))}" is too late`);
for (const r of [W('light', 'shade or dark', 'ground', 'firm', 'safe', 3), W('light', 'dark', 'temp', 'cold', 'frozen', 2)]) check(ev(r).verdict === 'too few cases', `overfit: ${describe(r)} has too few cases (${ev(r).alerts ?? ev(r).said})`);
const plain = ev(P('light', 'shade or dark', 3, 'power')), sharp = ev(W('light', 'shade or dark', 'ground', 'loose or rocky', 'power', 3));
check(sharp.score > plain.score, `adding context improves the shadow rule (${plain.score} -> ${sharp.score})`);
// strategies
const good = row('a good room (intended)');
check(good.asks >= 1 && good.asks <= 3, `the intended model stops to ask about ${good.asks} times in the archive run (target ~2)`);
check(good.sealedAsks >= 1 && good.sealedAsks <= 3, `...and ${good.sealedAsks} times on the sealed route`);
check(row('a sharp room').asks === 0, 'a sharper power rule removes the conflicts');
check(good.unseen >= 80 && good.archive >= 80, `the intended model verifies (archive ${good.archive}, unseen ${good.unseen})`);
for (const n of ['always GO', 'always NO GO', 'random', 'battery watchers (late)', 'one card: dark', 'one card: loose', 'shadow only (any)'])
  check(row(n).sealed < good.sealed, `sealed route: "${n}" (${row(n).sealed}) scores below the intended model (${good.sealed})`);
for (const n of ['partial: no frozen rule', 'BEFORE only (dark, loose, shade)', 'PERSISTS only (shadow 3)', 'WITH only (dark+cold, loose+steep)'])
  check(row(n).sealed < good.sealed, `sealed route: partial model "${n}" (${row(n).sealed}) scores below the intended model (${good.sealed})`);
check(row('always GO').end !== 'finish' && sealed(STRATS['always GO'].f).end !== 'finish', 'always GO does not finish the sealed route');
const singles = rows.filter(r => r.name.startsWith('one card'));
check(Math.max(...singles.map(r => r.sealed)) <= good.sealed - 3, `no single card dominates (best single ${Math.max(...singles.map(r => r.sealed))} vs ${good.sealed})`);
// sealed route: each failure type appears; nothing ahead is visible (outcome follows the square before)
check(['power', 'frozen', 'stuck'].every(o => route.some(q => q.outcome === o)), `sealed route has every failure (${route.map(q => q.outcome[0]).join('')})`);
// sudden death: every case is gotten wrong by at least one plausible model, and right by the intended one
const plausible = ['a good room (intended)', 'one card: dark', 'one card: cold', 'one card: loose', 'one card: low battery', 'PERSISTS only (shadow 3)', 'shadow only (any)', 'battery watchers (late)'];
for (const c of sudden) {
  const h = c.recent, truth = c.next === 'safe' ? 'go' : 'nogo';
  const wrong = plausible.filter(n => { const a = STRATS[n].f(h, h.length - 1); return a !== 'ask' && a !== truth; });
  check(wrong.length >= 1, `sudden ${c.id} (${c.why}) is not trivial: wrong for ${wrong.join(', ') || 'nobody'}`);
}
// no variable dominates: drop each variable from the intended model and see the cost
for (const key of ['light', 'temp', 'ground', 'slope']) {
  const kept = M.room.filter(r => r.a.key !== key && r.b?.key !== key);
  const v = histories(model(kept).f, holdout, 'oracle').v;
  log(`  without ${key}: unseen ${v} (${kept.length} rules)`);
}
log('');
let bad = 0;
for (const [ok, what] of checks) { if (!ok) bad++; log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); }
console.log(`${checks.length - bad} of ${checks.length} checks pass`);
process.exit(bad ? 1 : 0);
