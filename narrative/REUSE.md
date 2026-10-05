# Reusing Rover Run with your own data

Rover Run is a small framework for one kind of lesson: **people discover the indicators of a
bad outcome by making decisions on partial data, then build a simple model from them.** The Mars
route is one skin. This guide is for a team, or an agent, who wants the same game on their own
dataset: a river, a clinic, a farm season, a supply route.

The game lives in `space/rover-run/src/`. The facilitator exercise it supports is
[INDICATORS.md](INDICATORS.md), so read that first: it is the lesson you are re-skinning.

## 1. Check that your data fits

The framework needs four things:

| Need | Rover Run | Your data, for example |
| --- | --- | --- |
| **A sequence** of 8–16 steps someone moves through | 14 squares along the Perseverance route | stretches of a river; weeks of a season; stages of a patient visit |
| **3–4 variables per step**, each bucketed into low / mid / high | slope, ground, dust, battery | rainfall, turbidity, upstream discharge; soil moisture, pest count |
| **Outcomes that end the journey** (death conditions) | SAND, STORM, a dead battery | a contamination event; crop loss; a missed referral |
| **Leading indicators**: a value one step earlier that warns of the outcome | soft before SAND, haze before STORM | high turbidity the week before a contamination; a warm, wet week before a pest outbreak |

The richest version also has:
- **a dismisser:** context that rules a warning out (steep ground never sands);
- **a conjunction:** two weak signals that only matter together (haze *and* slope storms 3 of 4,
  against 3 of 6 for haze alone).

If your data has no leading indicator, the game has nothing to teach. Choose a different outcome.

## 2. Write the lesson table before touching code

Fill this in on one page. It becomes your deck and your facilitator notes.

| | Your answer |
| --- | --- |
| The journey and its N steps | |
| Variable 1–4, each with low / mid / high | |
| Death conditions (which variable at which level) | |
| The leading indicator for each death (one step earlier) | |
| A context that dismisses a warning | |
| A pair of signals that matters only together | |
| What is **real** data and what is **authored** | |

**Honesty rule.** Bucket real values where you have them (Rover Run's slope comes from a real
elevation model), author the rest openly, and say which is which on the screen and in the notes.
Rover Run says "real terrain + route · simulated hazards".

## 3. Build the deck (`web/deck.json`)

One fixed deck, the same for every table, so a room can replicate it on paper:

```json
{
  "name": "Jezero · 14 strips",
  "rules": { "spareTurns": 8, "avoidTurns": 1, "finishBonus": 3, "lives": 3 },
  "notes": "what is real, what is authored",
  "sols": [[
    { "slope": "flat", "ground": "firm", "dust": "haze", "battery": "full" },
    { "slope": "flat", "ground": "soft", "dust": "clear", "battery": "full" }
  ]]
}
```

Each object is one step (one card column); each key is a variable (one card row). Design rules
that make patterns learnable, all checked by the simulator:

- **Every outcome recurs at least 3 times.** One case is an anecdote.
- **Every outcome is preceded by its indicator**, and some indicators are **false alarms**, so a
  warning is necessary but not sufficient.
- **The dismisser has 2 or more cases** (soft before steep, three times, never sand).
- **The conjunction is likely but not certain** (3 of 4), so the model carries honest uncertainty.
- **The state variable is a card.** If the rule needs memory (Rover Run's battery), make it a card
  on the deck, e.g. dead on the step *after* each hazard (where you arrive drained), so the physical
  version needs no computer and the card never gives away the hazard ahead.

## 4. The backdrop (`web/map.json`)

The map gives place to the data. `tools/prep.py` builds it from any elevation raster plus a path:

```sh
python3 -m venv .venv && .venv/bin/pip install numpy scipy rasterio contourpy pillow
.venv/bin/python tools/prep.py --strips 14 --rotate --out web --rows web/rows.json
```

It writes:
- contour polylines `{e: 0..1 elevation, p: [x, y, ...] normalised}`;
- the path (`route`), cut into steps (`rowStart`);
- the strip boundaries (`strips`), so card column *i* sits under strip *i*;
- per-step readings (`rows.json`).

Point `RAW` and `TAU` at your files. `--strips N` splits the path by progress across the map, and
`--rotate` turns the map so the path reads left to right (rotate, never mirror).

No elevation data? Any `map.json` with the same keys works. A river can be the path over a flat
background, and a clinic visit can be a straight line.

## 5. Rename the variables and outcomes

Today the names are written into the code (about 35 references). These are the places to change:

| File | What to change |
| --- | --- |
| `web/engine.js` | `batteryCard` and the two death checks (`row.ground === 'sand'`, `row.dust === 'storm'`) |
| `web/analysis.js` | the risk rules (`sandRisk`, `stormRisk`), the strategies, and the pattern checks |
| `web/game.js` | `SUITS` (names + low/mid/high values), `deadly`, `warning`, `word`, `AHEAD` (variables shown ahead in Medium), and `fatalCard` |
| `web/symbols.js` | one line-drawn SVG per value (keep them pictures anyone can read: a figure sinking, rain, a dust devil) |
| `web/index.html` | the title (`MAP: …`) and the graph legend |
| `narrative/` | your copy of INDICATORS.md, with your counts and step numbers |

A good first improvement for a second dataset is to move these names into `deck.json` (variables,
levels, which level is deadly, which is a warning), so a new skin needs no code edits.

## 6. Tune with the simulator, not by feel

`node tools/sim.mjs` plays every strategy against the deck and checks the targets. A strategy is
a way of reading the cards: always go, avoid any warning, ignore the dismisser, the intended model,
look at a given pair ahead. Recharge timing is searched optimally, and strategies are scored with
one life. Keep sweeping `spareTurns` and `avoidTurns` until every check passes:

- the intended model is the unique best play and finishes;
- avoiding every warning, or ignoring the dismisser, scores clearly less: false alarms cost (in
  Rover Run a detour scores nothing, a cost that needs no state and works on a table);
- ignoring an indicator dies: misses kill;
- random play scores below 40% of the best;
- each designed pattern (recurrence, dismisser, conjunction) actually holds in the deck.

Rover Run's sweeps and their results are in `chronology/2026-10-04-rover-run.md`.

## 7. Playtest blind, then with people

- **Agent playtest:** `tools/agent-play.mjs` drives the real page turn by turn and writes a
  screenshot. Give an agent no access to the code or deck, ask it to play 5–8 runs, keep one rule
  after each, and write notes. The prompt is `space/rover-run/src/tools/agent-prompt.md`; past
  results are in `space/rover-run/src/benchmarks/`. Read its notes for
  *memorised the map* (a failure; Rover Run's first build had this) versus *stated the rule*
  (success).
- **People:** one round on Medium, one on Hard, then Easy for the exercise. Listen for "X means Y
  next unless Z" before the reveal.

## 8. The physical version

Everything is a card or a token, so a table can play without a screen:
- a printed strip map;
- one deck per variable, numbered 1–N, never shuffled;
- a turn track, 3 life tokens, and a facilitator who flips the cards after each move.

The online modes map onto the table like this:
- **Easy** = all cards face up;
- **Medium** = every card face up except the state card;
- **Hard** = the team turns over 2 cards of the next step.

## 9. Checklist for an agent doing this end to end

1. Fill the lesson table (§2) from the dataset; flag what is real and what is authored.
2. Write `deck.json` (§3) and `map.json` (§4).
3. Rename the variables (§5).
4. Run `node tools/sim.mjs`; edit the deck and rules until every check passes (§6).
5. Serve with `python3 serve.py`; screenshot Easy, Medium and Hard at 1440×900 with
   `tools/shot.mjs`; fix any overflow.
6. Run one blind agent playtest (§7) and record what it learned.
7. Write your INDICATORS.md with real counts and step numbers, and a chronology entry with every
   decision.
