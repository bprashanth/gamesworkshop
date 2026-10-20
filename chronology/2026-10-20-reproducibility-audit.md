# Landing reproducibility audit

- Built a candidate clean checkout from tracked working files plus room sources and room-client.js in /tmp/gamesworkshop-repro-audit. No ignored dependencies or Seagate inputs copied.
- Started its room server on isolated localhost port 8799. Browser loaded landing, sentences, Rover Risks, collaborative, Households Indicators, icons and audience with no page or HTTP errors.
- Passed five room tests, Household stage/handoff checks and sentence model tests.
- Current maps are tracked prepared JSON around 29 KB each. Raw terrain rebuild still depends on three hard-coded Seagate files totaling 98,618,037 bytes.
- Added narrative/LANDING_REPRODUCIBILITY.md and linked from root README. Documents commit scope, run/print/test commands, existing roster limitations and proposed external data bundle plus pinned toolchain.
- Narrow credential-signature scan found no matches; no full history secret audit claimed.
- No commit, push, external upload, PDF regeneration or live-server restart. Unrelated Moon and split-room sources left untouched.
