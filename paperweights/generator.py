#!/usr/bin/env python3
"""Generate closed, reproducible Paper Weights decks. See README.md."""
import argparse
from collections import Counter, defaultdict, deque
from html import escape
from pathlib import Path
import random
import re
from printkit import COLORS, document, write_bundle, preview

CLOSED_CORPUS = """
the old man sat in a skiff in the cold , dark sea .
the boy saw the old man in a skiff and said , why did you go out in the dark night ?
the old man said , I went out to see the flat sea and the steep wave !
I went to see a pale blue eye in the flat sea and the dark night !
the pale blue eye looked at the boy in the house and the boy went cold .
why did you say that I am mad ?
why did you say that I saw the pale blue eye ?
I saw that I am mad , and the cat in the hat sat in the cold house .
the sun did not shine , so the cat in the hat sat in the dark house .
the sun did not shine and it was too wet to go out , so the boy looked at the steep wave and said that it was too wet !
"""

def tokenize(text):
    return ['I' if w.lower() == 'i' else w.lower() for w in re.findall(r'\w+|[.,!?]', text)]

def circular_pairs(tokens):
    return list(zip(tokens, tokens[1:] + tokens[:1]))

def closed_padding(base_pairs, size, rng):
    """Whole sentence cycles first; short, observed graph cycles fill exact gaps.

    Every added edge already occurs in the specified corpus. Dynamic programming
    finds an exact sum of cycle lengths; no truncation, singletons or invented edges.
    """
    edges = set(base_pairs)
    cycles = []
    for line in CLOSED_CORPUS.strip().splitlines():
        cycle = circular_pairs(tokenize(line))
        if set(cycle) <= edges:
            cycles.append(cycle)
    graph = defaultdict(set)
    for a, b in base_pairs:
        graph[a].add(b)
    for start in sorted(graph):
        queue = deque([[start]])
        visited = {start}
        while queue:
            path = queue.popleft()
            if start in graph[path[-1]]:
                cycles.append(circular_pairs(path))
                break
            for nxt in sorted(graph[path[-1]]):
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append(path + [nxt])
    rng.shuffle(cycles)
    # Prefer fewer, longer whole cycles rather than repeatedly padding a short phrase.
    paths = {0: []}
    for n in range(1, size + 1):
        options = [paths[n-len(c)] + [c] for c in cycles if n-len(c) in paths]
        if options:
            paths[n] = min(options, key=len)
    if size not in paths:
        raise ValueError(f'Cannot fill {size} pairs with closed observed cycles')
    return [p for c in paths[size] for p in c], paths[size]

def validate_deck(sheets):
    left_counts = Counter(w1 for sheet in sheets for w1, w2 in sheet)
    right_words = {w2 for sheet in sheets for w1, w2 in sheet}
    for w in right_words:
        assert left_counts[w] >= 2, f"Dead end! '{w}' on right has {left_counts[w]} matches on left!"
    assert left_counts == Counter(w2 for sheet in sheets for w1, w2 in sheet), 'Unbalanced closed graph'
    assert all(len(s) == 24 for s in sheets)
    assert len({tuple(s) for s in sheets}) == len(sheets), 'Duplicate handouts'
    # Each token has at least two different people who can respond.
    assert all(sum(any(a == w for a, b in s) for s in sheets) >= 2 for w in right_words)


def build_deck(num_sheets=15, pairs_per_sheet=24, seed=42):
    if not 10 <= num_sheets <= 200:
        raise ValueError('Use 10–200 sheets; closure is guaranteed for this range.')
    if pairs_per_sheet != 24:
        raise ValueError('This A4 layout requires 24 pairs per sheet.')
    tokens = tokenize(CLOSED_CORPUS)
    base = circular_pairs(tokens)
    rng = random.Random(seed)
    copies, remainder = divmod(num_sheets * 24, len(base))
    padding, _ = closed_padding(base, remainder, rng)
    pool = base * copies + padding
    vocab = sorted(set(tokens))
    colors = {w: COLORS[i % len(COLORS)] for i, w in enumerate(vocab)}
    rank = {c['name']: i for i, c in enumerate(COLORS)}
    # Retry only the deal, never the corpus. Rare tokens must reach different people.
    for attempt in range(1000):
        rng.shuffle(pool)
        sheets = [sorted(pool[s*24:(s+1)*24], key=lambda p: (rank[colors[p[0]]['name']], p[0], p[1])) for s in range(num_sheets)]
        try:
            validate_deck(sheets)
            return sheets, colors
        except AssertionError:
            pass
    raise RuntimeError('Could not deal distinct sheets with multiple responding people')


def deck_report(sheets, colors, seed):
    counts = Counter(p for s in sheets for p in s)
    successors = {}
    for w in sorted(colors):
        matches = [s for s in sheets if any(a == w for a, b in s)]
        pair_counts = {b: n for (a, b), n in sorted(counts.items()) if a == w}
        # One random raised hand, then one random matching entry on that person's sheet.
        hand_probability = defaultdict(float)
        for sheet in matches:
            entries = [b for a, b in sheet if a == w]
            for b in entries:
                hand_probability[b] += 1 / len(matches) / len(entries)
        successors[w] = {'counts': pair_counts, 'responding_people': len(matches),
                         'random_hand_probability': dict(hand_probability)}
    return {'kind': 'Paper Weights', 'seed': seed, 'sheet_count': len(sheets),
            'pairs_per_sheet': 24, 'corpus_tokens': len(tokenize(CLOSED_CORPUS)),
            'vocabulary': len(colors), 'colors': colors,
            'single_successor_tokens': [w for w, v in successors.items() if len(v['counts']) == 1],
            'successors': successors, 'sheets': sheets}


MINIMAL_CSS = """
header { padding: 3mm 0; }
.instructions { margin: 4mm 0 5mm; }
.pair { height: 15.5mm; margin-bottom: 1.5mm; }
.left { height: 12mm; }
"""

def render_sheet(sheet, colors):
    columns = []
    for chunk in (sheet[:12], sheet[12:]):
        cards = []
        for a, b in chunk:
            ca, cb = colors[a], colors[b]
            cards.append(f'<div class="pair"><div class="left" style="background:{ca["fill"]}"><span class="tag">{ca["name"]}</span><span class="word">{escape(a)}</span></div><div class="arrow">-></div><div class="right"><span class="word" style="color:{cb["fill"]}">{escape(b)}</span><span class="tag">({cb["name"]})</span></div></div>')
        columns.append('<div class="column">' + ''.join(cards) + '</div>')
    return ('<section class="sheet"><header><h1>Paper Weights</h1></header>'
            '<div class="instructions"><b>1</b> Hear a word + color. Find that <b>filled box</b> on the left.<br>'
            '<b>2</b> Raise your hand. If chosen, read the <b>right word + its color</b>.<br>'
            '<b>3</b> That word + color becomes the next call.</div>'
            '<div class="columns">' + ''.join(columns) + '</div></section>')


def render_pdf(num_sheets=15, output_path=None, seed=42):
    output_path = output_path or Path(__file__).parent / f'words/paper-weights-{num_sheets}.pdf'
    sheets, colors = build_deck(num_sheets, seed=seed)
    html = document([render_sheet(s, colors) for s in sheets], 'Paper Weights', MINIMAL_CSS)
    report = deck_report(sheets, colors, seed)
    report['layout'] = 'approved minimal'
    write_bundle(html, output_path, num_sheets, report)
    preview(output_path)
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sheets', type=int, default=15)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--output', type=Path, help='Default: paperweights/words/paper-weights-N.pdf')
    args = parser.parse_args()
    render_pdf(args.sheets, args.output, args.seed)
