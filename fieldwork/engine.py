"""Deterministic seven-shift queue puzzle, independent of Idlisseus.

Public statistics choose a problem to examine, not its presumed cause. Every
case, arrival, deadline and capacity here is a labelled game assumption.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from functools import lru_cache
from hashlib import sha256
import random


DAYS = 7
TARGET = 8
LANES = ("voice", "forms", "field")
LANE_LABELS = {"voice": "An explanation", "forms": "A checked record", "field": "A field visit"}
TOOLS = {
    "guide": {"name": "Pocket guide", "lane": "voice", "batch": 3,
              "stack": "Local speech model + checked local guide",
              "description": "Clear up to 3 explanation cases. Works offline."},
    "reader": {"name": "Records desk", "lane": "forms", "batch": 3,
               "stack": "Remote document model + human-approved checklist",
               "description": "Clear up to 3 record cases. Needs a connection."},
}


@dataclass(frozen=True)
class Case:
    id: int
    lane: str
    arrives: int
    deadline: int
    caption: str


@dataclass(frozen=True)
class Shift:
    slots: int
    online: bool
    caption: str


@dataclass
class Game:
    seed: int
    place_id: str
    problem: str
    cases: tuple[Case, ...]
    shifts: tuple[Shift, ...]
    tool: str = "guide"
    day: int = 0
    moved: bool = False
    # Bitsets retain enough state for exact, small puzzle search.
    ready: int = 0
    reached: int = 0
    missed: int = 0
    history: list[dict] = field(default_factory=list)
    initial_tool: str = "guide"

    @property
    def score(self) -> int:
        return self.reached.bit_count()

    @property
    def status(self) -> str:
        if self.day < DAYS and (self.reached | self.missed).bit_count() < len(self.cases):
            return "playing"
        return "won" if self.score >= TARGET else "short"


CASE_CAPTIONS = {
    "voice": (
        "The notice arrived. Its meaning did not.",
        "A voice message would travel further than another printed sheet.",
        "The date is on the wall. Nobody has explained the next step.",
        "The family has made the journey once, on the wrong day.",
    ),
    "forms": (
        "The paper has travelled between desks. The case has not.",
        "Two spellings of one name have become two different people.",
        "One unchecked box stands between the file and the counter.",
        "The record is there. Finding the right entry takes the morning.",
    ),
    "field": (
        "The instructions are clear. Someone still has to make the visit.",
        "The file is ready. The journey is not.",
        "This case needs a person at the door, not another message.",
        "No answer on a screen can complete the last stretch.",
    ),
}


def new_game(seed: int, place_id: str, problem: str, tool: str = "guide") -> Game:
    if tool not in TOOLS:
        raise ValueError("Choose guide or reader")
    cases, shifts = _fair_world(seed, place_id, problem)
    return Game(seed, place_id, problem, cases, shifts, tool=tool, initial_tool=tool)


@lru_cache(maxsize=1024)
def _fair_world(seed: int, place_id: str, problem: str) -> tuple[tuple[Case, ...], tuple[Shift, ...]]:
    """Cache immutable worlds, accepting only puzzles winnable with either kit.

    The full-world solver is a generation check, never a player hint. Rejecting
    impossible worlds does not reveal any future case or event to the player.
    """
    for attempt in range(64):
        cases, shifts = _candidate_world(seed, place_id, problem, attempt)
        if all(optimal(Game(seed, place_id, problem, cases, shifts, tool=tool,
                            initial_tool=tool))[0] >= TARGET for tool in TOOLS):
            return cases, shifts
    raise RuntimeError("Could not generate a fair puzzle after 64 attempts")


def _candidate_world(seed: int, place_id: str, problem: str, attempt: int = 0
                     ) -> tuple[tuple[Case, ...], tuple[Shift, ...]]:
    # Stable across Python processes, tool choices, and alternative play styles.
    identity = f"fieldwork-v1:{seed}:{place_id}:{problem}"
    if attempt:
        identity += f":retry:{attempt}"
    rng = random.Random(int.from_bytes(sha256(identity.encode()).digest()[:8], "big"))
    mix = rng.choice(((6, 3, 3), (3, 6, 3), (4, 3, 5), (3, 4, 5)))
    lanes = [lane for lane, count in zip(LANES, mix) for _ in range(count)]
    rng.shuffle(lanes)
    arrivals = [0] * 5 + [2] * 4 + [4] * 3
    cases = tuple(Case(i, lane, arrival, min(6, arrival + rng.choice((2, 3, 4))),
                       rng.choice(CASE_CAPTIONS[lane]))
                  for i, (lane, arrival) in enumerate(zip(lanes, arrivals)))
    closure = rng.choice((2, 3, 4))
    outage = rng.choice((1, 2, 3, 4, 5))
    shifts = []
    for day in range(DAYS):
        slots = 0 if day == closure else rng.choice((2, 2, 3))
        online = day != outage
        caption = ("The service is closed today. Prepared files will have to wait." if not slots else
                   "The network has gone. The service is still open." if not online else
                   "The counter opens. There are fewer places than people waiting.")
        shifts.append(Shift(slots, online, caption))
    return cases, tuple(shifts)


def active(game: Game, lane: str | None = None) -> list[Case]:
    done = game.ready | game.reached | game.missed
    return sorted((c for c in game.cases if c.arrives <= game.day and not done & (1 << c.id)
                   and (lane is None or c.lane == lane)),
                  key=lambda c: (c.deadline, c.id))


def actions(game: Game) -> tuple[str, ...]:
    if game.status != "playing":
        return ()
    return ("a", "b") if game.moved else ("a", "b", "r")


def step(game: Game, action: str) -> tuple[Game, dict]:
    """One deterministic shift. Prepare, deliver within capacity, then expire.

    No output randomness. The exact result is available before committing.
    A ready file is explicitly not counted as a service reached.
    """
    if action not in actions(game):
        raise ValueError("That action is not available")
    nxt = replace(game, history=game.history.copy())
    shift = game.shifts[game.day]
    # Do not spend work on a case whose last service day is already closed.
    # This uses today's visible closure only, never hidden future capacity.
    viable = [c for c in active(game) if shift.slots or c.deadline > game.day]
    prepared: list[Case] = []
    reason = ""
    if action == "a":
        tool = TOOLS[game.tool]
        if game.tool == "reader" and not shift.online:
            reason = "The remote records model cannot run without a connection."
        else:
            prepared = [c for c in viable if c.lane == tool["lane"]][:tool["batch"]]
            reason = (f"{tool['name']} clears {len(prepared)} {tool['lane']} case(s)." if prepared else
                      f"No waiting case needs the {tool['name'].lower()} right now.")
    elif action == "b":
        # The earliest still-viable deadline is shown in the exact preview.
        prepared = viable[:1]
        reason = (f"The worker resolves case {prepared[0].id + 1} in person." if prepared else
                  "No case needs preparation. The remaining work is at the service counter.")
    else:
        nxt.tool = "reader" if game.tool == "guide" else "guide"
        nxt.moved = True
        reason = f"Moved the AI to the {TOOLS[nxt.tool]['name'].lower()}. No new cases prepared this shift."
    for case in prepared:
        nxt.ready |= 1 << case.id
    ready_cases = sorted((c for c in game.cases if nxt.ready & (1 << c.id)),
                         key=lambda c: (c.deadline, c.id))
    served = ready_cases[:shift.slots]
    for case in served:
        nxt.ready &= ~(1 << case.id)
        nxt.reached |= 1 << case.id
    expired = [c for c in game.cases if c.deadline == game.day
               and not (nxt.reached | nxt.missed) & (1 << c.id)]
    expired_ready = [c.id for c in expired if nxt.ready & (1 << c.id)]
    expired_unprepared = [c.id for c in expired if not nxt.ready & (1 << c.id)]
    for case in expired:
        nxt.ready &= ~(1 << case.id)
        nxt.missed |= 1 << case.id
    result = {
        "day": game.day + 1, "action": action, "tool": game.tool,
        "prepared": [c.id for c in prepared], "served": [c.id for c in served],
        "expired": [c.id for c in expired], "waiting_ready": nxt.ready.bit_count(),
        "expired_ready": expired_ready, "expired_unprepared": expired_unprepared,
        "score_before": game.score, "score_after": nxt.score,
        "reason": reason, "slots": shift.slots, "online": shift.online,
    }
    nxt.day += 1
    nxt.history.append(result)
    return nxt, result


def observe(game: Game) -> dict:
    view = {"day": game.day + 1, "days": DAYS, "score": game.score, "target": TARGET,
            "status": game.status, "tool": game.tool, "can_move": not game.moved,
            "ready": game.ready.bit_count(), "missed": game.missed.bit_count()}
    if game.status != "playing":
        return view
    view["lanes"] = [{"id": lane, "label": LANE_LABELS[lane], "count": len(active(game, lane)),
                      "due": sum(c.deadline == game.day for c in active(game, lane)),
                      "next_due": min((c.deadline + 1 for c in active(game, lane)), default=None)}
                     for lane in LANES]
    view["cases"] = [{"id": c.id, "lane": c.lane, "deadline": c.deadline + 1,
                       "caption": c.caption} for c in active(game)]
    current = game.shifts[game.day]
    view["today"] = {"slots": current.slots, "online": current.online, "caption": current.caption}
    if game.day + 1 < DAYS:
        tomorrow = game.shifts[game.day + 1]
        view["tomorrow"] = {"slots": tomorrow.slots, "online": tomorrow.online,
                            "arrivals": {lane: sum(c.arrives == game.day + 1 and c.lane == lane
                                                   for c in game.cases) for lane in LANES}}
    view["options"] = {a: step(game, a)[1] for a in actions(game)}
    return view


def optimal(game: Game) -> tuple[int, tuple[str, ...]]:
    """Full-world oracle for testing feasibility ONLY. Never an in-game hint."""
    @lru_cache(None)
    def solve(day: int, tool: str, moved: bool, ready: int, reached: int,
              missed: int) -> tuple[int, tuple[str, ...]]:
        current = replace(game, day=day, tool=tool, moved=moved, ready=ready,
                          reached=reached, missed=missed, history=[])
        if current.status != "playing":
            return current.score, ()
        results = []
        for action in actions(current):
            nxt, _ = step(current, action)
            score, plan = solve(nxt.day, nxt.tool, nxt.moved, nxt.ready, nxt.reached, nxt.missed)
            results.append((score, (action, *plan)))
        return max(results, key=lambda r: r[0])
    return solve(game.day, game.tool, game.moved, game.ready, game.reached, game.missed)


def transcript(game: Game) -> dict:
    return {"version": 1, "seed": game.seed, "place_id": game.place_id,
            "problem": game.problem, "initial_tool": game.initial_tool,
            "score": game.score, "status": game.status, "history": game.history}
