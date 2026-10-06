// Strategy analysis shared by tools/sim.mjs. A strategy decides which months to market (dodge)
// using only what a player could know: cards of earlier months and the chart's query level.
// Funding timing is then chosen optimally. Mirrors space/rover-run/src/web/analysis.js.
import { newRun, act } from './engine.js';

export function strategies(deck) {
  const queries = r => deck[r].queries, prev = (r, k, v) => r > 0 && deck[r - 1][k] === v;
  const goneRisk = r => prev(r, 'users', 'few') && queries(r) !== 'flood';        // users vanish after a few, never into a flood
  const burnRisk = r => prev(r, 'servers', 'warm') && queries(r) !== 'whisper';   // servers burn after warm AND real traffic
  return {
    'always scale':       () => false,
    'always market':      () => true,
    'market any warning': r => prev(r, 'users', 'few') || prev(r, 'servers', 'warm'),
    'warm ignores queries': r => goneRisk(r) || prev(r, 'servers', 'warm'),
    'few ignores queries':  r => prev(r, 'users', 'few') || burnRisk(r),
    'users only':         r => goneRisk(r),
    'servers only':       r => burnRisk(r),
    'model (intended)':   r => goneRisk(r) || burnRisk(r),
    // Looking ahead before deciding (Hard: 2 cards; Medium: everything but funds)
    'look 2: users + servers':  r => deck[r].users === 'gone' || deck[r].servers === 'burning',
    'look 2: queries + funds':  r => goneRisk(r) || burnRisk(r),          // funds say nothing about this month's hazard
    'look 2: queries + users':  r => deck[r].users === 'gone',
  };
}

export function best(deck, rules, plan, apply = true) {
  const memo = new Map();
  const search = s => {
    if (s.end) return s;
    const key = `${s.pos},${s.funds},${s.turn}`;
    if (memo.has(key)) return memo.get(key);
    let top = null;
    for (const a of [...(apply && s.funds === 'empty' ? ['apply'] : []), plan[s.pos] ? 'market' : 'scale']) {
      const r = search(act(deck, s, a));
      if (!top || r.score > top.score) top = r;
    }
    memo.set(key, top);
    return top;
  };
  return search(newRun(deck, rules));
}

export function random(deck, rules, trials = 20000) {
  let sum = 0, seed = 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < trials; i++) {
    let s = newRun(deck, rules);
    while (!s.end) s = act(deck, s, ['scale', 'market', 'apply'][Math.floor(rand() * 3)]);
    sum += s.score;
  }
  return sum / trials;
}

// Strategies are judged with one life (does this way of reading the cards survive?).
export function analyse(deck, allRules) {
  const rules = { ...allRules, lives: 1 }, S = strategies(deck), runs = {};
  for (const [name, f] of Object.entries(S)) runs[name] = best(deck, rules, deck.map((_, r) => f(r)));
  runs['model, never apply'] = best(deck, rules, deck.map((_, r) => S['model (intended)'](r)), false);
  const scores = Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, v.score]));
  const rnd = random(deck, rules), intended = runs['model (intended)'];
  const blind = Object.fromEntries(Object.entries(scores).filter(([k]) => !k.startsWith('look')));
  const max = Math.max(...Object.values(blind));
  const prev = (i, k, v) => i > 0 && deck[i - 1][k] === v, idx = deck.map((_, i) => i);
  const count = f => idx.filter(f).length;
  const warmReal = idx.filter(i => prev(i, 'servers', 'warm') && deck[i].queries !== 'whisper');
  const burnRate = warmReal.filter(i => deck[i].servers === 'burning').length / (warmReal.length || 1);
  const checks = [
    ['the model is the unique best play without looking ahead', intended.score === max && Object.values(blind).filter(v => v === max).length === 1],
    ['Hard: looking at users + servers finishes', runs['look 2: users + servers'].end === 'finish'],
    ['Hard: queries + users misses the outages', runs['look 2: queries + users'].end === 'burning'],
    ['Hard: users + servers beats queries + funds', runs['look 2: users + servers'].score > runs['look 2: queries + funds'].score],
    ['funds card is empty exactly in the month after a GONE or BURNING', deck.every((m, i) => (m.funds === 'empty') === (i > 0 && (deck[i - 1].users === 'gone' || deck[i - 1].servers === 'burning')))],
    ['the model finishes', intended.end === 'finish'],
    ['marketing every warning costs 3+ points', intended.score - scores['market any warning'] >= 3],
    ['ignoring queries for warm costs 2+ points', intended.score - scores['warm ignores queries'] >= 2],
    ['ignoring queries for few costs 2+ points', intended.score - scores['few ignores queries'] >= 2],
    ['always marketing scores under half', scores['always market'] < intended.score / 2],
    ['never applying goes broke', runs['model, never apply'].end === 'broke'],
    ['random below 40%', rnd < 0.4 * max],
    // the patterns the room is asked to find
    ['GONE recurs (3+)', count(i => deck[i].users === 'gone') >= 3],
    ['BURNING recurs (3+)', count(i => deck[i].servers === 'burning') >= 3],
    ['GONE only right after few', idx.every(i => deck[i].users !== 'gone' || prev(i, 'users', 'few'))],
    ['GONE never in a flood month', idx.every(i => deck[i].users !== 'gone' || deck[i].queries !== 'flood')],
    ['few before a flood is never GONE (2+ cases)', count(i => prev(i, 'users', 'few') && deck[i].queries === 'flood') >= 2 && idx.every(i => !(prev(i, 'users', 'few') && deck[i].queries === 'flood' && deck[i].users === 'gone'))],
    ['BURNING only right after warm', idx.every(i => deck[i].servers !== 'burning' || prev(i, 'servers', 'warm'))],
    ['BURNING never in a whisper month', idx.every(i => deck[i].servers !== 'burning' || deck[i].queries !== 'whisper')],
    ['warm before a whisper never burns (2+ cases)', count(i => prev(i, 'servers', 'warm') && deck[i].queries === 'whisper') >= 2],
    ['warm + real traffic burns often but not always', burnRate >= 0.5 && burnRate < 1],
  ];
  return { runs, scores, random: rnd, checks, pass: checks.every(c => c[1]), burnRate };
}

export const trace = s => s.log.map(l => ({ scale: 'S', market: 'M', apply: 'F' })[l.action]).join(' ');
