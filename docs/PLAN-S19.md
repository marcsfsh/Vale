# S19 — The parties think

**THIS FILE IS THE PROGRAM'S ANCHOR.** It is written to survive context
compaction: every ruling, finding and decision lands HERE, not in
conversation. Re-read it top to bottom at the start of any work session on
this program.

Status: PLAN OPEN. Two owner rulings recorded and BOTH SHIPPED in S19a.
Investigation closed; findings and slices below. Three of seven reasoning
layers built (S19a, PR #92): goals held across sessions, deliberation by
rehearsal, floor arithmetic. Four remain and are designed under Slices.

---

## The owner's brief (2026-08-29, verbatim)

> "So the AI is done? I really want the game's parties to have a seriously
> robust, very sophisticated ai with lots of logic and capabilities"

Answered: no. S18e fixed WHEN a party acts and left WHAT it does and WHETHER
IT THINKS untouched.

## What was measured before the program started

- **The whole decision is a coin flip.** `open[Math.floor(rand() * open.length)]`
  at vale.html:33976. A party filters the deck by posture and by what it can
  afford, then picks one of what remains with equal probability. No
  evaluation, no preference, no comparison of what would help it.
- **Ten verbs against hundreds.** `V16_AI_DECK` holds 10 cards. The player has
  582 statutes, 90 orders, 81 articles, 60 measures, 20 treaties and roughly
  200 action cards. S17k opened four doors to engines; the rest are the
  player's alone.
- **No goal exists anywhere in the model.** `st.ai[pid]` carries
  `{posture, grudge, last, acts, spent, since}` — a stance, a grievance
  ledger and a cooldown table. Nothing says what a party is TRYING to do, so
  nothing persists across sessions and nothing can be planned toward.

- **What the player actually reads is a list of unrelated events.** Forty
  sessions from the bench produce 2.70 log lines a session from other parties,
  which is not thin. The defect is that nothing connects them. A real sample,
  in order:

  ```
  The FP spent the season courting urban professionals.
  The RSF spent the season courting organised labour.
  The FP used private members' time to introduce the Lobbying Restrictions Bill.
  The TVC and the CUP agreed to stand down for each other in most seats.
  The LP laid Article of Equalisation before the country.
  ```

  Each is well written and each was an independent coin flip. Nothing the FP
  did in one session has anything to do with what it did in the next, so a
  player cannot form a picture of what the FP is doing, because the FP is not
  doing anything. **This is the defect stated from the player's side, and it
  is what R2 exists to make visible.**

## Owner rulings

**R1 — A SEPARATE AI DIFFICULTY SETTING (2026-08-29).**
> "Add a separate AI difficulty setting. The main difficulty is for non-AI
> mechanics"

The existing `DIFFS` scale stays what it is and keeps governing the non-AI
model. AI sophistication is its OWN setting, chosen independently at the
start of a campaign and riding the save. A player may take a punishing
economy with naive parties, or a gentle economy against parties that plan.

Consequences the plan must respect:
- a new start-screen control beside the difficulty picker, and an entry in
  the custom-start editor and its cleaner;
- the setting is a first-class save field with a loud, valid default for
  saves written before it existed;
- every competence term reads the AI setting and NOT `st.diff`;
- the harness asserts the levels actually differ IN PLAY, or the setting is
  the "knob nothing can turn" defect wearing a new hat.

**R2 — STATE THE AIM AND THE REASONING (2026-08-29).**
The Parties page says what each party is pursuing and why it did what it did
last session. The board is readable like a diplomacy screen.

Consequences:
- every goal carries authored prose naming it from the party's own side;
- every deck card can say why IT was the thing chosen, given the goal and the
  board — which means the chooser must record its reason, not just its pick;
- the prose goes through `docs/PROSE-STYLE.md` and `tools/rungs.js`;
- contrast and the thumb at three tiers for whatever this adds to the panel.

## Findings from the investigation

**All three reports landed and S19a shipped from them (PR #92).** The findings
are recorded here rather than left in `docs/MAP.md` alone, because this file is
the anchor and MAP.md is the map.

- **The decision was one line.** `open[Math.floor(rand() * open.length)]`, a
  uniform draw over whatever the posture filter and the purse left open. Ten
  cards, no evaluation of any of them.
- **The simulator was already in the file and wired to ONE decision.**
  `v6Sandbox` (vale.html:19235) clones the state and stubs the nine globals
  that render or save; `v17Utility` (vale.html:13352) scores a state from a
  named party's own values. Together they are a working "what would happen,
  and would I like it", and the only caller was `v17AiDecide`, the ruling
  party's crisis card. Everything else in the game was a table or a draw.
- **`v17Utility` alone is blind to nine of the ten cards.** It reads national
  indicators and bloc moods. `organise` writes `st.machine`, `campaign` writes
  `st.funding`, `platform` writes `st.push`, `pact` writes `st.aiPacts`, and
  it reads none of them. Only `court` scored, because blocs are the one thing
  both sides touch. This is why `v19Standing` exists and why `v17Utility` was
  left untouched.
- **"Pick the close vote" describes a state this game does not produce.**
  `v17AiFloorFor` chose the bill FURTHEST from where the party stood.
  Measured, 63 of 67 live bills sit within one division's noise of the bar, so
  distance-from-the-bar cannot separate them. The term that works is which WAY
  the bill is going: a bill headed where a party wants it needs nothing from
  that party. `V19_FLOOR_BAR` closes the card when nothing on the floor needs
  it.
- **A goal must be KEPT or it is not an aim.** Measured at a 7% change rate
  over 174 party-sessions, with `V19_GOAL_STALE` at 14 sessions.
- **`V19_LEVELS` cannot live with the AI code.** The start screen and
  `newGame` both name it and both are evaluated 25,000 lines earlier;
  declaring it beside `v19Choose` threw `V19_LEVELS is not defined` on boot.
  It sits beside `DIFFS` at vale.html:431.

**Six times the measurement corrected the design rather than confirming it**,
and the list is the slice's real output:

1. a worth table hand-written beside a working simulator;
2. an objective blind to nine of ten cards;
3. an instrument counting rehearsals as initiatives, which made a party look
   five times as busy at the levels that think (`V19_SIMULATING` is the fix);
4. "the close vote" describing a state the game never produces;
5. a differentiation arm asking whether left and right disagree about a card's
   SIGN, which they rightly do not, where the question is whether they RANK it
   differently;
6. three arms measuring the machinery's internals rather than its effect, one
   of which read `againstMe` straight from the picker, so a build that
   hard-coded that field true passed while behaving no differently.

## Design

**The architecture S19a established, which the remaining layers extend.**

```
v16AiTurn(st)                     the session loop, one pass per party
  v18TempoOdds(st, pid)           S18e: WHETHER this party moves now
  v16Posture(st, pid)             the stance, from circumstance
  V16_AI_DECK.filter(...)         what posture and purse leave open
  v19Goal(st, pid)                WHAT it is working toward   <- writing path
  v19Choose(st, pid, open, goal)  WHICH card, weighted draw
    v19Score(st, pid, card, goal)
      goal.worth[card.id]         what the card does for the aim
      recency, affordability
      v19Outcome(st, pid, card)   what the card would LEAVE BEHIND
        v19Try(st, fn)            clone, stub, rehearse on the clone's dice
        v19Standing(st, pid)      v17Utility + the party's own position
  a.why = {...}                   R2: what it was for, for the panel
```

**Four rules this architecture imposes on anything added to it.**

- **R1 is a gate on every competence term.** A new term reads
  `v19LevelOf(st)` and never `st.diff`. `instinct` must stay the shipped
  uniform draw exactly, which means a new term contributes nought at
  sharpness 0.
- **One die per party per session, drawn before any test.** S18c's lesson:
  a gate in front of `rand()` decides how many numbers come off the stream,
  so a new mechanism that rolls re-phases the whole seeded campaign. A new
  layer that needs a decision takes it from the score, not from a second die.
- **A read must not create.** `v19Goal` ADOPTS when there is no goal, and
  adopting calls `rand()`. Any layer where one party asks about ANOTHER party
  goes through a reading accessor that returns what is stored and writes
  nothing.
- **The rehearsal budget is real.** `v19Outcome` costs 0.97ms a card on a
  78KB state; five candidates is ~5ms against a session that costs 8ms. A
  layer that rehearses N opponents x M cards multiplies that and is out unless
  it is bounded.

## Slices

**S19b — A party knows who is in its way (opponent modelling).** SHIPPED.
A party reads the standing aims of the others and answers the one in its way,
in WHICH card it plays (`V19_RIVAL_WORTH` through a term in `v19Score`) and in
WHOM it plays it at (the `attack` target picker, added to the grudge rather
than replacing it). `v19GoalSeen` is the reading accessor the third rule above
demands; `v19Rivalry` holds the four clauses; `v19Rival` summarises the board
once a party-session. Bought at `shrewd` and above.

Three findings the measurement forced, recorded because they are the reusable
part:
- **The ally half does not exist in this game.** The only clause that can
  produce a positive rivalry is two parties carrying the same statute the same
  way, and it fired 0 times in 25,200 party pairs. The alignment term, the
  `friend` weights and the pact reordering were all deleted. Any later slice
  tempted to build cooperation between parties has to build the CHANNEL first;
  the goals as they stand cannot collide constructively.
- **A term needs `sharp` to bite, so a new competence rung is not free.** Read
  at `purposeful` (sharp 1.4) the rival term moved nothing and one reading of
  it ran backwards; at `ruthless` (sharp 5) it decides picks. A layer added to
  `v19Score` belongs where the sharpness can carry it.
- **Two rivals of different sizes never occur**, so any future term that ranks
  rivals against each other is ranking a set of size one.

**S19c — Bargaining between parties.** Depends on a CHANNEL that does not yet
exist: see the first finding above. `st.aiPacts` is the only standing
agreement in the model, a single field with no terms, and the goals as
authored cannot align. Before writing an offer, build something two parties
can both want.

**S19d — Temperament.** Per-party character shaping the weights, held across
a campaign. Cheapest of the four and orthogonal to the others; it is placed
after S19b so that what it modifies includes the opponent terms.

**S19e — Reaction between scheduled turns.** Held to last deliberately. It
touches `V16_AI_CADENCE`, the dial the owner swept, and `v18TempoOdds`
normalises against a total that dial sets. The S18e comment records what
moving it costs: six parties acting every session took the harness from 5.5
elections won to 1.2.
