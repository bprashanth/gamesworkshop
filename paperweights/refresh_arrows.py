"""Refresh existing PDFs/previews from saved HTML after typographic replacement."""
from pathlib import Path
from weasyprint import HTML
from pypdf import PdfReader, PdfWriter
from printkit import preview
root=Path(__file__).resolve().parent
for html in sorted(root.rglob('*.html')):
    if '.venv' in html.parts: continue
    pdf=html.with_suffix('.pdf')
    if not pdf.exists(): continue
    before=len(PdfReader(pdf).pages)
    HTML(filename=str(html)).write_pdf(pdf)
    assert len(PdfReader(pdf).pages)==before, pdf
    preview(pdf)
    for suffix in ('second-sheet','person-2'):
        if pdf.with_name(pdf.stem+'-'+suffix+'.png').exists():preview(pdf,1,suffix)
    print(pdf.relative_to(root),flush=True)
writer=PdfWriter()
for name in ('a-field-notes','b-signal-slips','c-two-clues'):
    for page in PdfReader(root/'rover/concepts'/f'{name}.pdf').pages:writer.add_page(page)
with (root/'rover/concepts/all-concepts.pdf').open('wb') as f:writer.write(f)
