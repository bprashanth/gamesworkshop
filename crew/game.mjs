/** Phase 1 rules. Game mutations validate moves; bots receive publicView only. */
export const SUITS = [
  { id: 'model', name: 'MODEL', color: '#7da5e6' },
  { id: 'data', name: 'DATA', color: '#eab565' },
  { id: 'tools', name: 'TOOLS', color: '#95c99b' },
  { id: 'verification', name: 'VERIFICATION', color: '#cba0d7' },
  { id: 'compute', name: 'COMPUTE', color: '#ec8e7b' },
];
const definitions = {
  model: [
    ['Small model', '9B', 'A small model for simpler tasks.'],
    ['Laptop-size model', '27B', 'A larger model for relatively small hardware.'],
    ['Large model', '70–120B', 'A powerful large open model.'],
    ['Frontier open model', 'GLM-5.3 class', 'Frontier-scale weights we can run ourselves.'],
    ['Frontier closed model', 'OpenAI / Claude class', 'A frontier model from an external provider.'],
  ],
  data: [
    ['Human report', '', 'An astronaut examines the surface.'],
    ['Local database', '', 'Rely on old recorded data.'],
    ['Ship sensors', '', 'Get data through the ship.'],
    ['External feed', 'Another ship', 'Get data from another ship.'],
    ['Orbital scan', 'Satellite', 'Get data from the space station cloud.'],
  ],
  tools: [
    ['Read files', '', 'The model may open files.'],
    ['Query database', '', 'The model may query the ship database.'],
    ['Search network', 'Ships + station web', 'Search other ships and the station network.'],
    ['Run code', '', 'Run simulations before answering.'],
    ['Control robot / ship', '', 'The model may take real actions on its own.'],
  ],
  verification: [
    ['Rule check', '', 'Check against simple known rules.'],
    ['Second sensor', '', 'Check whether another sensor agrees.'],
    ['Second model', '', 'Another model independently checks the answer.'],
    ['Human review', '', 'A crew member checks the answer.'],
    ['Expert review', '', 'A specialist checks the answer.'],
  ],
  compute: [
    ['Suit chip / phone', '', 'Run on a tiny computer carried by the astronaut.'],
    ['Crew laptop', '', 'Run on a normal onboard computer.'],
    ['Ship computer', '', 'Run on the ship’s main server.'],
    ['Station mainframe', '', 'Run on powerful space station hardware.'],
    ['Station cloud', '', 'Use the largest remote compute available.'],
  ],
};
export const CARD_TYPES = SUITS.flatMap(({id:suit}) => definitions[suit].map(([name, detail, description], i) => ({ id: `${suit}-${i+1}`, suit, rank: i+1, name, detail, description })));
export function createDeck() { return CARD_TYPES.flatMap(card => [0,1].map(copy => ({...card, typeId: card.id, id: `${card.id}-${copy}`, copy}))); }
export function seededRng(seed = 1) {
  let a = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((h,c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function createGame(seed = 1, {winner = 'highest'} = {}) {
  requireMove(['highest','lowest'].includes(winner), 'Unknown winner rule.');
  const deck = createDeck(), rng = seededRng(seed);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i+1)); [deck[i],deck[j]] = [deck[j],deck[i]]; }
  const players = ['You', 'Nova', 'Pip', 'Orbit', 'Echo'].map((name,id) => ({id,name, hand:[],signal:null,signalUsed:false}));
  for (let i = 0; i < 25; i++) players[i % 5].hand.push(deck[i]);
  for (const player of players) player.hand.sort((a,b) => SUITS.findIndex(s=>s.id===a.suit)-SUITS.findIndex(s=>s.id===b.suit)||a.rank-b.rank);
  return {seed,rules:{winner},players,commander:0,phase:'call',calledSuit:null,turn:null,trick:[],lastTrick:null,history:[],stack:[],discard:[],round:1,failed:false,failureReason:null};
}
export function remainingSuits(state) { return SUITS.filter(s => !state.stack.some(entry => entry.suit === s.id)).map(s=>s.id); }
export function totalCost(state) { return state.stack.reduce((sum,entry)=>sum+entry.card.rank,0); }
function requireMove(condition, message) { if (!condition) throw new Error(message); }
export function callSuit(state, suit) {
  requireMove(state.phase === 'call', 'Wait until the Commander can call a suit.');
  requireMove(remainingSuits(state).includes(suit), 'Choose an unbuilt suit.');
  state.calledSuit = suit; state.phase = 'play'; state.turn = state.commander; state.trick = []; return state;
}
export function legalCards(state, seat = state.turn) {
  const hand = state.players ? state.players[seat]?.hand : state.hand;
  // Public views deliberately contain no opponent hands.
  const cards = hand || (state.seat === seat ? state.hand : []) || [];
  if (state.phase !== 'play' || state.turn !== seat) return [];
  const matching = cards.filter(card => card.suit === state.calledSuit);
  return matching.length ? matching : cards;
}
export function playCard(state, seat, cardId) {
  requireMove(state.phase === 'play' && state.turn === seat, 'Wait for your turn.');
  requireMove(legalCards(state,seat).some(card=>card.id===cardId), 'Follow the called suit if you have it.');
  const hand = state.players[seat].hand;
  const [card] = hand.splice(hand.findIndex(card=>card.id===cardId),1);
  state.trick.push({player:seat,card});
  if (state.trick.length === 5) { state.phase = 'resolve'; state.turn = null; }
  else state.turn = (seat + 1) % 5;
  return state;
}
export function resolveTrick(state) {
  requireMove(state.phase === 'resolve', 'All five players must play first.');
  const candidates = state.trick.filter(play=>play.card.suit===state.calledSuit);
  const winner = candidates.reduce((best,play)=>!best||(state.rules.winner==='lowest'?play.card.rank<best.card.rank:play.card.rank>best.card.rank)?play:best,null);
  state.lastTrick = {round:state.round,suit:state.calledSuit,plays:[...state.trick],winner};
  state.history.push(state.lastTrick);
  if (!winner) {
    state.discard.push(...state.trick.map(play=>play.card)); state.failed = true;
    state.failureReason = `No ${SUITS.find(s=>s.id===state.calledSuit).name} card survived to install.`;
    state.phase = 'finished'; state.turn = null; return state;
  }
  state.stack.push({suit:state.calledSuit,card:winner.card,player:winner.player,round:state.round});
  state.discard.push(...state.trick.filter(play=>play!==winner).map(play=>play.card));
  state.commander = winner.player;
  if (state.stack.length === 5) state.phase = 'finished';
  else { state.round++; state.phase = 'call'; state.calledSuit = null; state.trick = []; }
  return state;
}
export function signalOptions(state, seat, cardId) {
  const player = state.players[seat];
  if (!player || player.signalUsed || !['call','play'].includes(state.phase)) return [];
  const card = player.hand.find(card=>card.id===cardId); if (!card) return [];
  const same = player.hand.filter(other=>other.suit===card.suit);
  if (same.length === 1) return ['ONLY'];
  const options = [];
  if (same.every(other=>other.rank >= card.rank)) options.push('LOWEST');
  if (same.every(other=>other.rank <= card.rank)) options.push('HIGHEST');
  return options;
}
export function signalCard(state, seat, cardId, kind) {
  requireMove(signalOptions(state,seat,cardId).includes(kind), 'That signal must truthfully describe a card in your hand.');
  const player = state.players[seat];
  player.signal = {card:{...player.hand.find(card=>card.id===cardId)},kind,round:state.round}; player.signalUsed = true; return state;
}
export function publicView(state, seat) {
  return {
    seat,rules:{...state.rules},hand:state.players[seat].hand.map(c=>({...c})),
    players:state.players.map(p=>({id:p.id,name:p.name,handCount:p.hand.length,signal:p.signal?structuredClone(p.signal):null,signalUsed:p.signalUsed})),
    commander:state.commander,phase:state.phase,calledSuit:state.calledSuit,turn:state.turn,
    trick:structuredClone(state.trick),stack:structuredClone(state.stack),discard:structuredClone(state.discard),round:state.round,
  };
}
const pick = (list,rng) => list[Math.floor(rng()*list.length)];
function activeSignals(view) {
  const out = new Set([...view.discard,...view.stack.map(e=>e.card),...view.trick.map(e=>e.card)].map(c=>c.id));
  return view.players.filter(p=>p.signal&&!out.has(p.signal.card.id)&&p.handCount>0).map(p=>({...p.signal,player:p.id,handCount:p.handCount}));
}
export function botSignal(view) {
  if (view.players[view.seat].signalUsed) return null;
  const unbuilt = remainingSuits(view);
  const ranked = view.hand.filter(c=>unbuilt.includes(c.suit)).sort((a,b)=>a.rank-b.rank || view.hand.filter(c=>c.suit===a.suit).length-view.hand.filter(c=>c.suit===b.suit).length);
  const card = ranked[0]; if (!card) return null;
  return {cardId:card.id,kind:view.hand.filter(c=>c.suit===card.suit).length===1?'ONLY':'LOWEST'};
}
export function botCall(view, rng = Math.random, strategy = 'strategic') {
  const choices = remainingSuits(view); if (strategy === 'random') return pick(choices,rng);
  const signals = activeSignals(view);
  const seen = [...view.discard,...view.stack.map(e=>e.card),...view.trick.map(e=>e.card)];
  const priority = suit => {
    const own = view.hand.filter(c=>c.suit===suit);
    const announced = signals.filter(s=>s.card.suit===suit && s.player!==view.seat);
    const known = [...own,...announced.map(s=>s.card)];
    if (!known.length) return view.rules.winner==='highest' ? 12 : -2 + seen.filter(c=>c.suit===suit).length * .07;
    const cheapest = Math.min(...known.map(c=>c.rank));
    // Secure low cards before off-suit discards eat them. A public singleton is urgent.
    const fragility = announced.some(s=>s.card.rank===cheapest && s.kind==='ONLY') ? .65 : own.length===1 ? .35 : 0;
    if (view.rules.winner === 'lowest') return (6-cheapest) + fragility - known.length*.04;
    const ownMinimum = own.length ? Math.min(...own.map(c=>c.rank)) : 3;
    const coverage = signals.filter(s=>s.card.suit===suit);
    // Leave a publicly covered suit until later: teammates can shed expensive
    // cards knowing the announced cheap card can still complete this part.
    const coverRank = coverage.length ? Math.min(...coverage.map(s=>s.card.rank)) : 6;
    return coverRank*2 + (6-ownMinimum)*.1;
  };
  return choices.map(suit=>({suit,value:priority(suit),tie:rng()})).sort((a,b)=>b.value-a.value||a.tie-b.tie)[0].suit;
}
export function botPlay(view, rng = Math.random, strategy = 'strategic') {
  const legal = legalCards(view,view.seat); if (!legal.length) throw new Error('Bot asked to play out of turn.');
  if (strategy === 'random') return pick(legal,rng).id;
  if (legal[0].suit===view.calledSuit) return [...legal].sort((a,b)=>a.rank-b.rank)[0].id;
  const unbuilt = remainingSuits(view), signals = activeSignals(view);
  const utility = card => {
    if (!unbuilt.includes(card.suit)) return view.rules.winner==='lowest' ? -100 + card.rank : -100;
    const same = view.hand.filter(c=>c.suit===card.suit);
    const lowerOwn = same.some(c=>c.rank<card.rank || (c.rank===card.rank&&c.id<card.id));
    const lowerPartner = signals.some(s=>s.player!==view.seat&&s.card.suit===card.suit&&s.card.rank<=card.rank);
    // Keep one representative of a suit even at rank 5; a missing part cannot qualify.
    if (view.rules.winner === 'lowest') return (6-card.rank)*3 + (lowerOwn ? -18 : 8) + (lowerPartner ? -9 : 0);
    // An announced replacement makes it safe to ditch a costly last card.
    // Without that knowledge, conserve one card per unbuilt suit.
    if (signals.some(s=>s.player!==view.seat && s.card.suit===card.suit && s.card.rank<card.rank)) return -100-card.rank;
    if (lowerPartner) return 4-card.rank*5;
    if (lowerOwn) return 2-card.rank*3;
    return 16-card.rank*3;
  };
  return legal.map(card=>({card,value:utility(card),tie:rng()})).sort((a,b)=>a.value-b.value||a.tie-b.tie)[0].card.id;
}
export function simulateGame(seed=1, {strategy='strategic',signals=true,order='strategic',firstSuit=null,winner='highest'}={}) {
  const state = createGame(seed,{winner}), rng = seededRng(`${seed}:decisions`), decisions = [];
  while (state.phase !== 'finished') {
    if (state.phase === 'call') {
      if (signals) for (let seat=0;seat<5;seat++) { const signal = botSignal(publicView(state,seat)); if (signal) signalCard(state,seat,signal.cardId,signal.kind); }
      const view = publicView(state,state.commander);
      const suit = firstSuit && state.round===1 ? firstSuit : order==='fixed' ? remainingSuits(state)[0] : botCall(view,rng,order==='random'||strategy==='random'?'random':'strategic');
      decisions.push({round:state.round,commander:state.commander,suit}); callSuit(state,suit);
    } else if (state.phase === 'play') playCard(state,state.turn,botPlay(publicView(state,state.turn),rng,strategy));
    else resolveTrick(state);
  }
  return {state,cost:state.failed?null:totalCost(state),complete:!state.failed&&state.stack.length===5,decisions};
}
