#!/usr/bin/env node
'use strict';
/*
 * The navigation, measured at the three tiers.
 *
 *   node tools/tabs.js
 *
 * Rewritten in S9c: the original tool spliced scratch variants of a
 * `min-width:901px` rule that S6a removed, so it had been failing before it
 * measured anything. This version asserts what the Atlas actually promises:
 * the grouped strip renders two rows with exactly one current button per row,
 * group memory returns you to the page you left, the classic layout keeps all
 * fifteen flat tabs with no group buttons, badges reach both rows, and no
 * label repeats in the accessible-name trail (the "Government, Government,
 * Government" regression).
 */
const { execSync } = require('child_process');
const { createRequire } = require('module');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + (process.env.VALE_FILE || path.join(ROOT, 'vale.html'));

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

const TIERS = [{ n: 'phone', w: 390, h: 844 }, { n: 'tablet', w: 834, h: 1000 }, { n: 'desktop', w: 1500, h: 950 }];
let fail = 0;
const say = (ok, label, detail) => { if (!ok) fail++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(30) + detail); };

(async () => {
  const browser = await playwright.chromium.launch();
  for (const t of TIERS) {
    const page = await browser.newPage({ viewport: { width: t.w, height: t.h } });
    await page.addInitScript(() => { window.confirm = () => true; });
    await page.goto(URL);
    await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
    await page.click('[data-setup-begin]');
    await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
    await page.click('[data-doctrine]');
    await page.waitForTimeout(300);
    console.log('\n' + t.n + ' (' + t.w + 'px)');

    const strip = await page.evaluate(() => {
      const nav = document.getElementById('tabs');
      const rows = nav.querySelectorAll('.tabrow');
      const cur = r => r.querySelectorAll('[aria-current="true"]').length;
      const names = [...nav.querySelectorAll('button')].map(b => b.textContent.replace(/\d+$/, '').trim());
      const run = names.filter((n, i) => i && n === names[i - 1]);
      return {
        grouped: nav.classList.contains('grouped'), rows: rows.length,
        curPerRow: [...rows].map(cur),
        adjacentRepeats: run,
        overflowsX: nav.scrollWidth > nav.clientWidth + 1 || [...rows].some(r => r.scrollWidth > r.clientWidth + 1),
      };
    });
    say(strip.grouped && strip.rows === 2 && strip.curPerRow.every(c => c === 1),
      'grouped strip', `2 rows: ${strip.rows === 2}; one current per row: [${strip.curPerRow.join(',')}]`);
    say(strip.adjacentRepeats.length === 0, 'no stuttering labels',
      strip.adjacentRepeats.length ? 'repeated: ' + strip.adjacentRepeats.join(', ') : 'no adjacent buttons share a label');

    const memory = await page.evaluate(async () => {
      document.querySelector('#tabs [data-group="gLaw"]').click();
      await new Promise(r => setTimeout(r, 60));
      document.querySelector('#tabs [data-tab="houses"]').click();
      await new Promise(r => setTimeout(r, 60));
      document.querySelector('#tabs [data-group="gCountry"]').click();
      await new Promise(r => setTimeout(r, 60));
      document.querySelector('#tabs [data-group="gLaw"]').click();
      await new Promise(r => setTimeout(r, 60));
      return UI.tab;
    });
    say(memory === 'houses', 'group memory', `left Lawmaking on houses, returned to ${memory}`);

    const badge = await page.evaluate(async () => {
      S.scandals.push({ status: 'active', minister: 'test', heat: 50 });
      render();
      /* the group badge is visible from anywhere; the page badge only when
         its group's pages row is open */
      const groupB = document.querySelector('#tabs [data-group="gGov"] .nbadge');
      document.querySelector('#tabs [data-group="gGov"]').click();
      await new Promise(r => setTimeout(r, 60));
      const pageB = document.querySelector('#tabs [data-tab="government"] .nbadge');
      S.scandals.pop();
      document.querySelector('#tabs [data-group="gDesk"]').click();
      await new Promise(r => setTimeout(r, 60));
      return { pageBadge: !!pageB, groupBadge: !!groupB };
    });
    say(badge.pageBadge && badge.groupBadge, 'badges reach both rows',
      `page button: ${badge.pageBadge}, group button: ${badge.groupBadge}`);

    const classic = await page.evaluate(async () => {
      S.uiPrefs.layout = 'classic'; render();
      await new Promise(r => setTimeout(r, 60));
      const nav = document.getElementById('tabs');
      const out = {
        tabs: nav.querySelectorAll('[data-tab]').length,
        groups: nav.querySelectorAll('[data-group]').length,
        grouped: nav.classList.contains('grouped'),
      };
      S.uiPrefs.layout = 'clean'; render();
      return out;
    });
    say(classic.tabs >= 15 && classic.groups === 0 && !classic.grouped,
      'classic layout intact', `${classic.tabs} flat tabs, ${classic.groups} group buttons`);

    if (t.n !== 'phone') {
      say(!strip.overflowsX, 'strip fits the tier', strip.overflowsX ? 'a row scrolls sideways above the phone tier' : 'no row scrolls sideways');
    } else {
      console.log('      (phone rows may scroll by design; centring asserted by the playtest)');
    }
    await page.close();
  }
  await browser.close();
  console.log(fail ? '\n' + fail + ' CHECK(S) FAILED' : '\nTABS OK');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
