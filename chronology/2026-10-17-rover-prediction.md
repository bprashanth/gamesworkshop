# Rover prediction prototype - 17 October 2026

User requested the same Go/Avoid interaction in both competitive modes. Easy shows
the next column's four cards with dotted boundaries ahead of the rover. Medium
shows the current column's four cards with dotted boundaries around the rover.
Both decisions resolve the next column. All cards are face up; timers and reveal
choices are removed. Four correct decisions finish. Wrong Go or false Avoid ends
the team with the existing dissolution effect. Movement locks input for 650ms.

The collaborative game remains unchanged. Competitive defaults to Easy and dark.
The existing Tailscale review server serves the rebuilt isolated Rover site at
http://100.82.28.38:8684/paperweights/web/ . The sentence benchmark remains paused.

## Paper and shared model

New PW3 sheets replace category answers with historical next-column GO/AVOID
outcomes. Each person matches all four current icon/color keys and votes their
majority; two against two means abstain. This is a prototype aggregation rule,
not an exact joint probability calculation. Every person has all 24 lookup keys.
The Easy hazard strip remains at the bottom. Word fronts and duplex team pairing
are retained. Old PW2 category packs are preserved but excluded from the selector.

Routes and physical rules remain those of seed 15. Answers are stratified samples
from matching contexts in the shared historical archive, not labels copied from
the live map. Individual examples are traceable to historical transitions.

Current packs:

- 15 people: PW3-15-15-bbec296c07
- 100 people: PW3-15-100-2af3cd3bc5
- 200 people: PW3-15-200-eb96e1ff19

## Validation and limits

Nine model tests passed. Browser tests for 15 and 200 people checked source versus
target cards, dotted-band geometry, four-step success, wrong-action elimination,
movement input locking, final states, light/dark and desktop/mobile layouts. No
browser errors. Easy and Medium screenshots are in paperweights/out/prediction-*.

Independent extraction of all three generated PDF packs verified every printed
answer, team pairing and game tally. Duplex packs have 30, 200 and 400 pages.

Actual 15-person paper play with group ties resolved as Go eliminated A/B/D on
turn 1 and C on turn 2. The same policy with 200 sheets finished B, eliminated A/D
on turn 1 and C on turn 2. Correct visible-card play in Easy finishes all four.
Do not describe the current prototype as guaranteeing one or two winners.

Across 200 model seeds, roughly 35% of individual four-lookup votes abstain; small
groups have substantially more group ties. Combining correlated marginal examples
is a voting heuristic, not a calibrated joint posterior. This needs live rehearsal
before event use. See paperweights/competition/PREDICTION.md for measurements and
paperweights/tools/play-prediction.mjs for the browser test.
