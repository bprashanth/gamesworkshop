# Print location and regeneration

## One tracked snapshot

[latest/duplex.pdf](latest/duplex.pdf) is the **only Paper Weights print PDF kept in
Git**. Update this same path as the design changes. Its companions are
[PRINT.md](latest/PRINT.md) (pack ID, print directions and team assignments) and
[verification.json](latest/verification.json) (generated output checks).

The current snapshot is **PW5-15-200-b089066934**, 200 physical sheets / 400 PDF
pages: Swift word fronts, Rover backs. Print A4, actual size, color, double-sided,
**flip on long edge**. Test one physical sheet before printing the full pack.

**The live digital experiment is PW6. This PW5 snapshot is the latest printed
design, not a compatible PW6 audience pack.** PW6 combines multiple revealed cues;
its paper encoding is not implemented yet. Do not print PW5 for a PW6 event.

## Generate locally

From the repository root:

```sh
python3 -m venv paperweights/.venv
paperweights/.venv/bin/python -m pip install -r paperweights/requirements.txt
paperweights/.venv/bin/python paperweights/build_printouts.py --sheets 15 --seed 15
```

Use any count from 12 to 200. Full output goes to
`paperweights/printouts/<pack-id>/`, an **ignored local directory**. It includes
`duplex.pdf`, separate `words.pdf` / `rover.pdf`, HTML/JSON sources, previews,
`manifest.json`, `PRINT.md` and `verification.json`. The generator checks all pages,
printed answers/colors, group tallies, bounds and duplex formatting before finishing.
It currently generates PW5. Generation alone does not alter the PW6 game catalog.

To regenerate the reviewed 200-person pack and replace the one tracked snapshot:

```sh
paperweights/.venv/bin/python paperweights/build_printouts.py --sheets 200 --seed 15 --update-latest
```

Review the resulting PDF, then commit `printouts/latest/` together with the design
or generator changes. `--update-latest` copies only the verified duplex PDF,
PRINT.md and verification.json; full local output remains at its pack-ID path.

`--install-game` explicitly installs a generated PW5 pack in `web/packs/` and
replaces the active catalog. **Do not use it for the PW6 game.** It is an opt-in
legacy operation, not required to print or update the snapshot.

To refresh the local site with the latest printable snapshot:

```sh
python3 paperweights/build_site.py --output paperweights/out/rover-review
```

It serves `/paperweights/printouts/latest/duplex.pdf`. A clean site build copies
only this tracked snapshot, not ignored local print archives.

## Historical output stays local

Older packs remain on the workshop machine under `printouts/PW*/` and
`printouts/archive/`. Standalone word output is in `words/`; earlier Rover studies
are in `rover/output/`, `rover/output-200/`, and the generated files alongside
`rover/concepts/`, `rover/context/`, `rover/themes/`. The paused sentence benchmark
has its own `sentence-lab/printouts/`. These generated files are no longer tracked;
a fresh clone does not contain them. Generator scripts and design READMEs remain.

Older renderers can be run from the repository root after installing the same
requirements: `paperweights/.venv/bin/python paperweights/generator.py --help`,
`paperweights/rover/concepts/render.py` and `paperweights/rover/context/render.py`
(using that Python interpreter). Generate context output before running
`paperweights/rover/themes/render.py`, which consumes its generated JSON.
These are historical designs, not the current game sheets.

See [SUMMARY.md](../SUMMARY.md) for the current game state. Changes and review
checkpoints are recorded in `chronology/`.
