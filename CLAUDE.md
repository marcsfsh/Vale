# Parliament: Vale

One product: `vale.html` — a complete turn-based government simulator in a single
self-contained file. Everything else in this repo is tooling or documentation.

IMPORTANT: never read `vale.html` whole — it is **3.0 MB** and would consume an
entire context window. Use `grep -n`, Read windows of ≤80 lines, and the Explore
agent for open-ended sweeps. `docs/MAP.md` holds the structural map; read it
before touching the file.

## Invariants (full policy: docs/AGREEMENT.md)

- `vale.html` is the whole app: no build step, no package.json anywhere, no
  runtime dependency, no `<script src>`; it must open from `file://`.
- **Zero external references.** The allowlist in `checks/baseline.json` is empty
  and stays empty — the fonts are embedded as data URIs (`tools/fonts.sh`
  regenerates them; never hand-edit the `@font-face` block). Never add one.
- Saves may break pre-release, but only loudly: a blob that can't load gets a
  clear message and is left untouched in localStorage. Silent corruption or
  silent discard of a save is the worst possible failure here.
- Three layout tiers, all first-class: phone ≤760 (reference: iPhone on
  Firefox = WebKit engine), tablet 761–1179, desktop ≥1180 (focus: 1500px
  Chromium). Improving one tier at another's cost is a regression.
- **Five width thresholds exist and no more**: 420, 760/761, 1179/1180. A sixth
  fails `breakpoint-tiers`. Needing a boundary at 900 almost always means the
  rule belongs to a tier that already has one.
- The party palette is the game's identity and is the user's to rule. Two
  colours were lifted along their own hue in S6b; propose any further change
  with `node tools/seats.js` output, never unilaterally.

## The rules this file's history punishes

- Never rebind a top-level function name without capturing the previous body
  (`var vXFooBase = foo;` first) **and calling it**: since S14 the check derives
  capture from the code, an alias nothing reads counts as an orphan exactly like
  no alias at all, and an orphan with no `deliberate` adjudication fails
  outright. Every reassignment site must be adjudicated in
  `checks/dead-bodies.json` or checks fail; `node checks/run.js --sites` lists
  all 194 with their aliases and read counts.
- Never pass a reassignable function identifier by value at top level
  (`addEventListener('click', foo)` at column 0) — it freezes the body at that
  vintage. The ratchet is at 0; do not add the first.
- **All randomness goes through `rand()`**, whose state rides the save. Never
  call the unseeded source, and never name a local `seed` inside `newGame` —
  `var` hoists to the top of the function and one already shadowed the campaign
  seed, so the state literal was built with `seed: undefined`.
- **A countdown that resolves in a tick asks about `st.turn + 1`.** `endTurn`
  runs every tick and only *then* does `S.turn += 1`, so inside one `st.turn` is
  the session the click is **leaving**, not the one it is producing. Four of the
  six session clocks were counted against `st.turn` and each charged one End
  Session click more than its card printed — the amendment clock said two and
  took three. `roads.js` holds all six.
- **A per-power list is built at the END of the file, never where the `ACTIONS`
  literal is evaluated.** `POWERS.push` runs in the S10e chunk, so a list built
  in the literal freezes the six powers that existed at that moment. Nine
  diplomacy lists have been rebuilt for exactly this reason across S15j and S16c.
- **A read must not create.** `v6TreatyRows` installed an empty array for any
  power it was asked about, and one panel asks about all eleven every render, so
  `Object.keys(st.v6.treaties).length >= 3` — the Peacemaker record's test —
  became "eleven powers exist" and the record was awarded on every seed with
  nothing signed. Reads go through the reading accessor, writes through the
  writing one, and a record's test counts the things it names.
- **Never set `fill` on a bare `text` selector in a chart's stylesheet.** A CSS
  fill beats an SVG presentation attribute and silently greys out every label
  the chart colours by attribute.
- Never key CSS to a colour literal (`circle[fill="#0000BC"]`). A palette
  retune then unstyles the thing it was propping up, silently.

Also: CSS chunks conflict by source order (last wins, equal specificity) — new
rules go at the end or under a body-class scope; later chunks splice rendered
HTML by marker strings and query DOM sentinels, so renaming a class, heading or
slot attribute can silently disable a feature. `marker-integrity` asks, of the
markers written as a literal at the call site, whether an **emitter** of that
string exists outside the splice; it says plainly which markers it cannot ask
that of (12 generic structural strings) and it cannot see a marker built in a
variable at all. Those, and the DOM slots, are guarded by playtest steps —
`splices-land` for the three whose failure is silent.

## Commands

Run `node checks/run.js` before every commit. Run the harness that covers what
you touched; a SKIP is never a PASS.

- `checks/run.js` — 11 static checks, <5s.
- `tools/playtest.js` — scripted turn, reload/resume, corrupt-save behaviour,
  all 15 views, 3 viewport screenshots (`--quick` for boot-only).
- `tools/roads.js` — **160 content assertions**, the largest harness here: the
  descent, the constitution, the ministry, the interests, the regional term, the
  capital floor, what a bill does when the chamber it was laid before no longer
  exists, that every one of the 582 statutes carries four distinct rungs, that
  every clock printing a session count charges exactly that many End Session
  clicks, and that no number went bad on any of it. Run it after any content
  change.
- `tools/determinism.js` — seven properties of the seeded dice. Drive the model,
  not the modal queue: which queued sheets a UI run pumps depends on click
  timing, so a UI-level comparison measures the harness, not the game.
- `tools/chamber.js` — seat-map geometry, overlaps, label collisions, rendered
  size per tier. `tools/seats.js` — palette contrast, ΔE, colour-vision sim.
- `tools/tiers.js` / `tools/tabs.js` — layout at each tier boundary.
- `tools/pacing.js` — plays a length option to its end and reports the arc.
- `tools/poison.js` — proves a body is dead before you delete it.
- `tools/rungs.js` — the authored prose: `--brief` a book, `--apply` a shard
  (idempotent), `--check` the 582 statute ladders against the house style, and
  `--corpora` the five authored registries — 60 measures, 90 orders, 80
  articles, 20 treaties, 55 dispatch lines, 724 pieces — which fails on a breach
  and then reports the punctuation residue in the rest of the file without
  failing on it.
- `tools/prose/` — the blind measurement rig: `sweep.js` emits every ladder for
  an unaided reader, `sweepscore.js` scores it. Its README carries the one rule
  these tools exist to enforce: **never re-measure the sample you repaired
  against.**

The prose standard is `docs/PROSE-STYLE.md`: the owner's writing skill carried
verbatim, plus a statute addendum. All 2,910 authored pieces are written to it.
`docs/PROSE-RESIDUE.md` names the ladders that two blind readers still fail.

Playwright resolves from the global install (`npm root -g` + `createRequire`);
bare `require('playwright')` fails from this repo. WebKit downloads are blocked
by this environment's network policy — the Chromium phone viewport is the named
substitute, and it is reported as a SKIP.

## Working state

`docs/STATE.md` says which slice is current and what's next — update it in the
last commit of every PR. Workflow: one PR per complete slice, branch
`claude/<slice-name>`; commit before risky edits (git is the undo — /rewind
does not capture Bash or subagent edits).
