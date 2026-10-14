import unittest
from generate import *

class CompetitionTests(unittest.TestCase):
    def test_every_voter_has_every_cue_and_votes_match(self):
        for n in (15,100,200):
            p=make_pack(n)
            self.assertEqual(len(p['sheets']),n)
            self.assertEqual(len({s['id'] for s in p['sheets']}),n)
            for s in p['sheets']:
                self.assertEqual({e['key'] for e in s['entries']},{c['key'] for c in CUES})
            for team in p['teams']:
                for r in team['rounds']:
                    self.assertEqual(sum(r['votes'].values()),len(team['sheetIds']))
                    self.assertEqual(context(r['history'],r['source']),r['cue']['context'])
                    self.assertEqual(r['source'][r['cue']['category']],r['cue']['value'])
                    for cat in CATEGORIES:
                        count=sum(next(e for e in s['entries'] if e['key']==r['cue']['key'])['nextCategory']==cat for s in p['sheets'] if s['team']==team['id'])
                        self.assertEqual(count,r['votes'][cat])
            for o in p['observations']:
                self.assertIn(o['inspection'],CATEGORIES)
                self.assertGreater(selection_weights(o['outcome'])[o['inspection']],0)
    def test_paper_cannot_change_map(self):
        packs=[make_pack(n) for n in (15,100,200)]
        for p in packs[1:]:
            for t,u in zip(packs[0]['teams'],p['teams']):
                for a,b in zip(t['rounds'],u['rounds']):
                    for key in ('cue','history','source','target','fatal','hazardCategories'):
                        self.assertEqual(a[key],b[key])
        self.assertEqual(make_pack()['packId'],make_pack()['packId'])
    def test_joint_model_and_rounding(self):
        for cue in CUES:
            self.assertAlmostEqual(sum(p for _,p in kernel(cue)),1)
            self.assertAlmostEqual(sum(vote_weights(cue).values()),1)
            for n in (3,4,25,50):
                q=quotas(vote_weights(cue),n)
                self.assertEqual(sum(q.values()),n)
                for cat in CATEGORIES:self.assertLess(abs(q[cat]-vote_weights(cue)[cat]*n),1.00001)
    def test_no_impossible_target_terrain(self):
        rng=random.Random(1)
        for cue in CUES:
            for outcome,p in kernel(cue):
                history,source,target,_=draw_observation(cue,rng,outcome)
                self.assertEqual(context(history,source),cue['context'])
                self.assertEqual(source[cue['category']],cue['value'])
                for prev,current in zip(history+[source],history[1:]+[source,target]):
                    self.assertEqual(current['battery']=='dead',prev['dust']=='storm' or prev['ground']=='sand')
                    if current['dust']=='storm':
                        self.assertEqual(prev['dust'],'haze')
                        self.assertNotEqual(current['slope'],'flat')
                    if current['ground']=='sand':
                        self.assertEqual(prev['ground'],'soft')
                        self.assertNotEqual(current['slope'],'steep')
                if target['dust']=='storm':self.assertNotEqual(target['slope'],'flat')
                if target['ground']=='sand':self.assertNotEqual(target['slope'],'steep')
    def test_reviewed_event_pacing_at_all_sizes(self):
        for n in (15,100,200):
            results=play(make_pack(n))
            self.assertEqual(sum(r['finished'] for r in results),2)
            self.assertEqual([len(r['log']) for r in results],[3,4,4,4])


if __name__=='__main__':unittest.main()
