"""PW3: unbiased next-square outcomes, with four-cue audience aggregation.

This imports the unchanged PW2 physical model, never its inspection-weighted votes.
"""
import argparse
import hashlib
import json
import random
from functools import lru_cache
from pathlib import Path
try:
    from . import generate as physics
except ImportError:
    import generate as physics

ACTIONS=('go','avoid')
DEFAULT_SEED=physics.DEFAULT_SEED

@lru_cache(maxsize=1)
def outcome_buckets():
    records,old_buckets=physics.archive()
    buckets={}
    for key,groups in old_buckets.items():
        bucket={action:[] for action in ACTIONS}
        for hazards,indices in groups.items():bucket['avoid' if hazards else 'go'].extend(indices)
        buckets[key]=bucket
    return records,buckets

@lru_cache(maxsize=24)
def outcome_weights(key):
    _,buckets=outcome_buckets();counts={a:len(ids) for a,ids in buckets[key].items()};n=sum(counts.values())
    return {a:counts[a]/n for a in ACTIONS}

def quotas(weights,n):
    raw={a:weights[a]*n for a in ACTIONS};counts={a:int(raw[a]) for a in ACTIONS}
    for a in sorted(ACTIONS,key=lambda a:(-(raw[a]-counts[a]),ACTIONS.index(a)))[:n-sum(counts.values())]:counts[a]+=1
    return counts

def person_vote(sheet,source_cues):
    entries={e['key']:e['nextAction'] for e in sheet['entries']}
    actions=[entries[source_cues[cat]['key']] for cat in physics.CATEGORIES]
    go=actions.count('go');avoid=4-go
    return 'go' if go>avoid else 'avoid' if avoid>go else 'abstain'

def aggregate_votes(sheets,source_cues):
    counts=dict(go=0,avoid=0,abstain=0)
    for sheet in sheets:counts[person_vote(sheet,source_cues)]+=1
    return counts

def make_pack(sheet_count=15,seed=DEFAULT_SEED):
    if sheet_count<12:raise ValueError('At least 12 sheets: three voters per team.')
    rng=random.Random(f'paperweights-binary-deal-v3:{seed}:{sheet_count}')
    records,buckets=outcome_buckets()
    pack=dict(version=3,format='next-square-go-avoid',seed=seed,sheetCount=sheet_count,roundCount=4,categories=physics.CATEGORIES,contexts=physics.CONTEXTS,actions=list(ACTIONS),teams=[],sheets=[],observations=[],aggregation='majority-of-four; 2-2 abstains',physicsVersion=2)
    for ti,team in enumerate('ABCD'):
        n=sheet_count//4+(ti<sheet_count%4)
        sheets=[dict(id=f'{len(pack["sheets"])+i+1:03}',team=team,entries=[]) for i in range(n)]
        tallies={}
        for cue in physics.CUES:
            key=cue['key'];counts=quotas(outcome_weights(key),n);tallies[key]=counts
            actions=[a for a in ACTIONS for _ in range(counts[a])];rng.shuffle(actions)
            for sheet,action in zip(sheets,actions):
                hid=f'{team}-{sheet["id"]}-{key}'
                sheet['entries'].append(dict(**cue,nextAction=action,historyId=hid))
                source_record=records[rng.choice(buckets[key][action])]
                pack['observations'].append(dict(**{k:v for k,v in source_record.items() if k!='id'},id=hid,archiveId=source_record['id'],nextAction=action,fatal=action=='avoid'))
        initial,rounds=physics.route(seed,team)
        for r in rounds:
            r['sourceCues']={cat:physics.card_cue(r['history'][0],r['source'],cat) for cat in physics.CATEGORIES}
            r['paperVotes']=aggregate_votes(sheets,r['sourceCues'])
            r['voters']=n
        pack['teams'].append(dict(id=team,sheetIds=[s['id'] for s in sheets],initialCue=initial,votesByCue=tallies,rounds=rounds))
        pack['sheets']+=sheets
    digest=hashlib.sha256(json.dumps(pack,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:10]
    pack['packId']=f'PW3-{seed}-{sheet_count}-{digest}'
    return pack

def play(pack,policy='paper',tie_action='go'):
    """Reference only: the UI always lets the representative make the decision."""
    if tie_action not in ACTIONS:raise ValueError(tie_action)
    results=[]
    for team in pack['teams']:
        log=[];finished=True
        for r in team['rounds']:
            counts=r['paperVotes']
            if policy=='easy':action='avoid' if r['fatal'] else 'go'
            elif policy=='always-avoid':action='avoid'
            elif policy=='always-go':action='go'
            elif policy=='coin':action=ACTIONS[random.Random(f'coin:{pack["seed"]}:{team["id"]}:{r["index"]}').randrange(2)]
            else:action=max(ACTIONS,key=lambda a:counts[a]) if counts['go']!=counts['avoid'] else tie_action
            survived=(action=='avoid')==r['fatal']
            log.append(dict(round=r['index'],action=action,survived=survived,votes=counts,tied=counts['go']==counts['avoid']))
            if not survived:finished=False;break
        results.append(dict(team=team['id'],finished=finished,log=log))
    return results

def main():
    p=argparse.ArgumentParser();p.add_argument('--sheets',type=int,default=15);p.add_argument('--seed',type=int,default=DEFAULT_SEED);p.add_argument('--out',type=Path)
    a=p.parse_args();pack=make_pack(a.sheets,a.seed);out=a.out or Path(__file__).with_name(f'prediction-pack-{a.sheets}.json');out.write_text(json.dumps(pack,indent=2)+'\n');print(pack['packId'])
if __name__=='__main__':main()
