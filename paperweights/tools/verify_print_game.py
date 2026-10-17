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
    dual=game['version']>=4
    binary=game['version']>=3
    answer_field='nextAction' if binary else 'nextCategory'
    answers=['go','avoid']+game['categories'] if dual else game['actions'] if binary else game['categories']
    names={c['id']:c['colorName'] for c in game['contexts']}
    color_pattern='('+'|'.join(names.values())+')'
    with pymupdf.open(folder/'rover.pdf') as backs, pymupdf.open(folder/'words.pdf') as fronts, pymupdf.open(folder/'duplex.pdf') as duplex:
        assert len(backs)==len(fronts)==len(paper['sheets'])
        assert len(duplex)==2*len(backs)
        actual={}
        per_person={}
        for i,sheet in enumerate(paper['sheets']):
            text=backs[i].get_text()
            assert text.count('Avoid these:') == 1
            assert 'Avoid these:' not in fronts[i].get_text()
            assert f'Team {sheet["team"]}' in text
            assert f'Team {sheet["team"]}' in fronts[i].get_text()
            answer_pattern='GO|AVOID|BATTERY|SLOPE|DUST|GROUND' if dual else 'GO|AVOID' if binary else 'battery|slope|dust|ground'
            rows=re.findall(color_pattern+r'\s*->\s*('+answer_pattern+r')\s*\('+color_pattern+r'\)',text)
            assert not re.search(r'C0[1-6]',text)
            entries=sorted(sheet['entries'],key=lambda e:(e['context'],e['category'],e['value']))
            assert len(rows)==len(entries)==24
            for row,e in zip(rows,entries):
                expected=e[answer_field].upper() if binary else e[answer_field]
                assert row==(names[e['context']],expected,names[e['context']]),(sheet['id'],row,e)
                action=row[1].lower()
                actual.setdefault((sheet['team'],e['key']),Counter())[action]+=1
                per_person.setdefault(sheet['id'],{})[e['key']]=action
            identity=f'{paper["packId"]} / {sheet["team"]} / {sheet["id"]}'
            assert identity in text and identity in fronts[i].get_text()
            assert duplex[2*i].get_text()==fronts[i].get_text()
            assert duplex[2*i+1].get_text()==text
        for team in game['teams']:
            for key,votes in team['votesByCue'].items():
                counts=actual[(team['id'],key)]
                assert all(counts[c]==votes.get(c,0) for c in answers)
                assert sum(counts.values())==len(team['sheetIds'])
            for r in team['rounds']:
                if binary and not dual:
                    votes=Counter()
                    for person in team['sheetIds']:
                        choices=[per_person[person][c['key']] for c in r['sourceCues'].values()]
                        go=choices.count('go')
                        votes['go' if go>2 else 'avoid' if go<2 else 'abstain']+=1
                    assert all(votes[a]==r['paperVotes'][a] for a in ('go','avoid','abstain'))
                for cue in list(r['targetCues'].values())+list(r.get('sourceCues',{}).values()):
                    assert sum(actual[(team['id'],cue['key'])].values())==len(team['sheetIds'])
    reports.append(dict(packId=paper['packId'],people=paper['sheetCount'],actualPdfRows=True,duplexPairing=True,gameTallies=True))
(ROOT/'checks/production-packs.json').write_text(json.dumps(reports,indent=2)+'\n')
print(json.dumps(reports,indent=2))
