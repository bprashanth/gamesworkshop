# Household one-shot dropout and branching routes

User requested less Attendance dominance, more Harvest/Cash inspection, no
Calendar, and routes diverging through the existing contours based on actions.

HH2 separates observable attendance from the one-shot dropout outcome. Loan and
bad harvest interact strongly in the synthetic risk sampler. Dropout can occur
with regular attendance and appears as an outcome icon after loss. Inspection
votes come from information gain; Harvest/Cash now receive about 93% of opening
inspection votes, Attendance about 2% in the 120-seed evaluation.

Removed Calendar UI/code. Added a Household-only route renderer using the original
Rover contour asset and drawing helpers. Skip/Intervene branch the trails while
preserving shared month bands and six-turn completion. Intervention also selects
a lower-pressure next-turn context. Active rows are derived from actual action
history with common monthly random draws, not the static all-Skip reference rows.

Validated 480 simulated teams and four complete four-team browser sessions.
Audience inspection policy finished 40%, versus 34% decision-only and 34.4% for
repeated Attendance inspection. Final browser seeds 15-18 finished 2, 3, 1 and 0
teams. Selected seed 15 as the disclosed current demo. Route tests verified
separation, equal month progress, independent reset and deterministic replay.
Inspected screenshots of diverging trails on the existing terrain.

Updated README, current summary and model documentation. New current report:
narrative/household_one_shot_routes.md. HH1 report retained as an explicitly
superseded archive. No PDFs generated, no push or public deployment. Rover
Easy/Medium and collaborative gameplay remain unchanged.
