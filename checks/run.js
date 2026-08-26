#!/usr/bin/env node
'use strict';
/*
 * Static checks for vale.html — zero dependencies, node only.
 *
 *   node checks/run.js            check the repo's vale.html
 *   VALE_FILE=path node checks/run.js   check another copy (used by the proof-of-failure drill)
 *
 * Ratchet checks compare against the committed baselines in this directory
 * (dead-bodies.json, markers.json, baseline.json). A new reassignment site or
 * single-occurrence splice marker fails until it is adjudicated there with a
 * reason — that friction is the point.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const FILE = process.env.VALE_FILE || path.join(ROOT, 'vale.html');
const src = fs.readFileSync(FILE, 'utf8');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline.json'), 'utf8'));
const deadBodies = JSON.parse(fs.readFileSync(path.join(__dirname, 'dead-bodies.json'), 'utf8'));
const markerAdj = JSON.parse(fs.readFileSync(path.join(__dirname, 'markers.json'), 'utf8'));

const results = [];
function report(name, ok, detail) { results.push({ name, ok, detail }); }

/* ---- script block extraction (shared) ---- */
function scriptBlocks(text) {
  const blocks = [];
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(text))) {
    blocks.push({ code: m[1], line: text.slice(0, m.index).split('\n').length });
  }
  return blocks;
}

/* ---- 1. syntax + strict-mode ratchet ---- */
{
  const blocks = scriptBlocks(src);
  let syntaxOk = true, syntaxDetail = `${blocks.length} script blocks compile`;
  for (const b of blocks) {
    try { new Function(b.code); } catch (e) {
      syntaxOk = false;
      syntaxDetail = `block at line ${b.line} does not compile: ${e.message}`;
      break;
    }
  }
  report('syntax', syntaxOk, syntaxDetail);

  const strict = blocks.filter(b => /^\s*['"]use strict['"]/.test(b.code)).length;
  const ok = blocks.length === baseline.scriptBlocks && strict >= baseline.strictBlocksMin;
  report('strict-ratchet', ok,
    `${strict}/${blocks.length} blocks strict (baseline min ${baseline.strictBlocksMin}, target ${baseline.scriptBlocks})`);
}

/* ---- 2. external references ---- */
{
  const urls = src.match(/https?:\/\/[^"'<> )]+/g) || [];
  const rogue = urls.filter(u => !baseline.allowedExternalPrefixes.some(p => u.startsWith(p)));
  report('external-refs', rogue.length === 0,
    rogue.length ? `rogue: ${rogue.slice(0, 3).join(', ')}` :
      `${urls.length} URLs, all under allowed prefixes [${baseline.allowedExternalPrefixes.length}]`);
}

/* ---- top-level reassignment site enumeration (shared by 3 & 4) ---- */
// A "site" is a column-0 statement rebinding a bare identifier to a function
// (either `name = function...` or `name = otherName;`). Lines can hold several
// statements (see v6Menu/pv5CommandPalette on one line), so split on ';' first.
function reassignmentSites(text) {
  const sites = []; // {name, line, kind}
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^[A-Za-z_$]/.test(line)) continue;
    if (/^(var|let|const|function)\b/.test(line)) continue;
    for (const stmt of line.split(';')) {
      let m = stmt.match(/^\s*([A-Za-z_$][\w$]*)\s*=\s*function\b/);
      if (!m) {
        const f = stmt.match(/^\s*([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*$/);
        if (f) m = [f[0], f[1], f[2]];
        else continue;
      }
      sites.push({ name: m[1], line: i + 1 });
    }
  }
  // ordinal per name → stable key that survives edits above it
  const seen = {};
  for (const s of sites) { seen[s.name] = (seen[s.name] || 0) + 1; s.key = `${s.name}#${seen[s.name]}`; }
  return sites;
}

/* ---- 3. dead-body ratchet ---- */
{
  const sites = reassignmentSites(src);
  const problems = [];
  const knownKeys = new Set(Object.keys(deadBodies.sites));
  for (const s of sites) {
    if (!knownKeys.has(s.key)) problems.push(`unadjudicated site ${s.key} (line ${s.line}) — add to checks/dead-bodies.json with a reason`);
    knownKeys.delete(s.key);
  }
  for (const stale of knownKeys) problems.push(`stale adjudication ${stale} — site no longer exists, remove it`);
  const dead = Object.values(deadBodies.sites).filter(v => v.aliasCaptured === false).length;
  if (dead > deadBodies.maxDead) problems.push(`${dead} no-alias sites exceeds maxDead ${deadBodies.maxDead}`);
  report('dead-body-ratchet', problems.length === 0,
    problems.length ? problems[0] + (problems.length > 1 ? ` (+${problems.length - 1} more)` : '')
      : `${sites.length} sites adjudicated, ${dead} without alias (max ${deadBodies.maxDead}, target 0)`);
}

/* ---- 4. stale-binding ratchet ---- */
{
  // Stale class = value bindings executed at PARSE time (top-level, column-0
  // statements) of names a later chunk reassigns: the listener keeps the old
  // body forever. Indented bindings inside functions (e.g. showSheet's
  // [data-close] -> hideSheet at ~8046) re-evaluate per call and pick up the
  // live chain — not stale; documented in docs/MAP.md instead.
  const sites = reassignmentSites(src);
  const lines = src.split('\n');
  const stale = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s/.test(lines[i])) continue; // column-0 (parse-time top-level) only
    const re = /addEventListener\(\s*'[^']+'\s*,\s*([A-Za-z_$][\w$]*)\s*[,)]/g;
    let m;
    while ((m = re.exec(lines[i]))) {
      const ident = m[1];
      if (ident === 'function') continue;
      if (sites.some(s => s.name === ident && s.line > i + 1)) stale.push(`${ident} bound line ${i + 1}`);
    }
  }
  const ok = stale.length <= baseline.staleBindingsMax;
  report('stale-binding-ratchet', ok,
    `${stale.length} value-bindings of later-reassigned names (max ${baseline.staleBindingsMax}, target 0)` +
    (stale.length ? `: ${stale.join('; ')}` : ''));
}

/* ---- 5. marker integrity (literal string markers only) ---- */
{
  // literals fed to indexOf/lastIndexOf/replace, or passed as the marker argument
  // of the v8Insert helper, that contain '<' — the splice markers
  const res = [
    /\.(?:indexOf|lastIndexOf|replace)\(\s*'((?:[^'\\]|\\.)*<(?:[^'\\]|\\.)*)'/g,
    /v8Insert\(\s*[\w$]+\s*,\s*'((?:[^'\\]|\\.)*<(?:[^'\\]|\\.)*)'/g,
  ];
  const markers = new Set();
  for (const re of res) { let m; while ((m = re.exec(src))) markers.add(m[1]); }
  const problems = [];
  const adjKeys = new Set(Object.keys(markerAdj.singleOccurrence));
  for (const lit of markers) {
    // count occurrences of the literal (as written, incl. escapes) in the source
    let count = 0, idx = -1;
    while ((idx = src.indexOf(`'${lit}'`, idx + 1)) !== -1) count++;
    const also = src.split(lit).length - 1; // occurrences incl. inside larger strings
    const occurrences = Math.max(count, also);
    if (occurrences >= 2) { adjKeys.delete(lit); continue; }
    if (markerAdj.singleOccurrence[lit]) { adjKeys.delete(lit); continue; }
    problems.push(`splice marker with a single occurrence and no adjudication: '${lit.slice(0, 60)}…'`);
  }
  for (const staleKey of adjKeys) problems.push(`stale marker adjudication (marker gone or now multi-occurrence): '${staleKey.slice(0, 50)}…'`);
  report('marker-integrity', problems.length === 0,
    problems.length ? problems[0] + (problems.length > 1 ? ` (+${problems.length - 1} more)` : '')
      : `${markers.size} literal splice markers, all multi-occurrence or adjudicated (note: v7's 3 regenerated-output splices are not literals — covered by the playtest harness)`);
}

/* ---- 6. save keys ---- */
{
  // Every parliamentVale.* string literal anywhere counts — keys reach
  // localStorage through variables (readAutosave's key array), so matching
  // only direct getItem('...') calls would go blind to them.
  const re = /'(parliamentVale[^']*)'/g;
  const keys = new Set();
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  const rogue = [...keys].filter(k => !baseline.saveKeys.includes(k));
  report('save-keys', rogue.length === 0,
    rogue.length ? `undocumented key(s): ${rogue.join(', ')}` : `${keys.size} keys, all documented`);
}

/* ---- 6b. palette drift ---- */
// Every colour literal must be adjudicated. Case-insensitive on purpose: a
// retune once shipped half-applied because lowercase hex in a script block
// escaped an uppercase sweep, leaving the trend chart on the old palette.
{
  const palette = JSON.parse(fs.readFileSync(path.join(__dirname, 'palette.json'), 'utf8'));
  const ok = new Set(Object.values(palette.allowed).flat().map(h => h.toUpperCase()));
  const seen = new Map();
  const re = /#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?\b/g;
  let m;
  while ((m = re.exec(src))) {
    const lit = m[0].toUpperCase();
    if (ok.has(lit)) continue;
    if (!seen.has(lit)) seen.set(lit, src.slice(0, m.index).split('\n').length);
  }
  const rogue = [...seen].map(([lit, line]) => `${lit} (line ${line})`);
  report('palette-drift', rogue.length === 0,
    rogue.length ? `unadjudicated colour(s): ${rogue.slice(0, 4).join(', ')}${rogue.length > 4 ? ` +${rogue.length - 4} more` : ''} — add to checks/palette.json or fix`
      : `${ok.size} adjudicated colours, no drift`);
}

/* ---- 6c. breakpoint tiers ---- */
// Every width threshold in every @media rule must be a tier edge, and each edge
// must be used on ONE side only. Six chunks each inventing its own idea of
// "narrow" is what produced a 761-1179 band wearing the phone's tab strip over
// a desktop body, and a turn bar that changed its chip count three times inside
// one tier. The numbers are the design decision; this refuses to let a new one
// arrive quietly.
//
// The first version of this check was a membership test on whatever `(\d+)px`
// it could find, which left four ways past it: `max-width:1180px` sailed
// through because 1180 is a legal edge, even though it and `min-width:1180px`
// both apply at exactly 1180; em/rem widths matched nothing and reported green;
// media-range syntax `(width >= 900px)` contains neither `min-width:` nor
// `max-width:` and was invisible; and `max-width:1179.98px` matched the
// substring `98px`, failing while naming a number that is not in the file.
{
  const allowed = { width: new Set(baseline.widthThresholds), height: new Set(baseline.heightThresholds || []) };
  const problems = [];
  const edges = new Map(); // "axis:px" -> Set of the sides it is used on
  const re = /@media([^{]*)\{/g;
  let m;
  while ((m = re.exec(src))) {
    const cond = m[1];
    const line = src.slice(0, m.index).split('\n').length;
    // Range syntax expresses the same decision in a form the tier list cannot
    // be compared against, so it is refused outright rather than parsed.
    if (/\(\s*(?:width|height)\s*[<>=]/i.test(cond) || /[<>]=?\s*(?:width|height)\s*[<>]/i.test(cond)) {
      problems.push(`media-range syntax at line ${line} (${cond.trim().slice(0, 40)}) — write tiers as min-/max- so they can be checked`);
      continue;
    }
    if (/device-(?:width|height)/i.test(cond)) {
      problems.push(`device-width/height at line ${line} — deprecated, and not governed by the tier list`);
      continue;
    }
    const feat = /(min|max)-(width|height)\s*:\s*([0-9]*\.?[0-9]+)\s*([a-z%]*)/gi;
    let n;
    while ((n = feat.exec(cond))) {
      const side = n[1].toLowerCase(), axis = n[2].toLowerCase(), value = n[3], unit = (n[4] || '').toLowerCase();
      if (unit !== 'px') {
        problems.push(`${side}-${axis}:${value}${unit || ' (no unit)'} at line ${line} — tiers are pinned in px; a relative unit moves with the font size`);
        continue;
      }
      if (!/^\d+$/.test(value)) {
        problems.push(`fractional threshold ${side}-${axis}:${value}px at line ${line} — tier edges are whole pixels`);
        continue;
      }
      const px = Number(value);
      if (!allowed[axis].has(px)) {
        problems.push(`off-tier ${axis} threshold ${px}px at line ${line} — fold it into a tier, or add the number to checks/baseline.json with the case for it`);
        continue;
      }
      const key = axis + ':' + px;
      if (!edges.has(key)) edges.set(key, new Set());
      edges.get(key).add(side);
    }
  }
  // A number used as both an upper and a lower bound means two rules apply at
  // that exact pixel. The tier edges are deliberately adjacent pairs — 760/761,
  // 1179/1180 — precisely so this cannot happen.
  for (const [key, sides] of edges) {
    if (sides.size > 1) {
      const axis = key.split(':')[0], px = key.split(':')[1];
      problems.push(`${px}px is used as both min-${axis} and max-${axis} — both rules apply at exactly ${px}px; tier edges come in adjacent pairs for this reason`);
    }
  }
  report('breakpoint-tiers', problems.length === 0,
    problems.length ? problems[0] + (problems.length > 1 ? ` (+${problems.length - 1} more)` : '')
      : `${allowed.width.size} width edges [${baseline.widthThresholds.join(', ')}] and ` +
        `${allowed.height.size} height edge(s) [${(baseline.heightThresholds || []).join(', ')}], ` +
        `each used on one side only, all px, no range syntax`);
}

/* ---- 7. seeded-randomness ratchet ---- */
// Determinism is a promise to the player: a seed plus a list of decisions
// reproduces a campaign. It holds only while every roll comes from rand(), so
// an unseeded Math.random() anywhere breaks it silently — the campaign still
// plays, it just stops being replayable.
{
  const n = (src.match(/Math\.random\(\)/g) || []).length;
  const seeded = (src.match(/\brand\(\)/g) || []).length;
  const engine = /function rand\(\)/.test(src);
  const ok = n === baseline.mathRandomCount && engine && seeded > 50;
  report('math-random-ratchet', ok,
    !engine ? 'the seeded engine rand() is gone — determinism is not enforceable without it'
      : `${n} Math.random() call(s) (baseline ${baseline.mathRandomCount}), ${seeded} through the seeded engine` +
        (n === baseline.mathRandomCount ? '' : ' — route the new one through rand()'));
}

/* ---- 8. size budget ---- */
// Two bounds, because the absolute one stopped doing the job. The owner ruled
// the ceiling soft and it went to 10 MB against a 3 MB file; the failure this
// check is actually kept for -- a runaway --apply duplicating a region, which
// came close twice in S12 -- is a few hundred KB and would sail under it for
// years. So the biting bound is GROWTH against the last commit, sized from
// this file's own history (see baseline.json's _growthComment).
{
  const bytes = Buffer.byteLength(src, 'utf8');
  const git = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  let head = null, why = '';
  try {
    const n = Number(git('git cat-file -s ' + git('git rev-parse HEAD:vale.html')));
    if (Number.isFinite(n) && n > 0) head = n; else why = 'git reported no size for HEAD:vale.html';
  } catch (e) {
    why = 'nothing committed at HEAD:vale.html to compare against';
  }
  // A copy under VALE_FILE (the proof-of-failure drill, a poison build) is not
  // this repo's vale.html, so growth against HEAD would be meaningless there.
  if (process.env.VALE_FILE && path.resolve(process.env.VALE_FILE) !== path.join(ROOT, 'vale.html')) {
    head = null; why = 'VALE_FILE names a copy, not the repo\'s own vale.html';
  }
  const grew = head === null ? 0 : bytes - head;
  const overCap = bytes > baseline.maxBytes;
  const overGrowth = head !== null && grew > baseline.maxGrowthBytes;
  const size = `${bytes.toLocaleString('en-US')} bytes of ${baseline.maxBytes.toLocaleString('en-US')}`;
  report('size-budget', !overCap && !overGrowth,
    overCap ? `${size} — over the ceiling`
      : overGrowth ? `+${grew.toLocaleString('en-US')} bytes since HEAD, over the ` +
        `${baseline.maxGrowthBytes.toLocaleString('en-US')} growth bound — the largest legitimate commit in this ` +
        `file's history added 204,136. Split the change, or raise maxGrowthBytes with the case for it`
      : `${size}, ` + (head === null ? `growth not measured (${why})`
        : `${grew >= 0 ? '+' : ''}${grew.toLocaleString('en-US')} since HEAD of ` +
          `${baseline.maxGrowthBytes.toLocaleString('en-US')} allowed`));
}

/* ---- report ---- */
const failed = results.filter(r => !r.ok);
if (process.argv.includes('--brief')) {
  // SessionStart hook mode: one paragraph of context, always exit 0.
  let slice = '';
  try {
    const state = fs.readFileSync(path.join(ROOT, 'docs', 'STATE.md'), 'utf8');
    const m = state.match(/## Current slice\s*\n+\s*(.+)/);
    if (m) slice = ' Current slice per docs/STATE.md: ' + m[1].replace(/\*/g, '').trim();
  } catch (e) { /* STATE.md optional */ }
  console.log(
    (failed.length
      ? `vale.html checks: ${failed.length} FAILING (${failed.map(f => f.name).join(', ')}) — run \`node checks/run.js\` before touching the game file.`
      : `vale.html checks: all ${results.length} pass.`) + slice +
    ' Read docs/MAP.md before editing vale.html; never read it whole.');
  process.exit(0);
}
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(22)} ${r.detail}`);
console.log(failed.length ? `\n${failed.length} CHECK(S) FAILED` : '\nALL CHECKS PASS');
process.exit(failed.length ? 1 : 0);
