#!/usr/bin/env python3
"""Three color-free paper concepts; two different participants per concept."""
from pathlib import Path
from collections import Counter
import json
import random
import sys
sys.path[:0] = [str(Path(__file__).resolve().parents[2]), str(Path(__file__).resolve().parents[1])]
from printkit import document, write_bundle, preview
from generate import tile, CSS as CARD_CSS
from model import make_archive, buckets, attention_weights, CATEGORIES, VALUES, kernel
from pypdf import PdfReader, PdfWriter

HERE = Path(__file__).resolve().parent
NUM = {'battery':1, 'slope':2, 'dust':3, 'ground':4}
CSS = CARD_CSS + '''
header { padding: 3mm 0; }
h1 { font-size: 22pt; }
.instructions { margin: 4mm 0; font-size: 9pt; }
.micro { font: 7pt/1.4 "DejaVu Sans",sans-serif; color: #555; }
.vote-key { display: flex; justify-content: space-between; border-top: 1px solid #aaa; border-bottom: 1px solid #aaa; padding: 2mm 0; margin-bottom: 4mm; font-size: 8pt; }
.history { margin: 5mm 0 6mm; }
.history h2 { font-size: 11pt; margin: 2mm 0; }
.history table { border-collapse: separate; border-spacing: 1mm; width: 100%; table-layout: fixed; }
.history th { font-size: 7pt; font-weight: normal; }
.history .category { width: 20mm; text-align: left; }
.history .tile { width: 29mm; height: 17mm; }
.history .next-only { color: #555; }
.reminder { border-top: 1px solid #aaa; padding-top: 3mm; font: 8.5pt/1.5 "DejaVu Sans",sans-serif; }
.slips { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 5mm; }
.slip { height: 34mm; border: 1px solid #ccc; border-radius: 1mm; padding: 2mm; display: flex; align-items: center; justify-content: space-between; }
.slip .label, .gate .label { font: 7pt "DejaVu Sans",sans-serif; margin-bottom: 1.5mm; text-align: center; }
.slip .destination { text-align: center; }
.slip .vote { margin-top: 1.5mm; font-size: 9pt; font-weight: bold; }
.link { text-align: center; font-size: 17pt; width: 9mm; }
.gate { border: 1px solid #ccc; border-radius: 1mm; padding: 2mm 3mm; height: 23mm; margin-bottom: 2mm; display: flex; align-items: center; justify-content: space-between; }
.gate .tile { width: 25mm; height: 16mm; }
.gate .sym { width: 16mm; height: 9mm; }
.gate .source { display:flex; gap:3mm; align-items:center; }
.gate .label { font-size:6pt; margin-bottom:1mm; }
.gate .vote { width: 33mm; font-size: 10pt; font-weight:bold; }
.gate .plus { font-size:16pt; }
.gate-head { display:flex; justify-content:space-between; font-size:7pt; margin:3mm 0; }
'''


def opening(title, instructions):
    return '<section class="sheet"><header><h1>'+title+'</h1></header><div class="instructions">'+instructions+'</div><div class="vote-key">'+''.join(f'<span><b>{NUM[c]}</b> {c.upper()}</span>' for c in CATEGORIES)+'</div>'


def history_page(strips, person):
    page = opening('Rover Run / field notes',
        '<b>10 seconds.</b> Find the called card in columns 1–4 of either journey.<br>'
        'Look one column to its right. Which card would you inspect on the live map?<br>'
        '<b>Vote one category.</b> No match? Sit this vote out.')
    for si, strip in enumerate(strips):
        page+=f'<div class="history"><h2>Past journey {si+1}</h2><table><tr><th class="category"></th>'
        page+=''.join(f'<th>{i+1} {"->" if i<4 else ""}</th>' for i in range(5))+'</tr>'
        for cat in ('slope','ground','dust','battery'):
            page+=f'<tr><th class="category">{NUM[cat]} {cat.upper()}</th>'
            page+=''.join('<td>'+tile(cat,row[cat],f'a{person}-{si}-{cat}-{j}')+'</td>' for j,row in enumerate(strip['rows']))+'</tr>'
        page+='</table></div>'
    page+='<div class="reminder">These are past journeys. The live map can turn out differently.<br>If several examples match, weigh them together and choose <b>one</b> category.<br>Column 5 has no following square here; use it only as an outcome.</div></section>'
    return page


def guided_page(records,person):
    page=opening('Rover Run / signal slips',
        '<b>10 seconds.</b> Match the called card on the left. Follow the arrow.<br>'
        'Vote the category under your right-hand example.<br>'
        'No match? Sit this vote out. The rep decides what to flip.')
    page+='<div class="slips">'
    for i,r in enumerate(records):
        page+='<div class="slip"><div><div class="label">'+r['cue'][0].upper()+' / NOW</div>'+tile(*r['cue'],f'b{person}-{i}-l')+'</div><div class="link">-></div><div class="destination"><div class="label">SEEN ONE SQUARE LATER</div>'+tile(r['vote'],r['record']['next'][r['vote']],f'b{person}-{i}-r')+f'<div class="vote">{NUM[r["vote"]]} / {r["vote"].upper()}</div></div></div>'
    return page+'</div><div class="reminder" style="margin-top:5mm">The arrow offers a clue about <b>what to inspect</b>.<br>A full battery in your example does not mean the live square is safe.</div></section>'


def gate_page(records,person):
    page=opening('Rover Run / two clues',
        '<b>10 seconds.</b> Match both: the previous square’s called card <b>and</b><br>'
        'the slope already revealed in the next square. Follow that row.<br>'
        'Vote the category at the end. No exact match? Sit this vote out.')
    for i,r in enumerate(records):
        page+='<div class="gate"><div class="source"><div><div class="label">PREVIOUS SQUARE</div>'+tile(*r['cue'],f'c{person}-{i}-l')+'</div><div class="plus">+</div><div><div class="label">VISIBLE NEXT SLOPE</div>'+tile('slope',r['slope'],f'c{person}-{i}-s')+'</div></div><div class="link">-></div><div><div class="label">PAST NEXT-SQUARE CARD</div>'+tile(r['vote'],r['record']['next'][r['vote']],f'c{person}-{i}-r')+f'</div><div class="vote">{NUM[r["vote"]]} / {r["vote"].upper()}</div></div>'
    return page+'<div class="reminder" style="margin-top:4mm">Two clues narrow the match; they do not guarantee the outcome.<br>This round uses the next square’s slope reveal, then one more reveal.</div></section>'


def verify_record(r):
    record=r['record']
    assert record['current'][r['cue'][0]]==r['cue'][1]
    assert any(n==record['next'] for n,p in kernel(record['current']))
    if 'slope' in r:
        assert record['next']['slope']==r['slope']
        assert r['vote']!='slope'


def generate(seed=42):
    archive=make_archive()
    by_cue=buckets(archive)
    pages={'a-field-notes':[], 'b-signal-slips':[], 'c-two-clues':[]}
    manifests={key: {'kind':'Brainstorm mockup, not a calibrated full-room pack',
                       'seed':seed,'participant_seeds':[seed,seed+1013],
                       'selection_note':'Second participant seed selected to contrast HAZE->STORM with HAZE->FULL. These two examples are not frequency estimates.', 'people':[]} for key in pages}
    cues=[(cat,v) for cat in CATEGORIES for v in VALUES[cat]]
    gate_cues=[(cat,v,slope) for cat,v in [('dust','haze'),('ground','soft'),('dust','storm')]
               for slope in VALUES['slope']]
    for person in range(2):
        rng=random.Random(seed+person*1013)
        strips=[]
        for journey in range(2):
            start=rng.randrange(len(archive)-4)
            selected=archive[start:start+4]
            rows=[selected[0]['current']]+[r['next'] for r in selected]
            assert all(selected[i]['next']==selected[i+1]['current'] for i in range(3))
            strips.append({'first_archive_id':selected[0]['id'],'rows':rows})
        pages['a-field-notes'].append(history_page(strips,person))
        manifests['a-field-notes']['people'].append({'strips':strips})
        records=[]
        # Ten unique cues per person, omitting different cues; HAZE always included.
        omitted=('battery','dead') if person==0 else ('slope','steep')
        selected=[c for c in cues if c!=omitted]
        rng.shuffle(selected)
        for cue in selected:
            history=by_cue[cue]
            weights=attention_weights(history)
            vote=rng.choices(CATEGORIES,weights=[weights[c] for c in CATEGORIES])[0]
            r={'cue':cue,'vote':vote,'record':rng.choice(history),'attention_weights':weights}
            verify_record(r)
            records.append(r)
        pages['b-signal-slips'].append(guided_page(records,person))
        manifests['b-signal-slips']['people'].append({'records':records})
        gates=[]
        selected=gate_cues.copy()
        # Eight exact-match contexts per page; include all HAZE combinations on both.
        selected.remove(('dust','storm','steep' if person==0 else 'flat'))
        rng.shuffle(selected)
        for cat,val,slope in selected:
            history=[r for r in by_cue[(cat,val)] if r['next']['slope']==slope]
            weights=attention_weights(history)
            eligible=[c for c in CATEGORIES if c!='slope']
            vote=rng.choices(eligible,weights=[weights[c] for c in eligible])[0]
            r={'cue':(cat,val),'slope':slope,'vote':vote,'record':rng.choice(history)}
            verify_record(r)
            gates.append(r)
        pages['c-two-clues'].append(gate_page(gates,person))
        manifests['c-two-clues']['people'].append({'records':gates})
    for name,items in pages.items():
        write_bundle(document(items,name,CSS),HERE/(name+'.pdf'),2,manifests[name])
        preview(HERE/(name+'.pdf'))
        preview(HERE/(name+'.pdf'),1,'person-2')
    writer=PdfWriter()
    for name in pages:
        for page in PdfReader(HERE/(name+'.pdf')).pages:
            writer.add_page(page)
    with (HERE/'all-concepts.pdf').open('wb') as handle:
        writer.write(handle)
    assert len(PdfReader(HERE/'all-concepts.pdf').pages)==6
    # Count actual examples for the rehearsed HAZE cue; never present fabricated votes.
    for name in ('b-signal-slips','c-two-clues'):
        result=[]
        for person in manifests[name]['people']:
            result.append([(r.get('slope','any'),r['vote'],r['record']['next'][r['vote']])
                           for r in person['records'] if r['cue']==('dust','haze')])
        print(name,'HAZE examples:',result)

if __name__=='__main__':
    generate()
