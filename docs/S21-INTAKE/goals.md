# goals

## What it does today

`V19_GOALS` (34677-34875) is a list of seven kinds, each an object with `fits`,
`target`, `done`, `dead`, `progress`, `say` and `worth`. `v19Goal` (34901) is
called from exactly one place in three megabytes, `v16AiTurn` line 35467, and
only after the party has passed the tempo gate (35451) and found a non-empty
open set (35459), so the goal machinery runs on a party-session where the party
was going to act anyway. It keeps a single aim in `v16Ai(st)[pid].goal`, retires
it when `done`, `dead`, stalled past `V19_GOAL_IDLE * patience`, or older than
`V19_GOAL_CAP`, then immediately draws a replacement in `v19AdoptGoal` (34942)
by weighted roll over the kinds whose `fits` is positive and whose `target`
returns something not already achieved. The aim feeds two things: a `worth`
score over the eleven deck cards inside `v19Score` (35284), and `v20Aim` (34276),
which four verbs read to act on the thing the aim named.

## My own measurement

Everything below marked "measured" is from two probes I wrote and ran against
HEAD, driven six seeds (4242, 90210, 7, 31337, 5150, 777) by 120 sessions =
**720 sessions, 4,320 party-sessions**, `normal` / `epic` / `ruthless`, player
`lp`, with the `runQueue` override CLAUDE.md requires (361 elections observed,
so the republic really did go to the country). Probes are at
`scratchpad/goalprobe2.js`, `goalprobe3.js`, `goalprobe4.js`. Every probe read
saves and restores `st.rngState` around itself, because `office.target` (34738)
and `charter.target` (34850) roll.

My seeds are not `docs/S21-BASELINE.md`'s seeds. I reproduce the phenomenon
independently: **199 aims adopted, 163 retired - 33 done, 127 stalled, 3 given
up. 79.8% abandoned.** The baseline's 22/133/3 and my 33/127/3 are the same
finding on different dice.

Retirements by kind, and how far the aim got before it was put down:

| kind | done | stalled | given up | done rate | median `best` at retirement | median span (sessions) |
|---|---|---|---|---|---|---|
| carry | 4 | 44 | 0 | 8.3% | **0.00** | 19 |
| charter | 3 | 19 | 0 | 13.6% | **0.10 (min = max = 0.10)** | 18 |
| office | 5 | 11 | 0 | 31.3% | 0.40 | 19 |
| enter | 2 | 15 | 2 | 10.5% | 0.27 | 18 |
| ground | 11 | 16 | 0 | 40.7% | 0.66 | 17 |
| build | 7 | 22 | 1 | 23.3% | 0.16 | 25 |
| oust | 1 | 0 | 0 | n=1 | 0.52 | 21 |

---

## Findings

### Q1a. The clock is read once every 4.2 sessions, and it counts sessions — [inconsistent]

- **What:** `idle` and `age` at 34926-34927 are differences of `st.turn`, so they
  count real sessions. But `v19Goal` is only reached after `if (!answering &&
  !passed) return;` (35451) and `if (!open.length) return;` (35459). Measured:
  **1,038 `v19Goal` calls across 4,320 party-sessions = the clock is read on
  24.0% of them, once every 4.2 sessions.** `V19_GOAL_IDLE` is 11, scaled by
  `v19Temper(pid).patient` (34925), which across the six engine parties gives
  idle bars of 7.7 (RSF, patient .7), 8.8 (PNL .8), 12.1 (TVC 1.1), 13.2 (SD
  1.2), 14.3 (CUP 1.3) and 16.5 (FP 1.5). So a goal gets between **1.8 and 3.9
  observations** before the clock retires it. For the RSF it is fewer than two.
- **Evidence:** `V19_GOAL_IDLE` 34898, `idleBar` 34925, `idle` 34926, the single
  call site 35467, the two returns above it at 35451 and 35459, `v19Temper` 746,
  the seven `temper:` literals at 764-800.
- **Why it matters:** A party that cannot afford any card for twelve sessions
  never ticks its clock. When it finally acts, `idle` is already past the bar and
  the aim is retired in the same call that would have served it. Poverty retires
  goals, and the page reports it as "it was going nowhere."
- **Upgrade:** Tick the clock in `endTurn` for every party, separately from the
  initiative, or express the bar in observations rather than sessions. The
  arithmetic the note at 34893 wanted ("kept while it is moving") needs the
  observation rate in it.

### Q1b. `carry` cannot move its own number, by three orders of magnitude — [missing]

- **What:** `carry.target` (34684) aims at the next rung, `want = lv + dir`, and
  `carry.progress` (34714) divides by `span = |want - from| = 1`. The number is
  therefore binary: 0 until a bill carries the statute, then 1. `st.pol` moves
  when a bill passes. S19c measured 747 engine bills laid and 5 moving a statute
  (0.67%), and S19d's own note says the arithmetic forbids more: an opposition
  private member's bill starts at forecast 36.6 against an assembly bar of 50.
  At the measured bill rate of 0.11 plays per party-session, expected rungs per
  session is 0.00074, or **about 1,350 sessions per rung** against an idle bar of
  7.7-16.5 and a cap of 60.
- **Evidence:** `carry.progress` 34714-34718, `carry.done` 34709, the `bill` card
  34529-34571, `v19BillFor` 34284. Measured: 44 of 48 `carry` retirements at
  `best` exactly 0.00; `carryEnd` (statute level at retirement minus at adoption)
  min 0, p50 0, p90 0.
- **Why it matters:** `carry` is the most-adopted aim (53 of 199) and it is a
  countdown to a silent reset with a name on it. The Parties page prints
  "Carrying Wealth Tax 0%" for nineteen sessions.
- **Upgrade:** Either give `carry` a partial-credit progress that reads what the
  party has actually done toward the statute (a bill laid, a committee stage
  survived, a floor declaration, a demand answered) or stop calling a bill's
  passage the goal and make the goal "get it to the floor."

### Q1c. `ground` cannot move its own number at any number of sessions — [missing]

- **What:** `ground.target` (34800) sets `want = min(92, have + 14)`. The serving
  verb is `court` (34343), which banks `st.blocs[best] += 2.6` (34359). Every
  session, `tickTurn` pulls every bloc 30% of the way back to `blocTarget`:
  `st.blocs[b.id] = c100(st.blocs[b.id] + (tg - st.blocs[b.id]) * .3)` (11271).
  A one-off +2.6 is worth +1.82 next session and +0.89 three sessions later. The
  steady-state elevation from repeated plays at interval N is `2.6 / (1 - 0.7^N)`.
  Measured, a party with a `ground` aim live plays `court` 125 times in 678
  ground party-sessions (0.184/session, N = 5.4), giving a ceiling of **+3.0**.
  Even at one court card **every single session** the ceiling is 2.6/0.3 = **+8.7**,
  still short of the +14 the aim asks for.
- **Evidence:** `ground.target` 34807, `ground.done` 34811, `court.run` 34359,
  the mean reversion at `tickTurn` 11269-11272.
- **Measured decomposition, and it is the sharpest number in this report.** For
  each `ground` aim I recorded `blocTarget` at adoption and at retirement:

  | outcome | n | span | court plays | Δ bloc | Δ `blocTarget` | needed |
  |---|---|---|---|---|---|---|
  | done | 11 | 15.6 | **2.18** | +19.51 | **+13.18** | 13.98 |
  | stalled | 16 | 22.2 | **4.94** | -6.08 | -5.27 | 13.69 |

  The aims that succeeded played the serving card **2.2 times** and were carried
  13.18 of the 13.98 points by the bloc's own target moving. The aims that failed
  played it **more than twice as often**. And the courted bloc sits no higher
  above its own target than an uncourted one: mean deviation +2.43 for aimed
  blocs against +2.94 across all 5,760 bloc-session samples.
- **Why it matters:** `ground` has the best completion rate of the seven (40.7%)
  and the party contributes almost nothing to it. Whether a party "wins over the
  faithful" is decided by the weather.
- **Upgrade:** `ground` needs a number the party owns. Either set `want` to
  something inside the court card's reach (+3 to +4), or give the aim a
  party-specific bloc standing that does not mean-revert, which the ballot could
  then read.

### Q1d. `build`'s target is set above what its verb can outrun the decay by — [shallow]

- **What:** `build.target` (34829) sets `want = min(.92, machine + .22)`.
  `organise` adds `V16_AI_ORGANISE = .030` (34333). `tickTurn` decays every
  machine by 1.5% a session: `st.machine[mk] *= .985` (11345). Measured for the
  22 stalled `build` aims: 3.59 organise plays across 27.6 sessions = 0.130 per
  session, net drift `0.030 * 0.130 - 0.015 * m̄`. With the measured median
  machine of 0.054 that is about +0.0024/session, or **92 sessions to gain 0.22**,
  against a cap of 60. Median Δmachine for a stalled `build` aim is **-0.043**:
  the party organised for 27 sessions and went backwards.
- **Evidence:** `build.target` 34830, `build.progress` 34834, `V16_AI_ORGANISE`
  34025, the decay at 11345. Measured `buildHaveMinusFrom` p50 +0.029, p90 +0.162
  against a need of 0.220.
- **The seven that completed did not do it with the card.** `figureEffects`
  (7345, called from `tickTurn` at 11324) gives a party whose leader carries the
  `organiser` trait **+0.022 machine every single session** (7348). That is 5.6x
  what the `organise` card contributes at the measured play rate. `build` is
  reached by parties whose leader happens to be an organiser.
- **Upgrade:** Set `want` from the card's reach over a plausible span, and say
  the number in the code the way `V20_AIM_BILL`'s comment does. A step of +0.08
  is about 20 sessions of steady organising.

### Q1e. `charter`'s progress function has one observable value — [decorative]

- **What:** `charter.progress` (34867) returns `.6` if `v11PendingOf(st, g.ref)`
  and `.1` otherwise. `v17ArticleCore` pushes a pending record with `due =
  st.turn + span` where span is 1 or 2 (38346-38348). Measured: the aim's article
  was pending on **20 of 433 charter party-sessions (4.6%)**, and **0 of the 103
  clock reads landed on one**. `best` at retirement was exactly 0.10 on all
  twenty-two retirements: min, p50, p90, p99 and max.
- **Evidence:** `charter.progress` 34867-34869, `v11PendingOf` 31304,
  `v17ArticleCore` 38347, the `article` card 34478.
- **This is not a targeting failure.** When a party holding a `charter` aim plays
  the `article` card, `v17AiArticleFor` returns the named article on **41 of 55
  plays (74.5%)**. The party lays the right article. The clock is asleep when it
  happens, so the aim is retired for going nowhere while going somewhere.
- **Why it matters:** `charter` is the goal S19c resurrected from a null-target
  bug, and it stalls on the clock every time it is not lucky enough to finish
  inside one idle window. Its progress bar reads 10% for the entire life of every
  aim.
- **Upgrade:** Record the laying on the goal (`g.laid = st.turn`) and read that,
  so the reading survives the two sessions the pending record exists for.

### Q1f. Three goals report the party's seat share as progress — [inconsistent]

- **What:** `office.progress` is `clamp(v17Share(st, pid) * 2, 0, .95)` (34742).
  `enter.progress` is `clamp(v17Share(st, pid) * 2.4, 0, .95)` (34756).
  `oust.progress` is `clamp(1 - v17Share(st, g.ref) * 2.5, 0, .95)` (34789).
  `v17Share` (37403) is `seats / house`. None of the three asks about the office
  or the coalition it named, and none reads anything the party did about it.
- **Evidence:** the three `progress` bodies above, `v17Share` 37403,
  `v17Weight` 37395.
- **Two failures at once.** Seat share does not read what the party is doing, so
  a party that spends every race backing its named office gets no credit. And
  seat share changes constantly (measured, `v17Share` moved on 2,178 of 3,618
  party-sessions, with 361 elections in 720 sessions), so the clock is kept alive
  by seat noise that has nothing to do with the aim. `office` `best` at
  retirement runs a median of 0.40, meaning the panel said "Taking the
  Chancellorship, 40%" because the party held 20% of the house.
- **Why it matters:** The `progress` function is what the clock reads (34915) and
  what the page prints (36145). Both are reading a share meter with a goal's name
  on it.
- **Upgrade:** `office` should read the party's polling in that race
  (`v17RacePolls(st, o)[pid]`) and whether `st.execPush[o + ':' + pid]` is set.
  `enter` should read distance to the government it named through the predicate
  `formCoalition` uses. `oust` should read the target's satisfaction and the
  coalition ledger, which S17e already writes.

### Q1g. `office` names a random department and its verb fires once every eight sessions — [shallow]

- **What:** `office.target` (34734-34739) builds the list of offices the party
  does not hold and picks with `free[Math.floor(rand() * free.length)]`. There
  are four departments (`DEPTS` 424). The serving verb is `v17AiRaceSpend`
  (38037), which is not a deck card and does not go through the initiative
  budget. It runs only in the `general` stage of an exec race, spends once per
  office per race (`if ((r.spent[key] || 0) > 0) return;` 38044), and
  `isExecTurn(t) = t >= 5 && (t - 5) % 4 === 0` with `execPair(t)` alternating
  between `['pres','vchan']` and `['chan','vpres']` (10631). **A given office is
  contested once every eight sessions.** `st.execPush` is wiped after every
  contest (11896).
- **Evidence:** 34738, 38037-38065, 10631, 11896, `V20_AIM_PUSH` 34275.
- **Why it matters:** A median `office` aim lives 19 sessions, so it gets about
  2.4 windows in which its verb can fire at all, each worth a single +0.2
  multiplier on that race's vote share, on an office chosen by a fair die from
  four. Measured 5 of 22 reached, and the party did not choose which.
- **Upgrade:** Pick the office by `v17RacePolls`, not by `rand()`, and let the
  aim's spend scale with how close the race is.

### Q2. `oust` never fires because the grudge ledger cannot point at the government — [missing]

- **What:** three predicates read three different sets.
  - `fits` (34764) returns 0 for `pid === st.ruling`, then takes the maximum
    grudge this party holds against **any** party and returns 1.4 if it is >= 25.
  - `target` (34774) picks the argmax-grudge party among all unbanned parties,
    with no reference to whether that party is in government.
  - `done` (34783) is `g.ref !== st.ruling && (st.coalition || []).indexOf(g.ref) < 0`.
    `v19AdoptGoal` evaluates `done` on the candidate before pooling it and drops
    it if true (34956-34957).

  So `oust` is adoptable only when the single most-hated party in the ledger
  happens to be sitting in the government. Nothing anywhere selects for that.

- **The exact predicate, measured over 3,618 non-ruling party-sessions:**

  | gate | count | share |
  |---|---|---|
  | max grudge >= 25, so `fits` > 0 | 880 | 24.3% |
  | of those, argmax party is in government | **72** | 8.2% of the 880 |
  | of those, argmax is outside, so `done` is already true and the goal is dropped | **808** | 91.8% |

  Net, `oust` is adoptable on **72 of 3,618 non-ruling party-sessions, 2.0%**.
  Adoption only happens when a party is free of an aim, which is 199 moments in
  4,320 party-sessions. Expected adoptions across the whole run, at weight 1.4
  against a pool total near 5.5, is under one. I got **1 in 199**. The baseline
  got 0. Both are the same number.

- **Why the argmax is never in government.** The only AI-to-AI grudge writer is
  the `attack` card, `v16Resent(st, t, pid, V18_ATTACK_RESENT)` at 34419, and
  `attack.can` (34368) refuses `pid === st.ruling` and refuses any coalition
  member that is not restive. So the government never attacks, and nobody
  accumulates a grudge against it from that channel. Attacks flow toward the
  government (the picker at 34391 starts `t = st.ruling` and falls back to it
  when nothing is held) and the memory flows away from it: the government
  remembers every attacker, and `oust.fits` refuses the government outright.
  Opposition parties then feud with each other. Measured: **394 of 3,729 nonzero
  ledger entries (10.6%) point at a party in government**, while the government
  is 2 to 3 of 7 parties. The only two writers that aim at the government are
  `v17DealScan`'s breach line (35723, worth `hit.cost + 1`) and `v17Walkout`
  (35778, worth 25), and the baseline records 3 walkouts in 720 sessions.

- **What would have to be true.** `target` would have to pick the worst grudge
  **among parties in the government**. Measured, some party in government is held
  at >= 25 on **157 of 3,618 non-ruling party-sessions (4.3%)**, and at >= 8 (the
  `dead` floor at 34787) on 266 (7.4%). So fixing `target` alone lifts `oust`
  from 2.0% to 4.3% of boards, which is real but still thin. The ledger itself
  has to learn to point at governments: an opposition party that has been
  outvoted, refused a demand, or legislated against by the government currently
  remembers none of it.

- **Upgrade:** Filter `target` to the government, make `fits` ask the same
  question `target` answers (it currently maximises over a different set, so a
  party with a 90 grudge against a rival and a 5 against the government passes
  `fits` and is then killed by `dead`), and give the government-facing grudge a
  writer: a refused `party_demand`, a bill voted down by the government, a
  portfolio taken away.

### One party, one aim, and no plan — [shallow]

- **What:** `a.goal` is a single slot. `v19AdoptGoal` writes `a.goal = pick.g`
  (34972) and every reader takes the one object: `v20Aim` 34278, `v19Goal` 34905,
  `v19GoalSay` 34977, `v19GoalProgress` 34984, `v19GoalSeen` 35011. There is no
  list and no priority.
- **Evidence:** the five readers above. Grep `\.goal\b` over `vale.html` returns
  nothing else outside the CSS class `.goal-row`.
- **What it costs:** the seven kinds are the natural rungs of one plan and the
  model cannot express the plan. "Build the organisation, so I win seats, so I
  get into government, so I take the Chancellorship" is four of the seven aims in
  causal order, and a party holds exactly one of them and forgets it every
  eighteen sessions. Measured adoption sequences (probe 3 `kindSeq`) show no
  structure: `build > office` 4, `office > build` 8, `ground > carry` 12,
  `carry > ground` 10. It is a fresh weighted draw each time, with the previous
  kind unread.
- **Upgrade:** A two-slot aim, a long one and a short one, with the short one's
  `fits` reading the long one. Or make `v19AdoptGoal` read `a.lastGoal.kind` and
  weight the successor.

### Nothing happens the session after an aim is reached — [missing]

- **What:** at 34932 `v19Goal` writes `a.lastGoal` and nulls `a.goal`; at 34939
  it immediately calls `v19AdoptGoal` in the same call. Measured: **33 of 33
  completions were replaced in the same call**. There is no pause, no reward, no
  state change, no log line, no chronicle entry.
- **Evidence:** 34932-34939. `a.lastGoal` has exactly one reader in three
  megabytes, `v16AiPanel` line 36153, which prints it for six sessions
  (`S.turn - lg.until <= 6`, 36154) and then it is invisible. Grep `lastGoal`
  over `vale.html` returns 34932 and 36153 only.
- **Why it matters:** a party that has just taken the office it spent thirty
  sessions after does nothing differently, tells nobody, and starts on a random
  new aim drawn from the same table. A completed goal has no consequence in the
  model at all.
- **Upgrade:** A reached aim should pay something the model reads: standing, a
  bloc, a relationship, or a claim in the next formation. `st.ai[pid].wins`
  would be one line and every `v19Score` term could read it.

### Goals conflict on four clauses; one is dead and one fires for everybody — [shallow]

- **What:** `v19Rivalry` (35065) is the only place two aims are compared. Its
  AI-to-AI clauses are: `theirs.kind === 'oust' && theirs.ref === pid` (35071),
  same-bloc `ground` (35125), same-office `office` (35127), same-ref `enter`
  (35129).
- **Evidence:** the four clauses above, plus the note at 35114-35122 recording
  that the only positive clause was measured out for firing zero times in 25,200
  pairs.
- **Why it matters:** the `oust` clause is unreachable, because `oust` is
  adopted once in 199. The `enter` clause fires for every pair of parties outside
  government, because `enter.target` is `{ ref: st.ruling }` (34753) and every
  outsider names the same ref. The file's own note at 35140-35143 says as much:
  "Every multi-rival board is two parties trying to enter the same government."
  The `office` clause needs two parties to roll the same one of four departments.
  So the conflict layer is one clause that fires universally and three that
  barely fire.
- **Upgrade:** the conflict set should include `carry` in opposite directions on
  one statute (S19d found the manifesto overlap that makes this reachable) and
  `office`/`enter` against the party that currently holds the thing.

### The player sees every aim, free, every session — [works, and possibly too well]

- **What:** `v16AiPanel` (36122) is spliced into `viewParties` (36230) with no
  gate. Its sixth column calls `v19GoalSay(S, p.id)` (36141) and
  `v19GoalProgress(S, p.id)` (36143) and prints the aim in plain words with a
  percentage, then `a.lastGoal` for six sessions with why it ended and how far it
  got (36153-36164). The `whys` list below the table prints each party's last
  card and the aim it was for (36192).
- **Evidence:** 36122-36207, 36230-36238. `v19GoalSay` has one other caller,
  `v16AiTurn` 35520, writing `a.why.aim` for the same panel.
- **Why it matters:** there is no scouting, no cost, no uncertainty and no
  possibility of a bluff. R2 asked the page to state the aim and it does, well.
  What it forecloses is a whole layer of play: an aim you have to infer from what
  a party does, or one it lies about.
- **Upgrade:** keep the column and add a confidence to it, sourced from how much
  the party has actually shown its hand (cards played toward the aim, papers
  sent). An aim held for one session should read "unclear."

### `V19_GOAL_STALE` is written and read by nothing — [decorative]

- **What:** `var V19_GOAL_STALE = 14;` at 34900, with the comment "the old flat
  clock, kept for the save it rides in."
- **Evidence:** `grep -n "V19_GOAL_STALE" vale.html tools/roads.js checks/*.js`
  returns exactly two hits, both in `vale.html`: the declaration at 34900 and a
  mention inside the comment block at 34883. No save field carries it; nothing
  consults it.
- **Why it matters:** this is `st.court.size` with a different name. A later
  reader will reason about a fourteen-session stale clock that does not exist.
- **Upgrade:** delete it.

### `k.short` is read and never written — [decorative]

- **What:** 36155 reads `k && k.short ? k.short : (...)`. No entry in
  `V19_GOALS` carries a `short` field.
- **Evidence:** `awk` over lines 34677-34875 for `short:` returns nothing. The
  ternary's first branch is dead and the seven-way fallback chain at 36156-36159
  always runs.
- **Upgrade:** delete the branch, or add `short` to the seven goals and delete
  the chain. The chain is the stale-list defect `v7DefaultCollapsed` was fixed
  for: a new goal kind falls through to `'an article'`.

### Three cards the goal weights highly do not read the aim — [inconsistent]

- **What:** S20g wired four verbs to `v20Aim`: `v19BillFor` (34323), `court`
  (34353), `platform` (34442) and `v17AiRaceSpend` (38058). Three cards that
  `worth` rates above .6 for some goal still choose by a different rule.
  - `demand`, worth **.9** to `carry` (34722) and the second-most-played card in
    the deck (762 plays in the baseline), calls `partyDemandPolicy` (9927),
    which takes a weighted draw over the top five gaps in `wants`. It does not
    read `v20Aim`.
  - `floor`, worth **.8** to `carry` and **.8** to `oust`, calls `v17AiFloorFor`
    (38473), which picks by `v19Pivot` (where the party's vote matters most) with
    no reference to the aim's statute.
  - `pact`, worth **.7** to `enter` and **.65** to `oust`, calls
    `v16PactPartner` (34604), which takes the nearest party on the compass
    inside `dist2 < .62`, skipping the government, existing pacts and anyone it
    holds 20 or more against. It never asks what either party wants.
- **Evidence:** 34722, 34758, 34793, 9927, 38473, 34604-34615.
- **Why it matters:** the `worth` table makes a party with a `carry` aim reach
  for `demand` almost as often as for `bill`, and then the letter it writes is
  about a statute the aim did not name. That is exactly the split S20g fixed for
  `court` and `bill`, still open on the card next to them.
- **Upgrade:** give `partyDemandPolicy` an aim thumb the way `v19BillFor` got
  `V20_AIM_BILL` (34323), and take the same care S17k's note demands, since three
  other callers read `partyDemandPolicy`.

### The `V20_AIM` coverage guard does not check what it claims — [exploitable, in the harness]

- **What:** the comment at 34216-34221 says `V20_AIM` "is a covered surface and
  not a hand-kept list: `roads.js` walks `V19_GOALS` and fails if a ref-bearing
  goal arrives without an entry." What `roads.js` actually asserts (11675-11684)
  is that every kind has an entry, no entry is stale, and the named value is an
  id in `V16_AI_DECK` (or the string `exec`). It never checks that the named
  verb's body calls `v20Aim` with that kind.
- **Evidence:** `tools/roads.js` 11675-11684. `grep -n "V20_AIM\b" vale.html`
  returns only the declaration at 34223 and the comment above it - **nothing in
  the game reads the table**; the four verbs pass the kind as a string literal.
- **Why it matters:** a later slice can add a goal, add `myGoal: 'demand'` to
  `V20_AIM`, and the guard goes green while `demand` reads nothing. That is the
  `V17_MEMORY` whitelist failure the comment says this design avoids.
- **Upgrade:** have the assertion drive each named verb with an aim set and
  check the verb's output changed, which arm (c) of the same probe already does
  for `court`.

### `carry.progress` reads a statute moving the wrong way as progress — [latent defect]

- **What:** 34717 is `clamp(Math.abs(lv - from) / span, 0, 1)`. `Math.abs` means
  a statute moving one rung **against** the party's want reads 1.0. `done`
  (34709) correctly stays false, so the aim is kept, the clock's `moved` resets
  (34918), and the panel prints "Carrying X 100%".
- **Evidence:** 34717 against the signed forms at `ground.progress` 34816 and
  `build.progress` 34837, both of which use a signed difference.
- **Unverified in play:** across 926 `carry` party-sessions in my run the statute
  never moved against an aim (`carryEnd` min 0). The guard is absent in code; the
  case did not occur on these six seeds.
- **Upgrade:** `clamp((lv - from) * g.dir / span, 0, 1)`.

### The stall reason the page prints is the only reason the model has — [shallow]

- **What:** `a.lastGoal.why` (34932-34934) has four values: `done`, `gone` (from
  `dead`), `given up` (age past the cap) and `stalled` (everything else). Measured
  over 163 retirements, `given up` fired 3 times and `gone` fired **0 times**.
  127 of 163 are `stalled`.
- **Evidence:** 34933-34934, and the measured `retire` table above, which has no
  `gone` column because no kind produced one.
- **Why it matters:** `dead` is the predicate that says an aim became impossible,
  and it never once fired in 720 sessions. `carry.dead` (34713) asks whether the
  statute closed (measured 0 of 926). `oust.dead` (34787) needs an `oust` aim.
  `charter.dead` (34866) asks whether the article id is unknown. `enter.dead` and
  `build.dead` are hard-coded `false` (34755, 34833). So "it is out of reach"
  is a sentence the page can print and the model cannot produce.
- **Upgrade:** the real out-of-reach cases exist and are not asked. `enter` is
  dead when the party is cordoned or banned. `office` is dead when the party
  holds two already, which is the same test `fits` makes at 34730-34732 and never
  re-asks.

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `st.ai[pid].goal` | `v19AdoptGoal` 34972; nulled `v19Goal` 34908/34935, `v19AdoptGoal` 34961 | `v20Aim` 34278, `v19Goal` 34905, `v19GoalSay` 34977, `v19GoalProgress` 34984, `v19GoalSeen` 35011. `grep -n "\.goal\b" vale.html` finds no others |
| `g.kind` | 34954 | `v19GoalKind` via 34907, 34979, 34986; `v20Aim` 34279; `v19Rivalry` 35071/35102/35103/35109/35125/35127/35129; panel 36156 |
| `g.ref` | 34954 | the seven `done`/`dead`/`progress`/`say` bodies; `v20Aim` 34280; `v19Rivalry`; panel 36158 |
| `g.want` | 34954 from `target` | `carry.done` 34711, `ground.done` 34811, `build.done` 34832, and the three matching `progress` bodies. Not set by `office`, `enter`, `oust`, `charter` |
| `g.dir` | 34954 | `carry.done` 34711, `carry.say` 34720. Not read by `carry.progress`, which is the `Math.abs` defect above |
| `g.from` | `v19AdoptGoal` 34968-34971, only for `carry`/`ground`/`build` | `carry.progress` 34715, `ground.progress` 34814, `build.progress` 34835 |
| `g.best` | `v19Goal` 34918 | `v19Goal` 34918 (the high-water comparison), `a.lastGoal.best` 34932, panel 36164 |
| `g.moved` | `v19Goal` 34918/34919/34920 | `v19Goal` 34926 |
| `g.since` | 34954 | `v19Goal` 34919/34926/34927/34932 |
| `st.ai[pid].lastGoal` | `v19Goal` 34932 | `v16AiPanel` 36153 only. `grep -n "lastGoal" vale.html` returns 34932 and 36153 |
| `st.ai[pid].why` (`.goal`, `.aim`) | `v16AiTurn` 35519-35524 | `v16AiPanel` 36178-36194 only |
| `V19_GOAL_STALE` | declared 34900 | **NONE FOUND.** `grep -n "V19_GOAL_STALE" vale.html tools/roads.js checks/*.js` returns only 34883 (a comment) and 34900 (the declaration) |
| `V20_AIM` | declared 34223 | **NONE in `vale.html`.** `grep -n "V20_AIM\b" vale.html` returns 34216 (comment) and 34223 (declaration). Read only by `tools/roads.js` 11677-11683, 11701, 11838 |
| `k.short` on a goal kind | **NONE FOUND.** No `short:` in 34677-34875 | `v16AiPanel` 36155 |
| `st.execPush[office + ':' + pid]` | player button 12536 (+.16), `v17AiRaceSpend` 38062 (+.2 with an aim, +.12 without); cleared 11896 | `execPushOn` 7267, read at 11881 and 38008 |
| `st.blocs[bloc]` (the `ground` channel) | `court.run` 34359 (+2.6), `mood` 10566, `tickTurn` 11271 (30% reversion every session) | `ground.done` 34811, `ground.progress` 34814, `ground.target` 34805, plus the ballot at 11496/11660 and unrest at 11230 |
| `st.machine[pid]` (the `build` channel) | `organise.run` 34333 (+.030), `attack.run` 34403-34404, `figureEffects` 7348 (+.022 every session for an organiser leader), decay 11345 (×.985) | `build.done` 34832, `build.progress` 34835, `machineOf` 11397, the ballot |
| `st.ai[pid].grudge` (the `oust` channel) | `v16Resent` 34074, called from `attack.run` 34419, `v17DealScan` 35723, `v17Walkout` 35778, the player's verbs 35998/36002, inbox 10155-10224, ban 13256, floor 38332; cooled 0.6/session at 35531 | `v16Grudge` 34071 → `oust.fits` 34769, `oust.target` 34778, `oust.dead` 34787, `attack.run` 34395, `v18Restive` 34114, `v19Rivalry` 35092, the vote at 9074/31398 |

---

## What I could not verify

- **Whether the baseline's 86% and my 79.8% differ for a reason.** I do not know
  which six seeds `docs/S21-BASELINE.md` used. My run is an independent
  reproduction on 4242/90210/7/31337/5150/777, not a replication of theirs.
  Per-kind counts are small (n = 16 to 48 retirements per kind), so the per-kind
  done-rates carry real spread. The decompositions in Q1c and Q1d are the
  arithmetic and do not depend on the sample size.
- **`carry.progress`'s `Math.abs` defect** is a reading of line 34717. It did not
  occur on my six seeds (`carryEnd` min 0 across 48 aims), so I have not seen the
  panel print 100% on a statute moving the wrong way.
- **Whether `V19_GOAL_STALE` is read from a save.** I grepped `vale.html`,
  `tools/roads.js` and `checks/*.js`. I did not grep `tools/playtest.js` or the
  other tools; a harness reference would not make it live in the game either way.
- **`docs/MAP.md` at 1939-1947 is out of date and I did not chase why.** It says
  "`office` needs `st.exec` to change and no engine card reaches it" and
  "`enter` needs a coalition to grow and one never did in 720 driven sessions."
  Measured at HEAD, `office` completes 5 of 22 and `enter` 2 of 19. S20g's
  `v17AiRaceSpend` aim read (38058) and the 45 coalition membership changes in
  the S21 baseline are the likely reasons, but I did not bisect it.
- **The `blocTarget` movement in Q1c** is measured through `blocTarget(st, BLOC[ref])`
  at adoption and at retirement. I did not decompose what moved `blocTarget`
  itself, so "the weather" is a description of where the movement came from
  (outside the party's cards) and not of which mechanism produced it.
- **The `carry` play rate.** `court` (0.184 with the aim live), `article` (55
  plays with the aim live) and `organise` (0.130 for `build`-holders) are counted
  on my own six seeds. The `bill` rate of 0.110 per party-session is
  `docs/S21-BASELINE.md`'s 477 plays over 4,320 party-sessions, and the 0.67%
  carry rate is S19c's 5-of-747 figure quoted in `docs/MAP.md` line 2004. I did
  not re-derive either on my seeds, so the "about 1,350 sessions per rung" in
  Q1b is built on those two borrowed numbers.
