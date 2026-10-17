# Paper Weights - current summary

Updated 18 October 2026.

## Working game

PW5 is the current prototype. Medium has one opening card per turn, one Audience
button, mixed GO/AVOID/FLIP votes, six turns and three extra reveals per team across
the run. Teams progress/reset independently. Easy shows all cards with Go/Avoid.
The default rehearsal simulates 200 people. Polls now show percentages only, with
no voter counts. Lightning bolts sit at the far right of the action row.

Colors encode historical context; votes count that team's actual matching records.
The data and map share physical rules. Historical recommendations are not guarantees.
See competition/MIXED.md for the authored coverage mixture and measured limits.

## Final sheets

Stored in `paperweights/printouts/<pack-id>/`:

- PW5-15-15-92d56e90d0: 15 people, 30 duplex pages.
- PW5-15-200-b089066934: 200 people, 400 duplex pages.

Use `duplex.pdf`, A4, actual size, color, double-sided, long-edge flip. Word front,
Rover back. Keep team stacks together and select the matching game pack. These
sheets use the unchanged approved gameplay distributions and IDs.

[The print catalog](printouts/README.md) links the final files and regeneration
commands. Each pack has PRINT.md (instructions/team assignments), manifest.json
(exact data), verification.json (checks) and previews. Older packs are history.

## Shared-map layout exploration

`web/shared-map.html` is a separate interactive layout mockup: one large map with
four labelled rover positions and four card panels underneath. The terrain is a
shared reference; each team retains its own hazard rows. It reuses current
controls and data; the main four-map game is unchanged. Same-position markers have
separate letter labels connected to their actual position. Letters avoid confusing
team identity with context colors. `web/shared-map-preview.png` shows staged team
progress at different positions, not a recorded audience playthrough.

This is a layout preview, not an approved replacement. Shared-map selection/highlight
and eliminated-marker treatment need design review before promotion. The main game
retains its existing column bands and dissolution animation.

Checkpoint: chronology/2026-10-18-paperweights-print-and-shared-map.md.

Validation: both final PDF packs passed independent answer/tally/duplex checks;
11 model tests and browser gameplay checks passed. Shared preview checked on
desktop and mobile. No public deployment was performed.
