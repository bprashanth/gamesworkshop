# Rover Run blind playtest notes

## Run-by-run log

### Run 1 — score 4

- Ended on row 3 by driving into SAND after 2 correct calls.
- I started naively: the map said flat, so I called the first three rows safe and drove.
- Rows 1 and 2 were safe; row 2 was soft, and row 3 was SAND.
- Change afterward: I stopped treating “flat” as “safe” and kept the tentative rule `soft + flat -> SAND`.

### Run 2 — score 12

- Ended on row 7 by driving into STORM after 6 correct calls.
- I sampled both cards on the opening row, which confirmed firm/clear but felt wasteful because openings had not shown danger.
- The soft-plus-flat rule correctly predicted SAND on row 3, so I called danger and avoided it.
- I sampled dust on rows 4 and 5; both were clear. I then trusted accumulated safe-looking firm/clear and firm/haze patterns.
- Row 7 was firm/STORM after haze plus a flat map.
- Change afterward: I tried `haze + flat -> STORM`, but the notebook reported only 1/3 at that point. This was the first clear sign that a plausible rule could be a tendency rather than a guarantee.

### Run 3 — score 12

- Ended on row 7 by driving into STORM after 6 correct calls.
- I stopped sampling the opening row. I sampled both cards on row 2 and dust on row 3 to test whether earlier patterns transferred.
- A long firm/haze stretch was safe across flat and tilted rows. I trusted an exact repeated firm/haze-plus-flat state on row 7 and still hit STORM.
- Change afterward: I rejected haze-plus-flat as a dependable rule; it stood at only 2/5. I restored the clean `soft + flat -> SAND` rule, then at 2/2.

### Run 4 — score 16

- Ended on row 9 by driving into SAND after 8 correct calls. This was my best run.
- I used targeted dust samples whenever haze preceded a flat row. This paid off twice: samples exposed STORM on rows 3 and 8, and I avoided both.
- The soft-plus-flat rule correctly predicted SAND on row 7.
- Row 8 itself was soft/STORM; row 9 was tilted, so I assumed the sand rule was slope-specific. Row 9 was SAND and ended the run.
- Change afterward: I broadened the rule to `soft + any slope -> SAND`. The notebook confirmed it at 4/4.

### Run 5 — score 10

- Ended on row 6 by driving into STORM after 5 correct calls.
- I sampled dust on row 2 because haze-plus-flat remained risky; it was clear.
- The broader soft rule correctly predicted row 3 SAND and reached 5/5.
- Rows 4 and 5 were safe after haze on tilted terrain. I trusted the same-looking transition again on row 6, but it produced STORM.
- Final change: I kept `soft + any slope -> SAND`, still the strongest observed rule at 5/5.

## Rules I believe drive the hidden cards

1. **If a row is soft, the next row has SAND, regardless of slope. Confidence: very high.**
   - Final notebook result: 5/5.
   - It held on flat transitions several times and on a tilted transition once.
   - This is the only rule I would use without sampling.

2. **Haze raises the chance that the next row has STORM, but slope does not make it deterministic. Confidence: medium that haze matters; low about the exact rule.**
   - `haze + flat -> STORM` finished at 4/10.
   - I also saw a haze-plus-tilted transition produce STORM in run 5.
   - Identical-looking haze/slope transitions sometimes produced safe dust and sometimes STORM. Either the cards are intentionally probabilistic or an important condition is hidden/not expressible in the notebook.

3. **Firm is a strong sign that the next ground card will not be SAND. Confidence: medium-high.**
   - I saw many firm transitions across flat and tilted slopes without next-row SAND.
   - Firm did not make the whole row safe because the dust channel could still become STORM.

4. **Clear generally looks sky-safe. Confidence: medium.**
   - Clear predecessors repeatedly led to non-storm dust.
   - I did not collect enough varied slopes to call this a hard rule.

My overall model is that ground and dust are separate channels: previous ground predicts next ground, and previous dust predicts next dust. Soft-to-SAND looks deterministic; haze-to-STORM looks probabilistic.

## Sampling

Sampling was worth the turn when:

- The previous dust was haze. Dust samples caught STORM on run 4 rows 3 and 8; without them, both would have ended the run.
- I had a deep run worth protecting and the notebook showed a meaningful but non-certain hazard rate.
- I needed to distinguish whether a failure belonged to the ground or dust channel.

Sampling was not worth the turn when:

- Sampling both cards on run 2 row 1. Every opening I saw was safe, and there was no predecessor to form a prediction.
- Sampling ground after the soft rule reached high confidence. Calling danger directly was better.
- Rechecking very safe-looking firm/clear transitions early in a run.

There is a nasty economy: sampling costs one turn, while avoiding consumes three turns. Two sampled hazards and their detours can erase the spare-turn budget quickly. That makes sampling correct but potentially self-defeating late in a run.

## How I used the map

I trusted the map as a condition, not as a direct safety forecast. I looked at:

- The displayed slope word for the next row: flat or tilted.
- The route label at the rover’s next position.
- The notebook’s tiny slope marks, especially when comparing safe and hazard outcomes.

Early on I wrongly treated flat as probably safe. Later I combined the next slope with the previous row’s revealed ground and dust cards. The map was most useful for testing whether soft-to-SAND was flat-only; row 9 of run 4 proved it also happened on tilted terrain.

The terrain artwork itself was atmospheric but did not help me predict hazards. I relied on the explicit slope label, not contour density or route shape.

## Feel: confusing, unfair, boring, fun

- **Fun:** Discovering soft-to-SAND, using it successfully, and having the notebook confirm 5/5 felt genuinely satisfying.
- **Fun:** Sampling a suspected dust hazard and revealing STORM just before choosing to detour felt like a good deduction payoff.
- **Confusing:** Exact-looking predecessor/slope states produced different results. Run 3 had repeated firm/haze-plus-flat states where one was safe and another was STORM. I could not tell whether this was randomness, a changing “solution,” or a missing variable.
- **Unfair:** A wrong `go` ends the run immediately, while the storm rule remained noisy. Run 5 punished trusting two immediately preceding safe copies of the same-looking state.
- **Boring:** Rows 4–6 often formed repetitive tilted stretches with nearly identical firm/haze cards. They looked solved until one suddenly was not.
- **Frustrating:** The cumulative notebook mixes many runs and shows ratios, but the screen does not clearly explain whether those ratios represent a probabilistic law or failed guesses at deterministic laws.
- **Good tension:** The turn budget made samples and detours meaningful decisions.

## What the screen failed to tell me

- What `sol 1`, `sol 2`, and so on mean, and whether the hidden rules change between solutions.
- Whether card generation is deterministic from the shown predecessor/slope, probabilistic, or controlled by an additional hidden condition.
- A plain-language explanation of `held x/y`, including whether its evidence is cumulative across runs.
- Whether the two card channels are intended to be inferred independently.
- Why an “avoid ·3” action consumes three turns rather than one; I inferred this from the counter, but the consequence deserves explicit wording.
- How many hazards/detours a full 14-row run is expected to support within 29 turns.
- Whether row 1 is guaranteed safe or merely happened to be safe in all five runs.

The screen contains the needed raw observations, but it does not give enough framing to distinguish “my rule is wrong” from “the rule is probabilistic.” That distinction is essential in a deduction game.
