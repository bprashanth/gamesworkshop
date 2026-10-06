# gamesworkshop

Small games that let people discover a difficult relationship by making decisions,
not by sitting through an explanation.

## Rover Run: Modeling the world 

Run it yourself with `python3 space/rover-run/src/serve.py` (port 8670).

The point of this game is to help NGOs see the value in data programs. A problem I've observed running programs like insight-out and doing field work is that a lot of organization bandwidth goes into collecting data - but almost all of the analysis is done at _reporting_ time. Why is this? A few explanations 

1. Data is not useful to them in decision making. 

This is often the case when the problem is known - gender, politics, caste etc.  More than the data, what's important is resistance to the status quo. 

This is also the case with place based actors. They view "data" as "knowledge". I am here, I will remain here, no one else is here, so why should i bother writing down these numbers? They are transmitted by word of mouth, dance and song to everyone else who will be here. 

A case can always be _made_ for data to this group. The question is, should it be? 

2. Data is useful in decision making, but    
    a. collecting it is expensive
    b. analysing it requires expertise
    c. patterns show up too slowly

That is to say, data work is _slow_ and requires a strategic approach to yield any value.

This game is focused on a workshop to build such a strategic approach.  

We can also flip the question and ask: which type of data within an org is helpful in making decisions? 

1. Reporting data: these are usually lagging indicators. We record the fact that something happened. Not helpful, unless used to forecast. 
2. Operational data: this is typically where the meat of the leading indicators lie. It describes what the org is doing day to day, which, hopefully, should give some clues on their own decisions. 

This game is focused on identifying these splits in data. 

### Gameplay 

The game is built to teach the core moves of data science to people who don't use the words:

1. **Find the outcome** that matters (what killed the rover).
2. **Find its earliest indicator** (soft ground before sand, haze before a storm).
3. **Check that it is a pattern**, not an anecdote: each hazard recurs on one fixed map.
4. **Correlate over time** (one variable, one square ahead) and **across variables** (sand is
   never on steep ground; storms never on flat ground).
5. **Combine weak signals into a model**: haze alone storms 3 of 6 times; haze *and* a slope storm
   3 of 4. Write the model as one line, then play by it.
6. **Weigh precision against cost**: misses kill, false alarms cost turns, and attention is limited
   (on Hard you see only 2 of the 4 cards of the square ahead; on Medium the battery is hidden
   until you work out what it goes with). 

- **[Build details](space/rover-run/src/README.md)**
- **[Indicators](narrative/INDICATORS.md)**
- **[Reuse it with your own data?](narrative/REUSE.md)**
- **[Rulebook v2: current rules and state of play](space/rover-run/rulebook_v2.md)**: [design history](chronology/2026-10-04-rover-run.md), [original rulebook](space/rover-run/rulebook.md).

## Also in this repo

- **[Space anchor films](space/README.md):** short Mars and Moon films that set up Rover Run's
  narrative ([handoff](narrative/SPACE_ANCHORS.md)). The films live on the workshop machine, not in git.
- **[Crew](crew/README.md)**, **[Fieldwork](fieldwork/README.md)**, **[Idlisseus](idlisseus/):**
  earlier prototypes. Run `python3 play.py` to choose a terminal game.
- **[Chronology](chronology/)** and **[Benchmarks](benchmarks/)**: decisions, playtests and
  validation. The longer workshop method is in
  [the previous README](chronology/2026-10-04-readme-before-anchor-films.md).
