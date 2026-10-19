# Robot majority experiment

The live browser now uses [RM3 open word chains](BRANCHING.md). The RM1 experiment described below is retained as a baseline, not the current browser corpus.

Pre-print experiment. No PDFs generated. A Sentences rehearsal is now available
in the competitive scenario switch; Rover/Household rules remain unchanged.
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

## Browser rehearsal

Run `python3 paperweights/serve.py --rover-only --bind 0.0.0.0` and select
Sentences, or open `/paperweights/web/sentences.html`. The build uses the RM3 `branching.py` corpus and shared deal function to populate `sentence-packs/{15,100,200}.json` inside
the assembled site. It does not create PDFs. Source UI lives in
`paperweights/web/sentences.html`, `sentences.js` and `sentence-model.js`.

Next word samples one real matching sheet. Majority word samples distinct matching
people up to the Voters limit; empty means all. Requests above the available
matches use all matches. Ties use alphabetical cue order. Reset clears the chain
and next click draws afresh. This simulates voting, not a live ballot collector.

```sh
node paperweights/tools/test-sentence-model.mjs
node paperweights/tools/play-sentence-words.mjs
```
