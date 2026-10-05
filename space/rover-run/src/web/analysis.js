// Strategy analysis shared by tools/sim.mjs. A strategy decides which squares to Avoid
// using only what a player could know: flipped cards of earlier squares and the map's
// slope. Recharge timing is then chosen optimally.
import { newRun, act } from './engine.js';

export function strategies(deck) {
  const slope = r => deck[r].slope, prev = (r, k, v) => r > 0 && deck[r - 1][k] === v;
  const sandRisk = r => prev(r, 'ground', 'soft') && slope(r) !== 'steep';    // sand needs soft before, never on steep
  const stormRisk = r => prev(r, 'dust', 'haze') && slope(r) !== 'flat';      // a storm needs haze before AND a slope
  return {
    'always go':          () => false,
    'always avoid':       () => true,
    'avoid any warning':  r => prev(r, 'ground', 'soft') || prev(r, 'dust', 'haze'),
    'haze ignores slope': r => sandRisk(r) || prev(r, 'dust', 'haze'),
    'soft ignores slope': r => prev(r, 'ground', 'soft') || stormRisk(r),
    'ground only':        r => sandRisk(r),
    'dust only':          r => stormRisk(r),
    'model (intended)':   r => sandRisk(r) || stormRisk(r),
    // Looking ahead (Medium: 2 cards of the square ahead, Hard: 1) before deciding.
    'look 2: ground + dust':     r => deck[r].ground === 'sand' || deck[r].dust === 'storm',
    'look 1: the model chooses': r => {                      // the indicator says which card to check
      if (sandRisk(r) && stormRisk(r)) return true;          // both risks, one look: still detour
      if (sandRisk(r)) return deck[r].ground === 'sand';
      if (stormRisk(r)) return deck[r].dust === 'storm';
      return false;
    },
    'look 1: always ground':     r => deck[r].ground === 'sand',
    'look 1: always dust':       r => deck[r].dust === 'storm',
    'look 1: always slope':      () => false,                // slope is already on the map
  };
}

export function best(deck, rules, avoid, recharge = true) {
  const memo = new Map();
  const search = s => {
    if (s.end) return s;
    const key = `${s.pos},${s.battery},${s.turn}`;
    if (memo.has(key)) return memo.get(key);
    let top = null;
    for (const a of [...(recharge ? ['recharge'] : []), avoid[s.pos] ? 'avoid' : 'go']) {
      if (a === 'recharge' && s.battery === 'full') continue;
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
    while (!s.end) s = act(deck, s, ['go', 'avoid', 'recharge'][Math.floor(rand() * 3)]);
    sum += s.score;
  }
  return sum / trials;
}

export function analyse(deck, rules) {
  const S = strategies(deck), runs = {};
  for (const [name, f] of Object.entries(S)) runs[name] = best(deck, rules, deck.map((_, r) => f(r)));
  runs['model, never recharge'] = best(deck, rules, deck.map((_, r) => S['model (intended)'](r)), false);
  const scores = Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, v.score]));
  const rnd = random(deck, rules), intended = runs['model (intended)'];
  const blind = Object.fromEntries(Object.entries(scores).filter(([k]) => !k.startsWith('look')));
  const max = Math.max(...Object.values(blind));
  const prev = (i, k, v) => i > 0 && deck[i - 1][k] === v, idx = deck.map((_, i) => i);
  const count = f => idx.filter(f).length;
  const hazeSlope = idx.filter(i => prev(i, 'dust', 'haze') && deck[i].slope !== 'flat');
  const stormRate = hazeSlope.filter(i => deck[i].dust === 'storm').length / (hazeSlope.length || 1);
  const checks = [
    ['the model is the unique best play without looking ahead', intended.score === max && Object.values(blind).filter(v => v === max).length === 1],
    ['Hard (1 look): the model-chosen look finishes', runs['look 1: the model chooses'].end === 'finish'],
    ['Hard (1 look): always looking at ground dies in a storm', runs['look 1: always ground'].end === 'storm'],
    ['Hard (1 look): always looking at dust dies in sand', runs['look 1: always dust'].end === 'sand'],
    ['Hard (1 look): looking at slope is no help', runs['look 1: always slope'].end === 'sand' || runs['look 1: always slope'].end === 'storm'],
    ['Medium (2 looks): ground + dust finishes', runs['look 2: ground + dust'].end === 'finish'],
    ['the model finishes', intended.end === 'finish'],
    ['avoiding every warning does not finish', runs['avoid any warning'].end !== 'finish'],
    ['haze without slope costs the finish', runs['haze ignores slope'].end !== 'finish'],
    ['soft without slope costs the finish', runs['soft ignores slope'].end !== 'finish'],
    ['never recharging dies of battery', runs['model, never recharge'].end === 'battery'],
    ['random below 40%', rnd < 0.4 * max],
    // the patterns the room is asked to find
    ['sand recurs (3+)', count(i => deck[i].ground === 'sand') >= 3],
    ['storm recurs (3+)', count(i => deck[i].dust === 'storm') >= 3],
    ['sand only right after soft', idx.every(i => deck[i].ground !== 'sand' || prev(i, 'ground', 'soft'))],
    ['sand never on steep', idx.every(i => deck[i].ground !== 'sand' || deck[i].slope !== 'steep')],
    ['soft before steep is never sand (2+ cases)', count(i => prev(i, 'ground', 'soft') && deck[i].slope === 'steep') >= 2 && idx.every(i => !(prev(i, 'ground', 'soft') && deck[i].slope === 'steep' && deck[i].ground === 'sand'))],
    ['storm only after haze', idx.every(i => deck[i].dust !== 'storm' || prev(i, 'dust', 'haze'))],
    ['storm never on flat', idx.every(i => deck[i].dust !== 'storm' || deck[i].slope !== 'flat')],
    ['haze before flat never storms (2+ cases)', count(i => prev(i, 'dust', 'haze') && deck[i].slope === 'flat') >= 2],
    ['haze + slope storms often but not always', stormRate >= 0.5 && stormRate < 1],
  ];
  return { runs, scores, random: rnd, checks, pass: checks.every(c => c[1]), stormRate };
}

export const trace = s => s.log.map(l => ({ go: 'G', avoid: 'A', recharge: 'R' })[l.action]).join(' ');
