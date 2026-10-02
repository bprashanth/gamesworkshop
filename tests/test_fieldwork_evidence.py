"""A simulated queue must not silently become an empirical local claim."""
from copy import deepcopy
import unittest

from fieldwork import engine
from fieldwork.evidence import dataset, fact, problem_choices, problems, research


class EvidenceTests(unittest.TestCase):
    def test_every_district_has_real_unsuppressed_gaps_to_explore(self):
        for district in dataset()["districts"]:
            choices = problem_choices(district)
            self.assertGreaterEqual(len(choices), 1, district["name"])
            for key in choices:
                self.assertIsNotNone(district["indicators"][key])
                self.assertLess(district["indicators"][key], 100)

    def test_full_coverage_does_not_displace_a_flagged_but_real_gap(self):
        district = next(r for r in dataset()["districts"] if r["id"] == "madhya-pradesh-jabalpur")
        self.assertEqual(district["indicators"]["birth_registration"], 100)
        self.assertNotIn("birth_registration", problem_choices(district))
        self.assertIn("antenatal_visits", problem_choices(district))
        self.assertIn("25", fact(district, "antenatal_visits")["flag"])

    def test_scene_references_resolve_to_scoped_research(self):
        sources = {s["id"]: s for s in research()["sources"]}
        for problem in problems().values():
            for reference in problem["research"]:
                source = sources[reference]
                for field in ("url", "claim", "scope", "location", "period"):
                    self.assertTrue(source[field])

    def test_play_does_not_change_the_district_indicator(self):
        district = next(r for r in dataset()["districts"] if r["id"] == "rajasthan-udaipur")
        before = deepcopy(district)
        game = engine.new_game(7, district["id"], "vaccination")
        while game.status == "playing":
            game, _ = engine.step(game, "a")
        self.assertEqual(district, before)
        evidence = fact(district, "vaccination")
        self.assertIn("2019", evidence["period"])
        self.assertIn("district", evidence["scope"])


if __name__ == "__main__":
    unittest.main()
