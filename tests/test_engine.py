"""Gameplay contracts: fair forecasts, reproducible worlds, scarce resources.

Run with: python3 -m unittest discover -s tests -v
"""
from copy import deepcopy
from itertools import product
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from idlisseus import engine as e


def small_deck():
    """Two simple routes per phase, with one optional single-use tool."""
    return [
        {
            "id": f"{phase}_{route}", "phase": phase,
            "title": f"{phase} at {{place}}", "signal": "News for {people}",
            "text": "Help {unit} address {problem} in {place}.",
            "options": [
                {"key": "a", "label": "Help {people}", "profiles": [
                    {"help": 3, "why": "Checked help for {unit}."}
                ]},
                {"key": "b", "label": "Take a risk", "profiles": [
                    {"help": 5, "harm": 1, "chance": 0.5,
                     "fail_help": 1, "fail_harm": 2,
                     "why": "A success for {people}.",
                     "fail_why": "A failure for {people}."}
                ]},
                {"key": "c", "label": "Use the dev crew", "require_kit": "dev",
                 "consume_kit": True, "profiles": [
                     {"help": 4, "why": "Crew fixes {problem}."}
                 ]},
            ],
        }
        for phase in e.PHASES for route in range(2)
    ]


def new_fixture(**kwargs):
    return e.new_game(42, deck=small_deck(), **kwargs)


def all_stacks():
    return [dict(zip(e.COMPONENTS, values))
            for values in product(*e.COMPONENTS.values())]


class ReproducibilityTests(unittest.TestCase):
    def test_overrides_change_the_build_not_the_world_or_risk(self):
        deck = e.load_deck()
        for seed in (0, 1, 17, 2026, -45):
            baseline = e.new_game(seed, deck=deck)
            for stack in all_stacks():
                for domain, kit in product(e.DOMAINS, e.KITS):
                    game = e.new_game(seed, stack, domain, kit, deck)
                    self.assertEqual(baseline.world, game.world)
                    for turn in range(len(e.PHASES)):
                        baseline.turn = game.turn = turn
                        baseline.selected = game.selected = game.world[turn][0]
                        self.assertEqual(e.risk_roll(baseline), e.risk_roll(game))

    def test_same_choices_reproduce_entire_transcript(self):
        first, second = new_fixture(), new_fixture()
        for game in (first, second):
            while game.status == "playing":
                e.choose_route(game, game.turn % 2)
                if game.turn == 1:
                    e.rebuild(game, "brain")
                e.resolve(game, "b")
        self.assertEqual(e.transcript(first), e.transcript(second))

    def test_inspection_and_rebuild_do_not_reroll_current_risk(self):
        game = new_fixture()
        e.choose_route(game, 0)
        roll = e.risk_roll(game)
        for _ in range(8):
            e.observe(game)
        e.rebuild(game, "brain")
        self.assertEqual(e.risk_roll(game), roll)

    def test_caller_stack_is_not_modified(self):
        stack = {"brain": "remote", "data": "private", "guard": "human"}
        game = new_fixture(stack=stack)
        e.choose_route(game, 0)
        e.rebuild(game, "brain")
        self.assertEqual(stack["brain"], "remote")
        self.assertEqual(game.initial_stack, stack)


class ConsequenceTests(unittest.TestCase):
    def test_preview_matches_both_actual_gamble_outcomes(self):
        seen = set()
        for seed in range(30):
            game = e.new_game(seed, deck=small_deck())
            e.choose_route(game, 0)
            shown = next(p for p in e.observe(game)["options"] if p["key"] == "b")
            before = deepcopy(game)
            result = e.resolve(game, "b")
            seen.add(result["success"])
            prefix = "" if result["success"] else "fail_"
            self.assertEqual(result["help"], shown[prefix + "help"])
            self.assertEqual(result["harm"], shown[prefix + "harm"])
            self.assertEqual(result["why"], shown[prefix + "why"])
            self.assertEqual(game.reach, before.reach + result["help"])
            self.assertEqual(game.lives, max(0, before.lives - result["harm"]))
            self.assertEqual(result["chance"], shown["chance"])
        self.assertEqual(seen, {True, False})

    def test_chance_zero_and_one_are_guaranteed(self):
        for chance, expected in ((0, False), (1, True)):
            deck = small_deck()
            for event in deck:
                event["options"][1]["profiles"][0]["chance"] = chance
            game = e.new_game(7, deck=deck)
            e.choose_route(game, 0)
            self.assertIs(e.resolve(game, "b")["success"], expected)

    def test_failed_gamble_does_not_apply_successful_stack_or_contract_effects(self):
        deck = small_deck()
        for event in deck:
            event["options"][1]["profiles"][0].update(
                chance=0, contract=True, set_stack={"brain": "remote"})
        game = e.new_game(42, stack={"brain": "local", "data": "open", "guard": "human"}, deck=deck)
        e.choose_route(game, 0)
        e.resolve(game, "b")
        self.assertEqual(game.stack["brain"], "local")
        self.assertFalse(game.contract)

    def test_kit_is_consumed_on_success_or_failure_and_cannot_be_reused(self):
        for chance in (0, 1):
            deck = small_deck()
            for event in deck:
                event["options"][2]["profiles"][0].update(
                    chance=chance, fail_why="The attempt failed.")
            game = e.new_game(42, kit="dev", deck=deck)
            e.choose_route(game, 0)
            result = e.resolve(game, "c")
            self.assertTrue(result["kit_used"])
            self.assertFalse(game.kit_ready)
            e.choose_route(game, 0)
            self.assertNotIn("c", [p["key"] for p in e.observe(game)["options"]])
            before = deepcopy(game)
            with self.assertRaises(ValueError):
                e.resolve(game, "c")
            self.assertEqual(game, before)

    def test_incompatible_kit_cannot_be_used(self):
        game = new_fixture(kit="field")
        e.choose_route(game, 0)
        self.assertEqual([p["key"] for p in e.observe(game)["options"]], ["a", "b"])
        with self.assertRaises(ValueError):
            e.resolve(game, "c")
        self.assertTrue(game.kit_ready)

    def test_recovery_restores_resources_only_on_success_and_respects_caps(self):
        for chance in (0, 1):
            for lives, rebuilds in ((1, 0), (2, 1), (3, 2)):
                deck = small_deck()
                for event in deck:
                    event["options"][0]["profiles"][0].update(
                        chance=chance, heal=2, gain_rebuilds=2,
                        fail_harm=0, fail_why="Recovery did not arrive.")
                game = e.new_game(0, deck=deck)
                game.lives = lives
                game.rebuilds = rebuilds
                e.choose_route(game, 0)
                shown = next(p for p in e.observe(game)["options"] if p["key"] == "a")
                self.assertEqual(shown["heal"], 2)
                self.assertEqual(shown["gain_rebuilds"], 2)
                e.resolve(game, "a")
                self.assertEqual(game.lives, min(3, lives + 2) if chance else lives)
                self.assertEqual(game.rebuilds, min(2, rebuilds + 2) if chance else rebuilds)

    def test_recovery_does_not_refill_spent_kit(self):
        deck = small_deck()
        for event in deck:
            event["options"][0]["profiles"][0].update(heal=1, gain_rebuilds=1)
        game = e.new_game(0, deck=deck)
        e.choose_route(game, 0)
        e.resolve(game, "c")
        e.choose_route(game, 0)
        e.resolve(game, "a")
        self.assertFalse(game.kit_ready)

    def test_zero_lives_ends_immediately_even_above_target(self):
        game = new_fixture()
        game.lives = 1
        game.reach = e.TARGET + 5
        e.choose_route(game, 0)
        with patch.object(e, "risk_roll", return_value=0.9):
            e.resolve(game, "b")
        self.assertEqual(game.lives, 0)
        self.assertEqual(game.turn, 1)
        self.assertEqual(game.status, "collapsed")
        self.assertEqual(e.available_options(game), [])
        self.assertNotIn("routes", e.observe(game))
        with self.assertRaises(ValueError):
            e.choose_route(game, 0)

    def test_healing_cannot_resurrect_after_lethal_harm(self):
        deck = small_deck()
        for event in deck:
            event["options"][0]["profiles"][0].update(harm=1, heal=3)
        game = e.new_game(0, deck=deck)
        game.lives = 1
        game.turn = 4
        game.reach = e.TARGET - 1
        e.choose_route(game, 0)
        result = e.resolve(game, "a")
        self.assertTrue(result["success"])
        self.assertEqual(game.lives, 0)
        self.assertEqual(result["healed"], 0)
        self.assertEqual(game.status, "collapsed")

    def test_target_requires_five_completed_events_and_survival(self):
        game = new_fixture()
        game.reach = e.TARGET
        self.assertEqual(game.status, "playing")
        for turn in range(5):
            e.choose_route(game, 0)
            e.resolve(game, "a")
            self.assertEqual(game.status, "won" if turn == 4 else "playing")
        game.lives = 0
        self.assertEqual(game.status, "collapsed")

    def test_finishing_one_below_target_is_short_and_exact_target_wins(self):
        for reach, status in ((e.TARGET - 1, "short"), (e.TARGET, "won")):
            game = new_fixture()
            game.turn = 4
            game.reach = reach - 3
            e.choose_route(game, 0)
            e.resolve(game, "a")
            self.assertEqual(game.status, status)


class RebuildTests(unittest.TestCase):
    def test_normal_rebuild_costs_one_and_only_changes_selected_component(self):
        game = new_fixture()
        original = game.stack.copy()
        e.choose_route(game, 0)
        result = e.rebuild(game, "data")
        self.assertEqual(result["cost"], 1)
        self.assertEqual(game.rebuilds, 1)
        self.assertNotEqual(game.stack["data"], original["data"])
        self.assertEqual(game.stack["brain"], original["brain"])
        self.assertEqual(game.stack["guard"], original["guard"])
        self.assertEqual(game.turn, 0)
        self.assertIsNotNone(game.selected)

    def test_contracted_brain_exit_costs_two_and_clears_contract(self):
        game = new_fixture(stack={"brain": "remote", "data": "private", "guard": "human"})
        game.contract = True
        e.choose_route(game, 0)
        self.assertEqual(e.rebuild_cost(game, "brain"), 2)
        result = e.rebuild(game, "brain")
        self.assertEqual(result["cost"], 2)
        self.assertEqual(game.rebuilds, 0)
        self.assertEqual(game.stack["brain"], "local")
        self.assertFalse(game.contract)
        self.assertEqual(e.rebuild_cost(game, "brain"), 1)

    def test_other_component_change_does_not_release_contract(self):
        game = new_fixture()
        game.contract = True
        e.choose_route(game, 0)
        e.rebuild(game, "guard")
        self.assertTrue(game.contract)
        self.assertEqual(e.rebuild_cost(game, "brain"), 2)

    def test_insufficient_tokens_reject_without_partial_mutation(self):
        for tokens, contracted in ((0, False), (1, True)):
            game = new_fixture()
            game.rebuilds = tokens
            game.contract = contracted
            e.choose_route(game, 0)
            before = deepcopy(game)
            with self.assertRaises(ValueError):
                e.rebuild(game, "brain")
            self.assertEqual(game, before)

    def test_dev_kit_contract_exit_is_explicit_and_single_use(self):
        game = e.new_game(0, stack={"brain": "remote", "data": "private", "guard": "judge"}, kit="dev")
        game.turn = 4
        game.selected = "open_release"
        game.contract = True
        game.rebuilds = 0
        shown = next(p for p in e.observe(game)["options"] if p["consume_kit"])
        self.assertTrue(shown["consume_kit"])
        self.assertIs(shown["contract"], False)
        self.assertEqual(shown["set_stack"], {"brain": "local"})
        e.resolve(game, shown["key"])
        self.assertFalse(game.contract)
        self.assertFalse(game.kit_ready)
        self.assertEqual(game.stack["brain"], "local")


class PublicViewTests(unittest.TestCase):
    def test_fog_reveals_only_current_routes_then_current_card(self):
        game = new_fixture()
        view = e.observe(game)
        self.assertEqual([r["id"] for r in view["routes"]], game.world[0])
        self.assertNotIn("event", view)
        self.assertNotIn("options", view)
        encoded = json.dumps(view)
        for event_id in sum(game.world[1:], []):
            self.assertNotIn(event_id, encoded)
        for private_key in ("world", "deck", "seed", "roll", "risk_roll"):
            self.assertNotIn(private_key, view)
        e.choose_route(game, 0)
        view = e.observe(game)
        self.assertEqual(view["event"]["id"], game.selected)
        self.assertNotIn("routes", view)
        self.assertNotIn("profiles", json.dumps(view))

    def test_final_market_change_is_global_not_an_avoidable_route(self):
        game = new_fixture()
        self.assertTrue(all(len(routes) == 2 for routes in game.world[:4]))
        game.turn = 4
        self.assertEqual(len(e.observe(game)["routes"]), 1)
        before = deepcopy(game)
        with self.assertRaises(ValueError):
            e.choose_route(game, 1)
        self.assertEqual(game, before)
        e.choose_route(game, 0)
        self.assertIn("event", e.observe(game))

    def test_observing_does_not_mutate_game_and_returned_view_is_detached(self):
        game = new_fixture()
        e.choose_route(game, 0)
        e.resolve(game, "a")
        before = deepcopy(game)
        view = e.observe(game)
        self.assertEqual(game, before)
        view["stack"]["brain"] = "corrupted"
        view["history"][0]["after"]["stack"]["brain"] = "corrupted"
        view["history"][0]["help"] = 1000
        self.assertEqual(game, before)

    def test_preview_stack_changes_cannot_mutate_deck(self):
        game = e.new_game(0)
        game.turn = 3
        game.selected = "weak_signals"
        before = deepcopy(game)
        view = e.observe(game)
        option = next(o for o in view["options"] if o["set_stack"].get("data") == "open")
        option["set_stack"]["data"] = "corrupted"
        self.assertEqual(game, before)

    def test_all_five_domains_interpolate_every_real_event_and_option(self):
        deck = e.load_deck()
        for domain in e.DOMAINS:
            game = e.new_game(0, domain=domain, deck=deck)
            for event in deck:
                game.turn = e.PHASES.index(event["phase"])
                game.selected = event["id"]
                text = json.dumps(e.observe(game))
                for token in ("{people}", "{problem}", "{place}", "{unit}"):
                    self.assertNotIn(token, text)
                for option in event["options"]:
                    for profile in option["profiles"]:
                        self.assertNotIn("{", game.format(profile["why"]))
                        self.assertNotIn("{", game.format(profile.get("fail_why", "")))


class InvalidActionTests(unittest.TestCase):
    def assert_rejected_unchanged(self, game, function, argument):
        before = deepcopy(game)
        with self.assertRaises(ValueError):
            function(game, argument)
        self.assertEqual(game, before)

    def test_invalid_routes_do_not_change_state(self):
        game = new_fixture()
        for route in (-1, 2, 100, "0", None):
            self.assert_rejected_unchanged(game, e.choose_route, route)
        e.choose_route(game, 0)
        self.assert_rejected_unchanged(game, e.choose_route, 1)

    def test_actions_and_rebuilds_require_current_event(self):
        game = new_fixture()
        self.assert_rejected_unchanged(game, e.resolve, "a")
        self.assert_rejected_unchanged(game, e.rebuild, "brain")
        e.choose_route(game, 0)
        self.assert_rejected_unchanged(game, e.resolve, "x")
        self.assert_rejected_unchanged(game, e.rebuild, "power")
        game.lives = 0
        self.assert_rejected_unchanged(game, e.resolve, "a")
        self.assert_rejected_unchanged(game, e.rebuild, "brain")

    def test_invalid_starting_build_domain_and_kit_are_rejected(self):
        for kwargs in (
            {"stack": {}}, {"stack": {"brain": "remote"}},
            {"stack": {"brain": "magic", "data": "open", "guard": "judge"}},
            {"domain": "unknown"}, {"kit": "infinite"},
        ):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                new_fixture(**kwargs)


class DeckValidationTests(unittest.TestCase):
    def test_real_deck_and_fixture_are_valid(self):
        self.assertGreaterEqual(len(e.load_deck()), 12)
        e.validate_deck(small_deck())

    def test_load_deck_validates_external_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "events.json"
            path.write_text(json.dumps(small_deck()))
            self.assertEqual(e.load_deck(path), small_deck())
            path.write_text("[]")
            with self.assertRaises(ValueError):
                e.load_deck(path)

    def test_custom_game_deck_is_validated_before_play(self):
        deck = small_deck()
        del deck[0]["options"][0]["label"]
        with self.assertRaises(ValueError):
            e.new_game(0, deck=deck)

    def test_invalid_deck_shapes_ids_and_phases(self):
        bad_decks = [{}, [None], [], small_deck()[:-1]]
        duplicate = small_deck()
        duplicate[1]["id"] = duplicate[0]["id"]
        bad_decks.append(duplicate)
        bad_phase = small_deck()
        bad_phase[0]["phase"] = "unknown"
        bad_decks.append(bad_phase)
        for deck in bad_decks:
            with self.subTest(deck=repr(deck)[:60]), self.assertRaises(ValueError):
                e.validate_deck(deck)

    def test_invalid_option_and_profile_content(self):
        edits = [
            lambda event, option, profile: event.update(title=None),
            lambda event, option, profile: event.update(options={}),
            lambda event, option, profile: option.pop("key"),
            lambda event, option, profile: option.pop("label"),
            lambda event, option, profile: option.update(profiles=[]),
            lambda event, option, profile: option.update(profiles=[None]),
            lambda event, option, profile: option.update(require_kit="magic"),
            lambda event, option, profile: option.update(consume_kit=True),
            lambda event, option, profile: option.update(consume_kit="false"),
            lambda event, option, profile: profile.update(when={"brain": "unknown"}),
            lambda event, option, profile: profile.update(when={"unknown": "remote"}),
            lambda event, option, profile: profile.update(when=None),
            lambda event, option, profile: profile.update(when={"brain": "remote"}),
            lambda event, option, profile: profile.update(chance=1.1),
            lambda event, option, profile: profile.update(chance=-0.1),
            lambda event, option, profile: profile.update(chance=float("nan")),
            lambda event, option, profile: profile.update(chance="0.5"),
            lambda event, option, profile: profile.update(chance=0.5),
            lambda event, option, profile: profile.update(help=-1),
            lambda event, option, profile: profile.update(harm=True),
            lambda event, option, profile: profile.update(help=1.5),
            lambda event, option, profile: profile.update(fail_harm=-1),
            lambda event, option, profile: profile.update(heal=-1),
            lambda event, option, profile: profile.update(gain_rebuilds=1.5),
            lambda event, option, profile: profile.pop("help"),
            lambda event, option, profile: profile.update(why=None),
            lambda event, option, profile: profile.update(fail_why=12),
            lambda event, option, profile: profile.update(contract="false"),
            lambda event, option, profile: profile.update(set_stack=[]),
            lambda event, option, profile: profile.update(set_stack={"brain": "magic"}),
            lambda event, option, profile: profile.update(why="Hello {unknown}"),
            lambda event, option, profile: profile.update(why="Hello {}"),
            lambda event, option, profile: profile.update(why="Hello {people:03d}"),
        ]
        for index, edit in enumerate(edits):
            deck = small_deck()
            event = deck[0]
            option = event["options"][0]
            profile = option["profiles"][0]
            edit(event, option, profile)
            with self.subTest(edit=index), self.assertRaises(ValueError):
                e.validate_deck(deck)


class RealDeckRunTests(unittest.TestCase):
    def test_all_eight_builds_both_kits_across_many_seeds_finish_validly(self):
        deck = e.load_deck()
        for seed, stack, kit in product(range(40), all_stacks(), e.KITS):
            game = e.new_game(seed, stack=stack, kit=kit, deck=deck)
            while game.status == "playing":
                # Only use the public screen when deciding. This deliberately
                # samples both routes rather than looking ahead into the deck.
                route_count = len(e.observe(game)["routes"])
                e.choose_route(game, (seed + game.turn) % route_count)
                screen = e.observe(game)
                # A mix of safe and reach-seeking players exercises bad outcomes.
                options = screen["options"]
                key = options[(seed + game.turn) % len(options)]["key"]
                e.resolve(game, key)
            with self.subTest(seed=seed, stack=stack, kit=kit):
                self.assertIn(game.status, ("won", "short", "collapsed"))
                self.assertGreaterEqual(game.lives, 0)
                self.assertLessEqual(game.lives, 3)
                self.assertGreaterEqual(game.reach, 0)
                self.assertLessEqual(game.turn, 5)
                self.assertEqual(len(game.history), game.turn)
                self.assertIsNone(game.selected)
                if game.status == "won":
                    self.assertEqual(game.turn, 5)
                    self.assertGreater(game.lives, 0)
                    self.assertGreaterEqual(game.reach, e.TARGET)
                if game.status == "collapsed":
                    self.assertEqual(game.lives, 0)
                json.dumps(e.transcript(game))


if __name__ == "__main__":
    unittest.main()
