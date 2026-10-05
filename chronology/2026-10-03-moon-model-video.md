# 2026-10-03 — One mission, two kinds of intelligence

This is the third experiment and the first one that isn't a game. The brief
(`.prompt/v3_space.md`) asked for a 60–90 second minimal film of a lunar
mission for a narrator to speak over. Navigation and planning should visibly
lean on Mission Control; the far-side burn should visibly depend on the
spacecraft. On-screen text was limited to small labels, with no lesson and no
end card. The result is in
[`space/moon-model-video/claude/`](../space/moon-model-video/claude/). An
independent Codex attempt from the same brief sits beside it in `codex/`.

## 1. Choose a medium that can be iterated

Blender is not packaged for this aarch64 machine. A Three.js scene rendered
frame by frame turned out to be better anyway. `FILM.renderAt(t)` draws any
moment deterministically. Playwright drives headless Chromium on the GB10 GPU
(`--use-angle=vulkan`), and ffmpeg encodes. Stills at any timestamp take
seconds, so the look was tuned through about a dozen rounds of contact sheets
rather than by guessing.

## 2. Put real geometry under the minimalism

The scene is the rotating Earth–Moon frame, with the true 3.67 : 1 radius ratio.
- **Arrival.** The craft arrives on a free-return hyperbola (e = 1.5) whose
  periapsis is on the far side.
- **Loss and acquisition of signal.** These are not scripted. Line of sight is
  tested against the lunar sphere every frame, so the beam is cut exactly where
  geometry says.
- **The burn.** It lowers eccentricity to zero. The onboard prediction is the
  live conic, so it visibly bends from an escape into a closed orbit.
- **Engine and link.** The engine leads during the retrograde burn, and the
  reacquired link rebuilds over 1.3 s of light-time.
- **Clock and readouts.** The clock and readouts are Apollo 11's: TLI 002:44:16,
  MCC-2 026:44:58, LOS 075:41:23, LOI-1 075:49:50 for 357 s and about 889 m/s,
  AOS 076:15:29.

## 3. Make the argument visual, not textual

Mission Control phases are wide, slow, and full of alternatives:
- a dashed plan
- a corridor
- 12-hour timing ticks
- sphere-of-influence rings
- twenty-two possible futures collapsing into one at the correction
- a pulsing Earth link

The onboard phase is close, fast, and bounded:
- a reticle
- one re-solving conic
- seven candidate arcs re-solving at 7 Hz
- a burn timer
- no link

The labels only name the phase, the dominant intelligence, and the tradeoff.

## 4. What went wrong on the way

- **NaN blocks.** A shader computed `pow(1 - vT, 1.6)` on a slightly overshooting
  varying. The resulting NaN spread through the bloom chain as a large grey
  rectangle. It was found by hiding objects one at a time.
- **Compositor artifact.** A second rectangle came from the text layer, not
  WebGL: Chrome's compositor mis-rasterizes CSS `filter: blur()` on the label
  block in screenshots. The blur-in was replaced with a fade, rise, and tracking
  change.
- **Line2 can't start mid-geometry.** The parking orbit was being painted as an
  orange ring.
- **Hidden TLI.** The TLI happened behind the Earth from the camera's side. The
  opening now starts behind the departure point and swings over the top as the
  trail unrolls.
- **Moon surface.** Crater relief read as bubbles or as golf-ball texture. It
  settled as soft albedo craters with a gentle fbm normal and a real terminator.
- **Shared README overwritten.** A shared `space/README.md` written by the
  parallel Codex attempt was overwritten unread. It was untracked, so its text
  was lost; it was rewritten to describe both folders.

## 5. Delegation

A sub-agent synthesized the ambient bed from a beat sheet. It is a procedural
pad that thins to near silence at loss of signal, adds a low rumble with a
7 Hz tick under the burn, and resolves with a two-note chime at acquisition.
It measures −26 LUFS and sits under narration. Picture, geometry, and review
stayed in the main loop.

Render timings and checks are in
[benchmarks/MOON_VIDEO_RENDER.md](../benchmarks/MOON_VIDEO_RENDER.md).
