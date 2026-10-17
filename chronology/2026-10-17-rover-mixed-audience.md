# Mixed audience and reveal budget - 17 October 2026

User requested one Audience button, mixed historical answers within the sheets,
and three lightning-bolt extra-reveal tokens, with a longer run to test gameplay.

Implemented PW5 digital rehearsal: six turns, three extra reveals across the whole
run, one free opening card per turn. Tokens can be spent together or saved; repeated
polls are free and deterministic. Controls share one row: Go, Avoid, Audience,
three bolts. Each team still progresses/resets independently. Poll denominator is
all team members; all six action options are visible. Already-open or unavailable
FLIP suggestions are dimmed without changing their counts. Latest reveal changes
the lookup and clears old bars. Easy remains face-up Go/Avoid.

Data now mixes decision/inspection answers per cue across all individuals instead
of assigning people to fixed models. Historical coverage is an authored half
complete-outcome, half inspection mixture for non-kill cues; visible kills always
say Avoid. Labels and context are from historical rows, never live hidden outcomes.
This is a tunable coverage model, not a learned certainty detector. See MIXED.md.

No PDFs regenerated or changed. Existing PW4 print packs retained. New digital
packs: PW5-15-15-92d56e90d0 and PW5-15-200-b089066934. Default is 200 people.
Same routes/opening cards at both sizes. Six-turn route support preserves four-turn
legacy defaults. Existing review server rebuilt; no public deployment.

All 11 model tests pass. Browser tests pass at both pack sizes: exact combined
counts, six-turn completion, tokens across turns, exhaustion, no repeated-card
spend, independent reset, death, Easy, desktop/mobile. All polls fit 1440x900.
Screenshots: paperweights/out/mixed-*.png.

100-seed policy study: mean finishers at 200 people are 0.38 for direct decision
votes, 0.45 for a policy spending when an inspection category beats/ties decision
votes. At 15: 0.27 and 0.95. Default seed: one vs one finisher at 200, one vs two
at 15. These policies are not an exhaustive strategy search. Six turns is hard;
keep the limitation explicit and let the user test pacing before further tuning.
