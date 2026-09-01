# harness — what is already asserted about the AI

## What it does today

`tools/roads.js` is 12,006 lines and holds **196 `say(` call sites** which print
**200 assertions** (the ladder loop at line 1237 fires five times). I ran it on
the current working tree for this report: **200 ok, 0 FAIL, `real 16m40s`**,
assertion-name list identical to the 11:00 log
(`scratchpad/roads-final.txt`, build `c7f7236`). Of those 200, **twenty-six** have AI behaviour
as their subject; the S18e–S20g block (lines 8486–11992) is nine of them and is
where roughly all the runtime goes. Every one of those nine is a *driven*
assertion — it calls `endTurn()` in a loop over pinned seeds and reads the
result through the game's own path — and each one carries between four and ten
numeric gates that an S21 change can move without touching the mechanism the
gate is named after.

The rule this file has learned the hard way and encoded everywhere: **a gate is
a conjunction of independent readings, several of which are calibrated
distributions rather than logical facts.** Nine of the numbers below were set by
measuring the shipped game, and moving the game moves them.

---

# 1. Every assertion, by line

## 1a. The complete list (196 `say(` sites)

Format `line — name`. Names are as printed by a real run.

| # | line | name |
|---|---|---|
| 1 | 93 | fresh republic measures zero |
| 2 | 94 | measures locked for the centre |
| 3 | 161 | four rungs on every statute |
| 4 | 167 | the full build is unchanged |
| 5 | 171 | every rescaled rung is exact |
| 6 | 175 | nothing points off the ladder |
| 7 | 185 | twenty-four to a category |
| 8 | 206 | the top of the ladder is unmoved |
| 9 | 211 | no rung repeats the one below |
| 10 | 385 | every region goes to the ballot |
| 11 | 389 | the ballot year does not recede |
| 12 | 392 | one year a session, once |
| 13 | 398 | the whole cast ages |
| 14 | 402 | no two works share a name |
| 15 | 404 | no two officials share a name |
| 16 | 414 | the raise stays on very easy |
| 17 | 419 | the bench is named on arrival |
| 18 | 491 | an outright majority is distinct |
| 19 | 495 | another party's bill has controls |
| 20 | 497 | the levers scale with standing |
| 21 | 511 | a line is worth what its party is |
| 22 | 518 | the kill is gated where it acts |
| 23 | 596 | the order book is stocked |
| 24 | 598 | every order is an order |
| 25 | 602 | orders bend targets, not stocks |
| 26 | 606 | an order dies with its department |
| 27 | 608 | the order book is national |
| 28 | 655 | forty-eight works, every region |
| 29 | 658 | how it is built is what it gives |
| 30 | 695 | the chamber decides the chairs |
| 31 | 699 | chairs are yours when you lead |
| 32 | 812 | war needs somebody to be hostile to |
| 33 | 816 | nobody is allied and at war |
| 34 | 818 | war annuls every treaty it contradicts |
| 35 | 821 | eleven powers, none of them NaN |
| 36 | 825 | a treaty does what its card says |
| 37 | 831 | a war won at the table counts |
| 38 | **834** | **a party varies what it demands** |
| 39 | 956 | the despatch box has more than one sentence |
| 40 | 980 | the red box has more than a fortnight in it |
| 41 | 1088 | what you build in a region reaches the chamber |
| 42 | 1096 | the federation is something you can lose |
| 43 | 1172 | the record deck is stocked and every line can be read |
| 44 | 1178 | the record costs what it says and no more |
| 45 | 1185 | a session picks its question without spending a die |
| 46–50 | 1237 | ladder: toCentral / toExecutive / toEmergency / toOneParty / toEmpire |
| 51 | 1251 | the confirmation ritual |
| 52 | 1268 | the reckoning waits for elections |
| 53 | 1270 | the restoration road back |
| 54 | 1292 | terminal means terminal |
| 55 | 1314 | tier 1 opens by the state |
| 56 | 1315 | tier 2 opens by precedent + apparatus |
| 57 | 1335 | the franchise is weighted |
| 58 | 1454 | thirty-six more, and none of them gated |
| 59 | 1460 | eighteen more, every one of them national |
| 60 | 1466 | a narrowed order is a smaller order |
| 61 | 1474 | an order cannot outrun the book |
| 62 | 1477 | a bill lapses with its prerequisite |
| 63 | 1491 | the constitution holds the totals |
| 64 | 1493 | the charters keep their seats |
| 65 | 1535 | road 2: the Chartered State |
| 66 | 1537 | the syndicate statute book |
| 67 | 1539 | road 2 comes home |
| 68 | 1582 | every road event constructible |
| 69 | 1609 | both arcs trigger |
| 70 | 1610 | no test throws, no note leaks |
| 71 | 1612 | the registries carry the content |
| 72 | 1739 | forty articles, eight books |
| 73 | 1742 | the calendar reduces to what it was |
| 74 | 1749 | no article can put a NaN in the ballot |
| 75 | 1754 | every article moves something named |
| 76 | 1763 | an entrenched article resists repeal |
| 77 | 1768 | ratification is a vote, and it can fail |
| 78 | 1774 | the Senate can block an act that is not about the Senate |
| 79 | 1952 | a briefing is never refunded |
| 80 | 1957 | the college beats waiting |
| 81 | 1961 | a briefing does not undo the college |
| 82 | 1964 | sidelining a rival no longer guts the government |
| 83 | 1969 | an initiative outlives the session that bought it |
| 84 | 1973 | a department is a line in the budget and a number in the country |
| 85 | 1977 | every trait on a card is read somewhere |
| 86 | 1981 | influence is no longer a constant |
| 87 | 1984 | the relation and the bloc are no longer a circle |
| 88 | 1989 | an endorsement buys three things and survives its ballot |
| 89 | 1994 | the organisations reach the regions |
| 90 | 2052 | every rung that speaks says something of its own |
| 91 | 2066 | very easy pays a floor, and nothing else |
| 92 | 2070 | every core book reads twenty-four |
| 93 | 2202 | the order book has no cap |
| 94 | 2210 | every order shall expire |
| 95 | 2216 | a week on the table |
| 96 | 2224 | no order before a ballot |
| 97 | 2229 | the register exposes the book and the opinion shields it |
| 98 | 2235 | the order book reaches the chamber model |
| 99 | 2365 | a working republic is unchanged |
| 100 | 2374 | an abolished Assembly is not in the way |
| 101 | 2381 | a suspended Assembly is a council |
| 102 | 2387 | one chamber left is still a chamber |
| 103 | 2397 | a decree still has to be carried out |
| 104 | 2404 | no bill dies in a committee that does not exist |
| 105 | 2410 | a One Party State is not voted down by its Senate |
| 106 | 2557 | ten berths, and a rung for every tier |
| 107 | 2572 | very easy earns its income |
| 108 | 2584 | the works are charged at the tier rate |
| 109 | 2597 | ten works do not eat very easy |
| 110 | 2604 | what you commission past the berths waits |
| 111 | 2611 | the country notices its first canal |
| 112 | 2618 | the works panel can be asked a question |
| 113 | 2801 | the clock is the chamber arithmetic |
| 114 | 2813 | a bill both houses carry takes two sessions |
| 115 | 2820 | the fourth pip lights |
| 116 | 2828 | four ways to answer, not two |
| 117 | 2842 | the office is a person, and loyalty |
| 118 | 2853 | a refusal is beatable, and not for free |
| 119 | 3033 | eighty-one articles, and the offices book |
| 120 | 3043 | three at a time, and they resolve apart |
| 121 | 3052 | two roads, two clocks, two juries |
| 122 | 3058 | the plebiscite is open where nothing else is |
| 123 | 3066 | a convention is an event, not a discussion |
| 124 | 3075 | an old save keeps the article it was waiting on |
| 125 | 3083 | the Equal State weighs the return |
| 126 | 3090 | the card names the house that is there |
| 127 | 3253 | every party has money of its own |
| 128 | 3264 | the nation does not fund your party |
| 129 | 3271 | the card is priced in the money that pays for it |
| 130 | **3283** | **party money reaches the ballot** |
| 131 | 3290 | the law the owner meant |
| 132 | 3296 | the balance line adds up |
| 133 | 3303 | the capital panel adds up to its own total |
| 134 | 3422 | every party has a book of its own |
| 135 | 3431 | a locked book is still a book |
| 136 | 3439 | the measures build the apparatus that opened them |
| 137 | 3445 | a measure stands for something |
| 138 | 3454 | the unrest is authored |
| 139 | 3463 | the panel can be asked a question |
| 140 | 3550 | the machine is counted once |
| 141 | 3560 | the campaign and the organisations are worth seats |
| 142 | 3566 | the caucuses reach the vote |
| 143 | 3572 | nothing the player buys is discarded in silence |
| 144 | 3581 | the page says what each of them is worth |
| 145 | **3696** | **the office is won by a person** |
| 146 | 3705 | the Article of the Limited Term limits a term |
| 147 | 3712 | incumbency belongs to the person |
| 148 | **3718** | **the executive ticket can be aimed and is paid for by the party** |
| 149 | **3726** | **ambition reaches past its own portfolio** |
| 150 | 3837 | the Foreign Office reaches eleven capitals |
| 151 | 3845 | Expand the Northern Alliance expands the Northern Alliance |
| 152 | 3852 | a capital can say no |
| 153 | 3861 | a guarantee runs in both directions |
| 154 | 3869 | the cards about the Alliance touch the Alliance |
| 155 | 3927 | every dispatch can be answered |
| 156 | 4102 | a start of your own |
| 157 | **4309** | **the six that are not yours act** |
| 158 | 4392 | you lead one party for the campaign |
| 159 | 4506 | the Foreign Office reaches every capital |
| 160 | 4655 | a treaty is a relationship, not a slot |
| 161 | 4783 | every session clock charges what it prints |
| 162 | 4919 | the seven defects stay fixed |
| 163 | 5083 | a private member's bill |
| 164 | 5122 | the three chairs |
| 165 | 5256 | whose desk it lands on |
| 166 | 5312 | a free name is always found |
| 167 | **5383** | **a voice out of office** |
| 168 | **5442** | **the coalition in writing** |
| 169 | **5481** | **nobody holds two great offices** |
| 170 | **5600** | **a plurality is not a government** |
| 171 | **5725** | **a caretaker holds office and does not govern** |
| 172 | **5781** | **the house removes a government** |
| 173 | **5909** | **live up to it, alter it, betray it** |
| 174 | 6078 | the calendar tells the truth |
| 175 | 6211 | four voices in every hall |
| 176 | **6392** | **always running** |
| 177 | **6550** | **verbs are the buttons' functions** |
| 178 | **6697** | **a party remembers what was done to it** |
| 179 | 7078 | the document says one thing at a time |
| 180 | 7260 | the elections and federalism books reach the model |
| 181 | 7459 | the foreign and defence books reach the model |
| 182 | 7628 | the court can stop you |
| 183 | 7859 | the street has leverage |
| 184 | 8149 | the floor is open to every chair |
| 185 | 8339 | no control lies, in any chair |
| 186 | 8463 | the papers know which chair you sit in |
| 187 | **8754** | **a party moves when it has a reason to** |
| 188 | **9091** | **a party is after something** |
| 189 | **9450** | **a party knows who is in its way** |
| 190 | **9720** | **a party can reach what it is after** |
| 191 | **10022** | **a party votes its own manifesto** |
| 192 | **10308** | **the parties have characters** |
| 193 | **10659** | **a party does not wait for the season** |
| 194 | **10999** | **the division is counted** |
| 195 | 11228 | a position can be pressed home |
| 196 | 11323 | the party board has a tempo |
| 197 | 11456 | easy is a cakewalk, not a coronation |
| 198 | **11622** | **the engine plays the player** |
| 199 | **11958** | **the verb reads the aim** |
| 200 | 11999 | no number went bad on any road |

**Bold = AI behaviour is the subject.** Twenty-six of them.

---

## 1b. The AI arms in full — what each pins, and every numeric gate

Each entry gives the assertion NAME, the probe's line span, the seeds and
session counts it drives, and the complete conjunction as it is written. A
number in `code` is a literal in the gate; an S21 change that moves the measured
quantity past it turns the arm red.

---

### `a party moves when it has a reason to` — S18e, probe 8498–8747, gate 8748–8757

**Pins:** the per-session initiative BUDGET is unchanged while the SPREAD of who
acts has opened; four circumstance terms in `v18TempoOdds` each move the odds in
the right direction; a coalition partner with a grudge attacks from inside the
ministry; the `attack` card writes a grudge into the target's ledger; the
Parties panel prints the true odds; and the tempo die is drawn for every party
before any skip.

Seeds: `20260829` for (a), (f), (g); **five seeds** `[20260829, 771144, 424242,
999331, 5150]` × 60 sessions for (b); `4242` for (c); `771144` × 40 for (d);
`424242` × 60 for (e). **Level: whatever `newGame` gives (default
`purposeful`).**

| gate | reading |
|---|---|
| `ai.budgetHeld` | `Σ v18TempoOdds` over live parties equals `live / V16_AI_CADENCE` to within **`1e-6`**, on 12 consecutive sessions |
| `ai.totalHeld` | mean of 5 seeds within **`10%`** of `60 × budget` |
| `ai.spreadOpen` | max−min initiatives per party **`>= 4`** on **every** seed |
| `ai.termsMove` | `rich > flat && broke < flat && angry > flat && losing > flat` (purse 900 / 0, `v16Resent` 90, `lastSeats + 40`) |
| `ai.restive.posture === 'restive'` | exact string |
| `ai.restive.cardOpens`, `ai.restive.contentRefused` | attack `can()` true when restive, false when content |
| `ai.restive.fromInside > 0`, `fromOutside > 0` | both non-zero over 40 sessions |
| `ai.attacksPlayed > 0` | `attack` played at least once in 60 driven sessions |
| `ai.memory.rose`, `ai.memory.chosen` truthy | grudge of the chosen target rises across one real `attack.run` |
| `ai.memory.playerLedgerUntouched` | player's own `grudge` object byte-identical |
| `ai.panel.hasColumn`, `!saysOneASession`, `printsAnOdds`, `matchesModel` | regexes on `v16AiPanel()`; shown % within `1` of `100 × v18TempoOdds` |
| `ai.dice.drawnBeforeTheSkip` | `allBanned === PARTIES.length` **exactly**, `noneBanned >= PARTIES.length` |

**S21 hazards:** raising `V16_AI_CADENCE` or adding any un-normalised weight to
`v18TempoOdds` breaks `budgetHeld` at 1e-6. Adding a new posture that closes the
`attack` card to a restive partner breaks `fromInside > 0`. **Any new call to
`rand()` inside `v16AiTurn`'s per-party loop breaks `dice.allBanned ===
PARTIES.length`.**

---

### `a party is after something` — S19a, probe 8793–9077, gate 9078–9090

**Pins:** every `V19_GOALS` entry's `worth` table names only cards the deck
carries; `instinct` reproduces the old uniform draw *exactly*; goals are held at
levels above instinct and never at instinct; a goal is kept rather than
re-picked; a reached goal is put down; `v19Outcome` discriminates between cards
and ranks them differently for different parties; the rehearsal spends the
clone's dice; and **both the goal term and the simulation term measurably steer
`v19Choose`'s real picks**; and the `floor` card is played only against the
arithmetic at levels that think.

Seeds: `4242` (b, g); `20260829` × 60 at four levels (c); `20260829` × 60 for
`steer` at two levels; `20260829` × 80 for `floor`; `771144` × 30 (d); `5150`
(e); `20260829` × 8 / × 4 (panel). **Single-seed throughout.**

| gate | reading |
|---|---|
| `think.goalGaps.length === 0` | no goal names a card the deck lacks; its top-worth card exists |
| `think.goalCount >= 6` | `V19_GOALS.length` (currently 7) |
| `think.instinct.sharp === 0` | `V19_LEVELS[0].sharp` |
| `think.instinct.mismatches === 0`, `tried > 200` | `v19Choose` == `open[floor(rand()*n)]` over every open-set size 1..11, 40 trials each (440 trials) |
| `byLevel.instinct.withGoal === 0` | no goals at instinct |
| `byLevel.{purposeful,shrewd,ruthless}.withGoal === .acts` | **every** initiative at those levels carries a goal |
| `byLevel.shrewd.goals >= 4` | at least 4 distinct goal kinds in 60 sessions |
| `think.hold.rate < .25`, `samples > 100` | goal change rate per party-session |
| `think.retire.changed` | driving `build` to done yields a different goal |
| `think.sim.distinct >= 7` of 11, `spread > .05` | `v19Outcome` separates ≥7 of 11 cards |
| `think.sim.distinctOrders >= 3`, `orderSpread >= 6` | 4 parties give ≥3 distinct full orderings; furthest pair ≥6 places apart |
| `think.sim.untouched`, `think.sim.flagged` | rehearsal leaves `rngState/capital/pol/purse/blocs/machine` identical; `V19_SIMULATING` up during, down after |
| `think.steer.purposeful.goal < .42` | mean normalised rank of the pick by the GOAL's own order (uniform = .5) |
| `think.steer.shrewd.sim < think.steer.purposeful.sim - .05` | the rehearsing level picks better by the rehearsal's order, by ≥.05 |
| `steer.purposeful.goalN > 20`, `steer.shrewd.simN > 20` | sample floors; the probe CAPs collection at 40 per level |
| `think.floor.sharp.n > 0 && sharp.against === sharp.n` | **every single** `floor` play at `shrewd` is on a bill going against the party |
| `think.floor.dumb.n > think.floor.sharp.n` | `purposeful` plays it more often |
| `think.floor.dumb.against < think.floor.dumb.n` | and not always against |
| panel | `/What they are after/`, aims regex `/Carrying \|Repealing \|Taking the \|Getting into\|Bringing down\|Winning over\|Building the/`, `/<span class="muted">\d+%<\/span>/`, `/Acting on instinct/` |

**S21 hazards:** this is the most brittle arm in the file.
`think.floor.sharp.against === think.floor.sharp.n` is an **all-or-nothing**
count over 80 driven sessions — one `floor` play on a favourable bill reddens
it. The panel aims regex is a **hand-kept list of seven sentence stems**: a new
goal whose panel line does not start with one of them makes `panel.aims` no
larger but does not fail — however a RENAMED existing line fails silently
upward. `goalCount >= 6` will not catch a goal added without a panel sentence.

---

### `a party knows who is in its way` — S19b, probe 9143–9425, gate 9427–9449

**Pins:** every deck card carries a `V19_RIVAL_WORTH` weight and no weight names
a ghost card; `v19GoalSeen` reads without adopting or rolling while `v19Goal`
does both; the `oust` clause is asymmetric and the `ground`/`office`/`enter`
clauses are symmetric both ways round; the rivalry term changes the RANKING and
only at `shrewd` and above; the `attack` card lands on the rival rather than the
government; the record reaches the page; the term reaches a real `v19Choose`
pick, measured as an in-process A/B; and `V19_RIVAL_PUSH` sits between the 90th
and 99th percentile of the grudge distribution measured in the same run.

Seeds: `4242` (b–f); **four seeds** `[90210, 4242, 31337, 8080]` × 120 (g);
**fourteen seeds** `[4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618,
4001, 60613, 8675309, 31415]` × 100, run **twice** (weights off / on) for (h);
**four seeds** `[31337, 4242, 90210, 555]` × 60 for (i).

| gate | reading |
|---|---|
| `rival.uncovered.length === 0`, `ghostWeights.length === 0`, `deckN >= 10` | covered surface over `V16_AI_DECK` |
| `seenMade === 0`, `seenRoll === false` | 20 `v19GoalSeen` calls per party create nothing and roll nothing |
| `goalMade === true`, `goalRoll === true` | the contrast: `v19Goal` does both |
| `aimedBefore === 0`, `aimedSeen < 0`, `aimedOwn === 0` | exact zeroes on two of three |
| `sym[k].ab < 0 && ab === ba && apart === 0` for `ground`, `office`, `enter` | exact equality both directions; falls to exactly 0 when aims differ |
| `rank.instinct.gain === 0`, `rank.purposeful.gain === 0` | **exact zero** at the two lower levels |
| `rank.shrewd.gain > 0`, `rank.ruthless.gain > rank.shrewd.gain` | monotone in `read` |
| `target.instinct.hit === ruling`, `target.ruthless.hit === rival` | the `attack` card's real target |
| `panel.written > 0`, `panel.inTheWay === true`, `panel.acts > 30` | over 4 seeds × 120 |
| `pick.foeN >= 50`, `pick.calmN >= 200`, `pick.heavyCards >= 3` | sample floors; "heavy" = `V19_RIVAL_WORTH >= .45` (currently `organise`, `court`, `attack`, `floor`, `bill` = 5) |
| `pick.onFoeGain > .02` | absolute lift on foe-boards |
| `pick.onFoeGain > 1.8 * abs(pick.onCalmGain)` | **S20f recalibration** — was `3x` on 8 seeds, is `1.8x` on 14 |
| `scale.foeN > 20`, `scale.p90 !== null` | sample floor |
| `scale.worth > scale.p90 && scale.worth < scale.p99` | `V19_RIVAL_PUSH × median foeAt` sits between the 90th and 99th percentile of grudges measured in this run |

**S21 hazards:** `heavyCards >= 3` reads `>= .45`; adding cards with low weights
is fine, but re-tuning the table below .45 breaks it. `scale.worth` between p90
and p99 of the *grudge* distribution is the tightest coupling in the file: **any
S21 change that moves grudge magnitudes moves p90/p99 and can push
`V19_RIVAL_PUSH × typical` outside the window without touching rivalry at all.**

---

### `a party can reach what it is after` — S19c, probe 9499–9707, gate 9709–9719

**Pins:** every authored goal is adopted by somebody in real play; an engine can
lay a private member's bill and it is paid from the party purse, never
`st.capital`; the government is refused the card at `can`; `charter` resolves to
a real article; a `carry` aim is exactly one rung from where the statute stood
and one rung closes it; the card never lays a second bill for a party already
holding one; and the `bill` card is picked more often when the party's goal is
`carry`.

Seeds: **fourteen** × 100 for (a); `4242` (b,c); `90210` (d); `31337` × ≤40 (e);
**five** `[4242, 90210, 7, 31337, 555]` × 60 for (f); **ten** `[4242, 90210, 7,
31337, 555, 8080, 1234, 99, 271828, 161803]` × 100 for (g). Level `shrewd`.

| gate | reading |
|---|---|
| `reach.neverAdopted.length === 0` | **every** one of the 7 goals is adopted at least once across 14 seeds × 100 |
| `reach.goalKinds.length >= 7` | `V19_GOALS.length` |
| `reach.hasCard === true`, `reach.billsLaid > 20` | ≥20 non-government bills from engines |
| `Object.keys(reach.billSponsors).length >= 2` | at least two distinct sponsors |
| `ranCard.laid === 1` | **exactly one** bill from one `bill.run` |
| `ranCard.capitalMoved === 0` | **exact zero** — the player's capital is untouched |
| `ranCard.purseMoved > 0`, `ranCard.said === true` | paid from the purse, returns a line |
| `canRuling === false`, `canPartner === false` | government and partner both refused at `can` |
| `charter.fits > 0`, `charter.target === charter.fits`, `charter.realArticle === charter.target` | every opening resolves to a real `V11_ART` id |
| `rung.checked === 1`, `rung.oneRung === 1`, `rung.closes === true` | the sampled `carry` aim is 1 rung away and one rung closes it |
| `carryGaps.length > 10 && carryGaps.every(g => g === 1)` | **EVERY** `carry` adoption across all 14 seeds has a gap of exactly `1` |
| `cardRuns > 20`, `laidWhenHolding === 0` | **exact zero** breaches of the one-at-a-time rule |
| `steer.carryOpen >= 40`, `steer.otherOpen >= 100` | sample floors (the comment records moving from 6 seeds to 10 because the sample came in at 39 against a floor of 40) |
| `steer.lift > .15` | the `bill` card is taken ≥15pp more often when the goal is `carry`, given it was open |

**S21 hazards:** `carryGaps.every(g => g === 1)` is universal over hundreds of
adoptions — any change to `carry.target` reddens it. `steer.carryOpen >= 40` is
already close to its floor and depends on how often `carry` is adopted AND on
the posture filter leaving `bill` open; **an S21 change that adds goals dilutes
the `carry` share and can starve this sample.**

---

### `a party votes its own manifesto` — S19d, probe 9757–9997, gate 9999–10021

**Pins:** `V19_MANIFESTO` moves `partyBillSupport` in both directions and the
sponsor is exempt; the board actually presents statutes the voting party's table
names; `v19BillFor` picks a bill with a better forecast than the gap picker;
`partyDemandPolicy` is not called by the bill card; the goal clock counts
PROGRESS and not age, with the stall rule separable from the cap; and the panel
says what became of a retired aim.

Seeds: `4242` (a); **four** × 100 (b); **fourteen** × 100 (c) and (d); **twelve**
`[4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613]` × 120,
run **three times** (byAge / byProgress / capOnly) for (e); `90210` × ≤140 (f).

| gate | reading |
|---|---|
| `term.agreeGain > 0 && term.opposeLoss < 0` | direction |
| `term.agreeGain >= 10 && term.agreeGain <= 20` | **fixed bounds, deliberately not `V19_MANIFESTO` itself** (currently 15) |
| `term.sponsorExempt === 0` | **exact zero** |
| `reach.named > 200` | ≥200 votes on a named statute over 4 seeds × 100 |
| `reach.agrees > 5 * reach.opposes` | **5 to 1** |
| `choice.n > 30`, `choice.gain > 1` | ≥30 real bill decisions, forecast gain ≥1 point |
| `choice.better > 3 * choice.worse` | **3 to 1** |
| `shared.demandCalls > 10`, `shared.billCalls === 0` | **exact zero** — the bill card never calls `partyDemandPolicy` |
| `shared.billUsedForecastPicker > 10` | it calls `v19BillFor` instead |
| `clock.byProgress.total > clock.byAge.total` | A/B in one process, `V19_GOAL_IDLE = 999 / V19_GOAL_CAP = 14` reproduces the old rule |
| `byProgress.afterOldClock > byProgress.total / 2` | a late completion is the ordinary case |
| `byAge.afterOldClock < byAge.total / 2` | and the exception under the old rule |
| `byProgress.meanAt > 14 && byAge.meanAt < 14` | on either side of the old flat clock |
| `byProgress.deadN > 30`, `capOnly.deadN >= 5` | sample floors |
| `byProgress.deadHeldFor < .6 * capOnly.deadHeldFor` | the stall rule cuts a dead aim's life by ≥40% against the cap alone |
| `page.said === true` | `/Put .* down\|Gave up on\|Reached what it wanted/` in `v16AiPanel()` |

**Residue worth knowing:** the `say()` detail string at 10004 and 10021 prints
`mani.term.spread`, `mani.shared.demandFollowedGap` and `mani.shared.checked` —
**none of which the probe computes any more**. They render as `undefined` in the
message. Cosmetic, but an S21 reader quoting that line would be quoting nothing.

**S21 hazards:** the clock A/B is 12 seeds × 120 sessions × **three** full runs
— the single most expensive block in the harness. Any change to `V19_GOAL_IDLE`
(11), `V19_GOAL_CAP` (60) or the stall predicate `g.best > 0` moves all six
readings at once.

---

### `the parties have characters` — S19e, probe 10059–10294, gate 10296–10307

**Pins:** every party carries a `temper` and every deck card carries exactly one
`V19_TEMPER_AXIS` entry; the characters differ; the leaning raises each party's
own-axis share of what it does, isolated as an in-process A/B; the patience
lengthens how long a party holds a DEAD aim, read as a **paired** per-party lift;
the leaning's ceiling in `v19Score` is under half the goal table's; `instinct` is
untouched; and the panel says the character only where the model reads it.

Seeds: **fourteen** × 100 run twice (`V19_TEMPER = 0` / shipped) for (c);
**sixteen** `[…, 27182, 16180]` × 120 run twice (own patience / flattened) for
(d); `4242` (f, g). **Both A/Bs hold `V19_REACT_RISE = 9999` on both sides** so
S19f's reaction cannot move the population.

| gate | reading |
|---|---|
| `partiesWithout.length === 0`, `cardsWithoutAxis.length === 0`, `ghostAxis.length === 0`, `badAxis.length === 0` | covered surfaces both ways |
| `temp.parties >= 7` | `PARTIES.length` |
| `distinctLeads >= 3`, `patienceSpread >= .5` | the table is not flat |
| `lean.parties >= 5`, `lean.rose >= 4`, `lean.meanLift > .008` | **S20f recalibration** — S19e shipped "6 of 6 at a mean of .063" on 8 seeds; the sweep gives 5 of 6 at .020 on 14 and 4 of 6 at .014 on 24, so the gate is now 4-of-≥5 at `.008` |
| `patience.n >= 5`, `patience.corrOn !== null` | sample floor |
| `patience.corrLift > .8` | **paired** lift correlates ≥.8 with authored patience (measures .955) |
| `patience.meanAbsLift > 1` | lifts average >1 session |
| `patience.corrOn > .6` | the confounded cross-party reading, kept loose deliberately |
| `subordinate.temperCeiling < subordinate.goalCeiling / 2` | `V19_TEMPER × max axis` (`.6 × .36 ≈ .22`) against `max goal worth` (1.0) |
| `floor.instinctMoved === 0` | **exact zero** |
| `abs(floor.shrewdMoved) > .1` | |
| `page.atShrewd === true && page.atInstinct === false` | six-alternative regex on `v16AiPanel()` |

**S21 hazards:** `lean.meanLift > .008` is already an order of magnitude below
S19e's published figure and is the arm most likely to be pushed under its floor
by a change that adds cards or postures. `subordinate.temperCeiling <
goalCeiling / 2` binds `V19_TEMPER` (`.6`) against the largest `worth` in
`V19_GOALS` — **lowering any goal's top `worth` below ~.44 breaks it.**

---

### `a party does not wait for the season` — S19f, probe 10381–10645, gate 10647–10658

**Pins:** the borrowed-initiative LEDGER balances and the debt is really repaid;
the charge is EARNED (a third of answers are free) rather than unconditional;
the tempo die is still drawn per party per session; the share of provocations
answered **in the session** rises; what the answering party does is aimed at the
provoker; `V19_REACT_RISE` sits above a session's cooling and below the median
real provocation, re-measured in the same run; `instinct` is untouched; and the
log line says what happens rather than promising a riposte.

Seeds: `SEEDS` = **fourteen** `[4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718,
1618, 4001, 60613, 8675309, 31415]`, driven ×120 twice per seed (reaction
off/on) in (a), ×20+≤20 in (c) twice, ×120 in (e); (b) is `4242` × 40;
**(d) uses `SEEDS.slice(0, 6)` — six seeds** × 120, twice.

| gate | reading |
|---|---|
| `budget.borrows > 40` | sample floor |
| `budget.balances === true` | `onB > 0 && onR > 0 && onO <= onB * .05 && onB === onR + onO` — outstanding debt at campaign end is ≤**5%** of borrows |
| `budget.idleOff === true` | **exact zero** borrows with the reaction off |
| `budget.reacts > 100` | sample floor |
| `budget.chargedShare < .85` | **the earned-charge reading**; measures ~.68, poison build reads .987 |
| `stream.sessions > 30`, `stream.atLeastOnePerParty === true` | ≥1 roll per party per session |
| `lag.on.n >= 6`, `lag.off.n >= 6` | sample floors |
| `lag.on.sameShare > .6` | ≥60% of provocations answered in the session |
| `lag.on.sameShare > 1.4 * lag.off.sameShare` | **1.4×** the no-reaction control |
| `lag.on.mean < lag.off.mean`, `lag.off.max >= 4` | |
| `aim.aimed.n > 300`, `aim.flat.n > 300` | sample floors |
| `aim.lift > .03` | rivalry-weighted share rises ≥3pp |
| `aim.aimed.attack > 1.2 * aim.flat.attack` | **1.2×** more `attack` plays |
| `bar.rises > 150` | sample floor |
| `bar.maxFall < bar.bar` | grudge cooling never exceeds `V19_REACT_RISE` in one session |
| `bar.bar < bar.medianRise` | the bar is below the median real provocation |
| `bar.clearShare > .85` | ≥85% of rises clear the bar |
| `floor.instinct === null`, `floor.shrewd === true` | |
| `said.found === true`, `said.promisesRiposte === false` | `/did not wait for the season/` present, `/answered at once/` absent |

**S21 hazards:** `bar.bar < bar.medianRise` and `bar.maxFall < bar.bar` are both
re-measured distributions of the GRUDGE — **any S21 change that makes grudges
larger, smaller, or cool faster moves both readings.** `budget.balances`'s
`onB === onR + onO` is an identity the comment warns about; the load-bearing
half is `onO <= onB * .05`, which is a *tail* fact about campaign endings.
`chargedShare < .85` depends on the tempo odds a provoked party already has.

---

### `the division is counted` — S20a, probe 10714–10986, gate 10988–10998

**Pins:** a chamber where 70% of seats oppose defeats the bill and the old
mean-of-propensities would have passed it; a united party votes as a bloc; a
party's swing is bounded by its seats; articles and bills go through the same
count; difficulty tilts and never overrides, driven through `advanceBills`; every
support point is worth something; and the whip/obstruction/floorWork/assent
levers reach the parties they name. **All readings stub `partyBillSupport`** —
the arm tests the COUNT, not the support model.

Seed `4242`, no driven campaigns (hand-seated chambers).

| gate | reading |
|---|---|
| `majority.hostileShare > .65`, `oldPasses === true`, `passes === false`, `share < oldShare - 10` | ≥10 points apart |
| `bloc.disciplineRose`, `bloc.fellWithCohesion` | |
| `bloc.last < bloc.first * .6` | cohesion roughly halves an opposed party's aye share (relative, not a fixed gap) |
| `bounded.allWithinSeats === true` | swing ≤ `seatShare × 100 + .5` at .05/.25/.5 |
| `oneRule.sameFn === true`, `oneRule.articleCounts === true` | article forecast sits ≥5 below the naive mean |
| `tilt.easierThanNormal`, `tilt.stillLoses`, `tilt.losesOnEasyForReal` | driven through `advanceBills` for 6 sessions |
| `curve.everywherePositive`, `curve.steepestAtTheHinge`, `curve.ratio < 30` | hinge/extreme worth ratio |
| `levers.whipMoves`, `obstructionReachesTheHouse`, `whipStaysOnItsOwnBenches`, `floorWorkCounts`, `assentIsATilt` | `whipUp > base + .5`; foe aye share falls `> .02` under obstruction and moves `< .005` under a whip; assent easy−normal within `2` of `12` and `< 72` |

**S21 hazards:** low. The arm stubs support entirely, so changing
`partyBillSupport` does not touch it — but `bill.pull` (S20b) and `bill.lines`
are read by the count, so a new AI verb writing either affects it.

---

### `the engine plays the player` — S20e, probe 11488–11614, gate 11615–11621

**Pins:** `v19Rival` names the human, and how often scales with what the player
has done; the grudge carries the reading and the structural half speaks
independently with the grudge at zero; asking costs the RNG stream nothing; and
the whip count on the card matches the count the game takes.

Seeds: **four** `[4242, 90210, 7, 31337]` × 50, three sweeps (`agg` 0 / 8 / 2).
Level `ruthless`.

| gate | reading |
|---|---|
| `passive.reads > 800` | 4 seeds × 50 × 6 parties = 1200 |
| `passive.human > passive.reads * .15` | **≥15%** of reads name the player even when the player does nothing |
| `busy.human > passive.human`, `hostile.human > busy.human` | strictly monotone in aggression |
| `term.grudgeCarries === true` | `hot < cold` |
| `term.bounded === true` | `hot >= -V19_RIVAL.aimed` (`-.85`) |
| `term.cold > term.hot` | |
| `term.structural.structuralSpeaks === true` | with grudge 0, adopting an `enter` aim on the player's government lowers the rivalry |
| `stream.free === true` | **exact zero** rolls from `v19Rival` over all parties |
| `whip.agrees === true` | `v8WhipCount`'s shown ayes within `1.5` of `billDivision().ayes` and its total === `div.seats` |

**S21 hazards:** `passive.human > .15` is a distribution — an S21 change that
gives engines *other* parties to be angry at reduces the share naming the human.
`stream.free === true` bans any `rand()` in the opponent-model read path.

---

### `the verb reads the aim` — S20g, probe 11660–11946, gate 11947–11957

**Pins:** `V20_AIM` is a covered surface over `V19_GOALS`; `v20Aim` is silent at
`instinct` and answers the right kind at `ruthless`; `court` moves the NAMED bloc
rather than the strongest affinity; `platform` closes on the government it names
and the card's line says so; exec money follows the named office including one
the party is behind in; asking costs no dice; and all four hold **in real play**.

Seeds: `4242` for (b)–(f); **four** `[4242, 90210, 7, 31337]` × 90 for (g).
Level `ruthless`. **This is the only AI arm that overrides `runQueue`**
(11855–11857, restored at 11928).

| gate | reading |
|---|---|
| `registry.total === true`, `registry.declared === registry.kinds` | every goal declared, no stale keys, every named verb in the deck (+`exec`) |
| `floor.silent === true` | **exact zero** aims visible at `instinct` |
| `floor.speaks === true`, `floor.kindKept === true` | answers `ground`, refuses `office` |
| `court.onAim === true`, `court.shippedPicksStrongest === true`, `court.differ === true` | the arm stands in the gap: the aim names a bloc that is NOT the strongest affinity |
| `platform.closes`, `platform.differ`, `platform.namesIt === true`, `platform.coldSaysIt === false` | and the card's own line names the government |
| `exec.refusedWithout === true` (`cold === 0`), `exec.fundedWith === true`, `exec.biggerPush === true` (`hot > .12`) | `V20_AIM_PUSH` = `.2` against the shipped `.12` floor |
| `stream.free === true` | **exact zero** rolls from `v20Aim` |
| `driven.court.n > 40 && driven.court.rate > .9` | measures 1.000 |
| `driven.bill.n > 30 && driven.bill.rate > .45` | measures .600 |
| `driven.bill.rate <= driven.bill.ceiling + 1e-9` | the rate cannot exceed its own availability ceiling (.961) |
| `driven.exec.n > 20 && driven.exec.rate > .35` | measures .464 |
| `driven.platform.n > 10 && driven.platform.rate > .9` | measures 1.000 |

**S21 hazards:** `registry.total` fails the moment a goal is added without a
`V20_AIM` entry naming a real verb — **this is the guard S21 will hit first if it
adds a goal.** `driven.*.n` floors (40/30/20/10) depend on how often each goal is
adopted; adding goals dilutes each one's share.

---

### The S17 coalition / formation / office arms

These are hand-seated chambers rather than driven campaigns, so they are cheap
and very sensitive to changes in `v17Rotation`, `v17Accept`, `v17Invest`,
`v17ByWeight`, `v17ConfidenceVote` and the deal ledger.

**`a plurality is not a government`** — S17f, probe 5494–5586, gate 5587–5599.
Boards are literal seat maps (`{pnl:500, lp:250, sd:220, rsf:200, cup:60,
tvc:50, fp:25}` etc.). Gates:
`form.freeze.ok`, `freeze.lead !== freeze.largest`, `freeze.seatsLargest > 400`,
`seatsGov >= majority`, `playFroze.frozenOut === freeze.largest`,
`playFroze.gov !== playFroze.lead`, `playFroze.formationOnState`,
`weight.moved`, `weight.appointedIgnored`,
**`minority.how === 'minority'`**, `minority.withAbstention === true`,
`minority.withoutAbstention === false`,
**`dead.ok === false && dead.how === 'caretaker'`**,
`unbridgeable.farYes === false`, `farFlag === true`, `nearYes === true`
(bar `V17_UNBRIDGEABLE = 1.15`),
`pure.same && pure.noDice` (**the rotation spends no dice and is idempotent**).

**`a caretaker holds office and does not govern`** — S17f, probe 5625–5706, gate
5708–5724. Five refusals must match `/caretaker/i`; the emergency order must
not; **one closed session must move the Hung Assembly off caretaker without the
ballot moving**; and the clock counts exactly `bound.max === 3`, `bound.forced
=== 1`, `bound.sessions === 3`, `bound.carriedOn === 2` — **pinned literals, not
read off `V17_CARETAKER_MAX`**. This arm DOES use the `runQueue` override
(5652–5655).

**`the house removes a government`** — S17f, probe 5742–5776, gate 5777–5780:
`!safe.carried && safeApproval < 42`, `doomed.carried && doomedApproval >= 42`,
`doomed.defectors.length > 0`, `refound.sameTurn`.

**`live up to it, alter it, betray it`** — S17g, gate 5896–5908: `terms.kinds`
contains `refrain`; `redLines > 0`; breach lowers cohesion and raises the walkout
floor; `kept.count === 1 && kept.twice === 1 && kept.marked === true`;
`notMine.after === notMine.before && notMine.entries === 0`;
`alter.ledger.join() === 'altered' && alter.broken === 0`;
`/broken promises/` refusal after `V17_PATIENCE` (3) breaks;
`betray.broken === betray.outstanding`.

**`the coalition in writing`** — S17e, gate 5435–5441: every member has an entry
including the head; `deal.sd.myTerms.confidence === 'cabinet'`; junior sees "Your
terms" and no buttons; opposition sees neither; **the legacy `redLine` scalar
mirrors the `redLines` list after `pv5EnsureState` re-runs**.

**`nobody holds two great offices`** — S17e, 5451–5488: `doubles === 0` over
`elections > 100` across 10 campaigns × 60 sessions.

**`always running`** — S17j/S17o, probe 6240–6360, gate 6383–6391. Twelve driven
sessions with the `runQueue` override (6250–6251). Nineteen named sub-gates in
`raceWhy` including `field.n === 4`, `field.caucuses === 4`, `field.parties ===
7`, `noDiceOnRender`, **`aiSpent`** (an AI party puts money into a ticket),
`pairs === 'pres+vchan chan+vpres pres+vchan chan+vpres'`,
`pairsMate === 'pres+vpres chan+vchan pres+vpres chan+vchan'`.
**This arm is documented as flaky** and was made to name which half failed.

**`verbs are the buttons' functions`** — S17k, probe 6419–6538, gate 6539–6549.
Uses the `runQueue` override (6516–6517) for 40 driven sessions. Gates include
`verbs.floor.myLine === 24` (the player's declared line has been worth 24 since
S10b and writing both `playerPosition` and `lines` would make it 40),
`verbs.privateBills.mine === 0 && verbs.privateBills.other > 50` over 300 draws,
and `/article,order,floor/.test(verbs.deck)`.

**`a party remembers what was done to it`** — S17l, probe 6575–6684, gate
6685–6696. **The most literal-number-heavy AI gate in the file:**
`cover.total >= 30 && cover.missing.length === 0` (every verb aimable at another
party carries a `V17_MEMORY` weight);
`fires.before === 0 && fires.after === 12` (poach is worth exactly **12**);
`fires.afterKindness === 0`; `refused === 0`;
`seen.target === 22` (cordon is worth exactly **22**) and every bystander > 0;
**`vote.moved === 12` and `art.moved === 12`** (the grudge term in
`partyBillSupport` and `v11ArtSupport` is capped at exactly 12);
`letter.type === 'party_demand'`, `letter.faction === undefined`,
`letter.choices === 'carry,talks,decline'`,
`letter.caucusAfter === letter.caucusBefore`, `letter.billLaid`,
**`letter.ignoredGrudge === 44`**, `letter.caucusOnIgnore === 0`;
`burn.distinct >= 5` (five distinct `V17_BURN` rates) and
`burn.holding > burn.building`.

**`the six that are not yours act`** — S16e/S17k, probe 4142–4302, gate 4309–4315:
**`six.deck === 11 && six.cardWorks === 11`** (the deck size is a literal),
`cardFails.length === 0`, `actedAll` (every one of the six takes ≥1 initiative
in 60 sessions), `builtMachine >= 1`,
**`spentPurse === 6`** (six of the seven parties spend >100 of party money),
`spentTotal > 1500`, `pactPossible`,
**`grudge0 === 0 && grudge1 === 40`**, **`postureUnderGrudge === 'attack'`**,
`grudgeCools`, `redLineBites`, `partnerLeaves`.

`cardWorks` (probe 4200–4256) is a **per-card property**, not a run count: for
each card it builds a state where the card can play (three of them need
construction — `article` gets 20% of the chamber, `order` gets the department,
`floor` gets a bill on the paper), asserts `can()` is true, runs it, and requires
`line && moved && paid`. **`moved` is a hard-coded `id === …` chain at 4235–4252
that falls through to `false` for a card it does not know** — the comment says so
explicitly: *"adding one reddens here until somebody says what it is supposed to
move — the guard a per-card list can have and a count cannot."* So an S21 card
must be given a line in that chain as well as entries in the four covered-surface
tables.

**`a voice out of office`** — S17d, gate 5378–5382: `families >= 10`,
`verbs >= 30`, `distinctLabels === verbs`, `distinctSets === families`,
`outOfVocabulary.length === 0` (closed effect vocabulary
`mach/mood/rel/relOthers/sal/cap/money/unrest`), `familiesUnknown.length === 0`,
`withReaction > 100`, `live.offered > 10`, `live.distinctSetsSeen >= 6`,
plus `outcome.untouched` — **a reaction may not move the event's own indicators
or the treasury.**

**`a party varies what it demands`** (834) — `paper.demandVariety >= 3`.

**`the executive ticket can be aimed and is paid for by the party`** (3718) —
`per.pushOpts === 4 && per.pushAimed && !per.pushToLeader && per.pushTreasury &&
per.pushPurse`.

**`ambition reaches past its own portfolio`** (3726) — `per.runnersUp > 0 &&
per.remembered === per.runnersUp && per.vacated !== false`.

**`party money reaches the ballot`** (3283) — `F.fundingMovesTheVote &&
F.spendWritesFunding > 0 && F.aiFunded >= 5`.

### Adjacent arms — not AI-subject, but coupled to it

Three arms will feel an S21 change without being about the AI:

- **`a position can be pressed home`** (S20b, gate 11211–11227). The player's
  three press verbs write `bill.pull`, which `billDivision` counts and which
  `sees.whip` uses to make the two arithmetics diverge. `press.coverage.dead
  .length === 0` and `press.coverage.ghostMoved === false` are covered-surface
  gates over `V20_PRESS` (3 scopes). If S21 gives an engine a press verb, this
  arm's `scopes.others.hasSponsor === false` exclusion has to hold for it too.
- **`the party board has a tempo`** (S20c, gate 11316–11322). Covered surface
  over `partyActions(foe).concat(partyActions(me))`: `noCool.length === 0`,
  `noEsc.length === 0`, `inconsistent.length === 0`, `monotonic === true`
  (cooldown non-decreasing in cost), `poach.cool >= 3`, `poach.esc > 1.1`,
  `curve[11] > curve[0] * 4`, `ceilingPerParty * 6 < 411`. **Any new per-party
  verb S21 adds must carry a cooldown and an escalating price derived from its
  cost, or two of these go red immediately.**
- **`easy is a cakewalk, not a coronation`** (S20d, gate 11444–11455).
  `cake.tilts.purseMult < 3` bounds `DIFFS.easy.purseMult` — engine purses on
  easy. Any S21 change to what an engine can afford interacts with it.

---

# 2. Invariants an S21 change must not violate

## From `CLAUDE.md` — the ones that bind AI work

1. **All randomness goes through `rand()`, whose state rides the save.** Never
   call the unseeded source. Corollary asserted three times over
   (`ai.dice.drawnBeforeTheSkip`, `sees.stream.free`, `aims.stream.free`): **a
   gate in front of `rand()` decides how many numbers come off the stream**, so
   the tempo die is drawn for every party including the player's and a banned
   one, and any new read accessor must draw zero.
2. **A read must not create.** `v19GoalSeen` reads, `v19Goal` adopts and rolls;
   `rvOk` asserts both halves. Any S21 accessor over another party's state must
   be a read.
3. **A field written in N places and read in none is decoration.** Before
   writing a number into `st.ai`, grep for a reader.
4. **A per-power/per-card list is built at the END of the file, never where the
   literal is evaluated.** `V16_AI_DECK` is pushed to in later chunks.
5. **A guard goes on the LIVE function, and a reassignment is not a wrapper.**
   `tickTurn` is reassigned at 35922 to call `v16RedLineTick`, `v19React`,
   `v16AiTurn`. Gating anything must check the reassignment, not the base.
6. **Never rebind a top-level function name without capturing the previous body
   and CALLING it**; every reassignment site must be adjudicated in
   `checks/dead-bodies.json` (194 sites; `node checks/run.js --sites`).
7. **Never pass a reassignable function identifier by value at top level.** The
   ratchet is at 0.
8. **A hand-kept whitelist is banned where a covered surface is possible.**
   `V17_MEMORY`, `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS` and `V20_AIM` are each
   asserted as total over `V16_AI_DECK` / `V19_GOALS`. **Any S21 addition to the
   deck or the goal pool must extend all four tables or four arms go red.**
   **One table escaped this rule and no arm checks it:** `V16_AI_COST`
   (vale.html:34016) holds **8 of the 11 cards** — `article`, `order` and `floor`
   were given their own separate constants 3,700 lines later
   (`V17_AI_COST_ARTICLE = 34`, `V17_AI_COST_ORDER = 22`, `V17_AI_COST_FLOOR =
   12`, vale.html:38189–38191). `v19Score`'s purse penalty reads
   `V16_AI_COST[card.id] || 0` (vale.html:35293), so **those three cards are
   scored as free** and never take the `-.22` "money it cannot spare" term. Greps
   run: `grep -n "V16_AI_COST" tools/roads.js checks/run.js` → **no hits**;
   `grep -n "V16_AI_COST" vale.html` → 17 hits, all `can`/`pay` sites plus 35293
   and 35385. An S21 card added to `V16_AI_DECK` with its price in a new constant
   would inherit exactly this gap in silence.
9. **A borrowed paper type reaches into whatever the original pointed at.** A
   new kind of letter gets a new type. (`minds.letter.type === 'party_demand'`
   is the assertion of that fix.)
10. **A relation declared on one card and not the other is a one-way door** —
    declare a pair once, index both ways, assert BOTH directions.
11. **A mode with one value is a field nothing reads.** An enum whose second
    value never occurs is decoration.
12. **A threshold picked by eye is a mechanic that never fires.** Measure the
    distribution IN PLAY before a number gates anything, and put the measurement
    in the assertion's own words.
13. **A shared body right for the new caller can be wrong for the old one.**
    (`shared.billCalls === 0` is exactly this guard for `partyDemandPolicy`.)
14. **THE PROBE IS WRONG BEFORE THE GAME IS.** Before believing a red assertion
    check the probe; before believing a green one, poison it.
15. **THE POISON LIST COMES FROM THE DIFF, NOT FROM THE ASSERTION.**
16. **Half of `endTurn` runs inside `runQueue`'s callback.** See §3.
17. **A rate above its own ceiling is arithmetic that cannot happen**, and **a
    probe that reproduces the rule under test measures the change against
    itself**.
18. **A probe that throws aborts the harness** — guard every lookup a poisoned
    build can empty.
19. **`SEED_OVERRIDE` pins the republic; setting `rngState` afterwards pins only
    the dice.**
20. **A pacing figure from one seed cannot tell a balance change from a
    reshuffle**; treat a before/after gap smaller than one build's seed-to-seed
    spread as a reshuffle.

## From `docs/MAP.md` — the AI sections

- **S20f "The AI arms were measured on too few seeds" (MAP 1388–1432).** Two
  published effect sizes failed when widened from 8 seeds to 14 **on a
  byte-identical build**. The standing rule: *where an arm asserts an effect
  SIZE, sweep the sample before believing it, and put the sweep in the arm's own
  words.* Seven probes were widened to 14. **S21 must not publish an effect size
  from fewer than 14 seeds.**
- **S20f also records a change that was measured OUT rather than shipped**:
  letting a party's aim keep its best card past the posture filter. Real but
  modest (aim's best card 32.9% vs 28.1%), and it re-phased every campaign and
  cost two further S18/S19 arms. **If S21 wants to touch the posture filter,
  this is settled ground with a recorded verdict.**
- **S20g (MAP 1267–1387).** `V20_AIM` is a covered surface; `v20Aim` reads
  `a.goal` and never calls `v19Goal`; it answers null at `instinct` **by
  construction rather than by four separate guards**. `V20_AIM_BILL = 12` was
  measured, not picked: 5 clears 50 of 98 (.329), 12 clears 73 (.600), anything
  near 28 makes the forecast decorative. **A `sharp` scale was drafted and
  deleted — it could not be poisoned (the harness drives at `ruthless` where
  `sharp/5` is 1) and it was wrong at the default level.** MAP also records the
  correction: engines DO end up in governments and offices; what they could not
  do was ACT on the aim they named.
- **S19a (MAP 2136–2196).** Owner rulings R1 and R2: **AI sophistication has its
  OWN difficulty setting independent of `st.diff`**, and **the Parties page
  states each party's aim and why it did what it did.** `V19_LEVELS` lives
  beside `DIFFS` and not with the AI code because the start screen and `newGame`
  are evaluated 25,000 lines earlier — moving it throws `V19_LEVELS is not
  defined` on boot. **`v19LevelOf`'s floor is the shipped game EXACTLY** — R1
  asks this of every term S19 and S20 add.
- **S18e (MAP 2197–2255).** `V16_AI_CADENCE` is **the owner's dial** and is
  untouched; its own comment records that six parties acting every session took
  the harness from 5.5 elections won to 1.2. **A term belongs in `V18_TEMPO`
  only if it can tell two parties apart** — a ballot term was written and taken
  back out because normalisation divided it straight back. `v18Restive` is ONE
  predicate read by the posture AND by the card's own refusal, bar `V18_RESTIVE`
  above the ordinary 35 "because a ministry is a reason to put up with more".
- **S19e/S19f isolation rule.** Both A/Bs in `tempOk` hold `V19_REACT_RISE =
  9999` on both sides, because the reaction changes WHICH sessions a party acts
  in and therefore the population everything else is measured on. **Any S21
  mechanism that changes when a party acts must be held on both sides of every
  existing in-process A/B, or it silently moves five measurements.**

---

# 3. The harness's driving conventions

## Seeding

Every AI arm defines its own `fresh(seed, level, me)`:

```js
function fresh(seed, level, me) {
  SEED_OVERRIDE = seed;
  S = enrichState(v6NewGame('normal', 'v6default', 'epic', me || 'lp'), false);
  S.aiLevel = level; S.rngState = seed;
  return S;
}
```

`SEED_OVERRIDE` is a global in `vale.html` at **line 6965**, consumed and
cleared by `newGame` at **8472–8473** (`var seed = SEED_OVERRIDE === null ?
mintSeed() : SEED_OVERRIDE; SEED_OVERRIDE = null;`). **It must be set BEFORE
every `v6NewGame` call** — setting `S.rngState` afterwards pins only the dice
and not the board (leaders, purses, figures), which is why S18e's assertion
failed one run in three of an unchanged build. Setting both is the convention.

Default board for the AI arms: difficulty `normal`, start `v6default`, length
`epic`, player `lp` (`pnl` in one S18e arm). `S.aiLevel` is set explicitly —
`shrewd` or `ruthless` in most arms; `V19_DEFAULT_LEVEL` is `purposeful`.

## Stepping

Two shapes, and the difference matters:

```js
// the initiative-pass driver — used by S18e, S19a-f, S20b/d/e
function drive(n) {
  for (let i = 0; i < n; i++) {
    UI.queue = []; UI.busy = false;
    try { endTurn(); } catch (e) { return e.message; }
    UI.queue = []; UI.busy = false;
  }
}
```

```js
// the full-session driver — used by S17h (5982), S17f caretaker (5652),
// S17j (6250), S17k (6516), S17q (7573) and S20g (11855)
const rq = runQueue;
runQueue = function (done) { UI.queue = []; rq(done); };
try { /* … endTurn() … */ } finally { runQueue = rq; }
```

A third variant at **5213–5221** (`whose desk it lands on`) captures the queue on
its way in and *then* empties and delegates — the shape to copy if S21 needs to
read what a session raised **and** close it:

```js
var got = [], rq = runQueue;
runQueue = function (done) {
  (UI.queue || []).forEach(function (e) { /* … record e … */ });
  UI.queue = []; rq(done);
};
```

## When the override is required

`endTurn` (base at **vale.html:13476**, wrapped at **21581**) does its model
work, then sets `UI.queue = v17Route(S, fired)`, then `S.turn += 1`, then hands
**the rest of the session** to `runQueue(function () { … })` — `checkCollapse`,
`regimeCycle`, `v17RaceTick`, the mid-term `execContest`, `v17CaretakerTick`,
and `runElection`. `runQueue` (**19727**) returns immediately after raising a
sheet when the queue is non-empty, so the callback **never fires**. Clearing
`UI.queue` before and after `endTurn()` does not help: the queue is filled in
between.

`v16AiTurn` is called from the reassigned `tickTurn` (**35922–35927**), which is
the **first** thing `endTurn` does. So:

- **No override needed** for anything in the initiative pass: goal adoption and
  retirement, `v19Choose`, card `run`, `v19React`, `v18TempoOdds`, the grudge
  ledger, the purse burn.
- **Override required** for anything downstream of the queue: **elections,
  government formation, coalition changes, `v17Rotation` in play, the caretaker
  clock, the executive season, `v17AiRaceSpend`.**

**This is a live constraint on S21.** Of the nine S18e–S20g AI arms, **only
`the verb reads the aim` overrides `runQueue`** (11855–11857) — and it does so
precisely because its exec sub-arm reads `v17AiRaceSpend`. Every other AI arm
drives a republic that **never holds an election.** Any S21 assertion about a
government being threatened, a coalition changing between elections, an engine
entering office, or anything a ballot produces **must use the override or it
will measure a frozen board and report it as a finding.** `docs/S21-BASELINE.md`
line 8 records that three S20g probes that did not reported *one* election in 720
sessions.

## Seeds per AI arm

| arm | sub-arm | seeds | sessions | runs |
|---|---|---|---|---|
| S18e `a party moves…` | (b) spread | **5** | 60 | 1 |
| | (d) restive | 1 (`771144`) | 40 | 2 |
| | (e) memory / attacks | 1 (`424242`) | 60 | 1 |
| S19a `a party is after something` | (c) levels | **1** (`20260829`) | 60 | 4 |
| | (d) hold | **1** (`771144`) | 30 | 1 |
| | (g2) steer | **1** (`20260829`) | 60 | 2 |
| | (h) floor | **1** (`20260829`) | 80 | 2 |
| S19b `…who is in its way` | (g) panel | **4** | 120 | 1 |
| | (h) pick A/B | **14** | 100 | 2 |
| | (i) scale | **4** | 60 | 1 |
| S19c `…can reach what it is after` | (a) adoption | **14** | 100 | 1 |
| | (f) one-at-a-time | **5** | 60 | 1 |
| | (g) steer | **10** | 100 | 1 |
| S19d `…votes its own manifesto` | (b) reach | **4** | 100 | 1 |
| | (c) choice | **14** | 100 | 1 |
| | (d) shared | **14** | 100 | 1 |
| | (e) clock A/B | **12** | 120 | 3 |
| | (f) page | **1** (`90210`) | ≤140 | 1 |
| S19e `the parties have characters` | (c) lean A/B | **14** | 100 | 2 |
| | (d) patience A/B | **16** | 120 | 2 |
| S19f `…does not wait for the season` | (a) ledger | **14** | 120 | 2 |
| | (b) stream | **1** (`4242`) | 40 | 1 |
| | (c) lag | **14** | ≤40 | 2 |
| | **(d) aim** | **6** (`SEEDS.slice(0,6)`) | 120 | 2 |
| | (e) bar | **14** | 120 | 1 |
| S20a `the division is counted` | all | 1 (`4242`) | 0 driven | — |
| S20d `easy is a cakewalk` | income / street | **4** | 60 / 40 | 1 |
| S20e `the engine plays the player` | (a) sweep | **4** | 50 | 3 |
| S20g `the verb reads the aim` | (g) driven | **4** | 90 | 1 |

### Three arms print "eight seeds" while driving fourteen

`grep -n "eight seeds" tools/roads.js` gives five hits. Two (9441, 10319) are
correct historical references to what S20f corrected. **Three are stale claims in
the live message text:**

- **9478** — `a party knows who is in its way` prints *"Isolated as an in-process
  A/B over eight seeds of a hundred sessions"*; the code at **9362** drives
  fourteen.
- **10316** — `the parties have characters` prints *"isolated as an in-process
  A/B over eight seeds"*; the code at **10132** drives fourteen.
- **10678** — `a party does not wait for the season` prints *"a mean drift of X
  across eight seeds"*; `SEEDS` at **10395** holds fourteen.

`CLAUDE.md`'s rule is that the measurement goes *in the assertion's own words so
the next reader cannot re-pick it by eye*. Here the words disagree with the code
in exactly the direction that caused S20f. **An S21 slice quoting these messages
would understate the sample by 43%.** Cheap fix; worth doing while the arms are
being touched anyway.

**Arms still on fewer than 14 seeds — every one of these is a candidate for the
S20f defect if S21 quotes an effect size from it:**

- **S19a, entirely single-seed.** Every reading in `a party is after something`
  — the level contrast, the hold rate, the steering means, the floor counts —
  comes from ONE seed. It asserts *shapes* rather than effect sizes, which is why
  it survived S20f, but `steer.purposeful.goal < .42` and
  `steer.shrewd.sim < steer.purposeful.sim - .05` are effect-size claims on n=1.
- **S19b (g) panel and (i) scale — 4 seeds.** (i) sets a constant against a
  measured p90/p99 on 4 seeds.
- **S19c (f) — 5 seeds.** S18e (b) — 5 seeds. S19c (g) — 10 (moved up from 6
  because the sample came in at 39 against a floor of 40).
- **S19d (b) — 4 seeds; (e) clock — 12.**
- **S19f (d) aim — 6 seeds**, and it is the sub-arm that asserts a lift
  (`aim.lift > .03`, `attack > 1.2×`) — i.e. **an effect size on six seeds,
  inside an arm whose other sub-arms use fourteen.** This is the single clearest
  remaining instance of the pattern S20f named.
- **S20d — 4 seeds. S20e — 4 seeds** (and `passive.human > .15` is an effect
  size). **S20g driven — 4 seeds** (rate floors .9/.45/.35/.9).

---

# 4. Runtime and assertion budget

- **`node checks/run.js`** — 11 static checks, <5s. Unaffected by AI work except
  `dead-bodies` (any new top-level reassignment must be adjudicated in
  `checks/dead-bodies.json`) and `marker-integrity`.
- **`node tools/roads.js`** — **measured this session: `real 16m40s` (`user
  0m12s` — essentially all of it is inside the headless browser), 200 ok, 0
  FAIL**, assertion-name list byte-identical to the 11:00 log. From 196 `say(`
  sites; the run's own output is 203 lines.
  **The shape of that budget matters more than the total.** Assertions 1–184
  (everything up to and including `the floor is open to every chair`) had all
  printed within roughly the first three minutes; **the last sixteen — the S18b
  chair walk and the whole S18e–S20g AI block — take about thirteen of the
  sixteen minutes.** `a party votes its own manifesto` and `the parties have
  characters` alone accounted for several minutes each while I was polling.
  An S21 arm on the S19 pattern (14 seeds × 100 sessions × 2 A/B legs) should be
  budgeted at **2–4 minutes of wall clock apiece.**
- **Cost model for a new arm.** The expensive unit is a driven session. Rough
  session counts already paid: S19b ≈ 6,000; S19c ≈ 3,000; S19d ≈ 8,000; S19e ≈
  6,600; S19f ≈ 9,000; S20e 600; S20g 360. **A 14-seed × 100-session A/B is
  2,800 driven sessions and is the standard unit** — S19d's clock leg is 12 × 120
  × 3 = 4,320 and is the largest single block.
- **Cheap arms exist and are worth copying.** S20a (`the division is counted`)
  drives nothing — it hand-seats chambers and stubs `partyBillSupport`. S17f's
  formation arms hand-seat and call `v17Rotation` directly. **If S21 changes
  coalition formation, the cheapest honest assertion is a hand-seated board plus
  ONE driven arm with the `runQueue` override**, not a 14-seed sweep.
- If S21 adds driven arms, note that `V19_SIMULATING` must be respected by any
  instrument that wraps a card's `run` — otherwise every rehearsal is counted as
  an initiative and a party looks five times as busy at the thinking levels.

---

# 5. The four assertions most likely to break

## (i) `a party can reach what it is after` — goal adoption and retirement

```js
reach.neverAdopted.length === 0 && reach.goalKinds.length >= 7 &&
…
reach.carryGaps.length > 10 && reach.carryGaps.every(g => g === 1) &&
…
reach.steer.carryOpen >= 40 && reach.steer.otherOpen >= 100 &&
reach.steer.lift !== null && reach.steer.lift > .15
```

**Why it breaks.** `neverAdopted.length === 0` requires **every** goal in
`V19_GOALS` to be adopted at least once over 14 seeds × 100 sessions. `oust` is
held **0 times** in the S21 baseline's 720 driven sessions at `ruthless` — it
passes here only because this arm drives at `shrewd` on different seeds. **Any
S21 change to `v19AdoptGoal`'s pool, its `fits` weights, or the addition of an
eighth goal, risks starving one kind and reddening this.** `carryGaps.every(g =>
g === 1)` is universal over hundreds of adoptions and dies on any change to
`carry.target`. `steer.carryOpen >= 40` is a sample floor the probe's own comment
says was already only 39 at six seeds.

Companion: **`a party votes its own manifesto`**'s clock legs
(`byProgress.total > byAge.total`, `byProgress.deadHeldFor < .6 *
capOnly.deadHeldFor`, `byProgress.meanAt > 14 && byAge.meanAt < 14`) are the
retirement half. Changing `V19_GOAL_IDLE` (11), `V19_GOAL_CAP` (60) or the
`g.best > 0` stall predicate moves all six readings simultaneously.

## (ii) `a plurality is not a government` + `a caretaker holds office and does not govern` — coalition formation outcomes

```js
form.minority.how === 'minority' && form.minority.withAbstention === true &&
form.minority.withoutAbstention === false &&
form.dead.ok === false && form.dead.how === 'caretaker' &&
form.unbridgeable.farYes === false && form.unbridgeable.farFlag === true &&
form.unbridgeable.nearYes === true &&
form.pure.same && form.pure.noDice
```

```js
care.stuck && care.bound.cleared && care.bound.max === 3 && care.bound.forced === 1 &&
care.bound.sessions === 3 && care.bound.carriedOn === 2
```

**Why it breaks.** The baseline says 360 of 360 formations came out `majority`
and **no investiture vote has ever failed** — so `minority` and `caretaker` exist
in the harness only because these two arms construct the boards by hand. **Any
S21 change to `v17Accept`'s reservation price, `v17Invest`'s tally,
`V17_UNBRIDGEABLE` (1.15), or the round order in `v17Rotation` will move exactly
these hand-built boards**, which are the only place the minority and caretaker
branches are ever exercised. `form.pure.noDice` bans any `rand()` anywhere in the
rotation — **an S21 negotiation that rolls breaks it outright.** The caretaker
clock's `3 / 1 / 3 / 2` are pinned literals deliberately not read off
`V17_CARETAKER_MAX`; changing the constant reddens the arm on purpose.

Companion: `care.resolvedInPlay.moved && how !== 'caretaker'` requires **one
closed session** to resolve the Hung Assembly. If S21 makes formation harder or
slower, this is the arm that says so — and it uses the `runQueue` override, so it
really is measuring the game.

## (iii) `a party moves when it has a reason to` — the tempo budget and the posture distribution

```js
ai.budgetHeld && ai.totalHeld && ai.spreadOpen && ai.termsMove &&
ai.restive.predicate && ai.restive.posture === 'restive' && ai.restive.cardOpens &&
ai.restive.contentRefused &&
ai.restive.fromInside > 0 && ai.restive.fromOutside > 0 &&
…
ai.dice.drawnBeforeTheSkip
```

with `R.budgetHeld = R.oddsSum.every(x => Math.abs(x - R.budget) < 1e-6)`,
`R.budget = live / V16_AI_CADENCE`, `R.totalHeld = |meanTotal - expected| <=
expected * .10`, `R.spreadOpen = spreads.every(s => s >= 4)`.

**Why it breaks.** Postures are not asserted as a distribution anywhere. Grep
`grep -n "posture\|v16Posture" tools/roads.js`: only **three** gates name one at
all — `six.postureUnderGrudge === 'attack'` (4311), `ai.restive.posture ===
'restive'` (8747) and `restive.contentRefused`'s `=== 'partner'` (8643).
`govern`, `moderate`, `organise`, `hold` and `consolidate` are named by **no
assertion**. But postures decide the OPEN SET (`v16AiTurn` at vale.html:35452:
`c.post.indexOf(post) < 0` plus a hard four-session per-card recency filter), and
**every rate in S19b, S19c, S19f and S20g has an open-set denominator.**

Two hand-kept posture tables have no coverage guard, both of which an S21 posture
would fall through:
- **`V17_BURN`** (vale.html:38534) names all eight postures, and its only reader
  (vale.html:16371) is `rate === undefined ? .7 : rate` — **a new posture
  silently gets the old flat .7 burn.** `minds.burn.distinct >= 5` counts
  distinct *values*, not coverage.
- **each card's `post:` array** (vale.html:34329–34580) — a new posture appears
  in none of them, so a party in it has an **empty open set and never acts**,
  which `v16AiTurn` handles with `if (!open.length) return;`. Nothing would go
  red; the party would simply go quiet. A posture change that closes `attack` to a
restive partner reddens `fromInside > 0` directly; one that changes which cards
are open under `hold` (39.2% of party-sessions in the baseline) moves
`pick.foeN`/`calmN`, `steer.carryOpen`, `aim.n` and `driven.*.n` all at once.
`budgetHeld` at `1e-6` is the tightest tolerance in the harness: **any new
un-normalised multiplier in `v18TempoOdds` fails it**, and
`dice.allBanned === PARTIES.length` fails on any extra `rand()` in the loop.

## (iv) `a party is after something` — the card-play mix

```js
think.byLevel.purposeful.withGoal === think.byLevel.purposeful.acts &&
think.byLevel.shrewd.withGoal === think.byLevel.shrewd.acts &&
think.byLevel.ruthless.withGoal === think.byLevel.ruthless.acts &&
think.byLevel.shrewd.goals >= 4 &&
think.hold.rate < .25 && think.hold.samples > 100 &&
think.sim.distinct >= 7 && think.sim.spread > .05 &&
think.sim.distinctOrders >= 3 && think.sim.orderSpread >= 6 &&
think.steer.purposeful.goal < .42 &&
think.steer.shrewd.sim < think.steer.purposeful.sim - .05 &&
think.floor.sharp.n > 0 && think.floor.sharp.against === think.floor.sharp.n &&
think.floor.dumb.n > think.floor.sharp.n &&
think.floor.dumb.against < think.floor.dumb.n
```

**Why it breaks.** Three separate all-or-nothing counts (`withGoal === acts`
three times, `floor.sharp.against === floor.sharp.n`) over driven sessions on a
**single seed**. `sim.distinct >= 7 of 11` and `sim.orderSpread >= 6` are
properties of `v19Outcome`/`v19Standing` over the current 11-card deck — **adding
a twelfth card changes both, and adding a card that `v19Standing` cannot see
lowers `distinct`.** `steer.*` reads `v19GoalKind(goal.kind).worth`, so retuning
any `worth` table shifts the mean rank the gate compares against .42.

Companion, and the reason the deck size is a load-bearing number:
**`the six that are not yours act` (4309) gates on `six.deck === 11 &&
six.cardWorks === 11` as literals**, and its `moved` chain at `roads.js:4235–4252`
returns `false` for any card id it does not name. **A twelfth card is therefore a
five-place change in `roads.js` and a five-place change in `vale.html`:** the two
literals plus the `moved` chain here, and `V19_RIVAL_WORTH`, `V19_TEMPER_AXIS`,
`V16_AI_COST`, at least one posture list, and every relevant goal's `worth`
table. Four covered-surface gates (`rival.uncovered`/`ghostWeights`,
`temp.cardsWithoutAxis`/`ghostAxis`, `aims.registry.unserved`) will name it if
any of those is missed — which is the design working, not a defect.

---

# What I could not verify

- **The per-arm timing split in §4 is an observation from polling, not an
  instrumented measurement.** The 16m40s total and the 200/0 result are measured;
  "assertions 1–184 within about three minutes" comes from watching the output
  file grow, so treat the per-arm figures as order-of-magnitude.
- **The `dealG` (S17g) probe body** (5792–5890) — I read its gate and the last
  three arms; the first three arms (`terms`, `breach`, `kept`) I have from the
  gate's field names only.
- **Whether `v16Posture`'s `'consolidate'` branch (`share >= .22`, vale.html
  34140) ever fires in play.** It is not in `docs/S21-BASELINE.md`'s six-posture
  table, and no assertion names it — but `consolidate` appears in nine of the
  eleven cards' `post:` lists. If it never fires, those nine list entries are
  decoration; I did not measure it.
- **`checks/run.js`'s own AI coverage.** I read the invariants it enforces from
  `CLAUDE.md` but did not open `checks/run.js` or `checks/dead-bodies.json`, so
  the exact set of AI symbols already adjudicated there is unverified.
- **`tools/pacing.js` and `tools/determinism.js`** — both are named in
  `CLAUDE.md` as things an AI change must re-run (determinism especially: seven
  properties of the seeded dice, and every S21 term that draws is in scope). I
  did not read either.
