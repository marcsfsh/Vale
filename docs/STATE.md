# Where are we, what's next

Update this file in the last commit of every PR.

## Current slice

**S0 — working agreement + tooling** (this PR). `vale.html` untouched.

## Slice board

| Slice | Status | Notes |
|---|---|---|
| S0 agreement + tooling | **in review (PR #1)** | checks/, tools/, docs/, hook, skill, permissions |
| S1 correctness | next | rebind 3 toolbar buttons; sandbox restore→finally; strict×2; loud save read; surfaced setItem. Strict ratchet 5→7, stale bindings 3→0, orphan list 9→10 |
| S2 chain consolidation | pending | function-by-function with poison-proof deletions; dead sites 10→0, markers shrink |
| S3 seeded PRNG | pending | one engine, seed in save, loud save-break, exact-value harness tests |
| S4 look mockups | pending (parallel S1–S3) | ≥5 dark-first directions, phone+desktop key screens, type pairings with subset costs — user picks |
| S5 token foundation | blocked on S4 pick | tokens + embedded fonts, Google link out, external allowlist → empty |
| S6+ refresh tab-by-tab | blocked on S5 | breakpoint consolidation to 3 tiers first; viz redesign |
| S7 onboarding | pending | setup trim + guided panels |
| S8 pacing honesty | pending | each length option a complete arc; balance changes go to the user first |

## Open items / environment facts

- **Artifact localStorage probe:** published (build A) at
  https://claude.ai/code/artifact/096870e0-8c13-4ab7-a09c-2d7e1422d67d — the
  page renders its own verdict. Protocol: the owner opens it once now; build B
  gets republished at the start of S1; they open it again and the box turns
  green (storage survived) or the ledger resets (it didn't). Until CONFIRMED,
  Artifact builds of the game are look-and-feel only — phone save-persistence
  unproven there.
- **WebKit in cloud sessions:** blocked by the environment's network policy
  (403 on cdn.playwright.dev and its mirror). The harness auto-uses WebKit
  wherever `npx playwright install webkit` works; adding those hosts to the
  environment allowlist would enable engine-true phone runs here. Substitute
  meanwhile: Chromium at the phone viewport (named SKIP in harness output).
- Checks baselines (`checks/baseline.json`): strict 5/7 (target 7 in S1),
  stale bindings max 3 (0 in S1), dead sites max 10 (0 by end of S2),
  Math.random frozen at 93 (changes in S3), size cap 1.6 MB (user may re-set),
  external allowlist = the two font hosts (empty after S5).
- The user's decisions of record live in docs/AGREEMENT.md (interview verbatim).
