# Rover Run blind playtest notes

Highest score: **19** in run 6.

## 1. Run-by-run log

- **Run 1 — score 4; ended at row 3 in sand.** I started casually, sampled at rows 1 and 2, and drove into every card. After two harmless rows, sand killed the run outright despite plenty of battery.
- **Run 2 — score 7; ended at row 5 in a storm.** I trusted the remembered cards, sampled the first three rows, avoided the known sand at row 3, and recharged before exploring row 4. I then drove into the unknown row 5 and learned that storms are also instant failures.
- **Run 3 — score 6; ended at row 7 in sand.** I stopped chasing samples and used recharges to explore farther. I avoided rows 3 and 5, safely tested row 6, then drove into another sand card at row 7.
- **Run 4 — score 7; ended at row 8 in a storm.** I avoided rows 3, 5, and 7, recharging along the way. Row 8 looked like a terrain transition on the map, but it was a lethal storm.
- **Run 5 — score 17; finished.** I avoided all four known lethal rows (3, 5, 7, 8), spent all six stops on conservative recharges, and tested the remaining unknown rows. Rows 9–12 each cost one battery; rows 13–14 cost none. Finishing added 3 points.
- **Run 6 — score 19; finished with 1 battery.** I optimized the known route: sampled at rows 1 and 2, avoided rows 3, 5, 7, and 8, and recharged only at rows 4, 5, 7, and 8. This used all six stops and left exactly enough battery for the four one-battery rows near the end.

## 2. Believed rules and patterns

- **Each completed row scores 1 point, whether I drive or avoid.** Confidence: very high.
- **Sampling costs one stop and adds 1 point without changing battery.** Confidence: very high.
- **Recharging costs one stop and adds 2 battery, apparently capped at 8.** Confidence: high.
- **Avoiding costs 2 battery and safely bypasses whatever the card contains.** Confidence: very high.
- **Driving into `ground: sand` or `dust: storm` ends the run immediately, regardless of battery.** Confidence: very high.
- **Nonlethal cards apply the displayed battery value, which was either 0 or -1 on this route.** Confidence: very high.
- **Slope, ground, and dust labels mostly describe the map/card, while the separate battery row states the actual ordinary energy cost.** Confidence: medium-high.
- **The 14 cards are fixed across replays of a sol, and prior discoveries stay visible in later runs.** Confidence: very high.
- **Finishing all 14 rows adds 3 points.** Confidence: very high.
- **A “new sol” keeps the route but changes weather.** Confidence: medium; the finish screen says this, but I replayed the same sol and did not test a new one.
- **There is no simple alternating lethal-row pattern.** Sand appeared at 3 and 7; storms appeared at 5 and 8. Confidence: high.

## 3. How I used the map

Early on I watched the current numbered waypoint, route shape, contour spacing, color change from blue to brown, and small gold-speckled areas. I trusted sparse blue contours at rows 1–2 and expected low costs, which was broadly right. I wrongly trusted similar-looking blue terrain at rows 3 and 7; both concealed sand.

At rows 8–12 I used the dense brown contours to predict steeper terrain and battery drain. That correctly anticipated steep cards around rows 10–12, but the drain was only -1 each. The map did not help me distinguish an ordinary difficult segment from an instant-kill storm at row 8.

After cards had been revealed, I trusted the card grid much more than the map. The map remained useful for following progress and making thematic guesses, but not for making safe hazard decisions.

## 4. Confusing, unfair, boring, and fun moments

- **Confusing:** “real terrain + route · simulated hazards” sounds meaningful, but I could not tell which visual marks represented actionable danger.
- **Unfair:** The first encounter with sand or storm is an instant loss with no clear advance warning. Avoiding every unknown row is not viable because it costs battery, so early deaths feel forced rather than earned.
- **Confusing:** Slope can say `steep` while the actual battery loss is still only -1. I initially expected card attributes to combine into a larger cost.
- **Confusing:** The finish screen advertises keyboard choices for replay and a new sol, while the provided CLI only exposes `./play new`; that command replayed the same sol.
- **Boring:** Repeating the already-solved first half just to expose one later card became mechanical by runs 4 and 5.
- **Fun:** Persistent card knowledge turned failures into useful information. Planning the final run so four recharges and two samples consumed exactly six stops, finishing on one battery for 19 points, was satisfying.
- **Fun:** The route drawing, rover animation, card symbols, and battery trace gave the run a strong expedition feel.

## 5. Information the screen did not provide when I needed it

- That sand and storms are instant-loss hazards rather than large battery penalties.
- That every completed row gives 1 score and a finish gives a 3-point bonus.
- Whether recharge is capped at 8.
- Whether slope/ground/dust effects combine, or whether the battery card is the complete nonlethal cost.
- A usable legend for the map colors, contours, gold speckles, and “simulated hazards.”
- How the CLI player can deliberately choose “new sol” instead of replaying after a finish.
- Whether finishing with spare battery has any scoring value. It apparently does not.
