# Sentences RM2 - random and majority contrast

User found the RM1 random and majority outputs too similar. RM1 explicitly
constrained every random choice to a grammatical slot. Preserve it as a baseline;
use a separate RM2 authored transition corpus for the browser.

Added `paperweights/robot-majority/branching.py` and an opening selector. Same
24-row format, exact sheet-vote engine, real matching participants and dark/light
UI. Three openings share one pack; Reset preserves the selected opening. Random
minority links mix contexts and skip syntax. Full-room majority is deterministic
for a fixed opening. No fake entropy is added after votes.

Design, regeneration commands and limitations:
[RM2](../paperweights/robot-majority/BRANCHING.md).

Validation: 900 full-majority paths exact and tie-free across 100 deals per size;
900 random paths different from the intended majority paths. Fixed seed-42 packs
produced 300/298/298 distinct outputs in 300 trials each. No single seed-42 sheet
contains a full intended majority path. Node exact-sheet tests pass 600 chains.
Playwright verifies real ballot IDs, all three openings, reset, voter cap, stopping,
navigation, themes and narrow-screen layout. Inspected the final screenshot.

Built the existing server tree at `paperweights/out/rover-review`. No game rules,
PDFs or live print packs changed. Revert this checkpoint to restore RM1.
