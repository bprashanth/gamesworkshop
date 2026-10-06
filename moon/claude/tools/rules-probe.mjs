// Scores a spread of candidate rules against the archive, to see the evaluator's distribution.
import { readFileSync } from 'node:fs';
import { evaluate, describe } from '../web/moon.js';
const H = JSON.parse(readFileSync(new URL('../web/data/archive.json', import.meta.url))).histories.map(h => h.obs);
const B = (k, v, then) => ({ type: 'before', a: { key: k, value: v }, then });
const P = (k, v, n, then) => ({ type: 'persists', a: { key: k, value: v }, n, then });
const Wt = (k, v, k2, v2, then, n = 1) => ({ type: 'with', a: { key: k, value: v }, n, b: { key: k2, value: v2 }, then });
export const PROBES = [
  ['intended', P('light', 'shade or dark', 3, 'power')],
  ['intended', Wt('light', 'shade or dark', 'ground', 'loose or rocky', 'power', 3)],
  ['intended', Wt('light', 'dark', 'temp', 'cold', 'frozen')],
  ['intended', Wt('ground', 'loose', 'slope', 'steep', 'stuck')],
  ['intended-safe', Wt('light', 'shade', 'ground', 'firm', 'safe', 2)],
  ['safe-broad', Wt('light', 'shade or dark', 'ground', 'firm', 'safe', 3)],
  ['general', P('light', 'shade or dark', 2, 'any')],
  ['general', P('light', 'shade or dark', 3, 'any')],
  ['single', B('light', 'dark', 'frozen')],
  ['single', B('temp', 'cold', 'frozen')],
  ['single', B('ground', 'loose', 'stuck')],
  ['single', B('slope', 'steep', 'stuck')],
  ['single', B('light', 'shade or dark', 'power')],
  ['single', B('light', 'shade', 'power')],
  ['late', B('battery', 'dead', 'power')],
  ['late-ish', B('battery', 'low', 'power')],
  ['late-ish', B('battery', 'low or dead', 'power')],
  ['overfit', Wt('ground', 'rocky', 'slope', 'steep', 'stuck')],
  ['overfit', Wt('temp', 'cold', 'slope', 'steep', 'frozen')],
  ['noise', B('ground', 'rocky', 'any')],
  ['noise', B('slope', 'flat', 'any')],
  ['trivial', B('light', 'sun', 'safe')],
];
if (process.argv[1].endsWith('rules-probe.mjs')) for (const [tag, r] of PROBES) {
  const e = evaluate(r, H);
  const d = e.kind === 'safe' ? `said ${e.said} wrong ${e.wrong}` : `caught ${e.caught}/${e.failures} late ${e.late} fa ${e.falseAlarms}/${e.alerts} lead ${e.lead}`;
  console.log(`${tag.padEnd(13)} ${String(e.score).padStart(3)} ${e.verdict.padEnd(13)} ${d.padEnd(34)} ${describe(r)}`);
}
