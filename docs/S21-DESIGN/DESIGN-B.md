# DESIGN B — the engine needs reasoning it does not have

## Position

Every subsystem report in this intake arrives, from a different door, at the
same structural absence: **there is no second party inside any party's head.**

- `st.partyRel` is one vector of seven numbers, and all seven are about the
  player. There is no party-to-party relationship anywhere in 3.7 MB
  (legislative.md §3; coalition.md "st.partyRel is the player's relationship
  only").
- The one AI-to-AI memory that exists, `a.grudge`, has two writers, is empty on
  94% of pairs, and clamps at nought so a kindness to a party that holds
  nothing writes literally nothing (memory-rivalry.md).
- The decision function is `v19Score`: a base, a hand-authored constant, three
  penalties, and a one-ply rehearsal. **The goal table alone names the same card
  as the full seven-term score on 70.3–79.7% of open sets** (choosing.md §1).
  The "opponent model" changes the pick on **1.3% / 3.5%** of sets.
- The rehearsal prices **seven of eleven cards at exactly minus their own purse
  cost** — 566 of 1,028 rows, 100% of each card's own rows — because the
  objective reads none of the fields those cards write (choosing.md §2).
- Nothing plans past this session. `a.goal` is a single slot, replaced in the
  same call it is retired in, and **86% of every aim a party forms is
  abandoned** (S21-BASELINE).
- An identical bill from a rival and from a friend is scored **to the same
  decimal** (legislative.md §3).

Those are not six defects. They are one defect with six faces: the engine has
no representation of *other agents over time*. You cannot repair that by
tightening a weight. Two-thirds of the improvements the intake reports suggest
— retune `court`, re-centre the squash, fix `V16_AI_COST` — are correct and
will move nothing the player can feel, because the thing the player is missing
is not accuracy. It is **an opponent who wants something, remembers who helped,
and is coming back next session.**

So this proposal adds a reasoning layer. It is deliberately not a search. It is
**four small data structures and the rules that read them**:

| structure | what it holds | size | new container? |
|---|---|---|---|
| **standing** | one signed number per ordered party pair, plus its cause | 42 × 3 | **no** — reuses `a.grudge` |
| **plan** | the goal's itinerary: a 2–3 step finite state machine | 6 × 6 | yes, `a.plan` |
| **deals** | open bargains between two parties, with a price and a date | ≤ 8 × 7 | yes, `st.deals` |
| **read** | what a party expects the player to do next | ~8 | yes, `st.playerRead` |

**About 110 numbers on a 78 KB state.** No clone bigger than the one `v19Try`
already makes; no loop over parties deeper than the `PARTIES.forEach` that
already runs every session; no new `rand()` in any read path.

Everything below gates on `v19Thinks(st)` or on a level scalar, so `instinct`
stays the shipped game byte for byte.

---

## What I am NOT proposing, and why

State these first, because three of them are what a proposal of this shape gets
wrong.

**Not a search tree.** 7 parties × 11 cards × N sessions is unshippable and
also unnecessary: the file's own comment (35206) measures one clone at 0.97 ms
on a 78 KB state, so five candidates already cost 5 ms of an 8 ms session. My
lookahead is exactly one reply from exactly one named rival on the top three
candidates, at `ruthless` only — three extra clones, ~3 ms. Everything else
that looks like planning is a hand-authored finite state machine with at most
three states, evaluated once per initiative.

**Not a raise to `V16_AI_CADENCE`.** It is the owner's dial and MAP records
that six parties acting every session took the harness from 5.5 elections won
to 1.2. The baseline is explicit: the engine acts enough. I move the *variance*
of the tempo, never its mean.

**Not a parallel mechanism.** The coalition overhaul below adds **one** new
function (`v21Leave`) and otherwise makes `v17Offer`, `v17Accept`, `v17Invest`,
`v17Rotation`, `v17Install`, `v17DealScan`, `v17Renegotiate`,
`v17ConfidenceVote` and the concession `due` field bite. Four rotation branches
exist and one runs; two ledger verdicts exist and one fires; the whole junior
partner's game exists as `need:'leading'` refusals. Almost all of it is built.

**Not a wider grudge clamp with new bars.** Eleven literal numbers in
`roads.js` read the grudge (`fires.after === 12`, `seen.target === 22`,
`vote.moved === 12`, `letter.ignoredGrudge === 44`, `grudge1 === 40`), and
S19f's two live gates (`bar.bar < bar.medianRise`, `bar.maxFall < bar.bar`) are
re-measured *distributions* of it. My N1 relaxes the clamp on the **store** and
leaves `v16Grudge` — the reader every one of those consults — returning
`Math.max(0, …)`, so a grudge of 12 is still a grudge of 12 and every bar,
every literal and both distributions are unchanged. That is the whole reason
this is affordable.

---

# The four improvements

---

## I1 — The objective function learns to see what the cards do
**IMPROVEMENT** to `v19Standing` / `v19Outcome`.

**The defect.** For `article`, `bill`, `campaign`, `demand`, `floor`, `pact` and
`platform` — **566 of 1,028 rehearsals, 100% of each card's own rows** — the
only moving component of the rehearsal is the purse deduction (choosing.md §2).
Three of `v19Standing`'s five components (`v17Share × 60`, the +18 for ruling,
the +9 per office) moved on **0 of 1,028** rows and are read only inside a
difference, where a constant cancels. The squash `d/12` is against a measured
`d` spanning **−0.964 … +2.583**, so the ±1 clamp is unreachable by a factor of
five. Net advice at `ruthless`: *court a bloc, never lay anything* — sim term
+0.307 for `court`, negative for eight of eleven, against a slice (S19c) whose
whole point was to give `carry` a road through the bill card.

**The mechanism.** Four terms added to `v19Standing`, each naming a field a card
already writes and a reader that already exists:

| term | reads | why it can move |
|---|---|---|
| bills in flight | `st.bills` where `sponsor === pid`, valued `billForecast(st,b).lower − BILL_BARS[b.stage]`, capped ±12 | the `bill` card writes `st.bills` |
| pending amendment | `st.v11.con.pending` entries by `pid`, +6 each | `v17ArticleCore` writes it (38347) |
| pact | `st.aiPacts` — the pooled 6% expressed as projected share | `pact` writes it (34460) |
| position | distance closed by `st.push[pid]` toward the `enter` ref | `platform` writes it (34445) |

And two replacements: `v17Share(st,pid) * 60` becomes
`supportTargets(st)[pid] * 60` — **projected** share, not realised seats, which
is the number the ballot reads (11600); and `d / 12` becomes `d / 2.6`, the
measured spread, with the comment carrying the measurement so the next reader
cannot re-pick it by eye.

That last swap is load-bearing beyond the squash. `court` scores +1.942 today
because `v17Utility`'s bloc term says a contented bloc is good, while
`supportTargets` gives a contented bloc to whoever is **in office** — measured,
**84 of 144** courting plays lowered the courting party's own national share,
and 133 of 144 raised the ruling party's (society-foreign.md §2). Two models of
one number pointing opposite ways, and the rehearsal reads the wrong one. Read
it through `supportTargets` and the deck's most-played card stops being a gift
to the incumbent.

**Writer / reader.** No new state. `v19Standing` has exactly two callers, both
in `v19Outcome`; `v19Outcome` has one, in `v19Score`.

**What the player sees.** The card mix changes and the log changes with it. The
engine stops spending 27.3% of its output on a number that moves a bloc by 2.6
and starts laying bills, signing pacts and working the floor. A player who has
read "The TVC spent the season courting religious communities" 80 times in six
campaigns reads something else.

**How it is measured.** Extend `a party is after something`'s `think.sim` arm:
`sim.distinct >= 10` of 11 (up from the shipped `>= 7`) and a **per-card sign
table pinned in the assertion's own words** — `bill` positive when its forecast
clears the bar and negative when it does not, `court` no longer the only
positive, the eight negatives down to at most three. Second arm, driven: the
share of engine initiatives that are `court` falls from **27.3%** into a band
whose floor is stated, and `bill` rises from 4.6%.

**Cost.** ~45 lines, all inside two functions. **Touches the seeded stream:
no** — no new roll; the clone spends the clone's dice, verified on 504 of 504
`v19Try` calls. **Risk:** this is the change that moves `think.sim.distinct >= 7`,
`sim.spread > .05`, `sim.orderSpread >= 6` and `steer.shrewd.sim`. All four move
*upward*, which is an argument to make explicitly and re-pin, not a regression.
`supportTargets` inside a rehearsal must be measured for cost — it walks blocs
and parties; if it is over ~0.3 ms, cache it per clone.

---

## I2 — `oust` is made adoptable, and the ledger learns to point at governments
**IMPROVEMENT** to `V19_GOALS.oust` and the `v16Resent` call sites.

**The defect.** `oust` — the only aim in the game that points at bringing a
government down — was held **0 times in 720 sessions at `ruthless`**. Three
functions on one card disagree about what the goal is for: `fits` maximises the
grudge over **any** party; `target` picks the argmax over **all** parties
without asking whether they govern; `done` returns true when the ref is not in
government, and `v19AdoptGoal` drops any goal already `done`. Measured over
3,618 non-ruling party-sessions: `fits` held 880 times, the argmax was in
government on 72 of them, and **808 (91.8%) were deleted by the disagreement**
(goals.md Q2). Underneath that is a second defect: **394 of 3,729 nonzero
ledger entries (10.6%) point at a party in government**, because the only
AI-to-AI grudge writer is the `attack` card and `attack.can` refuses the
government outright. Attacks flow *toward* the government and the memory flows
*away* from it.

**The mechanism.** Three lines on the goal and one new emitter:

- `oust.target` filters to `[st.ruling].concat(st.coalition)` and takes the
  argmax there.
- `oust.fits` asks the same question `target` answers, so a party with a 90
  against a rival and a 5 against the government no longer passes and is then
  killed by `dead`.
- `oust.done` stamps `g.gov = st.ruling` at adoption and completes only when
  the ref leaves office **after** adoption — the aim survives its target
  briefly falling and is not handed a completion it did nothing for.
- The ledger gets government-facing writers through **N6**'s `v21Book`: a bill
  of theirs voted down, a demand refused by an engine government, an office
  lost, a formation they were frozen out of.

**Writer / reader.** `g.gov` written by `v19AdoptGoal`, read by `oust.done`
only. `oust` then feeds `v19Rivalry`'s `theirs.kind === 'oust'` clause (35071 —
the engines' only asymmetric rivalry clause, currently unreachable) and **N2**'s
`unseat` plan, which is what turns the aim into a motion.

**What the player sees.** The Parties page prints *"Bringing down the
government"* for the first time in the program's history, with a progress
figure that reads the confidence arithmetic rather than a seat share.

**How it is measured.** `oust` adopted on **≥4%** of adoption moments over 14
seeds × 100 sessions, with the intake's own arithmetic in the assertion's
words: `target`-only fixes lift the ceiling from 2.0% to 4.3% of boards, and
the ledger writers are what carry it past that. Second gate: **the share of
nonzero ledger entries pointing at a party in government rises from 10.6%**
into a pinned band. Poison: revert `target`'s filter — adoption returns to ~0.
Poison separately: revert the ledger writers — adoption falls to the 4.3%
ceiling, which distinguishes the two halves.

**Cost.** ~15 lines on the goal, plus N6. **Seeded stream: no new roll** —
`target` is called inside `v19AdoptGoal`'s existing pool walk. **Risk:**
`reach.neverAdopted.length === 0` currently passes on luck (it drives `shrewd`
on different seeds); this gives it a real sample. `oust` entering the pool
dilutes every other kind's share, which pressures `steer.carryOpen >= 40` — a
floor whose own comment records it was already 39 at six seeds. Re-sweep that
arm's seeds in the same slice.

---

## I3 — The rehearsal gets a second ply, at `ruthless` only
**IMPROVEMENT** to `v19Outcome`; the behaviour the top rung has never had.

**The defect.** `shrewd → ruthless` changes **only three numbers** (1.4→2.8→5,
1→1.9, 1.2→1.8) and adds no behaviour (choosing.md §5). The setup sheet
promises four distinguishable opponents; the top step is a sharpness change
whose most visible effect is that the die stops overriding the leader
(46.7% → 67.2%). And `v19Outcome` "runs `card.run(clone, pid)` and stops. No
other party moves, no tick runs, no session ends, no division is held."

**The mechanism.** At `sim >= 1.9`, after running my card on the clone, run
**one reply**: the single rival `v19Rival(st, pid)` already names, choosing its
own best open card by **argmax** of `v19Score` (not the softmax — no roll, and
"the most likely reply" is the honest reading), with recursion refused by a
depth flag so the reply's own scoring uses `sim = 0`. Then read `v19Standing`.
Gated to the **top three** candidates by first-ply score, so cost is three
extra clones per initiative.

Note the reply is scored inside `v19Try`'s clone, where `Math.random` is
already swapped for a local LCG and `S` is the clone — verified, the live
`S.rngState` moved on **0 of 504** driven `v19Try` calls. A second ply spends
nothing from the campaign's stream. That is why this is affordable and why it
must be built inside `v19Try` rather than beside it.

**Writer / reader.** No new state. `v19Outcome` gains a `depth` parameter with a
default; its one caller is unchanged.

**What the player sees.** At `ruthless` a party stops laying a bill it can see
the rival will kill, and starts laying the one the rival cannot afford to
oppose. The `a.why` record gains `expects` — the rival's predicted reply — and
the Parties page states it: *"…and expects the FP to move against it."* That
sentence is the whole point: a two-ply engine the player cannot perceive is
indistinguishable from a one-ply engine.

**How it is measured.** Three gates. (1) The reply **changes the pick** on
≥8% of `ruthless` multi-card sets — poisoned by returning early from the reply
branch, which must return the shipped ranking exactly. (2) `ruthless` beats
`shrewd` on a driven outcome measure (standing at session 100, 14 seeds) by a
margin the arm states. (3) Cost: the arm times an initiative and fails above a
stated ceiling (~15 ms), because a slow engine is a shipped defect the harness
should own. And the existing `stream.free` gates must stay green.

**Cost.** ~35 lines. **Seeded stream: no** — but this is the item most likely
to be *believed* to touch it, so the assertion must read the live `rngState`
either side, as S19a's `think.sim.untouched` already does. **Risk:** `sim`
truthiness also gates `v17AiFloorFor`'s pivot (38480); do not overload the same
scalar for the depth switch — read `v19LevelOf(st).sim >= 1.9` explicitly, or
better, add a named `ply: 1|2` column to `V19_LEVELS` so the ladder's shape is
in the table rather than in a comparison.

---

## I4 — Posture becomes a mood with tenure, and stops lying on the page
**IMPROVEMENT** to `v16Posture`, `V17_BURN`, `v17Accept` and `v16AiPanel`.

**The defect.** Four separate readings, all measured:

- `restive` fired **0 times in 4,320** party-sessions. It has a constant, a
  predicate, six cards, a burn rate and a sentence. The reason is a race: the
  only channel that raises a *sitting* partner's grudge is a breach worth 9–12,
  while the same breach costs 8–11 of cohesion against a walk floor of 12–30 —
  **the partner walks out before the grudge reaches 55.** roads.js:8615 proves
  the predicate by topping the grudge up with 100 every session, which is
  S17q's `st.unrest = 80` exactly.
- `consolidate` fired **4 of 1,488**. The bar is `share >= .22` against a
  measured outsider p90 of **.149** and max of .259 — above the p90 of the
  population it gates on. Nine of eleven cards list it in `post`.
- `attack` and `moderate` are **Jaccard 0.78** apart (they differ by `demand`
  vs `court`), and nothing downstream separates them: `v19Score` never reads
  posture.
- The printed posture is **wrong 30.5% of the time, median 10 sessions old,**
  and 149 of 1,440 were still the initialiser — while the adjacent "Odds of
  moving" column is computed live.

**The mechanism.** Five changes, each small:
1. `consolidate` becomes relative — *largest party outside the government* —
   measured against the distribution rather than picked by eye.
2. `restive` gets a channel that is not the walkout race: when a breach lands on
   a partner that **cannot afford to leave** (run `v17Build` on the remaining
   seats; if no alternative majority exists without them, they are trapped), the
   breach converts to grudge instead of to cohesion. A partner with nowhere to
   go gets angry rather than leaving. That is what the posture was written for.
3. Posture gains a minimum tenure of three sessions and `a.postureSince`, read
   by `v16Posture` itself as hysteresis, so a mood is a season and not a flash.
4. The panel renders `v16Posture(S, p.id)` live, the way the odds column
   already does; `a.posture` is kept only as "last acted as" and labelled so.
5. `v17Accept`'s `post === 'attack' ? 16 : 0` term is **deleted**. It reads the
   *outgoing* government (`v17Form` runs before `v17Install`), fired on 4 of
   242 accept calls, and duplicates a question the same function already asks
   correctly two lines above via `v17GrudgeOf(st, pid, lead)`.

And one coverage guard the file is missing: **`V17_BURN`'s reader is
`rate === undefined ? .7 : rate`, so a new posture silently gets a flat .7
burn** and retunes every AI party's campaign spending in silence. `roads.js`
must fail if a posture is missing from `V17_BURN` or from every card's `post`
array — a posture no card opens is a party that goes quiet and nothing
reddens.

**What the player sees.** A posture that persists long enough to be read, that
is true when it is printed, and — for the first time — a partner who stays in
the ministry and works against them from inside it.

**How it is measured.** `restive` occurs on **≥0.5%** of party-sessions across
14 seeds **with no hand-set grudge** — the arm the intake says roads.js does
not have. Panel-vs-model equality at **100%** over 1,440 samples (against
69.5%). `consolidate` occurs at a rate the arm states, measured against the
outsider share distribution quoted in the arm's own words. Posture tenure ≥3
sessions on ≥95% of transitions.

**Cost.** ~40 lines. **Seeded stream: no.** **Risk: high, and it is the item to
sequence first.** Posture decides the open set, and *every rate in S19b, S19c,
S19f and S20g has an open-set denominator.* `V17_BURN` feeds `supportTargets`
through `partySpend`, so changing a bar retunes campaign spending. S20f already
recorded a verdict on touching the posture filter (measured out: real but
modest, and it re-phased every campaign). Build this behind the others, measure
the open-set distribution before and after, and re-pin the four arms in the
same slice rather than in a later one.

---

# The nine new behaviours

---

## N1 — Standing: one signed number between every ordered pair, and kindness that can be stored
**NEW.**

**The absence.** Greps for `gratitude`, `favour`, `owed`, `ally`, `trust`,
`goodwill`, `forgive` over 3.7 MB return **prose only**. `v16Resent` clamps at
0, so a kindness to a party that holds nothing writes literally nothing — and
**42% of party-sessions sit at grudge 0 against the player, 94% of AI-to-AI
pairs at 0.** The twelve negative `V17_MEMORY` weights can only ever spend an
existing grudge down. Two parties that have governed together for **103
consecutive sessions** regard each other on formation night exactly as two who
have never met. And in the chamber, an identical bill from a rival and a friend
scores to the same decimal, because `partyBillSupport`'s second-largest term
(4.98 of a 61.24 budget) reads `st.partyRel[pid]` — the voter's relation to the
**player**, which has nothing to do with the bill.

**The mechanism.** Do not add a container. **Relax the clamp on the store and
keep the reader.**

```
v16Resent:  a.grudge[against] = clamp(… + n, -100, 100)      // was (0, 100)
v16Grudge:  return Math.max(0, a.grudge[against] || 0)        // unchanged semantics
v21Standing(st, a, b): return a.grudge[b] || 0                // the signed reader
cooling:    g[k] > 0 ? max(0, g[k]-.6) : min(0, g[k]+.4)      // credit outlives injury
            delete when Math.abs(g[k]) < .05
```

A grudge of 12 is a standing of −12. Every one of the twelve grudge readers,
every bar (35 / 55 / 25 / 30 / 20), and every one of the eleven `roads.js`
literals is untouched, because they go through `v16Grudge`. What is new is that
the other half of the line now exists.

**Except that two readers do not go through it, and this is the whole risk of
the item.** `grep -n "\.grudge\[" vale.html` returns exactly four lines: the
reader (34071), the writer (34076), **`v18Tempo`'s max at 35387** and **the
panel's cell at 36125**. Both must be routed through `v16Grudge` in the same
slice, or a signed store leaves them silently disagreeing with every other
consumer — the "two clocks for one fact" defect, introduced by the fix for it.
As it happens `v18Tempo` initialises `worst = 0` and takes the max, so it is
correct by accident today; correct-by-accident is what this codebase's history
is a list of. Route it anyway, and let `roads.js` assert that the store has
exactly one reader.

Five consumers read the signed number:

| reader | today | with standing |
|---|---|---|
| `partyBillSupport` 9032 | `st.partyRel[pid] × .22` — about the player | `v21Standing(pid, bill.sponsor) × .22`, falling back to `partyRel` when the sponsor is the player |
| `assentFavour` 9444 | `st.partyRel[who]` — **768 of 768 assent decisions were engine→engine and 88.2% refused on a number about the player** | `v21Standing(sponsor, holder)`, keeping the holder's `loyalty` as the weight |
| `v17Accept` | grudge × .32 on the value only | signed, on the value **and** the reservation — a habitual partnership is cheap to renew |
| `v16PactPartner` 34610 | refuses at grudge ≥ 20 | prefers positive standing, so a pact is a friendship rather than proximity |
| `v19Standing` | reads no memory at all | a small term, so making an enemy has a price the rehearsal can see |

And the sign defect the intake found: `defect: { self:18, seen:2 }` — the
verb that hands a party 46 seats makes it resent the player 18. It becomes
`{ self:-18, seen:6 }`, and `roads.js` gains a **sign arm**: a verb whose `run`
raises the target's seats, machine, press or purse and whose `self` is positive
must redden.

**Writer / reader.** Writers: the eleven existing `v16Resent` sites, plus N6's
`v21Book`, plus a new `why` on the existing `provokedAt` stamp (`{turn, verb}`)
at zero cost. Readers: the five above plus the panel.

**What the player sees.** Two surfaces. The Parties page's memory cell stops
being three words with no number — it prints the standing and **the last thing
that moved it** ("They have not forgotten the Wealth Tax", "They remember the
ministry you gave them"). And a **7×7 standing grid** on the Parties page: the
first time in the program the player can see the politics between the other six
parties. Today the answer to "who hates whom" is not renderable because it does
not exist.

**How it is measured.** (a) A kindness to a party at standing 0 leaves a
**positive** number — the exact case S17l's kindness arm (`poach` then `fund`,
assert 0) never asks. (b) `roads.js`'s existing `fires.afterKindness === 0`
must **stay green** (12 − 14 = −2, read through `max(0,·)` = 0) — that is the
poison-proof that the reader is unchanged. (c) The reverse-coverage arm and the
sign arm. (d) The assent refusal rate falls from **88.2%** into a stated band,
driven. (e) A sponsor swap across all seven parties on one bill produces **at
least three distinct scores** for one voter (against the measured one).

**Cost.** The clamp is 1 line, the cooling 2, the reader 4, the five consumers
1 line each, the grid ~40. **Seeded stream: no.** **Risk:** the S19f gates
`bar.bar < bar.medianRise` and `bar.maxFall < bar.bar` are re-measured
distributions of the grudge — argue them explicitly: the *rise* distribution is
unchanged (writers are unchanged), the *fall* is now asymmetric, so
`bar.maxFall` must be measured on the positive side too. `letter.ignoredGrudge
=== 44` reads a cumulative rise from 0 and is unchanged unless the letter lands
on a party at positive standing, which is a new case the arm should name.

---

## N2 — The plan: a goal with an itinerary
**NEW.**

**The absence.** `a.goal` is a single slot with no list and no priority. "The
seven kinds are the natural rungs of one plan and the model cannot express the
plan" (goals.md). Measured adoption sequences show no structure at all:
`build → office` 4, `office → build` 8, `ground → carry` 12, `carry → ground`
10 — a fresh weighted draw each time with the previous kind unread. And
**nothing happens the session after an aim is reached**: 33 of 33 completions
were replaced in the same call, with no pause, no reward, no state change and
no log line.

**The mechanism.** `V21_PLANS` — six authored shapes, each a **2–3 step finite
state machine**, indexed by the goal kind it serves. A plan is adopted
**deterministically from the goal just adopted**, so it consumes no roll and
re-phases nothing.

```js
a.plan = { id:'unseat', ref:'lp', step:0, since:12, hits:0, miss:0 };
```

| plan | serves | steps | machinery it makes bite |
|---|---|---|---|
| `unseat` | `oust` | build a bloc → count the house → move confidence | `v17ConfidenceVote`, `v17Refound` (one caller each) |
| `squeeze` | (a partner's ledger) | demand with a date → withhold a line → threaten confidence | `coalition_demand`, `confidence_threat` (2 and 1 raises in 720) |
| `carrythrough` | `carry` | lay the bill → buy a second line → press it home | `v20PressCore`, N3's `bargain` |
| `buyin` | `enter` | move the platform → drop the blocking red line → accept | `v17Accept`, `driftParties` |
| `takeoffice` | `office` | win the primary → spend on the **contested** office → sign an order that serves the aim | `v17AiRaceSpend`, `v17AiOrderFor` |
| `isolate` | (standing) | refuse a pact → declare a cordon → freeze them out | N7, `v17Build`'s pool |

Each step declares `want` (a card id or verb), `done(st,pid,pl)` and
`say(st,pid,pl)`. `v19Score` gains one term: `+V21_STEP` when the card is the
current step's `want`, gated on `v19Thinks`. The step's `done` advances
`pl.step`; a plan that finishes pays a consequence the model reads (`a.wins`,
read by `v17Accept`'s reservation and by `v18Tempo`), which is the "nothing
happens when an aim is reached" defect answered.

**This is a covered surface, not a hand-kept list.** `roads.js` fails if a goal
kind has no plan and no `deliberate:'none'` adjudication; if a step names a card
not in `V16_AI_DECK`; if a step's `want` has no entry in the goal's own `worth`
table; and — the guard that matters — **if a step's `done` cannot be reached by
the card it names, driven.** That last is the arm S20g's `V20_AIM` guard is
missing (it checks the table, never that the verb reads it).

**What the player sees.** The aim column becomes an itinerary: *"Bringing down
the government: has the arithmetic, needs one more party."* Each step landing is
a log line in the session it happens. A player can watch a party work toward
something across twenty sessions — which is the single thing the baseline says
is absent.

**How it is measured.** A plan advances ≥1 step on a stated share of its lives
(the counterfactual is the 86% abandonment rate); step `done` is reachable by
its named card, driven; the covered-surface guards. Poison per step, not per
plan: deleting one step's `done` must strand exactly that plan.

**Cost.** ~180 lines including the six shapes and their prose. **Seeded stream:
no new roll** — adoption is deterministic from the goal. **Risk:** the step term
in `v19Score` competes with the goal table; `subordinate.temperCeiling <
goalCeiling / 2` binds `V19_TEMPER` against the largest `worth`, so `V21_STEP`
must be sized against the goal table and stated, not eyeballed.

---

## N3 — `bargain`: the card that makes an offer
**NEW** — a twelfth deck card.

**The absence.** "There is no path by which an engine party amends a bill,
offers to back it in exchange for anything, trades a vote, abstains as a choice,
or answers an offer" (legislative.md §2). The three verbs it has —
`support`, `oppose`, `pressure` — are unilateral declarations, and `pressure` is
**unreachable at every thinking level** (0 of 140 plays). The one thing that
looks like negotiation, `cross_party`, is never about a bill that exists and
imposes **no obligation** on the offering party. And the single genuine offer in
the game, `government_offer`, fires **once, in session 1, and never again**.

**The mechanism.** `v21BargainCore(st, actor, target, ask, give)` beside
`v17FloorCore`, taking the same actor argument. `ask` is a line on a named live
bill. `give` is one of three, each already a live channel:

- a line on a bill the target sponsors (`b.lines`, read at 9051),
- a statute the actor undertakes not to oppose for N sessions (a `refrain`
  record of exactly the shape `v17DealScan` already enforces),
- a department, when the actor is in government (`st.exec`).

Against an engine it resolves in the model by the same value-vs-reservation
arithmetic `v17Accept` uses, reading N1's standing. Against the player it posts
a **new** `party_offer` paper — **new type, not a borrowed one**, per the S16e
rule, with `V18_PAPER_NEED.party_offer = 'any'` so it reaches all three chairs
— carrying three answers: accept, counter, refuse.

`st.deals` holds open bargains, capped at 8:
`{ from, to, ask, give, due, state:'open'|'kept'|'broken', turn }`.
Readers: `partyBillSupport` (an accepted `line` ask is worth what a declared
line is worth, through the existing Core, so nothing new enters the count);
`v21Standing` (kept +, broken −, which is where a bargain becomes memory);
`v17Accept` (a party that has kept a bargain with the formateur is cheaper);
and the Deals card on the Parties page.

**What the player sees.** A letter that names a bill, a price and a date, from a
party that will remember whether they were dealt with. Then, sessions later, the
consequence.

**How it is measured.** ≥N deals struck across 14 seeds × 100; a kept deal moves
the standing up and a broken one down, **component-wise, not joined into one
string** (S17n's ruling); the `party_offer` paper never inherits a
`party_demand` branch (`letter.type === 'party_offer'`, and the
`faction`/`policy` fields absent, exactly the S17l assertion for the earlier
instance of this defect).

**Cost.** ~150 lines. **Seeded stream:** the card's target choice rolls, inside
the initiative that already rolls — no new gate in front of `rand()`. **Risk:
this is a twelfth card, which is a five-place change in `roads.js` and a
five-place change in `vale.html`.** `six.deck === 11 && six.cardWorks === 11`
are literals; the `moved` chain at roads.js:4235–4252 falls through to `false`
for a card it does not name; and `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS`,
`V16_AI_COST`, at least one `post` array and the relevant `worth` tables all
need entries. Four covered-surface gates will name it if any is missed — which
is the design working. Budget it as a whole slice.

---

## N4 — The engine gets the persuasion layer it was already written for
**NEW** capability on an existing Core.

**The absence.** `bill.pull[pid]` — the field S20b added *specifically* so
persuasion would be counted through a party's seats — has exactly **one
writer**, `v20PressCore` (38287), whose one caller hard-codes `playParty(S)`.
Measured over 300 sessions: `pull` non-zero in **0 of 22,932 divisions.**
`v20PressCore` was already written as a Core taking an `actor`, in the exact
S17k shape, and no engine calls it. Meanwhile the engine's whole chamber
vocabulary is worth **1.9 aye-share points** against the player's measured
**25.2**, and **143 opposition-sponsored bills were archived across 300 sessions
with 0 passed**, because `v17FloorWhy` refuses a party's own bill outright
(38197) and every other instrument is `billAction`.

**The mechanism.** Three changes, no new state:
1. `v17AiFloorFor` returns `{bill, verb}` where verb may be `press`, calling
   `v20PressCore(st, pid, b, scope)` once the party has a line. `v20PressWhy`
   already refuses correctly for a non-player actor (38262 reads
   `b.lines[actor]`).
2. Open `amend` and a whip-equivalent to the **sponsor** of a private member's
   bill, priced from the party purse — so a party that lays a bill can do
   something about it.
3. One-line fix: `v19Pivot` compares `f.lower` against `BILL_BARS[stage]` at
   every rung, so at committee it counts the wrong number (the decision is
   `f.committee`) and at senate it counts the Assembly. `billStageValue(f,
   bill.stage)` exists at 9633 and does exactly this. And `pressure`'s bar is
   re-set against the measured support distribution (p10 17, median 43–49,
   p90 74) rather than requiring `care ≥ 0.9`, or the branch is deleted.

**What the player sees.** An opposition bill that passes. A government bill that
fails because two parties worked the floor. A chamber where the other side has
the same kit.

**How it is measured.** The engine's mean aye-share swing per floor act rises
from **1.9** into a stated band; opposition bills passed rises from **0 of 143**
to ≥N; `pull` non-zero on a stated share of divisions (from 0 of 22,932). And
S20b's `press.coverage` gates must hold for a non-player actor —
`scopes.others.hasSponsor === false` in particular.

**Cost.** ~70 lines. **Seeded stream:** no new roll if the verb choice rides
`v19Pivot`, which is arithmetic. **Risk:** `bill.pull` and `bill.lines` are read
by `divisionOf`, so S20a's arm feels this even though it stubs
`partyBillSupport`. And the whole legislative balance moves — opposition bills
passing at all is a real change to the campaign, and it needs a pacing
re-measure at **six seeds with the mean quoted**, not one.

---

## N5 — The engine can put the confidence question
**NEW.**

**The absence.** `v17ConfidenceVote` (37740) and `v17Refound` (37797) have
**exactly one caller each, and it is the player's own action card.** No engine
party can end a government. As head of a majority coalition the player is
**structurally unremovable for the whole campaign** — measured: 9 government
changes in 360 elections, **3 coalition changes between elections in 720
sessions**, 1 confidence threat raised, 0 caretakers. The `confidence_threat`
paper's three answers move trust, set `S.confidence`, or splice the partner out
of an array. **There is no vote.**

**The mechanism.** Two callers, both from N2's plans:
- `unseat` step 3: an opposition party holding the plan runs `v17ConfidenceVote`
  as a **count first** — if its own reading does not carry, it does not move —
  then moves the motion, priced from the party purse with a cooldown.
- `squeeze` step 3: a partner does the same from inside, which is what
  `st.confidence` and the cohesion `< 30` defector branch (37748) were built
  for and have never been asked.

When the player leads, the motion arrives as a paper **one session before it is
put**, with the tally shown, so a government never falls by surprise; the
player's session is the one where they can buy a vote back. `v17Refound` then
runs, which already exists and already produces a government out of the same
Assembly.

And the two exploits on the same surface, closed: `confidence_threat`'s `dare`
appears at `partyRel < 27` and removes the partner at `< 28`, so the else-arm is
unreachable and a button tipped "They **may** leave" is in practice labelled
"dissolve the coalition"; and `renegotiate` writes `S.confidence = from` while
leaving the partner in the cabinet, which makes the election report print "It is
a minority government" over a majority coalition — it should call
`v17Renegotiate(S, from)`, which exists and does exactly this job.

**What the player sees.** The motion, the tally, and their government falling.
For a player in opposition: a government under pressure that is not theirs.

**How it is measured.** ≥N motions moved across 14 seeds × 100 **with the
`runQueue` override** — without it the republic never holds an election and the
arm measures a frozen board. A motion is moved only when the mover's own count
carries (poison: delete the count; motions rise and the carry-rate falls).
Government changes between elections rise from **3 in 720** into a stated band.
And the caretaker clock's pinned literals (`3 / 1 / 3 / 2`) must stay green.

**Cost.** ~60 lines. **Seeded stream:** the cooldown roll rides the initiative.
**Risk:** this is the change that makes the campaign genuinely different. It
will move pacing, election counts and every S19 arm's session population. Budget
a full six-seed pacing re-measure with the mean quoted, and treat any gap
smaller than one build's seed-to-seed spread as a reshuffle.

---

## N6 — The party remembers being governed
**NEW** emitter over existing state.

**The absence.** The complete list of `v16Resent` callers is: a `party_demand`
answered or ignored, a coalition quit, another party's `attack`, a coalition
breach, a walkout, the player's `V17_MEMORY` verbs, and floor pressure.
**Nothing calls it for a statute carried, a seat lost, an office taken, a bill
voted down, or a government formed without them.** You can spend 130 sessions
passing the exact statutes the PNL exists to prevent and it will never hold one
of them against you. Losing an office costs a party nothing and is remembered by
nobody (`grep v16Resent` returns nothing anywhere in the exec chain). Nothing in
the engine reacts to a landslide.

**The mechanism.** One emitter and one weight table:

```js
v21Book(st, kind, ctx)          // the only writer of political memory
V21_BOOK = {
  statuteAgainst: { w: …, both:false },   // enactBill, moved away from a party's `wants`
  billKilled:     { w: …, both:false },   // failBill, the government's benches killed it
  demandRefused:  { w: …, both:false },   // an engine government refuses a party demand
  officeLost:     { w: …, both:false },   // execContest, scaled by what the loser spent
  ballotBeaten:   { w: …, both:false },   // runElection, the biggest loser reads the winner
  frozenOut:      { w: …, both:false },   // v17Install, asked and refused, or never asked
  bargainKept:    { w: …, both:true  },   // N3 — the positive half, and it is symmetric
  concessionKept: { w: …, both:true  }
};
```

`both:true` calls `v21Bond` in **both directions** and `roads.js` asserts both
moved — the S17m ruling, declared once and indexed both ways, because a
relation on one card and not the other is a one-way door. `roads.js` fails if a
`v21Book` call site names a kind with no weight (a covered surface, not a
whitelist — the guard `V17_MEMORY`'s `radicalise` entry proves a hand-kept list
can never have).

**Writer / reader.** Writer: six existing functions gain one call each. Reader:
`v16Resent` → the whole existing consumer set, which is the point — this feeds
`oust`, `v16Posture`, `v18Tempo`, `v17Accept`, `v17Build`'s pool sort,
`partyBillSupport` and `v19Rivalry` without a single new reader.

**What the player sees.** The standing cell names the cause. The log narrates a
result: *"The PNL lost 61 seats to the government and their leader named it."*
`driftParties` — a real 20% move of every party's position toward the winner
that is **never stated in words anywhere** — gets a sentence.

**How it is measured.** The share of grudge writes that are legislative or
electoral rises from **0%** into a stated band; the share of nonzero ledger
entries pointing at a party in government rises from **10.6%** (which is the
measurable half of I2); each of the eight kinds fires at least once across 14
seeds × 100, which is the coverage arm.

**Cost.** ~90 lines. **Seeded stream: no.** **Risk:** this raises grudge
magnitudes across the board, which moves S19f's `bar.medianRise` and S19b's
`scale.worth between p90 and p99` — **the tightest coupling in the harness.**
`V19_RIVAL_PUSH × median foeAt` can leave its window without rivalry changing at
all. Both arms must be re-swept in this slice.

---

## N7 — The engine cordons, and formation becomes political between the other six
**NEW.**

**The absence.** `st.cordon` and `st.coopted` are **player-only** — written by
four player verbs, and measured at **0 sessions in 720** with either set. The
cordon is the game's one statement about a party being untouchable and no engine
can ever declare one. Consequently formation never depends on politics between
the other six parties: `v17Build` walks the pool by `dist2 + grudge/220` and
takes whoever says yes, and **nothing anywhere computes whether a party is
necessary to a majority.**

**The mechanism.** `st.aiCordon[from][to] = { since, why }` — a party's own
refusal to sit with another. Written by N2's `isolate` plan and by a standing
below a bar **measured in play** (not picked: the intake gives AI-AI standing as
mean 1.39, p99 45.2, max 75.6, so the bar must be set from the p99 and stated).
Read in exactly two places:

- `v17Build`'s pool — that formateur will not invite them;
- `v17Accept` — that invitee will not accept alongside them.

**Not** by `v17Eligible`, which removes a party from the *whole* rotation. A
cordon is one party's refusal, not a national ban, and putting it in
`v17Eligible` would be the borrowed-field defect again.

And the missing concept beside it: `v21Pivotal(st, pid)` — is this party in
every majority the arithmetic allows? Computed once per formation over the ≤2⁶
subsets of six other parties (64 combinations of a seat sum — trivial), read by
`v17Accept`'s reservation, so a kingmaker charges like one. That is the single
largest source of *variety* in formation prices and it costs one bounded loop.

**What the player sees.** The formation sheet prints a round line the player has
never seen: *"The CUP would not sit with the PNL, and the arithmetic did not
survive it."* The Parties page shows who refuses whom. And a small party that is
in every majority prices itself accordingly — visible, and arguable.

**How it is measured.** Cordons occur at a stated rate; a cordoned pair
**never** appears in the same `co` across 14 seeds (an exact zero); `v21Pivotal`
returns true for a party the arithmetic needs and false for one it does not, on
a hand-seated board, **both directions**; and the reservation of a pivotal party
is measurably higher on the same board with the pivotality read deleted.

**Cost.** ~80 lines. **Seeded stream:** `v17Rotation` is asserted `pure.noDice`
— **an S21 negotiation that rolls breaks that outright.** Everything here is
arithmetic and must stay so. **Risk:** this moves the hand-seated boards in `a
plurality is not a government`, which are the only place the minority and
caretaker branches are ever exercised. Expect to re-pin them, deliberately, as
part of the coalition overhaul.

---

## N8 — A party anticipates the player
**NEW.**

**The absence.** "The player enters the model only retrospectively"
(choosing.md §4). `v19Rivalry`'s human clause reads `v16Grudge` — a record of
what the player *has done* — plus the offices they currently hold. **Nothing
anywhere predicts a player move.** And the AI's model of the human is dominated
by inbox neglect: **81 of 128 traced grudge writes (63%) are the expired
letter**, so a player who clears the inbox every session is invisible to the
opponent model no matter what else they do.

**The mechanism.** Prediction here must be a **decayed frequency count**, not a
model. One object on the state, because it is a fact about the player rather
than about a pair:

```js
st.playerRead = { lay:0, press:0, hostile:0, give:0, ignore:0, procedural:0,
                  n:0, seatTrend:0, broke:0 };   // ~9 numbers
```

Written where the books already are: the `doAction` memory wrapper (35990 —
one extra line, no new call site), `sponsorBill`, `expireInbox`, and
`v17DealScan`'s breach arm for `broke`. Decayed 3% a session so it is a habit
and not a history.

Three readers, each of which turns the count into behaviour:

1. **`v18Tempo`** — a player who legislates hard makes the board busier. This
   only means anything once N9 stops the budget being zero-sum.
2. **`v19Score`**, at `read > 0` — a `defend` term: a party that expects a bill
   values `floor`, `press` and `bargain` higher, *this session*, before the bill
   exists. That is the first forward-looking term in the function.
3. **`v17Accept`'s reservation** — **reputation that outlives a grudge.** A
   player who has broken coalition agreements is charged more at *every future
   formation*, by every party, including ones they have never governed with. A
   grudge decays in 167 sessions and is about one pair; a reputation is about
   the player and is read by six.

**What the player sees.** The Parties page states the expectation in words —
*"They are watching the order paper"*, *"They expect you to move against
somebody"* — and the formation sheet says why the price is high: *"You have
broken two agreements. They price accordingly."* An engine behaviour the player
cannot perceive reads as randomness however good it is; this one has to speak.

**How it is measured.** Three sweeps in the shape S20e already uses (`agg`
0 / 8 / 2): the read moves monotonically with the player's behaviour; the
`defend` term changes the pick on a stated share of sets; and — the arm that
stands in the gap — **a player with a clean record is charged a lower
reservation than one with a broken record on the byte-identical board.** That
last is the one to poison hardest, because a probe that compares the reputation
term against a reservation derived from it proves nothing (S17e's ruling): the
arm must change the *record* and re-run the producer.

**Cost.** ~70 lines. **Seeded stream: no.** **Risk:** `passive.human > .15` in
S20e is a distribution, and giving engines other parties to be angry at (N6, N7)
reduces the share of rival reads naming the human. That gate will move for
reasons that have nothing to do with N8, and the two must not be confused —
measure them separately.

---

## N9 — The tempo budget stops being zero-sum
**NEW** shape on an existing function.

**The absence.** `v18TempoOdds` returns `v18Tempo(pid) × budget / sum`, so a
multiplier applied to everybody cancels. Driven and printed in posture-tempo.md:
one angry party takes .2708 → .3726 and **quietens the other five** (.2083 →
.1911). All six angry: **every party back to its base.** So a player who makes
six enemies gets no more pressure than one who makes one, and **the strictly
dominant play is to concentrate hostility on a single party** — the opposite of
what a game about a hostile chamber wants. This is exactly the defect the
`V18_TEMPO` comment identifies and deletes a term for, applied to the deleted
term and not to the shipped ones. Alongside it: the median party-session has
**no tempo term firing at all**, and 18.5% of sessions see no engine action.

**The mechanism.** The *shape* still normalises; the *level* moves.

```
budget = live.length / V16_AI_CADENCE * f(mean weight),  f bounded 0.9 .. 1.5
```

Plus a per-party floor so a party with money and a grievance is never silenced
by another party's anger. And the two terms the player actually drives become
**graded** rather than binary: `1 + k·min(1, grudge/100)` and
`1 + k·min(1, (purse-120)/200)`, because a grudge of 35 and a grudge of 100
currently weigh the same. And one derived bar: `V18_TEMPO.broke` is keyed to
`V16_AI_COST.demand` (16) and its own comment calls it "under the cheapest card
in the deck" — the cheapest card is `floor` at 12. Derive it with `Math.min`
over the deck so a cheaper card added later moves it.

**I am not moving the mean.** At the resting state — every weight 1 — the budget
is `live / V16_AI_CADENCE` to 1e-6, exactly as shipped. The owner's dial is
untouched. What changes is that a republic in crisis is busier than a quiet one.

**What the player sees.** A board that responds to its own temperature. Provoke
everybody and everybody moves; provoke nobody and the country is quiet.

**How it is measured.** **This is the one item that requires an existing
assertion to change, and the change must be argued rather than smuggled.**
`ai.budgetHeld` asserts `Σ v18TempoOdds === live / V16_AI_CADENCE` to `1e-6` on
12 consecutive sessions. It becomes **two** gates:
- **resting rate**: with every weight forced to 1, the sum equals
  `live / V16_AI_CADENCE` to 1e-6 — the owner's dial, pinned harder than before;
- **ceiling**: the sum never exceeds `1.5 ×` that, on any board across 14 seeds.

Plus a third the harness has never had: **provoking all six parties raises the
total**, where today it provably does not — the arm the intake's own driven
print makes trivial to write.

**Cost.** ~30 lines. **Seeded stream: no new roll** — the die is still drawn for
every party before any test, and `ai.dice.drawnBeforeTheSkip` must stay green.
**Risk:** every S19 arm's session population depends on how often parties act.
S19e and S19f already hold `V19_REACT_RISE = 9999` on both sides of their A/Bs
for exactly this reason; **N9 must be held on both sides of every existing
in-process A/B**, or it silently moves five measurements.

---

# The coalition overhaul

The owner's words are "flat, uninteresting and unengaging". The measurement of
that is: **3 coalition changes between elections in 720 sessions. 2
`coalition_demand` papers. 1 `confidence_threat`. 40 ledger entries, all
broken, none kept. 360 of 360 formations `majority`, 354 in the first round, 0
investiture votes lost. Sizes 2 and 3, never 1, never 4. One partnership
lasting 103 consecutive sessions.**

And the machinery to fix it is already written. Four rotation branches exist and
one runs. Two ledger verdicts exist and one fires. `V17_KEPT` has never been
awarded in the program's history. Eleven of `st.coalition`'s twelve writers need
the player to press a button. **Seven changes, one new function, all on existing
code.**

### C1 — The offer is priced, and it varies

`v17Offer` returns **exactly 3.00 concessions and exactly 1.00 red lines on
every one of 653 offers**, because it takes `pv5TopWants(pid, st, 4)` and slices
it. `v17Accept`'s value reads `concessions.length * 5` — a constant +15 — and
**`redLines` does not appear in the value at all.** Which statutes are on the
table changes nothing about whether the party sits down.

Give the formateur an **offer budget** derived from how badly it needs the
seats: `need = (maj − have) / seats[invitee]`. It spends that budget on
concessions valued by **the invitee's own gap** (the number `pv5TopWants`
already computes) and priced by **what it costs the formateur** (`v17Friction`
gives the disagreement directly). `v17Accept` reads concession *values*, and
reads `redLines` as a discount the formateur pays for accepting a constraint.

Result: offers of 0–5 concessions with different contents, and a negotiation
with a decision in it. **Assertion:** ≥3 distinct concession counts across 360
formations (against the measured exactly-3.00); swapping one concession for
another changes at least one answer (poison: restore `length * 5` and the answer
stops moving).

### C2 — The formateur has a budget, so the other three branches become reachable

Round one asks **every** party (`V17_FORM_MAX` is 7 and `PARTIES` has 7), so
rounds two, three and four are unreachable except on a chamber the ballot cannot
produce — which is exactly the chamber `roads.js` hand-builds to prove them.
Set `V17_FORM_MAX = 3`, and a party that refuses a formateur twice is out of
that formateur's round. Make round two reachable by making acceptance
expensive, not by hoping for a freak chamber.

**Assertion — the one the intake explicitly asks for:** drive N seeded ballots
with the `runQueue` override and assert the **distribution of `how`**, with the
measured number in the arm's own words: `majority` under a stated share, and
`minority`, `grand` and `caretaker` each non-zero across 14 seeds. Today the
harness proves each branch on a board built for it and the branch has never run
in a real campaign.

### C3 — The investiture becomes a real division

`aye` sums the coalition's seats, so `aye === have >= 653` and
`nay <= 652 < aye`: **`invested` is arithmetically forced for every majority
coalition.** In 360 formations the printed tally is decoration on a foregone
conclusion. Count **members**, not parties: read `factionAverage` and
`partyDiscipline` (both exist, 8927 and 9122) so a coalition with poor internal
loyalty loses members on the floor, and let a party that accepted still abstain
if its caucus is unhappy. Then a majority coalition can be defeated by its own
back benches, which is the only way this vote is ever interesting.

**Assertion:** an investiture fails on a hand-seated low-discipline board **and**
at least once across 14 driven seeds. S17f's abstention rule (`d > .62 || g >=
30`) is untouched, so that arm holds.

### C4 — A concession has a date, and a promise can be kept

`due` is written as `null` by all five producers and read by **nothing**. So the
government can promise two statutes and never lay them, forever, at no cost —
and inaction is what a coalition government mostly does with an inconvenient
promise.

Give each `adopt` concession a `due`, **counted from the instrument the answer
has to use** (CLAUDE.md's own rule): laying is one session, the floor is a
second, and since S15d the statute does not move until an office signs, which is
a third — so `V21_CONCESSION_DUE = 4`, not 3, and the count is in the comment.
Past due unmet, book a `broken` entry.

And make the credit reachable. `V17_KEPT` fires only when `v17Off(st, pid, ref)
<= 0.001` — the statute must land **exactly** on the party's authored want —
while the concessions are `wants.slice(0,2)`, which `pv5TopWants` sorts by gap
**descending**, so they are by construction the partner's two *largest* gaps.
**Zero credits in 720 sessions.** Credit **progress**: `V17_KEPT` per rung moved
toward the promised want, capped at the concession's own size, marked `met` on
arrival. And draw one of the two `adopt` concessions from a **small** gap, so
one of them is achievable inside a term.

**Assertion:** `kept` entries > 0 across 14 × 100 (against 0 in 720), with the
kept:broken ratio in a stated band; a concession passing its `due` unmet books
exactly one `broken` entry.

### C5 — One exit, one cohesion

`st.coalition` loses a member in five places and each does something different:
`v17Walkout` sets `walkedOut` and books a ledger entry; `leaveCoalition` books
the event but not `walkedOut`; `expelPartner` books nothing; and
`confidence_threat`'s `dare` filters the array inline with no event, no ledger,
no grudge, no news. `pv5EnsureState`'s "a party that comes back signs a new
agreement" branch keys on `walkedOut` — so **three of four exits leave a
returning partner resuming on the cohesion it left with**, which is the exact
defect S17g measured as dropping coalition lifespan from 6.6 sessions to 2.1.

One function: `v21Leave(st, pid, why, actor)` that all five paths call, with
`why` deciding the news, the memory weight and whether the government keeps its
majority — **and it recounts**, which nothing does today (a partner walking out
never triggers a confidence test or a re-founding; losing your majority mid-term
is a line in the log).

Beside it, one cohesion instead of two. `pv5CoalitionTick` pulls satisfaction
12% toward a target **whose floor is 38**, while the largest single breach costs
11 — so anything slower than three red-line breaches in three consecutive
sessions is absorbed, which is the arithmetic behind 49 walkout evaluations and
3 walkouts. **The target's floor reads the ledger**: a partner with two broken
promises stops recovering.

And the walkout writes **one** `broken` entry, not three (it writes one per
unmet concession, and every agreement carries exactly three), because
`V17_PATIENCE` is 3 and `v17CanRenegotiate` refuses at 3 — so **one walkout
permanently disables renegotiation with that party for the rest of the
campaign**, which nobody chose.

**Assertion:** every exit path writes `walkedOut` and exactly one ledger entry;
a partner with a broken ledger does not recover past a stated bar; a walkout
that costs the government its majority produces a recount.

### C6 — The offer is delivered

`v17Offer` returns `offices: share >= .22 ? 1 : 0`, worth **+9** in the value.
`v17Install` copies portfolios, concessions, red lines and confidence — and
**does not copy `offices`.** A party is bought for nine points with a great
office and handed nothing. `terms.portfolios` is written in three places and
read in none; the number the cards print is `d.portfolios`, a separate counter
incremented only by a button.

The offer names a **department** rather than a count; `v17Install` writes
`st.exec` for it (`execSeat` and `v17OtherOffice` already exist); taking it back
is a breach. `terms.portfolios` is deleted, or `d.portfolios` becomes the field
the offer writes so the negotiated number is the number the satisfaction tick
reads.

**Assertion:** a party offered a department holds it after `v17Install`; taking
it back books a `broken` entry; `terms.portfolios` has a reader or is gone.

### C7 — The junior partner has a game, and the partner talks

`pv5CoalitionPanel` emits its five management buttons only under `leads(S)`, and
`V18_PAPER_NEED` marks both coalition papers `'leading'` — so **one of the
owner's three named chairs has exactly one coalition decision in it, and that
decision is to end the game they are playing.** Mirror the head's buttons for a
junior, each on an existing channel: demand a concession (a paper with a date),
withhold the whip on one division (`b.lines`), ask for a department (`st.exec`),
publish a disagreement (`st.capital` / `d.satisfaction`).

And unthrottle the coalition's voice. Every coalition paper sits behind
`st.inbox.length >= 4 || (st.turn + st.inboxSeq) % 2` — measured with the player
pinned as head of a coalition for 792 sessions: **312 blocked by a full inbox,
215 by parity, only 252 (32%) reached the coalition block at all** — while the
`demand` card calls `addInbox` directly and bypasses the gate that its own
papers are queued behind. Give the coalition its own slot, and gate it on the
**ledger** (an unmet concession past its due writes a demand; two broken
promises write a threat) rather than on `st.partyRel < 27`, which two restoring
forces pulling toward 62 and toward satisfaction make nearly unreachable.

**Assertion:** `coalition_demand` and `confidence_threat` rise from **2 and 1
per 720** into a stated band; the junior's four verbs each move something
(covered by the `no control lies, in any chair` walk, which presses everything
enabled from all three chairs); `dare` has a reachable else-arm.

### Three exploits on the same surface, closed while we are here

- **`joinCoalition` bypasses the entire acceptance model.** 12 capital puts the
  PNL in an RSF cabinet at a compass distance of **2.31 against a bar of 1.15**.
  Route it through `v17Accept` and refuse with the sentence
  `v6CoalitionCandidates` already writes. `expelPartner` is the same hole
  backwards: 8 capital removes anybody, with no vote and no recount.
- **The coalition council has no cooldown** and `lastCouncil` is written by two
  places and read by none. The button is worth **12 cohesion a press, unlimited**,
  against a walk floor of 12–30 — so a head of government with capital can hold
  every partner at 100 for the whole campaign and make the entire ledger
  unreachable at will. Read `lastCouncil`; add diminishing returns.
- **"Trade an office" charges before it checks there is an office to trade** —
  the spend precedes the search and the effect is inside `if (off)`, so the 4
  capital vanishes with no log line, no toast and no refusal, from a button that
  renders with no `disabled` and no `title`.

### And the sheet the player reads sixty-six times a campaign

`v6CoalitionDialog` is the best-written surface in the file, and it is a seat
arithmetic calculator: it builds a real offer to compute the answer and then
**discards it**, showing only `value`, `reservation` and a refusal string. The
player cannot offer more, offer less, concede a statute, refuse a red line or
trade a department. Expand each candidate row into the offer — the two `adopt`
statutes, the `refrain`, the red line, the department — with `value` and
`reservation` recomputed live off `v17Accept`, which is **pure and already takes
an arbitrary offer object**, so this is a rendering change and not a model one.
And recompute the offers for the actual `UI.coalPick` set on every toggle: today
willingness is computed on a two-party offer and the government the player then
forms is a different one, so the row says "worth 61 against a price of 44" for a
deal that is worth less than 61.

---

# What this costs the existing harness

Honesty about which of the ~200 assertions move, and the argument for each.

| arm | what moves | the argument |
|---|---|---|
| `a party moves when it has a reason to` | **`ai.budgetHeld` at 1e-6 is replaced** by N9 | split into a resting-rate gate (pinned harder: exactly the shipped budget when all weights are 1) and a ceiling gate. The owner's dial is unmoved; only the variance is new. This is the one deliberate replacement. |
| same | `ai.restive.fromInside > 0` | I4 makes `restive` reachable without the hand-set grudge of 100; the arm should assert reachability from unassisted play, which it currently cannot. |
| `a party is after something` | `sim.distinct >= 7`, `sim.spread`, `sim.orderSpread`, `steer.shrewd.sim` | all move **upward** under I1. Re-pin, do not relax. |
| `a party knows who is in its way` | `scale.worth` between grudge p90 and p99 | N6 raises grudge magnitudes; this is the tightest coupling in the file and moves without rivalry changing. Re-sweep in the same slice. |
| `a party can reach what it is after` | `neverAdopted`, `steer.carryOpen >= 40` | I2 puts `oust` in the pool and dilutes every other kind. `carryOpen` was already 39 at six seeds; widen the seeds. |
| `a party does not wait for the season` | `bar.medianRise`, `bar.maxFall` | N1 makes the cooling asymmetric and N6 adds writers. Both are re-measured distributions and must be re-measured. |
| `a plurality is not a government`, `a caretaker holds office` | the hand-seated boards | C1/C2/C3/N7 move exactly the boards that are the **only** place the minority and caretaker branches are exercised. Expect deliberate re-pinning; `pure.noDice` must stay green, so nothing in the rotation may roll. |
| `the six that are not yours act` | `six.deck === 11`, `six.cardWorks === 11`, the `moved` chain | N3's twelfth card. A five-place change in `roads.js` by design — the guard working. |
| `a party remembers what was done to it` | the sign arm and reverse-coverage are **added**; the eleven literals stay | because `v16Grudge` still reads `max(0, ·)`. `fires.afterKindness === 0` staying green is the poison-proof. |
| `a position can be pressed home` | `scopes.others.hasSponsor === false` must hold for a non-player actor | N4. |
| `the party board has a tempo` | any new per-party verb needs a cooldown and escalating price | C7's four junior verbs. |

**New arms this design owes**, at the intake's own cost model (a 14-seed × 100-
session A/B is 2,800 driven sessions, 2–4 minutes each, and the AI block already
takes 13 of the harness's 16 minutes): the formation-outcome **distribution**
(C2), the confidence motion (N5), the standing sign and both directions (N1/N6),
the plan step reachability (N2), the bargain (N3), the anticipation A/B (N8),
the tempo ceiling (N9). Copy S17f's cheap shape where possible — hand-seated
boards and direct calls, not 14-seed sweeps — and reserve the expensive driven
form for the four claims that are about play rather than about arithmetic.

---

# Build order

Sequenced so each slice can be poisoned before the next changes its population.

1. **N1** (standing) — one clamp, one reader, five consumers. Everything else
   reads it. Poison by reverting the clamp; `fires.afterKindness === 0` must
   stay green either way, which proves the reader is untouched.
2. **N6** (the book) + **I2** (`oust`) — the ledger learns to point at
   governments, which is what makes the aim adoptable. Two poisons, separately:
   the `target` filter, and the writers.
3. **I1** (the objective) — with N1 in, the rehearsal can see relationships too.
4. **N2** (plans) + **N5** (confidence) — the plan is the road and the motion is
   its end. Requires the `runQueue` override in every arm.
5. **The coalition overhaul, C1–C7** — one slice per two changes; C2's
   distribution assertion is the anchor and should be written first, red, so the
   rest of the overhaul has a target.
6. **N3** (bargain) + **N4** (press) — the chamber. N3 is a twelfth card and a
   whole slice on its own.
7. **N7** (cordon, pivotality) + **N8** (anticipation) + **N9** (tempo) — the
   three that change the shape of the board, last, because each moves the
   population every earlier arm was measured on.
8. **I3** (two-ply) + **I4** (posture) — I3 because it is the ladder's missing
   rung and reads best once there is something to reason about; I4 last because
   it moves the open-set denominator of every rate in the file.

---

# The poison list, from the diff and not from the assertions

One per changed mechanism, because writing one poison per thing the assertion
mentions proves the assertion and says nothing about the slice.

| poison | what must go red |
|---|---|
| restore `clamp(…, 0, 100)` in `v16Resent` | N1's positive-standing arm; **not** `fires.afterKindness` |
| revert either of the two direct `.grudge[` readers (35387, 36125) to the raw store | the one-reader arm; poison them **separately**, because each alone is invisible |
| revert `partyBillSupport` 9032 to `st.partyRel` | the sponsor-swap arm (three distinct scores → one) |
| revert `assentFavour`'s line term | the assent refusal band |
| delete `oust.target`'s government filter | `oust` adoption → ~0 |
| delete `v21Book`'s six call sites | the legislative/electoral share of grudge writes → 0 |
| delete each of I1's four `v19Standing` terms, separately | one card each falls out of `sim.distinct` |
| restore `d / 12` | the squash arm |
| return early from I3's reply branch | the pick must revert to the shipped ranking **exactly** |
| delete each plan step's `done`, one at a time | exactly that plan strands |
| stub `v21BargainCore` | deals struck → 0, and the `party_offer` type disappears |
| hard-code `playParty(S)` back into `v20PressCore`'s caller | `pull` non-zero → 0 of N divisions |
| delete the count in front of the confidence motion | motions rise, carry-rate falls |
| restore `V17_FORM_MAX = 7` | the formation `how` distribution collapses to `majority` |
| restore `concessions.length * 5` in `v17Accept` | swapping a concession stops moving the answer |
| restore the `<= 0.001` credit test | `kept` → 0 |
| force `f()` to 1 in N9's budget | the "all six angry raises the total" arm |
| delete `v21Pivotal`'s read in the reservation | a kingmaker prices like a bystander |
| set `st.playerRead.broke = 0` | the reputation arm — and this one must change the **record** and re-run `v17Accept`, not compare two numbers one of which is derived from the other |

Two of these are belt-and-braces pairs and must be poisoned **together**, or
each alone will read as a dead guard: I2's `fits`/`target` agreement, and I4's
two `restive` guards (the intake records that S18e's own pair had exactly this
property).

---

# The measurements this design must take before it picks a number

Every threshold below is stated as "measure it", not as a value, because this
file's history is a list of numbers picked by eye against scales the game never
reaches — `st.unrest = 80` against a ceiling of 57, `share >= .22` against an
outsider p90 of .149, `V17_STRIKE_BARS` against a pressure that peaked at 50.2.

1. The distribution of **AI-to-AI standing** in play, before N7's cordon bar is
   set. Today: mean 1.39, p90 0, p99 45.2 — a bar anywhere above 45 fires
   roughly never, and the intake says so.
2. The distribution of **`d`** in `v19Outcome` after I1's four terms, before the
   divisor is re-picked. Today: −0.964 … +2.583, which is why 12 is wrong.
3. The **open-set size distribution** before and after I4, at every posture,
   because four arms have it as a denominator.
4. The **cost of one initiative** with I3's second ply, against the 8 ms session.
5. The **six-seed pacing arc, mean quoted with the spread beside it**, after N5
   and N4 — the two changes that alter what a campaign is. `tools/pacing.js`
   prints per-seed rows and three consecutive slices in this program's history
   quoted the first row as the summary.

And one rule for every driven arm this design adds: **override `runQueue`.**
Every claim here about a government being threatened, a coalition changing
between elections, an engine entering office or a formation resolving is
downstream of the queue. Of the nine existing AI arms, exactly one overrides it;
three S20g probes that did not reported **one election in 720 sessions**.
