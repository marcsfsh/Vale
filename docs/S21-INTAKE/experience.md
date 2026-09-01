# experience

## What it does today

Six engine parties share a hard budget of **1.5 initiatives per session between
them** (`v18TempoOdds` line 35410, `budget = live.length / V16_AI_CADENCE`,
`V16_AI_CADENCE = 4` at 34040). Each initiative emits one sentence, at most
three of which reach the log (`v16AiTurn` line 35536). The eleven cards are
almost all things a party does **to itself** — court a bloc, build the
organisation, rewrite a platform, sign a pact — and the two that reach another
party (`attack`, `floor`) are 14% of plays. Everything the engine knows about
the player lives in one grudge integer per party and one `partyRel` integer per
party, both of which are pulled back toward a fixed base every session. And
because `isBallotTurn` is `t % 2 === 1` (line 10630), **a government lasts one
session before the whole formation is re-run from scratch** — so there is
almost no "between elections" for a relationship to happen in.

Measured for this report (`scratchpad/xp-visible.js`, `xp-texture.js`,
`xp-oust.js`, `xp-foe.js`, `xp-govchair.js`; six seeds, 120–132 sessions each,
`aiLevel: ruthless` unless stated).

---

## The campaign, played out

### Sessions 1–20 — the only time anyone speaks to you

`seedOpeningInbox` (9951) puts two papers on the desk. If you sit in
opposition they are **"Your Parliamentary Party Calls a Strategy Conference"**
and **"The Government Offers You a Committee Chair"** — the single best
"an opponent is dealing with me" moment in the game. Both types are emitted
from exactly two `addInbox` calls, both inside `seedOpeningInbox` (9969, 9972).
**They never happen again.** Same for `coalition_review` (9955/9962) and
`senate_conference` (9958/9965): measured 12 raises each across 720 sessions,
which is twice per campaign, both at the open.

Every party starts with `grudge:{}` (`v16Ai`, 34064), so the Parties table
reads "Nothing on file" seven times. Purses are under the cheapest card, so
`V18_TEMPO.broke` (0.35, line 35375) suppresses most of them. Elections land on
sessions 3, 5, 7, 9… — by session 20 you have been through nine of them and
seen the formation sheet nine times.

What you read, on average 1.4 lines a session: *"The TVC spent the season
courting religious communities."* *"The RSF opened agents and halls in eleven
more counties."* Court, organise and demand are **57% of every sentence the
engine produces** (302+167+177 of 1,128 across six campaigns).

### Sessions 20–60 — the pattern closes

By now the game has shown you its whole vocabulary. Across **six** 132-session
campaigns the engine produced **1,128 sentences of which 190 were distinct**.
`organise` has exactly one sentence per party (34334) and fires 28 times a
campaign. *"The TVC spent the season courting religious communities"* appears
**80 times** in six campaigns — 13 times in one. **58 of 1,128 sentences name
you at all (5.1%).**

The formation sheet — genuinely the best-written surface in the file
(`v6CoalitionDialog`, 19471–19603, with a real accept/refuse pin at 19589) —
resolves `majority` in round one on 354 of 360 formations, and no investiture
vote has ever failed. So thirty times running you open it and read *"A
Government Is Formed… Nobody asked you, and on these numbers nobody had to."*

You start using the party actions — poach, audit, discredit, cut funding — and
grudges climb. Nothing changes. `v16Posture` (34116) needs grudge ≥ 35 to reach
`attack`; grudges cool 0.6 a session (35531) against a measured mean of 22.13,
so most parties never cross the bar. Measured share of `attack` posture at the
top AI level: **4.9%**.

### Sessions 60–130 — nothing has a memory of session 20

The engine has no aim it can finish: **86% of goals are abandoned** and `oust`
— the only aim pointing at a government — was held **0 times in 720 sessions**
(cause diagnosed below). `v19Goal`'s idle clock is 11 sessions (34898) which is
five election cycles, so a party visibly abandons its aim roughly every twelfth
session, and the panel prints *"Put a bloc down: it was going nowhere"* over
and over.

If you lead a majority coalition you are **structurally unremovable** for the
whole campaign. `v17ConfidenceVote` (37740) is called from exactly one place —
line 12711, inside the player's own "Force a vote of no confidence" action —
and `v17Refound` (37797) from one place, 12719. No engine party can put the
question to the house.

By session 130 the log holds 60 entries (11046) of which, sampled at campaign
end, **45 of 360 were engine initiatives** — one line in eight. The other
seven-eighths are your own machine reporting back to you.

---

## Findings

### The whole opposition acts 1.4 times a session — [shallow]

- **What:** `v18TempoOdds` normalises every party's weight against a fixed
  budget of `live.length / V16_AI_CADENCE` = 6/4 = **1.5 expected initiatives
  per session, total, across all six parties**. The budget is zero-sum: making
  one party busier makes another quieter by construction.
- **Evidence:** `v18TempoOdds` 35402–35411, `V16_AI_CADENCE = 4` at 34040.
  Measured: **1,025 real card plays in 720 sessions = 1.42/session**; 133 of
  720 sessions (18.5%) had **no engine action at all**; a given party acts
  once every 4.2 sessions (`xp-visible.js`).
- **Why it matters:** this is the arithmetic behind "1 of 10". The player takes
  several actions a session out of 5–8 capital plus bills, orders, articles,
  diplomacy and executive spending. Six opponents share one and a half. No
  amount of cleverness inside `v19Score` can make an opponent that moves once
  every four sessions feel present.
- **Upgrade:** raise the budget and stop normalising a *shared* pool. Give each
  party its own odds with its own floor, so a party with money and a grievance
  can act every session without silencing the other five. `V16_AI_CADENCE` is
  the single highest-leverage number in the AI.

### The baseline's 4,941 initiatives were 3,916 rehearsals — [inconsistent]

- **What:** `v19Outcome` runs `card.run` on a **clone** through `v19Try` at the
  thinking levels. A harness that wraps `run` and does not check
  `V19_SIMULATING` counts every rehearsal as a play. `docs/S21-BASELINE.md`
  quotes 4,941; the true figure is **1,025 played, 3,916 rehearsed**.
- **Evidence:** `v19Try` 35214–35240, `V19_SIMULATING` 35213, `v19Outcome`
  35264–35279. Measured split in `xp-visible.js`. The card mix changes too:
  `attack` is 559 rehearsed-plus-played but only **74 played**.
- **Why it matters:** the intake's headline number is 4.8× the truth, and it is
  the number that says "the engine ACTS enough". It does not.
- **Note:** `scratchpad/base21.js` has since been corrected on disk by another
  intake agent; the doc has not.

### `oust` is unreachable because reaching it is the disqualification — [exploitable]

- **What:** `oust.fits` needs a grudge ≥ 25 against somebody (34772).
  `oust.done` returns true when the target is **not** in government (34784).
  `v19AdoptGoal` refuses any goal that is already `done` (34955–34957). So the
  goal can only be adopted when the party you hate most is *currently in the
  government*, and the moment they leave it the aim retires as "done" without
  the party having lifted a finger.
- **Evidence:** measured at `ruthless`, 194 adoption moments: `fits` positive
  on **30**, of which **28 were dropped because the hated party was already out
  of government**, 2 entered the weighted pool, **0 were ever picked**
  (`xp-oust.js`). Same run at `purposeful`: 54 / 37 / 17 / 0.
- **Why it matters:** this is the only aim in the game that points at bringing
  a government down. Its absence is why no engine party ever forms a plan
  against you and why the whole hostile half of the deck is idle.
- **Upgrade:** `done` should be "the target left government *while I was
  working to remove them*" — stamp the government at adoption and compare —
  and `fits` should read the grudge against the **head of government** as well
  as the maximum, so hating the party in office is what adopts it.

### No engine party can end a government — [missing, highest cost]

- **What:** there is no code path from the AI to a confidence motion, a
  dissolution, or a re-founding. `v17ConfidenceVote` and `v17Refound` each have
  exactly one caller and it is the player's own ACTION card. `callElection`
  (13439) refuses anyone but `leads(S)`.
- **Evidence:** `grep -n "v17ConfidenceVote\|v17Refound" vale.html` → 12711,
  12719, 37740, 37797. Nothing else.
- **Why it matters:** as head of a majority coalition the player cannot lose
  office between ballots by any means. The `confidence_threat` paper never puts
  a question to the house — its three answers (10169–10175) move trust, set
  `S.confidence`, or splice the partner out of an array. There is no vote.
- **Upgrade:** let a party holding `oust` (once it is adoptable) table the
  motion through `v17ConfidenceVote`, with the tally shown before it is put.
  The function, the arithmetic and the re-founding are all already written.

### The coalition's voice is throttled by a gate the AI's own deck saturates — [inconsistent]

- **What:** every coalition paper sits behind
  `if (st.inbox.length >= 4 || (st.turn + st.inboxSeq) % 2) return;` (10261).
  The parity term silences half of all sessions outright. The inbox term is
  kept full by papers that bypass the gate entirely — the `demand` card calls
  `addInbox` directly (34581).
- **Evidence:** with the player pinned as head of a coalition for 792 sessions
  (`xp-govchair.js`): **312 sessions blocked by a full inbox, 215 by parity,
  only 252 of 792 (32%) reached the coalition block at all**. Over the same run
  the deck posted 222 `party_demand` papers plus 157 `interest_demand` and 196
  `v10paper`.
- **Why it matters:** the partner's channel loses two thirds of its
  opportunities to a throttle whose main input is noise from elsewhere.
- **Upgrade:** give the coalition paper its own slot that the throttle does not
  govern, or move the throttle after the coalition branch.

### A strained partner only ever threatens, never asks — [inconsistent]

- **What:** `confidence_threat` fires when `partyRel[partner] < 27` and
  `return`s; `coalition_demand` is only reachable when trust is ≥ 27 (10270,
  10276). One threshold makes the two mutually exclusive, and the threat
  pre-empts.
- **Evidence:** 291 `confidence_threat` against 67 `coalition_demand` in the
  pinned-government run. Below 27 the partner never once asks for anything.
- **Why it matters:** the relationship has two states — silent, or holding a
  gun — with nothing in between where a partner negotiates.
- **Upgrade:** the two papers should be a ladder on cohesion, not a switch, and
  a threat that goes unanswered should escalate to the next paper rather than
  repeat.

### "Dare them to leave" always ends the partnership — [exploitable]

- **What:** the paper only appears at `partyRel < 27` (10270); the `dare`
  branch removes the partner at `partyRel < 28` (10173). The `else` arm is
  reachable only if trust climbs from below 27 to at least 28 inside the
  paper's two-session life.
- **Evidence:** 10270 vs 10173.
- **Why it matters:** a choice tipped "They **may** leave the cabinet" is in
  practice a button labelled "dissolve the coalition". The one moment of
  brinkmanship the game offers is a foregone conclusion.
- **Upgrade:** price the dare against the partner's cohesion *and* whether the
  arithmetic survives without them — which is the interesting question and the
  game never asks it.

### A partner walking out changes nothing about the arithmetic — [missing]

- **What:** `v17Walkout` (35770) and the `dare` branch (10173) splice the party
  out of `st.coalition`. Nothing anywhere re-counts whether the government
  still commands the house.
- **Evidence:** `v17Walkout` 35774–35788 writes no formation, no confidence
  test, no `v17Refound`. `v17Refound` has one caller (12719) and it is the
  player's own action.
- **Why it matters:** losing your majority mid-term is the classic crisis of
  parliamentary government and here it is a line in the log.

### The engine's memory records personal slights and nothing political — [shallow]

- **What:** the complete list of `v16Resent` callers is: answering or ignoring
  a `party_demand` (10155/10159/10163/10224), a coalition quit (13256), another
  party's `attack` (34419), a coalition breach (35723), a walkout (35778), the
  player's `V17_MEMORY` verbs (35998/36002), and floor pressure on a sponsor
  (38332).
- **Evidence:** `grep -n "v16Resent(" vale.html` — eleven call sites, listed
  above.
- **Why it matters:** **nothing calls it for a statute carried, a seat lost, an
  office taken, or a government formed without them.** You can spend 130
  sessions passing the exact statutes the PNL exists to prevent and it will
  never hold one of them against you. The parties resent you for poaching an
  organiser and not for governing.
- **Upgrade:** a small resentment when a statute moves away from a party's
  `wants` — the table is already authored and already read by
  `partyDemandPolicy`, `pv5TopWants` and `v19BillFor`.

### Gratitude exists in the table and cannot be stored — [decorative]

- **What:** `V17_MEMORY` carries twelve negative entries — `joinCoalition:-20`,
  `fund:-14`, `tradeMinistry:-14` (35975–35986) — and the comment above them
  claims "it works the other way". But `v16Resent` clamps at **0** (34076), so
  a kindness can only spend an existing grudge down. A party you have funded,
  invited and given a ministry to is byte-for-byte identical to a party you
  have never met.
- **Evidence:** 34076 `clamp((a.grudge[against] || 0) + n, 0, 100)`; comment at
  35971–35974.
- **Why it matters:** every positive verb the player owns is a no-op against a
  party that already likes them, which is exactly the party you want to build
  an alliance with. It is also why nothing can ever be *owed* to the player.
- **Upgrade:** allow negative values with a separate floor, and read the
  negative side in `v17Accept`, `partyBillSupport` and the formation offer.

### The default AI level prints a rival it never read — [decorative]

- **What:** `V19_DEFAULT_LEVEL = 'purposeful'` (441), whose row is
  `sharp:1.4, sim:0, read:0` (434–435). `v19Score` skips the rehearsal term
  when `sim <= 0` (35300) and the rivalry term when `read <= 0` (35315). But
  `v16AiTurn` calls `v19Rival` unconditionally (35478) and stamps `foe` into
  `a.why` (35524), and `v16AiPanel` prints *"with the X in the way"* from it
  (36190–36194).
- **Evidence:** measured at `purposeful` over 80 sessions: **39 of 135 recorded
  actions name a rival, 11 of them the player**, while `v19LevelOf(S).read`
  is 0 (`xp-foe.js`).
- **Why it matters:** at the setting most players will use, the page states a
  reasoning the model did not perform. This is the "card that lies" family the
  project's own CLAUDE.md punishes hardest. It also means **S19f's reaction
  layer is dead at the default level** — `answering` sets `rival = {foe:me}`
  (35479) and that value is only consumed through the term `read` switches off,
  so a provoked party acts in the right session and then chooses on the board's
  ordinary merits, which is precisely the defect S19f's comment says it fixed.
- **Upgrade:** either make `purposeful` read at a small weight, or suppress the
  caption below `shrewd`. The second is one line.

### Nothing in the AI reads how strong the player is — [missing]

- **What:** `v16Posture` reads only its own seats, share, purse and grudge
  (34116–34143). `V19_GOALS` read their own `wants`, `aff`, machine and the
  statute book. `v19Rivalry` is the one place the human enters (35090–35111)
  and it reads only the grudge and who holds which office. Nothing anywhere
  reads the player's approval, capital, unity, treasury, seat trend or majority
  size.
- **Evidence:** the three function bodies above; `grep` for `approval(` inside
  34000–35500 returns nothing in the AI path.
- **Why it matters:** win a landslide and the opposition behaves identically.
  The only reaction to an election result in the whole engine is
  `driftParties` moving positions toward the winner (11649–11681) — which the
  player never sees stated — and `V18_TEMPO.losing` (35378), a ×1.3 that
  **lasts exactly one session** because `lastSeats` is refreshed every session
  at 35532.
- **Upgrade:** one term. A party whose share fell should raise its tempo and
  bias toward `attack`/`organise` for several sessions, and the panel should
  say so.

### The formation is the best surface in the game and always says the same thing — [shallow]

- **What:** `v6CoalitionDialog` (19471–19603) is genuinely interactive: it
  prints every round, every offer, every reservation price and the answer, and
  it lets the player overrule their own party's answer and re-run the rotation
  (`v17Reanswer` 19465). But the rotation resolves `majority` on **360 of 360**
  formations, first round on **354**, and no investiture has ever failed.
- **Evidence:** baseline table, `scratchpad/rota.js`; `v17Rotation`
  37583–37618; offers are always `pv5TopWants(pid, st, 4)` sliced into exactly
  2 adopts + 1 refrain + 1 red line (`v17Offer` 37438–37447).
- **Why it matters:** with an election every two sessions the player sees this
  sheet **66 times per campaign** and it says the same thing 65 of them.
- **Upgrade:** the variety has to come from the inputs, not the sheet — vary
  the offer size with what the formateur needs, let a party demand a named
  office, and let a red line be refused.

### The engine's orders all go to the same place — [shallow]

- **What:** `v17AiOrderFor` takes the **first** entry in `V10_ORDERS` whose
  department the party holds and that is currently open, and targets
  `REGIONS[0]` unconditionally.
- **Evidence:** 38403–38411; `REGIONS[0]` is Somnium Coast (602).
- **Why it matters:** 87 order plays across six campaigns, all naming the same
  region and the same handful of orders. It reads like a bug even though it is
  not one.

### The one card that reaches a bill never thinks about the player — [missing]

- **What:** `v19BillFor` (34284–34327) picks from the party's own `wants` by
  gap, then re-ranks the top five by `billForecast`. It has no notion of
  blocking a government bill, splitting a coalition, or forcing the player onto
  the record. `v17AiFloorFor` (38473–38506) picks by pivotality and, below
  `shrewd`, by raw ideological distance — never by who sponsored it.
- **Evidence:** both bodies; neither reads `playParty` or `st.ruling`.
- **Why it matters:** a competent opponent times a wrecking amendment. This one
  lays the statute it most wants and forgets you exist.

### `platform` is invisible for up to two sessions and unattributed — [shallow]

- **What:** the `platform` card writes `st.push[pid]` (34445). The only reader
  is `driftParties` (11674–11676), which runs inside `runElection`.
- **Evidence:** `grep -n "st.push"` → 34444–34445 (write), 11674 (read),
  11681 (`st.push = {}`).
- **Why it matters:** 26 plays across six campaigns, each producing a sentence
  now and an effect later that no line connects back to it.

### Two clocks pull the relationship number back to a constant — [inconsistent]

- **What:** `politicsTick` pulls `partyRel` 6% toward 46 (out of government) or
  62 (in it) **every session** (10242). `pv5CoalitionTick` pulls it a further
  3.5% toward the partner's cohesion (16314), and pulls cohesion 12% toward a
  target whose floor is 38 (16312–16313).
- **Evidence:** 10242, 16312–16314; `shiftPartyRel` called 2,164 times at mean
  magnitude 4.71 (baseline).
- **Why it matters:** an 8-point injury has a half-life of about eleven
  sessions against the first pull alone. Sustained hostility is possible only
  by repeating the verb; nothing accumulates. Measured cohesion with the player
  leading: median **38** — exactly the target's floor.
- **Upgrade:** make the reversion target read the *history* — the ledger is
  already written (`v17Ledger`) and read by nothing but the deal card.

### `cross_party` is 411 letters from one party — [shallow]

- **What:** the fallback paper in `politicsTick` always comes from
  `others[0]`, sorted by seats (10305–10310).
- **Evidence:** measured, 449 `cross_party` papers of which **311 came from the
  FP alone**; over 132 sessions that is one party writing you the same letter
  roughly every third session.

### `v19Outcome` is one ply and reads only the party's own standing — [shallow]

- **What:** clone, run the card, read `v19Standing` before and after, squash to
  ±1 (35264–35279). `v19Standing` (35250–35262) is `v17Utility` plus the
  party's own share, machine, purse and offices.
- **Why it matters:** no opponent reply, no second card, no next session, and
  no term for what the *player* would do about it. A party cannot set a trap,
  bait a response, or hold something back for a session when it will matter.

---

## What the player would most notice missing, ranked

1. **Nobody can take the government off you.** No AI path to
   `v17ConfidenceVote` (37740, one caller at 12711). Verified.
2. **Nobody ever proposes anything.** The only offer in the game
   (`government_offer`, 9972) fires once, in session 1, and never again.
   Verified.
3. **They act 1.4 times a session between six of them.** `V16_AI_CADENCE = 4`
   at 34040, budget at 35410. Verified.
4. **Nobody carries a plan against you.** `oust` held 0 times; cause at 34784 +
   34955. Verified.
5. **Nobody resents you for governing.** Eleven `v16Resent` sites, none of them
   legislative or electoral. Verified.
6. **Nobody reacts to a landslide.** `V18_TEMPO.losing` lasts one session
   (35378 + 35532); `driftParties` (11649) is never narrated. Verified.
7. **Nobody coordinates.** `aiPacts` is a two-party vote pool (35545–35550) and
   `v16PactPartner` picks by distance alone (34604). No anti-player bloc exists;
   `st.cordon` and `st.coopted` are player-only instruments and measured 0
   sessions in 720. Verified.
8. **No party ever changes its leader after a defeat.** Every
   `figures.leaders[x] = makeFigure` site is `newGame` (7028/7035), a succession
   (7381), an event the player answers (8407/8417) or a player action
   (12775/13017/13180). Verified.
9. **Nobody times anything.** No card reads the calendar except `campaign`
   (`pv5SessionsToBallot <= 4`, 34337), and with a two-session term that
   condition is always true. Verified.
10. **No party ever splits, merges or dies of its own accord.** Unverified —
    I did not read the ban/split paths in full.

## Present but invisible — cheaper to fix than the absences

- **The rival read.** `v19Rivalry` names the player from the grudge and the
  offices they hold (35090–35111) and it is genuinely good. It appears in one
  place: a trailing clause on at most four rows of a table on the Parties page
  (36190–36194) — and at the default level it names a rival the model never
  used (above).
- **The abandoned aim.** `a.lastGoal` records *why* an aim ended and the panel
  says it well (36160–36164), but only for six sessions and only on that table.
  86% of aims end this way and none of it reaches the log or the news.
- **The temperaments.** `PARTY[].temper` (764–800) is authored per party and
  drives the goal patience (34925) and a score term (35313). The player sees one
  muted line in a table cell (36173).
- **Position drift after an election.** `driftParties` (11649–11681) moves
  every party toward the winner at up to 20% — a real, large effect that is
  never stated in words anywhere.
- **The coalition ledger.** `v17Ledger` writes kept/broken/altered per partner
  and `v17LedgerCard` (35835) renders it — but nothing reads the ledger back
  into behaviour except `v17WalkFloor` (35615) and `v17CanRenegotiate` (35800).
- **The formation rounds.** Every offer, price and refusal is recorded in
  `st.formation.rounds` (37632–37639) and rendered (19429) — for a rotation
  that resolves in round one 98.3% of the time.

## The moments that get nothing

| Trigger | What happens now | Evidence |
|---|---|---|
| You win a landslide | `driftParties` moves everyone toward you, silently; one party gets a ×1.3 tempo for one session | 11649, 35378, 35532 |
| You lose the government | Nothing. No engine party's posture, goal or memory reads it | `v16Posture` 34116, `V19_GOALS` 34677 |
| You betray a coalition partner | `v17DealScan` logs a breach and docks cohesion (35719–35729). Measured `move` events: 51 in 720 sessions | 35687, between.json |
| A partner walks out on you | One log line, one news item; the arithmetic is never re-counted | 35770–35788 |
| You pass a statute a party exists to prevent | Nothing, unless they are in your coalition and it is a written red line | eleven `v16Resent` sites |
| You take an office a party publicly named | Nothing. `v19Rivalry` reads it (35109) only at `shrewd`+ and only into a score term | 35109, 35315 |
| You refuse a coalition offer | Nothing beyond the rotation re-running | `v17Reanswer` 19465 |
| You cordon or ban a party | `V17_MEMORY` grudge (+22 / and `banned` filters), which decays 0.6/session | 35956, 35531 |
| An engine party reaches its aim | Six sessions of a muted line on one table | 36160 |

---

## The five changes, by impact per unit of work

**1. Raise the initiative budget and stop sharing it.**
`V16_AI_CADENCE = 4` (34040) and `budget = live.length / V16_AI_CADENCE`
(35410). Six parties at 1.5 actions a session is the root cause: every other
improvement is multiplied by how often the engine gets to use it, and right now
that is once per party per four sessions. Give each party its own odds with a
floor, and take the cadence to roughly 1.5. Cost: two lines and a re-measure of
pacing. Impact: everything downstream.

**2. Give the engine a way to move against the government, and let it fail.**
Fix `oust` (`done` at 34784 stamps the government at adoption; `fits` at 34772
reads the grudge against `st.ruling`), then let a party holding it call
`v17ConfidenceVote` — which already exists, already counts the house correctly,
and already has `v17Refound` behind it (37797). The player's own action card at
12708 is the working template. This converts the deck's hostile half from
decoration into a plot, and it is the only change that can make being in office
feel like holding something.

**3. Make an engine party come to you with an offer, repeatedly.**
`government_offer` and `opposition_conference` are fully authored — title, body,
three choices, three outcomes (9969–9974, 10076–10084, 10176–10184) — and fire
once, at session 1. Emit them from `politicsTick` on a real trigger (a party
holding `enter` whose arithmetic needs you; a government short of a majority),
and move the coalition papers out from behind the `inbox.length >= 4` throttle
at 10261. Cost: one emitter and one gate. Impact: the player is *addressed* by
an opponent for the first time since session 1.

**4. Let a party resent you for governing, and let it be owed.**
Add a `v16Resent` call where a statute moves away from a party's `wants` — the
table is already read by `partyDemandPolicy` (9927), `pv5TopWants` and
`v19BillFor` — and let `v16Resent` go negative below zero (34076) so the twelve
positive entries in `V17_MEMORY` (35975–35986) can actually store something.
Then read the negative side in `v17Accept` (37478). Cost: one clamp, one call
site, one term. Impact: the whole campaign becomes something the parties
remember, and alliance-building acquires a currency.

**5. Say what they are doing, in the session it happens.**
The engine already computes the aim, the progress, the rival, the temperament
and the reason an aim was abandoned; almost none of it reaches the player
outside one table on one page, and 1.4 lines a session of which 57% are two
sentence templates. Put the aim and the rival into the log line itself — *"The
TVC spent the season courting religious communities, closing on the ground they
need, with you in the way"* — narrate `driftParties` after a ballot, and
announce a goal reached or abandoned as news. Also either make `purposeful`
read the rival or stop printing it (36190 vs 35315). Cost: sentence templates
and one gate. Impact: this is what turns work the engine already does into
something the player experiences.

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `a.grudge[x]` | `v16Resent` 34076, eleven call sites | `v16Grudge` 34071 → `v16Posture` 34138, `v18Restive` 34114, `attack` target 34395, `v16PactPartner` 34610, `v18Tempo` 35387, `v19Rivalry` 35092, `oust.fits` 34769, `v17GrudgeOf`, panel 36168 |
| `a.gratitude` | NONE — `grep -n "gratitude" vale.html` returns only `V17_MEMORY`'s comment at 35971 | — |
| `a.provokedAt[x]` | `v16Resent` 34098 | `v19React`/`a.react` path → `v16AiTurn` 35450 |
| `a.why` `{card,goal,aim,turn,line,foe}` | `v16AiTurn` 35519–35524 | `v16AiPanel` 36178–36195 **only** |
| `a.lastGoal` | `v19Goal` 34932 | `v16AiPanel` 36153 **only** |
| `st.push[pid]` | `platform` card 34445, three player cards | `driftParties` 11674, cleared 11681 |
| `st.aiPacts` | `pact` card 34460 | `ballot` wrapper 35545, `v16PactPartner` 34609, cleared after election ~11997 |
| `st.funding[pid]` | `partySpend` 16493 (`campaign` card only among AI cards) | vote multiplier 11516, decays ×0.6/session 13484 |
| `st.partyRel[pid]` | `shiftPartyRel` 8749, `politicsTick` 10242, `pv5CoalitionTick` 16314, `v17DealScan` 35713/35722, `v17Walkout` 35777 | ~25 sites incl. `v17Accept` 37478, `partyBillSupport` 9032/31386, `confidence_threat` gate 10270, `v6coalitionLeak` 19146, risk panels 14301/20836 |
| `d.satisfaction` | `pv5CoalitionTick` 16313, `v17DealScan` 35712/35721 | `v17WalkFloor` comparison 35765, `v17ConfidenceVote` 37747, `v17LedgerCard` |
| `d.ledger` | `v17Ledger` | `v17Broken`/`v17Kept` → `v17WalkFloor` 35615, `v17CanRenegotiate` 35800, `v17LedgerCard` 35835. Not read by any decision an engine party makes |
| `st.formation.rounds` | `v17Install` 37632 | `v17RoundLine` 19429, `v17FormationPanel` 37783. Display only |
| `st.cordon` / `st.coopted` | player actions only | measured **0 sessions** with either set across 720 |

## What I could not verify

- **Which AI level the owner played at.** `V19_DEFAULT_LEVEL` is `purposeful`
  (441), where `sim` and `read` are both 0. If they left the default, two of
  the six terms in `v19Score` were off for the whole 132 sessions and the
  rivalry caption on the Parties page was fiction. All my headline figures are
  from `ruthless`, i.e. the engine's best.
- **`floor` actions against a player-sponsored bill.** My probes never lay a
  player bill, so the measured 0-of-77 is a probe artifact, not a finding.
  `v17AiFloorFor` (38473) does not read the sponsor, so I expect the rate to be
  proportional rather than zero, but I did not drive a player who legislates.
- **The pinned-government run** (`xp-govchair.js`) forces `S.ruling` back to the
  player each session and answers no papers. It measures a *rate conditional on
  leading and neglecting*, which is why its 291 confidence threats are far
  above the baseline's 1. Both numbers are real; neither is "a normal campaign".
  A probe driven by a player who actually answers papers would land between
  them and I did not build one.
- **Whether AI parties ever split, merge or are dissolved without the player.**
  I read the leader-replacement sites but not the ban/split paths in full.
- **The 190-distinct-sentence figure** counts card lines only. Formation news,
  deal breaches and walkouts add perhaps a dozen more shapes; I did not
  enumerate them.
