# S22 — What decides an election

**Status: IN PROGRESS. S22a has shipped.** The three questions this plan left
open for the owner are answered inside the slice that reaches each of them,
from a measurement rather than by preference, and each is flagged in
`docs/STATE.md` as theirs to overturn. Commissioned by the owner in
the same exchange that produced S21v, immediately after they ruled that the
chair has no bearing on election performance:

> Ask more questions about how elections swing / are decided. Since incumbency
> & mood no longer apply, something has to add some variance, and it needs to be
> something the player can pick up on and attempt to influence for their own
> party.

They then chose **all four** of the options put to them — *issues decide the
election*, *turnout differential made legible*, *regional battlegrounds*, and
*a late campaign period* — plus **restore the ±8% election-night swing and show
the range before the count**, and added:

> Regional battlegrounds should have more depth added to them rather than just
> clicking the "Target" button next to each region in the campaign tab. Regions
> have constituencies that have issues that are salient to them, for starters.

---

## What is already in the file, measured

These are the facts the programme is built on. Every one is a reading of the
shipped code, not a proposal.

### 1. The regions already carry their issues, and nothing reads them

`REGIONS` gives each of the **eight** regions three named issues —
`['Housing costs','Trade','Civil liberties']` for the Somnium Coast,
`['Agriculture','Federalism','Energy']` for the Rigel Plains, and so on:
**24 authored strings.** Grep for `.issues` outside the table and there are
**exactly two readers, both render sites**: a tag row on the region card and one
line of subtitle under the Target button. Nothing in the model consults them.

That is this file's own most-repeated defect — *a modifier nothing reads is a
lie on the card* — sitting in the very place the owner pointed at. **This is the
spine of the programme**: the issues exist, they are authored, they are printed
to the player, and they decide nothing.

### 2. Four capabilities in the vote model are player-only

S21's whole brief is that nearly every capability in this game is player-only.
The election is no exception:

| term | site | who gets it |
|---|---|---|
| campaign `field` / `data` → turnout | `partyTurnout` | `pid === playParty(st)` |
| party `unity` → turnout | `partyTurnout` | `pid === playParty(st)` |
| organiser dots in a region | `regionPartyFactor` | `pid === me` |
| an organisation's endorsement | `endorsedTurnout` | the player's branch (S21t opens this) |

So "target a region" is a lever no engine can pull, and the player's turnout is
the only turnout the campaign moves. A battleground with only one side
campaigning in it is not a battleground.

### 3. The Target button is one number, three times

`S.campaign.targets[r.id]` is an integer 0–3, bought at `cst(2)` capital plus
money, worth `.019` of a region's factor per dot, halved at each ballot. There
is no choice in it beyond *where* and *how many* — nothing about what you are
saying there, and no way for the region to want something you are not offering.

### 4. The election-night swing is back but the panel is still a point

S21s restored `ballot(st, true)`'s ±8% per-party swing — it was authored in S16
and eaten by a wrapper, so every election returned exactly the projection for
five program-years. `projection()` deliberately asks with `false`, so the panel a
player reads before the ballot is what the numbers say. The owner asked for the
**range** as well as the point, and that is the one piece of their swing ruling
still to build.

### 5. The chair WAS the concentration, and nothing chair-blind replaces it

This is the measurement that makes this programme necessary rather than nice to
have. Largest party's seat share over **720 driven sessions on twelve seeds**:

| build | easy p50 | easy p99 | easy >50% | normal p50 |
|---|---|---|---|---|
| before S21v | **0.448** | 0.603 | 8.9% | 0.316 |
| minus the flat incumbency only | 0.422 | 0.598 | 7.5% | 0.316 |
| minus the appeal curves only | **0.269** | 0.330 | 0.0% | 0.235 |
| S21v (both gone) | 0.247 | 0.283 | 0.0% | 0.235 |

**The appeal curves were the concentration, and they were the chair.** The flat
incumbency was worth almost nothing to the shape of the chamber (0.448 → 0.422);
the curves were worth nearly all of it (0.448 → 0.269). And they concentrated
*because* they differed between parties by chair — 1.54 for the government
against 0.40 for the opposition at a bloc mood of 100.

**No chair-blind curve brings it back, and this was tested rather than assumed.**
Two variants were built and driven over the same 720 sessions — one mood curve
applied identically to every party at `.86 + (m-50)/100`, and the government's
own curve `.915 + (m-50)/80` applied to everyone. Both read a largest-party p50
of **0.24**, the same as the flat model. A curve every party shares largely
cancels in the normalisation; only a curve that *differs between parties* spreads
them, and the only such curve the model had read the chair.

So the ruling, taken literally, necessarily produces a flatter chamber: with
seven parties an even split is 0.143, and the largest party now sits at 1.7× that
where it sat at 3.1× on easy. Nothing is broken — coalitions still form at a mean
size of 3.02, governments still fall, and the arithmetic of the House is
unchanged — but **no party wins outright any more, on any tier.**

That is precisely what the owner anticipated when they ruled: *"since incumbency
& mood no longer apply, something has to add some variance, and it needs to be
something the player can pick up on and attempt to influence for their own
party."* This programme is that something. It is not decoration on top of S21v;
it is the other half of it.

### 6. And the flatter chamber has one knock-on already measured

`capitalIncome` pays +1.4 for an outright majority, so on the `easy` tier that
term now never fires: over 240 driven sessions a single party held more than half
the house on 15.0% before S21v and 0.0% after, and the tier's capital income went
max 103.5 → 86.9 → 80.7 across the three builds. Recorded, not retuned — moving
`capFloor` is a balance decision on the owner's own tier.

### 7. Removing the chair made the model quieter in other ways too

S21v's own measurements, recorded here because they are the baseline S22 moves
against: the gap between what a government holds and what the country would give
it tightened from p10 −5.1/p90 +5.5 to p10 −3.2/p90 +1.1; minority formations
halved (23 → 11 per 1,600 sessions) while caretakers rose (3 → 14); and three
per-ballot rates — the drift sentence, the night's grudge, the leaders replaced
— went .383/.574/.356 to .245/.418/.179. Fewer seats move now. **That is the
space this programme is for**: what replaces the chair as the thing that makes an
election move has to be something a player did, and something they can see.

---

## The programme

**Six slices. The first is S21's one unpaid debt** — the party dossier
`PLAN-S21.md` allocated across three slices and none of them built — which is
here rather than in S21 because S21 is closed and the surface is a slice rather
than a paragraph. The campaign programme the owner commissioned is the other
five, renumbered by one so the sequence reads straight.

### S22a — A party has a record you can read

`a.why` is one slot per party, overwritten the next time that party acts, and
`v16AiTurn` posts three lines a session under a comment saying *"the rest is on
the Parties page"*. Measured over 720 driven sessions on twelve seeds: 1,161
initiatives, 4.1% of them recoverable afterwards. `v22Emit` files every one, the
Parties card prints the record, and the verbs are covered from the deck.

Five slices. Each is independently shippable and each is measured the way S21's
were: a driven distribution first, a threshold read off it second, and a poison
per changed line.

### S22b — An issue is a thing the model has

**The channel first, because a book of cards about something the model has no
channel to is a book of decoration.** One table: every issue named in `REGIONS`
maps to what the game already tracks — an indicator (`ind.economy`,
`ind.poverty`, `ind.liberties`, `ind.safety`…), a bloc, or a statute book. An
issue's **standing** for a party is read from that party's own record: the
statutes it carried, the positions it has declared, the offices it holds. No new
authored numbers where an existing reading will do.

Then `regionPartyFactor` weights each region's own three issues, so the Rigel
Plains asks about Agriculture, Federalism and Energy and the Somnium Coast does
not. The coverage is a check, not a memory: **every string in `REGIONS[].issues`
must resolve in the table or `roads.js` fails** — the guard `V17_MEMORY` has and
a hand-kept list can never have.

*Open for the owner:* whether an issue's weight in a region is uniform across
its three, or ranked.

### S22c — Turnout is everybody's, and it is legible

Take the `pid === playParty(st)` branch off `partyTurnout` so every party's
organisation, unity and endorsements reach the count — which is the S21 brief
applied to the one system that decides who governs. Then **print it**: the
projection panel shows each party's turnout multiplier against the field, in the
units `V15_TURNOUT_SPAN` already defines, so a player can see that they are
polling level and being out-voted.

*Open for the owner:* engines currently have no `campaign` state at all. Either
they get one (a purse-priced field operation, which S21j's courting already
prices) or their turnout reads only from factions and endorsements. The first is
more work and a fairer election; the second is a smaller slice.

### S22d — A battleground is a choice, not a dot

The Target button becomes: **choose a region, and choose which of its three
issues you are running on there.** A region rewards a party that runs on an
issue it cares about *and* has a record on — S22a's standing — and punishes one
that runs on an issue it is on the wrong side of. Engines get the same lever
through the deck, gated on `v19Thinks` per R2, so a battleground has two sides.

The measurement that has to come first: **what the spread of regional factors
actually is in play**, so the reward for winning a battleground is set against a
distribution rather than picked by eye. S17q's bar sat above its own ceiling;
S21v's `V21_GOV_GAP` was set at a quartile that moved. This one gets its
distribution printed in the assertion's own words.

### S22e — The late campaign

A window of the last N sessions before a ballot in which the campaign is what
the session is about: channels cost less or count more, the papers turn to the
contest, and the projection updates every session rather than once. **N is
counted, not picked** — `roads.js` already fails any clock whose card prints a
different number of End Session clicks than it charges, and the instrument the
answer has to use decides the deadline.

*Open for the owner:* whether the late campaign suspends ordinary business (a
dissolution, which is what really happens) or runs alongside it.

### S22f — The range before the count

The projection panel shows a **band** rather than a point: `ballot(st, true)`
sampled enough times to give the shape of the night, printed as the range each
party could land in. The point estimate stays — it is what the numbers say — and
the band is what the night could do to it. This is the smallest slice of the
five and it depends only on S21s.

---

## What this programme deliberately does not do

- **It does not put the chair back.** The owner's ruling stands: whether a party
  leads the government, sits in the coalition or sits opposite has no bearing on
  election performance. Every term proposed here is something a party *did*, not
  a chair it sat in.
- **It does not pick a variance number.** The ±8% is authored and restored; what
  the issues, the turnout and the battlegrounds add is *differentiated* variance
  — a player who is losing can see which region and which issue is doing it.
- **It leaves the negative incumbency open.** The owner's own observation, that
  governing parties do worse at the ballot in real democracies, is recorded in
  `docs/STATE.md` as theirs to call. If they take it, it comes back as a live
  field with a live reader — never as a tier constant nothing reads.
