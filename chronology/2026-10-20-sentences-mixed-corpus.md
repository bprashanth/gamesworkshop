# Swift-style corpus and repeated sheet cues

User approved replacing the tightly authored graph with a broader mixed corpus
and Swift-style repeated matches. Live Sentences now uses RM4 from `mixed.py` and
`mixed-corpus.txt`; RM3 remains archived. All words and punctuation on either side
come from weighted corpus pairs, with a single fixed lookup color per token.

116 cues, 24 rows per person, 15/100/200 packs. Matching sheets may have multiple
rows. A random hand chooses one person then one matching row. Majority uses one
random matching row per sampled person, with no duplicate voters. Browser trace
now records exact ballots and matching-row indices for verification.

Tested neutral-passage weights 4, 8 and 12. Selected 8: at 200 people, full-room
votes reproduced intended sentences 300/300 times while random hands did so
11/300 times. Fixed 15-sheet majority was 276/300 exact; five alternative deals
were 263/300. Both 100/200 had 300/300 in each sweep. These are empirical results,
not guarantees. Each pack produced 300 distinct random 40-step chains.

Node tests verify repeated matches, one vote per person, sampled rows, exact
counts and 600 continuous chains. Browser tests exercised every starting cue,
40 random choices, sampled ballot identities, neutral paths, punctuation,
pack changes, navigation and narrow layout. Inspected random and majority
screenshots. Rebuilt the existing 8684 server tree. No PDF or Rover rules changed.

[Design, corpus provenance and reproducible commands](../paperweights/robot-majority/MIXED.md).
