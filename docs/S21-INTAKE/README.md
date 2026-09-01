# S21 intake — the AI as it stands, read in full

Twelve independent readers, one per subsystem, each working to `BRIEF.md`:
every claim anchored to a line number, every field checked for a reader before
being called live, and most of them driving their own measurements rather than
reasoning from the code alone. Roughly 200 findings.

`docs/S21-BASELINE.md` is the measured companion — what the AI does across 720
driven sessions. This directory is what the code says.

| report | subject |
|---|---|
| `deck.md` | the 11 cards an engine can play, and what the player can do that it cannot |
| `posture-tempo.md` | when a party acts and in what mood |
| `goals.md` | the seven aims, how they are adopted and how they die |
| `choosing.md` | `v19Score`, `v19Outcome`, and what kind of reasoning this is |
| `memory-rivalry.md` | what a party remembers and who it treats as an enemy |
| `legislative.md` | how engines behave in the chamber |
| `coalition.md` | formation, the agreement, and life between elections |
| `executive-elections.md` | offices and ballots |
| `instruments.md` | articles, orders and the court |
| `society-foreign.md` | blocs, interests, the street, movements, foreign powers |
| `surfaces.md` | what the player can see and do about the AI |
| `experience.md` | what playing against this actually feels like |
| `harness.md` | every assertion S21 must not break, with its numeric gates |

## The findings that shaped the design

Ordered by how much they explain, not by subsystem.

**The deliberation argues against acting.** `v19Outcome` scores a card by
replaying it on a clone and reading `v19Standing`. Measured across 1,028
rehearsals, seven of the eleven cards — `article`, `bill`, `campaign`,
`demand`, `floor`, `pact`, `platform` — price at **exactly minus their own
purse cost**, because the objective reads none of what they write. Three of
`v19Standing`'s five components moved on **zero** of those rows. So the two
upper AI levels, which are sold on working out what a card would do,
systematically advise against every card whose effect resolves later than
immediately.

**The most-played card loses the party votes.** `court` is 27.3% of everything
an engine does. `st.blocs` is read one way by `v17Utility` (a happy bloc is
good for the party that courted it) and the opposite way by `supportTargets`
(a happy bloc votes for the incumbent). Measured over 144 sweeps: the courting
party's own share falls in 84 and rises in 50, while the **ruling** party's
share rises in 133 of 144. The simulation and the ballot disagree about the
same number, and the engine spends a quarter of its life on the losing side of
that disagreement.

**Engine legislation cannot pass.** 143 engine-sponsored bills archived in 300
sessions, **zero carried**. The assent stage refuses 88.2% of them (677 of 768)
on `st.partyRel[who]` — the *player's* relationship with the office holder —
arbitrating a transaction the player is not party to.

**There is no party-to-party relationship anywhere.** `st.partyRel` is one map
keyed by party, and it means "that party's relation to the player". An
identical bill from a sworn enemy and from a close ally scores **to the same
decimal**. The only discriminating channel is the grudge, capped at 12 and
worth a measured 0.25 points.

**No engine can end a government.** `v17ConfidenceVote` and `v17Refound` have
exactly one caller each and it is the player's own action card. No card in the
deck can add or remove a coalition member. A majority government is
unremovable between ballots.

**The one aim that names an enemy is satisfied by default.** `oust` requires a
grudge of 25 and asks that the hated party be *out* of government — which it
already is on 92.7% of the boards where the grudge exists, so the goal is
dropped at adoption. Measured: `fits` opens 775 times in 4,320 party-sessions
and `oust` is held 4.

**The formation has four branches and one is reachable.** `V17_FORM_MAX` is 7
and there are 7 parties, so round one asks everybody; minority,
grand-coalition and caretaker need all seven formateurs to fail at once.
`v17Invest` is only ever called when the coalition already holds a majority,
so the investiture cannot be lost where it is held. 360 of 360 formations were
`majority`; no vote has ever failed.

**The agreement can only be broken.** 40 ledger entries in 720 sessions, all
40 breaches. `V17_KEPT` needs the statute to arrive exactly at the partner's
want on the move that closes it, and the concessions are drawn from the
partner's two *largest* gaps.

**The goal table is the decision function.** Removing it changes the chosen
card on 56-67% of open sets; the entire opponent model changes it on 1.3-3.5%.
The die then discards the highest-scoring card on 33-60% of picks, with no
tie-break.

**Nothing outside the parties is an actor.** Zero AI reads of foreign powers,
treaties, sanctions, interests or movements. In 300 sessions: 5 street demands
and 0 carried, 0 strikes (peak pressure 50.2 against a bar of 58), movements
peaking at 27.3 against their own threshold of 55, and 58 of 60 interest
demands ignored **at no cost at all**.

**The court has never sat.** `v17Docket` was empty in **720 of 720** sessions
and `v17CourtTick` raised a ruling zero times. Its first arm needs a
liberties-guaranteeing article and a liberties-costing order standing at the
same moment; 9 of 81 articles qualify, all entrenched, none any party's
nearest. Forced by hand the machinery works on the first tick, so the
preconditions are the whole defect. The bench beside it is a die roll —
`courtWith` collapses sixteen justices to a count.

**Both instrument pickers are arbitrary, and neither reads the party's aim.**
`v17AiArticleFor` picks the nearest article on the compass, giving an identical
choice per party on all six seeds at turn 1 and 21 distinct articles of 81 ever
laid; its `var want = PARTY[pid].wants` is never read. `v17AiOrderFor` returns
the **first open order in source order** — 66 of 90 never signed — and hands
`REGIONS[0].id` to slots typed `target:'power'`, so 14 of 98 live signings were
proclamations against a state whose effect is silently swallowed. `charter` is
the one goal whose named target never reaches its verb.

**Three player-side gates read the wrong party, and two are exploitable.**
`v11ArtSupport` awards its +20 sponsorship bonus to `playParty` rather than the
article's actual sponsor — poisoned and confirmed, 95.01 falling to 64.01 when
repointed. `v11ConTick` docks the *player's* capital for engine failures. And
the pending panel's Withdraw button carries no owner test at all: a player can
delete any engine's article for 3 unity, and revoke any engine's order the same
way.

**The engine's actions barely reach the player.** `bill.lines` is written by
the `floor` card on 69 plays and rendered nowhere -- ten occurrences in the
file, zero renderers -- while `MAP.md` calls it "printable on the card". The
order record's `by:actor` has no reader anywhere, and the pending-article card
never names who laid it. The Parties table's posture column is stale on 25.6%
of rows, because it is written only when a party acts. Measured across 119
sessions, 5.1% of the sentences an engine emits name the player at all.

**And the tempo is zero-sum.** `v18TempoOdds` normalises a shared budget, so
the whole opposition acts 1.42 times a session however angry it is; provoking
all six parties gives byte-identical odds to provoking none, and 18.5% of
sessions contain no engine action whatever.

## Two corrections this intake forced on its own baseline

**The initiative count was 4.8x too high.** `v19Try` replays every open card on
a clone to score it, and the first probe wrapped `card.run` without checking
`V19_SIMULATING` — so 3,916 rehearsals were counted as plays. The real figure
is 1,025 in 720 sessions, and the card mix is heavily concentrated rather than
even. Any instrument touching a card's `run`, or anything a card calls, must
check that flag.

**`docs/MAP.md` still says `office` and `enter` are never reached.** Both
complete at HEAD. That claim came from S20g probes that drove `endTurn` without
overriding `runQueue`, so no election ever ran; it is corrected in
`docs/PLAN-S20.md` and the MAP line is stale.
