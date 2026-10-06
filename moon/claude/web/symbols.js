// Line-drawn card symbols for Moon Run, one per value (viewBox 32 x 24), in Rover Run's hand:
// same stroke, same stick figures (firm / loose reuse Rover's firm / soft), same slope lines.
// They inherit currentColor, so an outcome card (inverted) draws them black on white.
const svg = (body, id = '') => `<svg viewBox="0 0 32 24" class="sym">${id}${body}</svg>`;
const figure = (y, arms = 'out') => {
  const a = { out: `M11 ${y + 8} L16 ${y + 6.5} L21 ${y + 8}`, wobble: `M10.5 ${y + 5} L16 ${y + 6.5} L21.5 ${y + 9}`, up: `M10 ${y} L16 ${y + 6.5} L22 ${y}` }[arms];
  return `<circle cx="16" cy="${y + 2.2}" r="2.2"/><path d="M16 ${y + 4.4} V${y + 11} M16 ${y + 11} L13 ${y + 16.5} M16 ${y + 11} L19 ${y + 16.5} ${a}"/>`;
};
const sunk = (id, ground, y, arms, surface) =>
  svg(`<g clip-path="url(#${id})">${figure(y, arms)}</g>${surface}`, `<defs><clipPath id="${id}"><rect x="0" y="0" width="32" height="${ground}"/></clipPath></defs>`);
// a thermometer: bulb at the bottom, the column filled to `level` (0..1)
const thermo = (level, extra = '') => {
  const top = 4, bottom = 15, y = bottom - (bottom - top) * level;
  return svg(`<path d="M13.4 15.4 V5 a2.6 2.6 0 0 1 5.2 0 V15.4"/><circle cx="16" cy="18" r="3.4"/><circle cx="16" cy="18" r="1.9" class="fill"/><rect x="15" y="${y.toFixed(1)}" width="2" height="${(16 - y).toFixed(1)}" class="fill"/><path d="M21 6 h2 M21 9 h2 M21 12 h2" class="hair"/>${extra}`);
};
const flake = (x, y, r) => [0, 60, 120].map(a => { const c = Math.cos(a * Math.PI / 180) * r, s = Math.sin(a * Math.PI / 180) * r;
  return `M${(x - c).toFixed(1)} ${(y - s).toFixed(1)} L${(x + c).toFixed(1)} ${(y + s).toFixed(1)}`; }).join(' ');

export const SYMBOLS = {
  light: {                                                   // the sun over the horizon
    sun: svg('<circle cx="16" cy="10" r="4.2"/><path d="M9.8 3.8 l2 2 M22.2 3.8 l-2 2 M9.8 16.2 l2 -2 M22.2 16.2 l-2 -2" class="thin"/><path d="M3 20.5 H29"/>'),
    shade: svg('<path d="M11.8 16 a4.2 4.2 0 0 1 8.4 0" class="faint"/><path d="M3 20.5 L10 20.5 L17 13 L22 16.5 L29 16.5"/><path d="M14 19 l-2.2 1.5 M17.5 18 l-3 2.5 M21 18.5 l-2.5 2 M24.5 18.5 l-2.5 2" class="hair"/>'),
    dark: svg('<path d="M3 20.5 L9 9 L14 15 L19 6 L29 20.5"/><path d="M8 20.5 l3.5 -4 M12 20.5 l3.5 -4 M16 20.5 l3.5 -4 M20 20.5 l3.5 -4 M24 20.5 l2 -2.4" class="hair"/><circle cx="5" cy="5" r=".7" class="fill"/><circle cx="26.5" cy="7" r=".7" class="fill"/>'),
  },
  temp: {
    warm: thermo(1),
    cool: thermo(0.5),
    cold: thermo(0.1, `<path d="${flake(25.5, 18, 3.2)}" class="thin"/>`),
  },
  ground: {
    firm: svg(`${figure(3)}<path d="M3 19.5 H29"/>`),
    loose: sunk('cs', 18.6, 5, 'wobble', '<path d="M3 18.6 H10 Q16 20.4 22 18.6 H29"/><path d="M8 22 h1.2 M15 23 h1.2 M22 22 h1.2" class="thin"/>'),
    rocky: svg(`${figure(1.5)}<path d="M3 20.5 H6.5 q1.8 -3.4 4 -1.6 q1.6 -3 4.2 -.6 q2.2 -3.2 4.6 0 q2 -2.6 4.2 0.2 q1.6 -1.6 3 .5 H29"/><path d="M9 23 h1 M17 23 h1 M24 23 h1" class="thin"/>`),
  },
  slope: {
    flat: svg('<path d="M3 17 H29"/>'),
    slope: svg('<path d="M3 18 L29 10"/>'),
    steep: svg('<path d="M8 21 L25 4"/>'),
  },
  battery: {
    full: svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3"/><rect x="7.5" y="9.5" width="15" height="5" class="fill"/>'),
    low: svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3"/><rect x="7.5" y="9.5" width="5" height="5" class="fill"/>'),
    dead: svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3 M11 9 l8 6 M19 9 l-8 6"/>'),
  },
  outcome: {                                                 // what happened on this square
    safe: svg('<path d="M11 12.5 l3.5 3.5 l7 -8" class="thin"/>'),
    power: svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3"/><path d="M16.5 5 L12.5 12.5 H17 L13.5 19.5" stroke-width="1.6"/>'),
    frozen: svg(`<path d="${flake(16, 12, 8.5)}"/><path d="${[0, 60, 120, 180, 240, 300].map(a => { const r = a * Math.PI / 180, x = 16 + Math.cos(r) * 5.5, y = 12 + Math.sin(r) * 5.5, p = r + Math.PI / 2;
      return `M${(x + Math.cos(p) * 2).toFixed(1)} ${(y + Math.sin(p) * 2).toFixed(1)} L${(x - Math.cos(p) * 2).toFixed(1)} ${(y - Math.sin(p) * 2).toFixed(1)}`; }).join(' ')}" class="thin"/>`),
    stuck: svg('<circle cx="11" cy="14" r="4.5"/><circle cx="21" cy="14" r="4.5"/><path d="M7 9.5 H25" /><path d="M2 15 Q9 17.5 16 15.5 Q23 13.5 30 16 V24 H2 Z" class="fill"/>'),
  },
};
