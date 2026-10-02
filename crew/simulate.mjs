#!/usr/bin/env node
/** Reproducible Phase 1 experiments. All policy calls happen inside game.mjs. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as game from './game.mjs';

const average = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const rounded = value => value === null ? null : Math.round(value * 10000) / 10000;
const countBy = xs => Object.fromEntries([...new Set(xs)].sort((a, b) => a - b).map(x => [x, xs.filter(y => y === x).length]));
const correlation = (xs, ys) => {
  const xm = average(xs), ym = average(ys);
  let cov = 0, xv = 0, yv = 0;
  xs.forEach((x, i) => { cov += (x - xm) * (ys[i] - ym); xv += (x - xm) ** 2; yv += (ys[i] - ym) ** 2; });
  return xv && yv ? cov / Math.sqrt(xv * yv) : null;
};
function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Filled by the engine adapter below; report aggregation is deliberately separate
// from bot decision making. Deal knowledge is used only AFTER games to audit luck.
function summarize(rows) {
  const complete = rows.filter(row => row.complete);
  const scores = complete.map(row => row.cost);
  const rankCounts = countBy(complete.flatMap(row => row.stack.map(card => card.rank)));
  const suits = [...new Set(complete.flatMap(row => row.stack.map(card => card.suit)))];
  return {
    games: rows.length,
    completed: complete.length,
    completionRate: rounded(complete.length / rows.length),
    averageCompleteCost: rounded(average(scores)),
    completeCostDistribution: countBy(scores),
    installedRankDistribution: rankCounts,
    bySuit: Object.fromEntries(suits.map(suit => {
      const cards = complete.flatMap(row => row.stack.filter(card => card.suit === suit));
      return [suit, { averageRank: rounded(average(cards.map(card => card.rank))), ranks: countBy(cards.map(card => card.rank)) }];
    })),
    installWinsBySeat: countBy(rows.flatMap(row => row.winners)),
    meanCompleteExcessAboveDealMinimum: rounded(average(complete.filter(row => row.dealMinimum !== null).map(row => row.cost - row.dealMinimum))),
    dealMinimumVsCostCorrelation: rounded(correlation(complete.map(row => row.dealMinimum), scores)),
    completeAtDealMinimum: complete.filter(row => row.cost === row.dealMinimum).length,
    conservativeDealCostVsFinalCorrelation: rounded(correlation(complete.map(row => row.conservativeDealCost), scores)),
    meanSavingAgainstConservativeDealCost: rounded(average(complete.map(row => row.conservativeDealCost - row.cost))),
    impossibleDealsMissingSuit: rows.filter(row => row.dealMinimum === null).length,
  };
}
function compare(a, b) {
  const both = a.filter((row, i) => row.complete && b[i].complete);
  const deltas = a.flatMap((row, i) => row.complete && b[i].complete ? [row.cost - b[i].cost] : []);
  return {
    matchedDeals: a.length,
    bothComplete: both.length,
    aOnlyComplete: a.filter((row, i) => row.complete && !b[i].complete).length,
    bOnlyComplete: b.filter((row, i) => !row.complete && b[i].complete).length,
    bothIncomplete: a.filter((row, i) => !row.complete && !b[i].complete).length,
    aCheaper: deltas.filter(x => x < 0).length,
    tiedCost: deltas.filter(x => x === 0).length,
    bCheaper: deltas.filter(x => x > 0).length,
    meanAMinusBCompleteCost: rounded(average(deltas)),
  };
}
/** Rank completed tables solely by sum, randomizing all ties before selection. */
export function qualifyTables(tables, seats = 5, rng = Math.random) {
  const eligible = tables.filter(table => table.complete).slice();
  // Fisher-Yates gives each table in any tied boundary group equal probability.
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  eligible.sort((a, b) => a.cost - b.cost);
  return eligible.slice(0, seats);
}
function roomStats(rows, size = 50) {
  const rng = random(831172);
  const rooms = [];
  for (let start = 0; start + size <= rows.length; start += size) {
    const tables = rows.slice(start, start + size);
    const qualifiers = qualifyTables(tables, 5, rng);
    const boundary = qualifiers.length === 5 ? qualifiers.at(-1).cost : null;
    const strictlyBetter = tables.filter(table => table.complete && table.cost < boundary).length;
    const boundaryTies = tables.filter(table => table.complete && table.cost === boundary).length;
    rooms.push({ boundary, costs: qualifiers.map(table => table.cost), drawRequired: boundary !== null && strictlyBetter + boundaryTies > 5, qualifiedSeeds: qualifiers.map(table => table.seed) });
  }
  return { tablesPerRoom: size, rooms: rooms.length, qualifierCostDistribution: countBy(rooms.flatMap(room => room.costs)), boundaryCostDistribution: countBy(rooms.filter(room => room.boundary !== null).map(room => room.boundary)), roomsWithBoundaryDraw: rooms.filter(room => room.drawRequired).length, insufficientCompleteTables: rooms.filter(room => room.costs.length < 5).length, examples: rooms.slice(0, 3) };
}

// Engine-specific adapter and CLI follow.
function dealMinimum(seed) {
  const state = game.createGame(seed);
  const cards = state.players.flatMap(player => player.hand);
  const minima = game.SUITS.map(({ id }) => Math.min(...cards.filter(card => card.suit === id).map(card => card.rank)));
  return minima.every(Number.isFinite) ? minima.reduce((a, b) => a + b, 0) : null;
}
function conservativeDealCost(seed) {
  const state = game.createGame(seed);
  const costs = game.SUITS.map(({ id }) => state.players.map(player => Math.min(...player.hand.filter(card => card.suit === id).map(card => card.rank))).filter(Number.isFinite));
  return costs.every(cards => cards.length) ? costs.reduce((sum, cards) => sum + Math.max(...cards), 0) : null;
}
function rowOf(seed, result) {
  return { seed, complete: result.complete, cost: result.cost, stack: result.state.stack.map(entry => entry.card), winners: result.state.stack.map(entry => entry.player), dealMinimum: dealMinimum(seed), conservativeDealCost: conservativeDealCost(seed), calls: result.decisions.map(decision => decision.suit) };
}
function protectedOriginal(seed, order = 'fixed') {
  // Original-rules control: save one cheapest card per unbuilt suit. No signaling
  // and no hidden-hand reads. The full state is never used to select a card.
  const state = game.createGame(seed, { winner: 'lowest' }), rng = game.seededRng(`${seed}:protected`), decisions = [];
  while (state.phase !== 'finished') {
    if (state.phase === 'call') {
      const choices = game.remainingSuits(state);
      const suit = choices[order === 'random' ? Math.floor(rng() * choices.length) : 0];
      decisions.push({ round: state.round, commander: state.commander, suit });
      game.callSuit(state, suit);
    } else if (state.phase === 'play') {
      const view = game.publicView(state, state.turn), unbuilt = game.remainingSuits(view);
      const legal = game.legalCards(view, view.seat);
      let card;
      if (legal.some(card => card.suit === view.calledSuit)) card = legal.reduce((best, card) => card.rank < best.rank ? card : best);
      else {
        card = legal.find(card => !unbuilt.includes(card.suit));
        if (!card) card = legal.find(card => legal.some(other => other.suit === card.suit && other.id !== card.id && (other.rank < card.rank || (other.rank === card.rank && other.id < card.id))));
        if (!card) throw new Error(`Preservation theorem violated at seed ${seed}, round ${state.round}`);
      }
      game.playCard(state, view.seat, card.id);
    } else game.resolveTrick(state);
  }
  return { state, complete: !state.failed && state.stack.length === 5, cost: state.failed ? null : game.totalCost(state), decisions };
}
export async function runExperiments({ count = 2500, firstSeed = 1, winner = 'lowest', signalMode = 'none' } = {}) {
  const configs = {
    strategic: { strategy: 'strategic', signals: true, order: 'strategic' },
    noSignals: { strategy: 'strategic', signals: false, order: 'strategic' },
    randomOrder: { strategy: 'strategic', signals: true, order: 'random' },
    fixedOrder: { strategy: 'strategic', signals: true, order: 'fixed' },
    randomLegal: { strategy: 'random', signals: true, order: 'random' },
  };
  for (const config of Object.values(configs)) Object.assign(config, {winner, signalMode});
  const rows = Object.fromEntries(Object.keys(configs).map(key => [key, []]));
  for (let index = 0; index < count; index++) {
    const seed = firstSeed + index;
    for (const [label, config] of Object.entries(configs)) rows[label].push(rowOf(seed, game.simulateGame(seed, config)));
  }
  const controlFixed = [], controlRandom = [];
  for (let index = 0; index < count; index++) {
    const seed = firstSeed + index;
    controlFixed.push(rowOf(seed, protectedOriginal(seed, 'fixed')));
    controlRandom.push(rowOf(seed, protectedOriginal(seed, 'random')));
  }
  const forks = [], forkSpreads = [];
  for (let index = 0; index < Math.min(count, 500); index++) {
    const seed = firstSeed + index;
    const variants = game.SUITS.map(({ id: firstSuit }) => rowOf(seed, game.simulateGame(seed, { ...configs.strategic, firstSuit })));
    const results = new Set(variants.map(row => row.complete ? row.cost : 'incomplete'));
    const costs = variants.filter(row => row.complete).map(row => row.cost);
    if (costs.length === game.SUITS.length) forkSpreads.push(Math.max(...costs) - Math.min(...costs));
    if (results.size > 1) forks.push({ seed, variants: variants.map((row, i) => ({ firstSuit: game.SUITS[i].id, complete: row.complete, cost: row.cost, calls: row.calls, stack: row.stack.map(card => ({ suit: card.suit, rank: card.rank })) })) });
  }
  const exampleSeed = forks[0]?.seed;
  const sameDealExample = exampleSeed === undefined ? null : {
    seed: exampleSeed,
    note: 'Full initial deal is shown for retrospective human audit only; no bot receives it.',
    initialHands: game.createGame(exampleSeed).players.map(player => ({ seat: player.id, cards: player.hand.map(card => ({ suit: card.suit, rank: card.rank, id: card.id })) })),
    branches: game.SUITS.map(({ id: firstSuit }) => {
      const result = game.simulateGame(exampleSeed, { ...configs.strategic, firstSuit });
      return { firstSuit, complete: result.complete, cost: result.cost, signals: result.state.players.map(player => ({ seat: player.id, signal: player.signal })), tricks: result.state.history };
    }),
  };
  const report = {
    generatedAt: new Date().toISOString(), seeds: { first: firstSeed, last: firstSeed + count - 1, count },
    rules: { installedCard: `${winner} called-suit rank; first played breaks equal ranks`, signalMode, baseline: 'lowest called-suit rank' },
    methodology: 'Paired deals for all policies. Failed stacks never receive a score or qualify. Complete-only averages can hide completion failures; read paired results alongside them. Bots receive public views only. Deal minimum is a retrospective lower bound, not bot knowledge.',
    variants: Object.fromEntries(Object.entries(rows).map(([name, rows]) => [name, summarize(rows)])),
    paired: {
      strategicVsNoSignals: compare(rows.strategic, rows.noSignals),
      strategicVsRandomOrder: compare(rows.strategic, rows.randomOrder),
      strategicVsFixedOrder: compare(rows.strategic, rows.fixedOrder),
      strategicVsRandomLegal: compare(rows.strategic, rows.randomLegal),
    },
    originalRulesPreservationControl: { fixed: summarize(controlFixed), random: summarize(controlRandom), paired: compare(controlFixed, controlRandom), explanation: 'If void, discard a built-suit card or a redundant card from another suit, preserving its cheapest. Such a card must exist by the pigeonhole principle: hand size equals unbuilt suit count. With lowest follow-suit play, every original suit minimum survives irrespective of order. Thus the original rules have a simple order-independent optimum.' },
    firstCallForks: { testedDeals: Math.min(count, 500), dealsWithDifferentOutcome: forks.length, meanBestWorstCostSpreadForAllCompleteBranches: rounded(average(forkSpreads)), costSpreadDistribution: countBy(forkSpreads), examples: forks.slice(0, 5) },
    roomQualification: roomStats(rows.strategic),
    sameDealExample,
    limits: ['Bot results demonstrate policy differences, not human enjoyment or optimal play.', 'The deal lower bound ignores information and timing; it is used only to estimate luck.', 'Suits share mechanical rules; observed differences include finite-sample noise and fixed signal tie preference. Seat win rates also reflect starting Commander and first-played rank ties.', 'Five tricks is deliberately brief. Human group testing is still required to assess replay appeal.'],
  };
  return report;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const countIndex = process.argv.indexOf('--games');
  const count = countIndex >= 0 ? Number(process.argv[countIndex + 1]) : 2500;
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('--games must be a positive integer');
  const report = await runExperiments({ count });
  const outDir = new URL('./reports/', import.meta.url);
  await mkdir(outDir, { recursive: true });
  await writeFile(new URL('lowest-no-signals.json', outDir), `${JSON.stringify(report, null, 2)}\n`);
  console.table(Object.entries(report.variants).map(([policy, result]) => ({ policy, complete: `${result.completed}/${result.games}`, meanCompleteCost: result.averageCompleteCost })));
  console.log('Paired comparisons:', JSON.stringify(report.paired, null, 2));
  console.log('Full report: crew/reports/lowest-no-signals.json');
}
