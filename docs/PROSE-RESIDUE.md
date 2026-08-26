# Ladder residue: the statutes whose rungs two blind readers still mis-order

This file exists because the list it carries used to live in
`tools/out/rungs/sweep-repair.json`, and `tools/out/` is gitignored. The S13b
close in `docs/STATE.md` pointed whoever picked the work up at a path that does
not survive a clone. The names are recorded here instead.

## What "resists" means

The measurement is the blind ladder sweep described in `tools/prose/README.md`.
A reader is given a statute's four rung descriptions in shuffled order, with no
level labels and no access to the numbers, and asked to put them back in
ascending order of how far the statute goes. A ladder is **exact** when all four
land in the authored positions. A ladder is on this list when **every** reader
in that round failed it.

A name here is not a verdict that the prose is bad. It means the four rungs did
not read as an ordered sequence to someone who could not see the labels. The
usual cause is two adjacent rungs that are genuinely close in severity, which is
a property of the statute, not of the sentence.

## The 62 from the S13b round-3 sweep (readers C and D, fresh shuffles)

Round 3 scored 92.3 / 91.5 per cent placements and 85.4 / 84.4 per cent exact
over all 582 statutes. These 62 (10.7 per cent) were failed by both readers.

| book | residue | statutes |
|---|---|---|
| Authority | 3/24 | `digitalID`, `partyMilitia`, `passportControl` |
| Capital | 4/24 | `arbitrationMandate`, `bankingSeparation`, `deregulation`, `goldenShares` |
| Culture | 4/24 | `drugLegalisation`, `flagAndAnthem`, `nationalLanguage`, `religiousExemptions` |
| Defence | 2/24 | `mobilisationPowers`, `veteransPreference` |
| Education | 3/24 | `civicsCurriculum`, `curriculumTransparency`, `universityAutonomy` |
| Elections | 1/24 | `foreignDonationBan` |
| Empire | 2/24 | `settlerProgramme`, `treatyPorts` |
| Energy | 1/24 | `oilAndGas` |
| Environment | 2/24 | `predatorControl`, `wildlifeProtection` |
| Federalism | 3/24 | `localReferendums`, `regionalDevelopment`, `stateRevenueSharing` |
| Foreign | 2/24 | `peacekeeping`, `sanctionsRegime` |
| Health | 1/24 | `nationalPatientRecord` |
| Immigration | 3/24 | `investorVisas`, `naturalisationReform`, `sanctuaryPolicy` |
| Imperium | 3/39 | `imperialArchive`, `imperialRoads`, `lawOfMajesty` |
| Infrastructure | 3/24 | `armyEngineers`, `portsAndLocks`, `waterSystems` |
| Justice | 4/24 | `juryReformAct`, `policeFunding`, `prisonExpansion`, `privacyLaw` |
| Labour | 2/24 | `hiringHalls`, `workplaceSafety` |
| People's State | 4/43 | `cadreRotation`, `exitControls`, `massCampaigns`, `tradeMonopoly` |
| Security | 3/24 | `portSecurity`, `predictivePolicing`, `securitySunset` |
| Taxation | 7/24 | `debtCeiling`, `digitalServicesTax`, `excessProfitsLevy`, `salesTax`, `sourceWithholding`, `taxAmnesty`, `territorialTax` |
| The Charter | 3/20 | `companyMedicine`, `pensionRaids`, `sumptuaryPass` |
| Welfare | 2/24 | `basicIncome`, `jobGuarantee` |

Technology is the one book of the twenty-three with no residue at all.
Taxation's seven is the worst, and it is the book where the ladder is a rate:
two adjacent rates read as the same statute to someone shown no numbers.

## The earlier residues, from the S12 batches

Both were named in `docs/STATE.md` at the time and are repeated here so the
whole set is in one tracked place.

**S12 batch 3** (Culture, Immigration, Justice, Security), nine of forty:
`counterterrorism`, `fusionCentres`, `guestWorkers`, `juryReformAct`,
`multilingualServices`, `prisonLabour`, `privateContractors`,
`speechAbsolutism`, `truthAndAmnesty`.

**S12 batch 6** (Empire, Imperium, People's State, The Charter), four of forty:
`honours`, `imperialGuilds`, `shockWork`, `wardsOfTheCapital`.

**`juryReformAct` is on the batch-3 list and on the round-3 list.** It is the
only statute in the book that has resisted two independent repair passes with
different readers each time. Anyone opening this file for one name should open
that one.

## Why a second repair round was not run on the 62

Declined on reasoning, recorded in `docs/STATE.md` at the S13b entry. The
marginal ladder here is one where two rungs are close in severity on purpose.
Forcing a gap to satisfy the reader risks the failure that matters more: prose
that reads in order and describes nothing. A repair round would also be
unmeasurable, because any score taken afterwards would be in-sample by
construction, which is the exact error corrected in PR #40 and now written into
`tools/prose/README.md`.

## Reproducing the list

The `tools/out/` tree does not survive a clone, so the measurement has to be
re-run rather than re-read:

```
TAG=sweep2 node tools/prose/sweep.js          # emits the shuffled ladders + key
# dispatch two blind readers over the chunk files, each writing sweepX-N.json parts
TAG=sweep2 node tools/prose/sweepscore.js sweepC sweepD
```

`TAG` is the file prefix and defaults to `sweep`; both tools have to be given
the same one or the scorer joins the answers against a different shuffle.

`sweepscore.js` prints the per-reader scores and writes the both-fail list back
to `tools/out/rungs/sweep-repair.json`. A fresh sweep will not reproduce these
62 exactly: the shuffle is new and the readers are new, so the marginal ladders
move. The stable finding is the rate, around ten per cent, and the books that
carry it.

## The punctuation residue (S15k)

A second measurement, of a different thing. `node tools/rungs.js --corpora`
holds the three registries S15 wrote into — the 60 extraordinary measures, the
90 standing orders and the 80 constitutional articles, **548 authored pieces**
across 230 distinct names — to the same house style the statute book is held to,
and **fails** on a breach. It found three on the build it was written against:
a curly apostrophe in `compartmentOrder` and an em dash apiece in
`clemencyDocket` and `orderRegister`. All three are fixed.

The same run then **reports, and never fails on**, what is left in the rest of
the file. Rewriting somebody else's corpus on a checker's say-so is the move
this repo does not make, and `CLAUDE.md` is explicit that the 2,910 audited
pieces stay as they are.

| class | count | is it a style question? |
|---|---|---|
| in a comment, on no screen | 27 lines | no |
| a glyph standing for "none" (`'—'` in a table cell) | 6 | no, that is typography |
| a range or a separator (`3.1–4.4`) | 9 | no |
| **an em dash inside a sentence** | **32 lines** | **the owner's call** |

**Twenty-two of the thirty-two are Question Time**, authored in S10f/g — before
S13 carried the owner's writing skill into the repo verbatim. The rest are four
setup-sheet lines, one order-book note, one log line with a curly apostrophe
(`v10OrderTitle`), one chart title, one work blurb, and the S11c federation
panel. **None of them is S15's.** Measured across all ten S15 PRs: two em dashes
were added in total, one in a code comment and one in the Grand Works panel note,
and the second is fixed in this PR.

The list is reproduced by the tool rather than kept here by hand, so it cannot
rot: `node tools/rungs.js --corpora` prints the count and the first six lines
every time it runs.
