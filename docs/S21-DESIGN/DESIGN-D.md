# S21 design D: the government has to be able to fall

## The position

The owner named the real problem. Coalition building is flat, and fixing it
properly is what drags the rest of the AI up with it, because a government
that can fall gives every other engine behaviour something to be for.

Read the baseline as one sentence and it says this. `oust` was held zero times
in 720 sessions, so no engine has ever wanted to bring a government down. No
card in the eleven-card deck touches `st.coalition`, `st.confidence` or
`st.coalitionDeals`, so no engine could act on the wish if it had it.
`v17ConfidenceVote` and `v17Refound` have one caller each and it is the
player's own button, so the house cannot remove anybody. Three coalition
changes between elections in 720 sessions. A majority government is
unremovable between ballots, and 360 of 360 formations produced a majority.

Every other measured weakness sits downstream of that. Postures are 39.2%
`hold` because there is nothing to be angry about that anyone can act on.
`restive` has fired zero times in 4,320 party-sessions because the only way a
partner's grudge rises is a breach, and a breach costs cohesion faster than it
costs patience, so the partner walks out before it ever becomes an enemy inside
the ministry. Goals are 86% abandoned because the two aims that point at a
government (`oust`, `enter`) have no instrument. The rehearsal at the top two
AI levels advises "court a bloc, never lay anything" because `v19Standing` has
no term for anything the party is trying to hold on to. There is no gratitude
field anywhere in 3.7 MB because nothing in the game has ever needed a party to
remember being helped, and nothing has needed it because there was never a
coalition worth being helped into.

So this proposal spends its weight on the coalition and then shows the rest
falling out of it. Eleven coalition items, eight downstream items, nineteen in
total: eleven improvements to machinery that already exists and eight new
behaviours. The brief asks for four and eight.

One rule runs through all of it, and it is the brief's own warning. The
coalition machinery is far richer than its measured behaviour. A formation
rotation with four branches, offers carrying portfolios and concessions and red
lines, an investiture vote with an abstention rule, a written agreement, a
ledger, a cohesion meter, five management verbs, a walkout, a renegotiation and
a confidence count all exist and are inert. Almost nothing below is a new
mechanism. Almost everything below is an existing mechanism given a reader, a
price, a date or a caller.

---

## The shape, on one page

| # | item | kind | the measured absence it answers |
|---|---|---|---|
| C1 | The formateur's mandate can run out | improvement | 354 of 360 formations settle in round one; `V17_FORM_MAX = 7` against 7 parties |
| C2 | The offer is priced by what is in it | improvement | `concessions.length` is always 3, so the term is a constant +15; `redLines` is not in the value |
| C3 | A named department at the table | new | `offer.offices` is a boolean worth +9 that `v17Install` never copies |
| C4 | The agreement falls due | improvement | every `due` is `null`; 40 ledger entries in 720 sessions, all `broken`, zero `kept` |
| C5 | Ask, insist, threaten, move | new | 2 `coalition_demand` and 1 `confidence_threat` in 720 sessions |
| C6 | Cohesion reaches the floor of the house | improvement | a partner and an opposition party differ by -0.5 to +3.8 on any bill the government did not lay |
| C7 | Confidence and supply as a live state | new | 0 sessions with confidence and supply in 720; `st.confidence` is never cleared |
| C8 | Kingmakers | new | nothing anywhere computes whether a party is necessary to a majority |
| C9 | The deck gets coalition verbs | new | no card writes `st.coalition`, `st.confidence` or `st.coalitionDeals` |
| C10 | A government that can fall | new | `v17ConfidenceVote` and `v17Refound` have one caller each, the player's button |
| C11 | The junior partner's game | new | a junior player's only coalition decision is to end the game they are playing |
| R1 | `oust` becomes the engine's plot | improvement | held 0 times in 720 sessions at `ruthless` |
| R2 | A party remembers being governed against | new | 11 `v16Resent` sites, none legislative or electoral |
| R3 | One regard, signed, read where the player's scalar is read | new | no gratitude field exists; `st.partyRel` is the player's only |
| R4 | The objective can see what it is holding | improvement | 7 of 11 cards price at exactly minus their own cost |
| R5 | `court` stops paying the government | improvement | 111 of 140 plays lower the playing party's own share |
| R6 | Posture is a state with tenure | improvement | `restive` 0 of 4,320; the printed posture is wrong 30.5% of the time |
| R7 | The tempo budget is not zero-sum | improvement | provoking one party quietens the other five |
| R8 | The ballot has consequences | new | no `v16Resent`, no goal change and no leader change at a count |

---

# Part I. The coalition

## C1. The formateur's mandate can run out (IMPROVEMENT)

**Defect.** `v17Rotation`'s first loop is `for (i = 0; i < order.length && i <
V17_FORM_MAX; i++)` at 37586, `V17_FORM_MAX` is 7 at 37381, and `PARTIES` holds
7 entries. Every party in the chamber gets a full majority attempt, and
`v17Build` at 37502 walks the entire pool asking everyone. For round two to be
reached, all seven bridgeable neighbourhoods would have to fall short at once.
That is why 360 of 360 outcomes were `majority` and 354 settled in round one,
and it is why the minority branch (the most interesting code in the file) has
never run.

**Mechanism.** A mandate is a scarce thing and running out of them is how
formation gets hard. Three changes, all dice-free:

- `V17_FORM_MAX` drops to 3. The country gives out three mandates before it
  gives up on a majority, which is what the constant was always for and what
  `coalition.md` line 222 says it should be.
- `v17Build` gains an invitation budget, `V21_INVITES = 3`. A formateur makes
  at most three offers, and a party that refuses is out of that formateur's
  pool. A formateur can therefore fail with a willing partner still sitting in
  the chamber, which is exactly what happens in real formations and never
  happens here.
- The rotation gains a second pass over the same three formateurs at a raised
  price. `relax` rises by `V21_CONCEDE` per burned mandate, and the offer's
  generosity (C2) rises with it. Round four is the same RSF asking the same SD
  again, having conceded the Wealth Tax it would not concede in round one.

`v17Rotation` gains `kind:'remandate'` rounds in `st.formation.rounds`, which
`v17RoundLine` at 19444 already renders.

**Seen.** The formation sheet already prints every round. It now prints a
formateur burning its invitations and handing on, and it prints the same party
coming back with more on the table. The sheet says the same thing 65 times out
of 66 today; this is what makes it say something different.

**Measured.** A new driven arm with the `runQueue` override, 14 seeds, asserting
the distribution of `st.formation.how` across real ballots. The harness today
proves each branch on a board hand-built to reach it, so it is green over code
that has never run in a campaign. Most real formations do produce a majority,
so the target is a measured share with minority, grand and caretaker all
non-zero, and the number goes into the assertion's own words after the sweep.
This is `coalition.md`'s own upgrade at line 209, and it is CLAUDE.md's S17q
rule asked of a distribution.

**Costs.** About 60 lines. `form.pure.noDice` at `roads.js` 5599 bans any
`rand()` in the rotation, and nothing here rolls. The hand-seated boards in `a
plurality is not a government` will move and have to be re-derived; the
minority board in particular is built to reach a branch that is now reachable
from an ordinary chamber. No stream cost.

## C2. The offer is priced by what is in it (IMPROVEMENT)

**Defect.** `v17Offer` at 37430 takes `pv5TopWants(pid, st, 4)`, makes two
`adopt` records from `wants.slice(0, 2)`, appends one `refrain`, and sets
`redLines: [wants[2].id]`. Every offer in the game carries exactly 3.00
concessions and exactly 1.00 red lines. `v17Accept`'s value line reads
`(offer.concessions || []).length * 5`, a constant +15, and never reads
`offer.redLines` at all. Which statutes are on the table changes nothing about
whether a party sits down.

**Mechanism.** `v17Offer(st, lead, pid, co, generosity)` where `generosity` runs
0 to 2 and decides how many wants become concessions, whether the formateur
accepts the invitee's red line, and whether a department is named (C3). The
value in `v17Accept` becomes:

- concessions worth `Σ w.gap * V21_CONCESSION`, where `gap` is the number
  `pv5TopWants` at 16020 already computes and sorts by;
- red lines accepted worth `V21_REDLINE` each to the invitee;
- the formateur's own cost read through `v17Friction(st, lead, pid)` at 35625,
  which already returns the statutes where the two disagree, ranked.

`v17Build` opens at generosity 0 and raises it on a re-mandate. A cheap offer
that fails and an expensive one that succeeds are now different offers, so
"retried on different terms" is a thing the code can express.

**Seen.** The formation sheet's candidate rows expand into what is actually on
the table: the two statutes the government would carry, the one it would leave
alone, the red line it accepts, the department. The player as formateur can
raise or lower it and watch `value` and `reservation` recompute live, because
`v17Accept` is pure and already takes an arbitrary offer object. Today the
sheet builds a real offer at 19419 and throws it away, showing only two
numbers.

**Measured.** Two arms. First, over 14 seeds the concession count is no longer
constant (`distinct >= 3`) and the red-line count varies. Second, and this is
the arm that survives poisoning: build two offers differing only in one
concession, run `v17Accept` on both, and assert the answers differ by the
concession's own worth. Comparing the offer against a value derived from it
proves nothing, which is S17e's mirror-check defect; the arm has to change the
input and re-run the producer.

**Costs.** About 80 lines across `v17Offer`, `v17Accept` and `v17Build`. Every
gate in `a plurality is not a government` reads `v17Accept`, so the hand-built
boards move together with C1. No dice, no stream cost.

## C3. A named department at the table, and taking it back is a breach (NEW)

**Defect.** `v17Offer` returns `offices: share >= .22 ? 1 : 0` at 37445, worth
+9 in the value at 37462. `v17Install` at 37641 copies portfolios, concessions,
red lines and confidence, and does not copy `offices`. A party is bought for
nine points with a great office and handed nothing. `terms.portfolios` is
written in three places (16097, 35749, 37647) and read in none, which is
`st.court.size` wearing a coalition hat. Separately,
`pv5CoalitionAction('portfolio')` at 16752 spends 4 capital before it checks
whether there is an office to trade, and renders with no `disabled` and no
`title`.

**Mechanism.** The offer names a department. `v17Offer` returns
`offices: [deptId]` picked from the departments the formateur's side holds,
ranked by whether the invitee's `office` goal names it (`v20Aim(pid, 'office')`
at 34276 answers this and costs no dice) and then by the invitee's share.
`v17Install` writes `st.exec[dept] = pid` and `d.terms.offices = [dept]`, and
`execSeat` already exists for the seating.

Taking it back is then a breach. `v17DealEvent` gains an `office` kind, and a
government that reassigns a promised department through
`pv5CoalitionAction('portfolio')` books a `broken` entry through the scanner
that already exists. `execContest` taking it on its own eight-year cycle is not
a breach, because nobody promised to win an election.

`terms.portfolios` is deleted. `d.portfolios` (the counter
`pv5CoalitionTick` reads at 16312) becomes the field the offer writes, so the
negotiated number is the number the satisfaction tick reads. One field, one
reader.

And the button gets fixed: compute `off` first, disable with a title when there
is none, spend last.

**Seen.** "The SD were promised the Chancellery" on the deal card, in the
formation log line, and in the breach news when it is taken away. The
Government page's minister cards already name the party in each office.

**Measured.** After a driven formation with two or more parties,
`st.exec[d.terms.offices[0]] === pid` for every partner promised one; pin the
share of multi-party formations that seat at least one promised department.
Reassigning it books exactly one `broken` entry, and the poison that deletes
the `office` arm of `v17DealEvent` takes that to zero. The disabled-button half
is already covered by `no control lies, in any chair` at `roads.js` 8339.

**Costs.** About 50 lines. `the coalition in writing` at 5442 reads
`d.terms.offices` for display and will see real values. No stream cost.

## C4. The agreement falls due (IMPROVEMENT)

This is the load-bearing item. Everything from C5 onward reads what it writes.

**Defect.** Every producer of a concession writes `due: null` (37438, 37442,
37536, 16100, 16104) and nothing in 3.7 MB reads a concession's `due`. The
government can promise two statutes and never lay them, forever, at no cost. On
the other side, `V17_KEPT` has never been awarded: the credit fires only when
`v17Off(st, pid, ref) <= 0.001`, meaning the statute lands exactly on the
party's want, and the concessions are drawn from the party's two largest
gaps by construction. 40 ledger entries in 720 sessions, all `broken`. The
agreement is a device that can only record disappointment.

**Mechanism.** Three changes, and one of them decides the shape of the rest.

**A date, sized by the instrument the answer has to use.** Meeting a promise
takes a bill: laying is one session, the floor is a second, and since S15d the
statute does not move until an office signs, which is a third. `aiGovern` at
13558 lays one bill every other session. So `V21_DUE = 8`, and the constant
carries that arithmetic in its own comment, so the next reader cannot re-pick
it by eye. This is CLAUDE.md's "the instrument the answer has to use decides
the deadline", and the street's `V17_STREET_DEADLINE` is the model.

**One clock owns the outcome.** `v21DealClock(st)` runs inside the existing
`v16RedLineTick` sweep, which is already in the `tickTurn` wrapper at 35922, and
it is the only thing that books an overdue breach. The paper (C5) reports
the clock and never decides it. Two mechanisms holding the same date is how the
street's demand was resolved by the inbox before the street ever read the
statute book, and it is written down in CLAUDE.md.

**Credit progress.** `v17Offer` stores `c.from = v17Off(...)` at
signature. Each `move` on that statute books a `kept` entry and pays `V17_KEPT`
per rung moved toward the want, capped at `c.from` rungs total, and marks `met`
at arrival. And the offer draws one concession from the biggest gap and one
from the smallest non-zero gap, so exactly one promise in every agreement
is reachable inside a term.

**Seen.** The deal card's "What you were promised" list at 16838 gains a
countdown and a progress reading: "Wealth Tax, two rungs of four, due in three
sessions." A promise met gets a log line (one already exists at 35714 and has
never fired). A promise that lapses gets news naming the statute and the
partner.

**Measured.** Over 14 seeds by 100 sessions, `kept` entries are non-zero and
the kept-to-broken ratio sits in a measured band written into the assertion's
words. Poison one: delete the per-rung credit and `kept` returns to zero.
Poison two: delete the clock and overdue concessions never book. Poison three:
set `V21_DUE` to 999 and the overdue count goes to zero, which proves the date
is read (the S17f trap here is a count parameterised by the constant it checks,
so the assertion pins a session count and not `V21_DUE`).

**Costs.** About 90 lines. This is the item with a named harness casualty:
`live up to it, alter it, betray it` at 5909 gates on
`kept.count === 1 && kept.twice === 1 && kept.marked === true`, and per-rung
credit changes that count by design. The arm has to be re-derived and the
change argued in the commit, which the brief allows. No dice.

## C5. Ask, insist, threaten, move (NEW)

**Defect.** A partner asks the player for something twice per 720 sessions and
threatens the government once. Both papers sit behind
`if (st.inbox.length >= 4 || (st.turn + st.inboxSeq) % 2) return;` at 10261,
and then behind `st.partyRel[partner] < 27` (a threshold two restoring forces
pull the number away from: `politicsTick` drags it toward 62 at 6% a session
and `pv5CoalitionTick` drags it toward cohesion at 3.5%). And the two are
mutually exclusive on one threshold, so below 27 a partner never asks for
anything and above it never threatens. The relationship has two states, silent
or holding a gun.

**Mechanism.** Pressure becomes a state on the deal, `d.press`, running
`null` → `asked` → `insisting` → `threatening`, advanced by
`v21PartnerPress(st, pid)` in the same sweep as C4's clock. It reads the
ledger, never `partyRel`: an overdue concession moves it one step, a
`broken` entry moves it one step, and a `kept` entry moves it back. Each step
emits its own paper. `coalition_demand` already exists. `coalition_ultimatum`
is a new type with its own choices, because a borrowed paper type reaches
into whatever the original pointed at, which is how S16e's demand letter moved
the loyalty of the player's own first caucus.

Answering an ultimatum with the concession writes it into `d.terms.concessions`
with a fresh `due`, so the partner has extracted something and the extraction
is on the record. Ignoring it advances to `threatening`, and a `threatening`
partner is what C9's `topple` and C10's confidence motion read for eligibility.

The paper producer gets its slot back. Today the coalition branch is reached on
32% of sessions when the player leads. The producer's two `rand()` calls are
hoisted into one block at the top so the number of draws is constant whichever
branch fires, and then the coalition branch may return early without re-phasing
relative to the other branches. Putting a chair test in front of `rand()` is
exactly the S18c defect and the comment at 10289 says so.

**Seen.** Papers that arrive because something happened, naming the statute and
the date. A ladder the player can watch climbing on the deal card
("Insisting, since session 41"). The one moment of brinkmanship the game offers
today, "Dare them to leave", is a foregone conclusion because the paper appears
at `partyRel < 27` and the dare removes the partner at `< 28`; here the dare is
priced against the arithmetic (C8) instead.

**Measured.** Driven, 14 seeds: coalition papers per 720 sessions rise from the
measured 3 into a pinned band, and every step of the ladder is reached at least
once. `V21_PRESS_LADDER` is a covered surface: `roads.js` fails if a step names
a paper type with no entry in `V18_PAPER_NEED`, and fails if a coalition paper
type has no step that emits it. Both directions, per S17m.

**Costs.** About 110 lines plus the paper's choices and prose. The stream
re-phases once because the producer's draw order changes; `tools/pacing.js`
must be re-swept over six seeds with the mean quoted, per CLAUDE.md's ruling
that a one-seed pacing figure cannot tell a balance change from a reshuffle.

## C6. Cohesion reaches the floor of the house (IMPROVEMENT)

**Defect.** `partyBillSupport` at 9026 is
`if (coalition.indexOf(pid) >= 0 && bill.sponsor === st.ruling) score += 12;`
and that is the whole of what coalition membership is worth. The same 12
whether the partner sits at 76 cohesion or at 13. Measured across 1,634
divisions, a partner and an opposition party vote within 0.5 to 3.8 points of
each other on any bill the government did not lay. A coalition on the point of
collapse legislates exactly as well as a happy one, so the meter on the card is
the only place the player has any reason to care about it.

**Mechanism.** Two halves.

The flat +12 becomes a reading of `d.satisfaction`, clamped so that a partner
above the target votes better than today and a partner below `v17WalkFloor`
votes against the government's business. The scale is set from the measured
cohesion distribution (min 20, median 38, p90 48.1, max 76), so the sign flips
inside the range the game actually produces. A bar above the measured ceiling
is a mechanic that never fires.

And defection becomes a verb. `v21Defect(st, pid, bill)` writes
`b.lines[pid] = 'oppose'` on a government bill through the channel
`v17FloorCore` already provides at 38321, books a `defected` entry in the
ledger that already exists, and costs the partner cohesion with its own
benches. It is reachable by the engine through C9's card and by a junior player
through C11's button, and it is the same Core for both chairs.

**Seen.** The division card names the party that broke ranks. The government's
own bill fails on its partner's votes. The deal card's ledger records it beside
the broken promises.

**Measured.** Two divisions on one bill with cohesion at 70 and at 20, and the
partner's support differs by a pinned number of points. Over 14 seeds the
partner-versus-opposition gap on a government bill correlates with cohesion,
where today it is a constant. Poison: revert the term and the gap goes flat.
The existing decomposition probe in `scratchpad/legmeas.js` reproduces
`partyBillSupport` exactly on 22,932 samples and is the instrument.

**Costs.** About 40 lines. This is a real balance change to the vote model. `the
division is counted` at 10999 stubs `partyBillSupport` entirely and is safe; `a
party votes its own manifesto` at 10022 measures its terms and moves. No dice.

## C7. Confidence and supply as a live state with a price (NEW)

**Defect.** Zero sessions with confidence and supply in 720. `st.confidence` is
written in three places and never set back to null except by the next
`v17Install`; grep `confidence = null` returns only object literals inside
`v17Rotation`. The election report at 14020 tells the player the supply party
"can withdraw them" and nothing can withdraw them. The party-board verb at
12949 says the arrangement will cost capital every year and there is no
recurring charge anywhere. Two cards lie, and the branch they describe has
never been entered.

**Mechanism.** A supply party gets a real agreement.
`d.terms.confidence = 'supply'` becomes the enum's second live value (today
only `'cabinet'` occurs, which by CLAUDE.md's rule makes it a field nothing
reads). The supply agreement carries concessions with dues like any other and
no offices and no collective responsibility.

Every `V21_SUPPLY_TERM` sessions the supply party names its price through the
same ladder as C5. An unpaid price costs cohesion. At the walk floor
`v21SupplyWithdraw(st, pid)` clears `st.confidence`, books it in the ledger,
and puts the government straight in front of C10's vote, where
`v17ConfidenceVote`'s abstention branch at 37751 finally becomes reachable.

`confidence_threat`'s "renegotiate" answer at 10171 stops making a cabinet
member the supply party (which then prints "It is a minority government" over a
majority coalition) and calls `v17Renegotiate` at 37807, the function written
for that job.

**Seen.** A Confidence and Supply card beside the partner cards with its own
meter, its own price and its own countdown. The election report's sentence
becomes true. `v17CareBar` at 37728 shows what a restricted-government surface
looks like and is the model for a minority government's own bar.

**Measured.** Over 14 seeds a minority government forms at a pinned rate, at
least one confidence is withdrawn, and `st.confidence` is cleared by the
withdrawal. Poison: remove the withdrawal and the count goes to zero. This item
depends entirely on C1 making the minority branch reachable, and its assertion
says so.

**Costs.** About 80 lines. `the coalition in writing` at 5442 gates on
`deal.sd.myTerms.confidence === 'cabinet'` and has to name both values. No
dice.

## C8. Kingmakers (NEW)

**Defect.** Nothing anywhere computes whether a party is necessary to a
majority. `v17Build`'s trim at 37517 works the other way round: it removes
parties that turn out not to be needed. A party that is in every possible
majority charges the same reservation as a party in none, because the
reservation reads only `30 + share * 70` plus two flat bumps. This is the
single largest missing concept in the whole formation model, and it is the one
a player of parliamentary games looks for first.

**Mechanism.** `v21Kingmaker(st, pid)` enumerates the subsets of eligible
parties (7 parties, 128 subsets, deterministic, no dice), keeps the minimal
winning ones, drops any that pairs two parties beyond
`V17_UNBRIDGEABLE`, and returns the fraction that contain `pid`. That last
filter is what makes it political instead of arithmetic: a centre party is a
kingmaker because the two wings will not sit together, which is the actual
mechanism in a real chamber.

Readers: `v17Accept`'s reservation, so a party in every majority is dear and a
party in none is cheap; `v19Score` through C9's cards, so a party that knows it
is necessary uses the fact; and the page. The reservation reader is gated on the
new `bargain` level scalar (see "the level ladder" below), so the shipped price
is what `instinct` pays.

**Seen.** A line on the Parties page and on the formation sheet: "Necessary to
every majority in this chamber" or "In no majority at all." A player who has
just won an election learns immediately whether their 12% is worth anything,
which is the most informative sentence a parliamentary game can print and this
one has never printed it.

**Measured.** A cheap hand-seated arm on the S20a pattern, no driven sessions:
a board where one small party sits in every minimal winning coalition returns
1.0 for it and 0 for a party in none, and its reservation is higher than the
same party's reservation on a board where it is not necessary. The poison
stands in the gap by changing the board and leaving the code alone, which is
the S17k rule about a probe that cannot tell the old line from the new one.

**Costs.** About 45 lines. Runs once per formation and once per render of two
panels. No dice, no stream cost, no existing arm reads it.

## C9. The deck gets coalition verbs (NEW)

**Defect.** The complete list of writers of `st.coalition` outside the
formation is player buttons and scenario literals. The eleven cards are
`organise`, `campaign`, `court`, `attack`, `platform`, `article`, `order`,
`floor`, `bill`, `pact` and `demand`. None of them touches the government. The
`oust` goal's own `worth` table prefers `attack`, `floor`, `campaign` and
`pact`, and not one of those can remove a party from a coalition. That is a
goal whose progress no card can move, which is the defect CLAUDE.md names
hardest.

**Mechanism.** Four cards, each a caller of a Core that already exists or is
built by an item above.

- `bargain` (a partner or supply party): puts a priced ask to the government
  with a date. Against a player government it posts C5's ultimatum; against an
  engine government it resolves in the model, which closes `deck.md`'s finding
  that no engine can press a government the player does not sit opposite them
  in.
- `defect` (a restive or ill-used partner): C6's `v21Defect` on a government
  bill, without leaving.
- `topple` (an opposition party holding `oust`, or a `threatening` partner):
  calls C10's confidence motion. This gives `v17ConfidenceVote` and
  `v17Refound` their second callers.
- `broker` (a party outside the government): offers supply to a minority
  government, or offers to replace a partner, through `v17Accept` on a real
  offer.

Each card pays the full coverage cost, and the harness makes that
non-negotiable: an entry in `V16_AI_COST`, in `V19_RIVAL_WORTH`, in
`V19_TEMPER_AXIS`, in at least one posture's `post:` list, in the relevant
goals' `worth` tables, and a line in `roads.js`'s `moved` chain at 4235, whose
own comment says adding a card reddens it until somebody says what it is
supposed to move.

While the deck is open: fold `V17_AI_COST_ARTICLE`, `V17_AI_COST_ORDER` and
`V17_AI_COST_FLOOR` into `V16_AI_COST` and add the coverage arm that has always
been missing. `v19Score`'s purse penalty reads `V16_AI_COST[card.id] || 0`, so
those three cards are scored as free today, and a fifteenth card priced in a new
constant would inherit the same gap in silence.

**Seen.** Four new kinds of sentence in the log and four new kinds of paper.
The Parties page's "why" column already prints the card and the aim.

**Measured.** Each card runs, moves what it says, and is paid from the party
purse (the `cardWorks` property arm at 4200 does this per card). Driven over 14
seeds: each card is played at least a pinned number of times, and `topple`
plays lead to real confidence motions. Every instrument that wraps a card's
`run` checks `V19_SIMULATING`, or every rehearsal counts as a play and the
whole measurement is 3.8 times too large, which happened to this baseline once
already.

**Costs.** About 160 lines including prose. Deck size goes 11 to 15, which is a
five-place change in `roads.js` and six tables in `vale.html`; four
covered-surface gates will name anything I miss, which is the design working.
No new `rand()`: each card's `can` is roll-free, and `v19Choose` draws once as
it does today.

## C10. A government that can fall (NEW)

**Defect.** `v17ConfidenceVote` at 37740 and `v17Refound` at 37797 have exactly
one caller each and it is the player's own action at 12711 and 12719. Nothing
recounts the majority when a partner leaves: `v17Walkout` splices
`st.coalition` and writes no formation and no confidence test. Four exits from
a coalition exist and each does something different, and three of them never
set `d.walkedOut`, which is the flag the returning-partner branch keys on. A
player leading a majority coalition cannot lose office between ballots by any
means.

**Mechanism.** One door in and one door out.

`v21Confidence(st, mover)` is the single motion, called by `topple`, by a supply
withdrawal, and by a partner whose ultimatum expired. It counts through
`v17ConfidenceVote`, which already reads partner cohesion. The count changes in
one way that matters: the vote counts members, not parties. `factionAverage`
and party discipline decide how much of each party's bloc actually turns up,
so a coalition with poor internal loyalty can lose its own back benches. That
is the same fix the investiture needs (`aye` currently equals the coalition's
seats by construction, and `nay` is at most the rest, so a majority coalition is
invested by arithmetic and the tally printed on the sheet is decoration). If the
motion carries, `v17Refound` asks the same Assembly for another government,
which sometimes produces one without a vote of the people.

`v21Leave(st, pid, why, actor)` is the single exit. `v17Walkout`,
`leaveCoalition`, `expelPartner` and the `dare` branch all call it. It sets
`d.walkedOut`, books the ledger, writes the memory, writes the news, and
recounts: a government left short of a majority is put in front of
`v21Confidence` at the next session unless it finds supply. `joinCoalition` and
`expelPartner` also stop bypassing the model: `joinCoalition` calls `v17Accept`
and refuses with the sentence `v6CoalitionCandidates` already writes at 19423,
because 12 capital currently puts the PNL in an RSF cabinet at a compass
distance of 2.31 against a bar of 1.15.

**Seen.** A confidence sheet raised at the player with the tally shown before
the question is put. A government falling and a new one forming out of the same
Assembly. The Government page gains an arithmetic strip: seats, majority, who
is necessary, whose abstention the government lives on, sessions since the last
motion.

**Measured.** Driven with the `runQueue` override, 14 seeds: motions moved are
non-zero, at least one carries, and government changes between elections rise
from the measured 3 in 720 into a pinned band. Poison one: remove the engine
callers and motions return to zero. Poison two: revert the member count and a
majority coalition becomes unlosable again. Poison three: remove the recount in
`v21Leave` and a government short of a majority carries on.

**Costs.** About 120 lines. `the house removes a government` at 5781 gates on a
hand-built board and moves with the member count. A static ratchet goes into
`checks/run.js`: the number of sites assigning `st.coalition` outside
`v17Install` and `v21Leave` is pinned at zero, so a later slice that splices
the array inline fails a check in under five seconds, where today it would
surface in a playtest if it surfaced at all. That is the covered-surface answer to "four ways to leave a coalition
and they disagree", and it costs nothing to run.

## C11. The junior partner's game (NEW)

**Defect.** `pv5CoalitionPanel` emits the five management buttons only when
`leads(S)` at 16862, and `pv5CoalitionAction` refuses at 16747. What a junior
partner gets is `v17MyDealCard` at 16834, which is read-only, plus
`leaveCoalition` on their own party board. `V18_PAPER_NEED` marks both coalition
papers `'leading'`, so a junior never sends one and never receives one. One of
the owner's three named chairs has exactly one coalition decision in it, and
that decision is to end the game they are playing.

**Mechanism.** The junior gets the mirror of the head's buttons, and each one is
the player's side of an engine verb from C9, sharing one Core so the two chairs
cannot drift apart.

- Ask for a concession: writes a dated `adopt` into `d.terms` if the head
  agrees. A paper to a player head, a model answer from an engine head.
- Ask for a department: the same, against `st.exec`.
- Withhold the whip on the next division: C6's `v21Defect`, from the junior
  chair.
- Publish the disagreement: costs the government authority and the partner
  cohesion.
- Threaten to withdraw: raises C5's ultimatum against an engine government.

`V18_PAPER_NEED` gains `coalition_ultimatum: 'gov'`, so a junior sends and
receives.

CLAUDE.md's sharpest rule applies here and I will name it: opening a permission
on the callee is worth nothing while the caller still refuses. Every one of
these has to be driven by a real click from the junior chair, and the same
predicate has to answer for the button, the handler and the fold that hides
them.

**Seen.** Five buttons on the player's own deal card, where today there is a
paragraph.

**Measured.** `no control lies, in any chair` at 8339 already walks fifteen
pages from three chairs and presses everything enabled, and these must survive
it with its content arm intact (collapsing the button and the handler onto one
predicate makes them agree even when both are wrong). Plus a driven arm from
the junior chair: each verb moves the state it names, and the engine's
equivalent moves the same state. `the party board has a tempo` at 11323 requires
every new per-party verb to carry a cooldown and an escalating price derived
from its cost.

**Costs.** About 100 lines. No dice.

---

# Part II. What follows from it

Each of these is a defect the intake measured on its own. What makes them one
programme is that the coalition gives each of them somewhere to point.

## R1. `oust` becomes the engine's plot (IMPROVEMENT)

**Defect.** Held zero times in 720 sessions at the top AI level. Three functions
on one card disagree about what the goal is for. `fits` at 34764 takes the
maximum grudge against anybody; `target` at 34774 picks the argmax among
all parties with no reference to government; `done` at 34783 is true when the
target is out of government, and `v19AdoptGoal` drops any goal already done. So
`oust` is adoptable only when the single most-hated party happens to be sitting
in the government, which is 72 of 3,618 non-ruling party-sessions. Two intake
agents measured 1 adoption in 199 and 4 in 4,320; the baseline measured 0.

**Mechanism.** `fits` asks the same question `target` answers: the worst grudge
among parties in the government. `target` filters to the government. `done`
stamps the government at adoption and becomes "the target left office while I
was working to remove them", so a party cannot complete an aim by standing
still. And `worth` names the cards that can now move it: `topple`, `bargain`,
`defect`, `broker`.

Fixing the predicates alone lifts adoptability from 2.0% of boards to 4.3%,
which the intake measured. The rest comes from R2, which is what finally gives
the government-facing grudge a writer.

**Seen.** The Parties page prints "Bringing down the government" with a
progress reading that reads the government's own position instead of the
party's seat share (`oust.progress` is currently `1 - v17Share(g.ref) * 2.5`,
a seat meter with a goal's name on it).

**Measured.** Over 14 seeds `oust` is adopted at a pinned rate and reaches
`done` at least once, and the existing `reach.neverAdopted.length === 0` gate at
9720 passes for a real reason instead of passing because that arm drives at
`shrewd` on different seeds. Poison each predicate separately.

**Costs.** About 40 lines. `V20_AIM` needs an entry naming a real verb or
`registry.total` at 11947 fails, which is the guard S21 hits first.

## R2. A party remembers being governed against (NEW)

**Defect.** Eleven `v16Resent` call sites and not one of them is legislative or
electoral. You can spend 130 sessions passing the exact statutes the PNL exists
to prevent and it will never hold one of them against you. 394 of 3,729 nonzero
grudge entries point at a party in government, while the government is two or
three of seven parties. The engine's model of the human is dominated by
unanswered mail: 81 of 128 traced grudge writes are an expired inbox letter,
which is 63% of the signal, and a player who clears the inbox is invisible no
matter what else they do.

**Mechanism.** `V21_POLITICS`, one table pricing the acts that create political
enmity, read by one emitter `v21Answer(st, kind, actor, target, weight)`:

- a statute enacted away from a party's `wants`, weighted by that party's own
  gap (the number `pv5TopWants` computes);
- a bill of theirs voted down by the government;
- an office lost, written at `execContest` (today `execRemember` touches only
  the winner's runners-up and the loser gets nothing at all);
- a demand refused;
- exclusion from a government they were necessary to (C8 makes this
  computable);
- a cordon, a ban, a portfolio taken back.

It is a covered surface both ways. `roads.js` fails if an act has an emitter and
no weight, and fails if a weight names an act with no emitter, which is the
`radicalise` defect the `V17_MEMORY` whitelist shipped. And the ignored letter's
+14 comes down below the median deliberate provocation of 13.4, because they are
currently identical.

**Seen.** The Parties page's memory cell is three words today with no number and
no cause. It becomes a number and the last thing that moved it, which
`a.provokedAt` can carry at no cost.

**Measured.** Driven, 14 seeds: the share of grudge pointing at parties in
government rises from the measured 10.6% into a pinned band, and each writer is
poisoned separately. Note the coupling: `a party knows who is in its way` gates
`V19_RIVAL_PUSH` between the p90 and p99 of the grudge distribution measured in
the same run, so changing grudge magnitudes moves that window without touching
rivalry at all. That arm has to be re-swept.

**Costs.** About 90 lines. No dice.

## R3. One regard, signed, read where the player's scalar is read (NEW)

**Defect.** No gratitude field exists anywhere in 3.7 MB. `v16Resent` clamps at
zero, so the twelve negative weights in `V17_MEMORY` write literally nothing to
a party that holds nothing, and 42% of party-sessions sit at zero against the
player. Two parties that governed together for 103 consecutive sessions regard
each other on formation night exactly as two parties that have never met.
Separately, `st.partyRel` is one number per party and it is the player's:
it is the second-largest term in every division at a mean absolute 4.98 of
61.24, it decides an engine-versus-engine assent that refuses 88.2% of
everything, and an identical bill from a rival and from a friend scores to the
same decimal.

**Mechanism.** One change makes the whole thing cheap and safe. `v16Resent`'s
clamp goes from `(x + n, 0, 100)` to `(x + n, -100, 100)`, and `v16Grudge` keeps
`Math.max(0, raw)`. Every existing reader is byte-identical, because a party
that never went negative reads what it read before and a party that did reads 0,
which is what the clamp gave it. No new field, no save migration, no
enrichment.

Then `v21Regard(st, a, b)` returns the signed value, and the new readers opt in:

- `v17Accept`'s value and its reservation, so a habitual partnership is
  cheap to renew and a betrayed party is dear;
- `partyBillSupport` at 9032 reads the voter's regard for the sponsor when
  neither is the player, in place of the voter's relation to a player who has
  nothing to do with the bill;
- `assentFavour` at 9444 reads sponsor-to-holder;
- `v16PactPartner`, and `v17Invest`'s nay test.

New writers on the positive side: a kept concession (which today books a ledger
entry and pays no memory at all, while a breach four lines later writes one), a
full term served together, a floor declaration in favour, and the four paper
answers that today move only `partyRel`.

**Seen.** The memory cell reads "They owe you one." The formation sheet's
refusal reason names the history instead of two bare numbers. Each party's row
names its closest ally and its worst enemy, which no surface in the game shows
today.

**Measured.** A party at zero that is helped goes below zero while `v16Grudge`
still returns zero, poisoned together as one guard (removing either alone
changes nothing, which reads as a dead guard and is not one). `v17Accept`'s
value rises for a party with positive regard. And the `sponsorswap.js` probe,
already written, shows the same bill scoring differently from a rival and a
friend where today it is identical to the decimal.

**Costs.** About 110 lines. One named casualty: `a party remembers what was
done to it` at 6697 gates `fires.afterKindness === 0`, which is the assertion
that a kindness to a party at zero does nothing. If that gate reads the raw
value it goes red by design and becomes "the grudge half is unchanged and the
regard half moved"; if it reads through `v16Grudge` it passes untouched. Which
of the two it is decides whether this item costs an argued change or nothing,
and it is the first thing I would check.

## R4. The objective can see what it is holding (IMPROVEMENT)

**Defect.** For seven of eleven cards, across 100% of their own rows in 1,028
rehearsals, the only moving component of `v19Standing` is the purse deduction.
The simulation prices a bill, an article, a pact, a platform rewrite, a letter
and a floor intervention at exactly minus their own price tag, and the net
advice at `ruthless` is "court a bloc, never lay anything." Three of the five
components (`share * 60`, +18 ruling, +9 per office) moved on zero of 1,028
rehearsals, because no card changes seats or government or an office in one
ply, and they are read only inside a difference where they cancel. The `/12`
squash and the ±1 clamp are unreachable by a factor of five against a measured
spread of -0.96 to +2.58.

**Mechanism.** Give the objective terms for the things the party is holding:

- a bill on the order paper, valued by `billForecast(st, b).lower` against its
  bar (the function exists and `v19BillFor` already calls it);
- a pending amendment, a live pact, a letter awaiting an answer;
- the government's own survival, which is the coalition half: a party in
  the coalition reads `v17ConfidenceVote(st)` and its own walk floor, so it can
  see that breaking a promise costs it the thing it is sitting in office for,
  and an opposition party holding `oust` can see the motion getting closer.

The divisor becomes the measured spread of about 2.6, and the clamp sits where
the distribution ends, with the measurement written into the comment so the
next reader cannot re-pick it by eye.

**Seen.** Indirectly, and that is the honest answer: the engine stops spending
27.3% of its output on the cheapest card it holds. The Parties page's "why"
line can name the reason it acted, which it already has the data for.

**Measured.** `think.sim.distinct >= 7` at 9091 rises, and the card mix moves
off the measured 27.3% `court` into a pinned distribution over 14 seeds. Every
new term is poisoned separately. And the measurement has to read the outcome
through the game's own path, because a probe that recomputes the formula proves
the function and not the wiring.

**Costs.** About 70 lines. `a party is after something` reads `sim.distinct` and
`sim.orderSpread` over the current deck and moves with both this and C9.

## R5. `court` stops paying the government (IMPROVEMENT)

**Defect.** Three intake agents measured this independently and got the same
answer. `court` is 27.3% of everything the engine does, costs 36 of a purse
averaging 57.6, and lowers the playing party's own projected vote share on
111 of 140 plays (mean -1.08% in opposition). `supportTargets` reads a bloc's
mood twice with opposite signs: `weight` rises for everybody, and `appeal` is
`.915 + (m-50)/80` for the ruling party against `.784 - (m-50)/130` for the
opposition. A contented bloc is an incumbent's bloc, and six opposition parties
spend their largest single line of expenditure making blocs content. The
`ground` goal that the card serves asks for +14 against a steady-state ceiling
of +3.0.

**Mechanism.** Give the card a channel that belongs to the party.
`st.blocLean[pid][bloc]` decays but does not mean-revert to a national target,
and `supportTargets` reads it in `appeal` beside the national mood. Courting a
bloc becomes a relationship with that bloc instead of a push on a number the
ballot reads as approval of the government. `ground.target` is then set from
what the card can actually deliver over a plausible span, with the arithmetic
in the constant's own comment.

The same keying fixes the interest groups: `st.interests[g].relation` is the
player's only, so eight named national organisations exist in a seven-party
republic and six of the parties cannot be endorsed or refused by any of them.

**Seen.** Courting a bloc as an opposition party moves that bloc toward you.
The Parties page can show which party each bloc leans to, which is a fact the
model has never held.

**Measured.** Read `supportTargets(st)[pid]` either side of a real `court.run`,
which is the instrument all three intake probes used, and assert the sign with
the measured mean pinned. Poison: delete the lean term from `appeal` and the
sign goes negative again.

**Costs.** About 60 lines plus a save field that `enrich` must backfill. This
touches the vote model, so `party money reaches the ballot` at 3283 and `the
campaign and the organisations are worth seats` at 3560 both need a look.

## R6. Posture is a state with tenure, and the postures differ (IMPROVEMENT)

**Defect.** `hold` is 39.2% to 44.8% and it is not a mood: it is the residue of
five thresholds none of which the ordinary board clears. `restive` fired 0 times
in 4,320 party-sessions, and the reason is a race, not a bar: the only channel
raising a sitting partner's grudge against the head of government is a breach
worth 9 or 12, while the same breach costs 8 or 11 of cohesion against a walk
floor of 12 to 30, so the partner walks out before it can become an enemy
inside the ministry. `consolidate` fired 4 times in 1,488 against a bar of
.22 on a population whose p90 is .149. `attack` and `moderate` share a Jaccard
of 0.78 and nothing downstream reads posture at all, so two parties the page
describes differently behave identically. And the posture the page prints is
wrong 30.5% of the time with a median age of ten sessions, while the column
beside it is computed live.

**Mechanism.** Four changes, and the first is the coalition connection.

A breach a partner cannot afford to leave over converts into grudge instead
of into cohesion loss. C8 answers "can it afford to leave": a partner that is
necessary to every alternative majority can walk, and one that is in none has
to stay and seethe. That is what finally makes `restive` reachable, and it is
the party the whole of S18e was written for.

`consolidate` asks "largest party outside the government" instead of an
absolute share above the population's ceiling. Posture gets a minimum tenure
and a `postureSince` stamp, so a party can settle into a stance for a season.
And the panel renders `v16Posture(S, p.id)` live, the way the odds column
already does at 36136, after which `a.posture` has no reader and goes.

**Measured.** Over 14 seeds, `restive` and `consolidate` each fire above a
pinned floor and the distribution is written into the assertion's words. The
printed posture matches the live one on 100% of samples. The existing arm at
8754 tops the grudge up with `v16Resent(S, pid, S.ruling, 100)` every session
and asserts the predicate, which proves the predicate and says nothing about
whether the republic can reach it; the new arm asserts reachability from
unassisted play, which is the S17q rule.

**Costs.** About 70 lines. `V17_BURN` has no coverage guard and its only reader
falls back to a flat .7 for an unknown posture, so any posture work has to
extend it. Posture decides the open set, so every rate in S19b, S19c, S19f and
S20g has an open-set denominator and moves. This is the item with the widest
blast radius per line changed.

## R7. The tempo budget is not zero-sum (IMPROVEMENT)

**Defect.** Six engine parties share 1.5 initiatives per session between them,
measured at 1.42, with 18.5% of sessions producing no engine action at all.
`v18TempoOdds` normalises every weight against a fixed budget, so a multiplier
applied to everybody cancels: driven on seed 4242, provoking the whole board
gives byte-identical odds to provoking nobody, and provoking one party
measurably quietens the other five (.2708 down to .2484). The strictly dominant
play is to concentrate hostility on a single party, which is the opposite of
what a game about a hostile chamber wants. The `V18_TEMPO` comment identifies
this defect and deletes a term for it; the rule was applied to the ballot term
and not to the shipped ones.

**Mechanism.** The board's level moves the budget and not only its shape:
`budget = live.length / V16_AI_CADENCE * f(mean weight)` with `f` bounded, so a
republic in crisis is busier and a quiet one is quieter while the owner's dial
still sets the resting rate. And one new term that the coalition drives: a
party with an overdue concession, an ultimatum outstanding or a confidence
motion on the paper acts more, which is a circumstance that tells two parties
apart and is therefore allowed in the table by S18e's own rule.

**Seen.** The Parties page already prints each party's odds live and would print
the new reason. A player under pressure feels the chamber speed up.

**Measured.** This breaks `ai.budgetHeld` at a tolerance of 1e-6 by design,
and that is the argued change: the gate becomes two readings, the resting rate
held and the ceiling bounded, which is what the intake recommends. Plus a new
arm for the exploit: provoking one party does not reduce anybody else's odds.
`V16_AI_CADENCE` stays untouched, because it is the owner's dial and its sweep
is published.

**Costs.** About 35 lines and one argued assertion change. The S19e and S19f
A/Bs hold `V19_REACT_RISE` on both sides because the reaction changes which
sessions a party acts in; any tempo change has to be held on both sides of all
of them or it silently moves five measurements.

## R8. The ballot has consequences (NEW)

**Defect.** `runElection` calls no AI function after the count. There is no
`v16Resent` at a ballot, no goal adopted or retired, no leader change, no
post-mortem, and no memory that a party was beaten by anybody in particular. A
landslide and a hung chamber produce the same engine behaviour on the next
session. The only reaction in the whole engine is `driftParties` walking every
loser toward the winner at up to 20%, which is a large effect the player is
never told about, and `V18_TEMPO.losing`, a x1.3 that lasts exactly one session
because `lastSeats` is refreshed every session.

**Mechanism.** `v21AfterBallot(st, before, after)`, called from `runElection`
after the count and before the formation, so what it writes is read by the
formation that follows:

- the biggest loser resents the biggest winner, through R2's emitter;
- a party that lost its place in government adopts `oust` against whoever took
  it, which is R1's aim arriving at the moment that motivates it;
- a party that gained heavily adopts `enter` or `office`;
- a party beaten twice running replaces its leader, through the `makeFigure`
  path that already exists at 7381;
- `driftParties` is narrated.

**Seen.** News and log after every count naming who moved where and why. The
Parties page's aim column changes for a reason the player just watched happen,
which is the difference between an opponent with a plan and an opponent with a
die.

**Measured.** Driven with the `runQueue` override (every arm about anything
downstream of the queue needs it, and three S20g probes that skipped it reported
one election in 720 sessions): after a ballot with a large loser, that party's
grudge against the winner rose and its aim changed. Pin the rates over 14
seeds. Poison each arm separately, and drive real sessions, because calling
`v21AfterBallot` directly tests the function and leaves the wiring untested.

**Costs.** About 80 lines plus prose. `driftParties` runs at 11970 before
`v17Form` at 11977, so ordering matters and the new pass sits between them.

---

# The level ladder, and the floor that must not move

The constraint is that at `instinct` the behaviour is the shipped game exactly.
I want to be explicit about how this proposal reads that, because it decides
whether half of Part I is even allowed.

Some of what follows is a rule of the parliamentary game. A promise carrying a
date, a department seated when it is promised, a confidence vote that counts
members, a red line that forbids something: these belong to the constitution of
the republic, and they apply at every level the way `V17_UNBRIDGEABLE` and the
investiture already do. `v17Rotation` reads no `aiLevel` today and was shipped
that way.

A read of the board that makes a party play better is intelligence, and it
gets gated. `V19_LEVELS` grows a fourth scalar, `bargain`, at 0 / 0 / 1 / 1.6.
It gates C8's kingmaker term in the reservation, the timing of C5's ladder (a
shrewd partner waits for a division it can win; an unthinking one just walks),
the choice of which concession to extract, and whether a `topple` mover counts
the house before it moves. At `bargain: 0` the promises still fall due and the
departments are still seated, and nobody plays any of it well.

That also answers a finding this proposal otherwise leaves alone. `shrewd` to
`ruthless` changes three numbers and adds no behaviour, so the top rung is a
sharpness change whose most visible effect is that the die stops overriding the
leader. `bargain` gives the top rung a behaviour and restores the ladder's
shape.

The guard is an arm on the `rank.instinct.gain === 0` pattern: drive at
`instinct` and assert every coalition cunning term measures exactly zero.

---

# The seeded stream

`rand()` is the campaign's identity and a gate in front of it re-phases
everything. What this proposal does to it:

Nothing new rolls in the formation. `v17Rotation` is asserted pure at
`form.pure.noDice`, and `v21Kingmaker`, `v17Offer`'s pricing, `v21DealClock` and
`v21Confidence` are all deterministic. Every new card's `can` is roll-free, and
`v19Choose` draws once per initiative as it does today.

One thing re-phases, deliberately: C5 hoists the paper producer's two existing
`rand()` calls into a single block at the top, so the number of draws is
constant whichever branch fires. That changes the draw order once. The
consequence is that every seeded campaign produces a different republic from
this build forward, which is allowed pre-release and has happened before, and
the cost is a `tools/pacing.js` re-sweep over six seeds quoting the mean with
its spread. A single-seed pacing figure cannot tell a balance change from a
reshuffle, and three consecutive slices in this program published one row of six
as the arc.

`tools/determinism.js` re-runs for its seven properties, and every new probe
pins its own `rngState` in `fresh()`, because three roads seeded nothing and a
poison applied for a different road reddened them for reasons unrelated to what
they test.

---

# What goes red, and what I would argue for

The harness holds 200 assertions and 26 of them have AI behaviour as their
subject. This proposal moves nine, and I would rather name them than discover
them.

| assertion | line | why | my position |
|---|---|---|---|
| `live up to it, alter it, betray it` | 5909 | `kept.count === 1 && kept.twice === 1` against per-rung credit (C4) | argued change: re-derive the count, keep `kept.marked` |
| `a plurality is not a government` | 5600 | hand-built boards move with C1 and C2 | re-derive the boards, and add the driven distribution arm the intake asks for |
| `a caretaker holds office` | 5725 | `care.resolvedInPlay` needs one closed session to clear a Hung Assembly | keep the 3/1/3/2 literals, re-derive the board |
| `the house removes a government` | 5781 | member counting (C10) changes the tally | re-derive; the arm gets a second leg for an engine mover |
| `the coalition in writing` | 5442 | `myTerms.confidence === 'cabinet'` against C7's `'supply'` | the gate names both values |
| `a party remembers what was done to it` | 6697 | `fires.afterKindness === 0` against R3's signed clamp | passes untouched if it reads `v16Grudge`; argued change if it reads raw |
| `a party moves when it has a reason to` | 8754 | `budgetHeld` at 1e-6 against R7 | argued change: resting rate and ceiling asserted separately |
| `the six that are not yours act` | 4309 | `six.deck === 11` is a literal and the `moved` chain returns false for an unknown card | four new literals and four new chain lines, exactly as the comment demands |
| `a party is after something` | 9091 | `sim.distinct` and `sim.orderSpread` move with C9 and R4 | re-derive on the 15-card deck |

Four covered-surface gates will name anything the deck work misses:
`rival.uncovered`, `temp.cardsWithoutAxis`, `aims.registry.unserved`, and
`ghostWeights` in both directions. Two more are coupled and easy to forget:
`scale.worth` sits between the p90 and p99 of the grudge distribution measured
in the same run, so R2 and R3 move it without touching rivalry; and
`steer.carryOpen >= 40` is already close to its floor and any change that
dilutes `carry`'s share of adoptions can starve it.

New covered surfaces this proposal adds, each able to fail when a later slice
adds an entry without wiring it:

- `V21_POLITICS` fails on an act with no weight and on a weight with no
  emitter.
- `V21_PRESS_LADDER` fails on a step with no paper type in `V18_PAPER_NEED` and
  on a coalition paper with no step.
- `V16_AI_COST` becomes total over `V16_AI_DECK`, which closes the one table
  that escaped the rule (three cards are scored as free today).
- A `checks/run.js` ratchet at zero on writers of `st.coalition` outside
  `v17Install` and `v21Leave`, in the idiom of the existing zero ratchet.

---

# What the player actually sees

An engine behaviour the player cannot perceive reads as randomness however good
it is, so here is the campaign as it would run.

You win 14% of the chamber. The formation sheet opens and the first thing it
tells you is that you are necessary to every majority in the room, which is a
sentence this game has never printed. The RSF's mandate runs out after three
invitations. The SD get a mandate and come to you with two statutes, a
department and your red line accepted. You take the Chancellery, and the log
names it.

Twelve sessions later the deal card says the Wealth Tax is two rungs of four
with three sessions left. You are the junior, so you press "Ask for a
concession" and the government's answer arrives as a paper. It lapses. Your
card reads "Insisting." You withhold the whip on the next government bill and
it falls by nineteen votes, and the ledger records the defection beside the
broken promise.

Elsewhere the CUP lost eleven points at the last count and its aim column now
reads "Bringing down the government," pointed at the party that took its
office. Two sessions on, the CUP moves confidence. The sheet shows you the
tally before the question is put: the government's own back benches are not all
there, and it is closer than the seat count says. It carries. The Assembly
produces another government out of the same seats without a vote of the people,
and this time you are not in it.

That is nineteen items doing one thing.

---

# Sequencing, and what I would cut first

C4 is the foundation and nothing in C5, C6, C7, C9, C10 or R6 works without it,
so it goes first and alone. C1 and C2 go together, because the mandate budget
without the pricing just makes formation fail. C8 is cheap, self-contained, has
no existing reader and pays for itself on the page, so it lands early. C10 is
the keystone and goes last in Part I, after the exits are unified.

If the slice has to shrink, I would cut in this order: R5 (`court`) first, as it
is a vote-model change with the widest reach and the least coalition content;
then R7 (tempo), which costs an argued assertion change for a modest effect;
then C11's fifth and fourth buttons, keeping "ask for a concession" and
"withhold the whip", which are the two that touch the agreement.

I would not cut C4, C10 or R1. Without the date the agreement stays a wish
list. Without the motion the government still cannot fall, and without the aim
no engine wants it to.

---

# What I would not do, and why

**I would not build a parallel coalition system.** The rotation, the offer, the
investiture, the agreement, the ledger, the walkout and the confidence count all
exist and work. Every item above is a reader, a price, a date or a caller added
to code that is already there, and the two genuinely new functions
(`v21Kingmaker`, `v21DealClock`) exist to supply a concept the file has never
held. This codebase punishes parallel mechanisms
specifically, and `pv5CoalitionTick`'s restoring drift against `v17DealScan`'s
ledger is already one pair of mechanisms measuring the same statutes and
disagreeing.

**I would not make deep search the headline.** A two-ply rehearsal is the
correct reading of `choosing.md` and it is the wrong thing to lead with. The
goal table alone names the same card as the whole seven-term score on 70% of
open sets, and the die discards the leader on a third of picks at the top level,
so a better search is a tie-break on a quarter of a quarter. More to the point,
the player cannot see it. A card chosen after two plies and a card chosen after
one produce the same sentence in the log. Fixing what the objective can see
(R4) is worth more than how far ahead it looks, and it costs a tenth as much.

**I would not add more actions.** The baseline says the engine acts at the
cadence it was designed to and no card returns null. The four cards in C9 are
there because four capabilities are missing, and each one reaches a system that
exists and cannot currently be reached.

**I would not pick a single threshold by eye.** Every number in this proposal
that gates anything is written as "measure the distribution in play, then pin
the measurement in the assertion's own words." The bar the street was given at
62 sat above a ceiling of 57 and the whole slice was decoration that passed its
own assertion, because the assertion set the number by hand.
