# Two-model audience rehearsal - 17 October 2026

Supersedes the four-lookup PW3 experiment. User requested two simulated audience
buttons per quadrant and independent play so one rep can rehearse alone.

Implemented PW4: Medium starts with one card revealed, one optional additional
reveal, then Go/Avoid. Both questions concern that same row. Each team's sheets
split roughly equally/randomly into GO/AVOID and WHICH CARD models. Poll buttons
count actual matching team/model sheet entries and show percentages plus counts.
The newest revealed card is outlined and becomes the new lookup; old bars clear.
One extra reveal prevents exhaustive inspection. Easy remains all face-up Go/Avoid.
Per-team Reset does not alter other teams; global Reset remains. Reset replays the
same data. Dark/light and existing hazard glyphs/dissolution remain.

Created a new historical same-column label generator rather than reusing PW3's
next-column outcomes. Colors retain past-context rules, not a hidden live answer.
Inspection is retrospectively labeled with a hidden kill category when available,
otherwise another sampled category. Documented limitations in competition/DUAL.md.
No manufactured 50/50 or claimed guaranteed number of finishers.

Generated matching mixed-model duplex sheets. Model tests cover 15/100/200 people;
browser checks cover exact poll counts, limits, independent four-turn completion,
wrong decisions, reset, Easy and mobile. Screenshots in paperweights/out/dual-*.
The existing Tailscale server serves the rebuilt PW4 site. No public deployment.

Delivered packs: PW4-15-15-1061d94544 (30 duplex pages) and
PW4-15-200-b7e1faa6ed (400 duplex pages). Independent PDF extraction verified
all printed rows, duplex pairing and game tallies. All ten model tests passed.
Browser tests passed for both packs with no errors; all eight polls fit at 1440x900.
