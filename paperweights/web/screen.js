// The dot-matrix screen. Everything visible is a dot on a sub-grid of
// SX x SY dots per character cell (braille is 2 x 4; finer reads closer to the film) or a glyph in a cell. Frames are display lists,
// so the death effects can pick up the same dots and move them as particles.

export const COLS = 100, ROWS = 26;
export const MAP = { col: 2, row: 0.5, cols: 96, rows: 25 };  // map window, in cells: the map and nothing else
export const SX = 3, SY = 6;
export const DW = MAP.cols * SX, DH = MAP.rows * SY;           // map size, in dots

export const INK = '#e6e6e1', DIM = '#8a8a86', FAINT = '#4a4a48', SAND = '#c2a374', BG = '#000';
const LOW = [86, 116, 124], HIGH = [158, 96, 76];             // contour tint, as in the film

export class Screen {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hits = [];
    this.resize();
  }

  resize() {
    const box = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.cw = box.width / COLS;
    this.ch = this.cw * 1.9;
    this.canvas.style.height = `${this.ch * ROWS}px`;
    this.canvas.width = Math.round(box.width * dpr);
    this.canvas.height = Math.round(this.ch * ROWS * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.font = `${Math.round(this.cw * 1.62)}px "JetBrains Mono", "DejaVu Sans Mono", ui-monospace, monospace`;
    this.dot = Math.max(1, this.cw * 0.17);
  }

  // Map dot (dx, dy) -> pixel centre.
  px(dx, dy) {
    return [(MAP.col + (dx + 0.5) / SX) * this.cw, (MAP.row + (dy + 0.5) / SY) * this.ch];
  }

  // Display list helpers. Items: {x, y, c, s} dots or {x, y, c, t} glyphs (x, y in px).
  text(list, col, row, t, c = INK, hit) {
    list.push({ x: col * this.cw, y: (row + 0.72) * this.ch, c, t });
    if (hit) this.hits.push({ x0: col * this.cw, x1: (col + t.length) * this.cw, y0: row * this.ch, y1: (row + 1) * this.ch, hit });
  }

  draw(list, alpha = 1) {
    const { ctx } = this;
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = this.font;
    ctx.textBaseline = 'alphabetic';
    for (const d of list) {
      ctx.globalAlpha = (d.a ?? 1) * alpha;
      ctx.fillStyle = d.c;
      if (d.t !== undefined) {
        if (d.inv) { ctx.fillRect(d.x - 1, d.y - this.ch * 0.72, d.t.length * this.cw + 2, this.ch); ctx.fillStyle = BG; }
        ctx.fillText(d.t, d.x, d.y);
      } else {
        const s = this.dot * (d.s ?? 1);
        ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  hit(px, py) {
    return this.hits.find(h => px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1)?.hit;
  }
}

// Rasterise the contour polylines into a dot grid once. Returns [{dx, dy, c}].
export function contourDots(map) {
  const seen = new Map();
  for (const { e, p } of map.contours) {
    const c = `rgb(${LOW.map((v, i) => Math.round(v + (HIGH[i] - v) * e)).join(',')})`;
    for (let i = 2; i < p.length; i += 2) {
      const x0 = p[i - 2] * (DW - 1), y0 = p[i - 1] * (DH - 1), x1 = p[i] * (DW - 1), y1 = p[i + 1] * (DH - 1);
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5) || 1;
      for (let k = 0; k <= n; k++) {
        const dx = Math.round(x0 + (x1 - x0) * k / n), dy = Math.round(y0 + (y1 - y0) * k / n);
        seen.set(dy * DW + dx, { dx, dy, c });
      }
    }
  }
  return [...seen.values()];
}

// The route as an ordered list of unique dots, each tagged with its row.
export function routeDots(map) {
  const out = [], p = map.route, starts = map.rowStart;
  let row = 0;
  for (let i = 1; i < p.length / 2; i++) {
    while (row < starts.length - 2 && i > starts[row + 1]) row++;
    const x0 = p[2 * i - 2] * (DW - 1), y0 = p[2 * i - 1] * (DH - 1), x1 = p[2 * i] * (DW - 1), y1 = p[2 * i + 1] * (DH - 1);
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) || 1;
    for (let k = 0; k <= n; k++) {
      const dx = Math.round(x0 + (x1 - x0) * k / n), dy = Math.round(y0 + (y1 - y0) * k / n);
      const last = out[out.length - 1];
      if (!last || last.dx !== dx || last.dy !== dy) out.push({ dx, dy, row });
    }
  }
  return out;
}
