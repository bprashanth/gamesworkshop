// Turn-by-turn harness for an outside playtester (human or agent) driving the real page.
//   node tools/agent-play.mjs new                 start a fresh run (keeps memory of past runs)
//   node tools/agent-play.mjs turn <scale|market|apply> [card card]  first look at cards of the month
//        ahead (Hard: 2 of queries|users|servers|funds; default users servers), then act
//   node tools/agent-play.mjs level <easy|medium|hard>     difficulty for the next `new` run
//   node tools/agent-play.mjs look                re-render without acting
// Each call replays the session log in a headless browser at high speed, applies the
// new turn, and writes out/agent/screen.png (the whole page) plus a text summary.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const dir = new URL('../out/agent/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const file = dir + 'session.json';
const session = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { runs: [], levels: [] };
session.levels ??= [];
const [cmd, move, c1 = 'users', c2 = 'servers'] = process.argv.slice(2);
if (cmd === 'new') { session.runs.push([]); session.levels.push(session.level ?? 'medium'); }
else if (cmd === 'level' && ['easy', 'medium', 'hard'].includes(move)) { session.level = move; }
else if (cmd === 'turn') {
  if (!['scale', 'market', 'apply'].includes(move)) { console.log('usage: turn <scale|market|apply> [card card]'); process.exit(1); }
  if (!session.runs.length) session.runs.push([]);
  session.runs[session.runs.length - 1].push([move, c1, c2]);
} else if (cmd !== 'look' && cmd !== 'level') { console.log('usage: new | level <easy|medium|hard> | turn <scale|market|apply> [card card] | look'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1150 } });
await page.goto('http://localhost:8672/web/?speed=40');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.rover);
const settle = () => page.waitForFunction(() => ['play', 'pick', 'over'].includes(window.rover.state.mode), null, { timeout: 30000 });
const key = async k => { await page.evaluate(k => window.rover.input(k), k); };
for (const [i, run] of session.runs.entries()) {
  await page.waitForTimeout(80);
  const lv = session.levels[i] ?? 'medium';
  if ((await page.evaluate(() => window.rover.state.level)) !== lv) { await page.evaluate(m => window.rover.setLevel(m), lv); await page.waitForTimeout(500); }
  await key('p'); await settle();
  for (const [m, ...look] of run) {
    const st = await page.evaluate(() => window.rover.state);
    if (!['play', 'pick'].includes(st.mode)) break;
    for (const c of look) if ((await page.evaluate(() => window.rover.state.mode)) === 'pick') await key(c);
    await key(m);
    await page.waitForFunction(() => window.rover.state.mode !== 'anim', null, { timeout: 30000 });
    await page.waitForTimeout(30);
    await settle();
  }
  if (i < session.runs.length - 1) { await page.waitForFunction(() => window.rover.state.mode === 'over', null, { timeout: 30000 }).catch(() => {}); }
}
if (cmd === 'turn' || cmd === 'new' || cmd === 'level') writeFileSync(file, JSON.stringify(session));
await page.evaluate(() => { const u = new URL(location); }); // no-op; page keeps speed for replay
await page.waitForTimeout(400);
const st = await page.evaluate(() => window.rover.state);
if (st.mode === 'over' || st.run.end) await page.waitForFunction(() => window.rover.state.mode === 'over', null, { timeout: 30000 }).catch(() => {});
await page.screenshot({ path: dir + 'screen.png', fullPage: true });
const s = await page.evaluate(() => window.rover.state);
const deck = await page.evaluate(() => window.rover.deck);
const ending = { gone: 'users GONE', burning: 'servers BURNING (outage)', broke: 'broke', time: 'out of time', finish: 'finished' };
const shown = await page.evaluate(() => window.rover.state.shown);
console.log(`run ${session.runs.length}  month ${Math.min(s.run.pos + 1, deck.length)}/${deck.length}  funds ${s.run.funds}  lives ${s.run.lives}  turns left ${s.run.turns - s.run.turn}  score ${s.run.score}${s.run.end ? '  ENDED: ' + ending[s.run.end] : ''}`);
console.log('cards seen this run:');
for (const [r, suits] of Object.entries(shown)) { const c = deck[r]; console.log(`  month ${+r + 1}: ` + suits.map(k => `${k} ${c[k]}`).join(', ')); }
console.log(`screenshot: ${dir}screen.png`);
await browser.close();
