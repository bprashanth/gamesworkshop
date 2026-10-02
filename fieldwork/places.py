"""Offline place search and point-in-polygon lookup for the India field game.

Settlement names: GeoNames (CC BY 4.0). District geometry: geoBoundaries,
Pathways Data / LGD (ODbL 1.0), 2021 edition. State geometry: DataMeet / ECI
(CC BY 2.5 IN), source metadata says 2011. This is approximate game geography,
not a current legal boundary service. Never infer a district from its centroid.
"""
from __future__ import annotations

from functools import lru_cache
import gzip
import json
import math
from pathlib import Path
import re
import unicodedata
from urllib.parse import unquote

DATA = Path(__file__).with_name('data')
BOUNDARY_URL = 'https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/'
BOUNDARY_NOTE = 'District located using approximate 2021 boundaries; survey areas may differ.'

# Spelling variants / documented renamings only; never nearby districts.
_STATE_ALIASES = {
    'delhi': 'nct delhi', 'nct of delhi': 'nct delhi',
    'andaman and nicobar': 'andaman nicobar islands',
    'andaman and nicobar islands': 'andaman nicobar islands',
    'jammu and kashmir': 'jammu kashmir',
    'dadra and nagar haveli and daman and diu': 'dadra nagar haveli daman diu',
    'orissa': 'odisha', 'uttaranchal': 'uttarakhand',
    'dadra and nagar haveli daman and diu': 'dadra nagar haveli daman diu',
}
_DISTRICT_ALIASES = {
    'bangalore': 'bengaluru urban', 'bangalore urban': 'bengaluru urban',
    'bengaluru': 'bengaluru urban', 'bangalore rural': 'bengaluru rural',
    'mysore': 'mysuru', 'bellary': 'ballari', 'gulbarga': 'kalaburagi',
    'belgaum': 'belagavi', 'bijapur': 'vijayapura',
    'shimoga': 'shivamogga', 'tumkur': 'tumakuru', 'chikmagalur': 'chikkamagaluru',
    'chikkaballapura': 'chikkaballapur', 'chamarajanagar': 'chamarajanagara',
    'mewat': 'nuh', 'gurgaon': 'gurugram', 'allahabad': 'prayagraj',
    'faizabad': 'ayodhya', 'hoshangabad': 'narmadapuram',
    'osmanabad': 'dharashiv', 'khargone west nimar': 'khargone',
    'khandwa east nimar': 'khandwa', 'sri potti sriramulu nellore': 'nellore',
    'spsr nellore': 'nellore', 'y s r': 'ysr', 'y s r kadapa': 'ysr',
    'ysr kadapa': 'ysr', 'cuddapah': 'ysr', 'kadapa': 'ysr',
    'the nilgiris': 'nilgiris', 'ahmadabad': 'ahmedabad',
    'ahmadnagar': 'ahmednagar', 'hugli': 'hooghly', 'haora': 'howrah',
    'puruliya': 'purulia', 'darjiling': 'darjeeling', 'kozhikode': 'kozhikode',
    'kasaragod': 'kasargod', 'kanniyakumari': 'kanyakumari',
    'east singhbhum': 'purbi singhbhum', 'west singhbhum': 'pashchimi singhbhum',
    'east champaran': 'purbi champaran', 'west champaran': 'pashchim champaran',
    'leh ladakh': 'leh', 'lahul and spiti': 'lahul spiti',
    'lahaul and spiti': 'lahul spiti',
    # Unambiguous spelling differences in the two source editions.
    'chengalpattu': 'chengalputtu', 'tirupattur': 'tirupathur',
    'gaurela pendra marwahi': 'gaurella pendra marwahi', 'siaha': 'saiha', 'batod': 'botad', 'sri potti sriramulu nello': 'nellore',
    'kadapa ysr': 'ysr', 'sipahijula': 'sepahijala', 'unokoti': 'unakoti',
    'east jantia hills': 'east jaintia hills', 'bemetra': 'bemetara',
    'gariyaband': 'gariaband', 'dakshin bastar dantewada': 'dantewada',
    'kodagaon': 'kondagaon', 'south twenty four pargana': 'south twenty four parganas',
    'north twenty four pargana': 'north twenty four parganas', 'samli': 'shamli',
    'jangoan': 'jangaon', 'bhadradri': 'bhadradri kothagudem',
    'hydrabad': 'hyderabad', 'rangareddy': 'ranga reddy',
    'komaram bheem': 'komaram bheem asifabad', 'jagitial': 'jagtial',
    'jayashankar': 'jayashankar bhupalapally', 'warangal r': 'warangal rural',
    'warangal u': 'warangal urban', 'yadadri bhongiri': 'yadadri bhuvanagiri',
    'medchal': 'medchal malkajgiri', 'jogulamba': 'jogulamba gadwal',
    'karbi anglong west': 'west karbi anglong',
    'south salmara mankachar': 'south salmara mancachar', 'agar': 'agar malwa',
}


def normalize(value: str) -> str:
    value = ''.join(c for c in unicodedata.normalize('NFKD', value)
                    if not unicodedata.combining(c))
    return ' '.join(re.sub(r'[^\w\s]', ' ', value.casefold()).split())


def state_key(value: str) -> str:
    key = normalize(value)
    return _STATE_ALIASES.get(key, key)


def district_key(value: str, state: str = '') -> str:
    key = normalize(value)
    key = re.sub(r'\b(district|zilla|zila)\b', '', key).strip()
    # Bijapur is also an unrelated district in Chhattisgarh.
    if key == 'bijapur' and state_key(state) != 'karnataka':
        return key
    return _DISTRICT_ALIASES.get(key, key)


@lru_cache(maxsize=1)
def load_districts() -> list[dict]:
    with (DATA / 'districts.json').open() as stream:
        return json.load(stream)['districts']


@lru_cache(maxsize=1)
def _geography() -> dict:
    with (DATA / 'geography.json').open() as stream:
        return json.load(stream)


@lru_cache(maxsize=1)
def _gazetteer() -> tuple[dict, dict[str, list[int]]]:
    with gzip.open(DATA / 'gazetteer.json.gz', 'rt') as stream:
        data = json.load(stream)
    index: dict[str, list[int]] = {}
    for i, row in enumerate(data['places']):
        for name in row[6]:
            index.setdefault(name, []).append(i)
    return data, index


def parse_coordinates(query: str) -> tuple[float, float] | None:
    """Accept lat,lon and coordinate-bearing Google/OSM map links, no network."""
    query = unquote(query.strip())
    number = r'([+-]?(?:\d+(?:\.\d*)?|\.\d+))'
    patterns = [rf'^\s*{number}\s*[,; ]\s*{number}\s*$',
                rf'!3d{number}!4d{number}',
                rf'[?&](?:q|query|ll)={number},{number}',
                rf'#map=\d+(?:\.\d+)?/{number}/{number}', rf'@{number},{number}']
    for pattern in patterns:
        match = re.search(pattern, query)
        if match:
            lat, lon = map(float, match.groups())
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError('Coordinates must be latitude -90..90, longitude -180..180.')
            return lat, lon
    return None


def _on_segment(x, y, a, b) -> bool:
    cross = (x-a[0])*(b[1]-a[1]) - (y-a[1])*(b[0]-a[0])
    return (abs(cross) < 1e-12 and min(a[0],b[0])-1e-10 <= x <= max(a[0],b[0])+1e-10
            and min(a[1],b[1])-1e-10 <= y <= max(a[1],b[1])+1e-10)


def _ring_contains(ring, lon, lat) -> bool:
    inside = False
    previous = ring[-1]
    for point in ring:
        if _on_segment(lon, lat, previous, point):
            return True
        if ((point[1] > lat) != (previous[1] > lat)
                and lon < (previous[0]-point[0])*(lat-point[1])/(previous[1]-point[1])+point[0]):
            inside = not inside
        previous = point
    return inside


def contains(feature: dict, lat: float, lon: float) -> bool:
    """Actual polygon containment including islands and holes; bbox is only a filter."""
    west, south, east, north = feature['bbox']
    if not (west <= lon <= east and south <= lat <= north):
        return False
    polygons = feature['coordinates']
    if feature['type'] == 'Polygon':
        polygons = [polygons]
    return any(_ring_contains(polygon[0], lon, lat)
               and not any(_ring_contains(hole, lon, lat) for hole in polygon[1:])
               for polygon in polygons)


def reverse(lat: float, lon: float, *, online: bool = False) -> dict | None:
    """Locate a point offline. None means outside *available* India polygons.

    Shared boundary / overlapping polygons keep their candidates explicit rather
    than arbitrarily picking the first district. ``online`` is accepted for API
    compatibility; no network calls are made.
    """
    lat, lon = float(lat), float(lon)
    if not (math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError('Invalid latitude or longitude.')
    geo = _geography()
    states = [f['name'] for f in geo['states'] if contains(f, lat, lon)]
    districts = [f['name'] for f in geo['districts']
                 if f['name'] != 'DATA NOT AVAILABLE' and contains(f, lat, lon)]
    if not states and not districts:
        return None
    state = states[0] if len(states) == 1 else ''
    district = districts[0] if len(districts) == 1 else ''
    # This small Puducherry enclave is surrounded by Andhra Pradesh. Separate
    # simplifications of ADM1/ADM2 disagree at its edges. When ADM2 actually
    # contains the point in Yanam, its official territory is unambiguous.
    state_note = ''
    if district == 'Yanam' and state != 'Puducherry':
        state = 'Puducherry'
        state_note = (' Yanam is a Puducherry enclave; territory checked against '
                      'https://yanam.gov.in/about-district/.')
    return {'name': f'{lat:.5f}, {lon:.5f}', 'lat': lat, 'lon': lon,
            'state': state, 'district': district, 'country_code': 'in',
            'source_url': BOUNDARY_URL, 'method': 'polygon',
            'note': BOUNDARY_NOTE + state_note + (' Boundary ambiguity: choose a district explicitly.'
                                     if len(states) > 1 or len(districts) > 1 else ''),
            'district_candidates': districts, 'state_candidates': states}


def match_district(place: dict, districts: list[dict] | None = None) -> dict | None:
    """Only an unambiguous same-state name/renaming match can attach survey data."""
    if districts is None:
        districts = load_districts()
    state = place.get('state', '')
    district = place.get('district', '')
    if not district or not state:
        return None
    key = district_key(district, state)
    matches = [row for row in districts
               if state_key(row['state']) == state_key(state)
               and district_key(row['name'], row['state']) == key]
    return matches[0] if len(matches) == 1 else None


@lru_cache(maxsize=1)
def _parent_contexts() -> list[dict]:
    with (DATA / 'parent_contexts.json').open() as stream:
        return json.load(stream)['relationships']


def parent_district_context(place: dict, districts: list[dict] | None = None) -> dict | None:
    """Return a sourced single-parent context, never a newer-district estimate.

    This is intentionally separate from ``match_district``. Callers must display
    ``note`` and retain the original point/district plus source in their record.
    Multiple parents, unresolved boundaries, and unsourced relationships return
    None. The crosswalk supplements approximate 2021 geometry; it does not claim
    to reconstruct the exact 2017 NFHS survey polygons.
    """
    if districts is None:
        districts = load_districts()
    if match_district(place, districts) is not None:
        return None
    state, district = place.get('state', ''), place.get('district', '')
    if not state or not district:
        return None
    relationships = [row for row in _parent_contexts()
                     if state_key(row['state']) == state_key(state)
                     and district_key(row['district'], state) == district_key(district, state)]
    if len(relationships) != 1:
        return None
    relationship = relationships[0]
    parents = [row for row in districts if row['id'] == relationship['parent_id']
               and state_key(row['state']) == state_key(state)]
    if len(parents) != 1:
        return None
    parent = parents[0]
    return {'district': parent, 'source_url': relationship['source_url'],
            'relationship': 'historical parent context', 'year': relationship['year'],
            'note': (f"{district} separated from {parent['name']} in {relationship['year']}. "
                     f"Using parent district context, not an estimate for {district}.")}


def search_districts(query: str, districts: list[dict] | None = None) -> list[dict]:
    """Exact district names first; optional comma-separated state disambiguates."""
    if districts is None:
        districts = load_districts()
    parts = [p.strip() for p in query.split(',') if p.strip()]
    if not parts:
        return []
    state = parts[1] if len(parts) > 1 else ''
    matches = [row for row in districts
               if (not state or state_key(row['state']) == state_key(state))
               and district_key(row['name'], row['state']) == district_key(parts[0], row['state'])]
    return sorted(matches, key=lambda r: (r['state'], r['name']))


def _district_place(row: dict) -> dict:
    return {'name': f"{row['name']} district, {row['state']}", 'lat': None, 'lon': None,
            'state': row['state'], 'district': row['name'], 'country_code': 'in',
            'source_url': 'https://rchiips.org/nfhs/districtfactsheet_NFHS-5.shtml',
            'method': 'district_name', 'district_id': row['id'],
            'note': 'Selected the survey district, not a particular village or point.'}


def geocode(query: str, *, online: bool = False, limit: int = 12,
            districts: list[dict] | None = None) -> list[dict]:
    """Find India districts/settlements or coordinates without a network.

    Returns alternatives: callers must let the player choose when more than one
    is returned. A district-name query denotes the district, with no invented
    coordinates. ``name, state`` and ``name, district, state`` narrow settlements.
    Unknown names return []; ask for coordinates or explicit district selection.
    """
    coordinates = parse_coordinates(query)
    if coordinates:
        point = reverse(*coordinates)
        return [point] if point else []
    if not query.strip():
        return []
    direct = search_districts(query, districts)
    # Explicit 'district' requests and unique district names avoid loading the
    # half-million-place gazetteer. Bare names mean survey districts in this UI.
    if direct:
        return [_district_place(row) for row in direct[:limit]]
    data, index = _gazetteer()
    parts = [normalize(p) for p in query.split(',') if p.strip()]
    if not parts:
        return []
    candidates = [data['places'][i] for i in index.get(parts[0], [])]
    filters = parts[1:]
    if filters:
        candidates = [r for r in candidates if all(
            state_key(f) == state_key(data['states'].get(r[4], ''))
            or district_key(f, data['states'].get(r[4], '')) == district_key(r[5], data['states'].get(r[4], ''))
            for f in filters)]
    candidates.sort(key=lambda r: (normalize(r[1]) != parts[0], -r[7], r[1], r[0]))
    result = []
    for row in candidates[:limit]:
        gid, name, lat, lon, code, district, _, population = row
        # Match the point to the bundled boundary edition, not a centroid.
        point = reverse(lat, lon)
        if point is None:
            # GeoNames still gives an India settlement; retain its explicit
            # administrative labels but explain the boundary coverage gap.
            point = {'lat': lat, 'lon': lon, 'state': data['states'].get(code, ''),
                     'district': district, 'country_code': 'in',
                     'note': 'GeoNames administrative labels; point not covered by bundled boundaries.'}
        point.update({'name': name, 'source_url': f'https://www.geonames.org/{gid}/',
                      'method': 'gazetteer', 'geonames_id': gid, 'population': population,
                      'matches_total': len(candidates)})
        result.append(point)
    return result
