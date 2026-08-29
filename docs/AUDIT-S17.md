# Did S17 deliver the brief? An audit

The owner asked, after S17 closed and after S18a repaired one of its misses,
whether their original brief was actually implemented. This file is the answer.
It is written to be read cold: every verdict carries the measurement that
produced it and the `file:line` of the live body, so a later session can
re-check any line of it without re-running the audit.

**Method.** Eighteen claims were taken verbatim from the brief. Each was
audited by an agent that drove the shipped build headlessly rather than reading
it, and each verdict was then attacked by two independent verifiers — one on
correctness, one on what a player actually experiences at the controls. 54
agents, 2,724 tool calls. Where a verifier refuted a verdict, the verifier's
finding is the one recorded here, because in every such case the verifier had
driven something the auditor had only read.

**Headline.** The mode system is real and the floor is open. The two claims the
program most loudly announced — richer AI agency, and mutual exclusion — are
the two that do not survive ordinary play.

---

## The scoreboard

| # | The owner's claim | Verdict |
|---|---|---|
| 1 | Opposition decides nothing unless it is their office's event | **PARTIAL** |
| 2 | Ruling party decides national events each turn | **DELIVERED** |
| 3 | Junior partner behaves like opposition for turn events | **PARTIAL** |
| 4 | Opposition can introduce bills | **DELIVERED** |
| 5 | Opposition can introduce constitutional articles | **DELIVERED** |
| 6 | (acts — not named in the brief, checked anyway) | government-only, flagged |
| 7 | An opposition bill has less chance of succeeding | **PARTIAL** |
| 8 | Any party can influence a bill on the floor | **DELIVERED** |
| 9 | Your own bill offers different verbs than another party's | **DELIVERED** |
| 10 | Spending stance / revenue posture / investment priority are ruling-only | **DELIVERED** |
| 11 | Federation options are limited for a non-ruling party | **PARTIAL** |
| 12 | Executive nominations reworked; no doubled offices; live campaign | **PARTIAL** |
| 13 | AI parties have real agency | **DELIVERED DIFFERENTLY** |
| 14 | Coalitions fleshed out and functional | **PARTIAL** |
| 15 | The Hung Assembly bug | **PARTIAL** |
| 16 | Policies and articles that should be mutually exclusive are | **DELIVERED DIFFERENTLY** |
| 17 | The quadrennial article gives quadrennial elections | **DELIVERED** |
| 18 | Implementations respected and reflected everywhere | **PARTIAL** |

Seven clean, eight partial, two delivered as something other than what was
asked, one flagged.

---

## What is genuinely delivered, and proved

**The three chairs are a real gate.** `v17Decides` (vale.html:13243) asks the
strict party question — `st.exec[o] === playParty(st)` — not `holdsDept`, which
asks whether the government holds it. Across 175 driven opposition sessions the
player was asked 8 decisions and every one was at an office their own party
held. Two poisons prove the gate produces that: replacing `v17Route` with
identity yields 66 decisions on the same seed; swapping the strict test for the
coalition test yields 24, all at offices the player does not hold.

**The floor is open from every chair.** From the bench, a real click on the
statute card opens the drafting sheet and lays a private member's bill. From
the bench, 77 of 80 article buttons are live, a click lays one with `by` set to
the player's party, and every remaining button then goes disabled carrying
"Your party already has an article before the country" in its title. One
predicate, card and handler.

**The fiscal gate reads the right question.** `pv5FiscalAction` asks
`modeWhy(S, 'leading')`, so a junior partner is refused as well as an
opposition party, with different words for each. `inPower` would have let a
junior through. It doesn't.

**No person holds two great offices.** 288 driven sessions across six seeds
plus every off-model seating path: zero doubles. Poison-proved — neutering
`v17OtherOffice` puts a double in 67 of 120 sessions.

**The quadrennial article works.** The term extends from `st.lastElection`
rather than re-phasing the calendar, including in the always-broken case of
adopting it the session after a ballot.

---

## What is not delivered, ranked by what it costs the player

### 1. S17 added no AI activity at all

A verifier drove the **pre-S17 build** with the same clicks and the same seeds.

```
seed 424242, player lp, 45 real End-Session clicks
  HEAD      66 initiatives   569 log lines, 123 other-party
  PRE-S17   66 initiatives   547 log lines, 125 other-party
seed 999331, player pnl, 40 clicks
  HEAD      59              PRE-S17  60
```

Aggregate over 85 real sessions: 125 AI initiatives at HEAD against 126
pre-S17. The cadence is a hard budget — `(st.turn + v15Hash(p.id)) % 4`
(vale.html:33655) — and `V16_AI_DECK`, `v16AiTurn`, `v16Posture`, `v16Resent`
and `v16AiPanel` all predate the first S17 commit. S17k's three new cards
(article, order, floor line) **displace** rather than add, and what they
displaced is the player-facing half: attack 16 → 6, demand letters 32 → 16,
campaign 21 → 7.

The one genuinely new, player-visible agency is S17f's formation rotation:
other parties can now refuse to serve and freeze the player out. That is a
coalition-formation model, not AI behaviour.

Two more, both driven: an AI party that sits in someone else's cabinet can
never come after the player, because `v16Posture` (vale.html:33482) returns
`'partner'` before any grudge is read and `attack` is not in the partner
posture's card list. And the panel tells the player "Each of them takes one
initiative a session" (vale.html:34208) when the measured rate is one in four.

### 2. Mutual exclusion is a lay-time speed bump, not exclusivity

`V17_CONFLICTS` (vale.html:36391) holds eleven pairs and every one refuses in
both directions — against a partner that has **already carried**. `v17InForce`
answers `article` with `v11Adopted`, and the only article call site is
`v11CanPropose` at lay time (vale.html:30968). `v11AdoptArticle`
(vale.html:31083) re-checks nothing.

The constitution page prints "3 articles may be laid at a time." Lay both term
articles in the same session — confirmed by real clicks, both buttons enabled,
both with ordinary titles — campaign for them, and both carry. The page then
prints "the Assembly is renewed every 3 years", which is the owner's original
complaint reproduced verbatim with the conflict table installed.

The harness cannot see it: `tools/roads.js:6698` writes the first article
straight into `c.arts` and then asks about the second, so it never lays two at
once.

And the table covers articles and one act. The 582-statute book the owner's
sentence names **first** has no conflict coverage at all: `changePolicy` never
calls `v17ConflictWhy`. Nor do the 60 measures, the 90 orders, or the 20
treaties. The custom-start editor validates article ids and nothing else, so
every original absurdity is reachable from a fresh game.

### 3. The Hung Assembly bug is fixed on one card and live on another

The exec card is genuinely repaired: "In the coalition" and "22% cheaper" do
not appear anywhere out of power on any of the fifteen tabs, and the printed
percentage in power is derived from `deptFactor` and matches what `policyCost`
charges.

But `policyCard` (vale.html:14269) still asks `holdsDept` for a sentence
addressed to the player. On the same session's Policy page, 132 cards show the
caretaker government's own office green and un-opposed while 104 show the
player's own party's office red and "(opposed)" — inverted against the 1.55 /
0.78 the same card charges. `officeMine` (vale.html:10605) is defined twelve
lines away and `deptFactor` already reads it.

The owner's fourth item is also still true in session 1 of that start:
`v17Barred` refuses every draft while 493 of 505 buttons render enabled,
undisabled and untitled. One End Session clears it.

### 4. The drafting sheet undoes S18a's own rule

S18a withheld the whip, the Senate deal, the confidence motion and urgent
procedure from a private member's bill, at the card and at `billAction`. The
**drafting sheet** (vale.html:9038) emits all three strategies unconditionally,
so from the opposition bench:

```
sheet offers:  clean / negotiated / urgent   all enabled, no extra cost
picking urgent: bill.urgent = true, pace 2, forecast 42
clean on the same board:            pace 1, forecast 37
the card handler, three clicks later, refuses 'urgent' with
  "The whip, the Senate deal, the confidence motion and the timetable
   are a government's instruments."
```

A government pays 6 capital for urgency at the card. A private member gets it
free at the sheet, and each ungated sheet button is worth +5 Assembly, against a
whole measured chair penalty of 2.6. The sheet also reads "Introduce a clean
**government** bill" to a player in opposition.

### 5. Two ungated per-session decision surfaces reach a non-ruling player

**The political-paper inbox.** Not routed through `v17Route`, declares no
office, and `politicalInboxPanel` (vale.html:13871) tests only capital and
treasury before enabling a button. It rendered in all 26 sessions of a driven
opposition run, on the landing page. A real click from the bench on "The Fifty
Governors Call for a Conference" moved the national `crown` indicator +13 and
spent the player's capital; another moved it −7 by sending "the responsible
minister", which an opposition player does not have.

**Question Time treats a junior partner as the head of government.** The gate
is `inPower(st)` in both the base and the live v10 wrapper (vale.html:28850),
so a Social Democrat junior is handed the Chancellor's brief to answer, with
the question naming the Federal Party's leader. Identical to the leading chair,
nothing like the opposition chair.

The coalition papers have the same defect: `politicsTick` gates them on
`inPower` (vale.html:9887) with no junior branch, and computes the partner as
`coalition.filter(p => p !== st.ruling)`, which in a two-party coalition is the
player's own party. Measured: 68 coalition demands and 16 confidence threats
written while the player was junior, all `from` the player's own party; zero in
the opposition control on the same seed.

### 6. The statute book has 37 lying buttons on session 1

48 statutes carry `needs:`. `policyOpen` (vale.html:11651) never asks about it,
so the card's locked branch cannot fire and 37 buttons render enabled, priced,
and forecast — and the handler refuses with "Requires X." The order book asks
the identical question and answers it correctly, disabling all 18 of its own.

### 7. The Federation tab still offers everything

The handlers are correctly graded: from opposition, 0 of 14 per-region acts move
the state and no national treasury leaves a non-ruling chair. The **emitters**
were never touched — `rb()` (vale.html:14435), `gb()` (vale.html:19347) and the
V9 splice (vale.html:23438) compute `ok` from cooldown, capital and treasury
only. An opposition player sees 138 of 150 enabled controls, 128 of which flash
a refusal. The tab looks exactly as unrestricted as the owner complained.

Two specific gates are on the wrong side: `assemblySeat` is `'leading'` on a
stated rationale about spending the federal purse when it spends nothing and
writes only party organisers and party machine; `inspect` is `'gov'` while
carrying `money:3`, so a junior partner spends $300B of national treasury eight
times a session.

### 8. The old nomination panel still ships beside the primaries

`vale.html:32817` — the S15i "Your Nomination" panel was never retired. Thirteen
enabled buttons about the same two offices, charging 2 capital and $150B each,
for a choice the primary then ignores for five of seven parties including the
player's. Measured: 0 of 20 seeds honoured it.

The ballot session prints "The next opens **-3** sessions from now"
(vale.html:36084). The "general campaign" the owner asked to be two sessions is
one, and it offers no controls at all: `v17BackCandidate` refuses outside the
primary stage. No per-office spending readout ships, though the plan lists one.

### 9. Coalition enforcement fires mostly on its own defects

23.1% of opening coalitions record a broken promise on the first End Session
with no bill laid, because a statute can be seeded as both a red line and a
refrain concession. A walkout empties `st.coalition` before emitting the event,
so the party that left records nothing and every partner that stayed is charged
a breach per outstanding concession. `terms.offices` is offered and valued but
never installed; `terms.portfolios` and `terms.confidence` are written in two
places and read in none. The head of government is never shown the concessions
the build then punishes them for breaking.

### 10. The harness reports green about three statutes it never tests

`tools/roads.js:6925` exempts `referendums`, `recallElections` and `lobbyingBan`
with `m:'its own'`, an unconditional `return;` and two readers that are
`function(){ return '1'; }` — a constant compared against itself. It then prints
"ALL 24 ELECTIONS STATUTES move the mechanism their own card names (0 that do
not: none)". `recallElections`'s rung is read by nothing in 3.58 MB.
`referendums` gates nothing — the referendum instrument is offered on
`electionsOn(S)` alone, which is the `artPlebiscite` defect S17m fixed for
articles, left standing for the statute one book over.

---

## What this says about the method

Three of these were things the owner had already been told were done. The
pattern is the same one `CLAUDE.md` records from S17b and S18a, and it repeated
inside the slice that named it: **a rule enforced on one surface and not on its
siblings.** S18a withheld urgent procedure at the card and the handler and left
it free at the sheet. S17a fixed the office label on the exec card and left the
same wrong predicate on the policy card. S17b gated the region handlers and
left the region buttons.

The harness missed all three for one reason: every assertion calls a function,
and a player presses a button. `tools/roads.js` "the three chairs" calls
handlers and never asks whether a control is enabled. The conflict assertion
adopts an article directly rather than laying two. The Elections assertion
exempts what it cannot test.

The durable fix is a class of assertion the repo does not have: **for each
chair, every control the game renders is either live and effective, or
disabled and carrying its reason.** Nothing in the current bar asks that, and
it is the question every one of these findings answers with "neither".
