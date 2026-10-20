# Focused room fixes and facilitator narrative

Requested scope: fix unreachable sentence continuations, stale votes across
activities, and indistinguishable empty polls. Keep the change small. Also write
the spoken transition from Swift-style words to risk and decision support.

Word packs are now served whole rather than sliced to the current attendance.
Reserve word bots hold unoccupied seats in the complete pack and vote whenever
they have a match. These seats do not participate in Rover/Households. The host's
existing source line identifies reserve word bots. This retains the corpus and
printed rows, without creating fallback words or altering printed PDFs.

The room server tracks host activity entry. Moving between Sentences, Rover,
Households, collaborative, landing and Icons clears prior votes and queued bot
ballots, while preserving the roster. Reloading the same activity does not itself
perform a cross-activity reset; existing page reset behavior still applies.

Poll metadata now distinguishes waiting, no-data and received votes. Matching
coverage excludes already revealed categories and is cached by the participating
seats/deck, so polling does not recompute every sheet for every incoming ballot.
Hosts show Waiting for votes or No matching data in place of misleading empty
bars. Phones show No matching data when the team has no usable lookup.

Validation:

- `python3 -B paperweights/room/test_room.py`: complete left/right coverage for
  both word decks at every size 0-200; reserve bot slots; activity transitions;
  no-data/waiting/voting and excluded-category behavior.
- Isolated browser run: a 16-person room serves the complete 20-sheet word pack;
  RED:it, previously missing, receives a reserve-bot vote. Tested activity changes
  through Rover, collaborative, Households and landing. No stale word prompt.
- Tested green good-harvest lookup: No matching data on host and phone. A useful
  team-B lookup progresses from waiting to bars. Screenshots visually inspected.
- `git diff --check` passes. Restarted the 8688 room server with the new code.
  No PDFs regenerated; 8684 and the other servers were not restarted.

[Facilitator narrative](../narrative/ROOM_AS_MODEL.md) covers examples, the room as
a model, voting versus sampling, direct hazards versus indicators, household
icons, asking for evidence, and representation. It distinguishes improved case
evidence from retraining and identifies the household rules as a simulation.

The separate review finding about freezing sheet assignments when attendance
crosses a bucket boundary is outside this requested fix and remains unchanged.
Other agent work was already uncommitted; this task did not create a combined
commit of those changes.
