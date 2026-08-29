# The conflict table — for the owner's ruling

**Ruling 11 (2026-08-27):** *"Exclusivity: mixed semantics, table for sign-off.
Draft the full conflict table with a proposed semantic per pair — some BLOCK
(can't lay X while Y stands), some SUPERSEDE (adopting X repeals Y, stated on
the card, at a price). The owner approves/amends the table before it is
wired."*

This file is that table. It is written from the cards' own printed text, not
from memory: every quotation below is the `text:` field of the card in
`vale.html`.

---

## What s17m shipped without waiting

Eleven pairs, all **BLOCK**, because in each one **the printed text of one card
is false while the other stands**. That is a question of correctness, not of
balance, and it is the same defect as ruling 12's "a card that lies" — so it
did not seem to need a ruling to fix. Amend or reverse any of them and it comes
straight back out.

They all take the conservative semantic. **Nothing is ever repealed for you.**
Adopting the second is refused, and the refusal names the article you would
have to repeal first — which is a road the constitution already has.

| # | A | B | Why one makes the other false |
|---|---|---|---|
| 1 | Indissoluble Union | Right to Depart | "The union is perpetual. No state may leave it" vs "may leave the union in peace". **Carried together their autonomy modifiers ADD: 6 + 14 = 20** — forbidding and guaranteeing secession produced more separatism than either alone. |
| 2 | Universal Franchise | Weighted Roll | "to no property, office or register" vs "shall be weighed by the assessment". |
| 3 | No Property Test | Weighted Roll | "No test of property… shall be required" vs a roll weighed by one. |
| 4 | Bicameral Assent | Abolition of the Upper House | "the assent of both houses" vs "There shall be one house". |
| 5 | Abolition of the Upper House | Elected Senate | "There shall be one house" vs "senators… returned by the states". **Made live by this same PR**: the Elected Senate now seats the house, so carrying it after abolition would raise the abolished chamber. |
| 6 | Fixed Bench | Wider Bench | "nine justices, and the number shall not be altered" vs "shall be enlarged". The Fixed Bench is entrenched; enlarging is what it exists to forbid. |
| 7 | Standing Emergency | Emergency Limit | "shall stand until the executive revokes it" vs "expires at the end of six months". |
| 8 | Quadrennial | Annual Assembly | "every fourth year, **and not before**" vs "every year". **Their term modifiers AVERAGED** (+2 −1), so the country went to the polls every third year under two articles that named neither. |
| 9 | Martial Bar | Armed Forces Bar | The same rule in two sets of words — "The armed forces shall not be employed against the people of Vale" — carried twice, and the emergency reach taken off twice for it. |
| 10 | Universal Franchise | **Act** to Weight the Franchise by Property | An ordinary act, needing half the Assembly, silently reversed an **entrenched** article carried at a referendum. The article's record stayed on the constitution page while the flag it set was turned back over. |
| 11 | No Property Test | **Act** to Weight the Franchise by Property | The act is a test of property; the article forbids one. |

10 and 11 are the cross-kind cases, and they are the sharpest in the set.

## What S18d added, on the same footing

Six more, all **BLOCK**, and all of them mechanical rather than a matter of
taste. Four were driven and found still co-adoptable by the audit in
`docs/AUDIT-S17.md`; two reach the statute book, which is the book your
sentence named first and the one the table had never touched.

| # | A | B | Why one makes the other false |
|---|---|---|---|
| 12 | Fixed Bench | Constitutional Bench | Proposed below as SUPERSEDE and shipped as BLOCK, because BLOCK is what the code has. Measured, the pair took the court to thirteen with the Fixed Bench standing. |
| 13 | State of Siege | Habeas | Proposed below. "Held without charge under a state of siege" against "produced before a judge within the day". One of the two is the law. |
| 14 | Judicial Review | Withdrawn Jurisdiction | Proposed below. A court whose word binds every officer cannot be a court the Assembly may put a matter beyond. |
| 15 | Judicial Review | **Act** to Strip the Court of Jurisdiction | The same, cross-kind, and the same shape as 10. |
| 16 | Universal Franchise *(entrenched)* | **Statute:** Property Qualification | The identical rule as the Act in row 10, written as a statute: priced at 12, needing nothing but a majority. An entrenched article carried at a referendum stood on the page while a statute weighed the roll under it. |
| 17 | No Property Test | **Statute:** Property Qualification | The statute is a test of property, printed as a floor on the roll. The article forbids one. |

**Rows 12, 13 and 14 were sitting under "waits on your ruling" below and ship
as BLOCK anyway.** Each is a printed contradiction rather than a balance
question, and leaving them unwired left the absurdities the audit measured
reachable in ordinary play. Reverse any of them and it comes straight back
out; row 12 becomes SUPERSEDE the moment you approve that semantic, which is
still unwritten for the reason given below.

Rows 16 and 17 are the first pairs in the table naming a **statute**. That
cost one branch in the primitive and one call site in `v18DraftWhy`. Branches
for a measure, an order and a treaty were written in the same slice and taken
back out: no pair named one, so a poison run removed all three and reddened
nothing, and a knob nothing in the game can turn is decoration. Approve a pair
naming one and the branch arrives with it -- and the assertion now fails if a
pair ever names a kind the primitive cannot answer, so it cannot be forgotten.

---

## What waits on your ruling

Each row has a proposed semantic. **Say yes, say no, or say the other thing** —
whatever you write here is what gets wired.

### Probably BLOCK

| A | B | The two texts | Proposal |
|---|---|---|---|
| Judicial Review *(entrenched)* | Withdrawn Jurisdiction | "its word binds every officer of the state" / "The Assembly may withdraw any matter from the cognisance of the court" | **BLOCK.** As direct as any above — but it is also the constitutional fight a republic actually has, and blocking it closes a road the game currently offers. Your call, which is why it is here and not in the eleven. |
| Judicial Review *(entrenched)* | **Act** to Strip the Court of Jurisdiction | same, cross-kind | **BLOCK**, if the row above blocks. Same reasoning; note the act reverses an entrenched article exactly the way the franchise act did. |
| State of Siege | Emergency Limit *(entrenched)* | "the executive may govern by decree, and shall say when the danger has passed" / "expires at the end of six months unless the Assembly renews it" | **BLOCK.** Who says when it ends is the whole question, and they answer it differently. |
| Elected Bench | Fixed Bench *(entrenched)* | "chosen by the electors of Vale" / "shall consist of nine justices, and the number shall not be altered by a government in office" | **COMPATIBLE, probably.** One is how justices arrive, the other is how many. Listed because the three appointment articles stack in ways that measured oddly (see below). |

### Probably SUPERSEDE — and the reason the primitive does not do this yet

| A | B | Proposal |
|---|---|---|
| Fixed Bench | Constitutional Bench | Both are entrenched; both are about the size of the court. Measured, the three bench articles stack to **16 → 9 → 13 → 17** with the Fixed Bench still standing. **SUPERSEDE**: adopting one repeals the other, at a price, stated on the card. |
| Standing Emergency | Habeas *(entrenched)* | Habeas says "the emergency does not suspend it"; the Standing Emergency never ends. Together they net **emergency +3** where the emergency book's whole point is that an unlimited emergency and an inviolable habeas are opposites. **SUPERSEDE** or **BLOCK**. |
| State of Siege | Habeas *(entrenched)* | Same shape. The four emergency articles together nets **+5** — more authoritarian than having no constitution at all. |

**s17m ships BLOCK only, and the code has no `supersede` mode in it.** A mode
with no user is a field nothing reads, which is the defect this repository
punishes hardest — so it is not written until there is a pair to write it for.
Approve any row above as SUPERSEDE and it arrives with its price on the card.

### Checked and cleared — not conflicts

Listed so you know they were looked at rather than missed.

| A | B | Why they can stand together |
|---|---|---|
| Residual Powers *(entrenched)* | Supremacy | Two halves of an ordinary federal constitution: what is not given stays with the states, and what IS given prevails. Real constitutions carry both. Their autonomy modifiers (−12, +10) nearly cancel, which is roughly right. |
| Convention Clause | Convention Bar | One summons a convention, the other limits what it may sit upon. Enable and constrain, not contradict. |
| Fixed Term | No Confidence | A fixed-term parliament that can still be brought down by the house is a real and common arrangement. One bars *dissolution by the government*; the other allows *removal by the chamber*. |
| Quadrennial | Fixed Term | The length of a term and whether it can be cut short are different questions. |
| Term Limit *(entrenched)* | Recall | How long you may serve, and whether you can be removed early. |
| Entrenchment *(entrenched)* | No Same Session | Two procedural bars that compound. Intentional. |
| Compulsory Vote | Secret Ballot *(entrenched)* | Voting can be a duty and the choice still be nobody's business. |
| Codification | Preamble | Both are about what the document contains. |
| Abolition of the Upper House | Money Bills | "amended in the Assembly alone" is vacuous with one house, but not false. |
| Abolition of the Upper House | Reserved Seats | Reserved seats are in the Assembly. |
| Withdrawn Jurisdiction | Advisory Opinion | Asking the court in advance and removing matters from it afterwards are compatible, if unlovely. |
| Indissoluble Union *(entrenched)* | State Guard | A guard under the governor is not a right to leave. Their autonomy modifiers (+6, −8) roughly cancel. |
| Universal Franchise *(entrenched)* | Regional Weighting | Who may vote and how the returns are counted by state. |

---

## What the primitive is, so you know what approving costs

`V17_CONFLICTS` in `vale.html` is one central array of pairs. It is **symmetric
by construction** — a pair is declared once and indexed both ways — which is a
deliberate departure from the plan's per-card `conflicts:` field: a block
declared on one card and forgotten on the other is a one-way door, and this
file's history is a long list of exactly that mistake. The cards still print
it, because `v17ConflictsOf` reads the same array.

Adding a row is one line. `v17ConflictWhy(st, kind, id)` is called from
`v11CanPropose` (articles), `doAct` (acts) and `v18DraftWhy` (statutes), and
`roads.js` asserts that every declared id names a real card and that every
pair refuses **in both directions**.

S18d added three more things it asks, because the first version of the table
could be got round in three ways. **The document is checked at the moment it
changes**, not only at lay time: the constitution page invites three articles
at a time, so a player laid both of a pair in one session and both carried,
and the term article printed the three-year assembly you complained about with
the table installed. **The start editor is held to the same table**: it
checked article ids against the registry and nothing else, so every absurdity
here was reachable on turn one without laying a paper. And **a struck article
is out of the document**: the court wrote a flag one function read, so it went
on printing as in force, went on blocking its partner and kept the justices it
had seated.
