# Paper Weights - current summary

Updated 18 October 2026. Current browser prototype: **PW6**.

## Working game

One shared map with four labelled rover markers and four independent card panels.
Clicking a panel selects its dotted column highlight. Eliminated markers turn red;
the panel shows an X-eyed smiling face beside OUT. Three stick figures represent
the team's extra checks for the entire six-turn run. One opening card per turn is
free; additional reveals spend checks. Polls are free and show percentages only.

Audience polls now combine ALL revealed icon/color pairs. Historical uncertainty
favors inspecting a useful hidden category; new evidence updates the risk and can
shift the decision either way. Known kills yield AVOID. Useful information reduces
uncertainty on average, not necessarily on every individual reveal. Votes remain
authored action recommendations, not literal displayed hazard probabilities.

The shared-map.html URL remains an alias of the main layout. Per-team and global
reset remain. Reset repeats the same route for comparing strategies. Easy still
shows all cards and Go/Avoid.

## Data and printed sheets

Digital packs: PW6-15-15-457112229b and PW6-15-200-c077f594df (default).
See competition/EVIDENCE.md for the evidence filter, information-gain policy,
historical provenance and reproduction commands.

**Existing PDFs are PW5. They do not match PW6's cumulative polling.** They remain
in paperweights/printouts/ with their original manifest, instructions and checks.
No new PDFs were generated. A combined-evidence paper encoding must be agreed
before PW6 is printed; the old 24-row single-icon sheet cannot express it directly.
The prior final packs are indexed in printouts/README.md as historical PW5 files.

## Validation

Thirteen model tests pass. Browser checks pass for 15 and 200 people, including
cumulative vote counts, tokens across six turns, independent resets, elimination,
X-eyed face, percentage-only polls, and desktop/mobile rendering.

Across 100 seeds, the 200-person simulation averages 0.36 finishers per four teams
for direct GO/AVOID decisions versus 1.13 for the tested inspection policy. At 15
people: 0.26 versus 0.93. Default seed: 1 versus 2 finishers at 200, 0 versus 2 at 15.
These are explicit policy comparisons, not optimal-play or human-play guarantees.

Checkpoint: chronology/2026-10-18-rover-evidence.md. No public deployment.
