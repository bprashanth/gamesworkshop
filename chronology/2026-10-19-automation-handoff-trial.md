# Automation handoff and illustrated terrain trial

Pre-change rollback tag: `trial-before-ai-handoff-2026-10-19`, commit `3f7c3b4`.

Implemented the stage handoff: Easy stays human Go/Avoid; Medium separates AI
Go/Avoid from audience flip-only suggestions; Household Hard moves mixed
suggestions into AI and makes Audience a limited human consultation. Three
Hard consultations are separate from its three extra reveals. Reveals clear
stale polls. No new language model integration; existing historical models
power the controls. Print PDFs are not regenerated.

Replaced harvest trees with three block grains for good, two for weak, and
one drooping grain for failed. Reviewed in a game screenshot.

Added households/landscape.html: an illustrative NSS-driven relief landscape
with zoom, rural/urban variants and four route sketches. Data sets ridge
amplitudes; folds, geometry and routes are designed. No invented historical
observations or forecasts. This review page does not replace the playable map.

Validation:
- households/test-handoff.mjs: independent consultation budget, no synthetic
  audience poll, AI, stale poll clearing, team reset.
- households/playtest.mjs: four full runs, seeds 15/16/17/18 finished 2/3/1/0,
  independent teams, resources, navigation and projector fit, no browser errors.
- households/test-model.mjs and test-routes.mjs passed.
- paperweights/tools/play-ai-handoff.mjs and play-evidence.mjs passed exact
  historical percentages, cumulative evidence, budgets and screen layouts.
- Landscape sector, zoom and routes toggles browser checked; screenshots
  inspected under households/out. Medium and Hard screenshots also inspected.

Design notes: narrative/automation_handoff_trial.md and
narrative/household_illustrative_terrain.md. Collaborational gameplay unchanged.
