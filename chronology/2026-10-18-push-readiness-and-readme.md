# Push-readiness audit and root README - 18 October 2026

User requested a push-readiness check for large/sensitive files and a root README
covering print locations, current Competitive Easy/Medium and the original
collaborative game.

Fetched origin. origin/main had advanced to a39904f; merged it into workshop2
without conflicts so origin/main is now an ancestor of this branch. No push or
public deployment performed.

Audit scope: current tracked paths/content plus all outgoing Git blob objects in
origin/main..HEAD before the documentation changes. No matches for private-key
headers, common GitHub/AWS/OpenAI/Anthropic/Google/Slack token formats or credential
URLs. No tracked sensitive-name candidates. This is a pattern audit, not a proof
that arbitrary sensitive text cannot exist. No secret values were printed.

Size findings: 660 tracked files, about 200.7 MiB total working-tree file content.
Largest tracked file is the existing public Fieldwork gazetteer at 10.28 MiB.
Outgoing history had 620 unique blobs totaling about 182.5 MiB uncompressed; its
largest blob is a historical print HTML file at 6.4 MiB. PDFs, generated packs and
previews are intentionally versioned. There are no large film/raster/media blobs
in the outgoing set. Ignore rules do not remove tracked data or historical blobs.

Added ignores for editor swaps/backups and local film/audio/raster extensions.
Confirmed credential/env/dependency/media/swap paths are ignored. An active README
swap file was left on disk, not deleted. Unrelated untracked chronology, moon,
narrative and proposals work was not staged or changed.

Rewrote README with the combined Python server, local entry points, stage/difficulty
semantics, six-turn competitive rules, audience checks, projector use, print-pack
catalog and PW5/PW6 incompatibility. Collaborative hosting/build description is
separate from local rehearsal, and its detailed rules live behind links. Preserved
the original data-program rationale in narrative/ROVER_DATA_PROGRAMS.md. All local
Markdown targets in the updated README/rationale resolve. git diff --check passes.

Hosted check: Netlify root returned HTTP 200; /paperweights/web/ returned HTTP 404.
README explicitly notes that the competitive version is not deployed publicly yet.
