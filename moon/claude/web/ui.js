// Shared pieces for the Moon event pages (archive, rules, model, sudden, print, stage): the same
// cards as the board, drawn as short strips, plus small helpers. No framework.
import { SYMBOLS } from './symbols.js';
import { VARS, OUTCOME_WORD } from './moon.js';

export const ROWS = [...VARS.map(v => v.key), 'outcome'];
export const LABEL = { light: 'light', temp: 'temperature', ground: 'ground', slope: 'slope', battery: 'battery', outcome: 'happened' };
export const load = f => fetch(f).then(r => r.json());
export const $ = (s, el = document) => el.querySelector(s);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const outWord = o => !o || o === 'safe' ? 'safe' : o.toUpperCase();

// One card, exactly as on the board: symbol + word; an outcome card is white when something failed.
export function card(key, v, cls = '') {
  if (v === undefined) return `<div class="card back ${cls}"></div>`;
  const val = key === 'outcome' ? (v ?? 'safe') : v;
  const hz = key === 'outcome' && val !== 'safe' ? ' hazard' : '';
  return `<div class="card up${key === 'outcome' ? ' out' : ''}${hz} ${cls}" data-key="${key}" data-v="${val}">${SYMBOLS[key][val]}<i>${key === 'outcome' ? outWord(val) : val}</i></div>`;
}

// A history as a strip: one column per observation, one row per variable, outcome row apart.
// opts.rows limits the rows (a participant's fragment); opts.mark(t, key) adds classes.
export function strip(h, opts = {}) {
  const rows = opts.rows ?? ROWS, n = h.obs.length;
  const head = opts.title === false ? '' : `<div class="strip-h"><b>${esc(h.id)}</b>${opts.sub ? `<span>${opts.sub}</span>` : ''}</div>`;
  const body = rows.map(k => `<div class="strip-l">${LABEL[k]}</div>` + h.obs.map((o, t) => opts.hidden?.(t, k) ? `<div class="card back${k === 'outcome' ? ' out' : ''} ${opts.mark?.(t, k) ?? ''}"><span>${t + 1}</span></div>` : card(k, k === 'outcome' ? (o.outcome ?? 'safe') : o[k], opts.mark?.(t, k) ?? '')).join('')).join('');
  return `<section class="hist" style="--n:${n}">${head}<div class="strip-g">${body}</div></section>`;
}

// The card key, as on the board.
export function keyTable() {
  return '<table class="key"><tr><th></th><th>low</th><th>mid</th><th>high</th></tr>' + VARS.map(v =>
    `<tr><td>${LABEL[v.key]}</td>${v.levels.map(l => `<td title="${l}">${SYMBOLS[v.key][l]}</td>`).join('')}</tr>`).join('')
    + `<tr class="outkey"><td>happened</td>${['power', 'frozen', 'stuck'].map(o => `<td class="haz" title="${OUTCOME_WORD[o]}">${SYMBOLS.outcome[o]}</td>`).join('')}</tr></table>`;
}

// Teams: four representatives by default; ?teams=5 for more.
export const TEAMS = Array.from({ length: Number(new URLSearchParams(location.search).get('teams') || 4) }, (_, i) => String.fromCharCode(65 + i));
export const api = {
  state: () => fetch('/api/state').then(r => r.json()).catch(() => ({ rules: [], models: {}, runs: [] })),
  post: (path, body) => fetch('/api/' + path, { method: 'POST', body: JSON.stringify(body) }).then(r => r.json()).catch(() => ({ error: 'offline' })),
};
