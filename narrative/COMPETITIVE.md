# Rover: competes

Living brainstorm, 6 October 2026. These are proposals, not implemented or playtested competition rules. Companion: [EVENT.md](EVENT.md). Foundations: [INDICATORS.md](INDICATORS.md) and [REUSE.md](REUSE.md).

## What should competition reward?

Building an indicator model that works on observations the team has not already seen. Keep the familiar map, four card rows, limited attention and short decision loop. Competition should add a reason to investigate, not another layer of controls.

There are two different tests:

| Test | What changes? | What it demonstrates |
| --- | --- | --- |
| Generalisation | New route, same variables and laws | Does the rule work beyond the examples used to discover it? |
| Transfer | New setting, variables and relationships | Can the team repeat the investigation and build another model? |

The current event direction prioritises **transfer**, followed by a generalisation test within the new setting. Teaching haze → storm and then racing on another Mars route primarily tests the first row. That remains useful, but is not the whole workshop objective.

## Current direction: environmental evidence, a large study board, a short sealed test

**Evaluation checkpoint:** [real Mars feasibility](../space/rover-run/benchmarks/mars-real/README.md) now includes executed terrain, weather and public mobility-data audits. Simple preferences can steer a planner on real terrain, but empirical failure prediction from the current cards is not established. Prefer more study cases with four rows; the verified outcome sample covers only nine driving sols. See [audience rule proposals](../space/rover-run/benchmarks/mars-real/AUDIENCE-MODEL.md) for map-linked claims, counterexamples and redundant-variable checks.

Updated after discussion on 6 October: the earlier battery/temperature/demand lunar proposal below is **parked**. Sensor or equipment-focused cards are not the desired direction. Trend and accumulation are not requirements. Prefer environmental variables, visually discoverable combinations and probabilities expressed as counts.

The leading proposal is now: **Mars Hard demonstration → Easy debrief → study roughly 100 environmental cases → submit a rule → test it on a sealed 14-square board → compare replays.** Mars versus Moon remains open, conditional on the evidence available.

- Try real Mars first if environmental measurements can be paired with observed traversal difficulty. The first honest outcome may be high slip or a terrain-related interrupted drive, not literal rover death.
- Derive the simplified cards from relationships found in the study data. Do not apply the existing authored haze/storm laws to real Mars and present the result as validation.
- Four candidate Mars cards are slope, surface material, rock obstruction and ripple/dune form. These require usable, aligned observations; they are not yet a verified four-column dataset.
- Keep outcome squares separate from the four predictor rows. A measured slip value used to mark the outcome must not also be revealed as the clue for that same outcome.
- More specific rules are not automatically better. “Sand AND slope” should beat “sand” only if it avoids false alarms without missing too many difficult cases on fresh data. A third condition can improve this or merely fit a handful of examples.
- All teams get the same revealed archive. Audience groups can inspect different subsets and exchange findings. A selected value or pair can highlight matching cases and show a simple count: “difficulty in x of n matching cases.” This supports visual discovery without proposing the rule for them.
- Keep cases in short, readable strips rather than shrinking 100 columns onto one screen. If there are separate trips, mark boundaries and never infer a sequence across them.
- Hold out whole drives or route sections for evaluation. Nearby images of the same patch must not appear on both study and test boards.
- Use 14 squares for the theatrical final replay, but run each locked rule on a larger hidden set as well if probabilities are central. One short round is a noisy way to rank models. Show the broader result in the debrief rather than adding controls during play.
- Historical observations support replay of known cases. They do not establish what would have happened on an untravelled alternative route; any such consequence is a simulation and must be labelled.

The Moon remains an environmental alternative: slope, rocks, landform and illumination are plausible card candidates. Real map layers do not by themselves establish empirical probabilities of rover failure. A rule-authored lunar board and an observed-outcome Mars benchmark are different evidence products.

## Earlier proposal: learn on Mars, investigate the Moon, compete

Retained for reference. The current direction above supersedes the assumption that the transfer round must use a lunar resource simulation.

1. Four or five representatives attempt Mars Hard mode on stage.
2. Reveal Mars Easy mode. Together identify outcomes, earlier warnings, contextual variables, counterexamples and lagging measurements.
3. Introduce a visually familiar lunar board with four new card rows. Explain actions and failure definitions, but not the relationships that predict failure.
4. Give every team the same short, fully revealed lunar archive. Include several failures and contrasting safe cases, with enough preceding observations to investigate longer patterns.
5. Teams choose a provisional strategy. A short practice continuation can provide feedback before they lock their initial competition strategy.
6. Play a fresh, sealed lunar route. Representatives consult their audience teams; all teams have the same evidence budget, lives and turn limit.
7. Compare replays and the predictions behind decisive moves.

The archive is essential. A sealed world with unknown laws and no relevant evidence tests guessing. The lunar relationships must stay consistent between archive and competition; changing them secretly invalidates the test.

Keep the established visual language: contour map, route strips, four aligned card rows, white outcome squares in the revealed/replay view, existing typography and restrained colours. A different world does not require a different interface.

## Minimal competition rules to prototype

- Use the existing 3 lives, 22-turn budget and safe-drive scoring as a starting point. Retune only after testing the new deck.
- Rank by safe science collected: +1 for a successful driven square and +3 for finishing, as in Rover. Avoiding a square earns no science. Display distance too; distance alone can reward avoiding everything.
- Keep teams tied if scores tie in the first pilot. Do not add speed bonuses or a complex tie-break system.
- Limit reveals to two eligible observations per decision. Eligible cards must be measurements available **before** the predicted outcome, not cards that simply disclose whether the next square kills the rover.
- Preserve revealed history so players can compare earlier observations without a memory test.
- Keep team reveals private until the replay. On a common route, publicly showing a leader's future squares gives following teams free scouting. If private boards are impractical, use synchronised decisions on common cases instead of an asynchronous race.
- Start with one locked strategy per scored run. If adaptation is desirable later, give everyone the same revision checkpoint and record when the rule changed. Evaluate revisions only on subsequent observations.
- Audience consultation should fit inside the existing decision pause. Avoid adding another vote or form to every move.

The two-card budget is meaningful only if useful observations compete for attention. Playtest whether the same obvious pair always dominates. Also check whether the upcoming outcome can be read directly from a selected card: the current Hard-mode design permits this shortcut in some cases.

## Four competitive formats worth retaining

### 1. Two rovers, one unknown world

Teams learn from one map, then race on a second map governed by the same laws. Same start, deck and resources; private reveals. Compare routes afterwards.

This is the simplest addition to the existing game. It tests applying a model beyond a memorised map, but does not by itself test discovering a different kind of relationship.

### 2. Model versus model

Teams write two or three precise instructions. Another team or the computer executes them on an unseen route without asking the authors what they meant. For example: “If the last two readings both fell, and the current reading is low, recover; otherwise continue.”

Score the resulting mission using ordinary game scoring. Let teams repair their instructions once, then test on another fresh route. This exposes ambiguity and makes the move from verbal insight to executable model tangible. It is especially suitable for the workshop's final modelling discussion.

### 3. Break my model

Teams propose a rule; opponents locate a counterexample in the revealed archive. Later, a facilitator can allow constructed sequences that obey the world's published simulation rules.

Use this as a brief debrief exercise initially. An arbitrary disaster is not a counterexample, and an unobserved outcome is not evidence. This format teaches that one successful example does not establish an indicator.

### 4. Rival observatories

Teams forecast the same next outcome, each choosing two eligible measurements before committing. Then reveal what happened. Compare which observations helped and which added little.

This makes attention allocation central and removes route-speed advantages. It is a useful fallback if the lunar action model becomes too complicated, but changes the existing Rover loop more than the race does.

## Earlier pattern proposal — parked

The current reuse template intentionally preserves a one-step warning and a contextual interaction. The earlier proposal below sought different relationship types; these are now optional future ideas, not the selected direction:

- **Persistence or accumulation:** one interval of exposure is manageable; repeated exposure changes the risk.
- **Trend:** the direction of several readings matters, not just whether the latest reading is high or low.

Retain simpler contextual relationships so participants have somewhere to start. Keep exact thresholds discoverable from sufficient examples. Do not include every statistical pattern in one short deck.

Candidate world and four-card proposal are in [EVENT.md](EVENT.md). Real terrain and authored teaching relationships must be labelled separately. These relationships are not an empirically validated model of lunar operations.

## Questions to settle through playtesting

1. Can a team infer a useful rule from the archive without facilitator hints? Are safe counterexamples present?
2. Does it outperform always-go, always-avoid and a simple current-value threshold on fresh routes?
3. Does limited attention produce a real trade-off, or does one pair reveal everything?
4. Can a team explain a failure using information available before that failure?
5. Can the strategy be executed by someone who did not help invent it?
6. Can spectators understand the decisive difference between two replays?

Do not finalise scores, thresholds or archive length before these tests. Preserve Mars as the working reference; build any lunar prototype separately.
