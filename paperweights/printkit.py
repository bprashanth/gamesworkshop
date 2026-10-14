"""Shared white-paper layout and PDF verification for both handout families."""
import json
from pathlib import Path
from html import escape
from weasyprint import HTML
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
COLORS = [
    {'name': 'RED', 'fill': '#dc2626'}, {'name': 'BLUE', 'fill': '#2563eb'},
    {'name': 'AMBER', 'fill': '#d97706'}, {'name': 'GREEN', 'fill': '#16a34a'},
    {'name': 'PURPLE', 'fill': '#7c3aed'}, {'name': 'PINK', 'fill': '#db2777'},
]
CSS = '''
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; }
body { margin: 0; background: white; color: #20201e; font-family: "DejaVu Sans Mono", monospace; }
.sheet { break-after: page; }
.sheet:last-child { break-after: auto; }
.kicker { font-size: 8pt; letter-spacing: 1.1px; color: #62625d; }
header { border-top: 3px solid #20201e; border-bottom: 1px solid #b8b8af; padding: 4mm 0 3mm; }
.title-row { display: flex; align-items: center; justify-content: space-between; }
h1 { font-size: 21pt; letter-spacing: -1px; margin: 2mm 0; line-height: 1.15; }
.badge { font-size: 9pt; border: 1px solid #20201e; padding: 2mm; white-space: nowrap; }
.instructions { font-family: "DejaVu Sans", sans-serif; font-size: 9pt; line-height: 1.5; margin: 3mm 0; }
.instructions b { font-weight: bold; }
.legend { display: flex; justify-content: space-between; margin: 3mm 0; font-size: 7pt; }
.legend span { border-bottom: 3px solid; padding-bottom: 1mm; }
.columns { display: flex; gap: 5mm; }
.column { width: 92.5mm; }
.column-label { font-size: 7pt; color: #62625d; padding: 0 1mm 2mm; }
.pair { display: flex; align-items: center; height: 12.8mm; border: 1px solid #d9d9d2; border-radius: 1mm; margin-bottom: 1.2mm; padding: 1.3mm; break-inside: avoid; }
.left { width: 40mm; height: 10mm; border-radius: .6mm; display: flex; flex-direction: column; justify-content: center; padding: 1mm 2mm; color: white; }
.word { font-weight: bold; font-size: 16pt; line-height: 1.05; }
.tag { font: bold 6.5pt "DejaVu Sans", sans-serif; line-height: 1.3; letter-spacing: .3px; }
.arrow { width: 8mm; text-align: center; color: #62625d; font-size: 14pt; }
.right { width: 39mm; padding: 0 1mm; }
.right .tag { display: block; margin-top: .5mm; color: #494944; }
footer { border-top: 1px solid #b8b8af; margin-top: 3mm; padding-top: 2mm; font-size: 7pt; line-height: 1.5; color: #62625d; }
footer b { color: #20201e; }
.note { border-left: 3px solid #c2a374; padding: 2mm 3mm; font: 8pt/1.5 "DejaVu Sans", sans-serif; margin-top: 3mm; }
'''

def document(pages, title, extra_css=''):
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{escape(title)}</title><style>{CSS}{extra_css}</style></head><body>{"".join(pages)}</body></html>'

def header(kicker, title, badge):
    return f'<header><div class="kicker">{kicker}</div><div class="title-row"><h1>{title}</h1><div class="badge">{badge}</div></div></header>'

def write_bundle(html, output, expected_pages, report):
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.with_suffix('.html').write_text(html)
    HTML(string=html, base_url=str(HERE)).write_pdf(output)
    import pymupdf
    with pymupdf.open(output) as reader:
        assert len(reader) == expected_pages, (output, len(reader), expected_pages)
        for i, page in enumerate(reader):
            assert abs(page.rect.width - 595.276) < 1
            assert abs(page.rect.height - 841.890) < 1
            assert len(page.get_text()) > 100, f'Blank page {i+1}'
    report['pdf'] = {'pages': expected_pages, 'size': 'A4 portrait', 'verified': True}
    output.with_suffix('.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'{output}: {expected_pages} verified A4 pages')

def preview(pdf, page=0, suffix='preview'):
    import pymupdf as fitz
    path = Path(pdf)
    with fitz.open(path) as doc:
        doc[page].get_pixmap(matrix=fitz.Matrix(1.6, 1.6)).save(path.with_name(path.stem + f'-{suffix}.png'))
