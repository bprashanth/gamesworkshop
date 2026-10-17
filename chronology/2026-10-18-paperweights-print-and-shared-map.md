# Final PW5 sheets and shared-map preview - 18 October 2026

User accepted the gameplay direction and requested right-aligned lightning bolts,
percentage-only polls, final sheets, a summary/checkpoint, and a separate mockup
with one map, four rover markers and four card panels.

Working UI now places tokens at the far right of the Go/Avoid/Audience row. Polls
show only percentages: no total-voter heading or per-answer fractions. Data and
probabilities are unchanged. Existing gameplay tests now assert both UI changes.

Print generator now uses mixed.py (PW5), removes obsolete fixed-model headings,
and produces word fronts/Rover backs with the unchanged 24-pair minimal layout,
white backgrounds, team labels, ASCII arrows and bottom hazard strip. Final packs
are in paperweights/printouts/PW5-15-15-92d56e90d0 and
paperweights/printouts/PW5-15-200-b089066934. Print duplex.pdf, A4 actual size, color,
long-edge flip. Pack IDs/data match the game; no distribution changes were made.

Documentation: paperweights/printouts/README.md catalogs current final files and
regeneration commands; each pack has PRINT.md, manifest.json, verification.json,
separate-side PDFs and previews. paperweights/SUMMARY.md is the current-state
summary. README and narrative/PAPERWEIGHTS.md link it. Older packs remain history.

Separate interactive layout preview: paperweights/web/shared-map.html, reusing
the existing game engine. One enlarged reference-terrain map, four letter-labelled
rover positions and four panels underneath. Teams still have independent hazard
rows. Labels have leader lines so coincident markers remain identifiable without
assigning new colors that could be confused with lookup contexts. Production
four-map layout unchanged. Screenshot shared-map-preview.png stages teams at
turns A3/B2/C4/D1 to show spacing; it is not a measured audience playthrough.
Shared column highlighting and eliminated-marker presentation are still mockup
limitations to resolve if this layout is selected.

Validation: gameplay browser suite passes, including the new percentage/token
checks. Preview renders without browser errors at 1600x1000; desktop screenshot
reviewed. PDF output is checked for row answers/colors/team counts, duplex pairing,
page bounds, arrow style and correct pack identity. Independent PDF audit is run
against the selectable game packs before delivery. No public deployment.

Final validation completed: 15/200 packs contain 30/400 duplex pages. Independent
PDF extraction confirms all answer rows, pairing and game tallies. Eleven model
tests pass; preview mobile has no horizontal overflow. Both PDFs, interactive
mockup and preview image return HTTP 200 through the existing Tailscale server.
