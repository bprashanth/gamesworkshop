import {
  SUITS, createGame, callSuit, legalCards, playCard, resolveTrick,
  signalOptions, signalCard, publicView, botCall, botPlay, botSignal, seededRng,
} from './game.mjs';

const app = document.querySelector('#app');
const names = ['You', 'Mika', 'Sol', 'Vega', 'Nova'];
const label = id => SUITS.find(s => s.id === id)?.name || '';
const ascii = value => String(value ?? '').replace(/[\u2010-\u2015]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[^\x20-\x7e\n]/g, '');
const escape = value => ascii(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const width = 20;
let state, rng, timer, generation = 0, signaling = false, error = '';

function wrap(value) {
  const words = ascii(value).split(/\s+/), lines = [''];
  for (const word of words) {
    const last = lines.length - 1;
    if ((lines[last] + ' ' + word).trim().length > width) lines.push(word);
    else lines[last] = (lines[last] + ' ' + word).trim();
  }
  return lines;
}
function box(lines) {
  const edge = '+' + '-'.repeat(width + 2) + '+';
  return `<pre>${escape([edge, ...lines.map(line => '| ' + ascii(line).padEnd(width) + ' |'), edge].join('\n'))}</pre>`;
}
function card(card, {action = '', disabled = false, foot = ''} = {}) {
  const heading = `${card.rank}${' '.repeat(width - label(card.suit).length - 1)}${label(card.suit)}`;
  const title = wrap(card.name), detail = card.detail ? wrap(card.detail) : [];
  const lines = [heading, '', ...title, ...detail];
  while (lines.length < 7) lines.push('');
  lines.push(foot);
  const content = box(lines);
  if (!action) return `<div class="card" aria-label="${escape(label(card.suit))} ${card.rank}, ${escape(card.name)}">${content}</div>`;
  return `<button class="card" data-card="${card.id}" ${disabled ? 'disabled' : ''} aria-label="${action} ${label(card.suit)} ${card.rank}, ${escape(card.name)}">${content}</button>`;
}
function winner() {
  return state.trick.filter(t => t.card.suit === state.calledSuit).sort((a, b) => b.card.rank - a.card.rank)[0];
}
function signal(player) {
  if (!player.signal) return '<div class="signal"></div>';
  const c = player.signal.card;
  const played = !player.hand.some(card => card.id === c.id);
  return `<div class="signal ${played ? 'spent' : ''}" aria-label="Lowest ${label(c.suit)} ${c.rank}${played ? ', played' : ''}">Signal: ${label(c.suit)} ${c.rank}</div>`;
}
function installed() {
  return `<section class="installed" aria-label="Installed cards">${SUITS.map(suit => {
    const entry = state.stack.find(x => x.suit === suit.id);
    const canCall = !entry && state.phase === 'call' && state.commander === 0 && !signaling;
    const lines = entry
      ? [`${suit.name}${' '.repeat(width - suit.name.length - 1)}${entry.card.rank}`, ...wrap(entry.card.name)]
      : [suit.name, '', canCall ? '[Call]' : ''];
    while (lines.length < 3) lines.push('');
    return canCall
      ? `<button class="stack-slot" data-call="${suit.id}" aria-label="Call ${suit.name}">${box(lines)}</button>`
      : `<div class="stack-slot ${entry ? 'built' : ''}">${box(lines)}</div>`;
  }).join('')}</section>`;
}
function seat(id) {
  const player = state.players[id], play = state.trick.find(t => t.player === id);
  const heading = names[id] + (state.commander === id ? ' (Commander)' : '');
  const status = state.phase === 'call' ? 'Waiting for call' : state.turn === id ? id === 0 ? 'Your turn' : 'Playing' : 'Waiting';
  let content;
  if (play) {
    const foot = play.card.suit !== state.calledSuit ? 'Discard' : state.phase === 'resolve' && winner() === play ? 'Install' : '';
    content = card(play.card, {foot});
  } else content = `<div class="empty-card">${box(['', '', '', status, '', '', '', ''])}</div>`;
  return `<section class="seat" aria-label="${names[id]}'s play"><div class="seat-name">${heading}</div>${content}${signal(player)}</section>`;
}
function controls() {
  if (state.phase === 'finished') {
    return `<span>${state.failed ? 'Incomplete' : 'Complete'}</span><button data-action="replay">[Same deal]</button>`;
  }
  if (signaling) return '<span>Signal lowest</span><button data-action="cancel">[Cancel]</button>';
  if (state.phase === 'resolve') {
    const win = winner();
    return `<span>Call: ${label(state.calledSuit)}</span><button data-action="install">[${win ? 'Install ' + label(state.calledSuit) + ' ' + win.card.rank : 'Finish'}]</button>`;
  }
  if (state.phase === 'call') {
    return state.commander === 0 ? '<span>Call a suit</span>' : `<button data-action="bot-call">[${names[state.commander]}: Call]</button>`;
  }
  return `<span>Call: ${label(state.calledSuit)}</span><span>${state.turn === 0 ? legalCards(state, 0).some(c => c.suit === state.calledSuit) ? 'Play' : 'Discard' : names[state.turn] + ' playing'}</span>`;
}
function hand() {
  if (state.phase === 'finished') return '';
  const player = state.players[0], legal = legalCards(state, 0);
  const canSignal = !player.signalUsed && player.hand.length && ['call', 'play'].includes(state.phase);
  return `<section class="hand" aria-label="Your hand"><div class="hand-label"><span>Your hand</span>${canSignal && !signaling ? '<button data-action="signal">[Signal lowest]</button>' : ''}</div><div class="hand-cards">${player.hand.map(c => {
    const allowed = signaling ? signalOptions(state, 0, c.id).length > 0 : legal.some(x => x.id === c.id);
    return card(c, {action: signaling ? 'Signal' : 'Play', disabled: !allowed});
  }).join('')}</div></section>`;
}
function render() {
  const total = state.stack.reduce((sum, entry) => sum + entry.card.rank, 0);
  app.innerHTML = `<header><span>Installed</span><span class="total">Total: ${state.failed ? '-' : total}</span><button data-action="reset">[Reset]</button></header>${installed()}<section class="players" aria-label="Played cards">${[1, 2, 3, 4, 0].map(seat).join('')}</section><section class="controls" aria-live="polite">${controls()}</section>${hand()}${error ? `<p role="alert">${escape(error)}</p>` : ''}`;
  app.querySelectorAll('[data-call]').forEach(button => button.onclick = () => act(() => callSuit(state, button.dataset.call)));
  app.querySelectorAll('[data-card]').forEach(button => button.onclick = () => act(() => {
    if (signaling) { signalCard(state, 0, button.dataset.card); signaling = false; }
    else playCard(state, 0, button.dataset.card);
  }));
  app.querySelectorAll('[data-action]').forEach(button => button.onclick = () => {
    switch (button.dataset.action) {
      case 'reset': start(); break;
      case 'replay': start(state.seed); break;
      case 'signal': signaling = true; clearTimeout(timer); render(); break;
      case 'cancel': signaling = false; render(); advance(); break;
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
  }, 450);
}
function start(seed = Math.floor(Math.random() * 999999) + 1) {
  clearTimeout(timer); generation++; signaling = false; error = '';
  state = createGame(seed); rng = seededRng(seed + 10091);
  state.players.forEach((player, id) => {
    player.name = names[id];
    if (id) {
      const choice = botSignal(publicView(state, id));
      if (choice) signalCard(state, id, choice.cardId);
    }
  });
  render(); advance();
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && signaling) { signaling = false; render(); advance(); }
});
start(Number(new URLSearchParams(location.search).get('seed')) || undefined);
