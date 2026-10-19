# RM2 - Branching word sheets

The live Sentences rehearsal now uses `branching.py`. The older `experiment.py`
remains a reproducible RM1 baseline; its grammar constrained random samples too
strongly. RM2 reuses its 24-row, unique-left-cue dealing algorithm.

## Play

Select Sentences in Rover/Households. Choose 15, 100 or 200 sheets and an opening:
one, each or that. Next word chooses one actual matching sheet. Majority word
counts a sample of matching sheets, without replacement. Blank Voters uses all
matching people. Reset retains the opening for a direct comparison.

All matching people plus the same opening must produce the same majority path.
Changing the opening chooses a different path in the SAME printed pack. Smaller
voter samples can change winners and lose grammatical coherence. We do not
secretly randomize the full-room majority or regenerate sheets on Reset.

## Data design

Three authored neutral routes:

- One night the old man found his robot checking every boat by the harbour.
- Each morning a young nurse watched her robot sorting every file inside our clinic.
- That evening a quiet farmer saw his robot counting each seed beside his barn.

There are 43 word/color cues. Colors distinguish different occurrences of a word
and encode its narrative context. Each non-terminal cue has 100 authored
transition observations: normally 52 for the coherent continuation and 48 split
across up to four minority links. Minority links cross narratives and can skip
words, making syntax break as well as meaning wander. Where punctuation is the
only continuation it receives all observations. This is a deliberately authored
transition corpus, not a natural literary corpus or learned English model.

Integer apportionment converts those counts into actual sheet rows. Each person
gets 24 distinct left cues. At seed 42, matching groups contain 8-9 people out of
15, 55-56 out of 100, and 111-112 out of 200. All printed right cues have left-side
coverage. Every non-terminal link moves forward in narrative position, so even
nonsense ends within 14 choices. No hidden repair happens in the browser.

No single seed-42 sheet contains a complete intended majority path. This reduces
how much a participant can infer by tracing their own sheet, but it is not a
human-tested guarantee that nobody can guess the sentence.

## Reproduce and verify

```sh
python3 paperweights/robot-majority/branching.py
python3 paperweights/build_site.py --output paperweights/out/rover-review
node paperweights/tools/test-sentence-model.mjs
node paperweights/tools/play-sentence-words.mjs
```

`out/branching-report.json` is an ignored, reproducible report. Generated RM2 JSON
packs live under the assembled site's `paperweights/web/sentence-packs/`.
No PDFs were generated. Old printouts do not represent RM2.

Across 100 deal seeds, three openings and three room sizes, all 900 full-room
majority runs reached the exact neutral sentences without ties. All 900 sampled
runs differed from those sentences. Holding the actual seed-42 sheets fixed,
300 random runs per size gave 300, 298 and 298 distinct sentences respectively.
These are simulation results, not audience measurements. Browser tests also
check sampled voter IDs and counts against the actual loaded sheets.

Example random output: `one night the old man found his checking by the harbour.`
Random output can omit the robot, mix narratives or become nonsense. Majority
keeps a neutral robot sentence with an -ing pivot. The full-stop human pivot vote
remains a future step, not a second lookup operation.
