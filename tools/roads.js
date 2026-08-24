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

let fail = 0;
const say = (ok, label, detail) => { if (!ok) fail++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(34) + detail); };

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => { window.confirm = () => true; });
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

    /* One increment a session, from one place. */
    const before = {}; REGIONS.forEach(r => before[r.id] = S.v6.governors[r.id].age);
    v6GovernorsTick(S); ageFigures(S);
    out.ageSteps = REGIONS.map(r => S.v6.governors[r.id].age - before[r.id])
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

    /* Very easy: six works, and the capital numbers that make six affordable.
       Every other tier untouched. */
    out.workMax = ['easy', 'gentle', 'normal', 'hard', 'brutal'].map(k => k + ':' + v8WorkMax({ diff: k })).join(' ');
    out.easyCap = DIFFS.easy.capital + '/' + DIFFS.easy.capMult + '/' + DIFFS.easy.capFlat + '/' + DIFFS.easy.capCap;
    out.othersUnmoved = DIFFS.normal.capital === 18 && DIFFS.normal.capCap === 70 &&
      DIFFS.gentle.capital === 40 && DIFFS.brutal.capital === 8;

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
  say(republic.ageSteps.length === 1 && republic.ageSteps[0] === 1, 'one year a session, once',
    'governor age advanced by ' + republic.ageSteps.join('/') + ' over a session that ran both the governors tick and ageFigures');
  say(republic.ministersSeated > 0 && republic.ministersAged === republic.ministersSeated &&
    republic.rosterKinds.join(',') === 'exec,governor,leader,minister' && republic.vacatedOnDeath,
    'the whole cast ages', `${republic.ministersAged}/${republic.ministersSeated} ministers carry an age · roster: ` +
      `${republic.rosterKinds.join(', ')} · a minister's death leaves the post vacant: ${republic.vacatedOnDeath}`);
  say(republic.dupWorkNames.length === 0, 'no two works share a name',
    republic.dupWorkNames.length ? republic.dupWorkNames.join('; ') : republic.workCount + ' grand works, every name its own');
  say(republic.castDupes === 0, 'no two officials share a name',
    republic.castDupes ? republic.castDupes + ' duplicate(s) among ' + republic.castSize
      : republic.castSize + ' in public life, no name twice, through ' + republic.castChurn + ' replacements');
  say(republic.workMax === 'easy:6 gentle:3 normal:2 hard:2 brutal:2' && republic.othersUnmoved,
    'very easy builds six', republic.workMax + ' · easy capital/mult/flat/cap ' + republic.easyCap +
      ' · other tiers unmoved: ' + republic.othersUnmoved);
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
    const o = V10_ORDERS.filter(x => !x.target && !x.needs && Object.keys(x.ind || {}).length)[0];
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
    const o2 = V10_ORDERS.filter(x => !x.target && !x.needs && x.id !== o.id)[0];
    v10IssueOrder(o2.id, null);
    out.issued = v10OrderCount(S) === 1;
    S.exec[o2.dept] = PARTIES.filter(x => x.id !== me)[0].id;
    v10OrdersTick(S);
    out.lapsed = out.issued && v10OrderCount(S) === 0;
    out.lapseTold = (S.log || []).some(l => /lapsed: the authority/.test(l.text));
    S.exec[o2.dept] = me;

    /* TARGET: the same instrument stands separately in two regions */
    const rt = V10_ORDERS.filter(x => x.target === 'region' && !x.needs)[0];
    if (rt) { v10IssueOrder(rt.id, 'somnium'); v10IssueOrder(rt.id, 'thaxia'); out.twoTargets = v10OrderCount(S) === 2; }
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
  say(book.twoTargets === true, 'a targeted order is per target',
    'the same instrument stands separately in two regions: ' + book.twoTargets);

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
    const ord = V10_ORDERS.filter(o => o.needs)[0];
    let blocked = true;
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
    return { blocked, lapsed };
  });
  say(needs.blocked, 'an order cannot outrun the book', `an order with a statute prerequisite is refused without it and opens with it: ${needs.blocked}`);
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

  await browser.close();
  console.log(fail ? '\n' + fail + ' CHECK(S) FAILED' : '\nROADS OK');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + e.message); process.exit(1); });
