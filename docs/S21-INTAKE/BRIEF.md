# S21 intake brief — read this first

You are reading ONE FILE: `/home/user/Vale/vale.html`. It is a 3.7 MB
self-contained turn-based government simulator (parties, an assembly, statutes,
an executive, elections). You are producing intake for a large upgrade to its
AI.

## Absolute rules

- **NEVER read `vale.html` whole.** It would consume your entire context. Use
  `grep -n` first, then Read with `offset`/`limit` windows of <= 100 lines.
- Read `/home/user/Vale/CLAUDE.md` in full — it is short and it lists the exact
  defect families this codebase repeatedly ships. Apply them.
- Grep the headings of `/home/user/Vale/docs/MAP.md` and read the sections
  relevant to your area.
- **EVERY claim carries a line number and a symbol name.** A claim you cannot
  anchor to a line is a claim you drop.
- Never infer behaviour from a function name. Read the body.
- **A field written in several places and read by nothing is decoration.** When
  you find a value being set, grep for a READER before believing it does
  anything. Say which grep you ran. The same applies to a gate that guards a
  path nothing reaches.
- Where you are unsure, say "unverified" rather than asserting.

## Naming conventions from prior slices

`v6*` core loop and events · `v8*`/`pv5*` bill surfaces · `v10*` orders ·
`v11*` constitution/articles · `v15*` campaigning, purse, exec offices ·
`v16*` the AI deck and grudge memory · `v17*` instruments, formation rotation,
executive races, floor, deals · `v18*` tempo and posture · `v19*` goals,
scoring, rivalry, temperament · `v20*` the seat-by-seat division count and
aim-reading.

## Already measured — do not re-derive, and do not contradict without evidence

From 720 driven sessions at `aiLevel: ruthless` (see `docs/S21-BASELINE.md`):

- **1,025 real initiatives** (23.7% of party-sessions), 0 cards returning null.
  The mix is NOT even: court 27.3%, demand 16.0%, organise 15.3%, order 7.8%,
  attack 7.2%, floor 6.7%, campaign 6.3%, article 4.6%, bill 4.6%,
  platform 2.3%, pact 1.8%.
- **Any instrument wrapping a card's `run` must check `V19_SIMULATING`** —
  `v19Try` replays every open card on a clone to score it, and an unguarded
  probe counts 3,916 rehearsals as plays. This mistake was made and corrected
  in this very baseline.
- Postures: hold 39.2%, partner 20.7%, govern 16.0%, moderate 10.1%,
  organise 7.9%, attack 4.9%.
- Goals: 22 reached, 133 stalled, 3 given up — **86% abandoned**. `oust` was
  held **0 times**.
- Formation: **360 of 360 outcomes were `majority`**; minority, grand and
  caretaker never fired. 354 of 360 settled in round one. The largest party
  formed the government 98.3% of the time. **No investiture vote has ever
  failed.** Offers carry exactly 3 concessions and exactly 1 red line every
  time.
- Between elections: **3 coalition changes in 720 sessions**, 2
  `coalition_demand` papers, 1 `confidence_threat`.
- `st.partyRel`: min 0, median 33.5, max 75.9. `shiftPartyRel` called 2,164
  times at mean magnitude 4.71.
- Grudge mean 22.13, max 100 (the clamp). **No gratitude or positive-memory
  field exists anywhere in the file.**
- `v19Outcome` is a ONE-PLY simulation: clone, run the card, read
  `v19Standing`. No opponent reply, no second move, no next session.

## Output

Write your report to the path you are given, as Markdown. Structure:

```
# <area>

## What it does today
2-5 sentences, concrete.

## Findings
### <short title> — [works | shallow | decorative | missing | inconsistent | exploitable]
- **What:** what the code does, concretely
- **Evidence:** `symbol` at line N (several)
- **Why it matters:** to how the game plays
- **Upgrade:** the concrete change you would make

## State channels
| field | written by | read by (or NONE FOUND + the grep) |

## What I could not verify
```

Verdict meanings: `works` = does what it claims. `shallow` = real but trivially
thin. `decorative` = written and read by nothing. `missing` = a behaviour a
player would expect that does not exist. `inconsistent` = two mechanisms
disagree. `exploitable` = a player can trivially defeat it.

Aim for 8-20 findings. Err toward reporting too much. Be blunt about what is
thin. When you finish, reply to me with at most 12 lines: the file you wrote,
your 3 sharpest findings as one line each, and anything you could not verify.
