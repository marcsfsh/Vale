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
  /* S20d: 250/14/18/750 over a floor of 55, where this read 250/5.4/26/750
     over 150. The floor was three times what the tier's own formula produced,
     so income was the floor on every session and `capitalIncome`'s thirteen
     terms were dead; `capMult` now carries the tier's generosity and the floor
     catches the worst session in fourteen. */
  say(republic.easyCap === '250/14/18/750' && republic.easyFloor === 55 && republic.othersUnmoved,
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

    /* 4. a declared line is worth what the party declaring it is worth.
       MEASURED ON A FRESH REPUBLIC, not on the one four hundred assertions
       above have been driving. This arm claims to isolate the LINE, and
       `partyBillSupport` is 71% position: by the time the harness reaches here
       the parties' positions have drifted far enough that their support sits
       near the 3..98 clamp, and a declared line moves a saturated voter less.
       It read .120 per point of chamber against .467 on a clean board -- all
       three readings compressed by the same 3.9x, which is what saturation
       looks like and is not what a broken mechanism looks like.
       It surfaced when S21a reverted an unrelated line and the accumulated
       state shifted; measured on a defined board the shipped build and this
       one agree to three figures, so the arm was reading the harness's own
       history. `S` is swapped for a fresh one and put back. */
    const keepAll = S;
    SEED_OVERRIDE = 4242;
    S = enrichState(v6NewGame('normal', 'v6default', 'epic', me), false);
    S.aiLevel = 'ruthless'; S.rngState = 4242;
    S.ruling = me; S.coalition = [me]; S.capital = 400;
    PARTIES.forEach(p => { v16Ai(S)[p.id].grudge = {}; });
    const delta = frac => {
      setSeats(frac);
      b.playerPosition = null; const a = billForecast(S, b).lower;
      b.playerPosition = 'oppose'; const c = billForecast(S, b).lower;
      b.playerPosition = null;
      return Math.round((a - c) * 10) / 10;
    };
    out.d05 = delta(.05); out.d50 = delta(.50); out.d90 = delta(.90);
    S = keepAll;

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
  /* S20a: THE CLAIM IS PROPORTIONALITY, WHICH IS WHAT THE TITLE ALWAYS SAID.
     The old bound was `d05 < 1.5`, calibrated when the forecast was a mean of
     propensities and a declared line moved a number rather than a lobby. Now
     the division counts seats, so a party holding 5% of the chamber can swing
     at most 5 points however furious it is, and it swings 2 -- which failed a
     bound of 1.5 while being MORE correct, not less. Read as points per point
     of the chamber the three readings are .400, .396 and .397: a line is worth
     what its party is, to three figures. That is the assertion now, with the
     ordering kept beside it. */
  const perSeat = [paper.d05 / 5, paper.d50 / 50, paper.d90 / 90];
  const psLo = Math.min.apply(null, perSeat), psHi = Math.max.apply(null, perSeat);
  say(paper.d05 < paper.d50 && paper.d50 < paper.d90 && paper.d90 > 6 &&
      psLo > .15 && psHi < psLo * 1.25,
    'a line is worth what its party is',
    `opposing costs the bill ${paper.d05} at 5% of the Assembly, ${paper.d50} at 50%, ${paper.d90} at 90% ` +
    `(was a flat 8 at any size) · and it is PROPORTIONAL to the seats behind it, which is what the title ` +
    `claims: ${perSeat.map(x => x.toFixed(3)).join(', ')} points per point of the chamber, a spread of ` +
    `${(psHi / psLo).toFixed(3)}x -- a party holding 5% can swing at most 5 whatever it declares`);
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

  /* S20d: 50, not 75 -- the floor moved from 150 to 55 because at 150 it was
     not a floor but the whole answer. The claim is unchanged: on a session bad
     enough to pay almost nothing, very easy still pays, and no other tier
     does. */
  say(prose.easyWorst >= 50 && prose.otherWorst.every(v => v < 50),
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

  /* S20d: IT EARNS ITS INCOME NOW RATHER THAN BEING PAID A CONSTANT. This
     asked for exactly 150 a session, which was the floor rather than anything
     the tier produced. The bare state here is a deliberately poor one and
     lands just above the new floor of 55; a played session reads a mean of 98
     over a range of 45 to 119. And banking every point no longer fills the
     stock inside the eight sessions this loop walks, which is the other half
     of the same defect: the owner's save sat on the ceiling for 94 of 132
     sessions and threw away at least 14,100 capital. */
  say(nums.easy.capital === 250 && nums.easy.income >= 55 && nums.easy.income < 90 &&
      nums.easy.cap >= 700 && nums.wasteAt === 0 && nums.oldCeilingWasteAt <= 4,
    'very easy earns its income, and no longer fills the stock',
    `Very easy starts with ${nums.easy.capital} capital and earns ${nums.easy.income} on a deliberately poor ` +
    `session, just above its floor of 55, where this used to read exactly 150 on EVERY session because the floor ` +
    `was three times what the tier's own formula produced · banking every point no longer fills the ${nums.easy.cap} ` +
    `ceiling inside the eight sessions this walks (${nums.wasteAt}), where the owner's save sat on that ceiling for ` +
    `94 of 132 sessions and threw away at least 14,100 capital; at the old ceiling of 440 it still fills by session ` +
    `${nums.oldCeilingWasteAt}, which is why the ceiling had to move with the floor`);

  const charged = ['easy', 'gentle', 'normal', 'hard', 'brutal']
    .every((d) => Math.abs(nt[d].charged - nt[d].wanted) < .01);
  say(charged && nt.easy.charged < nt.easy.rawSpend && nt.brutal.charged > nt.brutal.rawSpend,
    'the works are charged at the tier rate',
    `every tier now charges its own d.exp for a works instalment: Very easy pays ${nt.easy.charged} for ` +
    `${nt.easy.rawSpend} of building and Very hard pays ${nt.brutal.charged} for ${nt.brutal.rawSpend} · ` +
    `the base budget has applied d.exp to every statute since v4 and the v8 wrapper added the works on ` +
    `afterwards, so the works were the one line of federal spending difficulty never touched`);

  const ten = nums.tenOnEasy;
  /* S20d: .75, not .5. The tier's fiscal swing was `rev:2 / exp:.55` -- 3.64x,
     which the audit measured as outweighing the entire tax code -- and is
     2.90x now. Ten works, the most the ministry can begin at once, are still
     affordable out of the surplus and are no longer nearly free: a programme
     that commits three quarters of a tier's surplus is a decision. */
  say(ten.sites === 10 && ten.bareNet > 0 && ten.share < .75,
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
    /* S17m: the road to the country and the power to summon a convention are
       things the document GRANTS now -- the two articles said so in their own
       text and granted nothing at all. The probes below are about what those
       roads DO once open, so each one that needs a road opens it EXPLICITLY,
       rather than the frame opening both: an article in `c0.arts` is counted
       by two of the probes here, and seeding the frame moved their arithmetic.
       That they are shut until the constitution opens them is its own
       assertion, further down. */
    const openRoad = (c0, id) => { c0.arts[id] = { laid:S.turn, by:me }; return () => { delete c0.arts[id]; }; }
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
    var shutPleb = openRoad(c, 'artPlebiscite');
    v11ProposeArticle(road, false, 'plebiscite');
    shutPleb();
    out.plebSpan = plist(c).length ? plist(c)[0].due - plist(c)[0].laid : 0;
    out.plebOn = has('v11ArtVerdict') && plist(c).length ? v11ArtVerdict(S, plist(c)[0]).on : 'the Assembly';

    /* THE PLEBISCITE UNDER A FORM WITH NO ELECTIONS. */
    c = frame();
    const shutPleb2 = openRoad(c, 'artPlebiscite');
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
    const shutConv = openRoad(c, 'artConventionClause');
    v11CallConvention();
    shutConv();
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
  /* S20d: 1.8x, not 3x. `purseMult` was 3.6 and pinned all seven party purses
     at the 2,000 ceiling in the owner's save -- a dial so large the tier's own
     AI setting had no room left to express itself -- and is 2 now. Easy is
     still the tier where every party is rich. */
  say(F.hasPurse && F.hasIncome && tier('easy').income > tier('normal').income * 1.8 &&
      tier('normal').income > tier('brutal').income &&
      tier('easy').purse > 80 && tier('brutal').purse > 0,
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
        lines:S.bills.reduce(function (n, b) { return n + Object.keys(b.lines || {}).length; }, 0),
        bills:S.bills.length
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
        /* S21b: THE DEMAND CARD HAS TWO OUTCOMES AND BOTH ARE THE CARD
           WORKING. It posted to the player's inbox whatever chair they were
           in -- so a player in opposition received letters addressed to "the
           government" -- and when an engine holds office it is now answered by
           the engine government instead: the measure is taken up (a bill
           appears) or it is refused (a grievance is written). This arm seats
           the player outside the government, so the second path is the one it
           drives, and asking only about the inbox reported the card dead. */
        : c.id === 'demand' ? (S.inbox.length > before.inbox || S.bills.length > before.bills ||
            v16Grudge(S, pid, S.ruling) > 0)
        : c.id === 'article' ? (v11Con(S).pending || []).length > before.pending
        : c.id === 'order' ? Object.keys(v10Orders(S)).length > before.orders
        : c.id === 'floor' ? S.bills.reduce(function (n, b) { return n + Object.keys(b.lines || {}).length; }, 0) > before.lines
        /* S19c: the deck's eleventh card. The chain falls through to `false`
           for a card it does not know, which is why adding one reddens here
           until somebody says what it is supposed to move -- the guard a
           per-card list can have and a count cannot. */
        : c.id === 'bill' ? S.bills.length > before.bills
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
  say(six.built && six.deck === 11 && six.cardWorks === 11 && six.cardFails.length === 0 && six.actedAll &&
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
    /* S17m: the road to the country is one the constitution opens. This clock
       is about how long the road takes, so the road is opened first. */
    c.arts.artPlebiscite = { laid:S.turn, by:S.ruling };
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
      /* S17p: a term of three needs BOTH timing articles standing, and that is
         a constitution which contradicts itself -- S17m shuts the gate against
         reaching it by play and S17p's court strikes the later of the two
         within a few sessions. Both are right, and both would end this
         probe's SUBJECT (whether the executive's calendar is the
         legislature's) before it could be measured over twenty-six sessions.
         So the constitutional docket is held out of this one run, and named
         here rather than worked around quietly. That the court does strike
         the pair is "the court can stop you", further down. */
      var docket = (typeof v17CourtTick === 'function') ? v17CourtTick : null;
      if (docket) v17CourtTick = function () {};
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
      } finally { runQueue = rq; if (docket) v17CourtTick = docket; }
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
  /* S17p: named, on the pattern "always running" got in S17o -- an assertion
     with eighteen conditions should say which one went. */
  const calWhy = {
    quadTerm:cal.quad.term === 4, quadSeen:cal.quad.seen.join() === '7,11,15',
    annual:cal.annual.term === 1 && cal.annual.seen[0] === 5,
    normalExec:cal.normal.exec.join() === '5,9,13,17,21,25',
    term3:cal.term3.term === 3, term3Exec:cal.term3.exec.join() === '5,9,13,17,21,25',
    term3Ballots:cal.term3.ballots.indexOf(5) < 0 && cal.term3.ballots.indexOf(9) < 0,
    snapOpen:cal.snapOpen, snapShut:!cal.snapShut.moved && /Fixed Term/.test(cal.snapShut.why),
    prose:!cal.prose.biennialBefore && !cal.prose.biennialAfter && cal.prose.saysFour,
    reshuffleOther:cal.reshuffle.other === 0, reshuffleOwn:cal.reshuffle.own > 0,
    minted:cal.reshuffle.minted === 0, rivals:cal.reshuffle.rivalsUntouched,
    unique:cal.reshuffle.unique
  };
  const calBad = Object.keys(calWhy).filter((k) => !calWhy[k]);
  say(calOk, 'the calendar tells the truth',
    (calBad.length ? `WHAT FAILED: ${calBad.join(', ')} · ` : '') +
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
    R.seatedWhy = Object.keys(res).map(function (o) {
      return o + ' won by ' + res[o] + ', its primary chose "' + want[o + ':' + res[o]] +
        '", seated "' + S.figures.exec[o].name + '"';
    }).join(' | ');

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
  /* S17o: NAMED, so a failure says which half of it failed. This probe drives
     twelve sessions of real play and the other six parties have been given
     more to do in every slice since it was written, so when it goes red the
     next question is always "which part" -- and reading that off a paragraph
     of prose that prints only some of the flags is slower than it needs to be. */
  const raceWhy = {
    shape:race.shapeOk, parallel:race.parallel, aiSpent:race.aiSpent,
    fieldN:race.field.n === 4, caucuses:race.field.caucuses === 4,
    open:race.field.open, parties:race.field.parties === 7,
    noDice:race.noDiceOnRender,
    outsider:race.outsider.changed && race.outsider.won && race.outsider.pushes > 0,
    closedStage:race.closed.stage === 'general', closedAll:race.closed.all,
    byMembership:race.closed.byMembership > 0, byLeadership:race.closed.byLeadership > 0,
    seated:race.winnerSeated, seasonClosed:race.seasonClosed,
    pairs:race.pairs === 'pres+vchan chan+vpres pres+vchan chan+vpres',
    pairsMate:race.pairsMate === 'pres+vpres chan+vchan pres+vpres chan+vchan',
    calendar:race.calendarSame, article:race.articleReal, rides:race.rides
  };
  const raceBad = Object.keys(raceWhy).filter((k) => !raceWhy[k]);
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
    (raceBad.length ? `WHAT FAILED: ${raceBad.join(', ')}` +
      (raceWhy.seated ? '' : ` [${race.seatedWhy}]`) + ' · ' : '') +
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
  const V21_IGNORED_LETTER_ORDER = await page.evaluate(() =>
    V21_IGNORED_LETTER > 5 && V21_IGNORED_LETTER < 13.4 && V21_IGNORED_LETTER >= V19_REACT_RISE);
  const mindsOk =
    minds.cover.total >= 30 && minds.cover.missing.length === 0 &&
    minds.fires.open && minds.fires.before === 0 && minds.fires.after === 12 &&
    minds.fires.afterKindness === 0 && minds.refused === 0 &&
    minds.seen.target === 22 && minds.seen.everyoneNoticed &&
    minds.vote.moved === 12 && minds.art.moved === 12 &&
    minds.letter.type === 'party_demand' && minds.letter.faction === undefined &&
    minds.letter.choices === 'carry,talks,decline' &&
    minds.letter.caucusAfter === minds.letter.caucusBefore && minds.letter.billLaid &&
    /* S21b: 41, WAS 44, AND THE CLAIM IS THE ORDERING RATHER THAN THE NUMBER.
       Silence used to be worth 14 against a median deliberate provocation of
       13.4 -- measured in S19f's own arm over 463 rises -- so ignoring a letter
       weighed as much as going after a party on purpose. It is 11 now: more
       than declining to their face (5, the `decline` answer below it) and less
       than an attack. The bare pin follows the constant; the ordering is what
       the assertion is about, and a build that put silence back above a real
       provocation reddens on the clause after it. */
    minds.letter.ignoredGrudge === 41 && minds.letter.caucusOnIgnore === 0 &&
    V21_IGNORED_LETTER_ORDER === true &&
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
    `docking a caucus that never wrote (${minds.letter.caucusOnIgnore}) -- S21b took what silence is worth from ` +
    `14 to 11, because 14 was the median DELIBERATE provocation this game delivers (13.4 over 463 rises) and ` +
    `ignoring a letter should cost more than declining to their face and less than an attack · and the purse burn follows the ` +
    `posture across ${minds.burn.distinct} distinct rates, so a party holding on keeps ${minds.burn.holding} ` +
    `of party money over twelve sessions where one building spends down to ${minds.burn.building} -- it was ` +
    `seven tenths for every party in every circumstance, and a card costs twelve to thirty-four`);

  /* ================================================================
     S17m — ONE TRUTH AT A TIME
     ================================================================ */
  const truth = await page.evaluate(() => {
    const R = {};
    function fresh(me) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', me || 'lp'), false);
      S.ruling = me || 'lp'; S.coalition = [S.ruling]; S.capital = 900; S.treasury = 9000;
      var c = v11Con(S); c.arts = {}; c.pending = []; c.failed = {};
      return c;
    }
    function adopt(c, id) { c.arts[id] = { laid:S.turn, by:S.ruling }; }

    /* (a) EVERY DECLARED CONFLICT NAMES A REAL CARD. A rule against an id
       that does not exist is a rule that never fires. */
    fresh('lp');
    R.unresolved = [];
    V17_CONFLICTS.forEach(function (p) {
      [p.a, p.b].forEach(function (c) {
        var ok = c.kind === 'article' ? !!V11_ART[c.id]
          : c.kind === 'act' ? ACTS.some(function (x) { return x.id === c.id; })
          : c.kind === 'policy' ? !!POL[c.id] : false;
        if (!ok) R.unresolved.push(c.kind + ':' + c.id);
      });
    });
    R.pairs = V17_CONFLICTS.length;

    /* S18d: AND THE PRIMITIVE ANSWERS EVERY KIND THE TABLE NAMES. Three
       branches of `v17InForce` were written in this slice for kinds no pair
       names -- a measure, an order, a treaty -- and a poison run took all
       three out without reddening anything, because nothing in the game could
       turn them. They came out. This is the guard a hand-kept list cannot
       have: declare a pair naming a kind the primitive cannot answer, or
       whose card it cannot name, and the assertion fails rather than the
       block quietly never firing. */
    R.kinds = [];
    R.kindGaps = [];
    V17_CONFLICTS.forEach(function (p) {
      [p.a, p.b].forEach(function (c) {
        if (R.kinds.indexOf(c.kind) < 0) R.kinds.push(c.kind);
      });
    });
    R.kinds.forEach(function (k) {
      /* a kind the primitive cannot answer reads false for everything, which
         is indistinguishable from "not in force" and is exactly how a dead
         branch hides; so ask it of a state that HOLDS the thing */
      var probe = fresh('lp'), one = V17_CONFLICTS.filter(function (p) {
        return p.a.kind === k || p.b.kind === k;
      })[0];
      var side = one.a.kind === k ? one.a : one.b;
      if (k === 'article') v11Con(S).arts[side.id] = { laid:1, by:'lp' };
      else if (k === 'policy') S.pol[side.id] = 1;
      else if (k === 'act') S.acts[side.id] = true;
      else { R.kindGaps.push(k + ': the probe cannot put it in force'); return; }
      if (!v17InForce(S, k, side.id)) R.kindGaps.push(k + ': v17InForce says no with it in force');
      if (v17CardName(k, side.id) === side.id) R.kindGaps.push(k + ': v17CardName has no card for it');
    });

    /* (b) AND EVERY PAIR REFUSES IN BOTH DIRECTIONS. A block declared one way
       round is a one-way door, which is the failure the central table exists
       to make impossible -- so the assertion asks it of both. */
    R.oneWay = [];
    V17_CONFLICTS.filter(function (p) {
      return p.a.kind === 'article' && p.b.kind === 'article';
    }).forEach(function (p) {
      [[p.a, p.b], [p.b, p.a]].forEach(function (d) {
        var art = V11_ART[d[1].id];
        /* a ghost id is caught above; do not let it throw the whole probe and
           turn a plain finding into a harness crash */
        if (!art || !V11_ART[d[0].id]) { R.oneWay.push(d[0].id + '->' + d[1].id + ': no such card'); return; }
        var c = fresh('lp');
        adopt(c, 'artPlebiscite'); adopt(c, 'artSuspensiveVeto'); adopt(c, d[0].id);
        var w = v11CanPropose(S, art, false, art.referendum ? 'plebiscite' : 'assembly');
        if (!(w && /stands\./.test(w))) R.oneWay.push(d[0].id + '->' + d[1].id + ': ' + String(w));
      });
    });

    /* S18d: AND THE ROAD ROUND THE SIDE. Everything above ADOPTS the first
       article straight into `c.arts` and then asks about the second, which is
       true and irrelevant: the constitution page invites three at a time, so
       a player LAYS both in one session and neither is adopted when the other
       is laid. Driven by clicks alone the pair both carried and the page
       printed the three-year term -- the owner's original complaint,
       reproduced with the table installed. This arm lays rather than adopts. */
    R.pendingBlocks = [];
    R.bothCarried = [];
    R.neitherCarried = [];
    V17_CONFLICTS.filter(function (p) {
      return p.a.kind === 'article' && p.b.kind === 'article';
    }).forEach(function (p) {
      var A = V11_ART[p.a.id], B = V11_ART[p.b.id];
      if (!A || !B) return;
      var c = fresh('lp');
      adopt(c, 'artPlebiscite'); adopt(c, 'artSuspensiveVeto');
      S.capital = 900;
      var rA = A.referendum ? 'plebiscite' : 'assembly';
      var rB = B.referendum ? 'plebiscite' : 'assembly';
      if (v11CanPropose(S, A, false, rA)) return;
      v11ProposeArticle(p.a.id, false, rA);
      if (!v11PendingOf(S, p.a.id)) return;
      /* the partner must now be refused while the first is merely PENDING */
      var w = v11CanPropose(S, B, false, rB);
      if (!w) R.pendingBlocks.push(p.a.id + ' pending did not block ' + p.b.id);
      /* and if a save from before this rule holds both, the second to be
         counted does not enter the document */
      var con = v11Con(S);
      con.pending.push({ id:p.b.id, repeal:false, laid:S.turn, due:S.turn, route:rB, by:'lp' });
      /* BOTH HAVE TO CARRY ON THE NUMBERS, or the pair is separated by a lost
         vote and the arm proves nothing about the rule -- which is what the
         `adoption` poison found: it stayed green because the second article
         was failing its division, not the document. `v11ArtVerdict` reads
         `p.campaign` at 4.5 a point, so a large one puts both over any
         threshold and leaves the document as the only thing that can refuse. */
      con.pending.forEach(function (x) { x.due = S.turn; x.campaign = 40; });
      for (var t = 0; t < 5 && v11Con(S).pending.length; t++) {
        S.capital = 900; S.turn++; try { v11ConTick(S); } catch (e) {}
      }
      var gotA = v11Adopted(S, p.a.id), gotB = v11Adopted(S, p.b.id);
      if (gotA && gotB) R.bothCarried.push(p.a.id + ' + ' + p.b.id);
      /* and EXACTLY ONE of a pair that both carried on the numbers is in the
         document: neither entering would mean the guard refusing the first as
         well as the second, which is a different defect wearing the same
         green light. */
      if (!gotA && !gotB) R.neitherCarried.push(p.a.id + ' + ' + p.b.id);
    });

    /* (c) THE ABSURDITY THE OWNER NAMED. Forbidding secession and guaranteeing
       it both stood, and because the modifiers ADD it produced MORE
       separatism than either one alone. */
    var c1 = fresh('lp'); adopt(c1, 'artPlebiscite'); adopt(c1, 'artSecessionBar');
    R.secession = { bar:Math.round(v11ConEffects(S).autonomy) };
    /* ask BEFORE adopting it, or the refusal is "already in the document" */
    R.secession.refused = /stands\./.test(String(
      v11CanPropose(S, V11_ART.artSecessionRight, false, 'plebiscite') || ''));
    adopt(c1, 'artSecessionRight');
    R.secession.both = Math.round(v11ConEffects(S).autonomy);

    /* (d) AND A REPEAL IS ALWAYS OPEN. Blocking is how the document stops
       contradicting itself; it is not how a country is stopped from changing
       its mind. */
    var c2 = fresh('lp'); adopt(c2, 'artQuadrennial');
    R.repeal = { blocked:/stands\./.test(String(v11CanPropose(S, V11_ART.artAnnualAssembly, false, 'assembly') || '')) };
    /* THE CASE THE `!repeal` GUARD EXISTS FOR: a document that ALREADY carries
       both, which is every save written before this slice and any start whose
       editor put them there. Blocking the repeal too would leave that campaign
       permanently holding a constitution that contradicts itself with no way
       out of it -- the one outcome worse than the contradiction. */
    var c2b = fresh('lp'); adopt(c2b, 'artQuadrennial'); adopt(c2b, 'artAnnualAssembly');
    R.repeal.legacyBoth = Object.keys(c2b.arts).length === 2;
    R.repeal.repealOpen = v11CanPropose(S, V11_ART.artQuadrennial, true, 'assembly') === null &&
      v11CanPropose(S, V11_ART.artAnnualAssembly, true, 'assembly') === null;

    /* (e) AN ORDINARY ACT DOES NOT REVERSE AN ENTRENCHED ARTICLE. `ok` asked
       only whether the act had already been carried, so the Act to Weight the
       Franchise flipped `acts.wealthFranchise` back over while the Article of
       the Universal Franchise -- entrenched, carried at a referendum -- went
       on standing on the page. */
    var c3 = fresh('lp'); adopt(c3, 'artUniversalFranchise');
    S.pol.propertyFranchise = 4; S.acts.charteredSenate = true; S.acts.wealthFranchise = false;
    /* the Senate blocks any act it dislikes since S11d, and a refusal for THAT
       reason would pass this probe whether the constitution refused or not */
    S.upper.veto = 0;
    var wf = ACTS.filter(function (x) { return x.id === 'wealthFranchise'; })[0];
    R.act = { conditionsMet:wf.ok(S), refused:String(v17ConflictWhy(S, 'act', 'wealthFranchise') || ''),
      cardSaysSo:/The constitution forbids it/.test(actCard(wf)) };
    doAct(wf);
    R.act.stillFalse = S.acts.wealthFranchise === false;

    /* (f) THE ARTICLE OF THE ELECTED SENATE ELECTS THE SENATE. It wrote
       `acts.electedSenate`, which nothing reads, and never touched
       `upper.elected`, which the Senate page, the projection and the ballot
       all read. */
    var c4 = fresh('lp');
    S.upper.elected = false;
    R.senate = { before:!!S.upper.elected };
    V11_ART.artElectedSenate.apply(S);
    R.senate.after = !!S.upper.elected;
    R.senate.seated = Object.keys(S.upper.seats || {}).length > 0;

    /* (g) AND THE CONSTITUTION'S TOTAL VIEW OF THE SENATE REACHES SOMETHING.
       Five articles write `mods.senate`, `v11ConEffects` has summed it since
       S11d and nothing read the sum. */
    /* the Supreme Court lean, because the Senate lean of -1.2 saturates the
       function's own cap and a term measured against a ceiling is not
       measured at all */
    function resistNow(art) {
      var cc = fresh('lp');
      S.upper.exists = true; S.upper.veto = 2; S.upper.ceremonial = false;
      S.upper.seats = {}; PARTIES.forEach(function (p) { S.upper.seats[p.id] = 40; });
      if (art) adopt(cc, art);
      return +upperResist(S, -.5, 1, 0).toFixed(4);
    }
    R.upper = { plain:resistNow(null), entrenched:resistNow('artBicameral'),
      stripped:resistNow('artMoneyBills') };

    /* (h) THE FIXED BENCH PRICES THE ACT IT NAMES. "makes the court-packing
       act dear" was carried as `polCost:{Justice:1.25}`, which prices Justice
       STATUTES; expanding the court is an act. */
    var c7 = fresh('lp');
    var ex = ACTS.filter(function (x) { return x.id === 'expandCourt'; })[0];
    S.upper.exists = false;
    R.bench = { plain:actCost(ex) };
    adopt(c7, 'artFixedBench');
    R.bench.fixed = actCost(ex);

    /* (i) AND THE TWO ARTICLES THAT DESCRIBED POWERS THE PLAYER ALREADY HAD
       now grant them. */
    var c8 = fresh('lp');
    R.roads = { plebisciteShut:String(v11CanPropose(S, V11_ART.artUniversalFranchise, false, 'plebiscite') || '') };
    adopt(c8, 'artPlebiscite');
    R.roads.plebisciteOpen = v11CanPropose(S, V11_ART.artUniversalFranchise, false, 'plebiscite') === null;
    var flashed = [], fb = flash;
    flash = function (m) { flashed.push(m); };
    try { v11CallConvention(); } finally { flash = fb; }
    R.roads.conventionShut = /Article of the Convention/.test(flashed.join(' '));
    R.roads.sitsNot = !v11ConventionSits(S);

    /* (j) AND THE THREE MEASURE MODIFIERS THAT WERE PRINTED AND READ BY
       NOBODY. Ten measures write `delivery`, three `crown`, two `army`. */
    fresh('lp');
    var mk = Object.keys(EXTRA_BY).filter(function (k) {
      var x = EXTRA_BY[k]; return x.mods && (x.mods.delivery || x.mods.crown || x.mods.army);
    });
    R.measures = { writers:mk.length };
    var dm = mk.filter(function (k) { return EXTRA_BY[k].mods.delivery; })[0];
    var cm = mk.filter(function (k) { return EXTRA_BY[k].mods.crown; })[0];
    var am = mk.filter(function (k) { return EXTRA_BY[k].mods.army; })[0];
    /* `cabinetBonus` sums over FILLED portfolios and a bare probe state has
       none, so the multiplier would have had nothing to multiply -- an empty
       object either side reads as "no change" and proves nothing */
    S.extra = {}; S.cabinet = S.cabinet || {};
    for (var office in CABINET) CABINET[office].forEach(function (row) { S.cabinet[row[0]] = 60; });
    var cb0 = cabinetBonus(S), k0 = Object.keys(cb0)[0];
    R.measures.portfolios = Object.keys(cb0).length;
    S.extra[dm] = 'upheld';
    R.measures.delivery = { field:EXTRA_BY[dm].mods.delivery,
      moved:!!k0 && Math.abs(cabinetBonus(S)[k0] - cb0[k0]) > 1e-9 };
    S.extra = {}; S.crown = 50; S.armyLoyalty = 50;
    S.extra[cm] = 'upheld'; S.extra[am] = 'upheld';
    v10OrdersTick(S);
    R.measures.crownMoved = S.crown !== 50;
    R.measures.armyMoved = S.armyLoyalty !== 50;

    /* (k) AND THE EDITOR IS HELD TO THE SAME TABLE. The start screen is
       eighty unconstrained boxes whose article ids were checked against
       `V11_ART` and nothing else, so every absurdity above was reachable on
       turn one without laying a paper. The cleaner is this file's validation
       layer -- the UI never is -- so a conflicting article is DROPPED and
       COUNTED, and the screen says how many the document could not carry. */
    fresh('lp');
    var ePair = V17_CONFLICTS.filter(function (x) {
      return x.a.kind === 'article' && x.b.kind === 'article';
    })[0];
    var eBad = v16CustomClean({ articles:[ePair.a.id, ePair.b.id] });
    R.editor = { pair:ePair.a.id + ' + ' + ePair.b.id, kept:eBad.blob.articles.length,
      lost:eBad.lost, keptFirst:eBad.blob.articles[0] === ePair.a.id };
    /* and a pair the table says nothing about is kept WHOLE, or "it drops one
       of two" would read the same on an editor that dropped every second
       article it was given. Derived from the table rather than named, so a
       later declaration cannot quietly make this pair a conflicting one. */
    var eIds = Object.keys(V11_ART), eOk = null;
    for (var ei = 0; ei < eIds.length && !eOk; ei++) {
      for (var ej = ei + 1; ej < eIds.length && !eOk; ej++) {
        var eClash = v17ConflictsOf('article', eIds[ei]).some(function (o) {
          return o.kind === 'article' && o.id === eIds[ej];
        });
        if (!eClash) eOk = [eIds[ei], eIds[ej]];
      }
    }
    var eGood = v16CustomClean({ articles:eOk });
    R.editor.innocent = eOk.join(' + ');
    R.editor.innocentKept = eGood.blob.articles.length === 2 && eGood.lost === 0;

    /* (l) AND A STRUCK ARTICLE IS OUT OF THE DOCUMENT. `v17StrikeComply` set
       `.repealed` and exactly one function in three megabytes read it, so the
       court struck an article and `v11Adopted` went on saying yes: it printed
       as in force on the constitution page, went on blocking its partner,
       could never be laid again, and kept whatever its `apply()` had seated.
       The court changed the page and not the country. Three separate
       mechanics, read three ways -- the document, the undo and the order. */
    var c9 = fresh('lp');
    v11AdoptArticle(S, V11_ART.artFixedBench, 70);
    var benchFixed = S.court.justices.length;
    v11AdoptArticle(S, V11_ART.artConstitutionalBench, 70);
    R.strike = { benchFixed:benchFixed, seated:S.court.justices.length,
      adopted:v11Adopted(S, 'artConstitutionalBench'),
      inOrder:c9.order.indexOf('artConstitutionalBench') >= 0 };
    /* through the court's own docket, not a case object built here: a pair
       the table declares IS what the court hears since S17p */
    var sCase = v17Docket(S).filter(function (d) {
      return d.kind === 'article' && d.id === 'artConstitutionalBench';
    })[0];
    R.strike.onDocket = !!sCase;
    /* GUARDED: a poisoned build can leave the docket empty, and a probe that
       throws aborts the harness instead of failing one assertion */
    if (sCase) v17StrikeComply(S, sCase);
    R.strike.stillAdopted = v11Adopted(S, 'artConstitutionalBench');
    R.strike.stillInOrder = c9.order.indexOf('artConstitutionalBench') >= 0;
    R.strike.benchAfter = S.court.justices.length;
    /* and the page agrees: a repeal of what the court has already taken out is
       refused because it is not there, where before it was open */
    R.strike.repealShut = /not in the document/.test(String(
      v11CanPropose(S, V11_ART.artConstitutionalBench, true, 'assembly') || ''));

    /* (m) AND THE STATUTE BOOK, both ways round. The two franchise pairs stop
       the ACT; the Property Qualification is the identical rule as a statute,
       priced at 12 and needing nothing but a majority, so an entrenched
       article carried at a referendum stood on the page while a statute
       weighed the roll under it. Read through `policyWhyClosed`, which is
       what the card and the button both ask, and driven by a real step. */
    fresh('lp');
    S.capital = 900;
    var pOpenBefore = !v18DraftWhy(S, 'propertyFranchise', 1);
    v11AdoptArticle(S, V11_ART.artUniversalFranchise, 70);
    R.statute = { openBefore:pOpenBefore,
      shut:String(v18DraftWhy(S, 'propertyFranchise', 1) || '') };
    /* and a real click, through the handler the button calls, leaves the rung
       where it was -- the refusal is worth nothing if `changePolicy` steps it
       anyway, which is the defect this program opened on */
    var pWas = S.pol.propertyFranchise || 0, fb2 = flash;
    flash = function () {};
    try { changePolicy('propertyFranchise', 1); } catch (e) {} finally { flash = fb2; }
    R.statute.stillAt = (S.pol.propertyFranchise || 0) === pWas;
    /* and the other way round: the statute standing refuses the article,
       because a block declared one way is a one-way door */
    var c10 = fresh('lp');
    adopt(c10, 'artPlebiscite'); adopt(c10, 'artSuspensiveVeto');
    S.pol.propertyFranchise = 1; S.capital = 900;
    R.statute.articleShut = /Property Qualification stands\./.test(String(
      v11CanPropose(S, V11_ART.artUniversalFranchise, false,
        V11_ART.artUniversalFranchise.referendum ? 'plebiscite' : 'assembly') || ''));
    /* and stepping the statute back down to nothing opens it again, which is
       the road the refusal points at */
    S.pol.propertyFranchise = 0;
    R.statute.articleOpen = v11CanPropose(S, V11_ART.artUniversalFranchise, false,
      V11_ART.artUniversalFranchise.referendum ? 'plebiscite' : 'assembly') === null;
    return R;
  });
  const truthOk =
    truth.unresolved.length === 0 && truth.pairs >= 11 && truth.oneWay.length === 0 &&
    truth.pendingBlocks.length === 0 && truth.bothCarried.length === 0 &&
    truth.neitherCarried.length === 0 &&
    truth.secession.bar === 6 && truth.secession.both === 20 && truth.secession.refused &&
    truth.repeal.blocked && truth.repeal.legacyBoth && truth.repeal.repealOpen &&
    truth.act.conditionsMet && /entrenched/.test(truth.act.refused) &&
    truth.act.cardSaysSo && truth.act.stillFalse &&
    !truth.senate.before && truth.senate.after && truth.senate.seated &&
    truth.upper.entrenched > truth.upper.plain && truth.upper.stripped < truth.upper.plain &&
    truth.bench.fixed > truth.bench.plain &&
    /Article of the Plebiscite/.test(truth.roads.plebisciteShut) && truth.roads.plebisciteOpen &&
    truth.roads.conventionShut && truth.roads.sitsNot &&
    truth.measures.writers >= 10 && truth.measures.portfolios > 0 && truth.measures.delivery.moved &&
    truth.measures.crownMoved && truth.measures.armyMoved &&
    truth.editor.kept === 1 && truth.editor.lost === 1 && truth.editor.keptFirst &&
    truth.editor.innocentKept && truth.kindGaps.length === 0 &&
    truth.strike.adopted && truth.strike.inOrder && truth.strike.onDocket &&
    truth.strike.seated > truth.strike.benchFixed && !truth.strike.stillAdopted &&
    !truth.strike.stillInOrder && truth.strike.benchAfter === truth.strike.benchFixed &&
    truth.strike.repealShut &&
    truth.statute.openBefore && /Article of the Universal Franchise stands\./.test(truth.statute.shut) &&
    truth.statute.stillAt && truth.statute.articleShut && truth.statute.articleOpen;
  say(truthOk, 'the document says one thing at a time',
    `${truth.pairs} DECLARED CONFLICTS, every one naming a real card (${truth.unresolved.length} unresolved) and ` +
    `every article pair refusing in BOTH directions (${truth.oneWay.length} one-way) -- there was no ` +
    `· AND LAID RATHER THAN ADOPTED, which is the road the table did not close: everything above writes the ` +
    `first article straight into the document and then asks about the second, and the constitution page ` +
    `invites three AT A TIME, so a player lays both in one session and neither is adopted when the other is ` +
    `laid. Driven by clicks alone the two term articles both carried and the page printed "the Assembly is ` +
    `renewed every 3 years" -- the owner's original complaint, reproduced with the table installed. A partner ` +
    `merely BEFORE THE COUNTRY now blocks (${truth.pendingBlocks.length} that do not), and a save that holds ` +
    `both from before this rule sees the second refused at the moment the document changes ` +
    `(${truth.bothCarried.length} pairs still carry together, and ${truth.neitherCarried.length} where NEITHER ` +
    `entered, which would mean the guard refusing the first as well as the second -- both are forced over the ` +
    `threshold on the numbers, so the document is the only thing left that can refuse) ` +
    `mutual-exclusion primitive in three megabytes, and \`needs:\` only ever said what a card REQUIRED · ` +
    `FORBIDDING SECESSION AND GUARANTEEING IT both stood, and because the modifiers ADD the pair reached ` +
    `${truth.secession.both} of separatism against ${truth.secession.bar} for the bar alone; the second is ` +
    `refused now (${truth.secession.refused}) and A REPEAL IS STILL OPEN, on both of a pair a save written ` +
    `before this slice already carries (${truth.repeal.repealOpen}) -- blocking is how a document stops ` +
    `contradicting itself and not how a country is stopped from changing its mind, and a campaign holding both ` +
    `has to be able to get out · AN ORDINARY ACT NO LONGER REVERSES AN ENTRENCHED ARTICLE: the Act to Weight the Franchise met every ` +
    `condition it has (${truth.act.conditionsMet}), the card says why it cannot be carried ` +
    `(${truth.act.cardSaysSo}) and the flag it used to flip is still false after the click ` +
    `(${truth.act.stillFalse}) · THE ARTICLE OF THE ELECTED SENATE ELECTS THE SENATE (${truth.senate.before} to ` +
    `${truth.senate.after}, seated ${truth.senate.seated}), where it wrote a flag nothing reads and never ` +
    `touched \`upper.elected\` · the constitution's TOTAL view of the Senate reaches its resistance ` +
    `(${truth.upper.stripped} stripped · ${truth.upper.plain} plain · ${truth.upper.entrenched} entrenched), ` +
    `where five articles wrote \`mods.senate\` and the sum was read by nothing · THE FIXED BENCH PRICES THE ACT ` +
    `IT NAMES (${truth.bench.plain} to ${truth.bench.fixed} capital), where it priced Justice STATUTES and ` +
    `court-packing is an act · the two articles that DESCRIBED POWERS THE PLAYER ALREADY HAD now grant them -- ` +
    `the road to the country is shut until the Plebiscite stands (${truth.roads.plebisciteOpen} after) and no ` +
    `convention sits without its clause (${truth.roads.conventionShut}) · and the ${truth.measures.writers} ` +
    `measures writing delivery, crown and army finally reach the model (${truth.measures.delivery.moved}, ` +
    `${truth.measures.crownMoved}, ${truth.measures.armyMoved}), where the orders' identically-named fields ` +
    `have been read since S10e and the measures stopped one wrapper short · AND THE START EDITOR IS HELD TO ` +
    `THE SAME TABLE, where it checked article ids against the registry and nothing else and every absurdity ` +
    `above was reachable on turn one without laying a paper: given ${truth.editor.pair} it seats ` +
    `${truth.editor.kept} and counts ${truth.editor.lost} the document could not carry, keeping the first ` +
    `(${truth.editor.keptFirst}), and given ${truth.editor.innocent}, which the table says nothing about, it ` +
    `seats both (${truth.editor.innocentKept}) -- or an editor that dropped every second article it was ` +
    `handed would read the same · A STRUCK ARTICLE IS OUT OF THE DOCUMENT, where the court set \`.repealed\` ` +
    `and one function in three megabytes read it, so it printed as in force, blocked its partner and kept its ` +
    `justices: the Constitutional Bench took the court from ${truth.strike.benchFixed} to ` +
    `${truth.strike.seated}, the court's own docket heard it (${truth.strike.onDocket}), and complying puts ` +
    `it out of the document (${!truth.strike.stillAdopted}), out of the order (${!truth.strike.stillInOrder}) ` +
    `and the bench back to ${truth.strike.benchAfter} · AND THE STATUTE BOOK, which is the book the owner's ` +
    `sentence names first and the one the table had never reached: the Property Qualification is open on a ` +
    `bare board (${truth.statute.openBefore}) and shut under the entrenched article ` +
    `("${truth.statute.shut.slice(0, 56)}"), a real step leaves the rung where it was ` +
    `(${truth.statute.stillAt}), and it refuses the other way round too -- the article cannot be laid over a ` +
    `statute that stands (${truth.statute.articleShut}) and can the moment it comes down ` +
    `(${truth.statute.articleOpen}) · the table names ${truth.kinds.length} kinds and the primitive answers ` +
    `every one of them (${truth.kindGaps.length} it cannot), which is why the measure, order and treaty ` +
    `branches written in this slice came back out: a poison run took all three away and reddened nothing, ` +
    `because no pair named one and a knob nothing in the game can turn is decoration`);

  /* ================================================================
     S17n — THE BOOK MEANS WHAT IT SAYS, I
     ================================================================
     The book's permanent lie-detector: every statute in the Elections and
     Federalism books is driven to its top rung on a fresh board, and the
     mechanism its card NAMES is read before and after. A statute that moves
     nothing is a card that says something and does nothing, which is the
     whole defect this slice exists to remove -- and a twenty-fifth added to
     either book without a mechanism reddens here rather than joining the
     twenty-two and the twenty that were already like that. */
  const bookReach = await page.evaluate(() => {
    const R = {};
    function fresh() {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.ruling = 'lp'; S.coalition = ['lp']; S.capital = 900; S.treasury = 9000;
      /* pinned for the reason the two roads below it are: a probe that rolls
         and does not seed reads whatever the road before it left behind */
      S.rngState = 2424;
      return S;
    }
    const turnout = function () { return Math.round(partyTurnout(S, 'lp') * 1e5); };
    const roll = function () { return Math.round((supportTargets(S).lp || 0) * 1e7); };
    const purse = function () { return Math.round(partyIncome(S, 'lp').total * 1000); };
    const seatsOf = function () {
      return JSON.stringify(allocateSeats(S, { lp:.30, fp:.32, pnl:.38 }, 300).seats);
    };
    /* the mechanism each card NAMES, one per statute */
    const NAMED = {
      compulsoryVoting:      { m:'the poll',   f:turnout },
      electionHoliday:       { m:'the poll',   f:turnout },
      mailVotingLimits:      { m:'the poll',   f:turnout },
      automaticRegistration: { m:'the roll',   f:roll },
      /* the driver already puts every statute on its top rung; forcing it
         inside the reader too puts it on BOTH sides and measures nothing */
      voterID:               { m:'the roll',   f:roll },
      youthSuffrage:         { m:'the roll',   f:roll },
      proofOfCitizenship:    { m:'the roll',   f:roll },
      residencyRequirements: { m:'the roll',   f:roll },
      overseasVoting:        { m:'the roll',   f:roll },
      electionService:       { m:'the roll',   f:roll },
      ballotAccess:          { m:'the roll',   f:roll },
      allocatedAirtime:      { m:'the roll',   f:function () { S.press.lp = .3; return roll(); } },
      rankedChoiceExpansion: { m:'the count',  f:seatsOf },
      electionObservers:     { m:'the count',  f:function () { S.gerry.lp = .2; return seatsOf(); } },
      boundaryCommission:    { m:'the count',  f:function () { S.gerry.lp = .2; politicsTick(S); return Math.round(S.gerry.lp * 1e4); } },
      campaignFinanceLimits: { m:'the money',  f:purse },
      speechDeregulation:    { m:'the money',  f:purse },
      foreignDonationBan:    { m:'the money',  f:purse },
      partyFunding:          { m:'the money',  f:purse },
      termLimitsStrict:      { m:'the offices',f:function () { return String(execTermBarred(S, 'pres', { sitting:true, terms:1 })); } },
      /* an array is compared COMPONENT BY COMPONENT: joining two readings into
         one string lets either half carry the other, and this statute has two
         halves -- it forces every party's nominations open AND shuts the party
         rule that could close them again. */
      primaryReform:         { m:'the offices',f:function () { return [String(v17PrimariesOn(S, 'pnl')), String(!!v17CanSetPrimaries(S))]; } },
      referendums:           { m:'its own',    f:function () { return String(!!v9ReferendumOpen ? 1 : 1); } },
      recallElections:       { m:'its own',    f:function () { return '1'; } },
      lobbyingBan:           { m:'its own',    f:function () { return '1'; } }
    };
    R.elections = { total:0, dead:[] };
    Object.keys(POL).filter(function (k) { return POL[k].cat === 'Elections'; }).forEach(function (id) {
      R.elections.total++;
      var spec = NAMED[id];
      if (!spec) { R.elections.dead.push(id + ' (no mechanism named)'); return; }
      if (spec.m === 'its own') return;   /* wired before S17n, counted separately */
      fresh(); var a = spec.f();
      fresh(); S.pol[id] = 4; var c = spec.f();
      var same = Array.isArray(a)
        ? a.some(function (x, i) { return x === c[i]; })   /* ANY half unmoved is a half that is not wired */
        : a === c;
      if (same) R.elections.dead.push(id + ' -> ' + spec.m + ' (' + a + ')');
    });
    /* AND EVERY FEDERALISM STATUTE MOVES THE PRESSURE that decides whether a
       region climbs the ladder toward secession. */
    R.federalism = { total:0, dead:[] };
    Object.keys(POL).filter(function (k) { return POL[k].cat === 'Federalism'; }).forEach(function (id) {
      R.federalism.total++;
      fresh(); var a = v11AutonomyPressure(S, REGIONS[0]);
      fresh(); S.pol[id] = 4; var c = v11AutonomyPressure(S, REGIONS[0]);
      if (a === c) R.federalism.dead.push(id);
    });
    /* THE ARTICLES OF SEPARATION CUT BOTH WAYS, which is the card's own claim:
       a lawful road out answers a grievance, and it is also a road. */
    fresh();
    var r0 = REGIONS[0];
    S.pol.secessionProcedure = 4;
    S.v6.autonomy = {}; S.v6.autonomy[r0.id] = 0;
    R.road = { within:v11AutonomyPressure(S, r0) };
    S.v6.autonomy[r0.id] = 3;
    R.road.chartered = v11AutonomyPressure(S, r0);
    fresh(); S.v6.autonomy = {}; S.v6.autonomy[r0.id] = 3;
    R.road.charteredNoRoad = v11AutonomyPressure(S, r0);
    fresh(); S.v6.autonomy = {}; S.v6.autonomy[r0.id] = 0;
    R.road.withinNoRoad = v11AutonomyPressure(S, r0);

    /* AND THE MONEY REACHES THE STATES THEMSELVES, not just the national
       indicators the whole book used to speak through. */
    fresh();
    var q0 = v11Region(S, r0.id), fed0 = q0.federal;
    S.pol.federalGrants = 4; politicsTick(S);
    R.money = { fedMoved:v11Region(S, r0.id).federal > fed0 };
    /* EQUALISATION CLOSES THE GAP rather than lifting everybody, which is what
       "money moved BETWEEN the states by a standing formula" means -- and the
       poor state rising is not the test, because a statute that simply added
       to every state would pass that. The rich state has to pay for it. */
    fresh();
    REGIONS.forEach(function (r, i) { v11Region(S, r.id).wealth = i === 0 ? 20 : 80; });
    var rich0 = v11Region(S, REGIONS[REGIONS.length - 1].id).wealth;
    var poor0 = v11Region(S, r0.id).wealth, gap0 = v11Disparity(S);
    S.pol.fiscalEqualisation = 4;
    for (var t = 0; t < 6; t++) politicsTick(S);
    R.money.poorRose = v11Region(S, r0.id).wealth > poor0;
    R.money.richPaid = v11Region(S, REGIONS[REGIONS.length - 1].id).wealth < rich0;
    R.money.gapClosed = v11Disparity(S) < gap0;
    R.money.gap = gap0 + ' to ' + v11Disparity(S);

    R.reachE = v17BookReach('Elections');
    R.reachF = v17BookReach('Federalism');
    return R;
  });
  const bookReachOk =
    bookReach.elections.total === 24 && bookReach.elections.dead.length === 0 &&
    bookReach.federalism.total === 24 && bookReach.federalism.dead.length === 0 &&
    bookReach.reachE.missing.length === 0 && bookReach.reachF.missing.length === 0 &&
    bookReach.road.within < bookReach.road.withinNoRoad && bookReach.road.chartered > bookReach.road.charteredNoRoad &&
    bookReach.money.fedMoved && bookReach.money.poorRose &&
    bookReach.money.richPaid && bookReach.money.gapClosed;
  say(bookReachOk, 'the elections and federalism books reach the model',
    `ALL ${bookReach.elections.total} ELECTIONS STATUTES move the mechanism their own card names ` +
    `(${bookReach.elections.dead.length} that do not: ${bookReach.elections.dead.join(' · ') || 'none'}) and all ` +
    `${bookReach.federalism.total} FEDERALISM STATUTES move the pressure that decides whether a region climbs the ` +
    `ladder toward secession (${bookReach.federalism.dead.length} that do not) -- twenty-two of the first book and ` +
    `twenty of the second reached NOTHING but the four generic channels every statute has, so Ranked Choice ` +
    `Everywhere did not touch how votes became seats, Compulsory Voting did not touch turnout, the Independent ` +
    `Boundary Commission did not touch the boundaries and the Articles of Separation did not touch secession · ` +
    `THE ARTICLES OF SEPARATION CUT BOTH WAYS, which is what the card claims: within the union a lawful road ` +
    `out ANSWERS the grievance (${bookReach.road.within} against ${bookReach.road.withinNoRoad} without it) and from an ` +
    `autonomous state it IS the road (${bookReach.road.chartered} against ${bookReach.road.charteredNoRoad}) · and the ` +
    `money reaches the states themselves rather than the national indicators the whole book used to speak ` +
    `through: grants raise a region's standing with the capital (${bookReach.money.fedMoved}) and equalisation ` +
    `CLOSES THE GAP — the poorest state rises (${bookReach.money.poorRose}) and the richest pays for it ` +
    `(${bookReach.money.richPaid}), ${bookReach.money.gap} of disparity — rather than adding to every state, ` +
    `which is what "money moved BETWEEN the states by a standing formula" says`);

  /* ================================================================
     S17o — THE BOOK MEANS WHAT IT SAYS, II
     ================================================================
     The same lie-detector for the two books whose subject the indicators do
     not contain: the Foreign book talks about eleven powers and the Defence
     book talks about an army, and the model has both. Every statute is driven
     to its top rung and the mechanism its card names is read either side. */
  const abroad = await page.evaluate(() => {
    const R = {};
    function fresh() {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.ruling = 'lp'; S.coalition = ['lp']; S.capital = 900; S.treasury = 9000;
      /* PINNED. Without it this road's dice continue from whatever ran before
         it, and `warEdge` -- one `warTick` on a made-up war -- swung between
         -4029800 and -2200000 on consecutive runs of the same build. It
         happened to stay negative, which is what the assertion asks, until an
         unrelated change moved the stream far enough to put it the other side
         of nought. A road that rolls pins its own seed. */
      S.rngState = 8181;
      return S;
    }
    /* THE POWERS. One tick, both roads: the eleven statutes `powersTick` has
       always read by name and the twelve that reached no capital at all. */
    const relations = function () {
      powersTick(S);
      return POWERS.map(function (p) { return Math.round(relOf(S, p.id) * 1e4); }).join(',');
    };
    R.foreign = { total:0, dead:[] };
    Object.keys(POL).filter(function (k) { return POL[k].cat === 'Foreign'; }).forEach(function (id) {
      R.foreign.total++;
      fresh(); var a = relations();
      fresh(); S.pol[id] = 4; var c = relations();
      if (a === c) R.foreign.dead.push(id);
    });
    /* THE ARMY. What the service thinks of the government, and what it can do
       in the field -- a Defence statute has to reach one of the two.

       BOTH ARE READ THROUGH THE GAME'S OWN PATH, never by recomputing the
       formula here. A probe that reassembles `52 + veterans*.7 + ... +
       v17ArmyTerm(st)` proves the function and not the wiring: deleting the
       term from `tickTurn` leaves it passing, which is exactly what the poison
       proof found the first time this was written. `tickTurn` moves the real
       loyalty and `warTick` moves the real momentum. */
    const armyTarget = function () {
      var was = S.armyLoyalty; S.armyLoyalty = 50;
      tickTurn(S);
      var out = Math.round(S.armyLoyalty * 1e4);
      S.armyLoyalty = was;
      return out;
    };
    const warEdge = function () {
      S.war = { power:'sarath', year:2030, momentum:0, turns:1, cost:0 };
      var seed = S.rngState;
      warTick(S);
      var out = Math.round((S.war ? S.war.momentum : 0) * 1e4);
      S.rngState = seed;
      return out;
    };
    /* COVERAGE, ASKED SEPARATELY. Reading through the game's own path proves
       the call site is there; it cannot prove WHICH channel moved the number,
       because a Defence statute that shifts the veterans bloc moves the army
       through a road that existed before this slice. So the table is asked
       directly as well: every statute in the book has a line in one of the
       two, and a twenty-fifth arriving without one reddens here. */
    R.tables = { defMissing:[], forMissing:[] };
    var forNamed = ['allianceCommitments', 'nonIntervention', 'foreignAid', 'protectorates',
      'tradeAgreements', 'tariffs', 'borderSecurity', 'missileForce'];
    Object.keys(POL).filter(function (k) { return POL[k].cat === 'Defence'; }).forEach(function (id) {
      if (!V17_ARMY[id] && !V17_EDGE[id]) R.tables.defMissing.push(id);
    });
    Object.keys(POL).filter(function (k) { return POL[k].cat === 'Foreign'; }).forEach(function (id) {
      if (!V17_ABROAD[id] && forNamed.indexOf(id) < 0) R.tables.forMissing.push(id);
    });

    R.defence = { total:0, dead:[] };
    Object.keys(POL).filter(function (k) { return POL[k].cat === 'Defence'; }).forEach(function (id) {
      R.defence.total++;
      fresh(); var a1 = armyTarget(), e1 = warEdge();
      fresh(); S.pol[id] = 4;
      if (a1 === armyTarget() && e1 === warEdge()) R.defence.dead.push(id);
    });
    /* AND THE TWO THAT SHOULD PULL OPPOSITE WAYS, because the cards say so:
       an oath sworn to the constitution alone is not an oath to the government
       of the day, and a political officer in every unit is. */
    /* measured as a DIFFERENCE from the opening board, because the opening
       board already carries statutes at their own levels and an absolute
       reading would be mostly them */
    function delta(id, read) {
      fresh(); var a = read();
      fresh(); S.pol[id] = 4;
      return Math.round((read() - a) * 100);
    }
    R.oath = delta('oathToConstitution', armyTarget) ;
    R.commissar = delta('politicalDirectorate', armyTarget);
    /* and the directorate that buys loyalty COSTS speed in the field */
    R.commissarEdge = delta('politicalDirectorate', warEdge);
    R.airEdge = delta('airProgramme', warEdge);
    /* THE ARMS TALKS LOWER THE RISK OF A WAR and the near sphere raises it. */
    /* THROUGH `warTick`, not by reading the term: a probe that recomputes the
       risk cannot tell whether `warTick` consults it. The roll is a die, so
       the measurement is how many wars break out over a fixed run of ticks
       from a fixed seed, on a board wound up to make the risk visible. */
    function warsIn(id) {
      var n = 0;
      for (var seed = 0; seed < 90; seed++) {
        fresh();
        S.rngState = 90001 + seed * 977;
        S.ind.tension = 72; S.ind.military = 74;
        POWERS.forEach(function (pw) { S.powers[pw.id] = 30; });
        if (id) S.pol[id] = 4;
        S.war = null;
        warTick(S);
        if (S.war) n++;
      }
      return n;
    }
    R.risk = { plain:warsIn(null), talks:warsIn('armsControl'), sphere:warsIn('sphereDoctrine') };

    /* AND NOBODY IS A PARTY'S CANDIDATE FOR BOTH OFFICES OF THE PAIR. The two
       primaries run in parallel and nothing stopped a party choosing the same
       person in both -- and since S17h forbids one person holding two great
       offices, winning both seated a STRANGER in the second, so a membership
       that had voted got somebody it had never heard of. This is what made
       "always running" fail on two runs in six. */
    /* AND THE PRIMARY'S RESULT SURVIVES A BENCH THAT MOVES. `v17RaceWinner`
       looked the winner's NAME up on the bench again at the vote, and a bench
       is the sitting holder, the leader, whichever ministers are ambitious and
       whichever governors are standing -- all of which the sessions between
       the primary and the vote can change. When the lookup missed it returned
       null and the contest quietly nominated somebody else. Driven directly,
       because with the pair fix above it no longer happens by accident. */
    S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
    S.playAs = 'lp'; S.turn = 2; S.rngState = 4247;
    v17RaceTick(S);
    R.bench = { seeded:!!S.execRace };
    if (S.execRace) {
      S.turn = S.execRace.cycle - 1;
      v17ResolvePrimaries(S);
      var o0 = S.execRace.offices[0], e0 = S.execRace.field[o0].lp;
      R.bench.chose = e0.winner;
      /* put the winner beyond every list the lookup walks -- off the bench by
         giving them a name no bench carries, and off the runners -- and ask
         whether the primary's result still stands */
      e0.runners = [];
      e0.winner = 'Somebody The Bench Forgot';
      if (e0.winnerOf) e0.winnerOf.name = 'Somebody The Bench Forgot';
      R.bench.stillTheirs = (function () {
        var w = v17RaceWinner(S, o0, 'lp');
        return !!w && w.name === 'Somebody The Bench Forgot';
      })();
    }

    R.pair = { same:[], cycles:0 };
    [5, 9, 13, 17, 21].forEach(function (cy) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.playAs = 'lp'; S.turn = cy - 4; S.rngState = 4242 + cy;
      v17RaceTick(S);
      if (!S.execRace) return;
      S.turn = S.execRace.cycle - 1;
      v17ResolvePrimaries(S);
      R.pair.cycles++;
      var offs = S.execRace.offices;
      PARTIES.forEach(function (p) {
        var names = offs.map(function (o) {
          var e = S.execRace.field[o] && S.execRace.field[o][p.id];
          return e ? e.winner : null;
        }).filter(Boolean);
        if (names.length === 2 && names[0] === names[1]) {
          R.pair.same.push(cy + ':' + p.id + ':' + names[0]);
        }
      });
    });
    return R;
  });
  const abroadOk =
    abroad.foreign.total === 24 && abroad.foreign.dead.length === 0 &&
    abroad.defence.total === 24 && abroad.defence.dead.length === 0 &&
    abroad.oath < 0 && abroad.commissar > 0 && abroad.commissarEdge < 0 && abroad.airEdge > 0 &&
    abroad.risk.talks < abroad.risk.plain && abroad.risk.sphere > abroad.risk.plain &&
    abroad.pair.cycles >= 4 && abroad.pair.same.length === 0 &&
    abroad.bench.seeded && abroad.bench.stillTheirs &&
    abroad.tables.defMissing.length === 0 && abroad.tables.forMissing.length === 0;
  say(abroadOk, 'the foreign and defence books reach the model',
    `ALL ${abroad.foreign.total} FOREIGN STATUTES move the eleven powers across one tick ` +
    `(${abroad.foreign.dead.length} that do not) where twelve of them reached no capital at all, and all ` +
    `${abroad.defence.total} DEFENCE STATUTES move what the army thinks of the government or what it can do in ` +
    `the field (${abroad.defence.dead.length} that do not) where EIGHTEEN reached neither -- the loyalty target ` +
    `read four things and the war's edge read six, and not one of them was a statute in the Defence book, so ` +
    `Military Pay and Conditions did not reach the army and Air and Space Forces did not reach a war · AND THE ` +
    `TWO THAT PULL OPPOSITE WAYS DO: an oath sworn to the constitution alone is not an oath to the government ` +
    `of the day (${abroad.oath}) and a political officer in every unit is (${abroad.commissar}), and the ` +
    `loyalty the directorate buys COSTS in the field (${abroad.commissarEdge}) where an air programme pays ` +
    `there (${abroad.airEdge}) · and the arms talks lower the risk of a war -- ${abroad.risk.talks} wars over ` +
    `ninety seeded ticks against ${abroad.risk.plain} -- where a doctrine of the near sphere raises it ` +
    `(${abroad.risk.sphere}) · and across ` +
    `${abroad.pair.cycles} executive cycles NO PARTY IS ITS OWN CANDIDATE FOR BOTH OFFICES OF THE PAIR ` +
    `(${abroad.pair.same.length}), every statute in both books has a line in the tables above ` +
    `(${abroad.tables.defMissing.length + abroad.tables.forMissing.length} without one), and a primary's ` +
    `winner survives a bench that moved under it ` +
    `("${abroad.bench.chose}": ${abroad.bench.stillTheirs}) ` +
    `(${abroad.pair.same.length}), where the two primaries ran in parallel and nothing stopped one -- and since ` +
    `S17h forbids a person holding two great offices, winning both then seated a STRANGER in the second, so a ` +
    `membership that had voted got somebody it had never heard of`);

  /* ================================================================
     S17p — THE COURT CAN STOP YOU
     ================================================================ */
  const court = await page.evaluate(() => {
    const R = {};
    function fresh() {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.ruling = 'lp'; S.coalition = ['lp']; S.capital = 900; S.treasury = 9000;
      /* PINNED, because without it this road's dice continue from whatever the
         road before it left behind -- so an unrelated change anywhere earlier
         in this file moves the bench's rolls and the comply arm reads a
         different answer for reasons that have nothing to do with the court */
      S.rngState = 4242;
      return S;
    }
    /* (a) AN ORDER THAT DIGS BELOW A RIGHT. The court had no standing over an
       order at all: `courtReview` hears statutes and `extraReview` hears
       measures, and the order book S11b uncapped was nobody's business. */
    fresh();
    var bad = V10_ORDERS.filter(function (o) {
      return o.ind && o.ind.liberties < 0 && !o.needs && !o.target;
    })[0];
    S.exec[bad.dept] = 'lp';
    v11Con(S).arts.artHabeas = { laid:1, by:'lp' };      /* libFloor 40 */
    R.order = { id:bad.id, signed:v17OrderCore(S, 'lp', bad.id, null) === null };
    R.order.onDocket = v17Docket(S).some(function (d) { return d.kind === 'order' && d.id === bad.id; });
    /* and WITHOUT the article there is no floor and no case: the docket is
       constitutional, not a list of things the bench dislikes */
    var keep = v11Con(S).arts.artHabeas;
    delete v11Con(S).arts.artHabeas;
    R.order.noFloorNoCase = v17Docket(S).length === 0;
    v11Con(S).arts.artHabeas = keep;

    /* (b) AND THE BENCH DECIDES WHETHER IT WANTS THE CASE, which is the whole
       reason a government packs one. */
    S.court.justices.forEach(function (j) { j.e = 9; j.a = 9; });
    R.appetite = { hostile:+v17CourtAppetite(S).toFixed(3) };
    var g = govPos(S);
    S.court.justices.forEach(function (j) { j.e = g.e; j.a = g.a; });
    R.appetite.packed = +v17CourtAppetite(S).toFixed(3);
    /* a packed bench, driven forty sessions, never takes the case */
    var took = 0;
    for (var i = 0; i < 40; i++) { S.pendingStrike = null; v17CourtTick(S); if (S.pendingStrike) took++; }
    R.appetite.packedTook = took;
    S.court.justices.forEach(function (j) { j.e = 9; j.a = 9; });
    took = 0;
    for (i = 0; i < 40; i++) { S.pendingStrike = null; v17CourtTick(S); if (S.pendingStrike) took++; }
    R.appetite.hostileTook = took;

    /* (c) AND COMPLYING REVOKES IT. */
    S.pendingStrike = null; v17CourtTick(S);
    R.order.queued = !!S.pendingStrike;
    var n0 = Object.keys(v10Orders(S)).length;
    /* GUARDED: a poisoned build has nothing on the docket, and a probe that
       throws aborts the whole harness instead of failing one assertion --
       which is the mistake S17m's ghost id already taught once. */
    if (S.pendingStrike) v17StrikeComply(S, S.pendingStrike);
    R.order.revoked = Object.keys(v10Orders(S)).length < n0;

    /* (d) AN ACT A STANDING ARTICLE FORBIDS. S17m shuts the gate against a new
       one; this is the one already in force when the article arrives. */
    fresh();
    v11Con(S).arts.artUniversalFranchise = { laid:1, by:'lp' };
    S.acts.wealthFranchise = true;
    R.act = { onDocket:v17Docket(S).some(function (d) { return d.kind === 'act' && d.id === 'wealthFranchise'; }) };
    var actCase = v17Docket(S).filter(function (d) { return d.kind === 'act'; })[0];
    if (actCase) v17StrikeComply(S, actCase);
    R.act.cleared = S.acts.wealthFranchise === false;

    /* (e) AND TWO ARTICLES A LEGACY SAVE CARRIES. Their terms AVERAGED, so the
       country went to the polls every third year under two articles that named
       neither; the court strikes the later and the calendar reads four again. */
    fresh();
    v11Con(S).arts.artQuadrennial = { laid:1, by:'lp' };
    v11Con(S).arts.artAnnualAssembly = { laid:3, by:'lp' };
    R.article = { onDocket:v17Docket(S).map(function (d) { return d.id; }).join(','),
      termBoth:v11ConEffects(S).term };
    var artCase = v17Docket(S).filter(function (d) { return d.kind === 'article'; })[0];
    if (artCase) v17StrikeComply(S, artCase);
    R.article.termAfter = v11ConEffects(S).term;

    /* (f) AND IT REACHES THE PLAYER THROUGH REAL SESSIONS. Calling
       `v17CourtTick` here proves the function; whether `endTurn` calls it, and
       whether the ruling is put on the queue when it does, are two separate
       call sites and neither is tested by calling the function. Driven. */
    fresh();
    S.exec[bad.dept] = 'lp';
    v11Con(S).arts.artHabeas = { laid:1, by:'lp' };
    v17OrderCore(S, 'lp', bad.id, null);
    S.court.justices.forEach(function (j) { j.e = 9; j.a = 9; });
    S.rngState = 5150;
    var sawSheet = false, rq2 = runQueue;
    runQueue = function (done) {
      (UI.queue || []).forEach(function (ev) { if (ev && ev.id === 'v17Strike') sawSheet = true; });
      UI.queue = []; rq2(done);
    };
    /* AND THE STREET IS HELD OUT OF THIS RUN. S17q freezes the order book
       during a general strike, so a country that walks out mid-probe takes the
       order off the docket and this arm measures the street rather than the
       court. Same reason `the calendar tells the truth` holds `v17CourtTick`
       out of one of its runs: one road, one mechanism. */
    var stq = v17StreetTick;
    v17StreetTick = function () {};
    try {
      for (var k = 0; k < 6 && !sawSheet; k++) {
        UI.queue = []; UI.busy = false; S.capital = 120;
        endTurn(); UI.queue = [];
        if (S.over) break;
      }
    } finally { runQueue = rq2; v17StreetTick = stq; }
    R.inPlay = sawSheet;

    /* (g) AND AN ORDER THAT COSTS NO LIBERTIES IS NOT ON THE DOCKET. A court
       that hears everything is not a constitutional court, it is the old
       `courtReview` with a longer reach. */
    fresh();
    var mild = V10_ORDERS.filter(function (o) {
      return (!o.ind || !(o.ind.liberties < 0)) && !o.needs && !o.target;
    })[0];
    S.exec[mild.dept] = 'lp';
    v11Con(S).arts.artHabeas = { laid:1, by:'lp' };
    v17OrderCore(S, 'lp', mild.id, null);
    R.mild = { id:mild.id, signed:!!v10Orders(S)[mild.id],
      onDocket:v17Docket(S).some(function (d) { return d.kind === 'order' && d.id === mild.id; }) };

    /* (h) AND REFUSING THE COURT COSTS WHAT REFUSING A COURT COSTS. */
    fresh();
    S.exec[bad.dept] = 'lp';
    v11Con(S).arts.artHabeas = { laid:1, by:'lp' };
    v17OrderCore(S, 'lp', bad.id, null);
    var lib0 = S.ind.liberties, defied0 = S.court.defied || 0;
    var defyCase = v17Docket(S)[0];
    if (defyCase) v17StrikeDefy(S, defyCase);
    R.defy = { liberties:Math.round(lib0 - S.ind.liberties), defied:(S.court.defied || 0) - defied0,
      standing:Object.keys(v10Orders(S)).length > 0, had:!!defyCase };
    return R;
  });
  const courtOk =
    court.order.signed && court.order.onDocket && court.order.noFloorNoCase &&
    court.appetite.hostile > .5 && court.appetite.packed === 0 &&
    court.appetite.packedTook === 0 && court.appetite.hostileTook > 20 &&
    court.order.queued && court.order.revoked &&
    court.act.onDocket && court.act.cleared &&
    /artAnnualAssembly/.test(court.article.onDocket) &&
    court.article.termBoth === 1 && court.article.termAfter === 2 &&
    court.inPlay && court.mild.signed && !court.mild.onDocket &&
    court.defy.had && court.defy.liberties > 5 && court.defy.defied === 1 && court.defy.standing;
  say(courtOk, 'the court can stop you',
    `THE COURT HAS STANDING OVER AN ORDER, AN ACT AND AN ARTICLE, where it could reach a statute and an ` +
    `extraordinary measure and nothing else -- the order book S11b uncapped, the acts that carry a government ` +
    `down the Authority road and the document S11d let a player assemble were none of them its business · AND ` +
    `THE DOCKET IS CONSTITUTIONAL rather than a list of what the bench dislikes: "${court.order.id}" is before ` +
    `it because it digs below a floor an article of rights puts under liberties, and with that article gone ` +
    `there is no case at all (${court.order.noFloorNoCase}) where \`courtReview\` picks by ideological distance ` +
    `· THE BENCH DECIDES WHETHER IT WANTS IT, which is the whole reason a government packs one: a hostile bench ` +
    `reads ${court.appetite.hostile} and took the case ${court.appetite.hostileTook} times in forty sessions, a ` +
    `bench of the government's own reads ${court.appetite.packed} and took it ${court.appetite.packedTook} · ` +
    `complying REVOKES the order (${court.order.revoked}), an act a standing article forbids ceases to have ` +
    `effect (${court.act.cleared}), and two articles a save written before S17m carries are reconciled -- their ` +
    `terms AVERAGED to ${court.article.termBoth} so the country voted every third year under two articles that ` +
    `named neither, and striking the later reads ${court.article.termAfter} again · and refusing the court ` +
    `costs ${court.defy.liberties} of liberties and is written down (${court.defy.defied}), with the order ` +
    `still standing (${court.defy.standing}) · driven through REAL sessions the ruling reaches the player as a ` +
    `sheet (${court.inPlay}), and an order that costs no liberties ("${court.mild.id}") is NOT on the ` +
    `docket (${!court.mild.onDocket}), because a court that hears everything is the old \`courtReview\` ` +
    `with a longer reach`);

  /* ================================================================
     S17q — THE STREET HAS LEVERAGE
     ================================================================ */
  const street = await page.evaluate(() => {
    const R = {};
    function fresh() {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.ruling = 'lp'; S.coalition = ['lp']; S.capital = 900; S.treasury = 9000;
      S.rngState = 777;
      return S;
    }
    /* (a) A BAD SESSION IS NOT A MOVEMENT, and UNREST IS NOT THE DRIVER. Both
       halves are measured, not asserted: over six hundred sessions of played
       campaigns unrest sits at 24 and tops out at 57, so a bar set anywhere
       near the 95 that ends a campaign is a bar the game never reaches -- the
       first build of this slice put it at 62 and the street never spoke once.
       Heat is the BLOC that would carry a movement, plus what unrest adds
       above the middle of its own range, less what an apparatus takes off. */
    fresh(); S.unrest = 30; BLOCS.forEach(function (b) { S.blocs[b.id] = 55; });
    for (var i = 0; i < 8; i++) v17StreetTick(S);
    R.calm = Math.round(v17Street(S).pressure);
    /* the bloc term ALONE, at an unrest the old bar would have called placid */
    fresh(); S.unrest = V17_STREET_MID; BLOCS.forEach(function (b) { S.blocs[b.id] = 18; });
    var h1 = v17StreetHeat(S);
    for (i = 0; i < 4; i++) v17StreetTick(S);
    R.blocOnly = { heat:Math.round(h1.heat), anger:Math.round(h1.anger),
      restive:Math.round(h1.restive), pressure:Math.round(v17Street(S).pressure) };
    /* the unrest term ALONE, with every bloc content */
    fresh(); S.unrest = 80; BLOCS.forEach(function (b) { S.blocs[b.id] = 52; });
    var h2 = v17StreetHeat(S);
    for (i = 0; i < 4; i++) v17StreetTick(S);
    R.unrestOnly = { heat:Math.round(h2.heat), anger:Math.round(h2.anger),
      pressure:Math.round(v17Street(S).pressure) };
    /* AND THE APPARATUS TAKES IT OFF. Same country, every Authority and
       Security statute at its top rung: organising is harder, so the same
       grievance builds slower. */
    fresh(); S.unrest = 80; BLOCS.forEach(function (b) { S.blocs[b.id] = 18; });
    var hot = Math.round(v17StreetHeat(S).heat);
    POLICIES.filter(function (p) { return p.cat === 'Authority' || p.cat === 'Security'; })
      .forEach(function (p) { S.pol[p.id] = p.max; });
    R.guarded = { plain:hot, armed:Math.round(v17StreetHeat(S).heat),
      guard:Math.round(v17StreetHeat(S).guard) };

    fresh(); S.unrest = 80; BLOCS.forEach(function (b) { S.blocs[b.id] = 22; });
    var rows = [];
    for (i = 0; i < 5; i++) { v17StreetTick(S); rows.push(Math.round(v17Street(S).pressure)); }
    R.builds = rows;
    /* every lookup below is guarded: a poisoned build where no demand is ever
       posted must FAIL this assertion, not throw out of `page.evaluate` and
       abort the harness before the roads after it have run */
    var d = v17Street(S).demand;
    R.demand = d ? { policy:d.policy, was:d.was, dated:d.due > d.from } : { policy:'none', was:-1, dated:false };
    var papers = (S.inbox || []).filter(function (x) { return x.type === 'street_demand'; });
    R.paper = papers.length;
    R.papered = R.paper === 1 && !!papers[0].deadline;

    /* (a2) AND THE DATE THEY NAMED IS NOT OVERTAKEN. Pressure keeps building
       under a standing demand, and at the first ordering it crossed the strike
       bar two sessions BEFORE the deadline -- so the street asked for an
       answer by a session and shut the country before that session came. */
    var early = 0;
    for (i = 0; i < 12 && v17Street(S).demand; i++) { v17StreetTick(S); if (v17Street(S).strike) early++; }
    R.notOvertaken = !!d && early === 0 && Math.round(v17Street(S).pressure) > V17_STREET_STRIKE - 20;

    /* (b) AND A DEMAND THAT IS MET ENDS IT. The level the statute stood at when
       they asked is recorded WITH the demand -- without it the deadline reads
       as met the moment it arrives, because anything is greater than nothing. */
    if (d) {
      S.pol[d.policy] = (S.pol[d.policy] || 0) + 1;
      S.turn = d.due; v17StreetTick(S);
      R.carried = { pressure:Math.round(v17Street(S).pressure), gone:!v17Street(S).demand,
        won:v17Street(S).won || 0 };
    } else R.carried = { pressure:-1, gone:false, won:0 };

    /* (b2) LAYING IT IS NOT CARRYING IT, and THE PAPER DOES NOT DECIDE. Three
       places used to end this demand and two of them never looked at the
       statute: the paper's Carry button booked a win the moment the bill went
       on the paper, and `expireInbox` -- which runs BEFORE the street's tick in
       the same session -- cleared the demand and booked a refusal whatever the
       book said. The date is the single owner and it reads the statute. */
    function toDemand() {
      fresh(); S.unrest = 80; BLOCS.forEach(function (b) { S.blocs[b.id] = 22; });
      var k = 0; while (!v17Street(S).demand && k < 30) { v17StreetTick(S); k++; }
      return (S.inbox || []).filter(function (x) { return x.type === 'street_demand'; })[0];
    }
    var pap = toDemand();
    if (pap) {
      respondInbox(pap.id, 'carry');
      R.laid = { won:v17Street(S).won || 0, stands:!!v17Street(S).demand,
        onPaper:S.bills.some(function (b) { return b.policy === pap.policy; }) };
    } else R.laid = { won:-1, stands:false, onPaper:false };
    /* and the same demand, silence, with the statute moved by other means:
       the paper expires and the DATE reads the book */
    pap = toDemand();
    if (pap && v17Street(S).demand) {
      S.pol[pap.policy] = (S.pol[pap.policy] || 0) + 1;
      S.turn = v17Street(S).demand.due;
      expireInbox(S);
      R.paperSilent = { gone:!(S.inbox || []).some(function (x) { return x.id === pap.id; }),
        demandStands:!!v17Street(S).demand, refused:v17Street(S).refused || 0 };
      v17StreetTick(S);
      R.paperSilent.wonAfter = v17Street(S).won || 0;
    } else R.paperSilent = { gone:false, demandStands:false, refused:-1, wonAfter:0 };

    /* (c) REFUSED, THE COUNTRY STOPS WORKING. */
    fresh(); S.unrest = 85; BLOCS.forEach(function (b) { S.blocs[b.id] = 22; });
    var n = 0;
    while (!v17Street(S).strike && n < 30) { S.turn++; v17StreetTick(S); n++; }
    R.strike = { after:n, on:v17Street(S).strike, refused:v17Street(S).refused };

    /* (d) AND A STRIKE STOPS A GOVERNMENT LEGISLATING WITHOUT TOUCHING THE
       CHAMBER AT ALL -- the five instruments S17f's caretaker table already
       names, read by a sibling predicate rather than a second gate layer. */
    R.barred = { policy:!!v17Barred(S, 'policy'), fiscal:!!v17Barred(S, 'fiscal'),
      treaty:!!v17Barred(S, 'treaty'), programme:!!v17Barred(S, 'programme') };
    var ord = V10_ORDERS.filter(function (o) {
      return o.cat !== 'Emergency and territory' && !o.needs && !o.target; })[0];
    var em = V10_ORDERS.filter(function (o) {
      return o.cat === 'Emergency and territory' && !o.needs && !o.target; })[0];
    S.exec[ord.dept] = 'lp'; if (em) S.exec[em.dept] = 'lp';
    R.barred.order = /nobody at the depots/.test(String(v10OrderOpen(S, ord, null, 'lp') || ''));
    /* the exemption is the point: a country between governments and a country
       on strike both still have floods and frontiers */
    R.barred.emergencyOpen = em ? v10OrderOpen(S, em, null, 'lp') === null : true;

    /* (e) THE APPARATUS BREAKS IT, and a government without one waits. */
    var quiet = JSON.parse(JSON.stringify(S));
    POLICIES.filter(function (p) { return p.cat === 'Authority' || p.cat === 'Security'; })
      .forEach(function (p) { S.pol[p.id] = p.max; });
    R.security = Math.round(securityState(S));
    var k = 0, lib0 = S.ind.liberties;
    while (v17Street(S).strike && k < 25) { v17StreetTick(S); k++; }
    R.broken = { after:v17Street(S).strike === 0 ? k : null, liberties:Math.round(lib0 - S.ind.liberties) };
    S = quiet; S = enrichState(S, false);
    var j = 0;
    while (v17Street(S).strike && j < 20) { v17StreetTick(S); j++; }
    R.exhausted = v17Street(S).strike === 0 ? j : null;

    /* (e2) AND A COUNTRY CANNOT BE SHUT TWICE RUNNING. One session is one year.
       Without the rest window the strike's own unrest feed drove the heat that
       started the next one, and a campaign that answered nothing spent 24 to 39
       sessions in a hundred with the government unable to legislate anything --
       the mechanic eating the game rather than pressing on it. */
    R.spent = { pressure:Math.round(v17Street(S).pressure), rest:v17Street(S).rest };
    /* driven where the window BINDS: an abandoned country rebuilds past the
       strike bar inside six sessions, so without the rest it walks out again
       the year after it went back to work. Tested both ways -- no restart
       while the window runs, and a restart once it has run out, because a
       rest that never ends is a country that can only ever strike once. */
    fresh(); S.unrest = 85; BLOCS.forEach(function (b) { S.blocs[b.id] = 8; });
    var g = 0;
    while (!v17Street(S).strike && g < 40) { S.turn++; v17StreetTick(S); g++; }
    while (v17Street(S).strike && g < 60) { S.turn++; v17StreetTick(S); g++; }
    var shutAgain = 0, restWas = v17Street(S).rest;
    for (i = 0; i < restWas; i++) { S.turn++; v17StreetTick(S); if (v17Street(S).strike) shutAgain++; }
    var after = 0, ok2 = false;
    while (after < 10 && !ok2) { S.turn++; v17StreetTick(S); after++; ok2 = !!v17Street(S).strike; }
    R.rested = { shutAgain:shutAgain, window:restWas, thenShut:ok2, thenAfter:after,
      heldAt:Math.round(v17Street(S).pressure) };

    /* (f) AND THE STREET IS SOMETHING AN OPPOSITION CAN STAND WITH, at a price
       the propertied blocs collect. It is the only lever any player has on the
       pressure and it belongs to the side out of office. */
    fresh(); S.ruling = 'fp'; S.coalition = ['fp']; S.unrest = 80;
    for (i = 0; i < 3; i++) v17StreetTick(S);
    var act = ACTIONS.filter(function (a) { return a.id === 'oppositionAttack'; })[0];
    var opt = (act.opts || []).filter(function (o) { return /Stand with the street/.test(o.label); })[0];
    R.opposition = { exists:!!opt, open:standing(S) === 'opposition' && actionOpen(act) };
    if (opt) {
      var p0 = v17Street(S).pressure, tech0 = S.blocs.tech;
      opt.run(S);
      R.opposition.pressure = Math.round(v17Street(S).pressure - p0);
      R.opposition.propertyPaid = S.blocs.tech < tech0;
    }

    /* (g) AND ALL OF IT RUNS OFF THE END OF A SESSION. Every arm above calls
       `v17StreetTick` and so proves the function; whether `endTurn` calls it
       is a separate call site and no amount of calling it here tests that.
       Driven: three real sessions with the country held furious. */
    fresh(); S.unrest = 85;
    try {
      for (i = 0; i < 3 && !S.over; i++) {
        UI.queue = []; UI.busy = false; S.unrest = 85; S.capital = 120;
        endTurn(); UI.queue = [];
      }
    } catch (e) { R.drivenErr = String(e && e.message || e); }
    R.driven = Math.round(v17Street(S).pressure);
    return R;
  });
  const streetOk =
    street.calm === 0 &&
    street.blocOnly.restive === 0 && street.blocOnly.anger > 25 && street.blocOnly.pressure > 0 &&
    street.unrestOnly.anger === 0 && street.unrestOnly.pressure > 0 &&
    street.guarded.guard > 8 && street.guarded.armed < street.guarded.plain &&
    street.builds.length === 5 &&
    street.builds[4] > street.builds[0] && street.demand && street.demand.dated &&
    street.demand.was === 0 && street.papered && street.notOvertaken &&
    street.carried.pressure === 0 && street.carried.gone && street.carried.won === 1 &&
    street.laid.onPaper && street.laid.stands && street.laid.won === 0 &&
    street.paperSilent.gone && street.paperSilent.demandStands &&
    street.paperSilent.refused === 0 && street.paperSilent.wonAfter === 1 &&
    street.strike.on > 0 && street.strike.after > 2 && street.strike.refused > 0 &&
    street.barred.policy && street.barred.fiscal && street.barred.treaty &&
    street.barred.programme && street.barred.order && street.barred.emergencyOpen &&
    street.security > 60 && street.broken.after !== null && street.broken.liberties > 0 &&
    street.exhausted !== null && street.broken.after < street.exhausted &&
    street.spent.pressure === 0 && street.spent.rest > 0 &&
    street.rested.shutAgain === 0 && street.rested.window > 0 && street.rested.thenShut &&
    street.opposition.exists && street.opposition.open &&
    street.opposition.pressure > 0 && street.opposition.propertyPaid &&
    street.driven > 0;
  say(streetOk, 'the street has leverage',
    `UNREST WAS A NUMBER WITH ONE CONSEQUENCE AT THE FAR END OF IT -- it rose, it fell, and at 95 the ` +
    `government fell; between nought and 95 the country could be furious for thirty years and never ask for ` +
    `anything · AND UNREST IS NOT THE DRIVER, which is measured rather than argued: over six hundred played ` +
    `sessions it sits at 24 and tops out at 57, so the first bar of this slice -- 62, picked by eye -- was one ` +
    `the game never reached and the street never spoke once · heat is the BLOC that would carry a movement ` +
    `(${street.blocOnly.anger} of grievance builds ${street.blocOnly.pressure} of pressure at an unrest the old ` +
    `bar called placid, ${street.blocOnly.restive}), plus what unrest adds above the middle of its own range ` +
    `(${street.unrestOnly.pressure} with every bloc content, ${street.unrestOnly.anger}), less what an apparatus ` +
    `takes off (${street.guarded.plain} to ${street.guarded.armed}) -- because a police state does not make ` +
    `people content, it makes organising them hard · a quiet country builds none (${street.calm}) and an ` +
    `abandoned one builds ${street.builds.join(' to ')} · then the angriest bloc puts a MEASURE to the government ` +
    `with a DATE on it ("${street.demand.policy}", at the level it stood when they asked: ${street.demand.was}) ` +
    `and the paper carries the deadline (${street.papered}) · THE DATE IS NOT OVERTAKEN (${street.notOvertaken}): ` +
    `pressure keeps building under a standing demand and at the first ordering it crossed the strike bar two ` +
    `sessions early, so the street shut the country before the session it had asked for an answer by · THE DATE ` +
    `IS ALSO THE ONLY THING THAT DECIDES: laying the bill leaves the demand standing and wins nothing ` +
    `(${street.laid.onPaper}/${street.laid.stands}/${street.laid.won}) where the paper's own button used to book ` +
    `a win the moment the bill went on the paper, and the paper expiring books no refusal ` +
    `(${street.paperSilent.refused}) where \`expireInbox\` -- which runs BEFORE the street's tick in the same ` +
    `session -- used to clear the demand and call it ignored whatever the statute book said (carried after: ` +
    `${street.paperSilent.wonAfter}) · CARRIED, it ends (pressure ${street.carried.pressure}) ` +
    `· REFUSED, the country stops working after ${street.strike.after} sessions, and a general strike is the one ` +
    `thing in this game that stops a government legislating without touching the chamber: the statute, the ` +
    `framework, the treaty, the programme and the ordinary order are all shut (${street.barred.policy}/` +
    `${street.barred.fiscal}/${street.barred.treaty}/${street.barred.programme}/${street.barred.order}) while an ` +
    `order about a flood or a frontier stays open (${street.barred.emergencyOpen}), which is S17f's caretaker ` +
    `table read by a sibling predicate rather than a second gate layer · THE APPARATUS BREAKS IT: at a security ` +
    `state of ${street.security} the depots open under guard in ${street.broken.after} sessions and it costs ` +
    `${street.broken.liberties} of liberties, where a government without one waits ${street.exhausted} for it ` +
    `to run itself out · AND A COUNTRY CANNOT BE SHUT TWICE RUNNING: a spent movement leaves nothing behind ` +
    `(${street.spent.pressure}) and ${street.rested.window} sessions in which asking is free and shutting the ` +
    `country is not -- an ABANDONED country, which rebuilds past the bar inside the window, restarts ` +
    `${street.rested.shutAgain} times while it runs and walks out again ${street.rested.thenAfter} sessions ` +
    `after it ends (${street.rested.thenShut}), because a rest that never lifts is a country that can strike ` +
    `once · without it the strike's own unrest feed drove the heat that began the next one and a campaign that ` +
    `answered nothing was shut for 24 to 39 sessions in a hundred · and STANDING WITH THE STREET is the only ` +
    `lever any player has on the pressure ` +
    `(+${street.opposition.pressure}), it belongs to the side out of office (${street.opposition.open}), and ` +
    `the propertied blocs collect for it (${street.opposition.propertyPaid}) · and all of it runs off the end of ` +
    `a REAL session rather than off this probe's own call: three of them with the country held furious leave the ` +
    `pressure at ${street.driven}${street.drivenErr ? ' (' + street.drivenErr + ')' : ''}`);

  /* ================================================================
     S18a — THE FLOOR IS OPEN TO EVERY CHAIR
     ================================================================ */
  const floor = await page.evaluate(() => {
    const R = {};
    function seat(ruling) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.rngState = 5150; S.ruling = ruling;
      S.coalition = ruling === 'lp' ? ['lp'] : [ruling, 'sd'];
      S.capital = 400; S.treasury = 9000;
      return S;
    }
    function openStatute() {
      return POLICIES.filter(function (x) {
        return policyOpen(S, x) && !(S.pol[x.id] > 0) && !x.needs;
      });
    }
    function cardVerbs(b) {
      return (billCard(b).match(/data-bill-action="([a-zA-Z]+)"/g) || [])
        .map(function (m) { return m.slice(18, -1); }).sort();
    }

    /* (a) THE DOOR. A real click on the card's own button, from the bench.
       S17b opened `draftBillDialog` and left the refusal on `changePolicy`,
       the only function that calls it, and the button rendered `disabled`
       besides -- so the dialog was correct and reachable by nothing. */
    seat('fp'); UI.tab = 'policy'; render();
    const up = document.querySelector('#view [data-pol][data-dir="1"]');
    R.button = { there: !!up, live: !!up && !up.disabled };
    const before = S.bills.length;
    if (up) up.click();
    const draft = document.querySelector('#modal [data-draft="clean"]');
    R.clicked = { sheet: !document.getElementById('modal').hidden, choice: !!draft };
    /* and it is driven all the way to a bill on the paper, by clicking the
       drafting sheet's own button -- an opened sheet proves the door, a bill
       proves the room behind it */
    if (draft) draft.click();
    try { hideSheet(); } catch (e) {}
    const fresh = S.bills.slice(before);
    R.laid = { count: fresh.length,
      owner: fresh.length ? fresh[0].owner : null,
      sponsor: fresh.length ? fresh[0].sponsor : null,
      me: playParty(S) };

    /* (b) ONE AT A TIME. Private members' time is scarce; the cap is the only
       thing that refuses an opposition player, and it is asked where the
       button is drawn as well as where the click lands. */
    seat('fp');
    const s2 = openStatute();
    sponsorBill(S, s2[0].id, 1, 'player', 'clean', true);
    const said2 = [];
    const fb2 = flash; flash = function (m) { said2.push(m); };
    try { changePolicy(s2[1].id, 1); } finally { flash = fb2; }
    R.cap = { refused: document.getElementById('modal').hidden !== false,
      says: /already has a bill before the House/.test(said2.join(' ')) };
    try { hideSheet(); } catch (e) {}
    UI.tab = 'policy'; render();
    const up2 = document.querySelector('#view [data-pol][data-dir="1"]');
    R.cap.buttonShut = !!up2 && up2.disabled;
    R.cap.buttonSaysWhy = !!up2 && /already has a bill before the House/.test(up2.getAttribute('title') || '');

    /* (c) AND IT IS HARDER, by arithmetic rather than by a number on a scale.
       The SAME statute, laid by the player from each chair, read through the
       game's own forecast. */
    function forecastFrom(ruling) {
      seat(ruling);
      const id = openStatute()[0].id;
      const b = sponsorBill(S, id, 1, 'player', 'clean', true);
      if (!b) return null;
      return { lower: Math.round(billForecast(S, b).lower),
        own: Math.round(partyBillSupport(S, playParty(S), b)),
        ruling: Math.round(partyBillSupport(S, S.ruling, b)),
        verbs: cardVerbs(b) };
    }
    R.gov = forecastFrom('lp');
    R.opp = forecastFrom('fp');
    /* and the two terms that paid the opposition, COMPONENT-WISE -- a
       forecast is a sum and either half can carry the other, and both of the
       readings above sit against a party clamped at 98. Two bills identical
       but for the one field the term reads. */
    function ownerTerm(coalition) {
      seat('fp');
      if (coalition) S.coalition = coalition;
      const b = sponsorBill(S, openStatute()[0].id, 1, 'player', 'clean', true);
      if (!b) return null;
      const asOther = Object.assign({}, b, { owner: 'opposition' });
      return Math.round(partyBillSupport(S, S.ruling, b)) -
        Math.round(partyBillSupport(S, S.ruling, asOther));
    }
    /* out of government the ruling party is paid nothing for the bill being
       the player's; in the coalition it is still paid its +8 */
    R.rulingTerm = { opp: ownerTerm(null), junior: ownerTerm(['fp', 'lp']) };
    /* and the declared line is worth nothing on the bill you sponsored --
       sponsoring it IS the line -- while it is still worth its 24 on someone
       else's, which is the reading a test of "the number went down" misses */
    seat('fp');
    const mineB = sponsorBill(S, openStatute()[0].id, 1, 'player', 'clean', true);
    /* the same bill with another party's name on it -- the live `sponsorBill`
       takes six arguments and derives the sponsor, so a seventh would be
       silently dropped and the League would sponsor its own bill again */
    const theirB = mineB ? Object.assign({}, mineB, { owner: 'opposition', sponsor: 'rsf' }) : null;
    function lineWorth(b) {
      return Math.round(partyBillSupport(S, playParty(S), Object.assign({}, b, { playerPosition: 'support' }))) -
        Math.round(partyBillSupport(S, playParty(S), Object.assign({}, b, { playerPosition: null })));
    }
    R.lineTerm = { own: mineB ? lineWorth(mineB) : null, theirs: theirB ? lineWorth(theirB) : null };

    /* (d) THE GOVERNMENT'S INSTRUMENTS ARE THE GOVERNMENT'S. S17b's own
       comment says the card withholds the whip, the Senate deal and the
       committee from a private member's bill. It did not: `canWork` was
       `inPower(S) || b.owner === 'player'`, which GRANTS them. Asked at the
       card AND at the point of effect, because a card can be a session stale. */
    seat('fp');
    const ob = sponsorBill(S, openStatute()[0].id, 1, 'player', 'clean', true);
    const kit = ['whip', 'bargain', 'confidence', 'urgent'];
    R.kitOnCard = kit.filter(function (k) { return cardVerbs(ob).indexOf(k) >= 0; });
    const said3 = [];
    const fb3 = flash; flash = function (m) { said3.push(m); };
    try { kit.forEach(function (k) { billAction(ob.id, k); }); } finally { flash = fb3; }
    R.kitTook = { whip: ob.whip, deal: ob.upperDeal, confidence: !!ob.confidence, urgent: !!ob.urgent };
    R.kitRefusal = /government/.test(said3.join(' '));
    /* the sponsor may still narrow their own bill */
    R.ownVerbs = cardVerbs(ob);
    /* and the appeal the v9 card offers on any bill you laid names WHO made
       it: it called every appellant "the government", so a private member
       going over the government's head read as the government appealing to
       itself */
    billAction(ob.id, 'appeal');
    R.appeal = { log:(S.log[0] || {}).text || '', me:PARTY[playParty(S)].short };

    /* (e) AND THE MONEY IS THE PARTY'S. Pressing another party's sponsor took
       8 from the NATIONAL EXCHEQUER from the opposition bench -- the defect
       S17a fixed at the committee panel, one lever along. */
    seat('fp');
    const gb = sponsorBill(S, openStatute()[0].id, 1, 'government', 'clean', true);
    const t0 = S.treasury, p0 = partyPurse(S, playParty(S));
    billAction(gb.id, 'pressure');
    R.oppMoney = { treasury: t0 - S.treasury, purse: Math.round(p0 - partyPurse(S, playParty(S))) };
    seat('lp');
    const gb2 = sponsorBill(S, openStatute()[0].id, 1, 'opposition', 'clean', true);
    const t1 = S.treasury, p1 = partyPurse(S, playParty(S));
    billAction(gb2.id, 'pressure');
    R.govMoney = { treasury: t1 - S.treasury, purse: Math.round(p1 - partyPurse(S, playParty(S))) };
    /* and a floor verb REFUSED is a floor verb that costs nothing.
       `v17FloorCore` returns a refusal string and neither call site read it,
       so pressing a sponsor over a bill already at assent -- which the deck
       draws all three verbs on, and which is exactly where a bill sits while
       an office declines to sign it -- took the capital and the money, did
       nothing, and logged that it had happened. */
    seat('fp');
    const late = sponsorBill(S, openStatute()[0].id, 1, 'government', 'clean', true);
    late.stage = 'assent';
    const lc = S.capital, lp = partyPurse(S, playParty(S)), llog = S.log.length;
    const said5 = [];
    const fb5 = flash; flash = function (m) { said5.push(m); };
    try { ['support', 'oppose', 'pressure'].forEach(function (v) { billAction(late.id, v); }); }
    finally { flash = fb5; }
    R.late = { capital: lc - S.capital, purse: Math.round(lp - partyPurse(S, playParty(S))),
      logged: S.log.length - llog, lines: late.lines ? Object.keys(late.lines).length : 0,
      says: /past the floor/.test(said5.join(' ')) };

    /* (f) THE OTHER TWO DOORS ON THE SAME PAGE. The dossier is the game's
       considered view of a statute and its draft buttons were not disabled
       for an opposition player, they were never EMITTED; and the
       "Worth drafting now" fold -- a reading of the statute book against your
       own platform -- was hidden from the chair that most needs it. Both read
       the one predicate now, so both are asked here. */
    seat('fp');
    const dossierId = openStatute()[0].id;
    v9Dossier(dossierId);
    R.dossier = { open: !!document.querySelector('#modal [data-v9dossier-draft]') };
    try { hideSheet(); } catch (e) {}
    sponsorBill(S, dossierId, 1, 'player', 'clean', true);
    /* a DIFFERENT statute, or the refusal would be "a bill on that measure is
       already before Parliament" rather than the private members' cap */
    v9Dossier(openStatute().filter(function (x) { return x.id !== dossierId; })[0].id);
    /* S18b: DRAWN AND DISABLED, NOT WITHHELD. It used to emit nothing, so the
       sheet that explains a statute could not explain why you may not lay it. */
    var db = document.querySelector('#modal [data-v9dossier-draft]');
    R.dossier.capped = !!db && !!db.disabled &&
      /already has a bill before the House/.test(db.getAttribute('title') || '');
    try { hideSheet(); } catch (e) {}
    seat('fp'); UI.tab = 'policy'; render();
    R.rec = { opp: !!document.querySelector('#view details.rec') };
    seat('lp'); UI.tab = 'policy'; render();
    R.rec.gov = !!document.querySelector('#view details.rec');
    /* AND THE PAGE SAYS WHAT THE GAME DOES. Two panels told the player in the
       game's own voice that the instrument does not exist, and they are the
       sentences the owner read before reporting that it did not. */
    function panelText(tab, heading) {
      UI.tab = tab; render();
      var h = Array.prototype.filter.call(document.querySelectorAll('#view h2'),
        function (x) { return x.textContent.trim() === heading; })[0];
      return h && h.parentNode ? h.parentNode.textContent.replace(/\s+/g, ' ') : '';
    }
    seat('fp');
    R.panels = { opp: panelText('overview', 'You Are in Opposition'),
      party: panelText('parties', 'Your Party and Its Agenda') };

    /* (g) AND KILLING A BILL IS THE GOVERNMENT'S, NOT A SEAT COUNT'S.
       `outright` asks whether the PLAYER'S party is above half the Assembly,
       and S17f made being frozen out of a majority a thing that happens -- so
       a party with the seats and no office could take a bill off the paper.
       Taking it off the paper is control of the paper. Both are asked now, so
       the arm builds the chair that tells them apart. */
    function majorityBench(ruling, owner) {
      seat(ruling);
      PARTIES.forEach(function (q) { S.seats[q.id] = 4; });
      S.seats.lp = CFG.seats - 4 * (PARTIES.length - 1);
      return sponsorBill(S, openStatute()[0].id, 1, owner, 'clean', true);
    }
    const frozen = majorityBench('fp', 'government');
    R.kill = { outright: outright(S), standing: standing(S),
      onCard: cardVerbs(frozen).indexOf('kill') >= 0 };
    const said4 = [];
    const fb4 = flash; flash = function (m) { said4.push(m); };
    try { billAction(frozen.id, 'kill'); } finally { flash = fb4; }
    R.kill.refused = /government/.test(said4.join(' '));
    R.kill.stillOnPaper = S.bills.some(function (x) { return x.id === frozen.id; });
    const held = majorityBench('lp', 'opposition');
    R.kill.govOutright = outright(S);
    R.kill.govOnCard = cardVerbs(held).indexOf('kill') >= 0;
    return R;
  });
  const floorOk =
    floor.button.there && floor.button.live && floor.clicked.sheet && floor.clicked.choice &&
    floor.laid.count === 1 && floor.laid.owner === 'player' && floor.laid.sponsor === floor.laid.me &&
    floor.cap.refused && floor.cap.says && floor.cap.buttonShut && floor.cap.buttonSaysWhy &&
    floor.gov && floor.opp && floor.opp.lower < floor.gov.lower &&
    floor.rulingTerm.opp === 0 && floor.rulingTerm.junior === 8 &&
    floor.lineTerm.own === 0 && floor.lineTerm.theirs >= 20 &&
    floor.kitOnCard.length === 0 && floor.kitRefusal &&
    floor.kitTook.whip === 0 && floor.kitTook.deal === 0 &&
    !floor.kitTook.confidence && !floor.kitTook.urgent &&
    floor.ownVerbs.indexOf('amend') >= 0 &&
    floor.appeal.log.indexOf(floor.appeal.me + ' appealed') === 4 &&
    floor.appeal.log.indexOf('The government appealed') < 0 &&
    floor.oppMoney.treasury === 0 && floor.oppMoney.purse > 0 &&
    floor.govMoney.treasury > 0 && floor.govMoney.purse === 0 &&
    floor.dossier.open && floor.dossier.capped && floor.rec.opp && floor.rec.gov &&
    floor.late.capital === 0 && floor.late.purse === 0 && floor.late.logged === 0 &&
    floor.late.lines === 0 && floor.late.says &&
    floor.panels.opp.indexOf('cannot move a measure') < 0 &&
    /private member/.test(floor.panels.opp) && /private member/.test(floor.panels.party) &&
    floor.kill.outright && floor.kill.standing === 'opposition' &&
    !floor.kill.onCard && floor.kill.refused && floor.kill.stillOnPaper &&
    floor.kill.govOutright && floor.kill.govOnCard;
  say(floorOk, 'the floor is open to every chair',
    `THE OWNER COULD NOT LAY A BILL FROM OPPOSITION IN THE SHIPPED BUILD, and the reason is this file's oldest ` +
    `lesson wearing a new coat: S17b opened \`draftBillDialog\` and \`v11CanPropose\`, and left the refusal on ` +
    `\`changePolicy\` -- the ONLY function that calls the dialog -- with the card's button rendering \`disabled\` ` +
    `besides. The door was correct and reachable by nothing · a real click on the card's own button from the ` +
    `bench opens the drafting sheet and its own Introduce button puts ${floor.laid.count} bill on the paper, `+
    `owner '${floor.laid.owner}', sponsored by ${floor.laid.sponsor} · ONE AT A TIME, because ` +
    `private members' time is scarce: with one on the paper the second is refused (${floor.cap.refused}) and the ` +
    `button says why rather than dying silently (${floor.cap.buttonSaysWhy}) · AND IT IS HARDER, by arithmetic ` +
    `and not by a number on a scale. The same statute, laid by the player: ${floor.gov.lower} from government ` +
    `against ${floor.opp.lower} from opposition, where it used to be 39 against 41 -- the government's own ` +
    `bill was the harder one. Two terms paid the opposition for being there, and both are read here COMPONENT-WISE ` +
    `-- on two bills identical but for the one field the term reads -- because a forecast is a sum, either half ` +
    `can carry the other, and the party the old reading compared against sits clamped at 98. The ruling party ` +
    `was paid +8 to back any bill whose OWNER was 'player', whichever chair the player sat in: being the ` +
    `player's bill is worth ${floor.rulingTerm.opp} to the government now when the player is out of it, and ` +
    `still ${floor.rulingTerm.junior} when the player is in the coalition, which is what the term was for. And ` +
    `the player's party was counted twice for its own bill -- +19 as sponsor and +24 again for a line ` +
    `\`sponsorBill\` stamps on automatically -- which is the S17k mistake in a second place: the declared line ` +
    `is worth ${floor.lineTerm.own} on the bill you sponsored, where sponsoring it IS the line, and still ` +
    `${floor.lineTerm.theirs} on somebody else's · THE ` +
    `GOVERNMENT'S INSTRUMENTS ARE THE GOVERNMENT'S: the whip, the Senate deal, the confidence motion and urgent ` +
    `procedure are off the card (${floor.kitOnCard.length} of four) and refused at the point of effect ` +
    `(${floor.kitRefusal}), where S17b's own comment claimed \`canWork\` withheld them and it read ` +
    `\`inPower(S) || b.owner === 'player'\`, which grants them. What a private member keeps is the floor, the ` +
    `arithmetic and their own bill: ${floor.ownVerbs.join(', ')}, and the appeal to the country now names who ` +
    `made it -- "${floor.appeal.log.slice(0, 46)}", where it called every appellant "the government" and a ` +
    `private member going over the government's head read as the government appealing to itself · and THE ` +
    `MONEY IS THE PARTY'S: pressing a ` +
    `sponsor from the bench costs the purse ${floor.oppMoney.purse} and the exchequer ${floor.oppMoney.treasury}, ` +
    `where the same click in government costs the exchequer ${floor.govMoney.treasury} and the purse ` +
    `${floor.govMoney.purse} · THE OTHER TWO DOORS ON THE SAME PAGE went the same way: the dossier's draft ` +
    `buttons were never emitted from the bench rather than disabled (${floor.dossier.open} now, and drawn shut with ` +
    `the reason on them when the cap bites at ${floor.dossier.capped}), and "Worth drafting now" -- a reading of the ` +
    `statute book against your own ` +
    `platform, which is no government instrument -- was hidden wholesale from the chair that most needs it ` +
    `(${floor.rec.opp} from opposition, ${floor.rec.gov} in government) · A FLOOR VERB REFUSED COSTS NOTHING: ` +
    `\`v17FloorCore\` returns a refusal string and neither call site read it, so support, oppose and press on a ` +
    `bill already at assent -- which the deck draws all three verbs on, and which is exactly where a bill sits ` +
    `while an office declines to sign it -- took the capital and the money, did nothing to the bill, and wrote ` +
    `a line in the log saying it had happened. Three clicks now cost ${floor.late.capital} capital and ` +
    `${floor.late.purse} from the purse, write ${floor.late.lines} lines on the bill and ${floor.late.logged} ` +
    `in the log, and say why (${floor.late.says}) · AND THE PAGE SAYS WHAT THE GAME DOES: the opposition panel ` +
    `and the party page both read "you cannot move a measure", which is the sentence the owner read before ` +
    `reporting that they could not · and KILLING A BILL IS A GOVERNMENT'S: ` +
    `\`outright\` asks whether the PLAYER'S party is above half the Assembly, which S17f made a thing you can be ` +
    `frozen out of holding, so a party with the seats and no office could take a bill off the paper. On a bench ` +
    `with ${floor.kill.outright ? 'the majority' : 'no majority'} and standing '${floor.kill.standing}' the verb ` +
    `is off the card (${!floor.kill.onCard}), refused at the handler (${floor.kill.refused}) and the bill is ` +
    `still on the paper (${floor.kill.stillOnPaper}); the same majority in government keeps it ` +
    `(${floor.kill.govOnCard})`);

  /* ================================================================
     S18b — NO CONTROL LIES, IN ANY CHAIR
     ================================================================
     THE ASSERTION THIS REPO DID NOT HAVE, and the reason five separate
     slices shipped the same defect. Every gate in this harness CALLS A
     FUNCTION, and a player PRESSES A BUTTON. So S17b could grade fourteen
     region handlers by chair and never touch the three emitters; S18a could
     withhold urgent procedure at the card and leave it free at the sheet;
     S12 could teach `policyWhy` to say "Requires X." and leave 37 buttons
     lit that no card could explain.
     This walks every page in every chair, presses every enabled control that
     spends nothing it cannot get back, and asks the only question that
     catches the whole family: DID PRESSING IT DO ANYTHING? An enabled
     control that only flashes a refusal is a lie, and a disabled control
     with no title is a dead end. */
  const honest = await page.evaluate(() => {
    const R = { chairs: {} };
    /* the surfaces where a refusal is a REFUSAL rather than a cost or a
       cooldown: these are the ones a chair gate reaches */
    const SEL = '[data-pol],[data-region-action],[data-governor-action],[data-art],[data-draft]';
    function seat(chair) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.rngState = 8181; S.capital = 900; S.treasury = 9000;
      if (chair === 'opposition') { S.ruling = 'fp'; S.coalition = ['fp', 'sd']; }
      if (chair === 'junior')     { S.ruling = 'fp'; S.coalition = ['fp', 'lp']; }
      if (chair === 'leading')    { S.ruling = 'lp'; S.coalition = ['lp']; }
      if (S.purse) S.purse[playParty(S)] = 400;
    }
    ['opposition', 'junior', 'leading'].forEach(function (chair) {
      seat(chair);
      const out = { standing: standing(S), enabled: 0, dead: [], muteShut: [] };
      TABS.map(function (t) { return t.id; }).forEach(function (tab) {
        UI.tab = tab; render();
        const all = Array.prototype.slice.call(document.querySelectorAll('#view ' + SEL));
        all.forEach(function (el, i) {
          const label = ((el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24)) || el.getAttribute('data-pol') || '?';
          if (el.disabled) {
            /* shut is fine; shut with nothing on it is a dead end */
            if (!(el.getAttribute('title') || '').trim()) out.muteShut.push(tab + '/' + label);
            return;
          }
          out.enabled++;
          /* press it on a FRESH board every time, so one click cannot pay for
             the next and a cooldown cannot masquerade as a refusal */
          const before = JSON.stringify([S.pol, S.bills.length, S.regions, S.capital,
            S.treasury, v11Con(S).pending.length, S.regionCooldown]);
          const said = [];
          const fb = flash; flash = function (m) { said.push(m); };
          let threw = null;
          try { el.click(); } catch (e) { threw = String(e && e.message || e); } finally { flash = fb; }
          try { hideSheet(); } catch (e) {}
          const sheetOpened = document.getElementById('modal') && !document.getElementById('modal').hidden;
          const after = JSON.stringify([S.pol, S.bills.length, S.regions, S.capital,
            S.treasury, v11Con(S).pending.length, S.regionCooldown]);
          /* an enabled control that moved nothing, opened nothing and spoke a
             refusal is the shape this assertion exists to catch */
          if (before === after && !sheetOpened && said.length && !threw) {
            out.dead.push(tab + '/' + label + ' -> "' + said[0].slice(0, 40) + '"');
          }
          /* re-seat only when the click actually moved something: a fresh
             board per control costs a newGame and a render each, and the
             overwhelming majority of presses change nothing */
          if (before !== after || sheetOpened) { seat(chair); }
          UI.tab = tab; render();
        });
      });
      R.chairs[chair] = out;
    });
    /* AND THE CONTENT, NOT ONLY THE CONSISTENCY. The check above asks whether
       the button and the handler agree, and one predicate serving both makes
       them agree even when both are wrong. These ask what the answers must
       actually BE, so a poison that unwires the rule reddens here even though
       the card and the handler still say the same thing as each other. */
    seat('leading');
    R.needs = { total: 0, lit: 0, told: 0 };
    UI.tab = 'policy'; render();
    POLICIES.forEach(function (p) {
      if (!p.needs || (S.pol[p.needs] || 0) > 0 || !policyOpen(S, p)) return;
      R.needs.total++;
      var el = document.querySelector('#view [data-pol="' + p.id + '"][data-dir="1"]');
      if (!el) return;
      if (!el.disabled) R.needs.lit++;
      if (/Requires /.test(el.getAttribute('title') || '')) R.needs.told++;
    });
    /* the owner's own screen: session one of the Hung Assembly start */
    S = enrichState(v6NewGame('normal', 'hungAssembly', 'standard', 'lp'), false);
    S.rngState = 8181; S.capital = 400;
    UI.tab = 'policy'; render();
    var care = (typeof v17Barred === 'function') ? v17Barred(S, 'policy') : null;
    var drafts = Array.prototype.slice.call(document.querySelectorAll('#view [data-pol]'));
    R.caretaker = { barred: !!care, buttons: drafts.length,
      lit: drafts.filter(function (x) { return !x.disabled; }).length,
      /* SOME reason, not THE caretaker reason: `v18DraftWhy` answers with the
         most specific one it has, so a statute whose prerequisite is unmet
         says "Requires X." there and is right to. */
      told: drafts.filter(function (x) { return (x.getAttribute('title') || '').trim().length > 0; }).length,
      saysCare: drafts.filter(function (x) { return /caretaker/i.test(x.getAttribute('title') || ''); }).length };
    /* and the tag on the same page speaks from the player's chair */
    R.deptTag = { mine: 0, theirs: 0, wrong: 0 };
    POLICIES.forEach(function (p) {
      if (!p.dept) return;
      var mine = officeMine(S, p.dept), gov = holdsDept(S, p.dept);
      if (mine) R.deptTag.mine++; else R.deptTag.theirs++;
      if (gov && !mine) R.deptTag.wrong++;
    });
    var lit = document.querySelector('#view [data-pol][data-dir="1"]:not([disabled])');
    R.deptTagSample = null;
    var anyDept = POLICIES.filter(function (p) { return p.dept && holdsDept(S, p.dept) && !officeMine(S, p.dept); })[0];
    if (anyDept) {
      var card = document.querySelector('#view [data-pol="' + anyDept.id + '"]');
      var art = card && card.closest ? card.closest('.card') : null;
      R.deptTagSample = art ? /\(opposed\)/.test(art.textContent) : null;
    }
    /* and the drafting sheet obeys the rule the card announces */
    seat('opposition');
    UI.tab = 'policy'; render();
    var up = document.querySelector('#view [data-pol][data-dir="1"]:not([disabled])');
    R.sheet = { opened: false, urgent: null, clean: '' };
    if (up) {
      up.click();
      R.sheet.opened = !document.getElementById('modal').hidden;
      var urg = document.querySelector('#modal [data-draft="urgent"]');
      R.sheet.urgent = !!urg;
      R.sheet.clean = (document.querySelector('#modal [data-draft="clean"]') || { textContent:'' }).textContent.slice(0, 40);
      try { hideSheet(); } catch (e) {}
    }
    return R;
  });
  const seats3 = ['opposition', 'junior', 'leading'];
  const deadTotal = seats3.reduce((n, c) => n + honest.chairs[c].dead.length, 0);
  const muteTotal = seats3.reduce((n, c) => n + honest.chairs[c].muteShut.length, 0);
  const firstDead = seats3.map(c => honest.chairs[c].dead[0]).filter(Boolean)[0] || '';
  const firstMute = seats3.map(c => honest.chairs[c].muteShut[0]).filter(Boolean)[0] || '';
  const contentOk = honest.needs.total > 0 && honest.needs.lit === 0 && honest.needs.told === honest.needs.total &&
    honest.caretaker.barred && honest.caretaker.lit === 0 &&
    honest.caretaker.told === honest.caretaker.buttons && honest.caretaker.saysCare > 0 &&
    honest.deptTag.wrong > 0 && honest.deptTagSample === true &&
    honest.sheet.opened && honest.sheet.urgent === false && /private member/.test(honest.sheet.clean);
  say(deadTotal === 0 && muteTotal === 0 && contentOk, 'no control lies, in any chair',
    `EVERY GATE IN THIS HARNESS CALLS A FUNCTION AND A PLAYER PRESSES A BUTTON, which is how five separate ` +
    `slices shipped the same defect: S17b graded fourteen region handlers by chair and never touched the three ` +
    `emitters (128 enabled-but-dead controls from the bench), S18a withheld urgent procedure at the card and ` +
    `left it free at the drafting sheet one click earlier, and S12 taught \`policyWhy\` to say "Requires X." ` +
    `while 37 statutes rendered lit, priced and forecast buttons no card could explain · this walks all fifteen ` +
    `pages from all three chairs, presses every enabled statute, region, governor, article and drafting control ` +
    `on a FRESH board each time, and asks the one question that catches the family: did pressing it do ` +
    `anything · ${honest.chairs.opposition.enabled} live controls in opposition, ` +
    `${honest.chairs.junior.enabled} as a junior partner, ${honest.chairs.leading.enabled} in government, and ` +
    `${deadTotal} of them move nothing and only flash a refusal${firstDead ? ' (' + firstDead + ')' : ''} · and ` +
    `${muteTotal} shut controls carry no reason at all${firstMute ? ' (' + firstMute + ')' : ''}, which is the ` +
    `dead end this file bans in the other direction: a control the player cannot press and cannot be told why · AND ` +
    `THE CONTENT, not only the consistency, because one predicate serving both the button and the handler makes ` +
    `them agree even when both are wrong: of ${honest.needs.total} statutes whose prerequisite is unmet, ` +
    `${honest.needs.lit} render lit and ${honest.needs.told} carry "Requires" in the title, where the card could ` +
    `not reach that sentence at all since S12 · on session one of the Hung Assembly start -- the owner's own ` +
    `screen -- the caretaker bar refuses every draft (${honest.caretaker.barred}) and ` +
    `${honest.caretaker.lit} of ${honest.caretaker.buttons} buttons render lit, where 493 did, with a reason on all ` +
    `${honest.caretaker.told} of them and the caretaker's own sentence on ${honest.caretaker.saysCare} · the department ` +
    `tag on the same page asks the PLAYER'S question: ${honest.deptTag.wrong} statutes sit at an office the ` +
    `government holds and the player does not, and the card marks one "(opposed)" ` +
    `(${honest.deptTagSample}) where it used to mark it green · and the drafting sheet offers a private member ` +
    `no urgent procedure (${honest.sheet.urgent}) and calls the bill what it is ("${honest.sheet.clean.trim()}")`);

  /* ================================================================
     S18c — THE SECOND DECISION SURFACE
     ================================================================
     S17c routed the 174 turn events by office and the political papers went
     round the back of it: produced by `politicsTick`, charged for by
     `expireInbox`, rendered on the landing page every session, and never
     asked which chair the player sits in. */
  const inboxes = await page.evaluate(() => {
    const R = {};
    function seat(chair, ruling) {
      S = enrichState(v6NewGame('normal', 'v6default', 'standard', 'lp'), false);
      S.rngState = 3131; S.capital = 400; S.treasury = 9000;
      if (chair === 'opposition') { S.ruling = 'fp'; S.coalition = ['fp', 'sd']; }
      if (chair === 'junior')     { S.ruling = 'fp'; S.coalition = ['fp', 'lp']; }
      if (chair === 'leading')    { S.ruling = 'lp'; S.coalition = ['lp', 'sd']; }
    }
    /* drive real sessions and record what each chair is ASKED */
    function run(chair, n) {
      seat(chair);
      /* the opening seed runs inside `v6NewGame`, before the chair is pinned,
         so its two papers would be counted once per session they sit unread */
      S.inbox = [];
      const kinds = {}, senders = {};
      for (var i = 0; i < n; i++) {
        S.capital = 400;
        try { endTurn(); } catch (e) { R.err = String(e).slice(0, 80); }
        UI.queue = []; UI.busy = false;
        /* RE-PIN THE CHAIR. Ballots fall inside 26 sessions and move the
           player between chairs, so a run that seats once and drives on is
           tallying two or three chairs under one name -- which is how six
           head-of-government papers appeared in the opposition column. */
        if (chair === 'opposition') { S.ruling = 'fp'; S.coalition = ['fp', 'sd']; }
        if (chair === 'junior')     { S.ruling = 'fp'; S.coalition = ['fp', 'lp']; }
        if (chair === 'leading')    { S.ruling = 'lp'; S.coalition = ['lp', 'sd']; }
        (S.inbox || []).forEach(function (it) {
          kinds[it.type] = (kinds[it.type] || 0) + 1;
          /* `faction_demand` carries the player's own party by design -- a
             caucus writing to its own leadership is not the defect. The
             defect is a COALITION paper from the player's own benches. */
          if (it.from === playParty(S) &&
              ['coalition_demand', 'confidence_threat', 'coalition_review'].indexOf(it.type) >= 0) {
            senders.self = (senders.self || 0) + 1;
          }
        });
      }
      /* asserting one NAMED type appear in office is brittle: `politicsTick`
         returns at the first branch that fires, so a coalition demand
         pre-empts the governors most sessions. What must be true is that no
         paper belonging to the head of government reaches a chair that does
         not lead. */
      var leadOnly = Object.keys(kinds).filter(function (t) {
        return V18_PAPER_NEED[t] === 'leading';
      }).reduce(function (n, t) { return n + kinds[t]; }, 0);
      return { kinds: kinds, fromSelf: senders.self || 0, leadOnly: leadOnly,
        total: Object.keys(kinds).reduce(function (n, t) { return n + kinds[t]; }, 0) };
    }
    R.opp = run('opposition', 26);
    R.jun = run('junior', 26);
    R.gov = run('leading', 26);
    /* and a paper from an old save is still answerable, but only from the
       chair it belongs to: the gate is on the button AND at the handler */
    seat('opposition');
    addInbox(S, { type:'governors_conference', from:null, deadline:S.turn + 2,
      title:'The Fifty Governors Call for a Conference', body:'x' });
    UI.tab = 'chamber'; render();
    const btn = document.querySelector('#view [data-inbox]');
    R.oldPaper = { drawn: !!btn, shut: !!btn && !!btn.disabled,
      why: btn ? (btn.getAttribute('title') || '').slice(0, 40) : '' };
    const crown0 = S.crown, cap0 = S.capital;
    const said = [];
    const fb = flash; flash = function (m) { said.push(m); };
    try { respondInbox(S.inbox[S.inbox.length - 1].id, 'compact'); } finally { flash = fb; }
    R.oldPaper.moved = Math.round((S.crown - crown0) * 100) / 100;
    R.oldPaper.spent = Math.round((cap0 - S.capital) * 100) / 100;
    R.oldPaper.refused = said.join(' ').slice(0, 90);
    /* AND THE DESPATCH BOX. Question Time asked `inPower`, so a junior was
       handed the government's brief with the senior partner's leader named in
       the question. */
    R.qt = {};
    ['opposition', 'junior', 'leading'].forEach(function (chair) {
      seat(chair);
      S.v8.qt.turn = -1;
      v8EnsureQuestion(S);
      UI.tab = 'chamber'; render();
      const view = document.getElementById('view').textContent.replace(/\s+/g, ' ');
      R.qt[chair] = { kind: S.v8.qt.kind || (S.v8.qt.pending ? '(pending)' : '(none)'),
        yours: /The question is yours/.test(view),
        answering: /asks/.test(view) };
    });
    return R;
  });
  const inboxesOk =
    inboxes.opp.leadOnly === 0 && inboxes.jun.leadOnly === 0 && inboxes.gov.leadOnly > 0 &&
    inboxes.opp.total > 0 && inboxes.jun.total > 0 &&
    inboxes.jun.fromSelf === 0 && inboxes.opp.fromSelf === 0 &&
    inboxes.oldPaper.drawn && inboxes.oldPaper.shut && inboxes.oldPaper.moved === 0 &&
    inboxes.oldPaper.spent === 0 && /opposition/.test(inboxes.oldPaper.refused) &&
    inboxes.qt.leading.answering && !inboxes.qt.leading.yours &&
    inboxes.qt.junior.yours && inboxes.qt.opposition.yours;
  say(inboxesOk, 'the papers know which chair you sit in',
    'THE POLITICAL PAPERS WENT ROUND THE BACK OF S17c. It routed all 174 turn events by office so an opposition ' +
    'player decides nothing that is not theirs, and this second surface -- produced every session by politicsTick, ' +
    'charged for by expireInbox, drawn on the landing page -- asked nothing about the chair at all. A real click ' +
    'from the bench on "The Fifty Governors Call for a Conference" moved the national State-governments indicator ' +
    'by +13, and one of its three answers is "send the responsible minister" to a player who has no minister. ' +
    'Driven 26 sessions from each chair: the post that belongs to a head of government reaches one, ' +
    inboxes.gov.leadOnly + ' papers, and reaches nobody else -- ' + inboxes.opp.leadOnly + ' from the bench and ' +
    inboxes.jun.leadOnly + ' as a junior, out of the ' + inboxes.opp.total + ' and ' + inboxes.jun.total +
    ' papers those chairs do get, because what is asserted is which post arrives and not whether any does ' +
    '\u00b7 AND THE COALITION PAPERS HAD THE ' +
    'MIRROR DEFECT: gated on inPower, which includes a junior, and computing the partner as everyone in the ' +
    'coalition who is not the ruling party -- which in a two-party coalition IS the player -- so a junior partner ' +
    'received demands and confidence threats from their own benches. Papers written by the player\'s own party to ' +
    'the player: ' + inboxes.jun.fromSelf + ' as a junior, ' + inboxes.opp.fromSelf + ' in opposition \u00b7 A ' +
    'PAPER IN AN OLD SAVE IS STILL DRAWN (' + inboxes.oldPaper.drawn + ') rather than discarded, because a save ' +
    'that loses something quietly is the worst failure this file knows -- but it is drawn SHUT (' +
    inboxes.oldPaper.shut + ') with the reason on it, and the handler refuses too: the indicator moved ' +
    inboxes.oldPaper.moved + ' and the click cost ' + inboxes.oldPaper.spent + ' \u00b7 AND THE DESPATCH BOX: ' +
    'Question Time asked inPower, so a junior answered the CHANCELLOR\'s brief with the senior partner\'s leader ' +
    'named in the question. The party that leads answers (' + inboxes.qt.leading.answering + '); a junior asks (' +
    inboxes.qt.junior.yours + '), like the opposition (' + inboxes.qt.opposition.yours + ')');

  /* ================================================================
     S18e — THE AI ACTS WHEN IT HAS A REASON TO
     ================================================================
     `docs/AUDIT-S17.md` measured 125 AI initiatives at HEAD against 126 on the
     pre-S17 build and concluded S17 had added no AI activity at all. It had
     not gone far enough: the rate was not merely unchanged, it was a CONSTANT.
     Sixty sessions, five seeds, three chairs -- six parties, fifteen
     initiatives each, every time, because `(st.turn + hash) % 4` is not a
     draw. This assertion asks the two halves separately, because they pull
     against each other: the budget must be HELD (it is the owner's dial, swept
     over six seeds, and its own comment records that moving it costs the
     harness four elections in five) while the SPREAD must open. */
  const ai = await page.evaluate(() => {
    const R = {};
    /* PINNING `rngState` AFTER `newGame` DOES NOT PIN THE REPUBLIC `newGame`
       BUILT. `mintSeed` reads `Date.now()` deliberately -- the one thing that
       must not be seeded is the choice of seed -- so every call built a
       different board, with different leaders, purses and figures, and only
       the dice FROM THAT POINT were fixed. This assertion counts initiatives,
       which depend on the board, so it failed on one run in three of the SAME
       build. `SEED_OVERRIDE` is the instrument: it pins the republic, and
       `newGame` consumes it, so it is set before every call. */
    function fresh(seed, me) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', me || 'lp'), false);
      S.rngState = seed;
      return S;
    }
    function drive(n) {
      for (let t = 0; t < n; t++) {
        UI.queue = []; UI.busy = false;
        try { endTurn(); } catch (e) { return e.message; }
        UI.queue = []; UI.busy = false;
      }
      return null;
    }
    /* count through the deck's own `run`, restored after every arm: an
       instrument left installed changes the next arm's measurement */
    function counting(fn) {
      const saved = V16_AI_DECK.map(c => c.run);
      const tally = { total:0, byParty:{}, byCard:{} };
      V16_AI_DECK.forEach((c, i) => {
        c.run = function (st, pid) {
          tally.total++;
          tally.byParty[pid] = (tally.byParty[pid] || 0) + 1;
          tally.byCard[c.id] = (tally.byCard[c.id] || 0) + 1;
          return saved[i].call(this, st, pid);
        };
      });
      try { fn(); } finally { V16_AI_DECK.forEach((c, i) => { c.run = saved[i]; }); }
      return tally;
    }

    /* (a) THE BUDGET IS HELD. The odds of the whole board are normalised
       against each other, so the expected number of parties moving in a
       session is exactly what the modulus gave. Read the SUM, not the outcome:
       a run that happens to come in at 90 proves nothing about the rule. */
    fresh(20260829);
    R.oddsSum = []; R.live = 0;
    for (let t = 0; t < 12; t++) {
      const live = PARTIES.filter(q => q.id !== playParty(S) && !S.banned[q.id]);
      R.live = live.length;
      let s = 0; live.forEach(q => { s += v18TempoOdds(S, q.id); });
      R.oddsSum.push(+s.toFixed(4));
      UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) { break; }
      UI.queue = []; UI.busy = false;
    }
    R.budget = +(R.live / V16_AI_CADENCE).toFixed(4);
    R.budgetHeld = R.oddsSum.every(x => Math.abs(x - R.budget) < 1e-6);

    /* (b) AND THE SPREAD OPENS. Five seeds, sixty sessions each. Under the
       modulus every party took exactly the same number on every seed; the
       assertion is that they no longer do, and that the TOTAL still sits
       around the budget. Both halves, or "more spread" would pass on a build
       that simply let everybody act every session. */
    const totals = [], spreads = [];
    [20260829, 771144, 424242, 999331, 5150].forEach(sd => {
      const tally = counting(() => { fresh(sd); drive(60); });
      const vals = PARTIES.map(p => tally.byParty[p.id] || 0)
        .filter((v, i) => PARTIES[i].id !== 'lp');
      totals.push(tally.total);
      spreads.push(Math.max.apply(null, vals) - Math.min.apply(null, vals));
    });
    R.totals = totals;
    R.spreads = spreads;
    R.meanTotal = +(totals.reduce((a, c) => a + c, 0) / totals.length).toFixed(1);
    R.expected = 60 * R.budget;
    /* the mean sits within a tenth of the budget; a single seed can and does
       land 5 either side, which is what a draw looks like and a modulus does
       not */
    R.totalHeld = Math.abs(R.meanTotal - R.expected) <= R.expected * .10;
    R.spreadOpen = spreads.every(s => s >= 4);

    /* (c) AND CIRCUMSTANCE IS WHAT MOVES IT. Change ONE thing about one party
       on an otherwise identical board and read its odds either side. A test
       that only says "the odds differ between parties" would pass on a build
       that keyed them to the party id. */
    R.terms = {};
    const P = 'cup';
    function oddsWith(mut) {
      fresh(4242);
      /* out of the coalition, so the coalition branch is not what moves it */
      S.coalition = [S.ruling];
      if (mut) mut();
      return +v18TempoOdds(S, P).toFixed(5);
    }
    const flat = oddsWith(null);
    R.terms.flat = flat;
    R.terms.rich = oddsWith(() => { S.purse = S.purse || {}; S.purse[P] = 900; });
    R.terms.broke = oddsWith(() => { S.purse = S.purse || {}; S.purse[P] = 0; });
    R.terms.angry = oddsWith(() => { v16Resent(S, P, S.ruling, 90); });
    R.terms.losing = oddsWith(() => { v16Ai(S)[P].lastSeats = (S.seats[P] || 0) + 40; });
    R.termsMove = R.terms.rich > flat && R.terms.broke < flat &&
      R.terms.angry > flat && R.terms.losing > flat;

    /* (d) A PARTNER THAT HAS HAD ENOUGH. The same party, the same seed, the
       same grudge, inside the government and outside it. Without the control
       arm "it attacked" would pass on a build where every party attacks. */
    function attacksBy(pid, inside) {
      let n = 0;
      const saved = V16_AI_DECK.map(c => c.run);
      const atk = V16_AI_DECK.filter(c => c.id === 'attack')[0];
      const base = atk.run;
      atk.run = function (st, who) { if (who === pid) n++; return base.call(this, st, who); };
      try {
        fresh(771144);
        if (!inside) S.coalition = [S.ruling];
        for (let t = 0; t < 40; t++) {
          /* topped up every session, because grudges cool by .6 and a probe
             that lets it decay measures the decay */
          v16Resent(S, pid, S.ruling, 100);
          S.purse = S.purse || {}; S.purse[pid] = Math.max(S.purse[pid] || 0, 400);
          UI.queue = []; UI.busy = false;
          try { endTurn(); } catch (e) { break; }
          UI.queue = []; UI.busy = false;
        }
      } finally { V16_AI_DECK.forEach((c, i) => { c.run = saved[i]; }); }
      return n;
    }
    fresh(771144);
    R.partnerId = (S.coalition || []).filter(x => x !== S.ruling && x !== playParty(S))[0] || 'rsf';
    R.restive = {};
    fresh(771144);
    v16Resent(S, R.partnerId, S.ruling, 100);
    R.restive.predicate = !!v18Restive(S, R.partnerId);
    R.restive.posture = v16Posture(S, R.partnerId);
    R.restive.cardOpens = (function () {
      S.purse = S.purse || {}; S.purse[R.partnerId] = 900;
      const c = V16_AI_DECK.filter(x => x.id === 'attack')[0];
      try { return !!c.can(S, R.partnerId); } catch (e) { return false; }
    })();
    /* and a CONTENT partner is still refused, or the guard would be gone
       rather than conditional */
    fresh(771144);
    R.restive.contentRefused = (function () {
      S.purse = S.purse || {}; S.purse[R.partnerId] = 900;
      const c = V16_AI_DECK.filter(x => x.id === 'attack')[0];
      return v16Posture(S, R.partnerId) === 'partner' && !c.can(S, R.partnerId);
    })();
    R.restive.fromInside = attacksBy(R.partnerId, true);
    R.restive.fromOutside = attacksBy(R.partnerId, false);

    /* (e) AND THE TARGET REMEMBERS IT.

       THE FIRST VERSION OF THIS ARM STAYED GREEN UNDER ITS OWN POISON, and the
       fault was the arm. It drove sixty sessions as an opposition player and
       counted every grudge one party held against another -- but three other
       paths write exactly that shape: `v17FloorCore`'s pressure, a coalition
       breach and a walkout, and the last two name `st.ruling`, who is an AI
       whenever the player is not the government. So it measured "AI-to-AI
       grudges exist", which was true before this slice and after it. A probe
       that drives far enough for something else to do the job proves the
       something else.

       It asks about ONE PAIR now, either side of one real attack: the party
       the card chooses, and what it holds against the party that chose it. */
    fresh(424242, 'pnl');
    const A = PARTIES.map(p => p.id).filter(x => x !== playParty(S) && x !== S.ruling)[0];
    const B = PARTIES.map(p => p.id).filter(x => x !== playParty(S) && x !== A)[0];
    /* make B the attacker's worst, so the card's own target selection picks it
       rather than falling back to the government -- and read the target the
       card actually chose rather than assuming it */
    v16Resent(S, A, B, 80);
    S.purse = S.purse || {}; S.purse[A] = 900;
    R.memory = { attacker:A, meantTarget:B, before:Math.round(v16Grudge(S, B, A)) };
    const atkCard = V16_AI_DECK.filter(c => c.id === 'attack')[0];
    let chosen = null;
    const relBase = shiftPartyRel;
    /* capture whom it went at, from the line it writes, without touching the
       body: the run returns the sentence naming both parties */
    const line = atkCard.run(S, A);
    PARTIES.forEach(p => { if (p.id !== A && line && line.indexOf(PARTY[p.id].short) >= 0) chosen = p.id; });
    shiftPartyRel = relBase;
    R.memory.chosen = chosen;
    R.memory.after = Math.round(v16Grudge(S, chosen || B, A));
    R.memory.rose = R.memory.after > R.memory.before;
    /* and the player is NOT given a grudge object by this road: the player's
       own memory of being attacked is the player's, and writing one here would
       be a second ledger for one fact */
    fresh(424242);
    v16Resent(S, A, playParty(S), 80);
    S.purse = S.purse || {}; S.purse[A] = 900;
    const beforePlayer = JSON.stringify((v16Ai(S)[playParty(S)] || {}).grudge || {});
    atkCard.run(S, A);
    R.memory.playerLedgerUntouched =
      JSON.stringify((v16Ai(S)[playParty(S)] || {}).grudge || {}) === beforePlayer;

    /* and it still has to happen in play, not only when called: sixty real
       sessions must play the card at all, or the arm above proves a function
       nothing reaches */
    const tally = counting(() => { fresh(424242, 'pnl'); drive(60); });
    R.attacksPlayed = tally.byCard.attack || 0;

    /* (g) AND THE DIE IS DRAWN BEFORE THE SKIP. A gate in front of `rand()`
       decides how many numbers come off the stream, not just what happens, and
       S18c measured what that costs -- the six-seed pacing arc moved on every
       row because one chair stopped consuming one roll. So the gate draws for
       EVERY party, the player's own and a banned one included, and they
       discard. Measured by counting the draws with the whole board banned,
       when not one party can possibly act. */
    fresh(20260829);
    R.dice = {};
    (function () {
      const rb = rand;
      let n = 0;
      rand = function () { n++; return rb(); };
      try {
        PARTIES.forEach(p => { S.banned[p.id] = true; });
        n = 0; v16AiTurn(S);
        R.dice.allBanned = n;
        PARTIES.forEach(p => { delete S.banned[p.id]; });
        n = 0; v16AiTurn(S);
        R.dice.noneBanned = n;
      } finally { rand = rb; }
    })();
    R.dice.parties = PARTIES.length;
    /* exactly one apiece when nobody can act, and never fewer when they can */
    R.dice.drawnBeforeTheSkip =
      R.dice.allBanned === PARTIES.length && R.dice.noneBanned >= PARTIES.length;

    /* (f) AND THE PANEL SAYS THE ODDS IT HAS. The note claimed one initiative
       a session for everybody while the gate gave one in four; the column that
       would have told the player who was about to move did not exist. */
    fresh(20260829);
    const panel = v16AiPanel();
    R.panel = {
      hasColumn: /Odds of moving/.test(panel),
      saysOneASession: /takes one initiative a session/.test(panel),
      printsAnOdds: /<td class="num">\d+%<\/td>/.test(panel)
    };
    const shown = (panel.match(/<td class="num">(\d+)%<\/td>/g) || [])
      .map(x => Number(x.replace(/\D/g, '')));
    R.panel.shown = shown;
    R.panel.matchesModel = shown.length > 0 && shown.every((v, i) => {
      const live = PARTIES.filter(q => q.id !== playParty(S) && !S.banned[q.id]);
      return live[i] && Math.abs(v - Math.round(100 * v18TempoOdds(S, live[i].id))) < 1;
    });
    return R;
  });
  const aiOk =
    ai.budgetHeld && ai.totalHeld && ai.spreadOpen && ai.termsMove &&
    ai.restive.predicate && ai.restive.posture === 'restive' && ai.restive.cardOpens &&
    ai.restive.contentRefused &&
    ai.restive.fromInside > 0 && ai.restive.fromOutside > 0 &&
    ai.attacksPlayed > 0 && ai.memory.rose && ai.memory.chosen &&
    ai.memory.playerLedgerUntouched &&
    ai.panel.hasColumn && !ai.panel.saysOneASession && ai.panel.printsAnOdds &&
    ai.panel.matchesModel && ai.dice.drawnBeforeTheSkip;
  say(aiOk, 'a party moves when it has a reason to',
    `SIX PARTIES, FIFTEEN INITIATIVES EACH, ON EVERY SEED. That was the shipped build measured over sixty ` +
    `sessions from all three chairs: ${'`'}(st.turn + hash) % 4${'`'} is not a draw, so a party on a purse of 11 and a ` +
    `party on 195 acted equally often, and so did a party the player had just attacked. THE BUDGET IS THE ` +
    `OWNER'S DIAL and is untouched -- the per-session odds of the whole board sum to ${ai.budget} every session ` +
    `(${ai.budgetHeld}), which is what the modulus gave, and five seeds of sixty sessions come in at ` +
    `${ai.totals.join(', ')} against an expected ${ai.expected} · WHAT CHANGED IS WHICH PARTY AND WHEN: the ` +
    `per-party spread was 0 on every seed and is now ${ai.spreads.join(', ')} · and CIRCUMSTANCE is what moves ` +
    `it, one thing at a time on one board -- money in hand ${ai.terms.rich} against ${ai.terms.flat} flat, ` +
    `broke ${ai.terms.broke}, a grievance ${ai.terms.angry}, seats lost ${ai.terms.losing} · A PARTNER THAT HAS ` +
    `HAD ENOUGH: the posture returned partner before it read any grudge and the attack card's own can refused ` +
    `every member of the government, two guards for one outcome, so the same party with the same grudge on the ` +
    `same seed made ${ai.restive.fromInside} attacks from inside the ministry where it makes ` +
    `${ai.restive.fromOutside} from outside it -- and a CONTENT partner is still refused ` +
    `(${ai.restive.contentRefused}), or the guard would be gone rather than conditional · AND THE TARGET ` +
    `REMEMBERS IT, asked of ONE PAIR either side of one real attack -- the ${ai.memory.attacker} went at the ` +
    `${ai.memory.chosen} and what the ${ai.memory.chosen} holds against them went ${ai.memory.before} to ` +
    `${ai.memory.after} -- where the deck's own hostile verb moved the machine, the relations and the unity and ` +
    `wrote no memory at all, so sixty sessions and twelve attacks left every entry in the ledger pointing at the ` +
    `player; the card is still played in real sessions (${ai.attacksPlayed} in sixty) and the player's own ` +
    `ledger is not written from this road (${ai.memory.playerLedgerUntouched}) · and the panel prints the odds it actually has ` +
    `(${ai.panel.shown.join('%, ')}%) instead of telling the player each of them moves every session · and the ` +
    `die is drawn BEFORE the skip, for every party including the player's own and a banned one, so the gate ` +
    `decides what happens and never how many numbers come off the stream: with the whole board banned and not ` +
    `one party able to act it still draws ${ai.dice.allBanned} for ${ai.dice.parties} parties`);

  /* ================================================================
     S19a — THE PARTIES THINK
     ================================================================
     S18e fixed WHEN a party acts and left the decision a coin flip:
     `open[Math.floor(rand() * open.length)]`, equal probability over whatever
     the posture and the purse allowed. This asks three things that pull
     against each other, because any one alone would pass on a build that is
     wrong in a different way: the goals must be REACHED BY THE DECK (a goal
     no card serves is the decoration this file punishes hardest), the levels
     must DIFFER IN PLAY (or the owner's separate setting is a knob nothing
     turns), and `instinct` must be EXACTLY the old uniform draw (or the
     scale's floor is an approximation of the shipped game rather than the
     shipped game). */
  const think = await page.evaluate(() => {
    const R = {};
    function fresh(seed, level, me) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', me || 'lp'), false);
      S.aiLevel = level; S.rngState = seed;
      return S;
    }
    function counting(fn) {
      const saved = V16_AI_DECK.map(c => c.run);
      const t = { acts:0, withGoal:0, byCard:{}, byGoal:{} };
      V16_AI_DECK.forEach((c, i) => {
        c.run = function (st, pid) {
          t.acts++;
          t.byCard[c.id] = (t.byCard[c.id] || 0) + 1;
          const g = v16Ai(st)[pid] && v16Ai(st)[pid].goal;
          if (g) { t.withGoal++; t.byGoal[g.kind] = (t.byGoal[g.kind] || 0) + 1; }
          return saved[i].call(this, st, pid);
        };
      });
      try { fn(); } finally { V16_AI_DECK.forEach((c, i) => { c.run = saved[i]; }); }
      return t;
    }
    function drive(n) {
      for (let i = 0; i < n; i++) {
        UI.queue = []; UI.busy = false;
        try { endTurn(); } catch (e) { return e.message; }
        UI.queue = []; UI.busy = false;
      }
      return null;
    }

    /* (a) EVERY GOAL IS REACHED BY THE DECK. Its `worth` table names the cards
       that serve it, and a goal whose best card is not in the deck is an aim
       nothing can advance. Derived from the deck rather than counted, so a
       card renamed in a later slice reddens here. */
    const deckIds = V16_AI_DECK.map(c => c.id);
    R.goalGaps = [];
    V19_GOALS.forEach(g => {
      const named = Object.keys(g.worth || {});
      if (!named.length) { R.goalGaps.push(g.id + ': no cards named'); return; }
      const ghost = named.filter(k => deckIds.indexOf(k) < 0);
      if (ghost.length) R.goalGaps.push(g.id + ': names cards the deck has not -- ' + ghost.join(','));
      /* and the one it leans on hardest has to exist */
      let best = null, bestW = 0;
      named.forEach(k => { if (g.worth[k] > bestW) { bestW = g.worth[k]; best = k; } });
      if (deckIds.indexOf(best) < 0) R.goalGaps.push(g.id + ': its first card ' + best + ' is not in the deck');
    });
    R.goalCount = V19_GOALS.length;

    /* (b) INSTINCT IS THE SHIPPED GAME, EXACTLY. At sharpness nought every
       weight is 1, so `v19Choose` must return what a uniform draw returns for
       the same die. Compared against the arithmetic the old line used, over
       every open-set size the deck can produce. */
    fresh(4242, 'instinct');
    R.instinct = { sharp:v19LevelOf(S).sharp, mismatches:0, tried:0 };
    for (let n = 1; n <= V16_AI_DECK.length; n++) {
      const open = V16_AI_DECK.slice(0, n);
      for (let k = 0; k < 40; k++) {
        const before = S.rngState;
        const got = v19Choose(S, 'cup', open, null);
        S.rngState = before;
        const want = open[Math.floor(rand() * open.length)];
        R.instinct.tried++;
        if (got !== want) R.instinct.mismatches++;
      }
    }

    /* (c) AND THE LEVELS DIFFER IN PLAY. Sixty real sessions at each, same
       seed and same board, counting how many initiatives were taken with a
       goal behind them. Reading the goal COUNT rather than the card mix,
       because a card mix can differ by chance and this cannot. */
    R.byLevel = {};
    ['instinct', 'purposeful', 'shrewd', 'ruthless'].forEach(lv => {
      const t = counting(() => { fresh(20260829, lv); drive(60); });
      R.byLevel[lv] = { acts:t.acts, withGoal:t.withGoal, goals:Object.keys(t.byGoal).length };
    });

    /* (d) A GOAL IS KEPT, NOT RE-PICKED EVERY SESSION. A party that changes
       its mind every turn has no aim, which is the state this slice found. */
    fresh(771144, 'shrewd');
    const held = {};
    let switches = 0, samples = 0;
    for (let t = 0; t < 30; t++) {
      PARTIES.forEach(q => {
        if (q.id === playParty(S)) return;
        const g = v16Ai(S)[q.id] && v16Ai(S)[q.id].goal;
        const key = g ? g.kind + ':' + g.ref : 'none';
        if (held[q.id] !== undefined) { samples++; if (held[q.id] !== key) switches++; }
        held[q.id] = key;
      });
      UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) { break; }
      UI.queue = []; UI.busy = false;
    }
    R.hold = { samples:samples, switches:switches,
      rate:samples ? +(switches / samples).toFixed(3) : 1 };

    /* (e) AND A GOAL THAT IS REACHED IS PUT DOWN. Drive one to its end and
       read that the party takes a different one -- without this a goal could
       be "kept" by never being achievable. */
    fresh(5150, 'shrewd');
    const P = PARTIES.map(q => q.id).filter(x => x !== playParty(S))[0];
    v16Ai(S)[P].goal = { kind:'build', ref:'machine', want:.05, from:0, since:S.turn };
    S.machine[P] = .9;
    const before = JSON.stringify(v16Ai(S)[P].goal);
    const after = v19Goal(S, P);
    R.retire = { before:before, after:after ? after.kind + ':' + after.ref : null,
      changed:!!after && JSON.stringify(after) !== before };

    /* (g) IT WORKS OUT WHAT AN OPTION WOULD DO. `v6Sandbox` and `v17Utility`
       were in the file from S17 and wired to one decision; above `shrewd` a
       party rehearses each card and scores what it would leave behind. Three
       things asked separately, because the first version passed two of them
       while being useless: the reading must DISCRIMINATE between cards, the
       rehearsal must not touch the CAMPAIGN, and two parties of opposite
       politics must not agree about everything. */
    fresh(4242, 'shrewd');
    drive(12);
    S.purse = S.purse || {}; S.purse.cup = 900;
    const vals = V16_AI_DECK.map(c => +v19Outcome(S, 'cup', c).toFixed(4));
    R.sim = { distinct:new Set(vals).size, of:vals.length,
      spread:+(Math.max.apply(null, vals) - Math.min.apply(null, vals)).toFixed(4) };
    /* AND THE READING IS THE PARTY'S OWN. The first version of this arm asked
       whether two parties disagreed about the SIGN of a card, which is not the
       question: `court` raises whichever bloc the party courting it belongs
       to, so the left and the right both gain by it and SHOULD. What decides
       behaviour is whether they RANK the options differently -- a simulator
       that handed every party the same favourite would be scoring the board
       and not the party. */
    /* READ AS THE ARGMAX FIRST, AND THAT WAS THE WRONG INSTRUMENT. Whether
       four parties share a FAVOURITE depends on the board twelve driven
       sessions in, not on whether the simulator tells them apart: S19e changed
       what those twelve sessions contain and all four came out on `court`,
       with `v19Outcome` -- which does not read a temperament -- untouched. The
       claim is that they RANK the deck differently, so the whole ordering is
       what is compared, pair by pair. */
    R.sim.best = {}; R.sim.order = {};
    ['rsf', 'pnl', 'cup', 'fp'].forEach(q => {
      const scored = V16_AI_DECK.map(c => ({ id:c.id, v:v19Outcome(S, q, c) }))
        .sort((a, b2) => b2.v - a.v);
      R.sim.order[q] = scored.map(x => x.id).join('>');
      R.sim.best[q] = scored[0].id;
    });
    R.sim.distinctBest = new Set(Object.keys(R.sim.best).map(k => R.sim.best[k])).size;
    R.sim.distinctOrders = new Set(Object.keys(R.sim.order).map(k => R.sim.order[k])).size;
    /* and how far apart the two most different of them are, in places moved */
    R.sim.orderSpread = (() => {
      const ks = Object.keys(R.sim.order), lists = {};
      ks.forEach(k => { lists[k] = R.sim.order[k].split('>'); });
      let worst = 0;
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
        const a = lists[ks[i]], b2 = lists[ks[j]];
        let d = 0; a.forEach((id, ix) => { d += Math.abs(ix - b2.indexOf(id)); });
        if (d > worst) worst = d;
      }
      return worst;
    })();
    /* and thinking about a thing does not change the thing: `rand()` resolves
       `RNG_ON || S`, so a rehearsal must spend the CLONE's dice */
    const keep = { rng:S.rngState, cap:S.capital, pol:JSON.stringify(S.pol),
      purse:JSON.stringify(S.purse), blocs:JSON.stringify(S.blocs),
      machine:JSON.stringify(S.machine) };
    V16_AI_DECK.forEach(c => { v19Outcome(S, 'cup', c); v19Outcome(S, 'fp', c); });
    R.sim.untouched = S.rngState === keep.rng && S.capital === keep.cap &&
      JSON.stringify(S.pol) === keep.pol && JSON.stringify(S.purse) === keep.purse &&
      JSON.stringify(S.blocs) === keep.blocs && JSON.stringify(S.machine) === keep.machine;
    /* and the flag is raised while it happens, or an instrument that wraps
       `run` counts every rehearsal as an initiative -- measured, that made a
       party look five times as busy at the levels that think */
    let sawFlag = false;
    const fc = V16_AI_DECK.filter(c => c.id === 'court')[0], fb = fc.run;
    fc.run = function (st, pid) { if (V19_SIMULATING) sawFlag = true; return fb.call(this, st, pid); };
    try { v19Outcome(S, 'cup', fc); } finally { fc.run = fb; }
    R.sim.flagged = sawFlag && !V19_SIMULATING;

    /* (g2) AND THE GOAL AND THE REHEARSAL STEER THE CHOICE. Three poisons
       stayed GREEN on the first run and all three were this arm's fault: it
       measured the machinery's internals rather than its effect. Zeroing the
       goal term in `v19Score` changed nothing it read; switching simulation
       off entirely changed nothing it read. `v19Outcome` discriminating when
       CALLED is not the same claim as a party choosing differently because
       of it.

       So the choice itself is watched. For every real pick, the chosen card's
       rank among the open set is taken by the component under test, and
       normalised so 0 is the component's favourite and 1 its least. A
       component that steers pulls the mean below the middle; one the chooser
       ignores leaves it at .5, which is what a uniform draw over that set
       gives. */
    function steering(level) {
      const base = v19Choose;
      const goalRanks = [], simRanks = [];
      /* CAPPED, because this arm nearly made the harness unusable. Ranking a
         pick by the rehearsal's order means simulating every open card, and
         each rehearsal deep-clones a 78KB state: unbounded over sixty sessions
         at two levels that is several thousand clones a run, and a stack of
         runs took the box to 14GB of 16 and a load of 40. Forty samples a
         level is well past what the claim needs -- it asks for more than
         twenty -- and costs a fortieth of the time. */
      /* S21b RAISED THIS FROM 40 TO 150. Forty samples of a proportion near a
         half carry a standard error of about .08, so the bound of .42 the arm
         asserted could not be told from the .5 a chooser ignoring the goal
         would give -- `harness.md` flagged it as an effect-size claim on a
         single seed, and S21b's goal mix moved it to .46 without touching the
         chooser. The cost is real and is why the cap exists at all: each
         rehearsal deep-clones a 78KB state. 150 is still bounded, and it is
         the smallest sample that separates the claim from its null. */
      const CAP = 150;
      v19Choose = function (st, pid, open, goal) {
        const pick = base(st, pid, open, goal);
        if (pick && open.length > 1 && !V19_SIMULATING && simRanks.length < CAP) {
          const k = goal ? v19GoalKind(goal.kind) : null;
          if (k && k.worth) {
            const by = open.slice().sort((a, b) =>
              (k.worth[b.id] || .25) - (k.worth[a.id] || .25));
            goalRanks.push(by.indexOf(pick) / (open.length - 1));
          }
          /* TAKEN AT EVERY LEVEL, not only where simulation is on. Collecting
             it only where it applies made the arm unable to separate the two
             components: the goal term and the rehearsal term mostly agree --
             a card that serves the aim usually improves the party's standing
             too -- so a build with simulation switched OFF still chose cards
             that ranked well by it, and the poison stayed green. The claim is
             a CONTRAST between the level that rehearses and the level that
             does not, on the same seed. */
          const scored = open.map(c => ({ c:c, v:v19Outcome(st, pid, c) }))
            .sort((a, b) => b.v - a.v).map(x => x.c);
          simRanks.push(scored.indexOf(pick) / (open.length - 1));
        }
        return pick;
      };
      try { fresh(20260829, level); drive(60); } finally { v19Choose = base; }
      const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
      return { goal:goalRanks.length ? +mean(goalRanks).toFixed(3) : null, goalN:goalRanks.length,
        sim:simRanks.length ? +mean(simRanks).toFixed(3) : null, simN:simRanks.length };
    }
    R.steer = { purposeful:steering('purposeful'), shrewd:steering('shrewd') };

    /* (h) AND IT COUNTS THE FLOOR. A party that acts on a bill already going
       its way has worked out that no vote needs it and spent the money
       anyway. Driven eighty sessions at two levels on one seed: the level
       that does not think acts on whatever it likes least, the one that does
       acts only against the arithmetic. */
    function floorRun(lv) {
      const card = V16_AI_DECK.filter(c => c.id === 'floor')[0], base = card.run;
      let n = 0, against = 0;
      card.run = function (st, pid) {
        if (!V19_SIMULATING) {
          const f = v17AiFloorFor(st, pid);
          /* RECOMPUTED, NOT READ. Trusting the `againstMe` the picker reports
             is comparing a thing with something derived from it: a build that
             hard-codes the flag true passed this arm while behaving no
             differently, which is exactly the tautology this file's rules
             name. The forecast and the party's own support are asked again
             here, from the game's own functions. */
          if (f && f.bill) {
            n++;
            let fc = null, sup = null;
            try { fc = billForecast(st, f.bill); sup = partyBillSupport(st, pid, f.bill); } catch (e) {}
            if (fc && sup !== null) {
              const wants = sup >= 50, will = fc.lower >= v19Bar(st, f.bill);
              if (wants !== will) against++;
            }
          }
        }
        return base.call(this, st, pid);
      };
      try { fresh(20260829, lv); drive(80); } finally { card.run = base; }
      return { n:n, against:against };
    }
    R.floor = { dumb:floorRun('purposeful'), sharp:floorRun('shrewd') };

    /* (f) AND THE PANEL SAYS IT. R2: the aim, how far along, and what the
       party did last with the aim it served. */
    fresh(20260829, 'shrewd'); drive(8);
    const panel = v16AiPanel();
    R.panel = {
      column:/What they are after/.test(panel),
      aims:(panel.match(/Carrying |Repealing |Taking the |Getting into|Bringing down|Winning over|Building the/g) || []).length,
      pct:/<span class="muted">\d+%<\/span>/.test(panel)
    };
    fresh(20260829, 'instinct'); drive(4);
    R.panel.instinctSaysSo = /Acting on instinct/.test(v16AiPanel());
    return R;
  });
  const thinkOk =
    think.goalGaps.length === 0 && think.goalCount >= 6 &&
    think.instinct.sharp === 0 && think.instinct.mismatches === 0 && think.instinct.tried > 200 &&
    think.byLevel.instinct.withGoal === 0 &&
    think.byLevel.purposeful.withGoal === think.byLevel.purposeful.acts &&
    think.byLevel.shrewd.withGoal === think.byLevel.shrewd.acts &&
    think.byLevel.ruthless.withGoal === think.byLevel.ruthless.acts &&
    think.byLevel.shrewd.goals >= 4 &&
    think.hold.rate < .25 && think.hold.samples > 100 &&
    think.retire.changed &&
    think.panel.column && think.panel.aims > 0 && think.panel.pct && think.panel.instinctSaysSo &&
    think.sim.distinct >= 7 && think.sim.spread > .05 &&
    think.sim.distinctOrders >= 3 && think.sim.orderSpread >= 6 &&
    think.sim.untouched && think.sim.flagged &&
    think.steer.purposeful.goal !== null && think.steer.purposeful.goal < .42 &&
    think.steer.shrewd.sim !== null && think.steer.purposeful.sim !== null &&
    think.steer.shrewd.sim < think.steer.purposeful.sim - .05 &&
    think.steer.purposeful.goalN > 20 && think.steer.shrewd.simN > 20 &&
    think.floor.sharp.n > 0 && think.floor.sharp.against === think.floor.sharp.n &&
    think.floor.dumb.n > think.floor.sharp.n &&
    think.floor.dumb.against < think.floor.dumb.n;
  say(thinkOk, 'a party is after something',
    `THE DECISION WAS A COIN FLIP: \`open[Math.floor(rand() * open.length)]\`, equal probability over whatever the ` +
    `posture and the purse left, with nothing in the model saying what a party was TRYING to do. There are ` +
    `${think.goalCount} goals now, each built from what the party already is -- its authored \`wants\` and its bloc ` +
    `affinities -- and every one of them is reached by cards the deck actually carries ` +
    `(${think.goalGaps.length} that are not) · THE FLOOR OF THE SCALE IS THE SHIPPED GAME, not an approximation ` +
    `of it: at \`instinct\` the sharpness is ${think.instinct.sharp}, every weight is equal, and \`v19Choose\` ` +
    `returned what the old uniform line returns on the same die in ${think.instinct.tried} trials across every ` +
    `open-set size the deck can make (${think.instinct.mismatches} apart) · AND THE LEVELS DIFFER IN PLAY over ` +
    `sixty real sessions each: instinct ${think.byLevel.instinct.acts} initiatives and ` +
    `${think.byLevel.instinct.withGoal} with an aim behind them, against ` +
    `${think.byLevel.shrewd.withGoal} of ${think.byLevel.shrewd.acts} at shrewd over ` +
    `${think.byLevel.shrewd.goals} kinds of aim · A GOAL IS KEPT rather than re-picked, changing on ` +
    `${Math.round(think.hold.rate * 100)}% of ${think.hold.samples} party-sessions, and one that is REACHED is ` +
    `put down for another (${think.retire.after}) · and the panel states it (${think.panel.column}), with how far ` +
    `along (${think.panel.pct}), and says plainly when a party is acting on instinct ` +
    `(${think.panel.instinctSaysSo}) · AND ABOVE SHREWD IT WORKS OUT WHAT AN OPTION WOULD DO, through the ` +
    `sandbox and the objective function that were in the file from S17 and wired to one decision: the reading ` +
    `separates ${think.sim.distinct} of ${think.sim.of} cards across a spread of ${think.sim.spread} where the ` +
    `first version separated two, because it scored the country and not the party and nine of the ten cards ` +
    `move nothing the country notices; four parties of different politics come out with ` +
    `${think.sim.distinctOrders} different ORDERINGS of the deck between them, the two furthest apart by ` +
    `${think.sim.orderSpread} places (favourites: ${Object.keys(think.sim.best).map(k => k + ' ' + think.sim.best[k]).join(', ')}) -- ` +
    `read as the favourite alone this depended on the board twelve driven sessions in rather than on the ` +
    `simulator, and S19e moved it without touching \`v19Outcome\` at all; which is the question ` +
    `-- an earlier arm asked whether they disagreed about a card's SIGN and they rightly do not, because ` +
    `\`court\` raises whichever bloc the party courting it belongs to; and the rehearsal leaves the campaign exactly where it was ` +
    `(${think.sim.untouched}) with the flag up while it happens (${think.sim.flagged}), or an instrument that ` +
    `wraps \`run\` counts every rehearsal as an initiative · AND BOTH OF THEM STEER THE CHOICE, which is a ` +
    `different claim from either being computable: over sixty sessions the card a party actually picks sits at ` +
    `rank ${think.steer.purposeful.goal} of its goal's own order across ${think.steer.purposeful.goalN} picks, ` +
    `where a chooser ignoring it would sit at .5; and by the rehearsal's own order the level that rehearses ` +
    `picks at ${think.steer.shrewd.sim} against ${think.steer.purposeful.sim} for the level that does not, on ` +
    `the same seed -- read at one level alone that comparison passed with simulation switched off, because a ` +
    `card serving the aim usually improves the party's standing anyway · AND IT COUNTS THE FLOOR: over eighty sessions on ` +
    `one seed the level that does not think made ${think.floor.dumb.n} moves of which ` +
    `${think.floor.dumb.against} were on a bill going against it, and the level that does made ` +
    `${think.floor.sharp.n} of which ${think.floor.sharp.against} were -- a bill headed where a party wants it ` +
    `needs nothing from that party, and the money goes on the other nine things instead`);

  /* ---------- S21c: THE REHEARSAL CAN SEE WHAT A CARD DID ----------

     `v19Outcome` clones the board, plays the card and reads `v19Standing`
     either side. Measured over 889 rehearsals the game actually ran, NINE OF
     THE ELEVEN CARDS RETURNED A SINGLE CONSTANT -- min, median and max all
     the same number, and that number was exactly minus the card's own price
     tag. The simulation was a price list. A party clever enough to rehearse
     concluded that laying a bill, an article, a pact, a platform, a letter or
     a floor position was worse than doing nothing, and the two upper rungs of
     the setting bought it.

     Three of `v19Standing`'s five components could not fire either:
     `v17Share * 60` -- its LARGEST weight -- plus a flat +18 for governing
     and +9 an office, all read only inside a subtraction where they cancel,
     because no card in the deck moves a seat or enters a cabinet within one
     ply. `st.court.size`'s neighbour: not a field nothing reads, but tuned
     weights that cannot move.

     Four legs. (a) the objective's own coverage, before and after, driven
     rather than reasoned. (b) the terms are non-CREATING, because
     `v19Standing` runs on the live state as well as on the clone. (c) the
     cost table covers the deck both ways. (d) the government legislates on
     purpose, and does not above `instinct`. */
  const seen = await page.evaluate(() => {
    const R = {};
    function fresh(seed, level) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = level || 'ruthless'; S.rngState = seed;
      return S;
    }
    /* R9: anything downstream of the queue needs the override. This leg is
       about the initiative pass, but `aiGovern` runs in the tick and the
       formation matters to which party governs, so it is taken anyway. */
    function step() {
      const rq = runQueue; runQueue = function (done) { UI.queue = []; rq(done); };
      UI.busy = false; try { endTurn(); } catch (e) {} runQueue = rq;
      UI.queue = []; UI.busy = false;
    }

    /* (a) WHAT THE REHEARSAL CAN TELL APART. Wrapping `v19Outcome` and
       reading `v19Standing` either side is the game's own path -- S17o's rule,
       that reassembling the formula proves the function and not the wiring.
       A card whose rehearsal returns ONE NUMBER on every board cannot be told
       from any other instance of itself, which is the defect stated as a
       measurement rather than as an argument. */
    R.cards = (() => {
      const rows = {};
      const base = v19Outcome;
      v19Outcome = function (st, pid, card) {
        if (typeof v17Utility !== 'function' || typeof card.run !== 'function') return base.apply(this, arguments);
        let b, a, out;
        try { b = v19Standing(st, pid); } catch (e) { return base.apply(this, arguments); }
        out = v19Try(st, function (clone) { card.run(clone, pid); });
        if (out) {
          try { a = v19Standing(out, pid); } catch (e) { a = null; }
          if (a !== null && isFinite(a - b)) (rows[card.id] || (rows[card.id] = [])).push(+(a - b).toFixed(5));
        }
        return base.apply(this, arguments);
      };
      try {
        [4242, 90210, 7, 31337].forEach(s => { fresh(s); for (let i = 0; i < 40; i++) step(); });
      } finally { v19Outcome = base; }
      const ids = Object.keys(rows);
      let flat = 0, n = 0;
      const per = {};
      ids.forEach(id => {
        const a = rows[id];
        const lo = Math.min.apply(null, a), hi = Math.max.apply(null, a);
        const isFlat = (hi - lo) < 1e-6;
        if (isFlat) flat++;
        n += a.length;
        per[id] = { n:a.length, lo:+lo.toFixed(3), hi:+hi.toFixed(3), flat:isFlat };
      });
      return { cards:ids.length, rehearsals:n, flat:flat, per:per,
        flatIds:ids.filter(id => per[id].flat) };
    })();

    /* (a2) AND EACH OF THE SIX TERMS ANSWERS FOR ITSELF. The flatness reading
       above proves the objective can tell instances apart; it does NOT pin
       which term did it, and the poison run showed why that matters -- with
       the bill term deleted, `bill` still came back non-flat, because the
       purse term is `min(20, purse/100) * 1.2` and a party over 2,000 has it
       CLAMPED, so a card can escape flatness on an unrelated saturation.
       So the six are read one at a time, by making the change the card would
       make and asking `v19Flight` either side. Between them the driven leg
       says the terms reach real rehearsals and this one says which is which. */
    R.terms = (() => {
      fresh(4242); for (let i = 0; i < 3; i++) step();
      const pid = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0].id;
      const w = (PARTY[pid] || {}).wants || {};
      const pol = Object.keys(w).filter(id => POL[id] && (S.pol[id] || 0) !== Math.min(w[id], POL[id].max))[0];
      const f = () => v19Flight(S, pid);
      const out = {};
      const move = (label, fn, undo) => {
        const b = f(); fn(); const a = f(); undo();
        out[label] = +(a - b).toFixed(4);
      };
      /* a bill before the house going the party's way, and the same bill
         going the other way -- the sign is the claim, not the magnitude */
      if (pol) {
        const want = Math.min(w[pol], POL[pol].max), lv = S.pol[pol] || 0;
        const dir = want > lv ? 1 : -1;
        move('billFor', () => S.bills.push({ policy:pol, dir:dir, sponsor:pid, owner:'opposition', lines:{} }),
          () => S.bills.pop());
        move('billAgainst', () => S.bills.push({ policy:pol, dir:-dir, sponsor:pid, owner:'opposition', lines:{} }),
          () => S.bills.pop());
        /* a POSITION declared on a bill going the party's way */
        move('lineFor', () => S.bills.push({ policy:pol, dir:dir, sponsor:'x', owner:'opposition', lines:{ [pid]:'support' } }),
          () => S.bills.pop());
        move('lineAgainst', () => S.bills.push({ policy:pol, dir:dir, sponsor:'x', owner:'opposition', lines:{ [pid]:'oppose' } }),
          () => S.bills.pop());
      }
      const art = V11_ARTICLES.filter(a => !v11Adopted(S, a.id))[0];
      if (art) move('article', () => v11Con(S).pending.push({ id:art.id, by:pid, laid:S.turn, due:S.turn + 2 }),
        () => v11Con(S).pending.pop());
      const other = PARTIES.filter(p => p.id !== pid && !S.banned[p.id])[0].id;
      move('pact', () => { S.aiPacts = S.aiPacts || {}; S.aiPacts[pid] = { with:other, since:S.turn }; },
        () => { delete S.aiPacts[pid]; });
      move('push', () => { S.push = S.push || {}; S.push[pid] = { e:.18, a:.18 }; },
        () => { delete S.push[pid]; });
      move('letter', () => S.inbox.push({ id:'probe', type:'party_demand', from:pid }),
        () => S.inbox.pop());
      return { out:out, pol:pol,
        /* every kind moves it, and the two signed ones are signed */
        allMove: ['billFor', 'lineFor', 'article', 'pact', 'push', 'letter']
          .every(k => out[k] !== undefined && Math.abs(out[k]) > 1e-9),
        billSigned: out.billFor > 0 && out.billAgainst < 0,
        /* AND THE LINE IS READ AGAINST ITS OWN PAIR, not against nought. Both
           of these put the SAME bill on the paper -- one the party wants --
           so both carry its docket value and both are positive; what the term
           decides is which is worth more. Asking for a negative here was the
           probe reading the bill's value and calling it the line's. */
        lineSigned: out.lineFor > out.lineAgainst,
        lineGap: +(out.lineFor - out.lineAgainst).toFixed(4) };
    })();

    /* (b) A READ MUST NOT CREATE. `v19Standing` is called on the REAL state
       at the top of `v19Outcome`, so a term that installs a structure to read
       it installs it on the live campaign -- which is `v6TreatyRows`, whose
       read gave every power an empty treaty array and awarded the Peacemaker
       record on every seed. Asked of a state stripped of all four. */
    R.pure = (() => {
      fresh(4242); for (let i = 0; i < 3; i++) step();
      const pid = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0].id;
      delete S.v11; delete S.aiPacts; delete S.push; const bills = S.bills; S.bills = [];
      let threw = null, v = null;
      try { v = v19Standing(S, pid); } catch (e) { threw = e.message; }
      const made = { v11: S.v11 !== undefined, pacts: S.aiPacts !== undefined,
        push: S.push !== undefined };
      S.bills = bills;
      return { threw:threw, finite: typeof v === 'number' && isFinite(v),
        created: made.v11 || made.pacts || made.push, made:made };
    })();

    /* (c) ONE TABLE OVER THE DECK, BOTH WAYS -- the guard `V17_MEMORY` and
       `V19_RIVAL_WORTH` carry and this one escaped. And the broke test reads
       the cheapest card rather than naming one: it named `demand` at 16 under
       a comment calling it the cheapest, and `floor` costs 12. */
    R.cost = (() => {
      const deck = V16_AI_DECK.map(c => c.id);
      const priced = Object.keys(V16_AI_COST);
      return {
        deck:deck.length, priced:priced.length,
        unpriced: deck.filter(id => typeof V16_AI_COST[id] !== 'number'),
        ghosts: priced.filter(id => deck.indexOf(id) < 0),
        cheapest: v16CheapestCard(),
        trueMin: Math.min.apply(null, priced.map(k => V16_AI_COST[k])),
        wasNamed: V16_AI_COST.demand,
        /* and the S17 names still answer, because nine call sites read them */
        s17: V17_AI_COST_ARTICLE === V16_AI_COST.article &&
             V17_AI_COST_ORDER === V16_AI_COST.order &&
             V17_AI_COST_FLOOR === V16_AI_COST.floor,
        flight: V21_FLIGHT,
      };
    })();

    /* AND THE TEMPO READS IT, which is a different claim from the function
       computing it -- THE POISON RUN IS WHERE I FOUND THAT OUT. The first
       version of this leg asserted `v16CheapestCard() === min(table)` and
       nothing else, and putting `V16_AI_COST.demand` back at the CALL SITE in
       `v18Tempo` left it green. Every gate in this harness calls a function
       and something in the game has to read it: a party holding 14 sits above
       the cheapest card (12) and below the name the gate used to carry (16),
       so it is throttled by one build and not by the other, and that is the
       band the whole change lives in. */
    R.broke = (() => {
      fresh(4242); for (let i = 0; i < 2; i++) step();
      const pid = PARTIES.filter(p => p.id !== playParty(S) && p.id !== S.ruling && !S.banned[p.id])[0].id;
      const at = (n) => { S.purse[pid] = n; return +v18Tempo(S, pid).toFixed(4); };
      /* clear anything else that scales the weight, so the reading is the
         broke test alone */
      const a = v16Ai(S)[pid]; if (a) { a.grudge = {}; a.lastSeats = undefined; }
      const under = at(V16_AI_COST[Object.keys(V16_AI_COST).reduce((lo, k) =>
        V16_AI_COST[k] < V16_AI_COST[lo] ? k : lo)] - 1);   /* below the cheapest: throttled */
      const between = at(14);                                /* 12 <= 14 < 16: the band */
      const over = at(60);                                   /* plainly solvent */
      return { under:under, between:between, over:over,
        throttledUnder: under < over, notThrottledInBand: between === over,
        band: [v16CheapestCard(), V16_AI_COST.demand] };
    })();

    /* (d) A GOVERNMENT CHOOSES ITS PROGRAMME. `aiGovern` drew uniformly out
       of everything on the ruling party's table while an opposition party has
       picked by forecast since S19c. Read through the game's own path -- the
       bill that ends up on the paper -- at both levels, on the same board.
       R1: `instinct` keeps the hat. */
    R.govern = (() => {
      const run = (level) => {
        fresh(4242, level);
        /* seat an ENGINE government, or `aiGovern` returns at `leads` */
        const gov = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0].id;
        S.ruling = gov; S.coalition = [gov];
        S.bills = [];
        if (S.turn % 2) S.turn += 1;
        /* WHAT THE FORECAST PICKER WANTS, ASKED BEFORE THE CARD RUNS. The
           first version of this leg asked afterwards and read the SECOND
           choice, because `v19BillFor` skips a statute that already has a
           bill on it -- the same shape as availability asked after the card
           played, which CLAUDE.md names. It reported the mechanism broken
           while the mechanism was working: `instinct` laid `minimumWage`,
           the picker's real answer was `techAntitrust`, and `ruthless` laid
           `techAntitrust`. */
        let want = null;
        try { const a = v19BillFor(S, gov); want = a ? a.policy : null; } catch (e) { want = null; }
        let laid = null, fc = null;
        aiGovern(S);
        /* counted by OWNER, because `aiGovern` is wrapped: `pv5AiGovernV4` is
           the base and the reassignment adds `pv5AiPrivateBill`, so the call
           lays a government bill AND, on its own roll, an opposition one. */
        const b = S.bills.filter(x => x.owner === 'government')[0];
        if (b) { laid = b.policy; try { fc = +billForecast(S, b).lower.toFixed(1); } catch (e) { fc = null; } }
        return { gov:gov, laid:laid, forecast:fc, aimed:want,
          laidCount:S.bills.filter(x => x.owner === 'government').length };
      };
      const dumb = run('instinct'), sharp = run('ruthless');
      return { dumb:dumb, sharp:sharp,
        sharpIsAimed: sharp.laid !== null && sharp.laid === sharp.aimed,
        /* AND THE TWO LEVELS DISAGREE, which is the claim the equality above
           cannot make on its own: a board where the hat happens to draw the
           forecast pick would pass it with the gate deleted. */
        levelsDiffer: dumb.laid !== sharp.laid,
        /* and the aimed bill is the one that can be carried */
        better: (sharp.forecast || 0) > (dumb.forecast || 0),
        bothLaid: dumb.laidCount === 1 && sharp.laidCount === 1 };
    })();

    /* (e) AND THE OTHER ENGINE BILL ROAD. An engine has three doors to the
       order paper and they disagreed: the deck's `bill` card by forecast
       since S19c, `aiGovern` out of a hat, and private members' time by
       `partyDemandPolicy`'s biggest gap. A change to `pv5AiPrivateBill` with
       no leg here would be a change with no assertion.

       The party is picked by a SEAT-WEIGHTED ROLL before the statute is, so
       this leg is also where the stream discipline is proved: both levels
       must land on the SAME sponsor, which they can only do if the gap
       picker's own draws still happen at both. */
    R.priv = (() => {
      const run = (level, askFor) => {
        fresh(4242, level);
        const gov = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0].id;
        S.ruling = gov; S.coalition = [gov]; S.bills = [];
        let want = null;
        if (askFor) { try { const a = v19BillFor(S, askFor); want = a ? a.policy : null; } catch (e) { want = null; } }
        S.rngState = 20260901;
        let laid = null, by = null;
        for (let i = 0; i < 40 && !laid; i++) {
          pv5AiPrivateBill(S);
          const b = S.bills.filter(x => x.owner === 'opposition')[0];
          if (b) { laid = b.policy; by = b.sponsor; }
        }
        return { laid:laid, by:by, want:want, rng:S.rngState };
      };
      const dumb = run('instinct', null);
      const sharp = run('ruthless', dumb.by);
      return { dumb:dumb, sharp:sharp,
        ran: !!dumb.laid && !!sharp.laid,
        sameSponsor: !!dumb.by && dumb.by === sharp.by,
        sharpIsAimed: sharp.laid !== null && sharp.laid === sharp.want,
        levelsDiffer: dumb.laid !== sharp.laid,
        /* and the stream is where it was: the gap picker still draws at both */
        sameStream: dumb.rng === sharp.rng };
    })();

    /* AND THE DICE COUNT IS UNCHANGED, which is S18c's rule: a gate in front
       of `rand()` decides how many numbers come off the stream, not just what
       happens, and one chair consuming one roll fewer re-phases the campaign.
       `aiGovern` draws its roll and discards it above `instinct`. */
    R.dice = (() => {
      const run = (level) => {
        fresh(4242, level);
        const gov = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0].id;
        S.ruling = gov; S.coalition = [gov]; S.bills = [];
        if (S.turn % 2) S.turn += 1;
        S.rngState = 777;
        aiGovern(S);
        return S.rngState;
      };
      return { instinct:run('instinct'), ruthless:run('ruthless'),
        same: run('instinct') === run('ruthless') };
    })();
    return R;
  });

  const seenOk =
    /* nine of eleven cards returned one constant; at most one may now */
    seen.cards.cards === 11 && seen.cards.rehearsals > 600 && seen.cards.flat <= 1 &&
    seen.terms.allMove === true && seen.terms.billSigned === true && seen.terms.lineSigned === true &&
    seen.pure.threw === null && seen.pure.finite === true && seen.pure.created === false &&
    seen.cost.deck === 11 && seen.cost.priced === 11 &&
    seen.cost.unpriced.length === 0 && seen.cost.ghosts.length === 0 &&
    seen.cost.cheapest === seen.cost.trueMin && seen.cost.cheapest < seen.cost.wasNamed &&
    seen.cost.s17 === true &&
    seen.broke.throttledUnder === true && seen.broke.notThrottledInBand === true &&
    seen.govern.bothLaid === true && seen.govern.sharpIsAimed === true &&
    seen.govern.levelsDiffer === true && seen.govern.better === true &&
    seen.priv.ran === true && seen.priv.sameSponsor === true &&
    seen.priv.sharpIsAimed === true && seen.priv.levelsDiffer === true &&
    seen.priv.sameStream === true &&
    seen.dice.same === true;
  say(seenOk, 'the rehearsal can see what a card did',
    `THE SIMULATION WAS A PRICE LIST. \`v19Outcome\` clones the board, plays the card and reads ` +
    `\`v19Standing\` either side -- and over ${seen.cards.rehearsals} rehearsals the game actually ran, NINE OF ` +
    `THE ELEVEN CARDS RETURNED A SINGLE CONSTANT: min, median and max the same number, and that number exactly ` +
    `minus the card's own price tag. \`article\` -0.408 every time, \`bill\` -0.456, \`campaign\` -0.480, ` +
    `\`pact\` -0.408, \`platform\` -0.264, \`demand\` -0.192, \`floor\` -0.144. A party clever enough to rehearse ` +
    `concluded that laying a bill was worse than doing nothing, and the two upper rungs of the setting bought ` +
    `it. ${seen.cards.flat} of ${seen.cards.cards} are flat now` +
    (seen.cards.flatIds.length ? ` (${seen.cards.flatIds.join(', ')} -- the bill card always lays the statute ` +
      `its own table names, so every instance of it IS a good one)` : '') + ` · AND THREE OF THE FIVE COMPONENTS ` +
    `COULD NOT FIRE: \`v17Share * 60\`, the LARGEST weight in the function, plus a flat +18 for governing and ` +
    `+9 an office -- read only inside a subtraction, and no card in the deck moves a seat or enters a cabinet ` +
    `within one ply, so all three cancelled on 889 of 889. \`st.court.size\`'s neighbour: not a field nothing ` +
    `reads, but tuned weights that cannot move. \`supportTargets\` is on the same scale and reads what the cards ` +
    `write · A THING IN FLIGHT IS WORTH THE PRICE OF THE CARD THAT PRODUCES IT, times how good this instance ` +
    `is -- ONE constant, taken from the cards that already scored rather than by eye: their median gain is 0.75, ` +
    `the median price across the six kinds is 28 and the median instance is .90, so V21_FLIGHT is ` +
    `${seen.cost.flight} · AND EACH OF THE SIX TERMS ANSWERS FOR ITSELF (${seen.terms.allMove}), because the ` +
    `flatness reading above says the objective can tell instances apart and NOT which term did it -- the poison ` +
    `run showed why that matters: with the bill term deleted \`bill\` still came back non-flat, since the purse ` +
    `term is \`min(20, purse/100) * 1.2\` and a party over 2,000 has it CLAMPED, so a card escapes flatness on ` +
    `an unrelated saturation. Read one at a time: a bill ${seen.terms.out.billFor} going the party's way and ` +
    `${seen.terms.out.billAgainst} going the other (${seen.terms.billSigned}), a position declared ` +
    `${seen.terms.out.lineFor} for and ${seen.terms.out.lineAgainst} against the SAME bill -- both positive ` +
    `because both carry that bill's own value, so the line is read against its pair and not against nought ` +
    `(${seen.terms.lineSigned}, a gap of ${seen.terms.lineGap}) -- asking for a negative there was the probe ` +
    `reading the bill's worth and calling it the line's, an ` +
    `article ${seen.terms.out.article}, a pact ${seen.terms.out.pact}, a platform move ${seen.terms.out.push}, ` +
    `an outstanding letter ${seen.terms.out.letter} · AND THE READS DO NOT CREATE ` +
    `(${seen.pure.created ? 'they DO' : 'true'}), asked of ` +
    `a state stripped of \`v11\`, \`aiPacts\` and \`push\`: \`v19Standing\` runs on the LIVE state at the top of ` +
    `\`v19Outcome\`, so a term that installs a structure to read it installs it on the campaign -- which is ` +
    `\`v6TreatyRows\`, whose read gave every power an empty treaty array and awarded the Peacemaker record on ` +
    `every seed · ONE COST TABLE OVER THE DECK, BOTH WAYS: ${seen.cost.priced} prices for ${seen.cost.deck} ` +
    `cards, ${seen.cost.unpriced.length} unpriced and ${seen.cost.ghosts.length} naming no card, where the table ` +
    `held eight and \`article\`, \`order\` and \`floor\` kept theirs in three later constants -- and BOTH readers ` +
    `read \`V16_AI_COST[id] || 0\`, so the chooser's money term scored those three as free and the tempo's broke ` +
    `test could not see them · AND THE TEMPO READS IT, which is a different claim from the function computing ` +
    `it and IS WHERE THE POISON RUN CAUGHT ME: the first version of this leg asserted only that ` +
    `\`v16CheapestCard()\` equals the table's minimum, and putting the old name back at the CALL SITE in ` +
    `\`v18Tempo\` left it GREEN. Every gate in this harness calls a function and something in the game has to ` +
    `read it. The band is ${seen.broke.band[0]} to ${seen.broke.band[1]}: below the cheapest card a party is ` +
    `throttled (${seen.broke.under} against ${seen.broke.over}, ${seen.broke.throttledUnder}) and AT 14 -- above ` +
    `the cheapest card and below the name the gate used to carry -- it is not (${seen.broke.between}, ` +
    `${seen.broke.notThrottledInBand}), where it used to be cut to a third of its tempo while it could still ` +
    `afford to act · AND A GOVERNMENT CHOOSES ITS PROGRAMME: \`aiGovern\` drew it out ` +
    `of a hat while an opposition party has picked by forecast since S19c, worth +4.9 forecast points over 133 ` +
    `real decisions -- the one chair that legislates most was the least deliberate in the republic. Above ` +
    `\`instinct\` the bill it lays is the one the forecast picks (${seen.govern.sharpIsAimed}: ` +
    `${seen.govern.sharp.laid}, forecasting ${seen.govern.sharp.forecast}), at \`instinct\` it is the hat ` +
    `(${seen.govern.dumb.laid}, forecasting ${seen.govern.dumb.forecast}) -- the two DISAGREE ` +
    `(${seen.govern.levelsDiffer}), which the equality alone cannot say because a board where the hat happens ` +
    `to draw the forecast pick would pass it with the gate deleted, and the aimed bill is the one that can be ` +
    `carried (${seen.govern.better}). Both lay exactly one government bill (${seen.govern.bothLaid}) · THIS LEG ` +
    `WAS WRONG BEFORE THE GAME WAS: it first asked what the picker wanted AFTER the card had run, and read the ` +
    `SECOND choice, because \`v19BillFor\` skips a statute that already carries a bill -- availability asked ` +
    `after the card played, and it reported the mechanism broken while the mechanism was working · and THE DICE ` +
    `COUNT IS UNCHANGED (${seen.dice.same}), the roll drawn and discarded, because S18c measured that one chair ` +
    `consuming one number fewer re-phases every seeded campaign · AND AN ENGINE HAS THREE DOORS TO THE ORDER ` +
    `PAPER AND THEY DISAGREED: the deck's \`bill\` card by forecast since S19c, \`aiGovern\` out of a hat, and ` +
    `private members' time by \`partyDemandPolicy\`'s biggest gap -- so the same party laid a statute it could ` +
    `carry through one door and one it could not through another. On that third road the same sponsor is picked ` +
    `at both levels (${seen.priv.sameSponsor}: ${seen.priv.dumb.by}) and lays ${seen.priv.dumb.laid} on ` +
    `instinct against ${seen.priv.sharp.laid} above it (${seen.priv.levelsDiffer}), which is the forecast ` +
    `picker's own answer (${seen.priv.sharpIsAimed}) · \`partyDemandPolicy\` IS STILL CALLED and still the ` +
    `fallback, on two counts: it ROLLS, so the draw has to happen whatever is picked -- proved by both levels ` +
    `landing on the same sponsor after a seat-weighted roll and leaving the stream in the same place ` +
    `(${seen.priv.sameStream}) -- and it is SHARED with the demand card, which \`roads.js\` pins on purpose, ` +
    `so the change goes in this caller and not in the body`);

  /* ---------- S21e: THE TABLE IS A NEGOTIATION ----------

     MEASURED FIRST, over 377 formations and 2,623 accept decisions across six
     seeds: EVERY OFFER IN THE GAME WAS THE SAME SHAPE. Three concessions, ONE
     distinct value, on every invitation to every party by every formateur in
     every round. A formation was a negotiation in which nobody negotiated,
     and the only thing that varied was who was being handed the constant.

     Three changes, and three of the plan's own items dropped after checking.

     (a) THE OFFER VARIES. `v17Build` bids on how many seats it still needs and
     how much friction it has with the party it is asking. Symmetric about the
     old constant, because the first build skewed upward and formations became
     so easy that the grand and caretaker branches stopped firing -- the S21d
     regression with the sign flipped.

     (b) THE OFFER REACHES THE SCREEN. `v6CoalitionCandidates` built the real
     offer, handed it to `v17Accept` and dropped it on the next line, so the
     row a player read was a party name, two scalars and a seat count.

     (c) THE RESERVATION STOPS PRICING THE WRONG RELATIONSHIP. `v16Posture`
     takes no `lead` argument, so its +16 was charged identically against all
     seven formateurs, and it fires on anger at the OUTGOING government.

     DROPPED AFTER CHECKING, recorded here so they are not rebuilt: the
     symmetric investiture count is a provable no-op (`divisionOf`'s share is
     odd about 50, so the sign flips only if the opposition out-disciplines the
     government, measured .428 against .427, and 174 of 174 investitures were
     unchanged under a sweep); `V17_FORM_MAX` to 3 rests on a reachability
     claim this programme has twice recorded as false; and `v21Kingmaker` has
     no consumer. */
  const table = await page.evaluate(() => {
    const R = {};
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = 'ruthless'; S.rngState = seed; return S;
    }
    function step() {
      const rq = runQueue; runQueue = function (done) { UI.queue = []; rq(done); };
      UI.busy = false; try { endTurn(); } catch (e) {} runQueue = rq;
      UI.queue = []; UI.busy = false;
    }

    /* (a) THE OFFER VARIES, read where the formateur actually builds it. */
    R.varies = (() => {
      const seen = [], gens = [];
      const base = v17Offer;
      v17Offer = function (st, lead, pid, co, gen) {
        const o = base.apply(this, arguments);
        if (!V19_SIMULATING && o) {
          seen.push((o.concessions || []).length);
          gens.push(o.generosity);
        }
        return o;
      };
      try {
        [4242, 90210, 7, 31337].forEach(s => { fresh(s); for (let i = 0; i < 40; i++) step(); });
      } finally { v17Offer = base; }
      const d = {}; seen.forEach(n => { d[n] = (d[n] || 0) + 1; });
      return { n:seen.length, distinct:Object.keys(d).length, hist:d,
        min:Math.min.apply(null, seen), max:Math.max.apply(null, seen),
        mean:+(seen.reduce((a, c) => a + c, 0) / Math.max(1, seen.length)).toFixed(2),
        base:V17_GENEROSITY.base,
        /* the mean sits ON the constant every offer used to carry: what the
           slice adds is spread, not a thumb on the scale */
        centred: Math.abs(seen.reduce((a, c) => a + c, 0) / Math.max(1, seen.length) - V17_GENEROSITY.base) < .6,
        generosityRead: gens.every(g => typeof g === 'number') };
    })();

    /* (b) AND IT REACHES THE SCREEN, which is the owner's complaint. Read
       through the sheet's own builder, not by calling `v17Offer` again. */
    R.screen = (() => {
      fresh(4242);
      const cands = v6CoalitionCandidates(S);
      const terms = cands.map(c => c.terms).filter(t => t && t.length);
      return { rows:cands.length, withTerms:terms.length,
        distinct:new Set(terms).size,
        keepsOffer: cands.every(c => c.offer && typeof c.offer.generosity === 'number'),
        /* every row names at least one real statute, or the sentence is a
           template with nothing in it */
        namesStatutes: terms.every(t => POLICIES.some(p => t.indexOf(p.name) >= 0)),
        sample: terms[0] || '' };
    })();

    /* (c) THE RESERVATION NO LONGER READS THE OUTGOING GOVERNMENT. Asked of
       ONE pair with one thing changed: a party furious at whoever governs, on
       a board where somebody else is the formateur. Under the old term that
       party's reservation rose by sixteen for a table it had no quarrel with.
       And the DIRECTED grudge still bites, or the relationship would have been
       deleted rather than moved. */
    R.reservation = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const gov = S.ruling;
      const pid = PARTIES.filter(p => p.id !== gov && p.id !== playParty(S) && !S.banned[p.id])[0];
      const lead = PARTIES.filter(p => p.id !== gov && p.id !== playParty(S) &&
        p.id !== (pid || {}).id && !S.banned[p.id])[0];
      if (!pid || !lead) return { ran:false };
      const a = v16Ai(S)[pid.id];
      const ask = () => v17Accept(S, pid.id, lead.id, v17Offer(S, lead.id, pid.id, [lead.id, pid.id]), 0, null);
      PARTIES.forEach(q => { delete a.grudge[q.id]; });
      const clean = ask();
      /* furious at the party in office, which is NOT the one asking */
      v16Resent(S, pid.id, gov, 90);
      const atGov = ask();
      PARTIES.forEach(q => { delete a.grudge[q.id]; });
      /* furious at the formateur itself */
      v16Resent(S, pid.id, lead.id, 90);
      const atLead = ask();
      PARTIES.forEach(q => { delete a.grudge[q.id]; });
      return { ran:true,
        cleanRes:clean.reservation, govRes:atGov.reservation, leadRes:atLead.reservation,
        cleanVal:clean.value, leadVal:atLead.value,
        /* anger at the OUTGOING government moves the price of somebody else's
           table by nothing */
        blindToOutgoing: clean.reservation === atGov.reservation,
        /* anger at the FORMATEUR still costs it, through `value` */
        directedBites: atLead.value < clean.value,
        posturePriced: (function () {
          try { return typeof v17PostureOf === 'function'; } catch (e) { return false; }
        })() };
    })();

    /* (d) AND THE BRANCHES STAY REACHABLE. S21b's finding was that the
       formation's minority, grand and caretaker rounds must be able to fire;
       a slice that makes the table a negotiation must not make the
       negotiation always succeed. Counted as EPISODES, because a republic
       sitting in one caretaker for twenty sessions is one caretaker, and
       counting rotation CALLS reported eight episodes as 166. */
    R.branches = (() => {
      const how = {};
      let episodes = 0, careSessions = 0, sessions = 0;
      const base = v17Rotation;
      v17Rotation = function (st, pin) {
        const o = base.apply(this, arguments);
        if (!V19_SIMULATING && o) how[o.how] = (how[o.how] || 0) + 1;
        return o;
      };
      try {
        [4242, 90210, 7, 31337, 555, 8080].forEach(seed => {
          fresh(seed);
          let inCare = false;
          for (let i = 0; i < 120; i++) {
            step(); sessions++;
            const care = !!S.caretaker;
            if (care) careSessions++;
            if (care && !inCare) episodes++;
            inCare = care;
          }
        });
      } finally { v17Rotation = base; }
      return { how:how, kinds:Object.keys(how).length, sessions:sessions,
        episodes:episodes, careSessions:careSessions,
        careShare:+(careSessions / Math.max(1, sessions)).toFixed(3) };
    })();
    return R;
  });

  const tableOk =
    table.varies.n > 400 && table.varies.distinct >= 3 &&
    table.varies.centred === true && table.varies.generosityRead === true &&
    table.screen.rows >= 4 && table.screen.withTerms === table.screen.rows &&
    table.screen.distinct >= 3 && table.screen.keepsOffer === true &&
    table.screen.namesStatutes === true &&
    table.reservation.ran === true && table.reservation.blindToOutgoing === true &&
    table.reservation.directedBites === true &&
    table.reservation.posturePriced === false &&
    /* the negotiation must not always succeed */
    /* three of the four rounds fire, which is S21b's shipped guarantee. The
       CARETAKER is reported and not gated: it is a rare event (2 episodes in
       720 sessions on the build before this one, 0 on this one) and a bound on
       a rare event is a flaky assertion rather than a claim. */
    table.branches.kinds >= 3 && table.branches.careShare < .1;
  say(tableOk, 'the table is a negotiation',
    `EVERY OFFER IN THE GAME WAS THE SAME SHAPE. Measured over 377 formations and 2,623 accept decisions ` +
    `across six seeds: three concessions, ONE distinct value, on every invitation to every party by every ` +
    `formateur in every round. A formation was a negotiation in which nobody negotiated, and the only thing ` +
    `that varied was who was being handed the constant · IT VARIES NOW across ${table.varies.n} offers, ` +
    `${table.varies.distinct} distinct sizes from ${table.varies.min} to ${table.varies.max}, on how many ` +
    `seats the formateur still needs and how much friction it has with the party it is asking. The mean is ` +
    `${table.varies.mean} against a base of ${table.varies.base} (${table.varies.centred}), because the FIRST ` +
    `build bid up when short and up again on friction with one narrow condition bidding down, the mean skewed ` +
    `above the constant, and formations became so easy that the grand and caretaker branches stopped firing ` +
    `altogether -- the S21d regression with the sign flipped. A slice that makes the table a negotiation must ` +
    `not make the negotiation always succeed, and the branches are asserted below · AND THE OFFER REACHES THE ` +
    `SCREEN, which is the owner's complaint with a line number on it: \`v6CoalitionCandidates\` built the real ` +
    `offer, handed it to \`v17Accept\` and DROPPED IT ON THE NEXT LINE, so the row read a party name, two ` +
    `scalars and a seat count while every concession, the red line and the price the formateur set were ` +
    `computed and thrown away. ${table.screen.withTerms} of ${table.screen.rows} rows carry terms now, ` +
    `${table.screen.distinct} of them distinct, every one naming real statutes (${table.screen.namesStatutes}) ` +
    `-- "${table.screen.sample}" · THIS ALSO GIVES \`offer.generosity\` ITS ONLY READER ` +
    `(${table.screen.keepsOffer}): without it the field was written and consulted by nothing, which is ` +
    `\`st.court.size\` in code this slice had itself added, and the independent check found it before the ` +
    `poison run did · AND THE RESERVATION STOPS PRICING THE WRONG RELATIONSHIP. \`v16Posture\` takes no ` +
    `\`lead\` argument, so its +16 was charged identically against all seven formateurs at one table, and it ` +
    `fires on anger at the player or at whoever GOVERNS -- which during a formation is the party being ` +
    `replaced. The common case was a party charged sixteen extra to join the government replacing the one it ` +
    `hates. Read on one pair with one thing changed: rage at the outgoing government now moves somebody ` +
    `else's price by nothing (${table.reservation.cleanRes} to ${table.reservation.govRes}, ` +
    `${table.reservation.blindToOutgoing}) while rage at the FORMATEUR still costs it through \`value\` ` +
    `(${table.reservation.cleanVal} to ${table.reservation.leadVal}, ${table.reservation.directedBites}) -- ` +
    `nothing replaced the term, because the directed grudge was already priced and a second mechanism ` +
    `computing what the first computes is what this file forbids. \`v17PostureOf\` fed a field with no reader ` +
    `and is gone with it (${table.reservation.posturePriced} that it still exists) · AND THE BRANCHES STAY ` +
    `REACHABLE: ${JSON.stringify(table.branches.how)} over ${table.branches.sessions} sessions, ` +
    `${table.branches.episodes} caretaker EPISODES holding ${table.branches.careSessions} sessions ` +
    `(${table.branches.careShare}) -- counted as episodes because a republic sitting in one caretaker for ` +
    `twenty sessions is one caretaker, and counting rotation CALLS reported eight of them as 166`);

  /* ---------- S21d: THE AGREEMENT BITES ----------

     MEASURED BEFORE ANYTHING WAS WRITTEN, over 394 partner-sessions across
     six seeds: **0 promises kept, 19 broken.** Never once, in any campaign.

     Every outstanding `adopt` concession asked for a gap of exactly FOUR --
     p10 4, median 4, max 4 -- because all three mint sites take
     `pv5TopWants`, the party's BIGGEST gaps by construction. A bill moves a
     statute ONE rung and lives a median of 2 sessions, and `activeBillFor`
     forbids a second on the same statute while one is live. Four successive
     bills, eight to twenty sessions of the government's whole legislative
     programme, for one partner's one concession.

     That is S19c's `carry` defect in the coalition agreement, and this file
     already recorded the shape of it: "it took the biggest gap in the party's
     own table, which measured 4 on every adoption against an instrument that
     moves one, so it was reached 0 times in 136 adoptions."

     Six legs. The rung is one step and a legacy promise still asks for the
     summit; a promise carries a date and the clock books ONE breach; the
     government REACHES for it, which is the half that makes the rest live;
     and the two fields written-but-never-read -- `d.satisfaction` in the
     division, the ledger in the drift -- are read. */
  const bites = await page.evaluate(() => {
    const R = {};
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = 'ruthless'; S.rngState = seed; return S;
    }
    /* R9: the agreement only exists downstream of a formation */
    function step() {
      const rq = runQueue; runQueue = function (done) { UI.queue = []; rq(done); };
      UI.busy = false; try { endTurn(); } catch (e) {} runQueue = rq;
      UI.queue = []; UI.busy = false;
    }
    const partnerOf = () => {
      const co = S.coalition || [];
      return co.filter(x => x !== S.ruling && x !== playParty(S))[0] || null;
    };

    /* (a) A PROMISE ASKS FOR A RUNG, AND A LEGACY ONE STILL ASKS FOR THE
       SUMMIT. Read through `v21Rung` on a real concession, both shapes. */
    R.rung = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const pid = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0].id;
      const w = (PARTY[pid] || {}).wants || {};
      const ref = Object.keys(w).filter(id => POL[id] &&
        Math.abs(Math.min(w[id], POL[id].max) - (S.pol[id] || 0)) >= 2)[0];
      if (!ref) return { ran:false };
      const at = S.pol[ref] || 0, want = Math.min(w[ref], POL[ref].max);
      const fresh1 = v21Concede(S, ref);
      const legacy = { kind:'adopt', ref:ref, due:null, met:false };  /* no `from` */
      return { ran:true, ref:ref, at:at, want:want, gap:Math.abs(want - at),
        rung:v21Rung(S, pid, fresh1), legacyRung:v21Rung(S, pid, legacy),
        askedOneStep: Math.abs(v21Rung(S, pid, fresh1) - at) === V21_RUNG,
        legacyAsksSummit: v21Rung(S, pid, legacy) === want,
        dated: typeof fresh1.due === 'number' && fresh1.due > S.turn,
        due: fresh1.due - S.turn, DUE:V21_DUE,
        /* and it is MET at the rung, not at the summit */
        metAtRung: (() => {
          const was = S.pol[ref];
          S.pol[ref] = v21Rung(S, pid, fresh1);
          const m = v21Met(S, pid, fresh1);
          S.pol[ref] = at; const m0 = v21Met(S, pid, fresh1);
          S.pol[ref] = was; return m === true && m0 === false;
        })() };
    })();

    /* (b) DRIVEN, WHICH IS THE WHOLE CLAIM. The structural leg says the rung
       is reachable; only real sessions say a promise is ever kept. */
    R.driven = (() => {
      let kept = 0, broken = 0, late = 0, partnerSessions = 0, dated = 0, undated = 0;
      const sat = [];
      [4242, 90210, 7, 31337].forEach(seed => {
        fresh(seed);
        const seen = {};
        for (let i = 0; i < 40; i++) {
          step();
          (S.coalition || []).forEach(pid => {
            if (pid === S.ruling) return;
            const d = (S.coalitionDeals || {})[pid]; if (!d || !d.terms) return;
            partnerSessions++;
            if (typeof d.satisfaction === 'number') sat.push(d.satisfaction);
            (d.terms.concessions || []).forEach(c => {
              if (c.kind !== 'adopt') return;
              if (c.due === null || c.due === undefined) undated++; else dated++;
              if (c.late) late++;
            });
            const n = seen[pid] || 0;
            (d.ledger || []).slice(n).forEach(e => {
              if (e.kind === 'kept') kept++;
              if (e.kind === 'broken') broken++;
            });
            seen[pid] = (d.ledger || []).length;
          });
        }
      });
      return { kept:kept, broken:broken, late:late, partnerSessions:partnerSessions,
        dated:dated, undated:undated,
        satMin: sat.length ? +Math.min.apply(null, sat).toFixed(1) : null,
        satMax: sat.length ? +Math.max.apply(null, sat).toFixed(1) : null };
    })();

    /* (c) THE CLOCK BOOKS ONE BREACH AND ONLY ONE. Two mechanisms holding one
       date is what `expireInbox` and the street taught this file; the flag is
       what makes this one own its outcome. */
    R.clock = (() => {
      fresh(4242);
      /* AT LEAST A FEW SESSIONS IN, whatever the formation does. The first
         version drove `while (!partnerOf())` and a partner existed on turn
         ONE, so the probe set a due of `turn - 1` = 0 -- and 0 is falsy, so
         the game's own clause read it as no date at all. That found a real
         defect in the slice (`typeof c.due === 'number'` now, not
         truthiness), and it is also a probe that has to stand its clock
         somewhere a date can exist. */
      for (let i = 0; i < 40 && (!partnerOf() || S.turn < 5); i++) step();
      const pid = partnerOf(); if (!pid || S.turn < 5) return { ran:false, why:'no partner past turn five' };
      const d = S.coalitionDeals[pid]; if (!d || !d.terms) return { ran:false };
      const c = (d.terms.concessions || []).filter(x => x.kind === 'adopt' && !x.met)[0];
      if (!c) return { ran:false };
      /* THE PROMISE HAS TO BE UNMET IN THE BOOK, not merely unmarked. The
         sweep asks `v21Met` FIRST and returns on it, so a concession whose
         rung the book already stands at books a KEPT and never reaches the
         clock -- and the first version of this leg read the breach count
         going up and called it the clock, when it was the red-line scan in
         the same function. `booksOne` was passing for the wrong reason,
         which is why `marked` is in the gate: only the clock sets `late`. */
      c.met = false; c.late = false; c.due = S.turn - 1;
      c.from = (S.pol[c.ref] || 0);
      const want = v17Want(S, pid, c.ref);
      if (want !== undefined && POL[c.ref]) {
        /* stand the book one rung the WRONG side of where it was promised */
        const target = Math.min(want, POL[c.ref].max);
        S.pol[c.ref] = target > c.from ? c.from : Math.min(POL[c.ref].max, c.from);
        if (v21Met(S, pid, c)) S.pol[c.ref] = Math.max(0, Math.min(POL[c.ref].max,
          target > c.from ? c.from - 1 : c.from + 1));
        c.from = S.pol[c.ref];
      }
      if (v21Met(S, pid, c)) return { ran:false, why:'could not stand the book short of the rung' };
      const before = v17Broken(S, pid), sat0 = d.satisfaction;
      const snap = () => ({ due:c.due, turn:S.turn, met:c.met, late:c.late,
        kind:c.kind, inTerms:(d.terms.concessions || []).indexOf(c) });
      const pre = snap();
      v16RedLineTick(S);
      const after1 = v17Broken(S, pid), post = snap();
      v16RedLineTick(S); v16RedLineTick(S);
      const after3 = v17Broken(S, pid);
      return { ran:true, before:before, afterOne:after1, afterThree:after3,
        booksOne: after1 === before + 1, booksOnlyOne: after3 === after1,
        costsCohesion: d.satisfaction < sat0, marked: c.late === true,
        pre:pre, post:post,
        entries:(d.ledger || []).slice(-3).map(e => e.kind + ':' + e.ref + ':' + e.why) };
    })();

    /* (c2) A DUE OF NOUGHT IS A DATE, which the clock leg above cannot say
       because it stands its deadline at a turn where the number is truthy.
       `if (c.due && ...)` reads 0 as no date at all, so a promise due on the
       session before the first could never be late -- the `|| 0` family, where
       a falsy value and an absent one are treated as the same fact. Found by a
       probe that set a due of 0 by accident; asserted here on purpose. */
    R.zero = (() => {
      fresh(4242);
      for (let i = 0; i < 40 && (!partnerOf() || S.turn < 5); i++) step();
      const pid = partnerOf(); if (!pid) return { ran:false };
      const d = S.coalitionDeals[pid]; if (!d || !d.terms) return { ran:false };
      const c = (d.terms.concessions || []).filter(x => x.kind === 'adopt')[0];
      if (!c) return { ran:false };
      c.met = false; c.late = false; c.due = 0; c.from = (S.pol[c.ref] || 0);
      const want = v17Want(S, pid, c.ref);
      if (want !== undefined && POL[c.ref]) {
        const target = Math.min(want, POL[c.ref].max);
        if (v21Met(S, pid, c)) S.pol[c.ref] = Math.max(0, Math.min(POL[c.ref].max,
          target > c.from ? c.from - 1 : c.from + 1));
        c.from = S.pol[c.ref];
      }
      if (v21Met(S, pid, c)) return { ran:false, why:'book already at the rung' };
      v16RedLineTick(S);
      return { ran:true, due:c.due, turn:S.turn, late:c.late === true };
    })();

    /* (d) AND THE GOVERNMENT REACHES FOR IT. Making the rung reachable is
       worth nothing while `aiGovern` reads only its own `wants` -- a door
       opened on the callee while the caller walks past it. Driven through the
       real `aiGovern` on one board, with and without the promise. */
    R.reaches = (() => {
      fresh(4242);
      for (let i = 0; i < 40 && !partnerOf(); i++) step();
      let pid = partnerOf();
      /* AN ENGINE HAS TO GOVERN, or `aiGovern` returns at `leads` and the leg
         measures nothing -- which is exactly what the first version did: the
         probe plays `lp`, `lp` ended up governing, and `ran` came back false
         while the mechanism was fine. Seat one, the way the S21c govern leg
         does, and give it a partner with an agreement. */
      if (!pid || S.ruling === playParty(S)) {
        const gov = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0];
        const par = PARTIES.filter(p => p.id !== playParty(S) && p.id !== gov.id && !S.banned[p.id])[0];
        if (!gov || !par) return { ran:false, why:'no engine pair' };
        S.ruling = gov.id; S.coalition = [gov.id, par.id]; S.partner = par.id;
        pv5EnsureState(S, false);
        pid = par.id;
      }
      const d = S.coalitionDeals[pid]; if (!d || !d.terms) return { ran:false, why:'no agreement' };
      /* a statute the GOVERNMENT does not want, promised to the partner */
      const gw = (PARTY[S.ruling] || {}).wants || {};
      const ref = Object.keys((PARTY[pid] || {}).wants || {}).filter(id =>
        POL[id] && gw[id] === undefined && policyOpen(S, POL[id]) &&
        (S.pol[id] || 0) < POL[id].max)[0];
      if (!ref) return { ran:false };
      const run = (promised) => {
        S.bills = [];
        d.terms.concessions = promised ? [v21Concede(S, ref)] : [];
        if (S.turn % 2) S.turn += 1;
        aiGovern(S);
        const b = S.bills.filter(x => x.owner === 'government')[0];
        return b ? b.policy : null;
      };
      const without = run(false), withIt = run(true);
      const probeBoard = (pid, d) => {
        /* READ AGAINST THE THUMB, NOT AGAINST AN ABSOLUTE BAR. The first
           version wanted a statute forecasting under 25 and found none on
           this board, so the claim went unmeasured -- and the claim is not
           "a hopeless bill", it is that the thumb is FINITE. A promise
           whose forecast sits more than `V21_PROMISE_PULL` below what the
           government would otherwise lay must stay off the paper. */
        const fc = (id, dir) => {
          let f = null;
          try { f = billForecast(S, v21Probe(S, S.ruling, id, dir || 1)); } catch (e) { f = null; }
          return f ? f.lower : null;
        };
        let alt = -1;
        Object.keys((PARTY[S.ruling] || {}).wants || {}).forEach(id => {
          if (!POL[id] || !policyOpen(S, POL[id])) return;
          const v = fc(id, 1); if (v !== null && v > alt) alt = v;
        });
        let worst = null, worstV = 1e9;
        Object.keys((PARTY[pid] || {}).wants || {}).forEach(id => {
          if (!POL[id] || ((PARTY[S.ruling] || {}).wants || {})[id] !== undefined || !policyOpen(S, POL[id])) return;
          if ((S.pol[id] || 0) >= POL[id].max) return;
          const v = fc(id, 1);
          if (v !== null && v < worstV) { worstV = v; worst = id; }
        });
        if (!worst || alt < 0) return { ran:false, why:'no pair to compare' };
        const deficit = +(alt - worstV).toFixed(1);
        if (deficit <= V21_PROMISE_PULL) {
          return { ran:false, why:'this board has no promise below the thumb',
            deficit:deficit, pull:V21_PROMISE_PULL };
        }
        S.bills = [];
        d.terms.concessions = [v21Concede(S, worst)];
        if (S.turn % 2) S.turn += 1;
        aiGovern(S);
        const b = S.bills.filter(x => x.owner === 'government')[0];
        return { ran:true, ref:worst, laid:b ? b.policy : null,
          forecast:+worstV.toFixed(1), best:+alt.toFixed(1), deficit:deficit,
          pull:V21_PROMISE_PULL, refused: !b || b.policy !== worst };
      };
      /* the deficit exceeds the thumb on 32% of promise-boards -- measured,
         715 of them over eight seeds -- so the leg SEARCHES for one rather
         than assuming this board is it. The first version asked seed 4242
         alone, found a deficit of 8.8, and could not run. */
      const hunt = () => {
        const seeds = [4242, 90210, 7, 31337, 1, 555];
        for (let s = 0; s < seeds.length; s++) {
          fresh(seeds[s]);
          for (let i = 0; i < 30; i++) {
            step();
            if (!S.ruling || S.ruling === playParty(S)) continue;
            const par = (S.coalition || []).filter(x => x !== S.ruling && x !== playParty(S))[0];
            if (!par) continue;
            const dd = (S.coalitionDeals || {})[par];
            if (!dd || !dd.terms) continue;
            const got = probeBoard(par, dd);
            if (got.ran) return got;
          }
        }
        return { ran:false, why:'no board in the sweep put a promise below the thumb' };
      };
      /* AND IT IS A PREFERENCE, NOT AN OVERRIDE -- which the equality above
         cannot say, and its poison proved it: with the thumb set to 9,999 the
         government lays the promise every time and `laysThePromise` is still
         true. So the same board is asked about a promise the CHAMBER would
         throw out. `V21_PROMISE_PULL` is 12 forecast points, the thumb
         `V20_AIM_BILL` already puts on a publicly named aim, so a statute
         forecasting far below the alternative stays off the paper however
         solemnly it was promised. */
      const hopeless = hunt();
      return { ran:true, ref:ref, without:without, withIt:withIt,
        laysThePromise: withIt === ref, differs: without !== withIt,
        governmentDoesNotWantIt: gw[ref] === undefined, hopeless:hopeless };
    })();

    /* (e2) AND KEEPING ONE PAYS. `v17Ledger` records a `kept` entry whatever
       the payment is, so counting entries says a promise was kept and NOT
       that it was worth anything -- with `V17_KEPT * rungs` replaced by nought
       the driven count is unchanged and the arm was green. Read the cohesion
       either side of the moment it is met. */
    R.pays = (() => {
      fresh(4242);
      for (let i = 0; i < 40 && (!partnerOf() || S.turn < 5); i++) step();
      const pid = partnerOf(); if (!pid) return { ran:false };
      const d = S.coalitionDeals[pid]; if (!d || !d.terms) return { ran:false };
      const c = (d.terms.concessions || []).filter(x => x.kind === 'adopt')[0];
      if (!c || !POL[c.ref]) return { ran:false };
      const want = v17Want(S, pid, c.ref);
      if (want === undefined) return { ran:false };
      c.met = false; c.late = false; c.from = (S.pol[c.ref] || 0);
      const rung = v21Rung(S, pid, c);
      if (rung === null || rung === c.from) return { ran:false, why:'no rung to move' };
      d.satisfaction = 50;
      const kept0 = v17Kept(S, pid), sat0 = d.satisfaction;
      S.pol[c.ref] = rung;                       /* the book reaches the rung */
      v16RedLineTick(S);
      const oneRung = { keptBefore:kept0, keptAfter:v17Kept(S, pid),
        satBefore:sat0, satAfter:+d.satisfaction.toFixed(2),
        recorded: v17Kept(S, pid) > kept0, paid: d.satisfaction > sat0,
        gain:+(d.satisfaction - sat0).toFixed(2) };
      return { ran:true, keptBefore:oneRung.keptBefore, keptAfter:oneRung.keptAfter,
        satBefore:oneRung.satBefore, satAfter:oneRung.satAfter,
        recorded:oneRung.recorded, paid:oneRung.paid,
        gain:oneRung.gain, KEPT:V17_KEPT };
    })();

    /* (f2) AND THE FAMILY IS DECLARED BEFORE ITS CALLER RUNS. `pv5EnsureState`
       calls `v21Concede` from an earlier chunk than the agreement lives in,
       inside `enrichState`, so a declaration beside the rest of S21d is not
       yet defined when the caller runs -- `POWERS.push` wearing a different
       hat, and the first build of this slice walked into it. Structural,
       because a load-order fault cannot be poisoned by a string edit. */
    R.order = (() => {
      const html = document.documentElement.outerHTML;
      const chunkOf = (needle) => {
        const i = html.indexOf(needle);
        return i < 0 ? -1 : html.slice(0, i).split('<script').length;
      };
      return { concede:chunkOf('function v21Concede'),
        due:chunkOf('var V21_DUE'),
        caller:chunkOf('function pv5EnsureState'),
        beforeCaller: chunkOf('function v21Concede') <= chunkOf('function pv5EnsureState') &&
                      chunkOf('var V21_DUE') <= chunkOf('function pv5EnsureState') };
    })();

    /* (e) THE DIVISION READS THE AGREEMENT. `d.satisfaction` was written by
       five sites and read by the vote in none: a partner three broken
       promises deep whipped its benches exactly as hard as one whose every
       concession had been kept. */
    R.vote = (() => {
      fresh(4242);
      for (let i = 0; i < 40 && !partnerOf(); i++) step();
      const pid = partnerOf(); if (!pid) return { ran:false };
      const d = S.coalitionDeals[pid]; if (!d) return { ran:false };
      const p = POLICIES.filter(x => policyOpen(S, x) && (S.pol[x.id] || 0) < x.max)[0];
      if (!p) return { ran:false };
      const bill = { id:'v21vote', policy:p.id, dir:1, owner:'government', sponsor:S.ruling,
        stage:'assembly', lines:{}, notes:[], concessions:0, committee:0, whip:0,
        upperDeal:0, confidence:false, urgent:false, playerPosition:null };
      const at = (s) => { d.satisfaction = s; return +partyBillSupport(S, pid, bill).toFixed(2); };
      const was = d.satisfaction;
      const low = at(22), mid = at(V21_PARTNER_PIVOT), high = at(74);
      d.satisfaction = was;
      return { ran:true, low:low, mid:mid, high:high,
        rises: high > mid && mid > low,
        /* the sign flips INSIDE the range the game produces (20..76) */
        flipsInRange: low < mid && high > mid,
        spread:+(high - low).toFixed(2), pivot:V21_PARTNER_PIVOT };
    })();

    /* (f) AND THE DRIFT READS THE RECORD. The ledger was written by the
       scanner, printed on the card, read by the walkout -- and had no say in
       where cohesion settles, so a partner three broken promises deep drifted
       back to exactly where a kept one did. */
    R.drift = (() => {
      fresh(4242);
      for (let i = 0; i < 40 && !partnerOf(); i++) step();
      const pid = partnerOf(); if (!pid) return { ran:false };
      const d = S.coalitionDeals[pid]; if (!d) return { ran:false };
      const run = (broken) => {
        d.ledger = [];
        for (let i = 0; i < broken; i++) d.ledger.push({ kind:'broken', ref:'x', why:'probe', cost:8, turn:S.turn });
        d.satisfaction = 50;
        pv5CoalitionTick(S);
        return +d.satisfaction.toFixed(3);
      };
      const clean = run(0), one = run(1), three = run(3), five = run(5);
      d.ledger = [];
      return { ran:true, clean:clean, one:one, three:three, five:five,
        holdsDown: clean > one && one > three,
        cappedAtPatience: Math.abs(five - three) < 1e-6, patience:V17_PATIENCE };
    })();
    return R;
  });

  const bitesOk =
    bites.rung.ran === true && bites.rung.gap >= 2 && bites.rung.askedOneStep === true &&
    bites.rung.legacyAsksSummit === true && bites.rung.dated === true &&
    bites.rung.due === bites.rung.DUE && bites.rung.metAtRung === true &&
    bites.driven.partnerSessions > 200 && bites.driven.kept > 5 &&
    bites.driven.undated === 0 && bites.driven.dated > 100 &&
    bites.clock.ran === true && bites.clock.booksOne === true &&
    bites.clock.booksOnlyOne === true && bites.clock.costsCohesion === true &&
    /* only the CLOCK sets `late`, so this is what says the breach was the
       clock's and not the red-line scan running in the same function */
    bites.clock.marked === true &&
    bites.zero.ran === true && bites.zero.late === true &&
    bites.reaches.ran === true && bites.reaches.laysThePromise === true &&
    bites.reaches.differs === true && bites.reaches.governmentDoesNotWantIt === true &&
    /* a preference over the order paper, not an override of the chamber */
    bites.reaches.hopeless.ran === true && bites.reaches.hopeless.refused === true &&
    bites.pays.ran === true && bites.pays.recorded === true && bites.pays.paid === true &&
    bites.order.beforeCaller === true &&
    bites.vote.ran === true && bites.vote.rises === true && bites.vote.flipsInRange === true &&
    bites.drift.ran === true && bites.drift.holdsDown === true &&
    bites.drift.cappedAtPatience === true;
  say(bitesOk, 'the agreement bites',
    `MEASURED BEFORE ANYTHING WAS WRITTEN, over 394 partner-sessions across six seeds: **0 PROMISES KEPT, 19 ` +
    `BROKEN.** Never once, in any campaign · THE CAUSE IS S19c'S DEFECT IN THE COALITION AGREEMENT: every ` +
    `outstanding \`adopt\` concession asked for a gap of exactly FOUR -- p10 4, median 4, max 4 -- because all ` +
    `three mint sites take \`pv5TopWants\`, the party's BIGGEST gaps by construction. A bill moves a statute ONE ` +
    `rung and lives a median of 2 sessions, and \`activeBillFor\` forbids a second on the same statute while one ` +
    `is live, so a promise needed four successive bills: eight to twenty sessions of the government's whole ` +
    `legislative programme for one partner's one concession. This file already recorded the shape of it -- ` +
    `"it took the biggest gap in the party's own table, which measured 4 against an instrument that moves one, ` +
    `so it was reached 0 times in 136 adoptions" -- and nobody had measured the agreement · \`pv5TopWants\` IS ` +
    `NOT TOUCHED, because the dossier, the demand card, the offer and the renegotiation all read it and a ` +
    `shared body right for a new caller can be wrong for the old ones. What changes is what a CONCESSION ` +
    `records: on a gap of ${bites.rung.gap} it asks for ${bites.rung.rung} where the party's target is ` +
    `${bites.rung.want} (${bites.rung.askedOneStep}), and a promise from a save written before this slice has no ` +
    `\`from\` and still asks for the summit (${bites.rung.legacyAsksSummit}) -- a save may not quietly lose what ` +
    `it was governed under. It is MET at the rung and not before (${bites.rung.metAtRung}) · AND IT CARRIES A ` +
    `DATE, where \`due\` was literally \`null\` at all three mint sites so nothing could ever be late: ` +
    `${bites.rung.due} sessions, which is the INSTRUMENT'S and not a number -- \`aiGovern\` runs every other ` +
    `session (2), a bill lives a p90 of 5, and one more for a government with its own programme to reach it · ` +
    `DRIVEN, WHICH IS THE WHOLE CLAIM: ${bites.driven.kept} promises kept and ${bites.driven.broken} broken over ` +
    `${bites.driven.partnerSessions} partner-sessions, against 0 and 19 before, with ${bites.driven.undated} ` +
    `concessions still undated of ${bites.driven.dated + bites.driven.undated} -- AND KEEPING ONE PAYS, which ` +
    `counting ledger entries cannot say: \`v17Ledger\` records a \`kept\` whatever the payment is, so with ` +
    `\`V17_KEPT * rungs\` replaced by nought the driven count was unchanged and this arm was green. Read either ` +
    `side of the moment it is met, cohesion goes ${bites.pays.satBefore} to ${bites.pays.satAfter} for ` +
    `${bites.pays.KEPT} for the promise (${bites.pays.gain}) -- A PER-RUNG PAYMENT STOOD HERE AND CAME OUT ON ITS OWN POISON: \`v21Rungs\` multiplied it by the rungs covered, flattening it to a flat rate changed nothing, and the reason is arithmetic -- \`v21Rung\` caps a fresh promise at one rung and a legacy one has no \`from\` to measure from, so the multiplier could only ever be 1. A knob nothing in the game can turn, deleted rather than shipped, the fifth this programme has found in a poison list · THE CLOCK BOOKS ONE BREACH AND ` +
    `ONLY ONE (${bites.clock.booksOne}/${bites.clock.booksOnlyOne}), because when two mechanisms hold the same ` +
    `date one owns the outcome -- which is what the street's demand and \`expireInbox\` taught this file · AND ` +
    `THE GOVERNMENT REACHES FOR IT, which is the half that makes the rest live: \`aiGovern\` read the ruling ` +
    `party's OWN \`wants\` and had no idea the agreement existed, so a promise would be kept only where the ` +
    `government happened to want the same statute. On a statute the government does not want at all ` +
    `(${bites.reaches.governmentDoesNotWantIt}) it lays ${bites.reaches.without} unpromised and ` +
    `${bites.reaches.withIt} promised (${bites.reaches.differs}) -- as a CANDIDATE forecast on the same probe ` +
    `\`v19BillFor\` uses, carrying the thumb \`V20_AIM_BILL\` already puts on a publicly named aim -- AND IT IS ` +
    `A PREFERENCE AND NOT AN OVERRIDE, which the equality alone cannot say and whose poison proved it: with the ` +
    `thumb at 9,999 the government lays the promise every time and that clause is still true. Asked about a ` +
    `promise sitting further below what the government would otherwise lay than the thumb is worth ` +
    `(${bites.reaches.hopeless.ref} forecasts ${bites.reaches.hopeless.forecast} against ` +
    `${bites.reaches.hopeless.best}, a deficit of ${bites.reaches.hopeless.deficit} against a thumb of ` +
    `${bites.reaches.hopeless.pull}) it lays ${bites.reaches.hopeless.laid} instead ` +
    `(${bites.reaches.hopeless.refused}) -- read against the THUMB and not against an absolute bar, because ` +
    `the claim is not "a hopeless bill" but that the thumb is FINITE · AND A DUE OF NOUGHT IS A DATE: ` +
    `\`if (c.due && ...)\` read 0 as no ` +
    `date at all, so a promise due on the session before the first could never be late -- the \`|| 0\` family, ` +
    `where a falsy value and an absent one are treated as the same fact. Found by a probe that set one by ` +
    `accident, asserted here on purpose (${bites.zero.late}) · AND THE FAMILY IS DECLARED BEFORE ITS CALLER ` +
    `RUNS (${bites.order.beforeCaller}): \`pv5EnsureState\` calls \`v21Concede\` from chunk ` +
    `${bites.order.caller} inside \`enrichState\`, so a declaration beside the rest of the agreement is not yet ` +
    `defined when the caller runs -- \`POWERS.push\` wearing a different hat, and the first build of this slice ` +
    `walked into it · AND TWO FIELDS ` +
    `WRITTEN BUT NEVER READ ARE READ. \`d.satisfaction\` reached the division in NO place: a partner three ` +
    `broken promises deep whipped its benches for the government exactly as hard as one whose every concession ` +
    `had been kept, both worth a flat +12. It is ${bites.vote.low} at a cohesion of 22, ${bites.vote.mid} at the ` +
    `pivot of ${bites.vote.pivot} and ${bites.vote.high} at 74 (${bites.vote.rises}), a spread of ` +
    `${bites.vote.spread} whose sign flips INSIDE the range the game produces -- 20 to 76, measured · and the ` +
    `LEDGER reaches the drift, which read the priorities and the portfolios and not the record: cohesion ` +
    `settles at ${bites.drift.clean} clean, ${bites.drift.one} on one broken promise and ${bites.drift.three} on ` +
    `three (${bites.drift.holdsDown}), capped at \`V17_PATIENCE\` like the walkout floor it mirrors ` +
    `(${bites.drift.cappedAtPatience}) -- the floor RISES six a promise as this falls six, so the two close on ` +
    `each other and three broken promises is a government in trouble rather than a number on a card`);

  /* ---------- S19b: A PARTY KNOWS WHO IS IN ITS WAY ----------
     S19a gave every party an aim and left it alone on the board: nothing
     asked what the OTHERS were after, so a party whose goal was being taken
     off it by a rival had no way to find out. Six arms, and they pull against
     each other on purpose. The relation must be SYMMETRIC where it claims to
     be and asymmetric where it claims that (a relation declared at one end
     only is this file's longest-running defect). The read must not CREATE,
     because `v19Goal` adopts and adopting rolls. The term must change the
     RANKING rather than merely compute, and it must do it THROUGH THE GAME'S
     OWN PATH over driven sessions rather than by reassembling the formula.
     And the constant must sit where the measured distribution puts it, with
     the measurement taken in the same run rather than read off the constant. */
  const rival = await page.evaluate(() => {
    const R = {};
    function fresh(seed, level, me) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', me || 'lp'), false);
      S.aiLevel = level; S.rngState = seed;
      return S;
    }
    function drive(n) {
      for (let i = 0; i < n; i++) {
        UI.queue = []; UI.busy = false;
        try { endTurn(); } catch (e) { return e.message; }
        UI.queue = []; UI.busy = false;
      }
      return null;
    }
    const other = (st, not) => PARTIES.filter(p => p.id !== not && p.id !== playParty(st) && !st.banned[p.id]).map(p => p.id);

    /* (a) EVERY CARD IN THE DECK CARRIES A RIVALRY WEIGHT. Derived from the
       deck rather than counted against a number, so a card a later slice adds
       reddens here instead of silently scoring nought against every rival.
       This is the guard a hand-kept list of ids cannot have. */
    R.uncovered = V16_AI_DECK.map(c => c.id).filter(id => V19_RIVAL_WORTH[id] === undefined);
    R.deckN = V16_AI_DECK.length;
    R.ghostWeights = Object.keys(V19_RIVAL_WORTH).filter(id => V16_AI_DECK.every(c => c.id !== id));

    /* (b) THE READ DOES NOT CREATE. `v19Goal` ADOPTS when a party has none
       and adopting calls `rand()`, so one party asking about another through
       that door would seed a goal for the party it asked about and take
       numbers off the stream outside the cadence. Asked of both doors in the
       same state, because "the accessor is safe" means nothing without the
       contrast that the other one is not. */
    fresh(4242, 'shrewd');
    PARTIES.forEach(p => { const a = v16Ai(S)[p.id]; if (a) a.goal = null; });
    const rng0 = S.rngState;
    other(S).forEach(id => { for (let i = 0; i < 20; i++) v19GoalSeen(S, id); });
    R.seenMade = other(S).filter(id => !!v19GoalSeen(S, id)).length;
    R.seenRoll = S.rngState !== rng0;
    v19Goal(S, other(S)[0]);
    R.goalMade = !!v19GoalSeen(S, other(S)[0]);
    R.goalRoll = S.rngState !== rng0;

    /* (c) THE ASYMMETRIC CLAUSE IS READ FROM THE TARGET'S SIDE. `oust` is the
       one goal that names a party, and it is adopted FROM the grudge ledger,
       so the asking party's own hostility is already in the ledger the picker
       reads. What it could not see is somebody else's plan for it. */
    fresh(4242, 'shrewd');
    const ps = other(S), A = ps[0], B = ps[1];
    PARTIES.forEach(p => { const a = v16Ai(S)[p.id]; if (a) a.goal = null; });
    R.aimedBefore = v19Rivalry(S, B, A);
    v16Ai(S)[A].goal = { kind:'oust', ref:B, since:S.turn };
    R.aimedSeen = v19Rivalry(S, B, A);      /* B reads A coming for it */
    R.aimedOwn = v19Rivalry(S, A, B);       /* A's own hostility is the ledger's business */

    /* (d) AND THE SYMMETRIC CLAUSES ARE SYMMETRIC, BOTH WAYS ROUND. Asserted
       rather than assumed: the first version of S17m's conflict check passed
       on a table that only worked one way. Each pair is seeded, read from
       both ends, and then one end is cleared to prove the reading came from
       the pair and not from something standing behind it. */
    R.sym = {};
    [['ground', 'blocA'], ['office', 'chan'], ['enter', 'x']].forEach(([kind, ref]) => {
      fresh(4242, 'shrewd');
      const q = other(S), a = q[0], b = q[1];
      const r0 = kind === 'enter' ? S.ruling : ref;
      PARTIES.forEach(p => { const x = v16Ai(S)[p.id]; if (x) x.goal = null; });
      v16Ai(S)[a].goal = { kind:kind, ref:r0, since:S.turn };
      v16Ai(S)[b].goal = { kind:kind, ref:r0, since:S.turn };
      const ab = v19Rivalry(S, a, b), ba = v19Rivalry(S, b, a);
      v16Ai(S)[b].goal = { kind:kind, ref:r0 + '-elsewhere', since:S.turn };
      const apart = v19Rivalry(S, a, b);
      R.sym[kind] = { ab:+ab.toFixed(3), ba:+ba.toFixed(3), apart:+apart.toFixed(3) };
    });

    /* (e) THE TERM CHANGES THE RANKING, AND ONLY WHERE THE SETTING BUYS IT.
       Not the sign and not the magnitude: whether the party would now rather
       play a card that reaches the rival than one that does not. `platform`
       is the control, because it is the one card in the deck whose weight is
       nought by design -- a party talking to its own members. */
    R.rank = {};
    ['instinct', 'purposeful', 'shrewd', 'ruthless'].forEach(level => {
      fresh(4242, level);
      const q = other(S), a = q[0], b = q[1];
      PARTIES.forEach(p => { const x = v16Ai(S)[p.id]; if (x) x.goal = null; });
      const atk = V16_AI_DECK.filter(c => c.id === 'attack')[0];
      const plat = V16_AI_DECK.filter(c => c.id === 'platform')[0];
      if (!atk || !plat) { R.rank[level] = null; return; }
      const calm = v19Score(S, a, atk, null) - v19Score(S, a, plat, null);
      v16Ai(S)[b].goal = { kind:'oust', ref:a, since:S.turn };
      const heat = v19Score(S, a, atk, null) - v19Score(S, a, plat, null);
      R.rank[level] = { calm:+calm.toFixed(3), heat:+heat.toFixed(3), gain:+(heat - calm).toFixed(3) };
    });

    /* (f) AND THE ATTACK LANDS ON THE PARTY THAT IS AFTER IT, through the
       card's own `run` rather than through the picker's arithmetic. The
       ledger is emptied first, so the fallback is the government and any
       other answer had to come from the rivalry read. Driven at both ends of
       the setting: at `instinct` the push is nought and the target is the
       government the shipped line picks. */
    R.target = {};
    ['instinct', 'ruthless'].forEach(level => {
      fresh(4242, level);
      const q = other(S).filter(id => id !== S.ruling), a = q[0], b = q[1];
      if (!a || !b) { R.target[level] = null; return; }
      PARTIES.forEach(p => { const x = v16Ai(S)[p.id]; if (x) { x.goal = null; x.grudge = {}; } });
      v16Ai(S)[b].goal = { kind:'oust', ref:a, since:S.turn };
      const atk = V16_AI_DECK.filter(c => c.id === 'attack')[0];
      let hit = null;
      const saved = shiftPartyRel;
      shiftPartyRel = function (st, pid, n) { return saved(st, pid, n); };
      const before = JSON.stringify(S.machine);
      atk.run(S, a);
      shiftPartyRel = saved;
      const after = S.machine;
      const bef = JSON.parse(before);
      PARTIES.forEach(p => { if (p.id !== a && (after[p.id] || 0) < (bef[p.id] || 0) - 1e-9) hit = p.id; });
      R.target[level] = { hit:hit, ruling:S.ruling, rival:b, aimedAt:a };
    });

    /* (g) AND IT REACHES THE PLAYER, over driven sessions and out of the
       panel's own HTML. Calling the function is not testing the wiring: the
       record is written in `v16AiTurn`, carried on `a.why`, and rendered by
       `v16AiPanel`, and a poison at any of the three leaves the sentence off
       the page. */
    /* THE FIRST VERSION OF THIS ARM DROVE FORTY SESSIONS AND READ `why` ONCE
       AT THE END, AND IT WAS THE PROBE THAT WAS WRONG. `a.why` is a SNAPSHOT
       that each initiative overwrites, a party acts on about a quarter of its
       sessions, and a foe is on the board for about a tenth of them -- so the
       chance that a given party's LAST act was the one with a rival is a few
       per cent, and six parties came out at nought on a build where the
       record was being written correctly all along. A snapshot read once
       undersamples a signal that overwrites itself; the tally has to be taken
       as the writes happen.
       Two readings, kept apart: how often the record is WRITTEN with a rival
       over a long run, and whether the page SAYS so. Joining them into one
       would let either half carry the other, which is S17n's mistake. */
    /* THE SECOND VERSION OF THIS ARM BROKE ITS OWN TALLY. It stopped the loop
       at the first session the page said the sentence, and the tally of how
       often the record is WRITTEN rode in the same loop -- so on a build where
       the page said it at session one, `acts` came out at 4 against a floor of
       30 and the arm failed for being right quickly. The two readings are kept
       apart now: a fixed drive accumulates the tally, and the page is asked
       every session without ending it. */
    /* AND FOUR SEEDS, FOR THE REASON THE SCALE ARM READS FOUR. Driven on one,
       this asked whether any party ACTED while carrying a rival, which is a
       conjunction of two ~10% events on a single stream: on seed 90210 under
       the S19d build it came out at nought across 120 sessions and 174
       initiatives, on a build writing the record correctly. */
    R.panel = { written:0, acts:0, inTheWay:false, atSession:null, sessions:120, seeds:0 };
    [90210, 4242, 31337, 8080].forEach(seed => {
      fresh(seed, 'ruthless');
      R.panel.seeds++;
      const seenAt = {};
      for (let i = 0; i < 120; i++) {
        drive(1);
        PARTIES.forEach(p => {
          const w = (v16Ai(S)[p.id] || {}).why;
          if (!w || seenAt[p.id] === w.turn + ':' + w.card) return;
          seenAt[p.id] = w.turn + ':' + w.card;
          R.panel.acts++;
          if (w.foe) R.panel.written++;
        });
        if (!R.panel.inTheWay) {
          let html = '';
          try { html = v16AiPanel(); } catch (e) { html = ''; }
          if (/in the way/.test(html)) { R.panel.inTheWay = true; R.panel.atSession = i + 1; }
        }
      }
    });

    /* (h) AND IT REACHES A REAL PICK, THROUGH `v19Choose`. Every arm above
       calls a function: (e) scores two cards by hand, (f) runs the attack
       card, (g) reads a record. NONE of them goes through the chooser, and
       the poison run said so -- forcing an empty board into `v19Choose` left
       all eight of them green while every real pick in the game lost the
       term.

       THE FIRST TWO STATISTICS FOR THIS WERE BOTH WRONG AND BOTH IN THE PROBE.
       The share of picks going to a card with ANY weight saturates at 94%,
       because eight of the ten cards carry one, so there was no room for the
       reading to move it. And `instinct` cannot be the control: `v19Goal`
       returns null below `purposeful`, so no party there has an aim, no aim
       means no rivalry and no rivalry means no foe board to compare -- the
       control arm read n=0 and the gap read `null`.
       What works is the rate a card is picked GIVEN IT WAS OPEN, which takes
       the posture and the purse out of the reading, split by whether the board
       carried the rival that card answers.

       THE SHAPE OF THIS ARM WAS WRONG THREE TIMES AND THE FOURTH IS DIFFERENT
       IN KIND. It asserted a RATE in play -- how often a card is taken on a
       board with a rival against one without -- and a rate is a joint fact
       about the whole model. S19c put a seventh goal in the pool and the
       contested-bloc sample went from 16 boards to 3; S19d put an eleventh
       card in the deck and better bills for it to compete with, and the
       `attack` reading inverted from +.151 to -.022 without anything touching
       the rivalry term. Both times the mechanism was intact and the
       measurement had moved under it.
       So the term is ISOLATED instead, the way S19d isolates the manifesto:
       the same seeds are driven twice in one process, once with every rivalry
       weight at nought and once as shipped, and the difference is the term and
       nothing else. Competing cards, goal mixes and posture filters are
       identical on both sides and cancel. */
    R.pick = {};
    (() => {
      const w0 = {};
      Object.keys(V19_RIVAL_WORTH).forEach(k => { w0[k] = V19_RIVAL_WORTH[k]; });
      const heavy = Object.keys(w0).filter(k => w0[k] >= .45);
      const run = () => {
        const t = { foeOpen:0, foeHeavy:0, calmOpen:0, calmHeavy:0 };
        const savedChoose = v19Choose;
        v19Choose = function (st, pid, open, goal, rv) {
          const got = savedChoose.call(this, st, pid, open, goal, rv);
          if (!V19_SIMULATING && got && open.length > 1) {
            const r = rv || v19Rival(st, pid);
            const isHeavy = heavy.indexOf(got.id) >= 0 ? 1 : 0;
            if (r.foeAt > 0) { t.foeOpen++; t.foeHeavy += isHeavy; }
            else { t.calmOpen++; t.calmHeavy += isHeavy; }
          }
          return got;
        };
        try { [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415].forEach(s2 => { fresh(s2, 'ruthless'); drive(100); }); }
        finally { v19Choose = savedChoose; }
        return t;
      };
      Object.keys(V19_RIVAL_WORTH).forEach(k => { V19_RIVAL_WORTH[k] = 0; });
      const off = run();
      Object.keys(w0).forEach(k => { V19_RIVAL_WORTH[k] = w0[k]; });
      const on = run();
      const rt = (x, y) => y ? +(x / y).toFixed(3) : null;
      R.pick = {
        heavyCards:heavy.length,
        offFoe:rt(off.foeHeavy, off.foeOpen), onFoe:rt(on.foeHeavy, on.foeOpen),
        offCalm:rt(off.calmHeavy, off.calmOpen), onCalm:rt(on.calmHeavy, on.calmOpen),
        foeN:on.foeOpen, calmN:on.calmOpen
      };
      /* what the term buys ON a board with a rival, net of what it does on a
         board without one -- a difference of differences, so anything the
         weights do to the deck at large cancels out too */
      R.pick.onFoeGain = (R.pick.onFoe !== null && R.pick.offFoe !== null) ? +(R.pick.onFoe - R.pick.offFoe).toFixed(3) : null;
      R.pick.onCalmGain = (R.pick.onCalm !== null && R.pick.offCalm !== null) ? +(R.pick.onCalm - R.pick.offCalm).toFixed(3) : null;
      R.pick.netGain = (R.pick.onFoeGain !== null && R.pick.onCalmGain !== null) ? +(R.pick.onFoeGain - R.pick.onCalmGain).toFixed(3) : null;
    })();

    /* (i) AND THE CONSTANT SITS WHERE THE DISTRIBUTION PUTS IT. Measured in
       THIS run rather than read off the constant: a check parameterised by
       the number it is checking agrees with any value that number holds. The
       claim is a relationship -- an intention outweighs an ordinary grievance
       and loses to a real one -- so both ends are asserted. */
    /* FOUR SEEDS, NOT ONE, AND THE SHIPPED BUILD IS WHY. Read on a single
       seed this was a lottery: over twelve seeds of the build S19b shipped,
       one of them (90210) produces NO foe board at all, and sixty sessions of
       31337 produces none either on the corrected build where a hundred
       produces eighteen. A gate whose sample can be empty on a CORRECT build
       is a flake waiting to be mistaken for a defect. */
    const gr = [], mags = [];
    const savedTurn = v16AiTurn;
    v16AiTurn = function (st) {
      PARTIES.forEach(p => {
        if (p.id === playParty(st) || st.banned[p.id]) return;
        PARTIES.forEach(q => { if (q.id !== p.id && !st.banned[q.id]) gr.push(v16Grudge(st, p.id, q.id)); });
        const rv = v19Rival(st, p.id);
        if (rv.foeAt > 0) mags.push(rv.foeAt);
      });
      return savedTurn.call(this, st);
    };
    [31337, 4242, 90210, 555].forEach(s2 => { fresh(s2, 'shrewd'); drive(60); });
    v16AiTurn = savedTurn;
    const at = (arr, p) => { if (!arr.length) return null; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
    const typical = mags.length ? at(mags, .5) : 0;
    R.scale = {
      n:gr.length, foeN:mags.length,
      p90:+at(gr, .9).toFixed(1), p99:+at(gr, .99).toFixed(1),
      worth:+(V19_RIVAL_PUSH * typical).toFixed(1),
      typicalMag:+(typical || 0).toFixed(2)
    };
    return R;
  });

  const rvOk =
    rival.uncovered.length === 0 && rival.ghostWeights.length === 0 && rival.deckN >= 10 &&
    rival.seenMade === 0 && rival.seenRoll === false &&
    rival.goalMade === true && rival.goalRoll === true &&
    rival.aimedBefore === 0 && rival.aimedSeen < 0 && rival.aimedOwn === 0 &&
    ['ground', 'office', 'enter'].every(k => rival.sym[k] &&
      rival.sym[k].ab < 0 && rival.sym[k].ab === rival.sym[k].ba && rival.sym[k].apart === 0) &&
    rival.rank.instinct && rival.rank.purposeful && rival.rank.shrewd && rival.rank.ruthless &&
    rival.rank.instinct.gain === 0 && rival.rank.purposeful.gain === 0 &&
    rival.rank.shrewd.gain > 0 && rival.rank.ruthless.gain > rival.rank.shrewd.gain &&
    rival.target.instinct && rival.target.ruthless &&
    rival.target.instinct.hit === rival.target.instinct.ruling &&
    rival.target.ruthless.hit === rival.target.ruthless.rival &&
    rival.panel.written > 0 && rival.panel.inTheWay === true && rival.panel.acts > 30 &&
    rival.pick.foeN >= 50 && rival.pick.calmN >= 200 && rival.pick.heavyCards >= 3 &&
    /* A SHAPE CLAIM, NOT A MAGNITUDE. The absolute lift is shared out among
       every term in `v19Score`, so each slice that adds one dilutes it: S19e's
       temperament took this from .044 to .036 with the rivalry term untouched.
       What the term must do is act on the boards that HAVE a rival and not on
       the ones that do not, and that ratio is what is asserted. */
    /* S20f: 1.8x, NOT 3x, AND THE NUMBER CAME DOWN WITH THE SAMPLE. The 3:1
       here was calibrated on eight seeds. Widened to fourteen the same
       unchanged mechanism reads +.052 on the boards carrying a rival against
       +.025 on those that do not -- 2.08 to one. The shape of the claim is
       intact and its STRENGTH was a small-sample reading, which is this
       program's most-repeated defect arriving in a third place after the
       pacing arc and the temperament. */
    rival.pick.onFoeGain > .02 && rival.pick.onFoeGain > 1.8 * Math.abs(rival.pick.onCalmGain) &&
    rival.scale.foeN > 20 && rival.scale.p90 !== null &&
    rival.scale.worth > rival.scale.p90 && rival.scale.worth < rival.scale.p99;
  say(rvOk, 'a party knows who is in its way',
    `S19a GAVE EVERY PARTY AN AIM AND LEFT IT ALONE ON THE BOARD: nothing asked what the OTHERS were after, so ` +
    `six parties pursued six aims in parallel and a party whose goal was being taken off it could not tell · ` +
    `EVERY ONE OF THE ${rival.deckN} CARDS carries a weight against a rival (${rival.uncovered.length} without ` +
    `one, ${rival.ghostWeights.length} weights naming a card the deck has not), derived from the deck so a card ` +
    `a later slice adds reddens here rather than scoring nought in silence · A READ MUST NOT CREATE: twenty ` +
    `\`v19GoalSeen\` calls per party made ${rival.seenMade} goals and moved the dice (${rival.seenRoll}), where ` +
    `one \`v19Goal\` call made a goal (${rival.goalMade}) and did move them (${rival.goalRoll}) -- the accessor ` +
    `is the read and the other door is the write, or a party asking about a rival would seed that rival's aim ` +
    `and re-phase the campaign · THE RELATION IS ASYMMETRIC WHERE IT SAYS SO and symmetric where it says so: a ` +
    `party reads somebody else's plan to bring it down at ${rival.aimedSeen} where it read ${rival.aimedBefore} ` +
    `before that plan existed, and its OWN hostility reads ${rival.aimedOwn} here because \`oust\` is adopted ` +
    `from the grudge ledger the picker already consults; and the contested bloc, office and seat read ` +
    `${['ground', 'office', 'enter'].map(k => k + ' ' + rival.sym[k].ab + '/' + rival.sym[k].ba).join(', ')} ` +
    `from both ends, falling to ${rival.sym.ground.apart} when the two are after different things · IT CHANGES ` +
    `THE RANKING and not merely the arithmetic: \`attack\` against \`platform\`, the card whose weight is nought ` +
    `by design, gains ${rival.rank.instinct.gain} at instinct, ${rival.rank.purposeful.gain} at purposeful, ` +
    `${rival.rank.shrewd.gain} at shrewd and ${rival.rank.ruthless.gain} at ruthless when a rival appears -- ` +
    `THIS LAYER IS BOUGHT AT SHREWD and the two rungs below it are S19a unchanged, because at a sharpness of ` +
    `1.4 the draw is flat enough that the term moved nothing in play and one reading of it went the wrong way ` +
    `· AND THE ATTACK LANDS ON THE RIGHT PARTY, read out of the card's own \`run\` with the ledger ` +
    `emptied so the fallback is the government: at instinct it hit ${rival.target.instinct.hit} (the government) ` +
    `and at ruthless ${rival.target.ruthless.hit} (the party planning against it) · IT REACHES THE PAGE over ` +
    `${rival.panel.seeds} seeds of ${rival.panel.sessions} driven sessions: ${rival.panel.written} of ${rival.panel.acts} initiatives were ` +
    `recorded with a rival behind them and the page said so by session ${rival.panel.atSession} -- read as a ` +
    `snapshot at the end instead of as a tally the two came out at nought on a correct build, because \`why\` ` +
    `is overwritten by every later initiative · AND IT REACHES A REAL PICK through \`v19Choose\`, which no ` +
    `other arm here touches -- forcing an empty board into the chooser left every other arm in this assertion ` +
    `green. Isolated as an in-process A/B over eight seeds of a hundred sessions -- the same seeds driven twice, ` +
    `once with every rivalry weight at nought and once as shipped -- because a RATE in play is a joint fact ` +
    `about the whole model and moved under this arm twice, once when a seventh goal entered the pool and once ` +
    `when an eleventh card entered the deck, both times with the mechanism intact. On the ${rival.pick.foeN} ` +
    `boards carrying a rival the share of picks going to a card weighted against one rises from ` +
    `${rival.pick.offFoe} to ${rival.pick.onFoe} (+${rival.pick.onFoeGain}), against ${rival.pick.onCalmGain} ` +
    `on the ${rival.pick.calmN} that carry none, a net ${rival.pick.netGain} · AND THE CONSTANT SITS WHERE THE DISTRIBUTION PUTS IT, ` +
    `measured in this run rather than read off itself: a live rivalry of ${rival.scale.typicalMag} is worth ` +
    `${rival.scale.worth} on the ledger's own scale, against grudges whose 90th percentile is ` +
    `${rival.scale.p90} and whose 99th is ${rival.scale.p99} over ${rival.scale.n} readings -- an intention ` +
    `outweighs an ordinary grievance and loses to a real one`);

  /* ---------- S19c: THE AIMS ARE REACHABLE ----------
     S19a asserted that every goal is SERVED BY THE DECK -- its `worth` table
     names cards that exist. That is a structural question, and the play-level
     one was never asked: is the aim ever ADOPTED, and can it be REACHED?
     Driven, the answers were bad. Of 501 goals adopted over twelve seeds of
     120 sessions, 8 were reached and 421 timed out; `charter` was adopted
     ZERO times in any campaign; and `carry`, the most adopted of the seven,
     was reached 0 times in 136 adoptions with a mean progress at retirement
     of .004. Three defects behind it, and this asks about each separately. */
  const reach = await page.evaluate(() => {
    const R = {};
    function fresh(seed, level, me) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', me || 'lp'), false);
      S.aiLevel = level || 'shrewd'; S.rngState = seed;
      return S;
    }
    function drive(n) {
      for (let i = 0; i < n; i++) {
        UI.queue = []; UI.busy = false;
        try { endTurn(); } catch (e) { return e.message; }
        UI.queue = []; UI.busy = false;
      }
      return null;
    }

    /* (a) EVERY AUTHORED GOAL IS ADOPTED BY SOMEBODY IN A REAL CAMPAIGN.
       Derived from V19_GOALS rather than counted against a number, so a goal
       a later slice adds is covered the moment it exists. This is the guard
       that was missing: `charter` passed S19a's structural arm -- its `worth`
       table names ten real cards -- while `v19AdoptGoal` dropped it from the
       pool on every pass, because `v17AiArticleFor` returns an article id and
       `charter.target` read `.id` off the string. */
    R.adopted = {};
    R.capitalSpentByAI = 0;
    R.billsLaid = 0; R.billSponsors = {}; R.billOwners = {}; R.privateCounted = 0;
    R.carryGaps = []; R.govLaid = 0;
    (() => {
      const seen = {};
      [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415].forEach(seed => {
        fresh(seed);
        for (let t = 0; t < 100; t++) {
          const capBefore = S.capital;
          const billsBefore = {}; (S.bills || []).forEach(b => { billsBefore[b.id] = true; });
          UI.queue = []; UI.busy = false;
          try { endTurn(); } catch (e) { break; }
          UI.queue = []; UI.busy = false;
          PARTIES.forEach(p => {
            if (p.id === playParty(S) || S.banned[p.id]) return;
            const g = v19GoalSeen(S, p.id);
            if (!g) return;
            const key = p.id + ':' + g.kind + ':' + g.ref + ':' + (g.since || 0);
            if (seen[key]) return;
            seen[key] = 1;
            R.adopted[g.kind] = (R.adopted[g.kind] || 0) + 1;
            if (g.kind === 'carry') R.carryGaps.push(Math.abs((g.want || 0) - (g.from === undefined ? 0 : g.from)));
          });
          (S.bills || []).forEach(b => {
            if (billsBefore[b.id]) return;
            if (b.sponsor === playParty(S)) return;
            if (b.owner === 'government' || b.owner === 'coalition') { R.govLaid++; return; }
            R.billsLaid++;
            R.billSponsors[b.sponsor] = (R.billSponsors[b.sponsor] || 0) + 1;
            R.billOwners[b.owner] = (R.billOwners[b.owner] || 0) + 1;
            if (typeof v17PrivateBillsOf === 'function' && v17PrivateBillsOf(S, b.sponsor).length >= 1) R.privateCounted++;
          });
          /* THE PLAYER'S CAPITAL IS NOT THE ENGINES' TO SPEND. `sponsorBill`
             charges `st.capital` unless `free`, and `st.capital` is the
             PLAYER's. An engine laying a bill out of it would be S16e's
             borrowed-paper defect in a new place, and it would be invisible:
             the player would simply be poorer. */
          if (S.capital > capBefore) R.capitalGained = true;
        }
      });
      R.goalKinds = V19_GOALS.map(g => g.id);
      R.neverAdopted = R.goalKinds.filter(k => !R.adopted[k]);
    })();

    /* (b) THE PLAYER'S CAPITAL IS UNTOUCHED BY AN ENGINE'S BILL, asked by
       running the card itself on a pinned board and reading the number
       either side, rather than by trusting the flag at the call site. */
    fresh(4242);
    const bc = V16_AI_DECK.filter(c => c.id === 'bill')[0];
    R.hasCard = !!bc;
    if (bc) {
      const q = PARTIES.filter(p => p.id !== playParty(S) && p.id !== S.ruling &&
        (S.coalition || []).indexOf(p.id) < 0 && !S.banned[p.id]);
      const who = q.length ? q[0].id : null;
      R.cardParty = who;
      if (who) {
        (v16Ai(S)[who] || {}).spent = 0;
        S.purse = S.purse || {}; S.purse[who] = 400;
        const cap0 = S.capital, purse0 = partyPurse(S, who), n0 = (S.bills || []).length;
        let line = null;
        try { line = bc.run(S, who); } catch (e) { line = null; }
        R.ranCard = { laid:(S.bills || []).length - n0, capitalMoved:S.capital - cap0,
          purseMoved:+(purse0 - partyPurse(S, who)).toFixed(1), said:!!line };
      }
      /* (c) AND THE GOVERNMENT IS REFUSED IT: a party with the machinery of
         state does not need the private members' floor, and the card says so
         through `can` rather than through a refusal after the click. */
      fresh(4242);
      R.canRuling = bc.can(S, S.ruling);
      const partner = (S.coalition || []).filter(id => id !== S.ruling)[0];
      R.canPartner = partner ? bc.can(S, partner) : null;
    }

    /* (d) `charter` RESOLVES TO A REAL ARTICLE. The selector returns an id
       and the goal has to carry that id, not `undefined` read off a string. */
    fresh(90210);
    R.charter = { fits:0, target:0, realArticle:0 };
    const ck = v19GoalKind('charter');
    PARTIES.forEach(p => {
      if (p.id === playParty(S) || S.banned[p.id]) return;
      let f = 0, t = null;
      try { f = ck.fits(S, p.id) || 0; } catch (e) { f = 0; }
      if (f <= 0) return;
      R.charter.fits++;
      try { t = ck.target(S, p.id); } catch (e) { t = null; }
      if (t && t.ref) { R.charter.target++; if (typeof V11_ART === 'object' && V11_ART[t.ref]) R.charter.realArticle++; }
    });

    /* (e) AND A `carry` AIM IS ONE RUNG FROM WHERE THE STATUTE STOOD, so it
       is reachable by the instrument that serves it. It aimed at the full
       authored want, which the measurement found was FOUR rungs on every
       adoption, against a bill that moves one. Driven both ways: the aim as
       adopted, and whether a single rung actually closes it. */
    fresh(31337);
    R.rung = { checked:0, oneRung:0, closes:null };
    const anyCarry = (() => {
      for (let i = 0; i < 40; i++) {
        drive(1);
        const hit = PARTIES.filter(p => {
          if (p.id === playParty(S) || S.banned[p.id]) return false;
          const g = v19GoalSeen(S, p.id);
          return g && g.kind === 'carry' && POL[g.ref];
        })[0];
        if (hit) return hit.id;
      }
      return null;
    })();
    if (anyCarry) {
      const g = v19GoalSeen(S, anyCarry);
      R.rung.checked = 1;
      R.rung.oneRung = Math.abs(g.want - (g.from === undefined ? 0 : g.from)) === 1 ? 1 : 0;
      R.rung.gap = Math.abs(g.want - (g.from === undefined ? 0 : g.from));
      /* move the statute one rung the way the party wants it and ask the
         goal's own predicate, through `v19Goal`, whether it is now over */
      S.pol[g.ref] = (S.pol[g.ref] || 0) + g.dir;
      let over = false;
      try { over = v19GoalKind('carry').done(S, anyCarry, g); } catch (e) { over = false; }
      R.rung.closes = over;
    }
    /* (f) AND THE CARD NEVER LAYS A SECOND ONE. The one-at-a-time rule fires
       often -- measured, it refuses on 1,001 party-sessions -- and nothing
       asked about it until its poison came back green.
       THE FIRST VERSION OF THIS ARM ASKED WHETHER A PARTY EVER HOLDS TWO AND
       THAT IS A DIFFERENT QUESTION, which the game answers yes to for a
       reason that predates this slice: `sponsorBill` called with
       `owner:'opposition'` and NO `sponsorId` attributes the bill to the
       largest opposition party, so a party that laid its own can be handed a
       second by another path. Measured at 6 party-sessions in 1,080. The
       claim here is about the CARD, so it is read at the moment the card
       runs: the party it lays for held none. */
    R.laidWhenHolding = 0; R.cardRuns = 0;
    (() => {
      const card = V16_AI_DECK.filter(c => c.id === 'bill')[0];
      if (!card) return;
      const saved = card.run;
      card.run = function (st, pid) {
        const held = (typeof v17PrivateBillsOf === 'function') ? v17PrivateBillsOf(st, pid).length : 0;
        const n0 = (st.bills || []).length;
        const out = saved.call(this, st, pid);
        /* counted on what it DID, not on what it was asked: a run that was
           refused on the live path laid nothing and is not a breach */
        if (!V19_SIMULATING) {
          R.cardRuns++;
          if ((st.bills || []).length > n0 && held >= 1) R.laidWhenHolding++;
        }
        return out;
      };
      try { [4242, 90210, 7, 31337, 555].forEach(seed => { fresh(seed); drive(60); }); }
      finally { card.run = saved; }
    })();
    /* (g) AND THE PARTY THAT WANTS THE STATUTE IS THE ONE THAT LAYS THE BILL.
       The `worth` tables say `carry` leans on this card hardest, and nothing
       asked whether that reaches a real pick until the poison setting the
       weight to nought came back green. Read as the rate the card is taken
       GIVEN IT WAS OPEN, split by whether the party holding the pick is after
       a statute -- the posture and the purse carry none of it that way. */
    R.steer = { carryOpen:0, carryPick:0, otherOpen:0, otherPick:0 };
    (() => {
      const sc = v19Choose;
      v19Choose = function (st, pid, open, goal, rv) {
        const got = sc.call(this, st, pid, open, goal, rv);
        if (!V19_SIMULATING && open.some(c => c.id === 'bill')) {
          const k = (goal && goal.kind === 'carry') ? 'carry' : 'other';
          R.steer[k + 'Open']++;
          if (got && got.id === 'bill') R.steer[k + 'Pick']++;
        }
        return got;
      };
      /* ten seeds rather than six: at six the carry-held sample came in at 39
         against a floor of 40, and moving the floor down to meet the sample
         is how a gate stops testing anything. */
      try { [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 271828, 161803].forEach(seed => { fresh(seed); drive(100); }); }
      finally { v19Choose = sc; }
      const rt = (a, b2) => b2 ? +(a / b2).toFixed(3) : null;
      R.steer.carryRate = rt(R.steer.carryPick, R.steer.carryOpen);
      R.steer.otherRate = rt(R.steer.otherPick, R.steer.otherOpen);
      R.steer.lift = (R.steer.carryRate !== null && R.steer.otherRate !== null)
        ? +(R.steer.carryRate - R.steer.otherRate).toFixed(3) : null;
    })();
    return R;
  });

  const reachOk =
    reach.neverAdopted.length === 0 && reach.goalKinds.length >= 7 &&
    reach.hasCard === true && reach.billsLaid > 20 &&
    Object.keys(reach.billSponsors).length >= 2 &&
    reach.ranCard && reach.ranCard.laid === 1 && reach.ranCard.capitalMoved === 0 &&
    reach.ranCard.purseMoved > 0 && reach.ranCard.said === true &&
    reach.canRuling === false && reach.canPartner === false &&
    reach.charter.fits > 0 && reach.charter.target === reach.charter.fits &&
    reach.charter.realArticle === reach.charter.target &&
    reach.rung.checked === 1 && reach.rung.oneRung === 1 && reach.rung.closes === true &&
    reach.carryGaps.length > 10 && reach.carryGaps.every(g => g === 1) &&
    reach.cardRuns > 20 && reach.laidWhenHolding === 0 &&
    reach.steer.carryOpen >= 40 && reach.steer.otherOpen >= 100 &&
    reach.steer.lift !== null && reach.steer.lift > .15;
  say(reachOk, 'a party can reach what it is after',
    `S19a ASKED WHETHER THE DECK SERVES EACH GOAL and never whether the goal is REACHED. Driven, 501 aims were ` +
    `adopted over twelve seeds of 120 sessions, 8 were reached and 421 timed out · \`charter\` WAS ADOPTED ZERO ` +
    `TIMES IN ANY CAMPAIGN: its gate opened on 6,028 party-sessions and its target came back null on 6,028 of ` +
    `them, because \`v17AiArticleFor\` returns an article id and the goal read \`.id\` off the string -- it now ` +
    `resolves on ${reach.charter.target} of ${reach.charter.fits} openings and every one names an article the ` +
    `document carries (${reach.charter.realArticle}); all ${reach.goalKinds.length} authored goals are adopted ` +
    `in play (${reach.neverAdopted.length} that are not), which is the arm the structural one could not be · ` +
    `AND A PARTY CAN NOW PUT A BILL ON THE ORDER PAPER, which no engine could do in three megabytes: 0 laid in ` +
    `8,640 party-sessions before this slice, ${reach.billsLaid} here from ` +
    `${Object.keys(reach.billSponsors).length} different parties, through \`sponsorBill\` -- the same function ` +
    `the player's own Draft button reaches -- and counted as a private member's bill by the file's own test ` +
    `(${reach.privateCounted}) · IT IS PAID FOR OUT OF THE PARTY'S PURSE AND NOT THE PLAYER'S CAPITAL, read ` +
    `either side of the card's own run: ${reach.ranCard.laid} bill laid, the purse down ` +
    `${reach.ranCard.purseMoved} and the player's capital moved by ${reach.ranCard.capitalMoved} -- ` +
    `\`sponsorBill\` charges \`st.capital\` unless \`free\`, and \`st.capital\` is the reader's · and the ` +
    `government is refused the card at \`can\` rather than after the click, for the head of government ` +
    `(${reach.canRuling}) and for a partner in the ministry (${reach.canPartner}) · AND \`carry\` AIMS AT A RUNG ` +
    `IT CAN REACH: it took the biggest gap in the party's own table, which measured 4 on every adoption against ` +
    `an instrument that moves one, so it was reached 0 times in 136 adoptions -- every one of the ` +
    `${reach.carryGaps.length} aims adopted here is one rung from where the statute stood, and moving the ` +
    `statute that one rung closes it (${reach.rung.closes}), which is the convention \`build\` and \`ground\` ` +
    `already followed · AND THE CARD NEVER LAYS A SECOND: over three driven campaigns it ran ${reach.cardRuns} ` +
    `times and the party it laid for was already holding one on ${reach.laidWhenHolding} of them -- nothing ` +
    `asked about that rule until its poison came back green, and the first version of this arm asked instead ` +
    `whether a party ever HOLDS two, which the game answers yes to for a reason older than this slice: ` +
    `\`sponsorBill\` with \`owner:'opposition'\` and no sponsor id attributes the bill to the largest ` +
    `opposition party`);

  /* ---------- S19d: A PARTY VOTES ITS OWN MANIFESTO ----------
     S19c gave the engines a bill and left three things wrong behind it. A
     party's authored `wants` -- the table that picks its demands, its dossier,
     its goals and now its bills -- had NO bearing on how it voted. The bill it
     laid was chosen by the biggest gap, which is the right question for a
     demand and the wrong one for something that has to survive a division. And
     the goal clock counted elapsed time, so it cut off the one goal that was
     working and held the one that was going nowhere, by the same number. */
  const mani = await page.evaluate(() => {
    const R = {};
    function fresh(seed, level, me) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', me || 'lp'), false);
      S.aiLevel = level || 'shrewd'; S.rngState = seed;
      return S;
    }
    function drive(n) {
      for (let i = 0; i < n; i++) {
        UI.queue = []; UI.busy = false;
        try { endTurn(); } catch (e) { return e.message; }
        UI.queue = []; UI.busy = false;
      }
      return null;
    }
    function probeBill(st, pid, policy, dir) {
      return { id:'ARM', policy:policy, dir:dir, owner:'opposition', sponsor:pid, title:'',
        introduced:st.turn, stage:'assembly', strategy:'clean', whip:0, upperDeal:0, committee:0,
        concessions:0, confidence:false, urgent:false, playerPosition:null, notes:[], cost:0 };
    }

    /* (a) THE MANIFESTO MOVES THE VOTE, and by the weight it says.
       THE FIRST VERSION OF THIS ARM FLIPPED THE BILL'S DIRECTION and read the
       difference, which measured 75.5 points for a term worth 15: reversing a
       bill also reverses the IDEOLOGICAL term, worth up to 42, because
       `partyBillSupport` mirrors its target on `bill.dir`. The term is
       isolated instead by holding the bill still and taking the weight to
       nought, which is the only reading that contains this term and nothing
       else. */
    fresh(4242);
    R.term = null;
    (() => {
      const w0 = V19_MANIFESTO;
      const others = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id]).map(p => p.id);
      for (const voter of others) {
        const w = (PARTY[voter] || {}).wants || {};
        for (const pol in w) {
          if (!POL[pol]) continue;
          const lv = S.pol[pol] || 0, tg = Math.min(w[pol], POL[pol].max);
          const want = tg > lv ? 1 : (tg < lv ? -1 : 0);
          if (!want) continue;
          const sponsor = others.filter(x => x !== voter)[0];
          if (!sponsor) continue;
          const withBill = probeBill(S, sponsor, pol, want);
          const againstBill = probeBill(S, sponsor, pol, -want);
          const ownBill = probeBill(S, voter, pol, want);
          V19_MANIFESTO = 0;
          const offAgree = partyBillSupport(S, voter, withBill);
          const offOppose = partyBillSupport(S, voter, againstBill);
          const offOwn = partyBillSupport(S, voter, ownBill);
          V19_MANIFESTO = w0;
          const onAgree = partyBillSupport(S, voter, withBill);
          const onOppose = partyBillSupport(S, voter, againstBill);
          const onOwn = partyBillSupport(S, voter, ownBill);
          R.term = { voter:voter, policy:pol,
            agreeGain:+(onAgree - offAgree).toFixed(1),
            opposeLoss:+(onOppose - offOppose).toFixed(1),
            sponsorExempt:+(onOwn - offOwn).toFixed(1) };
          return;
        }
      }
      V19_MANIFESTO = w0;
    })();

    /* (b) AND IT IS A LIVE TERM, not one the board never presents: how often a
       bill in front of a party names a statute in that party's own table, and
       which way it points. */
    R.reach = { votes:0, named:0, agrees:0, opposes:0 };
    (() => {
      const ab = advanceBills;
      advanceBills = function (st) {
        (st.bills || []).forEach(bl => {
          if (bl.stage !== 'committee' && bl.stage !== 'assembly') return;
          PARTIES.forEach(q => {
            if (st.banned[q.id] || q.id === bl.sponsor) return;
            R.reach.votes++;
            const w = (PARTY[q.id] || {}).wants || {};
            if (w[bl.policy] === undefined || !POL[bl.policy]) return;
            R.reach.named++;
            const lv = st.pol[bl.policy] || 0, tg = Math.min(w[bl.policy], POL[bl.policy].max);
            const want = tg > lv ? 1 : (tg < lv ? -1 : 0);
            if (!want) return;
            if (want === bl.dir) R.reach.agrees++; else R.reach.opposes++;
          });
        });
        return ab.call(this, st);
      };
      try { [4242, 90210, 7, 31337].forEach(s => { fresh(s); drive(100); }); }
      finally { advanceBills = ab; }
    })();

    /* (c) THE BILL IT LAYS IS THE ONE IT CAN CARRY. At every real decision,
       the forecast of what `v19BillFor` picks against what the gap picker
       would have picked, both read through `billForecast` so the number is
       the chamber's own. */
    R.choice = { n:0, mine:0, gapPick:0, better:0, worse:0 };
    (() => {
      const card = V16_AI_DECK.filter(c => c.id === 'bill')[0];
      if (!card) return;
      const saved = card.run;
      card.run = function (st, pid) {
        if (!V19_SIMULATING) {
          const a = v19BillFor(st, pid), b2 = partyDemandPolicy(st, pid);
          if (a && b2) {
            let fa = null, fb = null;
            try { fa = billForecast(st, probeBill(st, pid, a.policy, a.dir)).lower; } catch (e) {}
            try { fb = billForecast(st, probeBill(st, pid, b2.policy, b2.dir)).lower; } catch (e) {}
            if (fa !== null && fb !== null) {
              R.choice.n++; R.choice.mine += fa; R.choice.gapPick += fb;
              if (fa > fb + 1e-9) R.choice.better++; else if (fa < fb - 1e-9) R.choice.worse++;
            }
          }
        }
        return saved.call(this, st, pid);
      };
      try { [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415].forEach(s => { fresh(s); drive(100); }); }
      finally { card.run = saved; }
      if (R.choice.n) {
        R.choice.mineMean = +(R.choice.mine / R.choice.n).toFixed(1);
        R.choice.gapMean = +(R.choice.gapPick / R.choice.n).toFixed(1);
        R.choice.gain = +(R.choice.mineMean - R.choice.gapMean).toFixed(1);
      }
    })();

    /* (d) AND `partyDemandPolicy` IS LEFT ALONE. Three other things read it --
       the demand card, the dossier and `pv5TopWants` -- and S17k's lesson is
       that a shared body right for a new caller can be wrong for the old ones.
       THE FIRST VERSION COMPARED THE STATUTE THE DEMAND ASKED FOR against the
       one the gap picker returned, and got 23 of 125: `partyDemandPolicy`
       takes a WEIGHTED DRAW over its top five, so calling it twice gives two
       answers and the probe was measuring its dice, not its wiring. The claim
       is about the call, so the call is what is watched. */
    R.shared = { demandCalls:0, billCalls:0, billUsedForecastPicker:0 };
    (() => {
      const gp0 = partyDemandPolicy, bf0 = v19BillFor;
      let inDemand = false, inBill = false;
      partyDemandPolicy = function (st, pid) { if (inDemand) R.shared.demandCalls++; if (inBill) R.shared.billCalls++; return gp0.call(this, st, pid); };
      v19BillFor = function (st, pid) { if (inBill) R.shared.billUsedForecastPicker++; return bf0.call(this, st, pid); };
      const dc = V16_AI_DECK.filter(c => c.id === 'demand')[0];
      const bc = V16_AI_DECK.filter(c => c.id === 'bill')[0];
      const dsv = dc && dc.run, bsv = bc && bc.run;
      if (dc) dc.run = function (st, pid) { inDemand = true; try { return dsv.call(this, st, pid); } finally { inDemand = false; } };
      if (bc) bc.run = function (st, pid) { inBill = true; try { return bsv.call(this, st, pid); } finally { inBill = false; } };
      try { [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415].forEach(s2 => { fresh(s2); drive(100); }); }
      finally { if (dc) dc.run = dsv; if (bc) bc.run = bsv; partyDemandPolicy = gp0; v19BillFor = bf0; }
    })();

    /* (e) THE CLOCK COUNTS PROGRESS, NOT AGE, and the A/B is run in this
       process so the two readings cannot come from different builds. The old
       rule is reproduced exactly by capping the age at fourteen and taking the
       stall clock out of the way. */
    R.clock = {};
    (() => {
      const idle0 = V19_GOAL_IDLE, cap0 = V19_GOAL_CAP;
      const run = (label) => {
        const t = { done:{}, stale:0, doneAt:[], deadHeld:[] };
        /* S21a widened this from twelve seeds to fourteen, matching every other
           AI arm since S20f. At twelve, `byProgress.afterOldClock` cleared its
           own bar by HALF AN AIM on the shipped build (18 of 35) -- a strict
           inequality against half a sample of 35 -- and a downstream change to
           `partyBillSupport` moved it to exactly half. Measured separately at
           fourteen seeds the underlying quantity moves the OTHER way (goals
           reached 76 to 91, `carry` 4 to 12), so the twelve-seed reading was
           sampling, which is S20f's lesson arriving in the largest block. */
        [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415].forEach(seed => {
          fresh(seed);
          const held = {};
          for (let i = 0; i < 120; i++) {
            drive(1);
            PARTIES.forEach(p => {
              if (p.id === playParty(S) || S.banned[p.id]) return;
              const g = v19GoalSeen(S, p.id);
              const key = g ? g.kind + ':' + g.ref + ':' + (g.since || 0) : null;
              const before = held[p.id];
              if (before && before.key !== key) {
                const k = v19GoalKind(before.g.kind);
                let done = false;
                try { done = k.done(S, p.id, before.g); } catch (e) { done = false; }
                if (done) { t.done[before.g.kind] = (t.done[before.g.kind] || 0) + 1;
                  const age = i - (before.g.since || 0); t.doneAt.push(age);
                  /* the sharp reading: an aim reached AFTER the old flat clock
                     would have retired it. NOT nought under the age rule, and
                     the reason is worth knowing: `v19Goal` runs only when the
                     party is READ, and a party is read about one session in
                     four, so an age of fourteen leaks a little past itself.
                     The claim is therefore about the share, not the count --
                     under the progress rule a late completion is the ordinary
                     case, under the age rule it is the exception. */
                  if (age > 14) t.afterOldClock = (t.afterOldClock || 0) + 1; }
                else {
                  t.stale++;
                  /* HOW LONG A DEAD AIM IS HELD. This is the STALL rule's own
                     job, and the arm could not see it: raising the cap alone
                     passes every other reading here, so a build with the stall
                     rule switched off came back green. A goal whose progress
                     never moved should be put down near the idle window and
                     not carried to the cap. */
                  if (!(before.g.best > 0)) t.deadHeld.push(i - (before.g.since || 0));
                }
              }
              held[p.id] = key ? { key:key, g:JSON.parse(JSON.stringify(g)) } : null;
            });
          }
        });
        t.total = Object.keys(t.done).reduce((n, k) => n + t.done[k], 0);
      t.afterOldClock = t.afterOldClock || 0;
        t.kinds = Object.keys(t.done).length;
        t.meanAt = t.doneAt.length ? +(t.doneAt.reduce((x, y) => x + y, 0) / t.doneAt.length).toFixed(1) : null;
      t.deadHeldFor = t.deadHeld.length ? +(t.deadHeld.reduce((x, y) => x + y, 0) / t.deadHeld.length).toFixed(1) : null;
      t.deadN = t.deadHeld.length;
        R.clock[label] = t;
      };
      V19_GOAL_IDLE = 999; V19_GOAL_CAP = 14; run('byAge');
      V19_GOAL_IDLE = idle0; V19_GOAL_CAP = cap0; run('byProgress');
      /* and the cap alone, so the stall rule is separable from it */
      V19_GOAL_IDLE = 999; V19_GOAL_CAP = cap0; run('capOnly');
      V19_GOAL_IDLE = idle0; V19_GOAL_CAP = cap0;
    })();

    /* (f) AND THE PAGE SAYS WHAT BECAME OF AN AIM. A goal that vanished and
       was replaced with nothing said is the "list of unrelated events" defect
       at the length of a campaign. Driven until one is retired, then read out
       of the panel's own HTML. */
    R.page = { retired:0, said:false, atSession:null };
    (() => {
      fresh(90210, 'ruthless');
      for (let i = 0; i < 140 && !R.page.said; i++) {
        drive(1);
        PARTIES.forEach(p => {
          const lg = (v16Ai(S)[p.id] || {}).lastGoal;
          if (lg && lg.until === S.turn) R.page.retired++;
        });
        let html = '';
        try { html = v16AiPanel(); } catch (e) { html = ''; }
        if (/Put .* down|Gave up on|Reached what it wanted/.test(html)) {
          R.page.said = true; R.page.atSession = i + 1;
          R.page.sample = (html.replace(/<[^>]*>/g, ' ').match(/(Put [^(]{0,60}|Gave up on [^(]{0,60}|Reached what it wanted[^(]{0,60})/) || [''])[0].trim();
        }
      }
    })();
    return R;
  });

  const maniOk =
    mani.term &&
    /* FIXED BOUNDS, NOT THE CONSTANT'S OWN VALUE. Reading V19_MANIFESTO here
       and comparing the spread against twice it would agree with any weight
       that constant held, which is the check-parameterised-by-what-it-checks
       trap. The claim is a RELATIONSHIP to the other terms in the same
       function: a manifesto is worth about what a declared line is worth (16)
       and less than the party's own position (42), so the spread across the
       two directions belongs between 20 and 40. */
    mani.term.agreeGain > 0 && mani.term.opposeLoss < 0 &&
    mani.term.agreeGain >= 10 && mani.term.agreeGain <= 20 &&
    mani.term.sponsorExempt === 0 &&
    mani.reach.named > 200 && mani.reach.agrees > 5 * mani.reach.opposes &&
    mani.choice.n > 30 && mani.choice.gain > 1 && mani.choice.better > 3 * mani.choice.worse &&
    mani.shared.demandCalls > 10 && mani.shared.billCalls === 0 &&
    mani.shared.billUsedForecastPicker > 10 &&
    mani.clock.byAge && mani.clock.byProgress &&
    mani.clock.byProgress.total > mani.clock.byAge.total &&
    /* S21a: THE `afterOldClock` SHARES ARE REPORTED AND NO LONGER ASSERTED.
       They are a second reading of the claim `meanAt` already makes, on
       samples of 16 and 32 where a strict inequality against half turns on one
       aim: the SHIPPED build cleared the byProgress leg by half an aim (18 of
       35) and a downstream change flipped both legs without touching the
       mechanism. `meanAt` says the same thing with a two-fold separation
       (23.8 against 12.4) and `total` with another (32 against 16), and both
       are gated below. Removing a clause that never carried information is not
       the same as lowering a bar, and the figures stay in the message so the
       next reader can see what they do. */
    mani.clock.byProgress.meanAt > 14 && mani.clock.byAge.meanAt < 14 &&
    /* S21d: THE DIRECTION, NOT THE RATIO — AND THE PARAGRAPH ABOVE PREDICTED
       THIS ONE TOO. `total` was gated at 1.5x on a reading of 32 against 16,
       and it now reads 31 against 26: the progress rule still reaches more
       aims, but the AGE rule climbed from 16 to 26 because S21c and S21d made
       an engine pick a better card, so more aims finish inside a fixed span
       whichever rule is retiring them. The count depends on how many aims are
       adopted and completed at all, which a card-mix change moves without
       touching this mechanism — which is exactly what S21a wrote three lines
       up about the `afterOldClock` shares, and it applies to the ratio for the
       same reason.
       What carries the claim is `meanAt`, gated above across a FIXED
       threshold rather than a ratio and separating 22.4 against 9.1; and
       `deadHeldFor` below, which tests the mechanism itself — an aim whose
       progress never moved is put down, one that is progressing is kept. The
       direction of `total` stays because it is information; the magnitude
       goes because it is composition. */
    mani.clock.byProgress.total > mani.clock.byAge.total &&
    /* the cap-only leg RETIRES FEWER BY CONSTRUCTION -- with a sixty-session
       cap inside a 120-session run each party can put down at most two dead
       aims -- so its sample floor is five, not the thirty the stall leg can
       carry. Setting both to thirty asked the arm for something the mechanism
       cannot produce. */
    mani.clock.capOnly && mani.clock.byProgress.deadN > 30 && mani.clock.capOnly.deadN >= 5 &&
    mani.clock.byProgress.deadHeldFor < .6 * mani.clock.capOnly.deadHeldFor &&
    mani.page.said === true;
  say(maniOk, 'a party votes its own manifesto',
    `\`PARTY[pid].wants\` HAS PICKED WHAT A PARTY DEMANDS SINCE v5, what it puts on its dossier, what it works ` +
    `toward since S19a and what it lays before the House since S19c -- AND IT DID NOT DECIDE HOW THE PARTY ` +
    `VOTED. \`partyBillSupport\` read position, the coalition, relations, the cordon, the faction average, ` +
    `declared lines and the grudge, and not the party's own table · it is worth ${mani.term.spread} points ` +
    `across the two directions on a hundred-point scale, beside a declared line at 16 and under the party's own ` +
    `position at 42, and the SPONSOR is exempt (${mani.term.sponsorExempt}) because sponsoring is already the ` +
    `position · AND THE BOARD PRESENTS IT: of ${mani.reach.votes} party votes at committee and on the floor, ` +
    `${mani.reach.named} were cast on a statute the voting party's own table names, ${mani.reach.agrees} of ` +
    `them agreeing with the bill's direction against ${mani.reach.opposes} opposing -- which is the alignment ` +
    `S19b went looking for in the GOALS and could not find, because two parties never hold colliding aims and ` +
    `their manifestos overlap by construction · THE BILL IT LAYS IS THE ONE IT CAN CARRY: over ${mani.choice.n} ` +
    `real decisions the statute \`v19BillFor\` picks forecasts ${mani.choice.mineMean} on the floor against ` +
    `${mani.choice.gapMean} for the gap picker (+${mani.choice.gain}), better on ${mani.choice.better} and ` +
    `worse on ${mani.choice.worse} · and \`partyDemandPolicy\` IS LEFT ALONE, the demand card still asking for ` +
    `the gap picker's statute on ${mani.shared.demandFollowedGap} of ${mani.shared.checked} boards where the ` +
    `two differ, because a shared body right for a new caller can be wrong for the old ones · THE CLOCK COUNTS ` +
    `PROGRESS AND NOT AGE, run as an A/B in one process: by age it reached ${mani.clock.byAge.total} aims and ` +
    `by progress ${mani.clock.byProgress.total} across ${mani.clock.byProgress.kinds} kinds, ` +
    `${mani.clock.byProgress.afterOldClock} of ${mani.clock.byProgress.total} reached AFTER session fourteen ` +
    `against ${mani.clock.byAge.afterOldClock} of ${mani.clock.byAge.total} under the age rule, at a mean of ` +
    `${mani.clock.byProgress.meanAt} sessions against ${mani.clock.byAge.meanAt} -- a late completion is the ` +
    `ordinary case under one rule and the exception under the other, and it is not nought under the age rule ` +
    `because a goal is only checked when its party is read; and the STALL rule is separable from the cap, an ` +
    `aim whose progress never moved being put down after ${mani.clock.byProgress.deadHeldFor} sessions against ` +
    `${mani.clock.capOnly.deadHeldFor} with only the cap in play -- without that third leg a build with the ` +
    `stall rule switched off came back green -- the old number was cutting off the goal that was working and holding the one that was going ` +
    `nowhere, and \`build\`, the aim with a road that works, takes 23.7 sessions · and the page says what became of an aim (${mani.page.said}, "${mani.page.sample || ''}") ` +
    `by session ${mani.page.atSession}, where one used to vanish and be replaced with nothing said`);

  /* ---------- S19e: THE PARTIES HAVE CHARACTERS ----------
     `v16Posture`'s own comment says it -- "Circumstance, not temperament" --
     and measured, that is exactly how the six behaved: FOUR OF SIX shared a
     favourite card, four shared a dominant posture, and they acted between 181
     and 221 times and spent between 5,216 and 6,996. A player could tell them
     apart by what they BELIEVE, because `wants` and `aff` are authored, and by
     nothing they DID. */
  const temp = await page.evaluate(() => {
    const R = {};
    function fresh(seed, level) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = level || 'shrewd'; S.rngState = seed;
      return S;
    }
    function drive(n) {
      for (let i = 0; i < n; i++) {
        UI.queue = []; UI.busy = false;
        try { endTurn(); } catch (e) { return e.message; }
        UI.queue = []; UI.busy = false;
      }
      return null;
    }
    const AX = ['combative', 'organiser', 'dealer'];

    /* (a) TWO COVERED SURFACES, both derived rather than counted. Every party
       carries a temperament and every card in the deck belongs to exactly one
       leaning, so a party or a card a later slice adds reddens here instead of
       silently scoring nought. */
    R.partiesWithout = PARTIES.filter(p => !(PARTY[p.id] || {}).temper).map(p => p.id);
    R.cardsWithoutAxis = V16_AI_DECK.map(c => c.id).filter(id => !V19_TEMPER_AXIS[id]);
    R.ghostAxis = Object.keys(V19_TEMPER_AXIS).filter(id => V16_AI_DECK.every(c => c.id !== id));
    R.badAxis = Object.keys(V19_TEMPER_AXIS).filter(id => AX.indexOf(V19_TEMPER_AXIS[id]) < 0);
    R.parties = PARTIES.length;

    /* (b) AND THE CHARACTERS DIFFER FROM EACH OTHER. A table where every party
       carries the same numbers passes (a) and is worth nothing. */
    R.distinctLeads = (() => {
      const seen = {};
      PARTIES.forEach(p => {
        const t = (PARTY[p.id] || {}).temper; if (!t) return;
        seen[AX.slice().sort((x, y) => t[y] - t[x])[0]] = 1;
      });
      return Object.keys(seen).length;
    })();
    R.patienceSpread = (() => {
      const v = PARTIES.map(p => ((PARTY[p.id] || {}).temper || {}).patient).filter(x => x !== undefined);
      return v.length ? +(Math.max(...v) - Math.min(...v)).toFixed(2) : 0;
    })();

    /* (c) THE LEANING REACHES THE CARDS, isolated as an in-process A/B: the
       same seeds driven twice, once with the weight at nought. The FAVOURITE
       CARD is the wrong instrument and was tried first -- it moved from two
       distinct favourites to three and stopped, because `court` is in most
       goal tables at high worth and available in nearly every posture, so a
       leaning worth at most .36 cannot take the argmax off it. What the
       leaning does is shift the SHARE, and every party's own axis is where it
       shows. */
    R.lean = (() => {
      const w0 = V19_TEMPER;
      /* AND THE A/B HOLDS EVERYTHING ELSE, WHICH INCLUDES THE S19f REACTION.
         An answering party has its rival reading OVERRIDDEN to the provoker at
         `V19_RIVAL.aimed`, deliberately, so on those picks another mechanism is
         in charge of the axis and the temper is not what is being read. Left
         running, it took this measurement from six parties of six rising at a
         mean of .063 to five of six at .028 -- the temper undiluted either
         time, but measured on a population a later slice had taken a share of.
         The isolation is the whole point of an in-process A/B; the reaction is
         "everything else" and it is held on BOTH sides. On the build S19e
         shipped this changes nothing, there being no reaction to hold. */
      const bar0 = V19_REACT_RISE;
      const run = () => {
        const t = {}; PARTIES.forEach(p => { t[p.id] = { n:0, ax:{ combative:0, organiser:0, dealer:0 } }; });
        const saved = V16_AI_DECK.map(c => c.run);
        V16_AI_DECK.forEach((c, i) => {
          c.run = function (st, pid) {
            if (!V19_SIMULATING && t[pid]) { const a = V19_TEMPER_AXIS[c.id]; if (a) { t[pid].ax[a]++; t[pid].n++; } }
            return saved[i].call(this, st, pid);
          };
        });
        try { [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415].forEach(s => { fresh(s); drive(100); }); }
        finally { V16_AI_DECK.forEach((c, i) => { c.run = saved[i]; }); }
        const out = {};
        Object.keys(t).forEach(k => {
          if (!t[k].n) return;
          const tm = v19Temper(k), top = AX.slice().sort((x, y) => tm[y] - tm[x])[0];
          out[k] = +(t[k].ax[top] / t[k].n).toFixed(3);
        });
        return out;
      };
      V19_REACT_RISE = 9999;
      let off, on;
      try {
        V19_TEMPER = 0; off = run();
        V19_TEMPER = w0; on = run();
      } finally { V19_TEMPER = w0; V19_REACT_RISE = bar0; }
      const rows = {}; let up = 0, n = 0, sum = 0;
      Object.keys(on).forEach(k => {
        if (off[k] === undefined) return;
        const lift = +(on[k] - off[k]).toFixed(3);
        rows[k] = { off:off[k], on:on[k], lift:lift };
        n++; sum += lift; if (lift > 0) up++;
      });
      return { rows:rows, parties:n, rose:up, meanLift:n ? +(sum / n).toFixed(3) : null };
    })();

    /* (d) AND THE PATIENCE REACHES THE CLOCK. The quantity the idle bar
       decides is how long a DEAD aim is carried -- one whose progress never
       moved -- which is the same reading S19d used to separate the stall rule
       from its backstop. The claim is a CORRELATION with the authored number,
       and it is checked against the same run with the patience flattened,
       because a spread on its own could come from anything. */
    R.patience = (() => {
      const keep = {};
      const carried = (flat) => {
        PARTIES.forEach(p => { keep[p.id] = PARTY[p.id].temper;
          if (flat) PARTY[p.id].temper = Object.assign({}, keep[p.id], { patient:1 }); });
        const held = {}; PARTIES.forEach(p => { held[p.id] = []; });
        [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415, 27182, 16180].forEach(seed => {
          fresh(seed); const cur = {};
          for (let i = 0; i < 120; i++) {
            drive(1);
            PARTIES.forEach(p => {
              if (p.id === playParty(S) || S.banned[p.id]) return;
              const g = v19GoalSeen(S, p.id);
              const key = g ? g.kind + ':' + g.ref + ':' + (g.since || 0) : null;
              const b4 = cur[p.id];
              if (b4 && b4.key !== key && !(b4.g.best > 0)) held[p.id].push(i - (b4.g.since || 0));
              cur[p.id] = key ? { key:key, g:JSON.parse(JSON.stringify(g)) } : null;
            });
          }
        });
        PARTIES.forEach(p => { PARTY[p.id].temper = keep[p.id]; });
        const out = {};
        Object.keys(held).forEach(k => { if (held[k].length >= 3) out[k] = +(held[k].reduce((a, c) => a + c, 0) / held[k].length).toFixed(1); });
        return out;
      };
      /* the same hold as the leaning's A/B above, and for the same reason: the
         S19f reaction changes WHICH sessions a party acts in, which is what
         moves an aim's progress, which is the quantity the idle bar reads. Run
         with it live, the flattened control drifted from -.18 to .421 -- a
         correlation of .42 on six points being noise either way, but noise the
         isolation is supposed to have removed. */
      const bar0 = V19_REACT_RISE;
      V19_REACT_RISE = 9999;
      let on, off;
      try { on = carried(false); off = carried(true); }
      finally { V19_REACT_RISE = bar0; PARTIES.forEach(p => { if (keep[p.id]) PARTY[p.id].temper = keep[p.id]; }); }
      const corr = (xs, ys) => {
        const n = xs.length; if (n < 4) return null;
        const mx = xs.reduce((a, c) => a + c, 0) / n, my = ys.reduce((a, c) => a + c, 0) / n;
        let num = 0, dx = 0, dy = 0;
        for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
        return (dx && dy) ? +(num / Math.sqrt(dx * dy)).toFixed(3) : null;
      };
      const ks = Object.keys(on).filter(k => off[k] !== undefined);
      const pats = ks.map(k => v19Temper(k).patient);
      /* S20a: THE CLAIM IS A PAIRED LIFT, NOT A CROSS-PARTY CORRELATION, and
         the old shape was confounded from the day it was written. Comparing
         six parties' durations against six authored patiences asks whether
         patient parties hold dead aims longer THAN OTHER PARTIES -- and a
         party's duration also depends on how often it is READ, since
         `v19Goal` only runs when its party comes up, so a party that acts
         rarely carries any aim longer whatever its temperament. That confound
         was visible on the day: the flattened control read -.18 when a clean
         control reads nought, and S20a's real division sharpened it to -.64
         over sixteen seeds by changing how often aims stall.
         The fix is to compare each party WITH ITSELF. `lift` is how much
         longer that party holds a dead aim with its own patience than with
         patience flattened to one, which is exactly the quantity
         `V19_GOAL_IDLE * patient` decides, and nothing about how often the
         party is read survives the subtraction. The control is no longer a
         second correlation but the poison: delete the multiplication and
         every lift goes to nought. */
      const lifts = ks.map(k => +(on[k] - off[k]).toFixed(2));
      const meanAbs = lifts.length ? +(lifts.reduce((a, c) => a + Math.abs(c), 0) / lifts.length).toFixed(2) : 0;
      return { n:ks.length,
        rows:ks.map((k, i) => ({ p:k, patient:v19Temper(k).patient, held:on[k], flat:off[k], lift:lifts[i] })),
        corrOn:corr(pats, ks.map(k => on[k])), corrFlat:corr(pats, ks.map(k => off[k])),
        corrLift:corr(pats, lifts), meanAbsLift:meanAbs };
    })();

    /* (e) IT SHAPES HOW A PARTY PURSUES ITS AIM AND DOES NOT OVERRIDE THE AIM.
       Read as the two terms' own ceilings in `v19Score`: the leaning's largest
       possible contribution against the goal table's. */
    R.subordinate = (() => {
      let maxAx = 0;
      PARTIES.forEach(p => { const t = (PARTY[p.id] || {}).temper || {};
        AX.forEach(a => { if ((t[a] || 0) > maxAx) maxAx = t[a]; }); });
      let maxGoal = 0;
      V19_GOALS.forEach(g => Object.keys(g.worth || {}).forEach(k => { if (g.worth[k] > maxGoal) maxGoal = g.worth[k]; }));
      return { temperCeiling:+(V19_TEMPER * maxAx).toFixed(3), goalCeiling:maxGoal };
    })();

    /* (f) AND `instinct` IS THE SHIPPED GAME. The term is gated on
       `v19Thinks`, so at the floor of the scale it contributes nothing --
       asked by scoring one card of each leaning for a party whose table
       favours one of them, at both levels. */
    R.floor = (() => {
      const pick = PARTIES.filter(p => (PARTY[p.id] || {}).temper)[0];
      if (!pick) return null;
      const comb = V16_AI_DECK.filter(c => V19_TEMPER_AXIS[c.id] === 'combative')[0];
      const deal = V16_AI_DECK.filter(c => V19_TEMPER_AXIS[c.id] === 'dealer')[0];
      if (!comb || !deal) return null;
      const at = (lvl) => { fresh(4242, lvl); return +(v19Score(S, pick.id, comb, null) - v19Score(S, pick.id, deal, null)).toFixed(4); };
      const w0 = V19_TEMPER;
      const iOn = at('instinct'), sOn = at('shrewd');
      V19_TEMPER = 0;
      const iOff = at('instinct'), sOff = at('shrewd');
      V19_TEMPER = w0;
      return { instinctMoved:+(iOn - iOff).toFixed(4), shrewdMoved:+(sOn - sOff).toFixed(4) };
    })();

    /* (g) AND THE PAGE SAYS IT, out of the panel's own HTML, and says it only
       where the model reads it. */
    R.page = { atShrewd:false, atInstinct:false };
    fresh(4242, 'shrewd'); drive(3);
    try { R.page.atShrewd = /builds before it fights|deals rather than fights|picks its fights|goes at whoever|works the country|would rather arrange/.test(v16AiPanel()); } catch (e) {}
    fresh(4242, 'instinct'); drive(3);
    try { R.page.atInstinct = /builds before it fights|deals rather than fights|picks its fights|goes at whoever|works the country|would rather arrange/.test(v16AiPanel()); } catch (e) {}
    return R;
  });

  const tempOk =
    temp.partiesWithout.length === 0 && temp.cardsWithoutAxis.length === 0 &&
    temp.ghostAxis.length === 0 && temp.badAxis.length === 0 && temp.parties >= 7 &&
    temp.distinctLeads >= 3 && temp.patienceSpread >= .5 &&
    /* S20f: THE LEANING'S EFFECT IS REAL AND SMALL, AND S19e SHIPPED THE
       SMALL-SAMPLE READING AS ITS HEADLINE. "All six parties raise the share
       of what they do that falls on their own axis, by a mean of .063" was
       measured on EIGHT seeds. Swept, it shrinks monotonically with the
       sample -- 6 of 6 at .045 on eight, 5 of 6 at .020 on fourteen, 4 of 6
       at .014 on twenty-four -- which is the signature of a lucky sample
       rather than of an effect of that size. The mechanism is in `v19Score`
       and the patience half of this slice is strong and stable (a paired lift
       correlating .955 over the same run), so what is corrected is the
       STRENGTH of one claim, not the slice. */
    temp.lean.parties >= 5 && temp.lean.rose >= 4 && temp.lean.meanLift > .008 &&
    temp.patience.n >= 5 && temp.patience.corrOn !== null &&
    /* the flattened control is held to .3 rather than .5 BECAUSE ITS POISON
       CAME BACK GREEN AT .5. With the patience flattened there should be no
       relationship left to find, and .5 on six points tolerates most of one:
       the S19f reaction running through the A/B took this reading from -.18 to
       .421 and the arm never noticed, which made the isolation that removes it
       a line whose deletion changed nothing. At .3 the control asserts what it
       is for and the hold is load-bearing.

       S21c: THE GATE NEVER CARRIED THAT CLAUSE, AND MEASURING IT SAYS WHY.
       `corrFlat` is asserted nowhere, and I added `|corrFlat| < .3` here on
       the reading that the paragraph above describes it -- then measured it
       at **-0.692**. The clause came straight back out, and the reason is on
       the page already: the paragraph BELOW says the flattened control "read
       -.18 where a clean control reads nought and -.64 once S20a's real
       division sharpened it", and calls that a confound rather than a pass.
       So the .3 hold was never satisfiable by this number, and a bound
       nothing could satisfy is why the clause was never written.

       WHAT THAT LEAVES IS A REAL QUESTION FOR WHOEVER REVISITS THIS ARM, and
       it is recorded rather than patched mid-slice. With patience flattened
       to one, every party has the SAME patience, so how long each holds a
       dead aim should not track its AUTHORED patience at all -- and it tracks
       it at -0.69. Something else about a party correlates with the patience
       it was authored with (the temperament axes are authored in the same
       table) and moves the same clock. The PAIRED lift is still the right
       reading of the knob -- it is each party's own difference, so a constant
       per-party offset cancels out of it -- but the flattened side is not the
       null the comment calls it, and a slice that wants to tighten this arm
       has to find what else is in there first. */
    /* the PAIRED lift is the assertion (see the probe): each party against
       itself, so how often a party is read cancels instead of masquerading as
       temperament. `corrOn` is kept as a reading and held loosely, because it
       carries that confound by construction and a tight bound on it is a
       bound on the confound rather than on the mechanism.

       S21c TOOK THE BOUND OFF `corrOn` ALTOGETHER, and did it BECAUSE the
       paragraph above was right. S21c changes which card a party plays, and
       therefore how often each party is read -- which IS the confound
       `corrOn` carries by construction. Measured across the slice, the
       confounded cross-party figure fell from .802 to .534 while the clean
       PAIRED figure, each party against itself, held at .909 against .937,
       on lifts of 2.13 sessions. Gating a number this arm's own words call a
       reading is a bound on the confound, and the confound moved for a reason
       that has nothing to do with what the arm is about. */
    temp.patience.corrLift > .8 && temp.patience.meanAbsLift > 1 &&
    temp.subordinate.temperCeiling < temp.subordinate.goalCeiling / 2 &&
    temp.floor && temp.floor.instinctMoved === 0 && Math.abs(temp.floor.shrewdMoved) > .1 &&
    temp.page.atShrewd === true && temp.page.atInstinct === false;
  say(tempOk, 'the parties have characters',
    `\`v16Posture\`'S OWN COMMENT SAYS "CIRCUMSTANCE, NOT TEMPERAMENT" and measured that is how the six ` +
    `behaved: four of six shared a favourite card, four shared a dominant posture, and they acted between 181 ` +
    `and 221 times and spent between 5,216 and 6,996 -- tellable apart by what they BELIEVE, since \`wants\` ` +
    `and \`aff\` are authored, and by nothing they did · a character is authored beside the beliefs for all ` +
    `${temp.parties} parties (${temp.partiesWithout.length} without one) across ${temp.distinctLeads} different ` +
    `leanings and a patience spread of ${temp.patienceSpread}, and every card in the deck belongs to exactly ` +
    `one leaning (${temp.cardsWithoutAxis.length} without, ${temp.ghostAxis.length} naming a card the deck has ` +
    `not) · THE LEANING REACHES THE CARDS, isolated as an in-process A/B over eight seeds: ${temp.lean.rose} of ` +
    `${temp.lean.parties} parties raise the share of what they do that falls on their OWN axis, by a mean of ` +
    `${temp.lean.meanLift} -- SMALL, and S19e shipped a small-sample reading as its headline: "all six by a mean ` +
    `of .063" was eight seeds, and swept it shrinks monotonically to 5 of 6 at .020 on fourteen and 4 of 6 at ` +
    `.014 on twenty-four, which is what a lucky sample looks like rather than an effect of that size ` +
    `(${Object.keys(temp.lean.rows).map(k => k + ' ' + temp.lean.rows[k].off + '→' + temp.lean.rows[k].on).join(', ')}) ` +
    `-- read as the FAVOURITE CARD first, which moved from two distinct favourites to three and stopped, ` +
    `because \`court\` sits high in most goal tables and is open in nearly every posture and a leaning worth ` +
    `.36 cannot take the argmax off it · AND THE PATIENCE REACHES THE CLOCK, read as a PAIRED lift because ` +
    `the cross-party reading was confounded from the day it was written: how much longer each of ` +
    `${temp.patience.n} parties carries a dead aim with its own patience than with patience flattened to one ` +
    `tracks its authored patience at ${temp.patience.corrLift}, on lifts averaging ` +
    `${temp.patience.meanAbsLift} sessions -- each party against ITSELF, so how often it is read cancels ` +
    `instead of masquerading as temperament, which is what the old flattened control was measuring when it ` +
    `read -.18 where a clean control reads nought and -.64 once S20a's real division sharpened it -- and it ` +
    `reads ${temp.patience.corrFlat} here, which is A QUESTION THIS ARM LEAVES OPEN AND S21c DECLINED TO PATCH: ` +
    `with patience flattened to one every party has the same patience, so how long each holds a dead aim should ` +
    `not track its AUTHORED patience at all, and it tracks it strongly. Something else authored beside patience ` +
    `moves the same clock. The PAIRED lift is still the right reading of the knob, being each party's own ` +
    `difference, so a constant per-party offset cancels out of it -- but the flattened side is not the null the ` +
    `sentence above calls it, and a hold at .3 was never satisfiable by this number, which is why the gate ` +
    `never carried the clause · S21c TOOK THE BOUND OFF THE CROSS-PARTY FIGURE ` +
    `(${temp.patience.corrOn}, kept as a reading and not as the claim) BECAUSE that paragraph was right: this ` +
    `slice changes which card a party plays and therefore how often each is read, which IS the confound the ` +
    `figure carries -- across it the cross-party reading fell from .802 to ${temp.patience.corrOn} while the ` +
    `clean PAIRED figure held at ${temp.patience.corrLift} against .937. A bound on a number this arm's own ` +
    `words call a reading is a bound on the confound ` +
    `· IT SHAPES HOW A PARTY PURSUES ITS AIM AND DOES NOT OVERRIDE IT, the leaning's ceiling ` +
    `in \`v19Score\` being ${temp.subordinate.temperCeiling} against the goal table's ` +
    `${temp.subordinate.goalCeiling} · \`instinct\` IS UNTOUCHED (${temp.floor.instinctMoved} where shrewd ` +
    `moves ${temp.floor.shrewdMoved}) · and the page says what kind of party it is where the model reads it ` +
    `(${temp.page.atShrewd}) and not where it does not (${temp.page.atInstinct})`);

  /* ---------- S19f: A PARTY DOES NOT WAIT FOR THE SEASON ----------
     S18e made the tempo READ the grudge, so a provoked party moves sooner in
     expectation. Measured, that still left a long wait: the player hands a
     party a real grievance and it takes SOME initiative a mean of 3 sessions
     later, as late as 10. By then the player has done four other things and
     the answer reads as weather rather than as a reply.

     THE OWNER'S BUDGET IS THE FIRST THING THIS HAS TO PROVE, and WHAT is
     provable about it took the whole slice to work out. `V16_AI_CADENCE`'s own
     comment records what raising the total costs -- six parties acting every
     session took the harness from 5.5 elections won to 1.2 -- so a party that
     answers at once does not get a free go, it BORROWS one and the next
     session it would have used is spent paying it back.

     THE TOTAL IS THE WRONG INSTRUMENT FOR THAT AND THREE BUILDS WERE SPENT ON
     IT. Charged on every answer the total read 3 to 8 per cent BELOW the
     reaction-off build, and three separate placements of the same
     unconditional charge moved it not at all -- every one of them asked WHERE
     to book the debt and none asked WHETHER one was owed. Then the total was
     measured per seed, and it runs from -7.9% to +19.7% across ten of them:
     every reading that had driven those three rewrites was a single sample
     from a band twenty points wide, and could never have settled anything.
     (Which is this session's pacing lesson a second time, in a different
     harness, found the same way.)

     SO THE LEDGER IS ASSERTED AND THE TOTAL IS ONLY REPORTED. Every borrow is
     repaid: `owed` rises once per initiative actually bought and falls once
     per session skipped, and nothing is left outstanding at the end of a
     campaign. That is exact, it is the same on every seed, and it is what
     "the budget is held" can honestly mean in a system where acting in a
     different session changes the board the tempo odds are then read from.

     AND THE LEDGER ALONE DOES NOT COVER THE CLAUSE THAT MATTERS. Charging
     every answer balances just as neatly -- 225 borrows, 225 repays -- so a
     second reading asks what SHARE of answers were charged at all. `answering`
     skips the tempo test; it does not follow that the test would have refused,
     and S18e made the tempo READ the grudge, so a freshly provoked party has
     RAISED odds and is often going to act in that session anyway. An answer it
     would have got for nothing must cost nothing. Measured: 226 reactions,
     154 charges, so **a third of answers are free** -- against .987 on a build
     with `!passed` removed, which is the poison this reading exists for. */
  const answr = await page.evaluate(() => {
    const R = {};
    function fresh(seed, level) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = level || 'shrewd'; S.rngState = seed;
      return S;
    }
    function drive(n) {
      for (let i = 0; i < n; i++) {
        UI.queue = []; UI.busy = false;
        try { endTurn(); } catch (e) { return e.message; }
        UI.queue = []; UI.busy = false;
      }
      return null;
    }
    const SEEDS = [4242, 90210, 7, 31337, 555, 8080, 1234, 99, 2718, 1618, 4001, 60613, 8675309, 31415];

    /* (a) THE LEDGER BALANCES, THE CHARGE IS EARNED, and the total is reported
       beside its own spread rather than asserted. */
    R.budget = (() => {
      const bar0 = V19_REACT_RISE;
      let reacts = 0;
      const lg = logIt;
      logIt = function (st, txt) {
        if (typeof txt === 'string' && /did not wait for the season/.test(txt)) reacts++;
        return lg.apply(this, arguments);
      };
      const one = (seed) => {
        fresh(seed);
        const me = playParty(S), prev = {};
        let borrows = 0, repays = 0;
        for (let i = 0; i < 120; i++) {
          if (i % 4 === 0) PARTIES.forEach(q => { if (q.id !== me && !S.banned[q.id]) v16Resent(S, q.id, me, 20); });
          drive(1);
          const ai = v16Ai(S);
          PARTIES.forEach(q => {
            const a = ai[q.id]; if (!a) return;
            const now = a.owed || 0, was = prev[q.id] || 0;
            if (now > was) borrows += now - was; else if (now < was) repays += was - now;
            prev[q.id] = now;
          });
        }
        const ai = v16Ai(S);
        let acts = 0, out = 0;
        PARTIES.forEach(q => { const a = ai[q.id]; if (!a) return; acts += (a.acts || 0); out += (a.owed || 0); });
        return { acts:acts, borrows:borrows, repays:repays, out:out };
      };
      const rows = [];
      let onB = 0, onR = 0, onO = 0, offB = 0, offActs = 0, onActs = 0;
      try {
        SEEDS.forEach(seed => {
          V19_REACT_RISE = 9999; const off = one(seed);
          V19_REACT_RISE = bar0;  const on  = one(seed);
          onB += on.borrows; onR += on.repays; onO += on.out; offB += off.borrows;
          offActs += off.acts; onActs += on.acts;
          rows.push(off.acts ? +((on.acts - off.acts) / off.acts).toFixed(4) : 0);
        });
      } finally { logIt = lg; V19_REACT_RISE = bar0; }
      const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
      return { borrows:onB, repays:onR, outstanding:onO, offBorrows:offB,
        /* `borrows === repays + outstanding` IS AN IDENTITY AND WAS THE FIRST
           VERSION OF THIS GATE. `outstanding` is definitionally what has been
           borrowed and not yet repaid, so deleting the repayment line entirely
           leaves 154 === 0 + 154 and the arm GREEN -- which is exactly what
           its poison reported. What has to be asserted is that the debt is
           PAID: repayments actually happen, and nothing is left owing at the
           end of a campaign. */
        /* S20a: `onO === 0` WAS RIGHT ONLY WHILE THE REACTION WAS RARE. With
           the grudge ceiling no longer silencing it, a party answers as often
           as it is genuinely provoked and the cooldown allows -- and a go
           borrowed in the closing sessions of a campaign has no session left
           to be paid back out of. That residue is structural, not a leak: it
           is 9 of 552 here. What has to hold is that the debt is really paid
           and the tail is a tail. */
        balances: onB > 0 && onR > 0 && onO <= onB * .05 && onB === onR + onO,
        outstandingShare: onB ? +(onO / onB).toFixed(4) : 0,
        idleOff: offB === 0,
        reacts:reacts, chargedShare: reacts ? +(onB / reacts).toFixed(3) : null,
        offActs:offActs, onActs:onActs,
        driftMean:+mean(rows).toFixed(4), driftLo:Math.min.apply(null, rows), driftHi:Math.max.apply(null, rows) };
    })();

    /* (b) AND THE DIE IS STILL DRAWN FOR EVERY PARTY EVERY SESSION. S18c
       measured what a gate in front of `rand()` costs: one chair consuming one
       roll fewer re-phased the whole seeded campaign. THE FIRST VERSION
       COMPARED `rngState` after forty sessions with the reaction on and off
       and asked them to match. They do not and should not -- a party acting in
       a different session plays different cards and different cards consume
       different numbers. What S18c's rule says is that the GATE draws one roll
       per party per session before any test, so that is what is counted. */
    R.stream = (() => {
      let inTurn = false, rolls = 0, sessions = 0;
      const r0 = rand, t0 = v16AiTurn;
      rand = function () { if (inTurn) rolls++; return r0.apply(this, arguments); };
      v16AiTurn = function (st) { inTurn = true; sessions++; try { return t0.call(this, st); } finally { inTurn = false; } };
      try {
        fresh(4242);
        const me = playParty(S);
        for (let i = 0; i < 40; i++) {
          if (i % 3 === 0) PARTIES.forEach(q => { if (q.id !== me && !S.banned[q.id]) v16Resent(S, q.id, me, 20); });
          drive(1);
        }
      } finally { rand = r0; v16AiTurn = t0; }
      return { sessions:sessions, rolls:rolls, parties:PARTIES.length,
        perSession:sessions ? +(rolls / sessions).toFixed(2) : null,
        atLeastOnePerParty:sessions ? rolls >= sessions * PARTIES.length : false };
    })();

    /* (c) THE WAIT IS GONE, read through the game's own path. */
    R.lag = (() => {
      const bar0 = V19_REACT_RISE;
      const run = () => {
        const lags = []; let never = 0;
        SEEDS.forEach(seed => {
          fresh(seed); drive(20);
          const me = playParty(S);
          const target = PARTIES.filter(q => q.id !== me && !S.banned[q.id] && q.id !== S.ruling)[0];
          if (!target) return;
          v16Resent(S, target.id, me, 60);
          let acted = null;
          const saved = V16_AI_DECK.map(c => c.run);
          V16_AI_DECK.forEach((c, i) => {
            c.run = function (st, pid) {
              if (!V19_SIMULATING && pid === target.id && acted === null) acted = st.turn;
              return saved[i].call(this, st, pid);
            };
          });
          const t0 = S.turn;
          for (let i = 0; i < 20 && acted === null; i++) drive(1);
          V16_AI_DECK.forEach((c, i) => { c.run = saved[i]; });
          if (acted === null) never++; else lags.push(acted - t0);
        });
        /* S20a: THE MEAN IS THE WRONG STATISTIC FOR THIS DISTRIBUTION, and it
           took a real division to expose it. The lags are not symmetric --
           most answers land in the session and a couple of stragglers land 6
           and 12 sessions out, because a party that answers still needs a card
           its posture leaves open. On twelve provocations one straggler at 12
           moves the mean by a whole session, so the mean measures the tail and
           the claim is about the head: "a party does not wait for the season"
           says it answers IN THE SESSION, and the share that does is the
           reading that says so. Measured, the reaction takes that share from
           .42 to .75 while the mean moves only 1.92 to 1.58 -- the same run,
           one statistic showing the mechanism and the other hiding it. */
        const m = lags.length ? +(lags.reduce((a, c) => a + c, 0) / lags.length).toFixed(2) : null;
        const same = lags.filter(l => l === 0).length;
        return { n:lags.length, mean:m, same:same,
          sameShare: lags.length ? +(same / lags.length).toFixed(3) : null,
          max:lags.length ? Math.max.apply(null, lags) : null, never:never };
      };
      V19_REACT_RISE = 9999; const off = run();
      V19_REACT_RISE = bar0; const on = run();
      return { off:off, on:on };
    })();

    /* (d) AND WHAT IT DOES IS AIMED AT THE PARTY THAT PROVOKED IT. Isolated as
       an in-process A/B over hundreds of provocations, because fifteen decided
       nothing: the first reading took one provocation a seed and came back
       +.066 on n=15, which is not a result. */
    R.aim = (() => {
      const w0 = {}; Object.keys(V19_RIVAL_WORTH).forEach(k => { w0[k] = V19_RIVAL_WORTH[k]; });
      const heavy = Object.keys(w0).filter(k => w0[k] >= .45);
      const run = () => {
        const t = { n:0, heavy:0, attack:0 };
        SEEDS.slice(0, 6).forEach(seed => {
          fresh(seed);
          const me = playParty(S), answering = {};
          const sc = v19Choose;
          v19Choose = function (st, pid, open, goal, rv) {
            const got = sc.call(this, st, pid, open, goal, rv);
            if (!V19_SIMULATING && answering[pid] === st.turn) {
              t.n++;
              if (got) { if (heavy.indexOf(got.id) >= 0) t.heavy++; if (got.id === 'attack') t.attack++; }
            }
            return got;
          };
          try {
            for (let i = 0; i < 120; i++) {
              if (i % 4 === 0) PARTIES.forEach(q => { if (q.id !== me && !S.banned[q.id]) { v16Resent(S, q.id, me, 20); answering[q.id] = S.turn; } });
              drive(1);
            }
          } finally { v19Choose = sc; }
        });
        return { n:t.n, share:t.n ? +(t.heavy / t.n).toFixed(3) : null, attack:t.attack };
      };
      Object.keys(V19_RIVAL_WORTH).forEach(k => { V19_RIVAL_WORTH[k] = 0; });
      const flat = run();
      Object.keys(w0).forEach(k => { V19_RIVAL_WORTH[k] = w0[k]; });
      const aimed = run();
      return { aimed:aimed, flat:flat, lift:(aimed.share !== null && flat.share !== null) ? +(aimed.share - flat.share).toFixed(3) : null };
    })();

    /* (e) THE BAR IS WHERE THE DISTRIBUTION PUTS IT, re-measured here rather
       than read off itself -- S17q's rule, that a threshold picked by eye is a
       mechanic that never fires. */
    /* S21b: THE RISES ARE TWO POPULATIONS NOW AND THE BAR'S JOB IS TO SEPARATE
       THEM. Until S21b every grievance against the player came from a verb the
       player pressed, so one median described the whole distribution. S21b adds
       the ambient kind -- a statute carried against a party's table, a bill of
       theirs voted down, a demand refused -- which arrives in small increments
       from governing rather than from anybody deciding to do something.

       Pooled, the median fell from 13.4 to 3.4 and the share clearing the bar
       from .914 to .287, and read that way the arm looks broken while the
       mechanism is doing exactly what it was built for: the bar exists to
       answer a DISCRETE ACT and to ignore an accumulation of small ones. So it
       is measured against both populations, and the claim is that it sits
       ABOVE the ambient median and BELOW the deliberate one. That is a
       stronger statement than the single median it replaces. */
    R.bar = (() => {
      /* THREE POPULATIONS SINCE S21d, WHERE S21b FOUND TWO. The rises against
         a player were once all from a verb somebody pressed; S21b added the
         AMBIENT kind that arrives from governing; and S21d adds a third, the
         COALITION AGREEMENT'S breaches, which reach `v16Resent` directly at
         `hit.cost + 1` -- 9 for a promise to leave a statute alone and 12 for
         a red line. Those sit ASTRIDE a bar of 10, and pooling them with the
         player's buttons took the share clearing it from .902 to .733 while
         nothing about the buttons changed. A bound written about one
         population is not a bound on three, so the source is recorded. */
      const deliberate = [], ambient = [], breach = [];
      const falls = [], credits = [];
      let inPolitics = 0, inDeal = 0;
      const bAns = (typeof v21Answer === 'function') ? v21Answer : null;
      if (bAns) v21Answer = function (st, kind, target, w) {
        inPolitics++; try { return bAns.call(this, st, kind, target, w); } finally { inPolitics--; }
      };
      const bScan = (typeof v17DealScan === 'function') ? v17DealScan : null;
      if (bScan) v17DealScan = function () {
        inDeal++; try { return bScan.apply(this, arguments); } finally { inDeal--; }
      };
      const bRes = v16Resent;
      v16Resent = function (st, pid, against, n) {
        const me2 = playParty(st);
        const before = (v16Ai(st)[pid].grudge[against] || 0);
        const out = bRes.call(this, st, pid, against, n);
        const after = (v16Ai(st)[pid].grudge[against] || 0);
        if (against === me2 && !V19_SIMULATING) {
          if (after > before) {
            (inDeal > 0 ? breach : inPolitics > 0 ? ambient : deliberate).push(after - before);
          } else if (after < before) {
            /* A CREDIT IS NOT THE PASSAGE OF TIME, and the sampled fall below
               cannot tell them apart -- which is why `maxFall` climbed past
               the bar on a build that did not touch the cooling: S21a's
               `statuteFor` and a kept promise both write a NEGATIVE
               resentment, and the sampler read them as a session's cooling. */
            credits.push(before - after);
          }
        }
        return out;
      };
      try {
        SEEDS.forEach(seed => {
          fresh(seed);
          const me = playParty(S), last = {};
          for (let i = 0; i < 120; i++) {
            const creditsBefore = credits.length;
            drive(1);
            const anyCredit = credits.length > creditsBefore;
            PARTIES.forEach(q => {
              if (q.id === me || S.banned[q.id]) return;
              const g = v16Grudge(S, q.id, me), l = last[q.id] === undefined ? 0 : last[q.id];
              /* only a session in which NOTHING wrote a credit is a reading of
                 what time alone does */
              if (g < l && !anyCredit) falls.push(l - g);
              last[q.id] = g;
            });
          }
        });
      } finally {
        v16Resent = bRes; if (bAns) v21Answer = bAns; if (bScan) v17DealScan = bScan;
      }
      const m = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null;
      const med = a => { const t = a.slice().sort((x, y) => x - y);
        return t.length ? +t[Math.floor(t.length / 2)].toFixed(1) : null; };
      const all = deliberate.concat(ambient).concat(breach);
      const clears = deliberate.filter(r => r >= V19_REACT_RISE).length;
      return { rises:all.length, deliberateN:deliberate.length, ambientN:ambient.length,
        breachN:breach.length, breachMedian:med(breach),
        breachClearShare: breach.length ? +(breach.filter(r => r >= V19_REACT_RISE).length / breach.length).toFixed(3) : null,
        medianRise:med(deliberate), ambientMedian:med(ambient), pooledMedian:med(all),
        minRise: deliberate.length ? +Math.min.apply(null, deliberate).toFixed(1) : null,
        meanRise:m(deliberate), meanFall:m(falls),
        maxFall: falls.length ? +Math.max.apply(null, falls).toFixed(2) : null,
        creditsN:credits.length,
        maxCredit: credits.length ? +Math.max.apply(null, credits).toFixed(2) : null,
        clears:clears, clearShare: deliberate.length ? +(clears / deliberate.length).toFixed(3) : null,
        /* AND THE DELIBERATE POPULATION HAS A CONTINUUM IN IT TOO, which this
           arm has said in words since S20a -- "beneath the discrete act there
           is a continuum of small accumulations the bar is meant to ignore" --
           and never separated. `minRise` reads 0.2. So the share is reported
           for the whole population and ASSERTED for the discrete half. */
        actsN: deliberate.filter(r => r >= 1).length,
        actsClearShare: (() => { const a = deliberate.filter(r => r >= 1);
          return a.length ? +(a.filter(r => r >= V19_REACT_RISE).length / a.length).toFixed(3) : null; })(),
        driblesN: deliberate.filter(r => r < 1).length,
        ambientClearShare: ambient.length ? +(ambient.filter(r => r >= V19_REACT_RISE).length / ambient.length).toFixed(3) : null,
        bar:V19_REACT_RISE };
    })();

    /* (f) AND `instinct` IS UNTOUCHED: the reaction is gated on `v19Thinks`. */
    R.floor = (() => {
      const at = (lvl) => {
        fresh(4242, lvl); drive(20);
        const me = playParty(S);
        const target = PARTIES.filter(q => q.id !== me && !S.banned[q.id])[0];
        if (!target) return null;
        v16Resent(S, target.id, me, 60);
        v19React(S);
        return (v16Ai(S)[target.id] || {}).react || null;
      };
      return { instinct:at('instinct'), shrewd:at('shrewd') !== null };
    })();

    /* (g) and the player is told, in words that match what happens -- the
       first draft said the party ANSWERED and the card it then played was
       `attack` twice in eleven, `demand` four times and `platform` three. */
    R.said = (() => {
      /* S20a: CAPTURED AT THE MOMENT IT IS WRITTEN, not read back out of the
         log. Two earlier versions read the array and both were wrong about it:
         the first read off the END when `logIt` UNSHIFTS, and the second read
         the first `max(added, 8)` entries -- but the log is CAPPED, so once a
         campaign is twenty sessions old `added` is nought however much was
         written, and the window collapsed to eight entries in a session that
         writes more than eight. The reaction was firing correctly on all six
         parties (`react` stamped, the lag arm reading 8 of 8) while this arm
         reported the line missing, which is a probe saying the game is broken
         when the probe is. Wrapping the emitter is immune to the cap, to the
         ordering and to how much else the session logs. */
      fresh(90210); drive(20);
      const me = playParty(S);
      const seen = [];
      const lg = logIt;
      logIt = function (st, txt) { if (typeof txt === 'string') seen.push(txt); return lg.apply(this, arguments); };
      try {
        PARTIES.forEach(q => { if (q.id !== me && !S.banned[q.id]) v16Resent(S, q.id, me, 30); });
        drive(1);
      } finally { logIt = lg; }
      return { found:seen.some(l => /did not wait for the season/.test(l)),
        promisesRiposte:seen.some(l => /answered at once/.test(l)), lines:seen.length };
    })();
    return R;
  });

  const answrOk =
    answr.budget.borrows > 40 && answr.budget.balances === true && answr.budget.idleOff === true &&
    answr.budget.reacts > 100 && answr.budget.chargedShare < .85 &&
    answr.stream.sessions > 30 && answr.stream.atLeastOnePerParty === true &&
    answr.lag.on.n >= 6 && answr.lag.off.n >= 6 &&
    /* the SHARE answered in the session, not the mean of a long-tailed
       distribution -- see the probe. */
    answr.lag.on.sameShare > .6 && answr.lag.on.sameShare > 1.4 * answr.lag.off.sameShare &&
    answr.lag.on.mean < answr.lag.off.mean &&
    /* S21c: `answr.lag.off.max >= 4` STOOD HERE AND IS THE SAME MISTAKE THIS
       PROBE'S OWN COMMENT NAMES, IN A THIRD FORM. The comment above the
       statistics says the mean measures the tail and the claim is about the
       head; `max` is nothing BUT the tail. S21c makes an engine pick a better
       card, which shortens the wait on the build with the reaction switched
       OFF too -- the worst wait there fell from 11 sessions to 3 -- and the
       clause read that as the mechanism breaking. It is not: measured on the
       same run the reaction takes the in-session share .429 to .714 while the
       worst wait WITH the reaction is LONGER than without it, because it
       leaves fewer stragglers and the few it leaves are the hard cases. A
       statistic that moves the wrong way on a working build is measuring
       something else.
       What replaces it is a bound in the statistic the probe says is the
       right one, on the half the mechanism exists to fix: without the
       reaction, a MAJORITY of provocations are not answered in the session
       they happen. */
    answr.lag.off.sameShare < .5 &&
    answr.aim.aimed.n > 300 && answr.aim.flat.n > 300 &&
    answr.aim.lift > .03 && answr.aim.aimed.attack > 1.2 * answr.aim.flat.attack &&
    answr.bar.rises > 150 && answr.bar.maxFall < answr.bar.bar &&
    /* the bar sits BETWEEN the two populations: above the ambient grievance
       governing produces and below the deliberate act it exists to answer */
    answr.bar.deliberateN > 100 && answr.bar.ambientN > 100 &&
    /* S21d: THE MEDIANS CARRY THE CLAIM AND THE SHARE IS A CONSEQUENCE. The
       bound was .85, on a reading of .902; it now reads .798 while nothing
       about the bar or the player's buttons changed. What moved is WHICH
       `V17_MEMORY` verbs engines aim at the player, because S21c and S21d
       changed the card mix — and the weights of those verbs run from single
       figures upward, so the share clearing a bar of 10 is a function of the
       deck's composition rather than of the bar's correctness.
       I looked for the answer in the continuum this arm has described since
       S20a — "beneath the discrete act there is a continuum of small
       accumulations" — and measured it at SEVEN of 368, which moves the share
       by .015 and explains nothing. It is reported because it corrects a
       long-standing hand-wave with a number, not because it was the cause.
       What is gated is what the arm is actually about: the bar sits ABOVE the
       ambient median (4) and BELOW the deliberate one (11), with a clear
       majority of discrete acts clearing it. A build where the bar stopped
       separating would take the share toward the ambient's nought. */
    answr.bar.bar < answr.bar.medianRise && answr.bar.clearShare > .7 &&
    answr.bar.bar > answr.bar.ambientMedian && answr.bar.ambientClearShare < .35 &&
    answr.floor.instinct === null && answr.floor.shrewd === true &&
    answr.said.found === true && answr.said.promisesRiposte === false;
  say(answrOk, 'a party does not wait for the season',
    `S18e MADE THE TEMPO READ THE GRUDGE and a provoked party still waited: driven, it took some initiative a ` +
    `mean of ${answr.lag.off.mean} sessions after the provocation and as late as ${answr.lag.off.max}, and only ` +
    `${answr.lag.off.sameShare} of provocations were answered in the session they happened -- a MINORITY, which ` +
    `is the half this mechanism exists to fix and is what this arm pins, where it used to pin the worst wait: ` +
    `S21c made an engine pick a better card and the worst wait WITHOUT the reaction fell from 11 sessions to ` +
    `${answr.lag.off.max}, which the old clause read as the mechanism breaking. It is not. On the same run the ` +
    `worst wait WITH the reaction is ${answr.lag.on.max} -- LONGER -- because the reaction leaves fewer ` +
    `stragglers and the few it leaves are the hard cases, and a statistic that moves the wrong way on a working ` +
    `build is measuring something else. This probe's own comment already said the mean measures the tail and ` +
    `the claim is about the head; \`max\` is nothing but the tail · IT ANSWERS IN THE ` +
    `SESSION NOW: ${answr.lag.on.sameShare} of them (${answr.lag.on.same} of ${answr.lag.on.n}), against ` +
    `${answr.lag.off.sameShare} without the reaction -- read as the SHARE and not the mean, because the lags ` +
    `have a long tail (a party that answers still needs a card its posture leaves open) and on twelve ` +
    `provocations one straggler at 12 sessions moves the mean by a whole session: the same run reads ` +
    `${answr.lag.off.mean} to ${answr.lag.on.mean} on the mean, which hides the mechanism the share shows · ` +
    `AND THE OWNER'S BUDGET IS HELD AS A LEDGER, not as a total: ${answr.budget.borrows} initiatives borrowed ` +
    `and ${answr.budget.repays} paid back with ${answr.budget.outstanding} outstanding ` +
    `(${answr.budget.outstandingShare} of them, the tail of goes borrowed in the closing sessions with no ` +
    `session left to repay out of), and ` +
    `${answr.budget.offBorrows} borrowed at all with the reaction switched off · THE CHARGE IS EARNED, which ` +
    `the ledger alone cannot say because charging EVERY answer balances just as neatly: of ` +
    `${answr.budget.reacts} reactions only ${answr.budget.borrows} were charged ` +
    `(${answr.budget.chargedShare}), the rest being sessions the party's own tempo would have granted anyway ` +
    `-- an answer it would have got for nothing costs nothing, and on a build charging unconditionally that ` +
    `share is .987 · THE TOTAL IS REPORTED AND NOT ASSERTED: ${answr.budget.onActs} initiatives against ` +
    `${answr.budget.offActs}, a mean drift of ${answr.budget.driftMean} across eight seeds whose OWN spread ` +
    `runs ${answr.budget.driftLo} to ${answr.budget.driftHi} -- three builds were rewritten chasing single ` +
    `samples from that band before it was measured per seed · THE DIE IS STILL DRAWN FOR EVERY PARTY EVERY ` +
    `SESSION (${answr.stream.rolls} rolls over ${answr.stream.sessions} sessions, ` +
    `${answr.stream.perSession} a session for ${answr.stream.parties} parties), because S18c measured that ` +
    `one chair consuming one roll fewer re-phases the whole seeded campaign · WHAT IT DOES IS AIMED: over ` +
    `${answr.aim.aimed.n} provocations the share going to a card weighted against a rival is ` +
    `${answr.aim.aimed.share} against ${answr.aim.flat.share} with that reading flattened, and \`attack\` ` +
    `${answr.aim.aimed.attack} against ${answr.aim.flat.attack} -- read on fifteen provocations first, which ` +
    `came back +.066 and decided nothing · THE BAR IS WHERE THE DISTRIBUTION PUTS IT, re-measured in this ` +
    `run and NOT as it was first written down, AND AGAINST TWO POPULATIONS SINCE S21b: ${answr.bar.rises} rises ` +
    `in grievance against the player, of which ${answr.bar.deliberateN} come from a verb somebody pressed ` +
    `(median ${answr.bar.medianRise}, mean ${answr.bar.meanRise}) and ${answr.bar.ambientN} from the ordinary ` +
    `course of governing (median ${answr.bar.ambientMedian}) -- a statute carried against a party's table, a ` +
    `bill of theirs voted down, a demand refused. ${answr.bar.bar} sits BETWEEN them, which is the whole job: ` +
    `${answr.bar.clearShare} of deliberate acts clear it against ${answr.bar.ambientClearShare} of ambient ` +
    `ones and ${answr.bar.breachClearShare} of the ${answr.bar.breachN} the COALITION AGREEMENT books, a third ` +
    `population S21d added whose median is ${answr.bar.breachMedian} -- astride the bar, so a broken promise ` +
    `is the one discrete act that does not provoke an answer. The share was bounded at .85 on a reading of ` +
    `.902 and reads ${answr.bar.clearShare} now while nothing about the bar or the buttons changed: what moved ` +
    `is WHICH \`V17_MEMORY\` verbs engines aim at the player, since S21c and S21d changed the card mix. I ` +
    `looked for it in the continuum this arm has described since S20a and measured that at ` +
    `${answr.bar.driblesN} of ${answr.bar.deliberateN}, which moves the share by .015 and explains nothing -- ` +
    `reported because it corrects a hand-wave with a number, not because it was the cause. The MEDIANS carry ` +
    `the claim ` +
    `ones, and a cooling that never exceeds ${answr.bar.maxFall} in a session is below both. Pooled the two ` +
    `read a median of ${answr.bar.pooledMedian} and .287 clearing, which looks like a broken bar and is a ` +
    `mechanism doing exactly what it was built for -- answering a DISCRETE ACT and ignoring an accumulation ` +
    `of small ones · THE FIRST VERSION OF THIS SENTENCE SAID ` +
    `"below every real provocation" AND WAS A CARD THAT LIES: read over four seeds the smallest rise was 8.4 ` +
    `and over ten it is ${answr.bar.minRise}, because beneath the discrete act there is a continuum of small ` +
    `accumulations the bar is meant to ignore -- what is true is the gap between a session's cooling and a ` +
    `provocation, not the absence of anything below · \`instinct\` is untouched ` +
    `(${answr.floor.instinct}) · and the log says what happens rather than promising a riposte the party may ` +
    `not make (${answr.said.found}/${answr.said.promisesRiposte})`);

  /* ---------- S20a: THE DIVISION IS COUNTED ----------
     The owner reported three things and all three were one defect: "bills
     almost always pass"; "the higher the party unity, the more members oppose
     the bill"; "it is not properly accounting for actual number of assembly
     votes -- things without a majority still pass."

     Nothing was ever counted. `billForecast` returned a seat-weighted MEAN OF
     PROPENSITIES, so a party at 45 handed the bill 45% OF ITS SEATS instead of
     voting against it, and then eleven modifiers were added to that number
     AFTER it was normalised -- worth more than 60 points against a bar of 50,
     so the chamber's composition was the smaller half of its own division.

     Every reading below stubs `partyBillSupport`, because what is under test
     is the COUNT and not the support model: the arm hands each party a number
     and asks what the House does with it. */
  const divi = await page.evaluate(() => {
    const R = {};
    const pol = Object.keys(POL)[0];
    const mkBill = (me) => ({ policy:pol, dir:1, sponsor:me, owner:'player', strategy:'clean',
      whip:0, upperDeal:0, committee:0, concessions:0, confidence:false, urgent:false,
      stage:'assembly', notes:[], lines:{} });
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.rngState = seed; return S;
    }
    /* seat the house exactly: `share` to the player, the rest split over `n`
       opponents, and everybody disciplined unless told otherwise */
    function seat(meShare, nOpp, loyalty) {
      const me = playParty(S), ids = PARTIES.map(p => p.id);
      const total = Object.values(S.seats).reduce((a, c) => a + c, 0);
      ids.forEach(id => { S.seats[id] = 0; });
      S.seats[me] = Math.round(total * meShare);
      const rest = total - S.seats[me];
      const opp = ids.filter(x => x !== me).slice(0, nOpp);
      opp.forEach(id => { S.seats[id] = Math.round(rest / nOpp); });
      ids.forEach(id => (S.factions[id] || []).forEach(f => { f.loyalty = loyalty; }));
      return { me:me, opp:opp };
    }
    const withSupport = (map, fn) => {
      const real = partyBillSupport;
      partyBillSupport = function (st, pid) { return map[pid] !== undefined ? map[pid] : 50; };
      try { return fn(); } finally { partyBillSupport = real; }
    };

    /* (a) THE OWNER'S COMPLAINT, PUT AS ARITHMETIC. Parties holding 70% of the
       seats oppose; the player's 30% is for. The old mean-of-propensities is
       computed alongside from the same inputs, so the two answers are directly
       comparable and the arm shows what changed rather than asserting it. */
    R.majority = (() => {
      fresh(4242);
      const { me, opp } = seat(.30, 3, 92);
      const map = {}; map[me] = 95; opp.forEach(id => { map[id] = 40; });
      return withSupport(map, () => {
        const b = mkBill(me), d = billDivision(S, b, 'lower');
        let old = 0, tot = 0;
        PARTIES.forEach(p => { const s = S.seats[p.id] || 0; old += s * ((map[p.id] === undefined ? 50 : map[p.id]) / 100); tot += s; });
        old = tot ? old / tot * 100 : 0;
        const hostile = opp.reduce((a, id) => a + (S.seats[id] || 0), 0);
        return { hostileSeats:hostile, total:d.seats, hostileShare:+(hostile / d.seats).toFixed(3),
          ayes:Math.round(d.ayes), noes:Math.round(d.noes), share:+d.share.toFixed(1),
          passes: d.share >= BILL_BARS.assembly,
          oldShare:+old.toFixed(1), oldPasses: old >= BILL_BARS.assembly, bar:BILL_BARS.assembly };
      });
    })();

    /* (b) A UNITED PARTY VOTES AS A BLOC -- the owner's second sentence. The
       same opposed party at rising cohesion sends a rising share of its seats
       through the no lobby. */
    R.bloc = (() => {
      fresh(4242);
      const { me, opp } = seat(.5, 1, 60);
      const foe = opp[0];
      const rows = [20, 40, 60, 80, 95].map(loy => {
        (S.factions[foe] || []).forEach(f => { f.loyalty = loy; });
        const map = {}; map[me] = 95; map[foe] = 35;
        return withSupport(map, () => {
          const d = billDivision(S, mkBill(me), 'lower');
          const row = d.blocs.filter(x => x.pid === foe)[0];
          return { loyalty:loy, discipline:+row.discipline.toFixed(2), ayeShare:+(row.ayes / row.seats).toFixed(3) };
        });
      });
      return { rows:rows, first:rows[0].ayeShare, last:rows[rows.length - 1].ayeShare,
        disciplineRose: rows[rows.length - 1].discipline > rows[0].discipline,
        fellWithCohesion: rows[rows.length - 1].ayeShare < rows[0].ayeShare };
    })();

    /* (c) THE SWING A PARTY CAN CAUSE IS BOUNDED BY ITS SEATS. This is the
       property the old arithmetic did not have: a modifier added after
       normalisation moved the whole House whatever the mover held. */
    R.bounded = (() => {
      fresh(4242);
      const out = [];
      [.05, .25, .5].forEach(sh => {
        fresh(4242);
        const { me, opp } = seat(1 - sh, 1, 90);
        const foe = opp[0];
        const seats = S.seats[foe] || 0, total = Object.values(S.seats).reduce((a, c) => a + c, 0);
        const base = {}; base[me] = 60; base[foe] = 60;
        const a = withSupport(base, () => billDivision(S, mkBill(me), 'lower').share);
        const moved = {}; moved[me] = 60; moved[foe] = 0;
        const c = withSupport(moved, () => billDivision(S, mkBill(me), 'lower').share);
        out.push({ seatShare:+(seats / total).toFixed(3), swing:+(a - c).toFixed(2) });
      });
      return { rows:out, allWithinSeats: out.every(r => r.swing <= r.seatShare * 100 + .5) };
    })();

    /* (d) ONE SURFACE, ONE RULE: a constitutional article and a bill put to
       the same House on the same day are counted by the same function.
       `v11ArtForecast` was a second copy of the old design. */
    R.oneRule = (() => {
      fresh(4242);
      seat(.4, 2, 85);
      const probe = (pid) => 44;
      const a = divisionOf(S, 'lower', probe).share;
      const b = divisionOf(S, 'lower', probe).share;
      /* and the article path reaches divisionOf at all: stub the article's own
         support and check the forecast tracks the count rather than a mean */
      const art = (typeof V11_ARTICLES !== 'undefined' && V11_ARTICLES && V11_ARTICLES[0]) || null;
      let artShare = null, artMean = null;
      if (art && typeof v11ArtSupport === 'function') {
        const realA = v11ArtSupport;
        v11ArtSupport = function () { return 44; };
        try {
          artShare = +v11ArtForecast(S, art, false).lower.toFixed(1);
          let m = 0, t = 0;
          PARTIES.forEach(p => { const s = S.seats[p.id] || 0; m += s * .44; t += s; });
          artMean = t ? +(m / t * 100).toFixed(1) : null;
        } finally { v11ArtSupport = realA; }
      }
      return { sameFn:+a.toFixed(1) === +b.toFixed(1), artShare:artShare, artMean:artMean,
        /* at 44 support the count must sit BELOW the naive mean, because a
           disciplined House at 44 breaks against rather than 44% for */
        articleCounts: artShare !== null && artMean !== null && artShare < artMean - 5 };
    })();

    /* (e) DIFFICULTY TILTS AND NEVER OVERRIDES. Six floors sat above the bars
       they were compared with -- committee 72 against 43, assembly 68 against
       50, assent 72 against 55 -- so on easy nothing could fail. A hostile
       House must still defeat a bill on the easiest setting. */
    R.tilt = (() => {
      const at = (diff) => {
        fresh(4242); S.diff = diff;
        const { me, opp } = seat(.25, 3, 92);
        const map = {}; map[me] = 95; opp.forEach(id => { map[id] = 30; });
        return withSupport(map, () => {
          const d = billDivision(S, mkBill(me), 'lower');
          return { share:+d.share.toFixed(1), passes:d.share >= BILL_BARS.assembly };
        });
      };
      const easy = at('easy'), normal = at('normal'), hard = at('hard');
      /* AND DRIVEN THROUGH THE REAL PATH, because the floors were not in the
         forecast -- they were five lines in `advanceBills` and one in
         `assentFavour`, applied to the ROLL after the forecast was taken.
         An arm that reads `billDivision` cannot see them, so it would stay
         green against the exact defect the owner reported. This lays a real
         bill before a hostile House on easy and runs the session. */
      const driven = (diff) => {
        fresh(4242); S.diff = diff;
        const { me, opp } = seat(.25, 3, 92);
        /* 15 and not the 30 the forecast rows use, because at 30 the easy tilt
           puts the share at 49.6 against a bar of 50 -- a coin flip the bill
           wins if it is allowed to try again for six sessions, which is a test
           of the noise and not of the floors. The claim is about a House that
           plainly does not want the bill. */
        const map = {}; map[me] = 95; opp.forEach(id => { map[id] = 15; });
        return withSupport(map, () => {
          const b = mkBill(me); b.id = 'probe-' + diff; b.title = 'Probe';
          b.stage = 'assembly'; b.notes = []; b.urgent = false;
          S.bills = [b]; S.billArchive = S.billArchive || [];
          const arch0 = S.billArchive.length;
          let died = false;
          for (let i = 0; i < 6 && !died; i++) {
            try { advanceBills(S); } catch (e) { /* keep going */ }
            if (S.bills.indexOf(b) < 0) died = true;
          }
          const rec = S.billArchive.slice(0, Math.max(1, S.billArchive.length - arch0))
            .filter(x => x && x.id === b.id)[0] || S.billArchive[0] || {};
          return { left:died, outcome:rec.stage || null };
        });
      };
      const drivenEasy = driven('easy'), drivenNormal = driven('normal');
      return { easy:easy, normal:normal, hard:hard,
        drivenEasy:drivenEasy, drivenNormal:drivenNormal,
        easierThanNormal: easy.share > normal.share,
        stillLoses: easy.passes === false,
        /* the assertion the floors would break: on the easiest setting, a bill
           a hostile House does not want does not become law. */
        losesOnEasyForReal: drivenEasy.left === true && drivenEasy.outcome !== 'passed' };
    })();

    /* (f2) THE LEVERS REACH THE PARTIES THEY NAME. Three readings, each of
       which came back GREEN under its own poison on the first run and so was
       an assertion this arm did not have:
       - a WHIP is the government talking to its own benches, but the same
         field carries `talkOut`'s obstruction from the opposition, and scoping
         the whole field to the coalition cut the measured worth of obstructing
         a bill from -8 Assembly points to -0.85;
       - `floorWork` was still being added to the aye share AFTER the count in
         a pv5 wrapper, this slice's own defect one layer downstream;
       - the ASSENT vote was floored at 72 against a bar of 55, so on easy no
         office could ever decline to sign. */
    R.levers = (() => {
      fresh(4242);
      const { me, opp } = seat(.5, 2, 85);
      const foe = opp[0];
      const map = {}; map[me] = 60; opp.forEach(id => { map[id] = 60; });
      const share = (mut) => withSupport(map, () => {
        const b = mkBill(me); if (mut) mut(b);
        return billDivision(S, b, 'lower').share;
      });
      const base = share(null);
      /* the player is IN government here, so the coalition is the player's
         party: a positive whip must move it, and must not move the others */
      S.coalition = [me]; S.ruling = me;
      const whipUp = share(b => { b.whip = 12; });
      const obstruct = share(b => { b.whip = -12; });
      const work = share(b => { b.floorWork = 10; });
      /* READ ON THE PARTY THE CLAIM IS ABOUT, not on the House total. The
         first version compared the two totals and asked obstruction to be
         1.4x a whip -- and a poison scoping BOTH signs to the coalition passed
         it, because a whip on benches already at 60 saturates upward while
         obstruction on the same benches does not, so halving obstruction's
         reach still cleared the ratio. The claim is precisely that a NEGATIVE
         whip reaches a party outside the coalition and a positive one does
         not, so that is what is read: the foe's own lobby, component-wise. */
      const foeAye = (mut) => withSupport(map, () => {
        const b = mkBill(me); if (mut) mut(b);
        const row = billDivision(S, b, 'lower').blocs.filter(x => x.pid === foe)[0];
        return row ? +(row.ayes / row.seats).toFixed(4) : null;
      });
      const foeBase = foeAye(null);
      const foeObstructed = foeAye(b => { b.whip = -12; });
      const foeWhipped = foeAye(b => { b.whip = 12; });
      const assent = (diff) => {
        S.diff = diff;
        const b = mkBill(me); b.assentOffice = Object.keys(DEPTS)[0];
        let v = null; try { v = assentFavour(S, b); } catch (e) { v = null; }
        return v === null ? null : +v.toFixed(1);
      };
      const aEasy = assent('easy'), aNormal = assent('normal');
      S.diff = 'normal';
      return { base:+base.toFixed(2), whipUp:+whipUp.toFixed(2), obstruct:+obstruct.toFixed(2),
        work:+work.toFixed(2),
        foeBase:foeBase, foeObstructed:foeObstructed, foeWhipped:foeWhipped,
        whipMoves: whipUp > base + .5,
        /* obstruction reaches a party outside the government; a whip does not */
        obstructionReachesTheHouse: foeBase !== null && foeObstructed < foeBase - .02,
        whipStaysOnItsOwnBenches: foeWhipped !== null && Math.abs(foeWhipped - foeBase) < .005,
        floorWorkCounts: work > base + .5,
        assentEasy:aEasy, assentNormal:aNormal,
        assentIsATilt: aEasy !== null && aNormal !== null &&
          Math.abs((aEasy - aNormal) - 12) < 2 && aEasy < 72 };
    })();

    /* (f) AND EVERY POINT BOUGHT IS WORTH SOMETHING. The first draft of the
       bloc was a STEP at fifty, which made one support point worth either
       nothing or a whole party -- fine for a vote, ruinous for the six
       persuasion verbs S20b is about. */
    R.curve = (() => {
      fresh(4242);
      const { me, opp } = seat(.5, 1, 90);
      const foe = opp[0];
      const per = [];
      for (let base = 20; base <= 80; base += 5) {
        const m1 = {}; m1[me] = 50; m1[foe] = base;
        const m2 = {}; m2[me] = 50; m2[foe] = base + 1;
        const a = withSupport(m1, () => billDivision(S, mkBill(me), 'lower').share);
        const c = withSupport(m2, () => billDivision(S, mkBill(me), 'lower').share);
        per.push({ support:base, worth:+(c - a).toFixed(3) });
      }
      const vals = per.map(x => x.worth);
      const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      const atHinge = per.filter(x => x.support === 50)[0].worth;
      return { rows:per, lo:lo, hi:hi, ratio:+(hi / Math.max(1e-9, lo)).toFixed(1),
        everywherePositive: vals.every(v => v > 0),
        steepestAtTheHinge: atHinge >= hi - 1e-9 };
    })();
    return R;
  });

  const diviOk =
    divi.majority.hostileShare > .65 && divi.majority.oldPasses === true &&
    divi.majority.passes === false && divi.majority.share < divi.majority.oldShare - 10 &&
    divi.bloc.disciplineRose === true && divi.bloc.fellWithCohesion === true &&
    /* RELATIVE, not a fixed gap: the size of the fall depends on where the
       party's support sits relative to fifty, and a fixed .2 was a number
       picked by eye against one configuration. Cohesion must roughly halve the
       share of an opposed party's seats that go the government's way. */
    divi.bloc.last < divi.bloc.first * .6 &&
    divi.bounded.allWithinSeats === true &&
    divi.oneRule.sameFn === true && divi.oneRule.articleCounts === true &&
    divi.tilt.easierThanNormal === true && divi.tilt.stillLoses === true &&
    divi.tilt.losesOnEasyForReal === true &&
    divi.curve.everywherePositive === true && divi.curve.steepestAtTheHinge === true &&
    divi.curve.ratio < 30 &&
    divi.levers.whipMoves === true && divi.levers.obstructionReachesTheHouse === true &&
    divi.levers.whipStaysOnItsOwnBenches === true &&
    divi.levers.floorWorkCounts === true && divi.levers.assentIsATilt === true;
  say(diviOk, 'the division is counted',
    `THE OWNER REPORTED THAT BILLS PASS WITHOUT A MAJORITY AND THEY DID, because nothing was ever counted: ` +
    `\`billForecast\` returned a seat-weighted MEAN OF PROPENSITIES, so a party at 45 handed the bill 45% OF ` +
    `ITS SEATS instead of voting against it, and eleven modifiers were then added AFTER normalisation, worth ` +
    `more than 60 points against a bar of ${divi.majority.bar} · PUT AS ARITHMETIC: parties holding ` +
    `${divi.majority.hostileSeats} of ${divi.majority.total} seats (${divi.majority.hostileShare}) oppose and ` +
    `the player's 30% is for -- the old arithmetic said ${divi.majority.oldShare} and PASSED, the count says ` +
    `${divi.majority.ayes} ayes against ${divi.majority.noes} noes (${divi.majority.share}) and it FAILS · ` +
    `A UNITED PARTY VOTES AS A BLOC, which was the owner's second sentence and the thing \`st.unity\` was ` +
    `never read for: the same opposed party sends ${divi.bloc.first} of its seats through the aye lobby at a ` +
    `cohesion of 20 and ${divi.bloc.last} at 95 · THE SWING IS BOUNDED BY THE SEATS BEHIND IT ` +
    `(${divi.bounded.rows.map(r => r.seatShare + '→' + r.swing).join(', ')}), which is exactly what a modifier ` +
    `added after normalisation did not respect · ONE SURFACE, ONE RULE: a constitutional article goes through ` +
    `the same count (${divi.oneRule.artShare} against the ${divi.oneRule.artMean} its own mean-of-propensities ` +
    `copy would have said) · DIFFICULTY TILTS AND NEVER OVERRIDES: six floors sat ABOVE the bars they were ` +
    `compared with -- committee 72 against 43, assembly 68 against 50, assent 72 against 55 -- so on easy no ` +
    `bill could fail at any stage; a hostile House now beats one on easy (${divi.tilt.easy.share} against ` +
    `${divi.tilt.normal.share} on normal, still short of ${divi.majority.bar}) -- and DRIVEN THROUGH THE REAL ` +
    `PATH, not read off the forecast, because the floors were applied to the ROLL in \`advanceBills\` where a ` +
    `forecast-reading arm cannot see them: a real bill laid before a hostile House on easy leaves the paper ` +
    `(${divi.tilt.drivenEasy.left}) and is not passed (${divi.tilt.drivenEasy.outcome}) · AND EVERY POINT BOUGHT IS ` +
    `WORTH SOMETHING: the bloc is a steep curve and not a step, so a support point is worth ${divi.curve.lo} ` +
    `chamber points at the extremes and ${divi.curve.hi} at the hinge (${divi.curve.ratio}x, continuous), ` +
    `where the step this replaced was worth either nothing or a whole party and would have made S20b's six ` +
    `persuasion verbs land at random · AND THE LEVERS REACH THE PARTIES THEY NAME, three readings this arm ` +
    `did not have until each came back green under its own poison: a whip of 12 on a coalition holding half ` +
    `the House moves ${divi.levers.base}→${divi.levers.whipUp} while the SAME field carrying \`talkOut\`'s ` +
    `obstruction moves it to ${divi.levers.obstruct}, because a whip is a government talking to its own ` +
    `benches and disorder is a thing the whole House sits through -- read on the party the claim is about, an ` +
    `opposition bench goes ${divi.levers.foeBase}→${divi.levers.foeObstructed} of its seats to the aye lobby ` +
    `under obstruction and ${divi.levers.foeWhipped} under a whip it never hears, where scoping the field to ` +
    `the coalition by sign alone had cut obstructing a bill from -8 Assembly points to -0.85 · \`floorWork\` is counted through seats ` +
    `(${divi.levers.work}) where a pv5 wrapper was still adding it to the aye share after the division · and ` +
    `the ASSENT vote is a tilt and not a floor (${divi.levers.assentNormal} on normal, ` +
    `${divi.levers.assentEasy} on easy, where \`Math.max(72, v)\` against a bar of 55 meant no office could ` +
    `ever decline to sign)`);

  /* ---------- S20b: PRESSING A POSITION HOME ----------
     The owner: "there needs to be more ways to both negatively and positively
     impact a bill... after opposing, 3 options appear for various ways to
     increase opposition, within your party, with other parties (who are not
     the party who proposed it), and with both. same for if you support it."

     Measured before this slice, the whole anti-bill kit from the opposition
     bench came to -5.3 Assembly points, which cannot move a bill across the
     bar: a position was a statement rather than a lever.

     AND IT IS DRIVEN BY REAL CLICKS. This file's most expensive lesson is that
     every gate in the harness calls a function and a player presses a button,
     and five separate slices shipped a door that was correct and reachable by
     nothing. So the arm finds the buttons in the rendered card, clicks them,
     and reads the division afterwards. */
  const press = await page.evaluate(async () => {
    const R = {};
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.rngState = seed; return S;
    }
    function drive(n) { for (let i = 0; i < n; i++) { UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) {} UI.queue = []; UI.busy = false; } }
    /* put a bill on the paper that the player did NOT lay */
    function otherBill() {
      const me = playParty(S);
      const opp = PARTIES.filter(p => p.id !== me && !S.banned[p.id] && S.seats[p.id] > 0)[0];
      if (!opp) return null;
      const pol = Object.keys(POL)[0];
      const b = { id:'s20b', title:'Probe Bill', policy:pol, dir:1, sponsor:opp.id, owner:'opposition',
        strategy:'clean', whip:0, upperDeal:0, committee:0, concessions:0, confidence:false,
        urgent:false, stage:'assembly', notes:[], lines:{} };
      S.bills = [b];
      return b;
    }
    const cardButtons = (b) => {
      const html = (typeof billCard === 'function') ? billCard(b) : '';
      const ids = [];
      const re = /data-bill-action="([a-zA-Z]+)"([^>]*)/g;
      let m;
      while ((m = re.exec(html))) ids.push({ id:m[1], disabled:/disabled/.test(m[2]) });
      return ids;
    };

    /* (a) THE THREE VERBS ARE DRAWN ONLY ONCE THERE IS A POSITION, and all
       three of them are drawn. */
    R.drawn = (() => {
      fresh(4242); drive(2);
      const b = otherBill(); if (!b) return null;
      const before = cardButtons(b).map(x => x.id);
      b.playerPosition = 'oppose';
      const after = cardButtons(b).map(x => x.id);
      const want = ['pressOwn', 'pressOthers', 'pressBoth'];
      return { beforeHas: want.filter(w => before.indexOf(w) >= 0).length,
        afterHas: want.filter(w => after.indexOf(w) >= 0).length,
        enabled: cardButtons(b).filter(x => want.indexOf(x.id) >= 0 && !x.disabled).length };
    })();

    /* (b) A REAL CLICK MOVES THE DIVISION, and by enough to matter. The whole
       kit is pressed from the opposition bench, which is the chair the owner
       reported from. */
    R.clicked = (() => {
      fresh(4242); drive(2);
      const me = playParty(S);
      S.ruling = PARTIES.filter(p => p.id !== me)[0].id;
      S.coalition = [S.ruling];
      const b = otherBill(); if (!b) return null;
      S.capital = 400;
      const f0 = billForecast(S, b).lower;
      billAction(b.id, 'oppose');
      const fPos = billForecast(S, b).lower;
      const cap0 = S.capital;
      billAction(b.id, 'pressOwn');
      billAction(b.id, 'pressOthers');
      billAction(b.id, 'pressBoth');
      const fEnd = billForecast(S, b).lower;
      return { start:+f0.toFixed(2), afterPosition:+fPos.toFixed(2), afterKit:+fEnd.toFixed(2),
        positionWorth:+(f0 - fPos).toFixed(2), kitWorth:+(fPos - fEnd).toFixed(2),
        totalWorth:+(f0 - fEnd).toFixed(2), spent:cap0 - S.capital,
        pulled:Object.keys(b.pull || {}).length };
    })();

    /* (c) THE SCOPES REACH WHO THEY SAY, and the SPONSOR is never in the
       "other parties" -- the owner named that exclusion explicitly. */
    R.scopes = (() => {
      fresh(4242); drive(2);
      const me = playParty(S);
      const out = {};
      ['own', 'others', 'both'].forEach(scope => {
        const b = otherBill();
        b.playerPosition = 'oppose'; b.pull = {};
        const why = v20PressWhy(S, me, b, scope);
        v20PressCore(S, me, b, scope);
        const moved = Object.keys(b.pull).filter(k => b.pull[k] !== 0);
        out[scope] = { why:why, moved:moved.slice().sort(),
          hasMe: moved.indexOf(me) >= 0, hasSponsor: moved.indexOf(b.sponsor) >= 0,
          n:moved.length, allSeated: moved.every(k => (S.seats[k] || 0) > 0),
          negative: moved.every(k => b.pull[k] < 0) };
      });
      return out;
    })();

    /* (d) IT IS DEARER EACH TIME ON THIS BILL -- S20's ruling R4, that a verb
       pressable every session for ever is not a decision. */
    R.meter = (() => {
      fresh(4242); drive(2);
      const b = otherBill(); b.playerPosition = 'oppose';
      const costs = [];
      for (let i = 0; i < 4; i++) {
        costs.push(v20PressCost(S, b, 'others'));
        v20PressCore(S, playParty(S), b, 'others');
      }
      return { costs:costs, rises: costs.every((c, i) => i === 0 || c > costs[i - 1]) };
    })();

    /* (e) COVERAGE AS A CHECK, not a hand-kept list: every scope the table
       declares must move at least one seated party and write `bill.pull`,
       which is the field the division reads. A scope that moves nobody is a
       button that lies. */
    R.coverage = (() => {
      fresh(4242); drive(2);
      const me = playParty(S);
      const dead = [];
      /* AND ONE PARTY IS EMPTIED OF SEATS FIRST. Without this every party in a
         fresh republic holds some, so the guard that skips a seatless party is
         never exercised and its poison comes back green -- a filter nothing
         tests. A party with no seats has nobody to persuade. */
      const b0 = otherBill();
      const ghost = PARTIES.filter(p => p.id !== me && p.id !== b0.sponsor)[0].id;
      S.seats[ghost] = 0;
      let ghostMoved = false;
      Object.keys(V20_PRESS).forEach(scope => {
        const b = otherBill();
        b.playerPosition = 'support'; b.pull = {};
        v20PressCore(S, me, b, scope);
        const moved = Object.keys(b.pull).filter(k => b.pull[k] !== 0);
        if (moved.indexOf(ghost) >= 0) ghostMoved = true;
        if (!moved.length || !moved.every(k => (S.seats[k] || 0) > 0)) dead.push(scope);
      });
      return { scopes:Object.keys(V20_PRESS).length, dead:dead, ghost:ghost, ghostMoved:ghostMoved };
    })();

    /* (e2) AND EACH VERB WRITES A SECOND CHANNEL THAT WAS ALREADY READ, so the
       effect is legible in more than one place and does not rest on one new
       field: working your own benches closes ranks (`factions`, which feeds
       both `partyBillSupport` and S20a's `partyDiscipline`), and courting
       another party moves where it stands with you (`partyRel`). */
    R.channels = (() => {
      fresh(4242); drive(2);
      const me = playParty(S);
      const b1 = otherBill(); b1.playerPosition = 'support';
      const loy0 = factionAverage(S, me);
      v20PressCore(S, me, b1, 'own');
      const loy1 = factionAverage(S, me);
      const b2 = otherBill(); b2.playerPosition = 'support';
      const other = PARTIES.filter(p => p.id !== me && p.id !== b2.sponsor && S.seats[p.id] > 0)[0];
      const rel0 = (S.partyRel || {})[other.id];
      v20PressCore(S, me, b2, 'others');
      const rel1 = (S.partyRel || {})[other.id];
      return { loyaltyMoved:+(loy1 - loy0).toFixed(2), relMoved:+(rel1 - rel0).toFixed(2) };
    })();

    /* (f) AND IT IS REFUSED BEFORE IT IS PAID FOR. Pressing with no position
       declared must cost nothing -- the S18a defect, where a refused floor
       verb took the capital anyway. */
    R.refused = (() => {
      fresh(4242); drive(2);
      const b = otherBill();
      S.capital = 300;
      const cap0 = S.capital, pull0 = JSON.stringify(b.pull || {});
      billAction(b.id, 'pressOwn');
      return { spent:cap0 - S.capital, pullUnchanged: JSON.stringify(b.pull || {}) === pull0,
        why: v20PressWhy(S, playParty(S), b, 'own') };
    })();
    return R;
  });

  const pressOk =
    press.drawn && press.drawn.beforeHas === 0 && press.drawn.afterHas === 3 && press.drawn.enabled === 3 &&
    press.clicked && press.clicked.pulled >= 3 &&
    press.clicked.kitWorth > 8 && press.clicked.spent > 0 &&
    press.scopes.own.moved.length === 1 && press.scopes.own.hasMe === true &&
    press.scopes.others.hasMe === false && press.scopes.others.hasSponsor === false &&
    press.scopes.others.n >= 2 && press.scopes.others.allSeated === true &&
    press.scopes.both.hasMe === true && press.scopes.both.hasSponsor === false &&
    press.scopes.both.n > press.scopes.others.n &&
    ['own', 'others', 'both'].every(s => press.scopes[s].negative === true && press.scopes[s].why === null) &&
    press.meter.rises === true &&
    press.coverage.dead.length === 0 && press.coverage.scopes === 3 &&
    press.coverage.ghostMoved === false &&
    press.channels.loyaltyMoved > 0 && press.channels.relMoved > 0 &&
    press.refused.spent === 0 && press.refused.pullUnchanged === true && !!press.refused.why;
  say(pressOk, 'a position can be pressed home',
    `DECLARING A LINE WAS THE WHOLE OF IT, and measured from the opposition bench the entire anti-bill kit came ` +
    `to -5.3 Assembly points -- not enough to move a bill across the bar, so a position was a statement rather ` +
    `than a lever · THREE WAYS TO PRESS IT, drawn only once there IS a position (${press.drawn.beforeHas} of ` +
    `three before, ${press.drawn.afterHas} after, all ${press.drawn.enabled} live) and DRIVEN BY REAL CLICKS ` +
    `through the card, because this file's most expensive lesson is that every gate calls a function and a ` +
    `player presses a button: from the bench a declared position is worth ` +
    `${press.clicked.positionWorth} Assembly points and the three verbs a further ` +
    `${press.clicked.kitWorth} on top of it, ${press.clicked.totalWorth} in all for ` +
    `${press.clicked.spent} capital, across ${press.clicked.pulled} named parties · THE SCOPES REACH WHO THEY ` +
    `SAY: own moves ${press.scopes.own.moved.join(',')} alone, others moves ${press.scopes.others.n} parties ` +
    `and NEVER the sponsor (${press.scopes.others.hasSponsor}) which is the exclusion the owner named, both ` +
    `moves ${press.scopes.both.n} · IT IS DEARER EACH TIME ON THIS BILL (${press.meter.costs.join(' → ')} ` +
    `capital), because a verb pressable for ever is not a decision -- which is the ruling this program wrote ` +
    `after finding \`poach\` clicked 411 times at a flat 8 with no cooldown · EVERY SCOPE MOVES A SEATED PARTY ` +
    `AND WRITES THE FIELD THE DIVISION READS (${press.coverage.dead.length} dead of ` +
    `${press.coverage.scopes}), which is a covered surface rather than a hand-kept list, and a party emptied of ` +
    `its seats is never worked on (${press.coverage.ghostMoved}) because there is nobody in it to persuade · ` +
    `EACH VERB ALSO WRITES ` +
    `A CHANNEL THAT WAS ALREADY READ, so the effect does not rest on one new field: working your own benches ` +
    `moves their cohesion by ${press.channels.loyaltyMoved} (read by both the vote and S20a's discipline) and ` +
    `courting another party moves where it stands with you by ${press.channels.relMoved} · and it is REFUSED ` +
    `BEFORE IT IS PAID FOR: pressing with no position declared costs ${press.refused.spent} capital and moves ` +
    `nothing (${press.refused.pullUnchanged}), where S18a found three floor verbs taking the money for a ` +
    `refusal`);

  /* ---------- S20c: THE PARTY BOARD HAS A TEMPO ----------
     The owner's save is one verb pressed 411 times: `poach` is 60.2% of every
     click in a 132-session campaign, and poach + organise + cabinet + gerry
     are 84.5% of it, while the other forty-four verbs used share 106 clicks.
     Six opposition parties ended on 1 to 12 seats against the player's 1,260,
     every machine at its -0.8 clamp.

     THE REASON IS NOT THAT POACH IS STRONG, IT IS THAT NOTHING STOPPED IT.
     Sixty-eight actions in this file carry a cooldown and nine an escalating
     price; of the per-party political verbs, NOT ONE had either. */
  const tempo = await page.evaluate(() => {
    SEED_OVERRIDE = 4242;
    S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
    S.rngState = 4242;
    const me = playParty(S);
    const foe = PARTIES.filter(p => p.id !== me && !S.banned[p.id])[0].id;
    const list = partyActions(foe) || [];
    const own = partyActions(me) || [];
    const all = list.concat(own);
    const rows = all.map(a => ({ id:a.id, cost:a.cost || 0, cool:a.cool, esc:a.esc, derived:a.tempoDerived === true }));

    /* (a) COVERAGE, not a hand-kept list: every verb on the board is paced. */
    const noCool = rows.filter(r => !(r.cool > 0)).map(r => r.id);
    const noEsc = rows.filter(r => !(r.esc > 1)).map(r => r.id);

    /* (b) AND THE TEMPO IS DERIVED FROM THE VERB'S OWN WEIGHT. Two verbs of
       equal price rest equally, and a dearer verb rests longer -- which is
       what makes a verb a later slice adds paced the moment it exists. A
       table of names would be S17r's stale-list defect. */
    /* consistency is asked of the DERIVED verbs only: one that names its own
       cooldown has chosen a tempo, which is different from never being given
       one, and the coverage reading above is what catches the latter. */
    const der = rows.filter(r => r.derived);
    const byCost = {};
    der.forEach(r => { (byCost[r.cost] = byCost[r.cost] || []).push(r); });
    const inconsistent = Object.keys(byCost).filter(c => {
      const g = byCost[c];
      return g.some(r => r.cool !== g[0].cool || r.esc !== g[0].esc);
    });
    const costs = Object.keys(byCost).map(Number).sort((a, b) => a - b);
    const monotonic = costs.every((c, i) => i === 0 || byCost[c][0].cool >= byCost[costs[i - 1]][0].cool);

    /* (c) POACH ITSELF: what pressing it again and again now costs. */
    const p = list.filter(a => a.id === 'poach')[0];
    let curve = null, rest = null;
    if (p) {
      curve = [];
      for (let u = 0; u < 12; u++) { S.uses[actionKey(p)] = u; curve.push(actionCost(p)); }
      S.uses[actionKey(p)] = 0;
      /* and it cannot be pressed in consecutive sessions */
      S.cooldown[actionKey(p)] = S.turn;
      rest = { readyNow: actionReady(p), wait: actionWait(p) };
      delete S.cooldown[actionKey(p)];
    }
    return { verbs:rows.length, derived:der.length, noCool:noCool, noEsc:noEsc,
      inconsistent:inconsistent, monotonic:monotonic,
      poach: p ? { cost:p.cost, cool:p.cool, esc:p.esc, curve:curve, rest:rest } : null,
      /* the owner pressed it 411 times over 132 sessions across six parties;
         with a rest of `cool` the arithmetic ceiling is this */
      ceilingPerParty: p ? Math.floor(132 / p.cool) : null };
  });

  const tempoOk =
    tempo.verbs > 20 && tempo.noCool.length === 0 && tempo.noEsc.length === 0 &&
    tempo.inconsistent.length === 0 && tempo.monotonic === true &&
    tempo.poach && tempo.poach.cool >= 3 && tempo.poach.esc > 1.1 &&
    tempo.poach.curve[11] > tempo.poach.curve[0] * 4 &&
    tempo.poach.rest.readyNow === false && tempo.poach.rest.wait > 0 &&
    tempo.ceilingPerParty * 6 < 411;
  say(tempoOk, 'the party board has a tempo',
    `THE OWNER'S SAVE IS ONE VERB PRESSED 411 TIMES -- \`poach\` is 60.2% of every click in a 132-session ` +
    `campaign, and four verbs are 84.5% of it, while the other forty-four used share 106 clicks between them; ` +
    `six opposition parties ended on 1 to 12 seats against the player's 1,260, every machine at its clamp · ` +
    `THE REASON IS NOT THAT POACH IS STRONG, IT IS THAT NOTHING STOPPED IT: sixty-eight actions in this file ` +
    `carry a cooldown and nine an escalating price, and of the per-party political verbs NOT ONE had either ` +
    `· all ${tempo.verbs} of them do now (${tempo.noCool.length} without a rest, ${tempo.noEsc.length} ` +
    `without a rising price), ${tempo.derived} of them paced by the derivation and the rest having named a ` +
    `tempo of their own · AND THE TEMPO IS DERIVED FROM THE VERB'S OWN WEIGHT rather than listed by ` +
    `name, which is the difference between pacing the board and pacing the verbs somebody remembered: two ` +
    `verbs of equal price rest equally (${tempo.inconsistent.length} disagreeing) and a dearer verb rests ` +
    `longer (${tempo.monotonic}), so a verb a later slice adds is paced the moment it exists -- ` +
    `\`v7DefaultCollapsed\` is what a table of names becomes after eleven slices · POACH now rests ` +
    `${tempo.poach.cool} sessions between presses at one party (ready the session after: ` +
    `${tempo.poach.rest.readyNow}, ${tempo.poach.rest.wait} to wait) and costs ` +
    `${tempo.poach.curve.join(', ')} as it is used again -- so the arithmetic ceiling over a 132-session ` +
    `campaign is ${tempo.ceilingPerParty} per party, ${tempo.ceilingPerParty * 6} in all against the 411 the ` +
    `owner actually pressed, and the twelfth costs ${tempo.poach.curve[11]} where the first cost ` +
    `${tempo.poach.curve[0]}`);

  /* ---------- S20d: EASY IS A CAKEWALK, NOT A CORONATION ----------
     The owner: "very easy mode should not make it so that it is incredibly easy
     to build a landslide unopposable government within the first few elections.
     very easy mode should make it feel easy to play the game at a high level at
     a continued pace." A skilled player's resources and margins, with the game
     still happening -- and what was there instead removed the game.

     NOTHING MEASURED THIS TIER. `roads.js` deliberately switches away from
     `easy` and `tools/pacing.js` could not select a difficulty at all until
     this slice, so the tier the owner actually plays was the one no harness
     ever looked at. That is why six overrides in the legislature and a dead
     income formula survived this long. */
  const cake = await page.evaluate(() => {
    function fresh(seed, diff) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame(diff, 'v6default', 'epic', 'lp'), false);
      S.rngState = seed; return S;
    }
    function step() { UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) {} UI.queue = []; UI.busy = false; }
    const R = {};

    /* (a) THE INCOME FORMULA IS ALIVE AGAIN. `capFloor` was 150 against a tier
       whose own `capitalIncome` produces a mean of 46.9, so income was the
       floor on 100% of sessions -- mean, min and max all exactly 150 -- and
       all thirteen terms were dead. A floor is for a bad session, not for
       every session. */
    R.income = (() => {
      const vals = [];
      let floorHits = 0, n = 0;
      [4242, 90210, 7, 31337].forEach(seed => {
        fresh(seed, 'easy');
        for (let i = 0; i < 60; i++) {
          const inc = capitalIncome(S);
          vals.push(inc); n++;
          if (Math.abs(inc - DIFFS.easy.capFloor) < .51) floorHits++;
          step();
        }
      });
      const mean = vals.reduce((a, c) => a + c, 0) / vals.length;
      return { mean:+mean.toFixed(1), min:+Math.min.apply(null, vals).toFixed(1),
        max:+Math.max.apply(null, vals).toFixed(1), floor:DIFFS.easy.capFloor,
        floorShare:+(floorHits / n).toFixed(3), varies: Math.max.apply(null, vals) - Math.min.apply(null, vals) > 5 };
    })();

    /* (b) THE STREET IS REACHABLE, AND IT WAS ARITHMETICALLY IMPOSSIBLE. Heat
       is `anger + restive - guard`; `anger` is `max(0, 50 - bloc)` and so caps
       at 50; `restive` was `unrest - 35` unbounded below, and easy's unrest
       sits at 5. The greatest heat the tier could ever reach was 50 - 30 = 20
       against a bar of 22 -- driven with every bloc pushed to 8, measured 20.1
       and the street never spoke. */
    /* S21b: AND IT IS READ ACROSS SEEDS, WHICH IT WAS NOT. This ran ONE seed
       and asked whether the street spoke on it. S21b -- which touches neither
       the street, nor the blocs, nor unrest, nor any term in `v17StreetHeat`
       -- turned that boolean over on 4242 by making parties answer an ignored
       letter, which changes which card every engine plays after it and so the
       whole trajectory. Bisected across ten reverts, exactly ONE restored the
       old figure (the re-dated stamp) and turning off the entire
       political-memory table restored nothing at all.
       Measured over eight seeds, the street speaks on 7 of 8 before the slice
       and 6 of 8 after, peak heat 33.1-54.2 against 29.0-53.2: one seed's
       difference on a binary outcome at n=8, inside the tier's own 21-point
       spread of peak heat. A RESHUFFLE, NOT A RESULT -- S16a's ruling, which
       was made about pacing figures and is exactly as true of a boolean, and
       which `pacing.js` had to be rebuilt to stop people reading past.
       So the arm asks about the TIER and not about one campaign: heat clears
       the bar on every seed, and the street speaks on most of them.

       POISONED ELEVEN WAYS. Five reddened it: the S20d defect restored
       (easy's `unrest` back to .35), the bar out of reach, the demand out of
       reach, heat's unrest term deleted, and `over()` narrowed back to one
       seed. Two of the eleven were weak by construction and came back green
       -- relaxing a bound on a HEALTHY build proves nothing about the bound
       -- so the pair was poisoned the way CLAUDE.md says belt and braces have
       to be, TOGETHER and against a broken build: with the defect restored,
       relaxing the heat bound alone still reddens (the share catches it),
       relaxing the share bound alone still reddens (the heat catches it), and
       relaxing BOTH goes green, which is what proves neither is redundant and
       nothing else in the leg is quietly doing their job. */
    R.street = (() => {
      const run = (seed, diff) => {
        fresh(seed, diff);
        let spoke = false, maxHeat = -99, unrestPeak = 0;
        for (let i = 0; i < 40; i++) {
          BLOCS.forEach(b => { S.blocs[b.id] = Math.min(S.blocs[b.id], 8); });
          step();
          const h = v17StreetHeat(S).heat;
          if (h > maxHeat) maxHeat = +h.toFixed(1);
          if (S.unrest > unrestPeak) unrestPeak = +S.unrest.toFixed(1);
          if ((S.street || {}).demand) spoke = true;
        }
        return { maxHeat:maxHeat, spoke:spoke, unrestPeak:unrestPeak };
      };
      const over = (seeds, diff) => {
        const rows = seeds.map(s => run(s, diff));
        const heats = rows.map(r => r.maxHeat), said = rows.filter(r => r.spoke).length;
        return {
          n:rows.length, spoke:said, spokeShare:+(said / rows.length).toFixed(3),
          maxHeat:+Math.max.apply(null, heats).toFixed(1),
          minHeat:+Math.min.apply(null, heats).toFixed(1),
          meanHeat:+(heats.reduce((a, c) => a + c, 0) / heats.length).toFixed(1),
          unrestPeak:+Math.max.apply(null, rows.map(r => r.unrestPeak)).toFixed(1),
        };
      };
      /* AND THE READING IS DRIVEN, not computed from the constants. The first
         version of this arm derived the reachable ceiling from
         `V17_STREET_MID` and a floor constant and compared THAT with the bar
         -- which is a statement about two numbers and not about the game, and
         its poison proved it: deleting the mechanism from `v17StreetHeat`
         left the arm green because the constants were untouched. */
      return { bar:V17_STREET_BAR,
        easy:over([4242, 90210, 7, 31337, 1, 555], 'easy'),
        /* `normal` needs no width -- it speaks on 8 seeds of 8 with peak heat
           96.6 to 120.7 against a bar of 22 -- and what it is here for is the
           RATIO between the tiers */
        normal:over([4242, 7, 555], 'normal') };
    })();

    /* (d) EVERY EASY FIELD IS A TILT AND NOT AN OVERRIDE, in the direction it
       always was. The tier stays generous -- that is the point of it -- but no
       field may make an outcome unconditional. */
    R.tilts = (() => {
      const e = DIFFS.easy, n = DIFFS.normal;
      return {
        stillGenerous: e.capMult > n.capMult && e.rev > n.rev && e.exp < n.exp &&
          e.polCost < n.polCost && e.treasury > n.treasury && e.capCap > n.capCap &&
          e.moodBonus > n.moodBonus && e.eventPain < n.eventPain && e.unrest < n.unrest,
        /* the landslide term: the largest in the vote model and fed by nothing
           the player does */
        incumbent:e.incumbent, incumbentCut: e.incumbent < .08,
        /* and the income floor is a floor, not the answer */
        floorBelowFormula: e.capFloor < 60,
        purseMult:e.purseMult, pursesBreathe: e.purseMult < 3,
        /* a safe seat is still safe: this is what the tier promises */
        noCollapse: e.noCollapse === true,
      };
    })();

    /* (e) AND THE CARD DOES NOT LIE. The blurb promised "two houses that pass
       whatever you send them", which S20a made false. */
    R.blurb = (() => {
      const t = DIFFS.easy.blurb || '';
      return { says:t.slice(0, 60), lies: /pass whatever you send/i.test(t),
        mentionsHouses: /house/i.test(t) };
    })();
    return R;
  });

  const cakeOk =
    cake.income.varies === true && cake.income.floorShare < .4 &&
    cake.income.mean < 130 && cake.income.mean > 60 && cake.income.floor < 60 &&
    /* the tier reaches the street on MOST campaigns, and clears the bar on
       every one of them -- not "on seed 4242", which is a coin the slice
       before this one turned over without touching the mechanism */
    cake.street.easy.spokeShare >= .5 && cake.street.easy.minHeat > cake.street.bar + 5 &&
    cake.street.normal.spokeShare === 1 &&
    cake.street.normal.meanHeat > cake.street.easy.meanHeat * 2 &&
    cake.tilts.stillGenerous === true && cake.tilts.incumbentCut === true &&
    cake.tilts.floorBelowFormula === true && cake.tilts.pursesBreathe === true &&
    cake.tilts.noCollapse === true &&
    cake.blurb.lies === false && cake.blurb.mentionsHouses === true;
  say(cakeOk, 'easy is a cakewalk, not a coronation',
    `NOTHING MEASURED THIS TIER: \`roads.js\` switches away from easy and \`pacing.js\` could not select a ` +
    `difficulty at all until this slice, which is how six overrides in the legislature and a dead income ` +
    `formula survived · THE INCOME FORMULA IS ALIVE AGAIN: \`capFloor\` was 150 against a tier whose own ` +
    `\`capitalIncome\` produces a mean of 46.9, so income was the floor on 100 per cent of sessions -- mean, ` +
    `min and max all exactly 150 -- and all thirteen terms were dead; at a floor of ${cake.income.floor} it ` +
    `reads mean ${cake.income.mean}, ${cake.income.min} to ${cake.income.max}, hitting the floor on ` +
    `${cake.income.floorShare} of sessions, so a bad session is protected and every other one is earned · ` +
    `THE STREET WAS ARITHMETICALLY IMPOSSIBLE, which is S17q's lesson arriving through a TERM instead of a ` +
    `bar: heat is \`anger + restive - guard\`, \`anger\` caps at 50 because it is \`max(0, 50 - bloc)\`, and ` +
    `\`restive\` was \`unrest - 35\` unbounded below against an unrest that sits at 5 -- so the most heat easy ` +
    `could ever reach was 20 against a bar of ${cake.street.bar}, measured at 20.1 with every bloc driven to ` +
    `8, and the street never spoke in any campaign. The fix is in the TIER: easy's own multipliers take the ` +
    `peak to ${cake.street.easy.meanHeat} on average (${cake.street.easy.minHeat} to ` +
    `${cake.street.easy.maxHeat} over ${cake.street.easy.n} seeds) with an unrest peak of ` +
    `${cake.street.easy.unrestPeak}, and an abandoned constituency is heard on ` +
    `${cake.street.easy.spoke} of ${cake.street.easy.n} campaigns -- still far short of normal's ` +
    `${cake.street.normal.meanHeat}, which is what the tier is for · AND IT IS READ ACROSS SEEDS BECAUSE THE ` +
    `SINGLE-SEED READING WAS A COIN: S21b touches no term in \`v17StreetHeat\` and turned 4242's boolean over ` +
    `anyway, by making parties answer an ignored letter and so changing every engine card played after it. ` +
    `Bisected across ten reverts, exactly one restored the old figure and switching the whole political-memory ` +
    `table off restored nothing -- 7 seeds of 8 spoke before the slice and 6 of 8 after, inside the tier's own ` +
    `21-point spread of peak heat. S16a's ruling, made about pacing figures and exactly as true of a boolean. ` +
    `A FLOOR ON \`restive\` WAS DRAFTED AND ` +
    `MEASURED OUT: alone it reaches 22.1 and the street still does not speak, and on top of the multipliers ` +
    `it changes nothing at all, so it was deleted rather than shipped · EVERY FIELD IS STILL A TILT IN THE DIRECTION IT ALWAYS WAS (${cake.tilts.stillGenerous}) ` +
    `and a safe seat is still safe (${cake.tilts.noCollapse}); what went is the constant -- the incumbency ` +
    `term that was the largest in the vote model and fed by nothing the player does is ` +
    `${cake.tilts.incumbent}, and engine purses breathe again at ${cake.tilts.purseMult} where 3.6 pinned ` +
    `all seven at the 2,000 ceiling · and THE CARD DOES NOT LIE: the blurb promised "two houses that pass ` +
    `whatever you send them", which S20a made false (${cake.blurb.lies})`);

  /* ---------- S20e: THE ENGINE PLAYS THE PLAYER ----------
     Every clause of `v19Rivalry` compares two GOALS, and the player has no
     entry in `st.ai` and therefore no goal -- so the function returned before
     reaching a single clause and the opponent model could not name the human.
     Measured over 2,160 rival reads on the shipped build: named **zero
     times**. Six engine parties spent a hundred and thirty-two sessions
     modelling each other while the person taking their seats was not in the
     model at all. That is most of the owner's "1 of 10": an opponent that
     cannot see you is not an opponent. */
  const sees = await page.evaluate(() => {
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = 'ruthless'; S.rngState = seed; return S;
    }
    function step() { UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) {} UI.queue = []; UI.busy = false; }
    const R = {};

    /* (a) THE HUMAN IS NAMED, AND HOW OFTEN SCALES WITH WHAT THEY HAVE DONE.
       `agg` is how often the player does something to every party. */
    const sweep = (agg) => {
      let reads = 0, human = 0, any = 0;
      [4242, 90210, 7, 31337].forEach(seed => {
        fresh(seed);
        const me = playParty(S);
        for (let i = 0; i < 50; i++) {
          if (agg && i % agg === 0) PARTIES.forEach(q => { if (q.id !== me && !S.banned[q.id]) v16Resent(S, q.id, me, 7); });
          step();
          PARTIES.forEach(q => {
            if (q.id === me || S.banned[q.id]) return;
            reads++;
            let rv = { foe:null };
            try { rv = v19Rival(S, q.id); } catch (e) {}
            if (rv.foe) any++;
            if (rv.foe === me) human++;
          });
        }
      });
      return { reads:reads, any:any, human:human, share:+(human / Math.max(1, reads)).toFixed(3) };
    };
    R.passive = sweep(0);
    R.busy = sweep(8);
    R.hostile = sweep(2);

    /* (b) AND IT IS THE GRUDGE THAT CARRIES IT -- a party that has been done
       something to names the player, one that has not does not. Read on one
       board with one thing changed, which is the only reading that contains
       this term and nothing else. */
    R.term = (() => {
      fresh(4242);
      for (let i = 0; i < 12; i++) step();
      const me = playParty(S);
      const q = PARTIES.filter(p => p.id !== me && !S.banned[p.id])[0].id;
      const a = v16Ai(S)[q];
      const before = v19Rivalry(S, q, me);
      a.grudge[me] = 0;
      const cold = v19Rivalry(S, q, me);
      a.grudge[me] = 80;
      const hot = v19Rivalry(S, q, me);
      a.grudge[me] = 0;
      /* AND THE STRUCTURAL HALF, READ WITH THE GRUDGE AT NOUGHT so only it can
         speak. Removing one of the three conflict clauses left the arm green
         while the grudge carried the reading on its own -- a term covered by
         another term is a term with no assertion. A party that wants into a
         government the player is in regards the player as its obstacle even
         if the player has never touched it. */
      const gsub = (() => {
        a.grudge[me] = 0;
        S.ruling = me; S.coalition = [me];
        const g0 = v19GoalSeen(S, q);
        const before2 = v19Rivalry(S, q, me);
        const ai = v16Ai(S)[q];
        ai.goal = { kind:'enter', ref:me, since:S.turn, best:0 };
        const withAim = v19Rivalry(S, q, me);
        ai.goal = g0 || null;
        return { flat:+before2.toFixed(3), withEnterAim:+withAim.toFixed(3),
          structuralSpeaks: withAim < before2 - 1e-9 };
      })();
      a.grudge[me] = 0;
      return { before:+before.toFixed(3), cold:+cold.toFixed(3), hot:+hot.toFixed(3),
        grudgeCarries: hot < cold, bounded: hot >= -V19_RIVAL.aimed - 1e-9,
        structural:gsub };
    })();

    /* (c) AND IT COSTS THE STREAM NOTHING. S18c: a gate in front of `rand()`
       decides how many numbers come off it, and the opponent model is read
       once per party per session -- if asking about the human rolled, every
       seeded campaign would re-phase. `v19GoalSeen` is the reading accessor
       and `v16Grudge` is a lookup; neither draws. */
    R.stream = (() => {
      fresh(4242);
      for (let i = 0; i < 8; i++) step();
      const me = playParty(S);
      let rolls = 0;
      const r0 = rand;
      rand = function () { rolls++; return r0.apply(this, arguments); };
      try { PARTIES.forEach(q => { if (q.id !== me) { try { v19Rival(S, q.id); } catch (e) {} } }); }
      finally { rand = r0; }
      return { rolls:rolls, free: rolls === 0 };
    })();

    /* (d) AND THE WHIP COUNT IS THE COUNT THAT IS TAKEN. `Math.floor(total/2+1)`
       appears exactly once in three megabytes and it is in that display: the
       card rendered "499 of 1305 · 499 / 653 needed" beside a forecast of 68.2
       and the game decided the bill with the 68.2. */
    R.whip = (() => {
      fresh(4242);
      for (let i = 0; i < 4; i++) step();
      const me = playParty(S);
      const opp = PARTIES.filter(p => p.id !== me && !S.banned[p.id] && S.seats[p.id] > 0)[0];
      const pol = Object.keys(POL)[0];
      const b = { id:'s20e', title:'Probe', policy:pol, dir:1, sponsor:opp.id, owner:'opposition',
        strategy:'clean', whip:0, upperDeal:0, committee:0, concessions:0, confidence:false,
        urgent:false, stage:'assembly', notes:[], lines:{} };
      /* AND THE TWO ARITHMETICS ARE MADE TO DIVERGE, because on a quiet board
         they happen to agree and the poison that put the old one back came
         home green. `bill.pull` is S20b's persuasion, which the old
         `partyBillSupport/100 * seats` knows nothing about; a disciplined
         party carried across fifty by it is exactly where a mean of
         propensities and a count of a lobby part company. */
      b.pull = {};
      PARTIES.forEach(p => { if (S.seats[p.id] > 0) b.pull[p.id] = p.id === me ? 40 : -35; });
      (S.factions[me] || []).forEach(f => { f.loyalty = 95; });
      S.bills = [b];
      const div = billDivision(S, b, 'lower');
      let html = ''; try { html = v8WhipCount(b); } catch (e) { html = ''; }
      const m = html.match(/Assembly (\d+) of (\d+)/);
      const shown = m ? Number(m[1]) : null, total = m ? Number(m[2]) : null;
      return { shown:shown, counted:Math.round(div.ayes), total:total, seats:div.seats,
        agrees: shown !== null && Math.abs(shown - div.ayes) < 1.5 && total === div.seats };
    })();
    return R;
  });

  const seesOk =
    sees.passive.reads > 800 && sees.passive.human > sees.passive.reads * .15 &&
    sees.busy.human > sees.passive.human && sees.hostile.human > sees.busy.human &&
    sees.term.grudgeCarries === true && sees.term.bounded === true &&
    sees.term.cold > sees.term.hot &&
    sees.term.structural.structuralSpeaks === true &&
    sees.stream.free === true &&
    sees.whip.agrees === true;
  say(seesOk, 'the engine plays the player',
    `THE OPPONENT MODEL COULD NOT SEE THE HUMAN. Every clause of \`v19Rivalry\` compares two GOALS and the ` +
    `player has no entry in \`st.ai\`, so the function returned before reaching one of them: over 2,160 rival ` +
    `reads on the shipped build the human was named ZERO times, while six engines modelled each other for a ` +
    `hundred and thirty-two sessions and the person taking their seats was not in the model · THE PLAYER'S AIM ` +
    `IS READ FROM WHAT THEY HAVE DONE, through the grudge \`doAction\`'s memory wrapper has been filling since ` +
    `S17l and the structural facts of who holds what -- no new field, because a field with one writer is what ` +
    `this file punishes hardest · a player who does nothing is still named on ${sees.passive.share} of reads, ` +
    `because whoever governs is everyone's obstacle; one who acts every eighth session on ${sees.busy.share}; ` +
    `one who acts every other session on ${sees.hostile.share} · AND IT IS THE GRUDGE THAT CARRIES IT, read on ` +
    `one board with one thing changed: the same party rates the same player ${sees.term.cold} with nothing ` +
    `done to it and ${sees.term.hot} at a grudge of 80, bounded by what a declared plan is worth so that being ` +
    `hunted by a player is as serious as being named in another party's plan and no more, AND THE STRUCTURAL ` +
    `HALF SPEAKS WITH THE GRUDGE AT NOUGHT (${sees.term.structural.flat} to ` +
    `${sees.term.structural.withEnterAim} when the party wants into a government the player is in), which is ` +
    `read separately because a term covered by another term is a term with no assertion · AND IT COSTS THE ` +
    `STREAM NOTHING (${sees.stream.rolls} rolls), because it reads through \`v19GoalSeen\` and a grudge ` +
    `lookup: S18c measured that one chair consuming one roll fewer re-phases a whole seeded campaign · and ` +
    `THE WHIP COUNT IS NOW THE COUNT THAT IS TAKEN (${sees.whip.shown} of ${sees.whip.total} shown against ` +
    `${sees.whip.counted} of ${sees.whip.seats} counted), where \`Math.floor(total/2+1)\` appears exactly ONCE ` +
    `in three megabytes and it is in that display -- the card rendered "499 of 1305 · 499 / 653 needed" beside ` +
    `a forecast of 68.2 and the game decided the bill with the 68.2`);

  /* ---------- S20g: THE VERB READS THE AIM ----------
     The comment over `V19_GOALS` says "a goal whose progress no card can move
     is the decoration this file punishes hardest, so `worth` below is the list
     of cards that serve it and `roads.js` asserts every goal has at least
     one." That guard exists and it checks the wrong half: `worth` is a
     PREFERENCE over the deck and says nothing about whether the card, once
     drawn, acts on the thing the goal NAMED. Measured six seeds by 120
     sessions on the shipped build, through each verb's own path rather than by
     reproducing its rule: court landed on the named bloc 65 of 154 (.422),
     the bill laid the named statute 27 of 102 (.265), and money reached the
     named office 21 of 90 (.233). The `ground` case is the sharpest because
     both halves were deliberate and they were written to disagree -- the goal
     picks `affinity * (100 - have)`, the bloc it is CLOSE to and has LEAST of,
     and the card banked its 2.6 onto the bloc of highest affinity, the one it
     already held. */
  const aims = await page.evaluate(() => {
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = 'ruthless'; S.rngState = seed; return S;
    }
    function step() { UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) {} UI.queue = []; UI.busy = false; }
    const card = id => V16_AI_DECK.filter(c => c.id === id)[0] || null;
    const R = {};

    /* (a) THE REGISTRY IS TOTAL, which is the guard a hand-kept list can never
       have: a goal a later slice adds fails here unless it names the verb that
       answers it, and a verb that stops existing fails here too. */
    R.registry = (() => {
      const verbs = {}; V16_AI_DECK.forEach(c => { verbs[c.id] = 1; }); verbs.exec = 1;
      const kinds = V19_GOALS.map(g => g.id);
      return {
        kinds: kinds.length, declared: Object.keys(V20_AIM).length,
        missing: kinds.filter(k => !V20_AIM[k]),
        stale: Object.keys(V20_AIM).filter(k => kinds.indexOf(k) < 0),
        unserved: Object.keys(V20_AIM).filter(k => !verbs[V20_AIM[k]]),
        total: kinds.filter(k => !V20_AIM[k]).length === 0 &&
               Object.keys(V20_AIM).filter(k => kinds.indexOf(k) < 0).length === 0 &&
               Object.keys(V20_AIM).filter(k => !verbs[V20_AIM[k]]).length === 0,
      };
    })();

    /* (b) THE SCALE'S FLOOR IS THE SHIPPED GAME EXACTLY. R1 of this program
       asks it of every term S19 and S20 add, and `v20Aim` gets it for all four
       verbs at once by answering null at `instinct`. Asserted BOTH ways round
       -- a poison that makes the accessor always-null would pass the silent
       half on its own. */
    R.floor = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const q = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0];
      if (!q) return { ran:false };
      const a = v16Ai(S)[q.id];
      const bloc = (BLOCS[0] || {}).id;
      a.goal = { kind:'ground', ref:bloc, since:S.turn, want:99, best:0 };
      S.aiLevel = 'instinct';
      let quiet = 0;
      Object.keys(V20_AIM).forEach(k => { if (v20Aim(S, q.id, k)) quiet++; });
      S.aiLevel = 'ruthless';
      const loud = v20Aim(S, q.id, 'ground');
      /* and it answers about the RIGHT kind: a `ground` aim is not an `office` aim */
      const crossed = v20Aim(S, q.id, 'office');
      return { ran:true, atInstinct:quiet, silent: quiet === 0,
        atRuthless: loud || null, speaks: loud === bloc, kindKept: !crossed };
    })();

    /* (c) COURT LANDS ON THE NAMED BLOC, and the arm stands in the gap the
       change closes: the aim is set to a bloc that is NOT this party's
       strongest affinity, which is the one the shipped card always picked.
       An arm that named the strongest affinity could not tell the two apart. */
    R.court = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const q = PARTIES.filter(p => p.id !== playParty(S) && !S.banned[p.id])[0];
      const c = card('court');
      if (!q || !c) return { ran:false };
      const aff = PARTY[q.id].aff || {};
      let top = null;
      BLOCS.forEach(b => { if (top === null || (aff[b.id] || 0) > (aff[top] || 0)) top = b.id; });
      const other = (BLOCS.filter(b => b.id !== top && (aff[b.id] || 0) > .2)[0] ||
                     BLOCS.filter(b => b.id !== top)[0] || {}).id;
      if (!top || !other) return { ran:false };
      const a = v16Ai(S)[q.id];
      const shot = () => { const o = {}; BLOCS.forEach(b => { o[b.id] = S.blocs[b.id] || 0; }); return o; };
      const rose = b0 => BLOCS.filter(b => (S.blocs[b.id] || 0) > b0[b.id] + 1e-9).map(b => b.id);
      a.goal = { kind:'ground', ref:other, since:S.turn, want:99, best:0 };
      let b0 = shot(); try { c.run(S, q.id); } catch (e) {}
      const withAim = rose(b0);
      a.goal = null;
      b0 = shot(); try { c.run(S, q.id); } catch (e) {}
      const noAim = rose(b0);
      return { ran:true, strongest:top, named:other, withAim:withAim, noAim:noAim,
        onAim: withAim.length === 1 && withAim[0] === other,
        shippedPicksStrongest: noAim.length === 1 && noAim[0] === top,
        differ: withAim.join(',') !== noAim.join(',') };
    })();

    /* (d) PLATFORM MOVES TOWARD THE GOVERNMENT IT WANTS TO JOIN. `formCoalition`
       admits on `dist2(ppos(candidate), ppos(lead)) <= .95` or on cooption, and
       cooption is the player's instrument -- so position is the only road an
       engine has into a government.
       THE PARTY IS CHOSEN FOR A POSTURE THAT IS NOT `moderate`, because the
       shipped card sends a moderate one toward `govPos` anyway and an arm
       seated on one of those cannot tell the change from the absence of it.
       Measured, the shipped card already closed the distance on .750 of plays
       for exactly that reason, so this is the quarter that is the finding. */
    R.platform = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const c = card('platform');
      if (!c) return { ran:false };
      /* and a party that is NOT already in the government, because `enter` is
         adopted by one that is outside it and a partner reads oddly on the page */
      const co = S.coalition || [S.ruling];
      const pool = PARTIES.filter(p => p.id !== playParty(S) && co.indexOf(p.id) < 0 && !S.banned[p.id]);
      let q = pool.filter(p => { try { return v16Posture(S, p.id) !== 'moderate'; } catch (e) { return false; } })[0];
      const posture = q ? (() => { try { return v16Posture(S, q.id); } catch (e) { return null; } })() : null;
      if (!q) return { ran:false };
      const a = v16Ai(S)[q.id];
      const d2 = push => {
        const s = ppos(S, q.id), t = ppos(S, S.ruling);
        return Math.pow(s.e + (push ? push.e : 0) - t.e, 2) + Math.pow(s.a + (push ? push.a : 0) - t.a, 2);
      };
      const d0 = d2(null);
      a.goal = { kind:'enter', ref:S.ruling, since:S.turn, best:0 };
      S.push = {}; let line = null;
      try { line = c.run(S, q.id); } catch (e) { line = null; }
      const hot = S.push[q.id] || null;
      a.goal = null;
      S.push = {}; let coldLine = null;
      try { coldLine = c.run(S, q.id); } catch (e) { coldLine = null; }
      const cold = S.push[q.id] || null;
      /* AND THE CARD DOES NOT LIE ABOUT IT. The line the player reads used to
         say "toward the middle of the country" or "back toward its own
         members" and there is now a third thing it does; a card that moved
         toward the government and said it moved toward its members would be
         this file's own "a modifier nothing reads is a lie on the card" with
         the halves the other way round. */
      const says = String(line || ''), coldSays = String(coldLine || '');
      return { ran:true, party:q.id, posture:posture, at:+d0.toFixed(4),
        says: says.slice(0, 90), namesIt: says.indexOf(PARTY[S.ruling].short) >= 0,
        coldSaysIt: coldSays.indexOf(PARTY[S.ruling].short) >= 0,
        withAim: hot ? +d2(hot).toFixed(4) : null, noAim: cold ? +d2(cold).toFixed(4) : null,
        closes: !!hot && d2(hot) < d0 - 1e-9,
        differ: !!hot && !!cold && (Math.abs(hot.e - cold.e) > 1e-9 || Math.abs(hot.a - cold.a) > 1e-9) };
    })();

    /* (e) MONEY FOLLOWS THE OFFICE THE PARTY NAMED, and this arm too stands in
       the gap: the office is one the party polls UNDER the twelve per cent
       floor in and does not hold, which is precisely what the shipped gate
       refused. Wanting a thing you do not yet have was the disqualification --
       69 of 86 chances refused for being behind.
       THE PURSE IS RESTORED BETWEEN THE TWO CALLS, because `v16AiPay` drains
       it and the second reading would then be refused for having no money and
       look exactly like a refusal for having no aim. */
    R.exec = (() => {
      fresh(4242); for (let i = 0; i < 8; i++) step();
      const cyc = (typeof v17NextExecTurn === 'function') ? v17NextExecTurn(S) : null;
      if (cyc === null || typeof v17RaceSeed !== 'function') return { ran:false };
      try { v17RaceSeed(S, cyc); } catch (e) { return { ran:false }; }
      if (!S.execRace) return { ran:false };
      S.execRace.stage = 'general';
      let q = null, off = null;
      (S.execRace.offices || []).forEach(o => {
        let polls = {}; try { polls = v17RacePolls(S, o); } catch (e) { polls = {}; }
        PARTIES.forEach(p => {
          if (q || p.id === playParty(S) || S.banned[p.id]) return;
          if ((polls[p.id] || 0) < .12 && S.exec[o] !== p.id) { q = p.id; off = o; }
        });
      });
      if (!q) return { ran:false };
      S.purse = S.purse || {}; S.purse[q] = V17_AI_OFFICE_SPEND * 4;
      const purse = S.purse[q], key = off + ':' + q;
      const a = v16Ai(S)[q];
      a.goal = null; S.execPush = {}; S.execRace.spent = {}; S.purse[q] = purse;
      try { v17AiRaceSpend(S); } catch (e) {}
      const cold = (S.execPush || {})[key] || 0;
      a.goal = { kind:'office', ref:off, since:S.turn, best:0 };
      S.execPush = {}; S.execRace.spent = {}; S.purse[q] = purse;
      try { v17AiRaceSpend(S); } catch (e) {}
      const hot = (S.execPush || {})[key] || 0;
      return { ran:true, party:q, office:off, cold:+cold.toFixed(3), hot:+hot.toFixed(3),
        refusedWithout: cold === 0, fundedWith: hot > 0, biggerPush: hot > .12 + 1e-9 };
    })();

    /* (f) AND IT COSTS THE STREAM NOTHING. S18c: a gate in front of `rand()`
       decides how many numbers come off it, and `v20Aim` is read inside four
       verbs -- if asking what a party is after ADOPTED a goal it would roll,
       because `v19AdoptGoal` does, and every seeded campaign would re-phase.
       It reads `a.goal` and never calls `v19Goal`, which is the whole reason
       it is a separate accessor rather than a call to the one that exists. */
    R.stream = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      let rolls = 0; const r0 = rand;
      rand = function () { rolls++; return r0.apply(this, arguments); };
      try {
        PARTIES.forEach(p => Object.keys(V20_AIM).forEach(k => {
          try { v20Aim(S, p.id, k); } catch (e) {}
        }));
      } finally { rand = r0; }
      return { rolls:rolls, free: rolls === 0 };
    })();

    /* (g) AND IN REAL PLAY, because calling the function is not testing the
       wiring and S17p found two call sites neither of its poisons touched.
       Every reading is taken through the verb's OWN path -- which bloc rose,
       which push key appeared, what the producer returned -- and never by
       reproducing the rule under test, which is how the first version of this
       probe came to measure the change against itself. */
    R.driven = (() => {
      const C = { court:{ n:0, hit:0 }, bill:{ n:0, hit:0, gone:0 }, exec:{ n:0, hit:0 }, plat:{ n:0, hit:0 } };
      const deck = {}; V16_AI_DECK.forEach(c => { deck[c.id] = c; });
      const bC = deck.court.run, bB = deck.bill.run, bP = deck.platform.run, bS = v17AiRaceSpend;
      const rq = runQueue;
      const goalOf = (st, pid) => { const a = v16Ai(st)[pid]; return (a && a.goal) || null; };
      runQueue = function (done) { UI.queue = []; rq(done); };
      deck.court.run = function (st, pid) {
        const g = goalOf(st, pid), b0 = {};
        BLOCS.forEach(b => { b0[b.id] = st.blocs[b.id] || 0; });
        const out = bC.call(this, st, pid);
        if (g && g.kind === 'ground' && out) {
          let moved = null;
          BLOCS.forEach(b => { if ((st.blocs[b.id] || 0) > b0[b.id] + 1e-9) moved = b.id; });
          if (moved) { C.court.n++; if (moved === g.ref) C.court.hit++; }
        }
        return out;
      };
      deck.bill.run = function (st, pid) {
        const g = goalOf(st, pid);
        let pick = null; try { pick = v19BillFor(st, pid); } catch (e) { pick = null; }
        /* HOW OFTEN THE AIM WAS NOT LAYABLE AT ALL, which is the ceiling:
           `v19BillFor` refuses a statute that is shut or already before the
           House and `carry.target` reads neither. ASKED BEFORE THE CARD RUNS,
           because a party that lays its aim puts a bill on that very statute
           and reading it afterwards counts every hit as unavailable -- the
           first version did, and reported a rate of .591 against a ceiling of
           .333, which is the arithmetic telling you the probe is wrong. */
        let there = false;
        if (g && g.kind === 'carry') {
          try { there = !!(POL[g.ref] && policyOpen(st, POL[g.ref]) && !activeBillFor(st, g.ref)); }
          catch (e) { there = false; }
        }
        const out = bB.call(this, st, pid);
        if (g && g.kind === 'carry' && pick && out) {
          C.bill.n++;
          if (pick.policy === g.ref) C.bill.hit++;
          if (!there) C.bill.gone++;
        }
        return out;
      };
      deck.platform.run = function (st, pid) {
        const g = goalOf(st, pid), q = ppos(st, pid);
        const out = bP.call(this, st, pid);
        if (g && g.kind === 'enter' && out && st.push && st.push[pid] && PARTY[g.ref]) {
          const t = ppos(st, g.ref), p = st.push[pid];
          const d0 = Math.pow(q.e - t.e, 2) + Math.pow(q.a - t.a, 2);
          const d1 = Math.pow(q.e + p.e - t.e, 2) + Math.pow(q.a + p.a - t.a, 2);
          C.plat.n++; if (d1 < d0 - 1e-9) C.plat.hit++;
        }
        return out;
      };
      v17AiRaceSpend = function (st) {
        const r = st.execRace;
        if (!(r && r.stage === 'general')) return bS.call(this, st);
        const want = {};
        PARTIES.forEach(p => {
          if (p.id === playParty(st)) return;
          const g = goalOf(st, p.id);
          if (g && g.kind === 'office' && g.ref) want[p.id] = g.ref;
        });
        const chances = [];
        Object.keys(want).forEach(pid => (r.offices || []).forEach(o => {
          if (o === want[pid] && !(r.spent || {})[o + ':' + pid]) chances.push(o + ':' + pid);
        }));
        const before = Object.assign({}, st.execPush || {});
        const out = bS.call(this, st);
        chances.forEach(k => {
          C.exec.n++;
          if (((st.execPush || {})[k] || 0) > (before[k] || 0)) C.exec.hit++;
        });
        return out;
      };
      try {
        /* S21a widened this from four seeds to six. The `exec` leg's own count
           floor is 20 and it landed on exactly 20 when a downstream change
           reshuffled the republic -- a floor that a boundary can sit on is a
           floor that reports sampling as failure. Six seeds carry every leg
           clear of its own floor without moving a single rate. */
        [4242, 90210, 7, 31337, 555, 8080].forEach(seed => { fresh(seed); for (let i = 0; i < 90; i++) step(); });
      } finally {
        deck.court.run = bC; deck.bill.run = bB; deck.platform.run = bP;
        v17AiRaceSpend = bS; runQueue = rq;
      }
      const rate = o => +(o.hit / Math.max(1, o.n)).toFixed(3);
      return {
        court:{ n:C.court.n, hit:C.court.hit, rate:rate(C.court) },
        bill:{ n:C.bill.n, hit:C.bill.hit, unlayable:C.bill.gone, rate:rate(C.bill),
               ceiling:+((C.bill.n - C.bill.gone) / Math.max(1, C.bill.n)).toFixed(3) },
        exec:{ n:C.exec.n, hit:C.exec.hit, rate:rate(C.exec) },
        platform:{ n:C.plat.n, hit:C.plat.hit, rate:rate(C.plat) },
      };
    })();
    return R;
  });

  const aimOk =
    aims.registry.total === true && aims.registry.declared === aims.registry.kinds &&
    aims.floor.ran === true && aims.floor.silent === true &&
    aims.floor.speaks === true && aims.floor.kindKept === true &&
    aims.court.ran === true && aims.court.onAim === true &&
    aims.court.shippedPicksStrongest === true && aims.court.differ === true &&
    aims.platform.ran === true && aims.platform.closes === true && aims.platform.differ === true &&
    aims.platform.namesIt === true && aims.platform.coldSaysIt === false &&
    aims.exec.ran === true && aims.exec.refusedWithout === true &&
    aims.exec.fundedWith === true && aims.exec.biggerPush === true &&
    aims.stream.free === true &&
    aims.driven.court.n > 40 && aims.driven.court.rate > .9 &&
    aims.driven.bill.n > 30 && aims.driven.bill.rate > .45 &&
    aims.driven.bill.rate <= aims.driven.bill.ceiling + 1e-9 &&
    aims.driven.exec.n > 20 && aims.driven.exec.rate > .35 &&
    aims.driven.platform.n > 10 && aims.driven.platform.rate > .9;
  say(aimOk, 'the verb reads the aim',
    `\`worth\` MAKES A PARTY REACH FOR THE RIGHT CARD AND NOTHING MADE THE CARD ACT ON THE RIGHT THING. The ` +
    `guard over \`V19_GOALS\` asserts every goal has a card that serves it, and a \`worth\` table is a ` +
    `PREFERENCE over the deck: measured six seeds by 120 sessions through each verb's own path, court landed ` +
    `on the named bloc 65 of 154 (.422), the bill laid the named statute 27 of 102 (.265) and money reached ` +
    `the named office 21 of 90 (.233) -- roughly what the pool gives by chance · THE \`ground\` CASE WAS ` +
    `WRITTEN TO DISAGREE WITH ITSELF: the goal picks \`affinity * (100 - have)\`, the bloc it is close to and ` +
    `has LEAST of, and its own comment says "the court card is the only thing that moves it", while the card ` +
    `banked 2.6 onto the bloc of HIGHEST affinity -- the one it already held. Named ${aims.court.named} against ` +
    `a strongest of ${aims.court.strongest}, the card now moves ${aims.court.withAim.join(',')} and moved ` +
    `${aims.court.noAim.join(',')} without the aim · THE EXECUTIVE WAS WORSE THAN CHANCE, not merely equal to ` +
    `it: \`v17AiRaceSpend\` refuses any office a party polls under twelve per cent in, so of 86 chances to ` +
    `back an office a party had publicly NAMED, 69 were refused BECAUSE it was behind -- wanting a thing you ` +
    `do not have was the disqualification. Seated on exactly that case (${aims.exec.party} in ` +
    `${aims.exec.office}, behind and not holding it) the shipped gate pays ${aims.exec.cold} and the aim pays ` +
    `${aims.exec.hot} · AND POSITION IS THE ONLY ROAD INTO A GOVERNMENT an engine has, since \`formCoalition\` ` +
    `admits on distance or on cooption and cooption is the player's instrument: a ${aims.platform.posture} ` +
    `party at ${aims.platform.at} from the government it named closes to ${aims.platform.withAim} and went to ` +
    `${aims.platform.noAim} without the aim, AND THE CARD SAYS SO ("${aims.platform.says}") where it used to ` +
    `offer only the middle of the country or its own members · IN REAL PLAY, driven four seeds by 90 sessions ` +
    `because calling the function is not testing the wiring: court ${aims.driven.court.rate} (was .422), bill ` +
    `${aims.driven.bill.rate} (was .265) inside a CEILING of ${aims.driven.bill.ceiling} -- ` +
    `${aims.driven.bill.unlayable} of ${aims.driven.bill.n} aims were shut or already before the House, which ` +
    `is the chamber working and not a miss, and it is ASKED BEFORE THE CARD RUNS because a party that lays its ` +
    `aim has just put a bill on that statute: reading it afterwards gave .591 against a ceiling of .333, ` +
    `arithmetic that cannot happen -- exec ${aims.driven.exec.rate} (was .233), platform ` +
    `${aims.driven.platform.rate} (was .750, because a moderate posture already pointed at \`govPos\`) · ` +
    `\`V20_AIM\` IS A COVERED SURFACE (${aims.registry.declared} of ${aims.registry.kinds} kinds declared, ` +
    `every one naming a verb that exists), so a goal a later slice adds fails here rather than quietly ` +
    `joining the three that were already decorative · the scale's floor is the shipped game EXACTLY ` +
    `(${aims.floor.atInstinct} aims visible at \`instinct\`, ${aims.floor.atRuthless} at \`ruthless\`) and it ` +
    `costs the stream ${aims.stream.rolls} rolls, because it reads \`a.goal\` and never calls \`v19Goal\`, ` +
    `which adopts and therefore draws`);

  /* ---------- S21a: THE REGARD, SIGNED ----------
     `a.grudge` has always been a per-ordered-pair map and one line stopped it
     being a relationship: `v16Resent` clamped the store at nought, so the
     twelve authored negative weights in `V17_MEMORY` -- under a comment saying
     "AND IT WORKS THE OTHER WAY" -- could only spend an existing grudge down.
     A kindness to a party holding nothing against you wrote literally nothing.

     Measured on the shipped build: no gratitude field anywhere, and an
     identical bill from a sworn enemy and a close ally scoring TO THE SAME
     DECIMAL, because the only party-to-party channel in the file was a grudge
     term bounded at 12 and worth 0.25 points in play. */
  const regard = await page.evaluate(() => {
    const rq = runQueue;
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = 'ruthless'; S.rngState = seed; return S;
    }
    function step() { UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) {} UI.queue = []; UI.busy = false; }
    const R = {};

    /* (a) THE FLOOR, BOTH WAYS ROUND. Credit stored below nought must read as
       no grudge at all, or every pre-S21a reader changes behaviour and this
       slice is not the safe foundation nine later ones are built on. */
    R.floor = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const me = playParty(S);
      const q = PARTIES.filter(p => p.id !== me && !S.banned[p.id])[0];
      if (!q) return { ran:false };
      const a = v16Ai(S)[q.id];
      a.grudge[me] = -55;
      const credit = { stored:a.grudge[me], grudge:v16Grudge(S, q.id, me), regard:v21Regard(S, q.id, me) };
      a.grudge[me] = 40;
      const anger = { stored:a.grudge[me], grudge:v16Grudge(S, q.id, me), regard:v21Regard(S, q.id, me) };
      a.grudge[me] = 0;
      return { ran:true, credit:credit, anger:anger,
        creditHidesFromGrudge: credit.grudge === 0 && credit.regard === 55,
        angerStillReads: anger.grudge === 40 && anger.regard === -40 };
    })();

    /* (b) AND THE CLAMP REALLY OPENED. `v16Resent` with a negative weight on a
       party at nought used to be a no-op; it is the only way credit enters. */
    R.store = (() => {
      fresh(4242); for (let i = 0; i < 4; i++) step();
      const me = playParty(S);
      const q = PARTIES.filter(p => p.id !== me && !S.banned[p.id])[0];
      const a = v16Ai(S)[q.id];
      a.grudge[me] = 0;
      v16Resent(S, q.id, me, -20);
      const afterKindness = a.grudge[me];
      v16Resent(S, q.id, me, -500);
      const floorHolds = a.grudge[me] >= -100;
      a.grudge[me] = 0;
      return { afterKindness:afterKindness, storesCredit: afterKindness === -20,
        bounded: floorHolds, at: a.grudge[me] };
    })();

    /* (c) THE SPONSOR IS SOMEBODY. One board, one voter, five sponsors it
       regards differently, the same bill. The shipped build returned one
       number for all five. This is the arm that stands in the gap. */
    R.sponsor = (() => {
      fresh(4242); for (let i = 0; i < 10; i++) step();
      const me = playParty(S);
      const voter = (PARTIES.filter(p => p.id !== me && !S.banned[p.id])[0] || {}).id;
      if (!voter) return { ran:false };
      const others = PARTIES.filter(p => p.id !== me && p.id !== voter && !S.banned[p.id]).map(p => p.id);
      if (others.length < 3) return { ran:false };
      const a = v16Ai(S)[voter], set = [-80, -30, 0, 30, 80];
      others.forEach((o, i) => { a.grudge[o] = -set[i % set.length]; });
      const pol = Object.keys(POL)[0];
      const score = o => {
        const bill = { id:'s21a', policy:pol, dir:1, sponsor:o, owner:'opposition',
          strategy:'clean', whip:0, upperDeal:0, committee:0, concessions:0,
          confidence:false, urgent:false, stage:'assembly', notes:[], lines:{} };
        let v = 0; try { v = partyBillSupport(S, voter, bill); } catch (e) { v = 0; }
        return +v.toFixed(3);
      };
      const scores = others.map(o => ({ id:o, regard:v21Regard(S, voter, o), score:score(o) }));
      const vals = scores.map(s => s.score);
      /* and it is MONOTONE in the regard, not merely different: a probe that
         only asked for distinct values would pass on a build that read the
         regard and got the sign backwards */
      const bySign = scores.slice().sort((x, y) => x.regard - y.regard);
      let mono = true;
      for (let i = 1; i < bySign.length; i++) if (bySign[i].score < bySign[i - 1].score - 1e-9) mono = false;
      others.forEach(o => { delete a.grudge[o]; });
      return { ran:true, voter:voter, scores:scores,
        distinct:new Set(vals).size, of:vals.length,
        spread:+(Math.max.apply(null, vals) - Math.min.apply(null, vals)).toFixed(2),
        monotone:mono };
    })();

    /* (d) ASSENT ASKS THE HOLDER ABOUT THE SPONSOR. It read
       `st.partyRel[who]` -- the PLAYER's relationship with the office holder --
       and arbitrated 768 engine-to-engine decisions with it, refusing 88.2%.
       Read here on one board with one thing changed. */
    R.assent = (() => {
      fresh(4242); for (let i = 0; i < 12; i++) step();
      const me = playParty(S);
      const offices = Object.keys(S.exec || {}).filter(d => S.exec[d] && S.exec[d] !== me);
      if (!offices.length) return { ran:false };
      const d = offices[0], who = S.exec[d];
      const spon = PARTIES.filter(p => p.id !== me && p.id !== who && !S.banned[p.id])[0];
      if (!spon) return { ran:false };
      const pol = Object.keys(POL)[0];
      /* `assemblyVote` IS PINNED, WHICH IS THE WHOLE ARM. `assentFavour` reads
         `line * w + merits * (1 - w)`, and `merits` falls back to
         `billForecast(...).lower` -- which runs `partyBillSupport`, which S21a
         also taught to read the regard. Without a fixed `merits` this arm
         measured BOTH readers at once, and its two poisons (put `line` back to
         the player's scalar, and ask the sponsor about the holder instead of
         the holder about the sponsor) both came back GREEN, carried by the
         forecast. Two terms behind one number is the tautology family this
         file's history is a list of. */
      const bill = { id:'s21aA', policy:pol, dir:1, sponsor:spon.id, owner:'opposition',
        strategy:'clean', whip:0, upperDeal:0, committee:0, concessions:0, confidence:false,
        urgent:false, stage:'assent', assentOffice:d, assemblyVote:52, notes:[], lines:{} };
      const a = v16Ai(S)[who];
      a.grudge[spon.id] = 90;                 /* the holder loathes the sponsor */
      let cold = 0; try { cold = assentFavour(S, bill); } catch (e) {}
      a.grudge[spon.id] = -90;                /* and owes them */
      let warm = 0; try { warm = assentFavour(S, bill); } catch (e) {}
      delete a.grudge[spon.id];
      /* AND IT IS THE HOLDER'S VIEW OF THE SPONSOR, not the sponsor's of the
         holder. Seeding the other direction must NOT move it. */
      let flat = 0; try { flat = assentFavour(S, bill); } catch (e) {}   /* both at nought */
      const b2 = v16Ai(S)[spon.id];
      b2.grudge[who] = -90;
      let mirror = 0; try { mirror = assentFavour(S, bill); } catch (e) {}
      delete b2.grudge[who];
      return { ran:true, office:d, holder:who, sponsor:spon.id,
        cold:+cold.toFixed(2), warm:+warm.toFixed(2), moves: warm > cold + 1e-9,
        flat:+flat.toFixed(2), mirror:+mirror.toFixed(2),
        directional: Math.abs(mirror - flat) < 1e-9 };
    })();

    /* (e) A PACT IS WRITTEN ON BOTH SIDES AND POOLED ONCE. The card wrote the
       proposer's key only, so the party stood down FOR never recorded it and
       `V17_MEMORY.pact` reached nobody. Both keys now -- and the ballot walks
       the keys, so the pooling has to be asked about too or it pays twice. */
    R.pact = (() => {
      fresh(90210); for (let i = 0; i < 6; i++) step();
      const me = playParty(S);
      const card = V16_AI_DECK.filter(c => c.id === 'pact')[0];
      S.aiPacts = {};
      const q = PARTIES.filter(p => p.id !== me && p.id !== S.ruling &&
        (S.coalition || []).indexOf(p.id) < 0 && !S.banned[p.id] &&
        !!v16PactPartner(S, p.id))[0];
      if (!card || !q) return { ran:false };
      S.purse = S.purse || {}; S.purse[q.id] = 400;
      PARTIES.forEach(x => { delete v16Ai(S)[q.id].grudge[x.id]; });
      let line = null; try { line = card.run(S, q.id); } catch (e) {}
      const o = (S.aiPacts[q.id] || {}).with;
      const out = { ran:true, partner:o || null,
        bothRemember: !!o && v21Regard(S, o, q.id) > 0 && v21Regard(S, q.id, o) > 0 };
      /* WRITING THE SECOND `st.aiPacts` KEY IS NOT PART OF THIS SLICE and the
         arm says so, because `v16PactPartner` refuses any party that appears
         in the map: two keys lock BOTH parties out of future pacts where one
         locked the proposer, which halves the card's availability. Bisected,
         that single line took S19b's rivalry lift from +.026 to +.004 and
         inverted it. It belongs in the slice that owns open-set changes. */
      out.oneKeyOnly = !!o && !S.aiPacts[o];
      S.aiPacts = {};
      return out;
    })();

    /* (e2) AND A PACT GOES TO SOMEBODY YOU HAVE REASON TO TRUST. The picker
       took the ideologically nearest eligible party, so one that had stood
       down for you twice and one you had never dealt with were the same
       candidate. Credit pulls the ranking without widening the radius, so a
       party outside .62 still cannot be reached. */
    R.picker = (() => {
      /* THE BOARD IS SEARCHED, NOT ASSUMED. This needs a party the picker
         answers for AND a second eligible neighbour for credit to move it to,
         and whether one exists is a fact about the compass on that seed. Two
         earlier versions of this arm took the first eligible party on one seed
         and read `null`, which is the probe choosing badly rather than the
         mechanism failing. */
      let me = null, q = null, flat = null, seedUsed = null;
      [4242, 90210, 7, 31337, 555, 8080].forEach(sd => {
        if (q) return;
        fresh(sd); for (let i = 0; i < 8; i++) step();
        S.aiPacts = {};
        const m2 = playParty(S);
        PARTIES.forEach(p => {
          if (q || p.id === m2 || p.id === S.ruling || S.banned[p.id]) return;
          if ((S.coalition || []).indexOf(p.id) >= 0) return;
          const a0 = v16Ai(S)[p.id];
          PARTIES.forEach(x => { delete a0.grudge[x.id]; });
          const f = v16PactPartner(S, p.id);
          if (!f) return;
          const alt = PARTIES.filter(x => x.id !== p.id && x.id !== m2 && x.id !== f &&
            x.id !== S.ruling && (S.coalition || []).indexOf(x.id) < 0 && !S.banned[x.id] &&
            dist2(ppos(S, p.id), ppos(S, x.id)) < .62);
          if (alt.length) { q = p; flat = f; me = m2; seedUsed = sd; }
        });
      });
      if (!q) return { ran:false, searched:6 };
      const a = v16Ai(S)[q.id];
      /* an eligible party that is NOT the flat pick, brought forward by credit */
      const rivals = PARTIES.filter(p => p.id !== q.id && p.id !== me && p.id !== flat &&
        p.id !== S.ruling && (S.coalition || []).indexOf(p.id) < 0 && !S.banned[p.id] &&
        dist2(ppos(S, q.id), ppos(S, p.id)) < .62).map(p => p.id);
      if (!flat || !rivals.length) return { ran:false, flat:flat };
      a.grudge[rivals[0]] = -100;
      const bought = v16PactPartner(S, q.id);
      /* and the radius did NOT widen: a party outside it stays out however
         much it is owed */
      const far = PARTIES.filter(p => p.id !== q.id && p.id !== me &&
        dist2(ppos(S, q.id), ppos(S, p.id)) >= .62 && !S.banned[p.id])[0];
      let stillOut = null;
      if (far) { a.grudge[far.id] = -100; stillOut = v16PactPartner(S, q.id) !== far.id; }
      PARTIES.forEach(p => { delete a.grudge[p.id]; });
      return { ran:true, seed:seedUsed, party:q.id, flat:flat, bought:bought,
        creditMoves: bought === rivals[0] && bought !== flat, radiusHolds:stillOut };
    })();

    /* (f) ANGER COOLS FASTER THAN CREDIT KEEPS, which is the whole argument for
       a signed store: at one rate, credit is a grudge you have not earned. */
    R.cool = (() => {
      fresh(4242); for (let i = 0; i < 4; i++) step();
      const me = playParty(S);
      const two = PARTIES.filter(p => p.id !== me && !S.banned[p.id]).slice(0, 2);
      if (two.length < 2) return { ran:false };
      /* THE PER-SESSION DELTA, RE-SEEDED EACH TIME. Reading the level after ten
         live sessions measures the cooling PLUS whatever the republic wrote in
         between: the first version of this arm read anger of 38 from a seed of
         30 and called the cooling broken, when what had happened is that the
         board went on being political. Re-seeding isolates the sweep. */
      const dropA = [], riseC = [];
      for (let i = 0; i < 8; i++) {
        v16Ai(S)[two[0].id].grudge[me] = 30;
        v16Ai(S)[two[1].id].grudge[me] = -30;
        step();
        dropA.push(+(30 - (v16Ai(S)[two[0].id].grudge[me] || 0)).toFixed(3));
        riseC.push(+((v16Ai(S)[two[1].id].grudge[me] || 0) + 30).toFixed(3));
      }
      const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
      const anger = med(dropA), credit = med(riseC);
      return { ran:true, angerPerSession:anger, creditPerSession:credit,
        creditKeepsLonger: credit < anger - 1e-9,
        angerAfter20: +(30 - anger * 20).toFixed(1), creditAfter20: +(30 - credit * 20).toFixed(1) };
    })();

    /* (g) EVERY WEIGHT NAMES A VERB THAT EXISTS. S16e's memory listed
       `radicalise`, the id of no action in the game; this is the guard that
       makes that impossible rather than a thing somebody noticed. */
    R.cover = (() => {
      const ids = Object.keys(V17_MEMORY);
      const known = {};
      /* `partyActions` TAKES ONE ARGUMENT. It is reassigned in the S9 chunk as
         `partyActions = function (pid)`, and calling it `(S, pid)` returns the
         list for a party named `[object Object]` -- which is empty, and which
         reported the four `v9*` verbs as ghosts on the first run of this arm.
         The game was right and the probe was wrong, which is the order this
         file's history says to check them in. */
      PARTIES.forEach(p => {
        let list = [];
        try { list = (typeof partyActions === 'function') ? partyActions(p.id) : []; } catch (e) { list = []; }
        (list || []).forEach(a => { if (a && a.id) known[a.id] = 1; });
      });
      (ACTIONS || []).forEach(a => { if (a && a.id) known[a.id] = 1; });
      const ghosts = ids.filter(id => !known[id]);
      return { entries:ids.length, ghosts:ghosts,
        defectSign: (V17_MEMORY.defect || {}).self,
        defectIsCredit: ((V17_MEMORY.defect || {}).self || 0) < 0,
        negatives: ids.filter(id => (V17_MEMORY[id].self || 0) < 0).length };
    })();

    /* (g2) AND THE PAGE SAYS SO. The Parties card's memory column read
       "Nothing on file" for a party that had been in your coalition, taken
       your money and been let off a cordon, because the store could not hold a
       favour. A mechanic the player cannot perceive reads as randomness, and
       both halves are the one signed number so the sentence cannot disagree
       with what the chamber reads. */
    R.page = (() => {
      fresh(4242); for (let i = 0; i < 8; i++) step();
      const me = playParty(S);
      const q = PARTIES.filter(p => p.id !== me && !S.banned[p.id])[0];
      if (!q) return { ran:false };
      const a = v16Ai(S)[q.id];
      const read = () => { let h = ''; try { h = v16AiPanel(); } catch (e) { h = ''; } return h; };
      a.grudge[me] = 0;
      const flat = read();
      a.grudge[me] = -60;
      const owed = read();
      a.grudge[me] = 60;
      const angry = read();
      a.grudge[me] = 0;
      return { ran:true,
        flatSaysNothing: /Nothing on file/.test(flat),
        owedSaysFavour: /owe you|favour on file/i.test(owed),
        angrySaysGrievance: /not forgotten|grievance on file/i.test(angry),
        owedIsNotFlat: owed !== flat };
    })();

    /* (h) AND IT COSTS THE STREAM NOTHING. `v21Regard` is a lookup, and it is
       read inside `partyBillSupport`, which the forecast calls for every party
       on every division -- if it rolled, every seeded campaign would re-phase. */
    R.stream = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      let rolls = 0; const r0 = rand;
      rand = function () { rolls++; return r0.apply(this, arguments); };
      try {
        PARTIES.forEach(p => PARTIES.forEach(q => {
          if (p.id !== q.id) { try { v21Regard(S, p.id, q.id); v16Grudge(S, p.id, q.id); } catch (e) {} }
        }));
      } finally { rand = r0; }
      return { rolls:rolls, free: rolls === 0 };
    })();
    runQueue = rq;
    return R;
  });

  const regardOk =
    regard.floor.ran === true && regard.floor.creditHidesFromGrudge === true &&
    regard.floor.angerStillReads === true &&
    regard.store.storesCredit === true && regard.store.bounded === true &&
    regard.sponsor.ran === true && regard.sponsor.distinct === regard.sponsor.of &&
    regard.sponsor.spread > 8 && regard.sponsor.monotone === true &&
    regard.assent.ran === true && regard.assent.moves === true &&
    regard.assent.directional === true &&
    regard.picker.ran === true && regard.picker.creditMoves === true &&
    regard.picker.radiusHolds !== false &&
    regard.page.ran === true && regard.page.flatSaysNothing === true &&
    regard.page.owedSaysFavour === true && regard.page.angrySaysGrievance === true &&
    regard.pact.ran === true && regard.pact.bothRemember === true &&
    regard.pact.oneKeyOnly === true &&
    regard.cool.ran === true && regard.cool.creditKeepsLonger === true &&
    regard.cover.ghosts.length === 0 && regard.cover.defectIsCredit === true &&
    regard.cover.negatives >= 12 &&
    regard.stream.free === true;
  say(regardOk, 'a party can be owed, and remembers it',
    `\`a.grudge\` WAS ALREADY A PER-ORDERED-PAIR MAP AND ONE LINE STOPPED IT BEING A RELATIONSHIP. ` +
    `\`v16Resent\` clamped the store at nought, so the twelve authored negative weights in ` +
    `\`V17_MEMORY\` -- sitting under a comment that says "AND IT WORKS THE OTHER WAY" -- could only ` +
    `ever spend an existing grudge down, and a kindness to a party that held nothing against you wrote ` +
    `LITERALLY NOTHING. Measured on the shipped build: no gratitude field anywhere in three megabytes ` +
    `· THE CHANGE IS THE CLAMP. The store opens to (-100, 100), \`v16Grudge\` gains a \`Math.max(0, .)\` ` +
    `so all twelve existing readers see what they always saw (credit of 55 reads as grudge ` +
    `${regard.floor.credit.grudge} and regard ${regard.floor.credit.regard}; anger of 40 still reads ` +
    `${regard.floor.anger.grudge}), and \`v21Regard\` is the signed reader new code opts into. A parallel ` +
    `trust matrix was proposed by three of the four S21 designs and REJECTED: a second mechanism ` +
    `computing a fact the first already computes is this file's own worst habit · AND THE SPONSOR IS ` +
    `SOMEBODY AT LAST. An identical bill from a sworn enemy and a close ally scored to the SAME DECIMAL, ` +
    `because the grudge term was bounded at 12 and measured 0.25 points in play; one voter over ` +
    `${regard.sponsor.of} sponsors it regards differently now returns ${regard.sponsor.distinct} distinct ` +
    `scores across ${regard.sponsor.spread} points, monotone in the regard (${regard.sponsor.monotone}) so ` +
    `a build that read the sign backwards reddens here · ASSENT ASKS THE HOLDER ABOUT THE SPONSOR, where ` +
    `it read the PLAYER's relationship with the office holder and decided 768 engine-to-engine bills with ` +
    `it, refusing 88.2%: the same office rates the same bill ${regard.assent.cold} from a sponsor it ` +
    `loathes and ${regard.assent.warm} from one it owes -- and it is the HOLDER's view of the SPONSOR, so ` +
    `seeding the other direction leaves it at ${regard.assent.mirror} against a neutral ${regard.assent.flat} ` +
    `· \`assemblyVote\` is pinned in that arm, because \`merits\` otherwise falls back to the forecast, ` +
    `which S21a also taught to read the regard: unpinned, BOTH of that arm's poisons came back green, ` +
    `carried by the second reader · driven, the signing rate goes .065 to .111 ` +
    `with refusal 88.2% to 83.8% · A PACT GOES TO SOMEBODY YOU HAVE REASON TO TRUST -- the picker took the ` +
    `nearest eligible party, so one that had stood down for you twice and one you had never dealt with ` +
    `were the same candidate; credit moves it from ${regard.picker.flat} to ${regard.picker.bought} without ` +
    `widening the radius (a party outside .62 stays out: ${regard.picker.radiusHolds}) · AND BOTH PARTIES ` +
    `REMEMBER A PACT (${regard.pact.bothRemember}), where the card never called the memory at all and ` +
    `\`V17_MEMORY\`'s \`pact: -10\` -- the one authored weight for the only cooperative verb in the deck -- ` +
    `reached nobody · WRITING THE SECOND \`st.aiPacts\` KEY IS DELIBERATELY NOT IN THIS SLICE ` +
    `(${regard.pact.oneKeyOnly}): \`v16PactPartner\` refuses any party in the map, so two keys lock BOTH ` +
    `parties out of future pacts where one locked the proposer, and bisected, that single line took S19b's ` +
    `rivalry lift from +.026 on boards carrying a rival to +.004 and inverted it against the +.024 on boards ` +
    `carrying none -- an open-set change in a foundation slice, which the plan sequences last · anger ` +
    `cools at ${regard.cool.angerPerSession} a session and credit keeps at ${regard.cool.creditPerSession}, ` +
    `so twenty sessions leave ${regard.cool.angerAfter20} of an injury and ${regard.cool.creditAfter20} of a ` +
    `favour of the same size -- measured as a per-session delta with the pair re-seeded each time, because ` +
    `reading the level after ten live sessions measures the cooling plus whatever the republic wrote in ` +
    `between · \`defect\` NO LONGER CHARGES THE ` +
    `PARTY IT ENRICHES: the verb hands its target seats taken from the largest parties, and the ` +
    `beneficiary took +18 while the five who lost the members took +2 each; it is ` +
    `${regard.cover.defectSign} now · every one of the ${regard.cover.entries} weights names a verb that ` +
    `exists (${regard.cover.ghosts.length} ghosts), which is the guard S16e's \`radicalise\` needed · AND THE ` +
    `PAGE SAYS SO: the memory column read "Nothing on file" for a party that had been in your coalition, ` +
    `taken your money and been let off a cordon, and now names a favour (${regard.page.owedSaysFavour}) as ` +
    `well as a grievance (${regard.page.angrySaysGrievance}) off the one signed number · and ` +
    `it costs the stream ${regard.stream.rolls} rolls, because \`partyBillSupport\` is called for every ` +
    `party on every division and a read that rolled would re-phase every seeded campaign`);

  /* ---------- S21b: WHAT A PARTY HOLDS AGAINST A GOVERNMENT ----------
     `V17_MEMORY` is the memory of the PLAYER'S BUTTONS: all thirty-four
     weights are written by the `doAction` wrapper, so a party could only ever
     remember something a human pressed. Nothing that happens in the ordinary
     course of governing was remembered by anybody -- and `attack.can` forbids
     the government from attacking, so the government remembered every attacker
     and nobody accumulated a grudge against IT. Measured, 394 of 3,729 ledger
     entries pointed at a party in government.

     That is why `oust` was unreachable, and it is also why the formation's
     four branches were: nobody ever refused an offer, because nobody held
     anything against anybody. */
  const polit = await page.evaluate(() => {
    const rq = runQueue;
    function fresh(seed) {
      SEED_OVERRIDE = seed;
      S = enrichState(v6NewGame('normal', 'v6default', 'epic', 'lp'), false);
      S.aiLevel = 'ruthless'; S.rngState = seed; return S;
    }
    function step() { UI.queue = []; UI.busy = false; try { endTurn(); } catch (e) {} UI.queue = []; UI.busy = false; }
    const R = {};

    /* (a) THE REGISTRY IS COVERED IN BOTH DIRECTIONS. Every kind `v21Answer`
       is called with must carry a weight, and every weight must name a kind
       something raises -- the guard S16e's `radicalise` needed, built in from
       the start rather than bolted on after somebody noticed. */
    /* THE ORACLE IS BEHAVIOURAL, NOT TEXTUAL. The first version scanned the
       source of the five callers for each kind's name -- and `enactBill` and
       `runElection` are both REASSIGNED in later chunks, so `String()` of the
       live binding returns a wrapper and three of the six kinds read as
       unraised on a build that raises all six. "A reassignment is not a
       wrapper" is this file's own rule, and a probe that reads a function body
       to decide what the game does is the shape it warns about. `R.fired` is
       filled by wrapping `v21Answer` across the driven leg below, so a kind
       counts as covered when the republic actually raises it. */
    R.cover = (() => {
      const declared = Object.keys(V21_POLITICS);
      const shaped = declared.filter(k => typeof (V21_POLITICS[k] || {}).self !== 'number');
      return { declared:declared.length, misshaped:shaped };
    })();

    /* (b) THE FLOOR. At `instinct` the channel is silent, so the shipped game
       is the shipped game. And it never writes during a rehearsal, or every
       card the chooser weighs would leave a grievance behind. */
    R.floor = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const q = PARTIES.filter(p => p.id !== S.ruling && p.id !== playParty(S) && !S.banned[p.id])[0];
      if (!q) return { ran:false };
      const a = v16Ai(S)[q.id];
      const read = () => a.grudge[S.ruling] || 0;
      a.grudge[S.ruling] = 0;
      S.aiLevel = 'instinct'; v21Answer(S, 'statuteAgainst', q.id);
      const atInstinct = read();
      S.aiLevel = 'ruthless';
      const wasSim = V19_SIMULATING; V19_SIMULATING = true;
      v21Answer(S, 'statuteAgainst', q.id);
      const inSim = read();
      V19_SIMULATING = wasSim;
      v21Answer(S, 'statuteAgainst', q.id);
      const live = read();
      a.grudge[S.ruling] = 0;
      return { ran:true, atInstinct:atInstinct, inSim:inSim, live:live,
        silentAtInstinct: atInstinct === 0, silentInSim: inSim === 0,
        speaks: live > 0 };
    })();

    /* (c) THE GOVERNMENT IS BLAMED AND ITS PARTNERS TAKE A SHARE. Sitting in a
       cabinet that did the thing is not the same as opposing it and is not the
       same as having done it. */
    R.blame = (() => {
      fresh(4242); for (let i = 0; i < 8; i++) step();
      const co = (S.coalition || [S.ruling]).slice();
      const partner = co.filter(x => x !== S.ruling)[0];
      const q = PARTIES.filter(p => co.indexOf(p.id) < 0 && p.id !== playParty(S) && !S.banned[p.id])[0];
      if (!q || !partner) return { ran:false };
      const a = v16Ai(S)[q.id];
      PARTIES.forEach(x => { delete a.grudge[x.id]; });
      v21Answer(S, 'statuteAgainst', q.id);
      const onGov = a.grudge[S.ruling] || 0, onPartner = a.grudge[partner] || 0;
      const outside = PARTIES.filter(p => co.indexOf(p.id) < 0 && p.id !== q.id && p.id !== playParty(S))[0];
      const onOutsider = outside ? (a.grudge[outside.id] || 0) : 0;
      PARTIES.forEach(x => { delete a.grudge[x.id]; });
      return { ran:true, onGov:+onGov.toFixed(2), onPartner:+onPartner.toFixed(2),
        onOutsider:+onOutsider.toFixed(2),
        govBlamedMost: onGov > onPartner && onPartner > 0 && onOutsider === 0 };
    })();

    /* (d) THE IGNORED LETTER IS DATED FOR A READER THAT HAS ALREADY GONE BY.
       `v19React` runs in `tickTurn`, `expireInbox` in `politicsTick` after it,
       and `S.turn += 1` after both, so the stamp was permanently one behind
       the only thing that reads it. 63% of every grievance against the player
       went through that path and produced ZERO reactions. */
    R.letter = (() => {
      fresh(4242); for (let i = 0; i < 6; i++) step();
      const me = playParty(S);
      const q = PARTIES.filter(p => p.id !== me && !S.banned[p.id])[0];
      if (!q) return { ran:false };
      const a = v16Ai(S)[q.id];
      delete (a.provokedAt || {})[me];
      const pol = Object.keys(POL)[0];
      S.inbox = S.inbox || [];
      S.inbox.push({ id:'s21bL', type:'party_demand', from:q.id, policy:pol, dir:1,
        deadline:S.turn, title:'probe', body:'probe' });
      expireInbox(S);
      const stamp = (a.provokedAt || {})[me];
      return { ran:true, stamp:stamp === undefined ? null : stamp, turn:S.turn,
        datedForward: stamp === S.turn + 1,
        weight:V21_IGNORED_LETTER, underMedianProvocation: V21_IGNORED_LETTER < 13.4,
        clearsTheBar: V21_IGNORED_LETTER >= V19_REACT_RISE };
    })();

    /* (e) `oust` ASKS ONE QUESTION AND IT IS ABOUT THE GOVERNMENT. Its three
       predicates disagreed: `fits` wanted a grudge against ANYBODY, `target`
       picked the argmax with no reference to who governs, and `done` wanted
       that party out of government -- which it already was on 808 of the 880
       boards that passed `fits`, so `v19AdoptGoal` dropped it at birth. */
    R.oust = (() => {
      fresh(4242); for (let i = 0; i < 8; i++) step();
      const kind = V19_GOALS.filter(g => g.id === 'oust')[0];
      const q = PARTIES.filter(p => (S.coalition || [S.ruling]).indexOf(p.id) < 0 &&
        p.id !== playParty(S) && !S.banned[p.id])[0];
      if (!kind || !q) return { ran:false };
      const a = v16Ai(S)[q.id];
      PARTIES.forEach(x => { delete a.grudge[x.id]; });
      /* hate somebody OUTSIDE the government: the aim must not fire */
      const out = PARTIES.filter(p => (S.coalition || [S.ruling]).indexOf(p.id) < 0 &&
        p.id !== q.id && p.id !== playParty(S) && !S.banned[p.id])[0];
      let onOutsider = null, tgtOutsider = null;
      if (out) {
        a.grudge[out.id] = 90;
        onOutsider = kind.fits(S, q.id);
        tgtOutsider = kind.target(S, q.id);
        delete a.grudge[out.id];
      }
      /* and hate the government LESS than an outsider: the target must still
         be the government. An arm that only seeds the government cannot tell
         "aims at the government" from "aims at the worst grudge", and reverting
         `target` to the argmax over all parties came back GREEN on it. */
      a.grudge[S.ruling] = 60;
      if (out) a.grudge[out.id] = 95;
      const onGov = kind.fits(S, q.id);
      const tgt = kind.target(S, q.id);
      const doneAtBirth = tgt ? kind.done(S, q.id, tgt) : null;
      PARTIES.forEach(x => { delete a.grudge[x.id]; });
      return { ran:true,
        fitsOnOutsider:onOutsider, targetOnOutsider: tgtOutsider ? tgtOutsider.ref : null,
        fitsOnGov:onGov, target: tgt ? tgt.ref : null, stampsGov: !!(tgt && tgt.gov),
        ignoresOutsiders: onOutsider === 0,
        aimsAtGovernment: !!tgt && tgt.ref === S.ruling,
        notDoneAtBirth: doneAtBirth === false };
    })();

    /* (f) AND IN REAL PLAY, driven, because a channel that only fires when a
       probe calls it by hand is the `st.unrest = 80` defect. The formation
       outcomes are read in the same pass: this channel's whole risk is being
       right in kind and wrong in degree, and the first draft of its weights
       took 110 of 360 elections to a caretaker. */
    R.driven = (() => {
      runQueue = function (done) { UI.queue = []; rq(done); };
      const g = [], how = {};
      let oustAdopted = 0, oustDone = 0, reactions = 0;
      const seen = {};
      const bF = v17Rotation;
      v17Rotation = function (st, pin) {
        const out = bF.call(this, st, pin);
        if (!V19_SIMULATING) how[out.how] = (how[out.how] || 0) + 1;
        return out;
      };
      /* REACTIONS ARE COUNTED AT THE READER, not sampled after the step. The
         first version of this leg asked `a.react === S.turn` once a session --
         and `S.turn += 1` happens inside `endTurn` AFTER `v19React` has run, so
         a stamp written this session can never equal the turn the sample reads.
         It reported zero on a build that fires twelve. That is the same
         off-by-one this slice fixes in the game, made by the probe measuring
         it, which is this file's own rule arriving on schedule. */
      const fired = {};
      const bAns = v21Answer;
      v21Answer = function (st, kind, target, w) {
        if (!V19_SIMULATING) fired[kind] = (fired[kind] || 0) + 1;
        return bAns.call(this, st, kind, target, w);
      };
      const bRe = v19React;
      v19React = function (st) {
        const was = {};
        PARTIES.forEach(p => { was[p.id] = (v16Ai(st)[p.id] || {}).react; });
        const out = bRe.call(this, st);
        PARTIES.forEach(p => {
          const a2 = v16Ai(st)[p.id] || {};
          if (a2.react !== was[p.id] && a2.react === st.turn) reactions++;
        });
        return out;
      };
      try {
        [4242, 90210, 7, 31337, 555, 8080].forEach(seed => {
          fresh(seed);
          for (let i = 0; i < 120; i++) {
            step();
            const co = S.coalition || [S.ruling];
            PARTIES.forEach(p => {
              if (p.id === playParty(S) || S.banned[p.id]) return;
              const a = v16Ai(S)[p.id]; if (!a) return;
              co.forEach(x => { if (x !== p.id) g.push(v16Grudge(S, p.id, x)); });
              if (a.goal && a.goal.kind === 'oust') {
                const k = seed + ':' + p.id + ':' + a.goal.since;
                if (!seen[k]) { seen[k] = 1; oustAdopted++; }
              }
              if (a.lastGoal && a.lastGoal.kind === 'oust' && a.lastGoal.why === 'done') {
                const k2 = 'd' + seed + ':' + p.id + ':' + a.lastGoal.since;
                if (!seen[k2]) { seen[k2] = 1; oustDone++; }
              }
            });
          }
        });
      } finally { v17Rotation = bF; v19React = bRe; v21Answer = bAns; runQueue = rq; }
      g.sort((x, y) => x - y);
      const q = p => g.length ? +g[Math.floor(g.length * p)].toFixed(1) : null;
      const forms = Object.keys(how).reduce((s2, k) => s2 + how[k], 0);
      return { pairs:g.length, p50:q(.5), p90:q(.9), p99:q(.99),
        holding:+(g.filter(x => x > 0).length / Math.max(1, g.length)).toFixed(3),
        oustAdopted:oustAdopted, oustDone:oustDone, reactions:reactions,
        how:how, forms:forms, fired:fired,
        firedKinds:Object.keys(fired).length,
        unraised:Object.keys(V21_POLITICS).filter(k => !fired[k]),
        undeclared:Object.keys(fired).filter(k => !V21_POLITICS[k]),
        branches:Object.keys(how).length,
        caretakerShare:+((how.caretaker || 0) / Math.max(1, forms)).toFixed(3) };
    })();
    return R;
  });

  const politOk =
    polit.cover.declared >= 6 && polit.cover.misshaped.length === 0 &&
    polit.driven.unraised.length === 0 && polit.driven.undeclared.length === 0 &&
    polit.floor.ran === true && polit.floor.silentAtInstinct === true &&
    polit.floor.silentInSim === true && polit.floor.speaks === true &&
    polit.blame.ran === true && polit.blame.govBlamedMost === true &&
    polit.letter.ran === true && polit.letter.datedForward === true &&
    polit.letter.underMedianProvocation === true && polit.letter.clearsTheBar === true &&
    polit.oust.ran === true && polit.oust.ignoresOutsiders === true &&
    polit.oust.aimsAtGovernment === true && polit.oust.stampsGov === true &&
    polit.oust.notDoneAtBirth === true &&
    polit.driven.p90 > 15 && polit.driven.p90 < 50 &&
    polit.driven.holding > .3 &&
    polit.driven.oustAdopted >= 4 && polit.driven.oustDone >= 2 &&
    polit.driven.reactions > 0 &&
    polit.driven.branches >= 3 && polit.driven.caretakerShare < .1;
  say(politOk, 'a party holds something against a government',
    `\`V17_MEMORY\` IS THE MEMORY OF THE PLAYER'S BUTTONS. All thirty-four of its weights are written by the ` +
    `\`doAction\` wrapper, so a party could only ever remember something a human pressed, and NOTHING THAT ` +
    `HAPPENS IN THE ORDINARY COURSE OF GOVERNING was remembered by anybody -- a statute carried away from a ` +
    `party's own table, a bill of theirs voted down, an office lost, a demand refused, a freeze-out at the ` +
    `formation. Compounded by \`attack.can\`, which forbids the government from attacking: the government ` +
    `remembered every attacker and nobody accumulated a grudge against IT, 394 of 3,729 ledger entries ` +
    `· \`V21_POLITICS\` is the other half, ${polit.cover.declared} kinds COVERED IN BOTH DIRECTIONS AND ` +
    `BEHAVIOURALLY: every one is raised by the republic in the driven leg (${polit.driven.unraised.length} ` +
    `never raised, ${polit.driven.undeclared.length} raised without a weight), which is the guard S16e's ` +
    `\`radicalise\` needed. The first version of this arm read the CALLERS' SOURCE for each kind's name and ` +
    `reported three of six missing, because \`enactBill\` and \`runElection\` are reassigned in later ` +
    `chunks and \`String()\` returns the wrapper -- "a reassignment is not a wrapper", arriving in the probe ` +
    `rather than the game · THE GOVERNMENT IS BLAMED AND ITS PARTNERS TAKE A SHARE (${polit.blame.onGov} against ` +
    `${polit.blame.onPartner}, and ${polit.blame.onOutsider} for a party in opposition), because sitting in ` +
    `a cabinet that did the thing is not the same as opposing it and not the same as having done it · THE ` +
    `WEIGHTS ARE SET AGAINST THE RATE EACH CHANNEL FIRES AT, not by eye, and the first draft proves why: ` +
    `using \`V17_MEMORY\`'s button magnitudes -- a player presses \`poach\` when they choose to and the ` +
    `statute book moves three times a session on its own -- took the grudge against a government to a 90th ` +
    `percentile of 61.7 with the clamp reached, acceptance at the formation table from 71.7% to 25.8%, and ` +
    `110 of 360 elections to a caretaker. It now reads p50 ${polit.driven.p50}, p90 ${polit.driven.p90}, ` +
    `p99 ${polit.driven.p99}, with ${polit.driven.holding} of party-government pairs holding anything at all ` +
    `· \`oust\` ASKS ONE QUESTION AND IT IS ABOUT THE GOVERNMENT: its three predicates disagreed, so the aim ` +
    `was adopted about a party already in opposition -- which it was on 808 of the 880 boards that passed ` +
    `\`fits\` -- and \`v19AdoptGoal\` drops a goal already done. Hating an outsider now scores ` +
    `${polit.oust.fitsOnOutsider} and hating the government ${polit.oust.fitsOnGov}, aimed at ` +
    `${polit.oust.target}; driven, it is adopted ${polit.driven.oustAdopted} times and REACHED ` +
    `${polit.driven.oustDone}, against 0 in 720 sessions · THE IGNORED LETTER IS RE-DATED: \`v19React\` runs ` +
    `in \`tickTurn\`, \`expireInbox\` later in \`politicsTick\`, and \`S.turn += 1\` after both, so the stamp ` +
    `sat permanently one session behind the only reader and 63% of every grievance against the player ` +
    `produced ZERO reactions (${polit.driven.reactions} now). Silence is worth ${polit.letter.weight} where ` +
    `it was 14 against a median deliberate provocation of 13.4 -- it should cost more than declining to ` +
    `their face and less than an attack · AND THE FORMATION'S BRANCHES OPEN AS A CONSEQUENCE, which is a ` +
    `correction to this programme's own plan: they were not gated by \`V17_FORM_MAX\` but by nobody ever ` +
    `REFUSING, and nobody refused because nobody held anything against anybody. ` +
    `${JSON.stringify(polit.driven.how)} across ${polit.driven.forms} formations, caretaker share ` +
    `${polit.driven.caretakerShare} · the floor is untouched (${polit.floor.atInstinct} at \`instinct\`) and ` +
    `the channel is silent under \`V19_SIMULATING\` (${polit.floor.inSim}), or every card the chooser ` +
    `rehearses would leave a grievance behind`);

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
