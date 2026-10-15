# Paper Weights

## Game

```sh
python3 paperweights/serve.py
```

Open [the competitive game](http://localhost:8684/paperweights/web/). Dark is the
default; the Light button switches theme. The stage selector links to the existing
collaborative game. Select the print pack matching the ID on your sheets.

Choose **Easy** or **Medium** (default). Hard is reserved for later.

In **Easy**, all four cards in the current square are face up. The audience votes
Go or Avoid using the **Avoid these:** icon strip at the bottom of the Rover sheet.
The representative chooses Go for a safe square or Avoid if any kill card is present.
A wrong choice eliminates the team. Each choice advances automatically; four correct
choices finish the route. There is no reveal timer in Easy.

In **Medium**, each rover starts with one card showing. It hides after the reveal time;
the audience uses that icon and color to vote for the next category. The representative
flips one of the four cards. It stays visible for the reveal time, then hides automatically.
A revealed death card makes the rover avoid that row. Any other card makes it go;
if another card in that row was deadly, the rover is eliminated and its map dissolves.
Four successful flips finish the route. The last card seen is always the next lookup.

The Medium reveal-duration control offers 10, 20 or 30 seconds. Changing it updates
active reveals from their original start time. After a card hides, the next flip waits
for the representative. Switching difficulty resets all four teams. Reset replays the
same maps. Your separate voting app remains separate.

The Netlify build now copies this independent page into the existing publish folder;
no deployment has been triggered. The original collaborative engine and styling are
unchanged. Only the selector includes are added to its page.

## Print and play

Production packs live in [`printouts/`](printouts/). Each person receives one A4 sheet:
word lookup on the front, Rover lookup on the back. Both sides have 24 pairs and
three short instructions. Rover uses plain color names (RED, BLUE, AMBER, GREEN,
PURPLE, PINK) instead of numbered context codes or dot patterns,
monochrome icons, inverted hazards and white paper. A bottom strip on the Rover side
shows the three kill icons: storm, dead battery and sand pit.

Set up once from the repository root:

```sh
python3 -m venv paperweights/.venv
paperweights/.venv/bin/python -m pip install -r paperweights/requirements.txt
```

**One command generates the matching paper and game pack:**

```sh
paperweights/.venv/bin/python paperweights/build_printouts.py --sheets 200 --seed 15
```

Use `--sheets 15` for rehearsal or `--sheets 100` for a smaller room. The supported
range is 12–200. The command prints the output directory and creates:

- `duplex.pdf`: alternating word front and Rover back, one physical sheet per person.
- `words.pdf` and `rover.pdf`: separate sides for inspection or manual duplex printing.
- `manifest.json`: the exact paper observations and matching game routes.
- `PRINT.md`: page-to-person/team assignments.
- `verification.json`: page count, 24 pairs per side, arrow and page-bound checks.

It also installs the matching game pack under `web/packs/` and updates its index.
The game selects these packs by ID; the selected ID must match the tiny ID printed
on both sides. Changing seed or attendance creates a different pack. Do not mix
sheets from different packs. Keep the print stack in order when splitting it into
four audience groups using `PRINT.md`; the team/person mark also identifies each
sheet after distribution. A clear Team A/B/C/D label appears at the top of both
sheet sides and on the matching screen panel. People may choose any team first, then receive a sheet
from that team’s stack: **A top left, B top right, C bottom left, D bottom right**.
Keep each stack together: its category counts are stratified. Randomly mixing
stacks only approximates those proportions and can swing close votes, especially
with 15 people.

| People | Duplex PDF | Rover preview | Matching game pack |
| --- | --- | --- | --- |
| 15 | [30 pages](printouts/PW2-15-15-fb7b11abfe/duplex.pdf) | [Preview](printouts/PW2-15-15-fb7b11abfe/rover-preview.png) | `PW2-15-15-fb7b11abfe` |
| 100 | [200 pages](printouts/PW2-15-100-1afd11f78a/duplex.pdf) | [Preview](printouts/PW2-15-100-1afd11f78a/rover-preview.png) | `PW2-15-100-1afd11f78a` |
| 200 | [400 pages](printouts/PW2-15-200-95d7a79806/duplex.pdf) | [Preview](printouts/PW2-15-200-95d7a79806/rover-preview.png) | `PW2-15-200-95d7a79806` |

Print **A4, actual size, color, double-sided, flip on long edge**. Print the entire
chosen pack. Each odd PDF page is a word front; the following even page is its Rover
back. Test the first two pages on one physical sheet before printing the room pack.
All paper backgrounds are white. In HTML printing, enable background graphics.

Everyone has all 24 possible live icon/context keys, exactly once each. The suggested
next category varies across sheets. Every participant can answer every lookup for
their team; no live key depends on only a few people. Shared-model checks and the
limits of these authored distributions are documented in [`competition/`](competition/).
The word activity preserves its existing closed corpus and six token color names;
production fronts use the same muted palette as the Rover backs. The shared model
default seed 15 is an explicitly selected rehearsal scenario. With the tested Medium paper
policy, 15/100/200-person packs yield 1/1/2 finishers; different choices can differ.
Older numbered-code packs live in [`printouts/archive/`](printouts/archive/) and are
incompatible with the current competitive game.

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
