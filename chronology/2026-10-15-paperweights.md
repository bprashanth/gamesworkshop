# Paper Weights: timed flips and a continuous lookup chain

The user requested a much quieter competitive screen: remove the paper tallies,
per-team clocks, checkpoint/team headings, Jezero/traverse labels, MATCH strip and
Go/Avoid/Next buttons. Enlarge the maps, use plain color names instead of dot patterns
and context codes, and make each card reveal last a configurable duration.

## Interaction

Four enlarged maps, four cards each. An initial card supplies the first lookup. It
hides automatically after the shared reveal duration (10 seconds by default, 20/30
available). The audience votes from that icon/color, and the representative flips a
category in the next row. Input is locked during the reveal. At expiry the card hides:
a kill card causes automatic avoidance; any other card causes movement. Missing a kill
elsewhere in the row ends that rover and dissolves its map using the original sand
effect. Successful movement animates, with a dashed detour for avoidance. Four successful
flips finish. No manual Next or Go/Avoid decision remains, and no false-avoid outcome
is possible. The shared duration control also updates active reveals from their start.

Hidden card backs are neutral. Only the currently visible card shows its own context
color/name. End states show only OUT or FINISHED in the card area. The collaborative
page, its rendering assets and deployment configuration were unchanged this revision.

## Necessary model revision

The old independent-checkpoint model could not support this UX: a flipped card often
was not the next checkpoint cue. Replaced it with PW2 contiguous routes. The exact
revealed icon/color becomes the next lookup for every possible choice, including slope,
full/dead battery and safe ground. All 24 reachable pairs appear on every sheet.

Context is now specific to the observed icon and remembers selected history two squares
back. Red/blue refer to older haze; amber/green to older soft ground; purple/pink to
older storm/sand, with purple taking precedence for haze/soft observations. The complete
mapping is in `paperweights/competition/README.md`. It does not use hidden companions or
future outcomes. Internal C01-style IDs remain implementation identifiers only.

Historical paper observations and live routes use the same transition algorithm. The
60,000-transition archive obeys the original qualitative storm, sand and lagged-battery
rules. Its smallest cue bucket contains 2,727 observations. Category suggestions retain
the explicit failure-focused/exploratory historical selection policy, stratified per
team. Votes describe inspection suggestions, not direct hazard probabilities.

Rehearsal seed 15 is explicitly selected. Paper-modal play yields 1/1/2 finishers for
15/100/200 people; eliminations occur in round 3, finishes in round 4. Across 500 unfiltered
seeds, mean finishers are .988/1.578/1.690, versus .722 for clue-independent inspection.
The map is fixed independently of attendance and choices; human decisions may differ.

## Paper and team distribution

Regenerated all production duplex packs with plain RED/BLUE/AMBER/GREEN/PURPLE/PINK
labels, no dot patterns or context codes, and three instructions without a fixed time.
The approved outlined rectangles, monochrome glyphs, inverted kills and white background
remain. Both sides have 24 pairs. Final pack IDs:

- `PW2-15-15-fb7b11abfe`: 15 physical sheets / 30 duplex pages.
- `PW2-15-100-1afd11f78a`: 100 physical sheets / 200 duplex pages.
- `PW2-15-200-95d7a79806`: 200 physical sheets / 400 duplex pages.

Prior PW1 printouts are in `printouts/archive/`, clearly marked incompatible; they are
removed from the active game pack index. The UI rejects obsolete schemas rather than
silently breaking the chain. The print command inherits the model's default seed.

Anyone can choose any team, then receive that team's stack: A top-left, B top-right,
C bottom-left, D bottom-right. Everyone can answer every cue, but mixing random subsets
changes realized proportions and can swing close votes. Keep assigned stacks together:
4/4/4/3 for 15 people, 25 each for 100, 50 each for 200. The small printed team/person
identifier remains, despite removal of team headings on screen.

## Verification

Delegated UI, model and print work to the existing three agents. Root reviewed the
model, visuals, documentation and actual PDF extraction. Five model tests check all
60,000 historical transitions, all 256 four-choice paths per team, contiguous history,
exact cue closure, every-person coverage and attendance-independent maps.

Playwright played the 15- and 200-person games by counting actual sheet entries for
the last visible cue. It confirmed one/two finishers respectively, no extra flip during
reveal, exact cue handoff, removal of all requested panel text, timer extension to 30
seconds, real default expiry at 10,016 ms, sand dissolve completion, go/avoid movement,
reset and dark/light behavior. Layout fits at 1440 and 1000 pixels; mobile stacks. No
HTTP or JavaScript errors. Captures and logs are in ignored `paperweights/out/`.

Root extracted all 315 production Rover PDF pages and compared every ordered color/
category row, front/back pairing and all 24 cue tallies per team with the browser packs.
The first verifier regex expected unparenthesized labels; corrected it to the actual
Swift-style `(RED)` labels, then all packs passed. Global PDF verification passed 3,165
pages across 50 PDFs (including archived and historical artifacts); 1,260 are active
production front/back/duplex pages. Python compilation passes. Site build assembly
succeeds. No deployment was performed; local review remains on port 8684.

## Team labels restored for distribution

User confirmed keeping assigned stacks and requested matching explicit team labels on
paper and screen. Added a small Team A/B/C/D heading above each map, preserving the
panel footprint, and the same label in the header on both word and Rover sheet sides.
Regenerated all three PW2 duplex packs without changing observations, IDs or assignments.
Browser checks confirm all four labels and no overflow at 1440/1000/mobile widths.


## Easy and Medium competitive modes

Added a difficulty selector, defaulting to Medium; Hard is deferred. Easy displays
all four current-row cards and Go/Avoid buttons. Correct actions advance immediately;
going into a kill or avoiding a safe square eliminates the team with the existing
sand dissolve. Four correct decisions finish. Easy has no reveal timer. Medium retains
the initial reveal and timed single-card lookup chain. Switching modes resets all teams.
Team labels, original glyphs, maps and dark/light themes remain. UI dot separators
were replaced with ASCII dashes.

Added a full-width “Avoid these:” strip to every production Rover back with original
storm, dead battery and sand-pit icons. Word fronts retain their 24 pairs; Rover backs
retain all 24 lookup pairs. Team stacks, observations, routes and pack IDs are unchanged.
The same papers support hazard recognition in Easy and category lookups in Medium.

Playwright checks passed for 15- and 200-person packs: Easy shows all cards, has no
timed expiry, finishes all teams on correct decisions, eliminates missed hazards and
false avoidance, and resets cleanly between modes. Existing Medium paper-driven play
still yields one/two finishers. Both modes fit desktop/mobile layouts with no browser
errors. Root visually reviewed the Easy screen and the new paper strip. The static
site assembly succeeds; no deployment was performed.

Regenerated all 15/100/200 packs. Independent PDF extraction passed for all 315 Rover
backs and 630 duplex pages: all ordered lookup rows match game data, team labels and
front/back pairing agree, and the hazard strip appears on Rover backs only. Generator
checks also passed page counts, text bounds and removal of typographic dot separators.

## Brainstorm - one audience decision across difficulty modes

User reports Easy works well but worries about switching from Go/Avoid voting to category
voting in Medium. Requested ideas in both directions and a self-contained handoff.
Created `narrative/GO_NOGO_DECISIONS.md` with the exact current UI/model/print semantics,
card-selection alternatives, same-square and next-square binary-vote alternatives,
tradeoffs, generation requirements and prototype acceptance checks. No gameplay or
print artifacts changed in this checkpoint.

Recommendation for discussion: retain Easy and prototype same-square Go/Avoid in Medium.
A printed outcome would label the whole historical square, including hidden companions,
not just the pictured card. Existing inspection-biased category samples must be rebuilt
from the full archive; simply changing their labels would not yield valid outcome votes.
Current colors encode older history and can support inference without revealing answers.

Read current UI and generator, then counted same-square hazards directly across the
60,000-record archive: RED haze 69.2%, BLUE haze 36.8%, AMBER soft 68.7%, GREEN soft 37.3%,
PURPLE flat 44.7%, PINK flat 55.5%; source-square baseline 58.9%. These exploratory
frequencies are recorded as evidence of potential, not new-game performance claims.
The handoff separates source versus target timing, warns against selection leakage and
averaging correlated clues, and requires fresh multi-seed playtests for any binary pack.
