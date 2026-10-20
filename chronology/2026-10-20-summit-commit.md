# Summit integration commit

The Summit event now has a minimal root README, a GAME_INDEX guide, rebuild documentation in docs/REBUILD.md, and a foreground launcher that prints local network and Tailscale links. The commit includes the live room, phone sheets and voting, complete sentence continuations, searchable starting cues, percentage bars, no-word abstentions, empty-poll status distinctions, activity transitions and collaborative layout adjustments.

Validation before commit:

- Clean candidate checkout built and served all seven landing destinations without browser or HTTP errors.
- Five room regression tests passed, including full word-deck coverage and abstention handling.
- Household stage/handoff and sentence model tests passed during the reproducibility audit.
- Launcher checks passed startup, restart, Ctrl+C cleanup and preservation of unrelated listeners.
- Staged whitespace checks passed. A credential-signature scan found no matches; this was not a comprehensive security or Git-history audit.
- Before this record, the staged scope contained 30 files totaling about 170 KB. No generated PDFs, large media, dependencies or benchmark outputs were added.

Unrelated moon/ and paperweights/split-room/ work remains untracked and excluded. No push or deployment is part of this checkpoint. The live server is unchanged by committing. Existing limitations, including word-pack redealing at roster-size boundaries and trusted-network-only room access, remain documented in docs/REBUILD.md and paperweights/room/README.md.
