# From word chains to decisions

A spoken route through the current running order. About five minutes of
explanation, spread between activities. The bracketed directions are for the
facilitator, not screen copy.

## 1. Swift-style word chain - everyone holds a little data

[Open Sentences. Show one word and its color.]

“Your sheet holds examples of one word following another. Nobody has the whole
collection. Find the word and color on the left. If you have a match, your answer
is the word and color on its right. If you have several matches, choose one at
random. Each person gets one vote.

“We'll first take a random answer and let that answer become the next question.
Then we'll ask everyone who has a match and choose the most popular answer.”

[Run a short random chain, then reset to the same cue and try majority voting.]

“Same data, different way of choosing. One gives us more surprises; the other
favors the room's most common continuation. Neither rule checks whether the
sentence is true.”

## 2. What makes the room a model?

“You individually hold examples. The lookup rule and our combined votes turn
those examples into a prediction. In this demonstration, that whole process is
our model.

“No single person needs to know the complete story. A pattern can emerge when
we bring the pieces together.

“A language model does something much more complicated: training changes its
internal weights so it can predict continuations using context. It doesn't
literally keep a room of people or take a show of hands. But our room makes one
part visible: the data available, and how strongly it is represented, influence
what comes out.”

[For the robot deck, pause at its action word. For the prior duplex, use whatever
story emerged. Do not promise a tidy majority sentence from the prior deck.]

“Whose examples did we hear? Whose were missing? A popular continuation tells us
what this collection supports. It doesn't tell us that everyone agrees, or that
it is the right account of the world.”

## 3. From sentences to situations - Rover Risks

[Open competitive Rover, Risks. All four cards are visible.]

“Now our data isn't about the next word. It's about a situation and a decision.

“On your Data side, look at the Rover squares to avoid. Compare them with your
team's screen and vote Go or Avoid. The rep will decide.

“A strange sentence can be funny. A mistaken decision can have a consequence.
That's the shift we're making: from generating an answer to supporting an
action.”

[Play a round. Wait for the room rather than acting on the first vote.]

“The room can disagree because its sheets differ. The rep still has to decide
whether the evidence is enough.”

## 4. Direct hazards versus indicators - collaborative Rover Easy

[Open collaborative Rover on Easy and press Play. Point to the visible map.]

“Here we can look across the route together. A storm, dead battery or sand pit
is a direct hazard under this game's rules. A warning is different: it can tell
us to look more closely without proving that disaster will happen.

“Compare what appears around a hazard with what appears around a safe square.
An indicator matters because of what it is associated with, and the conditions
around it. Seeing one warning is not the same as seeing the outcome itself.”

[Ask the room to compare two visible situations. Use the actual generated map;
do not announce a universal rule such as ‘haze always means storm’.]

## 5. Translate the icons into household observations

[Open Icons. Point to each family once.]

“These are the four things we'll observe now:

“Harvest: good, weak or failed. Cash: enough, low or a loan. Attendance: regular,
irregular or dropout. Weather: sun, rain or storm.

“A loan is not a dropout. A poor harvest is not a dropout. They can be reasons
to investigate, especially together and in context. Weather is not automatically
a death card in the household game.

“Color now stands in for context around an observation. Match both the color and
the symbol. Two similar-looking observations can belong to different situations.
In the word game, color helped identify a token; here it helps identify which
situation we are asking about.”

## 6. Households Indicators - ask for the missing evidence

[Open Households, Indicators. Press AI on a team with an uncertain initial card.]

“We can see only part of this household's situation. The AI gives a Skip or
Intervene estimate from what we have revealed so far.

“Now look up the shown color and symbol on your sheet. Your answer names the
next card worth checking. It isn't telling us what will happen next month.
It's telling us what information to ask for before deciding now.”

[Press Audience. Let votes arrive. Reveal the suggested card and press AI again.]

“Notice what changed. We didn't make the model more intelligent by pressing a
button, and we didn't retrain it. We gave the same model more evidence about
this case. Its estimate can become clearer, or it can change direction.

“We have only three extra flips for the run. Sometimes we know enough to act.
Sometimes it is worth spending a check. The room helps choose the question;
the rep remains responsible for the decision.”

[If the screen says No matching data:]

“That means our sheets have no usable answer to this lookup. It is not a vote
for Skip, and it is not evidence that the household is safe.”

## 7. The message to take into real work

“Real records are messier than these cards. An observation may be missing, late
or wrong. The same indicator can mean different things in different settings.
And an association doesn't, by itself, prove what caused an outcome or which
intervention will help.

“Better evidence can improve a decision. More data isn't automatically better:
it needs to be relevant, reliable and representative. A confident model can
still be wrong.

“If community groups and NGOs stop contributing evidence, some experiences may
become less visible. The stories and recommendations that dominate may reflect
who is still represented. Simply adding more records is not a guaranteed cure,
and collecting or sharing them still requires care.

“So ask three questions: whose situation is missing, what evidence would change
our decision, and who is responsible if we are wrong?”

## Facilitator accuracy notes

- The room sheets are generated workshop data, not real household histories.
  Household lookup answers summarize what to inspect based on simulated records;
  they are not literal observations that one card caused another.
- The Mars map is a visual placeholder in Households. Its routes are not household
  geography or an empirical risk surface.
- Household Indicators uses a simplified teaching rule: failed harvest together
  with a loan requires intervention. Dotted cards mark indicators. This is not a
  validated rule for predicting actual dropout or making lending decisions.
- AI estimates use all revealed evidence. The live audience lookup uses the latest
  shown card and its context. Do not describe each audience sheet as a complete
  model of all revealed cards.
- A wrong action can end a team in this teaching game, including an unnecessary
  intervention in Indicators. That scoring rule is not a claim that real-world
  interventions always harm households when a predicted event would not occur.
- In room mode, reserve bots complete the word pack when attendance does not fill
  it. Do not describe those simulated votes as votes cast by real participants.
- The story about missing NGO data is a question about representation, not a
  causal result established by this workshop. The game illustrates a mechanism;
  it does not measure effects on a deployed language model.

Implementation context: [live room](../paperweights/room/README.md),
[mixed word corpus](../paperweights/robot-majority/MIXED.md),
[mode transitions](rover_mode_transitions.md).
