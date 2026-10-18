// Line-drawn card symbols, one per value (viewBox 32 x 24), in the same weight as Rover Run's.
// They inherit currentColor, so a deadly (inverted) card draws them black on white.
const svg = body => `<svg viewBox="0 0 32 24" class="sym" aria-hidden="true">${body}</svg>`;

// a person: x is the centre, y the top of the head; `hand` is where the leash hand ends
const person = (x, y) => `<circle cx="${x}" cy="${y + 2.2}" r="2.1"/><path d="M${x} ${y + 4.3} V${y + 11} M${x} ${y + 11} L${x - 2.6} ${y + 17} M${x} ${y + 11} L${x + 2.6} ${y + 17} M${x} ${y + 6.5} L${x - 3.4} ${y + 9.5} M${x} ${y + 6.5} L${x + 4} ${y + 9}"/>`;
// a small dog standing on the ground line (y = 20): body, head, tail, two legs
const dog = x => `<path d="M${x} 16 h5 M${x + 5} 16 l1.6 -1.8 M${x} 16 l-1.2 -1.6 M${x + 0.6} 16 v3 M${x + 4.4} 16 v3" /><circle cx="${x + 6.6}" cy="14.1" r="0.9" class="fill"/>`;
const leash = (x0, y0, x1, y1) => `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 2} ${x1} ${y1}" class="thin"/>`;
// a server rack: three stacked units with status dots
const rack = extra => `<rect x="11" y="4" width="10" height="17" rx="1"/><path d="M11 9.7 H21 M11 15.3 H21" class="thin"/><path d="M13 6.9 h1 M13 12.5 h1 M13 18.1 h1" class="thin"/>${extra}`;

export const SYMBOLS = {
  queries: {                                                   // how much traffic: one bubble, three, a wave
    whisper: svg('<circle cx="16" cy="12" r="2.4"/>'),
    chatter: svg('<circle cx="9" cy="12" r="2.4"/><circle cx="16" cy="12" r="2.4"/><circle cx="23" cy="12" r="2.4"/>'),
    flood: svg('<path d="M3 9 q3.25 -3 6.5 0 t6.5 0 t6.5 0 t6.5 0 M3 15 q3.25 -3 6.5 0 t6.5 0 t6.5 0 t6.5 0"/>'),
  },
  users: {                                                     // the dogs are the users; the walker is you
    many: svg(`${person(9, 3)}${leash(13, 12.5, 15, 16)}${leash(13, 12.5, 21, 15.5)}${dog(15)}${dog(22)}<path d="M2 20 H30" class="thin"/>`),
    few: svg(`${person(11, 3)}${leash(15, 12.5, 18, 16)}${dog(18)}<path d="M2 20 H30" class="thin"/>`),
    gone: svg(`${person(11, 3)}${leash(15, 12.5, 22, 18.5)}<path d="M22 18.5 m-1.2 0 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0" class="thin"/><path d="M2 20 H30" class="thin"/>`),
  },
  servers: {                                                   // a rack: cool, warm (heat lines), burning (flames)
    cool: svg(rack('')),
    warm: svg(rack('<path d="M24 7 q1.5 2 0 4 t0 4 M27 7 q1.5 2 0 4 t0 4" class="thin"/>')),
    burning: svg(rack('<path d="M14 4 q-2 -3 1 -4 q-0.5 2 1.5 2.6 q1 -2 0.5 -3 q3 2 1 4.4" /><path d="M22.5 13 q2.5 -2 1 -5 q2.5 1 2.6 3.5 q1 -1.5 0.8 -2.8 q2.3 2.4 0.2 5.2" class="thin"/>')),
  },
  funds: {                                                     // Rover Run's battery: full, or empty
    full: svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3"/><rect x="7.5" y="9.5" width="15" height="5" class="fill"/>'),
    empty: svg('<rect x="5" y="7" width="20" height="10" rx="1.5"/><path d="M26.5 10.5 v3 M11 9 l8 6 M19 9 l-8 6"/>'),
  },
};
