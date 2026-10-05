# Mars indicator revision and Moon fixed-map experiment

## Request

Retain the two approved Mars themes. Stack real terrain, environment (`tau`) and
rock readings at bottom left; move `real terrain + route` to the old watermark
position and replace `sol` with `days`. Try the same restrained fixed-map style
for the Moon without overwriting the earlier film.

## Delivered design

- Mars: new versioned `elevation-v2.mp4` / `contours-v2.mp4`; original files untouched.
  All text changes applied. DEM-derived terrain is continuous along the route.
  Tau is a per-sol median of cached MEDA/TIRS retrievals, with explicit gaps.
  Rock uses the named latest acquired core, not an invented reading at every stop.
  Both new/confirmation area marks and their simulated-outcome disclaimer remain.
- Moon: new own renderer in `space/moon-model-video/codex/versions/fixed-map/`.
  Real cached Horizons raw vectors independently parsed; one outbound lunar pass,
  two simultaneous fixed map scales, no cinematic cuts, no audio or decorative fields.
  Burn window follows NASA's 12:44 UTC / 150-second account. Three illustrative
  correction residuals plus countdown are visibly labelled simulated. Day/night
  illumination and Earth-centre lunar obstruction are computed separately.
- Shared review page stays on Codex port 8651, distinct from Claude's servers.
  Raw public datasets and the source-backed sample inventory are reused openly;
  no Claude graphics, movie frames or scene code are reused.

## Preservation

`space/moon-model-video/codex/assets/moon-mission-v4.mp4` retains SHA-256
`d0741b5667984e45653d3feb67e5276900c711e5ee7469ae4adaf899e3b275b5`.
Moon v1–v4 sources and players are unchanged except for a README link to the experiment.

## Validation and restrictions

Review stills cover transit, occultation, burn, closest approach and contact recovery.
`benchmarks/mars-v2-moon-fixed-map.json` records independent full video decodes,
frame counts, checksums, clock monotonicity, occulted burn and prior-video integrity.
Existing original benchmarks remain available.

This session cannot create network sockets: attempted server start raises
`PermissionError: Operation not permitted`; live Tailscale playback cannot be
verified or restarted here. The existing page and versioned assets are updated
on disk. The review server command remains documented in the READMEs.
An attempted read-only Cursor CLI QA delegation failed with DNS `EAI_AGAIN`;
rendering and validation were completed locally by Codex instead.
