import test from 'node:test';
import assert from 'node:assert/strict';
import {SUITS,CARD_TYPES,createDeck,createGame,callSuit,legalCards,playCard,resolveTrick,signalOptions,signalCard,publicView,botCall,botPlay,botSignal,simulateGame,totalCost} from './game.mjs';
const card = (suit,rank,copy=0) => createDeck().find(c=>c.suit===suit&&c.rank===rank&&c.copy===copy);
function fixture(hands,commander=0) {
  const state=createGame(1,{winner:'lowest'}); state.players.forEach((p,i)=>p.hand=hands[i]); state.commander=commander;return state;
}
test('deck has exactly two copies of 25 independent suit/rank types; deterministic 5×5 deal',()=>{
  const deck=createDeck();assert.equal(deck.length,50);assert.equal(CARD_TYPES.length,25);assert.equal(new Set(deck.map(c=>c.id)).size,50);
  for(const suit of SUITS) for(let rank=1;rank<=5;rank++) assert.equal(deck.filter(c=>c.suit===suit.id&&c.rank===rank).length,2);
  const state=createGame(44); assert.deepEqual(state,createGame(44));assert.notDeepEqual(state,createGame(45));
  assert.deepEqual(state.players.map(p=>p.hand.length),[5,5,5,5,5]);assert.equal(new Set(state.players.flatMap(p=>p.hand.map(c=>c.id))).size,25);
});
test('follow suit, turns, commander inheritance, tied lowest chooses first clockwise from commander',()=>{
  const s=fixture([[card('data',2),card('model',1)],[card('model',4)],[card('data',2,1)],[card('data',3)],[card('compute',4)]],2);
  callSuit(s,'data');assert.deepEqual(legalCards(s,2).map(c=>c.rank),[2]);
  assert.throws(()=>playCard(s,0,'data-2-0'),/turn/);
  for(const seat of [2,3,4,0,1]) {
    if(seat===0) assert.throws(()=>playCard(s,seat,'model-1-0'),/Follow/);
    playCard(s,seat,legalCards(s,seat)[0].id);
  }
  assert.equal(s.phase,'resolve');resolveTrick(s);assert.equal(s.stack[0].card.rank,2);assert.equal(s.commander,2);assert.equal(s.discard.length,4);
  assert.equal(s.history.length,1);assert.throws(()=>callSuit(s,'data'),/unbuilt/);assert.equal(totalCost(s),2);
});
test('classic signals remain factual, once only, support equal-rank duplicates, and reject middle ranks',()=>{
  const s=fixture([[card('model',1),card('model',3),card('model',5),card('data',2)],[],[],[],[]]);s.rules.signalMode='classic';
  assert.deepEqual(signalOptions(s,0,'model-3-0'),[]);assert.deepEqual(signalOptions(s,0,'model-1-0'),['LOWEST']);
  assert.deepEqual(signalOptions(s,0,'model-5-0'),['HIGHEST']);assert.deepEqual(signalOptions(s,0,'data-2-0'),['ONLY']);
  assert.throws(()=>signalCard(s,0,'model-3-0','LOWEST'));
  signalCard(s,0,'model-1-0','LOWEST');assert.equal(s.players[0].signal.card.rank,1);assert.throws(()=>signalCard(s,0,'data-2-0','ONLY'));
  const duplicates=fixture([[card('tools',2),card('tools',2,1)],[],[],[],[]]);duplicates.rules.signalMode='classic';assert.deepEqual(signalOptions(duplicates,0,'tools-2-0'),['LOWEST','HIGHEST']);
});
test('bots only receive copied public information and own hand',()=>{
  const s=createGame(17),view=publicView(s,0);assert.equal(view.hand.length,5);
  assert.ok(view.players.every(p=>!('hand' in p)));assert.equal('seed' in view,false);assert.equal('deck' in view,false);
  view.hand[0].rank=99;assert.notEqual(s.players[0].hand[0].rank,99);
  const before=botCall(publicView(s,0),()=>.5);
  s.players[1].hand=[card('model',1)];assert.equal(botCall(publicView(s,0),()=>.5),before);
});
test('no called card is an explicit failed incomplete ship without invented cost',()=>{
  const s=fixture([[card('model',1)],[card('model',2)],[card('model',3)],[card('model',4)],[card('model',5)]]);
  callSuit(s,'data');while(s.phase==='play')playCard(s,s.turn,legalCards(s,s.turn)[0].id);resolveTrick(s);
  assert.equal(s.failed,true);assert.equal(s.phase,'finished');assert.equal(s.stack.length,0);assert.match(s.failureReason,/DATA/);
});
test('200 seeded games preserve card identity, legal play, five distinct installed suits and all cards consumed',()=>{
  for(let seed=0;seed<200;seed++) {
    const result=simulateGame(seed);const {state}=result;
    const visible=[...state.stack.map(e=>e.card),...state.discard,...state.players.flatMap(p=>p.hand)];
    assert.equal(visible.length,25);assert.equal(new Set(visible.map(c=>c.id)).size,25);
    assert.equal(state.history.length,state.failed?state.stack.length+1:5);
    if(result.complete){assert.equal(state.stack.length,5);assert.equal(new Set(state.stack.map(e=>e.suit)).size,5);assert.ok(result.cost>=5&&result.cost<=25);assert.equal(state.players.flatMap(p=>p.hand).length,0);}
    for(const trick of state.history){const relevant=trick.plays.filter(p=>p.card.suit===trick.suit);if(trick.winner)assert.equal(trick.winner.card.rank,Math.max(...relevant.map(p=>p.card.rank)));}
  }
});
test('legal random baseline and no-signal/fixed-order modes run reproducibly',()=>{
  for(const options of [{strategy:'random'},{signals:false},{order:'fixed'},{order:'random'},{firstSuit:'tools'}]){
    const a=simulateGame(103,options),b=simulateGame(103,options);assert.deepEqual(a,b);
    if(options.firstSuit)assert.equal(a.decisions[0].suit,'tools');
    if(options.signals===false)assert.ok(a.state.players.every(p=>p.signal===null));
  }
});

test('revised highest installs, exact ties still go clockwise, original lowest remains available',()=>{
  for(const winner of ['highest','lowest']) {
    const s=fixture([[card('data',2)],[card('data',5)],[card('data',5,1)],[card('data',3)],[card('compute',4)]],2);s.rules.winner=winner;
    callSuit(s,'data');while(s.phase==='play')playCard(s,s.turn,legalCards(s,s.turn)[0].id);resolveTrick(s);
    assert.equal(s.stack[0].card.rank,winner==='highest'?5:2);assert.equal(s.commander,winner==='highest'?2:0);
  }
});
test('revised bot uses a live partner signal to discard an expensive singleton, not a vanished signal',()=>{
  const s=fixture([[card('data',5),card('tools',1),card('tools',2)],[card('data',1)],[],[],[]]);s.rules.winner='highest';
  signalCard(s,1,'data-1-0');callSuit(s,'model');
  assert.equal(botPlay(publicView(s,0),()=>.5),'data-5-0');
  s.discard.push(card('data',1));assert.equal(botPlay(publicView(s,0),()=>.5),'tools-2-0');
});
test('Commander delays a cheaply covered suit so teammates have time to shed expensive cards',()=>{
  const s=fixture([[card('data',5),card('model',2)],[card('data',1)],[],[],[]]);s.rules.winner='highest';
  signalCard(s,1,'data-1-0');assert.notEqual(botCall(publicView(s,0),()=>.5),'data');
  s.stack=['model','tools','verification','compute'].map(suit=>({suit,card:card(suit,1)}));
  assert.equal(botCall(publicView(s,0),()=>.5),'data');
});
test('a costly covered card goes before a dead built card, which can buffer future discards',()=>{
  const s=fixture([[card('data',5),card('tools',2)],[card('data',1)],[],[],[]]);s.rules.winner='highest';
  s.stack=[{suit:'tools',card:card('tools',1)}];signalCard(s,1,'data-1-0');callSuit(s,'model');
  assert.equal(botPlay(publicView(s,0),()=>.5),'data-5-0');
});
test('original lowest-wins conservation baseline is order-invariant on seeded deals',()=>{
  for(let seed=1;seed<=50;seed++){
    const initial=createGame(seed,{winner:'lowest'});const all=initial.players.flatMap(p=>p.hand);
    if(SUITS.some(s=>!all.some(c=>c.suit===s.id)))continue;
    const ideal=SUITS.reduce((sum,s)=>sum+Math.min(...all.filter(c=>c.suit===s.id).map(c=>c.rank)),0);
    for(const order of ['strategic','random','fixed'])assert.equal(simulateGame(seed,{winner:'lowest',order}).cost,ideal);
  }
});

test('default signal has one meaning: lowest in its suit, including singleton and tied minima',()=>{
  const s=fixture([[card('model',1),card('model',3),card('data',5),card('tools',2),card('tools',2,1)],[],[],[],[]]);
  assert.equal(s.rules.signalMode,'single');
  assert.deepEqual(signalOptions(s,0,'model-1-0'),['LOWEST']);assert.deepEqual(signalOptions(s,0,'model-3-0'),[]);
  assert.deepEqual(signalOptions(s,0,'data-5-0'),['LOWEST']);assert.deepEqual(signalOptions(s,0,'tools-2-0'),['LOWEST']);
  assert.deepEqual(signalOptions(s,0,'tools-2-1'),['LOWEST']);
  assert.throws(()=>signalCard(s,0,'data-5-0','ONLY'));assert.throws(()=>signalCard(s,0,'model-3-0','HIGHEST'));
  signalCard(s,0,'data-5-0');assert.equal(s.players[0].signal.kind,'LOWEST');
  assert.throws(()=>signalCard(s,0,'model-1-0'));assert.deepEqual(signalOptions(s,0,'model-1-0'),[]);
  const view=publicView(s,1);assert.equal(view.players[0].signal.kind,'LOWEST');assert.ok(view.players.every(p=>!('hand' in p)));
});
test('default bots always signal LOWEST and highest-wins action histories match classic mode',()=>{
  for(let seed=1;seed<=100;seed++){
    const state=createGame(seed);
    for(let seat=0;seat<5;seat++){const choice=botSignal(publicView(state,seat));assert.equal(choice.kind,'LOWEST');assert.ok(signalOptions(state,seat,choice.cardId).includes(choice.kind));}
    const single=simulateGame(seed),classic=simulateGame(seed,{signalMode:'classic'});
    assert.equal(single.cost,classic.cost);assert.deepEqual(single.state.history,classic.state.history);
    assert.ok(single.state.players.every(p=>p.signal.kind==='LOWEST'));
  }
});
