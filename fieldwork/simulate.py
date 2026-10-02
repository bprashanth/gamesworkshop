"""Reproducible policy audit; production policies receive public observations only.

Run ``python3 -m fieldwork.simulate --seeds 100`` for JSON. The oracle is
explicitly privileged and measures feasibility, not a plausible player's skill.
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
from statistics import mean

from . import engine as e


def human_only(view: dict) -> str:
    return "b"


def ai_only(view: dict) -> str:
    return "a"


def greedy(view: dict) -> str:
    """Maximise this shift's deliveries, then preparation; never pay to switch."""
    return max((a for a in view["options"] if a != "r"), key=lambda a: (
        len(view["options"][a]["served"]),
        -len(view["options"][a]["expired"]),
        len(view["options"][a]["prepared"]),
        a == "a",
    ))


def planning(view: dict) -> str:
    """Two-shift forecast using ONLY observed cases and tomorrow's announcement.

    Tomorrow's arriving cases have no public deadlines, so this is a heuristic,
    not an oracle. Beyond-tomorrow closures/arrivals are never inspected.
    """
    if "tomorrow" not in view:
        return greedy(view)
    tomorrow = view["tomorrow"]
    today = view["day"]
    ranked = []
    for action, result in view["options"].items():
        processed = set(result["prepared"]) | set(result["expired"])
        remaining = [c for c in view["cases"] if c["id"] not in processed]
        counts = Counter(c["lane"] for c in remaining)
        counts.update(tomorrow["arrivals"])
        tool = ("reader" if view["tool"] == "guide" else "guide") if action == "r" else view["tool"]
        lane = e.TOOLS[tool]["lane"]
        batch = min(3, counts[lane]) if tool != "reader" or tomorrow["online"] else 0
        future_prepared = max(batch, min(1, sum(counts.values())))
        future_delivered = min(tomorrow["slots"], result["waiting_ready"] + future_prepared)
        # Saving imminent non-tool cases rewards appropriate human work even if
        # today's counter is closed. Fractional weights only break near-ties.
        saved_urgent = sum(c["id"] in result["prepared"] and c["deadline"] <= today + 1
                           for c in view["cases"])
        value = (len(result["served"]) + future_delivered
                 - 0.8 * len(result["expired"])
                 + 0.12 * result["waiting_ready"] + 0.08 * saved_urgent
                 - (0.12 if action == "r" else 0))
        ranked.append((value, action == "a", action))
    return max(ranked)[2]


POLICIES = {"human_only": human_only, "ai_only": ai_only,
            "greedy_public": greedy, "planning_public": planning}


def play(game: e.Game, policy) -> e.Game:
    while game.status == "playing":
        game, _ = e.step(game, policy(e.observe(game)))
    return game


def benchmark(seeds: int = 100, worlds=None) -> dict:
    """Compare identical worlds across tools and policies, without hidden hints."""
    if seeds < 1:
        raise ValueError("seeds must be positive")
    worlds = worlds or (("rajasthan-udaipur", "vaccination"),
                        ("tamil-nadu-chennai", "antenatal_visits"),
                        ("odisha-puri", "sanitation"),
                        ("uttar-pradesh-sitapur", "birth_registration"))
    rows = {tool: {name: [] for name in (*POLICIES, "oracle_full_world")}
            for tool in e.TOOLS}
    action_counts = {tool: {name: Counter() for name in POLICIES} for tool in e.TOOLS}
    dominance = Counter()
    witnessed_switch = None
    for place, problem in worlds:
        for seed in range(seeds):
            best = {}
            for tool in e.TOOLS:
                game = e.new_game(seed, place, problem, tool)
                score, plan = e.optimal(game)
                best[tool] = score
                rows[tool]["oracle_full_world"].append(score)
                if "r" in plan and witnessed_switch is None:
                    witnessed_switch = {"place": place, "problem": problem, "seed": seed,
                                        "tool": tool, "score": score, "actions": list(plan)}
                for name, policy in POLICIES.items():
                    final = play(game, policy)
                    rows[tool][name].append(final.score)
                    action_counts[tool][name].update(r["action"] for r in final.history)
            dominance["tie" if best["guide"] == best["reader"] else
                      "guide_better" if best["guide"] > best["reader"] else "reader_better"] += 1
    def summarize(scores):
        return {"runs": len(scores), "mean_reached": round(mean(scores), 3),
                "win_rate": round(sum(s >= e.TARGET for s in scores) / len(scores), 4),
                "min_reached": min(scores), "max_reached": max(scores),
                "distribution": dict(sorted(Counter(scores).items()))}
    return {"schema": 1, "seeds_per_world": seeds, "worlds": list(worlds),
            "target": e.TARGET, "case_count": 12, "shifts": e.DAYS,
            "policy_information": "human/AI/greedy/planning use observe only; oracle knows the entire world",
            "results": {tool: {name: summarize(scores) for name, scores in policies.items()}
                        for tool, policies in rows.items()},
            "actions": action_counts, "oracle_tool_comparison": dominance,
            "example_switch_plan_privileged": witnessed_switch}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seeds", type=int, default=100)
    args = parser.parse_args()
    print(json.dumps(benchmark(args.seeds), indent=2))


if __name__ == "__main__":
    main()
