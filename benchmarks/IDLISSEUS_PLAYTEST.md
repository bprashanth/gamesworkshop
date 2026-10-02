# Idlisseus: first-cut playtest

2026-10-02. Agent self-play and terminal testing, not a study with human players.

## What changed after playing

The first deck mostly offered “big result if your stack fits” versus “small
safe result.” At a target of 14, a cautious policy won 79–93% of 250 worlds per
build without rebuilding; the adaptive policy won 99–100%. Survival alone was
not an interesting mission, and nearly every large answer occupied button A.

The current target is **20 teams in five stops**. Eight cards offer a large
push that spends a life even when it succeeds. Small jobs can conserve lives,
restore one, or make time for a rebuild. Several failed gambles retain partial
progress. A/B order varies, and a favour disappears when ordinary work would
give the exact same outcome for free. This creates decisions about *when* to
push and *where* to spend help, rather than repeatedly selecting the biggest
number.

Specific rewrites:

- **Messy records:** a tiny fallback with a useless refill at the opening was
  uninteresting. The smaller job now gives 3 reach with remote reasoning, 2
  otherwise, plus rebuild preparation.
- **Vendor subsidy:** charging a life immediately *and* locking the player in
  made it a weak temptation next to a normal overtime push. The final version
  really supplies free capacity now; dependency and the eventual exit bill
  are its cost.
- **Market:** choosing an unrelated final route let players avoid a vendor
  contract's consequences. The last world change is now unavoidable.
- **Route clues:** vague atmosphere concealed consequential route differences.
  Clues now name relevant strengths and favours; ceilings show the opportunity
  before committing. Future event identities stay hidden.
- **Data exposure:** an attack on already published records could be magically
  defeated by toggling to private. The preventable attack now concerns the
  next upload. Other copy explicitly says old releases cannot be recalled.
- **Workbench:** shows the new consequences before spending. Removing redundant
  “switch to your current stack” text, wrapping titles, flagging lethal choices,
  and showing exact before/after resources improved readability.

## Moments worth keeping

- **Seed 23, remote/private/human, field favour:** taking the six-reach opening
  sprint cost a life. Spending the field favour on the queue preserved human
  review for a misinformation event. Switching to shared evidence enabled
  another push: mission met, one life left. The final choice was to preserve
  the organisation rather than chase surplus reach.
- **Seed 19, local/private/human, dev favour:** the first workbench offered
  remote reasoning for 3 reach or shared examples for 4. Choosing shared kept
  the local model's later outage advantage and enabled the network response.
- **Seed 6, remote/open/judge:** keeping both rebuilds made it possible to pay
  the vendor exit bill at the last stop. Spending either earlier would have
  left an ugly choice between missing the target and risking collapse.
- **Seed 7, remote/private/judge:** an intermediate tuning pass produced that
  exact trap: 18 reach, one life, one rebuild, and a two-token exit bill.
  The final gamble was tense because its cause was visible in earlier choices.

These sessions informed revisions; the vendor's immediate life cost was
subsequently removed, so their earlier resource totals are not all fixtures for
the final deck. Actual replay, EOF, invalid input, recovery, and endings also
run through the real CLI in the integration suite.

## Final balance sample

1,000 seeds (0–999) per build per policy: **32,000 expeditions**. Kits alternate
by seed. Each policy receives identical seeded routes for a given world; route
selection is random, not optimised with secret card contents. Decision policies
inspect only revealed options. The adaptive heuristic can inspect a single
component rebuild and charges an estimated opportunity cost for resources.
It does not read future cards or hidden risk rolls.

| Starting build | Bold, no rebuilds: wins | Adaptive: wins |
| --- | ---: | ---: |
| Remote / Private / Human | 47.7% | 86.6% |
| Remote / Private / AI review | 45.5% | 82.1% |
| Remote / Shared / Human | 47.3% | 90.9% |
| Remote / Shared / AI review | 54.6% | 85.8% |
| Local / Private / Human | 34.3% | 76.2% |
| Local / Private / AI review | 34.4% | 80.7% |
| Local / Shared / Human | 39.4% | 82.5% |
| Local / Shared / AI review | 45.8% | 77.1% |

The cautious policy wins 0–2.7%; random play wins 3.5–11.7% and collapses in
14.9–18.4%. Adaptive play spends 1.35–1.81 rebuild tokens per expedition on
average. Its failures miss reach rather than collapse: the heuristic strongly
penalises lethal choices. This should not be mistaken for a measured human
death rate.

An additional 8,000 same-world comparisons found **every starting build wins
on some seeds where each other build loses**. Remote/shared/human still has the
best average under this heuristic; the game is not perfectly balanced. There
is no starting build that wins across all worlds in this sample. Deliberate
route selection may make expert play easier than the random-route benchmark.

Raw evidence: [balance](idlisseus-balance.json), [pairwise worlds](idlisseus-matchups.json).
Reproduce the per-policy tables with:

```bash
python3 -m idlisseus --simulate 1000 --policy adaptive
python3 -m idlisseus --simulate 1000 --policy bold
python3 -m idlisseus --simulate 1000 --policy cautious
python3 -m idlisseus --simulate 1000 --policy random
```

## Verification and remaining uncertainty

**40 tests pass**, including 640 real-deck runs covering all eight builds and
both kits, all five domain substitutions, deterministic weather, exact gamble
previews, resource caps, contractual exits, irreversible death, fog isolation,
clean quit/EOF, narrow terminals, logging failures, and a complete CLI run plus
same-weather replay. Command: `python3 -m unittest discover -s tests -v`.

The loop now has plausible tension and useful replay counterfactuals. Human
enjoyment, reading time, and replay desire remain unmeasured. A quick reader
can finish below five minutes; discussing decisions can take five to ten.
The game intentionally keeps five shared mission classes and one favour slot;
it does not claim an evidence-based ranking of India's social problems.
