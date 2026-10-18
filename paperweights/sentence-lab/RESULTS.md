# Sentence lab: what the experiments show

Try **word-chain revision with a representative choosing between the leading continuations**. It retains the exact Swift lookup chain: the selected right-hand word/color is the next left-hand cue. Its deliberate change is that the selected word replaces its grammatical position in one shared sentence rather than being appended.

The sentence frame and vocabulary are authored. This experiment does not learn English grammar, infer morality, or demonstrate a sentence emerging freely from a corpus. Five verb positions describe the crew, supplies, shelter, survivors and routes. Each position has one protective verb, one destructive verb and two observational verbs. Colors identify grammatical roles. A fixed graph routes each word to four words in other positions; the two largest underlying weights offer a protective and destructive continuation. Both groups use the same graph and distribution. Their goals change their representative's choice, not their data.

Every participant receives exactly 24 immutable word/color pairs, covering 20 verb keys and four valid starter keys. The default starts from `robot`; the other three starter keys are unused in that default run. Every possible selected continuation is a verb with a valid next lookup. A group of 15 is split 8/7; 100 and 200 split evenly. Counts are allocated by largest remainder and shuffled among sheets. Group tallies are recomputed from those actual pairs. The screen offers the top two counts, including ties; all other votes remain visible. The sampling comparison samples **all** positive-count continuations, not just the leaders.

## Three actual variants

| Variant | What changes | Representative result at seed 17 |
| --- | --- | --- |
| Word-chain revision | The chosen word replaces its own sentence position and becomes the next lookup | 15 words; all ten turns change the sentence; five lead reversals |
| Scheduled re-cue | Same replacement, but the next lookup comes from a scheduled existing position | 15 words; two unchanged turns; two reversals |
| Append-only chronicle | A short clause is appended for each chosen verb; the selected word stays the next cue | About 35 words; protective and destructive clauses cancel under the declared checklist |

Scheduled re-cue does **not** necessarily edit the scheduled position: it reads that position as the cue, then edits whichever position belongs to the selected continuation. It breaks the strict right-to-next-left chain and therefore needs an extra explanation. The append variant adds object words and linking punctuation from the fixed grammar frame; those are not claimed to be voted or learned tokens.

## The ten-turn rehearsal

Seed 17 was explicitly selected because it makes a clear demo; it is not evidence that every graph is engaging. The same reference choices work at 15, 100 and 200 sheets with five lead reversals and zero unchanged turns. Each group gets five turns; a nominal 30-second window gives five minutes.

| Turn | Group | Printed continuation | Shared sentence |
| --- | --- | --- | --- |
| 1 | A | PURPLE:robot -> GREEN:rescues | The robot observes the crew, counts supplies, inspects the shelter, rescues survivors and maps routes. |
| 2 | B | GREEN:rescues -> RED:attacks | The robot attacks the crew, counts supplies, inspects the shelter, rescues survivors and maps routes. |
| 3 | A | RED:attacks -> AMBER:repairs | The robot attacks the crew, counts supplies, repairs the shelter, rescues survivors and maps routes. |
| 4 | B | AMBER:repairs -> PINK:blocks | The robot attacks the crew, counts supplies, repairs the shelter, rescues survivors and blocks routes. |
| 5 | A | PINK:blocks -> BLUE:shares | The robot attacks the crew, shares supplies, repairs the shelter, rescues survivors and blocks routes. |
| 6 | B | BLUE:shares -> GREEN:abandons | The robot attacks the crew, shares supplies, repairs the shelter, abandons survivors and blocks routes. |
| 7 | A | GREEN:abandons -> RED:guards | The robot guards the crew, shares supplies, repairs the shelter, abandons survivors and blocks routes. |
| 8 | B | RED:guards -> AMBER:destroys | The robot guards the crew, shares supplies, destroys the shelter, abandons survivors and blocks routes. |
| 9 | A | AMBER:destroys -> GREEN:rescues | The robot guards the crew, shares supplies, destroys the shelter, rescues survivors and blocks routes. |
| 10 | B | GREEN:rescues -> RED:attacks | The robot attacks the crew, shares supplies, destroys the shelter, rescues survivors and blocks routes. |

## Unfiltered comparisons

The comparisons use 200 graph seeds (0–199), all three sizes, three variants, and representative/top-two, representative/all-voted, modal, and all-vote sampling policies. The simulation's checklist gives protective verbs +1, destructive verbs -1, observational verbs 0. A lead reversal changes the sign of that checklist, ignoring intervening ties. **This is a declared toy action score, not a sentiment model or an objective judgment of the sentence.** The live audience should judge the final wording.

At 15 sheets:

| Policy / variant | Mean reversals | Mean unchanged turns | Final length |
| --- | ---: | ---: | ---: |
| Representative / chain revision | 2.03 | 1.74 | 15 words |
| Representative / scheduled re-cue | 1.315 | 1.185 | 15 words |
| Representative / append | 0 | 0 | 35.05 words |
| Modal / chain revision | 0.645 | 4.99 | 15 words |
| All-vote sample / chain revision | 0.94 | 2.43 | 15 words |
| Representative choosing any voted word / chain | 2.03 | 0.675 | 15 words |

Append with goal-directed representatives ties in all 200 seeds: each side simply contributes five goal-aligned clauses. It gives neither side a way to undo the other. That makes it a poor competition despite a readable sentence. Modal play removes representative agency and often revisits unchanged words. Sampling is a useful probability demonstration but gives weaker intentional steering.

Allowing any voted continuation reduces unchanged turns, but it weakens the significance of crowd majorities. The top-two rule keeps the probabilities consequential. It does not make every decision difficult: when one plainly helpful and one plainly harmful word lead, the goal-aligned choice is obvious. The interest comes from which sentence position changes next and which earlier words remain.

The second-moving group has an advantage. With 15 sheets and the top-two chain policy, it wins 48.5% of runs, the first group 24%, and 27.5% tie; swapping goals gives the second group 45.5%. At 100/200, the corresponding second-mover rates are 52.5% and 55.5% with goals swapped. This is not a fair competitive scoring system yet. Swap starting roles in a second round, or present it as a shared steering demonstration rather than awarding a serious prize from one run.

No tested turn has fewer than two selectable leaders, but that does not mean every choice changes the sentence. The general chain model has 1.74 unchanged turns per run at 15 sheets and 2.76 at 100/200. The curated seed avoids them. Broader evaluation is in `trials.json`; it includes all seeds rather than rejecting inconvenient outcomes.

## Reproduction and validation

```sh
python3 paperweights/sentence-lab/trials.py
python3 -m unittest discover -s paperweights/sentence-lab -p 'test_*.py'
```

`trials.py` writes the 15/100/200 packs and embeds nine recorded demonstrations in `pack.json`. These are real transitions through the dealt pairs, not hand-written prose examples. Tests verify exact printed counts, all-key coverage, graph closure and slot reachability, ten turns with five per group, and JavaScript/Python reducer parity across all three variants and policies. `model.py` owns the data generator and simulations; `model.js` implements the same small state transition for the browser. No Rover files are used or changed.
