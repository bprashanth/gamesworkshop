import {SUITS, createGame, callSuit, legalCards, playCard, resolveTrick, signalOptions, signalCard, publicView, botCall, botPlay, botSignal, seededRng} from './game.mjs';

const $ = document.querySelector('#app');
const names = ['You', 'Mika', 'Sol', 'Vega', 'Nova'];
const marks = {model:'●',data:'◆',tools:'✚',verification:'✓',compute:'▣'};
const art = {
  model:['00111100','01111110','11011011','11111111','10100101','10111101','01111110','00100100'],
  data:['00011000','00111100','01111110','11111111','01111110','00111100','00011000','00000000'],
  tools:['01100110','01100110','01111110','00111100','00011000','00011000','00011000','00011000'],
  verification:['00000000','00000011','00000110','11001100','01111000','00110000','00000000','00000000'],
  compute:['00000000','01111110','01000010','01011010','01000010','01111110','11111111','00000000']
};
const suit = id => SUITS.find(s => s.id === id);
const label = id => suit(id)?.name || id;
const esc = str => String(str ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, selected = null, signaling = false, timer = null, watching = false, help = false, inspect = null, notice = '', gameId=0;
let rng;
const freshSeed = () => Math.floor(Math.random()*999999)+1;
function start(seed=freshSeed(), watch=watching) {
  clearTimeout(timer); gameId++; watching=watch; state=createGame(seed); rng=seededRng(seed+10091);
  state.players.forEach((p,i)=>p.name=names[i]);
  selected=null; signaling=false; notice=''; inspect=null;
  botsSignal(); render(); advance();
}
function botsSignal() {
  state.players.forEach((p,i)=>{
    if ((!watching && i===0) || p.signalUsed) return;
    const choice=botSignal(publicView(state,i));
    if(choice) signalCard(state,i,choice.cardId,choice.kind);
  });
}
function pixels(id) {return `<span class="pixel-art ${id}" aria-hidden="true">${art[id].flatMap(row=>[...row].map(bit=>`<i class="${bit==='1'?'ink':''}"></i>`)).join('')}</span>`;}
function face(card, opts={}) {
  const tag=opts.button?'button':'div';
  return `<${tag} class="card ${card.suit} ${opts.small?'small':''} ${opts.selected?'selected':''} ${opts.disabled?'illegal':''} ${opts.winner?'winner':''}" ${opts.button?`data-card="${card.id}" aria-label="${esc(label(card.suit))} ${card.rank}, ${esc(card.name)}${opts.disabled?', cannot play this suit':''}" aria-pressed="${!!opts.selected}" ${opts.disabled?'disabled':''}`:''}>
    <span class="card-top"><b class="rank">${card.rank}</b><span class="suit-name">${label(card.suit)} <span aria-hidden="true">${marks[card.suit]}</span></span></span>
    ${pixels(card.suit)}<span class="card-name">${esc(card.name)}</span>${card.detail?`<span class="card-detail">${esc(card.detail)}</span>`:''}
    <span class="card-foot"><span>${marks[card.suit]}</span><b>${card.rank}</b></span>
  </${tag}>`;
}
function signal(p) {
  if(!p.signal) return `<div class="signal empty"><span class="signal-dot"></span> Signal available</div>`;
  const c=p.signal.card || p.hand.find(c=>c.id===p.signal.cardId);
  if(!c)return '<div class="signal empty">Signal used</div>';
  const kind=p.signal.kind.toLowerCase();
  const gone=!p.hand.some(x=>x.id===c.id);
  return `<div class="signal ${c.suit} ${gone?'spent':''}" title="${esc(c.name)} · ${kind==='only'?'Their only card':`Their ${kind} card`} in ${label(c.suit)}${gone?' · Already played':''}"><span class="signal-icon">${marks[c.suit]}</span><b>${label(c.suit)} ${c.rank}</b><span>${kind.toUpperCase()}${gone?' · played':''}</span></div>`;
}
function seat(i) {
  const p=state.players[i], played=state.trick.find(t=>t.player===i), cmd=state.commander===i;
  return `<section class="seat seat-${i} ${state.turn===i&&state.phase==='play'?'active-seat':''}" aria-label="${names[i]}'s seat">
    <div class="seat-label"><span class="avatar avatar-${i}" aria-hidden="true">${['','◕','◒','◉','◑'][i]}</span><b>${names[i]}</b>${cmd?'<span class="commander">COMMANDER</span>':''}<span class="hand-count">${p.hand.length} left</span></div>
    <div class="seat-cards"><div class="backs" aria-label="${p.hand.length} hidden cards">${p.hand.map((_,j)=>`<span class="card-back" style="--j:${j}"><i>✦</i></span>`).join('')}</div><div class="played-slot">${played?face(played.card,{small:true,winner:isWinner(played)}):'<span class="slot-label">'+(state.phase==='call'?'Waiting for call':state.turn===i?'Choosing…':'Not played')+'</span>'}</div></div>
    ${signal(p)}
  </section>`;
}
function winning() {
  return state.trick.filter(t=>t.card.suit===state.calledSuit).sort((a,b)=>b.card.rank-a.card.rank)[0];
}
function isWinner(t) {return state.phase==='resolve'&&winning()===t;}
function total() {return state.stack.reduce((n,x)=>n+(x.card?.rank??x.rank??0),0);}
function installed(id) {const x=state.stack.find(x=>(x.suit||x.card?.suit)===id);return x?.card||x;}
function stack() {
  return `<section class="ship" aria-label="Spaceship stack"><div class="ship-caption"><span class="eyebrow">OUR SHIP</span><strong>${state.stack.length}<span>/5 built</span></strong></div><div class="stack-slots">${SUITS.map(s=>{
    const c=installed(s.id);return `<div class="stack-slot ${s.id} ${c?'built':''}"><span class="stack-symbol">${marks[s.id]}</span><span><b>${s.name}</b><small>${c?esc(c.name):'Not built'}</small></span><strong>${c?c.rank:'—'}</strong></div>`;
  }).join('')}</div><div class="score"><span class="eyebrow">TOTAL COST</span><strong>${total()}</strong><small>Lower is better</small></div></section>`;
}
function center() {
  const mine=state.trick.find(t=>t.player===0);
  return `<div class="table-center"><div class="orbit" aria-hidden="true"></div><div class="round-label">ROUND ${Math.min(state.round,5)} OF 5</div>${state.calledSuit?`<div class="called ${state.calledSuit}"><span>CALLED SUIT</span><b>${marks[state.calledSuit]} ${label(state.calledSuit)}</b></div>`:'<div class="table-title">ONE CREW.<br>ONE CHEAP SHIP.</div>'}${mine?`<div class="your-play">${face(mine.card,{small:true,winner:isWinner(mine)})}<span>You played${isWinner(mine)?' · highest!':''}</span></div>`:'<p class="table-note">Follow the suit.<br>Highest card sets the cost.</p>'}</div>`;
}
function command() {
  if(state.phase==='finished')return '';
  const p=state.players[state.commander];
  if(state.phase==='call') {
    if(watching)return `<div class="instruction"><span class="step-dot">${state.round}</span><div><h2>${names[state.commander]} is choosing a suit…</h2><p>Watch the signals. Cheap cards can be lost to discards.</p></div></div>`;
    return `<div class="instruction"><span class="step-dot">${state.round}</span><div><h2>${state.commander===0?'You’re Commander. Call a suit.':`${p.name} is Commander.`}</h2><p>${state.commander===0?'Everyone plays one card. The highest in your called suit gets installed.':'Send a signal now, or let the Commander choose the next suit.'}</p></div></div>${state.commander===0?`<div class="suit-choices">${SUITS.map(s=>`<button class="suit-choice ${s.id}" data-call="${s.id}" ${installed(s.id)?'disabled':''}>${marks[s.id]} ${s.name}${installed(s.id)?' ✓':''}</button>`).join('')}</div>`:`<button class="primary" data-action="bot-call">Let ${p.name} call <span>→</span></button>`}`;
  }
  if(state.phase==='resolve') {
    const win=winning();
    return `<div class="instruction"><span class="step-dot result-dot">${win?'✓':'!'}</span><div><h2>${win?`${names[win.player]} played the highest ${label(state.calledSuit)}: ${win.card.rank}.`:`No one had ${label(state.calledSuit)}.`}</h2><p>${win?`${win.card.name} joins our ship. ${win.player===0?'You’re':`${names[win.player]} is`} the next Commander.`:'That part cannot be built. This ship is incomplete.'}</p></div></div><button class="primary" data-action="install">${win?state.round===5?'Finish ship':'Install & continue':'See result'} <span>→</span></button>`;
  }
  if(state.turn===0&&!watching) {
    const legal=legalCards(state,0), follow=legal.some(c=>c.suit===state.calledSuit);
    return `<div class="instruction"><span class="step-dot">↓</span><div><h2>${follow?`Your turn. Play ${label(state.calledSuit)}.`:`No ${label(state.calledSuit)}? Discard any card.`}</h2><p>${follow?'Choose a bright card. The highest played sets the cost.':'Shed an expensive card. Keep a card for each unbuilt suit.'}</p></div></div><span class="turn-chip">YOUR TURN</span>`;
  }
  return `<div class="instruction"><span class="step-dot">···</span><div><h2>${names[state.turn]||'The crew'} is playing…</h2><p>Must follow ${label(state.calledSuit)} if they have it. Otherwise, discard.</p></div></div>`;
}
function hand() {
  const p=state.players[0], legal=state.phase==='play'&&state.turn===0?legalCards(state,0):[];
  const chosen=p.hand.find(c=>c.id===selected);
  const canSignal=!p.signalUsed&&['call','play'].includes(state.phase)&&!state.trick.some(t=>t.player===0);
  let choices=[];
  if(signaling&&chosen)choices=signalOptions(state,0,chosen.id);
  return `<section class="hand-area" aria-label="Your hand"><div class="hand-toolbar"><div class="your-label"><strong>${watching?'SEAT 1':'YOUR HAND'}</strong>${state.commander===0?'<span class="commander">COMMANDER</span>':''}<span>${p.hand.length} cards</span></div>${!watching&&p.signal?signal(p):''}${!watching?`<button class="signal-button ${signaling?'on':''}" data-action="signal" ${!canSignal&&!signaling?'disabled':''}>${signaling?'Cancel signal':p.signalUsed?'✓ Signal used':'↗ Signal a card · 1 left'}</button>`:'<span class="watch-label">AI DEMO · All five seats automated</span>'}</div>
    ${signaling?`<div class="signal-guide"><b>Reveal one card to your crew.</b> ${chosen?'Choose what is true about it:':'Choose a card below. One signal for the whole game.'}${chosen?`<span class="signal-options">${choices.map(k=>`<button data-signal="${k}" class="outline">${k.toUpperCase()} <small>${k.toLowerCase()==='only'?'card in this suit':`in this suit`}</small></button>`).join('')}${!choices.length?'<span>This card is neither your lowest, highest nor only. Choose another.</span>':''}</span>`:''}</div>`:''}
    <div class="hand-cards">${p.hand.map(c=>face(c,{button:!watching,selected:c.id===selected,disabled:!signaling&&state.phase==='play'&&state.turn===0&&!legal.some(x=>x.id===c.id)})).join('')}${!p.hand.length?'<div class="empty-hand">All five cards played. Nice work, crew.</div>':''}</div>
    <div class="selection-bar">${chosen?`<p><b>${esc(chosen.name)}</b> <span>${esc(chosen.description)}</span></p>${!signaling&&state.phase==='play'&&state.turn===0&&legal.some(c=>c.id===chosen.id)?`<button class="primary play-button" data-action="play">${chosen.suit===state.calledSuit?'Play':'Discard'} ${label(chosen.suit)} ${chosen.rank} →</button>`:''}`:`<p class="hand-hint">${notice||'Select a card to inspect it. Your crew can only see cards you signal or play.'}</p>`}</div>
  </section>`;
}
function result() {
  if(state.phase!=='finished')return '';
  const good=!state.failed&&state.stack.length===5;
  return `<section class="final-result"><span class="eyebrow">${good?'SHIP COMPLETE':'SHIP INCOMPLETE'}</span><h1>${good?'Five parts. Ready for launch.':'One part short of a spaceship.'}</h1><p>${good?'You built an AI system together. Can your crew make it cheaper?':'A needed suit ran out before it could be installed. Call vulnerable suits earlier and protect cheap cards.'}</p><div class="result-cards">${SUITS.map(s=>{const c=installed(s.id);return c?face(c):`<div class="missing-card ${s.id}">${s.name}<b>Missing</b></div>`;}).join('')}</div>${good?`<div class="final-sum">${SUITS.map(s=>installed(s.id).rank).join(' + ')} <span>=</span> <strong>${total()}</strong><span>total cost · lower is better</span></div>`:'<p class="no-score">Incomplete ships do not receive a qualifying score.</p>'}<div class="result-actions"><button class="primary" data-action="new">Deal again →</button><button class="outline" data-action="replay">Try the same deal</button></div><p class="result-note">Room play: the five cheapest completed ships qualify. Ties at the cutoff are drawn at random.</p><details class="round-history"><summary>See each round</summary>${(state.history||[]).map(h=>`<div class="history-row"><b>${h.round}. ${label(h.suit)}</b><span>${h.plays.map(t=>`${names[t.player]}: ${label(t.card.suit)} ${t.card.rank}${t.card.suit!==h.suit?' (discard)':''}`).join(' · ')}</span><strong>${h.winner?`${names[h.winner.player]} installed ${h.winner.card.rank}`:'No card to install'}</strong></div>`).join('')}</details></section>`;
}
function rules() {
  return `<div class="modal-backdrop" data-action="close-help"><section class="rules-panel" role="dialog" aria-modal="true" aria-label="How to play"><button class="close" data-action="close-help" aria-label="Close rules">×</button><span class="eyebrow">LEARN IN 20 SECONDS</span><h2>Build the cheapest ship.</h2><p>Five players. Five rounds. One card from each suit.</p><ol><li><b>Commander calls an unbuilt suit.</b></li><li><b>Everyone plays one card.</b> Follow the called suit if you can. Otherwise, discard anything.</li><li><b>Highest card in the called suit is installed.</b> Its player becomes Commander.</li></ol><div class="rule-signal"><b>One signal per player, for the whole game.</b><p>Reveal a card as your LOWEST, HIGHEST or ONLY card in that suit. Other hands stay secret.</p></div><p class="rule-small">Lower numbers cost less. Discard expensive cards before their suit is called. Equal highest cards: the first played wins, starting with Commander. No cards in a called suit: incomplete ship.</p><button class="primary" data-action="close-help">Got it. Let’s play →</button></section></div>`;
}
function render() {
  $.innerHTML=`<header><a class="brand" href="./" aria-label="Crew home"><span class="brand-star">✦</span> CREW <small>01</small></a><span class="tagline">Build the cheapest AI ship.</span><nav><button class="quiet" data-action="help">How to play</button><button class="quiet" data-action="watch">${watching?'Play yourself':'Watch AI'}</button><button class="reset" data-action="new">↻ New deal</button></nav></header>${stack()}${state.phase==='finished'?result():`<section class="table" aria-label="Five player card table"><div class="table-border" aria-hidden="true"></div>${[1,2,3,4].map(seat).join('')}${center()}</section><section class="command-bar" aria-live="polite">${command()}</section>${hand()}`}<footer><span>PHASE 1 · FIVE PARTS, ONE SHIP</span><span>Deal ${state.seed} · 25 of 50 cards dealt · Other hands stay secret</span></footer>${help?rules():''}`;
  bind();
}
function act(fn) {
  try {fn();notice='';}catch(err){notice=err.message;console.error(err);}
  render();advance();
}
function advance() {
  clearTimeout(timer);
  if(help||signaling||state.phase==='finished')return;
  const id=gameId;
  if(state.phase==='play'&&(state.turn!==0||watching)) {
    timer=setTimeout(()=>{if(id!==gameId)return;act(()=>{const i=state.turn;const choice=botPlay(publicView(state,i),rng);playCard(state,i,typeof choice==='string'?choice:choice.id);});},watching?800:550);
  } else if(watching&&state.phase==='call') {
    timer=setTimeout(()=>{if(id===gameId)act(()=>{botsSignal();callSuit(state,botCall(publicView(state,state.commander),rng));});},1300);
  } else if(watching&&state.phase==='resolve') {
    timer=setTimeout(()=>{if(id===gameId)act(()=>{resolveTrick(state);botsSignal();});},2000);
  }
}
function bind() {
  $.querySelectorAll('[data-call]').forEach(el=>el.onclick=()=>act(()=>{selected=null;signaling=false;callSuit(state,el.dataset.call);}));
  $.querySelectorAll('[data-card]').forEach(el=>el.onclick=()=>{selected=selected===el.dataset.card?null:el.dataset.card;render();});
  $.querySelectorAll('[data-signal]').forEach(el=>el.onclick=()=>act(()=>{signalCard(state,0,selected,el.dataset.signal);signaling=false;selected=null;notice='Signal sent. Your crew can now see that card.';}));
  $.querySelectorAll('[data-action]').forEach(el=>el.onclick=e=>{
    const a=el.dataset.action;
    if(a==='close-help'&&el.classList.contains('modal-backdrop')&&e.target!==el)return;
    if(a==='new')start();
    if(a==='replay')start(state.seed,false);
    if(a==='watch')start(freshSeed(),!watching);
    if(a==='help'){help=true;clearTimeout(timer);render();$.querySelector('.close')?.focus();}
    if(a==='close-help'){help=false;render();advance();}
    if(a==='signal'){signaling=!signaling;selected=null;clearTimeout(timer);render();advance();}
    if(a==='bot-call')act(()=>{botsSignal();callSuit(state,botCall(publicView(state,state.commander),rng));});
    if(a==='play')act(()=>{playCard(state,0,selected);selected=null;});
    if(a==='install')act(()=>{resolveTrick(state);selected=null;signaling=false;botsSignal();});
  });
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){help=false;signaling=false;selected=null;render();advance();}});
start(Number(new URLSearchParams(location.search).get('seed'))||freshSeed(),new URLSearchParams(location.search).has('watch'));
