# Paper Weights - competing over one sentence

17 October 2026. Experimental benchmark, separate from Rover and the production word packs.

## Brief

Two groups share one sentence. Group A wants it to portray a robot as good; Group B wants
it to portray the robot as bad. Each group gets five turns in roughly five minutes. People
must use the familiar colored left token / right token-and-color lookup, with different
continuations distributed across sheets. The test is whether successive choices can
change the sentence's meaning while keeping it readable and giving both sides agency.

The original corpus cannot support this goal as printed: it lacks the robot subject and
the necessary branching vocabulary. This experiment uses an explicitly authored small
grammar and new transitions. It does not claim to learn grammar or meaning from a corpus.

## Experiment design

Compare appending clauses, revising a sentence with cues selected in a fixed order, and revising slots while
following a continuous word/color chain. Also compare modal selection, sampling actual
paper votes, and representative choice among supported suggestions. Use immutable dealt
sheets rather than generating suggestions in response to a team's goal.

The continuous-chain revision candidate preserves the lookup gesture exactly: the chosen
right token and color become the next left cue. What changes is the writing operation:
the word replaces its grammatical position in one shared sentence instead of appending
to the end. The page must make that distinction visible. This is a proposed stage-two
rule, not a claim that unchanged stage-one mechanics can do everything required.

Paper vote counts represent the assigned audience examples. They are not a live poll or
votes collected from remote people. A solo reviewer can play both representatives. A room
would supply real responses from its sheets and use its existing voting method.

## Stage rehearsal

Allow about 40 seconds to show the starting sentence and demonstrate one lookup. Give each
side five alternating turns, about 25 seconds per turn. Reserve the final 10 seconds for
reading the sentence aloud and asking the room which portrayal prevailed. Exact timing
requires a human rehearsal; simulations establish feasible legal sequences, not enjoyment.

Do not turn an authored word-valence score into an objective judge of sentence meaning.
An apparently positive verb can be bad in context. The room should judge the final meaning;
any model score belongs in benchmark diagnostics and must identify its assumptions.

## Implementation and results

See [the experiment](../paperweights/sentence-lab/README.md) for the final variant comparison,
actual ten-turn traces, paper packs, regeneration and checks. The live local page is
`/paperweights/sentence-lab/` on the repository server, port 8684.


## What the trials found

Selected for the playable rehearsal: **word-chain revision + representative choice**.
Each representative chooses among the two leading printed words, including ties. Every
chosen word/color becomes the next cue, and the corresponding verb in the sentence changes.
The starting sentence has five neutral observations. Vocabulary, object phrases and grammar
are authored scaffolding; the sheets determine the editable verbs and their continuations.
The same transition weights apply to both groups. Goals affect choices, not dealt evidence.

The final selected deal is seed 17, pack `SL1-17-15-aef34c5694`. It was deliberately selected
after rejecting a random graph with neutral loops and another example whose final two
choices left the sentence unchanged. The shipped example changes all ten turns and visits
all five positions. It is a demonstration fixture, not a random held-out performance result.

| Turn | Group | Chosen verb | Effect on the sentence |
| --- | --- | --- | --- |
| 1 | A | rescues | watches survivors becomes rescues survivors |
| 2 | B | attacks | observes the crew becomes attacks the crew |
| 3 | A | repairs | inspects the shelter becomes repairs the shelter |
| 4 | B | blocks | maps routes becomes blocks routes |
| 5 | A | shares | counts supplies becomes shares supplies |
| 6 | B | abandons | rescues survivors becomes abandons survivors |
| 7 | A | guards | attacks the crew becomes guards the crew |
| 8 | B | destroys | repairs the shelter becomes destroys the shelter |
| 9 | A | rescues | abandons survivors becomes rescues survivors |
| 10 | B | attacks | guards the crew becomes attacks the crew |

Final sentence: “The robot attacks the crew, shares supplies, destroys the shelter,
rescues survivors and blocks routes.” Its wording changes from a reasonably benign
inventory into a contested mix of constructive and destructive actions. The room judges
which actions matter more; an equal-weight arithmetic tally cannot settle that question.

The diagnostics assign protective actions +1, destructive actions -1, and observations 0.
Under that limited convention the selected trace changes lead five times. Across 200 graph
seeds with 15 sheets, representative chain revision averages 2.03 lead reversals versus
1.315 for scheduled re-cueing, 0.645 for modal chain choices and 0.94 for sampled chain
choices. Append-only play averages about 35 words versus 15 for revision and accumulates
contradictory clauses; deliberate alternating helpful/harmful additions all tie under the
simple tally. That is evidence of a weak benchmark under this rule, not a claim that humans
would judge every such sentence neutral.

Chain revision is not solved as a fair tournament: over the 200-seed diagnostic sweep,
the second mover wins 48.5%, the first 24%, and 27.5% tie under the authored tally.
Swap goals/order across replays before treating outcomes as team skill. Some other seeds
still contain unchanged moves. The prototype exposes alternatives rather than claiming
one curated demonstration proves broad reliability or enjoyment.

## Delivered and checked

The page offers all three mechanics and three decision policies, a recorded-representative
replay, optional 30-second reminder, undo/reset, full turn transcripts, and all nine recorded
comparison runs. Timer expiry never chooses on behalf of a representative. The audience
sheet viewer and downloadable 15-person PDF let a reviewer trace every option to real rows.
There is no live multi-device vote collection; the displayed tallies come from the deal.

Verified 15/100/200-person data packs and printed the 15-person pack (8 A, 7 B). Automated
checks cover graph closure, sheet-derived tallies, legal ten-turn trajectories and matching
Python/JavaScript state transitions. Root independently played the selected ten turns in
the browser through the Tailscale address, verified each count against the assigned sheets,
checked exact next-cue continuity and confirmed that every turn changed the sentence.
Screenshots reviewed include the stage and printed sheet. The print check verifies all
360 actual PDF rows, both token colors, group identity and page bounds against the live pack.

Local/Tailscale review: http://100.82.28.38:8684/paperweights/sentence-lab/
A successful request through the local Tailscale interface was verified; the user's phone
must still be connected to the same tailnet. No public hosting or Rover deployment changed.
