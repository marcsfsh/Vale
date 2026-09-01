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

This programme delivers **12 improvements and 14 new behaviours** across twelve
slices, one PR each. Four of the twelve slices are the coalition.

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

### S21a — The regard, signed  ·  1 improvement, 1 new

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

### S21b — What a party holds against a government  ·  2 improvements, 1 new

`v21Answer(st, kind, actor, target, w)` and `V21_POLITICS`, covered both ways,
gated on `v19Thinks`, returning early under `V19_SIMULATING`. Six writers: a
statute carried away from a party's `wants`, a bill of theirs voted down, an
office lost, a demand refused, a freeze-out at `v17Install`, and the ballot.
`expireInbox` stamps `provokedAt` at `st.turn + 1` so the reaction layer can
see its own largest input — today it runs at 13481 and the writer feeding 63%
of it fires at 13488. `oust`'s three predicates start asking one question about
the government, and `done` stamps `g.gov` at adoption.

Widest coupling in the programme, which is why it is second.

### S21c — The rehearsal can see what a card did  ·  3 improvements

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

### S21d — The agreement bites  ·  Coalition 1 of 4  ·  3 improvements, 1 new

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

## Deliverables against the brief

| | required | delivered |
|---|---|---|
| Improvements to existing AI behaviour | at least 4 | **12** |
| New behaviours | at least 8 | **14** |
| Equal attention | every item significant | one slice per PR, each with its own assertion, its own poison list and its own measured pins |
| Coalition overhaul | "serious" | **4 of 12 slices**, covering formation, the agreement, the exits and the fall of a government, plus a junior-partner game |

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
