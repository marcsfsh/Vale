# S19 — The parties think

**THIS FILE IS THE PROGRAM'S ANCHOR.** It is written to survive context
compaction: every ruling, finding and decision lands HERE, not in
conversation. Re-read it top to bottom at the start of any work session on
this program.

Status: PLAN OPEN. Two owner rulings recorded. Investigation in flight.

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

(filled in as the mappers report)

## Design

(to be written once the findings land)

## Slices

(to be written)
