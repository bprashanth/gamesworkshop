// Rover Run rules (v1.4). Pure: no DOM. Shared by the game and tools/sim.mjs.
//
// One action per turn: 'go' or 'avoid' the next square, or 'recharge' where you are.
// 14 squares + a few spare turns; recharging spends one of them.

export const RULES = { battery: 8, spareTurns: 5, avoidCost: 2, recharge: 2, finishBonus: 3 };

export function newRun(deck, rules = RULES) {
  return { rules, n: deck.length, pos: 0, battery: rules.battery, turn: 0, turns: deck.length + rules.spareTurns,
           score: 0, log: [], end: null };
}

export function act(deck, s, action) {
  if (s.end) return s;
  const row = deck[s.pos], t = { ...s, log: [...s.log], turn: s.turn + 1 };
  const step = { action, pos: s.pos, from: s.battery };
  if (action === 'recharge') t.battery += s.rules.recharge;
  else if (action === 'go') {
    if (row.ground === 'sand') t.end = 'sand';
    else if (row.dust === 'storm') t.end = 'storm';
    else { t.battery += row.battery; t.pos++; t.score++; }
  } else if (action === 'avoid') { t.battery -= s.rules.avoidCost; t.pos++; t.score++; }
  else return s;
  if (!t.end && t.battery <= 0) t.end = 'battery';
  if (!t.end && t.pos === t.n) { t.end = 'finish'; t.score += s.rules.finishBonus; }
  if (!t.end && t.turn >= t.turns) t.end = 'time';
  step.to = t.battery; step.score = t.score;
  t.log.push(step);
  return t;
}

// The rulebook's battery card: -1 on soft or hazy squares, 0 otherwise.
export const batteryCard = (ground, dust) => (ground === 'soft' || dust === 'haze') ? -1 : 0;
