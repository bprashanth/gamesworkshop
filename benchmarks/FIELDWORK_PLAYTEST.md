# Fieldwork playtest record — 2 October 2026

Run both independent loops with `python3 play.py`. The first remains frozen at
`idlisseus-v0-first-cut`. Fieldwork can also start with `python3 -m fieldwork`.

## What the loop asks

Can the player get eight of twelve cases to a service in seven shifts? The AI
prepares batches in one lane; a worker handles one case of any kind. Service
capacity, deadlines and connection determine whether preparation helps now.
Moving the AI once costs a shift, making a closure a useful reconfiguration
window. Today's exact results and tomorrow's conditions are visible.

The intended pleasure is a small plan coming together: anticipate an outage,
save an urgent case, carry prepared work into an open day, or recover from a
poorly matched desk. The player has two regular actions and one single-use
move. A larger immediate batch can sacrifice a deadline elsewhere.

## Manual terminal passes

| Run | Initial desk | Actions by shift | Reached | Decision observed |
| --- | --- | --- | --- | --- |
| Chennai point `13.08,80.27`, sanitation, seed 9 | Records | A B B B R A B | 9/12 | Used the connected opening, worker through outage, then changed desk during closure. Three prepared explanations exceeded two service places; the remaining case carried into the final shift. |
| Bangalore, birth registration, seed 11 | Records | R A A B A B B | 9/12 | The starting queue favoured explanations. An immediate move recovered the mismatch. Offline batching helped; later human work was necessary. Two record cases and one field case missed their window. |

Development also included complete Udaipur/Puri runs and direct CLI demos.
The recorded [Chennai](fieldwork-manual-chennai.json) and
[Bangalore](fieldwork-manual-bengaluru.json) decisions were replayed against
the final engine; every preparation, delivery, expiry and score matched.
The manual passes prompted clearer worker case labels, separate explanations
for missed preparation versus missed service, removal of empty final turns,
and skipping work that today's closed counter makes impossible to complete.
The final command-line tests exercise a full run and same-week replay.

## Final balance audit

Reproduce with `python3 -m fieldwork.simulate --seeds 500`.
Exact results: [fieldwork-balance.json](fieldwork-balance.json).

500 seeds × four real district/problem pairs × two starting desks = **4,000
conditions**. Each condition has four public-information policy playthroughs
and a separately labelled full-world solver check. Generation independently
rejects worlds without a winning plan from both initial desks; it uses a
bounded deterministic retry, preserving identical worlds between desk choices.

| Policy | Pocket guide wins | Records desk wins | Meaning |
| --- | ---: | ---: | --- |
| Worker only | 0% | 0% | One preparation per shift reaches seven, below the deliberate eight-case target. |
| AI only | 0% | 0% | Batching one lane leaves other work behind; no AI lane contains eight cases. |
| Immediate gain | 87.0% | 87.9% | Chooses today's visible gain without planning the next shift. |
| Public forecast planning | 97.3% | 97.7% | Uses only the public observation and next-shift forecast. |
| Full-world solver | 100% | 100% | A feasibility ceiling with privileged future information; never a player hint. |

Across 2,000 paired worlds, the best possible guide score exceeds the reader
score in 629, the reader exceeds the guide in 614, and 757 tie. Both have a
9.533 mean optimal score. Public planning averages 8.961 with either desk.

These numbers show that planning has value and the initial kit does not
determine the result. The deliberately impossible single-action baselines are
properties of the puzzle's target, not discoveries about AI or staffing in
the real world. A high automated win rate does not prove the game is fun.

## Verification and next test

The final suite contains **114 tests**, covering the frozen first game, both
entry points, source data integrity, precision flags, geography and historical
contexts, deterministic mechanics, feasibility, consequence previews, endings,
replays, logs, narrow terminals and clean exits. All passed.

For a first human pass, play one run without looking at this report. Observe:

1. Can the player explain why a prepared case has not scored?
2. Does tomorrow's closure or connection change today's choice?
3. Is losing a case understandable from the preview?
4. Does the player want the same week with the other kit?

Current limits: four authored service stories share one queue engine; source
figures are historical district estimates; some place-to-survey mappings need
explicit selection. Game conditions and scenes are invented and do not predict
a local intervention's effects. No external human playtest has happened yet.
