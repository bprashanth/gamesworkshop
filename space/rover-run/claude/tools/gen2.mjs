// v2 sols: same route and slopes, new ground and weather, same patterns.
// Usage: node tools/gen2.mjs [count=7] [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { RULES } from '../v2/engine.js';
import { analyse } from '../v2/analysis.js';

const path = new URL('../v2/deck.json', import.meta.url).pathname;
const file = JSON.parse(readFileSync(path, 'utf8'));
const rules = { ...RULES, ...file.rules }, base = file.sols[0];
const slopes = base.map(r => r.slope), N = slopes.length, count = Number(process.argv[2]) || 7;
let seed = 4242;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = xs => xs[Math.floor(rand() * xs.length)];
const rows = [...Array(N).keys()];

function candidate() {
  const g = Array(N).fill('firm'), d = Array(N).fill('clear');
  for (let k = 0; k < 2; k++) {
    const i = pick(rows.filter(i => i >= 2 && slopes[i] !== 'steep' && g[i] === 'firm' && g[i - 1] === 'firm' && g[i + 1] !== 'soft'));
    if (i === undefined) return null;
    g[i] = 'sand'; g[i - 1] = 'soft';
  }
  for (const i of rows.filter(i => i < N - 1 && slopes[i + 1] === 'steep' && g[i] === 'firm')) if (rand() < 0.8) g[i] = 'soft';
  for (let k = 0; k < 2; k++) {
    const j = pick(rows.filter(j => j >= 2 && d[j] === 'clear' && d[j - 1] === 'clear' && g[j] !== 'sand' && d[j + 1] !== 'haze'));
    if (j === undefined) return null;
    d[j] = 'storm'; d[j - 1] = 'haze';
  }
  const target = 6 + Math.floor(rand() * 2);                    // 6–7 haze rows, 2 storms
  for (let tries = 0; d.filter(x => x === 'haze').length < target && tries < 50; tries++) {
    const j = pick(rows.filter(j => j < N - 1 && d[j] === 'clear' && d[j + 1] !== 'storm'));
    if (j !== undefined) d[j] = 'haze';
  }
  return slopes.map((slope, i) => ({ slope, ground: g[i], dust: d[i] }));
}
const key = deck => deck.map(r => r.ground[0] + r.dust[0]).join('');
const seen = new Set(file.sols.map(key)), found = [];
for (let tries = 0; found.length < count && tries < 20000; tries++) {
  const deck = candidate();
  if (!deck || seen.has(key(deck))) continue;
  seen.add(key(deck));
  const a = analyse(deck, rules);
  if (!a.pass) continue;
  found.push(deck);
  console.log(`sol ${found.length + 1}: ${key(deck)}  intended ${a.scores['slope + sample haze']}  no-sample ${a.scores['warnings + slope']}  any-warning ${a.scores['avoid any warning']}  random ${a.random.toFixed(1)}`);
}
if (process.argv.includes('--write')) { file.sols = [base, ...found]; writeFileSync(path, JSON.stringify(file, null, 1)); console.log(`wrote ${file.sols.length} sols`); }
