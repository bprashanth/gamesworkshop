# Rehearsing the attached prior duplex

Open `/paperweights/web/sentences.html?deck=prior`, or choose **Prior duplex** in
Sentences. The **Mixed corpus** option restores the robot experiment.

This uses the exact word faces of the user's attached `duplex.pdf`, pack
`PW2-15-15-fb7b11abfe`. Its 30 pages contain 15 word faces interleaved with 15 Rover
backs. The extracted deck has 360 rows and 51 word/color cues. It is not the same
file as `paperweights/printouts/latest/duplex.pdf`; the latest snapshot is untouched.

The prior deck is fixed at 15 people. No copies or newly generated sheets are
added to simulate a bigger room. Word faces are pooled across all Rover team
labels; those labels do not partition the original word chain. Each person's
24 rows, duplicate entries, punctuation, uppercase I and both colors are retained.

Next word chooses one matching person, then one random matching row. Majority
word samples distinct matching people and each chooses one matching row at
random. Blank Voters means all matching people. Starting words, resets and
punctuation continuation work identically in both decks. Last draw shows the
original sheet number, team and selected match for each ballot.

## Extraction and provenance

`prior-duplex.json` is the small, checked-in data source. Builds copy it unchanged
into the site's sentence-packs folder. No duplicate PDF is stored in the repo.

Source SHA-256:
`d5423ed25e4d4e039eccfb3761fa96e59a67c8c12da85af1e903dea393b14abb`

To extract again from the original attachment, with PyMuPDF installed:

```sh
python3 paperweights/robot-majority/import_duplex.py /path/to/duplex.pdf
python3 paperweights/build_site.py --output paperweights/out/rover-review
node paperweights/tools/test-prior-sentences.mjs
```

Importer checks 24 pairs per word face, matching front/back identities and exact
agreement between whole-page and separate-column text extraction. Every printed
right cue has matching left rows on at least two different people's sheets.
The first page was also visually checked against the extracted pairs.

## Comparison observations

The test runs 100 random and 100 majority chains of 40 choices from each of
`RED:the`, `PURPLE:I`, `BLUE:why`. Each group of 100 produced 100 distinct chains.
The report is local at `out/prior-report.json`. Browser tests exercise actual
ballots, deck switching, fixed room size, voter cap, reload, reset and layout.

Example random fragment: `the boy in the cat in the pale blue eye`.
Example majority fragment: `the cat in the old man in the cat in the boy`.

This pack wanders and revisits phrases under both methods. It has no coherent
majority guarantee and no robot preference. That makes it a useful comparison
for surprise and playfulness, but diversity counts do not measure audience fun.
Try both decks at 15 sheets for the closest comparison of room size.
