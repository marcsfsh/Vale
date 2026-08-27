# S17 — Three ways to play, and the republic plays back

**THIS FILE IS THE PROGRAM'S ANCHOR. It is written to survive context
compaction: every ruling, finding and decision lands HERE, not in
conversation. At the start of any work session on this program, re-read this
file top to bottom. When implementation begins, this file is committed to the
repo as `docs/PLAN-S17.md` in the program's first commit, and `docs/STATE.md`
points at it.**

Status: PLAN COMPLETE — twelve owner rulings recorded, three research
reports anchored, twenty PRs designed (§Plan). Awaiting plan approval.
On approval: s17a begins, and its first commit adds this file to the repo
as `docs/PLAN-S17.md`.

---

## The owner's brief (2026-08-27, verbatim rulings — NEVER paraphrase away)

### The three modes

> "There's 3 [modes]. 1 - You are an opposition party who is not part of the
> coalition. 2 - You are a junior partner in a coalition. 3 - You are the
> ruling party, either outright or as the head of a coalition."

- **Events/decisions per turn**: opposition should NOT react/decide on
  events/decisions each turn *unless* the event would be handled by an
  executive office the player's party holds. Ruling party decides national
  events each turn. Junior partner: for now, same as opposition — only
  events belonging to offices their party holds.
- **The floor is open to all**: opposition can introduce bills AND
  constitutional articles (lower odds, especially against coalition/ruling
  opposition). ANY party can influence a bill on the floor; the influence
  options differ when it is your own bill vs another party's.
- **Government-only surfaces**: spending stance, revenue posture, investment
  priority must be ruling-party-only. Federation tab: non-ruling options per
  region must be far more limited and reflect non-ruling status.
- **Executive nominations**: current process "doesn't seem right… half
  finished — i've often had situations where i end up with the same person
  holding multiple offices". Wants campaigns that feel alive.
- **AI parties**: "much, much more rich, well-designed, sophisticated 'ai'
  behavior… they should have agency, in the same way that the other
  nations/factions have agency in a Paradox Plaza or Total War game."
- **Coalitions**: "very surface-level feeling… in some cases non functional
  or broken." Bug report: Hung Assembly start as LP → government tab shows a
  FP politician in the VP slot, panel says "in the coalition" / "measures 22%
  cheaper", but the player does not appear to be in a coalition and cannot
  introduce measures anyway.
- **Interconnection**: "some policies and constitutional articles should be
  mutually exclusive but arent. if i pass a quadrennial article for
  quadrennial elections, i still get elections biannually… all of those
  [policies, articles, acts, orders] should be checked to see whether their
  actual implementations are respected and reflected everywhere they should
  be."

### Round-1 rulings (AskUserQuestion, answered 2026-08-27)

1. **Sequencing — ONE MEGA-PROGRAM.** This program absorbs ALL of S16's
   remaining half: g (the court can stop you), h (the street has leverage),
   i (out of power is a place you play from + opposition deck), j (long deck
   folds, focus survives), k (contrast and the thumb), l (prose pass and
   close). One plan covers everything remaining, sequenced internally.

2. **Executive campaigns — primary → general, multi-session, with rules:**
   - Do NOT frame as "offices are won by persons, not parties".
   - Primaries are **toggleable** by the player. (Round-2 question: where
     does the toggle live — game setup, party rule, statute?)
   - A primary typically fields **4 candidates**.
   - Executive offices are elected **quadrennially**; the cycle gives
     **2 turns of primaries then 2 turns of general campaign**. With
     primaries disabled, the player simply picks the candidate before the
     2 general turns.
   - **Caucuses expand**: each party gets **4 unique caucuses** (currently
     only 3 caucuses exist in the whole game). Each caucus puts a candidate
     forward in the primary. The player can (a) influence a caucus's
     strength, which moves its candidate's primary strength, and (b)
     influence a primary candidate directly — so outsiders can genuinely
     win.

3. **Vice offices — the staggered eight-year rotation ("the original
   rules"):** each of the four great offices is elected every EIGHT years;
   elections occur QUADRENNIALLY; each quadrennial election is either
   **President + Vice-Chancellor** or **Chancellor + Vice-President**. A new
   ARTICLE can switch vices to running-mate mode: vices then run attached to
   their principal, and both President and Chancellor are elected the same
   year every 4 years rather than staggered 8.

4. **Coalitions — full negotiation sheet, then a living document:** at
   formation, a visible negotiated deal — offices/portfolios allocation,
   policy concessions, red lines declared, confidence terms. Breaching costs
   cohesion → walkout (S16e machinery). AND after formation the deal stays
   alive: "you can still change it and its impacts can flex. Maybe you
   propose a bill that you promised you wouldn't, or you kill a bill/oppose
   a bill you promised you'd support - or you undermine them in a campaign…
   a coalition is not 'negotiate it and forget it'. its 'negotiate it, and
   then live up to it, alter it, betray it, or some combination thereof.'"

### Round-2 rulings, call 1 (AskUserQuestion, answered 2026-08-27)

5. **Primaries toggle = an in-game party rule**, set on the Parties tab,
   changeable between cycles (not mid-season). AI parties have their own
   dispositions.
6. **Race calendar = continuous 2+2.** The full 4-session cycle is the
   race: sessions 1–2 after the last exec election are the primaries,
   3–4 the general, the vote at the cycle's end. Both offices of the
   contested pair run in parallel.
7. **Opposition turn = Pure + reactions, WITH VARIETY.** The player
   decides only events belonging to offices their party holds; everything
   else resolves by the AI government and arrives as news — but the
   biggest national events also offer the player a REACTION choice moving
   standing/blocs/press, never the outcome. Owner's addition verbatim:
   "but it should not be that flat/stagnant. add variety" — the reaction
   verbs must vary by event, not be a fixed exploit/back/silent triple.
8. **Government formation = full investiture**, with the owner's
   elaboration (verbatim intent): after an inconclusive election, a
   formation window; caretaker with real limits until someone commands a
   majority (or accepts minority with confidence-and-supply);
   no-confidence rebuilt on seat arithmetic + coalition cohesion.
   **Influence in formation is proportional to TOTAL seats held across
   the elected bodies after the partial renewal** (both chambers renew
   only a portion per cycle — it is the resulting composition that
   counts, not seats won that night). **A plurality does not guarantee
   forming the government**: any other combination of parties that
   reaches a majority can coalesce and freeze the largest party out.
   Formation is therefore a genuine multi-party negotiation among ALL
   parties (AI parties negotiate with each other, not only with the
   player).

### Round-2 rulings, call 2 (AskUserQuestion, answered 2026-08-27)

9. **Multi-office: forbid doubles; a party leader MAY hold one office.**
   A person seated in one great office is off every other office's bench —
   at nomination, at succession, and at every off-model reshuffle
   (sackMinister, promoteProtege, events).
10. **AI-government visibility: Gazette digest + news.** A "What the
    government did" section in the session Gazette — decisions, bills,
    orders, appointments in one place, each linking to its reaction where
    the player got one — plus normal inline news items.
11. **Exclusivity: mixed semantics, table for sign-off.** Draft the full
    conflict table with a proposed semantic per pair — some BLOCK (can't
    lay X while Y stands), some SUPERSEDE (adopting X repeals Y, stated on
    the card, at a price). The owner approves/amends the table before it
    is wired.
12. **Dead statutes: ALL THREE options.** (a) Wire Elections + Federalism
    fully to real mechanisms; (b) extend the sweep to every other book,
    book by book, as later PRs; (c) where no honest mechanism exists even
    after the new systems land, re-promising a card is allowed — each
    rewording listed for the owner's explicit approval.

### STANDING AUTHORIZATION (owner, 2026-08-27) — applies to the whole program

> "each letter - e.g. s17a - gets a PR opened and merged when complete. you
> have complete authrity to proceed with the entire plan, and I defer to your
> judgment for all decisions and blockers unless its exceptionally critical.
> you have my approval to run any and aall tools necessary to complete this."

- **Every letter: branch → build → full verification bar → commit → push →
  OPEN a PR → MERGE it.** This supersedes the repo's usual "no PR unless
  asked". Merge into `main`.
- Decisions and blockers are mine to resolve; escalate only something
  exceptionally critical.
- Permission mode is accept-edits; any tool needed is approved.
- The owner is away and will review late in the day. **Do not rush or skip
  work to hit that time** — the bar stands: every mechanic ships with the
  assertion that reddens without it, poison-proved.

### Standing meta-instructions from the owner

- Highly in-depth research first; use it for a **durable** plan that does
  not drift as context is used up.
- Err on the side of MORE AskUserQuestion rounds before writing the plan.
- Ultracode is on; plan mode until the plan is approved.

---

## Known repo facts the plan must respect (from CLAUDE.md / AGREEMENT / this session)

- `vale.html` is the whole app (3.3 MB, never read whole; grep -n + ≤80-line
  Read windows; docs/MAP.md first). Zero external refs. Five width
  thresholds only (420, 760, 761, 1179, 1180) + height 460.
- Saves may break pre-release but only LOUDLY; blob left untouched.
- All randomness through `rand()`; state rides the save.
- Function rebinds need capture+call + `checks/dead-bodies.json`
  adjudication; countdown clocks ask about `st.turn + 1`; per-power lists
  built at END of file; reads must not create; a field written and never
  read is a lie on the card; the cleaner (not the UI) is the validation
  layer; no CSS keyed to colour literals; no bare `text{fill}` in charts.
- Party palette is the owner's; propose changes with tools/seats.js output.
- Harness bar per PR: checks/run.js, tools/roads.js (162 content
  assertions), tools/playtest.js, tools/determinism.js, tools/tiers.js,
  tools/tabs.js; content → tools/rungs.js --check (+ --corpora); balance →
  tools/pacing.js (A/B against main, six seeds — this session's method).
  Every new mechanic ships with the assertion that reddens without it;
  poison-proof the assertion on a scratch copy.
- Prose to docs/PROSE-STYLE.md. The 2,910 audited pieces stay as they are.
- One PR per complete slice, branch `claude/s17<letter>-<name>`;
  docs/STATE.md updated in last commit of every PR. No PR opened unless the
  owner asks (they have historically merged PR-per-slice; confirm at first
  push).
- S16e already built: `st.ai[pid]` {posture, grudge, last, acts, spent,
  lastSeats}, `v16AiTurn` + `V16_AI_DECK` (7 cards: organise, campaign,
  court, attack, platform, pact, demand), `v16Posture`, grudges,
  `st.aiPacts`, red line bites via `coalitionDeals[pid].redLine` +
  cohesion + walkout. S15f: per-party purse. S15i: candidate objects,
  nomination contest, per-office spending (the system the owner says is
  half-finished). S15d: assent/veto/override at the signature.
- Workflow tool is broken in this environment (3 failures). Use Explore/
  general-purpose Agents for fan-out; direct probes via `node - <<'EOF'`
  heredocs with playwright resolved via `npm root -g` + createRequire
  (pattern: tools/roads.js:42-51).

---

## Research (findings land here as agents return)

### Agent A — government, coalitions, gating: DONE (all anchors verified on branch)

**A1. The model.** No government object; five loose fields: `st.ruling` (party
id, default 'lp' :8216), `st.coalition` (array, element 0 = ruling, default
['lp','rsf','sd'] :8218 — invariant assumed everywhere, enforced nowhere),
`st.partner` (vestige = co[1], written by 7 sites, should die into the deal
document), `st.confidence` (confidence-and-supply party, :8251), `st.playAs`
(THE player's party, written once at setup :15812; read via `playParty(st)`
:9980; `UI.setup.party` is start-screen draft only; `myPurse()` :14972).
**The predicate idiom (:9980–9998)**: `playParty` / `standing(st)` =
'leading'|'junior'|'opposition' / `inPower` / `outright` / `leads`.
`standing()` is load-bearing STRING EQUALITY at ~20 sites — comment
:9988–9996 documents what breaks if a fourth value is added. **Modes must be
a view over standing(), not a replacement.** Also: `govShare` :10078,
`execHeld` :9871, `holdsDept(st,dept)` :9897 — reads the GOVERNMENT's
coalition, never the player (root of the exec-panel bug).

**A2. coalitionDeals (S16e).** Shape seeded in `pv5EnsureState` :14556–14565:
`{satisfaction (cohesion, from partyRel clamp 20..85), councils, portfolios,
priorities[2], redLine, lastCouncil}` — only for non-ruling coalition
members; `former=true` flagging :14565. Writers: `pv5CoalitionTick`
:14732–14744 (cohesion converges toward floor-38 target); `pv5CoalitionAction`
:15107–15122 (council +12 / portfolio reassigns a gov office +16 UNCLAMPED /
programme +9 UNCLAMPED / discipline −14 — **measured cohesion 103**);
`v6CoalitionDialog` :17691; `v16RedLineTick` :31994/:32006. Walkout path
:31982–32017 (crossing −11, walkout at ≤12), installed by wrapping tickTurn
at :32018–32022 — THE LAST WRAPPER; ordering matters, dead-bodies.json
indexes wrappers. `redLine` has exactly one consumer (`v16RedLineTick`).
**Missing entirely**: negotiated offices/portfolios, policy concessions as
contract, confidence terms, a deal for a player-as-junior (deals exist only
for the leading party's UI to look at), partner-side agency.

**A3. Formation.** `runElection` :10980–10995 → largest party rules,
`formCoalition` :10785–10799 greedy ideological-distance scan (dist2 ≤ .95
or coopted), no negotiation/refusal/terms. NO hung-parliament path: no
caretaker state, no investiture, no failed formation (Hung Assembly opening
= govShare 0.308 and nothing reads it; fiction says "caretaker", model says
federal). `v6CoalitionDialog` :17657–17720 is the ONLY negotiation — queued
only for the player as LEADING minority (:17538, refusal :17658), negotiates
seats+capital-price only. Model to grow from: `V6_TREATIES`/`v6TreatyWhy`
:16158–16252 — the file's worked example of a negotiated instrument with
terms, prerequisites, drift, floor and lapse.

**A4. Exec offices.** `st.exec = {pres,vpres,chan,vchan}` party ids. Filled
by: scenario literals; `runElection`'s ranked-choice contest on isExecTurn
turns, TWO OF FOUR offices per cycle :10996–11024 (some staggering already
exists — each office won by national winner, independent of coalition);
`acts.consulate` forces all four; coalition `portfolio` button :15112;
`tradeMinistry` :11986–11999. Hung Assembly (`hungAssembly` :15731–15745):
ruling fp, coalition [fp,sd], exec {pres:pnl, vpres:fp, chan:cup, vchan:lp}.

**A5. THE EXEC-PANEL BUG (verified headless).** `viewExec` :13725–13748:
`ours = (S.coalition).indexOf(officeParty) >= 0` — the GOVERNMENT's
coalition, in second-person voice. Strings :13740–13741 ("In the coalition"
/ "Held against you", "Measures 22% cheaper" / "55% dearer"); numbers from
`deptFactor` :10112–10116 (.78/1.55), consumed at `policyCost` :11147.
Probe (Hung Assembly as LP): standing=opposition; FP's VP shows "In the
coalition / 22% cheaper"; the player's OWN party's Vice-Chancellor shows
"Held against you / 55% dearer"; the discount applies to an instrument
opposition cannot use (`changePolicy` refusal :11168); junior ×1.5 at
:11138. Two fixes: label keyed to the player's side; deptFactor keyed to
the player's relationship to the office.

**A6. Gating audit.** Canonical gate `actionOpen` :12256–12263:
`if (!inPower(S) && !a.scope && cat not in [Agenda,Figures]) return false`.
CORRECTLY SHUT (probe-verified refusals): orders :26607/:26653, works
:19915/…, measures (leads) :7456/:7468, treaties :16242, transitions
:12299, chairs (leads) :15057/:15062, region override :16042, bill intro
:11168, sponsorship :8775, order-paper :9179/:9185 (talkOut inverted
correctly :9180), constitutional acts :6367, Question Time (mode-aware
PATTERN to copy) :20361–20447, policy draft buttons :13329.
**UNGATED — all fired from opposition in the probe:**
- Fiscal framework (stance/priority/revenue): `pv5FiscalAction` :15146–15149,
  panel :15321–15326, registry PV5_FISCAL :14454, state :14755. No gate.
- Coalition administration BY OPPOSITION: `pv5CoalitionAction` :15107–15122
  no gate — probe moved vpres fp→sd from opposition; panel :15173.
- Appointments: `pv5OpenAppointment` :14975 guard is
  `!holdsDept && inPower(S)` — the `&& inPower(S)` INVERTS it (plain bug).
  `pv5MinisterAction` (brief/empower/dismiss/…) NO GATE; scandals no gate
  :15184; Ministry tab unconditional :15332.
- Federation: `regionAction` :9543–9556 (visit/grant/compact/inspect) +
  V9_REGION_ACTS :21961–21979 (townhall/taskforce/zone/relief) — treasury-
  paid, cooldown-only. Governor actions `v6GovernorAction` :15984–16057:
  meet/works/autonomyTalks ungated; challenge/campaign/stump correctly
  party-purse; `gb()` :17947–17976 ALREADY computes the fromParty split —
  the natural seam.
- Programme: `v6AdoptProgramme` :16590–16597 no model gate (UI-only :18064).
- Interests: `pv5InterestAction` :15094–15105 no gate (access/distance are
  state acts). Committees: `pv5CommitteeAction` :15081 no gate (chairs only).
- Figures whitelist leaks: `sackMinister` :11739–11750 and `promoteProtege`
  :11707–11723 (guard asks whether the GOVERNMENT holds the office) — probe
  replaced the President's holder from opposition.
- **Scope escape hatch**: `a.scope` stamped at :12230 bypasses the inPower
  gate for ALL party actions — leaks `confidence` :11907 (probe: opposition
  signed C&S on the government's behalf), `joinCoalition` :11912 (probe:
  added tvc to a government it isn't in), `expelPartner` :11922,
  `tradeMinistry`, `drawseats` :11768, `champion` :11771, `audit` :11886,
  `poach` :11873, `byElection` :12028, prosecute/cutFunding/coopt/ban
  :12000/:12018/:12045/:12065.
- `invite` :11821–11864 is the ONE mode-aware action (comment :11829–34 is
  the design brief); `leaveCoalition` :12202–12219 correctly gated — the
  nearest existing betrayal mechanic.
- Tabs: 14 tabs :12660–12672 + splices :15332–15334/:18141, none
  conditional on standing().

**A7. Opposition baseline (mode-1 seed, already present).** Opposition panel
:13011–13017; `oppositionAttack` :11666–11686 (censure / country campaign /
no-confidence — the ONLY no-confidence: succeeds iff approval<42 && lowerSits,
immediate runElection; reads no seats/cohesion); Question Time fully
mode-aware (ask vs answer, 4 opposition verbs) :20361–20447; press office
asymmetric :20278/:20280/:21063; opening inbox branches on standing()
:9326–9352 (opposition_conference :9445, government_offer :9451); campaign
actions party-scoped :15120–15145; 21 own-party actions; bill deck read-only
via `canWork = inPower || b.owner==='player'` :13057; `oppYears` :10432
read by doctrine bonus :10298 and advisors :21093.

**A8. Hazards for the plan.** (1) Hung is not hung — needs caretaker/
investiture state. (2) `st.partner` vestige. (3) coalitionDeals is
single-perspective. (4) standing() string equality — extend, don't replace.
(5) The `!a.scope` escape hatch is where party-action gating must happen.
(6) Figures whitelist leaks two government acts. (7) :14975 inversion is a
plain bug fixable immediately. (8) Unclamped cohesion +16/+9. (9) The only
negotiation refuses two of three modes. (10) v16RedLineTick is the last
tickTurn wrapper — ordering constraint for new wrappers.
### Agent B — turn loop, elections, executive, caucuses: DONE

**B1. The session loop.** `endTurn` base :12371–12422 (live :19641 wrapper);
order: snapshot → tickTurn :12376 → advanceBills :12381 → aiGovern :12382 →
politicsTick :12383 → agendaEvent → courtReview → extraReview → pickEvents
:12387 → unshift pending :12388–12400 → v6ExtraEvents → `S.turn += 1` :12403
→ runQueue :12405 → done: collapse/regime/`runElection` :12408/closing/
v6AfterTurn/render. tickTurn wrapped SIX times; live :32017 → :31593 →
:23543 → :23158 → :20960 → :17516 → base :10365 (v16RedLineTick+v16AiTurn
are the last layer).
**~20 decision sources; exactly ONE stores an office.**
- STORED: assent (`bill.assentOffice` :8856, `assentIsMine` :8862).
- DERIVABLE: court order review (orders carry `dept`, O() :26407, stored
  :26635); court ruling + sunset events (POL id → `POL[id].dept`); QT bill
  arm.
- NO ATTRIBUTION (~15): the ENTIRE 174-literal random event pool (`ev()`
  :7637 across EVENTS :7638 / V6 :17247 / V8 :20652 / V9 :22506 / V10
  :23522 / road :25736 — no office field on any), extraEvent :7592,
  ritual :23486, agendaRevolt, succession :16625, war council :16490,
  peace :16501, arcs :17198, governor events :17209, case :22412, papers/
  inbox (V10_PAPERS :27122, 16 types; producers politicsTick :9483 etc. —
  some carry `policy`→dept derivable, none an office).
**To author against**: DEPTS :424 (4 offices), CABINET :408 (16 portfolios
under the 4), officeOf :9893, pv5PortfolioRows :14501; `dept:` appears 672×
(582 statutes + 90 orders; pres 157 / vpres 168 / chan 202 / vchan 145).
**The two mine-ness predicates DISAGREE**: `holdsDept` :9897 (coalition
test) vs `assentIsMine` :8862 (strict player-party test) — the mode system
must pick deliberately (junior partner's held office ⇒ strict-party for
"the player decides"; coalition test for "the government's side").

**B2. The clocks.** ONE SESSION = ONE YEAR (CFG :404–405 startYear 2024,
dateLabel/yearOf :9745–9746; CFG.term=2 is NOT cadence — only back-dates
lastElection). Legislative default: every 2 sessions (base isBallotTurn
:9808 `t>1 && t%2===1`; live override :29554–29560 reads
`v11ConEffects().term` → `term = clamp(2+e.term,1,6)`, phase-anchored
`(t-1)%term===0`). Decision site :12408 AFTER `S.turn+=1` (correct).
**QUADRENNIAL DEFECT ROOT-CAUSED**: the override is phase-anchored to t=1
and never consults `st.lastElection` (:10987) — changing the term RE-PHASES
the calendar instead of extending the running term. Measured: ballot t=3;
adopt artQuadrennial at t=4; next ballot fires t=5 (two years later), then
9,13,17 correct. Half of all adoption windows hit it; laying the article the
session after a ballot ALWAYS hits it (v11ConTick resolves on
`st.turn+1 >= due` :29465). Fix: anchor to lastElection ("and not before").
Aggravators: hardcoded "biennial" prose at :12619 (quietElection log),
:13145/:13151 (Senate page), :13929 (Court page), :7681 (vacancy event) —
must become term-aware. **`artFixedTerm` :29805 is a card with prose only**
(promises no snap dissolution; moves capital income; `dissolve` :12346 and
snap `runElection(S,true)` :12350 ungated). Registry of timing claims:
artQuadrennial :29785 (term+2), artAnnualAssembly :29790 (term−1),
artTermLimit :29795 (exec only, via execTermBarred :6983), artNoConfidence
:29800 (mods only); Elections acts :6077–:6346, :23117/:23123 move the
SYSTEM not the clock; acts.consulate :10985; FORMS[].elections :9979.

**B3. Exec clock — the "original rules" ARE built.** isExecTurn :9809
(`t>=5 && (t-5)%4===0`), execPair :9810 alternates pres+vchan (t=5,13,21)
and chan+vpres (t=9,17,25) — quadrennial elections, 8-year office terms,
stated on the Exec page :13747–13749. Verified in play. TWO HAZARDS:
(1) exec contests run only INSIDE runElection :10997, i.e. only on
legislative ballot turns — a term of 3 (both timing articles adopted)
makes ballots {4,7,10,13,…} and SILENTLY SKIPS exec contests at 5,9,17,21.
The plan must decouple the exec contest from the legislative ballot.
(2) isExecTurn/execPair have no article wrapper — the owner's running-mate
article has nothing to attach to yet.

**B4. Executive machinery (S15i).** `st.exec[office]` = party id;
`st.figures.exec[office]` = person (seedFigures :6846). makeFigure :6841
(+v10 wrapper :26266); v15Person :6912 backfills competence/ambition/
exposure/terms on read via v15Hash :6901 (no dice on render). holderOf
:6857 (repair arm :6867 → execSeat). Candidate obj v15Cand :6923. Bench
execBench :6935 = sitting holder + PARTY LEADER ALWAYS (+loyalty 100
:6949) + ambitious ministers + governors, stranger only if empty :6969.
execNominate :6997, score :6988 (ambition .46 + competence .34 + loyalty
.16 − exposure .6; +13 sitting; +7 LEADER; ±10 hash), honours
`st.execNominee[office]` :7006 (player's pick, v15Nominate :31196, panel
:31165). General: :10997–11026 — national legislative vote share ×
execPush (:11531/:7035) × random .78–1.22 × execPersonFactor :7014
(person-keyed incumbency 1.14…, clamp .86–1.32) → rcvWinner → execSeat
:7040. NO separate electorate, no polling, no debate, no primary, no
campaign screen, no readout of what execPush bought.
**MULTI-OFFICE HOLE ROOT-CAUSED**: execBench dedupes within ONE office
(seen[c.name] :6937); leader added to EVERY office's bench :6945–6950;
execSeat :7040 has no cross-office check (terms count per-office :7044);
execTermBarred :6983 sees only this office; the pair resolves in one
forEach with no taken-set :10999; holderOf repair :6867, ageSucceed :7121,
promoteProtege :11713 all inherit it. REPRODUCED: default opening — one
person held pres+vchan 2028–2035; with quadrennial adopted, one FP figure
held pres+chan+vchan SIMULTANEOUSLY while also FP party leader (leader +7
and loyalty 100 make the leader the modal winner everywhere).
Also off-model writers of st.exec: sackMinister :11741 (RANDOM office,
mints a stranger, bypasses bench), events :8143/:8187, :6323, consulate
:10985, coalition portfolio :15112, tradeMinistry :11994.

**B5. Caucuses.** PARTY_FACTIONS :577–613 — 7 parties × exactly 3 = 21
(strengths ≈ sum 100/party; {name,strength,e,a,demand}). Instantiated
:8404–8412 (loyalty seed `64 − i*3`, +3 if player's). Symmetric but only
the player's are rendered (factionPanel :13471 filters playParty).
Actions factionAction :9527: consult/patronage/promote (+5 strength,
−2.5 EACH other, tuned for two others)/discipline. Readers:
factionAverage :8609 (strength-weighted loyalty) → partyTurnout :10508
(S15h turnout term, gain .46 clamp [.70,1.34], consumed in ballot :10674,
applies to ALL parties); v15CampaignSeats.caucus :10560 readout :13484;
whip :21119; leadership event :20937; faction_demand paper :9508/:9428
(+expiry penalty :9472); retreat :21929; restlessCaucus :23000.
**Nominations never touch factions** — "one candidate per caucus" is
entirely unbuilt. Expansion touch-points for 4-per-party: the seven arrays
:578–612; loyalty seed :8408; promote's −2.5 :9538; factionAverage
weighting (renormalise strengths); **POSITIONAL indexing hazard** —
factionPanel :13471 and the faction_demand paper index st.factions[pid] by
position, so reordering/insertion moves references.
### Agent C — AI parties, the floor, interconnection lies: DONE

**C0. LIVE DEFECT, FIX FIRST (PR-0): custom-start articles are decoration.**
`v16CustomApply` :32244 (S16f, merged): `if (!c.arts[id]) { c.arts[id] = 0; … }`.
`v11Adopted` :29187 is `!!c.arts[id]` → false; `v11ConEffects` :29214 skips
falsy recs. Probed: three setup articles → adopted=false, all thirteen
effect fields zero, termYears still 2, and the article CAN BE LAID AGAIN.
Only the one-shot `apply()` runs (:32246) — which is why the bench count
looked right in S16f2's tests. roads.js:3878 asserts `!== undefined`,
which 0 satisfies — strengthen to assert `v11Adopted` + a real effect.

**C1. AI machinery (S16e), anchored.** V16_AI_COST :31754; cadence 4
:31774; v16AiPay :31788 (purse only, never st.funding); st.ai shape :31798;
v16Posture :31815 ORDER: govern (ruling) → partner (coalition) → attack
(grudge≥35 vs player OR ruling) → moderate → consolidate → organise → hold.
Consequences (probed): an AI GOVERNMENT's only deck card is `campaign`
(and that needs a ballot ≤4 sessions away) — most of a term an AI
government takes NO initiative; a coalition partner can never reach
`attack` even at grudge 100. Deck (:31832–31909): organise (+.030
machine), campaign (ONLY st.funding writer), court (+2.6 to its best bloc
— ALWAYS the same bloc), attack (target HARD-CODED to st.ruling :31861 —
no path to attack an opposition player), platform (st.push → driftParties
:10716), pact (st.aiPacts :31892), demand (an inbox letter — the ONLY
channel an AI policy preference reaches anyone). v16AiTurn :31929: skips
player+banned, fires (turn+hash)%4===0, uniform pick, grudges cool .6.
**st.aiPacts is a one-way door**: written :31892, read :31917 (exclusion)
+ :31967 (ballot pool +6%), NEVER deleted/expired anywhere — one pact
lasts the whole campaign and blocks both parties from any other.
aiGovern :12424: returns unless !leads(player); odd turns; ≤2 live gov
bills; random pick from wants; free. pv5AiPrivateBill :14668: 46%/session,
candidate filter :14674 INCLUDES the player's party in opposition — the
engine can put a bill on the paper for the player's party that the player
never chose (owner:'opposition', playerPosition:'support'), and `pressure`
:9192 can then be aimed at the player's own bill (blocks only
owner==='player'). partyPurseTick :14783 auto-burns 70% of every AI
party's income regardless of posture — strategy never touches the burn.

**C2. Negative space (each verified by absence of a code path).** AI
parties CANNOT: propose articles (v11ProposeArticle's one call site is the
click handler :30391), sign measures (doExtra called from :14181/:17773
only), issue orders (:14185 only), carry acts (:14193/:17774), form/leave
coalitions autonomously (formCoalition auto post-election; the ONLY
autonomous exit is the redline walkout :32003), invest in exec contests
(st.execPush written ONLY by the player's action :11536 — AI fields a
candidate and spends nothing), react to bills on the floor (bill.lines'
only writer is the player's pressure :9216 — AI parties vote, never act),
conduct diplomacy (all capital verbs are player ACTION cards), campaign
for an office, set budgets/works/appointments. Memory covers only 5
actions (doAction wrapper :32027: radicalise|poach|infiltrate|split|ban);
fund/givepress/drawseats/champion/defect/coopt/cordon are all forgotten;
the grudge has exactly two consumers (attack posture :31822, pact filter
:31918) and NEVER changes a vote (partyBillSupport/v11ArtSupport read
partyRel). C's structural advice: make deck run() call THE SAME functions
the buttons call; widen v16Posture so govern/partner aren't dead ends.

**C3. The floor.** sponsorBill :8750–8771 single constructor;
`bill.owner` ∈ player|government|coalition|opposition (every gate reads
it) + `bill.sponsor` party id derived :8756 — 'opposition' NOT handled
(falls through to playParty); pv5AiPrivateBill overwrites sponsor at
:14682 AFTER sponsorBill already logged → every private member's bill
logs TWO introduction lines, the first naming the wrong party. Opposition
CANNOT draft: draftBillDialog :8775 (`inPower` refusal) is the only
user-facing entry. S10b kit: own-bill/government verbs via
`canWork = inPower || owner==='player'` :13057 (whip/bargain/amend/
confidence/urgent/withdraw); other-party verbs :13071–13085 + :9205–9263
(support/oppose ±24/−28 seat-weighted; pressure — blocked only on
owner==='player' :9192; amendIt+delayIt inPower-only; talkOut
opposition-only :9180; kill outright-only :9178). Measured: opposition
talkOut+oppose+pressure moved a gov bill 54.8 → 41.5 — the kit works,
it's just small. **UNGATED HOLE (named by its own comment :9174 and never
fixed): pv5CommitteeAction :15081 checks nothing and pv5Spend :14961
defaults to S.treasury** — probed: opposition bought committee+12/floor+5
on the GOVERNMENT's bill with state money. Articles: v11CanPropose :29354
refuses opposition (probed verbatim); v11CallConvention same; AI never
lays. Routes V11_ROUTES :29179 (assembly 2s / plebiscite 1s, compounding
liberties price :29388).

**C4. Assent & whose bill.** assentIsMine :8861 keys on the OFFICE
(st.exec[dept] === playParty) — office not yours → assentResolve :8922
auto-resolves (favour ≥55 signs, ≥45 returns once, else refuses; 3
sessions refused → dies :8953). Sponsor identity (`mine` :8967) is read
ONLY inside the Veto choice (:9003–9014, cosmetics + unity/relation
deltas); assentFavour :8870 never reads the sponsor; pressOffice/override
require inPower — an opposition player whose own bill is refused at
assent has NO instrument.

**C5. Interconnection. NO mutual-exclusion primitive exists.** The only
pairwise exclusion in 3 MB is works build options (descope+gild,
foreign+domestic :19961). `needs:` enforced at four UNSHARED points:
policies (policyWhyClosed :11114, policyStep :11165, lapse-at-assent
:8822), measures (extraWhy :7478), orders (v10OrderOpen :26606), treaties
(:16221 + cascade :16298); articles have only `req()` and exactly ONE
names another article (artAbolishUpper req suspensiveVeto :29715). No
"X cancels/bars Y" direction anywhere. Only TWO v11Adopted gates in the
whole file (:6984, :29715) — entrenched articles bar no act, statute or
measure (wealthFranchise act, expandCourt, courtStripping act all sail
past their opposing articles).
**Article lies (verified inventory):**
- `v11ConEffects().senate` :29227 — 5 articles write it, NOBODY reads it
  (v11ArtSupport reads per-article a.mods.senate :29256).
- `artElectedSenate` :29731 — writes acts.electedSenate (read by nobody),
  never writes `upper.elected` (the field actually read :13144, :10424).
  The Article of the Elected Senate does not elect the Senate.
- `artFixedBench` — "makes court-packing dear" via polCost Justice×1.25,
  but expandCourt is an ACT priced by actCost :6354. Promise false.
- `artPlebiscite` / `artConventionClause` — the instruments they claim to
  unlock are unconditionally available (V11_ROUTES :29182,
  v11CallConvention :29523).
- `extraMods().delivery/.crown/.army` :7524–7526 — 10/3/2 measures write
  them, the card PRINTS them (:13787–13789), NOBODY reads them (orders'
  same-named fields ARE read :26585/:26689 — measures stopped one wrapper
  short of the pattern they copied).
**Conflict pairs — all co-adoptable, probed live:** SecessionBar +
SecessionRight (autonomy 6+14=20 — forbidding AND guaranteeing secession
yields MORE separatism than either); UniversalFranchise + WeightedRoll
(second apply() overwrites acts.wealthFranchise — an ENTRENCHED article
silently revoked; NoPropertyTest same collision); FixedBench + WidenBench
+ ConstitutionalBench (probed 16→9→13→17 with Fixed still standing;
v16BenchSize :32444 codifies the stacking); EmergencyLimit + Habeas +
StandingEmergency + StateOfSiege (nets emergency +5 — MORE authoritarian
than no constitution); Quadrennial + AnnualAssembly (term 2+2−1=3 — they
AVERAGE, and term 3 silently skips every exec election, see B3);
FixedTerm + NoConfidence; JudicialReview + CourtStripping; Bicameral +
AbolishUpper (blocked only by accident of the suspensive-veto req);
ResidualPowers + Supremacy; ElectedBench + JudicialTerm + FixedBench
(three appointment regimes at once); ConventionClause + ConventionBar.
**Policies: the schema has no structural slot.** P() :752 — no policy
carries apply/writes; the whole 582-statute book reaches the model
through FOUR channels (eff→indicators, mood→blocs, rev/exp→budget,
auth→securityState :10311) + 68 individually-named ids. **Elections book:
22 of 24 statutes read NOWHERE** (only automaticRegistration + voterID →
franchiseLevel :9813; rankedChoiceExpansion doesn't touch allocateSeats,
compulsoryVoting doesn't touch turnout, boundaryCommission doesn't touch
st.gerry, termLimitsStrict doesn't reach execTermBarred, the five
party-money statutes touch no purse). **Federalism: 20 of 24 read zero**
— v11AutonomyPressure :28882 reads NO statute (the Articles of Separation
do not touch secession). **Authority/Security is the honourable
exception** — every statute reaches securityState via auth :10313, which
gates measures/court/unrest — the pattern the other books lack. Sampled
Justice/Health: same shape as Elections.
**Orders: clean** — every authored field consumed (v10OrderMods :26458 +
its consumer list); one dead CONSUMER (regionEff :26496, authored by
zero). **Complete no-consumer list**: extraMods delivery/crown/army,
v11ConEffects().senate, acts.electedSenate.

---

## Round-2 questions for the owner (draft; ask after research lands)

1. Where does the primaries toggle live — new-game setup option, an in-game
   party rule you can change, or a statute/article?
2. Session↔year mapping: confirm what one session represents and therefore
   how many sessions sit between quadrennial elections (research will
   establish the current mapping first).
3. The opposition turn: with national events reserved to the government,
   what fills an opposition session — confirm the shape (opposition deck +
   floor + party/campaign work + watching the AI government act visibly)?
4. Junior partner: which events map to which offices (need the
   office→domain mapping confirmed); does a junior partner get
   coalition-management levers beyond the deal sheet?
5. AI government acting visibly: should the AI ruling party's decisions
   surface as news the player reads (a "what the government did" digest)?
6. Mutual exclusivity: owner rules content — propose the conflict table for
   sign-off rather than implement unilaterally?
7. Scope of "same person holding multiple offices": forbid entirely, or
   allow specific doubles (e.g. acting capacities)?
8. (From A) Hung parliaments: today the largest party simply rules at 31%
   seat share and nothing reacts. Should a government need to command
   confidence — an investiture/caretaker state when formation fails, with
   the no-confidence mechanic rebuilt on seat arithmetic + coalition
   cohesion instead of today's approval<42 check?
9. (From A) When the player is a junior partner, the coalition deal should
   exist from THEIR side (their red lines, their concessions won). Confirm:
   the same deal document, viewed from either chair?
10. (From B) The campaign calendar: one session = one year; exec elections
    every 4 sessions. Confirm the shape: primaries run sessions 1–2 of the
    quadrennial cycle and the general campaign sessions 3–4, with the vote
    at the cycle's end — i.e. the executive race is effectively always in
    some stage. And when a pair (two offices) is contested, primaries and
    generals for both run in parallel?
11. (From B) Decisions already decided, no question needed unless you
    object: the exec contest decouples from the legislative ballot (today a
    3-year legislative term silently skips exec elections forever); the
    term-change article extends the CURRENT term from the last election
    ("and not before") instead of re-phasing the calendar; the five
    hardcoded "biennial" prose sites become term-aware.

---

## Plan — twenty PRs in eight groups

Branches `claude/s17<letter>-<name>`. docs/STATE.md updated in the last
commit of every PR. No PR opened unless the owner asks. **s17a's first
commit adds this file to the repo as `docs/PLAN-S17.md`** and STATE.md
points at it; every later PR updates PLAN-S17.md's per-PR status line.
Every mechanic ships with the assertion that reddens without it,
poison-proofed on a scratch copy. pacing.js six-seed A/B against main is
mandatory for s17a, c, i, l, n, p, q, t.

**One structural rule: s17c installs ONE new tickTurn wrapper (the s17
dispatcher) and no later PR adds another** — later tick logic registers
into the dispatcher's internal ordered list. Keeps v16RedLineTick's
last-wrapper constraint (:32018–32022) and the dead-bodies ratchet stable
across the program.

### Group 0 — ground truth

**s17a — the seven defects** (M). **STATUS: DONE.** All seven fixed and
poison-proved; one extra found and fixed in the harness itself (below).
No features. (1) custom-start articles:
:32244 stores truthy adoption so v11Adopted/v11ConEffects see them and
they can't be laid again. (2) viewExec labels + deptFactor :10112 keyed to
the player's side/relationship. (3) pv5OpenAppointment :14975 un-inverted.
(4) cohesion writes :15112/:15114 clamped to the walkout machinery's
working range. (5) sponsorBill :8756 handles owner==='opposition'; sponsor
passed INTO sponsorBill from pv5AiPrivateBill :14682 (kills the double
introduction log). (6) pv5CommitteeAction :15081 gated per its own :9174
comment; pv5Spend stops defaulting to S.treasury — the actor's purse pays.
(7) st.aiPacts get an expiry (delete after the ballot they were formed
for). Harness: roads :3878 strengthened to v11Adopted + a real effect;
five new assertions (see Agent findings). No shape change.

**What landing it actually found — recorded because the program meets these
again.** (i) The exec fix needed a shared predicate, not a patch:
`officeMine(st, dept)` answers "is this office on the PLAYER's side" —
coalition test in power, strict-party out of it — and `viewExec` and
`deptFactor` both read it. The printed discount is DERIVED from `deptFactor`,
so a retune cannot leave the card claiming a number the model does not give.
(ii) A founding article was never carried at a margin, so its record carries
`founding:true` and the two cards that print the record read that field
instead of printing "carried at 0%" — a new field with a reader, not a
decoration. (iii) **Two of my own first assertions were tautologies**, both
caught by poison-proving: the exec check searched the whole page for a string
when the defect was a true sentence on the WRONG office (now read per card),
and the cohesion check read the final value, which a later clamped write
re-clamped (now read after each write). (iv) **`no two officials share a
name` was a coin toss** — the harness leaves the seed blank, so every run is
a different campaign; it reddened once here and greened on the next run with
no code change. It now churns 8 FIXED dice streams (1,600 replacements, up
from 200 on one random stream) and restores the live stream afterwards:
strictly more coverage, same answer every run. A bar that cries wolf is worse
than no bar.

### Group 1 — who governs

**s17b — the three chairs** (L). **STATUS: DONE.** The mode gate everywhere. Convert
actionOpen's `!a.scope` escape (:12256, stamp :12230) to a scope enum
(party/gov/leading/any) — closes the eleven leaking government acts
(confidence :11907, joinCoalition :11912, expelPartner :11922, drawseats,
champion, audit, poach, byElection, prosecute/cutFunding/coopt/ban) and
the Figures leaks (sackMinister :11739, promoteProtege :11707 — guard on
the player's claim, not the government's). Gate: fiscal :15146/:15321
(leading-only), coalition admin :15107 (leading-only), ministers/scandals/
Ministry tab, programme :16590, interests :15094, committees; Federation
per-region actions :9543/:21961 restricted for non-ruling, governor verbs
split along gb() :17947's existing fromParty seam. New sibling predicate
`myOffice(st,dept)` (strict-party, assentIsMine-shaped) beside holdsDept.
Refusal prose copies the Question-Time mode-aware pattern :20361–20447.
Tabs stay visible, re-rendered as the view OF the government from
outside. Harness: **the mode matrix** — full instrument × standing table
probed on fixed scenarios, the program's permanent regression net.

**What landing it found.** (i) The vocabulary is `need` ∈ any|gov|leading,
read by `modeAllows`/`modeWhy`/`actionNeed` and by nothing else. An action
with no `need` keeps exactly its old behaviour, so this widened the
vocabulary rather than re-gating 200 cards; only the cards lying about their
chair carry the field (17 of them). (ii) **The gate must go on the LIVE
function.** `pv5MinisterAction` is *reassigned* at :30830 and that
reassignment REPLACES four of nine cases, so a gate put on the base was
measured as absent — an opposition player went on briefing the government's
ministers. Every gated handler was then audited for reassignment;
`pv5InterestAction` and `regionAction` are wrapped (delegating, so the base
gate holds) and the v11 regional layer had a *second* `inPower` rule of its
own, now folded into the one table. (iii) **Two more of my own assertions
were tautologies**, both caught by poison-proving: `ministerBrief` returned
`null` with no ministry seated and `null !== true` passed with no gate at
all (it seats a minister in a coalition-held office now), and `governorStump`
conflated a real game refusal (no state ballot near) with a chair refusal (it
now asserts only that the refusal is never about the chair). (iv) Measured
before/after: registry 66/66/6 → 66/66/4, party-scoped cards aimed at rivals
29/28/28 → 29/24/18, and every national handler now answers to its chair.
(v) **A GAP IN THIS PLAN, FOUND AND CLOSED IN s17b.** The owner's brief says
"as an opposition party, you should still be able to introduce bills and
constitutional articles", and no PR in the plan carried it — worse, the first
draft of the mode matrix asserted "the floor is the government's to open" and
would have entrenched the refusal it was written to remove.
`draftBillDialog` and `v11CanPropose` open from every chair now, as a private
member's bill: one bill and one article at a time out of government, no
government machinery behind them, worse odds because the arithmetic is worse
rather than because a number was put on the scale. A pending article records
`by` — it had no sponsor at all, since until now only a government could lay
one — and s17k's AI parties will write it. A sixth poison proved that field's
WRITER, after the first version of the probe supplied `by` itself and so
tested only the cap's arithmetic.

**s17c — whose desk it lands on** (XL). **STATUS: DONE.** Office attribution + the AI
government + the digest. Author `office:` on all 174 event literals
(six registries; values pres/vpres/chan/vchan/national); derive where
dept/POL id exists (officeOf :9893); explicit marks for extra/ritual/
succession/war/arcs. Routing in pickEvents/runQueue: event's office held
by the player's party (strict myOffice) → player decides; else
`aiDecideEvent(st, ev)` picks by the deciding party's wants + posture,
applies silently, accumulates in `st.govRecord` (created-on-write).
Gazette gains "What the government did" (ruling 10). Installs THE
DISPATCHER (one adjudicated wrapper). Harness: every registry member
carries a valid office (any future unattributed event reddens);
opposition probe — held-office event queues a modal, all else resolves
into the digest; determinism (aiDecideEvent through rand() only).



**What landing it found.** (i) The dispatcher the plan called for is NOT
installed here: s17c adds no tick logic (the routing lives in `endTurn`), and
an empty wrapper would be a body nothing reads. It goes in with s17g's breach
scanner, the first PR that needs one. (ii) **A probe that calls the new
function directly proves the function and nothing about the game** — with the
`v17Route` call site deleted from `endTurn`, every other part of the assertion
still passed. The harness closes real sessions and catches the queue on its way
into `runQueue`, comparing both chairs over one fixed stream. (iii) The event
registries are concatenated into each other, so walking all six counts the same
object twice — it reported 299 events for 174. Count by identity. (iv)
`v17Utility` had to be **tuned by measurement**: approval is itself a
population-weighted bloc average, so weighting it above the party's own blocs
made four different governments answer identically. (v) **`makeName` never
guaranteed a unique name** — ten random tries then whatever it had — which is
why `no two officials share a name` cried wolf in two consecutive slices. It
walks the pool now; measured, the old code returned an already-held name 89
times in 300 under a forced pool, the new code none.

**s17d — the reaction** (M). **STATUS: DONE.** National-tier events offer the opposition/
junior a reaction — per-event authored `react:` verb sets (ruling 7:
VARIETY, never a fixed triple), moving standing/blocs/press via the
:20278-shaped asymmetric machinery, never the outcome. Digest links each
government act to the reaction given. Harness: verb-set variety asserted
(≥N distinct multisets); a reaction moves blocs and does not alter the
applied outcome; rungs --check on new prose.

**What landing it found.** Reactions are authored by FAMILY — not per event and
not as one triple: twelve families (disaster, security, foreign, economy,
labour, scandal, constitution, repression, services, party, election,
institution), **38 verbs, 38 distinct labels, no two families sharing one**,
and 132 of 174 events naming a family. The "never the outcome" guarantee is
structural rather than promised: every verb's effect is drawn from a CLOSED
vocabulary applied by one function, and the event's own `f` is never run again.
**A reaction is a VOICE, NOT A DECISION**, and s17c's assertion had to be
taught the difference — reactions are queued at the player precisely because
the question was not theirs, so counting them as decisions said the opposite of
what they mean. The same change broke the playtest's Gazette step for a real
reason: an opposition player's session no longer ends with an empty queue, so
the probe now answers its sheets the way a player does.

### Group 2 — the coalition

**s17e — the coalition in writing** (L). **STATUS: DONE.** Grow `coalitionDeals` in place
(NO parallel structure): full `terms:{offices, portfolios, concessions:
[{kind:support|oppose|adopt|refrain, ref, due}], redLines[], confidence}`
+ `ledger[]` per entry; **an entry for the ruling party** (kills the
single-perspective seed :14558); legacy redLine mirrored from redLines[0]
until s17g. Formation sheet grows out of v6CoalitionDialog :17657
(offices/concessions/red-lines/confidence — modeled on V6_TREATIES
:16158's negotiated-instrument pattern). Junior-player first-person Deal
panel (same objects, renderer keyed to playParty). Begin retiring
st.partner. SHAPE CHANGE (first in group): backfilled idempotently in
pv5EnsureState :14556.

*What landing it found.* The formation sheet did NOT grow here — it belongs
with formation itself and moved into s17f, which is where a deal is
negotiated rather than seeded. What landed is the document: terms, ledger,
head flag, an entry for the ruling party, the first-person junior card, and
the legacy-scalar mirror. `st.partner` is untouched; retiring it needs the
formation path that writes it, so it retires in s17f.

**The multi-office exclusion came forward from s17h into this PR.** It was
not a plan change made for convenience: `no two officials share a name` went
red twice and the dominant cause was not name minting at all but **136 of 150
executive elections seating a person who already held another great office**.
Nothing in this group could be measured over a campaign while that was true.
`v17OtherOffice(st, name, office)` is now asked at `execBench` and again at
`execSeat`; the s17h entry keeps the rest of its list (the calendar, the
term-article anchor, the biennial prose, artFixedTerm's teeth) and loses
only item (5). The remaining off-model writers of `st.exec` named there —
sackMinister, ageSucceed, promoteProtege, the two events, the consulate —
still need their own pass, and s17h keeps them.

**s17f — nobody rules until the house says so** (XL). **STATUS: DONE.** Formation,
caretaker, investiture. Replace largest-party-rules + greedy
formCoalition :10785: formateur rotation by TOTAL post-renewal seats
across BOTH chambers (ruling 8); offers in the s17e terms shape;
per-party acceptance utility (portfolio fairness + concession value vs
pv5TopWants + partyRel − grudge + posture ≥ reservation) — freeze-outs
EMERGENT: when the plurality's offers fail, rotation passes and AI–AI
coalitions form; player is one participant of seven (formateur → drives
the sheet; invitee → receives offers; :17538/:17658's two-mode refusal
dies). Minority + C&S (st.confidence) at a concession price; bounded
rotation → grand-coalition round at relaxed reservations or caretaker
persists. Investiture = seat-arithmetic vote. `st.caretaker` consumed by
the s17b gate layer (no new policy, orders bar emergency, no treaties/
programme, fiscal frozen). Hung Assembly opening becomes a real formation
window. oppositionAttack's no-confidence :11666 rebuilt on seats +
partner cohesion; success → caretaker + formation window. SHAPE:
st.caretaker + st.formation, ensure defaults null. Harness: no-majority →
caretaker; scripted freeze-out on a fixed seed; no-confidence arithmetic
both ways; pacing soak — no save stuck in caretaker beyond the bound.

*What landing it found.* Everything on the list landed, plus the **formation
sheet moved here from s17e** — a sheet for a negotiation belongs with the
negotiation, and s17e had nothing yet to show on it. Four things the design
did not anticipate:

1. **The rotation is DICE-FREE**, and that turned out to be the load-bearing
   decision of the whole PR. It makes formation arithmetic rather than luck,
   and — because it is pure — it lets the whole rotation be re-run with the
   player's own answer pinned, which is how a single player takes part in a
   seven-party negotiation without the model having to be paused and resumed
   mid-flight. Ties break on `v15Hash`, the S15i pattern.
2. **`V17_UNBRIDGEABLE`.** The acceptance utility alone made every coalition
   purchasable, which has no politics in it and made the grand-coalition round
   a formality. A hard distance bar no price beats is what makes a grand
   coalition of the largest parties the round most likely to FAIL, which is
   what the phrase means.
3. **An abstention is not opposition.** The investiture is what makes minority
   government real, and it is one line: a government takes office when more
   members vote for it than against it. Confidence and supply buys silence,
   not votes.
4. **The deadlock is soft.** Positions, grudges and relations all move every
   session and a grudge cools by .6 a turn, so the parties nearly always find
   an answer at the next attempt: none of 180 sessions of live play produced a
   caretaker outside the Hung Assembly. The three-session clock is a
   guarantee, not a common event — and the harness had to say so rather than
   pretend otherwise.

**`st.partner` is NOT retired** — twenty sites read it and it is written
exactly as `formCoalition` wrote it. Retiring it is its own change and does
not belong as a rider on this one.

**The balance movement is the largest in the program** and is recorded in
`docs/STATE.md` with its two causes (formateur order by combined weight, and
coalitions trimmed to minimal winning), the live-play measurement, and the
one-line lever (`v17Weight`'s Senate term) named for the owner to rule on.
A "mandate" term was built and removed: it fixed nothing measurable and made
the caretaker unreachable.

**s17g — honour, alter, betray** (L). **STATUS: DONE.** Instrument sites emit
`dealEvent(actor, kind, ref)` (sponsorBill :8750, bill resolution, floor
verbs :9205–9263, campaign actions :15120, orders/articles, coalition
actions); one scanner in the dispatcher matches events against every
member's concessions/redLines: breach → ledger + cohesion cost → the
S16e walkout as terminal. Alteration: reopen the sheet mid-term, both
directions (the AI partner's demand letter escalates into renegotiation).
leaveCoalition :12202 = the player's betrayal endpoint with the ledger as
record. v16RedLineTick taught redLines[] and retired into the scanner
(capture+call, adjudicated). Harness: promised-refrain bill → breach +
cohesion drop; honoured → credit; driven chain → walkout; alteration
without breach; pacing A/B on coalition lifespans.

*What landing it found.* The design's shape held -- one emitter, one scanner,
the ledger, the walkout as terminal, alteration as its own thing. Four things
it did not anticipate:

1. **A red line has to be a point of FRICTION.** Concessions drawn from the
   partner's own top wants are statutes the government was never going to
   touch: measured over 180 sessions of live play the ledger stayed empty.
   `v17Friction` draws the refrain from where the partner and the formateur
   actually disagree, and it fires 7-18 times a campaign.
2. **A party that comes back signs a NEW agreement.** Keeping the deal as the
   record -- the whole point of the ledger -- meant a returning partner resumed
   on the cohesion it stormed out with. Mean coalition lifespan fell from 6.6
   sessions to 2.1 before this was found.
3. **One baseline per red line, not one per deal.** S16e's single `redLineWas`
   was correct for one red line and wrong for a list.
4. `v16RedLineTick` was **not** rebound with a capture. It is not reassigned
   anywhere, so its body was grown in place under its own name and its call
   site in the tickTurn wrapper is untouched -- less ratchet churn than a
   rebind and the same result. The plan's "capture+call, adjudicated" was
   written for a function that turned out not to need it.

**Deferred to s17k, deliberately.** The floor verbs (support/oppose/pressure)
do not emit yet: they are click-only instruments, and s17k is the PR that
extracts them so an actor can be passed. The emitter is in place and one line
per verb will reach it.

### Group 3 — the executive cycle

**s17h — the calendar tells the truth** (L). **STATUS: DONE.** (1) Term article anchored to
st.lastElection ("and not before") — kills the re-phase defect (B2's
measured case becomes the reddening assertion). (2) Exec contest
decoupled from the legislative ballot (checked in endTurn's done branch —
term-3 no longer skips it). (3) Five "biennial" prose sites term-aware.
(4) artFixedTerm gets teeth (dissolve :12346 + snap :12350 gated).
(5) MULTI-OFFICE EXCLUSION (ruling 9) — **the elective half of this item
shipped early, in s17e**, because it fired in 136 of 150 executive
elections and no coalition measurement over a campaign was possible while
it did: `v17OtherOffice` is asked at execBench :6935 and again at execSeat
:7040, and the ten-campaign soak reddens without either pair member.
**What s17h still owes**: the off-model writers of `st.exec` —
holderOf's repair arm :6867, ageSucceed :7121, promoteProtege :11713,
sackMinister :11741 (which mints a stranger into a random office rather
than drawing from the bench), the two events :8143/:8187 and the
consulate. A leader may hold exactly one office; that already holds.

*What landing it found.* All five items landed. Three notes:

1. **`>= term` is not `% term`.** The first anchor read "the term has
   elapsed", which makes every session after it a ballot turn -- and
   `nextBallot` and the sessions-to-the-ballot readout walk forward asking
   exactly that question. It is the beat, counted from the last election.
2. **S11d's own calendar assertion had to be rewritten**, because it asserted
   the phase this PR proves is wrong (5, 9, 13 from an article adopted at 61).
   An assertion that encodes a defect is not a regression net, and changing it
   is part of the fix rather than a way around it.
3. **`holderOf`'s repair arm, `ageSucceed`, `promoteProtege` and the
   consulate needed nothing**: all four already seat through `execSeat`, which
   has carried the exclusion since S17e. What actually needed the work was the
   three sites that bypassed `execSeat` entirely and minted a stranger into a
   random office.

**s17i — four voices in every hall** (L). **STATUS: DONE.** PARTY_FACTIONS 7×3 → 7×4
(authored, unique). FIRST convert the two positional consumers
(factionPanel :13471, faction_demand paper :9508) to id-keys, THEN append
fourth entries (old saves extend in place); renormalise strengths, retune
promote's −2.5 :9538, extend loyalty seed :8408. Caucus→candidate
provenance on the bench (v15Cand + caucus id). Primaries toggle =
`st.partyRules[pid].primaries` on the Parties tab, changeable only
between cycles, AI dispositions seeded (ruling 5). Harness: pacing A/B —
the turnout term must NOT silently shift; the positional poison; toggle
refuses mid-season.

*What landing it found.* Every item landed, and the plan's own warning earned
its place twice:

1. **The turnout term DID shift**, and only a direct measurement found it. A
   fourth caucus seeded on the old loyalty ladder took a point off
   `factionAverage` for all seven parties, and `partyTurnout` reads that
   number: 1.0690 to 1.0568, uniform and invisible in the pacing trajectories.
   The ladder is re-centred and the term is back within .0012. Pacing alone
   would never have caught it.
2. **The positional consumer is the INBOX, not the panel.** `factionPanel`
   indexes by position but renders and consumes in the same pass, so it is
   safe; the faction_demand paper stores an index that outlives the render and
   rides the save. Appending rather than sorting is what protects it, and the
   poison that proves this had to give an old save's caucuses strengths OUT of
   order before a sort would move them.
3. **`promote`'s -2.5 was a third defect nobody had listed**: tuned for two
   other caucuses, it took five out of the party; with three it would have
   taken seven and a half every time the button was pressed.

**s17j — always running** (XL). `st.execRace` state machine seeded by the
dispatcher at cycle boundaries for the execPair offices in parallel:
sessions 1–2 primaries (4 caucus candidates; levers = caucus strength AND
direct candidate influence — outsiders can win), 3–4 general (campaign
screen, per-office spending readout, polls), vote at cycle end through
:10997's machinery fed by primary winners. Primaries-off parties pick
before the general. AI parties invest purse through the same push writer
(:11536's monopoly ends). `artRunningMate`: article wrapping isExecTurn/
execPair — vices attach to principals, both principals contested every 4
years (ruling 3). SHAPE: st.execRace, ensure null, pre-S17j save resumed
mid-cycle seeds at next stage boundary LOUDLY. Harness: season never
dark; scripted outsider wins a primary; running-mate article changes pair
and year; AI push nonzero; race state rides save/resume.

### Group 4 — the other six

**s17k — verbs are the buttons' functions** (XL). Extract
`<verb>Core(st, actor, args)` from the six click-only instruments
(articles :30391, measures :14181/:17773, orders :14185, acts :14193,
coalition join/leave, exec push) — extraction at the live outermost body,
thin handler retained, NOT a rebind (ratchet untouched). Mode gates take
the actor — AI obeys the same constitution, one gate two callers. Deck
extended: bills-with-agendas (aiGovern wants-driven; :14674 stops
drafting the player's bills for them), lay article, issue order, floor
reactions (support/oppose/pressure parameterized — AI parties ACT on the
floor), coalition bargaining (s17g verbs), office investment. Attack
target un-hard-coded from st.ruling :31861. Harness: AI government takes
initiative most sessions (C1's measurement inverted); AI paths hit the
same refusals (probe an AI opposition party against a government
instrument); determinism unchanged.

**s17l — minds and memories** (M). v16Posture widened (govern/partner not
dead ends); memory beyond the 5-action whitelist to the full capital-verb
set; grudge's third consumer — a bounded term in partyBillSupport/
v11ArtSupport (it finally reaches a vote); partyPurseTick's flat 70% burn
:14783 posture-dependent; pacts get terms + renewal; the demand letter
escalates into s17g renegotiation when ignored. Harness: pacing —
AI trajectories differentiate by posture (variance floor); grudge shifts
a vote in a controlled probe; a partner renegotiates without walking.

### Group 5 — one truth at a time

**s17m — mutual exclusion, and the article lies** (XL). `conflicts:`
field on cards + ONE shared `conflictWhy(st, kind, id)` called from the
four existing enforcement points + v11CanPropose (declarations on cards
so SUPERSEDE prints; logic in one place; cross-kind conflicts
expressible — FixedBench↔expandCourt). Semantics per ruling 11 (BLOCK /
SUPERSEDE-at-a-price); **the table is a generated review artifact the
owner approves/amends before wiring** — PR is primitive-first with a
pre-agreed seed set so it ships green during review. Fix the lies:
v11ConEffects().senate gets its reader; artElectedSenate writes
upper.elected; artFixedBench prices the expandCourt ACT; artPlebiscite/
artConventionClause actually gate their instruments; extraMods
delivery/crown/army gain the consumers the orders' same-named fields have
(:26585/:26689). Harness: every probed absurdity from the research
reddens (SecessionBar+Right, the 16→9→13→17 bench stack, the emergency
stack's +5, the term average).

**s17n — the book means what it says, I** (L). Elections book wired:
rankedChoiceExpansion → allocateSeats; compulsoryVoting → turnout :10508;
boundaryCommission → st.gerry; termLimitsStrict → execTermBarred; the
five party-money statutes → the purses + s17j campaign spend. Federalism
wired: statutes reach v11AutonomyPressure :28882 and the region model —
the Articles of Separation finally touch secession. Pattern:
Authority/Security's every-statute-reaches-securityState shape. Harness:
one per-statute "adopting it moves the mechanism" assertion each — the
book's permanent lie-detector; pacing A/B.

**s17o — the book means what it says, II** (L, splittable). Remaining
books swept, one commit per book; wire where the S17 systems give a
statute its first honest target; where none exists, the proposed
re-wording listed for the owner's explicit approval before landing
(ruling 12c). rungs --check --corpora on re-worded cards.

### Group 6 — somebody can stop you (S16g/h)

**s17p — the court can stop you** (L). courtReview extended from
commentary to consequence: standing to strike orders/acts/articles on
constitutional conflict — the s17m declarations ARE the docket; bench
composition decides appetite; the government (player or AI via s17k)
responds — comply, re-legislate, court-strip at its now-real price;
strikes land as events of the relevant office. Harness: scripted
unconstitutional order struck within N sessions and its effect reverted;
a packed friendly bench does not strike it.

**s17q — the street has leverage** (M). On securityState + the blocs:
sustained unrest → demands with deadlines (V10_PAPERS machinery);
general-strike states freeze instruments through the same gate layer
(one mechanism: opposition/caretaker/strike); concession/repression
branches through s17c routing. Opposition leverage: backing the street
at standing cost/gain (closes S16i's remainder). Harness: driven unrest →
binding demand; ignoring freezes the asserted set; pacing soak — strikes
occur, don't dominate.

### Group 7 — the finish (S16j/k/l)

**s17r — the long deck folds, and focus survives** (M). Deck folding with
fold state in UI (transient, unsaved), S9b scroll-ownership respected;
after the content PRs so folding is designed against the real load.
Playtest: fold + focus survive an end-turn re-render at three viewports;
splices-land stays green.

**s17s — contrast and the thumb** (M). Contrast + touch targets at the
five thresholds, the new S17 surfaces (deal sheet, formation window, race
screen, digest) included; colour-literal and text-fill invariants held.

**s17t — the prose pass and the close** (M). Every new line to
PROSE-STYLE via rungs --check/--corpora; the 2,910 audited pieces
untouched; MAP.md gains sections (modes, formation, the deal, the season,
the dispatcher); STATE.md closes S16 and S17 together; final six-seed
pacing A/B against pre-program main published in the PR.

## Architecture decisions (binding)

1. **standing() IS the mode system** — unmodified, three strings forever;
   caretaker is an orthogonal flag, never a fourth standing. New sibling
   `myOffice(st,dept)` (strict). Jurisdictions: STRICT-PARTY for decision
   ownership (event routing, assent, appointments, primary picks);
   COALITION test for government capacity (deptFactor in power, gov
   instruments, execHeld/govShare). Registry gating via a scope enum in
   actionOpen; handler gating via Question-Time-patterned guards; s17k
   re-roots both on an actor parameter.
2. **Grow coalitionDeals in place** — no parallel structure; S16e's
   writers/walkout keep speaking to one source of truth; first-person
   junior view is a renderer keyed to playParty over the same objects;
   breach detection is EVENT-driven (dealEvent emissions + one scanner),
   not scan-driven.
3. **Formation**: formateur rotation by total post-renewal two-chamber
   seats; minimal-winning offer sets; per-party acceptance utility ≥
   reservation makes freeze-outs emergent; bounded terminal (grand
   coalition at relaxed reservations, else caretaker persists);
   investiture by seat arithmetic; caretaker limits = the gate layer
   wearing a second hat.
4. **Attribution**: hand-authored `office:` on exactly the 174 event
   literals + national marks; derived via officeOf/POL.dept everywhere a
   dept exists; locked by a registry-wide roads assertion.
5. **AI verbs**: Core-extraction at the live outermost body (never a
   rebind); deck run() holds only target selection; everything an AI does
   is something the player's button does — one gate, two callers.
6. **Exclusivity**: `conflicts:` on the cards + one shared conflictWhy;
   the sign-off table is GENERATED from declarations; checks/run.js
   verifies resolution + BLOCK symmetry.
7. **st.execRace**: one shared save object, dispatcher-seeded at cycle
   boundaries, dice spent at seed time only (no dice on render);
   pre-program saves resumed mid-cycle seed at the next boundary loudly.

## Top risks

1. A fourth standing leaking in (caretaker/formation) → flags only +
   permanent roads assertion that standing() ∈ {3 strings} everywhere.
2. Over-gating the ruling player or the AI's Cores → the s17b mode matrix
   re-runs in every later PR, poison-proofed.
3. Wrapper ordering across 20 PRs → the single dispatcher; only s17g
   changes a wrapper body, with its own adjudication.
4. Formation non-termination / coalition churn → bounded rotation with a
   guaranteed terminal; pacing soaks assert caretaker bounds + coalition
   half-life floors.
5. The 3→4 caucus expansion breaking positional consumers → id-keys
   BEFORE the append; shuffled-array poison test.
6. Balance drift from many small economy changes → mandatory pacing A/B
   on the eight economy-touching PRs; deptFactor and burn changes carry
   before/after numbers.
7. Owner sign-off gates stalling → s17m primitive-first with a seed set;
   s17o one-commit-per-book and splittable.
8. Save-shape churn → shape changes land first in their group; every
   ensure edit ships a resume-mid-state determinism probe; breaks loud,
   never quiet.

## Verification bar (every PR)

`node checks/run.js` + `tools/roads.js` + `tools/playtest.js` +
`tools/determinism.js` + `tools/tiers.js` + `tools/tabs.js`; content PRs
add `tools/rungs.js --check` (and `--corpora` when registries change);
economy-touching PRs add the six-seed pacing A/B against main
(VALE_SEEDS='5EED1234,VALE0011,VALE0027,VALE0404,VALE1337,VALE8080',
VALE_FILE for the main-side build — this session's proven method). Every
new mechanic ships with the assertion that reddens without it, and the
assertion is poison-proofed on a scratch copy before the PR closes.

## What I will not do unattended

Touch the party palette. Add a width threshold. Move a ratchet to make a
check pass. Rewrite the 2,910 audited prose pieces (re-promising a card
happens only through ruling 12c's explicit-approval path). Wire the
conflict table before the owner has ruled on it (the primitive and the
seed set land; the full table waits). Open a PR without being asked.
