# Three data-sheet concepts to try

[All six sample pages](all-concepts.pdf): **A person 1, A person 2, B person 1,
B person 2, C person 1, C person 2**. Each alternative has two different sheets, so
we can rehearse a shared cue and see disagreement. These are review mocks, not a
full-room print pack. The colors are gone; original black/white Rover card faces,
icons and names identify observations. Use the existing voting app and deployed
black game screen. No new app, white stage view, map artwork or paddles are proposed.

| | A — Field notes | B — Signal slips | C — Two clues |
| --- | --- | --- | --- |
| Sheet | Two five-square historical excerpts: eight transitions | Ten current-card -> next-card examples | Eight two-clue -> next-card examples |
| Participant does | Reads neighboring columns and judges which category matters | Finds one matching icon and follows its arrow | Matches the source icon AND the revealed next slope |
| Vote | Any one of the four categories | Category printed beneath the right card | Category at the end of the matching row |
| Difficulty | Interpretation under time pressure | Fast scan and relay | Fast conditional lookup |
| What produces disagreement? | Different history and different judgments | Different historical values and assigned categories | Different observations even under the same two clues |
| Main tradeoff | Richer evidence; may take longer than 10 seconds | Predictable interaction; participant mostly relays | Meaningful extra match; spends the first reveal on slope |
| Download | [A PDF](a-field-notes.pdf) | [B PDF](b-signal-slips.pdf) | [C PDF](c-two-clues.pdf) |
| Preview | [A](a-field-notes-preview.png) | [B](b-signal-slips-preview.png) | [C](c-two-clues-preview.png) |

**Suggested first comparison:** A versus B. A tests whether the room can interpret
history quickly; B tests the Swift-like find -> follow -> respond rhythm. Then try C
if B feels too mechanical. C makes the additional search carry actual information,
rather than adding arbitrary colors or codes solely to slow the audience down.
None of the 10-second targets has yet been tested with a human audience.

## Do we agree with the proposed explanation?

Yes to the core: different people hold small historical samples, the live route is
unknown, shared environmental rules make history informative, and crowd disagreement
can be meaningful. The earlier guided generator is not inherently bad: it can make
useful categories win more often while keeping distracting minority suggestions.
It represents an authored attention policy, rather than a direct count of outcomes.

Four qualifications keep the lesson accurate:

1. **Every vote here selects a card category**, never GO/AVOID. The rep sees the vote
   shares, chooses a reveal, then makes the movement decision. An app showing 40% DUST
   is showing 40% of submitted inspection votes, not a 40% storm probability.
2. **Time indices matter:** prior-square HAZE plus next-square non-flat slope gives
   75% storm in this teaching simulator. Haze plus slope in the same earlier square
   is not that condition. C prints the two time positions explicitly.
3. **All four next cards coexist.** A full battery and a storm can be true in the
   same next square. HAZE -> FULL and HAZE -> STORM are not mutually exclusive outcomes.
   A person holding the former is not reporting a false observation; the rep might
   draw a false safety conclusion from it. Dead battery follows sand OR storm, so a
   hazy source square containing sand can legitimately be followed by dead battery.
4. **A few hands do not reliably reveal a mode.** Three or four are useful for
   demonstrating disagreement, not for estimating a stable probability. In A,
   judgment and multiple matches further separate a one-person vote from a count
   of historical transitions. Show actual counts and abstentions, not just percentages.

The "universe of Martian traverses" is an authored simulation here, not a measured
claim about real Mars. The frozen site's fixed 14-square deck is not itself a fresh
random draw each play. These mocks share the simulator's laws; using its sampled
routes in a future extension would align paper and live data. Visual compatibility
with today's Netlify cards does not establish calibrated probabilities for every
square of that fixed deck.

## A — Field notes: actual history, human judgment

Each sheet shows two contiguous excerpts drawn from the historical archive. These
are literal four-row card sequences, preserving the deployed game's row order and
faces. Each has five squares, supplying four consecutive transitions. No category
is hidden or selected for the participant, and no arrow dictates their vote.

Call a source icon such as HAZE. Participants scan columns 1–4 in both excerpts,
look at the following column, and choose one category they would inspect now. They
may combine several matches; this is deliberately an interpretation exercise. Column
5 can only be an outcome because the following square is not on the page. No match
means abstain. With a small group, a cue may have no usable matches anywhere; the rep
then chooses a reveal directly. A full event pack would need a coverage check.

In person 1's first journey, column 3 has HAZE; column 4 has STORM and a full battery.
That single visible example supports the exact intended trap: inspecting battery
can show nothing alarming while dust remains dangerous. The other journey also
shows lagged depletion and multiple potential warnings.

The room can learn where danger is concentrated, but its app votes summarize human
recommendations. To literally estimate P(STORM next | HAZE now), separately count
matching transitions and their dust outcomes; do not rename an inspection vote as
that probability. No evidence-routing policy is applied to A.

## B — Signal slips: guided, quick, still fallible

Each person gets ten distinct source cues in shuffled positions. The sheet has one
match per included cue, so the participant scans, follows an arrow and votes the
printed destination category. One of the eleven possible single-card cues is omitted
on each sample sheet, with different omissions; HAZE is present on both.

For the same HAZE call:

- **Person 1:** HAZE -> FULL, vote **1 BATTERY**.
- **Person 2:** HAZE -> STORM, vote **3 DUST**.

Both are valid historical examples. The rep has to decide which suggestion deserves
attention. Seeing a full live battery cannot clear the unrevealed weather. In sudden
death, guessing safe from that alone can end the run; avoiding a safe square also
ends it. Audience votes never directly authorize either movement.

The category distribution uses the prior generator's explicit policy:
`weight = 1 + 3 × historical danger rate after the source cue`, then normalize.
A category is sampled using those weights, and the case is sampled independently;
we do not force its value to be dangerous just because it was selected.

Expected category shares in the existing archive, before finite-sample variation:

| Cue | Battery | Slope | Dust | Ground |
| --- | ---: | ---: | ---: | ---: |
| HAZE | 24.3% | 15.0% | 36.9% | 23.9% |
| SOFT | 24.0% | 14.8% | 23.6% | 37.5% |
| STORM | 52.3% | 13.1% | 13.1% | 21.5% |

Thus the modal suggestion tends to be DUST after haze, GROUND after soft, and BATTERY
after storm. The route can still be an exception, votes can fluctuate, and a rep can
choose a minority category. These shares are tuning choices informed by history,
not exact hazard probabilities. "Most informative" is also not identical to "most
likely dangerous": a slope card can disambiguate a warning without being deadly itself.

The mocks use independent categorical draws. A later full pack could use proportional
allocation to control round-to-round variance, as the earlier generator did. That is
a gameplay tuning decision, not a reason to make all audience sheets identical.

## C — Two clues: the extra matching step has meaning

The rep first reveals the next square's slope, using one of the two allowed peeks.
They call both the previous-square warning and that next slope. Participants must
match the pair on the left; following the wrong haze row gives a different suggestion.
The row's right-hand example belongs to the next square. Slope is excluded as a
suggestion because it is already visible. The second peek goes to battery, dust or ground.

On person 1's sheet, HAZE + next STEEP points to STORM / DUST; HAZE + next FLAT points
to FULL / BATTERY. Person 2 has different valid evidence for those contexts, including
HAZE + next FLAT -> CLEAR. The additional clue changes the relevant historical bucket,
but does not reveal the new map's answer. Lookup remains quick, physical and fallible.

This version does constrain the first reveal to slope. It is an optional round format,
not a proposed change to the game's card artwork or normal Hard-mode controls.
Do not give a free third reveal: slope plus the voted category exhausts a two-card budget.

## Shared 10-second rehearsal

Use the actual black game cards and the existing vote app's four category options:
1 battery, 2 slope, 3 dust, 4 ground. Names are sufficient if the app already uses them.

1. Rep calls the source card. For C, reveal and call next slope too.
2. Start the 10-second vote window. Everyone searches their own sheet.
3. Close voting; display the four shares and the response count. Abstention is not GO.
4. Rep chooses a category, flips it and decides whether the evidence is enough.
5. If a second reveal is allowed in A/B, use the SAME source cue; exclude the already
   open category. A participants can reassess the remaining categories; B participants
   whose printed suggestion is already open abstain. No eligible suggestions: rep chooses.
6. Rep makes GO/AVOID/RECHARGE decision. After moving, the new current square supplies
   the next cue. Never re-cue on an already flipped target card while still treating
   the arrow as pointing to that same target—it would point one square too far ahead.

Keep a dead current battery and recharge requirement clear to the rep. A target full
battery is not permission to leave a dead current battery without recharging.

The progression and uncertainty come from new source cards, different hidden routes,
limited peeks and irreversible decisions. We do not need to recolor the frozen cards
or add an artificial code puzzle to get that rhythm.

## Provenance and regeneration

Run `paperweights/.venv/bin/python paperweights/rover/concepts/render.py` from the repo root.
Uses the same `model.py` kernel, archive seed 80421 / 30,000 transitions, and exact
exported `symbols.json` paths. All simulated transitions are checked against the
kernel. B/C manifests retain complete source/next states and archive IDs even though
only a few cards are printed. A retains the full contiguous excerpts and start IDs.

Two participant seeds, 42 and 1055, were chosen to display contrasting HAZE suggestions
for review. These two sheets are intentionally illustrative, **not an unbiased estimate
of room-wide proportions**. Do not extrapolate 50/50 from the two B pages. A future
full-room generator must use a declared sampling/allocation scheme and report its
actual delivered distribution and cue coverage. The earlier production generator
has such audits; these alternative mock formats have not yet replaced it.
