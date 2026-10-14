# Paper Weights × Rover Run

> **Current review:** [context/](context/README.md) pairs Swift-shaped icon sheets
> with four-card stage panels. Color encodes history and lateral context and matches
> between screen and paper. The [color-free alternatives](concepts/README.md) and
> the category-colored prototype below remain earlier experiments. Deployment is unchanged.

A **printable prototype**, using the exact frozen Rover glyphs and card faces.
Audience members hold different observations; four representatives choose what to
inspect on four independent synthetic card routes.

## Files and shared appearance

`generate.py` writes audience handouts, an A3 landscape four-team stage mockup,
four A4 facilitator maps, a worked example, and A4 paddle templates. Its output JSON
includes every printed observation, historical case ID, expected conditional value
probabilities, and the actual category votes for each team and cue. Facilitator map
JSON is separate and contains future outcomes; keep it off the audience display.

`symbols.json` exports `space/rover-run/src/web/symbols.js` without redesigning the
paths. To refresh intentionally: `node paperweights/rover/export-assets.mjs`. Print presentation
attributes are explicit because the PDF renderer does not reliably inherit SVG CSS
from the outer HTML. Clip IDs are namespaced per instance. Glyph geometry is unchanged.

The shared language is monospaced headings, rectangular cards, left-to-right arrows,
solid left routing labels, and right category labels. Ordinary Rover faces stay black
with light strokes; SAND, STORM and dead battery stay white with black strokes.
Page backgrounds are white. Color rails sit **outside** the original card faces:

| Paddle | Category | Routing color |
| --- | --- | --- |
| 1 | Battery | BLUE |
| 2 | Slope | AMBER |
| 3 | Dust | PURPLE |
| 4 | Ground | GREEN |

Team identity is A/B/C/D, independent of category colors. Paper Weights has six token colors;
Rover uses four of those same colors. A color always identifies a lookup/routing
label, not risk. White on the Rover **card face** retains its original hazard meaning.

Word sheets have 24 pairs. Rover sheets have **11 unique left cues** (all values of
all four card categories), plus a reminder in the twelfth grid slot. Larger glyphs
make the cards recognizable, and one matching entry means exactly one vote per person.
The format changes density while preserving the reading operation.

## Turn contract

1. Start at square 0, already crossed. Reveal one source card, initially DUST / HAZE.
   The facilitator holds the full state and makes any current battery requirement
   available to the rep. This start is sampled historical context, not a free move
   through its potentially hazardous terrain.
2. Call the source category and value. Each person finds the one matching left card.
   Their right card is an observation from a past case's **next square**. They raise
   the right-hand category's numbered/color paddle—not its value and not GO/AVOID.
3. Count within that rep's group. Highest count is the default reveal; the rep can
   override and explain. Ties are the rep's choice. Reveal that category at square 1.
4. Allow at most two category reveals. For reveal two, use the **same source cue**;
   people assigned the already-open category abstain. Count against the number of
   eligible voters, and show abstentions separately. Zero eligible votes: rep chooses.
   Do not use the newly revealed square-1 card as a source for a square-1 vote: the
   printed arrow would then refer to square 2.
5. Rep chooses GO, AVOID or RECHARGE. After crossing, reveal the full square and use
   one of its cards as the next source cue. Reps choose that cue; they can compare
   haze, soft ground or other readings. Historical examples are reused evidence,
   not fresh independent observations on every repeated vote.

A live poll can replace paddles later: use four team-specific sessions (or a required
team field), four numbered category options, a shared source-square/cue identifier,
one response per person, and separate first/second reveal results. Do not mix teams
or treat abstentions as votes for the open category. No QR code is printed because
there is no configured poll destination. Paddles provide a complete offline rehearsal.

## Sudden-death extension

One life. GO into SAND/STORM ends the run. AVOID on a safe square also ends the run.
A correct avoid crosses without a point; a safe go scores one. A dead current battery
must be recharged before moving. Recharging consumes a turn, leaves position unchanged
and sets the current battery full; keep the same already-revealed cards and reveal
budget for that square. Use 22 total actions for 14 squares and the frozen +3 finish
bonus if scoring the rehearsal. `model.sudden_death` checks individual decisions;
a full stateful four-board controller is future integration work.

Battery **cards** are fixed by the prior square: dead immediately after SAND **or**
STORM, otherwise full. A card showing full is not a weather forecast. A recharge
updates the live resource state, not the historical card. The supplied worked example
shows HAZE -> STORM with battery still full, then dead battery one square later.
The frozen game's engine still has three lives and permits avoiding safe ground;
none of these extension rules have been patched into it.

## One probability model, two independent uses

`model.py` defines the exact transition kernel. It is an **authored simulation**:

- Next slope: flat 5/14, slope 6/14, steep 3/14, chosen independently of prior state.
- If prior ground is soft and next slope is not steep, sand probability is 0.65;
  otherwise sand is impossible. Non-sand outcomes split equally firm/soft.
- If prior dust is haze and next slope is not flat, storm probability is 0.75;
  otherwise storm is impossible. Non-storm outcomes split equally clear/haze.
- Ground and dust are conditionally independent given the prior row and next slope.
  Sand and storm can coexist; either makes the square hazardous.
- Next battery is dead iff the prior row has sand or storm.

The slope proportions are a design prior, not a fit to the route or a claim about
Mars. This preserves the frozen game's indicator directions and exclusions, not its
exact 14-square frequencies. With haze and no knowledge of the next slope, the
kernel gives storm probability `(9/14) × .75 = 27/56 ≈ 48.21%`. Haze plus a known
non-flat next slope gives 75%; haze plus flat gives zero. These are model probabilities,
not guarantees about a particular short route.

Generate 30,000 historical adjacent-row observations after 500 burn-in steps using
seed 80421. For each cue, retain historical cases matching that one current reading.
Each person receives an independent sampled case from that bucket and one next-row
category. There is no future-map lookup. Map seeds are separate: each group's square 0
is sampled from the archive's haze-current states, then 14 future rows are freshly
drawn from the same kernel. No cherry-picking for easy wins or particular outcomes.

The four maps therefore have different card sequences on the same Jezero contour
reference. Their slopes are **simulated**, not the real DEM strip measurements. The
contour/traverse geometry comes from frozen `map.json`; reusing that backdrop is a
visual mockup, not evidence that these synthetic hazards happened on Mars. Distinct
random maps can differ in difficulty. For a scored event, first test paired or
balanced routes; do not claim this small pilot equalizes difficulty.

## Vote share is a separate, explicit distribution

For a cue, the archive estimates how often each next category is dangerous (dead,
storm, sand; slope itself is not deadly). Give each category an attention weight:

`weight = 1 + 3 × historical danger rate`, normalized across the four categories.

This is an **authored teaching policy** for where to place evidence, not an optimal
strategy. After haze, more sheets tend to carry dust evidence; after storm, more carry
battery evidence. Allocate seats with largest remainders, then sample the historical
case independently of the allocated category. Each allocation differs from its target
by at most one person. Crucially, we do not cherry-pick a scary right-hand outcome
just because a category was chosen: conditional next-value distributions remain those
of the shared historical world.

There are consequently three different quantities:

1. **Category vote share:** how many people were given evidence in that category.
2. **Printed next-value frequency:** what those historical examples actually showed.
3. **Next-map probability:** the kernel's distribution for a new row given available
   context; a hidden realized map card is a single draw, not a fraction.

The manifest records all three where applicable. The user's illustrative 20% and 30%
are not hard-coded as hazard probabilities. With 4 people a vote is 25%; with 3 it is
33.33%; with 50 it is 2%. Different historical observations can disagree honestly,
and a majority can direct attention to an unhelpful card. The rep still has to reason.
All source cues appear on every sheet, so no lookup dead ends occur.

## Integration boundary

Implement later: four-board stage controller, actual flips and movement, team-scoped
poll sessions, reveal masking, current battery state, timeouts and logged replay.
The static stage mockup shows only the opening cue and hidden next cards; the private
facilitator pack exposes all 14 columns. Keep those separate. The JSON manifests are
ready to serve as fixture inputs. Do not regenerate or modify the frozen game's
cards, theme or original `deck.json` to wire this extension in.
