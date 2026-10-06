// Builds the Moon datasets from the hidden laws in web/moon.js. Deterministic (fixed seeds).
//   data/archive.json   ~100 observations in short histories: what the room studies
//   data/holdout.json   ~100 more from the same laws: the hidden final comparison
//   data/sudden.json    curated GO / NO GO finale cases
// The sealed 14-square route is built by tools/prep_moon.py (real light and slope) and checked here.
// Usage: node tools/build_archive.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { LAWS, lawOutcome, batteryAt } from '../web/moon.js';

let seed = 1;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = xs => xs[Math.floor(rand() * xs.length)];
const SUN = 'sun', SHADE = 'shade', DARK = 'dark';

// A plausible filler observation for the given light: temperature follows the light loosely,
// and nothing here should trigger a law on its own (the template places triggers deliberately).
function filler(light) {
  const temp = light === SUN ? pick(['warm', 'warm', 'cool', 'cold']) : light === SHADE ? pick(['cool', 'cool', 'cold', 'warm']) : pick(['cool', 'cool', 'warm']);
  return { light, temp, ground: pick(['firm', 'firm', 'loose', 'rocky']), slope: pick(['flat', 'flat', 'slope', 'steep']) };
}

// Each template returns an array of observations (without outcomes); `at` marks the intended
// trigger index (the observation whose law decides the next step), or null for a safe history.
const T = {
  // PERSISTS: three non-sun observations, non-firm ground at the third -> power loss next.
  power(len, k, ground = pick(['loose', 'rocky'])) {
    const h = Array.from({ length: len }, (_, i) => filler(i >= k - 2 && i <= k ? pick([SHADE, SHADE, DARK]) : SUN));
    for (let i = k - 2; i <= k; i++) { h[i].ground = i === k ? ground : 'firm'; if (h[i].light === DARK) h[i].temp = 'cool'; }
    if (h[k].ground === 'loose' && h[k].slope === 'steep') h[k].slope = 'slope';
    return { h, at: k, law: 'power' };
  },
  // WITH: dark and cold together -> frozen. `lead` adds a shaded run first (a shared precursor).
  frozen(len, k, lead) {
    const h = Array.from({ length: len }, () => filler(SUN));
    if (lead) for (let i = k - lead; i < k; i++) { h[i] = filler(SHADE); h[i].ground = 'firm'; }
    h[k] = { ...filler(DARK), light: DARK, temp: 'cold', ground: 'firm' };
    return { h, at: k, law: 'frozen' };
  },
  // WITH: loose ground and a steep slope together -> stuck.
  stuck(len, k) {
    const h = Array.from({ length: len }, () => filler(pick([SUN, SUN, SHADE])));
    h[k] = { ...h[k], ground: 'loose', slope: 'steep' };
    return { h, at: k, law: 'stuck' };
  },
  // Safe look-alikes: each matches one ingredient of a law, or a law with a lucky escape.
  escapeFirm(len, k) {                         // 3 shaded observations on firm ground, then sun: no power loss
    const h = Array.from({ length: len }, (_, i) => filler(i >= k - 2 && i <= k ? SHADE : SUN));
    for (let i = k - 2; i <= k; i++) { h[i].ground = 'firm'; h[i].temp = pick(['cool', 'warm']); }
    return { h, at: null };
  },
  coldSun(len) { return { h: Array.from({ length: len }, (_, i) => ({ ...filler(SUN), temp: i % 2 ? 'cold' : 'cool' })), at: null }; },
  darkMild(len, k) {                            // dark but not cold
    const h = Array.from({ length: len }, () => filler(SUN));
    h[k] = { ...filler(DARK), temp: 'cool' }; h[k + 1] = { ...filler(DARK), temp: 'warm' };
    return { h, at: null };
  },
  looseNotSteep(len) {                          // loose ground on flat and sloped ground; steep where firm
    const h = Array.from({ length: len }, (_, i) => ({ ...filler(SUN), ground: i % 2 ? 'loose' : 'firm', slope: i % 2 ? pick(['flat', 'slope']) : 'steep' }));
    return { h, at: null };
  },
  recovery(len, k) {                            // two shaded observations, then sun again
    const h = Array.from({ length: len }, (_, i) => filler(i === k || i === k + 1 ? SHADE : SUN));
    h[k].ground = pick(['loose', 'rocky']); h[k + 1].ground = pick(['loose', 'rocky']);
    return { h, at: null };
  },
};

// Turn a template draft into a finished history: outcomes from the laws, battery as a reading.
// `luck` lists trigger indices where a law fires but the rover gets through (honest uncertainty).
function finish({ h, at, law }, luck = []) {
  const out = [];
  for (let t = 0; t < h.length; t++) {
    const obs = { ...h[t], outcome: null };
    out.push(obs);
    if (t > 0) {
      const o = lawOutcome(out, t - 1);
      if (o && !luck.includes(t - 1)) { obs.outcome = o; break; }
    }
  }
  out.forEach((o, t) => { o.battery = batteryAt(out, t); });
  const failAt = out.findIndex(o => o.outcome);
  const lucky = at !== null && luck.includes(at);           // the law fired, the rover got through
  const ok = at === null || lucky ? (failAt === -1 && out.length === h.length) : (failAt === at + 1 && out[failAt].outcome === law);
  return ok ? out : null;
}

function build(spec, s) {
  seed = s;
  return spec.map(([name, args, luck]) => {
    for (let tries = 0; tries < 500; tries++) {
      const h = finish(T[name](...args), luck);
      if (h) return { id: '', kind: name, luck: luck ?? [], obs: h };
    }
    throw new Error(`could not build ${name}`);
  });
}

// 17 histories: 4 power, 4 frozen, 4 stuck failures; 5 safe look-alikes. Two "lucky" cases keep
// the WITH rules honest (3 of 4, not certain).
const SPEC = [
  ['power', [7, 4]], ['power', [6, 3]], ['power', [8, 5]], ['power', [6, 4]],
  ['frozen', [6, 4, 1]], ['frozen', [7, 3, 0]], ['frozen', [6, 4, 1]], ['frozen', [5, 2, 0]],
  ['stuck', [6, 3]], ['stuck', [7, 5]], ['stuck', [5, 2]], ['stuck', [6, 4]],
  ['escapeFirm', [7, 4]], ['escapeFirm', [6, 3]], ['coldSun', [6]], ['darkMild', [7, 2]], ['looseNotSteep', [6]],
  ['recovery', [6, 1]],
];
const LUCKY = [['frozen', [6, 3, 0], [3]], ['stuck', [6, 3], [3]]];   // the law fires; this time the rover gets through

const label = (hs, p) => hs.map((h, i) => ({ ...h, id: `${p}${String(i + 1).padStart(2, '0')}` }));
const archive = label(build([...SPEC, ...LUCKY], 7), 'H');
const holdout = label(build([...SPEC.map(([n, a]) => [n, a]), ...LUCKY].reverse(), 4242), 'X');

// Lucky cases must stay safe all the way through (no accidental failure after the luck).
for (const h of [...archive, ...holdout]) if (h.luck.length && h.obs.some(o => o.outcome)) throw new Error(`lucky ${h.id} failed`);

// Sudden death: short recent histories; the question is the next step. Each follows the laws
// exactly, and each is chosen so that a plausible simpler rule gets it wrong.
const obs = (light, temp, ground, slope) => ({ light, temp, ground, slope });
const SUDDEN = [
  { why: 'loose ground on a steep slope, in full sun', h: [obs('sun', 'warm', 'firm', 'flat'), obs('sun', 'warm', 'loose', 'steep')] },
  { why: 'dark, but only cool', h: [obs('sun', 'cool', 'firm', 'flat'), obs('dark', 'cool', 'loose', 'flat')] },
  { why: 'three shaded observations, the last on loose ground', h: [obs('sun', 'warm', 'firm', 'flat'), obs('shade', 'cool', 'firm', 'flat'), obs('shade', 'cool', 'rocky', 'flat'), obs('dark', 'cool', 'loose', 'slope')] },
  { why: 'three shaded observations, on firm ground', h: [obs('sun', 'warm', 'loose', 'flat'), obs('shade', 'cool', 'firm', 'flat'), obs('shade', 'cool', 'firm', 'slope'), obs('shade', 'cool', 'firm', 'flat')] },
  { why: 'cold, but in the sun', h: [obs('sun', 'cold', 'firm', 'slope'), obs('sun', 'cold', 'rocky', 'flat')] },
  { why: 'dark and cold, on firm ground after shade', h: [obs('sun', 'warm', 'firm', 'flat'), obs('shade', 'cool', 'firm', 'flat'), obs('dark', 'cold', 'firm', 'flat')] },
  { why: 'battery low, but the sun is back', h: [obs('shade', 'cool', 'loose', 'flat'), obs('shade', 'cool', 'firm', 'flat'), obs('sun', 'warm', 'loose', 'slope')] },
  { why: 'loose ground on a gentle slope after a steep one', h: [obs('sun', 'warm', 'firm', 'steep'), obs('shade', 'cool', 'loose', 'slope')] },
].map((c, i) => {
  const h = c.h.map(o => ({ ...o, outcome: null }));
  h.forEach((o, t) => { o.battery = batteryAt(h, t); });
  return { id: `S${i + 1}`, why: c.why, recent: h, next: lawOutcome(h, h.length - 1) ?? 'safe' };
});

// The sealed 14-square route: light and slope are measured along a real south-pole traverse
// (tools/prep_moon.py); ground and temperature are authored here so the same laws produce new
// combinations. Each square's outcome follows from the square before it.
const real = JSON.parse(readFileSync(new URL('../web/data/route_real.json', import.meta.url))).rows;
const AUTHORED = [   // [ground, temp] per square, and why
  ['firm', 'warm'],   //  1 landing, sunlit rim
  ['loose', 'cool'],  //  2 loose on a steep wall            -> 3 STUCK
  ['firm', 'cold'],   //  3 dark and cold                    -> 4 FROZEN
  ['firm', 'cool'],   //  4 third shaded square, firm        (a persistent-shadow rule cries wolf)
  ['rocky', 'cool'],  //  5 still shaded, rocky              -> 6 POWER LOSS
  ['firm', 'cool'],   //  6 still shaded, firm               (MODEL NEEDS YOU: shadow says no, firm says go)
  ['firm', 'warm'],   //  7 sun
  ['loose', 'cold'],  //  8 cold in the sun, loose but not steep
  ['firm', 'cool'],   //  9 shade begins
  ['rocky', 'cool'],  // 10
  ['firm', 'cool'],   // 11 third shaded square, firm         (MODEL NEEDS YOU)
  ['loose', 'cold'],  // 12 fourth shaded square, loose       -> 13 POWER LOSS
  ['firm', 'warm'],   // 13 sun again
  ['firm', 'warm'],   // 14 finish
];
const sealed = real.map((r, i) => ({ light: r.light, temp: AUTHORED[i][1], ground: AUTHORED[i][0], slope: r.slope, outcome: null }));
sealed.forEach((o, t) => { o.outcome = t ? lawOutcome(sealed, t - 1) ?? 'safe' : 'safe'; });
sealed.forEach((o, t) => { o.battery = batteryAt(sealed.map(x => ({ ...x, outcome: x.outcome === 'safe' ? null : x.outcome })), t); });
const EXPECT = ['safe', 'safe', 'stuck', 'frozen', 'safe', 'power', 'safe', 'safe', 'safe', 'safe', 'safe', 'safe', 'power', 'safe'];
sealed.forEach((o, i) => { if (o.outcome !== EXPECT[i]) throw new Error(`sealed square ${i + 1}: ${o.outcome}, expected ${EXPECT[i]}`); });

const meta = laws => ({ generated: 'tools/build_archive.mjs', laws: 'web/moon.js LAWS', note: 'Authored teaching data: the relationships are designed, not measured.' });
writeFileSync(new URL('../web/data/archive.json', import.meta.url), JSON.stringify({ ...meta(), histories: archive }, null, 1));
writeFileSync(new URL('../web/data/holdout.json', import.meta.url), JSON.stringify({ ...meta(), histories: holdout }, null, 1));
writeFileSync(new URL('../web/data/route.json', import.meta.url), JSON.stringify({ ...meta(), real: 'light and slope measured (data/route_real.json); ground, temperature, battery and outcomes authored by the laws', squares: sealed }, null, 1));
writeFileSync(new URL('../web/data/sudden.json', import.meta.url), JSON.stringify({ ...meta(), cases: SUDDEN }, null, 1));

const count = hs => { const c = { obs: 0, power: 0, frozen: 0, stuck: 0, safe: 0 }; for (const h of hs) { c.obs += h.obs.length; const o = h.obs.find(x => x.outcome); o ? c[o.outcome]++ : c.safe++; } return c; };
console.log('archive', JSON.stringify(count(archive)), `${archive.length} histories`);
console.log('holdout', JSON.stringify(count(holdout)), `${holdout.length} histories`);
console.log('sealed ', sealed.map((o, i) => `${i + 1}:${o.light[0]}${o.ground[0]}${o.slope[0]}${o.temp[0]}${o.battery[0]}>${o.outcome}`).join(' '));
console.log('sudden ', SUDDEN.map(c => `${c.id}:${c.next}`).join(' '));
