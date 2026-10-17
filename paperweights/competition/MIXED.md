# PW5 - one audience, mixed historical actions

Current browser rehearsal uses six turns and three extra reveals per team per run.
The first card each turn is free. Any subsequent hidden-card reveal costs one token;
several tokens may be spent in a single turn. Polling is free. Tokens do not refill
between turns. Reset restores three and replays the same map. Teams are independent.

One Audience button counts every member's latest-icon/color entry. Answers are
GO, AVOID, FLIP BATTERY, FLIP SLOPE, FLIP DUST and FLIP GROUND. All percentages use
the whole team's matching records as denominator. There are no fixed model groups:
a person's different rows can contain decisions or inspection suggestions. Polling
again on the same cue does not resample. New reveals clear the previous poll.
Already-open card suggestions and exhausted-token suggestions remain counted and
are dimmed; the browser does not invent replacement votes or renormalize them.
A rep should retain evidence from all revealed cards, even though each lookup is
for the latest card only. A visible kill is conclusive reason to Avoid.

## What the historical labels mean

The shared PW2 physical archive and color-context rules remain. Labels refer to
that same historical row; current live-map outcomes never enter audience data.
For non-kill cues the rehearsal mix is an explicitly authored 50% complete-row
outcomes and 50% retrospective inspection recommendations. A complete outcome
says AVOID if any kill was present, otherwise GO. An inspection recommendation
selects another hidden kill category when available, otherwise samples another
category uniformly. For visible kill cues every record says AVOID.

This mixture models different coverage in historical records. It is NOT an
empirically learned confidence rule or evidence that a partial safe icon proved
that an entire row was safe. The 50% coverage mixture is a tuning parameter, not
an imposed 50/50 chance of survival. A printed historical action is an example,
not a guarantee for the live map. Color comes only from prior context, not the
hidden live outcome. Every answer has a matching archived row reference.

Largest-remainder allocation preserves per-cue frequencies to within one voter;
seeded tie order avoids always favoring one category. Assignment to individuals
is shuffled per cue. At 15 people each team has only three or four votes, so a
few records can dominate. At 200, each team has 50. Map routes and initial reveals
are identical between attendance sizes, enabling direct comparisons.

## Reproduce and test

`python3 paperweights/competition/mixed.py` writes only 15- and 200-person digital
packs and selects the 200-person pack by default. It does not generate PDFs.
`python3 paperweights/build_site.py --output paperweights/out/rover-review` refreshes
the existing local review server. PW4 PDFs are preserved and incompatible with PW5.
The PDF generator still targets PW4; do not run it to print this experiment yet.

`test_mixed.py` checks provenance, answer labels, whole-team tallies, visible-kill
votes, route/cue consistency and stable routes across pack sizes. `play-mixed.mjs`
checks exact browser counts, six turns, spending across turns, exhausted tokens,
no double spend, independent team reset, deaths, Easy and desktop/mobile layout.

`mixed_trials.py` records two explicit policies over 100 seeds: compare GO/AVOID
alone, or also inspect when the leading available category meets/exceeds both
decision options and tokens remain. Both policies Avoid visible kills; decision
ties choose Go. These are limited policy comparisons, not an optimal-strategy test.

Mean finishers out of four over six turns:

| People | Decision only | Inspection policy |
| --- | --- | --- |
| 15 | 0.27 | 0.95 |
| 200 | 0.38 | 0.45 |

Seed 15: decision-only finishes one team at both sizes; inspection finishes two
with 15 and one with 200. Six turns is demanding and the large-room inspection
policy has only a modest measured gain. Live rehearsal should determine pacing
and whether the coverage mixture needs adjustment; no balanced survival claim.
