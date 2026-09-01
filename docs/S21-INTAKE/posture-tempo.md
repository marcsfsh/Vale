# posture-tempo — WHEN a party acts, and in what mood

## What it does today

Every session `tickTurn`'s wrapper calls `v16AiTurn` (vale.html:35417, installed
at 35922-35927). For each live party it draws one die, compares it with
`v18TempoOdds` (35442) — a weight normalised across the board so the expected
number of parties acting stays at `PARTIES.length / V16_AI_CADENCE` — and, if
the party passes or is answering a fresh provocation, computes `v16Posture`
(35452), filters the 11-card deck by `c.post` and the per-card 4-session
cooldown (35454-35458), and hands what is left to `v19Choose`. Posture is one of
eight strings decided by a 7-line if-chain at 34116-34143 on nothing but the
board: who rules, who sits in the ministry, one grudge bar, one seat trend, one
seat share, one purse bar. It is read in four live places besides the deck
filter: the burn rate a party spends its income at (16371), the direction a
`platform` card pushes (34432), a coalition reservation-price bump (37485), and
one column of the Parties page (36127).

**Measurements below are my own**, from a Chromium driver with the `runQueue`
override CLAUDE.md requires, 4 seeds × 60 sessions, `epic`/`normal`/`ruthless`,
player idle: **1,488 party-sessions** (`scratchpad/posture.js`, `posture2.js`,
`posture3.js`, `posture4.js`). Where they differ from `docs/S21-BASELINE.md` it
is because my player never presses a hostile verb; I say so each time.

---

## 1. The posture set and its evaluation order

`v16Posture(st, pid)` at 34116-34143, in order. `co = st.coalition || [st.ruling]`,
`share = seats / CFG.seats`, `trend = seats - ai.lastSeats`.

| # | posture | predicate (34121-34142) | measured share of party-sessions |
|---|---|---|---|
| 1 | `govern` | `pid === st.ruling` | 15.3% |
| 2 | `restive` | `co.indexOf(pid) >= 0 && v18Restive(...)` → grudge vs `st.ruling` >= `V18_RESTIVE` (55) | **0.0%** |
| 3 | `partner` | `co.indexOf(pid) >= 0` | 21.9% |
| 4 | `attack` | `v16Grudge(pid, me) >= 35 \|\| v16Grudge(pid, st.ruling) >= 35` | 0.9% (baseline 4.9% with a hostile player) |
| 5 | `moderate` | `trend < 0 && share < .18` | 8.9% |
| 6 | `consolidate` | `share >= .22` | **0.3%** (4 of 1,488) |
| 7 | `organise` | `partyPurse(st, pid) >= 120` | 7.9% |
| 8 | `hold` | fallthrough | **44.8%** |

(Baseline's own table sums to exactly 4,320 = 720 × 6 live parties, so
`consolidate` and `restive` were **0 of 4,320** there too. The table does not say
so; the arithmetic does.)

**Why `hold` is two fifths.** Branches 1-3 are structural facts, not moods, and
they take 37.2% between them: coalition sizes measured 2 (138 sessions) and 3
(100), so of six live parties roughly 2.3 are in government on any session. That
leaves the opposition bench, ~62%, to be divided by four predicates, and every
one of them has a bar above what the game routinely produces:

- `attack` needs a grudge at 35. Measured grudge over 1,440 party-sessions:
  **median 8, p90 32, max 70**. The bar sits above the ninetieth percentile.
  With an idle player it fires 0.9%; the baseline's hostile player triples it to
  4.9%. It is very nearly a player-authored posture.
- `moderate` needs `trend < 0`, and `trend` reads `ai.lastSeats`, which is
  rewritten for every party at the **end of every** `v16AiTurn` (35532). So
  `trend` is the change since **last session**, and it is nonzero only in the one
  session following a seat move. Measured: **113 of 113 `moderate` party-sessions
  had seats fall in that same session** — the predicate is a one-session flash
  after a ballot, not a mood. It reads 8.9% only because this build holds an
  election roughly every other session (45.9% of party-sessions saw seats move).
- `consolidate` needs 22% of the chamber while **out of** the government. The
  government takes everyone that big: measured outsider share is **median .092,
  p90 .149, max .259**, against an in-government median of **.243**. Only 4 of
  934 outsider samples cleared .22. The bar is above the p90 of the population it
  gates on — CLAUDE.md's "a threshold picked by eye" defect, and this one is
  above the ceiling by ~50%.
- `organise` needs a purse of 120. Measured 5.5% of party-sessions are that rich;
  purse under `hold` runs **median 86, p90 112**, i.e. the board hovers just
  under the line.

So `hold` is not a mood at all. It is "on the opposition bench, no grievance at
the bar, no ballot last session, not big, not rich" — the residue of five
thresholds none of which the ordinary board clears.

---

## Findings

### `restive` has never once occurred, and the harness arm that covers it hand-writes the grudge — [decorative]
- **What:** `restive` has its own constant (`V18_RESTIVE = 55`), its own
  predicate shared with the `attack` card's `can` (34370), a 6-card entry in the
  deck, its own burn rate (38541), and its own sentence in `V16_POSTURE_SAY`
  (36225). It fired **0 times in 1,488 party-sessions**, and 0 of 4,320 in the
  baseline. The reason is a race: the only channel that raises a *sitting*
  partner's grudge against the head of government is a coalition breach
  (`v17DealScan` → `v16Resent(st, pid, actor || st.ruling, hit.cost + 1)` at
  35723), worth 9 or 12 a breach — while the same breach costs 8 or 11 of
  cohesion, and `v17WalkFloor` (35615) is `12 + min(3, broken) * 6`, ceiling 30,
  against a satisfaction that starts near 55. **The partner walks out before the
  grudge reaches 55.** Driven directly: I reset the `c.broken` latch by hand so
  the same promise could be broken repeatedly (generous to the mechanism), and
  the partner left at the **second** breach with a grudge of 67 — but by then
  `co.indexOf(pid) < 0`, so `v18Restive` returns false at 34113 and the posture
  is `attack`, not `restive`.
- **Evidence:** `v18Restive` 34111-34115; `V18_RESTIVE` 34110; `v17WalkFloor`
  35615; `V17_BREACH` 35592; breach resent 35723; walkout resent 35778 (fires
  *after* `st.coalition` is filtered at 35774, so it can never make anyone
  restive either); partner-grudge-vs-ruling measured over **326 samples: median
  0, p90 0, max 17**.
- **The arm is not measuring the game:** `tools/roads.js:8615` tops the grudge up
  with `v16Resent(S, pid, S.ruling, 100)` **every session** and sets the purse to
  400/900, then asserts `posture === 'restive'` at 8747. It proves the predicate
  and says nothing about whether the republic can reach it. This is the S17q
  `st.unrest = 80` defect exactly.
- **Why it matters:** the whole point of S18e was "the party that stays in the
  room and works against you inside it". That party does not exist. A player who
  abuses a coalition partner gets a walkout, never an enemy inside the ministry.
- **Upgrade:** either lower `V18_RESTIVE` under the grudge a partner can actually
  hold before walking (measured max 17 — so ~12-15, or a different channel), or
  make cohesion loss and grudge gain diverge: a breach the partner *cannot afford
  to leave over* (small coalition, no alternative majority) should convert into
  grudge rather than into satisfaction loss. And the arm must assert reachability
  from unassisted play, not from a hand-set 100.

### `consolidate` is starved by a bar above the population it gates on — [shallow]
- **What:** 4 of 1,488. `share >= .22` for a party that is neither ruling nor in
  the coalition. Forced — handing an outsider 25.1% of the chamber — the
  predicate returns `consolidate` correctly, so this is starvation, not dead
  code. But the formation rotation admits every party that big.
- **Evidence:** `v16Posture` 34140; outsider share max **.259**, p90 **.149**
  over 934 samples; forced probe returned `{"pid":"fp","share":0.251,"posture":"consolidate"}`.
- **Why it matters:** `consolidate` owns the **largest static card set in the
  deck (9 of 11)** and is the only posture that opens `order` to a party outside
  government. Nine cards are authored behind a door that opens 0.3% of the time.
- **Upgrade:** ask the question relative to the board rather than absolutely —
  "largest party outside the government", or `share >= .15` (above the outsider
  p90, below the max) — and measure the distribution again afterward, in the
  assertion's own words.

### `attack` and `moderate` open near-identical decks, and the chooser cannot tell them apart — [inconsistent]
- **What:** the posture-to-card matrix, built from `c.post` at 34329-34587:

| posture | cards (static) | n | mean open (measured) |
|---|---|---|---|
| `govern` | campaign, article, order | 3 | 1.50 |
| `partner` | organise, court, order, floor, demand | 5 | 1.79 |
| `restive` | court, attack, platform, floor, bill, demand | 6 | — (never held) |
| `attack` | campaign, attack, platform, pact, article, floor, bill, demand | 8 | 5.19 |
| `moderate` | campaign, court, attack, platform, pact, article, floor, bill | 8 | 5.14 |
| `consolidate` | organise, campaign, court, attack, platform, article, order, floor, bill | 9 | — (4 samples) |
| `organise` | organise, court, article, floor, bill | 5 | 3.08 |
| `hold` | organise, court, attack, pact, floor, bill, demand | 7 | 4.88 |

  Jaccard over the static sets: **attack/moderate 0.78** (7 shared of 9 union —
  they differ by `demand` vs `court` and nothing else), consolidate/moderate 0.70,
  hold/restive 0.63, attack/restive and moderate/restive 0.56, hold/attack and
  hold/moderate 0.50. Only `govern`/`partner` are genuinely distinct (0.14).
  Measured availability makes it worse: the `attack` **card** is open on 81% of
  `attack` party-sessions and **84% of `moderate` ones**. The posture named for
  coming after the government does not make attacking any more available than the
  posture named for moving to the middle.
- **Evidence:** `V16_AI_DECK` 34328-34588; `open` filter 35454-35458; measured
  open-set profiles in `scratchpad/posture.js` output.
- **And nothing downstream separates them:** `v19Score` (35280-35322) reads goal
  worth, recency, purse, `v19Outcome`, temperament and rivalry — and **never
  reads posture**. `v19Choose` (35327) does not take it. So once two postures
  open the same set, the parties behave identically.
- **Why it matters:** a player told on the Parties page that one party is
  "Coming after the government" and another is "Moving toward the middle" is
  being told about a distinction the model does not make.
- **Upgrade:** either make `post:` narrow and mutually informative (a mood should
  *remove* options — `moderate` should not open `attack`), or move the mood into
  `v19Score` as a per-card weight vector like `V19_TEMPER_AXIS`, so posture
  shades preference rather than gating availability. The gating form is also what
  costs the goals layer: S20f (docs/MAP.md:1420) measured **the posture filter
  deleting a party's aim's best card on 27% of goal-sessions**.

### The tempo terms are five binary thresholds, and half the board carries none of them — [shallow]
- **What:** `v18Tempo` (35381-35396) multiplies from 1:

| term | value | predicate | fired (of 1,440 party-sessions) | player can cause? |
|---|---|---|---|---|
| `rich` | ×1.35 | `partyPurse >= 120` | 5.5% | yes — `fund`, `cutFunding`, `audit`, `poach` |
| `broke` | ×0.35 | `purse < V16_AI_COST.demand` (16) | 2.8% | yes — same verbs |
| `grudge` | ×1.5 | max grudge over **anyone** >= 35 | 8.9% | yes — the `V17_MEMORY` verbs (35945) |
| `govern` | ×1.3 | `pid === st.ruling` | 15.6% | **only at a formation** — flag |
| `losing` | ×1.3 | `seats < ai.lastSeats` | 16.7% | yes, but the window is **one session** — flag |
| clamp | `.25 .. 4` | | never bound above; `min` reachable via `broke` alone | |

  Measured weight distribution: **min 0.35, p10 1.00, median 1.00, p90 1.50, max
  2.63, mean 1.147.** The median party-session has **no term firing at all**.
  Odds: min .069, p10 .200, **median .238**, p90 .310, max .430, mean exactly
  .250; `odds == 1` never occurred.
- **Evidence:** `V18_TEMPO` 35367-35380; `v18Tempo` 35381-35396; `v18TempoOdds`
  35402-35412.
- **Why it matters:** the spread the owner bought with S18e is real but narrow —
  a party moves every 4.2 sessions instead of every 4, or every 2.3 at the very
  top. And no term is graded: a grudge of 35 and a grudge of 100 weigh the same,
  a purse of 120 and 400 weigh the same.
- **Upgrade:** make the two that the player actually drives continuous —
  `1 + k * min(1, grudge/100)`, `1 + k * min(1, (purse-120)/200)` — and add at
  least one term the player can turn *this session*: a bill of theirs on the
  order paper, a demand of theirs refused, an office they hold at stake.

### Provoking the whole board changes nothing — the normalisation divides the grudge term straight back out — [exploitable]
- **What:** `v18TempoOdds` returns `v18Tempo(pid) * budget / sum` over all live
  parties. A multiplier applied to *everybody* cancels. Driven on seed 4242 at
  turn 6:

```
budget 1.5   live rsf,sd,fp,cup,tvc,pnl
base       rsf .2708  sd .2083  fp .2708  cup .2083  tvc .2708  pnl .2708   sum 1.5
one angry  rsf .3726  sd .1911  fp .2484  cup .1911  tvc .2484  pnl .2484   sum 1.5
all angry  rsf .2708  sd .2083  fp .2708  cup .2083  tvc .2708  pnl .2708   sum 1.5
```
- **Evidence:** `v18TempoOdds` 35402-35412; run in `scratchpad/posture4.js`.
- **Why it matters:** this is precisely the defect the `V18_TEMPO` comment
  identifies and deletes a term for — "a ballot is a fact about the STATE, so
  every live party got the same multiplier and `v18TempoOdds` divided it straight
  back out" (35368-35373). The rule was applied to the ballot term and not to the
  shipped ones. A player who makes six enemies gets no more pressure than a
  player who makes one; worse, provoking *one* party measurably **quietens the
  other five** (.2083 → .1911, .2708 → .2484), because the total is held. The
  strictly dominant play is to concentrate hostility on a single party, which is
  the opposite of what a game about a hostile chamber wants.
- **Upgrade:** let the board's *level* move the budget, not only its shape —
  `budget = live.length / V16_AI_CADENCE * f(mean weight)` with `f` bounded (say
  0.9..1.4), so a republic in crisis is busier and a quiet one is quieter, while
  the owner's dial still sets the resting rate. Assert the resting rate and the
  ceiling separately.

### `moderate` and `losing` both read a seat delta that only exists for one session — [shallow]
- **What:** `ai.lastSeats` is written for every party at the close of every
  `v16AiTurn` (35532), so both `trend` (34119) and the `losing` multiplier
  (35394) compare against **last session**, and `st.seats` moves only at a
  ballot (11918, 17371, 36447) or through a handful of rare events (12830,
  13046-13165, 19158-19159). The comment at 35390-35393 states this is
  intentional ("the move since the last session ... which is what a party
  notices"); the consequence is that a party which lost a third of its seats
  three sessions ago is, to both mechanisms, indistinguishable from one that has
  never lost a seat.
- **Evidence:** 34119, 35394, 35532; measured `moderate` 113 of 113 co-incident
  with a same-session seat fall.
- **Why it matters:** "a party that has been beaten moderates" is the one posture
  with a story in it, and it lasts exactly one session. A player watching for a
  beaten party to soften will miss it.
- **Upgrade:** keep a `seatsAtLastBallot` beside `lastSeats` and read the *ballot*
  delta for `moderate` (a defeat is a fact about a term, not about a session),
  keeping `lastSeats` for the tempo nudge.

### The `broke` bar is above the cheapest card, and the comment says otherwise — [inconsistent]
- **What:** `V18_TEMPO.broke` comments itself as "under the cheapest card in the
  deck, so mostly refused anyway" (35375) and is keyed to `V16_AI_COST.demand`
  = 16. Enumerated from the deck: `floor` **12**, demand 16, platform 22, order
  22, attack 26, pact 34, article 34, court 36, bill 38, campaign 40, organise 42.
  The cheapest card is `floor` at 12.
- **Evidence:** `V16_AI_COST` 34016; `V17_AI_COST_FLOOR = 12` 38191; `floor` card
  34496-34508; `v18Tempo` 35385.
- **Why it matters:** a party on 12-15 is quartered to 0.35 odds while it can
  still play a card. Small, but it is CLAUDE.md's "a comment asserting what a line
  does is not a reading of the line" — and the bar was presumably chosen from the
  false reading.
- **Upgrade:** derive the bar (`Math.min` over the deck's costs) rather than
  naming one card, so a cheaper card added later moves it.

### The posture the player is shown is a stale copy, wrong three times in ten — [inconsistent]
- **What:** the Parties page prints `V16_POSTURE_SAY[a.posture]` (36127), and
  `a.posture` is written **only inside the tempo gate** at 35453 — after
  `if (!answering && !passed) return;` at 35451. A party that does not act does
  not update it. Its initial value is the literal `'hold'` in `v16Ai`'s
  initialiser (34064). Measured against the live `v16Posture` at the same instant:

```
printed value WRONG in 439 of 1440   30.5%
age of the printed value: median 10 sessions, p90 38, max 55
never written at all (still the initialiser): 149 of 1440
```
  The largest single error class is `moderate -> shown hold` (84) and
  `hold -> shown organise` (86).
- **Evidence:** 34064, 35451-35453, 36127; `scratchpad/posture3.js`.
- **Why it matters:** the section comment above the panel says "A posture the
  player cannot see is a posture that is not in the game" (36006). What the
  player sees is a posture from a median of ten sessions ago. The adjacent column
  ("Odds of moving") calls `v18TempoOdds(S, p.id)` **live** at 36136, so one
  column of the same row is current and the other is two and a half cadence
  cycles old.
- **Upgrade:** render `v16Posture(S, p.id)` directly, the way the odds column
  already does. `a.posture` then has no reader at all and should go, or be kept
  and shown explicitly as "last acted as".

### `v17Accept`'s posture term reads the government that is being replaced — [inconsistent]
- **What:** `v17Accept` (37455) adds `post === 'attack' ? 16 : 0` to a party's
  reservation price (37485). `v17Rotation` runs every formateur round and
  `v17Install` writes `st.ruling`/`st.coalition` only afterwards (37623-37626),
  so `v17PostureOf` inside every offer reads the **outgoing** government. Measured
  over 242 accept calls: `{partner:159, moderate:44, hold:25, organise:9,
  attack:4, govern:1}`. A party in the outgoing coalition returns `partner` at
  34137 before any grudge is read, so an ex-partner that loathes the new
  formateur pays **no** premium; the term fired on 4 of 242 rows (1.7%).
- **Evidence:** 37455-37495, 37583-37594, 37623-37626; measured distribution in
  `scratchpad/posture2.js`.
- **Why it matters:** it is also a second, wrongly-aimed reading of a fact the
  same function already reads correctly — `v17GrudgeOf(st, pid, lead)` at 37457,
  weighted −0.32/point. `v16Posture`'s grudge test asks about `st.ruling` and
  `playParty`, neither of which is `lead`.
- **Upgrade:** delete the posture term and let the direct grudge-against-the-
  formateur term carry it, or replace it with `v16Grudge(st, pid, lead) >= 35`.

### `v17Accept` returns a `posture` field nothing reads — [decorative]
- **What:** 37495 returns `posture:post` in every answer object. `grep -n
  "\.posture" vale.html` returns exactly two lines: 35453 (the write) and 36127
  (the panel read). No caller reads the answer's `posture`.
- **Evidence:** the grep above; `v17Build` 37502 collects `answers`, rendered by
  the formation card without it.
- **Why it matters:** it is `st.court.size` in miniature — a field a later reader
  will reason about as though the formation surface consulted the mood.
- **Upgrade:** drop the field, or render it on the formation card (where it would
  at least be honest about what it measured).

### Posture's real second job is the burn rate, and nobody has said so — [works]
- **What:** the one consequence of posture with teeth outside the deck filter is
  `partyPurseTick` (16356-16375): `V17_BURN[v16Posture(...)]` sets the fraction of
  income a party spends through `partySpend` → `st.funding` → `supportTargets`.
  `hold` .38 vs `organise` .88 — a 2.3× swing on every AI party's campaign
  spending, every session, on 44.8% + 7.9% of party-sessions.
- **Evidence:** `V17_BURN` 38534-38545; call 16371; `pv5CampaignTick` → 16385,
  reached from 16424; measured exposure `{hold:666, partner:326, govern:228,
  moderate:133, organise:117, attack:14, consolidate:4}`.
- **Why it matters:** it produces the only genuine feedback loop in this area — a
  `hold` party at .38 accumulates until it crosses 120, becomes `organise`, burns
  at .88, drops back to `hold`. That is why the purse under `hold` sits at a
  median of 86 with a p90 of 112, just under the line. It also means changing a
  posture bar silently retunes every AI party's campaign spending.
- **Upgrade:** none needed to the mechanism; but any change to `v16Posture`'s bars
  must be measured against `supportTargets`, and the assertion should say so.
  `restive` and `consolidate` have burn rates (.52, .82) that have never applied.

### The reaction bypass never fires between engines, and `provokedAt` is half-dead — [inconsistent]
- **What:** `v16Resent` stamps `a.provokedAt[against] = st.turn` for **any**
  provoker at 34098-34099 — including the `attack` card's AI-to-AI hit of
  `V18_ATTACK_RESENT = 21` (34419), which clears `V19_REACT_RISE = 10`. But
  `v19React` reads only `(a.provokedAt || {})[me]` (35906). `grep -n provokedAt`
  returns three lines: 34098, 34099 (writes) and 35906 (the read, keyed to the
  player).
- **Evidence:** 34098-34100, 34419, 35906; measured `a.react === st.turn` on
  **0 of 1,440** party-sessions with an idle player.
- **Why it matters:** S18e's own note says the only AI-to-AI channel in three
  megabytes was `v17FloorCore`'s pressure, and added one. The *answer* to it was
  never wired: party A can attack party B every four sessions forever and B never
  once moves early. The whole "the party did not wait" line (35918) is reachable
  only by the player.
- **Upgrade:** loop `v19React` over every key of `a.provokedAt` rather than over
  `me`, with the same `V19_REACT_COOL` rest and the same `owed` accounting. It
  costs nothing in budget because the debt mechanism at 35489/35515 already
  balances it.

### Nothing plans past this session; posture is recomputed from scratch every time — [missing]
- **What:** `v16Posture` is a pure function of the current board. There is no
  hysteresis, no `since`, no memory that the party was in a different mood last
  session. `st.ai[pid].since` is written by the initialiser at 34064 and — `grep
  -n "\.since"` on the AI object — read by nothing in the AI path.
- **Evidence:** 34064; `v16Posture` 34116-34143 reads only `st.coalition`,
  `st.seats`, `ai.lastSeats`, `v16Grudge`, `partyPurse`.
- **Why it matters:** measured, postures flip constantly — `hold -> shown
  organise` and `hold -> shown moderate` classes exist because the live value had
  moved. A party cannot "settle into" a stance for a season, which is exactly the
  "consequence between sessions" the baseline says the programme lacks.
- **Upgrade:** give posture a minimum tenure (three sessions, say) or a hysteresis
  band on each bar, and stamp `postureSince`. That also makes the panel's stale
  value nearly correct as a side effect.

### The `attack` card's target and the `attack` posture's trigger read different things — [inconsistent]
- **What:** the posture fires on `grudge(pid, me) >= 35 || grudge(pid, st.ruling)
  >= 35` (34138). The card, once played, retargets to the party with the highest
  grudge **plus a rivalry push** (34391-34402), which may be neither of those two.
- **Evidence:** 34138 vs 34391-34402.
- **Why it matters:** mostly benign — the highest grudge is usually the one that
  tripped the bar. But a party pushed into `attack` by its grudge against the
  player can spend the attack on a third party because `v19Rivalry` tipped it,
  and the player is told the posture is "Coming after the government".
- **Upgrade:** low priority. If the two must differ, the panel sentence should
  name the target (`a.why.foe` is already recorded at 35524 and rendered at
  36190-36194).

### Three grudge bars, two of them bare literals — [inconsistent]
- **What:** `V18_RESTIVE = 55` is named (34110). The attack bar of **35** is a
  bare literal written twice — once in `v16Posture` (34138, twice on the line) and
  once in `v18Tempo` (35388). The pact refusal uses a third bare **20** (34610).
- **Evidence:** 34110, 34138, 35388, 34610.
- **Why it matters:** the tempo comment says the grudge term fires "at the attack
  bar" (35376) — a claim held together by two literals agreeing by hand. Retuning
  one and not the other is a silent divergence, and this file's history is a list
  of exactly that.
- **Upgrade:** `var V18_ATTACK_BAR = 35;` read by both, and `roads.js` asserting
  the tempo term and the posture use the same constant.

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `st.ai[pid].posture` | `v16Ai` initialiser 34064 (`'hold'`); `v16AiTurn` 35453 (only when the party acts) | `v16AiPanel` 36127 only. `grep -n "\.posture" vale.html` → 35453, 36127. Wrong 30.5% of the time, median 10 sessions old |
| `st.ai[pid].lastSeats` | `v16AiTurn` 35532, every party every session | `v16Posture` 34119 (`trend`); `v18Tempo` 35394 (`losing`) |
| `st.ai[pid].grudge[x]` | `v16Resent` 34076 (callers: 10155, 10159, 10163, 10224, 13256, 34419, 35723, 35778, 35998, 36002, 38332); cooled 35531 | `v16Grudge` 34071 → `v16Posture` 34138, `v18Restive` 34114, `v18Tempo` 35387, `v16PactPartner` 34610, `v17Accept` 37457, `v17GrudgeOf` 37420, `attack` card 34395 |
| `st.ai[pid].provokedAt[x]` | `v16Resent` 34099, for **any** provoker | `v19React` 35906, **only `[me]`**. `grep -n provokedAt` → 34098, 34099, 35906. AI-to-AI stamps are dead |
| `st.ai[pid].react` | `v19React` 35910 | `v16AiTurn` 35450. Deliberately never cleared (35443-35449) |
| `st.ai[pid].reactedAt` | `v19React` 35909 | `v19React` 35907 (`V19_REACT_COOL`) |
| `st.ai[pid].owed` | `v16AiTurn` 35489 (decrement), 35515 (increment) | `v16AiTurn` 35489 only. `grep -n "\.owed"` → 35489, 35515. Not shown to the player anywhere |
| `st.ai[pid].last[cardId]` | `v16AiTurn` 35493 | 4-session cooldown 35456; recency term `v19Score` 35290 |
| `st.ai[pid].since` | `v16Ai` initialiser 34064 | **NONE FOUND**. `grep -n "\.since\b" vale.html` returns 22 lines, all of them court justices (6352, 11751, 15407…), `st.aiPacts[…].since` (written 34460, read 12007), treaties (18044, 19914), governors (19872) or the press narrative (22217) — none is this field |
| `v17Accept(...).posture` | 37495 | **NONE FOUND**. `grep -n "\.posture" vale.html` returns only 35453 and 36127 |
| `V18_TEMPO` | literal 35367 | `v18Tempo` 35384-35394 only |
| `v18Tempo` | — | `v18TempoOdds` 35408, 35411 only |
| `v18TempoOdds` | — | `v16AiTurn` 35442 (the gate); `v16AiPanel` 36136 (the "Odds of moving" column) |
| `V16_AI_CADENCE` | literal 34040 | `v18TempoOdds` 35410 (budget); `v16AiPanel` 36203 (the panel sentence) |
| `v16Posture` | — | `partyPurseTick` 16371 (`V17_BURN`); `platform` card 34432; `v16AiTurn` 35452; `v17PostureOf` 37423 → `v17Accept` 37458 |
| `V17_BURN` | literal 38534 | 16371 only. Its `restive` (.52) and `consolidate` (.82) rows have never applied |
| `V16_POSTURE_SAY` | literal 36223 | 36127 only. Covers all 8 postures |
| `V16_AI_DECK` | literal 34328 | filtered 35454; `run` swapped by harnesses only. **Never pushed to** (`grep -n V16_AI_DECK` → 34328, 35454), so the posture matrix is complete and static — the S10e "list built at the end" hazard does not apply here |

---

## What I could not verify

- **Whether `attack` reaches 4.9% for the reason the baseline implies.** My player
  is idle and measured 0.9%; the baseline's player "spent a whole campaign taking
  their seats". I did not reproduce a hostile player, so the 4.9% figure and the
  claim that it is player-driven are inference from the delta, not measurement.
- **The 30.5% panel-staleness figure is sampled after `endTurn` settles**, which
  is when a player would look at the page but not exactly when `render()` runs
  inside the queue. The direction and the median age (10 sessions) are robust; the
  exact percentage may move a point or two.
- **My probe-1 open-set numbers perturb the dice.** Calling `c.can` for the whole
  deck runs `v19BillFor`, `v17AiFloorFor` etc., some of which may consume `rand()`
  — the S18c hazard. Probe 1 and probe 2 came out at 1,440 vs 1,488 party-sessions
  on the same seeds for that reason. The *posture distribution* figures I quote are
  from probe 2 (no `can` calls); the *open-set* figures are from probe 1 and are
  therefore on a slightly different republic. Both agree on which postures are
  empty.
- **I did not poison any of these findings** — this is intake, not a slice. In
  particular the burn-rate reader (16371) and the platform-direction reader
  (34432) were read from the code and their call chains traced, not deleted and
  re-measured.
- **`v19Outcome`'s clone (`v19Try`)** runs `card.run` on a clone during scoring. I
  did not check whether that clone's `v16Posture` reads are consistent with the
  live board, only that `v19Score` never calls `v16Posture` itself.
- **Six seeds, not fourteen.** S20f (docs/MAP.md:1388) is explicit that effect
  *sizes* in this area shrink as the sample grows. The zero counts (restive 0,
  consolidate 4) and the threshold-vs-distribution comparisons are structural and
  will hold; any percentage I quote to one decimal should be re-swept before it is
  used to set a number.
