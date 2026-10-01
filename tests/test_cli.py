"""Exercise the real terminal entry point using only the Python stdlib."""
from copy import deepcopy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from idlisseus import engine as e


ROOT = Path(__file__).resolve().parents[1]


def run_cli(*args, commands="", columns=76):
    env = {**os.environ, "TERM": "dumb", "COLUMNS": str(columns), "LINES": "24"}
    return subprocess.run(
        [sys.executable, "-m", "idlisseus", *args], input=commands,
        capture_output=True, text=True, cwd=ROOT, env=env, timeout=20,
    )


def scripted_run(game, with_rebuild=False):
    """Drive menu commands with public observations, retaining expected effects."""
    commands = []
    while game.status == "playing":
        view = e.observe(game)
        if len(view["routes"]) > 1:
            commands.append("a")
        e.choose_route(game, 0)
        if with_rebuild and game.turn == 0:
            commands.extend(["r", "b"])
            e.rebuild(game, "data")
        # Pick dependable options so we exercise all five stops. This policy
        # uses exactly the consequences visible on the current screen.
        options = e.observe(game)["options"]
        safe = [o for o in options if o["chance"] == 1 and o["harm"] == 0]
        selected = max(safe or options, key=lambda o: o["help"])
        commands.extend([selected["key"], ""])
        e.resolve(game, selected["key"])
    return commands


class CliSmokeTests(unittest.TestCase):
    def test_help_and_bad_arguments(self):
        help_result = run_cli("--help")
        self.assertEqual(help_result.returncode, 0, help_result.stderr)
        self.assertIn("--seed", help_result.stdout)
        for args in (("--simulate", "-1"), ("--stack", "remote,unknown,human")):
            result = run_cli(*args)
            with self.subTest(args=args):
                self.assertEqual(result.returncode, 2)
                self.assertIn("error:", result.stderr)
                self.assertNotIn("Traceback", result.stderr)

    def test_plain_demo_finishes_without_reading_input_and_writes_valid_log(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "nested" / "run.json"
            result = run_cli("--demo", "--plain", "--seed", "19", "--log", str(path))
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn("\x1b", result.stdout)
            self.assertIn("Demo finished", result.stdout)
            data = json.loads(path.read_text())
            self.assertEqual(data["seed"], 19)
            self.assertIn(data["status"], ("won", "short", "collapsed"))
            choices = [h for h in data["history"] if h["type"] == "choice"]
            self.assertTrue(choices)
            for choice in choices:
                self.assertEqual(choice["after"]["reach"] - choice["before"]["reach"], choice["help"])
                expected_lives = min(3, max(0, choice["before"]["lives"] - choice["harm"]))
                expected_lives += choice.get("healed", 0)
                self.assertEqual(choice["after"]["lives"], expected_lives)
            self.assertEqual(data["reach"], choices[-1]["after"]["reach"])
            self.assertEqual(data["lives"], choices[-1]["after"]["lives"])

    def test_eof_and_quit_exit_cleanly_and_save_partial_run(self):
        for commands in ("", "q\n"):
            with self.subTest(commands=commands), tempfile.TemporaryDirectory() as folder:
                path = Path(folder) / "partial.json"
                result = run_cli("--plain", "--seed", "9", "--log", str(path), commands=commands)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertNotIn("Traceback", result.stderr)
                self.assertIn("Camp closed", result.stdout)
                data = json.loads(path.read_text())
                self.assertEqual(data["status"], "playing")
                self.assertEqual(data["history"], [])

    def test_small_terminal_wraps_game_output(self):
        result = run_cli("--demo", "--plain", "--seed", "7", columns=32)
        self.assertEqual(result.returncode, 0, result.stderr)
        too_wide = [line for line in result.stdout.splitlines() if len(line) > 32]
        self.assertEqual(too_wide, [], "Game output should remain readable in a narrow terminal")

    def test_unwritable_log_on_quit_reports_error_without_traceback(self):
        with tempfile.TemporaryDirectory() as folder:
            result = run_cli("--plain", "--log", folder, commands="q\n")
            self.assertEqual(result.returncode, 1)
            self.assertIn("could not write expedition record", result.stderr)
            self.assertNotIn("Traceback", result.stderr)

    def test_complete_run_rebuild_and_same_weather_replay_match_logged_effects(self):
        initial_stack = {"brain": "local", "data": "private", "guard": "human"}
        first = e.new_game(19, stack=initial_stack, domain="health", kit="dev")
        commands = scripted_run(first, with_rebuild=True)
        self.assertEqual(first.turn, 5)
        # B replays this weather; A flips the ORIGINAL brain component.
        commands.extend(["b", "a"])
        replay_stack = {**initial_stack, "brain": "remote"}
        second = e.new_game(19, stack=replay_stack, domain="health", kit="dev")
        self.assertEqual(first.world, second.world)
        commands.extend(scripted_run(second))
        commands.append("q")
        expected = deepcopy(e.transcript(second))
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "replay.json"
            result = run_cli(
                "--plain", "--seed", "19", "--stack", "local,private,human",
                "--domain", "health", "--kit", "dev", "--log", str(path),
                commands="\n".join(commands) + "\n",
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertIn("THE WORKBENCH", result.stdout)
            self.assertIn("ORIGINAL build", result.stdout)
            self.assertEqual(json.loads(path.read_text()), expected)


if __name__ == "__main__":
    unittest.main()
