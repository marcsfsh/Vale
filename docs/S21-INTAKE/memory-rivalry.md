# memory-rivalry

## What it does today

Party memory is exactly one number per ordered pair: `st.ai[pid].grudge[against]`, an
integer clamped to 0..100 by `v16Resent` (`vale.html:34074-34101`), decayed a flat 0.6 a
session at the end of `v16AiTurn` (`35528-35533`). It is written by seven call sites and
read by twelve. `V17_MEMORY` (`35945-35987`) prices all thirty-four verbs one party can
aim at another, twelve of them with NEGATIVE weights, so a kindness spends a grudge down
through the same door an injury raises it — but the clamp floors at nought, so a kindness
to a party that holds nothing writes literally nothing. On top of that S19b/S20e layer a
RIVALRY read (`v19Rivalry`, `35065-35131`): a signed comparison of two parties' GOALS,
with a special branch for the human that reads the grudge plus three structural facts.
There is no gratitude field, no alliance memory, no per-person memory, and no forgiveness
that is not a purchase.

Measurements below are mine, from `scratchpad/mem.js` / `mem2.js` / `mem3.js` (6 seeds x
120 sessions, `epic`, `normal`, `aiLevel: ruthless`, `runQueue` overridden per CLAUDE.md,
player = LP and PASSIVE — the driver only presses End Session).

## Findings

### The reaction layer cannot see its own biggest writer — [exploitable]
- **What:** `endTurn` runs the wrapped `tickTurn` at `13481` — which is
  `v16AiTickBase → v16RedLineTick → v19React → v16AiTurn` (`35922-35928`) — and only then
  runs `politicsTick` at `13488`, which calls `expireInbox`. An ignored `party_demand`
  writes `v16Resent(st, it.from, playParty(st), 14)` at `10224`; 14 clears
  `V19_REACT_RISE` (10, `35883`) so `v16Resent` stamps `a.provokedAt[player] = st.turn`
  (`34097-34100`). But `v19React` compares `stamped === st.turn` (`35906-35908`) and has
  ALREADY RUN this tick. `S.turn += 1` lands at `13515`, so from the next session on the
  stamp is one behind forever.
- **Evidence:** `endTurn` `13481`/`13488`/`13515`; `expireInbox` `10193`, `10220-10225`;
  `v19React` `35885-35921`; `tickTurn` wrapper `35922-35928`. Probe `mem3.js` (1):
  grudge 0 → 14, `provokedAt.lp = 1`, `S.turn = 2`, `a.react` never set on that tick or
  the next. Contrast arm (2): a player `poach` pressed during the session stamps at turn 1
  and `v19React` sees it in time (`reactSawStampInTime: true`).
- **Why it matters:** In a traced 360 sessions the expired letter is **81 of 128** grudge
  writes (63%) and the single largest source of hostility toward the player. The one
  mechanism that makes a party answer at once is deaf to it. S19f's "did not wait" line
  can only ever fire for verbs the player presses on the Parties page.
- **Upgrade:** Move `v19React(st)` after `politicsTick`, or stamp `st.turn + 1` from
  `expireInbox`. This is CLAUDE.md's "`st.turn + 1`" rule and its "two clocks for one
  fact" rule meeting in one line — pick ONE owner of the session number and assert the
  ordering, because a probe that drives real sessions is what caught it.

### There is no gratitude field, and a party that holds nothing cannot be helped — [missing]
- **What:** Greps for `gratitude`, `grateful`, `favour`, `owed`, `debt`, `ally`,
  `alliance`, `trust`, `goodwill`, `forgive`, `reconcile`, `apolog` over the whole file
  return **prose only** — every hit is card text, a crisis choice label or a statute
  description (`8040`, `12241`, `16623`, `16873`, `18584`, `20098`, `27322`;
  `goodwill` at `1122`, `2000`, `3020`, `9857`, `14506`, `23817`, `26081-26082`, `26476`,
  `29229`, `29233`). `grep "a\.trust\|\.gratitude\|\.favour\b\|\.goodwill"` on the ai
  object returns 0. `a.owed` (`35489`, `35515`) is an initiative DEBT to the tempo
  budget, not a favour owed to anybody. The only positive channel is the twelve negative
  `V17_MEMORY` weights, and `v16Resent` clamps at 0 (`34076`).
- **Evidence:** `v16Resent` `34076`; `V17_MEMORY` negatives `35975-35986`;
  `a.owed` `35489`/`35515`. Probe `mem3.js`/`mem.js`: on a party at grudge 0, `fund`
  (-14) then `joinCoalition` (-20) leave the grudge at **0** and
  `v19Rivalry(S,'fp','lp')` at **0** before and after.
- **Why it matters:** 42% of party-sessions in my run sit at grudge 0 against the player
  (1,832 of 4,320) and 94% of AI-to-AI pairs do (20,337 of 21,600). For all of those, every
  helpful thing the player can do is worth exactly nothing to the model.

### The player verbs that help and go unremembered — [missing]
- **What:** the thirty-four party verbs are all covered (see below), so the gap is
  everything OUTSIDE `partyActions`. These acts move `st.partyRel` (or nothing) and never
  touch the ledger the AI reads:
  - **Declaring FOR another party's bill on the floor.** `v17FloorCore` writes
    `b.playerPosition`/`b.lines[actor]` + `shiftPartyRel(±5/±4)` (`38319-38323`) and no
    memory. Its neighbour, `pressure`, writes `v16Resent(st, sp, actor, 10)` at `38332`.
    The only floor verb with a memory is the hostile one.
  - **Answering a `cross_party` paper "accept"** — `shiftPartyRel(+10)` only (`10112`).
  - **Answering a `coalition_demand` "accept"** — `shiftPartyRel(+13)` only (`10108`).
  - **Answering a `coalition_review` "formal"** — `shiftPartyRel(+14)` only (`10100`).
  - **Answering a `senate_conference` "attend"** — `shiftPartyRel(+12)` only (`10104`).
  - **Keeping a coalition concession.** `v17DealScan` books
    `v17Ledger(..., kind:'kept', cost:V17_KEPT)` and `+7` satisfaction and `+4` partyRel
    (`35710-35716`) and NO grudge reduction — while a BREACH four lines later writes
    `v16Resent(st, pid, actor, hit.cost + 1)` (`35723`).
  - **Passing a statute a party wants.** Nothing. `v9concede` (-12) exists as a verb, but
    simply carrying a bill at their preferred rung writes nothing.
  - **Giving a party an executive office** other than through `tradeMinistry` (-14).
  - **Un-banning / restoring a party.** `liftCordon` is -18; there is no matching un-ban.
- **Evidence:** `10099-10114`, `35710-35723`, `38319-38332`. Only `party_demand` among the
  papers writes memory (`10152-10164`: carry -18, talks -7, decline +5).
- **Why it matters:** the four papers the player answers most write to the channel that
  mean-reverts and decides almost nothing, and skip the channel that decides posture,
  attack targeting, pact refusal, coalition acceptance, investiture and rivalry.
- **Upgrade:** route every party-facing paper answer and every floor `support` through
  `v16Resent` with an authored weight, the way `party_demand` already is — one table, and
  a coverage assertion over the paper types the way `V17_MEMORY` covers the verbs.

### `defect` charges the party it enriches — [inconsistent]
- **What:** "Encourage defections" (`12819-12834`) takes `round(CFG.seats * .035)` seats
  from the LARGEST OTHER parties and gives them to `pid`, plus `+.05` machine. It sits in
  the `kind:'boost'` group beside `fund` (-14), `givepress` (-12), `drawseats` (-16) and
  `champion` (-12). Its weight is `defect: { self:18, seen:2 }` (`35961`) — the
  beneficiary resents the player 18 and the parties that LOST the seats resent 2.
- **Evidence:** `12819-12834`; `V17_MEMORY` `35961`. Probe `mem.js`: FP gained **46
  seats** and its grudge against LP went to **18**; RSF −1, SD −12, CUP −6, TVC −1,
  PNL −3 seats and **2** grudge each.
- **Why it matters:** the sign is backwards on both halves at once, and `18` is exactly
  the magnitude the negative cluster would have used with a minus in front
  (`invite` -16, `joinCoalition` -20).
- **Upgrade:** `defect: { self:-18, seen:6 }`, and add a SIGN check to
  `v17MemoryCoverage`: a verb whose `run` raises the target's seats, machine, press or
  purse and whose `self` is positive should redden.

### AI-to-AI memory has two writers and is empty 94% of the time — [shallow]
- **What:** in three megabytes only the `attack` card (`v16Resent(st, t, pid,
  V18_ATTACK_RESENT)` = 21, `34418-34420`) and `v17FloorCore`'s `pressure`
  (`v16Resent(st, sp, actor, 10)`, `38332`) write one engine's grudge against another,
  plus the coalition paths (`v17DealScan` +9/+12 at `35723`, `v17Walkout` +25 at `35778`,
  `leaveCoalition` +22 at `13256`) which are about the government. Nothing an AI does ever
  LOWERS another AI's grudge — the negative weights live only in the player's `doAction`
  wrapper.
- **Evidence:** all seven `v16Resent` call sites: `10155`, `10159`, `10163`, `10224`,
  `13256`, `34419`, `35723`, `35778`, `35998`, `36002`, `38332`. Traced over 360 sessions
  (`mem2.js`): attack 17, walkout 9, dealScan-AI 19, dealScan-player 6, expireInbox 81,
  dealScan-on-PLAYER'S-OWN-ROW 1, and **zero negative writes**.
- **Why it matters:** `aiAi` grudge over 21,600 pair-samples: mean **1.39**, p50 0, p90 0,
  p99 45.2, max 75.6. Six parties are strangers to each other 94% of the time, so the
  `oust` goal, the attack picker's ledger arm and `v16PactPartner`'s refusal are all
  reading an empty table. For an engine, a feud is a one-way ratchet plus time.

### AI-to-AI provocations are stamped and never read — [decorative]
- **What:** `v16Resent` stamps `a.provokedAt[against] = st.turn` for ANY writer with
  `n >= 10` (`34097-34100`), so an AI attacked by another AI (21) or walked out on (25) is
  stamped. `v19React` reads exactly one key: `var stamped = (a.provokedAt || {})[me]`
  where `me = playParty(st)` (`35887`, `35906`). Every AI-keyed stamp is dead.
- **Evidence:** `34097-34100` writer; `35906` sole reader. Probe `mem.js`: 169 stamps
  keyed on the player, **62 keyed on another AI party**, in 720 sessions.
- **Why it matters:** this is `st.court.size` in the AI layer — a field written in six
  places, read in one, and the one read covers a sixth of what is written. It also means
  an AI can never answer another AI at once, which is the whole point of S19f.
- **Upgrade:** loop `v19React` over every key of `provokedAt`, not just the player's, and
  let the answering party's rival be whoever provoked it (`35479` already builds exactly
  that object for the human).

### `oust` — the only goal that names an enemy — is unreachable by construction — [missing]
- **What:** `oust.fits` returns 1.4 when the party's WORST grudge against anybody is >= 25
  and it does not lead the government (`34764-34773`). `oust.target` returns the party
  with the worst grudge, **without asking whether that party is in government**
  (`34774-34782`). `oust.done` is `g.ref !== st.ruling && coalition.indexOf(g.ref) < 0`
  (`34783-34785`), and `v19AdoptGoal` DROPS any goal whose `done` is already true at
  adoption (`34955-34957`). So `oust` can only be adopted in the narrow case where the
  party you hate most happens to be in the government this session.
- **Evidence:** `34760-34794`, `34955-34957`; sole `v19Goal` caller at `35467`, inside
  `v16AiTurn`'s acting branch (returns early at `35426` for the player and `35451` for a
  party not acting). Probe `mem.js` over 4,320 party-sessions: `fits` held **825** times,
  the worst-grudge target was in government only **211** times (25.6% of those), and
  `oust` was actually held **4** times. The baseline's 0 in 720 sessions is the same
  answer.
- **Why it matters:** three functions on one card disagree about what the goal is for, and
  the disagreement silently deletes 614 of 825 opportunities. `oust` is also what feeds
  the `theirs.kind === 'oust'` clause at `35071`, so its absence removes the only
  asymmetric rivalry clause the engines have.
- **Upgrade:** `oust.target` should pick the worst grudge **among parties in government**;
  the goal should survive its target leaving office for a session or two rather than
  completing the instant they fall.

### The rivalry layer decides nothing at the shipped default level, and the panel prints it anyway — [inconsistent]
- **What:** `V19_DEFAULT_LEVEL = 'purposeful'` (`441`) and `purposeful` carries
  `read: 0` (`434`). `v19Score` gates the whole rivalry term on `read > 0` (`35315-35320`)
  and the attack picker scales its push by `read` (`34392`). But `v16AiTurn` calls
  `v19Rival` unconditionally at `35478` and writes `a.why.foe = rival.foe` (`35524`), and
  `v16AiPanel` prints "with the &lt;X&gt; in the way" from it at `36190-36194` with **no
  level gate** — while the temperament sentence on the same row IS gated
  (`v19Thinks(S) && ...`, `36173`).
- **Evidence:** `431-441`, `34392`, `35315-35320`, `35478-35479`, `35524`, `36173`,
  `36190-36194`. Probe `mem3.js` (5) at `purposeful`: `v19LevelOf(S).read = 0`,
  `v19Rival(S,'fp')` returns `{ foe:'lp', foeAt:0.45 }`, and `v19Score` for `attack` is
  **0.71 with the foe and 0.71 without it**.
- **Why it matters:** most players will never change the AI setting. On the default the
  page states a reason the model did not use — the exact "card that lies" the comment at
  `36186-36189` was written to avoid, caught for the null case and missed for the level.
- **Upgrade:** gate the foe sentence on `v19LevelOf(S).read > 0` beside the temper
  sentence, or (better) buy a small `read` at `purposeful` and re-measure.

### No alliance, pact or past cooperation is remembered in any form — [missing]
- **What:** S19b measured out the ALLY half of `v19Rivalry` deliberately (the note at
  `35114-35122`: 25,200 party pairs, zero alignments), so `v19Rival` returns
  `{foe, foeAt}` and there is no `friend` weight in `V19_RIVAL_WORTH` (`35169-35181`).
  The AI `pact` card writes `st.aiPacts[pid] = { with:o, since:st.turn }` (`34459-34460`)
  and `shiftPartyRel(-2)`; it writes NO memory in either direction, and the pact is
  deleted wholesale at the next ballot (`12005-12007`). `st.aiPacts` is read by exactly
  two things: `ballot`'s vote pooling (`35544-35550`) and `v16PactPartner`'s
  already-in-a-pact refusal (`34609`) — no panel renders it.
  A partner spell of 103 consecutive sessions (baseline) leaves nothing behind at all:
  `st.coalitionDeals[pid]` keeps a ledger of KEPT and BROKEN promises (`35596-35603`), and
  `v16Resent` is called for the broken ones only (`35723`).
- **Evidence:** `12005-12007`, `34459-34460`, `34609`, `35114-35122`, `35169-35181`,
  `35544-35550`, `35710-35723`.
- **Why it matters:** the state has no way to represent "these two have worked together
  for thirty years". Every coalition is negotiated from the same static tables every time.
- **Upgrade:** a symmetric positive ledger — or, cheaper and in this file's idiom, let
  `v16Resent` go NEGATIVE below nought with a floor of −100 and rename the reader, so one
  number carries both directions and every existing consumer gets the positive half free.

### `v17Friction` — the terms of every coalition offer — reads no history at all — [shallow]
- **What:** `v17Friction(st, a, b)` (`35625-35634`) compares two parties' authored
  `PARTY[x].wants` tables and nothing else. `v17Offer` builds concessions from
  `pv5TopWants(pid, st, 4)` and one red line from `wants[2]` (`37430-37448`). Neither
  reads the grudge, the ledger, the number of past coalitions, or what was broken last
  time.
- **Evidence:** `35625-35634`, `37430-37448`. `v17Accept` is the only formation function
  that reads memory at all — `grudge * .32` at `37457`/`37459`.
- **Why it matters:** this is why the baseline sees exactly 3.00 concessions and exactly
  1.00 red line on every offer. Two parties that have fought a war of attrition for eighty
  sessions negotiate identically to two that have never met.

### Two relationship channels that never talk to each other — [inconsistent]
- **What:** `st.partyRel[pid]` is ONE number per party — implicitly the player's — moved
  by `shiftPartyRel` (`8748-8751`) at 2,164 calls a run, and MEAN-REVERTED toward 62 (in
  coalition) / 46 (out) at 6% a session in `politicsTick` (`10240-10242`), a half-life of
  about eleven sessions. The grudge is the other channel and reverts to nothing. Nothing
  reads across: `v16Resent` never touches `partyRel`, and no grudge reader consults
  `partyRel` except `v17Accept`, and only for the pair the player is in (`37476-37479`).
- **Evidence:** `8748-8751`, `10240-10242`, `37476-37479`; `partyRel` readers at `9032`,
  `9444`, `9841`, `10173`, `10269-10270`, `11195`, `14301`, `15064`, `16082`, `16212`,
  `17615`, `19146`, `19418`, `19794`, `20836`, `22202`, `31386` — almost all UI and event
  conditions.
- **Why it matters:** the player is shown a precise number for the channel that forgets in
  a fortnight and decides almost nothing, and three words for the channel that decides
  everything.

### Memory is visible as three words, player-facing only — [shallow]
- **What:** the only readout of the grudge anywhere in 3.7 MB is one cell in
  `v16AiPanel`: `g >= 35 ? 'They have not forgotten' : g >= 12 ? 'A grievance on file' :
  'Nothing on file'` (`36168`), where `g = a.grudge[me]` (`36125`) — the player only. The
  Parties dossier prints "Working relationship N" from `partyRel` (`15064`) and no grudge.
  Nothing anywhere shows one AI party's grudge against another, or an AI-AI pact, or the
  coalition ledger's kept/broken counts outside the coalition card.
- **Evidence:** `15064`, `36125`, `36168`, `36198`.
- **Why it matters:** with `atAttackBar` at 463 of 4,320 party-sessions (10.7%), roughly
  one party in nine is at or past the attack bar against a player who has done nothing,
  and the page's account of that is three words with no number and no cause.
- **Upgrade:** print the number and the last thing that moved it — the data is already in
  `a.provokedAt` and could carry the verb id at no cost.

### The player's reputation is mostly unanswered mail — [exploitable]
- **What:** with a PASSIVE player, the grudge against them over 4,320 party-sessions runs
  mean **13.8**, p50 5.6, p90 **37.2** (above the 35 attack bar, `34138`), p99 **97**, max
  **100 (the clamp)**, with 8 party-sessions pinned at the clamp. Almost all of it is
  `expireInbox`'s +14 (81 of 128 traced writes).
- **Evidence:** `10224`; probe `mem.js` `vsPlayer` block; trace `mem2.js`.
- **Why it matters:** the AI's model of the human is dominated by inbox neglect rather
  than by anything done to a party — and, per the ordering finding above, the one writer
  that dominates it is the one the reaction layer cannot see. Read the other way it is an
  exploit: a player who clears the inbox every session is invisible to the opponent model
  no matter what else they do, because 63% of the signal comes from letters.
- **Upgrade:** weight the ignored letter well below a deliberate verb (the median
  deliberate provocation is 13.4 per the note at `35874-35876`; an ignored letter is 14 —
  they are the SAME), and let it stamp a session the reaction can reach.

### A grudge, once high, effectively never comes down on its own — [works, but one-directional]
- **What:** decay is a bare `g[k] = Math.max(0, g[k] - .6)` with a delete below .05
  (`35531`), an unnamed literal inside `v16AiTurn`. Linear, so 100 → 0 takes **167
  sessions**; an `epic` campaign is 200 years / ~201 turns (`17363`, and MAP.md's "an
  epic's 201 turns"). The only faster route down is a player verb with a negative
  `V17_MEMORY` weight.
- **Evidence:** `35528-35533`, `17360-17363`. Probe `mem.js` `decayOnly`: a grudge planted
  at 100 reads 94, 88, 82, 76, 70, 64 at ten-session intervals — exactly 0.6 a session.
  `fellFromHigh` = **0**: in 720 sessions no grudge that reached 50 ever returned to
  nought.
- **Why it matters:** the code's own note (`34081-34086`) records the owner's save with
  `poach` used 411 times and "every opposition machine at the clamp". Against an active
  player the ledger saturates and stays saturated, at which point `v16Posture`'s 35 bar,
  `v18Restive`'s 55 bar and `v18Tempo`'s 35 step are all permanently ON and none of them
  can distinguish anything.

### Forgiveness exists, is a purchase, and only the player can make it — [shallow]
- **What:** the twelve negative `V17_MEMORY` weights are the whole of it. Every party verb
  is stamped `scope`/`pay`/`purse:'party'` and paced by `v20PaceParty` at `13305-13308` —
  `cool = 2 + floor(cost/4)`, `esc = 1.10 + cost/100` — so `fund` (cost 6, money 10) rests
  3 sessions and escalates 16% compounding per use on that target (`actionKey` is
  `party:<pid>:<id>`, `13326`). Taking a grudge of 100 to 0 is 8 uses of `fund`: ≥ 24
  sessions, ~86 capital and ~143 party money, and it hands the target `+.16` machine each
  time. No AI party has any equivalent: nothing an engine does lowers anybody's grudge.
- **Evidence:** `12797-12800`, `13305-13308`, `13318-13323`, `13326`, `13337-13347`,
  `35975-35986`.
- **Why it matters:** it is a real, priced door — and it is the ONLY one. There is no
  apology, no reparation, no time-served, no leadership change that resets anything
  (memory is per-PARTY, never per-person; a party that replaces the leader you blackmailed
  carries the same grudge, since `v16Resent` keys on party id alone).

### The player's own hidden grudge row is written and read — [inconsistent]
- **What:** `v16Ai` creates a row for EVERY party including the player (`34063-34064`).
  `v17DealEvent` iterates the coalition, which includes the player as a junior partner
  (`35657-35664`), so `v17DealScan` can call `v16Resent(st, <player>, actor, hit.cost+1)`
  at `35723`. That row is then read by `v17Accept` (`v17GrudgeOf(st, pid, lead)` at
  `37457`, `-grudge * .32` at `37459`) and by `v17Invest` for every party including the
  player (`37571-37572`, nay if `g >= 30`). The player can neither see it nor set it, and
  `v16AiPanel` filters their own party out (`36124`).
- **Evidence:** `34063-34064`, `35657-35664`, `35723`, `37457-37459`, `37571-37572`,
  `36124`. Trace `mem2.js`: **1** write onto the player's own row in 360 passive sessions.
  Probe `mem3.js` (4): `v17Accept` value **52** clean against **33** with a grudge of 60 —
  the term is live.
- **Why it matters:** a hidden number nobody told the player about can reduce what their
  own party will accept at a formation by 19 points.

### The one-ply objective reads no memory at all — [shallow]
- **What:** `v19Standing` (`35250-35262`) sums `v17Utility` + seat share + machine + purse
  + 18 for ruling + 9 for coalition + 9 per office. It does not read the grudge, the
  rivalry, `partyRel` or the coalition ledger. `v19Outcome` (`35264-35279`) is one call to
  `card.run` on a clone and a difference of that number.
- **Evidence:** `35250-35279`; `V19_LEVELS` `sim` at `436-438`.
- **Why it matters:** the deepest thing the engine does — a `±1.9` term at `ruthless` —
  cannot value making an enemy or spending a grudge down. An `attack` that pins a party at
  the clamp and a `fund` that clears one score identically on the relationship axis,
  because that axis is not in the function.

### `V17_MEMORY` coverage is asserted one way only — [works, with a hole]
- **What:** `v17MemoryCoverage(pid)` walks `partyActions(pid)` and reports verbs with no
  weight (`38549-38561`); `roads.js` asserts `missing.length === 0` at `6687`. Nothing
  asserts the REVERSE (a weight naming a verb that does not exist — the `radicalise`
  defect) or the SIGN.
- **Evidence:** `38549-38561`; `tools/roads.js:6575-6600`, `6686-6697`. Probe `mem3.js`
  (3): today it is exact both ways — 34 verbs, 34 weights, `orphanWeights: []`. The
  harness's kindness arm uses `poach` (+12) then `fund` (-14) and asserts the result is 0
  (`roads.js:6600-6606`) — it never asks what a kindness does to a party at 0.
- **Upgrade:** add the reverse arm and a sign arm; both are cheap and both are the guard
  CLAUDE.md says a hand-kept list can never have.

### An ignored letter that overflows the inbox costs nothing — [exploitable, unmeasured]
- **What:** `addInbox` shifts the oldest paper out when the inbox exceeds 6, stamping
  `outcome = 'lapsed'` and archiving it directly (`9922-9924`) — bypassing `expireInbox`
  entirely, so no `v16Resent`. `politicsTick` gates its own producers on
  `st.inbox.length >= 4` (`10261`) but the AI `demand` card calls `addInbox` with no such
  gate (`34581`).
- **Evidence:** `9917-9925`, `10261`, `34581`. Probe `mem.js`: **0** party demands lapsed
  by overflow in 720 passive sessions against 168 that expired — so it is reachable in
  principle and did not fire in my run.
- **Why it matters:** two exits from the inbox, one of which books the memory and one of
  which does not. CLAUDE.md's "two clocks for one fact" again.

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `st.ai[pid].grudge[against]` | `v16Resent` `34076` only; callers `10155` (-18), `10159` (-7), `10163` (+5), `10224` (+14), `13256` (+22), `34419` (+21), `35723` (+cost), `35778` (+25), `35998` (`m.self`), `36002` (`m.seen`), `38332` (+10); decayed `35531` | `v16Grudge` `34071`; `v18Restive` `34114`; `v16Posture` `34138`; attack picker `34395`; `v16PactPartner` `34610`; `oust` fits/target/dead `34769`/`34778`/`34787`; `v19Rivalry` `35092`; `v18Tempo` `35387`; `v16AiPanel` `36125`; `v17GrudgeOf` `37420` → `v17Accept` `37457`, `v17Build` `37506-37507`, `v17Invest` `37571`; `partyBillSupport` `9074`; `v11ArtSupport` `31398` |
| `st.ai[pid].provokedAt[against]` | `v16Resent` `34098-34099`, any `n >= 10` | `v19React` `35906` — **and only the `playParty` key**. AI-keyed entries: 62 written, 0 read in 720 sessions |
| `st.ai[pid].react` | `v19React` `35910` | `v16AiTurn` `35450` (`=== st.turn`) |
| `st.ai[pid].reactedAt` | `v19React` `35909` | `v19React` `35907` (the 8-session cooldown) |
| `st.ai[pid].goal` | `v19AdoptGoal` `34972`; cleared `34935` | `v19Goal` `34905`; `v19GoalSeen` `35011` → `v19Rivalry` `35067`; `v19GoalSay` `34977`; `v19GoalProgress` `34983`. **Never written for the player** — `v16AiTurn` returns at `35426` before the sole `v19Goal` call at `35467` |
| `st.ai[pid].why.foe` | `v16AiTurn` `35524` | `v16AiPanel` `36190-36194` — rendered at every level, including `purposeful` where `read = 0` |
| `st.ai[pid].lastGoal` | `v19Goal` `34932-34934` | `v16AiPanel` `36153-36164` |
| `st.ai[pid].owed` | `v16AiTurn` `35515` | `v16AiTurn` `35489` |
| `st.partyRel[pid]` | `shiftPartyRel` `8750`; `politicsTick` mean-revert `10242`; `35713`, `35722`, `35777`, `35826`; `10459`, `10462`; `16314`; `36535` | 17 sites, almost all UI/event conditions (`9032`, `9444`, `9841`, `10173`, `10269`, `11195`, `14301`, `15064`, `16082`, `16212`, `17615`, `19146`, `19418`, `19794`, `20836`, `22202`, `31386`); the only AI-decision reader is `v17Accept` `37478`, and only for the pair the player is in |
| `st.aiPacts[pid]` | AI `pact` card `34459-34460`; cleared at the ballot `12005-12007` | `ballot` `35544-35550`; `v16PactPartner` `34609`. **No renderer** — `grep -n 'aiPacts' vale.html` returns 8 lines, none in a view |
| `st.coalitionDeals[pid].ledger` | `v17Ledger` `35600` (`kept` `35711`, `broken` `35705`/`35720`) | `v17Broken` `35604`, `v17Kept`, `v17Walkout` `35773`, the coalition card. **The `kept` entries reach no memory** |
| `V17_MEMORY` | authored `35945-35987` | `doAction` wrapper `35990`, `35998`, `36002`; `v17MemoryCoverage` `38558` |
| `a.pid` (action target) | `partyActions` wrapper `23939` | `doAction` memory wrapper `35990` |
| gratitude / favour / goodwill / trust on the ai object | **NONE** | **NONE FOUND** — `grep -oic 'gratitude\|grateful\|favour\|owed\|debt\|ally\|alliance\|trust\|goodwill\|forgive\|reconcile\|apolog' vale.html` returns hits only in prose (`8040`, `12241`, `16623`, `16873`, `18584`, `20098`, `27322`, `1122`, `2000`, `3020`, `9857`, `14506`, `23817`, `26081-26082`, `26476`, `29229`, `29233`) and in `a.owed`, which is an initiative debt (`35489`/`35515`), not a favour |

## What I could not verify

- **Two negative `v16Resent` calls I could not attribute.** The 6-seed run counted 2 writes
  with `n < 0` (both an AI's grudge against the player falling). My 3-seed stack trace
  covered seeds 1-3 and found none, so they came from seeds 4-6 and I did not re-trace
  them. The only negative sites in the file are `10155` (-18), `10159` (-7) and the
  `doAction` wrapper's negative weights — none of which a passive driver should reach.
  Worth one more traced run before anybody relies on "zero negative writes".
- **`v17Invest`'s grudge arm firing for the player.** `mem3.js` (4) put a grudge of 60 on
  the player's own row and the nay total did not move (842 both ways) because the
  `d > .62` distance arm had already claimed those seats on that board. The term is in the
  code at `37571-37572`; I did not construct a board where it is the deciding clause.
- **How often the inbox-overflow lapse fires in real play.** 0 in 720 passive sessions.
  A player who lets papers pile up while the AI `demand` card posts past the `>= 4` gate
  could reach it; I did not drive that.
- **Whether the ordering fix would perturb the S18/S19 arms.** Moving `v19React` after
  `politicsTick` changes when a party acts, which S20e's note says re-phases campaigns. I
  measured the defect, not the cost of fixing it.
- **`a.provokedAt` is never pruned.** It accumulates one key per provoker for the life of
  a campaign. Harmless at six parties; I did not check any save-size or migration effect.
- **`reactSeen: 0` in `mem2.js`** is consistent with the ordering finding (the only
  in-time writers need the player to act, and the 6 player-directed breaches were +9,
  below the bar of 10) — but it is a null result, and a null result from a passive driver
  is weaker evidence than the direct `mem3.js` arm, which is what I am relying on.
