# Household Hard prototype

Added Hard to the competitive difficulty selector, opening an isolated Household
implementation. Rover collaborative and competitive Easy/Medium rules and data
are unchanged. Hard reuses the original map, rendering and animation code; an
optional six-fortnight Calendar skin retains the same game state.

Implemented the approved tree, jar, doorway and weather cards. Dropout is the
single adverse outcome. Each team has six turns, three extra reveals and two
interventions. Skip on Dropout loses; Intervene protects this turn. A safe
intervention costs support without ending the game. Losing reveals the cards so
the Dropout cause is visible. Reset replays; New run advances the seed.

Cursor CLI drafted the isolated model and tests. Review found reversed severity
ordering, different live/archive sampling parameters, and omission of Attendance
from inspection choices. Reworked these before evaluating gameplay. Live and
archive rows now use one sampler with independent random streams, and polls use
only context plus revealed evidence. No forced winner count or hidden-truth advice.

Validation: 120 seeds / 480 teams; hidden-clue invariance, determinism, vote totals,
15/200 board parity, exhausted checks and direct observation. Browser-controlled
four-team Household runs at seeds 15-18 finished 4, 0, 3 and 2 teams. A separate
Medium browser run finished 2 teams. Existing PW6 browser regressions passed.
Reviewed screenshots of map, calendar and light variants; checked projector sizes.
Additional checks covered intervention exhaustion, safe intervention, skin state
preservation and visible Dropout after loss.

Recommendation: keep Dropout as the meaningful outcome and keep Rover Easy/Medium
for now. Attendance dominates inspection in Households; resource timing creates
tension but it is less varied than Rover's multiple hazards. Findings and exact
policy caveats are in narrative/household_hard_playtest.md.

Rebuilt the existing port-8684 rehearsal site. The port-8685 icon study remains.
No public deployment or push. No PDFs generated. HH1 remains a digital proxy,
not an exact printed lookup population. Screenshots/logs remain ignored locally.

Final review removed artificial 50/50 shrinkage from decision votes: they now
track matching historical outcome frequency. The final 480-team simulation
finished 34.2% with decision-only advice and 52.3% with inspection advice.
Selected seed 18 as the disclosed default demo after comparing seeds 15-18;
no winner count is enforced by the model.
