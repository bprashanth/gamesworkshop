# 2026-10-06 · Moon Run (moon/claude): Rover Run's method on a new world

User brief: build `proposals/ROVER_COMPETES.md`, combined with `narrative/EVENT.md` and
`COMPETITIVE.md`, into `moon/claude`. It must follow Rover Run's look and rules, playtest like a
human, keep the data on Seagate, and leave Rover untouched. Built head to head with another agent's
`moon/codex`, which was not read.

## What was built

- **Data (real).** LOLA 80 m south-pole DEM and LOLA average solar visibility (60 m), on Seagate
  with sha256 files. A route search over random 27 km traverses found one whose measured light
  pattern fits the lesson (sun, shade, dark, long shadows, return to sun). It is a 27.7 km authored
  traverse on Shackleton's outer flank. Light and slope per square are measured and bucketed.
- **Laws (authored).** POWER LOSS = shade or dark three observations running, unless the ground at
  the third is firm (PERSISTS plus an exception). FROZEN = dark WITH cold. STUCK = loose WITH steep.
  The battery is a late measurement. Every law reads the square behind, so nothing ahead is ever
  shown (REUSE lesson 2).
- **Archive.** 20 histories and 117 observations, with failures balanced 4/4/4, safe look-alikes
  and 2 lucky escapes. There is a held-out set of 20, a sealed 14-square route, and 8 sudden-death
  cases. Everything is generated from the laws with fixed seeds, and every outcome is verified.
- **Pages.**
  - Stage hub
  - Archive explorer (x of n, facilitator laws)
  - Printable fragments with per-team coverage
  - Phone rule builder (BEFORE / PERSISTS / WITH, each with its question) and evaluator (with an
    evidence grid)
  - Representative's model builder (clusters, supporters, a cap of 4, clash warnings) and its
    animated archive run with MODEL NEEDS YOU
  - Sealed board (Rover's board plus an outcome row and Model mode)
  - Sudden death
- **Tools.** `prep_moon.py`, `build_archive.mjs`, `sim.mjs` (43 checks), `rules-probe.mjs`,
  `agent-play.mjs` and a simulated audience (`web/audience.js`).

## Decisions and what failed

These are in `moon/claude/README.md`, under "Design decisions that failed":

- Hot was dropped.
- The safe-rule scoring is now lift, not precision: "sun means safe" had scored 93.
- The archive gave 8 asks and was trimmed to 2.
- A failure now costs −2 points. Without a clock, a model that drove into two failures tied a
  perfect one.
- 60 m contours looked generic. Shifting the frame toward Shackleton made the crater arc show.
- The light buckets are fragile. Rerun `build_archive.mjs`, which refuses a route whose outcomes
  drift.
- Simulated rooms all produced identical rule menus until their habits were varied.

## Human playtest (me, Hard, 2 cards per square passed)

The score was 12 of 13 with no failures.

- **Mars carried over.** "Loose ≈ soft" saved square 3 (STUCK).
- **Caution covered the rest.** "Dark and cold sound bad" saved square 4 (FROZEN). A long shadow
  with the battery low saved square 6.
- **Learned on the route.** Loose on a gentle slope was safe at 8. By square 11 the Hard picks had
  shown that firm ground after a long shadow was safe twice (4→5 and 6→7), so I went at 11–12 and
  avoided 13 (loose after four shades).
- **The cost.** The one point lost was square 7: I avoided it in a long shadow before I trusted
  firm ground.
- **Over-caution does not pay.** Avoiding after any unusual card scores 7.

Fixes from this run:
- The end-of-run status overflowed into the mode buttons, so it is now compact.
- A failed outcome card was invisible (white on white).

## Blind playtest 1 (Cursor agent, GPT-5.6 Sol, participant B04: temperature + ground on a frozen history)

**The method worked.**
- It went from "cold → FROZEN" (43) to "cold WITH firm" (56), "cold or cool ×2 WITH firm" (53),
  "cold WITH low battery" (50), "cold WITH shade or dark" (53), and finally "cold WITH dark" (89,
  graduates). It used the shared archive's "x of n" to rule out battery.
- It published the rule. As representative it chose the sharp power rule, frozen, stuck and the
  firm exception.
- That model scored 92 on the archive and 92 on unseen histories, and 13/13 on the sealed route.

**Its criticism:**
1. Model building was "pick the highest scores".
2. The strong model never needed it: there was no MODEL NEEDS YOU, because a power rule that
   already contains the firm exception cannot clash.
3. The scoring formula and the WITH count were unexplained.
4. `|` broke in the shell.
5. The screenshot after publishing was blank.
6. The archive icons were too small.
7. It could search by trial and error with unlimited evaluations.

**Fixed:**
- One line explaining the score under every result, and a tooltip and help for the count.
- `,` for "either".
- A screenshot after publishing.
- Bigger archive cards.
- A budget of **6 evaluations per person** (`?tries=`).
- The model page now says how it decides, and says plainly when there are no clashes ("this model
  will decide every step itself; ask what it would do in a case the archive never showed").

**Kept as designed.** A sharper rule removes the need for a person; the proposal asks for this
(§14), and it is a facilitator talking point. The simulator shows the intended room model asks 2
times on the archive and 2 on the sealed route; the sharp one asks 0.

## Blind playtest 2 (participant A04: light + battery on a power history, 6 tests)

It used 4 of its 6 tests:
- "shade lasts 3 → POWER" scored 44 (2 of 4).
- "shade WITH low battery" scored 67.
- "shade ×2 WITH low battery" scored 55. This one showed it that shade duration was not the
  discriminator.
- "low battery lasts 2 → POWER" scored 73 and graduated.

It used "x of n" on the archive (low battery: the next observation failed 6 of 17). As
representative it chose the sharp power rule, frozen, stuck and "cold ×2 WITH sun → GO". The model
scored 92, and 13/13 on the sealed route, again with no MODEL NEEDS YOU.

**Its new points:**
- GO rules only matter when they clash, because silence already means GO. The page now says so.
- Alert counting is unclear when a condition persists.
- `./play` help said B04 when it was playing as A04 (fixed).
- It wanted a way to rehearse a clash before sealing.

**Shared finding, still open:** the representative's step can be done by leaderboard. The options
are in the README ("Open issue").
