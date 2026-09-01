# S21 — the AI as it stands, measured

Every figure here is from the shipped build at `c7f7236` (S20g), driven **six
seeds by 120 sessions = 720 sessions**, difficulty `normal`, length `epic`,
`aiLevel: ruthless` (the top of the scale, so these are the engine's *best*
numbers, not its average ones).

The driver overrides `runQueue` — see CLAUDE.md. Three S20g probes that did not
reported one election in 720 sessions, and this file would have been fiction.

Probes: `scratchpad/base21.js`, `scratchpad/rota.js`. Re-runnable.

## The engine acts often enough, and every card lands

| | |
|---|---|
| Initiatives played | **4,941** in 720 sessions |
| Card `run` returning null (a wasted session) | **0** |

Plays by card:

| card | plays | card | plays |
|---|---|---|---|
| court | 796 | campaign | 296 |
| demand | 762 | order | 232 |
| organise | 594 | article | 230 |
| attack | 559 | platform | 195 |
| bill | 477 | floor | 326 |
| pact | 474 | | |

No card is starved and none is dominant. **The deck's distribution is not the
problem.** What the cards *do* is the question S21 has to answer.

## Postures: two fifths of the time a party has no mood at all

| posture | party-sessions | share |
|---|---|---|
| hold | 1,713 | **39.2%** |
| partner | 905 | 20.7% |
| govern | 699 | 16.0% |
| moderate | 443 | 10.1% |
| organise | 345 | 7.9% |
| attack | 215 | **4.9%** |

`hold` is the default and it is the modal state. A party is hostile 4.9% of the
time, against a player who spent a whole campaign taking their seats.

## Goals are adopted and then abandoned

Held, per party-session:

| goal | held | goal | held |
|---|---|---|---|
| build | 1,003 | charter | 403 |
| carry | 883 | office | 398 |
| ground | 856 | **oust** | **0** |
| enter | 680 | | |

Retired, counted once per adoption through `a.lastGoal.why`:

| outcome | count |
|---|---|
| done | **22** |
| stalled | **133** |
| given up | 3 |

**86% of every aim a party forms is abandoned rather than reached.** And `oust`
— the goal for bringing a government down — was held **zero times in 720
sessions** at the top AI level.

## Coalitions: rich machinery, one answer

The formation rotation (`v17Rotation`, S17f) is not a stub. It runs formateur
rounds in seat order, builds offers with portfolios, concessions and red lines,
asks each party through `v17Accept` against a reservation price, holds an
investiture vote where **abstention is not opposition**, falls back to minority
government with confidence-and-supply, then to a grand coalition at relaxed
reservations, then to a caretaker. `formCoalition` at 11719 is a dead fallback
for a build without the S17f chunk.

Instrumented at `v17Rotation` itself across **360 real formations**:

| | |
|---|---|
| Outcome `majority` | **360 of 360** |
| Outcome `minority` / `grand` / `caretaker` | **0 / 0 / 0** |
| Formations settled in the FIRST round | **354 of 360 (98.3%)** |
| The largest party formed the government | **354 of 360 (98.3%)** |
| Investiture votes held | 360 |
| Investiture votes **failed** | **0** |
| Partner offers accepted | 552 of 653 (84.5%) |
| Reservation prices | 30 to 60, median 44 |
| Mean portfolios per offer | 2.27 |
| Mean concessions per offer | **exactly 3.00** |
| Mean red lines per offer | **exactly 1.00** |

Four branches exist and one runs. The investiture vote has never in 360 tries
refused a government, so it is a formality with a tally printed on it. Every
offer carries three concessions and one red line because `v17Supply`/`v17Offer`
take `pv5TopWants(pid, st, 3)` and one line — the terms are a constant wearing
the shape of a negotiation.

That machinery produced, in 720 sessions:

| | |
|---|---|
| Coalition sizes ever seen | **2 (464 sessions), 3 (256)** — never 1, never 4+ |
| Coalition membership changes | 45 |
| Government changes | 9 |
| Elections held | 360 |
| Sessions with confidence-and-supply | **0** |
| Sessions with a co-opted party | **0** |
| Sessions with a cordon | **0** |
| Longest unbroken partner spell | **103 sessions** |
| Partner spells over 30 sessions | 4 of 8 |

Nine government changes in 360 elections. One partnership lasting 103
consecutive sessions. The minority-government path, which is the most
interesting branch in the rotation, **never once fired**.

### And between elections, a government is a constant

Separating formation-time changes from everything else:

| | |
|---|---|
| Coalition changes AT a formation | 42 |
| Coalition changes BETWEEN elections | **3 in 720 sessions** |
| `coalition_demand` papers raised | **2** |
| `confidence_threat` papers raised | **1** |
| `coalition_review` papers raised | 12 |
| Agreement `quit` events | 3 |

For scale, the same 720 sessions raised 762 `party_demand` papers and 411
`cross_party` papers. The inbox is busy. It is the coalition that is silent.

A partner asks the player for something **twice per 720 sessions** and
threatens the government **once**. Once a government is formed it is a fact
about the state, not a relationship anybody has to keep. That is the owner's
"flat, uninteresting and unengaging", stated as a rate.

`shiftPartyRel` is called 2,164 times at a mean magnitude of 4.71 — the
relationship number moves constantly and almost nothing reads the movement.

### The agreement can be broken and cannot be kept

S17g wrote a real agreement: `adopt` concessions the government will honour,
`refrain` concessions it will leave alone, and red lines. Breaches cost
cohesion, kept promises credit it (`V17_KEPT = 7`), and the walkout counts
broken promises against a partner's patience.

Measured over the same 720 sessions:

| | |
|---|---|
| Ledger entries written | **40** |
| Of those, `broken` | **40** |
| Of those, `kept` | **0** |
| `v17Walkout` evaluated | 49 times |
| Partners who actually left | 3 |
| Partner cohesion | min 20, median 38, p90 48.1, max 76 |

Zero credits in 720 sessions, and the reason is in the two arms. A breach fires
on **any** move of a red line in the wrong direction, or **any** touch of a
`refrain` statute. A credit fires only when `v17Off(st, pid, ref) <= 0.001` —
the statute has to reach the partner's want **exactly** — and only on the
`move` event that closes it. The concessions are drawn from
`pv5TopWants(pid, st, 4).slice(0, 2)`, which are by construction the partner's
two **largest** gaps, so honouring one takes several carried bills and the
check has to catch the last of them.

`V17_KEPT` has never been awarded. A partner can only ever be disappointed.

And the offer's content is not read at all where it is decided: `v17Accept`'s
value is `38 - d*38 - grudge*.32 + share*46 + concessions.length*5 + (offices ?
9 : 0)`. `concessions.length` is **always 3**, so that term is a constant +15,
and `redLines` does not appear in the value at all. Which statutes are on the
table changes nothing about whether the party sits down.

`st.partyRel` across 5,040 samples: min 0, p10 5.9, median 33.5, p90 75.0,
max 75.9. It is one number per party pair and it is the whole relationship.

## Memory is one-sided

| | |
|---|---|
| Grudge samples | 3,433 |
| Mean grudge | 22.13 |
| Max grudge | **100 (the clamp)** |
| Any gratitude / positive memory field | **none exists** |

A party can remember being wronged. Nothing in three megabytes lets it remember
being helped.

## The executive turns over, the offices do nothing

180 contests, 46 office changes (**25.6%**). The offices change hands. What an
engine does with one once it holds it is the open question.

## How far ahead the engine thinks: one move

`v19Score` is the whole decision. Its terms, at `ruthless`:

| term | what it reads | weight |
|---|---|---|
| goal `worth` | the aim's table over the 11 cards | 0.12 to 1.0 |
| recency | a card played in the last 8 sessions | −0.18 |
| purse | cost against 2.2x the purse | −0.22 |
| `v19Outcome` | **one-ply simulation** | ±1.9 (sim 1.9) |
| temperament | the party's own leaning | ±V19_TEMPER |
| rivalry | who is in the way | up to 1.8 |

`v19Outcome` clones the state, runs the card, and reads `v19Standing` before
and after. That is one move deep with **no opponent reply, no second card, and
no session after this one**. Nothing anywhere models what the player will do
next, and no party has a plan that spans sessions beyond holding a single goal
it abandons 86% of the time.

## What these numbers say the programme is

The engine ACTS enough. It picks cards sensibly. What it lacks is **consequence
between sessions**: an aim it can finish, a relationship that is more than one
number, a government it can threaten, a memory of being helped, and any reason
for the player to believe an opponent is pursuing something across a campaign.
