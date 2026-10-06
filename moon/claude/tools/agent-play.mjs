// Moon Run harness for an outside playtester (human or agent) driving the real pages.
// Every command opens the page in a headless browser, replays what the session has done so far
// (deterministic), applies the new step, prints what the screen says, and writes screen.png.
//   fragment                      your card (participant MOON_ME, default B04): your piece of the archive
//   archive [card value]          the shared archive; optionally light up one card, e.g. archive light dark
//   rule before  <row>=<value> <outcome>            e.g. rule before light=dark frozen
//   rule persists <row>=<value> <n> <outcome>       e.g. rule persists light=shade,dark 3 power
//   rule with <row>=<value> <row>=<value> <outcome> [n]   e.g. rule with light=dark temp=cold frozen
//        n (1-3): how many observations in a row the FIRST card must last (default 1)
//        values: one card, or two of the same row joined by a comma (shade,dark = shade or dark)
//        outcomes: power frozen stuck any safe   (safe = "even then it is safe", WITH only)
//   publish                       send your last rule to your representative (only if it graduated)
//   candidates                    (as representative) the rules your section graduated
//   model <i> [i ...]             choose candidates by number, lock the model, run it on the archive
//   sealed                        run your locked model on the sealed 14-square route
//   decide <go|nogo>              answer MODEL NEEDS YOU
//   look                          re-show the current screen
// State: out/agent/session.json. Server: python3 serve.py (port 8676).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const BASE = 'http://localhost:8676/web/', ME = process.env.MOON_ME ?? 'B04', TEAM = ME[0];
const dir = new URL('../out/agent/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const file = dir + 'session.json';
const S = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { view: 'fragment', rules: [], published: [], model: null, answers: [], sealedAnswers: [], stage: null };
const [cmd, ...args] = process.argv.slice(2);
const save = () => writeFileSync(file, JSON.stringify(S, null, 1));
const usage = () => { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 18).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(1); };

function parseCond(s) {
  const m = /^(light|temp|temperature|ground|slope|battery)=([a-z|,]+)$/.exec(s ?? '');
  if (!m) return null;
  const key = m[1] === 'temperature' ? 'temp' : m[1];
  return { key, value: m[2].split(/[|,]/).join(' or ') };
}
const OUT = ['power', 'frozen', 'stuck', 'any', 'safe'];
function parseRule(a) {
  const [type, ...r] = a;
  if (type === 'before' && r.length === 2 && parseCond(r[0]) && OUT.includes(r[1])) return { type, a: parseCond(r[0]), then: r[1] };
  if (type === 'persists' && r.length === 3 && parseCond(r[0]) && [2, 3, 4].includes(+r[1]) && OUT.includes(r[2])) return { type, a: parseCond(r[0]), n: +r[1], then: r[2] };
  if (type === 'with' && r.length >= 3 && parseCond(r[0]) && parseCond(r[1]) && OUT.includes(r[2])) return { type, a: parseCond(r[0]), b: parseCond(r[1]), n: [1, 2, 3].includes(+r[3]) ? +r[3] : 1, then: r[2] };
  return null;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
const text = sel => page.locator(sel).innerText().catch(() => '');
const shot = async (full = false) => { await page.screenshot({ path: dir + 'screen.png', fullPage: full }); };
const api = (p, body) => page.evaluate(([p, b]) => fetch('/api/' + p, { method: 'POST', body: JSON.stringify(b) }).then(r => r.json()), [p, body]);

async function rulesPage() {
  await page.goto(BASE + 'rules.html?p=' + ME); await page.evaluate(() => localStorage.clear()); await page.goto(BASE + 'rules.html?p=' + ME);
  await page.waitForFunction(() => window.moonRules); await page.waitForTimeout(200);
}
// the representative's page, replaying the model run up to the next unanswered MODEL NEEDS YOU
async function modelRun() {
  await page.goto(BASE + 'model.html?team=' + TEAM + '&speed=60'); await page.waitForFunction(() => window.moonModel); await page.waitForTimeout(500);
  await page.evaluate(is => window.moonModel.pick(is), S.model.picked); await page.evaluate(() => window.moonModel.lock());
  let k = 0;
  for (let i = 0; i < 2000; i++) {
    await page.waitForTimeout(40);
    const st = await page.evaluate(() => { const r = window.moonModel.running; return r ? { wait: !!r.wait } : null; });
    if (!st) return 'done';
    if (st.wait) { if (k < S.answers.length) { await page.evaluate(a => window.moonModel.answer(a), S.answers[k++]); await page.waitForTimeout(60); } else return 'ask'; }
  }
  return 'timeout';
}
async function sealedRun() {
  await page.goto(BASE + `index.html?team=${TEAM}&speed=30`); await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + `index.html?team=${TEAM}&speed=30`); await page.waitForFunction(() => window.rover); await page.waitForTimeout(400);
  await page.evaluate(() => window.rover.setLevel('model')); await page.waitForTimeout(200);
  await page.evaluate(() => window.rover.input('p'));
  let k = 0;
  for (let i = 0; i < 3000; i++) {
    await page.waitForTimeout(40);
    const m = await page.evaluate(() => window.rover.state.mode);
    if (m === 'over') return 'done';
    if (m === 'ask') { if (k < S.sealedAnswers.length) { await page.evaluate(a => window.rover.input(a === 'go' ? 'g' : 'a'), S.sealedAnswers[k++]); await page.waitForTimeout(80); } else return 'ask'; }
  }
  return 'timeout';
}
const printAsk = async () => {
  console.log('MODEL NEEDS YOU: its rules disagree about the next step.');
  console.log(await text('#side .needs'));
  console.log('\nThe cards it has seen in this history are on screen.png. Answer: decide go | decide nogo');
};

if (!cmd) usage();
if (cmd === 'fragment') {
  await rulesPage(); S.view = 'fragment';
  console.log(`You are participant ${ME} on team ${TEAM}.`); console.log(await text('#fragH')); console.log(await text('#frag'));
  console.log('\nWork backwards from a white square. Then try a rule: see ./play rule'); await shot();
} else if (cmd === 'archive') {
  await page.goto(BASE + 'archive.html'); await page.waitForTimeout(500);
  if (args.length === 2) { const [k, v] = [args[0] === 'temperature' ? 'temp' : args[0], args[1]]; await page.locator(`.hist .card.up[data-key="${k}"][data-v="${v}"]`).first().click(); await page.waitForTimeout(200); }
  console.log(await text('.top .q')); console.log(await text('#count'));
  console.log('The whole archive is on screen.png (scroll image).'); await shot(true);
} else if (cmd === 'rule') {
  const r = parseRule(args); if (!r) usage();
  if (S.rules.length >= 6) { console.log('No tests left (6 per person). Publish your best graduated rule, if you have one.'); process.exit(0); }
  await rulesPage();
  await page.evaluate(r => { window.moonRules.setRule(r); window.moonRules.evaluate(); }, r); await page.waitForTimeout(250);
  const last = await page.evaluate(() => window.moonRules.last.e);
  S.rules.push({ rule: r, score: last.score, verdict: last.verdict });
  console.log(await page.evaluate(() => [...document.querySelectorAll('#result > :not(.evid):not(.legend)')].map(e => e.innerText).join('\n')));
  console.log(`(screen.png also shows every archive history: where it warned and whether a failure followed) · ${6 - S.rules.length} of 6 tests left`); await shot();
} else if (cmd === 'publish') {
  const last = S.rules.at(-1);
  if (!last) { console.log('No rule yet.'); process.exit(1); }
  if (last.verdict !== 'graduates') { console.log(`Your last rule did not graduate (${last.score}, ${last.verdict}). Only graduated rules can be published.`); process.exit(0); }
  await rulesPage(); await page.evaluate(r => { window.moonRules.setRule(r); window.moonRules.evaluate(); }, last.rule); await page.waitForTimeout(200);
  await page.locator('#publish').click(); await page.waitForTimeout(300);
  S.published.push(last.rule); console.log(await text('#pubNote')); await shot();
} else if (cmd === 'candidates') {
  if (!S.stage) {                                          // the rest of the section publishes (simulated)
    await page.goto(BASE + 'model.html?team=' + TEAM); await page.waitForFunction(() => window.moonModel);
    const { room } = await import('../web/audience.js'); const A = JSON.parse(readFileSync(new URL('../web/data/archive.json', import.meta.url)));
    for (const s of room(A.histories, TEAM)) if (s.who !== ME) await api('rule', s);
    S.stage = 'rep';
  }
  await page.goto(BASE + 'model.html?team=' + TEAM); await page.waitForFunction(() => window.moonModel); await page.waitForTimeout(500);
  const c = await page.evaluate(() => window.moonModel.cands.map(c => c));
  console.log(`You are now the representative for team ${TEAM}. Rules your section graduated (choose up to 4):`);
  const { describe } = await import('../web/moon.js');
  c.forEach((x, i) => console.log(`  ${i + 1}. [${x.rule.then === 'safe' ? 'GO' : 'NO GO'}] ${describe(x.rule)} · verification ${x.score} · ${x.e?.failures ? `caught ${x.e.caught} of ${x.e.failures}, false alarms ${x.e.falseAlarms} of ${x.e.alerts}` : `right ${x.e.said - x.e.wrong} of ${x.e.said}`} · supporters ${x.who.length}`));
  console.log('\nChoose: ./play model 1 3 ...'); await shot();
} else if (cmd === 'model') {
  const picked = args.map(Number).filter(n => n >= 1).map(n => n - 1);
  if (!picked.length || picked.length > 4) usage();
  S.model = { picked }; S.answers = []; S.sealedAnswers = [];
  await page.goto(BASE + 'model.html?team=' + TEAM); await page.waitForFunction(() => window.moonModel); await page.waitForTimeout(400);
  await page.evaluate(is => window.moonModel.pick(is), picked); await page.waitForTimeout(150);
  console.log(await text('#clash') || 'No clashes detected between these rules.');
  const r = await modelRun(); S.view = 'model';
  if (r === 'ask') await printAsk(); else console.log(await text('#side'));
  await shot();
} else if (cmd === 'decide') {
  const a = args[0]; if (!['go', 'nogo'].includes(a)) usage();
  if (S.view === 'model') {
    S.answers.push(a); const r = await modelRun();
    if (r === 'ask') await printAsk(); else { console.log('Archive run finished.'); console.log(await text('#side')); }
  } else if (S.view === 'sealed') {
    S.sealedAnswers.push(a); const r = await sealedRun();
    if (r === 'ask') { console.log('MODEL NEEDS YOU on the sealed route.'); console.log(await text('#ask')); console.log('Answer: decide go | decide nogo'); }
    else { console.log('Sealed route finished.'); console.log(await text('#status')); }
  } else console.log('Nothing is waiting for a decision.');
  await shot();
} else if (cmd === 'sealed') {
  if (!S.model) { console.log('Lock a model first (./play model ...).'); process.exit(1); }
  S.view = 'sealed'; S.sealedAnswers = [];
  const r = await sealedRun();
  if (r === 'ask') { console.log('MODEL NEEDS YOU on the sealed route (14 squares nobody has seen).'); console.log(await text('#ask')); console.log('The board is on screen.png. Answer: decide go | decide nogo'); }
  else { console.log('Sealed route finished.'); console.log(await text('#status')); }
  await shot();
} else if (cmd === 'look') {
  if (S.view === 'model' && S.model) { const r = await modelRun(); if (r === 'ask') await printAsk(); else console.log(await text('#side')); }
  else if (S.view === 'sealed') { const r = await sealedRun(); console.log(r === 'ask' ? await text('#ask') : await text('#status')); }
  else { await rulesPage(); console.log(await text('#frag')); }
  await shot();
} else usage();
save();
if (errors.length) console.log('PAGE ERRORS', errors);
console.log('screenshot: screen.png');
await browser.close();
