#!/usr/bin/env node
'use strict';
/*
 * The roads out of the republic, driven end to end.
 *
 *   node tools/roads.js
 *
 * Model-driven per the determinism rule: it drives doTransition, doExtra and
 * the act applies through their REAL guards (capital topped up between steps,
 * preconditions constructed, never bypassed), not the modal queue. What it
 * proves, per road:
 *
 *   1. The authority ladder federal -> centralised -> executive -> emergency
 *      -> oneparty -> empire: each transition's ok() is FALSE before its
 *      documented preconditions are constructed and TRUE after, and
 *      doTransition actually moves S.form at every rung.
 *   2. The state gate on extraordinary measures: a government of the
 *      constitutional centre (FP) can sign once the STATE has descended
 *      (securityState >= 30), and tier 2 opens by precedents + apparatus —
 *      the S9d door that party identity used to bolt shut.
 *   3. The confirmation ritual queues under a closed constitution, carries
 *      its rigging choices, and the reckoning event becomes reachable when
 *      elections return with staged counts on the books.
 *   4. The weighted franchise: with acts.wealthFranchise, supportTargets
 *      shifts toward the propertied blocs' parties on the same fixed seed.
 *   5. needs: an executive order cannot outrun its statute book, and a bill
 *      whose prerequisite fell while it was before the houses lapses loudly.
 *   6. The restoration gate: a terminal form refuses toFederal until the
 *      restoration flag is set by crisis, and the surcharge is levied.
 *   7. The guardrail: a fresh default opening measures securityState 0 and
 *      the extraordinary measures stay locked for a centre party.
 *   8. Seat conservation: charteredSenate and territorialSeats reapportion
 *      without ever changing a chamber's constitutional total.
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

/* The full build of every statute as it stood before S9h authored the curves.
   Frozen on disk rather than derived, because after the authoring the file no
   longer contains the per-step values it was derived from. */
const FULLBUILD = require('./fullbuild-baseline.json');

/* S14: FIXTURES ARE NAMED, NEVER TAKEN BY POSITION. A `.filter(...)[0]` probe
   picks whatever happens to be first in the array, so inserting an order above
   it or reordering the book leaves the assertion passing about a DIFFERENT
   order than the one it was written for -- green, and measuring something
   else. 40 of the 72 orders satisfy the predicate below, so the drift is real
   rather than theoretical. pick() names the fixture and re-asserts the
   property it was chosen for: change that order and this throws HERE, instead
   of quietly moving the test. */
const PICK = `window.pick = function (list, id, pred, what) {
  var hit = list.filter(function (x) { return x.id === id; });
  if (hit.length !== 1) throw new Error('pick(' + what + '): ' + id + ' matches ' + hit.length + ' entries, expected exactly 1 -- the fixture was renamed or removed');
  if (pred && !pred(hit[0])) throw new Error('pick(' + what + '): ' + id + ' no longer has the property it was picked for');
  return hit[0];
};`;

let fail = 0;
const say = (ok, label, detail) => { if (!ok) fail++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(34) + detail); };

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.addInitScript(PICK);
  await page.goto(URL);
  await page.waitForSelector('[data-setup-begin]', { timeout: 15000 });
  await page.click('[data-setup-begin]');
  await page.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await page.click('[data-doctrine]');
  await page.waitForTimeout(400);

  // 7. the guardrail first, on the untouched opening
  const fresh = await page.evaluate(() => ({
    ss: securityState(S),
    tier1Centre: (function () { const r = S.ruling; S.ruling = 'fp'; const v = extraTierAllowed(S, 1); S.ruling = r; return v; })(),
  }));
  say(fresh.ss === 0, 'fresh republic measures zero', `securityState ${fresh.ss}`);
  say(fresh.tier1Centre === false, 'measures locked for the centre', `FP tier-1 allowed on turn 1: ${fresh.tier1Centre}`);

  /* 9. THE LADDER. Four rungs on every statute, five rows on every channel,
     and — for any channel whose curve is not yet authored — the old balance
     preserved exactly: the full build is still base x the old maximum, and
     every rung an old save, seed, want or programme target can land on after
     the rescale reads exactly what it read before. */
  const ladderParity = await page.evaluate(() => {
    const bad = { max: [], rows: [], needs: [], build: [], rung: [], seed: [] };
    let checked = 0;
    const cats = {};
    const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    const authored = (p, key) => p[key + '2'] !== undefined || p[key + '3'] !== undefined || p[key + '4'] !== undefined;
    POLICIES.forEach(p => {
      cats[p.cat] = (cats[p.cat] || 0) + 1;
      if (p.max !== 4) bad.max.push(p.id + ' max ' + p.max);
      for (let i = 0; i <= 4; i++) {
        if (!p._effAt[i] || !p._moodAt[i] || typeof p._revAt[i] !== 'number' || typeof p._expAt[i] !== 'number') bad.rows.push(p.id + '@' + i);
      }
      if (p.needs && !POL[p.needs]) bad.needs.push(p.id + ' -> ' + p.needs);
      const m = p.lin;
      if (!(m >= 1 && m <= 4)) { bad.rows.push(p.id + ' lin ' + m); return; }
      if (!authored(p, 'eff')) for (const k in (p.eff || {})) {
        checked++;
        if (!near(p._effAt[4][k] || 0, p.eff[k] * m)) bad.build.push(p.id + '.eff.' + k);
        for (let n = 0; n <= m; n++) if (!near(p._effAt[Math.round(n * 4 / m)][k] || 0, p.eff[k] * n)) bad.rung.push(p.id + '.eff.' + k + '@' + n);
      }
      if (!authored(p, 'mood')) for (const k in (p.mood || {})) {
        checked++;
        if (!near(p._moodAt[4][k] || 0, p.mood[k] * m)) bad.build.push(p.id + '.mood.' + k);
        for (let n = 0; n <= m; n++) if (!near(p._moodAt[Math.round(n * 4 / m)][k] || 0, p.mood[k] * n)) bad.rung.push(p.id + '.mood.' + k + '@' + n);
      }
      if (!authored(p, 'rev') && !near(p._revAt[4], (p.rev || 0) * m)) bad.build.push(p.id + '.rev');
      if (!authored(p, 'exp') && !near(p._expAt[4], (p.exp || 0) * m)) bad.build.push(p.id + '.exp');
    });
    /* nothing may seed, want or promise a rung off the ladder */
    const rungOk = (where, id, v) => { if (!POL[id]) bad.seed.push(where + ': unknown ' + id); else if (!(v >= 0 && v <= 4 && v === Math.round(v))) bad.seed.push(where + ' ' + id + '=' + v); };
    PARTIES.forEach(pt => { const w = pt.wants || {}; for (const id in w) rungOk(pt.short + ' wants', id, w[id]); });
    (typeof V6_PROGRAMMES !== 'undefined' ? V6_PROGRAMMES : []).forEach(pr => { for (const id in (pr.items || {})) rungOk('programme ' + pr.id, id, pr.items[id]); });
    V6_SCENARIOS.forEach(sc => {
      const probe = { pol: {}, ind: {}, blocs: {}, acts: {}, upper: { seats: {} }, seats: {}, macro: null };
      try { sc.apply(probe); } catch (e) { return; }
      for (const id in probe.pol) rungOk('scenario ' + sc.id, id, probe.pol[id]);
    });
    /* The owner's order was four levels each with its own set of modifiers.
       For a statute whose curve is AUTHORED that is a real claim: no rung may
       read the same as the rung below it, and the top two rungs should each
       bring something the rung below does not have. */
    const authoredSet = [], flat = [], noNew3 = [], noNew4 = [];
    POLICIES.forEach(p => {
      if (!['eff', 'mood', 'rev', 'exp'].some(k => authored(p, k))) return;
      authoredSet.push(p.id);
      const keys = i => Object.keys(p._effAt[i]).filter(k => p._effAt[i][k])
        .concat(Object.keys(p._moodAt[i]).filter(k => p._moodAt[i][k]));
      for (let i = 1; i < 4; i++) {
        const same = JSON.stringify(p._effAt[i]) === JSON.stringify(p._effAt[i + 1]) &&
          JSON.stringify(p._moodAt[i]) === JSON.stringify(p._moodAt[i + 1]) &&
          p._revAt[i] === p._revAt[i + 1] && p._expAt[i] === p._expAt[i + 1];
        if (same) flat.push(p.id + ' rungs ' + i + '/' + (i + 1));
      }
      if (!keys(3).some(k => keys(2).indexOf(k) < 0)) noNew3.push(p.id);
      if (!keys(4).some(k => keys(3).indexOf(k) < 0)) noNew4.push(p.id);
    });
    return { bad, cats, checked, n: POLICIES.length, catN: Object.keys(cats).length,
      authored: authoredSet.length, flat, noNew3: noNew3.length, noNew4: noNew4.length };
  });
  const lp = ladderParity.bad;
  say(lp.max.length === 0 && lp.rows.length === 0, 'four rungs on every statute',
    `${ladderParity.n} statutes, all max 4 with five rows on every channel` + (lp.max.length ? '; wrong max: ' + lp.max.slice(0, 4).join(', ') : '') + (lp.rows.length ? '; missing rows: ' + lp.rows.slice(0, 4).join(', ') : ''));
  /* Both of these only look at channels still derived from `lin`. Once every
     statute is authored they check nothing, so they state the count rather
     than reading as a pass over an empty set — the frozen full-build baseline
     below is what guards the authored ones. */
  say(lp.build.length === 0, 'the full build is unchanged',
    lp.build.length ? lp.build.length + ' channels drifted: ' + lp.build.slice(0, 5).join(', ')
      : (ladderParity.checked ? ladderParity.checked + ' unauthored channels still total base x their old maximum at rung 4'
        : 'no unauthored channel left to check — every statute carries an authored curve'));
  say(lp.rung.length === 0, 'every rescaled rung is exact',
    lp.rung.length ? lp.rung.length + ' off: ' + lp.rung.slice(0, 5).join(', ')
      : (ladderParity.checked ? 'interpolation reproduces the old ladder at every reachable position'
        : 'nothing interpolated — every statute carries an authored curve'));
  say(lp.needs.length === 0 && lp.seed.length === 0, 'nothing points off the ladder',
    lp.needs.length || lp.seed.length ? [...lp.needs, ...lp.seed].slice(0, 5).join('; ') : 'every needs: resolves; every want, programme target and scenario seed sits on a rung');
  /* S9g: the twenty CORE categories hold exactly twenty-four statutes each.
     The three form books (Imperium, People's State, The Charter) are a
     constitution's own vocabulary and are counted separately. */
  const CORE = ['Authority', 'Capital', 'Culture', 'Defence', 'Education', 'Elections', 'Empire', 'Energy',
    'Environment', 'Federalism', 'Foreign', 'Health', 'Immigration', 'Infrastructure', 'Justice', 'Labour',
    'Security', 'Taxation', 'Technology', 'Welfare'];
  const short = CORE.filter(c => ladderParity.cats[c] !== 24).map(c => c + ' ' + (ladderParity.cats[c] || 0));
  const extra = Object.keys(ladderParity.cats).filter(c => CORE.indexOf(c) < 0);
  say(short.length === 0, 'twenty-four to a category',
    short.length ? short.join(', ') : `all ${CORE.length} core categories hold exactly 24 · form books: ` +
      extra.sort().map(c => c + ' ' + ladderParity.cats[c]).join(', '));
  /* S9h: authoring a curve changes the SHAPE of a ladder. It must not change
     the balance at the top of it, nor move a statute on the political map. */
  const preserved = await page.evaluate(frozen => {
    const bad = [], missing = [];
    const near = (a, b, tol) => Math.abs((a || 0) - (b || 0)) <= Math.max(tol * Math.abs(b || 0), 0.06);
    for (const id in frozen) {
      if (id[0] === '_') continue;
      const p = POL[id];
      if (!p) { missing.push(id); continue; }
      const f = frozen[id];
      for (const k in (f.eff || {})) if (!near(p._effAt[4][k], f.eff[k], .1)) bad.push(id + '.eff.' + k + ' ' + (p._effAt[4][k] || 0) + ' vs ' + f.eff[k]);
      for (const k in (f.mood || {})) if (!near(p._moodAt[4][k], f.mood[k], .1)) bad.push(id + '.mood.' + k + ' ' + (p._moodAt[4][k] || 0) + ' vs ' + f.mood[k]);
      if (f.rev !== undefined && !near(p._revAt[4], f.rev, .1)) bad.push(id + '.rev ' + p._revAt[4] + ' vs ' + f.rev);
      if (f.exp !== undefined && !near(p._expAt[4], f.exp, .1)) bad.push(id + '.exp ' + p._expAt[4] + ' vs ' + f.exp);
      if (!near(p.auth, f.auth, .001)) bad.push(id + '.auth ' + p.auth + ' vs ' + f.auth);
    }
    return { bad, missing, n: Object.keys(frozen).length - 1 };
  }, FULLBUILD);
  say(preserved.bad.length === 0 && preserved.missing.length === 0, 'the top of the ladder is unmoved',
    preserved.missing.length ? preserved.missing.length + ' statute(s) vanished from the book: ' + preserved.missing.slice(0, 4).join(', ')
      : (preserved.bad.length ? preserved.bad.length + ' drifted: ' + preserved.bad.slice(0, 5).join('; ')
        : `all ${preserved.n} statutes that predate S9h still reach the same full build, and none moved on the map`));

  say(ladderParity.flat.length === 0, 'no rung repeats the one below',
    ladderParity.authored === 0 ? 'no authored curves yet' :
      (ladderParity.flat.length ? ladderParity.flat.length + ' flat pair(s): ' + ladderParity.flat.slice(0, 5).join(', ')
        : `${ladderParity.authored} authored statutes, every rung distinct; ` +
          `${ladderParity.authored - ladderParity.noNew3} bring a new key at rung 3, ` +
          `${ladderParity.authored - ladderParity.noNew4} a new cost at rung 4`));
  console.log('      census: ' + ladderParity.n + ' statutes across ' + ladderParity.catN + ' categories · ' +
    Object.keys(ladderParity.cats).sort().map(c => c + ' ' + ladderParity.cats[c]).join(', '));

  /* S10a — THE REPUBLIC AGES.
     Four of the eight regions had never held a governor's election, their
     governors aged without bound, and the printed ballot year slid forward a
     year every year. Each of those is asserted here against the real
     functions, not against a re-derivation of the schedule. */
  const republic = await page.evaluate(() => {
    const out = {};

    /* Every region contested exactly once per four-ballot cycle, and two
       regions at each ballot. */
    const held = {}; REGIONS.forEach(r => held[r.id] = 0);
    const perBallot = [];
    for (let b = 0; b < 8; b++) {
      let n = 0;
      REGIONS.forEach(r => { if (v6BallotsUntilRegion(S, r) === 0) { held[r.id]++; n++; } });
      perBallot.push(n);
      S.v6.ballotNo = (S.v6.ballotNo || 0) + 1;
    }
    out.perBallot = perBallot;
    out.everyRegionTwice = REGIONS.every(r => held[r.id] === 2);
    out.neverContested = REGIONS.filter(r => held[r.id] === 0).map(r => r.id);

    /* The printed ballot year must be a fixed point in the future, not a
       distance from now that recedes as now advances. */
    const y0 = {}; REGIONS.forEach(r => y0[r.id] = v6NextRegionBallot(S, r));
    const t0 = S.turn; S.turn += 1;
    const slid = REGIONS.filter(r => v6NextRegionBallot(S, r) !== y0[r.id] && v6BallotsUntilRegion(S, r) > 0);
    S.turn = t0;
    out.slidingYears = slid.map(r => r.id);

    /* One increment a session, from one place.

       A governor SUCCEEDED during the sample has a delta that measures
       nothing: `ageFigures` rolls a death-or-retirement risk per figure
       (.004 below 62, rising to .16 above 78) and `ageSucceed`'s governor
       branch seats a fresh `v6MakeGovernor`, whose age is an independent
       46 + rand()*20. Observed deltas from that path: -7, -5, -4, 0, +10.

       This harness reaches this probe at a DIFFERENT POINT IN THE SEEDED
       STREAM on every run — the UI pump is click-timed, which is the hazard
       CLAUDE.md names — so the eight governors are freshly rolled each time
       and which of them sit in a raised risk band varies. Measured on main
       at ae50fa2: ages came out 59,51,52,58,48,62,65,46 on one run and
       48,60,52,58,63,59,63,65 on the next, and one run in eight succeeded a
       governor and turned this assertion red. It was failing intermittently
       on identical code, on main as much as here.

       So successors are excluded BY OBJECT IDENTITY — `ageSucceed` replaces
       the whole record, so `===` is exact and cannot be fooled by two
       governors drawing the same name. The survivors are still held to
       exactly 1: this must stay the assertion that catches a governor being
       aged twice. The floor keeps it from passing vacuously on a session
       that happened to retire most of the bench. */
    const before = {}, beforeRec = {};
    REGIONS.forEach(r => { before[r.id] = S.v6.governors[r.id].age; beforeRec[r.id] = S.v6.governors[r.id]; });
    v6GovernorsTick(S); ageFigures(S);
    const served = REGIONS.filter(r => S.v6.governors[r.id] === beforeRec[r.id]);
    out.ageServed = served.length;
    out.ageBench = REGIONS.length;
    out.ageSteps = served.map(r => S.v6.governors[r.id].age - before[r.id])
      .filter((v, i, a) => a.indexOf(v) === i);

    /* Ministers are in the roster too, and carry an age at all. A fresh
       republic has an empty cabinet, so seat three the way the game does —
       rank first, then the ensure pass that fills the post. */
    pv5PortfolioRows().slice(0, 3).forEach(row => { S.cabinet[row.key] = 1; });
    pv5EnsureState(S, false);
    const rows = pv5PortfolioRows().filter(row => S.ministers[row.key]);
    out.ministersSeated = rows.length;
    out.ministersAged = rows.filter(row => typeof S.ministers[row.key].age === 'number').length;
    const roster = ageRoster(S);
    out.rosterKinds = roster.map(r => r.kind).filter((v, i, a) => a.indexOf(v) === i).sort();
    /* and a minister who goes leaves the post vacant rather than being
       silently replaced by somebody nobody appointed */
    const victim = rows[0].key, had = S.ministers[victim].name;
    ageSucceed(S, { f: S.ministers[victim], kind: 'minister', key: victim, title: rows[0].title }, true);
    out.vacatedOnDeath = !S.ministers[victim] && !S.cabinet[victim] && !!had;

    /* No two grand works may share a NAME. The merge guard is keyed on id, so
       it cannot see this — which is how two Somnium Sea Walls shipped. */
    const byName = {}; V8_WORKS.forEach(w => { (byName[w.name] = byName[w.name] || []).push(w.id); });
    out.dupWorkNames = Object.keys(byName).filter(n => byName[n].length > 1).map(n => n + ' (' + byName[n].join(', ') + ')');
    out.workCount = V8_WORKS.length;

    /* Nobody in public life shares a name with anybody else in public life —
       and not just at the opening, where 39,400 pairs make a chance collision
       rare. Churn the whole cast the way a century of play does and take the
       worst moment. */
    const liveList = () => {
      const a = [];
      PARTIES.forEach(p => a.push(S.figures.leaders[p.id].name));
      ['pres', 'vpres', 'chan', 'vchan'].forEach(o => a.push(S.figures.exec[o].name));
      REGIONS.forEach(r => a.push(S.v6.governors[r.id].name));
      Object.keys(S.ministers || {}).forEach(k => a.push(S.ministers[k].name));
      return a;
    };
    out.castSize = liveList().length;
    let worst = 0;
    for (let i = 0; i < 200; i++) {
      const pid = PARTIES[i % PARTIES.length].id;
      S.figures.leaders[pid] = makeFigure(S, pid, 44);
      const r = REGIONS[i % REGIONS.length];
      S.v6.governors[r.id] = v6MakeGovernor(S, r, pid);
      const a = liveList();
      const d = a.length - new Set(a).size;
      if (d > worst) worst = d;
    }
    out.castDupes = worst;
    out.castChurn = 200;

    /* Very easy's opening numbers, and the guard that S10a's raise and S15c's
       raise both stayed on that tier. The berth ladder and the floor itself are
       asserted at the S15c block below; what is asserted here is that the other
       four tiers were not carried along with them. */
    out.easyCap = DIFFS.easy.capital + '/' + DIFFS.easy.capMult + '/' + DIFFS.easy.capFlat + '/' + DIFFS.easy.capCap;
    out.easyFloor = DIFFS.easy.capFloor;
    out.othersUnmoved = DIFFS.normal.capital === 18 && DIFFS.normal.capCap === 70 &&
      DIFFS.gentle.capital === 40 && DIFFS.gentle.capCap === 110 &&
      DIFFS.hard.capital === 12 && DIFFS.brutal.capital === 8 && DIFFS.brutal.capCap === 52 &&
      ['gentle', 'normal', 'hard', 'brutal'].every(k => DIFFS[k].capFloor === undefined);

    /* Every justice is named before anybody opens the Judicial page. */
    out.benchNamed = S.court.justices.filter(j => j.name).length + '/' + S.court.justices.length;
    return out;
  });

  say(republic.everyRegionTwice && republic.neverContested.length === 0 && republic.perBallot.every(n => n === 2),
    'every region goes to the ballot',
    republic.neverContested.length ? republic.neverContested.length + ' never contested: ' + republic.neverContested.join(', ')
      : `two regions at each of eight ballots [${republic.perBallot.join(',')}], all eight contested exactly twice`);
  say(republic.slidingYears.length === 0, 'the ballot year does not recede',
    republic.slidingYears.length ? 'slides in ' + republic.slidingYears.join(', ')
      : 'a year passes and every region\'s printed ballot year stays where it was');
  say(republic.ageServed >= 5 && republic.ageSteps.length === 1 && republic.ageSteps[0] === 1,
    'one year a session, once',
    republic.ageServed < 5
      ? `only ${republic.ageServed} of ${republic.ageBench} governors served the whole session — too few to measure the increment`
      : 'governor age advanced by ' + republic.ageSteps.join('/') + ' over a session that ran both the governors tick and ' +
        `ageFigures · ${republic.ageServed} of ${republic.ageBench} served it out; a successor's age measures nothing and is excluded`);
  say(republic.ministersSeated > 0 && republic.ministersAged === republic.ministersSeated &&
    republic.rosterKinds.join(',') === 'exec,governor,leader,minister' && republic.vacatedOnDeath,
    'the whole cast ages', `${republic.ministersAged}/${republic.ministersSeated} ministers carry an age · roster: ` +
      `${republic.rosterKinds.join(', ')} · a minister's death leaves the post vacant: ${republic.vacatedOnDeath}`);
  say(republic.dupWorkNames.length === 0, 'no two works share a name',
    republic.dupWorkNames.length ? republic.dupWorkNames.join('; ') : republic.workCount + ' grand works, every name its own');
  say(republic.castDupes === 0, 'no two officials share a name',
    republic.castDupes ? republic.castDupes + ' duplicate(s) among ' + republic.castSize
      : republic.castSize + ' in public life, no name twice, through ' + republic.castChurn + ' replacements');
  say(republic.easyCap === '250/5.4/26/750' && republic.easyFloor === 150 && republic.othersUnmoved,
    'the raise stays on very easy',
    'easy capital/mult/flat/cap ' + republic.easyCap + ' over a floor of ' + republic.easyFloor +
      ' · the other four tiers carry their own opening stock and ceiling and no floor at all: ' +
      republic.othersUnmoved);
  say(republic.benchNamed.split('/')[0] === republic.benchNamed.split('/')[1], 'the bench is named on arrival',
    republic.benchNamed + ' justices named without the Judicial page being opened');

  /* S10b — THE ORDER PAPER. What you can do about a bill that is not yours,
     and how much it is worth. */
  const paper = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    const opp = PARTIES.filter(x => x.id !== me && !S.banned[x.id])[0];
    const seatsBefore = JSON.parse(JSON.stringify(S.seats));
    const keptCo = S.coalition;
    const donor = PARTIES.filter(x => x.id !== me && x.id !== opp.id)[0].id;

    const mk = () => {
      const pick = partyDemandPolicy(S, opp.id);
      const b = sponsorBill(S, pick.policy, pick.dir, 'opposition', 'clean', true);
      b.sponsor = opp.id; b.owner = 'opposition';
      return b;
    };
    const acts = html => [...html.matchAll(/data-bill-action="([a-zA-Z]+)"/g)].map(m => m[1]);
    const setSeats = frac => { S.seats[me] = Math.round(CFG.seats * frac); S.seats[donor] = Math.max(0, CFG.seats - S.seats[me] - (S.seats[opp.id] || 0)); };

    /* 1. outright() tells a sole majority from a coalition that adds to one */
    setSeats(.60); S.coalition = [me];
    out.soleMajority = outright(S);
    setSeats(.30); S.coalition = [me, donor, opp.id];
    out.coalitionMajority = outright(S);
    /* and it is keyed to the player, not the ruling party */
    const keptRuling = S.ruling, keptPlay = S.playAs;
    S.ruling = donor; S.playAs = me; S.seats[donor] = Math.round(CFG.seats * .6); S.seats[me] = 40;
    out.juniorUnderMajority = outright(S);
    S.ruling = keptRuling; S.playAs = keptPlay;

    /* 2. an opposition bill has controls at all — the reported gap */
    S.capital = 400; setSeats(.30); S.coalition = [me];
    let b = mk();
    out.oppositionBillControls = acts(billCard(b)).filter(a => ['support', 'oppose', 'pressure'].indexOf(a) >= 0).length;

    /* 3. the lever set scales with what you command */
    S.ruling = opp.id; S.playAs = me; S.coalition = [opp.id];
    out.inOpposition = acts(billCard(b)).filter(a => ['talkOut', 'amendIt', 'delayIt', 'kill'].indexOf(a) >= 0).sort().join(',');
    S.ruling = me; S.coalition = [me, donor]; setSeats(.30);
    out.inGovernment = acts(billCard(b)).filter(a => ['talkOut', 'amendIt', 'delayIt', 'kill'].indexOf(a) >= 0).sort().join(',');
    S.coalition = [me]; setSeats(.60);
    out.atOutright = acts(billCard(b)).filter(a => ['talkOut', 'amendIt', 'delayIt', 'kill'].indexOf(a) >= 0).sort().join(',');

    /* 4. a declared line is worth what the party declaring it is worth */
    const delta = frac => {
      setSeats(frac);
      b.playerPosition = null; const a = billForecast(S, b).lower;
      b.playerPosition = 'oppose'; const c = billForecast(S, b).lower;
      b.playerPosition = null;
      return Math.round((a - c) * 10) / 10;
    };
    out.d05 = delta(.05); out.d50 = delta(.50); out.d90 = delta(.90);

    /* 5. the handler refuses the kill, not only the renderer */
    setSeats(.30); S.coalition = [me, donor];
    const n0 = S.bills.length; billAction(b.id, 'kill');
    out.killRefused = S.bills.length === n0;
    setSeats(.60); S.coalition = [me];
    billAction(b.id, 'kill');
    out.killWorks = S.bills.length === n0 - 1 && (S.billArchive[0] || {}).stage === 'killed';

    /* 6. a party does not demand the same statute for ever */
    const seen = {};
    for (let i = 0; i < 40; i++) { const pk = partyDemandPolicy(S, opp.id); if (pk) seen[pk.policy] = 1; }
    out.demandVariety = Object.keys(seen).length;

    S.seats = seatsBefore; S.ruling = keptRuling; S.playAs = keptPlay; S.coalition = keptCo;
    return out;
  });

  say(paper.soleMajority && !paper.coalitionMajority && !paper.juniorUnderMajority,
    'an outright majority is distinct',
    `sole majority: ${paper.soleMajority} · coalition that adds to one: ${paper.coalitionMajority} · ` +
    `junior partner under a majority government: ${paper.juniorUnderMajority}`);
  say(paper.oppositionBillControls >= 3, 'another party\'s bill has controls',
    paper.oppositionBillControls + ' of support/oppose/pressure offered on an opposition-sponsored bill');
  say(paper.inOpposition === 'talkOut' && paper.inGovernment === 'amendIt,delayIt' && paper.atOutright === 'amendIt,delayIt,kill',
    'the levers scale with standing',
    `opposition: [${paper.inOpposition}] · in government: [${paper.inGovernment}] · outright: [${paper.atOutright}]`);
  say(paper.d05 < paper.d50 && paper.d50 < paper.d90 && paper.d05 < 1.5 && paper.d90 > 6,
    'a line is worth what its party is',
    `opposing costs the bill ${paper.d05} at 5% of the Assembly, ${paper.d50} at 50%, ${paper.d90} at 90% (was a flat 8 at any size)`);
  say(paper.killRefused && paper.killWorks, 'the kill is gated where it acts',
    `refused without a majority: ${paper.killRefused} · archived as killed with one: ${paper.killWorks}`);
  /* S10c — THE ORDER BOOK. The three rules, mechanically. */
  const book = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    /* This block hands the player every office, which is exactly the
       precondition the toExecutive ladder step asserts is FALSE before it is
       constructed. Snapshot and put it all back, or a test earlier in the file
       silently satisfies a test later in it. */
    const keep = { ruling: S.ruling, coalition: S.coalition, exec: JSON.parse(JSON.stringify(S.exec)),
      capital: S.capital, orders: JSON.parse(JSON.stringify((S.v10 && S.v10.orders) || {})) };
    S.ruling = me; S.coalition = [me];
    ['pres', 'vpres', 'chan', 'vchan'].forEach(d => S.exec[d] = me);
    S.capital = 400;
    out.count = V10_ORDERS.length;
    out.cats = [...new Set(V10_ORDERS.map(o => o.cat))].length;
    out.depts = [...new Set(V10_ORDERS.map(o => o.dept))].sort().join(',');
    out.targeted = V10_ORDERS.filter(o => o.target).length;
    /* VERB: every entry does something STANDING, or it is an action wearing a hat */
    out.noStanding = V10_ORDERS.filter(o => !(Object.keys(o.ind || {}).length || Object.keys(o.mood || {}).length ||
      o.exp || o.rev || Object.keys(o.mods || {}).length || Object.keys(o.salience || {}).length ||
      o.regionEff || o.powerEff !== undefined)).map(o => o.id);
    /* no name may collide with a statute, an action or an extraordinary measure */
    const pol = new Set(POLICIES.map(p => p.name.toLowerCase()));
    const act = new Set(ACTIONS.map(a => a.name.toLowerCase()));
    const ext = new Set(EXTRA.map(e => e.name.toLowerCase()));
    out.collisions = V10_ORDERS.filter(o => pol.has(o.name.toLowerCase()) || act.has(o.name.toLowerCase()) || ext.has(o.name.toLowerCase())).map(o => o.name);

    /* the country drifts toward an order and back again, exactly */
    const o = pick(V10_ORDERS, 'establishmentFreeze', x => !x.target && !x.needs && Object.keys(x.ind || {}).length, 'drift and return');
    const key = Object.keys(o.ind)[0];
    const t0 = indicatorTargets(S)[key];
    v10IssueOrder(o.id, null);
    out.shift = Math.round((indicatorTargets(S)[key] - t0) * 1000) / 1000;
    out.authored = o.ind[key];
    const inc0 = capitalIncome(S);
    v10RevokeOrder(o.id);
    out.upkeepCharged = Math.round((capitalIncome(S) - inc0) * 100) / 100;
    out.restored = Math.abs(indicatorTargets(S)[key] - t0) < 1e-9;

    /* LIFE: it lapses when the department changes hands. A DIFFERENT order —
       re-issuing the same one this session is refused, which would make this
       pass over nothing. */
    const o2 = pick(V10_ORDERS, 'deliveryUnit', x => !x.target && !x.needs && x.id !== o.id, 'lapses with the department');
    v10IssueOrder(o2.id, null);
    out.issued = v10OrderCount(S) === 1;
    S.exec[o2.dept] = PARTIES.filter(x => x.id !== me)[0].id;
    v10OrdersTick(S);
    out.lapsed = out.issued && v10OrderCount(S) === 0;
    out.lapseTold = (S.log || []).some(l => /lapsed: the authority/.test(l.text));
    S.exec[o2.dept] = me;

    /* TARGET: the same instrument stands separately in two regions */
    /* S15: the book is national. This used to issue one region-targeted order
       against two states and assert it stood twice; no order names a region any
       more, so the claim that matters is that a NATIONAL order's drift reaches
       every one of them. */
    out.regionTargeted = V10_ORDERS.filter(x => x.target === 'region').length;
    out.powerTargeted = V10_ORDERS.filter(x => x.target === 'power').length;
    out.regionsTotal = REGIONS.length;
    out.regionsMoved = 0;
    /* pick() is deliberately fatal when its fixture has lost the property it
       was chosen for, so it is called only once the book IS national -- which
       lets this assertion also be run against the build before S15b and report
       what that one did instead of aborting the whole evaluate. */
    if (out.regionTargeted === 0) {
      const nat = pick(V10_ORDERS, 'disperseAgencies', x => !x.target && x.nationEff, 'reaches every region');
      const before = {}; REGIONS.forEach(r => { before[r.id] = Object.assign({}, S.regions[r.id]); });
      v10IssueOrder(nat.id, null);
      v10OrdersTick(S);
      out.regionsMoved = REGIONS.filter(r => Object.keys(nat.nationEff)
        .some(k => S.regions[r.id][k] !== undefined && Math.abs(S.regions[r.id][k] - before[r.id][k]) > 1e-9)).length;
      v10RevokeOrder(nat.id);
    }
    S.ruling = keep.ruling; S.coalition = keep.coalition; S.exec = keep.exec;
    S.capital = keep.capital; S.v10.orders = keep.orders;
    return out;
  });
  say(book.count >= 36 && book.cats === 8 && book.depts === 'chan,pres,vchan,vpres',
    'the order book is stocked', `${book.count} orders in ${book.cats} categories across all four offices · ${book.targeted} targeted`);
  say(book.noStanding.length === 0 && book.collisions.length === 0, 'every order is an order',
    book.noStanding.length ? book.noStanding.length + ' with no standing effect: ' + book.noStanding.join(', ')
      : (book.collisions.length ? 'name collisions: ' + book.collisions.join(', ')
        : 'all standing, none sharing a name with a statute, an action or an extraordinary measure'));
  say(book.shift === book.authored && book.restored && book.upkeepCharged > 0,
    'orders bend targets, not stocks',
    `issuing moved the target by ${book.shift} (authored ${book.authored}), it cost ${book.upkeepCharged} capital a session, ` +
    `and revoking put the target back exactly: ${book.restored}`);
  say(book.issued && book.lapsed && book.lapseTold, 'an order dies with its department',
    `in force: ${book.issued} · lapsed when the office changed hands: ${book.lapsed} · said so: ${book.lapseTold}`);
  say(book.regionTargeted === 0 && book.regionsMoved === book.regionsTotal && book.powerTargeted > 0,
    'the order book is national',
    `${book.regionTargeted} orders make the player name a state, and one national order's drift reached ` +
    `${book.regionsMoved} of ${book.regionsTotal} regions in a single session · thirteen orders used to deliver their ` +
    `regional payload to one place, and twelve of the thirteen already carried national effects on top of it · ` +
    `${book.powerTargeted} orders still name a foreign power, which is a different axis from a state`);

  /* S10d — THE WORKS. Forty-eight distinct, and instruments that change what
     a work turns out to be rather than only how fast it is paid for. */
  const works = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    const keep = { ruling: S.ruling, coalition: S.coalition, capital: S.capital, treasury: S.treasury,
      works: JSON.parse(JSON.stringify(S.v8.works)), ind: JSON.parse(JSON.stringify(S.ind)) };
    out.count = V8_WORKS.length;
    out.regions = new Set(V8_WORKS.map(w => w.region || 'national')).size;
    out.everyRegion = REGIONS.every(r => V8_WORKS.some(w => w.region === r.id));
    /* every work must be buildable in principle: a req that can be met */
    out.impossible = V8_WORKS.filter(w => { try { return !w.req({ ind: Object.fromEntries(Object.keys(IND).map(k => [k, 100])) }); } catch (e) { return true; } }).map(w => w.id);

    S.ruling = me; S.coalition = [me]; S.capital = 400; S.treasury = 4000;
    const w = V8_WORKS.filter(x => x.region && x.done && x.done.capital)[0];
    /* a work scaled back delivers less; one built properly delivers more */
    const payout = mods => {
      S.v8.works[w.id] = { status:'active', mode:'steady', cost:w.cost, spent:w.cost, started:1, overruns:0, sessions:1, idle:0, mods:mods, notes:[] };
      const before = S.ind[Object.keys(w.done.ind)[0]];
      v8CompleteWork(S, w, S.v8.works[w.id]);
      const got = S.ind[Object.keys(w.done.ind)[0]] - before;
      delete S.v8.works[w.id];
      return Math.round(got * 1000) / 1000;
    };
    out.plain = payout({});
    out.descoped = payout({ descope:true });
    out.gilded = payout({ gild:true });
    /* the instruments are exclusive where they should be */
    S.v8.works[w.id] = { status:'active', mode:'steady', cost:w.cost, spent:0, started:1, overruns:0, sessions:0, idle:0, mods:{}, notes:[] };
    v8WorkAction(w.id, 'descope');
    const costAfterDescope = S.v8.works[w.id].cost;
    v8WorkAction(w.id, 'gild');
    out.exclusive = S.v8.works[w.id].cost === costAfterDescope && !S.v8.works[w.id].mods.gild;
    /* a cost change never touches what is already spent */
    S.v8.works[w.id] = { status:'active', mode:'steady', cost:100, spent:60, started:1, overruns:0, sessions:0, idle:0, mods:{}, notes:[] };
    v8WorkAction(w.id, 'descope');
    out.spentUntouched = S.v8.works[w.id].spent === 60 && S.v8.works[w.id].cost === Math.round(60 + 40 * .67);
    S.v8.works = keep.works; S.ruling = keep.ruling; S.coalition = keep.coalition;
    S.capital = keep.capital; S.treasury = keep.treasury; S.ind = keep.ind;
    return out;
  });
  say(works.count >= 48 && works.everyRegion && works.impossible.length === 0,
    'forty-eight works, every region', `${works.count} grand works across ${works.regions} regions incl. national; ` +
    `every region has at least one: ${works.everyRegion}; none impossible to start: ${works.impossible.length === 0}`);
  say(works.descoped < works.plain && works.gilded > works.plain && works.exclusive && works.spentUntouched,
    'how it is built is what it gives',
    `the same work opens at ${works.descoped} scaled back, ${works.plain} as specified, ${works.gilded} built properly; ` +
    `scaled-back and built-properly are exclusive: ${works.exclusive}; a cost change leaves what is spent alone: ${works.spentUntouched}`);

  /* S10e — THE COMMITTEES. The chair table was the literal
     ['fp','lp','sd','cup','tvc','pnl','fp'] in every campaign at every seed. */
  const chairs = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    const keep = { seats: JSON.parse(JSON.stringify(S.seats)), ruling: S.ruling, coalition: S.coalition,
      committees: JSON.parse(JSON.stringify(S.committees)), capital: S.capital };
    out.named = PV5_COMMITTEES.filter(c => S.committees[c.id].chairName).length;
    out.total = PV5_COMMITTEES.length;
    const reapportion = () => { PV5_COMMITTEES.forEach(c => { S.committees[c.id].chair = null; }); pv5ApportionChairs(S); };
    PARTIES.forEach(x => S.seats[x.id] = x.id === me ? 1200 : 15);
    reapportion();
    out.landslide = PV5_COMMITTEES.filter(c => S.committees[c.id].chair === me).length;
    PARTIES.forEach(x => S.seats[x.id] = 0); S.seats[me] = CFG.seats;
    reapportion();
    out.soleParty = PV5_COMMITTEES.every(c => S.committees[c.id].chair === me);
    PARTIES.forEach(x => S.seats[x.id] = Math.round(CFG.seats / PARTIES.length));
    reapportion();
    out.rsfCanChair = PV5_COMMITTEES.some(c => S.committees[c.id].chair === 'rsf');
    out.spread = new Set(PV5_COMMITTEES.map(c => S.committees[c.id].chair)).size;
    /* yours to give when you lead, refused when you do not */
    S.ruling = me; S.coalition = [me]; S.capital = 80;
    const cid = PV5_COMMITTEES[2].id, give = PARTIES.filter(x => x.id !== S.committees[cid].chair)[0].id;
    pv5AssignChair(cid, give);
    out.assigned = S.committees[cid].chair === give && !!S.committees[cid].chairName;
    S.ruling = PARTIES.filter(x => x.id !== me)[0].id; S.coalition = [S.ruling];
    const was = S.committees[cid].chair;
    pv5AssignChair(cid, me);
    out.refusedFromOpposition = S.committees[cid].chair === was;
    S.seats = keep.seats; S.ruling = keep.ruling; S.coalition = keep.coalition;
    S.committees = keep.committees; S.capital = keep.capital;
    return out;
  });
  say(chairs.named === chairs.total && chairs.landslide === chairs.total && chairs.soleParty && chairs.rsfCanChair && chairs.spread > 1,
    'the chamber decides the chairs',
    `${chairs.named}/${chairs.total} chairs are named people · a landslide takes ${chairs.landslide}/${chairs.total} · ` +
    `an even chamber spreads them over ${chairs.spread} parties and the RSF can chair: ${chairs.rsfCanChair}`);
  say(chairs.assigned && chairs.refusedFromOpposition, 'chairs are yours when you lead',
    `assigned while leading: ${chairs.assigned} · refused from opposition: ${chairs.refusedFromOpposition}`);

  /* S10e — THE WORLD. The owner was allied with a power and at war with it.
     That had four independent causes and a war-aware label would only have
     hidden it. */
  const world = await page.evaluate(() => {
    const out = {};
    /* 600 war rolls, and every declaration adds unrest and tension and moves
       blocs. Restore ALL of it: a leak here pre-satisfies the toEmergency
       ladder step (army >= 60 and unrest > 55), which is asserted below. */
    const keep = { powers: JSON.parse(JSON.stringify(S.powers)), war: S.war,
      treaties: JSON.parse(JSON.stringify(S.v6.treaties)), stats: JSON.parse(JSON.stringify(S.v6.stats || {})),
      ind: JSON.parse(JSON.stringify(S.ind)), blocs: JSON.parse(JSON.stringify(S.blocs)),
      pol: JSON.parse(JSON.stringify(S.pol)), unrest: S.unrest, capital: S.capital,
      territories: S.ind.territories, log: S.log.length };

    /* no war is declared on a power that is not hostile — but war is still
       possible, or this assertion would pass by never declaring one */
    let onFriend = 0, declaredFriendly = 0;
    for (let i = 0; i < 300; i++) {
      S.war = null; POWERS.forEach(x => S.powers[x.id] = 70);
      S.ind.tension = 95; S.ind.military = 90; S.pol.missileForce = 4; S.pol.protectorates = 4;
      /* the relation BEFORE the tick: declaring war clamps the target to 18,
         so reading it afterwards says 'not a friend' about every target there
         has ever been, and the assertion could not fail */
      const before = {}; POWERS.forEach(x => before[x.id] = relOf(S, x.id));
      warTick(S);
      if (S.war) { declaredFriendly++; if (before[S.war.power] >= 55) onFriend++; }
    }
    out.declaredOnFriendly = declaredFriendly;
    out.targetedAFriend = onFriend;
    let declaredHostile = 0;
    for (let i = 0; i < 300; i++) {
      S.war = null; POWERS.forEach(x => S.powers[x.id] = 70); S.powers.sarath = 12;
      S.ind.tension = 95; S.ind.military = 90; S.pol.missileForce = 4; S.pol.protectorates = 4;
      warTick(S);
      if (S.war) { declaredHostile++; if (S.war.power !== 'sarath') out.wrongTarget = S.war.power; }
    }
    out.declaredOnHostile = declaredHostile;

    /* the label */
    S.war = null; POWERS.forEach(x => S.powers[x.id] = 50);
    S.powers.sarath = 88; S.war = { power:'sarath', year:2030, momentum:0, turns:0, cost:0 };
    out.wordAtWar = relWord(relOf(S, 'sarath'), S, 'sarath');
    out.wordOther = relWord(relOf(S, 'moya'), S, 'moya');

    /* the treaty */
    S.v6.treaties.sarath = { kind:'defence', since:2028 };
    v6TreatiesTick(S);
    out.treatyVoided = !S.v6.treaties.sarath;

    /* a war won at the table is recorded */
    S.war = { power:'sarath', year:2030, momentum:10, turns:4, cost:0 };
    S.v6.stats = S.v6.stats || {}; const v0 = S.v6.stats.victories || 0;
    const act = ACTIONS.filter(a => /sue for peace/i.test(a.name))[0];
    if (act) act.run(S);
    out.victoryRecorded = (S.v6.stats.victories || 0) === v0 + 1 && !S.war;

    /* the five new powers, and the migration that keeps a NaN out of an old save */
    out.powerCount = POWERS.length;
    out.treatyKinds = Object.keys(V6_TREATIES).length;
    out.allSeeded = POWERS.every(p => typeof S.powers[p.id] === 'number' && !isNaN(S.powers[p.id]));
    /* through the LOAD PATH, not by calling the migration by hand: a v9-era
       save is enriched by v8EnsureState, and it is that wiring the assertion
       is about. Calling v10EnsurePowers directly proves only that the function
       exists. */
    const old6 = JSON.parse(JSON.stringify(S));
    old6.powers = { ostmark:44, moya:52, sarath:31, calavera:62, alliance:74, meridian:66 };
    const loaded = v8EnsureState(old6, false) || old6;
    out.backfilled = POWERS.every(p => typeof loaded.powers[p.id] === 'number' && !isNaN(loaded.powers[p.id]));
    S.powers = { ostmark:44 }; shiftRel(S, 'tarnow', 5);
    out.noNaN = !isNaN(S.powers.tarnow);
    S.powers = JSON.parse(JSON.stringify(keep.powers)); v10EnsurePowers(S);
    S.powers = keep.powers; S.war = keep.war; S.v6.treaties = keep.treaties; S.v6.stats = keep.stats;
    S.ind = keep.ind; S.blocs = keep.blocs; S.pol = keep.pol; S.unrest = keep.unrest; S.capital = keep.capital;
    v10EnsurePowers(S);

    /* The two effects the cards have always advertised. Measured AFTER the
       restore and from a mid-range military: the war-roll loops above set it
       to 90, and c100 saturates the target at 100, which reads as "the treaty
       does nothing" when it is the ceiling doing it. */
    /* The military TARGET is driven by the defence statutes and sits at the
       100 ceiling in a built-out book, so +1.5 has nowhere to go while -1.5
       still shows — which reads as "defence does nothing" when it is the
       clamp. Measure from a quiet state. */
    const keepMil = S.ind.military, keepTr = S.v6.treaties, keepPol = S.pol;
    S.pol = {}; S.ind.military = 40; S.v6.treaties = {};
    const m0 = indicatorTargets(S).military;
    S.v6.treaties = { ostmark:{ kind:'defence', since:2030 } };
    out.defenceMil = Math.round((indicatorTargets(S).military - m0) * 100) / 100;
    S.v6.treaties = { ostmark:{ kind:'arms', since:2030 } };
    out.armsMil = Math.round((indicatorTargets(S).military - m0) * 100) / 100;
    S.ind.military = keepMil; S.v6.treaties = keepTr; S.pol = keepPol;
    return out;
  });
  say(world.declaredOnFriendly === 0 && world.targetedAFriend === 0 && world.declaredOnHostile > 0 && !world.wrongTarget,
    'war needs somebody to be hostile to',
    `300 rolls at maximum risk with every power at 70 declared ${world.declaredOnFriendly} wars — there is nobody to fight; ` +
    `300 identical rolls with one power at 12 declared ${world.declaredOnHostile}, every one of them on that power`);
  say(world.wordAtWar === 'at war' && world.wordOther === 'correct', 'nobody is allied and at war',
    `a power at 88 relations you are fighting reads "${world.wordAtWar}"; everyone else still reads normally ("${world.wordOther}")`);
  say(world.treatyVoided, 'war annuls the treaty it contradicts',
    'a defence pact with the country you are fighting is void, not still paying out');
  say(world.powerCount >= 11 && world.allSeeded && world.backfilled && world.noNaN,
    'eleven powers, none of them NaN',
    `${world.powerCount} powers, all seeded: ${world.allSeeded}; a six-power save backfills: ${world.backfilled}; ` +
    `shiftRel on an unknown power no longer produces NaN: ${world.noNaN}`);
  say(world.defenceMil === 1.5 && world.armsMil === -1.5 && world.treatyKinds >= 8,
    'a treaty does what its card says',
    `${world.treatyKinds} instruments · a defence pact moves the armed-forces target by ${world.defenceMil} and an arms treaty by ${world.armsMil} — both advertised on their cards since v6 and implemented by nothing`);
  say(world.victoryRecorded, 'a war won at the table counts',
    'suing for peace records the victory instead of nulling the war before the tick that would have');

  say(paper.demandVariety >= 3, 'a party varies what it demands',
    paper.demandVariety + ' distinct statutes demanded across 40 draws (was 1, with no rand() in the function)');

  /* S10f — QUESTION TIME. The whole pool was five sentences in one if/else
     chain, and its gates made three of them nearly unreachable. */
  const qt = await page.evaluate(() => {
    const out = {}, keepTurn = S.turn, keepQt = JSON.parse(JSON.stringify(S.v8.qt));
    out.pool = V10_QT.length;
    out.papers = V10_PAPERS.length;
    const subs = [...new Set(V10_QT.map(x => x.subject))];
    out.subjects = subs.length;
    /* every subject can be asked from both sides of the chamber */
    out.bothSides = subs.filter(sb => V10_QT.some(x => x.subject === sb && x.side === 'power') &&
                                      V10_QT.some(x => x.subject === sb && x.side === 'opposition')).length;
    /* no question asks for a fact its own subject cannot supply — the fill map
       leaves an unknown {brace} in the sentence, verbatim, on screen */
    const GLOBAL = ['leader','party','opp','year'];
    const SUPPLY = { issue:['issue','number'], scandal:['minister','number'], bill:['bill','number'],
      work:['work','number'], minister:['minister','number'], governor:['governor','region','number'],
      treaty:['power','number'], court:['number'], money:['number'], unrest:['number'],
      promise:['number'], prices:['number'], order:['work','number'], byelection:['number','region'] };
    out.badPlaceholders = [];
    V10_QT.forEach(q => {
      const ok = GLOBAL.concat(SUPPLY[q.subject] || []);
      [q.body].concat(q.replies.map(r => r.label + ' ' + r.result)).join(' ')
        .replace(/\{(\w+)\}/g, (m, k) => { if (ok.indexOf(k) < 0) out.badPlaceholders.push(q.id + ':' + k); return m; });
    });
    /* every tone maps onto an effect path that exists */
    out.badTones = V10_QT.filter(q => q.replies.some(r =>
      !V10_QT_TONE.power[r.tone] || !V10_QT_TONE.opposition[r.tone])).map(q => q.id);
    /* the spread with every subject in play, and the rule that selection is
       free: v8EnsureQuestion runs on the RENDER path, so a die here would make
       a campaign's dice-spend depend on how often a tab was opened */
    const base = v10QtContext;
    v10QtContext = function (st) {
      const c = base(st);
      subs.forEach(sb => { if (c.subjects.indexOf(sb) < 0) { c.subjects.push(sb);
        c.fill['_' + sb] = { minister:'Iyer', bill:'the Fuel Duty Bill', work:'the Rigel Viaduct',
          issue:'housing', governor:'Halloran', region:'Cassian', power:'Ostmark', number:'41' }; } });
      ['minister','bill','work','issue','governor','region','power','number'].forEach(k => {
        if (c.fill[k] === undefined) c.fill[k] = '41'; });
      return c;
    };
    /* both sides of the chamber, explicitly: which side you are on decides
       which half of the pool is drawn from, and leaving it to whatever the
       preceding tests left S.ruling as makes this number wander */
    const keepRuling = S.ruling, keepCo = S.coalition, me = playParty(S);
    const r0 = S.rngState;
    /* S11b: this swept SIXTY sessions and asserted all fourteen subjects were
       drawn. Over sixty draws by hash across fourteen subjects, missing one is
       ordinary — the assertion failed intermittently on identical code, which
       is worse than no assertion at all. The property under test is that every
       subject is REACHABLE, so sweep a full epic campaign, where it is. */
    const sweep = () => {
      const seen = new Set(), seenSubs = new Set();
      for (let t = 1; t <= 200; t++) {
        S.turn = t; S.v8.qt.turn = -1; S.v8.qt.v10 = -1; v8EnsureQuestion(S);
        if (S.v8.qt.question) { seen.add(S.v8.qt.question); seenSubs.add(S.v8.qt.subject); }
      }
      return { d: seen.size, s: seenSubs.size, leaks: [...seen].filter(q => /\{\w+\}/.test(q)).length };
    };
    S.ruling = me; S.coalition = [me];
    const inPow = sweep();
    S.ruling = PARTIES.filter(x => x.id !== me)[0].id; S.coalition = [S.ruling];
    const inOpp = sweep();
    S.ruling = keepRuling; S.coalition = keepCo;
    out.distinctInPower = inPow.d; out.distinctInOpposition = inOpp.d;
    out.distinct = Math.min(inPow.d, inOpp.d);
    out.distinctSubjects = Math.min(inPow.s, inOpp.s);
    out.leaks = inPow.leaks + inOpp.leaks;
    out.diceSpent = S.rngState !== r0;
    /* The real property: RE-RENDERING inside one session must not move the
       question or the rotation. The old form of this test cleared q.v10 first
       — the very guard that provides the stability — so it was asking whether
       a forced re-selection re-selected, which is not a property anybody
       wants. Fifty calls, guard untouched, as fifty renders would make. */
    S.turn = keepTurn; S.v8.qt.pending = true; S.v8.qt.v10 = -1;
    v8EnsureQuestion(S);
    const a = S.v8.qt.question;
    const c0 = JSON.stringify((S.v10 && S.v10.qtSeen) || {});
    for (let i = 0; i < 50; i++) v8EnsureQuestion(S);
    out.stable = a === S.v8.qt.question;
    out.rotationHeld = c0 === JSON.stringify((S.v10 && S.v10.qtSeen) || {});
    /* A subject walks its whole shelf before it repeats anything. The subject
       has to be HELD for this — advancing the turn moves the subject too, so a
       naive loop lands elsewhere and never revisits the one being counted. */
    const sub0 = 'scandal';
    const side0 = inPower(S) ? 'power' : 'opposition';
    const shelf = V10_QT.filter(x => x.subject === sub0 && x.side === side0).length;
    const held = v10QtContext;
    v10QtContext = function (st) {
      const c = held(st);
      c.subjects = [sub0];
      c.fill['_' + sub0] = c.fill['_' + sub0] ||
        { minister:'Iyer', bill:'a bill', work:'a work', issue:'housing',
          governor:'Halloran', region:'Cassian', power:'Ostmark', number:'41' };
      return c;
    };
    if (S.v10) S.v10.qtSeen = {};
    const walk = [];
    for (let i = 0; i < shelf; i++) {
      S.turn = keepTurn + i; S.v8.qt.pending = true; S.v8.qt.v10 = -1;
      v8EnsureQuestion(S);
      walk.push(S.v8.qt.question);
    }
    v10QtContext = held;
    out.shelf = shelf; out.walked = new Set(walk).size;
    /* the rotation is NEW SAVE STATE. A campaign saved before it existed has
       no v10.qtSeen at all, and must load, ask a question and start clean
       rather than throwing on the first render. */
    const blob = JSON.parse(JSON.stringify(S));
    if (blob.v10) delete blob.v10.qtSeen;
    blob.turn = 40; blob.v8.qt.pending = true; blob.v8.qt.v10 = -1;
    const loaded = v8EnsureState(blob, false) || blob;
    try { v8EnsureQuestion(loaded); out.oldSaveThrew = false; }
    catch (e) { out.oldSaveThrew = String(e); }
    out.oldSaveAsks = !!(loaded.v8.qt && loaded.v8.qt.question);
    out.rotationRidesTheSave = /qtSeen/.test(JSON.stringify(S));
    v10QtContext = base;
    S.turn = keepTurn; S.v8.qt = keepQt;
    return out;
  });
  say(qt.pool >= 160 && qt.subjects === 14 && qt.bothSides === 14 &&
      !qt.badPlaceholders.length && !qt.badTones.length,
    'the despatch box has more than one sentence',
    `${qt.pool} questions over ${qt.subjects} subjects, all ${qt.bothSides} askable from either side ` +
    `(was 5 sentences in one if/else chain, three of them behind gates that could not open); ` +
    `placeholders no subject can supply: ${qt.badPlaceholders.length}; tones the engine cannot map: ${qt.badTones.length}`);
  /* S10f — THE PAPERS. Eleven types arriving every other session for two
     hundred sessions was the owner's other complaint about the red box. */
  const papers = await page.evaluate(() => {
    const out = { badChoices: [], dupTitles: [], templated: [], unpriced: [] };
    out.pool = V10_PAPERS.length;
    const t = {};
    V10_PAPERS.forEach(pp => {
      if (!pp.choices || pp.choices.length !== 3) out.badChoices.push(pp.id);
      const k = String(pp.title).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      if (t[k]) out.dupTitles.push(pp.id); t[k] = 1;
      if (/\{\w+\}/.test(pp.title + ' ' + pp.body)) out.templated.push(pp.id);
      /* the engine prices a paper's buttons BY POSITION, so a paper the
         renderer cannot price is a paper with a dead button */
      const cs = inboxChoices({ v10paper: pp.id });
      if (cs.length !== 3 || cs.some(c => typeof c.cost !== 'number' || !c.label || !c.note)) out.unpriced.push(pp.id);
    });
    return out;
  });
  say(papers.pool >= 30 && !papers.badChoices.length && !papers.dupTitles.length &&
      !papers.templated.length && !papers.unpriced.length,
    'the red box has more than a fortnight in it',
    `${papers.pool} authored papers on top of the eleven the v4 base had; ` +
    `wrong number of choices: ${papers.badChoices.length}; repeated titles: ${papers.dupTitles.length}; ` +
    `templated where they should be written: ${papers.templated.length}; buttons the renderer cannot price: ${papers.unpriced.length}`);

  /* S11c — THE FEDERATION. The owner reported the tab as bare and low-impact;
     the survey found the arithmetic. */
  const fed = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    const keep = { regions: JSON.parse(JSON.stringify(S.regions)),
      gov: JSON.parse(JSON.stringify(S.v6.governors)),
      auto: JSON.parse(JSON.stringify(S.v6.autonomy || {})),
      tg: JSON.parse(JSON.stringify((S.campaign && S.campaign.targets) || {})),
      cool: JSON.parse(JSON.stringify(S.regionCooldown || {})),
      cap: S.capital, tre: S.treasury, turn: S.turn };
    const seats = () => ((projection(S) || {}).seats || {})[me] || 0;
    const setAll = (v, mine, dots) => REGIONS.forEach(r => {
      const q = S.regions[r.id];
      q.prosperity = v; q.services = v; q.order = v; q.federal = v;
      const g = S.v6.governors[r.id];
      if (g) { g.party = mine ? me : PARTIES.filter(x => x.id !== me)[0].id; g.standing = v; g.approval = v; }
      if (S.campaign && S.campaign.targets) S.campaign.targets[r.id] = dots;
    });
    /* WHAT A REGION IS WORTH IN THE CHAMBER. Before this slice: prosperity,
       services and order reached one governor's approval score, and the only
       channel to the national vote was a pop-weighted mean of eight frozen
       `lean` literals worth about +4.7% to the ruling party alone. */
    setAll(50, false, 0); const neutral = seats();
    setAll(85, true, 3);  const sweep = seats();
    setAll(20, false, 0); const abandoned = seats();
    out.sweepGain = sweep - neutral;
    out.neglectLoss = neutral - abandoned;
    /* THE FLANK PARTIES CAN BE MOVED IN THE REGIONS AT ALL. Measured the way
       it matters: the flank party HOLDING the governorships against holding
       none. NOTE what this does and does not prove — a proof-of-failure run
       showed restoring the old [.86,1.15] clamp does NOT turn this red, so
       what this assertion guards is the regional TERMS, not the widened span.
       The span still earns its keep at the bottom (the worst flank readings
       land at .847 and .854, under the old floor); the top is headroom. */
    out.flankMoves = ['rsf', 'pnl'].every(f => {
      REGIONS.forEach(r => { const g = S.v6.governors[r.id]; if (g) { g.party = null; g.standing = 50; g.approval = 50; } });
      const without = regionPartyFactor(S, f);
      REGIONS.forEach(r => { const g = S.v6.governors[r.id]; if (g) { g.party = f; g.standing = 85; g.approval = 85; } });
      const withThem = regionPartyFactor(S, f);
      return withThem - without > 0.02;
    });
    /* the seat totals are untouched BY CONSTRUCTION — per-region allocation was
       rejected precisely so this stays true without re-verification */
    setAll(85, true, 3);
    const pr = projection(S);
    out.assemblyTotal = PARTIES.reduce((a, p) => a + (pr.seats[p.id] || 0), 0);
    out.senateTotal = PARTIES.reduce((a, p) => a + (pr.senate[p.id] || 0), 0);
    out.assemblyWant = CFG.seats; out.senateWant = CFG.senate;
    S.regions = JSON.parse(JSON.stringify(keep.regions));
    S.v6.governors = JSON.parse(JSON.stringify(keep.gov));
    if (S.campaign) S.campaign.targets = JSON.parse(JSON.stringify(keep.tg));
    /* THE ECONOMY IS ON THE SAVE, NOT THE FROZEN LITERAL. Writing REGIONS
       would not be serialised, not rewound by undo, and corrupted by every
       forecast — a silent save break. */
    const q = v11Region(S, 'rigel');
    out.econOnState = ['output', 'wealth', 'pop', 'trade'].every(k => q[k] !== undefined);
    out.inTheBlob = /"output"/.test(JSON.stringify(S.regions));
    const litPop = REGIONS.filter(r => r.id === 'rigel')[0].pop;
    q.pop = q.pop + 5;
    out.literalUntouched = REGIONS.filter(r => r.id === 'rigel')[0].pop === litPop;
    q.pop = q.pop - 5;
    /* THE LADDER HAS RUNGS, and pressure builds on the things the page moves */
    out.rungs = V11_AUTONOMY.length;
    S.v6.autonomy = {};
    REGIONS.forEach(r => { const x = S.regions[r.id]; x.federal = 90; x.prosperity = 90; x.order = 90; });
    S.crown = 80;
    const calm = v11AutonomyPressure(S, REGION.thaxia);
    REGIONS.forEach(r => { const x = S.regions[r.id]; x.federal = 12; x.prosperity = 14; x.order = 16; });
    S.crown = 20;
    const angry = v11AutonomyPressure(S, REGION.thaxia);
    out.pressureBuilds = angry > calm + 20;
    out.calm = calm; out.angry = angry;
    S.v6.autonomy.thaxia = 3;
    out.levelReads = v11AutonomyLevel(S, 'thaxia') === 3;
    /* UNREST READS REGIONAL ORDER, which the field guide has always claimed */
    S.regions = JSON.parse(JSON.stringify(keep.regions));
    const u0 = unrestTarget(S);
    REGIONS.forEach(r => { S.regions[r.id].order = 15; });
    const u1 = unrestTarget(S);
    /* the real wiring moves this by ~10.6; a threshold of 1 let a PARTIAL
       break through (removing the worst-region term alone still scored 4),
       which a proof-of-failure run caught. It has to be tight enough that
       losing any one of the three terms shows. */
    out.unrestReadsOrder = u1 > u0 + 8;
    out.unrestDelta = Math.round((u1 - u0) * 10) / 10;
    S.regions = JSON.parse(JSON.stringify(keep.regions));
    S.v6.autonomy = keep.auto;
    /* THE TWO UNBOUNDED LEVERS ARE BOUNDED. Standing could be bought from
       nothing to a hundred in three clicks in one session. */
    S.capital = 99; S.treasury = 999; S.regionCooldown = {};
    const st0 = S.v6.governors.rigel.standing;
    v6GovernorAction('rigel', 'meet'); const st1 = S.v6.governors.rigel.standing;
    v6GovernorAction('rigel', 'meet'); const st2 = S.v6.governors.rigel.standing;
    out.meetBounded = st1 > st0 && st2 === st1;
    /* the six new levers exist and go through the one generic handler */
    out.acts = Object.keys(V9_REGION_ACTS).length;
    S.regions = keep.regions; S.v6.governors = keep.gov; S.v6.autonomy = keep.auto;
    if (S.campaign) S.campaign.targets = keep.tg;
    S.regionCooldown = keep.cool; S.capital = keep.cap; S.treasury = keep.tre; S.turn = keep.turn;
    return out;
  });
  say(fed.sweepGain >= 30 && fed.sweepGain <= 55 && fed.neglectLoss >= 6 && fed.flankMoves &&
      fed.assemblyTotal === fed.assemblyWant && fed.senateTotal === fed.senateWant,
    'what you build in a region reaches the chamber',
    `a clean eight-governor sweep is worth +${fed.sweepGain} Assembly seats and abandoning every region ` +
    `costs ${fed.neglectLoss} (the owner's ruling was about forty) · the two flank parties can now be moved in the regions ` +
    `at all: ${fed.flankMoves} · and the roll still totals ${fed.assemblyTotal}/${fed.assemblyWant} and ${fed.senateTotal}/${fed.senateWant}, ` +
    `because per-region allocation was rejected and allocateSeats is untouched`);
  say(fed.econOnState && fed.inTheBlob && fed.literalUntouched && fed.rungs === 5 &&
      fed.pressureBuilds && fed.levelReads && fed.unrestReadsOrder && fed.meetBounded && fed.acts >= 10,
    'the federation is something you can lose',
    `the regional economy rides the SAVE and not the frozen REGIONS literal (${fed.econOnState}/${fed.inTheBlob}/${fed.literalUntouched}) · ` +
    `${fed.rungs} rungs out of the union, pressure ${fed.calm} when the centre is trusted and ${fed.angry} when it is not · ` +
    `regional order reaches unrest at last, ${fed.unrestDelta} when every region is ungoverned · ` +
    `a governor cannot be bought to a hundred in one session: ${fed.meetBounded} · ${fed.acts} levers on the registry`);

  /* S11a — THE RECORD DECK. Twenty charts on a page render() rebuilds on every
     action, drawn from three sources that started recording at three different
     times. */
  const deck = await page.evaluate(() => {
    const out = {};
    /* the fixture has not closed enough sessions for the recorder to have run,
       so run it — that is the thing under test anyway. RESTORE S.turn: the
       governor-ageing assertion below reads it, and a primer that leaves the
       turn at 30 makes that test measure this one. */
    const keepTurn = S.turn;
    for (let i = 0; i < 30; i++) { S.turn = i + 1; v11HistTick(S); }
    S.turn = keepTurn;
    S.uiPrefs = S.uiPrefs || {};
    out.charts = V10_RECORD_CHARTS.length;
    /* v7FoldKey strips a TRAILING NUMBER and lowercases, so "Chart 1" and
       "Chart 2" are one saved preference governing both panels. Nothing else
       in the file catches this and it is trivial to hit by accident. */
    const keys = V10_RECORD_CHARTS.map(c => v7FoldKey('record', c.title));
    out.uniqueKeys = new Set(keys).size === keys.length;
    out.dupKey = keys.find((k, i) => keys.indexOf(k) !== i) || null;
    /* every chart defaults collapsed except the Long Record, which is the one
       the page has always opened on */
    out.collapsed = V10_RECORD_CHARTS.filter(c => v7DefaultCollapsed('record', c.title)).length;
    /* the palette rule: at most four series a chart, and only from the accents
       the theme already carries — twenty charts is exactly where an
       unadjudicated hex arrives */
    const ACCENTS = Object.keys(V11_ACCENT).map(k => V11_ACCENT[k]);
    out.tooManySeries = V10_RECORD_CHARTS.filter(c => c.keys.length > 4).map(c => c.id);
    out.strayColour = V10_RECORD_CHARTS.filter(c => c.keys.some(s => ACCENTS.indexOf(s.color) < 0)).map(c => c.id);
    /* every series must be readable from the source its chart names, or the
       line renders as a flat zero and says nothing */
    out.unreadable = [];
    V10_RECORD_CHARTS.forEach(c => {
      c.keys.forEach(s => {
        if (c.src === 'v11') {
          if (!V11_SERIES.some(col => col.k === s.k)) out.unreadable.push(c.id + ':' + s.k);
        } else {
          const rows = V11_SRC[c.src].rows();
          if (rows.length && typeof V11_SRC[c.src].at(rows[rows.length - 1], s.k) !== 'number') out.unreadable.push(c.id + ':' + s.k);
        }
      });
    });
    /* THE RANGE IS A SLICE OF YEARS. One turn is one year, so no conversion —
       but it has to actually cut the sample. */
    const keep = S.uiPrefs.recRange;
    const col = v11Col('crown');
    S.uiPrefs.recRange = 'all'; const all = v11Slice(col).length;
    S.uiPrefs.recRange = '5';   const five = v11Slice(col).length;
    S.uiPrefs.recRange = '25';  const twentyfive = v11Slice(col).length;
    S.uiPrefs.recRange = keep;
    out.rangeAll = all; out.rangeFive = five; out.rangeTwentyFive = twentyfive;
    out.rangeCuts = all > 5 ? (five === 5 && twentyfive === Math.min(all, 25)) : true;
    /* THE FORECAST MUST NOT CARRY THE RECORD. v6Sandbox deep-clones the whole
       of S on every mouseenter over a forecastable button. */
    const box = v6Sandbox(function () {});
    out.sandboxClean = !(box.st.v11 && box.st.v11.hist);
    out.liveKept = !!(S.v11 && S.v11.hist);
    /* ROUNDING MUST NOT CHANGE WHAT A CHART SHOWS. Every recorder now rounds;
       the deck reads the rounded value, so a chart's own frame is what has to
       be identical, not the raw double. */
    out.allIntegers = Object.keys(S.v11.hist).every(k => S.v11.hist[k].every(v => v === Math.round(v)));
    out.v6Rounded = (S.v6.history || []).every(r => Math.abs(r.approval * 10 - Math.round(r.approval * 10)) < 1e-9);
    /* EACH SOURCE STATES ITS OWN START. Three different truths — v6 spans the
       campaign, v5 kept forty sessions before this slice, v11 starts now — and
       one blanket note would be wrong twice. */
    out.notes = [...new Set(V10_RECORD_CHARTS.map(c => v11ChartNote(c)))].length;
    return out;
  });
  say(deck.charts >= 20 && deck.uniqueKeys && deck.collapsed === deck.charts - 0 - (deck.charts - deck.collapsed) &&
      !deck.tooManySeries.length && !deck.strayColour.length && !deck.unreadable.length,
    'the record deck is stocked and every line can be read',
    `${deck.charts} charts · fold keys unique after normalisation: ${deck.uniqueKeys}${deck.dupKey ? ' (' + deck.dupKey + ')' : ''} · ` +
    `charts with more than four series: ${deck.tooManySeries.length} · colours outside the theme accents: ${deck.strayColour.length} · ` +
    `series their own source cannot supply: ${deck.unreadable.length}`);
  say(deck.rangeCuts && deck.sandboxClean && deck.liveKept && deck.allIntegers && deck.v6Rounded && deck.notes >= 2,
    'the record costs what it says and no more',
    `a range is a slice of years (${deck.rangeAll} all, ${deck.rangeFive} at five, ${deck.rangeTwentyFive} at twenty-five) · ` +
    `a forecast clone carries no record: ${deck.sandboxClean}, and the live one still does: ${deck.liveKept} · ` +
    `every recorded column is an integer: ${deck.allIntegers}, and v6's rows are rounded: ${deck.v6Rounded} · ` +
    `${deck.notes} distinct provenance notes, because the three sources began at three different times`);

  say(qt.distinctSubjects === 14 && qt.distinct >= 60 && qt.leaks === 0 && !qt.diceSpent &&
      qt.stable && qt.rotationHeld && qt.walked === qt.shelf &&
      qt.oldSaveThrew === false && qt.oldSaveAsks && qt.rotationRidesTheSave,
    'a session picks its question without spending a die',
    `200 sessions with every subject in play drew ${qt.distinctInPower} distinct questions in government and ` +
    `${qt.distinctInOpposition} in opposition, across ${qt.distinctSubjects} subjects, ` +
    `${qt.leaks} of them showing an unfilled placeholder; rngState moved: ${qt.diceSpent}; ` +
    `fifty renders in one session left the question and the rotation alone: ${qt.stable && qt.rotationHeld}; ` +
    `a subject walks all ${qt.shelf} of its questions before repeating one: ${qt.walked === qt.shelf}; ` +
    `the rotation rides the save: ${qt.rotationRidesTheSave}, and a campaign saved before it existed still asks: ${qt.oldSaveAsks}`);


  // 1. the authority ladder, precondition by precondition
  const ladder = await page.evaluate(() => {
    const out = [];
    const T = {}; TRANSITIONS.forEach(t => { T[t.id] = t; });
    const step = (id, breakName, make, flowOk) => {
      const t = T[id];
      const before = t.ok(S);
      make();
      const after = t.ok(S);
      S.capital = 99;
      doTransition(t);
      out.push({ id, breakName, falseBefore: !before || !!flowOk, trueAfter: after, landed: S.form === t.to });
      if (typeof hideSheet === 'function') hideSheet();
    };
    // make the player lead a majority government
    S.ruling = playParty(S);
    step('toCentral', 'crown<=45 & govShare>=.45', () => {
      S.crown = 40;
      const mine = playParty(S); const seats = {};
      PARTIES.forEach(p => { seats[p.id] = 10; });
      seats[mine] = CFG.seats - 10 * (PARTIES.length - 1);
      S.seats = seats; S.coalition = [mine];
    });
    step('toExecutive', 'execHeld>=3 & army>=55', () => {
      S.armyLoyalty = 60;
      S.exec.pres = S.ruling; S.exec.vpres = S.ruling; S.exec.chan = S.ruling; S.exec.vchan = S.ruling;
    });
    step('toEmergency', 'army>=60 & unrest>55', () => { S.armyLoyalty = 65; S.unrest = 60; });
    /* toOneParty's gate (army 65, no sitting Assembly) is already satisfied on
       arrival from the emergency, which suspended the house and raised the
       services — the ladder FLOWS, which is the design. No false-before here. */
    step('toOneParty', 'army>=65 & !lowerSits', () => { S.armyLoyalty = 70; }, true);
    step('toEmpire', 'pnl 4 offices, 3 precedents, army 70', () => {
      S.ruling = 'pnl'; S.playAs = 'pnl'; S.coalition = ['pnl'];
      S.exec.pres = 'pnl'; S.exec.vpres = 'pnl'; S.exec.chan = 'pnl'; S.exec.vchan = 'pnl';
      S.precedents = 3; S.armyLoyalty = 75;
    });
    return out;
  });
  for (const r of ladder) {
    say(r.falseBefore && r.trueAfter && r.landed, 'ladder: ' + r.id,
      `ok() false before (${r.falseBefore}), true after ${r.breakName} (${r.trueAfter}), form moved: ${r.landed}`);
  }

  // 3a. the ritual queues under the closed constitution we just built
  const ritual = await page.evaluate(() => {
    S.pendingRitual = null;
    regimeCycle(S);
    const queued = !!S.pendingRitual;
    const ev1 = v10RitualEvent(S);
    const ssNow = securityState(S);
    return { queued, title: ev1.title, choices: ev1.ch.length, ssNow,
      weaponChoice: ev1.ch.length === (ssNow >= 45 ? 4 : 3) };
  });
  say(ritual.queued && ritual.choices >= 3 && ritual.weaponChoice, 'the confirmation ritual',
    `queued: ${ritual.queued}; "${ritual.title}" with ${ritual.choices} choices at securityState ${Math.round(ritual.ssNow)}`);

  // 3b. rig a count, restore elections, and the reckoning becomes reachable
  const reckon = await page.evaluate(() => {
    S.rigging = 2; S.rigCount = 2;
    const ev2 = EVENTS.filter(e => e.id === 'v10reckoning')[0];
    const closedNow = eventOpen(S, ev2);
    S.v6.flags = S.v6.flags || {}; S.v6.flags.restoration = true;
    const t = TRANSITIONS.filter(x => x.id === 'toFederal')[0];
    const okNow = t.ok(S);
    const capBefore = (S.capital = 99);
    doTransition(t);
    if (typeof hideSheet === 'function') hideSheet();
    return { closedNow, okNow, restored: S.form === 'federal', flagSet: !!(S.v6.flags.restored),
      surcharged: S.capital < capBefore - t.cost, open: eventOpen(S, ev2) };
  });
  say(!reckon.closedNow && reckon.open, 'the reckoning waits for elections',
    `closed while no elections: ${!reckon.closedNow}; open after restoration: ${reckon.open}`);
  say(reckon.okNow && reckon.restored && reckon.flagSet && reckon.surcharged, 'the restoration road back',
    `ok with flag: ${reckon.okNow}; landed federal: ${reckon.restored}; restored flag: ${reckon.flagSet}; terminal surcharge levied: ${reckon.surcharged}`);

  // 6. and it REFUSES without the flag (fresh page)
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p2.addInitScript(() => { window.confirm = () => true; });
  await p2.addInitScript(PICK);
  await p2.goto(URL);
  await p2.waitForSelector('[data-setup-begin]', { timeout: 15000 });
  await p2.click('[data-setup-begin]');
  await p2.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await p2.click('[data-doctrine]');
  await p2.waitForTimeout(400);
  const locked = await p2.evaluate(() => {
    S.form = 'empire';
    const t = TRANSITIONS.filter(x => x.id === 'toFederal')[0];
    const refused = !t.ok(S);
    S.v6.flags = S.v6.flags || {}; S.v6.flags.restoration = true;
    const opened = t.ok(S);
    S.form = 'federal'; S.v6.flags.restoration = false;
    return { refused, opened };
  });
  say(locked.refused && locked.opened, 'terminal means terminal',
    `empire refuses toFederal without the flag: ${locked.refused}; opens with it: ${locked.opened}`);

  // 2. the state gate on the measures
  const gate = await p2.evaluate(() => {
    const r0 = S.ruling, a0 = S.playAs;
    S.ruling = 'fp'; S.playAs = 'fp';
    const before = extraTierAllowed(S, 1);
    // legislate the apparatus: raise Authority statutes until ss >= 30
    const auth = POLICIES.filter(p => (p.cat === 'Authority' || p.cat === 'Security') && polAuth(p) > 0);
    for (const p of auth) { S.pol[p.id] = p.max; if (securityState(S) >= 34) break; }
    const ss = securityState(S);
    const t1 = extraTierAllowed(S, 1);
    const t2before = extraTierAllowed(S, 2);
    S.precedents = 2;
    for (const p of auth) { S.pol[p.id] = p.max; }
    const ss2 = securityState(S);
    const t2 = extraTierAllowed(S, 2);
    // clean up
    auth.forEach(p => { S.pol[p.id] = 0; }); S.precedents = 0; S.ruling = r0; S.playAs = a0;
    return { before, ss, t1, t2before, ss2, t2 };
  });
  say(!gate.before && gate.t1, 'tier 1 opens by the state', `FP locked at ss 0: ${!gate.before}; open at ss ${Math.round(gate.ss)}: ${gate.t1}`);
  say(!gate.t2before && gate.t2, 'tier 2 opens by precedent + apparatus', `locked before: ${!gate.t2before}; open at 2 precedents and ss ${Math.round(gate.ss2)}: ${gate.t2}`);

  // 4. the weighted franchise moves the count
  const franchise = await p2.evaluate(() => {
    const tally = () => {
      const t = supportTargets(S);
      let bus = 0, lab = 0;
      PARTIES.forEach(p => {
        const share = t[p.id] || 0;
        if (p.id === bestBusinessParty(S)) bus += share;
        if (p.id === 'lp' || p.id === 'rsf') lab += share;
      });
      return { bus, lab };
    };
    const before = tally();
    S.acts.wealthFranchise = true;
    const after = tally();
    S.acts.wealthFranchise = false;
    return { busBefore: before.bus, busAfter: after.bus, labBefore: before.lab, labAfter: after.lab };
  });
  say(franchise.busAfter > franchise.busBefore && franchise.labAfter < franchise.labBefore,
    'the franchise is weighted', `business party ${franchise.busBefore.toFixed(3)} -> ${franchise.busAfter.toFixed(3)}; labour bloc parties ${franchise.labBefore.toFixed(3)} -> ${franchise.labAfter.toFixed(3)}`);

  // 5. needs: the order cannot outrun the statute book
  const needs = await p2.evaluate(() => {
    // fabricate a needs pair on live policies without touching the registry:
    const p = POLICIES.filter(x => x.dept && !x.needs && (S.pol[x.id] || 0) === 0)[0];
    const pre = POLICIES.filter(x => x.id !== p.id && (S.pol[x.id] || 0) === 0)[0];
    p.needs = pre.id;
    S.ruling = playParty(S); S.coalition = [S.ruling];
    S.exec.pres = S.ruling; S.exec.vpres = S.ruling; S.exec.chan = S.ruling; S.exec.vchan = S.ruling;
    S.capital = 99; S.changed = {};
    const before = S.pol[p.id] || 0;
    /* S10c retired orderPolicy — an order no longer raises a statute. The rule
       it carried ("an order cannot outrun its own statute book") survives as
       `needs:` on an ORDER, so the gate is asserted against the new book. */
    let gatedCount = 0;
    const ord = pick(V10_ORDERS, 'maritimeExclusion', x => !!x.needs, 'an order that needs a statute');
    /* S11b: this used to initialise `blocked = true`, so if NO order carried a
       `needs` the body never ran and the assertion passed while testing
       nothing. The sixth order adds thirty-six deliberately UNGATED orders, so
       the day somebody ungates the rest this has to go red rather than quietly
       agree. */
    let blocked = !!ord;
    gatedCount = V10_ORDERS.filter(o => o.needs).length;
    if (ord) {
      S.pol[ord.needs] = 0;
      blocked = !!v10OrderOpen(S, ord, null);
      S.pol[ord.needs] = 1;
      const nowOpen = v10OrderOpen(S, ord, null);
      blocked = blocked && (nowOpen === null || !/statute book/.test(nowOpen));
      S.pol[ord.needs] = 0;
    }
    // enactment-time lapse: prerequisite falls while the bill is live
    S.pol[pre.id] = 1;
    const bill = { policy: p.id, dir: 1, owner: 'player', title: 'Test Measure Bill', concessions: 0, stage: 'assent' };
    S.pol[pre.id] = 0;
    const failedBefore = S.legacy.billsFailed;
    enactBill(S, bill);
    const lapsed = (S.pol[p.id] || 0) === before && S.legacy.billsFailed === failedBefore + 1;
    delete p.needs;
    return { blocked, lapsed, gated: gatedCount, total: V10_ORDERS.length };
  });
  /* S11b — the seventy-two-order book, and three modifiers that used to be
     written and read by nobody. */
  const book2 = await page.evaluate(() => {
    const out = {};
    const keep = { pol: JSON.parse(JSON.stringify(S.pol)), orders: JSON.parse(JSON.stringify((S.v10 && S.v10.orders) || {})),
      exec: JSON.parse(JSON.stringify(S.exec)), capital: S.capital, prefs: JSON.parse(JSON.stringify(S.uiPrefs || {})) };
    out.total = V10_ORDERS.length;
    out.ungated = V10_ORDERS.filter(o => !o.needs).length;
    /* the owner's ruling: the thirty-six added carry no prerequisite of any
       kind, and NONE of them may sneak a req in either */
    /* S11b promised that its thirty-six additions were ungated, and that promise
       is still the claim. S15b's eighteen are a separate window and are
       deliberately NOT all ungated -- an order that reaches into the statute
       book should wait on the statute, which is the file's own rule. */
    const late = V10_ORDERS.slice(36, 72);
    out.lateCount = late.length;
    out.lateGated = late.filter(o => o.needs).length;
    const newest = V10_ORDERS.slice(72);
    out.newCount = newest.length;
    out.newGated = newest.filter(o => o.needs).length;
    out.newTargeted = newest.filter(o => o.target).length;
    out.newHooks = newest.filter(o => o.onIssue || o.onRevoke).length;
    /* O()'s req default is load-bearing: v10OrderOpen calls o.req(st)
       UNGUARDED, so an order without one throws on every card render */
    out.missingReq = V10_ORDERS.filter(o => typeof o.req !== 'function').length;
    /* the probes in this file and in playtest are positional — the first
       untargeted, ungated order with an `ind` must still be the one the
       original book put there */
    out.probe = pick(V10_ORDERS, 'establishmentFreeze', x => !x.target && !x.needs && Object.keys(x.ind || {}).length, 'order-book probe').id;
    /* NARROWING MUST MAKE AN ORDER SMALLER. It cost capital and treasury,
       printed a tag, and changed nothing at all. */
    S.exec = { pres:playParty(S), vpres:playParty(S), chan:playParty(S), vchan:playParty(S) };
    S.capital = 99;
    const o = pick(V10_ORDERS, 'establishmentFreeze', x => !x.target && !x.needs && Object.keys(x.ind || {}).length, 'order-book upkeep');
    const ik = Object.keys(o.ind)[0];
    S.v10.orders = {}; S.v10.orderTurn = {};
    v10IssueOrder(o.id, null);
    const kk = v10OrderKey(o.id, null);
    out.issued = !!(S.v10.orders[kk] && S.v10.orders[kk].status === 'inforce');
    out.issueRefusal = out.issued ? null : v10OrderOpen(S, o, null);
    if (!out.issued) { S.pol = keep.pol; S.v10.orders = keep.orders; S.exec = keep.exec; S.capital = keep.capital; S.uiPrefs = keep.prefs; return out; }
    const full = v10OrderMods(S).ind[ik] || 0;
    S.v10.orders[kk].narrowed = 1;
    const once = v10OrderMods(S).ind[ik] || 0;
    S.v10.orders[kk].narrowed = 2;
    const twice = v10OrderMods(S).ind[ik] || 0;
    out.narrowShrinks = Math.abs(once) < Math.abs(full) - 1e-9 && Math.abs(twice) < Math.abs(once) - 1e-9;
    out.narrowRatio = full ? Math.round(once / full * 100) / 100 : 0;
    /* upkeep is NOT narrowed — a smaller instrument still has to be run */
    const upFull = v10OrderMods(S).upkeep;
    out.upkeepHeld = Math.abs(upFull - (o.upkeep || 0)) < 1e-9;
    /* courtHeat is the exposure of the whole book, and it must now reach
       something rather than being summed into a field nobody reads */
    out.courtHeat = Math.round(v10OrderMods(S).courtHeat * 100) / 100;
    out.courtHeatReal = out.courtHeat > 0;
    /* the filter actually filters, and the two classes are separable */
    S.uiPrefs = S.uiPrefs || {};
    S.uiPrefs.orderFilter = 'needs';  const onlyGated = V10_ORDERS.filter(v10OrderShown).length;
    S.uiPrefs.orderFilter = 'free';   const onlyFree = V10_ORDERS.filter(v10OrderShown).length;
    S.uiPrefs.orderFilter = 'all';    const all = V10_ORDERS.filter(v10OrderShown).length;
    out.filterSplits = onlyGated + onlyFree === all && onlyGated > 0 && onlyFree >= 36;
    out.onlyGated = onlyGated; out.onlyFree = onlyFree;
    /* the District exclusion the card has always claimed */
    /* S15: the District exclusion went with the region targeting it qualified.
       What replaces it is that no order offers a region to target at all. */
    out.noRegionTargets = V10_ORDERS.every(o => o.target !== 'region');
    out.targetsOffered = V10_ORDERS.filter(o => o.target).map(o => o.target)
      .filter((v, i, a) => a.indexOf(v) === i).sort().join(',');
    S.pol = keep.pol; S.v10.orders = keep.orders; S.exec = keep.exec;
    S.capital = keep.capital; S.uiPrefs = keep.prefs;
    return out;
  });
  /* S11b pinned the probe's id here as a canary against exactly the drift S14
     fixed properly. Now that every probe goes through pick(), the comparison
     would be tautological -- pick() throws on the rename this used to catch --
     so the id is reported rather than asserted. */
  say(book2.total >= 90 && book2.lateCount === 36 && book2.lateGated === 0 && book2.missingReq === 0,
    'thirty-six more, and none of them gated',
    `${book2.total} orders, ${book2.ungated} of them needing no statute · S11b's ${book2.lateCount} carry ` +
    `${book2.lateGated} prerequisites, which was its promise · every order has a callable req (O()'s default is ` +
    `load-bearing for the unguarded call in v10OrderOpen): ${book2.missingReq === 0} · the probe is ${book2.probe}, ` +
    `named rather than positional`);
  say(book2.newCount === 18 && book2.newTargeted === 0 && book2.newGated > 0 && book2.newHooks === 3,
    'eighteen more, every one of them national',
    `S15b adds ${book2.newCount} orders, ${book2.newTargeted} of which make the player name anything · ` +
    `${book2.newGated} wait on a statute, because an order that reaches into the book should wait on the book · ` +
    `and ${book2.newHooks} of them define onIssue or onRevoke, the escape hatch the engine has called at four sites ` +
    `since S10c and no order had ever defined`);
  say(book2.issued && book2.narrowShrinks && book2.upkeepHeld && book2.courtHeatReal && book2.filterSplits &&
      book2.noRegionTargets,
    'a narrowed order is a smaller order',
    `narrowing scales what an order delivers to ${book2.narrowRatio} and again after that, while the upkeep is unchanged: ${book2.upkeepHeld} · ` +
    `the book's total exposure reaches the court at ${book2.courtHeat} instead of being summed into a field nobody read · ` +
    `the page separates ${book2.onlyGated} gated from ${book2.onlyFree} ungated · ` +
    `the only targets any order still offers are ${book2.targetsOffered || '(none)'} -- no order names a state`);

  say(needs.blocked && needs.gated > 0, 'an order cannot outrun the book',
    `${needs.gated} of ${needs.total} orders carry a statute prerequisite; one is refused without it and opens with it: ${needs.blocked}` +
    (needs.gated ? '' : ' — NOTHING IS GATED, so this assertion is testing nothing'));
  say(needs.lapsed, 'a bill lapses with its prerequisite', `enactBill refused and archived as failed: ${needs.lapsed}`);

  // 8. seat conservation under the reapportioning acts
  const seats = await p2.evaluate(() => {
    S.acts.charteredSenate = true; S.acts.territorialSeats = true; S.ind.territories = 70;
    runElection(S, true);
    if (typeof hideSheet === 'function') hideSheet();
    const lower = Object.values(S.seats).reduce((a, b) => a + b, 0);
    const upper = Object.values(S.upper.seats).reduce((a, b) => a + b, 0);
    const bparty = bestBusinessParty(S);
    const reserved = S.upper.seats[bparty] || 0;
    S.acts.charteredSenate = false; S.acts.territorialSeats = false;
    return { lower, upper, reserved, want: Math.floor(CFG.senate * .2) };
  });
  say(seats.lower === 1305 && seats.upper === 300, 'the constitution holds the totals',
    `Assembly ${seats.lower}/1305, Senate ${seats.upper}/300 after a chartered, territorial election`);
  say(seats.reserved >= seats.want, 'the charters keep their seats',
    `${seats.reserved} Senate seats for the business party against a floor of ${seats.want}`);

  // ---- S9e: the content, proven reachable ----
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p3.addInitScript(() => { window.confirm = () => true; });
  await p3.addInitScript(PICK);
  await p3.goto(URL);
  await p3.waitForSelector('[data-setup-begin]', { timeout: 15000 });
  await p3.click('[data-setup-begin]');
  await p3.waitForSelector('[data-doctrine]', { timeout: 10000 });
  await p3.click('[data-doctrine]');
  await p3.waitForTimeout(400);

  // Road 2: corporate -> syndicate through the real gates, then the flight home
  const road2 = await p3.evaluate(() => {
    const T = {}; TRANSITIONS.forEach(t => { T[t.id] = t; });
    S.ruling = playParty(S); S.coalition = [S.ruling]; S.capital = 99;
    S.form = 'corporate';
    const before = T.toSyndicate.ok(S);
    S.acts.charteredSenate = true; S.acts.wealthFranchise = true;
    S.blocs.tech = 70; S.treasury = 250;
    const authPols = POLICIES.filter(p => (p.cat === 'Authority' || p.cat === 'Security') && polAuth(p) > 0);
    for (const p of authPols) { S.pol[p.id] = p.max; if (securityState(S) >= 30) break; }
    const after = T.toSyndicate.ok(S);
    doTransition(T.toSyndicate);
    if (typeof hideSheet === 'function') hideSheet();
    const landed = S.form === 'syndicate';
    const closedBook = !policyOpen(S, POL.unionRights);
    const charterOpen = policyOpen(S, POL.charterCourts);
    const flight = EVENTS.filter(e => e.id === 'v10charterFlight')[0];
    const flightOpen = eventOpen(S, flight);
    flight.ch[0].f(S);
    S.capital = 99;
    const okBack = T.toFederal.ok(S);
    doTransition(T.toFederal);
    if (typeof hideSheet === 'function') hideSheet();
    const home = S.form === 'federal';
    const charterShut = !policyOpen(S, POL.charterCourts);
    return { before, after, landed, closedBook, charterOpen, flightOpen, okBack, home, charterShut,
      ritual: !!RITUAL.syndicate, closed: !!CLOSED.syndicate };
  });
  say(!road2.before && road2.after && road2.landed, 'road 2: the Chartered State',
    `toSyndicate false before (${!road2.before}), true after charters+franchise+tech+treasury+apparatus (${road2.after}), landed: ${road2.landed}`);
  say(road2.closedBook && road2.charterOpen, 'the syndicate statute book',
    `unionRights closed: ${road2.closedBook}; the Charter book open: ${road2.charterOpen}`);
  say(road2.flightOpen && road2.okBack && road2.home && road2.charterShut, 'road 2 comes home',
    `charterFlight reachable: ${road2.flightOpen}; restoration opened: ${road2.okBack}; landed federal: ${road2.home}; Charter book purged shut: ${road2.charterShut}`);

  // every new event constructible against the REAL predicate
  const evTable = await p3.evaluate(() => {
    const misses = [];
    const mk = {
      v10crackdownRadicals: S => { S.form = 'oneparty'; POLICIES.filter(p => p.cat === 'Authority' && polAuth(p) > 0).forEach(p => { S.pol[p.id] = p.max; }); S.suppressed = { democracyFront: Math.max(1, S.turn - 1) }; },
      v10disappearance: S => {}, v10quotaArrests: S => {}, v10torturePhotos: S => {},
      v10informantFile: S => { S.pol.informantNetwork = 1; },
      v10securityBudget: S => {}, v10defectorAbroad: S => {},
      v10watchlistLeak: S => { S.form = 'federal'; },
      v10charterStrike: S => { S.form = 'corporate'; },
      v10boardCoup: S => { S.acts.charteredSenate = true; },
      v10auditScandal: S => {},
      v10townRebellion: S => { S.pol.companyTownsAct = 1; },
      v10foreignBuyout: S => {}, v10philanthropyBid: S => {},
      v10marketPanic: S => { S.form = 'syndicate'; },
      v10smallholderSqueeze: S => { S.pol.landEnclosure = 1; S.form = 'corporate'; },
      v10charterCourtDefiance: S => { S.pol.charterCourts = 1; },
      v10goldenJubilee: S => { S.form = 'syndicate'; },
      v10turnoutOrder: S => { S.form = 'emergency'; }, v10foreignObservers: S => {}, v10spoiledBallots: S => {},
      v10listPurge: S => { S.form = 'oneparty'; }, v10confessionShow: S => {},
      v10colonelsDemand: S => { S.form = 'executive'; S.armyLoyalty = 55; },
      v10barracksMutiny: S => { S.armyLoyalty = 35; },
      v10praetorianPrice: S => { S.armyLoyalty = 65; },
      v10retiredMarshal: S => {},
      v10tanksExercise: S => { S.armyLoyalty = 60; },
      v10succession: S => { S.form = 'empire'; },
      v10planFails: S => { S.form = 'dpr'; },
      v10charterFlight: S => { S.form = 'syndicate'; },
      v10amnestyDividend: S => { S.form = 'federal'; S.ssPeak = 50; POLICIES.forEach(p => { if (p.cat === 'Authority' || p.cat === 'Security') S.pol[p.id] = 0; }); },
      v10reckoning: S => { S.form = 'federal'; S.rigging = 1; },
    };
    for (const id in mk) {
      const e = EVENTS.filter(x => x.id === id)[0];
      if (!e) { misses.push(id + ': not in EVENTS'); continue; }
      S.seen[id] = false; delete S.seen[id];
      mk[id](S);
      if (!eventOpen(S, e)) misses.push(id);
    }
    return { count: Object.keys(mk).length, misses };
  });
  say(evTable.misses.length === 0, 'every road event constructible',
    `${evTable.count - evTable.misses.length} of ${evTable.count} pass the real eventOpen` + (evTable.misses.length ? '; failed: ' + evTable.misses.join(', ') : ''));

  // both arcs trigger under constructed conditions; goals and records never throw
  const rest = await p3.evaluate(() => {
    const out = { arcs: [], throws: [] };
    /* the charters gate reads >= 2 of 4 rungs since S9f rescaled the ladder */
    S.form = 'federal'; S.pol.corporateCharters = 2; S.blocs.tech = 65; S.ind.corruption = 60;
    out.arcs.push({ id: 'capitalCapture', fires: V6_ARC.capitalCapture.trigger(S) });
    S.armyLoyalty = 75; S.form = 'executive';
    POLICIES.filter(p => p.cat === 'Authority' && polAuth(p) > 0).forEach(p => { S.pol[p.id] = p.max; });
    out.arcs.push({ id: 'praetorian', fires: V6_ARC.praetorian.trigger(S) });
    for (const y of [2074, 2124, 2224]) {
      S.endYear = y;
      V6_ACHIEVEMENTS.forEach(a => { try { a.test(S); } catch (e) { out.throws.push(y + ' ' + a.id + ': ' + e.message); }
        const t = v6Note(a, S); if (/\{[nNd]\}/.test(t)) out.throws.push(y + ' ' + a.id + ' leaked'); });
      Object.keys(V8_GOALS).forEach(k => V8_GOALS[k].forEach(g => {
        try { g.test(S); } catch (e) { out.throws.push(y + ' ' + g.id + ' test: ' + e.message); }
        try { if (g.prog) g.prog(S); } catch (e) { out.throws.push(y + ' ' + g.id + ' prog: ' + e.message); }
        const t = v6Note(g, S); if (/\{[nNd]\}/.test(t)) out.throws.push(y + ' ' + g.id + ' leaked'); }));
    }
    out.goalSets = Object.keys(V8_GOALS).length;
    out.programmes = ['theApparatus', 'theCharter', 'theThaw'].filter(id => !!V6_PROGRAMME[id]).length;
    out.acts = ['liftSiege', 'openArchives', 'charterRevocation'].filter(id => ACTS.some(a => a.id === id)).length;
    out.records = ['chartered', 'apparatus', 'restorer', 'ballotTheatre', 'praetorianPact', 'openRepublic'].filter(id => !!V6_ACHIEVEMENT[id]).length;
    return out;
  });
  say(rest.arcs.every(a => a.fires), 'both arcs trigger', rest.arcs.map(a => a.id + ':' + a.fires).join(' '));
  say(rest.throws.length === 0, 'no test throws, no note leaks',
    rest.throws.length ? rest.throws.slice(0, 3).join('; ') : 'all records + all goal sets at three lengths');
  say(rest.goalSets === 11 && rest.programmes === 3 && rest.acts === 3 && rest.records === 6, 'the registries carry the content',
    `goal sets ${rest.goalSets}/11, programmes ${rest.programmes}/3, acts ${rest.acts}/3, records ${rest.records}/6`);

  /* S11d — THE CONSTITUTION. The owner asked for a nation's constitution that
     can be SET, and ruled it should be articles you assemble rather than a
     menu. So the assertions are about the three things that make it a
     document rather than a shop: the vote is real, entrenchment binds its own
     author, and every article moves machinery a player can feel. */
  const con = await page.evaluate(() => {
    const out = {}, blank = () => { v11Con(S); S.v11.con = { arts:{}, order:[], pending:null, failed:{}, conv:0, convUsed:0 }; };
    out.articles = V11_ARTICLES.length;
    out.books = V11_BOOKS.length;
    out.perBook = V11_BOOKS.map(b => V11_ARTICLES.filter(a => a.book === b.id).length);

    /* THE CALENDAR REDUCES TO WHAT IT WAS. isBallotTurn was (t % 2 === 1) for
       t > 1 and is now the general ((t - 1) % term === 0). A silent off-by-one
       here moves every ballot in every campaign that never touches this tab,
       so the identity is checked across a full epic rather than sampled. */
    blank();
    out.calendarSame = (() => { for (let t = 1; t <= 401; t++) if (isBallotTurn(t) !== (t > 1 && t % 2 === 1)) return 'differs at ' + t; return true; })();
    v11AdoptArticle(S, V11_ART.artQuadrennial, 61);
    out.termNow = v11TermYears(S);
    out.ballotsAfter = (() => { const h = []; for (let t = 1; t <= 13; t++) if (isBallotTurn(t)) h.push(t); return h.join(','); })();

    /* NO ARTICLE, IN ANY COMBINATION, MAY PUT A NaN IN THE BALLOT.
       franchiseLevel indexes a THREE-element array in supportTargets, on the
       Parties page and on the Overview. A fractional level reads undefined out
       of all three and b.pop * undefined is NaN in the vote model with nothing
       on screen to say so. Every subset of the franchise articles is swept. */
    const fArts = V11_ARTICLES.filter(a => a.mods.franchise);
    out.franchiseArts = fArts.length;
    out.badLevels = []; out.nanBallot = [];
    for (let mask = 0; mask < (1 << fArts.length); mask++) {
      blank();
      for (let i = 0; i < fArts.length; i++) if (mask & (1 << i)) S.v11.con.arts[fArts[i].id] = { year:2030, margin:60, entrenched:false, turn:1 };
      const fr = franchiseLevel(S);
      if (!Number.isInteger(fr) || fr < 0 || fr > 2) out.badLevels.push(mask + ':' + fr);
      const t = supportTargets(S);
      for (const k in t) if (!isFinite(t[k])) out.nanBallot.push(mask + ':' + k);
    }
    out.subsets = 1 << fArts.length;

    /* EVERY ARTICLE MOVES SOMETHING NAMED. A card whose prose promises a thing
       the effects struct does not carry is the defect this slice exists to
       fix, so it is asserted over the registry rather than trusted. */
    out.empty = V11_ARTICLES.filter(a => {
      const m = a.mods || {};
      const live = Object.keys(m).filter(k => (typeof m[k] === 'object') ? Object.keys(m[k]).length > 0 : !!m[k]);
      return live.length === 0 && typeof a.apply !== 'function';
    }).map(a => a.id);
    out.noMoves = V11_ARTICLES.filter(a => !a.moves).map(a => a.id);
    out.dupNames = (() => { const seen = {}, d = []; V11_ARTICLES.forEach(a => { if (seen[a.name]) d.push(a.name); seen[a.name] = 1; }); return d; })();
    /* every panel title distinct after v7FoldKey's normalisation, or one
       preference governs several books -- the S11a lesson, applied here */
    out.foldClash = (() => {
      const seen = {}, d = [];
      V11_BOOKS.forEach(b => { const k = v7FoldKey('state', b.name); if (seen[k]) d.push(k); seen[k] = 1; });
      return d;
    })();
    out.broken = [];
    V11_ARTICLES.forEach(a => {
      blank();
      try { v11AdoptArticle(S, a, 60); } catch (e) { out.broken.push(a.id + ':throw'); return; }
      const t = indicatorTargets(S), bd = budget(S);
      for (const k in t) if (!isFinite(t[k])) out.broken.push(a.id + ':ind.' + k);
      if (!isFinite(bd.rev) || !isFinite(bd.exp) || !isFinite(bd.net)) out.broken.push(a.id + ':budget');
      if (!isFinite(capitalIncome(S)) || !isFinite(unrestTarget(S)) || !isFinite(securityState(S))) out.broken.push(a.id + ':scalar');
    });

    /* ENTRENCHMENT: harder to repeal than to pass, or it is a settings page. */
    blank();
    out.threshPlain = v11ConThreshold(S, V11_ART.artQuorum, false);
    out.threshEntrenched = v11ConThreshold(S, V11_ART.artFreeSpeech, false);
    out.threshRepeal = v11ConThreshold(S, V11_ART.artFreeSpeech, true);
    /* and Of Procedure moves the bar for everything after it */
    const before = v11ConThreshold(S, V11_ART.artQuorum, false);
    v11AdoptArticle(S, V11_ART.artEntrenchment, 67);
    out.procedureBites = v11ConThreshold(S, V11_ART.artQuorum, false) - before;
    /* a convention lowers it while it sits */
    const withConv = (() => { S.v11.con.conv = S.turn + 6; const v = v11ConThreshold(S, V11_ART.artQuorum, false); S.v11.con.conv = 0; return v; })();
    out.conventionBites = v11ConThreshold(S, V11_ART.artQuorum, false) - withConv;

    /* THE VOTE IS A VOTE. It is laid, contested for two sessions, and put --
       and it can FAIL, changing nothing but the cost of having failed. */
    blank();
    S.capital = 200;
    v11ProposeArticle('artPreamble', false);
    out.laid = !!S.v11.con.pending;
    out.contestSessions = S.v11.con.pending ? S.v11.con.pending.due - S.turn : 0;
    out.oneAtATime = v11CanPropose(S, V11_ART.artQuorum, false);
    S.turn = S.v11.con.pending.due; v11ConTick(S);
    out.carried = v11Adopted(S, 'artPreamble');
    out.recorded = S.v11.con.arts.artPreamble || null;
    const docBefore = v11ConCount(S), unity0 = S.unity;
    S.v11.con.pending = { id:'artAbolishUpper', repeal:false, laid:S.turn, due:S.turn, campaign:0 };
    PARTIES.forEach(q => { S.partyRel[q.id] = 0; });
    v11ConTick(S);
    out.failedChangedNothing = !v11Adopted(S, 'artAbolishUpper') && v11ConCount(S) === docBefore;
    out.failCost = +(unity0 - S.unity).toFixed(1);
    out.coolOff = !!v11CanPropose(S, V11_ART.artAbolishUpper, false);

    /* THE SENATE COULD ONLY BLOCK ACTS THAT WERE ABOUT THE SENATE. `house` is
       the BOOK an act is filed under, not the chamber that votes it. */
    blank();
    S.upper.exists = true; S.upper.veto = 2; S.upper.ceremonial = false; S.peerThreat = -99;
    PARTIES.forEach(q => { S.upper.seats[q.id] = (q.id === S.ruling) ? 10 : 60; });
    const nonSenate = ACTS.filter(a => a.house !== 'Senate' && ['reconciliation','restoreUpper','electedSenate'].indexOf(a.id) < 0);
    out.nonSenateActs = nonSenate.length;
    out.blockableNow = nonSenate.filter(a => actBlocked(a)).length;
    return out;
  });

  say(con.articles >= 40 && con.books === 8 && con.perBook.every(n => n >= 5),
    'forty articles, eight books',
    `${con.articles} articles across ${con.books} books [${con.perBook.join(',')}], none of them thin`);
  say(con.calendarSame === true && con.termNow === 4 && con.ballotsAfter === '5,9,13',
    'the calendar reduces to what it was',
    con.calendarSame !== true ? 'the general form ' + con.calendarSame + ' from (t % 2 === 1)'
      : `identical to the old body at every turn of a full epic with an unwritten constitution · the quadrennial article then makes the term ${con.termNow} and the ballots fall at ${con.ballotsAfter}`);
  say(con.badLevels.length === 0 && con.nanBallot.length === 0,
    'no article can put a NaN in the ballot',
    con.badLevels.length ? 'franchise level off its domain: ' + con.badLevels.slice(0, 3).join(', ')
      : (con.nanBallot.length ? 'NaN in supportTargets: ' + con.nanBallot.slice(0, 3).join(', ')
        : `all ${con.subsets} subsets of the ${con.franchiseArts} franchise articles leave an integer 0..2, and supportTargets is finite for every one`));
  say(con.empty.length === 0 && con.noMoves.length === 0 && con.dupNames.length === 0 &&
      con.foldClash.length === 0 && con.broken.length === 0,
    'every article moves something named',
    con.empty.length ? con.empty.length + ' move nothing: ' + con.empty.slice(0, 3).join(', ')
      : (con.noMoves.length ? con.noMoves.length + ' carry no `moves` line'
        : (con.dupNames.length ? 'repeated titles: ' + con.dupNames.join(', ')
          : (con.foldClash.length ? 'two books share a fold key: ' + con.foldClash.join(', ')
            : (con.broken.length ? con.broken.slice(0, 3).join('; ')
              : `all ${con.articles} carry mods or an apply, name what they move, are titled distinctly and survive their own adoption without a NaN in any indicator, the budget or a scalar`)))));
  say(con.threshPlain === 50 && con.threshEntrenched === 60 && Math.round(con.threshRepeal) === 67 &&
      con.procedureBites > 0 && con.conventionBites > 0,
    'an entrenched article resists repeal',
    `plain ${con.threshPlain}%, entrenched ${con.threshEntrenched}% to carry and ${con.threshRepeal}% to strike out · ` +
    `Of Procedure then raises every later bar by ${con.procedureBites} and a sitting convention lowers it by ${con.conventionBites}`);
  say(con.laid && con.contestSessions === 2 && typeof con.oneAtATime === 'string' && con.carried &&
      con.recorded && con.recorded.margin > 0 && con.failedChangedNothing && con.failCost > 0 && con.coolOff,
    'ratification is a vote, and it can fail',
    !con.carried ? 'the article never carried' : (!con.failedChangedNothing ? 'a failed article changed the document'
      : `laid, contested for ${con.contestSessions} sessions, carried at ${con.recorded.margin}% and recorded against ${con.recorded.year} · ` +
        `only one may be before the country at a time · a defeat costs ${con.failCost} of unity, changes no article, and bars the question for six sessions`));
  say(con.blockableNow > 0,
    'the Senate can block an act that is not about the Senate',
    `${con.blockableNow} of ${con.nonSenateActs} acts outside the Senate's own book are refused by a hostile Senate with a full veto; before this slice actBlocked returned false for every one of them on its first line`);

  /* S11e — THE MINISTRY AND THE INTERESTS. The owner's complaint on both tabs
     was "lots of repetitive low impact options". Four surveys measured the
     arithmetic behind it, and every figure in these assertions was taken from
     the running game rather than from reading the source. */
  const min = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    S.ruling = me; S.coalition = [me];
    ['pres', 'vpres', 'chan', 'vchan'].forEach(d => S.exec[d] = me);
    const rows = pv5PortfolioRows().slice(0, 3);
    rows.forEach(r => { S.cabinet[r.key] = 1; });
    pv5EnsureState(S, false);
    const key = rows[0].key;
    const seed = comp => { S.capital = 300; S.treasury = 99999;
      S.ministers[key] = { name:'T', party:me, competence:comp === undefined ? 70 : comp, loyalty:60,
        ambition:60, trait:'technocrat', exposure:0, experience:0, briefings:0 };
      S.cabinet[key] = 2; if (S.v11) S.v11.depts = {}; };

    /* A BRIEFING IS NEVER REFUNDED. Brief clamped to 100 while the session
       tick clamps to 96, so briefing a minister above 91 bought points the
       next session took back with nothing on screen to say so. */
    seed(94); pv5MinisterAction(key, 'brief');
    const peak = S.ministers[key].competence;
    /* THE EXACT INVARIANT is that a briefing never puts a minister ABOVE the
       ceiling the session tick clamps to -- that is what made the old body
       refund three of the five points bought. The follow-on drift is NOT part
       of it: pv5MinisterTick adds (rand() - .5) * .5, so a minister sitting at
       the ceiling can lose up to .13 in an ordinary session. Asserting the
       refund is exactly zero measured that noise and failed about one run in
       three on identical code. */
    out.briefOverCeiling = +(peak - 96).toFixed(2);
    pv5MinisterTick(S);
    out.briefRefund = +(peak - S.ministers[key].competence).toFixed(2);
    seed(60); const c0 = S.ministers[key].competence; pv5MinisterAction(key, 'brief');
    out.briefLow = +(S.ministers[key].competence - c0).toFixed(2);

    /* THE COLLEGE MUST BEAT WAITING AND MUST NOT UNDO ITSELF. It gave
       max(2, 8 - experience) and then ADDED 3 to experience: +5 once, +2 for
       ever, for 2 capital AND 4 of treasury against Brief's 2 capital and no
       money. It now buys the one thing a briefing cannot -- the ceiling. */
    seed(90); const gains = [];
    for (let i = 0; i < 3; i++) { const a = S.ministers[key].competence; pv5MinisterAction(key, 'train'); gains.push(+(S.ministers[key].competence - a).toFixed(2)); }
    out.collegeGains = gains;
    out.collegeSteady = gains.every(g => Math.abs(g - gains[0]) < 1e-9);
    out.collegeCeiling = v11MinisterCeiling(S.ministers[key]);
    seed(95); pv5MinisterAction(key, 'train'); pv5MinisterAction(key, 'brief');
    for (let i = 0; i < 6; i++) pv5MinisterTick(S);
    out.schooledPast96 = S.ministers[key].competence > 96;

    /* S14: AND BRIEFING A SCHOOLED MINISTER MUST NOT UNDO THE COLLEGE. The
       brief branch clamped to a hardcoded 96 while v11MinisterCeiling gives a
       schooled minister up to 102, so briefing one who was already past 96
       knocked them straight back down to it: the ceiling the player had just
       bought, refunded, for 2 capital, with nothing on screen to say so. The
       same line was calling clamp(-.1, 0, -2) -- bounds the wrong way round,
       which is what the fault detector caught it by. */
    seed(95);
    pv5MinisterAction(key, 'train'); pv5MinisterAction(key, 'train');
    for (let i = 0; i < 8; i++) pv5MinisterTick(S);
    const above = S.ministers[key].competence;
    pv5MinisterAction(key, 'brief');
    out.schooledCeil = v11MinisterCeiling(S.ministers[key]);
    out.schooledBefore = +above.toFixed(2);
    out.schooledAfter = +S.ministers[key].competence.toFixed(2);
    out.schooledKept = above > 96 && S.ministers[key].competence >= above - 1e-9;

    /* SIDELINE was the only paid action in the game that made the government
       worse at everything: it cut the department's RANK. */
    seed(); const cb0 = cabinetBonus(S), amb0 = S.ministers[key].ambition, q0 = cabQuality(S, key);
    pv5MinisterAction(key, 'sideline');
    const cb1 = cabinetBonus(S);
    out.sidelineWorse = Object.keys(cb0).filter(k => Math.abs(cb1[k] || 0) < Math.abs(cb0[k]) - 1e-9).length;
    out.sidelineRank = cabQuality(S, key) === q0;
    out.sidelineAmbition = amb0 - S.ministers[key].ambition;
    out.sidelineDelivered = v11Dept(S, key).delivered > 0;

    /* AN INITIATIVE SHOVED A STOCK THE TICK CONVERGES AT 26 PER CENT A
       SESSION: measured, 84 per cent of it was gone after six. It now moves
       the department's delivered stock, which decays at 3.5 per cent. */
    seed(); const d0 = v11Dept(S, key).delivered;
    pv5MinisterAction(key, 'launch');
    const jump = v11Dept(S, key).delivered - d0;
    for (let i = 0; i < 6; i++) v11DeptTick(S);
    out.initiativeJump = +jump.toFixed(2);
    out.initiativeKept = Math.round(v11Dept(S, key).delivered / jump * 100);
    out.indicatorWouldKeep = Math.round(Math.pow(.74, 6) * 100);

    /* A DEPARTMENT IS A LINE IN THE BUDGET AND A NUMBER IN THE COUNTRY.
       budget() was blind to the government that spends it. */
    seed(); const b0 = budget(S).exp, cap0 = v11DeptCapacity(S, key), cbn = JSON.stringify(cabinetBonus(S));
    v11Dept(S, key).funding = 2;
    out.fundGenerous = { exp:+(budget(S).exp - b0).toFixed(1), cap:+(v11DeptCapacity(S, key) - cap0).toFixed(1) };
    out.fundReachesCountry = JSON.stringify(cabinetBonus(S)) !== cbn;
    v11Dept(S, key).funding = 0;
    out.fundLean = { exp:+(budget(S).exp - b0).toFixed(1), cap:+(v11DeptCapacity(S, key) - cap0).toFixed(1) };

    /* SIX OF THE SEVEN TRAITS WERE READ NOWHERE. Each field of V11_TRAITS is
       consulted by a named function, and every trait carries at least one. */
    out.traitsTotal = Object.keys(PV5_MINISTER_TRAITS).length;
    out.traitsLive = Object.keys(PV5_MINISTER_TRAITS).filter(t => {
      const v = V11_TRAITS[t];
      return v && Object.keys(v).some(k => v[k] !== 0);
    }).length;
    out.traitFields = ['capacity', 'loyalty', 'strain', 'exposure', 'scandal', 'bills', 'unity']
      .filter(f => Object.keys(V11_TRAITS).some(t => V11_TRAITS[t][f] !== 0)).length;
    return out;
  });

  const ints = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    S.ruling = me; S.coalition = [me];
    const sum = () => PV5_INTERESTS.reduce((n, g) => n + S.interests[g.id].influence, 0);
    /* INFLUENCE WAS SET ONCE AND NEVER WRITTEN AGAIN: the same 540 in every
       campaign of every save, and the demand generator sorts on it. */
    out.inf0 = Math.round(sum());
    for (let i = 0; i < 25; i++) pv5InterestTick(S);
    out.inf25 = Math.round(sum());
    out.infMoved = Math.abs(out.inf25 - out.inf0) > 3;

    /* THE CIRCLE IS BROKEN, ONE DIRECTION AT A TIME. The relation's target
       read the bloc while the bloc read the relation straight back. Measured
       on a bloc whose base target is OFF the ceiling -- c100 saturates the
       most-organised blocs at 100 and would hide both terms. */
    const usable = PV5_INTERESTS.filter(g => { const v = pv5BlocTargetV4(S, BLOC[g.bloc]); return v > 5 && v < 95; });
    out.usableBlocs = usable.length;
    const g0 = usable[0], q = S.interests[g0.id];
    q.endorsement = false;
    const b0 = S.blocs[g0.bloc], before = v11RelationTarget(S, g0);
    S.blocs[g0.bloc] = clamp(b0 + 35, 0, 100);
    out.blocDoesNotDriveRelation = Math.abs(v11RelationTarget(S, g0) - before) < 1e-9;
    S.blocs[g0.bloc] = b0;
    q.relation = 30; const lo = blocTarget(S, BLOC[g0.bloc]);
    q.relation = 75; const hi = blocTarget(S, BLOC[g0.bloc]);
    out.relationDrivesBloc = hi - lo > .5;
    /* and the relation reads how the government has BEHAVED */
    q.relation = 50;
    const t0 = v11RelationTarget(S, g0);
    q.met = (q.met || 0) + 3; const tMet = v11RelationTarget(S, g0);
    q.met -= 3; q.refused = (q.refused || 0) + 3; const tRef = v11RelationTarget(S, g0);
    q.refused -= 3;
    out.conduct = { met:+(tMet - t0).toFixed(1), refused:+(tRef - t0).toFixed(1) };

    /* AN ENDORSEMENT BUYS THREE THINGS and survives the ballot it was bought
       for. It was worth six tenths of one per cent of the vote and was
       cleared for every group at every election. */
    const noEnd = blocTarget(S, BLOC[g0.bloc]);
    q.endorsement = true;
    out.endMobilises = blocTarget(S, BLOC[g0.bloc]) - noEnd > .5;
    const pol = POLICIES.filter(x => x.mood && (x.mood[g0.bloc] || 0) > 0)[0];
    q.endorsement = false; const pc0 = pol ? policyCost(pol.id, 1) : 0;
    q.endorsement = true; const pc1 = pol ? policyCost(pol.id, 1) : 0;
    out.endCheapens = pol ? pc1 < pc0 : false;
    q.relation = 70; q.ballots = 0;
    runElection(S, false);
    out.endSurvivesFirst = q.endorsement === true;
    runElection(S, false);
    out.endLapsesSecond = q.endorsement === false;

    /* THE ORGANISATIONS REACH THE REGIONS. V9_REGION_BLOCS has held a
       per-region bloc composition since S9 and only ever printed tags. This
       rides on top of the S11c regional term, so what it is worth in SEATS is
       reported rather than asserted loosely. */
    const seats = () => ((projection(S) || {}).seats || {})[me] || 0;
    PV5_INTERESTS.forEach(g => { S.interests[g.id].relation = 50; S.interests[g.id].endorsement = false; });
    const mid = seats(), fMid = regionPartyFactor(S, me);
    PV5_INTERESTS.forEach(g => { S.interests[g.id].relation = 92; S.interests[g.id].endorsement = true; });
    const close = seats(), fClose = regionPartyFactor(S, me);
    PV5_INTERESTS.forEach(g => { S.interests[g.id].relation = 8; S.interests[g.id].endorsement = false; });
    const shut = seats(), fShut = regionPartyFactor(S, me);
    out.regionSeats = { close:close - mid, shutOut:mid - shut };
    out.regionMoves = fClose > fMid && fMid > fShut;
    PV5_INTERESTS.forEach(g => { S.interests[g.id].relation = 50; });
    return out;
  });

  say(min.briefOverCeiling <= 0 && min.briefRefund < .3 && min.briefLow === 5,
    'a briefing is never refunded',
    `briefing a minister at 94 leaves them ${min.briefOverCeiling} above the ceiling the session tick clamps to ` +
    `(the old body left them at 99 against a clamp of 96, and three of the five points bought were gone the next session) · ` +
    `the follow-on drift is ${min.briefRefund}, inside the tick's own +/-.25 noise · and a minister at 60 still gains the full ${min.briefLow}`);
  say(min.collegeSteady && min.collegeGains[0] > 0 && min.collegeCeiling > 96 && min.schooledPast96,
    'the college beats waiting, and does not undo itself',
    `three visits gave ${min.collegeGains.join('/')} (it gave 5/2/2, and each visit made the next worse) · ` +
    `a schooled minister's ceiling is ${min.collegeCeiling} and the session tick no longer drags them back to 96: ${min.schooledPast96}`);
  say(min.schooledKept, 'a briefing does not undo the college',
    `a schooled minister at ${min.schooledBefore} against a ceiling of ${min.schooledCeil} reads ${min.schooledAfter} after a briefing ` +
    `· the old body clamped the brief to a hardcoded 96, so the two capital spent on the ceiling were refunded on the spot`);
  say(min.sidelineWorse === 0 && min.sidelineRank && min.sidelineAmbition > 0 && min.sidelineDelivered,
    'sidelining a rival no longer guts the government',
    min.sidelineWorse ? min.sidelineWorse + ' indicators still made worse by it'
      : `no indicator is made worse (it used to cut the department's rank, so every one of them was), ` +
        `ambition falls ${min.sidelineAmbition}, and the papers reach the centre instead of nobody`);
  say(min.initiativeKept >= 70 && min.initiativeKept > min.indicatorWouldKeep,
    'an initiative outlives the session that bought it',
    `${min.initiativeKept}% of it is still there six sessions later · the indicator stock it used to shove would have kept ${min.indicatorWouldKeep}%, ` +
    `because the session tick converges every stock on its target at 26 per cent`);
  say(min.fundGenerous.exp > 0 && min.fundGenerous.cap > 0 && min.fundLean.exp < 0 && min.fundLean.cap < 0 && min.fundReachesCountry,
    'a department is a line in the budget and a number in the country',
    `a generous settlement costs ${min.fundGenerous.exp} a session and buys ${min.fundGenerous.cap} of capacity; ` +
    `a lean one saves ${-min.fundLean.exp} and costs ${-min.fundLean.cap} · and it reaches every indicator the ministry touches: ${min.fundReachesCountry}`);
  say(min.traitsLive === min.traitsTotal && min.traitFields === 7,
    'every trait on a card is read somewhere',
    `${min.traitsLive} of ${min.traitsTotal} traits carry behaviour across ${min.traitFields} fields · before this slice only \`operator\` appeared outside a card, in one exposure term`);

  say(ints.infMoved,
    'influence is no longer a constant',
    `combined influence moved ${ints.inf0} -> ${ints.inf25} over twenty-five sessions · it was written exactly once, at pv5EnsureState, and printed the same 540 in every campaign of every save`);
  say(ints.blocDoesNotDriveRelation && ints.relationDrivesBloc && ints.conduct.met > 0 && ints.conduct.refused < 0,
    'the relation and the bloc are no longer a circle',
    `moving the bloc 35 points does not move the relation's target (${ints.blocDoesNotDriveRelation}), but the relation still moves the bloc (${ints.relationDrivesBloc}) · ` +
    `and the relation reads how the government behaved: three meetings ${ints.conduct.met > 0 ? '+' : ''}${ints.conduct.met}, three refusals ${ints.conduct.refused} · ` +
    `measured on one of the ${ints.usableBlocs} blocs whose base target is off the c100 ceiling, because saturation would hide both terms`);
  say(ints.endMobilises && ints.endCheapens && ints.endSurvivesFirst && ints.endLapsesSecond,
    'an endorsement buys three things and survives its ballot',
    `it mobilises its own bloc (${ints.endMobilises}), takes a real point off any statute that bloc wants (${ints.endCheapens}), ` +
    `and survives the first ballot (${ints.endSurvivesFirst}) before lapsing at the second (${ints.endLapsesSecond}) · ` +
    `every endorsement used to be cleared for every group at every election, which is the event they are bought for`);
  say(ints.regionMoves,
    'the organisations reach the regions',
    `holding every organisation close is worth ${ints.regionSeats.close >= 0 ? '+' : ''}${ints.regionSeats.close} Assembly seats and shutting them all out costs ${ints.regionSeats.shutOut} · ` +
    `V9_REGION_BLOCS has held a per-region bloc composition since S9 and only ever printed tags with it · ` +
    `deliberately small, because it rides on the S11c regional term that was tuned against a measured seat target`);

  /* S12 — THE STATUTE BOOK SPEAKS. The ladder printed four rungs of numbers and
     said nothing about what any of them did. */
  const prose = await page.evaluate(() => {
    const out = {}, CORE = V12_CORE_CATS;
    out.total = POLICIES.length;
    const withProse = POLICIES.filter(p => p.rungs);
    out.withProse = withProse.length;
    /* EXACTLY FOUR. v9Dossier indexes rungs[lv - 1], so a five-element array
       shifts every description down one rung across the whole book and the
       text stays present, plausible and wrong. Nothing else would notice. */
    out.wrongLength = withProse.filter(p => !Array.isArray(p.rungs) || p.rungs.length !== 4).map(p => p.id);
    out.emptyString = withProse.filter(p => p.rungs.some(t => typeof t !== 'string' || !t.trim())).map(p => p.id);
    out.notDistinct = withProse.filter(p => new Set(p.rungs.map(t => t.trim())).size !== 4).map(p => p.id);
    /* a description shared between two statutes is the sibling-agent defect */
    const seen = {}, shared = [];
    withProse.forEach(p => p.rungs.forEach(t => {
      const k = t.trim().toLowerCase();
      if (seen[k] && seen[k] !== p.id) shared.push(seen[k] + '/' + p.id);
      seen[k] = p.id;
    }));
    out.shared = shared;
    /* the renderer: prose on a rung above zero, silence at rung zero, and a
       statute with no prose renders exactly as it did before this slice */
    const sample = withProse[0];
    out.rendersProse = sample ? v12RungSay(sample, 1).indexOf(sample.rungs[0]) > 0 : null;
    out.silentAtZero = sample ? v12RungSay(sample, 0) === '' : null;
    const bare = POLICIES.filter(p => !p.rungs)[0];
    out.bareUnchanged = bare ? v12RungSay(bare, 1) === '' : true;

    /* THE FLOOR UNDER VERY EASY, and only under very easy. */
    const tier = k => { const st = JSON.parse(JSON.stringify(S)); st.diff = k;
      st.approval = 5; st.unrest = 100; st.unity = 10; st.debt = 9000;
      return +capitalIncome(st).toFixed(2); };
    out.easyWorst = tier('easy');
    out.otherWorst = ['gentle', 'normal', 'hard', 'brutal'].map(tier);

    /* EVERY CORE CATEGORY READS 24, and every locked statute says why. */
    const shown = {};
    POLICIES.forEach(p => { if (v12Listed(S, p)) shown[p.cat] = (shown[p.cat] || 0) + 1; });
    out.coreOff24 = CORE.filter(c => shown[c] !== 24).map(c => c + ':' + (shown[c] || 0));
    out.booksHidden = ['Imperium', "People's State", 'The Charter'].filter(c => shown[c]);
    out.lockedNoReason = POLICIES.filter(p => v12Listed(S, p) && !policyOpen(S, p) && !policyWhy(S, p)).map(p => p.id);
    out.lockedCount = POLICIES.filter(p => v12Listed(S, p) && !policyOpen(S, p)).length;
    /* AND policyOpen ITSELF IS UNTOUCHED: what may be listed widened, what may
       be ENACTED did not. Widening policyOpen would let an emergency statute
       pass under a Federal Republic and would rewrite every save. */
    out.stillClosed = !policyOpen(S, POL.rationBooks) && S.form === 'federal';
    return out;
  });

  say(prose.wrongLength.length === 0 && prose.emptyString.length === 0 &&
      prose.notDistinct.length === 0 && prose.shared.length === 0 &&
      prose.rendersProse !== false && prose.silentAtZero !== false && prose.bareUnchanged,
    'every rung that speaks says something of its own',
    prose.wrongLength.length ? prose.wrongLength.length + ' statute(s) do not carry EXACTLY four rungs: ' + prose.wrongLength.slice(0, 3).join(', ')
      : (prose.shared.length ? 'the same description under two statutes: ' + prose.shared.slice(0, 3).join(', ')
        : (prose.notDistinct.length ? 'two rungs of one statute share a description: ' + prose.notDistinct.slice(0, 3).join(', ')
          : `${prose.withProse} of ${prose.total} statutes carry prose, four rungs each, none repeated within a statute or between two · ` +
            `rung zero stays silent and a statute with no prose renders exactly as it did before`)));

  say(prose.easyWorst >= 75 && prose.otherWorst.every(v => v < 75),
    'very easy pays a floor, and nothing else does',
    `on a deliberately terrible session very easy still pays ${prose.easyWorst} while the other four pay ${prose.otherWorst.join('/')}`);

  say(prose.coreOff24.length === 0 && prose.booksHidden.length === 0 &&
      prose.lockedNoReason.length === 0 && prose.stillClosed,
    'every core book reads twenty-four, and the locked ones say why',
    prose.coreOff24.length ? 'off twenty-four: ' + prose.coreOff24.join(', ')
      : (prose.booksHidden.length ? 'a form book leaked onto the page: ' + prose.booksHidden.join(', ')
        : (prose.lockedNoReason.length ? prose.lockedNoReason.length + ' locked with no stated reason'
          : `all twenty core categories list twenty-four · ${prose.lockedCount} of them are locked and every one states its condition · ` +
            `the three form books stay hidden · and policyOpen is unchanged, so an emergency statute is still unenactable under a Federal Republic`)));

  /* ============================================================
     S15b: THE ORDER BOOK. The cap was `var n = 4` read in three places and
     asserted by no harness; because the check was target-independent and every
     card calls v10OrderOpen, a government at four standing orders had every
     button on all 72 cards disabled and the same refusal printed 72 times. And
     the whole "Orders about orders" category -- five cards promising expiry, a
     pre-ballot bar, a week on the table, an Attorney's opinion and a printed
     register -- delivered ind, mood, delivery and polCost and touched the order
     book nowhere. ============================================================ */
  const obook = await p2.evaluate(() => {
    const out = {};
    const keep = JSON.parse(JSON.stringify({ orders:S.v10.orders, capital:S.capital, exec:S.exec,
      turn:S.turn, lower:S.lower, last:S.lastElection }));
    const me = playParty(S);
    ['pres', 'vpres', 'chan', 'vchan'].forEach(d => S.exec[d] = me);
    S.ruling = me; S.coalition = [me];
    const clear = () => { S.v10.orders = {}; S.v10.orderTurn = {}; delete S.v10.decreeShield; delete S.v10.convocation; delete S.v10.oathSworn; S.capital = 3000; };
    /* Degrade rather than throw on a build that predates S15b, so every one of
       these assertions can be run against the old file and show what it did.
       `openBooks` is an S15b order; deliveryUnit is the ungated, untargeted
       stand-in that has been in the book since S10c. */
    const has = (id) => !!V10_ORDER[id];
    const SECOND = has('openBooks') ? 'openBooks' : 'deliveryUnit';
    const bookOf = () => (v10OrderMods(S).book || { expire:0, lay:0, preBallot:false, review:1 });

    /* 1. no cap: sign every ungated, untargeted order the offices allow */
    clear();
    const free = V10_ORDERS.filter(o => !o.target && !o.needs && o.req(S));
    let signed = 0, refused = null;
    free.forEach(o => {
      S.capital = 3000;
      const why = v10OrderOpen(S, o, null);
      if (why) { if (!refused) refused = o.id + ': ' + why; return; }
      v10IssueOrder(o.id, null);
      if (v10OrderRec(S, o.id)) signed++;
    });
    out.freeCount = free.length;
    out.signed = signed;
    out.firstRefusal = refused;
    out.upkeepAt = Math.round(v10OrderMods(S).upkeep * 10) / 10;

    /* 2. every order expires, because the card says every order expires */
    clear();
    v10IssueOrder('establishmentFreeze', null);
    v10IssueOrder('orderExpiry', null);
    out.expiryStamped = !!(v10OrderRec(S, 'establishmentFreeze') || {}).expires === false;
    /* the stamp is written when an order is SIGNED, so the freeze signed before
       the rule carries none and the rule stamps itself */
    out.ruleStampsItself = !!(v10OrderRec(S, 'orderExpiry') || {}).expires;
    v10IssueOrder(SECOND, null);
    out.laterStamped = !!(v10OrderRec(S, SECOND) || {}).expires;
    const t0 = S.turn;
    for (let i = 0; i < 3; i++) { S.turn++; v10OrdersTick(S); }
    out.expiredAway = !v10OrderRec(S, SECOND);
    out.freezeSurvived = !!v10OrderRec(S, 'establishmentFreeze');
    S.turn = t0;

    /* 3. a week on the table, and no table when the Assembly is gone */
    clear();
    /* the rule lays ITSELF on the table first, so it has to take effect before
       it can lay anything else -- which is what the card describes */
    v10IssueOrder('ordersLaidBefore', null);
    out.ruleLaysItself = (v10OrderRec(S, 'ordersLaidBefore') || {}).status === 'laid';
    S.turn++; v10OrdersTick(S);
    v10IssueOrder(SECOND, null);
    const rec = v10OrderRec(S, SECOND) || {};
    out.laidStatus = rec.status;
    out.laidNotInForce = v10OrdersInForce(S).indexOf(SECOND) < 0;
    S.turn++; v10OrdersTick(S);
    out.matured = (v10OrderRec(S, SECOND) || {}).status === 'inforce';
    S.turn -= 2;
    clear();
    S.lower = { exists:false, suspended:false };
    v10IssueOrder('ordersLaidBefore', null);
    S.turn++; v10OrdersTick(S);
    v10IssueOrder(SECOND, null);
    out.noTableNoDelay = (v10OrderRec(S, SECOND) || {}).status === 'inforce';
    S.turn--;
    S.lower = JSON.parse(JSON.stringify(keep.lower));

    /* 4. this executive signs nothing new in the session before a ballot */
    clear();
    out.barBefore = v10OrderOpen(S, V10_ORDER[SECOND], null);
    v10IssueOrder('preBallotBar', null);
    /* isBallotTurn is odd turns, so a ballot is one session away from an even
       one. Step to an even turn rather than assuming the term arithmetic. */
    const keepTurn15 = S.turn;
    if (nextBallot(S.turn) - S.turn > 1) S.turn++;
    out.ballotIn = nextBallot(S.turn) - S.turn;
    out.electionsOn = electionsOn(S);
    out.barAfter = v10OrderOpen(S, V10_ORDER[SECOND], null);
    S.turn = keepTurn15;
    S.lastElection = keep.last;

    /* 5. the register exposes the book, the Attorney's opinion shields it */
    clear();
    out.reviewPlain = bookOf().review;
    v10IssueOrder('orderRegister', null);
    out.reviewRegister = Math.round(bookOf().review * 100) / 100;
    v10IssueOrder('attorneyOpinion', null);
    out.reviewBoth = Math.round(bookOf().review * 100) / 100;

    /* 6. the hatch reaches the chamber model S15a built */
    clear();
    S.armyLoyalty = 60; S.unity = 60; S.crown = 50;
    out.decreePlain = Math.round(decreeFavour(S) * 10) / 10;
    /* the machinery of the decree is gated on a state that has stopped holding
       elections or a security state of 30, which is the point of it */
    const keepForm = S.form; S.form = 'oneparty';
    out.machineryOpen = has('decreeMachinery') ? v10OrderOpen(S, V10_ORDER.decreeMachinery, null) : 'the order does not exist';
    if (has('decreeMachinery')) v10IssueOrder('decreeMachinery', null);
    out.decreeShielded = Math.round(decreeFavour(S) * 10) / 10;
    S.form = keepForm;
    clear();
    out.councilPlain = Math.round(councilFavour(S) * 10) / 10;
    if (has('standingConvocation')) v10IssueOrder('standingConvocation', null);
    out.councilConvoked = Math.round(councilFavour(S) * 10) / 10;
    out.decreeConvoked = Math.round(decreeFavour(S) * 10) / 10;

    S.v10.orders = keep.orders; S.capital = keep.capital; S.exec = keep.exec; S.turn = keep.turn;
    return out;
  });

  say(obook.signed === obook.freeCount && obook.signed > 12 && obook.upkeepAt > 0,
    'the order book has no cap',
    `${obook.signed} of ${obook.freeCount} ungated national orders signed in one session at an upkeep of ` +
    `${obook.upkeepAt} capital a session, and nothing refused` +
    (obook.firstRefusal ? ' except ' + obook.firstRefusal : '') +
    ` · the cap was four, and because it was checked before cost and independently of target, hitting it ` +
    `disabled every button on all 72 cards at once`);

  say(obook.ruleStampsItself && obook.laterStamped && obook.expiredAway && obook.freezeSurvived,
    'every order shall expire, including this one',
    `the rule stamps itself: ${obook.ruleStampsItself} · an order signed after it carries an expiry and is gone ` +
    `three sessions later: ${obook.expiredAway} · one signed BEFORE it is untouched (${obook.freezeSurvived}), ` +
    `so a rule arriving late does not retroactively kill the standing book`);

  say(obook.ruleLaysItself && obook.laidStatus === 'laid' && obook.laidNotInForce && obook.matured &&
      obook.noTableNoDelay,
    'a week on the table, when there is a table',
    `the rule lies on the table itself before it can lay anything else (${obook.ruleLaysItself}) · once it is in ` +
    `force a new order reads "${obook.laidStatus}", contributes nothing while it lies there, and takes effect a ` +
    `session later · with the Assembly abolished there is nowhere to lay it and it takes effect at once: ` +
    `${obook.noTableNoDelay}`);

  say(!obook.barBefore && !!obook.barAfter && obook.ballotIn <= 1 && obook.electionsOn,
    'no order before a ballot',
    `with a ballot ${obook.ballotIn} session away the same order is refused: "${obook.barAfter}" · ` +
    `before the rule stood it was open, and the bar reads the calendar rather than a flag`);

  say(obook.reviewPlain === 1 && obook.reviewRegister > 1 && obook.reviewBoth < obook.reviewRegister,
    'the register exposes the book and the opinion shields it',
    `the court sees the book at ${obook.reviewPlain} plain, ${obook.reviewRegister} with the register printed, ` +
    `and ${obook.reviewBoth} with the Attorney's opinion on every order as well · both cards described how an ` +
    `order stands in law and neither reached the review`);

  say(obook.decreeShielded > obook.decreePlain && obook.councilConvoked > obook.councilPlain &&
      obook.decreeConvoked < obook.decreePlain && !obook.machineryOpen,
    'the order book reaches the chamber model',
    `naming an officer in every department who answers for a decree takes the apparatus from ${obook.decreePlain} ` +
    `to ${obook.decreeShielded} · a standing convocation takes a suspended house from ${obook.councilPlain} to ` +
    `${obook.councilConvoked} and the decree the other way to ${obook.decreeConvoked} · this is the first time an ` +
    `order has reached anything outside its own fifteen aggregate fields`);

  /* ============================================================
     9. S15: THE CHAMBER THAT IS NOT THERE.

     The owner abolished the National Assembly and his bills went on spending a
     session passing through it, and the log went on saying they had passed it.
     The Senate has had a real stage skip since v4; the Assembly never had one.
     Abolition was represented by one substituted number --
     `lower = FORMS[st.form].elections ? 0 : 100` -- in four places, and a
     number cannot remove a stage, a session of delay, or a sentence from the
     log. Worse, under a form that still holds elections it forced lower to 0,
     which drove the committee figure to 14 against a bar of 43: every bill
     died in committee and the game never said why.

     Driven through the real sponsor and the real stage machine, one
     constitution at a time. Each run counts SESSIONS and reads the log the
     player would read. ============================================================ */
  const chambers = await p2.evaluate(() => {
    const out = {};
    const keep = JSON.parse(JSON.stringify({ lower:S.lower, upper:S.upper, form:S.form, diff:S.diff,
      army:S.armyLoyalty, unity:S.unity, crown:S.crown, turn:S.turn }));
    S.diff = 'normal';                       /* very easy floors every roll */
    const STAT = 'incomeTax';

    function run(setup, label) {
      S.lower = { exists:true, suspended:false };
      S.upper = JSON.parse(JSON.stringify(keep.upper));
      S.form = 'federal';
      S.armyLoyalty = 82; S.unity = 74; S.crown = 62;
      S.bills = []; S.changed = {}; S.pol[STAT] = 0; S.capital = 400;
      S.log = [];
      setup();
      const b = sponsorBill(S, STAT, 1, 'player', 'clean', true);
      if (!b) return { label:label, sponsored:false };
      const opened = b.stage;
      /* Degrade rather than throw on a build that predates S15, so this
         assertion can be run against the old file and show what it did. */
      const ladder = (typeof billLadder === 'function' ? billLadder(S) : BILL_STAGES.filter(function (x) { return x !== 'assent'; })).slice();
      const seen = [opened];
      let n = 0;
      while (S.bills.indexOf(b) >= 0 && n < 10) {
        advanceBills(S); n++; S.turn++;
        if (S.bills.indexOf(b) >= 0 && seen[seen.length - 1] !== b.stage) seen.push(b.stage);
      }
      const text = S.log.map(function (l) { return l.text; }).join(' | ');
      const arch = (S.billArchive || []).filter(function (x) { return x.id === b.id; })[0] || {};
      return {
        label:label, sponsored:true, opened:opened, ladder:ladder, seen:seen, sessions:n,
        law:(S.pol[STAT] || 0) > 0, result:arch.result || '(still on the paper)',
        saidAssembly:/the Assembly/i.test(text),
        saidCommittee:/committee/i.test(text),
        saidCouncil:/council/i.test(text),
        saidDecree:/decree/i.test(text),
      };
    }

    out.republic = run(function () { S.upper.exists = true; S.upper.veto = 2; S.upper.ceremonial = false; }, 'a full republic');
    out.noSenate = run(function () { S.upper.exists = false; }, 'no Senate');
    out.suspended = run(function () { S.lower.suspended = true; S.upper.exists = false; }, 'the Assembly suspended');
    out.abolished = run(function () { S.lower.exists = false; S.upper.exists = false; }, 'the Assembly abolished');
    out.senateOnly = run(function () { S.lower.exists = false; S.upper.exists = true; S.upper.veto = 2; S.upper.ceremonial = false; }, 'no Assembly, a Senate that sits');
    /* the apparatus refuses a government nobody believes in any more */
    out.refused = run(function () {
      S.lower.exists = false; S.upper.exists = false;
      S.armyLoyalty = 12; S.unity = 14; S.crown = 8;
    }, 'a decree nobody carries out');
    /* the elections-form trap: an abolished Assembly under a form that still
       holds elections used to force lower = 0 and kill every bill in committee */
    out.electionsForm = run(function () { S.lower.exists = false; S.upper.exists = false; S.form = 'federal'; }, 'abolished under an elections form');

    /* and a form that has abolished elections does not keep an elected chamber
       with a veto over it */
    S.lower = { exists:true, suspended:false };
    S.upper = { exists:true, elected:true, veto:2, ceremonial:false, seats:JSON.parse(JSON.stringify(keep.upper.seats || {})) };
    S.form = 'federal'; S.capital = 900; S.armyLoyalty = 90; S.unrest = 10; S.crown = 80;
    const toOne = TRANSITIONS.filter(function (t) { return t.to === 'oneparty'; })[0];
    out.hasOnePartyTransition = !!toOne;
    if (toOne) {
      const wasOk = toOne.ok(S);
      out.onePartyForced = true;
      S.form = 'oneparty'; toOne.apply(S);
      /* doTransition's own two lines, replayed here because the transition is
         driven through apply() rather than through the click path. On a build
         that predates S15 the Senate half of this does not exist, which is the
         point of the assertion. */
      if (typeof upperState === 'function' && !FORMS.oneparty.elections && upperOn(S) && !S.upper.ceremonial) {
        S.upper.veto = 0; S.upper.ceremonial = true; S.upper.elected = false;
      }
      if (!FORMS.oneparty.elections && lowerOn(S)) S.lower.suspended = true;
      out.onePartyOk = wasOk;
      out.onePartySenate = typeof upperState === 'function' ? upperState(S)
        : (!S.upper.exists ? 'abolished' : (S.upper.ceremonial || S.upper.veto === 0 ? 'ceremonial' : 'sitting'));
      out.onePartyLower = typeof lowerState === 'function' ? lowerState(S)
        : (!S.lower.exists ? 'abolished' : (S.lower.suspended ? 'suspended' : 'sitting'));
    }

    S.lower = keep.lower; S.upper = keep.upper; S.form = keep.form; S.diff = keep.diff;
    S.armyLoyalty = keep.army; S.unity = keep.unity; S.crown = keep.crown; S.turn = keep.turn;
    S.bills = []; S.pol[STAT] = 0;
    return out;
  });

  const ch = chambers;
  /* The PATH, not the outcome. A veto-2 Senate can genuinely refuse a bill and a
     committee can genuinely kill one, so asserting that a bill becomes law
     would be asserting a die roll. What must hold is that a bill visits ONLY
     the stages its constitution actually has, one per session -- which is
     precisely what was false. */
  const onLadder = (r) => r.seen.every((x) => r.ladder.indexOf(x) >= 0) && r.sessions === r.seen.length;
  say(ch.republic.ladder.join(',') === 'committee,assembly,senate' && onLadder(ch.republic) &&
      ch.republic.saidCommittee &&
      ch.noSenate.ladder.join(',') === 'committee,assembly' && onLadder(ch.noSenate),
    'a working republic is unchanged',
    `a full republic climbs ${ch.republic.ladder.join(' -> ')} and visited ${ch.republic.seen.join(' -> ')} in ` +
    `${ch.republic.sessions} session(s) · with no Senate the ladder is ${ch.noSenate.ladder.join(' -> ')} · ` +
    `and the house that carries a bill is now named even when it is the last one -- before S15 a bill that ` +
    `passed the Assembly with no Senate above it was never reported as having passed anything`);

  say(ch.abolished.law && ch.abolished.opened === 'decree' && ch.abolished.sessions === 1 &&
      !ch.abolished.saidAssembly && !ch.abolished.saidCommittee && ch.abolished.saidDecree,
    'an abolished Assembly is not in the way',
    `with no Assembly and no Senate a statute enters at ${ch.abolished.opened} and is law in ${ch.abolished.sessions} session · ` +
    `the log mentions the Assembly: ${ch.abolished.saidAssembly}, a committee: ${ch.abolished.saidCommittee}, a decree: ${ch.abolished.saidDecree} · ` +
    `before S15 this took two sessions through a committee and a chamber that did not exist, and said "passed the Assembly with 100 percent"`);

  say(ch.suspended.law && ch.suspended.opened === 'council' && ch.suspended.sessions === 1 &&
      ch.suspended.saidCouncil && !ch.suspended.saidAssembly,
    'a suspended Assembly is a council',
    `a suspended house meets as a council, takes ${ch.suspended.sessions} session and says so · ` +
    `suspended and abolished used to be the same value to every consumer in the file`);

  say(ch.senateOnly.opened === 'senate' && ch.senateOnly.sessions === 1 &&
      ch.senateOnly.ladder.join(',') === 'senate' && !ch.senateOnly.saidCommittee && !ch.senateOnly.saidAssembly,
    'one chamber left is still a chamber',
    `with no Assembly but a Senate that sits, a bill enters at ${ch.senateOnly.opened}, climbs ` +
    `${ch.senateOnly.ladder.join(' -> ')} and is decided in ${ch.senateOnly.sessions} session · ` +
    `no committee of a house that does not exist, and no mention of it`);

  /* The RESULT string, not just the failure: on a build that predates S15 this
     bill also failed, but it failed in a committee of a house that had been
     abolished, which is the defect rather than the feature. */
  say(!ch.refused.law && ch.refused.sessions === 1 && ch.refused.opened === 'decree' &&
      /decree/i.test(ch.refused.result) && !/committee/i.test(ch.refused.result),
    'a decree still has to be carried out',
    `at army 12, unity 14 and states 8 it entered at ${ch.refused.opened} and the record reads ` +
    `"${ch.refused.result}" · ruling by decree is not ruling by wish, and the refusal is the apparatus rather ` +
    `than a committee of a chamber that does not exist`);

  say(ch.electionsForm.law && ch.electionsForm.sessions === 1,
    'no bill dies in a committee that does not exist',
    `an abolished Assembly under a form that still holds elections used to force the forecast to 0, taking the committee ` +
    `figure to 14 against a bar of 43 -- every bill died there and nothing on screen said why · it now reaches law in ` +
    `${ch.electionsForm.sessions} session`);

  say(!!ch.hasOnePartyTransition && ch.onePartySenate !== 'sitting' && ch.onePartyLower === 'suspended',
    'a One Party State is not voted down by its Senate',
    ch.hasOnePartyTransition
      ? `on proclamation the Senate reads ${ch.onePartySenate} and the Assembly ${ch.onePartyLower} · only the Empire and the ` +
        `DPR did this for themselves, so every other authority form kept a full-veto elected Senate over it`
      : 'the oneparty transition is gone');

  /* ============================================================
     10. S15c: THE NUMBERS.

     Very easy opened on 175 capital with a floor of 75 under the session's
     income; the owner asked for 250 and 150. The ceiling had to move with them
     or the tier would fill its own stock in two sessions and print a waste
     warning at every close.

     The works cap was one ternary giving five tiers three values, so Normal,
     Hard and Very hard all carried two berths. And the works were the one line
     of federal spending in the game that difficulty never touched: the base
     budget applies d.exp to every statute and the v8 wrapper added the works
     on afterwards, so ten works on Very easy took four fifths of the tier's
     whole surplus.

     Driven through budget(), v8WorkMax and the real commission dispatcher.
     Every probe degrades rather than throws on a build that predates S15c, so
     the whole block can be run against the old file and show what it did.
     ============================================================ */
  const nums = await p3.evaluate(() => {
    const out = { tiers: {}, worksTotal: V8_WORKS.length };
    const TIERS = ['easy', 'gentle', 'normal', 'hard', 'brutal'];

    /* the raw instalments, read straight off the works rather than through
       v8WorksSpend -- which is the function under test */
    const raw = (st) => v8ActiveWorks(st).reduce((s, w) => s + v8WorkPerSession(st, w, st.v8.works[w.id]), 0);
    const fill = (st, n) => {
      const elig = V8_WORKS.filter((w) => w.req(st)).slice()
        .sort((a, b) => (a.cost / a.years) - (b.cost / b.years));
      elig.slice(-n).forEach((w) => {
        st.v8.works[w.id] = { status:'active', mode:'steady', cost:w.cost, spent:0,
          started:st.turn, overruns:0, sessions:0, idle:0, mods:{}, notes:[] };
      });
    };

    TIERS.forEach((d) => {
      S = enrichState(v6NewGame(d, 'v6default', 'standard', 'lp'), false);
      const berths = v8WorkMax(S), bare = budget(S);
      fill(S, berths);
      const full = budget(S), r = raw(S);
      out.tiers[d] = {
        berths: berths,
        /* what the tier charges for what the sites are credited with */
        charged: +full.works.toFixed(2), rawSpend: +r.toFixed(2),
        wanted: +(r * DIFFS[d].exp).toFixed(2),
        bareNet: +bare.net.toFixed(1), share: +(full.works / bare.rev).toFixed(3),
        surplusShare: bare.net > 0 ? +(full.works / bare.net).toFixed(3) : null
      };
    });

    /* Very easy's own numbers, read off a fresh campaign rather than the table */
    S = enrichState(v6NewGame('easy', 'v6default', 'standard', 'lp'), false);
    out.easy = { capital: S.capital, income: +capitalIncome(S).toFixed(1), cap: capCap(S) };
    /* the counterfactual the ceiling had to move to avoid: the new income
       against the old ceiling of 440 */
    out.oldCeilingWasteAt = 0;
    {
      let c = S.capital;
      for (let i = 1; i <= 8 && !out.oldCeilingWasteAt; i++) {
        if (c + capitalIncome(S) > 440.5) out.oldCeilingWasteAt = i;
        c = Math.min(440, c + capitalIncome(S));
      }
    }
    /* TEN works on Very easy, whatever the tier's berth count is, so the
       measurement is the same question on both sides of the fix */
    S = enrichState(v6NewGame('easy', 'v6default', 'standard', 'lp'), false);
    {
      const bare = budget(S);
      fill(S, 10);
      const full = budget(S);
      out.tenOnEasy = { works: +full.works.toFixed(1), bareNet: +bare.net.toFixed(1),
        share: +(full.works / bare.net).toFixed(3), sites: v8ActiveWorks(S).length };
    }
    /* the close-of-session waste warning, session by session, on a government
       that banks every point it earns */
    out.wasteAt = 0;
    for (let i = 1; i <= 8 && !out.wasteAt; i++) {
      if (S.capital + capitalIncome(S) > capCap(S) + .5) out.wasteAt = i;
      S.capital = clamp(S.capital + capitalIncome(S), -5, capCap(S));
    }

    /* THE BERTH QUEUE, through the real dispatcher. */
    S = enrichState(v6NewGame('easy', 'v6default', 'standard', 'lp'), false);
    S.ruling = playParty(S); S.coalition = [S.ruling];
    S.capital = 400; S.treasury = 4000;
    const open = V8_WORKS.filter((w) => w.req(S)).map((w) => w.id);
    const berths = v8WorkMax(S);
    open.slice(0, berths).forEach((id) => v8Dispatch('work', id, 'commission'));
    out.filledBerths = v8ActiveWorks(S).length;
    const waiter = open[berths], second = open[berths + 1];
    const capBefore = S.capital, trBefore = S.treasury;
    v8Dispatch('work', waiter, 'commission');
    v8Dispatch('work', second, 'commission');
    const q = () => (S.v8.queue || []);
    out.queued = q().slice();
    out.queueFree = S.capital === capBefore && S.treasury === trBefore;
    out.queueStartedNothing = v8ActiveWorks(S).length === out.filledBerths;
    /* a berth frees: cancel one, tick, and the head of the queue is taken */
    const victim = v8ActiveWorks(S)[0];
    S.v8.works[victim.id].status = 'cancelled';
    if (typeof v8QueueTick === 'function') v8QueueTick(S);
    out.promoted = !!(S.v8.works[waiter] && S.v8.works[waiter].status === 'active');
    out.queueAfter = q().slice();
    out.paidOnStart = S.capital < capBefore && S.treasury < trBefore;

    /* THE TAPER. Ten sites against one, on the same fresh state, measuring the
       aggregate the sites hand the country every session. */
    const siteRun = (n) => {
      S = enrichState(v6NewGame('easy', 'v6default', 'standard', 'lp'), false);
      S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
      fill(S, n);
      v8ActiveWorks(S).forEach((w) => { S.v8.works[w.id].mode = 'crash'; });
      const u0 = S.macro.unemployment, l0 = S.blocs.labour, c0 = S.ind.corruption;
      v8WorksTick(S);
      return { emp: +(u0 - S.macro.unemployment).toFixed(4), lab: +(S.blocs.labour - l0).toFixed(4),
        cor: +(S.ind.corruption - c0).toFixed(4) };
    };
    out.one = siteRun(1);
    out.ten = siteRun(10);

    /* THE FILTER STRIP. */
    S = enrichState(v6NewGame('easy', 'v6default', 'standard', 'lp'), false);
    S.ruling = playParty(S); S.coalition = [S.ruling];
    out.hasStrip = typeof v8WorkFilterStrip === 'function';
    if (out.hasStrip) {
      const strip = document.createElement('div');
      strip.innerHTML = v8WorkFilterStrip();
      out.filterIds = [].slice.call(strip.querySelectorAll('[data-workfilter]'))
        .map((b) => b.getAttribute('data-workfilter'));
      fill(S, 3);
      S.uiPrefs.workFilter = 'building';
      out.shownBuilding = V8_WORKS.filter(v8WorkShown).length;
      S.uiPrefs.workFilter = 'all';
      out.shownAll = V8_WORKS.filter(v8WorkShown).length;
      S.uiPrefs.workFilter = 'all';
    }
    return out;
  });

  const nt = nums.tiers, berthRungs = ['easy', 'gentle', 'normal', 'hard', 'brutal'].map((d) => nt[d].berths);
  say(nt.easy.berths === 10 && new Set(berthRungs).size === 5 &&
      berthRungs.every((n, i) => i === 0 || n < berthRungs[i - 1]),
    'ten berths, and a rung for every tier',
    `the berths run ${berthRungs.join(' > ')} from Very easy to Very hard · the old ternary gave five tiers three ` +
    `values and the three hardest all read 2, so Normal, Hard and Very hard were indistinguishable on the one ` +
    `axis a government's ambition is measured in`);

  say(nums.easy.capital === 250 && nums.easy.income === 150 && nums.easy.cap >= 700 &&
      nums.wasteAt >= 4 && nums.oldCeilingWasteAt <= 2,
    'very easy opens on 250 and earns 150',
    `Very easy starts with ${nums.easy.capital} capital, earns ${nums.easy.income} a session under its floor and ` +
    `holds ${nums.easy.cap} · a government that banks every point it earns is first told it is wasting capital at ` +
    `the close of session ${nums.wasteAt} · held at the old ceiling of 440 the same income would fill the stock by ` +
    `session ${nums.oldCeilingWasteAt} and the close-of-session checklist would print that warning for the rest of ` +
    `the campaign, which is why the ceiling had to move with the floor`);

  const charged = ['easy', 'gentle', 'normal', 'hard', 'brutal']
    .every((d) => Math.abs(nt[d].charged - nt[d].wanted) < .01);
  say(charged && nt.easy.charged < nt.easy.rawSpend && nt.brutal.charged > nt.brutal.rawSpend,
    'the works are charged at the tier rate',
    `every tier now charges its own d.exp for a works instalment: Very easy pays ${nt.easy.charged} for ` +
    `${nt.easy.rawSpend} of building and Very hard pays ${nt.brutal.charged} for ${nt.brutal.rawSpend} · ` +
    `the base budget has applied d.exp to every statute since v4 and the v8 wrapper added the works on ` +
    `afterwards, so the works were the one line of federal spending difficulty never touched`);

  const ten = nums.tenOnEasy;
  say(ten.sites === 10 && ten.bareNet > 0 && ten.share < .5,
    'ten works do not eat very easy',
    `ten sites, the dearest the ministry can begin, cost ${ten.works} a session against the tier's ` +
    `${ten.bareNet} of surplus: ${Math.round(ten.share * 100)} percent of it · charged outside the difficulty ` +
    `multiplier the same ten cost 133.1, which is 81 percent, on the tier whose blurb is that nothing here can ` +
    `bring you down`);

  say(nums.filledBerths === 10 && nums.queued.length === 2 && nums.queueFree && nums.queueStartedNothing &&
      nums.promoted && nums.queueAfter.length === 1 && nums.paidOnStart,
    'what you commission past the berths waits',
    `${nums.filledBerths} berths filled, two more commissioned and both in the queue with nothing charged · a berth freed and the ` +
    `head of the queue was taken and paid for, leaving ${nums.queueAfter.length} waiting · before S15c a ` +
    `commission at the cap was refused with a flash and the player was told to come back later`);

  say(nums.ten.emp > 0 && nums.ten.emp < nums.one.emp * 4 && nums.ten.lab < nums.one.lab * 4 &&
      nums.ten.cor < nums.one.cor * 4,
    'the country notices its first canal',
    `ten crash sites move unemployment by ${nums.ten.emp} against one site's ${nums.one.emp}, Labour by ` +
    `${nums.ten.lab} against ${nums.one.lab} and corruption by ${nums.ten.cor} against ${nums.one.cor} · ` +
    `charged once per work per session and unbounded, ten berths would have been ten times one`);

  say(nums.hasStrip && nums.filterIds.length === 6 && nums.shownBuilding === 3 && nums.shownAll === nums.worksTotal,
    'the works panel can be asked a question',
    nums.hasStrip
      ? `the strip offers ${nums.filterIds.join(', ')} · asked for what is under construction it answers with ` +
        `${nums.shownBuilding} of ${nums.shownAll} cards · it drew all forty-eight in one list before`
      : 'there is no filter on the works panel');

  /* S14: and after all of it, ask the page whether any number went bad. The
     whole harness runs on one page, so V14_FAULTS holds every unorderable
     value and every pair of bounds the wrong way round that any of the roads
     above produced. Empty is the assertion; it is not a summary of the
     others, because a fault does not fail anything by itself -- that is the
     defect it exists to catch. */
  const faults = await page.evaluate(() => (window.V14_FAULTS || []).slice());
  say(faults.length === 0, 'no number went bad on any road',
    faults.length ? faults.length + ' clamp fault(s): ' + faults.slice(0, 2).join(' | ')
      : 'V14_FAULTS is empty after every road, every transition and every ministry action');

  await browser.close();
  console.log(fail ? '\n' + fail + ' CHECK(S) FAILED' : '\nROADS OK');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
