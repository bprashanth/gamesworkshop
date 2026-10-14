#!/usr/bin/env python3
"""Build paired Paper Weights fronts and shared-model Rover backs."""
import argparse
import importlib.util
import json
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
.dotkey { width:7mm; height:5mm; }
.face { width:24mm; display:flex; justify-content:center; align-items:center; }
.context-icon { width:17mm; height:9mm; }
.right .word { font-size:16pt; color:#242421; }
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

def dotkey(code,color):
    index=int(code[1:])
    return '<svg class="dotkey" viewBox="0 0 24 16">'+''.join(f'<rect x="{2+n%3*8}" y="{2+n//3*8}" width="4" height="4" fill="{color if n<index else "none"}" stroke="{color}" stroke-width=".5"/>' for n in range(6))+'</svg>'

def identity(sheet,pack_id):
    return f'<div class="identity">{pack_id} / {sheet["team"]} / {sheet["id"]}</div>'

def rover_page(sheet,contexts,pack_id):
    entries=sorted(sheet['entries'],key=lambda e:(e['context'],e['category'],e['value']))
    assert len(entries)==24 and len({e['key'] for e in entries})==24
    columns=[]
    for start in (0,12):
        rows=[]
        for i,e in enumerate(entries[start:start+12]):
            code=e['context'];color=contexts[code]['light'];hazard=e['value'] in ('dead','storm','sand')
            ink='#ffffff' if hazard else '#22221f';bg='#22221f' if hazard else '#ffffff'
            rows.append(f'<div class="pair"><div class="lookup" style="border-color:{color}"><div class="key" style="color:{color}">{dotkey(code,color)}<b>{code}</b></div><div class="face" style="background:{bg}">'+icon(e['category'],e['value'],f'{sheet["id"]}-{start+i}',ink)+f'</div></div><div class="arrow">-&gt;</div><div class="right"><span class="word">{escape(e["nextCategory"])}</span><span class="tag" style="color:{color}">{code}</span></div></div>')
        columns.append('<div class="column">'+''.join(rows)+'</div>')
    return '<section class="sheet"><header><h1>Paper Weights / Rover</h1></header><div class="instructions"><b>1</b> Match the icon and context mark on screen to a box on the left.<br><b>2</b> Vote the <b>word on the right</b> within 10 seconds.<br><b>3</b> Take each new call from the screen. The rep chooses what to flip.</div><div class="columns">'+''.join(columns)+'</div>'+identity(sheet,pack_id)+'</section>'

def verify(pdf,count):
    with pymupdf.open(pdf) as doc:
        assert len(doc)==count,(pdf,len(doc),count)
        for n,page in enumerate(doc):
            text=page.get_text()
            assert 'Paper Weights' in text and 'Human Language Model' not in text
            assert '→' not in text and text.count('->')==24,(pdf,n,text.count('->'))
            for b in page.get_text('blocks'):
                assert b[0]>=-1 and b[1]>=-1 and b[2]<=page.rect.width+1 and b[3]<=page.rect.height+1,(pdf,n,b)

def build(count,seed):
    if not 12 <= count <= 200:
        raise ValueError("Use 12–200 people for a paired competitive pack.")
    spec=importlib.util.spec_from_file_location('paperweights_competition_generator',ROOT/'competition/generate.py')
    model=importlib.util.module_from_spec(spec);spec.loader.exec_module(model)
    pack=model.make_pack(sheet_count=count,seed=seed)
    output=ROOT/'printouts'/pack['packId'];output.mkdir(parents=True,exist_ok=True)
    (output/'manifest.json').write_text(json.dumps(pack,indent=2)+'\n')
    gamepacks=ROOT/'web/packs';gamepacks.mkdir(parents=True,exist_ok=True)
    (gamepacks/f'{pack["packId"]}.json').write_text(json.dumps(pack,separators=(',',':'))+'\n')
    if count==15 and seed==374:
        (ROOT/'web/pack.json').write_text(json.dumps(pack,separators=(',',':'))+'\n')
    indexpath=gamepacks/'index.json'
    index=json.loads(indexpath.read_text()) if indexpath.exists() else []
    index=[p for p in index if p['packId']!=pack['packId']]
    index.append(dict(packId=pack['packId'],sheetCount=count,seed=seed,url=f'packs/{pack["packId"]}.json'))
    index.sort(key=lambda p:(p['sheetCount'],p['seed'],p['packId']))
    indexpath.write_text(json.dumps(index,indent=2)+'\n')
    words,colors=build_deck(count,seed=seed)
    contexts={c['id']:c for c in pack['contexts']}
    names=['RED','BLUE','AMBER','GREEN','PURPLE','PINK']
    fills={name:pack['contexts'][i]['light'] for i,name in enumerate(names)}
    colors={word:{**c,'fill':fills[c['name']]} for word,c in colors.items()}
    write_bundle(document([render_sheet(s,colors).replace('</section>',identity(pack['sheets'][i],pack['packId'])+'</section>') for i,s in enumerate(words)],'Paper Weights',CSS),output/'words.pdf',count,deck_report(words,colors,seed))
    write_bundle(document([rover_page(s,contexts,pack['packId']) for s in pack['sheets']],'Paper Weights / Rover',CSS),output/'rover.pdf',count,{'packId':pack['packId'],'sheets':pack['sheets']})
    fronts=PdfReader(output/'words.pdf');backs=PdfReader(output/'rover.pdf');writer=PdfWriter()
    for a,b in zip(fronts.pages,backs.pages):writer.add_page(a);writer.add_page(b)
    writer.add_metadata({'/Title':f'Paper Weights / {pack["packId"]}'})
    with (output/'duplex.pdf').open('wb') as f:writer.write(f)
    for name,n in [('words',count),('rover',count),('duplex',count*2)]:
        verify(output/f'{name}.pdf',n)
        preview(output/f'{name}.pdf')
    preview(output/'duplex.pdf',1,'back-preview')
    assignments='\n'.join(f'{i+1:03} | {s["id"]} | {s["team"]}' for i,s in enumerate(pack['sheets']))
    (output/'PRINT.md').write_text(f'# {pack["packId"]}\n\nPrint `duplex.pdf`: A4, actual size, color, double-sided, **flip on long edge**. {count} physical sheets, {count*2} PDF pages. Odd pages are words; the following even page is that person’s Rover lookup. Keep stack order when splitting into teams. Select this exact pack ID in the game's Print pack selector; do not mix packs.\n\nPhysical sheet | Person | Team\n--- | --- | ---\n'+assignments+'\n')
    (output/'verification.json').write_text(json.dumps({'packId':pack['packId'],'people':count,'pairsPerSide':24,'pages':count*2,'pageBounds':'passed','asciiArrows':'passed','frontBackPairing':'page 2n+1 words, page 2n+2 Rover'},indent=2)+'\n')
    print(output,flush=True)
    return output

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sheets',type=int,default=15)
    parser.add_argument('--seed',type=int,default=374)
    args=parser.parse_args();build(args.sheets,args.seed)
