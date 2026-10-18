# Real Mars workshop feasibility — 6 October 2026

## Request and boundaries

Evaluate (1) a larger study board with more environmental variables and visually discoverable rules, and (2) simple audience indicators compiled into a more detailed model that navigates Mars terrain. Preserve the Rover aesthetic and the ability to verify examples on a map. Main `space/rover-run/src/` is read-only. This is an evaluation, not authorisation to replace the game.

Experiments: `space/rover-run/benchmarks/mars-real/`. New raw downloads and large assets: `/mnt/seagate/gamesworkshop/rover-run/mars-real/`. Existing Seagate inputs are read-only. Source-tree hashes recorded in `src-before.json` (excluding environments, dependency caches and symlinks).

## Initial inspection

- Existing assets include a 20 m CTX elevation model, Perseverance traverse/waypoints, regional geology, aerosol retrievals, derived pressure/temperature histories and sparse rock samples.
- The existing game only claims real terrain/route/slope. Its sand, storms and battery laws are authored.
- Geology documentation warns of 100–200 m offsets against the operations basemap; geological units are not direct soil-strength measurements.
- The promising 500-sol Perseverance slip dataset is explicitly embargoed until 2027-01-31 at JPL, DOI `10.48577/jpl.8DAJJE`. No attempt to access embargoed files.
- Found another public lead: Hindsight, Zenodo `10.5281/zenodo.21094815`, a 3.43 GB archive for sols 1040–1055. Source README explicitly says terrain labels and slope/velocity channels are absent. Investigating the released telemetry/events before declaring it useful.

## Work in progress

Three delegated audits: terrain aggregation and route planning; chronological environmental prediction; released Hindsight data and outcomes. Scripts and small results remain in the experiment directory. Outcome proxies, authored navigation costs and observed events must stay distinct.

## Completed evaluation

Full report: [mars-real/README.md](../space/rover-run/benchmarks/mars-real/README.md). Rule/interaction contract: [AUDIENCE-MODEL.md](../space/rover-run/benchmarks/mars-real/AUDIENCE-MODEL.md).

- Terrain: approximately 45.93 km of within-feature route geometry. 100 equal-distance bins remain about 459 m each. Smoothed median card categories disagree with local DEM categories at 42.2% of sampled points. Four real-DEM planning patches show routes changing under continuous and binned preferences; categorical saturation is visible on the steep rim. This is a path-planning simulation, not physical rover-success validation.
- Weather: 1,578 measured sols but only eight contiguous runs above the nominated 0.6 aerosol threshold. A prior-sol 0.4 warning has 9 true/87 false alarms in the later period; just two true warnings are new onsets. The record includes ice-cloud opacity, not just dust, and no rover death label.
- Hindsight: bounded 240-second partial archive download to Seagate recovered all 16 EVR files, 914,316 event rows and 1,433 actual slip observations. There are 48 mobility fault messages in 11 descriptive time clusters, not 48 independent failures. All measured slip is below its logged operational slip limit.
- Pairing: 1,266 slip readings have an eligible preceding position within 120 seconds; they occupy 58 distinct 20 m DEM cells across nine sols. The existing 8° map category misses all 123 paired readings above an illustrative 0.15 slip cutoff. This is an inspected descriptive comparison, not a sealed test or a general claim about slope.
- Conclusion: retain four readable rows and expand cases before adding variables. A simple-rule/complex-planner architecture works mechanically. A credible empirical board still needs image-grounded environmental observations, matching outcome definitions and more independent drives. Real terrain with openly authored outcomes remains a viable separate option.

## Review and preservation

A separate review identified different board/planner measurement scales, shared-DEM evaluation, shortest-path ties and the need to report exposure in metres as well as percentages. These limitations are incorporated in the report. The first SVG screenshot attempt timed out; a second Playwright render with GPU disabled succeeded. Its contact sheet was visually inspected; screenshot is on Seagate at `gamesworkshop/rover-run/mars-real/planning-review.png`.

Main game remains untouched. Final source hashes and artifact assertions are recorded in the benchmark's `validation.json`. No server, live UI or empirical rover-survival model was deployed. No external contacts were messaged, and no embargoed data was accessed.
