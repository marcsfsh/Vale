# Where are we, what's next

Update this file in the last commit of every PR.

## Current slice

**S1 — correctness** (PR #2). First edits to `vale.html`: the three stale
toolbar bindings now call through their identifiers; v6Sandbox restores in a
`finally`; strict mode in all 7 blocks; the save read parses per key (corrupt
`.v5` warns, falls through, stays untouched); failed autosave writes toast once.

## Slice board

| Slice | Status | Notes |
|---|---|---|
| S0 agreement + tooling | **merged** (#1) | checks/, tools/, docs/, hook, skill, permissions |
| S1 correctness | **in review (PR #2)** | all landed; ratchets moved: strict 7/7, stale bindings 0, orphans 10 (helpDialog v4 joined) |
| S2 chain consolidation | pending | function-by-function with poison-proof deletions; dead sites 10→0, markers shrink |
| S3 seeded PRNG | pending | one engine, seed in save, loud save-break, exact-value harness tests |
| S4 look mockups | **done — Ministry Precise chosen** | two rounds (5 directions, then 3+3 runoff) at claude.ai/code/artifact/6f9de079-1c31-4c8c-a2f9-03f018069e57; tokens + type recorded in AGREEMENT.md; finalist screen set (Overview ×2, Drafting Desk, Election Night) on the canvas |
| S5 token foundation | **unblocked — next up** | Ministry Precise tokens into vale.html; subset + embed Marcellus/Archivo Narrow/Public Sans/IBM Plex Mono (measure for real); Google link out; external allowlist → empty |
| S6+ refresh tab-by-tab | blocked on S5 | breakpoint consolidation to 3 tiers first; viz redesign |
| S7 onboarding | pending | setup trim + guided panels |
| S8 pacing honesty | pending | each length option a complete arc; balance changes go to the user first |

## Open items / environment facts

- **Artifact localStorage probe:** published (build B live) at
  https://claude.ai/code/artifact/096870e0-8c13-4ab7-a09c-2d7e1422d67d — the
  page renders its own verdict. Build B went live with S1: if the owner visited
  during build A, one more visit settles it — the box turns green (storage
  survived) or the ledger resets (it didn't). Until CONFIRMED,
  Artifact builds of the game are look-and-feel only — phone save-persistence
  unproven there.
- **WebKit in cloud sessions:** blocked by the environment's network policy
  (403 on cdn.playwright.dev and its mirror). The harness auto-uses WebKit
  wherever `npx playwright install webkit` works; adding those hosts to the
  environment allowlist would enable engine-true phone runs here. Substitute
  meanwhile: Chromium at the phone viewport (named SKIP in harness output).
- Checks baselines (`checks/baseline.json`): strict 7/7 and stale bindings 0
  (S1 targets reached and pinned), dead sites max 10 (0 by end of S2),
  Math.random frozen at 93 (changes in S3), size cap 1.6 MB (user may re-set),
  external allowlist = the two font hosts (empty after S5).
- The user's decisions of record live in docs/AGREEMENT.md (interview verbatim).
