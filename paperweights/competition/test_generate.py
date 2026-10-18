import itertools
import unittest
from generate import *

class CompetitionTests(unittest.TestCase):
    def check_physics(self,previous,current):
        self.assertEqual(current['battery']=='dead',signal_hazard(previous))
        if current['dust']=='storm':
            self.assertEqual(previous['dust'],'haze');self.assertNotEqual(current['slope'],'flat')
        if current['ground']=='sand':
            self.assertEqual(previous['ground'],'soft');self.assertNotEqual(current['slope'],'steep')

    def test_archive_reachable_keys_and_physics(self):
        records,buckets=archive()
        self.assertEqual(len(CUES),24)
        self.assertEqual(set(buckets),{c['key'] for c in CUES})
        self.assertGreater(min(sum(map(len,g.values())) for g in buckets.values()),100)
        for r in records:
            rows=r['history']+[r['source'],r['target']]
            for prev,current in zip(rows,rows[1:]):self.check_physics(prev,current)

    def test_every_sheet_matches_every_reachable_card(self):
        for n in (15,100,200):
            p=make_pack(n)
            for s in p['sheets']:self.assertEqual({e['key'] for e in s['entries']},{c['key'] for c in CUES})
            for t in p['teams']:
                for key,counts in t['votesByCue'].items():
                    self.assertEqual(sum(counts.values()),len(t['sheetIds']))
                    for cat in CATEGORIES:
                        self.assertEqual(counts[cat],sum(next(e for e in s['entries'] if e['key']==key)['nextCategory']==cat for s in p['sheets'] if s['team']==t['id']))
            lookup={o['id']:o for o in p['observations']}
            for s in p['sheets']:
                for e in s['entries']:
                    o=lookup[e['historyId']]
                    self.assertEqual(card_cue(o['history'][0],o['source'],e['category'])['key'],e['key'])
                    self.assertEqual(o['inspection'],e['nextCategory'])

    def test_all_256_choice_paths_are_closed_and_contiguous(self):
        p=make_pack()
        keys={c['key'] for c in CUES}
        for t in p['teams']:
            for r,next_r in zip(t['rounds'],t['rounds'][1:]):
                self.assertEqual(r['target'],next_r['source'])
                self.assertEqual([r['history'][1],r['source']],next_r['history'])
            for choices in itertools.product(CATEGORIES,repeat=4):
                current=t['initialCue']
                for r,cat in zip(t['rounds'],choices):
                    self.assertIn(current['key'],keys)
                    self.assertIn(current['key'],t['votesByCue'])
                    self.assertEqual(current['value'],r['source'][current['category']])
                    current=r['targetCues'][cat]
                    self.assertEqual(current,card_cue(r['history'][1],r['target'],cat))
                    self.assertIn(current['key'],keys)

    def test_maps_independent_of_sheets_and_choices(self):
        packs=[make_pack(n) for n in (15,100,200)]
        for p in packs[1:]:
            for a,b in zip(packs[0]['teams'],p['teams']):
                self.assertEqual(a['rounds'],b['rounds']);self.assertEqual(a['initialCue'],b['initialCue'])
        self.assertEqual(make_pack()['packId'],make_pack()['packId'])
        for r in play(packs[0]):
            for earlier,later in zip(r['log'],r['log'][1:]):self.assertEqual(earlier['revealedCue'],later['cue'])

    def test_quotas_and_reference_policy_match_production(self):
        for n in (15,100,200):
            self.assertEqual(play(make_pack(n)),play(simulation_pack(n)))
        for c in CUES:
            self.assertAlmostEqual(sum(vote_weights(c).values()),1)
            for n in (3,4,25,50):
                q=quotas(vote_weights(c),n)
                self.assertEqual(sum(q.values()),n)
                for cat in CATEGORIES:self.assertLess(abs(q[cat]-n*vote_weights(c)[cat]),1.00001)

if __name__=='__main__':unittest.main()
