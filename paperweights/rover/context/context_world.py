"""Context-colored teaching world. Proposed extension, not the frozen game engine."""
import random
from collections import defaultdict
from itertools import product

CATEGORIES=('battery','slope','dust','ground')
# History is deliberately bucketed, not a lossless encoding of every past reading.
CONTEXTS=[
 {'name':'RED','fill':'#dc2626','history':'persistent haze','terrain':'non-flat','storm_rate':.90},
 {'name':'BLUE','fill':'#2563eb','history':'fresh haze','terrain':'non-flat','storm_rate':.60},
 {'name':'AMBER','fill':'#d97706','history':'other','terrain':'non-flat','storm_rate':.35},
 {'name':'GREEN','fill':'#16a34a','history':'persistent haze','terrain':'flat','storm_rate':.55},
 {'name':'PURPLE','fill':'#7c3aed','history':'fresh haze','terrain':'flat','storm_rate':.30},
 {'name':'PINK','fill':'#db2777','history':'other','terrain':'flat','storm_rate':.15},
]
BY_NAME={c['name']:c for c in CONTEXTS}

def context(older,previous,current):
    history=('persistent haze' if older['dust']=='haze' else 'fresh haze') if previous['dust']=='haze' else 'other'
    terrain='flat' if current['slope']=='flat' else 'non-flat'
    return next(c for c in CONTEXTS if c['history']==history and c['terrain']==terrain)

def hazard(row):
    return row['ground']=='sand' or row['dust']=='storm'

def kernel(older,previous,current):
    c=context(older,previous,current)
    for slope,ps in [('flat',5/14),('tilted',6/14),('steep',3/14)]:
        sand=.65 if current['ground']=='soft' and slope!='steep' else 0
        storm=c['storm_rate'] if current['dust']=='haze' and slope!='flat' else 0
        ground={'sand':sand,'firm':(1-sand)/2,'soft':(1-sand)/2}
        dust={'storm':storm,'clear':(1-storm)/2,'haze':(1-storm)/2}
        for g,d in product(ground,dust):
            p=ps*ground[g]*dust[d]
            if p:
                yield {'slope':slope,'ground':g,'dust':d,
                       'battery':'dead' if hazard(current) else 'full'},p

def draw(older,previous,current,rng):
    rows,weights=zip(*kernel(older,previous,current))
    return dict(rng.choices(rows,weights=weights)[0])

def archive(size=30000,seed=1259):
    rng=random.Random(seed)
    initial={'slope':'flat','ground':'firm','dust':'clear','battery':'full'}
    older,previous,current=[dict(initial) for _ in range(3)]
    out=[]
    for i in range(size+500):
        nxt=draw(older,previous,current,rng)
        if i>=500:
            out.append({'id':f'C{i-499:05d}','older':older,'previous':previous,
                        'current':current,'next':nxt,'context':context(older,previous,current)['name']})
        older,previous,current=previous,current,nxt
    return out

def category_weights(next_row):
    """A declared observation-selection policy, not a natural property of a map.

    75% of observation choices select a dangerous next reading, if one occurred;
    25% inspect uniformly. If no danger occurred, inspect uniformly.
    """
    dangerous=[c for c,v in [('battery','dead'),('dust','storm'),('ground','sand')] if next_row[c]==v]
    weights={c:.25/4 for c in CATEGORIES}
    for c in dangerous or CATEGORIES:
        weights[c]+=.75/len(dangerous or CATEGORIES)
    return weights

def make_pack(people_per_team=15,seed=42):
    history=archive()
    buckets=defaultdict(list)
    for record in history:
        for cat in CATEGORIES:
            buckets[(record['context'],cat,record['current'][cat])].append(record)
    # Keep the four review calls on every sheet. Distribute the remaining
    # reachable icon/context keys evenly so any live card has room coverage.
    calls=[('RED','dust','haze'),('GREEN','dust','haze'),('RED','dust','storm'),('BLUE','dust','storm')]
    rank={c['name']:i for i,c in enumerate(CONTEXTS)}
    all_keys=sorted(buckets,key=lambda k:(rank[k[0]],k[1],k[2]))
    key_rank={k:i for i,k in enumerate(all_keys)}
    occurrences=defaultdict(int)
    sheets=[]
    for team_i,team in enumerate('ABCD'):
        rng=random.Random(seed+team_i*1000)
        extras=[k for k in all_keys if k not in calls]
        rng.shuffle(extras)
        for person in range(people_per_team):
            keys=calls+[extras[(person*20+i)%len(extras)] for i in range(20)]
            assert len(set(keys))==24
            keys.sort(key=lambda k:key_rank[k])
            entries=[]
            for key in keys:
                record=rng.choice(buckets[key])
                # Balance the exploratory quarter across occurrences of each cue.
                seat=occurrences[key]+key_rank[key]
                occurrences[key]+=1
                if seat % 4 == 0:
                    vote=CATEGORIES[(seat//4)%4]
                    selection='exploratory measurement'
                else:
                    dangerous=[cat for cat,val in [('battery','dead'),('dust','storm'),('ground','sand')]
                               if record['next'][cat]==val]
                    vote=rng.choice(dangerous or CATEGORIES)
                    selection='danger measurement' if dangerous else 'ordinary measurement'
                entries.append({'context':key[0],'category':key[1],'value':key[2],
                                'vote':vote,'selection':selection,'record':record})
            sheets.append({'team':team,'person':person+1,'entries':entries})
        # The room can answer every reachable source card/color, not only demo calls.
        covered=defaultdict(int)
        for sheet in sheets:
            if sheet['team']==team:
                for e in sheet['entries']:covered[(e['context'],e['category'],e['value'])]+=1
        assert set(covered)==set(all_keys) and min(covered.values())>=2
    stages=[]
    for team_i,(team,call) in enumerate(zip('ABCD',calls)):
        rng=random.Random(seed+9000+team_i)
        record=rng.choice(buckets[call])
        next_row=draw(record['older'],record['previous'],record['current'],rng)
        counts={c:sum(e['vote']==c for s in sheets if s['team']==team for e in s['entries']
                      if (e['context'],e['category'],e['value'])==call) for c in CATEGORIES}
        assert sum(counts.values())==people_per_team
        stages.append({'team':team,'call':call,'record':record,'sealed_next':next_row,'votes':counts})
    for s in sheets:
        for e in s['entries']:
            r=e['record']
            assert context(r['older'],r['previous'],r['current'])['name']==e['context']
            assert r['current'][e['category']]==e['value']
    return sheets,stages,history
