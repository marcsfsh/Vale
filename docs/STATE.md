# Where are we, what's next

Update this file in the last commit of every PR.

## Current slice

**S14 — Truth, then the seams**, third of five PRs. The dead-body ratchet made
honest before it is moved. No `vale.html` change.

### The check was reading a boolean, not the code

`checks/run.js` counted `aliasCaptured === false` out of `dead-bodies.json`. It
never asked whether the alias exists, or whether anything ever reads it. Two
sites lived in that gap:

| site | alias | reads |
|---|---|---|
| `regionPartyFactor#1` | `v11RegionFactorBase` | **0** |
| `actBlocked#1` | `v11ActBlockedBase` | **0**, and its own adjudication says **"DELIBERATELY NOT CALLED"** in capitals |

Both bodies are as orphaned as the five the ratchet already counted. Both wore
an alias. Both scored green.

**An alias that is never read is not a capture.** The check derives that now:
find the `var X = <name>;` declared above the site, count the reads of `X` in
the file, and treat zero reads exactly like no alias at all. The recorded
boolean is still there and is now **cross-checked against the derivation**, so
the file cannot drift away from the code again without failing.

The rule was validated against the file it replaces before it shipped: it
**agrees with 197 of the 199 hand adjudications** and disagrees on exactly the
two the survey named. `maxDead` moves **5 to 7**, which is the instrument being
corrected rather than the file getting worse. The target is still 0 and PR D
goes after it.

### The adjudication file's own rot

**All 199 `line` fields were stale, and 28 were literally `0`**, because nothing
maintained them and every edit above a site moves it. They are deleted rather
than re-derived: a number nothing maintains will be wrong again next commit.
`node checks/run.js --sites` prints the live enumeration instead — every site
with its current line, its alias, where the alias is declared and how many
times it is read.

**`indicatorTargets#3` and `#4` had each other's alias.** #3 (`:24150`) is the
**treaty** wrapper and #4 (`:24165`) is the **order** wrapper; the file said the
reverse. An ordinal-shift artefact, which is the exact failure `MAP.md` warns
about two sections above where it happened.

### Half of poison.js was pointing at nothing

Five of its ten anchors named bodies S2 deleted — the tool that did the
deleting was never told. `runQueue`, `pv5CommandPalette` and `v6Menu` are gone
from the file; `startScreen` and `helpDialog` lost their v4 declarations and
survive only as later reassignments, which cannot be anchored by opening line
because `helpDialog` has three of them.

The five that remain are exactly the five bodies PR D has to prove dead.
**`--list` now verifies every anchor against the file and exits 1 if one has
rotted**, so the registry cannot go stale in silence twice, and `poison.js`
takes `VALE_FILE` like every other tool here — which is how that self-check is
proved able to fail.

### Every change ships with the mutation that reddens it

| the change | the proof |
|---|---|
| the derived capture rule | put `actBlocked#1`'s boolean back to `true` in a clone: **FAIL**, `its alias v11ActBlockedBase is read 0 time(s) in the file` |
| the corrected count | put `maxDead` back to 5 in a clone: **FAIL**, `7 orphaned bodies exceeds maxDead 5` |
| the registry self-check | `--list` against a build with `v6mCenterTab` renamed: **exit 1**, `GONE — the body this anchored no longer exists` |

```
ALL CHECKS PASS   11/11, dead-body-ratchet 199 sites, 7 orphaned (max 7, target 0)
ROADS OK          92 assertions
PLAYTEST PASS     42 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

Next: **PR D**, the number driven to zero with proofs. The five original
orphans are live only through three boot statements — `:12752` `render()`,
`:13661` `S=enrichState(S,false);render();` and the two mobile calls on
`:16598` — and the v6 boot re-enriches, re-renders and opens the start screen
immediately afterwards, so the v4 and v5 renders are redundant redraws of a
screen that is replaced before anyone sees it. Remove those three, poison-prove
**one body at a time** (S2 paid for this: a `throw` aborts its block and hides
every later call, and `renderStats` inside `render` plus both mobile calls on
one line are four of these five sites), delete each proven body, promote the
first surviving assignment to a declaration, and re-derive every ordinal key
afterwards. The two S11 orphans stay: both bodies were meant to be replaced,
and the honest end state for them is a recorded verdict, not a deletion.

Previously: **S14 — Truth, then the seams**, second of five PRs. Three live defects, and a
fourth the first fix found on its way past.

### A number that is not a number is now announced

`clamp` (`:8660`) answered NaN with NaN. Every comparison against NaN is false,
so the poison came straight back and the caller stored it. S11d had one reach
**the ballot weight itself** with nothing on screen to say so, caught by an
exhaustive 128-subset probe on the branch and never fixed at the source.

Both bad inputs are now named rather than passed on: a value that cannot be
ordered against its bounds, and **bounds the wrong way round** — `clamp(-.1, 0,
-2)` used to answer 0, which is neither bound the caller meant. Each distinct
fault is said once, to the console with a stack and to a banner built by hand
and attached to `document.body`. Built by hand deliberately: it has to survive
whatever state broke the model, and a rendered notice would be one more thing a
marker or a splice could lose. A bound is returned instead of the poison.

**The predicate was measured before it shipped**, on an instrumented copy that
only counted. Zero faults across `playtest.js` (41 steps, all 15 views, reload,
resume, corrupt save), zero across sixty turns of ordinary play, and **exactly
one** across `roads.js`.

### The one it found

That one was real. `pv5MinisterAction`'s brief branch clamped to a hardcoded
**96** while `v11MinisterCeiling` gives a schooled minister up to **102**, so
briefing a minister the college had already carried past 96 knocked them
straight back down to it. The ceiling the player had just bought, refunded on
the spot, for 2 capital, silently — which is the exact defect S11e wrote that
branch to fix, reappearing through a door S11e itself opened.

Measured on the branch: a schooled minister at **96.30** against a ceiling of
100 read **96.00** after a briefing. It now reads **99.33**.

### Fixtures are named, never taken by position

Seven probes across the two harnesses picked their subject with
`.filter(...)[0]`. **40 of the 72 orders satisfy the first predicate**, so
inserting an order above it leaves the assertion passing about a different
order than the one it was written for.

The drift, demonstrated rather than argued: rename `establishmentFreeze` in the
game and **the old `playtest.js` passes all 41 steps**, having tested some other
order, while the old `roads.js` fails exactly one assertion — the canary S11b
pinned at one of the seven sites, which caught the rename and could not stop the
other six from retargeting. Every probe now goes through `pick(list, id, pred,
what)`, which throws by name when its fixture is gone or has lost the property
it was chosen for. S11b's canary comparison is dropped: with `pick` it would be
tautological.

### The size check can catch what it is kept for again

At a 10 MB ceiling against a 3.0 MB file it could not. `baseline.json` says the
check is kept for **a runaway apply duplicating a region**, which is a few
hundred KB. The absolute ceiling stays; the biting bound is now growth against
`HEAD:vale.html`, at **250,000 bytes**, taken from this file's own history — the
largest legitimate single-commit growth ever recorded here is 204,136 (S10d/e/f),
then 167,628 (S9h) and 135,356 (S12 PR6). A copy under `VALE_FILE` or a repo
with nothing committed says so rather than passing quietly.

### Every change ships with the mutation that reddens it

| the fix | the proof |
|---|---|
| clamp announces bad input | `nan-is-announced` on the pre-fix file: `clamp(NaN,0,100)` answered NaN, `clamp(5,10,0)` answered 10, 0 faults latched, no banner |
| the ministry ceiling | `a briefing does not undo the college` on the pre-fix file: 96.30 → **96.00** |
| `V14_FAULTS` empty after every road | a mutant with the ministry fix reverted and the loud clamp kept: **2 clamp faults**, both named with their arguments |
| named fixtures | the renamed-order build above: new harnesses name it, old ones pass |
| the growth bound | a clone with 300 KB of the file duplicated into itself: **+300,344 over the bound** |

Render cost of the clamp change, three collapsed-render samples each side:
8.45-9.71 ms after against 8.54-11.10 ms before. The ranges overlap; there is no
difference to measure at this resolution. The in-range path is the same two
comparisons it always was, and only a value outside its bounds pays for the
call.

```
ALL CHECKS PASS   11/11, 2,998,414 bytes of 10,000,000, +3,152 since HEAD of 250,000
ROADS OK          92 assertions
PLAYTEST PASS     42 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

`vale.html` gains the fault machinery and loses four lines: the old `clamp`, and
the three lines of the brief branch that read 96.

Next: **PR C**, the dead-body ratchet made honest before it is moved.
`checks/run.js` counts a hand-written `aliasCaptured` boolean and never checks
that the alias exists or is ever read, so two sites (`v11RegionFactorBase`,
`v11ActBlockedBase`, the second adjudicated as **"DELIBERATELY NOT CALLED"**)
are as orphaned as the five it counts and score green. The true count is 7.
Then **PR D** drives it to zero with poison proofs, and **PR E** splits the
marker check.

Previously: **S14 — Truth, then the seams**, first of five PRs. No code in this one: it
makes the three documents say what is true, and rescues a handoff that would
have died on the next clone.

### What the documents claimed

| where | said | truth |
|---|---|---|
| `CLAUDE.md:6` | `vale.html` is 1.4 MB | **3.0 MB**, and that line's only job is context safety |
| `MAP.md` | 93 `Math.random()` sites and no seeded PRNG | **one**, `rand()`'s pre-game fallback; 111 calls route through the seeded engine. S3 made this false eleven slices ago and it was copied forward every time |
| `MAP.md` | the two font requests fail cosmetically offline | the fonts are embedded data URIs. The line fourteen above it already said so, so the file contradicted itself |
| `STATE.md` ratchet list | three of six figures | strict is 8/8 not 7/7; dead sites are max 5 target 0, not max 10; the size cap is 10 MB against a 3.0 MB file, not 1.6 against 1.43 |
| `STATE.md` | 21 literal markers in one place, 25 in two others | **25** |
| `STATE.md` | the two party-palette collapses are still the owner's open question | S7 closed them. Every pair that collapses under the three dichromacies is an **adjacent** pair, which is exactly where S6b put the aisles and the direct labels |
| `CLAUDE.md` command list | omitted `tools/roads.js` | **90 assertions, the largest content harness in the repo.** Also missing: `tools/rungs.js`, `tools/prose/` and `docs/PROSE-STYLE.md` |

Every one of these was true when written. That is the point: a document that is
never re-read against the code decays into confident misdirection, and the two
worst entries here, the size line and the `Math.random()` count, are the two a
new session acts on before it has read anything else.

### `docs/PROSE-RESIDUE.md` is new

The 62 ladders both round-3 readers still fail were recorded in
`tools/out/rungs/sweep-repair.json`. `tools/out/` is gitignored, so the list
existed only in the container that made it, and the handoff it was written for
would have found an empty path. It is now tracked and broken down by book,
alongside the two earlier S12 residues, with the reasoning for not running a
second repair round and the commands to re-derive it.

**Taxation carries seven of the 62**, the worst book, and it is the book whose
ladder is a rate: two adjacent rates read as one statute to a reader shown no
numbers. **Technology carries none.** `juryReformAct` is on the S12 batch-3 list
and on the round-3 list, the only statute to resist two independent repair passes
with different readers each time.

```
ALL CHECKS PASS   11/11, 2,995,262 bytes of 10,000,000
ROADS OK          90 assertions
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

`vale.html` is untouched: `git diff --stat` names only `CLAUDE.md`, `docs/MAP.md`,
`docs/STATE.md` and the new `docs/PROSE-RESIDUE.md`.

Next: **S14 PR B**, three live defects. `clamp` (~`:4426`) passes NaN through and
`STATE.md` already records a NaN reaching the vote model with nothing on screen
to say so; make it loud in the S9a sense, with a probe that reddens without the
fix. De-positionalise the four `V10_ORDERS…[0]` probes (`roads.js:434,448,458`,
`playtest.js:552`) onto a stable id. Reshape the size check into a growth bound
against `HEAD:vale.html`, since at a 10 MB ceiling it can no longer catch the
duplicated region it is kept for. Then PR C and PR D on the dead-body ratchet
(make it honest, then drive it to zero with poison proofs), and PR E on the
marker check, where **13 of the 24 multi-occurrence markers can never fail**:
`occurrences >= 2` is vacuously true forever for `</div>`, `<div`, `</button>`
and ten more generic structural strings.

Previously: **S13b — The whole book read aloud** (PR #42, merged). Every S12 ordering figure came
from a forty-ladder sample, and the repair pass fixed exactly the ladders that
sample failed, then re-scored the same forty. Roughly five hundred of the five
hundred and eighty two ladders had never been read by anyone. This reads all of
them.

### Three rounds, no sampling

| | placements | exact | tau | mis-ordered by both |
|---|---|---|---|---|
| **round 1**, readers A and B | 82.1 / 82.4% | 66.7 / 67.7% | 0.861 / 0.864 | **163 of 582, 28.0%** |
| **round 3**, readers C and D | **92.3 / 91.5%** | **85.4 / 84.4%** | **0.946 / 0.938** | **62 of 582, 10.7%** |

Round 1's two readers gave **identical orderings on 89 per cent** of the book
without seeing each other's work, which is what makes "both readers failed it" a
selection worth acting on rather than one reader's quirk. Round 3 used **fresh
readers and fresh shuffles**, and neither took any part in choosing what got
repaired.

### The one-axis rule, measured on the whole population

Round 1 split by the batch that authored each book:

| authored | before | after |
|---|---|---|
| **before the one-axis rule** (PR 1-3, 240 statutes) | **59.2%** | **81.7%** |
| **after it** (PR 4-5, 216 statutes) | **77.8%** | **89.4%** |
| the imperial books (PR 6) | 61.9% | 85.7% |

An eighteen point gap landing exactly where the rule entered the brief, on all
582 rather than a sample. It also means the weakest books were the ones written
first: **Capital at 37.5 per cent, Health at 45.8, and Taxation at 50** - and
Taxation is the book whose worked example every later agent was anchored to. The
repair prompt for it said so.

After the sweep no book sits below 66.7 per cent, and the batch that had been
worst, PR 2, went from 56.2 to 83.3.

### The repair

**163 statutes, 458 rung fields, no `desc` lines, and no non-target statute
touched in any of the twenty-three books.** Every one of those counts is a diff
against a snapshot taken before the agent ran, not a figure the agent reported.

The corpus rules then caught the repairs putting "or not at all" back into seven
statutes after it had been trimmed to five earlier in the slice. **This is the
fourth time a repair pass has reintroduced a phrase an earlier pass removed**,
which is why the rule runs over the whole corpus after every apply rather than
over the books that changed. Twenty-three agents rewriting in parallel cannot see
each other.

The prose mean moved from **240 to 259 characters**. The cap was lifted to ten
megabytes at the top of this slice and the widened window is being spent where a
ladder needed room to establish one axis, not on making every description longer.

### What this number is and is not

This is an **exhaustive audit of a fixed corpus**, not an estimate of unseen
prose. The population is these 582 ladders; there is no future test set. Round 3
is still in-sample in the sense that the repairs were chosen by round 1, and it
is reported as such. What it is not is the S12 mistake: the selection set is the
whole book, so there is no unread tail, and the readers who produced the final
number had nothing to do with picking the targets.

The generalisation evidence stays what it always was, the **draft-stage** figures
taken before any repair touched a batch: 37.5 and 30.0 per cent for PR 3, then
75.0 and 80.0 for PR 4 once the rule existed.

### Sixty-two ladders still resist

Both round-3 readers still fail 62 of 582. They are named, by book, in
`docs/PROSE-RESIDUE.md`, which also carries the two earlier S12 residues.
(S14a: this entry originally pointed at `tools/out/rungs/sweep-repair.json`,
which is gitignored, so the handoff died on clone.) A second repair
round on them is available and was not run: the marginal ladder here is one where
two rungs are genuinely close in severity, and forcing a gap risks the failure
that matters more, prose that reads in order and describes nothing.

```
ALL CHECKS PASS   11/11, 2,995,262 bytes of 10,000,000
ROADS OK          90 assertions
RUNGS OK          2,328 descriptions, mean 259
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

Every changed line in `vale.html` is a `desc:`, a `rungs:[`, a quoted rung string
or its closing bracket. Filtered on exactly that, residue **zero**.

Next: **marker/seam consolidation**, deferred out of S2 and S6 and the largest
remaining stabilisation item. 25 literal splice markers, dead-body ratchet 5 to 0.

Previously: **S13a — Carry the skill, do not summarise it** (PR #41, merged). The owner asked whether
the uploaded `writing-style` skill had actually been used on the statute prose.
It had, but not whole, and the gap is worth recording because it was invisible
from inside the pipeline.

### The defect was a paraphrase

The authoring brief was **112 lines standing in for a 161-line skill**. It
carried three of the four forms of negative parallelism the skill names and
dropped the fourth, **"X rather than Y"**. Twenty-five authoring agents and the
mechanical checker were all working from the paraphrase, so none of them ever saw
that rule, and nothing downstream could notice a rule that was never stated.

**The fix is to stop paraphrasing.** `docs/PROSE-STYLE.md` is now the skill's own
text, unchanged, followed by a statute addendum carrying only what the skill
cannot know about this surface: no digits, exactly four rungs, ASCII, the length
window, bloc and indicator names as required vocabulary, and the one-axis rule.
It is **committed** rather than living in a gitignored working directory, so the
repository holds the standard its prose was written to.

### Audited, not asserted

Every rule in the skill, run over all **2,910 authored pieces**:

| rule | hits |
|---|---|
| copula avoidance | 1 |
| inflated verbs | 1 |
| significance inflation, trend framing, borrowed authority, promotional tone, vague attribution, challenges-and-outlook, throat-clearing, hedging stacks, summary endings, false ranges, participle tails, banned words | **0 each** |

Two genuine hits, both fixed: a land register **maintained** where the same
sentence already **keeps** a police force, and papers **jointly authored** rather
than written.

### The new rules caught a five-year-old bug in the old ones

Adding the dropped rules fired twice, both times **inside a longer word**:
"serves to" within *deserves to be annoyed*, "in summary" within *publishes in
summary*, which is a summarised edition and not the banned closing paragraph.
`PHRASES` had been matched with a raw `indexOf` since the day it was written. **A
phrase rule that matches mid-word measures spelling, not writing.** It now uses
word boundaries, and "in summary" only counts sentence-initially.

### "X rather than Y" is deliberately not checked

The dropped rule turned out to be the one that must not be mechanised. It appears
in **276 pieces across 223 statutes, 38 per cent of the book**. A blind judge
scored a forty-sample: **37 informative, 3 reflexive.** A blanket ban would run at
**7.5 per cent precision**, worse than the specificity floor demoted at 18.

The skill anticipates the case in its own closing note: *"These are tendencies,
not a detector. Human writers use em dashes, triads, and the word crucial all the
time. The problem is AI prose reaching for them by reflex, in place of
specifics."* Most uses here deliver a specific by ruling out what a reader would
otherwise assume, and deleting the contrast loses the prior rule being displaced:
governed by order rather than by statute, received by rather than postmarked by,
market value rather than income value.

The three the judge caught ruled out a category nobody would have assumed and
were rewritten. The rule now lives in the brief's addendum for the verify pass,
with the measurement recorded in the checker beside the decision not to automate
it. **Triads** get the same treatment: 158 three-item lists, mostly real
inventories, so the addendum separates "vehicles, premises and goods" from
"duller, steadier and slower" instead of banning both.

### The caps are lifted

`maxBytes` **3,100,000 to 10,000,000** on the owner's ruling that the cap is
soft. The check is **kept, not deleted**, because it still catches the one
failure that threatens this file: a runaway `--apply` duplicating a region, which
came close twice in S12. The prose window widens to **90-460** characters and the
target mean is deleted; length follows what a ladder needs.

```
ALL CHECKS PASS   11/11, 2,951,249 bytes of 10,000,000
ROADS OK          90 assertions
RUNGS OK          2,328 descriptions, mean 240
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

Fail-proof: seven dropped-rule violations seeded into one rung on a scratch copy
produce eight problems and exit 1, with all eight script blocks still compiling
so the checker is reading prose and not a broken splice.

Next: **S13b**, the exhaustive ladder sweep. Every S12 figure came from a
40-ladder sample, so roughly 500 of 582 ladders have never been read by anyone.

Previously: **S12 follow-up — the inflated figures** (PR #40, merged).
Sixth-of-six had shipped; this is what re-reading its own numbers found.

### Correction: the post-repair ordering figures in PRs #36 to #39 are inflated

**What was wrong.** Each batch sampled forty ladders, measured them blind,
repaired the ones both readers failed, then re-measured **the same forty**. That
was described in those PR bodies as controlling for sample difficulty, which it
does. It also means the second number was taken on the ladders that had just been
optimised against it. **The reported 85.0 to 87.5 per cent exact recovery is a
test-set score, not an estimate of the book.**

**The size of it, measured directly.** A sixty-ladder run over the imperial books
after they shipped, one reader, one run, split by whether a ladder had been in
the repaired forty:

| | exact |
|---|---|
| ladders inside the repaired sample | **95.2%** (20 of 21) |
| ladders never measured before | **66.7%** (26 of 39) |

**28.5 points.** That is the inflation.

**The honest number.** Pooling every ladder from two fresh runs that had never
appeared in any measured sample:

| held-out, n = 98 | placements | exact | tau |
|---|---|---|---|
| **the book as it stands** | **78.3%** | **60.2%** | **0.830** |
| shipped baseline (PR 1) | 78.1% | 57.5% | 0.833 |
| what PRs #36-#39 reported | 92.5-93.1% | 85.0-87.5% | 0.950 |

**The book reads at about the standard PR 1 set, not meaningfully above it.**

**What is unaffected.** The **draft-stage** figures were always fresh
measurements on ladders no repair had touched, so the finding that the one-axis
rule works at authoring time stands unchanged: PR 3's drafts recovered 37.5 and
30.0 per cent, PR 4's 75.0 and 80.0, PR 5's 72.5, PR 6's 77.5 and 75.0. So does
the repair-cost collapse, 123 rung fields to about twenty. And **attribution was
always drawn fresh**: 118 of 120 across all twenty-three books stands.

**The rule this earns.** Never re-measure the sample you repaired against. A
repair pass must be scored on ladders held out from the run that selected its
targets. Any future prose work in this repo measures on a held-out sample or
reports nothing.

**Why the book is not being re-authored.** At 60.2 per cent held-out it sits at
the standard that shipped in PR 1 and was accepted, on a corpus twelve times the
size. Re-repairing 582 ladders to chase a number would be disproportionate, and
repairing against a measurement is what produced this problem in the first place.
The four books' own fresh scores are recorded for whoever picks this up: Empire
90.9, Imperium 76.5, People's State 75.0, The Charter 62.5 per cent.

### The three asks, all delivered

| ask | where |
|---|---|
| very easy pays a minimum of seventy-five capital a session | PR #34, `capFloor` in a new outermost wrapper |
| every policy category reads twenty-four | PR #34, the eleven gated statutes render locked with their condition |
| every policy gets a refreshed description and one per rung | PRs #34 to #39, 2,910 pieces |

### The last batch

The three imperial books were authored as one corpus on purpose. Imperium's
thirty-nine and the People's State's forty-three were **sharded by group** so no
agent held more than twenty-one statutes, each shard reading its whole book
first: the five shards covered both books exactly, no statute written twice and
none dropped. The verify pass found **71 passages, all repaired**, and
substitutable led for the first time in six batches at twenty-three, which is
what writing three books about empire together was meant to expose.

| | placements | exact | tau |
|---|---|---|---|
| drafts as authored | 87.5 / 86.9% | 77.5 / 75.0% | 0.908 |
| **after repair** | **93.1 / 91.9%** | **87.5 / 85.0%** | **0.950 / 0.942** |
| shipped baseline | 78.1% | 57.5% | 0.833 |

The highest ordering scores of the project, on the batch that was hardest by
construction. Four ladders resist both readers and are named rather than swept:
`honours`, `imperialGuilds`, `shockWork`, `wardsOfTheCapital`.

**The Charter got a tier vocabulary of its own**, `Granted / Chartered /
Extended / Sovereign`, having been the only one of twenty-three books with no
`V9_TIERS` row. Display only, checked rather than assumed at all three call
sites, and verified after the change: Taxation and Imperium unmoved at Punitive
and Total.

### The style guide taught its own tic

With all 582 statutes in place the corpus rules fired eight times, and the
dominant finding was one sentence shape across thirteen books: **"the Economy
takes the ___" in fourteen statutes, "the Economy carries the ___" in sixteen,
"the technology sector ___" in twenty-one.**

The origin is traceable. The worked example in the house style guide ends
*"Revenue roughly doubles and the Economy carries the drag"*, and all twenty-five
authoring agents were anchored to it. **The gold standard propagated its own
sentence shape into the corpus.** Nothing in the pipeline was watching for a
teaching example transmitting more than it intended, and no per-book reader could
have seen it. 48 fields were rewritten; the three families now stand at three
statutes each.

### Two rules narrowed on measurement, and one demoted

The overuse rule was wrong twice, one level apart. On the fourth batch it fired
on the bloc names "Students and Young Workers" and "Small Business and Farmers",
which the style brief **requires** the prose to use; exempting grams that sat
inside a name fixed those. On this batch it produced three more straddling the
edge of a name rather than sitting inside it: "and small business and", "business
and farmers who", "and civil liberties fall". A gram three quarters made of
required vocabulary is still measuring the vocabulary. Names are now masked out
of the word stream before grams are built.

Earlier in the slice the **specificity floor** was demoted to a note at eighteen
per cent measured precision, and the repair validator's **prefix test** was
replaced with a whole-string test after reporting three correct repairs as
unrepaired. Four instrument corrections in six batches, each on a measurement
rather than an argument.

### What the arc of the measurements shows

| batch | drafts, exact | after repair | repair cost |
|---|---|---|---|
| PR 3 | 37.5 / 30.0% | 72.5 / 75.0% | 64 statutes, 123 fields |
| PR 4 | 75.0 / 80.0% | 85.0 / 85.0% | 7 statutes, 17 fields |
| PR 5 | 72.5 / 72.5% | 85.0 / 85.0% | 9 statutes, 25 fields |
| PR 6 | 77.5 / 75.0% | 87.5 / 85.0% | 7 statutes, 23 fields |

PR 3 failed its own measurement and the diagnosis produced two permanent changes:
**the ordering run moved ahead of `--apply`**, and the **one-axis rule** went into
the authoring brief. Every batch after it cleared the shipped baseline on raw
authoring output, and the repair bill fell by roughly seven times and stayed
there.

**Whole-corpus measurements, taken blind on the finished book:**

| measurement | result | chance |
|---|---|---|
| attribution, 120 samples across all 23 books | **118/120, 98.3%** | 12.5% |

Both misses are near neighbours inside their own book: The Emergency Censor read
as the Information Standards Act, the Counterterrorism Programme as the
Radicalisation Referral Scheme.

```
ALL CHECKS PASS   11/11, 2,951,257 bytes of 3,100,000
ROADS OK          90 assertions, including 582 of 582 statutes carrying four
                  distinct rungs, none repeated within a statute or between two
RUNGS OK          2,328 descriptions, mean 240
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

Next: **Marker/seam consolidation**, the item deferred out of S2 and S6 and the
largest remaining stabilisation work. 25 literal splice markers; dead-body
ratchet 5 to 0.

Previously: **S12 — The Statute Book Speaks** (PR #39, merged), sixth of six. **The slice is
complete.** Empire, Imperium, the People's State and The Charter close the book:
126 statutes, 504 rung descriptions and 126 refreshed one-line descriptions.

**Every statute in the game now speaks: 582 of 582, 2,328 rung descriptions and
582 refreshed one-liners. 2,910 pieces of authored prose**, which is the number
the owner's order specified. The file stood at **2,951,257 bytes** at the slice
close, against a projection of 2,948,134 made three batches ago. (The cap was
3,100,000 then; the owner raised it to 10,000,000 in S13.)

Previously: **S12 — The Statute Book Speaks** (PR #38), fifth of six. Five books authored:
**Defence, Authority, Elections, Federalism and Foreign**, 120 statutes, 480 rung
descriptions and 120 refreshed one-line descriptions.

**456 of 582 statutes now speak**, 1,824 descriptions at a mean of 239
characters. These 120 cost **1,046 bytes each**, holding the projection at
**2,948,000 of the 3,100,000 allowed**, 152 KB spare.

### The pipeline is now doing what it was rebuilt to do

| | placements | exact | tau | mis-ordered by both readers |
|---|---|---|---|---|
| drafts as authored | 86.3 / 86.3% | 72.5 / 72.5% | 0.908 / 0.908 | 8 of 40 |
| **after repair** | **92.5 / 92.5%** | **85.0 / 85.0%** | **0.950 / 0.950** | 5 of 40 |
| shipped baseline | 78.1% | 57.5% | 0.833 | |

Second batch running whose **raw authoring output cleared the baseline**, and the
post-repair figures match PR 4's to the decimal. The two blind readers returned
**identical scores on every one of the four measurements**, before and after,
which is the strongest evidence yet that the instrument is reading the prose
rather than the reader.

**Attribution: 60/60, 100%.** Every rung description identified its own statute
out of eight candidates from the same book.

**Defence and Authority produced no ladder that failed both readers.** No book had
managed that before. The repair cost **9 statutes, 25 rung fields and 2
descriptions**, and one of the nine was found by the repair agent's own sweep
rather than by the readers.

### The verify pass caught the ordering fault before the readers did

56 findings across the five books, every one repaired: **19 unorderable**, 13
substitutable, 9 generic, 9 contradicting the brief's own numbers, 4 invented, 2
lexically escalating. Unorderable nearly doubled from PR 4's ten, and that is the
check working rather than failing: these five books are about degrees of state
power, which escalates more smoothly than a building programme, so more adjacent
rung pairs sit close in severity. Those nineteen were fixed **inside the
pipeline, before any blind reader saw the prose.** In PR 3 the same check found
six where the readers found twenty-four.

### Two things only the corpus rules could see

**"Territories and protectorates" had reached nine statutes across four books and
three separate batches** — Energy and Technology, merged two batches ago, plus
Authority and Elections here. Four authoring agents, none able to see the others,
independently chose the same words for the overseas possessions. It is now seven
different formulations. No per-book verifier could ever have found this.

**A boundary commission drew "the federal districts",** which collides with
`Federal District`, a region name. Region names go stale the moment a campaign
renames its regions, which is why the rule exists.

```
ALL CHECKS PASS   11/11, 2,815,901 bytes of 3,100,000
ROADS OK          90 assertions
RUNGS OK          1,824 descriptions, mean 239
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

Five ladders still resist both readers and are named rather than swept:
`conscientiousObjection`, `curfewAuthority`, `loyaltyOaths`,
`multilateralAccession`, `overseasVoting`.

Previously: **S12 — The Statute Book Speaks** (PR #37), fourth of six. Four books authored:
**Energy, Environment, Infrastructure and Technology**, 96 statutes, 384 rung
descriptions and 96 refreshed one-line descriptions.

**336 of 582 statutes now speak**, 1,344 descriptions at a mean of 240
characters. These 96 cost **1,048 bytes each**, projecting the finished book at
**2,948,000 of the 3,100,000 allowed**, with 152 KB to spare.

### The rule bought what it was supposed to buy

This is the first batch authored under **"One axis is the ladder"**, and the
first whose ordering was measured **before** anything reached `vale.html` rather
than after it merged. Both changes came out of PR 3's failure, and this batch is
the test of them.

| | placements | exact | tau | mis-ordered by both readers |
|---|---|---|---|---|
| PR 3, drafts as authored | 68.1 / 62.5% | 37.5 / 30.0% | 0.767 / 0.733 | **24 of 40** |
| **PR 4, drafts as authored** | **86.9 / 90.0%** | **75.0 / 80.0%** | **0.908 / 0.933** | **7 of 40** |
| PR 4, after repair | 92.5 / 92.5% | 85.0 / 85.0% | 0.950 / 0.950 | 5 of 40 |
| shipped baseline | 78.1% | 57.5% | 0.833 | |

**The raw authoring output cleared the shipped baseline**, which PR 3's never
did. The repair cost **17 rung fields across 7 statutes**; PR 3 needed **123
across 64** for the same job. Writing the rule down was worth about seven times
its own repair bill, and the two blind readers agreed to the decimal after it.

Five ladders are still mis-ordered by both readers and are named rather than
swept: `biodiversityOffsets`, `dataSafeHarbour`, `pipelinePreemption`,
`portsAndLocks`, `ruralCooperatives`. The last two were repaired and still fail,
which is worth saying plainly: one repair round is not a guarantee.

**Attribution, measured on the drafts: 59/60, 98.3%** against a 12.5% chance
floor, the best of the four batches. The single miss read Preempt Local Zoning as
Permitting Reform.

### The checker was wrong about the game's own nouns

The 4-gram overuse rule exists to kill connective spam spreading through the
corpus unnoticed. It fired five times here. Three were genuine: **"at the end of"
in ten statutes, "for the first time" in eight, "as well as the" in seven.** Two
were **bloc names**: "Students and Young Workers" in fifteen statutes and "Small
Business and Farmers" in thirteen.

The style brief tells the author to name a bloc by the noun the registry gives,
so on those two the rule was **ordering the prose to disobey the brief**, and the
only ways to satisfy it were to rename the constituency or to stop naming it. A
rule that fires on its own required vocabulary is measuring the vocabulary rather
than the writing. It now skips any gram sitting inside a bloc or indicator name,
read from the booted game so it cannot go stale. This is the second rule in this
slice demoted or narrowed on measured precision rather than argued about.

**One of the three genuine hits was self-inflicted.** "as well as the" entered
the corpus as a PR 3 repair, written to remove a negative parallelism, and had
since reached seven statutes. A fix applied by hand across a corpus is itself a
phrase that can spread.

### The verify pass

44 findings across the four books, every one repaired: 14 substitutable, **10
unorderable**, 8 generic, 8 contradicting the brief's own numbers, 2 invented, 2
lexically escalating. The unorderable count is up from six in PR 3 because the
prompt was sharpened after that check under-fired, and this time it was pointing
at the same fault the blind readers found rather than a different one.

```
ALL CHECKS PASS   11/11, 2,690,326 bytes of 3,100,000
ROADS OK          90 assertions
RUNGS OK          1,344 descriptions, mean 240
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

Previously: **S12 — The Statute Book Speaks** (PR #36), third of six. Four books authored:
**Culture, Immigration, Justice and Security**, 96 statutes, 384 rung
descriptions and 96 refreshed one-line descriptions.

**240 of 582 statutes now speak**, 960 descriptions at a mean of 241 characters.
These 96 cost **1,047 bytes each**, which projects the finished book at about
**2,948,000 of the 3,100,000 allowed**.

### The batch failed its own measurement, and the failure was the point

Rung-order recovery came in at **37.5% and 30.0%** of ladders recovered exactly,
against **57.5%** for the books that shipped in PR 1. Two independent blind
readers, and the second was the worse of the two. They agreed on **twenty-four
ladders that both failed to order**; only eleven of forty were clean in both.
That agreement is what ruled out the instrument.

Two other explanations were tested and killed before the prose was blamed:

| explanation | test | result |
|---|---|---|
| the verify repair pass broke the ordering | exact recovery, repaired vs untouched ladders | **40% vs 36%**, the same number |
| these books are mechanically flatter | share of rungs introducing a new indicator key | **94% vs 97%**, 1.15 new keys a rung in both |

The ladders are equally eventful. The prose was not narrating the escalation.

**Reading the failures found one fault, twice.** Alcohol Licensing rung one
shortened the trading evening while rung two set a floor price that "anybody who
buys above the floor notices nothing", so **rung one read as the harsher
measure**. Civil Forfeiture rung two widened what may be seized while rung three
changed who profits from it, so **the pair sat on two different axes**. Both are
the tests added to the authoring brief after the sugar levies, and these four
books were written before that rule existed. PR 3 is the last batch authored
without it.

### The repair, and the same measurement again

**123 rung fields across 64 of the 96 statutes, no `desc` touched**, and every
one of those counts is a **diff against a snapshot** taken before the repair
rather than a report from the agent that made it. Forty of the rewrites are
statutes the readers ordered correctly, found by applying the two tests to the
rest of each book.

Re-measured on the **same forty statutes with the same shuffles**, so the
comparison is the prose and not a fresh sample:

| | placements | ladders exact | Kendall tau | max displacement 0/1/2/3 |
|---|---|---|---|---|
| before, run 1 | 68.1% | 37.5% | 0.767 | 15/23/2/0 |
| before, run 2 | 62.5% | 30.0% | 0.733 | 12/24/4/0 |
| **after, run 1** | **85.0%** | **72.5%** | **0.892** | 29/9/2/0 |
| **after, run 2** | **87.5%** | **75.0%** | **0.917** | 30/10/0/0 |
| shipped baseline | 78.1% | 57.5% | 0.833 | 23/15/2/0 |

Mis-ordered by both readers: **24 down to 9**. Clean in both: **11 up to 28**.
The nine that remain are recorded rather than swept: `counterterrorism`,
`fusionCentres`, `guestWorkers`, `juryReformAct`, `multilingualServices`,
`prisonLabour`, `privateContractors`, `speechAbsolutism`, `truthAndAmnesty`.

**Attribution, the other blind measurement: 58/60, 96.7%** against a 12.5%
chance floor. Both misses are near neighbours (Expanded Immigration read as
Family Reunification, the Habitual Offender Act as Mandatory Minimum Sentences).

### What the verify pass caught, and what it could not

34 findings across the four books, every one repaired: 11 substitutable, 6
unorderable, 6 generic, 5 contradicting the brief's own numbers, 4 invented.
**Zero lexical escalation**, the failure the brief warns about hardest. Three
findings could only come from reading the whole registry: a prison programme
priced against other statutes' cost fields, a national buyback written into a
statute carrying no cost at any rung, and a word for the legislature the game's
own interface does not use.

The corpus rules then caught seven more no per-book reader could see: four
negative parallelisms, one banned word, and two phrases that had spread to seven
statutes each. Two of those fixes are in books that shipped earlier, to leave the
next batches headroom under the same threshold. After the ladder repair the same
rules caught the repair's own collision, between the rewritten multilingual
services rung and a labour exchanges rung shipped two batches ago.

**The durable lesson is about the tooling.** The verifier flagged **6**
unorderable ladders where blind readers mis-ordered **24**. A check that reads
one book with the answer key in hand cannot measure legibility that only a reader
without it can see. **For PRs 4 to 6 the ordering measurement runs on the drafts
before apply**, and its misses feed the repair pass directly.

```
ALL CHECKS PASS   11/11, 2,589,673 bytes of 3,100,000
ROADS OK          90 assertions
RUNGS OK          960 descriptions, mean 241
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

The fail-proof: a banned word, a participle tail, a negative parallelism and a
one-sentence rung seeded into `juryReformAct` rung one on a scratch copy.
`--check` reports all five and exits 1. The first attempt at that splice landed
inside an escaped apostrophe and stopped the game booting, which is the hazard
`--apply` exists to prevent, met by hand within a minute of trying to do the job
by hand.

Also decided rather than left for PR 6: **The Charter is the only book of the
twenty-three with no `V9_TIERS` row**, so its twenty statutes fall through to the
generic names. `v9TierName` is called from four sites, all escaped into display
HTML, and nothing compares a tier name as a string, so a row is display-only. It
gets `Granted / Chartered / Extended / Sovereign`, the book's own arc of a
company acquiring state functions.

Previously: **S12 — The Statute Book Speaks** (PR #35), second of six. Four books authored:
**Labour, Capital, Health and Education**, 96 statutes, 384 rung descriptions and
96 refreshed one-line descriptions. **480 pieces of prose, no engine change.**

**144 of 582 statutes now speak.** The file holds 576 rung descriptions at a mean
of 244 characters. The four batches came in at 227 / 238 / 247 / 232, against a
target of 230 set after PR 1 overshot at 257.

**The cost per statute fell with the mean.** PR 1 measured 1,115 bytes a statute;
these 96 cost **99,054 bytes, 1,032 each**. At that rate the remaining 438 land
the file at about **2,941,000 of the 3,100,000 allowed**, so the ratchet still
bites and no later batch is stranded.

### The verifier is doing the work the regexes cannot

Every batch is read by a fresh agent whose only question is the substitutability
test stated as work: *name another statute in this book the sentence would also
fit.* It found **22 failures across the four** (Labour 6, Capital 3, Health 9,
Education 4) and every one was repaired before the shard was applied. Health was
the worst book, which is the expected shape: twenty-four statutes about clinics,
waiting lists and drug bills converge on the same paragraph unless something
stops them.

**One genuine cross-batch collision, caught mechanically.** `meansTesting`
(shipped in PR 1) and `malpracticeCaps` (this batch) both closed a rung with
"The saving is real, and so is the ___". Nothing a per-batch reader could see;
the corpus-wide shingle rule found it. `malpracticeCaps` rung three was rewritten.

### The specificity rule was demoted, on its own measured precision

`--check`'s specificity floor asks that every description share a content word
with its statute's name, group, description, department, or something that rung
moves. Over the first **768** descriptions it fired **11** times. **Two were
genuine.** The other nine were good writing that happens not to echo a registry
label: "It was managed for the owners, as required" is unmistakably Shareholder
Primacy, and "Anyone may call themselves anything" is unmistakably the licensing
repeal. Token overlap is a weak proxy for *is this about its subject*, and a hard
fail at **18% precision** teaches its reader to override it, which is worse than
not having the rule. It is now a **note**, printed and not fatal, and the
reasoning is in the code beside it. The real guard is the verify pass, which
found 33 genuine failures over the same two batches.

### Two measurements on the prose itself

Both taken blind by fresh agents forbidden to read the repository. The control
column is the same instrument over forty of the ladders already shipped in PR 1,
run because the first number came in under the plan's floor and the floor had
never been tested against anything.

| measurement | this batch | control: PR 1's books | chance |
|---|---|---|---|
| **attribution** — one rung description, eight statute names from its own book | **60/60, 100%** | not re-run | 12.5% |
| **rung order**, placements | **139/160, 86.9%** | 125/160, **78.1%** | 25% |
| **rung order**, ladders recovered exactly | **30/40, 75.0%** | 23/40, 57.5% | 4.2% |
| **rung order**, Kendall tau | **0.875** | 0.833 | 0 |

**The plan's 90% floor was a guess made before any prose existed, and the prose
it was written for scores 78.1% on it.** This batch is 8.8 points above the
standard that shipped. The failure shape is the same in both corpora and it is
narrow: of the ten misses here, seven are a single adjacent swap and three move
one rung by two places; of the control's seventeen, fifteen are a single adjacent
swap. **Neither corpus produced a ladder read backwards, and neither displaced a
rung by three.** The per-placement metric charges one neighbour transposition two
of four placements, which is why ten near-ties cost thirteen points.

Reading the ten, most are real ties in severity rather than flat prose.
`codetermination` goes seats, then threshold, then committee chairs, then a third
of the board with a vote on pay; a reader who ranks chairing the audit committee
above holding a third of the seats produces exactly the order the agent gave.

So the criterion is re-set on the two things a broken ladder would actually show
— **no ladder read backwards, no rung displaced by more than two places** — with
Kendall tau and exact recovery carried against the shipped baseline instead of a
floor nobody measured. The floor is not being moved to fit the number: the number
clears the shipped standard on every metric either way, and 90% is recorded as
what it was.

**The one real defect was fixed, not explained.** `sugarTax` escalated on two
axes at once, duty breadth at rungs one and four and licensing control at rungs
two and three, so a reader saw duty, licence, licence, duty and could not order
the middle. It is rewritten so the duty rises on every rung and the licensing
regime is visibly carried into the last one.

```
ALL CHECKS PASS   11/11, 2,489,097 bytes of 3,100,000
ROADS OK          90 assertions
RUNGS OK          576 descriptions, mean 244 chars, 9 notes
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TIERS             no width scrolls sideways
```

The fail-proof: an em dash, a digit and a one-sentence rung seeded into
`minimumWage` rung one on a scratch copy. `--check` prints all three and exits 1.

Previously: **S12 — The Statute Book Speaks** (PR #34), first of six. Two asks land whole
here; the third gets its engine, its tooling and its first two categories.

**A floor under very easy.** `DIFFS.easy` carries `capFloor:75`, applied in a new
**outermost** wrapper on `capitalIncome`. It has to be outermost: the function is
wrapped four times after its base and a floor applied lower is undercut by every
wrapper above it. Measured on a deliberately terrible session (approval 5, unrest
100, unity 10, debt 9000): very easy pays **75**, the other four pay
6.17 / 1.41 / 0.71 / 0.05.

**Every core book reads twenty-four, and the registry was never short.** The
count reported from the Policy page (Authority 19, seven books at 23) was real,
but nothing was missing: eleven core statutes are gated, four to the Emergency
form, one to a prerequisite statute and six to a world condition, and
`viewPolicy` simply omitted them. They now render **locked**: dimmed, no draft
button, and the condition stated in the sentence `policyWhy` already knew how to
give. Twelve on a fresh game, every one with a reason.

**The view widened, not the model.** `policyOpen` governs what may be *enacted*
and what `purgeStatutes` strikes out of a save; it is untouched, and roads
asserts that. A new predicate `v12Listed` governs only what the page shows,
scoped to the twenty core categories, because Imperium, People's State and The
Charter are whole alternate books.

**The ladder learns to speak.** Every statute may carry `rungs`, four strings,
one per rung, under the mechanics line in the dossier. **48 of 582 carry prose
so far** (Taxation and Welfare), each with a refreshed one-line `desc`.

Three decisions reversed my first instinct, and the reasoning is in the code:
the prose is **inline on the statute** rather than in a lookup table (a table
goes stale on a rename, and six batches appending to one literal conflict on
every rebase); the renderer is a **forward hook**, not a reassignment of
`v9Dossier`; and the CSS is a `<div>` with a **two-class selector**, because
`.sheet p` is specificity (0,0,1,1) and would have beaten a single-class rule
*whatever the source order*, rendering the prose larger than the mechanics line
above it.

**Not in two hot paths, deliberately.** `v7Index` is rebuilt on every keystroke
of the command palette and `policyCard`'s `data-search` is written into all 582
cards on every render. The one-line `desc` is in both already; half a megabyte
of rung prose is not joining it.

**The checker earned its keep three times, and was wrong twice.** It caught the
pilot text naming neither its subject nor anything its rung moves. Then it
produced 90 hits on the first authored batch, and reading them showed **my rules
were wrong, not the prose**: the participle-tail regex banned any `-ing` after a
comma and was catching "Board, lodging and supervision" and "verges, drains,
painting", nouns in lists; and the specificity floor demanded literal echo of
registry labels, failing prose that says "pension", "contribution record" and
"the oldest" for a statute the registry calls Social Security with a bloc called
Retirees. Demanding the label back would have pushed every welfare line into
reciting it. The participle rule now names the closed set of interpretive verbs;
the specificity anchor includes the statute's own `desc` and matches on stems.
Result: **90 hits to 2**, both genuine, both fixed in the prose.

**maxBytes moved twice, the second time on a measurement.** 2,450,000 to
3,000,000 before authoring, then to **3,100,000** once the first 48 statutes
measured **1,115 bytes each**, projecting 2,985,518 at 582. That left 14 KB of
margin for 534 unwritten statutes, which is the ceiling being discovered late.
The authored mean came in at 257 chars against a 250 target; later batches aim
at 230.

```
ALL CHECKS PASS   11/11, 2,389,903 bytes of 3,100,000
ROADS OK          90 assertions
RUNGS OK          192 descriptions, mean 257 chars
PLAYTEST PASS     44 steps + the WebKit SKIP
DETERMINISM PASS / TABS OK / TIERS: no width scrolls sideways
```

Six fail-proofs. The second reproduces the reported page exactly: reverting
`v12Listed` to `policyOpen` prints Taxation:23, Security:23, Culture:23,
Environment:23, Foreign:23, Authority:20, Empire:23.

Previously: **S11e — The Ministry and the Interests** (PR #33). **The last of five slices
carrying the owner's sixth order.** The complaint on both tabs was the same:
"lots of repetitive low impact options". Four surveys measured the arithmetic
behind it in the running game, and every figure below is a measurement.

### What was actually wrong

| action | before | why it was dead |
|---|---|---|
| **Brief** | +5, clamped to **100** | the tick clamps to **96** — briefing above 91 was **silently refunded**: measured, 3 of the 5 points bought |
| **College** | `max(2, 8 − experience)`, then **+3 experience** | +5 once, +2 for ever, for 2 capital **and 4 of treasury** against Brief's 2 and no money — dominated from the sixth session, and worse each time used |
| **Sideline** | cut the department's **rank** | the only paid action in the game that made the government worse at *everything* |
| **Initiative** | shoved the indicator **stock** | the tick converges stocks at **26%** a session: **84% gone after six** |
| the seven **traits** | — | six read **nowhere**; only `operator` appeared outside a card |
| **influence** | written **once** | the same **540** in every campaign of every save |
| relation ↔ bloc | **a circle** | each read the other; neither was independently meaningful |
| **endorsement** | ~0.6% of the vote | and **cleared for every group at every election** |

### The fix is a department, not more buttons

`st.v11.depts[key] = {funding, strain, delivered, cases}`, created-on-write,
sitting between the minister and the country so that briefing, funding and
delivery have somewhere to accumulate. Capacity from competence, rank, the
settlement and the strain; a `delivered` stock that decays at **3.5%** a session
against an indicator's 26%; a settlement that is a real line in `budget()`; and
an overstretched department that produces **its own** standards case — a
consequence of how you funded it, not of who you appointed. All of it reaches
the country through `cabinetBonus`.

Measured after: Brief refunds **0** (was 3). The College is **+3 flat** (was
5/2/2) and buys the one thing a briefing cannot — the **ceiling**, 96 → 102, so
a schooled minister is no longer dragged back. Sideline makes **no indicator
worse** and sends the papers to the centre. An Initiative retains **81% after
six sessions** (the indicator it used to shove would have kept 16%). All **7 of
7** traits carry behaviour across 7 fields.

### The interests

Influence moves (**540 → 604** over twenty-five sessions). The circle is broken
one direction at a time: the relation reads the government's own conduct —
meetings **+13.5**, refusals **−18** — and the bloc goes on reading the
relation. An endorsement mobilises its bloc, takes a real point off any statute
that bloc wants, and **survives one ballot** before lapsing at the second.
`V9_REGION_BLOCS` finally does something: holding every organisation close is
worth **+15 Assembly seats**, shutting them all out costs 5, and S11c's own
eight-governor measurement is **unchanged at +44**.

### Two things measurement caught that reading would not have

**A balance shock arriving through a default.** A first pass priced the standard
settlement at 4, so simply *filling* the cabinet — which the game encourages
everywhere else — added **64** to expenditure on a base of 149 and took the
session balance from **−26 to −92**. Standard is "the settlement the last review
left it": it is already inside `budget()`'s base. Costs are now relative to it —
standard free, lean **−3**, generous **+5** — so the default changes nothing and
only a deliberate choice moves the budget.

**A silent nerf arriving through a constant.** The department's contribution to
`cabinetBonus` subtracts a reference performance. A first pass guessed `.55` —
but a fresh cabinet's median performance is `.25`–`.31`, so *every typical
department* was penalised by about `−.13 ×` its effects. A second fresh cabinet
read a different median, so any sampled constant is fragile. `V11_DEPT_REF` is
now **derived** from a defined department (competence 65, rank 1, standard
settlement, nothing else): `(65 − 40) × 1.05 × .01 = .2625`.

**A discount that rounded away.** The endorsement's statute discount was 7% and
returned `Math.round(c * f)`; policy costs are small integers, so on a statute
costing 7 it rounded straight back to 7 and bought nothing across most of the
book — the same low-impact defect this slice exists to remove. It is now 12%
**and floored at a whole point**.

```
ALL CHECKS PASS   11/11, 2,328,867 bytes of 2,450,000
ROADS OK          87 assertions, stable across 5 consecutive runs
PLAYTEST PASS     42 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TABS OK / CHAMBER OK / TIERS: no width scrolls sideways
PACING            short and standard byte-identical; epic moves
```

**What moved in epic, and what did not.** Short and standard are byte-identical
to the standing baseline. Epic changes: crises 17 → 15, wars 41 → 42,
achievements 11 → 12 (it now earns `debtFree`), best governing run 89 → 149.

The cause is **entirely the interests half**, and that is checked rather than
assumed: `tools/pacing.js` contains **zero** references to the cabinet, and a
harness-style run seats **0 ministers, 0 cabinet ranks, 0 department records**.
So the department layer — capacity, funding, strain, delivery, `V11_DEPT_REF`
and `v11DeptTick`'s single `rand()` — is **inert** in these numbers. (Proof: the
pacing diff is byte-identical before and after the `V11_DEPT_REF` correction.)
What moves is that the organisations were inert and now are not: influence
moves, the relation target reads conduct, and `blocTarget` carries the
endorsement term — and over two hundred sessions that compounds through the
blocs.

**A flake I wrote myself.** "A briefing is never refunded" asserted the refund
was *exactly* zero — but `pv5MinisterTick` adds `(rand() − .5) × .5`, so a
minister sitting at the ceiling can drift down `.13` in an ordinary session. It
failed about one run in three on identical code. It now asserts the **exact**
invariant — that a briefing never leaves a minister above the ceiling the tick
clamps to — and bounds the follow-on drift by the tick's own noise band.

Ten fail-proofs. **The sixth order is complete**: the Record deck (S11a), very
easy capital (S11a), the order book (S11b), the Federation (S11c), the
Constitution (S11d) and the Ministry and Interests (S11e).

Previously: **S11d — The Constitution** (PR #32). Fourth of five slices carrying the owner's
sixth order. The ask was "far more options", and the ruling on what "setting the
nation's overall constitution" means was **articles you assemble** — a written
document built and amended over a campaign, each article changing real
machinery, not a menu of pre-written constitutions.

**What was here.** Ten FORMS rendered as informational cards with no button, the
transitions open from the current form, a dissolve button and the path panels:
seventeen controls on a fresh game, thirteen of them identical every session for
two hundred sessions.

**Forty-eight articles in eight books** — Of the Chambers, Of the Franchise, Of
Terms and Offices, Of Emergency Powers, Of the Courts, Of the Federation, Of
Rights, Of Procedure. Every one names the machinery it moves in its own `moves`
line, and `roads.js` asserts that line against its `mods` over the whole
registry, because a card whose prose promises what the effects struct does not
carry is the exact defect this slice exists to fix.

**Ratification is a vote, not a purchase.** An article is **laid**, **contested
for two sessions** while the parties take positions and the country hears about
it, and then **put** — by the Assembly, by supermajority where entrenched, by
the country where the article says so. Capital spent during the contest moves
the vote, which is what makes two sessions a decision rather than a wait. Only
one article may be before the country at a time. **It can fail**, and a defeat
costs capital, five of unity and two of unrest, and bars the question for six
sessions.

**Entrenchment is what makes it a constitution rather than a settings page.**
Plain **50%**; entrenched **60%** to carry and **66.7%** to strike out again. Of
Procedure moves every later bar; a convention lowers every bar by eight for six
sessions, costs 24 capital, and **two is all any republic gets** — otherwise it
is a discount a patient player always takes.

**One place computes, eleven readers consult it.** `v11ConEffects` follows the
`v10OrderMods` pattern, and every field has a named reader: `term` →
`isBallotTurn`, `capital` → `capitalIncome`, `ratify` → `v11ConThreshold`,
`franchise` → `franchiseLevel`, `autonomy` → `v11AutonomyPressure`, `emergency`
→ `securityState`, `libFloor`/`ind` → `indicatorTargets`, `unrest` →
`unrestTarget`, `polCost` → `policyCost`, `rev`/`exp` → `budget`, `senate` →
`v11ArtSupport`. A change that is a permanent **fact** rather than a standing
modifier — seating justices, ending a veto — is done in the article's own
`apply()`: there is no such thing as half a justice.

**The bug this slice nearly shipped.** `franchiseLevel` returned 0, 1 or 2 and
three consumers **index a three-element array with it** — including
`supportTargets`, the ballot weight itself. My first wrapper clamped to 0..3 and
allowed halves, so two franchise articles produced `2.5`, `b.fr[2.5]` is
`undefined`, and `b.pop * undefined` is **NaN in the vote model with nothing on
screen to say so**. Caught by an exhaustive probe before it left the branch. The
wrapper now rounds and clamps to the readers' own domain, and roads sweeps all
**128 subsets** of the seven franchise articles asserting both.

**`actBlocked` was broken.** Its first line was `if (a.house !== 'Senate') return
false` — but `house` is the **book an act is filed under on the page**, not the
chamber that votes it, so a Senate with a full veto watched every act it was not
itself the subject of go straight past. Measured after the fix: **6 of 25**
non-Senate acts are now refused by a hostile Senate that previously refused none.

**Also brought home:** twenty of the thirty-two constitutional acts rendered on
other tabs and nowhere here; `S.precedents`, which gates two transitions *on this
page*, was earned on the Executive page and shown to nobody. Both are on the tab.

**A correction carried over from S11c.** The `regionPartyFactor#1` adjudication
in `checks/dead-bodies.json` still carried the overstated clamp claim I
corrected everywhere else last slice — and the wrong span numbers with it
(`[.72,1.34]`, where the code says `[.80,1.22]`). Fixed here.

```
ALL CHECKS PASS   11/11, 2,297,357 bytes of 2,450,000
ROADS OK          76 assertions
PLAYTEST PASS     41 steps + the WebKit SKIP
DETERMINISM PASS  8 properties — S11d spends NO dice
PACING            byte-identical to the S11c baseline
TABS OK / CHAMBER OK / TIERS: no width scrolls sideways
```

**Pacing is identical because an unwritten constitution is a perfect no-op** —
the harness plays first-choice-always and never opens the tab, `st.v11.con` is
created-on-write, and an old save loads with no `v11` at all, an empty effects
struct and the same ballot calendar at every turn of a full epic.

Render cost on the tab: **8.9 ms median** with all 48 article cards, 25.1 ms in
the extreme case of every article in force, against 44 ms for the Policy tab —
so no build-on-open treatment was needed here.

Six fail-proofs. Next: **S11e**, the Ministry and the Interests.

Previously: **S11c — The Federation** (PR #31). Third of five slices carrying the owner's
sixth order. The complaint was that the tab is "extremely bare/repetitive with
not much impact from the things you do there" — and the survey found the
arithmetic behind it. A region's `prosperity`, `services` and `order` reached
**one governor's approval score and nothing else**. The only channel from a
region to the national vote was `regionPartyFactor`, a pop-weighted mean of
eight frozen `lean` literals; federal trust at 90 across all eight regions was
worth **+4.7% to the ruling party alone**, and nothing a player did moved it.

**The regional term.** `regionPartyFactor` is reassigned (alias
`v11RegionFactorBase`, adjudicated as `regionPartyFactor#1`) to multiply each
region's fit by what the player actually built there: the governor's party,
standing and approval; the organiser dots in `st.campaign.targets`; the
region's own indicators, read with the sign the government owns and the
opposition does not; federal trust; autonomy as a suppressor. `regionLeadingParty`
routes through the same function, so the post-count map, the governor model and
the ballot finally agree — **a region flips on screen because you governed it.**

**Tuned by measurement, to the owner's ruling of ~40 seats.** Everything runs
through one gain, `V11_REGION_GAIN`, because the factor is applied **twice on
one ballot** (:6786 and :6862) and the allocator amplifies again. At gain 1 a
clean eight-governor sweep measured **+130 Assembly seats**. Tuned 0.30 → 47,
0.26 → 45, **0.23 → 42**. Abandoning every region costs 13. Per-region seat
allocation was **rejected** — `ballot` yields one national vote-share map and a
naive largest-remainder across eight regions hands ~24 seats to whoever leads
each region purely from rounding, *and would look exactly like the feature
working*. Because the term leaves `allocateSeats`, `ballot`, `runElection`,
`projection`, `hemiMap` and `CFG` untouched, the seat totals hold **by
construction**; roads re-measures 1305/1305 and 300/300 anyway.

**A correction to my own record.** An earlier commit message on this branch
said the old `[.86, 1.15]` clamp "BOUND at this size". A proof-of-failure run
says that is **half true and I stated it too strongly**: at the shipped gain the
factor runs **.847 .. 1.028**, so the old *floor* does clip the two flank
parties, but the old ceiling is never approached, and restoring `[.86, 1.15]`
does **not** turn the flank-party assertion red. What was stopping the flank
parties being moved in the regions was the absence of the terms, not the clamp.
The comments at both sites now say exactly that.

**Three more directions, per the owner's ruling of all four.** The regional
economy (`pop`, `wealth`, `trade`, `output`) is materialised **created-on-write
onto `st.regions[id]`, which is saved** — the `REGIONS` literal it seeds from is
not serialised, not rewound by undo, leaks into a new campaign in the same page
load, and is corrupted by every `v6Sandbox` forecast. Autonomy became a
**five-rung ladder** where it was a boolean set by one arc branch, reading a
legacy `true` as rung 1 so an old save climbs from where it stood. `unrestTarget`
now reads regional `order`, which the field guide (:16283) has claimed since v6.
`meet` and `works` bought a governor to 100 in three clicks and now sit behind
two-session cooldowns.

**A pre-existing flake, found and fixed.** `one year a session, once` was failing
about one run in eight — **on main as much as here**. `ageFigures` rolls a
death-or-retirement risk per figure and `ageSucceed` seats a fresh governor whose
age is an independent `46 + rand()*20`, so a succession during the sample yields
deltas of -7, -5, 0, +10. It surfaces at all because **this harness reaches the
probe at a different point in the seeded stream on every run** — the UI pump is
click-timed, the hazard CLAUDE.md names — so the eight governors are freshly
rolled each time. Successors are now excluded **by object identity**; survivors
are still held to exactly 1, with a floor so it cannot pass vacuously. Proved
red by incrementing `f.age` twice.

*(My first attempt to establish whether this pre-dated S11c was wrong: I ran
main's harness without `tools/fullbuild-baseline.json`, so twelve "clean" runs
had died at startup and tested nothing. Instrumented properly, main fails the
same way.)*

```
ALL CHECKS PASS   11/11, 2,244,766 bytes of 2,450,000
ROADS OK          70 assertions, stable across 14 consecutive runs
PACING            all three lengths reach the end year; density flat at 0.8–0.9
```

**Pacing moved, and the reason is the dice, not the balance.** `v11AutonomyTick`
and the `reTrade` lever draw from the seeded stream, so a campaign replayed from
the same seed **diverges** — different treaties and records at seed 5EED1234 is a
different campaign, not a worse one. Every length still reaches its end year and
events/session is unchanged.

Six fail-proofs. Next: **S11d**, the Constitution.

Previously: **S11b — The Order Book** (PR #30). Thirty-six more executive orders, none of
them gated, per the owner's ruling — the original thirty-six keep their statute
prerequisites, so the book is seventy-two with two classes in it and the page
says which is which rather than mixing them silently.

**Registration order is load-bearing.** The new orders are registered *after*
the existing thirty-six because `roads.js` (:434, :448, :458) and
`playtest.js` (:552) all probe
`V10_ORDERS.filter(x => !x.target && !x.needs && x.ind)[0]` — which is
positional. An ungated order registered first silently becomes the probe, and
four assertions quietly start measuring something else.

**A filter strip, because seventy-two is a wall.** `v10OrderPanel` rendered
every order unconditionally into eight buckets on every render of the Executive
page. It now carries the chip pattern the policy categories use — All /
Available / Standing / No statute needed / Needs a statute — and the last two
chips discharge the owner's legibility requirement with the same control.

**Four modifiers that were written and read by nobody.** `m.courtHeat` was
summed on every recompute and consulted nowhere; it now moves the court's own
hold roll, so a government running a large book is one the court is already
looking at. `upheld` was written by the court, printed as a tag and read by
nothing — an order the court had *blessed* was re-picked for review on exactly
the same terms as one it had never seen. `narrowed` cost five capital and six of
treasury, printed a tag, and left the order delivering **one hundred per cent**
of everything; a narrowed order is now a smaller order, 72% per narrowing across
every field except the upkeep, because a smaller instrument still has to be
administered. And three orders carried a `reqText` promising a gate the file did
not have — the agencies could be dispersed out of the District *into* the
District, and `openSchedule` could stand beside `boughtInVale`, its stated
opposite, with both Infrastructure multipliers applying at once.

**Two assertions that were not testing what they said.** "An order cannot
outrun the book" initialised `blocked = true` and only ran its body if some
order carried `needs`, so the day everything is ungated it would have passed
while testing nothing. And "a session picks its question without spending a
die" swept sixty sessions and required all fourteen subjects to be drawn —
which is an ordinary miss at that sample size, so it failed intermittently on
identical code, **on main as well as here**. It now sweeps a full epic
campaign; stable across three consecutive runs.

```
ALL CHECKS PASS   11/11, 2,218,285 bytes of 2,450,000
ROADS OK          68 assertions
PLAYTEST PASS     40 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TABS OK / CHAMBER OK / TIERS: no width scrolls sideways
PACING            unchanged — records 10/11/12, density flat at 0.8
```

Six fail-proofs. Next: **S11c**, the Federation.

Previously: **S11a — The Long Record** (PR #29). First of five slices carrying the owner's
sixth order. Where the fifth order's complaint was thin material on working
machinery, this one's is **machinery that reaches nothing** — and the surveys
proved it with arithmetic. This slice is the exception: the Record page needed
material, and most of it turned out to be already recorded.

**Twenty charts, from three sources with three different start dates.**
`st.v6.history` has written eleven numbers a session since v6 and four of them
reached a chart; its cap of 220 exceeds an epic's 201 turns, so **the timeline
the owner asked for already existed and only the filter was missing**. Five of
its columns — growth, capital, treasury, debt, the balance — had been recorded
since v6 and displayed to nobody. `st.v5History` has written eight a session
since v5 and was **read by nothing at all**: inflation, unity, the government's
seat share and campaign power exist nowhere else in the save. Fifty new columns
join them in `st.v11.hist`. Each panel says which source it draws on and from
what year, because one blanket disclaimer would have been wrong twice.

**A collapsed panel emits a slot, not a chart.** `render()` rebuilds the active
tab with `innerHTML` on every action; measured on the branch, twenty charts
collapsed cost ~9–12 ms a render against ~20 ms with all of them open. The
owner ruled that the Long Record opens and the other nineteen do not.

**Three chart-engine defects that would have shipped.** `v7ChartsToEnd` used
`querySelector` — first match only — keyed by class name, so one chart would
have opened on the present and nineteen would have shipped the exact defect S6c
wrote that function to fix, all sharing one memory slot. `v7Folds`'s fold key
strips a trailing number and lowercases, so twenty panels could have collapsed
into one saved preference. And `v6Sandbox` deep-clones the whole of `S` on every
mouseenter over a forecastable button, which would have carried the deck's
history through every forecast.

**Rounding paid for the whole feature.** Every history row stored raw doubles —
the fixtures hold `"approval":59.803040788077986`. All three recorders now
round and the new columns are integers; `v6.history` at its cap went ≈50 KB to
≈24 KB, which matters twice because the autosave rewrites the blob 160 ms after
every render and `UI.undoStack` holds up to eight more copies.

Very easy opens on **175** and earns more: `capMult` 4.2→5.4, `capFlat` 18→26
and `capCap` 320→440 moved together, because capital is a stock clamped at
`capCap` by some twenty sites and raising income alone would have spent the
increase on nothing.

`maxBytes` 2,200,000 → 2,450,000, raised **before** the order is authored.

What the harnesses hold on this branch:

```
ALL CHECKS PASS   11/11, 2,188,984 bytes of 2,450,000
ROADS OK          66 assertions
PLAYTEST PASS     40 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TABS OK / CHAMBER OK / TIERS: no width scrolls sideways
```

Six fail-proofs, one mutation each: two panels sharing a fold key; a chart
reaching for a column nobody records; a fifth series on one chart; the range
that stops slicing; the forecast that carries the record again; the recorder
that stops rounding.

Next: **S11b**, thirty-six more executive orders, none of them gated.

Previously: **S10g — The Despatch Box** (PR #28). A stale workflow notification turned out
to be carrying work: the tail of the S10f authoring run rewrote eighteen shards
AFTER the first seventy questions had been merged and shipped, leaving
forty-five more on disk that no build had seen. Levelling the five subjects
those had left shallow — scandal, bill, work, issue and minister, which are the
ones that fire MOST often, because the state they need almost always exists —
added twenty-five more. Question Time is 164 questions, seven from the
government benches on every one of its fourteen subjects.

**Seventy new questions, fifty-one defects, all of them invisible to the
mechanical validator.** Seven adversarial readings across two rounds — reskin,
voice, fit, and for the second round sibling collision — returned nineteen
findings on the forty-five and thirty-two on the twenty-five, each with
ready-to-paste replacement text. Ten were whole questions written twice: two
agents shard the same subject and neither can see the other, so four pairs
chose the same id and two more collided under different ids. The rest were a
result line addressing the player as "you", `{number}` standing as the bare
subject of a sentence whose body never introduced a figure, a mobile telephone
in a corpus of minute books and warrants, and reply sets offering three ways of
saying the same thing. Every fix is recorded; the ones deliberately not applied
are named with their reason.

**The pool was not being reached, and that was already shipped.** `v10QtHash`
was `turn * 2654435761` folded over the subject's characters, which looks like
variety and is not: for a fixed subject the value moves by a constant stride
each session, so the whole result is `(stride mod n)`, and wherever that shares
a factor with `n` the campaign lands on a few residues for ever. Measured over
two hundred sessions with every subject in play, the promise subject reached
TWO of its twelve questions and one question came up eleven times. The hash now
avalanches through `Math.imul`, and the item is not chosen by hash at all: each
subject keeps a count of how many times it has been raised and walks its whole
shelf before repeating any of it, from a per-campaign offset. The count
advances inside the guard that already makes the body run once a session, so
re-rendering cannot move it — the same rule that keeps a die out of this path —
and it rides the save.

```
                        before        after
  50 sessions           36 distinct   48 of 50 drawn, soonest repeat at 39
  100 sessions          65            85, nothing seen more than twice
  200 sessions          102           115 (70% of the pool)
  soonest repeat        7 sessions    28
  median gap            19            80
  most-repeated in 200  11 times      3
  worst-served subject  2 of 12       every subject walks its whole shelf
```

**A third assertion of mine could not fail.** The stability test cleared
`q.v10` — the guard that PROVIDES the stability — and then asked whether a
forced re-selection re-selected. It now calls `v8EnsureQuestion` fifty times
with the guard untouched, holds a subject to prove it walks its whole shelf,
and strips `v10.qtSeen` from a save to prove a campaign written before the
rotation existed still loads and asks. Proved red by three separate mutations.

`maxBytes` 2,100,000 -> 2,200,000, with the case in `baseline.json`.

What the harnesses hold on this branch:

```
ALL CHECKS PASS   11/11, 2,161,802 bytes of 2,200,000
ROADS OK          64 assertions
PLAYTEST PASS     39 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TABS OK / CHAMBER OK / TIERS: no width scrolls sideways
PACING            re-run on the finished pool and unchanged
```

The measurement is published as a page, with the stride demo, the before/after
figures and the whole pool readable by subject:
https://claude.ai/code/artifact/746c46fe-70bb-41bf-aeb9-b8609a4c04cb

Previously: **S10d/e/f — The Works, the Ministry, the World and the Session** (PR #27).
The last three slices of the owner's fifth order, shipped as one PR because
they share a spine: each is a system with working machinery and almost no
material on top of it.

**The Works.** Sixteen distinct grand works became forty-eight, spread across
every region and the national tier. A work under way is no longer only
steady/crash/suspend/cancel: six instruments change what it *delivers* rather
than just how fast it arrives — a public inquiry, a foreign contractor, a
domestic labour clause, a scaled-back specification, building it properly, and
taking the state in as a partner. Each trades money, time, quality and
political cost against the others, and the card says how the thing is being
built. Scaling back and building properly are mutually exclusive, and a change
of specification never touches what has already been spent.

**The Ministry and the committees.** Ministers gained five interactions beyond
brief/initiative/empower/dismiss — shield, sacrifice, promote, sideline, train
— all of them reading fields that were already on the object and doing nothing.
The committee chairs were the literal `['fp','lp','sd','cup','tvc','pnl','fp']`
in every campaign at every seed: the RSF could never chair anything and the FP
always chaired two, whatever the election returned. Chairs are now apportioned
to the chamber by largest remainder, they are named people with a party, a
trait, an age and a year of appointment, and when you lead the government you
hand them out yourself.

**The World.** Being allied with a power and at war with it had four
independent causes, and a war-aware label would have hidden three of them.
`relWord` could not be made war-aware by a wrapper at all — it took a number
and nothing else — so its signature changed in place. War is no longer
declarable on a power at 74 relations: at maximum risk with every power at 70,
no war is declared, because there is nobody to fight. A non-aggression pact
removes its holder from the candidates rather than merely masking the number it
is compared on. A treaty with the country you are fighting is annulled instead
of continuing to charge upkeep and drift relations *toward* the enemy. Suing
for peace records the victory it used to erase — the Victor record and the
Conqueror epilogue were unreachable by that path. Five powers joined the six,
backfilled into every save through the enrich chain, because `st.powers` is
written as a whole literal in four places and two consumers read it raw. Four
new treaty instruments join the four, and all eight now do what their cards
have advertised since v6.

**The session.** Question Time was five sentences in one if/else chain, and its
gates made three of them nearly unreachable. It is ninety-four questions over
fourteen subjects — three ways of asking each from the government benches and
two from the opposition. Measured with every subject in play, sixty sessions
draw around forty distinct questions on each side of the chamber, with nothing
unfilled on screen. Selection still spends no dice: `v8EnsureQuestion` runs on
the render path, so a roll there would make a campaign's dice-spend a function
of how often a tab was opened. The political papers went from eleven types to
forty-three, written one desk at a time; and `partyDemandPolicy`, which
contained no `rand()` at all and so had a party demanding the same statute
session after session until it got it, now draws from the top of its want list
instead of always taking the head of it.

**Two assertions in this PR could not fail, and were rewritten.** "War needs
somebody to be hostile to" read the target's relation *after* the tick, and
declaring war clamps that relation to 18 — so every target in history read "not
a friend" and the assertion passed with the hostility floor deleted. "Eleven
powers, none of them NaN" called the migration by hand, which proves the
function exists and nothing about the wiring. Both now measure the property
through the path a real campaign takes, and both go red when it is broken.
Every new assertion in this PR ships with the one-line mutation that turns it
red — sixteen of them, listed in the commits.

What the harnesses hold on this branch:

```
ALL CHECKS PASS   11/11, 2,065,035 bytes of 2,100,000
ROADS OK          64 assertions
PLAYTEST PASS     39 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TABS OK / CHAMBER OK / TIERS: no width scrolls sideways
PACING            re-run after the questions and papers: unchanged — every
                  length reaches its end year, records 10/11/12, crisis
                  density flat at 0.8
```

**The fifth order, item by item.** All eleven, and the two the owner added
after the plan was written:

| # | The ask | Where it landed |
|---|---|---|
| 1 | Influence other parties' bills, scaled by standing; kill at an outright majority | S10b (#26) |
| 2a | The duplicate Somnium Sea Wall | S10a (#25) |
| 2b | Two to three times as many Great Works | S10d — 16 distinct → 48 |
| 2c | Options while a work is under way | S10d — six instruments |
| 2d | Very easy builds six at once | S10a (#25) |
| 2e | Very easy starts richer and earns faster | S10a (#25) |
| 3 | Ministers age, die, and can be interacted with; actions expanded | S10a (age, death, the age on the card) · S10e (five interactions) |
| 4 | ≥36 unique standalone executive orders replacing the policy-raiser | S10b (#26) — 36 in eight categories |
| 5 | Governors age and die; two regions to the ballot every two years; campaign influence | S10a (#25) |
| 6 | The World: ally-at-war, thin diplomacy, boilerplate negotiation, new powers | S10e — four causes closed, 6 → 11 powers, 4 → 8 instruments |
| 7 | Assign committee chairs when you lead; chairs are named people | S10e |
| 8 | Greatly expand the unique-name pool | S10a — 1,600 → 39,400 pairs, deduplicated |
| 9 | Question Time: expand | S10f — 5 sentences → 94 questions over 14 subjects |
| 10 | The political papers: expand | S10f — 11 types → 43 |

Next: nothing queued from the fifth order. The largest remaining stabilisation
item is unchanged and still the owner's co-priority: **marker/seam
consolidation** — 25 literal splice markers, and the dead-body ratchet from 5
to 0.

Previously: **S10b/c — The Order Paper and the Order Book** (PR #26). Two halves of the
owner's biggest asks: what you can do about a bill you did not write, and
executive orders as their own instrument.

**Bills that are not yours.** `billCard` offered Support and Oppose only when
`b.owner === 'government' && !leads(S)` — but `aiGovern` returns early the
moment you lead, so no government-owned bill exists while you are head of
government, and the private members' path sponsors as `'opposition'`, which
that condition excludes. An opposition bill therefore rendered NO controls at
all, ever. The lever set now scales with what you command: positions and the
public argument in opposition, amendments and the committee timetable in
government, and at an outright majority the power to kill a bill. A declared
line is worth what the party declaring it is worth — 0.9 points of Assembly
forecast at 5% of the chamber, 8.8 at 50%, 15.9 at 90%, where it was a flat 8
at any size. `outright(st)` is a predicate BESIDE `standing()`, never a fourth
value of it, and keys on `playParty` so a junior partner under a majority
government does not inherit the kill.

**The order book.** An executive order was a flag on a statute. There are now
36 standing orders in eight categories across all four offices, sixteen of
them targeted at a region, a power, a public work or an issue. Three rules
decide what belongs: it targets state no statute reaches, it is standing
rather than one-shot, and it lapses when you lose the department that signed
it. Standing effects bend indicator and bloc TARGETS rather than stocks, so
revoking an order lets the country drift back and nothing accumulates in the
save. The court can strike one; the Executive Strategist doctrine finally has
the drawback its own note has always advertised.

Previously: **S10a — The Republic Ages** (PR #25). First of five slices carrying the
owner's fifth order: eleven items across the parts of the game you *operate*
rather than the statute book you legislate from. This slice takes the three
reported defects, the person layer they exposed, and four promises the game
was not keeping.

Four of the eight regions had never held a governor's election, in any
campaign, at any seed. `v6GovernorElections` tested `(turn + regionIndex) % 4 === 1` on
ballot turns, which are odd, so it could only ever be true for an even index.
Thaxia, Tenebris, Meridian and the Federal District were frozen for the whole
campaign, ageing without anything that could replace them, and the same
expression drove a forward search for the printed ballot year that gave up
after eight turns — so their year receded by one every year. The schedule is
now counted in ballots: two regions at each federal ballot, every region every
fourth ballot, no parity to be knocked out of step by an early election.

Ministers and governors joined the mortality that already existed for party
leaders and the four executive offices. `ageFigures` split into `ageRoster`
and `ageSucceed` so a later chunk can extend the list — its roster was a local
array, so a wrapper could only watch. `v6GovernorsTick`'s own `g.age += 1`
went in the same commit: governors were being aged twice a session. A
minister's death leaves the post vacant; a governor's is filled by their own
party for the rest of the term. The obituary roll — written on every death
since the v4 base, capped at forty, saved with every campaign and displayed
nowhere — is now a panel on the Record.

There was one Somnium Sea Wall too many: `coast` and `v9seawall` shared a NAME
under different ids, and the merge guard is keyed on id. The v9 entry survives
and any save building the other is folded onto it with the money carried
across.

Names went from 1,600 pairs to 39,400, deduplicated against the living cast in
the factories rather than in `makeName()`, and weighted by region for
governors. Very easy builds six grand works and has the capital to commission
them — opening balance, income and the ceiling all moved, because the ceiling
would otherwise have clamped the rest away.

Four things nobody asked for, three of which broke written rules: an
unreadable save was destroyed by the first autosave after the setup sheet
promised it untouched; every one of the game's 75 refusals was silent on phone
and tablet while every success spoke; a finished campaign was offered for
resume with no hint that nothing would work; and the seeded stream depended on
which tabs you had opened and on the browser's sort algorithm.

**The seeded stream has moved.** New rolls for minister ages and name dedupe,
and two random comparators replaced with Fisher-Yates, mean a seed no longer
reproduces its pre-S10a campaign. In-progress saves are unaffected — the RNG
state rides the save — and load, migrate and render correctly. `maxBytes`
1,900,000 → 2,100,000, raised here rather than when it binds.

(At the time: next was **S10b**, the executive order book and influence over
bills you do not own; then the Great Works, the Ministry/committees/diplomacy,
and Question Time with the political papers. All of it is now shipped.)

Previously: **The fourth order is complete** — S9f, S9g and S9h are all merged (#21, #22,
#23). Every one of the 582 statutes has four levels, each with its own set of
modifiers; the card preview says what extending or repealing would do; the
Dossier shows every stage; every one of the twenty core categories holds
exactly twenty-four statutes; and both navigation complaints are fixed.

What the harnesses hold, on main:

```
ALL CHECKS PASS   11/11, 1,784,985 bytes of 1,900,000
ROADS OK          31 assertions, including the four-rung, category-count and
                  balance-preservation steps
PLAYTEST PASS     34 steps + the WebKit SKIP
DETERMINISM PASS  8 properties
TABS OK / CHAMBER OK / TIERS: no width scrolls sideways
```

Nothing is queued. Open questions that remain the owner's, unchanged: the
localStorage-persistence probe visit and the WebKit host allowlist. (S14a
correction: this entry also carried "the two party-palette collapses
`tools/seats.js` reports under colour-vision simulation" as open. It was not.
S7 settled it below, at the S7 entry: every pair that collapses under the three
dichromacies is an ADJACENT pair, which is exactly where S6b put the aisles and
the direct labels. The palette needs no change; the item was copied forward
after it had been answered.)

Previously: **S9h — the curves** (PR #23, merged). The last of the fourth
order: every one of the 582 statutes has four levels, each with its own set
of modifiers.

The 451 statutes that were already in the book had interpolated ladders since
S9f. They are now authored, to the same grammar the 131 new ones were born
with: rung 1 the pilot, rung 2 the programme, rung 3 the second order, rung 4
the whole instrument plus a cost it did not have lower down. Domestic
surveillance becomes a technology programme at rung 3 — the collection has to
be built — and starts costing the economy, and organised labour, at rung 4.
Single-payer coverage picks up a technology drag at rung 3 and a liberties
cost at rung 4. Across all 582: 23 distinct indicators arrive at rung 3, 23
distinct costs land at rung 4, and no statute has a rung that reads the same
as the rung below it.

**The top of the ladder is unmoved, and that is machine-checked.**
`tools/fullbuild-baseline.json` froze every pre-S9h full build and its
materialized `auth` before the rewrite; roads.js checks all 451 against it,
key by key, within 10% for the build and 0.1% for the position on the map.
Regenerating that file is a balance decision, not a chore.

The rewrite was surgery on the literals: a brace matcher that understands
string literals finds each `P({...})` block, the rung-1 row replaces
`eff`/`mood`/`rev`/`exp`, `auth` is materialized first so rewriting `eff`
cannot move a statute, and the three cumulative overrides are appended. The
round trip was proved byte-identical on 451 blocks before anything was
written, and the pass is assertion-guarded: one statute out of its envelope
and nothing is written at all. That guard earned its keep — the Foreign
bucket came back with rung-1 rows at full strength instead of the pilot band,
was refused, and was re-authored.

Two deliberate deviations from the plan. **`lin` stays**: it became
load-bearing in S9f, where P() rescales `cost` by it so a full build costs
what it always cost; removing it would have made every pre-existing statute
more expensive to build out. **The save migration stays a migration**: the
plan had it become a loud refusal, on the reasoning that `lin` would be gone.
It is not gone, the position rescale is independent of what the rows contain,
and the invariant is that saves break LOUDLY — not that they must break.

`maxBytes` 1,750,000 → 1,900,000, both cases in `baseline.json`. 1,784,630
bytes.

Previously: **S9g — the statute book** (PR #22, merged). Every one of the
twenty core policy categories holds exactly twenty-four statutes: 131 new
ones, all authored on the four-rung ladder from birth. `tools/roads.js` asserts the count rather
than trusting it, and asserts that no rung of an authored statute reads the
same as the rung below it.

They were designed against the complete existing roster — one designer per
category, cluster critics across the collision-prone pairs — and three
residual collisions were replaced outright (Labour's duplicate of
`yellowUnions` became the hiring halls; the Authority/Culture clash over
opening the files became `lustrationAct` in Culture and, in Authority, the
`lapseRule` that makes every Authority statute expire with its parliament).
Empire gets tribute rolls, client heirs schooled in the capital, the
militarised marches, treaty ports, naval reprisals and two liberty-lean exits
— dominion status and a relinquishment commission. Federalism gets the
governors' council, state receivership, the articles of separation, the
commandeering act, a relocated capital. Elections gets a boundary commission,
a federal election service, allocated airtime, international observers.

Each carries four cumulative standing rows built to a written grammar: rung 1
the pilot, rung 2 the programme, rung 3 the second order (a key that only
appears at scale), rung 4 the whole instrument plus a cost it did not have
lower down. Every rung-4 value on a design key lands within 20% of that
design's intended full build, so the new statutes sit on the same scale as
the old. Generation was assertion-guarded: unknown keys, invented revenue, a
repeated rung, a full build off its anchor or an unresolved `needs:` abort
the build before a byte is written.

`maxBytes` moved 1,600,000 → 1,750,000 with the case recorded in
`baseline.json`: the binding invariant is self-containment, not bytes, and
this growth was ordered. 1,617,357 bytes, ~130 KB of headroom.

Next: **S9h — the curves**, authored rows for the 451 statutes that were
already here, `lin` removed, the save migration becoming a loud refusal.

Previously: **S9f — the Ladder** (PR #21, merged). Four rungs on every
statute, and the two navigation complaints. First of three slices carrying
the owner's fourth order: *every policy gets four levels with a unique set of
modifiers at each, the card previews what extending or repealing would do,
the Dossier shows every stage* — and, separately, *every category reaches 24
policies*.

The engine. `P()` — the funnel all 451 policy literals already passed through
— now expands each one at parse into `_effAt/_moodAt/_revAt/_expAt[0..4]`.
`eff`/`mood`/`rev`/`exp` are the rung-1 row; `eff2`..`eff4` are cumulative
totals, for the authored curves S9g and S9h bring. Until a curve is authored a
statute carries `lin`, the ladder it had before, and its rows are interpolated
through its own rescaled rungs — exact at every position an old save, seed,
want or programme target can occupy, so the four-rung order cost nothing in
balance. `cost` was rescaled the same way: a full build costs what it always
cost, in four instalments.

Nothing multiplies a base by a level any more. The seven one-shot mood
impulses became row deltas, which also deleted v9's staged-bill patch (it
swapped `p.mood` underneath `enactBill` and would never have reached the
tables). 219 literals that encoded a position were rescaled by
`round(n/oldMax*4)` — gates, court cases, events, 41 party wants, programme
targets, scenario seeds — and 24 ad-hoc linear terms took `k*oldMax/4`. Terms
multiplying a raw position halved their coefficient, a rung being half what it
was for the 233 max-2 statutes. Old saves are migrated onto the new ladder,
stamped `polV2`, and the player is told.

The surfaces. The policy card's first tagline is now the STANDING law at the
rung it sits on, followed by what one more rung would add and what giving one
back would take away — in the same row, because compact mode folds the second
one away. The Dossier's ladder reads the real rows, quotes capital on the
rungs you can actually reach, reads the Senate in both directions, and its
constituencies section says what it means (the old heading called a one-shot
impulse a per-level stock). The drafting desk states the rung's own change.

The navigation. A main-tab change lands at the absolute top, every time — the
cross-tab scroll memory that gave one gesture three outcomes is gone, and the
header row is always there when you arrive. Drafting an extension or a
referendum no longer throws you to the Legislative tab.

The morning-review items flagged in PR #20 are ratified as shipped: the
securityState thresholds, BLOC_WEALTH, the Senate reservation, the territorial
formula, the ritual deltas, the toSyndicate gates, the S9e costs and event
weights are all the recommendation. The one deliberate change is
securityState's per-statute coefficient, 2 → 1, which is the ladder-unit rule
above and not a retune.

Next: **S9g — the statute book** (131 new policies, every core category to 24,
authored four-rung curves from birth, `maxBytes` 1.6M → 1.75M with the case),
then **S9h — the curves** (authored rows for the 451 existing statutes, `lin`
removed, the migration becomes a loud refusal).

Previously: **S9e — the Roads** (PR #20, merged). The content the descent
engine carries; with it, the owner's third order is complete.

One new form: **the Chartered State** — the oligarchic terminal corporate
never had (its only exit was back to federal; the capital road ended mid-air).
Elections stay on; the weighted register is the sham. 34 new policies through
the FIRST `POLICIES.push` in the file's history: the Charter book (20 —
charter courts, company towns, scrip wages, the census of assets, franchise
audits, tax farming, the assessment pass...), six open-book descent enablers
laddered by `needs:`, four party-state and four emergency exclusives; plus
eight `needs:` ladders on the existing Authority/Security book, so how you
build the police state now has an order. 33 turn-by-turn events: the
repression spiral (the crackdown radicalises them; the disappeared name; the
bureau inventing its numbers), the capital road (the strike against scrip, the
board moving on your Chancellor, the state margin-called), sham-election
theatre (choose the number; the district that votes wrong anyway), the
praetorian question (the colonels' petition; the exercise on the ring road),
and the roads back (the succession, the plan's arithmetic, the charters'
flight, the thaw's dividend). Two arcs: The Offer (capital captures the
state from inside normal play) and The Guardians (the army becomes a
creditor). Opening goals for the four scenarios that had none (11/11 parity).
Six new records — the only sanctioned change to the epic pacing set. Three
acts of repair: lift the siege, open the archives, revoke the charters — the
descent is playable in reverse.

`tools/roads.js` grew the content proofs: the corporate→syndicate road through
its real gates and home again via the charter flight; ALL 33 events
constructed against the real `eventOpen`; both arcs triggering; every record
and goal throw-free at three lengths; registries at 11/11, 3/3, 3/3, 6/6.

Previously: **S9d — the Descent** (PR #19, merged). The engine half of the owner's third order:
"expanded options and means of changing/altering the course of government...
integrating it into existing functions rather than bolting on new systems...
policies should vary based on the state the country is in."

What was inert, made real. Nine of eleven constitutional acts were pure
latches — `wealthFranchise`, the signature oligarchy move, weighted NO vote
anywhere; all nine now have standing effects (the franchise is genuinely
weighted via BLOC_WEALTH in supportTargets; the chartered Senate holds its
fifth of the seats through every election, totals preserved; the consulate
pins the offices; the siege, the purge, life terms, agency capture, annexation
and the territorial seats all read every turn). The extraordinary measures
were gated by RULING PARTY alone — most governments could never descend,
however far the country had; the door now also opens by the state itself:
`securityState(st)`, a derived scalar over the Authority/Security statute
book (thresholds 30/45/65), feeds unrest suppression with diminishing
returns, liberties/safety/corruption targets, movement fear and the Front's
growth, the court's deference, the price of the next Authority measure, and
the measures gate. A fresh republic measures 0 — the default game is
untouched, and `tools/pacing.js` is byte-identical before and after, id for
id, on every length. The sham election became the confirmation ritual: a
dispatch with a rigging dial, an honest-count gamble, and at police-state
levels the turnout-as-weapon; staged counts are a loan the reckoning calls in
when elections return. `terminal:true` is finally read — leaving the Empire
or the People's Republic needs the restoration crisis (the convention arc
opens the door) and pays a surcharge. `needs:` is enforced on all three
enactment paths (a bill whose prerequisite fell while before the houses now
lapses loudly at assent). `policyOpen` gained `forms:[…]` and per-policy
`req(st)` with `policyWhy` giving every refusal its reason. Dead branches
fixed: the never-printed imperial ending, the `'absolute'` party-ban gate,
write-only conventionLimits. New chunk v10 (baseline 8/8, no ensure function,
dice guard stays outermost by construction). `tools/roads.js` drives the full
authority ladder rung by rung through the REAL guards, proves the state gate
for a centre party, the ritual, the reckoning, the weighted franchise, needs,
terminal refusal + restoration + surcharge, and seat conservation — ROADS OK,
and it fails on the pre-S9d file at its first assertion.

Previously: **S9c — the Atlas** (PR #18, merged). The navigation overhaul the owner ordered:
"Government is both a tab and subtab... things don't seem to logically or
intuitively be grouped together."

Six groups now, one organising principle each, ids g-prefixed so a group id
can never collide with a tab id again: Desk (the brief and the record),
Lawmaking (a measure drafted, passed, and PAID FOR — the ledger finally sits
beside the bills it funds), Government (the offices and the ministry),
Constitution (the order and the court that polices it), Politics, Country. The
double-"Government" died by relabelling the tab "Ministry" (its id — and every
saved fold key and jump literal — unchanged). Group buttons carry data-group
only, so `[data-tab="government"]` is unambiguous at last. Digits 1-6 pick a
group and repeat cycles its pages: six keys cover all fifteen views (five tabs
had NO key before — the map was an ordinal slice that v5's splices had pushed
them out of), and the field guide and council menu derive from the same array.

Misfiled content moved home: domestic protest movements and their handling
actions from World to Nation (merged into one panel), the Society deck to
Nation, the Chronicle to Record, the States deck deduped to Federation, the
Ministry deck to the Ministry page. The pasted-everywhere panels were cut to
canonical homes: Dispatches on 13 of 15 views became 2, the inbox 7 became 3
surfaces (full on Parties, preview on the Desk), the manifesto 5 became 2.
Saved fold preferences follow their panels via V7_FOLD_REMAP — migrated, not
orphaned (proven by the fold-migrate step). tools/tabs.js was rewritten (it
had been dead since S6a removed the rule it spliced) and tools/chamber.js's
group-id-as-tab bug is fixed. Proof against the pre-fix file: government id
collision, 5 dual-attribute buttons, 5 keyless tabs; current file: zero, zero,
zero.

Previously: **S9b — the screen stops jumping** (PR #17, merged). The owner's report — "I click
something and the screen jumps around or resets" — decomposed into nine
mechanisms, each fixed in place:

The window is the scroll container at every tier and same-tab renders had no
scroll handling at all, so the full innerHTML rewrite let the browser clamp
scrollY whenever a view came back shorter; v7's wrapper now saves and restores
around every same-tab render. `flash()` — 74 call sites — scheduled an
unprompted FULL render 1.6 seconds after every "you can't do that" message; it
now restores the hint's own text and nothing else. Seven jump/menu/keyboard
sites forced a smooth scroll-to-top after render, fighting v7's restore with a
double motion (and the phone swipe overrode the restore entirely); v7's
restore is now the single scroll owner. `focus()` without preventScroll at
showSheet/hideSheet/policy-search — long sheets opened pre-scrolled past their
own heading (the old fallback grabbed the first button ANYWHERE in the sheet),
and closing a sheet scrolled to a node the next render destroyed. The phone
nav animated a smooth re-centre on EVERY render (now only when the tab
changed) and the phone stat strip forgot its position (now remembered across
the rewrite). Stat chips changed width when a delta appeared, moving the wrap
point and everything under the cursor (delta slot reserved + min-width ≥761).
The modal toggled body overflow with no scrollbar-gutter, shifting the page
15px on open and close (gutter reserved, scoped ≥761 so the phone keeps its
width). The turnbar ResizeObserver now writes --turnbar-h only on real change.

New playtest step `scroll-keeps`: the pre-fix file fails it on three named
mechanisms (key re-press forced 500→4, flash triggered a delayed render,
gutter auto); the same-tab-render, sheet-open and stats-strip sub-assertions
pass on both files and are regression pins, not proofs — stated here so the
step's evidence is not overread.

Previously: **S9a — nothing is lost quietly** (PR #16, merged). An independent survey after S8d
found a cluster of defects on the one thing the agreement calls the worst
possible failure — the player's record lost silently — and the worst of them
was not the one S8c fixed.

The hall of fame silently destroyed itself: `v8HallRead` caught to `[]` and
`v8HallWrite` caught to nothing, so an unreadable `parliamentVale.hall` blob
read as empty with no warning and the next campaign ending overwrote it — the
one blob a player cannot re-earn. It now has the autosave's S1 contract: an
unreadable blob is reported (in the hall's own render and by toast), left
untouched, and never overwritten; the player's explicit "clear the hall" still
works. A campaign that ended in collapse banked nothing from its dying
session: `checkCollapse`'s two `gameOver` calls fired before any tick — the
same defect class S8c fixed, on the branch S8c did not touch; both endings now
bank first through a shared `v6BankSession` helper. The Record page printed a
raw template: the goal panel was the ONE note read site not going through
`v6Note`, so the default opening showed "Put {n} of your bills on the statute
book". Records and goals could be dated one year after the republic ended
(unclamped `yearOf` at three sites). Smaller truths: `rd_decade` renamed ("A
decade" while requiring `v6Scale(st,12)`), `.goal-mark` finally has a CSS rule
(the percentage was taking the wide grid column), the ending copy no longer
says "the two centuries" on a fifty-year campaign, and the playtest's modal
drain no longer races `v6Pump`'s 40 ms re-open. Every fix ships with the
assertion that would have caught it; all four new steps FAIL against the
pre-fix file.

Previously: **S8d — the flagged leftovers** (PR #15, merged). Four small
items, none a design decision, each carried forward from an earlier slice's
notes.

`breakpoint-tiers` was a membership test wearing a partition test's name, and
five ways past it are now closed with a proof of each: a number used as both a
`min-` and a `max-` edge (so both rules apply at that exact pixel), `em`/`rem`
widths, media-range syntax `(width >= 900px)`, fractional thresholds, and the
one height threshold in the file — `max-height:460px`, the landscape turn bar,
which until now was governed by nothing.

`hemiMap`'s `total` parameter was declared, never read, and promised a
guarantee the body does not make: the arc is drawn from the sum of the seats
object, so a roll short of its chamber's size draws a silently smaller chamber
while every existing assertion still reads "ok". The parameter is gone and the
guarantee is now real — `tools/chamber.js` asserts both houses total their
constitutional size at the opening and after every election. This was the last
open S6 implementation note in AGREEMENT.md bar one, which is marked still
open there rather than quietly dropped.

The campaign-seed copy now says "the same seed and the same **choices, in the
same order**". Only the free tightening was taken: I could not produce a
divergence from choices alone — only from dismissing a sheet versus answering
it — and would not weaken a claim I cannot falsify.

And the board below is corrected twice: PR #12 was still listed as in review,
and S2's note that marker/seam consolidation was **deferred to S6** was
silently dropped when S6a/b/c all merged without it. It is restored as named,
pending work — it is the largest remaining stabilisation item and the next
slice.

Previously: **S8c — the record scales with the campaign** (PR #14, merged).
Thresholds across the achievement array and the scenario goals were authored
against the two-hundred-year span; a fifty-year campaign met them with a
quarter of the sessions. They now scale with `endYear` through one helper, and
the requirement is *rendered* from the live number rather than hard-coded in
the prose. Epic is 1.0 by construction and its record id set is identical, id
for id, before and after. Two defects fixed on the way: the closing session was
never banked (`endTurn`'s end-of-campaign `return` skipped the tick), and the
hall of fame's score summed raw cumulative counters, so a short campaign was
structurally excluded from the top of its own leaderboard. Short closes at
26% / 18% / 26% of the record against 13% / 10% / 15% before; epic unchanged.

Previously: **S8b — the instrument** (PR #13, merged). `tools/pacing.js` was
recomputing every achievement test against the final state; the game *latches*
its records and the displays read the latched map. The figures published in
PR #10 (short 8%, epic 28%) therefore measured the wrong quantity. The tool now
reports the latched map, the id list, a per-test `threw:` list, and the six
counters that gate eight of the length-sensitive records.

Previously: **S8 — pacing, measured** (PR #10, merged). `tools/pacing.js` plays each length option to
its end year through the real turn loop. Findings: all three lengths **do** reach
their end year, and dispatch density is flat at ~1.6-1.8 per session across all
of them — so the fifty-year option is not denser, it is simply shorter. The
record tells the same story: a short campaign closes having unlocked **3 of 39
achievements (8%)**, against 18-23% for a century and 21-28% for two hundred
years. A retune is reserved to the user; three options are put to them in the
PR. Harness caveat, stated in both: it always takes the first choice on offer,
so it loses government early and never initiates a referendum or a treaty — the
achievement figures are a floor, not a typical player's experience.

Previously: **S7 — onboarding** (PR #9, merged). The setup sheet asks its two real questions with a
line each on what they decide, and folds length, difficulty and the house rules
into one disclosure that names them. Also closes the colour-vision question
flagged in S6b and S6c: `tools/seats.js` now simulates all three dichromacies,
and every pair that collapses is an ADJACENT pair — exactly where S6b put the
aisles and the direct labels. The palette needs no change.

Previously: **S6c — the chart vocabulary** (PR #8, merged). Both line charts rebuilt on one shared
helper: every series now ends in its current value, in its own colour, with
leader lines where the declutter moved a label. Narrow screens open a chart on
the present instead of the oldest session. The two items deferred out of S6a and
S6b are closed here — the turn bar is opaque, and the chamber legend no longer
repeats the seven numbers the direct labels already give.

Previously: **S3 — seeded dice** (PR #7, merged). All 93 `Math.random()` sites route through one
seeded engine whose state rides the save, so a campaign is reproducible from a
seed the player can type at setup and read back in the save dialog. Seven
determinism properties are asserted by `tools/determinism.js`, which found two
real bugs in the implementation — construction-time rolls drawn from the
previous game, and a `var seed` local that hoisted over the campaign seed.

Previously: **S6b — the chamber** (PR #6, merged). The seat map rebuilt to the design rulings:
aisles between blocs, a direct label on every bloc, seats rimmed in the ground
colour, and the two invisible party colours lifted along their own hue (RSF
contrast 1.90 → 2.68 at 0.4° of drift, PNL 1.35 → 2.86 at 7.8°). Seats render
about 75% larger on a desktop. `tools/chamber.js` and `tools/seats.js` make all
of it re-measurable, and both caught real defects in the first draft.

Previously: **S6a — three real tiers** (PR #5, merged). Thirteen width thresholds collapsed to
five, and all five are tier edges: 420, 760/761, 1179/1180. The desktop now
uses the window (21% of a 1500px screen was unused, now 4%), and the tablet
band is a tier with its own layout instead of a narrow desktop wearing half the
phone's chrome. Ten queries deleted as provably dead, five retargeted, one
carried forward — `.gz-cols`, which was the only rule in the sweep doing live
work, and which had left the gazette two-up across 621–760.

Previously: **S2 — chain consolidation** (PR #4, merged). Five dead bodies
deleted after poison-proof (132 lines); five more that a reference scan called
dead were proved to execute at boot and kept, with MAP.md corrected. Dead-body
ratchet 10 → 5, which is now its true floor.

## Slice board

| Slice | Status | Notes |
|---|---|---|
| S0 agreement + tooling | **merged** (#1) | checks/, tools/, docs/, hook, skill, permissions |
| S1 correctness | **merged** (#2) | ratchets moved: strict 7/7, stale bindings 0, orphans 10 |
| S2 chain consolidation | **merged** (#4) | 5 orphans deleted with poison-proofs; 5 'orphans' proved live at boot and kept; ratchet 10→5 (its true floor). Marker/seam consolidation deferred to S6, where the restyle needs the seams |
| S4 look mockups | **done — Ministry Precise chosen** | two rounds (5 directions, then 3+3 runoff) at claude.ai/code/artifact/6f9de079-1c31-4c8c-a2f9-03f018069e57; tokens + type recorded in AGREEMENT.md; finalist screen set (Overview ×2, Drafting Desk, Election Night) on the canvas |
| S5 token foundation | **merged** (#3) | tokens retuned, 7 faces embedded (128 KB measured), no external references, allowlist empty; figures on the tabular mono face |
| S6a three tiers | **merged** (#5) | 13 thresholds → 5, all tier edges; desktop waste 21%→4%; tablet given a real layout; `tools/tiers.js` + `tools/tabs.js` measure it |
| Review fixes | **merged** (#12) | 2 real defects + 6 smaller ones from an adversarial pass; chamber tool now replays awkward seat shapes, determinism gains an 8th property, tab-tour stops counting attempts |
| S8 pacing | **merged** (#10) | measured, not retuned: all lengths reach their end year, density is flat; the call is the user's. Its published record shares were wrong — the instrument recomputed instead of reading the latched map (corrected in #13) |
| S7 onboarding | **merged** (#9) | two guided questions, the rest behind one disclosure; playtest gains `setup-trimmed`; CVD measured |
| S6c charts | **merged** (#8) | one chart vocabulary, end-value labels, charts open on the present; region tiles carry their winner as an edge |
| S3 seeded PRNG | **merged** (#7) | one engine, state on the save, seed typed at setup and shown in the save dialog; `tools/determinism.js` asserts 7 properties |
| S6b the chamber | **merged** (#6) | aisles, direct labels, ground rim, two hue-locked lifts, seats +75% on desktop; `tools/chamber.js` + `tools/seats.js` |
| S8b the instrument | **merged** (#13) | pacing tool read the latched map instead of recomputing; the PR states plainly that PR #10's published figures measured the wrong quantity |
| S8c the record scales | **merged** (#14) | thresholds scale with `endYear`, requirements rendered not hard-coded; closing session now banked; hall score made span-relative; epic byte-identical |
| S8d the leftovers | **merged** (#15) | breakpoint check made a partition test (5 proofs); hemiMap's false `total` dropped and the guarantee moved into `tools/chamber.js`; seed copy tightened; this board corrected |
| S9a nothing lost quietly | **merged** (#16) | hall gets the S1 loudness contract; collapse endings bank their session; the one raw `note` read site fixed; year clamps; 4 new playtest steps, each proven to fail pre-fix |
| S9b the screen holds still | **merged** (#17) | nine jump mechanisms fixed in place; v7's restore is the single scroll owner; `scroll-keeps` step discriminates on three of them |
| S9c the Atlas | **merged** (#18) | six coherent groups, ids collision-proof, Ministry relabel, 6-key keyboard covers all 15 views, misfiled panels rehomed with fold-pref migration, tabs.js rewritten |
| S9d the Descent | **merged** (#19) | securityState + state-gated measures; nine latch acts get teeth; confirmation ritual + reckoning; terminal real; needs on all paths; v10 chunk (8/8); `tools/roads.js` ROADS OK |
| S9e the Roads | **merged** (#20) | the Chartered State; 34 policies (first POLICIES.push); 33 events; 2 arcs; 11/11 goal parity; 6 records; 3 acts of repair; roads.js content proofs |
| S9f the Ladder | **merged** (#21) | four rungs on every statute via `P()`; `lin` interpolation parity-exact at every reachable rung; 7 impulses → row deltas; 219 position literals rescaled; loud save migration + `polV2`; card/Dossier/desk surfaces; tab changes land at the top; drafting stays on the policy page |
| S9g the statute book | **merged** (#22) | 131 new statutes, every core category to 24; four authored rungs from birth with a written curve grammar; 11 prose conditions turned into real `req:`/`reqText:`; `maxBytes` 1.6M -> 1.75M with the case; roads.js counts the categories and checks no rung repeats the one below |
| S9h the curves | **merged** (#23) | all 451 pre-existing statutes authored to the same grammar; `tools/fullbuild-baseline.json` freezes every pre-S9h full build and `auth`, roads.js checks all of them; literal surgery with a byte-identical round-trip proof; `lin` and the save migration kept, with reasons; `maxBytes` 1.75M -> 1.9M |
| S10a the Republic Ages | **merged** (#25) | the state ballot rebuilt in ballots not turns (four regions had never voted); ministers and governors join `ageRoster`/`ageSucceed`; the obituaries get a page; the duplicate sea wall retired and migrated; names 1,600 -> 39,400 pairs with dedupe; very easy builds six with the capital for it; four written-rule breaches fixed; `maxBytes` 1.9M -> 2.1M |
| S10b/c the Order Paper and Order Book | **merged** (#26) | levers on other parties' bills scaled by standing, kill at an outright majority, a declared line finally seat-weighted; `partyDemandPolicy` and the private-members' path stop being deterministic; 36 standing executive orders replacing `orderPolicy`, bending targets rather than stocks, lapsing with their department |
| S10d/e/f the Works, the Ministry, the World and the Session | **merged** (#27) | 16 distinct works -> 48, and six instruments that change what a work delivers rather than only its rate; five new ministerial interactions; committee chairs apportioned by largest remainder and made named people you assign when you lead; the four causes of ally-at-war closed, five powers and four treaty instruments added, treaty effects implemented; Question Time 5 sentences -> 94 questions over 14 subjects, papers 11 -> 43; two assertions that could not fail rewritten, sixteen new ones each shipped with the mutation that reddens it |
| S10g the Despatch Box | **merged** (#28) | 45 questions authored by the tail of the S10f run and never merged, plus 25 levelling the five subjects that fire most often; pool 94 -> 164, seven per subject on the government benches; 51 defects found by seven adversarial readings, ten of them the same question written twice by sibling agents; the item chosen by a saved ROTATION instead of a hash whose constant stride left one subject reaching 2 of its 12 questions in 200 sessions; `maxBytes` 2.1M -> 2.2M |
| S11a the Long Record | **merged** (#29) | twenty charts on the Record page from three sources, each panel naming its own start year; nine series were already recorded and shown to nobody, four of them in a v5 array read by nothing; build-on-open (9-12ms collapsed against 20ms open) with the Long Record the one that opens; three chart-engine defects fixed (querySelector-first-match, fold keys that collapse twenty panels into one preference, the sandbox carrying the deck through every forecast); all recorders round; very easy 175/5.4/26/440; `maxBytes` 2.2M -> 2.45M |
| S11b the Order Book | **merged** (#30) | 36 more orders, none gated, registered after the originals because four harness probes are positional; a filter strip with gated/ungated as chips; courtHeat, upheld and narrowed given real effect after being written and read by nobody; three reqText promises made real; two assertions that could pass while testing nothing rewritten (one of them flaky on main) |
| S11c the Federation | **merged** (#31) | the regional term: four directions of federal money reach the chamber through one seat-weighted factor, measured against a seat target rather than guessed; `regionPartyFactor` runs .847-1.028 in play, so only its floor ever clips; eight governors are worth +44 Assembly seats |
| S11d the Constitution | **merged** (#32) | 48 articles across 8 books, each moving something it names; ratification is a vote that can fail; entrenchment raises the bar to carry and to strike; the franchise articles cannot put a NaN in the ballot, proved over all 128 subsets |
| S11e the Ministry and the Interests | **merged** (#33) | departments become state: funding, strain, delivery; a briefing is never silently refunded; the college buys the ceiling, not the level; influence stops being a constant; an endorsement survives one ballot |
| S12 the Statute Book Speaks (engine) | **merged** (#34) | `capFloor:75` on very easy in a new outermost wrapper; every core book renders 24 with the locked ones stating their condition, and `policyOpen` untouched; `rungs:` on the statute plus a forward-hook renderer; `tools/rungs.js`; Taxation and Welfare authored; `maxBytes` 2.45M -> 3.1M |
| S12 prose, batch 2 | **merged** (#35) | Labour, Capital, Health and Education: 384 rung descriptions and 96 refreshed one-liners; the verifier caught 22 substitutable passages and a corpus-wide shingle caught one cross-batch collision; the specificity rule demoted to a note at 18% measured precision; blind attribution 60/60 |
| S12 prose, batch 3 | **merged** (#36) | Culture, Immigration, Justice and Security: 384 rung descriptions and 96 refreshed one-liners; the batch failed its own rung-order measurement at 37.5% against a 57.5% shipped baseline, two rival explanations were tested and killed, and 123 rung fields across 64 statutes were rewritten to climb one axis; re-measured on the same forty ladders it reads 72.5% and 75.0% |
| S12 prose, batch 4 | **merged** (#37) | Energy, Environment, Infrastructure and Technology: the first batch authored under the one-axis rule and the first measured before apply; drafts cleared the shipped baseline unrepaired at 75.0 and 80.0 per cent exact, repair cost 17 rung fields against the previous batch's 123, and after it both blind readers returned 92.5 / 85.0 / 0.950; the overuse rule was narrowed after firing on two bloc names |
| S12 prose, batch 5 | **merged** (#38) | Defence, Authority, Elections, Federalism and Foreign: 480 rung descriptions and 120 refreshed one-liners; drafts cleared the baseline unrepaired again and both blind readers returned identical scores at every stage, 92.5 / 85.0 / 0.950 after a 9-statute repair; attribution 60 of 60; the corpus rule caught a phrase four agents had independently converged on across three batches |
| S12 prose, batch 6 | **merged** (#39) | Empire, Imperium, People's State and The Charter close the book: 582 of 582 statutes speak, 2,910 pieces of authored prose; the two largest books sharded by group covered both exactly; highest ordering scores of the project at 93.1 / 87.5 / 0.950; whole-corpus blind attribution 118 of 120; the style guide's own worked example was found to have propagated its sentence shape into 21 statutes across 13 books |
| S13a style fidelity | **merged** (#41) | the authoring brief was a 112-line paraphrase of a 161-line skill and had dropped a rule; it is now the skill verbatim plus a statute addendum, committed as docs/PROSE-STYLE.md; audit of all 2,910 pieces came back clean on twelve rule families and two hits; the phrase matcher was fixed from substring to word boundary; "X rather than Y" measured at 7.5% precision and was deliberately left to judgement; maxBytes 3.1M to 10M |
| S13b the whole book read aloud | **merged** (#42) | all 582 ladders read blind twice, not sampled: 66.7 / 67.7 per cent exact with 163 failed by both readers; 458 rung fields repaired across 163 statutes with no non-target touched; re-read by two fresh readers at 85.4 / 84.4 per cent, tau 0.946 / 0.938, failures down to 62; the one-axis rule measured on the whole population at 59.2 per cent before it against 77.8 after, and the batches that predated it closed to 81.7 |
| S14c the ratchet made honest | **merged** (#45) | the check counted a hand-written aliasCaptured boolean and never asked whether the alias exists or is read, so two sites wearing an unread alias scored green -- one adjudicated in its own capitals as DELIBERATELY NOT CALLED; capture is now DERIVED from the code and the recorded boolean cross-checked against it, a rule validated at 197 agreements out of 199 with exactly the two known disagreements, moving maxDead 5 -> 7 as a correction; all 199 stale line fields deleted (28 were literally 0) in favour of `run.js --sites`; the swapped indicatorTargets#3/#4 aliases put back; five of poison.js's ten anchors pruned as bodies S2 deleted, and --list made self-verifying |
| S14b three live defects | **merged** (#44) | clamp answered NaN with NaN and bounds the wrong way round with the wrong bound; both are now named on screen and in the console and a bound is returned, with the predicate measured on an instrumented copy first (zero faults across playtest, zero across sixty turns, exactly one across roads) -- and that one was real: the brief branch clamped a schooled minister back to a hardcoded 96 against a ceiling of 102, refunding the college for 2 capital, 96.30 -> 96.00 before and 99.33 after; seven positional .filter(...)[0] probes named through pick(), demonstrated by a renamed order that the old playtest passed 41/41 on; the size check given a growth bound of 250,000 against HEAD, sized from the largest legitimate commit in this file's history (204,136) |
| S14a documents made true | **merged** (#43) | eleven false statements across CLAUDE.md, MAP.md and STATE.md, every one true when written: the size line said 1.4 MB against 3.0, MAP said 93 Math.random() sites eleven slices after S3 made it 1, MAP contradicted itself fourteen lines apart on whether the fonts are fetched, the ratchet bullet was wrong on three of six figures, the marker count was given as both 21 and 25, and a colour-vision question S7 had answered was still listed as open; the 62-ladder handoff lived only in a gitignored path and is now docs/PROSE-RESIDUE.md; roads.js, rungs.js, tools/prose/ and PROSE-STYLE.md added to the command list; no code touched |
| **Marker/seam consolidation** | **in progress — S14 PRs B to E** | deferred out of S2 to S6, then silently dropped when S6a/b/c merged without it. **25** literal splice markers (this row said 21 until S14 counted them with the check's own regex); dead-body ratchet 5 → 0. S14 splits it: PR B the three live defects, PR C the ratchet made honest (5 → 7, a correction), PR D the ratchet driven to zero with poison proofs, PR E the marker check split so it stops implying cover it does not have — **13 of its 24 multi-occurrence markers can never fail**, and the two markers whose failure puts wrong data on screen are held in variables and have never been seen by it |

## Open items / environment facts

- **Artifact localStorage probe:** published (build B live) at
  https://claude.ai/code/artifact/096870e0-8c13-4ab7-a09c-2d7e1422d67d — the
  page renders its own verdict. Build B went live with S1: if the owner visited
  during build A, one more visit settles it — the box turns green (storage
  survived) or the ledger resets (it didn't). Until CONFIRMED,
  Artifact builds of the game are look-and-feel only — phone save-persistence
  unproven there.
- **WebKit in cloud sessions:** blocked by the environment's network policy
  (403 on cdn.playwright.dev and its mirror). The harness auto-uses WebKit
  wherever `npx playwright install webkit` works; adding those hosts to the
  environment allowlist would enable engine-true phone runs here. Substitute
  meanwhile: Chromium at the phone viewport (named SKIP in harness output).
- Checks baselines (`checks/baseline.json`), **corrected in S14 after this
  bullet was found wrong on three of its six figures** — it is the section a
  cold session trusts for ratchet state, and it had gone stale across eleven
  slices: strict **8/8** (S9d took it 7 to 8 with the v10 chunk) and stale
  bindings 0, both at target and pinned; orphaned bodies **max 7, target 0**
  (S1 set it at 10, S2 deleted five and called 5 the floor; S14 found the check
  was reading a hand-written boolean rather than the code, and two more sites
  wear an alias nothing reads — 5 to 7 is the instrument being corrected, not
  the file getting worse, and PR D goes after the number),
  unseeded randomness pinned at 1 call (rand()'s pre-game fallback; was 93
  before S3), width thresholds pinned to the five tier edges and heights to the
  one (460, the landscape turn bar — added in S8d, when the check learned about
  the height axis), size cap **10 MB** on the owner's S13 ruling that it is soft
  (**file now 3.0 MB**; the check is kept only to catch a runaway apply
  duplicating a region),
  external allowlist **empty and staying empty**.
- Both items deferred out of S6a and S6b are closed in S6c: the turn bar is
  opaque at its top edge, and above the phone tier the chamber legend drops the
  seat counts the direct labels already carry (it keeps the party names and the
  banned state, which are never redundant).
- **The pacing retune is still the owner's.** S8 (PR #10) measured that a
  short campaign closes having unlocked 3 of 39 achievements against 18-28 per
  cent for the longer options, put three retune options in the PR body, and
  never got an answer. Recorded here because a ruling that lives only in a
  merged PR body is a ruling nobody will find.
- The user's decisions of record live in docs/AGREEMENT.md (interview verbatim).
