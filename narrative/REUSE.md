# Reusing Rover Run with your own data

Rover Run is a small framework for one kind of lesson: **people discover the indicators of a bad
outcome by making decisions on partial data, then build a simple model from them.** It has now been
built twice:

| Skin | Folder | Question |
| --- | --- | --- |
| **Rover Run** | `space/rover-run/src/` | drive a rover across Jezero crater without hitting sand or a storm |
| **Servers** | `servers/` | scale up your servers or spend the month on marketing, without an outage, losing your users, or going broke |

This guide is for a team, or an agent, who wants a third skin on their own data: a river, a clinic,
a farm season, a supply route. Everything here was learned building and playtesting those two.
Read [INDICATORS.md](INDICATORS.md) first: it is the lesson you are re-skinning.

## 1. Check that your problem fits

| Need | Rover Run | Servers | Your data, for example |
| --- | --- | --- | --- |
| **A sequence** of 8–16 steps | 14 squares of a route | 14 months | stretches of a river; weeks of a season |
| **4 variables per step**, each low / mid / high | slope, ground, dust, battery | queries, users, servers, funds | rainfall, turbidity, chlorine, stock |
| **Two outcomes that end the run** | SAND, STORM | users GONE, servers BURNING | contamination; crop loss |
| **A warning one step earlier** for each | soft before SAND; haze before STORM | few users before GONE; warm servers before BURNING | turbid water the week before |
| **A context card that cancels a warning** | steep ground never sands | a flood of traffic brings users back | a protected well never contaminates |
| **Two signals that matter only together** | haze *and* a slope: storms 3 of 4 | warm *and* real traffic: burns 3 of 4 | rain *and* low chlorine |
| **A resource you must top up** | battery (recharge) | funds (apply) | chlorine stock; staff days |
| **One dodge move that makes sense for both outcomes** | detour | market | close the well for a week |

Two tests that are easy to fail:

- **The dodge must make sense for every hazard.** "Market" saves a user collapse naturally, but a
  blind playtester called "market when the servers are burning" arbitrary. If one word can't cover
  both outcomes, pick a word that can (pause, hold, close) or make one of the outcomes different.
- **There must be a leading indicator.** If nothing warns one step earlier, the game has nothing to
  teach. Choose a different outcome.

## 2. Write the lesson table before touching code

| | Your answer |
| --- | --- |
| The journey, its N steps, and the story arc across them | |
| The 4 variables, each with low / mid / high | |
| The two death conditions (which variable at which level) | |
| The warning for each death (one step earlier) | |
| The context that cancels a warning | |
| The pair of signals that matters only together | |
| The resource, and why a dodge drains it | |
| What is **real** data and what is **authored** | |

**Honesty rule.** Bucket real values where you have them (Rover Run's slope comes from a real
elevation model), author the rest openly, and say which is which. Servers is entirely illustrative,
and its README says so.

## 3. Write the deck: a new story, the same laws

Write a fresh story; don't relabel another skin's deck. Servers has its own arc (quiet launch, viral
flood, lull, second surge, summer slump, festival flood) but obeys the same laws as Rover Run:

- **Every outcome recurs 3 times.** One case is an anecdote.
- **Every outcome is preceded by its warning**, and some warnings are **false alarms**.
- **The cancelling context has at least 2 clean cases**, ones not already masked by another hazard.
  Servers' first draft had only one (the other few-before-flood month was also a burning month that
  everyone avoids), and the simulator caught it ("ignoring the query level costs only 1 point").
  The fix was one more surge month.
- **The pair is likely but not certain** (3 of 4), so the model carries honest uncertainty.
- **The resource is a card, not computer state.** A physical table can't track hidden state, so make
  it a dealt card: *the money (or battery) you arrive with*, empty on the step right **after** each
  hazard you dodged. It then never gives away the hazard ahead, only the cost of the one behind.
- **The run's score must reward acting, not hiding.** If dodging is free, "always dodge" wins. The
  stateless fix: only steps you go through score; a dodge scores nothing.

## 4. The backdrop

The map gives place to the data, and the context card should be readable from it.

- **Terrain** (Rover Run): `space/rover-run/src/tools/prep.py` turns an elevation raster plus a path
  into contours, a route and strips (`--strips 14` so card column *i* sits under strip *i*; `--rotate`
  so the path reads left to right; rotate, never mirror).
- **A chart** (Servers): `servers/tools/chart.mjs` draws the demand curve from the deck's context
  card (gentle in whisper months, steep in floods), with parallel lines that bunch where it is steep.
  Because it is **generated from the deck**, map and cards can't disagree.

Either way, `map.json` has the same keys: `contours`, `route`, `rowStart`, `strips`, `aspect`.

## 5. Fork, then rename carefully

**Fork; don't edit the parent.** Copy `web/` and the tools into a new top-level folder, and give it its
own port (Rover Run 8670, Servers 8672) and its own `localStorage` key, so the two never interfere.

**Renaming is where the bugs were.** About 35 places name the variables and outcomes, and a blind
find-and-replace of the vocabulary went wrong in two ways in Servers:

1. **Collisions with internal names.** Renaming the value `'dead'` to `'empty'` also renamed the
   game's internal "death screen playing" state, which was also `'dead'`. The game still ran, because
   the rename was consistent, but the code became misleading, and a test that waited for that state
   hung.
2. **Half-renamed fields.** Renaming `.battery` to `.funds` changed the property *reads* but not the
   object literal that creates the state (`battery: 'full'`), and an end code `'battery'` became
   `'funds'`.

What worked:
- **Rewrite `engine.js` and `analysis.js` by hand** in the new vocabulary. They are short, and
  they are where correctness lives.
- **Make targeted edits in `game.js`**, then grep for every old word (`'dead'`, `'go'`,
  `'recharge'`, `sand`, `storm`, `battery`) and read each hit.
- Never rename unquoted words or function names (`fx.storm`, `localStorage.clear`).

The places to change: `engine.js` (death checks, resource card), `analysis.js` (risk rules,
strategies, checks), `game.js` (`SUITS`, `deadly`, `warning`, `word`, `AHEAD`, `fatalCard`, death
messages, move names and keys, `deathScreen`), `symbols.js`, `index.html` (title, legend).

A third skin should first move these names into `deck.json` so that re-skinning is data, not code.

## 6. Glyphs and death screens

- **Line-drawn, the same stroke weight as the parent, no emoji.** Readable pictures: a figure
  sinking, rain, a dust devil; a walker with dogs (users), an empty leash (users gone), a rack with
  heat lines and then flames.
- **Make a mock page first** (Rover Run's `src/mocks/glyphs.html`, kept locally) and choose there, side by side, at
  card size and large.
- **Death screens map onto meaning.** Reuse the dot-particle effects (a sandstorm washout, a TV
  switching off) and add at most one new one. Servers added a burn: the chart catches fire from the
  bottom up.

## 7. Tune with the simulator, and match the parent's numbers

`node tools/sim.mjs` plays every strategy (always go, dodge every warning, ignore the context, the
intended model, look at a given pair ahead, random), searches resource timing optimally, scores with
one life, and checks the targets and every designed pattern. Sweep the spare turns until all pass.

**If the new skin's scores match the parent's, the lesson is the same.** Servers reproduces Rover
Run's row for row: look ahead 11, the model 10, ignore context 8, dodge every warning 6, always dodge
3, always go 2, random 1.0.

## 8. Playtest blind, and read what it actually learned

`tools/agent-play.mjs` drives the real page (`new`, `level <easy|medium|hard>`, `turn <move> [card
card]`). Give an agent an empty folder with only a `play` wrapper, no access to the code or deck,
and the prompt in `space/rover-run/src/tools/agent-prompt.md`. Ask it to state one rule after
every run. Watch for a harness default that hands it the winning cards: Servers' harness defaulted
to the best pair, so check the notes for whether a choice was deliberate.

What three blind playtests taught:

1. **Same-deck retries teach memorising, not modelling.** Rover Run's first agent beat the intended
   score by remembering cards. Fix: three lives instead of unlimited retries, and a reset that
   forgets.
2. **A look-ahead that shows the hazard teaches nothing about indicators.** The Servers agent
   finished every run after the first, learned the death conditions and the resource rule exactly,
   and never used a single warning card, because Medium and Hard let it look at the month ahead's
   users and servers, i.e. the hazards themselves. Rover Run has the same gap. **Rule: before a move,
   show only the context and warning layer of the step ahead (or nothing), never its hazard cards.**
   The room must reason "warning last step + context ahead → risk". (As of 2026-10-06 neither
   Rover Run nor Servers applies this yet; it is the next change for both.)
3. **What the screen doesn't explain becomes superstition.** With no scoring explanation, the
   Servers agent dodged through most safe months and scored 7 of a possible 11. With no reason given
   for a lost life, it guessed. A card that means "on arrival" next to a live counter confused it.
   Show the score rule in one line, say why each life was lost, and keep the live resource visibly
   different from its card.

When it works, it is unmistakable: in the two-deck experiment, a fresh agent kept "soft + not steep →
SAND, always 5 of 5" as its own rule and scored 30 of 31.

## 9. The physical version

Everything is a card or a token, so a table can play without a screen:
- a printed strip map or chart;
- one deck per variable, numbered 1–N, never shuffled;
- a turn track and 3 life tokens;
- a facilitator who flips cards.

Modes map onto the table (as recommended in §8):
- **Easy:** all cards face up;
- **Medium:** the step ahead shows only its context/warning cards;
- **Hard:** the team turns over 2 allowed cards.

## 10. Repo hygiene (mistakes made once, so you don't)

- **Commit paths, not `git add -A`,** when other sessions share the repo. It once swept another
  session's 122-file project into commits labelled with this game's name.
- **History rewrites touch the working tree.** `git filter-branch --index-filter` removed files from
  disk when it checked out the new tip. Make a backup branch first, then restore and verify every
  file afterwards.
- **Keep benchmarks, frozen versions and media out of git.** Large media lives on external storage,
  symlinked in. Benchmarks graduate by being written up in a README, chronology or narrative.
- **Stop servers by PID, never by name pattern.** A broad `pkill` once took down other projects'
  servers.

## 11. Checklist for an agent doing this end to end

1. Fill the fit table (§1) and the lesson table (§2). Check that the dodge works for both hazards.
2. Fork the game into a new folder, with its own port and storage key (§5).
3. Write the deck as a new story under the same laws (§3), and the map (§4).
4. Rename: rewrite the engine and analysis by hand, edit the page, grep for every old word (§5).
5. Draw glyphs on a mock page; map the death screens (§6).
6. Run `node tools/sim.mjs` until every check passes and the numbers match the parent (§7).
7. Check that no mode shows the step ahead's hazard cards before a move (§8, lesson 2).
8. Screenshot Easy, Medium and Hard at 1440×900 and fix any overflow.
9. Run one blind agent playtest. Did it state a *warning → outcome* rule, or only "avoid the
   hazard I can see"?
10. Write the README (translation table, rules, patterns, tuning) and a chronology entry; commit
    by path.
