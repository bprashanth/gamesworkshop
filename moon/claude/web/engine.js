// Moon Run rules. Pure: no DOM. Shared by the game and tools/sim.mjs. Everything is a card.
//
// 14 squares. Each has five cards measured there (light, temperature, ground, slope, battery) and,
// on a separate row, what happened there (safe, POWER LOSS, FROZEN, STUCK). What happens on a
// square follows from the square before it, so the only evidence for the square ahead is behind you.
// One action per square: 'go' (drive it, +1) or 'avoid' (detour round it, scores nothing). Driving
// into a failure costs a life and 2 points, and the rover restarts before that square. +3 for
// finishing. No recharge and no clock: nothing about the rover is hidden state.
// Why -2: Rover Run charges a death in turns (its clock), but Moon has no recharge, so no clock;
// without a cost, a model that drove into two failures tied a perfect one (tools/sim.mjs).

export const RULES = { finishBonus: 3, lives: 3, failCost: 2 };

export function newRun(route, rules = RULES) {
  return { rules, n: route.length, pos: 0, lives: rules.lives, score: 0, log: [], end: null };
}

export function act(route, s, action) {
  if (s.end || (action !== 'go' && action !== 'avoid')) return s;
  const sq = route[s.pos], t = { ...s, log: [...s.log] };
  const step = { action, pos: s.pos };
  if (action === 'avoid') t.pos++;
  else if (sq.outcome !== 'safe') { step.died = sq.outcome; t.lives--; t.score -= s.rules.failCost ?? 0; if (!t.lives) t.end = sq.outcome; }
  else { t.pos++; t.score++; }
  if (!t.end && t.pos === t.n) { t.end = 'finish'; t.score += s.rules.finishBonus; }
  step.score = t.score; step.crossed = t.pos > s.pos;
  t.log.push(step);
  return t;
}

// The best possible score on a route: drive every safe square, finish.
export const bestScore = (route, rules = RULES) => route.filter(q => q.outcome === 'safe').length + rules.finishBonus;
