# Rover Run — Claude build (online, 1 player)

Drive the real Perseverance route across Jezero, row by row. Each row is one line of the team
sheet: an optional **stop** (recharge or sample), then **Go** or **Avoid**. Then the row's four cards
flip. Nobody tells you the patterns. You find them from the cards, the map, and dying.

```sh
python3 serve.py            # http://localhost:8670  (binds 0.0.0.0 for LAN/Tailscale)
```

Keys: `R` / `S` choose a stop, `G` / `A` commit the row, `P` play again, `N` new sol after a finish.
On a phone, a five-button pad appears under the cards.

**Film of a played session:** `media/rover-run-film.mp4` (symlink to
`/mnt/seagate/gamesworkshop/rover-run/claude/renders/`). It shows three runs, a model forming: always
Go, then sand. Avoid every warning, then the battery dies on the rim. Read slope and haze, then a
finish and a replay of all three.

## What changed from the rulebook, and why

| Rulebook | Here | Why |
| --- | --- | --- |
| One action per turn, N+2 turns | Per row: optional stop + Go/Avoid; **6 stops** | The loop is one choice of two values, then a reveal. Stops are the spare turns. |
| Battery 8 | Battery 8, recharge +2, Avoid −2 | Unchanged numbers. Only the turn budget was retuned, by simulation, for a 14-row deck. |
| Same deck, unlimited retries | Same deck, retries, **ghost cards** of every past reveal, then **new sols** | Ghost cards act as the table's memory. New sols (same route, new hidden weather) catch memorisers: only a model carries over. |
| Slope from the DEM | Slope at **map scale** (200 m smoothing) | 20 m roughness disagreed with the contour spacing the eye reads. Rim rows 10–12 are steep (11–12°). |

## Tuning (all sols pass; `node tools/sim.mjs`)

| Strategy (sol 1) | Score | How it ends |
| --- | --- | --- |
| Warnings + slope (intended) | **18** | finishes, 5 recharges, 1 sample |
| Avoid after any warning | 12 | battery dies on row 12 |
| Slope only (ignores haze) | 9 | storm, row 5 |
| Always Go | 5 | sand, row 3 |
| Always Avoid | 9 | battery |
| Random | 4.9 | — |
| Hindsight ceiling | 19 | knows the false alarm |

The checks also verify foreseeability. Sand only follows soft and never sits on steep ground,
storms only follow haze, soft before non-steep is always sand, the battery card follows the rule,
and some warnings are false alarms. `node tools/gen.mjs 4 --write` regenerates sols 2–5 under the
same checks.

## Files

- `web/`: the game. `engine.js` holds the rules (pure). `analysis.js` holds the strategies and
  checks. `screen.js` is the dot-matrix canvas, `effects.js` the deaths, and `game.js` the loop,
  cards and replay. `deck.json` holds the sols; `map.json` holds contours and route.
- `tools/prep.py` builds `map.json` and `rows.json` from the DEM, traverse and MEDA tau (needs
  `.venv`: numpy scipy rasterio contourpy pillow).
- `tools/sim.mjs` runs the strategy simulator, and `tools/gen.mjs` the new-sol generator.
- `tools/agent-play.mjs` is a turn-by-turn harness used for the blind agent playtest.
- `tools/film.mjs` records the film, and `tools/shot.mjs` + `tools/montage.py` make review stills.
- `chronology/` holds the checkpoints.

## Honesty

Real: Jezero CTX DEM contours, the Perseverance traverse (sols 14–1980, 45 km in 14 equal rows)
and the slope cards. On sol 1, haze sits on the two rows where same-sol MEDA/TIRS tau ran highest.
Authored: ground, sand, storms, the late haze, and all of sols 2–5. The battery is simulated:
Perseverance is nuclear-powered. The footer says so: *real terrain + route · simulated hazards*.
