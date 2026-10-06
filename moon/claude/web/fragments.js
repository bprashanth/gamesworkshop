// Who receives which piece of the archive. Each participant gets ONE short history and TWO of its
// five measurement rows (always with the outcome row): different people hold different histories,
// and different variables from the same history. Deterministic, so the printout and the phones agree.
// Half the room is dealt the pair that matters for their history, half a partial or late slice of
// it, so every team holds the evidence for every law and also the misleading slices.
export const PAIRS = [['light', 'ground'], ['light', 'temp'], ['ground', 'slope'], ['light', 'battery'], ['temp', 'slope'],
  ['light', 'slope'], ['temp', 'ground'], ['ground', 'battery'], ['slope', 'battery'], ['temp', 'battery']];
const LAW_PAIR = { power: ['light', 'ground'], escapeFirm: ['light', 'ground'], recovery: ['light', 'ground'],
  frozen: ['light', 'temp'], coldSun: ['light', 'temp'], darkMild: ['light', 'temp'],
  stuck: ['ground', 'slope'], looseNotSteep: ['ground', 'slope'] };
// the other half: a slice that tells a partial or late story about the same failure
const PARTIAL = { power: ['light', 'battery'], frozen: ['temp', 'ground'], stuck: ['slope', 'battery'] };
export const PER_TEAM = 20;

export function fragment(histories, team, i) {
  const T = typeof team === 'number' ? team : team.charCodeAt(0) - 65;
  const h = histories[(i * 7 + T * 3) % histories.length];
  const pair = i % 2 === 0 ? LAW_PAIR[h.kind] : PARTIAL[h.kind] ?? PAIRS[(i * 3 + T) % PAIRS.length];
  return { id: `${String.fromCharCode(65 + T)}${String(i + 1).padStart(2, '0')}`, history: h, rows: [...pair, 'outcome'] };
}
export const parseId = id => { const m = /^([A-Z])(\d{1,2})$/i.exec(String(id).trim()); return m ? { team: m[1].toUpperCase(), i: Number(m[2]) - 1 } : null; };

// What a team collectively holds: for each law, the people holding its pair on a history where it
// mattered (a failure of that kind, or a look-alike that should NOT fail).
export function coverage(histories, team, n = PER_TEAM) {
  const frags = Array.from({ length: n }, (_, i) => fragment(histories, team, i));
  const has = (f, a, b) => f.rows.includes(a) && f.rows.includes(b);
  const fail = f => f.history.obs.find(o => o.outcome)?.outcome ?? 'safe';
  const c = {
    power: frags.filter(f => fail(f) === 'power' && has(f, 'light', 'ground')).length,
    powerLate: frags.filter(f => fail(f) === 'power' && has(f, 'light', 'battery')).length,
    firmEscape: frags.filter(f => f.history.kind === 'escapeFirm' && has(f, 'light', 'ground')).length,
    frozen: frags.filter(f => fail(f) === 'frozen' && has(f, 'light', 'temp')).length,
    stuck: frags.filter(f => fail(f) === 'stuck' && has(f, 'ground', 'slope')).length,
    lookalikes: frags.filter(f => fail(f) === 'safe' && f.history.kind !== 'escapeFirm' && f.rows.length).length,
    histories: new Set(frags.map(f => f.history.id)).size,
  };
  return { frags, c, ok: c.power >= 2 && c.frozen >= 2 && c.stuck >= 2 && c.firmEscape >= 1 && c.powerLate >= 1 };
}
