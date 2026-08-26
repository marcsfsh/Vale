/* Emit EVERY ladder in the book, chunked, for an exhaustive blind read.
 *
 * WHY THIS EXISTS. Every S12 ordering figure came from a 40-ladder sample, and
 * the repair pass fixed exactly the ladders that sample failed, then re-measured
 * the same forty. That scored the test set: 95.2 per cent inside the repaired
 * sample against 66.7 on ladders never measured. Roughly 500 of 582 ladders have
 * never been read by anyone. This emits all of them, in chunks a reader can hold,
 * so the audit is exhaustive rather than sampled.
 *
 *   node sweep.js <book...>            writes sweep-NN.md + sweep-key.json
 *   CHUNK=60 SEED=... to vary
 */
const fs = require('fs'), path = require('path'), D = process.env.RUNGS_OUT || path.join(__dirname, '..', 'out', 'rungs');
const books = process.argv.slice(2);
if (!books.length) { console.error('usage: sweep.js <book> [book...]'); process.exit(1); }
const CHUNK = Number(process.env.CHUNK || 60);
const TAG = process.env.TAG || 'sweep';
let s = Number(process.env.SEED || 20260826) >>> 0;
const rnd = () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296;
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const rows = [];
books.forEach(b => {
  const br = JSON.parse(fs.readFileSync(path.join(D, 'briefs', b + '.json'), 'utf8'));
  const dr = JSON.parse(fs.readFileSync(path.join(D, 'drafts', b + '.json'), 'utf8'));
  br.statutes.forEach(st => {
    if (!dr[st.id]) return;
    rows.push({ id: st.id, name: st.name, book: br.category, rungs: dr[st.id].rungs, tiers: br.rungNames });
  });
});
if (!rows.length) { console.error('no drafted statutes'); process.exit(1); }

const key = [];
let n = 0, chunk = 0, lines = null;
const open = () => {
  chunk++;
  lines = ['# Task: put each ladder back in order (part ' + chunk + ')\n',
    'Each item is one statute. Its four ladder steps are given as A, B, C, D in scrambled order. The four step names, weakest to strongest, are given too. Assign each step name the letter whose text belongs to it.\n',
    'Answer with a JSON array, one object per item, using the item numbers exactly as printed: [{"n":1,"order":["C","A","D","B"]}, ...] where order[0] is the letter for step one and order[3] the letter for step four. Nothing else.\n'];
};
const close = () => {
  fs.writeFileSync(path.join(D, TAG + '-' + String(chunk).padStart(2, '0') + '.md'), lines.join(''));
};
open();
shuf(rows).forEach(r => {
  if (n && n % CHUNK === 0) { close(); open(); }
  n++;
  const order = shuf([0, 1, 2, 3]);
  const items = order.map((o, i) => ({ label: 'ABCD'[i], text: r.rungs[o] }));
  key.push({ n: n, id: r.id, book: r.book, chunk: chunk,
    answer: order.map((o, i) => ({ rung: o + 1, label: 'ABCD'[i] })).sort((x, y) => x.rung - y.rung).map(x => x.label) });
  lines.push('\n## ' + n + '  ' + r.name + '  (book: ' + r.book + ')\n',
    'Steps weakest to strongest: ' + r.tiers.join(' / ') + '\n');
  items.forEach(it => lines.push(it.label + '. ' + it.text + '\n'));
});
close();
fs.writeFileSync(path.join(D, TAG + '-key.json'), JSON.stringify(key, null, 1));
console.log(TAG + ': ' + n + ' ladders across ' + chunk + ' chunk files of up to ' + CHUNK);
