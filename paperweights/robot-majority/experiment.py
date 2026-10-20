"""Original authored corpus -> actual 24-row deals -> simulated audience votes.
No PDF dependencies. This lab does not modify either running game.
"""
from collections import Counter,defaultdict
from pathlib import Path
import json,random,math
ROOT=Path(__file__).parent
OUT=ROOT/'out'
OUT.mkdir(exist_ok=True)
COLORS=['RED','BLUE','AMBER','GREEN','PURPLE','PINK']
# Every permitted lexical choice fits this authored grammar. This is scaffolding,
# not grammar learned from arbitrary literature. Color encodes prefix phase.
SLOTS=[ [('one',1)], [('night',6),('morning',3),('evening',1)], [('the',1)],
 [('old',6),('quiet',3),('young',1)], [('man',6),('sailor',3),('fisherman',1)],
 [('found',6),('noticed',3),('watched',1)], [('his',1)], [('robot',1)],
 [('checking',55),('fixing',18),('sinking',12),('painting',8),('counting',7)],
 [('every',6),('each',3),('the',1)], [('boat',6),('ship',3),('raft',1)],
 [('by',6),('near',3),('beside',1)], [('the',1)],
 [('harbour',6),('river',3),('canal',1)], [('.',1)] ]
def key(i,word,context=True):return f'{COLORS[i%6] if context else "WORD"}:{word}'
def corpus(seed=42,negative=False):
 rng=random.Random(seed);slots=[list(s) for s in SLOTS]
 if negative:slots[8]=[('checking',20),('fixing',10),('sinking',55),('painting',8),('counting',7)]
 # Use common draws for a paired reweighting comparison.
 return [[rng.choices([w for w,n in slot],weights=[n for w,n in slot])[0] for slot in slots] for _ in range(600)]
def graph(sentences,context=True):
 edges=defaultdict(Counter)
 for words in sentences:
  for i,w in enumerate(words):edges[key(i,w,context)][key((i+1)%len(words),words[(i+1)%len(words)],context)]+=1
 return dict(edges)
def apportion(weights,n):
 total=sum(weights.values());counts={k:n*v//total for k,v in weights.items()}
 rank=sorted(weights,key=lambda k:(-(n*weights[k]%total),k))
 for k in rank[:n-sum(counts.values())]:counts[k]+=1
 return counts

def deal(edges,n,seed):
 rng=random.Random(seed);keys=sorted(edges);total=n*24
 assert 24<=len(keys) and total>=len(keys)*2
 quotas={k:total//len(keys) for k in keys}
 shuffled=keys[:];rng.shuffle(shuffled)
 for k in shuffled[:total%len(keys)]:quotas[k]+=1
 sheets=[[] for _ in range(n)]
 # Highest remaining capacity assignment constructs a simple bipartite deal:
 # at most one occurrence of a given left cue per person, exactly24rows/person.
 rng.shuffle(keys)
 for k in sorted(keys,key=lambda x:-quotas[x]):
  people=list(range(n));rng.shuffle(people);people.sort(key=lambda j:len(sheets[j]))
  answers=[a for a,count in apportion(edges[k],quotas[k]).items() for _ in range(count)];rng.shuffle(answers)
  for person,answer in zip(people[:quotas[k]],answers):sheets[person].append((k,answer))
 assert all(len(s)==24 and len({a for a,b in s})==24 for s in sheets)
 assert set(b for s in sheets for a,b in s)<=set(a for s in sheets for a,b in s)
 for s in sheets:s.sort(key=lambda p:(COLORS.index(p[0].split(':')[0]),p[0]))
 return sheets

def play(sheets,start,seed=0,sample=False,participation=1):
 rng=random.Random(seed);cue=start;trace=[];seen=set();words=[cue.split(':')[1]]
 for turn in range(50):
  votes=Counter(b for s in sheets for a,b in s if a==cue and rng.random()<participation)
  if not votes:return dict(sentence=' '.join(words),status='no-votes',trace=trace)
  ordered=sorted(votes,key=lambda k:(-votes[k],k));chosen=rng.choices(ordered,weights=[votes[k] for k in ordered])[0] if sample else ordered[0]
  trace.append(dict(cue=cue,votes=dict(votes),responders=sum(votes.values()),chosen=chosen,tie=sum(v==max(votes.values()) for v in votes.values())>1))
  words.append(chosen.split(':')[1]);cue=chosen
  if words[-1]=='.':return dict(sentence=' '.join(words).replace(' .','.'),status='complete',trace=trace)
  if cue in seen:return dict(sentence=' '.join(words),status='cycle',trace=trace)
  seen.add(cue)
 return dict(sentence=' '.join(words),status='limit',trace=trace)
def valid(run):
 words=run['sentence'].replace('.',' .').split()
 return len(words)==len(SLOTS) and all(w in dict(slot) for w,slot in zip(words,SLOTS))
def audit(edges):
 phase={key(i,w):i for i,slot in enumerate(SLOTS) for w,n in slot}
 assert len(phase)==sum(len(slot) for slot in SLOTS),'Color collision loses context'
 for a,vs in edges.items():
  for b in vs:assert phase[b]==(phase[a]+1)%len(SLOTS)
 # Thus every supported choice reaches punctuation in14steps fromthe start,
 # irrespective of majority, ties or sampling. No mid-sentence loops possible.
 return dict(cues=len(phase),maxTransitionsToStop=len(SLOTS)-1,grammarSentences=math.prod(len(s) for s in SLOTS),proof='Every edge advances exactly one authored grammar phase; period terminates play before the reset edge.')
def main():
 sentences=corpus();edges=graph(sentences);start=key(0,'one');proof=audit(edges)
 raw_edges=graph(sentences,False);raw_sheets=[[(a,b)] for a,vs in raw_edges.items() for b,n in vs.items() for _ in range(n)]
 raw=play(raw_sheets,'WORD:one')
 runs={};sweep={}
 for n in [15,100,200]:
  sheets=deal(edges,n,42);runs[str(n)]=play(sheets,start)
  totals=Counter();examples=[]
  for seed in range(100):
   s=deal(edges,n,seed)
   for label,sample,part in [('majority',False,1),('sampling',True,1),('half-present',False,.5)]:
    r=play(s,start,seed,sample,part);totals[label+'-complete']+=r['status']=='complete';totals[label+'-grammar']+=valid(r);totals[label+'-ties']+=any(t['tie'] for t in r['trace']);totals[label+'-canonical']+=r['sentence']==runs[str(n)]['sentence']
    if label=='sampling' and seed<5:examples.append(r['sentence'])
  sweep[str(n)]={**dict(totals),'sampledSentences':examples,'singleSheetsCompleting':sum(play([sheet],start)['status']=='complete' for sheet in sheets),'respondersRange':[min(t['responders'] for t in runs[str(n)]['trace']),max(t['responders'] for t in runs[str(n)]['trace'])]}
  (OUT/f'deal-{n}.json').write_text(json.dumps(dict(seed=42,size=n,rowsPerPerson=24,colors=COLORS,sheets=sheets),indent=2)+'\n')
  if n==15:
   (ROOT/'sample-sheet.md').write_text('# One actual 24-row sheet\n\nNot a new format: these pairs would use the existing two-column Swift rectangles.\nNo full sentence is printed on the sheet.\n\n| Left cue | Right response |\n| --- | --- |\n'+''.join(f'| {a} | {b} |\n' for a,b in sheets[0]))
 negative=play(deal(graph(corpus(negative=True)),200,42),start)
 report=dict(corpus='600 original synthetic examples from an authored grammar, not external literature',proof=proof,uncoloredCorpus=raw,majorityRuns=runs,sweep=sweep,reweightedCorpusRun=negative,pivot=dict(index=8,word='checking',instruction='After the full stop, ask everyone for one -ing action verb to replace checking. One ballot per person.',exampleBallots={'fixing':7,'sinking':5,'checking':3},winner='fixing',sentence=runs['15']['sentence'].replace('checking','fixing'),caution='Invented ballot example, not observed human responses or evidence of priming.'))
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 (OUT/'corpus.txt').write_text('\n'.join(' '.join(s).replace(' .','.') for s in sentences)+'\n')
 print(json.dumps(dict(proof=proof,raw=raw['sentence'],majority={n:r['sentence'] for n,r in runs.items()},sweep=sweep,reweighted=negative['sentence']),indent=2))
if __name__=='__main__':main()
