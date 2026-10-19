"""Extract exact printed word rows, preserving duplicates and person boundaries.
Usage: python3 import_duplex.py /path/to/duplex.pdf [--output destination.json]
Requires PyMuPDF only for importing; the site builds from the checked-in JSON.
"""
from pathlib import Path
import argparse, hashlib, json, re
import fitz
COLORS='RED|BLUE|AMBER|GREEN|PURPLE|PINK'
ROW=re.compile(r'\b('+COLORS+r')\s+(\S+)\s*->\s*(\S+)\s*\(('+COLORS+r')\)')
IDENTITY=re.compile(r'(PW\S+) / ([A-D]) / (\d{3})')

def rows(page,clip=None):
    return [[f'{a}:{word}',f'{b}:{answer}'] for a,word,answer,b in ROW.findall(page.get_text(clip=clip))]

def extract(path):
    sheets=[];labels=[]
    with fitz.open(path) as pdf:
        assert len(pdf)%2==0
        for index in range(0,len(pdf),2):
            page=pdf[index];text=page.get_text();back=pdf[index+1].get_text()
            assert 'Paper Weights / Rover' not in text and 'Paper Weights / Rover' in back
            identity=IDENTITY.search(text);assert identity and identity.group(0) in back
            extracted=rows(page);assert len(extracted)==24,(index,len(extracted))
            # Check column boundaries independently: no crossing between adjacent pairs.
            w,h=page.rect.width,page.rect.height
            columns=rows(page,fitz.Rect(0,0,w/2,h))+rows(page,fitz.Rect(w/2,0,w,h))
            assert extracted==columns
            sheets.append(extracted)
            labels.append(dict(id=identity[3],team=identity[2],pdfPage=index+1))
        source_id=IDENTITY.search(pdf[0].get_text())[1]
    left={a for sheet in sheets for a,b in sheet};right={b for sheet in sheets for a,b in sheet}
    assert right<=left,sorted(right-left)
    assert all(sum(any(a==cue for a,b in s) for s in sheets)>=2 for cue in left)
    start='RED:the';assert start in left
    return dict(id=source_id+'-words',size=len(sheets),sheets=sheets,sheetLabels=labels,
        start=start,starts=[c for c in ['RED:the','PURPLE:I','BLUE:why'] if c in left],
        source='Prior duplex - exact printed word rows - all teams',
        sourcePdf=dict(sha256=hashlib.sha256(Path(path).read_bytes()).hexdigest(),
                       pages=len(sheets)*2,packId=source_id),
        extraction=dict(rows=len(sheets)*24,columnCheck=True,duplexIdentityCheck=True))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('pdf',type=Path)
    parser.add_argument('--output',type=Path,default=Path(__file__).with_name('prior-duplex.json'))
    args=parser.parse_args();data=extract(args.pdf)
    args.output.write_text(json.dumps(data,indent=2)+'\n')
    print(json.dumps({k:v for k,v in data.items() if k not in ('sheets','sheetLabels')},indent=2))
