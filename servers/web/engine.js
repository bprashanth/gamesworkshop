// Servers rules. Pure: no DOM. Shared by the game and tools/sim.mjs.
// The same game as Rover Run (space/rover-run/src), retold as running a small online service.
// Everything is a card, so the same game plays on a table.
//
// 14 months. One action per turn: 'scale' (scale up servers and serve the month ahead), 'market'
// (spend the month on outreach instead), or 'apply' (apply for funding; you stay where you are).
// Every month has four cards: queries, users, servers and funds. Two months end the run if you
// scale into them: users GONE (servers for nobody) and servers BURNING (new servers arrive too
// late). The funds card is the money you arrive with: empty in the month right after a hazard you
// marketed your way round, full otherwise. Before moving on from a month whose funds card is
// empty, apply for funding, or the service goes broke. Only months you scale through score;
// a marketing month scores nothing. Three lives: a death costs one, and you restart that month.

export const RULES = { spareTurns: 8, finishBonus: 3, lives: 3 };
const hazard = m => !!m && (m.users === 'gone' || m.servers === 'burning');
export const fundsCard = (deck, c) => hazard(deck[c - 1]) ? 'empty' : 'full';   // arriving after marketing round a hazard

export function newRun(deck, rules = RULES) {
  return { rules, n: deck.length, pos: 0, funds: 'full', turn: 0, turns: deck.length + rules.spareTurns,
           lives: rules.lives ?? 1, score: 0, log: [], end: null };
}

export function act(deck, s, action) {
  if (s.end) return s;
  const m = deck[s.pos], t = { ...s, log: [...s.log] };
  const step = { action, pos: s.pos, from: s.funds };
  if (action === 'apply') { t.funds = 'full'; t.turn += 1; }
  else if (action !== 'scale' && action !== 'market') return s;
  else if (s.funds === 'empty') { t.end = 'broke'; t.turn += 1; }          // moving on with no money
  else if (action === 'market') { t.pos++; t.turn += 1; }                  // a marketing month scores nothing
  else if (m.users === 'gone') { t.end = 'gone'; t.turn += 1; }            // servers for nobody
  else if (m.servers === 'burning') { t.end = 'burning'; t.turn += 1; }    // new servers arrive too late
  else { t.pos++; t.score++; t.turn += 1; }
  if (!t.end && t.pos > s.pos && t.pos < t.n) t.funds = deck[t.pos].funds ?? fundsCard(deck, t.pos);   // arrive with this month's money
  if (t.end && t.end !== 'finish' && t.lives > 1) {                       // lose a life; restart that month
    step.died = t.end; t.end = null; t.lives--; t.funds = 'full';
  }
  if (!t.end && t.pos === t.n) { t.end = 'finish'; t.score += s.rules.finishBonus; }
  if (!t.end && t.turn >= t.turns) t.end = 'time';
  step.to = t.funds; step.score = t.score; step.crossed = t.pos > s.pos;
  t.log.push(step);
  return t;
}
