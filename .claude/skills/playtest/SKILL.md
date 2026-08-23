---
name: playtest
description: The verification-bar procedure for any change to vale.html — static checks, the headless scripted turn at three viewports, save-restore assertions, screenshots, and when/how to publish a phone-testable Artifact build. Use before declaring any vale.html change done, when preparing a PR's evidence section, or when asked to verify or playtest the game.
---

# Verifying a change to vale.html

The bar (docs/AGREEMENT.md §E): nothing is "done" without all of this, and a
SKIP is reported as a SKIP with its substitute — never silently, never as a PASS.

## 1. Static checks

```
node checks/run.js
```

Paste the full output into the PR. If a ratchet fails because your change is
*supposed* to move it (e.g. S1 removes stale bindings), move the baseline in
`checks/baseline.json` / the adjudication files **in the same commit**, with the
reason in the PR body. Never move a baseline to make an unrelated failure quiet.

## 2. Headless playtest

```
node tools/playtest.js          # full: scripted turn, reload/resume, 3 viewports
node tools/playtest.js --quick  # boot-only smoke test while iterating
```

What the full run covers: boot to setup sheet → new game (setup + doctrine) →
draft a bill via the policy card and `[data-draft="clean"]` → end the session
via the **keyboard** path (`e`, then `[data-end-confirm]`) → drain the event
queue (`[data-ev]` choices) → assert the turn advanced → assert
`parliamentVale.autosave.v5` written → reload → resume via `[data-resume]` →
assert the turn survived → screenshots at 1500×950, 834×1150, 390×844 →
console-error and pageerror **counts** (a number, not "looks fine").

Notes the harness already encodes — keep them true if you edit it:
- `confirm()` is stubbed before load (the hall-of-fame clear calls it).
- While the fonts allowlist exists, offline font-load failures are counted
  separately, not as errors; that exemption dies when the allowlist empties.
- WebKit is the phone reference engine (owner plays iPhone). The harness tries
  it and SKIPs with Chromium as the named substitute where the download is
  blocked (it is, in this cloud environment's network policy).

Evidence lands in `tools/out/` (gitignored): screenshots + playtest-log.txt.
Attach screenshots to the PR for any visual change.

## 3. Layout changes: all three tiers

Phone ≤760, tablet 761–1179, desktop ≥1180. For a layout-touching change, take
and attach screenshots in all three, and check the 761–880 sub-band (collapsed
sidebar, no mobile behaviors — the historically neglected range).

## 4. Save-shape changes

Demonstrate the loud break: load a pre-change blob (fixtures under
`tools/fixtures/` once S1 creates them), show the clear message, and show the
stored blob untouched afterwards. Every save fixture must still load (or
loudly refuse) after any state change.

## 5. Phone verification (when it matters)

For changes the owner should feel on the phone: publish the current vale.html
as a **private Artifact** and give them the link. Gate: the localStorage
persistence probe verdict in docs/STATE.md — until it is CONFIRMED, say in the
same breath that saves in the Artifact context are unproven and the build is
for look-and-feel only.

## 6. The PR evidence section

hypothesis → the command that proves it → the check that would have caught it →
the fix; pasted check output; screenshots; a "not verified" list naming what
you did not cover and why.
