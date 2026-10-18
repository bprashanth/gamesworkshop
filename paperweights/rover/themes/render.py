#!/usr/bin/env python3
"""Visual-only alternatives. Reuse saved observations, votes and original Rover SVGs."""
from pathlib import Path
import sys,json,hashlib
sys.path[:0]=[str(Path(__file__).resolve().parents[2]),str(Path(__file__).resolve().parents[1]),str(Path(__file__).resolve().parents[1]/'context')]
from printkit import document,preview
from generator import MINIMAL_CSS
from render import glyph
from generate import map_svg
from weasyprint import HTML
from pypdf import PdfWriter
import pymupdf
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent/'context'
PACK=json.loads((SOURCE/'audience-60.json').read_text())
STAGES=json.loads((SOURCE/'stage-mockup.json').read_text())['stages']
KEYS=['RED','BLUE','AMBER','GREEN','PURPLE','PINK']
THEMES={
 '01-mission':('Mission / mineral accents',['#ad5945','#507b91','#a27c36','#527b63','#7f6b90','#a9637c']),
 '02-terminal':('Terminal / pixel accents',['#b94e40','#427fa8','#9c7823','#408563','#7964a3','#b05183']),
 '03-dotmatrix':('Telemetry / monochrome',['#383834']*6),
}
def dotkey(i,color):
    # Dice-like 2x3 matrix: six distinct marks, reinforced by readable context IDs.
    return '<svg class="dotkey" viewBox="0 0 24 16">'+''.join(f'<rect x="{2+(n%3)*8}" y="{2+(n//3)*8}" width="4" height="4" fill="{color if n<i+1 else "none"}" stroke="{color}" stroke-width=".5"/>' for n in range(6))+'</svg>'
def key(name,theme):
    i=KEYS.index(name);return f'C{i+1:02}',THEMES[theme][1][i]
def icon(cat,val,uid,ink):
    return glyph(cat,val,uid).replace('#ffffff',ink)
def marker(name,theme):
    code,c=key(name,theme)
    return dotkey(KEYS.index(name),c)+f'<b>{code}</b>'
def sheet(theme):
    cols=[]
    for start in (0,12):
        rows=[]
        for i,e in enumerate(PACK['sheets'][0]['entries'][start:start+12]):
            code,c=key(e['context'],theme);haz=e['value'] in ('dead','sand','storm')
            ink='#ffffff' if haz else '#22221f';bg='#22221f' if haz else '#ffffff'
            rows.append(f'<div class="pair"><div class="lookup" style="border-color:{c}"><div class="key" style="color:{c}">{marker(e["context"],theme)}</div><div class="face" style="background:{bg}">'+icon(e['category'],e['value'],f'{theme}p{start+i}',ink)+f'</div></div><div class="arrow">-&gt;</div><div class="right"><span class="word">{e["vote"]}</span><span class="tag" style="color:{c}">{code}</span></div></div>')
        cols.append('<div class="column">'+''.join(rows)+'</div>')
    return '<section class="sheet"><header><h1>Paper Weights / Rover</h1></header><div class="instructions"><b>1</b> Match the icon and context mark on screen to a box on the left.<br><b>2</b> Vote the <b>word on the right</b> within 10 seconds.<br><b>3</b> Take each new call from the screen. The rep chooses what to flip.</div><div class="columns">'+''.join(cols)+'</div></section>'
PAPER=MINIMAL_CSS+'''
.pair { border-radius:0; }
.lookup { width:40mm; height:10mm; display:flex; border:1.5px solid; border-left-width:4px; }
.key { width:16mm; display:flex; align-items:center; justify-content:center; gap:1mm; font-size:7pt; }
.dotkey { width:7mm; height:5mm; }
.face { width:24mm; display:flex; justify-content:center; align-items:center; }
.context-icon { width:17mm; height:9mm; }
.right .word { font-size:16pt; color:#242421; }
.right .tag { font-family:"DejaVu Sans Mono"; }
'''
def stage(theme,dark):
    bg='#080809' if dark else '#ffffff';ink='#e6e6e1' if dark else '#252522';dim='#777772' if dark else '#b4b4ad'
    panels=[]
    for st in STAGES:
        ctx,cat,val=st['call'];code,c=key(ctx,theme)
        if theme=='03-dotmatrix':c=ink
        cards=[]
        for category in ('battery','slope','dust','ground'):
            value=st['record']['current'][category];haz=value in ('dead','sand','storm');fg=bg if haz else ink;face=ink if haz else bg
            cards.append(f'<div class="card {"selected" if category==cat else ""}" style="border-color:{c}"><div class="cardkey" style="color:{c}">{dotkey(KEYS.index(ctx),c)} {code}<span>{category.upper()}</span></div><div class="cardface" style="color:{fg};background:{face}">'+icon(category,value,f'{theme}{dark}{st["team"]}{category}',fg)+f'<div>{value.upper()}</div></div></div>')
        route=map_svg().replace('#20201e',ink).replace('#a5a59b','#41413d' if dark else '#c7c7bf').replace('#d7d7cd','#252522' if dark else '#e7e7e1')
        n=sum(st['votes'].values());bars=''.join(f'<div class="vote"><span>{k.upper()}</span><div class="track"><i style="width:{100*v/n}%;background:{ink}"></i></div><b>{round(100*v/n)}%</b></div>' for k,v in st['votes'].items())
        panels.append(f'<div class="panel"><div class="panelhead"><b>{st["team"]} / SQUARE 06</b><span>10 SEC</span></div><div class="map">{route}<div class="maplabel">JEZERO / TRAVERSE</div></div><div class="call" style="color:{c}">{dotkey(KEYS.index(ctx),c)} MATCH {code} / {val.upper()}<span>06 / 14</span></div><div class="cards">'+''.join(cards)+'</div><div class="votes">'+bars+'</div><div class="next">NEXT SQUARE 07 · VOTE FOR ONE CATEGORY</div></div>')
    css=f'''@page {{ size: 400mm 250mm; margin:0; background:{bg}; }}
body {{ background:{bg}; color:{ink}; }} .sheet {{ padding:9mm 10mm; }}
header {{ border-color:{ink}; padding:0 0 3mm; display:flex; justify-content:space-between; align-items:center; }}
h1 {{ font-size:22pt; letter-spacing:-1px; }} .phase {{ font-size:9pt; }}
.panels {{ display:grid; grid-template-columns:1fr 1fr; gap:5mm; margin-top:5mm; }}
.panel {{ border:1px solid {dim}; padding:3mm; }} .panelhead {{ display:flex; justify-content:space-between; font-size:11pt; }}
.panelhead span {{ font-size:9pt; border:1px solid {dim}; padding:.5mm 2mm; }}
.map {{ height:25mm; position:relative; overflow:hidden; border-bottom:1px solid {dim}; margin:1mm 0; }}
.route {{ width:100%;height:25mm; }} .maplabel {{ position:absolute; bottom:1mm; left:0; font-size:6pt; }}
.call {{ display:flex; align-items:center; gap:2mm; font-size:9pt; font-weight:bold; margin:2mm 0; }} .call span {{ margin-left:auto;color:{ink};font-size:7pt; }}
.dotkey {{ width:7mm; height:4mm; }} .cards {{ display:flex; gap:2mm; }}
.card {{ width:25%;border:1px solid; }} .selected {{ outline:1px solid {ink};outline-offset:.7mm; }}
.cardkey {{ height:5mm; display:flex; align-items:center; gap:1mm; padding:0 1mm; font-size:6pt; }} .cardkey .dotkey {{ width:5mm; }} .cardkey span {{ margin-left:auto;font-size:5.5pt; }}
.cardface {{ height:19mm; text-align:center; padding:1mm; font-size:7pt; }} .context-icon {{ display:block;width:25mm;height:13mm;margin:auto; }}
.votes {{ margin-top:2mm; }} .vote {{ display:flex;align-items:center;gap:3mm;font-size:6.5pt;margin:.8mm 0; }} .vote span {{ width:18mm; }} .vote b {{ font-weight:normal; }}
.track {{ width:105mm;height:1.5mm; background:{'#292927' if dark else '#eeeeea'}; }} .track i {{ display:block;height:1.5mm; }}
.next {{ font-size:6pt; margin-top:2mm; }}
'''
    if theme=='02-terminal':css+='header { border-top-style:dashed; } .panelhead b { letter-spacing:1px; } .track i { border-right:2px solid #8a8a86; }'
    if theme=='03-dotmatrix':css+='header { border-top-style:dotted; } .panel { border-style:dotted; } .map { border-bottom-style:dotted; }'
    return '<section class="sheet"><header><h1>ROVER RUN</h1><div class="phase">02 / SUDDEN DEATH</div></header><div class="panels">'+''.join(panels)+'</div></section>',css

def save(name,body,css):
    html=document([body],name,css);path=HERE/f'{name}.pdf';path.with_suffix('.html').write_text(html)
    HTML(string=html).write_pdf(path)
    with pymupdf.open(path) as doc:
        assert len(doc)==1,(name,len(doc))
        for b in doc[0].get_text('blocks'):
            assert b[0]>=-1 and b[1]>=-1 and b[2]<=doc[0].rect.width+1 and b[3]<=doc[0].rect.height+1,(name,b)
        assert '→' not in doc[0].get_text()
    preview(path);return path

def main():
    paths=[];gallery=[]
    for theme,(title,colors) in THEMES.items():
        paper=save(theme+'-paper',sheet(theme),PAPER);paths.append(paper)
        screens=[]
        for dark in (False,True):
            name=theme+('-dark' if dark else '-light');body,css=stage(theme,dark);paths.append(save(name,body,css));screens.append(name)
        gallery.append(f'<section><h2>{title}</h2><div class="row"><a href="{paper.name}"><img src="{paper.stem}-preview.png"><span>White paper / PDF</span></a>'+''.join(f'<a href="{name}.pdf"><img src="{name}-preview.png"><span>{name.rsplit("-",1)[1]} screen / PDF</span></a>' for name in screens)+'</div></section>')
    writer=PdfWriter()
    for path in paths:writer.append(path)
    with (HERE/'review-all.pdf').open('wb') as f:writer.write(f)
    (HERE/'index.html').write_text('<!doctype html><html><meta charset="utf-8"><title>Rover theme review</title><style>body{margin:32px;background:#f4f3ef;color:#252522;font:15px monospace}h1{font-size:26px}section{margin:40px 0}.row{display:grid;grid-template-columns:.65fr 1.2fr 1.2fr;gap:24px}img{width:100%;border:1px solid #aaa}a{color:inherit;text-decoration:none}span{display:block;margin:8px 0}p{max-width:1000px;line-height:1.6}</style><h1>Rover Run / stage 02 / theme review</h1><p>Same observations and votes in every treatment. Context IDs C01–C06 replace the earlier color names. Inversion identifies a hazard; the border and dot mark identify context. All paper stays white. These are source-review snapshots, not an implemented live flip flow.</p><a href="review-all.pdf">Download all nine mockups</a>'+''.join(gallery)+'</html>')
    (HERE/'manifest.json').write_text(json.dumps({'themes':THEMES,'context_mapping':dict(zip(KEYS,[f'C{i+1:02}' for i in range(6)])),'source_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (SOURCE/'audience-60.json',SOURCE/'stage-mockup.json')},'outputs':[p.name for p in paths],'pages_verified':len(paths)},indent=2))
    print('Rendered and checked 9 pages; gallery: '+str(HERE/'index.html'))
if __name__=='__main__':main()
