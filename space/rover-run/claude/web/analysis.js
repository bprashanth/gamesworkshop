// Strategy analysis shared by tools/sim.mjs and tools/gen.mjs. A strategy decides
// which rows to Avoid using only what a player could know: flipped cards of earlier
// rows and the map's slope. Stop timing is then chosen optimally.
import { newRun, play } from './engine.js';

export function strategies(deck) {
  const steep = r => deck[r].slope === 'steep';
  const prev = (r, k, v) => r > 0 && deck[r - 1][k] === v;
  return {
    'always go':         () => false,
    'always avoid':      () => true,
    'avoid any warning': r => prev(r, 'ground', 'soft') || prev(r, 'dust', 'haze'),
    'slope only':        r => prev(r, 'ground', 'soft') && !steep(r),
    'haze only':         r => prev(r, 'dust', 'haze'),
    'warnings + slope':  r => (prev(r, 'ground', 'soft') && !steep(r)) || prev(r, 'dust', 'haze'),
  };
}

export function best(deck, rules, avoid, sampling = true) {
  const memo = new Map();
  const search = s => {
    if (s.end) return s;
    const key = `${s.pos},${s.battery},${s.stops}`;
    if (memo.has(key)) return memo.get(key);
    let top = null;
    for (const stop of [null, 'recharge', ...(sampling ? ['sample'] : [])]) {
      if (stop && !s.stops) continue;
      const r = search(play(deck, s, stop, avoid[s.pos] ? 'avoid' : 'go'));
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
    while (!s.end) s = play(deck, s, [null, 'recharge', 'sample'][Math.floor(rand() * 3)], rand() < 0.5 ? 'go' : 'avoid');
    sum += s.score;
  }
  return sum / trials;
}

export function hindsight(deck, rules) {
  let top = null;
  for (let mask = 0; mask < 1 << deck.length; mask++) {
    const r = best(deck, rules, deck.map((_, i) => (mask >> i & 1) === 1));
    if (!top || r.score > top.score) top = r;
  }
  return top;
}

export function analyse(deck, rules, { ceiling = true, trials = 20000 } = {}) {
  const S = strategies(deck), runs = {};
  for (const [name, f] of Object.entries(S)) for (const sampling of [true, false])
    runs[name + (sampling ? '' : ' -samples')] = best(deck, rules, deck.map((_, r) => f(r)), sampling);
  const scores = Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, v.score]));
  const rnd = random(deck, rules, trials), top = ceiling ? hindsight(deck, rules) : null;
  const intended = runs['warnings + slope'], max = Math.max(...Object.values(scores));
  const steep = r => deck[r].slope === 'steep', prev = (r, k, v) => r > 0 && deck[r - 1][k] === v;
  const straight = -deck.filter(r => r.ground !== 'sand' && r.dust !== 'storm').reduce((a, r) => a + r.battery, 0);
  const checks = [
    ['intended is the best knowable play', intended.score === max],
    ['intended finishes and samples', intended.end === 'finish' && intended.samples >= 1],
    ...(top ? [['hindsight at most 2 above intended', top.score - intended.score <= 2]] : []),
    ['only intended within 10%', Object.entries(scores).filter(([k, v]) => !k.startsWith('warnings + slope') && v >= 0.9 * max).length === 0],
    ['random below 40%', rnd < 0.4 * max],
    ['ignoring slope costs 3+', intended.score - scores['avoid any warning'] >= 3],
    ['ignoring haze dies', runs['slope only'].end === 'storm'],
    ['straight-through below start battery', straight < rules.battery],
    // Every death must be foreseeable from flipped cards plus the map.
    ['sand only after soft, never steep', deck.every((r, i) => r.ground !== 'sand' || (prev(i, 'ground', 'soft') && !steep(i)))],
    ['storm only after haze', deck.every((r, i) => r.dust !== 'storm' || prev(i, 'dust', 'haze'))],
    ['soft before non-steep is always sand', deck.every((r, i) => !prev(i, 'ground', 'soft') || steep(i) || r.ground === 'sand')],
    ['battery card is -1 on soft or haze', deck.every(r => r.battery === ((r.ground === 'sand' || r.dust === 'storm') ? 0 : (r.ground === 'soft' || r.dust === 'haze') ? -1 : 0))],
    ['some warnings are false alarms', deck.some((r, i) => prev(i, 'dust', 'haze') && r.dust !== 'storm') && deck.some((r, i) => prev(i, 'ground', 'soft') && r.ground !== 'sand')],
  ];
  return { runs, scores, random: rnd, ceiling: top, straight, checks, pass: checks.every(c => c[1]) };
}

export const trace = s => s.log.map(l => (({ recharge: 'r', sample: 's' })[l.stop] ?? '') + (l.move === 'go' ? 'G' : 'A')).join(' ');
