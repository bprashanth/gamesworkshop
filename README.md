# gamesworkshop

Small games that let people discover a difficult relationship by making decisions,
not by sitting through an explanation.

## Rover Run: building indicators and models from data

**[Play Rover Run](http://100.82.28.38:8670/)** (Tailscale) · run it yourself with
`python3 space/rover-run/src/serve.py` (port 8670).

Drive the real Perseverance route across Jezero crater on Mars, square by square. Sand pits,
storms and a dead battery can end the run. Nobody explains the rules: the cards you uncover are the
data, and the room works out the model.

The game is built to teach the core moves of data science to people who don't use the words:

1. **Find the outcome** that matters (what killed the rover).
2. **Find its earliest indicator** (soft ground before sand, haze before a storm).
3. **Check that it is a pattern**, not an anecdote: each hazard recurs on one fixed map.
4. **Correlate over time** (one variable, one square ahead) and **across variables** (sand is
   never on steep ground; storms never on flat ground).
5. **Combine weak signals into a model**: haze alone storms 3 of 6 times; haze *and* a slope storm
   3 of 4. Write the model as one line, then play by it.
6. **Weigh precision against cost**: misses kill, false alarms cost turns, and attention is limited
   (on Hard you see only 2 of the 4 cards of the square ahead; on Medium the battery is hidden
   until you work out what it goes with). Three lives, so dying to learn the map is costly.

- **[Rover Run: how to play, how it's built, tuning, data honesty](space/rover-run/src/README.md)**
- **[Facilitator exercise: building indicators](narrative/INDICATORS.md)**
- **[Reuse it with your own data](narrative/REUSE.md)**: a river, a clinic, a season; for teams and agents
- **[Design history](chronology/2026-10-04-rover-run.md)** · [original rulebook](space/rover-run/rulebook.md)

The map and route are real (JPL CTX DEM, NASA traverse); the hazards are authored and the same for
every table, so a room can replicate a session on paper.

## Also in this repo

- **[Space anchor films](space/README.md):** short Mars and Moon films that set up Rover Run's
  narrative ([handoff](narrative/SPACE_ANCHORS.md)).
- **[Crew](crew/README.md)**, **[Fieldwork](fieldwork/README.md)**, **[Idlisseus](idlisseus/):**
  earlier prototypes. Run `python3 play.py` to choose a terminal game.
- **[Chronology](chronology/)** and **[Benchmarks](benchmarks/)**: decisions, playtests and
  validation. The longer workshop method is in
  [the previous README](chronology/2026-10-04-readme-before-anchor-films.md).
