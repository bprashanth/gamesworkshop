import unittest
from collections import Counter
import mixed
import generate as physics

class MixedTests(unittest.TestCase):
    def test_packs(self):
        packs=[mixed.make_pack(n) for n in (15,200)]
        self.assertEqual([t['rounds'] for t in packs[0]['teams']],[t['rounds'] for t in packs[1]['teams']])
        for p in packs:
            obs={o['id']:o for o in p['observations']}
            self.assertEqual(p['roundCount'],6)
            for t in p['teams']:
                sheets=[s for s in p['sheets'] if s['team']==t['id']]
                for cue in physics.CUES:
                    counts=Counter()
                    for s in sheets:
                        self.assertNotIn('model',s)
                        e=next(e for e in s['entries'] if e['key']==cue['key']);o=obs[e['historyId']];a=e['nextAction'];counts[a]+=1
                        self.assertEqual(physics.card_cue(o['history'][0],o['source'],cue['category'])['key'],cue['key'])
                        hazards=physics.hazard_categories(o['source'])
                        if a in ('go','avoid'):self.assertEqual(a,'avoid' if hazards else 'go')
                        else:
                            self.assertNotEqual(a,cue['category'])
                            if any(c!=cue['category'] for c in hazards):self.assertIn(a,hazards)
                        if (cue['category'],cue['value']) in [('dust','storm'),('battery','dead'),('ground','sand')]:self.assertEqual(a,'avoid')
                    self.assertEqual(counts,Counter(t['votesByCue'][cue['key']]))
                self.assertEqual(len(t['rounds']),6)
                for r in t['rounds']:
                    self.assertEqual(r['fatal'],bool(physics.hazard_categories(r['target'])))
                    for cat,c in r['targetCues'].items():self.assertEqual(c,physics.card_cue(r['history'][1],r['target'],cat))

if __name__=='__main__':unittest.main()
