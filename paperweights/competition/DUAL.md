# PW4 - two audience models

Both models estimate properties of the same column from one color/icon cue.
No next-column inference is performed in PW4. `targetCues` is a legacy field name:
it names the row the current Go/Avoid decision resolves, for both modes.

The unchanged continuous physics generates historical maps and live routes.
For historical observations, the key is `card_cue(history[0], source, category)`;
for the live target row it is `card_cue(history[1], target, category)`. These are
matching temporal offsets. Colors use past dust/ground/hazards, never the hidden
current-row outcome. Some contexts predict little; this prototype does not assert
that every color is equally informative.

GO/AVOID labels are whether any kill exists in that historical source row.
Inspection labels select a hidden kill category if one exists; otherwise sample
another category uniformly. They never select the cue's own category. This is an
authored retrospective labeling policy, not historical human voting data or an
optimal information-gain algorithm. On a safe row there is no uniquely correct
inspection. No live outcome is consulted to build a sheet.

Each team has a roughly equal, randomly assigned model split. For each model and
cue, largest-remainder allocation approximates historical answer frequencies to
within one person. Each printed answer has an archive record reference. The browser
counts the actual team/model sheet entries on demand, with the number of matching
model sheets as the denominator. It does not use map truth, synthesize a new sample
on each poll, or multiply probabilities from separate cues.

Medium initially reveals one randomly selected category, including possible hazards.
One additional reveal is permitted. Decision polling can be repeated on the newest
card; old bars clear when the cue changes. Inspection polling is disabled after the
extra reveal. Both revealed cards remain visible, so the rep can retain evidence.
A shown kill is conclusive evidence to Avoid regardless of any later poll. Seeing
safe cards does not prove the remaining hidden cards safe. No artificial 50/50 is
imposed and no balanced finisher rate is claimed.

The static rehearsal pack contains full map data and is not an anti-cheat boundary.
UI state exposes only revealed cards in Medium. Four independent teams, per-team
reset, and a full reset support solo rehearsal. Reset repeats the map intentionally.

Validation: test_dual.py checks 15/100/200 role balance, exact sheet counts,
historical provenance, same-row labels, inspection labels and live cue offsets.
play-dual.mjs checks rendered polls against sheets, reveal limits, independent
progress/reset, deaths, completion, Easy and mobile. build_printouts.py extracts
PDF answers and colors and compares every cue tally with the pack.
