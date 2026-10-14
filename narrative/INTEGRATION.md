# Integrating with Rover Run without breaking it

> **14 October 2026 integration update:** the user explicitly authorized adding the
> competitive stage and selector to Rover Run. The implementation keeps the original
> engine, game, screen, effects, symbols and stylesheet unchanged. Its only live-page
> edits are a separate stage-selector module/style/data file and two includes in
> `index.html`. `paperweights/build_site.py` copies the independent competitive page
> into the existing publish directory at build time; the publish path stays the same.
> The guidance below records the original isolation contract. This narrow integration
> is the authorized exception; it does not authorize redesigning collaborative play.
> Paper Weights is the current project name and `paperweights/` its source directory.


This is for an agent or team that wants to add to Rover Run. It might be a new level, a new stage
of the event, or a new world. The work lives in another directory (for example `paperweights/`) and must
leave the live game alone.

It describes what was done twice already. **Servers** (`servers/`) and a Moon prototype
(`moon/claude/`) were both built as forks next to Rover Run, and neither touched it. It also
describes how to keep the look intact, which is where outside work has gone wrong most often.

Read [REUSE.md](REUSE.md) for re-skinning on new data. This document is about living alongside
the published game and looking like it.

## 1. What is live, and must not change

Rover Run is published by Netlify from **`space/rover-run/src/web/`**. Only pushes to `main`
deploy (see `netlify.toml`); other branches are a no-op.

| Path | What it is | Rule |
| --- | --- | --- |
| `space/rover-run/src/web/*` | the live game: `index.html`, `game.js`, `engine.js`, `analysis.js`, `screen.js`, `effects.js`, `symbols.js`, `style.css`, `deck.json`, `map.json`, `rows.json` | **Do not edit.** Copy from it. |
| `netlify.toml` | publishes that one folder | Do not change the publish dir or contexts. |
| `space/rover-run/src/tools/*`, `src/serve.py` | simulator, map prep, playtest harness, the dev server on **port 8670** | Do not edit. Do not take port 8670. |
| `localStorage` key `rover-run.claude.v1.6` | players' remembered runs | Never read or write it from another page. |
| `window.rover` | the test hook that `tools/agent-play.mjs` and `shot.mjs` drive | Keep its shape. |
| `space/rover-run/rulebook*.md`, `narrative/INDICATORS.md`, `chronology/2026-10-04-rover-run.md` | the game's design record | Append-only, and only by the Rover maintainer. |

To check that nothing moved, run these from the repo root:

```
git status --short space/rover-run netlify.toml     # must print nothing
node space/rover-run/src/tools/sim.mjs              # every check must still pass
```

If your work genuinely needs a change in Rover itself, keep it to one small, separate commit with
its own message, and say so to the person who owns the game. Never fold a Rover edit into a commit
about your own feature.

## 2. Work in your own directory

What Servers and Moon did:

1. **Make a sibling folder** (`servers/`, `moon/claude/`; here `paperweights/`) with its own `web/`,
   `tools/`, `serve.py`, `README.md`.
2. **Copy, don't import.**
   - Copy these unchanged into your `web/` as the starting point: `style.css`, `screen.js`,
     `effects.js`, `symbols.js`, and the `game.js` skeleton.
   - Never import across folders (`../../space/rover-run/src/web/screen.js`). A later Rover change
     would silently change your page, and a change you make "for your page" would change Rover.
3. **Add, don't override.**
   - Put your styles in a *second* stylesheet loaded after Rover's (`moon.css` did this).
   - Leave the copied `style.css` byte-identical, so `diff` against Rover shows only what you
     meant to change.
4. **Own your names.**
   - Use a new port (Rover 8670, Servers 8672, Moon 8676; check with `ss -ltnp` first).
   - Use a new `localStorage` key, prefixed with your folder name.
   - Use your own `out/` (gitignored) for screenshots, sessions and state.
5. **Rewrite the rules by hand.** Rewrite `engine.js` and `analysis.js` in your own vocabulary
   rather than find-and-replacing (REUSE §5 has the two bugs that caused).
6. **Share heavy dependencies by symlink, gitignored.** Servers and Moon link `node_modules` and
   `.venv` to Rover's. Big data goes on the Seagate drive (`/mnt/seagate/gamesworkshop/<project>/`)
   with a `.sha256` next to each file.

## 3. Adding a stage selector (collaborative / competitive)

The ask: a drop-down at the top right that says **collaborative** for the current Rover level and
offers **competitive**, built by someone else in `paperweights/`.

Keep the two pages separate and connect them with links, not shared code:

- **The selector is a link list, not a router.**
  - Each stage is its own page: Rover's `index.html` for collaborative, and for competitive
    something like `paperweights/web/index.html`.
  - Choosing a stage navigates to that page. No page loads another page's scripts or reaches into
    its state.
- **Read the list from a data file, so adding a stage needs no code change.**
  - Put a `stages.json` next to the page that shows the selector:
    `[{"id": "collaborative", "label": "Collaborative", "href": "./"}, {"id": "competitive", "label": "Competitive", "href": "/paperweights/web/"}]`.
  - If the file is missing or has one entry, show no selector at all. The live game then looks
    exactly as it does today.
- **Put it where the controls already live.** Rover's top right holds the segmented Easy / Medium /
  Hard control (`.modes`). Put the selector beside it, styled like those buttons:
  - 12 px mono text, a `#3a3a38` border, 3 px radius, black background;
  - when selected, the colours invert (`.modes button.on`).

  Don't use the browser's default `<select>` styling, and don't add a new colour.
- **The competitive page carries the same selector**, reading the same `stages.json` (or its own
  copy), with competitive marked on. The bar, title position and controls stay in the same places,
  so switching stage doesn't make the layout jump.

**Who changes what:**

| Who | Changes |
| --- | --- |
| The Rover maintainer | Adds the selector to Rover's page once, as one small reviewed commit (section 1). |
| The other team | Adds a line to `stages.json` and everything under `paperweights/`. They never touch Rover's `game.js` or `style.css`. |

**Publishing.**
- Netlify publishes only `space/rover-run/src/web/`, so a page in `paperweights/` is not on the live site.
  Locally, serve from the repo root (`python3 -m http.server` at the root) so both `/space/...`
  and `/paperweights/...` resolve.
- Getting `paperweights/` onto the live site means a deliberate change to `netlify.toml`, owned by the Rover
  maintainer. For example, a build step that copies `paperweights/web` into a subfolder of the publish
  directory. Until then, the `competitive` entry should only be in the local `stages.json`.

## 4. The look: what makes a page read as Rover Run

Other agents have mostly broken the game's look, not its logic. Copy these exactly; the
screenshot test in section 6 checks them.

**Page and layout** (`style.css`, `index.html`)

- **Background and font.** Pure black (`#000`). One monospace family:
  `"JetBrains Mono", "DejaVu Sans Mono", ui-monospace, monospace`. No other font, no font weights
  except the one bold for hazard words.
- **One page, no scroll at 1440×900.**
  - Grid: `minmax(0, 1fr) 210px`. The left column holds three stacked panels: the map, the cards,
    the graph. The right column holds their keys.
  - `fit()` in `game.js` shrinks the map so everything fits the window. Don't fix heights by hand.
- **The bar.**
  - Left: the title `MAP: <place>, <world>` (20 px, regular weight).
  - Next to it, the action buttons, with the shortcut letter underlined (`<u>G</u>o`).
  - Then a right-aligned status, the lives (`♥♥♥`), and Reset.
  - At the far right, the segmented mode control.
- **No text inside the map frame.** Labels, instructions and scores go in the bar, the cards or
  the side column.
- **Instructions** are one typed line at the bottom of the right column (`#say`). It types at about
  45 characters a second and ends in a blinking `▍`. Say what to do now in under ten words, plus
  the scoring rule if it matters. Never use a paragraph.
- **Cards.**
  - Each card is a 50 px bordered box: a line glyph above a 10 px word.
  - Face down, it shows only its column number in `#3a3a38`.
  - Seen cards get a `#5a5a58` border.
  - A deadly card is inverted: white (`--ink`) background, black glyph. That is how a hazard is
    shown, not with a colour.
  - One column per map strip. The cards and the graph sit exactly under the strips
    (`alignStrips()`).
- **Buttons.**
  - 13 px mono with a `#5a5a58` border and 3 px radius.
  - On hover, the border turns `--ink` and the background `#111`.
  - When disabled, the text is `#4a4a48` and the border `#262625`.
- **Keys** (right column): a low / mid / high table built from the same glyphs as the cards, in
  11 px dim text. Never draw a separate legend icon; render it from `SYMBOLS`.

**The dot-matrix screen** (`screen.js`)

- The map is drawn as dots on a character grid: `COLS = 100`, `ROWS = 26`, each cell `SX × SY` =
  3 × 6 sub-dots, dot size `cw × 0.17`. The map window is `MAP = {col: 2, row: 0.5, cols: 96, rows: 25}`.
- **Everything is a display list** of `{x, y, c, a, s}` dots, or `{x, y, c, t}` glyphs, redrawn
  every frame. Add new marks by pushing dots into the list in `frame()`.
  - Never draw outside it with canvas paths.
  - Never use images or gradients.
  - Never use smooth lines; a line is dots stepped along it (see `contourDots`, `routeDots`).
- **Contours** come from a real elevation model via `tools/prep.py`. Each contour is tinted by its
  height between two colours (`LOW` to `HIGH`). The route is brighter dots, dashed where a detour
  was taken. Strip boundaries are faint dotted verticals.
- **Death screens are particle effects on the frozen display list** (`effects.js`). Each takes the
  last frame's dots and moves or recolours them:
  - `storm`: a sand front from the top right;
  - `battery`: an old TV switching off;
  - `sand`: a spiral into a hole;
  - `boot`: a scanline fade-in.

  Reuse these. If you need a new one, add exactly one, built the same way. Servers added a burn;
  the Moon prototype added frost.

**Glyphs** (`symbols.js`)

- Each glyph is an SVG with `viewBox 0 0 32 24` and no fill.
  - `stroke: currentColor`, width 1.4, round caps and joins.
  - Modifier classes: `fill` (solid shapes), `thin` (1.0), `hair` (0.7), `faint` (55 % opacity).
  - Because they use `currentColor`, an inverted card draws them black on white for free.
- **Draw readable pictures, not icons or emoji.** Rover's stick figure standing, sinking or
  half-buried; rain hatching for haze; a spiral for a storm; a battery with a bar or a cross.
- **Make a mock page first.** Show every glyph at card size *and* large, side by side with Rover's,
  and choose there. Glyphs that look fine large often turn to mush at 40 × 28 px.

## 5. Picking colours

Rover's palette is almost colourless on purpose:

| Token | Value | Used for |
| --- | --- | --- |
| `--bg` | `#000` | everything behind |
| `--ink` | `#e6e6e1` | text, seen glyphs, the inverted hazard card, the route |
| `--dim` | `#8a8a86` | secondary text, keys, labels |
| `--faint` | `#3a3a38` | card backs, strip lines, terrain band |
| borders | `#1c1c1b` panel, `#262625` card back, `#5a5a58` seen card / button | |
| `--sand` | `#c2a374` | the one world colour: Mars dust in the death effects and hazard marks |
| contours | `LOW [86,116,124]` → `HIGH [158,96,76]` | Mars terrain, teal hollows to rust ridges |
| fatal ring | `#e07a5f` | the single card that explains a death |

When you add a world or a stage:

- **Keep the greys exactly.** They are the game's identity.
- **Change at most two things:**
  - **The contour pair.** Pick two colours for that world's low and high ground, both muted and
    mid-dark (no channel much above 180). Contours must stay quieter than the route and the cards.
    The Moon prototype used `[78,92,118]` → `[170,168,158]` (cold blue-grey to pale regolith).
  - **One accent** that replaces `--sand` in that world's effects and map marks.
- **A new colour must mean one thing everywhere it appears.** For example, the Moon prototype used
  yellow `#f2d36b` only for "a person decides here". Never add colour for decoration.
- **Hazards are shown by inversion (white card), not by red.** Red (`#e07a5f`) stays the one
  "this is why you died" ring.
- **Check contrast on the projector.** Take a screenshot and look at it at half size. If the
  contours compete with the route, they are too bright.

## 6. Check your page against Rover before calling it done

What caught the problems last time:

1. **Screenshot both games at 1440×900** with Playwright (`src/tools/shot.mjs` pattern), the same
   mode and the same point in a run. Paste them side by side and look at them:
   - Does the title sit in the same place?
   - Are the cards the same size?
   - Do the columns line up under the strips?
   - Does anything scroll or overflow?
   - Is any text in the map?
   - Are there colours that aren't in section 5?
2. **Narrow the window to about 1000 px and to phone width.** Rover collapses to one column at
   760 px; yours should too.
3. **Play it to the end** in every mode: the death screens, the replay, Play again, Reset. On Moon,
   a white-on-white outcome card and a status line that overflowed into the mode buttons only
   showed up at the end of a run.
4. **Run Rover's checks again** (section 1) to prove you didn't touch it.

## 7. Repo hygiene (each was a real mistake)

- **Commit by path** (`git add paperweights/ narrative/...`), never `git add -A`. Other sessions share this
  repo; `-A` once swept another project into a Rover commit.
- **Stop servers by PID** (save it to `out/serve.pid`), never `pkill -f serve.py`. That once took
  down Rover's and other projects' servers.
- **Keep large files out of git.** Screenshots, sessions and benchmarks go in `out/` (gitignored);
  only small JPEGs chosen for the README go in `assets/`.
- **Write down what you changed and what failed**, in your folder's `README.md` and a
  `chronology/YYYY-MM-DD-<name>.md` entry. Don't delete failed attempts.

## Checklist

- [ ] Nothing under `space/rover-run/` or in `netlify.toml` changed (`git status`), and Rover's
      `sim.mjs` passes.
- [ ] Own folder, own port, own `localStorage` key, own `out/`.
- [ ] Rover's `style.css` and `screen.js` copied unchanged; additions in a second stylesheet.
- [ ] Stage selector: data-driven (`stages.json`), styled like `.modes`, hidden when there is one
      stage, and links to other pages instead of loading their code.
- [ ] New glyphs: 32×24, `currentColor`, stroke 1.4, chosen on a mock page.
- [ ] Colours: Rover's greys exactly, plus at most a contour pair and one accent, each with one
      meaning.
- [ ] Side-by-side 1440×900 screenshots with Rover look like the same game, with no overflow and
      no text in the map.
- [ ] Committed by path, servers stopped by PID, README and chronology written.
