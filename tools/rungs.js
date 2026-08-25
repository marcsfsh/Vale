#!/usr/bin/env node
/*
 * tools/rungs.js — the statute book's prose: brief it, splice it, check it.
 *
 *   node tools/rungs.js --brief <Category>     write an authoring brief
 *   node tools/rungs.js --apply <shard.json>   splice desc + rungs into vale.html
 *   node tools/rungs.js --check                measure the prose that SHIPPED
 *
 * WHY A TOOL AND NOT HAND EDITING. These are single-quoted JS string literals
 * inside a 2.3 MB file, and the prose is apostrophe-dense. One unescaped
 * apostrophe stops the game booting. Escaping is done here, mechanically, once,
 * and never by whoever is writing the sentences.
 *
 * --apply IS IDEMPOTENT. Running it twice produces a byte-identical file: it
 * replaces an existing rungs block rather than stacking a second one. That
 * round trip is the proof that the splice landed where it was aimed, and it is
 * what rules out the one real hazard here, a brace-match landing one character
 * inside an eff4:{...} and moving a statute's balance in silence.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createRequire } = require('module');

const ROOT = path.join(__dirname, '..');
const FILE = process.env.VALE_FILE || path.join(ROOT, 'vale.html');
const OUT = path.join(ROOT, 'tools', 'out', 'rungs');

function browser() {
  try { return require('playwright'); } catch (e) {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return createRequire(path.join(g, 'noop.js'))('playwright');
  }
}

/* Boot the real file and read the assembled registry. The three policy arrays
 * are merged at runtime with guards, and the ladder curves are materialised by
 * enrichState, so parsing the source would measure something the game does not
 * actually hold. */
async function readGame(fn, arg) {
  const pw = browser();
  const b = await pw.chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + FILE);
  await p.waitForSelector('[data-setup-begin]');
  const out = await p.evaluate(fn, arg);
  await b.close();
  if (errs.length) { console.error('PAGE ERRORS:', errs.slice(0, 3)); process.exit(1); }
  return out;
}

/* ---------------- the brief ---------------- */

async function brief(cat) {
  const data = await readGame((category) => {
    const IND_N = k => (IND[k] && IND[k].name) || k;
    const BLOC_N = k => (BLOC[k] && BLOC[k].name) || k;
    const rows = POLICIES.filter(p => p.cat === category).map(p => {
      const rungs = [];
      for (let i = 1; i <= p.max; i++) {
        const eff = polEffAt(p, i), mood = polMoodAt(p, i);
        const prev = i > 1 ? polEffAt(p, i - 1) : {};
        const prevM = i > 1 ? polMoodAt(p, i - 1) : {};
        const totals = {}, deltas = {}, fresh = [];
        for (const k in eff) if (eff[k]) {
          totals[IND_N(k)] = Math.round(eff[k] * 10) / 10;
          const d = eff[k] - (prev[k] || 0);
          if (Math.abs(d) > 0.04) deltas[IND_N(k)] = Math.round(d * 10) / 10;
          if (!prev[k] && eff[k]) fresh.push(IND_N(k));
        }
        const moods = {}, freshM = [];
        for (const k in mood) if (Math.abs(mood[k]) >= 0.5) {
          moods[BLOC_N(k)] = Math.round(mood[k] * 10) / 10;
          if (!prevM[k] && mood[k]) freshM.push(BLOC_N(k));
        }
        rungs.push({
          rung: i,
          name: v9TierName(p, i),
          indicators: totals,
          changedThisRung: deltas,
          newThisRung: fresh.concat(freshM),
          blocs: moods,
          revenue: Math.round(polRevAt(p, i) * 10) / 10 || 0,
          cost: Math.round(polExpAt(p, i) * 10) / 10 || 0
        });
      }
      return {
        id: p.id, name: p.name, group: p.grp || null, category: p.cat,
        department: (DEPTS[p.dept] && DEPTS[p.dept].name) || null,
        currentDesc: p.desc,
        needs: p.needs ? ((POL[p.needs] && POL[p.needs].name) || p.needs) : null,
        onlyUnder: p.forms ? p.forms.map(f => (FORMS[f] && FORMS[f].name) || f) : null,
        conditionText: p.reqText || null,
        rungs
      };
    });
    return { category, rungNames: V9_TIERS[category] || ['Modest', 'Standard', 'Strong', 'Total'],
      generic: !V9_TIERS[category], statutes: rows,
      allNamesInCategory: rows.map(r => r.name) };
  }, cat);

  if (!data.statutes.length) { console.error('no statutes in category: ' + cat); process.exit(1); }
  fs.mkdirSync(path.join(OUT, 'briefs'), { recursive: true });
  const slug = cat.toLowerCase().replace(/[^a-z]+/g, '-');
  const f = path.join(OUT, 'briefs', slug + '.json');
  fs.writeFileSync(f, JSON.stringify(data, null, 1));
  console.log('brief: ' + f + '  (' + data.statutes.length + ' statutes, ' +
    data.statutes.reduce((n, r) => n + r.rungs.length, 0) + ' rungs)' +
    (data.generic ? '  NOTE: this category has no V9_TIERS row, rung names are the generic fallback' : ''));
}

/* ---------------- the splice ---------------- */

function esc(str) { return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function apply(shardPaths) {
  let src = fs.readFileSync(FILE, 'utf8');
  const shard = {};
  shardPaths.forEach(f => Object.assign(shard, JSON.parse(fs.readFileSync(f, 'utf8'))));
  const ids = Object.keys(shard);
  if (!ids.length) { console.error('nothing to apply'); process.exit(1); }

  let done = 0, missed = [];
  ids.forEach(id => {
    const anchor = src.indexOf("P({ id:'" + id + "'");
    if (anchor < 0) { missed.push(id); return; }
    /* bound the edit to THIS literal: the next P({ is the wall */
    const wall = src.indexOf('P({ id:', anchor + 8);
    const end = wall < 0 ? src.length : wall;
    let body = src.slice(anchor, end);

    const entry = shard[id];

    /* the base description, replaced in place */
    if (entry.desc) {
      const dm = /(\n\s*)desc:'(?:[^'\\]|\\.)*',/.exec(body);
      if (!dm) { missed.push(id + ' (no desc: line)'); return; }
      body = body.slice(0, dm.index) + dm[1] + "desc:'" + esc(entry.desc) + "'," + body.slice(dm.index + dm[0].length);
    }

    /* drop any rungs block already there, so a second run is a no-op */
    body = body.replace(/\n\s*rungs:\[[\s\S]*?\n\s*\],/, '');

    if (entry.rungs) {
      if (!Array.isArray(entry.rungs) || entry.rungs.length !== 4) {
        missed.push(id + ' (rungs must be exactly 4, got ' + (entry.rungs || []).length + ')'); return;
      }
      const dm2 = /(\n)(\s*)desc:'(?:[^'\\]|\\.)*',/.exec(body);
      if (!dm2) { missed.push(id + ' (no desc: line to sit after)'); return; }
      const indent = dm2[2];
      const at = dm2.index + dm2[0].length;
      const block = '\n' + indent + 'rungs:[\n' +
        entry.rungs.map(t => indent + "  '" + esc(t) + "'").join(',\n') +
        '\n' + indent + '],';
      body = body.slice(0, at) + block + body.slice(at);
    }
    src = src.slice(0, anchor) + body + src.slice(end);
    done++;
  });

  if (missed.length) { console.error('FAILED on ' + missed.length + ': ' + missed.slice(0, 6).join('; ')); process.exit(1); }
  fs.writeFileSync(FILE, src);
  console.log('applied ' + done + ' statutes; file is now ' + fs.statSync(FILE).size.toLocaleString() + ' bytes');
  console.log('run `node checks/run.js` NOW: its syntax check is the tripwire for a bad escape.');
}

/* ---------------- the checker ---------------- */

const BANNED = ('crucial pivotal vital invaluable transformative game-changing cutting-edge revolutionary ' +
  'profound stark remarkable significantly leverage seamless seamlessly robust comprehensive holistic ' +
  'multifaceted streamline elevate empower unlock unleash harness foster optimize optimise delve tapestry ' +
  'landscape realm journey navigate embark beacon cornerstone testament vibrant myriad plethora intricate ' +
  'meticulous interplay moreover furthermore additionally notably importantly arguably undoubtedly ' +
  'emphasizing emphasising enhance enhances enhanced ensure ensures ensuring highlight highlights ' +
  'showcase showcases underscore underscores boasts').split(' ');

const PHRASES = ['stands as', 'serves as', 'align with', 'aligns with', 'a testament to',
  'plays a key', 'plays a vital', 'valuable insights', 'in conclusion', 'it is important to note',
  'it is worth noting', 'key role', 'marks a shift', 'sets the stage'];

function sentences(t) {
  return String(t).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
}
function words(t) { return String(t).toLowerCase().match(/[a-z']+/g) || []; }

async function check() {
  const game = await readGame(() => POLICIES.map(p => ({
    id: p.id, name: p.name, cat: p.cat, grp: p.grp || '', max: p.max,
    desc: p.desc, rungs: p.rungs || null,
    rungKeys: (function () {
      const out = [];
      for (let i = 1; i <= p.max; i++) {
        const e = polEffAt(p, i), m = polMoodAt(p, i), k = [];
        for (const x in e) if (e[x]) k.push((IND[x] && IND[x].name) || x);
        for (const x in m) if (Math.abs(m[x]) >= .5) k.push((BLOC[x] && BLOC[x].name) || x);
        out.push(k);
      }
      return out;
    })(),
    parties: PARTIES.map(x => x.name).concat(PARTIES.map(x => x.short)),
    regions: REGIONS.map(x => x.name)
  })));

  const fail = [];
  const withProse = game.filter(p => p.rungs);
  const proper = new Set();
  if (game[0]) { game[0].parties.forEach(x => proper.add(x.toLowerCase())); game[0].regions.forEach(x => proper.add(x.toLowerCase())); }

  const sentIndex = new Map();     // normalised sentence -> policy ids
  const shingles = new Map();      // 8-token shingle -> policy ids
  const grams = new Map();         // 4-gram -> set of policy ids

  function scan(id, label, t) {
    if (typeof t !== 'string' || !t.trim()) { fail.push(id + ' ' + label + ': empty'); return; }
    /* characters. One rule kills em dashes, en dashes, curly quotes and
       apostrophes, ellipses and non-breaking spaces. */
    const bad = [...t].find(ch => ch.charCodeAt(0) > 127);
    if (bad) fail.push(id + ' ' + label + ': non-ascii ' + JSON.stringify(bad));
    if (/[<>&]/.test(t)) fail.push(id + ' ' + label + ': angle bracket or ampersand (marker-integrity scans literals)');
    if (/#/.test(t)) fail.push(id + ' ' + label + ': hash (palette-drift scans the whole source for hex)');
    if (/[{}]/.test(t)) fail.push(id + ' ' + label + ': brace (the playtest leak guard hunts these)');
    if (/\d/.test(t)) fail.push(id + ' ' + label + ': digit (the mechanics line above already carries every number)');
    const lower = t.toLowerCase();
    BANNED.forEach(w => { if (new RegExp('\\b' + w + '\\b').test(lower)) fail.push(id + ' ' + label + ': banned word "' + w + '"'); });
    PHRASES.forEach(w => { if (lower.indexOf(w) >= 0) fail.push(id + ' ' + label + ': banned phrase "' + w + '"'); });
    if (/,\s+[a-z]+ing\b/.test(t)) fail.push(id + ' ' + label + ': participle tail');
    if (/\bnot (just|only|merely|simply)\b/i.test(t)) fail.push(id + ' ' + label + ': negative parallelism');
    proper.forEach(n => { if (n.length > 3 && lower.indexOf(n) >= 0) fail.push(id + ' ' + label + ': live proper noun "' + n + '"'); });
    const ss = sentences(t);
    ss.forEach(s => {
      const norm = s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
      if (!norm) return;
      if (!sentIndex.has(norm)) sentIndex.set(norm, new Set());
      sentIndex.get(norm).add(id);
    });
    const w = words(t);
    for (let i = 0; i + 8 <= w.length; i++) {
      const key = w.slice(i, i + 8).join(' ');
      if (!shingles.has(key)) shingles.set(key, new Set());
      shingles.get(key).add(id);
    }
    for (let i = 0; i + 4 <= w.length; i++) {
      const key = w.slice(i, i + 4).join(' ');
      if (!grams.has(key)) grams.set(key, new Set());
      grams.get(key).add(id);
    }
    return ss;
  }

  withProse.forEach(p => {
    if (!Array.isArray(p.rungs) || p.rungs.length !== 4) {
      fail.push(p.id + ': rungs must be EXACTLY 4 (the renderer indexes rungs[lv-1]; a fifth shifts the whole book)');
      return;
    }
    scan(p.id, 'desc', p.desc);
    p.rungs.forEach((t, i) => {
      const ss = scan(p.id, 'rung' + (i + 1), t) || [];
      if (ss.length < 2 || ss.length > 5) fail.push(p.id + ' rung' + (i + 1) + ': ' + ss.length + ' sentences, want 2 to 5');
      if (t.length < 90 || t.length > 340) fail.push(p.id + ' rung' + (i + 1) + ': ' + t.length + ' chars, want 90 to 340');
      /* the specificity floor: it must mention its own subject or something
         this rung actually moves */
      const lower = t.toLowerCase();
      const own = words(p.name + ' ' + p.grp).filter(w => w.length > 4);
      const keys = (p.rungKeys[i] || []).map(k => k.toLowerCase());
      const hit = own.some(w => lower.indexOf(w) >= 0) || keys.some(k => lower.indexOf(k) >= 0);
      if (!hit) fail.push(p.id + ' rung' + (i + 1) + ': names neither its own subject nor anything this rung moves');
    });
    const set = new Set(p.rungs.map(x => x.trim()));
    if (set.size !== 4) fail.push(p.id + ': two rungs share a description');
    const w3 = new Set(words(p.rungs[2])), w4 = words(p.rungs[3]);
    if (!w4.some(x => x.length > 4 && !w3.has(x))) fail.push(p.id + ': rung 4 adds no word rung 3 did not have');
  });

  sentIndex.forEach((ids, s) => { if (ids.size > 1) fail.push('duplicate sentence across ' + [...ids].join(', ') + ': "' + s.slice(0, 60) + '"'); });
  shingles.forEach((ids, s) => { if (ids.size > 1) fail.push('shared phrasing across ' + [...ids].join(', ') + ': "' + s + '"'); });
  let spam = 0;
  grams.forEach((ids, g) => { if (ids.size > 6) { spam++; if (spam <= 8) fail.push('overused phrase in ' + ids.size + ' statutes: "' + g + '"'); } });

  const total = withProse.length;
  const lens = withProse.flatMap(p => p.rungs.map(x => x.length));
  const mean = lens.length ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 0;
  console.log('statutes with prose : ' + total + ' of ' + game.length);
  console.log('rung descriptions   : ' + lens.length + ', mean ' + mean + ' chars');
  if (mean > 250 && lens.length) console.log('NOTE mean is above the 250-char budget; the size ratchet is finite.');
  if (fail.length) {
    console.log('\n' + fail.length + ' PROBLEM(S):');
    fail.slice(0, 40).forEach(f => console.log('  ' + f));
    if (fail.length > 40) console.log('  ... and ' + (fail.length - 40) + ' more');
    process.exit(1);
  }
  console.log('\nRUNGS OK');
}

/* ---------------- dispatch ---------------- */
const a = process.argv.slice(2);
if (a[0] === '--brief' && a[1]) brief(a.slice(1).join(' '));
else if (a[0] === '--apply' && a[1]) apply(a.slice(1));
else if (a[0] === '--check') check();
else {
  console.log('usage:\n  node tools/rungs.js --brief <Category>\n  node tools/rungs.js --apply <shard.json ...>\n  node tools/rungs.js --check');
  process.exit(1);
}
