# Pre-Release Quality Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the actionable dependency, lint, type, and build-warning baseline, then require one verification command locally, in CI, and before `release.sh` mutates repository state.

**Architecture:** Keep remediation in separate commits on `new-feat`, then expose a cross-platform `npm run verify:release` orchestrator. Small Node runners handle the university system-CA requirement and warning-sensitive Vite builds; GitHub Actions and `release.sh` call the same command so checks cannot drift.

**Tech Stack:** Node.js 22, npm, React 18, TypeScript, ESLint 9, Vitest 4, Vite 6, vite-plugin-electron, GitHub Actions, Bash.

---

## File Map

- `package.json`, `package-lock.json` — dependency remediation and stable verification scripts.
- `src/components/ui/rich-text-editor.tsx` and a new test — Tiptap compatibility boundary.
- `src/lib/types.ts`, parsers, versioning, logger, preview, and tests — replace explicit `any` and repair type-check failures.
- `src/components/ui/*` variant/helper modules — remove React Refresh mixed-export warnings without disabling the rule.
- `src/pages/Details.tsx`, `src/lib/parsers/adapter.ts`, `tailwind.config.ts` — fix hook, regex, and CommonJS lint findings.
- `vite.config.ts` — deterministic vendor chunks and warning-free web/desktop builds.
- `scripts/npm-audit.mjs`, `scripts/run-clean-build.mjs`, `scripts/verify-release.mjs` — reusable release checks.
- `scripts/__tests__/release-quality.test.mjs` — runner, ordering, fail-fast, and release-hook tests.
- `.github/workflows/quality.yml`, `scripts/release.sh` — CI and local enforcement before release mutation.
- `CLAUDE.md`, `README.md`, `CHANGELOG.md` — accurate operational documentation.

## Task 1: Apply Non-Breaking Security Updates

**Files:**

- Modify: `package-lock.json`
- Modify: `package.json` only when npm normalizes an existing direct dependency range; reject any new major range

- [ ] **Step 1: Record the audit baseline**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm audit --audit-level=low
npm audit --omit=dev --audit-level=low
```

Expected: full tree reports 40 advisories (9 high); production-only reports 34 advisories (5 high).

- [ ] **Step 2: Apply only non-forced remediation**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm audit fix
```

Do not run `npm audit fix --force`. Inspect `git diff -- package.json package-lock.json`; no major direct range may change.

- [ ] **Step 3: Verify and commit**

```powershell
npm test -- --run
npm run build
$env:NODE_OPTIONS='--use-system-ca'
npm audit --audit-level=low
git add package.json package-lock.json
git commit -m "chore: apply non-breaking dependency security updates"
```

Expected: tests/build pass; only advisories without a non-forced path may remain.

## Task 2: Upgrade Tiptap as One Compatibility Unit

**Files:**

- Create: `src/components/ui/__tests__/rich-text-editor.test.tsx`
- Modify: `src/components/ui/rich-text-editor.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add a real-DOM characterization test**

Use React 18 `createRoot`/`act` and jsdom, matching the pledge UI tests. Render:

```tsx
<RichTextEditor value="<p>Initial text</p>" onChange={onChange} />
```

Assert `.ProseMirror` contains `Initial text`; assert toolbar buttons titled Bold, Italic, Underline, Bullet List, Ordered List, Align Left, Align Center, and Align Right exist. Rerender with `<p>Updated text</p>` and assert the editor synchronizes to `Updated text`.

- [ ] **Step 2: Run the characterization test before upgrading**

```bash
npx vitest run src/components/ui/__tests__/rich-text-editor.test.tsx
```

Expected: PASS on Tiptap 2; this guards existing behavior across the migration.

- [ ] **Step 3: Upgrade every direct Tiptap package together**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm install --save-exact @tiptap/extension-list-item@3.31.3 @tiptap/extension-text-align@3.31.3 @tiptap/extension-underline@3.31.3 @tiptap/react@3.31.3 @tiptap/starter-kit@3.31.3
```

If Tiptap 3 reports a duplicate extension now supplied by StarterKit, disable that StarterKit member or remove the duplicate direct configuration while preserving toolbar commands. Do not leave mixed Tiptap major versions.

- [ ] **Step 4: Verify and commit**

```powershell
npx vitest run src/components/ui/__tests__/rich-text-editor.test.tsx
npm test -- --run
npm run build
$env:NODE_OPTIONS='--use-system-ca'
npm audit --audit-level=low
npm ls @tiptap/core @tiptap/react @tiptap/starter-kit
git add package.json package-lock.json src/components/ui/rich-text-editor.tsx src/components/ui/__tests__/rich-text-editor.test.tsx
git commit -m "chore: upgrade Tiptap security baseline"
```

Expected: all checks pass, audit reports zero vulnerabilities, and Tiptap resolves only to 3.31.x.

## Task 3: Eliminate TypeScript and Explicit-Any Errors

**Files:**

- Modify: `src/lib/types.ts`
- Modify: `src/lib/core/latex.ts`
- Modify: `src/lib/utils/page-count-analyzer.ts`
- Modify: `src/lib/core/__tests__/latex.test.ts`
- Modify: `src/lib/core/parser.ts`
- Modify: `src/lib/parsers/csv-parser.ts`
- Modify: `src/lib/parsers/excel-parser.ts`
- Modify: `src/lib/core/versioning.ts`
- Modify: `src/lib/core/__tests__/versioning.test.ts`
- Modify: `src/components/ui/exam-preview-dialog.tsx`
- Modify: `src/lib/utils/logger.ts`

- [ ] **Step 1: Capture the current failures**

```bash
npx tsc -p tsconfig.app.json --noEmit --pretty false --incremental false
npx eslint src/lib src/components/ui/exam-preview-dialog.tsx
```

Expected: three TypeScript errors and the explicit-`any` errors.

- [ ] **Step 2: Repair shared domain types**

```ts
export interface ExamVersion extends ExamData {
  code?: string;
}

// Existing open legacy data has no known consumer shape.
kept_in_one_page: unknown[];
options_order: Record<string, unknown>;
```

Type each generated question in the failing LaTeX fixture as `Question`, or cast only `choices` to `Question["choices"]`, preserving `[QuestionChoice[], number, null]`.

- [ ] **Step 3: Replace runtime `any` with domain types**

```ts
// parser.ts
function createQuestionObject(...): Omit<Question, "group" | "order">;
const question: Omit<Question, "group" | "order"> = { ... };

// versioning.ts
let shuffledChoices: QuestionChoice[];

// exam-preview-dialog.tsx
const renderQuestion = (question: Question, index: number) => { ... };
choices.map((choice: QuestionChoice, choiceIndex: number) => { ... });

// logger.ts
private format(level: string, ...args: unknown[]) { ... }
debug(...args: unknown[]) { ... }
info(...args: unknown[]) { ... }
warn(...args: unknown[]) { ... }
error(...args: unknown[]) { ... }
table(data: unknown, columns?: string[]) { ... }

// excel-parser.ts
type WorksheetValue = ExcelJS.CellValue;
function worksheetToArray(...): WorksheetValue[][];
```

Remove unnecessary `(choice: any)` test annotations and let the typed tuple infer `QuestionChoice`.

- [ ] **Step 4: Replace parser assignment casts**

Use this local helper in the LaTeX, CSV, and Excel parsers after their existing key allowlists validate the key:

```ts
function assignSetting(
  settings: Partial<ExamSettings>,
  key: keyof ExamSettings,
  value: ExamSettings[keyof ExamSettings]
) {
  Object.assign(settings, { [key]: value });
}
```

Keep current validation messages and number/boolean/enum conversion unchanged.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc -p tsconfig.app.json --noEmit --pretty false --incremental false
npx eslint src/lib src/components/ui/exam-preview-dialog.tsx
npm test -- --run
git add src/lib src/components/ui/exam-preview-dialog.tsx
git commit -m "refactor: remove unsafe parser and exam types"
```

Expected: TypeScript exits 0 and no explicit-`any` diagnostics remain.

## Task 4: Eliminate Remaining ESLint Errors and Warnings

**Files:**

- Create: `src/components/ui/button-variants.ts`
- Create: `src/components/ui/toggle-variants.ts`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/toggle.tsx`
- Modify: all callers importing those variants
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/form.tsx`
- Modify: `src/components/ui/navigation-menu.tsx`
- Modify: `src/components/ui/sidebar.tsx`
- Modify: `src/components/ui/sonner.tsx`
- Modify: `src/components/ui/command.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/pages/Details.tsx`
- Modify: `src/lib/parsers/adapter.ts`
- Modify: `tailwind.config.ts`
- Modify: `eslint.config.js`

- [ ] **Step 1: Capture strict lint failure**

```bash
npx eslint . --max-warnings=0
```

Expected: nonzero. First extend generated-output ignores to `dist`, `dist-electron`, `release`, and `.worktrees` so previous builds cannot affect results.

- [ ] **Step 2: Fix empty interfaces and regexes**

```ts
type CommandDialogProps = DialogProps;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
```

Replace `/[\(\)\[\]]/g` with the equivalent lint-clean `/[()[\]]/g` in Details and the adapter.

- [ ] **Step 3: Fix the Details hook dependency**

```ts
const validateSettings = useCallback(() => {
  // existing validation body unchanged
}, [examData.exam.questions, groupPartition, seed, settings, versions]);

useEffect(() => {
  validateSettings();
}, [validateSettings]);
```

- [ ] **Step 4: Use the Tailwind plugin as ESM**

```ts
import tailwindcssAnimate from "tailwindcss-animate";
// ...
plugins: [tailwindcssAnimate],
```

- [ ] **Step 5: Resolve mixed component exports without suppressions**

Move `buttonVariants` and `toggleVariants` to the new `.ts` modules and update callers. Stop exporting file-local helpers with no external consumers (`badgeVariants`, `useFormField`, `navigationMenuTriggerStyle`, `useSidebar`). Stop re-exporting `toast` from `ui/sonner.tsx`; callers already import it from `sonner`.

Do not add ESLint-disable comments or lower rule severity.

- [ ] **Step 6: Verify and commit**

```bash
npx eslint . --max-warnings=0
npx tsc -p tsconfig.app.json --noEmit --pretty false --incremental false
npm test -- --run
git add eslint.config.js tailwind.config.ts src/components/ui src/pages/Details.tsx src/lib/parsers/adapter.ts
git commit -m "refactor: clear lint errors and warnings"
```

Expected: ESLint exits 0 with zero warnings.

## Task 5: Remove Current Web and Desktop Build Warnings

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Update compatible build metadata**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm install --save-dev vite-plugin-electron@1.1.2
npx update-browserslist-db@latest
```

- [ ] **Step 2: Split the renderer at dependency boundaries**

Merge this output function into the renderer's existing build configuration without overwriting Electron externals or entry filenames:

```ts
manualChunks(id: string) {
  if (!id.includes("node_modules")) return;
  if (id.includes("exceljs")) return "vendor-excel";
  if (id.includes("katex") || id.includes("react-katex")) return "vendor-math";
  if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-editor";
  if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
}
```

- [ ] **Step 3: Verify warning-free builds**

```bash
npm run build 2>&1 | tee web-build.log
npx vite build --mode desktop 2>&1 | tee desktop-build.log
```

Both commands must exit 0. Logs must not contain `Browserslist:`, `Some chunks are larger`, `Unknown input options`, or `Unknown output options`. Delete local logs after inspection.

If vite-plugin-electron 1.1.2 still emits invalid Rollup options under Vite 6, pin the newest Vite-6-compatible plugin release rather than suppressing warnings or upgrading Vite across a major boundary.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "build: remove production build warnings"
```

## Task 6: Add the Reusable Release Gate

**Files:**

- Create: `scripts/npm-audit.mjs`
- Create: `scripts/run-clean-build.mjs`
- Create: `scripts/verify-release.mjs`
- Create: `scripts/__tests__/release-quality.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing runner tests**

```js
expect(RELEASE_CHECKS.map((check) => check.script)).toEqual([
  "audit:security",
  "lint:strict",
  "typecheck",
  "test:run",
  "build:clean",
  "build:desktop:clean",
]);
```

Also assert fail-fast behavior, that the audit runner appends `--use-system-ca` without replacing existing `NODE_OPTIONS`, and that the clean-build runner returns nonzero on each forbidden warning class.

- [ ] **Step 2: Confirm RED**

```bash
npx vitest run scripts/__tests__/release-quality.test.mjs
```

Expected: FAIL because the runner modules do not exist.

- [ ] **Step 3: Implement safe runners**

Use `spawnSync` with platform-specific `npm`/`npm.cmd`, fixed argument arrays, inherited environment, and no user-controlled shell text. Export pure orchestration functions for tests; set `process.exitCode` only in CLI entrypoints.

The build runner captures and replays output, then rejects:

```js
export const FORBIDDEN_BUILD_WARNINGS = [
  "Browserslist:",
  "Some chunks are larger",
  "Unknown input options",
  "Unknown output options",
];
```

- [ ] **Step 4: Add stable npm scripts**

```json
"audit:security": "node scripts/npm-audit.mjs",
"lint:strict": "eslint . --max-warnings=0",
"typecheck": "tsc -b --pretty false",
"test:run": "vitest run",
"build:desktop": "vite build --mode desktop",
"build:clean": "node scripts/run-clean-build.mjs web",
"build:desktop:clean": "node scripts/run-clean-build.mjs desktop",
"verify:release": "node scripts/verify-release.mjs"
```

- [ ] **Step 5: Verify and commit**

```bash
npx vitest run scripts/__tests__/release-quality.test.mjs
npm run verify:release
git add package.json scripts/npm-audit.mjs scripts/run-clean-build.mjs scripts/verify-release.mjs scripts/__tests__/release-quality.test.mjs
git commit -m "build: add strict pre-release verification"
```

## Task 7: Enforce the Gate in CI and Release

**Files:**

- Create: `.github/workflows/quality.yml`
- Modify: `scripts/release.sh`
- Modify: `scripts/__tests__/release-quality.test.mjs`
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add failing integration-text tests**

Read the release script and workflow as text. Assert `npm run verify:release` occurs after clean-worktree validation and before `CURRENT_VERSION`/`npm version`. Assert CI uses Node 22, `npm ci`, and `npm run verify:release` for pull requests to `main`/`new-feat` and pushes to `new-feat`.

- [ ] **Step 2: Confirm RED**

```bash
npx vitest run scripts/__tests__/release-quality.test.mjs
```

Expected: FAIL because the release hook and workflow are absent.

- [ ] **Step 3: Add the pre-mutation release hook**

```bash
echo "Running pre-release quality gate..."
npm run verify:release
echo "Pre-release quality gate passed."
```

- [ ] **Step 4: Add read-only CI**

Use `actions/checkout@v4`, `actions/setup-node@v4` with Node 22/npm cache, `npm ci`, and `npm run verify:release`. Trigger on pull requests to `main`/`new-feat` and pushes to `new-feat`. Grant only `contents: read`; do not publish artifacts.

- [ ] **Step 5: Update operational documentation**

Document `npm run verify:release`, update the test count, replace the stale audit-clean claim with a statement tied to the gate, and add an Unreleased changelog item for dependency remediation and verification enforcement.

- [ ] **Step 6: Verify and commit**

```bash
npx vitest run scripts/__tests__/release-quality.test.mjs
npm run verify:release
git diff --check
git add .github/workflows/quality.yml scripts/release.sh scripts/__tests__/release-quality.test.mjs CLAUDE.md README.md CHANGELOG.md
git commit -m "ci: enforce the pre-release quality gate"
```

## Task 8: Final Clean-Install Verification and Stop Before Release

**Files:** none expected

- [ ] **Step 1: Reinstall reproducibly**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm ci
```

Review remaining install-script or deprecation warnings. Upgrade the owning direct dependency where a compatible remediation exists; otherwise document the exact upstream dependency path before accepting residual output.

- [ ] **Step 2: Run the canonical gate**

```bash
npm run verify:release
```

Expected: exit 0, zero audit vulnerabilities, zero ESLint errors/warnings, zero TypeScript errors, all tests pass, and both builds complete without forbidden warning classes.

- [ ] **Step 3: Review repository state**

```bash
git status --short --branch
git log --oneline --decorate -15
git diff main...HEAD --stat
git diff main...HEAD --check
```

Expected: clean tracked state, intended pledge/quality commits only, ignored preview files preserved, and no release/tag/push/deploy changes.

- [ ] **Step 4: Stop for explicit release approval**

Do not run `scripts/release.sh`, create a version commit/tag, switch to `main`, push, deploy, or publish Electron until the user explicitly authorizes release.
