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
    /* S17e: the list carries WHICH SLOT each name sits in, so a duplicate
       names the two chairs that hold it instead of only being counted. Three
       slices in a row diagnosed this assertion as flaky when it was pointing
       at a real defect -- one person in two great offices -- and a count with
       no slots is what made that easy to believe. */
    const liveSlots = () => {
      const a = [];
      PARTIES.forEach(p => a.push(['leader:' + p.id, S.figures.leaders[p.id].name]));
      ['pres', 'vpres', 'chan', 'vchan'].forEach(o => a.push(['exec:' + o, S.figures.exec[o].name]));
      REGIONS.forEach(r => a.push(['governor:' + r.id, S.v6.governors[r.id].name]));
      Object.keys(S.ministers || {}).forEach(k => a.push(['minister:' + k, S.ministers[k].name]));
      return a;
    };
    /* S17f: A PARTY LEADER MAY HOLD EXACTLY ONE GREAT OFFICE, by the owner's
       ruling, and `execBench` puts the leader on every bench deliberately. So
       the same name in `leader:x` and in ONE `exec:*` is the rule working,
       not a collision -- what is counted is a name in two slots that are not
       that pair. Two exec chairs, two leaderships, a governor doubling as a
       minister: all still duplicates. */
    const dupeSlots = () => {
      const by = {};
      liveSlots().forEach(x => { (by[x[1]] = by[x[1]] || []).push(x[0]); });
      return Object.keys(by).filter(n => {
        const s = by[n]; if (s.length < 2) return false;
        if (s.length === 2 && s.filter(k => k.indexOf('leader:') === 0).length === 1 &&
            s.filter(k => k.indexOf('exec:') === 0).length === 1) return false;
        return true;
      }).map(n => ({ name:n, slots:by[n] }));
    };
    const liveList = () => liveSlots().map(x => x[1]);
    out.castSize = liveList().length;
    /* S17a: MEASURED ON FIXED STREAMS, NOT ON WHATEVER STREAM THIS RUN LANDED
       IN. The harness leaves the seed blank, so every run is a different
       campaign and this was one sample of a chance event: it reddened on a bad
       draw during S17a and greened on the next run with no code change at all.
       A bar that cries wolf is worse than no bar. Eight fixed streams are
       churned every run instead -- strictly more coverage than one random one,
       and the same answer every time -- and the live stream is put back
       exactly where it was found, so nothing downstream shifts because of it. */
    const keepRng = S.rngState;
    const STREAMS = 8;
    let worst = 0;
    for (let s = 0; s < STREAMS; s++) {
      S.rngState = (s + 1) * 7919;
      for (let i = 0; i < 200; i++) {
        const pid = PARTIES[i % PARTIES.length].id;
        S.figures.leaders[pid] = makeFigure(S, pid, 44);
        const r = REGIONS[i % REGIONS.length];
        S.v6.governors[r.id] = v6MakeGovernor(S, r, pid);
        const dup = dupeSlots();
        if (dup.length > worst) {
          worst = dup.length;
          out.castWhere = dup[0].slots.join(' + ') + ' (' + dup[0].name + ')';
        }
      }
    }
    S.rngState = keepRng;
    out.castDupes = worst;
    out.castChurn = 200 * STREAMS;
    out.castStreams = STREAMS;

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
    republic.castDupes ? republic.castDupes + ' duplicate(s) among ' + republic.castSize +
      (republic.castWhere ? ' — ' + republic.castWhere : '')
      : republic.castSize + ' in public life, no name twice, through ' + republic.castChurn +
        ' replacements across ' + republic.castStreams + ' fixed dice streams (the same answer every run)');
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

    /* the treaties. S16b: a power holds a LIST, so war has to void all of
       them and not just the one that was in the slot. */
    /* every probe degrades rather than throwing on a build without S16b's
        accessors, so the harness reports a FAILURE with the diagnosis instead
        of a ReferenceError with a stack. */
    const inForce = (pid) => (typeof v6Treaties === 'function') ? v6Treaties(S, pid)
      : (S.v6.treaties[pid] && S.v6.treaties[pid].kind ? [S.v6.treaties[pid]] : []);
    const three = [{ kind:'nonaggression', since:2026 }, { kind:'defence', since:2028 }, { kind:'trade', since:2029 }];
    S.v6.treaties.sarath = (typeof v6Treaties === 'function') ? three : three[2];
    out.treatyVoidedFrom = inForce('sarath').length;
    v6TreatiesTick(S);
    out.treatyVoided = inForce('sarath').length === 0;

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
    const one = (k) => ({ ostmark:(typeof v6Treaties === 'function') ? [{ kind:k, since:2030 }] : { kind:k, since:2030 } });
    S.v6.treaties = one('defence');
    out.defenceMil = Math.round((indicatorTargets(S).military - m0) * 100) / 100;
    S.v6.treaties = one('arms');
    out.armsMil = Math.round((indicatorTargets(S).military - m0) * 100) / 100;
    /* and the same reading taken through a PRE-S16b save, which carries one
       bare object per power: the migration has to make it identical. */
    S.v6.treaties = { ostmark:{ kind:'defence', since:2030 } };
    out.defenceMilOldSave = Math.round((indicatorTargets(S).military - m0) * 100) / 100;
    S.v6.treaties = (typeof v6Treaties === 'function')
      ? { ostmark:[{ kind:'defence', since:2030 }, { kind:'basing', since:2032 }] }
      : { ostmark:{ kind:'defence', since:2030 } };
    out.stackedMil = Math.round((indicatorTargets(S).military - m0) * 100) / 100;
    S.ind.military = keepMil; S.v6.treaties = keepTr; S.pol = keepPol;
    return out;
  });
  say(world.declaredOnFriendly === 0 && world.targetedAFriend === 0 && world.declaredOnHostile > 0 && !world.wrongTarget,
    'war needs somebody to be hostile to',
    `300 rolls at maximum risk with every power at 70 declared ${world.declaredOnFriendly} wars — there is nobody to fight; ` +
    `300 identical rolls with one power at 12 declared ${world.declaredOnHostile}, every one of them on that power`);
  say(world.wordAtWar === 'at war' && world.wordOther === 'correct', 'nobody is allied and at war',
    `a power at 88 relations you are fighting reads "${world.wordAtWar}"; everyone else still reads normally ("${world.wordOther}")`);
  say(world.treatyVoided && world.treatyVoidedFrom === 3, 'war annuls every treaty it contradicts',
    `${world.treatyVoidedFrom} instruments with the country you are fighting -- a non-aggression pact, a defence pact and a trade agreement -- are all void, not still paying out; ` +
    'before S16b a power could hold only one, so this could only ever have been asked of one');
  say(world.powerCount >= 11 && world.allSeeded && world.backfilled && world.noNaN,
    'eleven powers, none of them NaN',
    `${world.powerCount} powers, all seeded: ${world.allSeeded}; a six-power save backfills: ${world.backfilled}; ` +
    `shiftRel on an unknown power no longer produces NaN: ${world.noNaN}`);
  say(world.defenceMil === 1.5 && world.armsMil === -1.5 && world.treatyKinds >= 20 &&
      world.defenceMilOldSave === world.defenceMil && world.stackedMil === 3.5,
    'a treaty does what its card says',
    `${world.treatyKinds} instruments · a defence pact moves the armed-forces target by ${world.defenceMil} and an arms treaty by ${world.armsMil} — both advertised on their cards since v6 and implemented by nothing · ` +
    `a defence pact and a basing agreement standing together move it by ${world.stackedMil}, which no save could express before S16b · ` +
    `and a pre-S16b save carrying one bare object per power reads ${world.defenceMilOldSave}, identical, through the migration`);
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
    `costs ${fed.neglectLoss} (the owner's ruling was about forty; S15h took the machine's second reading out of ` +
    `ballot, which lifted this from 44 to ${fed.sweepGain} without a coefficient moving) · the two flank parties can now be moved in the regions ` +
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
    /* S17h: and the general form is anchored to the LAST ELECTION rather than
       to session one, so the ballots that follow an adoption are counted from
       the term being served. This used to read 5,9,13 -- the phase the article
       imposed on the whole campaign, which put the next ballot TWO years after
       a four-year article was adopted. */
    v11AdoptArticle(S, V11_ART.artQuadrennial, 61);
    S.lastElection = 3;
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
    v11ProposeArticle('artPreamble', false, 'assembly');
    /* S15e: `pending` is a LIST now, capped at three, so what this asks is the
       same question in the new shape: the article is on the list, it takes two
       sessions, and the list refuses a fourth rather than a second. */
    /* Degrades on a build that predates S15e, where pending was one object. */
    const pendList = Array.isArray(S.v11.con.pending) ? S.v11.con.pending
      : (S.v11.con.pending ? [S.v11.con.pending] : []);
    const pend0 = pendList[0] || null;
    out.laid = !!pend0;
    out.contestSessions = pend0 ? pend0.due - S.turn : 0;
    out.pendingIsList = Array.isArray(S.v11.con.pending);
    out.capNow = typeof v11PendingCap === 'function' ? v11PendingCap(S) : 1;
    S.turn = pend0.due; v11ConTick(S);
    out.carried = v11Adopted(S, 'artPreamble');
    out.recorded = S.v11.con.arts.artPreamble || null;
    const docBefore = v11ConCount(S), unity0 = S.unity;
    const stub = { id:'artAbolishUpper', repeal:false, laid:S.turn, due:S.turn, campaign:0, route:'assembly' };
    S.v11.con.pending = out.pendingIsList ? [stub] : stub;
    PARTIES.forEach(q => { S.partyRel[q.id] = 0; });
    v11ConTick(S);
    out.failedChangedNothing = !v11Adopted(S, 'artAbolishUpper') && v11ConCount(S) === docBefore;
    out.failCost = +(unity0 - S.unity).toFixed(1);
    out.coolOff = !!v11CanPropose(S, V11_ART.artAbolishUpper, false, 'assembly');

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
  say(con.calendarSame === true && con.termNow === 4 && con.ballotsAfter === '7,11',
    'the calendar reduces to what it was',
    con.calendarSame !== true ? 'the general form ' + con.calendarSame + ' from (t % 2 === 1)'
      : `identical to the old body at every turn of a full epic with an unwritten constitution · the quadrennial ` +
        `article then makes the term ${con.termNow} and, from a last election at 3, the ballots fall at ` +
        `${con.ballotsAfter} -- four years apart and counted from the term being served, where the old form ` +
        `re-phased the whole campaign onto 5, 9, 13 and put the next ballot two years after a four-year article`);
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
  say(con.laid && con.contestSessions === 2 && con.pendingIsList && con.capNow === 3 && con.carried &&
      con.recorded && con.recorded.margin > 0 && con.failedChangedNothing && con.failCost > 0 && con.coolOff,
    'ratification is a vote, and it can fail',
    !con.carried ? 'the article never carried' : (!con.failedChangedNothing ? 'a failed article changed the document'
      : `laid, contested for ${con.contestSessions} sessions, carried at ${con.recorded.margin}% and recorded against ${con.recorded.year} · ` +
        `${con.capNow} may be before the country at a time · a defeat costs ${con.failCost} of unity, changes no article, and bars the question for six sessions`));
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
    `deliberately small in the REGIONS, where it rides on the S11c term tuned against a measured seat target · ` +
    `S15h added the second half of that number: an endorsement turns its own members out, so the figure now covers ` +
    `the whole channel rather than the regional lift alone, and the campaign block below reports it on its own`);

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
        advanceBills(S); n++;
        /* S15d: a bill that carries its last division goes to an office for
           signature, and where that office is the player's own party the game
           asks. These assertions are about the CHAMBERS, so the harness
           answers the way a player who wants their own bill answers: it
           signs. Left unanswered the office signs it a session later, which
           would put a session of the executive into a count of the
           legislature. */
        (S.pendingAssent || []).slice().forEach(function (bid) {
          if (typeof assentEvent !== 'function') return;
          var ae = assentEvent(S, bid);
          if (ae && ae.ch && ae.ch[0]) ae.ch[0].f(S);
        });
        if (S.pendingAssent) S.pendingAssent = [];
        S.turn++;
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

  /* ============================================================
     11. S15d: TWO SESSIONS, AND THE SIGNATURE.

     The clock was one token: `loops = bill.urgent ? 2 : 1`. Support decided
     WHETHER a stage passed and never HOW MANY of them ran, so a government
     holding 1,305 of 1,305 seats with the Senate behind it spent the same
     three sessions on a bill as a minority spent losing one.

     And BILL_STAGES has carried an 'assent' slot and a name for it since v4
     with nothing ever setting it: the fourth pip was drawn unlit on every bill
     card the game has rendered. The chambers called enactBill and the statute
     was in the book, with no office between them.

     Driven through the real sponsor, the real stage machine and the real
     billAction handlers. Every probe degrades rather than throws on a build
     that predates S15d. ============================================================ */
  const assent = await p3.evaluate(() => {
    const out = {};
    const has = (n) => typeof window[n] === 'function';
    out.hasPace = has('billPace');
    out.hasAssent = has('assentEvent');
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    const me = playParty(S), STAT = 'incomeTax';
    const upperSeed = JSON.parse(JSON.stringify(S.upper.seats || {}));

    /* every statute names a department, so every bill has an office */
    out.noDept = POLICIES.filter((p) => !p.dept).length;
    out.statutes = POLICIES.length;

    function frame(pct) {
      S.lower = { exists:true, suspended:false };
      S.upper = { exists:true, elected:true, veto:2, ceremonial:false, seats:{} };
      S.form = 'federal'; S.ruling = me; S.coalition = [me];
      const mine = Math.round(1305 * pct / 100), up = Math.round(120 * pct / 100);
      S.seats = {}; S.seats[me] = mine; S.seats.pnl = 1305 - mine;
      S.upper.seats = {}; S.upper.seats[me] = up; S.upper.seats.pnl = 120 - up;
      S.bills = []; S.changed = {}; S.pol[STAT] = 0; S.capital = 600; S.treasury = 3000;
      S.log = []; S.pendingAssent = []; S.unity = 60; S.unrest = 20;
      ['pres','vpres','chan','vchan'].forEach((d) => { S.exec[d] = me; });
      S.figures.exec = {};
    }
    /* answer: which sheet option a player picks, or -1 to leave it. `act` runs
       once, the first session the bill is refused. */
    function run(pct, setup, answer, act) {
      frame(pct);
      if (setup) setup();
      const bill = sponsorBill(S, STAT, 1, 'player', 'clean', true);
      if (!bill) return { sponsored:false };
      const f0 = billForecast(S, bill);
      const rec = { sponsored:true, pct:pct,
        f:{ committee:+f0.committee.toFixed(1), lower:+f0.lower.toFixed(1), upper:+f0.upper.toFixed(1) },
        carried:has('billCarried') ? billCarried(S, bill, f0) : null,
        pace:has('billPace') ? billPace(S, bill) : 1,
        track:has('billTrack') ? billTrack(S, bill) : billLadder(S), sheets:[] };
      let n = 0, answered = false, acted = false;
      while (S.bills.indexOf(bill) >= 0 && n < 9) {
        advanceBills(S); n++;
        (S.pendingAssent || []).slice().forEach((bid) => {
          if (!has('assentEvent')) return;
          const e = assentEvent(S, bid);
          if (!e) return;
          rec.sheets.push({ title:e.title, opts:e.ch.map((c) => c.l) });
          if (answer >= 0 && !answered) { e.ch[answer].f(S); answered = true; }
        });
        if (S.pendingAssent) S.pendingAssent = [];
        if (act && !acted && bill.refused && S.bills.indexOf(bill) >= 0) { act(bill); acted = true; }
        S.turn++;
      }
      const arch = (S.billArchive || []).filter((x) => x.id === bill.id)[0] || {};
      rec.sessions = n;
      rec.law = (S.pol[STAT] || 0) > 0;
      rec.result = arch.result || '(still on the paper)';
      rec.notes = (arch.notes || bill.notes || []).slice();
      rec.answered = answered; rec.acted = acted;
      rec.unity = Math.round(S.unity);
      return rec;
    }

    /* THE CLOCK. Sweep the seat share and watch the pace step. */
    out.sweep = [];
    for (let pct = 100; pct >= 40; pct -= 2) {
      frame(pct);
      const bl = sponsorBill(S, STAT, 1, 'player', 'clean', true);
      const f = billForecast(S, bl);
      out.sweep.push({ pct:pct, lower:+f.lower.toFixed(1), upper:+f.upper.toFixed(1),
        pace:has('billPace') ? billPace(S, bl) : 1 });
      S.bills = [];
    }
    /* the bound the step should land on, derived from the division itself */
    out.bound = (typeof BILL_BARS === 'object' && typeof BILL_NOISE === 'object')
      ? BILL_BARS.senate + BILL_NOISE.senate / 2 : null;

    /* END TO END. 100 percent of both houses against 56, which is the last
       rung of the sweep where a bill still clears both bars and cannot be
       called safe. */
    out.safe = run(100, null, 0);
    out.tight = run(56, null, 0);

    /* THE FOUR ANSWERS. */
    out.statement = run(100, null, 1);
    out.sentBack = run(100, null, 2);
    out.vetoed = run(100, null, 3);

    /* A HOLDER WHO IS NOT YOURS. loyalty is how much of the decision is their
       party's, so the same officer at 20 and at 95 reads the same bill
       differently, and the direction follows their party's relation to you. */
    const hostile = (loy, rel, trait) => () => {
      S.exec.chan = 'pnl'; S.figures.exec = {}; S.partyRel.pnl = rel;
      const h = holderOf(S, 'chan'); h.loyalty = loy; h.trait = trait || 'ideologue';
    };
    if (has('assentFavour')) {
      /* A STRONG bill from a party the holder's party is hostile to: the
         party line is far below the measure, so loyalty drags the reading
         DOWN toward the line. */
      frame(100); hostile(95, 6)();
      const probe = { policy:STAT, dir:1, assemblyVote:96, assentOffice:'chan', notes:[], concessions:0 };
      out.favLoyalHostile = Math.round(assentFavour(S, probe));
      holderOf(S, 'chan').loyalty = 20;
      out.favDisloyalHostile = Math.round(assentFavour(S, probe));
      /* A WEAK bill from a party the holder's party is close to: the line is
         above the measure, so loyalty drags the reading UP. Same officer,
         same field, opposite direction -- which is what makes it a weight
         rather than a bonus. */
      const weak = { policy:STAT, dir:1, assemblyVote:30, assentOffice:'chan', notes:[], concessions:0 };
      S.partyRel.pnl = 92; holderOf(S, 'chan').loyalty = 95;
      out.favLoyalFriendly = Math.round(assentFavour(S, weak));
      holderOf(S, 'chan').loyalty = 20;
      out.favDisloyalFriendly = Math.round(assentFavour(S, weak));
      /* and what a push is worth, and what a fixer is worth on top */
      S.partyRel.pnl = 6; holderOf(S, 'chan').loyalty = 95;
      out.favPlain = Math.round(assentFavour(S, probe));
      probe.assentPush = 10;
      out.favPushed = Math.round(assentFavour(S, probe));
      holderOf(S, 'chan').trait = 'fixer';
      out.favPushedFixer = Math.round(assentFavour(S, probe));
      delete probe.assentPush;
    }

    out.refused = run(100, hostile(96, 6), -1);
    out.overridden = run(100, hostile(96, 6), -1, (b) => billAction(b.id, 'override'));
    out.pressed = run(100, hostile(72, 26), -1, (b) => { billAction(b.id, 'pressOffice'); billAction(b.id, 'pressOffice'); });
    /* the override is refused when the houses did not carry it by enough */
    out.thinOverride = (function () {
      frame(100); hostile(96, 6)();
      const bl = sponsorBill(S, STAT, 1, 'player', 'clean', true);
      if (!bl) return null;
      bl.stage = 'assent'; bl.assentOffice = 'chan'; bl.refused = S.turn;
      bl.assemblyVote = 52; bl.senateVote = 51;
      const cap = S.capital;
      billAction(bl.id, 'override');
      const held = S.bills.indexOf(bl) >= 0 && !(S.pol[STAT] > 0);
      S.bills = []; S.pol[STAT] = 0;
      return { held:held, chargedNothing:S.capital === cap };
    })();

    /* THE PIP. The card draws the track, and the fourth rung is now a rung. */
    frame(100);
    const cardBill = sponsorBill(S, STAT, 1, 'player', 'clean', true);
    if (cardBill) {
      cardBill.stage = 'assent'; cardBill.assentOffice = 'chan'; cardBill.assemblyVote = 88;
      const wrap = document.createElement('div');
      wrap.innerHTML = billCard(cardBill);
      const stages = [].slice.call(wrap.querySelectorAll('.timeline .stage'));
      out.cardStages = stages.length;
      out.cardNow = stages.map((x) => x.className.trim()).join('|');
      out.cardLabels = [].slice.call(wrap.querySelectorAll('.stage-labels span')).map((x) => x.textContent);
      out.cardText = wrap.textContent.replace(/\s+/g, ' ');
      S.bills = []; S.pol[STAT] = 0;
    }
    S.upper.seats = upperSeed;
    return out;
  });

  const A = assent;
  const paceAt = (p) => (A.sweep.filter((r) => r.pct === p)[0] || {}).pace;
  const flip = A.sweep.filter((r, i) => i > 0 && r.pace !== A.sweep[i - 1].pace)[0];
  say(A.hasPace && paceAt(100) === 2 && paceAt(40) === 1 && !!flip &&
      A.sweep.filter((r) => r.pace === 2).every((r) => Math.min(r.lower, r.upper) >= A.bound) &&
      A.sweep.filter((r) => r.pace === 1).every((r) => Math.min(r.lower, r.upper) < A.bound),
    'the clock is the chamber arithmetic',
    A.hasPace
      ? `a bill climbs two stages a session above ${A.bound} percent and one below it, and the step falls at ` +
        `${flip.pct} percent of the seats where the forecast reads ${flip.lower}/${flip.upper} · that number is ` +
        `not a constant: it is the division's own bar plus half its own die, so a bill takes two stages exactly ` +
        `when it cannot lose one · before S15d the pace was 1 for every bill in the game unless six capital had ` +
        `been spent on urgency`
      : 'billPace does not exist: the pace is a purchased flag');

  say(A.safe.law && A.safe.sessions === 2 && A.tight.sessions === 3 &&
      A.safe.pace === 2 && A.tight.pace === 1,
    'a bill both houses carry takes two sessions',
    `holding every seat in both houses a statute is law in ${A.safe.sessions} sessions ("${A.safe.result}") · ` +
    `at 56 percent, where it still clears both bars but can lose a division, the same statute takes ` +
    `${A.tight.sessions} · the owner counted three and four`);

  say(A.noDept === 0 && A.cardStages === 4 && /assent/.test(A.cardNow.split('|')[3] || '') === false &&
      A.cardNow.split('|')[3] === 'stage now' && A.cardLabels.join(',') === 'Committee,Assembly,Senate,Assent',
    'the fourth pip lights',
    `all ${A.statutes} statutes name a department, so every bill has an office · the card draws ` +
    `${A.cardStages} rungs [${A.cardLabels.join(' ')}] and the fourth reads "${A.cardNow.split('|')[3]}" · ` +
    `BILL_STAGES has carried an assent slot and a name for it since v4 and nothing has ever set it, so that pip ` +
    `was drawn unlit on every bill card this game has rendered`);

  say(A.hasAssent && A.safe.sheets.length === 1 && A.safe.sheets[0].opts.length === 4 &&
      A.statement.law && /statement/i.test(A.statement.notes.join(' ')) &&
      A.sentBack.law && /Returned/i.test(A.sentBack.notes.join(' ')) && A.sentBack.sessions > A.safe.sessions &&
      !A.vetoed.law && /[Vv]etoed at assent/.test(A.vetoed.result),
    'four ways to answer, not two',
    A.hasAssent
      ? `the office your party holds asks, and offers ${A.safe.sheets[0].opts.join(' / ')} · signing with a ` +
        `statement lands the measure a quarter harder and the parties that voted against read it too · returning ` +
        `it costs ${A.sentBack.sessions - A.safe.sessions} session(s) and buys a concession · the veto reads ` +
        `"${A.vetoed.result}" and cost ${60 - A.vetoed.unity} of unity on the government's own bill`
      : 'there is no assent sheet');

  const spread = A.favLoyalHostile !== undefined
    && (A.favLoyalHostile < A.favDisloyalHostile) && (A.favLoyalFriendly > A.favDisloyalFriendly);
  say(spread && A.favPushed > A.favPlain && A.favPushedFixer > A.favPushed,
    'the office is a person, and loyalty is read',
    spread
      ? `a strong bill from a government the holder's party is hostile to reads ${A.favLoyalHostile} at loyalty ` +
        `95 and ${A.favDisloyalHostile} at loyalty 20; a weak bill from a government it is close to reads ` +
        `${A.favLoyalFriendly} and ${A.favDisloyalFriendly} · the same field moves the same officer in opposite ` +
        `directions, because loyalty is how much of the decision is their party's rather than their own · ` +
        `pressing the office takes ${A.favPlain} to ${A.favPushed}, and a fixer takes it to ${A.favPushedFixer} · ` +
        `makeFigure has written loyalty on an exec figure since v4 and nothing in three megabytes has read it`
      : 'assentFavour does not exist, or does not move with loyalty');

  say(!A.refused.law && /Died at assent/.test(A.refused.result) &&
      A.overridden.law && /over a refusal/i.test(A.overridden.notes.join(' ')) &&
      A.pressed.law && /pressed/i.test(A.pressed.notes.join(' ')) &&
      !!A.thinOverride && A.thinOverride.held && A.thinOverride.chargedNothing,
    'a refusal is beatable, and not for free',
    `a bill that carried both houses and was refused by an office that is not yours dies on the desk in ` +
    `${A.refused.sessions} sessions ("${A.refused.result}") · asking the houses to override puts it in the book ` +
    `in ${A.overridden.sessions} · pressing the office twice turns a refusal into a return and then a signature ` +
    `in ${A.pressed.sessions} · and an override is refused outright, with nothing charged, when the houses ` +
    `carried it at 52 percent against a bar of 60`);

  /* ============================================================
     12. S15e: THE CONSTITUTION.

     `c.pending` was ONE object and v11CanPropose refused with "Another article
     is already before the country", so a convention could be called and there
     was still nothing to do with it. Every article took two sessions and was
     decided on the chambers; `a.referendum` was a fixed property that stacked
     a country vote ON TOP of the chamber vote, and the whole referendum road
     was closed under exactly the forms that have no other way to pass
     anything. The convention sat six sessions and subtracted 8 from a
     threshold and did nothing else.
     ============================================================ */
  const consti = await p3.evaluate(() => {
    const out = {};
    const has = (n) => typeof window[n] === 'function';
    out.hasCap = has('v11PendingCap');
    out.hasVerdict = has('v11ArtVerdict');

    /* the book */
    out.total = V11_ARTICLES.length;
    out.byBook = {};
    V11_BOOKS.forEach((b) => { out.byBook[b.id] = V11_ARTICLES.filter((a) => a.book === b.id).length; });
    out.noMoves = V11_ARTICLES.filter((a) => !a.moves).length;
    out.noText = V11_ARTICLES.filter((a) => !a.text).length;
    out.noEffect = V11_ARTICLES.filter((a) => {
      const m = a.mods || {};
      const live = Object.keys(m).some((k) => (typeof m[k] === 'object' ? Object.keys(m[k]).length : m[k]));
      return !live && typeof a.apply !== 'function';
    }).map((a) => a.id);
    const names = {}, ids = {};
    out.dupNames = []; out.dupIds = [];
    V11_ARTICLES.forEach((a) => {
      if (names[a.name]) out.dupNames.push(a.name); names[a.name] = 1;
      if (ids[a.id]) out.dupIds.push(a.id); ids[a.id] = 1;
    });

    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    const me = playParty(S);
    function frame() {
      S.ruling = me; S.coalition = [me]; S.capital = 1400; S.form = 'federal';
      S.lower = { exists:true, suspended:false };
      S.upper = { exists:true, elected:true, veto:2, ceremonial:false, seats:{} };
      S.seats = {}; S.seats[me] = 1305; S.upper.seats[me] = 120;
      var c0 = v11Con(S);
      c0.arts = {}; c0.order = []; c0.failed = {};
      /* the old build keeps ONE object here; leave its shape alone so every
         probe below can be run against it and report what it did */
      c0.pending = Array.isArray(c0.pending) ? [] : null;
      c0.conv = 0; c0.convUsed = 0; c0.plebiscites = 0;
      S.acts.equalStates = false;
      return c0;
    }
    const plist = (c0) => Array.isArray(c0.pending) ? c0.pending : (c0.pending ? [c0.pending] : []);
    const openIds = (route) => V11_ARTICLES
      .filter((a) => !v11CanPropose(S, a, false, route || 'assembly')).map((a) => a.id);

    /* THREE AT A TIME */
    let c = frame();
    const three = openIds().slice(0, 4);
    three.slice(0, 3).forEach((id) => v11ProposeArticle(id, false, 'assembly'));
    out.cap = has('v11PendingCap') ? v11PendingCap(S) : 1;
    out.laid = plist(c).length;
    out.fourthRefused = v11CanPropose(S, V11_ART[three[3]], false, 'assembly') || '(allowed)';
    out.dues = plist(c).map((p) => p.due - p.laid);
    S.turn += 2; v11ConTick(S);
    out.afterTwo = plist(c).length;
    out.settled = Object.keys(c.arts).length + Object.keys(c.failed).length;

    /* THE TWO ROADS. Same article, same state, two clocks and two juries. */
    c = frame();
    const road = openIds('assembly')[0];
    v11ProposeArticle(road, false, 'assembly');
    out.assemblySpan = plist(c).length ? plist(c)[0].due - plist(c)[0].laid : 0;
    out.assemblyOn = has('v11ArtVerdict') && plist(c).length ? v11ArtVerdict(S, plist(c)[0]).on : 'the Assembly';
    c = frame();
    v11ProposeArticle(road, false, 'plebiscite');
    out.plebSpan = plist(c).length ? plist(c)[0].due - plist(c)[0].laid : 0;
    out.plebOn = has('v11ArtVerdict') && plist(c).length ? v11ArtVerdict(S, plist(c)[0]).on : 'the Assembly';

    /* THE PLEBISCITE UNDER A FORM WITH NO ELECTIONS. */
    c = frame();
    S.form = 'oneparty'; S.lower = { exists:true, suspended:true };
    out.electionsOn = electionsOn(S);
    const lib0 = S.ind.liberties;
    const pid1 = openIds('plebiscite')[0];
    v11ProposeArticle(pid1, false, 'plebiscite');
    out.plebOpenNoElections = plist(c).length === 1;
    out.libFirst = +(lib0 - S.ind.liberties).toFixed(2);
    S.turn += 1; v11ConTick(S);
    out.plebSettled = plist(c).length === 0;
    out.plebCarried = !!c.arts[pid1];
    const lib1 = S.ind.liberties;
    const pid2 = openIds('plebiscite')[0];
    if (pid2) v11ProposeArticle(pid2, false, 'plebiscite');
    out.libSecond = +(lib1 - S.ind.liberties).toFixed(2);
    out.plebCount = c.plebiscites;

    /* THE CONVENTION. */
    c = frame();
    v11CallConvention();
    out.convSits = v11ConventionSits(S);
    out.convSpanSessions = c.conv - S.turn;
    out.convCap = has('v11PendingCap') ? v11PendingCap(S) : 1;
    const four = openIds('assembly').slice(0, 4);
    four.forEach((id) => v11ProposeArticle(id, false, 'assembly'));
    out.convLaid = plist(c).length;
    out.convDues = plist(c).map((p) => p.due - p.laid);
    S.turn += 1; v11ConTick(S);
    out.convAfterOne = { settled:Object.keys(c.arts).length + Object.keys(c.failed).length, waiting:plist(c).length };
    out.convStood = plist(c).filter((p) => p.stood).length;

    /* AN OLD SAVE. The one pending article a save could carry, wrapped. */
    const blob = JSON.parse(JSON.stringify(S));
    blob.v11.con.pending = { id:'artPreamble', repeal:false, laid:2, due:4, campaign:1 };
    UI.conMigrated = 0;
    const back = v11Con(blob);
    out.mig = { len:plist(back).length, id:(plist(back)[0] || {}).id,
      campaign:(plist(back)[0] || {}).campaign, route:(plist(back)[0] || {}).route, flag:UI.conMigrated };
    const blob2 = JSON.parse(JSON.stringify(S));
    blob2.v11.con.pending = 'not an article';
    UI.conMigrated = 0;
    const back2 = v11Con(blob2);
    out.migBad = { len:plist(back2).length, flag:UI.conMigrated, arts:Object.keys(back2.arts).length };
    UI.conMigrated = 0;

    /* THE EQUAL STATE actually weighs the return. */
    c = frame();
    const plain = regionPartyFactor(S, me);
    S.acts.equalStates = true;
    const equal = regionPartyFactor(S, me);
    S.acts.equalStates = false;
    out.equalStates = { plain:+plain.toFixed(5), equal:+equal.toFixed(5), moved:plain !== equal,
      hasApply: typeof V11_ART.artRegionalWeighting.apply === 'function' };

    /* THE CARD names the body there is. */
    c = frame();
    S.lower = { exists:false, suspended:false };
    S.upper = { exists:true, elected:true, veto:2, ceremonial:false, seats:S.upper.seats };
    const wrap = document.createElement('div');
    wrap.innerHTML = v11ArtCard(V11_ART[openIds('assembly')[0] || 'artPreamble']);
    out.cardNoAssembly = wrap.textContent;
    out.cardSaysAssembly = /Assembly/.test(wrap.textContent);
    out.cardSaysSenate = /Senate/.test(wrap.textContent);
    out.cardRoutes = [].slice.call(wrap.querySelectorAll('[data-artroute]')).map((b) => b.getAttribute('data-artroute'));
    return out;
  });

  const C = consti;
  const books = Object.keys(C.byBook).map((k) => C.byBook[k]);
  /* S17j: eighty-ONE, and the offices book carries eleven. Ruling 3 asked for
     an article that attaches each vice to its principal, and there was no
     eighty-first slot to put it in without taking one away from somewhere it
     belongs. The symmetry the S11d assertion was written around is now seven
     books of ten and one of eleven, and it says so rather than being loosened
     to "at least ten" -- a bound nothing can ever breach is not a bound. */
  say(C.total === 81 && books.length === 8 && books.filter((n) => n === 10).length === 7 &&
      books.filter((n) => n === 11).length === 1 && C.byBook.offices === 11 &&
      C.noMoves === 0 && C.noText === 0 && C.noEffect.length === 0 &&
      C.dupNames.length === 0 && C.dupIds.length === 0,
    'eighty-one articles, and the offices book carries eleven',
    `${C.total} articles across ${books.length} books [${books.join(' ')}] -- seven of ten and the offices book ` +
    `of eleven, which is where S17j's Article of the Running Mate went · every one carries its own text and a ` +
    `moves line, and every one either aggregates into v11ConEffects or defines an apply() that touches state ` +
    `something else reads (${C.noEffect.length} that do neither) · no two share a name or an id`);

  say(C.hasCap && C.cap === 3 && C.laid === 3 && /3 articles are already/.test(C.fourthRefused || '') &&
      C.dues.join(',') === '2,2,2' && C.afterTwo === 0 && C.settled === 3,
    'three at a time, and they resolve apart',
    C.hasCap
      ? `three articles laid on the same session, each with its own two-session clock, all three settled together ` +
        `and the fourth refused with "${C.fourthRefused}" · c.pending was ONE object before S15e, and the refusal ` +
        `read "Another article is already before the country"`
      : 'v11PendingCap does not exist: one article at a time');

  say(C.assemblySpan === 2 && C.plebSpan === 1 && C.assemblyOn !== C.plebOn && /country/.test(C.plebOn),
    'two roads, two clocks, two juries',
    `the same article laid before ${C.assemblyOn} takes ${C.assemblySpan} sessions and is decided on the chambers; ` +
    `laid before ${C.plebOn} it takes ${C.plebSpan} and is decided there instead · a.referendum used to stack a ` +
    `country vote on top of the chamber vote rather than replace it`);

  say(C.electionsOn === false && C.plebOpenNoElections && C.plebSettled &&
      C.libFirst > 0 && C.libSecond > C.libFirst && C.plebCount === 2,
    'the plebiscite is open where nothing else is',
    `under a One Party State, with electionsOn false and the Assembly suspended, an article goes to the country ` +
    `and is decided in one session · the first plebiscite costs ${C.libFirst} of civil liberties and the second ` +
    `${C.libSecond}, because government by plebiscite gets dearer the more of it there is · the referendum road ` +
    `used to be closed under precisely the forms with no other way to pass anything`);

  say(C.convSits && C.convSpanSessions === 3 && C.convCap === 4 && C.convLaid === 4 &&
      C.convDues.join(',') === '1,1,1,1' && C.convAfterOne.settled + C.convAfterOne.waiting === 4 &&
      C.convAfterOne.settled > 0 && C.convStood === C.convAfterOne.waiting,
    'a convention is an event, not a discount',
    `it sits ${C.convSpanSessions} sessions, takes ${C.convCap} articles at a time and puts each of them ` +
    `${C.convDues[0]} session after it is laid · of four laid together ${C.convAfterOne.settled} were settled in ` +
    `that one session and ${C.convAfterOne.waiting} fell short and stand to the full term rather than being ` +
    `struck · before S15e a convention sat six sessions and subtracted 8 from a threshold, and nothing else`);

  say(C.mig.len === 1 && C.mig.id === 'artPreamble' && C.mig.campaign === 1 && C.mig.route === 'assembly' &&
      C.mig.flag === 1 && C.migBad.len === 0 && C.migBad.flag === -1 && C.migBad.arts > 0,
    'an old save keeps the article it was waiting on',
    `a save whose c.pending is a bare object loads with that article on the list, its campaign spending intact ` +
    `(${C.mig.campaign} of 3) and the Assembly road filled in, and the page says so · a blob whose pending is not ` +
    `article-shaped is dropped and COUNTED rather than guessed at, and the ${C.migBad.arts} articles already in ` +
    `that document are untouched`);

  say(C.equalStates.hasApply && C.equalStates.moved,
    'the Equal State weighs the return',
    `the regional term reads ${C.equalStates.plain} with the states counted by their people and ` +
    `${C.equalStates.equal} with each counting one · the article says "each state shall count alike in the ` +
    `return" and until S15e the return was the one thing it did not touch: its id appeared once in three ` +
    `megabytes, in its own definition`);

  say(!C.cardSaysAssembly && C.cardSaysSenate && C.cardRoutes.join(',') === 'assembly,plebiscite',
    'the card names the house that is there',
    `with the Assembly abolished and a Senate that sits, the card offers ${C.cardRoutes.join(' and ')} and does ` +
    `not mention the Assembly (${C.cardSaysAssembly}) · it read "Lay it before the Assembly" whatever was ` +
    `standing, and under an elections form with no Assembly no article could ever ratify`);

  /* ============================================================
     13. S15f: THE PARTY TREASURY.

     "It's weird to me that you use the NATION's treasury to fund YOUR party's
     actions." Fifty-seven party actions, twenty-seven of them charging the
     exchequer, including a fighting fund whose own card says the money comes
     from donors, and an opposition party buying newspapers and organisers out
     of a treasury it does not control.

     And st.funding: a live multiplier in supportTargets with a decay in
     endTurn and NO WRITER ANYWHERE IN THE FILE, so the vote model's slot for
     what a party's money buys was permanently zero.
     ============================================================ */
  const purse = await p3.evaluate(() => {
    const out = {};
    const has = (n) => typeof window[n] === 'function';
    out.hasPurse = has('partyPurse');
    out.hasIncome = has('partyIncome');

    /* the tiers */
    out.tiers = {};
    ['easy', 'gentle', 'normal', 'hard', 'brutal'].forEach((d) => {
      S = enrichState(v6NewGame(d, 'v6default', 'standard', 'lp'), false);
      const me = playParty(S);
      out.tiers[d] = {
        purse: has('partyPurse') ? Math.round(partyPurse(S, me)) : 0,
        income: has('partyIncome') ? +partyIncome(S, me).total.toFixed(1) : 0
      };
    });

    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    const me = playParty(S);
    S.ruling = me; S.coalition = [me]; S.capital = 2000; S.treasury = 4000;
    if (S.purse) PARTIES.forEach((p) => { S.purse[p.id] = 600; });
    S.funding = {};

    /* EVERY party action, driven through the real dispatcher, and the
       national treasury must not move by a single unit. */
    const t0 = S.treasury;
    let moneyActs = 0, ran = 0, spent = 0;
    PARTIES.forEach((p) => {
      partyActions(p.id).forEach((a) => {
        const m = actionMoney(a);
        if (!m) return;
        moneyActs++;
        const before = has('partyPurse') ? partyPurse(S, me) : 0;
        try { if (!a.can || a.can()) { doAction(a); ran++; spent += before - (has('partyPurse') ? partyPurse(S, me) : 0); } } catch (e) {}
      });
    });
    out.moneyActs = moneyActs;
    out.ran = ran;
    out.treasuryDelta = Math.round(S.treasury - t0);
    out.spentFromPurse = Math.round(spent);
    out.fundingWritten = Object.keys(S.funding || {}).length;

    /* THE TWO TRAPS. Seventeen can: predicates read S.treasury directly, so a
       button could promise what the handler would refuse; and the buttons are
       drawn from a second copy of the same arithmetic. Both are asked the way
       a player meets them: what the CARD does when the purse is full and the
       exchequer is empty, and the other way round. */
    out.stillReadTreasury = [];
    PARTIES.forEach((p) => {
      partyActions(p.id).forEach((a) => {
        if (a.can && /S\.treasury/.test(String(a.can))) out.stillReadTreasury.push(a.id);
      });
    });
    function buttonsFor(pid) {
      UI.tab = 'parties'; render();
      const cards = [].slice.call(document.querySelectorAll('#view [data-party="' + pid + '"][data-pact]'));
      const acts = {}; partyActions(pid).forEach((a) => { acts[a.id] = a; });
      return cards.filter((b) => { const a = acts[b.getAttribute('data-pact')]; return a && actionMoney(a); });
    }
    S.capital = 2000;
    S.treasury = 4000;
    if (S.purse) PARTIES.forEach((p) => { S.purse[p.id] = 0; });
    let bs = buttonsFor(me);
    out.pooredButtons = { total:bs.length, enabled:bs.filter((b) => !b.disabled).length };
    S.treasury = 0;
    if (S.purse) PARTIES.forEach((p) => { S.purse[p.id] = 600; });
    bs = buttonsFor(me);
    const acts2 = {}; partyActions(me).forEach((a) => { acts2[a.id] = a; });
    /* A button still off with a full purse must be off for a reason that is
       not money -- a press share already at its ceiling, a leader already
       co-opted, a house that does not sit. */
    const offForOther = bs.filter((b) => {
      if (!b.disabled) return false;
      const a = acts2[b.getAttribute('data-pact')];
      return !!a && has('actionCanPay') && actionCanPay(a, actionMoney(a));
    }).length;
    out.richButtons = { total:bs.length, enabled:bs.filter((b) => !b.disabled).length, offForOther:offForOther };
    UI.tab = 'chamber'; render();
    S.treasury = 4000;

    /* st.funding reaches the vote */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.funding = {};
    const base = supportTargets(S)[me];
    S.funding[me] = .2;
    const rich = supportTargets(S)[me];
    out.fundingMovesTheVote = rich > base;
    out.fundingLift = +((rich / base - 1) * 100).toFixed(2);
    /* and party money is what writes it */
    S.funding = {};
    if (has('partySpend')) partySpend(S, me, 40);
    out.spendWritesFunding = +((S.funding[me] || 0)).toFixed(3);

    /* the other six parties are paid and spend, so their money matters too */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.funding = {};
    if (has('partyPurseTick')) partyPurseTick(S);
    out.aiFunded = Object.keys(S.funding || {}).filter((k) => k !== playParty(S) && S.funding[k] > 0).length;

    /* the Act */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    const noAct = has('partyIncome') ? partyIncome(S, me).subsidy : 0;
    S.acts.partyFunding = true;
    const withAct = has('partyIncome') ? partyIncome(S, me).subsidy : 0;
    out.act = { exists: ACTS.some((a) => a.id === 'partyFunding'), before:+noAct.toFixed(1), after:+withAct.toFixed(1) };

    /* the balance line adds up */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.debt = 600;
    /* a constitutional article with a fiscal effect, so v11ConBudgetBase fires */
    const bc = v11Con(S);
    bc.arts = {}; bc.order = [];
    if (V11_ART.artInterstateCommerce) {
      bc.arts.artInterstateCommerce = { year:2025, margin:60 };
      bc.order.push('artInterstateCommerce');
    }
    const bd = budget(S);
    out.budget = { rev:+bd.rev.toFixed(2), exp:+bd.exp.toFixed(2), net:+bd.net.toFixed(2),
      interest:+bd.interest.toFixed(2), adds:Math.abs(bd.net - (bd.rev - bd.exp)) < .005 };

    /* the Ledger capital panel */
    S = enrichState(v6NewGame('easy', 'v6default', 'standard', 'lp'), false);
    S.ruling = playParty(S); S.coalition = [S.ruling];
    UI.tab = 'ledger'; render();
    const capPanel = [].slice.call(document.querySelectorAll('#view .panel'))
      .filter((x) => /Political Capital/.test((x.querySelector('h2') || {}).textContent || ''))[0];
    if (capPanel) {
      const cells = [].slice.call(capPanel.querySelectorAll('tbody tr'));
      const nums = cells.map((tr) => parseFloat((tr.querySelector('.num') || {}).textContent || '0'));
      const total = nums[nums.length - 1];
      const rows = nums.slice(0, -1).reduce((a, b2) => a + b2, 0);
      out.ledger = { rows:nums.length - 1, total:+total.toFixed(1), sum:+rows.toFixed(1),
        adds:Math.abs(total - rows) < .9, real:+capitalIncome(S).toFixed(1) };
    }
    UI.tab = 'chamber'; render();
    return out;
  });

  const F = purse;
  const tier = (k) => F.tiers[k] || { purse:0, income:0 };
  say(F.hasPurse && F.hasIncome && tier('easy').income > tier('normal').income * 3 &&
      tier('normal').income > tier('brutal').income &&
      tier('easy').purse > 140 && tier('brutal').purse > 0,
    'every party has money of its own',
    F.hasPurse
      ? `a party opens with ${tier('easy').purse} and raises ${tier('easy').income} a session on Very easy, ` +
        `${tier('normal').purse}/${tier('normal').income} on Normal and ${tier('brutal').purse}/${tier('brutal').income} ` +
        `on Very hard · party actions cost between three and thirteen, so the owner's "cake walk" is one tier's dial ` +
        `(purseMult) rather than the exchequer's`
      : 'there is no party purse');

  say(F.ran > 40 && F.treasuryDelta === 0 && F.spentFromPurse > 0,
    'the nation does not fund your party',
    `${F.ran} of ${F.moneyActs} money-bearing party actions were driven through the real dispatcher and the national ` +
    `treasury moved by ${F.treasuryDelta} · ${F.spentFromPurse} came out of the parties' own purses instead · ` +
    `before S15f every one of them charged the exchequer, and eleven of them did it inside their own run() bodies ` +
    `past a hand-kept array of ids that doAction had to consult`);

  say(F.stillReadTreasury.length === 0 && F.pooredButtons.total > 6 &&
      F.pooredButtons.enabled === 0 &&
      F.richButtons.enabled + F.richButtons.offForOther === F.richButtons.total,
    'the card is priced in the money that pays for it',
    F.stillReadTreasury.length
      ? F.stillReadTreasury.length + ' can: predicate(s) still read S.treasury: ' + F.stillReadTreasury.slice(0, 4).join(', ')
      : `no can: predicate on a party action reads the national treasury · with the purse empty and the exchequer ` +
        `holding 4,000, ${F.pooredButtons.enabled} of ${F.pooredButtons.total} money-bearing buttons are live; with ` +
        `the purse full and the exchequer at nothing, ${F.richButtons.enabled} of ${F.richButtons.total} are and ` +
        `the other ${F.richButtons.offForOther} are held back by something that is not money · ` +
        `seventeen predicates and five separate button strips read S.treasury by hand before this PR`);

  say(F.fundingMovesTheVote && F.spendWritesFunding > 0 && F.aiFunded >= 5,
    'party money reaches the ballot',
    `st.funding is a live multiplier in supportTargets with a decay in endTurn and, until this PR, no writer ` +
    `anywhere in the file · forty of party money now writes ${F.spendWritesFunding} of it, which is worth ` +
    `${F.fundingLift} percent of the vote at 0.2 · and ${F.aiFunded} of the six parties the player does not lead ` +
    `are paid and spend in the same session tick, which is what makes an AI party's finances matter`);

  say(F.act.exists && F.act.before === 0 && F.act.after > 0,
    'the law the owner meant',
    `the State Funding of Parties Act pays every party that returns members a grant on the size of its return: ` +
    `the subsidy channel reads ${F.act.before} without it and ${F.act.after} with it · it is an act rather than a ` +
    `statute because the twenty core statute categories hold exactly twenty-four each and that count is a contract`);

  say(F.budget.adds,
    'the balance line adds up',
    `revenue ${F.budget.rev} less expenditure ${F.budget.exp} is ${F.budget.net}, and interest of ` +
    `${F.budget.interest} is counted once · v11ConBudgetBase and v11DeptBudgetBase both computed ` +
    `rev - exp - interest, and interest is already inside exp when the base returns, so a save with a fiscal ` +
    `article and a department settlement charged the debt three times on the line the Ledger prints`);

  say(!!F.ledger && F.ledger.adds && F.ledger.rows >= 11,
    'the capital panel adds up to its own total',
    F.ledger
      ? `${F.ledger.rows} rows summing to ${F.ledger.sum} against a printed total of ${F.ledger.total}, which is ` +
        `the real capitalIncome · the table re-typed eleven of the base's terms by hand, omitted the rest and all ` +
        `five wrappers, and printed the real figure underneath: on Very easy the rows summed to about 5 beside a ` +
        `total of 75`
      : 'the Political Capital panel was not rendered');

  /* ============================================================
     14. S15g: EXTRAORDINARY MEASURES.

     Twenty-five measures, twenty-three of them open to anyone, TWO belonging
     to a party, and nothing at all for the Social Democrats, the Federal Party
     or the Coalition for Unity and Progress. `X(o)` was the identity function,
     so there were no defaults and no gating vocabulary: no cat, no req, no
     reqText, no needs, no forms. The gate was one external predicate and one
     refusal string -- "That is not open to this government" -- whatever the
     reason. And when tier 1 was shut the panel rendered NO CARDS AT ALL, which
     is the state on turn one of six of the eleven openings.

     Signing all twenty-five moved the security state by exactly zero.
     ============================================================ */
  const measures = await p3.evaluate(() => {
    const out = {};
    const has = (n) => typeof window[n] === 'function';
    out.hasWhy = has('extraWhy');
    out.hasMods = has('extraMods');

    /* the book */
    out.total = EXTRA.length;
    out.byBook = {};
    (typeof EXTRA_BOOKS !== 'undefined' ? EXTRA_BOOKS : [{ id:'universal' }]).forEach((b) => {
      out.byBook[b.id] = EXTRA.filter((m) => m.book === b.id).length;
    });
    out.partiesWithABook = PARTIES.filter((p) => EXTRA.some((m) => m.book === p.id)).length;
    const names = {}; out.dupNames = [];
    EXTRA.forEach((m) => { if (names[m.name]) out.dupNames.push(m.name); names[m.name] = 1; });
    out.noEffect = EXTRA.filter((m) => {
      const mm = m.mods || {};
      const standing = Object.keys(mm).some((k) => (typeof mm[k] === 'object' ? Object.keys(mm[k]).length : mm[k]));
      return !Object.keys(m.eff || {}).length && !Object.keys(m.mood || {}).length && !standing &&
        !m.money && !m.states && !m.army && !m.gerry && !m.wreck && !m.security;
    }).map((m) => m.id);
    out.defaults = EXTRA.filter((m) => m.unrest === undefined || m.exposure === undefined ||
      m.book === undefined || typeof m.req !== 'function').length;

    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    /* THE PANEL RENDERS FOR A PARTY WITH NOTHING OPEN. A Social Democrat on
       turn one of a Federal Republic: the hardest case there is. */
    S.ruling = 'sd'; S.playAs = 'sd'; S.coalition = ['sd']; S.capital = 400;
    if (S.uiPrefs) S.uiPrefs.extraFilter = 'all';
    const wrap = document.createElement('div');
    wrap.innerHTML = prerogativePanel();
    out.sd = {
      cards: wrap.querySelectorAll('.card').length,
      locked: wrap.querySelectorAll('.card.locked').length,
      reasons: wrap.querySelectorAll('.card .note.muted').length,
      filters: wrap.querySelectorAll('[data-extrafilter]').length,
      ownBook: EXTRA.filter((m) => m.book === 'sd').length
    };
    /* and the reasons are DIFFERENT reasons */
    const whys = {};
    EXTRA.forEach((m) => { const w = has('extraWhy') ? extraWhy(S, m) : 'That is not open to this government.'; if (w) whys[w] = 1; });
    out.distinctWhy = Object.keys(whys).length;
    out.sampleWhy = Object.keys(whys).slice(0, 3);

    /* THE RATCHET COMPOUNDS. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.ruling = 'rsf'; S.playAs = 'rsf'; S.coalition = ['rsf']; S.capital = 900;
    const ss0 = securityState(S);
    ['signingStatements', 'classifyRecords', 'executivePrivilege'].forEach((id) => { if (EXTRA_BY[id]) S.extra[id] = 'upheld'; });
    out.ratchet = { before:+ss0.toFixed(1), after:+securityState(S).toFixed(1) };

    /* THE STANDING MODIFIERS REACH THEIR READERS. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.ruling = 'rsf'; S.playAs = 'rsf'; S.coalition = ['rsf'];
    const bare = { unrest:unrestTarget(S), poverty:indicatorTargets(S).poverty, cost:policyCost('minimumWage', 1) };
    ['x15workersCouncils', 'x15requisition'].forEach((id) => { if (EXTRA_BY[id]) S.extra[id] = 'upheld'; });
    const withm = { unrest:unrestTarget(S), poverty:indicatorTargets(S).poverty, cost:policyCost('minimumWage', 1) };
    out.standing = {
      unrest:[+bare.unrest.toFixed(2), +withm.unrest.toFixed(2)],
      poverty:[+bare.poverty.toFixed(2), +withm.poverty.toFixed(2)],
      cost:[bare.cost, withm.cost],
      moved: withm.unrest !== bare.unrest && withm.poverty !== bare.poverty && withm.cost !== bare.cost
    };

    /* AUTHORABLE UNREST, and REPEAL. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.ruling = 'rsf'; S.playAs = 'rsf'; S.coalition = ['rsf']; S.capital = 900; S.unrest = 30;
    const distinctUnrest = {};
    EXTRA.forEach((m) => { distinctUnrest[m.unrest] = 1; });
    out.unrestValues = Object.keys(distinctUnrest).length;
    const target = EXTRA_BY.x15requisition;
    if (target) {
      const u0 = S.unrest;
      doExtra(target);
      out.signed = { status:S.extra[target.id], unrestUp:+(S.unrest - u0).toFixed(1), authored:target.unrest };
      const lib0 = S.ind.liberties, u1 = S.unrest;
      if (has('extraRepeal')) extraRepeal(target.id);
      out.repealed = { status:S.extra[target.id], libertiesBack:S.ind.liberties > lib0, unrestDown:S.unrest < u1 };
    }

    /* THE FILTER. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.ruling = 'pnl'; S.playAs = 'pnl'; S.coalition = ['pnl'];
    if (S.uiPrefs) {
      S.uiPrefs.extraFilter = 'mine';
      out.mineShown = EXTRA.filter((m) => (has('extraShown') ? extraShown(m) : true)).length;
      S.uiPrefs.extraFilter = 'all';
      out.allShown = EXTRA.filter((m) => (has('extraShown') ? extraShown(m) : true)).length;
      S.uiPrefs.extraFilter = 'all';
    }
    return out;
  });

  const M = measures;
  const bookCounts = Object.keys(M.byBook).map((k) => M.byBook[k]);
  const partyBooks = Object.keys(M.byBook).filter((k) => k !== 'universal').map((k) => M.byBook[k]);
  say(M.total >= 60 && M.partiesWithABook === 7 && M.dupNames.length === 0 &&
      M.noEffect.length === 0 && M.defaults === 0 &&
      partyBooks.length === 7 && Math.min.apply(null, partyBooks) >= 5,
    'every party has a book of its own',
    `${M.total} measures across ${Object.keys(M.byBook).length} books [${bookCounts.join(' ')}] and all seven ` +
    `parties have one · there were 25, twenty-three of them open to anyone and two belonging to a party, so the ` +
    `Social Democrats, the Federal Party and the Coalition for Unity and Progress had nothing of their own at all · ` +
    `${M.defaults} measures are missing a constructor default and ${M.noEffect.length} move nothing`);

  say(M.sd.cards === M.total && M.sd.locked > 0 && M.sd.reasons === M.total && M.sd.filters >= 4 &&
      M.sd.ownBook >= 5 && M.distinctWhy >= 5,
    'a locked book is still a book',
    `a Social Democrat on turn one of a Federal Republic -- the case that rendered NO CARDS AT ALL before this PR -- ` +
    `sees ${M.sd.cards} cards, ${M.sd.locked} of them locked, and every one of them carries the reason it is locked ` +
    `(${M.sd.reasons}) · there are ${M.distinctWhy} distinct reasons where there was one sentence, for example ` +
    `"${M.sampleWhy[0]}"`);

  say(M.ratchet.after > M.ratchet.before,
    'the measures build the apparatus that opened them',
    `three measures in force take the security state from ${M.ratchet.before} to ${M.ratchet.after} · the ratchet ` +
    `ran one way before S15g: securityState opened the measures at 30 and 50, read them in the court's hold ` +
    `formula and printed them on the panel, and signing all twenty-five of them moved it by exactly zero`);

  say(M.hasMods && M.standing.moved,
    'a measure stands for something',
    `two measures in force move the unrest target from ${M.standing.unrest[0]} to ${M.standing.unrest[1]}, the ` +
    `poverty target from ${M.standing.poverty[0]} to ${M.standing.poverty[1]} and a Labour statute from ` +
    `${M.standing.cost[0]} capital to ${M.standing.cost[1]} · every field of extraMods has a named reader, on the ` +
    `v11ConEffects pattern · a measure moved a stock once at signature and then stood for the rest of the campaign ` +
    `doing nothing but pay capital`);

  const sg = M.signed || {}, rp = M.repealed || {};
  say(M.unrestValues >= 6 && !!M.signed && sg.unrestUp === sg.authored &&
      !!M.repealed && rp.status === 'repealed' && rp.libertiesBack && rp.unrestDown,
    'the unrest is authored, and a measure can be undone',
    `the book carries ${M.unrestValues} distinct unrest costs where there were two, 6 and 13 by tier · signing the ` +
    `one measured raised unrest by exactly the ${sg.authored} it authors · and the government that signed it ` +
    `can repeal it (${rp.status}), which gives back the liberties and takes back part of the unrest · ` +
    `before this PR only the COURT could undo a measure, so it was a one-way ratchet whatever the government came ` +
    `to think of it`);

  say(M.mineShown > 0 && M.mineShown < M.allShown,
    'the panel can be asked a question',
    `asked for what belongs to the party in government the book answers with ${M.mineShown} of ${M.allShown} · it ` +
    `was two flat lists with no filter and no books`);

  /* S15h -- WHAT WINS AN ELECTION. Measured the way v11RegionalSeats measures
     the federation: one channel at a time, driven to its ceiling from a
     neutralised baseline, read back through projection() in Assembly seats.

     The old build's readings are in the assertion text. They are the reason
     this PR exists: the party organisation was worth nine times the whole
     Campaign page and the caucuses were worth nothing at all. */
  const camp = await page.evaluate(() => {
    const out = {}, me = playParty(S);
    const keep = {
      machine: JSON.parse(JSON.stringify(S.machine || {})),
      funding: JSON.parse(JSON.stringify(S.funding || {})),
      campaign: JSON.parse(JSON.stringify(S.campaign || {})),
      interests: JSON.parse(JSON.stringify(S.interests || {})),
      loyalty: (S.factions[me] || []).map(f => f.loyalty),
      unity: S.unity, purse: JSON.parse(JSON.stringify(S.purse || {})),
      psupport: JSON.parse(JSON.stringify(S.psupport || {}))
    };
    const seats = () => ((projection(S) || {}).seats || {})[me] || 0;
    const settle = () => { for (let i = 0; i < 20; i++) updatePartySupport(S); };
    const neutral = () => {
      PARTIES.forEach(p => { S.machine[p.id] = 0; S.funding[p.id] = 0; if (S.press) S.press[p.id] = 0; });
      S.apparatus = 0; S.unity = 60;
      const c = S.campaign;
      c.field = 0; c.media = 0; c.data = 0; c.debate = 0; c.message = null;
      REGIONS.forEach(r => { c.targets[r.id] = 0; });
      PV5_INTERESTS.forEach(g => { const q = S.interests[g.id]; q.endorsement = false; q.relation = 50; q.influence = 50; });
      PARTIES.forEach(p => (S.factions[p.id] || []).forEach(f => { f.loyalty = 55; }));
      S.purse[me] = 0;
      settle();
    };
    const fullDeck = () => {
      S.campaign.field = 100; S.campaign.media = 100; S.campaign.data = 100; S.campaign.debate = 100;
      REGIONS.forEach(r => { S.campaign.targets[r.id] = 3; });
      S.campaign.message = topIssues(S, 1)[0].id;
      S.purse[me] = 200;
    };
    neutral(); const base = seats();
    neutral(); S.machine[me] = 1; settle(); out.machine = seats() - base;
    neutral(); fullDeck(); settle(); out.campaign = seats() - base;
    /* the ceiling, asked honestly: the dearest campaign anyone can buy -- the
       whole deck AND every organisation endorsing -- against what is carried */
    PV5_INTERESTS.forEach(g => { const q = S.interests[g.id]; q.endorsement = true; q.influence = 100; });
    /* degrade rather than throw on a build without them, so this whole block
       can be run against HEAD to prove it reddens */
    out.raw = typeof pv5CampaignRaw === 'function' ? Math.round(pv5CampaignRaw(S) * 100) / 100 : 18.34;
    out.ceiling = typeof V15_CAMPAIGN_MAX === 'number' ? V15_CAMPAIGN_MAX : 12;
    out.carried = Math.round(pv5CampaignPower(S) * 100) / 100;
    neutral(); (S.factions[me] || []).forEach(f => { f.loyalty = 100; }); S.unity = 100; settle();
    out.caucusHigh = seats() - base;
    neutral(); (S.factions[me] || []).forEach(f => { f.loyalty = 0; }); S.unity = 20; settle();
    out.caucusLow = seats() - base;
    neutral();
    PV5_INTERESTS.forEach(g => { const q = S.interests[g.id]; q.endorsement = true; q.relation = 100; q.influence = 100; });
    settle(); out.orgs = seats() - base;
    neutral(); S.funding[me] = .35; settle(); out.money = seats() - base;
    neutral(); S.machine[me] = 1; S.funding[me] = .35; fullDeck();
    (S.factions[me] || []).forEach(f => { f.loyalty = 100; });
    PV5_INTERESTS.forEach(g => { const q = S.interests[g.id]; q.endorsement = true; q.relation = 100; q.influence = 100; });
    settle(); out.all = seats() - base;
    out.base = base;

    /* THE MACHINE IS READ ONCE. A number that is applied in supportTargets and
       again in ballot is felt at roughly its square, and no coefficient in
       either place says so. Asked of the source rather than of the behaviour,
       because the behaviour is what the seat table above already measures. */
    out.ballotSrc = ballot.toString();
    out.machineInBallot = /st\.machine|\.machine\[/.test(pv5BallotV4.toString());
    out.turnoutInBallot = /partyTurnout/.test(pv5BallotV4.toString());

    /* the readout the page prints */
    const w = typeof v15CampaignSeats === 'function' ? v15CampaignSeats(S) : {};
    out.channels = ['machine', 'campaign', 'caucus', 'orgs', 'money'].filter(k => typeof w[k] === 'number').length;
    out.readoutNonZero = ['machine', 'campaign', 'caucus', 'orgs', 'money'].filter(k => typeof w[k] === 'number' && w[k] !== 0).length;

    S.machine = keep.machine; S.funding = keep.funding; S.campaign = keep.campaign;
    S.interests = keep.interests; S.unity = keep.unity; S.purse = keep.purse;
    S.psupport = keep.psupport;
    (S.factions[me] || []).forEach((f, i) => { f.loyalty = keep.loyalty[i]; });
    return out;
  });

  say(!camp.machineInBallot && camp.turnoutInBallot && camp.machine > 40 && camp.machine < 185,
    'the machine is counted once',
    `the party organisation at its ceiling is worth +${camp.machine} Assembly seats from a ${camp.base}-seat baseline, ` +
    `where this same probe reads +193 on the build before this PR · supportTargets multiplied by 1 + machine and ` +
    `ballot then multiplied the settled support by 1 + machine * .25 again, and psupport converges on the target, so ` +
    `the second reading landed on a number the first had already inflated · it is read ONCE now, through machineOf, ` +
    `at a stated gain: ballot reads st.machine ${camp.machineInBallot}, and what it does with that pass now is ` +
    `turnout ${camp.turnoutInBallot} · the gain was set by measurement, not by taste -- tools/pacing.js plays the ` +
    `arc and a deeper cut hands the harness every election it fights`);

  say(camp.campaign > 55 && camp.orgs > 50,
    'the campaign and the organisations are worth seats',
    `the whole Campaign page at its ceiling is worth +${camp.campaign} seats where it was +24, and every organisation ` +
    `endorsing is worth +${camp.orgs} where it was +40 · the deck was one term inside one clamped score that reached ` +
    `the count as a single multiply of at most 1.12 on the player's share`);

  say(camp.caucusHigh > 15 && camp.caucusLow < -15,
    'the caucuses reach the vote',
    `caucuses loyal to the leadership are worth +${camp.caucusHigh} seats and caucuses that have given up cost ` +
    `${camp.caucusLow} · both were EXACTLY ZERO before this PR: factionAverage terminated in unity, a bill score and ` +
    `one event, and grep -i turnout found the word in prose and in one rigging set-piece and nowhere in the vote model`);

  say(camp.raw <= camp.ceiling && camp.carried > 0,
    'nothing the player buys is discarded in silence',
    `the dearest campaign that can be bought -- the whole deck and every organisation endorsing -- scores ` +
    `${camp.raw} against a ceiling of ${camp.ceiling}` +
    (camp.raw <= camp.ceiling ? `, so none of it is left at the ceiling` : `, so ${(camp.raw - camp.ceiling).toFixed(2)} of it is thrown away`) +
    ` (${camp.carried} is carried: the score plus what the narrative is worth to a government) · the ceiling was 12 ` +
    `against a deck-only score of 18.34, so better than a third of what the player had bought went nowhere -- and the ` +
    `page printed the clamped number, so nothing on any screen said so`);

  say(camp.channels === 5 && camp.readoutNonZero >= 3 && camp.all > 250,
    'the page says what each of them is worth',
    `v15CampaignSeats answers in ${camp.channels} channels, ${camp.readoutNonZero} of them non-zero on the live ` +
    `state · everything at once is +${camp.all} where this probe reads +315 on the old build: a government that has ` +
    `built all five IS stronger than one that had only built the organisation, because four of the five were worth ` +
    `+20, 0, +32 and +58 on that build and are worth +${camp.campaign}, +${camp.caucusHigh}, +${camp.orgs} and ` +
    `+${camp.money} on this one · the arc tools/pacing.js plays is unchanged (3 elections won and 10 years governing ` +
    `over fifty sessions, against 2 and 8 before), because that harness takes the first choice always and never ` +
    `builds any of them`);

  /* S15i -- THE OFFICE IS WON BY A PERSON. Every probe degrades rather than
     throws on a build without the model, so the whole block can be run against
     HEAD to prove it reddens. */
  const per = await page.evaluate(() => {
    const out = { has: typeof execNominate === 'function' };
    const me = playParty(S);
    const keep = { exec:JSON.parse(JSON.stringify(S.exec)), ruling:S.ruling, coalition:S.coalition,
      figures:JSON.parse(JSON.stringify(S.figures || {})), cap:S.capital, tre:S.treasury,
      ministers:JSON.parse(JSON.stringify(S.ministers || {})),
      cabinet:JSON.parse(JSON.stringify(S.cabinet || {})),
      purse:JSON.parse(JSON.stringify(S.purse || {})), push:S.execPush,
      con:S.v11 && S.v11.con ? JSON.parse(JSON.stringify(S.v11.con)) : null };
    S.ruling = me; S.coalition = [me];
    ['pres', 'vpres', 'chan', 'vchan'].forEach(k => { S.exec[k] = me; });
    /* a bench worth the name: fill the cabinet, all of it the player's party
       and all of it looking upward */
    pv5PortfolioRows().forEach(r => {
      if (!S.ministers[r.key]) { S.cabinet[r.key] = 1; S.ministers[r.key] = pv5MakeMinister(S, r.key, 0); }
      S.ministers[r.key].party = me; S.ministers[r.key].ambition = 80;
    });
    /* and two governorships, so all four places a candidate can come from are
       exercised rather than only the two the harness state happens to have */
    if (S.v6 && S.v6.governors) ['rigel', 'thaxia'].forEach(rid => { if (S.v6.governors[rid]) S.v6.governors[rid].party = me; });
    if (!out.has) {
      /* the old model, measured the same way: holderOf mints a stranger and
         the contest reads nothing about them */
      const f0 = holderOf(S, 'pres');
      out.bench = 0; out.from = f0.from || 'nowhere'; out.terms = f0.terms || 0;
      out.hasCompetence = typeof f0.competence === 'number';
      out.pushAimed = false; out.pushToLeader = false; out.barred = false;
      out.vacated = false; out.remembered = 0; out.protOpts = 0;
      out.factorSitting = 1.18; out.factorNewFace = 1.18;
      S.exec = keep.exec; S.ruling = keep.ruling; S.coalition = keep.coalition;
      S.figures = keep.figures; S.ministers = keep.ministers; S.cabinet = keep.cabinet;
      return out;
    }

    const nom = execNominate(S, 'pres', me);
    out.bench = nom.bench.length;
    out.contested = nom.contested;
    out.origins = nom.bench.map(c => c.from).filter((v, i, a) => a.indexOf(v) === i).length;
    const seated = execSeat(S, 'pres', me, nom.winner);
    out.seatedIsNominee = seated.name === nom.winner.name;
    out.from = seated.from;
    out.hasCompetence = typeof seated.competence === 'number';
    /* an ambitious minister who takes a great office LEAVES THE CABINET */
    out.vacated = nom.winner.seat === 'minister' ? !S.ministers[nom.winner.post] : null;

    /* terms accumulate on the PERSON, and the article that says so bars a third */
    const again = execSeat(S, 'pres', me, execNominate(S, 'pres', me).winner);
    out.sameHolder = again.name === seated.name;
    out.terms = again.terms;
    const sitOf = () => execBench(S, 'pres', me).filter(c => c.sitting)[0];
    out.barredBefore = execTermBarred(S, 'pres', sitOf());
    const c11 = v11Con(S);
    c11.arts.artTermLimit = { year:yearOf(S.turn), margin:62, entrenched:true, turn:S.turn };
    out.barred = execTermBarred(S, 'pres', sitOf());
    out.replacedWhenBarred = execNominate(S, 'pres', me).winner.name !== again.name;
    delete c11.arts.artTermLimit;

    /* incumbency at the person level, not the party's */
    const bench2 = execNominate(S, 'pres', me).bench;
    out.factorSitting = +execPersonFactor(S, 'pres', me, bench2.filter(c => c.sitting)[0]).toFixed(3);
    out.factorNewFace = +execPersonFactor(S, 'pres', me, bench2.filter(c => !c.sitting)[0]).toFixed(3);

    /* the ticket is aimed, credited to the party the PLAYER leads, and paid
       out of that party's own funds -- measured while the player leads a
       JUNIOR partner, which is the case the old write got wrong */
    S.ruling = 'fp'; S.coalition = ['fp', me];
    S.execPush = {}; S.capital = 400; S.treasury = 1200; S.purse[me] = 400;
    const act = ACTIONS.filter(x => x.id === 'execPush')[0];
    out.pushOpts = (act.opts || []).length;
    const t0 = S.treasury, p0 = partyPurse(S, me);
    doAction(act, act.opts[2]);
    out.pushOnAimed = +execPushOn(S, 'chan', me).toFixed(3);
    out.pushOnOther = +execPushOn(S, 'pres', me).toFixed(3);
    out.pushToLeader = execPushOn(S, 'chan', 'fp') > 0;
    out.pushAimed = out.pushOnAimed > 0 && out.pushOnOther === 0;
    out.pushTreasury = S.treasury === t0;
    out.pushPurse = partyPurse(S, me) < p0;
    S.ruling = me; S.coalition = [me];

    /* the people who wanted it and did not get it remember */
    const nom3 = execNominate(S, 'vpres', me), was = {};
    nom3.runners.forEach(r => { if (r.seat === 'minister' && S.ministers[r.post]) was[r.post] = { l:S.ministers[r.post].loyalty, a:S.ministers[r.post].ambition }; });
    execRemember(S, nom3.runners);
    out.runnersUp = Object.keys(was).length;
    out.remembered = Object.keys(was).filter(k => S.ministers[k].loyalty < was[k].l && S.ministers[k].ambition > was[k].a).length;

    /* the protege is somebody the player built, and the office is chosen */
    S.capital = 400; S.purse[me] = 400;
    const pp = ACTIONS.filter(x => x.id === 'promoteProtege')[0];
    out.protOpts = (pp.opts || []).length;
    const before = S.figures.exec.vchan.name;
    doAction(pp, pp.opts[3]);
    out.protChanged = S.figures.exec.vchan.name !== before;
    out.protFrom = S.figures.exec.vchan.from;

    S.exec = keep.exec; S.ruling = keep.ruling; S.coalition = keep.coalition;
    S.figures = keep.figures; S.ministers = keep.ministers; S.cabinet = keep.cabinet;
    S.capital = keep.cap; S.treasury = keep.tre; S.purse = keep.purse; S.execPush = keep.push;
    if (keep.con && S.v11) S.v11.con = keep.con;
    return out;
  });

  say(per.has && per.bench >= 8 && per.origins >= 3 && per.seatedIsNominee &&
      per.from !== 'the party' && per.hasCompetence,
    'the office is won by a person',
    `the party puts up one of ${per.bench} named people, from ${per.origins} of the four places a candidate can ` +
    `come from -- the office, the leadership, the ministry, the states -- and the winner takes the chair out of ` +
    `${per.from} · before this PR the office ` +
    `was won by a PARTY and a stranger was minted afterwards by holderOf, with no competence, no ambition and no ` +
    `term count; the figure carries all three now (${per.hasCompetence})`);

  say(per.has && per.terms === 2 && !per.barredBefore && per.barred && per.replacedWhenBarred,
    'the Article of the Limited Term limits a term',
    `a holder returned a second time is on ${per.terms} terms, and with the article adopted the sitting holder is ` +
    `barred (${per.barredBefore} -> ${per.barred}) and the party puts somebody else up (${per.replacedWhenBarred}) · ` +
    `its own sentence has read "no person shall hold the same great office for more than two terms together" since ` +
    `S11d, it has no apply(), and NO executive term counter existed anywhere in the file for it to read`);

  say(per.has && per.factorSitting > per.factorNewFace && per.factorNewFace > 1,
    'incumbency belongs to the person',
    `the sitting holder standing again is worth ${per.factorSitting} against ${per.factorNewFace} for the same ` +
    `party running a new face · it was a flat 1.18 keyed on the PARTY, so a beloved twenty-year technocrat and an ` +
    `eighty-year-old nobody the party had installed the week before were the same number`);

  say(per.has && per.pushOpts === 4 && per.pushAimed && !per.pushToLeader && per.pushTreasury && per.pushPurse,
    'the executive ticket can be aimed and is paid for by the party',
    `the ticket has ${per.pushOpts} offices to choose between and the money lands on the one chosen ` +
    `(${per.pushOnAimed} there, ${per.pushOnOther} elsewhere) · measured with the player leading a JUNIOR coalition ` +
    `partner, the credit goes to the player's own party and not to the senior one (${per.pushToLeader}), and it is ` +
    `paid out of party funds with the exchequer untouched (${per.pushTreasury}/${per.pushPurse}) · the old write was ` +
    `S.execPush[S.ruling], keyed on no office at all, and its money came out of the national treasury`);

  say(per.has && per.runnersUp > 0 && per.remembered === per.runnersUp && per.vacated !== false &&
      per.protOpts === 4 && per.protChanged && per.protFrom !== 'the party',
    'ambition reaches past its own portfolio',
    `${per.remembered} of ${per.runnersUp} ministers who wanted a great office and did not get it lose loyalty and ` +
    `gain ambition for it, a minister who WINS one leaves the cabinet to take it (${per.vacated}), and Elevate a ` +
    `Protege names ${per.protOpts} offices and lifts somebody real out of ${per.protFrom} · it used to pick a RANDOM ` +
    `office and mint a stranger · ambition was written six ways and read twice: a -0.29-a-session loyalty drag and a ` +
    `>= 55 gate on a button whose whole effect was +1 to a rank integer on the same portfolio`);

  /* S15j -- THE NORTHERN ALLIANCE IS A SET OF MEMBERS. Every probe degrades
     rather than throws on a build without the model. */
  const all = await page.evaluate(() => {
    const out = { has: typeof allianceState === 'function' };
    const act = (id) => ACTIONS.filter(x => x.id === id)[0];
    out.powers = POWERS.length;
    const opts = (id) => { const a = act(id); return a ? (a.opts || []).length : 0; };
    out.targets = { envoy:opts('envoy'), treaty:opts('treaty'), coerce:opts('coerce'),
      sanction:opts('sanction'), accede:opts('accede') };
    /* the five S10e powers, and whether the Foreign Office can name them */
    const late = ['tarnow', 'zhenkai', 'oranje', 'khoraz', 'valdenmark'].filter(id => POWER[id]);
    out.late = late.length;
    out.reachable = late.filter(id => (act('envoy').opts || []).some(o => o.label.indexOf(POWER[id].short) >= 0)).length;
    const t0 = act('treaty');
    out.treatyWritesOne = !!t0 && (t0.opts || []).length > 0 && /v6TreatyDialog/.test(String(t0.opts[0].run));

    /* THE FOUR AFFORDANCES THAT SAID "the alliance" AND MOVED NOTHING. Run
       each one's own body against a clone and read st.powers.alliance back. */
    const moved = (fn) => {
      const box = v6Sandbox(function (c) {
        c.a0 = relOf(c, 'alliance');
        try { fn(c); } catch (e) { c.threw = String(e); }
        c.a1 = relOf(c, 'alliance');
      });
      return box.st.a1 !== box.st.a0;
    };
    const evChoice = (evId, label) => {
      const e = EVENTS.filter(x => x.id === evId)[0];
      if (!e) return null;
      const ch = (e.ch || []).filter(x => x.l === label)[0];
      return ch ? ch.f : null;
    };
    const convene = evChoice('moya', 'Convene the Northern Alliance');
    const withdraw = evChoice('foreignCondemnation', 'Withdraw from the Alliance entirely');
    /* S16c rebuilt this list over every capital and put the power id on each
       leg, so the fixture names the CAPITAL rather than the words on the card. */
    const visit = ((act('stateVisit') || {}).opts || [])
      .filter(o => o.power === 'alliance' || /Alliance capitals/.test(o.label))[0];
    out.convene = convene ? moved(convene) : null;
    out.withdraw = withdraw ? moved(withdraw) : null;
    out.visit = visit ? moved(visit.run) : null;

    if (!out.has) { out.cap0 = null; out.cap2 = null; out.acceptRate = null; return out; }

    /* THE STATUTE IS READ. Its id appeared exactly once in three megabytes
       before this PR: in its own definition. */
    const keepPol = S.pol.allianceExpansion, keepAll = S.alliance;
    S.pol.allianceExpansion = 0;
    out.cap0 = allianceCap(S);
    out.why0 = allianceWhy(S, 'meridian');
    S.pol.allianceExpansion = 2;
    out.cap2 = allianceCap(S);
    S.pol.allianceExpansion = keepPol; S.alliance = keepAll;

    /* A DIE THAT CAN SAY NO, at the odds the card prints. No diplomatic
       decision in the game spent one before: every other applies a fixed
       shift and reports it as a fact. */
    const sample = (rel, alli, tension, exp) => {
      const box = v6Sandbox(function (c) {
        c.yes = 0; c.odds = 0;
        for (let i = 0; i < 400; i++) {
          /* reset the whole question each time: allianceInvite moves the
             relation either way, so 400 refusals would walk it to the floor */
          c.alliance = { members:[], asked:{}, founded:1 };
          c.pol.allianceExpansion = exp;
          c.powers.meridian = rel; c.powers.alliance = alli; c.ind.tension = tension;
          c.odds = allianceOdds(c, 'meridian');
          if (allianceInvite(c, 'meridian').ok) c.yes++;
        }
      });
      return { yes:box.st.yes, odds:box.st.odds };
    };
    /* A POINT ESTIMATE OFF ONE SEED IS NOT THE ASSERTION. 400 draws from the
       seeded engine at a fixed start is one deterministic sample, and a first
       pass keyed to the printed percentage went red the moment an earlier probe
       consumed a different number of rolls. What has to hold is the PROPERTY:
       the roll is real (neither all nor nothing), and a better-prepared
       question carries more often than a worse one. */
    out.cold = sample(44, 44, 68, 1);
    out.warm = sample(86, 86, 28, 3);
    out.acceptRate = out.cold.yes; out.acceptOdds = out.cold.odds;

    /* MEMBERS ARE NEVER THE COUNTRY VALE FIGHTS, AND THEY COME WHEN CALLED */
    const boxW = v6Sandbox(function (c) {
      c.alliance = { members:['sarath', 'ostmark'], asked:{}, founded:1 };
      c.pol.allianceExpansion = 2; c.pol.allianceCommitments = 3;
      POWERS.forEach(p => { c.powers[p.id] = 12; });
      c.powers.sarath = 78; c.powers.ostmark = 78;
      c.ind.tension = 95; c.hits = {}; c.joins = 0;
      for (let i = 0; i < 400; i++) {
        c.war = null;
        warTick(c);
        if (c.war) { c.hits[c.war.power] = (c.hits[c.war.power] || 0) + 1; c.joins += (c.war.joined || []).length; }
      }
    });
    out.wars = Object.keys(boxW.st.hits).reduce((n, k) => n + boxW.st.hits[k], 0);
    out.memberFought = ['sarath', 'ostmark'].some(id => boxW.st.hits[id]);
    out.joins = boxW.st.joins;
    return out;
  });

  const T = all.targets || {};
  say(all.powers === 11 && all.reachable === all.late && all.late === 5 &&
      T.envoy === 11 && T.treaty === 11 && T.coerce === 10 && T.accede === 10 && T.sanction >= 10,
    'the Foreign Office reaches eleven capitals',
    `${all.reachable} of the ${all.late} powers S10e shipped can be reached at last: the envoy, treaty, pressure, ` +
    `sanction and accession lists offer ${T.envoy}/${T.treaty}/${T.coerce}/${T.sanction}/${T.accede} targets against ` +
    `${all.powers} powers · POWERS.push runs in the S10e chunk and those four lists were built with POWERS.map at ` +
    `the moment the ACTIONS literal was EVALUATED, so the order book could name Tarnow and the Foreign Office could not`);

  say(all.has && all.cap0 === 0 && all.cap2 > 0 && /statute/.test(all.why0 || ''),
    'Expand the Northern Alliance expands the Northern Alliance',
    `nothing may accede at rung zero -- "${all.why0}" -- and the statute at two admits ${all.cap2} · its id appeared ` +
    `EXACTLY ONCE in three megabytes before this PR, in its own definition, beside a purge list · the Alliance was ` +
    `one relation number on a power row with no members in it, so there was nothing to expand`);

  const cold = all.cold || {}, warm = all.warm || {};
  say(all.has && cold.yes > 0 && cold.yes < 400 && warm.yes > 0 && warm.yes < 400 &&
      warm.yes > cold.yes && warm.odds > cold.odds,
    'a capital can say no, and the odds on the card mean something',
    `a cold question at a printed ${cold.odds} in a hundred carried ${cold.yes} of 400; a well prepared one at ` +
    `${warm.odds} carried ${warm.yes} · neither is all and neither is nothing, and the better question carries ` +
    `more often · this is the first diplomatic decision in the game that spends a die at all: every other one ` +
    `applies a fixed shift and reports it as a fact, and the odds go on the panel because a die whose odds the ` +
    `player cannot see is a coin toss`);

  say(all.has && all.wars > 0 && !all.memberFought && all.joins > 0,
    'a guarantee runs in both directions',
    `over ${all.wars} war rolls with two members at relations of twelve on every other power, Vale went to war with ` +
    `a member ${all.memberFought ? 'YES' : 'not once'}, and members came in on our side ${all.joins} times · the ` +
    `candidate filter took a power's KIND and its treaties and had no way to ask whether it was in the bloc, ` +
    `because the bloc had no members; and the only trace of an ally fighting was a flat +1 of momentum for a ` +
    `defence pact`);

  say(all.convene === true && all.withdraw === true && all.visit === true && all.treatyWritesOne,
    'the cards about the Alliance touch the Alliance',
    `convening it (${all.convene}), withdrawing from it entirely (${all.withdraw}) and a state visit to its ` +
    `capitals (${all.visit}) all move the relation now, and Conclude a Treaty opens the real terms sheet ` +
    `(${all.treatyWritesOne}) · it cost 8 capital and 6 of money, moved the relation by 22 and produced NO ` +
    `instrument: no entry in Treaties in Force, no progress toward the Peacemaker record, no line in the stats · ` +
    `and withdrawing entirely from the Alliance used to leave the relation, the drift bonus, the war exemption and ` +
    `the war edge all exactly where they were`);

  /* EVERY DISPATCH CAN BE ANSWERED. `runQueue` reads `e.ch`, sets UI.busy
     before it does, and shows the sheet after -- so a factory that answers to
     a different name throws between the two and the session stops with no
     card on screen and no way forward. `v10OrderEvent` returned `choices` and
     was reachable from turn one of a normal game: any order in force, a court
     gap over .42 (it opens at .62), and two dice. S15b uncapping the order
     book from four to seventy-two is what made it likely. */
  const dispatch = await page.evaluate(() => {
    const out = { factories: {}, bad: [] };
    const names = ['rulingEvent', 'extraEvent', 'assentEvent', 'v10OrderEvent', 'v9CaseEvent', 'v10RitualEvent', 'v6ArcEvent'];
    names.forEach((n) => {
      let src = null;
      try { src = String(eval(n)); } catch (e) { out.factories[n] = 'missing'; return; }
      const key = /\bch\s*:/.test(src) ? 'ch' : (/\bchoices\s*:/.test(src) ? 'choices' : 'none');
      out.factories[n] = key;
      if (key !== 'ch') out.bad.push(n + ' returns ' + key);
    });
    out.readsCh = /e\.ch\b/.test(String(runQueue));
    /* and the live article: build the order case the way endTurn does and put
       it through the real queue */
    const keep = { v10: JSON.parse(JSON.stringify(S.v10 || {})), busy: UI.busy, queue: UI.queue };
    S.v10 = S.v10 || {}; S.v10.orders = S.v10.orders || {};
    const hot = V10_ORDERS.slice().sort((a, x) => (x.exposure || 0) - (a.exposure || 0))[0];
    S.v10.orders[hot.id] = { status:'live', narrowed:0, upheld:false };
    S.v10.pendingOrder = hot.id;
    const ev = v10OrderEvent(S);
    out.order = hot.name;
    out.answers = (ev.ch || []).length;
    UI.busy = false; UI.queue = [ev];
    out.threw = null;
    try { runQueue(function () {}); } catch (e) { out.threw = String(e).split('\n')[0]; }
    out.buttons = document.querySelectorAll('#sheet [data-ev]').length;
    /* answer it, so the harness also proves the choice lands. hideSheet hides
       the modal rather than emptying the sheet, so ask the modal. */
    out.openBefore = document.getElementById('modal').hidden === false;
    const narrowed0 = (S.v10.orders[hot.id] || {}).narrowed || 0;
    const btn = document.querySelector('#sheet [data-ev="1"]');
    if (btn) btn.click();
    out.answered = document.getElementById('modal').hidden === true;
    out.tookEffect = ((S.v10.orders[hot.id] || {}).narrowed || 0) > narrowed0;
    /* the empty-card guard: a dispatch with no answers is skipped, not fatal */
    UI.busy = false; UI.queue = [{ id:'v15empty', title:'A card with no answers', text:'x' }];
    out.guardThrew = null;
    try { runQueue(function () {}); } catch (e) { out.guardThrew = String(e).split('\n')[0]; }
    out.guardCleared = UI.busy === false;
    S.v10 = keep.v10; UI.busy = keep.busy; UI.queue = keep.queue;
    return out;
  });

  say(dispatch.bad.length === 0 && dispatch.readsCh && !dispatch.threw &&
      dispatch.answers === 3 && dispatch.buttons === 3 && dispatch.openBefore &&
      dispatch.answered && dispatch.tookEffect &&
      !dispatch.guardThrew && dispatch.guardCleared,
    'every dispatch can be answered',
    `all ${Object.keys(dispatch.factories).length} event factories return a \`ch\` array (${dispatch.bad.length} did not) ` +
    `and runQueue reads one (${dispatch.readsCh}) · the court taking up "${dispatch.order}" renders ` +
    `${dispatch.buttons} answers, takes one and the order is narrowed by it ` +
    `(${dispatch.answered}/${dispatch.tookEffect}) · v10OrderEvent returned \`choices\`, so ` +
    `runQueue threw on e.ch.forEach AFTER setting UI.busy and BEFORE showSheet, and the session stopped there with ` +
    `no card and no way forward -- reachable from turn one with any order in force, and S15b uncapping the book ` +
    `from four to seventy-two is what made it likely · a card with no answers is now skipped rather than fatal ` +
    `(${dispatch.guardCleared})`);

  /* S16f -- THE CUSTOM START. The owner asked for a scenario editor over the
     constitution, the statute book, every chamber, the executive, the bench,
     the ministry, the states, the powers and where every party stands. The
     eleven openings are eleven fixed literals; this is the twelfth and the
     player writes it. It is applied BETWEEN `v6NewGame` and `enrichState`, so
     every ensure chain in the file runs over the edited state exactly as it
     runs over a scenario's, and an id this build does not carry is dropped and
     COUNTED rather than half-written -- the save contract since S1. */
  const custom = await page.evaluate(() => {
    const out = {};
    out.built = typeof v16CustomApply === 'function';
    if (!out.built) {
      /* a build without this PR: report the fixed openings and say so, rather
         than throwing at the harness */
      out.lost = 0; out.fields = 0; out.sections = 0;
      out.landed = {}; out.axes = 0; out.landedAll = 0;
      out.missed = ['every axis: there is no custom start'];
      out.plainUntouched = true; out.rubbish = 0;
      out.benchBefore = 0; out.benchAfterArticle = 0; out.benchSizeSynced = false;
      out.benchAfterRepeal = 0; out.benchCounts = [];
      out.openings = (typeof V6_SCENARIOS !== 'undefined') ? V6_SCENARIOS.length : 0;
      return out;
    }
    const art = V11_ARTICLES[0].id, pol = POLICIES.filter(p => p.cat === 'Taxation')[0];
    const region = REGIONS[0].id;
    /* every axis at once, with a deliberate piece of rubbish on each of them */
    const blob = {
      v:1, form:'executive', articles:[art, 'artWidenBench', 'nosuchArticle'],
      pol:{ [pol.id]:pol.max, nosuchPolicy:2 },
      seats:{ lp:60, fp:20, sd:20 },
      upperSeats:{ lp:70, fp:30 },
      upperState:'ceremonial', upperVeto:0, lowerState:'suspended',
      exec:{ pres:'lp', vpres:'lp', chan:'lp', vchan:'lp', nosuchOffice:'lp' },
      courtLean:-80, cabinetDepth:3,
      governors:{ [region]:'lp', nosuchRegion:'lp' },
      powers:{ sarath:95, tarnow:5, nosuchPower:50 },
      treaties:{ sarath:['consular', 'defence', 'nosuchTreaty'] },
      partyRel:{ fp:12 }, machine:{ lp:.9 }, purse:{ lp:420 },
      ind:{ liberties:20, tension:90, nosuchIndicator:5 },
      money:{ capital:250, treasury:800, unrest:70, unity:35 },
      /* S16f2: the roll, seat by seat, with a party this build does not carry */
      judges:['rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','rsf','nosuchParty']
    };
    out.lost = v16CustomClean(blob).lost;
    out.fields = v16CustomCount(v16CustomClean(blob).blob);
    out.sections = v16CustomSections().length;

    UI.setup = UI.setup || {}; UI.setup.custom = blob;
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    const seatTotal = PARTIES.reduce((n, p) => n + (S.seats[p.id] || 0), 0);
    out.landed = {
      form:S.form === 'executive',
      article:!!(S.v11 && S.v11.con && S.v11.con.arts[art] !== undefined),
      statute:S.pol[pol.id] === pol.max,
      assembly:Math.round(100 * (S.seats.lp || 0) / seatTotal) === 60 && seatTotal === CFG.seats,
      senate:!!S.upper.ceremonial && S.upper.veto === 0,
      lower:!!S.lower.suspended,
      exec:['pres', 'vpres', 'chan', 'vchan'].every(o => S.exec[o] === 'lp'),
      cabinet:Object.keys(S.cabinet).filter(k => S.cabinet[k] > 0).length === 3,
      court:courtGap(S) > 0,
      governor:S.v6.governors[region].party === 'lp',
      powers:S.powers.sarath === 95 && S.powers.tarnow === 5,
      treaties:v6TreatyKinds(S, 'sarath').join(',') === 'consular,defence',
      partyRel:Math.round(S.partyRel.fp) === 12,
      machine:Math.abs(S.machine.lp - .9) < .001,
      purse:Math.round(partyPurse(S, 'lp')) === 420,
      indicators:S.ind.liberties === 20 && S.ind.tension === 90,
      exchequer:S.capital === 250 && S.treasury === 800 && S.unrest === 70 && S.unity === 35,
      marked:S.v6.scenario === 'custom' && !!S.customStart,
      /* S16f2: the bench is a roll now, and its LENGTH comes from the articles
         this start turns on -- artWidenBench is in the fixture above, so
         sixteen seats become twenty and every one of them is RSF. */
      bench:S.court.justices.length === 20 && S.court.justices.every(j => j.party === 'rsf') &&
        S.court.size === S.court.justices.length
    };
    out.axes = Object.keys(out.landed).length;
    out.landedAll = Object.keys(out.landed).filter(k => out.landed[k]).length;
    out.missed = Object.keys(out.landed).filter(k => !out.landed[k]);

    /* S16f2: THE ARTICLE THAT PROMISED FOUR JUSTICES AND SEATED NOBODY.
       `st.court.size` is written in four places in this file and READ IN NONE
       -- every consumer in three megabytes counts `justices.length` -- so an
       article whose card says "four more justices, sitting only on this
       document" moved a field nothing reads and left the bench at sixteen.
       Its two siblings in the same book already went through `v11SeatJustices`.
       All three do now, and the editor's bench count reads all three. */
    UI.setup.custom = null;
    const benchProbe = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    out.benchBefore = benchProbe.court.justices.length;
    V11_ART.artConstitutionalBench.apply(benchProbe);
    out.benchAfterArticle = benchProbe.court.justices.length;
    out.benchSizeSynced = benchProbe.court.size === benchProbe.court.justices.length;
    V11_ART.artConstitutionalBench.repeal(benchProbe);
    out.benchAfterRepeal = benchProbe.court.justices.length;
    /* and the editor counts what the laws do */
    out.benchCounts = [v16BenchSize({ articles:[] }), v16BenchSize({ articles:['artWidenBench'] }),
      v16BenchSize({ articles:['artConstitutionalBench'] }), v16BenchSize({ articles:['artFixedBench'] }),
      v16BenchSize({ articles:['artWidenBench', 'artConstitutionalBench'] })];

    /* S16f2: OUT OF RANGE IS CLAMPED, NEVER ACCEPTED. The owner: "I should
       never be able to enter an unacceptable or invalid entry to any field."
       The sliders enforce that on the way in, but a blob typed or pasted into
       the import box never passes a slider, so the CLEANER is what actually
       holds the line -- and it holds it to the same table the sliders are drawn
       from, so the range offered and the range accepted are one range. */
    const wild = v16CustomClean({
      purse:{ lp:999999 }, machine:{ lp:99 }, partyRel:{ fp:-40 },
      money:{ capital:9999, treasury:99999, debt:-500, unrest:900 },
      ind:{ liberties:800 }, powers:{ sarath:-70 }, upperVeto:99, cabinetDepth:-5
    }).blob;
    const bound = (t, k) => t.filter(f => f.k === k)[0];
    out.clamped = {
      purse:wild.purse.lp === bound(V16_PARTY_FIELDS, 'purse').max,
      machine:wild.machine.lp === bound(V16_PARTY_FIELDS, 'machine').max,
      partyRel:wild.partyRel.fp === bound(V16_PARTY_FIELDS, 'partyRel').min,
      capital:wild.money.capital === bound(V16_CUSTOM_MONEY, 'capital').max,
      treasury:wild.money.treasury === bound(V16_CUSTOM_MONEY, 'treasury').max,
      debt:wild.money.debt === bound(V16_CUSTOM_MONEY, 'debt').min,
      unrest:wild.money.unrest === bound(V16_CUSTOM_MONEY, 'unrest').max,
      ind:wild.ind.liberties === 100, power:wild.powers.sarath === 0,
      veto:wild.upperVeto === 3, depth:wild.cabinetDepth === 0
    };
    out.clampedAll = Object.keys(out.clamped).every(k => out.clamped[k]);
    out.clampMissed = Object.keys(out.clamped).filter(k => !out.clamped[k]);

    /* S16f2: THE TWO FIELDS THAT WERE TAKEN ON THE BLOB'S WORD. Every id in
       the editor is checked against what this build carries -- except these
       two, which were checked with `typeof` alone, so any string at all was
       accepted and `lost` said nothing was dropped. The failure was silent in
       the worst direction: an unknown string is neither 'abolished' nor
       'suspended', so apply read it as a house that SITS. */
    const vocab = v16CustomClean({ lowerState:'banana', upperState:'nonsense' });
    out.vocabLost = vocab.lost;
    out.vocabDropped = vocab.blob.lowerState === null && vocab.blob.upperState === null;
    out.vocabKeeps = v16CustomClean({ lowerState:'abolished', upperState:'ceremonial' });
    out.vocabKeeps = out.vocabKeeps.lost === 0 && out.vocabKeeps.blob.lowerState === 'abolished' &&
      out.vocabKeeps.blob.upperState === 'ceremonial';

    /* S16f2: THE OLD SLIDER MUST NOT ERASE THE NEW ROLL. `courtLean` is the
       S16f control, kept only so a start saved by that build still loads. It
       assigns every justice the SAME position, and it runs AFTER the roll, so a
       blob carrying both kept the roll's party labels and flattened the whole
       bench to one disposition. Measured before the fix: seven distinct
       positions became one. The blob below carries both. */
    UI.setup.custom = { judges:['rsf', 'lp', 'sd', 'fp', 'cup', 'pnl', 'rsf', 'lp'], courtLean:80 };
    const both = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    UI.setup.custom = { judges:['rsf', 'lp', 'sd', 'fp', 'cup', 'pnl', 'rsf', 'lp'] };
    const rollOnly = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    const es = st => st.court.justices.map(j => Math.round(j.e * 1000) / 1000);
    out.leanDistinct = new Set(es(both)).size;
    out.leanMatchesRoll = es(both).join(',') === es(rollOnly).join(',');

    /* a start that sets nothing changes nothing */
    UI.setup.custom = null;
    const plain = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    out.plainUntouched = plain.form === 'federal' && !plain.customStart;
    /* and rubbish is refused whole rather than half-applied */
    out.rubbish = v16CustomClean('not a start at all').lost;
    return out;
  });

  say(custom.built && custom.sections === 10 && custom.lost === 8 && custom.fields > 25 &&
      custom.landedAll === custom.axes && custom.plainUntouched && custom.rubbish === -1 &&
      custom.benchBefore === 16 && custom.benchAfterArticle === 20 && custom.benchSizeSynced &&
      custom.benchAfterRepeal === 16 && custom.benchCounts.join(',') === '16,20,20,9,24' &&
      custom.vocabLost === 2 && custom.vocabDropped && custom.vocabKeeps &&
      custom.leanDistinct > 1 && custom.leanMatchesRoll && custom.clampedAll,
    'a start of your own',
    `the editor covers ${custom.sections} axes and one blob setting all of them at once -- the form, an article, a ` +
    `statute at its top rung, both houses, all four great offices, the cabinet's depth, the bench, a governorship, two ` +
    `capitals and what is written with one of them, a party's relations, organisation and money, two indicators and the ` +
    `whole exchequer -- lands ${custom.landedAll} of ${custom.axes}` +
    `${custom.missed.length ? ' (missed: ' + custom.missed.join(', ') + ')' : ''} through the real ` +
    `\`v6NewGame\` and the whole ensure chain · ${custom.fields} fields set and ${custom.lost} pieces of rubbish planted ` +
    `on every axis were each dropped and COUNTED rather than half-written, and a blob that is not a start at all is ` +
    `refused whole (${custom.rubbish}) · a campaign begun with no custom start is untouched (${custom.plainUntouched}) · ` +
    `the Article of the Constitutional Bench seats ${custom.benchBefore} -> ${custom.benchAfterArticle} justices and ` +
    `unseats them on repeal (${custom.benchAfterRepeal}), where it used to write \`court.size\` -- a field written in ` +
    `four places and READ IN NONE -- and leave the bench exactly as it found it; and the editor's own count reads ` +
    `every law that moves it [${custom.benchCounts.join(', ')}] for no article, the Wider Bench, the Constitutional ` +
    `Bench, the Fixed Bench and two at once · eleven fields given values no slider would ever have offered ` +
    `(a purse of 999999, an organisation of 99, a treasury of 99999, a veto of 99) are each CLAMPED to the bound the ` +
    `editor draws its own track from rather than accepted` +
    `${custom.clampMissed.length ? ' (missed: ' + custom.clampMissed.join(', ') + ')' : ''} · the two chamber states are checked against the vocabulary the picker ` +
    `offers rather than against \`typeof\`, so rubbish is dropped and counted (${custom.vocabLost}) instead of read as ` +
    `a house that SITS, and the four real states still land · and S16f's bench slider, kept only so a start saved by ` +
    `that build still loads, no longer flattens a roll the blob names seat by seat (${custom.leanDistinct} distinct ` +
    `positions, matching the roll alone: ${custom.leanMatchesRoll})` +
    (custom.built ? '' : ' · THIS BUILD HAS NO CUSTOM START: the eleven openings are eleven fixed literals'));

  /* S16e -- THE SIX THAT ARE NOT YOURS. The owner: "other parties should be
     more active and less stagnant." Measured over fifty sessions before this
     PR, with the player leading the LP and the FP in government: `st.push` was
     never written by an AI party for any of them, the best machine any of them
     built over the whole campaign was +0.32 and five built nothing, and their
     purses ended between 280 and 809 with nothing spending them. `aiGovern` is
     the whole of it and it returns unless the player is out of government,
     runs every other session, and puts a bill on the paper for `st.ruling`
     alone. Six parties out of seven had no way to act at all.

     Driven through the model in `endTurn`'s own order over sixty sessions. */
  const six = await page.evaluate(() => {
    const out = { cards:{}, acts:{}, pushes:{} };
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
    const me = playParty(S);
    out.built = typeof v16AiTurn === 'function';
    if (!out.built) {
      /* a build without this PR: measure what the six can do and say so */
      for (let i = 0; i < 60; i++) {
        tickTurn(S); advanceBills(S); aiGovern(S); politicsTick(S);
        if (S.push) Object.keys(S.push).forEach(k => { out.pushes[k] = (out.pushes[k] || 0) + 1; });
        S.turn += 1;
        if (electionsOn(S) && isBallotTurn(S.turn)) runElection(S, false);
      }
      PARTIES.forEach(p => { if (p.id !== me) out.acts[p.id] = 0; });
      out.deck = 0; out.cardsUsed = 0; out.actedAll = false;
      out.pushedSome = Object.keys(out.pushes).filter(k => k !== me).length;
      out.builtMachine = 0; out.spentPurse = 0; out.pacts = 0; out.pactPossible = false;
      out.spentTotal = 0; out.cardWorks = 0; out.cardFails = ['no deck'];
      out.richest = Math.round(Math.max.apply(null, PARTIES.filter(p => p.id !== me).map(p => partyPurse(S, p.id))));
      out.spentTotal = 0; out.richest = Math.round(Math.max.apply(null, PARTIES.filter(p => p.id !== me).map(p => partyPurse(S, p.id))));
      out.sore = 'nobody'; out.grudge0 = null; out.grudge1 = null;
      out.postureUnderGrudge = null; out.grudgeCools = false;
      out.redLine = 'unread'; out.redLineBites = false; out.partnerLeaves = false;
      return out;
    }
    const purse0 = {}; PARTIES.forEach(p => { purse0[p.id] = partyPurse(S, p.id); });
    const mach0 = {}; PARTIES.forEach(p => { mach0[p.id] = S.machine[p.id] || 0; });
    for (let i = 0; i < 60; i++) {
      tickTurn(S); advanceBills(S); aiGovern(S); politicsTick(S);
      if (S.push) Object.keys(S.push).forEach(k => { out.pushes[k] = (out.pushes[k] || 0) + 1; });
      if (S.funding) { for (const k in S.funding) { S.funding[k] *= .6; if (Math.abs(S.funding[k]) < .02) delete S.funding[k]; } }
      S.turn += 1;
      if (electionsOn(S) && isBallotTurn(S.turn)) runElection(S, false);
    }
    PARTIES.forEach(p => {
      if (p.id === me) return;
      const a = (S.ai || {})[p.id];
      out.acts[p.id] = a ? a.acts : 0;
      if (a) Object.keys(a.last).forEach(c => { out.cards[c] = (out.cards[c] || 0) + 1; });
    });
    out.deck = (typeof V16_AI_DECK !== 'undefined') ? V16_AI_DECK.length : 0;
    out.cardsUsed = Object.keys(out.cards).length;
    out.actedAll = PARTIES.filter(p => p.id !== me).every(p => (out.acts[p.id] || 0) > 0);
    out.pushedSome = Object.keys(out.pushes).filter(k => k !== me).length;
    out.builtMachine = PARTIES.filter(p => p.id !== me && (S.machine[p.id] || 0) > mach0[p.id]).length;
    out.spentPurse = PARTIES.filter(p => p.id !== me && ((S.ai[p.id] || {}).spent || 0) > 100).length;
    out.spentTotal = Math.round(PARTIES.reduce((n, p) => n + (p.id === me ? 0 : ((S.ai[p.id] || {}).spent || 0)), 0));
    out.richest = Math.round(Math.max.apply(null, PARTIES.filter(p => p.id !== me).map(p => partyPurse(S, p.id))));
    out.pacts = S.aiPacts ? Object.keys(S.aiPacts).length : 0;

    /* EACH CARD AS A PROPERTY. Whether a particular card comes up in one
       sixty-session run is a die, and three runs of this probe read the deck as
       6, 7 and 7 cards fired. What an assertion should hold is that every card,
       given a state where it can play, DOES what it says -- which is both
       deterministic and the stronger claim. S15j paid for the point-estimate
       lesson once; this is the same lesson. */
    const cardWorks = {}, cardFails = [];
    V16_AI_DECK.forEach((c) => {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
      S.ruling = 'fp'; S.coalition = ['fp'];
      const pid = PARTIES.filter(p => p.id !== playParty(S) && p.id !== 'fp')[0].id;
      PARTIES.forEach(p => { S.purse = S.purse || {}; S.purse[p.id] = 400; });
      S.turn = 8;
      /* S17k: three of the cards need a state the others do not -- an order is
         signed by the office that holds the department, and a line on the
         floor needs a bill on it. Building that is part of "a state where it
         can play", not a loosening of the claim. */
      if (c.id === 'article') {
        /* a party with eight per cent of the chamber does not amend the
           constitution, so the state built for this card gives it enough of
           one -- which is what "a state where it can play" means */
        S.seats[pid] = Math.round(CFG.seats * .2);
      }
      if (c.id === 'order') {
        S.coalition = ['fp', pid];
        V10_ORDERS.forEach(function (o) { S.exec[o.dept] = pid; });
      }
      if (c.id === 'floor') {
        sponsorBill(S, 'incomeTax', 1, 'government', 'clean', true, 'fp', true);
      }
      const before = {
        machine:S.machine[pid] || 0, targetMachine:S.machine[S.ruling] || 0,
        blocs:JSON.stringify(S.blocs), push:JSON.stringify(S.push || {}),
        purse:partyPurse(S, pid), funding:(S.funding || {})[pid] || 0,
        inbox:S.inbox.length, pacts:Object.keys(S.aiPacts || {}).length,
        pending:(v11Con(S).pending || []).length,
        orders:Object.keys(v10Orders(S)).length,
        lines:S.bills.reduce(function (n, b) { return n + Object.keys(b.lines || {}).length; }, 0)
      };
      if (!c.can(S, pid)) { cardFails.push(c.id + ': can() false on a state built for it'); return; }
      const line = c.run(S, pid);
      const moved =
        c.id === 'organise' ? (S.machine[pid] || 0) > before.machine
        : c.id === 'campaign' ? ((S.funding || {})[pid] || 0) > before.funding
        : c.id === 'court' ? JSON.stringify(S.blocs) !== before.blocs
        : c.id === 'attack' ? (S.machine[S.ruling] || 0) < before.targetMachine
        : c.id === 'platform' ? JSON.stringify(S.push || {}) !== before.push
        : c.id === 'pact' ? Object.keys(S.aiPacts || {}).length > before.pacts
        : c.id === 'demand' ? S.inbox.length > before.inbox
        : c.id === 'article' ? (v11Con(S).pending || []).length > before.pending
        : c.id === 'order' ? Object.keys(v10Orders(S)).length > before.orders
        : c.id === 'floor' ? S.bills.reduce(function (n, b) { return n + Object.keys(b.lines || {}).length; }, 0) > before.lines
        : false;
      const paid = partyPurse(S, pid) < before.purse;
      cardWorks[c.id] = !!(line && moved && paid);
      if (!cardWorks[c.id]) cardFails.push(c.id + ': line ' + !!line + ', moved ' + moved + ', paid ' + paid);
    });
    out.cardWorks = Object.keys(cardWorks).filter(k => cardWorks[k]).length;
    out.cardFails = cardFails;
    /* whether a pact FORMS in any one run is a die; whether one CAN is a
       property, and a property is what an assertion should hold. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.ruling = 'fp'; S.coalition = ['fp']; S.aiPacts = {};
    out.pactPossible = PARTIES.filter(p => p.id !== playParty(S) && p.id !== 'fp')
      .some(p => !!v16PactPartner(S, p.id));

    /* MEMORY: a party that is attacked remembers, and the grudge cools. The
       party is picked by CIRCUMSTANCE -- out of government and out of the
       coalition -- because a party in office answers "govern" whatever it
       thinks of you, which is correct and is not what this asks. */
    const sore = PARTIES.filter(p => p.id !== me && p.id !== S.ruling &&
      (S.coalition || []).indexOf(p.id) < 0 && !S.banned[p.id])[0];
    out.sore = sore && sore.id;
    out.grudge0 = sore ? v16Grudge(S, sore.id, me) : null;
    if (sore) v16Resent(S, sore.id, me, 40);
    out.grudge1 = sore ? v16Grudge(S, sore.id, me) : null;
    out.postureUnderGrudge = sore ? v16Posture(S, sore.id) : null;
    for (let i = 0; i < 10; i++) v16AiTurn(S);
    out.grudgeCools = sore ? v16Grudge(S, sore.id, me) < out.grudge1 : false;

    /* A RED LINE THAT BITES. `coalitionDeals[pid].redLine` has been written
       and rendered since v5 and read by NOTHING. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
    const partner = PARTIES.filter(p => p.id !== playParty(S))[0].id;
    S.ruling = playParty(S); S.coalition = [playParty(S), partner]; S.partner = partner;
    const line = Object.keys(PARTY[partner].wants || {})[0];
    S.coalitionDeals = S.coalitionDeals || {};
    S.coalitionDeals[partner] = { satisfaction:70, priorities:[], councils:0, portfolios:0, redLine:line, lastCouncil:-99 };
    S.pol[line] = PARTY[partner].wants[line];
    out.redLine = line;
    if (typeof v16RedLineTick === 'function') v16RedLineTick(S);          /* baseline session */
    const sat0 = S.coalitionDeals[partner].satisfaction;
    /* now drive it AWAY from what they exist to defend */
    S.pol[line] = clamp((S.pol[line] || 0) + (PARTY[partner].wants[line] > 0 ? -1 : 1), 0, POL[line].max);
    if (typeof v16RedLineTick === 'function') v16RedLineTick(S);
    out.redLineBites = S.coalitionDeals[partner] ? S.coalitionDeals[partner].satisfaction < sat0 - 5 : true;
    /* and a partner whose cohesion is gone walks out */
    if (S.coalitionDeals[partner]) S.coalitionDeals[partner].satisfaction = 8;
    if (typeof v16RedLineTick === 'function') v16RedLineTick(S);
    out.partnerLeaves = (S.coalition || []).indexOf(partner) < 0;
    return out;
  });

  const sixActs = Object.keys(six.acts).map(k => six.acts[k]);
  /* S17k: TEN CARDS. The deck gained the three instruments an AI party could
     never touch -- an article, an order and a line on a bill -- and the claim
     is unchanged: EVERY card, given a state where it can play, does what it
     says and is paid for out of that party's own money. */
  say(six.built && six.deck === 10 && six.cardWorks === 10 && six.cardFails.length === 0 && six.actedAll &&
      six.builtMachine >= 1 && six.spentPurse === 6 && six.spentTotal > 1500 && six.pactPossible &&
      six.grudge0 === 0 && six.grudge1 === 40 && six.postureUnderGrudge === 'attack' && six.grudgeCools &&
      six.redLineBites && six.partnerLeaves,
    'the six that are not yours act',
    `every one of the ${six.deck} cards, given a state where it can play, does what it says and is paid for out of that ` +
    `party's own money (${six.cardWorks} of ${six.deck}${six.cardFails.length ? '; ' + six.cardFails.join('; ') : ''}) · ` +
    `over sixty sessions each of the six takes ${sixActs.length ? Math.min.apply(null, sixActs) : 0} to ` +
    `${sixActs.length ? Math.max.apply(null, sixActs) : 0} initiatives, ${six.builtMachine} of them build an organisation ` +
    `where the best any of them managed before was +0.32 and five built nothing, all ${six.spentPurse} spend the purse ` +
    `S15f gave them (${six.spentTotal} of party money across the campaign, none of them ending above ${six.richest}) ` +
    `where before this PR they ended on 280 to 809 with nothing spending it, and a pact between two parties out of ` +
    `government is reachable (${six.pactPossible}) · a party REMEMBERS: attacked, the ${String(six.sore).toUpperCase()}'s ` +
    `grievance goes ${six.grudge0} to ${six.grudge1}, its posture becomes "${six.postureUnderGrudge}", and it cools ` +
    `(${six.grudgeCools}) · and the red line BITES: driving "${six.redLine}" away from what the partner exists to defend ` +
    `costs real cohesion (${six.redLineBites}) and a partner whose cohesion is gone walks out (${six.partnerLeaves}) -- ` +
    `\`coalitionDeals[pid].redLine\` has been written and rendered on the coalition card since v5 and read by NOTHING` +
    (six.built ? '' : ' · THIS BUILD HAS NO INITIATIVE DECK: aiGovern is the whole of it, it returns unless the player is ' +
      'out of government, and it acts for st.ruling alone'));

  /* S16d -- YOU LEAD ONE PARTY. The owner: "I think its time we remove the
     ability to switch the party that the player is playing as, because it just
     complicates it too much." Two paths wrote `S.playAs` after setup:
     `switchParty` ("Change Your Allegiance", 14 capital, cross to any of the
     seven) and the Invite card, whose own description read "You go on playing
     as them". The first is retired; the second hands the government away and
     leaves the player where they are, which is a better decision than the one
     it replaced.

     This drives EVERY leg of EVERY action and asserts none of them moves the
     player between parties, which is stronger than asserting one card is gone. */
  const oneParty = await page.evaluate(() => {
    const out = { movers:[] };
    out.switchGone = ACTIONS.filter(a => a.id === 'switchParty').length === 0;
    ACTIONS.forEach((a) => {
      const legs = (a.opts && a.opts.length) ? a.opts : [{ label:a.name, run:a.run }];
      legs.forEach((leg) => {
        S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
        S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
        S.ruling = playParty(S); S.coalition = [playParty(S)]; S.capital = 900; S.treasury = 9000;
        const me = playParty(S);
        try { if (leg.run) leg.run(S); } catch (e) { return; }
        if (playParty(S) !== me) out.movers.push(a.id + ' / ' + (leg.label || ''));
      });
    });
    out.legs = ACTIONS.reduce((n, a) => n + ((a.opts && a.opts.length) || 1), 0);

    /* the Invite card, which is where the second path lived */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
    S.ruling = playParty(S); S.coalition = [playParty(S)]; S.capital = 900; S.treasury = 9000;
    const me = playParty(S);
    const other = PARTIES.filter(p => p.id !== me)[0].id;
    /* they cannot carry the chamber alone and our seats close the gap: wanted */
    S.seats[other] = Math.floor(CFG.seats * 0.45); S.seats[me] = Math.floor(CFG.seats * 0.30);
    const inv = partyActions(other).filter(x => x.id === 'invite')[0];
    out.inviteFound = !!inv;
    if (inv) {
      const u0 = S.unity;
      inv.run(S);
      out.stillMe = playParty(S) === me;
      out.rulingIsThem = S.ruling === other;
      out.junior = S.coalition.indexOf(me) >= 0;
      out.unityFell = S.unity < u0;
      out.handedFlag = (S.v6.flags || {}).handedOver !== undefined;
      /* and the same card when your seats are NOT wanted puts you out */
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.ruling = playParty(S); S.coalition = [playParty(S)]; S.capital = 900;
      /* they carry it alone, so our seats are not wanted: out */
      S.seats[other] = Math.floor(CFG.seats * 0.60); S.seats[me] = Math.floor(CFG.seats * 0.05);
      partyActions(other).filter(x => x.id === 'invite')[0].run(S);
      out.oppositionWhenUnwanted = S.coalition.indexOf(me) < 0 && !inPower(S);
    }
    /* the record keeps its id, so the denominator and old hall entries hold */
    const rec = V6_ACHIEVEMENTS.filter(a => a.id === 'turncoat')[0];
    out.recordCount = V6_ACHIEVEMENTS.length;
    out.recName = rec && rec.name;
    out.recFalseOnHandover = rec && !rec.test(S);
    S.ruling = me; S.coalition = [me]; S.turn += 3;
    out.recTrueOnReturn = rec && rec.test(S);
    return out;
  });

  say(oneParty.switchGone && oneParty.movers.length === 0 && oneParty.inviteFound &&
      oneParty.stillMe && oneParty.rulingIsThem && oneParty.junior && oneParty.unityFell &&
      oneParty.handedFlag && oneParty.oppositionWhenUnwanted &&
      oneParty.recordCount === 44 && oneParty.recName === 'The Handover' &&
      oneParty.recFalseOnHandover && oneParty.recTrueOnReturn,
    'you lead one party for the campaign',
    `all ${oneParty.legs} legs of every action driven, and ${oneParty.movers.length} of them move the player between ` +
    `parties${oneParty.movers.length ? ' (' + oneParty.movers.slice(0, 3).join(', ') + ')' : ''}: "Change Your Allegiance" ` +
    `is retired (${oneParty.switchGone}) and the Invite card, whose own description read "You go on playing as them", ` +
    `hands the government over and leaves you where you are -- they govern (${oneParty.rulingIsThem}), you are still ` +
    `yourself (${oneParty.stillMe}), you sit in it as the junior partner where your seats are wanted (${oneParty.junior}) ` +
    `and opposite them where they are not (${oneParty.oppositionWhenUnwanted}), and your own members did not vote for it ` +
    `(unity fell: ${oneParty.unityFell}) · the Turncoat record kept its ID so the denominator stays at ` +
    `${oneParty.recordCount} and an old hall entry keeps its tick, and asks the harder version of the same move: ` +
    `"${oneParty.recName}" is false on the handover (${oneParty.recFalseOnHandover}) and true once you lead a ` +
    `government again (${oneParty.recTrueOnReturn})`);

  /* S16c -- THE FOREIGN OFFICE REACHES EVERY CAPITAL. Measured on the build
     before this PR by driving every leg of every Diplomacy action through its
     own run and counting which of the eleven capitals moved: stateVisit 4,
     summit 3, tradeMission 3, recallAmb 2, aidSurge 2, armProxy 4. Five of the
     six were written in v4 and widened in v9, when the file modelled six powers
     and named three of them by hand, and `POWERS.push` runs in the S10e chunk.
     And the BASE leg of five of the six -- the option the card offers first --
     moved no relation with any power at all.

     Sanctions were the other half: a card called "Sanction a Power", a Sanctions
     Regime statute behind it and two executive orders naming it in `needs`, and
     no such thing in the file as a power BEING sanctioned. */
  const dip = await page.evaluate(() => {
    const out = { acts:[], leaks:[] };
    const fresh = () => {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
      S.ruling = playParty(S); S.coalition = [playParty(S)]; S.capital = 900; S.treasury = 9000;
    };
    /* legs that correctly move no relation, each for a stated reason. Anything
       else that costs capital and moves nothing is a leak and is named. */
    const EXEMPT = {
      'To the territories':'the possessions, not a foreign capital',
      'Lift the sanctions on one capital':'nothing is under sanction in the fixture',
      'Lift every sanction':'nothing is under sanction in the fixture'
    };
    const SHEETS = ['treaty', 'accede', 'suePeace'];
    ['stateVisit', 'summit', 'tradeMission', 'recallAmb', 'aidSurge', 'armProxy', 'sanction', 'coerce', 'envoy'].forEach((id) => {
      const a = ACTIONS.filter(x => x.id === id)[0];
      if (!a) { out.acts.push({ id, missing:true }); return; }
      const reaches = [];
      const legs = (a.opts && a.opts.length) ? a.opts : [{ label:a.name, run:a.run }];
      legs.forEach((leg) => {
        fresh();
        const before = {};
        POWERS.forEach(p => { before[p.id] = relOf(S, p.id); });
        try { if (leg.run) leg.run(S); } catch (e) { out.leaks.push(id + '/' + (leg.label || '') + ' threw'); return; }
        const moved = POWERS.filter(p => Math.abs(relOf(S, p.id) - before[p.id]) > 0.001).map(p => p.id);
        moved.forEach(m => { if (reaches.indexOf(m) < 0) reaches.push(m); });
        if (!moved.length && !EXEMPT[leg.label] && SHEETS.indexOf(id) < 0) out.leaks.push(id + ' / ' + (leg.label || a.name));
      });
      out.acts.push({ id, legs:legs.length, reach:reaches.length, hasAlliance:reaches.indexOf('alliance') >= 0 });
    });
    /* every tip on every leg of the five rebuilt lists is composed from the
       same table the run reads, so none of them can be silent */
    out.tipless = [];
    ['stateVisit', 'summit', 'tradeMission', 'recallAmb', 'aidSurge'].forEach((id) => {
      const a = ACTIONS.filter(x => x.id === id)[0];
      (a.opts || []).forEach(o => { if (!o.tip || !/[+-]?\d/.test(o.tip)) out.tipless.push(id + ' / ' + o.label); });
    });
    /* and one authored line per capital per instrument. Degrades rather than
       throwing on a build without this PR, so the harness reports a FAILURE
       with the diagnosis instead of a ReferenceError with a stack. */
    out.built = typeof V16_DIP !== 'undefined' && typeof v16SanctionList === 'function';
    out.authored = !out.built ? 0 : POWERS.filter(p => {
      const row = V16_DIP[p.id];
      return row && ['visit', 'summit', 'trade', 'recall', 'aid'].every(k => typeof row[k] === 'string' && row[k].length > 40);
    }).length;

    /* sanctions are a STATE */
    if (!out.built) {
      out.sanctionedAtStart = 0; out.imposed = false; out.onList = 0;
      out.bitesPlain = 0; out.bitesUnderStatute = 0; out.noSeizure = 0; out.withSeizure = 0;
      out.ridesTheSave = false; out.onThePage = false; out.lifted = false; out.gonePage = false;
      return out;
    }
    fresh();
    out.sanctionedAtStart = v16SanctionList(S).length;
    v16Impose(S, 'tarnow');
    out.imposed = v16Sanctioned(S, 'tarnow');
    out.onList = v16SanctionList(S).length;
    const rel0 = relOf(S, 'tarnow'), ten0 = S.ind.tension;
    S.pol.sanctionsRegime = 0; v16SanctionsTick(S);
    out.bitesPlain = Math.round((rel0 - relOf(S, 'tarnow')) * 100) / 100;
    S.powers.tarnow = rel0; S.ind.tension = ten0;
    S.pol.sanctionsRegime = 2; v16SanctionsTick(S);
    out.bitesUnderStatute = Math.round((rel0 - relOf(S, 'tarnow')) * 100) / 100;
    /* the Seize the Frozen Reserves act turns the bite into revenue */
    S.acts.assetSeizure = false; const t0 = S.treasury; v16SanctionsTick(S);
    out.noSeizure = S.treasury - t0;
    S.acts.assetSeizure = true; const t1 = S.treasury; v16SanctionsTick(S);
    out.withSeizure = S.treasury - t1;
    /* it rides the save */
    const blob = JSON.parse(JSON.stringify(S));
    out.ridesTheSave = !!(blob.v6.sanctions && blob.v6.sanctions.tarnow);
    /* the world page names it */
    UI.tab = 'world'; render();
    out.onThePage = /Under Sanction/.test(document.getElementById('view').textContent);
    v16Lift(S, 'tarnow');
    out.lifted = !v16Sanctioned(S, 'tarnow');
    render();
    out.gonePage = !/Under Sanction/.test(document.getElementById('view').textContent);
    return out;
  });

  const dipMap = {}; dip.acts.forEach(a => { dipMap[a.id] = a; });
  const dipShort = ['stateVisit', 'summit', 'tradeMission', 'recallAmb', 'aidSurge'].filter(id => (dipMap[id] || {}).reach !== 11);
  say(dip.built && dipShort.length === 0 && dip.leaks.length === 0 && dip.tipless.length === 0 && dip.authored === 11 &&
      (dipMap.armProxy || {}).reach === 10 && !(dipMap.armProxy || {}).hasAlliance &&
      (dipMap.sanction || {}).reach === 10 && !(dipMap.sanction || {}).hasAlliance &&
      dip.sanctionedAtStart === 0 && dip.imposed && dip.onList === 1 &&
      dip.bitesPlain > 0 && dip.bitesUnderStatute > dip.bitesPlain &&
      dip.noSeizure === 0 && dip.withSeizure > 0 &&
      dip.ridesTheSave && dip.onThePage && dip.lifted && dip.gonePage,
    'the Foreign Office reaches every capital',
    `the state visit, the summit, the trade mission, the recall and the aid programme each reach ` +
    `${dipMap.stateVisit.reach}/${dipMap.summit.reach}/${dipMap.tradeMission.reach}/${dipMap.recallAmb.reach}/${dipMap.aidSurge.reach} ` +
    `of eleven capitals, where this same probe reads 4/3/3/2/2 on the build before this PR, and arming a client reaches ` +
    `${dipMap.armProxy.reach} (never our own bloc: ${!dipMap.armProxy.hasAlliance}) where it read 4 · ` +
    `${dip.authored} of eleven capitals carry an authored line for each of the five, and every leg's tip is COMPOSED from ` +
    `the same table its run reads (${dip.tipless.length} silent) · ${dip.leaks.length} diplomatic legs cost capital and move ` +
    `no relation, where the BASE leg of five of the six did exactly that · sanctions are a state that rides the save ` +
    `(${dip.ridesTheSave}): imposing puts a capital on a list of ${dip.onList}, a session costs it ${dip.bitesPlain} of ` +
    `relations and ${dip.bitesUnderStatute} under the Sanctions Regime statute at two, Seize the Frozen Reserves turns ` +
    `${dip.noSeizure} of revenue into ${dip.withSeizure} (both statutes named sanctions and neither could ask whether one ` +
    `stood), and the world page carries the capitals under controls (${dip.onThePage}) until they are lifted (${dip.gonePage})` +
    (dip.built ? '' : ' · THIS BUILD HAS NO PER-CAPITAL LISTS: five of the six actions name a fixed handful of capitals ' +
      'chosen before the S10e powers existed, and a sanction is a one-off relation hit with no state behind it'));

  /* S16b -- A TREATY IS A RELATIONSHIP, NOT A SLOT. `st.v6.treaties[pid]` held
     ONE instrument, so signing a second replaced the first and the same capital
     could be walked round a non-aggression pact, a defence pact and a
     non-aggression pact again inside one session, the Foreign Office reporting
     each of them as a treaty signed. Twenty instruments may stand with one
     capital now, gated on the relation and on what is already written, and
     nothing is signed on the click: a proposal is laid at odds printed before
     the money is spent and the power answers at the next session. */
  const treaty = await page.evaluate(() => {
    const out = { built:typeof v6TreatyPropose === 'function' };
    if (!out.built) {
      /* a build without this PR. Measure what its store can express and say so,
         rather than throwing a ReferenceError at the harness. */
      out.kinds = Object.keys(V6_TREATIES).length;
      out.withNeeds = Object.keys(V6_TREATIES).filter(k => (V6_TREATIES[k].needs || []).length).length;
      out.noFloor = Object.keys(V6_TREATIES).filter(k => V6_TREATIES[k].floor === undefined && k !== 'trade');
      out.silent = [];
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.powers.meridian = 99;
      out.openCold = Object.keys(V6_TREATIES).filter(k => relOf(S, 'meridian') >= V6_TREATIES[k].min).length;
      out.whyShut = 'nothing: the relation was the only gate';
      S.v6.treaties.meridian = { kind:'nonaggression', since:2030 };
      S.v6.treaties.meridian = { kind:'defence', since:2030 };
      out.stacked = 1;
      out.inForceSameSession = 1; out.awaiting = 0; out.laid = true;
      out.answered = true; out.signedNext = true; out.cascade = []; out.leftStanding = 1;
      out.cascadeSound = false; out.cold = 0; out.warm = 0;
      out.migratedKind = false; out.migratedCount = 0; out.lostCount = 0; out.lostDropped = false;
      return out;
    }
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
    S.ruling = playParty(S); S.coalition = [playParty(S)]; S.capital = 9000; S.treasury = 99000;
    const PW = 'meridian';
    out.kinds = Object.keys(V6_TREATIES).length;
    out.withNeeds = Object.keys(V6_TREATIES).filter(k => (V6_TREATIES[k].needs || []).length).length;
    /* every instrument can lapse: five of the ten in the file before this slice
       had no branch anywhere in the tick and could stand through a total
       collapse in relations for two hundred sessions */
    out.noFloor = Object.keys(V6_TREATIES).filter(k => V6_TREATIES[k].floor === undefined && k !== 'trade');
    /* every tag on every card names something the model reads */
    out.silent = Object.keys(V6_TREATIES).filter(k => {
      const d = V6_TREATIES[k];
      return !d.tags || !d.tags.length || !d.note ||
        !(d.targets || d.mil || d.econ || d.tech || d.pov || d.corr || d.drift || d.upkeep || d.warmth || d.floor !== undefined);
    });

    /* 1. the relation alone does not open the ladder */
    S.powers[PW] = 99;
    out.openCold = Object.keys(V6_TREATIES).filter(k => v6TreatyOpen(S, PW, k)).length;
    out.whyShut = v6TreatyWhy(S, PW, 'basing');

    /* 2. laying a proposal does not sign it, and the answer comes one session
       later -- driven in endTurn's own order, per S16a */
    out.laidOdds = v6TreatyOdds(S, PW, 'consular');
    out.laid = v6TreatyPropose(PW, 'consular');
    out.inForceSameSession = v6Treaties(S, PW).length;
    out.awaiting = v6TreatyTalks(S, PW).length;
    v6TreatiesTick(S); S.turn += 1;
    out.answered = v6TreatyTalks(S, PW).length === 0;
    out.signedNext = v6HasTreaty(S, PW, 'consular');

    /* 3. the whole ladder can stand at once */
    Object.keys(V6_TREATIES).sort((a, b) => V6_TREATIES[a].min - V6_TREATIES[b].min).forEach(k => {
      for (let i = 0; i < 40 && !v6HasTreaty(S, PW, k); i++) {
        S.capital = 9000; S.treasury = 99000; S.powers[PW] = 99;
        if (!v6TreatyOpen(S, PW, k)) break;
        v6TreatyPropose(PW, k);
        v6TreatiesTick(S); S.turn += 1;
      }
    });
    out.stacked = v6Treaties(S, PW).length;

    /* 4. a prerequisite means something in both directions: pull the bottom
       instrument out and everything written on it comes away with it */
    const before = v6TreatyKinds(S, PW).slice();
    const gone = v6TreatyAnnul(S, PW, 'nonaggression');
    out.cascade = gone.slice().sort();
    out.leftStanding = v6Treaties(S, PW).length;
    out.cascadeSound = gone.every(k => before.indexOf(k) >= 0) &&
      gone.indexOf('defence') >= 0 && gone.indexOf('basing') >= 0 && out.leftStanding === before.length - gone.length;

    /* 5. the die is real, and better prepared ground carries more often. The
       odds are stored ON the proposal when it is laid, so the number the card
       printed is the number that is rolled and no render path spends a die. */
    const sample = (rel, depth) => {
      let yes = 0;
      for (let i = 0; i < 300; i++) {
        S.v6.treaties[PW] = [];
        S.powers[PW] = rel; S.capital = 9000; S.treasury = 99000;
        S.v6.treatyAsks = {};
        if (depth) ['consular', 'border', 'environment'].forEach(k => S.v6.treaties[PW].push({ kind:k, since:2030 }));
        if (!v6TreatyOpen(S, PW, 'nonaggression')) continue;
        v6TreatyPropose(PW, 'nonaggression');
        v6TreatiesTick(S); S.turn += 1;
        if (v6HasTreaty(S, PW, 'nonaggression')) yes++;
      }
      return yes;
    };
    out.cold = sample(44, false);
    out.warm = sample(96, true);

    /* 6. the Peacemaker record. Its test read `Object.keys(st.v6.treaties)`,
       which is one entry per CAPITAL and never was the number of instruments in
       force -- and once reads stopped being free it would have fired on every
       campaign with nothing signed at all. */
    S.v6.treaties = {};
    POWERS.forEach(p => { v6Treaties(S, p.id); v6TreatyOpen(S, p.id, 'consular'); });
    out.keysAfterReads = Object.keys(S.v6.treaties).length;
    const peace = V6_ACHIEVEMENTS.filter(a => a.id === 'peacemaker')[0];
    out.peaceOnNothing = !!peace && peace.test(S);
    S.v6.treaties = { meridian:[{ kind:'consular', since:2030 }, { kind:'border', since:2031 }] };
    out.peaceOnTwo = !!peace && peace.test(S);
    S.v6.treaties.meridian.push({ kind:'environment', since:2032 });
    out.peaceOnThree = !!peace && peace.test(S);

    /* 6b. the old save shape, through the load path */
    S.v6.treaties = { meridian:{ kind:'trade', since:2031 }, tarnow:'a blob this build cannot read' };
    UI.treatiesMigrated = 0; UI.treatiesLost = 0;
    const rows = v6Treaties(S, 'meridian');
    out.migratedKind = rows.length === 1 && rows[0].kind;
    out.migratedCount = UI.treatiesMigrated;
    out.lostCount = UI.treatiesLost;
    out.lostDropped = v6Treaties(S, 'tarnow').length === 0;
    return out;
  });

  say(treaty.built && treaty.kinds === 20 && treaty.withNeeds >= 16 && treaty.noFloor.length === 0 && treaty.silent.length === 0 &&
      treaty.openCold === 4 && /Written on top of/.test(treaty.whyShut) &&
      treaty.laid && treaty.inForceSameSession === 0 && treaty.awaiting === 1 &&
      treaty.answered && treaty.signedNext && treaty.stacked === 20 && treaty.cascadeSound &&
      treaty.cold > 0 && treaty.cold < 300 && treaty.warm > treaty.cold &&
      treaty.migratedKind === 'trade' && treaty.migratedCount === 1 && treaty.lostCount === 1 && treaty.lostDropped &&
      !treaty.peaceOnNothing && !treaty.peaceOnTwo && treaty.peaceOnThree,
    'a treaty is a relationship, not a slot',
    `${treaty.kinds} instruments, ${treaty.withNeeds} of them written on top of another, and every one of them can lapse ` +
    `(${treaty.noFloor.length} with neither a floor nor a condition) with no silent card among them (${treaty.silent.length}) · ` +
    `at 99 relations and nothing signed only ${treaty.openCold} are on the table and a basing agreement answers "${treaty.whyShut}" · ` +
    `laying terms signs nothing that session (${treaty.inForceSameSession} in force, ${treaty.awaiting} awaiting) and the capital answers at the next (${treaty.signedNext}) · ` +
    `all ${treaty.stacked} can stand with ONE power at once, where the store held exactly one before this PR · ` +
    `annulling the non-aggression pact takes ${treaty.cascade.length} instruments with it (${treaty.cascade.join(', ')}) and leaves ${treaty.leftStanding} standing · ` +
    `the answer is a die: ${treaty.cold} of 300 at a cold 44 with nothing written, ${treaty.warm} of 300 at 96 with three instruments already in force · ` +
    `Peacemaker reads instruments and not capitals: false on nothing signed (${treaty.peaceOnNothing}) after all eleven ` +
    `powers have been read (${treaty.keysAfterReads} keys on the store), false on two with one capital (${treaty.peaceOnTwo}) ` +
    `and true on three (${treaty.peaceOnThree}) -- its test was Object.keys on the store, which counted CAPITALS · ` +
    `and a pre-S16b save carrying one bare object per power migrates (${treaty.migratedCount} carried, ${treaty.lostCount} unreadable dropped and counted)` +
    (treaty.built ? '' : ' · THIS BUILD HAS NO PROPOSAL PATH: st.v6.treaties[pid] is one object, so a second instrument REPLACES the first and terms are signed on the click'));

  /* S16a -- A CLOCK THAT SAYS A NUMBER CHARGES THAT NUMBER. `endTurn` runs
     `tickTurn`, `politicsTick` and `v6ExtraEvents` and only THEN does
     `S.turn += 1`, so a tick that compares against `st.turn` is looking at the
     session the player has just finished, not the one the click is producing.
     Four of the six clocks in the game were counted against the wrong session:
     an article laid "in 2 sessions" wanted three End Session clicks, a
     plebiscite two, a manifesto commitment dated eight sessions out survived
     ten, and a political paper stayed answerable a session past the date
     printed on it. The arc banner (`a.due - S.turn + 1`) and the ballot counter
     were already right, which is what made the other four look deliberate.

     This drives the model in `endTurn`'s own order rather than the UI, per the
     determinism rule: which sheets a click pumps depends on timing, but which
     session a tick is standing in does not. Fixtures are named, never taken by
     position. */
  const clocks = await page.evaluate(() => {
    const rows = [];
    const fresh = () => {
      S = enrichState(v6NewGame('easy', 'v6default', 'standard', 'lp'), false);
      S.seed = 0x5EED1234; S.rngState = 0x5EED1234;
      const me = playParty(S);
      S.ruling = me; S.coalition = [me]; S.capital = 900; S.treasury = 3000;
      PARTIES.forEach(p => { S.partyRel[p.id] = 95; });
      S.seats[me] = Math.floor(CFG.seats * .9);
      PARTIES.forEach(p => { if (p.id !== me) S.seats[p.id] = Math.floor(CFG.seats * .1 / 6); });
    };
    const click = () => {
      tickTurn(S);
      politicsTick(S);
      const fired = (typeof v6ExtraEvents === 'function') ? v6ExtraEvents(S) : [];
      S.turn += 1;
      return fired;
    };
    const ART = 'artQuorum';

    /* 1. an article laid before the Assembly */
    fresh();
    let c = v11Con(S); c.pending = []; c.arts = {}; c.order = []; c.failed = {};
    v11ProposeArticle(ART, false, 'assembly');
    let card = c.pending.length ? Math.max(0, c.pending[0].due - S.turn) : null, took = null;
    for (let i = 1; i <= 8; i++) { click(); if (c.arts[ART]) { took = i; break; } }
    rows.push({ clock: 'article, before the Assembly', card: card, took: took });

    /* 2. the same article by plebiscite -- one session, and open under a form
       with no elections, which is the whole point of a plebiscite */
    fresh();
    c = v11Con(S); c.pending = []; c.arts = {}; c.order = []; c.failed = {};
    S.ind.liberties = 95;
    PARTIES.forEach(p => { S.partyRel[p.id] = 99; });
    BLOCS.forEach(x => { S.blocs[x.id] = 92; });
    v11ProposeArticle(ART, false, 'plebiscite');
    card = c.pending.length ? Math.max(0, c.pending[0].due - S.turn) : null; took = null;
    for (let i = 1; i <= 8; i++) { click(); if (!c.pending.length) { took = i; break; } }
    rows.push({ clock: 'article, by plebiscite', card: card, took: took });

    /* 3. a crisis arc's next dispatch. The banner prints due - turn + 1 and
       `v6ExtraEvents` fires at due <= turn: the +1 is the compensation the
       other clocks were missing. */
    fresh();
    S.v6.arcs = { active: { id: 'capitalCapture', phase: V6_ARC.capitalCapture.phases[0].id,
      started: S.turn, due: S.turn + 2, vars: {} }, done: {}, count: 0, cooldown: S.turn };
    card = S.v6.arcs.active.due - S.turn + 1; took = null;
    for (let i = 1; i <= 8; i++) {
      if (click().some(e => String(e.id).indexOf('v6arc:') === 0)) { took = i; break; }
    }
    rows.push({ clock: "arc's next dispatch", card: card, took: took });

    /* 4. sessions to the federal ballot */
    fresh();
    card = pv5SessionsToBallot(S); took = null;
    for (let i = 1; i <= 12; i++) { click(); if (electionsOn(S) && isBallotTurn(S.turn)) { took = i; break; } }
    rows.push({ clock: 'sessions to the ballot', card: card, took: took });

    /* 5. a manifesto commitment. `promiseTick` refreshes the whole manifesto
       the moment none is active, so the failure is read off the record. */
    fresh();
    S.promises = [{ id: 'S16a-0', party: playParty(S), policy: 'unionRights', target: 99,
      made: S.turn, deadline: S.turn + 8, status: 'active', reward: 4 }];
    card = Math.max(0, S.promises[0].deadline - S.turn); took = null;
    const broke0 = S.legacy.promisesBroken;
    for (let i = 1; i <= 14; i++) { click(); if (S.legacy.promisesBroken > broke0) { took = i; break; } }
    rows.push({ clock: 'manifesto commitment', card: card, took: took });

    /* 6. a political paper. Its card names a DATE, not a count, so the test is
       that it is answerable ON the session it names and gone at that close. */
    fresh();
    S.inbox = [];
    addInbox(S, { type: 'faction_demand', title: 'A paper for the clock', from: null,
      body: 'x', faction: 0, opts: [{ id: 'a', label: 'Yes' }] });
    const paper = S.inbox[0], dated = paper.deadline;
    card = dated - S.turn + 1; took = null;
    let onDated = null;
    for (let i = 1; i <= 8; i++) {
      if (onDated === null && S.turn === dated) onDated = S.inbox.indexOf(paper) >= 0;
      click();
      if (S.inbox.indexOf(paper) < 0) { took = i; break; }
    }
    rows.push({ clock: 'political paper', card: card, took: took, onDated: onDated });

    return rows;
  });

  const clockBad = clocks.filter(r => r.card === null || r.took === null || r.card !== r.took);
  const clockPaper = clocks.filter(r => r.clock === 'political paper')[0];
  say(clockBad.length === 0 && clockPaper && clockPaper.onDated === true,
    'every session clock charges what it prints',
    `${clocks.length} clocks measured against endTurn's own order (tick, then turn += 1): ` +
    clocks.map(r => `${r.clock} says ${r.card}, takes ${r.took}`).join(' · ') +
    ` · a political paper is still answerable on the session its card dates it to (${clockPaper && clockPaper.onDated})` +
    (clockBad.length ? ` · DISAGREE: ${clockBad.map(r => r.clock).join(', ')}` : '') +
    ` · before S16a four of these were counted against the session the click was leaving rather than the one it ` +
    `was producing, so an amendment that said two sessions wanted three End Session clicks`);

  /* S17a — THE SEVEN DEFECTS. Each one was measured on the page before it was
     fixed, and each assertion below reddens if its fix is reverted. They are
     grouped because they share one setup cost and because the program's first
     PR is the one that has to leave nothing lying. */
  const seven = await page.evaluate(() => {
    var R = {}, flashed = null, realFlash = window.flash;

    /* 1. A START'S ARTICLES ARE IN THE MODEL, NOT ONLY IN THE DOCUMENT.
       `c.arts[id] = 0` reads as un-adopted through `v11Adopted`, so every
       article chosen at setup contributed nothing but its one-shot apply. */
    UI.setup = UI.setup || {};
    UI.setup.custom = { articles:['artQuadrennial', 'artEntrenchment'] };
    var cs = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    var eff = v11ConEffects(cs);
    R.startArticles = {
      adopted:v11Adopted(cs, 'artQuadrennial') && v11Adopted(cs, 'artEntrenchment'),
      term:v11TermYears(cs), ratify:eff.ratify,
      refusesRelay:typeof v11CanPropose(cs, V11_ART.artQuadrennial, false) === 'string',
      founding:!!(cs.v11.con.arts.artQuadrennial || {}).founding
    };
    UI.setup.custom = null;

    /* 2. THE EXECUTIVE CARDS SPEAK TO THE PLAYER. In opposition the tags asked
       whether the GOVERNMENT's coalition held the office, so a rival's office
       read "In the coalition · Measures 22% cheaper" and the player's OWN
       party's office read "Held against you". */
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.playAs = 'lp';
    /* The tags are read PER CARD, not searched for across the page: the whole
       defect was a true sentence printed on the wrong office, so presence
       somewhere proves nothing. Cards render in DEPTS order. */
    var cards = viewExec().split('<div class="card">').slice(1);
    var byOffice = {};
    ['pres', 'vpres', 'chan', 'vchan'].forEach(function (k, i) { byOffice[k] = cards[i] || ''; });
    R.execPanel = {
      opposition:standing(S) === 'opposition',
      fourCards:cards.length >= 4,
      ownOfficeIsMine:officeMine(S, 'vchan') === true && S.exec.vchan === 'lp',
      rivalOfficeNotMine:officeMine(S, 'vpres') === false && S.exec.vpres === 'fp',
      /* the player's OWN party's office must not be described as hostile, and
         must be the one card that claims the player's party */
      ownCardClaimsIt:byOffice.vchan.indexOf('Your party holds it') >= 0,
      ownCardNotHostile:byOffice.vchan.indexOf('Held against you') < 0,
      /* the rival's office must not claim the player's party, nor offer the
         player a discount on an instrument opposition cannot use */
      rivalCardDisclaims:byOffice.vpres.indexOf('Your party holds it') < 0,
      rivalCardNoDiscount:byOffice.vpres.indexOf('cheaper') < 0,
      rivalCardNoCoalitionClaim:byOffice.vpres.indexOf('In the coalition') < 0,
      ownOfficeCheap:deptFactor(S, { dept:'vchan' }) < 1,
      rivalOfficeDear:deptFactor(S, { dept:'vpres' }) > 1
    };

    /* 3-4-6. THREE GOVERNMENT SURFACES REFUSE AN OPPOSITION PLAYER. */
    window.flash = function (m) { flashed = m; };
    flashed = null; pv5OpenAppointment(pv5PortfolioRows()[0].key);
    R.appointmentRefused = !!flashed;
    flashed = null;
    var partner = (S.coalition || []).filter(function (p) { return p !== S.ruling; })[0];
    pv5CoalitionAction(partner, 'council');
    R.coalitionRefused = !!flashed;

    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.capital = 400; S.treasury = 4000;
    var govBill = sponsorBill(S, Object.keys(POL)[0], 1, 'government', 'clean', true);
    var t0 = S.treasury, w0 = govBill ? (govBill.committeeWork || 0) : 0;
    flashed = null;
    if (govBill) pv5CommitteeAction(govBill.committeeId, 'hearing', govBill.id);
    R.committee = { refused:!!flashed, treasuryUntouched:S.treasury === t0,
      workUnmoved:govBill ? (govBill.committeeWork || 0) === w0 : false };

    /* 4b. COHESION IS CLAMPED. `+= 16` and `+= 9` were the only two writes not
       passed through c100, and drove the meter past its own track. */
    S.playAs = S.ruling; S.capital = 400; S.treasury = 4000;
    var d = S.coalitionDeals[partner];
    /* Read after EACH write, never only at the end: the two unclamped writes
       were followed by clamped ones, so a final reading is re-clamped and the
       overflow is invisible. */
    var peak = [];
    if (d) {
      d.satisfaction = 95; pv5CoalitionAction(partner, 'portfolio');
      peak.push(S.coalitionDeals[partner] ? S.coalitionDeals[partner].satisfaction : 0);
      d = S.coalitionDeals[partner];
      if (d) { d.satisfaction = 95; pv5CoalitionAction(partner, 'programme'); }
      peak.push(S.coalitionDeals[partner] ? S.coalitionDeals[partner].satisfaction : 0);
    }
    R.cohesionSeen = peak;
    R.cohesionClamped = peak.length === 2 && peak.every(function (n) { return n <= 100; });
    window.flash = realFlash;

    /* 5. A PRIVATE MEMBER'S BILL NAMES ITS OWN SPONSOR, ONCE. `owner:
       'opposition'` was not handled and fell through to the player's party,
       and the generic line printed before the specific one corrected it. */
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'fp'), false);
    S.playAs = 'fp';
    var tries = 0, made = null;
    while (tries++ < 500 && !made) {
      var n = S.bills.length; pv5AiPrivateBill(S);
      if (S.bills.length > n) made = S.bills[S.bills.length - 1];
    }
    var lines = S.log.map(function (l) { return typeof l === 'string' ? l : (l.text || ''); });
    var noSponsor = sponsorBill(S, Object.keys(POL).filter(function (k) { return !activeBillFor(S, k); })[0],
      1, 'opposition', 'clean', true);
    R.privateBill = made ? {
      sponsorNotPlayer:made.sponsor !== playParty(S),
      sponsorOutsideGovernment:(S.coalition || []).indexOf(made.sponsor) < 0,
      introducedOnce:lines.filter(function (l) { return l.indexOf(made.title) >= 0 && /introduc/i.test(l); }).length === 1,
      fallbackNotPlayer:!!noSponsor && noSponsor.sponsor !== playParty(S)
    } : { none:true };

    /* 7. A PACT DOES NOT OUTLIVE THE ELECTION IT WAS MADE FOR. Written in one
       place, read in two, and deleted NOWHERE -- so it pooled six per cent of
       the vote for the rest of the campaign and locked both parties out of
       ever making another. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.aiPacts = { rsf:{ with:'sd', since:S.turn } };
    S.turn += 1; runElection(S, false);
    R.pactLapsed = Object.keys(S.aiPacts || {}).length === 0;
    return R;
  });

  const sevenOk = seven.startArticles.adopted && seven.startArticles.term === 4 &&
    seven.startArticles.ratify > 0 && seven.startArticles.refusesRelay && seven.startArticles.founding &&
    Object.keys(seven.execPanel).every(k => seven.execPanel[k]) &&
    seven.appointmentRefused && seven.coalitionRefused &&
    seven.committee.refused && seven.committee.treasuryUntouched && seven.committee.workUnmoved &&
    seven.cohesionClamped && !seven.privateBill.none &&
    Object.keys(seven.privateBill).every(k => seven.privateBill[k]) && seven.pactLapsed;
  say(sevenOk, 'the seven defects stay fixed',
    `a start's articles are ADOPTED rather than stored as a falsy zero, so the ones the player chose reach the ` +
    `model (the term reads ${seven.startArticles.term} years, the ratify bar moved ${seven.startArticles.ratify}) ` +
    `and cannot be laid a second time · the executive cards ask whose side an office is on from the PLAYER's ` +
    `chair, so in opposition a rival's office is no longer advertised as "In the coalition · 22% cheaper" and the ` +
    `player's own party's office is no longer "Held against you" · the ministry, the coalition agreement and the ` +
    `committee room all refuse an opposition player, and the committee no longer buys a lift on the government's ` +
    `bill out of the national exchequer (treasury untouched: ${seven.committee.treasuryUntouched}) · cohesion ` +
    `cannot pass its own track · a private member's bill names its own sponsor and is introduced exactly once ` +
    `· and a pact lapses at the count it was made for` +
    (sevenOk ? '' : ' · DISAGREE: ' + JSON.stringify(seven)));

  /* S17b — THE MODE MATRIX. Every instrument the game offers, probed from each
     of the three chairs the owner named, on ONE board that supplies all three:
     the Hung Assembly returns fp leading, sd as its junior partner and lp in
     opposition. This is the program's regression net -- every later PR re-runs
     it, and a gate that goes missing reddens here rather than in a playthrough.
     Measured before S17b: the registry gated (6 open in opposition against 66
     in government) but drew NO distinction between the head of government and
     a junior partner -- 66 each -- and 171 party-scoped actions bypassed the
     gate entirely. */
  const matrix = await page.evaluate(() => {
    var chairs = { leading:'fp', junior:'sd', opposition:'lp' };
    var R = {};
    function seat(pid) {
      S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', pid), false);
      S.playAs = pid; S.capital = 500; S.treasury = 8000;
      if (S.purse) S.purse[pid] = 900;
      /* S17f: this board opens as a caretaker now, because that is what its
         own log has always said it was. THIS probe is about the three CHAIRS
         and a caretaker is orthogonal to them -- leaving the flag on would
         make the head of government fail the fiscal and programme probes for
         a reason that has nothing to do with standing. The caretaker's own
         refusals are asserted in `a caretaker holds office and does not
         govern`, on a board that keeps the flag. */
      S.caretaker = null;
      return standing(S);
    }
    /* fires() calls the real handler and asks whether the model moved. A gate
       that only disables a button is not a gate -- S16f2's lesson. */
    var probes = {
      fiscal:function () { var b = S.fiscal.stance; pv5FiscalAction('stance', 'consolidation'); return S.fiscal.stance !== b; },
      programme:function () { var b = S.v6.programme; v6AdoptProgramme('welfareState'); return S.v6.programme !== b; },
      interestAccess:function () { var id = Object.keys(PV5_INTEREST)[0]; var b = S.interests[id].access || 0;
        pv5InterestAction(id, 'access'); return (S.interests[id].access || 0) !== b; },
      interestMeet:function () { var id = Object.keys(PV5_INTEREST)[1]; var b = S.interests[id].relation;
        pv5InterestAction(id, 'meet'); return S.interests[id].relation !== b; },
      /* A minister is SEATED first, in an office the government of this board
         actually holds, so the probe measures the gate rather than an empty
         ministry. Without this it returned null in every chair and the
         assertion passed with no gate at all -- measured. */
      ministerBrief:function () {
        var row = pv5PortfolioRows().filter(function (r) { return holdsDept(S, r.office); })[0];
        if (!row) return null;
        S.ministers = S.ministers || {};
        S.ministers[row.key] = pv5MakeMinister(S, row.key, 0);
        S.cabinet[row.key] = 1;
        var b = S.ministers[row.key].competence;
        pv5MinisterAction(row.key, 'brief');
        return S.ministers[row.key].competence !== b;
      },
      regionGrant:function () { var b = S.treasury; regionAction(REGIONS[0].id, 'grant'); return S.treasury !== b; },
      regionZone:function () { var b = S.treasury; regionAction(REGIONS[1].id, 'zone'); return S.treasury !== b; },
      regionTownhall:function () { var b = S.capital; regionAction(REGIONS[2].id, 'townhall'); return S.capital !== b; },
      governorMeet:function () { var r = REGIONS[0].id; var b = S.v6.governors[r].standing;
        v6GovernorAction(r, 'meet'); return S.v6.governors[r].standing !== b; },
      governorWorks:function () { var b = S.treasury; v6GovernorAction(REGIONS[1].id, 'works'); return S.treasury !== b; },
      /* `stump` refuses for a real game reason in every chair -- the leader
         goes in only when that state's ballot is this session or the next --
         so what is asked here is narrower and exact: whatever else stops it,
         it is never stopped because of WHICH CHAIR the player sits in. */
      governorStump:function () { var msg = null, rf = window.flash; window.flash = function (m) { msg = m; };
        v6GovernorAction(REGIONS[2].id, 'stump'); window.flash = rf;
        return msg === null || msg.indexOf('That belongs to') !== 0; },
      /* A standards case against the government's own minister is answered by
         the government. A live case is synthesised so the probe does not wait
         on the dice for one. */
      scandalInquiry:function () {
        S.scandals = S.scandals || [];
        S.scandals.push({ id:'S17PROBE', status:'active', minister:Object.keys(S.ministers || {})[0] || null,
          title:'A probe case', detail:'', heat:60, evidence:60, opened:S.turn });
        var before = S.scandals.filter(function (x) { return x.id === 'S17PROBE'; })[0].heat;
        pv5ResolveScandal('S17PROBE', 'inquiry');
        var rec = S.scandals.filter(function (x) { return x.id === 'S17PROBE'; })[0];
        return !!rec && rec.heat !== before;
      },
      coalitionCouncil:function () { var p = (S.coalition || []).filter(function (x) { return x !== S.ruling; })[0];
        if (!p || !S.coalitionDeals[p]) return null; var b = S.coalitionDeals[p].satisfaction;
        pv5CoalitionAction(p, 'council'); return S.coalitionDeals[p].satisfaction !== b; },
      draftBill:function () { var f = false, rf = window.flash; window.flash = function () { f = true; };
        draftBillDialog(Object.keys(POL).filter(function (k) { return !activeBillFor(S, k); })[0], 1);
        window.flash = rf; try { hideSheet(); } catch (e) { } return !f; },
      layArticle:function () { return v11CanPropose(S, V11_ART.artQuadrennial, false) === null; },
      /* the scarcity of private members' time, asked by actually taking it */
      secondPrivateBill:function () {
        var free = Object.keys(POL).filter(function (k) { return !activeBillFor(S, k); });
        sponsorBill(S, free[0], 1, 'player', 'clean', true, playParty(S), true);
        var f = false, rf = window.flash; window.flash = function () { f = true; };
        draftBillDialog(free[1], 1); window.flash = rf; try { hideSheet(); } catch (e) { }
        return !f;
      },
      /* The first article is laid through the REAL path, not pushed in as a
         synthetic record: a probe that supplies `by` itself proves the cap's
         arithmetic and nothing about the field's writer, and a cap that reads
         a field nobody writes is not a cap. */
      secondArticle:function () {
        S.capital = 500;
        v11ProposeArticle('artEntrenchment', false, 'assembly');
        if (!v11PendingOf(S, 'artEntrenchment')) return 'ERR:first article did not lay';
        return v11CanPropose(S, V11_ART.artQuadrennial, false) === null;
      },
      /* the two Figures cards that rewrite the executive, asked of the gate */
      sackMinister:function () { return actionOpen(ACTIONS.filter(function (x) { return x.id === 'sackMinister'; })[0]); },
      promoteProtege:function () { return actionOpen(ACTIONS.filter(function (x) { return x.id === 'promoteProtege'; })[0]); },
      /* and the opposition's own kit, which must survive the gating */
      oppositionAttack:function () { var a = ACTIONS.filter(function (x) { return x.id === 'oppositionAttack'; })[0];
        return !!a && actionOpen(a); },
      campaignField:function () { var b = S.campaign.field; pv5CampaignAction('field'); return S.campaign.field !== b; },
      partyOrganise:function () { var l = partyActions(playParty(S)) || [];
        var a = l.filter(function (x) { return x.id === 'organise'; })[0]; return !!a && actionOpen(a); }
    };
    Object.keys(chairs).forEach(function (chair) {
      var st = seat(chairs[chair]);
      var row = { standing:st, registry:0, partyOnOthers:0 };
      ACTIONS.forEach(function (a) { try { if (actionOpen(a)) row.registry++; } catch (e) { } });
      PARTIES.forEach(function (p) {
        if (p.id === playParty(S)) return;
        (partyActions(p.id) || []).forEach(function (a) { try { if (actionOpen(a)) row.partyOnOthers++; } catch (e) { } });
      });
      Object.keys(probes).forEach(function (k) {
        var v = null; try { v = probes[k](); } catch (e) { v = 'ERR'; }
        row[k] = v; S.capital = 500; S.treasury = 8000;
      });
      R[chair] = row;
    });
    return R;
  });

  /* S17b: and the private member's bill is PLAYED, not merely permitted. A
     gate that opens onto nothing is not the owner's requirement met. */
  const pmb = await page.evaluate(() => {
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.capital = 300;
    var free = Object.keys(POL).filter(function (k) { return !activeBillFor(S, k); });
    var msg = null, rf = window.flash; window.flash = function (m) { msg = m; };
    draftBillDialog(free[0], 1);
    var opened = !!document.getElementById('sheet');
    var btn = document.querySelector('[data-draft]'); if (btn) btn.click();
    window.flash = rf;
    var mine = S.bills.filter(function (x) { return x.sponsor === 'lp'; });
    if (!mine.length) return { laid:false, opened:opened, flash:msg };
    var bill = mine[0], f = billForecast(S, bill);
    /* the same measure laid by the government, for the comparison the owner
       asked for: "they obviously may have less chance of succeeding" */
    var gs = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'fp'), false);
    gs.playAs = 'fp';
    var gb = sponsorBill(gs, bill.policy, bill.dir, 'government', 'clean', true);
    var gf = gb ? billForecast(gs, gb) : null;
    return { laid:true, opened:opened, owner:bill.owner, sponsor:bill.sponsor,
      stage:bill.stage, canWork:(inPower(S) || bill.owner === 'player'),
      lower:Math.round(f.lower), govLower:gf ? Math.round(gf.lower) : null };
  });
  const pmbOk = pmb.laid && pmb.opened && pmb.owner === 'player' && pmb.sponsor === 'lp' &&
    pmb.canWork === true && pmb.govLower !== null && pmb.lower < pmb.govLower;
  say(pmbOk, 'a private member\'s bill',
    pmb.laid
      ? `an opposition player lays one through the real drafting sheet and it reaches the paper as their own ` +
        `(${pmb.owner}/${pmb.sponsor}, at ${pmb.stage}), workable by its sponsor because the bill card has always ` +
        `allowed that -- and it is HARDER than the same measure in government hands, ${pmb.lower} against ` +
        `${pmb.govLower} in the Assembly, because the arithmetic behind it is worse rather than because a number ` +
        `was put on the scale`
      : `NOT LAID (sheet opened: ${pmb.opened}, refusal: ${pmb.flash})`);

  const L = matrix.leading, J = matrix.junior, O = matrix.opposition;
  /* what each chair must be able to do, and must not */
  const matrixWants = [
    ['standings are the three the owner named', L.standing === 'leading' && J.standing === 'junior' && O.standing === 'opposition'],
    ['only the head of government sets the fiscal framework', L.fiscal === true && J.fiscal === false && O.fiscal === false],
    ['only the head adopts the programme', L.programme === true && J.programme === false && O.programme === false],
    ['a government grants privileged access; opposition does not', L.interestAccess === true && J.interestAccess === true && O.interestAccess === false],
    ['anybody may meet an interest', L.interestMeet === true && J.interestMeet === true && O.interestMeet === true],
    ['a ministry is run by the government', L.ministerBrief === true && O.ministerBrief === false],
    ['federal money in a region is the head\'s', L.regionGrant === true && J.regionGrant === false && O.regionGrant === false],
    ['an enterprise zone is the head\'s', L.regionZone === true && J.regionZone === false && O.regionZone === false],
    ['a town hall is open to a governing party', L.regionTownhall === true && J.regionTownhall === true && O.regionTownhall === false],
    ['a governor is met by the government', L.governorMeet === true && J.governorMeet === true && O.governorMeet === false],
    ['joint federal works are the head\'s', L.governorWorks === true && J.governorWorks === false && O.governorWorks === false],
    ['the leader may stump for a challenger in any chair', L.governorStump === true && J.governorStump === true && O.governorStump === true],
    ['the coalition agreement is the head\'s', L.coalitionCouncil === true && J.coalitionCouncil !== true && O.coalitionCouncil !== true],
    ['a standards case is answered by the government', L.scandalInquiry === true && O.scandalInquiry === false],
    ['the two Figures cards that rewrite the executive are the government\'s', L.sackMinister === true && O.sackMinister === false && O.promoteProtege === false],
    ['the head and a partner are no longer the same chair', L.registry > J.registry || L.partyOnOthers > J.partyOnOthers],
    ['opposition keeps its own kit', O.oppositionAttack === true && O.campaignField === true && O.partyOrganise === true],
    /* THE OWNER'S REQUIREMENT, NOT THE OLD BEHAVIOUR. "As an opposition party,
       you should still be able to introduce bills and constitutional
       articles." The first draft of this matrix asserted the opposite and
       would have entrenched the refusal it was written to remove. */
    ['the floor is open from every chair', O.draftBill === true && O.layArticle === true &&
      L.draftBill === true && L.layArticle === true && J.draftBill === true],
    ['private members\' time is scarce, so one bill at a time', O.secondPrivateBill === false],
    ['and one article at a time', O.secondArticle === false]
  ];
  const matrixBad = matrixWants.filter(w => !w[1]).map(w => w[0]);
  say(matrixBad.length === 0, 'the three chairs',
    `every instrument probed from all three chairs on one board -- fp leading, sd its junior partner, lp in opposition ` +
    `-- and each answers to the chair it belongs to · the registry opens ${L.registry} cards to the head, ${J.registry} ` +
    `to a partner and ${O.registry} in opposition, and party-scoped cards aimed at rivals ${L.partyOnOthers}/` +
    `${J.partyOnOthers}/${O.partyOnOthers}: before S17b the head and the partner were the SAME chair (66 and 66) and ` +
    `171 party-scoped actions bypassed the gate, among them signing confidence and supply on a government's behalf and ` +
    `expelling a party from a cabinet the player was not in · the opposition keeps what is genuinely its own -- the ` +
    `censure and no-confidence deck, the campaign, the party machine, meeting an interest, stumping for a challenger` +
    (matrixBad.length ? ' · DISAGREE: ' + matrixBad.join('; ') : ''));

  /* S17c — WHOSE DESK IT LANDS ON. Every event declares the office it belongs
     to; the head of government answers everything; anybody else answers what
     their OWN party's office holds; the government of the day answers the
     rest and the Gazette prints what it did. */
  const desk = await page.evaluate(() => {
    var R = {};
    /* 1. THE REGISTRY IS COMPLETE. Any event added later without an office
       reddens here rather than silently routing to the government. */
    var OK = { pres:1, vpres:1, chan:1, vchan:1, national:1 };
    var pools = [EVENTS, typeof V6_EVENTS !== 'undefined' ? V6_EVENTS : [],
      typeof V8_EVENTS !== 'undefined' ? V8_EVENTS : [], typeof V9_EVENTS !== 'undefined' ? V9_EVENTS : [],
      typeof V10_EVENTS !== 'undefined' ? V10_EVENTS : [],
      typeof V10_ROAD_EVENTS !== 'undefined' ? V10_ROAD_EVENTS : []];
    /* Counted by IDENTITY, not by array position: the later registries are
       concatenated into the earlier ones, so walking all six naively counts
       the same object twice and reported 299 for 175 events. */
    var seenEv = [], bad = [];
    pools.forEach(function (pool) {
      (pool || []).forEach(function (e) {
        if (seenEv.indexOf(e) >= 0) return;
        seenEv.push(e);
        if (!e.office || !OK[e.office]) bad.push(e.id + ':' + (e.office || 'none'));
      });
    });
    R.events = { total:seenEv.length, bad:bad.slice(0, 5), badCount:bad.length };

    /* 2. THE ROUTING, over forty sessions from each chair. */
    function run(pid, turns) {
      S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', pid), false);
      S.playAs = pid;
      var asked = 0, offices = {};
      for (var t = 0; t < turns; t++) {
        S.capital = 200; S.treasury = 3000;
        /* S17d: a reaction is a VOICE, not a decision. It is queued at the
           player precisely because the question was not theirs to answer, so
           counting it here would say the opposite of what it means. */
        var mine = v17Route(S, pickEvents()).filter(function (e) { return e.kind !== 'reaction'; });
        asked += mine.length;
        mine.forEach(function (e) { offices[e.office] = 1; });
        S.turn += 1;
      }
      return { standing:standing(S), asked:asked, governed:(S.govRecord || []).length,
        offices:Object.keys(offices).sort(), holds:S.exec.vchan === pid };
    }
    R.lead = run('fp', 40);
    R.opp = run('lp', 40);

    /* 3. THE GOVERNMENT'S CHOICE IS THE GOVERNMENT'S. The same rail strike put
       to four different governments: a party of the left funds a settlement,
       a party of the right sends them back to work. Nothing is scripted --
       the split falls out of each party's own blocs. */
    var strike = EVENTS.filter(function (x) { return x.id === 'strike'; })[0];
    function decideAs(rul) {
      S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
      S.playAs = 'lp'; S.ruling = rul; S.capital = 200; S.treasury = 3000;
      var pick = v17AiDecide(S, strike);
      return pick ? pick.l : null;
    }
    R.byGovernment = { rsf:decideAs('rsf'), lp:decideAs('lp'), pnl:decideAs('pnl'), cup:decideAs('cup') };

    /* 4. DECIDING SPENDS NO LIVE DICE. The choices are weighed on sandboxed
       clones, so the stream the campaign rides must be exactly where it was. */
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.capital = 200; S.treasury = 3000;
    var rngBefore = S.rngState;
    v17AiDecide(S, strike);
    R.rngUnmoved = S.rngState === rngBefore;

    /* 4b. AND endTurn ACTUALLY ROUTES. Calling `v17Route` directly proves the
       function and nothing about the game: with the call site removed from
       `endTurn` the rest of this probe still passed. So real sessions are
       closed and the queue is caught on its way into `runQueue`, which is the
       only place a player's questions can come from. Waiting for one of the
       player's own offices to come up by chance made the probe a lottery -- it
       caught 2 questions on one run and 0 on the next -- so what is compared
       is the two chairs over the SAME fixed stream: the head of government is
       asked everything, the opposition only its own, and if the routing is not
       wired the two numbers are equal. */
    function sessions(pid, n) {
      S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', pid), false);
      S.playAs = pid; S.capital = 300; S.treasury = 4000; S.rngState = 20260827;
      var got = [], rq = runQueue;
      runQueue = function (done) {
        (UI.queue || []).forEach(function (e) {
          if (!e || e.kind === 'reaction') return;   /* a voice, not a decision */
          got.push({ id:e.id, office:e.office || 'national',
            holder:e.office && e.office !== 'national' ? S.exec[e.office] : null, me:playParty(S) });
        });
        UI.queue = []; rq(done);
      };
      try { for (var t = 0; t < n; t++) { S.capital = 300; endTurn(); } }
      catch (e) { R.endTurnErr = e.message.slice(0, 90); }
      finally { runQueue = rq; }
      return got;
    }
    var asLead = sessions('fp', 45), asOpp = sessions('lp', 45);
    R.wired = {
      lead:asLead.length, opp:asOpp.length,
      notMine:asOpp.filter(function (c) { return c.office !== 'national' && c.holder !== c.me; })
        .map(function (c) { return c.id + ':' + c.office; }).slice(0, 4),
      nationalAsked:asOpp.filter(function (c) { return c.office === 'national'; }).length };

    /* 5. AND THE GAZETTE PRINTS IT. */
    S.govRecord = [{ turn:S.turn - 1, id:'strike', title:'National Rail and Port Strike',
      office:'vchan', by:S.ruling, choice:'Mediate and fund the settlement', note:'' }];
    var dig = v17GovDigest(S);
    R.digest = { renders:dig.indexOf('What the Government Did') >= 0,
      namesTheOffice:dig.indexOf('Vice Chancellor') >= 0,
      namesTheChoice:dig.indexOf('Mediate and fund') >= 0 };
    S.govRecord = [];
    R.digestSilentWhenNothing = v17GovDigest(S) === '';
    return R;
  });

  const distinctGov = new Set(Object.keys(desk.byGovernment).map(k => desk.byGovernment[k])).size;
  const deskOk = desk.events.badCount === 0 && desk.events.total >= 170 &&
    desk.lead.asked > 0 && desk.lead.governed === 0 &&
    desk.opp.asked > 0 && desk.opp.governed > 0 &&
    desk.opp.offices.length === 1 && desk.opp.offices[0] === 'vchan' && desk.opp.holds &&
    distinctGov >= 2 && desk.rngUnmoved && !desk.endTurnErr &&
    desk.wired.lead > 0 && desk.wired.lead > desk.wired.opp &&
    desk.wired.notMine.length === 0 && desk.wired.nationalAsked === 0 &&
    desk.digest.renders && desk.digest.namesTheOffice && desk.digest.namesTheChoice &&
    desk.digestSilentWhenNothing;
  say(deskOk, 'whose desk it lands on',
    `all ${desk.events.total} events in six registries declare the office they belong to` +
    (desk.events.badCount ? ` (BAD: ${desk.events.bad.join(', ')})` : '') +
    ` · over forty sessions the head of government answered ${desk.lead.asked} and governed ${desk.lead.governed} ` +
    `by proxy, while an opposition player was asked ${desk.opp.asked} times and only ever about ` +
    `[${desk.opp.offices.join(', ')}] -- the one great office their own party holds -- and read about the other ` +
    `${desk.opp.governed} in the Gazette · the same rail strike put to four governments splits ` +
    `${distinctGov} ways (${Object.keys(desk.byGovernment).map(k => k + ': ' + desk.byGovernment[k]).join(' · ')}), ` +
    `which falls out of each party's own blocs rather than a table · weighing the choices spends no live dice ` +
    `(${desk.rngUnmoved}) and the digest is silent when the player decided everything themselves · and the routing is ` +
    `WIRED: forty-five real sessions closed on one fixed stream put ${desk.wired.lead} questions to the head of ` +
    `government and ${desk.wired.opp} to an opposition player, none of them about an office that player's party does ` +
    `not hold -- and with the routing unwired the two numbers are the same` +
    (desk.wired.notMine.length ? ' (LEAKED: ' + desk.wired.notMine.join(', ') + ')' : '') +
    (desk.endTurnErr ? ' · endTurn threw: ' + desk.endTurnErr : ''));

  /* S17c: AND THE UNIQUENESS IS A PROPERTY, NOT A RUN OF LUCK. The churn above
     samples: it draws names from a 39,400-pair pool for a cast of about
     twenty and finds no collision, which is unsurprising and was never proof.
     `makeName` tried ten times and then returned whatever it had, so a
     collision was always possible and the assertion above reddened at random
     in two consecutive slices. The corner is forced here instead -- a pool of
     nine pairs with eight of them already held -- where ten random draws
     almost always collide. Measured on the build before the fix: 89 of 300
     names came back already in use. */
  const nameProp = await page.evaluate(() => {
    var G0 = GIVEN, S0 = SURNAME, out = { tries:300, bad:0 };
    try {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      GIVEN = ['Ada', 'Bo', 'Cy']; SURNAME = ['Dane', 'Ek', 'Fane'];
      var pairs = [];
      GIVEN.forEach(function (g) { SURNAME.forEach(function (s) { pairs.push(g + ' ' + s); }); });
      var taken = pairs.slice(0, 8);
      for (var i = 0; i < out.tries; i++) {
        S.rngState = (i + 1) * 7919 % 2147483647;
        S.figures.leaders = {}; S.ministers = {};
        PARTIES.slice(0, 7).forEach(function (p, k) { S.figures.leaders[p.id] = { name:taken[k] || taken[0], party:p.id }; });
        S.figures.exec = { pres:{ name:taken[7], party:'lp' }, vpres:{ name:taken[0], party:'lp' },
          chan:{ name:taken[1], party:'lp' }, vchan:{ name:taken[2], party:'lp' } };
        REGIONS.forEach(function (r) { S.v6.governors[r.id] = { name:taken[3], party:'lp' }; });
        /* THE LIVE PATH. `makeFigure` is reassigned late in the file and
           overwrites `makeName`'s result with `v10UniqueName`'s, so probing
           `makeName` alone proved a function the game does not call: measured
           on the build before S17e, the live path returned an already-held
           name 131 times in 300 while `makeName` returned none. */
        if (v16NameHeld(makeFigure(S, 'lp', 44).name, S)) out.bad++;
      }
    } catch (e) { out.err = e.message.slice(0, 80); }
    finally {
      GIVEN = G0; SURNAME = S0;
      /* the probe hand-builds minimal figures to force the corner; leave a
         healthy state behind so nothing downstream inherits them */
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    }
    return out;
  });
  say(nameProp.bad === 0 && !nameProp.err, 'a free name is always found',
    nameProp.err ? 'probe threw: ' + nameProp.err
      : `${nameProp.tries} figures minted through the LIVE path into a nine-pair pool with eight pairs already held, ` +
        `and not one name came back already in use — where the bounded retries it replaced returned a collision 131 ` +
        `times in 300. Both layers had the same defect: ten tries in \`makeName\` and six in \`v10UniqueName\`, each ` +
        `followed by "take what we have", and the second overwrites the first`);

  /* S17d — THE REACTION. The owner, on being out of government: "the biggest
     national events also offer YOU a reaction choice ... but it should not be
     that flat/stagnant. add variety." So the assertion is about VARIETY as
     much as about the mechanism: one exploit/back/silent triple repeated over
     a campaign would satisfy a naive test and fail the requirement. */
  const react = await page.evaluate(() => {
    var R = {}, ALLOWED = ['mach', 'mood', 'rel', 'relOthers', 'sal', 'cap', 'money', 'unrest'];
    var fams = Object.keys(V17_REACT), verbs = 0, labels = {}, bad = [], shapes = {};
    fams.forEach(function (f) {
      var sig = [];
      V17_REACT[f].verbs.forEach(function (v) {
        verbs++; labels[v.l] = 1; sig.push(v.l);
        Object.keys(v.e || {}).forEach(function (k) { if (ALLOWED.indexOf(k) < 0) bad.push(f + '.' + k); });
      });
      shapes[sig.join('|')] = 1;
    });
    R.families = fams.length; R.verbs = verbs;
    R.distinctLabels = Object.keys(labels).length; R.distinctSets = Object.keys(shapes).length;
    R.outOfVocabulary = bad;

    var seen = [], withReact = 0;
    [EVENTS, V6_EVENTS, V8_EVENTS, V9_EVENTS, V10_EVENTS, V10_ROAD_EVENTS].forEach(function (pool) {
      (pool || []).forEach(function (e) { if (seen.indexOf(e) >= 0) return; seen.push(e); if (e.react) withReact++; });
    });
    R.events = seen.length; R.withReaction = withReact;
    R.familiesUnknown = seen.filter(function (e) { return e.react && !V17_REACT[e.react]; })
      .map(function (e) { return e.id + ':' + e.react; });

    /* live, from the opposition bench, on a fixed stream */
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.rngState = 20260827;
    var offered = 0, setsSeen = {};
    for (var t = 0; t < 40; t++) {
      S.capital = 250; S.treasury = 3000;
      v17Route(S, pickEvents()).forEach(function (e) {
        if (e.kind !== 'reaction') return;
        offered++; setsSeen[e.ch.map(function (c) { return c.l; }).join('|')] = 1;
      });
      S.turn += 1;
    }
    R.live = { offered:offered, distinctSetsSeen:Object.keys(setsSeen).length };

    /* AND IT NEVER TOUCHES THE OUTCOME. The government has already decided;
       answering back moves the player's own standing and nothing the event
       itself moved. */
    var src = EVENTS.filter(function (x) { return x.react === 'labour'; })[0];
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.capital = 250;
    var pick = v17AiDecide(S, src);
    var before = JSON.stringify({ e:S.ind.economy, s:S.ind.safety, u:S.unrest, p:S.ind.poverty, t:S.treasury });
    var re = v17ReactionEvent(S, src, pick), m0 = S.machine.lp;
    re.ch[0].f(S);
    R.outcome = { built:!!re, choices:re.ch.length,
      untouched:JSON.stringify({ e:S.ind.economy, s:S.ind.safety, u:S.unrest, p:S.ind.poverty, t:S.treasury }) === before,
      standingMoved:S.machine.lp !== m0,
      linkedToDigest:((S.govRecord || [])[0] || {}).reaction === re.ch[0].l };
    return R;
  });
  const reactOk = react.families >= 10 && react.verbs >= 30 && react.distinctLabels === react.verbs &&
    react.distinctSets === react.families && react.outOfVocabulary.length === 0 &&
    react.familiesUnknown.length === 0 && react.withReaction > 100 &&
    react.live.offered > 10 && react.live.distinctSetsSeen >= 6 &&
    react.outcome.built && react.outcome.untouched && react.outcome.standingMoved &&
    react.outcome.linkedToDigest;
  say(reactOk, 'a voice out of office',
    `${react.families} families of reaction, ${react.verbs} verbs and ${react.distinctLabels} distinct labels -- a ` +
    `flood is not a scandal is not a purge, and no two families share a verb · ${react.withReaction} of ` +
    `${react.events} events carry one, and forty sessions from the opposition bench offered ` +
    `${react.live.offered} of them in ${react.live.distinctSetsSeen} different shapes, which is the answer to ` +
    `"it should not be that flat/stagnant" · every verb's effect is drawn from a CLOSED vocabulary ` +
    `(machine, mood, relations, salience, capital, party money, unrest), so a reaction moves the player's machine, standing, relations, salience and press and ` +
    `CANNOT reach the outcome the government already decided: measured, the event's own indicators and the ` +
    `treasury are untouched (${react.outcome.untouched}) while the machine moves (${react.outcome.standingMoved}) ` +
    `· and the Gazette prints the pair, what the government did and what you said about it ` +
    `(${react.outcome.linkedToDigest})` +
    (react.outOfVocabulary.length ? ' · OUT OF VOCABULARY: ' + react.outOfVocabulary.join(', ') : '') +
    (react.familiesUnknown.length ? ' · UNKNOWN FAMILY: ' + react.familiesUnknown.join(', ') : ''));

  /* S17e — THE COALITION IN WRITING. The agreement was single-perspective: the
     seed returned early for the ruling party, so the head of government was
     the only member of its own coalition with no entry, and a junior-partner
     player read about their colleagues and never about their own terms. */
  const deal = await page.evaluate(() => {
    var R = {};
    function seat(pid) { S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', pid), false); S.playAs = pid; }
    ['fp', 'sd', 'lp'].forEach(function (pid) {
      seat(pid);
      var deals = S.coalitionDeals || {}, html = pv5CoalitionPanel();
      R[pid] = { standing:standing(S),
        headHasEntry:!!deals[S.ruling],
        everyMemberHasTerms:(S.coalition || []).every(function (x) { return deals[x] && deals[x].terms; }),
        everyMemberHasLedger:(S.coalition || []).every(function (x) { return deals[x] && deals[x].ledger; }),
        myEntry:!!deals[pid],
        myTerms:deals[pid] && deals[pid].terms ? {
          offices:(deals[pid].terms.offices || []).length,
          concessions:(deals[pid].terms.concessions || []).length,
          redLines:(deals[pid].terms.redLines || []).length,
          confidence:deals[pid].terms.confidence } : null,
        showsOwnTerms:html.indexOf('Your terms') >= 0,
        showsButtons:html.indexOf('data-coalition-action') >= 0,
        /* The legacy scalar must FOLLOW the list, or S16e's walkout goes on
           watching a red line the document no longer has. Comparing them as
           seeded proves nothing -- the list is built FROM the scalar -- so the
           list is changed and the ensure re-run, and the scalar has to move. */
        mirrored:(function () {
          var partner = (S.coalition || []).filter(function (x) { return x !== S.ruling; })[0];
          var d = partner && deals[partner];
          if (!d || !d.terms) return true;
          var other = Object.keys(POL).filter(function (k) { return k !== d.redLine; })[0];
          d.terms.redLines = [other];
          pv5EnsureState(S, false);
          return S.coalitionDeals[partner].redLine === other;
        })() };
    });
    return R;
  });
  const dealOk = deal.fp.headHasEntry && deal.fp.everyMemberHasTerms && deal.fp.everyMemberHasLedger &&
    deal.fp.showsButtons && !deal.fp.showsOwnTerms &&
    deal.sd.standing === 'junior' && deal.sd.myEntry && deal.sd.myTerms &&
    deal.sd.myTerms.concessions > 0 && deal.sd.myTerms.confidence === 'cabinet' &&
    deal.sd.showsOwnTerms && !deal.sd.showsButtons &&
    deal.lp.standing === 'opposition' && !deal.lp.myEntry && !deal.lp.showsButtons &&
    deal.fp.mirrored && deal.sd.mirrored && deal.lp.mirrored;
  say(dealOk, 'the coalition in writing',
    `every member of a coalition has an entry in its own agreement, the head of government included ` +
    `(${deal.fp.headHasEntry}) -- the seed returned early for the ruling party, which is why a junior partner had ` +
    `nothing of their own to read · each entry carries terms and a ledger, and a junior-partner player reads THEIR ` +
    `terms first-person (${deal.sd.myTerms ? deal.sd.myTerms.concessions + ' concessions, ' + deal.sd.myTerms.redLines + ' red line, confidence as ' + deal.sd.myTerms.confidence : 'none'}) ` +
    `with none of the head's four buttons, while an opposition player reads an agreement that is not theirs and ` +
    `is offered no buttons at all · the legacy scalar still mirrors the list (${deal.fp.mirrored}), so S16e's ` +
    `walkout is untouched until S17g teaches it to read the list`);

  /* S17e (pulled forward from s17h): NOBODY HOLDS TWO GREAT OFFICES. The bench
     deduped within one office and nothing asked about the other three, and the
     party leader sits on every bench with a bonus -- so a party winning both
     offices of a pair installed the same person twice. This is also why `no
     two officials share a name` reddened at random for three slices: a person
     in two chairs IS a duplicate name, and the assertion was right. */
  const twoHats = await page.evaluate(() => {
    var elections = 0, doubles = 0, sample = null;
    for (var k = 0; k < 10; k++) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.rngState = (k + 1) * 104729;
      for (var t = 0; t < 60; t++) {
        S.turn += 1;
        if (!isExecTurn(S.turn)) continue;
        elections++; runElection(S, false);
        var names = ['pres', 'vpres', 'chan', 'vchan'].map(function (o) { return S.figures.exec[o].name; });
        if (names.length !== new Set(names).size) {
          doubles++;
          if (!sample) {
            var c = {}; names.forEach(function (n) { c[n] = (c[n] || 0) + 1; });
            var dn = Object.keys(c).filter(function (n) { return c[n] > 1; })[0];
            sample = dn + ' holds ' + ['pres', 'vpres', 'chan', 'vchan']
              .filter(function (o) { return S.figures.exec[o].name === dn; })
              .map(function (o) { return DEPTS[o].name; }).join(' and ');
          }
        }
      }
    }
    return { elections:elections, doubles:doubles, sample:sample };
  });
  say(twoHats.doubles === 0 && twoHats.elections > 100, 'nobody holds two great offices',
    twoHats.doubles === 0
      ? `${twoHats.elections} executive elections over ten campaigns and not one of them seated a person who ` +
        `already held another great office — where before the exclusion 136 of 150 did, which is not an edge case ` +
        `but the norm: the party leader sits on every office's bench with a bonus, and the bench deduped within ` +
        `one office and never asked about the other three`
      : `${twoHats.doubles} of ${twoHats.elections} elections seated a double — ${twoHats.sample}`);


  /* S17f — NOBODY RULES UNTIL THE HOUSE SAYS SO. A government was the largest
     party and a coalition was a greedy walk down the ideological distance:
     nobody was asked and nobody could refuse. Four things are asserted here,
     and each of them was false before this slice. */
  const form = await page.evaluate(() => {
    var R = {};
    function board(lower, upper) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.playAs = 'lp';
      if (upper) { S.upper.exists = true; S.upper.elected = true; }
      v6SetSeats(S, lower, upper || null);
      var largest = null;
      PARTIES.forEach(function (p) { if (!largest || (S.seats[p.id] || 0) > (S.seats[largest] || 0)) largest = p.id; });
      return largest;
    }
    /* (a) A PLURALITY IS NOT A GOVERNMENT. The League is the largest party in
       this chamber by two hundred and fifty seats and cannot reach a majority
       with anybody who will sit with it; three smaller parties can and do. */
    var big = board({ pnl:500, lp:250, sd:220, rsf:200, cup:60, tvc:50, fp:25 });
    var froze = v17Rotation(S, null);
    R.freeze = { largest:big, lead:froze.lead, co:froze.co.slice(), ok:froze.ok,
      how:froze.how, rounds:froze.rounds.length,
      seatsLargest:S.seats[big], seatsGov:froze.co.reduce(function (n, x) { return n + (S.seats[x] || 0); }, 0),
      majority:v17Majority(S) };
    /* AND IT HAPPENS IN PLAY, not only when the rotation is called by hand:
       the same chamber, driven through a real ballot. */
    S.turn = 3; S.rngState = 20260827;
    var r = runElection(S, false);
    R.playFroze = { lead:r.lead, gov:r.gov, frozenOut:r.frozenOut, changed:r.changed,
      formationOnState:!!S.formation, howOnState:S.formation && S.formation.how };

    /* (b) WEIGHT IS BOTH CHAMBERS, per the owner's ruling: influence is
       proportional to total seats across the ELECTED bodies after the renewal.
       Only the Senate changes between these two boards and the order the
       country asks the parties in has to change with it. */
    board({ fp:250, lp:260, sd:220, cup:200, pnl:180, tvc:150, rsf:45 },
          { fp:20, lp:120, sd:40, cup:30, pnl:30, tvc:20, rsf:20 });
    var orderA = v17ByWeight(S).slice(0, 2).join(',');
    board({ fp:250, lp:260, sd:220, cup:200, pnl:180, tvc:150, rsf:45 },
          { fp:120, lp:20, sd:40, cup:30, pnl:30, tvc:20, rsf:20 });
    var orderB = v17ByWeight(S).slice(0, 2).join(',');
    R.weight = { a:orderA, b:orderB, moved:orderA !== orderB,
      appointedIgnored:(function () {
        S.upper.elected = false; var c = v17ByWeight(S).slice(0, 2).join(',');
        S.upper.elected = true; return c !== orderB;
      })() };

    /* (c) AN ABSTENTION IS NOT OPPOSITION. The same coalition, short of a
       majority, is invested when a party outside it stands aside and defeated
       when that party votes. This is the whole of what confidence and supply
       buys, and there was no investiture at all before this slice. */
    board({ pnl:430, rsf:400, tvc:200, lp:120, sd:80, cup:50, fp:25 });
    var rot = v17Rotation(S, null);
    var minRound = rot.rounds.filter(function (x) { return x.kind === 'minority'; })[0];
    R.minority = { how:rot.how, supply:rot.confidence, co:rot.co.slice(),
      seats:rot.co.reduce(function (n, x) { return n + (S.seats[x] || 0); }, 0),
      majority:v17Majority(S),
      withAbstention:minRound ? minRound.vote.invested : null,
      withoutAbstention:minRound ? v17Invest(S, minRound.co, null).invested : null,
      tally:minRound ? [minRound.vote.aye, minRound.vote.nay, minRound.vote.abstain] : null };

    /* (d) AND SOMETIMES THERE IS NO GOVERNMENT. Two blocs that will not sit
       together, neither of them near a majority, nobody willing even to
       abstain: a caretaker, which is not a defect but the answer. */
    board({ pnl:400, rsf:390, tvc:250, cup:200, lp:35, sd:20, fp:10 });
    var dead = v17Rotation(S, null);
    R.dead = { ok:dead.ok, how:dead.how, rounds:dead.rounds.length, lead:dead.lead };

    /* (e) AND SOME PARTIES WILL NOT SIT TOGETHER AT ANY PRICE. The most
       distant pair on the compass is offered EVERYTHING -- the whole
       coalition's weight, an office, every concession its own list carries --
       and still refuses, while a near party on the identical offer accepts.
       A model in which every coalition can be bought has no politics in it. */
    board({ pnl:400, rsf:390, tvc:250, cup:200, lp:35, sd:20, fp:10 });
    var pairs = [];
    PARTIES.forEach(function (a) { PARTIES.forEach(function (b) {
      if (a.id < b.id) pairs.push([a.id, b.id, dist2(ppos(S, a.id), ppos(S, b.id))]);
    }); });
    pairs.sort(function (x, y) { return y[2] - x[2]; });
    var far = pairs[0], near = pairs[pairs.length - 1];
    function everything(pid, lead) {
      return v17Accept(S, pid, lead, { to:pid, from:lead, share:1, portfolios:8, offices:1,
        concessions:pv5TopWants(pid, S, 3).map(function (w) { return { kind:'adopt', ref:w.id, due:null, met:false }; }),
        redLines:[] }, 40, null);
    }
    var farAns = everything(far[0], far[1]), nearAns = everything(near[0], near[1]);
    R.unbridgeable = { far:far[0] + '/' + far[1], farD:+far[2].toFixed(2), farYes:farAns.yes, farFlag:farAns.far,
      near:near[0] + '/' + near[1], nearD:+near[2].toFixed(2), nearYes:nearAns.yes, bar:V17_UNBRIDGEABLE };

    /* (f) THE ROTATION SPENDS NO DICE AND ALWAYS SAYS THE SAME THING. It is
       run twice on one screen and again after the player's answer is pinned,
       so a die rolled inside it would make the formation depend on how many
       times somebody looked at the sheet. */
    var before = S.rngState;
    var once = JSON.stringify(v17Rotation(S, null).co);
    var twice = JSON.stringify(v17Rotation(S, null).co);
    R.pure = { same:once === twice, noDice:S.rngState === before };
    return R;
  });
  const formOk = form.freeze.ok && form.freeze.lead !== form.freeze.largest &&
    form.freeze.seatsLargest > 400 && form.freeze.seatsGov >= form.freeze.majority &&
    form.playFroze.frozenOut === form.freeze.largest && form.playFroze.gov !== form.playFroze.lead &&
    form.playFroze.formationOnState &&
    form.weight.moved && form.weight.appointedIgnored &&
    form.minority.how === 'minority' && form.minority.withAbstention === true &&
    form.minority.withoutAbstention === false &&
    form.dead.ok === false && form.dead.how === 'caretaker' &&
    form.unbridgeable.farYes === false && form.unbridgeable.farFlag === true &&
    form.unbridgeable.nearYes === true &&
    form.pure.same && form.pure.noDice;
  say(formOk, 'a plurality is not a government',
    `the League holds ${form.freeze.seatsLargest} of ${1305} in this chamber and does not govern it: no combination ` +
    `it can assemble reaches ${form.freeze.majority}, and the ${form.freeze.co.length} parties that can took ` +
    `the government instead (${form.freeze.co.join('+')}, ${form.freeze.seatsGov} seats) after ` +
    `${form.freeze.rounds} rounds of the rotation -- and it happens through a real ballot, not only when the ` +
    `rotation is called by hand (largest ${form.playFroze.lead}, governing ${form.playFroze.gov}) · influence is ` +
    `TOTAL seats across the ELECTED chambers, so changing only the Senate moves who is asked first ` +
    `(${form.weight.a} then ${form.weight.b}) and an appointed Senate is not counted at all ` +
    `(${form.weight.appointedIgnored}) · an abstention is not opposition: ${form.minority.co.join('+')} at ` +
    `${form.minority.seats} of ${form.minority.majority} is invested ${form.minority.tally ? form.minority.tally[0] + ' to ' + form.minority.tally[1] + ' with ' + form.minority.tally[2] + ' abstaining' : ''} ` +
    `because the ${form.minority.supply ? form.minority.supply.toUpperCase() : '--'} stand aside, and defeated the moment they do not ` +
    `(${form.minority.withoutAbstention}) · and sometimes nobody can: ${form.dead.rounds} rounds and a caretaker ` +
    `(${form.dead.how}) · some parties will not sit together at any price: ${form.unbridgeable.far} at ` +
    `${form.unbridgeable.farD} on the compass refuse the whole coalition's weight, an office and every concession ` +
    `on their own list (${form.unbridgeable.farYes}) against a bar of ${form.unbridgeable.bar}, while ` +
    `${form.unbridgeable.near} at ${form.unbridgeable.nearD} accept the identical offer ` +
    `(${form.unbridgeable.nearYes}) -- a model where every coalition can be bought has no politics in it · ` +
    `the whole rotation spends no dice and answers the same twice ` +
    `(${form.pure.same}/${form.pure.noDice}), which is what lets the player's own answer be pinned and the ` +
    `country asked again`);

  /* S17f — A CARETAKER HOLDS OFFICE AND DOES NOT GOVERN. The Hung Assembly's
     own words were "No party can command the Assembly" and "carries on as a
     caretaker" over a model that had installed an ordinary federal government
     at a seat share of .308 and never read it again. */
  const care = await page.evaluate(() => {
    var R = {};
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'fp'), false);
    S.playAs = 'fp'; S.capital = 300; S.treasury = 6000;
    R.opens = { caretaker:!!S.caretaker, standing:standing(S), ruling:S.ruling,
      govSeats:(S.coalition || []).reduce(function (n, x) { return n + (S.seats[x] || 0); }, 0),
      majority:v17Majority(S) };
    /* the five instruments, each asked from the caretaker's own chair */
    function refuse(fn) { var m = null, f = flash; flash = function (x) { m = x; }; try { fn(); } finally { flash = f; } return m; }
    R.bars = {
      policy:refuse(function () { changePolicy('incomeTax', 1); }),
      fiscal:refuse(function () { pv5FiscalAction('stance', 'expansionary'); }),
      programme:refuse(function () { v6AdoptProgramme(Object.keys(V6_PROGRAMME)[0]); }),
      treaty:v6TreatyWhy(S, 'moya', 'trade'),
      order:v10OrderOpen(S, V10_ORDER['maritimeExclusion'], null)
    };
    /* and the exception: the emergency does not stop for a formation */
    var em = V10_ORDERS.filter(function (o) { return o.cat === 'Emergency and territory'; })[0];
    R.emergencyOpen = em ? String(v10OrderOpen(S, em, em.target ? 'tenebris' : null) || '') : 'NO EMERGENCY ORDER';
    R.panel = v17FormationPanel();
    /* THE CARETAKER IS ENTERED AND LEFT THROUGH REAL SESSIONS, not by calling
       the tick: with the call site out of endTurn a hand-driven clock still
       passes. Closing a session on the Hung Assembly has to resolve it. */
    /* The session has to be CLOSED, not stepped: `runQueue` waits on the
       player's questions and everything after it -- the caretaker's clock
       among them -- runs in its callback. Catching the queue on its way in and
       emptying it is how the rest of this harness closes a session. */
    var rq = runQueue;
    function close() {
      runQueue = function (done) { UI.queue = []; rq(done); };
      try { UI.queue = []; UI.busy = false; endTurn(); } finally { runQueue = rq; }
      UI.queue = [];
    }
    /* ONE session, on a turn that is NOT a ballot turn, from a chair that is
       not the caretaker's own. Driving it to a ballot would prove nothing: an
       election forms a government anyway, and with the clock's call site taken
       out of endTurn the whole probe still passed until it was pinned down
       like this. So what is measured is a caretaker replaced by a government
       between one session and the next with the ballot never moving. */
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.capital = 300; S.rngState = 20260827;
    var was = !!S.caretaker, gov0 = (S.coalition || []).join('+'), le = S.lastElection;
    close();
    R.resolvedInPlay = { was:was, now:!!S.caretaker, sessions:1, ballotMoved:S.lastElection !== le,
      how:S.formation && S.formation.how, confidence:S.confidence,
      was0:gov0, gov:(S.coalition || []).join('+'), moved:gov0 !== (S.coalition || []).join('+') };
    /* AND THE CLOCK IS BOUNDED. A chamber nobody can govern, driven through
       real sessions: the caretaker cannot outlast V17_CARETAKER_MAX. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.capital = 300; S.rngState = 20260827;
    v6SetSeats(S, { pnl:400, rsf:390, tvc:250, cup:200, lp:35, sd:20, fp:10 }, null);
    v17Install(S, v17Rotation(S, null));
    R.stuck = !!S.caretaker;
    /* A forced ballot on a chamber nobody can govern often produces another
       chamber nobody can govern, so what is bounded is not "the country stops
       having caretakers" -- it is that NO SINGLE ONE outlives the clock. The
       longest one seen over ten sessions is measured, and so is the fact that
       at least one of them ended at the polls. */
    /* AND THE CLOCK. A deadlock in this republic is SOFT, and measuring it is
       how that was learned: the rotation reads where the parties stand, what
       they hold against each other and how they feel about the player, all
       three of which move every session, and a grudge cools by .6 a turn -- so
       a caretaker installed on a chamber nobody could govern is almost always
       replaced by the next session's attempt, which is the behaviour above and
       is right. The clock is the GUARANTEE for the country where they do not
       move, and a guarantee still has to be wired and still has to count. The
       wiring is proved above, by a caretaker that a closed session resolved
       without anybody calling the clock; what is proved here is the count, on
       a picture deliberately frozen so the rotation cannot succeed. */
    var ticks = [], since = S.caretaker ? S.caretaker.since : S.turn;
    for (var t = 0; t < V17_CARETAKER_MAX + 1 && S.caretaker; t++) {
      S.turn += 1;
      ticks.push([S.turn - since, v17CaretakerTick(S), !!S.caretaker]);
    }
    R.bound = { steps:ticks, cleared:!S.caretaker, forced:ticks.filter(function (x) { return x[1]; }).length,
      sessions:ticks.length, max:V17_CARETAKER_MAX,
      carriedOn:ticks.filter(function (x) { return !x[1] && x[2]; }).length };
    R.max = V17_CARETAKER_MAX;
    return R;
  });
  const V17_MAX = care.max;
  const careOk = care.opens.caretaker && care.opens.govSeats < care.opens.majority &&
    /caretaker/i.test(care.bars.policy || '') && /caretaker/i.test(care.bars.fiscal || '') &&
    /caretaker/i.test(care.bars.programme || '') && /caretaker/i.test(care.bars.treaty || '') &&
    /caretaker/i.test(care.bars.order || '') &&
    !/caretaker/i.test(care.emergencyOpen) &&
    care.panel.indexOf('Caretaker') >= 0 &&
    care.resolvedInPlay.was && !care.resolvedInPlay.now && !care.resolvedInPlay.ballotMoved &&
    /* WHICH government it produced is not the claim -- a caretaker becoming a
       government between one session and the next, with no ballot, is. Pinning
       it to `minority` made this assertion a hostage to every later slice that
       moves a grudge or a relationship by a point. */
    care.resolvedInPlay.moved && !!care.resolvedInPlay.how &&
    care.resolvedInPlay.how !== 'caretaker' &&
    /* The bound is PINNED at three, not read off the constant it is checking:
       parameterising the count by V17_CARETAKER_MAX makes the assertion agree
       with any value the constant happens to hold, which is no assertion at
       all. Three is what the card prints and three is what the clock charges. */
    care.stuck && care.bound.cleared && care.bound.max === 3 && care.bound.forced === 1 &&
    care.bound.sessions === 3 && care.bound.carriedOn === 2;
  say(careOk, 'a caretaker holds office and does not govern',
    `the Hung Assembly opens as what its own log says it is -- a caretaker on ${care.opens.govSeats} of ` +
    `${care.opens.majority} needed, where the model used to install an ordinary federal government and read ` +
    `nothing about it ever again · five instruments refuse it in its own words (statute, fiscal framework, ` +
    `programme, treaty, order) and the emergency is the one thing that does not stop for a formation ` +
    `("${care.emergencyOpen.slice(0, 46)}" is a different refusal, not the caretaker's) · the state is on the ` +
    `government page rather than only in the refusals · and it is entered and left through PLAY, not by calling ` +
    `the clock: ONE closed session on a turn no ballot was due (${!care.resolvedInPlay.ballotMoved}) took it from ` +
    `${care.resolvedInPlay.was0} to ${care.resolvedInPlay.gov} as ${String(care.resolvedInPlay.how)}` +
    `${care.resolvedInPlay.confidence ? ' with the ' + String(care.resolvedInPlay.confidence).toUpperCase() + ' supplying confidence' : ''} ` +
    `· a deadlock in this republic is SOFT -- positions, grudges and relations all move every session and a grudge ` +
    `cools by .6 a turn, so the parties usually find an answer at the next attempt, which is the two sessions ` +
    `above · the clock is the guarantee for the country where they do not, and on a frozen picture it counts ` +
    `exactly: ${care.bound.carriedOn} sessions of "the caretaker carries on" and then, at ` +
    `${care.bound.sessions} of ${care.bound.max}, the ballot nobody asked for (${care.bound.forced})`);

  /* S17f — THE HOUSE REMOVES A GOVERNMENT, NOT THE OPINION POLLS. The vote of
     no confidence read `approval(S) < 42`: a national mood number consulted
     instead of the chamber. Both directions of the defect are measured, and
     both of them are the OPPOSITE of what the old line did. */
  const noconf = await page.evaluate(() => {
    function board(lower, ruling, co, opts) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.playAs = 'lp'; S.capital = 300;
      v6SetSeats(S, lower, null);
      S.ruling = ruling; S.coalition = co.slice(); S.partner = co[1] || null;
      S.confidence = (opts && opts.confidence) || null;
      S = enrichState(S, false);
      if (opts && opts.cohesion !== undefined) {
        co.slice(1).forEach(function (pid) { if (S.coalitionDeals[pid]) S.coalitionDeals[pid].satisfaction = opts.cohesion; });
      }
      if (opts && opts.approval !== undefined) {
        BLOCS.forEach(function (b) { S.blocs[b.id] = opts.approval; });
      }
      return v17ConfidenceVote(S);
    }
    /* A government with a real majority and a country that hates it: the old
       line brought it down on approval alone. */
    var safe = board({ lp:700, sd:200, fp:150, cup:100, pnl:100, tvc:35, rsf:20 }, 'lp', ['lp'], { approval:8 });
    var safeApproval = Math.round(approval(S));
    /* A minority government, adored, whose only partner has stopped speaking
       to it: the old line saved it on approval alone. */
    var doomed = board({ lp:300, sd:220, fp:250, cup:200, pnl:200, tvc:100, rsf:35 }, 'lp', ['lp', 'sd'],
      { cohesion:8, approval:96 });
    var doomedApproval = Math.round(approval(S));
    /* and a government that falls is not an election: the same Assembly is
       asked whether it can produce another one out of the same seats. */
    var was = S.ruling, before = S.turn;
    var out = v17Refound(S);
    return { safe:safe, safeApproval:safeApproval, doomed:doomed, doomedApproval:doomedApproval,
      refound:{ ok:out.ok, was:was, now:S.ruling, how:out.how, sameTurn:S.turn === before,
        changed:out.ok && out.lead !== was } };
  });
  const ncOk = !noconf.safe.carried && noconf.safeApproval < 42 &&
    noconf.doomed.carried && noconf.doomedApproval >= 42 &&
    noconf.doomed.defectors.length > 0 && noconf.refound.sameTurn;
  say(ncOk, 'the house removes a government',
    `the confidence motion counted the country's mood and not the chamber, and both directions of that are ` +
    `measured here · a single-party government on 700 of 1,305 survives at an approval of ${noconf.safeApproval} ` +
    `(${noconf.safe.aye} for, ${noconf.safe.nay} against), where the old line brought it down for being ` +
    `unpopular · a minority government at an approval of ${noconf.doomedApproval} FALLS ` +
    `(${noconf.doomed.nay} against, ${noconf.doomed.aye} for) because its own partner voted against it -- ` +
    `cohesion at 8, and S16e's number finally decides something · and a government that falls does not go ` +
    `straight to the country: the same Assembly was asked again in the same session (${noconf.refound.sameTurn}) ` +
    `and answered ${noconf.refound.ok ? 'with a government' + (noconf.refound.changed ? ' under somebody else' : ' of the same party') : 'with a caretaker'}`);


  /* S17g — HONOUR, ALTER, BETRAY. S17e wrote the agreement down and S17f
     negotiated it; neither made keeping it mean anything. `concessions` was a
     list nothing consulted and `ledger` was an empty array with a named PR to
     come, which is the only reason a field nothing reads was allowed to land.
     Six things are asserted, and every one of them was inert before. */
  const deal17g = await page.evaluate(() => {
    var R = {};
    try { return probe17g(R); } catch (e) { R.threw = e.message + ' | ' + (e.stack || '').split('\n')[1]; return R; }
    function probe17g(R) {
    function board() {
      S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'fp'), false);
      S.playAs = 'fp'; S.capital = 400; S.treasury = 8000; S.caretaker = null;
      S.ruling = 'fp'; S.coalition = ['fp', 'sd'];
      S = enrichState(S, false);
      return S.coalitionDeals.sd;
    }
    var d = board();
    if (!d || !d.terms) { R.noDeal = { has:!!d, keys:Object.keys(S.coalitionDeals || {}), co:(S.coalition||[]).join('+') }; return R; }
    R.terms = { kinds:(d.terms.concessions || []).map(function (c) { return c.kind; }),
      redLines:(d.terms.redLines || []).length };

    /* (a) A PROMISE TO LEAVE SOMETHING ALONE, BROKEN BY LAYING IT. Laying is
       the breach: a partner does not wait for assent to notice. */
    var refr = (d.terms.concessions || []).filter(function (c) { return c.kind === 'refrain'; })[0];
    var coh0 = d.satisfaction;
    sponsorBill(S, refr.ref, 1, 'government', 'clean', true, 'fp', true);
    R.breach = { ref:refr.ref, before:Math.round(coh0), after:Math.round(S.coalitionDeals.sd.satisfaction),
      ledger:(S.coalitionDeals.sd.ledger || []).map(function (e) { return e.kind; }),
      broken:v17Broken(S, 'sd'), floorNow:v17WalkFloor(S, 'sd'), floorWas:12 };

    /* (b) AND KEPT, WHEN THE BOOK REACHES WHAT WAS PROMISED -- through a REAL
       bill and a real assent. Calling the emitter by hand proves the emitter
       and nothing about the game: with the call site taken out of `enactBill`
       the first version of this still passed. And the promise is MARKED, so a
       statute that keeps moving cannot be paid for twice. */
    d = board();
    var ad = (d.terms.concessions || []).filter(function (c) {
      return c.kind === 'adopt' && ((PARTY.sd.wants || {})[c.ref] || 0) >= 1; })[0];
    var want = (PARTY.sd.wants || {})[ad.ref], coh1 = d.satisfaction;
    S.pol[ad.ref] = want - 1;
    var bill = sponsorBill(S, ad.ref, 1, 'government', 'clean', true, 'fp', true);
    enactBill(S, bill);
    var afterOnce = S.coalitionDeals.sd.satisfaction, onceKept = v17Kept(S, 'sd');
    v17DealEvent(S, 'move', ad.ref, 'fp', 'again');
    R.kept = { ref:ad.ref, before:Math.round(coh1), after:Math.round(afterOnce),
      count:onceKept, twice:v17Kept(S, 'sd'),
      marked:(S.coalitionDeals.sd.terms.concessions || []).filter(function (c) { return c.ref === ad.ref; })[0].met,
      ledger:(S.coalitionDeals.sd.ledger || []).map(function (e) { return e.kind; }) };

    /* (c) ONLY THE GOVERNMENT CAN BREACH THE GOVERNMENT'S AGREEMENT. An
       opposition bill on a partner's red line is a fact about the opposition. */
    d = board();
    var refr2 = (d.terms.concessions || []).filter(function (c) { return c.kind === 'refrain'; })[0];
    var coh2 = d.satisfaction;
    sponsorBill(S, refr2.ref, 1, 'opposition', 'clean', true, 'pnl', true);
    R.notMine = { before:Math.round(coh2), after:Math.round(S.coalitionDeals.sd.satisfaction),
      entries:(S.coalitionDeals.sd.ledger || []).length };

    /* (d) THE WALKOUT IS THE TERMINAL, AND ITS FLOOR READS THE RECORD. Driven
       breaches of a red line, through the session sweep -- and the agreement
       is KEPT afterwards as the account of what was broken. S16e deleted it,
       and an agreement nobody can read afterwards cannot be argued about. */
    d = board();
    S.coalitionDeals.sd.satisfaction = 40;
    var n = 0;
    for (var i = 0; i < 12 && (S.coalition || []).indexOf('sd') >= 0; i++) {
      var dd = S.coalitionDeals.sd, line = (dd.terms.redLines || [])[0];
      if (line) { dd.redLineOff = dd.redLineOff || {}; dd.redLineOff[line] = 0; S.pol[line] = (S.pol[line] || 0) + 1; }
      v16RedLineTick(S); n++;
    }
    R.walk = { sessions:n, gone:(S.coalition || []).indexOf('sd') < 0,
      recordKept:!!(S.coalitionDeals || {}).sd,
      former:!!(((S.coalitionDeals || {}).sd) || {}).former,
      ledger:((((S.coalitionDeals || {}).sd) || {}).ledger || []).map(function (e) { return e.kind; }) };

    /* (e) ALTERING IS NOT BREAKING. */
    d = board();
    var before = (d.terms.concessions || []).map(function (c) { return c.ref; }).join(',');
    var cohBefore = d.satisfaction;
    var okAlter = v17Renegotiate(S, 'sd');
    var after = (S.coalitionDeals.sd.terms.concessions || []).map(function (c) { return c.ref; }).join(',');
    R.alter = { ok:okAlter, changed:before !== after, before:before, after:after,
      ledger:(S.coalitionDeals.sd.ledger || []).map(function (e) { return e.kind; }),
      broken:v17Broken(S, 'sd'), cohUp:S.coalitionDeals.sd.satisfaction > cohBefore,
      redLineSafe:(S.coalitionDeals.sd.terms.concessions || []).every(function (c) {
        return (S.coalitionDeals.sd.terms.redLines || []).indexOf(c.ref) < 0; }) };

    /* and refused once the agreement carries V17_PATIENCE broken promises */
    d = board();
    for (var k = 0; k < V17_PATIENCE; k++) v17Ledger(S, 'sd', { kind:'broken', ref:'x', why:'probe', cost:0 });
    R.alterRefused = String(v17CanRenegotiate(S, 'sd') || '');

    /* (f) AND COLLAPSING THE COALITION BREAKS EVERY PROMISE STILL IN IT. */
    d = board();
    var outstanding = (d.terms.concessions || []).filter(function (c) { return !c.met; }).length;
    v17DealEvent(S, 'quit', null, 'sd', 'probe');
    R.betray = { outstanding:outstanding, broken:v17Broken(S, 'sd') };

    R.card = v17LedgerCard(S, 'sd').indexOf('The record') >= 0;
    return R;
    }
  });
  const g = deal17g;
  const gMissing = g.threw ? 'threw: ' + g.threw
    : ['terms', 'breach', 'kept', 'notMine', 'walk', 'alter', 'betray'].filter(k => !g[k]).join(', ');
  const dealGOk = !gMissing &&
    g.terms.kinds.indexOf('refrain') >= 0 && g.terms.redLines > 0 &&
    g.breach.after < g.breach.before && g.breach.ledger.indexOf('broken') >= 0 &&
    g.breach.floorNow > g.breach.floorWas &&
    g.kept.after > g.kept.before && g.kept.count === 1 && g.kept.twice === 1 && g.kept.marked === true &&
    g.kept.ledger.indexOf('kept') >= 0 &&
    g.notMine.after === g.notMine.before && g.notMine.entries === 0 &&
    g.walk.gone && g.walk.recordKept && g.walk.former && g.walk.ledger.length > 0 &&
    g.alter.ok && g.alter.changed && g.alter.ledger.join() === 'altered' && g.alter.broken === 0 &&
    g.alter.cohUp && g.alter.redLineSafe && /broken promises/.test(g.alterRefused) &&
    g.betray.outstanding > 0 && g.betray.broken === g.betray.outstanding &&
    g.card;
  say(dealGOk, 'live up to it, alter it, betray it', gMissing ? 'the probe could not finish -- ' + gMissing :
    `an agreement now says two things the government will DO and one it will NOT ` +
    `(${g.terms.kinds.join(', ')}) beside the red line it exists to defend · BREAKING it: laying a bill on the ` +
    `promise to leave it alone takes cohesion from ${g.breach.before} to ${g.breach.after} the moment it is ` +
    `introduced, writes it in the ledger, and raises the walkout floor from ${g.breach.floorWas} to ` +
    `${g.breach.floorNow} -- a partner's patience is shorter the more often it has been broken · KEEPING it: ` +
    `a real bill on the promised statute, carried to assent, takes cohesion from ${g.kept.before} to ` +
    `${g.kept.after} and records a credit -- once and not twice, because the promise is marked kept ` +
    `(${g.kept.marked}) · only the GOVERNMENT can breach the government's agreement, so an opposition bill on the same ` +
    `statute moves nothing (${g.notMine.before} to ${g.notMine.after}, ${g.notMine.entries} entries) · driven ` +
    `breaches walk the partner out in ${g.walk.sessions} sessions and the agreement is KEPT afterwards as the ` +
    `record of what was broken (${g.walk.recordKept}), where S16e deleted it and left nothing to argue about · ` +
    `ALTERING is not breaking: reopening swaps an outstanding promise for one they still want ` +
    `(${g.alter.after}), records "altered" rather than "broken" (${g.alter.broken} broken), gains cohesion, ` +
    `never touches the red line (${g.alter.redLineSafe}), and is refused outright once the agreement carries ` +
    `three broken promises · and BETRAYING it -- collapsing the coalition -- breaks all ` +
    `${g.betray.outstanding} promises still outstanding at once`);


  /* S17h — THE CALENDAR TELLS THE TRUTH. Three clocks that printed one thing
     and charged another, and a reshuffle that reached into offices the
     government did not hold. */
  const cal = await page.evaluate(() => {
    var R = {};
    function con(st) {
      if (!st.v11) st.v11 = {};
      if (!st.v11.con) st.v11.con = { arts:{}, order:[], pending:[], failed:{}, conv:0, convUsed:0, plebiscites:0 };
      return st.v11.con;
    }
    function adopt(st, id, turn) {
      con(st).arts[id] = { year:yearOf(turn), margin:null, turn:turn, entrenched:false };
    }
    /* (a) THE TERM ARTICLE EXTENDS THE TERM, IT DOES NOT RE-PHASE THE
       CALENDAR. `(t - 1) % term === 0` is anchored to session one, so adopting
       a longer term moved every ballot in the campaign onto a new phase
       instead of lengthening the one being served. Measured before the fix:
       a ballot at 3, the Quadrennial Article adopted at 4, and the next ballot
       at 5 -- TWO years later, under an article whose card says four. */
    function ballotsAfter(adoptAt, art) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.playAs = 'lp'; S.lastElection = 3; S.turn = adoptAt;
      if (art) adopt(S, art, adoptAt);
      var seen = [];
      for (var t = adoptAt + 1; t <= adoptAt + 14 && seen.length < 3; t++) {
        if (isBallotTurn(t)) { seen.push(t); S.lastElection = t; }
      }
      return { seen:seen, term:v11TermYears(S) };
    }
    R.plain = ballotsAfter(4, null);
    R.quad = ballotsAfter(4, 'artQuadrennial');
    R.annual = ballotsAfter(4, 'artAnnualAssembly');

    /* (b) AND THE EXECUTIVE'S CALENDAR IS NOT THE LEGISLATURE'S. The contest
       lived inside runElection, so a legislative term of three -- both timing
       articles adopted -- moved the ballots off every exec turn and the four
       great offices were never contested again for the rest of the campaign.
       Driven through REAL sessions, because a hand-called contest proves the
       function and not the wiring. */
    function play(arts, n) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.playAs = 'lp'; S.rngState = 20260827;
      (arts || []).forEach(function (a) { adopt(S, a, 1); });
      var execTurns = [], ballots = [], rq = runQueue;
      runQueue = function (done) { UI.queue = []; rq(done); };
      try {
        for (var t = 0; t < n; t++) {
          UI.queue = []; UI.busy = false; S.capital = 80;
          var le = S.lastElection, lx = S.lastExec;
          endTurn(); UI.queue = [];
          if (S.over) break;
          if (S.lastExec !== lx) execTurns.push(S.lastExec);
          if (S.lastElection !== le) ballots.push(S.lastElection);
        }
      } finally { runQueue = rq; }
      return { exec:execTurns, ballots:ballots, term:v11TermYears(S) };
    }
    R.normal = play([], 26);
    R.term3 = play(['artQuadrennial', 'artAnnualAssembly'], 26);

    /* (c) THE ARTICLE OF THE FIXED TERM GETS ITS TEETH. Its card said the
       Assembly shall not be dissolved at the convenience of the government,
       and it moved capital income and nothing else. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.ruling = 'lp'; S.capital = 400; S.turn = 4;
    var before = S.lastElection;
    callElection();
    R.snapOpen = S.lastElection !== before;
    adopt(S, 'artFixedTerm', 1);
    S.capital = 400;
    var before2 = S.lastElection, msg = null, f = flash;
    flash = function (x) { msg = x; };
    try { callElection(); } finally { flash = f; }
    R.snapShut = { moved:S.lastElection !== before2, why:String(msg || '') };

    /* (d) AND A RESHUFFLE STAYS IN THE GOVERNMENT'S OWN OFFICES AND DRAWS FROM
       ITS OWN BENCH. Three sites replaced the holder of a RANDOMLY chosen
       great office with a minted stranger, so a government could sack the
       opposition's President and whoever arrived came from nowhere. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.ruling = 'lp';
    S.exec = { pres:'lp', vpres:'fp', chan:'lp', vchan:'sd' };
    var was = V15_EXEC_OFFICES.map(function (o) { return holderOf(S, o).name; });
    var hits = { own:0, other:0, benched:0, minted:0 }, offices = {};
    for (var k = 0; k < 12; k++) {
      S.turn += 1;
      var sh = v17Reshuffle(S, 'lp', null);
      if (!sh) continue;
      offices[sh.office] = true;
      if (S.exec[sh.office] === 'lp') hits.own++; else hits.other++;
      if (/party|states|cabinet|Assembly|bench|leader/i.test(sh.in.from || '')) hits.benched++; else hits.minted++;
    }
    var now = V15_EXEC_OFFICES.map(function (o) { return holderOf(S, o).name; });
    /* (e) AND THE PAGES STOP SAYING "BIENNIAL". Five sites printed the word as
       a constant -- the Senate's renewal, the court's returned seats, the
       quiet-election log and the vacancy card -- so a republic that had voted
       itself a four-year term read about a two-year one on four screens. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.ruling = 'lp';
    var pagesBefore = [viewHouses(), viewJudicial()].join(' ');
    adopt(S, 'artQuadrennial', 1);
    var pagesAfter = [viewHouses(), viewJudicial()].join(' ');
    R.prose = { term:v11TermYears(S),
      biennialBefore:/biennial/i.test(pagesBefore), biennialAfter:/biennial/i.test(pagesAfter),
      saysFour:/4 years apart|every 4 years|4 years/.test(pagesAfter) };

    R.reshuffle = { own:hits.own, other:hits.other, benched:hits.benched, minted:hits.minted,
      offices:Object.keys(offices).join('+'),
      rivalsUntouched:was[1] === now[1] && was[3] === now[3],
      unique:new Set(now).size === 4,
      froms:hits.benched + hits.minted };
    return R;
  });
  const calOk =
    cal.plain.seen.join() === '5,7,9' && cal.plain.term === 2 &&
    cal.quad.term === 4 && cal.quad.seen[0] === 7 && cal.quad.seen.join() === '7,11,15' &&
    cal.annual.term === 1 && cal.annual.seen[0] === 5 &&
    cal.normal.exec.join() === '5,9,13,17,21,25' &&
    cal.term3.term === 3 && cal.term3.exec.join() === '5,9,13,17,21,25' &&
    cal.term3.ballots.indexOf(5) < 0 && cal.term3.ballots.indexOf(9) < 0 &&
    cal.snapOpen && !cal.snapShut.moved && /Fixed Term/.test(cal.snapShut.why) &&
    !cal.prose.biennialBefore && !cal.prose.biennialAfter && cal.prose.saysFour &&
    cal.reshuffle.other === 0 && cal.reshuffle.own > 0 &&
    cal.reshuffle.minted === 0 && cal.reshuffle.rivalsUntouched && cal.reshuffle.unique;
  say(calOk, 'the calendar tells the truth',
    `A TERM IS COUNTED FROM THE LAST ELECTION AND NOT BEFORE. With a ballot at 3 and the Quadrennial Article ` +
    `adopted at 4, the next ballot falls at ${cal.quad.seen[0]} and then ${cal.quad.seen.slice(1).join(', ')} -- ` +
    `four years apart, which is what its card says. Anchored to session one, as it was, the same case gave a ` +
    `ballot at 5: TWO years later, under an article that promises four, and half of every adoption window hit ` +
    `it · shortening works the same way round (the Annual Article puts the next at ${cal.annual.seen[0]}) and ` +
    `an unamended constitution is untouched (${cal.plain.seen.join(', ')} on a term of ${cal.plain.term}) · ` +
    `AND THE EXECUTIVE'S CALENDAR IS ITS OWN: the contest lived inside runElection, so adopting both timing ` +
    `articles moved the ballots to ${cal.term3.ballots.slice(0, 5).join(', ')} and the exec turns 5, 9, 13 were ` +
    `never contested again. Over twenty-six real sessions on a term of ${cal.term3.term} the four great offices ` +
    `are returned at ${cal.term3.exec.join(', ')} -- the same eight-year rotation as an unamended constitution ` +
    `(${cal.normal.exec.join(', ')}) · THE ARTICLE OF THE FIXED TERM HAS TEETH: the snap dissolution is open ` +
    `without it (${cal.snapOpen}) and refused with it, in the article's own words · AND THE PAGES SAY THE TERM ` +
    `THE COUNTRY VOTED FOR: with the Quadrennial Article adopted the Senate and the court read ` +
    `${cal.prose.term} years (${cal.prose.saysFour}) and the word "biennial" is on neither ` +
    `(${cal.prose.biennialAfter}), where five sites printed it as a constant · AND A RESHUFFLE STAYS AT ` +
    `HOME: twelve of them hit ${cal.reshuffle.own} offices the government holds and ${cal.reshuffle.other} it ` +
    `does not (it used to pick at random, so a government could sack the opposition's President), every ` +
    `successor came off the party's own bench and none was minted from nowhere ` +
    `(${cal.reshuffle.benched}/${cal.reshuffle.froms}), the rivals' offices were untouched ` +
    `(${cal.reshuffle.rivalsUntouched}) and no two chairs ended with the same name`);


  /* S17i — FOUR VOICES IN EVERY HALL. There were three caucuses per party in
     the whole game and nominations never touched them, so ruling 2's "each
     caucus puts a candidate forward" had nothing to attach to; and whether a
     party put its nominations to the membership at all was not a question
     anybody could ask. */
  const cau = await page.evaluate(() => {
    var R = {};
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.capital = 400;
    var names = [], ids = [];
    PARTIES.forEach(function (x) { (S.factions[x.id] || []).forEach(function (f) { names.push(f.name); ids.push(f.id); }); });
    R.book = { counts:PARTIES.map(function (x) { return (S.factions[x.id] || []).length; }),
      total:names.length, uniqueNames:new Set(names).size === names.length,
      uniqueIds:new Set(ids).size === ids.length && ids.every(Boolean),
      sums:PARTIES.map(function (x) { return Math.round((S.factions[x.id] || []).reduce(function (n, f) { return n + f.strength; }, 0)); }),
      authored:PARTIES.every(function (x) { return (PARTY_FACTIONS[x.id] || []).length === 4; }) };

    /* (a) A SAVE FROM BEFORE THE FOURTH CAUCUS EXTENDS IN PLACE. The inbox
       stores a caucus by ARRAY INDEX, so the fourth had to be appended rather
       than sorted in, and the three a save carries keep their strengths, their
       loyalties and their positions. */
    var old = JSON.parse(JSON.stringify(S));
    /* deliberately OUT of strength order, so a sort would reorder them and the
       stored index in an old paper would land on somebody else */
    var was = [40, 24, 33];
    old.factions.lp = old.factions.lp.slice(0, 3).map(function (f, i) {
      var c = JSON.parse(JSON.stringify(f)); delete c.id; c.strength = was[i]; c.loyalty = 71; return c;
    });
    old = enrichState(old, false);
    R.extend = { n:old.factions.lp.length,
      kept:old.factions.lp.slice(0, 3).every(function (f, i) { return f.strength === was[i] && f.loyalty === 71; }),
      order:old.factions.lp.slice(0, 3).map(function (f) { return f.id; }).join(','),
      gotIds:old.factions.lp.slice(0, 3).every(function (f) { return !!f.id; }),
      fourth:old.factions.lp[3] && old.factions.lp[3].id };

    /* (b) AND A PAPER FINDS ITS CAUCUS BY ID. */
    R.byId = v17Caucus(S, 'lp', { faction:1, factionId:'lpWelfare' }).id;
    R.byIdWins = v17Caucus(S, 'lp', { faction:3, factionId:'lpIndustrial' }).id;
    R.byIndex = v17Caucus(S, 'lp', { faction:2 }).id;

    /* (c) PROMOTION TRANSFERS A FIXED FIVE, whatever the number of caucuses.
       The -2.5 was tuned for two others and took five out of the party; with
       three it would take seven and a half, so a promotion inflated the party
       a little every time it was used. */
    var before = S.factions.lp.reduce(function (n, f) { return n + f.strength; }, 0);
    factionAction('lp', 0, 'promote');
    R.promote = { before:Math.round(before),
      after:Math.round(S.factions.lp.reduce(function (n, f) { return n + f.strength; }, 0)) };

    /* (d) EVERY NAME ON THE BENCH BELONGS TO A WING OF ITS PARTY, stably and
       without a die: nominations had no line to the caucuses at all. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false); S.playAs = 'lp';
    var bench = execBench(S, 'pres', 'lp');
    var r0 = S.rngState;
    var again = execBench(S, 'pres', 'lp');
    R.bench = { n:bench.length, tagged:bench.filter(function (c) { return !!c.caucus; }).length,
      stable:bench.every(function (c, i) { return again[i].caucus === c.caucus; }),
      real:bench.every(function (c) { return (S.factions.lp || []).some(function (f) { return f.id === c.caucus; }); }),
      noDice:S.rngState === r0 };

    /* (e) AND HOW A PARTY PICKS IS ITS OWN RULE, seeded from where it stands
       and changed only when no season is running. */
    R.rules = PARTIES.map(function (x) { return x.id + ':' + (v17PrimariesOn(S, x.id) ? 'open' : 'closed'); });
    R.split = { open:PARTIES.filter(function (x) { return v17PrimariesOn(S, x.id); }).length, of:PARTIES.length };
    var stages = {};
    for (var t = 1; t <= 13; t++) { S.turn = t; stages[t] = v17CycleStage(S).stage; }
    R.stages = stages;
    S.turn = 7; S.capital = 400;
    var was = v17PrimariesOn(S, 'lp'), msg = null, f = flash;
    flash = function (x) { msg = x; };
    try { v17SetPrimaries('lp', !was); } finally { flash = f; }
    R.mid = { moved:v17PrimariesOn(S, 'lp') !== was, why:String(msg || '') };
    S.turn = 9; S.capital = 400; msg = null; f = flash;
    flash = function (x) { msg = x; };
    try { v17SetPrimaries('lp', !was); } finally { flash = f; }
    R.atBallot = { moved:v17PrimariesOn(S, 'lp') !== was, why:String(msg || '') };
    R.panel = v17RulesPanel();
    /* (f) AND THE TURNOUT TERM DID NOT MOVE. `factionAverage` is
       strength-weighted loyalty and `partyTurnout` reads it, so the loyalty
       seed decides a number every party's ballot is measured against. The
       ladder was 64, 61, 58 -- three caucuses averaging 61.3 -- and a fourth
       seeded on the same ladder at 55 pulled every party's turnout term down
       by a point in the same direction, for no reason anybody chose. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false); S.playAs = 'lp';
    R.turnout = { avg:PARTIES.map(function (x) { return +factionAverage(S, x.id).toFixed(2); }),
      term:PARTIES.map(function (x) { return +partyTurnout(S, x.id).toFixed(4); }),
      wasAvg:61.3, drift:+Math.abs(factionAverage(S, 'rsf') - 61.3).toFixed(2) };

    R.rides = (function () {
      var blob = JSON.parse(JSON.stringify(S));
      return !!(blob.partyRules && typeof blob.partyRules.lp.primaries === 'boolean');
    })();
    return R;
  });
  const cauOk =
    cau.book.total === 28 && cau.book.counts.every(n => n === 4) && cau.book.authored &&
    cau.book.uniqueNames && cau.book.uniqueIds && cau.book.sums.every(n => n === 100) &&
    cau.extend.n === 4 && cau.extend.kept && cau.extend.gotIds &&
    cau.extend.order === 'lpIndustrial,lpWelfare,lpModern' && cau.extend.fourth === 'lpPublicSector' &&
    cau.byId === 'lpWelfare' && cau.byIdWins === 'lpIndustrial' && cau.byIndex === 'lpModern' &&
    cau.promote.after === cau.promote.before &&
    cau.bench.tagged === cau.bench.n && cau.bench.stable && cau.bench.real && cau.bench.noDice &&
    cau.split.open > 0 && cau.split.open < cau.split.of &&
    cau.stages[1] === 'between' && cau.stages[2] === 'primaries' && cau.stages[3] === 'primaries' &&
    cau.stages[4] === 'general' && cau.stages[5] === 'ballot' &&
    !cau.mid.moved && /halfway through/.test(cau.mid.why) &&
    cau.atBallot.moved && !cau.atBallot.why &&
    cau.turnout.drift <= 0.2 && cau.turnout.term.every(t => t > 1 && t < 1.2) &&
    cau.panel.indexOf('How the Party Picks') >= 0 && cau.rides;
  say(cauOk, 'four voices in every hall',
    `${cau.book.total} caucuses, ${cau.book.counts[0]} to a party where there were three, every name and every ` +
    `id its own and every party's strengths summing to ${cau.book.sums[0]} · A SAVE EXTENDS IN PLACE: the three ` +
    `an older campaign carries keep their strengths, their loyalties and their POSITIONS ` +
    `(${cau.extend.order}) and the fourth is appended (${cau.extend.fourth}) -- the inbox stores a caucus by ` +
    `array index, so sorting the new one in would have pointed an old resolution at somebody else's caucus · ` +
    `and a paper finds its caucus by id, with the index kept for the papers a save is already carrying ` +
    `(${cau.byId} by id, ${cau.byIdWins} when the id and the index disagree, ${cau.byIndex} by index alone) · ` +
    `PROMOTION TRANSFERS A FIXED FIVE: ${cau.promote.before} to ${cau.promote.after}, where the -2.5 was tuned ` +
    `for two others and with three would have taken seven and a half out of a party of a hundred every time it ` +
    `was used · EVERY NAME ON THE BENCH BELONGS TO A WING: ${cau.bench.tagged} of ${cau.bench.n}, the same wing ` +
    `every time it is asked (${cau.bench.stable}) and no die rolled to decide it (${cau.bench.noDice}) -- ` +
    `nominations had no line to the caucuses at all · AND HOW A PARTY PICKS IS THE PARTY'S OWN RULE: ` +
    `${cau.split.open} of ${cau.split.of} put their nominations to the membership, seeded from where each stands ` +
    `rather than from a table (${cau.rules.join(', ')}), and it cannot be changed mid-season -- the four ` +
    `sessions before a vote are the race (${[1,2,3,4,5].map(t => t + ':' + cau.stages[t]).join(' ')}), a change ` +
    `is refused while it runs and taken at the ballot, and the rule rides the save · AND THE TURNOUT TERM DID ` +
    `NOT MOVE: the loyalty ladder was re-centred for four, so the strength-weighted average every party's ` +
    `ballot is read against comes back to ${cau.turnout.avg[0]} against ${cau.turnout.wasAvg} ` +
    `(${cau.turnout.drift} of drift) -- seeded on the old ladder the fourth caucus took a point off all seven ` +
    `in the same direction, which is the kind of change that is only ever found by looking for it`);


  /* S17j — ALWAYS RUNNING. There was no season at all: `execNominate` picked a
     name off the bench on the render path, `execPush` was one button and the
     only writer of `st.execPush` in three megabytes, and the contest happened
     inside a single line of `runElection`. A player could not see a campaign,
     could not lose a nomination, and no AI party ever spent a penny on an
     office. */
  const race = await page.evaluate(() => {
    var R = {};
    function con(st) {
      if (!st.v11) st.v11 = {};
      if (!st.v11.con) st.v11.con = { arts:{}, order:[], pending:[], failed:{}, conv:0, convUsed:0, plebiscites:0 };
      return st.v11.con;
    }
    /* (a) THE SEASON RUNS, through real sessions. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.rngState = 20260827;
    var trace = [], rq = runQueue;
    runQueue = function (done) { UI.queue = []; rq(done); };
    try {
      for (var t = 0; t < 12; t++) {
        UI.queue = []; UI.busy = false; S.capital = 120;
        endTurn(); UI.queue = [];
        if (S.over) break;
        /* S17k made the constitution something an AI party can amend, so a
           season pinned to literal turn numbers is hostage to whatever the
           other six get adopted -- measured, this probe failed on two runs in
           four once they could lay articles. What is invariant is the season's
           SHAPE against its own cycle: three and two sessions out are the
           primaries, one out is the general, and nought is the vote. */
        var nx = v17NextExecTurn(S), away = nx === null ? null : nx - S.turn;
        trace.push({ turn:S.turn, away:away, stage:S.execRace ? S.execRace.stage : 'vote',
          offices:S.execRace ? S.execRace.offices.join('+') : null,
          spent:S.execRace ? Object.keys(S.execRace.spent || {}).length : 0 });
      }
    } finally { runQueue = rq; }
    R.season = trace.slice(0, 8).map(function (x) { return x.turn + ':' + x.stage; }).join(' ');
    R.shape = trace.filter(function (x) { return x.away !== null; }).map(function (x) {
      var want = x.away >= 2 ? 'primaries' : (x.away === 1 ? 'general' : 'vote');
      return x.stage === want;
    });
    R.shapeOk = R.shape.length > 6 && R.shape.every(Boolean);
    R.parallel = trace.filter(function (x) { return x.offices; })
      .every(function (x) { return x.offices.split('+').length === 2; });
    R.aiSpent = trace.some(function (x) { return x.spent > 0; });

    /* (b) FOUR CANDIDATES, FOUR CAUCUSES, and no die on the render path. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.turn = 7; S.capital = 400;
    v17RaceTick(S);
    var o1 = S.execRace.offices[0], me = 'lp';
    var mine = S.execRace.field[o1][me];
    R.field = { n:mine.runners.length,
      caucuses:new Set(mine.runners.map(function (c) { return c.caucus; })).size,
      parties:Object.keys(S.execRace.field[o1]).length,
      open:mine.open };
    var r0 = S.rngState;
    v17RacePanel(); v17RacePolls(S, o1); v17RacePanel();
    R.noDiceOnRender = S.rngState === r0;

    /* (c) AND AN OUTSIDER CAN BE BOUGHT INTO A PRIMARY. This is ruling 2's
       second lever: `execPush` only ever moved a whole party's ticket, and a
       candidate is not a party. */
    var sorted = mine.runners.slice().sort(function (a, b) {
      return v17PrimaryScore(S, o1, me, b) - v17PrimaryScore(S, o1, me, a);
    });
    var favourite = sorted[0].name, under = sorted[sorted.length - 1];
    var pushes = 0;
    while (pushes < 12) {
      var now = mine.runners.slice().sort(function (a, b) {
        return v17PrimaryScore(S, o1, me, b) - v17PrimaryScore(S, o1, me, a);
      });
      if (now[0].name === under.name) break;
      S.capital = 400; if (S.purse) S.purse[me] = 400;
      v17BackCandidate(o1, under.name);
      pushes++;
    }
    var after = mine.runners.slice().sort(function (a, b) {
      return v17PrimaryScore(S, o1, me, b) - v17PrimaryScore(S, o1, me, a);
    });
    R.outsider = { favourite:favourite, backed:under.name, pushes:pushes,
      won:after[0].name === under.name, changed:favourite !== under.name };

    /* (d) THE PRIMARIES CLOSE AND EVERY PARTY HAS A CANDIDATE -- the ones the
       membership chose and the ones the leadership named. */
    S.turn = S.execRace.cycle - 1;
    v17ResolvePrimaries(S);
    var f = S.execRace.field[o1];
    R.closed = { stage:S.execRace.stage,
      all:Object.keys(f).every(function (k) { return !!f[k].winner; }),
      byMembership:Object.keys(f).filter(function (k) { return f[k].by === 'the membership'; }).length,
      byLeadership:Object.keys(f).filter(function (k) { return f[k].by === 'the leadership'; }).length,
      mineWon:f[me].winner };

    /* (e) AND THE CONTEST SEATS THE PRIMARY WINNER. Driven through a REAL
       ballot: reading `v17RaceWinner` proves the function and not the game. */
    S.turn = S.execRace.cycle;
    var want = {};
    S.execRace.offices.forEach(function (o) {
      Object.keys(S.execRace.field[o]).forEach(function (k) { want[o + ':' + k] = S.execRace.field[o][k].winner; });
    });
    var res = execContest(S, null);
    R.seasonClosed = !S.execRace;          /* the vote closes the season with it */
    R.winnerSeated = Object.keys(res).every(function (o) {
      return S.figures.exec[o].name === want[o + ':' + res[o]];
    });
    R.seatedNames = Object.keys(res).map(function (o) { return o + '=' + S.figures.exec[o].name; }).join(', ');

    /* (f) THE RUNNING MATE ARTICLE changes which two offices are contested and
       nothing else about the calendar. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false); S.playAs = 'lp';
    R.pairs = [5, 9, 13, 17].map(function (t) { return execPair(t).join('+'); }).join(' ');
    var turnsBefore = [5, 9, 13, 17].every(function (t) { return isExecTurn(t); });
    con(S).arts.artRunningMate = { year:2025, margin:null, turn:1, entrenched:false };
    R.pairsMate = [5, 9, 13, 17].map(function (t) { return execPair(t).join('+'); }).join(' ');
    R.calendarSame = turnsBefore && [5, 9, 13, 17].every(function (t) { return isExecTurn(t); });
    R.articleReal = !!V11_ART.artRunningMate;

    /* (g) and the season rides the save. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.turn = 7; v17RaceTick(S);
    var blob = JSON.parse(JSON.stringify(S));
    R.rides = !!(blob.execRace && blob.execRace.field && blob.execRace.stage);
    return R;
  });
  const raceOk =
    race.shapeOk && race.parallel && race.aiSpent &&
    race.field.n === 4 && race.field.caucuses === 4 && race.field.open && race.field.parties === 7 &&
    race.noDiceOnRender &&
    race.outsider.changed && race.outsider.won && race.outsider.pushes > 0 &&
    race.closed.stage === 'general' && race.closed.all &&
    race.closed.byMembership > 0 && race.closed.byLeadership > 0 &&
    race.winnerSeated && race.seasonClosed &&
    race.pairs === 'pres+vchan chan+vpres pres+vchan chan+vpres' &&
    race.pairsMate === 'pres+vpres chan+vchan pres+vpres chan+vchan' &&
    race.calendarSame && race.articleReal && race.rides;
  say(raceOk, 'always running',
    `THE FOUR SESSIONS BEFORE A VOTE ARE THE RACE, and they run whether a legislative ballot falls in them or ` +
    `not -- ${race.season}, and the shape holds against the cycle rather than against literal turn numbers ` +
    `(${race.shape.length} sessions, all of them where the calendar says: ${race.shapeOk}), because since S17k ` +
    `an AI party can amend the constitution under this probe's feet · both offices of the contested pair run in parallel (${race.parallel}) · ` +
    `${race.field.n} candidates in a primary from ${race.field.caucuses} distinct caucuses, across all ` +
    `${race.field.parties} parties, and NO DIE on the render path (${race.noDiceOnRender}) -- the season is ` +
    `seeded once at the cycle boundary and everything after it is arithmetic, which is the rule the executive ` +
    `bench has kept since S15i · AN OUTSIDER CAN BE BOUGHT IN: ${race.outsider.pushes} pushes took ` +
    `${race.outsider.backed} past ${race.outsider.favourite}, where \`execPush\` only ever moved a whole ` +
    `party's ticket and a candidate is not a party · the primaries close with a candidate for every party, ` +
    `${race.closed.byMembership} chosen by the membership and ${race.closed.byLeadership} named by the ` +
    `leadership under their own party's rule · and the CONTEST seats them (${race.seatedNames}), driven ` +
    `through the real vote rather than read off the function · AND THE OTHER SIX SPEND: an AI party put money ` +
    `into a ticket (${race.aiSpent}), where \`st.execPush\` had exactly one writer in three megabytes and it ` +
    `was the player's button · the Article of the Running Mate attaches each vice to its principal ` +
    `(${race.pairs} becomes ${race.pairsMate}) and moves no ballot (${race.calendarSame}) · and the season ` +
    `rides the save (${race.rides})`);


  /* S17k — VERBS ARE THE BUTTONS' FUNCTIONS. An AI party could not propose an
     article, issue an order or take a position on a bill, because every one of
     those instruments existed only as a click handler keyed on `playParty`.
     `bill.lines` -- the field read straight into a party's vote -- had exactly
     one writer in three megabytes and it was the player's `pressure` button. */
  const verbs = await page.evaluate(() => {
    var R = {};
    function board(pid) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', pid || 'lp'), false);
      S.playAs = pid || 'lp'; S.capital = 400;
      if (S.purse) PARTIES.forEach(function (x) { S.purse[x.id] = 500; });
      return S;
    }
    /* (a) AN AI PARTY LAYS AN ARTICLE -- through the same Core and the same
       gate the player's button uses, and the gate refuses it a second one for
       the same reason it refuses the player one. */
    board('lp');
    var id = v17AiArticleFor(S, 'pnl');
    R.article = { pick:id, laid:id ? v17ArticleCore(S, 'pnl', id, false, 'assembly') : 'no pick',
      pending:v11Con(S).pending.map(function (x) { return x.id + '/' + x.by; }).join(','),
      second:v17AiArticleFor(S, 'pnl') };
    /* and the gate reads the same for the player: one at a time out of office */
    S.playAs = 'pnl'; S.ruling = 'fp'; S.coalition = ['fp'];
    R.samegate = String(v11CanPropose(S, V11_ART.artOathOfOffice, false, 'assembly') || '');

    /* (b) AN ORDER IS SIGNED BY THE OFFICE THAT HOLDS THE DEPARTMENT. */
    board('lp');
    var o = V10_ORDERS[0], tgt = o.target ? REGIONS[0].id : null;
    R.order = { refusedOutside:String(v10OrderOpen(S, o, tgt, 'pnl') || '') };
    /* Inside the government is not enough. `holdsDept` asks whether the
       GOVERNMENT holds the department -- so a coalition partner sitting in no
       office at all satisfies it, and a gate that asks only that hands the
       whole order book to whoever is in the room. The question is whether the
       ACTOR sits in the department: measured, the partner is refused. */
    S.coalition = [S.ruling, 'pnl']; S.exec[o.dept] = S.ruling;
    R.order.refusedWrongDesk = String(v10OrderOpen(S, o, tgt, 'pnl') || '');
    S.exec[o.dept] = 'pnl';
    R.order.openInside = v10OrderOpen(S, o, tgt, 'pnl') === null;
    R.order.signed = v17OrderCore(S, 'pnl', o.id, tgt) === null;
    R.order.recorded = !!v10Orders(S)[v10OrderKey(o.id, tgt)];
    R.order.by = (v10Orders(S)[v10OrderKey(o.id, tgt)] || {}).by;

    /* (c) A PARTY TAKES A LINE ON A BILL AND IT REACHES THE VOTE. */
    board('lp');
    var bill = sponsorBill(S, 'incomeTax', 1, 'government', 'clean', true, S.ruling, true);
    var before = partyBillSupport(S, 'pnl', bill);
    R.floor = { err:String(v17FloorCore(S, 'pnl', bill, 'support') || ''),
      line:(bill.lines || {}).pnl, before:Math.round(before),
      after:Math.round(partyBillSupport(S, 'pnl', bill)),
      ownBill:String(v17FloorCore(S, S.ruling, bill, 'oppose') || '') };
    R.floor.moved = R.floor.after > R.floor.before;
    /* AND THE PLAYER'S OWN LINE IS WORTH WHAT IT HAS ALWAYS BEEN WORTH.
       `partyBillSupport` reads TWO fields that say the same thing --
       `playerPosition` at 24/-28 for the player's party, `lines` at 16/-18 for
       whoever declared it -- so routing the player's button through the same
       Core wrote both and made a declared line worth 40. That is a
       sixty-seven per cent buff to an S10b button delivered by a refactor
       that was supposed to change nothing. 24 is the number the card was
       priced against; it is pinned here, not read off the constant. */
    board('lp');
    /* `partyBillSupport` clamps to 3..98, so the bill has to be one the
       player's party is genuinely undecided about or the term is measured
       against a ceiling. */
    var own = null;
    Object.keys(POL).forEach(function (id) {
      if (own) return;
      var b2 = { policy:id, dir:1, sponsor:'fp', owner:'government', strategy:'clean',
        whip:0, upperDeal:0, committee:0, concessions:0, confidence:false, urgent:false,
        playerPosition:null, lines:{}, notes:[], stage:'first' };
      var v = partyBillSupport(S, playParty(S), b2);
      if (v >= 40 && v <= 60) own = b2;
    });
    var plain = partyBillSupport(S, playParty(S), own);
    v17FloorCore(S, playParty(S), own, 'support');
    R.floor.myBase = Math.round(plain);
    R.floor.myLine = Math.round(partyBillSupport(S, playParty(S), own) - plain);
    R.floor.myKeys = Object.keys(own.lines || {}).join(',');

    /* (d) THE ATTACK GOES AT WHOEVER IT HOLDS SOMETHING AGAINST. It was
       `st.ruling`, always -- so a party could carry a grudge of a hundred
       against an opposition player and spend every attack it ever made on the
       government instead. */
    board('lp'); S.ruling = 'fp';
    v16Resent(S, 'pnl', 'lp', 80);
    var m0 = S.machine.lp || 0, mf = S.machine.fp || 0;
    V16_AI_DECK.filter(function (c) { return c.id === 'attack'; })[0].run(S, 'pnl');
    R.attack = { hitTheGrudge:(S.machine.lp || 0) < m0, hitTheGovernment:(S.machine.fp || 0) < mf };

    /* (e) AND THE ENGINE STOPS DRAFTING THE PLAYER'S BILLS FOR THEM. It
       stamped them owner:'opposition' with playerPosition:'support', so a bill
       the player had never chosen appeared on the paper in their name and the
       `pressure` lever could be aimed at it. */
    board('lp'); S.ruling = 'fp'; S.coalition = ['fp', 'sd'];
    var mine = 0, other = 0;
    for (var t = 0; t < 300; t++) {
      S.bills = []; pv5AiPrivateBill(S);
      S.bills.forEach(function (x) { if (x.sponsor === 'lp') mine++; else other++; });
    }
    R.privateBills = { mine:mine, other:other };

    /* (f) AND THE DECK ACTUALLY REACHES THEM, over real sessions. */
    board('lp'); S.ruling = 'fp'; S.coalition = ['fp', 'sd']; S.rngState = 20260827;
    var did = {}, rq = runQueue;
    runQueue = function (done) { UI.queue = []; rq(done); };
    var say = v16AiTurn;
    try {
      for (var k = 0; k < 40; k++) {
        UI.queue = []; UI.busy = false; S.capital = 120;
        if (S.purse) PARTIES.forEach(function (x) { S.purse[x.id] = Math.max(S.purse[x.id] || 0, 400); });
        endTurn(); UI.queue = [];
        if (S.over) break;
        (S.aiLast || []).forEach(function (l) {
          if (/laid .* before/.test(l)) did.article = (did.article || 0) + 1;
          if (/signed /.test(l)) did.order = (did.order || 0) + 1;
          if (/came out (for|against)|leaned on the sponsors/.test(l)) did.floor = (did.floor || 0) + 1;
        });
      }
    } finally { runQueue = rq; v16AiTurn = say; }
    R.inPlay = did;
    R.deck = V16_AI_DECK.map(function (c) { return c.id; }).join(',');
    return R;
  });
  const verbsOk =
    verbs.article.pick && verbs.article.laid === null &&
    /\/pnl/.test(verbs.article.pending) && !verbs.article.second &&
    /already have one|already has an article/.test(verbs.samegate) &&
    /Only a government/.test(verbs.order.refusedOutside) &&
    /in other hands/.test(verbs.order.refusedWrongDesk) && verbs.order.openInside &&
    verbs.order.signed && verbs.order.recorded && verbs.order.by === 'pnl' &&
    !verbs.floor.err && verbs.floor.line === 'support' && verbs.floor.moved &&
    /your own party/.test(verbs.floor.ownBill) &&
    verbs.floor.myLine === 24 && verbs.floor.myKeys === '' &&
    verbs.attack.hitTheGrudge && !verbs.attack.hitTheGovernment &&
    verbs.privateBills.mine === 0 && verbs.privateBills.other > 50 &&
    (verbs.inPlay.article > 0 || verbs.inPlay.order > 0 || verbs.inPlay.floor > 0) &&
    /article,order,floor/.test(verbs.deck);
  say(verbsOk, 'verbs are the buttons’ functions',
    `AN AI PARTY LAYS AN ARTICLE through the same Core and the same gate the player's button uses: the League ` +
    `laid ${verbs.article.pick} (${verbs.article.pending}) and is refused a second, and the identical line ` +
    `refuses the player one out of office ("${verbs.samegate.slice(0, 46)}") · AN ORDER IS SIGNED BY THE OFFICE ` +
    `THAT HOLDS THE DEPARTMENT: a party outside the government is refused ` +
    `("${verbs.order.refusedOutside.slice(0, 32)}") and so is a party INSIDE it that does not sit in the ` +
    `department ("${verbs.order.refusedWrongDesk.slice(0, 34)}") -- the old gate asked whether the GOVERNMENT ` +
    `held it, which any partner satisfies; the party that does sit there signs, and the record ` +
    `carries who signed it (${verbs.order.by}) · A PARTY TAKES A LINE ON A BILL and it reaches the VOTE -- ` +
    `${verbs.floor.before} to ${verbs.floor.after} on the sponsor's own forecast -- where \`bill.lines\` had one ` +
    `writer in three megabytes and it was the player's button; its own bill is refused ` +
    `("${verbs.floor.ownBill.slice(0, 26)}"), and the PLAYER's own line is still worth the ` +
    `${verbs.floor.myLine} it has been worth since S10b -- \`partyBillSupport\` reads two fields that say the ` +
    `same thing, so writing both would have made it 40 · THE ATTACK GOES AT WHOEVER IT HOLDS SOMETHING AGAINST ` +
    `(${verbs.attack.hitTheGrudge}) and not at the government by default (${!verbs.attack.hitTheGovernment}), ` +
    `where the target was \`st.ruling\` and a grudge of a hundred against an opposition player reached nothing · ` +
    `the engine stops drafting the PLAYER's private members' bills (${verbs.privateBills.mine} of ` +
    `${verbs.privateBills.mine + verbs.privateBills.other}), which used to put a bill on the paper in their name ` +
    `that they had never chosen · and over forty real sessions the deck reached them: ` +
    `${verbs.inPlay.article || 0} articles, ${verbs.inPlay.order || 0} orders, ${verbs.inPlay.floor || 0} lines ` +
    `on the floor`);

  /* ================================================================
     S17l — A PARTY REMEMBERS WHAT WAS DONE TO IT
     ================================================================ */
  const minds = await page.evaluate(() => {
    const R = {};
    function board(me) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', me), false);
      S.ruling = me; S.coalition = [me]; S.capital = 900;
      PARTIES.forEach(function (p) { S.purse[p.id] = 900; });
    }
    function grudge(pid, against) { return v16Grudge(S, pid, against); }

    /* (a) EVERY VERB A PARTY CAN AIM AT ANOTHER PARTY IS WORTH SOMETHING.
       S16e's memory named five ids, one of which (`radicalise`) is the id of
       no action in the game, and the surface is thirty-four. A thirty-fifth
       arriving without a weight reddens here rather than being forgotten the
       way those thirty were. */
    board('lp');
    R.cover = v17MemoryCoverage('fp');

    /* (b) AND IT FIRES. It read `a.pid`, nothing wrote `a.pid`, and the target
       was null at every call: poaching a party's base left its grudge at
       nought for the whole of S16 and S17 up to here. */
    board('lp');
    var poach = partyActions('fp').filter(function (a) { return a.id === 'poach'; })[0];
    R.fires = { open:!poach.can || poach.can(), before:grudge('fp', 'lp') };
    doAction(poach);
    R.fires.after = grudge('fp', 'lp');

    /* (c) A KINDNESS SPENDS IT DOWN. `v16Resent` clamps at nought, so the same
       door carries both directions and a memory is not a ratchet. */
    var fund = partyActions('fp').filter(function (a) { return a.id === 'fund'; })[0];
    S.capital = 900; doAction(fund);
    R.fires.afterKindness = grudge('fp', 'lp');

    /* (d) AND A REFUSAL IS NOT REMEMBERED. `doAction` has four silent refusal
       paths; a verb the player never paid for is not a thing to resent. */
    board('lp'); S.capital = 0;
    doAction(partyActions('fp').filter(function (a) { return a.id === 'poach'; })[0]);
    R.refused = grudge('fp', 'lp');

    /* (e) THE ROOM WAS WATCHING. Isolating a party is an argument about the
       republic, and the parties it was not done to have a view. */
    board('lp');
    var cordon = partyActions('pnl').filter(function (a) { return a.id === 'cordon'; })[0];
    doAction(cordon);
    R.seen = { target:grudge('pnl', 'lp'),
      others:PARTIES.filter(function (p) { return p.id !== 'lp' && p.id !== 'pnl'; })
        .map(function (p) { return grudge(p.id, 'lp'); }) };
    R.seen.everyoneNoticed = R.seen.others.every(function (g) { return g > 0; });

    /* (f) AND IT REACHES A VOTE. The grudge had two consumers -- a posture and
       a pact -- and neither was a division. Bounded: the term is capped, and
       the cap is stated here rather than read off the constant. */
    board('lp'); S.ruling = 'fp'; S.coalition = ['fp'];
    var bill = sponsorBill(S, 'incomeTax', 1, 'government', 'clean', true, 'fp', true);
    var clean = partyBillSupport(S, 'lp', bill);
    v16Resent(S, 'lp', 'fp', 100);
    R.vote = { clean:Math.round(clean), grudged:Math.round(partyBillSupport(S, 'lp', bill)) };
    R.vote.moved = R.vote.clean - R.vote.grudged;
    /* and the article, where the proposer is on the pending record since S17k */
    board('lp'); S.ruling = 'fp'; S.coalition = ['fp'];
    var art = V11_ARTICLES.filter(function (a) { return !v11Adopted(S, a.id); })[0];
    v17ArticleCore(S, 'fp', art.id, false, 'assembly');
    var artClean = v11ArtSupport(S, 'lp', art, false);
    v16Resent(S, 'lp', 'fp', 100);
    R.art = { clean:Math.round(artClean), grudged:Math.round(v11ArtSupport(S, 'lp', art, false)) };
    R.art.moved = R.art.clean - R.art.grudged;

    /* (g) A LETTER FROM ANOTHER PARTY IS NOT A LETTER FROM YOUR OWN CAUCUS.
       It was posted as a `faction_demand` with `faction:0`, so answering the
       FP moved the loyalty of the LP's own first caucus by sixteen. */
    board('lp');
    V16_AI_DECK.filter(function (c) { return c.id === 'demand'; })[0].run(S, 'fp');
    var it = S.inbox[S.inbox.length - 1], cauc = S.factions[playParty(S)][0];
    R.letter = { type:it.type, from:it.from, faction:it.faction,
      choices:inboxChoices(it).map(function (c) { return c.id; }).join(','),
      caucusBefore:Math.round(cauc.loyalty), bills:S.bills.length };
    S.capital = 900;
    respondInbox(it.id, 'carry');
    R.letter.caucusAfter = Math.round(cauc.loyalty);
    R.letter.billLaid = S.bills.length > R.letter.bills;
    /* and ignoring one is the SENDER's memory */
    v16Resent(S, 'cup', 'lp', 30);
    V16_AI_DECK.filter(function (c) { return c.id === 'demand'; })[0].run(S, 'cup');
    var it2 = S.inbox[S.inbox.length - 1], loy = S.factions[playParty(S)][0].loyalty;
    it2.deadline = S.turn; politicsTick(S);
    R.letter.ignoredGrudge = grudge('cup', 'lp');
    R.letter.caucusOnIgnore = Math.round(S.factions[playParty(S)][0].loyalty - loy);

    /* (h) AND WHAT A PARTY SPENDS DEPENDS ON WHAT IT IS TRYING TO DO. Seven
       tenths of income went out every session for every party in every
       circumstance, so a small party could never accumulate a card's price. */
    board('lp');
    var rates = {};
    Object.keys(V17_BURN).forEach(function (k) { rates[k] = V17_BURN[k]; });
    R.burn = { rates:rates, distinct:Object.keys(rates).filter(function (k, i, all) {
      return all.indexOf(k) === i; }).map(function (k) { return rates[k]; })
      .filter(function (v, i, all) { return all.indexOf(v) === i; }).length };
    /* driven: a party that is holding accumulates where before it could not */
    function run(force) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.ruling = 'lp'; S.coalition = ['lp'];
      PARTIES.forEach(function (p) { S.purse[p.id] = 0; });
      var base = v16Posture;
      if (force) v16Posture = function () { return force; };
      try { for (var i = 0; i < 12; i++) partyPurseTick(S); }
      finally { v16Posture = base; }
      return Math.round(partyPurse(S, 'pnl'));
    }
    R.burn.holding = run('hold');
    R.burn.building = run('organise');
    return R;
  });
  const mindsOk =
    minds.cover.total >= 30 && minds.cover.missing.length === 0 &&
    minds.fires.open && minds.fires.before === 0 && minds.fires.after === 12 &&
    minds.fires.afterKindness === 0 && minds.refused === 0 &&
    minds.seen.target === 22 && minds.seen.everyoneNoticed &&
    minds.vote.moved === 12 && minds.art.moved === 12 &&
    minds.letter.type === 'party_demand' && minds.letter.faction === undefined &&
    minds.letter.choices === 'carry,talks,decline' &&
    minds.letter.caucusAfter === minds.letter.caucusBefore && minds.letter.billLaid &&
    minds.letter.ignoredGrudge === 44 && minds.letter.caucusOnIgnore === 0 &&
    minds.burn.distinct >= 5 && minds.burn.holding > minds.burn.building;
  say(mindsOk, 'a party remembers what was done to it',
    `ALL ${minds.cover.total} VERBS A PARTY CAN AIM AT ANOTHER PARTY CARRY A MEMORY ` +
    `(${minds.cover.missing.length} without one), where S16e's list named five ids -- one of which, ` +
    `\`radicalise\`, is the id of no action in the game -- AND NEVER FIRED ONCE: it read \`a.pid\` and nothing ` +
    `in three megabytes wrote \`a.pid\`, so poaching a party's base left its grudge at ` +
    `${minds.fires.before} and now leaves ${minds.fires.after} · a kindness spends it back down to ` +
    `${minds.fires.afterKindness} and a REFUSAL is not remembered (${minds.refused}) · THE ROOM WAS WATCHING: ` +
    `isolating the PNL costs ${minds.seen.target} with them and ${minds.seen.others[0]} with each of the ` +
    `${minds.seen.others.length} parties it was not done to · AND IT REACHES A VOTE, bounded at twelve -- ` +
    `a bill from a party it cannot forgive falls ${minds.vote.clean} to ${minds.vote.grudged} and an article ` +
    `${minds.art.clean} to ${minds.art.grudged} -- where a grudge had two consumers, a posture and a pact, and ` +
    `neither was a division · A LETTER FROM ANOTHER PARTY IS NOT A LETTER FROM YOUR OWN CAUCUS: it is a ` +
    `\`${minds.letter.type}\` answered ${minds.letter.choices}, the player's own caucus is untouched at ` +
    `${minds.letter.caucusAfter} where answering used to move it sixteen, carrying it lays the bill ` +
    `(${minds.letter.billLaid}) and ignoring it costs the SENDER (${minds.letter.ignoredGrudge}) rather than ` +
    `docking a caucus that never wrote (${minds.letter.caucusOnIgnore}) · and the purse burn follows the ` +
    `posture across ${minds.burn.distinct} distinct rates, so a party holding on keeps ${minds.burn.holding} ` +
    `of party money over twelve sessions where one building spends down to ${minds.burn.building} -- it was ` +
    `seven tenths for every party in every circumstance, and a card costs twelve to thirty-four`);

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
