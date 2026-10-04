// Screenshot helper: node tools/shot.mjs out.png [keys...] [--wait ms] [--w 1400]
// Keys are pressed one by one with a pause; "~" waits 1.5 s.
import { chromium } from 'playwright';
const args = process.argv.slice(2);
const out = args[0], keys = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] ?? '').startsWith('--'));
const opt = k => { const i = args.indexOf('--' + k); return i < 0 ? undefined : Number(args[i + 1]); };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: opt('w') ?? 1400, height: opt('h') ?? 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => m.type() === 'error' && errors.push(m.text()));
await page.goto(`http://localhost:8670/${process.env.ROVER_PATH ?? 'web/'}${opt('speed') ? '?speed=' + opt('speed') : ''}`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(opt('intro') ?? 4200);
for (const k of keys) {
  if (k === '~') { await page.waitForTimeout(1500); continue; }
  await page.keyboard.press(k);
  await page.waitForTimeout(opt('gap') ?? 2600);
}
await page.waitForTimeout(opt('wait') ?? 300);
if (opt('frames')) {
  for (let i = 0; i < opt('frames'); i++) {
    await page.locator('canvas').screenshot({ path: out.replace('.png', `-${String(i).padStart(2, '0')}.png`) });
    await page.waitForTimeout(opt('every') ?? 300);
  }
} else await page.screenshot({ path: out, fullPage: true });
console.log(JSON.stringify(await page.evaluate(() => { const s = window.rover?.state; return s && { mode: s.mode, pos: s.run.pos, battery: s.run.battery, turn: s.run.turn, peeks: s.run.peeks, score: s.run.score, end: s.run.end }; })));
if (errors.length) console.log('ERRORS', errors);
await browser.close();
