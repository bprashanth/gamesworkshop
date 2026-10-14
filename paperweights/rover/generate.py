#!/usr/bin/env python3
"""Print audience evidence, voting paddles, and four-map crossover mockups."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from printkit import document, header, write_bundle, preview
from model import CATEGORIES, VALUES, build_pack, audit, hazard

HERE = Path(__file__).resolve().parent
GAME = HERE.parents[1] / 'space/rover-run/src/web'
SYMBOLS = json.loads((HERE/'symbols.json').read_text())
KEY = {'battery': (1, 'BLUE', '#2563eb'), 'slope': (2, 'AMBER', '#d97706'),
       'dust': (3, 'PURPLE', '#7c3aed'), 'ground': (4, 'GREEN', '#16a34a')}
LABEL = {'tilted': 'slope', 'sand': 'SAND', 'storm': 'STORM', 'dead': 'dead'}
CSS = '''
.rover-pair { height: 27mm; display: flex; align-items: center; border: 1px solid #d9d9d2; padding: 1.5mm; border-radius: 1mm; margin-bottom: 2mm; break-inside: avoid; }
.cue, .answer { width: 38mm; text-align: center; }
.cue { border-radius: .8mm; padding: 1mm; }
.cue-label { color: white; font: bold 7pt "DejaVu Sans", sans-serif; padding: 0 0 1mm; }
.tile { width: 27mm; height: 17mm; margin: auto; background: #000; color: #e6e6e1; border: 1px solid #5a5a58; border-radius: .8mm; text-align: center; padding: 1mm; }
.tile.hazard { background: white; color: #000; border: 1px solid #20201e; }
.tile .sym { display: block; width: 17mm; height: 10mm; margin: auto; }
.sym { fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.sym .fill { fill: currentColor; stroke: none; }
.sym .thin { stroke-width: 1; }
.sym .faint { stroke-opacity: .55; }
.tile .value { font-size: 8pt; line-height: 1; }
.answer-label { font: bold 7.5pt "DejaVu Sans", sans-serif; margin-top: 1mm; }
.rover-arrow { width: 9mm; text-align: center; color: #62625d; font-size: 15pt; }
.memory { height: 27mm; border: 1px dashed #b8b8af; padding: 2mm; font: 8.5pt/1.5 "DejaVu Sans", sans-serif; }
.paddle-key { display: flex; gap: 2mm; margin: 3mm 0; }
.paddle-key div { width: 25%; border-bottom: 3px solid; font-size: 8pt; padding: 2mm 0; }
.route { width: 100%; height: 58mm; border: 1px solid #b8b8af; margin: 2mm 0; }
.route path { fill: none; }
.board { width: 100%; border-collapse: separate; border-spacing: .6mm; }
.board th { font-size: 7pt; font-weight: normal; }
.board .tile { width: 10.5mm; height: 15mm; padding: 1mm 0; }
.board .tile .sym { width: 9mm; height: 8mm; }
.board .tile .value { font-size: 4.8pt; }
.board .row-label { width: 17mm; font-size: 6pt; text-align: left; }
.vote-row { display: flex; align-items: center; margin: 2mm 0; font-size: 9pt; }
.vote-row .label { width: 34mm; }
.vote-row .track { width: 75mm; height: 4mm; border-bottom: 1px solid #d9d9d2; }
.vote-row .bar { height: 4mm; }
.vote-row .count { margin-left: 3mm; }
.small { font: 8pt/1.5 "DejaVu Sans", sans-serif; }
h2 { font-size: 13pt; margin: 4mm 0 2mm; }
.paddle { height: 108mm; border: 1px dashed #9b9b94; padding: 6mm; margin-bottom: 5mm; text-align: center; }
.paddle .number { font-size: 70pt; font-weight: bold; line-height: 1.1; }
.paddle .name { font-size: 22pt; font-weight: bold; }
.paddle .stripe { height: 18mm; margin-top: 4mm; color: white; padding: 4mm; font-size: 17pt; }
.stage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
.stage-panel { border: 1px solid #b8b8af; padding: 4mm; }
.stage-panel h2 { margin: 0; }
.stage-panel .route { height: 38mm; }
.stage-panel .vote-row { font-size: 8pt; margin: 1mm 0; }
.stage-panel .vote-row .track { width: 48mm; }
.stage-panel .vote-row .label { width: 28mm; }
.stage-cards { display: flex; gap: 2mm; margin: 2mm 0; }
.stage-cards .tile { width: 28mm; height: 15mm; font-size: 14pt; padding-top: 3mm; }
'''


def tile(cat, value, uid):
    # SVG clip IDs must be unique when many copies share one HTML/PDF document.
    svg = SYMBOLS[cat][value]
    for old in ('cs', 'cq'):
        svg = svg.replace(f'id="{old}"', f'id="{old}-{uid}"').replace(f'url(#{old})', f'url(#{old}-{uid})')
    deadly = value in ('sand', 'storm', 'dead')
    # WeasyPrint does not apply outer-document SVG selectors consistently. Bake
    # presentation attributes into the exact exported paths for portable print.
    root = ET.fromstring(svg)
    root.set('fill', 'none')
    root.set('stroke', '#000000' if deadly else '#e6e6e1')
    root.set('stroke-width', '1.4')
    root.set('stroke-linecap', 'round')
    root.set('stroke-linejoin', 'round')
    for element in root.iter():
        classes = element.get('class', '').split()
        if 'fill' in classes:
            element.set('fill', '#000000' if deadly else '#e6e6e1')
            element.set('stroke', 'none')
        if 'thin' in classes:
            element.set('stroke-width', '1')
        if 'faint' in classes:
            element.set('stroke-opacity', '.55')
    svg = ET.tostring(root, encoding='unicode')
    return f'<div class="tile{" hazard" if deadly else ""}">{svg}<div class="value">{LABEL.get(value,value)}</div></div>'


def paddle_key():
    return '<div class="paddle-key">' + ''.join(f'<div style="border-color:{KEY[c][2]}"><b>{KEY[c][0]} / {c.upper()}</b><br>{KEY[c][1]}</div>' for c in CATEGORIES) + '</div>'


def evidence_pair(record, uid):
    cat, val, vote = record['cue_category'], record['cue_value'], record['vote']
    number, color, ink = KEY[cat]
    vn, vc, vi = KEY[vote]
    return (f'<div class="rover-pair"><div class="cue" style="background:{ink}"><div class="cue-label">{number} {cat.upper()} / {color}</div>' + tile(cat,val,uid+'l') + '</div><div class="rover-arrow">-></div><div class="answer">' + tile(vote,record['value'],uid+'r') + f'<div class="answer-label" style="color:{vi}">VOTE {vn} / {vote.upper()}</div><div class="tag">{vc}</div></div></div>')


def audience_pages(sheets, seed):
    pages = []
    for s in sheets:
        pairs = [evidence_pair(r, f'{s["team"]}{s["member"]}-{i}') for i,r in enumerate(s['records'])]
        pairs.append('<div class="memory"><b>LOOK -> FOLLOW -> VOTE</b><br>The right card is a past example, not a peek at this map.<br>Vote for its <b>category</b>; the rep chooses what to reveal.</div>')
        cols = ''.join('<div class="column"><div class="column-label">MATCH CURRENT -> EVIDENCE FROM NEXT SQUARE</div>' + ''.join(pairs[i:i+6]) + '</div>' for i in (0,6))
        pages.append('<section class="sheet">' + header('02 / PAPER WEIGHTS × ROVER RUN', 'Your piece of the data', f'TEAM {s["team"]}<br>SHEET {s["member"]:02d}') +
            '<div class="instructions"><b>1</b> The rep calls a revealed card, e.g. <b>DUST / HAZE</b>.<br><b>2</b> Find that left card. Follow its arrow to your historical example.<br><b>3</b> Raise the right-hand <b>category’s paddle</b>. One person, one vote.</div>' + paddle_key() + '<div class="columns">'+cols+'</div>' +
            '<div class="note"><b>After the vote:</b> the rep flips that category in the <b>next square</b>.<br>A second vote uses the <b>same source cue</b>. If your category is already open, abstain.</div>' +
            f'<footer><b>KEEP THIS SHEET FOR TEAM {s["team"]}.</b> Vote colors identify categories, not danger.<br>White Rover cards mean SAND, STORM or dead battery · Simulated historical examples · Seed {seed}</footer></section>')
    return pages


def map_svg():
    m = json.loads((GAME/'map.json').read_text())
    def path(points):
        return ' '.join(f'{"M" if i==0 else "L"}{points[i]*600:.1f},{points[i+1]*300:.1f}' for i in range(0,len(points),2))
    contours = ''.join(f'<path fill="none" d="{path(c["p"])}" stroke="#a5a59b" stroke-width=".7" stroke-dasharray="1.1 1.7"/>' for c in m['contours'])
    strips = ''.join(f'<path fill="none" d="M{x*600:.1f} 0 V300" stroke="#d7d7cd" stroke-width=".6"/>' for x in m['strips'])
    return f'<svg class="route" viewBox="0 0 600 300">{contours}{strips}<path fill="none" d="{path(m["route"])}" stroke="#20201e" stroke-width="1.6"/></svg>'


def vote_bars(group, cue='dust:haze'):
    rows = group['cues'][cue]
    return ''.join(f'<div class="vote-row"><div class="label">{KEY[c][0]} {c.upper()}</div><div class="track"><div class="bar" style="width:{rows["percent"][c]}%;background:{KEY[c][2]}"></div></div><div class="count">{rows["votes"][c]}/{group["people"]} · {rows["percent"][c]:g}%</div></div>' for c in CATEGORIES)


def facilitator_pages(maps, report):
    pages=[]
    for route in maps:
        team=route['team']
        board='<table class="board"><tr><th></th>' + ''.join(f'<th>{n+1}</th>' for n in range(14)) + '</tr>'
        for cat in ('slope','ground','dust','battery'):
            board+=f'<tr><th class="row-label">{KEY[cat][0]} {cat}</th>' + ''.join('<td>'+tile(cat,r[cat],f'map{team}{cat}{i}')+'</td>' for i,r in enumerate(route['squares'])) + '</tr>'
        board+='</table>'
        start=', '.join(f'{c}: {LABEL.get(route["start"][c],route["start"][c])}' for c in CATEGORIES)
        pages.append('<section class="sheet">' + header('FACILITATOR ONLY / ALL FUTURE CARDS REVEALED', f'Rover Run / route {team}', f'TEAM {team}<br>14 SQUARES') +
            '<div class="small">Synthetic card route on the Jezero visual reference. Card slopes are simulated;<br>they are not measurements of these contour strips.</div>' + map_svg() + board +
            f'<div class="small"><b>Square 0 (start):</b> {start}.<br>Reveal only DUST / HAZE for the opening vote. Carry the start’s battery state.</div>' +
            '<h2>Opening vote / HAZE -> next category</h2>' + vote_bars(report['groups'][team]) +
            '<div class="note"><b>Counts come from this team’s printed sheets.</b> They describe where the evidence is, not the probability of a storm. Each right card is an independent historical observation.</div>' +
            '<h2>One life / two reveals / then decide</h2><div class="small">Highest count is the default reveal; the rep may override and explain why. Ties: the rep chooses. Second reveal: same cue; already-open category abstains. No votes: rep chooses.<br><b>GO into SAND or STORM = death. AVOID safe ground = death.</b><br>Recharge before moving on a dead battery. A correct avoid passes the hazard.<br>After crossing, reveal the full square. Its chosen source card cues the next vote.</div>' +
            '<footer>Prototype extension rules only; frozen Rover Run is unchanged.<br>Battery is dead immediately after SAND or STORM, not a forecast of a future hazard.</footer></section>')
    return pages


def stage_page(maps, report):
    panels=[]
    for route in maps:
        team=route['team']
        cards=''.join(f'<div><div class="small">{KEY[c][0]} {c.upper()}</div><div class="tile">?</div></div>' for c in CATEGORIES)
        panels.append(f'<div class="stage-panel"><h2>TEAM {team} / SQUARE 1</h2>' + map_svg() + '<div class="small"><b>Revealed at square 0: DUST / HAZE</b></div><div class="stage-cards">'+cards+'</div>'+vote_bars(report['groups'][team])+'<div class="small">Vote -> rep chooses -> reveal -> GO / AVOID</div></div>')
    return '<section class="sheet">'+header('STAGE MOCKUP / FOUR INDEPENDENT CARD ROUTES', 'Paper Weights × Rover Run', 'OPENING VOTE')+'<div class="small">Actual opening vote counts from this print pack. Four separate future card sequences; shared Jezero reference backdrop. No future outcomes shown.</div><div class="stage-grid">'+''.join(panels)+'</div><footer>STATIC MOCKUP · Paddle voting works now. A live poll, four-board controller and score engine are future integration work.</footer></section>'


def paddle_pages():
    pages=[]
    for team in 'ABCD':
        tiles=[]
        for cat in CATEGORIES:
            n,c,ink=KEY[cat]
            tiles.append(f'<div class="paddle"><div class="kicker">PAPER WEIGHTS × ROVER RUN / TEAM {team}</div><div class="number">{n}</div><div class="name">{cat.upper()}</div><div class="stripe" style="background:{ink}">{c}</div><div class="small">Raise one paddle per vote</div></div>')
        pages.append('<section class="sheet">'+header('CUT ALONG THE DOTTED EDGES', 'Your four votes',f'TEAM {team}')+'<div class="columns" style="margin-top:5mm"><div class="column">'+''.join(tiles[:2])+'</div><div class="column">'+''.join(tiles[2:])+'</div></div></section>')
    return pages


def worked_example_page():
    # A possible path under the shared kernel, not an answer key for any team map.
    rows = [
        {'slope': 'flat', 'ground': 'firm', 'dust': 'haze', 'battery': 'full'},
        {'slope': 'tilted', 'ground': 'firm', 'dust': 'storm', 'battery': 'full'},
        {'slope': 'flat', 'ground': 'firm', 'dust': 'clear', 'battery': 'dead'},
    ]
    from model import kernel
    assert all(any(n == b for n,p in kernel(a)) for a,b in zip(rows,rows[1:]))
    panels=[]
    for i, row in enumerate(rows):
        cards=''.join('<div style="text-align:center"><div class="small">'+c.upper()+'</div>'+tile(c,row[c],f'worked{i}{c}')+'</div>' for c in CATEGORIES)
        panels.append(f'<h2>{i+1:02d} / '+['Current square: haze is the cue','Next square: the storm is here','Following square: the battery is dead'][i]+'</h2><div style="display:flex;gap:6mm">'+cards+'</div>')
    return '<section class="sheet">'+header('FACILITATOR / A POSSIBLE THREE-SQUARE SEQUENCE', 'Full does not mean safe', 'WORKED<br>EXAMPLE')+paddle_key()+''.join(panels)+"""
    <h2>Read the paper, then choose what to reveal</h2>
    <div class="instructions">Some sheets say <b>HAZE -> FULL / vote 1 BATTERY</b>.<br>
    Other sheets say <b>HAZE -> STORM / vote 3 DUST</b>.<br>
    Both observations are possible under the same model—even in the same historical case.</div>
    <div class="note"><b>If the rep flips battery:</b> it is full in square 2. That does not clear the weather.<br>
    <b>If the rep flips dust:</b> STORM is visible, so AVOID is justified.<br>
    The battery is dead in square 3, immediately after the hazard. Recharge before moving on.</div>
    <h2>Sudden death makes both errors matter</h2>
    <div class="instructions"><b>GO into SAND or STORM:</b> the run ends.<br>
    <b>AVOID a safe square:</b> the run also ends.<br>
    <b>Move on a dead battery:</b> the run ends. Recharge first.</div>
    <footer>Illustrated valid model sequence, not one of the four sealed routes.<br>
    In frozen Rover Run, battery also dies after SAND. The false-avoid death is new to this extension.</footer></section>"""


def generate(total, seed, output):
    sheets,maps,archive=build_pack(total,seed)
    report=audit(sheets,maps,archive)
    report.update({'seed':seed,'sheet_count':total,'sheets':sheets,
        'frozen_assets':{f:hashlib.sha256((GAME/f).read_bytes()).hexdigest() for f in ('symbols.js','style.css','map.json','deck.json')}})
    output.mkdir(parents=True,exist_ok=True)
    audience=output/f'rover-audience-{total}.pdf'
    write_bundle(document(audience_pages(sheets,seed),'Rover Run — audience evidence',CSS),audience,total,report)
    preview(audience)
    # Show actual variation, not just a single sample page.
    preview(audience,1,'second-sheet')
    private={'seed':seed,'routes':maps,'warning':'FACILITATOR ONLY: contains future outcomes'}
    write_bundle(document(facilitator_pages(maps,report),'Rover Run — facilitator routes',CSS),output/'facilitator-maps.pdf',4,private)
    preview(output/'facilitator-maps.pdf')
    write_bundle(document(paddle_pages(),'Rover Run — cut-out paddles',CSS),output/'paddles.pdf',4,{'teams':list('ABCD'),'category_key':KEY})
    preview(output/'paddles.pdf')
    # Stage is a widescreen-style landscape print, separate from the A4 audience pack.
    from weasyprint import HTML
    from pypdf import PdfReader
    stage=document([stage_page(maps,report)],'Rover Run — four-team stage mockup',CSS+'@page { size: A3 landscape; margin: 10mm; } .stage-grid { margin-top: 4mm; } .stage-panel .route { height: 42mm; }')
    (output/'stage-mockup.html').write_text(stage)
    HTML(string=stage).write_pdf(output/'stage-mockup.pdf')
    assert len(PdfReader(output/'stage-mockup.pdf').pages)==1
    preview(output/'stage-mockup.pdf')
    write_bundle(document([worked_example_page()], 'Rover Run — worked example', CSS), output/'worked-example.pdf', 1, {'kind': 'Illustrated valid model sequence'})
    preview(output/'worked-example.pdf')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sheets',type=int,default=15,help='Total audience members across four teams')
    parser.add_argument('--seed',type=int,default=42)
    parser.add_argument('--output-dir',type=Path,default=HERE/'output')
    args=parser.parse_args()
    generate(args.sheets,args.seed,args.output_dir)
