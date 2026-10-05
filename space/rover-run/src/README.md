# Rover Run

**A data-science game about building indicators and models.** You drive the real Perseverance
route across Jezero crater, one square at a time. Each square has hidden ground and weather that
can kill the rover. The cards you uncover are your data. Nobody tells you the rules: the room finds
the indicators (what comes *before* a death), checks them against the whole map, and combines them
into a model that is right often enough, and cheap enough, to get across.

```sh
python3 space/rover-run/src/serve.py     # from the repo root; binds 0.0.0.0:8670
```

Open <http://localhost:8670/> (on Tailscale: <http://100.82.28.38:8670/>). `/web/` is the game.
The index also keeps every earlier version.

## What it teaches

| Goal | What players should feel | What carries it |
| --- | --- | --- |
| **Indicators** | A death has an earlier, visible warning | soft ground before SAND, haze before STORM, an avoid before a dead battery |
| **Patterns need repetition** | One case is an anecdote | each hazard recurs on the one fixed map (3 sands, 3 storms) |
| **Correlation over time** | The warning is one square ahead | a single variable along the row: soft → SAND, haze → STORM |
| **Correlation across variables** | Context changes what a warning means | down a column: sand is never on steep ground; storms never on flat ground |
| **Models combine weak signals** | Neither signal alone decides | storm = haze before **and** a slope: 3 of 4, against 3 of 6 for haze alone and 0 of 5 for slope alone |
| **Attention is a budget** | You can't look at everything | Hard mode: 2 of the 4 cards of the square ahead; Medium hides the battery for you to work out |
| **Precision has a price** | False alarms cost, misses kill | a detour scores nothing; the square after a hazard is dead battery (recharge); a miss costs a life |

The facilitated exercise (identify the death → find the earliest indicator → check it recurs →
correlate along a row → correlate down a column → write a one-line model) is in
**[narrative/INDICATORS.md](../../../narrative/INDICATORS.md)**, with counts and square numbers.
To build the same game on your own dataset, see **[narrative/REUSE.md](../../../narrative/REUSE.md)**.

## How to play

- **The map** is 14 vertical strips of the Jezero contour map, turned south-up so the westward
  drive reads left to right. Lines closer together mean steeper ground.
- **Actions, one per turn:** **Go** (drive the next square), **Avoid** (detour around it), or
  **Recharge**. A square's battery card is the battery you arrive with. It's dead on the square right
  after a SAND or STORM (the detour round it drained you). Recharge before moving on from a dead
  square, or the rover dies. **Only squares you drive score** (+3 for finishing); a detour
  scores nothing. 14 squares, 22 turns. Every rule is a card, so the same game plays on a table.
- **Cards** sit in a column under each strip:
  - slope: flat / slope / steep;
  - ground: a stick figure firm / sinking in soft ground / in quicksand (**SAND**);
  - dust: clear sun / rain haze / **STORM** dust devil;
  - battery: the battery you arrive with: **dead** on the square right after a SAND or STORM, full otherwise.
  White cards are deadly. The card that killed you gets a red ring.
- **The graph** plots everything you've seen on one x axis with the cards: battery (top lane),
  ground (dotted ●), dust (dashed ×) and slope (grey terrain band). Warning and hazard points are named.
- **3 lives.** A death costs one, and the rover restarts on the square before, battery full.
- **Modes** (top right):
  - **Easy:** the whole board face up, with every trend on the graph.
  - **Medium (default):** the square ahead shows slope, ground and dust. **Battery is the hidden
    variable**: you see each battery card only once you're past that square, plotted in real time,
    so you learn its relationship by playing.
  - **Hard:** all hidden. Pick 2 cards of the square ahead each turn.

  Once you cross a square, all its cards flip.
- **Helpers:** click a face-up card to light up every card with the same value and outline the
  square before each. Hover a column to light its strip on the map. **Reset** flips every card
  face down and starts over.

## How it's built

| Path | What |
| --- | --- |
| `web/` | The game (v1.6). `engine.js` holds the rules (pure). `analysis.js` holds the strategies and the checks. `game.js` is the page. `screen.js` + `effects.js` are the dot-matrix map and the death effects. `symbols.js` holds the card glyphs. `deck.json` is the fixed map. `map.json` / `rows.json` are the contours, route and strips. |
| `tools/sim.mjs` | Plays every strategy against the deck and checks each tuning target and pattern (`node tools/sim.mjs`). |
| `tools/prep.py` | Builds `map.json` from the DEM and traverse (`--strips 14 --rotate`). Needs a venv with numpy, scipy, rasterio, contourpy and pillow. |
| `tools/film.mjs` | Records a played session to MP4 on Seagate (`media/` symlinks). |
| `tools/agent-play.mjs`, `shot.mjs`, `montage.py` | Blind-playtest harness and review screenshots. |
| `mocks/` | The card-glyph mock page used to choose symbols. |
| `benchmarks/` | Simulator output and blind agent playtests, kept locally (benchmarks aren't committed; the findings are in the chronology). |
| `v1.0/` … `v1.5/`, `v2/` | Frozen earlier versions (`v2` is a separate two-deck design experiment). |

**Tuning (all checks pass, 22 turns; score = squares driven + 3 for finishing):**

| Protocol | Score | How it ends |
| --- | --- | --- |
| Hard, look at ground + dust | **11** | finishes, drives every safe square |
| Hard, look at slope + battery (battery tells you nothing about the square ahead's hazard) | 10 | finishes, like the model |
| The model with no look ahead (sand risk = soft before and not steep; storm risk = haze before and a slope) | 10 | finishes; one false alarm costs a point |
| Ignore slope for storms, or for sand | 8 | finishes, 2 needless detours |
| Avoid after any warning | 6 | finishes, 4 needless detours |
| Always avoid | 3 | finishes, nothing driven |
| Always go / ignore haze / never recharge | 2 | sand / storm / battery |
| Random | 1.0 | |

## Data honesty

**Real:** the contour map (JPL Mars 2020 CTX DEM, 20 m), the Perseverance traverse (NASA MMGIS,
sols 14–1980, 45 km), and slope per strip, measured from the DEM at map scale.
**Authored:** ground, dust and hazards; the battery is simulated (Perseverance is nuclear-powered).
The map is rotated 180° (south up), not mirrored.

## History

[chronology/2026-10-04-rover-run.md](../../../chronology/2026-10-04-rover-run.md) records every
version, decision, simulator sweep and playtest. The original game-design handoff is
[../rulebook.md](../rulebook.md). An earlier parallel Codex build is archived locally in `../archive/` (not in git).
