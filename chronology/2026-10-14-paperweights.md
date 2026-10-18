# 2026-10-14 · Paper Weights → Rover Run

## Checkpoint 1 — scope and source audit

Requested: 15 pilot handouts, reproducible 100–200-person packs, white backgrounds,
shared reading grammar with frozen Rover Run, plus four-team audience-participation
print mockups under `paperweights/rover/`. Do not modify the frozen game.

Read `.prompt/v4_paperweights.md`, `paperweights/generator.py`, `paperweights/sample.jpg`, current
`space/rover-run/src/web/{symbols.js,style.css,deck.json,engine.js,map.json}`,
`space/rover-run/rulebook_v2.md`, and the existing narrative/event checkpoints.
The sample image exists despite the attachment error. The existing `.py` is actually
Markdown wrapping code; it cannot run. Its random truncation also breaks the promised
closure. Original retained as `paperweights/generator.original.txt`.

The supplied corpus has **176 tokens / 51 unique tokens**, not 162. Every token repeats,
but **20 tokens have only one distinct successor**. “old → man” is an example.
Preserve the exact requested corpus and report that fact rather than inventing extra
successors or equating repeated occurrences with branching.

Live `https://rover-run.netlify.app/symbols.js` fetched successfully via curl and was
byte-identical to the local frozen glyph module. Current game: monochrome glyph cards,
white hazard cards, monospaced typography, 14 strips. Battery is dead after **either**
SAND or STORM. The proposed false-avoid death is an extension rule, not in frozen v1.11.

## Checkpoint 2 — Paper Weights generation and visual grammar

Replaced the Markdown-wrapped script with executable Python. Keep all complete copies
of the corpus; fill remainder with whole sentence/observed graph cycles. No unseen
transition is introduced. Verify graph balance, every right token has at least two
left occurrences, and at least two separate people can answer every token. Sort by
left color down column 1, then column 2. Preserve six exact token colors, explicit
color names, white paper and 24 pairs. Save HTML, PDF, manifest and preview.

Random-hand selection followed by random matching entry is not the same distribution
as uniformly selecting a printed pair: some people have several matches. The manifest
records the actual random-hand probabilities as well as raw pair counts. Facilitation
must acknowledge this or use occurrence-weighted sampling when teaching exact counts.

## Checkpoint 3 — crossover model and print contract

Use the exact exported Rover SVG glyphs, black ordinary / white hazard card faces,
and numbered category-color rails outside the faces. The colors are an audience
routing layer; no frozen category colors existed to preserve. Order: 1 battery BLUE,
2 slope AMBER, 3 dust PURPLE, 4 ground GREEN. Group identity uses A–D, not another
competing color code.

Rover sheets contain 11 unique source-card cues (all values of all four categories),
one historical continuation per cue per person, in a two-column six-row layout with
a reading reminder in the final slot. This intentionally uses fewer, larger examples
than Paper Weights's 24 word pairs, so original glyphs remain legible and one person has exactly
one vote per cue. Four separate maps are drawn from the same authored simulator as
the historical archive; sheets never read held-out map outcomes.

The pilot has **15 audience sheets total: 4 / 4 / 4 / 3**. This is a reading/voting
rehearsal, not enough people for fine percentages. Category allocation uses largest
remainders of 30% battery / 20% slope / 20% dust / 30% ground. Allocation is where
historical measurements are placed, not a hazard rate or a learned optimal policy.
All realized vote counts and conditional outcome probabilities are exported.

Simulation preserves soft-before-sand, haze-before-storm, slope exclusions and lagged
battery. Parameters are explicitly authored, not fitted NASA failure rates. The Jezero
contours are reused as a visual reference; simulated slopes are explicitly not DEM
measurements. No claims of real-data validation or equal realized map difficulty.

A second reveal uses the same source square/cue; voters whose category is already
revealed abstain. Re-cueing on the new next-square card would accidentally jump two
squares in the historical pair. After movement, the newly current square supplies
the next cue. Sudden death: going into a hazard, avoiding safe terrain, or moving
on a dead battery ends the run. Recharge remains available.

## Verification checkpoint

At this checkpoint, rendering and validation were still in progress. Completed
results and the later allocation-policy correction are recorded below.

## Checkpoint 4 — review changed the evidence-allocation policy

The fixed 30/20/20/30 allocation in checkpoint 3 was an intermediate implementation.
Review showed that it would produce the same category suggestion after every cue,
which misses the reason for using data. Replaced it with a source-conditioned authored
policy: each category gets weight `1 + 3 × historical next-category danger rate`,
normalized over the four categories. The sampled case is independent of the category
allocation, so we do not preferentially print scary outcomes. Largest-remainder seat
allocation preserves each cue's target shares to within one person per category.

In the 200-person pack (50 per group), the opening HAZE cue allocates **12 battery,
8 slope, 18 dust, 12 ground** votes (24/16/36/24%). After STORM it allocates **26 battery,
6 slope, 7 dust, 11 ground** (52/12/14/22%). These are evidence-location shares, not
hazard probabilities. Group A's pilot includes both HAZE → FULL and HAZE → STORM.
The 4-person groups necessarily round the opening vote to 1/1/1/1; the 3-person group
has no slope voter for that cue. That limitation is printed/documented, not hidden.

## Checkpoint 5 — completed generation and verification

Delivered under `paperweights/`:

- 15-, 100- and 200-sheet Paper Weights PDF/HTML/JSON packs, 24 pairs per page, plus previews.
- 15- and 200-person Rover PDF/HTML/JSON packs, 11 unambiguous cues per person.
- Four different 14-square synthetic card maps and their private facilitator sheets.
- Four-team opening-stage mockup, four paddle templates and a three-square worked
  HAZE → STORM → dead-battery example, at both audience sizes.
- `paperweights/README.md`, `paperweights/rover/README.md`, and
  `narrative/PAPERWEIGHTS.md`: print commands, probability contract, sampling
  caveats, timing of source/target squares, sudden-death rules, and integration boundary.

Verification actually run:

- **8 automated tests pass.** Every integer Paper Weights size 10–200 (191 sizes) retains the
  complete vocabulary, observed edges only and a balanced closed graph. Multiple
  seeds for 10/12/15/100/200 also verify reproducibility and distinct sheets.
- Exhaustive Rover kernel checks over all possible input states: probabilities sum
  to one; sand/storm obey prior-warning and slope conditions; battery lags either
  hazard. A 15,000-draw sampling check agrees with the exact storm probability within
  the specified tolerance. Packs for 15/100/200 preserve one vote per person per cue,
  unique sheet data and four distinct maps; maps are identical across audience sizes
  when the seed is held fixed.
- Decision tests include safe go, fatal unnecessary avoid, correct hazard avoid,
  fatal hazard go, dead-battery movement and recharge. The full-before-storm case
  and dead-after-storm case are explicitly checked.
- **550 pages across 13 PDFs** inspected by `paperweights/verify_outputs.py`: no blank or
  clipped text; audience page counts match manifests. Every Paper Weights page has the exact
  48 printed word instances, correct right text colors and 24 matching filled boxes.
  Paper Weights text spans occupy 247.62 mm vertically, inside the brief's 255 mm allowance.
  All handouts are A4 portrait; stage mockups are one A3 landscape page.
- Visual review of Paper Weights, Rover, facilitator, paddles, worked example and full-room
  stage previews. It caught and fixed outer-CSS inheritance failing on inline SVGs
  in WeasyPrint (invisible strokes/solid contour fills). Explicit SVG presentation
  attributes now preserve the exported paths and correct card appearance.
- Exported glyphs equal the frozen module exactly; manifests' frozen source hashes
  still match; `git diff --exit-code -- space/rover-run` is clean. Existing unrelated
  untracked Moon/Mars/narrative work was not edited. All relative deliverable links resolve.

One test initially used exact float equality for a probability of one; corrected it
to numerical tolerance (the computed value was 0.9999999999999999). This was a test
comparison issue, not a distribution defect.

**Boundary:** these are finished printable prototypes and static stage mockups, not a
live four-board game or a deployed poll. Human reading speed, paddle visibility and
competitive balance still require the requested tabletop rehearsal. No fresh NASA
hazard data or parallel-session state was needed: the chosen path is explicitly
simulated, while using the frozen game's assets and the existing event narrative.

## Review revision — simplified Paper Weights mockup only

User requested reviewing one item at a time. Created `paperweights/mockups/paperweights-clean-mockup.pdf`
(and HTML/PNG plus reproducible render script), using the same first sheet's 24 pairs.
Removed the kicker, sheet counter, global color legend, column headings, lower notes
and footer. Retained only the title, three basic instructions and token pairs with
individual color labels. Added breathing room between pairs. Verified one A4 page,
all 48 token instances and absence of removed text; visually inspected the PNG.
Existing full packs and production generator remain unchanged pending review.

User clarified that the stage keeps the exact deployed black Rover UI and already
has a voting app. White map panels were earlier static print/stage-layout mockups,
not a requested replacement theme; set maps and paddles aside. Explain the audience
sheet in terms of category lookup colors, historical next-square examples and a
vote for which category to inspect. Colors do not appear on or recolor the live game,
and neither a historical example nor its vote is a live safety guarantee.

## Approved word layout and three color-free data concepts

User approved the minimal Swift-style Paper Weights mockup and requested all existing word
packs use it, one output directory, and regeneration instructions. Promoted the
approved renderer to `generator.render_sheet` / `MINIMAL_CSS`; production and sample
now share it. Regenerated 15/100/200-page packs and the one-page approved sample in
`paperweights/words/`. Compared all old/new manifest pairs: assignments are identical. Removed
superseded generated word files from `paperweights/output/` and `paperweights/mockups/`; the latter keeps
only its sample-render script. PDF verification reports now live in `paperweights/checks/`.
Rewrote `paperweights/README.md` with direct print links and 15/100/150/200 regeneration commands.

User reopened guided sampling as a potentially useful gameplay choice. Clarified
that it is not inherently bad: guided allocations can emphasize useful categories,
while votes still represent inspection preferences rather than literal hazard rates.
The stage keeps the original black UI and existing voting app. All votes in the
new mocks select one of four categories; the rep makes the GO/AVOID decision.

Created `paperweights/rover/concepts/`, with two participants for each format (six pages total):

- **A / Field notes:** two literal five-square historical card excerpts, eight adjacent
  transitions per participant. All four categories are visible; people interpret the
  examples and choose a reveal. No authored category-routing policy is applied.
- **B / Signal slips:** ten distinct source-icon → next-card pairs, category suggestion
  printed under the destination. Keeps the earlier danger-rate-weighted attention
  policy, now without redundant colors. Expected modal recommendations are dust after
  haze, ground after soft, and battery after storm; minority suggestions remain.
- **C / Two clues:** eight exact-match rows combining a previous-square cue and the
  already revealed next slope. One meaningful extra match under time pressure. It uses
  the first reveal on slope and suggests only one of the remaining categories.

All preserve the frozen glyph paths and ordinary black / hazard white card faces on
white paper. Rehearsal instructions propose a 10-second window; speed is not human-tested.
The illustrated B sheets show HAZE → FULL / BATTERY versus HAZE → STORM / DUST.
Participant seeds 42 and 1055 were selected to show this contrast, explicitly disclosed
in the guide/manifests: these two examples must not be extrapolated into room frequencies.
All evidence comes from the existing simulated archive and valid kernel transitions.
The future full-room sampling/coverage policy is not yet chosen for these alternatives.

The concept guide also corrects temporal ambiguity: the 75% storm condition uses
prior haze and NEXT non-flat slope, not two observations in the prior square. A full
battery and storm can coexist, so their votes are not mutually exclusive outcomes.
Dead battery can follow haze when the hazy source also contained sand. A few raised
hands demonstrate disagreement but do not reliably estimate a distribution's mode.

Checks: all 8 generation/model tests pass; all 563 pages across 18 current/retained
PDFs pass bounds/pagination checks. Every production Paper Weights page has 24 pairs with exact
word colors/fills, and all removed decorations are absent. Inspected the updated word
preview and all three concept layouts, including the contrasting second guided sheet.
All current guide links resolve; `git diff --exit-code -- space/rover-run` remains clean.
Updated the session narrative with the current decisions while labelling the earlier
colored-sheet/paddle material as historical. No format is selected for the data-sheet
rollout yet; the six-page bundle is for the requested brainstorming review.


## Context-color experiment and ASCII separators

User requested ASCII `->` throughout word/data sheets and a new visual experiment:
Swift-shaped icon rectangles on paper matching colored four-card stage panels. Updated
active renderers and saved HTML, then refreshed existing PDFs/previews without changing
their assigned data. Added a PDF-wide check for remaining Unicode arrow glyphs.

Added `paperweights/rover/context/` with simulator, renderer, tests and guide. The six Paper Weights colors
encode persistent/fresh/no prior haze crossed with current flat/non-flat terrain. This
refines the initial previous-dust key, which would force every storm into one color.
The selected key allows RED/BLUE STORM and all six HAZE colors. Same icon/color means
a compressed context bucket, not identical complete histories or learned attention.

Paper uses production Paper Weights geometry/palette and original Rover glyphs. The right word
is a historical next category. Four cards per stage panel share the source context.
Timing is review of a completed source square with all readings known, recommending
an inspection in the next square. A newly flipped target interaction must explicitly
decide how terrain is known before deriving its color.

The separate authored simulation makes context predictive; historical observations
and independent fresh next draws share its kernel. Category selection favors dangerous
historical measurements in three of four cases and retains exploratory suggestions.
Votes describe inspection suggestions, not unbiased hazard probabilities. Neither the
simulation nor the colored faces changes the deployed game.

Generated 60 sheets (15/team), two sample sheets, an A3 stage mock and A4 context key.
Each sheet has 24 unique lookups; each team covers all 53 reachable keys at least twice.
Final stage counts in battery/slope/dust/ground order: RED HAZE 3/1/8/3; GREEN HAZE
3/3/5/4; RED STORM 11/1/1/2; BLUE STORM 11/1/1/2. Counts come from assigned sheets.
Source snapshots and square06 progress positions illustrate states, not full maps.

Validation: four new context tests and eight existing tests pass. All 627 pages across
22 PDFs pass pagination/bounds and arrow checks; word pairs retain exact tokens/colors.
Visually inspected final sheets, stage and context key. README links resolve; deployed
Rover source diff is clean. Updated narrative and guides with the current checkpoint.


## Stage-two theme review: mineral, terminal and dot matrix

User selected the four-map layout and requested consistent low-bandwidth mission
visuals, white paper, white/black screen alternatives and preserved hazard inversion.
Created `paperweights/rover/themes/` with three coordinated directions, each containing one
A4 sheet and two 16:10 screens (nine pages), HTML comparison gallery and PDF bundle.
Reused original glyph geometry, Jezero reference map and saved context observations
and vote counts. No new model sampling or deployed-game edits. Live Netlify open
failed; existing local game CSS supplies the reference palette and card conventions.

Moved color to context frames/labels, retaining monochrome faces and inversion.
Mapped prior color names to C01–C06, with redundant six-dot patterns, allowing a
pure monochrome alternative. Paper retains exact Swift pair geometry, using outline
boxes and solid black only behind hazard glyphs. Documented the difference between
context and hazard and the potential recognition-speed tradeoff of dot patterns.

Every generated page passes single-page and text-bounds checks. Visually inspected
white mission screen, dark terminal screen and monochrome paper; retained source
review timing and illustrative map limitations in guide. Full palette adoption into
word sheets awaits visual direction selection; existing packs remain unchanged.


## Implemented competitive stage, rename and duplex production

User approved dark default/light option and explicitly authorized integrating a competitive
stage into Rover Run. Read the original agent's `narrative/INTEGRATION.md`; followed separate
page/state/copy architecture. Added only separate stage-selector files and HTML includes to
the collaborative page. Netlify retains its publish directory; `paperweights/build_site.py`
copies the independent stage beneath it. Verified assembled build in a temporary local server,
including both navigation directions and loading the 200-person pack. No deploy/push performed.

Renamed `hlm/` to `paperweights/`, project titles to Paper Weights, narrative and chronology
filenames/links likewise. Refreshed existing PDF/HTML/PNG deliverables. Delegated model,
UI and print production to three agents; root reviewed integration, model constraints,
actual rendered PDF rows, themes, browser screens and build behavior.

A first competition model pass allowed unreachable storm contexts and non-lagged dead
batteries. Rejected it, paused production renders, and replaced it with a joint mixture of
physically consistent source/target observations. Original qualitative storm/sand/battery
rules now pass across every cue/outcome. The 24 keys include valid storm cues only in C01/C02;
other contexts use a full-battery cue. Unshown lateral source readings distinguish ambiguous
cases. Four surveyed checkpoints are independent windows, not falsely contiguous squares.

Every participant has all 24 cue keys once. Each team's suggestions are stratified to the
shared inspection distribution, then shuffled among people. Maps use a separate random stream
and do not change with attendance. The room-wide 200 pack includes battery/dust 19–19 and
ground/dust 20–18 examples (remaining votes go to other categories), all 50 voters participating.
Category suggestions emphasize historical failures with exploration; they are not direct
hazard probabilities. The game labels the pack-derived bars PAPER; the user's live voting
app is not wired in or impersonated.

Selected and disclosed rehearsal seed 374 after checking pacing; it yields two finishers
at 15/100/200 under the documented paper policy. Teams A/C exit rounds 3/4, B/D finish 4.
No runtime rejection sampling forces these results.500 unfiltered seeds, all results retained:
paper policy mean finishers .984/1.188/1.116 at 15/100/200, uninformed .228; one/two finishers
62/66.8/62.6%. Some arbitrary seeds have zero or four finishers; human decisions can differ.

Production packs PW1-374-15-8dac60b141, PW1-374-100-95db2b2ab6 and
PW1-374-200-f0f8f62022 contain 30/200/400 duplex pages respectively. Front/back 24 rows,
three instructions, matching muted palette, small pack/team/person footer. `build_printouts.py`
regenerates sheets and browser pack together; supported 12–200 people, defaultseed 374.
README explains actual-size/A4/color/long-edge printing and exact pack selection.

Checks: 5 competition tests + 8 existing tests pass; original Rover simulator still passes.
Print-agent global audit: 1,905 pages / 41 PDFs verified, no clipped text or Unicode arrow glyphs,
old project title absent. Root extracted all 315 actual Rover PDF pages and matched ordered
category/context rows, all 630 duplex pages and identities, plus every live tally to game data.
Playwright 15/200 runs produce expected 2 finishers with no HTTP/JS errors. Single-flip enforcement,
false avoid, missed hazard, all-finish path, reset, theme persistence, 1440/1000/mobile layouts and
optional stage-list fallback pass. Original core files remain byte-identical; changes outside
project are limited to selector includes/files, build config, ignore rule and named docs.

Local review server: port 8684, PID 1952706. Temporary build server on 8686 is stopped after
verification. Captures and browser logs live in ignored `paperweights/out/`; model simulation
and PDF verification reports are retained under competition/ and checks/.
