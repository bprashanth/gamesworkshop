"""PW5 rehearsal data: one mixed-action lookup per historical cue, no PDFs."""
import hashlib
import json
import random
from pathlib import Path
import dual
import generate as physics

ACTIONS=['go','avoid',*physics.CATEGORIES]

def make_pack(sheet_count=200,seed=15,round_count=6):
    if not 12<=sheet_count<=200:raise ValueError('Use 12-200 people')
    records,buckets=dual.archive()
    rng=random.Random(f'pw5:{seed}:{sheet_count}')
    p=dict(version=5,format='mixed-historical-actions',seed=seed,sheetCount=sheet_count,roundCount=round_count,revealTokens=3,categories=physics.CATEGORIES,contexts=physics.CONTEXTS,teams=[],sheets=[],observations=[])
    for ti,team in enumerate('ABCD'):
        n=sheet_count//4+(ti<sheet_count%4)
        sheets=[dict(id=f'{len(p["sheets"])+j+1:03}',team=team,entries=[]) for j in range(n)]
        tallies={}
        for cue in physics.CUES:
            groups=buckets[cue['key']]
            # Authored historical coverage: half complete-row records, half
            # inspection recommendations. A visible kill needs no further check.
            visible_kill=(cue['category'],cue['value']) in (('battery','dead'),('dust','storm'),('ground','sand'))
            weights={a:0. for a in ACTIONS}
            for model in ('decision','inspection'):
                total=sum(map(len,groups[model].values()))
                mass=(1 if model=='decision' else 0) if visible_kill else .5
                for a,ids in groups[model].items():weights[a]+=mass*len(ids)/total
            raw={a:n*w for a,w in weights.items()};counts={a:int(v) for a,v in raw.items()}
            # Seeded tie order prevents systematically favoring a category.
            order=ACTIONS.copy();rng.shuffle(order)
            for a in sorted(order,key=lambda a:-(raw[a]-counts[a]))[:n-sum(counts.values())]:counts[a]+=1
            tallies[cue['key']]=counts
            answers=[a for a in ACTIONS for _ in range(counts[a])];rng.shuffle(answers)
            for sheet,a in zip(sheets,answers):
                model='decision' if a in ('go','avoid') else 'inspection'
                r=records[rng.choice(groups[model][a])];hid=f'{sheet["id"]}:{cue["key"]}'
                sheet['entries'].append(dict(**cue,nextAction=a,historyId=hid))
                p['observations'].append(dict(id=hid,archiveId=r['id'],history=r['history'],source=r['source'],answer=a,coverage='complete' if model=='decision' else 'inspection'))
        _,rounds=physics.route(seed,team,round_count)
        route_rng=random.Random(f'pw5-opening:{seed}:{team}')
        for r in rounds:r['initialCategory']=route_rng.choice(physics.CATEGORIES)
        p['teams'].append(dict(id=team,sheetIds=[s['id'] for s in sheets],votesByCue=tallies,rounds=rounds));p['sheets']+=sheets
    digest=hashlib.sha256(json.dumps(p,sort_keys=True).encode()).hexdigest()[:10]
    p['packId']=f'PW5-{seed}-{sheet_count}-{digest}'
    return p

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1];index=[]
    for n in (15,200):
        p=make_pack(n);filename=f'{p["packId"]}.json';(root/'web/packs'/filename).write_text(json.dumps(p,separators=(',',':'))+'\n')
        if n==200:(root/'web/pack.json').write_text(json.dumps(p,separators=(',',':'))+'\n')
        index.append(dict(packId=p['packId'],sheetCount=n,seed=p['seed'],url=f'packs/{filename}'))
        print(p['packId'])
    (root/'web/packs/index.json').write_text(json.dumps(index,indent=2)+'\n')
