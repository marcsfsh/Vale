# choosing — the decision function itself

## What it does today

`v16AiTurn` (35417) filters the eleven-card deck by posture and a four-session
recency bar (35454-35458), then hands the open set to `v19Choose` (35327), which
draws ONE card with probability proportional to `exp(sharp × v19Score)` (35333).
`v19Score` (35280) is a base of `.5` plus six terms: a lookup in the goal's
`worth` table, a recency penalty, a purse penalty, a one-ply simulation, a
per-party temperament constant, and a rivalry read. Three of the six are
switched off below `shrewd`. There is no search, no opponent reply and no plan:
`v19Outcome` (35264) deep-clones the state, runs the card once, and subtracts
two readings of `v19Standing` (35250). That is the whole of the deliberation in
this program.

## How this was measured

Four probes, all driving real sessions through `endTurn` with the
`runQueue` override CLAUDE.md requires, over **six seeds × 30 sessions × each
level** (`SEED_OVERRIDE` set before every `v6NewGame`, per the pinning rule).
Scripts are in the scratchpad (`probe-choose.js`, `probe-standing.js`,
`probe-decides.js`, `probe-utility.js`).

Both decompositions are **checked against the game's own functions on every
row**, so they cannot silently measure something else:

- the seven-term split of `v19Score` was compared with the real
  `v19Score` return on **4,393 evaluations — 0 mismatches**;
- the five-part split of `v19Standing` was compared with the real
  `v19Standing` difference on **1,028 rehearsals — 0 mismatches**.

One probe column WAS wrong before the game was: I first read the article card's
pending list at `st.v11.pending` and got 0%. `v11Con` (31269) puts it at
`st.v11.con.pending`; re-measured on the right path, **255 of 255** article
rehearsals lay a pending amendment. The corrected figure is used below.

---

## 1. Every term in `v19Score`, with its measured range

At `instinct` **`v19Score` is never called at all** — `v19Choose` short-circuits
to `w = 1` at line 35333 — so the level has no scoring behaviour to report. The
figures below for the other three are measured, not derived.

**Term inventory** (line, what it is, what it can be):

| # | term | line | value | fires on |
|---|------|------|-------|----------|
| 0 | base | 35281 | `.5` constant | 100% |
| 1 | goal | 35282-35286 | `k.worth[card.id]`, a constant per (goal, card): **0.12 … 1.00** | 100% above instinct; **0** at instinct (`v19Goal` returns null, 34902) |
| 2 | recency | 35290-35291 | `-0.18` if played in the last 8 sessions | 12-13% |
| 3 | purse | 35293-35294 | `-0.22` if purse < 2.2 × cost | 26-30% |
| 4 | simulation | 35300-35301 | `sim × v19Outcome`, outcome measured **−0.080 … +0.215** | 100% of evaluations at shrewd/ruthless, but see §2 |
| 5 | temperament | 35311-35314 | `0.6 × v19Temper(pid)[axis]`, a constant per (party, card): **0.06 … 0.36** | 100% above instinct |
| 6 | rivalry | 35315-35320 | `read × V19_RIVAL_WORTH[card] × min(1, foeAt)` | 15-24% at shrewd/ruthless, **0%** below |

**Measured ranges, six seeds × 30 sessions each** (min / median / max / mean, and
the share of evaluations on which the term is non-zero):

| term | purposeful (sharp 1.4, sim 0, read 0) | shrewd (2.8, 1, 1.2) | ruthless (5, 1.9, 1.8) |
|---|---|---|---|
| base | 0.500 flat | 0.500 flat | 0.500 flat |
| goal | 0.120 / 0.300 / 1.000, mean **0.443**, 100% | 0.120 / 0.350 / 1.000, mean **0.453**, 100% | 0.120 / 0.300 / 1.000, mean **0.448**, 100% |
| recency | −0.180 / 0 / 0, mean −0.024, **13.2%** | −0.180 / 0 / 0, mean −0.022, 12.3% | −0.180 / 0 / 0, mean −0.022, 12.5% |
| purse | −0.220 / 0 / 0, mean −0.059, **26.9%** | −0.220 / 0 / 0, mean −0.066, 30.0% | −0.220 / 0 / 0, mean −0.058, 26.4% |
| simulation | **0 always** | −0.080 / −0.016 / **0.215**, mean **0.010** | −0.153 / −0.030 / **0.409**, mean **0.012** |
| temperament | 0.060 / 0.180 / 0.360, mean **0.205**, 100% | same, mean 0.210 | same, mean 0.208 |
| rivalry | **0 always** | 0 / 0 / 0.816, mean 0.060, **23.5%** | 0 / 0 / 1.071, mean 0.057, **15.1%** |
| **TOTAL** | 0.360 / 1.000 / 1.860 | 0.326 / 1.074 / 2.392 | 0.325 / 1.058 / 2.593 |
| evaluations | 1,279 | 961 | 1,028 |

**What a term has to be worth to matter.** The draw is `exp(sharp × score)`, so
the score difference that makes one card **twice** as likely is `ln 2 / sharp`:

| level | sharp | doubles the odds at | the whole goal-table span (0.88) is worth | the temper span (0.30) |
|---|---|---|---|---|
| purposeful | 1.4 | **0.495** | 1.8 doublings (3.4×) | 0.6 doublings (1.5×) |
| shrewd | 2.8 | **0.248** | 3.5 doublings (11.8×) | 1.2 doublings (2.3×) |
| ruthless | 5.0 | **0.139** | 6.3 doublings (**81×**) | 2.2 doublings (4.5×) |

**Which terms can dominate, and which are noise.** Measured directly by removing
one term and asking whether the highest-scoring card changes (multi-card open
sets only):

| term removed | purposeful (261 sets) | shrewd (225) | ruthless (229) |
|---|---|---|---|
| goal | **67.4%** | **65.3%** | **55.9%** |
| simulation | 0% (off) | 12.9% | **21.0%** |
| temperament | 9.2% | 11.6% | 10.0% |
| purse | 12.6% | 6.2% | 7.0% |
| recency | 6.1% | 6.2% | 5.7% |
| rivalry | 0% (off) | **1.3%** | **3.5%** |

**The goal table alone names the same leader as the whole seven-term score on
79.7% / 76.4% / 70.3% of open sets.** Everything else in `v19Score` is a
tie-break on the remaining quarter.

At **purposeful** — the default (`V19_DEFAULT_LEVEL = 'purposeful'`, line 441) —
only the goal table clears one doubling on its own; the temperament span is
1.5× across the entire deck, and the purse and recency penalties are worth
1.36× and 1.29×.
At **ruthless** the goal table is worth 81× end to end and everything else is a
nudge, except a live rivalry (up to 7.7 doublings, but present on 15% of
evaluations) and the `court` card's simulation (2.9 doublings, and only that
card — see §2).

---

## 2. `v19Outcome` — what the one-ply rehearsal can and cannot see

### What is cloned

`v19Try` (35214): `JSON.parse(JSON.stringify(st))`, then `delete clone.v11.hist`
and `.histT` (35217 — read only by the chart accessors `v11Col`/`v11ColStart` at
30496-30497, so the drop is exact). It sets `S` to the clone, raises
`V19_SIMULATING`, stubs `render`, `showSheet`, `hideSheet`, `toast`, `flash`,
`saveAutosave`, `captureUndo`, replaces `Math.random` with a local LCG seeded at
48271, and restores every one of them in a `finally` (35227-35231).

**The clone does not leak — verified, not assumed.** Six seeds, all eleven cards
run through `v19Try` against a live board at session 20: `UI` unchanged,
`S.rngState` unchanged, `S.capital` unchanged, `Math.random` restored,
`V19_SIMULATING` back to `false` on every seed. And driven properly — three
seeds × 30 ruthless sessions, **504 `v19Try` calls made by the game itself** —
`RNG_ON` was non-null on **0** of them and the live `S.rngState` moved on **0**
of them. (`rollFor` (6936) does have four callers — 8479, 8588, 17514, 23472 —
but all four are construction paths: `newGame`, `enrichState` and `v6NewGame`.
None is reachable from `endTurn`. My first grep used the wrong symbol name and
said "no callers"; the conclusion survives, the reasoning did not.)

Two small drifts from `v6Sandbox` (19606), neither of which leaked in the
measurement: `v19Try` does not save/restore `UI.undo` (19607/19619 does), and it
discards `flash` messages where `v6Sandbox` collects them.

### What `v19Standing` measures

Five components (35250-35262): `v17Utility(st,pid)`; `v17Share × 60`;
`machine × 25`; `min(20, purse/100) × 1.2`; and a flat +18 ruling / +9 coalition
/ +9 per executive office.

### What it actually reads, per card — measured, 1,028 rehearsals at ruthless

Mean component movement, and what the card demonstrably changed on the clone:

| card | Δutility | Δshare×60 | Δmachine×25 | Δpurse | Δoffice | **Δstanding** | what it really did (share of rows) |
|---|---|---|---|---|---|---|---|
| article | 0.000 | 0.000 | 0.000 | −0.408 | 0.000 | **−0.408** | laid a pending amendment, 255/255 |
| bill | 0.000 | 0.000 | 0.000 | −0.456 | 0.000 | **−0.456** | added a bill, 100% |
| campaign | 0.000 | 0.000 | 0.000 | −0.480 | 0.000 | **−0.480** | `st.funding[pid] += .08` (partySpend, live in `supportTargets` at 11446) |
| demand | 0.000 | 0.000 | 0.000 | −0.192 | 0.000 | **−0.192** | wrote an inbox letter, 100% |
| floor | 0.000 | 0.000 | 0.000 | −0.144 | 0.000 | **−0.144** | `v17FloorCore` pressure |
| pact | 0.000 | 0.000 | 0.000 | −0.408 | 0.000 | **−0.408** | wrote `st.aiPacts`, 100% (read at 34609, 35545) |
| platform | 0.000 | 0.000 | 0.000 | −0.264 | 0.000 | **−0.264** | wrote `st.push`, 100% (read by `ppos` at 11675) |
| attack | 0.000 | 0.000 | +0.450 | −0.312 | 0.000 | +0.138 | moved the target's machine too, 100% |
| organise | 0.000 | 0.000 | +0.750 | −0.504 | 0.000 | +0.246 | — |
| order | −0.700 | 0.000 | 0.000 | −0.264 | 0.000 | −0.964 | — |
| court | **+2.374** | 0.000 | 0.000 | −0.432 | 0.000 | **+1.942** | moved a bloc, 96% |

### What it cannot see

**Anything that resolves later than immediately.** For **seven of the eleven
cards — 566 of 1,028 rows, on 100% of each card's own rows — the ONLY moving
component of the rehearsal is the purse deduction.** The simulation prices a
bill, an article, a pact, a platform rewrite, a demand letter, a floor
intervention and a campaign at **exactly minus their own price tag.** Bills in
progress, elections, another party's reply, a pending amendment, a pact that
only pays at the next ballot, a letter waiting for an answer: none of them exist
to the objective function.

**Three of the five components of `v19Standing` can never differentiate a card.**
`v17Share × 60`, the ruling +18 and the office/coalition +9 moved on **0 of 1,028
rehearsals** — no card in the deck changes seats, government membership or an
office within one ply. `v19Standing` has exactly two callers (35267, 35270), both
inside `v19Outcome`, both as a **difference**, so those three weights are read
only in a subtraction where they always cancel. This is `st.court.size`'s
neighbour: not a field nothing reads, but three tuned weights that cannot fire.

**The squash and both clamps are dead.** `v19Outcome` returns
`clamp(d/12, −1, 1)` (35278). Measured, `d` spans **−0.964 … +2.583** across
every rehearsal in the sample, so `d/12` spans −0.080 … +0.215 and the ±1 clamp
is unreachable by a factor of five.

**Is the clone faithful?** Yes, mechanically — it is a true deep copy and the
card runs its real `run` through its real Cores. It is unfaithful as a *model of
the future*: it is a photograph taken one instant after the card is played, and
seven of eleven cards do nothing visible in that instant.

---

## 3. `v17Utility` — what "good" means to an engine party

`v17Utility` (13696-13716) sums:

| what | weight | line |
|---|---|---|
| `ind.economy` | +0.9 | 13705 |
| `ind.safety` | +0.45 | 13705 |
| `unrest` | −0.85 | 13706 |
| `approval(st)` (population-weighted bloc mean) | +0.35 | 13707 |
| **`st.capital`** | **+0.5** | 13708 |
| `st.treasury` | +0.04 | 13708 |
| `ind.corruption` | −0.4 | 13709 |
| `ind.liberties` | **+0.7 if `home.a < 0`, else −0.35** | 13711 |
| `ind.poverty` | **−0.9 if `home.e < 0`, else −0.25** | 13713 |
| each bloc: `(mood − 50) × aff[bloc] × 1.1` | authored per party | 13715 |

**Measured, +5 to one thing, mean over 6 seeds at session 20:**

| perturbation | rsf | lp | sd | fp | cup | tvc | pnl |
|---|---|---|---|---|---|---|---|
| economy +5 | 4.50 | 4.50 | 4.50 | 4.50 | 4.50 | 4.50 | 4.50 |
| safety +5 | 2.25 | 2.25 | 2.25 | 2.25 | 2.25 | 2.25 | 2.25 |
| unrest +5 | −4.25 | −4.25 | −4.25 | −4.25 | −4.25 | −4.25 | −4.25 |
| **capital +5 (the player's)** | 2.50 | 2.50 | 2.50 | 2.50 | 2.50 | 2.50 | 2.50 |
| treasury +50 | 2.00 | 2.00 | 2.00 | 2.00 | 2.00 | 2.00 | 2.00 |
| corruption +5 | −2.00 | −2.00 | −2.00 | −2.00 | −2.00 | −2.00 | −2.00 |
| liberties +5 | 3.50 | 3.50 | 3.50 | 3.50 | −1.75 | −1.75 | −1.75 |
| poverty +5 | −4.50 | −4.50 | −4.50 | −1.25 | −1.25 | −1.25 | −1.25 |
| labour bloc +5 | 5.23 | 5.78 | 2.48 | 1.11 | −2.47 | −1.64 | 0.83 |
| tech bloc +5 | −5.38 | −3.73 | 1.77 | 2.60 | 3.97 | 0.67 | −0.98 |
| faith bloc +5 | −1.94 | 1.09 | −1.39 | 0.81 | 2.19 | 5.76 | 4.11 |

**All seven parties want the same country except in three places.** Six of the
ten national terms are byte-identical for every party. Liberties and poverty are
each a **binary** on a derived home position (`p.home = { e: p.order/3 − 1, a: p.auth }`,
line 804) — four parties want liberties up and three down; three count poverty
heavily and four lightly. Only the bloc affinity sum varies continuously, and it
is the authored `aff` table that already exists.

Two consequences worth naming:

- **`fp` sits at `home.e` exactly 0**, which is not `< 0`, so the constitutional
  centre party counts poverty at the right-wing weight (−0.25). Not obviously
  intended; it is an off-by-a-boundary in a derived value.
- **Every engine party's objective rewards the player's own resource.**
  `st.capital` is a single global scalar the player spends on actions (S19c's own
  comment at 34525 says so in as many words), weighted +0.5 — a bigger weight
  than safety. It is invisible inside `v19Outcome` because no deck card moves it,
  but `v17AiDecide` (13720-13731) argmaxes `v17Utility` **as a level** over the
  crisis choices, so a government run by an engine party prefers the crisis
  choice that leaves the human better supplied.

---

## 4. Is the player modelled? Is anything planned?

**No, to both, and there is nothing close.**

- `v19Try` has exactly **one** caller (`v19Outcome`, 35268). `v19Outcome` has
  exactly **one** caller (`v19Score`, 35301). Greps: `v19Try(`, `v19Outcome(`,
  `v19Standing(`. The whole simulator exists to weight one card.
- `v19Outcome` runs `card.run(clone, pid)` and stops (35268). No other party
  moves, no tick runs, no session ends, no division is held.
- The only other simulation in the file is `v6Sandbox` (19606) with four callers:
  `v17AiDecide` (13726 — the ruling party's crisis choice, also greedy argmax
  over one ply) and three player-facing forecast paths (19651, 19658, 23036).
- **The player enters the model only retrospectively.** `v19Rivalry`'s human
  clause (35090-35109) reads `v16Grudge` — a record of what the player *has
  done* — plus the offices and government they *currently* hold. Nothing
  anywhere predicts a player move.
- The nearest thing to lookahead is `billForecast` (9240), used by `v19BillFor`
  (34284) and `v19Pivot` (38473-38505): it computes what a division would be **if
  held now**. It is arithmetic on the current chamber, not a model of anyone's
  next move.
- A goal persists across sessions (`v19Goal`, 34901-34941 — kept until done, dead,
  stalled past `V19_GOAL_IDLE × patience`, or 60 sessions old). That is
  multi-session **consistency**, not a plan: no card is chosen because of what it
  enables next session, and no sequence of moves is represented anywhere in the
  file.

**What kind of reasoning this is, plainly:** a **one-step greedy weighted lookup
with a softmax draw**. The dominant input is a hand-authored constant per (goal,
card). One term rehearses a single move against a static world and reads the
result through an objective that is blind to seven of the eleven moves. There is
no adversary, no horizon, no sequencing, and no belief about anyone else's next
action.

---

## 5. Do the four levels differ beyond `sharp` / `sim` / `read`?

**Yes — via two derived switches.** Every reader of `v19LevelOf` (grep
`v19LevelOf`):

| line | reads | what it gates |
|---|---|---|
| 34670 | `.sharp` | defines `v19Thinks` |
| 34392 | `.read` | scales `V19_RIVAL_PUSH` into **`attack`'s target picker** — a channel outside `v19Score` entirely |
| 35300 | `.sim` | the simulation term |
| 35315 | `.read` | the rivalry term |
| 35329 | `.sharp` | the draw's sharpness |
| **38480** | **`.sim` truthiness** | **`v17AiFloorFor` picks by `v19Pivot` above shrewd and by "whatever it likes least" below** |
| 20161, 20180 | `V19_LEVELS` | the setup sheet's copy |

And `v19Thinks(st)` (= `sharp > 0`) gates five things that are not scalars at all:

| line | what turns on above `instinct` |
|---|---|
| 34902 | **goals exist at all** (`v19Goal` returns null at instinct) |
| 34277 | **`v20Aim`** — so the `court`, `platform` and `bill` cards read the party's aim (34353, 34442, and the bill picker) |
| 34925 | the goal's stall window scales by the party's `patient` |
| 35311 | the temperament term |
| 35886 | **`v19React`** — the entire provoked-response/tempo-debt layer |

So the ladder is not four evenly spaced rungs:

- **instinct → purposeful** switches on goals, aim-reading, temperament and the
  reaction layer *simultaneously*. It is the largest jump by a wide margin.
- **purposeful → shrewd** switches on the simulator, the rivalry read and the
  floor pivot.
- **shrewd → ruthless** changes **only three numbers** (1.4→2.8→5, 1→1.9,
  1.2→1.8). No behaviour appears; the same function is read more sharply.

Nothing else reads `st.aiLevel`: grep returns 6 lines, four of which are the
setup sheet (8490, 20161, 20180, 20185, 20200) and one `v19LevelOf` (34662).

---

## 6. What happens when several cards score alike

**There is no tie-break. The softmax draw is the only mechanism, and it discards
the highest-scoring card on a third to three-fifths of every pick.**

Measured over multi-card open sets:

| | purposeful | shrewd | ruthless |
|---|---|---|---|
| the draw took the highest-scoring card | **40.2%** | **46.7%** | **67.2%** |
| mean P(leader) | 0.367 | 0.545 | 0.703 |
| gap between first and second, median | 0.250 | 0.249 | 0.261 |
| gap max | 0.850 | 0.904 | 0.967 |
| top two within 0.02 | 3.4% | 3.6% | 3.1% |
| top two within 0.10 | **26.4%** | **22.7%** | **21.4%** |
| mean open-set size | 4.79 | 4.14 | 4.38 |

A gap of 0.10 — which a fifth of all open sets are inside — is worth 1.15× at
purposeful, 1.32× at shrewd and 1.65× at ruthless. So on a fifth of every
party's decisions the leader is barely better than a coin flip against the
runner-up, and there is nothing in the code that prefers one over the other:
no ordering rule, no "if equal, prefer the aim", no memory of what it tried
last (the recency term is a blanket −0.18, not a preference).

`v19Choose`'s only other tie-related line is the underflow guard
`if (!isFinite(w) || w <= 0) w = 1e-6;` (35334), which cannot fire for a finite
score, and the fallthrough `return open[open.length - 1]` (35339).

---

## Findings

### The goal table is the decision function, and it is a constant — [shallow]
- **What:** `v19Score`'s largest live term is a hand-authored number per (goal
  kind, card id) that reads nothing about the board. Removing it changes the
  leader on 55.9-67.4% of open sets; **it alone names the same leader as the
  full seven-term score on 70.3-79.7%.**
- **Evidence:** `v19Score` 35282-35286; the seven `worth` tables at 34722,
  34744, 34758, 34793, 34822, 34840, 34873.
- **Why it matters:** a goal persists roughly 27 party-sessions (the brief's
  baseline: 158 terminations over 4,320 party-sessions), so a party's ranking
  of the deck is effectively frozen for a fifth of a campaign. What varies
  session to session is the posture filter and the die, not the reasoning.
- **Upgrade:** make `worth` a function of the board, not a scalar — `worth(st,
  pid, goal)` returning a value that reads the actual distance to the aim, what
  is on the order paper, and how many sessions remain. Or drop the table and
  let the simulation answer, once the simulation can see anything (below).

### The rehearsal prices seven of eleven cards at exactly minus their own cost — [shallow, arguably decorative]
- **What:** for `article`, `bill`, `campaign`, `demand`, `floor`, `pact` and
  `platform` — **566 of 1,028 rehearsals, 100% of each card's own rows** — the
  only moving component of `v19Standing` is the purse deduction. The
  "deliberation" that `shrewd` and `ruthless` are sold on (V19_LEVELS notes,
  437 and 439) tells a party that laying a bill, laying an article, signing a
  pact, rewriting a platform, writing to the government and leaning on the floor
  are all, precisely, expenses.
- **Evidence:** `v19Standing` 35250-35262; `v19Outcome` 35264-35279; measured
  table in §2. The effects are real and live: `bill` writes `st.bills`;
  `campaign` → `partySpend` writes `st.funding` (read in `supportTargets`,
  11446); `platform` writes `st.push` (read by `ppos`, 11675); `pact` writes
  `st.aiPacts` (read at 34609, 35545); `article` writes `st.v11.con.pending`
  (38347). `v19Standing` reads none of those fields.
- **Why it matters:** at `ruthless` the sim term is worth −0.072 for a bill and
  +0.307 for `court`, so the simulator's net advice is "court a bloc, never lay
  anything". S19c's whole point was to give `carry` a road through the bill
  card; the deliberation layer at the two top levels votes against using it.
- **Upgrade:** `v19Standing` needs terms for things in flight — a bill on the
  order paper valued by `billForecast(st, b).lower` against its bar, a pending
  amendment, a pact, a demand awaiting an answer — or `v19Outcome` needs to run
  the clone forward one tick before reading. The one-tick version is cheaper to
  reason about and would price all seven cards at once.

### Three of `v19Standing`'s five components can never move a rehearsal — [decorative in context]
- **What:** `v17Share × 60`, the `+18` for ruling and the `+9` for coalition and
  each office moved on **0 of 1,028 rehearsals**. No card in the deck changes
  seats, government membership or an office within one ply.
- **Evidence:** `v19Standing` 35256, 35259-35261; `v19Standing(` has three
  matches in the file, one the definition and two inside `v19Outcome` (35267,
  35270) — both taking a **difference**, where a constant cancels.
- **Why it matters:** three weights were chosen and tuned ("a party trading its
  whole organisation for a point of the economy would be as wrong…", 35253) and
  none of them can fire. Reading the comment, a later slice will reason about
  them as though they do something.
- **Upgrade:** either delete them and say the objective is
  utility + machine + purse, or give `v19Standing` a caller that reads it as a
  level (a formation or confidence decision would be a real one).

### The squash and both clamps are unreachable — [decorative]
- **What:** `v19Outcome` returns `clamp(d/12, −1, 1)`. Measured, `d` spans
  −0.964 … +2.583, so `d/12` spans −0.080 … +0.215: the clamp is five times
  further out than the largest movement the game produces, and the divisor of 12
  shrinks the only term that reads the board into the smallest term in the sum.
- **Evidence:** `v19Outcome` 35271-35278; measured min/p50/max in §2.
- **Why it matters:** this is S17q's defect — a threshold picked by eye against
  a scale the game never reaches — in the numerator rather than the gate. The
  comment says "a single card moves it by a few points at most"; measured, the
  median rehearsal moves it by **−0.19**, and the largest movement anywhere in
  the sample is **+2.58**.
- **Upgrade:** divide by the measured spread (about 2.6), not by 12, and drop
  the clamp or set it where the distribution actually ends. Put the measured
  figures in the comment so the next reader cannot re-pick by eye.

### `v19Standing` was written to fix "only `court` scored", and `court` still dominates — [shallow]
- **What:** mean sim term at ruthless: `court` +0.307, `organise` +0.039,
  `attack` +0.022, and **negative for the other eight**. MAP.md 2170 says
  `v17Utility` alone was blind to nine of ten cards and `v19Standing` fixed it.
  Measured, it took the count from 1-of-11 to 3-of-11, and two of the three score
  under an eighth of `court`.
- **Evidence:** measured per-card table in §2; `v19Standing` 35256-35261.
- **Why it matters:** the fix was measured at the time and shipped; the
  measurement it needed was per-card, and per-card it is still one card.
- **Upgrade:** as above — the objective has to name the things the cards write.

### The opponent model barely reaches the chooser — [shallow]
- **What:** removing the rivalry term changes the leader on **1.3%** of open
  sets at shrewd and **3.5%** at ruthless. `foeAt` is zero on 76-85% of card
  evaluations. `Math.min(1, rival.foeAt)` (35319) never binds in 4,393
  evaluations (max observed 0.8).
- **Evidence:** `v19Score` 35315-35320; `V19_RIVAL` 35056; measured in §1.
- **Why it matters:** "a party standing in their way is answered directly"
  (V19_LEVELS note, 439) is, inside the chooser, a 3.5% effect. The rivalry's
  other channel — the `V19_RIVAL_PUSH` into `attack`'s target picker at
  34392 — is separate and may well be doing the visible work; this finding is
  about the chooser only.
- **Upgrade:** if the rivalry is meant to be felt, it needs to reach more than a
  weight — e.g. gate which cards are OPEN, or raise the tempo, rather than
  adding 0.06 to a score whose leader is already decided by a lookup table.

### The purse penalty is blind to three of the eleven cards — [inconsistent]
- **What:** `v19Score` 35293 reads `V16_AI_COST[card.id] || 0`. `V16_AI_COST`
  (34016) has **eight** entries. `article`, `order` and `floor` cost 34, 22 and
  12 through `V17_AI_COST_ARTICLE/ORDER/FLOOR` (38189-38191) and are not in it.
- **Evidence:** measured mean purse term is exactly **0.000** for `article`,
  `floor` and `order` at all four levels, against −0.115 for `campaign`.
- **Why it matters:** a party that cannot comfortably afford a 34-cost article
  gets no discouragement from taking it, while the same party is docked 0.22 for
  a 16-cost demand. "Money it cannot spare is a reason to do the cheap thing"
  (35292) is false for the three most institutional cards in the deck.
- **Upgrade:** one cost accessor — `v16CardCost(card.id)` — that both `can` and
  `v19Score` read, and a `roads.js` arm that fails if a deck card has no cost.
  This is exactly the coverage guard `V19_RIVAL_WORTH` and `V19_TEMPER_AXIS`
  already have and `V16_AI_COST` does not.

### Temperament is a permanent thumb, and it outweighs the simulation — [works, but it is a bias not a decision]
- **What:** `0.6 × v19Temper(pid)[axis]` depends only on the party and the card,
  never on the board. Present on 100% of evaluations above instinct, spanning
  0.06-0.36 with a mean of 0.208 — **seventeen times the mean simulation term at
  ruthless** — and it changes the leader on ~10% of sets, three times the rivalry.
- **Evidence:** `V19_TEMPER_AXIS` 716-720; `V19_TEMPER = .6` at 721; the term at
  35311-35314; per-party tables at 764, 770, 776, 782, 788, 794, 800.
- **Why it matters:** it does what it says — a party has a character — but it
  means a fixed constant is a larger input to the decision than everything the
  party observes about the world.
- **Upgrade:** none needed for correctness; worth knowing that if the goal table
  is made board-sensitive, `V19_TEMPER` should shrink with it or it will become
  the largest term.

### The die discards the best card on a third to three-fifths of picks — [works by design; the design deserves the owner's eye]
- **What:** the highest-scoring card is drawn on 40.2% (purposeful) / 46.7%
  (shrewd) / 67.2% (ruthless) of multi-card sets. On a fifth of all sets the top
  two are within 0.10, which is 1.15×/1.32×/1.65× — near a coin flip.
- **Evidence:** `v19Choose` 35333-35338; measured in §6.
- **Why it matters:** the default level *reasons* and then ignores the answer
  three times in five. It is a legitimate variety mechanism, but it means most
  of what a player sees an engine party do at the default setting is the die.
- **Upgrade:** if the owner wants the default to read as purposeful, `sharp` at
  purposeful is the dial, and it costs nothing structurally. Do not fix it in
  the score. (I did not measure a candidate value — the take-top rate depends
  on the score spread as well as on `sharp`, so a proposed number has to be
  driven, not extrapolated from the three rows above.)

### Nothing models the player and nothing plans — [missing]
- **What:** see §4. One ply, one caller, no adversary, no horizon, no sequence.
  The player is present only as a grudge total and a set of offices held.
- **Evidence:** `v19Try(` and `v19Outcome(` each have exactly one call site
  (35268, 35301); `v6Sandbox(` has four (13726, 19651, 19658, 23036), none of
  which steps a session; `v19Rivalry`'s human clause 35090-35109.
- **Why it matters:** it is the owner's stated goal ("seriously robust, very
  sophisticated"), and it is the single biggest gap in the area. A party cannot
  answer "if I lay this bill, the LP will whip against it" because nothing in
  three megabytes asks what the LP will do next.
- **Upgrade:** the cheapest real step is a **two-ply** `v19Outcome`: clone, run
  my card, then run each rival's most likely reply (their own `v19Choose` at
  sharp ∞, one card, no recursion), then read `v19Standing`. Cost is ~0.97ms ×
  (rivals + 1) per candidate — the file's own comment (35206-35207) puts today's
  cost at 0.97ms a card, about 5ms for the five a party weighs. The
  second cheapest is a "what the player is about to do" read from the bills
  they have laid and the offices they are contesting, fed into `v19Rivalry`
  where the grudge already goes.

### `V19_SIMULATING`'s comment claims a reader the game does not have — [decorative half]
- **What:** grep `V19_SIMULATING` in `vale.html` returns exactly **three** lines:
  35213 (declaration), 35221 (raise), 35230 (restore). **Nothing in the game
  reads it.** The comment at 35208-35212 says "The game reads it so a simulated
  action writes no letter to anybody's inbox, and the harness reads it…". Only
  the second clause is true — `tools/roads.js` reads it at 8964, 8995, 9032,
  9354, 9665, 9685, 9859, 10128, 10503, 10549.
- **Evidence:** the grep above; and measured, a rehearsed `demand` **does** call
  `addInbox` on the clone (the clone's inbox grew on 100% of 132 rows).
- **Why it matters:** harmless today because the clone is discarded, but it is
  CLAUDE.md's own rule — a comment asserting what a line does is not a reading
  of the line — and a later slice adding a card with a side effect outside `st`
  will trust a guard that is not there.
- **Upgrade:** either delete the false half of the sentence, or make the claim
  true by reading the flag where a rehearsal must not act.

### The four levels are two switches and three scalars, unevenly spaced — [works, worth knowing]
- **What:** see §5. `instinct → purposeful` turns on goals, aim-reading,
  temperament and the whole reaction layer at once; `purposeful → shrewd` turns
  on the simulator, the rivalry read and the floor pivot; **`shrewd → ruthless`
  changes only three numbers and adds no behaviour.**
- **Evidence:** `V19_LEVELS` 431-440; `v19Thinks` 34670 and its five gates at
  34277, 34902, 34925, 35311, 35886; `.sim` truthiness at 38480; `.read` at
  34392.
- **Why it matters:** the setup sheet's four notes (433-439) promise four
  distinguishable opponents. Three of the differences are real; the top step is
  a sharpness change, and its most visible effect is that the die stops
  overriding the leader (46.7% → 67.2%).
- **Upgrade:** if a fourth rung is wanted, it needs a behaviour, not a number —
  a two-ply rehearsal at `ruthless` only would be exactly that, and would
  restore the ladder's shape.

### `v17Utility` counts the player's own political capital — [inconsistent]
- **What:** `st.capital` is a single global scalar the player spends on actions,
  and `v17Utility` adds it at +0.5 to **every** party's utility — a larger
  weight than safety (0.45) and half again the weight of national approval.
- **Evidence:** 13708; `capCap` at the DIFFS accessor; S19c's own comment at
  34525 ("`st.capital`, which is the PLAYER'S capital"); measured +2.50 for all
  seven parties on a +5 perturbation.
- **Why it matters:** invisible in `v19Outcome` (no deck card moves capital) but
  live in `v17AiDecide` (13729), which argmaxes the level over crisis choices —
  so an engine government prefers the crisis answer that leaves the human better
  supplied. It also means the objective is not a party's objective.
- **Upgrade:** remove the term from `v17Utility`, or replace it with the acting
  party's own purse (which `v19Standing` already reads separately). Check
  `v17AiDecide`'s crisis choices for ones that move `st.capital` before deciding
  which.

### All seven parties want the same country apart from three terms — [shallow]
- **What:** six of the ten national terms in `v17Utility` are identical for
  every party; liberties and poverty are each a **binary** on a derived home
  position; only the bloc affinity sum varies continuously.
- **Evidence:** 13705-13715; `p.home` derived at 804; measured perturbation
  table in §3.
- **Why it matters:** the whole ideological content of an engine party's
  objective is two bits and an affinity vector. The card-level consequence is
  visible: `Δutility` was non-zero for only `court` (blocs) and `order`
  (indicators) across 1,028 rehearsals, so in practice the parties differ about
  exactly one card.
- **Upgrade:** make the weights continuous in `home.e` / `home.a` rather than
  binary (e.g. `liberties × (−0.35 − home.a × 1.05)`), which also fixes `fp`
  landing on the right-wing side of the poverty test at `home.e === 0`.

### The recency penalty is mostly pre-empted, and its default differs from the filter's — [works, but narrow]
- **What:** `v16AiTurn` drops any card played within **4** sessions from the open
  set (35456); `v19Score` then docks 0.18 for `since < 8` (35291), so the term
  can only fire in the window 4-7. Measured, it fires on 12-13% of evaluations.
- **Evidence:** 35456 uses `a.last[c.id] || -99`, 35290 uses
  `a.last[card.id] !== undefined ? … : -99`.
- **Checked and NOT a defect:** the two defaults disagree only when `a.last[id]`
  is `0`, and `a.last[id]` is only ever assigned `st.turn` (35493) while the
  state literal starts at `turn: 1` (8496). Zero never occurs.
- **Upgrade:** none required. If the two ever want to be one number, name it.

### At `instinct` a rival is read, recorded and printed, and never used — [inconsistent, cosmetic]
- **What:** `v16AiTurn` calls `v19Rival` unconditionally (35478) and stores
  `foe` in `a.why` (35524); the Parties page prints "with the X in the way"
  (36190-36194) with no level gate. At instinct `v19Score` is never called and
  `read` is 0, so the rival provably did not enter the decision.
- **Evidence:** 35478, 35524, 36190; `v19Rivalry`'s human clause (35097) fires
  without a goal, so `foeAt > 0` is reachable at instinct — measured on 0.2% of
  instinct card evaluations.
- **Why it matters:** rare, but it is the panel claiming a mechanism fired when
  it did not — the exact sentence the comment at 36186 says was taken off this
  page once already.
- **Upgrade:** gate the `foe` clause on `v19LevelOf(st).read > 0`, which is the
  predicate that decides whether the reading was used.

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `st.aiLevel` | setup sheet 20200, `newGame` 8490 | `v19LevelOf` 34662 only (`grep -n "aiLevel" vale.html` → 6 lines, 4 of them the setup sheet) |
| `v16Ai(st)[pid].goal` | `v19AdoptGoal` 34972; cleared 34908, 34935 | `v19Score` via its `goal` arg 35283; `v19GoalSeen` 35011; `v20Aim` 34278; `v19GoalSay` 34977; `v19GoalProgress` 34984 |
| `g.best`, `g.moved` | `v19Goal` 34918-34920 | `v19Goal`'s own idle clock 34926; `a.lastGoal` 34932 |
| `a.lastGoal` | `v19Goal` 34932 | Parties page 36153 |
| `a.last[cardId]` | `v16AiTurn` 35493 | open-set filter 35456; `v19Score` 35290 |
| `a.why` (`{card, goal, aim, turn, line, foe}`) | `v16AiTurn` 35519-35524 | Parties page 36190-36194 |
| `V19_SIMULATING` | `v19Try` 35221, 35230 | **NONE FOUND in vale.html** — `grep -n "V19_SIMULATING" vale.html` returns exactly the 3 write/declare lines (35213, 35221, 35230). Read only by `tools/roads.js` (8964, 8995, 9032, 9354, 9665, 9685, 9859, 10128, 10503, 10549) |
| `RNG_ON` | `rollFor` 6938, from `newGame` 8479, `enrichState` 8588 and 23472, `v6NewGame` 17514 — all construction paths | `rand()` 6942. Measured null on **504 of 504** `v19Try` calls made in play, so a rehearsal never spends the campaign's stream |
| `st.machine[pid]` | `organise` 34333, `attack` 34403-34404 | `v19Standing` 35257; the vote model; `build.fits`/`target` 34828-34830 |
| `st.purse[pid]` | `v16AiPay`, `partySpend`, `partyEarn` | `v19Score` 35293 (8 of 11 cards); `v19Standing` 35258; every card's `can` |
| `st.funding[pid]` | `partySpend` (campaign card, 34339) | `supportTargets` 11446-11466 — **not** by `v19Standing` |
| `st.push[pid]` | `platform` 34445 | `ppos` 11675-11676 — **not** by `v19Standing` |
| `st.aiPacts[pid]` | `pact` 34460 | `v16PactPartner` 34609; election application 35545; expiry 12005-12007 — **not** by `v19Standing` |
| `st.v11.con.pending` | `v17ArticleCore` 38347 (article card 34480) | the amendment clock — **not** by `v19Standing` |
| `st.capital` | dozens of player paths | `v17Utility` 13708 at weight .5 — for **every** party, including engines |

---

## What I could not verify

- **The `attack` target push.** `V19_RIVAL_PUSH × read` at 34392 is a second
  rivalry channel that my probes did not measure; my 1.3%/3.5% figure is about
  the **chooser** only. Whether the opponent model is felt through `attack`'s
  aim is a separate measurement.
- **`v19Pivot` / `v17AiFloorFor` quality.** I confirmed `.sim` gates the target
  choice (38480) and read the bodies, but did not measure whether the pivot
  search picks better bills than the fallback. MAP.md 2181-2187 reports a
  one-seed measurement of it; per CLAUDE.md's own one-seed ruling that figure
  is not quotable.
- **Whether an engine government's crisis choices can actually move
  `st.capital`.** The +0.5 term is live in `v17AiDecide` only if some `ch.f`
  writes capital. I did not enumerate the crisis choice functions.
- **`fp`'s poverty weight.** I report the boundary (`home.e === 0` is not
  `< 0`) as a fact of the code and a measured consequence. Whether the centre
  party counting poverty lightly is intended is the owner's to say.
- **Distribution of `foeAt` above 0.8.** `v19Rivalry` can in principle sum
  clauses to ~2.95 against the player, which would make `Math.min(1, foeAt)`
  bind. It did not occur in 4,393 evaluations across six seeds at four levels;
  I cannot say it is unreachable, only that it was not reached.
- **Behaviour at 120+ sessions.** Everything here is 30 sessions per seed. Goal
  turnover, purse inflation and the late-campaign board could move the purse
  and recency shares; the goal/temperament/simulation ratios are structural and
  will not.
