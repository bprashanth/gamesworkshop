import unittest
from collections import Counter
import evidence
import generate as physics

class EvidenceTests(unittest.TestCase):
    def test_packs_and_conditioning(self):
        for n in (15,200):
            p=evidence.make_pack(n);obs={o['id']:o for o in p['observations']}
            for team in p['teams']:
                sheets=[s for s in p['sheets'] if s['team']==team['id']]
                for key,votes in team['votesByCue'].items():
                    counts=Counter();shown={k.split(':')[1] for k in key.split('|')}
                    for s in sheets:
                        e=next(e for e in s['entries'] if e['key']==key);counts[e['nextAction']]+=1;o=obs[e['historyId']]
                        for k in key.split('|'):
                            cat=k.split(':')[1];self.assertEqual(physics.card_cue(o['history'][0],o['source'],cat)['key'],k)
                        if e['nextAction'] in ('go','avoid'):self.assertEqual(e['nextAction']=='avoid',bool(physics.hazard_categories(o['source'])))
                        else:self.assertNotIn(e['nextAction'],shown)
                    self.assertEqual(counts,Counter(votes))
                    if len(shown)==4:self.assertEqual(votes['go']+votes['avoid'],len(sheets));self.assertIn(votes['go'],(0,len(sheets)))
                for r in team['rounds']:
                    for mask,key in r['evidenceKeys'].items():
                        shown=[cat for j,cat in enumerate(physics.CATEGORIES) if int(mask)&(1<<j)]
                        if any(cat in r['hazardCategories'] for cat in shown):self.assertEqual(team['votesByCue'][key]['avoid'],len(sheets))
    def test_conditioning_reduces_expected_uncertainty(self):
        for cue in physics.CUES:
            d=evidence.distribution(cue['key'])
            self.assertTrue(all(g>=0 for g in d['gains'].values()))
            self.assertAlmostEqual(sum(d['weights'].values()),1)
            for cat in d['gains']:self.assertNotEqual(cat,cue['category'])
            if d['gains']:
                cat=max(d['gains'],key=d['gains'].get);records,_=evidence.archive();groups=Counter()
                for i in d['ids']:
                    r=records[i];extra=physics.card_cue(r['history'][0],r['source'],cat)
                    groups[evidence.evidence_key([cue,extra])]+=1
                expected=sum(n/len(d['ids'])*(evidence.distribution(k)['weights']['go']+evidence.distribution(k)['weights']['avoid']) for k,n in groups.items())
                self.assertGreaterEqual(expected+1e-10,d['weights']['go']+d['weights']['avoid'])

if __name__=='__main__':unittest.main()
