# RM4 - Mixed corpus and one vote per person

The live Sentences rehearsal now uses `mixed.py` and `mixed-corpus.txt`. RM1-RM3
remain available as older experiments; they are not the live sentence packs.

## What changed after the Swift reference

- 116 word and punctuation cues instead of 46 narrative-position cues.
- Repeated matching left cues can occur on one person's 24-row sheet.
- Every matching person randomly chooses one of their matching rows and casts
  exactly one vote. A sheet with five matches gets one vote, not five.
- Next word chooses one matching person, then one matching row on that sheet.
- Majority word samples distinct people up to Voters, then counts their choices.
  Blank Voters uses all matching people. This is a plurality, not a requirement
  for the winning word to exceed 50 percent. Ties use full cue alphabetical order.
- All next-token pairs come from the corpus. There are no arbitrary noise edges
  or narrative-position colors. Each vocabulary token has one fixed lookup color,
  like the existing word generator. Colors here do not encode prior context.

The starting selector offers every actual cue, including `. , ! ?`. Chaining
continues through punctuation. Reset preserves the starting cue. An arbitrary
middle word need not produce a complete grammatical sentence under majority.

## Corpus and dealing

`mixed-corpus.txt` contains original authored robot, household, weather, book and
boat passages, plus short passages reused/adapted from the existing local
`generator.py` corpus. This is a deliberately weighted workshop corpus, not a
claimed natural-language dataset or an external corpus download.

The first three neutral passages have weight eight; each other passage has
weight one. Tokenization retains apostrophes inside words and treats `. , ! ?`
as tokens. Each passage forms a circular token chain, including its punctuation
back to its first word. Counts are taken from those weighted chains.

A deal first reserves two rows for each left cue, then apportions the remaining
rows by corpus cue frequency. Each cue's outgoing observations are apportioned
into that row budget. The 24-row sheets are shuffled, with retries only to ensure
that every cue appears on at least two different people's sheets. Every right
cue has left-side coverage. Small packs omit some rare observed pairs due to
integer rounding; they never invent pairs.

One-person-one-vote is not the same as counting every printed row. A person's
expected contribution to a next word is the fraction of their matching rows
that contain that word. The simulation and browser both implement this rule.
Even a full-room vote can vary between runs because people choose matching rows
afresh. We do not force a neutral answer after the ballots.

## Experiments

Each result below uses 100 ballot seeds across three suggested openings, for
300 sentence-prefix trials on the actual seed-42 pack. Exact means the entire
intended sentence, including its final full stop, matched. It is stricter than
merely remaining grammatical.

| Pack size | All matching voters exact | Up to five voters exact | One random person exact |
| --- | --- | --- | --- |
| 15 | 276/300 | 266/300 | 18/300 |
| 100 | 300/300 | 106/300 | 14/300 |
| 200 | 300/300 | 78/300 | 11/300 |

A separate sweep over five deal seeds and 20 ballot seeds per opening gave
263/300 exact at 15 sheets and 300/300 at both 100 and 200. These are measured
simulation results, not mathematical guarantees or observed audience behavior.
Small rooms are less reliable; limited turnout can be less reliable even with a
large printed pack. Room size alone does not determine participation per cue.

All 300 random 40-step runs per pack size were distinct. Every 200-person sheet,
99 of 100 sheets and 12 of 15 sheets have repeated left cues.

At 200 sheets, comparing weights for the neutral passages:

| Repetitions | Full-room exact | Random exact |
| --- | --- | --- |
| 4 | 219/300 | 3/300 |
| 8 - selected | 300/300 | 11/300 |
| 12 | 300/300 | 28/300 |

Eight gives the best tested balance of reliable majority and wandering random
chains. This is calibration on an authored teaching corpus, not evidence that
majority decoding generally creates good English.

Intended majority examples:

- One evening our robot was quietly checking boats near home.
- Sometimes robots spend mornings sorting letters inside libraries.
- Nearby machines were patiently counting seeds beside farms.

Random sample fragment from the 200-sheet simulation:

> one evening. seeds in the children took all evening our robot was patiently counting seeds beside farms. counting boats. home.

## Reproduce

```sh
python3 paperweights/robot-majority/mixed.py
python3 paperweights/build_site.py --output paperweights/out/rover-review
node paperweights/tools/test-sentence-model.mjs
node paperweights/tools/play-sentence-words.mjs
```

The report is local and ignored: `out/mixed-report.json`. Generated packs are in
`paperweights/out/rover-review/paperweights/web/sentence-packs/`. IDs begin RM4.
The browser Last draw panel includes each person's selected matching-row index
and answer so votes can be audited against the loaded pack.

No PDFs were regenerated. The current printout snapshot is not this new corpus.
Keep the existing two-column print format when this experiment is approved for
printing. Rover and Households rules and printed data remain untouched.
