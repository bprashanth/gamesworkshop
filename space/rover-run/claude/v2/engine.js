// Rover Run v2 rules. Two decks (ground, dust); slope is printed on the map; a turn
// track replaces the battery. Pure: no DOM.
//
// Each turn, one of:
//   go(call)        drive the row ahead            1 turn
//   avoid(call)     detour around it               2 turns
//   sample(card)    reveal one card of the row ahead ('ground' | 'dust')   1 turn
// A call is the player's prediction for the row ahead: 'safe' or 'danger'. After go or
// avoid, both cards of that row flip and the call is scored.

export const RULES = { turns: 22, avoidTurns: 2, finishBonus: 3 };
export const danger = row => row.ground === 'sand' || row.dust === 'storm';

export function newRun(deck, rules = RULES) {
  return { rules, n: deck.length, pos: 0, turn: 0, turns: rules.turns, rows: 0, right: 0, calls: 0,
           score: 0, peeks: {}, log: [], end: null };
}

export function canAct(s, action) {
  if (s.end) return false;
  const left = s.turns - s.turn;
  if (action === 'avoid') return left >= s.rules.avoidTurns;
  if (action === 'sample') return left >= 2;                  // a sample must leave a turn to use it
  return left >= 1;
}

export function act(deck, s, action, arg) {
  if (!canAct(s, action)) return s;
  const row = deck[s.pos], t = { ...s, log: [...s.log], peeks: { ...s.peeks } };
  const step = { pos: s.pos, action, arg, turn: s.turn };
  if (action === 'sample') {
    if (t.peeks[s.pos]?.includes(arg)) return s;
    t.peeks[s.pos] = [...(t.peeks[s.pos] ?? []), arg];
    t.turn += 1;
  } else {
    t.calls++;
    const right = (arg === 'danger') === danger(row);
    if (right) t.right++;
    step.right = right;
    t.turn += action === 'avoid' ? s.rules.avoidTurns : 1;
    if (action === 'go' && danger(row)) t.end = row.ground === 'sand' ? 'sand' : 'storm';
    else { t.pos++; t.rows++; }
  }
  if (!t.end && t.pos === t.n) t.end = 'finish';
  if (!t.end && t.turn >= t.turns) t.end = 'time';
  t.score = t.rows + t.right + (t.end === 'finish' ? s.rules.finishBonus : 0);
  step.score = t.score;
  t.log.push(step);
  return t;
}
