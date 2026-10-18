"""PW6 digital rehearsal: mixed actions conditioned on all revealed evidence."""
import hashlib
import json
import math
import random
from functools import lru_cache
from pathlib import Path
import generate as physics

ACTIONS=['go','avoid',*physics.CATEGORIES]

def entropy(p):
    return 0 if p in (0,1) else -p*math.log2(p)-(1-p)*math.log2(1-p)

@lru_cache(maxsize=1)
def archive():
    records,_=physics.archive();index={c['key']:set() for c in physics.CUES}
    for i,r in enumerate(records):
        for cat in physics.CATEGORIES:index[physics.card_cue(r['history'][0],r['source'],cat)['key']].add(i)
    return records,index

def evidence_key(cues):return '|'.join(sorted(c['key'] for c in cues))

@lru_cache(maxsize=10000)
def distribution(key):
    records,index=archive();keys=key.split('|');ids=sorted(set.intersection(*(index[k] for k in keys)))
    if not ids:raise ValueError(f'No matching historical evidence: {key}')
    shown={k.split(':')[1] for k in keys};hazards=[bool(physics.hazard_categories(records[i]['source'])) for i in ids];risk=sum(hazards)/len(ids)
    gains={};base=entropy(risk)
    for cat in physics.CATEGORIES:
        if cat in shown:continue
        groups={}
        for i,h in zip(ids,hazards):
            r=records[i];c=physics.card_cue(r['history'][0],r['source'],cat)['key'];groups.setdefault(c,[]).append(h)
        gains[cat]=max(0,base-sum(len(g)/len(ids)*entropy(sum(g)/len(g)) for g in groups.values()))
    weights={a:0. for a in ACTIONS}
    # Decision mass grows with predictive certainty, not number of flips.
    # Squaring sharpens the preference for useful inspection under uncertainty.
    inspect=0 if not gains or max(gains.values())<1e-10 else .9*base
    weights['go']=(1-inspect)*(1-risk);weights['avoid']=(1-inspect)*risk
    total=sum(g*g for g in gains.values())
    for cat,g in gains.items():weights[cat]=inspect*g*g/total if total else 0
    return dict(weights=weights,risk=risk,support=len(ids),gains=gains,ids=ids)

def make_pack(sheet_count=200,seed=15,round_count=6):
    if not 12<=sheet_count<=200:raise ValueError('Use 12-200 people')
    rng=random.Random(f'pw6:{seed}:{sheet_count}');records,_=archive()
    p=dict(version=6,format='cumulative-evidence',seed=seed,sheetCount=sheet_count,roundCount=round_count,revealTokens=3,categories=physics.CATEGORIES,contexts=physics.CONTEXTS,teams=[],sheets=[],observations=[],digitalOnly=True)
    for ti,team in enumerate('ABCD'):
        n=sheet_count//4+(ti<sheet_count%4);sheets=[dict(id=f'{len(p["sheets"])+j+1:03}',team=team,entries=[]) for j in range(n)]
        _,rounds=physics.route(seed,team,round_count);route_rng=random.Random(f'pw5-opening:{seed}:{team}')
        keys={}
        for r in rounds:
            r['initialCategory']=route_rng.choice(physics.CATEGORIES);r['evidenceKeys']={}
            for mask in range(1,16):
                cues=[r['targetCues'][cat] for j,cat in enumerate(physics.CATEGORIES) if mask&(1<<j)]
                key=evidence_key(cues);r['evidenceKeys'][str(mask)]=key;keys[key]=cues
        tallies={};stats={}
        for key,cues in sorted(keys.items()):
            d=distribution(key);raw={a:n*d['weights'][a] for a in ACTIONS};counts={a:int(v) for a,v in raw.items()};order=ACTIONS.copy();rng.shuffle(order)
            for a in sorted(order,key=lambda a:-(raw[a]-counts[a]))[:n-sum(counts.values())]:counts[a]+=1
            answers=[a for a in ACTIONS for _ in range(counts[a])];rng.shuffle(answers);tallies[key]=counts;stats[key]={k:d[k] for k in ('risk','support','gains')}
            groups={a:[i for i in d['ids'] if bool(physics.hazard_categories(records[i]['source']))==(a=='avoid')] for a in ('go','avoid')}
            for sheet,a in zip(sheets,answers):
                i=rng.choice(groups[a] if a in groups else d['ids']);r=records[i];hid=f'{sheet["id"]}:{key}'
                sheet['entries'].append(dict(key=key,nextAction=a,historyId=hid))
                p['observations'].append(dict(id=hid,archiveId=r['id'],history=r['history'],source=r['source'],answer=a))
        p['teams'].append(dict(id=team,sheetIds=[s['id'] for s in sheets],votesByCue=tallies,evidenceStats=stats,rounds=rounds));p['sheets']+=sheets
    digest=hashlib.sha256(json.dumps(p,sort_keys=True).encode()).hexdigest()[:10];p['packId']=f'PW6-{seed}-{sheet_count}-{digest}';return p

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1];index=[]
    for n in (15,200):
        p=make_pack(n);filename=p['packId']+'.json';(root/'web/packs'/filename).write_text(json.dumps(p,separators=(',',':'))+'\n')
        if n==200:(root/'web/pack.json').write_text(json.dumps(p,separators=(',',':'))+'\n')
        index.append(dict(packId=p['packId'],sheetCount=n,seed=p['seed'],url='packs/'+filename));print(p['packId'],flush=True)
    (root/'web/packs/index.json').write_text(json.dumps(index,indent=2)+'\n')
