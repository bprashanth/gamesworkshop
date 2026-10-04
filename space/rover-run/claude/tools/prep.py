"""Map data for Rover Run: Jezero contours, the real Perseverance route cut into
equal-distance rows, and per-row slope and dust readings.

Inputs are the cached public datasets on the Seagate drive (read only):
  JPL Mars 2020 CTX DEM (20 m), NASA MMGIS M20 traverse, MEDA/TIRS tau.
Output: web/map.json (normalised geometry) and tools/rows.json (per-row readings).
Run: .venv/bin/python tools/prep.py
"""
import csv, hashlib, json, math
from pathlib import Path
import contourpy, numpy as np, rasterio
from scipy.ndimage import gaussian_filter, map_coordinates

HERE = Path(__file__).resolve().parent
RAW = Path('/mnt/seagate/gamesworkshop/mars-rover-video/codex/raw')
TAU = Path('/mnt/seagate/gamesworkshop/mars-rover-video/claude/raw/meda/TIRS_Aerosol_tau.csv')
ROWS, INTERVAL = 14, 35          # rows on the sheet; contour interval in metres
ASPECT = 2.0                     # map width / height, matches the screen
STEEP, FLAT = 8.0, 2.0           # slope buckets: median degrees along a row, at map scale
SLOPE_SIGMA = 10                 # DEM pixels (200 m): the scale the map's contours show


def simplify(points, tolerance):
    """Ramer-Douglas-Peucker, iterative."""
    keep = np.zeros(len(points), bool); keep[[0, -1]] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        seg = points[b] - points[a]; rel = points[a + 1:b] - points[a]
        norm = np.hypot(*seg) or 1
        dist = np.abs(seg[0] * rel[:, 1] - seg[1] * rel[:, 0]) / norm
        i = int(np.argmax(dist))
        if dist[i] > tolerance:
            keep[a + 1 + i] = True; stack += [(a, a + 1 + i), (a + 1 + i, b)]
    return points[keep]


features = json.loads((RAW / 'M20_traverse.json').read_text())['features']
route, sols = [], []
for f in sorted(features, key=lambda e: e['properties']['sol']):
    for lon, lat, *_ in f['geometry']['coordinates']:
        p = (3396190 * math.radians(lon) * math.cos(math.radians(18.4663)), 3396190 * math.radians(lat))
        if not route or math.dist(p, route[-1]) > 3:
            route.append(p); sols.append(f['properties']['sol'])
route = np.array(route); sols = np.array(sols)
dist = np.r_[0, np.cumsum(np.hypot(*np.diff(route, axis=0).T))]

with rasterio.open(RAW / 'jezero_ctx_dem_20m.tif') as ds:
    inv = ~ds.transform; dem = ds.read(1)
smooth = gaussian_filter(dem, 4)
gy, gx = np.gradient(gaussian_filter(dem, SLOPE_SIGMA), 20, 20)
slope = np.degrees(np.arctan(np.hypot(gx, gy)))
def sample(q, values=smooth):
    return map_coordinates(values, [inv.e * q[:, 1] + inv.f - 0.5, inv.a * q[:, 0] + inv.c - 0.5], order=1, mode='nearest')

# Frame: route bounds plus margin, stretched to the screen aspect.
lo, hi = route.min(0), route.max(0)
center = (lo + hi) / 2
height = max(hi[1] - lo[1], (hi[0] - lo[0]) / ASPECT) * 1.18
width = height * ASPECT
x0, y1 = center[0] - width / 2, center[1] + height / 2
norm = lambda p: np.c_[(p[:, 0] - x0) / width, (y1 - p[:, 1]) / height]

gx_ = np.linspace(x0, x0 + width, 900); gy_ = np.linspace(y1, y1 - height, 450)
qx, qy = np.meshgrid(gx_, gy_)
grid = sample(np.c_[qx.ravel(), qy.ravel()]).reshape(qx.shape)
gen = contourpy.contour_generator(x=np.arange(900), y=np.arange(450), z=grid)
emin, emax = float(grid.min()), float(grid.max())
contours = []
for level in np.arange(math.ceil(emin / INTERVAL) * INTERVAL, emax, INTERVAL):
    for line in gen.lines(level):
        if len(line) < 6: continue
        line = simplify(line / [899, 449], 0.0012)
        contours.append({'e': round((level - emin) / (emax - emin), 3), 'p': [round(float(v), 4) for v in line.ravel()]})

daily = {}
with TAU.open() as fh:
    for r in csv.DictReader(fh):
        t = float(r['TAU'])
        if math.isfinite(t) and t >= 0: daily.setdefault(int(float(r['SOL'])), []).append(t)

edges = np.linspace(0, dist[-1], ROWS + 1)
rows, cuts = [], []
for i in range(ROWS):
    m = (dist >= edges[i]) & (dist <= edges[i + 1])
    deg = float(np.median(sample(route[m], slope)))
    s0, s1 = int(sols[m].min()), int(sols[m].max())
    taus = [np.median(daily[s]) for s in range(s0, s1 + 1) if s in daily]
    rows.append({'row': i + 1, 'slope_deg': round(deg, 1),
                 'slope': 'steep' if deg >= STEEP else 'flat' if deg < FLAT else 'tilted',
                 'km': [round(edges[i] / 1000, 1), round(edges[i + 1] / 1000, 1)], 'sols': [s0, s1],
                 'tau_median': round(float(np.median(taus)), 3) if taus else None,
                 'elev_m': round(float(sample(route[m]).mean()))})
    cuts.append(int(np.searchsorted(dist, edges[i])))
cuts.append(len(route) - 1)

# Route in screen coords, simplified per row so row cuts stay exact.
pts, marks = [], [0]
for i in range(ROWS):
    seg = simplify(norm(route[cuts[i]:cuts[i + 1] + 1]), 0.0006)
    pts.extend(seg[1:] if pts else seg); marks.append(len(pts) - 1)

out = {
    'aspect': ASPECT, 'interval_m': INTERVAL, 'elev': [round(emin), round(emax)],
    'km_per_unit': round(width / 1000, 3),
    'route': [round(float(v), 4) for v in np.array(pts).ravel()], 'rowStart': marks,
    'contours': contours,
    'source': {'dem': 'JPL Mars 2020 CTX DEM 20 m (USGS Astrogeology)', 'route': 'NASA MMGIS M20 traverse, sols %d-%d' % (sols[0], sols[-1])},
}
(HERE.parent / 'web/map.json').write_text(json.dumps(out, separators=(',', ':')))
(HERE / 'rows.json').write_text(json.dumps({'thresholds_deg': {'flat_below': FLAT, 'steep_from': STEEP}, 'rows': rows,
    'sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (RAW / 'M20_traverse.json', TAU)}}, indent=1))
print(len(contours), 'contours', len(pts), 'route pts', round(dist[-1] / 1000, 1), 'km')
for r in rows: print(r)
