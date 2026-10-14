"""Meaningful invariants for the paper games; run with the paperweights venv."""
from collections import Counter
import json
from pathlib import Path
import random
import unittest
from generator import build_deck, tokenize, circular_pairs, CLOSED_CORPUS, deck_report
from rover.model import (build_pack, audit, kernel, sample_next, hazard, sudden_death,
                         CATEGORIES, VALUES, attention_weights, allocate)

class LanguageDeckTests(unittest.TestCase):
    def test_every_supported_size_is_closed(self):
        corpus_edges = set(circular_pairs(tokenize(CLOSED_CORPUS)))
        for n in range(10, 201):
            sheets, colors = build_deck(n, seed=n)
            pairs = [p for s in sheets for p in s]
            self.assertEqual(len(pairs), 24*n)
            self.assertLessEqual(set(pairs), corpus_edges)
            left, right = Counter(a for a,b in pairs), Counter(b for a,b in pairs)
            self.assertEqual(left,right)
            self.assertGreaterEqual(min(left.values()),2)
            self.assertEqual(set(left), set(tokenize(CLOSED_CORPUS)))

    def test_seeds_and_reproducibility(self):
        for n in (10,12,15,100,200):
            for seed in range(12):
                a, colors = build_deck(n,seed=seed)
                b, same_colors = build_deck(n,seed=seed)
                self.assertEqual(a,b)
                self.assertEqual(colors,same_colors)
                self.assertEqual(colors,build_deck(15,seed=987)[1])
                self.assertEqual(len({tuple(s) for s in a}),n)

    def test_report_does_not_claim_fake_branching(self):
        sheets, colors = build_deck(15)
        report = deck_report(sheets, colors,42)
        self.assertEqual(report['corpus_tokens'],176)
        self.assertEqual(report['vocabulary'],51)
        self.assertEqual(len(report['single_successor_tokens']),20)
        self.assertEqual(set(report['successors']['old']['random_hand_probability']), {'man'})
        self.assertAlmostEqual(report['successors']['old']['random_hand_probability']['man'],1)
        for word in report['successors'].values():
            self.assertAlmostEqual(sum(word['random_hand_probability'].values()),1)

class RoverTests(unittest.TestCase):
    def test_kernel_laws_for_every_possible_source_state(self):
        from itertools import product
        for values in product(*(VALUES[c] for c in CATEGORIES)):
            prev = dict(zip(CATEGORIES,values))
            probabilities=list(kernel(prev))
            self.assertAlmostEqual(sum(p for row,p in probabilities),1)
            for row,p in probabilities:
                self.assertGreater(p,0)
                self.assertEqual(row['battery']=='dead',hazard(prev))
                if row['ground']=='sand':
                    self.assertEqual(prev['ground'],'soft')
                    self.assertNotEqual(row['slope'],'steep')
                if row['dust']=='storm':
                    self.assertEqual(prev['dust'],'haze')
                    self.assertNotEqual(row['slope'],'flat')

    def test_haze_full_battery_is_not_safe_oracle(self):
        prev={'battery':'full','slope':'flat','ground':'firm','dust':'haze'}
        next_rows=list(kernel(prev))
        self.assertTrue(any(r['dust']=='storm' for r,p in next_rows))
        self.assertTrue(all(r['battery']=='full' for r,p in next_rows))
        storm=next(r for r,p in next_rows if r['dust']=='storm')
        self.assertTrue(all(r['battery']=='dead' for r,p in kernel(storm)))

    def test_sampling_agrees_with_kernel(self):
        prev={'battery':'full','slope':'flat','ground':'soft','dust':'haze'}
        expected=sum(p for r,p in kernel(prev) if r['dust']=='storm')
        rng=random.Random(934)
        actual=sum(sample_next(prev,rng)['dust']=='storm' for _ in range(15000))/15000
        self.assertLess(abs(actual-expected),.015)

    def test_packs_and_map_seed_independence(self):
        reference_maps=None
        for n in (15,100,200):
            sheets,maps,history=build_pack(n)
            result=audit(sheets,maps,history)
            if reference_maps is None:
                reference_maps=maps
            self.assertEqual(maps,reference_maps)
            self.assertEqual(len(sheets),n)
            for group in result['groups'].values():
                for cue in group['cues'].values():
                    self.assertEqual(sum(cue['votes'].values()),group['people'])
                    for c in CATEGORIES:
                        self.assertLessEqual(abs(cue['votes'][c]-group['people']*cue['target_vote_shares'][c]),1.000001)
            # Different cues should direct attention differently; constant votes defeat the lesson.
            self.assertGreater(result['groups']['A']['cues']['dust:storm']['target_vote_shares']['battery'],
                               result['groups']['A']['cues']['dust:haze']['target_vote_shares']['battery'])

    def test_false_avoids_and_battery(self):
        safe={'ground':'firm','dust':'clear'}
        storm={'ground':'firm','dust':'storm'}
        self.assertEqual(sudden_death(safe,'go'),'crossed')
        self.assertEqual(sudden_death(safe,'avoid'),'dead-false-alarm')
        self.assertEqual(sudden_death(storm,'avoid'),'crossed')
        self.assertEqual(sudden_death(storm,'go'),'dead-hazard')
        self.assertEqual(sudden_death(safe,'go','dead'),'dead-battery')
        self.assertEqual(sudden_death(storm,'avoid','dead'),'dead-battery')
        self.assertEqual(sudden_death(safe,'recharge','dead'),'recharged')

if __name__=='__main__':
    unittest.main(verbosity=2)
