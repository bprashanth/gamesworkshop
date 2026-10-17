# 17 October 2026 - Paper Weights sentence benchmark

Paused the Rover partnership discussion at the user's request. Started an isolated Swift
stage-two benchmark: two groups try to steer one robot sentence toward good/bad, with five
turns each in roughly five minutes. The user requested several played variants, actual
sentence traces and a playable page reachable over their existing Tailscale connection.

Delegated immutable model/simulations, interactive UI and Swift-format print generation to
the three existing agents. Root reviewed the original word generator and current hosting,
coordinated the experiment, and owns final cross-checks and this narrative checkpoint.
The original word corpus cannot express the new goal; new grammar and transitions are
explicitly authored. Rover game files and existing production decks remain unchanged.

The candidate that preserves the strongest lookup continuity is sentence revision via a
continuous token/color chain: every chosen right token/color is the next cue, while the
word replaces its grammatical position rather than extending an ever-longer sentence.
Compare this against append-only clauses and fixed-order revisions; also compare majority,
sampling and deliberate representative choice. Separate legal-play evidence and authored
valence diagnostics from claims about human enjoyment or objective semantic correctness.

Started the existing repository HTTP server on port 8684, bound for local/Tailscale access.
Confirmed HTTP 200 through the machine's Tailscale address. No public deployment requested.


## Selected prototype and validation

Built `paperweights/sentence-lab/` with three playable variants: continuous-chain revision,
scheduled re-cueing, and append-only clauses. Each supports representative choice among
the two leading words (including ties), majority, or sampling all positive paper votes.
The final seed-17 demo is explicitly curated: all ten decisions alter the sentence, all
five slots are visited, and the authored action tally reverses lead five times. Neither
the grammar nor the valence labels are learned, and the UI leaves final judgment to people.

Rejected the first random graph for neutral loops; changed graph construction to provide
opposed leading actions and reachable verb slots. Rejected a subsequent seed-2 demo for two
unchanged final moves; removed its generated print output. Final 15-person pack ID is
`SL1-17-15-aef34c5694`. The final sentence alternates constructive/destructive revisions;
full traces and 200-seed comparisons live in the experiment's README and trials.json.

The 200-seed 15-person sweep gives chain representative play 2.03 mean lead reversals,
versus 1.315 scheduled re-cueing, 0.645 majority chain and 0.94 sampled chain. Append-only
runs grow to about 35 words and deliberate opposing additions tie under the simple tally.
The chain game's second-mover advantage remains material; document it rather than claiming
fair tournament scoring. These simulations do not establish that a five-minute human game
will be fun or readable; the page is the requested rehearsal benchmark.

Root played the selected ten turns via Tailscale HTTP in Playwright, checked every displayed
vote against actual group sheet rows, exact word/color cue handoff, all ten sentence changes,
and 90 comparison trace rows. No page errors. Model tests verify 15/100/200 data, 50 graph closure
cases and Python/JavaScript trajectory parity. Print agent verified all 360 pairs/colors
on 15 A4 pages against the live pack and visually reviewed the approved Swift layout.

Narrative handoff: `narrative/SENTENCE_BENCHMARK.md`. Review URL:
http://100.82.28.38:8684/paperweights/sentence-lab/ . Original Rover and word packs untouched.

Final browser checks passed for all variants and controls: ten turns/five per group, undo/reset,
reproducible sampling, recorded-representative replay, timer expiry without an automatic
choice, all nine comparison traces, PDF download and responsive layouts. No HTTP or JS
errors. Final print instruction reads “Vote the right word + its color.” The server remains
running on port 8684 for the user to try the benchmark.
