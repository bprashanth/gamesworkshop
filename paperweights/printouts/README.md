# Final Paper Weights print packs

Current game: **PW5**, mixed GO/AVOID/category answers, six turns, three extra reveals.
Each person receives one A4 sheet: Swift word lookup on the front, Rover lookup on
the back. Both sides have 24 pairs, white backgrounds, matching Team A-D labels
and a pack/person identifier. A category answer means vote to flip that category.

| Audience | Print file | Physical sheets | PDF pages |
| --- | --- | --- | --- |
| 15 | [Duplex PDF](PW5-15-15-92d56e90d0/duplex.pdf) | 15 | 30 |
| 200 | [Duplex PDF](PW5-15-200-b089066934/duplex.pdf) | 200 | 400 |

Print A4, actual size, color, double-sided, **flip on long edge**. Check the first
front/back on one physical sheet before printing the whole pack. Select the same
pack ID in the game. Distribute each team's stack to that team; do not mix packs.

Each pack directory contains:

- `duplex.pdf`: the final print file, alternating word fronts and Rover backs.
- `words.pdf`, `rover.pdf`: separate sides for review/manual duplex.
- `*-preview.png`: rendered samples.
- `PRINT.md`: printing directions and physical-sheet/person/team assignment table.
- `manifest.json`: exact audience entries, historical provenance and game routes.
- `verification.json`: generated PDF checks.
- HTML and JSON sources for both sides.

Regenerate from the repository root:

```sh
paperweights/.venv/bin/python paperweights/build_printouts.py --sheets 15 --seed 15
paperweights/.venv/bin/python paperweights/build_printouts.py --sheets 200 --seed 15
paperweights/.venv/bin/python paperweights/tools/verify_print_game.py
python3 paperweights/build_site.py --output paperweights/out/rover-review
```

Other counts from 12 to 200 are supported. Changing seed or attendance creates a
new pack ID. Previous PW2/PW3/PW4 directories are retained as design history, not
current print files. The current game selector lists PW5 only.

For the current state see [SUMMARY.md](../SUMMARY.md); for mechanics and measured
limitations see [MIXED.md](../competition/MIXED.md). Changes are checkpointed under
`chronology/` and the ongoing narrative is `narrative/PAPERWEIGHTS.md`.
