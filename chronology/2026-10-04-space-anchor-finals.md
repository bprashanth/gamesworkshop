# Space anchor finals and game-design handoff

The user accepted Mars contours and the fixed-map Moon as final for now. They
requested a shared gallery, distance beneath days in Mars, a concise repository
README, and an agent-ready narrative about local/remote models and indicator-led
measurement protocols.

## Changes

- Rendered `space/mars-rover-video/codex/media/contours-v3.mp4`: unchanged 36 s
  contour theme, with cumulative map-route kilometres directly below days.
  Distance follows the same route index as the drawn rover marker, is monotonic,
  and ends at approximately 45.18 km. It is not an official mission odometer.
  `contours-v2.mp4` remains intact; elevation and Moon films were not rerendered.
- Kept `space/moon-model-video/codex/versions/fixed-map/moon-fixed-map.mp4`
  as the accepted 42 s Moon final, without visual or data changes.
- Put the two finals first on the existing Codex port-8651 gallery, with earlier
  Mars and Moon films beneath an expandable archive. Added both finals to the
  older Codex Moon gallery too. Playback pauses other players on the same page.
- Wrote `narrative/SPACE_ANCHORS.md`: narrative, visual style, source attribution,
  scientific limits and a directly reusable brainstorming handoff. It connects
  narrowly bounded local autonomy to protocols that identify, measure and test
  the conditions under which predictions can be trusted. It explicitly separates
  real mission evidence from simulated control/outcomes and a proposed game loop.
- Reduced the root README and Space README to entry points. Kept Crew,
  Fieldwork, Idlisseus, chronology and benchmark pointers. Preserved the previous
  complete root README at `2026-10-04-readme-before-anchor-films.md`, including
  the workshop method and Pyrocene reference.

## Freeze / validation

`benchmarks/space-anchor-finals.json` records full decode, duration/frame checks,
media/page reference checks, route-distance checks, and unchanged Moon SHA-256.
The existing indicator/fixed-map checkpoint retains detailed implementation
history; the narrative is now the primary design handoff.

Network restrictions from the preceding session still apply: gallery contents
are updated on disk, but live Tailscale availability is not claimed or tested.
Use `python3 space/mars-rover-video/codex/serve.py --port 8651` on the host if needed.
