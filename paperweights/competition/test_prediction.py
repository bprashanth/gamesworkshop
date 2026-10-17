import unittest
import prediction as p

class PredictionTests(unittest.TestCase):
    def test_all_cues_and_exact_binary_tallies(self):
        for n in (15,100,200):
            pack=p.make_pack(n)
            self.assertEqual(len(pack['sheets']),n)
            for sheet in pack['sheets']:
                self.assertEqual({e['key'] for e in sheet['entries']},{c['key'] for c in p.physics.CUES})
                self.assertTrue(all(e['nextAction'] in p.ACTIONS for e in sheet['entries']))
            for team in pack['teams']:
                sheets=[s for s in pack['sheets'] if s['team']==team['id']]
                for key,counts in team['votesByCue'].items():
                    for action in p.ACTIONS:self.assertEqual(counts[action],sum(next(e for e in s['entries'] if e['key']==key)['nextAction']==action for s in sheets))
                for r in team['rounds']:
                    self.assertEqual(r['paperVotes'],p.aggregate_votes(sheets,r['sourceCues']))
                    self.assertEqual(sum(r['paperVotes'].values()),len(sheets))
                    self.assertEqual(len(r['sourceCues']),4)

    def test_rows_are_actual_outcomes_not_inspection_weights(self):
        pack=p.make_pack(200)
        records,_=p.outcome_buckets();by_id={r['id']:r for r in records}
        obs={o['id']:o for o in pack['observations']}
        for s in pack['sheets']:
            for e in s['entries']:
                o=obs[e['historyId']];original=by_id[o['archiveId']]
                self.assertEqual(o['target'],original['target'])
                self.assertEqual(e['nextAction']=='avoid',bool(p.physics.hazard_categories(o['target'])))
                self.assertEqual(p.physics.card_cue(o['history'][0],o['source'],e['category'])['key'],e['key'])
        for cue in p.physics.CUES:
            weights=p.outcome_weights(cue['key']);self.assertAlmostEqual(sum(weights.values()),1)
            for n in (3,4,25,50):
                q=p.quotas(weights,n)
                for a in p.ACTIONS:self.assertLess(abs(q[a]-weights[a]*n),1.000001)

    def test_original_routes_preserved_and_context_uses_past(self):
        packs=[p.make_pack(n) for n in (15,100,200)]
        for pack in packs:
            for team in pack['teams']:
                initial,original=p.physics.route(pack['seed'],team['id'])
                self.assertEqual(initial,team['initialCue'])
                for r,old in zip(team['rounds'],original):
                    for key,value in old.items():self.assertEqual(r[key],value)
                    for cat,cue in r['sourceCues'].items():self.assertEqual(cue,p.physics.card_cue(r['history'][0],r['source'],cat))
        self.assertEqual(p.make_pack()['packId'],p.make_pack()['packId'])

    def test_aggregation_ties_and_true_go_avoid(self):
        # Four explicit rows let this test exercise the real aggregator's tie rule.
        cues={cat:dict(key=cat) for cat in p.physics.CATEGORIES}
        for bits,expected in [([0,0,0,1],'go'),([0,1,1,1],'avoid'),([0,1,0,1],'abstain')]:
            sheet={'entries':[dict(key=cat,nextAction=p.ACTIONS[b]) for cat,b in zip(p.physics.CATEGORIES,bits)]}
            self.assertEqual(p.person_vote(sheet,cues),expected)
        pack=p.make_pack()
        self.assertTrue(all(r['finished'] for r in p.play(pack,'easy')))
        for action in p.ACTIONS:
            results=p.play(pack,'always-'+action)
            for team,result in zip(pack['teams'],results):
                for step in result['log']:
                    target=team['rounds'][step['round']-1]
                    self.assertEqual(step['survived'],(action=='avoid')==target['fatal'])

if __name__=='__main__':unittest.main()
