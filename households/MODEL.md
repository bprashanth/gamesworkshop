# HH2 digital model

## Outcomes and evidence

The observable categories are Harvest, Cash, Attendance and Weather. Dropout is a
separate one-shot event resolved when the team acts. Attendance is Regular or
Irregular and does not reveal whether that event will occur. The empty doorway
Dropout symbol appears after a loss. No sustained-absence rule exists.

The synthetic risk function has a substantial interaction between loan and failed
harvest, plus smaller contributions from other conditions and context. Neither
loan nor failed harvest guarantees dropout. Regular attendance can coexist with
sudden dropout. Attendance is currently an intentionally weak observation rather
than a necessary precursor. These are teaching parameters, not empirical rates.

## Actions and context

`currentRound(pack, teamIndex, actions)` generates the active row from the actual
action history. `teams[].rounds` is an all-Skip reference trajectory used for model
checks; it is not the active board after intervention.

Context encodes one of three previous-survey patterns, with or without recent
support. Each pair has a lower-pressure supported variant. Intervention protects
the current turn and selects that supported context for the next turn. It does
not buy permanent immunity. Current dropout truth never determines the color.
The first context is a seeded baseline before the displayed six months.

Each team/month uses the same random draws across counterfactual action histories.
Actions change context, not the random seed to hunt for an advantageous roll.
A replay of identical actions produces identical cards and outcomes.

## Historical audience

Live rows and the 3,600 archive samples per team use the same `drawRow` sampler.
Independent random streams keep archive examples separate from live outcomes.
The archive is stratified over the six contexts, including supported variants.

Polling conditions on context and all revealed values. It never reads hidden
current cards or the current fatal flag. Rare archive gaps use deterministic
conditional simulation, not mismatched-context fallback.

Decision weights follow the matching historical dropout frequency. Inspection
weights use expected information gain, with a small gain floor to avoid promoting
sampling noise. There is no special ban on Attendance, nor a hard-coded Harvest
or Cash recommendation. More of the vote goes to checking in uncertain situations.
Largest-remainder rounding produces the team's vote count; the screen shows only
percentages. Unrevealed outcomes remain uncertain even after all four clues.

These are digital action weights, not counts from fixed printed rows. Existing
PDFs and the illustrative paper study are not an HH2 print pack.

## Routes

The familiar contour map remains. `routes.js` bends completed route segments
according to Skip/Intervene, and the marker animates along the chosen branch.
The map keeps six shared month bands. A decision changes the vertical trail, not
the number of months needed to finish. Teams can converge again and all use the
same deadline.

The contour geometry is the original Rover terrain used as a visual metaphor.
Its elevations are not a numeric risk surface or a forecast of hidden events.
The model context changes with actions independently of this drawing geometry.
Calendar mode is removed. Rover Easy/Medium rendering and logic are unchanged.

## Tests

`node households/test-model.mjs` covers 120 seeds / 480 teams, hidden-outcome
invariance, deterministic branches, exact vote totals, 15/200 board parity,
regular-attendance dropout counterexamples and inspection categories.
`node households/test-routes.mjs` checks geometry, equal month progress, action
separation, independent resets and reproducible route branches in the browser.
`node households/playtest.mjs` plays four complete four-team runs and checks
projector sizes, resources and difficulty navigation.
