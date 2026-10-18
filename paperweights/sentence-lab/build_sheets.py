#!/usr/bin/env python3
"""Print the sentence lab's actual dealt word/color pairs in the Swift layout."""
import argparse
from collections import Counter,defaultdict
from html import escape
import json
from pathlib import Path
import sys
import pymupdf

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent))
from generator import MINIMAL_CSS
from printkit import document,write_bundle,preview

CSS=MINIMAL_CSS+'''
header { display:flex; align-items:center; justify-content:space-between; }
.sheet-team { font-size:12pt; white-space:nowrap; margin-left:3mm; }
.identity { font-size:6pt; color:#62625d; margin-top:3mm; }
'''


def render_sheet(sheet,pack):
    colors=pack['colors'];rank={c:i for i,c in enumerate(colors)}
    entries=sorted(sheet['entries'],key=lambda e:(rank[e['fromColor']],e['fromWord'],e['toWord']))
    assert len(entries)==24
    columns=[]
    for start in (0,12):
        rows=[]
        for e in entries[start:start+12]:
            a,b=escape(e['fromWord']),escape(e['toWord'])
            ca,cb=e['fromColor'],e['toColor']
            rows.append(f'<div class="pair"><div class="left" style="background:{colors[ca]}"><span class="tag">{ca}</span><span class="word">{a}</span></div><div class="arrow">-&gt;</div><div class="right"><span class="word" style="color:{colors[cb]}">{b}</span><span class="tag">({cb})</span></div></div>')
        columns.append('<div class="column">'+''.join(rows)+'</div>')
    return (f'<section class="sheet"><header><h1>Paper Weights / Sentence Game</h1><span class="sheet-team">Team {sheet["group"]}</span></header>'
            '<div class="instructions"><b>1</b> Hear a word + color. Find that <b>filled box</b> on the left.<br>'
            '<b>2</b> Vote the <b>right word + its color</b>.<br>'
            '<b>3</b> Take each new call from the screen.</div><div class="columns">'+''.join(columns)+
            f'</div><div class="identity">{pack["id"]} / {sheet["group"]} / {sheet["id"]}</div></section>')


def verify(pdf,pack):
    with pymupdf.open(pdf) as doc:
        assert len(doc)==len(pack['sheets'])
        for i,page in enumerate(doc):
            text=page.get_text();sheet=pack['sheets'][i]
            assert text.count('->')==24 and '→' not in text
            assert f'Team {sheet["group"]}' in text
            spans=[s for b in page.get_text('dict')['blocks'] if 'lines' in b for line in b['lines'] for s in line['spans'] if s['text'].strip()]
            for s in spans:
                x0,y0,x1,y1=s['bbox']
                assert x0>=27 and y0>=27 and x1<=page.rect.width-27 and y1<=page.rect.height-27,(i,s)
            words=[s for s in spans if abs(s['size']-16)<.1]
            expected=Counter()
            for e in sheet['entries']:
                expected[(e['fromWord'],0xffffff)]+=1
                expected[(e['toWord'],int(pack['colors'][e['toColor']][1:],16))]+=1
            assert Counter((s['text'],s['color']) for s in words)==expected,(i,'word/color mismatch')
            actual_pairs=Counter()
            drawings=page.get_drawings()
            for column in (0,1):
                column_words=sorted([w for w in words if (w['bbox'][0]>page.rect.width/2)==bool(column)],key=lambda w:w['bbox'][1])
                assert len(column_words)==24
                for j in range(0,24,2):
                    left,right=sorted(column_words[j:j+2],key=lambda w:w['bbox'][0])
                    center=pymupdf.Point((left['bbox'][0]+left['bbox'][2])/2,(left['bbox'][1]+left['bbox'][3])/2)
                    boxes=[d for d in drawings if d.get('fill') and sum(round(v*255)<<(16-8*k) for k,v in enumerate(d['fill'])) in {int(c[1:],16) for c in pack['colors'].values()} and d['rect'].contains(center)]
                    assert len(boxes)==1,(i,left,boxes)
                    fill=sum(round(v*255)<<(16-8*k) for k,v in enumerate(boxes[0]['fill']))
                    actual_pairs[(left['text'],fill,right['text'],right['color'])]+=1
            expected_pairs=Counter((e['fromWord'],int(pack['colors'][e['fromColor']][1:],16),e['toWord'],int(pack['colors'][e['toColor']][1:],16)) for e in sheet['entries'])
            assert actual_pairs==expected_pairs,(i,'paired words/colors mismatch')
            fills=Counter()
            palette={int(c[1:],16) for c in pack['colors'].values()}
            for drawing in page.get_drawings():
                fill=drawing.get('fill')
                if fill and drawing['rect'].height>20:
                    color=sum(round(v*255)<<(16-8*j) for j,v in enumerate(fill))
                    if color in palette:fills[color]+=1
            assert fills==Counter(int(pack['colors'][e['fromColor']][1:],16) for e in sheet['entries']),(i,'left color mismatch')


def build(path):
    pack=json.loads(path.read_text())
    counts=defaultdict(lambda:defaultdict(Counter))
    for sheet in pack['sheets']:
        for e in sheet['entries']:counts[sheet['group']][e['fromKey']][e['toKey']]+=1
    for group,tallies in pack['tallies'].items():
        assert {key:dict(c) for key,c in counts[group].items()}=={key:{k:v for k,v in c.items() if v} for key,c in tallies.items()},(group,'sheet tally mismatch')
    output=HERE/'printouts'/pack['id'];output.mkdir(parents=True,exist_ok=True)
    pdf=output/'sheets.pdf'
    write_bundle(document([render_sheet(s,pack) for s in pack['sheets']],'Paper Weights',CSS),pdf,len(pack['sheets']),{'packId':pack['id'],'sheets':pack['sheets'],'colors':pack['colors']})
    verify(pdf,pack)
    preview(pdf)
    b=next(i for i,s in enumerate(pack['sheets']) if s['group']=='B')
    preview(pdf,b,'team-b-preview')
    (output/'manifest.json').write_text(json.dumps(pack,indent=2)+'\n')
    (output/'verification.json').write_text(json.dumps({'packId':pack['id'],'pages':len(pack['sheets']),'pairsPerPerson':24,'exactWordsAndColors':'passed','pageBounds':'passed','asciiArrows':'passed'},indent=2)+'\n')
    (output/'PRINT.md').write_text(f'# {pack["id"]}\n\nPrint `sheets.pdf`: A4, actual size, color, single-sided. Give the pages labelled Team A to the first team and Team B to the second. The page uses the exact observations in the sentence lab pack; do not substitute a Rover or earlier word pack.\n')
    print(output,flush=True)
    return output


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack',type=Path,default=HERE/'pack.json')
    build(parser.parse_args().pack)
