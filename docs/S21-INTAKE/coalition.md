# coalition

## What it does today

At every election `runElection` calls `v17Form` (11977), which runs `v17Rotation`
(37583): a pure, dice-free rotation that asks each party in seat order to build a
majority, then tries three minority governments propped by confidence and supply,
then one grand coalition, then gives up and installs a caretaker. Each invitation
is an `v17Offer` (37430) of portfolios, two `adopt` concessions, one `refrain`
concession and one red line, answered by `v17Accept` (37455), which compares a
value built from ideological distance, grudge and relative size against a
reservation price built from the invitee's own size. Between elections the
agreement lives in `st.coalitionDeals[pid].terms`, and `v17DealScan` (35668)
debits cohesion when the government moves a red line or touches a `refrain`
statute. The player sees all of it in `v6CoalitionDialog` (19471) at formation and
`pv5CoalitionPanel` (16860) afterwards, and if they lead the government they get
five buttons to manage each partner.

The machinery is real and almost none of it is reachable. Of the four rotation
outcomes, one fires. Of the two ledger verdicts, one fires. Of the eleven ways
`st.coalition` can be written, ten need the player to press a button.

## Findings

### Round one asks every party, so rounds two, three and four are unreachable — decorative

- **What:** `v17Rotation`'s first loop is `for (i = 0; i < order.length && i < V17_FORM_MAX; i++)` (37586). `order` is `v17ByWeight(st)` (37414), which is every eligible party. `PARTIES` holds exactly seven entries (758 to 801) and `V17_FORM_MAX` is 7 (37381), so the cap never binds and **every party in the chamber gets a majority attempt**. The minority round at 37596 is reached only when all seven attempts fail. One attempt fails only when `v17Build` (37502) has asked every other eligible party in the pool (`for (var i = 0; i < pool.length && have < maj; i++)`, 37510) and the accepting parties still hold fewer than 653 of 1305 lower-house seats.
- **Evidence:** `v17Rotation` at 37583 to 37618; `V17_FORM_MAX` at 37381; `PARTIES` at 758; `v17Build`'s pool loop at 37510; `v17Majority` at 37405.
- **Why it matters:** the party positions are laid out on a line: `p.home = { e: p.order / 3 - 1, a: p.auth }` (804), so neighbours sit 1/3 apart on the economic axis. Against `V17_UNBRIDGEABLE` of 1.15 (37388), each party can sit with at least two others and the five parties from RSF to CUP form a near-clique (RSF to FP is 1.05, LP to CUP is 1.03, SD to CUP is 0.83). For round one to fail, every one of the seven bridgeable neighbourhoods would have to hold under half the chamber at once. The opening board (`seats: { rsf:65, lp:261, sd:209, fp:254, cup:183, tvc:157, pnl:176 }`, 8536) does not come close, and neither does anything the ballot produces from it. That is the exact reason for 360 of 360 `majority`.
- **Upgrade:** the rotation should not be a search that always succeeds. Give the formateur a **budget**: a fixed number of sessions or invitations, so a formateur that has burned its attempts hands the mandate on whether or not it could theoretically have found a partner. Add a cost to being asked and refusing (a party that refuses twice is out of the round). Make round two reachable by making acceptance expensive rather than by hoping for a freak chamber.

### The investiture vote cannot be lost where it is held — decorative

- **What:** `v17Invest` is called at 37588 only as `r.have >= maj ? v17Invest(st, r.co, null) : null`. Inside, `aye` sums `st.seats[p.id]` for every member of `co` (37569), so `aye === r.have >= floor(1305/2)+1 = 653`. `nay` is at most `1305 - aye = 652 < aye`. `invested: aye > nay` (37574) is therefore arithmetically forced for every majority coalition. A formateur short of a majority never holds a vote at all; it gets `vote: null` and `if (v && v.invested)` (37591) simply falls through.
- **Evidence:** `v17Invest` at 37565 to 37575; the call guard at 37588; `v17Majority` at 37405; `CFG.seats: 1305` at 404.
- **Why it matters:** the abstention rule and the `d > .62 || g >= 30` predicate at 37572 decide only how the non-government seats split between `nay` and `abstain`, and that split cannot change the outcome when `aye` already exceeds half the house. Those two lines have a live effect in exactly two places: the minority round at 37600, which is unreachable, and the player's own "Form this government instead" path at 19538 and 19575. So in 360 formations the tally printed on `v17RoundLine` (19444) is decoration on a foregone conclusion. `roads.js` at 5540 proves the abstention rule works, on a hand-built chamber (`board({ pnl:430, rsf:400, tvc:200, lp:120, sd:80, cup:50, fp:25 })`) that the ballot cannot produce.
- **Upgrade:** make the investiture a real division. Count members rather than parties: read `factionAverage` and `partyDiscipline` so a coalition with poor internal loyalty can lose members on the floor. Let a party that accepted the offer still abstain if its caucus is unhappy. Then a majority coalition can be defeated by its own back benches, which is the only way this vote ever becomes interesting.

### Every offer is the same offer, and the offer is not in the price — shallow

- **What:** `v17Offer` (37430) takes `wants = pv5TopWants(pid, st, 4)`, makes `cs` from `wants.slice(0, 2)` as two `adopt` records (37438), appends exactly one `refrain` from `v17Friction(...)[0] || wants[3]` (37439 to 37442), and sets `redLines: wants[2] ? [wants[2].id] : []` (37447). Every party's `wants` table carries five or six statutes (763, 769, 775, 781, 787, 793, 799) and `pv5TopWants` (16020) returns one row per want present in `POL`, so `wants[0]` through `wants[3]` always exist. Three concessions and one red line, with no branch and no dice.
- **Evidence:** `v17Offer` at 37430 to 37448; `pv5TopWants` at 16020; `v17Friction` at 35625; the seven `wants` tables at 763 to 799.
- **Why it matters:** `v17Accept`'s value line is `38 - d * 38 - grudge * .32 + (offer.share || 0) * 46 + ((offer.concessions || []).length) * 5 + (offer.offices ? 9 : 0)` (37459 to 37462). `concessions.length` is always 3, so that term is a constant `+15`. `offer.redLines` never appears in the value at all. Which statutes are on the table changes nothing about whether the party sits down, and the player never sees them: `v6CoalitionCandidates` (19415) builds a real offer and then reports only `value`, `reservation` and a refusal string (19421 to 19425). Note also that the code and its own comments disagree: 37427 says "two concessions off its own list of wants" over a function that makes three, and 37528 says "a bar lowered by fourteen" over `V17_SUPPLY_RELIEF = 22` (37389).
- **Upgrade:** price the offer. Value each concession by the invitee's own gap on that statute (the number `pv5TopWants` already computes) and by how much it costs the formateur (`v17Friction` gives the disagreement directly). Let the number of concessions vary. Put the red line into the value as a discount the formateur pays for accepting a constraint. Then the player can trade a cheap promise for an expensive one and the negotiation has a decision in it.

### The reservation reads size, and one of its three terms is measured against the wrong government — shallow, inconsistent

- **What:** `res = 30 + v17Share(st, pid) * 70 + (post === 'attack' ? 16 : 0) + (v17Weight(st, pid) > v17Weight(st, lead) ? 22 : 0) - (relax || 0)` (37485 to 37486). Nothing about the offer, the coalition's composition, the number of partners, the departments, the term length or the party's history moves it. `v17Share` divides by `v17House` (37400), which is 1605 with an elected Senate, so a party with 15% of the Assembly prices itself at roughly 44, which is the measured median.
- **Evidence:** `v17Accept` at 37485; `v17Share` at 37403; `v17House` at 37400; `v16Posture` at 34116.
- **Why it matters:** the `post === 'attack'` term is read through `v17PostureOf` (37422) into `v16Posture` (34116), which branches on `st.ruling` and `st.coalition`. `v17Form` runs at 11977, after `driftParties` at 11970 and before anything writes the new government, so `st.ruling` and `st.coalition` are still the **outgoing** ones. A party furious at the government that just lost the election charges everyone +16, including the party about to replace it, and a party sitting in the old cabinet is priced as `partner` no matter who is now asking. The one relationship term that does read the two parties at the table is the player's, at 37476 to 37479, and it is worth at most nine points either way.
- **Upgrade:** make the reservation a function of the relationship between these two parties. Read `v16Grudge(st, pid, lead)` on the reservation as well as on the value. Add a memory of the last coalition: a party that was expelled or that walked out charges more to sit with the same formateur again. Compute the posture against the formateur being asked, not against the incumbent.

### An office promised at the table is never delivered — decorative

- **What:** `v17Offer` returns `offices: share >= .22 ? 1 : 0` (37445), which is worth `+9` in the value at 37462. `v17Install` (37623) copies `portfolios`, `concessions`, `redLines` and `confidence` into the agreement (37647 to 37650) and does not copy `offices`. Nothing else reads `offer.offices`. `d.terms.offices` is written only at 16096 from `st.exec` as it already stands and at 35749 as an empty array, and read only at 16837 to print a tag on the junior partner's card.
- **Evidence:** `v17Offer` at 37445; `v17Accept` at 37462; `v17Install` at 37641 to 37652; the two writers of `terms.offices` at 16096 and 35749; the one reader at 16837. Grep run: `grep -n "terms\.offices\|offer.offices"`.
- **Why it matters:** a party is bought for nine points with a great office and then handed nothing. `st.exec` is set by `execContest` (12012) on its own eight-year cycle and by `pv5CoalitionAction('portfolio')` (16752), neither of which consults the coalition agreement. This is `st.court.size` again: a number written into the state and consulted by nobody.
- **Upgrade:** `v17Install` should seat the offered offices. `execSeat` and `v17OtherOffice` already exist, so give the offer a **named department** rather than a count, and have the install write `st.exec` for it. Then a portfolio is a thing to argue over, and taking it back is a breach.

### `terms.portfolios` is written in three places and read in none — decorative

- **What:** `v17Offer` computes `portfolios: Math.max(1, Math.round(share * 6))` (37444). `v17Install` writes it to `d.terms.portfolios` (37647). `pv5EnsureState` writes it (16097) and `v16RedLineTick` writes it (35749). Nothing reads it. The number the cards print and the satisfaction tick reads is `d.portfolios` (16312, 16853, 16862), a separate counter incremented only by the "Trade an office" button at 16752.
- **Evidence:** grep `grep -n "terms\.portfolios"` returns 16097, 35749 and 37647, all writes. `pv5CoalitionTick` reads `d.portfolios` at 16312.
- **Why it matters:** the measured "mean portfolios per offer 2.27" is a number the game computes, stores, prints nowhere and acts on never.
- **Upgrade:** delete it, or make `d.portfolios` the field the offer writes so the negotiated number is the number the satisfaction tick reads at 16312.

### A concession has no date, so nothing ever falls due — missing

- **What:** every producer writes `due: null`: `v17Offer` at 37438 and 37442, `v17Supply` at 37536, `pv5EnsureState` at 16100 and 16104. `v17Renegotiate` (37807) does not set one either. Nothing in the file reads a concession's `due`.
- **Evidence:** grep `grep -n "\.due\b"` returns the street demand (10138, 39132), the referendum bill (18400, 18409), the crisis arc (18919, 18960), the constitutional article (31624, 31633) and the region registry (28801, 38377). No hit reads a concession.
- **Why it matters:** the government can promise two statutes and simply never lay them, forever, at no cost. A promise with no deadline cannot be broken by inaction, and inaction is what a coalition government mostly does with an inconvenient promise. Compare `V17_STREET_DEADLINE`, which the street's demand does have and which CLAUDE.md records as the model for "the instrument the answer has to use decides the deadline."
- **Upgrade:** give each `adopt` concession a `due` in sessions, counted the way the street's is, sized to the number of sessions a bill actually takes (lay, floor, signature: three). When it passes unmet, book a `broken` entry. That single change turns the agreement from a wish list into a clock.

### `V17_KEPT` cannot be earned, because the credit test asks for exact arrival — inconsistent

- **What:** the `adopt` credit fires only when `off2 = v17Off(st, pid, ref)` is `<= 0.001` (35709), which means `Math.abs((st.pol[ref] || 0) - PARTY[pid].wants[ref])` is zero: the statute has to land exactly on the party's authored want. The concessions are `wants.slice(0, 2)`, which `pv5TopWants` sorts by `gap` descending (16023), so they are the party's two **largest** gaps by construction. `V19_GOALS`' own comment at the `carry` target records that the biggest gap measured 4 on every adoption across twelve seeds, and a bill moves a statute one rung.
- **Evidence:** `v17DealScan` at 35707 to 35716; `v17Off` at 35641; `pv5TopWants` sort at 16023; the `carry` comment above 34690. Measured: 40 ledger entries in 720 sessions, all `broken`, none `kept`.
- **Why it matters:** the breach arm fires on **any** wrong-direction move of a red line (35692) or **any** touch of a `refrain` statute (35703). The credit arm needs four carried bills landing on the last rung and the check catching that particular move. The agreement is a device that can only ever record disappointment, which is exactly the flatness the owner is describing.
- **Upgrade:** credit **progress**, not arrival. Book a `kept` entry and pay `V17_KEPT` for every rung moved toward the promised want, and mark the concession `met` when it arrives. Cap the credit at the concession's own size so a four-rung promise pays four times. Draw at least one of the two `adopt` concessions from a **small** gap so one of them is achievable inside a term.

### Two mechanisms compute cohesion and the weaker one wins — inconsistent

- **What:** `pv5CoalitionTick` (16305) runs every session inside `pv5SessionTick` (16424) and pulls `d.satisfaction` 12% of the way toward `target = 38 + (count ? progress/count * 35 : 12) + (d.portfolios||0)*3 + (st.coalitionProcedure ? 5 : 0)` (16312 to 16313). The floor of that target is 38. `v17DealScan` debits 8 for a broken `refrain` and 11 for a broken red line (`V17_BREACH` at 35592). `v17WalkFloor` (35615) is `12 + Math.min(3, v17Broken(st, pid)) * 6`, so 12 at the start.
- **Evidence:** `pv5CoalitionTick` at 16305 to 16316; `V17_BREACH` at 35592; `v17WalkFloor` at 35615; the walkout test at 35765.
- **Why it matters:** cohesion regresses toward at least 38 at 12% a session while the largest single breach costs 11. From 38, three red-line breaches in three consecutive sessions get a partner to 8.8 and out; anything slower is absorbed. That is the arithmetic behind 49 walkout evaluations and 3 actual walkouts. `d.priorities` (16311) and `terms.concessions` (37648) name the same two statutes, and the tick pays graded credit for approaching them while the scanner pays binary credit for arriving, so the version that never fires is the one the player can read on the card.
- **Upgrade:** one mechanism. Delete the restoring drift or make it read the ledger, so a partner with two broken promises stops recovering. Make the `progress` term of the target a **consequence** of the ledger rather than a parallel measurement of the same statutes.

### Coalition council has no cooldown, and `lastCouncil` is written by two places and read by none — exploitable

- **What:** `pv5CoalitionAction('council')` (16750) costs 3 capital and 2 money, adds 12 cohesion, adds 7 to `partyRel`, and writes `d.lastCouncil = S.turn`. Nothing reads `lastCouncil`.
- **Evidence:** grep `grep -n "lastCouncil"` returns 16068 (a comment), 16089 (the seed) and 16750 (the write). No read.
- **Why it matters:** the walkout floor is 12 to 30 and the button is worth 12 a press with no limit. A head of government with capital can hold a partner at 100 cohesion for the whole campaign, which makes every breach, every red line and the whole ledger unreachable at will. The same button is why the strain warnings at 14301 and 20836 never become anything.
- **Upgrade:** read `lastCouncil`. A council once every N sessions, and diminishing returns on repetition. Better: make the council cost something the partner names (a concession added to the agreement) rather than flat capital.

### "Rewrite programme" writes a red line that the next ensure overwrites — decorative

- **What:** `pv5CoalitionAction('programme')` (16754) costs 5 capital and 3 money and sets `d.priorities` and `d.redLine = (pv5TopWants(pid,S,3)[2]||{}).id`. `pv5EnsureState` runs on every `enrichState` (16142) and at 16112 does `if(d.terms.redLines&&d.terms.redLines.length)d.redLine=d.terms.redLines[0];`, restoring the old value. Separately, `v16RedLineTick` reads `d.terms.redLines` in preference to `d.redLine` (35752), so the scanner never consulted `d.redLine` while terms existed.
- **Evidence:** the write at 16754; the overwrite at 16112; the scanner's preference at 35752 to 35753.
- **Why it matters:** the button charges 5 capital and 3 money and its red-line half is reverted before the player can act on it. The `d.priorities` half does work, because `pv5CoalitionTick` reads it at 16311.
- **Upgrade:** write `d.terms.redLines` instead of `d.redLine`, and let the mirror at 16112 do its job. Or, better, make this the place a partner **negotiates** a new red line rather than the place the government picks one for them.

### "Trade an office" charges before it checks there is an office to trade — exploitable

- **What:** `pv5CoalitionAction('portfolio')` (16752) does `if(!pv5Spend(4,0,...))return;` and then looks for `off`, an executive office held by a coalition member other than `pid`. If the coalition holds no other great office, `off` is `undefined`, the `if(off){...}` block is skipped, and the 4 capital is gone with no log line, no toast and no refusal.
- **Evidence:** 16752, single line: the spend precedes the search and the effect is inside `if(off)`.
- **Why it matters:** this is the shape CLAUDE.md names as an enabled control that moves nothing. It renders unconditionally for the head of government at 16862 with no `disabled` and no `title`.
- **Upgrade:** compute `off` first, disable the button with a title when there is none, and only then spend.

### `joinCoalition` bypasses the entire acceptance model — exploitable

- **What:** the party-board verb at 12953 costs 12 capital and its `can` is `!S.banned[pid] && (S.coalition||[]).indexOf(pid) < 0 && !S.cordon[pid]`. The `run` pushes the party onto `S.coalition` (12957). `v17Accept` is never called. `V17_UNBRIDGEABLE` is never consulted.
- **Evidence:** `joinCoalition` at 12953 to 12962; `v17Accept` at 37455; `V17_UNBRIDGEABLE` at 37388.
- **Why it matters:** an RSF government can put the PNL in the cabinet for 12 capital, at a compass distance of 2.31 against a bar of 1.15. The whole point of the rotation, per its own comment at 37383, is that "a model in which every coalition can be bought has no politics in it". Between elections, every coalition can be bought, and cheaply. `expelPartner` (12963) is the same hole in reverse: 8 capital removes anybody with no vote, no cost to the government's numbers and no chance for them to refuse.
- **Upgrade:** route both through the model. `joinCoalition` should call `v17Accept(S, pid, S.ruling, v17Offer(S, S.ruling, pid, co.concat([pid])), 0, null)` and refuse with the same sentence `v6CoalitionCandidates` already writes at 19423. `expelPartner` should trigger a real recount: if the remaining coalition is short of a majority, the government becomes a minority and has to find supply or face `v17Refound`.

### Four ways to leave a coalition and they disagree — inconsistent

- **What:** `st.coalition` loses a member in four player-reachable places and one engine place, and each does something different.
  - `v17Walkout` (35770): sets `d.former`, `d.walkedOut`, calls `v17DealEvent('quit')`, calls `v16Resent(+25)`, logs, adds news, writes the chronicle.
  - `leaveCoalition` (13243): calls `v17DealEvent('quit')` and `v16Resent(+22)` on the leader's branch, but never sets `d.walkedOut`.
  - `expelPartner` (12967): no `v17DealEvent`, no ledger entry, no `walkedOut`. It gets a grudge only through the `V17_MEMORY` table (`expelPartner: { self:22, seen:4 }`, 35970) and the `doAction` wrapper at 35989.
  - `confidence_threat` answered with `dare` (10173): filters the party out of `S.coalition` inline. No `v17DealEvent`, no ledger, no grudge, no news, no chronicle.
- **Evidence:** the five writers listed above; the return branch that reads `walkedOut` at 16080 to 16084.
- **Why it matters:** `pv5EnsureState`'s "a party that comes back signs a new agreement" branch (16080) keys on `d.walkedOut`, so three of the four exits leave a returning partner resuming on the cohesion it left with, which is the exact defect S17g measured as dropping mean coalition lifespan from 6.6 sessions to 2.1.
- **Upgrade:** one exit function. `v17Leave(st, pid, why, actor)` that every path calls, with `why` deciding the news, the memory weight and whether the government keeps its majority.

### No AI party can change a coalition's membership — missing

- **What:** every writer of `st.coalition` outside the formation is a player button or a scenario literal. The complete list from `grep -n "S\.coalition = \|st\.coalition = "`: 10173 (player answers a paper), 11731 (dead `formCoalition`), 12886 (`invite`), 12957 (`joinCoalition`), 12967 (`expelPartner`), 13172 (`merge`), 13258 and 13261 (`leaveCoalition`), 17400 to 17494 and 24843 to 24897 (scenario literals), 35774 (`v17Walkout`), 37625 (`v17Install`). The only engine-side path is `v17Walkout`, driven by cohesion, which fired 3 times in 720 sessions.
- **Evidence:** the grep above; the AI deck at 34320 to 34588, whose eleven cards are `organise`, `campaign`, `court`, `attack`, `platform`, `article`, `order`, `floor`, `bill`, `pact` and `demand`. None of them touches `st.coalition`, `st.confidence` or `st.coalitionDeals`.
- **Why it matters:** the goal `oust` (34761) is defined as "a named party out of the government" with `done: g.ref !== st.ruling && (st.coalition||[]).indexOf(g.ref) < 0` (34784), and its `worth` table (34793) prefers `attack`, `floor`, `campaign` and `pact`. Not one of those can remove a party from a coalition. This is a goal whose progress no card can move, which is CLAUDE.md's own named defect, and the baseline records `oust` held zero times in 720 sessions at `ruthless`.
- **Upgrade:** give the deck coalition verbs. A `bargain` card that posts a real `coalition_demand` with a date and a consequence. A `defect` card that lets a restive partner vote with the opposition on one bill without leaving. A `topple` card that lets an opposition party move no confidence, so `v17ConfidenceVote` (37740) has more than one caller. A `broker` card that lets a party outside the government offer supply.

### Cohesion is invisible to the legislature — shallow

- **What:** `d.satisfaction` is read in exactly three non-display places: `pv5CoalitionTick` at 16314 (it drags `partyRel` toward itself), the walkout test at 35765, and `v17ConfidenceVote` at 37747 (a partner below 30 votes against). `partyBillSupport` (9020) does not read it. Its coalition term is a flat `if (coalition.indexOf(pid) >= 0 && bill.sponsor === st.ruling) score += 12;` (9026), the same 12 whether the partner is at 76 cohesion or at 13.
- **Evidence:** grep `grep -n "satisfaction"`; `partyBillSupport` at 9020 to 9034; the confidence-matter term at 9168.
- **Why it matters:** a coalition on the point of collapse legislates exactly as well as a happy one. The player has no session-to-session reason to care about the meter on the card, and the meter is the only thing the panel shows.
- **Upgrade:** put cohesion into `partyBillSupport`. Replace the flat +12 with something like `12 * (satisfaction / 60)`, floored at zero and going negative below the walk floor. Then a partner you have been breaking promises to costs you divisions before it costs you the government, which is what a real coalition feels like.

### `st.confidence` is a slot with no withdrawal, and the card says it can be withdrawn — decorative

- **What:** `st.confidence` is written at 37627 (`v17Install`), 12951 (the party-board `confidence` verb) and 10171 (the `confidence_threat` "renegotiate" answer). It is never set back to null except by the next `v17Install`. Its only mechanical read is `v17ConfidenceVote`'s abstention at 37751 and `govShare` at 10956. The election report at 14020 tells the player "the `X` supply confidence and supply, and can withdraw them." Nothing can withdraw them. The party-board verb's own description at 12949 says the arrangement will "cost you capital every year"; there is no recurring charge anywhere.
- **Evidence:** the three writers above; `v17ConfidenceVote` at 37740 to 37755; the two sentences at 14020 and 12949. Baseline: 0 sessions with confidence and supply in 720.
- **Why it matters:** two cards lie, and the branch they describe has never once been entered in play.
- **Upgrade:** make supply a **live state with a price**. A supply party charges a concession per session or per budget; failing to pay it withdraws confidence and puts the government in front of `v17ConfidenceVote`. Give the supply party its own agreement entry, its own red line, and its own paper in the inbox.

### `confidence_threat` "renegotiate" makes a cabinet member the supply party — inconsistent

- **What:** 10171: `if (choice === 'renegotiate') { shiftPartyRel(S, from, 11); S.confidence = from; }`. `from` is the coalition partner that raised the threat, and it stays in `st.coalition`. `v17ConfidenceVote` checks coalition membership first (37745), so the `st.confidence === p.id` branch at 37751 is never reached for them and the write is inert in the vote. It is not inert in the UI: the election report at 14020 will then print "It is a minority government" over a majority coalition.
- **Evidence:** 10171; `v17ConfidenceVote` branch order at 37745 to 37752; 14020.
- **Why it matters:** the one answer on the one paper that is supposed to be about renegotiating the agreement does not touch `d.terms` at all. It should call `v17Renegotiate` (37807), which exists and does exactly this job.
- **Upgrade:** replace the line with `v17Renegotiate(S, from)` and pay the capital the card already charges.

### The coalition papers sit behind four gates in a single-slot producer — shallow

- **What:** `politicsTick`'s paper producer (10260 onward) returns immediately if `st.inbox.length >= 4 || (st.turn + st.inboxSeq) % 2` (10261), so it fires at most every other session. It then tries the coalition branch only when `leads(st) && coalition.length` (10268), raises a `confidence_threat` when `st.partyRel[partner] < 27` (10270), and otherwise raises a `coalition_demand` when `partyDemandPolicy` returns something and `rand() < .62` (10276). Each branch `return`s, so faction, governors, street and cross-party papers compete for the same one slot.
- **Evidence:** 10260 to 10289; `V18_PAPER_NEED` at 10005 marks both as `'leading'`.
- **Why it matters:** `st.partyRel[partner] < 27` is nearly unreachable, because `partyRel` has two restoring forces pulling it up: `politicsTick` drags every coalition member's `partyRel` toward `base = 62` at 6% a session (10240 to 10242), and `pv5CoalitionTick` drags it toward `d.satisfaction` at 3.5% a session (16314). That is the mechanism behind 1 confidence threat and 2 coalition demands in 720 sessions, against 762 `party_demand` papers on the same run.
- **Upgrade:** stop gating the coalition on `partyRel` and gate it on the ledger. A partner with an unmet concession past its due date writes a demand. A partner with two broken promises writes a threat. Give the coalition its own producer slot so it does not lose the coin toss to the governors every session.

### `st.partyRel` is the player's relationship only, and it is the whole relationship — shallow

- **What:** `st.partyRel` is a flat map keyed by party id, seeded at 8629 with `p.id === playParty(st) ? 76 : ...`, which is the player's relationship with themselves. There is no party-to-party relationship anywhere. AI-to-AI coalition arithmetic runs entirely on `dist2(ppos(a), ppos(b))` and `v16Grudge` (34071), which is a real matrix but clamps at zero (34076), so there is no positive memory between any two parties.
- **Evidence:** the seed at 8629; `v17Accept`'s player-only relationship term at 37476 to 37479; `v16Resent`'s clamp at 34076; `V17_MEMORY`'s negative entries at 35972 to 35985, which only spend a grudge down.
- **Why it matters:** two parties that have governed together for 103 consecutive sessions (the baseline's longest partner spell) regard each other on formation night exactly as two parties that have never met. There is nothing for a long partnership to build and nothing for a betrayal to destroy.
- **Upgrade:** a `v21Trust(st, a, b)` matrix written by the same places `v16Resent` is written from, plus the ledger: kept promises raise it, breaches lower it, a full term together raises it. Read it in `v17Accept`'s value **and** in the reservation, so a habitual partnership is cheap to renew and a betrayed party is expensive.

### One walkout permanently disarms renegotiation with that party — inconsistent

- **What:** `v17DealScan`'s `quit` arm writes one `broken` ledger entry per unmet concession (35676 to 35678). Every agreement carries exactly three concessions, so a walkout typically writes three at once. `v17Broken` counts them (35604), `V17_PATIENCE` is 3 (35594), and `v17CanRenegotiate` refuses outright at 3 (35800). `pv5EnsureState`'s return branch (16080 to 16084) resets terms and cohesion but explicitly keeps the ledger.
- **Evidence:** 35676, 35604, 35800, 16080 to 16084; `v17WalkFloor` at 35615.
- **Why it matters:** two things follow that nobody chose. The "Reopen the agreement" button is permanently disabled for any party that has ever walked out. And `v17WalkFloor` for that party becomes `12 + 3*6 = 30`, while the returning cohesion is `clamp(st.partyRel[pid], 20, 85)` with a measured median `partyRel` of 33.5, so a returning partner can be within four points of the floor on the session it rejoins.
- **Upgrade:** the walkout should write one `broken` entry, not three, or the ledger should carry an era marker so `v17Broken` counts only the current agreement. Reseed a returning partner above its own walk floor.

### A junior-partner player has no coalition verbs at all — missing

- **What:** `pv5CoalitionPanel` emits the five management buttons only when `leads(S)` (16862), and `pv5CoalitionAction` refuses at 16747 with a matching sentence, so the gate is consistent. What a junior partner gets is `v17MyDealCard` (16834), which is read-only, and `leaveCoalition` on their own party board (13243, in the `mine` branch that begins at 13121). `V18_PAPER_NEED` marks `coalition_demand` and `confidence_threat` as `'leading'` (10005 to 10006), so a junior never sends one either; those papers only ever arrive at a head of government.
- **Evidence:** 16862, 16747, 16834, 13243, 10005.
- **Why it matters:** one of the owner's three named chairs has exactly one coalition decision in it, and that decision is to end the game they are playing. The measured 20.7% `partner` posture describes the engine's parties; the player in that chair has nothing to press.
- **Upgrade:** give the junior partner the mirror of the head's buttons. Demand a concession (posts a paper to the head, or to the AI government, with a date). Threaten to withhold votes on the next bill. Ask for a department. Publish a disagreement, which costs the government authority and costs the partner cohesion. Refuse the whip on one division without leaving. Each of these has an existing channel: `b.lines` (38321), `st.exec`, `st.capital`, `d.satisfaction`.

### The player as formateur picks names and never sees the terms — shallow

- **What:** `v6CoalitionDialog`'s formateur branch (19513 to 19528) renders one toggle button per candidate showing the party name, its seat count, and either "They will sit with you. Worth `value` to them against a price of `reservation`" or a refusal reason. The offer built at 19419 to compute that answer is discarded. There is no control that changes anything about the offer.
- **Evidence:** `v6CoalitionCandidates` at 19415 to 19426; the picker at 19521 to 19527; the two choices at 19539 to 19547.
- **Why it matters:** the sheet the slice was built for is a seat-arithmetic calculator. The player cannot offer more, offer less, concede a statute, refuse a red line or trade a department, so there is no negotiation on the screen, only a selection.
- **Upgrade:** show the offer and let the player edit it. Each candidate row expands into the two `adopt` statutes, the `refrain`, the red line and the office, with the `value` and `reservation` recomputed live off `v17Accept`. That is a small change, because `v17Accept` is pure and already takes an arbitrary offer object.

### Willingness is computed on a two-party offer and the government formed is not that offer — inconsistent

- **What:** `v6CoalitionCandidates` calls `v17Offer(st, me, p.id, [me, p.id])` (19419), so `share` is computed as if the coalition were the player plus that one party. The "Form this government instead" handler (19571) builds `co = [me].concat(UI.coalPick)` and checks only `v17Invest`. It never re-asks `v17Accept` on the real multi-party offer, where each partner's `share` (and therefore its value, its portfolios and its `offices` flag) would be smaller.
- **Evidence:** 19419, 19514 to 19527, 19571 to 19588.
- **Why it matters:** the row says "worth 61 to them against a price of 44" and the deal the player then signs is worth less than 61. It also means `v17Install` is called with `offers:{}` (19581), so no negotiated terms are written and `pv5EnsureState` re-derives them from scratch at 16094. The player's own coalition is the one coalition in the game whose agreement was never negotiated.
- **Upgrade:** recompute the offers for the actual `UI.coalPick` set on every toggle, re-run `v17Accept` for each, and pass the real `offers` map into `v17Install`.

### `st.cordon` and `st.coopted` are player-only and never fire — shallow

- **What:** `st.cordon` is written only by the player's `cordon` and `liftCordon` verbs (12976, 12983). `st.coopted` is written only by `courtLeader` (12739), a party verb at 12908, an event at 13006 and `coopt` at 13077. `v17Eligible` (37409) reads `cordon` and removes a cordoned party from the rotation entirely. Nothing in the rotation reads `coopted`; the only formation code that ever did is `formCoalition` at 11726, which is dead.
- **Evidence:** the writers above; `v17Eligible` at 37407 to 37411; `formCoalition` at 11726. Baseline: 0 sessions with a cordon, 0 with a co-opted party across 720.
- **Why it matters:** the cordon is the game's one statement about a party being untouchable, and no engine party can ever declare one. `coopted` is worth `+6` on a bill vote (9034) and nothing at formation.
- **Upgrade:** let the AI cordon. A party with a grudge above some bar declares one against another, and `v17Eligible` then removes it from that formateur's pool rather than from the whole rotation. That single change makes formation depend on politics between the other six parties, which currently it never does.

### The harness proves the dead branches on chambers the ballot cannot produce — the green run over unreachable code

- **What:** `roads.js`'s "a plurality is not a government" assertion (5495 to 5620) tests the freeze-out on `board({ pnl:500, lp:250, sd:220, rsf:200, cup:60, tvc:50, fp:25 })`, the minority path on `board({ pnl:430, rsf:400, tvc:200, lp:120, sd:80, cup:50, fp:25 })` and the caretaker on `board({ pnl:400, rsf:390, tvc:250, cup:200, lp:35, sd:20, fp:10 })`. Each is written straight into `st.seats` by `v6SetSeats`. All three assert correctly and all three describe chambers with two large extremes and a hollow centre, which the opening board (8536) and the vote model never produce.
- **Evidence:** `tools/roads.js` 5495 to 5620; the seat literals at 5508, 5541 and 5554.
- **Why it matters:** this is CLAUDE.md's "a threshold picked by eye is a mechanic that never fires" with the measurement done on a hand-built state. The harness is green, the code is correct, and three of the four branches have never run in a real campaign. Any overhaul should add an assertion that drives real ballots and asserts the **distribution** of `how`, not only that each branch works when handed a chamber built for it.
- **Upgrade:** add a `roads.js` arm that runs N seeded campaigns and asserts that `majority` is under some share of outcomes, with the measured number written into the assertion's own words so nobody can re-pick it by eye.

### `formCoalition` at 11719 is dead — confirmed

- **What:** its only caller is 11978, `if (!formed) { st.ruling = lead; formCoalition(st, lead); }`. `formed` is `v17Form(st, lead)` (11977), which returns `v17Rotation`'s output object unconditionally, including the caretaker case `{ ok:false, how:'caretaker', ... }` at 37616. Every return path of `v17Rotation` returns an object, and every object is truthy, so `!formed` is false in every build that contains the S17f chunk.
- **Evidence:** 11977 to 11978; `v17Form` at 37686 to 37691; the four `return` statements in `v17Rotation` at 37585, 37592, 37604, 37613 and 37616.
- **Why it matters:** nothing. It is a build-fallback and it should be left alone or deleted, not repaired.

### `V17_FORM_MAX` cannot bite — decorative (minor)

- **What:** `V17_FORM_MAX = 7` (37381) caps the majority round, and `v17Eligible` can return at most 7 ids because `PARTIES` has 7 entries (758 to 801). The "bounded" guarantee in the comment at 37577 is already provided by the party count.
- **Evidence:** 37381, 37586, 37407, 758.
- **Why it matters:** only that a reader takes it for a tuning knob. It is one, if the overhaul makes formateur attempts scarce.
- **Upgrade:** if formation gets a budget, this is the constant to spend. Set it to 3 and round two becomes reachable in ordinary chambers.

## What a rich parliamentary coalition mechanic has that this one does not

**Portfolio allocation the player argues over.** Absent. `v17Offer` returns a portfolio **count** (`Math.max(1, Math.round(share * 6))`, 37444) and an `offices` boolean (37445). The count is stored at 37647 and read by nothing; the boolean is worth `+9` in the value at 37462 and is never persisted. The four great offices are decided by `execContest` (12012) on an eight-year cycle that never reads the coalition, and the one way to move one is `pv5CoalitionAction('portfolio')` (16752), which picks the office itself: `offices.filter(function(o){return(S.coalition||[]).indexOf(S.exec[o])>=0&&S.exec[o]!==pid;})[0]`. Nobody, player or engine, ever names a department at the table.

**A coalition agreement with specific enforceable commitments.** Half present. `terms.concessions` is a real list of `{kind, ref, due, met}` records (37438 to 37442) and `v17DealScan` (35668) genuinely enforces the `refrain` and red-line halves. What is missing is enforcement of the `adopt` half: `due` is always null and read by nothing, and the `met` test requires exact arrival (35709), which produced 0 credits in 720 sessions. So the agreement binds the government's inaction not at all and its action completely.

**Confidence and supply as a distinct live state.** Absent in practice. `st.confidence` exists (37627), the investiture's abstention rule is what buys it (37570), and `v17ConfidenceVote` reads it (37751). It has never been set in play, because the minority round is unreachable, and once set there is no withdrawal path and no recurring price. The election report at 14020 promises the player that it can be withdrawn.

**A partner that can extract concessions under threat mid-term.** Essentially absent. The engine has one card that puts anything to the government, `demand` (34572), and it posts a `party_demand` (34581) whose refusal costs 5 `partyRel` and 5 grudge (10161 to 10163) and does not touch the agreement. The `coalition_demand` paper (10029) and `confidence_threat` (10071), which do carry coalition language, are produced only by `politicsTick` behind the `partyRel < 27` and `rand() < .62` gates at 10270 and 10276, and fired 2 and 1 times respectively in 720 sessions.

**Kingmakers and pivotal parties.** Absent as a concept. `v17Build` walks the pool sorted by `dist2 + grudge/220` (37505 to 37508) and takes whoever says yes until `have >= maj`, then trims from the end (37517 to 37522). Nothing anywhere computes whether a party is **necessary** to a majority. The trim is the closest thing, and it works the other way: it removes parties that turn out not to be needed. A party that is in every possible majority has no way to know it and charges the same reservation as a party in none.

**Red lines that actually forbid something.** Half present. `terms.redLines` is watched by `v17DealScan` (35687 to 35699) and a breach costs 11 cohesion, and that is real. But the red line is `wants[2]`, the party's third-largest gap (37447), drawn from its own table with no reference to the formateur, while the `refrain` concession beside it **is** drawn from `v17Friction` (37439), the statutes where the two actually disagree. MAP.md's own rule at 461 says a red line is a point of friction or it is decoration, and the rule was applied to the `refrain` and not to the red line. Nothing forbids the government laying a bill on a red line: `changePolicy` and `sponsorBill` do not consult `terms.redLines` at all. The red line is a price, not a prohibition.

**Formation talks that can fail and be retried on different terms.** Absent. The rotation is one pass with fixed prices: relax is 0 in the majority round (37587), `V17_SUPPLY_RELIEF` (22) in the supply round (37538), and a hardcoded 20 in the grand round (37554). There is no round in which the same formateur tries again with a better offer. The player's one retry is `v17Reanswer` (19465), which re-runs everything with their own answer pinned, and their answer is a boolean.

**Minority government as a playable condition.** Present in code, unreachable in play. `v17Rotation`'s second loop (37596 to 37607) is the only producer, and it needs all seven majority attempts to fail first. `v17CareBar` (37728) shows what a shipped "restricted government" state looks like and is worth copying; there is nothing equivalent for a minority. A minority government in this file is an ordinary government with `st.confidence` set.

**A partner defecting on a single vote without leaving.** The channel exists and no rule uses it. `v17FloorCore` (38305) writes `b.lines[actor] = verb` for any party, and `partyBillSupport` reads it. `v17ConfidenceVote` is the only place in the file where a partner votes against the government as a **coalition** fact, at `coh < 30` (37748), and it has one caller, the opposition player's action at 12711. There is no cost to a partner for voting against a government bill, no consequence for the government, and no verb by which a player in either chair can make it happen or answer it.

**The player as a junior partner having a distinct game.** Absent. `standing()` returns `'junior'` (10806) and `V18_PAPER_NEED` routes two papers to that chair (10005), and `v17MyDealCard` (16834) writes the agreement in the first person. That is the whole of it. Every coalition verb is `need:'leading'` (12948, 12953, 12963, 13027) or gated by `leads(S)` (16747, 16862). The junior's only lever is `leaveCoalition` (13243).

Two more that the brief did not name and that this code is missing:

**A formation clock.** `v17Rotation` resolves in one call inside `runElection`, so formation costs zero sessions. `V17_CARETAKER_MAX` (3, at 37382) is a clock for the failure case only. Real coalition talks take time, and time is where the pressure comes from.

**Any reason for the government to be the largest party's problem.** `st.ruling` and the `frozenOut` line (12026) are the only place the arithmetic is dramatised, and `v17FormNews` (37659) writes a headline for it. The freeze-out fired 6 times in 360. Everything else about who governs is settled before the player sees a screen.

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `st.formation` | `v17Install` 37630 | `v17MyPart` 19450, `v6CoalitionDialog` 19473, `v17FormationPanel` 37762, `newsFromElection` 19267 |
| `st.coalition` | `v17Install` 37625, `v17Walkout` 35774, `leaveCoalition` 13258/13261, `expelPartner` 12967, `joinCoalition` 12957, `invite` 12886, `merge` 13172, `confidence_threat` 10173, scenario literals 17400 to 24897, dead `formCoalition` 11731 | `standing` 10806, `partyBillSupport` 9024, `v16Posture` 34117, `v17ConfidenceVote` 37741, `v16RedLineTick` 35739, `pv5CoalitionTick` 16306, `govShare` 10954, plus ~20 display sites |
| `st.partner` | `v17Install` 37626, `v17Walkout` 35775, and every coalition writer above | display and legacy readers; `sponsorBill`'s `owner === 'coalition'` branch 9274 |
| `st.confidence` | `v17Install` 37627, `confidence` verb 12951, `confidence_threat` 10171 | `v17ConfidenceVote` 37751, `govShare` 10956, doctrine score 11191, `v17MyPart` 19454, displays 14020/15074/15159/37789. **Never cleared:** grep `confidence = null` returns only the four `confidence:null` object literals in `v17Rotation` |
| `st.caretaker` | `v17Install` 37628 to 37629, `v17CaretakerTick` 37710 | `v17CareBar` 37729, `v17FormationPanel` 37763, `v17CaretakerTick` 37699, `partnerLine` 14018 |
| `st.coalitionDeals[pid].satisfaction` | `pv5EnsureState` 16082/16088, `pv5CoalitionTick` 16313, `pv5CoalitionAction` 16750/16752/16754/16763, `v17DealScan` 35712/35721, `v17Renegotiate` 35825 | `pv5CoalitionTick` 16314, walkout test 35765, `v17ConfidenceVote` 37747, cards 16849/16851/16862 |
| `st.coalitionDeals[pid].terms.concessions` | `v17Install` 37648, `pv5EnsureState` 16099, `v16RedLineTick` 35749, `v17Renegotiate` 35823 | `v17DealScan` 35701, `v16RedLineTick` 35760, `v17MyDealCard` 16838, `v17Renegotiate` 35817/35821 |
| `st.coalitionDeals[pid].terms.concessions[].due` | `v17Offer` 37438/37442, `v17Supply` 37536, `pv5EnsureState` 16100/16104, always `null` | **NONE FOUND.** grep `grep -n "\.due\b" vale.html` returns only street demand, referendum bill, arc phase, article and region registry |
| `st.coalitionDeals[pid].terms.portfolios` | `pv5EnsureState` 16097, `v16RedLineTick` 35749, `v17Install` 37647 | **NONE FOUND.** grep `grep -n "terms\.portfolios" vale.html` returns writes only |
| `st.coalitionDeals[pid].terms.offices` | `pv5EnsureState` 16096 (from `st.exec` as it stands), `v16RedLineTick` 35749 (empty) | display only, `v17MyDealCard` 16837. Never written from `v17Offer.offices` |
| `st.coalitionDeals[pid].terms.confidence` | `pv5EnsureState` 16106, `v16RedLineTick` 35750, `v17Install` 37650 | **NONE FOUND.** grep `grep -n "t\.confidence\|terms\.confidence"` returns writes only. An enum with two values and no reader |
| `st.coalitionDeals[pid].terms.redLines` | `v17Install` 37649, `pv5EnsureState` 16105, `v16RedLineTick` 35749 | `v17DealScan` 35687, `v16RedLineTick` 35752, `v17Walkout` 35771, `v17Renegotiate` 35816, `v17MyDealCard` 16846, mirror to `d.redLine` 16112 |
| `st.coalitionDeals[pid].redLine` (legacy scalar) | `pv5EnsureState` 16089/16112, `pv5CoalitionAction('programme')` 16754 | `v16RedLineTick` fallback 35753, `v17Walkout` fallback 35771, `pv5CoalitionPanel` 16862. The `programme` write is overwritten by 16112 on the next ensure |
| `st.coalitionDeals[pid].ledger` | `v17Ledger` 35601, called from `v17DealScan` 35677/35711/35720 and `v17Renegotiate` 35827, plus `pv5EnsureState` 16083 | `v17Broken` 35606, `v17Kept` 35610, `v17LedgerCard` 35840, `v17WalkFloor` 35616, `v17CanRenegotiate` 35800 |
| `st.coalitionDeals[pid].lastCouncil` | `pv5EnsureState` 16089, `pv5CoalitionAction` 16750 | **NONE FOUND.** grep `grep -n "lastCouncil" vale.html` returns 16068 (comment), 16089, 16750 |
| `st.coalitionDeals[pid].walkedOut` | `v17Walkout` 35776, `pv5EnsureState` 16081 | `pv5EnsureState` 16080 only. Three of the four exit paths never set it |
| `st.coalitionDeals[pid].priorities` | `pv5EnsureState` 16089, `pv5CoalitionAction('programme')` 16754 | `pv5CoalitionTick` 16311, `pv5CoalitionPanel` 16862 |
| `st.coalitionDeals[pid].portfolios` | `pv5EnsureState` 16088, `pv5CoalitionAction('portfolio')` 16752 | `pv5CoalitionTick` 16312, cards 16853/16862 |
| `st.partyRel[pid]` | `shiftPartyRel` 8748 (many callers), `politicsTick` drift 10242, `pv5CoalitionTick` 16314, `v17DealScan` 35713/35722, `v17Walkout` 35777, `v17Renegotiate` 35826, doctrine 10459/10462, `v20PressCore` 38296, `v17FloorCore` 38319/38322 | `partyBillSupport` 9032, `v17Accept` 37478, `politicsTick` gates 10269 to 10276, `pv5EnsureState` seeds 16082/16088, risks 14301/20836, adviser 19795, `v6CoalitionCandidates` 19418, displays |
| `st.coalitionProcedure` | `respondInbox('formal')` 10100, `pv5CoalitionAction('programme')` 16754. Both `= true`, never cleared | `partyBillSupport` 9171 (`+4` on negotiated bills), `pv5CoalitionTick` 16312 (`+5` on the target) |
| `st.cordon[pid]` | player verbs only, 12976 and 12983 | `v17Eligible` 37409, `partyBillSupport` 9033, AI bill score 31388, `v6CoalitionCandidates` 19418, displays. Baseline: 0 sessions with a cordon |
| `st.coopted[pid]` | player paths only, 12739, 12908, 13006, 13077 | `partyBillSupport` 9034, AI score 31389, ballot 11525, dead `formCoalition` 11726, displays. **Not read by `v17Eligible` or `v17Accept`.** Baseline: 0 sessions |
| `st.aiPacts[pid]` | `pact` card 34459 to 34460 | `ballot` wrapper 35545, `v16PactPartner` 34609, cleared at 12007. Unrelated to coalitions; it is an electoral pact between two parties out of government |
| `st.ai[pid].grudge[against]` | `v16Resent` 34076 (clamped 0 to 100), the `doAction` memory wrapper 35998 to 36002, `v17DealScan` 35723, `v17Walkout` 35778, `leaveCoalition` 13256 | `v16Grudge` 34071, read by `v17Accept` 37457, `v17Build`'s pool sort 37506, `v17Invest` 37571, `v16Posture` 34138, `v18Restive` 34114, `oust` 34769. No value above zero means anything positive |
| `st.formation.rounds[].answers[]` | `v17Install` 37636 | `v17MyPart` 19457 only. `v17RoundLine` prints the round, never the answers |

## What I could not verify

- Whether the render path filters party-board buttons through `actionOpen` (13348) before emitting them. I read the gate at 13352 and the two click handlers at 15663 and 19661, which call `doAction` without re-checking, but I did not read the two renderers at 15039 and 15109 in full. S18b's `no control lies, in any chair` walks all fifteen pages from all three chairs, so I expect this is covered; I did not confirm it.
- Whether `pv5TopWants` can ever return fewer than four rows for some party under some `POL` state. Every `wants` table has five or six ids and `POL` is static, so it should not, and the measured "exactly 3.00 concessions, exactly 1.00 red lines" across 653 offers says it does not in practice. I did not check that all 41 want ids appear in `POL`.
- The exact `ppos` drift over a campaign, and therefore whether `V17_UNBRIDGEABLE` starts biting between pairs that begin bridgeable. `driftParties` runs at 11970 before `v17Form`, and `conference` (13144 to 13151) pulls a party back toward its home. I reasoned from the home positions at 804 only.
- Whether `v17Refound` (37797), called after a successful no-confidence vote at 12719, can produce a different government. It re-runs `v17Rotation` on the same seats with the same positions, so I expect it usually reinstalls the same coalition, but the sequence is short enough that grudges and positions may have moved. Unmeasured.
- Whether the `expelPartner` path can leave a government below a majority with no consequence. It writes `st.coalition` at 12967 and nothing recounts; `govShare` (10953) would report the new number, but I found no code that acts on a government falling under half between elections other than the player-initiated confidence vote.
