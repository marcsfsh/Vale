#!/usr/bin/env node
'use strict';
/*
 * Play each length option to its end and report what the player actually gets.
 *
 *   node tools/pacing.js              all three lengths, one seed
 *   node tools/pacing.js short        one length
 *   VALE_SEEDS=A1B2C3D4,5EED1234 node tools/pacing.js
 *   VALE_DIFF=easy node tools/pacing.js       one difficulty tier
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
const DIFF = process.env.VALE_DIFF || '';
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

/* The record the GAME keeps is st.v6.achievements — a latched map written once
   per session by v6AchievementsTick and never re-evaluated (`if
   (v.achievements[a.id]) return;`). The game's own displays read that map: the
   game-over card and the persisted hall entry both count its keys.

   This snapshot used to report something else entirely — it re-ran every test
   against the FINAL state and counted what happened to be true at that instant.
   Twelve of the thirty-nine records are transient conditions (approval above a
   line, a seat share, a credit rating) that bank the first time they flicker
   and are usually false again by the end, so they were invisible; and the
   longer the campaign, the more turns it has to flicker, so the error was
   WORSE for the long options than the short ones. Every figure this tool
   published before that was fixed compared the wrong quantity.

   Both numbers are reported now. `achievements` is the latched truth and
   `achievementsLive` is the old recomputed figure, kept only so the gap between
   them stays visible. Each test gets its OWN try: the single outer catch meant
   one throwing test silently reported zero records for the whole run, which
   would have read as a catastrophic regression rather than as a broken tool. */
const SNAPSHOT = `(function () {
  var st = S, v = st.v6 || {}, lg = st.legacy || {}, sx = (v.stats) || {};
  var v8 = st.v8 || {}, v8s = v8.stats || {}, press = v8.press || {};
  var live = 0, threw = [];
  V6_ACHIEVEMENTS.forEach(function (a) {
    try { if (a.test(st)) live++; } catch (e) { threw.push(a.id); }
  });
  var earned = Object.keys(v.achievements || {}).sort();
  return {
    turn: st.turn, year: yearOf(st.turn), endYear: st.endYear, over: !!st.over,
    elections: lg.electionsWon, yearsGoverning: lg.yearsInGovernment, laws: lg.playerLaws,
    arcs: (v.arcs && v.arcs.count) || 0,
    events: sx.events || 0, treaties: sx.treaties || 0, wars: sx.wars || 0,
    referendums: (sx.referendumsWon || 0) + (sx.referendumsLost || 0),
    coalitions: sx.coalitionsNegotiated || 0, governors: sx.governorsMet || 0,
    achievements: earned.length, achievementIds: earned, achievementsLive: live,
    threw: threw,
    achievementsTotal: (typeof V6_ACHIEVEMENTS !== 'undefined' ? V6_ACHIEVEMENTS.length : 0),
    /* the counters that decide the length-gated records, none of which this
       tool reported before — without them a missed record cannot be told apart
       from a system the harness never touches */
    promisesKept: lg.promisesKept || 0, balanceRun: sx.bestBalanceRun || 0,
    works: v8s.worksDone || 0, questions: v8s.questions || 0,
    streak: press.streak || 0, goalsMet: Object.keys(v8.goals || {}).length,
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
  /* S20d: AND THE DIFFICULTY, which no harness could select until now. The
     audit that opened S20 found that `roads.js` deliberately switches away
     from `easy` and this tool could not choose one at all -- so the tier the
     owner actually plays, and the tier whose six overrides made the chamber a
     formality, was the one nothing measured. `VALE_DIFF=easy node
     tools/pacing.js` reads it. */
  if (DIFF) {
    await page.waitForTimeout(60);
    await page.click('[data-setup-diff="' + DIFF + '"]');
    await page.waitForTimeout(80);
  }
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
  console.log('length    crises/10 sessions  elections/10  events/session  records at the close');
  for (const r of rows) {
    const f = r.final, per = n => (n / r.sessions * 10).toFixed(1);
    console.log(
      r.key.padEnd(10) + per(f.arcs).padEnd(20) + per(f.elections).padEnd(14) +
      (f.events / r.sessions).toFixed(1).padEnd(16) +
      Math.round(f.achievements / f.achievementsTotal * 100) + '%');
  }

  /* THE ROW ABOVE IS ONE SEED, AND THE MEAN IS THE ONLY THING WORTH QUOTING.
     The table prints a row per (length, seed) and for years the figure that
     reached the docs was read off the FIRST three rows, because they are the
     three lengths and they are at the top. That is one seed. S16a already
     ruled on it — "a pacing figure from one seed cannot tell a balance change
     from a reshuffle" — and every S19 slice made the mistake again anyway:
     read one seed, S19c takes crises 1.0/1.0/0.9 to 0.8/0.7/0.7 and S19d
     hands most of it back; read six, the same two builds go 0.83/0.88/0.83 to
     0.90/0.92/0.83 and nothing has moved. So the tool prints the mean itself,
     next to the spread that says whether the mean means anything: when the
     before-and-after gap is inside one build's own seed-to-seed spread, the
     honest report is that the arc did not move. A number a reader has to
     compute by hand is a number the next reader will re-pick by eye. */
  const byLen = new Map();
  for (const r of rows) {
    if (!byLen.has(r.key)) byLen.set(r.key, []);
    byLen.get(r.key).push(r);
  }
  const seeds = new Set(rows.map(r => r.seed)).size;
  console.log('\n  difficulty: ' + (DIFF || 'normal (default)'));
  console.log('\n' + (seeds === 1
    ? 'ONE SEED — NOT QUOTABLE AS AN ARC. Re-run with VALE_SEEDS to compare builds'
    : 'The same table across all ' + seeds + ' seeds — QUOTE THIS ONE, not a row above') + '\n');
  console.log('length    seeds  crises/10 (mean)  spread      elections/10  events/session  records');
  for (const [key, rs] of byLen) {
    const per = (r, n) => n / r.sessions * 10;
    const cr = rs.map(r => per(r, r.final.arcs));
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    console.log(
      key.padEnd(10) + String(rs.length).padEnd(7) +
      mean(cr).toFixed(2).padEnd(18) +
      (Math.min(...cr).toFixed(1) + '–' + Math.max(...cr).toFixed(1)).padEnd(12) +
      mean(rs.map(r => per(r, r.final.elections))).toFixed(2).padEnd(14) +
      mean(rs.map(r => r.final.events / r.sessions)).toFixed(2).padEnd(16) +
      mean(rs.map(r => r.final.achievements / r.final.achievementsTotal * 100)).toFixed(1) + '%');
  }
  console.log(seeds > 1
    ? '\n  A before/after gap smaller than one build\'s own spread is a reshuffle,\n' +
      '  not a balance change. Say so rather than quoting the difference.'
    : '\n  VALE_SEEDS is unset, so this is the default single seed and the spread\n' +
      '  column is empty by construction. One seed cannot tell a balance change\n' +
      '  from a reshuffle (S16a), and on the six S19 ran, crises per ten sessions\n' +
      '  span 0.60 to 1.20 on ONE build. Before quoting an arc:\n' +
      '    VALE_SEEDS=5EED1234,A11CE,B0B,C4T,D0G,E1F node tools/pacing.js');

  /* The counters behind the length-gated records. A record that short misses
     because a counter never moved is a different problem from one it misses
     because the threshold is too high, and only these numbers tell them apart:
     the harness never calls a referendum or signs a treaty at any length, so a
     zero here means "system untouched", not "target too far". */
  console.log('\nThe counters the record is gated on\n');
  console.log('length    seed      laws  yrs-gov  promises  best-run  works  questions  streak  goals-met');
  for (const r of rows) {
    const f = r.final;
    console.log(
      r.key.padEnd(10) + r.seed.padEnd(10) +
      String(f.laws).padEnd(6) + String(f.yearsGoverning).padEnd(9) +
      String(f.promisesKept).padEnd(10) + String(f.balanceRun).padEnd(10) +
      String(f.works).padEnd(7) + String(f.questions).padEnd(11) +
      String(f.streak).padEnd(8) + f.goalsMet);
  }

  /* Which records, not how many. The point of the whole exercise: a length that
     misses a record can now be told from a length that misses a DIFFERENT one. */
  console.log('\nRecords actually earned (the latched map the game itself counts)\n');
  for (const r of rows) {
    const f = r.final;
    console.log('  ' + (r.key + ' ' + r.seed).padEnd(20) +
      (f.achievementIds.length ? f.achievementIds.join(' ') : '(none)'));
    if (f.achievementsLive !== f.achievements) {
      console.log('  ' + ''.padEnd(20) + 'recomputed-at-the-end would have said ' +
        f.achievementsLive + ', which is the bug this tool used to report');
    }
    if (f.threw && f.threw.length) {
      console.log('  ' + ''.padEnd(20) + 'TESTS THREW: ' + f.threw.join(', ') +
        ' — in game these fail silently and the record becomes unearnable');
    }
  }

  const union = new Set();
  rows.forEach(r => r.final.achievementIds.forEach(id => union.add(id)));
  console.log('\n  never earned in any run: ' + (rows[0].final.achievementsTotal - union.size) +
    ' of ' + rows[0].final.achievementsTotal +
    ' — the harness plays first-choice-always and loses government early, so this' +
    '\n  is a floor on what the game offers, not a measure of what a player reaches');
  /* The trajectory, not just the total: a figure that is identical at 50 and
     200 sessions has stopped moving, and it matters a great deal whether it
     stopped because the game stops awarding it or because this harness — which
     always takes the first choice on offer — lost the government early and
     never got it back. */
  console.log('\nTrajectory (every 20 sessions): year / elections won / years governing / crises / achievements\n');
  for (const r of rows) {
    const line = r.marks.filter((m, i) => i % 4 === 0).map(m =>
      m.year + ':' + m.elections + '/' + m.yearsGoverning + '/' + m.arcs + '/' + m.achievements).join('   ');
    console.log('  ' + (r.key + ' ' + r.seed).padEnd(20) + line);
  }
  console.log('\nThis tool measures. Balance is the user\'s to rule (docs/AGREEMENT.md).');
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
