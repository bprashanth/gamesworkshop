// v2 turn-by-turn harness for an outside playtester driving the real page.
//   node tools/agent-play2.mjs new                          start the next run (a new sol)
//   node tools/agent-play2.mjs turn <safe|danger> <go|avoid>  call the row ahead, then move
//   node tools/agent-play2.mjs sample <ground|dust>          reveal one card of the row ahead (1 turn)
//   node tools/agent-play2.mjs rule <if> <and> <then>        keep a rule in the notebook, e.g.
//        rule soft "not steep" "has SAND"   (if: soft|firm|haze|clear; and: "any slope"|flat|tilted|steep|"not steep";
//                                            then: "has SAND"|"has STORM"|"is safe")
//   node tools/agent-play2.mjs look
// Writes out/agent2/screen.png (whole page: map, cards, notebook) and prints a text summary.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const dir = new URL('../out/agent2/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const file = dir + 'session.json';
const session = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { runs: [], rules: [] };
const [cmd, a, b, c] = process.argv.slice(2);
const cur = () => (session.runs.length || session.runs.push([]), session.runs[session.runs.length - 1]);
if (cmd === 'new') session.runs.push([]);
else if (cmd === 'turn' && ['safe', 'danger'].includes(a) && ['go', 'avoid'].includes(b)) cur().push([a === 'safe' ? 'y' : 'n', b === 'go' ? 'g' : 'a']);
else if (cmd === 'sample' && ['ground', 'dust'].includes(a)) cur().push([a === 'ground' ? '1' : '2']);
else if (cmd === 'rule' && a && b && c) session.rules.push({ if: a, and: b, then: c, after: session.runs.length });
else if (cmd !== 'look') { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 10).join('\n')); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1300 } });
await page.goto('http://localhost:8670/v2/?speed=40');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.rover);
const settle = () => page.waitForFunction(() => ['play', 'over'].includes(window.rover.state.mode), null, { timeout: 30000 });
const key = k => page.evaluate(k => window.rover.input(k), k);
let rejected = null;
for (const [i, run] of session.runs.entries()) {
  await page.waitForTimeout(60);
  await key('p'); await settle();
  for (const keys of run) {
    if ((await page.evaluate(() => window.rover.state.mode)) !== 'play') break;
    const before = await page.evaluate(() => window.rover.state.run.turn);
    for (const k of keys) await key(k);
    await page.waitForTimeout(30); await settle();
    if (i === session.runs.length - 1 && keys === run[run.length - 1] && before === await page.evaluate(() => window.rover.state.run.turn) && cmd !== 'look') rejected = keys;
  }
  for (const r of session.rules.filter(r => r.after === i + 1)) await page.evaluate(r => window.rover.keepRule(r), r);
  if (i < session.runs.length - 1) await page.waitForFunction(() => window.rover.state.mode === 'over', null, { timeout: 30000 }).catch(() => {});
}
if (rejected) { session.runs[session.runs.length - 1].pop(); console.log('That action was not possible (not enough turns, or card already sampled). Nothing changed.'); }
if (cmd !== 'look') writeFileSync(file, JSON.stringify(session));
await page.waitForTimeout(300);
if ((await page.evaluate(() => window.rover.state.run.end))) await page.waitForFunction(() => window.rover.state.mode === 'over', null, { timeout: 30000 }).catch(() => {});
await page.screenshot({ path: dir + 'screen.png', fullPage: true });
const s = await page.evaluate(() => { const s = window.rover.state; return { run: s.run, sol: s.sol, rules: s.memory.rules, pairs: s.memory.pairs.length }; });
const deck = await page.evaluate(() => window.rover.deck);
console.log(`run ${session.runs.length} · sol ${s.sol + 1} · row ${Math.min(s.run.pos + 1, deck.length)}/${deck.length} · turns left ${s.run.turns - s.run.turn} · calls ${s.run.right}/${s.run.calls} · score ${s.run.score}${s.run.end ? ' · ENDED: ' + s.run.end : ''}`);
for (const l of s.run.log) {
  const r = deck[l.pos];
  if (l.action === 'sample') console.log(`  row ${l.pos + 1} (map: ${r.slope}): sampled ${l.arg} -> ${r[l.arg]}`);
  else console.log(`  row ${l.pos + 1} (map: ${r.slope}): called ${l.arg}, ${l.action} -> ground ${r.ground}, dust ${r.dust}  ${l.right ? 'right' : 'WRONG'}`);
}
if (!s.run.end && s.run.pos < deck.length) console.log(`next: row ${s.run.pos + 1}, map says ${deck[s.run.pos].slope}`);
console.log(`screenshot: ${dir}screen.png`);
await browser.close();
