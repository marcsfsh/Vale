# instruments

Area: the constitutional articles, the executive orders, the extraordinary
measures, the constitutional acts, and the court.

## Method

Every number below is a measurement, not a reading, unless it says otherwise.
Driven runs are **6 seeds × 120 sessions = 720 sessions**, player `lp`,
`aiLevel: 'ruthless'`, `SEED_OVERRIDE` set before every `v6NewGame`
(pinning `rngState` afterwards does not pin the republic), and `runQueue`
overridden with the queue-clearing wrapper so elections, exec races and
formation actually run. Probes live in
`/tmp/claude-0/-home-user-Vale/d0d4e871-ec53-5cf7-8cdf-8c9315947924/scratchpad/probe/p1..p8.js`.

One probe of mine was wrong before the game was, and I am recording it because
the correction changes numbers: counting live plays with `st === S` inside
`v17ArticleCore` counts the **sandbox too**, because `v6Sandbox` assigns the
clone to the global `S`. The corrected count diffs the live registries after
each real `endTurn` (p6). Wrapper-counted 245 articles / 291 orders; live 52
articles / 98 orders. Only the live figures are quoted.

## What it does today

Three instrument registries sit under one shared pair of verbs. `v17ArticleCore`
(:38339) lays one of the **81 articles**, `v17OrderCore` (:38369) signs one of
the **90 orders**, and both take an actor, so the player's button and the AI
deck's card are refused by identical lines. An engine reaches an article through
the deck's `article` card (:34468) and an order through `order` (:34485); it
picks which one with `v17AiArticleFor` (:38389), the nearest article on the
compass, and `v17AiOrderFor` (:38403), the **first** open order in book order.
The **60 extraordinary measures** and the **33 constitutional acts** have no
engine path at all. The court is a scalar: sixteen justices are collapsed to a
mean position and a count near the government, and that number is turned into a
probability by `v17CourtAppetite` (:39295).

Measured over 720 sessions: engines laid **52** articles (21 distinct of 81),
signed **98** orders (24 distinct of 90), signed **0** measures and carried
**0** acts; the court's docket was **empty in 720 of 720 sessions** and heard
**nothing**.

## Findings

### The engine's article pick is a fixed lookup from the party's own compass — [shallow]

- **What:** `v17AiArticleFor` walks `V11_ARTICLES`, skips adopted and
  un-proposable ones, and returns the one with the smallest
  `dist2(a.pos, ppos(st, pid))` if that distance is `<= .8`. There is no term
  for the board, the government, the chamber, the goal, or a rival. The first
  line binds `var want = PARTY[pid].wants || {}` and the body never reads
  `want` — a decorative local in a nine-line function.
- **Evidence:** `v17AiArticleFor` at :38389-38402 (`want` at :38390, unread;
  `dist2` at :38394; `bd <= .8` at :38401).
- **Measured:** at turn 1 every party picks the same article on all six seeds:
  rsf `artRightToHealth` (d .200), lp `artFiscalEqualisation` (.070), sd
  `artResidentFranchise` (.039), fp `artEmergencyRenewal` (.020), cup
  `artRegionalWeighting` (.155), **tvc and pnl both `artWeightedRoll`** (.183
  and .635 — two parties collide on one article). Over a campaign the pick only
  moves because `ppos` drifts: **21 distinct articles laid of 81**, so 60
  articles were never laid once in 720 sessions.
- **Why it matters:** the constitution is the game's deepest registry and an
  engine treats it as a nearest-neighbour lookup. A player who has seen one
  campaign knows exactly what each party will lay for the rest of the game.
  PNL, whose nearest article is .635 away, has **three** articles in reach out
  of 81 (measured, p3 `reach`); RSF has 15, TVC 18. Two of the seven parties
  are near-mute on the constitution and one is a broken record.
- **Upgrade:** score the shortlist rather than taking the argmin: distance ×
  what the article's `mods` are worth to this party through `v11ArtSupport`'s
  own institutional-self-interest terms (`d.senate`, `d.term`, `d.franchise`,
  already written at :31400-31422) × `v11ArtForecast(st, a, false).lower`
  against `v11ConThreshold`. A party should not lay what it cannot carry, and
  the two functions that answer that are already in the file.

### The engine's order pick is whatever is first in the book — [shallow]

- **What:** `v17AiOrderFor` iterates `V10_ORDERS` and short-circuits on the
  first hit (`if (best) return;`). It is a source-order scan, not a choice.
- **Evidence:** `v17AiOrderFor` at :38403-38412, `if (best) return;` at :38406.
- **Measured:** 98 live signings, 24 distinct of 90 — **66 orders were never
  signed once**. The distribution follows book position, not utility:
  `establishmentFreeze` (5th in the book) 11, `deliveryUnit` (6th) 7,
  `maritimeExclusion` (1st) 7, `twoYearBar` (8th) 6, `careerLegations` (9th) 6.
- **Why it matters:** the order book is the executive's whole character and an
  engine expresses none of it. A left government and a right government in the
  same department sign the same order.
- **Upgrade:** the same three-factor score as the article, plus the order's own
  `exposure` weighed against `v17CourtAppetite` — an order book that has a
  court over it should be chosen partly for what will survive.

### An engine hands a REGION id to a POWER slot — [inconsistent]

- **What:** `v17AiOrderFor` supplies `o.target ? REGIONS[0].id : null` for every
  targeted order. **No order in the book targets a region.** Of the 90, eleven
  take `target:'power'` and one takes `target:'work'`; the other 78 take none.
  So the branch is never right when it fires: it hands `'somnium'`, a region id,
  to a slot that wants a power.
- **Evidence:** `v17AiOrderFor` at :38408-38409; target census (p1) `{power:11,
  work:1, none:78}`; `REGIONS[0].id === 'somnium'`. `v10OrderOpen` (:28701-28730)
  never validates the target against `o.target`, and `o.req(st)` takes no target.
- **Measured:** **14 of the 98 live signings were mistargeted** —
  `maritimeExclusion` 7, `openDoorProclamation` 4, `theSubvention` 2,
  `supplyListsClosed` 1.
- **Consequences, both bad:** the order's `powerEff` reaches nothing, because
  `v10OrdersTick` guards with `if (st.powers[pid] !== undefined)` (:28776) — so
  the whole point of an "Abroad by proclamation" order is silently null; and
  `v10OrderTitle` falls through its `POWER[target]` branch to the generic
  `o.name + ' (' + target + ')'` (:28762), so the log reads
  *"The Maritime Exclusion Zone (somnium)"*.
- **Why it matters:** a seventh of every order an engine signs is a proclamation
  against a state of the union, doing nothing, printed in the log.
- **Upgrade:** pick the target from the order's own declared type —
  `v10OrderTargets(o)` (:30228) already produces the legal list for the player's
  buttons — and choose within it (the worst-related power for a hostile
  `powerEff`, the best for a friendly one). Then make `v10OrderOpen` refuse a
  target that is not in that list, so a bad id is a refusal and not a signature.

### The court never sits — [decorative in play]

- **What:** `v17Docket` (:39308-39350) has three arms and in a played campaign
  none of them ever produces a row.
  1. an order in force whose own `ind.liberties` is negative **while**
     `v11ConEffects().libFloor > 0` — which needs one of the **nine** articles
     carrying `mods.libFloor` to be in the document, all nine entrenched
     (60% bar), none of them any party's nearest article;
  2. an act in force a standing article forbids — the code's own comment says
     this is "only reachable from a legacy save or a start editor" (:39284-39286);
  3. two conflicting articles both adopted — same, and the lay-time gate at
     :31539 and `doAct`'s at :6516 stop new ones.
- **Evidence:** `v17Docket` :39308; `v17CourtTick` :39353; nine `libFloor`
  articles and fifteen liberties-costing orders enumerated in p4.
- **Measured:** `v17Docket(S).length === 0` in **720 of 720** sessions.
  `v17CourtTick` was called 720 times and set `pendingStrike` **0** times.
  Mean `v17CourtAppetite` .112, above .2 on 170 of 720 sessions — so on nearly a
  quarter of sessions the bench *would* take a case and there is nothing to take.
- **Not broken, unreachable:** forcing the situation by hand (adopt
  `artUniversalFranchise`, put `compartmentOrder` in force) gives docket length
  1, appetite .619 and a case taken **on the first tick** (p4 `forced`). The
  machinery works; the two preconditions never co-occur.
- **Why it matters:** S17p's whole slice — the docket, the appetite, the strike
  event, comply/narrow/defy, `court.defied` — is dead weight in an ordinary
  campaign. The other court, `courtReview` (:13583), fired **4 times in 720**.
- **Upgrade:** the docket needs an arm that fires on what actually happens.
  Two candidates already in the model: an order whose `exposure` is high and
  whose department is not held by the party that signed it (the file records
  `rec.by`, see below); and an order signed while `securityState` is above the
  bar that opens the extraordinary measures. And measure the distribution first
  — a threshold picked by eye is a mechanic that never fires, which is what the
  `libFloor` conjunction already is.

### The court is a die roll, and no two justices differ — [shallow]

- **What:** sixteen justices are `{party, e, a, since, name}`. Everything the
  court *does* reads only the mean and a count: `courtPos` averages `e`/`a`
  (:10649), `courtWith` counts justices within `.45` of `govPos` (:10655),
  `courtGap` is the distance between the two (:10668). `v17CourtAppetite` is
  `(1 - friendly) * .9`, cut by `acts.courtStripping`, `securityState` and
  `court.defied` (:39295-39304), and `v17CourtTick` then does
  `if (rand() > want) return;` (:39358). There is no per-justice vote, no
  majority, no dissent that means anything. Two justices at ±x cancel exactly.
  `j.party` is read in one place, the Court panel's per-party tally (:15392);
  `j.since` only for seniority ordering.
- **Evidence:** :10649, :10655, :10668, :39295, :39358; `extraReview`'s twin
  formula at :7848-7851.
- **Measured:** `courtWith` sampled every 20 sessions across the six campaigns:
  `5/16` at turn 0 in every seed, then **16/16 on 17 of the 30 later samples**
  and 15/16 on five more. The bench converges on the government almost at once,
  because `courtElection` (:11774) replaces 2–3 justices every cycle with the
  winner of `courtSeat`, whose 85 of 100 points are the general populace by
  proximity (:11828-11838). `courtGap` mean .253, and it clears `courtReview`'s
  `.5` bar on 7 of 36 samples — six of which are the turn-0 sample.
- **Why it matters:** the question "can a party pack, court, or predict the
  court?" answers *predict, trivially; pack, only as the player; court, only as
  the player*. `reference` (:12455) prints `courtGap` to the player outright.
- **Upgrade:** if the bench is to be an actor, a case needs justices who differ:
  score a docket row per justice by `dist2(j, thingPos)` and take the majority,
  so a 9–7 bench and a 16–0 bench behave differently and the panel can print a
  division. That also gives `j.party` and the impeachment/packing actions
  something to bite on beyond a mean.

### No engine can pack, lobby, or campaign for the court — [missing]

- **What:** every instrument that touches the bench is player-only.
  `lobbySenate` and `courtCampaign` (:12426-12438), `impeach` (:12439),
  `lowerCourts` (:12450), `reference` (:12455), `dissents` (:12462) are `ACTIONS`
  cards read through `doAction`/`actionOpen` on the global `S`; `expandCourt`
  (:6334) is an `ACT` behind `doAct`, which refuses anyone but the player
  (:6510). `st.court.seniorLobby` and `st.court.campaign` are written **only** at
  :12430, :12431, :12436, :12437.
- **Evidence:** grep `seniorLobby|court.campaign` → writes at 12430/12431/
  12436/12437, reads at `courtSeat` :11796 and :11835-11836 and the panel
  :15425-15426. Nothing else in 3 MB.
- **Confusingly**, the AI deck *has* a card called `court` (:34343) and it has
  nothing to do with the court — it courts a **bloc** and writes `st.blocs`
  (:34359). A reader looking for the engine's court behaviour finds it and
  stops.
- **Why it matters:** the court is the one institution the player can bend and
  no opponent ever contests it. Over a long campaign the bench is whatever the
  player made it, unopposed.
- **Upgrade:** a `bench` card for the deck that writes
  `st.court.seniorLobby[pid]` / `st.court.campaign[pid]` for the acting party
  rather than for `st.ruling` (see the next finding — the same keying bug is
  already in the player's cards), gated on a court election being near.

### A junior partner buys court seats for its senior partner — [inconsistent]

- **What:** the Court actions are gated by `actionNeed(a)`, which for
  `cat:'Court'` falls through to `'gov'` (:10869-10873), and `modeAllows(st,'gov')`
  is `inPower(st)` — **any** coalition member, not the head of government
  (:10850-10855). But the bodies write `S.court.seniorLobby[S.ruling]`,
  `S.court.campaign[S.ruling]` and `justices.push({party:S.ruling, …})`.
- **Evidence:** :12430, :12431, :12436, :12437 (`S.ruling`), :12446 (`impeach`
  seats `party:S.ruling`), `actionNeed` :10869, `modeAllows` :10850.
- **Why it matters:** a junior-partner player spends their own capital and their
  own money and every point of it is credited to the party they are junior to.
  The Court panel then prints those justices under the senior partner's name
  (:15392). This is `CLAUDE.md`'s "a shared body right for the new caller can
  still be wrong for the old one", with the new caller being the S17b chair.
- **Upgrade:** key all four to `playParty(S)`; `courtSeat` already reads the
  table by party id, so nothing downstream changes.

### The court's article tiebreak reads a field nothing writes — [decorative]

- **What:** `v17Docket`'s article arm decides which of a conflicting pair the
  court reaches with `var la = (c.arts[pr.a.id] || {}).laid || 0, lb = …laid || 0;
  var later = lb >= la ? pr.b.id : pr.a.id;`. **`laid` is never written onto an
  adopted article.** `v11AdoptArticle` writes `{year, margin, entrenched, turn}`
  (:31686) and the custom start writes `{year, margin, founding, entrenched,
  turn}` (:36438). The only `laid:` writes in the file are on `c.pending`
  (:38347) and on treaties.
- **Evidence:** :39341-39342; `v11AdoptArticle` :31686; `grep -n "laid:"` →
  17887, 18001, 36532, 38347 — none on `c.arts`.
- **Poisoned:** adopting `artSecessionBar` at turn 5 and `artSecessionRight` at
  turn 90, and then the reverse order, the docket names **`artSecessionRight`
  both times** — always the `b` side of the `V17_CONFLICTS` literal, never the
  one adopted later. The comment above it says "the later one is the one the
  court reaches" (:39340).
- **The mirror image:** `c.arts[id].turn` **is** written and is read by nothing
  (`grep -n "rec\.turn|arts\[[a-z.]*\]\.turn"` → no hits). The value the
  tiebreak wants is already on the record under a different name.
- **Upgrade:** read `.turn`. One word.

### Every extraordinary measure is player-only — [missing]

- **What:** all 60 measures are unreachable by any engine. `extraWhy`'s first
  line is `if (!leads(st)) return 'Only the party leading the government may
  sign one.'` (:7737), and its book gate then reads `st.ruling` (:7741).
  `doExtra` (:7814) reads the global `S`, spends `S.capital`, and is called from
  exactly two DOM click handlers (:15676, :19667). `extraRepeal` (:15297) is the
  same. The court's review of a measure, `extraReview` (:7839), only ever has a
  measure to review because the player signed one.
- **Evidence:** :7736-7768, :7814-7837, :15297, callers at :15676 and :19667.
- **Measured:** `Object.keys(S.extra).length === 0` at the end of all six
  campaigns.
- **Why it matters:** the descent into an authoritarian state is a thing only
  the player can do. An engine government under maximum unrest signs nothing,
  builds no apparatus, and `securityState` never moves for it — so the whole
  ratchet described in `MAP.md`'s S15g section is one player's private track.
  Eight of the sixty measures reach other parties directly (`wreck` on
  `investigateOpposition`, `arrestOpposition`, `x15unityFront`,
  `x15morallUnfitOffice`, `x15militiaAuxiliaries`, `x15treasonCourts`; `gerry`
  on `federaliseElections`, `loyaltyRolls`) and none of them can ever be aimed
  at the player.
- **Upgrade:** a `measure` deck card behind the same `extraWhy` predicate with
  the actor threaded through it (the way S17k threaded `v11CanPropose` and
  `v10OrderOpen`), so an engine government can descend and the player can be on
  the receiving end of it. `extraWhy` needs an `actor` parameter and `st.ruling`
  reads become `actor`.

### The article vote's sponsorship bonus goes to the player, not the proposer — [inconsistent]

- **What:** `v11ArtSupport` adds `+20` for `pid === playParty(st)` and `+11` for
  a coalition member **only when the player leads** — regardless of who laid the
  article. The proposer is on the record since S17k (`p.by`) and the vote model
  reads it only to subtract a grudge (:31396-31399), never to add sponsorship.
- **Evidence:** :31384 `if (pid === me) score += 20;`, :31385
  `if (co.indexOf(pid) >= 0 && inPower(st) && me === st.ruling) score += 11;`.
- **Poisoned:** with SD laying `artResidentFranchise` (SD is .039 from it, LP is
  .461), LP scores **95.01** and SD **87.95**. Repointing `playParty` to `pnl`
  drops LP to **64.01** and SD to **76.95** — a 31-point swing on a party that
  did nothing, and the article's own author is behind the player on their own
  amendment.
- **Why it matters:** every engine amendment carries the player's party's seats
  as if the player had sponsored it. It inflates the pass rate of articles the
  player never wanted and makes an opposition player a phantom co-sponsor of
  everything.
- **Upgrade:** `+20` to `p.by` when there is a `p.by` (fall back to
  `playParty` only for the pre-S17k shape), and make the `+11` coalition term
  read whether the **proposer** leads, not whether the player does.

### The player pays for an engine's failed article — [inconsistent]

- **What:** `v11ConTick`'s failure branch docks `st.capital` 3, `st.unity` 5 and
  adds 2 unrest, with no reference to `p.by`.
- **Evidence:** :31674-31677.
- **Measured:** 52 AI articles reached a verdict in 720 sessions; **12 carried,
  40 failed**; `st.capital` fell by **57.7** across the six campaigns purely
  inside `v11ConTick` (the rest of the 120 is absorbed by the `-5` floor).
  Unity and unrest are not floored the same way.
- **Why it matters:** the player is charged for other parties' constitutional
  losses at roughly ten capital a campaign plus a steady unity drag, with
  nothing on screen saying why.
- **Upgrade:** charge the proposer — `partySpend`/`v16AiPay` for an engine,
  `st.capital` only when `p.by === playParty(st)`. The unrest and the unity are
  arguably national and can stay.

### The player can withdraw or campaign for anybody's article, free, from any chair — [exploitable]

- **What:** the pending panel emits *Make the case* and *Withdraw it* on every
  card in `c.pending`, with no `p.by` test and no chair test. `v11WithdrawArticle`
  costs no capital, deletes the entry, and logs *"The government withdrew …"*.
- **Evidence:** :32553-32575 (both buttons unconditional; the Withdraw button
  carries no `disabled` expression at all), `v11WithdrawArticle` :31576-31584,
  handler :32637.
- **Measured:** laying `artResidentFranchise` as SD and then calling
  `v11WithdrawArticle('artResidentFranchise')` from the player's chair removes
  it — `withdrewSomeoneElses: true`, capital cost 0.
- **Why it matters:** the engine's only constitutional instrument can be
  cancelled by one click for 3 unity, from opposition. This is the S18b family
  exactly: an enabled control that does something it should not, on a page the
  harness walks.
- **Upgrade:** gate both buttons and both functions on
  `p.by === playParty(S)` (with the pre-S17k fallback), and give the shut
  button a title saying whose article it is. The panel should also **print
  `p.by`** — right now it never says which party laid the thing.

### The player can revoke an engine's order — [exploitable]

- **What:** `v10RevokeOrder` gates on `inPower(S)` and nothing else: not the
  signing party, not the department. The register card offers Revoke on every
  live key.
- **Evidence:** `v10RevokeOrder` :28745-28755 (`if (!inPower(S))` at :28747),
  card :30215-30224 (`data-order-revoke` emitted for every live key).
- **Why it matters:** a junior partner can unwind the senior partner's whole
  order book, and an engine's 98 signings across a campaign survive only at the
  player's pleasure. `v17OrderCore` writes `by:actor` (:38374) and this is the
  one place that most needs to read it.
- **Upgrade:** require `rec.by === playParty(S)` or the strict
  `st.exec[o.dept] === playParty(S)`; `officeMine` is the S17a predicate for it.

### No engine ever campaigns for the article it laid, and 40 of 52 fail — [missing]

- **What:** `v11CampaignArticle` (:31565) is player-only — global `S`, `flash`,
  `captureUndo`, `render`, and it charges `S.capital`. Nothing in the deck or in
  `v16AiTurn` touches `p.campaign`. An engine lays an article and then watches.
  Each case is worth `+4.5` on the chamber margin (`boost` at :31593), up to
  three.
- **Evidence:** :31565-31575; `v11ArtVerdict` :31590-31605.
- **Measured:** `p.campaign > 0` on an AI-laid pending at verdict time: **0 of
  52**. Carry rate 12/52 = 23%.
- **Why it matters:** the engine spends 34 of its purse on a 23% shot and then
  declines the one lever that would move it, which is a strictly worse play than
  not laying at all.
- **Upgrade:** an `articleCampaign` branch on the deck's `article` card (or a
  posture that lets the same card top up an existing pending of its own),
  paid from `partyPurse` through `v16AiPay`, capped at the same three.

### `charter` is the one goal whose named target never reaches the verb — [inconsistent]

- **What:** `v20Aim(st, pid, kind)` is the aim-reading accessor and it is asked
  four questions: `'carry'` (:34314, the bill picker), `'ground'` (:34353, the
  bloc card), `'enter'` (:34442, the platform card) and `'office'` (:38058, the
  exec race). It is **never** asked `'charter'`. The `charter` goal computes its
  `ref` by calling `v17AiArticleFor` at adoption time (:34847-34861) and the
  card recomputes `v17AiArticleFor` at play time (:34479) — two independent
  evaluations of a function whose input (`ppos`) drifts. Nothing passes `g.ref`
  into the pick.
- **Evidence:** `v20Aim` :34276-34281; call sites `grep -n "v20Aim("` → 34276,
  34314, 34353, 34442, 38058. `charter.target` :34847; `article.run` :34479;
  `charter.worth` gives `article: 1` (:34873).
- **Why it matters:** a party can hold the goal "Carrying the Article of the
  Resident Franchise" (`say` at :34870) and lay a different article, and the
  panel will still print the first sentence. S20g fixed exactly this shape for
  the bloc card and the bill and left the constitution behind.
- **Upgrade:** one line in `v17AiArticleFor` — take `v20Aim(st, pid, 'charter')`
  first and return it if `v11CanPropose` allows it, else fall through to the
  distance rule. The same for `v17AiOrderFor` if an `order` aim is ever added.

### An engine can never repeal an article, and never uses the plebiscite road — [missing]

- **What:** the deck's `article` card calls
  `v17ArticleCore(st, pid, id, false, 'assembly')` — `repeal` hardcoded false,
  `route` hardcoded `'assembly'`. `v17AiArticleFor` also skips any adopted
  article (`if (v11Adopted(st, a.id)) return;` at :38392), so it cannot even
  *name* one to repeal.
- **Evidence:** :34480, :38392.
- **Measured:** 0 repeals and 0 non-assembly routes in 52 lays.
- **Why it matters:** two consequences. An engine cannot undo an article the
  player carried, so the document is a one-way ratchet in the player's favour —
  which is the shape S15g removed from the extraordinary measures for exactly
  this reason. And under a form with no elections the assembly road is closed
  and the plebiscite is the *only* road (`v11ArtVerdict` :31595, `V11_ROUTES`),
  so an engine's constitutional instrument stops working altogether at precisely
  the moment the constitution matters most.
- **Upgrade:** widen `v17AiArticleFor` to return `{id, repeal}` — the furthest
  **adopted** article beyond some distance is the natural repeal candidate, and
  it reuses `v11ArtSupport`'s existing mirrored-position arithmetic (:31380).
  Take the plebiscite road when `lowerState(st) !== 'sitting'` and
  `v11Adopted(st,'artPlebiscite')`.

### The one-ply evaluator cannot see what an instrument does — [shallow]

- **What:** `v19Outcome` clones, runs the card, and reads `v19Standing` at once
  (:35264-35281). At that instant a laid article is only **pending** — it is not
  voted on until `v11ConTick` two sessions later — and a signed order has done
  nothing but subtract 1 liberty and 1.5–2.6 crown (:38380-38381), because every
  standing effect it has lands in `v10OrdersTick` on the **next** tick
  (:28769-28776). `v17Utility` (:13696-13717) contains no constitutional term at
  all: no `v11ConEffects`, no article count, no court reading. So the sim's whole
  view of both instruments is their cost.
- **Evidence:** :35264, :35250-35262, :13696, :28769-28776, :31606.
- **Why it matters:** at `shrewd` and above, the sharper the AI setting the
  *more* it is told that laying an article is a bad idea. The only thing pushing
  an engine toward these cards is the goal `worth` table and the tempo dice.
  Party purses at turn 1 measure 24–44 (p8) against a card cost of 34, so a
  party can rarely afford one anyway.
- **Upgrade:** give the article and order cards a forecast term rather than a
  simulation term — `v11ArtForecast(...).lower - v11ConThreshold(...)` and the
  order's `v10OrderMods` delta scored through `v17Utility` — computed without
  driving a tick. That is the same move S19a made for the floor when it stopped
  taking the table's word for what a card is worth.

### Rivalry reaches the card but never the target — [shallow]

- **What:** `V19_RIVAL_WORTH` gives `article: .20` and `order: .15`
  (:35169-35181) and `v19Score` multiplies that by the rival reading
  (:35315-35320). So a strong rival makes a party **more likely to reach for an
  instrument** and does not change **which** instrument it reaches for: neither
  `v17AiArticleFor` nor `v17AiOrderFor` takes a rival, a grudge or a target
  party as an argument.
- **Evidence:** :35169, :35318, :38389, :38403.
- **Structural ceiling:** an article's `apply` and an order's `onIssue` never
  touch a party. Regex over all 81 `apply` bodies and all 90 `onIssue` bodies
  for `banned|cordon|st.seats|partyRel|PARTY[` → **zero hits** (p8). No order
  targets a party (targets are power ×11, work ×1). So even a rival-aware picker
  has nothing party-aimed to pick. The only party-aimed instruments in this whole
  area are the eight measures with `wreck`/`gerry`, and those are player-only.
- **Why it matters:** the answer to "does an engine ever use an instrument
  against the player or against a named rival" is **no, and it structurally
  cannot**.
- **Upgrade:** the instrument that *can* be aimed is the one that already reads
  a party — `v11ArtSupport`'s institutional self-interest (`d.senate`, `d.term`,
  `d.franchise`). Pick the article whose institutional term is worst for the
  rival and best for the actor; that is a hostile amendment without inventing a
  new mechanism, and it is computable from what is there.

### Authorship is forgotten the moment an article carries — [missing]

- **What:** `v11AdoptArticle` writes `{year, margin, entrenched, turn}` and drops
  `p.by` (:31686). `p.by` itself is read in exactly two places —
  `v11CanPropose`'s one-at-a-time rule (:31512) and `v11ArtSupport`'s grudge
  term (:31397) — and is **never rendered**: the pending card at :32560-32575
  does not name the party that laid it.
- **Evidence:** :31686, :31512, :31397, :32560-32575.
- **Why it matters:** this is why nothing can answer "does an engine defend an
  article it adopted". Defence exists only as position: `v11ArtSupport` scores a
  repeal against the mirrored position `{e:-a.pos.e*.72, a:-a.pos.a*.72}`
  (:31380), so a party that liked the article dislikes the repeal — but that is
  geometry, not memory. Nothing calls `shiftPartyRel` or `v16Resent` when an
  article carries, fails, is repealed, or is struck (`v11AdoptArticle` :31684,
  `v11RepealArticle` :31693, `v17StrikeComply` :39382-39393 — none of the three
  touches relations or the grudge ledger).
- **Upgrade:** store `by` on the adoption record; move a grudge when an article
  a party laid is repealed or struck, and a small `partyRel` gain toward the
  parties that voted for it. The channel (`v16Resent`) already exists and
  `V17_MEMORY` fails `roads.js` if a verb arrives without a weight — so this is
  a weight entry plus a call.

### An engine's order record says who signed it and nothing reads it — [decorative]

- **What:** `v17OrderCore` writes `by:actor` into the registry (:38374).
  Searching for a reader: `grep -n "rec\.by|\.by ===|\.by !=="` returns only
  :37966 and :38147, both on exec-race records (`e.by === 'the membership'`).
  The register card prints "In force since <year>" and never the party
  (:30215-30224). `v17StrikeComply` revokes without asking whose it was
  (:39374-39378).
- **Evidence:** :38374 (write), :30215-30224 (render, no `by`), grep above.
- **Why it matters:** an order in force is one of the few visible traces an
  engine government leaves, and the page cannot say who signed it. It is also
  the field that would fix the revoke gate above.
- **Upgrade:** print it; read it in `v10RevokeOrder`; use it in a new docket arm.

### The order gate is looser for the player than for an engine — [inconsistent]

- **What:** `v10OrderOpen` refuses unless `st.exec[o.dept] === actor`, **except**
  that the player also passes on `holdsDept(st, o.dept)` — the coalition-wide
  test. So the player may sign for a department a partner holds; an engine may
  not.
- **Evidence:** :28718
  `if (st.exec[o.dept] !== actor && !(actor === playParty(st) && holdsDept(st, o.dept)))`;
  `holdsDept` :10719-10722.
- **Why it matters:** `CLAUDE.md` records the ruling that "a gate that decides
  who may *sign* has to ask about the actor by name", and this line keeps the
  loose reading for exactly one actor. In a four-office coalition the player can
  sign from four departments and each engine partner from one.
- **Upgrade:** delete the exception, or extend it symmetrically to any coalition
  member. One rule for one surface.

### Two different 12% gates guard the same card — [inconsistent]

- **What:** the `article` card's `can` refuses at `seatShare(st, [pid]) < .12`
  (:34475), raw seats over `CFG.seats`. The `charter` goal's `fits` opens at
  `v17Share(st, pid) >= .12` (:34846), which is `v17Weight / v17House` and
  therefore reads the governing-council weight when the lower house is suspended
  or abolished.
- **Evidence:** :34475, `seatShare` :11040; :34846, `v17Share` :37403.
- **Why it matters:** under a suspended chamber a party can hold the goal and be
  refused the card, or the reverse — the aim and the instrument disagree about
  whether the party is big enough.
- **Upgrade:** one predicate, read by both. `v17Share` is the one that survives
  a chamber being closed.

### The instrument cards are shut in the two commonest postures — [shallow]

- **What:** `article`'s `post` list is
  `['consolidate','attack','govern','organise','moderate']` and `order`'s is
  `['govern','partner','consolidate']`. Against the baseline posture
  distribution (hold 39.2%, partner 20.7%, govern 16.0%, moderate 10.1%,
  organise 7.9%, attack 4.9%), `article` is unavailable in **~60%** of
  party-sessions and `order` in **~62%**.
- **Evidence:** :34468, :34485; `v16Posture` :34116 (its `hold` fallback is the last line, :34142); baseline in `docs/S21-BASELINE.md`.
- **Why it matters:** combined with the four-session per-card cooldown (:35456)
  and the 34/22 purse costs against turn-1 purses of 24–44, the constitution and
  the order book are reachable by an engine only in a narrow window. 52 articles
  and 98 orders in 720 sessions is roughly one instrument per party per fifteen
  sessions.
- **Upgrade:** if `hold` is what a party does when it has nothing better, an
  instrument it can afford is better than nothing — put `article` and `order`
  in `hold` and let the score decide.

### Minor: `rulingEvent` addresses the player whoever is being ruled against — [inconsistent]

- **What:** the older statute court's event is titled *"The Supreme Court Rules
  Against You"* unconditionally, and `v17AiDecide` may be the one answering it.
- **Evidence:** :13622.
- **Upgrade:** the S17c pattern — name the government, and let
  `v17ReactionEvent` carry the player's line when it is not the player's
  decision.

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `c.pending[].by` | `v17ArticleCore` :38348 | `v11CanPropose` :31512, `v11ArtSupport` :31397. **Never rendered** — the pending card :32560-32575 has no `p.by` |
| `c.arts[id].laid` | **NONE FOUND** — `grep -n "laid:"` → 17887, 18001, 36532, 38347, none on `c.arts` | `v17Docket` :39341 (so the tiebreak is always `0 >= 0`) |
| `c.arts[id].turn` | `v11AdoptArticle` :31686, `v16CustomApply` :36439 | **NONE FOUND** — `grep -n "rec\.turn\|arts\[[a-z.]*\]\.turn"` → no hits |
| `c.arts[id].year` / `.margin` / `.entrenched` / `.founding` | :31686, :36438 | document panel :32498-32510, article card :32449-32455 |
| `c.arts[id].repealed` | `v17StrikeComply` :39385 | `v11Adopted` :31323, `v11ConEffects` :31350 |
| `p.campaign` | `v11CampaignArticle` :31572 (player only) | `v11ArtVerdict` :31593, pending card :32557. **0 of 52 AI pendings ever carried a value** |
| `v10Orders()[key].by` | `v17OrderCore` :38374 | **NONE FOUND** — `grep -n "rec\.by\|\.by ===\|\.by !=="` → 37966, 38147, both exec-race records |
| `v10Orders()[key].status` / `.expires` / `.due` | :38374-38377, `v10OrdersTick` | `v10OrderCard` :30215-30224, `v17Docket` :39315, `v10OrderMods` :28520 |
| `st.court.size` | `expandCourt` :6340, article apply :31896, custom start :36511 | **NONE FOUND** — `grep -n "court\.size"` → 6340, 31896, 32352 (comment), 35448 (comment), 36511, 39618 (comment). Already named in `CLAUDE.md`; three writers, no reader |
| `st.court.seniorLobby` / `st.court.campaign` | `lobbySenate` :12430-12431, `courtCampaign` :12436-12437 — **player only, keyed to `S.ruling`** | `courtSeat` :11796, :11835-11836; Court panel :15425-15426 |
| `st.court.justices[].party` | :6339, :7895, :8553, :11754, :11782, :12446, :17384 | display only — Court panel :15392 |
| `st.court.justices[].e/.a` | as above, plus `lowerCourts` :12453 (drags every justice 4% toward `govPos`), `regimeCycle` :11754, `courtElection` :11782 | `courtPos` :10652, `courtWith` :10657 — as a mean and a count, never individually |
| `st.court.defied` | `v17StrikeDefy` :39402, `extraEvent` defy :7879, `applyRuling` :13603 | `v17CourtAppetite` :39303 |
| `st.pendingStrike` | `v17CourtTick` :39367 | `endTurn` :13501, `v17CourtTick` guard :39354, `v17StrikeComply/Defy` :39399/:39410. **Set 0 times in 720 sessions** |
| `st.extra[id]` | `doExtra` :7820, `extraReview` :7852, `extraEvent` :7868/:7878/:7889, `extraRepeal` :15306 — **all player-reachable only** | `extraWhy` :7738-7754, `extraSecurity` :7776, `extraMods` :7789, `extraActive` :7803, `extraPower` :7809. **Empty in all six campaigns** |
| `st.precedents` | `v17StrikeComply` :39398, `extraReview` :7853, strike event :39423 | `extraWhy` :7757, `extraReview` :7849, acts panel :32595 |
| `st.salience.federal` | `v17ArticleCore` :38349, `v11CampaignArticle` :31573 | `v11ArtForecast` :31434 |

## What I could not verify

- **Who answers a strike when the player is not the deciding chair.** `v17Route`
  and `v17AiDecide` exist and the strike event declares `office: r.dept || 'chan'`
  (:39413), and I confirmed by hand that a leading player decides it
  (`v17Decides` → true, p4). I did **not** drive an opposition player into a
  real strike, because the docket never fills in play — so whether
  `v17AiDecide`'s sandbox scoring handles the three strike choices sensibly is
  unverified.
- **Whether `pendingStrike` can wedge the court permanently.** `v17CourtTick`
  returns early while `st.pendingStrike` is set (:39354) and the event is queued
  rather than resolved. A player who never answers should block the court
  forever. I could not reproduce it because no strike ever fired; the reasoning
  is from the code, not from a run.
- **Whether the 12 carried AI articles were ones the parties would want.** I
  counted carries, not whether the carrying party's own `worth`/aim was served.
- **Posture percentages** are quoted from `docs/S21-BASELINE.md`, not
  re-measured here; the `~60%` and `~62%` unavailability figures inherit that.
- **`v16Posture`'s line number** — I read the body (its `hold` fallback and the
  `consolidate` 22% bar) but did not record the exact first line; every other
  anchor in this report is a verified line number.
- **The 60 statutes/measures with `power`** (p8, `measuresWithPower: 60`) means
  `X(o)` defaults the field on every measure, not that 60 measures author one.
  I did not separate authored from defaulted.
