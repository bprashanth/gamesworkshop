# Rover mode transitions

18 October 2026. Teaching narrative for the current PW6 competitive prototype.

The sequence moves from **understanding which outcomes matter** to **deciding how
much evidence is enough before acting**. The representative remains responsible
for Go/Avoid in both modes. Medium changes what they know, not the question they
must answer.

## Easy - understand outcomes of significance

Easy makes the consequences legible before introducing uncertainty. All four
cards are face up. Participants learn to recognize the conditions that determine
whether the rover can safely cross: storm, dead battery and sand pit. Any one of
these makes the decision square dangerous. Slope and other readings can provide
context, but are not all equally consequential.

The audience's task is straightforward: look at the whole set of readings and
help the representative choose Go or Avoid. A full battery does not cancel a
storm. A reassuring observation in one category does not outweigh a kill condition
in another. The outcome concerns the whole square, not whichever icon caught our
eye first.

The teaching goal is to establish what success and harm mean before asking the
room to interpret model advice. In the later discussion, the rover stands for
people affected by a decision. A successful prediction is valuable because of its
consequences for those people, not simply because a model produced an answer.

Suggested stage language:

> First, learn what matters. These conditions determine whether our rover gets
> through. Look at all the evidence and decide: Go or Avoid.

## The transition - keep the decision, reduce the evidence

Move to Medium after the room can recognize the important outcomes. Keep the same
icons, teams and Go/Avoid controls. Explain that the dangerous conditions still
exist, but most readings are now hidden.

> The job has not changed. You still have to get the rover through. This time you
> cannot see everything. The audience represents past examples that can help you
> decide - or tell you what to check next.

The distinction to establish is **“I have not seen a hazard” versus “I have enough
evidence that this square is safe.”** One safe card is not proof that the unseen
cards are safe.

## Medium - relevant data makes decisions better informed

Medium begins each turn with one revealed card. Audience advice is drawn from
historical cases matching the revealed symbols and their context colors. The
Audience button presents votes for Go, Avoid or inspecting a particular category.
An inspection suggestion is a request for information that could change the
decision, not another way of saying Go.

Each team has three extra checks across six turns. Spending a check reveals a
card. Subsequent polls use **all the evidence revealed in that turn**, rather than
forgetting earlier cards. The representative trades off acting now against
spending a limited opportunity to learn more.

The desired experience is:

1. With limited evidence, the room often wants another measurement.
2. The representative chooses whether to spend a check and which card to inspect.
3. That evidence changes the advice. It may strengthen Go, reveal a reason to
   Avoid, or overturn the earlier impression.
4. The representative acts and sees the consequence.

More **relevant, informative** data should make decisions surer on average. It
need not increase confidence in the original answer: learning that the initial
answer was wrong is a valuable result. Some reveals add little, and an unresolved
risk can remain after a safe card is shown. The game should reward asking for
useful information, not merely clicking more cards.

Once checks run out, the audience must choose Go/Avoid from its matching historical
examples. A forced answer does not mean the missing evidence has ceased to matter.
The two percentages summing to 100% is not a guarantee of safety.

Suggested stage language:

> You can act on the model's advice now, or ask for the data it needs to make a
> better-informed decision. If you ask it to decide with less evidence, the risk
> does not disappear. Someone bears that risk.

## Debrief - who bears the uncertainty?

The central message is: **when we ask a model to guide decisions with insufficient
data, we may be taking a risk with our beneficiaries.** The person accepting the
recommendation is not necessarily the person who suffers if it is wrong.

Ask the room:

- Which additional observation changed your decision?
- Did you treat a safe-looking card as evidence that everything was safe?
- When you acted without checking, who would have borne that uncertainty outside
  the game?

Connect the discussion to field observations and community evidence. If the
experiences of affected people are missing from the available data, a model has
less basis for advising on their situations. Collecting and contributing relevant
data is part of making those decisions accountable. More data is not automatically
better: relevance, quality and whose experience is represented matter.

The claim is not that this simulation proves how a particular LLM behaves. It
makes a decision-making problem tangible: advice depends on available evidence,
asking a useful question can improve it, and uncertainty has consequences for
people beyond the operator.

## Facilitation and implementation boundaries

- Keep teaching explanations on stage; keep the game interface minimal.
- Easy's highlighted column is ahead of the rover; Medium highlights the rover's
  current column. In both modes, Go/Avoid resolves the square represented by that
  team's cards. Do not frame Medium as forecasting a different unseen row.
- The poll displays authored action-vote shares, not a literal probability of
  death. A large FLIP share means the policy recommends getting more information.
- False Avoid also eliminates a team in this sudden-death game. That is a game
  constraint, not a recommendation that real-world caution or deferral is wrong.
- FINISHED uses the normal text color; only OUT and eliminated map markers are
  red. Three stick figures show remaining checks.
- The current cumulative-evidence audience is digital. Existing PW5 paper sheets
  use single-icon lookups and do not reproduce PW6. Agree on the paper encoding
  before teaching this as an activity participants can perform with those sheets.

See [the current summary](../paperweights/SUMMARY.md) and
[the PW6 model](../paperweights/competition/EVIDENCE.md) for implementation and
validation details. This document records the intended learning progression,
not a claim that workshop learning outcomes have already been measured.
