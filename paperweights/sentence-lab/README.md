# Paper Weights sentence lab

A separate experiment for two groups steering one robot sentence. Open `index.html` through the repository's HTTP server. The default page loads `pack.json`, the **15-person seed-17 pack**. It does not change Rover or the existing Swift exercise.

Start with **Word-chain revision** and **Representative**. One group wants a helpful robot, the other a harmful robot. Match the current word and color on the paper, collect the suggested right-hand words, and let the representative choose a leading continuation. That exact word/color is the next lookup. It replaces the verb belonging to its part of the sentence. Ten turns give each group five decisions; use the optional 30-second window for approximately five minutes.

The printed sheet supplies the observation, not the player's preferred word. Representatives choose from the two leading counts, including ties. The page's counts are simulated from the actual dealt sheets; it is not collecting votes from phones. Majority mode takes the largest count. Seeded sampling draws from all positive-count observations, including minority continuations. `Replay recorded reps` plays a recorded goal-directed trace from these sheets.

[Results and the full ten-sentence trace](RESULTS.md) compare continuous revision, scheduled re-cue and append-only clauses. The comparison tab contains real recorded representative, majority and sampling runs for each. Seed 17 was selected as a clear rehearsal example: all ten turns change the sentence, all five positions are visited, and the authored action checklist changes lead five times. This is not a promise about every seed or human choice.

## Print / regenerate

The generated packs cover 15, 100 and 200 people with two balanced groups. Every person has all 24 lookup cues: 20 verbs and four starter words. The default starts from `robot`; `then`, `again` and `finally` are alternative starter rows, not words encountered later in that default chain. Use matching pack IDs on paper and screen; do not substitute a Rover sheet or the original Swift corpus.

Run model generation **before** printing:

```sh
python3 paperweights/sentence-lab/trials.py
paperweights/.venv/bin/python paperweights/sentence-lab/build_sheets.py --pack paperweights/sentence-lab/pack-15.json
paperweights/.venv/bin/python paperweights/sentence-lab/build_sheets.py --pack paperweights/sentence-lab/pack-100.json
paperweights/.venv/bin/python paperweights/sentence-lab/build_sheets.py --pack paperweights/sentence-lab/pack-200.json
python3 -m unittest discover -s paperweights/sentence-lab -p 'test_*.py'
```

`trials.py` regenerates all three packs, restores the default `pack.json` to the 15-person pack with nine recorded demonstrations, and writes the unfiltered comparisons to `trials.json`. Print outputs go into `printouts/<pack-id>/`. For a different seed or size, use `model.py --sheets 200 --seed 23 --out ...`, then render that JSON. Loading a different pack into the page requires replacing `pack.json`; regenerate its recorded comparisons if you want demonstrations for it. A seed changes the authored graph as well as the deal, so changing the seed is a different experiment, not merely shuffling pages.

Pack IDs hash the graph, grammar, rules and dealt sheets. Recorded traces are derived enrichment added after that hash; they do not change the observation identity. Both groups draw from the same underlying weights. Their different goals affect choices, not the sheet distributions. Exact tally proportions belong to complete assigned groups; arbitrary subsets can differ.

## Limits of the demonstration

The grammar, object phrases, verb vocabulary, protective/destructive labels and graph structure are authored. Linking words and object phrases in the append variant are fixed framing outside the printed lookup chain. This is a demonstration of distributed observations, probability, selection and steering; it does not learn grammar or produce an unprompted natural-language model.

The internal action checklist is an evaluation aid, not a sentiment model or an objective meaning judge. The page asks the room to judge the final sentence. The second mover has an advantage in the simulation. Swap roles for another round if treating it as a competition. Across arbitrary seeds some revisions leave the sentence unchanged even though two choices remain available; the chosen rehearsal seed avoids that. [RESULTS.md](RESULTS.md) gives those failure rates rather than hiding them.

`model.py` and `model.js` implement the same small transition. Tests check their parity, all printed counts at all three sizes, exact right-to-next-left closure in continuous modes, and graph reachability. `pack.json` embeds the nine demonstrated traces; `trials.json` contains all policy comparisons. Everything in this directory is independent of the Rover map and cards.
