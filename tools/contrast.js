#!/usr/bin/env node
'use strict';
/*
 * Contrast and the thumb, measured on the rendered page at the three tiers.
 *
 *   node tools/contrast.js            all three tiers, all fifteen pages
 *   node tools/contrast.js --list     every offender rather than the worst ten
 *
 * TWO THINGS, BOTH READ OFF THE REAL PIXELS rather than off the stylesheet.
 * A stylesheet says what a rule intends; a rendered page says what six chunks
 * of CSS agreed on, and this file's rules conflict by source order. So every
 * element that carries its OWN text is measured: its computed colour, the
 * background composited up through every translucent ancestor, and the ratio
 * between them against the WCAG threshold its size and weight earn (3:1 for
 * large text, 4.5:1 otherwise). And every control that can be pressed is
 * measured for size, against 44px on the phone -- the reference is a thumb on
 * an iPhone -- and 32px above it, where the pointer is a mouse and the AA
 * floor is 24.
 *
 * WHAT IS EXEMPT IS WRITTEN DOWN, in checks/contrast.json, with a reason each.
 * A tool whose exemptions live in its own source is a tool that grows quiet.
 */
const { execSync } = require('child_process');
const { createRequire } = require('module');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + (process.env.VALE_FILE || path.join(ROOT, 'vale.html'));
const LIST = process.argv.indexOf('--list') >= 0;
const ADJ = JSON.parse(fs.readFileSync(path.join(ROOT, 'checks', 'contrast.json'), 'utf8'));

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

const TIERS = [
  { n: 'phone', w: 390, h: 844, target: 44 },
  { n: 'tablet', w: 900, h: 1000, target: 32 },
  { n: 'desktop', w: 1500, h: 950, target: 32 }
];
let fail = 0;
const say = (ok, label, detail) => { if (!ok) fail++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(26) + detail); };

/* Runs inside the page. Returns the worst reading per selector, so a deck of
   four hundred identical cards reports once. */
const PROBE = (floor) => {
  function parse(c) {
    const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(fg, bg) {
    const a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  /* the ground under an element is every translucent ancestor composited down
     onto the first opaque one, which is what the eye sees and what a single
     `getComputedStyle` reading is not */
  function bgOf(el) {
    let cur = el; const stack = [];
    while (cur) {
      const c = parse(getComputedStyle(cur).backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
      cur = cur.parentElement;
    }
    let acc = { r: 0, g: 0, b: 0, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
    return acc;
  }
  function lum(c) {
    const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function ratio(a, b) {
    const l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function sel(el) {
    let s = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).filter(function (c) { return c && !/^(show|open|current|active|spot)$/.test(c); });
      if (cls.length) s += '.' + cls.slice(0, 2).join('.');
    }
    return s;
  }
  const text = {}, small = {};
  const roots = [document.getElementById('view'), document.querySelector('.topbar'),
    document.getElementById('tabs'), document.getElementById('modal')].filter(Boolean);
  roots.forEach(function (root) {
    root.querySelectorAll('*').forEach(function (el) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      let own = '';
      Array.prototype.forEach.call(el.childNodes, function (n) { if (n.nodeType === 3) own += n.textContent; });
      own = own.trim();
      if (own) {
        const fg0 = parse(cs.color);
        if (fg0) {
          const bg = bgOf(el);
          const fg = fg0.a < 1 ? over(fg0, bg) : fg0;
          const cr = ratio(fg, bg);
          const size = parseFloat(cs.fontSize), wt = parseInt(cs.fontWeight, 10) || 400;
          const large = size >= 24 || (size >= 18.66 && wt >= 700);
          const need = large ? 3 : 4.5;
          if (cr < need) {
            const k = sel(el);
            if (!text[k] || text[k].cr > cr) {
              text[k] = { cr: Math.round(cr * 100) / 100, need: need, size: Math.round(size), wt: wt,
                fg: cs.color, sample: own.slice(0, 30) };
            }
          }
        }
      }
      const press = /^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName) ||
        (el.tagName === 'A' && el.getAttribute('href')) || el.getAttribute('role') === 'button';
      if (press && !el.disabled) {
        const w = Math.round(r.width), h = Math.round(r.height);
        if (w < floor || h < floor) {
          const k = sel(el);
          if (!small[k] || small[k].w * small[k].h > w * h) {
            small[k] = { w: w, h: h, sample: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24) };
          }
        }
      }
    });
  });
  return { text: text, small: small };
};

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
    await page.waitForTimeout(250);

    const all = { text: {}, small: {} };
    const tabs = await page.evaluate(() => TABS.map(x => x.id));
    for (const tab of tabs) {
      await page.evaluate((x) => { UI.tab = x; render(); }, tab);
      await page.waitForTimeout(45);
      const r = await page.evaluate(PROBE, t.target);
      for (const k in r.text) if (!all.text[k] || all.text[k].cr > r.text[k].cr) all.text[k] = r.text[k];
      for (const k in r.small) if (!all.small[k] || all.small[k].w * all.small[k].h > r.small[k].w * r.small[k].h) all.small[k] = r.small[k];
    }
    /* and the sheet, which is a surface of its own and never rendered by a tab */
    await page.evaluate(() => {
      UI.tab = 'chamber'; render();
      if (typeof showSheet === 'function') {
        showSheet('<h2>A question</h2><p class="note">Measured with a sheet up.</p>' +
          '<div class="btnrow"><button class="btn" data-close>Close</button>' +
          '<button class="btn ghost">Another</button></div>');
      }
    });
    await page.waitForTimeout(120);
    const sheet = await page.evaluate(PROBE, t.target);
    for (const k in sheet.text) if (!all.text[k] || all.text[k].cr > sheet.text[k].cr) all.text[k] = sheet.text[k];
    for (const k in sheet.small) if (!all.small[k] || all.small[k].w * all.small[k].h > sheet.small[k].w * sheet.small[k].h) all.small[k] = sheet.small[k];

    const exText = ADJ.text || {}, exSmall = ADJ.targets || {};
    const badText = Object.entries(all.text).filter(([k]) => !exText[k]);
    const badSmall = Object.entries(all.small).filter(([k]) => !exSmall[k]);
    const okText = Object.entries(all.text).filter(([k]) => exText[k]);
    const okSmall = Object.entries(all.small).filter(([k]) => exSmall[k]);

    console.log('\n== ' + t.n + '  ' + t.w + 'x' + t.h + '  (targets floor ' + t.target + 'px)');
    say(badText.length === 0, 'text meets AA',
      badText.length ? badText.length + ' selector(s) under threshold' :
        'every element that carries its own text clears 4.5:1, or 3:1 where its size and weight earn it' +
        (okText.length ? ' (' + okText.length + ' adjudicated)' : ''));
    (LIST ? badText : badText.slice(0, 10)).sort((a, b) => a[1].cr - b[1].cr).forEach(([k, v]) => {
      console.log('        ' + String(v.cr).padStart(5) + ':1 needs ' + v.need + '  ' + v.size + 'px/' + v.wt +
        '  ' + k.slice(0, 34).padEnd(34) + ' ' + v.fg + '  "' + v.sample + '"');
    });
    say(badSmall.length === 0, 'controls take a thumb',
      badSmall.length ? badSmall.length + ' selector(s) under ' + t.target + 'px' :
        'every control that can be pressed is at least ' + t.target + 'px on both axes' +
        (okSmall.length ? ' (' + okSmall.length + ' adjudicated)' : ''));
    (LIST ? badSmall : badSmall.slice(0, 10)).sort((a, b) => a[1].w * a[1].h - b[1].w * b[1].h).forEach(([k, v]) => {
      console.log('        ' + String(v.w).padStart(4) + 'x' + String(v.h).padStart(3) + '  ' +
        k.slice(0, 40).padEnd(40) + ' "' + v.sample + '"');
    });
    await page.close();
  }
  await browser.close();
  console.log(fail ? '\n' + fail + ' CHECK(S) FAILED' : '\nCONTRAST OK');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
