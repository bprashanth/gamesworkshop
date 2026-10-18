"""Reproducible policy checks, not a claim about human play."""
import json
from pathlib import Path
import evidence as mixed
import generate as physics

def play(p,policy):
    result=[]
    for t in p['teams']:
        tokens=3;log=[]
        for r in t['rounds']:
            revealed=[r['initialCategory']]
            while True:
                if any(c in physics.hazard_categories(r['target']) for c in revealed):action='avoid';break
                votes=t['votesByCue'][mixed.evidence_key([r['targetCues'][c] for c in revealed])]
                decision='avoid' if votes['avoid']>votes['go'] else 'go'
                candidates=[c for c in physics.CATEGORIES if c not in revealed]
                best=max(candidates,key=lambda c:votes[c]) if candidates else None
                if policy=='inspect' and tokens and best and votes[best]>=max(votes['go'],votes['avoid']):
                    revealed.append(best);tokens-=1;continue
                action=decision;break
            survived=(action=='avoid')==r['fatal'];log.append(dict(turn=r['index'],revealed=revealed,action=action,survived=survived,tokens=tokens))
            if not survived:break
        result.append(dict(team=t['id'],finished=len(log)==p['roundCount'] and log[-1]['survived'],log=log))
    return result

if __name__=='__main__':
    report={'note':'Decision ties choose Go; inspection ties favor spending. Visible kills always Avoid. Authored policies, not human results.','rehearsal':{},'seeds':100,'meanFinishers':{}}
    for n in (15,200):
        p=mixed.make_pack(n);report['rehearsal'][n]={policy:play(p,policy) for policy in ('decision','inspect')}
        totals={policy:0 for policy in ('decision','inspect')}
        for seed in range(100):
            p=mixed.make_pack(n,seed)
            for policy in totals:totals[policy]+=sum(t['finished'] for t in play(p,policy))
        report['meanFinishers'][n]={k:v/100 for k,v in totals.items()}
    Path(__file__).with_name('evidence-trials.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'meanFinishers':report['meanFinishers'],'rehearsal':{n:{k:sum(t['finished'] for t in v) for k,v in x.items()} for n,x in report['rehearsal'].items()}},indent=2))
