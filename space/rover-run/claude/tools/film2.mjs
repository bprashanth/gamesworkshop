// Record a v2 session as a film: three runs on three sols, keys taken from the
// simulator's policies so the film plays the real page.
//   sol 1  always go                     -> sand
//   sol 2  slope only (ignores haze)     -> storm
//   sol 3  slope answers soft, sample haze -> finish, replay
// Output: /mnt/seagate/gamesworkshop/rover-run/claude/renders/rover-run-v2-film.mp4 (+ symlink in media/)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, readdirSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { RULES } from '../v2/engine.js';
import { policies, playPolicy } from '../v2/analysis.js';

const file = JSON.parse(readFileSync(new URL('../v2/deck.json', import.meta.url), 'utf8')), rules = { ...RULES, ...file.rules };
const plan = [['always go', 0], ['slope only', 1], ['slope + sample haze', 2]].map(([p, i]) =>
  playPolicy(file.sols[i], rules, policies(file.sols[i])[p]).log.map(l => l.action === 'sample' ? [l.arg === 'ground' ? '1' : '2'] : [l.arg === 'safe' ? 'y' : 'n', l.action === 'go' ? 'g' : 'a']));
const OUT = '/mnt/seagate/gamesworkshop/rover-run/claude/renders', tmp = OUT + '/tmp2';
rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: tmp, size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
await page.goto('http://localhost:8670/v2/?film=1');
await page.evaluate(() => localStorage.clear()); await page.reload();
const wait = ms => page.waitForTimeout(ms);
const until = m => page.waitForFunction(m => window.rover.state.mode === m, m, { timeout: 60000 });
await wait(5500);
for (const [i, run] of plan.entries()) {
  await page.keyboard.press('p'); await wait(500);
  for (const keys of run) {
    await until('play'); await wait(450);
    for (const k of keys) { await page.keyboard.press(k); await wait(keys.length > 1 ? 380 : 100); }
  }
  await until('over'); await wait(i === plan.length - 1 ? 7000 : 2500);
}
await ctx.close(); await browser.close();
const webm = readdirSync(tmp).find(f => f.endsWith('.webm')), mp4 = OUT + '/rover-run-v2-film.mp4';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${tmp}/${webm}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', mp4]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-3', '-i', mp4, '-frames:v', '1', OUT + '/rover-run-v2-film-poster.jpg']);
rmSync(tmp, { recursive: true, force: true });
const media = new URL('../media/', import.meta.url).pathname;
for (const f of ['rover-run-v2-film.mp4', 'rover-run-v2-film-poster.jpg']) if (!existsSync(media + f)) symlinkSync(`${OUT}/${f}`, media + f);
console.log(mp4, plan.map(r => r.length));
