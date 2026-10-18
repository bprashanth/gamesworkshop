# Household Hard - one-shot outcomes and decision routes

19 October 2026 - HH2 supersedes the HH1 direct-Attendance prototype.

[Play the current demo](http://100.82.28.38:8684/households/game.html?seed=15)

## What changed

Dropout is now a possible one-shot event, with a strong interaction between loan
and failed harvest. It is not a progression from irregular attendance. The
observable Attendance card gives background attendance, not the outcome itself.
Regular attendance can be followed by dropout. The empty doorway Dropout icon is
shown only when a loss resolves.

This removes the direct-outcome inspection shortcut. Historical records determine
whether Harvest, Cash or another observation would be useful. No category is
excluded from suggestions by fiat. On the tested opening observations, Harvest
and Cash account for 92.9% of inspection votes and Attendance for 2.1%. These are
shares of inspection votes, not of all audience votes.

Calendar mode is removed. The original contour terrain remains, with persistent
team trails that branch after Skip/Intervene. All teams still aim to survive six
monthly turns. Intervening does not advance time faster or create extra turns.

The choices now affect more than the drawing: intervention protects this turn and
puts the next month into a lower-pressure supported context. That can change the
next cards and risk distribution. Identical actions replay identically. The
same monthly random draws are used across counterfactual branches, so intervention
changes conditions rather than secretly rerolling until a safe result appears.

The contour drawing is still the Rover terrain used as a metaphor. Its elevation
is not a calculated household risk surface. Routes display past decisions and
current position, not hidden future danger.

## Tests and playthroughs

The model suite covered 120 seeds / 480 teams. Its simple policies produced:

| Policy | Teams finishing |
| --- | --- |
| Always skip | 15.0% |
| Intervene on first two turns | 33.5% |
| Audience decision votes, no checks | 34.0% |
| Audience advice with up to three checks | 40.0% |
| Inspect Attendance on first three turns | 34.4% |

Decision policies use a 40% threshold among decision votes and the same support
budget. The audience policy takes at most one suggested check per turn. These
are authored policies, not optimal strategies or observed human behavior.
Because actions now affect future contexts, policies can encounter different
later household conditions. The comparison is over complete decision paths.

Across 2,880 all-Skip reference rows, 583 dropout events occurred with regular
attendance. Loan occurred both with dropout and without it. Hidden-outcome
invariance, exact vote totals, deterministic branches and 15/200 population
parity were checked. The audience never reads current hidden outcome truth.

Browser-controlled four-team games on the final model finished 2, 3, 1 and 0 teams
for seeds 15, 16, 17 and 18 respectively. Seed 15 is the current demo, selected
from those reviewed runs for a mixed result. Different choices can change that
result; no number of winners is enforced.

The browser route test explicitly chose Skip for A and Intervene for B. Both
reached month 2 with different route positions. Resetting B restored only B's
original path; replaying its choice reproduced the branch. The other teams stayed
unchanged. Screenshots were captured and inspected. Projector sizes, resource
budgets, difficulty navigation and full sessions passed without page errors.

## Remaining boundaries

Three extra checks and two interventions remain the run-wide budgets. Additional
clues improve risk estimates, but even seeing every predictor does not reveal the
sampled one-shot outcome. Support can be spent unnecessarily; this does not cause
immediate elimination.

HH2 remains a synthetic digital proxy. Existing printouts and the illustrative
paper page are not an exact HH2 lookup population. Intervention effects are
teaching assumptions, not evidence of real-world causal effectiveness.

Reproduction and model details are in [households/README.md](../households/README.md)
and [households/MODEL.md](../households/MODEL.md). Local screenshots and detailed
logs are overwritten in ignored `households/out/`.
