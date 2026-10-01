"""Small deterministic game engine. No terminal I/O and no dependencies.

The entire world and risk rolls are fixed by the expedition seed. Observations
contain only what the player can see; simulations must use that same view.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
import random
from string import Formatter
from typing import Any


PHASES = ("capability", "scale", "shock", "collective", "market")
PHASE_NAMES = ("THE RULES", "THE CROWD", "THE BREAK", "THE COMMONS", "THE DEAL")
COMPONENTS = {
    "brain": ("remote", "local"),
    "data": ("private", "open"),
    "guard": ("human", "judge"),
}
LABELS = {
    "remote": "BIG / REMOTE", "local": "SMALL / LOCAL",
    "private": "PRIVATE", "open": "SHARED",
    "human": "HUMAN REVIEW", "judge": "AI REVIEW",
}
KITS = {"dev": "dev crew", "field": "field network"}
TARGET = 20
DOMAINS = {
    "education": {
        "name": "Education", "people": "teachers", "problem": "learning gaps",
        "place": "school", "unit": "school teams",
        "mission": "Help 20 school teams find and support children falling behind.",
    },
    "agriculture": {
        "name": "Agriculture", "people": "farmers", "problem": "crop damage",
        "place": "village", "unit": "village teams",
        "mission": "Help 20 village teams turn crop warnings into useful advice.",
    },
    "water": {
        "name": "Land / Water", "people": "water stewards", "problem": "water stress",
        "place": "watershed", "unit": "watershed teams",
        "mission": "Help 20 watershed teams spot trouble and protect their water.",
    },
    "livelihoods": {
        "name": "Livelihoods", "people": "community workers", "problem": "missing entitlements",
        "place": "district", "unit": "community teams",
        "mission": "Help 20 community teams connect people to jobs and entitlements.",
    },
    "health": {
        "name": "Health", "people": "frontline workers", "problem": "missed referrals",
        "place": "clinic", "unit": "clinic teams",
        "mission": "Help 20 clinic teams make reliable routine referrals.",
    },
}


def load_deck(path: str | Path | None = None) -> list[dict]:
    path = Path(path) if path else Path(__file__).with_name("events.json")
    deck = json.loads(path.read_text())
    validate_deck(deck)
    return deck


def validate_deck(deck: list[dict]) -> None:
    """Fail at startup rather than halfway through a user's expedition."""
    if not isinstance(deck, list):
        raise ValueError("Event deck must be a JSON list")
    ids: set[str] = set()
    for event in deck:
        if not isinstance(event, dict):
            raise ValueError("Each event must be an object")
        for key in ("id", "phase", "title", "signal", "text", "options"):
            if key not in event:
                raise ValueError(f"Event missing {key}")
        for key in ("id", "phase", "title", "signal", "text"):
            if not isinstance(event[key], str) or not event[key].strip():
                raise ValueError(f"Event {key} must be a nonempty string")
        if event["id"] in ids or event["phase"] not in PHASES:
            raise ValueError(f"Duplicate ID or invalid phase: {event['id']}")
        ids.add(event["id"])
        opts = event["options"]
        if not isinstance(opts, list) or any(not isinstance(o, dict) for o in opts):
            raise ValueError(f"{event['id']}: options must be objects in a list")
        if [o.get("key") for o in opts] not in (["a", "b"], ["a", "b", "c"]):
            raise ValueError(f"{event['id']}: expected options a, b, optionally c")
        for option in opts:
            if not isinstance(option.get("label"), str) or not option["label"].strip():
                raise ValueError("Each option needs a nonempty label")
            if option.get("require_kit") not in (None, *KITS):
                raise ValueError("Unknown kit")
            if not isinstance(option.get("consume_kit", False), bool):
                raise ValueError("consume_kit must be true or false")
            if option.get("consume_kit") and not option.get("require_kit"):
                raise ValueError("A consumed kit must be specified")
            profiles = option.get("profiles")
            if not isinstance(profiles, list) or not profiles or any(
                not isinstance(p, dict) for p in profiles
            ):
                raise ValueError("Each option needs a nonempty list of profiles")
            if profiles[-1].get("when"):
                raise ValueError("Every option needs an unconditional final profile")
            for profile in profiles:
                if not isinstance(profile.get("when", {}), dict):
                    raise ValueError("Profile conditions must be an object")
                for key, value in profile.get("when", {}).items():
                    allowed = {**COMPONENTS, "contract": (True, False), "kit": tuple(KITS)}
                    if key not in allowed or value not in allowed[key] or (
                        key == "contract" and not isinstance(value, bool)
                    ):
                        raise ValueError(f"Unknown condition {key}={value}")
                chance = profile.get("chance", 1)
                if type(chance) not in (int, float) or not 0 <= chance <= 1:
                    raise ValueError("Chance must be between 0 and 1")
                for metric in ("help", "harm", "fail_help", "fail_harm", "heal", "gain_rebuilds"):
                    n = profile.get(metric, 0)
                    if type(n) is not int or n < 0:
                        raise ValueError(f"Invalid {metric}")
                if not isinstance(profile.get("set_stack", {}), dict):
                    raise ValueError("Stack changes must be an object")
                for key, value in profile.get("set_stack", {}).items():
                    if key not in COMPONENTS or value not in COMPONENTS[key]:
                        raise ValueError("Invalid stack change")
                if "contract" in profile and not isinstance(profile["contract"], bool):
                    raise ValueError("Contract must be true or false")
                if not isinstance(profile.get("why"), str) or not profile["why"].strip() or "help" not in profile:
                    raise ValueError("Each profile needs help and why")
                if "fail_why" in profile and not isinstance(profile["fail_why"], str):
                    raise ValueError("A failure explanation must be a string")
                if chance < 1 and not profile.get("fail_why", "").strip():
                    raise ValueError("A gamble needs a failure explanation")
        # Validate domain interpolation in all user-facing strings.
        def walk(value: Any) -> None:
            if isinstance(value, str):
                for _, name, spec, conversion in Formatter().parse(value):
                    if name is not None and (
                        name not in {"people", "problem", "place", "unit"} or spec or conversion
                    ):
                        raise ValueError(f"Unknown domain placeholder: {name}")
            elif isinstance(value, list):
                for item in value:
                    walk(item)
            elif isinstance(value, dict):
                for item in value.values():
                    walk(item)
        walk(event)
    for phase in PHASES:
        if sum(e["phase"] == phase for e in deck) < 2:
            raise ValueError(f"Need at least two routes for {phase}")


@dataclass
class Game:
    seed: int
    domain: str
    stack: dict[str, str]
    deck: list[dict]
    world: list[list[str]]
    kit: str = "dev"
    kit_ready: bool = True
    lives: int = 3
    rebuilds: int = 2
    reach: int = 0
    turn: int = 0
    contract: bool = False
    selected: str | None = None
    history: list[dict] = field(default_factory=list)
    initial_stack: dict[str, str] = field(default_factory=dict)

    @property
    def status(self) -> str:
        if self.lives <= 0:
            return "collapsed"
        if self.turn >= len(PHASES):
            return "won" if self.reach >= TARGET else "short"
        return "playing"

    @property
    def event(self) -> dict | None:
        return next((e for e in self.deck if e["id"] == self.selected), None)

    def format(self, text: str) -> str:
        return text.format(**DOMAINS[self.domain])


def new_game(seed: int, stack: dict | None = None, domain: str | None = None,
             kit: str = "dev", deck: list[dict] | None = None) -> Game:
    if deck is None:
        deck = load_deck()
    else:
        validate_deck(deck)
    rng = random.Random(seed)
    # Overrides do not shift world generation: same seed really is same weather.
    assigned_domain = rng.choice(list(DOMAINS))
    assigned_stack = {k: rng.choice(v) for k, v in COMPONENTS.items()}
    world = [rng.sample([e["id"] for e in deck if e["phase"] == phase], 2)
             for phase in PHASES]
    # A market-wide change reaches both roads. You cannot route around it.
    world[-1] = world[-1][:1]
    chosen_stack = assigned_stack if stack is None else stack.copy()
    if set(chosen_stack) != set(COMPONENTS) or any(
        v not in COMPONENTS[k] for k, v in chosen_stack.items()
    ):
        raise ValueError("Stack must contain valid brain, data and guard")
    domain = assigned_domain if domain is None else domain
    if domain not in DOMAINS or kit not in KITS:
        raise ValueError("Unknown domain or kit")
    return Game(seed, domain, chosen_stack, deck, world, kit=kit,
                initial_stack=chosen_stack.copy())


def profile_for(game: Game, option: dict) -> dict:
    attrs = {**game.stack, "contract": game.contract, "kit": game.kit}
    for profile in option["profiles"]:
        if all(attrs.get(k) == v for k, v in profile.get("when", {}).items()):
            return profile
    raise ValueError("No matching profile; invalid event deck")


def available_options(game: Game) -> list[dict]:
    if game.status != "playing" or game.event is None:
        return []
    options = [o for o in game.event["options"] if not o.get("require_kit") or
               (game.kit_ready and game.kit == o["require_kit"])]

    def effects(option: dict) -> tuple:
        p = profile_for(game, option)
        return (p["help"], p.get("harm", 0), p.get("chance", 1),
                p.get("fail_help", 0), p.get("fail_harm", 1),
                p.get("heal", 0), p.get("gain_rebuilds", 0),
                p.get("contract", game.contract),
                {**game.stack, **p.get("set_stack", {})})

    # Do not offer to burn a favour for exactly the same result as free work.
    ordinary = [effects(o) for o in options if not o.get("consume_kit")]
    return [o for o in options if not o.get("consume_kit") or effects(o) not in ordinary]


def preview(game: Game, option: dict) -> dict:
    p = profile_for(game, option)
    return {
        "key": option["key"], "label": game.format(option["label"]),
        "help": p["help"], "harm": p.get("harm", 0),
        "chance": p.get("chance", 1), "fail_help": p.get("fail_help", 0),
        "fail_harm": p.get("fail_harm", 1), "why": game.format(p["why"]),
        "fail_why": game.format(p.get("fail_why", "")),
        "consume_kit": bool(option.get("consume_kit")),
        "heal": p.get("heal", 0), "gain_rebuilds": p.get("gain_rebuilds", 0),
        "contract": p.get("contract"), "set_stack": p.get("set_stack", {}).copy(),
    }


def observe(game: Game) -> dict:
    """The public surface. Never expose unvisited cards or the risk roll."""
    view = {
        "domain": DOMAINS[game.domain]["name"], "mission": DOMAINS[game.domain]["mission"],
        "stack": game.stack.copy(), "lives": game.lives, "reach": game.reach,
        "target": TARGET, "rebuilds": game.rebuilds, "turn": game.turn,
        "kit": game.kit, "kit_ready": game.kit_ready, "contract": game.contract,
        "status": game.status, "history": deepcopy(game.history),
    }
    if game.status != "playing":
        return view
    view["phase"] = PHASE_NAMES[game.turn]
    # Fog is about which events arrive, never secret costs after committing.
    if game.turn + 1 < len(PHASES):
        view["forecast"] = PHASE_NAMES[game.turn + 1]
    if game.selected:
        view["event"] = {k: game.format(game.event[k]) for k in ("id", "title", "text")}
        view["options"] = [preview(game, o) for o in available_options(game)]
    else:
        view["routes"] = [{"id": e["id"], "title": game.format(e["title"]),
                           "signal": game.format(e["signal"]),
                           "ceiling": max(p["help"] for o in e["options"]
                                          for p in o["profiles"])}
                          for eid in game.world[game.turn] for e in game.deck if e["id"] == eid]
    return view


def choose_route(game: Game, index: int) -> None:
    if (game.status != "playing" or game.selected is not None
            or index not in range(len(game.world[game.turn]))):
        raise ValueError("Choose an available current route")
    game.selected = game.world[game.turn][index]


def rebuild_cost(game: Game, component: str) -> int:
    return 2 if component == "brain" and game.contract else 1


def rebuild(game: Game, component: str) -> dict:
    if game.status != "playing" or game.selected is None:
        raise ValueError("Rebuild at an event before choosing an action")
    if component not in COMPONENTS:
        raise ValueError("Unknown component")
    cost = rebuild_cost(game, component)
    if game.rebuilds < cost:
        raise ValueError(f"Need {cost} rebuilds")
    old = game.stack[component]
    new = next(v for v in COMPONENTS[component] if v != old)
    game.stack[component] = new
    game.rebuilds -= cost
    if component == "brain":
        game.contract = False
    result = {"type": "rebuild", "turn": game.turn + 1, "component": component,
              "old": old, "new": new, "cost": cost}
    game.history.append(result)
    return result


def risk_roll(game: Game) -> float:
    # Choices, kit use, and inspecting rebuilds cannot reroll the world.
    digest = sha256(f"idlisseus-v1:{game.seed}:{game.turn}:{game.selected}".encode()).digest()
    return int.from_bytes(digest[:8], "big") / 2**64


def resolve(game: Game, key: str) -> dict:
    options = {o["key"]: o for o in available_options(game)}
    if key not in options:
        raise ValueError("That action is not available")
    option = options[key]
    p = preview(game, option)
    success = risk_roll(game) < p["chance"]
    help_delta = p["help"] if success else p["fail_help"]
    harm = p["harm"] if success else p["fail_harm"]
    before = {"lives": game.lives, "reach": game.reach, "stack": game.stack.copy(),
              "rebuilds": game.rebuilds, "contract": game.contract}
    game.reach += help_delta
    game.lives = max(0, game.lives - harm)
    if p["consume_kit"]:
        game.kit_ready = False
    if success:
        if game.lives > 0:
            game.lives = min(3, game.lives + p["heal"])
        game.rebuilds = min(2, game.rebuilds + p["gain_rebuilds"])
        game.stack.update(p["set_stack"])
        if p["contract"] is not None:
            game.contract = p["contract"]
    result = {
        "type": "choice", "turn": game.turn + 1, "event": game.selected,
        "title": game.format(game.event["title"]), "choice": key,
        "label": p["label"], "success": success, "chance": p["chance"],
        "help": help_delta, "harm": harm,
        "why": p["why"] if success else p["fail_why"],
        "before": before, "after": {"lives": game.lives, "reach": game.reach,
                                       "stack": game.stack.copy(), "rebuilds": game.rebuilds,
                                       "contract": game.contract},
        "kit_used": p["consume_kit"], "contract": game.contract,
        "healed": game.lives - max(0, before["lives"] - harm),
        "rebuilds_gained": game.rebuilds - before["rebuilds"],
    }
    game.history.append(result)
    game.turn += 1
    game.selected = None
    return result


def transcript(game: Game) -> dict:
    return {"version": 1, "seed": game.seed, "domain": game.domain,
            "initial_stack": game.initial_stack, "kit": game.kit,
            "history": game.history, "status": game.status,
            "reach": game.reach, "lives": game.lives, "rebuilds": game.rebuilds}
