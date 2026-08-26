/* Stage 3 sample builder, DRAFT mode.
 *
 * WHY THIS EXISTS. The booted-game builder can only measure prose that has
 * already been spliced into vale.html. PR 3 shipped a batch whose ladders two
 * blind readers could not order, because the only ordering check that ran
 * before --apply was a per-book verifier holding the answer key: it flagged six
 * unorderable ladders where blind readers mis-ordered twenty-four. This reads
 * the drafts instead, so the measurement runs BEFORE anything reaches the file.
 *
 *   node stage3d.js <book> [book...]        writes ordering + attribution sets
 *
 * Everything needed is already on disk: briefs carry rungNames and each
 * statute's name/id/category, drafts carry desc and rungs.
 */
const fs = require('fs'), path = require('path'), D = process.env.RUNGS_OUT || path.join(__dirname, '..', 'out', 'rungs');
const books = process.argv.slice(2);
if (!books.length) { console.error('usage: stage3d.js <book> [book...]'); process.exit(1); }
const TAG = process.env.TAG || 'draft';
let s = Number(process.env.SEED || 20260825) >>> 0;
const rnd = () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)];
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const game = [], byCat = {};
books.forEach(b => {
  const br = JSON.parse(fs.readFileSync(path.join(D, 'briefs', b + '.json'), 'utf8'));
  const dr = JSON.parse(fs.readFileSync(path.join(D, 'drafts', b + '.json'), 'utf8'));
  br.statutes.forEach(st => {
    if (!dr[st.id]) return;
    const row = { id: st.id, name: st.name, cat: br.category, rungs: dr[st.id].rungs, tiers: br.rungNames };
    game.push(row); (byCat[row.cat] = byCat[row.cat] || []).push(row);
  });
});
if (!game.length) { console.error('no drafted statutes found'); process.exit(1); }

/* attribution: one rung description against eight names from its own book */
const flat = [];
game.forEach(g => g.rungs.forEach((t, i) => flat.push({ id: g.id, cat: g.cat, lv: i + 1, text: t })));
const A = [], usedA = new Set();
const wantA = Math.min(Number(process.env.NA || 60), flat.length);
while (A.length < wantA && usedA.size < flat.length) {
  const r = pick(flat), k = r.id + '#' + r.lv;
  if (usedA.has(k)) continue;
  usedA.add(k);
  const pool = byCat[r.cat].filter(x => x.id !== r.id);
  const truth = game.find(x => x.id === r.id).name;
  A.push({ n: A.length + 1, text: r.text, book: r.cat, id: r.id, lv: r.lv, answer: truth,
    options: shuf(shuf(pool).slice(0, 7).map(x => x.name).concat([truth])) });
}

/* ordering: four descriptions shuffled against the four rung names */
const B = [], usedB = new Set();
const wantB = Math.min(Number(process.env.NB || 40), game.length);
while (B.length < wantB && usedB.size < game.length) {
  const g = pick(game);
  if (usedB.has(g.id)) continue;
  usedB.add(g.id);
  const order = shuf([0, 1, 2, 3]);
  B.push({ n: B.length + 1, id: g.id, name: g.name, book: g.cat, tiers: g.tiers,
    items: order.map((o, i) => ({ label: 'ABCD'[i], text: g.rungs[o] })),
    answer: order.map((o, i) => ({ rung: o + 1, label: 'ABCD'[i] })).sort((x, y) => x.rung - y.rung).map(x => x.label) });
}

const mdA = ['# Task A: name the statute\n',
  'For each item you get one sentence-group describing what a law does at one step of its ladder, and eight statute names from the same book. Exactly one of them is the law being described. Pick it.\n',
  'Answer with a JSON array of ' + A.length + ' objects: [{"n":1,"pick":"<the exact option text>"}, ...]. Nothing else.\n'];
A.forEach(a => { mdA.push('\n## ' + a.n + '  (book: ' + a.book + ')\n', '> ' + a.text + '\n', 'Options: ' + a.options.join(' | ') + '\n'); });

const mdB = ['# Task B: put the ladder back in order\n',
  'Each item is one statute. Its four ladder steps are given as A, B, C, D in scrambled order. The four step names, weakest to strongest, are given too. Assign each step name the letter whose text belongs to it.\n',
  'Answer with a JSON array of ' + B.length + ' objects: [{"n":1,"order":["C","A","D","B"]}, ...] where order[0] is the letter for step one, order[3] the letter for step four. Nothing else.\n'];
B.forEach(b => { mdB.push('\n## ' + b.n + '  ' + b.name + '  (book: ' + b.book + ')\n',
  'Steps weakest to strongest: ' + b.tiers.join(' / ') + '\n');
  b.items.forEach(it => mdB.push(it.label + '. ' + it.text + '\n')); });

fs.writeFileSync(path.join(D, TAG + '-a.json'), JSON.stringify(A, null, 1));
fs.writeFileSync(path.join(D, TAG + '-b.json'), JSON.stringify(B, null, 1));
fs.writeFileSync(path.join(D, TAG + '-a.md'), mdA.join(''));
fs.writeFileSync(path.join(D, TAG + '-b.md'), mdB.join(''));
console.log(TAG + ': ' + A.length + ' attributions and ' + B.length + ' ladders over ' + game.length + ' drafted statutes (' + books.join(', ') + ')');
