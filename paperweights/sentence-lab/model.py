"""Independent sentence laboratory: a dealt word chain with explicit grammar scaffolds."""
import argparse, hashlib, json, random
from pathlib import Path
COLORS={'RED':'#dc2626','BLUE':'#2563eb','AMBER':'#d97706','GREEN':'#16a34a','PURPLE':'#7c3aed','PINK':'#db2777'}
SLOTS=[('RED',['guards','attacks','observes','follows'],'the crew'),('BLUE',['shares','hoards','counts','moves'],'supplies'),('AMBER',['repairs','destroys','inspects','visits'],'the shelter'),('GREEN',['rescues','abandons','watches','tracks'],'survivors'),('PINK',['clears','blocks','maps','surveys'],'routes')]
VARIANTS=[dict(id='chain',label='Word-chain revision',mode='chain',description='The next printed word updates its part of the sentence and becomes the next lookup.'),dict(id='scheduled',label='Scheduled revision',mode='scheduled',description='The sentence is revised; the next lookup is re-cued from a scheduled position.'),dict(id='append',label='Append-only chronicle',mode='append',description='Each chosen verb appends a clause; earlier clauses cannot be changed.')]
DEFAULT_SEED=17

def nodes_for(seed):
    rng=random.Random(f'sentence-graph:{seed}');nodes={}
    for slot,(color,words,obj) in enumerate(SLOTS):
        for wi,word in enumerate(words):
            key=f'{color}:{word}';nodes[key]=dict(key=key,word=word,color=color,slot=slot,stance=[1,-1,0,0][wi],object=obj,edges=[])
    for word in ('robot','then','again','finally'):
        key=f'PURPLE:{word}';nodes[key]=dict(key=key,word=word,color='PURPLE',slot=None,stance=0,object='',edges=[])
    for key,node in nodes.items():
        base=node['slot'] if node['slot'] is not None else rng.randrange(5)
        # Authored cyclic slot routing: no self-loop; all five positions reachable.
        slots=[(base+i)%5 for i in (1,2,3,4)]
        if rng.random()<.5:slots[0],slots[1]=slots[1],slots[0]
        targets=[]
        for slot,word_index in zip(slots,[0,1,2,3]):
            color,words,_=SLOTS[slot];targets.append(f'{color}:{words[word_index]}')
        weights=[.40,.30,.20,.10] if rng.random()<.5 else [.30,.40,.20,.10]
        node['edges']=[dict(to=to,weight=w) for to,w in zip(targets,weights)]
    return nodes

def quotas(edges,n):
    raw={e['to']:e['weight']*n for e in edges};counts={k:int(v) for k,v in raw.items()}
    rank={e['to']:i for i,e in enumerate(edges)}
    for k in sorted(raw,key=lambda k:(-(raw[k]-counts[k]),rank[k]))[:n-sum(counts.values())]:counts[k]+=1
    return counts

def make_pack(sheet_count=15,seed=DEFAULT_SEED):
    if sheet_count<4:raise ValueError('At least four sheets.')
    nodes=nodes_for(seed);rng=random.Random(f'sentence-deal:{seed}:{sheet_count}')
    sheets=[];tallies={}
    for gi,group in enumerate('AB'):
        n=sheet_count//2+(gi==0 and sheet_count%2)
        group_sheets=[dict(id=f'{len(sheets)+i+1:03}',group=group,entries=[]) for i in range(n)]
        tallies[group]={}
        for key,node in nodes.items():
            counts=quotas(node['edges'],n);tallies[group][key]=counts
            destinations=[to for to,count in counts.items() for _ in range(count)];rng.shuffle(destinations)
            for sheet,to in zip(group_sheets,destinations):
                target=nodes[to]
                sheet['entries'].append(dict(fromWord=node['word'],fromColor=node['color'],toWord=target['word'],toColor=target['color'],fromKey=key,toKey=to))
        sheets+=group_sheets
    pack=dict(version=1,recommendedVariant='chain',seed=seed,sheetCount=sheet_count,colors=COLORS,nodes=nodes,variants=VARIANTS,sheets=sheets,tallies=tallies,initialSlots=[f'{color}:{words[2]}' for color,words,_ in SLOTS],startKey='PURPLE:robot',roundCount=10,groups=[dict(id='A',goal='Make the robot helpful'),dict(id='B',goal='Make the robot harmful')],grammar=dict(prefix='The robot',objects=[s[2] for s in SLOTS]),rules=dict(choice='Representative chooses one of the two leading words; include ties.',turnSeconds=30,score='Authored action checklist: protective words +1; destructive words -1; other words 0. This is not a sentiment model.'))
    digest=hashlib.sha256(json.dumps(pack,sort_keys=True).encode()).hexdigest()[:10];pack['id']=f'SL1-{seed}-{sheet_count}-{digest}'
    return pack

def sentence(pack,slots):
    clauses=[f"{pack['nodes'][key]['word']} {pack['grammar']['objects'][i]}" for i,key in enumerate(slots)]
    return 'The robot '+', '.join(clauses[:-1])+' and '+clauses[-1]+'.'

def create_state(pack,variant='chain'):
    return dict(variant=variant,slots=list(pack['initialSlots']),cueKey=pack['startKey'] if variant!='scheduled' else pack['initialSlots'][0],turn=0,done=False,clauses=[],changedSlot=None,history=[])

def options(pack,state):
    group='AB'[state['turn']%2];counts=pack['tallies'][group][state['cueKey']]
    threshold=sorted([n for n in counts.values() if n],reverse=True)[min(1,len([n for n in counts.values() if n])-1)]
    return [dict(toKey=key,word=pack['nodes'][key]['word'],color=pack['nodes'][key]['color'],count=n,isLeader=n>=threshold) for key,n in counts.items() if n]

def choose(pack,state,to,allow_all=False):
    if state['done']:raise ValueError('Finished')
    if to not in [o['toKey'] for o in options(pack,state) if o['isLeader'] or allow_all]:raise ValueError('Choose a printed leading continuation')
    out={**state,'slots':list(state['slots']),'clauses':list(state['clauses']),'history':list(state['history'])};node=pack['nodes'][to]
    out['slots'][node['slot']]=to;out['changedSlot']=node['slot'];out['clauses'].append(f"{node['word']} {node['object']}")
    out['history'].append(dict(group='AB'[state['turn']%2],cueKey=state['cueKey'],toKey=to,counts=pack['tallies']['AB'[state['turn']%2]][state['cueKey']]))
    out['turn']+=1;out['done']=out['turn']==pack['roundCount']
    out['cueKey']=out['slots'][out['turn']%5] if state['variant']=='scheduled' else to
    return out

def score(pack,state):
    keys=[h['toKey'] for h in state['history']] if state['variant']=='append' else state['slots']
    return sum(pack['nodes'][key]['stance'] for key in keys)

def run(pack,variant='chain',policy='representative',trial_seed=0,start_group='A',choice_rule='leaders'):
    state=create_state(pack,variant);rng=random.Random(trial_seed);trace=[]
    while not state['done']:
        opts=options(pack,state);leaders=[o for o in opts if o['isLeader'] or choice_rule=='all' or policy=='sample']
        sign=1 if ('AB'[state['turn']%2]==start_group) else -1
        if policy=='modal':selected=max(leaders,key=lambda o:o['count'])
        elif policy=='sample':selected=rng.choices(leaders,[o['count'] for o in leaders])[0]
        else:selected=max(leaders,key=lambda o:(sign*score(pack,choose(pack,state,o['toKey'],choice_rule=='all')),o['count']))
        previous=state;state=choose(pack,state,selected['toKey'],choice_rule=='all' or policy=='sample');value=score(pack,state)
        text=('The robot '+'; then '.join(state['clauses'])+'.') if variant=='append' else sentence(pack,state['slots'])
        trace.append(dict(turn=state['turn'],group='AB'[previous['turn']%2],cueKey=previous['cueKey'],options=opts,chosen=selected['toKey'],sentence=text,score=value,nextCueKey=state['cueKey']))
    scores=[t['score'] for t in trace]
    nonzero=[(v>0)-(v<0) for v in scores if v]
    return dict(variant=variant,policy=policy,choiceRule=choice_rule,startGoal=start_group,trace=trace,finalSentence=trace[-1]['sentence'],score=scores[-1],winner='helpful' if scores[-1]>0 else 'harmful' if scores[-1]<0 else 'tie',reversals=sum(a!=b for a,b in zip(nonzero,nonzero[1:])),words=len(trace[-1]['sentence'].split()),unchangedTurns=sum(t['sentence']==(trace[i-1]['sentence'] if i else sentence(pack,pack['initialSlots'])) for i,t in enumerate(trace)),zeroChoiceTurns=sum(sum(o['isLeader'] for o in t['options'])<2 for t in trace),slotsVisited=len({pack['nodes'][t['chosen']]['slot'] for t in trace}))

def main():
    p=argparse.ArgumentParser();p.add_argument('--sheets',type=int,default=15);p.add_argument('--seed',type=int,default=DEFAULT_SEED);p.add_argument('--out',type=Path,default=Path(__file__).with_name('pack.json'));a=p.parse_args()
    pack=make_pack(a.sheets,a.seed);a.out.write_text(json.dumps(pack,indent=2)+'\n');print(pack['id'])
if __name__=='__main__':main()
