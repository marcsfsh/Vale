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

/* ---- 7. Math.random ratchet ---- */
{
  const n = (src.match(/Math\.random\(\)/g) || []).length;
  report('math-random-ratchet', n === baseline.mathRandomCount,
    `${n} Math.random() sites (baseline ${baseline.mathRandomCount}; changes only with the seeded-PRNG slice)`);
}

/* ---- 8. size budget ---- */
{
  const bytes = Buffer.byteLength(src, 'utf8');
  report('size-budget', bytes <= baseline.maxBytes,
    `${bytes.toLocaleString('en-US')} bytes of ${baseline.maxBytes.toLocaleString('en-US')} allowed`);
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
