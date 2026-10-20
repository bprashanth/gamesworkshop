# Room search and percentages

- Live sentence, Rover and Household vote bars show percentages of submitted candidate votes. Sentence bar widths use that same denominator.
- Starting cue is a searchable text field with word/color suggestions. Plain words work when unambiguous; invalid cues do not replace the active chain.
- Phones have a No matching word abstention button during word polls. It does not enter candidate totals and can be replaced by a matching row vote.
- Household empty lookup says No matching card suggestion. This means no usable team row for the current cue after excluding revealed categories, not a safe decision.
- Roster logic unchanged: phones plus configured bots, extra sentence reserve bots for complete buckets, round-robin teams. Bucket-boundary redealing remains a limitation.
- Five Python regression tests passed. Isolated browser check passed search, invalid cue validation, phone abstention and live percentages. Inspected desktop and phone screenshots in /tmp/room-search-percent.png and /tmp/room-no-word.png.
- No PDF regeneration or model distribution changes.
