"""Evaluate held-out route seeds, without rejecting inconvenient outcomes."""
import json
from collections import Counter
from pathlib import Path
from generate import *

def run(seeds=500):
    report={'seeds':seeds,'policies':{},'default':{},'participation':1.0,'demoSeed':374,'demoSeedSelectedDuringRehearsal':True}
    for count in (15,100,200):
        sums={p:Counter() for p in ('paper','uninformed')};ends={p:Counter() for p in sums}
        for seed in range(seeds):
            pack=make_pack(count,seed)
            for policy in sums:
                results=play(pack,policy)
                sums[policy][sum(r['finished'] for r in results)]+=1
                for r in results:ends[policy][len(r['log'])]+=1
        report['policies'][str(count)]={p:{'survivorHistogram':dict(sorted(h.items())), 'meanFinishers':sum(k*v for k,v in h.items())/seeds,'oneOrTwoFinishers':(h[1]+h[2])/seeds,'stopsByRound':dict(sorted(ends[p].items()))} for p,h in sums.items()}
        report['default'][str(count)]=play(make_pack(count,374))
    Path(__file__).with_name('simulation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report['policies'],indent=2))
    return report
if __name__=='__main__':run()
