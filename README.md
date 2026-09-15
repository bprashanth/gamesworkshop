# gamesworkshop

A method for turning field knowledge into a game a room can play.

## What this is for

People who work in a field know things that do not travel. Someone who has spent
ten years watching a forest can tell you which moment is the dangerous one, and
it is usually not the moment an outsider would guess. Say that from a stage and
people nod. Put it on a slide with a graph and it sticks slightly less.

This is a way of doing it instead. You do not explain the thing. You build a
small system that behaves like the real one, put a room inside it, and let them
push on it until it pushes back. What they work out for themselves under mild
pressure with other people watching is the part they keep.

It has been done once, end to end, for invasive lantana and forest fire. That
worked example is linked at the bottom and it is the useful half of this repo.

## The premise

You are not transferring facts. You are transferring one counterintuitive
relationship. Find the thing experts know and outsiders get backwards, then build
a system where getting it backwards costs something in front of witnesses.

Everything below follows from that.

## The method

Eight steps, in the order we would do them again. Most of the time goes into
steps 2 and 6.

**1. Write the one sentence.** With a turn in it. Something outsiders get
backwards. If you cannot get your field down to one sentence with a turn in it,
you are not ready to build a game, you are ready to give a talk.

**2. Find the quantity the world responds to.** Not the obvious one. The obvious
one is usually a proxy that stops working exactly when it matters. The two agree
early and diverge late, which is precisely why people get it backwards. This step
is the whole design and it takes the longest.

**3. Pick a party game people already know and swap the nouns.** Mafia, charades,
auctions, trading games. Do not invent a game. Your first twenty minutes must
cost zero rules.

**4. Run your system silently underneath it.** Drive it off moves people are
already making for social reasons. They are voting to win an argument. Your
system does not care why they voted. Then show them the record at the end. The
gap between what they thought they were doing and what they did is the payload.
Keep one visual anchor stable through the reveal so the change lands on something
recognisable.

**5. Add the pressure in a second round.** One decision per turn, a tradeoff and
not a menu. Automate the expertise and keep the tradeoff: players choose what to
spend the turn on, the system chooses the technique. Then tune the middle until
your turn actually happens, and measure it over a hundred scripted runs. If it
fires in a third of sessions you have a simulation and not a teaching tool.

**6. Prove it with somebody else's model.** Somebody in the room is wondering
whether you made the rules up to reach your conclusion. Hand your state to a
model you did not write, in your field's real units, and draw the result on the
same picture the room already knows. Keep exactly one control. Run it twice: what
happened, and what a competent plan would have done. The difference between those
two pictures is the argument.

**7. Show how the knowledge is really produced.** Otherwise you have taught a
model of the world and left the impression that somebody simply knows these
things. Use measured data, not illustration, and label every frame with which
kind of truth it is.

**8. Hand them something to take home.** A room game dies when the room leaves.
Make a single player version and make the early levels unwinnable on purpose,
each for a different missing reason. People do not learn that a tool matters by
being given it. They learn it by working without it.

## Things we got wrong first

Worth knowing before you repeat them.

**Helpful automation ate the lesson.** The system picked the optimal action each
turn, and the optimal action was the invisible one. An automated choice should be
a good one that is also worth watching.

**The proxy was wrong for a month.** We drove the whole model off how much of the
thing there was, when the real driver was how connected it was.

**Inconsistent physics loses a room that knows the subject.** If a river stops a
fire it has to stop everything else that creeps.

**Interrupting to explain.** Stop the room in proportion to how much they can act
on what you are showing. The same content wants different pacing depending on
whether people are deciding or watching.

## What you actually have to build

Less than it looks. A room server with no dependencies, phones that show one
line, one console for the facilitator, one renderer for the shared screen, and an
event log.

Write the event log first. Make it complete enough to redraw a whole session
without touching game code, and freeze one real session as a fixture. Everything
downstream reads the log and nothing else: replays, films, models, analysis. It
is also how several people can build different things at once without colliding.

The renderer and the log are where the time goes. The game logic is a few hundred
lines, because the game should be simple on purpose.

## The worked example

Pyrocene. A room plays Mafia with ecological roles, a map changes behind them,
fire arrives, their own board is handed to real fire models, then real remote
sensing, then they take a single player game home.

The full write-up is `narrative/GAME_DESIGN.md` in
[bprashanth/pyrocene](https://github.com/bprashanth/pyrocene). It describes each
piece twice: once for lantana and fire, and once with the ecology taken out. It
indexes the code, the tunables and a dated record of what went wrong.

At the time of writing that document lives on the `mafia` branch, which has not
been pushed, so the link will not resolve until it is.

## Status

The method has been run once. That instance has not yet been played by a real
room, so every number in it comes from scripted play against a model of a room
that does not argue, get suspicious, or vote badly on purpose.

Treat the eight steps as a working hypothesis with a sample size of one.
