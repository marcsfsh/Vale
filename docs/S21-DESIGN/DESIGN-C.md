# DESIGN C — An opponent you cannot perceive is not an opponent

## The position

The owner scored this AI 1 of 10. The baseline says the engine acts 1,025 times
in 720 sessions and wastes no session. Both are true, because **the score is not
a measurement of how much the engine does. It is a measurement of how much of it
arrives.**

Six opponents produce 1,128 sentences across six campaigns, of which **190 are
distinct** and **58 (5.1%) name the player at all** (`experience.md`). One
sentence — *"The TVC spent the season courting religious communities"* — appears
80 times. A quarter of everything the engine does is the `court` card
(280 of 1,025, 27.3%), which moves a national number in a direction that
**lowers the playing party's own projected share** on 111 of 140 measured plays.
143 opposition bills were archived in 300 sessions and **zero passed**. The
assent stage refuses **88.2%** of engine legislation on a number about the
player. No engine has ever tabled a confidence motion, because
`v17ConfidenceVote` has exactly one caller and it is the player's own button.
`oust` — the only aim that points at a government — was held **0 times in 720
sessions**. And at the level most players never change, the Parties page prints
*"with the LP in the way"* while `v19Score` for `attack` measures **0.71 with the
foe and 0.71 without it**.

So the diagnosis is two-part and the two parts are one problem:

1. **A perception failure.** The engine computes an aim, a progress figure, a
   rival, a temperament, a posture and a reason an aim ended, and almost none of
   it leaves one table on one page. `a.why` is a single slot overwritten every
   act with one reader. `a.lastGoal` has one reader for six sessions.
   `a.provokedAt` wrote 62 AI-keyed stamps and read **zero** of them. The
   posture printed on the page is **wrong 30.5% of the time and a median of ten
   sessions old**.
2. **A consequence failure.** Nothing the engine does can take anything off the
   player. Not the government, not a division, not an office, not a bloc. A
   party that hates you and a party that has never met you behave identically,
   and 42% of party-sessions sit at grudge exactly 0 because kindness cannot be
   stored.

The design goal follows: **the player must be able to form a theory of what each
opponent is doing, act on that theory, and be proved right or wrong.** A theory
needs three things the game does not have — a **declaration** (the opponent says
what it intends before it acts), a **consequence** (the act costs something the
player can name), and a **reckoning** (the game says whether the opponent got it).
Every item below supplies at least one of the three, and no item is a caption
over machinery that would still be silent.

---

## Positions I am taking against the obvious alternatives

**I will not raise `V16_AI_CADENCE`.** `experience.md` calls it "the single
highest-leverage number in the AI" and it is the wrong lever. It is the owner's
dial (MAP, S18e), its own history records six parties acting every session
taking the harness from 5.5 elections won to 1.2, and `ai.budgetHeld` holds
`Σ v18TempoOdds === live / V16_AI_CADENCE` **to 1e-6**. More importantly, 1.42
initiatives a session is not the complaint: a game where 5% of what the
opposition says names you does not become a good game at 3 initiatives a
session, it becomes the same game twice as fast. I fix what an act *lands as*.
The one tempo change I do make (I6) is a defect, not a dial.

**I will not add four deck cards.** A twelfth card is a five-place change in
`vale.html` (`V16_AI_DECK`, `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS`, `V16_AI_COST`,
a posture list, every relevant goal's `worth`) and a five-place change in
`roads.js` (`six.deck === 11`, `six.cardWorks === 11`, and the hard-coded
`moved` chain at 4235–4252 that falls through to `false`). I add **one** card
(`coalition`, C4), because a coalition verb cannot live on an existing card's
body. Everything else that looks like a new card is a new **verb** inside a card
that already dispatches on one: `floor` already takes `support`/`oppose`/
`pressure` through `v17AiFloorFor` → `v17FloorCore`, and `press` (N4) belongs
there.

**I will not build a search.** `choosing.md` is right that the engine is a
one-step greedy weighted lookup, and wrong that the answer is depth. Two-ply
minimax buys the player nothing they can see. Settling the clone **one tick**
(I3) buys something they can see immediately — seven of eleven cards stop being
priced at exactly minus their own cost, and the opposition starts legislating.

**I will not hide the aims.** `goals.md` floats scouting. My whole thesis is
that this game is under-legible, not over-legible. The aim column stays and
gains a **confidence** sourced from what the party has actually shown (N5).

---

## Three shared channels, declared once

Everything below writes into one of three places. Each is named here with its
readers so that no item smuggles in a `st.court.size`.

### `st.ai[pid].file` — the record ring (N5)
One bounded array per party of `{turn, verb, target, aim, weight, note}`,
written by exactly one function, `v21Emit`. It **replaces** `a.why` (one slot,
one reader) and **subsumes** the eleven ad-hoc `logIt`/`addNews`/`v16Resent`
sites. Readers: the dossier page, the aim confidence, `v21Stand`'s decay rate, the
reckoning (N8), and `roads.js`'s coverage guard. `v21Emit` returns early when
`V19_SIMULATING` is up — which makes the flag's own comment true for the first
time (`choosing.md`: three occurrences, zero readers in the game).

### `st.stand[a][b]` — the signed party-to-party standing (N3, C5)
`v16Resent`'s clamp floors at 0, so twelve authored *negative* `V17_MEMORY`
weights can only spend an existing grudge down, and 94% of AI-to-AI pairs are
empty. `st.stand` is one signed number per ordered pair, seeded from `dist2`,
written by the widened `v21Resent` (every current `v16Resent` site), by the
coalition ledger, and by the drift. Readers: `v17Accept`'s **value and
reservation**, `partyBillSupport` (replacing the player-centric scalar at 9032),
`assentFavour` (I4), `v17Invest`, `v16PactPartner`, `v19Rivalry`, the dossier.
`v16Grudge` becomes `Math.max(0, -v21Stand(...))` so every existing consumer
keeps working unchanged.

### `st.blocLean[bloc][pid]` — a party's own standing with a bloc (I1)
Written by `court.run`, decayed, floored. Readers: `supportTargets`'s `appeal`
term (one line, at `v += weight * a * appeal`), `ground.target`/`progress`/
`done`, and the bloc card.

**Backfill.** All three are created by `enrichState`'s existing pattern — absent
means empty, never assumed. `st.stand` is seeded from `dist2` plus the existing
`grudge` map so an old save carries its history forward rather than forgetting
it; the migration is pure arithmetic and spends no dice, like the four-rung
migration at 8600.

---

# PART ONE — SIX IMPROVEMENTS

---

## I1 — `court` gets a channel the party owns, and the ballot stops disagreeing with the model

**IMPROVEMENT.**

**The defect.** `court` is 27.3% of everything the engine does (280 of 1,025)
and costs 36 of a purse averaging 57.6. It writes `st.blocs[b] += 2.6` — a
*shared national* number. `supportTargets` reads that number twice with opposite
signs: `weight` rises for everyone (11496), but `appeal` is `.915 + (m−50)/80`
for the ruling party, `.86 + (m−50)/108` for a partner, and **`.784 − (m−50)/130`
for everyone else** (11509–11511), then multiplied by an extremism term that
also falls as mood rises. Measured through the game's own path: **140 plays, 111
down, 29 up; mean −0.70% of the playing party's projected share, −1.08% in
opposition, +0.73% in government** (`deck.md`). A second measurement over 144
samples agrees: the courting party fell in 84, the *ruling* party rose in 133
(`society-foreign.md`). Meanwhile `v19Outcome` scores `court` at **+0.307** —
the largest positive in the deck, five times anything else — because
`v17Utility` reads the same number as a private good. Two models of one number
pointing opposite ways, and the sharper AI rungs steer harder into the wrong one.

**The mechanism.** `court.run` writes `st.blocLean[bloc][pid] += .05` (a real
number the party owns) instead of, or as well as, the national push.
`supportTargets` multiplies `appeal *= 1 + (st.blocLean[b.id] || {})[p.id]`, one
line at the point where the calculation is already party-specific.
`v21BlocLeanTick` decays it ×.94 a session with a floor of 0 — slower than the
30% national reversion at 11271, so a party that works a bloc for ten sessions
holds something. `ground.target`/`progress`/`done` re-point at the lean, which
fixes the aim as a side effect: today `want = min(92, have + 14)` against a
steady-state ceiling of **+3.0 at the measured play rate and +8.7 at one play
every single session**, so the third-most-adopted aim is arithmetically
unreachable and 11 of 11 completions were carried by the weather (`goals.md`
Q1c: the aims that succeeded played the card **2.18 times**, the ones that
failed played it **4.94**). And `v19Standing` reads `supportTargets(st)[pid]`
in place of `v17Share × 60`, so the rehearsal and the ballot agree about what
courting is worth.

**What the player sees.** The bloc cards on the Country page grow a line naming
which parties hold standing with that bloc and how much — so when the player's
own share among the faithful slips they can see **who took it and when they
started**. The Parties dossier (N5) carries "has worked the devout for eleven
sessions" with the number. The log line stops being generic: *"The TVC spent the
season courting religious communities — they now stand +18 with them, against
your +4."*

**How it is measured.** A `roads.js` arm reads `supportTargets(st)[pid]`
immediately before and after a real `court.run` on live boards, 14 seeds,
opposition and government plays counted separately, and asserts the mean is
**positive for an opposition player** — the direction, pinned against the
measured −1.08 it replaces, with both figures in the assertion's own words. A
second arm drives `ground` aims to retirement and asserts the completion rate
rises and that completions correlate with *court plays* rather than with
`blocTarget` movement — today the correlation is backwards. Poison: delete the
`blocLean` read in `appeal` and the first arm reddens; delete the `ground`
re-point and the second does.

**What it costs.** Medium-large; it touches the vote model, which is the
riskiest surface in this proposal. `party money reaches the ballot` (3283),
`the campaign and the organisations are worth seats` (3560) and
`the caucuses reach the vote` (3566) all read `supportTargets` and must be
re-run. No new `rand()`. Nothing re-phases: `blocLean` is written inside a card
that already ran.

---

## I2 — `oust` becomes adoptable, and its three predicates ask one question

**IMPROVEMENT.**

**The defect.** Three functions on one card disagree about what the goal is for.
`fits` (34764) maximises the grudge over **all** parties and returns 1.4 at ≥25.
`target` (34774) picks the argmax over **all** parties without asking whether
that party is in government. `done` (34783) is true whenever the target is out
of government, and `v19AdoptGoal` (34955) **drops any goal already done at
adoption**. So `oust` is adoptable only in the narrow case where the single
most-hated party happens to be sitting in the government this session. Measured
over 3,618 non-ruling party-sessions: `fits > 0` on **880**; argmax in
government on **72 (8.2% of those)**; **808 dropped as already-done**. Net
adoptable on **2.0%** of boards, and held **0 times in 720 sessions** at the top
level. The disagreement silently deletes 614 of 825 opportunities.

**The mechanism.** Three edits and one dependency.
`target` filters to `[st.ruling].concat(st.coalition)` and takes the worst
standing among them. `fits` asks the *same* question `target` answers, so a
party with 90 against a rival and 5 against the government no longer passes
`fits` and then dies at `dead`. `done` stamps the government at adoption
(`g.gov = st.ruling`, `g.since = st.turn`) and reads *"the target left the
government after I adopted this"* — the aim survives its target's departure for
`V21_OUST_GRACE` sessions rather than completing the instant they fall.
The dependency is N2: filtering `target` to the government is pointless while
**394 of 3,729 nonzero ledger entries (10.6%)** point at a government that is
2–3 of 7 parties, because `attack.can` refuses the government and the only
government-facing writers are a coalition breach and a walkout (3 in 720
sessions). `oust` needs a ledger that can point at governments, and N2 builds it.

**What the player sees.** The Parties column reads *"Bringing down the LP"* with
a progress figure that reads something real (the ledger and the arithmetic, not
`1 − v17Share × 2.5`), and — because N1 gives the aim an instrument — the player
gets a **notice of motion** from the party that has been saying this for eleven
sessions. That is the whole thesis in one mechanism: a theory the player can
form, and then be proved right about.

**How it is measured.** An arm asserts the logical identity `fits > 0 ⟹ target
returns a party in government` over every adoption moment across 14 seeds × 100
sessions (poison either predicate, it reddens), and `done === false` on the
session of every adoption (the disqualification bug stated as an invariant).
Then a driven rate: `oust` adoptions per 1,000 party-sessions, pinned at the
figure the slice measures, against the baseline's **0 in 4,320**.

**What it costs.** Small in code, large in consequence, and it is the item most
likely to redden something else. `reach.neverAdopted.length === 0`
(`a party can reach what it is after`) currently passes *without* `oust` being
common; raising its share dilutes `steer.carryOpen >= 40`, which the probe's own
comment says came in at **39** on six seeds. That arm needs its seed count
raised before this ships, and I would raise it as part of the slice rather than
discovering it. No new `rand()`: `target` iterates a set it already iterated.

---

## I3 — The rehearsal settles before it reads

**IMPROVEMENT.**

**The defect.** `v19Outcome` clones, runs the card, and subtracts two
`v19Standing` readings — a photograph taken one instant after the card is
played. Measured over 1,028 rehearsals: for **seven of eleven cards — 566 rows,
100% of each card's own rows — the only moving component is the purse
deduction.** The simulator prices laying a bill, laying an article, signing a
pact, rewriting a platform, writing to the government and leaning on the floor
at **exactly minus their own price tag**. Three of `v19Standing`'s five
components (`v17Share × 60`, the +18 for ruling, the +9 per office) moved on
**0 of 1,028** — three tuned weights inside a difference where they always
cancel. And the squash is `clamp(d/12, −1, 1)` against a measured `d` span of
**−0.964 … +2.583**, so the clamp is five times further out than the game
reaches and the one term that reads the board is divided into the smallest term
in the sum. Net advice at `ruthless`: **court a bloc, never lay anything.**

**The mechanism.** `v19Outcome` calls `v21Settle(clone)` between the card and
the second reading — a narrow settle that advances bills one stage through
`advanceBills`, applies the bloc reversion, and ticks the amendment clock. Not
the whole `tickTurn`: the full tick would run `v16AiTurn` on the clone and
recurse into `v19Try`, and the guard against that recursion is exactly the flag
whose comment already claims a reader the game does not have. **`v21Settle`
returns immediately when `V19_SIMULATING` is up**, which makes the claim at
35208 true rather than aspirational. `v19Standing` reads `supportTargets(st)[pid]`
(projected share, which a settled clone can actually move) plus the party's
bills in flight valued by `billForecast(...).lower` against `v19Bar`, and the
three dead components go. Divisor from the measured spread (≈2.6), with the
measurement written into the comment so the next reader cannot re-pick it by eye.

**What the player sees.** Nothing directly — and I say so rather than dressing
it up. Its visible face is that **engine bills start reaching divisions**. The
`carry` aim (53 of 199 adoptions, the most-adopted) currently has a progress
number that is binary and stays at 0 for nineteen sessions on 44 of 48
retirements; 143 opposition bills reached archive and none passed. When the
rehearsal can see a bill it will lay more of them, and N4 gives it something to
do about them, and the player has to vote.

**How it is measured.** The existing gate is `think.sim.distinct >= 7 of 11` and
`orderSpread >= 6`. Raise to **≥10 of 11 distinct**, and add a per-card arm that
asserts each of the seven purse-only cards moves a **non-purse** component of
`v19Standing`. Assert `V19_SIMULATING` is read: run a card whose settle would
recurse and assert the recursion does not happen — poison by deleting the flag
check and the arm hangs or blows the depth, which is a red the harness can
survive because the arm guards its own lookup.

**What it costs.** Medium code, real compute. The file's own comment puts a
rehearsal at 0.97ms; `advanceBills` on a clone is heavier, and a party weighs
about five cards. **This is the one item in the proposal with a wall-clock risk
to the 16m40s harness**, and if the settle measures too expensive the fallback
is to settle *only the bills* and leave the bloc reversion out. The clone's
rolls go to the clone's stream — `rand()` reads `RNG_ON || S` and `v19Try`
assigns `S = clone`, measured non-leaking on 504 of 504 real calls — so the
campaign's dice are untouched. `think.sim.*`, `steer.shrewd.sim` and
`floor.sharp` all move and must be re-pinned.

---

## I4 — Assent is judged by the sponsor and the holder, not by the player

**IMPROVEMENT.**

**The defect.** `assentFavour` (9440) decides whether the office signs.
`line = st.partyRel[who]` is the holding party's relation **to the player**,
weighted by the holder's `loyalty`. Nothing in it asks about the sponsor.
Measured: **768 assent decisions across 720 sessions, every one an engine
sponsor into an engine-held office, 677 refused (88.2%), 41 returned, 50
signed** — and the player was never on either side of a transaction their own
number decided. This is the `faction:0` family: a borrowed field reaching into
whatever the original pointed at. It is also exploitable and invisible: a few
`shiftPartyRel` calls and an engine's entire legislative programme starts
passing or stops.

**The mechanism.** `assentFavour` reads `v21Stand(st, holder, sponsor)` — the
signed party-to-party standing — keeping the holder's `loyalty` as the weight,
which is the good part and the only place a *person* enters the legislature at
all. The player's `partyRel` is read only when the player is the sponsor. The
coalition bump at 9445 becomes "the sponsor is in this holder's government"
rather than "the holder is in the government".

**What the player sees.** The assent card names **who** is refusing and **why**:
*"The Chancellor is an RSF appointment and the RSF have not forgiven the SD for
the boundary bill."* The Gazette prints a refusal as a political act rather than
a procedural one, and the refusal appears in both parties' dossiers (N5). For
the player in opposition — a whole mode of play since S16f — it means the office
that signs their bills is a relationship they can now see, work on, and lose.

**How it is measured.** An arm plants a grudge from the **holder** against the
**sponsor** and asserts the decision moves; plants the same magnitude on the
**player's** `partyRel` with the holder and asserts it does **not**, when the
player is neither party. That second half is the arm standing in the gap the
narrowing closes — without it the assertion passes under both the old line and
the new one, which is S17k's recorded mistake. Then a driven rate: engine-into-
engine refusals across 14 seeds, pinned against the measured 88.2%.

**What it costs.** Small code. Depends on N3/C5 for `v21Stand`. Risk to
`the fourth pip lights` (2820) and `a refusal is beatable, and not for free`
(2853), both of which drive assent. No new `rand()`.

---

## I5 — The default level performs the reasoning the page prints

**IMPROVEMENT.**

**The defect.** `V19_DEFAULT_LEVEL` is `purposeful` (441), whose row carries
`read: 0`. `v19Score` gates the whole rivalry term on `read > 0` (35315), and
the attack picker scales its push by `read` (34392). But `v16AiTurn` calls
`v19Rival` **unconditionally** (35478), stamps `a.why.foe` (35524), and
`v16AiPanel` prints *"with the X in the way"* (36190) **with no level gate** —
while the temperament sentence on the same row *is* gated. Measured at
`purposeful`: 39 of 135 recorded actions name a rival, 11 of them the player,
with `read = 0`, and `v19Score` for `attack` is **0.71 with the foe and 0.71
without**. S19f's whole reaction layer is dead at this level for the same
reason: `answering` sets `rival = {foe:me}` and that value is consumed only
through the term `read` switches off. Beside it, `a.posture` is written **only
inside the tempo gate**, so it is **wrong on 439 of 1,440 party-sessions
(30.5%)**, a median of **ten sessions** old, and **never written at all** for
149 of them — while the adjacent "Odds of moving" column reads live.

**The mechanism.** The cheap fix is to gate the caption, and it is the wrong
one: it makes the game emptier at the level almost everyone plays. I buy the
read instead — `purposeful` gets a small non-zero `read`, its value measured
rather than picked, so the sentence becomes true and S19f's reaction layer
starts working at the default. And `v16AiPanel` calls `v16Posture(S, p.id)`
directly, the way the odds column already does; `a.posture` then has no reader
and goes.

**What the player sees.** At the level they are actually playing, an opponent
that answers who is in its way — and a "This session" column that is this
session's. Today a player reading the Parties page is reading a mood from ten
sessions ago attributed to a reasoning that did not happen.

**How it is measured.** Assert `v19LevelOf(st).read > 0` at
`V19_DEFAULT_LEVEL` **and** that the rivalry term changes the ranking at that
level — which requires **changing an existing assertion**: S19b's
`rank.purposeful.gain === 0` is an exact zero this deliberately breaks. I argue
it explicitly rather than quietly re-tuning: R1's floor is `instinct`
(`sharp: 0`), not `purposeful`, and `instinct` stays byte-identical. Second arm:
over a driven run, the posture printed on every row equals `v16Posture(S, pid)`
on every session — **0 mismatches against the measured 439 of 1,440**.

**What it costs.** Small. One assertion changed and argued. `read` at
`purposeful` shifts the card mix at the default level, so `pacing.js` must be
re-run at **six seeds and the mean quoted**, not one. No new `rand()`.

---

## I6 — Hostility raises the board's temperature instead of redistributing it

**IMPROVEMENT.**

**The defect.** `v18TempoOdds` returns `v18Tempo(pid) * budget / Σ`, so a
multiplier applied to everybody **cancels**. Driven on seed 4242 at turn 6
(`posture-tempo.md`):

```
base       rsf .2708  sd .2083  fp .2708  cup .2083  tvc .2708  pnl .2708
one angry  rsf .3726  sd .1911  fp .2484  cup .1911  tvc .2484  pnl .2484
all angry  rsf .2708  sd .2083  fp .2708  cup .2083  tvc .2708  pnl .2708
```

A player who makes six enemies gets no more pressure than one who makes none,
and provoking **one** party measurably **quietens the other five**. The strictly
dominant play is to concentrate hostility on a single party — the opposite of
what a game about a hostile chamber wants. This is precisely the defect
`V18_TEMPO`'s own comment identifies and deletes a ballot term for; the rule was
applied to the deleted term and not to the shipped ones. Two smaller faults sit
beside it: `V18_TEMPO.broke` is keyed to `V16_AI_COST.demand` (16) and comments
itself "under the cheapest card in the deck" while the cheapest card is `floor`
at **12**; and the grudge term is a binary at 35, so a grudge of 35 and a grudge
of 100 weigh the same.

**The mechanism.** `budget = live.length / V16_AI_CADENCE * f(mean weight)` with
`f` bounded (0.9 … 1.4) — the owner's dial still sets the resting rate, and a
republic in crisis is busier. The two terms the player actually drives become
continuous: `1 + k·min(1, grudge/100)` and `1 + k·min(1, (purse−120)/200)`. The
`broke` bar derives from `Math.min` over the deck's real costs — one accessor,
`v16CardCost(id)`, which also closes the hole in `v19Score`'s purse penalty
(`V16_AI_COST` holds 8 of 11; `article`, `order` and `floor` are scored as free
and never take the −0.22 "money it cannot spare" term).

**What the player sees.** A board that gets busier when they make it angry. The
Parties panel's "Odds of moving" column is already live and already correct; it
simply starts moving for a reason the player caused, and the panel note says so
in place of the current sentence about a fixed shared budget.

**How it is measured.** The existing `ai.budgetHeld` asserts
`Σ = live / V16_AI_CADENCE` to **1e-6** and must be **rewritten**, not deleted:
the new identity is `Σ = live / V16_AI_CADENCE * f(w̄)` to 1e-6, plus
`f ∈ [0.9, 1.4]` at the extremes, plus the new arm that says what the old one
could not — **provoke all six and the total rises; provoke one and the other
five do not fall**. Poison: revert `f` to 1 and the second arm reddens while the
first stays green, which is the point.

**What it costs.** Small code, and a changed assertion argued in the PR.
`ai.totalHeld` (mean within 10% of `60 × budget`) and `ai.spreadOpen` (max−min
≥ 4 on every seed) both move. `V16_AI_COST` becoming a covered surface is a
`roads.js` addition, not a change. No new `rand()`: the weights are already
computed for every party every session.

---

# PART TWO — EIGHT NEW BEHAVIOURS

---

## N1 — The motion of no confidence, tabled by an opponent, announced before it is put

**NEW.** *The single most important item in this proposal.*

**The absence.** There is no code path from the AI to a confidence motion, a
dissolution, or a re-founding. `v17ConfidenceVote` (37740) and `v17Refound`
(37797) each have **exactly one caller** and it is the player's own action card
at 12711/12719. `callElection` refuses anyone but `leads(S)`. `confidence_threat`
does not put a question to the house — its three answers move trust, set
`st.confidence`, or splice the partner out of an array. Measured: **1
confidence_threat paper in 720 sessions**, 0 caretakers in 360 formations. As
head of a majority coalition the player is **structurally unremovable for the
whole campaign**, and the game never once asks them to defend the office they
spent the campaign winning.

**The mechanism.** A party holding `oust` (I2), with arithmetic that clears a
bar, posts a **`notice_of_motion`** paper naming the session the question will
be put and printing **the tally it currently counts** — ayes, noes, and the
parties it believes will abstain. That is the declaration. The player then has
one session and a real decision: buy a defector (the party board already has the
verbs), concede the statute the mover's `carry` aim named, call the ballot
first, or take the vote. On the named session the motion is **put** through the
existing `v17ConfidenceVote`, and if it carries, through the existing
`v17Refound` — a government brought down does not go to the country, the same
Assembly is asked whether it can produce another one, which is already written
and has never run. A motion that fails costs the mover: `st.machine` for the
government (as the player's own path already does), standing for the mover with
every party that voted no, and a `V21_MOTION_REST` cooldown so it is a rare big
move rather than a metronome.

**What the player sees.** A paper on the desk that says *"The PNL will move that
this House has no confidence in the government, on the session after next. On
today's numbers: 612 for the motion, 653 against, 40 abstaining."* Then, if they
do nothing, the division — with the defectors named. This is a threat announced
before it is carried out, an opposition that forces a response, and a rare move
that is real.

**How it is measured.** Driven arm **with the `runQueue` override** (this is
downstream of the queue and without it the probe measures a republic that never
holds an election — the mistake `docs/S21-BASELINE.md` line 8 records). Assert:
motions tabled per 1,000 sessions, pinned at the measured figure; **every motion
put was preceded by a notice** (an exact identity, poison the notice and it
reddens); at least one motion **carries** and produces a `v17Refound` across the
sweep; a motion that carries leaves a government different from the one before it
on at least one seed. And the negative: a player who answers the notice by
conceding is not brought down at a rate distinguishable from noise, measured.

**What it costs.** Medium. It reuses two written functions and one paper shape;
the new code is the trigger, the notice, the deadline and the cooldown. `the
house removes a government` (5781) already covers the vote on a hand-seated
board and stays green. **The bar has to be measured, not picked** — the number
of seats an `oust`-holder needs before it will move is exactly the S17q defect
if chosen by eye, so it comes from the driven distribution of opposition
arithmetic. Two clocks for one fact: the notice's date and the paper's expiry
must be the **same** date with one owner, or `expireInbox` clears the notice
before the motion fires — the S17-era street-demand defect, verbatim.

---

## N2 — A party resents you for governing

**NEW.**

**The absence.** The complete list of `v16Resent` callers is: answering or
ignoring a `party_demand`, a coalition quit, another party's `attack`, a
coalition breach, a walkout, the player's `V17_MEMORY` verbs, and floor pressure
on a sponsor. **Nothing calls it for a statute carried, a division lost, a seat
lost, an office taken, or a government formed without them.** A player can spend
130 sessions passing the exact statutes the PNL exists to prevent and it will
never hold one of them against them. Measured: **81 of 128** traced grudge
writes (63%) come from a single source — an **ignored letter** — so the engine's
model of the human is dominated by inbox neglect, and a player who clears the
inbox every session is invisible no matter what else they do. Meanwhile only
**394 of 3,729 nonzero ledger entries (10.6%)** point at a party in government,
because `attack.can` refuses the government outright: attacks flow *toward* the
government and memory flows *away* from it.

**The mechanism.** Four new `v21Resent` sites, each reading a table the game
already has:
- **A statute carried that moves away from a party's `wants`** — the table is
  already read by `partyDemandPolicy` (9927), `pv5TopWants` and `v19BillFor`.
  Weight scaled by the size of the move and the party's own gap.
- **A division lost** where the party had declared a line — `b.lines[pid]` is
  already written and already read.
- **An office taken that the party's `office` aim named** — `execContest` calls
  `execRemember` on the *winner's* runners-up only; the losing party currently
  gets no grudge, no posture, no goal, no line of its own.
- **A demand refused by an engine government**, not only by the player — the
  `demand` card posts to the player's inbox unconditionally (34581), so a player
  in opposition receives letters addressed to "the government".

And the weights are re-balanced against the measurement: an **ignored letter**
must be worth well below a deliberate verb, because today it is 14 against a
median deliberate provocation of 13.4 — *the same*. Plus the ordering fix that
`memory-rivalry.md` isolated: `expireInbox` runs **after** `v19React` in
`endTurn`, so the largest single writer of hostility is the one the reaction
layer can never see; it stamps `st.turn + 1` or `v19React` moves after
`politicsTick`. One owner of the session number, asserted.

**What the player sees.** The dossier (N5) says *what* moved a party against
them, by name and session: *"Carried the Wealth Tax to rung 3 — against their
manifesto (session 41). Took the Chancellery they were running for (session 47).
Refused their demand on schools (session 52)."* Three words with no number
becomes a file with causes. And the consequences arrive: `v16Posture`'s attack
bar (35) sits above the measured p90 of 32, so a government-facing ledger is
what makes `attack` and `restive` reachable at all.

**How it is measured.** A coverage arm: every *political* event class that ought
to write memory is enumerated as a table, and `roads.js` fails when an entry has
no writer — the `V17_MEMORY` guard shape, because a hand-kept list of call sites
is exactly what this file punishes. Then a driven arm: the share of nonzero
ledger entries pointing at a party **in government**, pinned against the measured
**10.6%**, and the share of all grudge writes coming from `expireInbox`, pinned
against the measured **63%** and required to fall.

**What it costs.** Medium. **The blast radius is the largest of any item here.**
`bar.bar < bar.medianRise`, `bar.maxFall < bar.bar`, `bar.clearShare > .85`
(S19f) and `scale.worth` between the p90 and p99 of the grudge distribution
(S19b) are all **re-measured distributions of the grudge** — every one of them
moves when the grudge magnitudes move, without the mechanism they name changing
at all. Those four gates must be re-swept in the same slice, at 14 seeds, and
the new figures written into the assertions' own words.

---

## N3 — Gratitude: a party can be owed, and remember it

**NEW.**

**The absence.** `V17_MEMORY` carries twelve **negative** entries —
`joinCoalition: −20`, `fund: −14`, `tradeMinistry: −14` — and a comment claiming
"it works the other way". `v16Resent` clamps at **0**, so a kindness can only
spend an existing grudge down. Measured: on a party at grudge 0, `fund` then
`joinCoalition` leave the grudge at **0** and `v19Rivalry` at **0** before and
after. **42% of party-sessions sit at grudge 0 against the player** (1,832 of
4,320) and **94% of AI-to-AI pairs do** (20,337 of 21,600). For all of those,
every helpful thing the player can do is worth exactly nothing to the model —
including to the party they are trying to build an alliance with. Nothing in the
game can ever be *owed* to the player. Greps for `gratitude`, `favour`, `owed`,
`ally`, `trust`, `goodwill`, `forgive` over 3.7 MB return **prose only**.

**The mechanism.** `st.stand[a][b]` is signed with a floor of −100 and a ceiling
of +100. `v16Grudge` becomes `Math.max(0, −v21Stand(...))`, so every one of the
twelve existing consumers keeps working byte-identically at the floor and the
positive half is new headroom. Writers: every current `v16Resent` site (with its
sign), the coalition ledger's **kept** entries — which today book `V17_KEPT`, +7
satisfaction and +4 `partyRel` and **no memory at all**, while a breach four
lines later writes a grudge — a full term served together, a bill carried at a
party's preferred rung, a floor declaration **for** another party's bill (today
the only floor verb with a memory is the hostile one). Readers: `v17Accept`'s
value **and** reservation, `partyBillSupport`, `assentFavour` (I4), `v17Invest`,
`v16PactPartner`, `v19Rivalry`.

**What the player sees.** The dossier's "Toward you" cell stops being three
words and becomes a signed number with the last three things that moved it. A
party that owes the player says so — *"They have not forgotten the ministry"* —
and the consequence is visible where it matters: at a formation, in a division,
and at the assent desk.

**How it is measured.** The existing `a party remembers what was done to it`
(6697) asserts `fires.afterKindness === 0` — a kindness against a party at 0
producing nothing — and that gate is **the defect stated as an assertion**. It
must be inverted and argued: a kindness against a party at 0 now produces a
positive standing, and the arm asserts the *positive* side reaches at least
three of its named readers, each poisoned separately. Add the two guards
`memory-rivalry.md` names as missing: a **reverse** coverage arm (a weight
naming a verb that does not exist — the `radicalise` defect) and a **sign** arm
(a verb whose `run` raises the target's seats, machine, press or purse and whose
weight is positive should redden — which catches `defect: {self:18}` today,
where a player action hands a party 46 seats and the beneficiary resents them
for it).

**What it costs.** Medium code, wide reach. The migration is the interesting
part: an old save's `grudge` map becomes the negative half of `st.stand`,
arithmetic only, no dice, in `enrichState`. Risk: `grudge0 === 0 &&
grudge1 === 40` and `postureUnderGrudge === 'attack'` (4309) are literal pins on
the grudge accessor and must be checked against the new one. No new `rand()`.

---

## N4 — A party can work for its own bill, and wreck yours

**NEW.**

**The absence.** `v20PressCore` (38277) was written as a Core taking an `actor`
— the exact S17k shape — and its **only caller** hard-codes `playParty(S)`.
`bill.pull[pid]`, the field S20b added so persuasion would count through a
party's seats, measured **non-zero in 0 of 22,932 divisions**. `v17FloorWhy`
refuses a sponsor its own bill outright (38197) and `v17AiFloorFor` filters
through the same predicate, so **an engine lays a bill and then has literally no
move available on it for the rest of its life**. Measured outcome: **143
opposition bills archived in 300 sessions, 0 passed**; government bills 29 of 97.
An engine's entire chamber vocabulary is worth **−1.9 aye points** for an
`oppose` and **+2.1** for a `support`, against noise of ±6.5, once every four
sessions — about **one twelfth of the player's leverage** over the same chamber.
And `pressure`, the third verb, is **unreachable at every thinking level**: it
needs `care ≥ 0.9` against a measured support distribution with a median of
43–49. 0 pressure moves in 140.

**The mechanism.** `press` becomes a fourth verb inside the `floor` card, chosen
by `v19Pivot`, calling `v20PressCore(st, pid, bill, scope)` — **no new deck
card**, no new state, no new gate. `v17FloorWhy` opens the sponsor's own bill to
the sponsor for `press` and a purse-priced whip equivalent, so laying a bill is
the start of a campaign rather than the end of one. `v19Pivot` is fixed while it
is open: it compares `f.lower` against the bar at every stage, when the number
the stage is decided on is `f.committee` at committee and `f.upper` at senate —
`billStageValue(f, bill.stage)` exists at 9633 and does exactly this correctly.

**The trap, named.** `v20PressCore` calls `shiftPartyRel(st, pid, dir·k.rel)`
for every non-own target — and `st.partyRel` is the **player's** vector. Opening
it to an engine actor without changing that line reproduces the `attack`/`pact`
bug exactly: two engines arguing over a bill would move the player's relations
with parties they never spoke to. It goes to `v21Stand(actor, target)` when
neither is the player. This is CLAUDE.md's "a shared body right for the new
caller can still be wrong for the old one", and it is why this item names the
old caller's field explicitly.

**What the player sees.** A bill card that names who has been leaning on whom,
and a division report that says which party's whipping moved it. A statute the
player wants **fails** because the RSF spent three sessions on it. That is the
first time in this game an opponent takes something off the player inside a
session they were watching.

**How it is measured.** `bill.pull` non-zero in a driven run, pinned against the
measured **0 of 22,932**. Opposition bills passing, pinned against **0 of 143**.
An arm that plants an engine press and reads the aye share through
`billDivision` either side. And the neighbour: `a position can be pressed home`
(11228) has `scopes.others.hasSponsor === false` as a coverage gate that must
hold for the engine actor too.

**What it costs.** Small-medium; the Core exists. Risk: `bill.pull` is read by
`billDivision`, so `the division is counted` (10999) — which stubs
`partyBillSupport` but not `pull` — feels it. `think.floor.sharp.against ===
think.floor.sharp.n` is an **all-or-nothing count over 80 driven sessions** and
a fourth verb changes what `floor` plays are; it must be re-derived. No new
`rand()` beyond what `v19Pivot` already spends.

---

## N5 — The dossier: a file the player reads, built from records the model reads

**NEW.**

**The absence.** Everything the engine knows about itself is written to a slot
with one reader. `a.why` is **one** record overwritten every act, rendered on at
most four rows of one table. `a.lastGoal` has **one** reader and lives six
sessions. `a.provokedAt` wrote **62 AI-keyed stamps and read zero of them**. The
grudge's only readout in 3.7 MB is one cell reading `'They have not forgotten'`
/ `'A grievance on file'` / `'Nothing on file'` — **no number and no cause** —
while roughly one party in nine sits at or past the attack bar against a player
who has done nothing. `st.aiPacts` has **no renderer at all**. The formation
records every offer, price and refusal in `st.formation.rounds` for a rotation
that resolves in round one 98.3% of the time. The player is asked to have a
theory about six opponents from 1.4 log lines a session, 190 distinct sentences,
and a stale mood.

**The mechanism.** `st.ai[pid].file` — a bounded ring of
`{turn, verb, target, aim, weight, note}` — written by **one** function,
`v21Emit(st, pid, rec)`, which every card's `run`, every paper, every breach,
every memory write and every formation answer goes through. `v21Emit` does three
things: appends the record; routes by `weight` to the log (small), the news
(medium) or `addInbox` (large, addressed, with a date — N6); and writes the
memory, so a record and a grudge cannot drift apart. It returns early under
`V19_SIMULATING`. **This replaces `a.why` rather than sitting beside it** — the
panel reads the file's last entry where it read the slot — and it is the writer
`a.provokedAt` should always have had, so `v19React` can loop every key rather
than only the player's (62 stamps, 0 read).

The dossier page is the Parties card, widened: aim and confidence, posture
(live, I5), signed standing with the player and with each other party, the last
six records, the ledger's kept/broken counts, the pacts, and what it is spending
on. The **aim confidence** is derived, not authored: an aim a party has not yet
shown its hand on reads *"unclear"*, and hardens as records toward that aim
accumulate — so the player forms the theory from what the party *did*.

**What the player sees.** The thing this game does not have: a page you can go to
and answer "what is the RSF doing, and why do they hate me". And a small
mechanical bite for the player: `v21Stand`'s decay reads the file, so a party
with a live file forgets more slowly than one that has been quiet — a feud is
maintained by events, not by a flat 0.6 a session that takes 167 sessions to
clear 100.

**How it is measured.** A **coverage guard** `roads.js` can fail on: every deck
card's `run`, driven on a constructed board, must produce exactly one record;
every `V17_MEMORY` verb must produce one; a record whose `verb` is not in the
deck or the verb table reddens. That is the guard a hand-kept list can never
have, and it is why this is a consolidation rather than a parallel mechanism.
Then: records per session (against 1.42 initiatives), share of records naming
the player (against the measured **5.1%**), and the routing —
small/medium/large shares pinned.

**What it costs.** Medium, and it touches eleven existing call sites, which is
the risk: every one is a place a `logIt` or a `v16Resent` currently happens, and
a missed one is a silent hole the coverage arm exists to catch. Save size: the
ring is bounded per party (I would size it at the file's own idiom — 60 for the
log, 30 for the news — and cap at ~12 per party). No new `rand()`.

---

## N6 — An opponent addresses you, repeatedly, with a date and a consequence

**NEW.**

**The absence.** The best "an opponent is dealing with me" moment in the game is
`government_offer` and `opposition_conference` — fully authored, title, body,
three choices, three outcomes — emitted from **exactly two `addInbox` calls,
both inside `seedOpeningInbox`**. They fire in session 1 and **never happen
again**. Meanwhile the coalition's own voice sits behind
`if (st.inbox.length >= 4 || (st.turn + st.inboxSeq) % 2) return;` — the parity
term silences half of all sessions outright, and the inbox term is kept full by
papers that **bypass the gate entirely** (the `demand` card calls `addInbox`
directly). Measured with the player pinned as head of a coalition for 792
sessions: **312 blocked by a full inbox, 215 by parity, only 252 of 792 (32%)
reached the coalition block at all**. Result: **2 coalition demands and 1
confidence threat in 720 sessions**, against 762 `party_demand` and 411
`cross_party`. And the `cross_party` fallback always comes from `others[0]` by
seats — **311 of 449 letters from one party**.

**The mechanism.** Three changes and one new type.
- The addressed channel gets its own slot: the coalition/party branch is
  evaluated **before** the throttle, or the throttle moves after it. A partner
  and a mover are not competing with the governors for a coin toss.
- `government_offer` and `opposition_conference` get real triggers and fire
  again: a party holding `enter` whose arithmetic needs the player; a government
  short of a majority; a party that has just lost the office it aimed at.
- `cross_party` picks its sender by **standing and aim**, not by index 0.
- A new `ultimatum` type — **its own type, not a borrowed one** (S16e's
  `faction:0` defect: a borrowed paper type reaches into whatever the original
  pointed at) — carrying the mover's ask, the date, and the named consequence:
  a motion (N1), a walkout (C4), a bloc withdrawn from the government's bills.

**What the player sees.** Being *addressed*, by name, by an opponent, more than
once per campaign. A letter that says what will happen and when, and then that
thing happening. This is the declaration leg of the thesis and the cheapest one
to build, because the papers are already written.

**How it is measured.** Papers per campaign by type, pinned against the measured
2 / 1 / 449-from-one-party. The throttle: share of sessions in which the
addressed branch is reached, pinned against **32%**. And the identity that makes
an ultimatum honest — **every ultimatum whose date passed unanswered produced
its named consequence**, an exact count, poisoned by disconnecting the
consequence. Plus the two-exits guard: a paper that lapses by inbox overflow
(`addInbox` shifts at >6, stamping `lapsed` and archiving **without**
`expireInbox`, so no memory is booked) must route through the same exit as one
that expires, or a player who lets the inbox fill is invisible.

**What it costs.** Small-medium. `the papers know which chair you sit in` (8463)
and `V18_PAPER_NEED` must gain the new type. `whose desk it lands on` (5256) is
the arm that will feel it. The throttle change re-phases nothing by itself
(`politicsTick`'s `rand()` calls stay in the same order — **and this must be
checked line by line**, because moving a gate in front of a roll is the S18c
defect that moved the whole six-seed pacing arc).

---

## N7 — The engine answers the ballot

**NEW.**

**The absence.** `runElection` (11903–12029) **calls no AI function at all after
the count**. Three continuous terms notice that seats moved and nothing notices
that a *ballot happened*: `v16Posture`'s `moderate`, which reads a delta
refreshed every session and therefore lasts **exactly one session** (113 of 113
`moderate` party-sessions coincided with a same-session seat fall);
`V18_TEMPO.losing`, same window; and `driftParties`, which walks every loser up
to **20%** toward the winner's position and **is never stated in words
anywhere**. There is no resentment at a count, no goal adopted or retired at a
count, no leader change, no post-mortem. **Win a landslide and the opposition
behaves identically.** Every `figures.leaders[x] = makeFigure` site is `newGame`,
a succession, an event the player answers, or a player action: **no party ever
changes its leader after a defeat.**

**The mechanism.** A post-count pass, called from `runElection` after
`driftParties`:
- The biggest loser's standing with the biggest winner falls in proportion to
  what it lost — the ledger's electoral writer, which N2 and I2 both need.
- A party that **lost the government** adopts `oust` against whoever took it,
  bypassing the weighted draw. This is the one place an aim should be handed to
  a party rather than rolled for, because losing power is not a preference.
- A party that gained heavily takes `enter` or `office`, with `office` picking
  from `execPair(v17NextExecTurn(st))` rather than uniformly from four — today
  **147 of 292 live office aims (50.3%) name an office nobody is contesting**.
- A party that has lost two ballots running replaces its leader, through the
  existing succession path.
- `seatsAtLastBallot` beside `lastSeats`, so `moderate` reads a **defeat** (a
  fact about a term) rather than a **session**.
- And `driftParties` is **narrated**: a real, large effect the player has never
  been told about, in the election report and the dossier.

**What the player sees.** An election that changes the opposition. *"The CUP
lost 40 seats and their leader with them. The FP have moved toward the
government's ground. The PNL have decided this government has to go."* Today the
session after a landslide is indistinguishable from the session after a hung
chamber.

**How it is measured.** **This arm requires the `runQueue` override** — it is
entirely downstream of the queue, and eight of the nine existing AI arms drive a
republic that never holds an election. Assert: after a ballot in which a party
lost the government, that party holds `oust` against the taker within N sessions,
across 14 seeds; leader changes per campaign, pinned against the measured **0**;
and that `moderate` persists past one session, pinned against **113 of 113**.

**What it costs.** Medium. `driftParties` and `runElection` are hot paths and
the pass must spend **no dice** or every seeded campaign re-phases — the
leader replacement is the exception and must be booked deliberately, in one
place, with the cost stated. `nobody holds two great offices` (5481) drives 10
campaigns × 60 sessions through elections and will feel this. The handed `oust`
interacts with I2's adoption rate and with `steer.carryOpen >= 40`.

---

## N8 — The reckoning: an aim that is reached pays, and an aim that fails names what beat it

**NEW.**

**The absence.** **86% of every aim a party forms is abandoned** (22 done, 133
stalled, 3 given up over 158 retirements; independently reproduced at 33/127/3).
`dead` — the predicate that says an aim became impossible — **fired 0 times in
720 sessions**, so *"it is out of reach"* is a sentence the page can print and
the model cannot produce. And **33 of 33 completions were replaced in the same
call**: no pause, no reward, no state change, no log line, no chronicle. A party
that has just taken the office it spent thirty sessions after does nothing
differently, tells nobody, and starts on a random new aim from the same table.
Two aims cannot even be reached: `carry`'s progress is binary and sits at
**exactly 0.00 on 44 of 48 retirements** (about **1,350 sessions per rung** at
the measured bill rate); `charter`'s progress has **one observable value, 0.10,
on all twenty-two retirements**, not because the party lays the wrong article —
it lays the right one on 41 of 55 plays — but because the clock is asleep when
it happens.

**The mechanism.** Three parts.
- **The clock stops lying.** `v19Goal` is reached on only **24.0% of
  party-sessions** — once every 4.2 — so an aim gets **1.8 to 3.9 observations**
  before an 11-session idle bar retires it, and for the RSF fewer than two.
  Poverty retires goals and the page reports it as "going nowhere". The clock
  ticks in `endTurn` for every party, separately from the initiative, or the bar
  is expressed in **observations**. `charter` records the laying on the goal
  (`g.laid`) so the reading survives the two sessions a pending record exists
  for. `carry` credits partial progress — a bill laid, a committee stage
  survived, a floor declaration — and fixes the `Math.abs` at 34717, which reads
  a statute moving the **wrong way** as 100% progress.
- **A reached aim pays.** `st.ai[pid].wins` — read by `v17Accept`'s reservation
  (a party that delivers charges more and is worth more), by the dossier, and by
  the temperament weight. A completed aim produces news and a chronicle line.
- **A failed aim names what beat it.** The record already knows: the rivalry
  read named a foe, the file (N5) holds what the party tried. `lastGoal` gains
  `by` and the panel says *"Put bringing down the LP down after twenty-one
  sessions: they never lost the Chancellery."*

**What the player sees.** The proved-right-or-wrong leg. A player who watched the
PNL work toward the Chancellery for thirty sessions is told, in the news,
whether they got it — and if the player was the reason they did not, they are
told that too.

**How it is measured.** The done/stalled ratio, pinned against the measured
**22/133/3**, with the assertion naming the number it must beat. `dead` firing
at least once per campaign across 14 seeds, against **0 in 720**. `charter`
`best` at retirement no longer constant at 0.10 (min = max = 0.10 today, which
is the measurement stating the defect). And the `V20_AIM` guard **fixed while it
is open**: its comment claims `roads.js` "fails if a ref-bearing goal arrives
without an entry", but the assertion only checks the table's keys — it never
checks that the named verb's body reads the aim, which is the `V17_MEMORY`
whitelist failure the comment says the design avoids.

**What it costs.** Medium, and it is the item most tangled with the existing
harness. `a party votes its own manifesto`'s **three-run, 12-seed × 120-session
clock A/B** (the largest single block in the harness, 4,320 driven sessions)
reads `V19_GOAL_IDLE`, `V19_GOAL_CAP` and the `g.best > 0` stall predicate, and
**all six of its readings move together** if the clock moves.
`carryGaps.every(g => g === 1)` is universal over hundreds of adoptions and dies
on any change to `carry.target`. Both must be re-derived in the slice, not
discovered in review.

---

# PART THREE — THE COALITION OVERHAUL

The owner's word is "flat". Here is flat, as a rate: **360 of 360 formations
came out `majority`; 354 of 360 settled in the first round; no investiture vote
has ever failed; every offer carries exactly 3.00 concessions and exactly 1.00
red line; the ledger holds 40 entries and all 40 are `broken`; `V17_KEPT` has
never been awarded; there were 3 coalition changes between elections in 720
sessions, 2 coalition demands and 1 confidence threat; the longest unbroken
partnership ran 103 consecutive sessions.**

The machinery is not a stub — four rotation branches, offers with portfolios and
concessions and red lines, an investiture, a written agreement, a cohesion
meter, a ledger and five management verbs. **One branch runs.** The overhaul is
five moves, and every one of them makes something that already exists bite.

## C1 — Formation costs invitations, and takes time

Round one asks **every** party, because the loop is
`i < order.length && i < V17_FORM_MAX` with `V17_FORM_MAX = 7` and `PARTIES`
holding exactly 7 — so the cap never binds and rounds two, three and four are
**unreachable by construction**. For round one to fail, all seven bridgeable
neighbourhoods would have to hold under half the chamber at once, which the
opening board and the vote model never produce.

Give the formateur a **budget**: `V17_FORM_MAX = 3`, and a party that refuses is
out of that formateur's round. Formation takes a session — `st.formation.talks`
— during which the country is under a **caretaker**, a fully authored, fully
rendered state (`v17CareBar`, the "what a caretaker may not do" red-line block)
that has been entered **0 times in 360 formations**.

*Player sees:* the formation sheet becomes a sequence they live through, with a
caretaker's restrictions biting while it runs, instead of a result they read
once and then read 65 more times.
*Measured:* the share of formations resolving in round one, pinned against
**98.3%**, and the share reaching `minority`/`grand`/`caretaker`, pinned against
**0/0/0** — asserted from **driven ballots**, not from hand-seated chambers.
`coalition.md` is right that today's three formation arms prove the dead
branches on boards the ballot cannot produce.
*Cost:* `form.pure.same && form.pure.noDice` bans any `rand()` in the rotation —
every change here is deterministic. `care.bound.max === 3 / forced === 1 /
sessions === 3 / carriedOn === 2` are **pinned literals deliberately not read
off `V17_CARETAKER_MAX`**, and a formation that now takes sessions interacts
with that clock directly. This must be argued, not absorbed.

## C2 — The offer is priced, and the terms are the negotiation

`v17Accept`'s value is
`38 − d·38 − grudge·.32 + share·46 + concessions.length·5 + (offices ? 9 : 0)`.
`concessions.length` is **always 3**, so that term is a constant **+15**, and
`redLines` **does not appear in the value at all**. Which statutes are on the
table changes nothing about whether a party sits down. Worse, `offer.offices` is
worth +9 and **`v17Install` never copies it** — a party is bought for nine
points with a great office and handed nothing. `terms.portfolios` is written in
three places and read in none. Both are `st.court.size`, in the one place the
game calls a negotiation.

Price the offer: each concession valued by the invitee's own **gap** (which
`pv5TopWants` already computes) and by what it costs the formateur (which
`v17Friction` already gives); the **number** of concessions varies; the red line
enters the value as a discount the formateur pays for accepting a constraint;
the offer names a **department**, not a count, and `v17Install` **seats it**.
`v17Accept`'s reservation reads `v21Stand(pid, lead)` — the relationship between
the two parties at the table — instead of a posture term measured against the
**outgoing** government (`v17Form` runs after `driftParties` and before anything
writes the new one, so a party furious at the government that just lost charges
everyone +16, and the term fired on 4 of 242 rows).

*Player sees:* each candidate row on the formation sheet expands into the actual
statutes, the red line and the named department, with `value` and `reservation`
recomputed **live** — `v17Accept` is pure and already takes an arbitrary offer
object. The player can offer more, offer less, refuse a red line, trade a
department. Today they can only tick names, and the offer used to compute the
answer is **discarded**; the row says "worth 61 against a price of 44" and the
deal they then sign is a different, smaller deal, because willingness is
computed on a two-party offer and `v17Install` is called with `offers:{}`.
*Measured:* concessions per offer and red lines per offer as **distributions**,
against the measured **exactly 3.00 / exactly 1.00**; an arm that changes one
statute in an offer and asserts `v17Accept`'s answer moves (poison: revert the
pricing and it goes flat); and `st.exec` after install matching the department
offered.
*Cost:* medium. `the coalition in writing` (5442) and `a plurality is not a
government` (5600) both read this code.

## C3 — A promise has a date, and keeping one counts

`due` is written **`null` by all five producers and read by nothing** — grep
`\.due\b` returns the street demand, the referendum bill, the crisis arc, the
article and the region registry, and **no concession**. So a government can
promise two statutes and never lay them, forever, at no cost; a promise with no
deadline cannot be broken by inaction, and inaction is what a coalition
government mostly does with an inconvenient promise. Meanwhile the credit arm
fires only at `v17Off <= 0.001` — **exact arrival** on a want drawn from
`pv5TopWants(...).slice(0,2)`, which are by construction the partner's two
**largest** gaps. Breach fires on **any** wrong-direction move. **40 entries, 40
broken, 0 kept.** A partner can only ever be disappointed.

Credit **progress**: a `kept` entry and `V17_KEPT` for every rung moved toward
the promised want, capped at the concession's own size. Draw at least one
`adopt` from a **small** gap so one promise is achievable inside a term. Give
each `adopt` a `due` counted in the sessions the game's own path actually takes
— lay, floor, signature: **three** — which is CLAUDE.md's own instrument rule,
and book `broken` when it passes unmet. And **one mechanism, not two**:
`pv5CoalitionTick` drags cohesion 12% toward a target with a floor of **38**
every session (measured median cohesion with the player leading: **38**, exactly
the floor) while `v17DealScan` debits 8 or 11 for a breach. The restoring drift
either goes or reads the ledger. Today the version that never fires is the one
printed on the card.

*Player sees:* the coalition card carries a list of promises with **dates and
states** — met, due in 2, broken — and the cohesion number is explained by that
list instead of by a bar that returns to 38 whatever happens.
*Measured:* `kept` entries per campaign, pinned against **0 in 720**; the share
of concessions that reach their `due` unmet; and cohesion's distribution, pinned
against **min 20 / median 38 / p90 48.1**.
*Cost:* small-medium. `live up to it, alter it, betray it` (5909) has
`kept.count === 1 && kept.twice === 1 && kept.marked === true` and will need
re-deriving under partial credit.

## C4 — A partner can bargain, defect and leave, and leaving changes the arithmetic

**No AI party can change a coalition's membership.** Every writer of
`st.coalition` outside `v17Install` is a player button or a scenario literal,
except `v17Walkout`, which fired **3 times in 720 sessions**. And when a partner
does leave, **nothing re-counts whether the government still commands the
house** — losing your majority mid-term, the classic crisis of parliamentary
government, is a line in the log. Four exits disagree: three of them never set
`walkedOut`, which is the key `pv5EnsureState` reads to make a returning partner
sign a new agreement — the exact defect S17g measured as dropping coalition
lifespan from 6.6 sessions to 2.1. And the one moment of brinkmanship the game
offers is a foregone conclusion: "Dare them to leave" appears at `partyRel < 27`
and removes the partner at `partyRel < 28`.

**One new deck card**, `coalition`, whose verb is chosen by the party's
standing and the ledger:
- **`bargain`** — posts a `coalition_demand` with a date and a named
  consequence; against an engine government it resolves in the model instead of
  through a paper.
- **`defect`** — a restive partner writes `b.lines[pid] = 'oppose'` on the
  government's own bill **without leaving**. The channel exists in
  `v17FloorCore` and no rule uses it; `v17ConfidenceVote` is the only place in
  the file a partner votes against its own government, and it has one caller.
- **`broker`** — a party outside the government offers supply, which is the
  thing `st.confidence` exists for and has never been set in play.
- **`walk`** — through **one** exit function, `v17Leave(st, pid, why, actor)`,
  which every path calls and which **re-counts**: a government under the
  majority becomes a minority and must find supply or face `v17ConfidenceVote`
  (N1).

The two exploits that would make all of this decoration close in the same slice:
`joinCoalition` bypasses `v17Accept` **entirely** (12 capital puts the PNL in an
RSF cabinet at a compass distance of 2.31 against a bar of 1.15), and
`pv5CoalitionAction('council')` is **+12 cohesion a press with no cooldown**
(`lastCouncil` is written in two places and read in none) against a walk floor of
12–30, so a head of government with capital holds any partner at 100 for the
whole campaign. Also: the ladder. `confidence_threat` fires at `partyRel < 27`
and `coalition_demand` needs ≥27, so **one threshold makes the two mutually
exclusive and the threat pre-empts** — measured **291 threats against 67
demands** in a pinned-government run, and **below 27 the partner never once asks
for anything**. Gate both on the **ledger** instead: an unmet concession past its
due date writes a demand, two broken promises write a threat, and an unanswered
threat **escalates** rather than repeating.

*Player sees:* a partner that asks before it threatens; a division the
government loses because its own partner sat on its hands; and the session the
arithmetic stops working.
*Measured:* coalition changes **between elections**, pinned against **3 in 720**;
demands and threats per campaign, pinned against **2 and 1**; sessions with
confidence-and-supply, pinned against **0**; and the identity that every exit
sets `walkedOut` (poison any one path and it reddens).
*Cost:* the largest single item. One deck card is a five-place change in
`vale.html` and a five-place change in `roads.js` including the `moved` chain at
4235–4252, which falls through to `false` for a card it does not name — by
design, and the comment says so.

## C5 — The relationship is between two parties, not between everyone and the player

`st.partyRel` is **one number per party — the player's** — and it is the
**second-largest term in every division** (mean absolute 4.98 of 61.24), the
number `assentFavour` reads for transactions the player is not in, and the
number two engine parties' feud moves when `attack` and `pact` call
`shiftPartyRel(st, pid, …)` with the actor rather than the target. It is pulled
6% toward 46 or 62 every session by `politicsTick` and a further 3.5% toward
cohesion by `pv5CoalitionTick`: an 8-point injury has a half-life of about
**eleven sessions**. Two parties that governed together for **103 consecutive
sessions** meet on formation night exactly as two parties that have never met.

`v21Stand(st, a, b)` (declared once in the shared-channels section) is written
by everything that already writes memory plus the ledger, and read by
`v17Accept`'s **value and reservation**, `partyBillSupport`, `assentFavour`,
`v17Invest`, `v16PactPartner` and `v19Rivalry`. A habitual partnership is cheap
to renew; a betrayed party is expensive. Declare the pair once and index it both
ways, and **assert both directions** — S17m's ruling, and the reason
`st.aiPacts` is a one-way door today (`pact.run` writes `st.aiPacts[pid]` and
never `st.aiPacts[o]`, and the refusal is a key lookup, so one party can be in
several pacts and collect the ballot boost twice).

And the investiture becomes a real division. `aye` sums the coalition's seats,
so `aye === have >= 653` and `nay <= 652`: **`invested` is arithmetically forced
for every majority coalition** and the abstention rule the tally prints has a
live effect only on branches that never run. Count **members**, not parties —
`factionAverage` and `partyDiscipline` exist — so a coalition with poor internal
loyalty can lose its own back benches on the floor.

*Player sees:* the dossier's standing matrix; a formation where a party refuses
the player because of something the player did forty sessions ago; and an
investiture vote that can be lost.
*Measured:* failed investitures per 1,000 formations, against **0 of 360**;
`v17Accept` answers moving under a planted standing in **both** directions;
and a paired-parties arm asserting `stand[a][b]` and `stand[b][a]` are indexed
from one declaration.
*Cost:* wide. `nobody holds two great offices`, `the coalition in writing`,
`a plurality is not a government` and `the house removes a government` all read
this code, and `partyBillSupport` is read by every bill arm in the file.

---

# BUILD ORDER, COST AND RISK

| # | item | size | new `rand()` | existing arms at risk |
|---|---|---|---|---|
| N3/C5 | `v21Stand` — the signed matrix | L | none | 6697, 4309, 5442, 5600, 10022 |
| N5 | `v21Emit` + the file + the dossier | M | none | 8339 (chair walk), 9091 panel regex |
| N2 | the memory points at governments | M | none | **S19f `bar.*`, S19b `scale.*`** |
| I2 | `oust` adoptable | S | none | 9720 `neverAdopted`, `steer.carryOpen` |
| N1 | the motion, announced | M | **one** (the bar draw, if any) | 5781, 8463 |
| C1–C4 | the coalition overhaul | XL | none in the rotation | 5600, 5725, 5909, 5442 |
| I1 | `court` gets a channel | L | none | 3283, 3560, 3566 |
| I3 | the rehearsal settles | M | clone-only | **9091 `sim.*`, wall clock** |
| N4 | `press` for engines | M | none | 10999, 11228, 9091 `floor.*` |
| I4 | assent by sponsor and holder | S | none | 2820, 2853 |
| N7 | the engine answers the ballot | M | **one** (leader change) | 5481, 3696 |
| N8 | the reckoning | M | none | **10022 clock A/B (4,320 sessions)** |
| I5 | the default level reads | S | none | **9450 `rank.purposeful.gain === 0`** |
| I6 | tempo temperature | S | none | **8754 `budgetHeld` at 1e-6** |
| N6 | papers with dates | S–M | none | 5256, 8463 |

**Ship order:** `v21Stand` and `v21Emit` first — nine of the other thirteen
items read one or both, and building them second means building them twice. Then
N2 → I2 → N1, which is the single narrative thread the player will notice most
(a party learns to hate a government, forms the aim, gives notice, moves the
motion). The coalition overhaul is one PR of its own. `court` and the rehearsal
are independent and can go in parallel. I5 and I6 are the cheap ones and should
go early so their re-pinned assertions are settled before the expensive items
land on top of them.

**Four assertions I am proposing to change, and why** — stated up front rather
than discovered in review:
1. `rank.purposeful.gain === 0` (S19b) — I5 makes `purposeful` read a rival, so
   the exact zero must become a small positive. R1's floor is `instinct`, which
   stays byte-identical.
2. `ai.budgetHeld` (S18e) — I6 makes the budget a function of the board's
   temperature; the identity is rewritten, not deleted, and gains an arm the old
   one could not carry.
3. `fires.afterKindness === 0` (S17l) — N3 inverts it. This gate is the defect
   stated as an assertion.
4. `kept.count === 1 && kept.twice === 1` (S17g) — C3's partial credit changes
   the count. Re-derived.

**Three assertions I would fix while I am here, at no design cost:** the three
arms printing *"eight seeds"* over code that drives fourteen (roads.js 9478,
10316, 10678) — an S21 slice quoting them understates the sample by 43%, which
is exactly the direction that caused S20f; the `V20_AIM` guard, whose comment
claims it checks that the named verb reads the aim and which only checks the
table's keys; and `V16_AI_COST` becoming a covered surface, which is the one
table that escaped the whitelist rule and which silently prices three of eleven
cards at zero.

---

# WHAT I HAVE NOT RESOLVED

- **The wall clock.** `roads.js` runs 16m40s and thirteen of those minutes are
  already the AI block. I3's settle is a per-rehearsal cost inside a function
  called for every open card at the two top levels, and the harness drives at
  `ruthless`. If the settle measures too expensive the fallback is bills only,
  and that has to be measured before the design is committed to, not after.
- **How much of the engine's output the inbox can absorb.** N1, N6 and C4 all
  route to a six-slot inbox that already carries 762 `party_demand` papers per
  720 sessions. The routing weights in `v21Emit` decide whether the player is
  addressed or buried, and I do not have a number for them. They must come from
  a driven distribution, not from my judgement — this is the S17q defect waiting
  to happen, and the honest position is that the weights are the last thing
  tuned and the first thing measured.
- **Whether `court`'s per-party channel is the right fix or whether the bloc
  model should change.** `society-foreign.md` argues a bloc's mood means "how
  satisfied this bloc is with the government", in which case the incumbent
  advantage at 11509–11511 is correct and `court` is simply the wrong card for
  an opposition party. I have chosen the party-scoped channel because it is
  additive and does not touch a term the whole vote model rests on — but the
  owner may prefer the other answer, and it is theirs to rule on.
- **The `attack` magnitude.** `V16_AI_ATTACK`'s own comment says it is the
  owner's dial. One player `audit` click (−.12) outweighs three engine attacks
  (−.036 each), and the whole board's attacking moves about 1.0 machine-points
  across 360 sessions. I have proposed frequency changes and not size changes,
  deliberately, and flag that the asymmetry survives this proposal.
- **Whether N7's leader replacement should spend a die.** It must be seeded and
  it re-phases every campaign from the first replacement onward. There may be a
  deterministic form (the highest-standing figure in the party's own field) that
  costs nothing, and I would prefer it if it exists.
