"""Authored teaching world. Maps and printed observations use this one kernel.

These are simulated environmental readings, not NASA hazard frequencies.
The frozen Jezero game's glyphs/rules inspire the kernel; its fixed deck stays intact.
"""
from collections import Counter, defaultdict
from itertools import product
import random

CATEGORIES = ('battery', 'slope', 'dust', 'ground')
VALUES = {'battery': ('full', 'dead'), 'slope': ('flat', 'tilted', 'steep'),
          'dust': ('clear', 'haze', 'storm'), 'ground': ('firm', 'soft', 'sand')}
SLOPE = {'flat': 5/14, 'tilted': 6/14, 'steep': 3/14}
# Authored attention policy: base weight 1 per category, plus 3 times its
# historical hazard rate after the cue. Selected evidence is independent of
# allocation, so next-value frequencies are not biased toward scary cases.
PARAMETERS = {'slope': SLOPE, 'sand_given_soft_and_not_steep': .65,
              'storm_given_haze_and_not_flat': .75,
              'otherwise_ground': {'firm': .5, 'soft': .5},
              'otherwise_dust': {'clear': .5, 'haze': .5},
              'battery': 'dead iff previous square is sand or storm',
              'attention_allocation': 'weight(category | cue) = 1 + 3 * historical danger rate; normalize'}


def hazard(row):
    return row['ground'] == 'sand' or row['dust'] == 'storm'


def kernel(prev):
    """Exact P(next complete row | previous complete row), summing to 1."""
    for slope, ps in SLOPE.items():
        sand = .65 if prev['ground'] == 'soft' and slope != 'steep' else 0
        storm = .75 if prev['dust'] == 'haze' and slope != 'flat' else 0
        ground = {'sand': sand, 'firm': (1-sand)/2, 'soft': (1-sand)/2}
        dust = {'storm': storm, 'clear': (1-storm)/2, 'haze': (1-storm)/2}
        for g, d in product(ground, dust):
            p = ps * ground[g] * dust[d]
            if p:
                yield {'slope': slope, 'ground': g, 'dust': d,
                       'battery': 'dead' if hazard(prev) else 'full'}, p


def sample_next(prev, rng):
    rows, weights = zip(*kernel(prev))
    return dict(rng.choices(rows, weights=weights, k=1)[0])


def make_archive(seed=80421, size=30000):
    rng = random.Random(seed)
    current = {'battery': 'full', 'slope': 'flat', 'dust': 'clear', 'ground': 'firm'}
    records = []
    for i in range(size + 500):
        nxt = sample_next(current, rng)
        if i >= 500:
            records.append({'id': f'H{i-499:05d}', 'current': current, 'next': nxt})
        current = nxt
    return records


def buckets(archive):
    result = defaultdict(list)
    for record in archive:
        for cat in CATEGORIES:
            result[(cat, record['current'][cat])].append(record)
    return result


def attention_weights(history):
    rates = {'battery': sum(h['next']['battery'] == 'dead' for h in history)/len(history),
             'dust': sum(h['next']['dust'] == 'storm' for h in history)/len(history),
             'ground': sum(h['next']['ground'] == 'sand' for h in history)/len(history),
             'slope': 0}
    raw = {c: 1 + 3*rates[c] for c in CATEGORIES}
    return {c: raw[c]/sum(raw.values()) for c in CATEGORIES}


def allocate(n, rng, weights):
    """Largest remainder allocation; randomized tie breaks, at most 1 seat error."""
    counts = {c: int(n * weights[c]) for c in CATEGORIES}
    tie = {c: rng.random() for c in CATEGORIES}
    ranked = sorted(CATEGORIES, key=lambda c: (n*weights[c]-counts[c], tie[c]), reverse=True)
    for c in ranked[:n-sum(counts.values())]:
        counts[c] += 1
    result = [c for c in CATEGORIES for _ in range(counts[c])]
    rng.shuffle(result)
    return result


def build_pack(total=15, seed=42):
    if not 12 <= total <= 200:
        raise ValueError('Use 12–200 audience sheets total, split across four groups.')
    archive = make_archive()
    by_cue = buckets(archive)
    cues = [(cat, val) for cat in CATEGORIES for val in VALUES[cat]]
    # Map seed streams are separate: changing sheet count never changes the maps.
    maps, sheets = [], []
    for group_i, team in enumerate('ABCD'):
        n = total//4 + int(group_i < total%4)
        rng = random.Random(seed + 1000 * (group_i+1))
        members = [{'team': team, 'member': j+1, 'records': []} for j in range(n)]
        for cat, val in cues:
            allocation = allocate(n, rng, attention_weights(by_cue[(cat, val)]))
            for j, choice in enumerate(allocation):
                record = rng.choice(by_cue[(cat, val)])
                members[j]['records'].append({'cue_category': cat, 'cue_value': val,
                    'vote': choice, 'value': record['next'][choice], 'archive_id': record['id'],
                    'current': record['current'], 'next': record['next']})
        sheets.extend(members)
        map_rng = random.Random(seed + 100000 * (group_i+1))
        # Opening haze is a declared condition, common to the paper lookup and map draw.
        start = dict(map_rng.choice(by_cue[('dust', 'haze')])['current'])
        route = [start]
        for step in range(14):
            route.append(sample_next(route[-1], map_rng))
        maps.append({'team': team, 'seed': seed + 100000*(group_i+1),
                     'start': route[0], 'squares': route[1:]})
    return sheets, maps, archive


def audit(sheets, maps, archive):
    by_cue = buckets(archive)
    groups = {}
    for team in 'ABCD':
        people = [s for s in sheets if s['team'] == team]
        assert people
        group = {'people': len(people), 'cues': {}}
        for cue, history in sorted(by_cue.items()):
            records = [r for s in people for r in s['records'] if (r['cue_category'], r['cue_value']) == cue]
            assert len(records) == len(people)  # one vote/person; no duplicate weighting
            counts = Counter(r['vote'] for r in records)
            expected = Counter()
            # Conditional kernel average over historical current states, not future maps.
            source_counts = Counter(tuple(h['current'][c] for c in CATEGORIES) for h in history)
            for key, n in source_counts.items():
                for nxt, p in kernel(dict(zip(CATEGORIES, key))):
                    for cat in CATEGORIES:
                        expected[f'{cat}:{nxt[cat]}'] += n/len(history)*p
            actual = Counter(f'{r["vote"]}:{r["value"]}' for r in records)
            group['cues'][':'.join(cue)] = {
                'votes': {c: counts[c] for c in CATEGORIES},
                'percent': {c: round(100*counts[c]/len(people), 2) for c in CATEGORIES},
                'printed_outcomes': dict(actual),
                'historical_cases': len(history),
                'target_vote_shares': attention_weights(history),
                'conditional_next_value_probabilities': dict(sorted(expected.items()))}
        groups[team] = group
    for sheet in sheets:
        assert len(sheet['records']) == 11
        for r in sheet['records']:
            assert r['current'][r['cue_category']] == r['cue_value']
            assert r['next'][r['vote']] == r['value']
            assert any(nxt == r['next'] for nxt, p in kernel(r['current']))
    for route in maps:
        prev = route['start']
        for row in route['squares']:
            assert row['battery'] == ('dead' if hazard(prev) else 'full')
            assert row['ground'] != 'sand' or (prev['ground'] == 'soft' and row['slope'] != 'steep')
            assert row['dust'] != 'storm' or (prev['dust'] == 'haze' and row['slope'] != 'flat')
            prev = row
    assert len({str(m['squares']) for m in maps}) == 4
    assert len({tuple((r['vote'], r['value']) for r in s['records']) for s in sheets}) == len(sheets)
    return {'model': PARAMETERS, 'archive_seed': 80421, 'archive_size': len(archive),
            'groups': groups, 'note': 'Vote allocation is not hazard probability. Finite samples vary.'}


def sudden_death(row, action, battery='full'):
    """Decision outcome for the extension, separate from the frozen game engine."""
    if action == 'recharge':
        return 'recharged'
    if action not in ('go', 'avoid'):
        raise ValueError(action)
    if battery == 'dead':
        return 'dead-battery'
    if action == 'go' and hazard(row):
        return 'dead-hazard'
    if action == 'avoid' and not hazard(row):
        return 'dead-false-alarm'
    return 'crossed'
