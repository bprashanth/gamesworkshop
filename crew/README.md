# CREW · Phase 1

A local, offline, five-player cooperative card game. You play one seat; four simple bots play the others. Build one **MODEL, DATA, TOOLS, VERIFICATION and COMPUTE** into the cheapest complete AI spaceship.

## Play

From the repository root:

```sh
node crew/server.mjs
```

Open **http://localhost:4173**. No install, API key, network connection or build step is needed to play. Use a modern browser and Node.js 20+ for the server. Alternatively: `python3 -m http.server 4173 --directory crew`.

- **Call a suit** when you are Commander.
- **Choose a card, then Play**. You must follow suit if possible; otherwise discard anything.
- **The highest card in the called suit installs.** Its player becomes Commander. Discards never win.
- Use **Signal a card** once per game: reveal your LOWEST, HIGHEST or ONLY card in its suit.
- **Install & continue** keeps round results visible until the room is ready.
- **New deal** resets everything. **Try the same deal** on the result screen lets you change decisions with the same cards.
- **Watch AI** demonstrates the whole game. **Play yourself** returns to human mode.

A cheap crew signal lets you safely discard an expensive card in that suit. Delay calling a well-covered suit to give your partners time to shed expensive cards. Five tricks; add the installed ranks; lower is better. Exactly equal winning ranks go to the first card played, starting clockwise from Commander. If nobody can play the called suit, the ship is incomplete and has no qualifying score.

The computer keeps other players’ cards face down. You see their hand counts, public signals, played cards and discards. No Phase 2 consequences are implemented.

## Projection

The complete hand and controls fit on a 1366×768 desktop viewport; 1440×900 or larger gives more breathing room. Browser fullscreen is useful for a group. Narrow phones use a horizontally scrollable hand. Instructions stay on the table, and there is a short “How to play” overlay.

A replayable deal: `http://localhost:4173/?seed=1`. An automated demonstration: `http://localhost:4173/?seed=1&watch`.

## The one deliberate rule change

The brief initially specified **lowest** card installs. Playtesting proved that five-card hands can always preserve their cheapest card in each unbuilt suit; neither call order nor communication can improve the result. The prototype therefore changes **only lowest → highest**. The goal, costs, deck, suits, five tricks, free off-suit discards, Commander succession and signals remain as described.

This iteration makes expensive cards a shared problem to remove before calling their suit. Both original and revised results, the mathematical explanation, limitations and room-scale qualification statistics are recorded in [PLAYTEST.md](PLAYTEST.md). The original rule is still available in the engine with `createGame(seed, { winner: 'lowest' })` or `simulateGame(seed, { winner: 'lowest' })`.

## Test and simulate

No package install is needed for engine tests or simulations:

```sh
node --test crew/game.test.mjs crew/simulation.test.mjs
node crew/simulate.mjs --games 2500
```

The experiment writes [reports/simulation.json](reports/simulation.json). It compares random legal play, strategy, no signals, random/fixed call order, forced first-suit forks, installed ranks and room qualification. Only completed ships score. The cheapest five tables qualify; tied tables at the boundary are chosen randomly.

Browser tests need development dependencies, with the local server running:

```sh
cd crew
npm ci
npx playwright install chromium
npm run test:browser
```

If using an existing Chromium installation, set `CHROMIUM_PATH=/path/to/chrome`. Browser checks save screenshots and results inside `crew/`. They exercise a complete human game, legal moves, a one-use signal, replay, AI demo, reset and viewport behavior. [screenshots/](screenshots/) contains the inspected visual evidence.

## Checkpoints

[chronology/2026-10-02.md](chronology/2026-10-02.md) records decisions and verification checkpoints. All code, references, screenshots and reports are self-contained in this directory. The game uses no external fonts or runtime dependencies.
