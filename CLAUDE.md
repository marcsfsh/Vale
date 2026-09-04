# Parliament: Vale

One product: `vale.html` — a complete turn-based government simulator in a single
self-contained file. Everything else in this repo is tooling or documentation.

IMPORTANT: never read `vale.html` whole — it is **3.0 MB** and would consume an
entire context window. Use `grep -n`, Read windows of ≤80 lines, and the Explore
agent for open-ended sweeps. `docs/MAP.md` holds the structural map; read it
before touching the file.

## Invariants (full policy: docs/AGREEMENT.md)

- `vale.html` is the whole app: no build step, no package.json anywhere, no
  runtime dependency, no `<script src>`; it must open from `file://`.
- **Zero external references.** The allowlist in `checks/baseline.json` is empty
  and stays empty — the fonts are embedded as data URIs (`tools/fonts.sh`
  regenerates them; never hand-edit the `@font-face` block). Never add one.
- Saves may break pre-release, but only loudly: a blob that can't load gets a
  clear message and is left untouched in localStorage. Silent corruption or
  silent discard of a save is the worst possible failure here.
- Three layout tiers, all first-class: phone ≤760 (reference: iPhone on
  Firefox = WebKit engine), tablet 761–1179, desktop ≥1180 (focus: 1500px
  Chromium). Improving one tier at another's cost is a regression.
- **Five width thresholds exist and no more**: 420, 760/761, 1179/1180. A sixth
  fails `breakpoint-tiers`. Needing a boundary at 900 almost always means the
  rule belongs to a tier that already has one.
- The party palette is the game's identity and is the user's to rule. Two
  colours were lifted along their own hue in S6b; propose any further change
  with `node tools/seats.js` output, never unilaterally.

## The rules this file's history punishes

- Never rebind a top-level function name without capturing the previous body
  (`var vXFooBase = foo;` first) **and calling it**: since S14 the check derives
  capture from the code, an alias nothing reads counts as an orphan exactly like
  no alias at all, and an orphan with no `deliberate` adjudication fails
  outright. Every reassignment site must be adjudicated in
  `checks/dead-bodies.json` or checks fail; `node checks/run.js --sites` lists
  all 194 with their aliases and read counts.
- Never pass a reassignable function identifier by value at top level
  (`addEventListener('click', foo)` at column 0) — it freezes the body at that
  vintage. The ratchet is at 0; do not add the first.
- **All randomness goes through `rand()`**, whose state rides the save. Never
  call the unseeded source, and never name a local `seed` inside `newGame` —
  `var` hoists to the top of the function and one already shadowed the campaign
  seed, so the state literal was built with `seed: undefined`.
- **A countdown that resolves in a tick asks about `st.turn + 1`.** `endTurn`
  runs every tick and only *then* does `S.turn += 1`, so inside one `st.turn` is
  the session the click is **leaving**, not the one it is producing. Four of the
  six session clocks were counted against `st.turn` and each charged one End
  Session click more than its card printed — the amendment clock said two and
  took three. `roads.js` holds all six.
- **A per-power list is built at the END of the file, never where the `ACTIONS`
  literal is evaluated.** `POWERS.push` runs in the S10e chunk, so a list built
  in the literal freezes the six powers that existed at that moment. Nine
  diplomacy lists have been rebuilt for exactly this reason across S15j and S16c.
- **A read must not create.** `v6TreatyRows` installed an empty array for any
  power it was asked about, and one panel asks about all eleven every render, so
  `Object.keys(st.v6.treaties).length >= 3` — the Peacemaker record's test —
  became "eleven powers exist" and the record was awarded on every seed with
  nothing signed. Reads go through the reading accessor, writes through the
  writing one, and a record's test counts the things it names.
- **A field written in four places and read in none is a card that lies.**
  `st.court.size` was assigned by three articles and by the start editor, and
  consulted by nothing in 3 MB — every consumer counts `justices.length` — so
  the Article of the Constitutional Bench promised "four more justices" and
  seated nobody. Before writing a number into the state, grep for a reader; if
  there is none, the promise is decorative. This is `MAP.md`'s "a modifier
  nothing reads is a lie on the card" wearing a different hat, and S16f2 is at
  least the tenth time it has been found.
- **A guard goes on the LIVE function, and a reassignment is not a wrapper.**
  `pv5MinisterAction` is reassigned in the S11 chunk and that reassignment
  *replaces* four of its nine cases, so S17b's mode gate — placed on the base —
  was measured as absent while an opposition player briefed the government's
  ministers. Before gating anything, grep `var xBase = fn;` / `fn = function`:
  a wrapper that delegates carries the base's guard, a reassignment does not.
  And ask the question of ONE surface once — the v11 regional layer had its own
  `inPower` beside the new table, and two rules for one surface drift apart.
- **A PERMISSION opened on the callee is worth nothing while the caller still
  refuses, and the owner is the one who finds out.** The same slice that wrote
  the rule above put the private members' rule inside `draftBillDialog` and
  never touched `changePolicy`, the only function that calls it, which refused
  flatly and returned — nor the card's two buttons, which rendered `disabled`;
  nor the dossier's two, which were never emitted at all; nor the "Worth
  drafting now" fold, hidden wholesale from the chair that most needs it. The
  door was correct and reachable by nothing, and the shipped build was the
  build the owner played. When you OPEN something, grep every caller and every
  button that leads to it, drive it by a real click from the chair it was
  opened for, and make ONE predicate the answer that all of them read. Its
  twin: the same slice claimed in a comment that `canWork` withheld the
  government's machinery from a private member's bill, and the line read
  `inPower(S) || b.owner === 'player'`, which GRANTS it. A comment asserting
  what a line does is not a reading of the line.
- **EVERY GATE IN THIS HARNESS CALLS A FUNCTION AND A PLAYER PRESSES A
  BUTTON.** That gap is why five separate slices shipped the same defect and
  why the harness was green through all of them. S17b graded fourteen region
  handlers by chair and never touched the three emitters, so the Federation
  tab drew 128 enabled controls from the bench that did nothing but flash a
  refusal — exactly as unrestricted as the owner said it looked. S18a withheld
  urgent procedure at the card and at `billAction` and left the identical flag
  settable free at the drafting sheet, one click earlier and worth more than
  the whole chair penalty it sat under. S12 taught `policyWhy` to say
  "Requires X." and no card could reach it, so 37 statutes rendered lit,
  priced and forecast buttons the handler refuses. `no control lies, in any
  chair` walks all fifteen pages from all three chairs and presses everything
  enabled: an enabled control that moves nothing and only flashes is a lie,
  and a shut control with no title is the same dead end read backwards. And
  it carries a CONTENT arm, because collapsing the button and the handler onto
  one predicate makes them agree even when both are wrong — consistency is not
  correctness, and the first poison run proved the consistency half alone
  green on a build with the rule deleted.
- **THE PROBE IS WRONG BEFORE THE GAME IS.** S18c's assertion took four
  rounds and every fault was in the probe: it demanded the caretaker's exact
  sentence where the code rightly answers with the most specific reason it
  has; it demanded one NAMED paper type appear, where the producer returns at
  the first branch that fires and any of five may pre-empt it; it seated a
  chair once and drove 26 sessions, during which ballots move the player
  between chairs, so six of the head of government's papers were tallied in
  the opposition column; and it matched a word against a string it had
  truncated before that word. Three of the four would have shown GREEN over a
  wrong measurement, which is the failure this whole family of rules exists to
  stop. Before believing a red assertion, check the probe. Before believing a
  green one, poison it.
- **HALF OF `endTurn` RUNS INSIDE `runQueue`'S CALLBACK, so a probe that clears
  `UI.queue` around the call drives a republic that never holds an election.**
  `endTurn` sets `UI.queue = v17Route(...)` and then passes the rest of the
  session — `runElection`, the caretaker's clock, the executive season — to
  `runQueue(function () {...})`, which raises a sheet and waits for a click
  when the queue is not empty. Clearing the queue *before* and *after* does not
  help: the queue is filled in between. The harness's driver overrides the
  function (`var rq = runQueue; runQueue = function (done) { UI.queue = []; rq(done); };`)
  and roads.js has arms both ways, correctly — an arm about the initiative pass
  needs no override, an arm about anything downstream of the queue does. Three
  S20g probes used the plain step and reported **1 election and 1 executive
  turnover in 720 sessions**; the same seeds under the override give 360
  elections, 20 government changes and offices turning over at 22.8%. A whole
  investigation was built on "the offices are frozen" and the offices were
  fine. Two smaller instances of the same family from that slice: **a rate
  above its own ceiling is arithmetic that cannot happen and is the probe
  telling you so** (availability was asked AFTER the card ran, so every hit
  counted as unavailable — .591 against a ceiling of .333), and **a probe that
  reproduces the rule under test to decide what counts as a hit measures the
  change against itself** — read the outcome through the game's own path, which
  bloc actually rose, not by recomputing what the old code would have picked.
- **An assertion that compares two things, one of which is derived from the
  other, proves nothing.** S17e's mirror check compared `redLine` with
  `terms.redLines[0]` as seeded — but the list is *built from* the scalar, so
  it passed with the mirroring code deleted. It has to CHANGE the derived side
  and re-run the producer. Six tautologies of exactly this family were caught
  by poison-proofing in S17 alone; two more read a value only where a later
  write re-establishes it. Poison every assertion, and when two guards are
  belt and braces, poison them TOGETHER — removing either alone changes
  nothing, which reads as a dead guard and is not one. Two more shapes of the
  same mistake, both caught in S17f: **a count parameterised by the constant
  it is checking** agrees with any value that constant holds (the caretaker's
  three-session clock read `V17_CARETAKER_MAX` and passed at 99); and **a
  probe that drives far enough for something else to do the job** proves the
  something else (two sessions reached a ballot, and the ballot formed the
  government the clock was supposed to). And when what you are measuring is a
  RUNNING RECORD, **tally it once, not every session**: S17g's first lifespan
  probe summed a three-entry ledger across sixty sessions, read 527, and sent
  me hunting a runaway mechanism that was working correctly. And the sharpest
  form of all, from S17k: **an assertion that passes under both the old line
  and the new one is not testing the change.** The order gate went from
  "does the GOVERNMENT hold this department" to "does the ACTOR sit in it",
  and the probe — which put its party in the office — could not tell them
  apart. Reverting the widening left it green. When a gate is narrowed, the
  probe has to stand in the gap the narrowing closes.
- **Calling the function is not testing the wiring, and there is usually more
  than one call site.** S17p's first court probe called `v17CourtTick`
  directly; deleting the call from `endTurn` left it green, and so did
  deleting the ruling from the event queue. Two call sites, neither touched.
  Drive real sessions and look for what the player would see. Four of that
  slice's thirteen poisons were this, and three of S17o's twelve were the same
  thing wearing a different coat.
- **A probe that throws aborts the harness instead of failing one assertion.**
  Guard every lookup a poisoned build can empty. S17m learned this from a
  ghost id and S17p relearned it from an empty docket.
- **A probe that reassembles the formula proves the function, not the wiring.**
  S17o's first Defence probe computed `52 + veterans*.7 + ... + v17ArmyTerm(st)`
  itself and compared it either side of a statute; deleting the call from
  `tickTurn` left it green. Read the number through the game's own path, always
  - drive the tick and read `st.armyLoyalty`. The cost is that the real path
  cannot say WHICH channel moved the number (a Defence statute that shifts the
  veterans bloc moves the army by a road that predates the slice), so ask the
  coverage separately: the statute is in the table AND the table reaches the
  game. Three of S17o's twelve poisons found this one mistake.
- **A default written as a list of names goes stale; derive it from the thing
  itself.** `v7DefaultCollapsed` decides which panels arrive folded by naming
  them, in a chain of three functions, and eleven slices added panels without
  touching it — so the pages this program grew most folded NOTHING, and the
  Executive page reached 61.5 phone screens with 514 buttons on it. S17r's rule
  reads the deck's own size instead, so a deck a later slice adds folds the
  moment it is long and nobody has to remember anything.
- **A post-pass that REBUILDS a heading breaks every query that counts it.**
  S17r's fold pass first did `summary.innerHTML = head.innerHTML; head.remove()`,
  which took the `h3.eyebrow` out of the document — and `measures-render-locked`
  went from sixty cards in eight books to sixty in NONE. Move the node into its
  new parent; never re-emit it. This is `MAP.md`'s "renaming a class, heading or
  slot attribute can silently disable a feature" with the rename done by DOM
  surgery rather than by editing a literal.
- **Focus read at the top of `render` is focus already lost.** An End Session is
  not one render: `endTurn` runs the queue, raises and drops sheets, and renders
  several times, so the last render asks who has focus and the answer is `body`.
  Record it on `focusin` as it happens. And a sheet taking focus is not the
  reader leaving: clearing the key on focus landing outside the view threw it
  away for exactly the turn it existed to survive.
- **A probe that opens what is open by default proves nothing.** S17r's fold
  test opened the first group — which the code opens anyway — so a build that
  remembered no toggle at all still passed. Open one that is shut.
- **A stylesheet does not report a syntax error.** S17s's block lost its
  opening comment delimiter twice; the browser resumed at the next thing it
  recognised, so every base rule in it was silently dropped while the media
  query below carried on working — and a poison run taken in that state
  "proved" four rules redundant, because none of them was applying. Nothing in
  `checks/run.js` reads CSS. `tools/contrast.js` is what noticed, and a poison
  run against a build you have not confirmed PARSES is a poison run that proves
  nothing.
- **Last-in-source only wins at EQUAL specificity.** Six chunks of stylesheet
  mean half the controls in this game are already claimed by a
  one-element-one-class rule, and the Atlas strip claims its own buttons three
  classes deep. A new rule at the end of the file that writes `.select` where
  the incumbent writes `select.select` loses and looks like it worked.
- **A knob nothing in the game can turn is decoration, and the poison run is
  where you find out.** S17r drafted a card-count threshold and a group-size
  floor; two poisons that set both to absurd values changed nothing anywhere,
  because the game has three grouped panels, the smallest holds 48 cards, the
  smallest group holds 6, and no filter a player can press produces a short
  one. Both were deleted rather than shipped. `st.court.size` is the same
  mistake in the model; this is it in a stylesheet.
- **A control the tier hides cannot take focus, and a fixed element has no
  `offsetParent`.** Two versions of one probe arm picked an invisible button
  and read the failure as the feature being broken. Measure visibility with a
  rect, not with `offsetParent`.
- **A threshold picked by eye is a mechanic that never fires.** S17q's first
  build put the street's bar at 62 of unrest, which reads plausible against a
  scale that ends at 95. Measured afterwards across six hundred played
  sessions, unrest sits at 24 and TOPS OUT AT 57: the bar was above the ceiling
  and the whole slice was decoration that passed its own assertion, because the
  assertion set `st.unrest = 80` by hand. Before a number gates anything,
  measure the distribution of what it gates on IN PLAY, and put the measurement
  in the assertion's own words so the next reader cannot re-pick it by eye.
- **A TOOL THAT PRINTS PER-SEED ROWS AND NO MEAN WILL HAVE ITS FIRST ROW
  QUOTED AS THE SUMMARY.** `tools/pacing.js` printed one row per (length,
  seed), so the top three rows are the three lengths of one seed and read
  exactly like a summary — and three consecutive S19 slices published them as
  the six-seed arc. Read one seed, S19c takes crises per ten sessions from
  1.0/1.0/0.9 to 0.8/0.7/0.7 and S19d hands most of it back, a movement the
  notes twice called the owner's to rule on; read six, the same builds go
  0.83/0.88/0.82 → 0.90/0.92/0.81 → 0.93/0.88/0.82, every delta inside one
  build's own spread, and **no slice in the program moved the arc at all**.
  S16a had already ruled that *a pacing figure from one seed cannot tell a
  balance change from a reshuffle* — the ruling was on the page the whole
  time and lost to the shape of the output every time — and `VALE_SEEDS`
  defaults to ONE seed, so the obvious invocation cannot answer the question
  it is being asked. So the fix went into the tool, not the docs: it prints
  the mean with the spread beside it, labelled as the row to quote, and when
  it has one seed it says it is not quotable and gives the six-seed command.
  Where a harness reports per-run figures,
  make the aggregate the easiest thing to read, and treat a before/after gap
  smaller than one build's seed-to-seed spread as a reshuffle rather than a
  result. This is `st.court.size` inverted — there, a number nothing read; here,
  a number read that was never the one meant.
- **The instrument the answer has to use decides the deadline.** The same slice
  gave a demand three sessions and the only way to meet one is a bill: laying
  is one, the floor is a second, and since S15d the statute does not move until
  an office signs, which is a third. Every demand was refused on a bill that
  was about to carry. Count the sessions the game's own path takes, then set
  the clock.
- **Two clocks for one fact means the one you did not write about wins.** The
  street's demand carried a date, and the inbox paper carried the same date as
  its expiry. `expireInbox` runs earlier in `endTurn` than the street's tick,
  so the paper cleared the demand and booked a refusal without ever reading the
  statute book — which made the street's own deadline, the half that reads the
  book, unreachable code. When two mechanisms hold the same date, ONE owns the
  outcome and the other reports it.
- **A counter read after it is spent is a window one short of its name.**
  `if (s.rest > 0) s.rest -= 1;` at the top of a tick and `!(s.rest > 0)` at the
  gate below it give five sessions of protection from a constant that says six.
  Capture the value first. This is the countdown rule above wearing the other
  hat: `st.turn + 1` is the same mistake read forwards.
- **An assertion that never pinned its dice depends on what ran before it.**
  Three roads seeded nothing in their `fresh()`, so a poison applied for a
  DIFFERENT road moved their rolls and reddened them for reasons that had
  nothing to do with what they test. The foreign book's `warEdge` swung between
  -4,029,800 and -2,200,000 on consecutive runs of the same build; it happened
  to stay negative, which is what the assertion asks, until an unrelated change
  put it the other side of nought. Every probe that rolls pins its own
  `rngState`, and a road whose reported figure moves between two runs of one
  build is telling you it does not.
- **A flaky assertion is a defect report you have not read yet.** `always
  running` failed on two runs in six and the cause was real: a party's two
  parallel primaries could pick the same person, and S17h's one-person-one-
  office rule then seated a stranger in the second. Pinning the probe would
  have hidden it. Make the assertion name which of its conditions failed, run
  it until it does, and fix what it points at.
- **AN ASSERTION SIZED FOR ONE SEED IS A CLAIM ABOUT THE SEED.** FIVE arms in
  two slices were found gating a real mechanism on a sample that could not show
  it, and every one of them reddened on a slice that legitimately re-phased the
  dice — so each looked exactly like a defect in the slice, and three cost an
  hour of hunting the mechanism before the sample was checked. `the agreement
  bites` had `kept > 5` on a single-digit count over four seeds, and the same
  four seeds give one build 11 while three other quartets give it 9, 7 and 8.
  `the rehearsal can see what a card did` asked `min === max`, which ONE sample
  defeats: `order` returns the same number on 101 of its 102 rehearsals and the
  hundred-and-second let a price list through for four slices. `a party moves
  when it has a reason to` gated `> 0` on counts of nought to three over forty
  sessions of ONE seed. `a party does not wait for the season` bounded a
  proportion taken over fourteen provocations, whose standard error is .13. And
  `the verb reads the aim` gated a rate at .45 on 63 observations, standard
  error .063, so a reading of .413 was six tenths of an error from the bar; at
  twelve seeds it is .560 here and .556 on the build before the slice.
  They are twelve seeds and a rate, twelve seeds and a modal share, six seeds,
  forty-two provocations, and twelve seeds now. Before writing an assertion that counts events
  or takes a proportion, ask how many the game produces per seed and size the
  sample so the bar sits OUTSIDE the standard error; and when an arm reddens on
  a slice that re-phased the dice, check the sample size before hunting the
  mechanism. This is S16a's ruling — a pacing figure from one seed cannot tell a
  balance change from a reshuffle — applied to every arm rather than to pacing.
  **AND THE SHARPEST FORM OF IT IS A BAR SET AT THE VALUE IT MEASURED.** The
  `easy` tier's street leg had already made this argument in its own comment —
  it replaced a maximum with a count, calling the maximum "the least stable
  statistic in the leg" — and then set the count's bar at exactly the count it
  observed, four of twelve. S21q adds a nineteenth card to the deck and touches
  no term in `v17StreetHeat`; the count went 4 to 3, the mean peak 30.7 to 28.8
  (one standard error of twelve seeds), and the arm went red for a reshuffle.
  All three of that leg's bars sat within one error. A bar goes where the
  MECHANISM's claim is — here, that heat which could not reach 22 at all now
  averages a peak near 29 — never where today's reading happens to land.
  AND WHEN THE SAMPLE CANNOT BE MADE BIG ENOUGH, SPLIT THE CLAIM: the rare event
  keeps a tripwire that the path fires in play at all, and its CORRECTNESS moves
  to a leg with no dice in it. S21h's `oustDone >= 2` is 5 over twelve seeds and
  1,440 sessions with eight seeds at nought — no drive this harness can afford
  makes that a count — so what the bar was groping at is now asked as
  arithmetic: walk the target out of the government through the game's own door
  and ask the kind's own `done` either side, and ask the resolution whether it
  files the aim as `done` or as `gone`. They are one ternary apart and a build
  that always said `gone` passed everything the arm asked before. A count of two
  proves a mechanism fired twice; it never proved it was right.
  **AND SOME QUANTITIES ARE EPISODES WEARING A RATE'S CLOTHES, which is worse
  than a small sample because the pooled figure LOOKS large.** Three arms in one
  run: the caretaker's share of formations read .105 against .027 either side of
  one card, and nine of twelve seeds carry no caretaker at all -- the whole gap
  is three republics that fell into a crisis against one that did, the paired
  difference over thirty-two seeds is +.020 at 0.93 standard errors, and two of
  the five seeds that move go the OTHER way. The pooled share HALVES when the
  sample triples, which is what a statistic dominated by rare episodes does. And
  its denominator is not independent of its numerator: a quiet seed reads
  exactly 60 formations and a seed in crisis 65 to 101, because the extra
  formations ARE the caretaker's own retries. The cordon is the same shape --
  0.306 raisings a seed with a standard deviation of 0.624, and three
  twelve-seed blocks of ONE build reading 1, 4 and 6 against a bar of 2. Before
  gating a count of a rare event, ask whether the thing is a rate at all: count
  the SEEDS that carry any, take the median rather than the pooled share, or
  make it a tripwire and move the correctness to a leg with no dice. A fraction
  whose bottom grows with its top is not a rate.
- **A book whose cards are about something the model has no channel to is a
  book of decoration, however carefully each card is authored.** Every statute
  reaches the model through `eff`, `mood`, `rev`/`exp` and `auth`, which is
  enough for a health statute because a health statute is ABOUT the indicators.
  It is not enough for a book about the ballot or a book about the states:
  42 of those 48 cards named a mechanism nothing consulted. The Authority
  book's shape is the answer — ONE number every statute in the book reaches,
  so there is nowhere for a card to be decorative from — and the assertion
  drives every statute to its top rung and reads that number.
- **A probe that joins two readings into one string lets either half carry the
  other.** S17n's Primary Elections check compared
  `String(on) + '/' + String(refusal)`, so removing the first mechanism
  entirely still passed on the second. Compare component-wise, and when a
  statute has two halves, say so. Its neighbour is the same mistake in a
  different coat: **a test that a number ROSE is not a test that it moved the
  way the card says** — equalisation was checked by "the poor state rises",
  which a statute that simply added to every state would also pass.
- **A `typeof` FALLBACK THAT WRITES A SHARED FIELD IS A SECOND WRITER WEARING A
  GUARD, and two slices in one programme shipped it under a comment promising
  one writer.** S21t wrote "exactly ONE writer, every site goes through it" and
  three sites did not; two of them were the election's own clock, so the player's
  endorsement lapsed in `q.endorsement` -- the MIRROR -- and stood forever in
  `q.endorsedBy`, the half the panel, the turnout and the objective read. S21u
  wrote the same sentence and each of its two buttons carried
  `if (typeof v21CordonTick === 'function') v21CordonTick(S); else S.cordon[pid] = true;`.
  A top-level declaration in this file is always defined by the time a button
  handler runs, so the branch cannot fire -- which makes it not a safety net but
  a line that falsifies the claim above it and would silently own the field if it
  ever did. Call the function. And a comment asserting that every site goes
  through one writer is not a reading of the sites: grep for the field.
- **A relation declared on one card and not the other is a one-way door.**
  S17m's conflict table is ONE central symmetric array rather than a
  `conflicts:` field on each card, for exactly that reason: with per-card
  declarations, symmetry is something a check has to go looking for, and this
  file's history says it will eventually not be there. Declare a pair once,
  index it both ways, and assert BOTH directions — a block that only works one
  way round passed the first version of the assertion.
- **A mode with one value is a field nothing reads.** Ruling 11 asks for BLOCK
  and SUPERSEDE; only BLOCK had approved pairs, so `supersede` is not in the
  code at all rather than shipped as an unused branch. An enum whose second
  value never occurs is the same decoration as `st.court.size`, and it rots the
  same way.
- **A field a wrapper READS is as dead as a field nothing reads, and looks
  exactly as alive.** S16e's memory wrapper keyed on `a.pid` and nothing in
  three megabytes ever wrote `a.pid`, so a whole channel — every hostile verb
  the player has against another party — had not fired once across two slices.
  Its whitelist also named `radicalise`, an id no action carries. The rule from
  `st.court.size` runs both ways: before keying on a field, grep for a WRITER,
  and when the answer is a hand-kept list of ids, cover the surface and assert
  the coverage instead — `V17_MEMORY` fails `roads.js` if a verb arrives
  without a weight, which is the guard a whitelist can never have.
- **A borrowed paper type reaches into whatever the original paper pointed at.**
  S16e's AI demand letter was posted as a `faction_demand` with `faction:0`, so
  answering another party's letter moved the loyalty of the PLAYER's own first
  caucus by sixteen. Reusing an inbox type inherits every branch that keys on
  it — the choices, the answer arm and the ignore arm — so a new kind of letter
  gets a new type, not a convenient old one.
- **A shared body that is right for the new caller can still be wrong for the
  old one.** `partyBillSupport` reads TWO fields for one idea —
  `playerPosition` at 24/-28 and `lines` at 16/-18 — so S17k's floor Core,
  writing both, made the player's declared line worth 40 where it had been
  worth 24 since S10b. Nothing failed; a button just got 67% stronger. When
  you extract a Core from a handler, grep every field it writes for a SECOND
  reader that the old caller was already feeding, and pin the old number in
  the assertion rather than reading it off the constant.
- **"The government holds it" and "this party holds it" are different
  questions, and `holdsDept` only answers the first.** It asks whether
  `st.exec[dept]` is anywhere in the coalition, so every partner in the room
  passes — which handed the whole order book to a party sitting in no office
  at all, for the player as much as for an engine. `officeMine` (S17a) is the
  player's side of it; a gate that decides who may *sign* has to ask about the
  actor by name.
- **`typeof x === 'string'` is not validation, and the UI is not the validation
  layer.** The custom start checked every id against a registry except its two
  chamber states, which took any string at all — and since an unknown string is
  neither `'abolished'` nor `'suspended'`, apply read it as a house that SITS.
  Anything a blob can carry is reachable without ever passing a control, so the
  cleaner holds the line, and it holds it against the same table the controls
  are drawn from. One list, offered and accepted.
- **PINNING THE DICE AFTER `newGame` DOES NOT PIN THE REPUBLIC `newGame` BUILT.**
  `mintSeed` reads `Date.now()` deliberately — the one thing that must not be
  seeded is the choice of seed — so a probe that sets `S.rngState` on the way
  out of `v6NewGame` fixes the stream from that point and fixes nothing about
  the board it was rolled into: different leaders, different purses, different
  figures every run. S18e's assertion counts initiatives, which depend on all
  three, and it failed one run in three of an unchanged build. `SEED_OVERRIDE`
  is the instrument, and `newGame` consumes it, so it is set before every call.
  The sharp part is what the flake did to the reasoning: a term I had argued
  was decoration measured as live twice, and both answers were noise — had it
  landed the other way the slice would have shipped a knob nothing can turn
  with a sentence on the panel advertising it. **A poison result taken on an
  unpinned probe is not a result**, including the ones that came back red.
- **THE POISON LIST COMES FROM THE DIFF, NOT FROM THE ASSERTION.** Writing one
  poison per thing the assertion mentions proves the assertion and says nothing
  about the slice: S18d changed six things, six poisons were written from the
  assertion's own words, and three of the six changes had no arm at all — the
  custom start's conflict drop, the struck article leaving the document, and
  the statute book's call into the table were each written, shipped and never
  read by the harness. All three showed GREEN, which is exactly what a covered
  mechanic looks like. Enumerate the slice's changed lines, write one poison
  per change, and a change with nothing to poison is a change with no
  assertion. The same run then answers the other half: a change whose poison
  cannot redden anything is a knob nothing in the game can turn, and three of
  S18d's call sites came back out on that reading.
- **THE ONE DOOR EVERY READER GOES THROUGH IS THE ONE PLACE A NEW TERM REACHES
  EVERY READER.** S21j measured a defect in the BALLOT — courting a bloc lowered
  an opposition party's own support, on every one of 1,683 runs — and put the fix
  in `affOf`, on the reasoning that it is the single function all eleven bloc
  calculations call, so adding the term anywhere else would be eleven terms. It
  is eleven terms; that is the problem, not the argument for it. `affOf` prices
  the formation, the interests, the coalition's arithmetic and the rally too,
  and the coupling took the coalition pressure ladder from 24 climbs to 13 and
  made its middle rung occur ZERO times against thirteen — three slices' worth
  of mechanism re-priced by a change whose only measurement was electoral. Three
  arms reddened and every one was about coalitions. Put a term where the defect
  was MEASURED; a chokepoint is a reason to check what else reads it, not a
  reason to put everything in it. And assert the narrowing as well as the
  reading, or the next slice puts it back.
- **`document.body.textContent` INCLUDES THE 3.9 MEGABYTES OF `<script>`, so an
  on-the-page assertion written that way matches its own subject's comment.**
  S21i's leg asked whether the page said "the SD were further along the same
  road" and passed with the whole clause deleted, because the phrase was in the
  code comment explaining the feature. `innerText` fixes that and introduces the
  opposite error: it reports what is VISIBLE, and S17r folds the long panels by
  default, so a true sentence inside a shut fold reads as absent and the leg
  reddens on a working build. Read the EMITTER — `v16AiPanel()` returns a
  string, which no script source can reach and no fold can hide — which is what
  the manifesto arm has always done. Both wrong readings were tried in one
  slice, in that order.
- **A `>` with no tolerance cannot catch a term that cancels to NOUGHT.** The
  same slice's `widensTheGap` was `gap1 > gap0`, and the mistake it exists to
  catch — a flat bonus added to every card instead of multiplying the aim's own
  weight — adds the same amount to both sides and cancels exactly. The two
  doubles differed by 1e-16 of floating point and `>` said true, so the poison
  passed. When the failure mode is "this quantity does not move", the bar has to
  be a real distance and the real movement has to be measured beside it: .02
  against a measured .096.
- **WHERE A NUMBER IS READ IS PART OF WHAT IT MEASURES, and S21l found the same
  mistake three times in one slice — twice in a probe and once in the game.**
  `partyPurseTick` pays every party INSIDE `endTurn` and BEFORE `v16AiTurn`, so
  a board read from outside `endTurn` is 10% cooler than the one the gate rolls
  against: a leg summing `v18TempoOdds` from the outside reported a budget 10%
  over on a build that holds it, and the tempo tracker, taking its average at
  the END of the session loop on a board every party had just spent down, ran
  the whole campaign 10% over for the same reason. Then a wrapper installed to
  capture what the tracker read kept the LAST value the reader returned, where
  the reader is also called by its own fallback once per party — so it recorded
  a board from the middle of the loop rather than the session-opening one. Read
  the number through the game's own path, at the moment the game asks for it,
  and when you wrap a function to catch a value, ask which of its calls you
  mean. This is `st.turn + 1` in a different unit, and its neighbour is: **a
  comparison written into a return object is evaluated when the OBJECT is
  built.** `aimsAtGovernment: tgt.ref === S.ruling` sat in a return whose arm
  had, three legs earlier, called `fresh` and driven forty more sessions; it
  compared against whoever governed at the END of the arm and passed for two
  slices because the two happened to be the same party.
- **A CAPABILITY CAN BE PRESENT, CHAIRLESS AND STILL UNREACHABLE, BECAUSE ITS
  PREDICATE ASKS ABOUT THE PLAYER.** S21n's plan read as though an engine
  government had no code for reopening a coalition agreement; it had the whole
  body, extracted chairless by S21h. What stopped it was `v17CanRenegotiate`
  refusing on `!leads(st)` — "does the PLAYER head the government" — so the
  reopening was open on 178 of 178 player partner-sessions and 0 of 1,969
  engine ones. Before writing a mechanism an engine "does not have", read the
  PREDICATE in front of the body it already has. And when you widen one, the
  default has to be pinned as well as the new case: `leads(st)` is exactly
  `playParty(st) === st.ruling`, which is what `st.ruling !== (actor ||
  playParty(st))` says with the actor left out.
- **A PARTY'S AUTHORED TABLE IS NOT ITS OPINION OF WHAT IS BEFORE THE HOUSE.**
  `v21Stance` reads `PARTY[pid].wants`, and a `wants` table of a dozen entries
  against a book of 582 statutes names the bill before the House on 20.9% of
  readings — so "a bill this party wants" is a rare event and "one it wants and
  one it does not" is a vanishing one: nineteen party-sessions in 10,080. S21q's
  plan was written on that channel and would have shipped a card that fired
  never. What a party's benches would DO is `partyBillSupport`, and `divisionOf`
  hinges it on a logistic centred on fifty, so which lobby a party leans to is a
  question the game already answers — 30.7% of party-sessions have one of each.
  Before gating a verb on an appetite, measure how often the appetite exists,
  and prefer the reading the consequence is computed from.
- **A WRAPPER THAT DECLARES FEWER PARAMETERS THAN ITS BASE EATS THE REST,
  SILENTLY, AT EVERY CALL IN THE GAME.** `sponsorBill` gained `sponsorId` and
  `quiet` in S17a — whose own comment says it fixed exactly the mis-attribution
  those arguments prevent — and the S9 clause wrapper, in a LATER chunk and
  therefore the `sponsorBill` the whole game calls, went on declaring six
  parameters and passing six. Four slices of callers had their sponsor
  discarded and their bill re-attributed by the `owner` derivation instead.
  A survey of the file found one more, and it is worse: `ballot`'s S16 pact
  wrapper declares `(st)` against a base of `(st, noise)`, so `ballot(st, true)`
  — the actual election — has run without its own ±8% election-night swing since
  S16 and every result is exactly the projection. **When you add a parameter to
  a function, grep `var xBase = fn;` and widen every wrapper**, and when you
  write a wrapper, declare and forward what the base declares. This is
  `MAP.md`'s "a modifier nothing reads is a lie on the card" arriving through
  the argument list, and it is the one shape of it a static check CAN catch, so
  S21s carries both fixes and the check together. Neither is fixed in the slice
  that FOUND them, and the reason is the second half of the rule: widening a
  wrapper is a correctness change with the blast radius of everything the
  argument reaches — five arms went red on the first build that carried the
  sponsor fix, because `v17DealEvent` is handed the sponsor — so it belongs in
  a slice whose subject is the fix, not as a rider.
- **A GATE THAT ASKS FOR A DECLARED POSITION EXCLUDES THE ONE PARTY WHOSE
  POSITION IS NOT DECLARABLE.** `v20PressWhy` refuses an actor with no line on
  the bill, and `v17FloorWhy` has refused a line on a bill you sponsored since
  S17 — so the sponsor was the one party in the House that could not work the
  votes on its own bill, measured at **520 refusals in 520 askings**, every one
  the same sentence, and `bill.pull` never once written for a sponsor's own
  benches in 757 bill-sessions. The player's half was worse: `playerPosition`
  is written only when `owner === 'player'`, so a player leading the government
  had no position on the government's own bill and the card drew `Support the
  bill` ENABLED over a handler that refuses it. When a gate reads a FIELD,
  ask which actors that field is never written for — and prefer one reader that
  answers the question the act already settled (laying a bill is a position)
  over a literal repeated at every call site. Two call sites here read the same
  literal, and the second decided the DIRECTION: a build that answered the gate
  and not the body whips a sponsor's own members against its own measure.
- **A LEG THAT CALLS THE ORACLE PROVES THE ORACLE, NOT THE CALLER.** S21q's
  picker has four filters — take the best counterparty and not the first, ask
  whether the taker would take it, `v21TradeWould`'s own reading, and the
  offerer's own floor — and the leg called `v21TradeWould` **itself** and then
  asked only that the picker had returned *somebody*. All four poisons came
  back GREEN, and a fifth switched the card's `addInbox` off while the leg went
  on counting the PICKER's answer rather than `st.inbox`. Five of the seven
  green poisons in that slice were the probe and the game was right throughout.
  A filter is asserted by a property of what the code CHOSE, measured against
  every candidate it could have chosen through the game's own functions — never
  by re-asking the question the code asks. And count an outcome where the
  player would meet it: the inbox, the card, the log, not the picker's return.
  Its own corollary bit the same slice twice more: **the arm a poison is judged
  against is part of the poison** — two were run against a neighbouring arm
  that never mentions the mechanism and were meaningless in both directions —
  and **a measurement taken to size a bar must ask the question the code
  asks**: the refusal rate was first measured over every counterparty
  *including the player*, whom the picker never asks, and came out at 13.6%
  against a true 6.2%.
- **A RULE OF THUMB IN FRONT OF A SCORING FUNCTION CAN NAME A BRANCH THAT
  CANNOT FIRE.** S21p's government answer to the street chose between conceding,
  stalling and refusing by a hand-written rule — "concede where this
  government's own table wants the statute anyway" — and the same slice had
  already measured that the street asks for statutes NO party's table names, 0
  of 50 demands. So `carry` was unreachable by construction, 13 answers came out
  8 talks, 5 refusals and 0 carries, and every movement still ended exhausted.
  The rule read perfectly sensibly and contradicted a number measured an hour
  earlier in the same slice. Asked through `v19Try` and `v19Standing` the same
  board gives carry 264.3, talks 260.8, refuse 255.3. This is the entry below
  wearing the other hat: there a picker maximised the cost, here one named a
  case the game cannot produce. **When a card chooses among its own options,
  the objective chooses.**
- **AND THE TERM HAS TO BE READ OFF THE THING THAT PERSISTS, NOT OFF THE RECORD
  OF IT.** Same slice: the government's liability was written as "a demand
  stands", and refusing a demand CLEARS it — so the objective preferred
  refusing because refusing made the liability vanish, when refusing a movement
  is what turns it into a general strike. Read off the pressure, the three
  answers price themselves. Before writing a term as "X exists", ask what the
  action under test does to X's existence.
- **A PICKER IN FRONT OF A SCORING FUNCTION CAN MAXIMISE THE COST.** S21o's
  first `descend` took "the most powerful measure the government can reach",
  and `power` is the one field `v19Standing` can barely see (+0.17 to +0.37
  through a flight term) while the mood a measure offends is what it sees in
  full — so the rule picked the row costing -15.478 of `v17Utility` over ones
  costing -1.479 and -2.168, and `v19Outcome` came back at exactly -1, THE
  CLAMP, on every rehearsal against +0.01 to +0.05 for every other card in the
  same open set. At `ruthless`, where `sim` is 1.9, that is a card no
  government could ever play, and the whole slice would have shipped as
  decoration with a green assertion in front of it. When a card has a target,
  ask WHICH ONE through the objective the game already has — `v19Try` for the
  clone, `v19Standing` for the reading — rather than by a rule of thumb over
  one authored field. S21g had already ruled that a hard gate in front of a
  scoring function is a defect; this is the same mistake one layer down, and
  the tell is a rehearsal that returns the clamp rather than a spread.
- **A number on a row that cannot occur is `st.court.size` in a lookup table.**
  Same slice: `descend` was given a weight under the `enter` aim, and a party
  aiming to enter a government is not leading one while the card's gate needs
  `st.ruling === pid` — so the row could never be read. Deleted rather than
  shipped, which is what the poison run is for; the same run kept the six rows
  that can be.
- **A LEG MADE ONLY OF REFUSALS IS PASSED BY A BUILD THAT REFUSES EVERYBODY.**
  Three legs asked that the reopening still be refused for the player, refused
  for a party that leads nothing, and not refused on the chair for the party
  that leads — and the poison that BREAKS the actor's default, refusing every
  caller, came back green on all three. When you widen a gate, one leg has to
  be the case that must come back OPEN.
- **A PARTY THAT CANNOT AFFORD ITS DECK LOOKS EXACTLY LIKE A PARTY WITH NO
  DECK, and S21m's plan spent its whole design on the wrong one.** `govern` was
  in three of thirteen `post:` arrays and a government's open set was 1.25 cards
  with 45.6% of its sessions EMPTY, so "widen the list" is the obvious reading —
  and opening three more cards moved it to 49.4%, because `organise`, whose only
  condition is having the money, was refused for want of it 778 times in 998. At
  `V17_BURN.govern = .70` the party in office ran a purse of p50 20 against a
  back-bencher's 66 while the deck cost 22 to 42. When a capability looks
  unreachable, ask what the `can` actually refused on before widening what it is
  offered. The fix that shipped is a rule rather than a rate — no party spends
  itself below the price of acting, the reserve being the dearest card its own
  posture can draw — and the tell that it was the right shape is that EVERY
  posture improved, not only the one with the defect. A rate change (`.46`) hit
  the same number by cutting the funding the vote model reads, which is a
  difficulty change wearing an AI fix's clothes.
- **A PROBE THAT READS A STOCK WHERE THE RULE CAPS A FLOW MEASURES NEITHER.**
  The reserve leg read the purse either side of `partyPurseTick` and asked that
  it not fall below the reserve — and the tick pays the party its income BEFORE
  it spends, so the purse came out higher both times and the leg passed with the
  reserve deleted. Wrap the thing the rule actually governs. Its neighbour, from
  the same leg: it drove `S.ruling`, which on that board is the PLAYER, whom the
  tick skips entirely because a human's party spends nothing it was not told to
  — a spend of nought, passing everything. And its other neighbour: two legs
  pushed a threshold by scaling their subject's OWN seats, where the subject was
  a small party and the bar was never crossed, so one read the posture it was
  trying to disprove. Set an absolute, and record the raw reading the leg is
  holding out against.
- **Setting a case aside to make a claim exact can make the leg blind to the
  mechanism.** Every declared floor move at a thinking level is against the
  arithmetic — 53 of 53 — once `pressure` is excluded, and excluding it is
  right, because `pressure` writes the SPONSOR's line rather than the actor's.
  But `V19_FLOOR_BAR`'s whole effect is on that verb: deleted, the declared
  moves stay 42 of 42 and `pressure` goes from ONE move to FIFTY-FIVE. The
  poison came back GREEN on a leg that had just been made exact. When you carve
  a case out of an assertion, ask what the carved-out case is measuring, and
  gate it separately.
- **Never set `fill` on a bare `text` selector in a chart's stylesheet.** A CSS
  fill beats an SVG presentation attribute and silently greys out every label
  the chart colours by attribute.
- Never key CSS to a colour literal (`circle[fill="#0000BC"]`). A palette
  retune then unstyles the thing it was propping up, silently.

Also: CSS chunks conflict by source order (last wins, equal specificity) — new
rules go at the end or under a body-class scope; later chunks splice rendered
HTML by marker strings and query DOM sentinels, so renaming a class, heading or
slot attribute can silently disable a feature. `marker-integrity` asks, of the
markers written as a literal at the call site, whether an **emitter** of that
string exists outside the splice; it says plainly which markers it cannot ask
that of (12 generic structural strings) and it cannot see a marker built in a
variable at all. Those, and the DOM slots, are guarded by playtest steps —
`splices-land` for the three whose failure is silent.

## Commands

Run `node checks/run.js` before every commit. Run the harness that covers what
you touched; a SKIP is never a PASS.

- `checks/run.js` — 12 static checks, <5s.
- `tools/playtest.js` — scripted turn, reload/resume, corrupt-save behaviour,
  all 15 views, 3 viewport screenshots (`--quick` for boot-only).
- `tools/roads.js` — **217 content assertions**, the largest harness here: the
  descent, the constitution, the ministry, the interests, the regional term, the
  capital floor, what a bill does when the chamber it was laid before no longer
  exists, that every one of the 582 statutes carries four distinct rungs, that
  every clock printing a session count charges exactly that many End Session
  clicks, and that no number went bad on any of it. Run it after any content
  change.
- `tools/determinism.js` — seven properties of the seeded dice. Drive the model,
  not the modal queue: which queued sheets a UI run pumps depends on click
  timing, so a UI-level comparison measures the harness, not the game.
- `tools/chamber.js` — seat-map geometry, overlaps, label collisions, rendered
  size per tier. `tools/seats.js` — palette contrast, ΔE, colour-vision sim.
- `tools/tiers.js` / `tools/tabs.js` — layout at each tier boundary.
- `tools/contrast.js` — every element's text contrast against the background
  composited up through its translucent ancestors, and every pressable
  control's size, on all fifteen pages plus a raised sheet, at the three
  tiers. 44px on the phone, 32px above it. Exemptions live in
  `checks/contrast.json`, and it is empty.
- `tools/pacing.js` — plays a length option to its end and reports the arc.
- `tools/poison.js` — proves a body is dead before you delete it.
- `tools/rungs.js` — the authored prose: `--brief` a book, `--apply` a shard
  (idempotent), `--check` the 582 statute ladders against the house style, and
  `--corpora` the five authored registries — 60 measures, 90 orders, 81
  articles, 20 treaties, 11 capitals of dispatches carrying 55 lines, 727
  pieces — which fails on a breach and then reports the punctuation residue in
  the rest of the file without failing on it. `--residue` prints that list in
  full rather than its first six.
- `tools/prose/` — the blind measurement rig: `sweep.js` emits every ladder for
  an unaided reader, `sweepscore.js` scores it. Its README carries the one rule
  these tools exist to enforce: **never re-measure the sample you repaired
  against.**

The prose standard is `docs/PROSE-STYLE.md`: the owner's writing skill carried
verbatim, plus a statute addendum. The statute book's own 2,910 pieces (582
descriptions and 2,328 rungs) are written to it, as are the 727 in the five
registries, and the punctuation residue outside both stands at the 44 lines the
owner has ruled on — S17 added fifteen more and S17t took them back out.
`docs/PROSE-RESIDUE.md` names the ladders that two blind readers still fail.

Playwright resolves from the global install (`npm root -g` + `createRequire`);
bare `require('playwright')` fails from this repo. WebKit downloads are blocked
by this environment's network policy — the Chromium phone viewport is the named
substitute, and it is reported as a SKIP.

## Working state

`docs/STATE.md` says which slice is current and what's next — update it in the
last commit of every PR. Workflow: one PR per complete slice, branch
`claude/<slice-name>`; commit before risky edits (git is the undo — /rewind
does not capture Bash or subagent edits).
