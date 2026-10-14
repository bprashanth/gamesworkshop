"""Reproducible, stratified historical observations and independently drawn checkpoints."""
import argparse
import hashlib
import json
import random
from pathlib import Path

CATEGORIES = ['battery', 'slope', 'dust', 'ground']
CONTEXTS = [
    dict(id=f'C{i+1:02}', name=n, light=l, dark=d, pattern=i+1)
    for i,(n,l,d) in enumerate([
        ('persistent / uneven','#a74638','#d06c58'),('fresh / uneven','#316b8c','#6ca4c4'),
        ('other / uneven','#8b681d','#bd9c4e'),('persistent / flat','#39785c','#75ae8e'),
        ('fresh / flat','#72528e','#ad91c4'),('other / flat','#a24b7d','#ce83ae')])]
CUES = [dict(key=f'{c["id"]}:{cat}:{value}',context=c['id'],category=cat,value=value)
        for c in CONTEXTS for cat,value in [('dust','clear'),('dust','haze'),('dust','storm') if c['id'] in ('C01','C02') else ('battery','full'),('ground','soft')]]

def context(history, source):
    older, previous = history
    h = (0 if older['dust']=='haze' else 1) if previous['dust']=='haze' else 2
    return f'C{h + (4 if source["slope"]=="flat" else 1):02}'

def context_source(cue, rng, outcome):
    c=int(cue['context'][1:])-1
    row=lambda:dict(battery='full',slope='flat',dust='clear',ground='firm')
    older,previous,source=row(),row(),row()
    if c%3==0: older['dust']=previous['dust']='haze'
    elif c%3==1: previous['dust']='haze'
    source['slope']='flat' if c>=3 else rng.choice(['tilted','steep'])
    source['dust']='haze' if outcome=='dust' else rng.choice(['clear','haze'])
    source['ground']='sand' if outcome=='battery' else 'soft'
    source[cue['category']]=cue['value']
    if source['dust']=='storm':previous['dust']='haze'
    if source['ground']=='sand':
        previous['ground']='soft'
        if source['slope']=='steep':source['slope']='tilted'
    return [older,previous],source

def kernel(cue):
    """Joint observation mixture conditioned on the printed cue.

    Additional source readings are latent to the audience. Every emitted
    transition obeys the original qualitative hazard rules.
    """
    c=int(cue['context'][1:])-1
    if cue['category']=='dust' and cue['value']=='storm':return [('battery',1.)]
    safe,p,q=[(.34,.40,.26),(.34,.34,.32),(.38,.34,.28),(.36,.35,.29),(.38,.32,.30),(.38,.33,.29)][c]
    if cue['category']=='ground':primary,secondary='ground','dust'
    elif cue['category']=='dust' and cue['value']=='clear':primary,secondary='ground','battery'
    else:primary,secondary=('dust','battery') if c<3 else ('battery','dust')
    return [('safe',safe),(primary,p),(secondary,q)]

def draw_observation(cue,rng,outcome=None):
    outcomes,weights=zip(*kernel(cue))
    outcome=outcome or rng.choices(outcomes,weights)[0]
    history,source=context_source(cue,rng,outcome)
    target=dict(battery='dead' if source['dust']=='storm' or source['ground']=='sand' else 'full',slope=rng.choice(['flat','tilted','steep']),dust=rng.choice(['clear','haze']),ground=rng.choice(['firm','soft']))
    if outcome=='dust':target['dust']='storm';target['slope']=rng.choice(['tilted','steep'])
    if outcome=='ground':target['ground']='sand';target['slope']=rng.choice(['flat','tilted'])
    return history,source,target,outcome

def selection_weights(outcome):
    # Historical inspection: 80% focused on the recorded failure, 20% exploratory.
    return {cat:(.85 if cat==outcome else .05) for cat in CATEGORIES} if outcome!='safe' else {cat:.25 for cat in CATEGORIES}

def vote_weights(cue):
    return {cat:sum(p*selection_weights(o)[cat] for o,p in kernel(cue)) for cat in CATEGORIES}

def quotas(weights,n):
    raw={k:n*v for k,v in weights.items()}; result={k:int(v) for k,v in raw.items()}
    for k in sorted(weights,key=lambda k:(-(raw[k]-result[k]),CATEGORIES.index(k)))[:n-sum(result.values())]: result[k]+=1
    return result

def historical(cue, category, rng, history_id):
    # Exact conditional draw P(outcome | sampled historical inspection category).
    outcomes,weights=zip(*[(o,p*selection_weights(o)[category]) for o,p in kernel(cue)])
    outcome=rng.choices(outcomes,weights)[0]
    history,source,target,_=draw_observation(cue,rng,outcome)
    return dict(id=history_id,history=history,source=source,target=target,outcome=outcome,inspection=category)

def make_pack(sheet_count=15,seed=374):
    if sheet_count<12: raise ValueError('At least 12 sheets: three voters per team.')
    rng=random.Random(seed)
    pack=dict(version=1,seed=seed,sheetCount=sheet_count,roundCount=4,categories=CATEGORIES,contexts=CONTEXTS,teams=[],sheets=[],observations=[])
    for ti,team in enumerate('ABCD'):
        n=sheet_count//4+(ti<sheet_count%4)
        sheets=[dict(id=f'{len(pack["sheets"])+i+1:03}',team=team,entries=[]) for i in range(n)]
        for cue in CUES:
            counts=quotas(vote_weights(cue),n)
            suggestions=[cat for cat in CATEGORIES for _ in range(counts[cat])];rng.shuffle(suggestions)
            for sheet,category in zip(sheets,suggestions):
                hid=f'{team}-{sheet["id"]}-{cue["key"]}'
                sheet['entries'].append(dict(**cue,nextCategory=category,historyId=hid))
                pack['observations'].append(historical(cue,category,rng,hid))
        # Map RNG is independent of paper count and dealing order. No winner rejection.
        route_rng=random.Random(f'paperweights-map-v1:{seed}:{team}')
        cues=route_rng.sample(CUES,4); rounds=[]
        for ri,cue in enumerate(cues):
            history,source,target,outcome=draw_observation(cue,route_rng)
            votes={cat:sum(next(e for e in s['entries'] if e['key']==cue['key'])['nextCategory']==cat for s in sheets) for cat in CATEGORIES}
            rounds.append(dict(index=ri+1,cue=cue,history=history,source=source,target=target,fatal=outcome!='safe',hazardCategories=[] if outcome=='safe' else [outcome],votes=votes,voters=n))
        pack['sheets']+=sheets
        pack['teams'].append(dict(id=team,sheetIds=[s['id'] for s in sheets],rounds=rounds))
    digest=hashlib.sha256(json.dumps(pack,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:10]
    pack['packId']=f'PW1-{seed}-{sheet_count}-{digest}'
    return pack

def play(pack,policy='paper'):
    results=[]
    for team in pack['teams']:
        finished=True; log=[]
        for r in team['rounds']:
            chosen=max(CATEGORIES,key=lambda cat:r['votes'][cat]) if policy=='paper' else CATEGORIES[(pack['seed']+r['index']+ord(team['id']))%4]
            decision='avoid' if chosen in r['hazardCategories'] else 'go'
            survived=(decision=='avoid')==r['fatal']
            log.append(dict(round=r['index'],category=chosen,decision=decision,survived=survived))
            if not survived:finished=False;break
        results.append(dict(team=team['id'],finished=finished,log=log))
    return results

def main():
    p=argparse.ArgumentParser();p.add_argument('--sheets',type=int,default=15);p.add_argument('--seed',type=int,default=374);p.add_argument('--out',type=Path)
    args=p.parse_args();pack=make_pack(args.sheets,args.seed);dest=args.out or Path(__file__).parent/f'pack-{args.sheets}.json'
    dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(pack,indent=2)+'\n');print(pack['packId']);print(json.dumps(play(pack)))
if __name__=='__main__':main()
