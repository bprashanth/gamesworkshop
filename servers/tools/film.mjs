// Record a played session of Servers as a film: three runs that show a model forming.
//   run 1  always scale              -> users GONE in month 3, three lives lost
//   run 2  market after any warning  -> finishes, but marketing months score nothing
//   run 3  the model                 -> finishes, then the replay
// Output: /mnt/seagate/gamesworkshop/servers/renders/servers-film.mp4 (+ a symlink in media/)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, symlinkSync, existsSync } from 'node:fs';

const OUT = '/mnt/seagate/gamesworkshop/servers/renders';
const tmp = OUT + '/tmp';
rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: tmp, size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
await page.goto('http://localhost:8672/web/?film=1');
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
  'S S S S S',                                     // always scale: users GONE in month 3, three lives lost
  'S M M F M F M M M F M F M M M F S M F S',       // market after any warning: finishes, but marketing scores nothing
  'S M M F M F S S M F M F S S M F S M F S',       // the model: finishes
];
for (const [i, r] of runs.entries()) {
  await key('p', 600);
  for (const t of r.split(' ')) await turn(t);
  await until('over'); await wait(i === runs.length - 1 ? 6000 : 2500);
}
await ctx.close(); await browser.close();
const webm = readdirSync(tmp).find(f => f.endsWith('.webm'));
const mp4 = OUT + '/servers-film.mp4';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${tmp}/${webm}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', mp4]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-3', '-i', mp4, '-frames:v', '1', OUT + '/servers-film-poster.jpg']);
rmSync(tmp, { recursive: true, force: true });
const media = new URL('../media/', import.meta.url).pathname;
mkdirSync(media, { recursive: true });
for (const f of ['servers-film.mp4', 'servers-film-poster.jpg']) if (!existsSync(media + f)) symlinkSync(`${OUT}/${f}`, media + f);
console.log(mp4);
