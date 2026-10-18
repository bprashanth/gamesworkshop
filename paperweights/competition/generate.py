"""Continuous Rover transition model shared by paper observations and live routes."""
import argparse
import hashlib
import json
import random
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

CATEGORIES=['battery','slope','dust','ground']
DEFAULT_SEED=15
CONTEXTS=[dict(id=f'C{i+1:02}',name=n,colorName=n,light=l,dark=d,pattern=i+1) for i,(n,l,d) in enumerate([
 ('RED','#a74638','#d06c58'),('BLUE','#316b8c','#6ca4c4'),('AMBER','#8b681d','#bd9c4e'),
 ('GREEN','#39785c','#75ae8e'),('PURPLE','#72528e','#ad91c4'),('PINK','#a24b7d','#ce83ae')])]
VALUES={'battery':['full','dead'],'slope':['flat','tilted','steep'],'dust':['clear','haze','storm'],'ground':['firm','soft','sand']}

def cue(category,value,context):
    return dict(key=f'{context}:{category}:{value}',context=context,category=category,value=value)

CUES=[]
for category,values in VALUES.items():
    colors={'battery':['C01','C02'],'dust':['C01','C02'],'ground':['C03','C04'],'slope':['C05','C06']}[category]
    for value in values:
        for color in colors+(['C05'] if value in ('haze','soft') else []):CUES.append(cue(category,value,color))
CUES.sort(key=lambda c:(c['context'],CATEGORIES.index(c['category']),VALUES[c['category']].index(c['value'])))

def signal_hazard(row):return row['dust']=='storm' or row['ground']=='sand'
def hazard_categories(row):return [cat for cat,value in [('battery','dead'),('dust','storm'),('ground','sand')] if row[cat]==value]

def card_cue(older,row,category):
    value=row[category]
    if value in ('haze','soft') and signal_hazard(older):color='C05'
    elif category in ('battery','dust'):color='C01' if older['dust']=='haze' else 'C02'
    elif category=='ground':color='C03' if older['ground']=='soft' else 'C04'
    else:color='C05' if signal_hazard(older) else 'C06'
    return cue(category,value,color)

def draw_target(older,current,rng):
    """Qualitative Rover physics with authored context-sensitive frequencies."""
    slope=rng.choices(['flat','tilted','steep'],[.30,.45,.25])[0]
    storm_rate=.80 if older['dust']=='haze' else .50
    sand_rate=.70 if older['ground']=='soft' else .45
    dust='storm' if current['dust']=='haze' and slope!='flat' and rng.random()<storm_rate else rng.choice(['clear','haze'])
    ground='sand' if current['ground']=='soft' and slope!='steep' and rng.random()<sand_rate else rng.choice(['firm','soft'])
    return dict(battery='dead' if signal_hazard(current) else 'full',slope=slope,dust=dust,ground=ground)

def selection_weights(hazards):
    weights={cat:.05 for cat in CATEGORIES}
    for cat in hazards or CATEGORIES:weights[cat]+=.8/len(hazards or CATEGORIES)
    return weights

@lru_cache(maxsize=1)
def archive():
    rng=random.Random('paperweights-continuous-archive-v2')
    initial=dict(battery='full',slope='flat',dust='clear',ground='firm')
    older,previous,current=[dict(initial) for _ in range(3)]
    records=[];buckets=defaultdict(lambda:defaultdict(list))
    for i in range(60500):
        target=draw_target(older,current,rng)
        if i>=500:
            idx=len(records);record=dict(id=f'H{idx:05}',history=[older,previous],source=current,target=target)
            records.append(record);hazards=tuple(hazard_categories(target))
            for cat in CATEGORIES:buckets[card_cue(older,current,cat)['key']][hazards].append(idx)
        older,previous,current=previous,current,target
    assert set(buckets)=={c['key'] for c in CUES}
    return records,{key:dict(groups) for key,groups in buckets.items()}

@lru_cache(maxsize=24)
def vote_weights_for_key(key):
    _,buckets=archive();groups=buckets[key];total=sum(map(len,groups.values()))
    return {cat:sum(len(ids)*selection_weights(h)[cat] for h,ids in groups.items())/total for cat in CATEGORIES}

def vote_weights(c):return vote_weights_for_key(c['key'])

def quotas(weights,n):
    raw={k:n*v for k,v in weights.items()};result={k:int(v) for k,v in raw.items()}
    for k in sorted(weights,key=lambda k:(-(raw[k]-result[k]),CATEGORIES.index(k)))[:n-sum(result.values())]:result[k]+=1
    return result

def historical(c,category,rng,hid):
    records,buckets=archive();groups=buckets[c['key']]
    hazards=rng.choices(list(groups),[len(ids)*selection_weights(h)[category] for h,ids in groups.items()])[0]
    r=records[rng.choice(groups[hazards])]
    return dict(**{k:v for k,v in r.items() if k!='id'},id=hid,archiveId=r['id'],inspection=category)

def route(seed,team,round_count=4):
    rng=random.Random(f'paperweights-map-v2:{seed}:{team}')
    initial=dict(battery='full',slope='flat',dust='clear',ground='firm')
    older,previous,current=[dict(initial) for _ in range(3)]
    for _ in range(50):older,previous,current=previous,current,draw_target(older,current,rng)
    initial_categories=[cat for cat in ('dust','ground') if current[cat] in ('haze','soft')] or CATEGORIES
    initial_cue=card_cue(older,current,rng.choice(initial_categories));rounds=[]
    for i in range(round_count):
        target=draw_target(older,current,rng);hazards=hazard_categories(target)
        rounds.append(dict(index=i+1,history=[older,previous],source=current,target=target,fatal=bool(hazards),hazardCategories=hazards,targetCues={cat:card_cue(previous,target,cat) for cat in CATEGORIES}))
        older,previous,current=previous,current,target
    return initial_cue,rounds

def make_pack(sheet_count=15,seed=DEFAULT_SEED):
    if sheet_count<12:raise ValueError('At least 12 sheets: three voters per team.')
    rng=random.Random(seed)
    pack=dict(version=2,seed=seed,sheetCount=sheet_count,roundCount=4,categories=CATEGORIES,contexts=CONTEXTS,teams=[],sheets=[],observations=[])
    for ti,team in enumerate('ABCD'):
        n=sheet_count//4+(ti<sheet_count%4)
        sheets=[dict(id=f'{len(pack["sheets"])+i+1:03}',team=team,entries=[]) for i in range(n)]
        votes_by_cue={}
        for c in CUES:
            counts=quotas(vote_weights(c),n);votes_by_cue[c['key']]=counts
            suggestions=[cat for cat in CATEGORIES for _ in range(counts[cat])];rng.shuffle(suggestions)
            for sheet,category in zip(sheets,suggestions):
                hid=f'{team}-{sheet["id"]}-{c["key"]}'
                sheet['entries'].append(dict(**c,nextCategory=category,historyId=hid))
                pack['observations'].append(historical(c,category,rng,hid))
        initial_cue,rounds=route(seed,team)
        pack['sheets']+=sheets
        pack['teams'].append(dict(id=team,sheetIds=[s['id'] for s in sheets],initialCue=initial_cue,votesByCue=votes_by_cue,rounds=rounds))
    digest=hashlib.sha256(json.dumps(pack,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:10]
    pack['packId']=f'PW2-{seed}-{sheet_count}-{digest}'
    return pack

def play(pack,policy='paper'):
    results=[]
    for team in pack['teams']:
        finished=True;log=[];current=team['initialCue']
        for r in team['rounds']:
            votes=team['votesByCue'][current['key']]
            chosen=max(CATEGORIES,key=lambda cat:votes[cat]) if policy=='paper' else CATEGORIES[(pack['seed']+r['index']+ord(team['id']))%4]
            decision='avoid' if chosen in r['hazardCategories'] else 'go'
            survived=decision=='avoid' or not r['fatal']
            log.append(dict(round=r['index'],cue=current,category=chosen,decision=decision,survived=survived,revealedCue=r['targetCues'][chosen]))
            current=r['targetCues'][chosen]
            if not survived:finished=False;break
        results.append(dict(team=team['id'],finished=finished,log=log))
    return results

def simulation_pack(sheet_count=15,seed=DEFAULT_SEED):
    teams=[]
    for ti,team in enumerate('ABCD'):
        n=sheet_count//4+(ti<sheet_count%4)
        initial,rounds=route(seed,team)
        teams.append(dict(id=team,initialCue=initial,rounds=rounds,votesByCue={c['key']:quotas(vote_weights(c),n) for c in CUES}))
    return dict(seed=seed,teams=teams)


def main():
    p=argparse.ArgumentParser();p.add_argument('--sheets',type=int,default=15);p.add_argument('--seed',type=int,default=DEFAULT_SEED);p.add_argument('--out',type=Path)
    args=p.parse_args();pack=make_pack(args.sheets,args.seed);dest=args.out or Path(__file__).parent/f'pack-{args.sheets}.json'
    dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(pack,indent=2)+'\n');print(pack['packId']);print(json.dumps(play(pack)))
if __name__=='__main__':main()
