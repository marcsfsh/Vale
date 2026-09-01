# surfaces — what the player can see and do about the AI

## What it does today

There is exactly **one** panel in three megabytes that reads AI state:
`v16AiPanel` (36122), a seven-column table headed "What the Others Are Doing",
prepended to the Parties page by the `viewParties` wrapper at 36230. It prints,
per party: posture, purse, lifetime initiatives and spend, this session's odds
of moving, the aim with a percentage and the fate of the last aim, the grudge
against the player banded into three phrases, and the authored temperament. Under
it sits a four-line list of what each party did last, with the aim it served and
the rival it read. Everything else the engines do reaches the player as an
undifferentiated log line (`st.log`, capped at 60, top 3 per session), as a
changed number somewhere else, or not at all. There is **no per-party sheet** —
`grep -n "data-party-open\|partySheet\|partyDialog\|showSheet.*PARTY\["` returns
one hit and it is the cabinet appointments sheet (16570); the row in that one
table is the whole window.

**All figures below are mine, measured on the shipped build at 6 seeds x 120
sessions = 720 sessions, `normal`/`epic`/`ruthless`, driving `endTurn` with the
`runQueue` override CLAUDE.md requires.** Probes:
`scratchpad/surfprobe{1,2,3,4,5,6,7}.js`.

---

## FIRST, A CORRECTION TO `docs/S21-BASELINE.md`

**The baseline's headline "Initiatives played 4,941" counts one-ply rehearsals,
not plays.** `v19Score` (35301) calls `v19Outcome` (35264) for **every open
card** at `shrewd`/`ruthless`, and `v19Outcome` calls `card.run` on a clone
(35268). A counter on `card.run` therefore sees one real play plus one rehearsal
per card considered.

Discriminating on `V19_SIMULATING` (set/restored by `v19Try`, 35230) over the
same 720 sessions:

| | |
|---|---|
| `card.run` invocations | 4,941 — **exactly the baseline's number** |
| of which REAL plays (live state) | **1,025** |
| of which rehearsals (clone) | **3,916** |
| real initiatives per session | **1.42** |
| sessions with any initiative | 587 of 720 |

1.42/session is what the model says it should be: `v18TempoOdds` (35402) sets
`budget = live.length / V16_AI_CADENCE` = 5/4 = 1.25, plus S19f's borrowed goes.
The panel's own note — "about 5 initiatives between them every 4 sessions"
(36202) — is **correct**, and the baseline is not.

**The baseline's own probe already knows this.** `scratchpad/base21.js` now
carries the guard and a comment saying *"Counting those as plays inflates the mix
by ~5x"* — but `docs/S21-BASELINE.md` (written 13:23) was taken from
`base21.json` (13:19), the run **before** the guard went in at 13:41.
`base21b.json` (13:42) reports `initiatives: 1025, rehearsals: 3916` and a
per-card table identical to mine, down to the last count. The doc is stale
against its own corrected instrument; it needs re-publishing from `base21b`.

The per-card distribution changes shape completely, because the rehearsal count
is near-uniform (it measures availability, not preference):

| card | REAL plays | baseline's figure | rehearsals |
|---|---|---|---|
| court | **280** (27.3%) | 796 | 516 |
| demand | **164** | 762 | 598 |
| organise | **157** | 594 | 437 |
| order | **80** | 232 | 152 |
| attack | **74** | 559 | 485 |
| floor | **69** | 326 | 257 |
| campaign | **65** | 296 | 231 |
| article | **47** | 230 | 183 |
| bill | **47** | 477 | 430 |
| platform | **24** | 195 | 171 |
| pact | **18** (1.8%) | 474 | 456 |

"No card is starved and none is dominant" is not what the game does. `court` is
**15x** `pact` and **11x** `platform`. Any S21 work that reasons from the
baseline's table is reasoning about a table of what the engine *thought about*.

The `oust`/goals table in the baseline **is** correct — I reproduced it exactly
(build 1003 / carry 883 / ground 856 / enter 680 / charter 403 / office 398 /
oust 0), because it is a per-row count, not a run count.

---

## Findings

### 1. What the eleven cards emit, and where a player can read it — [mixed]

- **What:** the table below is the answer to question 1. "Log/whys" means the
  deck's returned string reaches `st.log` via `v16AiTurn` (35536, first three
  lines only) and is stored in `a.why.line` (35519), which the panel's
  four-line list prints (36191).

| card | plays | what it writes | line it returns | surface that shows it |
|---|---|---|---|---|
| `court` | 280 | `st.blocs[b] += 2.6` (34359) | "spent the season courting X" | log/whys only; the bloc moves on the Nation page **unattributed** |
| `demand` | 164 | `addInbox type:'party_demand'` (34581) | "put X to the government in writing" | **a real paper card**, sender named, with answers — the loudest channel |
| `organise` | 157 | `st.machine[pid] += .030` (34333) | "opened agents and halls…" | log/whys + the "Machine +N%" tag on the party card (15069) |
| `order` | 80 | order record `{…, by:actor}` (38374) | "signed <order>" | log/whys; the order card prints "In force since <year>" (30220) and **never names the signer** — see finding 3 |
| `attack` | 74 | target machine −.036, own +.018, `shiftPartyRel(actor,−3)`, `v16Resent(target, actor, 21)` (34403-34419) | "ran a month of committees and press against Y" | log/whys + both machine tags; **the AI-to-AI grudge it creates has no surface at all** |
| `floor` | 69 | `b.lines[actor]='support'/'oppose'` (38321) | "came out for/against X" | **log/whys only** — see finding 2 |
| `campaign` | 65 | `st.funding[pid]` (16493) | "took the campaign into the country early" | log/whys; purse falls in `partyFundsPanel` (15005); effect only inside "If the Country Voted Today" |
| `article` | 47 | `c.pending.push({…, by:actor})` (38347) | "laid <article> before the country" + `logIt` naming the actor (38356/38360) + `chronicle` | log/whys + a pending-article card (32560) that **does not name who laid it** (0 of 9 measured) |
| `bill` | 47 | `sponsorBill(owner 'opposition')` (34567) | "put <title> on the order paper" | **fully visible**: a bill card naming the sponsor, forecast, and the per-party whip-count fold (23089). 475 of 475 measured |
| `platform` | 24 | `st.push[pid]` (34445) | "rewrote its platform…" | log/whys + "Position e/a" and the "Has moved" tag (15063-15066) |
| `pact` | 18 | `st.aiPacts[pid]={with,since}` (34460); pools 6% of both votes at the count (35548) | "The X and the Y agreed to stand down for each other" | **log/whys only**; no tag, no record. The "Electoral pact" tag on the party card reads `S.pact === p.id` (15073) — the *player's* pact, never an AI one |

- **Why it matters:** two of the eleven (`bill`, `demand`) produce an object the
  player can pick up and act on. Two more (`article`, `order`) produce an object
  with the author stripped off it. The remaining seven exist only as one sentence
  that scrolls off the Dispatches panel.
- **Upgrade:** give every deck card a *persisted, attributed* artefact — the
  minimum is that anything with an `actor` prints the actor.

### 2. A party's declared line on a bill is written and rendered nowhere — [decorative]

- **What:** `v17FloorCore` writes `b.lines[actor] = 'support' | 'oppose'` (38321),
  which `partyBillSupport` reads at ±16/−18 (9051). `grep -n "\.lines" vale.html`
  returns **ten** hits and not one of them is a renderer: 9051 (score), 9824
  (comment), 14482 (a "done" flag on the Press-the-sponsor button), 38177/38224
  (comments), 38201, 38262, 38281, 38308, 38321, 38328. Driven: in 119 sessions
  with a live non-player declared line, the party is named on that bill's card
  **0 times**.
- **Evidence:** `v17FloorCore` 38305-38334; `billCard` 14529-14542 prints
  `b.playerPosition` as "Your line: X" and nothing for anybody else.
  `docs/MAP.md` S20b asserts *"`bill.lines` keeps the declared POSITION, which is
  a fact about a party and **printable on the card**"* — it is not printed.
- **Why it matters:** `floor` is 69 real plays. A party publicly opposing the
  player's bill is the most legible political act in the game and the player sees
  a forecast number move by a few points with no cause named. It also silently
  disarms S20b: the player is invited to "press with other parties" without being
  told which parties have taken a side.
- **Upgrade:** a tagline row of party dots on the bill card — "RSF against · PNL
  for" — from `b.lines`, plus the same in the whip-count fold. One read, one
  place, next to the number it explains.

### 3. `by:actor` on an executive order has no reader — [decorative]

- **What:** `v17OrderCore` stores `{status, issued, dept, target, by:actor}`
  (38374). Enumerating every `rec.*` property read in the file
  (`grep -n "rec\.\w*" -o | sort -u`) gives: addEventListener, dept, due,
  entrenched, expires, f, founding, issued, key, kind, length, map, margin,
  narrowed, open, reaction, repealed, restarted, status, target, title, upheld,
  year — **`by` is not among them**. `grep -n "\.by\b"` returns six hits, all of
  them the article's `by` (31397, 31512) or the primary's `by` (37942-38147).
  680 of 720 sessions had at least one order in force signed by a non-player party.
- **Evidence:** written 38374; order card 30220 prints "In force since <year>";
  `v17OrderCore`'s own log line (38383) says *"Executive order: X, signed without
  reference to either house"* and omits the party.
- **Why it matters:** this is `st.court.size` again. 80 orders a campaign are
  signed by somebody and the book cannot say who. The player cannot build a
  picture of which party governs by decree.
- **Upgrade:** print `PARTY[rec.by].short` on the order card and in the core's
  log line. The field is already there.

### 4. "This session" shows a posture up to a dozen sessions old — [inconsistent]

- **What:** `a.posture` is written at 35453, which is reached only after the tempo
  gate `if (!answering && !passed) return;` at 35451 — i.e. **only in a session
  the party actually acts**. A party acts 1,025/5 = ~205 times in 720 sessions,
  once every 3.5 sessions. The panel prints `V16_POSTURE_SAY[a.posture]` under a
  column headed **"This session"** (36127, 36198). Measured across 4,320
  party-session rows, the printed posture disagrees with a live
  `v16Posture(S, p.id)` on **1,108 rows — 25.6%**. The disagreements include
  `partner->attack` 9 and `moderate->attack` 2: eleven rows where the page says
  "In the ministry with you" / "Moving toward the middle" while the model has the
  party in `attack`.
- **Evidence:** `v16AiTurn` 35451-35453; `v16Ai` default `posture:'hold'` 34064;
  `v16Posture` 34116; panel 36127.
- **Why it matters:** the one column that claims to tell the player a party's
  *mood right now* is a stale snapshot a quarter of the time, and the modal value
  it over-reports is `hold`/"Waiting". Half of the owner's "the AI reads as
  random" is an opponent whose displayed state lags its real one.
- **Upgrade:** call `v16Posture(S, p.id)` in the panel. `a.posture` stays as the
  field the deck filter reads; the page reads the live function. One truth,
  computed where it is printed.

### 5. `oust` is unreachable, so the aim column can never name a feud — [missing]

- **What:** the baseline records `oust` held 0 times. The cause is in
  `v19AdoptGoal`: it builds the candidate goal and drops it if
  `k.done(st,pid,g)` is already true (34955-34957), and `oust.done` is *"the
  target is not in the government"* (34783). Instrumenting `oust.fits` over 194
  real adoptions: **`fits` returned positive on 30 of them and `oust` was adopted
  0 times.** With `fits` = 1.4 — the *highest* weight in `V19_GOALS` — 0 of 30 is
  not chance. Every time a party held a grudge ≥25, the party it held it against
  was already out of government.
- **Evidence:** `V19_GOALS` oust block 34760-34793; `v19AdoptGoal` 34942-34974;
  `v19Rivalry`'s "they are after me" clause (35071) can therefore never fire
  either.
- **Why it matters:** "Bringing down the LP" is the single sentence that would
  make an opponent legible as an antagonist. The prose is written (34790), the
  `worth` table is written, the rival clause that reads it is written, and the
  column has never printed it.
- **Upgrade:** `oust` needs a target rule that can name a party *outside* the
  government (bring them down at the ballot / keep them out), or a `done` test
  that measures damage rather than incumbency.

### 6. Ignoring a party's letter stamps a provocation nothing can read — [inconsistent]

- **What:** `expireInbox` charges an unanswered `party_demand` at
  `v16Resent(st, it.from, playParty(st), 14)` (10224). 14 ≥ `V19_REACT_RISE`
  (10), so `v16Resent` stamps `a.provokedAt[player] = st.turn` (34097-34100).
  But `v19React` — which fires the "did not wait for the season" line and grants
  the borrowed initiative — tests `stamped === st.turn` (35906-35908) and runs
  inside `tickTurn` at **endTurn:13481**, while `expireInbox` runs inside
  `politicsTick` at **endTurn:13488**, and `S.turn += 1` is at **13515**. The
  stamp is therefore always written *after* that session's `v19React` and is one
  behind by the next one.
- **Evidence:** measured — 10 expiry stamps in 60 sessions produced **0**
  reactions; the same build produced **5 reactions from 48 `poach` presses**,
  because a verb pressed during the session stamps before `endTurn` runs. Across
  all 720 sessions of the passive drive, the react line fired **0** times.
- **Why it matters:** "silence from the government IS the answer" (the comment at
  10221) is the design; the answer is unreachable. This is CLAUDE.md's *"Two
  clocks for one fact"* and *"a counter read after it is spent"* in one place.
- **Upgrade:** move `v19React` after `politicsTick`, or have `v19React` accept
  `stamped >= st.turn - 1`. Poison both `expireInbox`'s +14 and the ordering.

### 7. `v19React` never answers an AI-to-AI provocation — [shallow]

- **What:** `v19React` loops parties but only ever reads
  `(a.provokedAt || {})[me]` (35906) — the player. The `attack` card's
  `v16Resent(st, t, pid, V18_ATTACK_RESENT)` (34418-34419) stamps a grudge one
  engine holds against another, and nothing reads that stamp. So S18e's
  engine-vs-engine channel gets the grudge but never the answer-at-once.
- **Evidence:** 35885-35920; 34418.
- **Why it matters:** 74 AI-on-AI attacks a campaign, none of which produces a
  visible riposte the player can watch. The whole point of engines fighting each
  other is that the player reads the feud.
- **Upgrade:** loop `a.provokedAt` rather than keying on `me`; the log line
  already names the party.

### 8. Nothing anywhere shows a grudge between two engines — [missing]

- **What:** the "Toward you" column reads `a.grudge[me]` only (36125, 36168).
  `v16Grudge` is read in seven places (9074, 31398, 34114/34138, 34395,
  34769/34778/34787, 34610, 35092) and rendered in exactly one, banded to the
  player. A party can sit at the 100 clamp against another party for a whole
  campaign with nothing on any screen.
- **Evidence:** `v16AiPanel` 36125/36168; measured band distribution over 4,320
  rows with a *passive* player: none 2,788 / grievance 1,028 / not-forgotten 504.
- **Why it matters:** the only trace of an inter-party feud is the `whys` line's
  "with the X in the way", which comes from `v19Rival`, a *goal* comparison, not
  the ledger. The two are deliberately different facts (35018-35024) and only one
  of them is ever printed.
- **Upgrade:** a second "Toward each other" reading — even a sparse "the RSF have
  not forgiven the PNL" line under the table.

### 9. Twelve friendly verbs write a memory that clamps to nothing — [shallow]

- **What:** `V17_MEMORY` (35945) covers all 34 party-targeting verbs, twelve of
  them with negative weights (`joinCoalition` −20 … `v9jointInquiry` −6). But
  `v16Resent` is `clamp((a.grudge[against]||0) + n, 0, 100)` (34076): a kindness
  can only spend down an existing grudge. Against a party already at 0, funding
  them, giving them newspapers, drawing them favourable seats and putting them in
  the cabinet all write **exactly nothing** — and the panel's lowest band,
  "Nothing on file" (grudge < 12), covers **2,788 of 4,320 measured rows
  (64.5%)**, so an ally and a stranger read identically.
- **Evidence:** 34076; band 36168; `V17_MEMORY` negatives 35975-35986.
- **Why it matters:** the baseline's "no gratitude field exists" stated as a
  *surface* defect: the column cannot distinguish an ally from a stranger.
- **Upgrade:** a signed `regard` that can go positive, banded on the same column
  ("They owe you one" / "Nothing on file" / "A grievance on file").

### 10. An opposition player can delete any pending constitutional article, free — [exploitable]

- **What:** `v11PendingPanel` (32529) emits
  `<button data-artwithdraw="…">Withdraw it</button>` for **every** pending
  article with no chair gate and no `p.by` gate (32575), and
  `v11WithdrawArticle` (31576) checks neither: it filters the article out, takes
  `unity −3`, **no capital**, and logs *"The government withdrew X rather than
  lose it."* `viewState` renders the panel in every chair (32613).
- **Evidence: driven by a real click.** Seed 4242, session 11, player = LP **in
  opposition**, ruling = FP, FP's `artPublishedDivisions` before the country.
  Button present, not disabled, no title. Dispatched click →
  `pending 1 → 0`, `stillThere: false`, `capital: 67.343 → 67.343`, log line
  *"The government withdrew Article of the Published Division rather than lose
  it."*
- **Why it matters:** S17k opened the article instrument to engines (47 real
  plays a campaign) and never narrowed the player's side of it. It is CLAUDE.md's
  *"A PERMISSION opened on the callee…"* rule inverted, and the log line is a
  card that lies about who acted. `no control lies, in any chair` cannot catch it,
  because the control does move something.
- **Upgrade:** gate the button and the handler on one predicate —
  `(p.by || st.ruling) === playParty(st)` — and title the shut case. Same shape as
  `v11CampaignArticle`'s "Make the case", which is arguably legitimate against an
  opponent's article and should be said so on the button.

### 11. The pending-article card never says who laid it — [missing]

- **What:** `c.pending` carries `by:actor` (38348) and it *is* read (31397 for the
  grudge term in the article vote, 31512 for the per-actor cap) — but
  `v11PendingPanel`'s card (32560-32575) prints route, text, verdict, margin,
  cases made, and no author. Measured: 9 sessions with an engine-laid pending
  article, **0** naming the party on the card.
- **Why it matters:** the article the player is being asked to campaign for or
  withdraw is anonymous.
- **Upgrade:** one tag. `<span class="tag">Laid by the X</span>`.

### 12. No deck card ever reaches the newspaper — [missing]

- **What:** `grep -n "addNews(" vale.html` gives ten call sites above line 30000
  and **none is in `V16_AI_DECK` or `v16AiTurn`**. The AI's news kickers over 6
  campaigns: Federal Ballot 39, Order Paper 23, Back Benches 25, **Government
  Programme 19** (that is `aiGovern`, 13579), Assembly Division 15, Primaries 18,
  Shut Out 1, and nothing else party-shaped. `briefingDeck` (14275) and the
  Gazette lead (19343) read `st.news[0]`, so an engine's initiative can never be
  the lead story.
- **Why it matters:** the game has a newspaper and the opponents are never in it.
  The one AI actor that reaches it is the government's *bill*, whose pick is a
  flat `cands[Math.floor(rand()*cands.length)]` (13573) over its `wants` — no
  goal, no forecast, no `v19` scoring at all.
- **Upgrade:** `addNews` on the two or three loudest cards (`attack`, `pact`,
  `article`) with the same tone field the rest of the file uses.

### 13. The coalition partner card shows a stale list of wants — [inconsistent]

- **What:** `pv5CoalitionPanel` renders `d.priorities` as tags (16862).
  `d.priorities` is written once at deal creation from `pv5TopWants(pid,st,2)`
  (16089) and by the "Rewrite programme" button (16754), and is **never refreshed
  by `v17Install`**, which overwrites `d.terms.concessions` from the offer
  actually made (37648). Measured: over 976 partner-sessions the two lists
  disagree on **342 (35%)**. `v17MyDealCard` (16838) shows `terms.concessions`
  for the player's own seat — so the same page renders two different answers to
  "what did we promise them".
- **Note:** the *red line* does **not** have this defect — `pv5EnsureState` mirrors
  `d.terms.redLines[0]` into `d.redLine` on every render (16112) and I measured
  **0** mismatches in 976 partner-sessions.
- **Upgrade:** the partner card reads `terms.concessions` with each one's
  kept/broken/outstanding state, exactly as `v17MyDealCard` already does.

### 14. "A confidence threat is plausible" fires 328 times and happens twice — [inconsistent]

- **What:** `strategicRisksPanel` raises a **high** risk card for any partner at
  `partyRel < 38` saying *"A confidence threat is plausible"* (14301). The actual
  bar in `politicsTick` is `st.partyRel[partner] < 27` **and** `leads(st)` **and**
  `st.inbox.length < 4` **and** `(st.turn + st.inboxSeq) % 2 === 0` (10261-10274) —
  while the same tick pulls a partner's relationship toward a base of **62** at
  6% a session (10240-10242). Measured: 328 partner-sessions below 38, 74 below
  27, and **2 `confidence_threat` papers in 720 sessions**.
- **Why it matters:** the game's own risk dashboard advertises a mechanism the
  model actively pulls away from. It is the surfaces half of the baseline's "it is
  the coalition that is silent."
- **Upgrade:** say the real bar and the real distance ("Trust 34; they threaten
  below 27, and it is rising 1.7 a session"), or make the mechanism match the card.

### 15. `V19_GOALS` has no `short` field, and the panel reads one — [decorative]

- **What:** the retired-aim line does
  `var k = v19GoalKind(lg.kind); var was = k && k.short ? k.short : (…seven-name
  literal list…)` (36155-36159). No entry in `V19_GOALS` (34677-34875) defines
  `short` — `awk 'NR>=34677 && NR<=34875 && /short/'` returns only
  `PARTY[g.ref].short` inside `oust.say`. The read is dead and the hand-kept list
  is what always runs.
- **Why it matters:** harmless today only because the fallback happens to name all
  seven kinds. It is `v7DefaultCollapsed`'s stale-list shape sitting in the one
  panel this programme is about: an eighth goal renders as "an article".
- **Upgrade:** delete the `k.short` read and derive the phrase from the kind, or
  add `short` to all seven and delete the list. Not both.

### 16. "Acting on instinct" means two different things — [inconsistent]

- **What:** the aim cell prints "Acting on instinct" whenever `v19GoalSay` returns
  null (36142). That is the honest answer at AI level `instinct`, where
  `v19Goal` returns null by design (34902). It is **also** what a party with no
  goal *yet* shows at `ruthless` — `a.goal` is only ever set inside `v19Goal`,
  which `v16AiTurn` calls only when the party acts (35467). Measured at
  `ruthless`: **97 of 4,320 rows (2.2%)** printed it.
- **Upgrade:** two strings. "Acting on instinct" for the level; "Has not moved
  yet" for the party.

### 17. The panel's four-line "what they did" list is undated — [shallow]

- **What:** `a.why` carries `turn` (35520) and the list sorts by it and never
  prints it (36180-36194). It shows each party's *most recent* action whenever it
  happened, and slices to 4 of up to 5 parties. Measured over 2,858 rendered rows:
  mean age **2.36 sessions**, max 10, 102 rows older than 5.
- **Why it matters:** small in size, but it is the only narrative surface the AI
  has, and a line from ten sessions ago sits indistinguishable beside one from
  this morning. The log lines it duplicates are dated; these are not.
- **Also:** `st.aiLast` (written 35537) is read only as the fallback at 36201,
  which stops being reachable once any party has ever acted — measured ~4 `whys`
  rows from the first sessions on. It is a near-dead field.
- **Upgrade:** append `dateLabel(w.turn)` and drop the fallback.

### 18. The three-line log cap is not the problem — [works]

- **What:** `v16AiTurn` logs only `lines.slice(0, 3)` (35536) with up to five
  parties able to act. Measured: **23 lines dropped out of 1,025** across 720
  sessions; only 20 sessions ever had more than three initiatives. Reported here
  so S21 does not spend a slice on it.

### 19. What DOES work, so it is not rebuilt — [works]

- The **coalition formation dialog** (`v6CoalitionDialog` 19471) is the best
  AI-transparency surface in the game: every round, every party's willingness,
  its *reservation price* and what the offer is *worth to it*
  (`v6CoalitionCandidates` 19415-19426, rendered 19521-19527), plus the player's
  own party's answer quoted back at them (19502). `v17FormationPanel` (37761)
  keeps a fold of it afterwards; present in 714 of 720 sessions.
- The **deal ledger** (`v17LedgerCard` 35835) prints kept/broken/altered with
  dates and the walkout floor, in every chair, including for a government that is
  not the player's (16866).
- The **whip count fold** (`v8WhipCount` 23089) prints each party's expected ayes
  through `billDivision` — one function, one truth.
- The **executive race panel** (`v17RacePanel` 38106) names every party's
  candidate, how it was chosen, and its poll; `v17AiRaceSpend`'s money moves that
  poll through `execPushOn` (38008), so the spend is at least *felt*.
- The **party funds panel** (15005) shows every party's purse and income.
- `v17GovDigest` (19361) tells an opposition player what the government decided
  in their absence.
- The AI panel's cadence sentence, its odds column and its temperament line are
  all covered by `tools/roads.js` (8730, 9060, 9306, 10269) and all measured
  honest.

---

## Question 2 — is the AIM rendered? the posture, grudges, rival, temperament?

| thing | rendered? | where, and under what condition |
|---|---|---|
| **aim** (`v19GoalSay`) | yes | `v16AiPanel` 36141, with `v19GoalProgress` as a percentage. Null → "Acting on instinct". Not rendered anywhere else in the file. Reads `a.goal` directly, so it is **never re-tested for done/dead** by the panel — measured 152 of 4,223 rows (3.6%) printed an aim `v19Goal` would have retired |
| **last aim and why it ended** | yes | 36153-36164, for 6 sessions after `lg.until`; reads `lastGoal.why` ∈ done/gone/given up/stalled |
| **posture** | yes, stale | 36127. Header "This session". 25.6% disagreement with live — finding 4 |
| **grudge vs the player** | banded | 36168, three phrases at ≥35 / ≥12 / else |
| **grudge vs other parties** | **never** | finding 8 |
| **rival** (`v19Rival`) | partial | only as "with the X in the way" appended to that party's last-action line (36190-36194), and only when `w.foe` is non-null. There is no column for it, and `foeAt` (the magnitude) is never shown |
| **temperament** (`v19TemperSay`) | yes | 36173, gated on `v19Thinks` so it is absent at `instinct`. It is a pure function of `PARTY[pid].temper` (746) — a constant sentence for the life of the campaign |
| **tempo / odds** | yes, live | 36136, `v18TempoOdds` read straight |
| **purse, lifetime acts, lifetime spend** | yes | 36128-36129 |
| **`a.owed` (borrowed initiative)** | **no** | written 35489/35515, read only by the gate |
| **`a.react`** | **no** | the log line at 35918 is the whole surface, and it never fired in a passive drive |
| **`st.aiPacts`** | log line only | finding 1 |
| **`b.lines`** | **no** | finding 2 |
| **`execPush`** | indirectly | moves the poll number in `v17RacePanel`; never labelled |

---

## Question 3 — can a player form a theory of an opponent across a campaign?

**Partly, and only from one table.** After 20 sessions at the default AI level
(`purposeful`) an attentive player who visits the Parties page every session can
know, about party X:

*Reliably* — its current aim in words and a percentage, and the fate of its last
aim within 6 sessions of it ending (Parties page, one table). Its purse and
income (Party Funds panel, same page). Its machine, press, boundaries, position,
drift, cordon and coalition status (party card, same page). Its odds of moving
this session. Its authored temperament (a fixed sentence). Whether it holds a
grievance against *the player*, in three bands. Whether it laid a bill (Houses
page, with sponsor, forecast and a per-party whip count). What it wrote to the
government (Political Papers). What it was offered at the last formation and what
it said (formation fold, Government page). What the government has kept and
broken with it (deal ledger, same page).

*In one sentence that scrolls away* — that it courted a bloc, built its machine,
rewrote its platform, ran a month of committees against somebody, made an
electoral pact, signed an order, or took a side on a bill. Those seven cards are
**~700 of the 1,025 initiatives a campaign**, and each leaves one undated line in
a 60-entry log plus, at most, one slot in a four-line list that shows only the
party's *latest* action.

*Never* — that two engines are feuding; that a pact between two of them is
standing at the next count; which party signed any executive order; which party
laid the amendment before the country; which parties have declared against a bill
on the floor; that any party intends to bring another down (`oust` is
unreachable); or that a party the player has funded and given the cabinet to
feels any differently from one they have never met.

So the honest answer to *"after 20 sessions, what does a player know about party
X's intentions?"* is: **one sentence of intention, refreshed when X acts, on one
screen** — plus a rich but purely structural picture of X's position and
resources. There is no history of X's aims (only the last one, for six sessions),
no record of what X has done to whom, and no second screen that would let a
player cross-check the sentence against events. The campaign-length narrative
exists in `st.log` and `st.news`, and the deck writes to the first only, three
lines at a time, undated in the panel and unattributed in the artefacts.

---

## Question 4 — every player verb that targets another party

All from `partyActions` (12793, `!mine` branch) and its v9 wrapper (23883).
`cap` = political capital, `£` = money. "Remembered" is `V17_MEMORY[id].self`
(35945); a verb can trigger `v19React`'s visible answer only if
`self >= V19_REACT_RISE` (10) **and** the party has not answered within
`V19_REACT_COOL` = 8 sessions **and** `v19Thinks`.

### Hostile / coercive

| id | cap, £ | what it does | remembered | can trigger a visible answer |
|---|---|---|---|---|
| `ban` 13106 | 16 | dissolves the party, unrest +16, liberties −8, seats redistributed | 46 (+26 to everyone else) | yes |
| `prosecute` 13040 | 11 | if `courtGap<.5`: machine −.30, seats ×.88; else backfires | 34 (+12) | yes |
| `split` 13082 | 13 | machine −.30, 30% of seats to the government | 30 (+8) | yes |
| `blackmail` 13000 | 9 | leader loyalty +30, `coopted`, machine −.06 | 30 (+10) | yes |
| `splinter` 12986 | 12, 10 | 18% of seats to the nearest party, machine −.22 | 28 (+6) | yes |
| `discredit` 13078 | 8 | machine −.17 | 26 (+5) | yes |
| `cutFunding` 13055 | 8 | machine −.14, press −.06 | 24 (+6) | yes |
| `cordon` 12973 | 10 | `S.cordon[pid]`, machine −.08, their blocs −5 | 22 (+8) | yes |
| `expelPartner` 12963 | 8 | out of the cabinet, their machine +.05, your unity +9 | 22 (+4) | yes |
| `absorb` 13093 | 15 | takes all their seats and 60% of their support | 20 (+4) | yes |
| `backChallenger` 13011 | 7, 6 | 60%: new leader, machine −.10; else machine +.05 | 20 (+3) | yes |
| `coopt` 13074 | 9, 6 | `coopted`, machine −.05 | 18 (+3) | yes |
| `defect` 12819 | 8, 9 | 3.5% of the chamber crosses **to** them (a boost verb by `kind`, a memory-negative act by the table) | 18 (+2) | yes |
| `byElection` 13062 | 6, 5 | ±0.6% of seats on a swing test | 16 | yes |
| `pushAway` 12847 | 8 | drives their position to the fringe via `st.push` | 16 | yes |
| `audit` 12925 | 6, 4 | machine −.12, corruption +3 | 14 (+2) | yes |
| `poach` 12912 | 8 | their blocs +6 to you, their machine −.09 | 12 | yes — **measured 5 answers in 48 presses** |
| `v9leakPolling` 23901 | 6, 4 | machine −.09, rel −6 | 12 | yes |
| `infiltrate` 12905 | 7, 6 | `coopted`, pushes their position toward the government | 10 | yes (exactly at the bar) |
| `v9poachOrganiser` 23905 | 7, 6 | their machine −.07, yours +.06, rel −5 | **8** | **no — below the bar** |
| `pushLeft` 12835 | 8, 7 | pulls their position toward the government | **6** | **no** |
| `debate` 12932 | 5 | coin-flip machine swing ±.07 | **2** | **no** |

### Friendly / structural

| id | cap, £ | what it does | remembered | visible answer |
|---|---|---|---|---|
| `joinCoalition` 12953 | 12 | into the cabinet, your unity −8 | −20 | **none** — see finding 9 |
| `liftCordon` 12980 | 5 | clears the cordon, their blocs +6 | −18 | none |
| `invite` 12862 | 20 | hands them the government; you become junior or opposition; raises a sheet | −16 | none (the sheet is the feedback) |
| `drawseats` 12805 | 9 | `gerry` +.09 permanently | −16 | none |
| `fund` 12797 | 6, 10 | machine +.16, corruption +2 | −14 | none |
| `tradeMinistry` 13027 | 6 | hands them a great office, capital +10 | −14 | none |
| `givepress` 12801 | 8, 13 | press +.10 | −12 | none |
| `champion` 12809 | 7 | their blocs +7×aff, machine +.06 | −12 | none |
| `confidence` 12948 | 9, 8 | `S.confidence = pid`, unity −4 | −12 | none |
| `v9concede` 23887 | 5 | rel +12, a 3-session `v9.opinion` mark on their top want | −12 | logs a line naming the statute |
| `pact` 12858 | 10 | `S.pact = pid` | −10 | the "Electoral pact" tag |
| `v9jointInquiry` 23897 | 6, 3 | rel +8, professions +4, unrest −2 | −6 | none |

**Verdict on "does the target visibly respond":** for the 19 hostile verbs at or
above the bar there are four response channels and three of them are unreliable
as *surfaces* — the grudge band (works), the odds column (works), the posture
column (25.6% stale, finding 4), and the "did not wait" log line (works only for
verbs pressed in-session, never for an ignored letter, finding 6, and cooled to
one answer per 8 sessions). For the **twelve friendly verbs there is no response
channel at all** once the party's grudge is at 0; the panel's lowest band covers
64.5% of measured rows, so most of them land on a party that reads the same
before and after.
And `V17_MEMORY` is a **covered surface**: it names all 34 targeting verbs, and
`roads.js` fails if a 35th arrives without a weight. That guard is worth keeping.

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `ai[pid].posture` | `v16AiTurn` 35453 (only in an acting session) | `v16AiPanel` 36127 only. `grep -n "\.posture"` → 2 hits |
| `ai[pid].goal` | `v19AdoptGoal` 34972, cleared 34935 | `v19Goal` 34905, `v19GoalSay` 34977, `v19GoalProgress` 34984, `v19GoalSeen` 35011, `v20Aim` 34278 |
| `ai[pid].lastGoal` | `v19Goal` 34932 | `v16AiPanel` 36153 only |
| `ai[pid].why` {card, goal, aim, turn, line, foe} | `v16AiTurn` 35519 | `v16AiPanel` 36178. `why.turn` sorts (36180) and is **never printed** |
| `ai[pid].grudge[x]` | `v16Resent` 34076 | 9074, 31398, 34114, 34138, 34395, 34769/34778/34787, 34610, 35092, 35387, **36125 (the only render, player only)** |
| `ai[pid].provokedAt[x]` | `v16Resent` 34099 | `v19React` 35906 — **player key only**, and unreadable when the stamp comes from `expireInbox` (finding 6) |
| `ai[pid].react` | `v19React` 35910 | `v16AiTurn` 35450 only. Never rendered |
| `ai[pid].owed` | `v16AiTurn` 35515 | `v16AiTurn` 35489 only. Never rendered |
| `ai[pid].acts` / `.spent` | 35493 / `v16AiPay` 34059 | `v16AiPanel` 36129 |
| `ai[pid].lastSeats` | `v16AiTurn` 35532 | `v18Tempo` 35394, `v16Posture` 34119 |
| `st.aiLast` | `v16AiTurn` 35537 | `v16AiPanel` 36201, a fallback unreachable once any `why` exists |
| `st.aiPacts` | `pact` card 34460 | `v16PactPartner` 34609, `ballot` 35545, expiry 12007. **NO RENDERER** — `grep -n "aiPacts"` → 11 hits, none in a view |
| `bill.lines[pid]` | `v17FloorCore` 38321/38328 | `partyBillSupport` 9051, `v20PressWhy` 38262, `v20PressCore` 38281, `v17FloorWhy` 38201, button state 14482. **NO RENDERER** — `grep -n "\.lines"` → 10 hits, 0 render |
| order record `.by` | `v17OrderCore` 38374 | **NONE FOUND** — `grep -n "\.by\b"` → 6 hits, all articles/primaries; `grep -n "rec\.\w*" -o \| sort -u` has no `rec.by` |
| pending article `.by` | `v17ArticleCore` 38348 | `v11ArtVote` 31397, `v11CanPropose` 31512. **Not rendered** on the card (32560) |
| `st.execPush[office:pid]` | `v17AiRaceSpend` 38062, `execPush` action 12536 | `execPushOn` 7268 → `execContest` 11881, `v17RacePolls` 38008. Visible only as a moved poll % |
| `coalitionDeals[pid].priorities` | 16089 creation, 16754 rewrite | rendered 16862, scored 16311, recommended 20878. **Never refreshed by `v17Install`** (37648) — 35% divergence measured |
| `coalitionDeals[pid].redLine` | 16089, mirrored from `terms.redLines[0]` at 16112 every render | `v16RedLineTick` 35753, `v17Walkout` 35771, rendered 16862. **0 mismatches measured** |
| `coalitionDeals[pid].ledger` | `v17Ledger` 35600 | `v17Broken`/`v17Kept` 35606/35610, `v17WalkFloor` 35616, `v17LedgerCard` 35840 |
| `st.push[pid]` | `platform` card 34445, `pushLeft`/`pushAway`/`infiltrate`/`poach` | the position model; visible as "Position e/a" and "Has moved" (15063-15066) |
| `st.funding[pid]` | `partySpend` 16493 | `supportTargets` 11516, decayed 13484. **Never rendered**; visible only inside the projection |
| `st.machine[pid]` | many | rendered as a tag (15069) when non-zero |
| `st.news` | `addNews` 8744 | `briefingDeck` 14275, Gazette 19343/19386. **No deck card writes it** |
| `V19_GOALS[*].short` | **nothing** | read at `v16AiPanel` 36156 — a dead read over a hand-kept fallback list |

---

## What I could not verify

- **~~Whether the baseline's other figures share the rehearsal miscount.~~
  Resolved: they do not.** Diffing `base21.json` (pre-fix) against
  `base21b.json` (post-fix) key by key, `postures`, `goalsHeld`, `goalRetired`,
  `coalition`, `partyRel`, `exec`, `grudge` and `engineBillsSeen` are all
  **byte-identical**; only `initiatives`, `nullRuns` and `cardPlays` moved,
  because those are the only counters hung on `card.run`. So exactly two
  paragraphs of `docs/S21-BASELINE.md` need re-publishing — the initiative total
  and the plays-by-card table — and the rest of it stands.
- **Whether the `attack` card's `shiftPartyRel(st, pid, -3)` (34405) is
  intended.** `st.partyRel` is the *player's* relationship with a party, so an
  engine attacking a third party lowers its own standing with the human. I read
  the line; I found no comment stating the intent either way.
- **Phone/tablet rendering of the seven-column AI table.** It is inside
  `<div class="tablewrap">` (36198), which should scroll, but I did not run
  `tools/tiers.js` or `tools/contrast.js` against it.
- **Whether an article laid by an engine that is NOT the head of government can
  also be withdrawn.** The click I drove withdrew the *governing* party's
  article from the opposition bench. The code path (`v11WithdrawArticle` 31576)
  reads no owner at all, so it must apply equally, but I did not drive that exact
  case.
- **How often `v19React` fires in ordinary play**, since the rate depends
  entirely on how many hostile verbs a human presses per session; my 5-in-48 is
  one verb (`poach`) on four seeds and is a lower bound shaped by the 8-session
  cooldown, not a rate.
- **`docs/MAP.md` S20b's claim that `bill.lines` is "printable on the card"** — I
  can show it is not printed in this build; I cannot tell whether it was ever
  printed and removed, or only ever intended.
