# S21 — The parties become opponents

**This file is the contract.** Every S21 slice is built from it. Where it and a
working paper disagree, this file wins; where it and the code disagree, measure
and then amend this file in the same commit.

Working papers: `docs/S21-BASELINE.md` (what the AI does, measured over 720
driven sessions), `docs/S21-INTAKE/` (twelve subsystem reports, ~200 findings,
every claim anchored to a line), `docs/S21-DESIGN/` (four independent proposals
and the adjudication that merged them).

## The brief

The owner, verbatim:

> "I want S21 to be an all-out focus on AI behavior, AI logic, and AI
> improvements."

> "Deliverables: at least 4 improvements to existing AI behaviors and logic, and
> at least 8 new behaviors/logic - each being significant and receiving equal
> attention."

> "In addition, the coalition building mechanic needs a serious overhaul - its
> way too flat, uninteresting, and unengaging"

They had previously scored the AI **1 out of 10** and asked for **8-10**.

This programme delivers **12 improvements and 22 new behaviours** across twenty
slices, one PR each. Four of them are the coalition proper. The last eight were
added at the owner's request after S21d shipped.

## What the measurement found, in one page

The engine is not idle. It plays 1,025 initiatives in 720 sessions at the
cadence it was designed for, and no card ever returns null. The problem is that
almost nothing it does has consequence, and several of its central mechanisms
work against themselves.

- **The deliberation argues against acting.** `v19Outcome` replays a card on a
  clone and reads `v19Standing`. Seven of the eleven cards price at *exactly
  minus their own purse cost*, because the objective reads none of what they
  write. Three of `v19Standing`'s five components moved on 0 of 1,028 rows.
- **The most-played card loses the party votes.** `court` is 27.3% of engine
  output. `v17Utility` says a happy bloc is good for whoever courted it;
  `supportTargets` says a happy bloc votes incumbent. Over 144 sweeps the
  courting party's share fell in 84 and the *government's* rose in 133.
- **Engine legislation cannot pass.** 143 engine bills archived in 300 sessions,
  zero carried; assent refuses 88.2% of them on the *player's* relationship with
  the office holder.
- **There is no party-to-party relationship.** An identical bill from a sworn
  enemy and a close ally scores to the same decimal.
- **No engine can end a government.** `v17ConfidenceVote` and `v17Refound` have
  one caller each: the player's own button.
- **`oust` is satisfied by default** on 92.7% of boards, so no engine ever wants
  a government gone.
- **The formation's four branches collapse to one.** `V17_FORM_MAX` is 7 and
  there are 7 parties. 360 of 360 formations were `majority`; no investiture has
  ever failed, because it is only called once a majority is already held.
- **The agreement can only be broken.** 40 ledger entries, 40 breaches, 0 kept.
- **The tempo is zero-sum.** Provoking all six parties gives byte-identical odds
  to provoking none.
- **And 5.1% of the sentences an engine emits name the player at all.**

## Rulings

These bind every slice. They were the live disagreements between the four
designs, settled here.

**R1 — The `instinct` floor governs competence, not the constitution.** At
`aiLevel: instinct` the opponent must behave exactly as it shipped. That covers
`v19*`, `v16Ai*`, the chooser, the goals, the memory and the reaction. It does
**not** cover the rules of the republic: `v17Rotation`, `v17Invest`,
`v17Accept`, the agreement clock and the confidence machinery change for
everyone, because a player on `instinct` must not be playing a different
country. Any item touching competence names its gate; any item touching the
constitution says so explicitly.

**R2 — The eleven-card deck is part of the floor.** `v19Choose` draws uniformly
when `sharp <= 0`, so adding a twelfth card changes `instinct` by construction.
All four designs added cards and none noticed. **Every new card gates its `can`
on `v19Thinks`**, so the `instinct` deck stays eleven. A new card also costs six
registry entries (`V16_AI_COST`, `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS`, a `post:`
array, every goal's `worth` table) and two lines in `roads.js`'s `moved` chain.

**R3 — The party-to-party relation is the existing grudge, re-signed.** Relax
`v16Resent`'s clamp to (-100, 100) and give `v16Grudge` a `Math.max(0, .)`. A
grudge of 12 becomes a standing of -12, every existing reader and every
`roads.js` literal is untouched, and the twelve negative `V17_MEMORY` weights
that already claim to work stop lying. **Rejected: a parallel trust matrix.**
This file punishes second mechanisms computing a fact the first already
computes.

**R4 — No second ply.** The rehearsal is fixed by making the objective see what
the cards do, not by looking further ahead. A card chosen after two plies emits
the same sentence as one chosen after one, and the goal table alone already
names the same card as the full seven-term score on 70-80% of open sets.

**R5 — `V16_AI_CADENCE` is not touched.** It is the owner's dial and it is
already measured: six parties acting every session took elections won from 5.5
to 1.2. The defect is that the budget is zero-sum, not that it is small.

**R6 — Anything that plans is a result, not a container.** No plan objects, no
itineraries. Where a design wanted multi-session intent, the merge takes the
observable result (a goal that survives, a motion announced before it is put)
and refuses the machinery.

**R7 — Measure before picking a number, and put the measurement in the
assertion's own words.** S17q's bar sat above its own ceiling; S19's pacing
figures were one seed quoted as six. Every threshold in S21 cites the
distribution it gates on.

**R8 — Any instrument that wraps a card's `run`, or anything a card calls, must
check `V19_SIMULATING`.** The first S21 baseline probe did not, and reported
4,941 initiatives where there were 1,025.

**R9 — Any driven assertion about elections, coalitions or offices must
override `runQueue`.** Only one of the nine existing AI arms does. The rest
legitimately measure the initiative pass, which runs before the queue; anything
downstream of it measures a republic that never holds an election.

## Three errors caught in adjudication, recorded so they are not rebuilt

**An asymmetric investiture count inverts the result.** One proposal counted
members on the government side and parties on the other. Driven, that would turn
360 of 360 majorities into roughly zero. S21e counts members **on both sides**,
through `partyDiscipline`, keeping S17f's abstention rule.

**`v17Utility` does not read `affOf`.** One proposal argued the simulation and
the ballot would agree once the bloc term was fixed, on the basis that
`v17Utility` reads `affOf` at 13715. It reads `p.aff` raw. The agreement
therefore rests entirely on the `supportTargets` swap in S21c, and S21j is still
needed.

**`v20PressCore` calls `shiftPartyRel` at 38296**, which is the player-facing
axis. Giving the engine the press verbs without routing that call through
`v21Regard` would have six engines writing the player's own relationship number
for fights the player is not in. This is why S21k cannot be folded into S21c.

## The programme

Twelve slices, one PR each. Ordering: anything nine later items read goes first
even when cheap; anything that moves the open-set denominator of every measured
rate goes last, because the arms in between are measured against that
population.

Full item detail, scores and adjudications are in `docs/S21-DESIGN/JUDGE.md`.

### S21a — The regard, signed  ·  SHIPPED  ·  1 improvement, 1 new

The foundation; nine later items read it. `v16Resent`'s clamp opens to
(-100, 100), `v16Grudge` gains `Math.max(0, .)`, and `v21Regard(st, a, b)` is
the signed reader. The two raw `.grudge[` sites route through `v16Grudge`.
Credit cools slower than injury. New signed readers, each gated and poisoned
separately: `partyBillSupport` (voter to sponsor when neither is the player),
`assentFavour` (holder to sponsor), `v16PactPartner`. `pact` writes both sides
and gets its first renderer. `V17_MEMORY` gains a sign arm and a reverse
coverage arm, which catches `radicalise` (a weight naming a verb that does not
exist) and `defect: {self:18}` (a verb that hands a party 46 seats and makes it
resent the player).

Pins: a sponsor swap across seven parties produces at least three distinct
scores for one voter, against the measured one; the assent refusal rate falls
from 88.2% into a measured band, driven.

**Delivered.** Assertion `a party can be owed, and remembers it`, nine arms,
**eighteen poisons from the diff, all eighteen redden**. Five distinct sponsor
scores across 19.2 points, monotone in the regard. Assent signing .065 to
.111, refusal 88.2% to 83.8%. Goals reached 76 to 91 across fourteen seeds,
`carry` 4 to 12. Harness 201/201.

**One item was measured out and deferred.** Writing the pact's second
`st.aiPacts` key is correct in intent -- `v16PactPartner` already treats the
arrangement as mutual -- but that same refusal makes it an OPEN-SET change:
two keys lock both parties out of future pacts where one locked the proposer.
Bisected, that single line took S19b's rivalry lift from +.026 on boards
carrying a rival to +.004 and inverted it against the +.024 on boards carrying
none. It goes in the slice that owns open-set changes, per the ordering rule
above. Both parties still remember the pact.

**Four harness casualties, none worked around.** The manifesto clock leg went
from twelve seeds to fourteen and its `afterOldClock` shares became reported
figures rather than assertions -- they are a second reading of a claim
`meanAt` makes with a two-fold separation, on samples of 16 and 32 where a
strict inequality against half turns on one aim, and the SHIPPED build cleared
one of them by half an aim. S20g's driven leg went from four seeds to six
after its own count floor landed on exactly 20. And two probes were reading
state they claimed to isolate from: the assent arm now pins `assemblyVote`
(unpinned, both its poisons came back green carried by the forecast, which
this slice also taught to read the regard), and the declared-line arm now
measures on a fresh republic rather than the one four hundred assertions above
have been driving -- it read .120 per point of chamber against .467 on a clean
board, all three readings compressed by the same 3.9x, which is saturation and
not a broken mechanism.

### S21b — What a party holds against a government  ·  SHIPPED  ·  2 improvements, 1 new

**A CORRECTION TO THIS PLAN, FOUND BY BUILDING IT.** S21e below attributes the
formation's four unreachable branches to `V17_FORM_MAX` being equal to the
party count. That is true and it is not the binding constraint. The branches
were unreachable because **nobody ever refused an offer**, and nobody refused
because nobody held anything against anybody: `V17_MEMORY` records only what
the player's buttons did, so a government could govern against a party for a
hundred sessions and that party regarded it exactly as before. Adding the
political memory alone -- with `V17_FORM_MAX` untouched -- takes the outcomes
from 359 majority / 1 minority / 0 grand / 0 caretaker to **333 / 15 / 11 / 4**,
and acceptance at the table from 71.7% to 45.1%. S21e's own changes still
stand; what changes is the claim about why they are needed.

`v21Answer(st, kind, actor, target, w)` and `V21_POLITICS`, covered both ways,
gated on `v19Thinks`, returning early under `V19_SIMULATING`. Six writers: a
statute carried away from a party's `wants`, a bill of theirs voted down, an
office lost, a demand refused, a freeze-out at `v17Install`, and the ballot.
`expireInbox` stamps `provokedAt` at `st.turn + 1` so the reaction layer can
see its own largest input — today it runs at 13481 and the writer feeding 63%
of it fires at 13488. `oust`'s three predicates start asking one question about
the government, and `done` stamps `g.gov` at adoption.

Widest coupling in the programme, which is why it is second.

**SHIPPED, and what the coupling actually cost.** Five arms of `roads.js` went
red on the build. Four were the arm rather than the game and are recorded in
their own commit. The fifth is worth a paragraph here, because it is a rule
this programme will meet again:

`easy is a cakewalk, not a coronation` asserted that the street speaks on
**seed 4242**, and S21b turned that boolean over while touching no term in
`v17StreetHeat`, no bloc, and no unrest. Bisected across ten reverts, exactly
one restored the old figure — `expireInbox` re-dating the provocation stamp —
and switching off the entire political-memory table restored nothing at all.
The mechanism is the fix working: parties now answer an ignored letter, so
they play different cards, so every trajectory downstream is different.
Measured over eight seeds, the street speaks on **7 of 8 before and 6 of 8
after**, peak heat 33.1–54.2 against 29.0–53.2 — one seed's difference on a
binary outcome at n=8, inside the tier's own 21-point spread.

**A reshuffle, not a result.** That is S16a's ruling, which was made about
pacing figures and is exactly as true of a boolean, and which `tools/pacing.js`
had to be rebuilt to stop people reading past. The arm now reads six seeds on
`easy` and asks about the TIER. Any S21 slice that changes what an engine
chooses will move single-seed readings this way; the answer is to widen the
reading, not to chase the seed.

### S21c — The rehearsal can see what a card did  ·  SHIPPED  ·  3 improvements

Four terms enter `v19Standing`: bills in flight, a pending amendment, a live
pact, position closed by `st.push`. `v17Share * 60` becomes
`supportTargets(st)[pid] * 60`; the ruling +18 and office +9, which moved on
zero rows, are deleted. The squash divisor is re-set from the re-measured
spread. `v16CardCost(id)` becomes one table over all cards with the coverage arm
`harness.md` says is missing — today `V16_AI_COST` holds 8 of 11 and prices
`article`, `order` and `floor` as free. `aiGovern` reads `v19BillFor` above
`instinct`, with the roll drawn and discarded so the dice count is unchanged.

Largest single mover of the card mix, so it goes early and later arms are
measured on the new population.

**SHIPPED. Three corrections to this plan, all found by measuring first.**

**1. "Prices `article`, `order` and `floor` as free" is right about the READER
and would be read as wrong about the game.** The three cards always charged,
through `V17_AI_COST_ARTICLE`, `_ORDER` and `_FLOOR`. What could not see them
was `V16_AI_COST`'s two readers, both of which read `V16_AI_COST[id] || 0`:
`v19Score`'s money term and `v18Tempo`'s broke test. The defect is a table with
two sources of truth, not a free card.

**2. Six terms, not four, and the sixth was found by asking which cards the
four still missed.** With bills, articles, pacts and `push` alone, `demand` and
`floor` still scored at exactly minus their price. Two more close them: a
POSITION DECLARED on a live bill (`b.lines`, which `partyBillSupport` reads at
16/−18, so it moves a real division) and an OUTSTANDING LETTER. And the bill
term reads the whole order paper rather than the party's own bills, because a
party minds what is before the house and not whose name is on it — which is
what lets the government taking up its demand read as a gain to the party that
asked. `demand` is still only covered on 26.7% of its rows, and the remainder
is deliberate: what it leaves against an engine government is a GRIEVANCE, and
R8 forbids writing memory during a rehearsal.

**3. THE SQUASH DIVISOR WAS MEASURED AND DELIBERATELY LEFT WHERE IT IS.** The
intake called the squash and both clamps dead, and the clamp half is true —
over 886 rehearsals |d| runs .0013 to 2.75 with a p99 of 2.71, so `d/12` spans
.0001 to .229 and ±1 is unreachable by a factor of four. But `v19Score` adds
`sim * this` and **`sim` is 1.9 at `ruthless`**, so the rehearsal is already
worth up to .43 against a goal table whose ceiling is 1. Re-setting the divisor
to the p99 — which is what makes a clamp fire — would take the rehearsal to
1.9, nearly TWICE the goal's ceiling, and a party whose simulator outweighs its
aim has no aims. That is what R4 forbids and what the function's own comment
was written to prevent. So the clamp is a guard against a board none of these
seeds produced, the divisor is the scaling, and moving it is a balance change
that belongs to the owner under `AGREEMENT.md`. What ships is the correction to
the comment, which claimed the term was "squashed to about −1..1" and was a
card that lies.

**4. A FOURTH ENGINE BILL ROAD, found by writing the poison list from the
diff.** `pv5AiPrivateBill` picks by `partyDemandPolicy`'s biggest gap — the
same defect `aiGovern` had, on the opposition side. An engine has THREE doors
to the order paper and they disagreed, so the same party laid a statute it
could carry through one and one it could not through another.
`partyDemandPolicy` is still called and still the fallback, because it ROLLS
(S18c) and because it is shared with the demand card (which `roads.js` pins on
purpose), so the change goes in the caller and not in the body.

**The measurement that states the defect:** on the shipped build **nine of the
eleven cards returned a single constant** from the rehearsal — min, median and
max the same number, exactly minus the card's own price tag. On the new build,
one does (`bill`, which always lays the statute its own table names, so every
instance of it is a good one).

**Poison run: 22 red of 24, and the two greens are adjudicated.** Putting the
three S17 names back as literals with the SAME values is a pure refactor, and
restoring the flat ruling/office terms genuinely changes nothing because they
cancel — which is the proof they were dead rather than a weakness in the arm.

**Three things the poison run caught that the assertion had not:**

- **A leg that computes is not a leg that is read.** The first version asserted
  `v16CheapestCard()` equals the table's minimum and nothing else — and putting
  the old name back at the CALL SITE in `v18Tempo` left it green. Every gate in
  this harness calls a function and something in the game has to read it. The
  arm now drives `v18Tempo` across the band (12 to 16) the change lives in.
- **Flatness is escapable through an unrelated clamp.** With the bill term
  deleted, `bill` still came back non-flat, because the purse term is
  `min(20, purse/100) * 1.2` and a party over 2,000 has it saturated. So the
  six terms are also read ONE AT A TIME, by making the change the card would
  make and asking `v19Flight` either side — the driven leg says the terms reach
  real rehearsals, the unit leg says which is which.
- **A term read against nought instead of against its own pair.** The unit leg
  asked whether declaring a position AGAINST a bill scores negative. It does
  not, and should not: both of its cases put the same bill on the paper, so
  both carry that bill's docket value (1.5 for, 0.78 against). What the line
  term decides is which is worth more. Asking for a negative was the probe
  reading the bill's worth and calling it the line's.

### S21d — The agreement bites  ·  SHIPPED  ·  Coalition 1 of 4  ·  3 improvements, 1 new

`V21_DUE` sized from the instrument the answer has to use (lay, floor,
signature: 8 sessions), with the arithmetic in the constant's own comment.
`v21DealClock` books an overdue breach; the paper reports the clock and never
decides it. Per-rung `V17_KEPT` with `c.from` stored at signature, and one
concession drawn from a small gap so a promise is reachable inside a term.
`pv5CoalitionTick`'s restoring drift reads the ledger, so a partner with two
broken promises stops recovering. `partyBillSupport`'s flat +12 for a partner
becomes a reading of `d.satisfaction`, scaled from the measured cohesion
distribution (min 20, median 38, p90 48.1, max 76) so the sign flips inside the
range the game actually produces.

**MEASURED BEFORE BUILDING, AND THE PREMISE WAS WRONG IN THE SAME WAY S19c'S
WAS.** Over 394 partner-sessions across six seeds: **0 promises kept, 19
broken.** Not "kept too easily" — never once.

The cause is that **every outstanding `adopt` concession asks for a gap of
exactly 4** — p10 4, median 4, max 4 — because `v17Offer` and both other mint
sites take `pv5TopWants`, the party's BIGGEST gaps. A bill moves a statute ONE
rung and takes a median of 2 sessions (p90 5), and `activeBillFor` forbids a
second on the same statute while one is live. So a promise needs four
successive bills, eight to twenty sessions of the government's whole
legislative programme, for one partner's one concession.

That is exactly the defect S19c found in `carry` and this file already records:
*"it took the biggest gap in the party's own table, which measured 4 on every
adoption against an instrument that moves one, so it was reached 0 times in 136
adoptions."* The same mistake, in the coalition agreement, unnoticed because
nothing measured it.

So the slice changes shape. **It is not "one concession drawn from a small
gap"** — it is that a concession must ask for a rung the instrument can reach,
which is what makes every other item on this list mean anything: a clock is
decoration on a promise nobody can keep, per-rung `V17_KEPT` never fires, and a
ledger that reads 0 kept against 19 broken is not a record, it is a countdown.

**And `V21_DUE` cannot be sized until the gap is.** The plan's 8 sessions was
derived from lay + floor + signature for ONE bill; the measured life of a bill
end to end is median 2 and p90 5. The instrument decides the deadline, so the
deadline is set after the rung is.

Two smaller corrections from the same run. **No concession anywhere carries a
date** (`due:null` at all three mint sites), confirmed rather than assumed. And
**the restoring drift is not restoring**: it reads median −0.18 a session, p90
+0.05, against a target of ~38 that cohesion already sits at (median 39.9). The
plan's premise that a partner "recovers" and must be stopped is backwards —
nothing recovers, because `progress` is near zero for the reason above.

**SHIPPED. Measured after: promises kept 0 → 18, broken 19 → 18, over 403
partner-sessions. Every concession carries a date. Cohesion 20/39.9/52.8/76 →
25.2/44/56.7/77.1, with bill life unchanged at median 2 — the legislature was
not disturbed.** Ten legs, 18 of 18 poisons red.

**A FIFTH KNOB NOTHING IN THE GAME COULD TURN, deleted rather than shipped.**
`v21Rungs` multiplied a kept promise's payment by the rungs it covered, under a
comment claiming a four-rung legacy promise "pays for the four sessions of
legislative programme it cost". The poison that flattened it came back green,
and the reason is arithmetic: `v21Rung` caps a fresh promise at one rung, and a
legacy promise has no `from` to measure from, so the function returned 1 for it
too — in a line I wrote. A multiplier that could only ever be 1, under a comment
that said it scaled. After S17r's two, S20d's `restive` floor and S20f's posture
filter, this is the fifth, and it came out in the poison list rather than after.

**Four faults in my own assertion, each found by a poison coming back green:**

- `laysThePromise` was satisfied by an infinite thumb as easily as by a
  preference — the arm could not tell "reaches for a promise" from "obeys one".
  Now asked about a promise the chamber would throw out.
- Counting `kept` ledger entries said a promise was kept, not that it was worth
  anything: `v17Ledger` records the entry whatever the payment is.
- The clock leg stood its deadline where the falsy-`due` defect could not bite,
  and separately was green on a **refrain** breach booked by the red-line scan
  in the same function. The clock had never fired once.
- A load-order poison that moved code *within* a chunk, where declarations
  hoist and nothing can break. The cross-chunk version reddens.

**And `V21_PROMISE_PULL` was measured rather than argued.** I priced it at 12 by
analogy to `V20_AIM_BILL` and asserted in the comment that a promise is a
preference and not an override. Over 715 promise-boards across eight seeds the
deficit runs −3 / p50 **9.6** / p90 18 / max 43.2, so at 12 the government keeps
68% of its promises and refuses 32% — the sentence is true and 12 sits just above
the median. The one board the arm first read had a deficit of 8.8 and nearly had
me re-tune a correct constant off a single seed: S16a's ruling, met in a fourth
place.

### S21e — The table is a negotiation  ·  Coalition 2 of 4  ·  4 improvements, 2 new

`v17Offer` gains a generosity parameter: varying concession count, priced by the
invitee's gap and the formateur's `v17Friction`, with red lines entering the
value. The offer names a department, `v17Install` seats it, and taking it back
books a breach. The reservation drops its posture term (which reads the
government being replaced) and reads `v21Regard`. `v21Kingmaker(st, pid)` is
pure over 128 subsets, computed once per formation, installing no field.
`v17Invest` counts members symmetrically through `partyDiscipline`, keeping
S17f's abstention rule. `V17_FORM_MAX` falls to 3 with `V21_INVITES = 3` and a
re-mandate round at raised generosity, which is what makes rounds two to four
reachable. The formation sheet expands each candidate row into the real offer,
recomputed live.

Named casualties: `a plurality is not a government` and `a caretaker holds
office`, both re-derived. `form.pure.noDice` stays green — nothing here rolls.

**MEASURED BEFORE BUILDING** (six seeds, 120 sessions, 377 formations, 2,623
accept decisions):

- **Every offer is identical in shape: 3 concessions, ONE distinct value.**
  Generosity is a real gap, not decoration — there is no variation to speak of
  today.
- **The decision is close where it matters.** Accept share .333; the accepted
  median clears by +14 and the refused median misses by −18, and **1,455 of
  2,623 refusals sit within twenty points**. A term worth ~10 flips real
  decisions, so the reservation reading `v21Regard` is live.
- **641 refusals are `far`** — structurally unbridgeable, and generosity
  correctly cannot buy them.
- **The posture term fires on 1,228 decisions (31%).** The plan says drop it.
  Deleting a +16 term that frequent, against 1,455 refusals within twenty
  points, is a LARGE balance move in the accepting direction — the same shape
  as the S21d drag. It is measured before and after, not assumed.
- **A second formateur is tried on 59 of 377 formations, and the max tried is
  seven.** So `V17_FORM_MAX` is not inert: cutting it to 3 removes rounds that
  currently succeed, and S21d's caretaker regression is the warning. Measured
  against the caretaker episode count before it ships, or it does not ship.

**THEN EVERY REMAINING ITEM WAS CHECKED AGAINST THE CODE BY INDEPENDENT READERS,
EACH ADVERSARIALLY CHALLENGED. Three of the six do not survive.**

**`v17Invest` counting members symmetrically — DROPPED. It is a provable
no-op.** `divisionOf`'s share function is odd about 50: `share(d, 100-s) =
1 - share(d, s)` for every discipline `d`. So with the abstain bucket kept, the
sign of `aye - nay` flips only if the OPPOSITION is more disciplined than the
government, seat-weighted — measured at 0.428 against 0.427. Swept across six
government/opposition support pairs, **174 of 174 investitures unchanged**. This
is a knob nothing in the game can turn, proven algebraically *and* by sweep, and
it would have been the sixth this programme deleted. It also has a hidden
prerequisite the plan never names: `partyDiscipline` needs a per-party
support-for-this-government scalar that does not exist.

**`V17_FORM_MAX` → 3 "which is what makes rounds two to four reachable" —
the causal half is FALSE, and this programme has already written that down
twice.** S21b's own correction records that political memory alone, with
`V17_FORM_MAX` untouched, moved outcomes from 359/1/0/0 to 333/15/11/4, and
`roads.js` now asserts `branches >= 3` as a shipped guarantee. `JUDGE.md`
adjudicated the identical sentence during design. And the constant is *already*
dead: `PARTIES` holds exactly seven entries and is never mutated, so
`i < order.length` always fails at or before `i < V17_FORM_MAX`. Any re-mandate
round must be justified on its own terms, not on a reachability claim that is
untrue.

**`v21Kingmaker` — HELD, pending a consumer.** "Pure" survives. "Installs no
field" is false in letter (`ppos` writes `st.ppos` on read, the `v6TreatyRows`
shape — harmless here, but only because three readers were checked). The real
risk is that nothing consumes the number: a pivotality reading with no stated
reader is decoration by this file's own rule. It ships only once a site that
reads it is named.

**And the reservation's posture term is worse than the plan said.** `v16Posture`
takes **no `lead` argument**, so the +16 is charged identically against all seven
formateurs, and it can only fire on parties that were in opposition to the
*outgoing* government. The common case is a party charged sixteen extra to join
the government that is REPLACING the one it hates — not stale but wrong-signed.
(One challenger disputes this at one of the two caller contexts; measure the
sign of the store at the table before acting.)

**THE SHEET IS THE OWNER'S COMPLAINT WITH A LINE NUMBER ON IT.** `v6CoalitionCandidates`
builds the real offer and **drops it one line later**; the row the player reads
is a party name, two scalars and a seat count. The whole negotiation — every
concession, every red line, the price the formateur set — is computed and thrown
away before it reaches the screen. "Flat, uninteresting, unengaging" is this.

**A defect in S21e's own new code, found by the same pass:** `offer.generosity`
is written and read by nothing — `st.court.size` in code two hours old. It is
kept only because the sheet is going to read it; otherwise it comes out.

**Two more `st.court.size` instances found in passing**, both in scope for this
slice because it is already touching the offer: `d.terms.portfolios` is written
by three sites and read by none, so the offer's `portfolios` promise is
decorative; and the coalition portfolio trade takes a great office off one
partner and books nothing against them at all — no ledger entry, no cohesion
cost, no breach.

**AS SHIPPED, THE GENEROSITY PARAMETER IS NOT IN THE BUILD, AND THE REASON IS
MEASURED.** The plan asked for "varying concession count, priced by the invitee's
gap and the formateur's `v17Friction`". Three builds of it were measured and none
could ship. `v17Accept` reads `concessions.length` and nothing about their
identity, so a varying count is a varying VALUE — and `v17Build` walks its pool
greedily, gaining from every acceptance and losing NOTHING to a refusal, because
a refusal simply moves it to the next party. Bid variance is therefore one-sided
in its effect: **any** spread makes formation strictly easier, whatever its mean.

Over twelve seeds of forty sessions, against the build before this slice:

| build | kept / partner-session | player's party governs | mean coalition |
|---|---|---|---|
| before this slice (flat 3) | 0.044 | 36 of 480 | 2.28 |
| count varies, mean 2.71 | 0.006 | 226 of 480 | 2.68 |
| count varies, mean 3.33 | 0.011 | 122 of 480 | 2.38 |
| count varies, mean 3.23 | 0.031 | 152 of 480 | 2.46 |
| **WHICH varies, count fixed** | **0.041** | **36 of 480** | **2.26** |

Lowering the mean bid kept the branch mix and kept the collapse; holding the mean
on the constant kept the promises and turned every formation into a majority, 360
of 360. Four AI assertions failed that are green on the build before the slice.
That is S21d handed back in the course of decorating the sheet, which is the S19d
pattern this programme has now recorded twice.

**What ships varies WHICH statutes an offer names, at a constant three.**
`v17Mind` reads how far the formateur's own table is from the invitee's on each
want and the offer takes what it minds least, so two formateurs bidding for the
same party put different things on the table and every accept decision in the
game is arithmetically identical to what it was. Over 42 ordered pairs the offers
fall into 22 distinct sets, and every invitee is offered between two and five of
them — asked per invitee, because a party offered the same three things by all
six formateurs is a party nobody negotiates with however varied the board total
looks. `offer.generosity` and `V17_GENEROSITY` are gone with the count.

A price that varies belongs to a slice that can pay for the compensating change,
and the compensation is structural rather than a constant: as long as a refusal
costs a formateur nothing, no bid distribution is neutral.

### S21f — One exit, and the partner speaks  ·  Coalition 3 of 4  ·  1 improvement, 3 new

`v21Leave(st, pid, why, actor)` replaces four disagreeing exits; it books one
ledger entry rather than one per unmet concession, which today takes
`v17Broken` straight to `V17_PATIENCE` and permanently disables renegotiation
with that party. `joinCoalition` stops bypassing the acceptance model.
A `checks/run.js` ratchet at zero on writers of `st.coalition` outside
`v17Install` and `v21Leave` — static, under five seconds, and the only guard in
the four designs that catches "four ways to leave and they disagree" before a
playtest. `d.press` runs null → asked → insisting → threatening, driven by the
ledger, with `coalition_ultimatum` as its own paper type. `v21Defect` lets a
partner under its walk floor withhold a vote instead of leaving.

The producer's two `rand()` calls are hoisted into one block so the draw count
is constant whichever branch fires. This re-phases the stream once,
deliberately, and is recorded.

### S21g — A government that can fall  ·  Coalition 4 of 4, the keystone  ·  1 improvement, 3 new

Two cards, `topple` and `bargain`, both gating `can` on `v19Thinks` per R2, with
full registry coverage. `notice_of_motion` is posted a session before the
question is put, printing the tally the mover counts, with one owner of the date
so `expireInbox` cannot clear the notice before the motion fires.
`v21Confidence(st, mover)` counts members and gives `v17ConfidenceVote` and
`v17Refound` their second callers. A failed motion costs the mover.
`d.terms.confidence = 'supply'` becomes the enum's second live value, with
concessions, dues, a recurring price, and a withdrawal that clears
`st.confidence` and puts the government in front of the vote.

Pins: motions moved, at least one carried, and government changes between
elections against the measured 3 in 720.

### S21h — The junior partner's game  ·  3 new

Five verbs on the junior partner's deal card, each sharing a Core with the
engine's verb from S21f and S21g: ask for a concession, ask for a department,
withhold the whip, publish the disagreement, threaten to withdraw. Every one
driven by a real click from the junior chair, with one predicate answering for
the button, the handler and the fold that hides them — the S18a rule. Each takes
a cooldown and an escalating price, per S20c.

### S21i — The ballot has consequences, and an aim finishes  ·  2 improvements, 2 new

`v21AfterBallot(st, before, after)` runs from `runElection` after `driftParties`
and before `v17Form`, gated, spending no dice. The biggest loser resents the
biggest winner; a party that lost the government is handed `oust` against
whoever took it; `driftParties` gets narrated. A party beaten twice replaces its
leader **deterministically**, because a roll here re-phases every campaign from
the first replacement onward. `a.wins` counts reached aims and `v19Score` reads
it; a completion writes a log line and a chronicle entry; `lastGoal.by` names
what beat a failed aim. The goal clock ticks per session rather than per
observation — today a party too poor to act never ticks, then loses its aim the
moment it can act again.

Named casualty: `a party votes its own manifesto`, the largest single block in
the harness. Re-derived in this slice.

### S21j — Courting is a relationship  ·  1 new

`st.blocLean[pid][bloc]`, written by `court.run` above `instinct`, decayed
slower than the national reversion, read in `affOf`. `ground.target`,
`progress` and `done` re-point at the lean, which is what makes the aim
reachable: the steady-state lift on `st.blocs` is +3.0 against a requirement of
+14. The bloc card names which parties hold standing.

Read `supportTargets(st)[pid]` either side of a real `court.run`, never
`st.blocs`, and assert the sign is positive for an opposition party against the
measured -1.08%.

### S21k — The engine works the floor, and is seen doing it  ·  1 improvement, 1 new

`press` becomes a fourth verb inside `floor`, so the engine gets the persuasion
layer written for it in S20b — today `bill.pull` has one writer whose only
caller hard-codes `playParty(S)`. `v20PressCore`'s `shiftPartyRel` routes to
`v21Regard` when neither party is the player. `pressure`'s bar is re-set against
the measured support distribution or the branch is deleted.

And the visibility all four designs missed: `bill.lines` gets a renderer (it is
written on 69 plays and rendered nowhere, while `MAP.md` calls it printable),
the pending-article card names who laid it, and the order record's `by:actor`
gets a reader. `government_offer`, `opposition_conference` and
`coalition_review` get real triggers and fire again.

Pins: `bill.pull` non-zero on a measured share of divisions against 0 of 22,932;
opposition bills passed against 0 of 143.

### S21l — The board's temperature, and the mood the page prints  ·  3 improvements

Last, because posture decides the open set and every rate in S19b, S19c, S19f
and S20g has an open-set denominator.

The tempo budget scales with the board's mean weight instead of normalising it
away, **gated on `v19Thinks`** — none of the three designs that proposed this
noticed it breaks the floor. `ai.budgetHeld` survives untouched as the
`instinct` leg. The grudge and purse terms become graded, so a grudge of 35 and
one of 100 stop weighing the same. Posture gains a minimum tenure and
`postureSince`; the panel renders `v16Posture` live and `a.posture` becomes
"last acted as", which is stale on 25.6% of rows today. `consolidate` asks a
relative question; `restive` gets the trapped-partner channel it needs to occur
at all, having occurred 0 times in 4,320 party-sessions. `purposeful` gets a
measured non-zero `read`, so the sentence the page already prints at the default
level becomes true.

Named casualties, argued rather than dodged: `ai.budgetHeld`,
`rank.purposeful.gain === 0`, and the four open-set denominators, re-measured
before and after inside this slice.

## The dossier, built incrementally

The answer to "5.1% of engine sentences name the player" does not fit as its own
slice without duplicating surfaces. `v21Emit` is written in S21b; S21b, S21i and
S21l each add their own records to `st.ai[pid].file` and their own rows to the
Parties card. The coverage arm — every card's `run` produces exactly one record,
and a record whose verb is not in the deck reddens — grows with the deck. The
card is finished in S21l.

## The owner's extension: eight more new behaviours

Asked for after S21d shipped, in the owner's words: *"Tbh I'd really like it if
an additional 8 AI behaviors / logic features were added in s21."*

Sourced by mining the thirteen intake reports for findings the twelve slices
never claimed, merging 46 raw candidates down to 32, and picking against one
question: would a player feel it across a session.

**They share a cause.** Nearly every capability in this game is player-only. The
engine cannot hold a coalition council, draw a boundary, license a newspaper,
earn an endorsement, lead a strike, cordon a rival, reach the emergency book, or
say a word about a bill it laid itself. That is not eight gaps, it is one gap
with eight faces, and it is most of the owner's "1 out of 10": an opponent that
cannot do what you can is not an opponent.

Every item below names the existing reader its effect lands in, because a
behaviour whose effect nothing consumes is the decoration this file deletes.

### S21m - The party in office gets a deck and a second mood

`govern` appears in three of the eleven `post:` arrays, so a government's whole
output is order, campaign and article, on every board and every seed. It never
courts a bloc, never builds its organisation, never speaks on a bill. And
`v16Posture` returns `govern` unconditionally before reading a single fact, so
the party in office behaves identically in its fiftieth session and its first.

Open `court`, `organise` and `floor` to `govern` through a second list read only
when the party thinks, so the instinct deck stays eleven cards. Add one gated
posture for a government whose smoothed support sits below its seat share.

Measured: govern's mean open set is 1.56 with 24.1% of sessions EMPTY, against
5.00 for `hold`. The support gap runs -8.05 to +11.41 with a median of -1.14, so
a bar at -2 occupies 36.4% of government-sessions. Inside the distribution,
which is what S17q's failure was about.

Channels: `st.machine` to `machineOf` to `supportTargets`; `b.lines[actor]` to
`partyBillSupport` at 16/-18; `st.blocs` to `supportTargets`, where `court` has
the right sign only in this chair.

### S21n - The government that is not yours keeps its own coalition

Somebody else governs in about 98% of the sessions a player watches, and that
government's coalition can only decay. No engine has ever held a council, traded
a department or reopened an agreement. The player has all three buttons.

Channel: `d.satisfaction`, which since S21d has four live readers and needs no
new one.

### S21o - An engine government can descend

The emergency book is player-only. A Vanguard or Restoration government cannot
open an investigation, federalise a count, license the press or classify a
record, so the descent the game is named for can only ever be the player's.

Channel: `st.extra[id]`, five live readers, all reached through S15 wrappers
rather than the base bodies. `securityState` is reassigned at 33720, so the
guard goes on the live function.

### S21p - Put a party at the head of the crowd

A general strike shuts the country and no party stands at the head of it. The
street is a weather system rather than a thing a party can ride.

Channel: `st.street.pressure` to the demand bar at 26 and the strike bar at 58,
then `v17StrikeBar` and `v17Barred`, the sibling of the caretaker gate.

### S21q - Put a price on the benches

A party writes offering to take its members through the aye lobby on one bill if
you drop your opposition to another. Accept and its line changes on the card that
session and the forecast moves before the division.

Channel: `v17FloorCore` to `b.lines[pid]` to `partyBillSupport` at 16/-18. The
paper machinery is complete and extensible.

### S21r - An engine fights for the bill it laid, and the House answers yours

143 engine bills were archived in 300 sessions and none carried. An engine lays a
bill and is then mute about it for the rest of its life. And almost no bill of
the player's is ever spoken to before the division.

Channels: `v20PressCore` writes `b.pull[pid]`, `billPull` counts it through that
party's seats; `b.lines[actor]` reaches `partyBillSupport` and the forecast.

### S21s - An organisation endorses somebody other than you

Eight named national organisations exist in a seven-party republic and six of
the parties can never be endorsed by any of them.

Channel: `endorsedTurnout` to `partyTurnout` to `ballot`, where every party's
base is multiplied by it.

### S21t - A party that will not sit with another

`st.cordon` has five readers and two writers, both player buttons. Parties
cannot refuse each other, so a formateur is never forced to choose between two
parties it needs, and a player can never be vetoed by a party they are not
asking.

Channel: `st.cordon`, read by `v17Eligible`, `partyBillSupport` at -8, the AI
bill score at -8, and `v6CoalitionCandidates`.

### What was measured and left out

Twenty-four other candidates survived the merge with live channels. The ones
closest to the line, recorded so they are not re-derived: the boundary pen and
the press licence being player-only; election night printing the projection
rather than a count with doubt in it; `v17Utility` weighting the PLAYER's
political capital at +0.5 when a hostile government answers a crisis, so it
quietly funds the opposition it is fighting; and three aims printing the seat
counter as their progress.

## Deliverables against the brief

| | required | delivered |
|---|---|---|
| Improvements to existing AI behaviour | at least 4 | **12** |
| New behaviours | at least 8 (owner later asked for 8 more) | **22** |
| Equal attention | every item significant | one slice per PR, each with its own assertion, its own poison list and its own measured pins |
| Coalition overhaul | "serious" | **4 of 20 slices** on the coalition proper, plus S21n giving an engine government the three maintenance instruments the player has |

## If the programme has to shrink

Cut S21j first: the widest reach into the vote model and the least coalition
content; the `ground` aim survives one more slice unmet. Cut S21k second.

**Do not cut S21b, S21d or S21g.** Without the date the agreement is a wish
list; without the motion the government still cannot fall; and without the
memory no engine ever wants it to.

## Verification bar, per slice

Unchanged from S20 and non-negotiable:

- `node checks/run.js` — 11 static checks, must pass.
- `node tools/roads.js` — currently 200 assertions in about 17 minutes. Every
  slice adds its own arm. A named casualty is re-derived in the slice that
  breaks it, never worked around.
- `tools/playtest.js`, `tools/determinism.js`, `tools/contrast.js` at three
  tiers.
- **Poison every assertion, and take the poison list from the DIFF rather than
  from the assertion's own words.** A change with nothing to poison is a change
  with no assertion; a poison that cannot redden is a knob nothing can turn, and
  it comes out rather than shipping.
