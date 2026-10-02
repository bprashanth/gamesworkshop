"""Fieldwork's separate terminal entry point: python3 -m fieldwork."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import secrets
import shutil
import sys
import textwrap

from . import engine as e
from .evidence import dataset, fact, problem_choices, problems, research
from .places import geocode, match_district, parent_district_context, search_districts


class Leave(Exception):
    pass


class Terminal:
    def __init__(self, plain=False):
        self.width = max(24, min(78, shutil.get_terminal_size((78, 30)).columns))
        self.tty = sys.stdin.isatty() and sys.stdout.isatty() and not plain
        self.color = self.tty and not os.getenv("NO_COLOR") and os.getenv("TERM") != "dumb"

    def say(self, text="", indent=""):
        print(textwrap.fill(str(text), self.width, initial_indent=indent, subsequent_indent=indent))

    def title(self, text):
        wrapped = textwrap.fill(text, self.width)
        print(f"\033[1;36m{wrapped}\033[0m" if self.color else wrapped)

    def screen(self):
        if self.tty and os.getenv("TERM") != "dumb" and shutil.get_terminal_size().lines >= 32:
            print("\033[2J\033[H", end="")
        else:
            print()
        print("-" * self.width)

    def ask(self, valid=None, prompt="> "):
        while True:
            try:
                value = input(prompt).strip()
            except (EOFError, KeyboardInterrupt):
                raise Leave from None
            if value.lower() in ("q", "quit", "exit"):
                raise Leave
            if valid is None:
                if value:
                    return value
            elif value.lower() in valid:
                return value.lower()
            self.say("Choose " + ", ".join(v.upper() or "Enter" for v in sorted(valid or [])) + "; Q quits.")


def pick_place(ui: Terminal, query: str | None) -> tuple[dict, dict]:
    ui.screen()
    ui.title("FIELDWORK / A POINT IN INDIA")
    ui.say("A town, a village, a district, or latitude,longitude. Everything works offline.")
    ui.say("Try Udaipur, Rajasthan; Majuli; or 13.08,80.27. Q quits.")
    while True:
        query = query or ui.ask(prompt="Place > ")
        places = geocode(query, limit=8)
        if not places:
            ui.say("No unambiguous place in this map. Add the state, try coordinates, or name a survey district.")
            query = None
            continue
        if len(places) > 1:
            ui.say("Several places share that name. Choose yours:")
            for i, place in enumerate(places, 1):
                point = f" ({place['lat']:.3f}, {place['lon']:.3f})" if place.get("lat") is not None else " (district)"
                area = ", ".join(x for x in (place.get("district"), place.get("state")) if x)
                ui.say(f"[{i}] {place['name']}" + (f" / {area}" if area else "") + point)
            if places[0].get("matches_total", len(places)) > len(places):
                ui.say("More matches exist. Enter to narrow the place name instead.")
            key = ui.ask({str(i) for i in range(1, len(places) + 1)} | {""})
            if not key:
                query = None
                continue
            place = places[int(key) - 1]
        else:
            place = places[0]
        district = match_district(place)
        if district is None:
            parent = parent_district_context(place)
            if parent:
                district = parent["district"]
                place = {**place, "evidence_selection": "historical parent context, not a current-district estimate",
                         "parent_source_url": parent["source_url"], "parent_note": parent["note"]}
                ui.say(parent["note"])
        if district is not None:
            ui.say(f"Evidence area: {district['name']}, {district['state']} / NFHS-5, 2019-21.")
            if place.get("lat") is not None and not place.get("parent_note"):
                ui.say(f"Point {place['lat']:.5f}, {place['lon']:.5f}. Matched with approximate 2021 district boundaries; the survey uses older areas.")
            return place, district
        ui.say(f"Located: {place['name']}.")
        ui.say("This boundary does not have an exact survey match. The survey uses older districts.")
        ui.say("Name the historical survey district for this point, or press Enter to choose another place. No nearby district will be substituted automatically.")
        while True:
            try:
                context = input("Survey district > ").strip()
            except (EOFError, KeyboardInterrupt):
                raise Leave from None
            if context.lower() in ("q", "quit", "exit"):
                raise Leave
            if not context:
                query = None
                break
            candidates = search_districts(context)
            if len(candidates) != 1:
                ui.say("Use the district and state to identify one survey area.")
                continue
            district = candidates[0]
            ui.say(f"Use {district['name']}, {district['state']} as YOUR selected evidence area? [A] Yes [B] Back")
            if ui.ask({"a", "b"}) == "a":
                place = {**place, "evidence_selection": "player-selected historical context; not a verified spatial match"}
                return place, district


def show_evidence(ui: Terminal, district: dict, problem: str):
    evidence = fact(district, problem)
    ui.screen()
    ui.title("THE EVIDENCE / OUTSIDE THE GAME")
    ui.say(evidence["scope"] + " / " + evidence["period"])
    ui.say(evidence["text"])
    ui.say(evidence["full_label"])
    if evidence["flag"]:
        ui.say("Precision note: " + evidence["flag"])
    ui.say("Official historical data; provisional workbook, with documented source corrections.")
    ui.say(evidence["source_url"])
    ui.say()
    for source in research()["sources"]:
        if source["id"] in problems()[problem]["research"]:
            ui.title(source["title"])
            ui.say(source.get("location", "") + " / " + source.get("period", ""))
            ui.say(source["claim"])
            ui.say(source["scope"])
            ui.say(source["url"])
            ui.say()
    ui.say("The study motivates a mechanism. It does not measure AI effects here. Cases, queues, deadlines and tool capacities in this game are invented.")


def pick_problem(ui: Terminal, district: dict, requested: str | None) -> str:
    available = problem_choices(district)
    if requested:
        if district["indicators"].get(requested) is None:
            raise ValueError("That local estimate is suppressed; choose another problem rather than inventing a value")
        if district["indicators"][requested] >= 100:
            raise ValueError("This survey reports full coverage for that indicator; choose a documented gap instead")
        return requested
    if not available:
        raise ValueError("No documented coverage gap for the four supported segments in this survey record")
    ui.screen()
    ui.title(f"{district['name'].upper()} / {'TWO THREADS' if len(available) == 2 else 'A THREAD'} IN THE SURVEY")
    ui.say("NFHS-5, 2019-21. District estimates, not observations of this street.")
    ui.say()
    for key, problem in zip("ab", available):
        ui.title(f"[{key.upper()}] {problems()[problem]['title']}")
        value = fact(district, problem)
        ui.say(value["text"], "    ")
        if value["flag"]:
            ui.say("Small sample: " + value["flag"], "    ")
        ui.say()
    ui.say("Choose one small service segment to work on. These are entry points, not a ranking of social priorities.")
    return available["ab".index(ui.ask(set("ab"[:len(available)])))]


def board(ui: Terminal, game: e.Game, district: dict):
    view = e.observe(game)
    ui.screen()
    ui.title(f"FIELDWORK / {district['name'].upper()} / SHIFT {view['day']}/{e.DAYS}")
    ui.say(f"REACHED {game.score}/{e.TARGET}  |  READY {view['ready']}  |  MISSED {view['missed']}  |  {e.TOOLS[game.tool]['name']}")
    ui.say()
    for lane in view["lanes"]:
        deadline = f"{lane['due']} DUE TODAY" if lane["due"] else f"next deadline: shift {lane['next_due']}" if lane["next_due"] else "clear"
        ui.say(f"{lane['label']:<18} {lane['count']} waiting   {deadline}")
    current = view["today"]
    ui.say(f"TODAY: {current['slots']} service places; {'connected' if current['online'] else 'NO CONNECTION'}.")
    if "tomorrow" in view:
        tomorrow = view["tomorrow"]
        short = {"voice": "explanations", "forms": "records", "field": "visits"}
        arrivals = ", ".join(f"{n} {short[lane]}" for lane, n in tomorrow["arrivals"].items() if n)
        ui.say(f"NEXT: {tomorrow['slots']} service places; {'connected' if tomorrow['online'] else 'NO CONNECTION'}." + (f" Arriving: {arrivals}." if arrivals else ""))
    ui.say()


def pick_tool(ui: Terminal, game: e.Game, district: dict) -> str:
    board(ui, game, district)
    evidence = fact(district, game.problem)
    ui.say(f"DISTRICT EVIDENCE / {evidence['text']} / NFHS-5 2019-21")
    if evidence["flag"]:
        ui.say("Estimate note: " + evidence["flag"])
    ui.say(problems()[game.problem]["opening"])
    ui.say()
    ui.title("WHERE WILL YOU PUT THE AI?")
    for key, tool in zip("ab", e.TOOLS.values()):
        ui.say(f"[{key.upper()}] {tool['name']} / {tool['description']}")
        ui.say(tool["stack"], "    ")
    ui.say("A worker clears one case of any kind. Service places are separate: a prepared file is not a completed visit. Moving AI uses one shift, once.")
    ui.say("Real district evidence. Fictional cases and service conditions. [E] Sources")
    while True:
        key = ui.ask({"a", "b", "e"})
        if key != "e":
            return "guide" if key == "a" else "reader"
        show_evidence(ui, district, game.problem)
        ui.say("Choose your AI: [A] Pocket guide  [B] Records desk")


def action_summary(result: dict) -> str:
    return (f"{len(result['prepared'])} prepared -> {len(result['served'])} reached; "
            f"{result['waiting_ready']} ready" +
            (f"; {len(result['expired'])} MISS THE DEADLINE" if result["expired"] else ""))


def show_shift(ui: Terminal, game: e.Game, district: dict):
    board(ui, game, district)
    view = e.observe(game)
    if not view["today"]["slots"] or not view["today"]["online"]:
        ui.say(view["today"]["caption"])
    if view["cases"]:
        case = view["cases"][0]
        ui.say(f"Case {case['id'] + 1}: {case['caption']} Deadline: shift {case['deadline']}.")
    ui.say()
    for action, result in view["options"].items():
        label = e.TOOLS[game.tool]["name"] if action == "a" else "Send the worker" if action == "b" else "Move the AI (once)"
        if action == "b" and result["prepared"]:
            label += f" to case {result['prepared'][0] + 1}"
        ui.say(f"[{action.upper()}] {label}")
        ui.say(action_summary(result), "    ")
        if action == "a" and game.tool == "reader" and not view["today"]["online"]:
            ui.say("Remote model unavailable. Ready cases can still reach the service.", "    ")
    ui.say("Choose one shift's work. [E] Evidence  [Q] Quit")


def show_result(ui: Terminal, game: e.Game, result: dict):
    ui.say()
    ui.title(f"SHIFT {result['day']} / WHAT CHANGED")
    ui.say(result["reason"])
    ui.say(action_summary(result))
    if result["waiting_ready"] and not result["slots"]:
        ui.say("The papers are ready. The service was closed. Nobody can use those papers until it opens.")
    elif result["served"]:
        ui.say(f"{len(result['served'])} case(s) made it beyond the paperwork. Total reached: {game.score}/{e.TARGET}.")
    if result["expired"]:
        if result.get("expired_ready"):
            ui.say(f"{len(result['expired_ready'])} prepared case(s) missed a service place before the deadline.")
        if result.get("expired_unprepared"):
            ui.say(f"{len(result['expired_unprepared'])} case(s) were not ready before their deadline.")
        ui.say("Missed cases leave this window; they are not counted as helped.")


def ending(ui: Terminal, game: e.Game, district: dict, replay=True):
    ui.screen()
    ui.title("THE SERVICE WAS REACHED." if game.status == "won" else "THE WEEK RAN OUT FIRST.")
    ui.say(f"{game.score} of 12 {problems()[game.problem]['outcome']}. Goal: {e.TARGET}.")
    prepared = sum(len(h["prepared"]) for h in game.history)
    ui.say(f"{prepared} cases were prepared. {prepared - game.score} of those still missed the service.")
    ui.say()
    for lane in e.LANES:
        missed = sum(c.lane == lane and not game.reached & (1 << c.id) for c in game.cases)
        if missed:
            ui.say(f"{e.LANE_LABELS[lane]}: {missed} case(s) did not get through.")
    ui.say()
    ui.say(problems()[game.problem]["limit"])
    ui.say("The district survey figure has not changed. This was a simulated service week.")
    ui.say(f"Same week: --place '{district['name']}, {district['state']}' --problem {game.problem} --seed {game.seed}")
    if replay:
        ui.say("[A] Another place  [B] Same week, other AI desk  [E] Evidence  [Q] Quit")


def write_log(path: str | None, game: e.Game | None, district: dict | None, place: dict | None):
    if path and game:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps({**e.transcript(game), "place": place,
                                      "evidence": fact(district, game.problem)}, indent=2) + "\n")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Fieldwork: an offline India place puzzle. Original Idlisseus stays separate.")
    parser.add_argument("--place", help="Place name, district, latitude,longitude, or a coordinate-bearing map link")
    parser.add_argument("--problem", choices=tuple(problems()))
    parser.add_argument("--tool", choices=tuple(e.TOOLS))
    parser.add_argument("--seed", type=int)
    parser.add_argument("--plain", action="store_true")
    parser.add_argument("--demo", action="store_true", help="Play one week with the public-forecast policy")
    parser.add_argument("--evidence", action="store_true", help="Read the sources for a place/problem")
    parser.add_argument("--log", metavar="PATH")
    parser.add_argument("--simulate", type=int, metavar="N", help="Audit N seeds per sample district/problem")
    args = parser.parse_args(argv)
    if args.simulate is not None:
        if args.simulate < 1:
            parser.error("--simulate must be positive")
        from .simulate import benchmark
        print(json.dumps(benchmark(args.simulate), indent=2))
        return 0
    ui = Terminal(args.plain)
    game = district = place = None
    try:
        while True:
            place, district = pick_place(ui, args.place)
            problem = args.problem or (problem_choices(district)[0] if args.demo or args.evidence else None)
            problem = pick_problem(ui, district, problem)
            if args.evidence:
                show_evidence(ui, district, problem)
                return 0
            seed = args.seed if args.seed is not None else secrets.randbelow(1_000_000)
            game = e.new_game(seed, district["id"], problem, args.tool or "guide")
            if not args.tool and not args.demo:
                game.tool = game.initial_tool = pick_tool(ui, game, district)
            else:
                evidence = fact(district, problem)
                ui.say(evidence["text"] + " / NFHS-5 2019-21")
                if evidence["flag"]:
                    ui.say("Estimate note: " + evidence["flag"])
                ui.say(problems()[problem]["opening"])
                ui.say("Real district evidence. Fictional cases, queues and AI capabilities.")
            ui.say(f"Seven shifts. Twelve cases. Get {e.TARGET} to the service. A/B acts; R moves the AI once.")
            if args.demo:
                from .simulate import planning
                while game.status == "playing":
                    show_shift(ui, game, district)
                    action = planning(e.observe(game))
                    ui.say(f"DEMO chooses {action.upper()}")
                    game, result = e.step(game, action)
                    show_result(ui, game, result)
                ending(ui, game, district, replay=False)
                write_log(args.log, game, district, place)
                return 0
            while True:
                while game.status == "playing":
                    show_shift(ui, game, district)
                    action = ui.ask(set(e.actions(game)) | {"e"})
                    if action == "e":
                        show_evidence(ui, district, problem)
                        ui.ask({""}, "Enter to return > ")
                        continue
                    game, result = e.step(game, action)
                    write_log(args.log, game, district, place)
                    show_result(ui, game, result)
                    ui.ask({""}, "Enter to continue > ")
                ending(ui, game, district)
                write_log(args.log, game, district, place)
                choice = ui.ask({"a", "b", "e"})
                if choice == "e":
                    show_evidence(ui, district, problem)
                    ui.ask({""}, "Enter to return > ")
                    continue
                if choice == "a":
                    args.place = None
                    break
                tool = "reader" if game.initial_tool == "guide" else "guide"
                game = e.new_game(game.seed, district["id"], problem, tool)
    except Leave:
        try:
            write_log(args.log, game, district, place)
        except OSError as exc:
            print(f"Fieldwork: could not write the record: {exc}", file=sys.stderr)
            return 1
        ui.say("Field notes closed. Both games remain available.")
        return 0
    except (OSError, ValueError) as exc:
        print(f"Fieldwork: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
