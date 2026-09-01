# legislative — how engines behave in the chamber

## What it does today

A bill's fate is one number per party: `partyBillSupport(st, pid, bill)` (line
9020) plus `billPull(st, bill, pid, house)` (9133), fed into `divisionOf` (9203),
which walks the house seat by seat and returns an aye share. An engine party has
exactly one instrument in that chamber — the deck's `floor` card (34496), which
calls `v17FloorCore` (38305) to write `bill.lines[pid] = 'support'|'oppose'` on
**somebody else's** bill, once per four sessions, for 12 of its purse. It can
also lay a bill (`bill` card, 34529; `aiGovern`, 13556; `pv5AiPrivateBill`,
16231). Everything else the chamber contains — the whip, the Senate bargain,
amendments, confidence, urgent procedure, obstruction, killing a bill, pressing
an office, and all six S20b press-home verbs — lives in `billAction` (9746),
which reads the global `S` and `playParty(S)` and is wired only to a click
(15623). It has no engine caller.

## How the figures below were measured

Three seeds × 100 sessions, `epic`, difficulty `normal`, `aiLevel:'ruthless'`,
player passive. Driver overrides `runQueue` per CLAUDE.md. Probe:
`scratchpad/legmeas.js`. It decomposes `partyBillSupport` and `billPull` term by
term at **every real division inside `advanceBills`** — 22,932 (party, bill,
house) readings — and asserts on every single one that `clamp(sum, 3, 98)`
equals what the live function returned. **Mismatches: 0.** A decomposition that
does not reproduce the function is a probe measuring itself; this one
reproduces it exactly. A second probe (`scratchpad/sponsorswap.js`) swaps the
sponsor of one identical bill across all seven parties and reads the vote
deterministically.

---

## Findings

### 1. Ideology is 71% of the vote and everything else is noise — [shallow]

- **What:** ranked by mean absolute contribution over 22,932 divisions:

| rank | term | line | worth when it fires | fires | mean abs |
|---|---|---|---|---|---|
| 1 | ideology `72 − dist2(pos, target)·42` | 9021–9023 | observed −14.2 … +70.6 | 100% | **43.21** |
| 2 | `partyRel[pid]` — relation to the **PLAYER** ×.22 | 9032 | −11 … +6.1 | 100% | 4.98 |
| 3 | `negotiated` bonus (in `billPull`) | 9169–9172 | +5 lower / +11 upper (+4) | 52–62% | 4.59 |
| 4 | sponsor bonus | 9025 | +19 | 14% | 2.71 |
| 5 | coalition member + ruling party's bill | 9026 | +12 | 20% | 2.38 |
| 6 | its own manifesto (`V19_MANIFESTO`, 750) | 9058–9064 | ±15 | 8% | 1.23 |
| 7 | issue heat | 9136, 9143 | ±5 lower / ±2.25 upper | 100% | 0.69 |
| 8 | faction average ×.12 | 9035 | −1.2 … +1.8 | 100% | 0.70 |
| 9 | direction mood | 9138–9144 | small | 100% | 0.26 |
| 10 | grudge against the sponsor (`V17_GRUDGE_VOTE` 12, at 38525) | 9073–9075 | 0 … −11.8 | 0–17% | 0.25 |
| 11 | a declared line | 9051 | +16 / −18 | 1–2% | 0.24 |
| — | `playerPosition` +24/−28 | 9048–9050 | | **0%** | 0 |
| — | `cordon` −8 | 9033 | | **0%** | 0 |
| — | `coopted` +6 | 9034 | | **0%** | 0 |
| — | ruling backs the player's bill +8 | 9031 | | **0%** | 0 |
| — | whip / floorWork / `pull` / confidence / upperDeal / urgent / doctrine | 9154–9179 | | **0%** | 0 |

  Ideology is **43.21 of a 61.24-point total absolute budget — 70.6%**. The
  next largest term is the party's relation to the *player*, which has nothing
  to do with the bill. The terms that can distinguish one bill from another in
  a party-specific way — sponsor, coalition, manifesto, grudge, line — sum to
  **6.81, eleven per cent of the number.**
- **Evidence:** `partyBillSupport` 9020–9078; `billPull` 9133–9190; measured
  decomposition, 0 mismatches in 22,932 samples.
- **Why it matters:** a party's vote is its position on a 2-D map, computed
  once. It is not a decision, it is a lookup. Nothing a party *is doing* — its
  posture, its goal, its temperament, its rival — appears anywhere in the
  calculation (`v16Posture` readers: 16371, 34432, 35452, 37423 — none in the
  vote path; `v19Goal` readers: 34901, 35467 — same).
- **Upgrade:** give the vote a second axis the engine controls. The cheapest
  real one: a per-party **stance ledger** on a bill that a party writes when it
  acts and re-reads when it votes, so the same bill can be worth different
  things to two parties at the same distance.

### 2. An engine never negotiates over a bill — [missing]

- **What:** there is no path by which an engine party amends a bill, offers to
  back it in exchange for anything, trades a vote, abstains as a choice, or
  answers an offer. The three verbs it has are `support`, `oppose`, `pressure`
  (`v17FloorWhy` 38196), and all three are unilateral declarations.
  - **Amend:** `amend` and `amendIt` are `billAction` branches (9820, 9847).
    `b.concessions`, `b.upperDeal`, `b.whip` have no engine writer.
  - **Trade a vote:** nothing writes `bill.lines[pid]` in exchange for anything.
    `v17FloorCore` takes a verb and a bill, never a counterparty term.
  - **Abstain:** the word does not exist in the bill path. `divisionOf` (9231)
    returns `noes = seatsTotal − ayes` — every seat is aye or no by
    construction. Abstention exists only in the *investiture* vote (37566–37574)
    and the confidence motion (37742–37754), never in a division on a statute.
  - **The one thing that looks like negotiation is not.** `cross_party` (emitted
    at 10305–10310 by the largest non-player party, every time, from
    `partyDemandPolicy`) says "there may be a majority for a narrower text if
    the government will share authorship and accept amendments." Accepting it
    (10112) sponsors a **new** bill in the *player's* name with
    `strategy:'negotiated'`, and pays the offering party +10 relation. The
    offering party takes on **no obligation**: `negotiated` is worth +5/+11 to
    *every* non-sponsor equally (9169), including parties that never wrote.
    The letter is never about a bill that exists.
- **Evidence:** greps run — `v17FloorCore(` → 9826, 9843, 34502, 38306 only;
  `v20PressCore(` → 9828, 38277 only; `billAction` callers → 15623, 18444,
  24314 only; `abstain` → 12714, 19435/19436, 37566–37574, 37742–37754 (none in
  `divisionOf`).
- **Why it matters:** a player watching the chamber sees six parties that state
  a position and then sit still. Nobody ever comes to the table.
- **Upgrade:** one `v17BargainCore(st, actor, bill, ask)` alongside
  `v17FloorCore`, taking the same actor argument, that lets a party offer its
  line for a named concession — a statute it wants moved, an office, an end to a
  cordon — and posts an inbox paper when the counterparty is the player.

### 3. An identical bill from a rival and from a friend is scored to the same decimal — [missing]

- **What:** one bill, one voter, the sponsor swapped across all seven parties.
  Every voter returns **the identical number for every sponsor**, with exactly
  two exceptions: the sponsor's own +19, and +12 to coalition members when the
  sponsor is the party leading the government.

| voter | sponsor rsf | lp (ruling) | sd | fp | cup | tvc | pnl |
|---|---|---|---|---|---|---|---|
| sd (partner) | 57.53 | **69.53** | — | 57.53 | 57.53 | 57.53 | 57.53 |
| fp (opposition) | 36.15 | 36.15 | 36.15 | — | 36.15 | 36.15 | 36.15 |
| cup | 18.32 | 18.32 | 18.32 | 18.32 | — | 18.32 | 18.32 |

  With a grudge of 100 planted from `sd` against `rsf`, `sd`'s score for the rsf
  bill falls 57.53 → 45.53 (exactly −12, the `V17_GRUDGE_VOTE` clamp) and its
  score for the lp bill is **unchanged at 69.53**. That is the only channel in
  the file by which one sponsor is told from another, and in play it is worth a
  mean of **0.25 points** (measured, above).
- **Evidence:** `b.sponsor` readers in the vote: 9025, 9026, 9031, 9033, 9058,
  9073–9074, 9169 — that is the complete list. `st.partyRel` is a **single map
  keyed by party** (8626–8631), i.e. every party's relation *to the player*;
  there is no party-to-party relation anywhere. `sponsorswap.js` output.
- **Why it matters:** the game has rivalry (`v19Rival`), grudges, pacts and
  coalitions, and none of them reaches the one place where parties act on each
  other in public.
- **Upgrade:** a symmetric party-to-party relation matrix read at 9032 in place
  of the player-centric scalar, seeded from `dist2` and moved by the same events
  that already call `shiftPartyRel`. Declare the pair once and index it both
  ways (S17m's ruling), so it cannot become a one-way door.

### 4. A coalition partner and an opposition party vote identically on any bill the government did not lay — [shallow]

- **What:** mean support of coalition parties vs non-coalition parties on the
  same division, sponsor excluded, three seeds:

| | government's own bill | anybody else's bill |
|---|---|---|
| coalition mean | 61.1 / 61.0 / 62.1 | 41.2 / 39.8 / 42.0 |
| opposition mean | 48.3 / 49.0 / 42.9 | 41.7 / 39.7 / 38.1 |
| **gap** | **+12.7 / +12.0 / +19.2** | **−0.5 / 0.0 / +3.8** |

  n = 1,634 divisions. The gap on a government bill is the +12 at line 9026 and
  nothing else. On every other bill, being in the cabinet is worth about a point.
- **Evidence:** line 9026 is gated `bill.sponsor === st.ruling`; the confidence
  term (9168) and the whip (9154) are the only other coalition-scoped terms and
  both measured 0% because they have no engine writer.
- **Why it matters:** coalition membership is a fact about the state, not a
  relationship anybody has to keep — the same conclusion `docs/S21-BASELINE.md`
  reaches from the other end (3 coalition changes between elections in 720
  sessions).
- **Upgrade:** make partnership cost something on the floor. A partner that
  votes against the government's business should draw on the agreement ledger
  `v17Ledger` already maintains, and a government that wants the vote should
  have to spend on it.

### 5. Nobody ever changes their mind between stages — [shallow]

- **What:** support **is** re-read at every stage. `advanceBills` calls
  `billForecast(st, bill)` fresh at the top of each loop iteration (9672), and
  `billPace` (9649) can run two stages in a session. Nothing is frozen at
  introduction. But nothing stage-dependent enters the calculation:
  `partyBillSupport` takes no stage argument at all, and `billPull` takes only
  `house`. The only per-stage difference is `f.committee`'s salience blend
  (9256) and the lower/upper split.

  Measured per (bill, party, **house**) series across two seeds — 1,680 series
  with two or more divisions: **20 and 36 (2.6% and 4.0%) moved by more than 5
  points over the bill's whole life; 8 and 30 (1.0% and 3.3%) ever crossed the
  50 line.** Largest swing seen: 30 points.

  *(The same count keyed on (bill, party) without the house gave 33% moved and
  5% crossed. That figure is wrong for this question — it was reading the
  lower-house number against the upper-house number for the same bill, not a
  party changing over time. The per-house figures above are the ones to quote.)*
- **Evidence:** `advanceBills` 9652–9744; `billForecast` at 9672 inside the
  `while`; `b.lines[pid]` has exactly two writers (38321, 38328) and there is no
  `delete b.lines` anywhere — a declared line is permanent for the life of the
  bill.
- **Why it matters:** the committee → assembly → senate ladder is three rolls of
  the same die. There is no second reading in any sense the player can see.
- **Upgrade:** let a stage change the answer. A party that lost the committee
  division should be able to revise its line for the floor; the concessions the
  bill has picked up (`b.concessions`, already counted) should be readable by
  the parties that asked for them.

### 6. An engine's entire chamber vocabulary is worth two points of a division — [shallow]

- **What:** 140 engine floor moves across 300 sessions, with the aye share read
  through `billDivision` immediately before and after each call:

| verb | n | mean Δ aye share (Assembly) | range |
|---|---|---|---|
| `oppose` | 126 | **−1.9** | −7.56 … −0.04 |
| `support` | 14 | **+2.1** | +0.99 … +3.70 |
| `pressure` | **0** | — | — |

  The bar is 50 and one division's noise is ±6.5 (`BILL_NOISE`, 752). For
  comparison, `docs/MAP.md` (S20b) records the player's kit as **25.2 Assembly
  points** for 16 capital. The engine has about **one twelfth** of the player's
  leverage over the same chamber, and can use it once every four sessions
  (deck cooldown, 35456).
- **Evidence:** `V16_AI_DECK` floor card 34496–34508; `V17_AI_COST_FLOOR = 12`
  at 38191; `v17FloorCore` 38305–38335.
- **Why it matters:** whatever an engine thinks of a bill, it cannot affect it.
- **Upgrade:** open the press-home scopes to an actor (see finding 8).

### 7. `pressure` is unreachable at every thinking level — [decorative]

- **What:** `v19Pivot` (38439) returns `verb = 'pressure'` only when the bill is
  already going the party's way, and then scores that move at
  `.12 · close · care · (.4 + weight)` (38470). `v17AiFloorFor` (38505) then
  requires `pivot >= V19_FLOOR_BAR` (.06, at 38434). With `close ≈ 1` and a
  seat share around .15, the bar needs `care ≥ 0.9`, i.e. the party's own
  support outside 4.5–95.5 — against a measured support distribution of p10 17,
  median 43–49, p90 74. **Measured: 0 pressure moves in 140.**
- **Evidence:** 38460–38471, 38505, 38434; measured verb split above.
- **Why it matters:** the comment at 38466 ("a bill you do not care about is a
  sponsor who owes you one") describes behaviour that cannot occur, and the
  engine→engine grudge write it carries (`v16Resent(st, sp, actor, 10)` at
  38332) therefore never fires from the deck. The verb is live only at
  `instinct`, through the non-simulating branch at 38488.
- **Upgrade:** either raise what `pressure` is worth in the pivot, or delete
  the branch and let an indifferent party spend its session elsewhere — which
  is what the code at 38496–38505 was already trying to do.

### 8. Every persuasion verb in the game is player-only, and `b.pull` has one writer — [missing]

- **What:** `bill.pull[pid]` — the field S20b added specifically so persuasion
  would be counted through a party's seats — is written in exactly one place,
  `v20PressCore` line 38287. `v20PressCore` has exactly one caller,
  `billAction` line 9828, which passes `playParty(S)` as the actor. Measured
  over 300 sessions: **`pull` writes 0, `pull` non-zero in 0 of 22,932
  divisions.** The same is true of `b.whip` (writers 9818, 9820, 9850, 9866,
  24321 — all `billAction`), `b.upperDeal`, `b.confidence`, `b.urgent`,
  `b.floorWork` (16709, the committee panel), `b.committeeWork`.
- **Evidence:** greps above; measured `pull.pressPull` meanAbs = 0 on all three
  seeds.
- **Why it matters:** `v20PressCore` was already written as a Core taking an
  `actor` (38277), exactly the S17k shape, and no engine calls it. The door is
  correct and reachable by nothing — this file's most-repeated defect, sitting
  ready to be fixed by one deck card.
- **Upgrade:** a `press` card in `V16_AI_DECK` that calls
  `v20PressCore(st, pid, bill, scope)` after the party has a line. It needs no
  new state and no new gate; `v20PressWhy` already refuses correctly for a
  non-player actor (38262 reads `b.lines[actor]`).

### 9. A party that lays a bill can do nothing whatever to carry it — [missing]

- **What:** `v17FloorWhy` refuses its own bill outright (38197: `if (b.sponsor
  === actor) return 'That is your own party's bill.'`), and `v17AiFloorFor`
  filters the live list through that same predicate (38475). Every other
  instrument is `billAction`. So an engine lays a bill (`bill` card 34529,
  measured 477 plays in 720 sessions in `docs/S21-BASELINE.md`) and then has
  literally no move available on it for the rest of its life.
- **Evidence:** 38197, 38475; `billAction` player-only.
- **Why it matters:** measured outcome — **143 opposition-sponsored bills
  archived across 300 sessions, 0 passed.** Government bills: 29 of 97 (29.9%).
  The `carry` goal, the most adopted aim in the game, routes through this card.
- **Upgrade:** open `amend` and a whip-equivalent to the sponsor of a private
  member's bill, priced from the party purse.

### 10. Engines never coordinate with each other on a bill — [missing]

- **What:** the only engine-to-engine agreement in the file is `st.aiPacts`
  (written 34459–34460 by the `pact` card, partner chosen by `v16PactPartner`
  34604). Its **only** reader in the chamber sense is the `ballot` wrapper
  (35541–35552), which pools 6% of the two parties' vote at an **election**. It
  is deleted the session after it is made (12005–12008:
  `if ((st.aiPacts[pactId].since || 0) < st.turn) delete`). Nothing in
  `partyBillSupport`, `billPull`, `divisionOf` or the deck's `floor` card reads
  it. Two parties in a pact vote on a bill exactly as two parties who have never
  spoken.
- **Evidence:** `aiPacts` grep → 11997, 12005–12007, 34459–34460, 34609, 35243,
  35544–35546. That is every occurrence in 3.7 MB.
- **Why it matters:** the player never sees a bloc form against them, and never
  has an opposition to split.
- **Upgrade:** let a pact carry a floor clause — the pact partner inherits the
  other's line on a bill at a discount — and let it survive more than one
  session.

### 11. `bill.support` is written by an event card and read by nothing — [decorative]

- **What:** event `v8senateRevolt` (22748) offers "A package of amendments for
  the senators — Capital −3. Every bill in the Senate gains support there",
  which runs `b.support = (b.support || 0) + 6`, and "Campaign against the
  Senate", which runs `b.support -= 5`. **`bill.support` has no reader
  anywhere.** Grep `\.support\b` against bills → 22751 and 22752 only, both
  writers. The card's third choice, "Let them read — Nothing changes", is
  mechanically indistinguishable from the first apart from the capital.
- **Evidence:** 22751, 22752; `billForecast`/`billDivision`/`billPull` read
  `bill.whip`, `bill.pull`, `bill.upperDeal`, `bill.floorWork`, `bill.committee`
  — never `bill.support`.
- **Why it matters:** it is `st.court.size` exactly, in the chamber, on a card
  that charges for it.
- **Upgrade:** route both choices through `billPull` — write `b.upperDeal`,
  which is already read at 9174.

### 12. `bill.committee` and `b.amended` are read-but-never-written / written-but-never-read — [decorative]

- **What:** `bill.committee` is initialised to 0 at `sponsorBill` (9282) and
  read at `billForecast` (9256: `+ (bill.committee || 0)`). Grep for a writer
  that sets it to anything else: **none**. The committee lever the field exists
  for is `b.committeeWork` (16707, 16709), read by a different wrapper (16213).
  Conversely `b.amended` is written at 9851 (`amendIt`) and read by nothing —
  that verb's real effect is carried entirely by `b.concessions`, `b.whip` and
  `b.upperDeal` on the two lines beside it.
- **Evidence:** greps `\.committee *=` → 16214, 17347, 17348 (all on the
  *forecast*, not the bill); `\.amended\b` → 9851 and two unrelated `v.amended`
  event-vehicle uses at 18797/18801.
- **Why it matters:** minor on their own; they are the shape the file punishes,
  found twice more in the bill record.
- **Upgrade:** delete both, or wire `bill.committee` to the committee panel that
  was clearly meant to write it.

### 13. Six modifiers still move the aye TOTAL after S20a moved the rest onto parties — [inconsistent]

- **What:** S20a's rule (comment at 9109–9113) is "the modifiers move parties,
  not the total". Six survive downstream, added to `f.lower`/`f.upper` after
  `divisionOf` has finished counting seats:

| line | term | scope |
|---|---|---|
| 16221 | committee expertise `×.025` | every bill (acknowledged as residue in its own comment) |
| 17347–17348 | difficulty `gentle` +10/+12/+8, `brutal` −8/−11/−5 | every bill |
| 24956 | `tribune` doctrine × public support | player's bills only |
| 24957 | `sunset` clause +2 upper | player's bills only |
| 24958 | `docileSenate` house rule +6 upper | every bill |
| 32820–32821 | the player's cabinet trait `+n·.4` / `+n·.25` | **every bill, gated on `inPower(st)`** |

  The last one is the sharp case: `v11CabinetTrait` (32731) sums the *player's*
  ministers, and the wrapper's guard is `if (!st.ministers || !inPower(st))
  return f` — a question about the **player's chair**, not about the bill. So
  while the player governs, their cabinet's competence lifts a rival opposition
  party's private member's bill by the same amount as their own.
- **Evidence:** the four live `billForecast` wrappers at 16209, 17345, 24953,
  32815, in that source order.
- **Why it matters:** these are aye shares no member voted for — the defect the
  owner reported and S20a was written to remove, surviving in six places.
- **Upgrade:** move each into `billPull` against a named party, or scope the
  cabinet one to `bill.owner === 'player'` at minimum.

### 14. `v19Pivot` reads the wrong house and the wrong bar — [inconsistent]

- **What:** `v19Pivot` (38439) compares `f.lower` against
  `v19Bar(st, bill) = BILL_BARS[bill.stage]` (38435). At `committee` that is
  `f.lower` against 43, when the number the stage is actually decided on is
  `f.committee` (9256, 9705). At `senate` it is `f.lower` against 50, when the
  division is on `f.upper` (9717). `billStageValue(f, stage)` exists at 9633 and
  does exactly this correctly; the pivot does not call it.
- **Evidence:** 38460 `Math.abs(f.lower - bar)`, 38464 `willPass = f.lower >= bar`;
  `billStageValue` 9633–9635; `advanceBills` 9705/9710/9717.
- **Why it matters:** the whole point of `v19Pivot` (comment 38413–38429) is
  "count the floor before you act". On two of the three rungs it counts a
  different floor. A party judging a Senate bill by Assembly arithmetic will
  back bills that are already safe there and ignore ones that are not.
- **Upgrade:** one line — `billStageValue(f, bill.stage)` in place of `f.lower`.

### 15. `aiGovern` picks the government's bill by coin flip — [shallow]

- **What:** `aiGovern` (13556) builds candidates from the ruling party's
  `wants`, then `var pick = cands[Math.floor(rand() * cands.length)]` (13573).
  It reads no forecast, no chamber, no partner. Contrast `v19BillFor` (34284),
  which the *opposition* deck card uses and which probes `billForecast` on each
  of its top five gaps (34316–34324). The government — the actor with the most
  seats and the only one whose bill gets the +12 — is the one that does not
  look. It also runs only every other session (13558) and only while the player
  does not lead (13557).
- **Evidence:** 13556–13581.
- **Why it matters:** measured, government bills fail 68 of 97 times. Some of
  that is a chamber it never counted before laying.
- **Upgrade:** route `aiGovern` through `v19BillFor`, which already exists and
  already probes the House.

### 16. The relation that carries 5 of the 61 support points is reset toward a constant every session — [shallow]

- **What:** `politicsTick` (10238–10243) runs
  `st.partyRel[p.id] += (base − st.partyRel[p.id]) · .06` every session, where
  `base` is 62 for a coalition member, 46 otherwise, 75 for the player's own
  party. `docs/S21-BASELINE.md` records `shiftPartyRel` called 2,164 times at
  mean magnitude 4.71; a 4.71 shift is 78% erased in 25 sessions and the
  measured mean contribution of the whole term to a vote is −3.1 / −2.9 / −4.0
  points. There is no party-to-party equivalent at all.
- **Evidence:** 10242; measured `relToPlayer` term, three seeds.
- **Why it matters:** it is the second-largest term in the vote, it is about the
  player rather than the bill, and it decays back to a constant that depends
  only on cabinet membership.
- **Upgrade:** pair the reversion with the party-to-party matrix from finding 3,
  and let the reversion target depend on something a party did rather than on
  which side of the cabinet door it is standing.

---

### 17. Assent judges an engine's bill by the PLAYER's relationship — [inconsistent]

- **What:** `assentFavour` (9440–9464) decides whether the office signs.
  `line = st.partyRel[who]` (9444) is the holder's party's relation **to the
  player**, weighted by the holder's `loyalty`; `merits` is what the chambers
  gave the bill (9446). Nothing in it asks about the *sponsor*. So when an
  engine opposition party's bill reaches assent, the office's decision turns on
  how that office's party feels about the player — a party that may have had
  nothing to do with the bill. The +14 at 9445 is likewise "in the government",
  not "sponsored it".
- **Evidence:** 9440–9464; `assentResolve` 9498–9535 (sign at 55, return once at
  45, refuse below, dead on the desk after 3 sessions at 9529).
- **Why it matters:** it is the same player-centric scalar as finding 3, at the
  last gate a bill passes. It is also the only stage where a *person* (`loyalty`,
  `trait`) enters the legislature at all, which is the most interesting thing in
  the bill path and reaches only the player's bills meaningfully.
- **Upgrade:** ask `line` about the sponsor once a party-to-party relation
  exists; keep the holder's `loyalty` as the weight, which is the good part.

### 18. The deck's cadence caps an engine at one chamber act per four sessions — [shallow]

- **What:** `v16AiTurn` (35417) plays **at most one card per party per session**,
  and only when the tempo roll passes (35442, 35451); the open set excludes any
  card played in the last four sessions (35456:
  `if (st.turn - (a.last[c.id] || -99) < 4) return false`). `floor` is one of
  eleven cards. `docs/S21-BASELINE.md` records 326 `floor` plays in 720 sessions
  across ~5 engine parties; I measured 140 in 300 sessions. A bill's whole life
  is 1–3 sessions (`billPace` 9649).
- **Evidence:** 35417–35491; `V16_AI_DECK` 34328–34588.
- **Why it matters:** even if every other defect here were fixed, most bills
  will pass or fail before most parties get a turn to say anything about them.
- **Upgrade:** the floor is a reaction, not an initiative. Let a party respond to
  a bill laid this session outside the card cadence, the way `a.react` (35450)
  already lets a provoked party act out of turn.

---

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `bill.lines[pid]` | `v17FloorCore` 38321 (actor's own line), 38328 (`pressure`, writes the **sponsor's** line as `'oppose'`) | `partyBillSupport` 9051 (+16/−18); `v17FloorWhy` 38201; `v20PressWhy`/`v20PressCore` 38262, 38281; card 14482. Never deleted — permanent for the bill's life |
| `bill.pull[pid]` | `v20PressCore` 38287 — **one writer**, whose one caller (9828) hard-codes `playParty(S)` | `billPull` 9165. Measured non-zero in **0 of 22,932** divisions |
| `bill.whip` | `billAction` 9818, 9820, 9850, 9866; `appeal` 24321 — all player | `billPull` 9154–9156. Measured 0% |
| `bill.upperDeal` | `billAction` 9819, 9820, 9850, 9859, 9866; 24284, 24286, 24321; `advanceBills` 9720 (Senate return +5) | `billPull` 9174 |
| `bill.confidence` / `bill.urgent` | `billAction` 9821, 9822; `sponsorBill` 9283 (`strategy === 'urgent'`) | `billPull` 9168, 9177; `billPace` 9650; `failBill` 9604; `assentFavour` 9455 |
| `bill.floorWork` | `pv5CommitteePanel` 16709 (player) | `billPull` 9161 |
| `bill.committeeWork` | 16707, 16709 (player) | `billForecast` wrapper 16213 |
| `bill.committee` | `sponsorBill` 9282 sets it to **0** and nothing else ever writes it — grep `\.committee *=` → 16214/17347/17348, all on the forecast object | `billForecast` 9256. **Dead input** |
| `bill.support` | event `v8senateRevolt` 22751 (+6), 22752 (−5) | **NONE FOUND** — grep `\.support\b` across the file returns only those two writers plus `divisionOf`'s own bloc rows (9229) |
| `bill.amended` | `billAction` 9851 | **NONE FOUND** — grep `\.amended\b` → 9851, plus unrelated `v.amended` at 18797/18801 |
| `bill.amendments[]` | 16707, 16709 | **NONE FOUND** — grep `amendments` returns only prose and those writers |
| `bill.concessions` | 9282, 9512 (`assentResolve` return), 9819, 9820, 9850, 16709, 18413 | `enactBill` 9401 (mood damping), card 14540, news 9408 |
| `bill.pushes[scope]` | `v20PressCore` 38298–38299 | `v20PressCost` 38274 — escalating price, player-only |
| `st.partyRel[pid]` | `shiftPartyRel` 8748–8750 (2,164 calls/720 sessions), reverted every session by `politicsTick` 10242 | `partyBillSupport` 9032; `assentFavour` 9444; `v11ArtForecast` 31386; committee chair 16212; ~20 UI/AI sites. **One map keyed by party — the player's relation only; no party-to-party channel exists** |
| `st.cordon[pid]` / `st.coopted[pid]` | player party actions only — 12976, 12983 / 12739, 12908, 13006, 13077 | `partyBillSupport` 9033, 9034. Measured 0% of divisions in 300 sessions |
| `ai[pid].grudge[against]` | `v16Resent` 34074; callers 10155/10159/10163/10224/13256/34419/35723/35778/35998/36002/38332 | `partyBillSupport` 9073–9074 (capped at 12); `v16Posture`; `v17Accept` 37457; `attack` target 34395. Measured mean contribution to a vote **0.25 points** |
| `st.aiPacts[pid]` | `pact` card 34459–34460 | `ballot` wrapper 35544–35552 (election only); `v16PactPartner` 34609. Deleted the next session (12005–12008). **No chamber reader** |
| `PARTY[pid].wants` | authored | `partyBillSupport` 9059; `v19BillFor` 34285; `aiGovern` 13560; `partyDemandPolicy`; `pv5TopWants`. Fires on 8% of divisions |

---

## Answers to the seven questions, in one line each

1. **How an engine decides:** ideology 43.2 of 61.2 mean absolute points (71%);
   relation-to-player 5.0; a flat `negotiated` bonus 4.6; sponsor identity 5.1;
   its own manifesto 1.2; grudge 0.25; its declared line 0.24. **Ideology
   dominates and nothing about the engine's own plans enters at all.**
2. **Negotiation:** none exists. No amendment, no trade, no offer, no
   deliberate abstention — `divisionOf` has no abstention concept. A player
   would expect at minimum: "back my bill and I will back yours", an amendment
   tabled by a party that wants the bill narrower, and a partner threatening to
   sit on its hands.
3. **Sponsor:** read at 9025/9026/9031/9033/9058/9073/9169 and nowhere else. An
   identical bill from a rival and a friend scores **to the same decimal**
   unless the sponsor leads the government (+12 to partners) or the voter holds
   a grudge (≤ −12, worth 0.25 in play).
4. **Partner vs opposition:** +12.0 to +19.2 points apart on the government's
   own bill; **−0.5 to +3.8 apart on anybody else's.**
5. **Changing its mind:** support is re-read every stage (`billForecast` at
   9672) but nothing stage-dependent enters it. Per house, **2.6–4.0% of
   (bill, party) series move more than 5 points across the bill's whole life;
   1.0–3.3% ever cross the bar.** A declared line is never revised or cleared.
6. **Against a bill it opposes:** declare `oppose` once (mean **−1.9** aye
   share), then nothing. `b.pull` has one writer (38287) with one caller (9828)
   that hard-codes `playParty(S)`; `pressOwn`/`pressOthers`/`pressBoth`,
   `whip`, `bargain`, `amend`, `amendIt`, `delayIt`, `talkOut`, `kill`,
   `confidence`, `urgent`, `appeal`, `pressOffice`, `override`, `withdraw` are
   **all player-only**.
7. **Coordination:** none in the chamber. `st.aiPacts` pools 6% of the vote at
   an election (35548) and expires the next session (12007).

---

## What I could not verify

- **Where opposition bills die.** I measured 143 engine-sponsored bills
  archived across 300 sessions with **0 passed** (`archiveBill` wrapper, keyed
  on `bill.owner`), but I did not instrument which rung kills them. The
  committee arithmetic (`f.committee = lower·.72 + salience·.28`, 9256, against
  a bar of 43 at 752) suggests most die there, and that is **unverified**.
- **The 0.25-point grudge figure is seed-sensitive.** Two seeds measured
  0.01 and 0.05; the third 0.70 (17% of divisions non-zero). Engine→engine
  grudge writing is rare and bursty. The mean is honest; a single-seed figure
  from this term should not be quoted.
- **All figures are with a passive player.** `playerPosition`, `cordon`,
  `coopted`, `whip`, `pull`, `confidence`, `upperDeal` measured 0% *because
  nobody pressed the buttons*, not because they are unreachable — those are
  live player levers. The claim they carry is that **no engine can reach them**,
  which is a grep result (finding 8), not a measurement.
- **`difficulty` measured 0** only because the runs were at `normal`; the tilt
  at 9186–9188 is real at other tiers.
- **The five-verb `pressure` path at `instinct`.** `v17AiFloorFor`'s
  non-simulating branch (38480–38489) can return `pressure`; I drove only
  `ruthless`, so its rate at the lower AI levels is **unverified**.
- **`v11ArtForecast` (31371–31446)** shares `divisionOf` and mirrors
  `partyBillSupport`'s shape for constitutional articles (its own grudge term at
  31398, cordon at 31388, coopted at 31389). I read it but did not measure it;
  every finding above about the bill vote very likely applies to articles too,
  and that is **unverified**.
- **`b.staged` / `b.sunset` / `b.carveout`** (24284–24286) I confirmed are
  written only on player bills and read at 9401/24297/no-reader-for-carveout —
  I did not chase `b.carveout`'s reader and it may be decorative.

## Probes

- `scratchpad/legmeas.js` — term-by-term decomposition of `partyBillSupport`
  and `billPull` at every division inside `advanceBills`, validated against the
  live function on every sample (0 mismatches in 22,932); floor-verb swing read
  through `billDivision` either side of the call; per-(bill, party, house)
  series; bill outcomes by owner. Re-runnable:
  `VALE_N=100 VALE_SEEDS=A1B2C3D4,5EED1234,C0FFEE11 node legmeas.js`.
- `scratchpad/sponsorswap.js` — one bill, sponsor swapped across all seven
  parties, plus a planted grudge to show the only discriminating channel.
  Deterministic; no dice.
