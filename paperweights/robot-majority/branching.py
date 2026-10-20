"""RM3: neutral majority routes inside an open, punctuated word graph.
An authored transition corpus, not a naturally occurring literary dataset.
"""
from collections import Counter
from pathlib import Path
import importlib.util
import random
import json

spec = importlib.util.spec_from_file_location('original_experiment', Path(__file__).with_name('experiment.py'))
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
deal = original.deal
ROUTES = [
    'one night the old man found his robot checking every boat by the harbour .'.split(),
    'each morning a young nurse watched her robot sorting every file inside our clinic .'.split(),
    'that evening a quiet farmer saw his robot counting each seed beside his barn .'.split(),
]

def model():
    used = {}; routes = []; phases = {}
    for words in ROUTES:
        route = []
        for i, word in enumerate(words):
            if word == '.':
                cue = 'AMBER:.'
            else:
                colors = original.COLORS[i % 6:] + original.COLORS[:i % 6]
                color = next(c for c in colors if c not in used.get(word, set()))
                used.setdefault(word, set()).add(color)
                cue = f'{color}:{word}'
            route.append(cue); phases[cue] = i
        routes.append(route)
    rng = random.Random(42); edges = {}
    punctuation = ['AMBER:.', 'BLUE:,', 'GREEN:?', 'PINK:!']
    vocabulary = sorted(set(phases) | set(punctuation))
    for route in routes:
        for i, cue in enumerate(route[:-1]):
            main = route[i + 1]
            # Minority observations can jump backwards, cross narratives and
            # include punctuation. There is no hidden grammar or stop rule.
            candidates = [c for c in vocabulary if c not in (cue, main) and c not in punctuation]
            rng.shuffle(candidates)
            noise = candidates[:3] + [punctuation[i % len(punctuation)]]
            noise = list(dict.fromkeys(c for c in noise if c != main))
            weights = Counter({main: 52})
            weights.update(original.apportion(dict.fromkeys(noise, 1), 48))
            edges[cue] = weights
    for cue in punctuation:
        edges[cue] = Counter({routes[0][0]: 40, routes[1][0]: 30, routes[2][0]: 30})
    assert all(dest in edges for weights in edges.values() for dest in weights)
    return edges, routes, phases

def pack(size, seed=42):
    edges, routes, _ = model()
    return dict(size=size, seed=seed, sheets=deal(edges, size, seed),
                start=routes[0][0], starts=[r[0] for r in routes],
                source='Authored open robot transition corpus - RM3')

def walk(sheets, start, seed, steps=40):
    rng = random.Random(seed); cue = start; words = [cue]
    for _ in range(steps):
        answers = [b for sheet in sheets for a,b in sheet if a == cue]
        assert answers
        cue = rng.choice(answers); words.append(cue)
    return words

def evaluate():
    edges, routes, _ = model(); report = {}
    for size in (15, 100, 200):
        for seed in range(100):
            sheets = deal(edges, size, seed)
            for route, expected in zip(routes, ROUTES):
                result = original.play(sheets, route[0])
                assert result['sentence'] == ' '.join(expected).replace(' .', '.')
                assert all(not t['tie'] for t in result['trace'])
        sheets = pack(size)['sheets']
        runs = [walk(sheets, r[0], seed) for r in routes for seed in range(100)]
        distinct = len({tuple(run) for run in runs})
        assert distinct > 290
        seen = {cue.split(':')[1] for run in runs for cue in run}
        assert set('.,!?') <= seen
        for cue in edges:
            walk(sheets, cue, 42, 100)
        assert not any(all((a,b) in sheet for a,b in zip(route,route[1:]))
                       for sheet in sheets for route in routes)
        report[size] = dict(majority=[original.play(sheets,r[0])['sentence'] for r in routes],
            distinctRandomChains=distinct, randomRuns=300, steps=40,
            punctuationObserved=sorted(set('.,!?') & seen),
            cues=len(edges), startsTested=len(edges),
            examples=[' '.join(c.split(':')[1] for c in run[:20]) for run in runs[:3]])
    out = Path(__file__).with_name('out'); out.mkdir(exist_ok=True)
    (out/'branching-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))

if __name__ == '__main__': evaluate()
