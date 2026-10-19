# Majority words -> robot sentence -> audience pivot

Current rehearsal: [RM3 open word chains](../paperweights/robot-majority/BRANCHING.md) supersede the constrained RM1 corpus described below. All sheet cues can now start a chain, including punctuation. Random chains loop and cross narratives; the three suggested openings retain neutral majority paths.

19 October 2026. Pre-print feasibility test. Household rules and the existing print snapshot are unchanged. No new PDFs have
been generated. The later Sentences rehearsal is described below.

## Recommendation

Use an original, deliberately constrained robot micro-corpus with context-colored
word states. Take one vote per matching person and append the winning word/color.
Stop at the full stop. Then highlight the action verb and invite everyone to
submit one replacement action verb. This final edit is a distinct activity, not
the next lookup operation.

This succeeds at the specific sentence-generation task. It does not show that
an arbitrary natural-text corpus with majority bigram voting produces grammatical
sentences. The intended framing lesson still needs a human rehearsal.

## Versions actually played

1. Existing literary-blend corpus, majority next-word voting. Six of seven tested
   starting words loop. Examples include `the boy in the ...` and `I saw the boy
   saw ...`. The terminating `pale blue eye ?` is not a complete sentence. The
   baseline also tested actual 15/200 decks and the ambiguity of multiple matches
   on one sheet. Old colors are assigned per word and add no grammatical context.
2. Original robot corpus, word-only voting. It stops at `one night the harbour.`
   The repeated word `the` mixes incompatible contexts, producing a fragment.
3. The same robot corpus, context-colored voting. Full-room majority produces:

   > One night the old man found his robot checking every boat by the harbour.

The new corpus has 600 original synthetic examples built from an authored sentence
frame with alternatives at most positions. It is not a scraped robot novel or a
claim that the audience learns syntax from raw prose. The grammar gives each
color/word a permitted prefix phase. Colors distinguish, for example, `the`
before the person, object and place. Six colors are reused where the word plus
color remains unambiguous; colors are not unique token identities.

## Actual deal and simulation results

Every sheet has 24 rows in the familiar two-column format. There are 35 distinct
left word/color cues across the pack, and each appears at most once per sheet.
That makes one matching person exactly one vote. Rows are sorted by color rather
than sentence order; right-word colors lead to the next left lookup.

| Sheets | Responders per main-path cue | BLUE robot votes | Complete grammatical majority runs |
| --- | --- | --- | --- |
| 15 | 10-11 | checking 6, fixing 2, sinking 1, painting 1 | 100/100 |
| 100 | 68-69 | checking 38, fixing 12, sinking 9, painting 5, counting 4 | 100/100 |
| 200 | 137-138 | checking 76, fixing 24, sinking 18, painting 11, counting 8 | 100/100 |

The 100 runs per size vary the deal seed and which cues get the extra responder.
The underlying authored corpus is fixed, and counts are stratified with largest-
remainder allocation. These are not 100 independent natural-language corpora. The
same full-participation majority sentence wins at all three sizes, with no ties.
Winning main-path shares exceed 50%, not merely plurality.

Sampling from the actual sheet votes also produced 100/100 grammatical completions
at each size. Some examples from the 15-sheet tests:

- One evening the old man found his robot painting every boat by the harbour.
- One night the old sailor found his robot sinking each boat by the harbour.
- One night the old fisherman noticed his robot checking every boat by the harbour.
- One evening the old man found his robot fixing every boat near the river.

With each matching voter independently participating with probability 0.5, all
100 tested runs per size still completed within the grammar. The original majority
sentence remained unchanged in 32/100 runs at 15 sheets,93/100 at 100 sheets, and 100/100
at 200 sheets. Small groups had many ties, so the facilitator needs a declared tie
rule. Tests use alphabetical cue order; choosing either tied supported option
still preserves grammar. These trials do not guarantee turnout in a real room.

No individual sheet in the three seed 42 demo deals could complete its own chain
from `one`. The observed longest individual chains were 5,11 and 13 transitions at
15/100/200 respectively. This gives distributed lookup work and competing words,
not a complete printed script. It does not prove people will find the puzzle hard
or fail to guess the subject; that requires rehearsal.

## Why completion is reliable

The code audits every observed transition, not only the winning trace. Each
allowed edge advances exactly one grammar phase. Every path includes `robot` and
reaches the period after 14 transitions from `one`. The period has a reset edge for
closed paper coverage, but the game stops before following it.

The authored frame permits 32,805 word combinations. Compatibility is established
by its vocabulary and positions, not by an external grammar judge. Examples use
singular objects with `every/each/the` and compatible -ing action verbs. This is
a constrained next-token demonstration, not unrestricted language generation.

## The pivot and the lesson

Generate the whole sentence first. Highlight `checking`, then say: "Replace this
with one action ending in -ing." `fixing` and `sinking` both fit, but do not show
those examples before asking if you want less additional framing. An arbitrary
word such as `kind` will not fit this slot, so unconstrained free text cannot
retain the grammar guarantee.

An invented 15-person ballot of fixing 7, sinking 5, checking 3 yields:

> One night the old man found his robot fixing every boat by the harbour.

These ballots are a worked example, not real audience responses. Count one ballot
per person. Most votes wins is a property of that voting rule; it is not evidence
that anyone should be permitted to spam repeated submissions.

A separate paired corpus test changed only the authored action weights toward
`sinking`, using common random draws for other words. The 200-sheet majority then
became:

> One night the old man found his robot sinking every boat by the harbour.

This cleanly illustrates data weighting in this toy generator. It should be kept
separate from the live free-text ballot, which demonstrates human editing and vote
aggregation. Neither establishes that sheer data volume always determines real
LLM behavior.

The prefix constrains what answers make sense and may frame people's suggestions.
But one room answering one prefix does not prove psychological priming. A stronger
comparison would give two groups different prefixes with the same verb slot and
collect their answers independently, or collect unframed responses before showing
the sentence. Even `checking` is not perfectly neutral: it can imply monitoring
or helpful maintenance depending on the audience.

## Timing and next print work

Fourteen word choices at 8-10 seconds each is roughly two minutes. Allow another
minute for pivot submissions and a minute for interpretation. These are estimates,
not observed human timings. Sampling can be shown once before the majority replay
if the facilitator wants to make the role of the selection policy visible.

Do not reuse the paused good-robot/bad-robot slot revision mechanic. Here every
lookup appends exactly the chosen next word. The final highlighted-word edit is
explicitly separate and uses the audience's own submissions.

The proposed physical artifact remains words on the front and Household lookup
on the back. Household votes will need a separately validated encoding matching
its cumulative evidence and team assignments. No Household reverse side has been
constructed or claimed compatible by this word experiment. No PDFs until the
word mechanic and Household lookup encoding are ready.

## Files and reproduction

- [Lab README](../paperweights/robot-majority/README.md)
- [Original-corpus baseline](../paperweights/robot-majority/baseline.py)
- [Corpus, deal, simulations and invariants](../paperweights/robot-majority/experiment.py)
- [One actual 24-row sheet](../paperweights/robot-majority/sample-sheet.md)
- [Existing print renderer](../paperweights/generator.py)
- [Paused sentence experiment](SENTENCE_BENCHMARK.md)

Run both scripts from the lab README. Full corpus, actual deals, baseline traces,
per-turn vote traces and sweep statistics are reproducible in the ignored
`paperweights/robot-majority/out/` directory. No existing server was restarted.

## Playable Sentences rehearsal

Now available from the shared Rover/Households/Sentences selector at
`http://100.82.28.38:8684/paperweights/web/sentences.html`. It uses the same authored
corpus and actual 15/100/200-sheet deals tested above. No map or pivot editing is
included in this simple chaining rehearsal.

Next word picks one matching person. Majority word samples the requested number
of matching people without replacement, capped by available matches. Leave the
input empty for all matching people. It appends the winning next word/color,
with alphabetical ties. Reset starts again from RED one; the full stop ends play.

An optional Last draw detail exposes counts and voter sheet IDs. The normal view
only shows the chain, current cue and controls. It uses the game's dark/light
palette. The common site build reproduces the source deals, so no manually
maintained large pack copies are required in Git.
