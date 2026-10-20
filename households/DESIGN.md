# Households - original design decisions

Status 19 October: the playable HH1 prototype is now implemented. This document
records the design-stage constraints; [MODEL.md](MODEL.md) and
[the playtest report](../narrative/household_hard_playtest.md) describe what is actually running.

## Scope

The source brief is `.prompt/v5_household.md`. This study explores Household Hard mode without changing the existing Rover game. It does not yet add a Hard selector, generate event sheets, or establish survival rates. The separate `households/` directory keeps experimentation isolated.

## Cards

| Category | Primary visual | States |
| --- | --- | --- |
| Harvest | Lush, wilting, bare tree | Good, Weak, Failed |
| Cash | Full jar, low jar, jar with outgoing transfer | Enough, Low, Loan |
| Attendance | Child inside doorway, child beside doorway, empty doorway | Regular, Irregular, Dropout |
| Weather | Existing Rover sun, new rain cloud, existing Rover spiral | Sun, Rain, Storm |

The selected icons follow the user references: tree silhouettes and cash jars. Attendance retains the approved doorway drawings and weather is unchanged. The empty doorway is now labelled DROPOUT. Retired alternatives are no longer offered on the review page.

The calendar study uses six fortnight positions instead of adding a new dashboard. Later, this can occupy the shared map area above four familiar card panels. Retain the monochrome drawing language, muted palette and dot-matrix treatment of the existing map when developing that screen. This study is not a final map mockup.

Use color names, no context codes or Braille marks. Color is a lookup key for context, not a household identity, wealth tier, or universal safe/danger label. The study's fixed colors per category are layout samples only. Production colors must be assigned by the model.

## Can the paper work reliably?

Yes, if we design the model around a finite set of printable lookup states and verify the paper against the game. It is not reliable to generate arbitrary histories and assume 24 rows per person will explain every board.

The current Rover PW6 audience combines multiple revealed clues. Its cumulative browser model is not reproduced by the earlier single-icon PW5 printed sheets. Households must resolve this explicitly rather than inherit that mismatch.

There are already 4 categories x 3 values x 6 colors = 72 possible single-card keys. Joint observations, history, previous interventions and remaining resources add more states. Six colors cannot losslessly represent all of that.

Proposed implementation order:

1. Generate synthetic six-fortnight histories. Keep genuine counterexamples and recoveries. Landholding can affect probabilities, but must not determine a child's outcome or color.
2. Define which history is known at each decision, including previous observations and intervention. Define a small, auditable context encoding from this history and observations available to the model. Never derive a context color from the hidden future outcome or choose it simply to make a vote correct.
3. Derive a bounded catalog of reachable icon + color keys. Each key retrieves historical examples with similar context. If two materially different decision situations collide in one key, change the encoding or the paper layout. Do not silently promise extra precision the paper cannot express.
4. For cumulative evidence, the displayed lookup color may need to change after another card is revealed. That color must be a deterministic summary of the additional evidence and history. The audience then looks up one current colored card. Prototype this before printing; if six colors cannot distinguish enough states, simplify the scenario rather than hide a larger model behind the same key.
5. For each key, derive historical action samples: SKIP, INTERVENE, or inspect a named category. Inspection should reflect the expected value of an additional observation under the permitted information budget, not access to the live board's answer. Keep the history reference and the rule behind each sample.
6. Deal samples across each team's sheets with balanced coverage. A person need not hold all 72 keys. Every reachable key needs adequate representation in every team, including the small 15-person rehearsal. Either shrink the reachable catalog or increase rows if coverage fails.
7. Treat the dealt sheets as the authoritative poll population. The browser counts those exact answers, rather than separately sampling an approximate distribution. Record model version, seed, team and pack size. A 200-sheet pack uses the same procedure with more samples; its percentages need not be identical to the 15-sheet pack.

Resource availability also affects useful advice. A paper saying CASH must not become an impossible instruction without a defined rule. Decide how exhausted checks and interventions change the lookup state or voting rule before printing. Silently dropping those answers and renormalizing would make the screen cease to represent the paper votes.

## Hard should continue the lesson, not merely change the icons

Medium teaches that another useful observation can improve a decision, while spending a scarce check. Hard adds a time dimension: what looks tolerable now can compound across fortnights, and intervention has an opportunity cost.

The user has superseded the brief's sustained-absence rule. DROPOUT is the single adverse outcome for the current turn. There is no absence streak or consecutive-turn counter. Proposed resolution: SKIP on a dropout turn eliminates the team; INTERVENE protects it for that turn. Other turns proceed, and unnecessary intervention costs a resource rather than causing elimination. These are game rules for a 5-10 minute exercise, not a claim that one absence is real-world dropout. Migration, debt, failed harvest and storm remain clues, not automatic loss conditions.

False intervention spends a resource. Unlike Rover's false Avoid, it should not eliminate the team. This difference needs a short stage explanation, not an additional block of interface text.

Budget proposal for a later prototype: retain three person icons for extra checks, and put the remaining intervention allowance directly on the existing INTERVENE button. Two interventions is a starting experiment, not a tuned recommendation. Do not combine checking and support into one ambiguous resource unless the story gives that shared unit a clear meaning.

## Validation before event printouts

- Enumerate reachable lookup states and verify team coverage at both 15 and 200 sheets.
- Extract answers from generated print data and compare every poll with the browser, including after additional observations and resource exhaustion.
- Test that histories and context codes never expose hidden future truth.
- Include identical visible symbols with different context, and identical keys with different outcomes. Probabilities must retain uncertainty.
- Compare always-skip, always-intervene, decision-only and information-seeking policies across many held-out seeds. Additional useful data should improve decisions on average, not guarantee a win.
- Check whether information-seeking earns its cost. It should sometimes be rational to act without spending a check.
- Play complete four-team sessions. Measure eliminations, recoveries, wasted interventions and close decisions. Tune for a credible mix of endings, without secretly selecting deaths to force one winner.

All histories in this proposal are synthetic teaching data. They are not evidence that a particular community behaves this way. No distribution or fun claim has been validated at this icon-study stage.
