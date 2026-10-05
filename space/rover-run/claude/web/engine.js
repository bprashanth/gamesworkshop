// Rover Run rules (v1.6). Pure: no DOM. Shared by the game and tools/sim.mjs.
//
// One action per turn: 'go' or 'avoid' the next square, or 'recharge' where you are.
// The battery is binary: a detour (avoid) drains it; moving again on a dead battery
// kills the rover; recharge fills it. Squares + a few spare turns.

export const RULES = { spareTurns: 6, finishBonus: 3 };

export function newRun(deck, rules = RULES) {
  return { rules, n: deck.length, pos: 0, battery: 'full', turn: 0, turns: deck.length + rules.spareTurns,
           score: 0, log: [], end: null };
}

export function act(deck, s, action) {
  if (s.end) return s;
  const row = deck[s.pos], t = { ...s, log: [...s.log], turn: s.turn + 1 };
  const step = { action, pos: s.pos, from: s.battery };
  if (action === 'recharge') t.battery = 'full';
  else if (action !== 'go' && action !== 'avoid') return s;
  else if (s.battery === 'dead') t.end = 'battery';                  // moving on a dead battery
  else if (action === 'avoid') { t.battery = 'dead'; t.pos++; t.score++; }
  else if (row.ground === 'sand') t.end = 'sand';
  else if (row.dust === 'storm') t.end = 'storm';
  else { t.pos++; t.score++; }
  if (!t.end && t.pos === t.n) { t.end = 'finish'; t.score += s.rules.finishBonus; }
  if (!t.end && t.turn >= t.turns) t.end = 'time';
  step.to = t.battery; step.score = t.score; step.crossed = t.pos > s.pos;
  t.log.push(step);
  return t;
}

// The battery card of a square is what crossing it did to you: full after a go, dead after an avoid.
export const batteryAfter = (log, c) => { const l = log.find(x => x.pos === c && x.crossed); return !l ? null : l.action === 'avoid' ? 'dead' : 'full'; };
