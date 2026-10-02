# Phase 1 playtest

## Original rules: a real design defect

The original rules were tested on the **same 2,500 shuffled deals**, seeds 1–2,500. Full results are in [reports/original-rules.json](reports/original-rules.json).

| Policy | Completed | Mean cost, completed stacks only |
|---|---:|---:|
| Strategic + signals | 2,494 / 2,500 | 6.5397 |
| Strategic, no signals | 2,494 / 2,500 | 6.5397 |
| Strategic cards, random suit order | 2,494 / 2,500 | 6.5397 |
| Strategic cards, fixed suit order | 2,494 / 2,500 | 6.5397 |
| Random legal cards + calls | 2,423 / 2,500 | 8.7866 |

Every completed strategic game had **exactly the same cost** with or without signals, or with any of the tested order policies. All six failures were deals with a whole suit missing. A separate preservation policy, without signals, reached the minimum cost present in the original deal on every completable game. Forced-first-suit forks on 500 deals changed no outcomes.

This is structural, not a matter of needing smarter bots. Before each trick, a player's hand size equals the number of unbuilt suits. If they cannot follow the called suit, their cards occupy fewer unbuilt suits than they have cards. They therefore always have a card from a built suit or a duplicate from an unbuilt suit to discard. Keeping the cheapest card from each unbuilt suit is always possible. Every original suit minimum survives, whatever the Commander calls. Communication cannot improve that optimum.

In 50 simulated rooms of 50 tables, every qualifier scored the perfect 5, and 49 rooms needed a random draw at the fifth-place boundary. Perfect play turns qualification almost entirely into deal luck and the required random draw. Rank 1 accounted for 9,400 of 12,470 installed cards; rank 5 appeared only 11 times.

## One rule changed: highest called card installs

The playable version changes **only the winning rank: the highest card of the called suit installs**, instead of the lowest. The objective remains the cheapest complete stack. Follow suit, free off-suit discards, five cards, five tricks, Commander succession, one signal, deck, and qualification scoring stay intact. Equal ranks go to the first card played; an absent called suit ends with an incomplete stack, which cannot qualify. These clarify previously unspecified edge cases.

This turns expensive cards into things the crew wants to discard before their suit is called. A cheap signal says, “I can cover this part while you shed expensive copies.” It gives partners a reason to wait before calling that suit. The original rule remains reproducible with `simulateGame(seed, { winner: 'lowest' })`.

| Revised policy, same 2,500 deals | Completed | Mean completed cost |
|---|---:|---:|
| Strategic + signals | 2,494 | **16.9214** |
| Strategic, no signals | 2,494 | 20.1740 |
| Strategic cards, random suit order | 2,494 | 17.7069 |
| Strategic cards, fixed suit order | 2,494 | 17.8236 |
| Random legal cards + calls | 2,439 | 21.1751 |

Signals save **3.2526 cost** on paired complete games: 2,096 improve, 398 tie, none worsen in this sample. Strategic suit order beats random order by **0.7855** on average, winning 1,215 deals, tying 683, and losing 596. This is useful rather than perfect strategy. Completion remains 99.76%; the six strategically failed games were impossible deals missing a suit.

A first-call fork test reran 500 identical deals five times, forcing each possible first suit while preserving the policy and seeded randomness afterward. **477/500 deals changed outcome.** Across the 499 deals whose branches all completed, the mean best-to-worst spread was **3.3587 cost**. This confirms a real order decision rather than a difference caused only by shuffling fresh deals.

**Concrete replay: seed 1.** Calling DATA first finishes at **16**; calling TOOLS first finishes at **20**. With DATA called first, three players can immediately discard costly off-suit cards: TOOLS 5 and two COMPUTE 5s. COMPUTE eventually installs at 2 and TOOLS at 4. Calling TOOLS first installs its 5 immediately; one COMPUTE 5 survives to install later. The report includes the full initial deal, public signals, and every trick for all five branches, for retrospective audit.

## Iteration record

1. **Original lowest-wins rules:** preserve-minimum strategy proves order and communication irrelevant. Archived full report.
2. **Highest-wins rule:** first revised policy made signals save 0.9182 cost, and first-call order changed 417/500 deals, but its suit-choice heuristic was worse than random order by 0.2173. Saved [revised-first-pass.json](reports/revised-first-pass.json); did not call that heuristic successful.
3. **Bot improvement, no further rule change:** delay cheap publicly covered suits, allowing partners to discard expensive cards first. When a cheaper partner card is publicly known, discard the costly card before a dead built-suit card; the dead card can safely absorb a later discard. This produced the final figures above. Bots remain basic, local-information heuristics.

## Distribution, luck, and event implications

Final installed rank counts are 1: **1,339**, 2: **1,960**, 3: **2,865**, 4: **3,182**, 5: **3,124**. Complete totals range from 7 to 25. Every rank now appears meaningfully, exposing the full card progression instead of almost only the cheapest options.

Suit means range from 3.28 (MODEL) to 3.48 (COMPUTE). The suits have identical mechanics; fixed tie ordering when choosing equally cheap signals favors earlier suits. This is a bot policy bias, not evidence of different suit powers. Install wins range from 2,626 for seat 0 to 2,340 for seat 4, partly reflecting the starting Commander and first-played tie rule. The report retains all seat and suit counts.

Deal luck still matters. The initial deal's conservative cost (sum of the highest personal minimum in each suit) correlates **0.6052** with final strategic cost. Signals and order improve that initial situation substantially, but a five-trick game cannot erase a bad deal. The original minimum available anywhere is a weak lower bound for highest-wins and should not be mistaken for an achievable optimum. No optimal-policy claim is made.

For 50 rooms of 50 independent tables, revised qualifying costs range **7–14**, and the fifth-place boundary ranges **10–14**. Thirty-three rooms need the specified random boundary draw. This remains a quick, noisy qualifier; one game is not a reliable ranking of team skill. There are no added points or tiebreak statistics.

## Method and limitations

The random baseline samples legal cards and unbuilt calls. Strategic bots use only their own hand, visible signals, played/discarded cards, built stack, and Commander/turn state. Hidden deal information is used retrospectively by the reporting code to measure the available minimum; it is not an input to any bot policy.

Scores are recorded **only for complete five-part stacks**. Failure counts and paired comparisons accompany conditional means. Room qualification filters to complete stacks, sorts solely by total cost, and uses a seeded random shuffle within ties. There is no extra tiebreak score.

Five tricks keep sessions short. Bot experiments can demonstrate decision consequences and catch broken mechanics, but cannot establish that a group of humans finds the game fun. The browser's clarity and pacing require direct visual/manual testing; human group replay interest remains an event test.

Reproduce: `node crew/simulate.mjs --games 2500`. Final machine-readable results: [reports/simulation.json](reports/simulation.json). Qualification checks: `node --test crew/simulation.test.mjs`.

## Browser playtests and visual iteration

The final browser pass used real clicks on visible controls, not injected game-state changes. A complete human-seat game on seed 1 finished at **16** (MODEL 4 + DATA 1 + TOOLS 4 + VERIFICATION 5 + COMPUTE 2). It used a truthful DATA 1 LOWEST signal, followed suit, discarded when void, reviewed each trick, and reached all five installed parts. The same-deal replay restored all five cards and the signal token.

An automated five-seat demonstration also completed all five rounds. Reset was exercised while bot timers were active. The impossible seed 175 was tested by calling VERIFICATION, which was absent from the deal: all five cards were marked as discards, the ship ended incomplete, and neither a total nor a qualifying score was invented. The final round history remained readable.

Screenshots were captured and visually inspected at desktop, **1366×768 projector**, and **390px phone** sizes. Iterations fixed overlapping seats that obscured signals, enlarged suit labels, explicitly labelled off-suit DISCARD cards, showed the human signal persistently, and moved signal selection into the command strip so the hand remains visible on a projector. Both ordinary and signal-mode hands fit at projector size. The phone hand scrolls horizontally; the page itself does not overflow horizontally. A phone needs vertical scrolling, while desktop is the intended table experience.

Fifteen engine/qualification tests pass. The final browser run records no JavaScript or console errors; machine-readable checks are in [reports/browser-qa.json](reports/browser-qa.json). Screenshots 01–12 in [screenshots/](screenshots/) cover the first deal, rules, signal, legal play, trick result, complete stack, projection, mobile, AI demo and incomplete stack.

The game now offers observable tradeoffs and a short, inspectable loop. These are agent-operated browser playtests, not a claim of enjoyment measured with a human group. The next useful event observation is whether players want to replay the same deal after seeing where expensive cards survived.

## Latest iteration: monochrome ASCII and one signal

The room-test UI has been deliberately reduced to ASCII card borders, installed parts, five play slots, the human hand, signals and necessary actions. It has no artwork, colored suits, hidden-hand graphics, tutorial, demo button, slogan or decorative text. A legal hand card is played with one click. Old screenshots and sections above describe the previous checkpoint; current evidence uses `screenshots/ascii-*.png`.

The only communication is now **LOWEST in this suit**. Selecting a singleton or either copy of equal minima is truthful. No separate ONLY or HIGHEST option exists in normal play. `signalMode:'classic'` remains for historical comparisons, while human play and simulations default to the single meaning.

This is enough for the current objective: a cheap signal reveals a replacement for an expensive card a partner might discard. The highest-wins bot policy never needed the extra ONLY/HIGHEST label. On 2,500 paired seeds, **all complete play histories and scores matched exactly** between single and classic signals. Both completed 2,494 deals at mean 16.9214, versus 20.1740 without signals. See [reports/single-signal.json](reports/single-signal.json). This is evidence for simplifying this mission's communication, not a claim that LOWEST is universally optimal for every future mission.

The ASCII browser pass completed the five-round human-seat game at cost 16, exercised the single signal, legal-card restrictions, same-deal replay, reset during bot timers and seed 175's missing suit. All visible text was ASCII; no graphics or card-back elements remained. Screenshots were inspected at 1366x768 and 390px. Cards fit the projector viewport in both normal and signal modes. Seventeen engine/qualification tests pass and the browser report records no console/page errors: [reports/browser-ascii-qa.json](reports/browser-ascii-qa.json).

## Current interface: minimal Game Boy table

Following room-readability feedback, the live game restores suit colors, large-rank cream cards, a green table and all three classic signals. The ASCII implementation is preserved as an earlier checkpoint. Current screenshots are `gameboy-*.png`. The installed stack and call buttons are separate. Only relevant actions appear; there are no card backs, help menus or demo controls.

The winner remains the highest card **in the called suit**; lowest total is still the cooperative goal. This retains the order/discard decisions established by the earlier experiments. The interface explicitly marks off-suit cards as Discard, and the card to install as Install.

The browser test exercised each of LOWEST, HIGHEST and ONLY, verified false labels are disabled and a used signal cannot be repeated, completed five rounds at cost 16, tested reset during bot action, replayed the deal, and handled the impossible seed without a score. Seventeen engine/qualification tests pass. Projector hand bounds are 717px within 768px; phone rows scroll without page overflow. See [reports/browser-gameboy-qa.json](reports/browser-gameboy-qa.json).
