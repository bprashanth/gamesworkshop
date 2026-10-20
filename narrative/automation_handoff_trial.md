# Automation handoff trial

## Stage progression

Easy: the room sees all cards and advises Go/Avoid. No AI estimate is needed.

Medium: AI estimates Go/Avoid from revealed evidence. Audience recommends
which hidden card to inspect. The representative chooses a card, spending one
of three extra reveals across the run, then asks AI again. Reveals invalidate
old estimates. More data can change the answer in either direction; a more
confident answer is not guaranteed on every reveal.

Hard: AI supplies both action and information requests, as the mixed audience
poll did previously. Audience is now an actual conversation, not a simulated
histogram. Its button consumes one of three consultations and changes no model
probabilities. The representative still chooses the action. Hard retains the
existing three extra reveals and two interventions as separate resources.

Rover Easy/Medium and Household Hard remain different settings, as before.
Hard uses Skip/Intervene rather than Go/Avoid. We have not quietly redefined
its intervention mechanics to make it match Rover's safe/unsafe rule.

## What this demonstrates

Tasks move from people to a model: outcome classification, then choosing what
information to request. Human judgement remains available when the model is
uncertain or the costs of a decision need discussion. The AI button is the
existing historical simulation, not a newly connected language model.

This is an interaction trial, not a new calibrated model or compatible event
print pack. Medium's separately normalized decision and inspection displays
must not be mistaken for percentages from one combined ballot.

## Revert

The pre-trial baseline is `trial-before-ai-handoff-2026-10-19`, commit
`3f7c3b4`. Use a separate worktree for comparison rather than discarding other
workspace changes. Collaborative gameplay is untouched.
