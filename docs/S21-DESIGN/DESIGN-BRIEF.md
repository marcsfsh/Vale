# S21 design brief — read this, then propose

You are designing an upgrade to the AI of `vale.html`, a 3.7 MB single-file
turn-based government simulator. You are one of several independent designers.
Your proposal will be scored against the others and the best ideas merged, so
**take a clear position** rather than hedging across every option.

## The owner's words, verbatim

> "I want S21 to be an all-out focus on AI behavior, AI logic, and AI
> improvements."

> "Deliverables: at least 4 improvements to existing AI behaviors and logic,
> and at least 8 new behaviors/logic - each being significant and receiving
> equal attention."

> "In addition, the coalition building mechanic needs a serious overhaul - its
> way too flat, uninteresting, and unengaging."

They previously rated the AI **1 out of 10** and asked for **8-10 out of 10**.

## What you must read before proposing

1. `/home/user/Vale/docs/S21-BASELINE.md` — every figure measured on the
   shipped build over 720 driven sessions. Argue from these, not from
   impressions.
2. Every `.md` file in this directory except `BRIEF.md` and this file — the
   subsystem intake reports. They carry line numbers.
3. `/home/user/Vale/CLAUDE.md` in full — the defect families this codebase
   ships repeatedly. Your design will be judged partly on whether it avoids
   them.
4. Enough of `/home/user/Vale/vale.html` to know your proposals are buildable.
   **Never read it whole** — grep, then Read windows of <= 100 lines.

## Hard constraints your design must respect

- **One file, no build step, no dependencies, opens from `file://`.** No new
  external references, ever.
- **All randomness goes through `rand()`**, whose state rides the save. A gate
  in front of `rand()` changes how many numbers come off the stream, which
  re-phases every seeded campaign — so a new read must not roll.
- **The AI level scale's floor is the shipped game exactly.** `v19LevelOf` has
  four rungs; at `instinct` (`sharp: 0`) the behaviour must be byte-identical
  to what shipped. New terms gate on `v19Thinks` or on a level scalar.
- **Saves may break pre-release, but only loudly.** A field a new mechanic
  needs must be backfilled by the `enrich` path, not assumed.
- **A field written and read by nothing is decoration** and will be deleted in
  review. Every value your design writes must name its reader.
- **A covered surface beats a hand-kept list.** Where your design adds a
  registry (a table of verbs, weights, or kinds), it must be possible for
  `roads.js` to fail when a later slice adds an entry without wiring it.
- The existing harness holds ~200 assertions and must stay green, or a change
  to one must be argued for explicitly.

## What a good proposal looks like

For EACH item you propose:

- **Name** and whether it is an IMPROVEMENT to something that exists or a NEW
  behaviour.
- **The defect or absence it addresses**, with the measured figure from the
  baseline or a line number from the intake.
- **The mechanism**, concretely: which functions change, what state is added,
  who writes it and who reads it. Name the reader.
- **What the player SEES.** An engine behaviour the player cannot perceive
  reads as randomness however good it is. If it emits nothing, say what
  surface you would add.
- **How it would be measured**, i.e. the assertion that would fail if it
  regressed, and the number that assertion would pin.
- **What it costs**: rough size, risk to existing assertions, and whether it
  touches the seeded stream.

## The shape you are aiming at

At least 4 improvements and at least 8 new behaviours, **each significant**.
The owner explicitly said each must receive **equal attention** — a proposal
with three deep items and nine one-liners fails the brief. Plus a coalition
overhaul substantial enough to answer "flat, uninteresting, unengaging".

Prefer changes that give the engine **consequence across sessions**: an aim it
can finish, a relationship that is more than one number, a threat it can carry
out, a memory of being helped, and a reason for the player to believe an
opponent is pursuing something over a campaign. The baseline says the engine
already ACTS enough — 4,941 initiatives, no wasted sessions, all eleven cards
played. Adding more actions is not the answer. Making the actions MEAN
something across time is.

Beware of proposing what already exists. The coalition machinery in particular
is far richer than its measured behaviour suggests: a formation rotation with
four branches, offers with portfolios and concessions and red lines, an
investiture vote, a written agreement, a cohesion meter, a ledger, and five
management verbs. Almost all of it is built and inert. **Making existing
machinery bite is usually a better proposal than adding a parallel mechanism**,
and this codebase punishes parallel mechanisms specifically.

## Output

Write your proposal to the path you are given. Then reply to me with at most 15
lines: your file path, your single strongest item, your riskiest item, and
anything you think the other designers will get wrong.
