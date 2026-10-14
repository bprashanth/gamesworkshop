#!/usr/bin/env python3
"""Swift-shaped context-icon sheets and matching four-panel stage mockup."""
from pathlib import Path
from collections import Counter
import json
import sys
import xml.etree.ElementTree as ET
sys.path[:0]=[str(Path(__file__).resolve().parents[2]),str(Path(__file__).resolve().parents[1])]
from printkit import document,write_bundle,preview
from generator import MINIMAL_CSS
from generate import SYMBOLS
from context_world import CONTEXTS,BY_NAME,CATEGORIES,make_pack,category_weights
from weasyprint import HTML
from pypdf import PdfReader,PdfWriter

HERE=Path(__file__).resolve().parent
CSS=MINIMAL_CSS+'''
.left { display:flex; flex-direction:row; justify-content:space-between; align-items:center; }
.left .tag { width:14mm; }
.context-icon { display:block; width:17mm; height:10mm; }
.right .word { font-size:16pt; }
'''

def glyph(cat,value,uid):
    svg=SYMBOLS[cat][value]
    for old in ('cs','cq'):
        svg=svg.replace(f'id="{old}"',f'id="{old}-{uid}"').replace(f'url(#{old})',f'url(#{old}-{uid})')
    root=ET.fromstring(svg)
    for k,v in {'class':'context-icon','fill':'none','stroke':'#ffffff','stroke-width':'1.4',
                'stroke-linecap':'round','stroke-linejoin':'round'}.items():root.set(k,v)
    for el in root.iter():
        classes=el.get('class','').split()
        if 'fill' in classes:el.set('fill','#ffffff');el.set('stroke','none')
        if 'thin' in classes:el.set('stroke-width','1')
        if 'faint' in classes:el.set('stroke-opacity','.55')
    return ET.tostring(root,encoding='unicode')

def sheet_page(sheet):
    columns=[]
    for start in (0,12):
        pairs=[]
        for i,e in enumerate(sheet['entries'][start:start+12]):
            c=BY_NAME[e['context']]
            pairs.append(f'<div class="pair"><div class="left" style="background:{c["fill"]}"><span class="tag">{c["name"]}</span>'+glyph(e['category'],e['value'],f'{sheet["team"]}{sheet["person"]}{start+i}')+f'</div><div class="arrow">-&gt;</div><div class="right"><span class="word" style="color:{c["fill"]}">{e["vote"]}</span><span class="tag">({c["name"]})</span></div></div>')
        columns.append('<div class="column">'+''.join(pairs)+'</div>')
    return '<section class="sheet"><header><h1>Paper Weights / Rover</h1></header><div class="instructions"><b>1</b> See an icon + color on screen. Find that <b>filled box</b> on the left.<br><b>2</b> Follow it. Vote the <b>word on the right</b> within 10 seconds.<br><b>3</b> The rep chooses what to flip next. Match each new call from the screen.</div><div class="columns">'+''.join(columns)+'</div></section>'

STAGE_CSS='''
@page { size:A3 landscape; margin:10mm; }
header { padding:2mm 0; }
h1 { font-size:24pt; }
.stage-sub { font:9pt "DejaVu Sans",sans-serif; margin:3mm 0 5mm; }
.panels { display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
.panel { border:1px solid #b8b8af; padding:4mm; }
.panel h2 { font-size:14pt; margin:0; }
.panel-head { display:flex; justify-content:space-between; align-items:center; }
.timer { font-size:13pt; border:1px solid #222; padding:1mm 3mm; }
.progress { display:flex; gap:1mm; margin:3mm 0; }
.step { width:9mm; height:4mm; background:#eee; }
.step.done { background:#222; }
.call { font-size:11pt; font-weight:bold; margin:2mm 0 3mm; }
.cards { display:flex; gap:2mm; }
.stage-card { width:25%; height:31mm; color:white; padding:2mm; border-radius:1mm; text-align:center; }
.stage-card.focus { outline:2px solid #222; outline-offset:1mm; }
.stage-card .context-icon { width:29mm; height:18mm; margin:auto; }
.stage-card .label { font-size:8pt; }
.stage-card .value { font-size:9pt; font-weight:bold; }
.vote-row { display:flex; align-items:center; margin-top:2mm; font:8pt "DejaVu Sans",sans-serif; }
.vote-row .name { width:24mm; }
.vote-row .track { width:80mm; background:#eee; height:3mm; }
.vote-row .bar { background:#333; height:3mm; }
.vote-row .count { margin-left:3mm; }
.next { font:8pt "DejaVu Sans",sans-serif; margin-top:3mm; }
'''

def stage_page(stages):
    panels=[]
    for stage in stages:
        name,cat,value=stage['call'];c=BY_NAME[name];r=stage['record']['current']
        cards=[]
        for category in CATEGORIES:
            val=r[category]
            label={'tilted':'slope','sand':'SAND','storm':'STORM'}.get(val,val)
            cards.append(f'<div class="stage-card {"focus" if category==cat else ""}" style="background:{c["fill"]}"><div class="label">{category.upper()}</div>'+glyph(category,val,f'stage{stage["team"]}{category}')+f'<div class="value">{label}</div></div>')
        n=sum(stage['votes'].values())
        bars=''.join(f'<div class="vote-row"><div class="name">{category.upper()}</div><div class="track"><div class="bar" style="width:{100*count/n}%"></div></div><div class="count">{count}/{n} · {100*count/n:.0f}%</div></div>' for category,count in stage['votes'].items())
        panels.append(f'<div class="panel"><div class="panel-head"><h2>TEAM {stage["team"]} / SQUARE 06</h2><div class="timer">10 s</div></div><div class="progress">'+''.join(f'<div class="step {"done" if i<6 else ""}"></div>' for i in range(14))+f'</div><div class="call">MATCH {name} {value.upper()}</div><div class="cards">'+''.join(cards)+'</div>'+bars+'<div class="next">Vote: which category should we inspect in square 07?</div></div>')
    return '<section class="sheet"><header><h1>Paper Weights / Rover</h1></header><div class="stage-sub">Source square revealed · Match the outlined card and its color · The rep chooses the next-square reveal</div><div class="panels">'+''.join(panels)+'</div></section>'


def key_page():
    rows=[]
    for c in CONTEXTS:
        history={'persistent haze':'Last two dust readings: HAZE, HAZE',
                 'fresh haze':'Last dust: HAZE; the one before was not HAZE',
                 'other':'Last dust reading was not HAZE'}[c['history']]
        rows.append(f'<tr><td style="background:{c["fill"]};color:white;font-weight:bold">{c["name"]}</td><td>{history}</td><td>{c["terrain"]}</td></tr>')
    return '<section class="sheet"><header><h1>What the color remembers</h1></header><div class="instructions">The icon is the current reading. The color groups a selected history and terrain context.<br>These are context names, not danger levels or category colors.</div><table style="width:100%;border-collapse:collapse;font:9pt/1.5 sans-serif"><tr><th>Color</th><th>History before this square</th><th>Current slope</th></tr>'+''.join(rows)+'</table><div class="instructions" style="margin-top:7mm"><b>RED HAZE</b>: haze now, haze on both earlier squares, non-flat terrain now.<br><b>GREEN HAZE</b>: the same recent haze pattern, but flat terrain now.<br><b>RED STORM / BLUE STORM</b>: the same current storm, different earlier dust history.<br><br>The left box on paper and the stage card use exactly the same context function.<br>The right-hand word names a category observed in the next historical square.<br>Its ink repeats the matched context; it does not predict the next live color.<br><br>The stage mock is paused after square 06 has been revealed/crossed. Only its four<br>cards are shown; older readings are stored. Voting selects a card in square 07.<br>The terrain used by the color is already known here. A reveal of hidden square 07<br>must not silently use its still-hidden slope to assign a new cue color.<br><br>Six colors compress selected features, not the entire map history. Different detailed<br>histories may share a bucket. This is a hand-designed context key, not transformer<br>attention or a claim about real Mars.</div></section>'


def generate():
    sheets,stages,history=make_pack()
    report={'kind':'Context-color prototype','people_per_team':15,'sheet_count':len(sheets),
            'contexts':CONTEXTS,'sheets':sheets,
            'observation_selection':'Three of four seats select a dangerous next reading if present; every fourth seat cycles through categories for exploration; no danger: uniform',
            'archive_seed':1259,'archive_size':len(history)}
    write_bundle(document([sheet_page(s) for s in sheets],'Context-colored audience sheets',CSS),HERE/'audience-60.pdf',60,report)
    preview(HERE/'audience-60.pdf')
    # Two people from the same group: same lookups, different historical suggestions.
    writer=PdfWriter()
    reader=PdfReader(HERE/'audience-60.pdf')
    for i in (0,1):writer.add_page(reader.pages[i])
    with (HERE/'sample-sheets.pdf').open('wb') as f:writer.write(f)
    preview(HERE/'sample-sheets.pdf');preview(HERE/'sample-sheets.pdf',1,'person-2')
    html=document([stage_page(stages)],'Four-team context-colored stage',STAGE_CSS)
    (HERE/'stage-mockup.html').write_text(html)
    HTML(string=html).write_pdf(HERE/'stage-mockup.pdf')
    assert len(PdfReader(HERE/'stage-mockup.pdf').pages)==1
    preview(HERE/'stage-mockup.pdf')
    (HERE/'stage-mockup.json').write_text(json.dumps({'stages':stages,'warning':'Includes sealed next states for facilitator review'},indent=2)+'\n')
    write_bundle(document([key_page()],'Context key','td,th { padding:4mm 2mm; border-bottom:1px solid #ccc; text-align:left; }'),HERE/'context-key.pdf',1,{'contexts':CONTEXTS})
    preview(HERE/'context-key.pdf')
    for st in stages:print(st['team'],st['call'],st['votes'])

if __name__=='__main__':generate()
