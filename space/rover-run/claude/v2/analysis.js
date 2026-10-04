// v2 strategies. Each is a policy using only what a player could know: the map's
// slope for every row, flipped cards of earlier rows, and cards they sampled.
import { newRun, act, canAct, danger } from './engine.js';

const knows = (s, k) => s.peeks[s.pos]?.includes(k);
export function policies(deck) {
  const slope = r => deck[r]?.slope, prev = (s, k, v) => s.pos > 0 && deck[s.pos - 1][k] === v;
  const softWarn = s => prev(s, 'ground', 'soft') && slope(s.pos) !== 'steep';
  const hazeWarn = s => prev(s, 'dust', 'haze');
  const decide = (bad, s) => bad ? (canAct(s, 'avoid') ? ['avoid', 'danger'] : ['go', 'danger']) : ['go', 'safe'];
  return {
    'always go': s => ['go', 'safe'],
    'always avoid': s => decide(true, s),
    'avoid any warning': s => decide(prev(s, 'ground', 'soft') || hazeWarn(s), s),
    'slope only': s => decide(softWarn(s), s),
    'warnings + slope': s => decide(softWarn(s) || hazeWarn(s), s),
    'sample every warning': s => {
      if (prev(s, 'ground', 'soft') && !knows(s, 'ground') && canAct(s, 'sample')) return ['sample', 'ground'];
      if (hazeWarn(s) && !knows(s, 'dust') && canAct(s, 'sample')) return ['sample', 'dust'];
      return decide(danger(deck[s.pos]) && (knows(s, 'ground') || knows(s, 'dust')) || (softWarn(s) && !knows(s, 'ground')) || (hazeWarn(s) && !knows(s, 'dust')), s);
    },
    'sample every row': s => {
      if (!knows(s, 'dust') && canAct(s, 'sample')) return ['sample', 'dust'];
      return decide(softWarn(s) || (knows(s, 'dust') ? deck[s.pos].dust === 'storm' : hazeWarn(s)), s);
    },
    // intended: slope answers soft; only a dust sample answers haze
    'slope + sample haze': s => {
      if (hazeWarn(s) && !knows(s, 'dust') && canAct(s, 'sample')) return ['sample', 'dust'];
      const storm = knows(s, 'dust') ? deck[s.pos].dust === 'storm' : hazeWarn(s);
      return decide(softWarn(s) || storm, s);
    },
  };
}

export function playPolicy(deck, rules, policy) {
  let s = newRun(deck, rules);
  while (!s.end) { const [a, arg] = policy(s); const t = act(deck, s, a, arg); if (t === s) break; s = t; }
  return s;
}

export function random(deck, rules, trials = 20000) {
  let sum = 0, seed = 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < trials; i++) {
    let s = newRun(deck, rules);
    while (!s.end) {
      const x = rand(), call = rand() < 0.5 ? 'safe' : 'danger';
      const t = x < 0.4 ? act(deck, s, 'go', call) : x < 0.75 ? act(deck, s, 'avoid', call) : act(deck, s, 'sample', rand() < 0.5 ? 'ground' : 'dust');
      s = t === s ? act(deck, s, 'go', call) : t;
    }
    sum += s.score;
  }
  return sum / trials;
}

export function analyse(deck, rules) {
  const runs = Object.fromEntries(Object.entries(policies(deck)).map(([k, p]) => [k, playPolicy(deck, rules, p)]));
  const scores = Object.fromEntries(Object.entries(runs).map(([k, r]) => [k, r.score]));
  const intended = runs['slope + sample haze'], max = Math.max(...Object.values(scores)), rnd = random(deck, rules);
  const steep = i => deck[i].slope === 'steep', prev = (i, k, v) => i > 0 && deck[i - 1][k] === v;
  const hazes = deck.filter((r, i) => i < deck.length - 1 && r.dust === 'haze').length;
  const storms = deck.filter(r => r.dust === 'storm').length;
  const checks = [
    ['intended is the best play', intended.score === max && Object.entries(scores).filter(([k, v]) => v === max).length === 1],
    ['intended finishes', intended.end === 'finish'],
    ['others below 90% of intended', Object.entries(scores).every(([k, v]) => k === 'slope + sample haze' || v < 0.9 * max)],
    ['random below 40%', rnd < 0.4 * max],
    ['ignoring slope costs 3+', intended.score - scores['avoid any warning'] >= 3],
    ['not sampling haze costs 2+', intended.score - scores['warnings + slope'] >= 2],
    ['ignoring haze dies', runs['slope only'].end === 'storm'],
    ['sampling everything does not finish', runs['sample every row'].end !== 'finish'],
    ['sand only after soft, never steep', deck.every((r, i) => r.ground !== 'sand' || (prev(i, 'ground', 'soft') && !steep(i)))],
    ['soft before non-steep is always sand', deck.every((r, i) => !prev(i, 'ground', 'soft') || steep(i) || r.ground === 'sand')],
    ['storm only after haze', deck.every((r, i) => r.dust !== 'storm' || prev(i, 'dust', 'haze'))],
    ['haze is usually a false alarm (25–50% storms)', storms / hazes >= 0.25 && storms / hazes <= 0.5],
  ];
  return { runs, scores, random: rnd, checks, pass: checks.every(c => c[1]) };
}

export const trace = s => s.log.map(l => l.action === 'sample' ? (l.arg === 'dust' ? 'd' : 'g') : (l.action === 'go' ? 'G' : 'A') + (l.right ? '' : '✗')).join(' ');
