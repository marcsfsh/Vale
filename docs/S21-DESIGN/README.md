# S21 design — four independent proposals

Four designers worked the same brief (`DESIGN-BRIEF.md`) from the same intake,
each pushed toward a different position so the merge would have real
alternatives to choose between rather than four versions of one idea.

| file | angle |
|---|---|
| `DESIGN-A.md` | **Make the existing machinery bite.** The problem is not missing mechanisms, it is mechanisms built and wired to nothing. Twelve surgical changes beat any new subsystem. |
| `DESIGN-B.md` | **The engine needs reasoning it does not have.** No amount of repair produces an opponent that models, plans or bargains. |
| `DESIGN-C.md` | **An opponent the player cannot perceive is not an opponent.** Most of the 1/10 is a perception problem compounded by a consequence problem. |
| `DESIGN-D.md` | **The coalition is the spine.** A government that can fall gives every other AI behaviour something to be for. |

`JUDGE.md` is the adjudication: the union of every item, scored on impact,
visibility, risk and cost, with the disagreements settled from the code.

**`docs/PLAN-S21.md` is the contract.** These four are its working papers. Where
a proposal and the plan disagree, the plan wins.

## Where all four agreed

Convergence across four independent designers is the strongest signal in this
directory. Every one of them proposed, in its own words:

- `oust` made adoptable, so an engine can want a government gone
- an objective function that can see what a card actually does
- a signed party-to-party regard, replacing "everyone's relationship with the
  player" as the only relationship in the file
- a confidence motion an engine can table
- a coalition offer priced by what is in it rather than by how many items it has
- a promise with a date, that can be kept and not only broken
- a real game for a player who is the junior partner

Three of four also proposed fixing `court` so the simulation and the ballot
stop disagreeing, giving the engine the persuasion verbs the player already
has, making the tempo budget non-zero-sum, and letting a ballot have
consequences an engine reads.

## Where they disagreed, and it mattered

- **The objective fix.** Settle the state one tick before reading it, or teach
  the objective to read what the cards write? Different cost, different risk to
  the harness's thirteen-minute AI block.
- **Second ply.** One designer wanted the rehearsal to look one move further;
  another argued it buys the player nothing they can see.
- **Party-to-party regard.** A new matrix, or re-signing the existing grudge so
  a negative value is standing? The second is one clamp change and keeps every
  existing reader.
- **The tempo budget.** Whether to touch it at all, given it is the owner's dial
  and the codebase already recorded a measurement against raising it.
- **New deck cards.** Whether the engine's missing verbs belong as new cards or
  as branches inside `floor`, which already dispatches on one.

## What all four were warned about, and warned each other about

Raising `V16_AI_CADENCE` (measured out already: six parties acting every
session took elections won from 5.5 to 1.2). Adding a twelfth card without
knowing it is a five-place change in `roads.js`. Quoting the baseline's
pre-correction initiative count. Writing driven assertions without the
`runQueue` override. And proposing any field whose reader they cannot name.
