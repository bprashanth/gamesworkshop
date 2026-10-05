# Two minimal Jezero films — Codex, 4 October 2026

The user rejected being linked to Claude's film and requested independent
Codex exports, one per attached theme. A new Python/Pillow renderer was
written in `space/mars-rover-video/codex/`, with its own dependency environment,
raw-input copies, source hashes, media masters and server on port 8651.

Both cuts use one fixed view and a growing route. Hollow region marks mean
new data, diagonal hatching means confirmation. Five staged outcomes are
explicitly identified as simulated, while terrain and route derive from
public JPL/USGS and NASA datasets. Slope and local relief are orbital-DEM
derivatives, not claimed as instrument measurements. The two films differ
only in terrain presentation: white elevation profiles or muted contours.

A read-only Cursor CLI review supplied scientific-honesty and readability
checks. Codex wrote and rendered the actual deliverables. No Claude video,
frames, prepared geometry or renderer were reused; only public raw files
already cached on disk were copied and hashed.

Validation: both exports contain 864 frames at 24 fps, 1920×1080, 36 seconds,
without audio. Full ffmpeg decode and HTTP byte-range checks passed. Both
played to completion in a 390×844 Chromium viewport, with zero dropped
frames, then successfully sought to 18 seconds. The page has no horizontal
overflow. The Codex server runs as `mars-codex-8651.service` under the user
systemd instance; Claude's listeners at 8642 and 8643 were left untouched.
