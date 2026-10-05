// Rover Run rules, one row at a time. Pure: no DOM. Shared by the game and tools/sim.mjs.
//
// Each row the player picks two values, exactly like a line of the team sheet:
//   stop: null | 'recharge' | 'sample'   (spends one of the spare turns, before driving)
//   move: 'go' | 'avoid'
// then that row's four cards flip.

export const RULES = { battery: 8, stops: 5, avoidCost: 2, recharge: 2, finishBonus: 3 };

export function newRun(deck, rules = RULES) {
  return { rules, n: deck.length, pos: 0, battery: rules.battery, stops: rules.stops, score: 0,
           samples: 0, log: [], end: null };
}

export function play(deck, s, stop, move) {
  if (s.end || (stop && s.stops === 0)) return s;
  const row = deck[s.pos], t = { ...s, log: [...s.log] };
  const step = { pos: s.pos, stop, move, from: s.battery };
  if (stop) t.stops--;
  if (stop === 'recharge') t.battery += s.rules.recharge;
  if (stop === 'sample') { t.score++; t.samples++; }
  if (move === 'go') {
    if (row.ground === 'sand') t.end = 'sand';
    else if (row.dust === 'storm') t.end = 'storm';
    else t.battery += row.battery;
  } else t.battery -= s.rules.avoidCost;
  if (!t.end && t.battery <= 0) t.end = 'battery';
  if (!t.end) { t.pos++; t.score++; }
  if (!t.end && t.pos === t.n) { t.end = 'finish'; t.score += s.rules.finishBonus; }
  step.to = t.battery;
  t.log.push(step);
  return t;
}

// The rulebook's battery card: -1 on soft or hazy rows, 0 otherwise.
export const batteryCard = (ground, dust) => (ground === 'soft' || dust === 'haze') ? -1 : 0;
