# Building indicators with Rover Run

A facilitated exercise in finding indicators and building a model from them, played on one
fixed map. None of this text appears in the game. The room hears it from the facilitator. The
game only has to make every step *possible* from the map, the cards and the graph.

Play it at `http://<host>:8670/web/` (start the server with `python3 space/rover-run/src/serve.py`).
Everything below refers to that deck (`space/rover-run/src/web/deck.json`). It is the same for every table, so a room can replicate it on paper.

## The board

14 squares. Each square is one vertical strip of the map, and its four cards sit in the column
directly under that strip. The map is the real Jezero crater DEM and Perseverance traverse, turned
south-up so the westward drive reads left to right. Slope is measured from the DEM per strip.
Ground and dust are authored.

| Square | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| slope | flat | flat | slope | slope | flat | flat | flat | slope | slope | steep | steep | steep | slope | slope |
| ground | firm | soft | **SAND** | firm | soft | **SAND** | firm | firm | soft | soft | soft | firm | soft | **SAND** |
| dust | haze | clear | haze | **STORM** | clear | haze | clear | haze | **STORM** | haze | **STORM** | haze | clear | clear |

(The card word "slope" is the middle slope level, "tilted" in the data.)

The **battery card** is not part of the deck. It records what you did on that square: *full* after
a go, *dead* after an avoid. A detour drains the battery, and moving again on a dead battery kills
the rover, so every avoid must be followed by a recharge. There are 14 squares and 21 turns.

## Modes, and how a session runs

Before every move you look at cards of the **square ahead**. Once you cross a square, all four
of its cards flip.

- **Hard: 1 card of the square ahead.** This is the indicator lesson in its sharpest form: the
  warning on the square you're on tells you *which* card to check next. Soft → check ground (is it
  SAND?). Haze → check dust (is it a STORM?). Slope settles which one matters: steep can't sand,
  flat can't storm. Look at the wrong card and you die. The simulator agrees: looking where the
  model points finishes; always ground dies in a storm; always dust dies in sand; slope is no help.
- **Medium (default): 2 cards of the square ahead.** Players soon learn that ground + dust is
  always the right pair, and that slope (already on the map) and battery (what *you* will do,
  so not pickable) are wasted looks.
- **Easy:** the whole board is face up. Switch to it for the analysis below.

Suggested session: one or two rounds on Medium, then Hard, then Easy for the exercise. **Reset** and
**Play again** flip every card face down and forget the remembered cards.

Two helpers, both silent:
- **Click any face-up card.** Every card with the same value lights up, and the squares just before
  each one are outlined. That answers "where else does this happen, and what came right before it".
- **Hover a column.** Its strip lights up on the map, linking a pattern to a place.

## The exercise

**1. Identify the death conditions.** The card that killed the rover gets a red ring, and the
typed line says why. There are three: SAND (ground), STORM (dust), and a dead battery (the
battery card of the square before, white because it is deadly). Each recurs: SAND at 3, 6 and 14;
STORM at 4, 9 and 11; a dead battery can kill after any avoid.

**2. Find the earliest indication.** Look at the square *before* each death (click SAND or STORM).
- Every SAND has **soft** ground right before it.
- Every STORM has **haze** right before it.
- Every dead-battery death comes right after an **avoid**. Look for the dashed (detoured) stretches
  on the map; the dead cards sit next to the SAND and STORM squares, because that is where people
  detour.

**3. Check whether it is a pattern.** Click *soft*, then *haze*, and count.

| Rule (one variable over time) | Held | Where |
| --- | --- | --- |
| soft → next square SAND | 3 of 6 | sand at 3, 6, 14; not at 10, 11, 12 |
| haze → next square STORM | 3 of 6 | storm at 4, 9, 11; not at 2, 7, 13 |
| SAND without soft before it | never | |
| STORM without haze before it | never | |

So a warning is *necessary but not sufficient*. Something else decides. That is the cue for step 5.

**4. Correlation along a row (one variable, over time).** On the graph, the dotted ground line
rises mid (soft) and then high (SAND) one square later. The dashed dust line does the same for
haze then STORM. The same shape keeps recurring along the row.

**5. Correlation down a column (across variables).** Look at the slope card in the same column
(or the grey terrain band on the graph).

| Rule (across variables) | Held | Where |
| --- | --- | --- |
| SAND on a steep square | never | |
| soft before a steep square → SAND | 0 of 3 | 10, 11, 12 (the rim climb) |
| soft before a non-steep square → SAND | **3 of 3** | 3, 6, 14 |
| STORM on a flat square | never | |
| haze before a flat square → STORM | 0 of 2 | 2, 7 |
| haze before a sloped or steep square → STORM | **3 of 4** | 4, 9, 11 (not 13) |
| no haze, sloped or steep square → STORM | 0 of 5 | 3, 8, 10, 12, 14 |

**6. The model.** Two indicators, combined:

- **Sand risk = soft before AND not steep.** Deterministic on this map: 3 of 3, with no misses.
- **Storm risk = haze before AND a slope.** Neither alone predicts a storm: haze alone storms
  3 of 6 times, and slope alone without haze never storms. Together they storm 3 of 4 times. *Seeing
  both raises the odds; it does not guarantee.* That is what a model does: it combines weak signals
  into a stronger one and still carries uncertainty (square 13 is the false alarm).
- **Battery: recharge every time you avoid.** In practice: recharge after every haze-or-soft
  detour. This one-line protocol replaces watching the battery line.

**7. Why precision matters.** Misses kill, and false alarms cost turns: each avoid needs a
recharge. The turn budget is set so that only the model gets across:

| Protocol | Score | How it ends |
| --- | --- | --- |
| The model (both rules above, recharge after each avoid) | **17** | finishes, 21 turns |
| Avoid after every haze (ignores slope for storms) | 13 | out of turns |
| Avoid after every soft (ignores slope for sand) | 13 | out of turns |
| Avoid after any warning | 12 | out of turns |
| The model without recharging | 3 | battery dies at the second avoid |
| Ground rule only / dust rule only | 3 / 2 | storm / sand |
| Random | ~2 | |

(`node space/rover-run/src/tools/sim.mjs`; the checks in `space/rover-run/src/web/analysis.js` guard every
row of the tables above.)

## Debrief prompts

1. Which warning did you stop worrying about, and what told you it was safe (steep for sand,
   flat for storms)?
2. Your storm rule is right 3 times in 4. Would you still detour? What does the 4th case cost
   you, and what would a miss cost?
3. Which card did you never pick on Hard, and why didn't you need it? (Slope is on the map, and
   your own battery state is on the graph.)
4. Write your model as one line per hazard. Then play Medium following only those lines. Does it
   get across?

## Ideas to extend

- **A held-out map.** Give a second fixed map with the same laws to test whether the room's model
  generalises, not just fits. Both maps can be printed, so replication stays possible.
- **Indicator lead time.** Add a third, earlier indicator (for example a falling dust trend two
  squares out) that is weaker but gives more warning. Then ask: early and weak, or late and strong?
- **Cost-weighted thresholds.** Make one hazard survivable but costly. The room then has to choose
  a threshold for the 3-in-4 rule rather than always detouring.
