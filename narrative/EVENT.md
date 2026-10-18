# Rover workshop: discover, transfer, test

Living event outline, 6 October 2026. The stage → reveal → sealed competition → replay sequence records the intended event. Timings, lunar mechanics and competition details below are proposals for testing, not completed implementation. See [COMPETITIVE.md](COMPETITIVE.md).

## The lesson

Start with an outcome that matters. Find observations that warn of it early enough to act. Test the proposed relationship on cases that could prove it wrong. Turn a useful, explicit decision rule into a tool, then keep checking it against new observations.

The event should teach people how to repeat this process with their own data. Knowing the Mars hazard rules is the example, not the final achievement.

## Current revision: study many environmental cases, compete on fourteen

**Executed research checkpoint:** [real Mars evaluation](../space/rover-run/benchmarks/mars-real/README.md). A small public release supplies actual slip and interruption records, but these are not equivalent to rover deaths and lack verified matching terrain labels. A real-DEM planner prototype responds to supplied rules; that is a simulation result, not real-world survival validation. The large-study/short-race format remains a proposal pending a suitable evidence board and audience playtest.

The first lunar proposal below was rejected as too focused on equipment state. Preserve the familiar environmental language: sand, slopes, rocks, craters, sunlight and shadow. Probability, two- or three-variable combinations and perhaps a short sequence are sufficient. There is no requirement to teach trend or accumulation.

Keep the Hard → Easy facilitation sequence. Replace the assumed small lunar archive with a larger environmental study board, potentially around 100 cases. Let the audience help discover the indicators. Follow this with a sealed 14-square competition, preferably supported by a larger hidden evaluation set for the final comparison.

Show study cases as several familiar strips with the existing four card rows and white outcome squares. Everyone should have access to the same archive; groups can volunteer to examine different strips. Retain a plain-language team rule and the counts supporting it. For example: “Sand alone produced difficulty in x of n cases; sand on a slope produced difficulty in y of m.” Count denominators matter: 3 of 4 and 30 of 40 offer different amounts of evidence despite the same observed proportion.

Do not reward specificity for its own sake. Ask which extra condition improved predictions on unseen cases. A rule matching just one historical failure can look perfect and travel badly.

### Real Mars feasibility: initial source check, not a completed data audit

- NASA documents a Curiosity climb combining a 23-degree slope, slippery sand and wheel-sized rocks with repeated interrupted drives. This supports investigating environmental combinations, but one account does not establish a probability table. [NASA climb account](https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-rover-faces-its-toughest-climb-yet-on-mars/)
- A seven-year mobility study reports 738 attempted drives, with 116 prevented or stopped early by protection software. Those are not all terrain failures; any benchmark must separate relevant causes and preserve safe comparisons. [NASA mobility study](https://ntrs.nasa.gov/citations/20220000780)
- AI4MARS supplies terrain classifications, useful for environmental cards, but is not itself a table of traversal outcomes. [NASA dataset catalogue](https://data.nasa.gov/dataset/ai4mars-a-dataset-for-terrain-aware-autonomous-driving-on-mars)
- A September 2026 preprint describes Perseverance imagery paired with slip and tilt over 500 sols and 45 km. Its project page currently labels the dataset “coming soon.” It is a promising lead, not a confirmed downloadable workshop dataset. [Paper](https://arxiv.org/abs/2609.24952), [project and release status](https://darren-chiu.github.io/learning-to-drive-on-mars/)

First feasibility test: can we assemble environmental observations known before traversal, an independently recorded outcome, enough contrasting cases, and separate drives for testing? Then check whether simple rules remain useful after bucketing into readable cards. If not, do not advertise the game as a real-data validation.

High slip or terrain-related interruption may provide a workable outcome more often than complete immobilisation. Label it accurately. Observed routes also reflect planners' avoidance of danger; missing outcomes on avoided ground are unknown, not safe. A retrospective replay can evaluate warnings on observed segments but cannot establish the effects of arbitrary alternative routes.

### Moon alternative: environmental cards

Possible rows: slope, rock abundance/obstruction, landform (rim/floor/ridge), and sunlight/shadow. Candidate questions concern difficult passage or entry into an unsuitable shadowed region. Define the specific outcome first; shadow alone is not universally a failure.

NASA publishes lunar slope, illumination and other environmental maps. This establishes a basis for a map-backed board, not a ready dataset of rover failures. Layer resolution and location must be compatible; a regional map cannot label individual wheel-sized obstacles. [NASA environmental map gallery](https://science.nasa.gov/moon/image-galleries/revealing-the-invisible/)

If the outcomes are assigned by an authored rule or suitability threshold, say so. Testing teams against such outcomes demonstrates discovering that model; it does not validate an empirical probability of a lunar rover getting stuck. Avoid defining failure directly from the four cards and then claiming that discovering the same formula is independent scientific evidence.

For now, prioritise auditing real Mars traversal cases. Keep a lunar environmental board as the second option, and keep the prior equipment/resource proposal below only as a record of an unselected direction.

## Event sequence — apply the current study-board revision above

### 1. Play Hard mode on stage — about 5 minutes

Four or five representatives stand for the rest of the room. Explain the objective, actions, lives and two-card attention budget. Let them play with incomplete information.

Use a short time cap rather than requiring everyone to lose. If someone succeeds, ask what evidence supported their decisions. Do not manufacture failure or make participants the joke: the difficulty is deciding with limited observations.

### 2. Flip to Easy and investigate — about 10 minutes

Show the whole map and all card rows. Preserve the white squares identifying outcomes and the alignment of map positions with card columns. Use the actual replay as the starting point.

| Prompt | What participants do | Follow-up that tests the answer |
| --- | --- | --- |
| **A. What ends the run?** | Identify sand, storm and the battery constraint. Locate examples on the map. | What exactly counts as the outcome, and when does it happen? |
| **B. What was the earliest warning in the same row?** | Scan backwards from outcomes: haze before storm, for example. | Does the warning appear before other storms? Does haze ever occur without a storm? |
| **C. Which other variables help?** | Compare other rows at the outcome column and at earlier columns. | Does context explain why apparently similar warnings end differently? Was that context observable before the decision? |
| **D. Which readings arrive too late for this prediction?** | Find measurements that mainly report what already happened. | Are they useless, or useful for another decision? |

Distinguish “earliest visible warning in these examples” from “proven earliest warning everywhere.” Look for safe cases as actively as failure cases.

Battery is a useful nuance: a depleted arrival battery can report the cost of an earlier hazard while still requiring recharge before the next move. A lagging indicator for one outcome can be a vital current-state measurement for another decision. Ignore it only for a prediction it cannot inform.

Finish with one explicit conditional rule and a counterexample to a simpler rule. The audience should see how the model was derived, not just hear the correct answer.

### 3. Transfer the method to a new world — about 7 minutes

Introduce the lunar board using the same interface. Explain what each card measures, what constitutes failure and what actions do. Do not reveal the predictive relationships.

Give all teams the same revealed archive of lunar observations: multiple outcome examples, matching safe cases and sufficient prehistory for the intended patterns. Several short histories may teach more clearly than one long route. Keep this evidence visible during competition.

Ask: “What would you inspect first? What rule would you try? Which example could show it is wrong?” Give a short practice continuation if time permits, then capture a provisional rule in one or two sentences.

This is the bridge between instruction and a fair sealed test. New variables plus no evidence would demand guessing. New variables plus examples let participants apply the method themselves.

### 4. Sealed competition with audience participation — about 10 minutes

Use a fresh lunar route governed by the same relationships as the lunar archive. Each representative consults a section of the audience. Keep observations limited and decisions short.

Use the familiar move loop, not a questionnaire between squares. Preserve past reveals. Record the selected cards, decision, result and any permitted strategy revision for the replay.

Apply a common timeout. Use safe science score as the initial winner criterion, with progress also visible. Equal rules and information budgets matter more than quick clicking. Keep team-specific future information off the shared stage display until the replay.

### 5. Compare replays — about 5 minutes

Align replays by route position or observation time, not by which team clicked faster. Reveal the full map with white outcome squares.

Pick two or three decisive contrasts:

- Same current reading, different recent history: why did the teams act differently?
- A successful warning and a false alarm: what contextual evidence separated them?
- An avoid that cost science versus a justified avoid that preserved a life.
- A failure the model could have anticipated versus one for which the available evidence was inadequate.

Ask each team to identify one rule they would retain and one they would test next. A winning score alone does not establish a reliable model.

Proposed total: roughly 37 minutes, plus introductions and questions. Timings should follow a rehearsal.

## Earlier sealed-world proposal: a lunar crater-rim route

The environmental backdrop remains a candidate. The equipment-card and resource mechanics below are parked, not the current recommendation.

The lunar south pole is a promising candidate: crater topography produces strong illumination contrasts, and illumination changes over time. NASA's [south-pole shadow visualisation](https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/) makes this visible. The [USGS lunar topographic map](https://pubs.usgs.gov/sim/3316/) provides a primary terrain reference; an appropriate local elevation raster still needs to be selected and checked before building a playable route.

Keep the same contour renderer. Craters can appear as closed contours; retain the map proportions, card alignment, typography, icons and white outcome marks. The audience learns new measurements, not a new interface. No new 3D scene is needed.

Gravity is a poor first card choice: lunar gravity is an important background condition, but ordinary route-scale variation is not the useful changing signal for this exercise. NASA's [Moon facts](https://science.nasa.gov/moon/facts/) supplies the physical context. Likewise, do not move Mars's wind-driven dust-storm story unchanged to the Moon.

### Candidate four cards

This is an **authored teaching simulation on a real terrain backdrop**, not a measured lunar dataset or an operational physics model.

| Card | What participants observe | Possible role in the lesson |
| --- | --- | --- |
| Sunlight | Sun / partial shade / shadow | Exposure context; a single shaded interval differs from prolonged shade |
| Demand | Low / medium / high electrical demand | Explains why similar light histories deplete charge at different rates |
| Battery | A small visible charge scale | Rate of decline and accumulated deficit warn of power loss |
| Temperature | Cold / operating range / hot, with history retained | A trend towards a limit can warn earlier than the final extreme reading |

Two outcome definitions to explore: **insufficient power to continue** and **temperature leaving the operating range**. Mark their occurrences with the familiar white squares when the route is revealed.

The proposed new reasoning is “how long has this persisted?” and “which direction is this moving?” rather than two more one-step warning pairs. A useful contrast is two points with identical current charge but different preceding demand and illumination. Another is similar current temperature with a stable history versus a sustained movement towards a limit.

Do not assert that these four variables capture lunar failures. Exact laws, units, thresholds, predictability and action effects still need authoring and blind testing. Temperature categories must be fine enough to reveal a trend before the failure threshold; otherwise the promised warning is not actually observable.

### Resolve the action model before implementation

There are two coherent options:

1. **Recorded observations:** the archive and sealed outcome sequence are fixed. Teams predict whether a traversal is safe and choose whether to attempt it. Recovery does not rewrite the archived measurements. This is simplest for physical cards and forecasting, but requires clear wording so players do not expect their actions to change the record.
2. **A responsive simulation:** charge or thermal state changes with actions. Keep the state visible and updates simple enough for a physical token track. Outcome locations can then differ between replays; white squares must be labelled as that team's realised outcomes, not universal fixed hazards.

The current reuse guide uses a fixed arrival-resource card. Accumulation influenced by player actions is an extension of that convention, not a cosmetic reskin. Prefer recorded observations for a first workshop transfer exercise unless testing shows the responsive version is just as clear.

“Avoid” and “Recharge” also need meaningful limits. Stopping in shadow cannot magically provide solar power, and a detour does not automatically resolve every thermal problem. Define a plausible safe bypass/service opportunity and its cost, or simplify to the rival-observatories forecasting format. Do not hide arbitrary exceptions behind familiar buttons.

Use explicit observation intervals for time-based relationships. Rover's route columns are spatial positions; they should not silently become equal time intervals. If the lunar display combines travel and time, label the observation step consistently and show any unequal duration needed for the rule.

## Pattern menu for future editions

Choose only two unfamiliar structures for the first transfer round.

| Pattern | Question to ask | Possible later application |
| --- | --- | --- |
| Longer lead time | Does a change two or three observations earlier warn us? | Rainfall preceding changes in water quality |
| Persistence | Is one bad observation different from several consecutive ones? | Repeated household income shortfalls |
| Accumulation | Does exposure build up, and what resets it? | Repeated withdrawals depleting household savings |
| Trend | Is a moderate value moving rapidly towards a limit? | Declining stock before a supply interruption |
| Interaction | Does a signal matter only under another condition? | Disturbance plus an available invasive seed source |
| Delayed recovery | Does removing the pressure leave a recovery period? | Service recovery after a supply interruption |
| Lagging measurement | Does this tell us what already happened? | A report filed after an interruption |

These are hypotheses to investigate in an appropriate dataset, not established relationships for every household, habitat or service. Cross-sectional data cannot supply temporal lead times simply by arranging rows into a journey.

## Closing: take the method home

Suggested closing words:

> You do not need a rover. Pick an outcome your organisation cares about. Define what counts as that outcome and how early you need warning. Look backwards for candidate indicators, including combinations and changes over time. Look for cases where your rule would have been wrong. Try it prospectively on new observations. When it is useful, turn the rule into a tool so every colleague does not have to rediscover it.

An LLM can help express and implement the proposed model. Give it the outcome definition, units and timestamps, observations available at decision time, the candidate rules, and examples the rules should and should not flag. Ask it to preserve a separate set of observations for testing and show uncertainty or insufficient evidence rather than manufacture a confident answer.

A few field trials provide initial evidence, not proof that a model generalises. A useful workshop result can also be “we need to measure something else.” Do not promise that every NGO dataset contains four clean cards or a predictive rule. Once a rule has earned trust on fresh observations, routine application is precisely what the tool is for.
