#!/usr/bin/env python3
"""Inspect every delivered PDF: pagination, clipping, exact Paper Weights words and colors."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import pymupdf as fitz
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
summary = []
for path in sorted(ROOT.rglob('*.pdf')):
    if '.venv' in path.parts:
        continue
    doc = fitz.open(path)
    data = json.loads(path.with_suffix('.json').read_text()) if path.with_suffix('.json').exists() else None
    if data and 'pdf' in data:
        assert len(PdfReader(path).pages) == data['pdf']['pages'], path
    if data and 'sheet_count' in data:
        assert len(doc) == data['sheet_count'], path
    if data and 'frozen_assets' in data:
        game = ROOT.parent / 'space/rover-run/src/web'
        for filename, digest in data['frozen_assets'].items():
            assert hashlib.sha256((game/filename).read_bytes()).hexdigest() == digest, filename
    maximum = 0
    for i, page in enumerate(doc):
        spans = [s for b in page.get_text('dict')['blocks'] if 'lines' in b
                 for line in b['lines'] for s in line['spans'] if s['text'].strip()]
        assert spans, (path,i,'blank')
        assert '→' not in page.get_text() and '⇒' not in page.get_text(), (path,i,'single-character arrow')
        for span in spans:
            x0,y0,x1,y1 = span['bbox']
            assert x0 >= 27 and y0 >= 27 and x1 <= page.rect.width-27 and y1 <= page.rect.height-27, (path,i,span)
        maximum = max(maximum,(max(s['bbox'][3] for s in spans)-min(s['bbox'][1] for s in spans))*25.4/72)
        if (path.name.startswith('paper-weights-') or ('printouts' in path.parts and path.name=='words.pdf')) and data and 'sheets' in data:
            for removed in ('THE ROOM IS THE MODEL', 'SHEET', 'MATCH THE BOX', 'ONE PAIR IS ONE EXAMPLE', 'Seed', 'No match?', 'Punctuation counts'):
                assert removed not in page.get_text(), (path,i,removed)
            words = [s for s in spans if abs(s['size']-16)<.1]
            assert len(words)==48, (path,i,len(words))
            expected=Counter()
            for a,b in data['sheets'][i]:
                expected[(a,0xffffff)]+=1
                expected[(b,int(data['colors'][b]['fill'][1:],16))]+=1
            assert Counter((s['text'],s['color']) for s in words)==expected,(path,i,'token/color mismatch')
            # Inspect the solid left fills too, not only right-hand text colors.
            fills=Counter()
            palette={int(c['fill'][1:],16) for c in data['colors'].values()}
            for drawing in page.get_drawings():
                fill=drawing.get('fill')
                if fill and drawing['rect'].height > 20:
                    color=sum(round(v*255) << (16-8*j) for j,v in enumerate(fill))
                    if color in palette:
                        fills[color]+=1
            expected_fills=Counter(int(data['colors'][a]['fill'][1:],16) for a,b in data['sheets'][i])
            assert fills == expected_fills,(path,i,'left box colors',fills,expected_fills)
    if (path.name.startswith('paper-weights-') or ('printouts' in path.parts and path.name=='words.pdf')) and data and 'sheets' in data:
        assert maximum<=255,(path,maximum)
    summary.append({'file':str(path.relative_to(ROOT)), 'pages':len(doc),
                    'text_extent_mm':round(maximum,2),'no_clipped_text':True})
(ROOT/'checks').mkdir(exist_ok=True)
(ROOT/'checks/pdf-verification.json').write_text(json.dumps(summary,indent=2)+'\n')
print(f'Verified {sum(s["pages"] for s in summary)} pages in {len(summary)} PDFs; no clipped text, exact Paper Weights tokens/colors, frozen asset hashes match.')
