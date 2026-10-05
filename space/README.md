# Space — final anchor films

> The films and their source projects (`space/mars-rover-video/`, `space/moon-model-video/`) are kept
> on the workshop machine, not in git, so links into them resolve there only. The game they set up is
> [Rover Run](rover-run/README.md).

**[Watch both finals and earlier versions](http://100.82.28.38:8651/)** (Tailscale).

| Final for now | What to watch |
| --- | --- |
| [Mars contours, 36 s](mars-rover-video/codex/media/contours-v3.mp4) | One real rover path; new versus confirmation areas; terrain, tau, rock, days and cumulative map-route distance. |
| [Moon fixed maps, 42 s](moon-model-video/codex/versions/fixed-map/moon-fixed-map.mp4) | One lunar pass; synchronized fixed overview/detail; Earth-link loss and explicitly simulated burn corrections. |

**[Narrative + data + game-design handoff](../narrative/SPACE_ANCHORS.md)** explains
the shared idea: bounded local action depends on knowing which conditions matter,
measuring them consistently, and checking when a prediction remains trustworthy.

## View locally

From the repo root: `python3 space/mars-rover-video/codex/serve.py --port 8651`.
Open `http://localhost:8651/`; the server binds to `0.0.0.0`.
Port 8651 is separate from Claude's servers. The latest restricted session could
not verify live network access; this command starts playback outside that restriction.

## Sources and history

- [Mars technical notes](mars-rover-video/codex/README.md) · [Moon technical notes](moon-model-video/codex/versions/fixed-map/README.md)
- [Final checkpoint](../chronology/2026-10-04-space-anchor-finals.md) · [Validation](../benchmarks/space-anchor-finals.json)
- [Earlier Codex Moon gallery](moon-model-video/codex/index.html), now also including both finals.
- Claude's separate [Moon work](moon-model-video/claude/) and [Mars work](mars-rover-video/claude/), including the reusable [camera window](moon-model-video/claude/camwin/README.md).
- [Crew](../crew/README.md) · [Other workshop projects](../README.md)

Both finals are workspace files; older archived masters may require the Seagate
drive. Shared source data are credited; final Codex films use independent renderers.
