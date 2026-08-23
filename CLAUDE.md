# Parliament: Vale

One product: `vale.html` — a complete turn-based government simulator in a single
self-contained file. Everything else in this repo is tooling or documentation.

IMPORTANT: never read `vale.html` whole — it is 1.27 MB and consumes most of a
context window. Use `grep -n`, Read windows of ≤80 lines, and the Explore agent
for open-ended sweeps. `docs/MAP.md` holds the structural map; read it before
touching the file.

## Invariants (full policy: docs/AGREEMENT.md)

- `vale.html` is the whole app: no build step, no package.json anywhere, no
  runtime dependency, no `<script src>`; it must open from `file://`.
- No external reference beyond the Google Fonts link that is scheduled to leave
  (`checks/baseline.json` holds the shrinking allowlist). Never add one.
- Saves may break pre-release, but only loudly: a blob that can't load gets a
  clear message and is left untouched in localStorage. Silent corruption or
  silent discard of a save is the worst possible failure here.
- Three layout tiers, all first-class: phone ≤760 (reference: iPhone on
  Firefox = WebKit engine), tablet 761–1179, desktop ≥1180 (focus: 1500px
  Chromium). Improving one tier at another's cost is a regression.

## The two rules the file's history punishes

- Never rebind a top-level function name without capturing the previous body
  (`var vXFooBase = foo;` first). Every reassignment site must be adjudicated
  in `checks/dead-bodies.json` or checks fail.
- Never pass a reassignable function identifier by value at top level
  (`addEventListener('click', foo)` at column 0) — it freezes the body at that
  vintage. Three known offenders exist (`#btnEnd`/`#btnHelp`/`#btnUndo`,
  scheduled for fix in slice S1); do not add a fourth.

Also: CSS chunks conflict by source order (last wins, equal specificity) — new
rules go at the end or under a body-class scope; later chunks splice rendered
HTML by marker strings and query DOM sentinels, so renaming a class or heading
can silently disable a feature (checks catch the literal-marker class only).

## Commands

- `node checks/run.js` — static checks, <5s, run before every commit.
- `node tools/playtest.js` — headless scripted turn + reload/resume + 3
  viewport screenshots (`--quick` for boot-only). Needs the global playwright
  install; it prints SKIP with instructions where missing — a SKIP is never a
  PASS. WebKit downloads are blocked by this cloud environment's network
  policy; the Chromium run is the named substitute.
- Verification bar and PR discipline: docs/AGREEMENT.md §E; the playtest skill
  (`.claude/skills/playtest/`) is the step-by-step procedure.

## Working state

`docs/STATE.md` says which slice is current and what's next — update it in the
last commit of every PR. Workflow: one PR per complete slice, branch
`claude/<slice-name>`; commit before risky edits (git is the undo — /rewind
does not capture Bash or subagent edits).
