#!/usr/bin/env python3
"""Play the existing word corpus with plurality voting, without PDF dependencies."""
import ast
from collections import Counter, defaultdict, deque
import json
from pathlib import Path
import random
import re

SOURCE = Path(__file__).resolve().parents[1] / 'generator.py'
tree = ast.parse(SOURCE.read_text())
nodes = [n for n in tree.body if (isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'CLOSED_CORPUS' for t in n.targets)) or (isinstance(n, ast.FunctionDef) and n.name in ['tokenize', 'circular_pairs', 'closed_padding', 'validate_deck', 'build_deck'])]
ns = dict(Counter=Counter, defaultdict=defaultdict, deque=deque, random=random, re=re, COLORS=[{'name': c} for c in ['RED','BLUE','AMBER','GREEN','PURPLE','PINK']])
exec(compile(ast.Module(body=nodes, type_ignores=[]), str(SOURCE), 'exec'), ns)

def walk(votes, start, max_steps=100):
    current = start
    words, steps, seen = [current], [], {current: 0}
    for _ in range(max_steps):
        row = votes[current]
        nxt = sorted(row, key=lambda w: (-row[w], w))[0]
        steps.append({'cue': current, 'votes': dict(sorted(row.items())), 'chosen': nxt})
        words.append(nxt)
        if nxt in '.!?':
            return dict(words=words, text=' '.join(words), stop='punctuation', steps=steps)
        if nxt in seen:
            return dict(words=words, text=' '.join(words), stop='cycle', cycle=words[seen[nxt]:], steps=steps)
        seen[nxt] = len(words)-1
        current = nxt
    return dict(words=words, text=' '.join(words), stop='limit', steps=steps)

def table(pairs):
    votes = defaultdict(Counter)
    for a,b in pairs:
        votes[a][b] += 1
    return votes

starts=['the','I','why','sun','boy','old','pale']
base = table(ns['circular_pairs'](ns['tokenize'](ns['CLOSED_CORPUS'])))
result={'note':'Ties are broken alphabetically. Majority here means plurality. Old colors are fixed per word and add no history context.', 'corpus': {s: walk(base,s) for s in starts}, 'decks': {}}
for count in [15,200]:
    sheets, _ = ns['build_deck'](count, seed=42)
    # Pair votes differ from one-person-one-vote when a sheet repeats the cue.
    pairvotes=table(p for sheet in sheets for p in sheet)
    expected=defaultdict(Counter)
    firstvotes=defaultdict(Counter)
    for sheet in sheets:
        matches=defaultdict(list)
        for a,b in sheet: matches[a].append(b)
        for a, options in matches.items():
            firstvotes[a][options[0]] += 1
            for b in options: expected[a][b] += 1/len(options)
    result['decks'][str(count)] = {
        'all_printed_entries_vote': {s: walk(pairvotes,s) for s in starts},
        'one_person_first_matching_entry': {s: walk(firstvotes,s) for s in starts},
        'one_person_random_match_expected_votes': {s: walk(expected,s) for s in starts},
    }
(Path(__file__).parent/'out').mkdir(exist_ok=True)
(Path(__file__).parent/'out'/'baseline.json').write_text(json.dumps(result,indent=2)+'\n')
for variant, runs in [('corpus',result['corpus'])]+[(f'{n}: {rule}',runs) for n, rules in result['decks'].items() for rule,runs in rules.items()]:
    print(variant)
    for s,r in runs.items(): print(f"  {s}: {r['text']} [{r['stop']}]")
