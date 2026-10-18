# Households Hard - HH1 playtest archive

Superseded by [HH2 one-shot outcomes and branching routes](household_one_shot_routes.md).
The Calendar skin and direct Attendance outcome reveal described below are retired.

19 October 2026

## Try it

[Hard with Rover map](http://100.82.28.38:8684/households/game.html?seed=18)

[Hard with Calendar skin](http://100.82.28.38:8684/households/game.html?seed=18&skin=calendar)

[Original competitive Medium](http://100.82.28.38:8684/paperweights/web/?mode=medium)

Hard is available in the competitive difficulty selector. The underlying Rover
map, renderer, movement timing and existing effects are reused. Calendar is an
optional six-fortnight grid with independent team positions; changing the skin
does not change the game or reset progress. Collaborative and competitive
Easy/Medium rules and packs remain unchanged.

## Implemented rules

Four teams, six turns, three extra card checks and two interventions per team.
One Harvest, Cash or Weather card starts face up. Audience uses the current context
and all revealed observations. Votes recommend Skip, Intervene or a category to
inspect. A hidden card costs a check; polling is free.

Skip on Dropout eliminates the team. Intervene spends support and protects this
turn. A mistaken intervention spends support but does not eliminate the team.
A loss reveals the cards, including the inverted Dropout card, so the audience can
see what happened. There is no consecutive-absence rule. Team and global Reset
replay the seed; New run changes it. No PDFs were regenerated.

## What was actually played

Playwright controlled the buttons through four complete four-team Household
sessions. The policy followed the most popular option for at most one extra reveal
per turn, then intervened if the decision-vote share for intervention reached 40%
and support remained. It never inspected hidden truth to choose an action.

| Seed | Finished | Eliminated |
| --- | --- | --- |
| 15 | A, B, C, D | None |
| 16 | None | A on turn 2; C on turn 3; B/D on turn 6 |
| 17 | B, C, D | A on turn 2 |
| 18, selected demo | B, D | A on turn 5; C on turn 2 |

Seed 18 is the default demo because it produced a mix of endings in the four
reviewed runs. This is a disclosed demo selection, not an algorithm that forces
particular teams to lose. Different decisions can change these results.

In seed 18, Team A uses a check and intervention successfully on turn 4, then skips
on turn 5 and drops out with a check and intervention still available. Having
resources does not guarantee choosing to use them. In seed 15, Team B saves its
checks on the first two turns, checks on turns 3-5, spots Dropout on turn 5 and
finishes. These are useful contrasting conversations about timing and residual risk.

A separate browser session played current Medium with the largest-vote policy,
continuing to inspect while inspection remained the most popular action. B and C
finished; A went out on turn 4 and D on turn 5. For example, B checked Dust and
Ground after its opening Battery on turn 1. Later turns used other opening
categories. That variety is stronger than the Household inspection loop.

These are authored browser playthroughs and my design assessment, not observations
of a real audience's engagement. We should still rehearse with people.

## Broader model checks

120 seeds, 480 teams, 2,880 possible turns. All rates below are synthetic and
policy-dependent, not estimated real-world dropout rates. The simulation includes all 120 seeds regardless of outcome; the demo selection
is described above.

| Policy | Teams finishing |
| --- | --- |
| Always skip | 20.6% |
| Intervene on the first two turns, then skip | 33.1% |
| Audience decision votes, no extra reveals | 34.2% |
| Audience advice with up to three checks | 52.3% |
| Check Attendance on the first three turns | 50.2% |

The decision policies intervene at a 40% conditional share among decision votes,
subject to the two-intervention limit. The initial observation is free. The audience
policy takes at most one recommended inspection per turn. These are baselines,
not optimized play.

The tests verify deterministic replay, matching boards at 15/200 simulated voters,
correct vote totals, no hidden-outcome leakage in polls, exhausted-check behavior
and definitive advice after observing Attendance. Live rows and archives use the
same sampler with independent random streams. Loan occurs both with and without
dropout: 300 and 283 examples respectively in these live test rows.

Browser checks cover independent teams, resource budgets, resets, difficulty
navigation, skin changes, dark/light and fitting 1024 x 768, 1280 x 720,
1366 x 768 and 1920 x 1080. The existing PW6 browser regression suite also passed.
Screenshots were captured and visually inspected. Detailed logs and screenshots
remain local under `households/out/`.

## Dropout versus household peril

Keep Dropout for the stated teaching goal. Loan, failed harvest and storm are
predictors, not the outcome. In a counterfactual rule that labels any of these
three states fatal, 734 of 1,210 flagged test rows would be declared losses even
though the sampled attendance outcome is not Dropout. Conversely, 223 Dropout rows
have none of those extreme flags. This is a comparison of labels on the same
synthetic rows, not a separately playtested peril game.

Several independent peril cards would make the card hunt more varied, like Rover.
But calling a loan itself a death card changes the lesson to deterministic hazard
recognition. It no longer demonstrates that historical patterns can help distinguish
which households need support despite similar warning signs.

The current single-outcome design has a real weakness: Attendance is the best
inspection, because it directly reveals the outcome. The close finish rates of the
last two policies support that concern. Following audience advice uses about
1.94 checks per team, versus three for the fixed Attendance policy, so timing
still matters. Do not pretend a more elaborate recommendation
algorithm eliminates this structural shortcut. The tension is when to spend checks
and support, not which of four equally useful categories to inspect.

For a later experiment, the cleanest way to restore category choice is to make
Attendance an observed predictor of a later outcome, with Dropout shown only at
resolution. That would be a substantive rule change, and risks reintroducing the
complexity the user just removed. It is not implemented here.

## Household Easy/Medium too?

For the current sequence, keep Rover Easy/Medium and Household Hard. Rover is a
clearer tutorial for identifying several consequential outcomes and choosing data.
Household Hard then changes the stakes: costly support, uncertain indicators and
an outcome affecting a child. Explain the two changed action labels and the two
interventions on stage, without adding an instruction panel.

An all-Household series would reduce the icon/domain switch, but it does not solve
the Attendance shortcut. Household Easy with every card visible would amount to
reading Attendance and ignoring the other three cards. If the entire workshop
becomes primarily about household decisions, a consistent Household series is
worth a separate design pass. Do not replace the working Rover modes yet.

## Remaining limitations

HH1 is a digital proxy, not a generated paper pack. Counts are rounded action
weights from matching synthetic records, not counts of fixed physical sheet rows.
The current illustrative paper page and all existing Rover PDFs are incompatible
with HH1 cumulative evidence. Exact printable lookup design is still required.

The context summary is deliberately small and lossy. Interventions protect one
turn but do not causally change later generated household needs. This is a teaching
simulation, not a policy evaluation model. Six turns and four teams can fit roughly
eight minutes at 20 seconds per decision, but a live rehearsal must confirm pacing.
