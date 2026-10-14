# Paper Weights → Rover Run: teach the reading before the reasoning

14 October 2026. Printable prototype; the frozen Rover Run game is unchanged.
Print packs and generator: [paperweights/README.md](../paperweights/README.md). Design record:
[chronology](../chronology/2026-10-14-paperweights.md).

This is an opening module and audience-participation bridge for the broader
[workshop sequence](EVENT.md), not a replacement for its environmental investigation
or lunar transfer work. The Mars/Moon source-data and film projects are untouched.

## Current implementation: Paper Weights competitive stage

The project and directory are now **Paper Weights**, `paperweights/`. The competitive
game is implemented in `paperweights/web/`, with dark default, light mode, four panels,
one inspection per checkpoint, Go/Avoid, sudden death, finish and reset. A data-driven
selector connects it to the collaborative game. Original collaborative game logic,
styles, map rendering, effects and glyphs remain unchanged; the original page only
includes separate selector files. A Netlify build step assembles the competitive page
under the existing publish folder. This work has not been deployed.

The current game is four surveyed checkpoints, not a claim of four consecutive squares.
Each has a known context/cue from its source window and a hidden next target. Other
source readings remain unshown; context summarizes past dust and source terrain, never
the target. Both printed observations and live maps use one joint generative model.
Every sheet carries all 24 possible cues, so everyone in a team can contribute on every
turn. Historical category suggestions favor failures with exploratory counterexamples;
vote shares are inspection suggestions rather than hazard probabilities.

The production command creates words, Rover backs, paired duplex PDFs, assignments,
manifest and matching browser pack together. Packs exist for 15, 100 and 200 people.
Both sides have 24 rows, three instructions and a small pack/team/person identifier.
Print on A4, actual size, color, duplex long-edge. Select the exact same pack in the game.
The word side uses the same muted six-color palette as the Rover side. Stage context
colors have brighter dark-mode variants, with stable C01–C06/dot marks across media.

The model retains the qualitative Rover rules: storm follows haze and cannot occur on
flat terrain; sand follows soft ground and cannot occur on steep terrain; dead battery
follows a source storm or sand. A first extension that violated those relationships was
rejected before production. Source and target draws are independent of paper count;
category counts use stratified quotas, preventing missing/irrelevant lookup samples.

Rehearsal seed 374 is explicitly selected, not secretly filtered at runtime. The declared
paper policy (largest count, fixed category-order tie break, avoid a revealed hazard)
finishes two teams with all three pack sizes; A exits on turn 3, C on turn 4, B/D finish
on turn 4. Arbitrary decisions/seeds can differ. Across 500 unfiltered seeds the policy
averages 0.98–1.19 finishers, versus 0.23 for clue-independent inspection. One or two
finishers occurs in 62–67% of runs. Detailed distributions and limitations live in
[the model guide](../paperweights/competition/README.md).

Browser tests played 15- and 200-person packs using the actual printed tallies and only
revealed readings. Checks also cover false avoidance, missed hazards, reset, both themes,
layout at 1440/1000/mobile widths, original-stage navigation and the assembled build.
Independent PDF extraction verifies each printed category row and duplex pairing against
the game's counts. The separate live voting app is not integrated: visible PAPER bars
are the exact tally implied by the selected pack.

## Latest visual review: a consistent stage-two instrument panel

[Three paired themes](../paperweights/rover/themes/README.md) now explore mineral accents,
terminal pixel accents and monochrome dot patterns. Each has a white paper sheet and
white/black four-map screens. Context color is confined to frames and labels; original
Rover icons remain monochrome and hazard faces invert. C01–C06 and matching dot
patterns provide stable context identifiers across paper and screen. The nine mocks
reuse saved evidence and votes without changing the simulator or deployed game.
Recommended starting point: mineral accents on the white stage; black terminal is the
closest dark-game continuation. Monochrome needs a timing trial because pattern/ID
matching may be slower than color. These are visual proposals, not an implemented
flip flow, and keep the source-review timing described below.

## Current review: context colors and the Swift gesture

Current mocks: [context experiment](../paperweights/rover/context/README.md). All delivered word
and data sheet separators now use ASCII `->`. Paper retains the approved word layout:
a colored left rectangle containing the original Rover icon, then a historical next-
category word. The stage shows four teams with four cards each and matching colors.

Color represents compressed history/terrain context, never a fixed category. RED HAZE
means two prior haze readings and current non-flat slope; GREEN HAZE has the same dust
history on flat terrain. RED and BLUE STORM both occur. People matching the called
icon and color vote the word on their right; the rep chooses the next reveal and
retains the GO/AVOID decision. The key is authored context compression, not learned
attention or an encoding of the entire history.

Timing: the four readings of the completed source square are known, including slope.
The vote selects a category in the next square. Coloring a newly flipped target before
its terrain is known requires a different known-information key or intentional terrain
disclosure; that interaction is not implemented in this static mock.

This is a separate proposed context-sensitive simulator, not the deployed fixed deck.
Historical observations and fresh next states share its kernel. The printing policy
favors dangerous historical measurements while retaining exploratory suggestions, so
votes estimate inspection-suggestion frequencies, not literal hazard probabilities.

Generated two sample sheets, 60 audience sheets (15/team), a four-panel stage mock
with vote counts from those sheets, and a facilitator context key. Every team covers
all 53 reachable lookups at least twice. Original glyph geometry is retained; colored
faces are a proposal. The deployed Rover source is untouched.

## Previous review: color-free alternatives

The minimal Paper Weights word layout is approved and now used for every pack in
[`paperweights/words/`](../paperweights/words/). Regeneration instructions are in
[paperweights/README.md](../paperweights/README.md).

Three **alternative**, color-free data-sheet mocks now sit in
[rover/concepts/](../paperweights/rover/concepts/README.md): literal historical card strips,
guided icon pairs, and a two-clue lookup using prior warning plus revealed next slope.
Each has two different audience sheets and a proposed 10-second response window.
The user has not yet selected a data-sheet format. The earlier colored-sheet and
paddle flow below is historical prototype material, not the current chosen design.
The live black Rover UI and the existing vote app remain unchanged.

The crowd votes on **which category to inspect**, while the rep decides GO/AVOID.
Raw history plus human judgment and guided evidence-routing are both plausible games,
but neither inspection-vote share automatically equals a hazard probability. The
concept guide separates those interpretations and documents why useful distractors
may improve play without being "wrong data."

## 1. A room that generates language — 5–7 minutes

Give everyone a different Paper Weights sheet. Project or hold up one example.
Say “the, RED.” Model the complete gesture: scan the RED-filled boxes, find `the`,
follow the arrow, say the right word **and its color**. Call that pair next. Keep
the running text visible so people experience a sentence forming from their examples.

If more than one entry matches on a sheet, choose among them randomly. Choose a raised
hand without repeatedly favoring the front rows. The room has enough examples that
there is always another possible responder; individual people need not match every call.
Use the whole pack. A random subset does not carry the same guarantee.

After a short sequence, restart from the same cue. It may continue differently.
Ask “Why did the same word produce a different next word?” Then ask for two actual
examples from the sheets. Avoid promising diversity after every word: `old` always
leads to `man` in this supplied corpus, while `the` and `I` have multiple continuations.

The lesson is local conditional probability and sampling. The sheets are a deliberately
small bigram model, not a faithful implementation of a modern LLM. Plausible local
continuations do not ensure that the whole story is coherent or true.

For an exact numerical demonstration, sample **occurrences**, not unweighted hands.
Ask matching people how many entries they hold, choose a person weighted by that
count, then choose one entry uniformly. Otherwise explain that the simple random-hand
version has a slightly different distribution. Both are recorded in the Paper Weights manifest.

## 2. Keep the gesture, change the thing being predicted — 3 minutes

Swap to the Rover sheet. Keep the white paper, type, arrow and left/right grammar.
Place the original game beside it. Show that the rain-over-sun glyph is the same HAZE
card, the spiral is the same STORM, and the sinking figure is the same SAND.

“Before, the right-hand word told us what to say next. Now, your right-hand example
comes from the next square in an earlier journey. Its label tells us which category
to inspect next.”

The outer color band routes attention. The inner monochrome card carries the original
measurement; a white card face retains its danger meaning. Have everyone find the
same HAZE source once. They should discover different right cards without needing
a new explanation of left versus right.

Numbers reinforce colors: 1 battery BLUE, 2 slope AMBER, 3 dust PURPLE, 4 ground GREEN.
Teams use letters A–D so team identity never competes with the category colors.

## 3. Four representatives and four audience groups — 8–12 minutes

The 15-person pilot is 4/4/4/3. Use it to test legibility, lookup speed, paddle counting,
and the stage representative's interpretation. Do not use its coarse vote shares
or unequal groups to rank team ability. A 200-person pack gives 50 people per team.

Give each representative one route and a group of observers. The stage mockup shows
four separately masked next squares; the facilitator pack contains their private
answers. All four routes use one authored probability model, with different random
realizations. Their difficulty is not guaranteed equal.

1. Reveal and call one card from the **current/source** square.
2. Every group member finds that left card and raises the right category's paddle.
3. Count category votes within the group. Show counts and denominator as well as color.
4. The representative chooses a category in the **next** square to flip. The highest
   count is the default suggestion; an override or tie-break is the rep's decision.
5. A second reveal uses the same cue. Already-open-category voters abstain; if nobody
   is eligible, the rep chooses. Use the eligible-voter denominator for this second
   vote. Re-cueing on the newly flipped card would point one square too far ahead.
6. Decide GO, AVOID or RECHARGE. After movement, reveal the crossed square and make it
   the new source. Keep the source and target square numbers visible.

The audience is suggesting **what to inspect**, not directly commanding a move.
A full battery vote is not a vote that the route is safe. Right-hand cards describe
past observations; they are not leaked answers to this team's map. Reusing the same
sheet on a repeated cue is revisiting the same evidence, not collecting new cases.

## 4. The revealing mistake — 2–3 minutes

Use [the worked example](../paperweights/rover/output/worked-example.pdf):

- Current square: haze, firm ground.
- Next square: STORM, with a full battery.
- Following square: dead battery.

Two audience members can honestly hold HAZE → STORM and HAZE → FULL. Seeing a full
battery tells you nothing decisive about the weather ahead. Seeing STORM justifies
avoiding that square. Battery depletion appears one square after the hazard, and in
the frozen Rover rules follows sand as well as storm.

In the extension's sudden-death mode, going into a hazard **or avoiding safe ground**
ends the run. A dead current battery also ends the run if the rep moves without
recharging. Recharge changes the live resource, not the historical printed card.
Keep the two-reveal limit through a recharge; otherwise recharge becomes a way to
buy unlimited peeks. Use the frozen 22-action budget if scoring the rehearsal.

## 5. Ask what the vote really measured — 3–5 minutes

“How many hands told us to inspect dust? How many of those examples showed a storm?
Are those the same question?”

No. The pack explicitly allocates more evidence to categories with greater historical
danger after a cue. It then samples example values independently of that allocation.
This is an authored attention policy, not an optimal strategy. The actual sheet counts,
conditional value frequencies and model probabilities are separate quantities in the
manifest. Small groups cannot display arbitrary 20%/30% splits accurately.

Ask what would make haze more informative. Inspect the next slope: the simulator
allows a storm after haze on non-flat ground, never flat. Then check false alarms,
not just memorable deaths. In sudden death, both a missed hazard and an unnecessary
avoid matter. A majority can be useful without being certain or sufficient.

The model's 75% storm probability under its full warning condition is an authored
parameter. Contours are real Jezero geometry, but these new route readings and slopes
are simulated. Say this plainly; the handouts are not a new Mars failure dataset.

End by separating three operations: generating a continuation, choosing where to
look, and choosing how to act. The first activity teaches the lookup; Rover adds the
cost of acting on incomplete evidence. Continue into the existing indicator exercise
and transfer sequence when the room is ready.

## Rehearsal observations to record

- Can someone identify the correct left box and right category without help?
- Do they confuse category color with the white hazard-card face?
- Can a representative count a group quickly, including ties and abstentions?
- Does anyone mistake a historical right card for the live map's hidden card?
- Do source/next-square labels prevent the second-reveal timing error?
- Does the room distinguish vote share from hazard probability in its own words?

These are questions for a human playtest. Automated generation and rendering checks
do not establish that an audience can read or reason with the sheets successfully.
