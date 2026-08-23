# Where are we, what's next

Update this file in the last commit of every PR.

## Current slice

**S2 — chain consolidation** (PR #4). Five dead bodies deleted after
poison-proof (132 lines); five more that a reference scan called dead were
proved to execute at boot and kept, with MAP.md corrected. Dead-body ratchet
10 → 5, which is now its true floor.

Previously: **S5 — token foundation** (PR #3, merged). Ministry Precise is in the game: the token
set retuned, seven faces embedded as data URIs, the Google Fonts link and its
preconnects gone, and the external-reference allowlist now **empty and
enforced** (invariant 4 achieved). Chrome is brass; the party's own colour is
reserved for party identity.

## Slice board

| Slice | Status | Notes |
|---|---|---|
| S0 agreement + tooling | **merged** (#1) | checks/, tools/, docs/, hook, skill, permissions |
| S1 correctness | **merged** (#2) | ratchets moved: strict 7/7, stale bindings 0, orphans 10 |
| S2 chain consolidation | **in review (PR #4)** | 5 orphans deleted with poison-proofs; 5 'orphans' proved live at boot and kept; ratchet 10→5 (its true floor). Marker/seam consolidation deferred to S6, where the restyle needs the seams |
| S3 seeded PRNG | pending | one engine, seed in save, loud save-break, exact-value harness tests |
| S4 look mockups | **done — Ministry Precise chosen** | two rounds (5 directions, then 3+3 runoff) at claude.ai/code/artifact/6f9de079-1c31-4c8c-a2f9-03f018069e57; tokens + type recorded in AGREEMENT.md; finalist screen set (Overview ×2, Drafting Desk, Election Night) on the canvas |
| S5 token foundation | **merged** (#3) | tokens retuned, 7 faces embedded (128 KB measured), no external references, allowlist empty; figures on the tabular mono face |
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
  Math.random frozen at 93 (changes in S3), size cap 1.6 MB (file now 1.41 MB
  with fonts embedded), external allowlist **empty and staying empty**.
- The user's decisions of record live in docs/AGREEMENT.md (interview verbatim).
