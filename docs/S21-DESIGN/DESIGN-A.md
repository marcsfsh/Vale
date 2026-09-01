# S21 design A: make the machinery bite

## The position

This engine does not need another subsystem. It needs about thirty wires
connected.

Read the intake as a single document and one shape appears on every page. A
mechanism was built carefully, given constants, comments, a panel and a harness
arm, and then the last wire was left off. Four formation branches behind a
constant that cannot bind. An investiture vote whose arithmetic forbids a
refusal at the only place it is called. `V17_KEPT` with a credit test that
requires exact arrival on a party's largest gap. `V16_AI_COST` holding 8 of 11
cards, so the three most institutional cards price as free. `v19Standing`
reading none of the five fields that seven of the eleven cards write. The
reaction layer running before the inbox writer that produces 63% of its input.
`oust` dropped by its own `done` test at adoption. An extremism term whose gate
sits above the mood the game produces. `terms.offices`, `terms.portfolios`,
`terms.confidence`, `lastCouncil`, `bill.support`, `bill.committee`,
`m.suppressCost`, `V19_GOAL_STALE`, `k.short`: written, never read.

Every one of those is 5 to 80 lines from working. Together they are the
difference between the 1 out of 10 the owner scored and the game the code
already describes.

The case for connecting wires instead of building something new is not about
economy. It is that this file punishes parallel mechanisms specifically, and
its own history is the evidence: `MOVEMENTS` and the S17q street are the same
idea built twice six slices apart, and the older one has never crossed its own
threshold. `d.satisfaction` and `v17DealScan` are two mechanisms computing
coalition health, and the one that never fires is the one the player can read.
`st.blocs` is modelled one way by `v17Utility` and the opposite way by
`supportTargets`, and the AI's most-played card sits between them making its
own party worse off four times in five. Adding a thirteenth mechanism to this
file adds a thirteenth thing to disagree with the other twelve.

There is a second argument, which is about what the owner will feel. A new
subsystem arrives as one new thing the player learns. Thirty connected wires
arrive as the whole board coming alive at once: the coalition partner who
writes to you, the opposition party that has decided to bring you down and says
so, the office you promised at the table and then took back, the party that
remembers you funded it. None of that is new fiction. All of it is fiction the
file already tells and cannot currently perform.

Three proposals below do need a new mechanism, and each says why the existing
machinery could not serve.

### One ruling I am asking for, up front

The brief says the AI level's floor is the shipped game exactly at `instinct`.
I read that as governing the opponent's *competence*: `v19*`, `v16Ai*`, the
chooser, the goals, the memory, the reaction. Every item below that touches
those is gated on `v19Thinks` or a level scalar, and I say so per item.

I read it as not governing the *constitution*. `v17Rotation`, `v17Accept`,
`v17Invest` and `v17Install` are dice-free, pure, and identical for the player
and for an engine; the player sits inside them. Gating the investiture on the
AI setting would mean a player on `instinct` plays a different republic from a
player on `ruthless`, which is a worse outcome than a floor that moves. So the
coalition overhaul is ungated, and I flag it here where it can be argued with.

If the owner rules the other way, the coalition items gate on
`v19LevelOf(st).sharp > 0` and the floor keeps the shipped formation. That is
one predicate in `v17Accept` and one in `v17Invest`, and nothing else in the
design changes.

---

# Part 1: the coalition overhaul

The measured complaint is precise. 360 formations, 360 majorities, 354 in the
first round, 0 investiture failures, 0 minority governments, 0 supply
arrangements, 3 coalition changes between elections in 720 sessions, 2
`coalition_demand` papers, 1 `confidence_threat`, 40 ledger entries of which 40
are `broken` and 0 `kept`. Against 762 `party_demand` papers on the same run.
The inbox is busy and the coalition is silent.

Nothing in that list needs a new mechanism. The rotation has four branches, the
offer has portfolios and concessions and red lines, the agreement has a ledger,
the vote has an abstention rule, the walkout has a floor that reads the record.
Eleven changes below turn the whole apparatus on. They are ordered so each one
makes the next reachable.

## Movement one: the offer becomes a negotiation

### C1. The price of a partner reads the pair, not the incumbent

**Improvement.** `v17Accept`'s reservation is
`30 + v17Share*70 + (post === 'attack' ? 16 : 0) + (bigger ? 22 : 0) - relax`
(37485). The posture term reads `v17PostureOf` into `v16Posture`, which
branches on `st.ruling` and `st.coalition`, and `v17Form` runs at 11977 before
anything writes the new government, so it reads the *outgoing* one. Measured
over 242 accept calls it fired on 4 (1.7%), and a party in the old cabinet
returns `partner` at 34137 before any grudge is read, so an ex-partner that
loathes the new formateur pays nothing.

**Mechanism.** Delete the posture term. Replace with
`(v16Grudge(st, pid, lead) >= 35 ? 16 : 0)`, which asks about the two parties
at the table. The reservation then also reads history through C6 below:
`- Math.max(0, -v16Grudge(st, pid, lead)) * .25`, so a party that has been
funded, invited or given a ministry is cheaper to seat than a stranger, and a
party that was expelled is dearer. Two lines in one function, both pure.

**Player sees.** The formation sheet already prints
"Worth `value` to them against a price of `reservation`" per candidate (19421).
Those numbers stop being the same numbers every campaign. Add the reason to the
row: "They will not serve under you at any ordinary price" for the size term,
"They have not forgotten the last time" for the grudge term.

**Assertion.** Hand-seated board, two runs of `v17Accept` differing only in
`v16Grudge(st, pid, lead)`: the reservation moves by exactly 16 at the bar and
the value by `-.32` a point, and the two are separable. Poison each term alone
and both together (they are belt and braces on the same fact, and removing
either alone must change something). Pins: the 16, the .25, and the fact that
the posture string no longer appears in the function.

**Cost.** ~15 lines. Risk: `a plurality is not a government` hand-seats boards
whose acceptance decisions move. Both hand-built boards must be re-driven and
their outcomes re-pinned. No dice: `form.pure.noDice` still holds.

### C2. The investiture can be lost

**Improvement.** `v17Invest` sums `st.seats[p.id]` for every member of `co`
(37569), so `aye === r.have`, and it is only called when
`r.have >= v17Majority(st)`. `aye > nay` is arithmetically forced. 360 votes,
0 failures. The abstention rule and the `d > .62 || g >= 30` predicate at 37572
decide only how the losing seats split, and that split cannot change an outcome
already decided.

**Mechanism.** Count members, not parties. `partyDiscipline(st, pid)` (9122)
already returns `clamp(.25 + (factionAverage - 40)/100, .25, .97)` and is
deterministic. For each coalition party, `aye += n * partyDiscipline(st, pid)`
and `abstain += n * (1 - partyDiscipline(st, pid))`, with a party whose
cohesion is under its own walk floor (`v17WalkFloor`, 35615) contributing its
undisciplined share to `nay` instead of `abstain`. A coalition at 653 of 1305
with a rabble on its back benches can now lose the house. `v17Rotation` then
falls through to the next formateur, which is what the four branches are for.

**Player sees.** The formation sheet's round lines (`v17RoundLine`, 19444)
already print the tally. They stop printing a foregone conclusion. Add the
defector count: "Eleven of their own members did not vote for it."

**Assertion.** Hand-seat a bare majority with `st.factions` loyalties driven
down; assert `invested === false` and that raising loyalty alone flips it.
Then the arm that matters: drive real ballots with the `runQueue` override and
assert that the *distribution* of `st.formation.how` has `majority` under a
measured share, with the number in the assertion's own words. That is the
assertion coalition.md asks for and the one that would have caught 360/360.

**Cost.** ~35 lines. Draws no dice. Risk: this is the highest-risk item in Part
1 because `a plurality is not a government` and `a caretaker holds office`
exercise the minority and caretaker branches on hand-built boards, and those
boards now behave differently. Both arms need re-driving; both were written to
be re-driven.

### C3. The offer's content enters the price, and the offer varies

**Improvement.** `v17Offer` (37430) always returns two `adopt` concessions, one
`refrain` and one red line, because `pv5TopWants(pid, st, 4)` always returns
four rows and the slices are literal. `v17Accept`'s value counts
`concessions.length * 5`, which is a constant `+15`, and never reads
`redLines`. Measured: exactly 3.00 concessions and exactly 1.00 red lines
across 653 offers. Which statutes are on the table changes nothing about
whether the party sits down.

**Mechanism.** Three edits inside two pure functions.

- `v17Offer` varies the count: one concession where the invitee is close
  (`dist2 < .45`), two at the middle, three where it is far. The formateur is
  buying distance, and the offer says so.
- `v17Accept` prices each concession by what it is worth to the invitee.
  `v17Off(st, pid, c.ref)` (35641) already computes the gap between the book
  and the party's want, so `value += Math.min(9, off * 2.2)` per `adopt`, and
  a `refrain` is worth its own `v17Friction` gap (35625).
- `v17Accept` prices the red line: `value += (offer.redLines || []).length * 4`,
  because a constraint the formateur accepts is a thing the invitee is buying.

**Player sees.** `v6CoalitionCandidates` (19415) already builds the real offer
and throws it away, reporting only the two numbers. Expand each candidate row
into the statutes on the table with the value each contributes, recomputed live
off `v17Accept`, which is pure and already takes an arbitrary offer object.
The player as formateur can then see what they are paying for.

**Assertion.** Two offers on one board differing only in which statute is
conceded: the values differ, and the difference equals the gap term. Poison the
concession pricing and assert the two offers score identically again. Pins: the
9 ceiling, the 2.2, and that `concessions.length` no longer appears.

**Cost.** ~55 lines. Pure, no dice. Risk: `the coalition in writing` (5442)
reads `terms.concessions` shape; a varying count is fine, but the arm's
`kinds` check should be widened to assert a `refrain` is present whenever the
count is above one.

### C4. An office promised at the table is delivered

**New behaviour.** `v17Offer` returns `offices: share >= .22 ? 1 : 0` (37445),
worth `+9` in the value (37462). `v17Install` copies `portfolios`,
`concessions`, `redLines` and `confidence` (37647) and does not copy `offices`.
Nothing else in three megabytes reads `offer.offices`. A party is bought for
nine points with a great office and handed nothing. This is `st.court.size` at
the coalition table.

**Mechanism.** `v17Offer` returns a *named department* instead of a count:
`office: <dept id>` chosen from the four in `DEPTS` that the formateur's own
side holds, preferring the one nearest the invitee's `wants`. `v17Install`
writes `st.exec[dept] = pid` and `d.terms.offices = [dept]`, a field with an
existing writer at 16096 and an existing reader at 16837. `v17Accept` prices it
by which department it is, so a great office and a minor one are worth
different money.

Then the return trip: `pv5CoalitionAction('portfolio')` taking that department
back, or `execContest` losing it, calls
`v17DealEvent(st, 'office', dept, st.ruling)` and a new arm in `v17DealScan`
books a `broken` entry. Taking back what you promised is a breach.

**Readers named.** `st.exec` is read by `assentFavour` (9443), `execHeld`
(10695), `holdsDept` (10721), `officeMine` (11010), the order gate (28718),
`v17AiOrderFor` (38407), `figureEffects` (7357) and `v19Standing` (35261).
`d.terms.offices` by `v17MyDealCard` (16837).

**Player sees.** The formation sheet names the department in the offer. The
coalition card's "No great office" tag (16853) becomes the department. The
Government page's executive row shows a minister seated by an agreement rather
than by an eight-year cycle nobody influenced.

**Assertion.** Drive a formation with the override; assert that for every
`offers` entry carrying an `office`, `st.exec[that dept] === that party` on the
session after install. Then take it back with the portfolio button and assert a
`broken` ledger entry appears. Poison the install write and the breach arm
separately.

**Cost.** ~55 lines. Risk: `nobody holds two great offices` (5481) asserts
`doubles === 0` over 100+ elections; the install must respect the same
one-person-one-office rule `execSeat` enforces. `figureEffects` applies a
holder's traits only inside the coalition (7357), which is now more often true.

## Movement two: the agreement becomes a clock

### C5. A concession has a date, and inaction breaks a promise

**New behaviour.** Every producer writes `due: null` (`v17Offer` at 37438 and
37442, `v17Supply` at 37536, `pv5EnsureState` at 16100 and 16104), and nothing
in the file reads a concession's `due`. A government can promise two statutes
and never lay them, forever, at no cost. The street's demand has a deadline and
CLAUDE.md records it as the model; the coalition agreement does not.

**Mechanism.** `V21_CONCESSION_DUE`, derived from the instrument. The
instrument the answer has to use is a bill: laying is one session, the floor is
a second, and since S15d the statute does not move until an office signs, which
is a third. A concession drawn from a two-rung gap is two bills. So the
constant is `6` and its comment says that arithmetic, per CLAUDE.md's rule
about the instrument deciding the deadline.

`v17Offer` writes `due: st.turn + V21_CONCESSION_DUE`. `v16RedLineTick`'s
session sweep (35739) gains one arm: an `adopt` concession with
`st.turn > c.due && !c.met && !c.lapsed` latches `c.lapsed = true`, books a
`broken` entry through `v17Ledger`, and debits `V17_BREACH.lapsed` of cohesion.
One latch, one entry, never twice.

**Readers named.** `v17Broken` (35606) → `v17WalkFloor` (35615) and
`v17CanRenegotiate` (35800); `d.satisfaction` → `pv5CoalitionTick` (16314), the
walkout test (35765), `v17ConfidenceVote` (37747), and C11 below puts it in
`partyBillSupport`.

**Player sees.** `v17MyDealCard` (16834) and `pv5CoalitionPanel` (16862)
already print each concession's state as `outstanding` / `kept` / `broken`.
They gain a date: "outstanding, due in 2 sessions" and then "lapsed". The
partner writes a `coalition_demand` when the date passes (C7).

**Assertion.** Drive a formation, never lay the promised statute, assert a
`broken` entry appears on exactly the session after `due` and exactly once over
the following ten. Poison the `due` write and the sweep arm separately, and
then together, because they are belt and braces on one fact.

**Cost.** ~50 lines. Draws no dice. Risk: `live up to it, alter it, betray it`
(5909) pins `betray.broken === betray.outstanding`; lapsed promises now also
count, so that arm's arithmetic must be re-stated.

### C6. `V17_KEPT` can be earned

**Improvement.** The credit fires only when `v17Off(st, pid, ref) <= 0.001`
(35709), meaning the statute must land exactly on the party's authored want,
and only on the `move` event that closes it. The concessions are
`pv5TopWants(pid, st, 4).slice(0, 2)`, which `pv5TopWants` sorts by gap
descending (16023), so they are by construction the partner's two *largest*
gaps. `V19_GOALS`' own comment records that the biggest gap measured 4 on every
adoption across twelve seeds, and a bill moves a statute one rung. The breach
arm fires on any wrong-direction move of a red line and any touch of a
`refrain`. 40 ledger entries in 720 sessions, all broken, none kept. A partner
can only ever be disappointed.

**Mechanism.** Two edits.

Credit progress. Store `c.was = v17Off(st, pid, c.ref)` when the concession is
written, and in the `adopt` arm pay `V17_KEPT` per rung closed:
`if (off2 < c.was - .001) { credit; c.was = off2; }`, marking `c.met` and
booking the `kept` entry when `off2 <= .001`. A four-rung promise pays four
times, which is the right shape: the partner is credited for the government
trying.

Make one promise reachable. `v17Offer` draws its two `adopt` concessions from
`wants[0]` (the largest gap, the one the partner cares most about) and the
*smallest* of the four rows in place of `wants[1]`. One promise is a stretch
and one is inside a term, which is what an agreement looks like.

**Player sees.** The card's state tag moves through the term: "outstanding" to
"2 of 4 rungs" to "kept". Cohesion visibly rises when a bill carries. The log
line at 35713 already exists and finally fires.

**Assertion.** Drive with the override; assert `v17Kept` over the run is above
a measured floor and that a single rung produces exactly one credit of
`V17_KEPT`. The `kept` half must be poisoned by reverting the per-rung test
alone, and separately by reverting the small-gap draw alone. Neither poison
alone may come back green.

**Cost.** ~45 lines. Risk: `live up to it, alter it, betray it` pins
`kept.count === 1 && kept.twice === 1 && kept.marked === true`. Per-rung credit
changes `kept.twice` by design, and that arm must be re-stated to assert the
progressive shape. This is a deliberate assertion change and I am naming it.

### C7. The partner's voice is on the ledger, and it has its own slot

**Improvement.** `politicsTick`'s producer returns at
`st.inbox.length >= 4 || (st.turn + st.inboxSeq) % 2` (10261), so it fires at
most every other session; then the coalition branch needs `st.partyRel[partner]
< 27` for a threat or a `rand() < .62` for a demand. `partyRel` has two
restoring forces pulling it up (10242 at 6% a session toward 62; 16314 at 3.5%
toward cohesion), so the threat bar is nearly unreachable, and the demand loses
the coin toss to the governors. Measured with the player pinned as head of a
coalition for 792 sessions: 312 blocked by a full inbox, 215 by parity, 252
reached the branch. Over the whole baseline: 2 demands and 1 threat.

Worse, the two are mutually exclusive on one threshold: the threat fires below
27 and returns, so below 27 the partner never asks for anything. The
relationship has two states, silent and armed.

**Mechanism.** Stop gating the coalition on `partyRel` and gate it on the
ledger, which C5 and C6 now fill.

- One unmet concession past its `due` → `coalition_demand`, the existing paper
  type with its existing three answers (10108).
- `v17Broken(st, pid) >= 2` → `confidence_threat`, existing type.
- Both, in that order, so a partner asks before it threatens. The two become a
  ladder, with asking on the lower rung.

Give the branch its own slot: run it before the inbox-length and parity return,
so the coalition does not lose the toss to the governors. The `rand() < .62`
comes out; the ledger is the condition and a promise past its date is not a
coin flip.

**Stream.** This re-phases every seeded campaign, and I am saying so rather
than hiding it. Removing the `.62` roll changes how many numbers come off the
stream on the sessions the branch reaches, and moving the branch changes which
sessions those are. Pre-release this is permitted; `tools/determinism.js`
asserts properties of the stream and stays green. Every published pacing figure
must be re-swept over six seeds afterwards.

**Player sees.** A partner that writes to you when you miss a promise, by name,
about the statute, with the date it was owed. This is the single largest change
in what the player experiences from Part 1.

**Assertion.** Drive with the override; count `coalition_demand` and
`confidence_threat` raises per 100 sessions with a coalition in force and
assert both are above a measured floor. Poison the ledger gate and assert both
fall back to the shipped 2-and-1 rate.

**Cost.** ~60 lines. Risk: `the papers know which chair you sit in` (8463) and
`V18_PAPER_NEED` routing must still hold; the two types stay `'leading'` until
C10 gives the junior its own.

### C8. Cohesion reaches the floor of the house

**Improvement.** `d.satisfaction` is read in three non-display places:
`pv5CoalitionTick` (16314), the walkout test (35765), `v17ConfidenceVote`
(37747). `partyBillSupport` does not read it. Its coalition term is a flat
`if (coalition.indexOf(pid) >= 0 && bill.sponsor === st.ruling) score += 12;`
(9026), the same 12 whether the partner sits at 76 cohesion or at 13. Measured
across 1,634 divisions: a coalition partner and an opposition party vote
identically on any bill the government did not lay, and on the government's own
bill the whole gap is that 12.

**Mechanism.** `score += 12 * clamp((d.satisfaction || 50) / 55, -0.7, 1.6)`,
so a happy partner is worth up to 19 and a partner under its walk floor is
worth about -8. One line, one existing reader, one existing field.

**Player sees.** Breaking promises costs divisions before it costs the
government. The bill card's forecast moves when cohesion moves, and the
coalition panel's meter becomes a thing the player watches for a reason.

**Assertion.** One bill, one board, cohesion swept from 10 to 90: the partner's
support rises monotonically and crosses zero contribution below the walk floor.
Pins the 12 (it has been 12 since S10b) and the 55.

**Cost.** ~15 lines. Risk: `the division is counted` stubs `partyBillSupport`
entirely, so it is untouched. `legislative.md` measures this term at 2.38 mean
absolute contribution today, so the aggregate movement is small and the tail
movement is large, which is the intended shape.

## Movement three: the doors that bypass the model

### C9. `joinCoalition` and `expelPartner` go through the rotation

**Improvement.** `joinCoalition` (12953) costs 12 capital and pushes the party
onto `st.coalition`. `v17Accept` is never called; `V17_UNBRIDGEABLE` is never
consulted. An RSF government can seat the PNL for 12 capital at a compass
distance of 2.31 against a bar of 1.15. The rotation's own comment says "a
model in which every coalition can be bought has no politics in it", and
between elections every coalition can be bought. `expelPartner` (12963) is the
same hole reversed: 8 capital removes anybody, with no vote, no recount and no
refusal.

**Mechanism.** `joinCoalition` calls
`v17Accept(S, pid, S.ruling, v17Offer(S, S.ruling, pid, co.concat([pid])), 0, null)`
and refuses with the sentence `v6CoalitionCandidates` already writes at 19423.
`expelPartner` recounts: if the remaining coalition is under `v17Majority`,
`st.confidence = null` and the government is a minority, which makes
`v17ConfidenceVote`'s supply branch (37751) live for the first time in play.

**Player sees.** The party board's button carries a `title` with the refusal
reason and renders `disabled` when the answer is no, which is what
`no control lies, in any chair` requires. Expelling a partner that carries your
majority puts a bar on the Government page saying the government no longer
commands the house.

**Assertion.** Drive the button from the head-of-government chair against an
unbridgeable party and assert the refusal; against a willing one and assert the
seat. Poison the `v17Accept` call and assert the unbridgeable party joins
again.

**Cost.** ~45 lines. No dice: `v17Accept` and `v17Offer` are pure.

### C10. One exit, and the exit re-counts the house

**Improvement.** `st.coalition` loses a member in four player-reachable places
and one engine place, and each does something different. `v17Walkout` (35770)
sets `d.former` and `d.walkedOut`, fires `v17DealEvent('quit')`, resents 25,
logs, adds news, writes the chronicle. `leaveCoalition` (13243) fires the event
and resents 22 but never sets `walkedOut`. `expelPartner` (12967) does none of
it. The `confidence_threat` `dare` answer (10173) filters the array inline.
`pv5EnsureState`'s "a party that comes back signs a new agreement" branch
(16080) keys on `d.walkedOut`, so three of the four exits leave a returning
partner resuming on the cohesion it left with, which S17g measured as dropping
mean coalition lifespan from 6.6 sessions to 2.1. And nothing anywhere
re-counts whether the government still commands the house.

**Mechanism.** `v17Leave(st, pid, why, actor)`, called by all five paths. It
sets `d.former` and `d.walkedOut`, fires the quit event, resents by a weight
per `why`, logs, adds news, writes the chronicle, and then recounts: if the
remaining coalition is under `v17Majority`, the government becomes a minority
and the Government page says so.

Two repairs ride along. The quit arm writes one `broken` entry in place of one
per unmet concession (35676), because three at once takes `v17Broken` straight
to `V17_PATIENCE` and permanently disables "Reopen the agreement" for any party
that has ever walked out. And the ledger carries an era marker so `v17Broken`
counts the current agreement, which is what `v17WalkFloor` and
`v17CanRenegotiate` are asking about.

**Player sees.** A partner leaving is the same event however it happened, and
losing your majority mid-term puts a bar on the page. Today it is a line in the
log.

**Assertion.** Drive each of the five exits and assert `d.walkedOut` is set,
one `broken` entry is written, and the recount fired. Poison the recount and
assert a government under half the house reports itself as a majority again.

**Cost.** ~70 lines, most of it moving existing bodies into one function. Risk:
`dead-bodies.json` if any of the five becomes a wrapper; none needs to.

### C11. The council has a cooldown and the portfolio button checks before it charges

**Improvement.** `pv5CoalitionAction('council')` (16750) costs 3 capital and 2
money, adds 12 cohesion and 7 `partyRel`, writes `d.lastCouncil = S.turn`, and
nothing reads `lastCouncil`. The walkout floor is 12 to 30 and the button is
worth 12 a press with no limit, so a head of government with capital can hold a
partner at 100 for a whole campaign, which makes every breach, every red line
and the whole ledger unreachable at will. Separately,
`pv5CoalitionAction('portfolio')` spends 4 capital and *then* looks for an
office to trade; when the coalition holds no other great office the capital is
gone with no refusal, no toast and no log line, from a button that renders with
no `disabled` and no `title`.

**Mechanism.** Read `lastCouncil`: refuse inside `V21_COUNCIL_REST` sessions,
render the button `disabled` with a `title` saying when it reopens, and halve
the gain on the second council inside one term. Compute `off` before spending
in the portfolio arm and disable with a title when there is none.
`pv5CoalitionAction('programme')`'s red-line write goes to `d.terms.redLines`
in place of the legacy `d.redLine`, which `pv5EnsureState` overwrites at 16112
before the player can act on it.

**Player sees.** Three buttons that stop lying. Two of them currently charge
for nothing.

**Assertion.** `no control lies, in any chair` already walks all fifteen pages
from all three chairs and presses everything enabled; these three fall under
it once they carry titles. Add a direct arm: press council twice in consecutive
sessions and assert the second is refused and no capital moved.

**Cost.** ~30 lines.

## Movement four: the junior partner's game

### C12. A junior partner has verbs

**New behaviour.** `pv5CoalitionPanel` emits the five management buttons only
when `leads(S)` (16862) and `pv5CoalitionAction` refuses at 16747 with a
matching sentence, so the gate is at least consistent. What a junior partner
gets is `v17MyDealCard` (16834), which is read-only, and `leaveCoalition` on
their own party board. `V18_PAPER_NEED` marks both coalition papers as
`'leading'` (10005), so a junior never sends one either. One of the owner's
three named chairs has exactly one coalition decision in it, and that decision
ends the game they are playing.

**Mechanism.** Four buttons on `v17MyDealCard`, each through a channel that
already exists.

- **Demand a concession.** Writes a new `adopt` concession into
  `d.terms.concessions` with a `due`, and posts the demand to the head of
  government. Against a player head it is a `coalition_demand` paper; against
  an engine head it resolves in the model through the same `v17Accept` value
  arithmetic C3 builds. Cost: capital and cohesion.
- **Withhold the whip on the next division.** `v17FloorCore` (38305) already
  writes `b.lines[actor]` for any party and `partyBillSupport` reads it at
  +16/-18. The junior declares against a government bill. Cost: cohesion, and
  a `broken` entry against the *government's* record if the bill was one it
  promised.
- **Ask for a department.** Reads C4's `d.terms.offices`; refusal costs the
  government cohesion and the partner nothing.
- **Publish the disagreement.** Costs the government `st.capital` and the
  partner `d.satisfaction`, and raises a news item. This is the junior's
  version of the head's "Demand discipline".

**Player sees.** A chair with a game in it. Today the junior partner reads a
card and can quit.

**Assertion.** `no control lies, in any chair` covers the rendering. Add an arm
that seats the player as a junior partner, presses each of the four, and reads
the outcome through the game's own path: the concession appears in the terms,
the line appears in `b.lines`, the division moves, the capital moves. Poison
each of the four handlers separately, per CLAUDE.md's rule that the poison list
comes from the diff.

**Cost.** ~120 lines, the largest single item in Part 1. Risk: `the three
chairs` (5122) and `the floor is open to every chair` (8149) both walk the
junior chair and will need their inventories widened.

### C13. Confidence and supply becomes a live state with a price

**New behaviour.** `st.confidence` is written at 37627, 12951 and 10171, and is
never set back to null except by the next `v17Install`. Its only mechanical
reads are `v17ConfidenceVote`'s abstention (37751) and `govShare` (10956). The
election report at 14020 tells the player the supply party "can withdraw them".
Nothing can withdraw them. The party-board verb's description at 12949 says the
arrangement will "cost you capital every year"; there is no recurring charge
anywhere. Measured: 0 sessions with confidence and supply in 720, because the
minority round is unreachable.

C2 and C9 make it reachable. This makes it worth reaching.

**Mechanism.** A supply party gets its own `st.coalitionDeals` entry with its
own concession and its own `due`, written by `v17Supply` (37536), which already
builds an offer. Each session the government fails to pay (the concession
lapses, or the recurring capital charge the card already advertises goes
unpaid), the supply party's satisfaction falls; below its walk floor it
withdraws, `st.confidence = null`, and the government faces
`v17ConfidenceVote` with its abstention gone. `v17CareBar` (37728) is the
shipped template for what a restricted government's page looks like.

**Player sees.** A minority government that has to keep somebody happy every
session, and a Government page that says who and at what price.

**Assertion.** Hand-seat a minority; drive with the override; assert the
withdrawal fires when the concession lapses and that the confidence vote is
then lost. Poison the withdrawal and assert the government survives forever.

**Cost.** ~60 lines. Risk: this branch has never run in play, so it is the
least-tested code in the file. `a caretaker holds office and does not govern`
is the neighbouring arm.

---

# Part 2: improvements to existing behaviour

## I1. The reaction layer runs after the writer that feeds it

**Defect.** `endTurn` runs the wrapped `tickTurn` at 13481, which is
`v16AiTickBase → v16RedLineTick → v19React → v16AiTurn` (35922), and only then
runs `politicsTick` at 13488, which calls `expireInbox`. An ignored
`party_demand` writes `v16Resent(st, it.from, playParty(st), 14)` at 10224; 14
clears `V19_REACT_RISE` (10), so `v16Resent` stamps
`a.provokedAt[player] = st.turn` (34098). But `v19React` compares
`stamped === st.turn` (35906) and has already run this tick, and `S.turn += 1`
lands at 13515, so from the next session on the stamp is one behind forever.
The ignored letter is 81 of 128 traced grudge writes (63%) and the single
largest source of hostility toward the player. The one mechanism that makes a
party answer at once is deaf to it.

**Mechanism.** In `expireInbox`'s `party_demand` branch, after the
`v16Resent` call, stamp the session the reaction can reach:
`var a = v16Ai(st)[it.from]; if (a && a.provokedAt) a.provokedAt[playParty(st)] = st.turn + 1;`
This is CLAUDE.md's `st.turn + 1` rule read forwards: `expireInbox` runs before
`S.turn += 1`, so `st.turn` here is the session being left and `st.turn + 1` is
the session `v19React` will next stand in. One owner of the session number, and
the ordering asserted.

Reader: `v19React` (35906), which returns early at `!v19Thinks(st)`, so
`instinct` is untouched.

**Player sees.** "The FP did not wait for the season to take this up," in the
session after you ignore their letter. Today that line can only ever fire for
verbs the player presses on the Parties page.

**Assertion.** Post a `party_demand`, let it expire, drive one more session,
assert `a.react === st.turn` and that the party acted. Poison the `+1` and
assert the reaction never fires. Pins: the share of ignored letters answered in
the following session, measured, against the shipped 0.

**Cost.** ~10 lines. Risk: `a party does not wait for the season`'s
`lag.on.sameShare > .6` and its `1.4x` control both move upward, which is the
intent; both are re-measured distributions and both must be re-stated.

## I2. `oust` becomes adoptable

**Defect.** Three predicates on one goal read three different sets. `fits`
(34764) takes the maximum grudge against *any* party. `target` (34774) picks
the argmax-grudge party among all unbanned parties with no reference to
government. `done` (34783) is true when the target is out of government, and
`v19AdoptGoal` drops any candidate whose `done` is already true (34956). So
`oust` is adoptable only when the single most-hated party in the ledger happens
to be sitting in the government, and nothing selects for that. Measured over
3,618 non-ruling party-sessions: `fits` positive on 880, argmax in government
on 72 (8.2%), so `oust` is adoptable on 2.0% of boards. Held 0 times in 720
sessions at the top AI level.

**Mechanism.** One change to `target`: pick the worst grudge among
`[st.ruling].concat(st.coalition || [])`. `done` then becomes correct by
construction, because a target selected from the government cannot already be
out of it, so `v19AdoptGoal` stops dropping the candidate. And `fits` asks the
same question `target` answers: the maximum grudge *among government parties*,
so a party with 90 against a rival and 5 against the government no longer
passes `fits` and dies at `dead`.

Measured ceiling from goals.md: some government party is held at >= 25 on 157
of 3,618 non-ruling party-sessions (4.3%). That is the honest lift from this
change alone, and it is why I3 has to happen beside it.

**Player sees.** "Bringing down the LP" on the Parties page, held for a
campaign, where today it is never held at all. And, through N1, a party that
acts on it.

**Assertion.** `a party can reach what it is after` already asserts
`reach.neverAdopted.length === 0`. Add the rate: over 14 seeds, `oust` is
adopted above a measured floor. Poison the `target` filter and assert the rate
returns to the shipped near-zero.

**Cost.** ~20 lines. Gated by construction: `v19Goal` returns null at
`instinct` (34902), so no goal exists there. Risk: more adoptions of `oust`
dilute `carry`'s share, and `steer.carryOpen >= 40` in `a party can reach what
it is after` was already only 39 at six seeds. That arm's seed count goes up.

## I3. The grudge learns to point at governments

**Defect.** The only AI-to-AI grudge writer is the `attack` card (34419), and
`attack.can` refuses `pid === st.ruling` and refuses any coalition member that
is not restive. The government never attacks, so nobody accumulates a grudge
against it from that channel; attacks flow *toward* the government (the picker
at 34391 starts at `st.ruling`) and the memory flows away from it. Measured:
394 of 3,729 nonzero ledger entries (10.6%) point at a party in government,
while the government is 2 to 3 of 7 parties. And the complete list of
`v16Resent` callers contains nothing legislative and nothing electoral: you can
spend 130 sessions passing the exact statutes the PNL exists to prevent and it
will never hold one of them against you.

**Mechanism.** Four writers, each on an event that already exists, each gated
on `v19Thinks(st)` so `instinct` is untouched.

- A bill of theirs voted down: `failBill` resents the sponsor against
  `st.ruling`. 143 opposition bills archived per 300 sessions, 0 passed.
- A statute moved away from a party's `wants`: the same `move` emitter
  `v17DealEvent` already fires resents every party whose `wants` the move went
  against, scaled by the rungs. `PARTY[pid].wants` is already read by
  `partyDemandPolicy` (9927), `pv5TopWants` and `v19BillFor`.
- An office lost: `execContest` (11889) resents the loser against the winner,
  scaled by what the loser spent. There is currently no `v16Resent` anywhere in
  the exec chain.
- A freeze-out: `v17Install` resents the largest party outside the coalition
  against the formateur.

**Covered surface.** These four are not a whitelist. The assertion drives real
sessions and asserts that each of the four channels fired at least once and
that the share of nonzero ledger entries pointing at a government party rose
from the measured 10.6% toward the government's own 2-to-3-of-7 share. A later
slice that adds an event without a weight shows up as a channel that never
fired.

**Player sees.** The Parties page's three words ("Nothing on file" / "A
grievance on file" / "They have not forgotten") stop reading "Nothing on file"
seven times for a player who has governed for eighty sessions. Add the cause,
which `a.provokedAt` could carry at no cost: "A grievance on file, over the
Wealth Tax."

**Assertion.** Four poisons, one per writer, per the diff. Plus the aggregate:
the government-facing share of the ledger, measured over 14 seeds, with the
number in the assertion's own words.

**Cost.** ~70 lines. Risk: this is the highest-coupling item in Part 2. `a
party knows who is in its way` sub-arm (i) sets `V19_RIVAL_PUSH` against a
measured p90/p99 of the grudge distribution, and moving grudge magnitudes moves
both percentiles without touching rivalry at all. `a party does not wait for
the season`'s `bar.bar < bar.medianRise` and `bar.maxFall < bar.bar` are the
same shape. Both must be re-measured in the same run and re-stated. Also
`v16Posture`'s 35 bar and `V18_RESTIVE`'s 55 now sit in a different
distribution, which is what N5 is for.

## I4. Every card is priced, and one accessor answers

**Defect.** `V16_AI_COST` (34016) has eight entries. `article`, `order` and
`floor` cost 34, 22 and 12 through `V17_AI_COST_ARTICLE/ORDER/FLOOR`
(38189-38191) and are not in it. `v19Score` reads
`V16_AI_COST[card.id] || 0` (35293), so those three are scored as free and
never take the `-.22` "money it cannot spare" penalty. Measured: the mean purse
term is exactly 0.000 for all three at all four levels, against -0.115 for
`campaign`. A party that cannot afford a 34-cost article gets no
discouragement, while the same party is docked 0.22 for a 16-cost demand. This
is the one covered surface in the AI layer with no guard, and harness.md says
so explicitly.

**Mechanism.** `v16CardCost(id)` reads one table holding all eleven prices;
`V17_AI_COST_ARTICLE/ORDER/FLOOR` become aliases into it so their existing
`can` and `pay` sites are unchanged. `v19Score` reads the accessor. Add the
guard: a `roads.js` arm over `V16_AI_DECK` that fails when a card has no cost
entry, in the shape `V17_MEMORY`, `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS` and
`V20_AIM` already have.

`V18_TEMPO.broke`'s bar keeps its shipped value of 16, and its comment stops
claiming that 16 is "under the cheapest card in the deck" when `floor` costs
12. Changing that bar would move `instinct`, since the tempo is not
level-gated, so the comment is what gets fixed.

**Player sees.** A poor party stops reaching for the two dearest cards in the
deck. Visible as an engine that is consistent about money, where today it is
selective.

**Assertion.** The coverage arm, plus a direct reading: with a purse under
`2.2 * 34`, `v19Score` for `article` falls by exactly .22. Poison the accessor
and assert the term returns to 0 for the three.

**Cost.** ~30 lines. `v19Score` is not called at `instinct` (`v19Choose`
short-circuits at `sharp <= 0`), so the floor is untouched.

## I5. The rehearsal can see what a card did

**Defect.** `v19Standing` (35250) sums `v17Utility`, `v17Share * 60`,
`machine * 25`, a purse term, and flat bonuses for ruling, coalition and each
office. `v19Outcome` reads it as a difference before and after running the card
on a clone. Measured over 1,028 rehearsals at `ruthless`: for `article`, `bill`,
`campaign`, `demand`, `floor`, `pact` and `platform` (566 rows, 100% of each
card's own rows) the *only* moving component is the purse deduction. The
simulation prices seven of eleven cards at exactly minus their own price tag.
`v17Share * 60`, the ruling +18 and the office +9 moved on 0 of 1,028
rehearsals, so three tuned weights are read only inside a subtraction where
they always cancel. And the squash `clamp(d/12, -1, 1)` (35278) sits against a
measured `d` spanning -0.964 to +2.583, so the clamp is unreachable by a factor
of five and the divisor shrinks the only board-reading term into the smallest
term in the sum.

The consequence is the sharpest one in the intake: at `ruthless` the sim term
is -0.072 for a bill and +0.307 for `court`, so the simulator's net advice is
"court a bloc, never lay anything". And `court`, measured through
`supportTargets`, lowers the playing party's own projected share on 111 of 140
plays.

**Mechanism.** Four edits inside two functions.

- Replace `v17Share * 60` with `supportTargets(st)[pid] * 60`. That is the
  function the ballot itself reads (11600), and it reads `st.funding`,
  `st.machine`, `st.blocs`, `st.press` and `regionPartyFactor`, so `campaign`,
  `organise`, `attack` and `court` all move it within one ply. It also makes
  the rehearsal agree with the ballot about `court` instead of contradicting
  it, which is the whole of finding 3 in society-foreign.
- Add a term for things in flight, using functions that exist:
  `Σ over st.bills sponsored by pid of (billForecast(st, b).lower - v19Bar(st, b)) * .06`.
  `billForecast` (9240) and `v19Bar` (38435) are both already written and
  already called from the AI path.
- Add `st.aiPacts[pid] ? 2 : 0` and a term for the party's own pending
  constitutional amendment (`st.v11.con.pending`, written by `v17ArticleCore`
  at 38347). Those price `pact` and `article` at something other than their
  cost.
- Divide by the re-measured spread in place of 12, put the measured min and
  max in the comment, and set the clamp where the distribution actually ends.

**Runtime.** `v19Outcome` costs 0.97ms a card today and a party weighs about
five. `supportTargets` is a loop over 7 parties by 8 blocs; it must be
confirmed to draw no dice (`v19Try` already replaces `Math.random` and S19a's
`think.sim.untouched` asserts the clone's `rngState` is unmoved, so the
existing arm covers it). If the cost is material, cache one `supportTargets`
read per rehearsal, since `before` can be taken once for the
whole open set.

**Player sees.** Engine parties that legislate. Today the deliberation the two
top difficulty rungs are sold on votes against using the bill card that S19c
built for the `carry` goal.

**Assertion.** `a party is after something` already pins
`think.sim.distinct >= 7 of 11` and `orderSpread >= 6`; both should rise, and
the arm re-states them at the new measured values. Add the direct reading: the
sim term for `campaign` is positive on a board where funding matters, and
poisoning the `supportTargets` swap returns it to minus its own cost.

**Cost.** ~60 lines. Gated by `sim > 0`, which is 0 at `instinct` and at
`purposeful`, so both lower rungs are untouched. Risk: this is the item most
likely to move the card mix everywhere, and every rate in S19b, S19c, S19f and
S20g has an open-set denominator.

## I6. The government legislates like a government

**Defect.** `aiGovern` (13560) builds candidates from the ruling party's
`wants` and takes `cands[Math.floor(rand() * cands.length)]` (13573). It reads
no forecast, no chamber and no partner. The deck's `bill` card uses
`v19BillFor` (34284), which shortlists the five biggest gaps, runs each through
`billForecast` on a throwaway probe bill, and takes the one the chamber would
carry. So the government, the actor with the most seats and the only one whose
bill gets the +12, is the one that does not look. Measured: government bills
fail 68 of 97.

**Mechanism.** `var r = rand(); var pick = (v19Thinks(st) && v19BillFor(st, st.ruling)) || cands[Math.floor(r * cands.length)];`
The roll is drawn first and discarded when the picker answers, so the number of
dice off the stream is identical and no campaign re-phases. `v19Thinks` keeps
`instinct` byte-identical.

**Player sees.** An engine government whose programme carries. Today an
opposition party with 16% of the chamber legislates better than the cabinet.

**Assertion.** Drive with the override over 14 seeds; assert the government
bill pass rate rose above a measured floor and that the same seeds produce the
same number of `rand()` draws. Poison the picker and assert the rate returns.

**Cost.** ~10 lines.

---

# Part 3: new behaviours

## N1. A party can move the confidence question

**Absence.** `v17ConfidenceVote` (37740) counts the house correctly, reads
coalition cohesion, names defectors, and returns `carried`. It has exactly one
caller: line 12711, inside the player's own action card. `v17Refound` (37797)
has one caller, 12719, the same action. `callElection` (13439) refuses anyone
but `leads(S)`. So as head of a majority coalition the player is structurally
unremovable between ballots, and experience.md ranks this the single thing a
player would most notice missing.

**Mechanism, and why it needs no new card.** `demand` (34572) is already the
card by which a party puts something to the government. Its `can` refuses
`st.ruling`, its `post` list covers `hold`, `attack`, `moderate`, `partner` and
`restive`, and it already carries entries in `V16_AI_COST`, `V19_RIVAL_WORTH`,
`V19_TEMPER_AXIS` and every goal's `worth` table. Add one branch to its `run`:
when the party holds `oust` against the government (`v20Aim(st, pid, 'oust')`
names `st.ruling`, which I2 makes possible) and `v17ConfidenceVote(st).carried`
is true, it tables the motion instead of writing a letter.

The *paper* is a new type. `confidence_motion` gets its own entry in
`V18_PAPER_NEED` and its own three answers, because CLAUDE.md's rule is that a
borrowed paper type reaches into whatever the original pointed at, and
`party_demand`'s answers move the wrong things. The three answers are to buy a
defector off (capital, reading `v17ConfidenceVote().defectors`), to dissolve
first (`callElection`, which the player already has), or to face it.

When the player sits in opposition and an engine government falls, `v17Refound`
runs and the formation sheet raises, which is the surface that already exists.

**Player sees.** A named opposition party that has decided to bring the
government down, says so on the Parties page for a campaign, and then puts the
question with the tally printed before it is put. This is the plot the deck's
hostile half was authored for.

**Assertion.** Drive with the `runQueue` override over 14 seeds; assert at
least one motion tabled by an engine and at least one government change that is
not at a formation. Poison the caller and the `oust` target fix separately: the
first must take motions to zero, the second must take them to zero as well, and
neither may come back green. Pins: motions per 100 sessions, and government
changes between elections against the shipped 3 in 720.

**Cost.** ~90 lines. Draws no dice: `v17ConfidenceVote` is a pure count, and the
card's own `v19Choose` roll already covers the initiative. Risk: `the house
removes a government` (5781) gains a second caller and its `refound.sameTurn`
gate must hold for it.

## N2. An opponent makes you an offer, more than once

**Absence.** `seedOpeningInbox` (9951) puts two papers on the desk, and if the
player sits in opposition they are "Your Parliamentary Party Calls a Strategy
Conference" and "The Government Offers You a Committee Chair", the best "an
opponent is dealing with me" moment in the game. Both types are emitted from
exactly two `addInbox` calls, both inside `seedOpeningInbox` (9969, 9972), and
they never happen again. `coalition_review` and `senate_conference` are the
same: 12 raises each across 720 sessions, twice per campaign, both at the open.
The title, body, three choices and three outcomes are all authored (10076,
10176) and used once.

**Mechanism.** `politicsTick` emits them on real conditions, and the conditions
are facts the file already computes.

- `government_offer` when an engine government is short of a working majority
  (`govShare`, 10953) or when a party holding `enter` needs the player's seats
  (`v19GoalSeen`, 35011, which reads without adopting and rolls nothing).
- `opposition_conference` when the player is out of office and some party holds
  `oust` against the government.
- `coalition_review` on the ledger, beside C7's demand ladder.

Zero new paper types, zero new copy, one emitter and three predicates.

**Player sees.** Being addressed by an opponent for the first time since
session 1. experience.md ranks this second.

**Assertion.** Drive 120 sessions from the opposition chair; assert
`government_offer` is raised on a session after the first and that the
condition held when it was. Poison each predicate. Pins: raises per 100
sessions against the shipped 2 per campaign.

**Cost.** ~50 lines. Stream: emitting a paper does not roll, but reaching the
producer more often changes which sessions the `rand() < .35` governors roll
happens on, so this re-phases alongside C7. Same note applies.

## N3. The engine can press a bill home

**Absence.** `v20PressCore(st, actor, bill, scope)` (38277) moves
`bill.pull[pid]` by 14 on its own benches, 9 on other parties, at an escalating
price, and `billPull` (9165) counts it through that party's seats.
`v20PressWhy` already refuses correctly for a non-player actor by reading
`b.lines[actor]` (38262). It has exactly one caller (9828) which hard-codes
`playParty(S)`. Measured: `bill.pull` non-zero in 0 of 22,932 divisions.
Meanwhile the engine's entire chamber vocabulary is one `v17FloorCore`
declaration worth a mean of -1.9 aye share, once every four sessions, against
the player's measured 25.2 Assembly points for 16 capital.

**Why this one needs a card.** Every other item in this design reuses an
existing verb. This one cannot: `floor` refuses a bill the party has already
declared on (`v17FloorWhy`, 38201) and pressing requires an existing line, so
the two verbs are sequential. Sharing one card would
make `floor`'s target picker choose between two different questions.

**Mechanism.** A `press` card whose `can` requires a live bill carrying
`b.lines[pid]` and a purse above its cost, and whose `run` calls
`v20PressCore(st, pid, bill, scope)` with the scope chosen by where the party's
seats are. Cost from `V16_AI_COST` (I4 makes that one table). The five places a
twelfth card touches are enumerated in harness.md and all five get entries:
`V16_AI_COST`, `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS`, at least one `post` list,
and every goal's `worth` table. `roads.js` needs the deck literal moved from 11
to 12 in two places and a line in the `moved` chain at 4235.

**Player sees.** A bill of theirs being worked on by the other side between
stages, and a forecast that moves for a reason the bill card can name.

**Assertion.** `a position can be pressed home` (11228) already covers the
scopes; its `scopes.others.hasSponsor === false` exclusion must hold for an
engine actor too. Add: drive 14 seeds, assert `bill.pull` non-zero on a
measured share of divisions, and poison the card's `run`.

**Cost.** ~60 lines plus 5 harness edits. Risk: `the six that are not yours
act` gates on `six.deck === 11 && six.cardWorks === 11` as literals and its
`moved` chain returns false for an unknown card, which is the design working.

## N4. A partner votes against the government without leaving

**Absence.** `v17FloorCore` writes `b.lines[actor]` for any party and refuses
only the actor's own bill (38197). `v17ConfidenceVote` is the only place in the
file where a partner votes against the government as a coalition fact, at
`coh < 30` (37748), and it has one caller. There is no cost to a partner for
voting against a government bill, no consequence for the government, and no
verb by which a player in either chair can make it happen or answer it. The
`restive` posture, S18e's "the party that stays in the room and works against
you inside it", has fired 0 times in 4,320 party-sessions.

**Mechanism.** In `v16RedLineTick`'s session sweep, a coalition partner whose
cohesion is under its walk floor *and* whose arithmetic cannot survive leaving
(the remaining coalition would still hold a majority without it, so walking out
costs it office and gains it nothing) declares `oppose` on a live government
bill through `v17FloorCore`. Cost to the partner: cohesion falls further, and
`v17Ledger` records the defection. Cost to the government: the division, worth
C8's cohesion-scaled coalition term plus the -18 line.

**Player sees.** The coalition card says "voted against the government twice
this term". A bill of yours failing because your own partner sat on its hands,
which is what a coalition feels like and what this game has never once
produced.

**Assertion.** Hand-seat a coalition with one partner under its floor and a
government bill on the paper; drive one session; assert `b.lines[partner] ===
'oppose'` and that the division moved. Poison the arithmetic test and assert
the partner walks out instead, which is the shipped behaviour.

**Cost.** ~45 lines. Draws no dice.

## N5. `restive` and `consolidate` become states the board reaches

**Absence.** Two of the eight postures have never occurred. `restive` needs a
grudge of 55 against the head of government; measured partner-grudge-vs-ruling
runs median 0, p90 0, max 17 over 326 samples, because the only channel that
raises it is a breach worth 9 or 12 while the same breach costs 8 or 11 of
cohesion against a walk floor of 12 to 30. The partner leaves before the
grudge arrives. `consolidate` needs 22% of the chamber while out of government;
measured outsider share is median .092, p90 .149, max .259, and only 4 of 934
outsider samples cleared it. `consolidate` owns the largest card set in the
deck, nine of eleven, behind a door that opens 0.3% of the time. `V17_BURN`
carries rates for both (.52 and .82) that have never applied.

**Mechanism.** Widen the channel first, then set the bar from the measurement.
C5's lapsed promises and I3's new writers both raise a partner's grudge against
the head of government without costing cohesion, so the distribution moves
before the bar does. Then `V18_RESTIVE` is re-set from the *new* measured
distribution and the number goes in the assertion's own words, per CLAUDE.md's
rule that a threshold picked by eye is a mechanic that never fires. I am
deliberately not naming a value here: the honest sequence is widen, measure,
set.

`consolidate` asks a relative question instead of an absolute one: the largest
party outside the government. That is a fact the board always produces and it
is what the posture is about.

**Player sees.** Nine authored cards reachable, and a partner that stays in the
ministry and works against you. The Parties page's posture column stops
carrying two strings the game cannot produce.

**Assertion.** Drive 14 seeds; assert both postures occur above a measured
floor and that `V17_BURN`'s rates for them applied. Add the guard `V17_BURN`
lacks: its reader at 16371 is `rate === undefined ? .7 : rate`, so a new
posture silently gets the flat .7. A coverage arm over the eight posture
strings fixes that.

**Cost.** ~30 lines plus the measurement. Risk: `a party moves when it has a
reason to` pins `ai.restive.posture === 'restive'` on a board where the grudge
is hand-set to 100 every session, which is S17q's `st.unrest = 80` defect. That
arm should also assert reachability from unassisted play.

## N6. A ballot has consequences the engine reads

**Absence.** `runElection` (11903) calls no AI function after the count.
`driftParties` (11970) walks every loser toward the winner at up to 20% and is
never stated in words anywhere. Three continuous terms notice that seats moved
and nothing notices that a ballot happened: `v16Posture`'s `trend < 0` reads
`ai.lastSeats`, rewritten every session (35532), so `moderate` is a
one-session flash after a ballot (measured 113 of 113 co-incident with a
same-session seat fall); `V18_TEMPO.losing` is the same field; and
`driftParties` is silent. A landslide and a hung chamber produce the same
engine behaviour on the next session.

**Mechanism.** `v21AfterBallot(st, before, after)`, called from `runElection`
after `v17Form`, gated on `v19Thinks`, drawing no dice.

- The party that lost the most share resents the party that gained the most
  (`v16Resent`, existing).
- The party that lost its place in government resents whoever took it. It does
  not force a goal adoption, because `v19AdoptGoal` rolls; the grudge is
  written and `oust` picks it up at the party's next initiative, which is the
  stream-safe shape.
- `ai.seatsAtLastBallot` is written beside `lastSeats`. `v16Posture`'s
  `moderate` reads the ballot delta, because a defeat is a fact about a term.
  `V18_TEMPO.losing` keeps the session delta, which is what its own comment
  says it wants.
- One log line and one news item stating what `driftParties` did: "Three
  parties moved toward the government's ground after the count."

**Readers named.** `ai.seatsAtLastBallot` by `v16Posture` (34119) only, and
that is the point: `lastSeats` keeps its two readers and the new field has one.

**Player sees.** Losing an election means something to the parties that lost
it, and winning one is noticed. Today neither is.

**Assertion.** Drive with the override; assert the biggest loser's grudge
against the biggest winner rose at the count, and that `moderate` now persists
across the sessions between ballots, where today it lasts one. Poison each of
the four
arms.

**Cost.** ~60 lines.

## N7. A party remembers being helped

**Absence.** `v16Resent` clamps at 0 (34076), so a kindness to a party that
holds no grudge writes literally nothing. Measured: 42% of party-sessions sit
at grudge 0 against the player and 94% of AI-to-AI pairs do, so for all of
those every helpful thing the player can do is worth exactly nothing to the
model. `V17_MEMORY` carries twelve negative weights (`joinCoalition: -20`,
`fund: -14`, `tradeMinistry: -14`) and the comment above them claims "it works
the other way". It does not. A party you have funded, invited and given a
ministry to is byte-identical to one you have never met. Greps for gratitude,
favour, goodwill, trust and ally over the whole file return prose only.

**Mechanism.** One clamp: `clamp(..., v19Thinks(st) ? -60 : 0, 100)`. The gate
keeps `instinct` byte-identical, and it reads correctly as a competence: a
party acting on instinct does not keep a favour on the books.

Every existing reader gets the positive half free, which is why this is the
strongest single line in the design.

- `v17Accept`'s `- grudge * .32` (37459): a habitual partner is cheap to seat.
- `v17Build`'s pool sort `dist2 + grudge/220` (37506): a trusted party sorts
  first, so formations follow history.
- `partyBillSupport`'s grudge term (9073), capped at 12: becomes +/-12, so a
  party that owes you backs your bills.
- `v16PactPartner`'s `>= 20` refusal (34610): unchanged, negatives cannot trip
  it. Same for `v16Posture`'s 35 (34138), `v18Restive`'s 55, `v18Tempo`'s 35,
  `oust.fits`'s 25 and `oust.dead`'s 8.
- `v16AiPanel`'s three words (36168) gain a fourth: "They owe you one."

The `demand` card gains one refusal: a party does not write a demand letter to
somebody it owes.

**Player sees.** Alliance-building becomes a currency. Today it is a set of
buttons with no memory. The Parties page says who owes you.

**Assertion.** Fund a party at grudge 0; assert the reading is negative,
`v17Accept`'s value rose, and its `partyBillSupport` contribution rose. Poison
the clamp, and separately poison the `v17Accept` read, and then both together,
since a floor with no reader and a reader with no floor both look like a dead
guard.

**Cost.** ~25 lines plus the panel. Risk, named plainly: `a party remembers
what was done to it` (6697) asserts `fires.afterKindness === 0`, using poach
(+12) then fund (-14) and requiring the result to be 0. With a floor at -60 the
result is -2. **That assertion has to change**, and it is the assertion that
encodes the defect. It should become: a kindness to a party at 0 leaves a
negative reading, and a kindness to a party at 12 spends the grudge and leaves
a credit. Also `a party knows who is in its way` sub-arm (i) reads percentiles
of the grudge distribution; if negatives enter that sample the percentiles
move, so the probe must be re-stated to take percentiles of the rises it is
actually about.

## N8. A party can declare another party untouchable

**Absence.** `st.cordon` is written only by the player's `cordon` and
`liftCordon` verbs (12976, 12983) and read by `v17Eligible` (37409), which
removes a cordoned party from the rotation entirely, plus `partyBillSupport`
(9033), the AI bill score (31388) and `v6CoalitionCandidates` (19418). Measured
0 sessions with a cordon across 720. The cordon is the game's one statement
about a party being beyond the pale, and no engine party can ever make it.

**Mechanism.** Inside the `attack` card's `run` (34391), a party holding `oust`
whose grudge against the target is past a bar declares a cordon in place of
moving the target's machine by .036. And `v17Eligible` takes a formateur:
`v17Eligible(st, lead)` removes parties cordoned *by that formateur* from that
formateur's pool, leaving them eligible for everybody else's. That
single change makes formation depend on politics between the other six parties,
which today it never does, and it is the political reason rounds two through
four of the rotation become reachable.

**Player sees.** The Parties page and the formation sheet say who will not sit
with whom, and why. A player in opposition watching the government's partners
refuse each other is watching the board have its own politics.

**Assertion.** Hand-seat a board with one engine cordon and assert the
formateur's pool excludes the cordoned party while another formateur's does
not. `form.pure.noDice` must still hold, which it does: the declaration happens
inside a card that has already drawn its roll, and `v17Eligible` is a filter.
Poison the per-formateur read and assert the shipped whole-rotation behaviour
returns.

**Cost.** ~40 lines. Risk: `v17Eligible`'s signature is read by `v17ByWeight`
and `v17Rotation`; both are pure and both are covered by `form.pure.same`.

## N9. An order goes where it is aimed

**Absence.** `v17AiOrderFor` (38403) walks `V10_ORDERS` in declaration order,
takes the first open one (`if (best) return;`), and returns
`target: o.target ? REGIONS[0].id : null`, a region id for *every* targeted
order, including the eleven whose `target` is `'power'`. `v10OrderOpen` (28701)
never validates the target against `o.target`, so it is accepted.
`v10OrderMods` then writes `m.powers['somnium']`, a key no power reads, so the
order's diplomatic half is silently dropped, and `v10OrderTitle` falls through
every branch to print the raw lower-case id. Measured: 232 order fires across
720 sessions, 17 distinct orders, all 39 regional ones aimed at `REGIONS[0]`,
and 13 of 82 power-targeted orders reading "The Maritime Exclusion Zone
(somnium)" in the Gazette.

**Mechanism.** Three edits. `v17AiOrderFor` picks a target of the right domain
(`o.target === 'power'` draws from `POWERS`, `'work'` from `V8_WORK`,
otherwise a region), picks *which* by the party's `wants` and `aff` in place of
index 0, and scores the open orders instead of short-circuiting on the first. Then `v10OrderOpen` refuses a target outside the order's own domain, so
one gate covers the AI path and the player's click both, which is the "one predicate,
both chairs" rule, applied where S17k's own comment claims it already is.

**Player sees.** The Gazette stops printing a lower-case database id in
parentheses, and a party holding a great office does something with it that
follows from what the party wants.

**Assertion.** Drive 14 seeds; assert no signed order carries a target outside
its own domain, from either chair, and that the regional orders reach more than
one region. Poison the domain check and assert `somnium` returns to the power
orders. Pins: distinct regions reached, and 0 domain violations.

**Cost.** ~50 lines. Draws no dice if the scoring is deterministic, which it
should be.

## N10. Courting a bloc is a relationship

**Absence, and the largest single measured defect in the intake.** `court` is
27.3% of everything the engine does, 280 of 1,025 real initiatives at 36 a
play. It writes `st.blocs[best] += 2.6` (34359), a shared *national* number.
`supportTargets` reads that number twice with opposite signs: the bloc's
`weight` rises for everybody (11496), but `appeal` is `.915 + (m-50)/80` for
the ruling party, `.86 + (m-50)/108` for a partner and `.784 - (m-50)/130` for
everybody else (11509), and the extremism term `1 + ext * max(0, 60-m)/60 *
2.4` (11513) also shrinks as mood rises. Measured through the game's own path:
111 of 140 plays lowered the playing party's own projected share, mean -1.08%
in opposition. A quarter of the engine's output is a small gift to the
incumbent.

Two models disagree about one number. `v17Utility` (13715) says a contented
bloc is good for me; `supportTargets` says a contented bloc is good for whoever
governs. `v19Outcome` reads the first, which is why the two sharpest AI levels
pick the card *more*.

And at the measured mean bloc mood of 66.3, `max(0, 60 - m)` is zero, so the
extremism term never fires in play at all.

**Mechanism, and the one new field in this design.** `affOf(st, id, bid)` (812)
is the per-party, per-bloc number that `supportTargets` multiplies by, and it
is read by `v17Utility` (13715), `blocTarget` (11101), `v9PublicSupport`
(24041) and `v11InfluenceTarget` (32995). It has no channel anybody can move:
it is the authored `aff` table blended with compass distance, and nothing else.

Add `st.blocTie[pid][bloc]`, one map, written by `court` (+.03) and decayed
toward 0 at the same 1.5% a session the machine decays (11345), read by
`affOf`. Above `instinct` the card writes the tie; at `instinct` it writes
`st.blocs` exactly as it shipped, so the floor holds.

That is one new field with five existing readers, and it makes the two models
agree: the party's own objective and the ballot now read the same per-party
number.

`ground.target`'s `+14` (34807) then reads the tie in place of the national
mood. goals.md's arithmetic is decisive here: at the measured play rate the
steady-state lift on `st.blocs` is +3.0 against a requirement of +14, and even
at one court card every single session it is +8.7. The aim has been
unreachable by construction; reading a channel the card owns makes it a number
the party owns.

**Save.** `st.blocTie` is backfilled by `enrichState` (8578) as an empty map,
which reads as the shipped behaviour.

**Player sees.** The bloc panel says which party each bloc leans toward and
why. Courting a bloc becomes visible as a relationship the player can contest
where today it is a number that goes up for everybody.

**Assertion.** deck.md names the shape: read `supportTargets(st)[pid]` either
side of the card, never `st.blocs`. Assert the sign is positive for an
opposition party over 14 seeds, against the shipped measured -1.08%. Poison the
`affOf` read and assert the sign returns to negative. Separately assert
`ground` completion rose, and poison the target change.

**Cost.** ~60 lines. Risk: `affOf` is read by the ballot, so this is a balance
change and the pacing arc must be re-swept over six seeds. The extremism term's
re-centring (60 against a measured mood of 66.3) is the owner's to rule on and
I am flagging it and proposing no number.

## N11. An aim finishes, and something happens

**Absence.** `v19Goal` writes `a.lastGoal` and nulls `a.goal` at 34932, then
immediately calls `v19AdoptGoal` in the same call. Measured: 33 of 33
completions were replaced in the same call. There is no pause, no reward, no
state change, no log line and no chronicle entry. `a.lastGoal` has exactly one
reader in three megabytes, `v16AiPanel` at 36153, which prints it for six
sessions and then it is invisible. And `v19AdoptGoal` is a fresh weighted draw
with the previous kind unread: measured adoption sequences show no structure at
all (`build → office` 4, `office → build` 8, `ground → carry` 12,
`carry → ground` 10). The seven kinds are the natural rungs of one plan and the
model cannot express the plan.

**Mechanism.** Two halves.

A reached aim pays something the model reads. `st.ai[pid].wins` counts them and
`v19Score` reads it as a small confidence term. Per kind, through existing
channels: `office` reached resents every party that named the same office
(`v19Rivalry` already computes that comparison at 35127 and has nowhere to send
it); `carry` reached raises `partyRel` and writes news; `build` reached sets a
machine floor. Plus a chronicle entry, so the player sees an opponent finish
something.

And `v19AdoptGoal` reads `a.lastGoal.kind` to weight the successor, so the
rungs connect: `build → office`, `ground → carry`, `enter → office`,
`office → oust`. That is a weighting on an existing draw, not a new slot, so
the roll count is unchanged.

Two small deletions ride along, both named in goals.md: `V19_GOAL_STALE`
(34900) is declared and read by nothing, and `k.short` (36155) is read and
written by nothing, with a seven-way fallback chain behind it that is the same
stale-list defect `v7DefaultCollapsed` was fixed for.

**Player sees.** "The TVC took the Chancellorship they have been after for
thirty sessions" in the log and the chronicle, and a party whose next aim
follows from the one it just reached.

**Assertion.** Drive 14 seeds; assert `a.wins` rises, that a completion
produces a log line and a chronicle entry, and that successor kinds are no
longer uniform against the shipped measured sequence counts. Poison the
successor weighting and assert uniformity returns.

**Cost.** ~70 lines. Risk: `a party votes its own manifesto`'s clock legs read
`V19_GOAL_IDLE`, `V19_GOAL_CAP` and the `g.best > 0` stall predicate, none of
which this touches.

---

# Part 4: measurement, and what it costs

## The three rules I am binding this design to

**Fourteen seeds for any effect size.** S20f measured two published effect
sizes failing when the sample widened from 8 seeds to 14 on a byte-identical
build. Every number this design publishes comes from at least 14 seeds, and the
sample goes in the assertion's own words.

**The `runQueue` override for anything downstream of the queue.** Of the nine
existing AI arms, only `the verb reads the aim` overrides it; every other AI
arm drives a republic that never holds an election. Every assertion in Parts 1
and 3 about a government being threatened, a coalition changing, an engine
entering office or anything a ballot produces uses the override. Three S20g
probes that did not reported one election in 720 sessions.

**`V19_SIMULATING` on any instrument that wraps a card's `run`.** The baseline's
first draft reported 4,941 initiatives where the truth is 1,025 played and
3,916 rehearsed, and drew the opposite conclusion from the wrong numbers.

## New arms, and what each pins

Ten arms, each with its poison named. The arms are ordered by what they would
catch.

- **The house can refuse a government.** Drives real ballots with the override
  and asserts the *distribution* of `st.formation.how`, with `majority` under a
  measured share. This is the arm that would have caught 360 of 360, and the
  one coalition.md explicitly asks for.
- **The agreement is a clock.** A promise past its date is broken, once, on the
  right session. Poison the `due` write and the sweep arm separately and
  together.
- **A promise can be kept.** `v17Kept` above a measured floor over 14 seeds;
  poison the per-rung credit and the small-gap draw separately.
- **A party remembers being helped.** Poison the clamp and the `v17Accept`
  read separately and together.
- **A government can fall between elections.** At least one engine-tabled
  motion and one non-formation government change; poison the caller and the
  `oust` target fix separately.
- **The letter is answered.** An ignored `party_demand` answered in the
  following session; poison the `+1`.
- **Every card is priced.** Covered surface over `V16_AI_DECK`, the guard
  harness.md names as missing.
- **Courting is a relationship.** Read through `supportTargets`, not
  `st.blocs`; assert the sign for an opposition party.
- **The government legislates like a government.** Pass rate, and the same
  seeds producing the same number of dice.
- **An order goes where it is aimed.** Zero domain violations from either
  chair.

Plus a coverage arm over the eight posture strings, since `V17_BURN`'s reader
at 16371 silently gives an unknown posture the flat .7.

## Existing arms this design moves

Six that must be re-driven and re-stated, and two that must change.

`a plurality is not a government` and `a caretaker holds office and does not
govern` exercise the minority and caretaker branches on hand-built boards, and
C1, C2 and C3 all move those boards. `form.pure.noDice` still holds; nothing in
Part 1 rolls.

`a party knows who is in its way` sub-arm (i) sets `V19_RIVAL_PUSH` against a
measured p90/p99 of the grudge distribution, and `a party does not wait for the
season`'s `bar.bar < bar.medianRise` is the same shape. I3 and N7 both move
grudge magnitudes, so both must be re-measured in the same run. N7 in
particular requires the percentile probe to take percentiles of *rises*, since
negative writes are falls.

`a party is after something` pins `think.sim.distinct >= 7 of 11` and
`orderSpread >= 6`; I5 should raise both and the arm re-states them.

`a party can reach what it is after`'s `steer.carryOpen >= 40` was already only
39 at six seeds, and I2 dilutes `carry`'s share by making `oust` adoptable.
That arm's seed count goes up.

Two must change, and both are assertions that encode a defect.

`a party remembers what was done to it` asserts `fires.afterKindness === 0`.
That is exactly N7's defect written down as a requirement, and it becomes: a
kindness to a party at 0 leaves a credit, and a kindness to a party at 12
spends the grudge and leaves a credit.

`live up to it, alter it, betray it` pins `kept.count === 1 && kept.twice === 1`
against a credit that fires on exact arrival. C6 pays per rung, so the arm
asserts the progressive shape instead.

## What this costs

About 1,500 lines of change across roughly thirty edit sites, plus ten new
harness arms at 2 to 4 minutes of wall clock apiece on the S19 pattern. The
harness is 16m40s today; ten new arms on the cheap pattern (hand-seated boards
plus one driven arm with the override, which is what S17f and S20a use) adds
perhaps 8 minutes. Two driven 14-seed A/Bs would add 8 more on their own, so
the arms that need 14 seeds are the effect-size ones and the rest hand-seat.

Two things re-phase every seeded campaign: C7's coalition slot and N2's
emitter, both because they change which sessions reach the `rand()` calls in
`politicsTick`. Everything else either draws no dice or draws the same number
of dice (I6 rolls first and discards). Every pacing figure must be re-swept
over six seeds afterwards, and per CLAUDE.md a before/after gap smaller than
one build's seed-to-seed spread is a reshuffle and not a result.

One new state field in the whole design: `st.blocTie` (N10), backfilled empty
by `enrichState`. `ai.seatsAtLastBallot` (N6) and `ai.wins` (N11) are two
fields on an object that already rides the save. Everything else writes
channels that exist.

---

# Part 5: what I did not propose, and why

**A two-ply rehearsal.** choosing.md costs it at 0.97ms times the number of
rivals per candidate card, and it is the natural next step for `ruthless` once
`shrewd -> ruthless` needs a behaviour and has three numbers. I left it out
because I5 has to land first: a second ply of a rehearsal that prices seven of
eleven cards at minus their own cost buys a more precise reading of the wrong
number. Do I5 in S21 and the two-ply in S22, when there is something worth
looking two moves at.

**A party-to-party relationship matrix.** legislative.md and coalition.md both
ask for one, and it is the right long answer. I proposed N7 instead, which is
one clamp: `v16Resent`'s grudge already *is* a party-to-party matrix, written
by eleven call sites and read by twelve, and the only thing wrong with it is
that it cannot go below zero. A parallel `v21Trust` matrix would be a second
mechanism computing the same fact, which is the defect this file punishes
hardest, and it would need its own writers, its own decay and its own coverage
guard while the existing one already has all three.

**A foreign-policy card.** society-foreign is right that no engine has any
position on eleven capitals, twenty instruments, a sanctions regime and an
alliance roster, and that the whole Foreign Office freezes when the player sits
in opposition. A twelfth card costs five edits in `roads.js` and five in
`vale.html`, and I have spent that budget on `press` (N3), where the Core
already takes an actor and 0 of 22,932 divisions have ever carried a `pull`.
N9 buys the visible half of the foreign problem (orders that reach the right
domain and the right target) for a fifth of the cost. The `envoy` card is the
first item of the next slice.

**Raising `V16_AI_CADENCE`.** experience.md makes the strongest single argument
in the intake for it: six parties share 1.5 initiatives a session, 18.5% of
sessions have no engine action at all, and every improvement below is
multiplied by how often the engine gets to use it. I left it alone because
`V16_AI_CADENCE`'s own comment records it as the owner's dial, swept rather
than chosen, and records that six parties acting every session took the harness
from 5.5 elections won to 1.2. It is a difficulty change and it belongs to the
owner, not to a design document. What I would put to them: after this slice
lands, sweep it again, because the reason a busier engine cost four elections
in five was that its output was `court` and `organise`, and this design changes
what the extra sessions would be spent on.

**Fixing `v18TempoOdds`' normalisation.** posture-tempo.md measures the exploit
precisely: a multiplier applied to everybody cancels, so provoking the whole
board changes nothing and provoking one party measurably quietens the other
five. The fix is to let the board's level move the budget as well as its shape. I left it out because `ai.budgetHeld` holds `Σ v18TempoOdds` to within
1e-6 of `live / V16_AI_CADENCE`, which is the tightest tolerance in the
harness, and because the budget is the same owner's dial as the cadence.
Same recommendation: put it to the owner with the measurement, in one
paragraph, and let them rule.
