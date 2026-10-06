// Strategy simulator: plays every strategy against the deck and checks the tuning targets and the
// patterns. Usage: node tools/sim.mjs [--spare 8]
import { readFileSync } from 'node:fs';
import { RULES } from '../web/engine.js';
import { analyse, trace } from '../web/analysis.js';

const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i < 0 ? undefined : Number(args[i + 1]); };
const file = JSON.parse(readFileSync(new URL('../web/deck.json', import.meta.url), 'utf8'));
const rules = { ...RULES, ...file.rules };
if (opt('spare') !== undefined) rules.spareTurns = opt('spare');
const deck = file.months, a = analyse(deck, rules);
const line = (k, s) => `${k.padEnd(26)}${String(s.score).padStart(3)}  ${s.end.padEnd(7)} ${String(s.pos).padStart(2)}/${deck.length}  ${trace(s)}`;
console.log(`${deck.length} months · ${deck.length + rules.spareTurns} turns · warm + traffic burn rate ${a.burnRate.toFixed(2)}`);
for (const [k, s] of Object.entries(a.runs)) console.log(line(k, s));
console.log(`${'random'.padEnd(26)}${a.random.toFixed(1)}`);
for (const [k, v] of a.checks) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
process.exitCode = a.pass ? 0 : 1;
