#!/usr/bin/env node
'use strict';
/*
 * Headless playtest for vale.html — the dynamic half of the verification bar.
 *
 *   node tools/playtest.js            full run: scripted turn + reload/resume + 3 viewports (+ WebKit phone pass)
 *   node tools/playtest.js --quick    boot + setup-sheet assert only (Chromium)
 *
 * Zero project-level dependencies: resolves the globally installed playwright
 * (bare require fails from this repo — node does not search the global root).
 * Where playwright or a browser is missing this prints SKIP with instructions;
 * a SKIP is a SKIP, never a PASS — run in a cloud session before merge instead.
 * Screenshots and the evidence log land in tools/out/ (gitignored).
 */
const { execSync } = require('child_process');
const { createRequire } = require('module');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const URL = 'file://' + (process.env.VALE_FILE || path.join(ROOT, 'vale.html'));
const QUICK = process.argv.includes('--quick');
fs.mkdirSync(OUT, { recursive: true });

let playwright;
try { playwright = require('playwright'); } catch (e) {
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    playwright = createRequire(path.join(g, 'noop.js'))('playwright');
  } catch (e2) {
    console.log('SKIP  playwright is not resolvable on this machine.');
    console.log('      Install it (npm i -g playwright && npx playwright install chromium)');
    console.log('      or run this harness in a cloud session before merge.');
    process.exit(2);
  }
}

const steps = [];
function step(name, ok, detail) { steps.push({ name, ok, detail }); console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); }

async function drainModals(page, maxClicks) {
  // After endTurn the v6 queue shows one sheet per event; the gazette and
  // coalition dialogs may follow. Click event choices, then closes, until quiet.
  let quiet = 0;
  for (let i = 0; i < maxClicks; i++) {
    const open = await page.evaluate(() => !document.getElementById('modal').hidden);
    if (!open) {
      /* v6Pump re-opens the next queued sheet on a 40ms setTimeout after a
         close, so one hidden reading is not an empty queue. Require it to
         STAY hidden across two readings that straddle the pump window. */
      if (++quiet >= 2) return true;
      await page.waitForTimeout(150);
      continue;
    }
    quiet = 0;
    const clicked = await page.evaluate(() => {
      const sh = document.getElementById('sheet');
      const b = sh.querySelector('[data-ev]') || sh.querySelector('[data-close]');
      if (b) { b.click(); return true; }
      return false;
    });
    if (!clicked) return false; // modal open with nothing recognisable to click
    await page.waitForTimeout(120);
  }
  return !(await page.evaluate(() => !document.getElementById('modal').hidden));
}

/* S14: FIXTURES ARE NAMED, NEVER TAKEN BY POSITION. A `.filter(...)[0]` probe
   picks whatever happens to be first in the array, so inserting an order above
   it or reordering the book leaves the assertion passing about a DIFFERENT
   order than the one it was written for -- green, and measuring something
   else. 40 of the 72 orders satisfy the predicate below, so the drift is real
   rather than theoretical. pick() names the fixture and re-asserts the
   property it was chosen for: change that order and this throws HERE, instead
   of quietly moving the test. */
const PICK = `window.pick = function (list, id, pred, what) {
  var hit = list.filter(function (x) { return x.id === id; });
  if (hit.length !== 1) throw new Error('pick(' + what + '): ' + id + ' matches ' + hit.length + ' entries, expected exactly 1 -- the fixture was renamed or removed');
  if (pred && !pred(hit[0])) throw new Error('pick(' + what + '): ' + id + ' no longer has the property it was picked for');
  return hit[0];
};`;

async function boot(page) {
  await page.goto(URL);
  await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
}

async function run() {
  const errors = [];
  const offline = [];
  // The allowlist has been EMPTY since S5 — the fonts are embedded and the file
  // references nothing off-origin — so this bucket should stay at zero. It is
  // kept as a separate count rather than deleted so that a resource failure
  // reports as itself instead of as an anonymous console error.
  const allow = JSON.parse(fs.readFileSync(path.join(ROOT, 'checks', 'baseline.json'), 'utf8')).allowedExternalPrefixes;
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (allow.length && /Failed to load resource/.test(m.text())) { offline.push(m.text()); return; }
    errors.push('console.error: ' + m.text());
  });
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.addInitScript(PICK);

  await boot(page);
  step('boot', true, 'setup sheet visible');
  if (QUICK) {
    step('console-errors', errors.length === 0, `${errors.length} error(s)` + (errors.length ? ': ' + errors[0] : ''));
    await browser.close();
    return finish();
  }

  // -- the setup sheet asks its two questions and folds the rest away (S7) --
  // The house-rules block is written by a later chunk into a slot the setup
  // sheet offers, so this is a cross-chunk seam: rename the slot and the rules
  // silently reappear outside the fold, un-trimming the sheet.
  const setup = await page.evaluate(() => {
    const d = document.querySelector('.setup-more');
    return {
      fold: !!d,
      open: d ? d.open : null,
      rulesInside: d ? !!d.querySelector('[data-v8rule]') : false,
      rulesLoose: [...document.querySelectorAll('#sheet [data-v8rule]')].some(b => !b.closest('.setup-more')),
      guides: document.querySelectorAll('#sheet .setup-guide').length,
    };
  });
  step('setup-trimmed', setup.fold && setup.open === false && setup.rulesInside && !setup.rulesLoose && setup.guides >= 2,
    `fold present: ${setup.fold}, shut by default: ${setup.open === false}, house rules inside it: ` +
    `${setup.rulesInside}, none left loose: ${!setup.rulesLoose}, guided questions: ${setup.guides}`);

  // -- new game through setup + doctrine --
  await page.click('[data-setup-begin]');
  await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await page.click('[data-doctrine]');
  const started = await page.evaluate(() => window.S && S.started === true);
  step('new-game', !!started, 'S.started after doctrine choice');

  // -- a bill through the draft dialog (bill action + modal in one) --
  await page.click('[data-group="gLaw"]');
  await page.waitForTimeout(120);
  await page.click('[data-tab="policy"]');
  await page.waitForSelector('[data-pol][data-dir="1"]:not([disabled])', { timeout: 10000 });
  await page.click('[data-pol][data-dir="1"]:not([disabled])');
  await page.waitForSelector('[data-draft]', { timeout: 10000 });
  await page.click('[data-draft="clean"]');
  await page.waitForTimeout(150);
  /* the draft sheet also has to say what the bill would change, and drafting
     must leave you where you were: S9f removed the forced jump to Lawmaking */
  const bills = await page.evaluate(() => ({
    n: S.bills.filter(b => b.owner === 'player').length, tab: UI.tab, sheet: !!document.getElementById('sheet').className.match(/open/),
  }));
  step('draft-bill', bills.n > 0 && bills.tab === 'policy',
    `${bills.n} player bill(s) before the houses; still on ${bills.tab} after drafting`);

  // -- the drafting desk states the rung's own change --
  const delta = await page.evaluate(async () => {
    const btn = document.querySelector('[data-pol][data-dir="1"]:not([disabled])');
    if (!btn) return { err: 'no draftable measure' };
    btn.click();
    await new Promise(r => setTimeout(r, 200));
    const row = document.querySelector('#sheet [data-draft-delta]');
    const out = { found: !!row, tags: row ? row.querySelectorAll('.tag').length : 0, text: row ? row.textContent.trim().slice(0, 90) : '' };
    hideSheet();
    return out;
  });
  step('draft-delta', !!delta.found && (delta.tags > 0 || /moves no indicator/.test(delta.text)),
    delta.err || `"What this bill changes" present with ${delta.tags} chip(s): ${delta.text}`);

  // -- the dossier reads the real ladder: five rungs, capital only on the
  //    rung you can reach, both Senate directions, no template leaks --
  const doss = await page.evaluate(async () => {
    const btn = document.querySelector('#view [data-v9open="dossier"]');
    if (!btn) return { err: 'no dossier button on the policy page' };
    btn.click();
    await new Promise(r => setTimeout(r, 250));
    const sh = document.getElementById('sheet');
    const txt = sh.textContent;
    const p = POL[btn.getAttribute('data-id')], lv = S.pol[p.id] || 0;
    const out = {
      lv, want: (lv < p.max ? 1 : 0) + (lv > 0 ? 1 : 0),
      rungs: sh.querySelectorAll('.ladder .tier').length,
      costs: (txt.match(/capital from here/g) || []).length,
      senate: (txt.match(/Senate, on (more|less)/g) || []).length,
      constituencies: /What the constituencies hold now/.test(txt),
      leak: /\{[nNd]\}|undefined|NaN/.test(txt),
    };
    hideSheet();
    return out;
  });
  step('dossier-ladder', doss.rungs === 5 && doss.costs === doss.want && doss.senate >= 1 && doss.constituencies && !doss.leak,
    doss.err || `${doss.rungs} rungs at level ${doss.lv}, ${doss.costs} of ${doss.want} reachable rungs quoting capital, ` +
    `${doss.senate} Senate read(s), per-rung constituencies: ${doss.constituencies}, template leaks: ${doss.leak}`);

  // -- end the session via the BUTTON (S1: must reach the live v8 chain, not
  //    the frozen v4 body — the v8 wrapper's close-checklist is the tell) --
  const turnBefore = await page.evaluate(() => S.turn);
  await page.click('#btnEnd');
  await page.waitForSelector('[data-end-confirm]', { timeout: 10000 });
  const checklist = await page.evaluate(() =>
    !!document.querySelector('#sheet .close-list, #sheet [data-close-list], #sheet .closelist'));
  step('end-button-live', checklist, 'End button reaches the v8 close-checklist wrapper');
  await page.click('[data-end-confirm]');
  const drained = await drainModals(page, 40);
  const turnAfter = await page.evaluate(() => S.turn);
  step('end-turn', drained && turnAfter === turnBefore + 1, `turn ${turnBefore} -> ${turnAfter}, queue drained: ${drained}`);

  // -- v7 splice coverage (no literal marker exists for these; see checks) --
  await page.click('[data-group="gDesk"]');
  await page.waitForTimeout(120);
  await page.click('[data-tab="chamber"]');
  const desk = await page.evaluate(() => !!document.querySelector('#view .desk-row, #view .desk, #view [data-desk], #view .panel'));
  step('v7-splice-renders', desk, 'Overview renders panels after the turn');

  // -- walk every view and both menus. The S2 poison-proofs are only worth as
  //    much as the paths this harness actually visits, so it visits all of
  //    them: each tab rendered, the council menu, the field guide, save/load.
  /* This counted ATTEMPTS, not renders — `toured++` after each evaluate,
     against a threshold of 10 — so a view that rendered nothing, or five views
     dropped from TABS outright, sailed through. It now requires every view to
     put something in #view, and names the ones that did not. */
  const tabs = await page.evaluate(() => (typeof TABS !== 'undefined' ? TABS.map(t => t.id) : []));
  const empty = [];
  for (const t of tabs) {
    await page.evaluate(id => { UI.tab = id; render(); }, t);
    await page.waitForTimeout(45);
    const filled = await page.evaluate(() => {
      const v = document.getElementById('view');
      return !!v && v.children.length > 0 && v.textContent.trim().length > 40;
    });
    if (!filled) empty.push(t);
  }
  const leaks = [];
  for (const t of tabs) {
    await page.evaluate(id => { UI.tab = id; render(); }, t);
    await page.waitForTimeout(25);
    const hit = await page.evaluate(() => {
      const v = document.getElementById('view');
      const m = v && v.textContent.match(/[^\s]{0,30}\{[nNd]\}[^\s]{0,30}/);
      return m ? m[0] : null;
    });
    if (hit) leaks.push(`${t}: ${hit}`);
  }
  step('no-placeholder-leaks', leaks.length === 0,
    leaks.length ? `template braces reached the screen — ${leaks.join('; ')}`
      : 'no {n}/{N}/{d} in any rendered view');
  await page.evaluate(() => { UI.tab = 'chamber'; render(); });
  step('tab-tour', tabs.length >= 15 && empty.length === 0,
    `${tabs.length - empty.length} of ${tabs.length} views rendered content` +
    (empty.length ? `; empty: ${empty.join(', ')}` : '') +
    (tabs.length < 15 ? `; only ${tabs.length} views exist, expected at least 15` : ''));

  // -- the screen holds still (S9b). Each sub-assertion targets one of the
  //    named jump mechanisms; the step fails wholesale on the pre-fix file.
  {
    const holds = [];
    // B: a same-tab render keeps the window where it was, even when the view
    //    comes back shorter (the browser used to clamp scrollY and nothing
    //    put it back)
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.evaluate(() => { UI.tab = 'record'; render(); window.scrollTo(0, 600); });
    await page.waitForTimeout(80);
    const b1 = await page.evaluate(() => {
      const y0 = window.scrollY;
      const keep = S.log; S.log = []; render(); S.log = keep;
      const y1 = window.scrollY;
      render();
      return { y0, y1, y2: window.scrollY };
    });
    if (Math.abs(b1.y1 - b1.y0) > 2) holds.push(`same-tab render moved scrollY ${b1.y0} -> ${b1.y1}`);
    // E: a long sheet opens at its own heading, not scrolled to a deep button
    const e1 = await page.evaluate(() => { helpDialog(); const sh = document.getElementById('sheet'); const st = sh.scrollTop; hideSheet(); return st; });
    if (e1 > 2) holds.push(`sheet opened pre-scrolled to ${e1}px`);
    // F: a main-tab change lands at the ABSOLUTE top, every time, and the
    //    header row is on screen when it gets there. S9f replaced the
    //    cross-tab scroll memory that gave one gesture three outcomes: a tab
    //    left mid-page snapped back with the header off screen, a first visit
    //    clamped to the sticky strip, a tab left at the top showed it. Both
    //    routes in — the keyboard/group buttons and a page button — are
    //    asserted, twice over, on a tab that has been scrolled and left.
    await page.evaluate(() => {
      UI.tab = 'policy'; render(); window.scrollTo(0, 500);
      UI.tab = 'chamber'; render();
    });
    await page.keyboard.press('2');
    await page.waitForTimeout(350);
    const f1 = await page.evaluate(() => ({ tab: UI.tab, y: window.scrollY,
      head: document.querySelector('header.topbar').getBoundingClientRect().top }));
    if (f1.tab !== 'policy') holds.push(`key 2 landed on ${f1.tab}, expected policy`);
    else if (f1.y > 2) holds.push(`tab change did not land at the top: scrollY ${f1.y}`);
    else if (f1.head < -1) holds.push(`header row off screen after a tab change: ${Math.round(f1.head)}px`);
    const f2 = await page.evaluate(async () => {
      window.scrollTo(0, 500);
      const nav = document.getElementById('tabs');
      const grouped = nav.classList.contains('grouped');
      const go = sel => { const b = nav.querySelector(sel); if (b) b.click(); };
      go(grouped ? '[data-group="gDesk"]' : '[data-tab="chamber"]');
      await new Promise(r => setTimeout(r, 120));
      const away = { tab: UI.tab, y: window.scrollY };
      go(grouped ? '[data-group="gLaw"]' : '[data-tab="policy"]');
      await new Promise(r => setTimeout(r, 60));
      go('[data-tab="policy"]');
      await new Promise(r => setTimeout(r, 120));
      return { away, back: { tab: UI.tab, y: window.scrollY, head: document.querySelector('header.topbar').getBoundingClientRect().top } };
    });
    if (f2.away.y > 2) holds.push(`leaving a scrolled tab did not land at the top: ${f2.away.y}`);
    if (f2.back.tab !== 'policy') holds.push(`nav buttons landed on ${f2.back.tab}, expected policy`);
    else if (f2.back.y > 2) holds.push(`returning to policy restored an old offset: ${f2.back.y}`);
    else if (f2.back.head < -1) holds.push(`header row off screen on the second visit: ${Math.round(f2.back.head)}px`);
    // H: flash() no longer schedules a delayed full render
    const h1 = await page.evaluate(async () => {
      window.__renders = 0;
      const base = render; render = function () { window.__renders++; return base.apply(this, arguments); };
      flash('held for the test');
      await new Promise(r => setTimeout(r, 1900));
      render = base;
      const hint = document.getElementById('turnHint').textContent;
      return { renders: window.__renders, restored: hint !== 'held for the test' };
    });
    if (h1.renders > 0) holds.push(`flash() triggered ${h1.renders} delayed render(s)`);
    if (!h1.restored) holds.push('flash() left its message on the hint');
    // G: the scrollbar gutter is reserved, so modals stop shifting the page
    const g1 = await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter || '');
    if (g1.indexOf('stable') < 0) holds.push(`scrollbar-gutter is '${g1 || 'auto'}' at desktop`);
    // D + C: the phone strips survive a render — stats scrollLeft restored,
    //    nav re-centred instantly (not animated from zero) on a same-tab render
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { UI.tab = 'ledger'; render(); });
    await page.waitForTimeout(250);
    const d1 = await page.evaluate(async () => {
      const layout0 = S.uiPrefs.layout;
      S.uiPrefs.layout = 'classic';
      UI.tab = 'ledger'; render();
      await new Promise(r => setTimeout(r, 250));
      const st = document.getElementById('stats');
      /* snap off for the measurement: the assertion is that the position
         survives the innerHTML rewrite, not where proximity-snap rounds it */
      st.style.scrollSnapType = 'none';
      st.scrollLeft = 120;
      await new Promise(r => setTimeout(r, 50));
      if (!st.scrollLeft) st.scrollLeft = 120;
      render();
      await new Promise(r => setTimeout(r, 30));
      const nav = document.getElementById('tabs');
      const st2 = document.getElementById('stats');
      const out = { stats: st2 ? st2.scrollLeft : -1, nav: nav.scrollLeft, navMax: nav.scrollWidth - nav.clientWidth,
        sw: st2 ? st2.scrollWidth : -1, cw: st2 ? st2.clientWidth : -1, phone: v6mIs(), set: st.scrollLeft };
      st.style.scrollSnapType = '';
      S.uiPrefs.layout = layout0; render();
      return out;
    });
    if (d1.stats < 40) holds.push(`phone stats strip snapped home: 120 -> ${d1.stats} (set read back ${d1.set}; ${d1.sw}/${d1.cw} phone:${d1.phone})`);
    if (d1.nav === 0 && d1.navMax > 30) holds.push('phone nav sat at 0 right after a same-tab render (animating from home)');
    await page.setViewportSize({ width: 1500, height: 950 });
    await page.evaluate(() => { UI.tab = 'chamber'; render(); window.scrollTo(0, 0); });
    step('scroll-keeps', holds.length === 0,
      holds.length ? holds.join('; ') : 'same-tab renders, sheets, key re-press, flash, gutter, phone strips: all hold still');
  }

  // -- the atlas (S9c): six groups, ids disjoint from tab ids, every view
  //    reachable through its group, the keyboard covering all fifteen
  {
    const tree = await page.evaluate(() => {
      const tabIds = TABS.map(t => t.id);
      const inGroups = [];
      V7_GROUPS.forEach(g => g.tabs.forEach(t => inGroups.push(t)));
      const labels = V7_GROUPS.map(g => g.name);
      const pageLabels = TABS.map(t => t.name);
      return {
        groups: V7_GROUPS.length,
        idCollisions: V7_GROUPS.filter(g => tabIds.indexOf(g.id) >= 0).map(g => g.id),
        uncovered: tabIds.filter(t => inGroups.indexOf(t) < 0),
        doubled: inGroups.filter((t, i) => inGroups.indexOf(t) !== i),
        dupGroupLabels: labels.filter((l, i) => labels.indexOf(l) !== i),
        dupPageLabels: pageLabels.filter((l, i) => pageLabels.indexOf(l) !== i),
        dualAttr: document.querySelectorAll('#tabs [data-group][data-tab]').length,
      };
    });
    step('nav-tree', tree.groups === 6 && !tree.idCollisions.length && !tree.uncovered.length &&
      !tree.doubled.length && !tree.dupGroupLabels.length && !tree.dupPageLabels.length && tree.dualAttr === 0,
      `6 groups: ${tree.groups === 6}; group ids collide with tab ids: ${tree.idCollisions.join(',') || 'none'}; ` +
      `ungrouped: ${tree.uncovered.join(',') || 'none'}; doubled: ${tree.doubled.join(',') || 'none'}; ` +
      `duplicate labels: ${(tree.dupGroupLabels.concat(tree.dupPageLabels)).join(',') || 'none'}; dual-attribute buttons: ${tree.dualAttr}`);

    const reach = await page.evaluate(async () => {
      const missed = [];
      for (const g of V7_GROUPS) {
        document.querySelector('#tabs [data-group="' + g.id + '"]').click();
        await new Promise(r => setTimeout(r, 40));
        if (g.tabs.indexOf(UI.tab) < 0) missed.push(g.id + '->' + UI.tab);
        for (const t of g.tabs) {
          const b = document.querySelector('#tabs [data-tab="' + t + '"]');
          if (!b) { missed.push(g.id + ' misses ' + t); continue; }
          b.click();
          await new Promise(r => setTimeout(r, 40));
          if (UI.tab !== t) missed.push(t + ' click landed on ' + UI.tab);
        }
      }
      return missed;
    });
    step('nav-reach', reach.length === 0, reach.length ? reach.join('; ') : 'every view reachable through its group');

    const keys = await page.evaluate(async () => {
      const seen = {};
      for (let i = 0; i < V7_GROUPS.length; i++) {
        for (let rep = 0; rep < V7_GROUPS[i].tabs.length; rep++) {
          v7KeyNav(String(i + 1));
          seen[UI.tab] = true;
          await new Promise(r => setTimeout(r, 15));
        }
      }
      return { visited: Object.keys(seen).length, total: TABS.length };
    });
    step('nav-keys', keys.visited === keys.total,
      `digits 1-6 with cycling visit ${keys.visited} of ${keys.total} views`);

    await page.evaluate(() => { UI.tab = 'chamber'; render(); });
  }

  for (const [name, open] of [['menu', () => v6Menu()], ['guide', () => helpDialog()], ['save dialog', () => saveDialog()]]) {
    await page.evaluate(fn => { try { eval('(' + fn + ')()'); } catch (e) { window.__sheetErr = String(e); } }, open.toString());
    await page.waitForTimeout(120);
    await page.evaluate(() => { const b = document.querySelector('#sheet [data-close]'); if (b) b.click(); });
    await page.waitForTimeout(60);
  }
  const sheetErr = await page.evaluate(() => window.__sheetErr || null);
  step('sheets-open', !sheetErr, sheetErr ? 'a sheet threw: ' + sheetErr : 'council menu, field guide and save dialog all open and close');

  // -- autosave written, reload, resume --
  await page.waitForTimeout(400); // outlast the 160ms debounce
  const saved = await page.evaluate(() => !!localStorage.getItem('parliamentVale.autosave.v5'));
  step('autosave-written', saved, 'parliamentVale.autosave.v5 present');
  await page.reload();
  await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
  const resumeBtn = await page.$('[data-resume]');
  step('resume-offered', !!resumeBtn, 'setup sheet offers the device autosave');
  if (resumeBtn) {
    await resumeBtn.click();
    const resumedTurn = await page.evaluate(() => S.turn);
    step('resume-restores', resumedTurn === turnAfter, `turn after resume: ${resumedTurn} (expected ${turnAfter})`);
  }

  // -- Guide button (S1): must open the live v6+ guide with the v9 cards, not
  //    the frozen v4 field guide --
  await page.click('#btnHelp');
  await page.waitForTimeout(200);
  const guide = await page.evaluate(() => {
    const sh = document.getElementById('sheet');
    return { open: !document.getElementById('modal').hidden, v9: /The dossier/.test(sh.textContent) };
  });
  step('guide-live', guide.open && guide.v9, 'Guide opens the live chain (v9 "The dossier" card present)');
  await page.evaluate(() => { const b = document.querySelector('#sheet [data-close]'); if (b) b.click(); });

  // -- loud save read (S1): a corrupt .v5 must warn, fall through to an older
  //    intact save, and leave the corrupt blob byte-for-byte untouched --
  const blob = await page.evaluate(() => localStorage.getItem('parliamentVale.autosave.v5'));
  if (blob) {
    fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'fixtures', 'synthetic-turn2.v5.json'), blob);
  }
  await page.evaluate(b => {
    localStorage.setItem('parliamentVale.autosave.v5', '{"corrupt":');
    localStorage.setItem('parliamentVale.autosave.v4', b);
  }, blob);
  await page.reload();
  await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
  const loud = await page.evaluate(() => ({
    warning: !!document.querySelector('[data-save-warning]'),
    resume: !!document.querySelector('[data-resume]'),
    untouched: localStorage.getItem('parliamentVale.autosave.v5') === '{"corrupt":',
  }));
  step('corrupt-save-loud', loud.warning && loud.resume && loud.untouched,
    `warning shown: ${loud.warning}; older save offered: ${loud.resume}; corrupt blob untouched: ${loud.untouched}`);
  await page.screenshot({ path: path.join(OUT, 'save-warning.png') });
  await page.click('[data-resume]');
  const v4Resumed = await page.evaluate(() => S.turn);
  step('corrupt-save-fallthrough', v4Resumed === turnAfter, `resumed from the .v4 key at turn ${v4Resumed}`);

  // -- the four-rung migration (S9f): a save written on the old one-to-four
  //    ladder is rescaled onto the new one, said out loud, stamped so it can
  //    never be rescaled twice, and a statute no longer in the book is
  //    dropped and counted rather than left on a ladder nothing can read --
  {
    const old = JSON.parse(blob);
    delete old.polV2;
    old.pol = { universalHealthcare: 2, corporateCharters: 1, balancedBudgetRule: 1, incomeTax: 3, aRepealedMeasure: 2 };
    await page.evaluate(b => {
      localStorage.setItem('parliamentVale.autosave.v5', b);
      localStorage.removeItem('parliamentVale.autosave.v4');
    }, JSON.stringify(old));
    await page.reload();
    await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
    const notice = await page.evaluate(() => {
      const n = document.querySelector('[data-ladder-warning]');
      return { shown: !!n, text: n ? n.textContent : '' };
    });
    await page.click('[data-resume]');
    await page.waitForTimeout(200);
    const moved = await page.evaluate(() => ({
      pol: JSON.parse(JSON.stringify(S.pol)), stamped: S.polV2 === true,
      /* second pass over the same state must be a no-op */
      again: (function () { enrichState(S, false); return JSON.parse(JSON.stringify(S.pol)); })(),
    }));
    const want = { universalHealthcare: 3, corporateCharters: 2, balancedBudgetRule: 4, incomeTax: 3 };
    const wrong = Object.keys(want).filter(k => moved.pol[k] !== want[k]).map(k => `${k} ${moved.pol[k]} != ${want[k]}`);
    const twice = Object.keys(moved.pol).filter(k => moved.again[k] !== moved.pol[k]);
    step('ladder-migrates-loud',
      notice.shown && /dropped/.test(notice.text) && wrong.length === 0 && moved.stamped && twice.length === 0 &&
      moved.pol.aRepealedMeasure === undefined,
      `notice shown: ${notice.shown}; drop reported: ${/dropped/.test(notice.text)}; ` +
      `rescaled: ${wrong.length ? wrong.join(', ') : 'max 3 -> 3, max 2 -> 2, max 1 -> 4, max 4 unmoved'}; ` +
      `stamped: ${moved.stamped}; second pass moved: ${twice.length}`);
  }

  // -- S10d/e/f: the works instruments, the chair controls, the question pool
  {
    const late = await page.evaluate(() => {
      const me = playParty(S), out = {};
      const keep = { ruling:S.ruling, coalition:S.coalition, capital:S.capital, treasury:S.treasury,
        works:JSON.parse(JSON.stringify(S.v8.works)), committees:JSON.parse(JSON.stringify(S.committees)) };
      S.ruling = me; S.coalition = [me]; S.capital = 300; S.treasury = 4000;

      /* a work under way offers the instruments, and they show on the card */
      const w = V8_WORKS.filter(x => x.req(S))[0];
      v8WorkAction(w.id, 'commission');
      v8WorkAction(w.id, 'domestic');
      UI.tab = 'nation'; render();
      const card = document.querySelector('[data-work="' + w.id + '"]');
      out.instrumentButtons = card ? card.querySelectorAll('[data-arg="gild"],[data-arg="descope"],[data-arg="inquiry"],[data-arg="partner"]').length : 0;
      out.builtTagShown = !!(card && /domestic labour clause/i.test(card.textContent));
      out.worksCount = V8_WORKS.length;

      /* the chair controls render while leading, and the chair is a person */
      UI.tab = 'houses'; render();
      out.chairButtons = document.querySelectorAll('[data-chair]').length;
      out.chairNamed = !!S.committees[PV5_COMMITTEES[0].id].chairName;

      /* the question pool is bigger than the five sentences it replaces */
      out.questionPool = typeof V10_QT !== 'undefined' ? V10_QT.length : 0;
      out.paperPool = typeof V10_PAPERS !== 'undefined' ? V10_PAPERS.length : 0;
      out.powers = POWERS.length;

      S.v8.works = keep.works; S.committees = keep.committees;
      S.ruling = keep.ruling; S.coalition = keep.coalition; S.capital = keep.capital; S.treasury = keep.treasury;
      UI.tab = 'chamber'; render();
      return out;
    });
    step('works-instruments', late.instrumentButtons >= 4 && late.builtTagShown && late.worksCount >= 48,
      `${late.worksCount} works; a work under way offers ${late.instrumentButtons} instruments and the card says how it is being built: ${late.builtTagShown}`);

    /* S15c: the berth queue and the filter, through the rendered page rather
       than through the model. The queue's whole point is that a commission at
       the cap is no longer refused, and the only place a player meets that is
       the button on the card. */
    const berth = await page.evaluate(() => {
      const me = playParty(S), out = {};
      const keep = { ruling:S.ruling, coalition:S.coalition, capital:S.capital, treasury:S.treasury,
        works:JSON.parse(JSON.stringify(S.v8.works)), queue:(S.v8.queue || []).slice(),
        filter:S.uiPrefs.workFilter, tab:UI.tab };
      S.ruling = me; S.coalition = [me]; S.capital = 400; S.treasury = 6000;
      S.v8.works = {}; S.v8.queue = [];

      const open = V8_WORKS.filter(x => x.req(S)).map(x => x.id);
      out.berths = v8WorkMax(S);
      open.slice(0, out.berths).forEach(id => v8WorkAction(id, 'commission'));
      out.filled = v8ActiveWorks(S).length;

      UI.tab = 'nation'; render();
      const waiter = open[out.berths];
      const card = document.querySelector('[data-work="' + waiter + '"]');
      const join = card && card.querySelector('[data-arg="commission"]');
      out.saysJoin = !!(join && !join.disabled && /queue/i.test(join.textContent));
      const cap0 = S.capital;
      if (join) join.click();
      out.inQueue = (S.v8.queue || []).indexOf(waiter) === 0;
      out.chargedNothing = S.capital === cap0;

      const after = document.querySelector('[data-work="' + waiter + '"]');
      out.cardQueued = !!(after && after.classList.contains('queued') && /first in the queue/i.test(after.textContent));
      out.canLeave = !!(after && after.querySelector('[data-arg="unqueue"]'));

      const chip = document.querySelector('[data-workfilter="queued"]');
      out.hasStrip = !!chip;
      if (chip) chip.click();
      out.shownQueued = document.querySelectorAll('.works-list .work-card').length;
      const all = document.querySelector('[data-workfilter="all"]');
      if (all) all.click();
      out.shownAll = document.querySelectorAll('.works-list .work-card').length;

      S.v8.works = keep.works; S.v8.queue = keep.queue; S.uiPrefs.workFilter = keep.filter;
      S.ruling = keep.ruling; S.coalition = keep.coalition; S.capital = keep.capital; S.treasury = keep.treasury;
      UI.tab = keep.tab; render();
      return out;
    });
    step('works-queue-and-filter',
      berth.filled === berth.berths && berth.saysJoin && berth.inQueue && berth.chargedNothing &&
      berth.cardQueued && berth.canLeave && berth.hasStrip && berth.shownQueued === 1 &&
      berth.shownAll >= 48,
      `${berth.filled} of ${berth.berths} berths filled through the cards; the next card's button reads as a queue ` +
      `(${berth.saysJoin}), clicking it queues without charging (${berth.inQueue}/${berth.chargedNothing}), the card ` +
      `then says where it stands and offers to leave (${berth.cardQueued}/${berth.canLeave}); the filter strip cuts ` +
      `${berth.shownAll} cards to ${berth.shownQueued} and back`);
    /* S11a: the record deck. Twenty charts on a page render() rebuilds on every
       action — the whole design is that a collapsed panel is a SLOT and opening
       it fills it, so this has to be walked in a real browser. */
    await page.evaluate(() => {
      /* the scripted run closes two sessions, which is not enough history for
         any chart to draw — so run the recorder forward and restore the turn.
         The point of this step is the FILL PATH, not the fixture's depth. */
      const keepTurn = S.turn;
      for (let i = 0; i < 24; i++) { S.turn = i + 1; v11HistTick(S); }
      S.turn = keepTurn;
      UI.tab = 'record'; render();
    });
    await page.waitForTimeout(220);
    const deck = await page.evaluate(() => {
      const out = {};
      out.charts = V10_RECORD_CHARTS.length;
      out.slots = document.querySelectorAll('[data-chart-slot]').length;
      out.drawn = document.querySelectorAll('#view .hist-wrap').length;
      out.chips = document.querySelectorAll('[data-recrange]').length;
      const t0 = performance.now(); for (let i = 0; i < 10; i++) render();
      out.msCollapsed = +((performance.now() - t0) / 10).toFixed(2);
      /* open one panel by its heading, the way a reader does */
      /* pick a panel whose chart reads from the primed v11 columns, so the
         fill produces a real chart rather than an honest empty-state */
      const want = V10_RECORD_CHARTS.filter(c => c.src === 'v11')[0].id;
      const slot = document.querySelector('[data-chart-slot="' + want + '"]') || document.querySelector('[data-chart-slot]');
      const panel = slot && slot.closest('.panel');
      const h = panel && panel.querySelector('h2');
      if (h) h.click();
      out.filled = !!(panel && panel.querySelector('.hist-wrap') && !panel.querySelector('[data-chart-slot]'));
      out.keyed = panel && panel.querySelector('.hist-wrap') ? panel.querySelector('.hist-wrap').dataset.chart : null;
      out.prefSaved = !!(S.uiPrefs.folds && h && S.uiPrefs.folds[v7FoldKey('record', h.textContent)] === false);
      /* the range chip changes the sample and forgets the old scroll offset */
      UI.chartScroll = { probe: 999 };
      const chip = document.querySelector('[data-recrange="5"]');
      if (chip) chip.click();
      out.rangeSaved = S.uiPrefs.recRange === '5';
      out.scrollCleared = Object.keys(UI.chartScroll).length === 0;
      const back = document.querySelector('[data-recrange="all"]'); if (back) back.click();
      return out;
    });
    step('record-deck', deck.charts >= 20 && deck.slots >= 19 && deck.chips === 5 &&
      deck.filled && deck.keyed && deck.rangeSaved && deck.scrollCleared,
      `${deck.charts} charts, ${deck.slots} of them slots on arrival; ` +
      `${deck.msCollapsed}ms a render collapsed; opening one fills it (${deck.keyed}) and saves the preference: ${deck.prefSaved}; ` +
      `the range chip saves and clears the remembered scroll: ${deck.rangeSaved && deck.scrollCleared}`);

    // -- S12: the ladder says what each rung does, and locked statutes say why
    const prose = await page.evaluate(() => {
      const out = {};
      const withProse = POLICIES.filter(p => p.rungs);
      out.withProse = withProse.length;
      if (withProse.length) {
        const p0 = withProse[0];
        v9Dossier(p0.id);
        const sheet = document.querySelector('#sheet') || document.querySelector('.sheet');
        const says = [...document.querySelectorAll('.tier .rung-say')];
        out.rendered = says.length;
        out.textMatches = says.length ? says[0].textContent.trim() === p0.rungs[0].trim() : false;
        /* THE SPECIFICITY TRAP: `.sheet p` is 0,0,1,1 and would beat a
           single-class rule whatever the source order, rendering the prose
           LARGER than the mechanics line above it. */
        const small = document.querySelector('.tier small');
        out.proseSize = says.length ? parseFloat(getComputedStyle(says[0]).fontSize) : 0;
        out.mechSize = small ? parseFloat(getComputedStyle(small).fontSize) : 0;
        out.proseSmallerThanHeading = out.proseSize > 0 && out.proseSize < 15;
        out.sheetScrolls = sheet ? sheet.scrollHeight > sheet.clientHeight - 1 : false;
        out.sheetH = sheet ? Math.round(sheet.getBoundingClientRect().height) : 0;
        /* rung zero stays silent */
        const tiers = [...document.querySelectorAll('.tier')];
        out.rungZeroSilent = tiers.length ? !tiers[0].querySelector('.rung-say') : true;
        const close = document.querySelector('[data-close]'); if (close) close.click();
      }
      /* the locked statutes */
      UI.tab = 'policy'; UI.polCat = 'all'; UI.polSearch = ''; render();
      const locked = [...document.querySelectorAll('#view .card.locked')];
      out.locked = locked.length;
      out.lockedStateReason = locked.every(el => /\S/.test((el.querySelector('.tag.down') || {}).textContent || ''));
      out.lockedDisabled = locked.every(el => [...el.querySelectorAll('[data-pol]')].every(b => b.hasAttribute('disabled')));
      const counts = {};
      document.querySelectorAll('#view .subhead, #view summary').forEach(h => {
        const m = /^(.+?)\s+(\d+)$/.exec(h.textContent.trim());
        if (m) counts[m[1]] = parseInt(m[2], 10);
      });
      out.coreOff24 = V12_CORE_CATS.filter(c => counts[c] !== 24);
      UI.tab = 'chamber'; render();
      return out;
    });
    step('statute-prose', prose.withProse === 0 || (prose.rendered === 4 && prose.textMatches &&
      prose.proseSmallerThanHeading && prose.rungZeroSilent && prose.sheetScrolls),
      prose.withProse === 0 ? 'no statute carries prose yet; the ladder renders as it always did'
        : `${prose.withProse} statutes carry prose; the dossier renders ${prose.rendered} rung lines at ${prose.proseSize}px against ` +
          `${prose.mechSize}px of mechanics (a single-class rule would have lost to .sheet p and come out at 15px); ` +
          `rung zero stays silent (${prose.rungZeroSilent}); the sheet is ${prose.sheetH}px and scrolls inside itself (${prose.sheetScrolls})`);

    step('locked-statutes', prose.coreOff24.length === 0 && prose.lockedStateReason && prose.lockedDisabled,
      prose.coreOff24.length ? 'these core books do not read twenty-four: ' + prose.coreOff24.join(', ')
        : `every core category heading reads twenty-four; ${prose.locked} statutes are listed locked, all of them state their condition ` +
          `and none offers a draft button`);

    // -- S11e: the department strip is on the card and its buttons work
    const dept = await page.evaluate(() => {
      const keep = { capital:S.capital, treasury:S.treasury, ruling:S.ruling, coalition:S.coalition };
      const me = playParty(S);
      S.ruling = me; S.coalition = [me]; S.capital = 300; S.treasury = 99999;
      ['pres', 'vpres', 'chan', 'vchan'].forEach(d => S.exec[d] = me);
      pv5PortfolioRows().slice(0, 4).forEach(r => { S.cabinet[r.key] = 1; });
      pv5EnsureState(S, false);
      UI.tab = 'government'; render();
      const out = {};
      out.panel = [...document.querySelectorAll('#view .panel h2')].some(h => /The Departments/.test(h.textContent));
      out.strips = document.querySelectorAll('#view .dept-strip').length;
      out.fundButtons = document.querySelectorAll('#view [data-fund]').length;
      const btn = document.querySelector('#view [data-fund]:not([disabled])');
      out.clickable = !!btn;
      if (btn) {
        const key = btn.getAttribute('data-fund'), lvl = +btn.getAttribute('data-fundlevel');
        const exp0 = budget(S).exp;
        btn.click();
        out.moved = v11Dept(S, key).funding === lvl;
        out.budgetMoved = Math.abs(budget(S).exp - exp0) > 0.01;
        /* and it rides the save */
        const back = JSON.parse(JSON.stringify(S));
        out.ridesTheSave = !!(back.v11 && back.v11.depts && back.v11.depts[key] &&
          back.v11.depts[key].funding === lvl);
      }
      /* the interests panel is on its own tab */
      UI.tab = 'politics'; render();
      let html = document.getElementById('view').innerHTML;
      if (!/What the Organisations Are Worth/.test(html)) {
        const t = [...document.querySelectorAll('[data-subtab],[data-tab]')].find(b => /interest/i.test(b.textContent || ''));
        if (t) { t.click(); html = document.getElementById('view').innerHTML; }
      }
      out.interestPanel = /What the Organisations Are Worth/.test(html) || (function () {
        UI.tab = 'interests'; render(); return /What the Organisations Are Worth/.test(document.getElementById('view').innerHTML);
      })();
      S.capital = keep.capital; S.treasury = keep.treasury; S.ruling = keep.ruling; S.coalition = keep.coalition;
      UI.tab = 'chamber'; render();
      return out;
    });
    step('departments', dept.panel && dept.strips >= 4 && dept.fundButtons >= 12 && dept.clickable &&
      dept.moved && dept.budgetMoved && dept.ridesTheSave && dept.interestPanel,
      `The Departments panel present; ${dept.strips} department strips on the ministry cards with ${dept.fundButtons} settlement controls; ` +
      `changing one through its own button moves the department (${dept.moved}), moves the budget (${dept.budgetMoved}) and rides the save (${dept.ridesTheSave}); ` +
      `the interests page carries its worth panel (${dept.interestPanel})`);

    // -- S11d: the Constitution page renders the document and a real vote
    const con = await page.evaluate(() => {
      const keep = { capital:S.capital, ruling:S.ruling, coalition:S.coalition, turn:S.turn };
      const me = playParty(S);
      S.ruling = me; S.coalition = [me]; S.capital = 200;
      UI.tab = 'state'; render();
      const out = {};
      const titles = [...document.querySelectorAll('#view .panel h2')].map(h => h.textContent.trim());
      out.titles = titles.length;
      out.hasDoc = titles.some(t => /Constitution of Vale/.test(t));
      out.hasPending = titles.some(t => /Before the Country/.test(t));
      out.hasActs = titles.some(t => /Constitutional Acts/.test(t));
      out.books = V11_BOOKS.filter(b => titles.indexOf(b.name) >= 0).length;
      /* the books arrive COLLAPSED -- twenty-odd open panels on one tab is the
         wall the sixth order asked to be rid of elsewhere */
      out.collapsedOnArrival = V11_BOOKS.filter(b => v7DefaultCollapsed('state', b.name.toLowerCase())).length;
      out.artButtons = document.querySelectorAll('#view [data-art]').length;
      /* S15e: every card offers two roads now, one to the chambers and one to
         the country, so a card carries two data-art buttons. */
      const list = () => Array.isArray(S.v11.con.pending) ? S.v11.con.pending
        : (S.v11.con.pending ? [S.v11.con.pending] : []);
      out.routes = [...new Set([...document.querySelectorAll('#view [data-artroute]')]
        .map(b => b.getAttribute('data-artroute')))].sort().join(',');
      /* lay THREE through the real buttons, not the model */
      const ids = [];
      for (let i = 0; i < 3; i++) {
        const b2 = document.querySelector('#view [data-artroute="assembly"]:not([disabled])') ||
          document.querySelector('#view [data-art]:not([disabled])');
        if (!b2) break;
        ids.push(b2.getAttribute('data-art'));
        b2.click();
        render();
      }
      out.clickable = ids.length === 3;
      out.laid = list().length === 3 && ids.every(id => list().some(p => p.id === id));
      out.pendingCards = document.querySelectorAll('#view .pending-art').length;
      out.campaignBtns = document.querySelectorAll('#view [data-artcampaign]').length;
      /* the fourth is refused, and the card says why */
      const b4 = document.querySelector('#view [data-artroute="assembly"][disabled]');
      out.fourthDisabled = !!b4 && /already before the country/.test(b4.getAttribute('title') || '');
      out.pendingShown = /Before the Country/.test(document.getElementById('view').innerHTML) && out.pendingCards === 3;
      /* and they survive a save and a reload of the blob */
      const back = JSON.parse(JSON.stringify(S));
      out.ridesTheSave = !!(back.v11 && back.v11.con && Array.isArray(back.v11.con.pending) &&
        back.v11.con.pending.length === 3);
      /* put them: one tick, three verdicts. Degrades on a build that predates
         S15e, where nothing was laid because there is no plebiscite road and
         only one article may be pending -- Math.max of an empty list is
         -Infinity and would take the turn counter with it. */
      const dues = list().map(p => p.due);
      if (dues.length) { S.turn = Math.max.apply(null, dues); v11ConTick(S); }
      out.resolved = dues.length > 0 && list().length === 0;
      out.docOrFailed = ids.length > 0 && ids.every(id => v11Adopted(S, id) || !!S.v11.con.failed[id]);
      /* an old save's single pending article is kept and the page says so */
      const oldBlob = JSON.parse(JSON.stringify(S));
      oldBlob.v11.con.pending = { id:'artPreamble', repeal:false, laid:1, due:3, campaign:0 };
      UI.conMigrated = 0;
      const fixed = v11Con(oldBlob);
      out.migrated = Array.isArray(fixed.pending) && fixed.pending.length === 1 &&
        fixed.pending[0].id === 'artPreamble' && UI.conMigrated === 1;
      render();
      out.migrationSaid = !!document.querySelector('#view [data-con-warning]');
      UI.conMigrated = 0;
      S.capital = keep.capital; S.ruling = keep.ruling; S.coalition = keep.coalition; S.turn = keep.turn;
      if (S.v11) S.v11.con = { arts:{}, order:[], pending:[], failed:{}, conv:0, convUsed:0, plebiscites:0 };
      UI.tab = 'chamber'; render();
      return out;
    });
    step('constitution-page', con.hasDoc && con.hasPending && con.hasActs && con.books === 8 &&
      con.collapsedOnArrival === 8 && con.artButtons >= 160 && con.routes === 'assembly,plebiscite' &&
      con.clickable && con.laid && con.pendingCards === 3 && con.campaignBtns === 3 &&
      con.fourthDisabled && con.pendingShown && con.ridesTheSave && con.resolved && con.docOrFailed &&
      con.migrated && con.migrationSaid,
      `${con.titles} panels: the document, what is before the country, ${con.books} books (all ${con.collapsedOnArrival} collapsed on arrival) and the acts; ` +
      `${con.artButtons} article controls offering ${con.routes}; three laid through their own buttons appear as ` +
      `${con.pendingCards} cards with ${con.campaignBtns} campaign controls (${con.laid}), the fourth is refused on the card ` +
      `(${con.fourthDisabled}), they ride the save (${con.ridesTheSave}), one tick settles all three (${con.resolved}); ` +
      `and a save carrying one pending article keeps it and is told so on the page (${con.migrated}/${con.migrationSaid})`);

    step('chairs-and-pools', late.chairButtons > 0 && late.chairNamed && late.questionPool >= 160 && late.paperPool >= 32 && late.powers >= 11,
      `${late.chairButtons} chair controls while leading, chairs are named: ${late.chairNamed}; ` +
      `${late.questionPool} questions, ${late.paperPool} papers, ${late.powers} powers`);
  }

  // -- S10c: the order book issues, stands, lapses and revokes
  {
    const ord = await page.evaluate(() => {
      const me = playParty(S);
      const keep = { ruling: S.ruling, coalition: S.coalition, exec: JSON.parse(JSON.stringify(S.exec)), capital: S.capital };
      S.ruling = me; S.coalition = [me];
      ['pres', 'vpres', 'chan', 'vchan'].forEach(d => S.exec[d] = me);
      S.capital = 300;
      UI.tab = 'exec'; render();
      const panel = [...document.querySelectorAll('.panel h2')].some(h => /Order Book/.test(h.textContent));
      const buttons = document.querySelectorAll('[data-order]').length;
      const o = pick(V10_ORDERS, 'establishmentFreeze', x => !x.target && !x.needs && Object.keys(x.ind || {}).length, 'the order the panel issues');
      const key = Object.keys(o.ind)[0];
      const t0 = indicatorTargets(S)[key];
      v10IssueOrder(o.id, null);
      const inForce = v10OrderCount(S) === 1;
      const bent = Math.abs(indicatorTargets(S)[key] - t0 - o.ind[key]) < 1e-9;
      render();
      const revokeBtn = document.querySelectorAll('[data-order-revoke]').length > 0;
      v10RevokeOrder(o.id);
      const back = v10OrderCount(S) === 0 && Math.abs(indicatorTargets(S)[key] - t0) < 1e-9;
      S.ruling = keep.ruling; S.coalition = keep.coalition; S.exec = keep.exec; S.capital = keep.capital;
      if (S.v10) S.v10.orders = {};
      UI.tab = 'chamber'; render();
      return { panel, buttons, inForce, bent, revokeBtn, back };
    });
    step('order-book', ord.panel && ord.buttons > 20 && ord.inForce && ord.bent && ord.revokeBtn && ord.back,
      `panel renders with ${ord.buttons} sign buttons; issuing bends the target exactly: ${ord.bent}; ` +
      `a revoke control appears: ${ord.revokeBtn}; revoking puts it back: ${ord.back}`);
  }

  /* S14: THE THREE SPLICES NOTHING WAS WATCHING. `marker-integrity` counts
     literal marker strings; it can only see a literal written inline at the
     call site, and it asks whether the string occurs twice anywhere in the
     file. Neither test reaches these three, and all three fail SILENTLY -- the
     splice misses, the base HTML is returned, and what the player loses is a
     whole feature or, worse, correct data replaced by wrong data.

       vale.html  the splice                        what vanishes
       :15936     '<article class="card region-card">' held in a VARIABLE, then
                  a positional split: parts[i] is paired with REGIONS[i-1].
                  A second .region-card anywhere in that view mis-assigns EVERY
                  governor strip by one region. Wrong data, not missing data,
                  and the check has never seen this marker at all.
       :19726     the region-action splice, marker also built in a variable,
                  cutting at '</button>'. All of V9_REGION_ACTS disappears from
                  the federation tab.
       :24869     'html.lastIndexOf("<div class=\'btnrow\'>")' replaces the
                  fixed button row with the authored Question Time replies. Miss
                  it and 164 authored questions revert to v8's generic row,
                  which still works, so the whole feature is invisible.
                  chairs-and-pools checks the POOL SIZE, never a rendered reply. */
  {
    const spl = await page.evaluate(() => {
      const out = {};
      const keep = UI.tab;
      UI.tab = 'federation'; render();
      const cards = [...document.querySelectorAll('.region-card')];
      out.cards = cards.length;
      out.regions = REGIONS.length;
      /* each card's governor strip must belong to the region whose card it is */
      out.misassigned = cards.map((c, i) => {
        const h = c.querySelector('h3'), g = c.querySelector('[data-governor]');
        const r = REGIONS[i];
        return (!r || !g || g.getAttribute('data-governor') !== r.id ||
          (h ? h.textContent.trim() : '') !== r.name) ? (r ? r.id : '#' + i) : null;
      }).filter(Boolean);
      /* and every region action reaches every region */
      const acts = Object.keys(V9_REGION_ACTS);
      out.acts = acts.length;
      out.regionsMissingActs = REGIONS.filter(r => {
        const got = [...document.querySelectorAll('[data-region="' + r.id + '"][data-region-action]')]
          .map(b => b.getAttribute('data-region-action'));
        return acts.some(a => got.indexOf(a) < 0);
      }).map(r => r.id);
      /* the despatch box answers with its own replies, not v8's fixed row */
      S.v8.qt.pending = true; S.v8.qt.turn = S.turn;
      if (typeof v8EnsureQuestion === 'function') v8EnsureQuestion(S);
      UI.tab = 'chamber'; render();
      const want = (S.v8.qt.opts || []).map(o => o.id);
      const got = [...document.querySelectorAll('[data-v8act="qt"]')]
        .map(b => b.getAttribute('data-id')).filter(Boolean);
      out.qtWant = want.length;
      out.qtGot = got.length;
      out.qtMatches = want.length > 0 && want.length === got.length && want.every((id, i) => id === got[i]);
      /* v8's own row also carries data-v8act="qt" buttons with ids of its own,
         so a count match is not a match -- name the first id that differs. */
      out.qtFirstDiff = out.qtMatches ? null
        : { want: want[want.findIndex((id, i) => id !== got[i])] || '(none)',
            got: got[want.findIndex((id, i) => id !== got[i])] || '(none)' };
      UI.tab = keep; render();
      return out;
    });
    /* S15d: the signature, through the rendered page. The roads harness drives
       the model; what only the page can answer is whether the sheet the queue
       shows is the assent sheet, whether its four buttons are wired, and
       whether the card draws the fourth pip and the two levers on a refused
       bill. */
    const sig = await page.evaluate(() => {
      const out = {}, me = playParty(S), STAT = 'incomeTax';
      const keep = { tab:UI.tab, bills:S.bills, pol:S.pol[STAT], seats:JSON.parse(JSON.stringify(S.seats)),
        exec:JSON.parse(JSON.stringify(S.exec)), cap:S.capital, tre:S.treasury,
        upper:JSON.parse(JSON.stringify(S.upper)), lower:JSON.parse(JSON.stringify(S.lower)),
        ruling:S.ruling, coalition:S.coalition, queue:UI.queue, pending:S.pendingAssent };
      S.lower = { exists:true, suspended:false };
      S.upper = { exists:true, elected:true, veto:2, ceremonial:false, seats:{} };
      S.ruling = me; S.coalition = [me];
      S.seats = {}; S.seats[me] = 1305;
      S.upper.seats = {}; S.upper.seats[me] = 120;
      S.bills = []; S.pol[STAT] = 0; S.capital = 600; S.treasury = 3000; S.pendingAssent = [];
      ['pres','vpres','chan','vchan'].forEach(d => { S.exec[d] = me; });
      S.figures.exec = {};

      /* run it to the desk */
      const bill = sponsorBill(S, STAT, 1, 'player', 'clean', true);
      out.sponsored = !!bill;
      out.pace = typeof billPace === 'function' ? billPace(S, bill) : 1;
      for (let i = 0; i < 4 && bill.stage !== 'assent' && S.bills.indexOf(bill) >= 0; i++) {
        advanceBills(S); if (bill.stage !== 'assent') S.turn++;
      }
      out.stage = bill && bill.stage;
      out.queued = (S.pendingAssent || []).indexOf(bill.id) >= 0;

      /* the card: four pips, the fourth lit, and the office named */
      UI.tab = 'houses'; render();
      /* the article carries no data-bill of its own -- the buttons do -- so
         it is found by the bill number printed on it */
      const findCard = (id) => [].slice.call(document.querySelectorAll('article.bill'))
        .filter(a => { const n = a.querySelector('.bill-no'); return n && n.textContent.trim() === id; })[0] || null;
      const card = findCard(bill.id);
      out.cardFound = !!card;
      if (card) {
        const st = [].slice.call(card.querySelectorAll('.timeline .stage'));
        out.pips = st.length;
        out.lastPip = st.length ? st[st.length - 1].className.trim() : '';
        out.labels = [].slice.call(card.querySelectorAll('.stage-labels span')).map(x => x.textContent).join(',');
        out.saysOffice = /Chancellor/.test(card.textContent);
      }

      /* the sheet, through the real queue. Degrades rather than throws on a
         build that predates S15d, so this step can be run against the old
         file and show what it did. */
      UI.queue = (typeof assentEvent === 'function' ? [assentEvent(S, bill.id)] : []).filter(Boolean);
      out.hasEvent = UI.queue.length === 1;
      let done = false;
      runQueue(() => { done = true; });
      const sheet = document.getElementById('sheet');
      out.sheetTitle = sheet ? (sheet.querySelector('h2') || {}).textContent : '';
      const choices = sheet ? [].slice.call(sheet.querySelectorAll('[data-ev]')) : [];
      out.choices = choices.map(c => (c.childNodes[0] || {}).textContent || c.textContent.split('\n')[0]);
      /* pick "Return it with objections" so the outcome is visible without
         ending the bill */
      if (choices[2]) choices[2].click();
      out.afterReturn = bill.stage;
      out.returnedFlag = !!bill.returned;
      out.queueDrained = done;

      /* a refused bill offers the two levers */
      bill.stage = 'assent'; bill.assentOffice = 'chan'; bill.refused = S.turn;
      bill.assemblyVote = 88; S.exec.chan = 'pnl'; S.figures.exec = {};
      render();
      const card2 = findCard(bill.id);
      out.pressBtn = !!(card2 && card2.querySelector('[data-bill-action="pressOffice"]'));
      const ov = card2 && card2.querySelector('[data-bill-action="override"]');
      out.overrideBtn = !!ov && !ov.disabled;
      const cap0 = S.capital;
      if (ov) ov.click();
      out.overrodeToLaw = (S.pol[STAT] || 0) > 0;
      out.overridePaid = S.capital < cap0;

      S.bills = keep.bills; S.pol[STAT] = keep.pol; S.seats = keep.seats; S.exec = keep.exec;
      S.capital = keep.cap; S.treasury = keep.tre; S.upper = keep.upper; S.lower = keep.lower;
      S.ruling = keep.ruling; S.coalition = keep.coalition; S.pendingAssent = keep.pending || [];
      UI.queue = keep.queue || []; UI.busy = false;
      UI.tab = keep.tab; render();
      return out;
    });
    step('assent-sheet-and-pip',
      sig.stage === 'assent' && sig.queued && sig.pips === 4 && sig.lastPip === 'stage now' &&
      sig.labels === 'Committee,Assembly,Senate,Assent' && sig.saysOffice &&
      sig.choices.length === 4 && /Asked to Sign/.test(sig.sheetTitle) &&
      sig.afterReturn !== 'assent' && sig.returnedFlag &&
      sig.pressBtn && sig.overrideBtn && sig.overrodeToLaw && sig.overridePaid,
      `a bill that carried both houses sits at ${sig.stage}; the card draws ${sig.pips} pips ` +
      `[${sig.labels}] with the last reading "${sig.lastPip}" and names the office (${sig.saysOffice}); ` +
      `the queue shows "${sig.sheetTitle}" with ${sig.choices.length} answers; returning it puts the bill back ` +
      `to ${sig.afterReturn}; a refused bill offers both levers (${sig.pressBtn}/${sig.overrideBtn}) and the ` +
      `override puts it in the book and is paid for (${sig.overrodeToLaw}/${sig.overridePaid})`);

    /* S15f: the party purse, through the rendered page. The roads harness
       drives the model; what only the page can answer is whether the panel is
       on BOTH exits of viewParties (the no-elections early return is the one
       a terminal form takes), whether a real click spends party money, and
       whether the fundraiser raises it. */
    const pf = await page.evaluate(() => {
      const out = {}, me = playParty(S);
      const keep = { tab:UI.tab, form:S.form, cap:S.capital, tre:S.treasury, ruling:S.ruling,
        coalition:S.coalition, purse:JSON.parse(JSON.stringify(S.purse || {})), funding:S.funding };
      S.ruling = me; S.coalition = [me]; S.capital = 400; S.treasury = 2000; S.funding = {};
      if (S.purse) PARTIES.forEach(p => { S.purse[p.id] = 300; });
      const titles = () => [...document.querySelectorAll('#view .panel h2')].map(h => h.textContent.trim());

      UI.tab = 'parties'; render();
      out.onElections = titles().some(t => /Party Funds/.test(t));
      /* the exit a terminal form takes */
      S.form = 'oneparty'; render();
      out.onNoElections = titles().some(t => /Party Funds/.test(t));
      S.form = keep.form; render();

      /* a real click on a money-bearing party action spends the purse */
      const acts = {}; partyActions(me).forEach(a => { acts[a.id] = a; });
      const btn = [...document.querySelectorAll('#view [data-party="' + me + '"][data-pact]')]
        .filter(b => { const a = acts[b.getAttribute('data-pact')]; return a && actionMoney(a) && !b.disabled; })[0];
      out.clickable = !!btn;
      if (btn) {
        const t0 = S.treasury, p0 = typeof partyPurse === 'function' ? partyPurse(S, me) : 0;
        btn.click();
        out.treasuryUnmoved = S.treasury === t0;
        out.purseSpent = (typeof partyPurse === 'function' ? partyPurse(S, me) : 0) < p0;
        out.fundingWritten = (S.funding && S.funding[me] > 0) || false;
      }

      /* the fundraiser raises it */
      render();
      const fb2 = document.querySelector('#view [data-fundact="drive"]');
      out.hasDrive = !!fb2;
      if (fb2 && !fb2.disabled) {
        const p1 = partyPurse(S, me);
        fb2.click();
        out.driveRaised = partyPurse(S, me) > p1;
      }

      S.purse = keep.purse; S.funding = keep.funding; S.capital = keep.cap; S.treasury = keep.tre;
      S.ruling = keep.ruling; S.coalition = keep.coalition; S.form = keep.form;
      UI.tab = keep.tab; render();
      return out;
    });
    step('party-funds-panel',
      pf.onElections && pf.onNoElections && pf.clickable && pf.treasuryUnmoved && pf.purseSpent &&
      pf.fundingWritten && pf.hasDrive && pf.driveRaised,
      `the Party Funds panel is on both exits of viewParties (${pf.onElections}/${pf.onNoElections}); a real click on ` +
      `a money-bearing party action leaves the national treasury where it was (${pf.treasuryUnmoved}), takes the ` +
      `money out of the party's purse (${pf.purseSpent}) and writes st.funding (${pf.fundingWritten}); and a ` +
      `fundraising drive raises party money (${pf.driveRaised})`);

    /* S15g: the measures panel, through the rendered page. The case that
       matters is the one that rendered nothing: a party with no book of its
       own, on turn one, under a constitution that opens nothing. */
    const xm = await page.evaluate(() => {
      const out = {};
      const keep = { tab:UI.tab, ruling:S.ruling, playAs:S.playAs, coalition:S.coalition,
        cap:S.capital, extra:JSON.parse(JSON.stringify(S.extra || {})),
        filter:S.uiPrefs && S.uiPrefs.extraFilter };
      S.ruling = 'sd'; S.playAs = 'sd'; S.coalition = ['sd']; S.capital = 500;
      if (S.uiPrefs) S.uiPrefs.extraFilter = 'all';
      S.extra = {};
      UI.tab = 'exec'; render();
      const panel = [...document.querySelectorAll('#view .panel')]
        .filter(x => /Extraordinary Measures/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      out.found = !!panel;
      if (panel) {
        out.cards = panel.querySelectorAll('.card').length;
        out.locked = panel.querySelectorAll('.card.locked').length;
        out.reasons = panel.querySelectorAll('.card .note.muted').length;
        out.books = panel.querySelectorAll('h3.eyebrow').length;
        out.filters = panel.querySelectorAll('[data-extrafilter]').length;
        out.signButtons = panel.querySelectorAll('[data-extra]').length;
        out.allDisabled = [...panel.querySelectorAll('[data-extra]')].every(b => b.disabled);
      }
      /* the filter cuts the list */
      const chip = document.querySelector('#view [data-extrafilter="mine"]');
      if (chip) { chip.click(); }
      const panel2 = [...document.querySelectorAll('#view .panel')]
        .filter(x => /Extraordinary Measures/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      out.mineCards = panel2 ? panel2.querySelectorAll('.card').length : 0;
      const all = document.querySelector('#view [data-extrafilter="all"]');
      if (all) all.click();

      /* a government that CAN sign one: sign it through the card, then repeal
         it through the card */
      S.ruling = 'pnl'; S.playAs = 'pnl'; S.coalition = ['pnl']; S.capital = 800;
      render();
      const btn = document.querySelector('#view [data-extra]:not([disabled])');
      out.signable = !!btn;
      if (btn) {
        const id = btn.getAttribute('data-extra');
        btn.click();
        out.signed = S.extra[id];
        render();
        const rep = document.querySelector('#view [data-extrarepeal="' + id + '"]:not([disabled])');
        out.repealable = !!rep;
        if (rep) { rep.click(); out.repealed = S.extra[id]; }
      }
      S.extra = keep.extra; S.ruling = keep.ruling; S.playAs = keep.playAs;
      S.coalition = keep.coalition; S.capital = keep.cap;
      if (S.uiPrefs) S.uiPrefs.extraFilter = keep.filter;
      UI.tab = keep.tab; render();
      return out;
    });
    step('measures-render-locked',
      xm.found && xm.cards >= 60 && xm.locked > 0 && xm.reasons === xm.cards && xm.books >= 6 &&
      xm.filters >= 4 && xm.allDisabled && xm.mineCards > 0 && xm.mineCards < xm.cards &&
      xm.signable && xm.signed === 'pending' && xm.repealable && xm.repealed === 'repealed',
      `a Social Democrat on turn one sees ${xm.cards} cards in ${xm.books} books, ${xm.locked} of them locked, ` +
      `every one carrying its reason (${xm.reasons}) and every sign button off (${xm.allDisabled}) -- the panel ` +
      `rendered no cards at all before this PR; the filter cuts ${xm.cards} to ${xm.mineCards}; and a government ` +
      `that can sign one signs it through the card (${xm.signed}) and repeals it through the card (${xm.repealed})`);

    /* S15h: the seat readouts, through the rendered page. What only the page
       can answer is whether the three panels carry the figure at all and
       whether it MOVES when the player buys something -- a readout computed
       once at boot would look identical to a live one on a single render. */
    const cw = await page.evaluate(() => {
      const out = {}, me = playParty(S);
      const keep = { tab:UI.tab, cap:S.capital, ruling:S.ruling, playAs:S.playAs,
        coalition:S.coalition, purse:JSON.parse(JSON.stringify(S.purse || {})),
        campaign:JSON.parse(JSON.stringify(S.campaign || {})) };
      S.ruling = me; S.coalition = [me]; S.capital = 400;
      if (S.purse) PARTIES.forEach(p => { S.purse[p.id] = 400; });

      UI.tab = 'campaign'; render();
      const panel = [...document.querySelectorAll('#view .panel')]
        .filter(x => /What the Campaign Is Worth/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      out.found = !!panel;
      if (panel) {
        out.tiles = panel.querySelectorAll('.macro-tile').length;
        out.labels = [...panel.querySelectorAll('.macro-tile b')].map(b => b.textContent.trim());
        out.text = panel.textContent;
        out.saysCeiling = /ceiling/.test(out.text);
      }
      /* it is LIVE: buy ground organisation and the campaign's own figure moves */
      const readCampaign = () => {
        const p = [...document.querySelectorAll('#view .panel')]
          .filter(x => /What the Campaign Is Worth/.test((x.querySelector('h2') || {}).textContent || ''))[0];
        if (!p) return null;
        const t = [...p.querySelectorAll('.macro-tile')]
          .filter(x => /The campaign/.test((x.querySelector('b') || {}).textContent || ''))[0];
        return t ? t.querySelector('strong').textContent.trim() : null;
      };
      const before = readCampaign();
      const fieldBtn = document.querySelector('#view [data-campaign-action="field"]:not([disabled])');
      out.canBuy = !!fieldBtn;
      if (fieldBtn) { fieldBtn.click(); fieldBtn.click(); fieldBtn.click(); }
      render();
      out.moved = before !== null && readCampaign() !== before;
      out.before = before; out.after = readCampaign();

      /* the caucus panel and the organisations panel carry their own figure */
      UI.tab = 'parties'; render();
      const fp = [...document.querySelectorAll('#view .panel')]
        .filter(x => /The Caucuses Inside/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      out.caucusSays = !!fp && /Assembly seat/.test(fp.textContent);
      UI.tab = 'interests'; render();
      const ip = [...document.querySelectorAll('#view .panel')]
        .filter(x => /What the Organisations Are Worth/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      out.orgSays = !!ip && /Worth in the Assembly/.test(ip.textContent);

      S.campaign = keep.campaign; S.purse = keep.purse; S.capital = keep.cap;
      S.ruling = keep.ruling; S.playAs = keep.playAs; S.coalition = keep.coalition;
      UI.tab = keep.tab; render();
      return out;
    });
    step('campaign-worth-readout',
      cw.found && cw.tiles === 5 && cw.saysCeiling && cw.canBuy && cw.moved && cw.caucusSays && cw.orgSays,
      `the Campaign page carries a seat readout with ${cw.tiles} channels [${(cw.labels || []).join(', ')}] and a ` +
      `line about the ceiling (${cw.saysCeiling}); buying ground organisation moves the campaign's own figure from ` +
      `${cw.before} to ${cw.after}; the caucus panel states what the caucuses are worth (${cw.caucusSays}) and the ` +
      `organisations panel states theirs (${cw.orgSays}) -- the page used to print a "point potential" on a scale ` +
      `nothing else in the game uses`);

    /* S15i: the nomination, through the rendered page. What only the page can
       answer is whether the bench renders at all, whether a real click changes
       who the party will put up, and whether that choice rides the save. */
    const nm = await page.evaluate(() => {
      const out = {}, me = playParty(S);
      const keep = { tab:UI.tab, ruling:S.ruling, coalition:S.coalition, cap:S.capital,
        exec:JSON.parse(JSON.stringify(S.exec)), form:S.form,
        purse:JSON.parse(JSON.stringify(S.purse || {})), nominee:S.execNominee };
      S.ruling = me; S.coalition = [me]; S.capital = 400; S.execNominee = {};
      if (S.purse) PARTIES.forEach(p => { S.purse[p.id] = 400; });
      ['pres', 'vpres', 'chan', 'vchan'].forEach(k => { S.exec[k] = me; });

      UI.tab = 'exec'; render();
      const panel = [...document.querySelectorAll('#view .panel')]
        .filter(x => /Your Nomination/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      out.found = !!panel;
      if (panel) {
        out.offices = panel.querySelectorAll('.card').length;
        out.names = panel.querySelectorAll('[data-nominate]').length;
        out.pressed = panel.querySelectorAll('[data-nominate][aria-pressed="true"]').length;
      }
      /* the office cards carry the person, not only the party colour */
      out.personOnCard = /competence · /.test(document.querySelector('#view').textContent);

      /* a real click on somebody who is NOT the default changes the answer */
      const btns = [...document.querySelectorAll('#view [data-nominate]')]
        .filter(b => b.getAttribute('aria-pressed') !== 'true' && !b.disabled);
      out.clickable = btns.length > 0;
      if (btns.length) {
        const office = btns[0].getAttribute('data-nominate'), who = btns[0].getAttribute('data-nominee');
        const p0 = typeof partyPurse === 'function' ? partyPurse(S, me) : 0;
        btns[0].click();
        out.stored = S.execNominee && S.execNominee[office] === who;
        out.paidFromPurse = (typeof partyPurse === 'function' ? partyPurse(S, me) : 0) < p0;
        render();
        out.nowNominee = typeof execNominate === 'function' ? execNominate(S, office, me).winner.name === who : false;
      }

      S.exec = keep.exec; S.ruling = keep.ruling; S.coalition = keep.coalition;
      S.capital = keep.cap; S.purse = keep.purse; S.execNominee = keep.nominee; S.form = keep.form;
      UI.tab = keep.tab; render();
      return out;
    });
    step('nomination-bench',
      nm.found && nm.offices === 2 && nm.names >= 6 && nm.pressed === 2 && nm.personOnCard &&
      nm.clickable && nm.stored && nm.paidFromPurse && nm.nowNominee,
      `the executive page carries the bench for the ${nm.offices} offices next contested, ${nm.names} named people ` +
      `across them with the party's own choice marked (${nm.pressed}); naming somebody else stores it ` +
      `(${nm.stored}), takes the money out of the party purse (${nm.paidFromPurse}) and is who the party then puts ` +
      `up (${nm.nowNominee}); and each office card names the holder's competence and term (${nm.personOnCard}) -- ` +
      `the page used to print a name, an age and a trait, and emitted no control of its own at all`);

    /* S15j: the Alliance, through the rendered page. What only the page can
       answer is whether the panel states the odds before the player spends,
       and whether a real click on Open Accession Talks changes the roster. */
    const al = await page.evaluate(() => {
      const out = {};
      const keep = { tab:UI.tab, cap:S.capital, tre:S.treasury, pol:S.pol.allianceExpansion,
        alliance:S.alliance ? JSON.parse(JSON.stringify(S.alliance)) : null,
        powers:JSON.parse(JSON.stringify(S.powers)), uses:JSON.parse(JSON.stringify(S.uses || {})) };
      S.capital = 400; S.treasury = 1500;

      /* at rung zero the panel says so and the button refuses */
      S.pol.allianceExpansion = 0;
      if (typeof allianceState === 'function') allianceState(S).members = [];
      UI.tab = 'world'; render();
      const panelOf = () => [...document.querySelectorAll('#view .panel')]
        .filter(x => /The Northern Alliance/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      const p0 = panelOf();
      out.found = !!p0;
      out.saysStatute = !!p0 && /statute/.test(p0.textContent);
      out.saysOddsHeading = !!p0 && /Would accede/.test(p0.textContent);

      /* at rung two, a real click carries or refuses, and either way the page
         has already told the player the odds */
      S.pol.allianceExpansion = 2;
      PARTIES.forEach(() => {});
      S.powers.meridian = 90; S.powers.alliance = 88; S.ind.tension = 25;
      render();
      const p1 = panelOf();
      out.oddsShown = !!p1 && /\d+%/.test(p1.textContent);
      const btn = [...document.querySelectorAll('#view [data-act="accede"]')]
        .filter(b => !b.disabled)[0];
      out.clickable = !!btn;
      if (btn) {
        const before = typeof allianceMembers === 'function' ? allianceMembers(S).length : 0;
        const c0 = S.capital;
        /* pick the Meridian option by index so the odds above are the ones tested */
        const idx = [...document.querySelectorAll('#view [data-act="accede"]')]
          .map(b => b.textContent).findIndex(t => /Meridian/.test(t));
        const target = idx >= 0 ? document.querySelectorAll('#view [data-act="accede"]')[idx] : btn;
        target.click();
        out.paid = S.capital < c0;
        out.answered = typeof allianceMembers === 'function' &&
          (allianceMembers(S).length === before + 1 || allianceMembers(S).length === before);
        out.acceded = typeof allianceHas === 'function' && allianceHas(S, 'meridian');
      }
      render();
      const p2 = panelOf();
      out.rosterShown = !!p2 && (!out.acceded || /Meridian/.test(p2.textContent));

      S.capital = keep.cap; S.treasury = keep.tre; S.pol.allianceExpansion = keep.pol;
      S.alliance = keep.alliance; S.powers = keep.powers; S.uses = keep.uses;
      UI.tab = keep.tab; render();
      return out;
    });
    step('alliance-roster',
      al.found && al.saysStatute && al.saysOddsHeading && al.oddsShown && al.clickable &&
      al.paid && al.answered && al.rosterShown,
      `the world page carries the Alliance panel: it names the statute that admits members (${al.saysStatute}), ` +
      `prints what every unopened accession would answer (${al.saysOddsHeading}/${al.oddsShown}), and a real click ` +
      `on Open Accession Talks is paid for (${al.paid}) and answered either way (${al.answered}; acceded ` +
      `${al.acceded}), with the roster on the page afterwards (${al.rosterShown}) -- the Alliance used to be one ` +
      `number on the world page with no members, no roster and nothing to open`);

    /* S16b: the terms sheet, driven through the real UI. The model side is in
       tools/roads.js; what this asks is whether the page a player actually
       clicks tells them what is written, what is on the table, what is locked
       and why, and whether laying terms signs anything that session. */
    const tr = await page.evaluate(() => {
      const out = {};
      const keep = { tab:UI.tab, cap:S.capital, tre:S.treasury,
        powers:JSON.parse(JSON.stringify(S.powers)),
        treaties:JSON.parse(JSON.stringify(S.v6.treaties || {})) };
      /* degrades rather than throwing on a build without S16b: the harness
         reports a FAILURE with the diagnosis instead of a stack. */
      out.built = typeof v6TreatyPropose === 'function';
      /* the Foreign Office answers to the government, so this asks the page a
         GOVERNMENT sees; the refusal in opposition is asserted below it. */
      keep.ruling = S.ruling; keep.coalition = S.coalition;
      S.ruling = playParty(S); S.coalition = [playParty(S)];
      S.capital = 900; S.treasury = 9000; S.powers.meridian = 92;
      if (out.built) S.v6.treaties.meridian = []; else delete S.v6.treaties.meridian;
      var live = (pid) => (out.built ? v6Treaties(S, pid)
        : (S.v6.treaties[pid] && S.v6.treaties[pid].kind ? [S.v6.treaties[pid]] : []));
      var talks = (pid) => (out.built ? v6TreatyTalks(S, pid) : []);
      UI.tab = 'world'; render();

      const negotiate = document.querySelector('#view [data-treaty-open="meridian"]');
      out.hasButton = !!negotiate;
      if (negotiate) negotiate.click();
      const sheet = document.getElementById('sheet');
      const text = sheet ? sheet.textContent : '';
      out.sheetOpen = document.getElementById('modal').hidden === false;
      out.saysNoLimit = /no limit on how many may stand/.test(text);
      out.subheads = [...sheet.querySelectorAll('.sheet-sub')].map(x => x.textContent);
      out.saysLockedReason = /Written on top of/.test(text);
      out.saysOdds = /in a hundred/.test(text);
      out.openButtons = sheet.querySelectorAll('[data-treaty-kind]').length;

      /* lay terms: it must cost, and it must NOT sign */
      const pick = sheet.querySelector('[data-treaty-kind="consular"]') || sheet.querySelector('[data-treaty-kind]');
      out.kindPicked = pick && pick.getAttribute('data-treaty-kind');
      const c0 = S.capital;
      if (pick) pick.click();
      out.paid = S.capital < c0;
      out.notSigned = live('meridian').length === 0;
      out.awaiting = talks('meridian').length;

      /* the page says a proposal is out, and so does the sheet reopened */
      UI.tab = 'world'; render();
      out.pageSaysAwaiting = /awaiting an answer/.test(document.getElementById('view').textContent);
      var again = document.querySelector('#view [data-treaty-open="meridian"]');
      if (again) again.click();
      out.subheadsAwaiting = [...document.getElementById('sheet').querySelectorAll('.sheet-sub')].map(x => x.textContent);
      if (typeof hideSheet === 'function') hideSheet();

      /* one session, and the capital answers. WHICH way it answers is a die,
         so what this asserts is that the proposal SETTLES -- the pending row is
         gone either way. Keying a step to one roll is the flake S15j already
         paid for once. The instrument itself is then obtained by asking again
         until they agree, which is what a player does. */
      if (out.built) { v6TreatiesTick(S); S.turn += 1; }
      out.settled = out.built && talks('meridian').length === 0;
      if (out.built && !v6HasTreaty(S, 'meridian', out.kindPicked)) {
        for (var t = 0; t < 40 && !v6HasTreaty(S, 'meridian', out.kindPicked); t++) {
          S.capital = 900; S.treasury = 9000; S.powers.meridian = 92;
          v6TreatyPropose('meridian', out.kindPicked);
          v6TreatiesTick(S); S.turn += 1;
        }
      }
      out.signed = out.built ? v6HasTreaty(S, 'meridian', out.kindPicked) : live('meridian').length > 0;
      render();
      out.pageSaysInForce = !out.signed ||
        /In force|instrument/.test(document.getElementById('view').textContent);
      var third = document.querySelector('#view [data-treaty-open="meridian"]');
      if (third) third.click();
      out.subheadsInForce = [...document.getElementById('sheet').querySelectorAll('.sheet-sub')].map(x => x.textContent);
      out.canAnnul = document.getElementById('sheet').querySelectorAll('[data-treaty-annul]').length;
      if (typeof hideSheet === 'function') hideSheet();

      /* and a second instrument does not replace the first */
      if (out.signed && out.built) {
        S.capital = 900;
        const before = v6TreatyKinds(S, 'meridian').slice();
        const next = Object.keys(V6_TREATIES).filter(k => v6TreatyOpen(S, 'meridian', k))[0];
        for (var u = 0; next && u < 40 && !v6HasTreaty(S, 'meridian', next); u++) {
          S.capital = 900; S.treasury = 9000; S.powers.meridian = 92;
          v6TreatyPropose('meridian', next);
          v6TreatiesTick(S); S.turn += 1;
        }
        out.secondSigned = !!next && v6HasTreaty(S, 'meridian', next);
        out.keptTheFirst = before.every(k => v6HasTreaty(S, 'meridian', k)) && out.secondSigned &&
          v6Treaties(S, 'meridian').length >= before.length + 1;
      } else out.keptTheFirst = !!out.built;

      /* and in opposition the door is shut, with the reason on the button */
      S.ruling = 'fp'; S.coalition = ['fp']; UI.tab = 'world'; render();
      out.oppDisabled = [...document.querySelectorAll('#view [data-treaty-open]')].every(b => b.disabled);
      out.oppWhy = out.built ? v6TreatyWhy(S, 'meridian', 'consular') : '';

      S.ruling = keep.ruling; S.coalition = keep.coalition;
      S.capital = keep.cap; S.treasury = keep.tre; S.powers = keep.powers;
      S.v6.treaties = keep.treaties; UI.tab = keep.tab;
      if (typeof hideSheet === 'function') hideSheet();
      render();
      return out;
    });
    step('terms-sheet',
      tr.built && tr.hasButton && tr.sheetOpen && tr.saysNoLimit && tr.subheads.length >= 2 &&
      tr.subheadsAwaiting.indexOf('Awaiting their answer') >= 0 &&
      tr.subheadsInForce.indexOf('In force') >= 0 && tr.canAnnul > 0 &&
      tr.saysLockedReason && tr.saysOdds && tr.openButtons > 0 && tr.paid &&
      tr.notSigned && tr.awaiting === 1 && tr.pageSaysAwaiting && tr.settled &&
      tr.pageSaysInForce && tr.keptTheFirst && tr.oppDisabled && /answers to the government/.test(tr.oppWhy),
      `the terms sheet groups twenty instruments by state -- [${tr.subheads.join(', ')}] with nothing signed, ` +
      `[${tr.subheadsAwaiting.join(', ')}] once terms are laid, [${tr.subheadsInForce.join(', ')}] once they are ` +
      `answered, with ${tr.canAnnul} of them annullable -- `+
      `states that nothing limits how many may stand with one capital (${tr.saysNoLimit}), prints the odds before the ` +
      `money is spent (${tr.saysOdds}) and says of a locked one what it is written on top of (${tr.saysLockedReason}); ` +
      `a real click on "${tr.kindPicked}" is paid for (${tr.paid}) and signs NOTHING that session (${tr.notSigned}, ` +
      `${tr.awaiting} awaiting, and the world page says so: ${tr.pageSaysAwaiting}), the capital answers at the next ` +
      `(settled ${tr.settled}, signed ${tr.signed}), and a second instrument leaves the first standing ` +
      `(${tr.keptTheFirst}); in opposition every Negotiate button is shut (${tr.oppDisabled}) with the reason given ` +
      `("${tr.oppWhy}"), where eleven of them were live and a party with no ministry could sign eleven treaties ` +
      `-- before this PR the sheet listed ten cards against one slot, signing on the click and ` +
      `replacing whatever was in it` + (tr.built ? '' : ' -- THIS BUILD HAS NO PROPOSAL PATH'));

    /* S16f: the editor, driven through the real start screen. The model side
       is in roads.js; what this asks is whether a player can reach it, set a
       field, keep it, and see that it is kept. */
    const cs = await page.evaluate(() => {
      const out = { built:typeof v16CustomSheet === 'function' };
      const keepSetup = UI.setup ? JSON.parse(JSON.stringify(UI.setup)) : null;
      startScreen();
      const open = document.querySelector('#sheet [data-cs-open]');
      out.onStartScreen = !!open;
      if (!open) { if (typeof hideSheet === 'function') hideSheet(); UI.setup = keepSetup; render(); return out; }
      open.click();
      const sh = document.getElementById('sheet');
      out.sections = sh.querySelectorAll('[data-cs-sec]').length;
      out.controls = sh.querySelectorAll('[data-cs]').length;
      out.hasText = !!sh.querySelector('[data-cs-text]');
      out.sectionNames = [...sh.querySelectorAll('[data-cs-sec] > summary > b')].map(x => x.textContent);
      const form = sh.querySelector('[data-cs="form"]');
      if (form) form.value = 'empire';
      const cap = sh.querySelector('[data-cs="money.capital"]');
      if (cap) cap.value = '321';
      const gov = sh.querySelector('[data-cs="governors.' + REGIONS[0].id + '"]');
      if (gov) gov.value = 'lp';
      sh.querySelector('[data-cs-apply]').click();
      const kept = UI.setup.custom || {};
      out.keptForm = kept.form;
      out.keptCapital = kept.money && kept.money.capital;
      out.keptGovernor = kept.governors && kept.governors[REGIONS[0].id];
      out.backOnStartScreen = !!document.querySelector('#sheet [data-cs-open]');
      out.label = (document.querySelector('#sheet [data-cs-open] b') || {}).textContent || '';
      /* and clearing puts it back */
      document.querySelector('#sheet [data-cs-open]').click();
      document.getElementById('sheet').querySelector('[data-cs-clear]').click();
      out.cleared = !UI.setup.custom;
      if (typeof hideSheet === 'function') hideSheet();
      UI.setup = keepSetup; render();
      return out;
    });
    step('custom-start',
      cs.built && cs.onStartScreen && cs.sections === 10 && cs.controls > 300 && cs.hasText &&
      cs.keptForm === 'empire' && cs.keptCapital === 321 && cs.keptGovernor === 'lp' &&
      cs.backOnStartScreen && /3 fields set/.test(cs.label) && cs.cleared,
      `the start screen carries "Design the republic" (${cs.onStartScreen}), which opens ${cs.sections} sections ` +
      `[${(cs.sectionNames || []).join(', ')}] and ${cs.controls} controls over one sheet; setting the form, the ` +
      `opening capital and a governorship and keeping them writes all three (${cs.keptForm}/${cs.keptCapital}/` +
      `${cs.keptGovernor}), the start screen says so ("${cs.label}"), and clearing puts it back (${cs.cleared}) -- ` +
      `the eleven openings were eleven fixed literals and this is the twelfth` +
      (cs.built ? '' : ' -- THIS BUILD HAS NO CUSTOM START'));

    /* S16e: the six on the page. A posture the player cannot see is not in the
       game, so the model side in roads.js is only half of it. */
    const sixp = await page.evaluate(() => {
      const out = { built:typeof v16AiTurn === 'function' };
      const keep = { tab:UI.tab };
      if (out.built) for (let i = 0; i < 12; i++) { v16AiTurn(S); S.turn += 1; }
      UI.tab = 'parties'; render();
      const panel = [...document.querySelectorAll('#view .panel')]
        .filter(x => /What the Others Are Doing/.test((x.querySelector('h2') || {}).textContent || ''))[0];
      out.found = !!panel;
      if (panel) {
        const t = panel.textContent;
        out.rows = panel.querySelectorAll('tbody tr').length;
        out.saysPosture = /Governing|Waiting|Building the organisation|Holding what it has|Moving toward the middle|Coming after the government|In the ministry with you/.test(t);
        out.saysMoney = /\d/.test(t);
        out.saysMemory = /Nothing on file|A grievance on file|They have not forgotten/.test(t);
        out.saysHow = /one initiative a session/.test(t);
      }
      UI.tab = keep.tab; render();
      return out;
    });
    step('the-others-on-the-page',
      sixp.built && sixp.found && sixp.rows === 6 && sixp.saysPosture && sixp.saysMoney &&
      sixp.saysMemory && sixp.saysHow,
      `the Parties page carries what the other six are doing: ${sixp.rows} rows, each naming the posture ` +
      `(${sixp.saysPosture}), the money it has left and what it has spent (${sixp.saysMoney}), and what it holds ` +
      `against the player (${sixp.saysMemory}), with the rule stated on the panel (${sixp.saysHow})` +
      (sixp.built ? '' : ' -- THIS BUILD HAS NO INITIATIVE DECK'));

    step('splices-land', spl.cards === spl.regions && spl.misassigned.length === 0 &&
      spl.regionsMissingActs.length === 0 && spl.qtMatches,
      spl.misassigned.length ? `governor strips mis-assigned on ${spl.misassigned.length} of ${spl.cards} region cards: ${spl.misassigned.slice(0, 3).join(', ')}`
        : spl.regionsMissingActs.length ? `region actions missing on ${spl.regionsMissingActs.join(', ')}`
          : !spl.qtMatches ? `Question Time rendered ${spl.qtGot} replies for ${spl.qtWant} authored options and the first mismatch is ` +
            `"${(spl.qtFirstDiff || {}).got}" where "${(spl.qtFirstDiff || {}).want}" was authored — the button row splice missed ` +
            `and v8's generic row is on screen`
            : `${spl.cards} region cards each carrying their own governor strip, all ${spl.acts} region actions on all ${spl.regions} regions, ` +
              `and Question Time answering with its ${spl.qtWant} authored replies rather than v8's fixed row`);
  }

  // -- S10a: an unreadable save is not written over after being promised untouched
  {
    const kept = await page.evaluate(() => {
      const KEY = 'parliamentVale.autosave.v5';
      const BROKEN = '{ this is not json';
      try { localStorage.setItem(KEY, BROKEN); } catch (e) { return { skip: true }; }
      try { localStorage.removeItem(KEY + '.unreadable'); } catch (e) {}
      /* the state readAutosave would have left behind */
      UI.saveReadError = KEY;
      saveAutosave();
      let rescued = null, live = null;
      try { rescued = localStorage.getItem(KEY + '.unreadable'); live = localStorage.getItem(KEY); } catch (e) {}
      const ok = rescued === BROKEN && live !== BROKEN && !!live;
      try { localStorage.removeItem(KEY + '.unreadable'); } catch (e) {}
      return { ok, rescuedIntact: rescued === BROKEN, overwritten: live !== BROKEN, cleared: !UI.saveReadError };
    });
    if (kept.skip) step('unreadable-save-kept', false, 'localStorage refused the fixture');
    else step('unreadable-save-kept', kept.ok && kept.cleared,
      `the unreadable blob survives at .unreadable: ${kept.rescuedIntact}; the session then autosaves normally: ${kept.overwritten}`);
  }

  // -- S10a: a refusal is audible at every tier, not just where the hint shows
  {
    /* Both branches, whatever this run's viewport: the hint when it is on
       screen, the toast when it is not. The second case is the one that was
       broken — 75 refusal sites, silent on the phone and the tablet, while
       every success spoke. Hiding the element reproduces exactly what
       `@media(max-width:1179px){.turnbar .hint{display:none}}` does. */
    const spoke = await page.evaluate(() => {
      const t = document.getElementById('toast'), h = document.getElementById('turnHint');
      const out = {};
      const prev = h.style.display;

      h.style.display = '';
      t.classList.remove('show', 'refused');
      flash('SHOWN HINT REFUSAL');
      out.hintOnScreen = !!h.offsetParent;
      out.hintCarried = !out.hintOnScreen || h.textContent === 'SHOWN HINT REFUSAL';

      h.style.display = 'none';
      t.classList.remove('show', 'refused');
      flash('HIDDEN HINT REFUSAL');
      out.toastCarried = t.classList.contains('show') && t.textContent === 'HIDDEN HINT REFUSAL' &&
        t.classList.contains('refused');
      h.style.display = prev;
      t.classList.remove('show', 'refused');
      return out;
    });
    step('refusal-is-audible', spoke.hintCarried && spoke.toastCarried,
      `hint on screen carries it: ${spoke.hintCarried}; hint hidden, the toast carries it as a refusal: ${spoke.toastCarried}`);
  }

  // -- fold prefs follow their relocated panels (S9c)
  {
    const mig = await page.evaluate(() => {
      S.uiPrefs.folds = S.uiPrefs.folds || {};
      S.uiPrefs.folds['world|the chronicle'] = true;
      delete S.uiPrefs.folds['record|the chronicle'];
      UI.tab = 'record'; render();
      return { migrated: S.uiPrefs.folds['record|the chronicle'] === true,
               oldGone: S.uiPrefs.folds['world|the chronicle'] === undefined };
    });
    step('fold-migrate', mig.migrated && mig.oldGone,
      `world|the chronicle -> record|the chronicle: migrated ${mig.migrated}, old key removed ${mig.oldGone}`);
  }
  // the resumed game's own debounce now rewrites .v5 over the corrupt blob —
  // correct behavior; let it settle before the screenshots, and drop the
  // planted .v4 so the harness leaves no stale generation behind
  await page.waitForTimeout(400);
  await page.evaluate(() => localStorage.removeItem('parliamentVale.autosave.v4'));

  // -- screenshots: desktop / tablet / phone on the live game --
  await page.evaluate(() => { UI.tab = 'chamber'; render(); });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT, 'desktop-1500.png'), fullPage: false });
  await page.setViewportSize({ width: 834, height: 1150 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, 'tablet-834.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, 'phone-390.png') });
  step('screenshots', true, 'tools/out/{desktop-1500,tablet-834,phone-390}.png');

  /* -- the phone tier, asserted rather than only photographed --
     The ruled reference phone is a WebKit engine this environment cannot
     install, so every phone result here is Chromium standing in. That makes it
     more important, not less, that the phone layer's BEHAVIOUR is checked and
     not just its picture: a screenshot cannot tell you the stat strip stopped
     scrolling or that a sheet stopped reaching the bottom of the screen. */
  const phone = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const cs = s => { const e = q(s); return e ? getComputedStyle(e) : null; };
    const grid = cs('#view .grid'), stats = q('.stats'), bar = cs('.turnbar .in');
    return {
      oneColumn: grid ? grid.gridTemplateColumns.split(' ').filter(Boolean).length === 1 : null,
      // the stat strip becomes a horizontal scroller with a toggle beneath it
      statsScroll: stats ? stats.scrollWidth > stats.clientWidth + 1 : false,
      statsToggle: !!q('.stats-toggle'),
      // the turn bar is the phone grid, not the desktop flex row
      barGrid: bar ? bar.display === 'grid' : null,
      /* The chamber's direct labels are hidden here in favour of the legend,
         which keeps its seat counts on this tier only. Both halves are checked
         against a chamber that is actually on screen — asking whether a label
         is hidden when no chamber rendered at all passes for the wrong reason. */
      hemiPresent: !!q('svg.hemi circle'),
      hemiLabelsHidden: (() => { const t = q('svg.hemi text'); return !!t && getComputedStyle(t).display === 'none'; })(),
      legendCounts: (() => { const n = q('.seatlegend .leg .n'); return !!n && getComputedStyle(n).display !== 'none'; })(),
      noSideScroll: document.documentElement.scrollWidth <= 391,
    };
  });
  step('phone-layer', phone.oneColumn === true && phone.statsToggle && phone.barGrid === true &&
    phone.hemiPresent && phone.hemiLabelsHidden && phone.legendCounts && phone.noSideScroll,
    `one column: ${phone.oneColumn}, stat strip scrolls: ${phone.statsScroll} with toggle: ${phone.statsToggle}, ` +
    `turn bar is a grid: ${phone.barGrid}, chamber on screen: ${phone.hemiPresent} with its arc labels hidden: ` +
    `${phone.hemiLabelsHidden} and the legend keeping its counts: ${phone.legendCounts}, ` +
    `no sideways scroll: ${phone.noSideScroll}`);

  /* S14: the phone's policy folds and its tab strip, asserted because their
     v6m bodies were deleted. Both names were declared by v6m and reassigned by
     v7 without an alias, and the only thing that ever ran the v6m bodies was
     one line on the mobile chunk's boot. With that line gone the bodies were
     poison-proved unreachable and removed, and v7's assignment became the
     declaration -- so what has to hold from here is that the FEATURE still
     works, not that a particular body exists. */
  const fold = await page.evaluate(() => {
    const keep = UI.tab;
    UI.tab = 'policy'; render();
    const out = {
      folds: document.querySelectorAll('details.fold.polcat').length,
      bare: document.querySelectorAll('#view .subhead').length,
      /* and the names still resolve to a callable body after the promotion */
      callable: typeof v6mPolicyFolds === 'function' && typeof v6mCenterTab === 'function',
      strip: (() => { const n = document.getElementById('tabs'); return !!(n && n.querySelector('[aria-current="true"]')); })(),
    };
    UI.tab = keep; render();
    return out;
  });
  step('phone-policy-folds', fold.folds >= 20 && fold.bare === 0 && fold.callable && fold.strip,
    `${fold.folds} category folds on the phone policy page with ${fold.bare} unfolded subheads left, ` +
    `v6mPolicyFolds and v6mCenterTab both callable after the promotion: ${fold.callable}, ` +
    `open tab marked on the strip: ${fold.strip}`);

  // a sheet on a phone is a full-bleed page anchored to the bottom, not a
  // centred desktop modal that leaves the primary action off-screen
  await page.evaluate(() => { if (typeof saveDialog === 'function') saveDialog(); });
  await page.waitForTimeout(300);
  const sheet = await page.evaluate(() => {
    const s = document.getElementById('sheet'), m = document.getElementById('modal');
    if (!s || !m || m.hidden) return null;
    const r = s.getBoundingClientRect();
    return { width: Math.round(r.width), bottom: Math.round(r.bottom), vh: window.innerHeight,
      full: r.width >= window.innerWidth - 1, reachesBottom: r.bottom >= window.innerHeight - 2 };
  });
  await page.evaluate(() => { if (typeof hideSheet === 'function') hideSheet(); });
  step('phone-sheet', !!sheet && sheet.full && sheet.reachesBottom,
    sheet ? `sheet ${sheet.width}px wide of 390, bottom at ${sheet.bottom} of ${sheet.vh}` : 'no sheet opened');
  await page.setViewportSize({ width: 1500, height: 950 });

  step('console-errors', errors.length === 0, `${errors.length} error(s)` + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : '') +
    (offline.length ? `; ${offline.length} expected-offline resource failure(s) (fonts — exemption dies with the external-ref allowlist)` : ''));

  // -- a number that is not a number is announced, not stored (S14). Its own
  //    page: the probe deliberately fires console.error, which the step above
  //    counts, and the point of the fix is that it fires.
  {
    const np = await browser.newPage({ viewport: { width: 1280, height: 950 } });
    await np.addInitScript(() => { window.confirm = () => true; });
    await np.goto(URL);
    await np.waitForSelector('[data-setup-begin]', { timeout: 15000 });
    await np.click('[data-setup-begin]');
    await np.waitForSelector('[data-doctrine]', { timeout: 10000 });
    await np.click('[data-doctrine]');
    await np.waitForTimeout(250);
    const nan = await np.evaluate(() => {
      const before = !!document.querySelector('[data-number-fault]');
      const got = clamp(NaN, 0, 100);          /* used to come back NaN */
      const inv = clamp(5, 10, 0);             /* bounds the wrong way round */
      const el = document.querySelector('[data-number-fault]');
      return {
        before, got, inv, shown: !!el,
        finite: typeof got === 'number' && isFinite(got),
        says: el ? el.textContent.slice(0, 64) : '',
        top: el ? Math.round(el.getBoundingClientRect().top) : -1,
        latched: (window.V14_FAULTS || []).length,
        /* and every ordinary answer is exactly what it always was */
        ordinary: clamp(42, 0, 100) === 42 && clamp(-3, 0, 100) === 0 &&
                  clamp(300, 0, 100) === 100 && clamp(0, 0, 100) === 0 && clamp(100, 0, 100) === 100,
      };
    });
    step('nan-is-announced', nan.before === false && nan.finite && nan.shown &&
      nan.latched === 2 && nan.ordinary && nan.inv === 5,
      `clamp(NaN,0,100) answered ${nan.got} (it used to answer NaN and the caller stored it), ` +
      `clamp(5,10,0) answered ${nan.inv}, ${nan.latched} distinct fault(s) latched, ` +
      `banner at y=${nan.top}: "${nan.says}"`);
    await np.close();
  }

  // -- endings are not allowed to lose anything (fresh page: this one corrupts
  //    the hall and ends the game). The hall gets the autosave's S1 loudness
  //    contract; the collapse ending must bank its own session before the
  //    gameOver chain latches the hall entry.
  {
    const ep = await browser.newPage({ viewport: { width: 1280, height: 950 } });
    await ep.addInitScript(() => { window.confirm = () => true; });
    await ep.goto(URL);
    await ep.waitForSelector('[data-setup-begin]', { timeout: 15000 });
    const CORRUPT = '[{"party":"lp","score":181,"year":"2071"';
    await ep.evaluate(c => localStorage.setItem('parliamentVale.hall', c), CORRUPT);
    await ep.click('[data-setup-begin]');
    await ep.waitForSelector('[data-doctrine]', { timeout: 10000 });
    await ep.click('[data-doctrine]');
    await drainModals(ep, 20);
    // give the run a record that can only be banked by the dying session
    await ep.evaluate(() => { S.legacy.playerLaws = 999; });
    // force the services-refuse ending through the REAL checkCollapse: the
    // forcing happens inside its own call because tickTurn recomputes both
    // levers, so a value set before endTurn is gone by the time it reads them
    await ep.evaluate(() => {
      var base = checkCollapse;
      checkCollapse = function () { S.armyLoyalty = 0; S.unrest = 99; return base.apply(this, arguments); };
      endTurn();
    });
    await ep.waitForTimeout(900);
    await drainModals(ep, 20);
    const end = await ep.evaluate(c => {
      const raw = localStorage.getItem('parliamentVale.hall');
      const sheetText = (document.getElementById('sheet') || {}).textContent || '';
      return {
        over: !!S.over,
        blobUntouched: raw === c,
        banked: S.v6.achievements.firstLaw !== undefined,
        card: (sheetText.match(/(\d+)\s+of\s+(\d+)\s+records/i) || []).slice(1),
        recorded: !!(S.v8 && S.v8.flags && S.v8.flags.recorded)
      };
    }, CORRUPT);
    step('hall-corrupt-loud', end.over && end.blobUntouched,
      `game over: ${end.over}; corrupt hall blob untouched after the ending: ${end.blobUntouched}`);
    step('collapse-banks', end.banked && Number(end.card[0]) > 0,
      `record earned on the dying session banked: ${end.banked}; end card reads ${end.card[0] || '?'} of ${end.card[1] || '?'}`);
    // the hall's own render says why nothing was recorded
    await ep.evaluate(() => { UI.tab = 'record'; render(); });
    await ep.waitForTimeout(150);
    const warn = await ep.evaluate(() => !!document.querySelector('[data-hall-warning]'));
    step('hall-warns-on-screen', warn, 'record view shows the unreadable-hall notice');
    await ep.close();
  }
  await browser.close();

  // -- WebKit phone pass (the ruled phone reference engine) --
  try {
    const wb = await playwright.webkit.launch();
    const wp = await wb.newPage({ viewport: { width: 390, height: 844 } });
    const werr = [];
    wp.on('pageerror', e => werr.push(e.message));
    await wp.goto(URL);
    await wp.waitForSelector('[data-setup-begin]', { timeout: 15000 });
    await wp.screenshot({ path: path.join(OUT, 'phone-390-webkit.png') });
    step('webkit-phone', werr.length === 0, `boots on WebKit, ${werr.length} pageerror(s)`);
    await wb.close();
  } catch (e) {
    console.log('SKIP  webkit-phone — WebKit browser not available (' + e.message.split('\n')[0] + ').');
    console.log('      Try: npx playwright install webkit   (substitute this run: Chromium phone viewport above)');
  }

  finish();
}

function finish() {
  const failed = steps.filter(s => !s.ok);
  fs.writeFileSync(path.join(OUT, 'playtest-log.txt'),
    steps.map(s => `${s.ok ? 'ok' : 'FAIL'} ${s.name} ${s.detail || ''}`).join('\n') + '\n');
  console.log(failed.length ? `\n${failed.length} STEP(S) FAILED` : '\nPLAYTEST PASS');
  process.exit(failed.length ? 1 : 0);
}

run().catch(e => { console.log('FAIL  harness crashed — ' + e.message); process.exit(1); });
