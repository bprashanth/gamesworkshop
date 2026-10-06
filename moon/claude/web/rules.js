// A participant's page: their fragment, the three-blank rule builder, the evaluator, publish.
import { RULE_TYPES, VARS, VALUE_OPTIONS, OUTCOME_WORD, evaluate, explain, describe, marks, phrase, GRADUATE } from './moon.js';
import { SYMBOLS } from './symbols.js';
import { load, $, esc, strip, card, api, LABEL } from './ui.js';
import { fragment, parseId } from './fragments.js';

const archive = (await load('data/archive.json')).histories;
const H = archive.map(h => h.obs);
const KEY = 'moon-run.claude.rules';
const BUDGET = Number(new URLSearchParams(location.search).get('tries') || 6);   // evaluations per person: each test should count
let me = { id: null, tries: [] };
try { me = { ...me, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(me)); } catch {} };
const params = new URLSearchParams(location.search);
if (params.get('p')) me.id = params.get('p').toUpperCase();

// ---------- the fragment ----------
function showFragment() {
  const p = parseId(me.id ?? '');
  $('#who').value = me.id ?? '';
  if (!p) { $('#frag').innerHTML = '<p class="dim">Type the number on your card (for example A07) and press Open.</p>'; return; }
  const f = fragment(archive, p.team, p.i);
  $('#fragH').textContent = `card ${f.id} · team ${p.team} · your piece of the archive`;
  $('#frag').innerHTML = strip(f.history, { rows: f.rows, sub: `${f.history.obs.length} observations, ${f.rows.length - 1} of 5 measurements` });
}
$('#whoGo').onclick = () => { me.id = $('#who').value.trim().toUpperCase(); save(); showFragment(); };
$('#who').onkeydown = e => { if (e.key === 'Enter') $('#whoGo').click(); };

// ---------- the builder: a sentence with blanks ----------
let type = 'before', rule = null, open = null, last = null;
const blank = () => ({ a: null, n: type === 'persists' ? 3 : 1, b: null, then: null });
let draft = blank();
const condCard = c => c ? `${c.value.split(' or ').map(v => card(c.key, v)).join('<span class="or">or</span>')}` : '';
const ACTIONS = ['power', 'frozen', 'stuck', 'any'];
function thenLabel(t) { return t === 'safe' ? 'GO (safe)' : OUTCOME_WORD[t]; }
function paintSentence() {
  $('#question').innerHTML = `<b>${RULE_TYPES[type].label}</b> · ${RULE_TYPES[type].question}`;
  const slot = (id, inner, label) => `<button class="blank ${inner ? 'set' : ''} ${open === id ? 'open' : ''}" data-b="${id}">${inner || label}</button>`;
  const nSel = (opts, unit) => `<select id="n">${opts.map(n => `<option value="${n}"${draft.n === n ? ' selected' : ''}>${n}</option>`).join('')}</select>${unit}`;
  const thenSlot = slot('then', draft.then ? `<span>${thenLabel(draft.then)}</span>` : '', 'outcome');
  let s;
  if (type === 'before') s = `${slot('a', condCard(draft.a), 'a card')} happens before ${thenSlot}`;
  else if (type === 'persists') s = `${slot('a', condCard(draft.a), 'a card')} lasts <span class="blank set">${nSel([2, 3, 4], '')}</span> observations before ${thenSlot}`;
  else s = `${slot('a', condCard(draft.a), 'a card')} <span class="blank set" title="how many observations in a row the first card must last">${nSel([1, 2, 3], '')}&nbsp;in a row</span> WITH ${slot('b', condCard(draft.b), 'another card')} predicts ${thenSlot}`;
  $('#sentence').innerHTML = s;
  $('#n')?.addEventListener('change', e => { draft.n = Number(e.target.value); update(); });
  $('#sentence').querySelectorAll('[data-b]').forEach(el => el.onclick = () => { open = open === el.dataset.b ? null : el.dataset.b; paintSentence(); paintPicker(); });
  update();
}
function paintPicker() {
  const el = $('#picker');
  if (!open) { el.innerHTML = ''; return; }
  if (open === 'then') {
    const opts = [...ACTIONS, ...(type === 'with' ? ['safe'] : [])];
    el.innerHTML = `<div class="picker"><div class="row">${opts.map(o => `<button class="b ${draft.then === o ? 'on' : ''}" data-then="${o}">${thenLabel(o)}</button>`).join('')}</div>
      <div class="hint">${type === 'with' ? 'GO (safe) makes this an exception: "even then, it is safe".' : 'any failure: any white square.'}</div></div>`;
    el.querySelectorAll('[data-then]').forEach(b => b.onclick = () => { draft.then = b.dataset.then; open = null; paintSentence(); paintPicker(); });
    return;
  }
  const cur = draft[open];
  el.innerHTML = `<div class="picker">${VARS.map(v => `<div class="row"><b>${LABEL[v.key]}</b>${v.levels.map(l => {
    const sel = cur && cur.key === v.key && cur.value.split(' or ').includes(l);
    return `<div class="card up ${sel ? 'sel' : ''}" data-k="${v.key}" data-v="${l}">${SYMBOLS[v.key][l]}<i>${l}</i></div>`; }).join('')}</div>`).join('')}
    <div class="hint">Click a card. Click a second card in the same row for "either".</div></div>`;
  el.querySelectorAll('.card').forEach(c => c.onclick = () => {
    const k = c.dataset.k, v = c.dataset.v, cur = draft[open];
    if (cur && cur.key === k && cur.value !== v && !cur.value.includes(' or ')) {
      const two = VARS.find(x => x.key === k).levels.filter(l => l === v || l === cur.value).join(' or ');
      draft[open] = VALUE_OPTIONS[k].includes(two) ? { key: k, value: two } : { key: k, value: v };
    } else draft[open] = { key: k, value: v };
    paintSentence(); paintPicker();
  });
}
const left = () => BUDGET - me.tries.filter(t => t.id === me.id).length;
function update() {
  const ok = draft.a && draft.then && (type !== 'with' || draft.b);
  rule = ok ? { type, a: draft.a, ...(type !== 'before' ? { n: draft.n } : {}), ...(type === 'with' ? { b: draft.b } : {}), then: draft.then } : null;
  $('#eval').disabled = !rule || left() <= 0;
  $('#evalNote').textContent = left() > 0 ? `tests your rule on every history in the archive, not just yours · ${left()} of ${BUDGET} tests left` : 'no tests left: publish your best, or help a neighbour';
}
$('#tabs').onclick = e => { const t = e.target.dataset.t; if (!t) return; type = t; const keep = draft; draft = blank(); draft.a = keep.a; draft.then = keep.then === 'safe' && t !== 'with' ? null : keep.then; open = null; paintTabs(); paintSentence(); paintPicker(); };
const paintTabs = () => $('#tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === type));

// ---------- evaluate ----------
$('#eval').onclick = () => {
  if (!rule) return;
  const e = evaluate(rule, H);
  last = { rule, e };
  me.tries.unshift({ id: me.id, rule, score: e.score, verdict: e.verdict }); me.tries = me.tries.slice(0, 30); save(); update();
  paintResult(); paintTries();
};
const VCLS = { graduates: 'graduates', 'keep testing': '', 'too late': 'late', 'too few cases': 'few' };
function paintResult() {
  const { rule, e } = last;
  const ev = archive.map(h => {
    const m = marks(rule, h.obs);
    return `<span>${h.id}</span><div class="row">${m.map(x => `<i class="${x.any ? 'f' : ''} ${x.fire ? (x.good ? 'a' : 'a fa') : x.late ? 'a late' : ''}"></i>`).join('')}</div>`;
  }).join('');
  $('#result').innerHTML = `<div class="dim small">${esc(describe(rule))}</div>
    <div class="score"><small>VERIFICATION</small>${e.score}</div>
    <ul>${explain(e).map(l => `<li>${esc(l)}</li>`).join('')}</ul>
    <span class="verdict ${VCLS[e.verdict]}">${e.verdict.toUpperCase()}</span>
    <div class="evid">${ev}</div>
    <div class="legend"><span><i class="f"></i> failure</span><span><i class="a"></i> warned, and it came</span><span><i class="fa"></i> warned, nothing came</span>${e.late ? '<span><i class="f a late"></i> warned only when it happened</span>' : ''}</div>
    <p class="dim small how">${rule.then === 'safe' ? 'How it is scored: when it said GO, how much safer the next step was than an average step. Needs 4 cases.'
      : 'How it is scored: a warning counts if the failure comes 1 to 3 observations later (at the failure itself is too late). The score is high only if it catches most failures <i>and</i> most of its warnings come true. Needs 4 warnings.'} ${GRADUATE} graduates.</p>`;
  $('#publish').hidden = e.verdict !== 'graduates';
  $('#pubNote').textContent = '';
}
$('#publish').onclick = async () => {
  const p = parseId(me.id ?? '');
  if (!p) { $('#pubNote').textContent = 'type your card number first'; return; }
  const r = await api.post('rule', { team: p.team, who: me.id, rule: last.rule, score: last.e.score, verdict: last.e.verdict, e: { caught: last.e.caught, failures: last.e.failures, falseAlarms: last.e.falseAlarms, alerts: last.e.alerts, said: last.e.said, wrong: last.e.wrong } });
  $('#pubNote').textContent = r.error ? 'could not reach the stage' : `sent to representative ${p.team}`;
  $('#publish').hidden = true;
};
function paintTries() {
  $('#tries').innerHTML = me.tries.map((t, i) => `<li data-i="${i}"><b>${t.score}</b> ${esc(describe(t.rule))} <span class="dim">· ${t.verdict}</span></li>`).join('');
  $('#tries').querySelectorAll('li').forEach(li => li.onclick = () => { const t = me.tries[+li.dataset.i]; type = t.rule.type; draft = { a: t.rule.a, n: t.rule.n ?? 1, b: t.rule.b ?? null, then: t.rule.then }; open = null; paintTabs(); paintSentence(); paintPicker(); });
}
window.moonRules = { setRule: r => { type = r.type; draft = { a: r.a, n: r.n ?? (r.type === 'persists' ? 3 : 1), b: r.b ?? null, then: r.then }; paintTabs(); paintSentence(); }, evaluate: () => $('#eval').click(), get last() { return last; } };
showFragment(); paintTabs(); paintSentence(); paintTries();
