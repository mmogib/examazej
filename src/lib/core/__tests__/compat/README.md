# Compatibility check: same file, same seed, same exam

`compat.test.ts` checks that files made before v1.8 and files made by 1.8.4 still give the same
exams for the same seed: the same versions, answers and mapping files.

## What it compares

The fixtures (`../fixtures/compat/`) are one exam of every kind, in two ages:

| File | Made for |
|---|---|
| `old.tex`, `old.csv`, `old-xlsx.json`, `old-session.json` | Examazej 1.7 (no `app_version`; only the tags 1.7 knew) |
| `old-layouts.tex` | Examazej 1.7, with tags that 1.7 read otherwise than they are written (see below) |
| `new.tex`, `new.csv`, `new-xlsx.json`, `new-session.json` | Examazej 1.8.4 (every tag) |

`*-xlsx.json` holds the sheets of an `.xlsx` file; the test writes the workbook with ExcelJS.
Every fixture sets `examdate` and `term`: both default to today's, which would make the recorded
documents depend on the day (a test checks it).
`old-session.json` was written by 1.7.0's code from `old.tex`, and `new-session.json` by 1.8.4's
from `new.tex`, the way each release's Exam Package writes `_session.json`.

`pipeline.ts` reads a file as the Start page does, sets groups and seed as Details does, and
generates as Results does, in four group settings (the file's own, then three that move the
`(n)` and `[n]` groups, the last with no `(n)` group) and three seeds. For each run it records
the version mappings (readable), the answers, and SHA-256 hashes of `_mapping.csv`,
`_options_mapping.csv`, the exam document and `_template.tex` (the documents with the app version
and the old-file warning box taken out, since their wording is allowed to change).

- `golden-1.8.4.json`: every fixture, recorded by 1.8.4. 1.9 and later must match it exactly.
- `golden-1.7.0.json`: the old fixtures, recorded by 1.7.0. Once every "Match my old exams"
  fix the Questions page offers is pressed, the exam must match it exactly (with the answers
  1.7 took, where it did not read the tag that gives the answer; with the file's answers only
  those answer letters differ); a run with no old-file warning must match it without any fix;
  and a run differs from it only when there is a warning.

## Tags that 1.7 read otherwise

1.6-1.7 read a tag only when it stood alone on its line with a capital option letter, and gave a
tag written after an open-ended question to that question. 1.8 reads every tag where it is
written. For a file made before v1.8, the LaTeX reader also runs a frozen copy of the 1.7 reader
(`src/lib/core/reader-v1-7.ts`, checked against the real 1.7.0 output in
`../fixtures/reading-v1-7/`) and marks each question it read differently (`legacyRead`);
`old-layouts.tex` has one of each layout. `old.tex` keeps to the layouts both read alike.

## Recording the expected output again

Only when a fixture or `pipeline.ts` changes. Never record it with the current code: the point is
to compare with what was released.

```bash
git worktree add --detach ../wt-170 v1.7.0
git worktree add --detach ../wt-184 v1.8.4
# In each worktree: link node_modules to this checkout's, copy pipeline.ts and record.ts into
# src/lib/core/__tests__/compat/, and add record.test.ts:
#   import { it } from "vitest";
#   import { recordRelease } from "./record";
#   it("records", async () => { await recordRelease("1.7.0"); }, 300000);   // "1.8.4" in wt-184
# Then, 1.7.0 first (it writes old-session.json, which 1.8.4 reads):
COMPAT_FIXTURES=<this checkout>/src/lib/core/__tests__/fixtures/compat npx vitest run src/lib/core/__tests__/compat/record.test.ts
# Remove the node_modules LINKS first (Windows: `rmdir ..\wt-170\node_modules`, without /s),
# or `git worktree remove` deletes this checkout's packages through them.
git worktree remove ../wt-170 && git worktree remove ../wt-184
```

The reading check (`../fixtures/reading-v1-7/read-by-1.7.0.json`) is recorded the same way from
the 1.7.0 checkout, with a test that writes, for every `.tex` there, each question's option
count, `fixed`, `fixedOptions`, `keepOnSeparatePage` and answer as `parseLatexTemplate` read it
(null when it refused the file).
