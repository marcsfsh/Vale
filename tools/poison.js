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
const BODIES = {
  'render-v4':        'function render() {',
  'render-v5':        'render=function(){',
  'runqueue-v4':      'function runQueue(done) {',
  'renderstats-v4':   'function renderStats() {',
  'startscreen-v4':   'function startScreen() {',
  'palette-v5':       'function pv5CommandPalette',
  'menu-v6':          'function v6Menu',
  'centertab-mobile': 'function v6mCenterTab() {',
  'policyfolds-mobile': 'function v6mPolicyFolds() {',
  'helpdialog-v4':    'function helpDialog() {',
};

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');

if (process.argv.includes('--list')) {
  for (const [id, anchor] of Object.entries(BODIES)) console.log(id.padEnd(20), anchor);
  process.exit(0);
}
const ids = (process.argv[2] || '').split(',').filter(Boolean);
if (!ids.length) { console.log('usage: node tools/poison.js <id>[,<id>...]   (--list to see ids)'); process.exit(1); }

let src = fs.readFileSync(path.join(ROOT, 'vale.html'), 'utf8');
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
