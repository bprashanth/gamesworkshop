# gamesworkshop

Games for learning how evidence changes decisions, and who bears the consequences
when we act without enough of it.

## Run Rover Run

From the repository root, with Python 3:

```sh
python3 paperweights/serve.py --rover-only
```

This assembles and serves both versions on port **8684**; no Python packages or
JavaScript build are needed just to play.

- **[Competitive](http://localhost:8684/paperweights/web/)** - current PW6 prototype,
  four independent teams on one shared map. Opens in Indicators.
- **[Collaborative](http://localhost:8684/)** - the original whole-room Rover game.

The Competitive/Collaborative selector switches between them. Competitive has a
separate Rover/Households selector and three learning stages. Collaborative keeps
its original difficulty rules.

For a projector or another device on your network:

```sh
python3 paperweights/serve.py --rover-only --bind 0.0.0.0
```

Use the host's LAN/Tailscale address with port 8684 and the same paths above. The
competitive layout fits typical projector/laptop screens; browser fullscreen gives
more room. To refresh an already-running server after edits:

```sh
python3 paperweights/build_site.py --output paperweights/out/rover-review
```

## Competitive - Rover and Households

Use the **Rover / Households** switch to compare both settings. Each uses the same
Mars map, card layout, four teams and six turns. Decisions branch the routes.
The stage selector is independent of the scenario:

| Stage | Cards | AI | Audience |
| --- | --- | --- | --- |
| Risks | All face up | None | Advise Go/Avoid |
| Indicators | One free reveal | Go/Avoid estimate | Suggest which card to reveal |
| Judgement | One free reveal | Action and reveal suggestions | Human advice, three consultations |

Indicators and Judgement allow three extra card reveals per team across the run.
A reveal clears old estimates; press AI again to update. Lightning bolts show the
reveal quota in Indicators and the consultation quota in Judgement. Judgement's
extra reveals remain a separate limit. Team Reset is independent; Reset restarts
all teams. Dark is default, Light is available. The highlighted column is ahead
of the marker in Risks and at its position in later stages.

Rover hazards are dead battery, storm and sand pit. Households uses a simplified
teaching rule in Risks/Indicators: a filled hazard or the two dotted indicators
together requires intervention. Judgement hides hazard/indicator styling and
uses uncertain household dropout outcomes instead. These are synthetic teaching
rules, not empirical household predictions.

Rover and household teaching stages eliminate a team for either missing a hazard
or avoiding a safe square. Household Judgement retains two interventions: they
protect that turn, and unnecessary intervention spends support without eliminating
the team. This remaining consequence difference is intentional in this trial.

[Current stage design](narrative/shared_scenarios_stages.md) -
[Household model](households/MODEL.md) -
[PW6 evidence model](paperweights/competition/EVIDENCE.md) -
[Current summary](paperweights/SUMMARY.md).

## Sheets and printouts

**The existing printable packs are PW5. The current game is PW6.** PW5 sheets use
single-icon lookups; they cannot reproduce PW6's cumulative-evidence polls. Use the
current game with its simulated audience while the new paper encoding is reviewed.
Do not distribute the old sheets expecting their votes to match PW6.

Only one reviewed print snapshot is kept in Git:
**[paperweights/printouts/latest/duplex.pdf](paperweights/printouts/latest/duplex.pdf)**
(currently PW5, 200 physical sheets / 400 PDF pages). Its `PRINT.md` records the
pack ID and team assignments; `verification.json` records the output checks.

Print **A4, actual size, color, double-sided, long-edge flip**. Each sheet has a
Swift-style word lookup on the front and Rover lookup on the back.

[Print locations and regeneration](paperweights/printouts/README.md) explains how
to regenerate any supported audience size and replace the latest snapshot. Full
packs, separate-side PDFs and historical previews stay in ignored local folders.
The generator does not change the current game unless `--install-game` is given.
The current PW6 experiment still needs a compatible paper encoding.

## Collaborative - the original game

The public deployment address is **[rover-run.netlify.app](https://rover-run.netlify.app/)**.
The root page is the collaborative game. As checked on 18 October 2026, the public
competitive path is not deployed yet (404). This branch's Netlify build also assembles
the competitive page at `/paperweights/web/`; that page reflects this version only
after deployment. Running locally does not update the hosted site.

The room drives one rover and discovers indicators across a fixed map. Go, Avoid
and Recharge balance survival, time and score. Easy exposes the board; Medium
hides the battery relationship; Hard limits which cards can be inspected. These
rules differ from the competitive sudden-death game.

- [Collaborative rules, controls and implementation](space/rover-run/src/README.md)
- [Facilitation: indicators and patterns](narrative/INDICATORS.md)
- [Rulebook](space/rover-run/rulebook_v2.md)
- [Why this workshop focuses on data programs](narrative/ROVER_DATA_PROGRAMS.md)
- [Adapting the game to your own data](narrative/REUSE.md)

The original standalone development server is still available with
`python3 space/rover-run/src/serve.py` on port 8670. Use the combined server above
for the current two-stage setup.

## Other projects and records

- [Servers](servers/README.md) - the indicator exercise retold as running a service.
- [Space anchor films](space/README.md) and [narrative handoff](narrative/SPACE_ANCHORS.md)
  - film projects/media remain local.
- [Crew](crew/README.md), [Fieldwork](fieldwork/README.md), [Idlisseus](idlisseus/)
  - earlier games. `python3 play.py` selects a terminal game.
- [Chronology](chronology/) - checkpoints, design decisions and validation results.

## Repository contents

Local credentials, environment files, dependencies, editor swaps, render output and
large film/audio/raster assets are ignored. One latest print PDF, static game data and public Fieldwork datasets are
intentionally tracked. Older print outputs and the independent `moon/claude/`
Moon Run prototype stay local and ignored. Neither Rover stage depends on Moon Run. Ignore rules do not remove already-tracked files or history.
