# vale.html — structural map

Measured 2026-08-23 (session zero, Phase 0). Line numbers are **advisory** — they
rot as the file changes; anchors are function names. Update this file in any PR
that changes structure. Consolidation PRs shrink it; that is the goal.

## The shape

A v4 base plus six appended `<style>`+`<script>` chunk pairs, each
monkey-patching the last through shared top-level globals. All scripts inline,
synchronous, no defer/async, no DOM-ready handlers.

| Chunk | style | script | strict? | ensure fn | alias prefix |
|---|---|---|---|---|---|
| v4 base | 15–334 | 370–8186 | yes | enrichState (~3602) | — |
| v5 "Statecraft" | 8187–8266 | 8267–8880 | yes | pv5EnsureState (~8352) | `pv5*V4` |
| v6 "The Long Republic" | 8881–9079 | 9080–11241 | yes | v6EnsureState (~9283) | `v6*V5`/`v6*Base` |
| mobile layer | 11242–11465 | 11466–11587 | yes (S1) | — | `v6m*Base` |
| "The Clean Desk" (v7) | 11588–11734 | 11735–12172 | yes (S1) | — | `v7*Base` |
| v8 "The Living Republic" | 12173–12306 | 12307–13868 | yes | v8EnsureState (~12343) | `v8*Base` |
| v9 "The Deep State" | 13869–13903 | 13904–15714 | yes | v9EnsureState (~13923) | `v9*Base` |

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
done: `checkCollapse` | `runElection` (v8→v6→v5→v4) | `finish`→`gameOver`
(v8 hall→v6 grades→v4 sets `S.over`) → `v6AfterTurn` (v8→v6, queues gazette
via `v6Later`/`v6Pump`, pumped by v6's hideSheet wrapper) → `render`
(v9→v8→v7→mobile→v6 full redraw; v6's body is a full rewrite that redraws
`#stats`+`#tabs`+active view via innerHTML, then `wire()` re-binds).

Undo: `captureUndo` (v8 ~12405, stack max 8, ironman disables) at the start of
player actions; cleared every turn.

## Layout

- Tiers as ruled: phone ≤760 (the JS gate is `V6M.mq =
  matchMedia('(max-width:760px)')` ~11471 — the single "is mobile" switch),
  tablet 761–1179, desktop ≥1180 (`#app{max-width:1180px}`).
- Breakpoint owners (13 width thresholds — consolidation target): 420
  mobile/v7 · 520 v4/v9 · 600 v4/v6/v7 · 620 v6 · 640 v5/v6 · **760**
  mobile/v7/v8 · 761min v7/v8 · **880** v4 (.grid collapse — so 761–880 has a
  collapsed sidebar with zero mobile behaviors) · 900 v4/v6/mobile · 901min
  v6/v7 · 1000 mobile (chips) vs 1100 v6 (chips — they disagree) · 1180 cap.
- Mobile layer: scroll-lock preserving position (v6mLock/Unlock), `.tscroll`
  table wrapping, policy folds, `--turnbar-h` via ResizeObserver, safe-area
  vars. v7: grouped two-row nav (`uiPrefs.layout==='classic'` opts out), per-tab
  scroll restore (`UI.scrollPos`), `body.clean` hides #btnBrief/#btnHelp/#btnSave
  on phones. Charts: all inline SVG strings (hemiMap ~6922, benchMap, poll/
  history polylines); v8's region map is a div grid.

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
