# Households

Playable Hard prototype, isolated from Rover Easy/Medium. Six turns, four teams,
three extra checks and two interventions per team. The default demo seed is 18.

## Play

From the repository root:

```sh
python3 paperweights/serve.py --rover-only --bind 0.0.0.0
```

Open http://localhost:8684/paperweights/web/ and choose Hard, or open
http://100.82.28.38:8684/households/game.html over Tailscale.

- One card opens free each turn. Audience polls use all revealed cards.
- A hidden card costs one check. Checks last for the whole run.
- Skip advances unless the attendance outcome is Dropout.
- Intervene protects this turn and costs one of the two interventions. Spending
  it on a safe turn does not eliminate the team.
- Six survived turns finish. A losing turn reveals the cards so the cause is visible.
- Teams act independently. Team Reset replays that team; top Reset replays all.
- New run advances the seed. Use `?seed=18` to share an exact run.
- Map skin switches between the original Rover map and a six-fortnight Calendar,
  without resetting progress. Easy and Medium switch back to the unchanged Rover rules.

Allow roughly 20 seconds per team decision: 24 decisions is eight minutes,
excluding the introduction. This is a facilitation estimate, not a measured audience time.

## Model and paper

[Model details](MODEL.md) - [Playthrough findings](../narrative/household_hard_playtest.md)

The audience is a synthetic historical model. It never reads hidden current
outcomes when polling. Colors summarize previous survey context; they are not
wealth labels or universal risk rankings. Loan and bad harvest increase risk but
are not themselves death cards.

This is digital-only. The [paper study](paper.html) is illustrative and the existing
Rover PDFs do not match HH1. Exact printed audience votes remain separate work.

## Review and development

The selected icon study remains at `index.html`. Its standalone server on port
8685 serves that visual study only. Use port 8684 for gameplay and cross-mode links.

Refresh the assembled gameplay site after edits:

```sh
python3 paperweights/build_site.py --output paperweights/out/rover-review
node households/test-model.mjs
node households/playtest.mjs
node households/compare-medium.mjs
```

The browser scripts use the repository's installed Playwright. Local screenshots,
logs and detailed runs are in ignored `households/out/`, overwritten on each run.
The narrative report records the reviewed findings without checking in screenshot archives.
