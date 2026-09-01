# executive-elections

## What it does today

An engine contests a great office by paying `V17_AI_OFFICE_SPEND` (26) once per
office per cycle into `st.execPush`, worth a flat `.12` (or `.2` if the office
is the one its `office` goal named) against a per-contest random multiplier of
`.78 + rand()*.44`; `execContest` then runs a ranked-choice count over national
support and seats whoever wins. Every party fields four candidates, one per
caucus, but the general reads only `competence` off the winner — measured, the
whole person is worth 0.97–1.08 where the die is worth 0.78–1.22. Once an
engine holds an office the only thing it can do with it is sign the first
executive order in `V10_ORDERS` whose department it holds (232 fires in 720
sessions, every regional one aimed at `REGIONS[0]`), and refuse assent to other
parties' bills on a test that reads *the player's* relationship with the office
holder. Approaching a ballot the only thing that changes anywhere in the engine
is that one card unlocks; no engine targets a seat, a region or a rival, no
engine can call, force or threaten an election, and nothing in three megabytes
reacts to a party winning or losing one.

**All figures below marked "measured" are from my own six-seed × 120-session run
at `aiLevel: ruthless`, `normal`/`epic`, with the `runQueue` override CLAUDE.md
requires. It reproduces the S21 baseline exactly — 360 elections / 9 government
changes, 180 exec contests / 46 office changes — so the driver is the same
driver.** Probes, re-runnable:
`/tmp/claude-0/-home-user-Vale/d0d4e871-ec53-5cf7-8cdf-8c9315947924/scratchpad/probe.js`
and `.../scratchpad/probe2.js`.

---

## Findings

### Part A — the executive

### The contest is a die with a party name on it — [shallow]

- **What:** `execContest` builds each party's number as
  `v = share * (1 + execPushOn(...))`, then `v *= .78 + rand()*.44`, then
  `v *= execPersonFactor(...)`, then `rcvWinner`. The noise term spans 44
  points. The engine's whole contested effort — 26 money — buys `.12`. The
  person, for any party that does not already hold the office, is
  `1 + (competence-55)/400` and nothing else: `execPersonFactor`'s incumbency
  branch is gated on `sit.party === pid`, so six of seven parties get only the
  competence line.
- **Evidence:** `execContest` at 11858, the three multipliers at 11881–11883;
  `rcvWinner` at 11887; `execPushOn` at 7267; `execPersonFactor` at 7246, the
  incumbent gate at 7248, the challenger's only live term at 7258, the clamp at
  7262. `V17_AI_OFFICE_SPEND = 26` at 37836; the push written at 38062;
  `V20_AIM_PUSH = .2` at 34275.
- **Measured:** across 24 real challenger nominations at session 40,
  `execPersonFactor` ranged **0.97 to 1.0775** — a 10.5-point spread against the
  die's 44. The die is worth roughly four times the candidate. 939 AI spends
  totalling 24,414 money across 720 sessions, so the engine *is* paying; it is
  paying for one twelfth of the variance.
- **Why it matters:** the executive season is the most elaborately authored
  thing in this file — four caucuses, primaries, an open/closed nomination rule,
  polls that promise to be the number the country will produce — and the vote it
  feeds is decided by a coin. A player who works the season and a player who
  ignores it are separated by less than one draw of `rand()`.
- **Upgrade:** cut the noise band to something like `.94 + rand()*.12` and give
  the person real weight: read `standing`, `exposure`, `trait` and the caucus's
  strength at the general the way `v17PrimaryScore` reads them at the primary.
  Make the AI's spend scale with the purse rather than being a flat 26/.12, so a
  rich party can actually buy a race and a poor one visibly cannot.

### The membership's choice is thrown away at the general — [inconsistent]

- **What:** `v17Field` draws each runner a `standing` (40–80) once, at seed time,
  and `v17PrimaryScore` weights it at `.55` — it is most of what decides the
  primary. `execPersonFactor`, which decides the general, never reads
  `standing`; nor does `v17RacePolls`, which is documented as reading "the same
  three terms the vote itself reads".
- **Evidence:** `v17Field` at 37849, `standing:` at 37866; `v17PrimaryScore` at
  37875–37882; `execPersonFactor` at 7246–7263 (no `standing`);
  `v17RacePolls` at 38002–38014.
- **Why it matters:** a party's membership can elect a hugely popular outsider
  and the country will not notice. The one number the primary is *about* stops
  at the primary's door, which is `st.court.size` in a different coat — written
  by one stage, read by nothing downstream.
- **Upgrade:** let `execPersonFactor` read `winnerOf.standing`, and let a
  candidate who won an open primary carry a small mandate term the leadership's
  pick does not.

### An engine never contests an office against a named rival — [missing]

- **What:** `v17AiRaceSpend` reads exactly four things: the purse, `v20Aim(pid,
  'office')`, `v17RacePolls`, and `st.exec[o]`. It never reads `v19Rival`,
  `v19Rivalry`, or `v16Grudge`. There is no exec card in `V16_AI_DECK`, so the
  race is outside the only place a rival is ever consulted.
- **Evidence:** `v17AiRaceSpend` at 38037–38066 — every read is at 38045, 38056,
  38058, 38059. `v19Rival` at 35150 and `V19_RIVAL_WORTH` at 35169 have no exec
  entry because no card reaches the exec. The rivalry model *does* know about
  offices — `v19Rivalry` at 35109 and 35127 both compare `office` aims — so the
  fact is computed and then has nowhere to go.
- **Why it matters:** the opponent model can say "the FP hold the office I want
  and that makes them my enemy", and the only thing that sentence can produce is
  a slightly higher score for the `attack` card, which moves `st.machine`. No
  party has ever spent a shilling to beat a *particular* opponent in a
  *particular* race.
- **Upgrade:** give `v17AiRaceSpend` a rival term: a party spends more, and
  earlier, on an office held by the party its rivalry read names, and it should
  be willing to spend where it is behind if the holder is the foe.

### Half of every office aim points at an office nobody is contesting — [shallow]

- **What:** the `office` goal's `target` picks uniformly at random from the
  offices the party does not hold — four of them. `execPair` contests two per
  cycle. `v17AiRaceSpend` only recognises an aim when it matches an office in
  `r.offices`.
- **Evidence:** `office.target` at 34734–34739, the uniform draw at 34738;
  `execPair` at 10632 (wrapped at 38089); `wants` at 38058 tested against `o`
  from `r.offices`.
- **Measured:** **147 of 292** live `office` aims named an office in the pair
  actually being contested — 50.3%, the coin flip the code predicts.
- **Why it matters:** half of all office ambitions are unreachable for at least
  four sessions and get the `.12` poll-floor treatment instead of the `.2` aim
  push. The S20g comment at 34199 fixed "worse than random"; this leaves it at
  "random half the time".
- **Upgrade:** `target` should pick from `execPair(v17NextExecTurn(st))` first
  and fall back to the other two only when both are already held.

### The `office` goal measures its progress with a number the race cannot move — [inconsistent]

- **What:** `office.progress` is `clamp(v17Share(st, pid) * 2, 0, .95)` — the
  party's seat share. `office.done` is `st.exec[g.ref] === pid`. The stall clock
  in `v19Goal` retires an aim when `progress` stops rising. So a party that
  spends its whole purse on the race it named makes no progress by the clock's
  measure, and a party that ignores the race but gains a seat resets it.
- **Evidence:** `progress` at 34742; `done` at 34740; the idle clock at
  34925–34928 (`V19_GOAL_IDLE = 11` at 34898).
- **Why it matters:** the baseline records 398 `office` holdings and 86% of all
  aims abandoned. This is one concrete reason: the aim's own progress meter is
  wired to a different mechanism from its completion test.
- **Upgrade:** `progress` should read the race — `v17RacePolls(st, g.ref)[pid]`
  normalised against the leader, falling back to share when no season is open.

### What an engine actually does with an office: one order, always the first in the list, always in the same region — [shallow]

- **What:** `v17AiOrderFor` walks `V10_ORDERS` and returns the **first** order
  whose department the party holds and whose `v10OrderOpen` returns null. If the
  order takes a region it hard-codes `REGIONS[0].id`. `if (best) return;` at
  38406 short-circuits the rest of the book.
- **Evidence:** `v17AiOrderFor` at 38403–38412; the short-circuit at 38406; the
  office test at 38407; `REGIONS[0].id` at 38409. Called from the deck's `order`
  card at 34489–34494.
- **Measured:** 232 order fires in 720 sessions, spread across 17 distinct
  orders — and **all 39 regional orders went to `somnium`**, which is
  `REGIONS[0]`.
- **Why it matters:** the office's one active verb is a list-order artefact. A
  party never chooses *which* order serves its aim, and the federation never
  sees an engine act anywhere but the first region on the page.
- **Upgrade:** score the open orders against the party's `wants`/`aff` and
  against `v19Standing`, and pick the region the same way the `court` card picks
  a bloc.

### An office held outside the government does nothing at all — [inconsistent]

- **What:** `v10OrderOpen` refuses flatly before it ever looks at the department:
  `if (!inGov) return 'Only a government issues orders.'`. `figureEffects`
  applies the holder's trait effects only when the holder's party is in the
  coalition. So an opposition-held great office has exactly one live power — the
  assent signature — and zero effect on the country.
- **Evidence:** `v10OrderOpen` at 28701, the `inGov` refusal at 28704, the
  department test at 28718; `figureEffects` at 7355–7362, the coalition gate at
  7357.
- **Measured:** 2,801 of 2,838 non-player office-sessions (**98.7%**) were held
  by a party sitting in the government. So the case is rare — but that is the
  finding: the 25.6% office turnover is almost entirely reshuffling inside a
  stable government, not the opposition taking a lever off it.
- **Why it matters:** "the executive turns over, the offices do nothing" in the
  baseline is precisely this. Winning an office off the government is supposed to
  be the opposition's prize; it buys them a veto and nothing else, and they get
  it 1.3% of the time.
- **Upgrade:** give an opposition-held office a real standing power (an order
  category it may sign in its own right, an inquiry, a refusal to countersign)
  so `st.exec` is worth contesting from outside.

### An asymmetric order gate: the player's coalition signs, an engine's does not — [inconsistent]

- **What:** `v10OrderOpen`'s department test is
  `st.exec[o.dept] !== actor && !(actor === playParty(st) && holdsDept(st, o.dept))`.
  The relaxation — "anybody in my coalition holds it, so I may sign" — is
  available only when `actor === playParty(st)`. An engine partner in the same
  government, holding no office itself, is refused.
- **Evidence:** the gate at 28718; `holdsDept` at 10719 (asks about the whole
  coalition); `officeMine` at 11010 (the player's own side of it).
- **Why it matters:** S17k's own comment says the gate exists so "the same line
  answers for both". It does not: it answers one way for the player and a
  narrower way for every engine.
- **Upgrade:** make the relaxation symmetric, or delete it and make the player
  hold the department too. One predicate, both chairs.

### The assent stage is arbitrated by a number about the player, and it refuses 88% of everything — [exploitable]

- **What:** every bill whose statute has a `dept` goes to the party holding that
  office. `assentFavour`'s "line" term is
  `st.partyRel[who]` — the **player's** relationship with the holding party —
  even when the sponsor and the holder are both engines and the player is
  nowhere near it. With a passive player, `partyRel` sits low (baseline median
  33.5) and the office refuses.
- **Evidence:** `assentOffice` at 9425; `assentFavour` at 9440, the `partyRel`
  read at 9444, the coalition bump at 9445; `assentResolve` at 9498, the sign bar
  at 9503, the return bar at 9509, the refusal at 9520, death on the desk at
  9529. `shiftPartyRel` at 8748 confirms `st.partyRel` is a single vector keyed
  by party — the player's.
- **Measured:** 768 assent decisions across 720 sessions, **every one of them an
  engine sponsor into an engine-held office**. 677 refused (88.2%), 41 returned,
  50 signed. The player never once appeared on either side of the transaction
  whose outcome their own relationship number decided.
- **Why it matters:** this is a borrowed-field defect of the S16e `faction:0`
  family. Engine legislation is being killed at a rate of nine in ten by a
  number that is about somebody else, and the player can move it — a few
  `shiftPartyRel` calls and an engine's whole legislative programme starts
  passing or stops. That is the definition of exploitable, and it is invisible.
- **Upgrade:** `assentFavour` needs the relationship between the **sponsor** and
  the **holder**. `partyRel` cannot answer that (it is one vector); `v16Grudge`
  can, and is already symmetric-ish and already read by four other systems. Read
  the player's `partyRel` only when the player is the sponsor.

### Losing an office costs a party nothing and is remembered by nobody — [missing]

- **What:** `execContest` writes `st.exec[office] = w`, seats the winner, and
  calls `execRemember` on the **winner's** runners-up only (ministers lose
  loyalty, governors lose standing). The losing party gets no grudge, no posture
  change, no goal, no log line of its own.
- **Evidence:** `execContest` at 11889–11891; `execRemember` at 7331–7343. The
  grep that settles it: `grep -n "v16Resent(" vale.html` returns 10155, 10159,
  10163, 10224, 13256, 34419, 35723, 35778, 35998, 36002, 38332 — **none in
  `execContest`, `execSeat`, `v17RaceTick` or anywhere in the exec chain**.
  `v16Posture` at 34116–34142 reads seats, coalition, grudge and purse; it never
  reads `st.exec`.
- **Why it matters:** a party can spend 26 money and a whole season on a race,
  lose it to the die, and behave the next session exactly as if the race had not
  happened. There is no rivalry, no rematch, no consequence — which is most of
  why the executive season reads as scenery.
- **Upgrade:** `v16Resent(st, loser, winner, n)` scaled by how much the loser
  spent; a party that loses an office it held should get a posture and a rival,
  and a party that has just lost the office it aimed at should be able to adopt
  `oust` against the winner.

### A party's nomination rule is a constant it cannot change — [shallow]

- **What:** `v17PrimariesOn` reads `st.partyRules[pid].primaries`, seeded once
  from `PARTY[pid].home.a < .15` and never written again for an engine —
  `v17SetPrimaries` refuses any pid but the player's.
- **Evidence:** `v17PrimariesOn` at 36057; `v17PartyRules` at 36047;
  `v17PrimaryDefault` at 36044; the refusal at 36084.
- **Why it matters:** a whole authored rule ("ruling 5") is a player-only toggle.
  A party that keeps losing primaries to an outsider never closes its
  nominations; a party of the centre never opens them.
- **Upgrade:** let an engine flip its own rule at the one legal moment
  (`v17CanSetPrimaries` returns null) when its last primary produced an outsider
  or when it lost the office.

### `v19Standing` pays +9 for an office and the term can never move — [decorative]

- **What:** `v19Standing` adds 9 per exec office held, and `v19Outcome` reads it
  as a *difference* before and after running a card. No card in `V16_AI_DECK`
  writes `st.exec`, so the term is identical on both sides and cancels.
- **Evidence:** `v19Standing` at 35250, the office term at 35261;
  `v19Outcome`'s difference at 35267–35271. The exec spend is not a card — it
  runs in `v17RaceTick` at 38079, outside the deck.
- **Why it matters:** the one place the model says an office is worth something
  is the one place it cannot be felt. A party's simulation cannot tell that
  anything it does helps it win an office, because nothing it does does.
- **Upgrade:** either add an `exec` card to the deck (so the spend is scored like
  everything else) or have `v19Score` read the aim's office race directly.

---

### Part B — the ballot

### Nothing changes near a ballot except that one card unlocks — [missing]

- **What:** the `campaign` card's `can` is the only place in the engine that
  reads the distance to a ballot. `V18_TEMPO` has no ballot term and its own
  comment records that one was written and removed for being undifferentiating.
  `v16Posture` reads seats, coalition, grudge, trend and purse — never the
  calendar. `V17_BURN` is keyed on posture, so a party does not save for a
  campaign either. No goal, no rivalry read, no purse rule and no card target
  changes in the four sessions before a count.
- **Evidence:** `campaign.can` at 34337 (`pv5SessionsToBallot(st) <= 4`);
  `pv5SessionsToBallot` at 16319; `V18_TEMPO` at 35367 with the removed-term
  comment at 35368–35373; `v18Tempo` at 35381–35395; `v16Posture` at
  34116–34142; `V17_BURN` read at 16371.
- **Why it matters:** an election is the one moment the whole game points at, and
  from the engine's side it is a Tuesday with one extra card in the hand.
- **Upgrade:** a ballot term that *can* tell two parties apart — a party behind
  in `projection()` acts more, a party defending a majority spends its purse
  down, a party that cannot reach a threshold looks for a pact.

### The campaign card is untargeted, and it evaporates — [shallow]

- **What:** `campaign.run` calls `partySpend(st, pid, 40)` and increments
  `v16Ai(st)[pid].spent`. That is the entire body. `partySpend` writes
  `st.funding[pid] += 40*.002 = .08`, clamped to .35. `endTurn` decays
  `st.funding` by `×.6` — and it does so *after* `tickTurn`, which is where the
  AI plays, so a card played in the session before a ballot is worth `.048` at
  the count and is deleted (`< .02`) two sessions later. `.spent` is read only by
  the Parties panel's display column.
- **Evidence:** the card at 34336–34342; `partySpend` at 16488–16494 with the
  `.002` at 16493; the decay at 13484; `tickTurn(S)` at 13481 and `v16AiTurn`
  inside it at 35927; `st.funding` read at 11516 and by nothing else that
  matters; `.spent` read at 36129 only.
- **Measured:** 296 campaign plays across 720 sessions. `st.funding` mean `.053`
  across 5,040 party-sessions — but most of that is `partyPurseTick`'s automatic
  burn at 16373, not the card.
- **Why it matters:** the card the deck holds *for elections* buys a 4.8%
  national multiplier for one count, aimed at no bloc, no region, no seat and no
  opponent, for a quarter of a rich party's purse.
- **Upgrade:** give `campaign.run` a target — a region (`regionPartyFactor` is
  already a live channel), a bloc, or the rival `v19Rival` already named — and
  let the money persist as something the player can see and answer.

### The rivalry model lifts the campaign card and the campaign card cannot see a rival — [inconsistent]

- **What:** `V19_RIVAL_WORTH.campaign = .30`, so a party with a named foe scores
  `campaign` higher and plays it more often *because of that foe*. The card's
  body never reads the foe. The same is true of `organise` (.45) and `court`
  (.45): only `attack` (.85) actually points at anybody.
- **Evidence:** `V19_RIVAL_WORTH` at 35169–35181; the score term at 35315–35320;
  `campaign.run` at 34338–34342, `organise.run` at 34331–34335,
  `court.run` at 34345–34360, `attack.run`'s target picker at 34391–34402.
- **Why it matters:** three of the four "rival" cards are cards that were chosen
  for a reason they cannot act on. The log line the player reads says a party
  took the campaign into the country; nothing in the country knows who it was
  against.
- **Upgrade:** make each card's body read `rival.foe` — campaign in the foe's
  strongest region, organise where the foe's machine is, court the bloc the foe
  depends on.

### The most-played card in the deck moves the government's vote up and the player of it down — [inconsistent]

- **What:** `court` writes `st.blocs[best] += 2.6`. `supportTargets` reads a
  bloc's mood twice: once as `weight` (rises for everybody) and once as
  `appeal`, where the government gets `+m/80`, a partner `+m/108`, and the
  opposition **`− m/130`**. There is a third read — the extremist bonus
  `appeal *= 1 + ext * max(0, 60-m)/60 * 2.4` — which a rising mood also
  destroys. So a happy bloc is an incumbent's bloc, and the opposition's own
  card makes blocs happy.
- **Evidence:** `court.run` at 34343–34361, the write at 34359;
  `supportTargets` at 11487, `weight` at 11496, the three appeal lines at
  11509–11511, the extremism term at 11513. The opposite model:
  `v17Utility` at 13696, the bloc term `u += (blocs[b]-50) * aff[b] * 1.1`,
  read by `v19Standing` at 35252 and so by `v19Outcome`.
- **Measured, through the game's own path** (run the real card body on the live
  state at session 30 and read `supportTargets` before and after, six seeds):
  **29 of 36 opposition plays LOWERED the playing party's own national share**,
  mean **−0.027 pp**. The six ruling-party plays raised it, mean **+0.19 pp**.
  Bloc mood measured across 5,760 samples: mean **66.29**, min 15.3, max 100.
- **Why it matters:** three things at once. (1) `court` is the most-played card
  in the deck — 796 of 4,941 plays in the baseline — and for the party playing
  it, it is a net negative. (2) The engine plays it because `v17Utility` says a
  happy bloc is good and `supportTargets` says a happy bloc is the incumbent's;
  two models of one number, pointing opposite ways, and `v19Outcome` reads the
  wrong one. (3) At the measured mean mood of 66.3, `max(0, 60 - m)` is **zero**,
  so the extremism term — a whole authored mechanic — never fires in play. That
  is CLAUDE.md's "a threshold picked by eye is a mechanic that never fires",
  found at the distribution rather than the constant.
- **Upgrade:** decide what a bloc's mood means and make one model of it. If it is
  "how satisfied this bloc is with the government", then `court` must write a
  *party-specific* affinity channel instead — `affOf` already exists and
  `supportTargets` already multiplies by it. And re-centre the extremism term on
  the measured distribution (66) rather than on 60.

### The engine has no access to half the vote model — [missing]

- **What:** four of the party-specific multipliers `supportTargets`/`ballot`/
  `allocateSeats` read have **no AI writer anywhere in the file**:
  - `st.press[pid]` — written at 12804 (a player action on another party),
    13129 (the player's own party), 23920, and by events at 7826/8352/19111;
    moved by `carryOver` at 11699.
  - `st.gerry[pid]` — written at 12808, 13133, 8352, 7826, `carryOver` 11705.
  - `st.campaign.targets` (regional priority) — written at 31101, a player click.
  - `partyTurnout`'s unity, field, data and endorsement terms — all inside
    `if (pid === playParty(st))`.
  Caucus loyalty, which is the *only* turnout channel an engine has, is written
  only by player actions and inbox papers (10118–10120, 10227, 10322–10332,
  12738, 13005, 23913) and by `factionTick`'s ideological drift.
- **Evidence:** `supportTargets` reads press at 11523 and funding/machine at
  11516; `ballot` reads press at 11608; `allocateSeats` reads gerry at 11581;
  `partyTurnout` at 11414 with the player gate at 11416–11421;
  `factionTick` at 8933, the drift at 8941. Greps run:
  `grep -n "st\.press\[\|S\.press\["`, `grep -n "st\.gerry\|S\.gerry"`,
  `grep -n "st\.campaign\|S\.campaign"`, `grep -n "\.loyalty = "` — no hit falls
  inside `V16_AI_DECK`, `v17Ai*`, `v18*` or `v19*`.
- **Why it matters:** the player can buy newspapers, redraw boundaries, target
  three regions, hold a leadership retreat and take an endorsement. An engine can
  do exactly two things to its own vote: `organise` (`st.machine +.030`) and
  `campaign` (`st.funding +.08`, gone in three sessions). The asymmetry is the
  bulk of the answer to "why does nothing ever change".
- **Upgrade:** give the deck an AI writer for at least `press` and the regional
  targets, at a price and with a corruption/liberties cost the player can see and
  answer, so the two sides of the board play the same game.

### Pacts are proximity, not strategy — [shallow]

- **What:** `v16PactPartner` returns the nearest party on the compass within
  `.62` that is not the government, not in the coalition, not already pacted and
  not resented at ≥20. It reads no seat count, no projection, no threshold, and
  nothing about who the pact would beat. The pooled benefit at the count is a
  flat 6% of the two shares, split evenly. The card's `post` list excludes
  `govern`, `partner`, `consolidate`, `organise` and `restive`.
- **Evidence:** `v16PactPartner` at 34604–34614; the pool at 35544–35551;
  the lapse at 12005–12008; the card at 34450–34463, `post` at 34450. The
  comment at 34594–34602 already records that the one strategic clause was
  measured out for firing zero times.
- **Why it matters:** 474 pact plays in the baseline and not one of them was a
  calculation. Two neighbours agree to stand down for each other whether or not
  it wins them anything.
- **Upgrade:** score a candidate partner through `projection()` — does the pact
  move a seat? — and let the two sides renew a pact that worked.

### No engine can call, force, or threaten an election — [missing]

- **What:** `runElection` has exactly two call sites: the scheduled ballot inside
  `endTurn`'s queue callback, and `callElection`, which is gated on `leads(S)`.
  The no-confidence motion is a player ACTION costing 11 capital. The
  `confidence_threat` paper is raised only inside `if (leads(st) && ...)` — it
  cannot be aimed at an engine-led government, and no engine raises it against
  anybody. `v17CaretakerTick` can force a ballot, but only after a formation
  fails three sessions running, and the baseline records **0 caretakers in 360
  formations**.
- **Evidence:** `runElection` at 11903, called at 13543 and 13455;
  `callElection` at 13439 with `leads(S)` at 13440; the no-confidence action at
  12708–12728; `confidence_threat` raised at 10271 under the `leads(st)` gate at
  10268; `v17CaretakerTick` at 37698, `V17_CARETAKER_MAX = 3` at 37382.
- **Why it matters:** the opposition's ultimate weapon does not exist on the
  engine's side of the table. A player can be in office for a hundred sessions
  and never be asked to defend it out of turn.
- **Upgrade:** an `oust`-holding party with the arithmetic should be able to move
  the confidence question. `v17ConfidenceVote` already exists and already counts
  the chamber; it needs an AI caller and a paper that lands on the player.

### No engine reacts to winning or losing an election — [missing]

- **What:** three continuous terms notice that seats moved, and nothing notices
  that a *ballot happened*: `v16Posture`'s `trend < 0 && share < .18 →
  'moderate'`, `v18Tempo`'s `losing: 1.3`, and `driftParties`'s
  `rate = clamp(.045 + lost*1.7, 0, .2)`, which walks a party that lost share
  toward the winner's position. There is no `v16Resent` at a count, no goal
  adopted or retired at a count, no leader change, no post-mortem, no memory
  that the party was beaten by anybody in particular.
- **Evidence:** `v16Posture` at 34119 and 34139; `V18_TEMPO.losing` at 35378 and
  the read at 35394; `driftParties` at 11649, the rate at 11656, the pull toward
  the winner at 11657. `runElection` at 11903–12029 calls no AI function at all
  after the count — `driftParties` at 11970 is the only line that touches a
  party's own state.
- **Why it matters:** a landslide and a hung chamber produce the same engine
  behaviour on the next session. A party crushed by the player has no more reason
  to move against them than one that was not in the race.
- **Upgrade:** a post-count pass: the biggest loser resents the biggest winner,
  a party that lost its government adopts `oust` against whoever took it, a party
  that gained heavily takes `enter` or `office`, and the leader of a party that
  lost twice running is replaced.

### `driftParties` converges the whole field on the government — [shallow]

- **What:** every party but the winner moves toward the winner's compass
  position, at `.045` a ballot minimum and up to `.2` when it lost share, plus a
  `.09` pull toward its blocs' centroid and a `.11` pull home. The only outward
  force is a `.34`-radius repulsion between neighbours.
- **Evidence:** `driftParties` at 11649–11683; the winner pull at 11657; the
  home pull at 11664–11665; the repulsion at 11666–11674.
- **Why it matters:** with a stable winner (measured: the largest party changed 9
  times in 360 ballots), the field spends a whole campaign walking toward the
  government. `supportTargets`' extremism term — the one thing that rewards
  standing apart — is already dead at the measured bloc mood, so nothing pushes
  back.
- **Upgrade:** make the pull conditional on the party actually *wanting* what the
  winner won (its `wants` overlap), and let a party that has decided to oust the
  government move away from it instead.

---

## Why 360 elections produced only 9 government changes

The formation is not the reason. Measured on the same run, the **largest party
changed exactly 9 times in 360 ballots** — the identical number — so
`v17Rotation` has never once seated a government other than the largest party's.
The rotation is a formality on top of a count that does not move. Six mechanisms
hold the count still, in order of size:

1. **The government has a structural 1.7× appeal advantage, per bloc, before
   anybody does anything.** `supportTargets` at 11509–11511 gives the ruling
   party `.915 + (m-50)/80`, a partner `.86 + (m-50)/108`, the opposition
   `.784 − (m-50)/130`. Measured mean bloc mood is **66.29** (5,760 samples), so
   in play those are **1.119 / 1.011 / 0.659**. Add `st.apparatus` at 11518,
   which only the government has.

2. **The opposition's own most-played card feeds that advantage.** `court` raises
   bloc mood (34359); rising mood is the government's term and the opposition's
   penalty. Measured, 29 of 36 opposition plays lowered the playing party's own
   share.

3. **Two of the four vote channels have no AI writer.** `st.press` (11523,
   11608) and `st.gerry` (11581) are player-only. `partyTurnout`'s unity, field,
   data and endorsement terms are inside `if (pid === playParty(st))` (11416).
   An engine has `machine` and `funding` and nothing else.

4. **The vote is damped twice and the seats a third time.** `updatePartySupport`
   moves `psupport` 35% toward target each session (11537); `runElection` calls it
   again at 11906; `ballot` pulls another 35% at 11604; and then
   **`var frac = early ? 1 : (1/3)`** at 11908 blends the fresh allocation into
   the sitting chamber at one part in three (11912). Measured, the mean regular
   ballot moves **19.5 of 1,305 seats — 1.5% of the chamber** (max 84).

5. **The field converges on the winner.** `driftParties` at 11657 walks every
   loser toward the government's position each count, and the one term that
   rewards standing apart (11513) is zero at the measured mood.

6. **Nothing can interrupt.** No engine can dissolve (13440), move confidence
   (12708 is a player action), or raise a confidence threat against an
   engine-led government (10268). The caretaker path, the only other route to an
   unscheduled ballot, fired 0 times in 360 formations.

The seat damper alone is not the story — one third a ballot closes 90% of a gap
in six ballots, and there are ~59 ballots in a campaign. The story is that
**`fresh` barely moves**, because the terms that could move it are either the
government's by construction (1), pushed the wrong way by the opposition's own
card (2), unavailable to engines (3), or converging (5). The 1/3 damper then
turns what little movement there is into a rounding error at 1,305 seats.

By contrast, the **executive** turns over at 25.6% because `execContest` puts a
`.78–1.22` die on top of the same shares (11882). The offices move because the
contest is noisy, not because anybody won them — and measured, 98.7% of
non-player office-sessions are held by a party already inside the government, so
even that turnover is a reshuffle rather than a transfer of power.

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `st.exec[o]` | `execContest` 11889, `execSeat` chain, `acts.consulate` 11985, portfolio gift 16752, `v17Refound`/13035, custom start 36489 | assent 9428/9433/9443/9499, `execHeld` 10695, `holdsDept` 10721, `officeMine` 11010, order gate 28718, `v17AiOrderFor` 38407, `figureEffects` 7357, `v19Standing` 35261 (cancels), `office` goal 34731/34736/34740, `v19Rivalry` 35109/35127, render 15195/38153 |
| `st.execPush[office:pid]` | player action 12536 (`.16`), `v17AiRaceSpend` 38062 (`.12`/`.2`) | `execPushOn` 7269 → `execContest` 11881, `v17RacePolls` 38008. Cleared 11896 |
| `st.execRace` | `v17RaceSeed` 37896, `v17ResolvePrimaries` 37962, `v17BackCandidate` 38027, `v17AiRaceSpend` 38063 | `v17RaceWinner` 37981, `v17PrimaryScore` 37881, race panel 38113–38153. Cleared 11898 |
| `field[o][pid].standing` | `v17Field` 37866 | `v17PrimaryScore` 37879 **only** — never by `execPersonFactor` or `v17RacePolls` |
| `st.partyRules[pid].primaries` | `v17PartyRules` 36050 (seed), `v17SetPrimaries` 36086 (player only) | `v17PrimariesOn` 36063 → `v17RaceSeed` 37893, `v17ResolvePrimaries` 37920 |
| `st.partyRel[pid]` | `shiftPartyRel` 8748 (2,164 calls/720 sessions per baseline) | `assentFavour` 9444 — **the engine-vs-engine assent test**; `v17Accept` 37478 (player side only); coalition cards |
| `v16Ai[pid].spent` | `v16AiPay` 34059, `campaign` 34340 | Parties panel 36129 **only** — no gameplay reader (`grep -n "\.spent"`) |
| `st.funding[pid]` | `partySpend` 16493 (from `campaign` 34339 and `partyPurseTick` 16373) | `supportTargets` 11516; decayed `×.6` 13484 |
| `st.machine[pid]` | `organise` 34333, `attack` 34403, `figureEffects` 7348, player actions 12800/13122 | `machineOf` 11397 → `supportTargets` 11517; `v19Standing` 35257; `v15CampaignSeats` 11465 |
| `st.press[pid]` | 12804, 13129, 23920, events 7826/8352/19111, `carryOver` 11699 — **no AI writer** | `supportTargets` 11523 (via `v17PressReach` 38840), `ballot` 11608 |
| `st.gerry[pid]` | 12808, 13133, 8352, `carryOver` 11705 — **no AI writer** | `allocateSeats` 11581 (via `v17GerryOf` 38811); decayed 10255 |
| `st.campaign.targets` | player click 31101 only | `regionPartyFactor` chain 30795, `v15CampaignSeats` 11470 |
| `st.blocs[b]` | `court` 34359, `mood()` everywhere, events | `supportTargets` 11496/11507 (**incumbent-favouring**), `v17Utility` 13696 (**party-favouring**) — the two disagree |
| `st.aiPacts[pid]` | `pact` card 34460 | `ballot` wrapper 35548, `v16PactPartner` 34609; lapsed 12007 |
| `st.caretaker` | `v17Install` 37629 | `v17CaretakerTick` 37699, `callElection` 13451, `v17CareBar`. Measured 0 in 360 formations |
| `st.ruling` / `st.coalition` | `v17Install` 37624–37625, `formCoalition` 11719 (dead fallback) | ~20 sites; `v16Posture` 34121/34137; `supportTargets` 11509 |

---

## What I could not verify

- **`v19Outcome`'s sign on the `campaign` card.** From the code, `v19Standing`
  reads `share`, `machine`, `purse`, ruling/coalition and `exec` — not
  `st.funding` — so `campaign` should score *negative* in the sim (the purse term
  at 35258 falls by `40/100 × 1.2 = .48`). I did not instrument `v19Outcome`
  directly to confirm the sign in play. If it is negative, the sim actively
  disprefers the deck's only election card, which would be worth its own finding.
- **Whether the 88.2% assent refusal rate holds with an active player.** My run
  had a passive player, so `st.partyRel` sat wherever `shiftPartyRel` left it.
  The *mechanism* (an engine-vs-engine decision read off the player's
  relationship, 9444) is verified by reading; the *rate* is measured only for a
  passive player.
- **The `office` goal's stall rate specifically.** I measured that 50.3% of live
  office aims point off the contested pair, and I read the progress/done mismatch
  at 34740/34742, but I did not separate `office` out of the baseline's 133
  stalled aims.
- **`artRunningMate`'s effect on the pair.** I read the wrapper at 38089–38090
  and the MAP's claim that it moves no ballot, but I did not drive a campaign
  with the article adopted.
- **Longer terms.** Every measurement is at the default 2-year term, where
  `isExecTurn` and `isBallotTurn` coincide on every odd session (10630/10631), so
  `execContest` always runs inside `runElection` at 12012 and the mid-term branch
  at 13529 never fires. I did not test a term article that separates them.
