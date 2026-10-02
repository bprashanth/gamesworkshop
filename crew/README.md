# Crew

A minimal Game Boy-style card table in the browser. One human, four bots, five tricks. A muted green table, five suit colors, large ranks and clearly marked discards. No hidden-hand graphics, tutorial screens or demo controls.

## Run

```sh
node crew/server.mjs
```

Open http://localhost:4173. The server listens on `0.0.0.0:4173`, so the same port works through the machine's LAN or Tailscale address. No install, build, API key or internet access is needed to play. Node.js 20+ is enough. Alternatively: `python3 -m http.server 4173 --bind 0.0.0.0 --directory crew`.

## Controls

- Choose a suit in the action strip when you are Commander. The installed stack above the table is read-only.
- Click a bright card in your hand to play it. Dimmed cards cannot be played on that turn.
- **Signal a card**, choose a card, then choose **LOWEST**, **HIGHEST** or **ONLY** in its suit. Only truthful labels are enabled. One signal per game.
- **Install** advances after everyone has seen the trick.
- **Reset** starts a new deal. **Same deal** appears when finished.

The screen contains only installed parts and total, each player's played card or waiting slot, public signals, your hand, and these controls. Signals are crossed out once the revealed card has been played. The room facilitator explains the rules.

The highest card in the called suit installs. Its player becomes Commander. Follow suit if possible; otherwise discard any card. The goal is the lowest total for a complete five-suit ship. Equal ranks go to the first played, clockwise from Commander. A missing called suit ends incomplete with no score. Other players' hands remain private.

Signals describe a card as your **LOWEST**, **HIGHEST** or **ONLY** in its suit. The revealed card and label remain beside your seat; played signals are marked and dimmed. Cheap public coverage lets teammates shed more expensive cards before that suit is called.

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

[PLAYTEST.md](PLAYTEST.md) records the rule iterations. [reports/single-signal.json](reports/single-signal.json) compares the single signal with the previous three choices on 2,500 paired deals. Highest-wins play histories and scores were identical; signals still saved 3.25 cost versus no signals. That simpler variant remains available for experiments; the live interface restores all three types at the user's request.

Default play uses **highest-installs** and all three signal labels. Lowest-installs remains available with `{winner:'lowest'}`, and the one-label experiment with `{signalMode:'single'}`; pass these options to `createGame` or `simulateGame`. Card definitions and 50-card deck remain unchanged. No Phase 2 is implemented.

[chronology/2026-10-02.md](chronology/2026-10-02.md) and git preserve previous versions. Current screenshots use the `gameboy-` prefix in [screenshots/](screenshots/); older screenshots are historical checkpoints.
