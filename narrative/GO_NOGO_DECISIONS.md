# Paper Weights / Rover - consistent audience decisions

15 October 2026. Brainstorm and agent handoff, not an approved implementation.
The working game remains unchanged. Current implementation checkpoint: `696fe9d`.

## The problem and the recommendation

Easy currently asks the audience **Go or Avoid?** Medium asks **which category should
we inspect next?** Both work individually, but switching the audience's task in a short
stage segment may cost more explanation than the added mechanic earns.

Recommend prototyping **Go/Avoid in both modes**. Easy provides all four current-square
readings. Medium provides one current-square reading plus the room's historical examples.
The question remains: **“Should we cross this square?”** Only the available evidence changes.
Use “Avoid” consistently; in this sudden-death game it means taking the bypass, not
waiting or requesting another measurement. Avoiding a safe square is also a loss.

A hidden hazard is not an exception to this design. The printed outcome must describe
**the entire square**, including its other three readings. A full battery can accompany
a storm; an observation showing full battery can therefore legitimately say Avoid.
One sheet is one past outcome, not a universal rule. The room supplies conditional
frequencies, and the representative still has to act under uncertainty.

## Current game - accurate implementation snapshot

The game is `paperweights/web/`, linked to the original collaborative Rover through a
stage dropdown. It is a separate competitive engine, not a rewrite of the original.
Four teams A/B/C/D have independent, pre-generated four-decision routes. Panels are
arranged A/B above C/D. Dark is default; Light is available. Original monochrome icons,
inverted kill faces, contour maps, rover movement and sand dissolve are retained.

Each square has four categories: battery, slope, dust, ground. Any dead battery, storm,
or sand pit makes the square fatal. Slope is contextual, not itself a kill card.
Multiple kills can coexist. One Avoid bypasses the whole square; there is no priority
ranking between its hazards and no separate avoidance maneuver for each hazard.
Four correct resolutions finish. An incorrect resolution eliminates that team.

| Mode | Visible evidence | Audience vote | Representative input | Resolution |
| --- | --- | --- | --- | --- |
| Easy | All four readings of the current decision square | Go / Avoid | Go / Avoid | Go succeeds only on a safe square; Avoid succeeds only on a fatal square |
| Medium | Initially one source cue; subsequently one selected next-square card | Battery / slope / dust / ground | Flip that category | After the reveal expires, a kill automatically avoids; every other card automatically goes |

Medium's precise timing matters:

1. An initial source card appears for 10 seconds, then hides. Reveal duration can be 20 or 30 seconds instead.
2. Everyone matches its icon and color on their sheet and votes the category on the right.
3. The rep flips that category in the **next square**. It appears for the reveal duration; additional flips are locked.
4. When it hides, a revealed kill causes automatic avoidance. A non-kill causes Go, which loses if another hidden card in that square is a kill.
5. The card just seen becomes the next lookup cue. Surviving teams repeat until four decisions are resolved.

There is no manual Next, no Medium Go/Avoid choice, no per-panel countdown, no on-screen
paper tally, and no automatic choice while waiting for the rep. Easy has no reveal timer.
Changing difficulty resets all four teams. The user's separate voting app is outside this
implementation. Hard is deferred.

## Current paper and model

Each person has a white A4 duplex sheet: 24 colored word pairs on the front and 24 Rover
icon/color-to-category pairs on the back. Both sides say Team A/B/C/D. The Rover side has
an “Avoid these:” strip with storm, dead battery and sand-pit icons. It supports Easy
recognition, while the lookup rows currently support Medium category selection.

Every person has every reachable Rover lookup key, once. Answers differ across people.
Keep assigned stacks together: 15 people split 4/4/4/3; 100 split 25 each; 200 split 50 each.
Any person can choose a team before receiving its stack. Mixing stacks can change close
votes. Pack IDs on paper and in the game must match.

The shared simulator generates a 60,000-transition historical archive and the game routes.
These are simulated observations, not measured NASA hazard frequencies. Qualitative rules:
storm requires preceding haze and non-flat current terrain; sand requires preceding soft
ground and non-steep current terrain; dead battery follows a preceding storm or sand.
Older conditions affect rates. Maps are fixed before play and independent of attendance
and choices; decisions affect survival, not what the hidden cards turn out to be.

Colors encode selected history **two squares before the pictured card**, not its risk:

| Colors | Historical distinction | Applicable icons |
| --- | --- | --- |
| RED / BLUE | Older dust was haze / was not haze | Battery and dust |
| AMBER / GREEN | Older ground was soft / was not soft | Ground |
| PURPLE / PINK | Older storm or sand / neither | Slope |

PURPLE also overrides the ordinary color for haze/soft when that older hazard existed.
There are 24 possible icon/color keys. Current colors do **not** encode all same-square
companions, complete history, future hazards or the optimal action. They are a small,
authored context summary. Neither red nor green universally means danger or safety.

Current printed categories are drawn from an **inspection policy**: in dangerous historical
target squares, 80% of its probability focuses on kill categories and 20% explores all
categories uniformly; safe targets use uniform categories. Team counts are stratified
and shuffled between people. Thus current category vote shares are not death probabilities.
Existing observations are also selected conditional on the chosen inspection category;
do not just relabel those records Go/Avoid and assume an unbiased outcome distribution.

The reviewed seed is 15. Current Medium modal-category play gives 1/1/2 finishers with
15/100/200 sheets. Those are results for a particular policy and seed, not guarantees.
Correct fully informed Easy play can finish all four. Neither result transfers automatically
to a new binary-vote prototype.

## Direction A - make both modes about choosing a card

### A1. Easy: point to the danger; Medium: infer where it is

Keep the current automatic movement rule in both modes. In Easy, expose all four cards
and ask “Which card should the rep choose?” People point to a kill card if one exists.
Selecting it avoids; selecting a non-kill goes. On a safe row, every category succeeds.
In Medium, hide the readings and use the existing historical lookups to choose a category.

This is the smallest change and retains existing printouts and model. The audience uses
the same four voting options throughout. The explanatory line is: **“Choose a dangerous
card if there is one; otherwise any card.”**

Weaknesses: safe-row votes are arbitrary, and rows with multiple kills split valid votes.
A plurality can even favor a harmless category if correct votes split between hazards.
The rep should retain judgment. Adding a fifth “none” answer or declaring slope a default
safe-row answer fixes one awkwardness by adding a new instruction. Do not silently make
all rows hazardous to avoid this problem: that destroys the Go/Avoid contrast.

### A2. Easy as a brief training round

Use the same card-selection loop, but show all four cards for the first round and hide
companions on later rounds. This teaches the consequence of clicking a kill before paper
lookup becomes necessary. It is a scaffold, not a separate ruleset, and could replace a
full Easy game if rehearsal shows the visible phase is enough.

This direction is best if the lesson is **choosing where to look**. It is weaker if the
main priority is preserving Easy's already-successful binary audience vote.

## Direction B - make both modes about Go/Avoid

### B1. Same-square prediction - recommended first prototype

Easy stays as implemented. Medium reveals one card in the square being judged, hides it
after the configured viewing window, then waits for Go/Avoid. Audience members look up
that icon and color; each sheet supplies GO or AVOID from one historical whole-square
outcome. The rep chooses; the game reveals the full square briefly, resolves movement or
elimination, and starts the next square. All teams still have four decisions.

For the first experiment, let the system choose the revealed category by a declared,
answer-independent schedule. This removes a second public decision about where to look.
A facilitator can flip the scheduled card manually if the physical gesture is useful.
Later, the rep could choose one category privately, but that adds search strategy and
changes which evidence is encountered. Validate that variant separately.

Every cue must refer to the **same square** being judged. The present Medium source-card
bootstrap and next-square category chain must be replaced, not retained with new labels.
A visible storm/dead battery/sand guarantees Avoid for this square. A benign icon does
not establish safety. After resolution, briefly exposing the full row explains a surprise
loss and makes hidden companion hazards tangible.

### What the existing archive already supports

Computed directly from all 60,000 historical records, grouping each source reading by
its existing icon/color and counting whether its **source square** has any kill. These
are archive frequencies, not tested new-game win rates or promised printed ratios:

| Visible cue | Same-square danger | Suggested binary majority |
| --- | --- | --- |
| RED haze | 69.2% | Avoid |
| BLUE haze | 36.8% | Go |
| AMBER soft ground | 68.7% | Avoid |
| GREEN soft ground | 37.3% | Go |
| PURPLE flat slope | 44.7% | Go, close |
| PINK flat slope | 55.5% | Avoid, close |
| RED full battery | 37.9% | Go |
| Any actual kill icon | 100% | Avoid |

This demonstrates that the current history colors can help without inventing an oracle.
A hypothetical 50-person RED-haze group could have about 35 Avoid and 15 Go examples.
If this live square is safe, following the majority still loses. That is a valid minority
outcome, not necessarily broken data. It needs to be uncommon enough and explained clearly
enough that the game feels informative rather than arbitrary.

Across the archive, 58.9% of source squares are dangerous. Compare informed play against
always-Avoid and other baselines; a favorable overall hazard rate alone can make a policy
look useful. A schedule that mostly reveals decisive kills would also make Medium trivial.
Choose the schedule using aggregate playtests, never by peeking at a live square's answer.

### B2. Next-square prediction - closer to the current lookup chain

Show a source card and use paper GO/AVOID examples for whether the **next square** was
dangerous. The rep votes on that next square without needing to inspect it. The selected
new source reading can begin the next round after movement.

This retains temporal prediction and the historical transition structure. Its drawback
is explanation: a visible kill belongs to the previous square, not necessarily the square
being judged. For example, a dead battery in the source does not force a dead battery in
the target under this simulator. It conflicts with Easy's simple “see kill, Avoid” reflex.
A source storm does predict next-square dead battery, but that special case does not fix
the general timing ambiguity. Prefer B1 for the first short-session prototype.

### B3. Optional second peek - later experiment

Keep Go/Avoid as the only public vote, but let the rep buy one extra reveal when the room
is split. This adds agency and can reduce frustrating hidden-hazard losses. It requires a
clear cost and evidence update rule. Two independent single-card lookups cannot simply be
averaged: their histories overlap and their evidence may be correlated. A revealed kill
settles the decision; two benign readings do not establish safety. Supporting joint cues
on paper may exceed the minimal 24-row format. Defer this until B1 is readable and fun.

## How to generate valid binary sheets

For B1, rebuild observations from the complete archive. For each icon/color key, sample
historical **source squares** with that key and label GO if there are no kills anywhere,
otherwise AVOID. For B2, label the **target square** instead. Do not mix these semantics.
Retain archive IDs for audit, the same icon rectangles, plain color names, team labels,
white backgrounds and 24-row coverage. Change the right-hand category to GO/AVOID.

Compute each conditional outcome frequency before applying per-team stratified quotas.
Every participant gets one example for every cue. Match each assigned label to an actual
historical record with that outcome. A live map is a separate draw from the shared process;
it must not be edited after the crowd votes. New labels and timing need a new pack version,
not reuse of PW2 IDs or category sheets.

If the reveal-selection policy depends on other visible information, the archive matching
and evaluation must account for that evidence too. Conditioning only on icon/color can
mislead if selection leaks information about hidden companions. Start with an independent
schedule to make this explicit and testable. Do not encode the live fatal flag into color.

With equal penalties for wrong Go and wrong Avoid, a majority vote is a reasonable default
for a single decision. A tie is genuinely unresolved; let the rep decide. At 15 people,
team sizes 4/4/4/3 cannot express a fine 60/40 split. At 200, each team has 50 and can.
More paper reduces rounding error; it cannot remove uncertainty about a particular map.

## Prototype acceptance and handoff

No game or paper changes are authorized by this brainstorm alone. Suggested next step:
prototype B1 beside the existing game, with one illustrative binary sheet and the same
four-panel style. Keep Easy unchanged. Compare against A1 if card-selection continuity
still seems attractive after a short rehearsal.

Before producing event packs, test:

- Every live icon/color has a lookup on every team sheet, including unexpected choices.
- All printed outcomes agree with the intended whole-square source/target labels.
- Actual team vote proportions match the archive within quota rounding error.
- Same-key examples include hidden-companion hazards and legitimate safe exceptions.
- Multi-seed binary play beats appropriate uninformed baselines and includes both Go and Avoid decisions.
- Survival distribution, decision timing and 15/100/200 scaling are remeasured. The desired one or two finishers is a design target, not an enforced runtime outcome.
- Reveals, voting and resolution cannot advance the square while the rep is still deciding.
- A human can state which square is being judged and what their right-hand label means.

Useful source files:

- [Competitive UI](../paperweights/web/competitive.js) - current mode state machine.
- [Shared simulator](../paperweights/competition/generate.py) - archive, context keys, routes and inspection sampling.
- [Model guide](../paperweights/competition/README.md) - current assumptions and validation.
- [Print generator](../paperweights/build_printouts.py) - duplex layout and hazard strip.
- [Game and printing instructions](../paperweights/README.md).
- [Session narrative](PAPERWEIGHTS.md) and [chronology](../chronology/2026-10-15-paperweights.md).

Questions for the next agent: Does B1 preserve the learning goal better than A1? Is
same-square inference legible with these existing history colors? Which independent
reveal schedule gives useful disagreement without too many trivial kills? How should
surprise losses be explained without adding more stage text? What is the smallest human
rehearsal that distinguishes confusion from legitimate uncertainty?
