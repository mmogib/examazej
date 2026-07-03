# CLAUDE.MD - AI Assistant Context

**Last Updated**: 2026-07-03
**Version**: 1.6.2

---

## What This App Does

**Examazej** (tagline: *Multiple-Choice Exam Randomizer*) generates multiple versions of multiple-choice exams from LaTeX, CSV, or Excel templates. Questions and answer options are shuffled deterministically using seed-based randomization for reproducibility. All processing is client-side (browser only). No authentication -- open access.

> **Branding:** the app was unified under the single name **Examazej** (English *Exam* + Arabic *مزيج / mazeej*, "blend/mix") in v1.6.2 — replacing the prior inconsistent names (Shuffler / Exam Generator / MC Exam Randomizer / Exam Shuffler).

## Desktop App (Examazej) — In Progress (Phases 0–2 done: Electron shell + unsigned installer build & run; on `new-feat`, unpushed)

A **Windows desktop** build is planned as a thin **Electron** shell around the *same* web build (one codebase; functional parity by construction). Full plan + all 26 decisions live in `notes/desktop-app-plan.md` (local/gitignored). Key decisions:

- **Electron** (bundles its own Chromium — a hard requirement, which rules out Tauri) · **Windows-first** · **one repo** (`mmogib/examazej`) · `electron-builder` **NSIS per-user** installer (no admin/UAC).
- **Auto-update:** `electron-updater` + **GitHub Releases** (public repo). Check-on-launch → silent download → install-on-quit → subtle `sonner` toast.
- **Parity:** desktop loads the same `dist/`; only thin shell deltas, all gated behind a `__DESKTOP__` build flag — `HashRouter`, boots to `/app` (skips Landing), enforced-offline, native Windows menu.
- **Offline/trust:** self-host fonts (drop the Google Fonts `@import`) so the app makes zero network calls; v0.1 ships **unsigned** (SmartScreen warning accepted), code-signing later.
- **Branding/icon:** name **Examazej**; icon source in `assets/branding/icon/`, generated via `scripts/gen-icons.ps1` → `build/icon.ico` (desktop) + `public/` favicons (web). `appId` = `io.github.mmogib.examazej`.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (port 8080)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: TanStack Query, React Hook Form + Zod
- **Rich Text**: TipTap editor + KaTeX (LaTeX math)
- **Routing**: React Router v6
- **Testing**: Vitest (166 tests, core coverage ~78%)

## Architecture Constraints

- **Client-side only** -- all exam generation in browser, no backend, no auth
- **Deterministic RNG** -- LCG + Fisher-Yates in `rng.ts`; never modify the algorithm
- **No `console.log`** -- use logger utility (`createLogger`) instead
- **CRITICAL: No business logic inside logger callbacks** -- `logger.group()` / `logger.time()` are tree-shaken in production

## Project Structure

```
src/
  lib/
    core/           # Business logic (parser, latex, versioning, rng, settings)
    core/__tests__/  # Test suite (rng, parser, latex, versioning, settings)
    parsers/        # CSV, Excel, adapter (converts to LaTeX format)
    generators/     # CSV/Excel template generators
    utils/          # logger, tag-validator, page-count-analyzer, seed-generator
    types.ts        # TypeScript interfaces
  pages/            # Landing, Index, Start, Details, Results, Documentation
  components/ui/    # shadcn/ui components + template-dialog, file-upload
```

## Key Concepts

### Question Types (Inferred)
- **MCQ**: Has 2+ options (auto-detected)
- **Open-Ended**: Has 0 options (auto-detected)
- No `type` field -- types are inferred from structure

### Question Tags
- `fixed` -- Locks position AND option order
- `fixed-options:X` -- Locks option order only (X = correct answer letter)
- `separate-page` -- Forces question onto its own page
- **Conflict**: `fixed` + `fixed-options` cannot be combined
- **Grouping rule**: A `separate-page` question must be alone in its own size-1 group. Sharing a group with other questions causes version-dependent page counts (Details page hard-errors this)

### Three Grouping Modes
- **Standard `5`**: Fixed position, questions shuffle within
- **Parentheses `(5)`**: Group shuffles position, questions keep order (dependent questions)
- **Square Brackets `[5]`**: Group shuffles position, questions shuffle within (topic grouping)
- **Mixed**: `5,(10),[15],20`

### Input Formats
- **LaTeX** (.tex): Markers `%{#q}`, `%{#o}`, `%{#setting}`, `%{#instructions}`, `%{#preamble}`
- **CSV** (.csv): 4 sections (`# settings`, `# instructions`, `# preamble`, `# questions`)
- **Excel** (.xlsx): 4 sheets (Settings, Instructions, Preamble, Questions)
- See `notes/latex-format-reference.md` for detailed marker syntax

### Deterministic Shuffling
- Seed-based LCG + Fisher-Yates shuffle in `src/lib/core/rng.ts`
- Same seed = identical output, always

## Conventions & Rules

### DO NOT
- Add authentication back (removed intentionally)
- Create backend endpoints (client-side only)
- Modify core RNG algorithm (reproducibility requirement)
- Use `console.log()` directly (use `createLogger()` from `src/lib/utils/logger.ts`)
- Put business logic inside `logger.group()` / `logger.time()` callbacks (tree-shaken in production)
- Use hardcoded exam metadata in `generateTemplateSettings()` (use user input)
- Change `generateTemplateSettings()` to positional parameters (use config object)

### DO
- Use shadcn/ui + Tailwind CSS for UI
- Use config object pattern for functions with 5+ parameters
- Use Zod for validation
- Use scoped loggers: `const logger = createLogger('MODULE_NAME')`

### Code Style
- TypeScript strict mode, 2-space indent
- PascalCase components, camelCase functions/variables
- Named exports preferred
- Tailwind CSS with `cn()` helper

## Development

```bash
npm install          # Install dependencies
npm run dev          # Dev server (localhost:8080)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all 166 tests
npm test -- --coverage  # Coverage report
```

### Git Branches
- `main` -- Production (deploys to Netlify + university server)
- `new-feat` -- Current feature branch

### Releasing
```bash
./scripts/release.sh          # minor (1.5.1 -> 1.6.0)
./scripts/release.sh patch    # patch (1.5.1 -> 1.5.2)
./scripts/release.sh major    # major (1.5.1 -> 2.0.0)
```
Bumps version, commits, tags, merges to main, pushes. Run from feature branch.

## Testing

**166/166 tests passing** in `src/lib/core/__tests__/`:
- `settings.test.ts` (51)
- `latex.test.ts` (31)
- `rng.test.ts` (29)
- `versioning.test.ts` (21)
- `parser.test.ts` (17)
- `separate-page-grouping.test.ts` (13)
- `bug-last-question.test.ts` (4) -- regression tests for RNG fix

## File Reference

| Task | Where to look |
|------|--------------|
| Exam generation | `src/lib/core/*.ts` |
| LaTeX output | `src/lib/core/latex.ts` |
| Input parsing | `src/lib/parsers/*.ts` |
| Template generation | `src/lib/generators/*.ts` |
| Question tags | `src/lib/utils/tag-validator.ts` |
| Page count warnings | `src/lib/utils/page-count-analyzer.ts` |
| Logging | `src/lib/utils/logger.ts` |
| UI components | `src/components/ui/*.tsx` |
| Pages | `src/pages/*.tsx` |
| Types | `src/lib/types.ts` |

---

**End of CLAUDE.MD**
