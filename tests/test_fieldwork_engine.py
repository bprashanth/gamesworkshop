"""Meaningful contracts for Fieldwork's visible, deterministic queue puzzle."""
from copy import deepcopy
from dataclasses import replace
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

from fieldwork import engine as e
from fieldwork import simulate as s


def fixture(lanes=("voice", "forms", "field"), *, slots=2, online=True, deadline=6):
    cases = tuple(e.Case(i, lane, 0, deadline, "Fictional case") for i, lane in enumerate(lanes))
    shifts = tuple(e.Shift(slots, online, "Fictional shift") for _ in range(e.DAYS))
    return e.Game(0, "fixture", "test", cases, shifts)


class FieldworkContracts(unittest.TestCase):
    def test_tool_changes_do_not_change_world(self):
        for seed in (0, 1, 47, -17):
            a = e.new_game(seed, "place", "problem", "guide")
            b = e.new_game(seed, "place", "problem", "reader")
            self.assertEqual((a.cases, a.shifts), (b.cases, b.shifts))
            self.assertEqual(len(a.cases), 12)
            self.assertEqual(len(a.shifts), 7)

    def test_world_stable_across_python_processes(self):
        script = "from fieldwork.engine import new_game; g=new_game(3,'p','x'); print(repr((g.cases,g.shifts)))"
        first = subprocess.check_output([sys.executable, "-c", script])
        self.assertEqual(first, subprocess.check_output([sys.executable, "-c", script]))

    def test_identity_matters(self):
        a = e.new_game(1, "a", "health")
        for b in (e.new_game(2, "a", "health"), e.new_game(1, "b", "health"),
                  e.new_game(1, "a", "learning")):
            self.assertNotEqual((a.cases, a.shifts), (b.cases, b.shifts))

    def test_all_previews_match_actual_results_without_mutation(self):
        for seed in range(10):
            game = e.new_game(seed, "p", "health")
            while game.status == "playing":
                before = deepcopy(game)
                view = e.observe(game)
                for action, preview in view["options"].items():
                    _, result = e.step(game, action)
                    self.assertEqual(preview, result)
                    self.assertEqual(game, before)
                game, _ = e.step(game, s.planning(view))

    def test_step_does_not_draw_random_outcomes(self):
        game = e.new_game(1, "p", "health")
        with patch("random.Random", side_effect=AssertionError("Outcome RNG")):
            self.assertEqual(e.step(game, "a"), e.step(game, "a"))

    def test_ready_is_not_reached(self):
        game, result = e.step(fixture(("voice",) * 3, slots=0), "a")
        self.assertEqual(game.score, 0)
        self.assertEqual(result["waiting_ready"], 3)
        self.assertEqual(result["served"], [])

    def test_finish_when_all_cases_are_resolved_without_empty_turn(self):
        game, _ = e.step(fixture(("voice",)), "a")
        self.assertEqual((game.day, game.status, e.actions(game)), (1, "short", ()))
        self.assertNotIn("options", e.observe(game))
        game = fixture(("voice",) * 12)
        game.reached = (1 << 8) - 1
        game.missed = ((1 << 4) - 1) << 8
        self.assertEqual(game.status, "won")

    def test_future_arrivals_prevent_premature_finish(self):
        game = fixture(("voice", "field"))
        game.cases = (game.cases[0], replace(game.cases[1], arrives=4))
        game, _ = e.step(game, "a")
        self.assertEqual(game.status, "playing")

    def test_closed_counter_skips_doomed_cases_for_both_actions(self):
        game = fixture(("voice", "voice", "field"), slots=0)
        game.cases = (replace(game.cases[0], deadline=0), *game.cases[1:])
        for action in ("a", "b"):
            preview = e.observe(game)["options"][action]
            after, result = e.step(game, action)
            self.assertEqual(preview, result)
            self.assertEqual(result["prepared"], [1])
            self.assertEqual(result["expired"], [0])
            self.assertEqual(result["expired_unprepared"], [0])
            self.assertEqual(after.ready, 1 << 1)

    def test_expiry_distinguishes_ready_from_unprepared(self):
        game = fixture(("voice", "field", "forms"), slots=0, deadline=0)
        game.ready = 1
        _, result = e.step(game, "b")
        self.assertEqual(result["prepared"], [])
        self.assertEqual(result["expired_ready"], [0])
        self.assertEqual(result["expired_unprepared"], [1, 2])
        self.assertEqual(set(result["expired"]), set(result["expired_ready"] + result["expired_unprepared"]))

    def test_fair_generation_for_both_initial_tools(self):
        for seed in range(30):
            for tool in e.TOOLS:
                self.assertGreaterEqual(e.optimal(e.new_game(seed, "fairness", "test", tool))[0], e.TARGET)

    def test_rejected_world_retries_deterministically(self):
        good = e.new_game(11, "fairness", "test")
        bad = fixture(("field",) * 12, slots=0)
        candidates = ((bad.cases, bad.shifts), (good.cases, good.shifts))
        e._fair_world.cache_clear()
        with patch.object(e, "_candidate_world", side_effect=candidates) as candidate:
            game = e.new_game(91, "retry", "test")
            self.assertEqual(candidate.call_args_list[0].args, (91, "retry", "test", 0))
            self.assertEqual(candidate.call_args_list[1].args, (91, "retry", "test", 1))
            self.assertEqual(game.cases, good.cases)

    def test_generation_retries_are_bounded(self):
        e._fair_world.cache_clear()
        bad = fixture(("field",) * 12, slots=0)
        with patch.object(e, "_candidate_world", return_value=(bad.cases, bad.shifts)) as candidate:
            with self.assertRaisesRegex(RuntimeError, "64 attempts"):
                e.new_game(91, "impossible", "test")
            self.assertEqual(candidate.call_count, 64)

    def test_cached_world_is_immutable_and_not_resolved_twice(self):
        e._fair_world.cache_clear()
        first = e.new_game(4, "cache", "test")
        with patch.object(e, "optimal", side_effect=AssertionError("Repeated solver")):
            second = e.new_game(4, "cache", "test", "reader")
        self.assertIs(first.cases, second.cases)
        self.assertIs(first.shifts, second.shifts)
        first.history.append({"mutation": True})
        self.assertEqual(second.history, [])

    def test_attempt_zero_preserves_original_seed_identity(self):
        from hashlib import sha256
        expected_seed = int.from_bytes(sha256(b"fieldwork-v1:3:place:problem").digest()[:8], "big")
        import random
        with patch.object(e.random, "Random", wraps=random.Random) as rng:
            e._candidate_world(3, "place", "problem", 0)
            self.assertEqual(rng.call_args.args, (expected_seed,))
            e._candidate_world(3, "place", "problem", 1)
            self.assertNotEqual(rng.call_args.args, (expected_seed,))

    def test_ai_cannot_complete_physical_obstacles(self):
        for tool in e.TOOLS:
            game = replace(fixture(("field",)), tool=tool)
            self.assertEqual(e.step(game, "a")[0].score, 0)
            self.assertEqual(e.step(game, "b")[0].score, 1)

    def test_reader_requires_network_guide_does_not(self):
        game = fixture(("voice", "forms"), online=False)
        self.assertEqual(e.step(game, "a")[0].score, 1)
        game.tool = "reader"
        self.assertEqual(e.step(game, "a")[0].score, 0)
        self.assertEqual(e.step(game, "b")[0].score, 1)

    def test_move_consumes_shift_and_is_scarce(self):
        game, result = e.step(fixture(), "r")
        self.assertEqual((game.tool, game.day, game.moved), ("reader", 1, True))
        self.assertEqual(result["prepared"], [])
        self.assertNotIn("r", e.actions(game))
        with self.assertRaises(ValueError):
            e.step(game, "r")

    def test_move_still_allows_ready_cases_to_reach_service(self):
        game = fixture()
        game.ready = 1
        game, result = e.step(game, "r")
        self.assertEqual(game.score, 1)
        self.assertEqual(result["served"], [0])

    def test_delivery_happens_before_deadline_expiry(self):
        game, result = e.step(fixture(("voice",) * 3, slots=2, deadline=0), "a")
        self.assertEqual(result["served"], [0, 1])
        self.assertEqual(result["expired"], [2])
        self.assertEqual((game.score, game.ready, game.missed), (2, 0, 4))

    def test_worker_uses_public_earliest_deadline(self):
        game = fixture()
        game.cases = (replace(game.cases[0], deadline=3),
                      replace(game.cases[1], deadline=1), game.cases[2])
        view = e.observe(game)
        self.assertEqual(view["cases"][0]["id"], 1)
        self.assertEqual(view["options"]["b"]["prepared"], [1])

    def test_public_view_does_not_reveal_hidden_future(self):
        game = e.new_game(2, "p", "health")
        other = replace(game,
                        cases=tuple(replace(c, lane="field", deadline=6, caption="SECRET")
                                    if c.arrives > game.day + 1 else c for c in game.cases),
                        shifts=tuple(replace(sh, slots=99, caption="SECRET")
                                     if i > game.day + 1 else sh for i, sh in enumerate(game.shifts)))
        self.assertEqual(e.observe(game), e.observe(other))
        self.assertNotIn("SECRET", json.dumps(e.observe(other)))

    def test_mutating_public_view_does_not_mutate_game(self):
        game = fixture()
        before = deepcopy(game)
        view = e.observe(game)
        view["cases"][0]["caption"] = "changed"
        view["options"]["a"]["prepared"].append(999)
        view["tomorrow"]["slots"] = 999
        self.assertEqual(game, before)

    def test_end_states_and_invalid_controls(self):
        game = fixture()
        for action in ("", "A", "quit", "unknown"):
            with self.assertRaises(ValueError):
                e.step(game, action)
        game.day = 7
        self.assertEqual(game.status, "short")
        self.assertEqual(e.actions(game), ())
        with self.assertRaises(ValueError):
            e.step(game, "a")
        game.reached = (1 << e.TARGET) - 1
        self.assertEqual(game.status, "won")
        self.assertNotIn("options", e.observe(game))
        with self.assertRaises(ValueError):
            e.new_game(1, "p", "x", "magic")

    def test_bitsets_stay_disjoint_and_scores_monotonic(self):
        for seed in range(20):
            for policy in s.POLICIES.values():
                game = e.new_game(seed, "p", "x")
                while game.status == "playing":
                    nxt, result = e.step(game, policy(e.observe(game)))
                    self.assertGreaterEqual(nxt.score, game.score)
                    self.assertEqual(nxt.ready & nxt.reached | nxt.ready & nxt.missed | nxt.reached & nxt.missed, 0)
                    self.assertEqual(nxt.score - game.score, len(result["served"]))
                    game = nxt

    def test_oracle_plan_is_legal_and_dominates_baselines(self):
        for seed in range(10):
            game = e.new_game(seed, "p", "x")
            score, plan = e.optimal(game)
            final = game
            for action in plan:
                final, _ = e.step(final, action)
            self.assertEqual(score, final.score)
            for policy in s.POLICIES.values():
                self.assertGreaterEqual(score, s.play(game, policy).score)

    def test_public_policies_have_no_game_or_oracle_access(self):
        view = e.observe(e.new_game(3, "p", "x"))
        with patch.object(e, "optimal", side_effect=AssertionError("Privileged oracle")), \
             patch.object(e, "new_game", side_effect=AssertionError("World access")), \
             patch.object(e, "step", side_effect=AssertionError("World access")):
            for policy in s.POLICIES.values():
                self.assertIn(policy(deepcopy(view)), view["options"])

    def test_new_engine_does_not_import_old_engine(self):
        source = Path(e.__file__).read_text()
        self.assertNotIn("import idlisseus", source)
        self.assertNotIn("from idlisseus", source)

    def test_benchmark_is_serializable_and_labels_privilege(self):
        result = s.benchmark(2, (("test", "health"),))
        json.dumps(result)
        self.assertIn("oracle", result["policy_information"])
        self.assertEqual(result["results"]["guide"]["human_only"]["runs"], 2)


if __name__ == "__main__":
    unittest.main()
