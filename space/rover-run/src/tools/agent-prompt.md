# Blind playtest prompt (for an outside agent)

Give the agent an empty working folder containing only a `play` wrapper that runs
`node <repo>/space/rover-run/src/tools/agent-play.mjs "$@"` and copies `out/agent/screen.png` next
to it. Then send:

---

You are playtesting a small browser game called Rover Run, blind. You are an independent player:
you have never seen its rules, deck or source code, and you must NOT look for them. The only things
you may use are the `./play` command in this directory and the screenshot it writes (`./screen.png`,
which you should open and look at after every turn: it shows the map, the cards and a graph).
Do not read any other files on this machine. Reading the game's code or data would ruin the test.

Commands:
  ./play new                                       start a new run
  ./play turn <go|avoid|recharge> [card card]      first look at cards of the square ahead
                                                   (slope|ground|dust|battery), then act
  ./play look                                      re-render without acting

Play like a thoughtful human on a first visit: start without overthinking, look at what is revealed,
form guesses, and test them on later runs. Play at least 5 runs and at most 8. Before each turn,
write down in one line what you expect and why. After every run, write down one rule
("when X happens, Y also happens") and how many times it held.

When you are done, write `notes.md` with:
1. A run-by-run log: score, how it ended, what you changed.
2. The rules you believe drive the hidden cards, how confident you are, and the evidence.
3. Which cards you chose to look at, and why.
4. When you trusted the map, and what on the map you looked at.
5. Moments that felt confusing, unfair, boring or fun. Be blunt.
6. Anything the screen failed to tell you that you needed.
