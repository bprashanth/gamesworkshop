# Rover Run: Rulebook & Dev Handoff

Oct 4, 2026 · @beeps

## Overview

Rover Run is a card-and-map game: teams drive a rover along a real Mars route, deciding row by row whether to Go, Avoid, Recharge or Sample. They only learn what was on each row after they commit.

Teams that notice two patterns win: the printed slope map rules out sand traps, and haze and soft ground warn of storms and sand. Teams that check everything, or nothing, lose.

- **Event version:** 5–10 players as 2–3 teams plus 1 facilitator; one shot of about 30 minutes; scales to large rooms by giving every table the same numbered decks.
- **Online version:** 1 player, the same deck, unlimited retries.
- **Ending:** every team's route sheet replays together on the real Jezero map, in the visual style of the anchor films.

The game sits under the anchor-film narrative: local autonomy is earned through well-defined problems and tested conditions, and more observations help only when they address the uncertainty that matters.

## Learning goals

Each goal is carried by a mechanic, never by a lecture. Players should be able to state all five in the debrief without being told.

| Goal | What players should feel | Mechanic that carries it |
| --- | --- | --- |
| Modeling | You can't look at all data all the time | Humans noticing patterns: once they see that slope rules out sand, they stop worrying about ground on steep rows |
| Exploration | Collecting new data is worth something | Sampling: +1 point per row, but it costs a turn |
| Verification | A model must be checked against reality | Cards are flipped after each commit, and online players retry the same deck to test their guess |
| Protocol | You need rules for when to do what in the field | The rules themselves: Go, Avoid, Recharge, Sample, one action per turn, a fixed battery |
| Indicators | Some signals point in the direction of danger | Slope (steep means no sand), soft ground before sand, haze before a storm |

**Debrief prompts**

1. What did you stop checking, and why did you trust that?
2. Which warning turned out to be a false alarm? Could you have known?
3. When was sampling worth the turn, and when wasn't it?

## Components

Every team gets an identical set: one printed route map, which doubles as the team sheet, and four numbered decks.

**Route map and team sheet**

- Real Jezero elevation contours in the anchor-film style: black background, thin muted contour lines, white route.
- The route is cut into numbered rows 1–N. Slope is readable from the contour spacing.
- Beside each row: a **G / A** box, a **Recharge** tick, a **Sample** tick, and a battery column.
- Printed clue on the sheet: *"You have enough battery to drive straight through."*

&#91;embedded content: Sample team sheet · 8 rows, intended play\]

The sheet deliberately has no slope column. Slope appears only in the contour map and on the Slope cards, so players have to discover for themselves that the two match.

**Four decks (suits), numbered 1–N on the back**

| Suit | Values | Source |
| --- | --- | --- |
| Slope | flat / tilted / steep | Mirrors the printed contour map |
| Ground | firm / soft / SAND | Rover-data proxy |
| Dust | clear / haze / STORM | Rover-data proxy (MEDA tau, bucketed) |
| Battery | 0 / −1 | Derived: −1 when the row is soft or hazy |

Card *n* in every suit describes row *n*. The decks stay in numbered order and are never shuffled. That is what keeps the battery moving in step with dust and ground for every team, whatever path they take.

&#91;embedded content: Sample cards · row 6 faces and one back\]

Row 6 shows a double warning: soft ground, which is dismissed because row 7 is steep, and haze, which is not.

## Rules

The rover starts with 8 battery and has N + 2 turns. Each turn the team does exactly one thing, writes it on the sheet, and only then flips cards.

**Start**

- Battery: 8.
- Turns: N + 2 (10 turns for an 8-row map).
- All four decks face down, in numbered order.

**Each turn, do ONE thing**

| Action | Effect | Uses a row? |
| --- | --- | --- |
| **G - Go** | Drive row *n*. Apply that row's Battery card. | Yes |
| **A - Avoid** | Bypass row *n*. Costs 2 battery. Hazards on that row don't affect you. | Yes |
| **Recharge** | Stay where you are. Gain 2 battery. | No |
| **Sample** | Stay where you are. Gain 1 point. Once per row. | No |

After a Go or an Avoid, **flip all four cards for that row**, including the row you avoided. No cards are flipped on Recharge or Sample turns.

**Avoid never draws cards.** It's a fixed-cost bypass, so there is no left or right lane and no detour values to card.

**The rover dies if**

- you Go into a **SAND** row,
- you Go into a **STORM** row, or
- the battery reaches **0**.

**Score**

- +1 per row passed (Go or Avoid).
- +1 per sample.
- +3 for finishing the route.
- A dead rover keeps whatever it had already scored. There are no negative points.

Most teams won't finish. A non-finisher with good samples can beat a finisher who rushed.

## Hidden patterns (facilitator only)

Three authored patterns drive the deck. Players are never told them; finding them is the game.

1. **SAND always follows a SOFT row, and never sits on steep ground.**
2. **STORM always follows a HAZE row.**
3. **The Battery card is −1 when that row is soft or hazy, otherwise 0.**

Design constraints for whoever builds the deck:

- Warnings are necessary but not sufficient. Some soft or haze rows are false alarms.
- Slope can dismiss a sand warning. Nothing dismisses a storm warning, so haze always costs something.
- Steep stretches should run for several rows. Seeking slope then pays off: on a long steep run, ground stops being a worry.
- Going straight through without avoiding anything must be affordable in battery, so the printed clue is true. Battery only runs out through excess Avoids.
- A hazard never appears without its warning on the row before. Every death must be foreseeable from cards already flipped plus the map.

## Example deck and strategy outcomes

In this 8-row, 10-turn deck, only the team that reads both warnings and slope scores the maximum of 13.

| Row | Slope | Ground | Dust | Battery |
| --- | --- | --- | --- | --- |
| 1 | tilted | firm | clear | 0 |
| 2 | flat | soft | clear | −1 |
| 3 | flat | **SAND** | clear | – |
| 4 | steep | soft | clear | −1 |
| 5 | steep | firm | clear | 0 |
| 6 | steep | soft | haze | −1 |
| 7 | steep | firm | **STORM** | – |
| 8 | tilted | firm | clear | 0 |

Row 4 is a dismissible warning: it's soft, but row 5 is steep, so sand is impossible there. Row 6 shows both signals: its soft ground is dismissed by steep row 7, but its haze is not.

| Strategy | What happens | Battery used | Score |
| --- | --- | --- | --- |
| Always Go | Dies in the sand on row 3 | – | 2 |
| Avoid after every warning | Also avoids row 5 needlessly; needs 1 recharge, leaving 1 turn for a sample | 9 | 12 |
| Reads warnings and slope | Avoids only rows 3 and 7; no recharge; 2 samples | 7 | **13** |
| Always Avoid | Recharges constantly and runs out of turns around row 6 | – | about 6 |

The gap between the second and third strategies is small at 8 rows. A real deck of 12–15 rows with 3–4 slope-dismissible warnings widens it.

## Event vs online

Both versions use the same deck and rules. The event gives one attempt; online gives unlimited retries, which is where verification becomes a loop.

|  | Event (5–10 players, scalable) | Online (1 player) |
| --- | --- | --- |
| Attempts | One | Unlimited, same deck |
| How patterns are found | Noticed on the day from flipped cards and the printed map | Guess, retry, check whether the guess held |
| Verification | Comparing flipped cards with what the team expected | Each retry tests the player's current model |
| Feedback | Cards for a row flip only after the team commits | The same, plus a full replay after each run: route, battery curve, where it broke |
| Ending | All teams' sheets replay together on the real Jezero map | The player's runs overlaid on the same map |
| Facilitator | 1 person: times turns, checks sheets, runs the replay | None |

**Running the event**

1. Hand out identical sealed decks and maps. Walk through one practice turn, not the patterns.
2. Play with timed turns of about 2 minutes, all teams in lockstep.
3. Collect the sheets and run the replay: every rover on one map, side by side.
4. Debrief using the three prompts under Learning goals.

For a large room, run 50 tables with identical decks and a few roaming facilitators. Sheets can be photographed or typed into the replay page.

## Data honesty

Card values are representative bands (1–3 levels), not raw readings. They follow the direction of the real data and are identical for every team.

| Element | Status | Source or note |
| --- | --- | --- |
| Route and contour map | Real | [Jezero CTX 20 m DEM](https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif), [Perseverance traverse](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json) |
| Slope cards | Real, bucketed | Derived from the DEM along each row |
| Dust cards | Real direction, bucketed | [MEDA/TIRS tau](https://doi.org/10.5281/zenodo.20827517) by sol, mapped to clear / haze / storm |
| Ground cards | Proxy | Authored, loosely tied to terrain |
| Sand traps and storm deaths | Authored | Spirit's 2009 sand trap and Opportunity's 2018 dust storm make good real hooks |
| Battery rule | Authored | See the note below |
| Samples | Authored score | Optionally placed at real sample sites |

**Power caveat:** Perseverance is nuclear-powered, so dust doesn't drain its battery. Either label the power system as simulated, or frame the game rover as solar-powered, like Opportunity.

The replay should carry a footer in the style of the films, such as *Real terrain + route / simulated hazards*.

## Developer notes

Build the deck generator and simulator first. Print nothing until the tuning targets pass.

**Deliverables**

- [ ] Deck spec: 12–15 rows, each with Slope, Ground, Dust and Battery values, as CSV or JSON.
- [ ] Strategy simulator: plays every strategy below against the deck and reports scores.
- [ ] Printable map and team sheet, rows aligned to the real route, anchor-film style.
- [ ] Printable cards: 4 suits × N, numbered backs, one-word faces plus an icon.
- [ ] Online 1-player version: same deck, retry, per-run replay.
- [ ] Replay page: takes G/A/Recharge/Sample sheets and animates all rovers on the real Jezero map.

**Strategies to simulate**

1. Always Go.
2. Always Avoid, with recharges.
3. Random.
4. Avoid after any warning (ignores slope).
5. Slope only (ignores haze).
6. Warnings plus slope (the intended play).
7. Each of the above with and without sampling on spare turns.

**Tuning targets**

- Intended play scores the maximum and is the only strategy within 10% of it.
- Random play scores below 40% of the maximum on average.
- Ignoring slope costs at least 3 points on the full deck.
- Ignoring haze leads to death.
- Every death is foreseeable from previously flipped cards plus the map.
- Going straight through costs less battery than the starting 8, so the printed clue is true.
- Spare turns are N + 2 minus the rows; tune them so that sampling and recharging compete.

**Pass/fail test for the first paper playtest (one table, about 30 minutes)**

- Pass: at least one team says something like "steep means no sand" or "haze means storm" before the reveal.
- Fail: everyone treats it as luck. In that case, make the warnings more regular or the steep runs longer.
