# Reproducing the workshop landing page

Audit: 20 October 2026. The current landing page needs no Seagate mount, external dataset download, Node packages or Python packages to run. Python 3.12.3 was tested. Node 24.19.0 is used for model tests and regeneration, not serving.

## Run from a checkout

For the complete Summit event, use `./run-summit.sh` from the repository root.
It starts the one server needed for every landing-page destination and live phones,
prints detected Wi-Fi, LAN and Tailscale addresses, and stays in the foreground.
Ctrl+C terminates the server. Running it again first stops this checkout's room
server on the selected port, including one started directly. It refuses to replace
an unrelated application on that port. Restarting clears in-memory votes and seats.

Optional: `./run-summit.sh --port 8688 --bots 20`. Linux and the `ip` command are
used for process and interface discovery. No 8684 or 8690 server is needed for Summit;
those independent experiments are left alone. The Tailscale address is detected,
not hard-coded to the original machine's `100.82.28.38`.

The underlying command is:

```sh
python3 paperweights/room/server.py --port 8688
```

This builds the site into ignored `paperweights/out/room-site` and serves the landing page at `http://localhost:8688/`, phones at `/audience`, Sentences, competitive Rover Risks, collaborative Rover Easy, competitive Households Indicators and the icon overview. Use the host's LAN address for other devices. This Python service is required for live phones; publishing the static build alone does not provide the room API.

For the separate simulated-audience version:

```sh
python3 paperweights/serve.py --rover-only
```

## What belongs in Git

| Path | Purpose |
| --- | --- |
| `paperweights/room/` | Room server, landing page, phone UI, sheet dealer, small derived lookup JSON, print script, tests |
| `paperweights/web/` | Competitive and Sentences UI, room client, prepared map, PW6 packs, symbols and animation |
| `paperweights/robot-majority/mixed.py`, `mixed-corpus.txt`, `prior-duplex.json` | Word model and reproducible source decks |
| `households/` | Household model, icons and branching route logic |
| `space/rover-run/src/web/` | Collaborative game, prepared Jezero contours, traverse, rows and authored deck |
| `paperweights/build_site.py`, `serve.py` | Build and serving entry points |
| `paperweights/competition/` | Competitive data model, generators and checks |
| `paperweights/printkit.py`, `requirements.txt` | Print rendering and pinned Python print dependencies |
| `narrative/`, `chronology/`, READMEs | Design, provenance, limitations and checkpoints |

Keep the small derived assets in Git even when their raw sources are external. Each current map JSON is about 29 KB. New room sources total roughly 65 KB. PW6 `pack.json` and its named copy are about 6.1 MB each, already tracked. Older packs also remain tracked; they are not newly introduced room dependencies.

The current room folder and room-client.js must be added explicitly: they were untracked at audit time. Do not use a blanket `git add .`: unrelated `moon/codex/` and `paperweights/split-room/` are also untracked. The existing `/moon/claude/` ignore does not ignore all of `moon/`.

## Regenerate small model assets and validate

```sh
node paperweights/room/household-answers.mjs
python3 -B paperweights/room/test_room.py
node households/test-stages.mjs
node households/test-handoff.mjs
node paperweights/tools/test-sentence-model.mjs
python3 paperweights/build_site.py --output paperweights/out/repro-site
```

The site builder regenerates the static word packs from the corpus. The live room deals complete word packs itself. The household command rewrites its small answer JSON; review and commit that result when changing the household model. The Rover PW6 generator is `python3 paperweights/competition/evidence.py`; it is not needed merely to run the checked-in game. Changes to rules, context encoding and lookup sheets must be evaluated together.

## Print separately

```sh
python3 -m venv paperweights/.venv
paperweights/.venv/bin/pip install -r paperweights/requirements.txt
paperweights/.venv/bin/python paperweights/room/print.py --sheets 20
```

Print rendering also needs the system libraries required by WeasyPrint and DejaVu fonts. The requirements file pins Python packages, not those OS dependencies. A pinned container would make PDF reproduction more portable.

Output is ignored `paperweights/printouts/room/room-20.pdf` plus review artifacts. Do not commit print histories. `paperweights/printouts/latest/` is the single tracked reviewed snapshot, but it predates the live room deck. Do not mistake it for current live-room sheets.

Fix the final room size before matching phones with printouts. Current word buckets can change the deal when participants join; configured bots are additive, and reserve word bots complete the word pack. Session state is in memory, not a portable event manifest.

## Terrain generation from raw research data

Playing and editing map rendering or team routes needs only the prepared map JSON. Rebuilding contours from raw measurements uses `space/rover-run/src/tools/prep.py` and currently requires these hard-coded local files:

| Input | Local path under `/mnt/seagate/gamesworkshop/` | Bytes |
| --- | --- | ---: |
| CTX DEM | `mars-rover-video/codex/raw/jezero_ctx_dem_20m.tif` | 90,345,300 |
| Perseverance traverse | `mars-rover-video/codex/raw/M20_traverse.json` | 1,719,158 |
| MEDA aerosol observations | `mars-rover-video/claude/raw/meda/TIRS_Aerosol_tau.csv` | 6,553,579 |

The pipeline imports numpy, scipy, rasterio and contourpy. The current map uses 14 strips and rotation. The inputs total 98,618,037 bytes, around 94 MiB. They are not needed on the browser or the room server. Films, recordings, alternative terrain studies and benchmark output are not runtime dependencies.

Recommended next reproducibility work, not yet implemented:

1. Make terrain input paths command-line arguments, keeping output in a separate review directory.
2. Check in an asset manifest with source provenance, redistribution terms, exact filenames, sizes and SHA-256 hashes, plus generation parameters and dependency versions.
3. Publish one immutable raw-data bundle to S3 or compatible object storage. Add a downloader that verifies every checksum before extraction. Never commit credentials or expiring signed URLs.
4. Use a pinned Docker/OCI image for geospatial and PDF tooling. Docker Hub is useful for the toolchain; object storage is simpler for research data. Record both image digest and dataset version.
5. Regenerate both map copies deliberately, review the visual change, run model tests, then commit the small prepared JSON with its source manifest. A terrain visual change does not automatically produce validated new hazard distributions.

No upload, Docker image or external asset manifest has been created by this audit.

## Audit evidence and limitations

A candidate checkout was assembled in `/tmp/gamesworkshop-repro-audit` from tracked working-tree files plus the room sources and room client, excluding ignored files, local packages and Seagate data. The server built and started from it. All seven landing destinations loaded in a browser without page errors or HTTP errors. Room continuation and state tests passed.

A narrow credential-signature scan found no matches in tracked files plus the new room sources. This is not a comprehensive secret or full Git-history audit. No commit or push was performed during the audit. The room remains a trusted-local-network prototype without host authentication; word roster freezing and deterministic event snapshots remain separate work.
