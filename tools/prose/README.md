# The prose measurement tools

These produced every prose figure quoted in the S12 and S13 pull requests. They
lived in `tools/out/rungs/` while the work was running, which is gitignored, so
the numbers in those PR bodies came from tooling nobody could rerun. They are
committed here for that reason.

They read and write the working directory `tools/out/rungs/` (override with
`RUNGS_OUT`), which holds the briefs, drafts and answer files. That directory
stays gitignored: it is scratch, and the authored prose itself lives in
`vale.html`.

| tool | what it does |
|---|---|
| `sweep.js` | emits **every** ladder in the book, shuffled and chunked, plus a separate answer key. The exhaustive version of `stage3d.js`. |
| `sweepscore.js` | merges a reader's part files, joins on the key, reports per reader and per book, writes the ladders every reader failed |
| `stage3d.js` | builds a **sample** of ordering and attribution tasks from the drafts, before anything is spliced into `vale.html` |
| `score.js` | scores one sampled ordering or attribution run |
| `postrepair.js` | after a repair pass: every reported passage gone, mechanics clean, no duplicate sentences |
| `snapdiff.js` | diffs a draft against its pre-repair snapshot, so "only these fields changed" is a measurement rather than an agent's report |

## The one rule these tools exist to enforce

**Never re-measure the sample you repaired against.** S12 sampled forty ladders,
repaired the ones that failed, and re-scored the same forty. Measured afterwards
on one batch, one reader, one run: **95.2 per cent exact inside the repaired
sample against 66.7 on ladders never measured**. The published post-repair
figures were test-set scores by that much.

Either score a repair on ladders held out from the run that selected its targets,
or make the selection set the whole population with `sweep.js` and label the
result in-sample. There is no third option that yields an honest number.
