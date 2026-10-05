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
| **Attention is a budget** | You can't look at everything | Hard mode: 1 look at the square ahead; the indicator says which card |
| **Precision has a price** | False alarms cost, misses kill | every avoid drains the battery and needs a recharge turn, and turns are limited |

The facilitated exercise (identify the death → find the earliest indicator → check it recurs →
correlate along a row → correlate down a column → write a one-line model) is in
**[narrative/INDICATORS.md](../../../narrative/INDICATORS.md)**, with counts and square numbers.

## How to play

- **The map** is 14 vertical strips of the Jezero contour map, turned south-up so the westward
  drive reads left to right. Lines closer together mean steeper ground.
- **One action per turn:** **Go** (cross the next square), **Avoid** (detour around it; drains the
  battery), or **Recharge** (stay; battery full). Moving on a dead battery kills the rover.
  14 squares, 21 turns.
- **Cards** sit in a column under each strip:
  - slope: flat / slope / steep;
  - ground: a stick figure firm / sinking in soft ground / in quicksand (**SAND**);
  - dust: clear sun / rain haze / **STORM** dust devil;
  - battery: full after a go, **dead** after an avoid.
  White cards are deadly. The card that killed you gets a red ring.
- **The graph** plots everything you've seen on one x axis with the cards: battery (top lane),
  ground (dotted ●), dust (dashed ×) and slope (grey terrain band). Warning and hazard points are named.
- **Look ahead, then decide.** Before each move you look at cards of the square ahead, and the
  game opens with a look, not a Go. Once you cross a square, all its cards flip.
- **Modes** (top right):
  - **Easy:** the whole board is face up, for analysis.
  - **Medium (default):** look at 2 of the square ahead's cards.
  - **Hard:** look at 1. The warning on your square tells you which card to check: soft → ground,
    haze → dust.
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
| `benchmarks/` | Simulator output and three blind agent playtests. |
| `v1.0/` … `v1.5/`, `v2/` | Frozen earlier versions (`v2` is a separate two-deck design experiment). |

**Tuning (all checks pass):**

| Protocol | Score | How it ends |
| --- | --- | --- |
| The model (sand risk = soft before and not steep; storm risk = haze before and a slope; recharge after each avoid) | **17** | finishes |
| Ignore slope for storms, or for sand | 13 | out of turns |
| Avoid after any warning | 12 | out of turns |
| The model without recharging | 3 | battery |
| Random | 1.9 | |

## Data honesty

**Real:** the contour map (JPL Mars 2020 CTX DEM, 20 m), the Perseverance traverse (NASA MMGIS,
sols 14–1980, 45 km), and slope per strip, measured from the DEM at map scale.
**Authored:** ground, dust and hazards; the battery is simulated (Perseverance is nuclear-powered).
The map is rotated 180° (south up), not mirrored.

## History

[chronology/2026-10-04-rover-run.md](../../../chronology/2026-10-04-rover-run.md) records every
version, decision, simulator sweep and playtest. The original game-design handoff is
[../rulebook.md](../rulebook.md). An earlier parallel Codex build is archived in [../archive/](../archive/README.md).
