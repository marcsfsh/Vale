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

   **What the marker check does and does not reach** (S14). 25 markers are
   discovered as literals written inline at the call site. For 12 of them the
   check asserts the pair that matters: an **emitter** of the string exists
   somewhere outside the splice call, which is what a renamed heading or class
   breaks. 12 more are generic structural strings — `</div>` at 800 occurrences,
   `<div` at 824, `</button>` at 185 — where the old `>= 2 occurrences` rule was
   vacuously true forever; they are listed in `checks/markers.json` and covered
   by the playtest instead of counted. One has no emitter at all and is
   adjudicated.

   **A marker held in a variable is invisible to it by construction.** The
   discovery regex needs the literal at the call site, so the two splices whose
   failure puts *wrong data* on screen have never been among the 25:
   `viewFederation`'s `'<article class="card region-card">'` positional split,
   where a second `.region-card` anywhere mis-assigns every governor strip by
   one region, and the v9 region-action splice. Both, plus the v10 Question Time
   button-row splice, are held by the playtest step `splices-land`.
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

**Deleted in S14** — the same five bodies, which S2 had proved live and called
the ratchet's floor. They were live, but only through **three boot statements**
that painted screens a later chunk replaced immediately: the v4 boot `render()`,
the `render()` half of the v5 boot line, and two calls on the mobile chunk's
boot line. Remove those and every one of the five is unreachable:

| body | its only reacher | proved |
|---|---|---|
| v4 `render` | the v4 boot `render()` | `poison.js render-v4`, alone |
| v4 `renderStats` | v4 `render`, from inside it | `renderstats-v4`, alone — this is the one S2's trap applies to hardest |
| v5 `render` | the v5 boot line | `render-v5`, alone |
| v6m `v6mCenterTab` | the mobile boot line | `centertab-mobile`, alone |
| v6m `v6mPolicyFolds` | the mobile boot line | `policyfolds-mobile`, alone |

**Alone** is the whole method: a `throw` aborts the block it is in, so poisoning
two bodies at once hides every call after the first. Each poison was run against
the full playtest **and** all 92 roads assertions, and the same five poisons
reddened the build from before the reachers were removed — which is what makes a
green run evidence rather than an absence of evidence. The first surviving
assignment of each name is now its declaration, exactly as S2 did it.

**Orphaned, and wearing an alias nothing reads** — the **2** the ratchet counts
today, found in S14 when the check stopped believing a hand-written boolean. An
alias that is never read is not a capture:

| site | the alias | why it is orphaned |
|---|---|---|
| `regionPartyFactor#1` | `v11RegionFactorBase` | referenced nowhere else in the file. A deliberate reassignment, for the reason S11c records: the old body collapses eight regions into one pop-weighted mean, so a wrapper has nothing left to weight per region |
| `actBlocked#1` | `v11ActBlockedBase` | its own adjudication says **"DELIBERATELY NOT CALLED"** in capitals. The old first line, `if (a.house !== 'Senate') return false`, is the defect S11d replaced it for |

Neither is a fault to fix: both bodies were meant to be replaced, for reasons
S11c and S11d record and S14 did not disturb. The fault was an instrument that
scored them green while counting five others for the same condition. The honest
end state for these two is a recorded verdict, not a deletion, so the ratchet
sits at **2 against a target of 0** and the gap is documented rather than
closed.

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
  `UI.saveReadError` → a warning line on the setup sheet; **S10a**: the next
  autosave copies it to `<key>.unreadable` before writing over it, because
  "left untouched" was a promise the very next render used to break),
  `parliamentVale.hall` (~13062–13063, cap 40).
- **The live autosave** is v6 render's debounce (~11093): `setTimeout(
  saveAutosave, 160)` after every render. The v4/v5 render debounces are dead.
  Game end does NOT clear the autosave. Resuming a finished game is still
  allowed — the record is worth reading — but since **S10a** the setup sheet
  says so on the button and the toast says it again on the way in, instead of
  handing the player an inert corpse with no explanation.

## The legislature, and what happens when there isn't one

Three states per chamber, not two (S15). `lowerState(st)` returns `sitting` /
`suspended` / `abolished` and `upperState(st)` returns `sitting` / `ceremonial`
/ `abolished`; `lowerOn`, `lowerSits` and `upperOn` are still there and still
mean what they meant, but nothing in the model should ask a yes/no question
about a chamber any more.

`billLadder(st)` answers **which rungs this constitution actually has**, and
`billOpeningStage(st)` says where a bill enters:

| the constitution | the ladder | sessions |
|---|---|---|
| Assembly and Senate both sit | committee → assembly → senate | 3 |
| Assembly sits, no effective Senate | committee → assembly | 2 |
| Assembly suspended | council | 1 |
| Assembly abolished, Senate sits | senate | 1 |
| neither | decree | 1 |

A **council** is the suspended house: the government's own people, who pass
almost anything, on a favour of `18 + army × .42 + unity × .26 + crown × .16`
against a bar of 50 — at army 30, unity 30 and crown 20 that reads 42, so it is
a gradient rather than a rubber stamp. A **decree** is the same figure plus 8:
no chamber to convince, but the apparatus can still refuse, and when it refuses
the statute does not enter the book.

**What this replaced.** One substituted number,
`if (!lowerSits(st)) lower = FORMS[st.form].elections ? 0 : 100;`, in four
places (`billForecast` and its v6 and v9 wrappers, and `v11ArtForecast`). It
asked about the CALENDAR when the question is whether a chamber exists, and it
gave the same answer for a suspended house and an abolished one. A number
cannot remove a stage, a session of delay, or the sentence "passed the Assembly
with 100 percent" from the log — which is what an emperor with no Assembly was
reading. Under a form that still held elections it forced `lower` to 0, driving
the committee figure to 14 against a bar of 43: **every bill died in committee
and nothing on screen said why.**

Two more things that follow from a chamber being gone: `doTransition` neutralises
the Senate on proclaiming any form that has abolished elections (only the Empire
and the DPR did this for themselves, so a One Party State could be voted down by
its own upper house), and `capitalIncome`'s majority bonus is no longer paid out
of a frozen seat map when there is no house to command.

Covered by seven assertions in `tools/roads.js`, all seven of which redden
against the build before S15a.

### The clock, and the signature (S15d)

**How many stages a bill climbs in a session is the chamber arithmetic.** It was
`loops = bill.urgent ? 2 : 1` — a purchased flag and nothing else, so support
decided *whether* a stage passed and never *how many* ran. `BILL_BARS` and
`BILL_NOISE` are now one table, read by the division itself and by
`billSafe(st, bill, stage, f)`, which asks whether the worst roll the die can
give still clears the bar. `billCarried` is that for every stage a bill has
left; `billPace` is `1 + carried + urgent`. **A bill takes two stages a session
exactly when it cannot lose a division**, and the step falls at the bar plus
half the die (56.5 on both houses) rather than on a constant somebody chose.

**`billLadder` is the chambers; `billTrack` is what the card draws.** Every
other consumer of the ladder is asking which divisions a bill must win, so the
signature is appended only for the card.

**The assent stage is real.** `BILL_STAGES` has carried an `'assent'` slot and a
name for it since v4 and nothing ever set it. Where the chamber arms called
`enactBill` they call `billToAssent` now. Every one of the 582 statutes carries
a `dept`, so every bill has an office; the party holding that department signs.

| the office | what happens |
|---|---|
| your party's | `st.pendingAssent` collects the bill and `endTurn` queues `assentEvent` beside the other pending decisions. Four answers: sign, sign with a statement, return with objections, veto. `uiPrefs.autoAssent` hands the office a standing instruction instead |
| anyone else's | `assentResolve` runs at once: sign at 55, return once with objections at 45, refuse below it. A refused bill sits on the desk for three sessions and then dies there |

**`assentFavour` is the first reader of `loyalty` on an exec figure.**
`makeFigure` has written the field since v4 and every `.loyalty` read in the
file is a faction, a minister or a party leader. Here it is the WEIGHT ON THE
PARTY LINE: `line × w + merits × (1 − w)`, where `line` is the holder's party's
relation to you and `merits` is what the chambers actually gave the bill. An
officer at 90 votes their party's line on a bill they have not read; one at 20
judges the measure and can be talked to. `ideologue` adds to the weight,
`technocrat` takes from it, `fixer` takes a push at 1.6.

**A refusal is beatable, at a price.** `pressOffice` (3 capital, 6 money) adds
to `bill.assentPush` and costs the holder's loyalty and the country's view of
corruption. `override` (6 capital) needs the houses to have carried it at 60,
enacts it over the refusal, and costs 12 of the holder's party's relation.
`advanceBills` clears `st.pendingAssent` at the top of every session, so a bill
the player never answered for is signed by its own office rather than asked
about for ever.

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

### Every tick stands in the session the click is LEAVING (S16a)

Read the chain above: **`S.turn += 1` comes last**, after `tickTurn`,
`politicsTick` and `v6ExtraEvents`. So inside any of them `st.turn` is the
session the player has just *finished*, not the one the click is *producing*. A
clock that prints `due - st.turn` on the card and then resolves on
`st.turn >= due` in a tick is therefore reading the two numbers against
**different sessions**, and charges one more End Session click than it printed.

Four of the game's six session clocks were written that way. The rule now, for
every countdown that lands in a tick:

> **Ask about `st.turn + 1`.** That is the session the click is producing, and
> it is the session the card was rendered against.

| clock | where it resolves | reads |
|---|---|---|
| an article before the chambers or the country | `v11ConTick` | `st.turn + 1 < p.due` → wait |
| a manifesto commitment | `promiseTick` | `st.turn + 1 >= p.deadline` → failed |
| a crisis arc's next dispatch | `v6ExtraEvents` | `a.due <= st.turn`, and the banner prints `a.due - S.turn + 1` — the same compensation, spelt on the render side |
| sessions to the federal ballot | `runQueue`'s done callback | `isBallotTurn(S.turn)` *after* the increment, so `pv5SessionsToBallot` never had the problem |

A **political paper** is the odd one and worth knowing about: its card names a
**date** (`Reply by <dateLabel(it.deadline)>`), not a count. It must be
answerable **on** the session it names and gone at that session's close, so
`expireInbox` reads `st.turn < it.deadline` → keep, and the three "papers expire
with this session" warnings read `deadline <= st.turn` rather than
`<= st.turn + 1`.

`tools/roads.js` holds all six under *every session clock charges what it
prints*, driving the model in `endTurn`'s own order rather than the UI — which
sheets a click pumps depends on timing, which session a tick is standing in does
not.

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

## Scroll ownership (S9b, amended S9f)

The window is the scroll container at every tier — `#view` has no CSS rule of
its own and nothing overflows vertically inside it. v7's render wrapper is the
SINGLE owner of programmatic vertical scroll: **a main-tab change lands at the
absolute top, always** (S9f — the cross-tab `UI.scrollPos` memory is gone; it
gave one gesture three outcomes and hid the header row two of the three ways),
and on a same-tab render it restores the exact scrollY around the innerHTML
rewrite. Do not add `window.scrollTo` after `render()` anywhere — that
reintroduces the double-motion S9b removed (seven sites had it). The two
exceptions that remain by design: `v7Jump`'s scrollIntoView (jump-to-a-thing)
and the phone tab-change topbar clamp in the mobile wrapper.
Nothing may navigate the player away from where they acted, either: the draft
and referendum paths used to set `UI.tab = 'houses'` on confirmation and no
longer do. `flash()` must
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

## The record deck (S11a)

Twenty charts on the `record` tab, drawn from **three sources with three
different start dates** — the note under each panel says which, because one
blanket disclaimer would be wrong twice.

- `st.v6.history` — nine plottable series, and its cap of **220** exceeds an
  epic's **201** turns, so on any save it already spans the whole campaign.
  Five of its columns (`growth`, `capital`, `treasury`, `debt`, `net`) were
  recorded from v6 onward and displayed to nobody until this slice.
- `st.v5History` — written every session since v5 and **read by nothing** until
  this slice: `inflation`, `unity`, the government's seat share and campaign
  power exist nowhere else. Its cap was **40** and is now 220; an older save
  keeps only its forty and the panel says so.
- `st.v11.hist` — fifty columns, **columnar and integer**, created-on-write,
  with a per-column first-turn stamp in `st.v11.histT`. Recorded by
  `v11HistTick` from the v10 `tickTurn` wrapper, last in the chain so every
  earlier tick has already moved what it reads.

**A collapsed panel emits a SLOT, not a chart.** `render()` rebuilds the active
tab with `innerHTML` on every action; measured, twenty charts collapsed cost
~9–12 ms a render against ~20 ms with all of them open. `v7Folds`'s `toggle()`
calls `v10FillChartSlots(panel)` **before** `v7ChartsToEnd()`, so the
scroll-to-present pass measures a box that now has a width. Caching the SVG
string is the trap: string-building is 0.28 ms of the 0.72 ms per chart and a
cache still pays the innerHTML parse and the SVG layout in full.

- **`v7FoldKey(tab, title)` / `v7FoldState(tab, title)`** were extracted from
  `v7Folds`'s inlined logic so a view can ask the identical question the fold
  pass asks. The normalisation **strips a trailing number and lowercases**, so
  "Chart 1" and "Chart 2" are ONE saved preference — every deck title must be
  distinct after it, and `roads.js` asserts that over the registry.
- **`v7ChartsToEnd` is `querySelectorAll`, keyed per chart** off
  `el.dataset.chart`. It used to be `querySelector` — first match only — keyed
  by class name, which with a deck would have left nineteen charts opening at
  the oldest session sharing one memory slot.
- **`v6Sandbox` deletes `clone.v11.hist`.** It deep-clones the whole of `S` on
  every mouseenter over a forecastable button, and the deck history is read by
  nothing in the model.
- **Deck charts carry `nofade`**: `.chart-in .ink` restarts its animation on
  every render, and twenty charts fading in on every click is a cost and an
  unpleasant read. A chart built on fold-open animates once, by arriving.
- **The range filter** (All / 50y / 25y / 10y / 5y) rides `S.uiPrefs.recRange`,
  which is **saved** — `UI.polCat`, the chip pattern it copies, is transient.
  One turn is one year so a range is a slice. Changing it **clears
  `UI.chartScroll`**, because the offset was measured against a wider box.
- **All three recorders round.** Rows stored raw doubles
  (`"approval":59.803040788077986`); `v6.history` at its cap went ≈50 KB → ≈24
  KB. This matters twice over: the autosave rewrites the whole blob 160 ms after
  every render, and `UI.undoStack` (:14909–14914) holds up to eight more copies.

## The federation (S11c)

Before this slice a region's `prosperity`, `services` and `order` reached **one
governor's approval score** and nothing else. The only channel from a region to
the national vote was `regionPartyFactor`, a pop-weighted mean of eight frozen
`lean` literals; federal trust at 90 across all eight regions was worth **+4.7%
to the ruling party alone**, and nothing a player did on the tab moved it.

**The regional term.** `regionPartyFactor` is **reassigned**, not wrapped
(`regionPartyFactor#1` in `dead-bodies.json`, alias `v11RegionFactorBase`): the
pop-weighted mean is already collapsed by the time a wrapper would see it, so
there is nothing left to weight. The new body recomputes the same mean and
multiplies each region's `fit` by what the player actually built there — the
governor's party, standing and approval; the organiser dots in
`st.campaign.targets[r.id]`; the region's own prosperity/services/order read
**with the sign the government owns and the opposition does not**; the federal
trust nudge; and autonomy as a suppressor on the government side.

**One tunable, and why.** Every coefficient runs through **`V11_REGION_GAIN`**
(`0.23`), because the factor is applied **TWICE on one ballot** (:6786 in
`supportTargets`, :6862 in `ballot`) and the allocator amplifies again. At gain
`1` a clean eight-governor sweep measured **+130 Assembly seats** against the
owner's ruling of about forty. Tuned by measurement: `0.30` → 47, `0.26` → 45,
**`0.23` → 42** (`roads.js` reports 44 against its own harness state). Retune the
gain, never the eleven coefficients.

**`V11_REGION_SPAN` is `[.80, 1.22]`, and only its floor is doing work.** At the
shipped gain the factor runs **.847 .. 1.028** across every party at both
extremes — so the old `[.86, 1.15]` clipped the *bottom* (the worst RSF and PNL
readings sat under .86 and were being shaved) and its ceiling was never
approached. A proof-of-failure run confirms restoring `[.86, 1.15]` does **not**
turn the flank-party assertion red: what was stopping the flank parties being
moved in the regions was the absence of the terms, not the clamp. The top of the
span is headroom for a retune of the gain, and the comment at the clamp says so.

**Per-region seat allocation was rejected**, deliberately. `ballot` produces one
national vote-share map, `runElection` renews a third of the Assembly against a
flat `{partyId: n}` with no per-region structure, and a naive largest-remainder
across eight regions hands ~24 seats to whoever leads each region **purely from
rounding — and it would look exactly like the feature working**. Because the
regional term leaves `allocateSeats`, `ballot`, `runElection`, `projection`,
`hemiMap` and `CFG` untouched, "the constitution holds the totals" holds *by
construction*; `roads.js` re-measures 1305/1305 and 300/300 anyway.

- **`regionLeadingParty` takes a REGION, not a state.** Both callers (:9534 and
  the post-count map at :16436) pass one. It is reassigned to route through the
  same factor so the map, the governor model and the ballot agree — a region
  flips on screen *because you governed it*. It falls back to
  `v11RegionLeadingBase` when handed anything without a live `st.regions` entry.
- **`v11RegionalSeats(st)`** reads the effect back through `projection()`,
  comparing the live standing against a neutralised counterfactual, so the page
  can say what the federation is worth **in seats** right now. Without this the
  effect is real and unfelt.

**The economy is on the SAVE, not the literal.** `r.pop`, `r.wealth` and
`r.urban` live on the top-level `REGIONS` literal, which is **not serialised,
not rewound by undo, leaks into a new campaign in the same page load, and is
corrupted by every `v6Sandbox` forecast**. `v11Region(st, id)` materialises
`pop`/`wealth`/`trade`/`output` **created-on-write onto `st.regions[id]`**,
seeded from the literal; the literals stay as the founding values and are never
written. `v11EconomyTick` moves output and wealth toward trade-weighted targets
and migrates population; `v11Disparity` is the spread between the richest and
poorest region and feeds both autonomy pressure and unrest.

**Autonomy is a ladder, not a boolean.** `V11_AUTONOMY` has five rungs — within
the union, devolved, chartered, autonomous, in secession. `st.v6.autonomy[id]`
was a **boolean set by one arc branch**; `v11AutonomyLevel` reads a legacy
`true` as rung 1, so an old save climbs the ladder from where it stood rather
than breaking. `v11AutonomyPressure` reads federal trust, prosperity, order, an
opposition governor, a weak governor and national disparity against the crown.

**`unrestTarget` now reads regional `order`** — the worst region and the mean,
plus disparity. The field guide (:16283) has claimed it did since v6.

**Cooldowns.** `meet` and `works` bought a governor's standing to 100 in three
clicks; both now sit behind a two-session cooldown on
`S.regionCooldown[id + ':gov' + action]`.

**The tick order is fixed** in the v10 `tickTurn` wrapper (:18574–18578):
`v10OrdersTick`, then `v11EconomyTick`, then `v11AutonomyTick`, then
`v11HistTick` **last**, so the deck records what every earlier tick has already
moved.

**The dice moved, and it was announced.** `v11AutonomyTick` draws for a rung
change and `v11Region` draws once per region when its trade is first
materialised. A campaign replayed from an old seed therefore **diverges** —
`tools/pacing.js` shows different treaties and records at the same seed for that
reason, not because the arc changed; all three lengths still reach the end year.

**Both `viewFederation` wrappers fail silently if the markup moves.** v6 splits
on `<article class="card region-card">` and maps `parts[i] → REGIONS[i-1]`
**positionally**, so a second `.region-card` element mis-assigns every governor
strip by one region; v9 locates `data-region="{id}" data-region-action="inspect"`,
so renaming that button deletes every `V9_REGION_ACTS` button. The S11c panels
(`v11StatesLedger`, `v11RegionalWorth`) are appended by a **third** wrapper
(`v11ViewFederationBase`) that cuts the five generic Strategic Risks lines by
walking div depth rather than splicing on a marker.

## S15 — what the slice was, and what it left (S15k)

The owner played a campaign and found the authority mechanics decorative:
abolish the National Assembly and your bills still spend a session passing
through it. That was one instance of a pattern with a name already in this file
— **a modifier nothing reads is a lie on the card** — and it survived in every
system the slice touched. Eleven PRs, each shipping the assertion that reddens
without its fix:

| PR | the card said | the model did |
|---|---|---|
| **a** | bills go through an abolished Assembly | the Senate had a stage skip and the Assembly had **none**; abolition was one substituted number in four places that asked about the *calendar* |
| **b** | seventy-two order cards | `var n = 4`, read in three places, asserted by no harness, disabling all 72 at once |
| **c** | very easy is "a safe seat" | six works, a capital ceiling three turns wide, and a works budget outside the difficulty multiply |
| **d** | four stages on every bill card | the fourth pip had never been lit since v4, and support decided *whether* a stage passed, never *how many* ran |
| **e** | a constitution you assemble | one article at a time, always two sessions, a convention worth `-8` |
| **f** | a party pays for its own politics | 27 of 57 party actions billed the exchequer, and `st.funding` had **no writer anywhere in the file** |
| **g** | sixty extraordinary measures | 25, and six of the eleven openings rendered **no cards at all** |
| **h** | build the majority before the writ | the machine was counted twice and the caucuses were worth **0 seats** |
| **i** | a named holder of every great office | the office was won by a *party*, and the person was minted afterwards and thrown away |
| **j** | expand the Northern Alliance | one relation number, and a statute whose id appeared **once in three megabytes** |

**What the harnesses gained across the slice:** `roads.js` 106 → **155**
assertions, `playtest.js` 44 → **52** steps, and one new mode,
`tools/rungs.js --corpora`, which holds the three registries S15 wrote into to
the statute book's own house style and fails on a breach.

**The punctuation residue is reported and not repaired.** `--corpora` found and
fixed three breaches in the order book; the rest of the file carries 32 lines
with an em dash inside a sentence, 22 of them Question Time authored before S13
carried the owner's writing skill into the repo. Rewriting an audited corpus on
a checker's say-so is the move this repo does not make; the count is live in the
tool and the classification is in `docs/PROSE-RESIDUE.md`.

**Three numbers the slice moved and the owner may want to rule on**, each with
the tool that re-runs it: very easy's capital and works ceiling
(`tools/pacing.js`), `V15_MACHINE_GAIN` and the campaign channel spread
(`tools/roads.js`, the campaign block), and the +460 all-five-channels ceiling
recorded in `docs/STATE.md`'s open items.

## Treaties (S16b) — a relationship, not a slot

`st.v6.treaties[pid]` is an **ARRAY** of instruments. It held ONE object,
`{kind, since}`, until S16b, so signing a second replaced the first and twelve
places in the file indexed the slot directly.

| shape | meaning |
|---|---|
| `{kind, since, laid}` | in force |
| `{kind, laid, odds, pending:true}` | laid, and the capital has not answered |

**Never index `treaties[pid]`.** Read through the accessors:

- `v6Treaties(st, pid)` — what is in force
- `v6TreatyTalks(st, pid)` — what is awaiting an answer
- `v6HasTreaty(st, pid, kind)` / `v6TreatyKinds(st, pid)`
- `v6TreatyCount(st)` — instruments across every capital
- `v6TreatyRows` **reads and does not create**; `v6TreatyRowsRW` is the writing
  half. That distinction is load-bearing: while reads installed an empty array,
  the desk brief's eleven-power sweep turned `Object.keys(st.v6.treaties)` into
  eleven and the **Peacemaker** record fired on every campaign with nothing
  signed. Its test counted capitals rather than instruments and now calls
  `v6TreatyCount`.

**Twenty instruments, sixteen of them written on top of another.** `needs` is a
list of ids that must already stand. A prerequisite is a **forward reference**
into the registry, which is why `research` and `cultural` were moved out of the
late v9 chunk and into the literal: while they were defined after it, every boot
render between the two chunks read `.name` off undefined and threw. The registry
is one literal, and `v6TreatyMissing` skips an id it cannot find so a future
split fails soft rather than at boot.

**Nothing is signed on the click.** `v6TreatyPropose` spends the capital and the
money on the NEGOTIATION and pushes a pending row carrying `odds`, computed once
at that moment — so the number the card printed is the number that is rolled and
no render path spends a die. `v6TreatyAnswer`, first thing in `v6TreatiesTick`,
answers anything with `laid <= st.turn`: the tick runs before `S.turn += 1`, so
terms laid in session N are answered by the tick that closes N and read on
entering N+1. That is what "the following turn" means (see S16a).

**Annulling cascades.** `v6TreatyAnnul` drops everything whose `needs` name the
instrument being annulled, transitively, and names each one in the log. Pulling
a non-aggression pact takes the defence pact, the intelligence liaison, the
basing agreement, the arms treaty and the non-proliferation accord with it.

**Every instrument can lapse.** All twenty carry `floor` (a relation below which
it lapses) or a condition of their own (tariffs void a trade agreement,
rearmament collapses an arms treaty). Five had no branch anywhere in the tick
before this slice.

**Every tag is a claim the model answers for.** `targets` is a general indicator
map read in the `indicatorTargets` wrapper; `mil`/`econ`/`tech`/`pov`/`corr` are
the older spelling and both are read. `drift` moves the relation each session,
`upkeep` charges the treasury, `warmth` raises the odds on every further term.

**The Foreign Office answers to the government.** `v6TreatyWhy` refuses when
`!inPower(st)`, and the world page disables every Negotiate button. Eleven of
them were live in opposition.

## The Northern Alliance (S15j)

**It was one relation number on a power row.** `st.powers.alliance`, seeded at
74, drifting like any other — a bloc with no members in it. The statute named
**Expand the Northern Alliance** carries four authored rungs about association,
accession and guarantee, and its id appeared **exactly once in three megabytes**:
in its own definition (plus one purge list). Nothing could be expanded because
there was nothing to be a member of.

**`st.alliance = { members, asked, founded }`** is that set, created on write —
a save from before this slice has an Alliance with no members, which is exactly
what it had. The `alliance` power row stays as what it always was: the standing
of the institution itself.

- **`allianceCap`** reads `st.pol.allianceExpansion` against `V15_ALLY_CAP`
  `[0, 2, 4, 6]`. **Nothing may accede at rung zero**, which is what the
  statute's own first rung says arrives with it.
- **`allianceOdds`** — relation, the Alliance's own standing, the statute, the
  tension, the power's `kind`, whether Vale is at war, any standing treaty, and
  how many times this capital has already been asked. **It is printed on the
  panel**, because a die whose odds the player cannot see is a coin toss.
- **`allianceInvite` spends a die.** It is the first diplomatic decision in the
  game that does: every other one applies a fixed shift and reports it as a
  fact. Measured: **76 of 300** accessions carry against a printed 26.
- **`warTick`'s candidate filter excludes members.** It took a power's `kind`
  and its treaties and had no way to ask whether it was in the bloc. Measured
  over 374 war rolls with two members at 78 and every other power at 12: Vale
  went to war with a member **not once**.
- **`allianceJoin` brings them in.** A guarantee runs in both directions, which
  is what the Alliance's card has said since v4; the only mechanical trace of an
  ally fighting was a flat `+1` of momentum for a defence pact. Joiners add
  `1.7` each to the war edge, gain relation on a victory and lose it on a defeat.

**The Foreign Office could reach six capitals of eleven.** `POWERS.push` runs in
the S10e chunk; the envoy, treaty, pressure and sanction lists were built with
`POWERS.map` **at the moment the `ACTIONS` literal and the v9 widening IIFE were
evaluated**, long before it. So the order book could name Tarnow and the Foreign
Office could not. All four are rebuilt at the end of the file, where `POWERS` is
complete. `data-opt` is an **array index**, so they are replaced whole before
anything renders, never appended to a rendered one.

> **`A(o)` is declared twice** — the ACTIONS constructor and the articles
> constructor — and the second shadows the first file-wide. The accession action
> is therefore pushed onto `ACTIONS` as a plain object with `pay:true` set by
> hand. Anything added to `ACTIONS` from the last chunk must do the same.

**Four cards that said "the alliance" and moved nothing** now move it: convening
it, withdrawing from it *entirely* (which now empties the roster too), a state
visit to its capitals, and the arc line whose own summary read "the alliance
cools". And **Conclude a Treaty produced no treaty** — 8 capital and 6 of money
for a relation shift, no entry in Treaties in Force, no progress toward the
Peacemaker record, no line in the stats. It opens `v6TreatyDialog` now, so the
game has one treaty path instead of two surfaces of which only one signed
anything.

**Known and left alone:** `kind:'trade'` exempts its holders from the war roll
entirely, which `zhenkai` inherited from the S10e "same array" push; and four of
the ten treaty kinds (`transit`, `science`, `labour`, `extradition`) reach
`indicatorTargets` but have no branch in either treaty tick, so the relation
drift their cards promise is written by nothing.

## The person in the office (S15i)

**There was no candidate.** An executive office was won by a *party*: national
vote share, a push keyed on `st.ruling`, a noise band, and a flat **`1.18`** for
whichever party held it. Not one attribute of the sitting holder entered the
contest. A person was minted *afterwards* by `holderOf` and thrown away the
moment `f.party !== st.exec[office]`, so nobody could hold an office twice, be
beaten and come back, or be barred from a third term.

**The bench already existed.** Sixteen ministers have carried competence,
loyalty, ambition, exposure and a trait since v5; eight governors have carried
standing, approval and their own `terms` since v6; every party has had a leader
since v4. **None of them could stand for anything.**

- **`execBench(st, office, pid)`** — the sitting holder if the office is theirs,
  the party leader, any minister of theirs with `ambition >= 55`, any governor of
  theirs. Each candidate carries where they came from, which the page prints.
- **`execNominate`** scores on ambition, competence, loyalty and exposure, with a
  bonus for the sitting holder and the leader. The player's party honours
  `st.execNominee[office]` if it has been named and the person is still eligible.
- **`execSeat`** installs the winner and increments `terms` when it is the same
  person. **An ambitious minister who wins a great office leaves the cabinet** —
  the first consequence ambition has ever had outside its own portfolio.
- **`execRemember`** takes loyalty off, and puts ambition on, every minister who
  wanted it and did not get it.
- **`execPersonFactor`** replaces the flat party `1.18`: the sitting *person*
  standing again is worth 1.14 plus .05 a term plus a competence term, less
  exposure, clamped to `[.86, 1.32]`; the same party running a new face gets 1.04.

**No die is rolled anywhere in this model.** `execBench`, `execNominate` and
`v15Person` are all on the render path — the nomination panel previews who the
party will put up — and a roll there makes the campaign's dice depend on how many
times the player looked at a screen. Every derived value comes off `v15Hash` of
the person's own name, so it is stable, previewable and free. That is also why
**`makeFigure` is untouched**: `v15Person` backfills competence, ambition,
exposure, `terms` and `from` on read, so old saves, the ten event and action
sites that build a figure by hand, and the v10 rename wrapper all get the same
treatment through one function, and the dice stream is byte-identical.

**Three things that were wired to nothing:**

| was | is |
|---|---|
| `execPush` wrote `S.execPush[S.ruling]`, keyed on no office, and the read applied it to **both** contests of the pair. Its `money:8` came out of the national treasury | four options, one per office; credited to `playParty(S)`, so a junior partner no longer buys the senior partner's ticket; `purse:'party'`. `execPushOn` reads the office key **and** the bare party key, so a save written mid-cycle is not silently voided |
| `promoteProtege` picked a **random** office among those the coalition held, discarded whoever was in it and minted a stranger with a hand-picked trait and `loyalty: 85` | four options, and the person who arrives is somebody the player built — a minister, a governor or the party leader |
| `artTermLimit` has read *"no person shall hold the same great office for more than two terms together"* since S11d, has **no `apply()`**, and **no executive term counter existed anywhere in the file** | `execTermBarred` reads `v11Adopted(st, 'artTermLimit')` against the sitting holder's `terms` |

**`ageSucceed`'s exec arm takes the successor off the bench too**, so a death in
office promotes somebody rather than introducing a stranger. Measured over eighty
sessions: 11 successions, all of them out of the leadership or the states, where
every one used to be a name nobody had seen.

**`viewExec` had no wrapper and emitted no `data-*` of its own.** `viewExec#1`
appends the person's competence, term and origin to each office card by
replacing the tag the base writes (`'<span class="tag">' + name + ', aged ' + age
+ '</span>'`), and splices the nomination bench in above **`<div
class="panel"><h2>The Cabinet</h2>`**.

## Campaigning and the vote model (S15h)

**Five channels reach the count, and before this slice one of them was worth
nine times the other four together.** Measured with `projection()` against a
neutralised counterfactual, one channel at a time, from a 222-seat baseline on
normal:

| channel | before | after |
|---|---|---|
| the party organisation (`st.machine`) | +219 | **+177** |
| the campaign deck (field, media, data, debate, message, targets) | +24 | **+96** |
| the caucuses | **0** | **+61**, and **-60** when they are abandoned |
| the organisations (endorsements) | +40 | **+84** |
| party money (`st.funding`) | +62 | +61 |
| all five at once | +352 | +460 |

**The machine was counted twice.** `supportTargets` multiplied a party's raw
weight by `1 + machine`; `ballot` then multiplied the *settled* support by
`1 + machine * .25` again — and `psupport` converges on the target, so the
second reading landed on a number the first had already inflated. It is read
**once** now, through `machineOf(st, pid)`, at `V15_MACHINE_GAIN`.

**`V15_MACHINE_GAIN` is set against `tools/pacing.js`, never by eye.** The
opening literal gives the Federal Party `.63` and the player `.25`, so the
machine *is* the only structural lead any opposition has. Un-squaring it without
a gain to hold it up cuts it to +97, and the harness then wins **every election
it fights and governs all fifty sessions**. Sweep: `.58` → 18 wins / 50 years,
`1.15` → 3 / 10, `1.40` → 7 / 16, against HEAD's 2 / 8. It ships at **1.15**,
where the arc is what it was. The sweep is not monotone — a single early flip
cascades — so retune it by running the tool, not by interpolating.

**What `ballot`'s second pass does now is TURNOUT.** `grep -i turnout` found the
word in prose and in one rigging set-piece and **nowhere in the vote model**.
`partyTurnout(st, pid)` is a multiplier clamped to `V15_TURNOUT_SPAN`
`[.70, 1.34]`, and it is where the three neglected systems reach the count:

- **the caucuses**, through `factionAverage` — symmetric, every party has them.
  `factionAverage` used to terminate in `st.unity`, a bill score and one event,
  none of which the vote model reads.
- **the ground campaign**, `field` and `data`, and **unity** — player only.
- **the endorsements**, through `endorsedTurnout`, weighted by how much of that
  bloc the party can claim at all (`affOf`) — player only, and `PV5_INTERESTS`
  is a v5 table so the function is guarded with `typeof`.

**The campaign's ceiling was throwing away better than a third of itself in
silence.** `clamp(power, 0, 12)` against a raw score that measures **18.34**
with the deck at its ceiling and no endorsement held at all — and the page
printed the *clamped* number, so nothing on any screen said so. The score is
computed unclamped in `pv5CampaignRaw` and clamped in `pv5CampaignPower` now, the
ceiling is `V15_CAMPAIGN_MAX` (26, above the 23.5 the dearest possible campaign
scores), the ballot conversion is `power / V15_CAMPAIGN_DIV`, and the three
thresholds keyed to the old 12 (the objective's `*8.33`, its `done` and `risk`
bars, the advisor's) are keyed to the constant.

**`v15CampaignSeats(st)` is `v11RegionalSeats` generalised** — live standing
through `projection()`, then one channel neutralised and read again, restored by
reassigning deep clones. It answers in five channels and it is what three panels
print: `v15CampaignWorth` on the Campaign page (spliced above **`<div
class="panel"><h2>Poll and Seat Projection</h2>`** by the `viewCampaign` wrapper,
the only one that function has), a sentence in `factionPanel`, and a third
`macro-tile` in the S11e organisations panel.

**Two write-only fields got readers.** `st.campaign.history` has recorded the
share, the seats and the campaign power at every ballot since v5 and nothing had
ever read it; `st.campaign.lastAction` has been written on every campaign click
and read by nothing. Both are on the new panel. `st.campaign.field` still has no
reader outside `pv5CampaignPower` and `partyTurnout`, which is now two.

**Not touched, deliberately:** `press` and `apparatus` are double-applied in
exactly the same way (`1 + press` then `1 + press * .6`; `1 + apparatus` then
`1 + apparatus * .5`), and `regionPartyFactor` is applied twice on one ballot by
design — S11c tuned `V11_REGION_GAIN` against that. Un-squaring press or
apparatus would move the authority path S15a and S15g were measured against.
S11c's own eight-governor sweep moved 44 → 51 and S11e's organisation figure
15 → 41 as a consequence of the machine change alone; both assertions say so.

## Extraordinary measures (S15g)

**Sixty measures in eight books** — one per party plus a universal book — on the
`exec` tab. There were 25, twenty-three of them open to anyone and two belonging
to a party, so the Social Democrats, the Federal Party and the Coalition for
Unity and Progress had **nothing of their own at all**.

**`X(o)` supplies defaults now.** It was `function X(o) { return o; }` — the
identity function — so every optional field was read defensively at ten call
sites. It fills `tier`, `cost`, `book`, `eff`, `mood`, `mods`, `power`,
`exposure`, `unrest`, `security`, `req` and `reqText`, and **derives `security`
from the measure's own liberties cost** when it is not authored, the same idiom
`P()` uses to freeze a statute's `auth` valence from its rung-one row.

**`extraWhy(st, m)` is the reason, in words.** The gate was one external
predicate and one string — "That is not open to this government" — whatever the
reason. There are ten distinct sentences now, covering the party book, `only`,
`needs` (a statute the measure cannot outrun), `forms`, `after` (a measure that
must be upheld first), `req`/`reqText`, the precedent floor and the tier gate.
`extraAvailable` is `extraWhy(st, m) === ''`.

**The panel renders locked cards.** The S12 rule: a player counting the page
should never conclude the book is unfinished. A Social Democrat on turn one of a
Federal Republic sees all sixty cards, locked, each carrying its own reason,
grouped by book, with a filter.

**`extraMods(st)` is what a measure stands for**, on the `v10OrderMods` pattern
— recomputed, never cached, every field with a named reader: `unrest` →
`unrestTarget`, `ind` → `indicatorTargets`, `polCost` → `policyCost`, plus
`extraSecurity` → `securityState`. The four wrappers are installed **last in the
file**, beside v12's capital floor, so they are outermost and no existing
wrapper index in `checks/dead-bodies.json` shifted.

**The ratchet compounds.** `securityState` opened the measures at 30 and 50, read
them in the court's hold formula and printed them on the panel, and signing all
twenty-five moved it by **exactly zero**. Measures build the apparatus that
opened them now, capped at 24.

**A measure can be repealed** by the government that signed it (`extraRepeal`),
at capital, giving back the liberties and part of the unrest. Only the court
could undo one before, so it was a one-way ratchet whatever the government came
to think of it. The unrest cost is authored per measure rather than 6-or-13 by
tier, and `exposure` is per measure rather than one number for the whole tier.

## The party purse (S15f)

**`st.purse[pid]` is money a party owns**, in the same units as the treasury,
backfilled in the v4 enrich beside `st.partyRel` and seeded from seats and the
tier's `purseMult`. Before this slice **57 party actions, 27 of them charging
the exchequer**, paid for a party's campaigning, organisers, newspapers,
caucuses and interest groups out of the national treasury, including an
opposition party doing it out of a treasury it does not control.

**The seam is one argument.** `pv5Spend(cap, money, label, purse)` — `purse`
defaults to the nation, so no call site changed behaviour until it was
re-pointed. `myPurse()` is the player's party.

**The route is a property of where the action came from, not of the button.**
`partyActions` stamps `purse:'party'` on the whole list in its tail, and the v9
extension does the same, so 57 actions were re-pointed by two lines rather than
two hundred. `actionPurse(a)` and `actionCanPay(a, m)` are what `doAction` and
every button strip ask. **`moneyHandled` is gone**: eleven party actions
deducted their own money inside `run()` past a hand-kept array of ids, and
`doAction` pays for all of them uniformly now.

**`partyIncome(st, pid)` has three channels with three readers**: dues from
seats and `st.machine` (the file's de-facto membership), donations from the
blocs by `BLOC_WEALTH` and `affOf` closeness plus the organisations' relations,
and a state subsidy that is there only while the **State Funding of Parties
Act** stands (`acts.partyFunding`). A fourth, `purseGraft`, raises a third again
and costs corruption and liberties every session. `partyPurseTick` pays **every**
party, including the six the player does not lead.

**`st.funding[pid]` has a writer.** It is a live multiplier in `supportTargets`
with a decay in `endTurn` and, until this slice, **no writer anywhere in the
file** — the vote model had a slot for what a party's money buys and it was
permanently zero. `partySpend` writes it at `money × .002`, capped at .35.

**`st.campaign.warChest` is retired.** It was a party purse with one earner, one
three-point deduction and a single read capped at 30 and weighted .09, and
nothing ever paid for a party action out of it.

Two ledger repairs went with it: `v11ConBudgetBase` and `v11DeptBudgetBase` both
computed `net = rev - exp - interest` when interest is already inside `exp` when
the base returns, so a save with a fiscal article and a department settlement
**charged the debt three times** on the line the Ledger prints; and the Political
Capital panel, which re-typed eleven of `capitalIncome`'s terms by hand and
omitted the rest and all five wrappers, now carries the `lowerSits` guard the
base got in S15a and a **measured residual** for everything it cannot itemise.

## The constitution (S11d, rebuilt in S15e)

**Eighty articles in eight books, ten to a book**, on the `state` tab,
assembled over a campaign. Before this slice the tab rendered ten FORMS as informational cards
with no button, the transitions open from the current form, a dissolve button
and the path panels — seventeen controls on a fresh game, thirteen of them
identical every session for two hundred sessions.

**The document is `st.v11.con`, created-on-write.** A save without one has an
*unwritten* constitution, which is the historical state of every campaign begun
before this slice: nothing is lost, because nothing was there, so there is no
migration and nothing to announce. Shape:
`{arts:{id → {year, margin, entrenched, turn}}, order:[id], pending:[…], failed:{}, conv, convUsed, plebiscites}`.

**`pending` is a LIST since S15e**, capped at three and at four while a
convention sits. It was one object, and `v11CanPropose` refused everything else
with "Another article is already before the country" — so a convention could be
called and there was still nothing to do with it. **The migration is the one
save-shape change in this slice**: a save carrying a bare object keeps that
article, its campaign spending and its clock, and the page says so
(`UI.conMigrated`, rendered as `[data-con-warning]` on the pending panel, which
is where the article now is); a blob whose `pending` is neither null nor
article-shaped is dropped and COUNTED rather than guessed at. The wrap lives in
`v11Con`, which is pure, spends no dice and is idempotent.

**Ratification is a vote, and there are two roads to it.**

| road | sessions | decided on | open when |
|---|---|---|---|
| `assembly` | 2, or **1 while a convention sits** | the chambers, then the Senate | the chambers sit |
| `plebiscite` | **1** | the country | always, including under a form with no elections |

**Two sessions is two End Session clicks (S16a).** `v11ConTick` waits on
`st.turn + 1 < p.due`, not `st.turn < p.due` — see *Every tick stands in the
session the click is LEAVING* under the turn loop. Until then the card counted
down 2, 1, 0 and the article carried on the click *after* the zero.

`v11ArtVerdict(st, p)` is the one place that answers what an article is decided
on. The plebiscite **replaces** the chamber test: before S15e `a.referendum`
was a fixed property of the article that stacked a country vote *on top of* the
chambers, and the whole road was closed under precisely the forms that have no
other way to pass anything. It is now the road such an article must take, the
government writes the question (worth 8), a campaign is worth half again as much
to a country as to a chamber, and each plebiscite costs more civil liberties
than the last (`c.plebiscites`).

`v11CampaignArticle(id)` and `v11WithdrawArticle(id)` take an id; the panel
draws one card per pending article with its own controls.

**The convention is an event, not a discount.** It sat six sessions and
subtracted 8 from a threshold and did nothing else. It sits **three** now,
takes **four** articles at a time, and puts each of them the session after it is
laid. An article put early that falls short is **not struck**: `p.fast` becomes
`p.stood`, the due date returns to `laid + 2`, and it is put again — otherwise a
convention would be a way of losing articles faster. It still costs 24 capital
and two is all any republic gets.

A defeat costs capital, five of unity and two of unrest, records the year in
`failed`, and bars the question for six sessions.

**Entrenchment is what makes it a constitution rather than a settings page.**
`V11_THRESH` — plain **50%**, entrenched **60%** to carry, **66.7%** to strike
out again. `Of Procedure` moves every later bar (`mods.ratify`), and a sitting
convention lowers every bar by eight while it sits.

**`v11RegionWeight(st, r, q)`** is what a region is worth in the return, at both
sites that weigh them. It exists because the *Article of the Equal State* says
"each state shall count alike in the return" and, until S15e, the return was the
one thing it did not touch: `q.pop` was inline at both sites and the article's id
appeared once in three megabytes, in its own definition. Under
`acts.equalStates` every region counts one.

**`v11ConEffects(st)` is the one place that computes, on the `v10OrderMods`
pattern — recomputed, never cached.** EVERY field has a named reader, and the
comment above it says which:

| field | reader |
|---|---|
| `term` | `isBallotTurn` |
| `capital` | `capitalIncome` |
| `ratify` | `v11ConThreshold` |
| `franchise` | `franchiseLevel` |
| `autonomy` | `v11AutonomyPressure` (S11c) |
| `emergency` | `securityState` |
| `libFloor`, `ind` | `indicatorTargets` |
| `unrest` | `unrestTarget` |
| `polCost` | `policyCost` |
| `rev`/`exp` | `budget` |
| `senate` | `v11ArtSupport` — a party's stake in the upper house decides how it votes on the upper house |

A change that is a permanent **fact** about the state rather than a standing
modifier — seating justices, ending a veto, changing the electoral system — is
done in the article's own `apply()`, not aggregated. There is no such thing as
half a justice.

**`franchiseLevel` MUST return an integer in 0..2.** Three consumers index a
three-element array with it: `b.fr[fr]` in `supportTargets` (:6788 — the ballot
weight itself), `b.fr[fr]` on the Parties page, and a three-element label array
on the Overview. A fractional level reads `undefined` out of all three, and
`b.pop * undefined` is **NaN propagating into the vote model with nothing on
screen to say so**. Article contributions may be fractional — two half-steps
make a step — but the sum is rounded and clamped, and `roads.js` sweeps all
**128 subsets** of the seven franchise articles asserting both the domain and
that `supportTargets` stays finite.

**`isBallotTurn` generalises without moving anything.** It was
`t > 1 && t % 2 === 1`; it is now `t > 1 && (t - 1) % term === 0`, which is the
same function at `term = 2`. It reads the global `S`, in the idiom `actBlocked`
already uses — the function takes only a turn number and all five call sites
pass nothing else — and calls `v11BallotTurnBase` whenever the document says
nothing about the calendar. `roads.js` checks the identity at **every turn of a
full epic**, because a silent off-by-one here moves every ballot in every save.

**`actBlocked` was broken and is fixed.** Its first line was
`if (a.house !== 'Senate') return false`. But `house` on an ACT is the **book it
is filed under on the page** — 'Senate', 'Supreme Court', 'Elections' — not the
chamber that votes on it, so a Senate with a full veto sat and watched every act
it was not itself the subject of go straight past. It now considers any act,
using the same lean `actCost` already assigns by book, and keeps all three
original exemptions: two are how a suspended Senate is restored, the third is
the act that makes it elected. Measured: **6 of 25** non-Senate acts are now
refused by a hostile Senate that previously refused none.

**The constitution came home.** Twenty of the thirty-two constitutional acts
rendered on other tabs and nowhere here, and `S.precedents` — which gates two of
the transitions *on this very page* — was earned on the Executive page and shown
to nobody. Both are on the tab now.

**The eight books and the acts panel arrive COLLAPSED** (`v7DefaultCollapsed`
reassigned, alias `v11dDefaultCollapsedBase`); the document and what is before
the country do not. Every book title is distinct after `v7FoldKey`'s
normalisation — asserted, because that normalisation strips a trailing number
and lowercases, and one shared key would govern several books at once.

## The ministry and the interests (S11e)

The owner's complaint on both tabs was the same — "lots of repetitive low
impact options". Four surveys measured the arithmetic behind it in the running
game. Every figure below is a measurement, not a reading.

### What was wrong, in numbers

| action | before | why it was dead |
|---|---|---|
| **Brief** | +5, clamped to **100** | the session tick clamps to **96**, so briefing above 91 was **silently refunded** the next session — measured: 3 of 5 points |
| **College** | `max(2, 8 - experience)`, then **+3 experience** | +5 once, +2 for ever, for 2 capital **and 4 of treasury** against Brief's 2 capital and no money: strictly dominated from the sixth session, and worse each time it was used |
| **Sideline** | cut the department's **rank** | the only paid action in the game that made the government worse at *everything* |
| **Initiative** | shoved the indicator **stock** | the tick converges every stock on its target at **26%** a session: measured, **84% gone after six** |
| the seven **traits** | — | six of them were read **nowhere**; only `operator` appeared outside a card, in one exposure term |
| **influence** | `influence: g.base`, written **once** | printed the same **540** in every campaign of every save, and the demand generator sorts on it |
| relation ↔ bloc | **a circle** | the relation's target read the bloc; the `blocTarget` wrapper read the relation straight back |
| **endorsement** | ~0.6% of the vote | and **cleared for every group at every election** — the event it is bought for |

### The department

The fix is not more buttons: it is **a department between the minister and the
country**, so that briefing, funding and delivery have somewhere to accumulate.
`st.v11.depts[key] = {funding, strain, delivered, cases}`, created-on-write.

- **`v11DeptCapacity`** — competence, rank, the funding settlement, less strain,
  plus the minister's trait. The number the whole page turns on.
- **`delivered`** — the durable stock an Initiative now moves. It decays at
  **3.5%** a session against an indicator's 26%, so work done in a department is
  still there at the next election. Measured: **81% retained after six sessions**.
- **`V11_FUNDING`** — lean / standard / generous, a real line in `budget()`
  (which was blind to the government that spends it: sixteen ministries and not
  one of them cost anything to run). **Costs are relative to standard, and
  standard is free**: a first pass priced standard at 4, so simply *filling* the
  cabinet — which the game encourages everywhere else — added 64 to expenditure
  on a base of 149 and took the session balance from −26 to −92, a large balance
  change arriving silently through a default. Standard is already inside
  `budget()`'s own base. Measured now: generous costs 5 a session and buys 10 of
  capacity; lean saves 3 and costs 8. All sixteen generous is +80; all sixteen
  lean is −48, turning a −26 session into +20 at the price of capacity and the
  strain that produces standards cases.
- An **overstretched** department (strain > 34) produces its **own** standards
  case — a consequence of how it has been funded rather than of who was
  appointed to it.
- All of it reaches the country through **`cabinetBonus`**, the real channel
  from a ministry outward, which previously knew only competence and rank.

**`V11_DEPT_REF` is derived, not sampled.** The department's contribution to
`cabinetBonus` subtracts a reference performance. A first pass guessed `.55` as
"the old model's rough midpoint" — but a fresh cabinet's median performance is
about `.25`–`.31`, so **every typical department was handed a silent penalty**
of roughly `−.13 ×` its effects: a nerf nobody asked for, arriving through a
constant, and visible in pacing as an epic-length drift. A second fresh cabinet
then read a different median, so a number taken from one sample is fragile
either way. The reference is what a **defined** department produces —
competence 65, rank 1, standard settlement, no strain, no delivered stock, no
trait: `(65 − 40) × 1.05 × .01 = .2625`. A department at that reference
contributes nothing extra; what is felt is the variation around it.

**`V11_TRAITS`** gives all seven traits a number across seven fields, each
consulted by a named function: `capacity` → `v11DeptCapacity`, `loyalty` /
`exposure` → `pv5MinisterTick`, `strain` / `scandal` → `v11DeptTick`, `bills` →
`billForecast`, `unity` → `pv5MinisterTick`.

**The college now buys the one thing a briefing cannot: the ceiling.**
`v11MinisterCeiling` is `96 + schooled * 2`, capped at 102, and the tick gives a
schooled minister back the headroom rather than dragging them to 96. Brief's
gain **tapers** toward the same 96 so no part of it is ever refunded.

### The interests

- **Influence moves.** `v11InfluenceTarget` reads the bloc it speaks for, how
  much of the country that is, what that speech is worth, the access granted and
  how clean the state is. Measured: 540 → 604 over twenty-five sessions.
- **The circle is broken one direction at a time.** `v11RelationTarget` no
  longer reads the bloc level at all: it reads the group's **own** drivers —
  party fit, access, demands met or refused, endorsement. The bloc goes on
  reading the relation. Influence runs *party conduct → organisation → bloc*.
- **An endorsement buys three things**: it mobilises its bloc while held; it
  takes a **real point** off any statute that bloc wants (12% and floored at a
  whole point — a first pass took 7% and `Math.round` handed it straight back on
  most of the book, which is the same low-impact defect this slice exists to
  remove); and it **survives one ballot** and lapses at the second.
- **`V9_REGION_BLOCS`** has held a per-region bloc composition since S9 and only
  ever printed tags. An organisation close to the government now lifts the
  regions its bloc is concentrated in. Deliberately small (`.045`, clamped to the
  same `V11_REGION_SPAN`) because it rides on the S11c regional term tuned
  against a measured seat target: holding every organisation close is worth
  **+15 Assembly seats**, shutting them all out costs 5, and S11c's own
  eight-governor sweep measurement is **unchanged at +44**.

### The one reassignment that is not a wrapper

**`pv5MinisterAction`** is reassigned, not wrapped: the four repriced actions
have to *replace* their old bodies, and a wrapper that ran the base first would
**spend the capital twice**. Every action this slice does not touch is delegated
back to `v11MinisterActionBase` unchanged.

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

## The ladder (S9f) — four rungs on every statute

**`rungs:` — what each rung DOES, in words (S12).** Four strings on the statute
itself, one per rung, rendered under the mechanics line in `v9Dossier`'s ladder.
Rung 0 has nothing to say: "Repealed or never enacted" is complete.

**The array is EXACTLY four long.** The renderer indexes `p.rungs[lv - 1]`, so a
five-element array (someone helpfully writing a rung-0 entry) shifts every
description down one rung across the whole book, and the text stays present,
plausible and wrong. Nothing in the game would notice. `tools/rungs.js --check`
asserts the length and `roads.js` asserts it again on the shipped objects.

**Inline on the statute, not a lookup table keyed by id.** A table goes stale
silently when a policy is renamed, and six sequential content batches would all
append to the same literal, so every rebase conflicts inside it. Inline, each
category sits in its own contiguous region of the three policy arrays
(`POLICIES`, `V10_POLICIES`, `V10_POLICIES_II`) and the batches never touch the
same hunk. It also puts `rungs[2]` and `eff3:{...}` on adjacent lines, which is
the only way a reviewer can check that the prose narrates the key that actually
appears at that rung.

Not `desc2/3/4`: the numbered-suffix convention means *cumulative override with
carry-forward* (`ladderAuthored`), and prose has no carry-forward.

**Reached by a forward hook, not a reassignment.**
`(typeof v12RungSay === 'function' ? v12RungSay(p, i) : '')` inside the ladder
loop, the same idiom `v10OrderPanel` uses at :9754 to call from v6 into v10.
Reassigning `v9Dossier` would have copied an eighty-line function to change one
concatenation and left an unreachable body wearing an alias.

**The CSS is a `<div>` and a two-class selector, both deliberately.**
`.sheet p` is specificity (0,0,1,1) and beats a single-class `.rung-say` at
(0,0,1,0) **whatever the source order**, so the prose would have rendered at
15px, larger than the 12px mechanics line above it, and the rung would read
upside down. Source order does not save this one. The playtest asserts the
computed size.

**NOT in `v7Index` (:14560) and NOT in `policyCard`'s `data-search` attribute
(:9408).** The first is rebuilt on every keystroke of the command palette; the
second is written into all 582 cards on every `render()`. The one-line `desc` is
in both already and stays; half a megabyte of rung prose is not joining it.

**`tools/rungs.js`** briefs, splices and checks. `--apply` is idempotent: a
second run is byte-identical, which is the proof the splice landed where it was
aimed. Run `node checks/run.js` after every apply, because these are
single-quoted literals and one unescaped apostrophe stops the game booting.

## The listed and the open (S12)

`policyOpen` governs what may be **enacted** and what `purgeStatutes` strikes
out of a save. `v12Listed` governs what the policy page **shows**. They are
deliberately different.

Eleven core statutes are gated (four to the Emergency form, one to a
prerequisite statute, six to a world condition) and the page used to omit them,
so Authority read 19 of 24 and five other books read 23. A player counting the
page could only conclude the book was unfinished. They now render **locked**,
dimmed, with no draft button and the reason `policyWhy` already knew how to
give. Every core category reads 24.

**Scoped to the twenty core categories.** Imperium, People's State and The
Charter are whole alternate statute books; showing those everywhere would put
three unreachable books on every page. A book struck by the constitution in
force (`CLOSED`) also stays struck: that is a consequence the player chose, not
a gate they can work toward.

**Never widen `policyOpen` to achieve this.** It would let a government pass an
emergency statute under a Federal Republic and would rewrite every campaign in
progress. `roads.js` asserts it is unchanged.

`P(o)` (~670) is the funnel every policy literal passes through and the ONLY
place a level curve is built. It sets `max = 4` on everything, records the old
ladder as `lin`, and expands four channels into five rows each:
`_effAt` / `_moodAt` / `_revAt` / `_expAt`, indices 0-4.

- **Authoring form**: `eff`/`mood`/`rev`/`exp` are the rung-1 row.
  `eff2`..`eff4` (and `mood2..4`, `rev2..4`, `exp2..4`) are CUMULATIVE TOTALS
  at that rung, restating only the keys that change; anything not restated
  carries forward. Per channel: if any `<key>2..4` exists the channel is
  authored, otherwise it is interpolated from `lin`. **Since S9h every one of
  the 582 statutes is authored** — the interpolation is the fallback for
  anything added later, not a live path, and roads.js reports when it has
  nothing left to check rather than passing over an empty set.
- **The curve grammar** every statute is written to: rung 1 the pilot, rung 2
  the programme, rung 3 the second order (a key that appears only at scale),
  rung 4 the whole instrument plus a cost it did not have lower down. Rung 4
  on a key the statute already had must equal what that statute always
  delivered at full build — `tools/fullbuild-baseline.json` froze all 451
  pre-S9h full builds and their materialized `auth`, and roads.js checks
  every one. Regenerating that file is a balance decision, not a chore.
- **Interpolation** (`ladderMults`): a statute with old maximum m has its old
  rungs at new positions `round(n*4/m)`, and rows between them are linear.
  m=2 → 0/.5/1/1.5/2 of the base, m=3 → 0/1/1.5/2/3, m=1 → quarters, m=4 → the
  identity. Exact at every position a rescaled save, seed, want or programme
  target can occupy — `tools/roads.js` asserts this per statute per channel.
- **Read the rows, never a base × a level**: `polEffAt/polMoodAt/polRevAt/
  polExpAt(p, lv)`, `polEffDelta(p, a, b)` and `polMoodDelta(p, a, b, k)`.
  Every one-shot mood impulse in the game is a `polMoodDelta`; there are seven
  (assent, sequestration, purge, executive order, two court paths, sunset
  lapse) and five step-readers that quote one (bill forecast, referendum
  forecast, `v9PublicSupport`, `v9RegionalRead`, interest-group demand).
- **`auth` and `cost` are materialized at parse.** `auth` freezes from the
  rung-1 row so authoring a curve later cannot move a statute on the map;
  `cost` is scaled by `(1 + .6(m-1)) / 2.8` so a full build costs what it
  always cost, in four instalments instead of m. This is why `lin` survives
  S9h: it is no longer read for effects, but the cost rescale needs it, so
  the literals keep their original `max:` and P() reads the old ladder from
  it. Do not "tidy" `max:2` to `max:4` in a literal — that silently makes the
  statute more expensive to build out.
- **Ladder-unit rule**: any term multiplying a raw ladder POSITION halved its
  coefficient in S9f (securityState 2→1, blocTarget's authority distance
  .9/.5→.45/.25, agendaStrain .15/.07→.075/.035). A rung is half what it was
  for the 233 statutes that had two.
- **Positions in literals are on the new ladder.** Gates, court-case
  conditions, event conditions, `franchiseLevel`, party `wants`, programme
  `items` and scenario seeds were all rescaled by `round(n*4/m)` in S9f — 219
  sites — and the 24 ad-hoc linear terms took `k*m/4`. Adding a gate means
  writing it against four rungs.
- **The works** (S10d). 48 distinct. `V8_WORK_MODS` are the mid-flight
  instruments; `v8WorkFactors(q)` folds a work's `q.mods` into one factor set
  (rate, overrun, costMul, payout, regionMul) read by `v8WorkPerSession`, the
  overrun roll and `v8CompleteWork` together — so a scaled-back work delivers
  less of everything at once. A cost change applies only to what is LEFT to
  build. **No two works may share a NAME**: the id-keyed merge guard cannot
  see that collision, which is how two Somnium Sea Walls shipped, and roads.js
  asserts it.
  - **Berths** (S15c). `V8_WORK_MAX` is a table, one entry per tier
    (10/4/3/2/1); it replaced a ternary that gave five tiers three values, so
    the three hardest all read 2. What you commission past the last berth goes
    into `st.v8.queue`, a list of ids added to the save shape by
    `v8EnsureState`; nothing is charged to join it and `v8QueueTick` — called
    at the end of `v8WorksTick` — takes the head and pays the commission the
    session a berth opens.
  - **What a work costs is not what it builds.** `v8WorkPerSession` is the
    instalment the SITE is credited with and is deliberately unscaled, or a
    work would take longer on an easy tier than on a hard one.
    `v8WorksSpend` is what the TREASURY is charged for it, and since S15c it
    multiplies by `d.exp` like every other line of federal spending. The base
    `budget` applies `d.exp` internally and the v8 wrapper adds `b.works`
    afterwards, so until S15c the works were the one expenditure difficulty
    never touched.
  - **The site effects are paid once, at the root of the count.**
    `v8WorksTick` gathers unemployment, Labour mood, corruption and unrest
    across every active site and applies the sum scaled by `sqrt(n)/n`. They
    were per-work and unbounded, which was a rounding error at six berths and
    three quarters of a point of unemployment a session at ten.
- **Committee chairs** (S10e) are apportioned by seats (`pv5ApportionChairs`,
  largest remainder) and are NAMED people with a party, a temperament and a
  year. `pv5AssignChair` hands one out while you lead. Four older affordances
  promise a chair and touch no committee state — they are the reason the
  feature looked implemented.
- **Powers** (S10e): 11. `st.powers` is written as a whole literal in FOUR
  places and two consumers read it raw, so a new power needs `v10EnsurePowers`
  in the enrich chain or an old save yields `Math.max(undefined, n)` = NaN.
  Since S14 `clamp` announces that instead of passing it on, so the save shows
  a fault banner rather than a wrong number. Treaty effects reach the game
  through `indicatorTargets`, like orders.
- **Question Time** (S10f/g): 164 authored questions over 14 subjects — SEVEN
  ways of asking each from the government benches and four or five from the
  opposition, so a subject that comes round twice does not come round in the
  same words.
  **The item is chosen by ROTATION, not by hash, and that is deliberate.**
  `v10QtHash` used to pick it, and a hash of the turn only looks like variety:
  for a fixed subject the value moves by a CONSTANT STRIDE each session, so the
  result is `(stride mod n)` and wherever that shares a factor with `n` the
  campaign lands on a few residues for ever — measured, one subject reached two
  of its twelve questions in two hundred sessions. Each subject now keeps a
  count in `st.v10.qtSeen` and walks its whole shelf before repeating any of
  it, from a per-campaign offset. The count advances INSIDE the once-a-session
  guard, so re-rendering cannot move it, and it rides the save; a save written
  before it existed has no `qtSeen` and starts clean.
  Every question's `{placeholders}` must be ones its own SUBJECT supplies
  (`v10QtContext`'s per-subject fill, plus the four globals `leader` `party`
  `opp` `year`); anything else prints the braces verbatim at the despatch box,
  and `roads.js` refuses it. **Selection must never spend a die** — `v8EnsureQuestion` is called
  from the RENDER path (`v8Badges`, the chamber view), and `render()` runs on
  every action and tab change, so a roll there makes a campaign's dice depend
  on how often the player looked at a tab. The pick is a hash of turn, subject
  and seed. Each authored reply's `tone` maps onto one of the four effect paths
  that already existed; the material is new, the arithmetic is not.
- **The political papers** (S10f): 32 authored types on top of the eleven the
  v4 base had, on the proven three-edit seam — `addInbox` with a type, an
  `inboxChoices` arm, a `respondInbox` arm. The engine prices a paper's buttons
  BY POSITION and reads EXACTLY THREE choices, so a paper with two or four
  loses a button silently; `roads.js` refuses one. Papers are written, not
  templated: a `{placeholder}` in a title or body is a defect, not a feature.
- **The order book is NINETY, uncapped, and entirely national** (S11b, S15b).
  There is **no limit on standing orders**. `v10OrderMax` was `var n = 4` with
  two-slot bonuses, read in three places and asserted by no harness; because the
  check ran before cost and independently of target, and every card calls
  `v10OrderOpen`, a government at four had every button on all 72 cards disabled
  and the same refusal printed 72 times. What limits the book now is what always
  should have: **every order in force charges its upkeep against `capitalIncome`
  every session it stands.** Sixty ungated national orders signed at once cost
  20.5 capital a session, and the arithmetic says no long before a number does.
  **No order names a state.** Thirteen made the player pick one and delivered a
  regional payload there; twelve of the thirteen already carried national `ind`
  and `mood` on top, so the target was the smaller half of what they did. They
  carry `nationEff` now, which is `regionEff` for an order that names nothing:
  the drift reaches every region at a fifth of what the concentrated version put
  in one. `target` survives for **power** (11 orders) and **work** (1), because
  a foreign power is a different axis from a state.
  The thirty-six S11b added carry **no `needs` and no `req`** — the owner's
  ruling — and are registered **after** the original thirty-six because the
  harness probes used to be positional. They are named through `pick()` since
  S14b, and `pick` earned its keep the first time this book was touched: it
  named `disperseAgencies` as having lost the property it was chosen for
  instead of silently measuring a different order.
  **`O()`'s `req` default (:20352) is load-bearing**: `v10OrderOpen` calls
  `o.req(st)` **unguarded**, so implementing a gate means writing a `req`,
  never removing the default. The panel carries a filter chip strip — the
  gated/ungated split is two of its chips.
  `narrowed` scales everything an order delivers by `.72` per narrowing **except
  the upkeep**, because a smaller instrument still has to be administered;
  `upheld` quarters an order's exposure, so surviving a review is worth having;
  and `m.courtHeat` — the exposure of the whole standing book — reaches the
  court's hold roll instead of being summed into a field nobody read.
- **The order book** (S10c). `V10_ORDERS` / `V10_ORDER`, registered through
  `v10RegisterOrders`. An order is NOT a statute: three rules decide what
  belongs — it TARGETS state no statute reaches (region, power, work, issue,
  contractor, committee); it is a STANDING modifier, not a one-shot (that is
  the line against the 72 `ACTIONS`); and it LAPSES when you lose the
  department that signed it (the line against the 23 `EXTRA`, which are
  permanent). A candidate that fails any of the three is a reskin.
- **`m.book` is what an order does to the ORDER BOOK** (S15b). The whole
  "Orders about orders" category — five cards promising expiry, a pre-ballot
  bar, a week on the table, an Attorney's opinion and a printed register —
  delivered `ind`, `mood`, `delivery` and `polCost` like any other order and
  touched the book nowhere. Four fields now: `expire` (an order is stamped when
  signed, so a rule arriving late does not retroactively kill the standing book
  and a rule that is revoked does not resurrect what it stamped), `lay` (a new
  order waits on the table, and with the Assembly abolished there is no table so
  it does not), `preBallot`, and `review` (the register raises what the court
  sees of the book and the Attorney's opinion lowers it, and they compound).
  **Both self-applying rules apply to themselves**, because the record is
  written before the book is read.
- **`onIssue` / `onRevoke` is the hatch out of the fifteen fields.** The engine
  has called it at four sites since S10c and no order defined it until S15b.
  Three do: `decreeMachinery` and `loyaltyOath` raise `decreeFavour`, and
  `standingConvocation` raises `councilFavour` and lowers `decreeFavour` — the
  first time an order has reached anything outside its own aggregate fields, and
  it reaches the S15a chamber model. An `onIssue` that moves a STOCK does not
  reverse: `loyaltyOath`'s purge is one, and its card says so in the last
  sentence rather than leaving a modifier quietly behind.
- **Standing effects bend TARGETS, never stocks.** `tickTurn` moves each
  indicator a quarter of the way toward `indicatorTargets(st)` per session, so
  an order in force shifts the target and the country drifts; revoke it and
  the country drifts back. `v10OrderMods(st)` is rebuilt from the orders in
  force on every call and CONSULTED, never accumulated — that is what makes
  revocation exact and an old save free of drift. Never write an order effect
  as a per-session delta on `st.ind`.
- **A modifier nothing reads is a lie on the card.** `delivery` scales
  `cabinetBonus`, `works` scales `v8WorkPerSession`; both were computed and
  consumed by nothing when first written. Anything added to `v10OrderMods`
  needs a consumer in the same commit.
- **`orderPolicy` is retired.** An order no longer raises a statute. The rule
  it carried survives as `needs:` on an order and `tools/roads.js` asserts it
  against the new book. Its panel heading was a saved fold key, remapped
  `exec|executive orders` → `exec|the order book` in `V7_FOLD_REMAP`.
- **`outright(st)`** is a predicate BESIDE `standing()`, never a fourth value
  of it: `standing()` has twenty consumers testing string equality against
  `'leading'`. It keys on `playParty`, not `st.ruling`, or a junior partner
  under a majority government inherits the power to kill bills.
- **Gate a bill lever where it ACTS, not only where its button is drawn.** The
  committee panel is the cautionary tale: four actions rendered for every bill
  with a handler that checks nothing.
- **Who ages.** `ageRoster(st)` returns the list of people who age each session
  and `ageSucceed(st, rec, died)` seats their successors; `ageFigures` walks
  the one and calls the other. The v10 chunk wraps BOTH to add ministers and
  governors. Anything added to the roster must not be aged anywhere else —
  `v6GovernorsTick` used to increment governors itself, and two increments a
  session is how a governor reached 120. A minister's death leaves the post
  vacant; a governor's is filled by their own party for the rest of the term.
- **The state ballot** is counted in BALLOTS, not turns: `st.v6.ballotNo`
  increments once per federal ballot and `v6RegionSlot(r)` (region index / 2)
  picks the two regions due. `v6NextRegionBallot` is the one place the next
  ballot turn is derived — the card reads it rather than searching forward for
  a turn that matches, which is what made the printed year recede.
- **Names**: `GIVEN`/`SURNAME` are pushed, never rewritten. Dedupe against the
  living cast happens in the FACTORIES (`makeFigure`, `v6MakeGovernor`), not in
  `makeName()`, which takes no arguments and cannot see the state. Retries are
  bounded at six. `V10_REGION_NAMES` weights a governor's surname by region and
  never restricts it.
- **`flash()` falls through to `toast(msg, true)`** when `#turnHint` has no
  `offsetParent` — the hint is `display:none` below 1180px. Ask the element,
  never the viewport: a width test here would be a sixth breakpoint.
- **An unreadable save is copied to `<key>.unreadable`** before the session
  writes over its key, because the setup sheet promises it was left untouched.
- **Two policy pushes** now follow the array literal: `V10_POLICIES` (S9e, 34)
  and `V10_POLICIES_II` (S9g, 131 — the twenty core categories brought to 24
  each). Both use the same `if (!POL[p.id])` guard; both must stay AHEAD of
  the programme pushes, which drop unknown item ids. The S9g entries are
  authored on four rungs from birth, so their `lin` is 4 and every channel
  carries an override — an unauthored channel would fall back to the identity
  interpolation and scale a flat effect up the ladder, which is why the
  generator emits `eff2:{}` rather than nothing for a channel that never
  changes.
- **Saves**: `enrichState` rescales `st.pol` once and stamps `st.polV2`;
  unstamped blobs are migrated and the player is told on the setup sheet
  (`[data-ladder-warning]`), including a count of statutes dropped because
  they are no longer in the book. Fresh states carry `polV2: true` in the
  literal, so a new game is never rescaled.

## The descent engine (S9d)

The machinery that makes leaving the republic a real system rather than nine
inert latches. All of it drives through EXISTING registries and functions —
the owner's "integrate, don't bolt on".

- **`securityState(st)`** (v4, beside `unrestTarget`): derived, never stored —
  Σ level×`polAuth` over Authority+Security statutes (the coefficient was 2
  before S9f halved the rung), +12 stateOfSiege, +6
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

## The roads (S9e)

The content the descent engine carries, ALL of it added through the proven
push idioms from the v10 chunk — nothing redefines an existing entry.

- **`FORMS.syndicate`** "The Chartered State": the oligarchic terminal that
  corporate was missing (its only exit used to be back to federal). Elections
  stay ON — the weighted register is the sham. Full row: CLOSED.syndicate,
  RITUAL.syndicate, `toSyndicate` from corporate (charteredSenate +
  wealthFranchise + tech 65 + treasury 200 + securityState 30), its own ending
  line in finish(), restoration-only exit.
- **The first POLICIES push in the file's history** (34 new): The Charter book
  (20, `forms:['corporate','syndicate']`, cat 'The Charter' — CATS.push), the
  open-book descent enablers (6, needs-laddered: fusionCentres, facialRegister,
  predictivePolicing, protestDatabase, secretDockets (req: courts stripped or
  elections off, with reqText), passportControl), oneparty/dpr deepening (4),
  emergency exclusives (4). Programme pushes MUST follow policy pushes (9985
  drops unknown item ids). Plus 8 `needs:` ladders added to the existing
  Authority/Security book (internment←politicalPolice etc.).
- **33 road events** (V10_ROAD_EVENTS → EVENTS.push): repression spiral ×8
  (incl. `v10crackdownRadicals` — the crackdown radicalises them), capital
  road ×10, sham-election theatre ×5, praetorian ×5, road-back ×4
  (`v10succession`/`v10planFails`/`v10charterFlight` open the restoration;
  `v10amnestyDividend` pays the thaw). tools/roads.js constructs every one
  against the REAL `eventOpen`.
- **Two arcs**: `capitalCapture` "The Offer" (the charters fund the programme →
  the regulator's price → the merger or the repudiation; grants a time-boxed
  charteredSenate discount via a v10 `actCost` wrapper) and `praetorian` "The
  Guardians" (the toast → the list → the guarantee; refusing sets
  `praetorianPact`, accepting sets `praetorianGuarantee`).
- **Opening goals for the four scenarios that had none** (V8_GOALS parity
  11/11): patriotMajority, corporateRepublic, imperialFederation, twoVales —
  three each, v6Scale-aware where scaled, existing 6-capital/3-unity reward.
- **Six records**: chartered, apparatus (ss 65), restorer, ballotTheatre
  (rigCount, scaled 5 floor 2), praetorianPact, openRepublic. These six are
  the ONLY sanctioned change to the epic pacing id set.
- **Three acts of repair**: liftSiege (the siege un-latches), openArchives
  (the truth commission: ss<20 after ssPeak≥45), charterRevocation. All in
  existing houses, so pathPanels renders them with no array change.

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

Parse-time boot: v4 (~8176) creates a **throwaway** `newGame('normal')`; each
chunk re-enriches and re-renders. **Five paints of `#view` at load**, measured
with a mutation observer rather than counted by eye — this line said 6 and the
true figure was 7 until S14 removed the v4 and v5 boot renders, which painted
screens the v6 boot replaced before anyone saw them. v6's boot
IIFE (~11229) opens `startScreen()` (which offers Resume — never auto-resumes);
v8/v9 boots rebuild the still-open setup sheet (it is built 3× per load). The
throwaway game cannot clobber a real autosave: `saveAutosave` requires
`S.started`, set only in `applyDoctrine`. The fonts are the embedded data URIs
described above; there are no font requests and nothing is fetched offline.
Keydown handlers stack (v4
~8021, v5 Ctrl+K ~8866, v7 `/` ~12099); document-level click delegation
accumulates (v8 `[data-v8cmd]` ~13556, v9 `[data-v9cmd]` ~15596).

## Other known fragilities

- `clamp` (~8660, and this entry said 4426 until S14) used to pass NaN through:
  every comparison against NaN is false, so the poison came straight back and
  the caller stored it. **Fixed in S14** and no longer a fragility. Two kinds of
  bad input are now named on screen (`[data-number-fault]`, built by hand, not
  rendered) and in the console, and a bound is returned instead of the poison:
  a value that cannot be ordered against its bounds, and bounds the wrong way
  round. The near-miss that argued for it: S11d had a NaN reach the vote model
  with nothing on screen to say so, caught only by an exhaustive 128-subset
  probe on the branch. The detector then found a live one on its first run --
  `pv5MinisterAction` briefing a schooled minister called `clamp(-.1, 0, -2)`
  and clamped them back to a hardcoded 96, refunding the ceiling the college
  had just sold them. `roads.js` asserts `V14_FAULTS` is empty after all 92.
- `v6Sandbox` (~10712) swaps 9 globals; since S1 the restore sits in a
  `finally`.
- `confirm()` is called exactly once (hall-of-fame clear ~13093) — the playtest
  harness stubs it.
- **One** `Math.random()` site, `rand()`'s pre-game fallback, pinned by
  `math-random-ratchet`; 111 calls route through the seeded engine. S3 (PR #7)
  did the replacement this line used to promise. It said "93 sites; the only
  seeded PRNG is the sandbox's LCG" for eleven slices after that stopped being
  true, in the section a cold session reads to decide whether the game is
  reproducible.
