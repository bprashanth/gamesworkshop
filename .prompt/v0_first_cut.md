Build a very small, replayable, terminal-first game prototype around AI infrastructure choices for social-sector organisations.

The purpose of this prototype is NOT to create the final Summit experience yet. The purpose is to find a core game loop that is genuinely fun, creates meaningful trade-offs, and can later scale to ~200 people playing in teams.

Think of the game mechanically as:

**Reigns × FTL**

Reigns:
- short event appears
- player makes a simple choice
- choice changes their situation
- next event appears
- eventually the run succeeds or collapses

FTL:
- you begin with a particular “build”
- different builds are strong against different situations
- random events make some choices suddenly brilliant and others painful
- you adapt during the run
- losing should make you want to try again with a different build

Do not turn this into a complicated strategy game. We are testing the loop.

## Setting

The game is set in a near-future social sector increasingly shaped by AI.

The player is not a medieval king. They are more like an **Idlisseus-style traveller/builder**, moving through a changing AI landscape and encountering problems along the way.

The tone can have a little mythic “journey through uncertain territory” flavour, but the events themselves should feel contemporary and immediately understandable:

- a new government welfare scheme
- a crop pest
- a flood
- internet connectivity disappearing
- a sudden surge in users
- a new open model release
- a vendor changing its terms
- a data breach
- a new regulation
- an NGO offering to share data
- an AI confidently giving bad advice
- a sudden funding opportunity
- a local language nobody planned for
- a public backlash
- an unexpected scientific or technical breakthrough

The world should feel slightly futuristic, not dystopian.

## Domains

At the beginning of each run, randomly assign one domain:

- Education
- Agriculture
- Land / Water
- Livelihoods
- Health

Each domain should have a simple mission.

Examples:

Education:
“Help 100 schools identify and support students falling behind.”

Agriculture:
“Help 20,000 small farmers diagnose crop problems and access advice.”

Land / Water:
“Monitor ecological and water-system changes across a large landscape.”

Livelihoods:
“Help 50,000 people navigate schemes, jobs, training and entitlements.”

Health:
“Support frontline health workers handling routine cases and referrals.”

The domain should flavour events, but do not build five completely separate games. Events can have domain-specific text while sharing the same underlying mechanics.

## Starting stack

At the beginning of a run, randomly assign a simple AI stack.

For now there are only three dimensions.

### BRAIN

BIG / REMOTE
- frontier-quality model
- very capable
- depends on connectivity / external infrastructure
- less organisational control

SMALL / LOCAL
- weaker
- works offline
- more organisational control
- limited capability on difficult tasks

You may later experiment with a third option such as a large open model, but start with only Big/Remote vs Small/Local if this makes the game cleaner.

### DATA

PRIVATE
- your organisation keeps control
- others cannot learn from your data
- you cannot automatically benefit from theirs

OPEN / SHARED
- other organisations can benefit from your data
- you can benefit from theirs
- greater exposure and loss of exclusivity/control

### GUARDRAIL

HUMAN
- stronger judgment / accountability
- slower
- limited by human capacity

LLM JUDGE
- very fast
- scalable
- can miss things confidently

The important principle is:

**No stack should be obviously best.**

A stack should feel excellent during some events and terrible during others.

The game must actively challenge the simplistic conclusion that:

“small + local + open + human-in-the-loop is always the right answer.”

For example:
- Big model should genuinely win some capability situations.
- LLM verification should genuinely win some scale situations.
- Local models should genuinely win some infrastructure shocks.
- Open data should genuinely win some collective-learning situations.
- Private data should genuinely protect the player in other situations.
- Human verification should sometimes save the organisation.
- Human verification should sometimes become the thing stopping the organisation from helping people.

## Core run structure

A run should take roughly 5–10 minutes.

Aim initially for around 5 major turns/events.

A useful rough arc is:

1. CAPABILITY
2. SCALE
3. SHOCK
4. COLLECTIVE / DATA
5. MARKET SHIFT

Do not force every run to use exactly this ordering once the game works, but use it to build the first prototype.

### Example: Capability event

“A new government scheme launches tomorrow. The rules are 240 pages and differ between states. Thousands of people need answers immediately.”

Big model should have a meaningful advantage.

Small model might need:
- extra human effort
- accepting lower accuracy
- asking another actor for help
- spending some resource

### Example: Scale event

“Your service gets 100× its normal users overnight. Your staff count has not changed.”

LLM Judge should have an advantage.

Human verification should face a real bottleneck.

The choice should not simply be:
“Would you like unsafe AI?”

Make the trade-off meaningful:
serve everyone imperfectly vs serve a small fraction carefully.

### Example: Shock event

“Flooding has knocked out internet access for three days. Your service is needed more than ever.”

Small/Local should suddenly become extremely valuable.

Remote systems should need:
- a workaround
- help
- a resource
- or suffer damage

### Example: Collective/Data event

“A new crop disease / health symptom / water contaminant / scam is appearing. No organisation has enough examples to understand it alone.”

Open-data teams should benefit from pooled evidence.

Private teams should face a meaningful decision:
stay private or share now.

Opening data should not be a trivial “correct” choice because it may create later vulnerabilities.

### Example: Market Shift

“A new open model appears at 90% of frontier capability and one-tenth the inference cost, but needs technical staff to deploy. Meanwhile the commercial provider offers NGOs its best model free for five years.”

This should test:
- adaptability
- dependency
- control
- technical capacity

Again, do not make “open wins” the answer.

## Choice structure

Events should be short.

Prefer:

1–3 lines of situation

then:

[A] Choice
[B] Choice

Sometimes allow:
[C] Spend a scarce resource / rebuild / ask for help

Avoid paragraphs of exposition.

The player should understand the dilemma in about 10 seconds.

The downside of a choice should usually be visible BEFORE choosing.

Do not rely heavily on:
“Surprise! The obviously good option was secretly bad.”

Unexpected consequences are fine, but the player should usually be making an informed gamble.

## Randomness

Use randomness carefully.

There are three good kinds:

### 1. STACK CHECK

Your build directly matters.

Example:
offline outage -> Local survives.

### 2. RISK

Your build changes probabilities.

Example:
LLM Judge has a 70% chance of catching a failure.
Human review has 95%, but costs capacity.

### 3. WORLD CHANGE

Some future events are genuinely uncertain.

Example:
- GPU shortage
- major open-model release
- public backlash
- government mandate
- flood
- data breach

The randomness should create replayability, not erase strategy.

The player should regularly think:

“I lost because this build was vulnerable to that world.”

not:

“I lost because the game rolled badly.”

## Adaptation

Allow the player some limited ability to change their stack during the run.

For example:

- 2 Rebuild tokens per run
- changing one stack component costs 1 Rebuild

This creates the key question:

“Do I stick to my principles or adapt?”

The strongest hidden lesson may be:

**the best stack is not the one that wins every event; it is the one that lets you adapt without collapsing.**

## Lives / survival

Start with something extremely simple:

3 lives.

Bad outcomes can remove a life.

At 0:
the organisation fails / the run ends.

But do not make every suboptimal choice cost a life.

Some consequences can instead create temporary states:

- overloaded
- locked-in
- low trust
- offline
- data exposed
- staff exhausted

Only introduce these if they clearly improve the game.

Avoid building a complicated resource-management system before proving it is needed.

## UI

The prototype must be playable entirely in the terminal, including over SSH.

Prioritise:

- keyboard input
- very little setup
- simple text UI
- retro terminal aesthetic
- readable monospaced layout
- optional ncurses / textual-style framing
- no mouse requirement

Something like:

------------------------------------------------
            IDLISSEUS // RUN 03
------------------------------------------------

DOMAIN
AGRICULTURE

MISSION
Help 20,000 farmers diagnose crop problems.

STACK

BRAIN        SMALL / LOCAL
DATA         PRIVATE
GUARDRAIL    HUMAN

LIVES        ♥ ♥ ♥
REBUILDS     ◆ ◆

------------------------------------------------
YEAR 2 // THE SURGE
------------------------------------------------

A new crop-insurance scheme launches.
Requests jump from 300/day to 30,000/day.

[A] Human-review every answer
[B] Let the AI answer routine questions directly

>

Keep graphics extremely simple.

ASCII and small transitions are enough.

A short “SYSTEM UPDATE” or “WORLD EVENT” interstitial could work well.

## Pyrocene UI reference

There is another project locally at:

../pyrocene/engine
../pyrocene/game

Inspect it for UI and interaction patterns only.

Do NOT copy the Pyrocene gameplay loop.

Useful things to borrow might include:

- restrained visual language
- game-state presentation
- clear event/decision screens
- retro / slightly diegetic aesthetic
- simple transitions
- presenting consequence clearly after an action

The new game's mechanics are entirely different.

## Build approach

Please build this iteratively.

Do not spend the first pass making lots of content.

Start with:

- 1 terminal game
- 5 domains
- 2 Brain choices
- 2 Data choices
- 2 Guardrail choices
- ~12–20 events
- 5-event runs
- 3 lives
- 2 rebuilds

Then PLAY IT YOURSELF repeatedly.

Do not stop after verifying that the code runs.

The goal is to determine whether the game is actually fun.

## Self-play / testing

Run many simulated or manual test runs with different stacks.

At minimum test:

- Remote + Private + Human
- Remote + Open + LLM
- Local + Private + Human
- Local + Open + LLM

Also test edge cases.

Track rough outcomes across runs.

We should not see one stack dominating nearly every run.

## Metrics to optimise

Use these as design targets rather than rigid numerical benchmarks.

### 1. DECISION TENSION

For most major events, neither answer should feel obviously correct.

Target:
in manual testing, you should sometimes hesitate for at least a few seconds.

If 90% of events have an obvious answer, rewrite them.

### 2. STACK REVERSAL

Every core stack component should have moments where it feels:

“Thank God I chose this.”

and other moments where it feels:

“Damn, this choice is hurting me.”

If Small/Local only produces benefits, the design has failed.

If Human verification is always good, the design has failed.

### 3. REPLAY DESIRE

After losing or finishing, the player should naturally wonder:

“What if I ran that with a different stack?”

That is more important than a long first run.

### 4. CONSEQUENCE CLARITY

After each event, the player should understand WHY their stack helped or hurt.

Avoid opaque scoring.

Prefer:

“Your remote model is unavailable because connectivity is down.”

over:

“-2 resilience”

### 5. ADAPTATION PRESSURE

At least once per run, the player should seriously consider spending a Rebuild token.

If nobody wants to change their stack, the events are not putting enough pressure on the build.

### 6. NON-DOMINANCE

Across repeated runs, no starting stack should consistently win.

Aim for builds to perform differently depending on the event sequence.

### 7. RUN LENGTH

A run should remain short enough that losing feels fun.

Aim for roughly:
5–10 minutes.

If someone dies in Turn 3, restarting should feel effortless.

### 8. SURPRISE WITHOUT CHEATING

Events should occasionally surprise the player, but not feel arbitrary.

The player should be able to say:

“I didn't predict that, but it makes sense.”

not:

“There was no way I could have known.”

## Tone

Keep the writing crisp, slightly playful and occasionally funny.

Examples:

“Your AI confidently invents a subsidy that does not exist.”

“Friday, 6:47 PM. Your vendor has updated its terms of service.”

“Congratulations. Your model is trending on WhatsApp. Unfortunately, so is the screenshot of its mistake.”

“Half the district is offline. Your cloud model has achieved enlightenment by becoming completely inaccessible.”

Do not overdo jokes. The underlying dilemmas should stay credible.

## Important design principle

This game should NOT secretly preach a preferred architecture.

It should make the player experience:

- capability vs control
- scale vs verification
- openness vs privacy
- resilience vs intelligence
- convenience vs dependence
- today's optimum vs tomorrow's uncertainty

The player should finish thinking:

“There isn't one correct AI stack. I need to understand what my organisation is optimising for, what failures matter most, and how easy it is to change later.”

## Deliverables

1. A working terminal game.
2. A short README explaining how to run it.
3. A concise description of the game loop.
4. The current event deck in a readable data file so we can edit events easily.
5. A short testing note containing:
   - which builds you tried
   - which events were boring or obvious and were changed
   - any dominant strategy discovered
   - which moments were actually fun
   - what you changed after playtesting

Keep the implementation deliberately small.

Do not build networking, accounts, multiplayer, elaborate graphics, a PWA, or Summit-scale infrastructure yet.

We are trying to answer one question first:

**Is repeatedly choosing an AI stack, encountering an uncertain world, adapting, and occasionally dying actually fun?**

Keep iterating until the answer is plausibly yes.
