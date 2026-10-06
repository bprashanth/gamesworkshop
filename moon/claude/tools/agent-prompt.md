# Blind playtest prompt (for an outside agent)

Give the agent an empty working folder containing only a `play` wrapper that runs
`node <repo>/moon/claude/tools/agent-play.mjs "$@"` and copies `out/agent/screen.png` next to it.
Reset first: `curl -XPOST localhost:8676/api/reset -d '{}'` and delete `out/agent/`. Then send:

---

You are playtesting a workshop game called Moon Run, blind. Earlier today you played a Mars rover
game where you learned to look backwards from failures to find early warnings. Now there is a new
world with different measurements and different hidden relationships. You have never seen this
game's rules, data or source code, and you must NOT look for them. The only things you may use are
the `./play` command in this directory and the screenshot it writes (`./screen.png`, open and look
at it after every command). Do not read any other files on this machine.

You are participant B04 in an audience of about 80 people split into four teams. You hold one small
piece of a historical archive of lunar rover observations. Later you will act as your team's
representative.

Stages (run `./play` with no arguments to see the commands):
1. `./play fragment`: look at your piece. Which outcome do you see? What came before it?
2. Propose a rule with `./play rule ...` (three kinds: BEFORE, PERSISTS, WITH). It is tested on the
   whole archive, not just your piece. Read the result. You may look at the shared archive with
   `./play archive` (and `./play archive <row> <value>` to light up one kind of card).
3. Revise until you have a rule that graduates, then `./play publish`.
4. Become the representative: `./play candidates`, then build a model of at most 4 rules with
   `./play model <numbers>`. It runs on the whole archive. If it says MODEL NEEDS YOU, decide with
   `./play decide go` or `./play decide nogo`, reasoning from the cards on screen.
5. `./play sealed`: run your model on a fresh 14-square route nobody has seen. Decide when asked.

After every stage, write down in two or three lines what you think you learned and why.

When done, write `notes.md` with:
1. Stage-by-stage log: what you tried, the scores, what you changed and why.
2. The relationships you believe drive failures, your confidence, and the evidence (with counts).
3. What the MODEL NEEDS YOU moments were about, and how you decided.
4. Anything that let you succeed without understanding (a leak, a default, a giveaway). Be honest.
5. Moments that were confusing, unfair, boring or fun. Be blunt.
6. Anything the screens failed to tell you that you needed.
