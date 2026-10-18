# Servers

**Rover Run, retold for running a small online service.** Should you scale up your servers, or
spend the month on marketing? Over 14 months, three things can end the run: your users vanish,
your servers burn, or the money runs out. As in Rover Run, nobody explains the rules. The cards are
the data, and the room works out which indicators come before which failure.

```sh
python3 servers/serve.py        # from the repo root; binds 0.0.0.0:8672
```

Open <http://localhost:8672/web/> (Tailscale: <http://100.82.28.38:8672/web/>).

It is the same game as [Rover Run](../space/rover-run/src/README.md): the same engine shape,
screen, modes, lives, graph and look, with the meanings swapped. The facilitator exercise in
[narrative/INDICATORS.md](../narrative/INDICATORS.md) carries over step for step.

## The translation

| Rover Run | Servers |
| --- | --- |
| 14 squares of the Jezero route | **14 months**, one strip each |
| The contour map (lines closer together = steep) | **A demand chart**: the curve climbs gently in quiet months and steeply in floods, and the lines bunch up where it is steep |
| Slope: flat / slope / steep | **Queries**: whisper / chatter / flood |
| Ground: firm / soft / **SAND** | **Users**: many (a walker with several dogs) / few (one dog) / **GONE** (an empty leash) |
| Dust: clear / haze / **STORM** | **Servers**: cool / warm (heat lines) / **BURNING** (flames) |
| Battery: full / dead | **Funds**: full / empty |
| Go / Avoid / Recharge | **Scale up / Market / Apply for funds** (keys S, M, F) |
| Sand-trap death (sandstorm screen) | users GONE: **washout** (the sandstorm screen) |
| Storm death | servers BURNING: **burn** (the chart catches fire from the bottom, dots rise as embers) |
| Dead-battery death (TV off) | **broke** (TV off) |

## Rules

- **One action per month:**
  - **Scale up:** serve the month ahead; it scores 1.
  - **Market:** spend the month on outreach instead; always safe, scores nothing.
  - **Apply for funds:** you stay where you are; funds become full.
- **The run ends if you scale into a GONE month** (servers for nobody) **or a BURNING month** (new
  servers arrive a month too late).
- **The funds card is the money you arrive with.** It is empty in the month right after a hazard
  you marketed your way round. Before moving on from an empty month, apply for funds, or you go
  broke.
- **3 lives.** A death costs one, and you restart that month.
- 22 turns. Score = months scaled + 3 for making it through the year.
- **Modes:**
  - **Easy:** the whole board face up.
  - **Medium (default):** the month ahead shows queries, users and servers; funds stay hidden until
    you're past.
  - **Hard:** pick 2 of the month ahead's 4 cards.

## The patterns (facilitator only)

| Month | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Queries | whisper | chatter | chatter | flood | flood | whisper | chatter | flood | flood | whisper | whisper | chatter | flood | chatter |
| Users | many | few | **GONE** | few | many | few | **GONE** | few | many | few | **GONE** | few | many | many |
| Servers | warm | cool | warm | **BURNING** | warm | cool | warm | **BURNING** | warm | cool | cool | warm | **BURNING** | cool |
| Funds | full | full | full | **empty** | **empty** | full | full | **empty** | **empty** | full | full | **empty** | full | **empty** |

1. **Users GONE always comes right after a month of few users, and never in a flood month.**
   Few users going into a flood are a false alarm (months 4, 8, 12 → 5, 9, 13): the surge brings
   them back.
2. **Servers BURNING always comes right after a warm month, and only with real traffic.** Warm
   before a whisper never burns (months 5, 9 → 6, 10). Warm before chatter or a flood burns 3 times
   in 4 (it does at 4, 8, 13; it doesn't at 2). Warmth alone isn't enough, and traffic alone isn't
   enough; together they raise the odds.
3. **Funds are empty in the month right after each GONE or BURNING**: marketing your way round a
   failure spends the money, so you must raise more before you move on.

The deck is authored and illustrative, the same for every table.

## Tuning (`node servers/tools/sim.mjs`; every check passes)

The numbers match Rover Run's exactly, so the two games teach the same thing:

| Strategy | Score | Rover Run |
| --- | --- | --- |
| Hard: look at users + servers of the month ahead | **11** | 11 |
| The model: GONE risk = few before and not a flood; BURNING risk = warm before and real traffic | 10 | 10 |
| Hard: look at queries + funds (funds say nothing about the month ahead) | 10 | 10 |
| Ignore the query level | 8 | 8 |
| Market after any warning | 6 | 6 |
| Always market | 3 | 3 |
| Always scale · watch servers only (ignore users) · never apply | 2 · 1 · 1 | 2 · 2 · 2 |
| Random | 1.0 | 1.0 |

## Files

| Path | What |
| --- | --- |
| `web/engine.js` | The rules (pure). |
| `web/analysis.js` | The strategies and pattern checks. |
| `web/game.js` | The page. |
| `web/symbols.js` | Glyphs: dogs and walker, server rack, query bubbles, funds battery. |
| `web/effects.js` | Death screens (washout, burn, TV off). |
| `web/deck.json` | The 14 months. |
| `web/map.json` | The demand chart. |
| `tools/chart.mjs` | Builds the chart from the deck's query levels. |
| `tools/sim.mjs` | Strategy simulator and checks. |
| `tools/agent-play.mjs` | Blind-playtest harness (`new`, `level`, `turn`). |
| `tools/shot.mjs`, `tools/film.mjs` | Review screenshots and film recording. |

History: [chronology/2026-10-06-servers.md](../chronology/2026-10-06-servers.md).
