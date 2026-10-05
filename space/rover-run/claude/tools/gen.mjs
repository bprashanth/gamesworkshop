// New sols: same real route and slopes, new hidden ground and weather, same three
// patterns. A memorised deck fails here; a model of the patterns carries over.
// Usage: node tools/gen.mjs [count=4] [--write]   (--write appends to web/deck.json "sols")
import { readFileSync, writeFileSync } from 'node:fs';
import { RULES, batteryCard } from '../web/engine.js';
import { analyse } from '../web/analysis.js';

const path = new URL('../web/deck.json', import.meta.url).pathname;
const file = JSON.parse(readFileSync(path, 'utf8'));
const rules = { ...RULES, ...file.rules }, base = file.sols?.[0] ?? file.rows;
const slopes = base.map(r => r.slope), N = slopes.length;
const count = Number(process.argv[2]) || 4;
let seed = 2026;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = xs => xs[Math.floor(rand() * xs.length)];

function candidate() {
  const g = Array(N).fill('firm'), d = Array(N).fill('clear');
  // sand traps on non-steep rows, each warned by a soft row (two on a long route, one on a short one)
  const traps = N >= 12 ? 2 : 1;
  for (let k = 0; k < traps; k++) {
    const i = pick([...Array(N).keys()].filter(i => i >= 2 && slopes[i] !== 'steep' && g[i] === 'firm' && g[i - 1] === 'firm' && g[i + 1] !== 'soft'));
    if (i === undefined) return null;
    g[i] = 'sand'; g[i - 1] = 'soft';
  }
  // soft false alarms: only where the next row is steep
  for (const i of [...Array(N - 1).keys()].filter(i => slopes[i + 1] === 'steep' && g[i] === 'firm')) if (rand() < 0.75) g[i] = 'soft';
  // storms, each warned by haze; one haze false alarm
  for (let k = 0; k < traps; k++) {
    const j = pick([...Array(N).keys()].filter(j => j >= 2 && d[j] === 'clear' && d[j - 1] === 'clear' && g[j] !== 'sand' && d[j + 1] !== 'haze'));
    if (j === undefined) return null;
    d[j] = 'storm'; d[j - 1] = 'haze';
  }
  const f = pick([...Array(N - 1).keys()].filter(j => j >= 1 && d[j] === 'clear' && d[j + 1] === 'clear' && d[j - 1] !== 'haze'));
  if (f === undefined) return null;
  d[f] = 'haze';
  return slopes.map((slope, i) => ({ slope, ground: g[i], dust: d[i], battery: (g[i] === 'sand' || d[i] === 'storm') ? 0 : batteryCard(g[i], d[i]) }));
}

const key = deck => deck.map(r => r.ground[0] + r.dust[0]).join('');
const seen = new Set([key(base), ...(file.sols ?? []).map(key)]), found = [];
for (let tries = 0; found.length < count && tries < 4000; tries++) {
  const deck = candidate();
  if (!deck || seen.has(key(deck))) continue;
  seen.add(key(deck));
  const quick = analyse(deck, rules, { ceiling: false, trials: 4000 });
  if (!quick.pass) continue;
  const full = analyse(deck, rules);
  if (!full.pass) continue;
  found.push(deck);
  console.log(`sol ${found.length + 1}: ${key(deck)}  intended ${full.scores['warnings + slope']}  any-warning ${full.scores['avoid any warning']}  random ${full.random.toFixed(1)}  (try ${tries})`);
}
if (process.argv.includes('--write')) {
  file.sols = [base, ...found];
  delete file.rows;
  writeFileSync(path, JSON.stringify(file, null, 1));
  console.log(`wrote ${file.sols.length} sols to web/deck.json`);
}
