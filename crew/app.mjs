import {
  SUITS, createGame, callSuit, legalCards, playCard, resolveTrick,
  signalOptions, signalCard, publicView, botCall, botPlay, botSignal, seededRng,
} from './game.mjs';

const app = document.querySelector('#app');
const names = ['You', 'Mika', 'Sol', 'Vega', 'Nova'];
const label = id => SUITS.find(s => s.id === id)?.name || '';
const plain = value => String(value ?? '').replace(/[\u2010-\u2015]/g, '-').replace(/[\u2018\u2019]/g, "'");
const escape = value => plain(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, rng, timer, generation = 0, signaling = false, selected = null, error = '';

function card(c, {action = '', disabled = false, foot = '', small = false} = {}) {
  const tag = action ? 'button' : 'div';
  return `<${tag} class="card ${c.suit} ${small ? 'small' : ''} ${selected === c.id ? 'selected' : ''} ${foot === 'Install' ? 'winner' : ''}" ${action ? `data-card="${c.id}" ${disabled ? 'disabled' : ''}` : ''} aria-label="${action ? action + ' ' : ''}${label(c.suit)} ${c.rank}, ${escape(c.name)}">
    <span class="card-suit">${label(c.suit)}</span><span class="card-rank">${c.rank}</span>
    <span class="card-name">${escape(c.name)}</span><span class="card-detail">${escape(c.detail)}</span>
    ${foot ? `<span class="card-status">${foot}</span>` : ''}
  </${tag}>`;
}
function winner() {
  return state.trick.filter(t => t.card.suit === state.calledSuit).sort((a, b) => b.card.rank - a.card.rank)[0];
}
function signal(player) {
  if (!player.signal) return '<div class="signal empty-signal">Signal ready</div>';
  const {card: c, kind} = player.signal;
  const played = !player.hand.some(card => card.id === c.id);
  return `<div class="signal ${c.suit} ${played ? 'spent' : ''}" aria-label="${kind} ${label(c.suit)} ${c.rank}${played ? ', played' : ''}"><b>${label(c.suit)} ${c.rank}</b><span>${kind}${played ? ' / played' : ''}</span></div>`;
}
function installed() {
  return `<section class="installed" aria-label="Installed cards">${SUITS.map(suit => {
    const entry = state.stack.find(x => x.suit === suit.id);
    return `<div class="stack-slot ${suit.id} ${entry ? 'built' : ''}"><span>${suit.name}</span><strong>${entry ? entry.card.rank : '-'}</strong><small>${entry ? escape(entry.card.name) : 'Not built'}</small></div>`;
  }).join('')}</section>`;
}
function seat(id) {
  const player = state.players[id], play = state.trick.find(t => t.player === id);
  const status = state.phase === 'call' ? 'Waiting for call' : state.turn === id ? id === 0 ? 'Your turn' : 'Playing' : 'Waiting';
  let content;
  if (play) {
    const foot = play.card.suit !== state.calledSuit ? 'Discard' : state.phase === 'resolve' && winner() === play ? 'Install' : '';
    content = card(play.card, {foot, small: true});
  } else content = `<div class="empty-card">${status}</div>`;
  return `<section class="seat ${state.turn === id ? 'active-seat' : ''}" aria-label="${names[id]}'s play"><div class="seat-name"><b>${names[id]}</b>${state.commander === id ? '<span>Commander</span>' : ''}</div>${content}${signal(player)}</section>`;
}
function controls() {
  if (state.phase === 'finished') return `<div class="prompt"><strong>${state.failed ? 'Ship incomplete' : 'Ship complete'}</strong></div><button data-action="replay">Same deal</button>`;
  if (signaling) {
    const chosen = state.players[0].hand.find(c => c.id === selected);
    const options = chosen ? signalOptions(state, 0, chosen.id) : [];
    return `<div class="prompt"><strong>${chosen ? label(chosen.suit) + ' ' + chosen.rank : 'Choose a card to signal'}</strong>${chosen ? '<small>In this suit, this is my...</small>' : ''}</div><div class="signal-choices">${['LOWEST','HIGHEST','ONLY'].map(kind => `<button data-signal="${kind}" ${options.includes(kind) ? '' : 'disabled'}>${kind}</button>`).join('')}<button class="quiet" data-action="cancel">Cancel</button></div>`;
  }
  if (state.phase === 'resolve') {
    const win = winner();
    return `<div class="prompt"><strong>${win ? `${win.player === 0 ? 'You win' : names[win.player] + ' wins'} with ${label(state.calledSuit)} ${win.card.rank}` : 'No ' + label(state.calledSuit) + ' played'}</strong><small>Called: ${label(state.calledSuit)}</small></div><button class="primary" data-action="install">${win ? 'Install ' + label(state.calledSuit) + ' ' + win.card.rank : 'Finish'}</button>`;
  }
  if (state.phase === 'call') {
    if (state.commander !== 0) return `<div class="prompt"><strong>${names[state.commander]} calls next</strong></div><button class="primary" data-action="bot-call">Next call</button>`;
    return `<div class="prompt"><strong>You call a suit</strong></div><div class="call-choices">${SUITS.map(s => `<button class="${s.id}" data-call="${s.id}" ${state.stack.some(x => x.suit === s.id) ? 'disabled' : ''} aria-label="Call ${s.name}">${s.name}</button>`).join('')}</div>`;
  }
  const myTurn = state.turn === 0;
  const follow = myTurn && legalCards(state, 0).some(c => c.suit === state.calledSuit);
  return `<div class="prompt"><strong>${myTurn ? follow ? 'Play ' + label(state.calledSuit) : 'Discard any card' : names[state.turn] + ' is playing'}</strong><small>Called: ${label(state.calledSuit)}</small></div><span class="called-suit ${state.calledSuit}">${label(state.calledSuit)}</span>`;
}
function hand() {
  if (state.phase === 'finished') return '';
  const player = state.players[0], legal = legalCards(state, 0);
  const canSignal = !player.signalUsed && player.hand.length && ['call', 'play'].includes(state.phase);
  return `<section class="hand" aria-label="Your hand"><div class="hand-label"><b>Your hand</b>${canSignal && !signaling ? '<button data-action="signal">Signal a card</button>' : player.signalUsed ? '<span>Signal used</span>' : ''}</div><div class="hand-cards">${player.hand.map(c => {
    const allowed = signaling ? signalOptions(state, 0, c.id).length > 0 : legal.some(x => x.id === c.id);
    return card(c, {action: signaling ? 'Signal' : 'Play', disabled: !allowed});
  }).join('')}</div></section>`;
}
function render() {
  const total = state.stack.reduce((sum, entry) => sum + entry.card.rank, 0);
  app.innerHTML = `<header><div class="ship-label"><b>SHIP</b><span>${state.stack.length}/5 built</span></div><span class="rule">Highest called card wins. Lowest total cost wins the game.</span><div class="total">COST <strong>${state.failed ? '-' : total}</strong></div><button data-action="reset">Reset</button></header>${installed()}<section class="table"><div class="table-label">ROUND ${Math.min(state.round, 5)} / 5</div><div class="players" aria-label="Played cards">${[1, 2, 3, 4, 0].map(seat).join('')}</div></section><section class="controls" aria-live="polite">${controls()}</section>${hand()}${error ? `<p role="alert">${escape(error)}</p>` : ''}`;
  app.querySelectorAll('[data-call]').forEach(button => button.onclick = () => act(() => callSuit(state, button.dataset.call)));
  app.querySelectorAll('[data-card]').forEach(button => button.onclick = () => {
    if (signaling) { selected = button.dataset.card; render(); }
    else act(() => playCard(state, 0, button.dataset.card));
  });
  app.querySelectorAll('[data-signal]').forEach(button => button.onclick = () => act(() => {
    signalCard(state, 0, selected, button.dataset.signal); signaling = false; selected = null;
  }));
  app.querySelectorAll('[data-action]').forEach(button => button.onclick = () => {
    switch (button.dataset.action) {
      case 'reset': start(); break;
      case 'replay': start(state.seed); break;
      case 'signal': signaling = true; selected = null; clearTimeout(timer); render(); break;
      case 'cancel': signaling = false; selected = null; render(); advance(); break;
      case 'bot-call': act(() => callSuit(state, botCall(publicView(state, state.commander), rng))); break;
      case 'install': act(() => resolveTrick(state)); break;
    }
  });
}
function act(action) {
  error = '';
  try { action(); } catch (err) { error = err.message; }
  render(); advance();
}
function advance() {
  clearTimeout(timer);
  if (signaling || state.phase !== 'play' || state.turn === 0) return;
  const current = generation;
  timer = setTimeout(() => {
    if (current !== generation) return;
    act(() => playCard(state, state.turn, botPlay(publicView(state, state.turn), rng)));
  }, 500);
}
function start(seed = Math.floor(Math.random() * 999999) + 1) {
  clearTimeout(timer); generation++; signaling = false; selected = null; error = '';
  state = createGame(seed, {signalMode: 'classic'}); rng = seededRng(seed + 10091);
  state.players.forEach((player, id) => {
    player.name = names[id];
    if (id) {
      const choice = botSignal(publicView(state, id));
      if (choice) signalCard(state, id, choice.cardId, choice.kind);
    }
  });
  render(); advance();
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && signaling) { signaling = false; selected = null; render(); advance(); }
});
start(Number(new URLSearchParams(location.search).get('seed')) || undefined);
