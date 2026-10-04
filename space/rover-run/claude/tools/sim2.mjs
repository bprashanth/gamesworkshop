// v2 simulator. Usage: node tools/sim2.mjs [--turns 22] [--sol n]
import { readFileSync } from 'node:fs';
import { RULES } from '../v2/engine.js';
import { analyse, trace } from '../v2/analysis.js';
const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i < 0 ? undefined : Number(args[i + 1]); };
const file = JSON.parse(readFileSync(new URL('../v2/deck.json', import.meta.url), 'utf8'));
const rules = { ...RULES, ...file.rules };
if (opt('turns')) rules.turns = opt('turns');
if (opt('avoid')) rules.avoidTurns = opt('avoid');
let failed = false;
for (const [i, deck] of file.sols.entries()) {
  if (opt('sol') && opt('sol') !== i + 1) continue;
  const a = analyse(deck, rules);
  console.log(`\nsol ${i + 1} · ${deck.length} rows · ${rules.turns} turns · avoid ${rules.avoidTurns} turns`);
  for (const [k, s] of Object.entries(a.runs)) console.log(`${k.padEnd(22)}${String(s.score).padStart(3)}  ${s.end.padEnd(6)} rows ${String(s.rows).padStart(2)} calls ${s.right}/${s.calls}  ${trace(s)}`);
  console.log(`${'random'.padEnd(22)}${a.random.toFixed(1)}`);
  for (const [k, v] of a.checks) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
  failed ||= !a.pass;
}
process.exitCode = failed ? 1 : 0;
