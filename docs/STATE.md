# Where are we, what's next

Update this file in the last commit of every PR.

## Current slice

**S9f — the Ladder** (PR #21). Four rungs on every statute, and the two
navigation complaints. First of three slices carrying the owner's fourth
order: *every policy gets four levels with a unique set of modifiers at each,
the card previews what extending or repealing would do, the Dossier shows
every stage* — and, separately, *every category reaches 24 policies*.

The engine. `P()` — the funnel all 451 policy literals already passed through
— now expands each one at parse into `_effAt/_moodAt/_revAt/_expAt[0..4]`.
`eff`/`mood`/`rev`/`exp` are the rung-1 row; `eff2`..`eff4` are cumulative
totals, for the authored curves S9g and S9h bring. Until a curve is authored a
statute carries `lin`, the ladder it had before, and its rows are interpolated
through its own rescaled rungs — exact at every position an old save, seed,
want or programme target can occupy, so the four-rung order cost nothing in
balance. `cost` was rescaled the same way: a full build costs what it always
cost, in four instalments.

Nothing multiplies a base by a level any more. The seven one-shot mood
impulses became row deltas, which also deleted v9's staged-bill patch (it
swapped `p.mood` underneath `enactBill` and would never have reached the
tables). 219 literals that encoded a position were rescaled by
`round(n/oldMax*4)` — gates, court cases, events, 41 party wants, programme
targets, scenario seeds — and 24 ad-hoc linear terms took `k*oldMax/4`. Terms
multiplying a raw position halved their coefficient, a rung being half what it
was for the 233 max-2 statutes. Old saves are migrated onto the new ladder,
stamped `polV2`, and the player is told.

The surfaces. The policy card's first tagline is now the STANDING law at the
rung it sits on, followed by what one more rung would add and what giving one
back would take away — in the same row, because compact mode folds the second
one away. The Dossier's ladder reads the real rows, quotes capital on the
rungs you can actually reach, reads the Senate in both directions, and its
constituencies section says what it means (the old heading called a one-shot
impulse a per-level stock). The drafting desk states the rung's own change.

The navigation. A main-tab change lands at the absolute top, every time — the
cross-tab scroll memory that gave one gesture three outcomes is gone, and the
header row is always there when you arrive. Drafting an extension or a
referendum no longer throws you to the Legislative tab.

The morning-review items flagged in PR #20 are ratified as shipped: the
securityState thresholds, BLOC_WEALTH, the Senate reservation, the territorial
formula, the ritual deltas, the toSyndicate gates, the S9e costs and event
weights are all the recommendation. The one deliberate change is
securityState's per-statute coefficient, 2 → 1, which is the ladder-unit rule
above and not a retune.

Next: **S9g — the statute book** (131 new policies, every core category to 24,
authored four-rung curves from birth, `maxBytes` 1.6M → 1.75M with the case),
then **S9h — the curves** (authored rows for the 451 existing statutes, `lin`
removed, the migration becomes a loud refusal).

Previously: **S9e — the Roads** (PR #20, merged). The content the descent
engine carries; with it, the owner's third order is complete.

One new form: **the Chartered State** — the oligarchic terminal corporate
never had (its only exit was back to federal; the capital road ended mid-air).
Elections stay on; the weighted register is the sham. 34 new policies through
the FIRST `POLICIES.push` in the file's history: the Charter book (20 —
charter courts, company towns, scrip wages, the census of assets, franchise
audits, tax farming, the assessment pass...), six open-book descent enablers
laddered by `needs:`, four party-state and four emergency exclusives; plus
eight `needs:` ladders on the existing Authority/Security book, so how you
build the police state now has an order. 33 turn-by-turn events: the
repression spiral (the crackdown radicalises them; the disappeared name; the
bureau inventing its numbers), the capital road (the strike against scrip, the
board moving on your Chancellor, the state margin-called), sham-election
theatre (choose the number; the district that votes wrong anyway), the
praetorian question (the colonels' petition; the exercise on the ring road),
and the roads back (the succession, the plan's arithmetic, the charters'
flight, the thaw's dividend). Two arcs: The Offer (capital captures the
state from inside normal play) and The Guardians (the army becomes a
creditor). Opening goals for the four scenarios that had none (11/11 parity).
Six new records — the only sanctioned change to the epic pacing set. Three
acts of repair: lift the siege, open the archives, revoke the charters — the
descent is playable in reverse.

`tools/roads.js` grew the content proofs: the corporate→syndicate road through
its real gates and home again via the charter flight; ALL 33 events
constructed against the real `eventOpen`; both arcs triggering; every record
and goal throw-free at three lengths; registries at 11/11, 3/3, 3/3, 6/6.

Previously: **S9d — the Descent** (PR #19, merged). The engine half of the owner's third order:
"expanded options and means of changing/altering the course of government...
integrating it into existing functions rather than bolting on new systems...
policies should vary based on the state the country is in."

What was inert, made real. Nine of eleven constitutional acts were pure
latches — `wealthFranchise`, the signature oligarchy move, weighted NO vote
anywhere; all nine now have standing effects (the franchise is genuinely
weighted via BLOC_WEALTH in supportTargets; the chartered Senate holds its
fifth of the seats through every election, totals preserved; the consulate
pins the offices; the siege, the purge, life terms, agency capture, annexation
and the territorial seats all read every turn). The extraordinary measures
were gated by RULING PARTY alone — most governments could never descend,
however far the country had; the door now also opens by the state itself:
`securityState(st)`, a derived scalar over the Authority/Security statute
book (thresholds 30/45/65), feeds unrest suppression with diminishing
returns, liberties/safety/corruption targets, movement fear and the Front's
growth, the court's deference, the price of the next Authority measure, and
the measures gate. A fresh republic measures 0 — the default game is
untouched, and `tools/pacing.js` is byte-identical before and after, id for
id, on every length. The sham election became the confirmation ritual: a
dispatch with a rigging dial, an honest-count gamble, and at police-state
levels the turnout-as-weapon; staged counts are a loan the reckoning calls in
when elections return. `terminal:true` is finally read — leaving the Empire
or the People's Republic needs the restoration crisis (the convention arc
opens the door) and pays a surcharge. `needs:` is enforced on all three
enactment paths (a bill whose prerequisite fell while before the houses now
lapses loudly at assent). `policyOpen` gained `forms:[…]` and per-policy
`req(st)` with `policyWhy` giving every refusal its reason. Dead branches
fixed: the never-printed imperial ending, the `'absolute'` party-ban gate,
write-only conventionLimits. New chunk v10 (baseline 8/8, no ensure function,
dice guard stays outermost by construction). `tools/roads.js` drives the full
authority ladder rung by rung through the REAL guards, proves the state gate
for a centre party, the ritual, the reckoning, the weighted franchise, needs,
terminal refusal + restoration + surcharge, and seat conservation — ROADS OK,
and it fails on the pre-S9d file at its first assertion.

Previously: **S9c — the Atlas** (PR #18, merged). The navigation overhaul the owner ordered:
"Government is both a tab and subtab... things don't seem to logically or
intuitively be grouped together."

Six groups now, one organising principle each, ids g-prefixed so a group id
can never collide with a tab id again: Desk (the brief and the record),
Lawmaking (a measure drafted, passed, and PAID FOR — the ledger finally sits
beside the bills it funds), Government (the offices and the ministry),
Constitution (the order and the court that polices it), Politics, Country. The
double-"Government" died by relabelling the tab "Ministry" (its id — and every
saved fold key and jump literal — unchanged). Group buttons carry data-group
only, so `[data-tab="government"]` is unambiguous at last. Digits 1-6 pick a
group and repeat cycles its pages: six keys cover all fifteen views (five tabs
had NO key before — the map was an ordinal slice that v5's splices had pushed
them out of), and the field guide and council menu derive from the same array.

Misfiled content moved home: domestic protest movements and their handling
actions from World to Nation (merged into one panel), the Society deck to
Nation, the Chronicle to Record, the States deck deduped to Federation, the
Ministry deck to the Ministry page. The pasted-everywhere panels were cut to
canonical homes: Dispatches on 13 of 15 views became 2, the inbox 7 became 3
surfaces (full on Parties, preview on the Desk), the manifesto 5 became 2.
Saved fold preferences follow their panels via V7_FOLD_REMAP — migrated, not
orphaned (proven by the fold-migrate step). tools/tabs.js was rewritten (it
had been dead since S6a removed the rule it spliced) and tools/chamber.js's
group-id-as-tab bug is fixed. Proof against the pre-fix file: government id
collision, 5 dual-attribute buttons, 5 keyless tabs; current file: zero, zero,
zero.

Previously: **S9b — the screen stops jumping** (PR #17, merged). The owner's report — "I click
something and the screen jumps around or resets" — decomposed into nine
mechanisms, each fixed in place:

The window is the scroll container at every tier and same-tab renders had no
scroll handling at all, so the full innerHTML rewrite let the browser clamp
scrollY whenever a view came back shorter; v7's wrapper now saves and restores
around every same-tab render. `flash()` — 74 call sites — scheduled an
unprompted FULL render 1.6 seconds after every "you can't do that" message; it
now restores the hint's own text and nothing else. Seven jump/menu/keyboard
sites forced a smooth scroll-to-top after render, fighting v7's restore with a
double motion (and the phone swipe overrode the restore entirely); v7's
restore is now the single scroll owner. `focus()` without preventScroll at
showSheet/hideSheet/policy-search — long sheets opened pre-scrolled past their
own heading (the old fallback grabbed the first button ANYWHERE in the sheet),
and closing a sheet scrolled to a node the next render destroyed. The phone
nav animated a smooth re-centre on EVERY render (now only when the tab
changed) and the phone stat strip forgot its position (now remembered across
the rewrite). Stat chips changed width when a delta appeared, moving the wrap
point and everything under the cursor (delta slot reserved + min-width ≥761).
The modal toggled body overflow with no scrollbar-gutter, shifting the page
15px on open and close (gutter reserved, scoped ≥761 so the phone keeps its
width). The turnbar ResizeObserver now writes --turnbar-h only on real change.

New playtest step `scroll-keeps`: the pre-fix file fails it on three named
mechanisms (key re-press forced 500→4, flash triggered a delayed render,
gutter auto); the same-tab-render, sheet-open and stats-strip sub-assertions
pass on both files and are regression pins, not proofs — stated here so the
step's evidence is not overread.

Previously: **S9a — nothing is lost quietly** (PR #16, merged). An independent survey after S8d
found a cluster of defects on the one thing the agreement calls the worst
possible failure — the player's record lost silently — and the worst of them
was not the one S8c fixed.

The hall of fame silently destroyed itself: `v8HallRead` caught to `[]` and
`v8HallWrite` caught to nothing, so an unreadable `parliamentVale.hall` blob
read as empty with no warning and the next campaign ending overwrote it — the
one blob a player cannot re-earn. It now has the autosave's S1 contract: an
unreadable blob is reported (in the hall's own render and by toast), left
untouched, and never overwritten; the player's explicit "clear the hall" still
works. A campaign that ended in collapse banked nothing from its dying
session: `checkCollapse`'s two `gameOver` calls fired before any tick — the
same defect class S8c fixed, on the branch S8c did not touch; both endings now
bank first through a shared `v6BankSession` helper. The Record page printed a
raw template: the goal panel was the ONE note read site not going through
`v6Note`, so the default opening showed "Put {n} of your bills on the statute
book". Records and goals could be dated one year after the republic ended
(unclamped `yearOf` at three sites). Smaller truths: `rd_decade` renamed ("A
decade" while requiring `v6Scale(st,12)`), `.goal-mark` finally has a CSS rule
(the percentage was taking the wide grid column), the ending copy no longer
says "the two centuries" on a fifty-year campaign, and the playtest's modal
drain no longer races `v6Pump`'s 40 ms re-open. Every fix ships with the
assertion that would have caught it; all four new steps FAIL against the
pre-fix file.

Previously: **S8d — the flagged leftovers** (PR #15, merged). Four small
items, none a design decision, each carried forward from an earlier slice's
notes.

`breakpoint-tiers` was a membership test wearing a partition test's name, and
five ways past it are now closed with a proof of each: a number used as both a
`min-` and a `max-` edge (so both rules apply at that exact pixel), `em`/`rem`
widths, media-range syntax `(width >= 900px)`, fractional thresholds, and the
one height threshold in the file — `max-height:460px`, the landscape turn bar,
which until now was governed by nothing.

`hemiMap`'s `total` parameter was declared, never read, and promised a
guarantee the body does not make: the arc is drawn from the sum of the seats
object, so a roll short of its chamber's size draws a silently smaller chamber
while every existing assertion still reads "ok". The parameter is gone and the
guarantee is now real — `tools/chamber.js` asserts both houses total their
constitutional size at the opening and after every election. This was the last
open S6 implementation note in AGREEMENT.md bar one, which is marked still
open there rather than quietly dropped.

The campaign-seed copy now says "the same seed and the same **choices, in the
same order**". Only the free tightening was taken: I could not produce a
divergence from choices alone — only from dismissing a sheet versus answering
it — and would not weaken a claim I cannot falsify.

And the board below is corrected twice: PR #12 was still listed as in review,
and S2's note that marker/seam consolidation was **deferred to S6** was
silently dropped when S6a/b/c all merged without it. It is restored as named,
pending work — it is the largest remaining stabilisation item and the next
slice.

Previously: **S8c — the record scales with the campaign** (PR #14, merged).
Thresholds across the achievement array and the scenario goals were authored
against the two-hundred-year span; a fifty-year campaign met them with a
quarter of the sessions. They now scale with `endYear` through one helper, and
the requirement is *rendered* from the live number rather than hard-coded in
the prose. Epic is 1.0 by construction and its record id set is identical, id
for id, before and after. Two defects fixed on the way: the closing session was
never banked (`endTurn`'s end-of-campaign `return` skipped the tick), and the
hall of fame's score summed raw cumulative counters, so a short campaign was
structurally excluded from the top of its own leaderboard. Short closes at
26% / 18% / 26% of the record against 13% / 10% / 15% before; epic unchanged.

Previously: **S8b — the instrument** (PR #13, merged). `tools/pacing.js` was
recomputing every achievement test against the final state; the game *latches*
its records and the displays read the latched map. The figures published in
PR #10 (short 8%, epic 28%) therefore measured the wrong quantity. The tool now
reports the latched map, the id list, a per-test `threw:` list, and the six
counters that gate eight of the length-sensitive records.

Previously: **S8 — pacing, measured** (PR #10, merged). `tools/pacing.js` plays each length option to
its end year through the real turn loop. Findings: all three lengths **do** reach
their end year, and dispatch density is flat at ~1.6-1.8 per session across all
of them — so the fifty-year option is not denser, it is simply shorter. The
record tells the same story: a short campaign closes having unlocked **3 of 39
achievements (8%)**, against 18-23% for a century and 21-28% for two hundred
years. A retune is reserved to the user; three options are put to them in the
PR. Harness caveat, stated in both: it always takes the first choice on offer,
so it loses government early and never initiates a referendum or a treaty — the
achievement figures are a floor, not a typical player's experience.

Previously: **S7 — onboarding** (PR #9, merged). The setup sheet asks its two real questions with a
line each on what they decide, and folds length, difficulty and the house rules
into one disclosure that names them. Also closes the colour-vision question
flagged in S6b and S6c: `tools/seats.js` now simulates all three dichromacies,
and every pair that collapses is an ADJACENT pair — exactly where S6b put the
aisles and the direct labels. The palette needs no change.

Previously: **S6c — the chart vocabulary** (PR #8, merged). Both line charts rebuilt on one shared
helper: every series now ends in its current value, in its own colour, with
leader lines where the declutter moved a label. Narrow screens open a chart on
the present instead of the oldest session. The two items deferred out of S6a and
S6b are closed here — the turn bar is opaque, and the chamber legend no longer
repeats the seven numbers the direct labels already give.

Previously: **S3 — seeded dice** (PR #7, merged). All 93 `Math.random()` sites route through one
seeded engine whose state rides the save, so a campaign is reproducible from a
seed the player can type at setup and read back in the save dialog. Seven
determinism properties are asserted by `tools/determinism.js`, which found two
real bugs in the implementation — construction-time rolls drawn from the
previous game, and a `var seed` local that hoisted over the campaign seed.

Previously: **S6b — the chamber** (PR #6, merged). The seat map rebuilt to the design rulings:
aisles between blocs, a direct label on every bloc, seats rimmed in the ground
colour, and the two invisible party colours lifted along their own hue (RSF
contrast 1.90 → 2.68 at 0.4° of drift, PNL 1.35 → 2.86 at 7.8°). Seats render
about 75% larger on a desktop. `tools/chamber.js` and `tools/seats.js` make all
of it re-measurable, and both caught real defects in the first draft.

Previously: **S6a — three real tiers** (PR #5, merged). Thirteen width thresholds collapsed to
five, and all five are tier edges: 420, 760/761, 1179/1180. The desktop now
uses the window (21% of a 1500px screen was unused, now 4%), and the tablet
band is a tier with its own layout instead of a narrow desktop wearing half the
phone's chrome. Ten queries deleted as provably dead, five retargeted, one
carried forward — `.gz-cols`, which was the only rule in the sweep doing live
work, and which had left the gazette two-up across 621–760.

Previously: **S2 — chain consolidation** (PR #4, merged). Five dead bodies
deleted after poison-proof (132 lines); five more that a reference scan called
dead were proved to execute at boot and kept, with MAP.md corrected. Dead-body
ratchet 10 → 5, which is now its true floor.

## Slice board

| Slice | Status | Notes |
|---|---|---|
| S0 agreement + tooling | **merged** (#1) | checks/, tools/, docs/, hook, skill, permissions |
| S1 correctness | **merged** (#2) | ratchets moved: strict 7/7, stale bindings 0, orphans 10 |
| S2 chain consolidation | **merged** (#4) | 5 orphans deleted with poison-proofs; 5 'orphans' proved live at boot and kept; ratchet 10→5 (its true floor). Marker/seam consolidation deferred to S6, where the restyle needs the seams |
| S4 look mockups | **done — Ministry Precise chosen** | two rounds (5 directions, then 3+3 runoff) at claude.ai/code/artifact/6f9de079-1c31-4c8c-a2f9-03f018069e57; tokens + type recorded in AGREEMENT.md; finalist screen set (Overview ×2, Drafting Desk, Election Night) on the canvas |
| S5 token foundation | **merged** (#3) | tokens retuned, 7 faces embedded (128 KB measured), no external references, allowlist empty; figures on the tabular mono face |
| S6a three tiers | **merged** (#5) | 13 thresholds → 5, all tier edges; desktop waste 21%→4%; tablet given a real layout; `tools/tiers.js` + `tools/tabs.js` measure it |
| Review fixes | **merged** (#12) | 2 real defects + 6 smaller ones from an adversarial pass; chamber tool now replays awkward seat shapes, determinism gains an 8th property, tab-tour stops counting attempts |
| S8 pacing | **merged** (#10) | measured, not retuned: all lengths reach their end year, density is flat; the call is the user's. Its published record shares were wrong — the instrument recomputed instead of reading the latched map (corrected in #13) |
| S7 onboarding | **merged** (#9) | two guided questions, the rest behind one disclosure; playtest gains `setup-trimmed`; CVD measured |
| S6c charts | **merged** (#8) | one chart vocabulary, end-value labels, charts open on the present; region tiles carry their winner as an edge |
| S3 seeded PRNG | **merged** (#7) | one engine, state on the save, seed typed at setup and shown in the save dialog; `tools/determinism.js` asserts 7 properties |
| S6b the chamber | **merged** (#6) | aisles, direct labels, ground rim, two hue-locked lifts, seats +75% on desktop; `tools/chamber.js` + `tools/seats.js` |
| S8b the instrument | **merged** (#13) | pacing tool read the latched map instead of recomputing; the PR states plainly that PR #10's published figures measured the wrong quantity |
| S8c the record scales | **merged** (#14) | thresholds scale with `endYear`, requirements rendered not hard-coded; closing session now banked; hall score made span-relative; epic byte-identical |
| S8d the leftovers | **merged** (#15) | breakpoint check made a partition test (5 proofs); hemiMap's false `total` dropped and the guarantee moved into `tools/chamber.js`; seed copy tightened; this board corrected |
| S9a nothing lost quietly | **merged** (#16) | hall gets the S1 loudness contract; collapse endings bank their session; the one raw `note` read site fixed; year clamps; 4 new playtest steps, each proven to fail pre-fix |
| S9b the screen holds still | **merged** (#17) | nine jump mechanisms fixed in place; v7's restore is the single scroll owner; `scroll-keeps` step discriminates on three of them |
| S9c the Atlas | **merged** (#18) | six coherent groups, ids collision-proof, Ministry relabel, 6-key keyboard covers all 15 views, misfiled panels rehomed with fold-pref migration, tabs.js rewritten |
| S9d the Descent | **merged** (#19) | securityState + state-gated measures; nine latch acts get teeth; confirmation ritual + reckoning; terminal real; needs on all paths; v10 chunk (8/8); `tools/roads.js` ROADS OK |
| S9e the Roads | **merged** (#20) | the Chartered State; 34 policies (first POLICIES.push); 33 events; 2 arcs; 11/11 goal parity; 6 records; 3 acts of repair; roads.js content proofs |
| S9f the Ladder | **in review (PR #21)** | four rungs on every statute via `P()`; `lin` interpolation parity-exact at every reachable rung; 7 impulses → row deltas; 219 position literals rescaled; loud save migration + `polV2`; card/Dossier/desk surfaces; tab changes land at the top; drafting stays on the policy page |
| **Marker/seam consolidation** | **pending — next slice** | deferred out of S2 to S6, then silently dropped when S6a/b/c merged without it. 21 literal splice markers; dead-body ratchet 5 → 0. The largest remaining stabilisation item and the user's stated co-priority |

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
  unseeded randomness pinned at 1 call (rand()'s pre-game fallback; was 93
  before S3), width thresholds pinned to the five tier edges and heights to the
  one (460, the landscape turn bar — added in S8d, when the check learned about
  the height axis), size cap 1.6 MB (file now 1.43 MB with fonts embedded),
  external allowlist **empty and staying empty**.
- Both items deferred out of S6a and S6b are closed in S6c: the turn bar is
  opaque at its top edge, and above the phone tier the chamber legend drops the
  seat counts the direct labels already carry (it keeps the party names and the
  banned state, which are never redundant).
- The user's decisions of record live in docs/AGREEMENT.md (interview verbatim).
