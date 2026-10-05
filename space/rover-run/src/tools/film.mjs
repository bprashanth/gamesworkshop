// Record a played session of the real page as a film: three runs that show a model forming.
//   run 1  always go                 -> sand trap on row 3
//   run 2  avoid after any warning   -> battery dies on the rim (ignores slope)
//   run 3  warnings + slope          -> finishes, then the replay overlays all three
// Output: /mnt/seagate/gamesworkshop/rover-run/src/renders/rover-run-film.mp4 (+ symlink in media/)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, symlinkSync, existsSync } from 'node:fs';

const OUT = '/mnt/seagate/gamesworkshop/rover-run/src/renders';
const tmp = OUT + '/tmp';
rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: tmp, size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
await page.goto('http://localhost:8670/web/?film=1');
await page.evaluate(() => localStorage.clear());
await page.reload();
const wait = ms => page.waitForTimeout(ms);
const until = mode => page.waitForFunction(m => window.rover.state.mode === m, mode, { timeout: 60000 });
const key = async (k, ms = 900) => { await page.keyboard.press(k); await wait(ms); };
const turn = async t => {                       // one action: G, A or R; first look ahead if asked
  await page.waitForFunction(() => ['play', 'pick'].includes(window.rover.state.mode), null, { timeout: 60000 });
  // look at 2 cards of the square ahead: ground and dust (slope is on the map, battery is what you do)
  if ((await page.evaluate(() => window.rover.state.mode)) === 'pick') { await wait(500); await key('2', 450); await key('3', 300); }
  await until('play'); await wait(500);
  await key(t.toLowerCase(), 200);
};
await wait(5200);                                 // intro draws itself
const runs = [                                    // the simulator's lines (tools/sim.mjs), medium mode
  'G G G',                                         // always go: sand on square 3
  'G A R A R A R G A R A R G A R A R A R A R',     // avoid after any warning: out of turns
  'G G A R A R G A R G G A R G A R G A R A',       // the model: finishes
];
for (const [i, r] of runs.entries()) {
  await key('p', 600);
  for (const t of r.split(' ')) await turn(t);
  await until('over'); await wait(i === runs.length - 1 ? 6000 : 2500);
}
await ctx.close(); await browser.close();
const webm = readdirSync(tmp).find(f => f.endsWith('.webm'));
const mp4 = OUT + '/rover-run-film.mp4';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${tmp}/${webm}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', mp4]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-3', '-i', mp4, '-frames:v', '1', OUT + '/rover-run-film-poster.jpg']);
rmSync(tmp, { recursive: true, force: true });
const media = new URL('../media/', import.meta.url).pathname;
mkdirSync(media, { recursive: true });
for (const f of ['rover-run-film.mp4', 'rover-run-film-poster.jpg']) if (!existsSync(media + f)) symlinkSync(`${OUT}/${f}`, media + f);
console.log(mp4);
