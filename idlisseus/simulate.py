"""Seeded, non-clairvoyant policies for balance checks, not a proof of fun."""
from __future__ import annotations

from collections import Counter
from copy import copy
from itertools import product
import random

from .engine import (COMPONENTS, Game, TARGET, available_options, choose_route,
                     load_deck, new_game, observe, preview, rebuild, rebuild_cost,
                     resolve)


def value(game: Game, p: dict, policy: str = "adaptive") -> float:
    remaining = max(0, TARGET - game.reach)
    # Capping utility at the goal makes closing out safely a real decision.
    good = min(remaining, p["help"])
    bad = min(remaining, p["fail_help"])
    risk = 0.9 if game.lives > 1 else 3.5
    if policy == "cautious":
        risk = 12
    elif policy == "bold":
        risk = 0.05
    utility = p["chance"] * (good - risk * p["harm"])
    utility += (1 - p["chance"]) * (bad - risk * p["fail_harm"])
    if p["harm"] >= game.lives:
        utility -= p["chance"] * 10
    if p["fail_harm"] >= game.lives:
        utility -= (1 - p["chance"]) * 10
    if p["consume_kit"] and game.turn < 4:
        utility -= 0.65
    if p["contract"] is True:
        utility -= 0.35
    utility += min(3 - game.lives + p["harm"], p.get("heal", 0)) * risk * p["chance"]
    if game.turn < 4:
        utility += min(2 - game.rebuilds, p.get("gain_rebuilds", 0)) * 0.8 * p["chance"]
    return utility


def choose_action(game: Game, policy: str = "adaptive", rng: random.Random | None = None) -> tuple[str | None, str]:
    """Evaluate only revealed choices and optional single-component refits.

    The shallow candidate copy is read-only: no world, die roll or hidden event
    is examined, and no simulated mutation touches the real game.
    """
    view = observe(game)
    if policy == "random":
        return None, (rng or random.Random()).choice(view["options"])["key"]
    candidates = [(value(game, p, policy), None, p["key"]) for p in view["options"]]
    if policy == "adaptive":
        for component, pair in COMPONENTS.items():
            cost = rebuild_cost(game, component)
            if cost > game.rebuilds:
                continue
            candidate = copy(game)
            candidate.stack = game.stack.copy()
            candidate.stack[component] = next(v for v in pair if v != game.stack[component])
            if component == "brain":
                candidate.contract = False
            reserve_cost = (0.8 if game.turn < 4 else 0.02) * cost
            for option in available_options(candidate):
                p = preview(candidate, option)
                candidates.append((value(candidate, p, policy) - reserve_cost, component, p["key"]))
    _, component, key = max(candidates, key=lambda c: c[0])
    return component, key


def autoplay(game: Game, policy: str = "adaptive") -> Game:
    route_rng = random.Random(game.seed + 9173)
    action_rng = random.Random(game.seed + 3121)
    while game.status == "playing":
        # Identical random route choices for every build. No reading unrevealed
        # event profiles or future cards to make the benchmark look clever.
        choose_route(game, route_rng.randrange(len(observe(game)["routes"])))
        component, key = choose_action(game, policy, action_rng)
        if component:
            rebuild(game, component)
        resolve(game, key)
    return game


def benchmark(count: int = 500, policy: str = "adaptive", start: int = 0) -> dict:
    deck = load_deck()
    rows = []
    events: dict[str, Counter] = {}
    for values in product(*COMPONENTS.values()):
        stack = dict(zip(COMPONENTS, values))
        tally: Counter = Counter()
        for seed in range(start, start + count):
            game = autoplay(new_game(seed, stack=stack, kit="dev" if seed % 2 else "field", deck=deck), policy)
            tally[game.status] += 1
            tally["reach"] += game.reach
            tally["rebuilds_used"] += sum(h["cost"] for h in game.history if h["type"] == "rebuild")
            tally["kit_used"] += not game.kit_ready
            for event in game.history:
                if event["type"] == "choice":
                    events.setdefault(event["event"], Counter())[event["choice"]] += 1
        rows.append({"stack": "/".join(values), "runs": count,
                     "win_pct": round(100 * tally["won"] / count, 1),
                     "short_pct": round(100 * tally["short"] / count, 1),
                     "collapse_pct": round(100 * tally["collapsed"] / count, 1),
                     "mean_reach": round(tally["reach"] / count, 2),
                     "mean_rebuilds": round(tally["rebuilds_used"] / count, 2),
                     "kit_used_pct": round(100 * tally["kit_used"] / count, 1)})
    return {"policy": policy, "seeds_per_build": count, "start_seed": start,
            "builds": rows, "event_choices": events}
