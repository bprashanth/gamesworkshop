"""Play the separate entry point, including evidence, replay and failure paths."""
from contextlib import redirect_stderr, redirect_stdout
import copy
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from fieldwork import __main__ as cli
from fieldwork import engine as e
from fieldwork.evidence import dataset, fact, problems, research
from fieldwork.places import geocode, match_district


ROOT = Path(__file__).resolve().parents[1]
BASE = ['--place', 'Udaipur, Rajasthan', '--problem', 'vaccination',
        '--tool', 'guide', '--seed', '7', '--plain']


def run_cli(*args, input_text='', columns=None):
    env = os.environ.copy()
    env['PYTHONIOENCODING'] = 'utf-8'
    if columns:
        env['COLUMNS'] = str(columns)
    return subprocess.run([sys.executable, '-m', 'fieldwork', *args],
                          input=input_text, text=True, capture_output=True,
                          cwd=ROOT, env=env, timeout=30)


def public_plan(game):
    """Exercise A/B/R while selecting only from the currently visible options."""
    inputs = []
    forced = iter(('a', 'b', 'r'))
    while game.status == 'playing':
        view = e.observe(game)
        requested = next(forced, None)
        if requested in view['options']:
            action = requested
        else:
            action = max(view['options'], key=lambda key: (
                len(view['options'][key]['served']),
                len(view['options'][key]['prepared']),
                -len(view['options'][key]['expired'])))
        inputs.extend((action, ''))  # One action, then Enter after its consequence.
        game, _ = e.step(game, action)
    return game, inputs


class EntryPointTests(unittest.TestCase):
    def assert_clean_exit(self, result, code=0):
        self.assertEqual(result.returncode, code, result.stdout + result.stderr)
        self.assertNotIn('Traceback', result.stdout + result.stderr)
        self.assertNotIn('\x1b', result.stdout)

    def test_help_names_both_separate_games_and_supported_controls(self):
        result = run_cli('--help')
        self.assert_clean_exit(result)
        self.assertIn('Idlisseus', result.stdout)
        for flag in ('--place', '--problem', '--tool', '--seed', '--demo', '--evidence', '--log'):
            self.assertIn(flag, result.stdout)

    def test_demo_completes_and_writes_real_evidence_and_history(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'run.json'
            result = run_cli(*BASE, '--demo', '--log', str(path))
            self.assert_clean_exit(result)
            log = json.loads(path.read_text())
        self.assertIn(log['status'], ('won', 'short'))
        self.assertEqual(log['seed'], 7)
        self.assertEqual(log['initial_tool'], 'guide')
        self.assertEqual(log['place_id'], 'rajasthan-udaipur')
        self.assertEqual(log['problem'], 'vaccination')
        self.assertTrue(log['history'])
        self.assertEqual(log['history'][-1]['score_after'], log['score'])
        self.assertEqual(log['place']['method'], 'district_name')
        district = match_district(geocode('Udaipur, Rajasthan')[0])
        self.assertEqual(log['evidence'], fact(district, 'vaccination'))
        self.assertIn('simulated service week', result.stdout)

    def test_coordinate_demo_attaches_chennai_point_and_boundary_provenance(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'coordinate.json'
            result = run_cli('--place', '13.08,80.27', '--problem', 'vaccination',
                             '--tool', 'guide', '--seed', '7', '--plain', '--demo',
                             '--log', str(path))
            self.assert_clean_exit(result)
            log = json.loads(path.read_text())
        self.assertEqual(log['place']['lat'], 13.08)
        self.assertEqual(log['place']['lon'], 80.27)
        self.assertEqual(log['place']['district'], 'Chennai')
        self.assertEqual(log['place']['method'], 'polygon')
        self.assertIn('2021', log['place']['note'])
        self.assertIn('geoboundaries.org', log['place']['source_url'])
        self.assertEqual(log['place_id'], 'tamil-nadu-chennai')

    def test_evidence_includes_local_value_date_official_url_and_research(self):
        result = run_cli(*BASE, '--evidence')
        self.assert_clean_exit(result)
        district = match_district(geocode('Udaipur, Rajasthan')[0])
        evidence = fact(district, 'vaccination')
        compact = ' '.join(result.stdout.split())
        unbroken = ''.join(result.stdout.split())
        self.assertIn(evidence['text'], compact)
        self.assertIn(evidence['period'], compact)
        self.assertIn(evidence['source_url'], unbroken)
        self.assertIn('OUTSIDE THE GAME', compact)
        sources = [s for s in research()['sources'] if s['id'] in problems()['vaccination']['research']]
        self.assertTrue(sources)
        for source in sources:
            self.assertIn(' '.join(source['title'].split()), compact)
            self.assertIn(source['url'], unbroken)
        self.assertIn('does not measure AI effects here', compact)

    def test_suppressed_indicator_refuses_to_invent_local_value(self):
        district, problem = next((district, problem)
                                 for district in dataset()['districts']
                                 for problem in problems()
                                 if district['indicators'].get(problem) is None)
        result = run_cli('--place', f"{district['name']}, {district['state']}",
                         '--problem', problem, '--plain', '--demo')
        self.assert_clean_exit(result, 1)
        self.assertIn('suppressed', result.stderr)
        self.assertNotIn('DEMO chooses', result.stdout)

    def test_eof_before_and_during_game_closes_cleanly(self):
        for args in (('--plain',), tuple(BASE)):
            with self.subTest(args=args):
                result = run_cli(*args)
                self.assert_clean_exit(result)
                self.assertIn('Field notes closed', result.stdout)

    def test_q_saves_current_game_without_advancing_a_shift(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'quit.json'
            result = run_cli(*BASE, '--log', str(path), input_text='q\n')
            self.assert_clean_exit(result)
            log = json.loads(path.read_text())
        self.assertEqual(log['status'], 'playing')
        self.assertEqual(log['history'], [])
        self.assertEqual(log['score'], 0)
        self.assertEqual(log['evidence']['scope'], 'Udaipur district, Rajasthan')

    def test_bad_log_destination_on_quit_has_no_traceback(self):
        with tempfile.TemporaryDirectory() as temp:
            result = run_cli(*BASE, '--log', temp, input_text='q\n')
        self.assert_clean_exit(result, 1)
        self.assertIn('could not write the record', result.stderr)

    def test_plain_demo_fits_32_columns_without_escape_codes(self):
        result = run_cli(*BASE, '--demo', columns=32)
        self.assert_clean_exit(result)
        overlong = [(i, line) for i, line in enumerate(result.stdout.splitlines(), 1) if len(line) > 32]
        self.assertEqual(overlong, [])

    def test_ambiguous_place_requires_player_selection(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'ambiguous.json'
            result = run_cli('--place', 'Aurangabad', '--problem', 'vaccination',
                             '--tool', 'guide', '--seed', '7', '--plain', '--demo',
                             '--log', str(path), input_text='1\n')
            self.assert_clean_exit(result)
            log = json.loads(path.read_text())
        self.assertIn('Several places share that name', result.stdout)
        self.assertIn('Bihar', result.stdout)
        self.assertIn('Maharashtra', result.stdout)
        self.assertEqual(log['place']['state'], geocode('Aurangabad')[0]['state'])

    def test_new_boundary_does_not_silently_substitute_nearby_survey(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'unsupported.json'
            result = run_cli('--place', '27.624654,94.284821', '--problem', 'vaccination',
                             '--plain', '--demo', '--log', str(path), input_text='q\n')
            self.assert_clean_exit(result)
            self.assertFalse(path.exists())
        compact = ' '.join(result.stdout.split())
        self.assertIn('does not have an exact survey match', compact)
        self.assertIn('No nearby district will be substituted automatically', compact)
        self.assertNotIn('DEMO chooses', result.stdout)

    def test_explicit_historical_context_is_labelled_as_player_selected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'selected.json'
            result = run_cli('--place', '27.624654,94.284821', '--problem', 'vaccination',
                             '--plain', '--demo', '--log', str(path),
                             input_text='West Siang, Arunachal Pradesh\na\n')
            self.assert_clean_exit(result)
            log = json.loads(path.read_text())
        self.assertEqual(log['place']['district'], 'Lower Siang')
        self.assertEqual(log['place_id'], 'arunachal-pradesh-west-siang')
        self.assertIn('player-selected', log['place']['evidence_selection'])
        self.assertIn('not a verified spatial match', log['place']['evidence_selection'])

    def test_verified_parent_context_is_explicit_and_retains_current_point(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'parent.json'
            result = run_cli('--place', '25.366,78.797', '--problem', 'vaccination',
                             '--plain', '--demo', '--log', str(path))
            self.assert_clean_exit(result)
            log = json.loads(path.read_text())
        self.assertEqual(log['place']['district'], 'Niwari')
        self.assertEqual(log['place_id'], 'madhya-pradesh-tikamgarh')
        self.assertIn('historical parent context', log['place']['evidence_selection'])
        self.assertIn('niwari.nic.in', log['place']['parent_source_url'])
        compact = ' '.join(result.stdout.split())
        self.assertIn('parent district context', compact)
        self.assertIn('not an estimate for Niwari', compact)
        self.assertEqual(log['evidence']['scope'], 'Tikamgarh district, Madhya Pradesh')

    def test_same_week_other_ai_replays_identical_world_and_records_both_runs(self):
        district = match_district(geocode('Udaipur, Rajasthan')[0])
        first, first_inputs = public_plan(e.new_game(7, district['id'], 'vaccination', 'guide'))
        second, second_inputs = public_plan(e.new_game(7, district['id'], 'vaccination', 'reader'))
        inputs = iter([*first_inputs, 'b', *second_inputs, 'q'])
        captured = []

        def capture_log(path, game, row, place):
            if game is not None and game.status != 'playing':
                captured.append(copy.deepcopy(e.transcript(game)))

        output, errors = io.StringIO(), io.StringIO()
        with patch('builtins.input', side_effect=lambda prompt='': next(inputs)), \
                patch.object(cli, 'write_log', side_effect=capture_log), \
                redirect_stdout(output), redirect_stderr(errors):
            code = cli.main(BASE)
        self.assertEqual(code, 0, errors.getvalue())
        self.assertIn(e.transcript(first), captured)
        self.assertIn(e.transcript(second), captured)
        self.assertEqual(first.cases, second.cases)
        self.assertEqual(first.shifts, second.shifts)
        self.assertEqual({h['action'] for h in first.history + second.history}, {'a', 'b', 'r'})
        self.assertEqual(output.getvalue().count('A POINT IN INDIA'), 1)
        self.assertIn('Same week, other AI desk', output.getvalue())
        self.assertIn('Field notes closed', output.getvalue())


if __name__ == '__main__':
    unittest.main()
