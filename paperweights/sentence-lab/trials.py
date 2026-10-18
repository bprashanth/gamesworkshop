"""Actual dealt-sheet traces plus unfiltered graph/policy comparisons."""
import json
from collections import Counter
from pathlib import Path
from model import *
ROOT=Path(__file__).parent

def main():
    examples=[];packs=[]
    for count in (15,100,200):
        p=make_pack(count);packs.append(dict(sheetCount=count,id=p['id']))
        if count==15:
            for variant in VARIANTS:
                for policy in ('representative','modal','sample'):
                    examples.append(run(p,variant['id'],policy))
            p['traces']=examples
            (ROOT/'pack.json').write_text(json.dumps(p,indent=2)+'\n')
        (ROOT/f'pack-{count}.json').write_text(json.dumps(p,indent=2)+'\n')
    comparisons=[]
    for count in (15,100,200):
        for variant in VARIANTS:
            for policy,rule in [('representative','leaders'),('representative','all'),('modal','leaders'),('sample','all')]:
                records=[];swapped=[]
                for seed in range(200):
                    p=make_pack(count,seed)
                    records.append(run(p,variant['id'],policy,seed,choice_rule=rule))
                    swapped.append(run(p,variant['id'],policy,seed,start_group='B',choice_rule=rule))
                hist=Counter(r['winner'] for r in records)
                comparisons.append(dict(sheetCount=count,variant=variant['id'],policy=policy,choiceRule=rule,seeds=200,outcomes=dict(hist),meanReversals=sum(r['reversals'] for r in records)/200,meanWords=sum(r['words'] for r in records)/200,meanUnchangedTurns=sum(r['unchangedTurns'] for r in records)/200,meanSlotsVisited=sum(r['slotsVisited'] for r in records)/200,zeroChoiceTurns=sum(r['zeroChoiceTurns'] for r in records),lastMoverWins=sum(r['winner']=='harmful' for r in records)/200,lastMoverWinsGoalsSwapped=sum(r['winner']=='helpful' for r in swapped)/200))
    report=dict(rehearsalSeed=DEFAULT_SEED,rehearsalSeedCurated=True,scoringDisclaimer='Authored action checklist, not natural-language sentiment or a human meaning judgment.',packs=packs,traces=examples,comparisons=comparisons)
    (ROOT/'trials.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps([c for c in comparisons if c['sheetCount']==15 and c['choiceRule']=='leaders'],indent=2))
if __name__=='__main__':main()
