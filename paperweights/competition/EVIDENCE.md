# PW6 - cumulative evidence and useful inspections

Digital rehearsal only. The PW5 one-icon lookup sheets cannot encode this model's
combined evidence and must not be used as its voting sheets. Existing PDFs are
preserved. A new paper encoding needs review before another print run.

## Poll calculation

The same physical map generator and historical archive are retained. A poll uses
ALL revealed icon/color pairs in the current column, not just the last card. It
filters historical rows matching those pairs at the same temporal offsets used
by the live map. Unrevealed live values and the live row's fatal flag are not inputs
to the poll. Fully specified future outcomes are not consulted to advise a reveal.

Let p be the fraction of matching historical rows with any kill, and H(p) their
binary entropy in bits. For each hidden category, calculate expected reduction in
H after observing its possible icon/color values in those historical rows. This
is information gain, not a score assigned because the live card is a kill.

When a useful inspection exists, the authored action policy allocates 0.9*H(p) of
votes to inspection and divides that mass in proportion to squared information
gain. The rest is split GO/AVOID in proportion to historical safety/risk. No useful
inspection means all action mass goes to decisions. Visible kills and fully known
rows yield conclusive decisions. This policy makes uncertainty visibly favor useful
checks and concentrates votes on a category instead of splitting them uniformly.

These are ACTION VOTES, not a calibrated display of death probability. The 0.9
factor and squared gain are explicit design choices. Votes are allocated to each
team's digital audience using largest remainder, shuffled into per-person lookup
tables and counted by the browser. Every simulated answer references an archived
row matching ALL the revealed evidence. Inspection labels are policy suggestions;
GO/AVOID examples additionally match the archived outcome. These tables contain
combined keys and are not the old 24-row printable sheets.

New evidence does not have to confirm the initial majority. It can raise or lower
risk; on average a useful inspection reduces uncertainty. The tests verify expected
decision mass does not decrease after the best inspection for each initial cue.
This is different from artificially increasing confidence after every click.

## Game and rendering

Six turns, three extra checks per team across the run. Stick figures represent
remaining checks at the far right; polling itself is free. The first card each
turn is free. Revealing more cards spends checks. A visible kill warrants Avoid
even when earlier votes suggested otherwise. Independent team progression/reset.

One shared reference map is now the main view. Four letter-labelled markers share
the route but keep independent hazard rows. Clicking a panel selects its dotted
column highlight. Eliminated markers turn red and their panel displays red OUT without a face. Team-letter leaders separate coincident positions. The
shared-map.html link remains an alias of the promoted layout.

## Reproduction and validation

`python3 paperweights/competition/evidence.py` writes PW6 digital packs for 15 and
200 people, with 200 as default. It does not modify PW5 PDFs. Rebuild the review
site using `python3 paperweights/build_site.py --output paperweights/out/rover-review`.

Tests cover matching all historical cues, exact whole-team vote counts, exclusion
of already revealed categories, conclusive known outcomes, and expected benefit
from information gain. Browser tests cover cumulative polls, six turns, token
limits, resets, red OUT, Easy, percentages-only UI and desktop/mobile layout.
`evidence_trials.py` compares direct decisions with a simple inspection policy over
100 map seeds; its full logs and results are in evidence-trials.json. It is not an
optimal-policy search or a guarantee about live audience behavior.

Measured results (100 seeds, six turns, three checks):

| People | Direct decisions: mean finishers / 4 | Inspection policy: mean finishers / 4 |
| --- | --- | --- |
| 15 | 0.26 | 0.93 |
| 200 | 0.36 | 1.13 |

Default seed 15 finishes 0 versus 2 teams with 15 people, 1 versus 2 with 200.
This inspection policy spends when the leading hidden category beats/ties either
decision option and tokens remain; it uses updated combined evidence thereafter.
Visible kills always Avoid. Results do not imply a universally winning strategy.

When checks are exhausted, polling uses the outcome of each matching historical
record to cast GO/AVOID votes for the whole team. It does not simply normalize the
small decision subset or read the live hidden outcome. Unavailable and zero-vote
FLIP rows are hidden. Existing simulation results predate this fallback adjustment.
