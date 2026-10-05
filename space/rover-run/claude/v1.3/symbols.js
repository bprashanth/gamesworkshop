// Line-drawn card symbols, one per value. They inherit currentColor, so a deadly
// (inverted) card draws them black on white.
const svg = body => `<svg viewBox="0 0 32 20" class="sym" aria-hidden="true">${body}</svg>`;
const wheel = (cy) => `<circle cx="16" cy="${cy}" r="3.6"/><circle cx="16" cy="${cy}" r="0.8" class="fill"/>`;

export const SYMBOLS = {
  slope: {
    flat: svg('<path d="M3 15 H29"/>'),
    tilted: svg('<path d="M3 16 L29 9"/>'),
    steep: svg('<path d="M7 18 L25 3"/>'),
  },
  ground: {                                                  // a wheel on the ground
    firm: svg(`<path d="M2 15 H30"/>${wheel(11.2)}`),
    soft: svg(`<path d="M2 13 H9 Q16 19 23 13 H30"/>${wheel(13.2)}<path d="M8 17.5 h1 M15 18.5 h1 M22 17.5 h1" class="thin"/>`),
    sand: svg(`<path d="M2 8 H7 Q16 23 25 8 H30"/>${wheel(14.2)}<path d="M9 12 h1 M22 12 h1 M12 16.5 h1 M20 16.5 h1" class="thin"/>`),
  },
  dust: {                                                    // the sun through the air
    clear: svg('<circle cx="16" cy="10" r="4.5"/><path d="M16 1.5 v2 M16 16.5 v2 M7.5 10 h2 M22.5 10 h2" class="thin"/>'),
    haze: svg('<circle cx="16" cy="10" r="4.5" class="faint"/><path d="M5 6.5 H27 M3 10 H29 M5 13.5 H27" stroke-dasharray="2.5 2"/>'),
    storm: svg('<path d="M3 5 q4 -3 8 0 t8 0 t8 0 M2 10 q4 -3 8 0 t8 0 t8 0 t6 0 M3 15 q4 -3 8 0 t8 0 t8 0"/>'),
  },
  battery: {
    '0': svg('<rect x="5" y="5" width="20" height="10" rx="1.5"/><path d="M26.5 8.5 v3"/><rect x="7.5" y="7.5" width="15" height="5" class="fill"/>'),
    '−1': svg('<rect x="5" y="5" width="20" height="10" rx="1.5"/><path d="M26.5 8.5 v3"/><rect x="7.5" y="7.5" width="9" height="5" class="fill"/>'),
    '–': svg('<rect x="5" y="5" width="20" height="10" rx="1.5"/><path d="M26.5 8.5 v3 M10 10 h10"/>'),
  },
};
