// Moon Run core: variables, the hidden laws (generator + checks only), the tiny rule language
// (BEFORE / PERSISTS / WITH), and the evaluator. Pure ES module: used by the pages and the tools.

// ---------- what each card measures ----------
// Five environmental rows, each ordered from easy to hard. The outcome is a SEPARATE row:
// a measurement that marks an outcome is never also the clue for it.
export const VARS = [
  { key: 'light', name: 'light', levels: ['sun', 'shade', 'dark'] },
  { key: 'temp', name: 'temperature', levels: ['warm', 'cool', 'cold'] },
  { key: 'ground', name: 'ground', levels: ['firm', 'loose', 'rocky'] },
  { key: 'slope', name: 'slope', levels: ['flat', 'slope', 'steep'] },
  { key: 'battery', name: 'battery', levels: ['full', 'low', 'dead'] },
];
export const OUTCOMES = ['power', 'frozen', 'stuck'];
export const OUTCOME_WORD = { power: 'POWER LOSS', frozen: 'FROZEN', stuck: 'STUCK', safe: 'safe', any: 'any failure' };

// Values a rule may name: single levels, plus a few plain-English groups.
export const VALUE_OPTIONS = {
  light: ['sun', 'shade', 'dark', 'shade or dark'],
  temp: ['warm', 'cool', 'cold', 'cool or cold'],
  ground: ['firm', 'loose', 'rocky', 'loose or rocky'],
  slope: ['flat', 'slope', 'steep', 'slope or steep'],
  battery: ['full', 'low', 'dead', 'low or dead'],
};
export const matches = (obs, key, value) => value.includes(' or ') ? value.split(' or ').includes(obs[key]) : obs[key] === value;

// ---------- the hidden laws (never shown to players) ----------
// Each law reads the observation you have just been at (t) and decides what happens at t+1.
export const LAWS = {
  // PERSISTS: three shaded or dark observations in a row drain the solar rover, unless the ground
  // at the third is firm (on firm ground it drives out to sunlight in time).
  power: (h, t) => t >= 2 && [0, 1, 2].every(k => h[t - k].light !== 'sun') && h[t].ground !== 'firm',
  // WITH: dark AND cold together freeze it; either alone is survivable.
  frozen: (h, t) => h[t].light === 'dark' && h[t].temp === 'cold',
  // WITH: loose ground AND a steep slope together get it stuck; either alone is survivable.
  stuck: (h, t) => h[t].ground === 'loose' && h[t].slope === 'steep',
};
export const lawOutcome = (h, t) => OUTCOMES.find(o => LAWS[o](h, t)) ?? null;   // priority: power, frozen, stuck

// The battery is a recorded reading, not game state: low after two non-sun observations in a row,
// dead at a power loss. It reports what already happened: a late measurement.
export function batteryAt(h, t) {
  if (h[t].outcome === 'power') return 'dead';
  return t >= 1 && h[t].light !== 'sun' && h[t - 1].light !== 'sun' ? 'low' : 'full';
}

// ---------- the rule language ----------
// rule = { type: 'before' | 'persists' | 'with', a: {key, value}, n?: 2..4, b?: {key, value}, then: outcome | 'any' | 'safe' }
export const RULE_TYPES = {
  before: { label: 'BEFORE', question: 'What tends to appear before failure?' },
  persists: { label: 'PERSISTS', question: 'What becomes dangerous when it lasts?' },
  with: { label: 'WITH', question: 'What only matters when another condition is present?' },
};
const varName = k => VARS.find(v => v.key === k).name;
// A condition in plain words: "shade or dark", "cold", "loose ground", "steep slope", "dead battery".
export function phrase({ key, value }) {
  if (key === 'light' || key === 'temp') return value;
  if (key === 'slope') return value === 'flat' ? 'flat ground' : `${value.replace(/^slope\b/, 'gentle')} slope`;
  return `${value} ${key}`;
}
export function describe(r) {
  const a = phrase(r.a), then = r.then === 'safe' ? 'GO (safe)' : OUTCOME_WORD[r.then];
  if (r.type === 'before') return `${a} happens before ${then}`;
  if (r.type === 'persists') return `${a} lasts ${r.n} observations before ${then}`;
  return `${a}${r.n > 1 ? ` (${r.n} in a row)` : ''} WITH ${phrase(r.b)} predicts ${then}`;
}
export const ruleKey = r => JSON.stringify([r.type, r.a.key, r.a.value, r.n ?? 1, r.b?.key ?? '', r.b?.value ?? '', r.then]);

// Does the rule fire at observation t of history h? (uses only observations up to t)
export function fires(r, h, t) {
  const n = r.type === 'persists' ? r.n : (r.n ?? 1);
  if (t - n + 1 < 0) return false;
  for (let k = 0; k < n; k++) if (!matches(h[t - k], r.a.key, r.a.value)) return false;
  if (r.type === 'with' && !matches(h[t], r.b.key, r.b.value)) return false;
  return true;
}

// ---------- the evaluator ----------
// Plain questions: did it catch bad outcomes? how often did it cry wolf? was there time to act?
// A danger rule "catches" a failure at f if it fired at some t in [f-W, f-1]. Firing only AT f is
// "too late". An alert episode (a run of consecutive firings before any failure) that no failure
// follows within W observations is a false alarm.
export const W = 3, GRADUATE = 70, MIN_CASES = 4;
const isFail = (o, target) => o && (target === 'any' ? true : o === target);

export function evaluate(rule, histories) {
  if (rule.then === 'safe') return evaluateSafe(rule, histories);
  let fails = 0, early = 0, late = 0, leads = [], episodes = 0, falseAlarms = 0;
  for (const h of histories) {
    const fireAt = h.map((_, t) => fires(rule, h, t));
    h.forEach((o, f) => {
      if (!isFail(o.outcome, rule.then)) return;
      fails++;
      let first = null;
      for (let t = f - 1; t >= Math.max(0, f - W); t--) { if (fireAt[t]) first = t; else if (first !== null) break; }
      if (first !== null) { early++; leads.push(f - first); } else if (fireAt[f]) late++;
    });
    // alert episodes, on observations that are not themselves failures
    for (let t = 0; t < h.length; t++) {
      if (!fireAt[t] || h[t].outcome || (t > 0 && fireAt[t - 1] && !h[t - 1].outcome)) continue;
      let end = t; while (end + 1 < h.length && fireAt[end + 1] && !h[end + 1].outcome) end++;
      episodes++;
      let hit = false;
      for (let u = t + 1; u <= Math.min(h.length - 1, end + W); u++) if (isFail(h[u].outcome, rule.then)) hit = true;
      if (!hit) falseAlarms++;
    }
  }
  const recall = fails ? early / fails : 0, precision = episodes ? (episodes - falseAlarms) / episodes : 0;
  const f1 = recall + precision ? 2 * recall * precision / (recall + precision) : 0;
  const support = Math.min(1, episodes / MIN_CASES);
  const score = Math.round(100 * f1 * support);
  const lead = leads.length ? leads.sort((a, b) => a - b)[Math.floor(leads.length / 2)] : 0;
  let verdict = score >= GRADUATE ? 'graduates' : 'keep testing';
  const lagging = late > early && (early + late) / Math.max(1, fails) >= 0.6;
  if (lagging) verdict = 'too late';
  if (episodes < MIN_CASES && !lagging) verdict = score >= GRADUATE ? 'graduates' : 'too few cases';
  return { kind: 'danger', score, verdict, failures: fails, caught: early, late, falseAlarms, alerts: episodes, lead, recall, precision };
}

// A safe rule (predicts GO) is judged on lift: when it said GO, how much safer was the next step
// than a step chosen at random? "Sun means safe" is mostly true and mostly obvious, so it scores low.
function evaluateSafe(rule, histories) {
  let said = 0, wrong = 0, steps = 0, bad = 0;
  for (const h of histories) for (let t = 0; t < h.length; t++) {
    if (h[t].outcome) continue;
    steps++; if (h[t + 1]?.outcome) bad++;
    if (!fires(rule, h, t)) continue;
    said++;
    if (h[t + 1]?.outcome) wrong++;
  }
  const precision = said ? (said - wrong) / said : 0, base = steps ? (steps - bad) / steps : 1;
  const support = Math.min(1, said / MIN_CASES);
  const lift = base < 1 ? Math.max(0, (precision - base) / (1 - base)) : 0;
  const score = Math.round(100 * lift * lift * support);
  const verdict = said < MIN_CASES ? 'too few cases' : score >= GRADUATE ? 'graduates' : 'keep testing';
  return { kind: 'safe', score, verdict, said, wrong, precision, base };
}

// Plain-English lines for the result card.
export function explain(e) {
  if (e.kind === 'safe') return [`Said GO ${e.said} times`, `Wrong ${e.wrong} time${e.wrong === 1 ? '' : 's'}`];
  const lines = [`Caught ${e.caught} of ${e.failures} failures`, `${e.falseAlarms} false alarm${e.falseAlarms === 1 ? '' : 's'} in ${e.alerts} alert${e.alerts === 1 ? '' : 's'}`];
  if (e.verdict === 'too late') lines.push('Strong relationship', 'Warning arrives at failure', 'Too late to act');
  else if (e.caught) lines.push(`Usually warned ${e.lead} observation${e.lead === 1 ? '' : 's'} early`);
  if (e.verdict === 'too few cases') lines.push(`Only ${e.alerts} matching case${e.alerts === 1 ? '' : 's'}: too few to trust`);
  return lines;
}

// ---------- a model: a few rules, one decision per step ----------
// At step t (after observing t) decide about t+1: danger rules say NO GO, safe rules say GO,
// nothing firing means GO. If both fire, the model stops and asks a person.
export function decide(rules, h, t) {
  const danger = rules.filter(r => r.then !== 'safe' && fires(r, h, t));
  const safe = rules.filter(r => r.then === 'safe' && fires(r, h, t));
  if (danger.length && safe.length) return { action: 'ask', danger, safe };
  if (danger.length) return { action: 'nogo', danger, safe };
  return { action: 'go', danger, safe };
}

// Per observation, for drawing the evidence: did a (matching) failure happen here, did the rule
// fire here, and was that firing borne out (a failure within W after it; for a safe rule, a safe
// next step)?
export function marks(rule, h) {
  const target = rule.then;
  return h.map((o, t) => {
    const fire = !o.outcome && fires(rule, h, t);
    let good = false;
    if (fire && target === 'safe') good = !!h[t + 1] && !h[t + 1].outcome;
    else if (fire) for (let u = t + 1; u <= Math.min(h.length - 1, t + W); u++) if (isFail(h[u].outcome, target)) good = true;
    const late = target !== 'safe' && isFail(o.outcome, target) && fires(rule, h, t);   // fired only once it had happened
    return { fail: target === 'safe' ? !!o.outcome : isFail(o.outcome, target), any: !!o.outcome, fire, good, late };
  });
}
