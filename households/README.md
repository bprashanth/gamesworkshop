# Households

Playable Hard prototype, isolated from Rover Easy/Medium. Six turns, four teams,
three extra checks and two interventions per team. The default demo seed is 15.

## Play

From the repository root:

```sh
python3 paperweights/serve.py --rover-only --bind 0.0.0.0
```

Open http://localhost:8684/paperweights/web/ and choose Hard, or open
http://100.82.28.38:8684/households/game.html over Tailscale.

- One card opens free each turn. Audience polls use all revealed cards.
- A hidden card costs one check. Checks last for the whole run.
- Skip advances unless a one-shot Dropout event occurs. Attendance is a clue,
  not a direct preview of that event.
- Intervene protects this turn and costs one of the two interventions. Spending
  it on a safe turn does not eliminate the team. It also lowers next-turn
  pressure through the context used to generate that turn.
- Six survived turns finish. A losing turn reveals the cards so the cause is visible.
- Teams act independently. Team Reset replays that team; top Reset replays all.
- New run advances the seed. Use `?seed=18` to share an exact run.
- Routes branch according to Skip/Intervene while every team has the same six-month
  finish line. Calendar mode is removed. Easy/Medium retain their original Rover rules.

Allow roughly 20 seconds per team decision: 24 decisions is eight minutes,
excluding the introduction. This is a facilitation estimate, not a measured audience time.

## Model and paper

[Model details](MODEL.md) - [Playthrough findings](../narrative/household_one_shot_routes.md)

The audience is a synthetic historical model. It never reads hidden current
outcomes when polling. Colors summarize previous survey context; they are not
wealth labels or universal risk rankings. Loan and bad harvest increase risk but
are not themselves death cards.

This is digital-only. The [paper study](paper.html) is illustrative and the existing
Rover PDFs do not match HH2. Exact printed audience votes remain separate work.

## Review and development

The selected icon study remains at `index.html`. Its standalone server on port
8685 serves that visual study only. Use port 8684 for gameplay and cross-mode links.

Refresh the assembled gameplay site after edits:

```sh
python3 paperweights/build_site.py --output paperweights/out/rover-review
node households/test-model.mjs
node households/playtest.mjs
node households/test-routes.mjs
node households/compare-medium.mjs
```

The browser scripts use the repository's installed Playwright. Local screenshots,
logs and detailed runs are in ignored `households/out/`, overwritten on each run.
The narrative report records the reviewed findings without checking in screenshot archives.

## Evidence study

[Real-data contour study](http://100.82.28.38:8684/households/evidence.html) -
[Sources, interpretation and route design](../narrative/household_evidence_landscape.md).
This separate study uses government attendance tables. HH2 game probabilities
remain synthetic; the study does not calibrate intervention effects.

## Automation handoff trial

Easy keeps human Go/Avoid decisions. Medium adds AI for Go/Avoid estimates;
Audience supplies only card suggestions. Hard moves both estimates into AI,
while Audience spends one of three consultations with the room and does not
produce a machine vote. Hard retains three extra card reveals separately from
those consultations, plus its existing two interventions. Harvest icons now
use three grains, two grains, and one drooping grain.

Rollback baseline: git tag `trial-before-ai-handoff-2026-10-19` (commit
`3f7c3b4`). The prior game can be run from a separate worktree at that tag.

[Illustrative terrain preview](http://100.82.28.38:8684/households/landscape.html)
adds relief, zoom and four route sketches. It transforms the measured attendance
values into terrain; it is not a historical or forecast geographic map. See
[transformation notes](../narrative/household_illustrative_terrain.md).
