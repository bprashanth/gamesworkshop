// A simulated room, for rehearsal and for tools/sim.mjs: each participant looks at their own
// fragment, works backwards from the white square, writes the rules a person plausibly would,
// evaluates them, revises once, and publishes the ones that graduate. Not clever on purpose:
// it only sees its own two rows, and it tries the obvious things first.
import { evaluate, ruleKey } from './moon.js';
import { fragment, PER_TEAM } from './fragments.js';

const GROUP = { light: { shade: 'shade or dark', dark: 'shade or dark' }, temp: { cool: 'cool or cold', cold: 'cool or cold' },
  ground: { loose: 'loose or rocky', rocky: 'loose or rocky' }, slope: { slope: 'slope or steep', steep: 'slope or steep' }, battery: { low: 'low or dead', dead: 'low or dead' } };
const LOW = { light: 'sun', temp: 'warm', ground: 'firm', slope: 'flat', battery: 'full' };

// The candidate rules one fragment suggests, most obvious first.
export function proposals(frag, combineFirst = true) {
  const h = frag.history.obs, rows = frag.rows.filter(r => r !== 'outcome');
  const f = h.findIndex(o => o.outcome), out = [];
  if (f < 1) {                                  // a safe history: the exception rules ("even then, safe")
    for (let t = 1; t < h.length; t++) for (const a of rows) for (const b of rows) if (a !== b && h[t][a] !== LOW[a] && h[t][b] === LOW[b] && h[t - 1][a] === h[t][a])
      out.push({ type: 'with', a: { key: a, value: h[t][a] }, n: 2, b: { key: b, value: h[t][b] }, then: 'safe' });
    return out.slice(0, 2);
  }
  const what = h[f].outcome, t = f - 1;
  for (const k of rows) {                       // BEFORE: whatever was unusual just before
    const v = h[t][k]; if (v === LOW[k]) continue;
    out.push({ type: 'before', a: { key: k, value: v }, then: what });
    let n = 1; while (t - n >= 0 && (h[t - n][k] === v || GROUP[k][h[t - n][k]] === GROUP[k][v])) n++;
    const g = n > 1 && h.slice(t - n + 1, t + 1).some(o => o[k] !== v) ? GROUP[k][v] : v;
    if (n >= 2) out.push({ type: 'persists', a: { key: k, value: g }, n: Math.min(n, 4), then: what });
  }
  const [a, b] = rows;                          // WITH: both rows at once, if both were unusual
  if (h[t][a] !== LOW[a] && h[t][b] !== LOW[b]) {
    out.push({ type: 'with', a: { key: a, value: h[t][a] }, n: 1, b: { key: b, value: h[t][b] }, then: what });
    let n = 1; while (t - n >= 0 && GROUP[a][h[t - n][a]] && GROUP[a][h[t - n][a]] === GROUP[a][h[t][a]]) n++;
    if (n >= 3) out.push({ type: 'with', a: { key: a, value: GROUP[a][h[t][a]] }, n: 3, b: { key: b, value: GROUP[b][h[t][b]] ?? h[t][b] }, then: what });
  }
  out.push(...out.filter(r => r.type === 'before').map(r => ({ ...r, then: 'any' })));
  const order = combineFirst ? { before: 0, with: 1, persists: 2 } : { before: 0, persists: 1, with: 2 };   // single cards first; then combine, or look for duration
  return out.map((r, i) => [r, i]).sort((x, y) => (x[0].then === 'any') - (y[0].then === 'any') || order[x[0].type] - order[y[0].type] || x[1] - y[1]).map(x => x[0]);
}

// One team's submissions: every participant evaluates up to `tries` proposals; graduated ones go up.
export function room(archive, team, { tries = 4, n = PER_TEAM } = {}) {
  const H = archive.map(h => h.obs), subs = [];
  for (let i = 0; i < n; i++) {
    const frag = fragment(archive, team, i);
    for (const rule of proposals(frag, i % 4 === 0).slice(0, tries)) {   // stop at the first rule that graduates; a quarter combine before they look at duration
      const e = evaluate(rule, H);
      if (e.verdict === 'graduates') { subs.push({ team, who: frag.id, rule, score: e.score, verdict: e.verdict, e }); break; }
    }
  }
  return subs;
}

// Cluster identical rules (a WITH of two single cards is the same rule either way round).
export function canonical(r) {
  if (r.type === 'with' && (r.n ?? 1) === 1 && r.b && `${r.b.key}${r.b.value}` < `${r.a.key}${r.a.value}`) return { ...r, a: r.b, b: r.a };
  return r;
}
export function cluster(subs) {
  const m = new Map();
  for (const s of subs) {
    const r = canonical(s.rule), k = ruleKey(r);
    if (!m.has(k)) m.set(k, { rule: r, score: s.score, e: s.e, who: [] });
    m.get(k).who.push(s.who);
  }
  return [...m.values()].sort((a, b) => b.who.length - a.who.length || b.score - a.score);
}
