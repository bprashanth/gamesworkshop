# Robot majority experiment

Pre-print experiment only. No PDFs generated, and neither running game changed.
See [the narrative and decision](../../narrative/ROBOT_MAJORITY.md).

```sh
python3 paperweights/robot-majority/baseline.py
python3 paperweights/robot-majority/experiment.py
```

The scripts use the Python standard library. `baseline.py` reads the existing
word generator without importing its PDF dependencies. `experiment.py` writes
600 original synthetic corpus sentences, actual 24-row deals at 15/100/200,
full vote traces and sensitivity results to ignored `out/`. It also updates
[sample-sheet.md](sample-sheet.md), one real sheet's rows in readable form.
This is not the final print layout; use the existing Swift rectangles later.

The full corpus and decks are reproducible local artifacts, not extra committed
print histories. `out/report.json` records exact votes and the reweighted corpus
comparison. No external literary work or source dataset is required.

One left word/color cue occurs at most once on a sheet. Every chosen right cue
has left-side coverage elsewhere. Each sheet has 24 rows and the graph 35 cues.
The dot is a punctuation token, not a UI separator: stop on it rather than taking
its printed reset edge back to `one`.

The guarantee comes from an explicitly authored grammar and contextual colors,
not inferred English syntax. The model chooses actual next words, appending each
one, without the old sentence-lab's unrelated-slot edits. The final free-text
pivot is a separate, clearly announced human editing step.
