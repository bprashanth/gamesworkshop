# Sentences event rehearsal

Added Sentences to the Rover/Households scenario switcher. It opens a simple
map-free word chaining page with the shared dark/light palette and typography.
No previous sentence-lab slot editing or live ballot service is involved.

Starts from RED one. Next word samples one actual matching sheet. Majority word
samples up to the requested number of matching people, without replacement,
and appends the most-voted right word/color. Blank means all matching sheets.
Requests above eligibility use every matching sheet; no duplicate voters are
invented. Ties resolve by alphabetical cue. Reset clears the chain and draws
afresh on the next click. Full stop ends the run. Last draw is an optional
count/participant audit, closed by default.

15/100/200 sheet deals are rebuilt from the reviewed authored corpus by
paperweights/build_site.py into assembled sentence-packs JSON. Source model is
paperweights/robot-majority/experiment.py. No PDF files generated. Counts are
real rows from the synthetic corpus's dealt sheets, not external data or an LLM.

Validation:
- Pure model test: exact counts, distinct voters, color-sensitive keys, no
  invented edges, reproducible random source and 600 complete chains using
  actual assembled 15/100/200 packs.
- Browser: seven random advances,14 five-person majority advances audited
  against sheet IDs, full-population canonical sentence, Reset, pack switching,
  clamping to eligible voters, punctuation stop, theme and half-screen layout.
- Navigated Households -> Sentences -> Rover and direct scenario=sentences URL.
- Inspected random-seven, majority-complete and words-half-light screenshots
  under ignored paperweights/robot-majority/out.
- All18 existing scenario/stage/viewport checks pass after entry-loader change.

No Rover/Household outcome rules or quotas changed. README and robot experiment
notes now link the playable rehearsal and describe controls.
