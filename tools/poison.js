#!/usr/bin/env node
'use strict';
/*
 * Poison-proof for dead code.
 *
 *   node tools/poison.js --list
 *   node tools/poison.js <id>[,<id>...]     writes a poisoned scratch copy
 *
 * Deleting a function body because a reference scan says nothing calls it is
 * not proof: the S2 audit found bodies that a scan calls dead which in fact
 * execute once during page boot, before a later chunk replaces them. So before
 * any body is deleted, this tool writes a copy with `throw` as that body's
 * first statement, and the playtest is run against it:
 *
 *   node tools/poison.js render-v4
 *   VALE_FILE=<the printed path> node tools/playtest.js
 *
 * Playtest green  -> nothing reached the body on any path the harness walks.
 * Playtest red    -> the body is live; it stays, and MAP.md is corrected.
 *
 * A green run is evidence, not a guarantee: it only covers paths the harness
 * actually walks. Broaden the harness before trusting it with a new body.
 */
const fs = require('fs');
const path = require('path');

// Each entry anchors a body by the text that opens it. Anchors must be unique.
//
// S14 pruned five entries. Half this registry was dead: S2 deleted the bodies
// and never removed them from the tool that deleted them, so `--list` offered
// five ids that could only ever exit 1. `runqueue-v4`, `palette-v5` and
// `menu-v6` are gone from vale.html entirely; `startscreen-v4` and
// `helpdialog-v4` lost their v4 DECLARATIONS and survive only as later
// reassignments, which this tool cannot anchor by text because the same
// opening line occurs at each of them (helpDialog has three). Anchor a later
// vintage by adding a longer, unique opening line when one is actually needed.
//
// `--list` now verifies every anchor against the file and exits 1 if any of
// them has rotted, so this cannot go stale in silence a second time.
const BODIES = {
  'render-v4':        'function render() {',
  'render-v5':        'render=function(){',
  'renderstats-v4':   'function renderStats() {',
  'centertab-mobile': 'function v6mCenterTab() {',
  'policyfolds-mobile': 'function v6mPolicyFolds() {',
};

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
// VALE_FILE, like every other tool here: it is how the registry's own
// self-check is proved able to fail.
const FILE = process.env.VALE_FILE || path.join(ROOT, 'vale.html');

if (process.argv.includes('--list')) {
  const text = fs.readFileSync(FILE, 'utf8');
  let rotten = 0;
  for (const [id, anchor] of Object.entries(BODIES)) {
    const first = text.indexOf('\n' + anchor);
    const n = first < 0 ? 0 : (text.indexOf('\n' + anchor, first + 1) >= 0 ? 2 : 1);
    if (n !== 1) rotten++;
    console.log(id.padEnd(20), anchor.padEnd(30),
      n === 1 ? 'line ' + (text.slice(0, first + 1).split('\n').length) : (n ? 'NOT UNIQUE' : 'GONE — the body this anchored no longer exists'));
  }
  if (rotten) console.error('\n' + rotten + ' anchor(s) no longer resolve. Prune them, or re-point them at the body that replaced them.');
  process.exit(rotten ? 1 : 0);
}
const ids = (process.argv[2] || '').split(',').filter(Boolean);
if (!ids.length) { console.log('usage: node tools/poison.js <id>[,<id>...]   (--list to see ids)'); process.exit(1); }

let src = fs.readFileSync(FILE, 'utf8');
for (const id of ids) {
  const anchor = BODIES[id];
  if (!anchor) { console.error('unknown body: ' + id); process.exit(1); }
  const first = src.indexOf('\n' + anchor);
  if (first < 0) { console.error('anchor not found: ' + anchor); process.exit(1); }
  if (src.indexOf('\n' + anchor, first + 1) >= 0) { console.error('anchor is not unique: ' + anchor); process.exit(1); }
  const brace = src.indexOf('{', first + anchor.length);
  if (brace < 0) { console.error('no opening brace after: ' + anchor); process.exit(1); }
  src = src.slice(0, brace + 1) +
        `throw new Error('POISON ${id} — a body believed dead was reached');` +
        src.slice(brace + 1);
  console.error('poisoned ' + id);
}
fs.mkdirSync(OUT, { recursive: true });
const out = path.join(OUT, 'poisoned.html');
fs.writeFileSync(out, src);
console.log(out);
