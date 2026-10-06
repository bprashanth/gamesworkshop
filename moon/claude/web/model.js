// A representative's page: cluster what their section graduated, choose up to CAP rules, see where
// they can disagree, lock the model, then watch it drive through the whole archive, stopping when
// its rules conflict (MODEL NEEDS YOU). Ends with a tally and a check on unseen histories.
import { describe, decide, fires, OUTCOME_WORD } from './moon.js';
import { load, $, esc, strip, api, TEAMS } from './ui.js';
import { room, cluster } from './audience.js';

const CAP = 4;
const archive = (await load('data/archive.json')).histories, holdout = (await load('data/holdout.json')).histories;
const params = new URLSearchParams(location.search), speed = Number(params.get('speed') || 1);
let team = params.get('team') ?? 'A', cands = [], chosen = new Set(), running = null;
$('#cap').textContent = CAP;

$('#teams').innerHTML = TEAMS.map(t => `<button class="b" data-t="${t}">${t}</button>`).join('');
$('#teams').onclick = e => { const t = e.target.dataset.t; if (t && !running) { team = t; chosen = new Set(); refresh(); } };

async function refresh() {
  $('#teams').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === team));
  const s = await api.state();
  cands = cluster(s.rules.filter(r => r.team === team && r.verdict === 'graduates'));
  paintCands();
}
function paintCands() {
  $('#cands').innerHTML = `<div class="cand head"><span></span><span>rule</span><span>verification</span><span>caught</span><span>false alarms</span><span>supporters</span></div>`
    + (cands.length ? cands.map((c, i) => `<div class="cand ${chosen.has(i) ? 'on' : ''}" data-i="${i}"><span class="box"></span><span><span class="act ${c.rule.then === 'safe' ? 'go' : 'no'}">${c.rule.then === 'safe' ? 'GO' : 'NO GO'}</span>${esc(describe(c.rule))}</span>
      <span>${c.score}</span><span>${c.e?.failures ? `${c.e.caught} of ${c.e.failures}` : c.e?.said ? `right ${c.e.said - c.e.wrong} of ${c.e.said}` : ''}</span><span>${c.e?.alerts ? `${c.e.falseAlarms} of ${c.e.alerts}` : c.e?.said !== undefined ? `wrong ${c.e.wrong}` : ''}</span><span>${c.who.length}</span></div>`).join('')
      : '<p class="dim">No graduated rules from this section yet.</p>');
  $('#cands').querySelectorAll('.cand[data-i]').forEach(el => el.onclick = () => {
    const i = +el.dataset.i;
    if (chosen.has(i)) chosen.delete(i); else if (chosen.size < CAP) chosen.add(i);
    paintCands();
  });
  $('#lock').disabled = !chosen.size;
  $('#note').textContent = chosen.size >= CAP ? `${CAP} is the limit` : '';
  paintClash();
}
// contradictions: a NO GO rule and a GO rule that fire on the same observation somewhere
function clashes(rules) {
  const out = [];
  for (const d of rules.filter(r => r.then !== 'safe')) for (const g of rules.filter(r => r.then === 'safe')) {
    let n = 0; for (const h of archive) for (let t = 0; t < h.obs.length - 1 && !h.obs[t].outcome; t++) if (fires(d, h.obs, t) && fires(g, h.obs, t)) n++;
    if (n) out.push({ d, g, n });
  }
  return out;
}
const rulesNow = () => [...chosen].map(i => cands[i].rule);
function paintClash() {
  const c = clashes(rulesNow());
  $('#clash').innerHTML = c.length ? c.map(x => `<p class="warn">These two disagree ${x.n} time${x.n === 1 ? '' : 's'} in the archive: "${esc(describe(x.d))}" says NO GO, "${esc(describe(x.g))}" says GO. The model will ask you.</p>`).join('')
    : chosen.size ? '<p class="dim small">No clashes: this model will decide every step itself. That is not always good news; ask what it would do in a case the archive never showed.</p>' : '';
}
$('#rehearse').onclick = async () => {
  for (const s of room(archive, team)) await api.post('rule', s);
  refresh();
};
$('#lock').onclick = async () => {
  const rules = rulesNow();
  await api.post('model', { team, rules, supporters: [...chosen].map(i => cands[i].who.length) });
  startRun(rules);
};

// ---------- the archive run ----------
function startRun(rules) {
  $('#build').hidden = true; $('#runner').hidden = false;
  running = { rules, h: 0, t: 0, decs: [], human: 0, auto: 0, c: { caught: 0, missed: 0, fa: 0, go: 0 }, wait: null, phase: 'archive' };
  step();
}
const sleep = ms => new Promise(r => setTimeout(r, ms / speed));
async function step() {
  const R = running;
  for (; R.h < archive.length; R.h++, R.t = 0, R.decs = []) {
    const h = archive[R.h];
    paintRun(h);
    await sleep(450);
    for (; R.t < h.obs.length - 1; R.t++) {
      if (h.obs[R.t].outcome) break;
      const d = decide(R.rules, h.obs, R.t);
      let act = d.action, who = 'model';
      if (act === 'ask') { paintRun(h, d); act = await new Promise(res => { R.wait = res; }); R.wait = null; who = 'human'; R.human++; }
      else R.auto++;
      const fail = !!h.obs[R.t + 1].outcome, stop = act === 'nogo';
      if (fail && stop) R.c.caught++; else if (fail) R.c.missed++; else if (stop) R.c.fa++; else R.c.go++;
      R.decs[R.t] = { act, who, fail };
      paintRun(h);
      await sleep(fail ? 700 : 260);
      if (fail) break;
    }
    await sleep(500);
  }
  finish();
}
function paintRun(h, ask) {
  const R = running;
  $('#prog').innerHTML = archive.map((_, i) => `<i class="${i < R.h ? 'done' : i === R.h ? 'now' : ''}"></i>`).join('');
  // cards flip as the model reaches them; the square ahead stays face down until it has decided
  const seen = t => t <= R.t || (t === R.t + 1 && R.decs[R.t]);
  $('#hist').innerHTML = strip(h, { sub: `history ${R.h + 1} of ${archive.length}`, hidden: t => !seen(t),
    mark: (t, k) => ask && [...ask.danger, ...ask.safe].some(r => cardsFor(r, R.t).includes(`${t}:${k}`)) ? 'fired' : t === R.t + 1 && k === 'outcome' && !seen(t) ? 'next' : '' });
  const n = h.obs.length;
  $('#dec').innerHTML = `<div class="dec" style="--n:${n}"><span></span>${Array.from({ length: n }, (_, t) => {
    const d = R.decs[t - 1]; if (!d) return '<span></span>';
    return `<span class="${d.act === 'nogo' ? 'no' : 'go'} ${d.who === 'human' ? 'hum' : ''}">${d.act === 'nogo' ? 'NO GO' : 'GO'}</span>`; }).join('')}</div>`;
  const c = R.c;
  $('#side').innerHTML = (ask ? `<div class="needs"><b>MODEL NEEDS YOU</b>${ask.danger.map(r => `<p><span class="act no">NO GO</span> ${esc(describe(r))}</p>`).join('')}${ask.safe.map(r => `<p><span class="act go">GO</span> ${esc(describe(r))}</p>`).join('')}
      <p><button class="b no" id="nogo">No go</button> <button class="b go" id="go">Go</button></p></div>` : '')
    + `<div class="tally"><p><b>${c.caught}</b>failures stopped</p><p><b>${c.missed}</b>failures missed</p><p><b>${c.fa}</b>false alarms</p><p><b>${c.go}</b>safe steps driven</p><p><b>${R.auto}</b>decided by the model</p><p><b>${R.human}</b>decided by you</p></div>`;
  if (ask) { $('#go').onclick = () => R.wait?.('go'); $('#nogo').onclick = () => R.wait?.('nogo'); }
}
function cardsFor(r, t) {
  const n = r.type === 'persists' ? r.n : (r.n ?? 1), out = [];
  for (let k = 0; k < n; k++) out.push(`${t - k}:${r.a.key}`);
  if (r.b) out.push(`${t}:${r.b.key}`);
  return out;
}
// one number, the evaluator's: stop failures (recall) without crying wolf (precision)
const verification = c => { const r = c.caught / Math.max(1, c.caught + c.missed), p = c.caught / Math.max(1, c.caught + c.fa); return r + p ? Math.round(200 * r * p / (r + p)) : 0; };
function unseen(rules) {                            // the same model on 20 histories nobody has seen (asks counted, not answered)
  const c = { caught: 0, missed: 0, fa: 0, go: 0, ask: 0 };
  for (const h of holdout) for (let t = 0; t < h.obs.length - 1; t++) {
    if (h.obs[t].outcome) break;
    const d = decide(rules, h.obs, t), fail = !!h.obs[t + 1].outcome;
    if (d.action === 'ask') { c.ask++; continue; }
    if (fail && d.action === 'nogo') c.caught++; else if (fail) c.missed++; else if (d.action === 'nogo') c.fa++; else c.go++;
  }
  return c;
}
async function finish() {
  const R = running, c = R.c, v = verification(c), u = unseen(R.rules), vu = verification(u), total = R.auto + R.human;
  await api.post('run', { kind: 'archive', team, rules: R.rules, c, auto: R.auto, human: R.human, verification: v, unseen: { ...u, verification: vu } });
  $('#hist').innerHTML = ''; $('#dec').innerHTML = '';
  $('#side').innerHTML = `<div class="big"><small>VERIFICATION</small>${v}</div>
    <div class="tally"><p><b>${c.caught} of ${c.caught + c.missed}</b>failures stopped</p><p><b>${c.fa}</b>false alarms</p><p><b>${c.go} of ${c.go + c.fa}</b>safe steps driven</p>
    <p><b>${R.auto} of ${total}</b>decided by the model</p><p><b>${R.human} of ${total}</b>decided by you</p></div>
    <h2>on ${holdout.length} histories nobody has seen</h2><div class="tally"><p><b>${vu}</b>verification</p><p><b>${u.caught} of ${u.caught + u.missed}</b>failures stopped</p><p><b>${u.fa}</b>false alarms</p><p><b>${u.ask}</b>times it would ask you</p></div>
    <p><a class="b" href="index.html?team=${team}">Take it to the sealed route</a></p>`;
  $('#prog').innerHTML = '';
  $('#hist').innerHTML = `<p class="q">Model ${team}: ${R.rules.map(r => esc(describe(r))).join(' · ')}</p>`;
  running = null;
}
window.moonModel = { pick: is => { chosen = new Set(is); paintCands(); }, get cands() { return cands; }, get running() { return running; }, lock: () => $('#lock').click(), answer: a => running?.wait?.(a), rehearse: () => $('#rehearse').click() };
refresh();
