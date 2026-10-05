// Strategy simulator: plays every rulebook strategy against a deck and checks the
// tuning targets. Usage: node tools/sim.mjs [deck.json] [--sol 2] [--battery 8 --spare 5 --recharge 2]
import { readFileSync } from 'node:fs';
import { RULES } from '../web/engine.js';
import { analyse, trace } from '../web/analysis.js';

const args = process.argv.slice(2);
const file = args.find(a => a.endsWith('.json')) || new URL('../web/deck.json', import.meta.url).pathname;
const opt = k => { const i = args.indexOf('--' + k); return i < 0 ? undefined : Number(args[i + 1]); };
const raw = JSON.parse(readFileSync(file, 'utf8'));
const rules = { ...RULES, ...(raw.rules ?? {}) };
for (const [k, r] of [['battery', 'battery'], ['spare', 'spareTurns'], ['recharge', 'recharge']]) if (opt(k) !== undefined) rules[r] = opt(k);
const sols = raw.sols ?? [raw.rows ?? raw];
let failed = false;
for (const [i, deck] of sols.entries()) {
  if (opt('sol') && opt('sol') !== i + 1) continue;
  const a = analyse(deck, rules);
  const line = (k, s) => `${k.padEnd(26)}${String(s.score).padStart(3)}  ${s.end.padEnd(7)} ${String(s.pos).padStart(2)}/${deck.length}  ${trace(s)}`;
  console.log(`\nsol ${i + 1} · ${deck.length} rows · battery ${rules.battery} · turns ${deck.length + rules.spareTurns} · recharge +${rules.recharge} · straight-through battery ${a.straight}`);
  console.log(line('hindsight ceiling', a.ceiling));
  for (const [k, s] of Object.entries(a.runs)) console.log(line(k, s));
  console.log(`${'random'.padEnd(26)}${a.random.toFixed(1)}`);
  for (const [k, v] of a.checks) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
  failed ||= !a.pass;
}
process.exitCode = failed ? 1 : 0;
