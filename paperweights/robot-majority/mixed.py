"""RM4: observed pairs from a weighted mixed corpus; duplicate cues allowed."""
from collections import Counter, defaultdict
from pathlib import Path
import random, re, json, math
ROOT = Path(__file__).parent
COLORS = ['RED','BLUE','AMBER','GREEN','PURPLE','PINK']

def corpus():
    records=[]
    for line in (ROOT/'mixed-corpus.txt').read_text().splitlines():
        if not line or line.startswith('#'): continue
        weight,text=line.split('|',1)
        words=re.findall(r"[a-zA-Z]+(?:'[a-z]+)?|[.,!?]",text.lower())
        records.append((int(weight),words))
    return records

def model(robot_weight=None):
    records=corpus()
    if robot_weight is not None: records=[(robot_weight if i<3 else weight,words) for i,(weight,words) in enumerate(records)]
    vocab=sorted({w for _,words in records for w in words})
    cues={w:f'{COLORS[i%6]}:{w}' for i,w in enumerate(vocab)}
    edges=defaultdict(Counter)
    for weight,words in records:
        for a,b in zip(words,words[1:]+words[:1]):edges[cues[a]][cues[b]]+=weight
    routes=[[cues[w] for w in words] for _,words in records[:3]]
    return dict(edges),routes

def apportion(weights,n):
    total=sum(weights.values()); result={k:math.floor(v*n/total) for k,v in weights.items()}
    order=sorted(weights,key=lambda k:(-(n*weights[k]/total-result[k]),k))
    for k in order[:n-sum(result.values())]:result[k]+=1
    return result

def pack(size,seed=42,robot_weight=None):
    edges,routes=model(robot_weight);budget=size*24
    assert budget>=2*len(edges)
    # Keep every cue usable, then give frequent corpus cues more space.
    extra=apportion({k:sum(v.values()) for k,v in edges.items()},budget-2*len(edges))
    rows=[]
    for cue in sorted(edges):
        for dest,n in apportion(edges[cue],2+extra[cue]).items():rows.extend([(cue,dest)]*n)
    rng=random.Random(seed)
    for attempt in range(10000):
        rng.shuffle(rows);sheets=[sorted(rows[i*24:(i+1)*24]) for i in range(size)]
        if all(sum(any(a==cue for a,b in s) for s in sheets)>=2 for cue in edges):break
    else:raise ValueError('Could not distribute rare cues across people')
    assert {b for s in sheets for a,b in s}<={a for s in sheets for a,b in s}
    return dict(size=size,seed=seed,sheets=sheets,start=routes[0][0],starts=[r[0] for r in routes],
        source='Weighted authored mixed corpus - RM4', expectedRoutes=routes)

def vote(sheets,cue,rng,random_pick=False,limit=None):
    people=[[b for a,b in sheet if a==cue] for sheet in sheets]
    people=[p for p in people if p]
    if random_pick:people=[rng.choice(people)]
    elif limit is not None:people=rng.sample(people,min(limit,len(people)))
    votes=Counter(rng.choice(p) for p in people)
    return sorted(votes,key=lambda k:(-votes[k],k))[0]

def walk(sheets,start,seed=42,random_pick=False,limit=None,steps=40):
    rng=random.Random(seed);run=[start]
    for _ in range(steps):run.append(vote(sheets,run[-1],rng,random_pick,limit))
    return run

def text(run):return re.sub(r' ([.,!?])',r'\1',' '.join(k.split(':',1)[1] for k in run))

def evaluate():
    report={}
    for size in (15,100,200):
        p=pack(size);sheets=p['sheets'];counts=Counter();random_runs=[];examples=[]
        for seed in range(100):
            for route in p['expectedRoutes']:
                for label,random_pick,limit in [('all',False,None),('five',False,5),('random',True,None)]:
                    run=walk(sheets,route[0],seed,random_pick,limit,len(route)-1)
                    counts[label+'-exact']+=run==route
                random_runs.append(walk(sheets,route[0],seed,True))
            if seed<3:examples.append(text(random_runs[-3]))
        report[size]=dict(cues=len(model()[0]),**counts,randomDistinct=len({tuple(r) for r in random_runs}),
            majorityExamples=[text(walk(sheets,r[0],0,steps=len(r)-1)) for r in p['expectedRoutes']],
            randomExamples=examples,duplicateCueSheets=sum(len({a for a,b in s})<24 for s in sheets))
    weight_trials={}
    for weight in (4,8,12):
        p=pack(200,robot_weight=weight);hits=Counter()
        for seed in range(100):
            for route in p['expectedRoutes']:
                for name,sample in [('majority',False),('random',True)]:
                    hits[name]+=walk(p['sheets'],route[0],seed,sample,steps=len(route)-1)==route
        weight_trials[weight]=dict(hits)
    report['weightTrials200']=weight_trials
    for size in (15,100,200):
        correct=0;total=0
        for deal_seed in range(5):
            p=pack(size,deal_seed)
            for seed in range(20):
                for route in p['expectedRoutes']:
                    correct+=walk(p['sheets'],route[0],seed,steps=len(route)-1)==route;total+=1
        report[size]['multiDealExact']=correct;report[size]['multiDealTrials']=total
    out=ROOT/'out';out.mkdir(exist_ok=True);(out/'mixed-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':evaluate()
