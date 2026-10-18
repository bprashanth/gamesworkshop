# Keep one print snapshot; ignore Moon fork - 18 October 2026

User requested removing historical generated printouts from Git, retaining one
latest snapshot that can be updated in place, documenting regeneration, and
ignoring moon/claude if Rover does not depend on it.

Untracked 365 paths using git rm --cached only. All local copies were retained;
file existence/content was verified immediately after untracking. This includes
historical pack trees, standalone word output, rendered Rover studies/themes,
sentence printouts and moon/claude. Renderers, model code and design READMEs remain.
The existing 15-person pack was subsequently regenerated to test the updated builder.

moon/claude is the independent Moon Run game fork, not merely a film. Its README
and source/build dependency inspection show no dependency from either live Rover
stage or Netlify build. It remains on disk and is ignored; moon/codex is untouched.

One reviewed snapshot is tracked at paperweights/printouts/latest/: duplex.pdf,
PRINT.md and verification.json. It is the existing PW5 200-person pack, not a new
PW6 paper encoding. Full pack-ID outputs stay local and ignored. The generator's
--update-latest flag replaces these same three files after validation. Generating
prints no longer installs old PW5 data in the live game by default; --install-game
is an explicit opt-in. Root README links the print catalog/regeneration guide.

Build copies only the latest snapshot, not ignored print histories. A clean build
verified the exact three snapshot files plus the catalog. Regenerated 15-person
output passed existing row/color/count/bounds/duplex checks, with PW6 pack/catalog
unchanged. Snapshot PDF is byte-identical to the reviewed 200-person source.

This reduces the PR's final file diff, not old Git history. No history rewrite,
force push, deletion of local originals or public deployment was performed.
