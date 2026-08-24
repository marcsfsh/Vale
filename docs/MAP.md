# vale.html — structural map

Measured 2026-08-23 (session zero, Phase 0). Line numbers are **advisory** — they
rot as the file changes; anchors are function names. Update this file in any PR
that changes structure. Consolidation PRs shrink it; that is the goal.

## The shape

A v4 base plus seven appended `<style>`+`<script>` chunk pairs, each
monkey-patching the last through shared top-level globals. All scripts inline,
synchronous, no defer/async, no DOM-ready handlers. (Line numbers in this
table rot with every slice — trust the chunk ORDER and grep for boundaries.)

| Chunk | style | script | strict? | ensure fn | alias prefix |
|---|---|---|---|---|---|
| v4 base | 15–334 | 370–8186 | yes | enrichState (~3602) | — |
| v5 "Statecraft" | 8187–8266 | 8267–8880 | yes | pv5EnsureState (~8352) | `pv5*V4` |
| v6 "The Long Republic" | 8881–9079 | 9080–11241 | yes | v6EnsureState (~9283) | `v6*V5`/`v6*Base` |
| mobile layer | 11242–11465 | 11466–11587 | yes (S1) | — | `v6m*Base` |
| "The Clean Desk" (v7) | 11588–11734 | 11735–12172 | yes (S1) | — | `v7*Base` |
| v8 "The Living Republic" | 12173–12306 | 12307–13868 | yes | v8EnsureState (~12343) | `v8*Base` |
| v9 "The Deep State" | 13869–13903 | 13904–15714 | yes | v9EnsureState (~13923) | `v9*Base` |
| v10 "The Descent" (S9d) | end | end | yes | — (deliberate: no ensure, never wraps enrichState, so the S3 dice guard stays outermost; all v10 state is created-on-write with fallback reads) | `v10*Base` |

Static DOM shell (body 336–368): `#app` (`.topbar` with `#stats`, `nav#tabs`,
`main#view`), `.turnbar` (`#btnBrief #btnMenu #btnHelp #btnUndo #btnSave
#btnEnd`), `#modal`>`#sheet` (one sheet — modals replace, never stack), `#toast`.
Everything else is innerHTML-rendered into those ids.

## Patch idioms (how a chunk changes what came before)

1. **Alias-capture wrapper** (the norm): `var v8TickBase = tickTurn; tickTurn =
   function(){ …v8TickBase(st)… }`. v8 and v9 are wrapper-pure.
2. **Full rewrite, no alias** (v5–v7 only): orphans the previous body — see the
   ratchet below.
3. **HTML-string splicing**: v5/v6 raw `indexOf`/`replace` on literal markers;
   v7 regenerates earlier panels and uses the output as removal markers
   (`html.replace(pv5ObjectivesPanel(), '')` ~11806 — works only because panels
   are pure; NOT statically checkable, covered by the playtest harness); v8 has
   the reusable `v8Insert(html, marker, extra, fallbackPrepend)` (~13475) with
   graceful fallback; v9 splices on attribute strings/`lastIndexOf` and
   replace-ranges (viewJudicial swaps v4's whole Roll panel).
4. **DOM sentinels**: `var cards = sh.querySelector('.cards'); if (!cards)
   return;` — renaming a class silently disables the feature.
5. **CSS**: equal specificity, source order wins; v7/v8 scope with body classes
   (`body.clean`, `body.ironman`, `body.v8`, `body.v9`); one `!important` total.
6. Each chunk ends with a boot IIFE: `S = enrichState(S,false); render();`
   (v8/v9 also re-open the setup sheet if a stale generation is showing).
7. The v4 base was retro-edited with forward hooks: `typeof v6Snapshot` (~6539),
   `V6_KEYMAP` fallback (~8029), `#btnMenu` in the static HTML.

## Dead code, and the bodies that only look dead — corrected in S2

A reference scan is **not** proof a body is dead. S2 poisoned each candidate
(`throw` as its first statement, then the full playtest — `tools/poison.js`)
and half the list turned out to be live: those bodies execute once at their own
chunk's boot, before the next chunk replaces them.

**Deleted in S2** (poison-proved unreachable across boot, a full turn, all 15
views, three sheets, reload/resume and the corrupt-save path — 132 lines):

| body | had been killed by |
|---|---|
| v4 `runQueue` | v6 rewrite |
| v4 `startScreen` | v6 rewrite |
| v5 `pv5CommandPalette` | `pv5CommandPalette = v6Menu` |
| v4 `helpDialog` | v6 rewrite (reachable until S1 rebound `#btnHelp`) |
| v6 `v6Menu` | `v6Menu = v7Menu` |

Deleting a `function x(){}` strands every later bare `x = …` under strict mode,
so in each case the **first surviving assignment became the declaration**
(`var runQueue = function …`), later wrappers untouched. The dead-to-dead line
`pv5CommandPalette = v6Menu;` went with its operands.

**Live, despite replacing a body without an alias** (5 sites, the ratchet's
floor — `checks/dead-bodies.json` carries the proof for each):

| site | why it is not dead |
|---|---|
| v5 `render` rewrite | the v4 body runs at v4's boot `render()` |
| v6 `render` rewrite | the v5 body runs at v5's boot |
| v6 `renderStats` rewrite | v4 `render` calls the v4 body at boot |
| v7 `v6mCenterTab` rewrite | the mobile body runs at the mobile chunk's boot |
| v7 `v6mPolicyFolds` rewrite | same |

Two traps found the hard way, both worth remembering:

- **Poisoning several bodies at once masks reachability.** A throw aborts the
  rest of the block it is in, so a later call in that same block never happens
  and its body looks unreachable. `v6mPolicyFolds` throwing hid
  `v6mCenterTab`; poisoning `render` hid `renderStats`. Poison in small sets
  and re-test survivors alone.
- **Ordinal keys (`name#2`) shift when a site is deleted.** Verdicts must be
  re-derived after any deletion, never carried across — carrying them once
  mislabelled two wrapper sites that do capture aliases.

## Stale value bindings — fixed in S1, ratchet at 0

The three v4 toolbar bindings (`#btnEnd`/`#btnHelp`/`#btnUndo`, ~8016–8021) now
call through their identifiers, so button and keyboard run the same live chains
(close-checklist and 8-deep undo included). The stale-binding check keeps the
count at 0 — never bind a reassignable function name by value at top level.

Benign at grep level (never reassigned, not proven exhaustively): `#btnSave` →
`saveDialog`; document scroll → `v6HidePop`. Call-time value bindings (e.g.
showSheet's `[data-close]` → `hideSheet` ~8046) re-evaluate per call and pick up
the live chain — fine, but know they re-bind per sheet.

## State and saves

- `var S` (~3521); `newGame(diff)` (~3524) → `enrichState(st, true)`; the real
  new-game entry is `v6NewGame` (~9260). `UI` (~3522) is transient — `UI.tab`
  is not saved, so resume always opens on the Overview.
- One enrich chain, innermost-out **v4→v5→v6→v8→v9** (no v7), all idempotent.
  Namespaces: v5 adds flat fields + `uiPrefs`; v6 `st.v6`; v8 `st.v8`; v9
  `st.v9`. `st.enrichVersion` is written 5×, read 0× — no migration gate.
- **Core v4 literal fields are never backfilled** (`ind`, `pol`, `blocs`,
  `court`, `seats`…): a loadable blob must already be a full v4 shape; the
  import check is only `obj.ind && obj.pol` (~8106). Hazard: `st.powers` is
  re-seeded only in `newGame`; `shiftRel` (~2586) writes it unguarded.
- Keys: `parliamentVale.autosave.v5` (written; a failed write toasts once and
  the flag resets on success — S1), `.v4` and `parliamentVale.autosave`
  (legacy reads; since S1 each key parses independently, so a corrupt `.v5`
  falls through to older intact saves, is left untouched, and surfaces as
  `UI.saveReadError` → a warning line on the setup sheet), `parliamentVale.hall`
  (~13062–13063, cap 40).
- **The live autosave** is v6 render's debounce (~11093): `setTimeout(
  saveAutosave, 160)` after every render. The v4/v5 render debounces are dead.
  Game end does NOT clear the autosave; nothing guards resuming a finished
  game (the resumed corpse is inert: End disabled, captureUndo blocked).

## Turn loop (live chains; identifier calls get the last assignment)

`e` key → confirmEndTurn v8(~13747)→v7(~11941 quickEnd)→v4(~4407) → sheet
`[data-end-confirm]` → `endTurn()` late-bound = v8(~12420)→v4(~6536):
`v8EndOfSession` → `tickTurn` (v9→v8→v6→v4, v5's `sessionSystemsTick` inside)
→ `advanceBills` (v6) → `aiGovern` (v5) → `politicsTick` → `agendaEvent` →
`courtReview` (v9→v6→v4) → `pickEvents` (v8) → `v6ExtraEvents` (v9) →
`S.turn += 1` → `runQueue` (v6 modal queue, `[data-ev]` choices, `UI.busy`) →
done: `checkCollapse` | `runElection` (v8→v6→v5→v4) | the closing branch →
`v6AfterTurn` (v8→v6, queues gazette via `v6Later`/`v6Pump`, pumped by v6's
hideSheet wrapper) → `render` (v9→v8→v7→mobile→v6 full redraw; v6's body is a
full rewrite that redraws `#stats`+`#tabs`+active view via innerHTML, then
`wire()` re-binds).

The **closing branch** (`S.turn > lastTurn()`) calls `v6BankSession(S)` — the
shared bank-the-dying-session helper defined beside `endTurn` — then
`finish()`→`gameOver` (v8 hall→v6 grades→v4 sets `S.over`), and returns.
`checkCollapse`'s two `gameOver` sites call the same helper first (S9a): EVERY
ending banks before the hall latches, not only the natural close. Order is load-bearing in both directions: the tick must come first,
because `gameOver` reads `S.v6.achievements` synchronously (~11556) and
`v8HallRecord` (~13505) *persists* the count to localStorage — a tick after
`finish()` would show and permanently store a stale number; and it must be this
branch's own call, because the shared `v6AfterTurn` on the line below is
unreachable past the `return`. Until S8c the branch was one line
(`{ finish(); return; }`) and nothing earned on the closing session was ever
banked, at any length. The Gazette is suppressed for that one call
(`S.uiPrefs.report` saved and restored) so `v6Later` cannot race the end card.

Undo: `captureUndo` (v8 ~12405, stack max 8, ironman disables) at the start of
player actions; cleared every turn.

## Navigation (S9c, "the Atlas")

Fifteen tab ids, frozen forever (fold keys `{tabId}|{h2}` ride the save; 55
`jump:`/`data-jump`/`data-v8jump` literals; `v8Badges` keys). Grouping lives in
ONE array — v7's `V7_GROUPS` — six groups with g-prefixed ids so a group id can
never collide with a tab id again (the old `government` group contained the
`government` tab, and the old `parliament` group id silently broke
tools/chamber.js): gDesk[chamber,record], gLaw[policy,houses,ledger],
gGov[exec,government], gConst[state,judicial],
gPolitics[parties,interests,campaign], gCountry[nation,federation,world]. Tab
`government` is LABELLED "Ministry" (id unchanged). Group buttons carry
`data-group` ONLY; page buttons carry `data-tab`; the v4 click delegate handles
both. Keyboard: `v7KeyNav` — digits 1-6 pick a group, pressing again cycles its
pages; the map, the field guide's key table and the council menu all derive
from `V7_GROUPS`, so a grouping change updates them for free. `V6_KEYMAP` is
gone. Panel canon (S9c): logPanel renders on chamber+record only, the full
inbox on parties (chamber keeps a 3-item preview), the manifesto on
chamber+campaign, movements+Society deck on nation, the Chronicle on record,
the States deck on federation, the Ministry deck on the Ministry page.
Relocating a panel means adding its old`{tab}|{h2}` key to `V7_FOLD_REMAP` —
saved fold prefs follow their panels. tools/tabs.js asserts the strip;
playtest's nav-tree/nav-reach/nav-keys assert the invariants.

## Scroll ownership (S9b)

The window is the scroll container at every tier — `#view` has no CSS rule of
its own and nothing overflows vertically inside it. v7's render wrapper is the
SINGLE owner of programmatic vertical scroll: it saves the outgoing tab's
position on a tab change, restores the incoming tab's (or clamps to the nav),
and on a same-tab render restores the exact scrollY around the innerHTML
rewrite. Do not add `window.scrollTo` after `render()` anywhere — that
reintroduces the double-motion S9b removed (seven sites had it). The two
exceptions that remain by design: `v7Jump`'s scrollIntoView (jump-to-a-thing)
and the phone tab-change topbar clamp in the mobile wrapper. `flash()` must
never call `render()` — 74 call sites would each schedule an unprompted full
rewrite 1.6s after the click; it restores `#turnHint`'s text only.

## Layout

- Tiers as ruled: phone ≤760 (the JS gate is `V6M.mq =
  matchMedia('(max-width:760px)')` — the single "is mobile" switch), tablet
  761–1179, desktop ≥1180.
- **Since S6a there are exactly five width thresholds, and every one of them is
  a tier edge**: 420 (the sanctioned small-phone refinement), 760/761, and
  1179/1180. Adding a sixth is the thing this slice existed to prevent — if a
  layout needs a boundary at 900, the answer is almost always that it belongs to
  a tier that already has one. Nineteen width queries remain, all on those five
  numbers; the audit that got them there is in the S6a PR.
- Tier shapes. Desktop widens the shell (`--app-max:1440px`, `--rail:340px`)
  and is the only tier with a two-column `.grid`. Tablet takes the full width
  for the main column and re-lays the rail as a two-up row beneath it; it wraps
  the tab strip rather than scrolling it (measured: a 1180 threshold left 4–9 of
  the 15 classic tabs off-screen across the band), keeps two turn-bar chips and
  drops the hint. Phone is owned outright by the `max-width:760px` layer.
- Two rules are keyed to something other than width and must stay that way:
  the landscape/short-window turn bar (`max-width:1179px and max-height:460px`
  — height is what it is actually about; a landscape phone is up to 932px wide,
  which is why its old 900px ceiling missed the largest phones), and the touch
  layer (`hover:none and pointer:coarse`).
- Mobile layer: scroll-lock preserving position (v6mLock/Unlock), `.tscroll`
  table wrapping, policy folds, `--turnbar-h` via ResizeObserver, safe-area
  vars. v7: grouped two-row nav (`uiPrefs.layout==='classic'` opts out), per-tab
  scroll restore (`UI.scrollPos`), `body.clean` hides #btnBrief/#btnHelp/#btnSave
  on phones. Charts: all inline SVG strings (hemiMap, benchMap, poll/history
  polylines); v8's region map is a div grid.

## The setup sheet (S7)

Two questions are the game — which party, and how the republic stands — and both
are numbered and carry a line saying what they decide. Length, difficulty and
the house rules all have defaults worth keeping and are what a returning player
comes back to adjust, so they fold into one `<details class="setup-more">` whose
summary names the current settings: trimmed, not hidden.

- **`[data-setup-advanced]` is a cross-chunk seam.** The setup sheet is built by
  one chunk and the house rules are spliced in by a later one, which targets
  that slot so the rules fold away beside the two settings they belong with. It
  falls back to `.setup-summary` if the slot ever disappears, and the playtest's
  `setup-trimmed` step guards it — rename the slot and the rules silently
  reappear outside the fold, un-trimming the sheet with nothing else failing.
- The disclosure's open state lives on `UI.setup.more`, like the seed on
  `UI.setup.seed`: `redraw()` rebuilds the whole sheet on every setup choice, so
  anything not kept there snaps shut under the reader.
- A four-step progress strip used to sit above the questions with every step
  marked done at all times. It is gone; it told the reader nothing.

## The charts (S6c)

Both line charts — the polling trend and the long record — go through one
`lineChart(o)` helper, so the vocabulary is defined once: a faint grid, round
joints, and every series ending in a dot, its **name in the series' own colour**
and its current value beside that in neutral ink — the hue identifies the line,
the figure stays legible. The last number is the one the reader came for; putting it on the
chart is what retires the hunt back to a legend.

- `spreadLabels(items, gap, lo, hi)` pushes labels that want the same height
  apart and keeps them in the box. Seven parties polling within a few points all
  want the same pixel. Where a label has been moved off its line, a hairline
  leader ties it back — without that a crowded chart hands over seven numbers
  and makes the reader guess which line each belongs to.
- **Never set `fill` on a bare `text` rule in a chart's stylesheet.** A CSS fill
  beats an SVG presentation attribute, so `.poll-chart text{fill:…}` silently
  greyed out every label the chart was colouring by attribute. Axis furniture
  takes its fill from `.ax`; series labels keep theirs from the attribute.
- The label halo is `stroke-width:1.4`. At 2.6 it ate most of a 10.5px glyph and
  washed the darker party colours out to grey.
- `v7ChartsToEnd()` opens a sideways-scrolling chart on the **present** rather
  than the oldest session, once per chart, then remembers where the reader left
  it (`UI.chartScroll`) — render runs on every action and would otherwise yank a
  chart someone had scrolled back through. It also runs when a fold opens: a
  chart inside a collapsed panel has no width to measure.

## The dice (S3)

**The enrich chain's guard must stay outermost.** Each chunk wraps
`enrichState`, so a guard on the v4 base leaves every later chunk's backfill
outside it. The guard therefore lives at the very end of the last chunk
(`v9EnrichGuarded`), and any future wrapper must be installed ABOVE it. What it
prevents: the ensure functions invent a missing governor or minister with rolls,
and `enrichState` is called on states that are NOT the live game —
`readAutosave` enriches a stored blob to decide whether to offer it, and
`undoLast` enriches a snapshot before assigning it. Unguarded, opening the save
dialog mid-campaign spent the live campaign's dice on a throwaway object and the
seed stopped reproducing the campaign. `tools/determinism.js` asserts it.


Every roll in the game comes from `rand()`, a mulberry32 whose one word of
state lives **on the state object**, not in a closure. That placement does three
jobs at once and should not be changed casually: the stream serialises with the
save, undo rewinds it along with everything else (undo restores a snapshot of
S), and `v6Sandbox` forecasts roll a clone's dice rather than the campaign's,
because the sandbox already swaps S. The sandbox still swaps the unseeded source
too, as isolation for any stray call the file grows later.

- `RNG_ON` / `rollFor(st, fn)` redirect rolls to a state that is **not** S yet.
  `newGame` and `v6NewGame` both need it: they roll the founding figures,
  factions and opening news before the object is assigned to S, and without the
  redirect those rolls came off whatever campaign happened to be loaded — two
  games from one seed got the same dice and different party leaders.
- A player can type a seed at setup (`SEED_OVERRIDE`, consumed by the next
  `newGame`) and read it back in the save dialog. It must be applied *before*
  the opening state is generated; pinning `S.seed` afterwards reproduces
  everything except the republic you started with.
- A save with no seed is given one and the player is told once
  (`UI.seedMinted`, transient). Per the ruling, breaks are loud, not silent.
- **Never name a local `seed` inside `newGame`.** One already did, and because
  `var` hoists to the top of the function it shadowed the campaign seed for the
  whole body: the state literal was built with `seed: undefined`.
- `node tools/determinism.js` is the proof — seven properties, including that a
  *different* seed diverges, which a constant-returning engine would otherwise
  pass. Drive it through the model (`v6Sandbox` + `tickTurn`), not the modal
  queue: which queued sheets a UI run pumps depends on click interleaving, so a
  UI-level comparison measures the harness, not the game.

## The descent engine (S9d)

The machinery that makes leaving the republic a real system rather than nine
inert latches. All of it drives through EXISTING registries and functions —
the owner's "integrate, don't bolt on".

- **`securityState(st)`** (v4, beside `unrestTarget`): derived, never stored —
  Σ level×`polAuth`×2 over Authority+Security statutes, +12 stateOfSiege, +6
  purgeService, +6 ironHand, +8 elections-off; clamp 0-100. Thresholds 30/45/65
  ("surveillance state in outline" / "police state" / "the total state",
  `securityLabel`). A fresh default opening measures 0 (roads.js asserts it) —
  a player who never legislates the apparatus feels nothing. Consumers:
  unrestTarget (suppression, diminishing past 45), indicatorTargets (liberties
  −.18/pt, safety +, corruption past 45), movementsTick (fear breaks
  organising; the Front grows past 45, on authority-path forms, and +1.5/turn
  per rigging notch), extraReview hold, policyCost (Authority book cheapens up
  to 30%), extraTierAllowed, the Constitution page's strip (v10 wrapper).
  `st.ssPeak` high-water rides the save (created-on-write, v10 tickTurn wrap).
- **The measures gate** (`extraTierAllowed`): party OR state — tier 1 opens at
  ss≥30, authority-path, or elections off; tier 2 by terminal form or
  precedents≥2 + (ss≥50 or elections off); `acts.conventionLimits` bars tier 2.
- **The nine latch acts now read**: stateOfSiege → unrest −10/turn, liberties
  −6, a budget expense; purgeService → deptFactor ×.92 + corruption; lifeTerms
  → +1 ritual court seat; charteredSenate → 20% Senate reservation for
  `bestBusinessParty` INSIDE runElection (totals preserved — chamber.js
  asserts); agencyCapture → corruption/environment/economy targets;
  wealthFranchise → `BLOC_WEALTH` weighting in supportTargets (the franchise
  genuinely weighted); annexation → territories/tension/revenue; territorial-
  Seats → floor(60×territories/100) Assembly seats to the government post-
  allocation; consulate → offices pinned to the ruling party after every
  election, +1 capital.
- **needs: on all three enactment paths**: changePolicy (was already there),
  orderPolicy ("an order cannot outrun its own statute book"), and enactment
  time — a bill whose prerequisite fell while it was before the houses LAPSES
  loudly at assent (referendums enact through enactBill, so they inherit it).
- **`policyOpen`** gains `forms:[…]` multi-form locks and per-policy `req(st)`;
  **`policyWhy(st,p)`** gives every disabled flash its reason — a `req:` policy
  MUST ship `reqText`.
- **`eventOpen(st,e)`** — pickEvents' filter, extracted verbatim so
  tools/roads.js can assert reachability with the REAL predicate.
- **The confirmation ritual**: regimeCycle keeps its court mechanics and sets
  `S.pendingRitual`; endTurn's pending door (beside pendingRuling/pendingExtra)
  opens `v10RitualEvent(S)` next session — turnout theatre, a rigging dial
  (`S.rigging`, `S.rigCount`), an honest-count gamble, and at ss≥45 the
  turnout-as-weapon choice. `v10reckoning` (elective, once) surfaces the
  archive when elections return: +4 unrest per staged count or a denial that
  keeps the ledger open. Rigging is a loan against the restoration.
- **terminal is real**: toFederal from a terminal form requires
  `S.v6.flags.restoration` — set ONLY by the convention arc's ratified
  settlement (trigger widened to terminal forms at Front>55) and, from S9e,
  the road-back events — and costs a +20 surcharge; `flags.restored` marks the
  way out (an S9e achievement reads it). Dead branches fixed: the imperial
  ending (`path==='empire'`), the party-ban gate (`FORMS[..].terminal` for the
  dead `'absolute'`), conventionLimits (now read twice).
- **tools/roads.js** proves all of it end-to-end: the full authority ladder
  with per-rung ok() flips, the state gate for a centre party, ritual + 
  reckoning reachability, the weighted franchise moving real support, needs on
  orders and at assent, terminal refusal + restoration + surcharge, and seat
  conservation under the reapportioning acts.

## The record (S8c)

Thresholds are authored against the **epic** span and scaled down for shorter
campaigns, so the share of the record a player can reach no longer depends on
which length they picked.

- `v6Span(st)` (~4614) = `(st.endYear - CFG.startYear) / (CFG.endYear -
  CFG.startYear)`, clamped to ≤1 → 0.25 / 0.5 / 1.0. `CFG.endYear` is the epic
  end year, so **epic is 1.0 by construction and the tuned defaults cannot
  move**. A save with no `endYear` (pre-S8c, and the v5 fixtures) returns 1 and
  behaves exactly as epic; `enrichState` backfills the field anyway.
- `v6Scale(st, base, floor)` rounds `base * span` and clamps into
  `[floor ?? (base>2?2:base), base]`. The `Math.min` upper clamp is deliberate:
  a hand-edited `endYear` can lower a threshold but never raise one.
- **Neither helper may ever throw.** `v6AchievementsTick` swallows test errors
  (`catch (e) { ok = false; }`, ~10212), so a throwing helper makes a record
  permanently unearnable in silence. `tools/pacing.js` reports a `threw:` list
  for exactly this reason.

Scaled: `lawmaker` 10, `legislator` 50, `longReign` 30, `veteran` 5 (floor 3),
`keeper` 10, `balanced` 10, `v8work3` 3, `v8despatch` 15, `v8story` 6, and the
`comeback` flag site (~10941, `wasOpp >= 6`). `centenary` was an absolute date
(2124) and so structurally unreachable below epic; it is now the campaign's own
midpoint (`v6Midpoint`), which is byte-identical at epic. `v8ironman` (turn ≥
21) is **not** scaled — turn 21 arrives in all three lengths.

Five V8 scenario goals scale with them, and each is a `test`+`prog`+`note`
triple that must move in lockstep: `pf_senate` 10, `uf_hold` 16, `rd_decade`
12, `uf_books` 6, `ct_balance` 5. `pf_senate` is the load-bearing one —
`popularFront` is the default scenario and its threshold is the same 10 as
`lawmaker`, so scaling one without the other makes the record panel and the
goals panel contradict each other.

Requirements are **rendered, not hard-coded**: a scaled entry carries a
templated `note` (`'{N} of your bills became law.'`, `{n}` lowercase, `{d}`
digits) plus a `req:` returning the live number, and `v6Note(a, st)` (~4646)
substitutes an English word. Six sites read a note and all six go through it —
unlock log (~10213), Gazette (~11025), record panel (~11423), goal log
(~13468), goal news (~13469), goal panel (~13480). **In `viewRecord` the state to pass is `S`, not `st`**: that
function shadows `st` with `S.v6.stats`.

`finish()`'s hall score (~6949) divides its two cumulative terms
(`promisesKept`, `playerLaws`) by `v6Span` for the same reason — the hall is a
cross-campaign leaderboard, and comparing raw totals structurally excludes a
short campaign from the top of its own board.

## The chamber (hemiMap)

The centrepiece, and the one drawing with real arithmetic in it. Rules that
came out of S6b and should not be relitigated casually:

- **One circle per seat, never an arc segment** (ruled). `tools/chamber.js`
  asserts the circle count equals the roll — and, since S8d, that the roll
  equals the constitution. `hemiMap(seatsObj, o)` draws the SUM of `seatsObj`
  and nothing else; it used to take a `total` it never read, which read as a
  promise it does not make. A table short of `CFG.seats` draws a silently
  smaller chamber, so the check is on the opening roll and on the roll after
  every election (`runElection` reapportions both houses; its two remainder
  loops are what hold the total, and removing them is the proof that the
  assertion fires).
- Three legibility problems, three separate mechanisms, because an earlier pass
  tried to solve all of them with colour and made things worse — a lit floor cut
  PNL's contrast from 1.42 to 1.10, and free optimisation of the palette turned
  Labor's red into pink. Seat from neighbour: a rim in the **ground** colour on
  every seat. Bloc from bloc: an **aisle**, a real angular gap. Dark fill from
  the floor: **hue-locked lifts**, applied once in PARTIES, never in CSS keyed
  to a colour literal (the rule that hack replaced would have silently unstyled
  both parties the moment the palette moved).
- Seats sit at **one pitch for the whole chamber** — `span x sum(row radii) /
  seats` — and each row is centred in its bloc's wedge rather than stretched to
  fill it. Stretching looks equivalent and is not: a small bloc puts three or
  four seats in a row, so one leftover seat compresses that row by a quarter and
  its circles touch. This is how the two overlapping pairs in the first S6b
  draft happened.
- Seat size is **not** the radius. At 1305 seats the circles are near their
  packing limit, so what a seat actually reads at is set by `svg.hemi`'s
  max-height per tier (460 desktop / 340 tablet / 250 phone). Row count is the
  other lever, swept not guessed: more rows over the same depth widen the pitch.
- Labels are placed biggest bloc first, anchored **away** from the floor at the
  horizontal ends, nudged back inside the box, and skipped rather than
  overlapped. Because a label CAN be skipped — a dimmed chamber, a wedge under
  ~0.1 rad, a collision — the legend beside the map keeps its seat counts on
  every tier. S6c trimmed those counts above the phone tier on the assumption
  that every bloc is labelled; a six-seat Senate bloc then had its number
  rendered nowhere at all. Do not re-trim without first making every bloc
  labelled unconditionally. The phone tier hides them
  in CSS and leans on the legend, which is the same data at a readable size.
- Re-measure any change with `node tools/chamber.js` (geometry, overlaps, label
  collisions, rendered size per tier) and `node tools/seats.js` (contrast and
  CIEDE2000 against the colour being replaced).

## Load path

Since S5 the first style block opens with seven embedded `@font-face` rules
(Latin subsets as data URIs, ~128 KB) and the file references nothing
off-origin — regenerate them with `tools/fonts.sh`, never by hand.

Parse-time boot: v4 (~8176) creates a **throwaway** `newGame('normal')` and
renders; each chunk re-enriches/re-renders (6 renders total at load); v6's boot
IIFE (~11229) opens `startScreen()` (which offers Resume — never auto-resumes);
v8/v9 boots rebuild the still-open setup sheet (it is built 3× per load). The
throwaway game cannot clobber a real autosave: `saveAutosave` requires
`S.started`, set only in `applyDoctrine`. Fonts are CSS-only (`display=swap`);
offline, the two font requests fail cosmetically. Keydown handlers stack (v4
~8021, v5 Ctrl+K ~8866, v7 `/` ~12099); document-level click delegation
accumulates (v8 `[data-v8cmd]` ~13556, v9 `[data-v9cmd]` ~15596).

## Other known fragilities

- `clamp` (~4426) passes NaN through (every comparison false → returns v).
- `v6Sandbox` (~10712) swaps 9 globals; since S1 the restore sits in a
  `finally`.
- `confirm()` is called exactly once (hall-of-fame clear ~13093) — the playtest
  harness stubs it.
- 93 `Math.random()` sites; the only seeded PRNG is the sandbox's LCG (S3
  replaces all of it).
