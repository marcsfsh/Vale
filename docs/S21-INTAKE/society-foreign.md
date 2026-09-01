# society-foreign

*Every non-party agent in the game: blocs, interest groups, the street, movements, foreign powers.*

## What it does today

Eight blocs (`BLOCS` :549) are eight numbers that converge 30% a session toward a
target built from the indicators, the statute book and the **ruling** party's
affinity (`blocTarget` :11094, `tickTurn` :11269–11272). Eight organised interests
(`PV5_INTERESTS` :15937) mirror the blocs one-for-one and hold a relationship with
**the player only**. The street (`st.street`, S17q, :39010–39194) is the one entity
in the file with an aim, a named statute, a date and an escalation. Eight movements
(`MOVEMENTS` :6553) are strength numbers driven by bloc mood. Eleven foreign powers
(`POWERS` :6633 + the S10e push :29513) are one relation number each, drifting by
`kind` (`powersTick` :6754), with treaties, sanctions and an alliance roster layered
on top — all of which only the player can touch.

The short answer to the brief's question: **the street is an actor. Everything else
in this area is a table of numbers the player reads.** And the AI decision layer
does not read any of it: grepping `st.war|relOf(|POWERS|st.powers|v6Treaty|v16Sanction|v17Street|movStrength|st.interests`
over the three AI regions (`34061–36400`, `38246–38600`, `39821–39900`) returns
**0 hits**.

Measurements below are from four probes in
`scratchpad/{probe-interests,soc,soc2,soc3,soc4}.js`, driven with the `runQueue`
override CLAUDE.md requires, 3–6 seeds × 80–100 sessions, `normal`/`epic`/`ruthless`,
null player (no player action taken).

---

## Findings

### 1. The interest groups' memory of meetings is thrown away by a render — [exploitable]

- **What:** `pv5InterestAction`'s v11 wrapper captures `var q = S.interests[id]`
  (:33131), calls the base, and writes `q.met` / `q.refused` / `q.ballots`
  *afterwards* (:33135–33137). The base's last statement is `render()` (:16736).
  Rendering the Interests page calls `v15CampaignSeats(S)` (:33237), whose `restore()`
  does `st.interests = JSON.parse(JSON.stringify(keepI))` (:11461) — a **new object**.
  `q` is now an orphan and the three writes land nowhere. `q.relation` and
  `q.access`, written by the base *before* the render, survive; the memory does not.
- **Evidence:** capture `pv5InterestAction` :33129–33138 · `render()` :16736 ·
  `v15CampaignSeats` :11438, snapshot :11448, reassignment :11461 · `viewInterests`
  wrapper :33215, call site :33237 · reader `v11RelationTarget` :33016
  (`v += (q.met||0)*4.5 - (q.refused||0)*6`).
  **Measured** (`probe-interests.js`): after one *Meet* click on the Interests page,
  `S.interests.labour.met === 0`, the captured object's `met === 1`,
  `S.interests.labour !== q` — and on the Government page, where `viewInterests` is
  not drawn, the same click gives `met === 1`.
  **Poisoned** (`soc3.js`): stub `v15CampaignSeats` to return zeros, click again,
  `met === 1`. The clone-restore is the cause, not a coincidence.
- **Why it matters:** this is the *entire* S11e memory channel. `v11RelationTarget`
  spans 5→95 on these two fields alone (measured: neutral 71.8, twelve meetings 95,
  twelve refusals 5). Every organisation in every campaign therefore sits at the
  no-memory value, and the S11e claim that "the relationship reads how the government
  has actually behaved toward it" is false in the shipped build. The prior audit's
  claim is **true**, and sharper than stated: it is not the counter that fails to
  persist, it is the whole one-way influence chain S11e was built to create.
- **Upgrade:** move the two writes *before* the base call (compute what the action
  will do, or split `pv5InterestAction` into a Core that does not render). Better,
  stop `v15CampaignSeats` reassigning the container at all — snapshot and restore
  the eight sub-objects' fields in place, as it already does for `st.factions`
  (:11462). The same reassignment hazard exists for `st.campaign` (:11460); nothing
  currently wraps `pv5CampaignAction`, so it is latent rather than live.

### 2. `court` — a quarter of everything the engine does — moves the vote the wrong way — [inconsistent]

- **What:** the `court` card spends 36 of the party's purse and adds **2.6** to one
  bloc (:34359). `supportTargets` reads `st.blocs[b.id]` twice, in opposite
  directions: `weight` rises with bloc mood for every party (:11496), but `appeal`
  is `.915 + (m-50)/80` for the **ruling** party, `.86 + (m-50)/108` for a coalition
  partner, and `.784 - (m-50)/130` for everyone else (:11509–11511) — and the
  extremism term `appeal *= 1 + ext*max(0,60-m)/60*2.4` (:11513) shrinks as the bloc
  grows content. A contented bloc rewards whoever is in office.
- **Evidence:** `V16_AI_DECK` `court` :34343–34361 · `V16_AI_COST.court = 36` :34016 ·
  `supportTargets` :11487–11515 · `ballot` reads it :11600.
  **Measured** (`soc2.js`, 6 seeds × 4 sample points × 6 engines = 144 measurements
  of `supportTargets` either side of the exact +2.6 the card applies): the courting
  party's own national share fell in **84 of 144**, rose in 50, was flat in 10;
  median −0.039 points. The **ruling** party's share rose in **133 of 144** and fell
  in 1. On a fresh board the seat swing runs −2 to +1 for the courting party.
- **Why it matters:** `docs/S21-BASELINE.md` (corrected) puts `court` at 280 of 1,025
  real initiatives — **27.3% of the engine's entire output**. More than a quarter of
  what every opponent does, at 36 a play, is on the median a small gift to the
  incumbent. It also explains part of "the engine never wins": the six of them spend
  their largest single line of spending strengthening whoever is in government.
- **Upgrade:** give the card a channel that is the party's own — a per-party bloc
  standing (`st.blocCourt[pid][bloc]`) read in `appeal` — so courting is a
  relationship with a bloc rather than a push on a number the ballot reads as
  approval of the government.

### 3. The one-ply sim scores `court` positively for exactly the reason the ballot punishes it — [inconsistent]

- **What:** `v19Outcome` (:35264) clones, runs the card, and reads `v19Standing`
  (:35250) = `v17Utility` + seat share + machine + purse + office. `v17Utility`'s
  last line is `for (var b in aff) u += ((st.blocs[b]||50) - 50) * aff[b] * 1.1`
  (:13715). So +2.6 on a bloc at affinity .8 scores `+2.29` of utility → `+0.19` on
  the sim term (weight 1.9 at `ruthless`). `v17Share` reads current seats, which the
  card does not touch, so the *only* thing the rehearsal can see is the party's own
  subjective bloc term.
- **Evidence:** `v17Utility` :13696–13717 · `v19Standing` :35250–35262 ·
  `v19Outcome` :35264–35279 · `v19Score` sim term :35300–35301.
- **Why it matters:** two mechanisms disagree about the same number. The card is
  chosen because a party's private utility function likes contented blocs; the vote
  model then hands the benefit to the government. Consistency between the deck and
  the ballot is the whole point of a one-ply sim, and here it is inverted.
- **Upgrade:** make `v19Standing` read projected share (`supportTargets(st)[pid]`)
  rather than only realised seats, or fix (2) so the two agree.

### 4. The `ground` goal cannot be reached by the card that serves it — [shallow]

- **What:** `ground.target` sets `want = min(92, have + 14)` (:34807). The only verb
  that moves it is `court` at +2.6 (`V20_AIM.ground = 'court'` :34224), and
  `tickTurn` pulls the level back toward `blocTarget` at **30% a session** (:11271) —
  a target that does not read the courting party at all.
- **Evidence:** `V19_GOALS` `ground` :34795–34823 · `V20_AIM` :34223–34231 ·
  bloc convergence :11269–11272.
  **Measured** (`soc.js`): a +2.6 push on a live board decays 2.6 → 1.82 → 1.274 →
  0.892 → 0.624 → 0.437 over five sessions (exactly ×0.7). The median remaining gap
  at the moment `court` is played is **11.37**. At the documented one-in-four cadence
  (`V16_AI_CADENCE = 4` :34040) with eleven cards competing, the steady-state lift a
  party can hold is under 2.5 points against a 14-point requirement.
- **Why it matters:** `ground` is held 856 party-sessions in the baseline and is the
  third-most-adopted aim. It is arithmetically out of reach, which is a large slice of
  the "86% of aims abandoned" figure.
- **Upgrade:** either give `court` a durable channel (see 2) or set `want` from what
  the card can actually deliver against the 30% pullback.

### 5. Three of the eight organisations do all the asking — [shallow]

- **What:** `pv5InterestTick` picks the demanding group from
  `PV5_INTERESTS.sort(by influence)[floor(rand()*3)]` (:16289) — the **top three by
  influence**. S11e made influence move (`v11InfluenceTarget` :32991) to fix exactly
  this, but the target is dominated by `g.base * .55` plus bloc `pop` and `power`, all
  static, so the ordering never changes.
- **Evidence:** producer :16288–16294 · `v11InfluenceTarget` :32991–33003 ·
  bases 84/91/65/59/54/76/43/68 at :15938–15945.
  **Measured** (`soc3.js`, 300 sessions): 60 demands raised, from **veterans (21),
  tech (19), labour (20)** and nobody else. Five organisations never ask for anything.
- **Why it matters:** the S11e note names "the same three organisations ask for things
  for two hundred sessions" as the defect it was fixing. It is still true.
- **Upgrade:** weight the pick by (influence × how long since this group last asked),
  or draw from all eight with influence as the weight rather than a top-3 cut.

### 6. Ignoring an interest group's demand costs nothing at all — [missing]

- **What:** the `interest_demand` paper is posted with no `from` field (:16292).
  `expireInbox` (:10193) applies `shiftPartyRel(st, it.from, -8)` only `if (it.from)`
  (:10201) and has named branches for `party_demand`, `faction_demand` and
  `governors_conference` (:10220–10229) — **none for `interest_demand`**. The refuse
  arm in the handler does not touch `q.refused` either (:16453); only the orphaned
  "Close access" button does (:33136).
- **Evidence:** :16292, :10193–10234, :16449–16454, :33136.
  **Measured** (`soc3.js`): 58 of 60 demands expired ignored, with no state change
  beyond a log line.
- **Why it matters:** an organisation that names a condition for "continued access,
  mobilisation and public support" (:16293) and is ignored sixty times running is a
  card that lies.
- **Upgrade:** an ignored demand should cost the relation and, since the card promises
  it, the endorsement. Feed it into the *same* `q.refused` the "Close access" button
  writes, once (1) makes that field live.

### 7. The organisations have no relationship with any party but the player — [missing]

- **What:** `v11RelationTarget` reads `affOf(st, playParty(st), g.bloc)` (:33013);
  `pv5InterestTick`'s base target does the same (:16283); `endorsedTurnout` returns 0
  unless `pid === playParty(st)` (:11416, :11420); `v11InterestRegionLift` reaches
  `regionPartyFactor` only for the player (:33113). `st.interests` has one relation,
  one access and one endorsement per group, and they are all the *player's*.
- **Evidence:** :33013, :16283, :11403–11421, :33110–33124 · zero reads of
  `st.interests` in the AI layer (grep above).
- **Why it matters:** eight named national organisations exist in a seven-party
  republic and six of the parties cannot see them, court them, be endorsed by them or
  be refused by them. When the player is in opposition the whole layer describes a
  relationship with a party that is not governing.
- **Upgrade:** key the three fields by party (`st.interests[g].rel[pid]`) and give the
  engine a verb that reaches them — the `court` card's obvious durable channel.

### 8. `lastMet` is written twice and read by nothing — [decorative]

- **What:** seeded at :16059 (`lastMet:-99`) and written on every Meet at :16728.
  `grep -n "lastMet" vale.html` returns exactly those two lines.
- **Why it matters:** small, but it is the field a "they have not been seen for six
  sessions" mechanic would use, and the card already implies one.
- **Upgrade:** either read it (a cooling relation when nobody calls) or delete it.

### 9. The street is a real actor — and it has never got anything — [shallow]

- **What:** `st.street` is the only entity in this area with an aim, a date and an
  escalation: `v17StreetHeat` (:39032) splits into three named terms, `v17StreetBloc`
  (:39019) names whose street it is, `v17StreetWant` (:39063) names a statute,
  `v17StreetTick` (:39077) posts a demand at pressure 26 with a four-session date and
  shuts the country at 58, and `v17StreetEnd` (:39170) moves the bloc according to how
  it ended. That is well built. It just does not run.
- **Evidence:** constants :38995–39008 · tick :39077–39163.
  **Measured** (`soc.js`, 300 sessions, null player): **5 demands, 0 strikes, 0
  carried, 5 refusals.** Peak heat 40.1 against a bar of 22; peak pressure **50.2**
  against a strike bar of **58**. So `V17_STRIKE_BARS` (:39199) and `v17Barred` — a
  whole gate layer read at five instruments — never fired once.
- **Why it matters:** the strike is the one mechanic in the game that stops a
  government legislating without touching the chamber, and in 300 sessions the
  pressure never reached it. A passive player is the gentle case, so this is a floor
  not a ceiling — but 0 of 5 demands met and 0 strikes is what a player who does
  nothing sees.
- **Upgrade:** the bar was set against a scale the slice measured; measure it again
  against `pressure` in play (peak 50.2 across three seeds) rather than against heat.

### 10. The street remembers, and nothing reads the memory — [decorative]

- **What:** `s.won` (:39178) and `s.refused` (:39136, :10143) accumulate across the
  campaign. Their only reader is the panel's two tags (:39247–39248). A street refused
  five times behaves exactly like one refused none.
- **Evidence:** grep for `s.won` / `s.refused` — writes at :39136, :39178, :10143;
  reads only at :39247–39248. `sq.demand.answered = true` (:10131) is likewise written
  and read nowhere.
- **Why it matters:** this is the one place in the file where a non-party actor keeps
  a ledger of how it has been treated, and it is a scoreboard rather than a state.
- **Upgrade:** read `refused` into heat or into the demand's deadline (a movement that
  has been refused three times asks for more, sooner, and does not open talks).

### 11. Only the player can touch the street, and only from opposition — [missing]

- **What:** "Stand with the street" (:12682–12698) is the sole lever on
  `st.street.pressure` in the file, and it is a player ACTION card. No AI verb exists:
  zero `v17Street` references in the AI layer.
- **Evidence:** :12681 says so in the comment; grep confirms it.
- **Why it matters:** a movement with an aim and a deadline sits on the board and six
  opposition parties, whose whole business is being on the other side of the
  government, cannot get behind it, defuse it, or be blamed for it.
- **Upgrade:** a deck card that stands with (or breaks) a standing movement, priced
  against the bloc it costs — the trade is already written at :12690–12693.

### 12. The movement layer never crosses its own threshold — [decorative]

- **What:** `movementsTick` (:6583) gives a movement three outputs, all gated at
  strength: the "national movement" log and chronicle at `cur > 55` (:6613), the
  champion party's machine lift at `cur > 55` (:6604–6611), and the aggregate unrest
  term, which needs the eight movements to sum past **220** (:6621–6623).
- **Evidence:** :6583–6624.
  **Measured** (`soc2.js`, 300 sessions): the highest strength any of the eight
  movements ever reached was **27.3**; champion lifts fired **0** times; the aggregate
  unrest term fired in **0** sessions. Analytically the equilibrium is
  `((44 − mood)*.22 + max(0, unrest−45)*.06 − securityState*.04) / .09`, so 55 needs a
  bloc held at about **21.5** — and the measured worst bloc in play sits at a median of
  **45.3** (p05 31.4, min 18.8). S17q's own note puts the worst-treated bloc at 26 in a
  hard campaign, which equilibrates at 44 — still short.
- **Why it matters:** eight authored organisations with names, notes and demand
  strings produce, in a whole campaign, nothing but a number on a panel. The three
  player suppression actions gated at `movStrength > 25` (:12610, :12622, :12635) are
  barely reachable. `m.demand` is read only inside the log line at :6616 that never
  fires, and `m.suppressCost` — authored on all eight rows (:6556–6577) — is read
  **nowhere**: `grep -n "suppressCost" vale.html` returns the eight declarations and
  nothing else. (`m.lean` is live: :6590, :6622, :12616–12617.)
- **Upgrade:** the movements and the street are the same idea built twice, six slices
  apart. Fold `MOVEMENTS` into the S17q street (a movement *is* the standing demand,
  with its bloc, its name and its ask), or lower the thresholds to a distribution
  measured in play, as S17q did for the street.

### 13. A bloc has a level and no memory; only statutes move its target — [works, with a caveat]

- **What:** `blocTarget` (:11094) reads indicator `cares`, statute `mood` rows
  (:11097–11100), `affOf(st, st.ruling, ...)*13` and coalition partners at ×3
  (:11101–11102), authority distance, unrest, army, crown. Every direct write —
  `mood()` (:10566), events, the `court` card — moves the *level*, which `tickTurn`
  drags back at 30% a session. Only a statute changes the target.
- **Evidence:** :11094–11114, :11269–11272, :10566.
- **Why it matters:** this is a sound model of "what a government has actually done
  sticks; a gesture does not". It also means every gesture-shaped verb in the game has a
  two-session half-life (roughly 900 `mood(...)` sites in the file, the AI's
  most-played card, most event choices). Worth knowing before designing any new
  bloc-facing verb.
- **Upgrade:** none needed to the model. But any new bloc verb must write the
  *target*, not the level, or it will be `court` again.

### 14. Eleven capitals, six behaviours — [shallow]

- **What:** `POWERS` rows carry `id, name, short, kind, note` and nothing else. Every
  mechanical branch reads `kind`: `powersTick`'s drift (:6759–6764), `v17ForeignDrift`
  (:39560), `warTick`'s candidate filter (:6799), `allianceOdds` (:6701–6703),
  `v16DipEffect` (:33748), `v16SanctionsTick` (:33846). Two neighbours, two blocs, two
  rivals, two southerns, two traders and one alliance are pairwise identical apart from
  their opening number and their prose.
- **Evidence:** :6633–6646, :29513–29524, :39537–39568. `grep "=== 'sarath'"`-style id
  comparisons: **none** outside the registries.
- **Why it matters:** the Foreign Office page offers eleven cards and eleven treaty
  sheets over six distinct behaviours. Nothing a player learns about Valdenmark is
  different from what they learn about Ostmark.
- **Upgrade:** give a power two or three scalar dispositions of its own (appetite,
  patience, reliability) read where `kind` is read now, seeded per power.

### 15. Six of the eleven capitals appear in no event, arc, order or dispatch — [shallow]

- **What:** `valdenmark`, `zhenkai`, `oranje`, `khoraz`, `tarnow` occur exactly **three**
  times each in the whole file: the S10e registry push (:29514–29523), the opening
  seed (`V10_POWER_OPENING` :29526), and their authored `V16_DIP` prose block
  (:33643 ff). `moya` occurs ten times. The eleven events and arcs conditioned on a
  power name only `ostmark` (×3), `alliance` (×2), `sarath` (×2), `calavera`,
  `meridian`, plus two generic `POWERS.some` triggers (:8422, :8435, :18671, :19020,
  :19090, :19097, :19104, :22713, :22767, :22851, :24706).
- **Why it matters:** half the world exists only as a row on a table and a paragraph.
- **Upgrade:** at minimum a generic power-initiated event keyed on `kind` plus the
  relation, so any capital can be the one that acts.

### 16. No foreign power initiates anything, ever — [missing]

- **What:** there is no inbox type from a capital (the full list is :10005–10008 plus
  `interest_demand`, `street_demand`, `minister_resignation` — none foreign). No power
  proposes a treaty: the only push of a pending row is `v6TreatyPropose` (:18001),
  which the player calls. No power annuls one: `v6TreatyAnnul` (:18008) is called by
  the player's button, by the tariff/rearmament conditions, and by the relation floor
  (:18084–18095). No power sanctions Vale: `v16Impose` (:33812) writes
  `st.v6.sanctions[pid]`, which is always *Vale's* sanctions on them. A capital's whole
  behavioural repertoire is: drift (:6772), roll `t.odds` when asked (:18043), and
  appear as `st.war.power` when the war roll picks it (:6811).
- **Why it matters:** the world outside Vale is weather. Everything that ever happens
  abroad happens because the player pressed something.
- **Upgrade:** the shape already exists — `addInbox` + a `V18_PAPER_NEED` entry. A
  capital that has been sanctioned for six sessions, or refused three times, or whose
  relation fell past a floor, should write to the government.

### 17. A power's only memory is monotone and never forgiven — [shallow]

- **What:** `st.v6.treatyAsks[pid+':'+kind]` (:18002) subtracts **11** from the odds per
  previous ask (:17988); `st.alliance.asked[id]` (:6725) subtracts **9** (:6711). Neither
  ever decays — no writer reduces them anywhere in the file.
- **Evidence:** grep `treatyAsks` → :17874, :17945, :18002 only. `asked` → :6682,
  :6711, :6725 only.
- **Why it matters:** this is the *one* real memory a capital has and it is a
  permanent black mark. Eight refusals of one instrument takes it to the floor of 3
  forever, in a game that runs 120 sessions.
- **Upgrade:** decay both by one every few sessions, or scale them by how long ago the
  ask was — which is what `t.laid` already records.

### 18. No AI party has a foreign policy of any kind — [missing]

- **What:** none of the eleven cards in `V16_AI_DECK` (:34328) touches a power, a
  treaty, a sanction or the war. `aiGovern` (:13556) — the whole of what an AI
  government does with the executive — lays one bill from `PARTY[ruling].wants` every
  other session and nothing else. Four of the seven parties carry exactly **one**
  Foreign statute in `wants` and three carry one Defence statute (measured, `soc2.js`),
  so the only path from an engine to a capital is that one bill carrying and moving
  `powersTick`'s statute terms.
- **Evidence:** zero hits for `st.war|relOf(|POWERS|st.powers|v6Treaty|v16Sanction` in
  `34061–36400`, `38246–38600`, `39821–39900` · `aiGovern` :13556–13581 ·
  `V16_DIP_ACTS` reachable only through `ACTIONS`, gated `need:'gov'` via `actionNeed`
  (:10869) and `actionOpen` (:13348).
- **Why it matters:** when the player is in opposition — a whole mode of play since
  S16f — the Foreign Office is frozen. Eleven capitals, twenty instruments, a sanctions
  regime and an alliance roster sit still for as long as the player is out of office,
  and no opponent has a position on any of it to argue with.
- **Upgrade:** one deck card (`envoy`/`sanction`/`treaty`) whose target is picked from
  the party's own Foreign wants, plus a foreign term in `v17Utility` so a party can
  disagree with the government about the world.

### 19. An engine signing a power-targeted executive order targets a region — [inconsistent]

- **What:** `v17AiOrderFor` passes `o.target ? REGIONS[0].id : null` (:38408–38409) —
  a region id — for **every** targeted order, including the eleven whose `target` is
  `'power'`. `v10OrderOpen` (:28701) never validates the target's type. The order is
  signed, the log line reads *"The Maritime Exclusion Zone (somnium), signed without
  reference to either house"* (`v10OrderTitle` falls through to the raw id at :28762),
  and its `powerEff` is silently dropped because `v10OrdersTick`'s guard
  `if (st.powers[pid] !== undefined)` (:28776) rejects `st.powers['somnium']`.
- **Evidence:** :38403–38412, :28701–28730, :28599, :28776, :28756–28763.
  **Measured** (`soc4.js`, 3 seeds × 80 sessions): **13 of 82** AI-signed orders were
  power-targeted, every one against `somnium`; sample titles
  `The Maritime Exclusion Zone (somnium)`, `The Open Door (somnium)`.
- **Why it matters:** visible nonsense in the Gazette, and eleven foreign-facing orders
  whose relation effect never applies when an engine signs them. The guard at :28776 is
  doing its job — which is why nothing has ever failed.
- **Upgrade:** `v17AiOrderFor` should pick a target of the right kind
  (`o.target === 'power' ? <a power id> : REGIONS[0].id`), and `v10OrderOpen` should
  refuse a target that is not in the order's own domain.

### 20. The war roll picks the same capital every time — [shallow]

- **What:** `warTick`'s candidate filter excludes `alliance` and `trade` kinds,
  alliance members, non-aggression/defence holders, and anything at ≥55, then takes the
  **argmin** of the relation (:6797–6809). With a fixed opening seed the minimum is
  fixed: `tarnow` at 27 (:29526).
- **Evidence:** :6790–6819 · openings :6659, :29526.
  **Measured** (`soc3.js`, 300 sessions): 22 wars — **tarnow 15, sarath 6, ostmark 1**.
  Eight of the eleven capitals were never fought.
- **Why it matters:** the biggest thing that can happen abroad is effectively
  predetermined by the opening table.
- **Upgrade:** weight the pick by `(55 − rel)` rather than taking the argmin, so a
  cold capital can be the one and not always the coldest.

### 21. Small: `v9BestBloc` is defined and never called — [decorative]

- **Evidence:** defined :23486; `grep -n "v9BestBloc"` returns only that line.
  (`v9WorstBloc` :23485 *is* called, at :23929.)

---

## State channels

| field | written by | read by (or NONE FOUND + the grep) |
|---|---|---|
| `st.blocs[id]` | `tickTurn` :11271 (30% toward `blocTarget`), `mood()` :10566 (~900 sites), `court` card :34359, scenario/custom-start literals :17404 ff | `approval` :11118, `unrestTarget` :11230, `supportTargets` :11496/:11507, `v17Utility` :13715, `blocTarget` (self), `movementsTick` :6586, `v17StreetBloc` :39022, `v11InfluenceTarget` :32995, `v9PublicSupport` :24041, dozens of event `cond`s |
| `st.movements[id]` | `movementsTick` :6603, events :8389–8397, player actions :12613/:12625/:12638, arc arms :27821 ff | `movStrength` :6581 → 6 event/arc conds and 3 player-action `can`s. The three in-tick consumers (:6604, :6613, :6621) are gated at 55/220 and **never fire in 300 sessions** |
| `st.movSeen[id]` | :6615, deleted :6619 | :6613 only (its own guard) |
| `MOVEMENTS[].suppressCost` | authored on all eight rows :6556–6577 | **NONE FOUND** — `grep -n "suppressCost" vale.html` returns only the eight declarations |
| `MOVEMENTS[].demand` | authored on all eight rows | :6616 only — inside the `cur > 55` log line that never fires |
| `st.interests[g].relation` | `pv5InterestTick` :16284, `v11InterestTick` :33029, buttons :16728–16734, inbox :16451–16453 | `blocTarget` wrapper :16300, `v11InterestRegionLift` :33106, `v11InfluenceTarget` :33001, `v11RelationTarget` (self), card render :16895 |
| `st.interests[g].met` / `.refused` | `pv5InterestAction` v11 wrapper :33135–33136 — **written to an orphaned object; measured 0 in the live state after every click** | `v11RelationTarget` :33016 (worth the full 5→95 span, always reads 0) |
| `st.interests[g].ballots` | :33089, :33136, :33137 (last two orphaned) | `runElection` wrapper :33082, :33088 |
| `st.interests[g].lastMet` | :16059 (seed), :16728 | **NONE FOUND** — `grep -n "lastMet" vale.html` returns exactly those two lines |
| `st.interests[g].demand` | :16291, cleared :16454 | card render :16895 only (a tag). Never expires, never costs anything |
| `st.street.pressure` | `v17StreetTick` :39095/:39096/:39137, `v17StreetEnd` :39175, inbox arms :10132/:10139/:10143, "Stand with the street" :12687 | tick's own bars :39109/:39155, panel :39224 |
| `st.street.demand` | :39116, cleared :39138/:39174 | tick :39132–39135, panel :39236, inbox :10123–10143, `expireInbox` :10210 |
| `st.street.won` / `.refused` | :39178, :39136, :10143 | **panel tags only** (:39247–39248). No mechanic reads either |
| `st.street.bloc` | :39120, cleared :39193 | `v17StreetHeat` :39037, `v17StreetEnd` :39172/:39180/:39187 |
| `st.street.demand.answered` | :10131 | **NONE FOUND** — `grep -n "\.answered" vale.html` → :10131 (write) and :22375 (an unrelated dispatch counter) |
| `st.powers[id]` | `seedPowers` :6659, `powersTick` :6772, `shiftRel` :6662 (156 call sites), `warTick` :6813, `v10OrdersTick` :28776, custom start :36528 | `relOf` :6649 → `warTick` risk/target, `allianceOdds`, `v6TreatyOdds`/`Why`, `v16SanctionsTick`, 11 event/arc conds, world page, chart series :30427 |
| `st.v6.treaties[pid][]` | `v6TreatyPropose` :18001, `v6TreatyAnswer` :18044/:18052, `v6TreatyAnnul` :18010, `v6TreatiesTick` :18070 | `v6Treaties`/`v6HasTreaty`/`v6TreatyCount` :17911–17923 → `warTick` filter :6804, `allianceOdds` :6706, `v6TreatyOdds` :17981, `indicatorTargets`, war momentum :18193–18195 |
| `st.v6.treatyAsks[pid:kind]` | :18002 only. **Monotone — no decay anywhere** | `v6TreatyAsks` :17945 → `v6TreatyOdds` :17988 (−11 each) |
| `st.v6.sanctions[pid]` | `v16Impose` :33815, `v16Lift` :33827 | `v16Sanctioned` :33807, `v16SanctionList` :33808 → tick :33839, panel :33957, two order `needs` |
| `st.alliance.members` / `.asked` | `allianceInvite` :6725/:6727, `allianceJoin` :6746, withdrawal | `allianceHas` :6686 → `warTick` :6803, `v6TreatyImplied` :17931, `allianceOdds` :6711, `allianceJoin` :6741 |
| `st.war` | `warTick` :6811/:6874, `v6WarTick` :18182, war-council event :18209 | `warTick`, `relWord` :6655, `allianceOdds` :6704, `v6TreatyWhy` :17960, `v6TreatiesTick` :18068, Gazette. **Zero reads in the AI layer** |

---

## What I could not verify

- **All driven figures are from a null player.** The probes never press a button, so
  the street's 5 demands / 0 strikes and the movements' 27.3 ceiling are what a
  *passive* campaign produces. A player who governs badly drives blocs down and both
  layers up. I have anchored the movement finding to the analytic equilibrium
  (`d_pos/.09`, needing a bloc held near 21.5) and to S17q's own measured worst bloc of
  26 so it does not rest on the null run alone, but I have not driven a hostile
  campaign.
- **The `court` sweep measures `supportTargets`, not a realised election.** It is the
  function the ballot reads (:11600) with the exact +2.6 the card applies, sampled at
  four points in six seeds — but I did not run 144 elections. The sign could differ at
  a ballot where `psupport` easing (:11537, 35%) and turnout dominate.
- **My own `court` play count (329) is inflated by `v19Try` rehearsals** — the trap
  `docs/S21-BASELINE.md` now documents (`V19_SIMULATING` :35213). I have quoted the
  corrected baseline's 280 / 27.3% instead. The `interest_demand`, `street_demand`,
  war and order counts are read off the live state or off types no card produces, so
  they are not affected.
- **Whether any of the 12 power-targeted orders is ever reachable by the *player* with
  the right target** — I verified the AI path only. `v10IssueOrder` (:28732) takes the
  target from the UI, which presumably offers powers; I did not drive that click.
- **`ground` goals "done": my probe counted 3 of 13 adopted.** The detection reads
  `a.lastGoal.why === 'done'` keyed on `since`, which may double-count or miss; the
  baseline's aggregate (22 done of 158 retired, all kinds) is the number I would trust.
- **I did not read the `viewWorld` / Foreign Office markup** beyond the treaty dialog
  (:18119) and the sanctions panel (:33956), so I cannot say whether every per-power
  state has a surface.
