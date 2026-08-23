#!/usr/bin/env node
'use strict';
/*
 * Decide where the tab bar stops scrolling and starts wrapping.
 *
 *   node tools/tabs.js
 *
 * Two chunks each wrote `@media(min-width:901px)` to make the tab strip wrap
 * onto two lines instead of scrolling sideways — one for the plain bar, one for
 * the grouped bar v7 uses by default. 901 is not a tier boundary, so the rule
 * has to move, and the two audits of it disagreed: 761 (the tablet is not a
 * phone, let it wrap) versus 1180 (the tablet is a touch device, let it
 * scroll). This measures the thing the argument is actually about — how many
 * rows the bar needs, and whether it overflows — at each candidate threshold,
 * in both the grouped layout and the classic one.
 */
const { execSync } = require('child_process');
const { createRequire } = require('module');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const WIDTHS = [761, 834, 900, 1024, 1179, 1180];

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

// two scratch copies, identical but for the threshold under test
const src = fs.readFileSync(path.join(ROOT, 'vale.html'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });
const variants = {};
for (const t of ['761', '1180']) {
  const body = src.split('@media(min-width:901px)').join('@media(min-width:' + t + 'px)');
  if (body === src) { console.log('FAIL  no min-width:901px rule left to retarget'); process.exit(1); }
  const p = path.join(OUT, 'tabs-' + t + '.html');
  fs.writeFileSync(p, body);
  variants[t] = p;
}

async function measure(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(120);
  return page.evaluate(() => {
    const nav = document.querySelector('nav.tabs');
    if (!nav) return null;
    const grouped = nav.classList.contains('grouped');
    // the strip that actually holds the buttons
    const strip = grouped ? nav.querySelector('.tabrow') || nav : nav;
    const btns = [...strip.querySelectorAll('button')];
    const tops = new Set(btns.map(b => Math.round(b.getBoundingClientRect().top)));
    return {
      grouped,
      rows: tops.size,
      buttons: btns.length,
      height: Math.round(nav.getBoundingClientRect().height),
      scrolls: strip.scrollWidth > strip.clientWidth + 1,
      hidden: btns.filter(b => {
        const r = b.getBoundingClientRect(), s = strip.getBoundingClientRect();
        return r.right > s.right + 1 || r.left < s.left - 1;
      }).length,
    };
  });
}

(async () => {
  const browser = await playwright.chromium.launch();
  for (const layout of ['grouped (default)', 'classic']) {
    console.log('\n' + layout);
    console.log('  threshold  width   rows  bar-h   sideways-scroll  offscreen-tabs');
    for (const t of ['761', '1180']) {
      const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
      await page.addInitScript(() => { window.confirm = () => true; });
      await page.goto('file://' + variants[t]);
      await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
      await page.click('[data-setup-begin]');
      await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
      await page.click('[data-doctrine]');
      await page.waitForTimeout(200);
      if (layout === 'classic') {
        await page.evaluate(() => { S.uiPrefs.layout = 'classic'; render(); });
        await page.waitForTimeout(200);
      }
      for (const w of WIDTHS) {
        const m = await measure(page, w);
        if (!m) { console.log('    no nav.tabs at ' + w); continue; }
        console.log('  ' + ('min-' + t).padEnd(11) + String(w).padEnd(8) +
          String(m.rows).padEnd(6) + String(m.height + 'px').padEnd(8) +
          (m.scrolls ? 'yes' : 'no').padEnd(17) + m.hidden + '/' + m.buttons);
      }
      await page.close();
    }
  }
  await browser.close();
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
