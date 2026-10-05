// Rover Run rules (v1.9). Pure: no DOM. Shared by the game and tools/sim.mjs.
// Everything is a card, so the game plays the same on a table.
//
// One action at a time: 'go' (1 turn) or 'avoid' (a detour, 2 turns) the next square, or
// 'recharge' (1 turn). Every square has four cards: slope, ground, dust and battery. The battery
// card is dead on a square with a death condition (SAND or STORM), full otherwise. When you get
// past a square, apply its battery card: dead means recharge before your next move, or the rover
// dies. Three lives: a death costs one, and the rover restarts on the square before, battery full.

export const RULES = { spareTurns: 12, avoidTurns: 2, finishBonus: 3, lives: 3 };
export const batteryCard = row => (row.ground === 'sand' || row.dust === 'storm') ? 'dead' : 'full';

export function newRun(deck, rules = RULES) {
  return { rules, n: deck.length, pos: 0, battery: 'full', turn: 0, turns: deck.length + rules.spareTurns,
           lives: rules.lives ?? 1, score: 0, log: [], end: null };
}

export function act(deck, s, action) {
  if (s.end) return s;
  const row = deck[s.pos], t = { ...s, log: [...s.log] };
  const step = { action, pos: s.pos, from: s.battery };
  if (action === 'recharge') { t.battery = 'full'; t.turn += 1; }
  else if (action !== 'go' && action !== 'avoid') return s;
  else if (s.battery === 'dead') { t.end = 'battery'; t.turn += 1; }       // moving on a dead battery
  else if (action === 'avoid') { t.battery = batteryCard(row); t.pos++; t.score++; t.turn += s.rules.avoidTurns; }
  else if (row.ground === 'sand') { t.end = 'sand'; t.turn += 1; }
  else if (row.dust === 'storm') { t.end = 'storm'; t.turn += 1; }
  else { t.battery = batteryCard(row); t.pos++; t.score++; t.turn += 1; }
  if (t.end && t.end !== 'finish' && t.lives > 1) {            // lose a life; restart before that square
    step.died = t.end; t.end = null; t.lives--; t.battery = 'full';
  }
  if (!t.end && t.pos === t.n) { t.end = 'finish'; t.score += s.rules.finishBonus; }
  if (!t.end && t.turn >= t.turns) t.end = 'time';
  step.to = t.battery; step.score = t.score; step.crossed = t.pos > s.pos;
  t.log.push(step);
  return t;
}
