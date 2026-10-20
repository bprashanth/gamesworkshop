# Shared Rover and Household stages

Rollback baseline: `trial-before-shared-stages-2026-10-19` at `aad8fcf`.

Returned all competitive modes to the original Mars contours. Rover and
Households now run through one competitive engine, shared card markup, styles,
map renderer and decision-dependent route projection. Scenario and learning
stage are independent switches. Stage labels: Risks, Indicators, Judgement.
Legacy easy/medium/hard query values remain supported; Household's old entry
redirects to the shared UI with scenario/stage/seed preserved.

Risks shows all cards with only action buttons. Indicators gives AI decision
estimates and Audience card-only suggestions. Judgement puts mixed suggestions
under AI and reserves Audience for a real conversation, consuming consultations.
Quota glyphs remain lightning bolts. Risks hides them entirely. Three extra
reveals span the run; Judgement has three separate audience consultations.

Household teaching rule: storm is a filled hazard; failed harvest and loan are
dotted indicators, fatal as a pair but not individually without storm. Both
archive and live rounds use this rule. Teaching weather frequency is tuned for
practice. In 120 seeds / 2880 reference turns, 48.0% require intervention, with
390 safe single-indicator cases and 381 paired hazards without storm. These are
invented teaching mechanics, not empirical claims. Teaching unnecessary Avoid
loses like Rover. Household Judgement preserves the uncertain HH2 model and two
protective interventions; its visual hazard hints are removed. Revealed cards
and Dropout are shown after an actual Household Judgement loss.

At half-screen width both scenarios use two rows of team panels, each with a
single row of four equal-size cards. Fixed card header heights prevent long
Household labels from changing card geometry. Wider screens use four panels
across. No new printouts produced.

Validation:
- households/test-stages.mjs: stage truth, hazard rates, full evidence 0/100,
  hidden-state invariance, backfill and 15/200 board parity.
- households/test-model.mjs: preserved Hard distribution and model invariants.
- households/playtest.mjs: four full Judgement runs still finish 2/3/1/0,
  resources, independent teams, stage navigation, projector fit, no errors.
- households/test-handoff.mjs and test-routes.mjs passed.
- paperweights/tools/play-scenarios.mjs: all six scenario/stage combinations at
  680x900, 1024x768 and 1366x768, populated polls, no document/internal overflow,
  hidden Risks quota and scenario/stage persistence through reload.
- paperweights/tools/play-ai-handoff.mjs and play-evidence.mjs passed.
- Played six complete Risks turns for all four teams in both scenarios using
  the visible rule: all teams finish, no browser errors.
- Inspected half-screen Risks/Indicators and full-screen Judgement screenshots.

Current rules: narrative/shared_scenarios_stages.md. README, Household model
notes and Paper Weights summary updated. Archived social contour previews stay
available but are not used by the game. Collaborative files were not changed.
