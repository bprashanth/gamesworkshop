import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyTables } from './simulate.mjs';
import { seededRng } from './game.mjs';

test('only complete stacks qualify, with cost as the sole ranking statistic', () => {
  const tables = [
    { seed: 1, complete: true, cost: 9 },
    { seed: 2, complete: false, cost: 0 },
    { seed: 3, complete: true, cost: 6 },
    { seed: 4, complete: true, cost: 7 },
    { seed: 5, complete: true, cost: 5 },
    { seed: 6, complete: true, cost: 8 },
    { seed: 7, complete: true, cost: 10 },
  ];
  const before = structuredClone(tables);
  assert.deepEqual(qualifyTables(tables, 5, () => 0.5).map(table => table.cost), [5, 6, 7, 8, 9]);
  assert.deepEqual(tables, before, 'qualification must not reorder the source report');
});

test('boundary ties use random draw, and preserve tables strictly below the boundary', () => {
  const tables = [
    { seed: 0, complete: true, cost: 5 },
    ...Array.from({ length: 8 }, (_, i) => ({ seed: i + 1, complete: true, cost: 6 })),
  ];
  const seen = new Set();
  for (let i = 1; i <= 100; i++) {
    const rng = seededRng(i);
    const winners = qualifyTables(tables, 5, rng);
    assert.equal(winners.length, 5);
    assert.equal(winners[0].seed, 0);
    winners.slice(1).forEach(winner => seen.add(winner.seed));
  }
  assert.equal(seen.size, 8, 'every boundary-tied table can qualify');
});

test('rooms with fewer than five complete stacks produce only available qualifiers', () => {
  assert.deepEqual(qualifyTables([{ complete: false, cost: 1 }]), []);
  assert.equal(qualifyTables([{ complete: true, cost: 20 }]).length, 1);
});
