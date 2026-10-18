"""PW4: two historical models of the SAME column, with one-cue lookups."""
import hashlib
import json
import random
from functools import lru_cache
import generate as physics
DEFAULT_SEED=physics.DEFAULT_SEED

@lru_cache(maxsize=1)
def archive():
    records,_=physics.archive()
    buckets={c['key']:{'decision':{},'inspection':{}} for c in physics.CUES}
    rng=random.Random('pw4-historical-inspection')
    for i,r in enumerate(records):
        hazards=physics.hazard_categories(r['source'])
        for cat in physics.CATEGORIES:
            key=physics.card_cue(r['history'][0],r['source'],cat)['key']
            # Retrospective inspection: a hidden kill when one exists; otherwise
            # a sampled other category. No live-map outcome enters these labels.
            candidates=[c for c in hazards if c!=cat] or [c for c in physics.CATEGORIES if c!=cat]
            answers={'decision':'avoid' if hazards else 'go','inspection':rng.choice(candidates)}
            for model,answer in answers.items():buckets[key][model].setdefault(answer,[]).append(i)
    return records,buckets

def make_pack(sheet_count=15,seed=DEFAULT_SEED):
    if not 12<=sheet_count<=200:raise ValueError('Use 12-200 sheets')
    rng=random.Random(f'pw4:{seed}:{sheet_count}')
    records,buckets=archive()
    pack=dict(version=4,format='same-column-dual-model',seed=seed,sheetCount=sheet_count,roundCount=4,categories=physics.CATEGORIES,contexts=physics.CONTEXTS,teams=[],sheets=[],observations=[])
    for ti,team in enumerate('ABCD'):
        n=sheet_count//4+(ti<sheet_count%4)
        roles=['decision']*((n+(ti%2==0))//2)
        roles+=['inspection']*(n-len(roles));rng.shuffle(roles)
        sheets=[dict(id=f'{len(pack["sheets"])+j+1:03}',team=team,model=role,entries=[]) for j,role in enumerate(roles)]
        tallies={c['key']:{} for c in physics.CUES}
        for cue in physics.CUES:
            for model in ('decision','inspection'):
                own=[s for s in sheets if s['model']==model];groups=buckets[cue['key']][model];total=sum(map(len,groups.values()))
                raw={a:len(ids)*len(own)/total for a,ids in groups.items()};counts={a:int(v) for a,v in raw.items()}
                for a in sorted(raw,key=lambda a:-(raw[a]-counts[a]))[:len(own)-sum(counts.values())]:counts[a]+=1
                answers=[a for a,n in counts.items() for _ in range(n)];rng.shuffle(answers)
                tallies[cue['key']].update(counts)
                for s,a in zip(own,answers):
                    r=records[rng.choice(groups[a])];hid=f'{s["id"]}:{cue["key"]}'
                    s['entries'].append(dict(**cue,nextAction=a,historyId=hid))
                    pack['observations'].append(dict(id=hid,archiveId=r['id'],history=r['history'],source=r['source'],model=model,answer=a))
        _,rounds=physics.route(seed,team)
        for r in rounds:
            # Same target column in both modes. Medium hides three cards; it
            # never asks a current-row question about a different next row.
            r['initialCategory']=rng.choice(physics.CATEGORIES)
        pack['teams'].append(dict(id=team,sheetIds=[s['id'] for s in sheets],votesByCue=tallies,rounds=rounds))
        pack['sheets']+=sheets
    digest=hashlib.sha256(json.dumps(pack,sort_keys=True).encode()).hexdigest()[:10]
    pack['packId']=f'PW4-{seed}-{sheet_count}-{digest}'
    return pack
