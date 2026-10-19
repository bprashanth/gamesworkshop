"""RM2: neutral majority routes with noisy, forward-only minority transitions.
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
    for r, route in enumerate(routes):
        for i, cue in enumerate(route[:-1]):
            main = route[i + 1]
            # Other narratives, missing words and mismatched syntax are actual
            # minority observations, not browser-only randomness.
            candidates = sorted({other[j] for other in routes
                for j in range(i + 1, min(i + 4, 15))} - {main})
            rng.shuffle(candidates); noise = candidates[:4]
            weights = Counter({main: 52 if noise else 100})
            for dest, count in original.apportion(dict.fromkeys(noise, 1), 48).items() if noise else []:
                weights[dest] += count
            edges[cue] = weights
    edges['AMBER:.'] = Counter({routes[0][0]: 100})
    for cue, weights in edges.items():
        if cue == 'AMBER:.': continue
        assert all(phases[dest] > phases[cue] for dest in weights)
    return edges, routes, phases

def pack(size, seed=42):
    edges, routes, _ = model()
    return dict(size=size, seed=seed, sheets=deal(edges, size, seed),
                start=routes[0][0], starts=[r[0] for r in routes],
                source='Authored branching robot transition corpus - RM2')

def evaluate():
    edges, routes, _ = model(); report = {}
    for size in (15, 100, 200):
        samples = []; majority = []; deviations = 0
        for seed in range(100):
            sheets = deal(edges, size, seed)
            for route, expected in zip(routes, ROUTES):
                result = original.play(sheets, route[0])
                assert result['status'] == 'complete'
                assert result['sentence'] == ' '.join(expected).replace(' .', '.')
                assert all(not t['tie'] for t in result['trace'])
            if seed == 42:
                majority = [original.play(sheets, r[0])['sentence'] for r in routes]
            for route in routes:
                result = original.play(sheets, route[0], seed, sample=True)
                assert result['status'] == 'complete'
                deviations += result['sentence'] not in [' '.join(w).replace(' .', '.') for w in ROUTES]
                samples.append(result['sentence'])
        assert len(set(samples)) > 200
        fixed_sheets = pack(size)['sheets']
        fixed_runs = [original.play(fixed_sheets, r[0], seed, sample=True)['sentence']
                      for r in routes for seed in range(100)]
        assert len(set(fixed_runs)) > 250
        # No single participant can trace a complete intended majority sentence.
        assert not any(all((a,b) in sheet for a,b in zip(route,route[1:]))
                       for sheet in fixed_sheets for route in routes)
        report[size] = dict(majority=majority,
            fixedPackDistinct=len(set(fixed_runs)), fixedPackRuns=len(fixed_runs), randomDistinct=len(set(samples)),
            randomOffMajority=deviations, randomRuns=300, examples=samples[:9],
            matchingPerCue=sorted({sum(a == cue for s in pack(size)['sheets'] for a,b in s) for cue in edges}),
            singleSheetFullRoutes=sum(original.play([s], r[0])['status'] == 'complete' for s in pack(size)['sheets'] for r in routes))
    out = Path(__file__).with_name('out'); out.mkdir(exist_ok=True)
    (out/'branching-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))

if __name__ == '__main__': evaluate()
