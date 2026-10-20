// Which card to flip next, given one visible card, from the Indicators archive.
// Writes household-answers.json: {key: {weights:{category:share}, freq}} keyed "C01:harvest:failed".
import {createPack, poll, categories, currentRound} from '../../households/model.js';
import {writeFileSync} from 'node:fs';
const pack = createPack(15, 200, 'medium');
const out = {};
for (const ctx of pack.contexts) for (const [cat, values] of Object.entries({harvest:['good','weak','failed'],cash:['enough','low','loan'],attendance:['regular','irregular'],weather:['sun','rain','storm']}))
  for (const value of values) {
    const tally = {};
    for (const t of pack.teams) {
      const round = {teamId: t.id, contextId: ctx.id, targetCues: {[cat]: {value}}};
      let p; try { p = poll(pack, round, [cat], 3); } catch { continue; }
      for (const c of categories) if (c !== cat) tally[c] = (tally[c] || 0) + p.counts[c];
      tally.avoid = (tally.avoid || 0) + p.counts.avoid; tally.go = (tally.go || 0) + p.counts.go;
    }
    out[`${ctx.id}:${cat}:${value}`] = tally;
  }
// How often each key is the latest revealed card at the start of a turn (any seed, all-skip paths).
const freq = {};
for (let seed = 1; seed <= 300; seed++) { const p = {seed, mode: 'medium'};
  for (let team = 0; team < 4; team++) for (let i = 0; i < 6; i++) { const r = currentRound(p, team, Array(i).fill('go'));
    const c = r.initialCategory, k = `${r.contextId}:${c}:${r.targetCues[c].value}`; freq[k] = (freq[k] || 0) + 1; } }
for (const k in out) out[k].freq = freq[k] || 0;
writeFileSync(new URL('household-answers.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
for (const [k, v] of Object.entries(out)) { const {freq, go, avoid, ...flip} = v; const tot = Object.values(flip).reduce((a, b) => a + b, 0);
  console.log(k.padEnd(24), String(freq).padStart(4), 'avoid%', Math.round(100*avoid/(go+avoid||1)).toString().padStart(3), tot ? Object.entries(flip).map(([c, n]) => c + ':' + Math.round(100*n/tot)).join(' ') : '— no flip helps'); }

// Keys that actually occur in the seed-15 Indicators game, over every Skip/Intervene path.
// Includes the card a team sees after flipping Harvest or Cash, so sheets cover follow-up calls.
const live = createPack(15, 200, 'medium'), occur = {};
for (let team = 0; team < 4; team++) for (let mask = 0; mask < 64; mask++) for (let i = 0; i < 6; i++) {
  const legs = Array.from({length: i}, (_, k) => mask >> k & 1 ? 'avoid' : 'go'), r = currentRound(live, team, legs);
  for (const c of [r.initialCategory, 'harvest', 'cash']) { const k = `${r.contextId}:${c}:${r.targetCues[c].value}`; occur[k] = (occur[k] || 0) + (c === r.initialCategory ? 2 : 1); }
}
for (const k in out) out[k].occur = occur[k] || 0;
writeFileSync(new URL('household-answers.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
