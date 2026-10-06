"""Map data for Moon Run: south-pole contours, an authored 27 km route cut into 14 strips, and the
real light and slope along each strip. Same output shape as Rover Run's tools/prep.py.

Inputs (read only, on the Seagate drive; sha256 next to each file):
  LDEM_80S_80MPP_ADJ.TIF        LOLA south-pole DEM, 80 m/px (NASA GSFC PGDA product 90)
  AVGVISIB_85S_060M_201608.TIF  average solar visibility, 60 m/px (Mazarico et al., PGDA product 69)
The route's waypoints are authored (chosen by tools search below to cross sunlit rim, shadowed
ground and one dark hollow). Light and slope per square are measured; everything else is authored.

Run: .venv/bin/python tools/prep_moon.py              # -> web/map.json, data/route_real.json
"""
import hashlib, json, math
from pathlib import Path
import contourpy, numpy as np, rasterio
from rasterio.windows import from_bounds
from scipy.ndimage import gaussian_filter, map_coordinates

HERE = Path(__file__).resolve().parent
RAW = Path('/mnt/seagate/gamesworkshop/moon/claude/raw')
DEM, VIS = RAW / 'LDEM_80S_80MPP_ADJ.TIF', RAW / 'AVGVISIB_85S_060M_201608.TIF'
import os
N, ASPECT = 14, 2.0                        # squares; map width/height (matches Rover)
INTERVAL = int(os.environ.get('INTERVAL', 120))  # contour step, m (60 m was a wall of dots on Shackleton's flank)
SHIFT = float(os.environ.get('SHIFT', 5))         # move the frame towards Shackleton (km) so its rim shows at the bottom
# Route: four waypoints in the polar stereographic frame (metres from the pole), east to west.
WAYPOINTS = [(19750, -23840), (10990, -25200), (2310, -23410), (-6550, -23160)]
SUN, DARK = 5000, 1400                    # AVGVISIB (0-10000 = share of time the sun is visible): sun >= 50 %, dark < 14 %
FLAT, STEEP = 4.0, 10.0                    # slope buckets, degrees, median along the strip at 80 m

with rasterio.open(DEM) as ds:
    win = from_bounds(-45000, -45000, 45000, 45000, ds.transform)
    dem, dT, crs = ds.read(1, window=win), ds.window_transform(win), ds.crs
with rasterio.open(VIS) as ds:
    win = from_bounds(-45000, -45000, 45000, 45000, ds.transform)
    vis, vT = ds.read(1, window=win).astype(float), ds.window_transform(win)
gy, gx = np.gradient(gaussian_filter(dem, 3), 80, 80)
slope = np.degrees(np.arctan(np.hypot(gx, gy)))
smooth = gaussian_filter(dem, 1.2)


def sample(arr, T, q):
    inv = ~T
    c = np.array([inv * (x, y) for x, y in q])
    return map_coordinates(arr, [c[:, 1] - 0.5, c[:, 0] - 0.5], order=1, mode='nearest')


def simplify(points, tolerance):
    keep = np.zeros(len(points), bool); keep[[0, -1]] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        seg = points[b] - points[a]; rel = points[a + 1:b] - points[a]
        dist = np.abs(seg[0] * rel[:, 1] - seg[1] * rel[:, 0]) / (np.hypot(*seg) or 1)
        i = int(np.argmax(dist))
        if dist[i] > tolerance:
            keep[a + 1 + i] = True; stack += [(a, a + 1 + i), (a + 1 + i, b)]
    return points[keep]


# A gently wandering route through the waypoints (a straight polyline reads as a ruler on the map).
wp = np.array(WAYPOINTS, float)
seg = np.r_[0, np.cumsum(np.hypot(*np.diff(wp, axis=0).T))]
dist = np.linspace(0, seg[-1], 1400)
route = np.c_[np.interp(dist, seg, wp[:, 0]), np.interp(dist, seg, wp[:, 1])]
wiggle = 500 * np.sin(dist / 2300) + 200 * np.sin(dist / 830 + 1) + 70 * np.sin(dist / 260 + 2)   # a wandering path; changes here can move light buckets: rerun build_archive.mjs
d = np.gradient(route, axis=0); nrm = np.c_[-d[:, 1], d[:, 0]] / np.hypot(*d.T)[:, None]
route = route + nrm * wiggle[:, None]
dist = np.r_[0, np.cumsum(np.hypot(*np.diff(route, axis=0).T))]

# Frame: the route spans the full width (strips = columns). It runs east -> west, so turn
# the map 180 degrees to read left to right (rotate, never mirror), as Rover Run does.
lo, hi = route.min(0), route.max(0); center = (lo + hi) / 2
width = (hi[0] - lo[0]) * 1.02; height = width / ASPECT
x0, y1 = center[0] - width / 2, center[1] + height / 2 + SHIFT * 1000
norm = lambda p: 1 - np.c_[(p[:, 0] - x0) / width, (y1 - p[:, 1]) / height]

GW, GH = 900, 450
qx, qy = np.meshgrid(np.linspace(x0, x0 + width, GW), np.linspace(y1, y1 - height, GH))
q = np.c_[qx.ravel(), qy.ravel()]
grid = sample(smooth, dT, q).reshape(GH, GW)
light = sample(vis, vT, q).reshape(GH, GW)
gen = contourpy.contour_generator(x=np.arange(GW), y=np.arange(GH), z=grid)
emin, emax = float(grid.min()), float(grid.max())
contours = []
for level in np.arange(math.ceil(emin / INTERVAL) * INTERVAL, emax, INTERVAL):
    for line in gen.lines(level):
        if len(line) < 6: continue
        line = 1 - simplify(line / [GW - 1, GH - 1], 0.0012)
        contours.append({'e': round((level - emin) / (emax - emin), 3), 'p': [round(float(v), 4) for v in line.ravel()]})

# Shadow layer for the map: the share of time in sunlight on a coarse grid (0 dark .. 9 sunlit),
# rotated like everything else. The page may draw it as a faint stipple (prototype B).
SW, SH = 192, 96
small = sample(vis, vT, np.c_[*(m.ravel() for m in np.meshgrid(np.linspace(x0, x0 + width, SW), np.linspace(y1, y1 - height, SH)))]).reshape(SH, SW)
shade = np.clip(small / 1000, 0, 9).astype(int)[::-1, ::-1]

sx = norm(route)[:, 0]
bounds = np.linspace(sx.min(), sx.max(), N + 1)
env = np.maximum.accumulate(sx)
square = np.clip(np.searchsorted(bounds, env, side='right') - 1, 0, N - 1)
rows, cuts = [], []
for i in range(N):
    m = square == i
    v = float(np.median(sample(vis, vT, route[m]))); s = float(np.median(sample(slope, dT, route[m])))
    rows.append({'square': i + 1, 'vis': round(v), 'sun_pct': round(v / 100), 'slope_deg': round(s, 1),
                 'light': 'sun' if v >= SUN else 'dark' if v < DARK else 'shade',
                 'slope': 'steep' if s >= STEEP else 'flat' if s < FLAT else 'slope',
                 'elev_m': round(float(sample(dem, dT, route[m]).mean())),
                 'km': [round(dist[m].min() / 1000, 1), round(dist[m].max() / 1000, 1)]})
    cuts.append(int(np.argmax(m)))
cuts.append(len(route) - 1)
pts, marks = [], [0]
for i in range(N):
    sgm = simplify(norm(route[cuts[i]:cuts[i + 1] + 1]), 0.0006)
    pts.extend(sgm[1:] if pts else sgm); marks.append(len(pts) - 1)


def latlon(x, y):
    """Polar stereographic (sphere, true scale at the pole) -> lat, lon."""
    r = math.hypot(x, y); c = 2 * math.atan(r / (2 * 1737400))
    return round(-90 + math.degrees(c), 3), round(math.degrees(math.atan2(x, y)) % 360, 1)


out = {
    'aspect': ASPECT, 'interval_m': INTERVAL, 'elev': [round(emin), round(emax)], 'km_per_unit': round(width / 1000, 3),
    'route': [round(float(v), 4) for v in np.array(pts).ravel()], 'rowStart': marks,
    'strips': [round(float(b), 4) for b in bounds], 'southUp': False, 'contours': contours,
    'shade': {'w': SW, 'h': SH, 'v': ''.join(str(v) for v in shade.ravel())},
    'source': {'dem': 'LOLA LDEM_80S_80MPP_ADJ (NASA GSFC PGDA)', 'light': 'LOLA average solar visibility AVGVISIB_85S_060M (Mazarico et al.)',
               'route': 'authored traverse, %.1f km, %s to %s' % (dist[-1] / 1000, latlon(*route[0]), latlon(*route[-1]))},
}
(HERE.parent / 'web' / os.environ.get('MAPOUT', 'map.json')).write_text(json.dumps(out, separators=(',', ':')))
(HERE.parent / 'web' / 'data' / 'route_real.json').write_text(json.dumps({
    'note': 'Measured along the authored route: light (share of time in sunlight) and slope. Buckets below.',
    'buckets': {'light': {'sun_from_pct': SUN / 100, 'dark_below_pct': DARK / 100}, 'slope_deg': {'flat_below': FLAT, 'steep_from': STEEP}},
    'waypoints_m': WAYPOINTS, 'start_latlon': latlon(*route[0]), 'end_latlon': latlon(*route[-1]), 'rows': rows,
    'sha256': {p.name: (p.with_suffix('.sha256').read_text().split()[0] if p.with_suffix('.sha256').exists() else hashlib.sha256(p.read_bytes()).hexdigest()) for p in (DEM, VIS)}}, indent=1))
print(len(contours), 'contours', len(pts), 'route pts', round(dist[-1] / 1000, 1), 'km', out['source']['route'])
print(''.join({'sun': 'S', 'shade': 'H', 'dark': 'D'}[r['light']] for r in rows), ' '.join(r['slope'][:2] for r in rows))
for r in rows: print(r)
