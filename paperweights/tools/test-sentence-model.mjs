import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Browser ES module, without requiring a package-wide Node module-mode change.
const source = await readFile(new URL('../web/sentence-model.js', import.meta.url), 'utf8');
const {matchingSheets, chooseWord} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const fixture = {size: 5, sheets: [
  [['RED:the', 'BLUE:robot']], [['RED:the', 'GREEN:robot']],
  [['RED:the', 'BLUE:robot']], [['RED:the', 'GREEN:robot']],
  [['BLUE:the', 'PINK:boat']],
]};
assert.deepEqual(matchingSheets(fixture, 'RED:the').map(x => x.id), [1, 2, 3, 4]);
const tie = chooseWord(fixture, 'RED:the', 'majority', null, () => 0);
assert.deepEqual(tie.counts, {'BLUE:robot': 2, 'GREEN:robot': 2});
assert.equal(tie.chosen, 'BLUE:robot');
assert.equal(tie.tie, true);
assert.equal(chooseWord(fixture, 'RED:the', 'random', null, () => .99).chosen, 'GREEN:robot');
assert.equal(chooseWord(fixture, 'RED:the', 'random', 4).total, 1);
assert.equal(chooseWord(fixture, 'RED:the', 'majority', 200).total, 4);
assert.deepEqual(chooseWord(fixture, 'AMBER:absent', 'majority'), {
  chosen: null, counts: {}, voterIds: [], eligible: 0, total: 0, tie: false,
});
for (const bad of [0, -1, .5, NaN, '2', Infinity]) {
  assert.throws(() => chooseWord(fixture, 'RED:the', 'majority', bad), RangeError);
}
assert.throws(() => chooseWord(fixture, 'RED:the', 'bad'), RangeError);
assert.throws(() => chooseWord(fixture, 'RED:the', 'random', null, () => 1), RangeError);
assert.throws(() => matchingSheets({sheets: [[['RED:x', 'BLUE:y'], ['RED:x', 'BLUE:z']]]}, 'RED:x'), /repeats/);

function rng(seed) {
  return () => ((seed = Math.imul(1664525, seed) + 1013904223 >>> 0) / 4294967296);
}
const sizes = [];
for (const size of [15, 100, 200]) {
  const pack = JSON.parse(await readFile(new URL(`../out/rover-review/paperweights/web/sentence-packs/${size}.json`, import.meta.url), 'utf8'));
  assert.equal(pack.sheets.length, size);
  const before = JSON.stringify(pack);
  const cues = [...new Set(pack.sheets.flatMap(s => s.map(([left]) => left)))];
  for (const cue of cues) {
    const full = chooseWord(pack, cue, 'majority');
    const actual = {};
    for (const sheet of pack.sheets) for (const [left, right] of sheet) {
      if (left === cue) actual[right] = (actual[right] || 0) + 1;
    }
    assert.deepEqual(full.counts, actual);
    const sampled = chooseWord(pack, cue, 'majority', 5, rng(42));
    assert.deepEqual(sampled, chooseWord(pack, cue, 'majority', 5, rng(42)));
    assert.equal(new Set(sampled.voterIds).size, sampled.total);
    assert.equal(sampled.total, Math.min(5, full.eligible));
    const counted = {};
    for (const id of sampled.voterIds) {
      const right = pack.sheets[id - 1].find(([left]) => left === cue)[1];
      counted[right] = (counted[right] || 0) + 1;
    }
    assert.deepEqual(sampled.counts, counted);
  }
  for (const kind of ['random', 'majority']) for (let seed = 0; seed < 100; seed++) {
    let cue = 'RED:one';
    const random = rng(seed);
    for (let turn = 0; turn < 14; turn++) {
      const result = chooseWord(pack, cue, kind, kind === 'majority' && seed % 2 ? 5 : null, random);
      assert.ok(result.chosen);
      assert.ok(matchingSheets(pack, cue).some(person => person.next === result.chosen));
      cue = result.chosen;
      assert.equal(cue.endsWith(':.'), turn === 13, `Unexpected stop at turn ${turn}`);
    }
  }
  assert.equal(JSON.stringify(pack), before, 'Voting must not mutate sheets');
  sizes.push(size);
}
console.log(JSON.stringify({sizes, completeChains: sizes.length * 200, checks: 'Exact counts, distinct voters, color continuity, no invented edges, reproducible sampling, punctuation termination'}));
