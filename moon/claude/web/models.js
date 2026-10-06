// Example team models, for rehearsal and for the simulator. In the event, each representative
// assembles their own from the rules their audience graduated (model.html); those arrive from the
// server and are listed first on the board.
const P = (key, value, n, then) => ({ type: 'persists', a: { key, value }, n, then });
const B = (key, value, then) => ({ type: 'before', a: { key, value }, then });
const W = (key, value, key2, value2, then, n = 1) => ({ type: 'with', a: { key, value }, n, b: { key: key2, value: value2 }, then });

export const EXAMPLE_MODELS = [
  { id: 'room', name: 'a good room', note: 'the three hidden laws, roughly, plus the firm-ground exception',
    rules: [P('light', 'shade or dark', 3, 'power'), W('light', 'dark', 'temp', 'cold', 'frozen'), W('ground', 'loose', 'slope', 'steep', 'stuck'), W('light', 'shade', 'ground', 'firm', 'safe', 2)] },
  { id: 'sharp', name: 'a sharp room', note: 'the power rule already knows about firm ground: no conflicts left',
    rules: [W('light', 'shade or dark', 'ground', 'loose or rocky', 'power', 3), W('light', 'dark', 'temp', 'cold', 'frozen'), W('ground', 'loose', 'slope', 'steep', 'stuck')] },
  { id: 'single', name: 'one card each', note: 'single-card warnings: catches everything, cries wolf',
    rules: [B('light', 'dark', 'frozen'), B('ground', 'loose', 'stuck'), B('light', 'shade', 'power')] },
  { id: 'shadow', name: 'shadow only', note: 'one general precursor and nothing else',
    rules: [P('light', 'shade or dark', 2, 'any')] },
  { id: 'late', name: 'battery watchers', note: 'a lagging measurement: it reports, it does not warn',
    rules: [B('battery', 'dead', 'power'), B('temp', 'cold', 'frozen'), B('slope', 'steep', 'stuck')] },
];
