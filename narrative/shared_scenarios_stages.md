# Shared scenarios and learning stages

This trial makes scenario and stage independent. Rover and Households use one
competitive shell: the original Mars contour background, four team panels,
identical card dimensions, buttons, quotas, polls and decision-dependent routes.
The social contour study remains available separately, but is not in the game.

## Progression

Risks (formerly Easy) shows every card and asks the room for Go/Avoid advice.
The next column is highlighted ahead of the marker. No AI control is required.

Indicators (formerly Medium) starts with one revealed card. AI estimates whether
to proceed or avoid. Audience suggests only which hidden category to inspect.
Three extra reveals per team last for the full run. After a reveal the old result
is cleared, and another AI request uses all revealed evidence. The current
column is highlighted. This is still a synthetic historical audience, not an
external language model or a printed event pack.

Judgement (formerly Hard) lets AI recommend both decisions and further reveals.
Audience is an actual discussion; its button spends one of three consultations
and does not generate a poll. The extra-reveal budget remains separate. Cards
omit hazard fill and indicator borders. This makes interpretation depend on
context and advice rather than a visible answer label.

## Household teaching rules

For Risks and Indicators, the rule must be reliably legible when the relevant
cards are revealed: a filled danger card is sufficient to require intervention;
the two dotted indicator conditions together also require intervention. A single
dotted indicator without a filled hazard is insufficient. Both archive examples
and live rounds use the same rule. This deliberately simplified rule is not a
claim that real household outcomes are deterministic.

The filled hazard is Weather/Storm. The dotted pair is Harvest/Failed plus
Cash/Loan. Across 120 seeds and 2,880 reference turns, 48.0% need intervention;
390 turns have a safe single indicator and 381 have paired indicators without
a storm. These frequencies describe our simulation, not real households. Household Judgement retains the existing
probabilistic dropout model: bad harvest and loan can coincide without dropout,
and an apparently reassuring observation is not a guarantee. Showing every
survey card need not resolve a future outcome with certainty.

Rover retains its existing hazard logic and historical pack. Household teaching
stages use exact Go/Avoid correctness like Rover; unnecessary avoidance loses.
Household Judgement keeps two protective interventions; wasting one reduces
later options rather than immediately killing a team. Cards and controls share
the same layout even where consequences differ.

## Scope and rollback

No new sheets are generated. Existing PW5 PDFs do not reproduce these stage-aware
polls. This trial is for comparing both settings with simulated audience votes.

Pre-change checkpoint: `trial-before-shared-stages-2026-10-19`, commit `aad8fcf`.
Use a separate worktree at that tag for comparison without discarding later work.
