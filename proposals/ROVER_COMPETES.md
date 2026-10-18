# Moon Run — Competitive Transfer Game Proposal

## Purpose

Build a new `moon/` game alongside Rover Run.

It should look, feel and operate as much like the existing Rover Run game as possible: same visual language, card grammar, typography, spacing, map/card alignment, stage-friendly projected UI, interaction patterns, replay style and overall restraint.

Do **not** redesign Rover.

The point of Moon is to take the method participants have just learned on Mars and make them use it on a new dataset.

Mars teaches:

- identify what ends the run;
- look backwards from that outcome;
- identify candidate indicators;
- combine variables where needed;
- distinguish useful early warnings from measurements that arrive too late;
- test a proposed rule against cases that could prove it wrong.

Moon should test whether participants can repeat that method without simply applying the known Mars rules.

The existing Rover game deliberately teaches warning → outcome, contextual interactions, false alarms, lagging indicators and attention limits. Moon should extend this logic rather than introduce a different kind of workshop.

Keep this simple. The additional sophistication should come from **more evidence distributed across participants**, not a large number of mechanics or variables.

---

# 1. Event role

The intended event sequence is:

### Mars Hard

Four or five representatives play Rover Run on stage with incomplete information.

They struggle because they do not yet know what matters.

### Mars Easy

Reveal the whole board.

Facilitator walks the room through:

**A. What ends the run?**

**B. What appeared before those outcomes?**

**C. Which other observations explain why the warning sometimes matters and sometimes does not?**

**D. Which observations mainly tell us what already happened and therefore arrive too late for this prediction?**

This follows the existing workshop design.

### Moon archive

Now give the audience a different world with different variables and different hidden relationships.

Participants receive fragments of a much larger historical dataset.

They propose indicator rules and test those rules using a shared evaluator.

Strong rules can be published upward to their representative.

### Moon model run

Each representative assembles a team model from the rules their audience has submitted.

Run that model through the larger Moon dataset.

Most routine decisions should happen automatically.

At a small number of deliberately designed points, rules conflict or are insufficient. The rover stops and asks the representative to decide.

This demonstrates the role of a human when a model cannot make a clear decision.

### Sealed 14-square competition

Take the representatives' models to a fresh unseen Moon route.

The new route follows the same underlying relationships as the archive but contains new combinations.

Run the models prospectively.

### Sudden death

Finish with a short theatrical round.

Representatives see the available observations for one unseen square and choose:

**GO** or **NO GO**.

For this special finale:

- GO on a death square = eliminated.
- NO GO on a safe square = eliminated.

Explain explicitly that this is a deliberately harsh finale rule: both misses and false alarms now matter.

Continue until one representative remains, or until the planned number of sudden-death cases has been exhausted.

This allows the room to see that even the historically best-performing model does not necessarily win every future case.

---

# 2. The core conceptual change

Rover currently uses a small fixed route of 14 squares. The hidden relationships are deliberately discoverable through repeated examples such as soft before sand and haze before storm, with context changing whether the warning becomes an outcome.

Moon should not simply replace:

`haze → storm`

with:

`shadow → battery death`.

That would test memory of a pattern shape, not transfer of the method.

Instead, Moon should introduce a tiny new rule language while keeping the reasoning visual and understandable from cards.

The first version should support only three rule types.

## BEFORE

**Player question:**  
**What tends to appear before failure?**

Example:

`shadow BEFORE power loss`

This is the closest analogue to haze before storm.

---

## PERSISTS

**Player question:**  
**What becomes dangerous when it lasts?**

Example:

`shadow PERSISTS for 3 observations → power risk`

One shadow observation should often be perfectly safe.

Several dark observations in succession can be dangerous because a solar-powered system has remained without sufficient light.

The important conceptual difference is:

> One bad reading is not necessarily the signal. The duration of the condition may matter.

---

## WITH

**Player question:**  
**What only matters when another condition is present?**

Example:

`persistent shadow WITH cold → high danger`

or:

`persistent shadow WITH steep/loose terrain → mobility danger`

Neither ingredient should necessarily predict the outcome well by itself.

The combination should improve the rule.

---

Do not add trend in the first version.

Do not make participants learn statistical vocabulary before playing.

The UI can internally call these primitives `BEFORE`, `PERSISTS` and `WITH`, but the interface should always accompany them with the plain-English question.

---

# 3. Why Moon needs a large archive

The Mars board is small because it is a worked example.

Moon is different.

The audience is supposed to propose rules, discover that their local experience may mislead them, and verify those rules against more evidence.

Use approximately **80–120 historical observations**, with **~100 as the current target**.

Do not interpret this as one gigantic 100-column visual board that everyone has to read from the projector.

The dataset should be generated internally from **multiple short histories**.

For example:

- 15–20 histories;
- roughly 5–8 observations each;
- some ending in failure;
- some ending safely;
- some containing false alarms;
- some containing recovery;
- balanced across the different failure types.

The existing event proposal already notes that several short histories can teach more clearly than one very long route.

Internally retaining explicit history boundaries is important. A rule evaluator must not accidentally treat the final observation of one historical episode as preceding the first observation of another.

The final dataset can still appear as a larger archive to participants.

---

# 4. Dataset construction requirements

The archive must be deliberately authored so that all three rule types are genuinely discoverable.

Do not generate values randomly and then search for accidental correlations.

Begin with the hidden relationships, create histories around them, and then test the resulting archive.

The archive should contain enough evidence for:

- useful BEFORE rules;
- useful PERSISTS rules;
- useful WITH rules;
- plausible but incomplete single-variable rules;
- false alarms;
- missed outcomes;
- lagging observations that correlate strongly but arrive too late;
- safe cases that resemble failure cases;
- at least two or three distinct outcome types or failure modes.

No one failure should dominate the archive.

For example, avoid a dataset where 80% of deaths are power failures and mobility/thermal failures occur only occasionally. A participant who predicts only the dominant outcome should not appear to have discovered the system.

Construct and report archive balance explicitly.

Possible target:

- approximately similar counts of the principal failure types;
- sufficient safe histories to make false alarms meaningful;
- sufficient occurrences of each underlying rule that one case does not establish it.

Rover's reuse principles already require repeated outcomes, false alarms and clean counterexamples rather than single anecdotes. Apply the same discipline here.

---

# 5. Moon variables

Keep the variable set tight.

Reuse Rover words, icons and states wherever they make sense. Add new vocabulary and glyphs only when Moon genuinely requires them.

Start by experimenting with roughly five variables:

## Light

Possible states:

`light / shadow / dark`

This is a genuinely new environmental variable and should carry persistence relationships.

## Temperature

Use an ordered but plain-language set:

`hot / warm / cool / cold`

Avoid labels such as `very cold`.

## Ground

Reuse Rover visual language where possible.

Possible states can remain close to:

`firm / soft-or-loose / hazard`

The exact middle/high terminology may change after testing, but reuse existing icons wherever sensible.

## Slope

Reuse Rover:

`flat / slope / steep`

## Battery

Rover currently treats this as binary:

`full / dead`

Experiment with one intermediate Moon state:

`full / low / dead`

Do not assume the extra state is necessary. Keep it only if it creates useful early information without making the rules harder to understand.

---

The implementation agent is encouraged to propose one or two alternative variables if they materially improve the teaching dataset, but must justify them against this standard:

> Does this create a useful indicator relationship that participants can discover visually from cards?

Avoid spacecraft subsystem telemetry for its own sake.

The game should still feel like reasoning about environmental conditions, not operating a spacecraft engineering console.

---

# 6. Real Moon data and the map backdrop

Before building the rule/evaluation game, investigate and prototype the Moon visual layer.

The preferred setting remains a lunar crater or crater-rim landscape, ideally at the south pole where topography, illumination and shadow provide a strong visual basis.

The current event plan suggests retaining the Rover contour renderer so craters appear as closed contour structures and the interface remains familiar.

Build a small visual research/prototype pass first.

Experiment with:

- dot-matrix or line-rendered crater relief;
- contour-only lunar terrain;
- combinations of contours with restrained crater texture;
- south-pole elevation data if a suitable raster is available;
- possibly illumination/shadow overlays if they remain legible.

The goal is not scientific visualisation for its own sake.

The goal is:

> **Can this look recognisably lunar while still reading instantly as the same game as Rover?**

Use the current Rover board dimensions, card alignment, typography and visual hierarchy.

Take screenshots at the actual projected-game viewport and compare them directly with Rover.

Do not proceed with an ornate lunar map if it compromises card readability.

It is acceptable—and probably preferable—for the first Moon version to use **real lunar terrain as the backdrop while the simplified variables and failure relationships remain authored teaching data**.

Be explicit about that in documentation.

This matches the existing project's data-honesty convention: real backdrop and measured features where available, authored relationships where required.

---

# 7. Divide the archive across the audience

Assume approximately:

- 4 representatives on stage;
- roughly 20 supporters per representative;
- potentially more participants depending on final event attendance.

The full archive should **not** be shown identically to every participant.

Participants receive small cutouts or printable cards containing only part of the evidence.

The distribution can vary in two ways.

## Different histories

Participant A sees one short historical episode.

Participant B sees another.

This means nobody can know whether a pattern from their own evidence generalises.

## Different variables from the same history

This is especially useful.

For example:

Participant A receives:

`Light + Temperature`

Participant B receives:

`Ground + Slope`

Participant C receives:

`Battery + Light`

for the same historical sequence.

This means different participants hold different pieces of the same event.

The activity physically demonstrates why combining measurements matters.

The distribution system should be constructed intentionally so that, across each representative's constituency, there is enough coverage to discover every important rule.

Build a generation/printing view that makes it easy to inspect exactly what each participant would receive.

---

# 8. Participant workflow

The participant task should remain extremely simple.

They inspect their fragment and work backwards from an outcome.

Then they construct one candidate rule using the tiny rule language.

For example:

### BEFORE

`______ happens before ______`

### PERSISTS

`______ lasts for ____ observations before ______`

### WITH

`______ WITH ______ predicts ______`

Participants should be able to complete this with pen and paper or through a very simple phone interface.

Avoid free-form programming syntax.

Avoid asking them to calculate statistics.

Their job is to identify a hypothesis.

---

# 9. The rule evaluator

This is a central mechanic.

Participants only see part of the evidence.

The evaluator has access to the entire historical archive.

A participant enters a proposed rule and presses **EVALUATE**.

The system tests the rule across every applicable history.

The plain-English evaluation questions are:

> **Did it catch bad outcomes?**

and

> **How often did it cry wolf?**

Those two questions should drive the UX.

Do not reduce evaluation to raw accuracy because outcomes may be uncommon and trivial rules could score misleadingly well.

At minimum calculate:

- number / proportion of relevant failures caught;
- number / proportion of alerts that were false alarms;
- useful lead time before the outcome;
- number of cases to which the rule applied.

Internally the system may use sensitivity, precision or other standard quantities, but those terms do not need to be shown to participants.

Possible participant-facing result:

> **VERIFICATION 82**

> Caught 9 of 10 failures  
> 3 false alarms  
> Usually warned 2 observations early

Then:

> **GRADUATES**

or:

> **KEEP TESTING**

Use a configurable graduation threshold, initially around **70**, but do not hard-code the final threshold until simulation shows an appropriate distribution of good, partial and bad rules.

A strong rule should score high.

A weak single-variable rule should often catch some failures but also produce many false alarms.

An extremely specific overfit rule should be penalised because it applies to too few cases or misses many valid outcomes.

A lagging rule may correlate very strongly but should be marked as arriving too late.

Example:

> Critical battery → power loss

Possible evaluator response:

> Strong relationship  
> Warning arrives at failure  
> Too late to act

This distinction is important:

> **Being related to an outcome is not the same as being useful for predicting it.**

---

# 10. Rule publication

Participants submit rules individually.

Only rules above the graduation threshold can be offered to the representative.

The representative should not see hundreds of duplicates.

Cluster identical or functionally equivalent rules.

For each candidate show something like:

**Persistent shadow → danger**  
Verification: 79  
Caught: 8/10  
False alarms: 4  
Supporters: 12

This creates a clean constituency mechanic.

The representative is not guessing alone.

Their section of the audience is effectively functioning as a distributed analysis team.

Do not automatically select the highest-scoring rules.

The representative must choose which rules enter the team's model.

---

# 11. General versus over-specialised rules

Design the dataset so that different levels of abstraction are possible.

For example, participants may observe:

**Rule A**

`persistent shadow → elevated danger`

versus:

**Rule B**

`persistent shadow + cold → thermal failure`

versus:

**Rule C**

`persistent shadow + low battery → power failure`

The archive should contain enough evidence that a broadly useful precursor can sometimes outperform a collection of brittle one-off explanations.

For example:

- persistent shadow may raise the chance of several different failures;
- additional variables determine which failure occurs;
- a participant who notices the shared precursor has learned something more transferable than someone who memorises three unrelated combinations.

However, do not make the general rule magically perfect.

Specific context should still improve decisions where appropriate.

The evaluator should let this emerge from performance rather than explaining it beforehand.

---

# 12. Model assembly

The representative chooses a small number of graduated rules.

Keep a hard cap initially—perhaps 3–5 active rules.

The purpose is not to build a giant rules engine.

Each rule can recommend something such as:

- GO;
- NO GO / AVOID;
- RECHARGE;
- or possibly flag risk without choosing an action, depending on implementation.

The exact action grammar should reuse Rover actions wherever practical.

Do not invent many Moon-specific commands unless required.

---

# 13. Deliberate conflicts and the human in the loop

The dataset and final run should deliberately contain a very small number of situations where accepted rules disagree.

For example:

**Rule 1**

`persistent shadow → NO GO`

**Rule 2**

`persistent shadow WITH firm ground → GO`

A future square can satisfy both.

The model should not silently choose one.

It should stop.

Show:

> **MODEL NEEDS YOU**

and display:

- the visible cards;
- the relevant recent history;
- Rule 1 and its recommendation;
- Rule 2 and its recommendation.

The representative chooses.

Do this only occasionally—roughly **twice during the long model run** is a good starting target.

The purpose is to show:

> A useful model can handle routine situations and surface the cases where judgement is still required.

Do not intentionally crash the software.

The “failure” should be an explicit state of model uncertainty or conflict.

---

# 14. Human effort / fatigue

Track how often the representative has to intervene.

A poor or overstuffed model should create more unresolved cases.

A focused model may handle more situations automatically.

At the end, display something simple such as:

> Automated decisions: 92  
> Human decisions: 8

or:

> Model handled 12/14  
> Representative needed: 2/14

Do not create another complicated score unless testing shows it is valuable.

The visible intervention count may be enough to communicate the point.

A model is valuable partly because it removes repetitive reasoning while escalating ambiguous situations.

---

# 15. Historical model evaluation

Once a representative finalises their model, run it through the full historical archive visually.

This should look like the rover moving rapidly through the Moon dataset, flipping cards and applying rules.

Make it readable rather than instantaneous.

At each observation:

- show which rule, if any, fired;
- show the action;
- reveal the actual result;
- continue.

At the two intentionally ambiguous/conflicting points, stop and request human input.

At the end, report:

- bad outcomes caught;
- false alarms;
- progress / science retained;
- human interventions;
- historical verification score.

This is the model's retrospective test.

It is **not** the final competition.

---

# 16. Fresh 14-square sealed map

Generate a separate 14-observation Moon route.

It must use the same hidden relationships as the archive but must not reproduce its histories verbatim.

This is the actual prospective test.

The 14-square board should visually return to the familiar Rover composition:

- terrain/map on top;
- route;
- aligned card columns;
- four/five variable rows;
- hidden future information according to the chosen mode;
- same visual rhythm and restraint as Rover.

The representatives' models now operate on new data.

The audience can advise their representative, but the representative remains responsible for human-intervention decisions.

Keep team information budgets equal.

Record the complete replay for comparison.

The existing event design requires equal information, common timeout and replay comparison rather than rewarding quick clicking. Preserve that principle.

---

# 17. Sudden death finale

After prospective evaluation, optionally run a short sudden-death sequence.

This is explicitly a dramatic finale rather than the normal Rover scoring economy.

For each case:

1. Reveal the permitted observations.
2. Representative can consult their model and audience.
3. Representative chooses:
   - GO
   - NO GO
4. Reveal outcome.

For this finale only:

- GO on failure = eliminated.
- NO GO on safe = eliminated.

This forces precision in both directions.

Use carefully authored cases where competing plausible rules disagree.

Do not use arbitrary trick cases.

The point should still be interpretable from the learned relationships.

This final round also demonstrates an important point:

> The model that performed best historically is not guaranteed to make every future decision correctly.

---

# 18. Build order

Do not attempt the entire system in one pass.

## Phase 1 — Lunar visual prototype

Create `moon/`.

Start from the current Rover implementation rather than designing a fresh UI.

Prototype lunar maps using real or appropriate lunar topographic sources.

Experiment with:

- dot-matrix crater rendering;
- contours;
- restrained contour + crater combinations.

Take screenshots at the same viewport used for Rover.

Compare side-by-side.

The result should immediately look like **Rover Run on the Moon**.

---

## Phase 2 — Archive generator

Build the archive from explicit histories.

Provide a developer/debug view showing:

- all histories;
- all variables;
- outcome labels;
- hidden generating rules;
- class/failure balance;
- occurrences of each candidate relationship.

Make it easy to regenerate or hand-edit the archive.

Prefer deterministic generation with a fixed seed if any randomness is used.

The teaching relationships must remain authored and testable.

---

## Phase 3 — Participant cutouts

Generate printable / screen-readable fragments for individual participants.

Support both:

- different histories;
- different variables from the same history.

Build a debug layout where the designer can see:

> Participant 01 receives X  
> Participant 02 receives Y  
> …

Check that every representative's constituency collectively has sufficient evidence.

---

## Phase 4 — Rule builder and evaluator

Implement the tiny rule language:

- BEFORE
- PERSISTS
- WITH

Build the fill-in-the-blank interface.

Run rules across the full archive.

Return simple evaluation output:

> Did it catch bad outcomes?  
> How often did it cry wolf?  
> Was there enough warning to act?

Add the verification score and graduation threshold.

Build automated tests for known good rules, incomplete rules, overfit rules and lagging rules.

---

## Phase 5 — Representative model builder

Allow graduated rules to be selected into a small team model.

Show:

- rule;
- verification;
- support count;
- historical behaviour.

Allow a hard limit on active rules.

Detect contradictions explicitly.

---

## Phase 6 — Full historical run

Animate the selected model across the archive.

Automatically resolve clear cases.

Stop approximately twice on deliberately designed conflict/uncertainty cases.

Ask the representative to decide.

Record human interventions.

Produce an end summary.

---

## Phase 7 — Sealed 14-square route

Build the fresh prospective route using the same hidden laws.

Use the normal Rover-like board.

Run representative models.

Record replays.

---

## Phase 8 — Sudden death

Build a small curated sequence of unseen cases for GO / NO GO elimination.

Keep it visually consistent with the main game.

---

# 19. Simulation and balancing

Do not assume the authored rules create a good game.

Build simulation tools analogous to Rover's existing strategy simulator. Rover already uses simulations to compare intended and naïve strategies and protect the designed lesson.

For Moon, simulate at least:

- always GO;
- always NO GO;
- one-variable rules;
- BEFORE-only rules;
- PERSISTS-only rules;
- WITH-only rules;
- intended combined model;
- model containing every graduated rule;
- several plausible partial models;
- random decisions.

Check:

- failure counts are balanced;
- simple rules receive plausible but imperfect evaluator scores;
- intended rules genuinely improve performance;
- over-specific rules do not win merely by matching a tiny number of examples;
- lagging variables do not appear predictive simply because evaluation ignores lead time;
- conflicts occur at the desired frequency;
- the fresh 14-square route discriminates between models;
- sudden-death cases are not trivial;
- no accidental variable dominates the whole game.

---

# 20. Human-style playtesting

Do not stop at unit tests and simulation.

Use the existing Rover philosophy of blind playtesting. Rover's previous agent tests already exposed cases where agents memorised the deck or exploited visible hazards rather than learning indicators.

Have a blind agent play Moon through the real UI.

The agent should not have access to:

- source code;
- deck generator;
- hidden laws;
- answer keys.

Give it only what a participant would have.

Test whether it can:

1. identify an outcome from its fragment;
2. construct a rule using the provided grammar;
3. evaluate that rule;
4. revise a weak rule;
5. contribute a graduated rule;
6. assemble a representative model;
7. understand a conflict prompt;
8. make a human decision;
9. run the sealed route.

Ask it to state what it thinks it learned after each stage.

If it succeeds by exploiting UI leakage rather than interpreting indicators, fix the game.

---

# 21. Screenshot verification

Take screenshots throughout development.

At minimum:

- Moon full board;
- lunar contour/crater alternatives;
- participant archive fragment;
- BEFORE rule builder;
- PERSISTS rule builder;
- WITH rule builder;
- evaluator success;
- evaluator weak-rule response;
- lagging-rule response;
- representative model builder;
- conflict / MODEL NEEDS YOU screen;
- full archive run;
- sealed 14-square route;
- sudden death;
- final replay / result.

Use the same target viewport as Rover and inspect screenshots visually like a human.

Check:

- nothing overflows;
- cards remain readable;
- new Moon elements have not visually overwhelmed the interface;
- old Rover components still look like the same design system;
- projector-scale legibility remains good;
- map and card columns align;
- stage state is understandable at a glance.

Do not declare a phase complete merely because the DOM or tests pass.

---

# 22. Reuse existing Rover implementation aggressively

Start by reading:

- the current Rover rulebook;
- the indicator exercise;
- the reuse notes;
- the event document.

Rover already has:

- card components;
- icons;
- map alignment;
- lives;
- actions;
- replay logic;
- graph / history concepts;
- death displays;
- stage-friendly layout;
- simulator patterns;
- blind playtesting tooling.

The reuse guide explicitly recommends forking rather than altering the parent and warns that the semantic game logic should be deliberately rewritten rather than blindly renamed.

Follow that.

Create a separate Moon folder, port/storage namespace and documentation.

Do not break Rover while developing Moon.

---

# 23. Design constraints

Keep these constraints visible throughout implementation.

### Do not overcomplicate the game.

The room should not feel that it has moved from a simple Mars game into a statistics class.

### Scale through people and evidence.

The sophistication comes from 80–120 observations distributed across many people.

Not from twelve variables.

### Reuse the interface.

Participants should immediately understand how to read the Moon board because they just played Rover.

### Change the relationships.

They must not succeed by remembering:

> haze before storm.

Moon should require rediscovering what matters.

### Keep rules visual.

A participant looking at printed cards should be able to propose a rule without doing arithmetic.

### Verification is the new lesson.

A pattern seen in a participant's small sample is only a hypothesis.

The evaluator determines whether it survives more evidence.

### Preserve counterexamples.

The dataset must contain cases where attractive simple rules fail.

### Preserve humans.

The model should automate routine cases and deliberately escalate a small number of ambiguous ones.

### Moon teaches methodology, not Moon trivia.

Scientific authenticity in terrain and environmental context is valuable.

The educational outcome is not memorising lunar engineering facts.

---

# 24. Expected deliverables

Create within `moon/`:

- playable Moon game;
- lunar map preparation tools;
- archive/history definition;
- archive generator;
- participant-fragment generator;
- printable participant views if practical;
- rule builder;
- rule evaluator;
- representative model builder;
- conflict handling;
- historical model-run animation;
- sealed 14-square route;
- sudden-death mode;
- replay;
- simulator;
- automated checks;
- blind-agent play harness;
- screenshots;
- README explaining:
  - which data are real;
  - which relationships are authored;
  - hidden generating rules;
  - archive balance;
  - evaluator scoring;
  - model conflict behaviour;
  - event flow;
  - how to regenerate the game.

Also record design decisions that fail during implementation rather than silently deleting them.

The result should be something the facilitator can inspect and play end-to-end before deciding which pieces survive into the actual event.

---

# Success criterion

The final test is not:

> “Can someone solve the Moon puzzle?”

It is:

> **After learning on Mars, can a room with fragmented evidence propose indicators, verify them against more cases, combine the useful ones into a model, and use that model on unseen data—while knowing when it still needs a person?**

If Moon does that while remaining as visually and mechanically simple as Rover, it is doing its job.
