# S21 judgement: the merged programme

Four designs, roughly 190 distinct proposals, about 60 distinct ideas once the
synonyms collapse. This file is the merge, and it is written to be built from.

Read the four in this order if you read them at all: D for the coalition thesis
and the build order, B for the reader discipline and the honest harness-cost
table, C for the perception thesis and three findings nobody else made, A for
the line-number anchoring and the "connect the wires" argument. No design is
the answer on its own. Each is wrong about at least one thing the code settles.

## Conventions in this file

- IMPACT and VISIBILITY: 5 is best.
- RISK and COST: 5 is worst. RISK covers the ~200 existing assertions, the
  seeded stream, the save format, and the `instinct` floor.
- Every line number is from `vale.html` at `c7f7236` and I checked the ones the
  adjudications turn on. Where a design's line number is wrong I say so.

---

# 1. The union table

Merged names first, then who proposed it under what name. IMP = improvement to
existing code, NEW = new behaviour.

## Coalition

| # | name | proposed by (their name) | kind | mechanism in one line |
|---|---|---|---|---|
| U1 | The reservation reads the pair | A:C1, B:I4.5, C:C2, D:C2/R3 | IMP | Delete `v17Accept`'s outgoing-posture term (37485, fires on 4 of 242 calls) and read the two parties' own regard into value and reservation. |
| U2 | The investiture can be lost | A:C2, B:C3, C:C5, D:C10 | IMP | `v17Invest` counts members through `partyDiscipline` (9122) instead of summing coalition seats, so `aye > nay` stops being arithmetically forced. |
| U3 | The offer is priced and varies | A:C3, B:C1, C:C2, D:C2 | IMP | `v17Offer` varies the concession count by need; `v17Accept` prices each concession by the invitee's own gap and reads `redLines` at all. |
| U4 | The promised department is seated | A:C4, B:C6, C:C2, D:C3 | NEW | `offer.offices` becomes a named department; `v17Install` writes `st.exec[dept]`; taking it back books a breach. `terms.portfolios` is deleted. |
| U5 | The agreement falls due | A:C5, B:C4, C:C3, D:C4 | NEW | Every concession `due` is `null` and read by nothing. One clock in `v16RedLineTick`'s sweep owns the overdue breach. |
| U6 | A promise can be kept | A:C6, B:C4, C:C3, D:C4 | IMP | `V17_KEPT` pays per rung closed with `c.from` stored at signature, and one concession is drawn from a small gap so it is reachable inside a term. |
| U7 | The partner's ladder | A:C7, B:C7, C:N6/C4, D:C5 | NEW | `d.press` runs null to asked to insisting to threatening, driven by the ledger instead of by `st.partyRel < 27`, with its own inbox slot. |
| U8 | Cohesion reaches the division | A:C8, D:C6 | IMP | `partyBillSupport`'s flat `+12` (9026) becomes a reading of `d.satisfaction`, so a partner under its walk floor votes against government business. |
| U9 | The membership doors go through the model | A:C9, B:exploits, C:C4, D:C10 | IMP | `joinCoalition` (12953) calls `v17Accept` and can be refused; `expelPartner` recounts the house. |
| U10 | One exit, and it recounts | A:C10, B:C5, C:C4, D:C10 | IMP | `v21Leave(st, pid, why, actor)` is the only path; sets `walkedOut`, books one ledger entry, and recounts the majority. |
| U11 | The head's five verbs stop lying | A:C11, B:exploits, C:C4, D:C3 | IMP | Council reads `lastCouncil` and has a cooldown; portfolio checks before it charges; programme writes `d.terms.redLines`. |
| U12 | The junior partner's game | A:C12, B:C7, D:C11 | NEW | Five verbs on `v17MyDealCard`, each sharing a Core with the engine's verb, each routed by `V18_PAPER_NEED`. |
| U13 | Confidence and supply becomes live | A:C13, D:C7 | NEW | `d.terms.confidence = 'supply'` gets concessions, a recurring price, and a withdrawal that clears `st.confidence`. |
| U14 | The mandate runs out | B:C2, C:C1, D:C1 | IMP | `V17_FORM_MAX` 7 to 3, plus `V21_INVITES = 3` per formateur, plus a re-mandate round at raised generosity. |
| U15 | Kingmakers | B:N7 (`v21Pivotal`), D:C8 | NEW | Enumerate the 128 subsets, keep the minimal winning ones, drop those pairing two parties past `V17_UNBRIDGEABLE`, and read the fraction into the reservation. |
| U16 | A party refuses to sit with another | A:N8, B:N7 (`st.aiCordon`) | NEW | An engine can cordon; `v17Build`'s pool and `v17Accept` read it per formateur. |
| U17 | Formation takes a session | C:C1 | NEW | `st.formation.talks` under a caretaker while the rotation runs. |
| U18 | The formation sheet is a negotiation | A:C3, B, C:C2, D:C2 | NEW | `v6CoalitionCandidates` (19415) builds the real offer and discards it. Expand the row, recompute live off `v17Accept` on the actual `UI.coalPick` set. |
| U19 | The deck reaches the government | B:N3, C:C4, D:C9 | NEW | New cards that can touch `st.coalition`, `st.confidence` or `st.coalitionDeals`. Count disputed: A 0, B 1, C 1, D 4. |
| U20 | A partner defects on a division | A:N4, C:C4, D:C6 | NEW | A trapped partner writes `b.lines[pid] = 'oppose'` on a government bill through `v17FloorCore` and stays in the ministry. |
| U21 | A government that can fall | A:N1, B:N5, C:N1, D:C10 | NEW | `v17ConfidenceVote` and `v17Refound` get a second caller. C alone announces it a session ahead with the tally printed. |
| U22 | The restoring drift reads the ledger | B:C5, C:C3, D (implied) | IMP | `pv5CoalitionTick` drags satisfaction 12% toward a floor of 38 while a breach costs 8 to 11, so anything short of three breaches in three sessions is absorbed. |

## Memory and relationships

| # | name | proposed by | kind | mechanism |
|---|---|---|---|---|
| U23 | A party remembers being helped | A:N7, B:N1, C:N3/C5, D:R3 | NEW | The store's clamp goes signed. Container disputed: A/B/D re-sign `a.grudge`, C builds `st.stand`. |
| U24 | A party remembers being governed against | A:I3, B:N6, C:N2, D:R2 | NEW | One emitter and one weight table over statutes carried, bills killed, offices lost, demands refused, freeze-outs. |
| U25 | The chamber reads who is asking | B:N1, C:I4, D:R3 | IMP | `partyBillSupport` (9032) and `assentFavour` (9444) read `st.partyRel`, the player's vector, for transactions the player is not in. 88.2% of engine legislation is refused on it. |
| U26 | The ignored letter is answered | A:I1, C:N2 | IMP | `expireInbox` runs at 10260 inside `politicsTick` (13488), after `tickTurn` (13481) has already run `v19React`. Stamp `st.turn + 1`. |
| U27 | Anticipation and reputation | B:N8 | NEW | `st.playerRead`, a decayed frequency count of the player's habits, read by the tempo, the score and the reservation. |
| U28 | The pact is a two-way door | C:C5 (in passing) | IMP | `pact.run` writes `st.aiPacts[pid]` and never the other side; the refusal is a key lookup; there is no renderer. |

## Choosing and aims

| # | name | proposed by | kind | mechanism |
|---|---|---|---|---|
| U29 | The rehearsal can see what a card did | A:I5, B:I1, C:I3, D:R4 | IMP | Terms for bills in flight, pending amendments, pacts and position; `v17Share*60` becomes `supportTargets(st)[pid]*60`; the `/12` squash re-divided from the measured spread. |
| U30 | The rehearsal settles before it reads | C:I3 | IMP | `v21Settle(clone)` advances bills one stage between the card and the second reading. |
| U31 | A second ply | B:I3 | IMP | One reply from `v19Rival` by argmax, at `sim >= 1.9`, on the top three candidates. |
| U32 | `oust` becomes adoptable | A:I2, B:I2, C:I2, D:R1 | IMP | `fits`, `target` and `done` (34764-34784) ask one question about the government; `done` stamps `g.gov` at adoption. |
| U33 | Every card is priced | A:I4, C:I6, D:C9 | IMP | `V16_AI_COST` (34016) holds 8 of 11 cards; `v19Score` reads `[card.id] \|\| 0`, so three cards are free. One accessor, one table, one coverage arm. |
| U34 | The cabinet legislates | A:I6 | IMP | `aiGovern` (13560) takes `cands[Math.floor(rand()*len)]`; the `bill` card's `v19BillFor` reads a forecast. Government bills fail 68 of 97. |
| U35 | The plan | B:N2 | NEW | `V21_PLANS`, six authored 2-3 step machines indexed by goal kind, with a `V21_STEP` term in `v19Score`. |
| U36 | The reckoning | A:N11, C:N8 | NEW | A reached aim pays (`a.wins`), a failed one names what beat it, and `v19AdoptGoal` weights the successor by `lastGoal.kind`. |
| U37 | The aim clock stops lying | C:N8 | IMP | The goal clock ticks once per initiative (24% of party-sessions), so an aim gets 1.8 to 3.9 observations before an 11-session idle bar retires it. `carry`'s `Math.abs` at 34717 reads a wrong-way move as full progress. |
| U38 | The default level reads | C:I5 | IMP | `V19_DEFAULT_LEVEL` is `purposeful` with `read: 0`, and the panel prints "with the X in the way" ungated while `v19Score`'s rivalry term is switched off. |

## Board, tempo, ballot

| # | name | proposed by | kind | mechanism |
|---|---|---|---|---|
| U39 | Courting is a relationship | A:N10 (`st.blocTie` via `affOf`), C:I1, D:R5 (`st.blocLean` via `appeal`) | NEW | `court` writes a per-party channel; `supportTargets` reads it; `ground.target` re-points at it. |
| U40 | Posture is a state with tenure | A:N5, B:I4, C:I5, D:R6 | IMP | Minimum tenure and `postureSince`; the panel renders live; `consolidate` asks a relative question; `restive` gets a channel that is not the walkout race; `V17_BURN` gets coverage. |
| U41 | The board's temperature moves the budget | B:N9, C:I6, D:R7 | IMP | `v18TempoOdds` (35402) normalises against a fixed `live/V16_AI_CADENCE`, so any multiplier applied to everybody cancels. |
| U42 | The ballot has consequences | A:N6, C:N7, D:R8 | NEW | `runElection` calls no AI function after the count. A post-count pass writes memory, hands `oust` to a party that lost office, and narrates `driftParties`. |
| U43 | A leader changes after two defeats | C:N7, D:R8 | NEW | Through the existing `makeFigure` succession path. |

## Chamber and instruments

| # | name | proposed by | kind | mechanism |
|---|---|---|---|---|
| U44 | The engine works the floor | A:N3 (a `press` card), B:N4 (a verb), C:N4 (a verb) | NEW | `v20PressCore` (38277) already takes an actor and its one caller hard-codes `playParty(S)`. `bill.pull` non-zero in 0 of 22,932 divisions. |
| U45 | The pivot reads the right stage | B:N4, C:N4 | IMP | `v19Pivot` compares `f.lower` against the bar at every rung; `billStageValue(f, stage)` at 9633 does it correctly. |
| U46 | An order goes where it is aimed | A:N9 | IMP | `v17AiOrderFor` returns the first open order in source order and hands `REGIONS[0].id` to slots typed `target:'power'`. |
| U47 | An opponent addresses you more than once | A:N2, C:N6 | NEW | `government_offer` and `opposition_conference` are emitted from two `addInbox` calls, both inside `seedOpeningInbox`. Give them real triggers. |
| U48 | The dossier | C:N5 | NEW | `st.ai[pid].file`, a bounded record ring written by one function, and the Parties card widened into a page a player can form a theory from. |

---

# 2. Scores

Justifications are one sentence each. RISK and COST: 5 is worst.

| # | item | IMP | VIS | RISK | COST |
|---|---|---|---|---|---|
| U1 | Reservation reads the pair | 4 | 3 | 2 | 2 |
| | The posture term fires on 1.7% of accept calls and reads the outgoing government, so deleting it costs nothing and the regard read is what makes formation history-dependent. The formation sheet already prints value against price, so the numbers stop repeating. Two hand-seated boards move. About 15 lines. | | | | |
| U2 | Investiture can be lost | 5 | 4 | 4 | 2 |
| | 360 of 360 formations invested and the vote is arithmetically forced at the only place it is called, so this is the single lock on the whole rotation. The sheet already renders the tally and the defector count is one line. It moves the only boards where the minority and caretaker branches are exercised. About 35 lines. | | | | |
| U3 | Offer priced and varies | 4 | 4 | 3 | 3 |
| | Exactly 3.00 concessions and 1.00 red lines across 653 offers is a constant wearing the shape of a negotiation. Visible the moment U18 renders the row. `the coalition in writing` reads the `kinds` shape. About 55 lines across two pure functions. | | | | |
| U4 | Department seated | 4 | 5 | 3 | 3 |
| | A party is bought for +9 with a great office and handed nothing, which is `st.court.size` at the coalition table. The Government page already names the party in each office, so the payoff renders itself. `nobody holds two great offices` asserts `doubles === 0` and the install must respect `execSeat`'s rule. About 55 lines. | | | | |
| U5 | Agreement falls due | 5 | 4 | 3 | 3 |
| | Inaction is what a coalition government mostly does with an inconvenient promise, and today inaction is free forever. The deal card already prints each concession's state and gains a countdown. `live up to it, alter it, betray it` pins `betray.broken === betray.outstanding`. About 50 lines. | | | | |
| U6 | A promise can be kept | 5 | 4 | 3 | 2 |
| | Zero credits in 720 sessions means a partner can only ever be disappointed, which is half the reason cohesion only falls. The card's state tag moves through the term. `kept.count === 1 && kept.twice === 1` changes by design. About 45 lines. | | | | |
| U7 | Partner's ladder | 5 | 5 | 3 | 4 |
| | 2 demands and 1 threat per 720 sessions against 762 `party_demand` papers is the owner's complaint stated as a rate. A partner writing to you by name about a statute and a date is the largest change in what the player feels. Re-phases the stream once. About 110 lines with the paper's prose. | | | | |
| U8 | Cohesion reaches the division | 4 | 4 | 3 | 1 |
| | A partner at 76 and a partner at 13 vote identically, so the meter on the card has nothing behind it. The bill forecast moves when cohesion moves. It is a real vote-model change and `a party votes its own manifesto` measures the terms. About 15 lines. | | | | |
| U9 | Membership doors through the model | 4 | 3 | 2 | 2 |
| | 12 capital seats the PNL in an RSF cabinet at a compass distance of 2.31 against a bar of 1.15, which makes every other coalition rule optional. The button carries a title and renders disabled, covered by `no control lies, in any chair`. About 45 lines, no dice. | | | | |
| U10 | One exit, and it recounts | 5 | 4 | 3 | 3 |
| | Four exits disagree and three never set `walkedOut`, which S17g measured as dropping coalition lifespan from 6.6 sessions to 2.1; nothing anywhere recounts the majority. Losing your majority mid-term becomes a bar on the page instead of a log line. Mostly moving existing bodies. About 70 lines. | | | | |
| U11 | Head's verbs stop lying | 3 | 4 | 1 | 1 |
| | The council is +12 cohesion a press with no limit against a walk floor of 12 to 30, so a head with capital makes the entire ledger unreachable at will. Two of the three currently charge for nothing. Covered by the existing chair walk once they carry titles. About 30 lines. | | | | |
| U12 | Junior partner's game | 4 | 5 | 3 | 4 |
| | One of the owner's three named chairs has exactly one coalition decision in it and it ends the game they are playing. Five buttons where there is a paragraph. `the three chairs` and `the floor is open to every chair` widen their inventories. About 100 lines. | | | | |
| U13 | Confidence and supply live | 4 | 4 | 4 | 3 |
| | Two cards advertise a mechanic that has never been entered, and the branch is the least-tested code in the file. A Confidence and Supply card with its own meter and countdown. Depends entirely on U2 and U14 making the branch reachable. About 80 lines. | | | | |
| U14 | The mandate runs out | 3 | 4 | 3 | 3 |
| | On its own this is close to a no-op (see the adjudication); paired with U2 it is what produces a second round with different terms. The sheet already renders every round and gains `kind:'remandate'`. `form.pure.noDice` holds. About 60 lines. | | | | |
| U15 | Kingmakers | 4 | 5 | 1 | 2 |
| | Nothing anywhere computes whether a party is necessary to a majority, and it is the first thing a player of parliamentary games looks for. "Necessary to every majority in this chamber" is the most informative sentence the game could print. Pure, 128 subsets, no existing reader. About 45 lines. | | | | |
| U16 | Engine cordons | 3 | 4 | 2 | 2 |
| | 0 sessions with a cordon in 720, and this is what makes formation depend on politics between the other six parties. The sheet says who will not sit with whom. `v17Eligible`'s signature is read by two pure functions. About 40 lines. | | | | |
| U17 | Formation takes a session | 2 | 3 | 5 | 4 |
| | It buys a caretaker state that has never been entered, at the cost of colliding with `care.bound.max === 3 / forced === 1 / sessions === 3 / carriedOn === 2`, which are pinned literals deliberately not read off the constant. Rejected for S21. | | | | |
| U18 | The sheet is a negotiation | 4 | 5 | 2 | 3 |
| | The sheet is read 66 times a campaign and today it is a seat calculator that discards the offer it computed the answer from. The player can offer more, refuse a red line, trade a department. `v17Accept` is pure and already takes an arbitrary offer object, so this is a rendering change. About 70 lines. | | | | |
| U19 | Deck reaches the government | 5 | 5 | 4 | 4 |
| | The `oust` goal's `worth` table prefers four cards and not one of them can remove a party from a coalition, which is a goal whose progress no card can move. Four new kinds of sentence in the log. Five places in `roads.js` and six tables in `vale.html` per card. About 80 lines per card. | | | | |
| U20 | Partner defects | 4 | 5 | 2 | 2 |
| | `restive` has fired 0 times in 4,320 party-sessions, and a bill of yours failing on your own partner's votes is what a coalition feels like. The division card names the party that broke ranks. Uses `v17FloorCore`'s existing channel. About 45 lines. | | | | |
| U21 | A government that can fall | 5 | 5 | 4 | 4 |
| | 9 government changes in 360 elections and 3 coalition changes between elections in 720 sessions; a majority government is unremovable between ballots. A notice with the tally printed a session before the question is put. `the house removes a government` gains a second caller. About 120 lines. | | | | |
| U22 | Drift reads the ledger | 4 | 3 | 3 | 1 |
| | 12% a session toward a floor of 38 against a breach worth 8 to 11 is the arithmetic behind 49 walkout evaluations and 3 walkouts, so without this U5 and U6 are absorbed. The cohesion number becomes explained by the promise list. About 15 lines. | | | | |
| U23 | Remembers being helped | 5 | 4 | 3 | 2 |
| | 42% of party-sessions and 94% of AI-to-AI pairs sit at 0, so for all of those every helpful thing the player can do is worth exactly nothing to the model. The Parties page says who owes you. `fires.afterKindness === 0` is the poison-proof. About 25 lines for the clamp and reader. | | | | |
| U24 | Remembers being governed against | 5 | 4 | 4 | 3 |
| | 11 `v16Resent` sites and not one legislative or electoral, so 130 sessions of passing the statutes the PNL exists to prevent leave no mark. The memory cell gains a number and a cause. It moves `bar.medianRise`, `bar.maxFall` and `scale.worth`, the tightest coupling in the harness. About 90 lines. | | | | |
| U25 | Chamber reads who is asking | 5 | 4 | 4 | 2 |
| | An identical bill from a sworn enemy and a close ally scores to the same decimal, and 677 of 768 assent decisions were refused on a number about a player who was on neither side. The assent card names who is refusing and why. It touches every bill arm in the file. About 20 lines. | | | | |
| U26 | Ignored letter is answered | 4 | 4 | 2 | 1 |
| | The ignored letter is 63% of the hostility the player generates and the one mechanism that makes a party answer at once is deaf to it. "The FP did not wait for the season to take this up." `a party does not wait for the season` moves upward by intent. About 10 lines. | | | | |
| U27 | Anticipation and reputation | 3 | 4 | 3 | 3 |
| | The reputation half gives the player's own record consequence at every future formation; the prediction half is a decayed frequency count dressed as a model. The sheet says why the price is high. A new container landing on top of nine other new readers of the reservation. About 70 lines. | | | | |
| U28 | Pact is two-way | 3 | 3 | 1 | 1 |
| | One party can sit in several pacts and collect the ballot boost twice, in the deck's least-played card. There is no renderer at all, so the fix needs one. S17m's ruling applied where it was missed. About 20 lines. | | | | |
| U29 | Rehearsal sees the card | 5 | 3 | 4 | 3 |
| | Seven of eleven cards price at exactly minus their own purse cost, so the two top levels systematically advise against every card whose effect resolves later. Visible only as engine parties that legislate. It moves `sim.distinct`, `sim.spread`, `sim.orderSpread` and `steer.shrewd.sim`, and every rate with an open-set denominator. About 60 lines. | | | | |
| U30 | Rehearsal settles | 4 | 2 | 5 | 4 |
| | It would make the reading correct instead of approximately correct, at a per-rehearsal cost inside a function called for every open card at both top levels. Nothing the player can see that U29 does not already give them. The harness is 16m40s and 13 of those minutes are the AI block. | | | | |
| U31 | Second ply | 3 | 3 | 3 | 2 |
| | It is the ladder's missing rung and the top rung currently changes three numbers and adds no behaviour. B's `a.why.expects` sentence is what would make it perceivable. It refines a reading that is broken until U29 lands. About 35 lines. | | | | |
| U32 | `oust` adoptable | 5 | 5 | 3 | 2 |
| | Held 0 times in 720 sessions at the top level, and it is the aim every hostile card in the deck was authored for. "Bringing down the LP" on the Parties page for a campaign. It dilutes `steer.carryOpen >= 40`, which was already 39 at six seeds. About 20 lines. | | | | |
| U33 | Every card is priced | 3 | 2 | 1 | 2 |
| | Three of eleven cards take no purse penalty at all while a 16-cost demand is docked 0.22, and this is the one covered surface in the AI layer with no guard. Visible as an engine that is consistent about money. `v19Score` is not called at `instinct`. About 30 lines. | | | | |
| U34 | The cabinet legislates | 4 | 4 | 2 | 1 |
| | An opposition party with 16% of the chamber legislates better than the cabinet, which has the seats and the +12. An engine government whose programme carries. The roll is drawn first and discarded, so no campaign re-phases. About 10 lines. | | | | |
| U35 | The plan | 4 | 5 | 4 | 5 |
| | It is the most direct answer to "a reason to believe an opponent is pursuing something", and the aim column becomes an itinerary. `V21_STEP` competes with the goal table, which already names the same card as the whole score on 70 to 80% of open sets. About 180 lines with six authored shapes. | | | | |
| U36 | The reckoning | 4 | 5 | 2 | 3 |
| | 86% of every aim formed is abandoned and 33 of 33 completions were replaced in the same call with no pause, reward or log line. "The TVC took the Chancellorship they have been after for thirty sessions." The successor weighting rides an existing draw. About 70 lines. | | | | |
| U37 | Aim clock stops lying | 4 | 3 | 5 | 3 |
| | Poverty of observation retires goals and the page reports it as "going nowhere", which corrupts every completion figure in the intake. Visible as aims that finish. It reads `V19_GOAL_IDLE`, `V19_GOAL_CAP` and the stall predicate, which are the largest single A/B block in the harness at 4,320 driven sessions. About 60 lines. | | | | |
| U38 | Default level reads | 4 | 4 | 3 | 1 |
| | The level almost everyone plays prints "with the LP in the way" over a score that measures 0.71 with the foe and 0.71 without, and S19f's whole reaction layer is dead there for the same reason. An opponent that answers who is in its way. It breaks `rank.purposeful.gain === 0`, an exact zero. About 15 lines. | | | | |
| U39 | Courting is a relationship | 5 | 5 | 4 | 3 |
| | 27.3% of everything the engine does lowers its own projected share on 111 of 140 plays, and the objective and the ballot disagree about the same number. The bloc card says which party each bloc leans toward. It touches the vote model and `affOf` has 16 readers. About 60 lines plus a save field. | | | | |
| U40 | Posture has tenure | 4 | 5 | 5 | 3 |
| | Two of eight postures have never occurred, `consolidate` owns nine of eleven cards behind a door that opens 0.3% of the time, and the printed posture is wrong 30.5% of the time at a median age of ten sessions. A mood that persists long enough to be read and is true when printed. Posture decides the open set, so every rate in S19b, S19c, S19f and S20g has it as a denominator. About 70 lines. | | | | |
| U41 | Temperature moves the budget | 4 | 4 | 4 | 1 |
| | Provoking all six parties gives byte-identical odds to provoking none, so the dominant play is to concentrate hostility on one party. The odds column is already live and starts moving for a reason the player caused. It replaces `ai.budgetHeld` at 1e-6 and it changes `instinct` unless gated. About 30 lines. | | | | |
| U42 | Ballot has consequences | 4 | 5 | 3 | 3 |
| | A landslide and a hung chamber produce the same engine behaviour on the next session, and `moderate` lasts exactly one session on 113 of 113 occurrences. An election that changes the opposition. Needs the `runQueue` override and must spend no dice. About 80 lines. | | | | |
| U43 | Leader changes | 3 | 5 | 3 | 2 |
| | No party ever changes its leader after a defeat; every `makeFigure` site is `newGame`, a succession, or a player action. "The CUP lost 40 seats and their leader with them." It re-phases every campaign if it rolls. About 25 lines. | | | | |
| U44 | Engine works the floor | 4 | 5 | 3 | 3 |
| | 143 opposition bills archived in 300 sessions with 0 passed, and the engine's whole chamber vocabulary is worth 1.9 aye points against the player's 25.2. A statute the player wants fails because the RSF spent three sessions on it. `v20PressCore`'s `shiftPartyRel` is the trap (see the adjudication). About 70 lines. | | | | |
| U45 | Pivot reads the stage | 3 | 2 | 1 | 1 |
| | At committee it counts the Assembly and at senate it counts the Assembly, so the AI's own pivot test asks the wrong number at two of three rungs. Invisible on its own. `billStageValue` already exists at 9633. About 5 lines. | | | | |
| U46 | Order goes where it is aimed | 3 | 4 | 2 | 2 |
| | 66 of 90 orders never signed, all 39 regional ones aimed at `REGIONS[0]`, and 13 of 82 power orders printing "(somnium)" in the Gazette. The Gazette stops printing a lower-case database id. One gate covers the AI path and the player's click. About 50 lines. | | | | |
| U47 | Addressed more than once | 4 | 5 | 2 | 2 |
| | The best "an opponent is dealing with me" moment in the game fires in session 1 and never again, with title, body, three choices and three outcomes all authored. Being addressed by an opponent for the first time since the open. Zero new copy, one emitter, three predicates. About 50 lines. | | | | |
| U48 | The dossier | 4 | 5 | 3 | 4 |
| | The player is asked to have a theory about six opponents from 1.4 log lines a session, 190 distinct sentences and a stale mood. A page you can go to and answer "what is the RSF doing and why do they hate me". It touches eleven existing call sites and a missed one is a silent hole. About 130 lines. | | | | |

---

# 3. Adjudications

## 3.1 The objective function: take the terms, reject the settle

All four propose the same three repairs to `v19Standing` and `v19Outcome`, and
all three are right: add terms for what the party is holding (bills in flight
valued by `billForecast(...).lower` against `v19Bar`, a pending amendment, a
live pact, position closed by `st.push`), swap `v17Share(st,pid) * 60` for
`supportTargets(st)[pid] * 60`, and re-divide the squash from the measured
spread with the measurement in the comment.

C alone adds `v21Settle(clone)`, a narrow tick between the card and the second
reading. Reject it, for four reasons the code settles.

`v19Try` (35214) swaps `Math.random`, `render`, `showSheet`, `hideSheet`,
`toast`, `flash`, `saveAutosave` and `captureUndo`, and nothing else. A settle
that calls `advanceBills` runs the division machinery, `assentFavour`,
`enactBill` and `v17DealEvent` on the clone, which means it runs the political
memory emitter that U24 is about to install. Those writes land on the clone and
are discarded, so the model is safe; every instrument that counts memory writes
is not. That is the exact mistake that made this baseline's first draft 3.8x
wrong, and the merged programme adds three more countable ledgers for it to be
wrong about.

The wall clock is the second reason. `roads.js` runs 16m40s and 13 of those
minutes are the AI block, `v19Outcome` is called for every open card at
`sim > 0`, and the harness drives at `ruthless`. C names this as unresolved and
proposes "bills only" as its fallback, which is the terms approach with a clone
walk in front of it.

Third, the settle answers a question the terms already answer exactly. A bill's
worth in flight is `billForecast(st, b).lower - v19Bar(st, b)`, a pure read
requiring no clone advance. The settle buys precision on a number the player
cannot see.

Fourth, C's own good rider survives without it. C wants `V19_SIMULATING` to
have a reader for the first time. Give it one by making the memory emitter
return early under the flag, and assert that. That is required for U24 anyway.

One correction to A's version of this item. A writes that `affOf` is read by
`v17Utility` at 13715 and concludes that a per-party bloc channel makes the
objective and the ballot agree. Line 13715 reads `p.aff`, the authored table,
directly: `for (var b in aff) u += ((st.blocs[b] || 50) - 50) * (aff[b] || 0) *
1.1`. `v17Utility` does not call `affOf` anywhere. The agreement between the
objective and the ballot comes from the `supportTargets` swap, and only from
it. Do not skip the swap on the strength of A's argument.

Drop the three dead components (`v17Share * 60` is replaced; the +18 for ruling
and the +9 per office moved on 0 of 1,028 rehearsals and are read only inside a
difference where they cancel). Say in the commit that they are deleted because
they cancel, so a later reader does not restore them as tuning.

## 3.2 The second ply: not in S21

B is alone in proposing it, and B's strongest point is correct and worth
recording: the reply runs inside `v19Try`'s clone where `Math.random` is
already swapped and `S` is the clone, verified non-leaking on 504 of 504 driven
calls, so a second ply spends nothing from the campaign's stream.

Defer it anyway. A's ordering argument decides it: a second ply of a rehearsal
that prices seven of eleven cards at exactly minus their own cost buys a more
precise reading of the wrong number. Land U29 in S21, measure the new
distribution of `d`, and open S22 with the ply against a repaired objective.

Take one thing from B now. B is right that `sim` truthiness already gates
`v17AiFloorFor`'s pivot at 38480, so a depth switch keyed on `sim >= 1.9` would
be two clocks for one fact. When the ply arrives it gets its own column in
`V19_LEVELS`. S21 adds a different named scalar for a different reason (3.6).

## 3.3 Party-to-party relation: re-sign the grudge, reject the new matrix

C proposes `st.stand[a][b]`, a new signed container seeded from `dist2` plus
the existing grudge map. A, B and D re-sign the existing store. Re-sign it.

`v16Ai(st)[pid].grudge[against]` is already a per-ordered-pair map with one
accessor, eleven callers and eleven writers. A parallel container computing the
same fact is the defect this file punishes hardest, and the intake itself lists
two live instances (`MOVEMENTS` beside the S17q street, `d.satisfaction` beside
`v17DealScan`).

C's seeding is worse than the duplication. Seeding standing from `dist2` makes
the relation a function of compass distance, and `v17Accept`'s value already
reads compass distance as its own term (`38 - d * 38`, 37459). The same fact
would enter the price twice.

Build it B's way, which is the safest of the four and the only one that keeps
the harness honest:

```
v16Resent:  a.grudge[against] = clamp(... + n, -100, 100)   // was (0, 100)
v16Grudge:  return Math.max(0, a.grudge[against] || 0)      // gains the floor
v21Regard(st, a, b): return -(v16Ai(st)[a].grudge[b] || 0)  // the signed reader
cooling:    injury cools at .6, credit at .4                // credit outlives injury
```

Then opt the readers in one at a time, each poisoned separately. A's version
omits the `Math.max(0, .)` and hands every existing reader the negative half in
one commit. That forces an argued change to `fires.afterKindness === 0`, which
is the one assertion whose staying green is the proof that the injury reader is
untouched. B's shape keeps it green and keeps all eleven grudge literals in
`roads.js` green.

B alone found the rest of it, and I verified it. `grep -n "\.grudge\[" vale.html`
returns exactly four lines: the reader (34071), the writer (34076),
`v18Tempo`'s max (35387) and the panel's cell (36125). The last two must be
routed through `v16Grudge` in the same slice. `v18Tempo` initialises `worst = 0`
and takes the max, so it is correct by accident today, which is what this file's
history is a list of. Route it, and let `roads.js` assert the store has exactly
one reader.

A's largest omission is here. A widens the clamp and stops, and never proposes
that `partyBillSupport` (9032) or `assentFavour` (9444) read the pair. Those two
lines are the biggest single lever in the intake: 677 of 768 engine-to-engine
assent decisions were refused on the player's own relationship number, and an
identical bill from a rival and a friend scores to the same decimal. Take B's,
C's and D's readers.

## 3.4 The tempo budget: change it, and gate it, which nobody did

Three of four propose `budget = live.length / V16_AI_CADENCE * f(mean weight)`
with `f` bounded. A declines on the grounds that the budget is the owner's dial.

Change it. A conflates two things. `V16_AI_CADENCE` is the owner's dial and
stays untouched at the resting rate. The normalisation is a defect, and
`V18_TEMPO`'s own comment states the rule it breaks: "A term belongs here only
if it can tell two parties apart." Under normalisation none of the shipped terms
can, for the board as a whole, because the sum divides them out. The measured
consequence is a strategy exploit: provoking all six parties gives byte-identical
odds to provoking none, so concentrating hostility on one party is strictly
dominant. That is a defect a player can find, and it is the opposite of what a
game about a hostile chamber wants.

Now the thing all three proposers missed. `v18TempoOdds` is not level-gated. It
runs at `instinct`, so `f(w)` as proposed breaks the floor the brief names as
hard. Gate `f` on `v19Thinks(st)`: at `instinct` it returns 1 and the budget is
`live / V16_AI_CADENCE` exactly as shipped. That also reads correctly, since a
board acting on instinct does not get busier because it is angry.

The gate rescues the assertion too. `ai.budgetHeld` at 1e-6 stays as the
`instinct` leg, unchanged, as the floor guard. Above `instinct` it becomes two
new gates (resting rate with all weights forced to 1, and a bounded ceiling)
plus the arm the old one could not carry: provoke all six and the total rises.
That is a better outcome than the replacement all three proposed.

One rider, and A is right about it against B and C. `V18_TEMPO.broke` is keyed
to `V16_AI_COST.demand` (16) and its comment claims that is "under the cheapest
card in the deck" while `floor` costs 12. B and C want it derived with
`Math.min` over the deck. Deriving it changes 16 to 12 and the tempo is not
level-gated, so that moves `instinct`. Keep the literal, fix the comment, and
put `v16CardCost` behind `v19Score`'s purse penalty only, which is level-gated
because `v19Choose` short-circuits at `sharp <= 0`.

## 3.5 Deck cards: 11 goes to 13, and two of D's four are not cards

A adds one card (`press`), B one (`bargain`, legislative), C one (`coalition`
with four verbs), D four (`bargain`, `defect`, `topple`, `broker`). The right
answer is two, and it is assembled from three of the four designs.

`topple` is required. A tries to hang the confidence motion on a branch inside
`demand`'s `run`. Reject that: `demand` carries entries in `V16_AI_COST`,
`V19_RIVAL_WORTH`, `V19_TEMPER_AXIS` and every goal's `worth` table, all authored
for writing a letter, so a toppling branch would be priced as a letter and would
be chosen by weights that mean something else. CLAUDE.md's borrowed-type rule
applies to cards as squarely as to papers. Take D's card.

`bargain` is required, in D's coalition form. B's `bargain` is a legislative
card trading bill lines, which is a different card wearing the same name; it is
good and it is S22's, because the coalition ask is what answers the owner's
complaint. One card, one Core, and the player's junior verb calls the same Core.

`defect` is not a card. A places it inside `v16RedLineTick`'s session sweep and
that is right: a partner voting against the government is a consequence of a
cohesion state, and it has to fire whether or not the party won the tempo die.
Build D's `v21Defect` as a Core called from the sweep and from the junior's
button, with no deck entry.

`broker` waits. Confidence and supply has never been entered in play. Give it a
live state (U13) first and let `bargain` reach it; a fourth card whose branch has
never run is decoration.

`press` is not a card. C is right and A is wrong: `floor` already dispatches on
`support`, `oppose` and `pressure` through `v17AiFloorFor` into `v17FloorCore`,
so `press` is a fourth verb in an existing dispatch. A's argument, that `floor`
refuses a bill the party has already declared on so the two must be sequential,
is an argument for opening `v17FloorWhy` to the sponsor for `press`. It is not
an argument for a twelfth card.

The floor cost per card, verified: `V16_AI_COST`, `V19_RIVAL_WORTH`,
`V19_TEMPER_AXIS`, at least one `post:` array, the goals' `worth` tables, plus
`six.deck === 11`, `six.cardWorks === 11` and one line in the `moved` chain at
roads.js:4235. Four covered-surface gates name anything missed.

And the constraint nobody stated: `v19Choose` picks uniformly among open cards
at `sharp <= 0`, so any new card changes `instinct` by construction. Both new
cards get `can` gated on `v19Thinks(st)`. The `instinct` deck stays eleven and
the floor holds.

## 3.6 The `instinct` floor and the coalition constitution

A and D both raise this and both read it the same way, and they are right. The
brief's floor governs the opponent's competence. It does not govern the
constitution of the republic. `v17Rotation` reads no `aiLevel` today and it is
dice-free and pure. It runs identically for the player and for an engine, and
the player sits inside it. Gating the investiture on the AI setting would mean a
player on `instinct` plays a different republic from a player on `ruthless`,
which is a worse outcome than a floor that moves.

So promises falling due, departments being seated, votes counting members, one
exit that recounts, and `joinCoalition` going through `v17Accept` apply at every
level. This is a reading, and it belongs to the owner. If they rule the other
way the fallback is one predicate in `v17Accept` and one in `v17Invest`, and
nothing else in the programme changes.

What is gated is D's fourth scalar, and D is alone in proposing it. `V19_LEVELS`
grows `bargain` at 0 / 0 / 1 / 1.6. It gates the kingmaker read in the
reservation, the timing of the partner's ladder, which concession gets extracted,
and whether a `topple` mover counts the house before it moves. At `bargain: 0`
the promises still fall due and nobody plays any of it well. That also gives the
top rung a behaviour, which answers the finding that `shrewd` to `ruthless`
changes three numbers and adds nothing.

The guard is an arm on the existing `rank.instinct.gain === 0` pattern: drive at
`instinct` and assert every coalition cunning term measures exactly zero.

## 3.7 The mandate cap: right mechanism, overstated by all three proposers

B, C and D all set `V17_FORM_MAX = 3` and all three say it makes the other three
rotation branches reachable. Check that against the measurement. 354 of 360
formations settled in the first round, so capping the rotation at three
formateurs can change at most 6 of 360 outcomes. On its own it is close to a
no-op.

What makes round one fail is U2 (the investiture counting members), U3 and U1
(acceptance getting dearer and history-dependent), and U16 (cordons). Take
`V17_FORM_MAX = 3` as a rider on those, and take the two mechanisms that
actually produce failure, both of which are D's alone: `V21_INVITES = 3` per
formateur, so a formateur can fail with a willing partner still sitting in the
chamber, and a re-mandate round at raised generosity, so round four is the same
RSF asking the same SD again having conceded what it would not concede in round
one. That is the thing the formation sheet has never been able to say.

Set the target share of `majority` outcomes from the driven distribution, in the
assertion's own words. Do not pick it.

## 3.8 The investiture's member count must be symmetric

A's mechanism scales only the coalition side: `aye += n * partyDiscipline` and
`abstain += n * (1 - discipline)`, with the opposition's `nay` left at full
seats. `partyDiscipline` returns .25 to .97 (9122, verified), so a bare-majority
coalition at 653 of 1305 with discipline .6 puts 392 ayes against up to 652
noes. Every majority coalition would lose. That is 360 of 360 inverted, which is
the same class of error as a threshold picked by eye.

Scale both sides through `partyDiscipline`, keep S17f's abstention rule
(`d > .62 || g >= 30`) untouched so that arm holds, and measure the resulting
failure rate before pinning it.

## 3.9 The plan: reject the mechanism, take its result

B's `V21_PLANS` is the most ambitious idea in the four designs and the most
direct answer to "a reason to believe an opponent is pursuing something across a
campaign". Reject it for S21 anyway.

`V21_STEP` in `v19Score` sits beside the goal table's `worth` term, and the goal
table already names the same card as the full seven-term score on 70 to 80% of
open sets. Two hand-authored tables answering "which card serves this aim" is a
parallel mechanism in the one function where the intake says the existing table
is already doing all the work. B's own risk note concedes that `V21_STEP` has to
be sized against the goal table and that `subordinate.temperCeiling <
goalCeiling / 2` binds it.

The three things a plan buys arrive from cheaper items already in the merge:

- an aim that survives across sessions, from U37's clock;
- an aim whose successor follows from the one just reached, from U36's successor
  weighting on the existing draw;
- an aim that ends in an instrument, from U32 plus `topple`.

If the owner still wants an itinerary printed after S21, it is S22's first item
and it will then have real steps to name.

Take B's guard regardless, because it is the best guard idea in the four
designs: a step's `done` must be reachable, driven, by the card it names. Merge
it with C's finding that `V20_AIM`'s comment claims it checks the named verb
reads the aim while the assertion only checks the table's keys. One guard, both
fixes.

## 3.10 Anticipation: take the reputation, drop the container

B's `st.playerRead` is nine numbers with three readers and its own decay,
landing on top of nine other new readers of `v17Accept`'s reservation. The
prediction half is a decayed frequency count presented as a model, and B's own
risk note says the S20e gate it would move will move for unrelated reasons.

The reputation half is the good part and nothing else in the four designs
supplies it: a player who has broken coalition agreements should be charged more
at every future formation, by every party, including ones they have never
governed with. Build that with no new field. U5 makes `broken` entries a real
count on the player's governments; `v17Accept`'s reservation reads that count.
Same behaviour, one existing reader, nothing to backfill.

## 3.11 Courting: write into `affOf`, not into `appeal`

A writes `st.blocTie[pid][bloc]` and reads it in `affOf` (812). C and D write
`st.blocLean` and multiply it into `appeal` inside `supportTargets`
(11509-11511). Take A's placement.

`affOf` has 16 call sites, verified. Writing the channel there reaches
`supportTargets` (11494), `blocTarget` (11101, 11102), the movement read (11409),
`v11InfluenceTarget` (33013) and the interest-group seed (16059) from one write.
Multiplying `appeal` reaches one of them. The concept is that a party's affinity
with a bloc becomes a thing the party can move, and `affOf` is where affinity
lives.

The blast radius is the cost, and it is real: 16 readers including event card
bodies. Name every one in the assertion and poison the read.

Two riders. A gates the write on the level ("above `instinct` the card writes
the tie; at `instinct` it writes `st.blocs` exactly as it shipped") and C and D
do not. A is right and this is a legitimate competence gate, since `court` is an
engine card. And the extremism re-centring at 11513, where `max(0, 60 - m)` is
zero against a measured mean bloc mood of 66.3, so the term never fires in play,
belongs to the owner. A flags it and proposes no number. Do the same.

## 3.12 `v20PressCore`'s `shiftPartyRel`: C's finding, and it blocks A and B

Verified at 38296: `if (!isOwn && k.rel) shiftPartyRel(st, pid, dir * k.rel);`.
`st.partyRel` is the player's vector. Opening `v20PressCore` to an engine actor
without changing that line means two engines arguing over a bill move the
player's relations with parties they never spoke to, which is the `attack` and
`pact` defect reproduced exactly. A's `press` card and B's press verb both open
the Core and neither names the line. C names it and routes it to the signed
regard when neither party is the player. That rider is mandatory.

## 3.13 Formation takes a session: defer

C alone. It buys a caretaker state that has been entered 0 times in 360
formations, and it collides directly with `care.bound.max === 3 / forced === 1 /
sessions === 3 / carriedOn === 2`, which are pinned literals deliberately not
read off `V17_CARETAKER_MAX` (CLAUDE.md's rule about a count parameterised by
the constant it checks). C says so itself. It is a slice of its own and it sits
downstream of everything else in the overhaul. Defer to S22.

## 3.14 The narrator and the bookkeeper are two functions

C's `v21Emit` appends a record, routes it to the log, news or inbox by weight,
and writes the memory, "so a record and a grudge cannot drift apart". Split it.
`v21Emit` narrates and `v21Answer` books. Merging them means one covered surface
answering two questions, and the coverage arms differ: the narrator's guard is
"every card's `run` produces exactly one record", the bookkeeper's is "every act
with an emitter has a weight and every weight has an emitter". Keep both, keep
them separate, and have `v21Emit` call `v21Answer` where an act does both.

Both return early under `V19_SIMULATING`, and that is what finally gives the
flag a reader.

---

# 4. What all four missed

Read against the intake index and the twelve reports. These are findings with
measured numbers that no design addresses.

**Three player-side gates read the wrong party.** `v11ArtSupport` awards its +20
sponsorship bonus to `playParty`
instead of the article's actual sponsor, poisoned and confirmed at 95.01 falling
to 64.01 when repointed. `v11ConTick` docks the player's capital for engine
failures. The pending panel's Withdraw button carries no owner test at all, so a
player can delete any engine's article for 3 unity and revoke any engine's order
the same way. Not one design proposes fixing any of the three. They are the
cheapest high-certainty defects in the intake and two of them are exploits
against the AI the slice is about.

**The court has never sat.** `v17Docket` was empty in 720 of 720 sessions and
`v17CourtTick` raised zero rulings; forced by hand the machinery works on the
first tick, so the preconditions are the whole defect (9 of 81 articles qualify,
all entrenched, none any party's nearest). The bench beside it is a die roll,
since `courtWith` collapses sixteen justices to a count. No design touches it.
An entire authored subsystem is dark.

**`v17AiArticleFor` never reads the party's wants.** `var want =
PARTY[pid].wants` is written and never read; the picker takes the nearest
article on the compass, gives an identical choice per party on all six seeds at
turn 1, and has laid 21 distinct articles of 81 ever. `charter` is the one goal
whose named target never reaches its verb. A fixes the order picker and nobody
fixes the article picker, which is the same defect in the same shape one function
away.

**`bill.lines` has ten occurrences and zero renderers.** The `floor` card writes
it on 69 plays and `MAP.md` calls it "printable on the card". Three designs use
`b.lines` as the channel for a partner defecting and none of them makes it
visible. Same family: the order record's `by:actor` has no reader anywhere, and
the pending-article card never names who laid it. This is the cheapest
visibility in the whole intake and all four walked past it.

**Nothing outside the parties is an actor.** Zero AI reads of foreign powers,
treaties, sanctions, interests or movements. In 300 sessions: 5 street demands
and 0 carried, 0 strikes against a peak pressure of 50.2 versus a bar of 58,
movements peaking at 27.3 against their own threshold of 55, and 58 of 60
interest demands ignored at no cost at all. A defers it explicitly and names the
`envoy` card as the next slice's first item; D touches `st.interests[g].relation`
in one sentence. It is a fifth of the intake and the merged programme leaves it
where it is. That is defensible for one slice, and the owner should be told so
in the plan.

**The prose.** 1,128 sentences across six campaigns, 190 distinct, 58 (5.1%)
naming the player, one sentence appearing 80 times. Only C treats this as a
deliverable. A programme that adds fourteen behaviours and no sentences ships a
better engine saying the same 190 things. `docs/PROSE-STYLE.md` and
`tools/rungs.js --corpora` exist; every slice below owes prose to them.

`addInbox` shifts at more than 6 papers. The shifted paper is stamped `lapsed`
and archived without ever passing through `expireInbox`, so no memory is booked
on that path and a player who lets the inbox fill is invisible to the opponent
model. Only C names it, as a guard on its own item. With U24 installed it
becomes a hole in the memory emitter's coverage and it has to be closed there.

**The `demand` card's inbox post.** It posts unconditionally at 34581, so a
player sitting in opposition receives letters addressed to "the government". C
names it; nobody fixes it. It is two lines and it is in the path U7 and U47 both
touch.

**The seed count three arms print.** roads.js 9478, 10316 and 10678 say "eight
seeds" over code that drives fourteen. Only C names it. An S21 slice quoting them understates its
own sample by 43%, in the direction that caused S20f.

---

# 5. The recommended programme

Twelve slices, one PR each. The count of deliverables against the brief: 14 new
behaviours and 12 improvements, every one of them with a named reader, a named
surface and a poison.

Ordering rules used. Anything nine other items read goes first even when it is
cheap. Anything that moves the open-set denominator of every measured rate goes
last, because the arms in between are measured against that population. Anything
whose mechanism a later item would rewrite is not built early merely because it
is safe.

## S21a: the regard, signed

The foundation. Nine later items read it.

- Relax `v16Resent`'s clamp to (-100, 100); `v16Grudge` gains `Math.max(0, .)`;
  `v21Regard(st, a, b)` is the signed reader.
- Route the two raw `.grudge[` sites (35387 `v18Tempo`, 36125 the panel) through
  `v16Grudge`, and assert the store has exactly one reader.
- Asymmetric cooling, credit outliving injury.
- New signed readers, each gated on `v19Thinks` and poisoned separately:
  `partyBillSupport` (voter to sponsor when neither is the player),
  `assentFavour` (holder to sponsor, keeping `loyalty` as the weight),
  `v16PactPartner`.
- `V17_MEMORY` gets the sign arm and the reverse-coverage arm, which catches
  `radicalise` (a weight naming a verb that does not exist) and `defect:
  {self:18}` (a verb that hands a party 46 seats and makes it resent the player).
- U28: `pact.run` writes both sides, the refusal reads both, `roads.js` asserts
  both directions, and the pact gets its first renderer.

Items: U23, U25, U28. Assertions: `fires.afterKindness === 0` stays green as the
poison-proof; a sponsor swap across seven parties produces at least three
distinct scores for one voter against the measured one; the assent refusal rate
falls from 88.2% into a measured band, driven.

## S21b: what a party holds against a government

- `v21Answer(st, kind, actor, target, w)` and `V21_POLITICS`, covered in both
  directions, gated on `v19Thinks`, returning early under `V19_SIMULATING`.
- Six writers: a statute carried away from a party's `wants`, a bill of theirs
  voted down, an office lost at `execContest`, a demand refused (including by an
  engine government), a freeze-out at `v17Install`, and the ballot in S21i.
- The ignored letter's +14 comes down below the median deliberate provocation of
  13.4, because they are currently identical.
- U26: `expireInbox` stamps `a.provokedAt[player] = st.turn + 1`.
- The `addInbox` overflow path routes through the same memory exit.
- U32: `oust`'s three predicates ask one question about the government, and
  `done` stamps `g.gov` at adoption.
- Fix `V20_AIM`'s guard so it checks the named verb's body reads the aim.
- Re-sweep `bar.medianRise`, `bar.maxFall`, `bar.clearShare` and `scale.worth` in
  this slice, at 14 seeds, with the figures in the assertions' own words.

Items: U24, U26, U32. This slice has the widest coupling in the programme and it
goes second because U32 and every later hostile behaviour depend on it.

## S21c: the rehearsal can see what a card did

- Four terms in `v19Standing`: bills in flight, a pending amendment, a live
  pact, position closed by `st.push`.
- `v17Share * 60` becomes `supportTargets(st)[pid] * 60`; the ruling +18 and the
  office +9 are deleted with the reason in the commit.
- The squash divisor and clamp are re-set from the re-measured spread, with the
  measurement in the comment.
- U33: `v16CardCost(id)`, one table over all cards, `V17_AI_COST_*` become
  aliases, and the coverage arm `harness.md` says is missing.
- `V18_TEMPO.broke` keeps its literal and gets a corrected comment.
- U34: `aiGovern` reads `v19BillFor` above `instinct`, with the roll drawn first
  and discarded so the dice count is unchanged.
- U45: `v19Pivot` reads `billStageValue(f, bill.stage)`.

Items: U29, U33, U34, U45. This is the largest single mover of the card mix and
it goes early so later arms are measured on the new population.

## S21d: the agreement bites

Coalition, 1 of 4.

- `V21_DUE` sized from the instrument the answer has to use, with the arithmetic
  in the constant's own comment.
- `v21DealClock` inside `v16RedLineTick`'s sweep is the only thing that books an
  overdue breach. The paper reports the clock and never decides it.
- Per-rung `V17_KEPT` with `c.from` stored at signature; one concession drawn
  from a small gap so one promise is reachable inside a term.
- U22: `pv5CoalitionTick`'s restoring drift reads the ledger, so a partner with
  two broken promises stops recovering.
- U8: `partyBillSupport`'s flat +12 becomes a reading of `d.satisfaction`, scaled
  from the measured cohesion distribution (min 20, median 38, p90 48.1, max 76)
  so the sign flips inside the range the game produces.
- U11: council cooldown reading `lastCouncil`, portfolio checks before it
  charges, programme writes `d.terms.redLines`.

Items: U5, U6, U8, U11, U22. Named casualty: `live up to it, alter it, betray
it` at 5909, re-derived for progressive credit.

## S21e: the table is a negotiation

Coalition, 2 of 4.

- `v17Offer(st, lead, pid, co, generosity)`: varying concession count, priced by
  the invitee's gap and the formateur's `v17Friction`, red lines entering the
  value.
- U4: the offer names a department, `v17Install` seats it, taking it back books
  a breach, `terms.portfolios` is deleted and `d.portfolios` becomes the field
  the offer writes.
- U1: delete the posture term; the reservation reads `v21Regard`.
- U15: `v21Kingmaker(st, pid)`, pure, 128 subsets, filtered by
  `V17_UNBRIDGEABLE`, computed once per formation, read into the reservation
  behind the `bargain` scalar. It installs no field: a read must not create.
- U2: the investiture counts members symmetrically through `partyDiscipline`,
  with S17f's abstention rule untouched.
- U14: `V17_FORM_MAX = 3`, `V21_INVITES = 3`, and a re-mandate round at raised
  generosity.
- U18: the sheet expands each candidate row into the real offer, recomputed live
  off `v17Accept` on the actual `UI.coalPick` set.
- The driven `st.formation.how` distribution arm, with the `runQueue` override.

Items: U1, U2, U3, U4, U14, U15, U18. Named casualties: `a plurality is not a
government` and `a caretaker holds office`, both re-derived. `form.pure.noDice`
must stay green, so nothing here rolls.

## S21f: one exit, and the partner speaks

Coalition, 3 of 4.

- U10: `v21Leave(st, pid, why, actor)` called by all five paths; sets
  `walkedOut`, books one ledger entry (not one per unmet concession, which takes
  `v17Broken` straight to `V17_PATIENCE` and permanently disables renegotiation),
  and recounts the majority.
- U9: `joinCoalition` calls `v17Accept` and refuses with the sentence
  `v6CoalitionCandidates` already writes at 19423; `expelPartner` recounts.
- A `checks/run.js` ratchet at zero on writers of `st.coalition` outside
  `v17Install` and `v21Leave`. Static, under five seconds, and it is the only
  guard in the four designs that catches "four ways to leave and they disagree"
  before a playtest.
- U7: `d.press` runs null to asked to insisting to threatening, driven by the
  ledger. `coalition_ultimatum` is its own paper type with its own choices and a
  `V18_PAPER_NEED` entry. The ladder and the paper types are covered in both
  directions.
- The producer's two existing `rand()` calls are hoisted into one block at the
  top so the draw count is constant whichever branch fires, then the coalition
  branch gets its slot. This re-phases the stream once, deliberately.
- U20: `v21Defect` as a Core, called from the sweep when a partner under its
  walk floor cannot afford to leave.

Items: U7, U9, U10, U20. After this slice, re-sweep `tools/pacing.js` at six
seeds with the mean quoted and the spread beside it.

## S21g: a government that can fall

Coalition, 4 of 4, and the keystone.

- Two deck cards, `topple` and `bargain`, `can` gated on `v19Thinks` so the
  `instinct` deck stays eleven. Full coverage: `V16_AI_COST`,
  `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS`, a `post:` array, the goals' `worth`
  tables, `six.deck`, `six.cardWorks`, and two lines in the `moved` chain.
- `notice_of_motion` posted a session before the question is put, printing the
  tally the mover currently counts. One owner of the date, so `expireInbox`
  cannot clear the notice before the motion fires.
- `v21Confidence(st, mover)` counts members and gives `v17ConfidenceVote` and
  `v17Refound` their second callers. A failed motion costs the mover.
- U13: `d.terms.confidence = 'supply'` becomes the enum's second live value, with
  concessions, dues, a recurring price and a withdrawal that clears
  `st.confidence` and puts the government in front of the vote.
- `confidence_threat`'s `renegotiate` answer calls `v17Renegotiate` instead of
  making a cabinet member the supply party.

Items: U13, U19, U21. Driven with the `runQueue` override, 14 seeds. Pins:
motions moved, at least one carried, government changes between elections against
the measured 3 in 720.

## S21h: the junior partner's game

- Five verbs on `v17MyDealCard`, each sharing a Core with the engine's verb from
  S21f and S21g: ask for a concession, ask for a department, withhold the whip
  (`v21Defect`), publish the disagreement, threaten to withdraw.
- `V18_PAPER_NEED` gains the junior routing, so a junior sends and receives.
- Every one driven by a real click from the junior chair, with one predicate
  answering for the button, the handler and the fold that hides them.

Items: U12. `no control lies, in any chair` with its content arm, plus a driven
arm per verb. `the party board has a tempo` requires a cooldown and an escalating
price on each.

## S21i: the ballot has consequences, and an aim finishes

- `v21AfterBallot(st, before, after)` from `runElection` after `driftParties`
  (11970) and before `v17Form` (11977), gated on `v19Thinks`, spending no dice.
- The biggest loser resents the biggest winner through `v21Answer`; a party that
  lost the government is handed `oust` against whoever took it; `ai.seatsAtLastBallot`
  is written beside `lastSeats` so `moderate` reads a defeat instead of a
  session; `driftParties` gets narrated.
- U43: a party beaten twice replaces its leader, deterministically (the
  highest-standing figure in its own field), because a roll here re-phases every
  campaign from the first replacement onward.
- U36: `a.wins` counts reached aims and `v19Score` reads it; a completion writes
  a log line and a chronicle entry; `v19AdoptGoal` weights the successor by
  `lastGoal.kind` on the existing draw; `lastGoal.by` names what beat a failed
  aim.
- U37: the goal clock ticks per session, or the idle bar is expressed in
  observations; `carry` credits partial progress and the `Math.abs` at 34717 is
  fixed; `charter` records `g.laid`.
- Delete `V19_GOAL_STALE` (34900) and `k.short` (36155), both read by nothing.

Items: U36, U37, U42, U43. Named casualty: `a party votes its own manifesto`,
whose three-run 12-seed clock A/B is the largest single block in the harness and
whose six readings move together. Re-derive it in this slice.

## S21j: courting is a relationship

- `st.blocLean[pid][bloc]` written by `court.run` above `instinct`, decayed
  slower than the national reversion, floored, backfilled empty by
  `enrichState`.
- Read in `affOf` (812). All 16 `affOf` readers named in the assertion and the
  read poisoned.
- `ground.target`, `progress` and `done` re-point at the lean, which is what
  makes the aim reachable: the steady-state lift on `st.blocs` is +3.0 against a
  requirement of +14.
- The bloc card names which parties hold standing and how much.
- The extremism re-centring at 11513 is measured and put to the owner with no
  number proposed.

Items: U39. Read `supportTargets(st)[pid]` either side of a real `court.run`,
never `st.blocs`; assert the sign is positive for an opposition party against
the measured -1.08%.

## S21k: the engine works the floor, and is seen doing it

- U44: `press` as a fourth verb inside `floor` through `v17AiFloorFor`;
  `v17FloorWhy` opens the sponsor's own bill to the sponsor for `press` and a
  purse-priced whip equivalent.
- `v20PressCore`'s `shiftPartyRel` at 38296 routes to `v21Regard` when neither
  party is the player. Mandatory, and it is the reason this slice cannot be
  merged into S21c.
- `pressure`'s bar re-set against the measured support distribution (p10 17,
  median 43 to 49, p90 74), or the branch is deleted.
- The visibility all four missed: `bill.lines` gets a renderer, the
  pending-article card names who laid it, and the order record's `by:actor` gets
  a reader.
- U47: `government_offer`, `opposition_conference` and `coalition_review` get
  real triggers and fire again; `cross_party` picks its sender by regard and aim
  instead of `others[0]`; the `demand` card stops posting to the player's inbox
  unconditionally.

Items: U44, U47. Pins: `bill.pull` non-zero on a measured share of divisions
against 0 of 22,932; opposition bills passed against 0 of 143.

## S21l: the board's temperature, and the mood the page prints

Last, because posture decides the open set and every rate in S19b, S19c, S19f
and S20g has an open-set denominator.

- U41: `budget = live.length / V16_AI_CADENCE * f(mean weight)` with `f` bounded
  and gated on `v19Thinks`. `ai.budgetHeld` at 1e-6 survives untouched as the
  `instinct` leg. Above it, two gates plus the arm the old one could not carry.
- The grudge and purse terms become graded, so a grudge of 35 and a grudge of
  100 stop weighing the same.
- U40: posture gains a minimum tenure and `postureSince`; the panel renders
  `v16Posture(S, p.id)` live and `a.posture` becomes "last acted as";
  `consolidate` asks a relative question (largest party outside the government);
  `restive` gets the trapped-partner channel, where a breach a partner cannot
  afford to leave over converts to grudge instead of to cohesion; `V17_BURN`
  gets a coverage arm over the eight posture strings, since its reader falls
  back to a flat .7 for an unknown one.
- U38: `purposeful` gets a measured non-zero `read`, so the sentence the page
  prints at the default level becomes true and S19f's reaction layer starts
  working there.

Items: U38, U40, U41. Named casualties: `ai.budgetHeld` (argued, and the
`instinct` leg kept), `rank.purposeful.gain === 0` (an exact zero this
deliberately breaks), and the four open-set denominators, re-measured before and
after inside this slice so a later one does not discover them.

## The dossier

U48 is real and it is the answer to "5.1% of engine sentences name the player".
It does not fit as a slice of its own without duplicating surfaces that S21b,
S21i and S21l each add. Build it incrementally: each of those three slices adds
its own records to `st.ai[pid].file` and its own rows to the Parties card, with
`v21Emit` written in S21b and the coverage arm ("every card's `run` produces
exactly one record, and a record whose verb is not in the deck reddens") growing
with the deck. The widened card is finished in S21l.

## If it has to shrink

Cut S21j (`court`) first: it is a vote-model change with the widest reach and
the least coalition content, and the `ground` aim survives one more slice unmet.
Cut S21k second. Do not cut S21d, S21g or S21b. Without the date the agreement
is a wish list, without the motion the government still cannot fall, and without
the memory no engine wants it to.

---

# 6. Hard-constraint flags

Things in the four designs that break a rule in the brief or in CLAUDE.md, and
what the merge does about each.

**The tempo change breaks the `instinct` floor.** `v18TempoOdds` is not
level-gated, so B's N9, C's I6 and D's R7 all change `instinct` as written. None
of the three names it. Gate `f` on `v19Thinks` (3.4).

**Any new deck card changes `instinct` by construction.** `v19Choose` picks
uniformly among open cards at `sharp <= 0`, so the eleven-card deck is part of
the floor. A, B, C and D all add cards and none of them says so. Gate each new
card's `can` on `v19Thinks` (3.5).

**The posture bars change `instinct`.** `v16Posture` runs at every level, so
moving `consolidate`'s bar or adding tenure moves the floor. Gate the new
predicates on `v19Thinks`, or put it to the owner with the coalition-constitution
ruling in 3.6. Nobody flagged this.

**`V18_TEMPO.broke` derived from the deck changes `instinct`.** B and C both
propose deriving it. A is right to refuse. Keep the literal (3.4).

**The political memory emitter must check `V19_SIMULATING`.** With U24 in place,
every rehearsal that replays `enactBill`, `failBill` or `execContest` on a clone
runs the emitter. The writes are discarded with the clone, and any instrument
counting them is 3.8x wrong, which is how this baseline's first draft was
written. `v21Answer` and `v21Emit` both return early under the flag, and
`roads.js` asserts it.

**A field with no reader.** `terms.portfolios` is written in three places and
read in none; B offers "deleted, or repurposed" and D decides. Delete it, and
make `d.portfolios` the field the offer writes so the negotiated number is the
number `pv5CoalitionTick` reads. `V19_GOAL_STALE` and `k.short` go the same way.
Every new field in the merge names its reader: `st.blocLean` to `affOf`,
`d.press` to the paper emitter and `topple`'s eligibility, `ai.wins` to
`v19Score` and the reservation, `ai.seatsAtLastBallot` to `v16Posture` only,
`g.gov` to `oust.done` only, `st.ai[pid].file` to the dossier and the coverage
arm.

**A read must not create.** `v21Kingmaker` runs inside `v17Accept`, which runs
inside `v17Build` for every invitee, which the formation sheet also calls on
every render. It must be pure and install nothing. If it is too slow, memoise on
a value derived from the seat vector; never write a field. This is `v6TreatyRows`
waiting to happen, and neither B nor D says it.

**A read must not roll.** Nothing in the rotation may draw a die
(`form.pure.noDice`). `v21Kingmaker`, the offer pricing, `v21DealClock`,
`v21Confidence` and the investiture's member count are all arithmetic. C's leader
change and D's leader change both risk a roll; make it deterministic (3, S21i).

**One deliberate re-phase, and only one.** The paper producer's slot change.
D's hoist (both existing `rand()` calls moved into one block at the top so the
draw count is constant whichever branch fires) reduces it to a single reorder.
A, B and C all propose the slot change and only D proposes the hoist. Take it,
and re-sweep `tools/pacing.js` at six seeds afterwards with the mean quoted,
treating any before-and-after gap smaller than one build's seed-to-seed spread as
a reshuffle.

**Hand-kept lists that need a guard.** `V16_AI_COST` total over `V16_AI_DECK`;
`V17_BURN` total over the eight posture strings; `V21_POLITICS` failing on an act
with no weight and on a weight with no emitter; the press ladder against
`V18_PAPER_NEED` in both directions; the `st.coalition` writer ratchet in
`checks/run.js`; the grudge store having exactly one reader; a record's `verb`
being in the deck or the verb table.

**Assertions this programme changes**, each argued in its own PR. `live up to
it, alter it, betray it` (progressive credit). `a plurality is not a government`
and `a caretaker holds office` (hand-seated boards re-derived). `the house
removes a government` (member counting, plus a second leg for an engine mover).
`the coalition in writing` (`myTerms.confidence` names both values). `ai.budgetHeld`
(split, with the `instinct` leg kept intact). `rank.purposeful.gain === 0` (an
exact zero, deliberately broken). `a party is after something` (`sim.distinct`
and `sim.orderSpread` re-pinned upward). `the six that are not yours act` (deck
11 to 13). `a party votes its own manifesto` (the clock A/B re-derived).
`fires.afterKindness === 0` stays green, and staying green is the proof.

**Three arms to fix while they are open.** roads.js 9478, 10316 and 10678 print
"eight seeds" over code that drives fourteen. An S21 slice quoting them
understates its sample by 43%.

---

# 7. Where each design was wrong

Recorded so the plan does not inherit the errors.

A. `v17Utility` does not read `affOf`; line 13715 reads `p.aff` raw, so A's
central claim about the two models agreeing rests on the `supportTargets` swap
alone (3.1). A's investiture member count is asymmetric and would invert 360 of
360 (3.8). A declines the tempo fix on a reading that conflates the cadence dial
with the normalisation defect (3.4). A never proposes that `partyBillSupport` or
`assentFavour` read the pair, which is the largest lever in the intake. A hangs
the confidence motion on a branch inside `demand`, which borrows a card's whole
weight table (3.5), and proposes `press` as a twelfth card when `floor` already
dispatches on verbs (3.5).

B. `V21_PLANS` is a second table answering the question the goal table already
answers (3.9). `st.deals` and `st.playerRead` are two more new containers on top
of it. B's legislative `bargain` and D's coalition `bargain` are different cards
sharing a name, and B's is the one to defer. B misses the `instinct` floor on
the tempo and on the new card. B's grudge engineering is the best in the four and
the merge takes it whole.

C. `st.stand` duplicates a per-ordered-pair map that already exists and seeds it
from a distance term `v17Accept` already reads (3.3). `v21Settle` costs the
harness's largest wall-clock item for precision the player cannot see (3.1).
`v21Emit` merges the narrator and the bookkeeper into one covered surface
answering two questions (3.14). C alone found the `shiftPartyRel` trap, the
`addInbox` overflow exit, the "eight seeds" arms and the notice-before-the-motion,
and all four are in the merge.

D. Four deck cards where two are cards, one is a Core and one should wait (3.5).
`V17_FORM_MAX = 3` is presented as the lever and is close to a no-op alone (3.7).
D's non-coalition half is thinner than the other three and it says so. D alone
proposed the `bargain` level scalar, the `checks/run.js` coalition ratchet, the
roll hoist and the re-mandate round, and all four are in the merge.
