// Builds web/map.json: the "map" for Servers is a chart, not terrain. Across: 14 months, one strip
// each. The route is the demand curve: it climbs gently in whisper months, faster in chatter months
// and steeply in floods, so the parallel "contour" lines bunch up where demand is steep, just as
// steep ground does on Rover Run's map. Generated from web/deck.json so map and cards agree.
// Usage: node tools/chart.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const deck = JSON.parse(readFileSync(new URL('../web/deck.json', import.meta.url), 'utf8')).months;
const N = deck.length, PER = 24, RISE = { whisper: 0.12, chatter: 0.55, flood: 1.6 };
const L = 0.01, R = 0.99;                                          // strips span the chart's width
const strips = Array.from({ length: N + 1 }, (_, i) => +(L + (R - L) * i / N).toFixed(4));

// demand: integrate each month's rise, eased inside the month so the curve stays smooth
let level = 0; const raw = [];
for (let m = 0; m < N; m++) for (let k = 0; k < PER; k++) {
  const u = k / PER, x = L + (R - L) * (m + u) / N;
  raw.push([x, level + RISE[deck[m].queries] * (u * u * (3 - 2 * u))]);
  if (k === PER - 1) level += RISE[deck[m].queries];
}
raw.push([R, level]);
const top = 0.14, bottom = 0.84, ys = raw.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys);
const curve = raw.map(([x, v]) => [x, bottom - (v - lo) / (hi - lo) * (bottom - top)]);   // screen y grows downward
const yAt = x => { const i = Math.min(curve.length - 2, Math.max(0, Math.floor((x - L) / (R - L) * (curve.length - 1)))); const [x0, y0] = curve[i], [x1, y1] = curve[i + 1]; return y0 + (y1 - y0) * ((x - x0) / ((x1 - x0) || 1)); };

// contour-like lines: the demand curve shifted up and down, with a gentle organic wobble
const contours = [];
for (let k = -12; k <= 12; k++) {
  if (k === 0) continue;
  const p = [];
  for (let i = 0; i <= 400; i++) {
    const x = i / 400, y = yAt(Math.min(R, Math.max(L, x))) + k * 0.072 + 0.006 * Math.sin(x * 23 + k * 1.7) + 0.004 * Math.sin(x * 61 + k);
    if (y > 0.005 && y < 0.995) p.push(+x.toFixed(4), +y.toFixed(4)); else if (p.length >= 12) { contours.push({ e: +(0.5 - k / 24).toFixed(3), p: [...p] }); p.length = 0; } else p.length = 0;
  }
  if (p.length >= 12) contours.push({ e: +(0.5 - k / 24).toFixed(3), p });
}

const route = curve.flatMap(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]);
const rowStart = Array.from({ length: N + 1 }, (_, m) => Math.min(curve.length - 1, m * PER));
writeFileSync(new URL('../web/map.json', import.meta.url), JSON.stringify({
  aspect: 2, strips, route, rowStart, contours,
  source: { chart: 'Illustrative: demand over 14 months, drawn from the query cards (whisper, chatter, flood)' },
}));
console.log(`${contours.length} contour lines, ${curve.length} route points, ${N} strips`);
