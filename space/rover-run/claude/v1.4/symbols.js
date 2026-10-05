// Line-drawn card symbols, one per value (viewBox 32 x 24). They inherit currentColor,
// so a deadly (inverted) card draws them black on white. Chosen from mocks/glyphs.html:
// stick figures for ground, rain for haze, a spiral dust devil for storm.
const svg = (body, id = '') => `<svg viewBox="0 0 32 24" class="sym">${id}${body}</svg>`;
// a stick figure: x = centre, y = top of head; arms 'out' | 'wobble' | 'up'
const figure = (y, arms = 'out') => {
  const a = { out: `M11 ${y + 8} L16 ${y + 6.5} L21 ${y + 8}`, wobble: `M10.5 ${y + 5} L16 ${y + 6.5} L21.5 ${y + 9}`, up: `M10 ${y} L16 ${y + 6.5} L22 ${y}` }[arms];
  return `<circle cx="16" cy="${y + 2.2}" r="2.2"/><path d="M16 ${y + 4.4} V${y + 11} M16 ${y + 11} L13 ${y + 16.5} M16 ${y + 11} L19 ${y + 16.5} ${a}"/>`;
};
// clip the figure at the ground surface so the sunk part disappears
const sunk = (id, ground, y, arms, surface) =>
  svg(`<g clip-path="url(#${id})">${figure(y, arms)}</g>${surface}`, `<defs><clipPath id="${id}"><rect x="0" y="0" width="32" height="${ground}"/></clipPath></defs>`);

// an Archimedean spiral, wider than tall, like a dust devil seen from the side
const spiral = () => Array.from({ length: 90 }, (_, i) => { const t = i / 89 * 3.2 * Math.PI, r = 0.6 + t * 0.95;
  return `${i ? 'L' : 'M'}${(16 + Math.cos(t) * r * 1.25).toFixed(2)} ${(12 + Math.sin(t) * r * 0.85).toFixed(2)}`; }).join(' ');


export const SYMBOLS = {
  ground: {
    firm: svg(`${figure(3)}<path d="M3 19.5 H29"/>`),
    soft: sunk('cs', 18.6, 5, 'wobble', '<path d="M3 18.6 H10 Q16 20.4 22 18.6 H29"/><path d="M8 22 h1.2 M15 23 h1.2 M22 22 h1.2" class="thin"/>'),
    sand: sunk('cq', 13.5, 4.5, 'up', '<path d="M2 13.5 H30"/><path d="M8 16.5 q3 -1.6 6 0 M18 16.5 q3 -1.6 6 0 M11 20 q3 -1.6 6 0 M5 20 h2 M24 20 h2" class="thin"/>'),
  },
  dust: {                                                    // the sun through the air
    clear: svg('<circle cx="16" cy="12" r="4.5"/><path d="M9.5 5.5 l2 2 M22.5 5.5 l-2 2 M9.5 18.5 l2 -2 M22.5 18.5 l-2 -2" class="thin"/>'),
    haze: svg('<circle cx="16" cy="12" r="4.5" class="faint"/><path d="M26 3 l-3 4 M20 3 l-3 4 M14 3 l-3 4 M8 3 l-3 4 M29 10 l-3 4 M23 10 l-3 4 M17 10 l-3 4 M11 10 l-3 4 M26 17 l-3 4 M20 17 l-3 4 M14 17 l-3 4 M8 17 l-3 4" class="thin"/>'),
    storm: svg(`<path d="${spiral()}"/><path d="M27 4 h1.5 M28.5 9 h1.5 M2.5 17 h1.5 M27 20 h1.5 M3 6 h1.5" class="thin"/>`),
  },
  slope: {
    flat: svg('<path d="M3 17 H29"/>'),
    tilted: svg('<path d="M3 18 L29 10"/>'),
    steep: svg('<path d="M8 21 L25 4"/>'),
  },
  battery: {
    '0': svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3"/><rect x="7.5" y="9.5" width="15" height="5" class="fill"/>'),
    '−1': svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3"/><rect x="7.5" y="9.5" width="9" height="5" class="fill"/>'),
    '–': svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3 M10 12 h10"/>'),
  },
};
