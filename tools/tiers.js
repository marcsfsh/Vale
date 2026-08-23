#!/usr/bin/env node
'use strict';
/*
 * Measure the layout at each tier boundary.
 *
 *   node tools/tiers.js                 measure the repo's vale.html
 *   VALE_FILE=path node tools/tiers.js  measure another copy
 *
 * Prints, for a set of widths spanning phone / tablet / desktop: how much of
 * the window the app actually occupies, whether the main grid is one column or
 * two, and which layout layer is in charge. The 761-1179 band is the one worth
 * watching — it historically received the phone layer's CSS collapse without
 * any of the phone layer's behaviour, and no desktop treatment either.
 */
const { execSync } = require('child_process');
const { createRequire } = require('module');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + (process.env.VALE_FILE || path.join(ROOT, 'vale.html'));
const WIDTHS = [390, 420, 600, 760, 761, 834, 900, 1024, 1179, 1180, 1280, 1500, 1920];

let playwright;
try { playwright = require('playwright'); } catch (e) {
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    playwright = createRequire(path.join(g, 'noop.js'))('playwright');
  } catch (e2) {
    console.log('SKIP  playwright is not resolvable here — run this in a cloud session.');
    process.exit(2);
  }
}

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.goto(URL);
  await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
  await page.click('[data-setup-begin]');
  await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await page.click('[data-doctrine]');
  await page.waitForTimeout(200);

  const rows = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.evaluate(() => { UI.tab = 'chamber'; render(); });
    await page.waitForTimeout(140);
    rows.push(await page.evaluate(width => {
      const app = document.getElementById('app');
      const grid = document.querySelector('#view .grid');
      const bar = document.querySelector('.turnbar .in');
      const cs = app ? getComputedStyle(app) : null;
      const gs = grid ? getComputedStyle(grid) : null;
      const used = app ? app.getBoundingClientRect().width : 0;
      const cols = gs ? gs.gridTemplateColumns.split(' ').filter(Boolean).length : 0;
      const overflow = document.documentElement.scrollWidth > width + 1;
      return {
        width,
        appWidth: Math.round(used),
        waste: Math.round(100 - (used / width) * 100),
        cols,
        colTemplate: gs ? gs.gridTemplateColumns : '—',
        barDisplay: bar ? getComputedStyle(bar).display : '—',
        overflow,
      };
    }, w));
  }
  await browser.close();

  console.log('width   app     unused   grid     turnbar   h-overflow  tier');
  for (const r of rows) {
    const tier = r.width <= 760 ? 'phone' : (r.width <= 1179 ? 'TABLET' : 'desktop');
    console.log(
      String(r.width).padEnd(7) +
      String(r.appWidth).padEnd(8) +
      (r.waste + '%').padEnd(9) +
      (r.cols === 1 ? '1 col' : r.cols + ' col').padEnd(9) +
      String(r.barDisplay).padEnd(10) +
      (r.overflow ? 'YES — BUG' : 'no').padEnd(12) +
      tier);
  }
  const bad = rows.filter(r => r.overflow);
  console.log(bad.length ? `\n${bad.length} width(s) scroll sideways` : '\nno width scrolls sideways');
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
