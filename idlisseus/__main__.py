"""Line-oriented SSH-friendly interface. Run with python3 -m idlisseus."""
from __future__ import annotations

import argparse
from copy import copy
import json
import os
from pathlib import Path
import secrets
import shutil
import sys
import textwrap

from .engine import (COMPONENTS, DOMAINS, KITS, LABELS, PHASE_NAMES, TARGET,
                     Game, available_options, choose_route, new_game, observe,
                     preview, rebuild, rebuild_cost, resolve, transcript)
from .simulate import autoplay, benchmark


class Terminal:
    def __init__(self, plain: bool = False):
        self.tty = sys.stdin.isatty() and sys.stdout.isatty() and not plain
        self.color = self.tty and "NO_COLOR" not in os.environ and os.getenv("TERM") != "dumb"
        self.width = max(24, min(76, shutil.get_terminal_size((76, 30)).columns))

    def tint(self, text: str, code: str = "36") -> str:
        return f"\033[{code}m{text}\033[0m" if self.color else text

    def line(self, text: str = "", indent: str = "") -> None:
        if not text:
            print()
        else:
            print(textwrap.fill(str(text), self.width, initial_indent=indent,
                                subsequent_indent=indent, break_long_words=True))

    def title(self, text: str) -> None:
        print(self.tint(textwrap.fill(text, self.width), "1;36"))

    def screen(self) -> None:
        # Small terminals retain scrollback rather than clearing away options.
        if self.tty and os.getenv("TERM") != "dumb" and shutil.get_terminal_size().lines >= 32:
            print("\033[2J\033[H", end="")
        else:
            print()
        print(self.tint("-" * self.width, "2"))

    def ask(self, valid: set[str], prompt: str = "> ") -> str:
        while True:
            try:
                answer = input(prompt).strip().lower()
            except (EOFError, KeyboardInterrupt):
                raise QuitGame from None
            if answer in ("q", "quit", "exit"):
                raise QuitGame
            aliases = {"1": "a", "2": "b", "3": "c", "yes": "a", "no": "b"}
            answer = aliases.get(answer, answer)
            if answer in valid:
                return answer
            self.line("Choose " + ", ".join(k.upper() or "Enter" for k in sorted(valid)) + "; Q quits.")


class QuitGame(Exception):
    pass


def effect(helped: int, harm: int = 0) -> str:
    return f"+{helped} reach" + (f", -{harm} life" if harm == 1 else f", -{harm} lives" if harm else "")


def stakes(p: dict, game: Game | None = None) -> str:
    good = effect(p["help"], p["harm"])
    extra = []
    if p.get("heal") and (game is None or p["harm"] < game.lives):
        extra.append("lives already full" if game and game.lives == 3 and not p["harm"]
                     else f"+{p['heal']} life (max 3)")
    if p.get("gain_rebuilds"):
        extra.append("rebuilds already full" if game and game.rebuilds == 2
                     else f"+{p['gain_rebuilds']} rebuild (max 2)")
    if p["contract"] is True:
        extra.append("vendor lock: brain exit costs 2 rebuilds")
    elif p["contract"] is False and (game is None or game.contract):
        extra.append("vendor lock cleared")
    changes = {k: v for k, v in p["set_stack"].items() if game is None or game.stack[k] != v}
    if changes:
        extra.append("switch to " + ", ".join(LABELS[v] for v in changes.values()))
    if extra:
        good += "; " + "; ".join(extra)
    if p["chance"] < 1:
        good = f"{p['chance']:.0%}: {good} | otherwise {effect(p['fail_help'], p['fail_harm'])}"
    if p["consume_kit"]:
        good += "; uses your one favour"
    if game and p["chance"] == 1 and p["harm"] >= game.lives:
        good += "; ENDS YOUR RUN"
    return good


def hud(ui: Terminal, game: Game, choosing_kit: bool = False) -> None:
    ui.title(f"IDLISSEUS  /  {DOMAINS[game.domain]['name'].upper()}  /  SEED {game.seed}")
    ui.line(f"LIVES {'o ' * game.lives}{'. ' * (3 - game.lives)} | REACH {game.reach}/{TARGET} | REBUILDS {game.rebuilds}/2")
    ui.line(" / ".join(LABELS[v] for v in game.stack.values()))
    inventory = "choose a favour below" if choosing_kit else KITS[game.kit] + (": 1 favour" if game.kit_ready else ": spent")
    ui.line("PACK " + inventory + ("  |  VENDOR LOCK: exit costs 2 rebuilds" if game.contract else ""))


def map_line(game: Game) -> str:
    parts = []
    for i in range(5):
        if i < game.turn:
            parts.append(f"{i + 1}:done")
        elif i == game.turn:
            parts.append(f"[{i + 1}:YOU]")
        elif i == game.turn + 1:
            parts.append(f"{i + 1}:{PHASE_NAMES[i].split()[-1].lower()}")
        else:
            parts.append(f"{i + 1}:???")
    return " -- ".join(parts)


def show_intro(ui: Terminal, game: Game) -> None:
    ui.screen()
    hud(ui, game, choosing_kit=True)
    ui.line()
    ui.title("FIVE STOPS. ONE PROMISE.")
    ui.line(DOMAINS[game.domain]["mission"])
    ui.line()
    ui.line(f"One reach = one local team equipped to help. Finish five stops with {TARGET} reach and at least one life.")
    ui.line("Lives are your organisation's capacity to absorb failure. Sitting every crisis out will miss the mission.")
    ui.line("Pick a route, then act. Costs and odds are shown before you commit. R rebuilds one part of your stack.")
    ui.line()
    ui.line("Take one favour for the journey:")
    ui.line("[A] Dev crew       Deploy a tool or escape a vendor.")
    ui.line("[B] Field network  Extra people when the screen isn't enough.")
    ui.line("Each can be called once, at matching events. A/B + Enter; Q quits.")
    game.kit = "dev" if ui.ask({"a", "b"}) == "a" else "field"


def show_routes(ui: Terminal, game: Game) -> None:
    view = observe(game)
    if len(view["routes"]) == 1:
        choose_route(game, 0)
        return
    ui.screen()
    hud(ui, game)
    ui.line()
    ui.line(map_line(game))
    ui.line()
    ui.title(f"STOP {game.turn + 1}/5  /  {view['phase']}")
    ui.line("Two calls for help. You have time for one.")
    ui.line()
    for i, route in enumerate(view["routes"]):
        ui.line(f"[{'AB'[i]}] {route['title']}  /  up to {route['ceiling']} reach")
        ui.line(route["signal"], "    ")
    ui.line()
    if game.turn == 0:
        ui.line("Those ceilings need the right setup. Beyond these signals: fog.")
    elif game.turn == 3:
        ui.line("Ahead: the market shifts. A subsidy may last; it may not.")
    else:
        ui.line(f"{max(0, TARGET - game.reach)} more reach needed. {5 - game.turn} stops remain.")
    choose_route(game, "ab".index(ui.ask({"a", "b"})))


def show_event(ui: Terminal, game: Game) -> None:
    view = observe(game)
    ui.screen()
    hud(ui, game)
    ui.line()
    ui.title(f"{game.turn + 1}/5  /  {view['event']['title'].upper()}")
    if game.turn == 4:
        ui.line("WORLD CHANGE / Every route leads here.")
    ui.line(view["event"]["text"])
    ui.line()
    for p in view["options"]:
        ui.line(f"[{p['key'].upper()}] {p['label']}")
        ui.line(stakes(p, game), "    ")
    ui.line()
    ui.line(f"Need {max(0, TARGET - game.reach)} reach in {5 - game.turn} {'stop' if game.turn == 4 else 'stops'}. "
            + ("[R] Rebuild  " if game.rebuilds else "") + "[?] Why these odds  [Q] Quit")


def show_rebuild(ui: Terminal, game: Game) -> None:
    ui.screen()
    hud(ui, game)
    ui.line()
    ui.title("THE WORKBENCH")
    ui.line("Change one component. This costs a rebuild, not your turn.")
    original = {p["key"]: p for p in observe(game)["options"]}
    keys = {}
    for key, (component, pair) in zip("abc", COMPONENTS.items()):
        cost = rebuild_cost(game, component)
        new = next(v for v in pair if v != game.stack[component])
        ui.line()
        ui.line(f"[{key.upper()}] {LABELS[game.stack[component]]} -> {LABELS[new]} ({cost} rebuild{'s' if cost > 1 else ''})")
        if game.rebuilds < cost:
            ui.line("Not enough rebuilds.", "    ")
            continue
        candidate = copy(game)
        candidate.stack = {**game.stack, component: new}
        if component == "brain":
            candidate.contract = False
        changed = [preview(candidate, o) for o in available_options(candidate)
                   if preview(candidate, o) != original.get(o["key"])]
        if changed:
            for after in changed:
                ui.line(f"{after['key'].upper()} becomes: {stakes(after, candidate)}", "    ")
        else:
            ui.line("No advantage for this final event." if game.turn == 4 else
                    "No immediate advantage here. Future problems are still hidden.", "    ")
        keys[key] = component
    ui.line()
    ui.line("Enter returns without spending. Choose a letter to commit.")
    key = ui.ask(set(keys) | {""})
    if key:
        rebuild(game, keys[key])


def show_result(ui: Terminal, game: Game, result: dict) -> None:
    ui.screen()
    hud(ui, game)
    ui.line()
    ui.title("DELIVERED" if result["success"] else "THE PLAN BROKE HERE")
    ui.line(result["why"])
    ui.line()
    ui.line(effect(result["help"], result["harm"]).upper())
    ui.line(f"Reach {result['before']['reach']} -> {game.reach}/{TARGET}    Lives {result['before']['lives']} -> {game.lives}")
    if result.get("healed"):
        ui.line(f"Recovered {result['healed']} life.")
    if result.get("rebuilds_gained"):
        ui.line(f"Recovered {result['rebuilds_gained']} rebuild.")
    if result["kit_used"]:
        ui.line(f"The {KITS[game.kit]} favour is now spent.")
    if result["before"]["stack"] != game.stack:
        ui.line("Stack now: " + " / ".join(LABELS[v] for v in game.stack.values()))
    ui.line()
    if game.status == "playing":
        gap = max(0, TARGET - game.reach)
        ui.line(f"{gap} more reach. {5 - game.turn} {'stop' if game.turn == 4 else 'stops'} left." if gap else "Promise met. Get your organisation through the remaining stops.")
    ui.ask({""}, "Enter to continue > ")


def show_ending(ui: Terminal, game: Game, replay_menu: bool = True) -> None:
    ui.screen()
    hud(ui, game)
    ui.line()
    title = {"won": "THE PROMISE HELD.", "collapsed": "THE ORGANISATION COULDN'T TAKE ANOTHER HIT.",
             "short": "STILL STANDING. TOO FEW PEOPLE REACHED."}[game.status]
    ui.title(title)
    ui.line(f"{game.reach} {DOMAINS[game.domain]['unit']} equipped; target {TARGET}.")
    ui.line()
    for result in game.history:
        if result["type"] == "rebuild":
            ui.line(f"  Refit: {LABELS[result['old']]} -> {LABELS[result['new']]}")
        else:
            ui.line(f"{result['turn']}. {result['title']}  /  {effect(result['help'], result['harm'])}")
    choices = [h for h in game.history if h["type"] == "choice"]
    failures = [h for h in choices if not h["success"]]
    ui.line()
    if failures:
        ui.line("The turning point: " + failures[0]["why"])
    elif game.status == "short":
        ui.line("The small, safe answers added up to a missed promise.")
    else:
        ui.line("Keep the weather. Change the build. Does your plan still work?")
    ui.line()
    if replay_menu:
        ui.line("[A] New expedition  [B] Same weather, different stack  [Q] Quit")


def write_log(path: str | None, game: Game) -> None:
    if path:
        destination = Path(path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(transcript(game), indent=2) + "\n")


def parse_stack(text: str) -> dict:
    values = text.lower().replace("/", ",").split(",")
    if len(values) != 3 or any(v not in pair for v, pair in zip(values, COMPONENTS.values())):
        raise argparse.ArgumentTypeError("Use remote|local,private|open,human|judge (e.g. remote,private,human)")
    return dict(zip(COMPONENTS, values))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Idlisseus: a five-stop AI infrastructure expedition.")
    parser.add_argument("--seed", type=int, help="Replayable world seed")
    parser.add_argument("--stack", type=parse_stack, help="brain,data,guard override")
    parser.add_argument("--domain", choices=DOMAINS)
    parser.add_argument("--plain", action="store_true", help="No colors or clearing; suitable for logs and SSH")
    parser.add_argument("--demo", action="store_true", help="Watch a complete seeded run without input")
    parser.add_argument("--kit", choices=KITS, help="Skip the opening kit choice")
    parser.add_argument("--log", metavar="PATH", help="Write a JSON expedition record (also on quit)")
    parser.add_argument("--simulate", type=int, metavar="N", help="Play N seeds per build, all eight builds")
    parser.add_argument("--policy", choices=("random", "cautious", "bold", "adaptive"), default="adaptive")
    args = parser.parse_args(argv)
    if args.simulate is not None:
        if args.simulate <= 0:
            parser.error("--simulate must be positive")
        print(json.dumps(benchmark(args.simulate, args.policy, args.seed or 0), indent=2))
        return 0
    ui = Terminal(args.plain)
    game = None
    try:
        game = new_game(args.seed if args.seed is not None else secrets.randbelow(1_000_000),
                        args.stack, args.domain, args.kit or "dev")
        if args.demo:
            autoplay(game, args.policy)
            show_ending(ui, game, replay_menu=False)
            ui.line("Demo finished. Run without --demo to make the decisions yourself.")
            for h in game.history:
                if h["type"] == "choice":
                    ui.line(f"{h['title']}: {h['label']} -> {h['why']}")
            write_log(args.log, game)
            return 0
        while True:
            if not args.kit:
                show_intro(ui, game)
            while game.status == "playing":
                show_routes(ui, game)
                while True:
                    show_event(ui, game)
                    valid = {o["key"] for o in available_options(game)} | {"?"}
                    if game.rebuilds:
                        valid.add("r")
                    key = ui.ask(valid)
                    if key == "r":
                        show_rebuild(ui, game)
                    elif key == "?":
                        ui.line()
                        for p in observe(game)["options"]:
                            ui.line(f"{p['key'].upper()}: {p['why']}")
                            if p["chance"] < 1:
                                ui.line("If it fails: " + p["fail_why"])
                        ui.ask({""}, "Enter to return > ")
                    else:
                        result = resolve(game, key)
                        write_log(args.log, game)
                        show_result(ui, game, result)
                        break
            show_ending(ui, game)
            write_log(args.log, game)
            action = ui.ask({"a", "b"})
            if action == "a":
                game = new_game(secrets.randbelow(1_000_000), args.stack, args.domain, args.kit or "dev")
            else:
                ui.line("Change one part of your ORIGINAL build; replay the same five forks.")
                for key, component in zip("abc", COMPONENTS):
                    old = game.initial_stack[component]
                    new = next(v for v in COMPONENTS[component] if v != old)
                    ui.line(f"[{key.upper()}] {LABELS[old]} -> {LABELS[new]}")
                component = list(COMPONENTS)["abc".index(ui.ask({"a", "b", "c"}))]
                stack = game.initial_stack.copy()
                stack[component] = next(v for v in COMPONENTS[component] if v != stack[component])
                game = new_game(game.seed, stack, game.domain, args.kit or "dev")
    except QuitGame:
        if game is not None:
            try:
                write_log(args.log, game)
            except OSError as exc:
                print(f"Idlisseus: could not write expedition record: {exc}", file=sys.stderr)
                return 1
            ui.line(f"Camp closed. Same weather: python3 -m idlisseus --seed {game.seed}")
        return 0
    except (OSError, ValueError) as exc:
        print(f"Idlisseus: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
