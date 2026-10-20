# Good Robot / Bad Robot - experiment handoff

**Start here.** This is the canonical handoff for the paused Paper Weights sentence
benchmark. It is separate from the current Rover/Households game. Read this first,
then follow the implementation and results links below.

**Status:** paused at the user's request on 17 October 2026. The prototype worked
mechanically, but its lookup/edit rule was too confusing for a short workshop.
Do not treat its former recommendation as an approved next design, or restart it
on the current Rover server without a new request.

## What we wanted to test

Build a second stage after the Swift-style word lookup exercise:

- Split the room into two groups. A wants a sentence portraying a good robot;
  B wants a sentence portraying a bad robot.
- Alternate five turns each, approximately five minutes total.
- Retain the familiar paper format: match a left word + color, report the right
  word + color. Different sheets contain different continuations.
- Pool the active group's responses, then select a continuation. The sentence
  should remain readable while its meaning swings between the two agendas.
- Eventually explore how missing public-interest data could narrow the stories
  a model tells. That lesson was an aspiration, not an implemented finding.

The existing Swift word corpus did not support this task. The experiment therefore
uses a new, deliberately authored vocabulary, grammar and transition graph.

## What actually exists

The app starts with:

> The robot observes the crew, counts supplies, inspects the shelter, watches
> survivors and maps routes.

Five editable verb slots describe crew, supplies, shelter, survivors and routes.
Each slot has one protective verb, one destructive verb and two observational
verbs. The nouns and connecting grammar are fixed by the program.

Every participant has 24 immutable lookup pairs, covering 20 verbs and four
starter keys. The usual first key is `PURPLE:robot`. Both groups use the same
underlying transition distribution; their assigned goals change their choices,
not the distribution they receive. The screen simulates each group's votes by
counting its actual dealt rows. It does not collect live audience votes.

Colors identify the authored sentence roles. They do not encode household
history, hidden hazards or the contexts used by the later Rover experiments.

## Three variants, in plain language

| Variant / code ID | What happens after a choice | What happens next |
| --- | --- | --- |
| Edit and follow the new word / `chain` | Replace the verb in the chosen word's assigned sentence slot | Look up the chosen word + color |
| Edit and follow a set order / `scheduled` | Same replacement rule | The app chooses a cue from a fixed rotation of sentence slots |
| Keep adding to the sentence / `append` | Append another action clause, retaining earlier clauses | Look up the chosen word + color |

The scheduled slot supplies the lookup cue; it is not necessarily the slot that
gets edited. Append mode supplies its nouns and connecting text from the fixed
frame too. Neither variant generates unrestricted language.

Each variant supports three selection policies:

- **Representative:** choose among the two highest-count continuations, including
  ties. This was the preferred playable demonstration before the pause.
- **Majority:** choose the highest-count continuation automatically.
- **Sampling:** sample all positive-count continuations, including minority ones.

The app also has recorded representative replay, comparison traces, undo/reset,
a sheet viewer and an optional timer. Timer expiry does not choose a word.

## The central problem - why we paused

A lookup cue is not necessarily the word being replaced. For example:

`PURPLE robot -> GREEN rescues`

This changes **watches survivors** to **rescues survivors**. It does not replace
“robot.” The next lookup is then `GREEN rescues`, whose continuations may edit
another part of the sentence.

This preserved the right-word -> next-left-word chain, but added an unrelated
slot-editing rule. It was chosen to keep one short sentence changing across
turns. It is **not technically required by language modelling**, nor a faithful
illustration of ordinary next-token generation. Calling it the exact Swift
mechanic overstated the continuity.

The user first requested clearer red old-word / green replacement previews.
Those were implemented, including hover/focus targets, persistent struck-out
old words and explicit no-op notices. A phone then displayed mixed cached
versions; cache-busting assets and no-store server headers fixed that issue.
However, visual clarification did not resolve the conceptual confusion. The
user asked to checkpoint the experiment and return to Rover.

## What the recorded trials showed

The selected rehearsal is seed 17, pack `SL1-17-15-aef34c5694`, split 8 A / 7 B.
It was **curated**, not a held-out performance result: all ten choices change the
sentence and all five slots are visited.

| Turn | Group | Edit |
| --- | --- | --- |
| 1 | A | watches -> rescues |
| 2 | B | observes -> attacks |
| 3 | A | inspects -> repairs |
| 4 | B | maps -> blocks |
| 5 | A | counts -> shares |
| 6 | B | rescues -> abandons |
| 7 | A | attacks -> guards |
| 8 | B | repairs -> destroys |
| 9 | A | abandons -> rescues |
| 10 | B | guards -> attacks |

Final sentence:

> The robot attacks the crew, shares supplies, destroys the shelter, rescues
> survivors and blocks routes.

A diagnostic tally assigns protective verbs +1, destructive verbs -1 and neutral
verbs 0. Under that authored convention, the selected run changes lead five
times. This is not an objective measure of sentence meaning; the audience should
judge the wording.

Across 200 graph seeds with 15 sheets, representative chain revision averaged
2.03 lead reversals and 1.74 unchanged turns. Majority chain averaged 0.645
reversals; sampling averaged 0.94. Append play accumulated opposing clauses and
goal-directed runs tied under the tally. The second mover won 48.5% of chain
representative runs, the first 24%, with 27.5% ties. These results do not establish
fairness or human enjoyment. See the [full results and sentence traces](../paperweights/sentence-lab/RESULTS.md)
and [machine-readable comparisons](../paperweights/sentence-lab/trials.json).

## What it can teach, and what it cannot

The implemented game demonstrates selection and steering: available examples
limit the suggestions, while a representative's agenda affects which suggestion
is selected. Because both groups draw from the same underlying distribution,
it does not isolate source bias or demonstrate the effect of removing NGO data.
There is no implemented collusion mechanism. Grammar and moral labels are authored,
not learned.

The user's desired message was roughly: if NGOs stop contributing data, important
perspectives can disappear from model-generated stories. A more direct follow-up
would hold the task and selection policy fixed, compare all sources against one
source omitted, then restore that source. First inspect how counts change for one
cue; only then compare complete sentences. Use attributed synthetic sources with
mixed observations, rather than defining NGO as truth and every other source as
falsehood. For sampling, compare many paired runs.

**That source-withdrawal experiment is proposed, not built.** It would demonstrate
an effect in this toy system, not prove a causal effect on real LLMs. Public data
must actually enter a model's training, updates or retrieval to affect it; an
already-trained model does not automatically forget old evidence when publishing
stops. Separate data coverage from a selector's agenda when designing the next test.

## Where to look

All implementation lives in [paperweights/sentence-lab/](../paperweights/sentence-lab/).

| File | Purpose |
| --- | --- |
| [README.md](../paperweights/sentence-lab/README.md) | Local operation, printing and known limits |
| [model.py](../paperweights/sentence-lab/model.py) | Authored grammar/graph, immutable sheet generation, simulation and scoring |
| [model.js](../paperweights/sentence-lab/model.js) | Browser state transitions corresponding to the Python model |
| [app.js](../paperweights/sentence-lab/app.js) | Interaction, vote displays, diff previews, replay and comparison UI |
| [index.html](../paperweights/sentence-lab/index.html), [style.css](../paperweights/sentence-lab/style.css) | Page and visual styling |
| [pack.json](../paperweights/sentence-lab/pack.json) | Default 15-person rehearsal deal and nine recorded demonstrations |
| [pack-15.json](../paperweights/sentence-lab/pack-15.json), [pack-100.json](../paperweights/sentence-lab/pack-100.json), [pack-200.json](../paperweights/sentence-lab/pack-200.json) | Generated audience-size variants |
| [trials.py](../paperweights/sentence-lab/trials.py) | Regenerate deals, demonstrations and comparison sweep |
| [RESULTS.md](../paperweights/sentence-lab/RESULTS.md), [trials.json](../paperweights/sentence-lab/trials.json) | Readable findings and full diagnostic output |
| [build_sheets.py](../paperweights/sentence-lab/build_sheets.py) | Swift-style print renderer and row/color verification |
| [test_model.py](../paperweights/sentence-lab/test_model.py) | Model invariants and Python/JavaScript parity checks |
| [playtest.mjs](../paperweights/sentence-lab/playtest.mjs) | Browser checks for diffs, controls, variants and replay |
| [Original chronology](../chronology/2026-10-17-sentence-benchmark.md) | Development, cache fix, user feedback and pause decision |

Generated PDFs belong under `paperweights/sentence-lab/printouts/<pack-id>/`;
screenshots belong under `paperweights/sentence-lab/out/`. These local output
folders may need regeneration. Do not substitute Rover sheets for this experiment.

## Inspect or reproduce without disturbing Rover

The current port 8684 server serves the assembled Rover/Households site and does
not include the sentence lab. Old 8684 sentence links in historical records are
stale. To inspect this experiment on a separate port, from the repository root:

```sh
python3 paperweights/serve.py --port 8686 --bind 0.0.0.0
```

Then visit `http://100.82.28.38:8686/paperweights/sentence-lab/` over Tailscale,
or `http://localhost:8686/paperweights/sentence-lab/` locally. This command is
provided for the next agent; no sentence server was started for this handoff.

```sh
# Read-only model checks
python3 -m unittest discover -s paperweights/sentence-lab -p 'test_*.py'

# Regeneration overwrites deals and comparison output
python3 paperweights/sentence-lab/trials.py

# Optional print generation after regenerating the matching pack
paperweights/.venv/bin/python paperweights/sentence-lab/build_sheets.py --pack paperweights/sentence-lab/pack-15.json
```

The existing browser test hard-codes port 8684. Point its navigation at the
separate sentence server before running it; do not take down Rover to satisfy
that old test URL. Changing the seed changes the graph as well as the deal.

## Brief for the next agent

Investigate a simpler five-minute, two-group sentence game that preserves an
intelligible relationship between the cue, the choice and the sentence change.
Do not assume the paused slot-editing rule is a requirement. Treat the current
code as a benchmark and reusable paper-distribution machinery. Distinguish
implemented observations from proposed NGO-source experiments, and do not
modify or restart the current Rover/Households game as part of this investigation.
