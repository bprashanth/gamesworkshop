// Moon Run: Rover Run's death effects plus one new one, frost (FROZEN). POWER LOSS is the TV
// switching off; STUCK is the sand-trap spiral in grey dust.
// Death effects. Each takes a frozen display list and returns a function of time
// t (seconds) -> display list, or null when the effect is over.

import { SAND, INK } from './screen.js';

const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => v * v * (3 - 2 * v);
const rand = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// Storm: a dune front sweeps in from the top right; everything it touches
// loosens into sand and streams away down-left.
export function storm(list, w, h) {
  const r = rand(11), D = 2.2;
  const parts = list.map(d => ({ ...d, start: 0.15 + 1.5 * clamp(((w - d.x) / w + d.y / h) / 2) + r() * 0.25, vx: -(60 + r() * 160), vy: 30 + r() * 90, w: r() * 6 }));
  const grains = Array.from({ length: 900 }, () => ({ x0: w * (0.4 + r() * 0.8), y0: -h * r() * 0.6, v: 180 + r() * 260, a: 0.3 + r() * 0.7, k: r() }));
  return t => {
    if (t > D + 0.9) return null;
    const out = [];
    for (const p of parts) {
      const u = t - p.start;
      if (u <= 0) { out.push(p); continue; }
      const f = clamp(1 - u / 1.0);
      if (f <= 0) continue;
      out.push({ x: p.x + p.vx * u + Math.sin(u * 7 + p.w) * 6, y: p.y + p.vy * u * u, c: u > 0.15 ? SAND : p.c, a: (p.a ?? 1) * f, s: p.t ? undefined : 1 + u, t: p.t && u < 0.2 ? p.t : undefined });
    }
    const front = clamp(t / D);
    for (const g of grains) {
      if (g.k > front * 1.2) continue;
      const u = t - g.k * D * 0.8;
      out.push({ x: g.x0 - g.v * u, y: g.y0 + g.v * 0.55 * u, c: SAND, a: g.a * clamp(1.6 - t / (D + 0.4)), s: 0.8 });
    }
    return out;
  };
}

// Battery: an old television switching off. Collapse to a line, then a point.
export function battery(list, w, h) {
  const cx = w / 2, cy = h / 2;
  return t => {
    if (t > 1.9) return null;
    const out = [];
    if (t < 0.32) {
      const s = 1 - ease(t / 0.32) * 0.995;
      for (const d of list) out.push({ ...d, y: cy + (d.y - cy) * s, c: t > 0.2 ? INK : d.c, a: (d.a ?? 1) * (1 + t * 2) });
    } else if (t < 0.7) {
      const s = 1 - ease((t - 0.32) / 0.38);
      for (let x = -w / 2; x <= w / 2; x += 3) out.push({ x: cx + x * s, y: cy, c: INK, s: 1.2 });
    } else {
      const a = clamp(1 - (t - 0.7) / 1.1);
      out.push({ x: cx, y: cy, c: INK, a, s: 3 * a + 0.5 });
    }
    return out;
  };
}

// Sand trap: the ground gives way. Everything spirals into the rover.
export function sand(list, w, h, cx, cy) {
  const D = 2.1, R = Math.hypot(w, h);
  const parts = list.map(d => {
    const dx = d.x - cx, dy = d.y - cy;
    return { ...d, r0: Math.hypot(dx, dy), th: Math.atan2(dy, dx) };
  });
  return t => {
    if (t > D + 0.5) return null;
    const out = [];
    for (const p of parts) {
      const delay = (1 - p.r0 / R) * 0.5;            // the edge of the hole goes first
      const u = clamp((t - delay) / D);
      const r = p.r0 * (1 - ease(u)) ** 1.4;
      const th = p.th + 5 * ease(u) * (1 + 40 / (r + 20));
      if (r < 2) continue;
      out.push({ x: cx + Math.cos(th) * r, y: cy + Math.sin(th) * r, c: u > 0.4 ? SAND : p.c, a: (p.a ?? 1) * clamp(r / 30), s: p.t ? undefined : 1, t: u < 0.08 ? p.t : undefined });
    }
    const ring = Math.min(1, t / D) * 26 + 2;
    for (let k = 0; k < 64; k++) {
      const a = k / 64 * Math.PI * 2 + t * 2;
      out.push({ x: cx + Math.cos(a) * ring, y: cy + Math.sin(a) * ring * 0.9, c: INK, a: clamp(1 - t / (D + 0.5)) * 0.8, s: 0.8 });
    }
    return out;
  };
}

// Dots fade in in a scanline order, for the rebuild before a replay.
export function boot(list, h) {
  return t => {
    if (t > 1.0) return null;
    return list.filter(d => d.y < h * t * 1.4).map(d => ({ ...d, a: (d.a ?? 1) * clamp((h * t * 1.4 - d.y) / 60) }));
  };
}

// Frost: everything stops; ice grows in from the edges as six-fold crystals, then the picture
// whitens and fades.
export function frost(list, w, h) {
  const r = rand(5), D = 2.0;
  const seeds = Array.from({ length: 70 }, () => { const e = r() * 4 | 0, u = r();
    return { x: e === 0 ? 0 : e === 1 ? w : u * w, y: e === 2 ? 0 : e === 3 ? h : e < 2 ? u * h : (e === 2 ? 0 : h), d: r() * 0.6, len: 40 + r() * 140, rot: r() * Math.PI }; });
  return t => {
    if (t > D + 0.6) return null;
    const out = [], white = clamp((t - D * 0.55) / (D * 0.45)), fade = clamp(1 - (t - D) / 0.6);
    for (const d of list) {
      const edge = Math.min(d.x, w - d.x, d.y, h - d.y) / Math.min(w, h);
      const f = clamp(t / D * 2.2 - edge * 3);
      out.push({ ...d, c: f > 0.5 ? '#dfe8f0' : d.c, a: (d.a ?? 1) * fade * (1 - white * 0.6) });
    }
    for (const sd of seeds) {
      const u = clamp((t - sd.d) / (D * 0.7)), L = sd.len * ease(u);
      for (let k = 0; k < 6; k++) {
        const a = sd.rot + k * Math.PI / 3;
        for (let s = 0; s < L; s += 4) {
          out.push({ x: sd.x + Math.cos(a) * s, y: sd.y + Math.sin(a) * s, c: '#e8f0f6', a: 0.8 * fade, s: 0.9 });
          if (s > 12 && s % 16 === 0) for (const b of [-1, 1]) for (let q = 4; q < Math.min(14, L - s); q += 4)
            out.push({ x: sd.x + Math.cos(a) * s + Math.cos(a + b * 0.8) * q, y: sd.y + Math.sin(a) * s + Math.sin(a + b * 0.8) * q, c: '#e8f0f6', a: 0.6 * fade, s: 0.8 });
        }
      }
    }
    return out;
  };
}
