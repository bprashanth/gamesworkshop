# Household illustrative terrain

Preview: `/households/landscape.html`.

This expands the measured-value study into a broad topographic illustration. It uses the same twenty NSS 2017-18 attendance cells for either rural or urban India. The source, exact values and definitions remain available in `households/research/attendance.json` and the original `/households/evidence.html` view.

## Transformation

Each measured cell contributes a Gaussian ridge. Lower net attendance creates greater amplitude. The relief slider applies a power transform to those amplitudes. A deterministic warped layout and small surface folds produce the terrain texture. Positions, distances, folds and ridge shapes are designed, not surveyed. This is a visual illustration informed by measured data, not a statistically estimated geographical surface.

The four candidate traverses minimize a designed cost combining terrain height, turning and separate corridors. They demonstrate visual route options only. They are not observed household histories, causal intervention estimates or the game's live action paths.

The broad view, zoom control, sparse luminous contour dots and muted route colors follow the Rover visual vocabulary. No coordinate axes, point labels or source explanation appear on the terrain itself. A concise illustrative-terrain caption stays visible; details sit under About this map.

## What this does not claim

The complement of net attendance is not dropout probability: some children attend a different education level. No monthly outcome odds are inferred here. No ten-year past or future measurements have been invented. The game remains separate from this study; integration would need a deliberate visual mapping of the existing simulated state onto the illustrated terrain.

## Validation

Playwright checked 1440 x 900, sector selection, zoom and route toggle without browser errors. Screenshots are local under `households/out/landscape-wide.png` and `households/out/landscape-region.png`. Rebuild the review site with `python3 paperweights/build_site.py --output paperweights/out/rover-review`.

## Hard map integration

Hard now uses this rural relief as its contour background. The study and game
share `households/terrain.js` so their relief transformation stays identical.
The existing route, action-dependent branches, month boundaries and outcomes
remain unchanged. This is a visual replacement, not a new risk model. Medium
and collaborative maps retain the original Mars terrain.
