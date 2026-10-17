#!/usr/bin/env python3
"""Build paired Paper Weights fronts and shared-model Rover backs."""
import argparse
import importlib.util
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET
from html import escape
from pypdf import PdfReader, PdfWriter
import pymupdf
from generator import build_deck, deck_report, render_sheet, MINIMAL_CSS
from printkit import document, write_bundle, preview

ROOT=Path(__file__).resolve().parent
SYMBOLS=json.loads((ROOT/'rover/symbols.json').read_text())
CSS=MINIMAL_CSS+'''
.pair { border-radius:0; }
.lookup { width:40mm; height:10mm; display:flex; border:1.5px solid; border-left-width:4px; }
.key { width:16mm; display:flex; align-items:center; justify-content:center; gap:1mm; font-size:7pt; }
.face { width:24mm; display:flex; justify-content:center; align-items:center; }
.context-icon { width:17mm; height:9mm; }
.right .word { font-size:16pt; color:#242421; }
header { display:flex; align-items:center; justify-content:space-between; }
.sheet-team { font-size:12pt; white-space:nowrap; margin-left:3mm; }
.hazard-strip { width:100%; border:1px solid #62625d; margin-top:2mm; padding:1mm 3mm; height:14mm; display:flex; align-items:center; justify-content:space-between; break-inside:avoid; }
.hazard-strip > b { font-size:9pt; }
.hazard-example { display:flex; align-items:center; gap:2mm; font-size:7pt; white-space:nowrap; }
.hazard-example .context-icon { width:17mm; height:10mm; }
.identity { font-size:6pt; color:#62625d; margin-top:3mm; }
.right .tag { font-family:"DejaVu Sans Mono"; }
'''

def icon(category,value,uid,ink):
    svg=SYMBOLS[category][value]
    for old in ('cs','cq'):
        svg=svg.replace(f'id="{old}"',f'id="{old}-{uid}"').replace(f'url(#{old})',f'url(#{old}-{uid})')
    root=ET.fromstring(svg)
    for k,v in {'class':'context-icon','fill':'none','stroke':ink,'stroke-width':'1.4','stroke-linecap':'round','stroke-linejoin':'round'}.items():root.set(k,v)
    for el in root.iter():
        classes=el.get('class','').split()
        if 'fill' in classes:el.set('fill',ink);el.set('stroke','none')
        if 'thin' in classes:el.set('stroke-width','1')
        if 'faint' in classes:el.set('stroke-opacity','.55')
    return ET.tostring(root,encoding='unicode')

def team_label(html,sheet):
    return html.replace('</header>',f'<span class="sheet-team">Team {sheet["team"]}</span></header>')

def identity(sheet,pack_id):
    return f'<div class="identity">{pack_id} / {sheet["team"]} / {sheet["id"]}</div>'

def hazard_strip(sheet):
    examples=[('dust','storm','Storm'),('battery','dead','Dead battery'),('ground','sand','Sand pit')]
    return '<div class="hazard-strip"><b>Avoid these:</b>'+''.join(
        '<div class="hazard-example">'+icon(cat,val,f'legend-{sheet["id"]}-{cat}','#22221f')+f'<span>{label}</span></div>'
        for cat,val,label in examples)+'</div>'

def clean_separators(html):
    return html.replace('·',' - ').replace('•',' - ')

def rover_page(sheet,contexts,pack_id):
    entries=sorted(sheet['entries'],key=lambda e:(e['context'],e['category'],e['value']))
    assert len(entries)==24 and len({e['key'] for e in entries})==24
    columns=[]
    for start in (0,12):
        rows=[]
        for i,e in enumerate(entries[start:start+12]):
            code=e['context'];color=contexts[code]['light'];color_name=contexts[code]['colorName'];hazard=e['value'] in ('dead','storm','sand')
            ink='#ffffff' if hazard else '#22221f';bg='#22221f' if hazard else '#ffffff'
            rows.append(f'<div class="pair"><div class="lookup" style="border-color:{color}"><div class="key" style="color:{color}"><b>{color_name}</b></div><div class="face" style="background:{bg}">'+icon(e['category'],e['value'],f'{sheet["id"]}-{start+i}',ink)+f'</div></div><div class="arrow">-&gt;</div><div class="right"><span class="word">{escape(e["nextAction"].upper())}</span><span class="tag" style="color:{color}">({color_name})</span></div></div>')
        columns.append('<div class="column">'+''.join(rows)+'</div>')
    return team_label('<section class="sheet"><header><h1>Paper Weights / Rover</h1></header><div class="instructions"><b>1</b> Match the four current icons + colors.<br><b>2</b> Count <b>GO</b> and <b>AVOID</b> on the right.<br><b>3</b> Vote the majority. Tied? Abstain.</div><div class="columns">'+''.join(columns)+'</div>'+hazard_strip(sheet)+identity(sheet,pack_id)+'</section>',sheet)

def verify(pdf,count):
    with pymupdf.open(pdf) as doc:
        assert len(doc)==count,(pdf,len(doc),count)
        for n,page in enumerate(doc):
            text=page.get_text()
            assert 'Paper Weights' in text and 'Human Language Model' not in text
            assert '→' not in text and text.count('->')==24,(pdf,n,text.count('->'))
            expected_strip=pdf.stem=='rover' or (pdf.stem=='duplex' and n%2==1)
            assert ('Avoid these:' in text)==expected_strip,(pdf,n,'hazard strip side')
            assert '·' not in text and '•' not in text,(pdf,n,'dot separator')
            assert not re.search(r'\bC0[1-6]\b',text),(pdf,n,'obsolete context code')
            for b in page.get_text('blocks'):
                assert b[0]>=-1 and b[1]>=-1 and b[2]<=page.rect.width+1 and b[3]<=page.rect.height+1,(pdf,n,b)

def verify_rover(pdf,pack,duplex=False):
    contexts={c['id']:c for c in pack['contexts']}
    expected_groups=defaultdict(Counter);actual_groups=defaultdict(Counter)
    cue_counts=defaultdict(lambda:defaultdict(Counter))
    with pymupdf.open(pdf) as doc:
        for i,sheet in enumerate(pack['sheets']):
            page=doc[2*i+1 if duplex else i]
            assert f'Team {sheet["team"]}' in page.get_text()
            spans=[s for b in page.get_text('dict')['blocks'] if 'lines' in b for line in b['lines'] for s in line['spans'] if s['text'].strip()]
            actions=sorted([s for s in spans if abs(s['size']-16)<.1],key=lambda s:(s['bbox'][0]>page.rect.width/2,s['bbox'][1]))
            tags=sorted([s for s in spans if s['text'].startswith('(') and s['text'].endswith(')')],key=lambda s:(s['bbox'][0]>page.rect.width/2,s['bbox'][1]))
            entries=sorted(sheet['entries'],key=lambda e:(e['context'],e['category'],e['value']))
            assert len(actions)==len(tags)==len(entries)==24,(pdf,i,'row count')
            for action,tag,e in zip(actions,tags,entries):
                assert action['text']==e['nextAction'].upper(),(pdf,i,e,action)
                c=contexts[e['context']]
                assert tag['text']==f'({c["colorName"]})' and tag['color']==int(c['light'][1:],16),(pdf,i,e,tag)
                expected_groups[sheet['team']][e['nextAction']]+=1
                actual_groups[sheet['team']][action['text'].lower()]+=1
                cue_counts[sheet['team']][e['key']][action['text'].lower()]+=1
    assert actual_groups==expected_groups
    for team in pack['teams']:
        assert set(cue_counts[team['id']])==set(team['votesByCue'])
        for key,counts in team['votesByCue'].items():
            assert cue_counts[team['id']][key]==Counter(counts),(pdf,team['id'],key,'cue count mismatch')

def build(count,seed=None):
    if not 12 <= count <= 200:
        raise ValueError("Use 12–200 people for a paired competitive pack.")
    sys.path.insert(0,str(ROOT/'competition'))
    spec=importlib.util.spec_from_file_location('paperweights_competition_generator',ROOT/'competition/prediction.py')
    model=importlib.util.module_from_spec(spec);spec.loader.exec_module(model)
    pack=model.make_pack(sheet_count=count,**({'seed':seed} if seed is not None else {}))
    seed=pack['seed']
    output=ROOT/'printouts'/pack['packId'];output.mkdir(parents=True,exist_ok=True)
    (output/'manifest.json').write_text(json.dumps(pack,indent=2)+'\n')
    gamepacks=ROOT/'web/packs';gamepacks.mkdir(parents=True,exist_ok=True)
    (gamepacks/f'{pack["packId"]}.json').write_text(json.dumps(pack,separators=(',',':'))+'\n')
    if count==15:
        (ROOT/'web/pack.json').write_text(json.dumps(pack,separators=(',',':'))+'\n')
    indexpath=gamepacks/'index.json'
    index=json.loads(indexpath.read_text()) if indexpath.exists() else []
    version=pack['packId'].split('-')[0]+'-'
    index=[p for p in index if p['packId']!=pack['packId'] and p['packId'].startswith(version)]
    index.append(dict(packId=pack['packId'],sheetCount=count,seed=seed,url=f'packs/{pack["packId"]}.json'))
    index.sort(key=lambda p:(p['sheetCount'],p['seed'],p['packId']))
    indexpath.write_text(json.dumps(index,indent=2)+'\n')
    words,colors=build_deck(count,seed=seed)
    contexts={c['id']:c for c in pack['contexts']}
    names=['RED','BLUE','AMBER','GREEN','PURPLE','PINK']
    fills={name:pack['contexts'][i]['light'] for i,name in enumerate(names)}
    colors={word:{**c,'fill':fills[c['name']]} for word,c in colors.items()}
    write_bundle(clean_separators(document([team_label(render_sheet(s,colors),pack['sheets'][i]).replace('</section>',identity(pack['sheets'][i],pack['packId'])+'</section>') for i,s in enumerate(words)],'Paper Weights',CSS)),output/'words.pdf',count,deck_report(words,colors,seed))
    write_bundle(clean_separators(document([rover_page(s,contexts,pack['packId']) for s in pack['sheets']],'Paper Weights / Rover',CSS)),output/'rover.pdf',count,{'packId':pack['packId'],'sheets':pack['sheets']})
    fronts=PdfReader(output/'words.pdf');backs=PdfReader(output/'rover.pdf');writer=PdfWriter()
    for a,b in zip(fronts.pages,backs.pages):writer.add_page(a);writer.add_page(b)
    writer.add_metadata({'/Title':f'Paper Weights / {pack["packId"]}'})
    with (output/'duplex.pdf').open('wb') as f:writer.write(f)
    return finish(output,pack)

def finish(output,pack):
    count=len(pack['sheets'])
    for name,n in [('words',count),('rover',count),('duplex',count*2)]:
        verify(output/f'{name}.pdf',n)
        preview(output/f'{name}.pdf')
    verify_rover(output/'rover.pdf',pack)
    verify_rover(output/'duplex.pdf',pack,duplex=True)
    preview(output/'duplex.pdf',1,'back-preview')
    assignments='\n'.join(f'{i+1:03} | {s["id"]} | {s["team"]}' for i,s in enumerate(pack['sheets']))
    (output/'PRINT.md').write_text(f'# {pack["packId"]}\n\nPrint `duplex.pdf`: A4, actual size, color, double-sided, **flip on long edge**. {count} physical sheets, {count*2} PDF pages. Odd pages are words; the following even page is that person’s Rover lookup. People may choose any team first; then hand out that team’s stack. A = top left, B = top right, C = bottom left, D = bottom right. Keep stack order and use the assignments below. Each stack has a stratified mix; randomly mixing stacks only approximates the proportions and can swing close votes. Select this exact pack ID in the game Print pack selector; do not mix packs. PW3 sheets predict GO/AVOID; older PW2 inspection-category sheets are incompatible. For Medium, use the four current cards; count your four matching GO/AVOID entries and abstain on a tie. This is a voting heuristic, not a calibrated hazard probability.\n\nPhysical sheet | Person | Team\n--- | --- | ---\n'+assignments+'\n')
    (output/'verification.json').write_text(json.dumps({'packId':pack['packId'],'people':count,'pairsPerSide':24,'pages':count*2,'pageBounds':'passed','asciiArrows':'passed','hazardStripOnlyRoverBacks':'passed','noDotSeparators':'passed','frontBackPairing':'page 2n+1 words, page 2n+2 Rover','roverActionRowsAndColors':'passed','roverGroupActionCounts':'passed'},indent=2)+'\n')
    print(output,flush=True)
    return output

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sheets',type=int,default=15)
    parser.add_argument('--seed',type=int,help='Defaults to the shared model rehearsal seed')
    args=parser.parse_args();build(args.sheets,args.seed)
