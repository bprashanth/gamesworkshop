# Crew

A minimal Game Boy-style card table in the browser. One human, four bots, five tricks. A muted green table, five suit colors, large ranks, clearly marked discards and flat borders without shadows. No hidden-hand graphics, tutorial screens or demo controls.

## Run

```sh
node crew/server.mjs
```

Open http://localhost:4173. The server listens on `0.0.0.0:4173`, so the same port works through the machine's LAN or Tailscale address. No install, build, API key or internet access is needed to play. Node.js 20+ is enough. Alternatively: `python3 -m http.server 4173 --bind 0.0.0.0 --directory crew`.

## Controls

- Choose a suit in the action strip when you are Commander. The installed stack above the table is read-only.
- Click a bright card in your hand to play it. Dimmed cards cannot be played on that turn.
- **Install** advances after everyone has seen the trick.
- **Reset** starts a new deal. **Same deal** appears when finished.

The screen contains only installed parts and total, each player's played card or waiting slot, your hand, and these controls. There is no signaling. The room facilitator explains the rules.

The lowest card played in the called suit installs. Off-suit cards are discards and never win, regardless of rank. Its player becomes Commander. Follow suit if possible; otherwise discard any card. The goal is the lowest total for a complete five-suit ship. Equal ranks go to the first played, clockwise from Commander. A missing called suit ends incomplete with no score. Other players' hands remain private.

For example, MODEL 1 beats MODEL 5 when MODEL is called. When TOOLS is called, a discarded MODEL 1 cannot beat TOOLS 3. Commander calls, then plays first. The winner becomes the next Commander. This pass keeps five rounds with each suit called once.

Projection target: 1366x768 or larger. A narrow phone scrolls the player row and hand horizontally. Repeatable deal: `http://localhost:4173/?seed=1`.

## Verification

```sh
node --test crew/game.test.mjs crew/simulation.test.mjs
node crew/simulate.mjs --games 2500
```

AI-only simulation remains available through the command above. Browser checks, with the server running:

```sh
cd crew
npm ci
npx playwright install chromium
npm run test:browser
```

Set `CHROMIUM_PATH=/path/to/chrome` to use an existing browser installation.

[PLAYTEST.md](PLAYTEST.md) records the iterations. Current simulations write [reports/lowest-no-signals.json](reports/lowest-no-signals.json). Default play is **lowest in the called suit wins, no signals**. Historical highest-wins and communication experiments remain available with explicit `{winner:'highest', signalMode:'classic'}` or `{signalMode:'single'}` options to `createGame` and `simulateGame`. They are not exposed by the live game. Card definitions and 50-card deck remain unchanged. No Phase 2 is implemented.

[chronology/2026-10-02.md](chronology/2026-10-02.md) and git preserve previous versions. Current screenshots use the `lowest-` prefix in [screenshots/](screenshots/); older screenshots are historical checkpoints.
