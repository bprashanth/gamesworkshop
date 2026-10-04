// Turn-by-turn harness for an outside playtester (human or agent) driving the real page.
//   node tools/agent-play.mjs new                 start a fresh run (keeps memory of past runs)
//   node tools/agent-play.mjs turn <stop> <move> <card> <card>  stop: none|recharge|sample, move: go|avoid,
//        cards: the 2 of slope|ground|dust|battery to look at afterwards
//   node tools/agent-play.mjs look                re-render without acting
// Each call replays the session log in a headless browser at high speed, applies the
// new turn, and writes out/agent/screen.png (the whole page) plus a text summary.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const dir = new URL('../out/agent/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const file = dir + 'session.json';
const session = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { runs: [] };
const [cmd, stop, move, c1 = 'ground', c2 = 'dust'] = process.argv.slice(2);
if (cmd === 'new') session.runs.push([]);
else if (cmd === 'turn') {
  if (!['none', 'recharge', 'sample'].includes(stop) || !['go', 'avoid'].includes(move)) { console.log('usage: turn <none|recharge|sample> <go|avoid>'); process.exit(1); }
  if (!session.runs.length) session.runs.push([]);
  session.runs[session.runs.length - 1].push([stop, move, c1, c2]);
} else if (cmd !== 'look') { console.log('usage: new | turn <stop> <move> | look'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1150 } });
await page.goto('http://localhost:8670/web/?speed=40');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.rover);
const settle = () => page.waitForFunction(() => ['play', 'over'].includes(window.rover.state.mode), null, { timeout: 30000 });
const key = async k => { await page.evaluate(k => window.rover.input(k), k); };
for (const [i, run] of session.runs.entries()) {
  await page.waitForTimeout(80);
  await key('p'); await settle();
  for (const [s, m, ...look] of run) {
    const st = await page.evaluate(() => window.rover.state);
    if (st.mode !== 'play') break;
    if (s !== 'none') await key(s);
    await key(m);
    await page.waitForFunction(() => window.rover.state.mode !== 'anim', null, { timeout: 30000 });
    if ((await page.evaluate(() => window.rover.state.mode)) === 'pick') for (const c of look) await key(c);
    await page.waitForTimeout(30);
    await settle();
  }
  if (i < session.runs.length - 1) { await page.waitForFunction(() => window.rover.state.mode === 'over', null, { timeout: 30000 }).catch(() => {}); }
}
if (cmd === 'turn' || cmd === 'new') writeFileSync(file, JSON.stringify(session));
await page.evaluate(() => { const u = new URL(location); }); // no-op; page keeps speed for replay
await page.waitForTimeout(400);
const st = await page.evaluate(() => window.rover.state);
if (st.mode === 'over' || st.run.end) await page.waitForFunction(() => window.rover.state.mode === 'over', null, { timeout: 30000 }).catch(() => {});
await page.screenshot({ path: dir + 'screen.png', fullPage: true });
const s = await page.evaluate(() => window.rover.state);
const deck = await page.evaluate(() => window.rover.deck);
const shown = await page.evaluate(() => window.rover.state.shown);
console.log(`run ${session.runs.length}  row ${Math.min(s.run.pos + 1, deck.length)}/${deck.length}  battery ${s.run.battery}  stops left ${s.run.stops}  score ${s.run.score}${s.run.end ? '  ENDED: ' + s.run.end : ''}`);
console.log('cards you looked at this run:');
for (const [r, suits] of Object.entries(shown)) { const c = deck[r]; console.log(`  row ${+r + 1}: ` + suits.map(k => `${k} ${k === 'battery' ? ((c.ground === 'sand' || c.dust === 'storm') ? '-' : c.battery) : c[k]}`).join(', ')); }
console.log(`screenshot: ${dir}screen.png`);
await browser.close();
