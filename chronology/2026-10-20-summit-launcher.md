# Summit entry point

- Root README now contains only the Summit event, its launch command and guide links.
- GAME_INDEX.md holds Sentences, Rover and Households gameplay, the optional spoken replacement of an -ing word, stages, phone behavior and sheet limitations.
- Rebuild audit moved from narrative/LANDING_REPRODUCIBILITY.md to docs/REBUILD.md, with launcher usage added.
- ./run-summit.sh runs the single required room server in the foreground via scripts/run_summit.py. It prints detected Wi-Fi, LAN and Tailscale host/audience links after readiness.
- Restart replaces only this checkout's room server on the chosen port. Other applications cause a clear bind failure. Ctrl+C and termination stop and reap the child. Existing 8684/8690 servers remain separate.
- Tested on isolated port 8798: invocation from another working directory, startup, Wi-Fi/Tailscale links, replacing a running launcher, Ctrl+C releasing the port and preserving an unrelated listener. Live 8688 was not restarted.
