#!/usr/bin/env node
'use strict';
/*
 * Prove the campaign's dice are actually seeded.
 *
 *   node tools/determinism.js
 *
 * The promise S3 makes to the player is narrow and testable: the same seed and
 * the same decisions give the same republic. A count of Math.random() sites
 * cannot show that — the static check only proves nothing calls the unseeded
 * source, not that the seeded one is wired up correctly, that its state
 * survives a save, or that a preview does not quietly consume it. So this plays
 * real turns and compares real state.
 *
 * Five properties, each a way the promise has failed before in games like this:
 *
 *   1. same seed  -> identical state after several turns
 *   2. diff seed  -> different state (a broken engine that returns a constant
 *                    would pass test 1 perfectly)
 *   3. the stream survives a save/reload round trip
 *   4. a sandbox forecast does not advance the real campaign's dice
 *   5. undo rewinds the dice with everything else
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

let fail = 0;
const say = (ok, label, detail) => {
  if (!ok) fail++;
  console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(26) + detail);
};

// A campaign is summarised by the things the dice actually drive, not by the
// whole blob: comparing all of S would also compare fields no roll touches, and
// would pass even if the dice were frozen.
const FINGERPRINT = `(function () {
  return JSON.stringify({
    turn: S.turn, seed: S.seed, rng: S.rngState,
    treasury: Math.round(S.treasury), capital: S.capital, unrest: Math.round(S.unrest),
    seats: S.seats, upper: S.upper && S.upper.seats,
    approval: Math.round(approval(S) * 100),
    // figures is a map of party -> people in some builds and a list in others
    figures: JSON.stringify(S.figures || null),
    news: [].concat(S.news || []).map(function (n) { return n && n.headline; }).join('|'),
    log: [].concat(S.log || []).slice(0, 12).map(String).join('|')
  });
})()`;

/* Start a campaign from a typed seed, the way a player would. Pinning S.seed
   after the game exists is NOT equivalent and was the first draft's bug: the
   founding figures, the scenario's variations and the opening news are already
   rolled by then, so two runs shared a stream but not the republic it acted on,
   and they diverged for a reason that had nothing to do with the engine. */
async function campaign(browser, opts) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.goto(URL);
  await page.waitForSelector('[data-setup-seed]', { timeout: 15000 });
  /* Three chunks each re-open the setup sheet during boot, each with a fresh
     selection object, so a value typed before the last one lands is discarded.
     Fill, then confirm it is still there, and only then begin. */
  let filled = false;
  for (let i = 0; i < 12; i++) {
    await page.fill('[data-setup-seed]', opts.seedText);
    await page.waitForTimeout(120);
    if (await page.$eval('[data-setup-seed]', el => el.value) === opts.seedText) {
      await page.waitForTimeout(200);
      if (await page.$eval('[data-setup-seed]', el => el.value) === opts.seedText) { filled = true; break; }
    }
  }
  if (!filled) throw new Error('the seed field would not hold a value through boot');
  await page.click('[data-setup-begin]');
  await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await page.click('[data-doctrine]');
  await page.waitForTimeout(200);
  const got = await page.evaluate(() => S.seed);
  const want = parseInt(opts.seedText, 16) | 0;
  if (got !== want) throw new Error('the setup sheet did not take the seed: asked ' + want + ', got ' + got);
  return page;
}

/* Wait on the game's own state, never on a fixed timeout. A turn queues modals
   through v6Later/v6Pump, which only advance when a sheet closes, and holds
   UI.busy while it runs. Sleeping a guessed number of milliseconds instead
   makes the HARNESS nondeterministic, which reads exactly like a broken PRNG:
   the first draft of this file reported three failures that were all its own
   timing, including an "undo does not rewind the dice" that was really a
   captureUndo issued while UI.busy was still set. */
async function settle(page) {
  /* Quiet has to be SUSTAINED, not instantaneous. v6 pumps its queue 40ms after
     a sheet closes, so there is a window where nothing is busy and no modal is
     open and another one is about to appear. Returning inside that window lets
     the next endTurn race the pump, and the two runs of a comparison then make
     different decisions — which looks exactly like a broken PRNG and is not. */
  let quiet = 0;
  for (let i = 0; i < 90; i++) {
    const state = await page.evaluate(() => ({
      busy: !!UI.busy,
      open: !!(document.getElementById('modal') && !document.getElementById('modal').hidden),
    }));
    if (!state.busy && !state.open) {
      if (++quiet >= 4) return true;
      await page.waitForTimeout(90);
      continue;
    }
    quiet = 0;
    // The queue's modals must be ANSWERED, not dismissed: runQueue holds
    // UI.busy until a choice fires its continuation, so calling hideSheet()
    // here strands the turn busy forever. Always the first choice, so both
    // runs of a comparison make the same decisions — which is the half of
    // "same seed, same decisions" that is the harness's job to hold still.
    // Only ever click while the modal is actually OPEN. Between queue items the
    // sheet is hidden but still holds the previous event's buttons, and
    // clicking one of those re-fires an event that has already resolved.
    if (state.open) {
      await page.evaluate(() => {
        const sh = document.getElementById('sheet');
        if (!sh) return;
        // Answer whatever kind of sheet this is, always taking the FIRST
        // control of the most specific kind present, so the run is repeatable:
        // an event choice, then a plain close, then any other choice (the
        // coalition dialog offers neither of the first two), then the X.
        const b = sh.querySelector('[data-ev]') || sh.querySelector('[data-close]') ||
          sh.querySelector('.choice') || sh.querySelector('.modal-close');
        if (b) b.click();
      });
    }
    await page.waitForTimeout(90);
  }
  const last = await page.evaluate(() => {
    const sh = document.getElementById('sheet');
    return JSON.stringify({
      busy: !!UI.busy, hidden: document.getElementById('modal').hidden, turn: S.turn,
      title: (sh && sh.querySelector('h2') || {}).textContent,
      controls: sh ? [...sh.querySelectorAll('button')].map(b => b.getAttribute('data-ev') !== null ? 'data-ev'
        : b.getAttribute('data-close') !== null ? 'data-close' : b.className).slice(0, 8) : [],
    });
  });
  throw new Error('the turn never settled — ' + last);
}

async function playTurns(page, n) {
  for (let i = 0; i < n; i++) {
    await settle(page);
    const before = await page.evaluate(() => S.turn);
    await page.evaluate(() => { endTurn(); });
    await page.waitForFunction(t => S.turn > t, before, { timeout: 20000 });
    await settle(page);
  }
  // let the 160ms autosave debounce land so nothing is still in flight
  await page.waitForTimeout(250);
  return page.evaluate(FINGERPRINT);
}

(async () => {
  const browser = await playwright.chromium.launch();
  const SEED = '5EED1234';
  const OTHER = '5EED1235';

  /* 1 & 2 — the engine, driven directly.
     Deliberately NOT through the modal queue. Six turns clicked through the UI
     produce an identical dice stream but can still differ in state, because
     which queued sheets a run happens to pump depends on the exact interleaving
     of clicks — that is the harness varying, not the game, and it buries the
     property being tested. v6Sandbox gives the engine a clone of S and swaps the
     globals back afterwards, so this runs whole turns of real game logic with
     no UI in the loop at all. */
  const TURNS = 6;
  const modelRun = page => page.evaluate(([seedHex, turns]) => {
    const seed = parseInt(seedHex, 16) | 0;
    const box = v6Sandbox(function (clone) {
      clone.seed = seed;
      clone.rngState = seed;
      for (let i = 0; i < turns; i++) tickTurn(clone);
    });
    const st = box.st;
    return JSON.stringify({
      turn: st.turn, seed: st.seed, rng: st.rngState,
      treasury: st.treasury, capital: st.capital, unrest: st.unrest,
      seats: st.seats, upper: st.upper && st.upper.seats,
      ind: st.ind, blocs: st.blocs,
      news: [].concat(st.news || []).map(n => n && n.headline).join('|'),
      log: [].concat(st.log || []).slice(0, 20).map(String).join('|'),
    });
  }, [SEED, TURNS]);

  const a = await campaign(browser, { seedText: SEED });
  const fpA = await modelRun(a);
  const fpAgain = await modelRun(a);        // same page, twice
  await a.close();

  const b = await campaign(browser, { seedText: SEED });
  const fpB = await modelRun(b);            // fresh page, same seed
  await b.close();

  const c = await campaign(browser, { seedText: OTHER });
  const fpC = await c.evaluate(([seedHex, turns]) => {
    const seed = parseInt(seedHex, 16) | 0;
    const box = v6Sandbox(function (clone) {
      clone.seed = seed; clone.rngState = seed;
      for (let i = 0; i < turns; i++) tickTurn(clone);
    });
    return JSON.stringify({ treasury: box.st.treasury, seats: box.st.seats, rng: box.st.rngState });
  }, [OTHER, TURNS]);
  await c.close();

  say(fpA === fpAgain && fpA === fpB, 'same seed reproduces',
    fpA === fpAgain && fpA === fpB
      ? TURNS + ' turns from seed ' + SEED + ' are identical run twice in one page and once in a fresh one'
      : (fpA !== fpAgain ? 'two runs in the SAME page diverged' : 'a fresh page diverged from the first') +
        '\n      A: ' + fpA.slice(0, 200) + '\n      B: ' + (fpA !== fpAgain ? fpAgain : fpB).slice(0, 200));
  const divergent = !fpC || JSON.parse(fpC).rng !== JSON.parse(fpA).rng ||
    JSON.parse(fpC).treasury !== JSON.parse(fpA).treasury;
  say(divergent, 'different seed diverges',
    divergent ? 'flipping one bit of the seed gives a different republic'
      : 'two different seeds produced the SAME republic — the engine is not consuming its state');

  // 3 — the stream survives a save/reload round trip
  const d = await campaign(browser, { seedText: SEED });
  await playTurns(d, 2);
  const blob = await d.evaluate(() => JSON.stringify(S));
  const midway = await d.evaluate(FINGERPRINT);
  const afterDirect = await playTurns(d, 2);
  await d.close();

  const e = await campaign(browser, { seedText: SEED });
  await e.evaluate(b2 => { S = enrichState(JSON.parse(b2), false); render(); }, blob);
  await e.waitForTimeout(200);
  const restored = await e.evaluate(FINGERPRINT);
  const afterReload = await playTurns(e, 2);
  await e.close();

  say(restored === midway, 'save restores the stream',
    restored === midway ? 'the reloaded campaign is byte-identical at the point it was saved'
      : 'the reloaded state differs from what was saved');
  say(afterDirect === afterReload, 'stream resumes mid-campaign',
    afterDirect === afterReload ? 'two more turns after a reload match two more turns without one'
      : 'the dice diverged after a save/reload — rngState is not surviving the round trip');

  // 4 — a forecast must not consume the campaign's dice
  const f = await campaign(browser, { seedText: SEED });
  await playTurns(f, 1);
  const beforeForecast = await f.evaluate(() => S.rngState);
  const forecasts = await f.evaluate(() => {
    const out = [];
    for (let i = 0; i < 3; i++) out.push(JSON.stringify(v6Sandbox(function (clone) { tickTurn(clone); }).st.treasury));
    return out;
  });
  const afterForecast = await f.evaluate(() => S.rngState);
  await f.close();
  say(beforeForecast === afterForecast, 'forecasts do not spend dice',
    beforeForecast === afterForecast
      ? 'three sandbox forecasts left rngState at ' + beforeForecast
      : 'rngState moved ' + beforeForecast + ' -> ' + afterForecast + ' during a preview');
  say(new Set(forecasts).size === 1, 'forecasts are repeatable',
    new Set(forecasts).size === 1 ? 'the same state forecast three times gave the same answer'
      : 'three forecasts of one state disagreed: ' + forecasts.join(' / '));

  // 5 — undo rewinds the dice too
  const g = await campaign(browser, { seedText: SEED });
  await playTurns(g, 1);
  await settle(g);
  const undoOk = await g.evaluate(() => {
    if (typeof captureUndo !== 'function') return 'no captureUndo';
    captureUndo('a test decision');
    if (!UI.undo) return 'captureUndo refused (busy, ironman or the game is over) — nothing to undo';
    const before = S.rngState;
    for (let i = 0; i < 25; i++) rand();
    const moved = S.rngState !== before;
    if (typeof undoLast === 'function') undoLast();
    return moved ? (S.rngState === before ? 'ok' : 'undo left rngState at ' + S.rngState + ', expected ' + before)
      : 'rand() did not move rngState at all';
  });
  await g.close();
  say(undoOk === 'ok', 'undo rewinds the dice',
    undoOk === 'ok' ? 'twenty-five rolls, then undo, and the stream is back where it was' : undoOk);

  await browser.close();
  console.log(fail ? '\n' + fail + ' DETERMINISM CHECK(S) FAILED' : '\nDETERMINISM PASS');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
