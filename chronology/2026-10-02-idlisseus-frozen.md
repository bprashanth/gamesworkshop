# 2026-10-02 — Freeze the first loop before field testing

The first playable Idlisseus loop is frozen for the user's next-day test.
Reference tag: **`idlisseus-v0-first-cut`**. Run it without changing branches:

```bash
python3 -m idlisseus
```

Five stops through an uncertain AI landscape. A random mission and starting
stack, three lives, two rebuilds, one dev-crew or field-network favour. Reach
20 local teams and finish alive. Four route forks lead to a final unavoidable
market change. The editable deck contains 20 events shared across five domains.
Immediate costs and odds are visible; future situations stay in fog.

The initial version made safe choices and rebuilding too powerful. Iteration
added costly pushes, capacity recovery, useful route signals, vendor exit
costs, and a mission target that punishes endless deferral. Same-seed replay
holds the weather fixed while changing the initial build. The lesson is about
adaptation and tradeoffs, not a preferred AI architecture.

Validation at freeze: **40 passing tests**, 32,000 final balance simulations,
8,000 additional same-world build comparisons, and manual terminal play.
All eight starting builds have worlds in which they beat another build, but
remote/shared/human has the highest mean under the adaptive heuristic. That is
not evidence of human enjoyment or final balance. See
[the detailed playtest note](../benchmarks/IDLISSEUS_PLAYTEST.md).

For tomorrow, watch where the player pauses, what they misunderstand, whether
they spend rebuilds, and whether the ending makes them want another run. A
short loss should explain a previous decision, not feel like an arbitrary die.

## Next experiment: a separate place-based loop

The user wants to pick a point anywhere in India, encounter real local problems
grounded in public data and economics research, and find a tractable segment
for an AI stack. The next prototype must keep few controls and a tight loop,
using original, concrete reportage-style scenes without fabricated reporting.

It will live in **`fieldwork/`**, use **`python3 -m fieldwork`**, and have its own
tests and playtest note. It must not replace or import the frozen Idlisseus
mechanics. District survey estimates will be labelled by geography and year;
game cases and outcomes are simulations, not observations of selected people.

The old game, its event deck, original tests, and balance reports will remain
unchanged while the second experiment is built. Both entry points stay playable
from the same checkout. The tag preserves this README and the original brief
as well as the complete first prototype.
