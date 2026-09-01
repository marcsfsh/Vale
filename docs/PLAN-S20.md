# S20 — The chamber, the cost, and the opposition

The program anchor. `docs/STATE.md` says which slice is current; this file holds
the owner's brief, the evidence, the rulings and the slice list.

## The brief

The owner played a full epic campaign to turn 133 on `easy` with `aiLevel:
ruthless` and sent the save. Their words, verbatim:

> "of the mechanics engaged with (i did not bother with executive orders), which
> ones under performed, overperformed, were too costly, too cheap & inneffective
> (not jst cheap; it was on very easy mode which is meant to be a bit of a cake
> walk), which areas were not properly or proportionally impacted, which areas
> were underutilized"

> "bills almost always pass unless you have a supermajority and kill it - even if
> you have a supermajority. if you oppose a bill, the higher the party unity, the
> more members oppose the bill in the assembly. it seems like it is not properly
> accounting for actual number of assembly votes - things without a majority
> still pass."

> "there needs to be more ways to both negatively and positively impact a bill in
> terms of its support, each of which categorized as supporting or opposing.
> after opposing, 3 options appear for various ways to increase opposition,
> within your party, with other parties (who are not the party who proposed it),
> and with both. same for if you support it - 3 ways to increase support."

> "very easy mode should not make it so that it is incredibly easy to build a
> landslide unopposable government within the first few elections. very easy mode
> should make it feel easy to play the game at a high level at a continued pace
> (assuming all of the benefits and more of a highly skilled player, without
> assuming the difficulty required in in doing so)."

> "make a massive pass at upgrading the AI behavior to be extremely well rounded,
> on a scale of AI behavior, current level is 1 of 10. your pass should take it
> to an 8-10/10."

## What the save says, measured

Read with `python3`, not by eye. Every figure here is from the owner's own file.

| | |
|---|---|
| Sessions played | 132 (turn 133, epic, `endYear` 2224) |
| Seats | **LP 1260 of 1305** — RSF 7, SD 7, FP 12, CUP 1, TVC 8, PNL 10 |
| Elections won | 37 · years governing 131 · years in opposition **1** |
| Laws | 1063 · player's laws 1049 · bills failed **19** |
| Bill pass rate | **98.2%** |
| Total action clicks | **683 across 132 sessions** |
| `poach` | **411 clicks — 60.2% of everything the owner did** |
| Top four verbs | poach 411, organise 67, cabinet 51, gerry 48 = **84.5% of all play** |
| The other 44 verbs used | 106 clicks between them |
| Opposition `machine` | −0.666 … −0.737 against a clamp of **−0.8** (saturated) |
| `liberties` | 59 → **100 (capped)** |
| `economy` | 50.5 → **100 (capped)** |
| Approval / unrest | 86.7 / 5.9 · highest approval 97 · growth 6.8 |

The shape of the run is one verb, pressed 411 times, against six parties that
never recovered, under a difficulty setting that made the chamber a formality.

## Findings that are already certain (read from the code, not inferred)

1. **Nothing was ever counted.** `billForecast` returned a seat-weighted MEAN OF
   PROPENSITIES — each party contributing `seats × support/100` — so a party at
   45 handed the bill 45% of its seats instead of voting against it. Then eleven
   modifiers were added to that number AFTER normalisation, summing to more than
   60 points against a bar of 50: the chamber's composition was the smaller half
   of its own division. Demonstrated: three parties holding 70% of the seats,
   all opposed, gave **56.5% → PASSES** under the old arithmetic.
2. **On `easy` no bill could fail, at any stage, ever.** Five hard floors in
   `advanceBills` (`roll = Math.max(68, roll)` and friends) sat ABOVE every bar
   they were compared with — committee 72 vs bar 43, assembly 68 vs 50, council
   68 vs 50, senate 66 vs 50, decree 68 vs 50 — and a sixth floored the ASSENT
   vote at 72 against a bar of 55. Easy did not tilt the game; it removed the
   legislature.
3. **The party board has no tempo.** 68 actions in the file carry a `cool:`
   cooldown and 9 carry an `esc:` escalating cost. Of the **23 per-party
   political actions — `poach`, `audit`, `debate`, `discredit`, `split`,
   `absorb`, `blackmail`, `cutFunding`, `prosecute` and the rest — not one has
   either.** `poach` costs a flat 8, its only precondition is that the target is
   not banned, and it pushes +6 mood onto every bloc the target owns. It is
   repeatable against all six parties every session for ever. That is the 411.
4. **The constitution carried the same defect one layer up.** `v11ArtForecast`
   was a second copy of the mean-of-propensities design with its own easy-mode
   override, so an article and a bill put to the same chamber on the same day
   were decided by different arithmetic.

## What the six-way audit found

Six specialist audits (save data, the division, difficulty, engagement, dead
subsystems, AI depth, opposition verbs), each finding adversarially verified.
The ones that shape the slice list:

**The chamber.** Passage was a score against a threshold and the card printed a
seat count beside it and ignored it. Eleven modifiers were added after
normalisation, worth up to +96 against a bar of 50. `st.unity` is written in
about fifty places and read by the voting path in none, so no party ever voted
as a bloc. Divisions were recorded and printed **above 100 per cent** — 14 of
the 50 votes in the owner's own save. Five advisory surfaces call 48 "the
passage line" when the bar is 50.

**Difficulty.** Six overrides made outcomes unconditional, not easier. Beyond
those: `capFloor:150` is unreachable from above, so thirteen terms of
`capitalIncome` are dead; `noCollapse` deletes both loss conditions; `rev:2 /
exp:.55` is a 3.64x fiscal swing that outweighs the entire tax code; `unrest
x.35` puts the whole street and movement layer below its own threshold, which
is S17q's defect reproduced by a difficulty multiplier; `polCost .4` with the
`max(1)` clamp collapses every base cost of 1, 2 and 3 to exactly 1. Easy is
also the tier with the LEAST content — the lowest arc chance of the five, and
70% of every bad event erased. **And no harness measures easy at all**:
`roads.js` deliberately switches away from it and `pacing.js` cannot select a
difficulty.

**The economy of clicks.** Capital sat on its 750 ceiling for 94 of 132
sessions, throwing away at least 14,100 capital. Escalation and cooldown exist
almost entirely on actions the owner never used, while the family that took 79%
of the clicks has neither. `gerry` bought a boundary advantage of 0.41% over 48
clicks because the player's own statutes cancel it faster than the button buys
it. Six of eight blocs hit 100 by session 6. **A parallel action economy of 73
spend sites has no use counter at all**, so `st.uses` cannot even see it.

**What was never touched.** 38 of 76 actions were open and unused across 133
sessions. The Order Book had 81 of 90 orders open and affordable and **zero
signed**, buried 11.4 phone screens down. Zero scandals, because the risk
formula's dominant term is dead below corruption 48 and this run's mean is 8.3.
Zero referendums, **because on easy the houses pass everything the referendum
exists to bypass**. Zero committee hearings. Question Time offered 133 times and
taken 4. The statute ladder is played as binary: 226 statutes at rung 4, 345 at
rung 0, eleven anywhere in between. And a real bug: `v15CampaignSeats` replaces
`st.interests` during the render, so the interest-group meeting counter never
persists.

**The AI, measured rather than argued.** The engine's decision surface is 11
cards with no target choice — **2.1% of the player's pressable options**. No
engine can enter a government, take an office, dissolve, or call a referendum,
and two of the seven S19 goals are about exactly that. The player is invisible
to the opponent model: in 2,160 rival reads the human was named **zero** times.
The posture filter deletes the goal's best card before the chooser ever scores
it, on 80.4% of goal-sessions. Grudge saturates at its clamp and takes S19f's
whole reaction layer with it — 150 poaches produced 0 reactions. 94% of the
bills an engine lays come from two pre-S19 coin flips rather than the chooser.
Engine purses sit at 97% of a hard 2,000 cap against a dearest card of 42, so
money constrains nothing. **This is the answer to the owner's 1/10: S19 made the
AI choose well and never gave it anything to choose from.**

**And two defects in S20a's own first draft, caught by the audit.** The
discipline step made one support point worth either 0.1 or 9.4 chamber points
and nothing in between, so the six persuasion verbs S20b is about would have
landed at random — replaced with a logistic hinge (`V20_BLOC`), measured at a
continuous 10.3x spread across the range with the largest effect on a
knife-edge vote. And `bill.floorWork` was still being added to the aye share
after the count in a `pv5` wrapper one layer downstream, at a chamber point per
point — this slice's own defect, surviving in the place it was least visible.

## Rulings

- **R1 — The number on the card is a count of seats.** `lower` and `upper` are
  the aye share of an actual division. Sixteen readers compare them against ~50
  and every one becomes more correct for free.
- **R2 — Difficulty tilts, it never overrides.** No floor may sit above the bar
  it is compared with. Easy means a skilled player's run, not an uncontested
  one: the levers stay real and the player is simply better at them.
- **R3 — One surface, one rule.** Bills and constitutional articles are put to
  the same houses and are counted by the same function.
- **R4 — A verb that can be pressed every session for ever is not a decision.**
  Anything on the per-party board gets a cooldown, an escalating price, or a
  precondition that can close.
- **R5 — The AI pass builds on S19, it does not redo it.** S19 shipped goals,
  rehearsal, opponent modelling, reachable aims, manifesto voting, temperament
  and reaction. The owner's 1/10 is a verdict on a build that predates most of
  it. What S20 owes is the part S19 never touched: what an engine party can
  DO.

## Slices

- **S20a — The division is counted.** SHIPPED. `divisionOf` walks a house seat
  by seat and splits each party by `partyDiscipline`, derived from
  `factionAverage` and `st.unity`; `billPull` moves named parties rather than
  the total; the six easy-mode overrides are gone and difficulty tilts instead;
  `v11ArtForecast` goes through the same count. Assertion `the division is
  counted`, eight arms, **thirteen poisons from the diff, all thirteen redden**
  — four of them only after the arm was given the reading it was missing.

  **Known residue, recorded rather than fixed silently:** `pv5BillForecast`
  still adds `(c.expertise - 50) * .025` to the aye share after the count. It
  is the same shape as `floorWork` at a twentieth the size (±1.25 at the
  extremes) and the committee it reads is not in scope at `billPull`. S20b
  moves it or states why it stays.

  **Five S19 arms were reshaped, every one because a deep change to the
  legislature exposed a statistic that was measuring the wrong thing.** The
  manifesto clock's sample was six seeds and read 2 of 4 as "the exception"
  (widened to twelve: 5 of 19). The patience arm correlated six parties'
  durations against six authored patiences, which is confounded by how often a
  party is READ — it read -.18 on a clean control the day it was written and
  S20a sharpened it to -.64, so it is a PAIRED lift now, each party against
  itself. S19f's lag was a mean over a long-tailed distribution where one
  straggler at 12 sessions moved it by a whole session, so it is the SHARE
  answered in the session (.42 → .75). The declared-line arm bounded a small
  party's swing at 1.5 points when a real division makes it worth up to its
  seat share, so it asserts PROPORTIONALITY instead — .400, .396, .397 points
  per point of the chamber. And the `said` probe read a capped log by index and
  reported a line missing that the game was writing correctly; it wraps the
  emitter now.

  **And S19f's reaction was found dead in the case that matters most.** It read
  a RISE in the grudge, the grudge clamps at 100, and a player who presses one
  verb repeatedly pins it there — the owner's save has 411 poaches and every
  opposition machine at the clamp, measured by the audit at 150 poaches for 0
  reactions. A running tally was the first fix and was worse (ten slights of
  one point assembled into a reaction the bar exists to refuse: 225 → 1,637,
  with 313 borrowed goes unpaid). The ACT is stamped now, with a cooldown of
  eight sessions so a party cannot answer faster than it can pay the go back.
- **S20b — A position can be pressed home.** SHIPPED. `bill.pull[pid]` is the
  one new field, read in `billPull` and counted through seats; three scopes
  (own benches, the other parties bar the sponsor, both) each write it plus a
  second already-read channel, meter their price per bill, and are refused
  before they are paid for. From the bench a position is worth 9.9 Assembly
  points and the verbs a further 15.3, against the -5.3 the whole kit managed
  before. Assertion `a position can be pressed home`, seven arms, **twelve
  poisons from the diff, all twelve redden**.
- **S20c — The party board has a tempo.** Cooldowns, escalating prices and
  closable preconditions across the 23 per-party verbs, `poach` first.
- **S20d — Easy is a cakewalk, not a coronation.** What the setting means after
  R2, measured against the arc the harness plays.
- **S20e onward — The AI pass.** Scoped by the audit; the gap is what an engine
  party can DO, not how it chooses.

## The instrument rule this program inherits

S19's last lesson applies to every number in this file: **quote the six-seed
mean, never one seed**, and treat a gap smaller than one build's own spread as a
reshuffle. `tools/pacing.js` prints the mean and refuses to call a single-seed
run quotable.
