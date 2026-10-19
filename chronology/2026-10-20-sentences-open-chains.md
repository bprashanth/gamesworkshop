# Sentences - choose any first cue and keep chaining

User requested arbitrary first words, random nonsense like the Swift game, and
punctuation matching the original sheets. Inspected `paperweights/generator.py`:
its tokenizer includes `. , ! ?` and it forms circular token pairs.

RM3 changes the authored transition graph: minority edges can go backwards,
repeat, cross narratives and reach punctuation. Every punctuation cue has outgoing
sheet rows. Removed the browser stop at full stop. The starting selector now
contains all 46 actual word/color cues, grouped with the three suggested openings
first. Reset retains the chosen cue. No invented out-of-vocabulary starts.

The neutral full-room majority routes and 24-row format remain. No PDF generation
or Rover/Households rule changes. Data remains explicitly authored.

Validation: 900 full-room majority runs match the intended routes without ties.
Each pack gives 300 distinct random 40-step chains, with all punctuation tokens
observed. All 46 starting cues survive 100 random steps per pack size. Exact-vote
Node tests cover 600 further 40-step chains. Playwright exercises every start,
punctuation continuation, sampled ballot IDs, majority routes and narrow layout.

See [current model and commands](../paperweights/robot-majority/BRANCHING.md).
