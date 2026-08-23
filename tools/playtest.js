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
const URL = 'file://' + path.join(ROOT, 'vale.html');
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

  // -- end the session via the keyboard path (the live chain) --
  const turnBefore = await page.evaluate(() => S.turn);
  await page.keyboard.press('e');
  await page.waitForSelector('[data-end-confirm]', { timeout: 10000 });
  await page.click('[data-end-confirm]');
  const drained = await drainModals(page, 40);
  const turnAfter = await page.evaluate(() => S.turn);
  step('end-turn', drained && turnAfter === turnBefore + 1, `turn ${turnBefore} -> ${turnAfter}, queue drained: ${drained}`);

  // -- v7 splice coverage (no literal marker exists for these; see checks) --
  await page.click('[data-tab="chamber"]');
  const desk = await page.evaluate(() => !!document.querySelector('#view .desk-row, #view .desk, #view [data-desk], #view .panel'));
  step('v7-splice-renders', desk, 'Overview renders panels after the turn');

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

  // -- screenshots: desktop / tablet / phone on the live game --
  await page.screenshot({ path: path.join(OUT, 'desktop-1500.png'), fullPage: false });
  await page.setViewportSize({ width: 834, height: 1150 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, 'tablet-834.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, 'phone-390.png') });
  step('screenshots', true, 'tools/out/{desktop-1500,tablet-834,phone-390}.png');

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
