# Paper Weights - current summary

Sentences is available in the scenario switcher for the robot word rehearsal:
random matching-sheet picks or majority votes from a configurable number of
matching people, at 15/100/200 sheets. See [experiment](../narrative/ROBOT_MAJORITY.md).
This is append-only chaining; it does not revive the paused slot-editing game.


## Current trial - shared scenarios and stages

Rover and Households now share the competitive engine, Mars map and card layout.
Select the scenario independently of Risks, Indicators and Judgement. Indicators
splits AI decision estimates from Audience card suggestions. Judgement combines
model suggestions under AI and spends a separate quota for human advice.
Household Risks fills only Dropout. Indicators hides Dropout and dots Failed Harvest + Loan;
Judgement retains uncertain dropout outcomes without styling hints.

See [current rules](../narrative/shared_scenarios_stages.md) and the root README.
Earlier records below describe prior prototypes, not the current UI. No new
printouts generated. Rollback tag: `trial-before-shared-stages-2026-10-19`.

## Previous prototype record

Updated 19 October 2026. Rover browser prototype: **PW6**.

Competitive Hard now opens the isolated **HH2 Households** prototype. It keeps
the Rover map, draws action-dependent routes, and uses six turns, three extra checks and
two interventions. Dropout is a one-shot outcome influenced by Harvest/Cash together. Attendance
is an observation, not a direct outcome reveal. Intervention protects the current
turn and reduces next-turn pressure through context. Existing Easy/Medium rules
and PW6 data are unchanged. See [Household playtest](../narrative/household_one_shot_routes.md).
HH2 is digital-only; no existing PDF represents its audience model.

## Working game

One shared map with four labelled rover markers and four independent card panels.
Clicking a panel selects its dotted column highlight. Eliminated markers turn red;
the panel shows red OUT without a face. Three stick figures represent
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
red OUT, percentage-only polls, and desktop/mobile rendering.

Across 100 seeds, the 200-person simulation averages 0.36 finishers per four teams
for direct GO/AVOID decisions versus 1.13 for the tested inspection policy. At 15
people: 0.26 versus 0.93. Default seed: 1 versus 2 finishers at 200, 0 versus 2 at 15.
These are explicit policy comparisons, not optimal-play or human-play guarantees.

Checkpoint: chronology/2026-10-18-rover-evidence.md. No public deployment.

Poll cleanup: unavailable and zero-vote flip options are hidden, never crossed out.
When no checks remain, every digital audience record votes GO/AVOID from its
matching historical outcome. The resulting two bars account for the entire team.
This uses historical data only, not the hidden live row. Earlier policy simulation
figures above predate this exhausted-budget fallback.

Projector fit: the desktop layout uses the available viewport height, keeps four
panels in one row, and sizes the map to the remaining space without stretching.
No-scroll tests cover nine sizes from 800x600 to 2560x1440 with every poll open.
The browser's fullscreen mode can reclaim additional space on event day.

Teaching narrative: [rover_mode_transitions.md](../narrative/rover_mode_transitions.md)
sets out Easy's focus on significant outcomes and Medium's focus on gathering
useful evidence before taking risks with beneficiaries. FINISHED uses default
text color; only elimination is red (UI fix f313828).

Print storage cleanup: Git now retains only `printouts/latest/duplex.pdf` plus its
PRINT.md and verification.json. The latest printed design is still PW5/200 people;
PW6 remains digital-only. Full old packs and previews remain on disk but ignored.
[Regeneration instructions](printouts/README.md) describe `--update-latest`.
Printing no longer changes the active game unless `--install-game` is explicit.
The independent `moon/claude/` Moon Run fork is also local/ignored, with no Rover
gameplay or deployment dependency.

## Automation handoff trial - 2026-10-19

Easy remains room-led Go/Avoid. Medium separates AI Go/Avoid estimates from
Audience card-only suggestions. Hard puts mixed suggestions under AI; Audience
spends a human consultation without generating a poll. Hard keeps its separate
three-reveal and two-intervention budgets. Household harvest glyphs are now
three grains, two grains, and one drooping grain.

See [trial design](../narrative/automation_handoff_trial.md). Rollback baseline:
`trial-before-ai-handoff-2026-10-19` (`3f7c3b4`). Existing PDFs are not regenerated
for this trial.

## 2026-10-20 - Sentences RM2

The rehearsal now uses branching sheet data with three openings, neutral majority paths and noisy random chains. See [design and verification](robot-majority/BRANCHING.md). No PDFs regenerated.

## 2026-10-20 - Any starting cue and punctuation

Sentences now uses RM3: all 46 sheet cues are selectable as the first token, including `. , ! ?`. Chaining continues after punctuation; minority links can loop and go backwards. Full-room majority retains the three neutral robot routes. See [design](robot-majority/BRANCHING.md). No PDFs changed.

## 2026-10-20 - Swift-style mixed corpus

Sentences now uses RM4: 116 cues from weighted passages, repeated left cues per sheet, one randomly selected matching row per voter. Full-room neutral routes and random chains were compared at 15/100/200 sheets. See [model and results](robot-majority/MIXED.md). Existing printouts unchanged.
