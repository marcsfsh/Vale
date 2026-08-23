# The working agreement

Approved by the project owner, 2026-08-23 (session zero). This is the standing
policy for all work in this repo. It changes only when the owner re-rules;
record the re-ruling here. Sources: [docs:…] = verified Claude Code doc claim,
[brief] = the session-zero opening brief, [interview] = a verbatim ruling
(§Interview below), [noted choice] = docs-silent, simplest-thing-noted.

## A. Ground rules

1. **One file.** `vale.html` is the whole application: no build step, no
   package.json anywhere, no runtime dependency, opens from `file://`. Dev
   tooling prefers what a machine already has (node; the global playwright and
   bundled Chromium in cloud sessions); in-session installs *for verification
   only* are covered by the owner's authorization ("install playwright/whatever
   is necessary") and never touch the repo; tooling degrades loudly where a
   capability is absent.
2. **Three tiers, all first-class** [interview]: phone ≤760 (reference: iPhone
   on Firefox = WebKit engine), tablet 761–1179, desktop ≥1180 (focus 1500px/
   Chromium; comfortable-wide first, density opportunistically). A change
   improving one tier at another's cost is a regression. The breakpoint-
   consolidation slice may propose adjusting internal boundaries — propose the
   shape, the owner rules.
3. **Saves** [interview — supersedes the brief's invariant 3]: pre-release,
   updates MAY break existing saves — but breaks must be **loud**: a blob that
   can't load produces a clear in-game message and is left untouched in
   localStorage. Silent corruption or silent discard remains the worst outcome.
4. **Self-contained.** No new external reference, ever. The Google Fonts link
   leaves with the refresh's type decision (S5); the allowlist in
   `checks/baseline.json` then becomes empty, forever, and is checked.
5. **Practices from the docs, not precedent** [brief]. Where the docs are
   silent, the simplest thing that works, with the choice noted.

## B. Documents

| File | Update trigger | Failure it prevents |
|---|---|---|
| `CLAUDE.md` (≤200 lines; [docs: best-practices deletion test, memory.md]) | when an owner correction should have been prevented by it; `/doctor` periodically | a fresh session reading the 1.27MB file whole, editing a dead body, adding a stale binding |
| `docs/MAP.md` [noted choice] | any PR that changes structure | cold sessions re-deriving the architecture |
| `docs/STATE.md` [docs: cloud sessions read only committed state] | every PR, last commit | the next session not knowing what landed |
| `docs/AGREEMENT.md` (this file) | only on owner re-ruling | re-litigating decided policy |

## C. Automation

- **`checks/run.js`** — static checks (syntax+strict ratchet, external refs,
  dead-body ratchet with `checks/dead-bodies.json` adjudication, stale-binding
  ratchet, literal-marker integrity with `checks/markers.json`, save keys,
  Math.random ratchet, size budget). Every check shipped with proof it can fail
  [brief]. Baselines only move toward their targets, with the reason in the PR
  that moves them.
- **`tools/playtest.js`** — headless scripted turn, reload/resume assert,
  console-error counts, screenshots at 390/834/1500; WebKit phone pass where
  installable, named SKIP with Chromium substitute where not. [interview: done
  bar; noted choice on mechanism.]
- **SessionStart hook** — runs the checks fast-path; stdout is context for the
  session [docs: hooks.md — SessionStart stdout is added as context on exit 0;
  committed hooks run on web]. Context, never a gate.
- **`.claude/skills/playtest/`** — the verification-bar procedure, loaded on
  demand [docs: skills.md].
- **Committed permissions** in documented rule forms only (exact / `:*` prefix)
  [docs: permissions.md].
- **Deliberately not adopted** (no doc tie + repo failure): custom subagents,
  agent memory, Stop-hook gates, PreToolUse file guards, output styles, extra
  MCP servers, CI (optional later if PR discipline needs a server-side gate).

## D. Workflow

- **One PR per complete slice** [interview]: never a partial feature after
  merge, never too small — related fixes travel together. Branch
  `claude/<slice-name>`, PR to `main`, owner approves.
- **Fully autonomous within this agreement** [interview]; stop only for what
  this agreement reserves to the owner (direction picks, baseline/budget
  re-sets, game-design changes beyond an approved slice), destructive or
  irreversible actions, and genuine scope changes.
- **Every PR body** [brief]: hypothesis → the command that proves it → the
  check that would have caught it → the fix; pasted check output (SKIPs called
  SKIPs); screenshots for visual changes; a "not verified" list.
- Commit before risky edits (git is the undo) [docs: checkpointing.md].
- Corrected twice on the same thing → propose the one permanent line (here or
  CLAUDE.md) in the same reply [brief].

## E. Verification bar — every change to vale.html, no exceptions

1. `checks/run.js` green, output pasted.
2. `tools/playtest.js` green at all three viewports (WebKit phone where
   installable). If the harness can't run on this machine, run it in a cloud
   session before merge and say where it ran.
3. Layout-touching changes: all three tiers explicitly, including 761–1179.
4. Reload → autosave restores (harness-asserted).
5. Save-shape changes: the loud-break behavior demonstrated (old blob → clear
   message, blob untouched).
6. Phone verification when it matters: a playable build as a private Artifact
   for the owner's iPhone — gated on the localStorage-persistence probe verdict
   (see STATE.md); until confirmed, Artifact builds are look-and-feel only.
7. Anything not runnable is a named SKIP with its substitute — never silent.

## Slice order

S0 tooling (this) → S1 correctness → S2 chain consolidation (poison-proof
deletions) → S3 seeded PRNG → S4 look mockups (parallel S1–S3; ≥5 dark-first
directions, owner picks) → S5 token foundation (fonts embedded, link out) →
S6+ refresh tab-by-tab (breakpoint consolidation first; viz redesign) → S7
onboarding → S8 pacing honesty. STATE.md tracks live status.

---

## Interview — the owner's decisions of record (verbatim, 2026-08-23)

**Platforms.** Authoritative phone: *"iPhone on Firefox"* (WebKit engine with
Firefox chrome). Desktop: *"Whatever file:// opens in - but, focus on
1500px/chromium"*. Desktop ambition: *"Density opportunity, aiming for a
comfortable wide layout"*. 761–1179 band: *"First-class tablet tier"*.

**Game feel.** Determinism: *"Seeded PRNG everywhere"*. Difficulty: *"Yes, it's
a sandbox"* (near-unloseable on normal is the design; leave balance alone).
Pacing: *"Player-chosen, both real"* (each length option delivers a complete
arc; default untouched). Theme: *"Honestly the app needs a whole refreshed
look. Ask a round or two of questions at the end for this"* (asked — see The
refreshed look below).

**Code policy.** Save compatibility: *"Nope. Until/unless the game reaches
final release, new updates are expected to break existing saves."* Refactor:
*"Complete the chains, err on the side of caution to avoid regression"*.
Filename: *"Keep vale.html"*. First-run: *"Trim slightly, more clear guide
through the 'onboarding' panels"*.

**Priorities & working style.** Top workstreams: *"Look + layout refresh"* AND
*"Stabilise the code first"*. Git: *"PRs per slice. Slices shouldn't be too
small and should never leave a feature or update only partially complete after
merging a PR"*. Autonomy: *"FULLY autonomous within agreement"*. Done bar:
*"Checks + headless + install playwright/whatever is necessary + my phone
(if/when necessary)"*.

**The refreshed look.** Identity: *"New look, same gravitas"*. Type: *"New
fonts with the refresh"*. Character: *"Calm, data dense command desk"*.
Process: *"Mockups first, then build"*. Foundation: *"Dark-first"*. Directions:
*"Civic modernism, Situation room, Modern ministry, At least 2 others"* (≥5
total). Motion: *"Subtle and purposeful"*. Data viz: *"Redesign the viz layer"*.

**The chosen identity (2026-08-23, after two mockup rounds):** round one
narrowed five directions to Modern Ministry and Civic Modernism (*"a tie…
present 6 final options: 3 variants of each"*); the runoff's verdict:
**"Ministry C is the finalist"** — **Ministry Precise**: Ministry's materials
on Civic's discipline. Tokens: ground #141A17, panel #1A211D, cell #171D18,
rule #26302A; ink #EAE7DC, muted #97A099; brass #BFA14E (primary), #C77B62
bad, #6FAE8B good. Type: Marcellus (masthead/headlines), Archivo Narrow
(caps labels/buttons), Public Sans (prose), IBM Plex Mono (all numerals,
tabular). Reference boards: the "Ministry Precise · The Design" page of the
mockup canvas (Overview desktop+phone, Drafting Desk, Election Night). S5
implements this as vale.html's token system with measured font subsets.

**Seat-map ruling (owner, 2026-08-23): "Must maintain individual circles for
parliament seats."** The hemicycle is always drawn seat by seat — as the
game's `hemiMap` already does — never smoothed into arc segments. Binds the
S6 viz redesign and every future chamber/senate/court display.

**Party-palette ruling (owner, 2026-08-23): "The original color pallet for the
parties … needs to be intact. The exact color values can shift as needed so
long as they remain close to the original."** Followed by: *"Not good enough as
far as making the colors legible goes."*

Five of the seven are used **unchanged**. Two are lifted in lightness with
**hue locked** — they were not legible at any rim strength:

| party | colour | change | contrast on the seat ground |
|---|---|---|---|
| RSF Revolutionary Socialist Front | `#9D0000` → `#C70000` | ΔE 9.1, hue locked | 2.01 → 2.83, rimmed |
| LP Labor Party | `#FF0000` | — | 4.33 |
| SD Social Democrats | `#FFA097` | — | 8.84 |
| FP Federal Party | `#FFFB00` | — | 15.70 |
| CUP Conservative Union Party | `#03F2FF` | — | 12.48 |
| TVC Traditional Values Coalition | `#00ABEF` | — | 6.65 |
| PNL Patriot Nationalist League | `#0000BC` → `#1551FF` | ΔE 17.0, hue locked | 1.42 → 3.01, rimmed |

**What the measurements established, and it is worth not re-deriving:**

1. A dark colour cannot be made legible on a dark ground by treatment alone.
   `#0000BC` measured **1.42:1** — the rim helps it be *seen*, not *read*. The
   lift was necessary, and the owner's licence to shift values covers it.
2. The lit floor added for softness **made the dark colours worse** (PNL fell
   to 1.10:1 against the lifted ground). Floor opacity was cut accordingly.
   Any future "ambient" treatment must be re-measured against the darkest
   party, not the average one.
3. **Colour alone cannot carry this palette.** Vale has three reds and three
   blues; a search over hue-and-lightness showed no assignment is
   simultaneously faithful, high-contrast and mutually distinct at seat size.
   Free optimisation "solved" it by turning Labor's red into pink — rejected.
   Therefore legibility is carried by STRUCTURE:

   - **aisles** — a real angular gap (~2.6°) between blocs, so each party reads
     as a group even where two share a hue family;
   - **direct labels** — every bloc names itself on the arc with its seat
     count, so colour is never decoded against a legend (this also retires the
     separate legend, which became duplication);
   - **size** — seats large enough for their colour to register (election
     board r=2.7 in a 780-wide frame; compact chamber r=1.9);
   - plus the softening set: gentle floor, same-hue aura, the game's seat
     opacity, the brass despatch-box hairline, ivory rim on the two dark ones.

Seating order is the `PARTIES` `order` field (RSF, LP, SD, FP, CUP, TVC, PNL),
which also seats the coalitions contiguously — Popular Front left, Unity Front
centre, PNL right. Confirmed against `hemiMap`: it sorts parties by `order`,
pools all seats, and sorts by descending angle.

*Implementation notes for S6:* (1) the existing rim rule selects on the literal
fill (`svg.hemi circle[fill="#0000BC"]`) — a silent break if a colour is ever
retuned; reimplement it as a class on the circle, not an attribute match.
(2) `hemiMap`'s `total` parameter is declared but never read — the map draws
the sum of the seats object, so a seat table that doesn't total `CFG.seats`
silently draws a different-sized chamber. (3) Rounding drift is absorbed
entirely by the outermost row, which can in principle go negative.
