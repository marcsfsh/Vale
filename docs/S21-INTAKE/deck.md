# deck — the engine's action deck

## What it does today

`V16_AI_DECK` (line 34328) is eleven cards. Once every four sessions on average
(`V16_AI_CADENCE = 4`, line 34040, weighted by `v18Tempo` at 35381), each engine
party filters the deck by its posture (`c.post.indexOf(post)`, 35455), by a
four-session per-card cooldown (35456), and by `c.can` (35457), then draws one by
`exp(sharp * v19Score)` (`v19Choose`, 35327). The card spends the party's own
purse (`v16AiPay`, 34054) and writes into `st.machine`, `st.blocs`, `st.push`,
`st.funding`, `st.aiPacts`, or calls one of four shared Cores the player's own
buttons call (`v17ArticleCore` 38339, `v17OrderCore` 38369, `v17FloorCore` 38305,
`sponsorBill` 9266). That is the whole of what a party can decide to do.

**My own measurement** (6 seeds x 60 sessions = 360 sessions, 2,160
party-sessions, `normal`/`epic`/`lp`, `aiLevel:'ruthless'`, `SEED_OVERRIDE` set
before `newGame`, `runQueue` overridden per CLAUDE.md; identical on two runs):
513 plays, 0 nulls. organise 87, campaign 28, court **140**, attack 28,
platform 8, pact 13, article 28, order 41, floor 31, bill 27, demand 82.
Postures: hold 995, partner 490, govern 342, moderate 197, organise 128,
attack 8, **consolidate 0, restive 0**.

---

## Findings

### `court` is the most-played card and it costs the party votes — [exploitable]

- **What:** `court` banks +2.6 onto one bloc's national mood (34359). `st.blocs`
  is a *shared national* number, and `supportTargets` reads it twice with
  opposite signs: the bloc's `weight` rises with mood (`.55 + st.blocs[b]/100*.95`,
  11496) but a party's `appeal` for a bloc is `.915 + (m-50)/80` if it is the
  ruling party, `.86 + (m-50)/108` in the coalition, and **`.784 - (m-50)/130` if
  it is not** (11509-11511), then multiplied by `1 + ext*max(0,60-m)/60*2.4`
  (11513), which also falls as mood rises. For a party outside government the
  second and third terms beat the first.
- **Evidence:** card at 34343-34361; `supportTargets` 11487-11531. Measured
  through the game's own path (read `supportTargets(st)[pid]` immediately before
  and after `run`, nothing else changes in between): **140 plays, 111 down, 29
  up**; mean **-0.70%** of the playing party's projected share; opposition plays
  (111) mean **-1.08%**, government plays (29) mean **+0.73%**.
- **Why it matters:** the single most-chosen card in the deck (27% of all plays)
  spends 36 of a purse that averages 57.6 to make the party *slightly less*
  likely to win the seat it is chasing, four times out of five. And the chooser
  actively steers into it: `ground.fits` returns .9 unconditionally (34799),
  `ground.worth.court` is 1 (34822), and `court` is the one card `v19Outcome`
  scores strongly positive (below), so the two upper AI rungs pick it *more*.
- **Upgrade:** either give `court` a party-scoped channel the ballot reads (a
  per-party bloc lean, the way `st.press`/`st.gerry` are per-party), or flip its
  sign for a party out of government — court a bloc by moving *its* appeal to
  you, not the whole country's mood. Whatever the fix, assert it by reading
  `supportTargets(st)[pid]` either side of the card, not by reading `st.blocs`.

### `v19Outcome` is a purse meter that rewards the one wrong card — [inconsistent]

- **What:** `v19Standing` (35250) = `v17Utility` + `v17Share*60` +
  `machine*25` + `min(20, purse/100)*1.2` + office bonuses. `v17Utility` (13696)
  reads indicators and `st.blocs` weighted by affinity (13715) and nothing a
  party does for itself. In a one-ply clone, seats do not move, offices do not
  move, and indicators do not move — so for 7 of the 11 cards the *only* term
  that changes is the purse going down, and the outcome term is **negative**.
  `court` is the exception: +2.6 on a bloc at affinity .9 is `2.6*.9*1.1 = +2.57`
  utility against a purse cost of ~0.43, i.e. `+2.14/12 = +0.18`, times
  `sim = 1.9` at ruthless = **+0.34** on a score scale where a goal's `worth` is
  .12-1.0, exponentiated at `sharp = 5`.
- **Evidence:** `v19Outcome` 35264-35279; the squash `/12` at 35278; `sim` values
  in `V19_LEVELS` 431-440; `v19Score` 35300-35301. The file's own comment at
  35240 says "nine of the ten cards moved it by exactly nought"; adding
  `v19Standing` fixed nought for `organise` (+0.75 machine - 0.50 purse = +0.25)
  and left the rest reading their own price tag.
- **Why it matters:** the deliberation the two top difficulty rungs buy is,
  card-for-card, "prefer whatever is cheap, and strongly prefer `court`". It is
  the mechanism that makes the sharpest card the worst one.
- **Upgrade:** score the outcome on `supportTargets(st)[pid]` and projected seats
  rather than on `v17Utility` plus a purse term — a party's standing is what the
  ballot would give it. Then poison by deleting the seat term and checking the
  card ranking actually moves.

### A party in government has almost nothing to do — [missing]

- **What:** only three cards list `govern` in `post`: `campaign` (34336),
  `article` (34468), `order` (34485). `organise`, `court`, `platform`, `floor`,
  `bill`, `demand`, `pact` and `attack` are all closed to the head of government
  by their `post` arrays or by their `can` (`attack` 34369, `pact` 34452,
  `bill` 34532, `demand` 34573 all refuse `st.ruling`).
- **Evidence:** measured, `govern` is 342 of 2,160 party-sessions (15.8%) and the
  open set is **empty on 165 of them (48.2%)**; mean open-set size in `govern` is
  2.04 (max 3) against 5.13 in `hold` and 5.58 in `moderate`.
- **Why it matters:** the AI government is the opponent the player spends most of
  the campaign against, and it is the *least* active party on the board. It
  cannot build its machine, cannot court a bloc, cannot work the floor, cannot
  answer an attack. Everything it does as a government comes from `aiGovern`
  (13556) — one bill every other session, picked *uniformly at random* out of its
  manifesto gaps (`cands[Math.floor(rand()*cands.length)]`, 13573), free, with no
  forecast, no strategy, no whip and no press.
- **Upgrade:** open `organise`, `court`, `floor` and `platform` to `govern`, and
  give `aiGovern` `v19BillFor`'s forecast instead of a uniform draw — the
  intelligent bill picker already exists at 34284 and the government does not use
  it.

### `aiGovern` and `bill` are two bill-laying paths with different intelligence — [inconsistent]

- **What:** the deck's `bill` card (34556) picks via `v19BillFor` (34284), which
  shortlists the five biggest manifesto gaps, runs each through `billForecast` on
  a throwaway probe bill, and takes the one the chamber would actually carry,
  with a `V20_AIM_BILL` thumb for the aim. `aiGovern` (13560-13575) takes an
  unweighted `rand()` pick over every gap.
- **Evidence:** 34296-34326 vs 13560-13575.
- **Why it matters:** the government — the party that can actually carry a
  statute — legislates worse than an opposition party with 16% of the chamber.
- **Upgrade:** point `aiGovern` at `v19BillFor`.

### `attack` moves a number the player moves five times harder — [shallow]

- **What:** `attack` costs 26 and moves `st.machine[target]` by
  `-V16_AI_ATTACK*2 = -.036` and its own by `+.018` (34403-34404, constant at
  34026), on a clamp of `-.8..1` (span 1.8).
- **Evidence:** the player's own party board does `-.12` in one click
  (`audit`, 12929), `-.09` (`v9leakPolling`, 23904), `-.07/+.06`
  (`v9poachOrganiser`, 23908), `-.06` on the government (`oppositionAttack`
  option 1, 12670) at 4 capital and cooldown 1. Measured, 28 attack plays across
  2,160 party-sessions: the *entire board's* attacking over 360 sessions moves
  about 1.0 machine-points in total.
- **Why it matters:** `machineOf` (11396) multiplies the vote by
  `machine * V15_MACHINE_GAIN(1.15)`, so .036 is a 4% swing on that bloc term —
  real per play, invisible in aggregate at this frequency. One player `audit`
  click outweighs three engine attacks.
- **Upgrade:** this is a balance dial and belongs to the owner
  (`V16_AI_ATTACK`'s own comment at 34017-34024 says so). The frequency, not the
  size, is the lever: 8 `attack` postures in 2,160 party-sessions (below).

### The hostility loop is a closed circle that barely turns — [shallow]

- **What:** `attack` posture needs a grudge >= 35 against the player or the
  ruling party (34138); `restive` needs >= 55 against the ruling party (34110-34114).
  Between engine parties, the only writers of a grudge are `attack` itself
  (`V18_ATTACK_RESENT = 21`, 34030, applied at 34418) and `v17FloorCore`'s
  `pressure` (+10, 38332). Grudges cool 0.6 a session (35528-35530 region).
- **Evidence:** measured over 2,160 party-sessions: `attack` posture **8 times
  (0.4%)**, `restive` **0 times**, `consolidate` **0 times**. The baseline's
  `oust` goal — the only goal that names a party, `fits` requiring grudge >= 25
  (34772) — was held **0 times**.
- **Why it matters:** four cards list `consolidate` in `post` and four list
  `restive`; those entries are dead in play. The whole S18e "a partner that has
  had enough" mechanism, its bar, its comment and its card list never fire.
- **Upgrade:** either lower the bars against the measured grudge distribution
  (mean 22.13 per the baseline) or widen what writes a grudge — and measure the
  distribution *in play* before picking the number (CLAUDE.md's S17q rule).

### `pact` is a one-way door, and one party can be in several — [exploitable]

- **What:** `run` writes `st.aiPacts[pid] = { with:o }` and never writes
  `st.aiPacts[o]` (34459-34460). The refusal at 34609 checks only
  `st.aiPacts[o.id] || st.aiPacts[pid]` — a *key* lookup. Nothing anywhere scans
  the values for `.with === someone`.
- **Evidence:** writer 34459-34460; the only reads are the key filter 34609, the
  key-wise expiry at the count 12005-12008, and the ballot wrapper 35544-35550,
  which iterates keys and reads `.with`.
- **Why it matters:** if A pacts with B, B is not recorded as pacted. B may
  immediately pact with C, and C may pact with B. Each entry pools 6% of the two
  parties' combined vote and splits it (35548-35549), so B collects the boost
  twice or three times, and B's own `pact` card is never refused. This is
  precisely CLAUDE.md's "a relation declared on one card and not the other is a
  one-way door".
- **Upgrade:** write both directions (or hold pacts in one symmetric list keyed
  by the pair) and assert BOTH directions, per the S17m rule.

### `attack` and `pact` move the player's relations for a fight the player is not in — [inconsistent]

- **What:** `st.partyRel` is a **single number per party — how that party feels
  about the player** (`shiftPartyRel`, 8748: `st.partyRel[pid] = c100(... + n)`).
  `attack.run` does `shiftPartyRel(st, pid, -3)` (34405) and `pact.run` does
  `shiftPartyRel(st, pid, -2)` (34461) unconditionally.
- **Evidence:** 8748; 34405; 34461. The target of the attack is `t`, computed at
  34391-34402, and is not passed to `shiftPartyRel` at all.
- **Why it matters:** an engine party that attacks *another engine party* — the
  channel S18e built on purpose — loses standing with the player by the same 3
  points as if it had attacked the player. `partyRel` is worth `.22` a point in
  `partyBillSupport` (9032), so a feud between two other parties silently costs
  the player their votes. Two parties agreeing an electoral pact also costs the
  initiator (but not the partner) relations with a player who was not consulted.
- **Upgrade:** apply the relation move only when `t === playParty(st)`, and give
  the third-party case its own (probably positive, for the enemy of my enemy)
  term. Poison by making the target an engine party and asserting `partyRel`
  does not move.

### `campaign`'s election-eve gate is a tautology, and the card writes a number that decays before it counts — [shallow]

- **What:** `can` requires `pv5SessionsToBallot(st) !== null && <= 4` (34337).
  `pv5SessionsToBallot` is `nextBallot(st.turn) - st.turn` (16319);
  `isBallotTurn(t)` is `t > 1 && t % 2 === 1` (10630), i.e. an election every
  **two** turns (`CFG.term: 2`, line 405). The wrapper at 31765 can stretch the
  term to at most 6 and only with two term-lengthening articles adopted.
- **Evidence:** measured, the ballot clause refused **0 times in 484 asks**.
- **Why it matters:** the card reads as "take the campaign into the country
  early" and is in fact permanently available. Its whole effect is
  `partySpend(40)` → `st.funding += .08` (16493), which decays x.6 a session
  (13484). Measured AI funding: mean **.058**, p90 **.113**, never at the .35
  clamp — so one campaign card is more funding than the passive burn produces in
  steady state, and two-thirds of it is gone by the next election.
- **Upgrade:** either delete the clause (it is a knob nothing can turn) or make
  it mean something — `<= 1`. And consider whether the card should write the
  campaign assets the player writes rather than the raw multiplier.

### `order` signs region-targeted orders at powers that do not exist — [exploitable]

- **What:** `v17AiOrderFor` (38403-38411) returns
  `{ id:o.id, target: o.target ? REGIONS[0].id : null }`. **No order in the file
  has `target:'region'`** — `grep "target:'region'"` returns nothing; there are
  11 with `target:'power'` and 1 with `target:'work'` (29719, 29723, 29727,
  29731, 29772, 29816, 29822, 29850, 29884, 29888, 29892, 29896).
- **Evidence:** measured, 41 order plays, of which **9 passed `'somnium'`** (the
  first region's id) as the target. `v10OrderOpen` (28701-28730) never validates
  the target against `o.target`, so it is accepted. `v10OrderMods` then writes
  `m.powers['somnium'] += o.powerEff` (28599) — a key no power reads, so the
  order's diplomatic half is silently dropped. `v10OrderTitle` (28756-28762)
  falls through every branch to `o.name + ' (somnium)'`, which is what the log
  line at 38383 and the deck's own line at 38494 print to the player.
- **Why it matters:** a fifth of the engine's executive orders are aimed at
  nothing and print a raw lower-case id in the log. This is the "typeof x ===
  'string' is not validation" rule: the target came from a table nobody checked
  it against.
- **Upgrade:** pick the target from `o.target`'s own registry (`POWERS`,
  `V8_WORK`) and pick it by the party's aim, not by index 0. Add the validation
  to `v10OrderOpen` so both callers are covered by one gate.

### Every target the deck picks that is not the bloc, the bill or the attack is fixed — [shallow]

- **What:** `v17AiOrderFor` (38403) walks `V10_ORDERS` in declaration order and
  takes the **first** open one (`if (best) return;`). `v17AiArticleFor` (38389)
  takes the article nearest the party's compass position with `d <= .8`, with no
  randomness and no aim — the same article every session until it is laid or
  fails. `v16PactPartner` (34604) takes the nearest party under .62. Only
  `court` (via `v20Aim`, 34353), `bill` (via `v19BillFor`'s forecast, 34284),
  `attack` (via the grudge/rivalry sum, 34391-34402), `floor` (via `v19Pivot`,
  38439) and `demand` (a gap-squared weighted draw, 9942-9948) choose.
- **Why it matters:** six of eleven cards are deterministic given the board, so
  two parties in the same position do the same thing, and a party repeats itself
  until the world changes around it.
- **Upgrade:** at minimum give `article` and `order` the `v20Aim`/weighted-draw
  treatment the other five already have.

### `article` cannot repeal, cannot go to the country, and is priced flat — [missing]

- **What:** `run` always calls `v17ArticleCore(st, pid, id, **false**,
  **'assembly'**)` (34480). `repeal` is hard-false and the route is hard-assembly,
  so `v11CanPropose`'s `a.referendum && route !== 'plebiscite'` (31525) closes
  every referendum article to every engine party forever. The cost is a flat
  `V17_AI_COST_ARTICLE = 34` (38189) whatever the article; the player pays the
  article's own `cost` field, which ranges 6 (`artPreamble`, 32219) to 26
  (`artAbolishUpper`, 31929).
- **Why it matters:** the engine can add to the constitution but can never take
  anything out of it, and it pays the same for the Preamble as for the Single
  Chamber. A player who wants an article gone never faces an opponent who wants
  it gone too.
- **Upgrade:** let `v17AiArticleFor` return `{id, repeal}` and price against
  `V11_ART[id].cost`.

### The money penalty in the chooser skips three cards — [inconsistent]

- **What:** `v19Score` reads `var cost = V16_AI_COST[card.id] || 0` (35293) and
  applies `-.22` when `purse < cost * 2.2`. `V16_AI_COST` (34016) has no
  `article`, `order` or `floor` key — their prices live in
  `V17_AI_COST_ARTICLE/ORDER/FLOOR` (38189-38191). So those three are scored as
  free and never take the "money it cannot spare" penalty.
- **Evidence:** 34016, 35293, 38189-38191. Same table, same bug shape:
  `V18_TEMPO.broke` at 35385 reads `V16_AI_COST.demand` (16) and calls it "under
  the cheapest card in the deck" (35375) — `floor` costs 12.
- **Upgrade:** fold the three S17 constants into `V16_AI_COST` and let both
  readers see all eleven. `roads.js` should fail if a deck card has no cost entry
  — the `V17_MEMORY` guard shape.

### `platform` writes a field only the election reads, and is open 9.5% of the time — [shallow]

- **What:** `st.push[pid] = { e:(toward.e-q.e)*.22, a:... }` (34445). The only
  reader is `driftParties` (11675-11677), which is called from exactly one place
  — `runElection` at 11970 — and then does `st.push = {}` (11680).
- **Evidence:** 34445, 11649-11682, 11970. Its `post` is
  `moderate, consolidate, attack, restive` (34423); measured, that is
  9.1 + 0 + 0.4 + 0 = **9.5%** of party-sessions, and the card was played **8
  times in 2,160**.
- **Why it matters:** position is, per the card's own S20g comment (34433-34441),
  the *only* road an engine has into a coalition. It is open on one session in
  ten and its aim (`enter`) targets `st.ruling` captured at adoption (34753)
  with `done` requiring coalition membership (34754) — which the baseline says
  never happens, because 360 of 360 formations are single-party majorities. And
  when `enter` is absent the card moves the party toward `PARTY[pid].home`, which
  `driftParties` already does at 11% every election anyway (11664-11665).
- **Upgrade:** open `platform` to `hold` and `partner`; make the non-`enter`
  branch do something the free drift does not.

### The whole S20b persuasion layer is player-only — [missing]

- **What:** `v20PressCore` (38277) moves `bill.pull[pid]` by 14 (own benches),
  9 (other parties) or 9/6 (both), repeatable at an escalating price, and
  `billPull` counts it through that party's seats (9165). Its only callers are
  the player's bill handler (9828) and the player's three buttons (14491-14500).
- **Evidence:** `grep 'v20PressCore\|v20PressWhy\|v20PressCost'` returns 9793,
  9799, 9828, 14491-14500 and the definitions — no deck call, no engine call.
- **Why it matters:** the engine's entire floor kit is `v17FloorCore`'s one line
  declaration, worth `+16/-18` once (9051), plus `pressure`. The player has that
  *plus* an unbounded, escalating ±14-a-push persuasion channel on every party in
  the House. The owner's own brief for S20b was "more ways to positively and
  negatively impact a bill"; the engine got none of them.
- **Upgrade:** a `press` card (or a `floor` verb) that calls `v20PressCore` with
  the party as actor. The Core already takes an actor and already handles a
  non-player one (`b.lines[actor]` at 38281).

### `floor`'s availability test asks about a different verb than the one it plays — [inconsistent]

- **What:** `v17AiFloorFor` (38473-38476) builds its candidate list with
  `!v17FloorWhy(st, pid, b, 'oppose')`, but `v19Pivot` may return
  `verb:'pressure'` (38468). `v17FloorWhy` has a clause that only fires for
  pressure: `if (verb === 'pressure' && b.lines[b.sponsor]) return 'The sponsor
  has been leaned on already.'` (38201). A bill whose sponsor was already leaned
  on stays in `live`, can be selected, and is then refused inside `run`, which
  returns null and spends the party's whole initiative on nothing.
- **Evidence:** 38201, 38473-38476, 38501-38505, and `run` at 34500-34504.
  Measured, `floor` returned null **0 times in 2,160 party-sessions**, so this is
  latent rather than live — but it is one added `lines` write away from firing.
- **Upgrade:** test with the verb that will be used, or filter after `v19Pivot`.

### The engine cannot press a government it does not sit opposite the player in — [missing]

- **What:** the `demand` card posts to `addInbox` (34581), which is the **player's**
  inbox. `confidence_threat` and `coalition_demand` — the only other pressure a
  partner can put on a government — are generated only under `if (leads(st) &&
  coalition.length)` (10268).
- **Evidence:** 34581, 10266-10281, `V18_PAPER_NEED.party_demand = 'any'` (10007).
- **Why it matters:** when an engine party governs, no partner ever threatens it,
  no party ever demands anything of it, and the player watching from the
  opposition bench sees a government under no pressure at all. Conversely the
  player *in opposition* still receives `party_demand` letters addressed to "the
  government" (34583-34585) whose decline option reads "the government has its
  own programme" (10064).
- **Upgrade:** route `demand` at `st.ruling`; when the government is an engine,
  resolve it in the model (grudge/relations/coalition cohesion) rather than
  through a paper.

### `st.press`, `st.gerry`, `st.coopted`, unity, factions, the campaign directorate and the interests are unreachable by any card — [missing]

See the asymmetry table below. These are not thin engine versions of player
verbs; they are channels the vote model reads that no engine party has any road
into at all.

---

## The asymmetry: what the player can do that no card mirrors

**Scale.** Player: **75** state actions in the `ACTIONS` literal (12175-12790)
plus `accede` pushed at 33550 = 76; **34** verbs against *each* of the six other
parties (30 in the base list 12796-13120, 4 in the v9 wrapper 23887-23908) =
204 buttons; **23** verbs on its own party (18 at 13122-13298, 5 at 23910-23930).
Engine: **11 cards**, one initiative every ~4 sessions, mean open set 5.1 in the
commonest posture and 2.0 in government.

| player verb (id, line) | what it reaches | engine mirror |
| --- | --- | --- |
| `organise` 13122 | `st.machine` **+.16**, unlimited (no `cool` field, so `doAction`'s 13386 never sets one) | `organise` card, **+.030** (34025), 4-session cooldown, 4.0% of party-sessions — one player click = ~2 whole engine campaigns of organising |
| `press` 13126, `v9partyPaper` 23918, `givepress` 12801 | `st.press[pid]`, read by `supportTargets` at 11523 as a straight vote multiplier | **none.** `grep 'st.press\[\|S.press\['` → writers at 11699 (defect transfer), 12804, 13059, 13129, 19115 (event), 23921. No AI writer |
| `gerry` 13130, `register` 13134 | `st.gerry[pid]`, read in `allocateSeats` 11581 | **none.** `grep 'st.gerry\[\|S.gerry\['` → 7826, 7872, 8352, 10254, 11582, 11696, 11705, 12808, 13133, 15311. No AI writer |
| the campaign directorate (`field`/`media`/`data`/`debate`, regional targeting x13, national message; buttons at 17012) | `pv5CampaignRaw` 16326 and `partyTurnout` 11418-11419, both gated `pid === playParty(st)` | `campaign` card: one number, `st.funding += .08`, decaying x.6 |
| `unityDrive` 13187, `expelFaction` 13191, `purgeList` 13138, `v9retreat` 23910, `reselect` 13175 | `st.unity` and `st.factions[me]`; unity feeds `partyTurnout` 11417 and `capitalIncome` 11184 | **none.** Engine parties have no unity term at all and their factions are written only by `v20Press` (38294) |
| the interests/lobby layer (`PV5_INTERESTS`, endorsements) | `endorsedTurnout` 11403 and `partyIncome` donors 16521 — both `pid === playParty(st)` | **none** |
| `ban` 13106, `split` 13082, `absorb` 13093, `splinter` 12986, `cordon` 12973, `prosecute` 13040, `cutFunding` 13055, `blackmail` 13000, `backChallenger` 13011, `byElection` 13062, `coopt` 13074, `discredit` 13078, `infiltrate` 12905 | existence, seats, money, leadership and legality of another party | **none.** `attack` is the deck's only hostile verb and it moves one number |
| `invite` 12862, `joinCoalition` 12953, `expelPartner` 12963, `tradeMinistry` 13027, `confidence` 12948, `leaveCoalition` 13243 | who is in the government, between elections | **none.** No card enters, leaves or reshapes a coalition; `enter` is a goal whose only instrument is `platform`'s compass nudge |
| `pressOwn`/`pressOthers`/`pressBoth` 14494-14500 | `bill.pull[pid]` ±14/9/6, escalating, per party, per bill (`billPull` 9165) | **none** (see finding above) |
| the bill drafting sheet — `whip`, `committee`, `concessions`, `urgent`, `confidence`, `strategy` | every term in `billPull` 9133-9172 | **none.** `sponsorBill` is called by the deck with `'clean'` and nothing else (34567) |
| `rider` 12376, `omnibus` 12384, `chairs` 12388, `specialSession` 12392, `adjourn` 12396, `censure` 12400, `appoint` 12408, `peerThreat` 12412, `lordsDeal` 12416, `purgeUpper` 12420 | procedure and the second chamber | **none** |
| the whole Treasury (8), Security (6), Diplomacy (10 + `accede`), Court (8), Society (6), States (4), Ministry (10) categories | indicators, the army, the bench, the states, the powers | **none.** The engine's only state instrument is `order`, and only when it holds the department |
| `courtLeader` 12730, `promoteProtege` 12748, `discreditLeader` 12765, `sackMinister` 12780 | the people in the offices (S15i) | **none** |
| `v9concede` 23887, `v9jointInquiry` 23897 | positive relations with another party | **none** — and per the baseline there is no gratitude or positive-memory field anywhere |

The engine's one capability the player does not mirror is `v17AiRaceSpend`
(38037, called from 38079), which is outside the deck.

---

## Cards whose per-play magnitude is beneath notice

| card | per play | against | verdict |
| --- | --- | --- | --- |
| `organise` 34333 | +.030 machine (34025) | clamp span 1.8 (-.8..1); `machineOf` x1.15 into the vote (11397). Measured 87 plays / 2,160 party-sessions = **+0.072 machine per party over a 60-session campaign, 4% of the span** | **beneath notice in aggregate.** One player click of `organise` (+.16, 13125) is 2.2 campaigns of it |
| `attack` 34403 | -.036 target / +.018 self | same span. 28 plays / 2,160 = ~1.0 machine-point of damage across the whole board in 360 sessions | **beneath notice in aggregate** |
| `court` 34359 | +2.6 on a 0-100 bloc | measured **-0.70%** of the playing party's own projected vote share, -1.08% in opposition | **worse than beneath notice — it is the wrong sign** |
| `campaign` 34339 | +.08 funding, decays x.6/session | measured AI funding mean .058, p90 .113, clamp .35 never reached. Contributes ~.08, .048, .029... to a `1 + funding + machine` multiplier | real for two sessions, then gone. 28 plays in 2,160 |
| `platform` 34445 | a 22% step toward a target | `driftParties` already moves 11% toward home and 9% toward the bloc centroid every election (11663-11665), and consumes and clears `st.push` at the count | real when the target is `enter`; a duplicate of the free drift otherwise. 8 plays in 2,160 |
| `pact` 34459 | +3% of the two parties' combined vote each at the next count (35548) | vote shares of .10-.25 → ~+0.5-1.0 points of share, ~5 seats | **the largest single-play effect in the deck**, 13 plays in 2,160 |
| `demand` 34581 | a letter; ignoring it is +14 grudge (10224), carrying it is -18 and +9 relations (10154-10155) | — | real, but only ever addressed to the player |
| `article` / `order` / `floor` / `bill` | call the same Cores the player's buttons call | — | full-strength per play; the constraint is frequency and target choice, not size |

---

## State channels

| field | written by (deck) | read by |
| --- | --- | --- |
| `st.machine[pid]` | `organise` 34333, `attack` 34403-34404, `v17FloorCore` pressure 38333 | `machineOf` 11397 → `supportTargets` 11517; `partyIncome` dues 16510; `capitalIncome` opposition branch 11188 |
| `st.blocs[b]` | `court` 34359 | `supportTargets` weight 11496 + appeal 11507-11513 (**opposite signs**); `partyIncome` donors 16518; `v17Utility` 13715; `ppos` centroid 11660 |
| `st.push[pid]` | `platform` 34445 | `driftParties` 11675-11677 **only**, called only from `runElection` 11970, and cleared at 11680 |
| `st.funding[pid]` | `campaign` via `partySpend` 34339 → 16493 (and the passive burn, 16373) | `supportTargets` 11516; decayed x.6 at 13484 |
| `st.aiPacts[pid]` | `pact` 34459-34460 (**one direction only**) | `ballot` wrapper 35544-35550; the refusal filter 34609; expired at the count 12005-12008 |
| `st.purse[pid]` | `v16AiPay` 34057 (all cards), `partySpend` 16491 | `partyPurse` 16478; every card's `can`; `v18Tempo` 35384; `v19Standing` 35258 |
| `ai[pid].grudge` | `attack` → `v16Resent` 34418; `v17FloorCore` pressure 38332 | `v16Posture` 34138; `v18Restive` 34114; `v16PactPartner` 34610; `partyBillSupport` 9074; `oust.fits` 34772; `v18Tempo` 35388 |
| `ai[pid].spent` | `v16AiPay` 34059, `campaign` 34340 | panel only (no model consumer found; `grep '\.spent'` → 34059, 34065, 34340 and the Parties page) |
| `ai[pid].last[card]` | 35493 | the cooldown 35456; the recency term 35290 |
| `ai[pid].why` | 35519-35524 | the Parties page (R2) |
| `st.partyRel[pid]` | `attack` 34405, `pact` 34461, `v17FloorCore` 38319/38322/38330-38331 | `partyBillSupport` 9032; `capitalIncome` broker 11195; coalition formation. **One axis only — the player** (8748) |
| `bill.lines[actor]` | `floor` via `v17FloorCore` 38321 | `partyBillSupport` 9051 (+16/-18) |
| `bill.pull[pid]` | `v20PressCore` 38287 — **no deck writer** | `billPull` 9165 |
| `V19_SIMULATING` | 35221/35230 | **NOTHING in vale.html.** `grep 'V19_SIMULATING' vale.html` → 35213, 35221, 35230 only. Read only by `tools/roads.js`. Its comment at 35209 claims "the game reads it so a simulated action writes no letter to anybody's inbox" — the game does not; the letter goes to the discarded clone, so the effect is right and the stated reason is wrong |
| `st.court.size`-style decoration | none found in the deck | — |

---

## What I could not verify

- Whether `court`'s negative sign survives at other difficulties and party
  positions. I measured it at `normal`/`epic`/`ruthless` across six seeds
  (140 plays); the derivative analysis says the sign flips positive only for a
  party in government or one sitting almost exactly at the compass origin with a
  bloc mood under ~45. I did not sweep `easy`/`veryeasy`, where `DIFFS` changes
  the purse and capital dials but not `supportTargets`.
- The exact per-play seat consequence of any card. I read `supportTargets`, which
  is what `updatePartySupport` (11535) feeds; I did not run it through
  `allocateSeats` to a seat count, so "-1.08% of projected share" is a share
  figure, not a seat figure.
- `floor`'s pressure/oppose mismatch (38201 vs 38475) is a code read; it returned
  null 0 times in my 2,160 party-sessions, so I cannot show it firing.
- Whether `st.aiPacts` multi-pact actually occurs in play. The one-way write
  (34459) and key-only read (34609) are conclusive from the source; I did not
  drive a board to a state with two overlapping pacts (13 pact plays in my run).
- `enter`'s staleness: `target` captures `st.ruling` at adoption (34753) and
  `dead` never fires (34755). I did not measure how often the captured ref is no
  longer the government by the time `platform` reads it.
- The player's own `st.machine` trajectory. I drove the engine only; the
  comparison of +.16-per-click against the engine's measured +0.072-per-campaign
  is a code read of 13125 plus my engine measurement, not a played-out
  player-versus-engine curve.
- `checks/run.js` and `tools/roads.js` were not run — I made no edits.
