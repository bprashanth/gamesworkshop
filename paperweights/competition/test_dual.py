import unittest
from collections import Counter
import dual
import generate as physics

class DualTests(unittest.TestCase):
    def test_packs(self):
        for n in (15,100,200):
            p=dual.make_pack(n);observations={o['id']:o for o in p['observations']}
            for t in p['teams']:
                sheets=[s for s in p['sheets'] if s['team']==t['id']]
                roles=Counter(s['model'] for s in sheets)
                self.assertLessEqual(abs(roles['decision']-roles['inspection']),1)
                for cue in physics.CUES:
                    counts=Counter()
                    for s in sheets:
                        self.assertEqual(len(s['entries']),24)
                        e=next(e for e in s['entries'] if e['key']==cue['key']);o=observations[e['historyId']]
                        self.assertEqual(physics.card_cue(o['history'][0],o['source'],cue['category'])['key'],cue['key'])
                        hazards=physics.hazard_categories(o['source'])
                        if s['model']=='decision':self.assertEqual(e['nextAction'],'avoid' if hazards else 'go')
                        else:
                            self.assertNotEqual(e['nextAction'],cue['category'])
                            if any(c!=cue['category'] for c in hazards):self.assertIn(e['nextAction'],hazards)
                        counts[e['nextAction']]+=1
                    self.assertEqual(counts,Counter(t['votesByCue'][cue['key']]))
                for r in t['rounds']:
                    self.assertEqual(r['fatal'],bool(physics.hazard_categories(r['target'])))
                    for cat,cue in r['targetCues'].items():self.assertEqual(cue,physics.card_cue(r['history'][1],r['target'],cat))
                    self.assertIn(r['initialCategory'],physics.CATEGORIES)

if __name__=='__main__':unittest.main()
