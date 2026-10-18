# PW3: current-square clues, next-square decision

This is a new prototype. PW2 remains in `generate.py` and its existing packs; its category suggestions are not reused as GO/AVOID predictions. `prediction.py` imports the unchanged physical transition algorithm, archive, color lookup and four-row routes. Default route seed **15** is preserved, not selected again to manufacture winners.

- **Easy** displays all four cards of the NEXT target square. GO/AVOID judges that same square. The visible evidence is sufficient: avoid if any card is fatal, otherwise go. Paper is unnecessary in Easy.
- **Medium** displays all four cards of the CURRENT source square. GO/AVOID judges the hidden NEXT target square. Source kills are historical information, not a verdict about whether the current decision fails.
- GO on a fatal target eliminates. AVOID on a safe target also eliminates. Four correct decisions finish. There is no single-card inspection or automatic avoidance in this prototype.

## Reading four rows

Each person matches all four current icon/color pairs on their sheet. Three or four GO results mean vote GO; three or four AVOID results mean vote AVOID; a 2–2 split means abstain. Every sheet contains all 24 possible keys, so every person has all four matches. This does not guarantee everyone has a directional vote: abstentions can be substantial, especially in the 3–4-person rehearsal groups.

The representative makes the final choice. If the room ties, there is no automatic correct tiebreaker. Simulation reports both GO-on-tie and AVOID-on-tie reference policies. The interface must continue to offer both actions.

## What the paper actually samples

For each icon/color key, all matching source observations in the fixed 60,000-transition archive are counted. Their target is labelled GO if it had no fatal card, AVOID otherwise. No historical-inspection selection or danger oversampling is applied. In particular, the PW2 80%-focused inspection policy is **not** used here.

GO/AVOID frequencies are apportioned separately per team by largest remainder, with less than one-voter rounding error per outcome. Assignments are shuffled among participants; each row retains an actual matching archive observation with that outcome. This is a stratified approximation of the unweighted archive frequency, not an independent sample and not a guarantee about a particular live square.

Four single-cue observations are correlated. Each printed row can come from a different historical traverse, and the four rows on one person's sheet are not claimed to be one coherent historical map. **Majority-of-four is a classroom heuristic, not a calibrated joint probability or a Bayesian posterior.** The screen's counts are people voting, not a percentage chance of death. The full visible source may contain useful interactions that this heuristic misses. In particular, an observed source storm or sand implies a dead battery in the next square under the unchanged physical rules, even if other marginal paper matches suggest GO.

Color meanings remain PW2's history-only attention keys. A source card uses `card_cue(history[0], source, category)`; a target card uses the existing target cue. Colors do not consult future terrain. Different cards in the same visible row can have different colors.

## Files and schema

`make_pack(sheet_count=15, seed=15)` produces `version: 3`, `format: "next-square-go-avoid"` and a `PW3-...` ID. Sheet entries have `nextAction: "go" | "avoid"`, replacing `nextCategory`. Each round adds `sourceCues`, retains `targetCues`, and includes `paperVotes: {go, avoid, abstain}` computed from the actual assigned sheets. Per-cue `votesByCue` contains binary counts. `observations` retains the source/history/target, archive ID, outcome and fatal flag for every printed pair.

The same physical route is used for 15, 100 and 200 people. Printed proportions and individual four-row combinations change with group size and dealing. Exact planned totals belong to the assigned whole group; arbitrary regrouping can change the vote.

```sh
python3 paperweights/competition/prediction.py --sheets 15
python3 paperweights/competition/prediction.py --sheets 100
python3 paperweights/competition/prediction.py --sheets 200
python3 -m unittest discover -s paperweights/competition -p 'test_prediction.py'
python3 paperweights/competition/prediction_trials.py
```

These write `prediction-pack-15.json`, `prediction-pack-100.json`, `prediction-pack-200.json`, and `prediction-trials.json`. They do not overwrite PW2 files. The print generator must import `prediction.make_pack` for the new binary sheets, and the active game and paper must have matching PW3 IDs.

## Rehearsal findings

On unchanged seed 15, the reference paper policy finishes zero teams at 15 sheets if room ties resolve GO, or one if ties resolve AVOID. At 100 and 200 sheets it finishes one team with either tiebreaker. Easy's correct visible-card policy finishes all four teams. These are reference-policy outcomes, not forced game results.

A notable 15-person case is team D's third decision: all three people get a 2–2 split and abstain. Team C's first decision has one GO and three abstentions. This is a genuine limitation of combining four marginal observations with a tiny group; it must not be described as a decisive room probability. The unfiltered simulation reports abstentions and room ties as well as finishers, so the prototype can be evaluated before adoption.

Across 200 unfiltered seeds (0–199), using GO to break room ties:

| Sheets | Mean finishers | All-round decision accuracy | Individual abstentions | Room ties |
| --- | ---: | ---: | ---: | ---: |
| 15 | 1.365 | 76.44% | 34.65% | 21.66% |
| 100 | 1.495 | 76.00% | 34.72% | 3.53% |
| 200 | 1.495 | 75.97% | 34.92% | 1.63% |

AVOID-on-tie gives 1.25 / 1.35 / 1.42 mean finishers. Always GO gives 0.395, always AVOID 0.82, independent coin decisions 0.19, and fully informed Easy 4.0. Accuracy and abstention statistics include all 16 potential decisions per map set, including rounds after a reference player would already have been eliminated; survivor statistics follow actual sudden-death stopping. These are descriptive simulations of specified policies, not guarantees or calibrated confidence intervals. Approximately two thirds of people cast directional votes under this rule; everyone still performs four lookups.
