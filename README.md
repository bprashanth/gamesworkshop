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
  four independent teams on one shared map. Opens in Medium.
- **[Collaborative](http://localhost:8684/)** - the original whole-room Rover game.

The stage dropdown switches between them. Each game has its own difficulty selector;
“Medium” means different mechanics in the two versions.

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

## Competitive - Easy and Medium

Four teams A-D play independently. Each has six turns. A team's Reset replays its
route without affecting the other teams; the top Reset restarts everyone. Dark is
the default, with Light available. Select the audience pack you want to simulate
(15 or 200 people). Clicking a team panel highlights its column on the map.

**Easy - learn which outcomes matter.** All four cards are visible. Choose **Avoid**
if any card shows storm, dead battery or sand pit; otherwise choose **Go**. The
highlight is ahead of the rover. This establishes the consequential outcomes before
introducing incomplete information.

**Medium - decide whether to act or gather more evidence.** One card starts face up.
Click **Audience** for simulated votes: Go, Avoid, or which hidden category to flip.
The current PW6 audience uses all icon/color pairs revealed in that turn. Click a
hidden card to inspect it and poll again. Each team has **three extra checks across
the entire run**, shown as stick figures. Opening cards and polls are free; extra
reveals spend checks. The highlighted column contains the rover.

When checks run out, the audience gives only Go/Avoid votes from matching historical
examples. Advice can be wrong. These percentages are action votes, not a guarantee
or a literal display of the probability of death. In both modes, Go into danger or
Avoid a safe square and that team is out. Six correct decisions finish. OUT and the
team's map marker turn red; FINISHED uses the normal text color.

- [Teaching progression: Easy to Medium](narrative/rover_mode_transitions.md)
- [Current state and limitations](paperweights/SUMMARY.md)
- [PW6 evidence model and validation](paperweights/competition/EVIDENCE.md)
- [Paper Weights setup and earlier experiments](paperweights/README.md)

## Sheets and printouts

**The existing printable packs are PW5. The current game is PW6.** PW5 sheets use
single-icon lookups; they cannot reproduce PW6's cumulative-evidence polls. Use the
current game with its simulated audience while the new paper encoding is reviewed.
Do not distribute the old sheets expecting their votes to match PW6.

The completed PW5 packs are stored under **`paperweights/printouts/<pack-id>/`**:

| Audience | Duplex file | Physical sheets / PDF pages |
| --- | --- | --- |
| 15 | [PW5 duplex PDF](paperweights/printouts/PW5-15-15-92d56e90d0/duplex.pdf) | 15 / 30 |
| 200 | [PW5 duplex PDF](paperweights/printouts/PW5-15-200-b089066934/duplex.pdf) | 200 / 400 |

Each physical sheet has a Swift-style word lookup on the front and a Rover lookup
on the back. Print **A4, actual size, color, double-sided, long-edge flip**. Keep
Team A-D stacks separate and match the pack ID to the corresponding game version.
Each pack includes `PRINT.md` (printing and team assignments), `manifest.json`
(exact data), `verification.json`, separate-side PDFs and preview images.

The [print catalog](paperweights/printouts/README.md) documents files and regeneration.
The existing PDF generator targets PW5 and updates the game pack catalog; **do not
run it as a PW6 print command**. Older PW2/PW3/PW4 packs are retained as design history.

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
large film/audio/raster assets are ignored. Printable PDFs, previews, static game
data and public Fieldwork datasets are intentionally tracked so a checkout contains
the reviewed artifacts. Ignore rules do not remove already-tracked files or history.
