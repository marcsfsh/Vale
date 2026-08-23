# Save fixtures

Blobs used by the verification bar: every fixture must still load — or loudly
refuse — after any state-shape change (docs/AGREEMENT.md §E.5).

## Contents

- `synthetic-turn2.v5.json` — **synthetic**: captured by `tools/playtest.js`
  from its own scripted game (2 turns, Labor Party, normal difficulty, the
  harness's fixed click-path). It is regenerated on every full harness run, so
  it always reflects the current save shape. It is *not* a real player's
  campaign and exercises none of the deep namespaces (wars, works, cases…).

## Capturing real blobs (owner)

A real campaign exercises far more of the state than the synthetic one. To
donate one from your browser:

1. In a running game: **Save / load → Copy the government file**, and paste it
   into a new file here as `real-<description>.v5.json`; or
2. From devtools console: `copy(localStorage.getItem('parliamentVale.autosave.v5'))`
   and paste the same way.

Name the generation in the filename (`.v5`/`.v4`), and note roughly how far the
campaign had progressed. Real fixtures are never regenerated — they are the
regression corpus the synthetic one can't be.
