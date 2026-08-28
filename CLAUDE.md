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
- **A field written in four places and read in none is a card that lies.**
  `st.court.size` was assigned by three articles and by the start editor, and
  consulted by nothing in 3 MB — every consumer counts `justices.length` — so
  the Article of the Constitutional Bench promised "four more justices" and
  seated nobody. Before writing a number into the state, grep for a reader; if
  there is none, the promise is decorative. This is `MAP.md`'s "a modifier
  nothing reads is a lie on the card" wearing a different hat, and S16f2 is at
  least the tenth time it has been found.
- **A guard goes on the LIVE function, and a reassignment is not a wrapper.**
  `pv5MinisterAction` is reassigned in the S11 chunk and that reassignment
  *replaces* four of its nine cases, so S17b's mode gate — placed on the base —
  was measured as absent while an opposition player briefed the government's
  ministers. Before gating anything, grep `var xBase = fn;` / `fn = function`:
  a wrapper that delegates carries the base's guard, a reassignment does not.
  And ask the question of ONE surface once — the v11 regional layer had its own
  `inPower` beside the new table, and two rules for one surface drift apart.
- **An assertion that compares two things, one of which is derived from the
  other, proves nothing.** S17e's mirror check compared `redLine` with
  `terms.redLines[0]` as seeded — but the list is *built from* the scalar, so
  it passed with the mirroring code deleted. It has to CHANGE the derived side
  and re-run the producer. Six tautologies of exactly this family were caught
  by poison-proofing in S17 alone; two more read a value only where a later
  write re-establishes it. Poison every assertion, and when two guards are
  belt and braces, poison them TOGETHER — removing either alone changes
  nothing, which reads as a dead guard and is not one. Two more shapes of the
  same mistake, both caught in S17f: **a count parameterised by the constant
  it is checking** agrees with any value that constant holds (the caretaker's
  three-session clock read `V17_CARETAKER_MAX` and passed at 99); and **a
  probe that drives far enough for something else to do the job** proves the
  something else (two sessions reached a ballot, and the ballot formed the
  government the clock was supposed to). And when what you are measuring is a
  RUNNING RECORD, **tally it once, not every session**: S17g's first lifespan
  probe summed a three-entry ledger across sixty sessions, read 527, and sent
  me hunting a runaway mechanism that was working correctly. And the sharpest
  form of all, from S17k: **an assertion that passes under both the old line
  and the new one is not testing the change.** The order gate went from
  "does the GOVERNMENT hold this department" to "does the ACTOR sit in it",
  and the probe — which put its party in the office — could not tell them
  apart. Reverting the widening left it green. When a gate is narrowed, the
  probe has to stand in the gap the narrowing closes.
- **A book whose cards are about something the model has no channel to is a
  book of decoration, however carefully each card is authored.** Every statute
  reaches the model through `eff`, `mood`, `rev`/`exp` and `auth`, which is
  enough for a health statute because a health statute is ABOUT the indicators.
  It is not enough for a book about the ballot or a book about the states:
  42 of those 48 cards named a mechanism nothing consulted. The Authority
  book's shape is the answer — ONE number every statute in the book reaches,
  so there is nowhere for a card to be decorative from — and the assertion
  drives every statute to its top rung and reads that number.
- **A probe that joins two readings into one string lets either half carry the
  other.** S17n's Primary Elections check compared
  `String(on) + '/' + String(refusal)`, so removing the first mechanism
  entirely still passed on the second. Compare component-wise, and when a
  statute has two halves, say so. Its neighbour is the same mistake in a
  different coat: **a test that a number ROSE is not a test that it moved the
  way the card says** — equalisation was checked by "the poor state rises",
  which a statute that simply added to every state would also pass.
- **A relation declared on one card and not the other is a one-way door.**
  S17m's conflict table is ONE central symmetric array rather than a
  `conflicts:` field on each card, for exactly that reason: with per-card
  declarations, symmetry is something a check has to go looking for, and this
  file's history says it will eventually not be there. Declare a pair once,
  index it both ways, and assert BOTH directions — a block that only works one
  way round passed the first version of the assertion.
- **A mode with one value is a field nothing reads.** Ruling 11 asks for BLOCK
  and SUPERSEDE; only BLOCK had approved pairs, so `supersede` is not in the
  code at all rather than shipped as an unused branch. An enum whose second
  value never occurs is the same decoration as `st.court.size`, and it rots the
  same way.
- **A field a wrapper READS is as dead as a field nothing reads, and looks
  exactly as alive.** S16e's memory wrapper keyed on `a.pid` and nothing in
  three megabytes ever wrote `a.pid`, so a whole channel — every hostile verb
  the player has against another party — had not fired once across two slices.
  Its whitelist also named `radicalise`, an id no action carries. The rule from
  `st.court.size` runs both ways: before keying on a field, grep for a WRITER,
  and when the answer is a hand-kept list of ids, cover the surface and assert
  the coverage instead — `V17_MEMORY` fails `roads.js` if a verb arrives
  without a weight, which is the guard a whitelist can never have.
- **A borrowed paper type reaches into whatever the original paper pointed at.**
  S16e's AI demand letter was posted as a `faction_demand` with `faction:0`, so
  answering another party's letter moved the loyalty of the PLAYER's own first
  caucus by sixteen. Reusing an inbox type inherits every branch that keys on
  it — the choices, the answer arm and the ignore arm — so a new kind of letter
  gets a new type, not a convenient old one.
- **A shared body that is right for the new caller can still be wrong for the
  old one.** `partyBillSupport` reads TWO fields for one idea —
  `playerPosition` at 24/-28 and `lines` at 16/-18 — so S17k's floor Core,
  writing both, made the player's declared line worth 40 where it had been
  worth 24 since S10b. Nothing failed; a button just got 67% stronger. When
  you extract a Core from a handler, grep every field it writes for a SECOND
  reader that the old caller was already feeding, and pin the old number in
  the assertion rather than reading it off the constant.
- **"The government holds it" and "this party holds it" are different
  questions, and `holdsDept` only answers the first.** It asks whether
  `st.exec[dept]` is anywhere in the coalition, so every partner in the room
  passes — which handed the whole order book to a party sitting in no office
  at all, for the player as much as for an engine. `officeMine` (S17a) is the
  player's side of it; a gate that decides who may *sign* has to ask about the
  actor by name.
- **`typeof x === 'string'` is not validation, and the UI is not the validation
  layer.** The custom start checked every id against a registry except its two
  chamber states, which took any string at all — and since an unknown string is
  neither `'abolished'` nor `'suspended'`, apply read it as a house that SITS.
  Anything a blob can carry is reachable without ever passing a control, so the
  cleaner holds the line, and it holds it against the same table the controls
  are drawn from. One list, offered and accepted.
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
- `tools/roads.js` — **181 content assertions**, the largest harness here: the
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
