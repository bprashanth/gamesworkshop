"""Unfiltered PW3 simulations; no curated replacement seed."""
import json
from collections import Counter
from pathlib import Path
import prediction as p

def run(seeds=200):
    report=dict(version=3,seeds=seeds,seedRange=[0,seeds-1],defaultSeed=p.DEFAULT_SEED,default={},sizes={},warning='Four marginal cue observations are correlated. Majority-of-four is a heuristic, not a posterior hazard probability.')
    for n in (15,100,200):
        hist={policy:Counter() for policy in ('paper-tie-go','paper-tie-avoid','always-go','always-avoid','coin','easy')}
        votes=Counter();group_ties=0;rounds=0;correct=Counter()
        for seed in range(seeds):
            pack=p.make_pack(n,seed)
            for policy in hist:
                results=p.play(pack,'paper' if policy.startswith('paper') else policy,'avoid' if policy=='paper-tie-avoid' else 'go')
                hist[policy][sum(r['finished'] for r in results)]+=1
            for team in pack['teams']:
                for r in team['rounds']:
                    rounds+=1;votes.update(r['paperVotes']);group_ties+=r['paperVotes']['go']==r['paperVotes']['avoid']
                    for tie in p.ACTIONS:
                        counts=r['paperVotes'];action=max(p.ACTIONS,key=lambda a:counts[a]) if counts['go']!=counts['avoid'] else tie
                        correct[tie]+=(action=='avoid')==r['fatal']
        report['sizes'][str(n)]=dict(survivors={policy:dict(histogram=dict(sorted(h.items())),mean=sum(k*v for k,v in h.items())/seeds) for policy,h in hist.items()},individualAbstentionRate=votes['abstain']/sum(votes.values()),groupTieRate=group_ties/rounds,allRoundAccuracy={tie:correct[tie]/rounds for tie in p.ACTIONS})
        pack=p.make_pack(n)
        report['default'][str(n)]=dict(packId=pack['packId'],tieGo=p.play(pack),tieAvoid=p.play(pack,tie_action='avoid'))
    Path(__file__).with_name('prediction-trials.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report['sizes'],indent=2))
    return report
if __name__=='__main__':run()
