#!/usr/bin/env node
'use strict';
/*
 * Play each length option to its end and report what the player actually gets.
 *
 *   node tools/pacing.js              all three lengths, one seed
 *   node tools/pacing.js short        one length
 *   VALE_SEEDS=A1B2C3D4,5EED1234 node tools/pacing.js
 *
 * The ruling on pacing was "player-chosen, both real": every length option
 * should deliver a complete arc, not just a truncated version of the longest
 * one. That is a claim about what a campaign CONTAINS — how many elections, how
 * many crises, whether the achievements are reachable, whether the republic
 * gets to change character — and it cannot be settled by reading the code.
 *
 * So this plays real sessions through the real turn loop, answering every
 * dialog the way a player would, until the campaign reaches its end year, and
 * prints the arc each length delivered.
 *
 * It CHANGES NOTHING. Balance is reserved to the user (docs/AGREEMENT.md), so
 * the output of this tool is the proposal material, not a licence to retune.
 */
const { execSync } = require('child_process');
const { createRequire } = require('module');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + (process.env.VALE_FILE || path.join(ROOT, 'vale.html'));
const SEEDS = (process.env.VALE_SEEDS || '5EED1234').split(',').filter(Boolean);
const ONLY = process.argv[2];
const LENGTHS = ['short', 'standard', 'epic'].filter(k => !ONLY || k === ONLY);
const CAP = Number(process.env.VALE_CAP || 230);   // sessions, a runaway guard (epic is 200)

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

/* Answer whatever the game is asking, always the first control of the most
   specific kind, so a run is repeatable. See tools/determinism.js: the queue's
   modals must be ANSWERED, not dismissed — runQueue holds UI.busy until a
   choice fires its continuation. */
async function settle(page) {
  let quiet = 0;
  for (let i = 0; i < 120; i++) {
    const st = await page.evaluate(() => ({
      busy: !!UI.busy, open: !document.getElementById('modal').hidden, over: !!(window.S && S.over),
    }));
    if (st.over) return 'over';
    if (!st.busy && !st.open) { if (++quiet >= 3) return true; await page.waitForTimeout(45); continue; }
    quiet = 0;
    if (st.open) {
      await page.evaluate(() => {
        const sh = document.getElementById('sheet');
        const b = sh && (sh.querySelector('[data-ev]') || sh.querySelector('[data-close]') ||
          sh.querySelector('.choice') || sh.querySelector('.modal-close'));
        if (b) b.click();
      });
    }
    await page.waitForTimeout(50);
  }
  throw new Error('a session never settled');
}

const SNAPSHOT = `(function () {
  var st = S, v = st.v6 || {}, lg = st.legacy || {}, sx = (v.stats) || {};
  var unlocked = 0;
  try { unlocked = V6_ACHIEVEMENTS.filter(function (a) { return a.test(st); }).length; } catch (e) {}
  return {
    turn: st.turn, year: yearOf(st.turn), endYear: st.endYear, over: !!st.over,
    elections: lg.electionsWon, yearsGoverning: lg.yearsInGovernment, laws: lg.playerLaws,
    arcs: (v.arcs && v.arcs.count) || 0,
    events: sx.events || 0, treaties: sx.treaties || 0, wars: sx.wars || 0,
    referendums: (sx.referendumsWon || 0) + (sx.referendumsLost || 0),
    coalitions: sx.coalitionsNegotiated || 0, governors: sx.governorsMet || 0,
    achievements: unlocked, achievementsTotal: (typeof V6_ACHIEVEMENTS !== 'undefined' ? V6_ACHIEVEMENTS.length : 0),
    ruling: st.ruling, playAs: playParty(st), form: st.form,
    approval: Math.round(approval(st)), unrest: Math.round(st.unrest),
    history: (v.history || []).length
  };
})()`;

async function campaign(browser, lengthKey, seedText) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.goto(URL);
  await page.waitForSelector('[data-setup-seed]', { timeout: 15000 });
  for (let i = 0; i < 12; i++) {
    await page.fill('[data-setup-seed]', seedText);
    await page.waitForTimeout(110);
    if (await page.$eval('[data-setup-seed]', el => el.value) === seedText) break;
  }
  // the length lives inside the S7 disclosure, so open it before choosing
  await page.evaluate(() => { const d = document.querySelector('.setup-more'); if (d) d.open = true; });
  await page.waitForTimeout(80);
  await page.click('[data-setup-length="' + lengthKey + '"]');
  await page.waitForTimeout(140);
  await page.evaluate(() => { const d = document.querySelector('.setup-more'); if (d) d.open = true; });
  await page.click('[data-setup-begin]');
  await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await page.click('[data-doctrine]');
  await settle(page);

  // record the character of the republic as we go, not only at the end
  const marks = [];
  let sessions = 0, ended = 'cap';
  for (; sessions < CAP; sessions++) {
    const before = await page.evaluate(() => S.turn);
    const moved = await page.evaluate(() => { if (S.over || UI.busy) return false; endTurn(); return true; });
    if (!moved) { ended = 'over'; break; }
    try { await page.waitForFunction(t => S.turn > t || S.over, before, { timeout: 25000 }); }
    catch (e) { ended = 'stuck'; break; }
    const s = await settle(page);
    if (s === 'over') { ended = 'over'; break; }
    if (sessions % 5 === 0) marks.push(await page.evaluate(SNAPSHOT));
    const done = await page.evaluate(() => !!S.over || (S.endYear && yearOf(S.turn) >= S.endYear));
    if (done) { ended = 'reached the end year'; break; }
  }
  const final = await page.evaluate(SNAPSHOT);
  await page.close();
  return { final, marks, sessions: sessions + 1, ended };
}

(async () => {
  const browser = await playwright.chromium.launch();
  const rows = [];
  for (const seed of SEEDS) {
    for (const key of LENGTHS) {
      process.stdout.write('playing ' + key + ' from seed ' + seed + ' ... ');
      const r = await campaign(browser, key, seed);
      console.log(r.sessions + ' sessions, ' + r.ended);
      rows.push({ key, seed, ...r });
    }
  }
  await browser.close();

  console.log('\nWhat each length actually delivered\n');
  console.log('length    seed      sessions  years  ended                elections  crises  referendums  treaties  wars  achievements');
  for (const r of rows) {
    const f = r.final;
    console.log(
      r.key.padEnd(10) + r.seed.padEnd(10) +
      String(r.sessions).padEnd(10) +
      String(f.year - 2024).padEnd(7) +
      r.ended.padEnd(21) +
      String(f.elections).padEnd(11) +
      String(f.arcs).padEnd(8) +
      String(f.referendums).padEnd(13) +
      String(f.treaties).padEnd(10) +
      String(f.wars).padEnd(6) +
      f.achievements + '/' + f.achievementsTotal);
  }

  console.log('\nPer session — is the shorter option denser, or just shorter?\n');
  console.log('length    crises/10 sessions  elections/10  events/session  achievements at the close');
  for (const r of rows) {
    const f = r.final, per = n => (n / r.sessions * 10).toFixed(1);
    console.log(
      r.key.padEnd(10) + per(f.arcs).padEnd(20) + per(f.elections).padEnd(14) +
      (f.events / r.sessions).toFixed(1).padEnd(16) +
      Math.round(f.achievements / f.achievementsTotal * 100) + '%');
  }
  console.log('\nThis tool measures. Balance is the user\'s to rule (docs/AGREEMENT.md).');
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
