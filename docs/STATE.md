# Where are we, what's next

Update this file in the last commit of every PR.

## Current slice

**S10g — The Despatch Box** (PR #28). A stale workflow notification turned out
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
consolidation** — 21 literal splice markers, and the dead-body ratchet from 5
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
localStorage-persistence probe visit, the WebKit host allowlist, and the two
party-palette collapses `tools/seats.js` reports under colour-vision
simulation.

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
| S10a the Republic Ages | **in review (PR #25)** | the state ballot rebuilt in ballots not turns (four regions had never voted); ministers and governors join `ageRoster`/`ageSucceed`; the obituaries get a page; the duplicate sea wall retired and migrated; names 1,600 -> 39,400 pairs with dedupe; very easy builds six with the capital for it; four written-rule breaches fixed; `maxBytes` 1.9M -> 2.1M |
| S10b/c the Order Paper and Order Book | **in review (PR #26)** | levers on other parties' bills scaled by standing, kill at an outright majority, a declared line finally seat-weighted; `partyDemandPolicy` and the private-members' path stop being deterministic; 36 standing executive orders replacing `orderPolicy`, bending targets rather than stocks, lapsing with their department |
| S10d/e/f the Works, the Ministry, the World and the Session | **in review (PR #27)** | 16 distinct works -> 48, and six instruments that change what a work delivers rather than only its rate; five new ministerial interactions; committee chairs apportioned by largest remainder and made named people you assign when you lead; the four causes of ally-at-war closed, five powers and four treaty instruments added, treaty effects implemented; Question Time 5 sentences -> 94 questions over 14 subjects, papers 11 -> 43; two assertions that could not fail rewritten, sixteen new ones each shipped with the mutation that reddens it |
| S10g the Despatch Box | **in review (PR #28)** | 45 questions authored by the tail of the S10f run and never merged, plus 25 levelling the five subjects that fire most often; pool 94 -> 164, seven per subject on the government benches; 51 defects found by seven adversarial readings, ten of them the same question written twice by sibling agents; the item chosen by a saved ROTATION instead of a hash whose constant stride left one subject reaching 2 of its 12 questions in 200 sessions; `maxBytes` 2.1M -> 2.2M |
| **Marker/seam consolidation** | **pending — next slice** | deferred out of S2 to S6, then silently dropped when S6a/b/c merged without it. 21 literal splice markers; dead-body ratchet 5 → 0. The largest remaining stabilisation item and the user's stated co-priority |

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
- Checks baselines (`checks/baseline.json`): strict 7/7 and stale bindings 0
  (S1 targets reached and pinned), dead sites max 10 (0 by end of S2),
  unseeded randomness pinned at 1 call (rand()'s pre-game fallback; was 93
  before S3), width thresholds pinned to the five tier edges and heights to the
  one (460, the landscape turn bar — added in S8d, when the check learned about
  the height axis), size cap 1.6 MB (file now 1.43 MB with fonts embedded),
  external allowlist **empty and staying empty**.
- Both items deferred out of S6a and S6b are closed in S6c: the turn bar is
  opaque at its top edge, and above the phone tier the chamber legend drops the
  seat counts the direct labels already carry (it keeps the party names and the
  banned state, which are never redundant).
- The user's decisions of record live in docs/AGREEMENT.md (interview verbatim).
