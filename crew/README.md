# Crew

A local, black-and-white ASCII-style card table in the browser. One human, four bots, five tricks. No artwork, hidden-hand graphics, help screens or demo controls.

## Run

```sh
node crew/server.mjs
```

Open http://localhost:4173. The server listens on `0.0.0.0:4173`, so the same port works through the machine's LAN or Tailscale address. No install, build, API key or internet access is needed to play. Node.js 20+ is enough. Alternatively: `python3 -m http.server 4173 --bind 0.0.0.0 --directory crew`.

## Controls

- Click an empty installed slot marked `[Call]` to call that suit.
- Click a white card in your hand to play it. Black cards cannot be played on that turn.
- `[Signal lowest]`, then one white card, reveals your lowest card in that suit. One signal per game. There is no signal-type choice.
- `[Install ...]` advances after everyone has seen the trick.
- `[Reset]` starts a new deal. `[Same deal]` appears when finished.

The screen contains only installed parts and total, each player's played card or waiting slot, public signals, your hand, and these controls. Signals are crossed out once the revealed card has been played. The room facilitator explains the rules.

The highest card in the called suit installs. Its player becomes Commander. Follow suit if possible; otherwise discard any card. The goal is the lowest total for a complete five-suit ship. Equal ranks go to the first played, clockwise from Commander. A missing called suit ends incomplete with no score. Other players' hands remain private.

A signal means only **"this is my lowest card in this suit"**. A single card is also its suit's lowest, and equal lowest copies qualify. Cheap public coverage lets teammates shed more expensive cards before that suit is called.

Projection target: 1366x768 or larger. A narrow phone scrolls each row horizontally. Repeatable deal: `http://localhost:4173/?seed=1`.

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

[PLAYTEST.md](PLAYTEST.md) records the rule iterations. [reports/single-signal.json](reports/single-signal.json) compares the single signal with the previous three choices on 2,500 paired deals. Highest-wins play histories and scores were identical; signals still saved 3.25 cost versus no signals. This preserves the useful coordination while removing a choice from the interface.

The original lowest-installs and three-label rules remain available to experiments with `createGame(seed, {winner:'lowest', signalMode:'classic'})` or the same options to `simulateGame`. Default play is highest-installs with the single LOWEST signal. Card definitions and 50-card deck remain unchanged. No Phase 2 is implemented.

[chronology/2026-10-02.md](chronology/2026-10-02.md) and git preserve previous versions. Current screenshots use the `ascii-` prefix in [screenshots/](screenshots/); older screenshots are historical checkpoints.
