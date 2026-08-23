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
  for (let i = 0; i < maxClicks; i++) {
    const open = await page.evaluate(() => !document.getElementById('modal').hidden);
    if (!open) return true;
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

async function boot(page) {
  await page.goto(URL);
  await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
}

async function run() {
  const errors = [];
  const offline = [];
  // While the external-ref allowlist is non-empty (the Google Fonts link, until
  // the refresh removes it), a failed resource load offline is the known
  // cosmetic failure — counted separately, not a FAIL. This exemption dies with
  // the allowlist: once checks/baseline.json lists no allowed prefixes, every
  // resource failure is an error again (a self-contained file loads nothing).
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
  await page.click('[data-tab="policy"]');
  await page.waitForSelector('[data-pol][data-dir="1"]:not([disabled])', { timeout: 10000 });
  await page.click('[data-pol][data-dir="1"]:not([disabled])');
  await page.waitForSelector('[data-draft]', { timeout: 10000 });
  await page.click('[data-draft="clean"]');
  const bills = await page.evaluate(() => S.bills.filter(b => b.owner === 'player').length);
  step('draft-bill', bills > 0, `${bills} player bill(s) before the houses`);

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
  await page.click('[data-tab="chamber"]');
  const desk = await page.evaluate(() => !!document.querySelector('#view .desk-row, #view .desk, #view [data-desk], #view .panel'));
  step('v7-splice-renders', desk, 'Overview renders panels after the turn');

  // -- walk every view and both menus. The S2 poison-proofs are only worth as
  //    much as the paths this harness actually visits, so it visits all of
  //    them: each tab rendered, the council menu, the field guide, save/load.
  const tabs = await page.evaluate(() => (typeof TABS !== 'undefined' ? TABS.map(t => t.id) : []));
  let toured = 0;
  for (const t of tabs) {
    await page.evaluate(id => { UI.tab = id; render(); }, t);
    await page.waitForTimeout(45);
    toured++;
  }
  await page.evaluate(() => { UI.tab = 'chamber'; render(); });
  step('tab-tour', toured >= 10, `${toured} of ${tabs.length} views rendered`);

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
  // the resumed game's own debounce now rewrites .v5 over the corrupt blob —
  // correct behavior; let it settle before the screenshots, and drop the
  // planted .v4 so the harness leaves no stale generation behind
  await page.waitForTimeout(400);
  await page.evaluate(() => localStorage.removeItem('parliamentVale.autosave.v4'));

  // -- screenshots: desktop / tablet / phone on the live game --
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
