#!/usr/bin/env python3
"""Check delivered PDF rows, duplex pairing and game votes against each other."""
from collections import Counter
from pathlib import Path
import json
import re
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
index=json.loads((ROOT/'web/packs/index.json').read_text())
reports=[]
for item in index:
    folder=ROOT/'printouts'/item['packId']
    paper=json.loads((folder/'manifest.json').read_text())
    game=json.loads((ROOT/'web/packs'/f'{item["packId"]}.json').read_text())
    assert paper==game
    names={c['id']:c['colorName'] for c in game['contexts']}
    color_pattern='('+'|'.join(names.values())+')'
    with pymupdf.open(folder/'rover.pdf') as backs, pymupdf.open(folder/'words.pdf') as fronts, pymupdf.open(folder/'duplex.pdf') as duplex:
        assert len(backs)==len(fronts)==len(paper['sheets'])
        assert len(duplex)==2*len(backs)
        actual={}
        for i,sheet in enumerate(paper['sheets']):
            text=backs[i].get_text()
            rows=re.findall(color_pattern+r'\s*->\s*(battery|slope|dust|ground)\s*\('+color_pattern+r'\)',text)
            assert not re.search(r'C0[1-6]',text)
            entries=sorted(sheet['entries'],key=lambda e:(e['context'],e['category'],e['value']))
            assert len(rows)==len(entries)==24
            for row,e in zip(rows,entries):
                assert row==(names[e['context']],e['nextCategory'],names[e['context']]),(sheet['id'],row,e)
                actual.setdefault((sheet['team'],e['key']),Counter())[row[1]]+=1
            identity=f'{paper["packId"]} / {sheet["team"]} / {sheet["id"]}'
            assert identity in text and identity in fronts[i].get_text()
            assert duplex[2*i].get_text()==fronts[i].get_text()
            assert duplex[2*i+1].get_text()==text
        for team in game['teams']:
            for key,votes in team['votesByCue'].items():
                counts=actual[(team['id'],key)]
                assert all(counts[c]==votes[c] for c in game['categories'])
                assert sum(counts.values())==len(team['sheetIds'])
            for r in team['rounds']:
                for cue in r['targetCues'].values():
                    assert sum(actual[(team['id'],cue['key'])].values())==len(team['sheetIds'])
    reports.append(dict(packId=paper['packId'],people=paper['sheetCount'],actualPdfRows=True,duplexPairing=True,gameTallies=True))
(ROOT/'checks/production-packs.json').write_text(json.dumps(reports,indent=2)+'\n')
print(json.dumps(reports,indent=2))
