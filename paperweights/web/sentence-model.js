/** Actual paper-sheet lookups, with one vote per matching person.
 * Pack: {size, seed, sheets: Array<Array<[leftCue, rightCue]>>}.
 * Cues retain both color and token, e.g. "BLUE:robot".
 */
export function matchingSheets(pack, cue) {
  if (!pack || !Array.isArray(pack.sheets)) throw new TypeError('Missing sheet deal');
  return pack.sheets.flatMap((sheet, index) => {
    const rows = sheet.filter(([left]) => left === cue);
    if (rows.length > 1) throw new Error(`Sheet ${index + 1} repeats cue ${cue}`);
    return rows.length ? [{id: index + 1, next: rows[0][1]}] : [];
  });
}

/** Random picks one matching person. Majority samples up to limit matching
 * people uniformly without replacement; null means everyone eligible.
 * counts keys are complete next cues. total is votes cast, eligible is matching
 * people. Ties use ascending cue order, without inventing an unseen edge.
 * No matches returns chosen:null and empty counts. Caller stops at punctuation.
 * rng must return a number in [0,1); inject it for reproducible rehearsals.
 */
export function chooseWord(pack, cue, kind, limit = null, rng = Math.random) {
  if (kind !== 'random' && kind !== 'majority') throw new RangeError('Unknown vote kind');
  if (limit !== null && (!Number.isSafeInteger(limit) || limit < 1)) {
    throw new RangeError('Voter limit must be a positive integer or null');
  }
  const people = matchingSheets(pack, cue);
  const eligible = people.length;
  const total = kind === 'random' ? Math.min(1, eligible) : Math.min(limit ?? eligible, eligible);
  // Partial Fisher-Yates selects distinct people, rather than resampling words.
  for (let i = 0; i < total; i++) {
    if (i === people.length - 1) break;
    const draw = rng();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new RangeError('Invalid random draw');
    const j = i + Math.floor(draw * (people.length - i));
    [people[i], people[j]] = [people[j], people[i]];
  }
  const voters = people.slice(0, total);
  const counts = {};
  for (const person of voters) counts[person.next] = (counts[person.next] || 0) + 1;
  const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || (a < b ? -1 : a > b ? 1 : 0));
  return {
    chosen: ranked[0] ?? null,
    counts,
    voterIds: voters.map(person => person.id),
    eligible,
    total,
    tie: ranked.length > 1 && counts[ranked[0]] === counts[ranked[1]],
  };
}
