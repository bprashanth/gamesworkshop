# HH1 digital model

## What runs

`model.js` exports `createPack(seed=15, count=200)`, `poll(pack, round, revealed,
tokens)` and the four categories. The game uses 200 simulated voters, split equally
among four teams. Each team has six rows, three extra reveals and two interventions.

Live rows and archive rows call the same `drawRow` function with independent random
streams. Each team's archive contains 3,600 synthetic survey snapshots stratified
across six contexts. They are not empirical household data or a printed pack.

A current context is determined before drawing the row. After the first seeded
baseline context, it summarizes the previous row's harvest, cash and weather.
Context pressure uses a non-monotonic mapping over the six familiar color names.
It is not a social-group label and is never assigned from current dropout truth.
This compact history summary is intentionally lossy; it is not a general attention model.

Harvest and cash share an unobserved pressure variable. Weather is sampled, with
rain less risky than storm in this synthetic scenario. Dropout is sampled from
these predictors plus context. A loan or failed harvest can occur without dropout,
and dropout can occur without any extreme predictor. Attendance has three states:
Regular, Irregular, Dropout. Only Dropout is fatal when the player skips.

Intervention protects this turn but does not rewrite later generated needs. This
keeps repeat runs comparable. HH1 is not a causal model of long-term policy effects.

## Audience

Polling matches context and all revealed values against the archive. It does not
read `round.fatal` or hidden values. For a rare unmatched combination, deterministic
conditional simulation supplies matching samples from the same sampler instead
of silently using a different color or ignoring evidence.

The matched dropout frequency, with light smoothing, supplies decision weights.
Expected information gain supplies inspection weights for every unrevealed category,
including Attendance. The action/inspection balance varies with uncertainty.
Largest-remainder rounding maps the weights to the team's audience size.

Those counts are authored action recommendations estimated from the archive,
not literally one fixed printed row per voter. Counts sum to the team size;
percentages are rounded independently. The 15-person API option splits 4/4/4/3
and uses the same live boards, but is not exposed as a validated print pack.

After Attendance is revealed, the outcome is directly known. With no checks left,
all votes become Skip/Intervene recommendations. If intervention is exhausted,
Intervene is disabled; audience risk advice is still shown rather than rewritten
as an apparently safe Skip recommendation.

## Limits found in play

Attendance reveals the single outcome, so it dominates inspection. Scarcity across
six turns makes timing relevant, but HH1 has less category-choice variety than Rover.
Do not claim that multiple household variables create several independent ways to
lose, or hide Attendance from inspection advice to manufacture variety.

A paper implementation still needs a bounded cumulative lookup encoding and
per-sheet historical assignments. `paper.html` is only the visual reference.

## Validation

`node households/test-model.mjs` covers 120 seeds / 480 teams, deterministic
replay, hidden-clue invariance, vote totals, 15/200 board parity, exhausted checks,
direct observation, counterexamples and several policies. These are authored
policies, not human engagement measurements. Full browser sessions and the
comparison with Medium are recorded in `narrative/household_hard_playtest.md`.
