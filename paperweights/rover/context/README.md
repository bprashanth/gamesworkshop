# Context colors: Swift-shaped paper, four cards on stage

Current experiment, requested after reviewing the color-free alternatives.

- **[Two sample audience sheets](sample-sheets.pdf)** · [preview](sample-sheets-preview.png)
- **[Four-team stage mockup](stage-mockup.pdf)** · [preview](stage-mockup-preview.png)
- [What each color remembers](context-key.pdf)
- [Full matching pack: 60 people, 15 per team](audience-60.pdf)

The paper uses the approved Paper Weights geometry: white A4, title, three short instructions,
24 pairs, two columns of twelve, the same six fills and fonts. The left word becomes
a white Rover glyph; the right word is a historical next **category**. Every separator
is the two ASCII characters `->`. Color names remain for accessibility.

## What changed conceptually

Color is now a **context key**, shared by the on-screen card and the paper lookup.
It is not a fixed label for battery, dust or another category. An icon supplies the
current reading; its color supplies selected history and a lateral terrain feature.
People matching both pool evidence from comparable situations. The older history
need not remain visible as rows of cards on screen.

In this first mock, the current square shares one context key across all four cards,
so all four card faces in a panel have the same color. Different cue icons still have
different matching historical examples and distributions. Giving each category a
different context function would be a further design, not something implied here.

| Color | Dust history before the current square | Current slope |
| --- | --- | --- |
| RED | The last two dust readings were both HAZE | non-flat |
| BLUE | The last was HAZE, but the one before was not | non-flat |
| AMBER | The last dust reading was not HAZE | non-flat |
| GREEN | The last two dust readings were both HAZE | flat |
| PURPLE | The last was HAZE, but the one before was not | flat |
| PINK | The last dust reading was not HAZE | flat |

This refines the initial "previous dust × slope" idea: that simpler key would force
every storm into one color under the inherited haze-before-storm rule. With persistent
versus fresh haze histories, both RED STORM and BLUE STORM are possible.

The key intentionally compresses selected features. BLUE groups two different older
dust values; non-flat groups slope and steep; ground history is not encoded. Therefore
"same color + icon" means the same **declared context bucket**, not identical full
map histories. Six colors cannot represent every possible history exactly.

A color describes inputs, never the unknown next outcome. The renderer calls the same
`context()` function for historical examples and stage snapshots. Changing a future
outcome cannot change the source color. This is a hand-authored context representation,
analogous to retaining useful context; it is not a transformer attention mechanism.

## Exact timing in this mock

The stage is paused at a source-square review moment: square 06 has been crossed or
avoided and all its readings have been revealed. Only those **four cards** are displayed.
Older squares are stored in state. The outlined card is the cue the rep calls.

1. Rep calls, for example, **RED HAZE**.
2. In 10 seconds, people find that colored icon and vote the word on its right.
3. Rep chooses which category to inspect in **square 07**.
4. The four-card panel is replaced by square 07's cards, and the selected category flips.
5. After inspection and movement, square 07 becomes the next fully revealed source.

The same-category recommendation (HAZE -> dust) thus asks about the **next square**,
not a card that has already been flipped. In this source-review version, the current
slope used in the color is already known; its color is not leaking a hidden target card.

If the intended future interaction is instead to color an isolated newly flipped
square-07 card before square 07's slope is revealed, choose explicitly between:
(a) treating terrain as an already available observation; (b) a context key using only
known history; or (c) intentionally letting color disclose that terrain summary.
Do not silently assume the same key has no information cost in all three interactions.
The static mock does not yet decide that next-screen behavior.

## What the right word represents

Historical maps contain four simultaneous next readings, not one natural "next
category." A measurement-selection convention is still needed to turn them into
Swift-like pairs. Here it is explicit and designed to produce useful suggestions:

- Three out of four observations choose uniformly among dangerous next readings
  (STORM, SAND, dead battery) if any occurred.
- Every fourth observation explores the four categories in a balanced rotation.
- If there was no dangerous next reading, choose an ordinary category uniformly.

Thus the category always refers to an actual next reading from the saved historical
case, but the printing policy emphasizes interesting evidence and keeps minority
suggestions. A RED STORM can lead to battery on one person's sheet and slope on another.
The raw next values, selected category and selection reason are retained in the JSON.

The right word's ink repeats the source context color for the familiar Swift appearance.
It is **not** the next live card's color. Each fresh call must come from the stage.
The audience votes only a category; GO/AVOID remains the rep's decision.

Vote shares are the distribution of these historical inspection suggestions. They are
not automatically P(STORM) or a learned optimal information-gathering policy. The room
can discover that a cue tends to point to dust, battery or another measurement, but we
have already chosen the context features and printing policy. That is the part the
facilitator should distinguish from learning the associations from the examples.

## A context-sensitive simulated world

The older generator's next-storm law ignored most older history once current haze was
known. Simply coloring those histories would add a lookup step without much predictive
value. This experiment therefore has a **separate proposed simulator**, in
`context_world.py`; it does not alter `../model.py` or the deployed game's fixed deck.

If current dust is HAZE and the next square is non-flat, next-storm probability is:
RED .90, BLUE .60, AMBER .35, GREEN .55, PURPLE .30, PINK .15.
Next-flat terrain never storms. Next slope is independently drawn with proportions
5/14 flat, 6/14 slope, 3/14 steep. Therefore a RED HAZE has marginal next-storm
probability .90 × 9/14, about 57.9%, versus GREEN HAZE .55 × 9/14, about 35.4%.
These are authored parameters for an experiment, not Mars measurements.

The prior sand rule remains: soft current ground, non-steep next terrain, probability
.65. Next battery is dead immediately after either SAND or STORM. Both hazards can
coexist. Historical cases and fresh sealed next-square draws use this same kernel;
separate random streams prevent copying the live answer onto the paper.

All six context colors can contain HAZE. Storm can be RED or BLUE; it cannot be green
or purple because storms are excluded on flat terrain. The generated paper includes
only reachable icon/context combinations, rather than inventing impossible examples.

## What was generated and checked

60 different sheets, 15 per team. Each holds 24 unique icon/context lookups. Four
review calls occur on every sheet; the other reachable keys are distributed evenly,
with at least two responding people per team for every key observed in the archive.
The generator checks coverage. Participants do not all hold the same set of icons.

The four stage vote bars are counted from those actual team sheets; they are not
hand-entered percentages. The two-page sample is the first two people from team A.
Page order in the 60-page pack is A1–A15, B1–B15, C1–C15, D1–D15; page metadata is kept
in the manifest rather than adding badges back to the minimal printed layout.

The source snapshots are selected to illustrate RED/GREEN HAZE and RED/BLUE STORM.
They are independent state examples, not four complete playable maps or a scored
competition. Square 06 and the progress bars are illustrative positions. A later
controller would store the real traversed histories and update the context key.

The white hazard-card face convention is intentionally replaced by context fill in
this experiment. Glyphs and value labels still identify SAND, STORM and dead battery.
This is a visual proposal; the frozen deployed files have not been changed.

Regenerate and test from the repository root:

```sh
paperweights/.venv/bin/python paperweights/rover/context/render.py
paperweights/.venv/bin/python paperweights/rover/context/test_context.py
paperweights/.venv/bin/python paperweights/verify_outputs.py
```
