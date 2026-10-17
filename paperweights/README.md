# Paper Weights

## Current prototype - two audience models (PW4)

Run `python3 paperweights/serve.py --rover-only`, then open
[the competitive game](http://localhost:8684/paperweights/web/). Medium is the default.
Each team plays independently. Its own Reset starts that team again; the top Reset
restarts all teams. Reset replays the same map and paper data for comparison.

Medium starts with one face-up card. **Audience: Go/Avoid** counts that team's
GO/AVOID sheets matching the latest revealed icon and color. **Audience: Which card?**
counts that team's inspection sheets. Both concern the same column. Bars show
percentages and actual counts within the relevant model, not all people in the team.
Repeated polls are deterministic. You can reveal one more card, then must choose
Go or Avoid. Revealing it clears the old bars; a new decision poll uses that card.
The outlined card is the current lookup. There is no four-card lookup or timer.

Easy still shows all four cards and Go/Avoid without simulated polls. A wrong Go
or a false Avoid eliminates the team; four correct decisions finish. Medium's
column marker surrounds the rover; Easy's marker is ahead. Revealed cards and
Go/Avoid resolution always refer to the same row in both modes.

Team sheets are split randomly but roughly equally between GO/AVOID and WHICH CARD.
With 15 people each half has only one or two voters, so coarse percentages and ties
are expected. Every sheet has all 24 cues. Colors encode historical context using
the existing model, not the current hidden hazard. No guaranteed survival rate is
claimed. See [the model description](competition/DUAL.md).

Rehearsal packs:

- [15-person duplex sheets](printouts/PW4-15-15-1061d94544/duplex.pdf)
- [200-person duplex sheets](printouts/PW4-15-200-b7e1faa6ed/duplex.pdf)

Choose 200 sheets in the selector to simulate 25 people per model per team without
printing anything. The 15-person pack has only one or two per model per team.

## Generate and print

```sh
paperweights/.venv/bin/python paperweights/build_printouts.py --sheets 15 --seed 15
# Or use --sheets 200 for the larger audience.
python3 paperweights/build_site.py --output paperweights/out/rover-review
```

The generator creates a matching game pack and `printouts/<pack-id>/duplex.pdf`,
plus separate words/rover PDFs, previews, manifest, verification and PRINT.md.
Use 12-200 people. Select the matching pack ID on screen. Print A4, actual size,
color, double-sided, flip on long edge. Word fronts retain the Swift format;
Rover backs identify the team and which audience question that person answers.
Keep each team's stack together and distribute both model types. The PDF has
alternating word front and Rover back, one sheet per person.

PW4 replaces PW3's four-lookup majority experiment. PW2 and PW3 files remain as
history and must not be used with this version. Only PW4 packs appear in the selector.

## Sentence competition benchmark

**Paused after review.** The sentence lab is preserved in `sentence-lab/`; its review
server is offline while we return to Rover. Two groups get five turns each to steer one
robot sentence toward good or bad.
It includes three mechanics, majority/sampling/representative choices, actual sheet tallies
and a printable 15-person pack. [Results and regeneration](sentence-lab/README.md).
This is an independent rehearsal experiment; it uses its own word sheets.

## Earlier design reviews

The sections below document the earlier standalone word packs and visual prototypes.
For a live competitive game, print the matching duplex pack above; these earlier
Rover studies are design history, not compatible live-game packs.

## Word handouts — approved minimal format

**All word printouts are in [`words/`](words/).** Every page contains only the title,
three basic instructions and 24 token pairs. The approved color labels inside each
pair remain; the extra legend, page badge, headings, notes and footer are gone.

| Pack | Print-ready PDF | First-page preview |
| --- | --- | --- |
| Tabletop / 15 people | [15 sheets](words/paper-weights-15.pdf) | [Preview](words/paper-weights-15-preview.png) |
| Room / 100 people | [100 sheets](words/paper-weights-100.pdf) | [Preview](words/paper-weights-100-preview.png) |
| Room / 200 people | [200 sheets](words/paper-weights-200.pdf) | [Preview](words/paper-weights-200-preview.png) |
| Approved single-page sample | [Sample](words/paper-weights-clean-mockup.pdf) | [Preview](words/paper-weights-clean-mockup-preview.png) |

Print single-sided, **A4, actual size, in color**. Each page goes to one person.
The PDFs include the colored boxes. For HTML printing, enable background graphics.
Print the whole selected pack: closure is guaranteed across that pack, not an arbitrary
subset. The single-page sample is for reviewing appearance, not playing alone.

The 15/100/200 packs retain their original token assignments; only the layout changed.
Old copies in `output/` and `mockups/` were removed to avoid printing the wrong version.
No page numbers or seed metadata are printed. Use the PDF page order and JSON manifest
when you need to identify a sheet during testing.

## Regenerate, or print for a larger audience

Run from the repository root. Python 3.12 is tested; WeasyPrint requires system
Pango/font libraries. Setup once:

```sh
python3 -m venv paperweights/.venv
paperweights/.venv/bin/pip install -r paperweights/requirements.txt
```

Generate exactly one page per participant, using the same minimal format:

```sh
paperweights/.venv/bin/python paperweights/generator.py --sheets 15
paperweights/.venv/bin/python paperweights/generator.py --sheets 100
paperweights/.venv/bin/python paperweights/generator.py --sheets 150
paperweights/.venv/bin/python paperweights/generator.py --sheets 200
```

The generator supports every count from **10 to 200**. For example, `--sheets 150`
creates `paperweights/words/paper-weights-150.pdf` plus its HTML, JSON and preview PNG.
Re-running the same count/seed reproduces the dealt pairs and replaces those files.
To make another reproducible deal without replacing the original:

```sh
paperweights/.venv/bin/python paperweights/generator.py --sheets 150 --seed 7 --output paperweights/words/paper-weights-150-seed7.pdf
```

Checks:

```sh
paperweights/.venv/bin/python paperweights/test_generation.py
paperweights/.venv/bin/python paperweights/verify_outputs.py
```

The first checks graph closure and the existing probability model. The second checks
all delivered PDFs for page count and clipped text, verifies every Paper Weights word and its
colors, and checks that removed decorations have not returned. Results go in `checks/`.

## What the word game guarantees

The generator preserves complete copies of the exact supplied corpus, then pads with
closed cycles made only from observed transitions. Every token on the right has at
least two left occurrences, held by at least two different people. Every page has
24 pairs, sorted by left color down column 1 and then column 2. Token colors are stable
across seeds and deck sizes, with matching left fill / right font colors.

The source text has **176 tokens and 51 distinct tokens**. Twenty tokens have only one
distinct successor (`old -> man`, for example); the other 31 branch. Repetition does
not imply distinct continuations. This is documented in the JSON manifests rather
than changing the requested text or claiming every token branches.

## Facilitate the word game

Start with **“the, RED.”** People find RED-filled `the` boxes and raise their hands.
Choose a hand at random; that person reads the right word and color. That becomes
the next call. If a person has several matching entries, they choose one at random.
Punctuation is a token too; explain that on stage.

A random person is not a random printed occurrence when people hold different numbers
of matches. The manifest records exact `random_hand_probability` values for the simple
version. To demonstrate raw pair frequencies exactly, weight each person's chance of
being chosen by their number of matching entries, then choose one of their entries
uniformly. The finite printed deck's counts, including closed-cycle padding, are the
relevant counts. This models short-context continuation, not a full modern LLM.

## Latest experiment — context colors on paper and stage

[Two Swift-shaped icon sheets](rover/context/sample-sheets.pdf) -
[Four-card / four-team stage mockup](rover/context/stage-mockup.pdf) -
[Color meanings and mechanics](rover/context/README.md)

Color now represents a shared history/terrain context, not a card category. The
left is a colored icon, the right a historical next-category word. These mocks keep
the approved Paper Weights rectangles, 24-pair grid and six-color palette. A matching 60-person
pack supplies the stage's actual vote counts. This is a new context-sensitive
simulation and a proposed stage appearance, not a change to the deployed game.

All existing word and data PDFs/previews now use ASCII `->` separators.

## Earlier alternatives — three color-free brainstorming mocks

**[Open all six sample pages](rover/concepts/all-concepts.pdf)**: two participants for
each of three approaches. These reuse the frozen Rover glyphs, keep white paper,
and add no category colors. The deployed black game screen and existing voting app
remain the intended stage experience.

| Concept | What the participant does | PDF |
| --- | --- | --- |
| A — Field notes | Reads two short historical traverses and chooses a useful next category | [Two sample sheets](rover/concepts/a-field-notes.pdf) |
| B — Signal slips | Matches one icon and follows a Swift-style pair to a suggested category | [Two sample sheets](rover/concepts/b-signal-slips.pdf) |
| C — Two clues | Matches the previous warning and revealed next slope before following the pair | [Two sample sheets](rover/concepts/c-two-clues.pdf) |

[Concept comparison and rehearsal](rover/concepts/README.md) explains their different
probability meanings, edge cases and 10-second turn loops. Regenerate the mocks with:

```sh
paperweights/.venv/bin/python paperweights/rover/concepts/render.py
```

These are alternatives for discussion, not a selected full-room design. The earlier
colored `rover/output*` packs, white map panels and paddle templates are retained as
previous prototypes but are **not the current proposal**. Maps/paddles are out of scope
for this review. See [chronology](../chronology/2026-10-14-paperweights.md) and
[session narrative](../narrative/PAPERWEIGHTS.md) for checkpoints.
