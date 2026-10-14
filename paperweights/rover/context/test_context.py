import unittest
from itertools import product
from context_world import CONTEXTS,context,kernel,category_weights,make_pack

class ContextTests(unittest.TestCase):
    def test_same_icon_has_six_contexts(self):
        colors=set()
        for older,previous,slope in product(('clear','haze'),('clear','haze'),('flat','tilted')):
            colors.add(context({'dust':older},{'dust':previous},{'dust':'haze','slope':slope})['name'])
        self.assertEqual(colors,{c['name'] for c in CONTEXTS})

    def test_context_changes_predictions(self):
        def storm_prob(older,previous,slope):
            current={'dust':'haze','ground':'firm','slope':slope,'battery':'full'}
            rows=list(kernel({'dust':older},{'dust':previous},current))
            self.assertAlmostEqual(sum(p for r,p in rows),1)
            return sum(p for r,p in rows if r['dust']=='storm')
        self.assertAlmostEqual(storm_prob('haze','haze','tilted'),.90*9/14)
        self.assertAlmostEqual(storm_prob('haze','haze','flat'),.55*9/14)
        self.assertGreater(storm_prob('haze','haze','tilted'),storm_prob('clear','haze','tilted'))

    def test_storm_can_be_red_or_blue(self):
        current={'dust':'storm','ground':'firm','slope':'steep','battery':'full'}
        self.assertEqual(context({'dust':'haze'},{'dust':'haze'},current)['name'],'RED')
        self.assertEqual(context({'dust':'clear'},{'dust':'haze'},current)['name'],'BLUE')
        for row,p in kernel({'dust':'clear'},{'dust':'haze'},current):
            self.assertEqual(row['battery'],'dead')
            self.assertNotEqual(row['dust'],'storm')

    def test_pack_and_stage_use_same_key_and_actual_votes(self):
        sheets,stages,history=make_pack()
        self.assertEqual(len(sheets),60)
        for sheet in sheets:
            entries=sheet['entries']
            self.assertEqual(len(entries),24)
            self.assertEqual(len({(e['context'],e['category'],e['value']) for e in entries}),24)
            for e in entries:
                r=e['record']
                self.assertTrue(any(n==r['next'] for n,p in kernel(r['older'],r['previous'],r['current'])))
                self.assertAlmostEqual(sum(category_weights(r['next']).values()),1)
        all_keys={(r['context'],cat,r['current'][cat]) for r in history
                  for cat in ('battery','slope','dust','ground')}
        for team in 'ABCD':
            from collections import Counter
            covered=Counter((e['context'],e['category'],e['value'])
                            for s in sheets if s['team']==team for e in s['entries'])
            self.assertEqual(set(covered),all_keys)
            self.assertGreaterEqual(min(covered.values()),2)
        self.assertTrue(any(e['vote']=='slope' and e['context']=='RED' and e['value']=='storm'
                            for s in sheets for e in s['entries']))
        for stage in stages:
            r=stage['record']
            self.assertEqual(context(r['older'],r['previous'],r['current'])['name'],stage['call'][0])
            self.assertEqual(r['current'][stage['call'][1]],stage['call'][2])
            votes=[]
            for s in sheets:
                if s['team']==stage['team']:
                    matches=[e for e in s['entries'] if (e['context'],e['category'],e['value'])==stage['call']]
                    self.assertEqual(len(matches),1)
                    votes.append(matches[0]['vote'])
            for cat,n in stage['votes'].items():self.assertEqual(votes.count(cat),n)
            self.assertTrue(any(n==stage['sealed_next'] for n,p in kernel(r['older'],r['previous'],r['current'])))

if __name__=='__main__':unittest.main(verbosity=2)
