# Robot sentence experiments

The live rehearsal uses [RM4 mixed corpus](MIXED.md): 116 word/punctuation cues,
24 rows per sheet, repeated matching cues and one vote per person. The corpus
is in [mixed-corpus.txt](mixed-corpus.txt); its explicit weights favor neutral
robot passages while random sampling wanders through the surrounding text.

```sh
python3 paperweights/robot-majority/mixed.py
python3 paperweights/build_site.py --output paperweights/out/rover-review
node paperweights/tools/test-sentence-model.mjs
node paperweights/tools/play-sentence-words.mjs
```

Select Sentences in the Rover/Households switch, or open
`/paperweights/web/sentences.html`. Choose any starting cue. Next word samples
one matching person and one of their matching rows. Majority word counts one
randomly selected row per person, up to the Voters limit; blank means everyone
matching. Reset retains the starting cue. Punctuation also chains normally.

Reports and generated packs remain local, reproducible artifacts. The build
writes `sentence-packs/{15,100,200}.json` in the assembled site. No PDFs are made.
Existing printouts are not the new corpus. Rover/Households rules are unchanged.

## Archived experiments

- `baseline.py`: majority behavior of the older literary blend.
- `experiment.py`: RM1 constrained grammar with 600 generated sentences.
- `branching.py`: RM3 manually authored open graph; [archived design](BRANCHING.md).
- [Original feasibility narrative](../../narrative/ROBOT_MAJORITY.md).

The old `sample-sheet.md` belongs to RM1, not the live mixed corpus. Scripts use
only the Python standard library. The browser uses actual dealt rows, not an
external model or a live audience ballot collector.
