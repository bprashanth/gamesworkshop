# RM3 - Open word chains

Archived RM3 design. The live rehearsal now uses [RM4](MIXED.md).

The live Sentences rehearsal uses `branching.py`. The old `experiment.py` is an
RM1 baseline. RM2 added minority branches but still forced forward-only progress
and stopped at a full stop. RM3 removes both restrictions.

## Play

Select Sentences in Rover/Households. Choose 15, 100 or 200 sheets. The starting
cue selector includes all 46 actual word/color cues, including `. , ! ?`.
Three suggested sentence openings are grouped first. Changing the starting cue
resets the chain; Reset retains your choice. Changing pack size also retains it.

Next word chooses one actual matching sheet. Majority word counts distinct
matching people up to the Voters limit; blank uses everyone matching. Every
right-side word/color becomes the next left-side cue. Punctuation participates
in exactly the same lookup. Keep clicking after punctuation to continue.

The original `paperweights/generator.py` tokenizer treats `. , ! ?` as tokens and
its `circular_pairs` function closes the graph. RM3 follows that open chaining
behavior, while keeping context colors and a unique left cue per person for
unambiguous voting. It does not claim to reproduce the old literary corpus.

## Majority paths

- One night the old man found his robot checking every boat by the harbour.
- Each morning a young nurse watched her robot sorting every file inside our clinic.
- That evening a quiet farmer saw his robot counting each seed beside his barn.

The same opening plus all matching voters must give the same majority path.
Smaller voter samples can wander and lose grammatical coherence. Beginning at a
middle word produces a continuation, not necessarily a complete sentence.

## Data design

Colors distinguish occurrences of a word in different narrative contexts. Each
word cue has 100 authored transition observations: 52 for its coherent next cue
and 48 divided among minority links. Minority links can go backwards, cross
narratives and introduce punctuation. Punctuation cues point back to the three
openings, weighted 40/30/30. These are authored transition observations, not an
external literary dataset or a learned English model.

The shared dealing algorithm apportions these observations into actual 24-row
sheets, at most one matching left cue per person. Browser voting reads those
rows directly. Every right cue has left-side coverage. Random chains may loop,
repeat, form fragments or produce nonsense. There is no hidden grammar repair,
forced stopping point or browser-only alternative distribution.

No seed-42 sheet contains an entire intended majority path. That limits tracing
on one sheet; it is not a human-tested promise that nobody can guess a sentence.

## Reproduce and verify

```sh
python3 paperweights/robot-majority/branching.py
python3 paperweights/build_site.py --output paperweights/out/rover-review
node paperweights/tools/test-sentence-model.mjs
node paperweights/tools/play-sentence-words.mjs
```

`out/branching-report.json` is ignored and reproducible. The assembled site's
`paperweights/web/sentence-packs/` holds the generated RM3 packs. No PDFs changed;
existing printouts are not these new packs.

Across 100 deal seeds, three openings and three pack sizes, all 900 full-room
majority runs reached the exact neutral sentences without ties. With the fixed
seed-42 pack, 300 random 40-choice chains per size were all distinct and contained
all four punctuation tokens across the runs. Every one of the 46 starting cues
was exercised for 100 random steps per pack size without a dead end.

The Node tests check exact votes, 600 chains of 40 transitions and sampled voter
IDs. Browser checks exercise every starting cue, punctuation continuation, all
three neutral majority sentences, Reset, sheet sizes, navigation and layout.

The full-stop human pivot vote is still a future step. For now the facilitator
can simply pause when the robot sentence reaches punctuation.
