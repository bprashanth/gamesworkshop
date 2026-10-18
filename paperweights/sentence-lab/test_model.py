import json,subprocess,unittest
from pathlib import Path
from model import *

class SentenceTests(unittest.TestCase):
    def test_dealt_counts_and_closure_all_sizes(self):
        for count in (15,100,200):
            p=make_pack(count)
            self.assertEqual(len(p['sheets']),count)
            self.assertEqual(len(p['nodes']),24)
            for s in p['sheets']:
                self.assertEqual({e['fromKey'] for e in s['entries']},set(p['nodes']))
                self.assertTrue(all(e['toKey'] in p['nodes'] for e in s['entries']))
            for group,tallies in p['tallies'].items():
                for source,counts in tallies.items():
                    for target,n in counts.items():
                        self.assertEqual(n,sum(next(e for e in s['entries'] if e['fromKey']==source)['toKey']==target for s in p['sheets'] if s['group']==group))

    def test_no_self_loops_and_slot_reachability(self):
        for seed in range(50):
            p=make_pack(15,seed)
            for key,node in p['nodes'].items():
                self.assertNotIn(key,[e['to'] for e in node['edges']])
                seen=set();pending=[key]
                while pending:
                    here=pending.pop()
                    if here in seen:continue
                    seen.add(here);pending.extend(e['to'] for e in p['nodes'][here]['edges'])
                self.assertEqual({p['nodes'][k]['slot'] for k in seen if p['nodes'][k]['slot'] is not None},set(range(5)))

    def test_exact_chain_and_printed_support(self):
        p=make_pack()
        for variant in VARIANTS:
            for policy in ('representative','modal','sample'):
                r=run(p,variant['id'],policy)
                self.assertEqual(len(r['trace']),10)
                for t in r['trace']:
                    self.assertGreater(p['tallies'][t['group']][t['cueKey']][t['chosen']],0)
                    if variant['id']!='scheduled':self.assertEqual(t['nextCueKey'],t['chosen'])
                self.assertEqual(sum(t['group']=='A' for t in r['trace']),5)

    def test_javascript_python_reducer_parity(self):
        p=make_pack();cases=[]
        for variant in VARIANTS:
            for policy in ('representative','modal','sample'):
                trace=run(p,variant['id'],policy)['trace'];state=create_state(p,variant['id'])
                for t in trace:state=choose(p,state,t['chosen'],policy=='sample')
                cases.append(dict(variant=variant['id'],allowAll=policy=='sample',choices=[t['chosen'] for t in trace],expected={k:state[k] for k in ('slots','cueKey','turn','done')}))
        js="""import fs from 'node:fs';const data=JSON.parse(fs.readFileSync(0,'utf8'));const src=fs.readFileSync(data.module,'utf8');const m=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));for(const c of data.cases){let s=m.createState(data.pack,c.variant);for(const k of c.choices)s=m.choose(data.pack,s,k,c.allowAll);for(const key of Object.keys(c.expected))if(JSON.stringify(s[key])!==JSON.stringify(c.expected[key]))throw Error(key+' parity');}console.log('parity');"""
        result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(pack=p,cases=cases,module=str(Path(__file__).with_name('model.js')))),text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)

if __name__=='__main__':unittest.main()
