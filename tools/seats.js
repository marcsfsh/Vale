#!/usr/bin/env node
'use strict';
/*
 * Measure the seat palette against the chamber it sits in.
 *
 *   node tools/seats.js
 *
 * The rule the user set is narrow and both halves matter: the parties' colours
 * must stay recognisably themselves ("the exact values can shift as needed so
 * long as they remain close to the original"), and they must stop butting up
 * against the background. So every candidate is judged twice — contrast against
 * the baize, and CIEDE2000 distance from the colour it replaces. A lift that
 * wins on contrast by wandering off its hue is not a lift, it is a different
 * party; that is how an earlier pass turned Labor's red into pink.
 *
 * Prints both numbers for every party, and flags anything that moved far.
 */

const BAIZE = '#1A211D';        // --baize, the chamber ground
const INK = '#EAE7DC';          // --ivory, for the rim

// the palette as it stands in vale.html, and what it was before any lift
const ORIGINAL = {
  RSF: '#9D0000', LP: '#FF0000', SD: '#FFA097', FP: '#FFFB00',
  CUP: '#03F2FF', TVC: '#00ABEF', PNL: '#0000BC',
};
const CURRENT = process.argv[2] ? JSON.parse(process.argv[2]) : {
  RSF: '#C70000', LP: '#FF0000', SD: '#FFA097', FP: '#FFFB00',
  CUP: '#03F2FF', TVC: '#00ABEF', PNL: '#1551FF',
};

/* ---- colour maths ---- */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function luminance(h) {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function lab(h) {
  const [r, g, b] = hex(h).map(lin);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
// CIEDE2000
function deltaE(h1, h2) {
  const [L1, a1, b1] = lab(h1), [L2, a2, b2] = lab(h2);
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
  const A1 = (1 + G) * a1, A2 = (1 + G) * a2;
  const Cp1 = Math.hypot(A1, b1), Cp2 = Math.hypot(A2, b2);
  const deg = r => (r * 180) / Math.PI, rad = d => (d * Math.PI) / 180;
  const h1p = Cp1 === 0 ? 0 : (deg(Math.atan2(b1, A1)) + 360) % 360;
  const h2p = Cp2 === 0 ? 0 : (deg(Math.atan2(b2, A2)) + 360) % 360;
  const dLp = L2 - L1, dCp = Cp2 - Cp1;
  let dhp = 0;
  if (Cp1 * Cp2 !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(rad(dhp) / 2);
  const Lbp = (L1 + L2) / 2, Cbp = (Cp1 + Cp2) / 2;
  let hbp = h1p + h2p;
  if (Cp1 * Cp2 !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbp += (hbp < 360 ? 360 : -360);
    hbp /= 2;
  }
  const T = 1 - 0.17 * Math.cos(rad(hbp - 30)) + 0.24 * Math.cos(rad(2 * hbp)) +
    0.32 * Math.cos(rad(3 * hbp + 6)) - 0.20 * Math.cos(rad(4 * hbp - 63));
  const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7))) *
    Math.sin(rad(60 * Math.exp(-Math.pow((hbp - 275) / 25, 2))));
  return Math.sqrt(Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) +
    Rt * (dCp / Sc) * (dHp / Sh));
}
function hue(h) { const [, a, b] = lab(h); return (((Math.atan2(b, a) * 180) / Math.PI) + 360) % 360; }

/* ---- report ---- */
console.log('Seat colours against the baize ' + BAIZE + '\n');
console.log('party  colour    was       contrast  was    dhue   dE2000  verdict');
let worst = Infinity, moved = [];
for (const k of Object.keys(ORIGINAL)) {
  const now = CURRENT[k], was = ORIGINAL[k];
  const c = contrast(now, BAIZE), c0 = contrast(was, BAIZE);
  const dE = deltaE(was, now);
  let dh = Math.abs(hue(now) - hue(was)); if (dh > 180) dh = 360 - dh;
  worst = Math.min(worst, c);
  if (dE > 1) moved.push(k);
  const verdict = dE < 1 ? 'unchanged'
    : dh > 12 ? 'HUE MOVED — reject'
      : c >= 3 ? 'lifted, hue held' : 'lifted, still low';
  console.log(
    k.padEnd(7) + now.padEnd(10) + was.padEnd(10) +
    c.toFixed(2).padEnd(10) + c0.toFixed(2).padEnd(7) +
    (dh.toFixed(1) + '°').padEnd(7) + dE.toFixed(1).padEnd(8) + verdict);
}
console.log('\nlowest contrast on the floor: ' + worst.toFixed(2) +
  '   (a seat is a 3px dot, not text — this is a separation figure, not a WCAG pass)');
console.log('changed: ' + (moved.length ? moved.join(', ') : 'none'));

/* Three different problems, three different mechanisms — the reason the rim is
   the ground colour and not the ivory one the v7 hack used. An ivory rim is
   worth 4.95 against RSF and 1.12 against FP: on the bright parties it is
   invisible, so as a general rule it does nothing. What every seat actually
   needs is separation from the seat NEXT to it, including one of its own
   colour, and a rim of the ground gives that uniformly. */
console.log('\nrim options, contrast against each fill');
console.log('party  ground ' + BAIZE + '   ivory ' + INK + '  (the v7 hack used ivory, on two parties only)');
for (const k of Object.keys(CURRENT)) {
  const g = contrast(CURRENT[k], BAIZE), iv = contrast(CURRENT[k], INK);
  console.log('  ' + k.padEnd(6) + g.toFixed(2).padEnd(18) + iv.toFixed(2).padEnd(9) +
    (iv < 1.6 ? 'ivory rim invisible here' : ''));
}

// adjacent blocs must not merge into each other
const order = ['RSF', 'LP', 'SD', 'FP', 'CUP', 'TVC', 'PNL'];
console.log('\nneighbouring blocs (they sit side by side — dE below ~15 needs the aisle)');
for (let i = 0; i < order.length - 1; i++) {
  const d = deltaE(CURRENT[order[i]], CURRENT[order[i + 1]]);
  console.log('  ' + (order[i] + '/' + order[i + 1]).padEnd(10) + d.toFixed(1) +
    (d < 15 ? '  <- close; the aisle is doing the work here' : ''));
}

/* ---- colour vision deficiency ----
 * Seven series told apart by hue is the hardest possible case for a red-green
 * deficiency, and around one man in twelve has one. The chamber and the charts
 * both give every bloc a name as well as a colour, which is the real mitigation
 * — but that only decides how much the colours have to carry, it does not tell
 * you which pairs collapse. This does. Viénot, Brettel & Mollon (1999): to LMS,
 * project onto the dichromat plane, back again.
 */
function simulate(hexColor, kind) {
  const [r, g, b] = hex(hexColor).map(lin);
  let L = 17.8824 * r + 43.5161 * g + 4.11935 * b;
  let M = 3.45565 * r + 27.1554 * g + 3.86714 * b;
  let S = 0.0299566 * r + 0.184309 * g + 1.46709 * b;
  if (kind === 'protanopia') L = 2.02344 * M - 2.52581 * S;
  else if (kind === 'deuteranopia') M = 0.494207 * L + 1.24827 * S;
  else S = -0.395913 * L + 0.801109 * M;
  const out = [
    0.080944 * L - 0.130504 * M + 0.116721 * S,
    -0.0102485 * L + 0.0540194 * M - 0.113615 * S,
    -0.000365294 * L - 0.00412163 * M + 0.693513 * S,
  ].map(v => {
    const c = Math.min(1, Math.max(0, v));
    const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return ('0' + Math.round(s * 255).toString(16)).slice(-2);
  });
  return '#' + out.join('').toUpperCase();
}

console.log('\nUnder colour vision deficiency — the closest pair, and how close');
console.log('(dE under ~10 means those two parties are effectively one colour;');
console.log(' both the chamber and the charts also label every series by name)');
for (const kind of ['protanopia', 'deuteranopia', 'tritanopia']) {
  const sim = {};
  for (const k of order) sim[k] = simulate(CURRENT[k], kind);
  const pairs = [];
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      pairs.push({ a: order[i], b: order[j], d: deltaE(sim[order[i]], sim[order[j]]),
        was: deltaE(CURRENT[order[i]], CURRENT[order[j]]) });
    }
  }
  pairs.sort((x, y) => x.d - y.d);
  console.log('\n  ' + kind + '  (' + order.map(k => k + ' ' + sim[k]).join('  ') + ')');
  for (const p of pairs.slice(0, 3)) {
    console.log('    ' + (p.a + '/' + p.b).padEnd(10) + 'dE ' + p.d.toFixed(1).padStart(5) +
      '   (' + p.was.toFixed(1) + ' in normal vision)' +
      (p.d < 10 ? '   <- collapses' : ''));
  }
}
