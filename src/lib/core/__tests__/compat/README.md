# Compatibility check: same file, same seed, same exam

`compat.test.ts` checks that every file still gives the exams 1.8.4 gave for the same seed: the
same versions, answers, mapping files and documents. Exams printed by releases before 1.8 are not
made again (they shuffled or read tags differently, and a file does not say which release printed
it); files made for them are here to show that they are still read as 1.8.4 read them.

## What it compares

The fixtures (`../fixtures/compat/`) are one exam of every kind, in two ages:

| File | Made for |
|---|---|
| `old.tex`, `old.csv`, `old-xlsx.json`, `old-session.json` | an older Examazej (no `app_version`; only the tags 1.7 knew) |
| `old-layouts.tex` | an older Examazej, with tags on the line of `\item` or `%{#q}`, two on a line, after an open-ended question, with a comment, with a small option letter |
| `new.tex`, `new.csv`, `new-xlsx.json`, `new-session.json` | Examazej 1.8.4 (every tag) |

`*-xlsx.json` holds the sheets of an `.xlsx` file; the test writes the workbook with ExcelJS.
Every fixture sets `examdate` and `term`: both default to today's, which would make the recorded
documents depend on the day (a test checks it). `old-session.json` was written by 1.7.0's code
from `old.tex`, and `new-session.json` by 1.8.4's from `new.tex`, the way each release's Exam
Package writes `_session.json`.

`pipeline.ts` reads a file as the Start page does, sets groups and seed as Details does, and
generates as Results does, in four group settings (the file's own, then three that move the
`(n)` and `[n]` groups, the last with no `(n)` group) and three seeds. For each run it records
the version mappings (readable), the answers, and SHA-256 hashes of `_mapping.csv`,
`_options_mapping.csv`, the exam document and `_template.tex`. The documents are compared with
the app version taken out, and with the red warning box 1.8 put on the answer key of an old file
taken out (1.9 no longer prints it; the key is otherwise the same).

`golden-1.8.4.json` holds every fixture, recorded by 1.8.4. 1.9 and later must match it exactly.

## Recording the expected output again

Only when a fixture or `pipeline.ts` changes. Never record it with the current code: the point is
to compare with what was released.

```bash
git worktree add --detach ../wt-184 v1.8.4
# In the worktree: link node_modules to this checkout's, copy pipeline.ts and record.ts into
# src/lib/core/__tests__/compat/, and add record.test.ts:
#   import { it } from "vitest";
#   import { recordRelease } from "./record";
#   it("records", async () => { await recordRelease("1.8.4"); }, 300000);
COMPAT_FIXTURES=<this checkout>/src/lib/core/__tests__/fixtures/compat npx vitest run src/lib/core/__tests__/compat/record.test.ts
# Remove the node_modules LINK first (Windows: `rmdir ..\wt-184\node_modules`, without /s),
# or `git worktree remove` deletes this checkout's packages through it.
git worktree remove ../wt-184
```
