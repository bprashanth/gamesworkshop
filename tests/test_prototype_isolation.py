"""The user's frozen prototype is a deliverable, not disposable scaffolding."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]


class IsolationTests(unittest.TestCase):
    def test_first_loop_is_byte_identical_to_frozen_tag(self):
        manifest = json.loads((ROOT / "chronology/idlisseus-v0-sha256.json").read_text())
        for name, expected in manifest["files"].items():
            with self.subTest(file=name):
                self.assertEqual(hashlib.sha256((ROOT / name).read_bytes()).hexdigest(), expected)

    def test_launcher_enters_both_games_and_returns_to_menu(self):
        result = subprocess.run([sys.executable, "play.py"], cwd=ROOT,
                                input="1\nq\n2\nq\nq\n", capture_output=True,
                                text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("FIVE STOPS", result.stdout)
        self.assertIn("A POINT IN INDIA", result.stdout)
        self.assertEqual(result.stdout.count("TWO FIELD TESTS"), 3)


if __name__ == "__main__":
    unittest.main()
