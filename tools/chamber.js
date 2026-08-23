#!/usr/bin/env node
'use strict';
/*
 * Look at the chamber at every tier, and check it fits its own box.
 *
 *   node tools/chamber.js
 *
 * The seat map is the centrepiece, and everything about it is arithmetic that
 * is easy to get subtly wrong: seats packed past their pitch overlap into a
 * smear, labels placed on the arc lie across the seats they name, and a
 * viewBox wider than the arc spends the tier's height budget on empty margin.
 * So this measures rather than eyeballs: seat count against the roll, whether
 * any two seats overlap, whether any label escapes the viewBox or collides
 * with another, and how much of the box the chamber actually uses.
 */
const { execSync } = require('child_process');
const { createRequire } = require('module');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + (process.env.VALE_FILE || path.join(ROOT, 'vale.html'));
const OUT = path.join(__dirname, 'out');

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

const TIERS = [{ n: 'phone', w: 390 }, { n: 'tablet', w: 834 }, { n: 'desktop', w: 1500 }];
let fail = 0;

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.goto(URL);
  await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
  await page.click('[data-setup-begin]');
  await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await page.click('[data-doctrine]');
  await page.waitForTimeout(300);

  // geometry is tier-independent (it is inside the viewBox) — measure it once,
  // for every chamber on the page, because the Senate has its own geometry and
  // its own way of getting the packing wrong
  const all = await page.evaluate(() => [...document.querySelectorAll('svg.hemi')].length);
  const geomFor = i => page.evaluate(idx => {
    const svg = [...document.querySelectorAll('svg.hemi')][idx];
    if (!svg) return null;
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    const cs = [...svg.querySelectorAll('circle')].map(c => ({
      x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r'),
      fill: c.getAttribute('fill'),
    }));
    let overlap = 0, worst = 0, tightest = Infinity;
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        const d = Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y);
        if (d < tightest) tightest = d;
        const need = cs[i].r + cs[j].r;
        if (d < need) { overlap++; worst = Math.max(worst, need - d); }
      }
    }
    const texts = [...svg.querySelectorAll('text')].map(t => {
      const b = t.getBBox();
      return { s: t.textContent, x: b.x, y: b.y, w: b.width, h: b.height };
    });
    let escapes = 0, clash = 0;
    for (let i = 0; i < texts.length; i++) {
      const a = texts[i];
      if (a.x < 0 || a.y < 0 || a.x + a.w > vb[2] || a.y + a.h > vb[3]) escapes++;
      for (let j = i + 1; j < texts.length; j++) {
        const b = texts[j];
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) clash++;
      }
    }
    // "Used" is the whole drawing — seats AND their labels — against the box.
    // Measuring only the seats calls the label band dead margin, which it is
    // not: the blocs at the horizontal ends run their text outward by design.
    let x0 = Infinity, x1b = -Infinity, y0 = Infinity, y1b = -Infinity;
    cs.forEach(c => {
      x0 = Math.min(x0, c.x - c.r); x1b = Math.max(x1b, c.x + c.r);
      y0 = Math.min(y0, c.y - c.r); y1b = Math.max(y1b, c.y + c.r);
    });
    texts.forEach(t => {
      x0 = Math.min(x0, t.x); x1b = Math.max(x1b, t.x + t.w);
      y0 = Math.min(y0, t.y); y1b = Math.max(y1b, t.y + t.h);
    });
    const used = Math.min((x1b - x0) / vb[2], (y1b - y0) / vb[3]);
    const byFill = {};
    cs.forEach(c => { byFill[c.fill] = (byFill[c.fill] || 0) + 1; });
    return { seats: cs.length, overlap, worst, tightest, r: cs[0] ? cs[0].r : 0,
      texts: texts.map(t => t.s), escapes, clash,
      used: Math.round(used * 100), vb: vb[2] + 'x' + vb[3], byFill };
  }, i);

  if (!all) { console.log('FAIL  no svg.hemi on the page'); process.exit(1); }

  const roll = await page.evaluate(() => [
    { name: 'Assembly', seats: S.seats },
    { name: 'Senate', seats: S.upper.seats },
  ].map(c => ({ name: c.name, total: Object.values(c.seats).reduce((a, b) => a + b, 0),
    parties: Object.values(c.seats).filter(n => n > 0).length })));

  const say = (ok, label, detail) => { if (!ok) fail++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(22) + detail); };
  let geom;
  for (let i = 0; i < all; i++) {
    const g = await geomFor(i);
    const r = roll[i] || { name: 'chamber ' + i, total: g.seats, parties: Object.keys(g.byFill).length };
    if (i === 0) geom = g;
    console.log((i ? '\n' : '') + r.name + ' seat map, inside the viewBox (' + g.vb + ')\n');
    say(g.seats === r.total, 'seat count', g.seats + ' circles for ' + r.total + ' seats on the roll');
    say(g.overlap === 0, 'no seats overlap',
      (g.overlap ? g.overlap + ' overlapping pair(s), worst by ' + g.worst.toFixed(2) + ' units. '
        : 'every seat clears its neighbours. ') +
      'Tightest gap between two seat centres is ' + g.tightest.toFixed(2) +
      ', so the largest radius that clears everywhere is ' + (g.tightest / 2).toFixed(2) +
      ' (set: ' + g.r + ')');
    say(Object.keys(g.byFill).length === r.parties, 'one fill per party',
      Object.keys(g.byFill).length + ' distinct fills for ' + r.parties + ' parties with seats');
    say(g.escapes === 0, 'labels inside the box', g.escapes ? g.escapes + ' escape it' : 'all ' + g.texts.length + ' fit');
    say(g.clash === 0, 'labels do not collide', g.clash ? g.clash + ' overlapping pair(s)' : g.texts.length + ' placed, none overlapping');
    say(g.used >= 88, 'box fits its drawing', g.used + '% of the viewBox covered by seats and labels (the rest is dead margin the tier pays height for)');
    console.log('      labels: ' + g.texts.join(' | '));
  }

  console.log('\nRendered size per tier — how big a seat actually reads');
  for (const t of TIERS) {
    await page.setViewportSize({ width: t.w, height: 1000 });
    await page.evaluate(() => { UI.tab = 'parliament'; render(); });
    await page.waitForTimeout(250);
    const el = await page.$('svg.hemi');
    if (!el) { console.log('  ' + t.n + ': no map rendered'); fail++; continue; }
    const box = await el.boundingBox();
    const vb = geom.vb.split('x').map(Number);
    const scale = box.width / vb[0];
    console.log('  ' + t.n.padEnd(9) + Math.round(box.width) + 'x' + Math.round(box.height) +
      '   scale ' + scale.toFixed(2) + 'x   seat diameter ' + (2 * geom.r * scale).toFixed(1) + 'px');
    await el.screenshot({ path: path.join(OUT, 'chamber-' + t.n + '.png') });
  }
  console.log('\nscreenshots: tools/out/chamber-{phone,tablet,desktop}.png');
  await browser.close();
  console.log(fail ? '\n' + fail + ' CHECK(S) FAILED' : '\nCHAMBER OK');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
