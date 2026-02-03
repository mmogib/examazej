# CLAUDE.MD - AI Assistant Context

## What This App Does

**MC Exam Randomizer** - generates multiple shuffled versions of exams from LaTeX/CSV/Excel templates. Client-side only, deterministic seed-based RNG for reproducibility.

## Tech Stack

React 18 + TypeScript + Vite (port 8080) | shadcn/ui + Tailwind CSS | TanStack Query | React Hook Form + Zod | KaTeX | React Router v6

## Architecture Constraints

- **Client-side only** - all exam generation in browser, no backend, no auth
- **Deterministic RNG** - LCG + Fisher-Yates in `rng.ts`; never modify the algorithm
- **No `console.log`** - use logger utility (`createLogger`) instead
- **CRITICAL: No business logic inside logger callbacks** - `logger.group()` / `logger.time()` callbacks are tree-shaken in production

## Directory Map

### Core (`src/lib/core/`)
- `parser.ts` - LaTeX template parser (markers `%{#q}`, `%{#o}`, tags). Tag regex uses negative lookahead to skip question/option markers
- `latex.ts` - LaTeX document generator. Returns `GenerateLatexResult` with content + `pageCountWarning`. Per-version page count calculation
- `versioning.ts` - Version creation, group shuffling logic. `GroupConfig` type with `shuffleGroupPosition`/`shuffleQuestionsWithin` flags
- `rng.ts` - Deterministic RNG (seed-based LCG)
- `settings.ts` - Settings management: `getFormattedCurrentDate()`, `getCurrentTerm()`, `getDefaultSettings()`, `generateTemplateSettings(config)`, `generateSettingsBlock(settings)`

### Parsers (`src/lib/parsers/`)
- `csv-parser.ts` - CSV with 4 sections (`# settings`, `# instructions`, `# preamble`, `# questions`)
- `excel-parser.ts` - Excel with 4 sheets (Settings, Instructions, Preamble, Questions). Sheet names case-insensitive
- `adapter.ts` - Converts CSV/Excel data to LaTeX format. `validateGroupsMatchQuestions()` for group validation

### Generators (`src/lib/generators/`)
- `csv-template.ts` - CSV template generation from exam metadata
- `excel-template.ts` - Excel template generation (4 sheets, returns Blob)

### Utilities (`src/lib/utils/`)
- `logger.ts` - Dev-only logging (`createLogger(prefix)`). Methods: `debug`, `info`, `warn`, `error` (error always shown), `group`, `table`, `time`
- `tag-validator.ts` - Shared tag validation. `VALID_TAGS`: `fixed`, `fixed-options`, `separate-page`. Detects conflicts
- `page-count-analyzer.ts` - Detects page count variations across versions, generates recommendations

### Pages (`src/pages/`)
- `Landing.tsx` - Public marketing page
- `Index.tsx` - Main app container
- `Start.tsx` - Upload template or generate sample. `generateTemplate()` routes to correct generator by format
- `Details.tsx` - Configure exam settings. Group preview with mode labels
- `Results.tsx` - Download generated files. Page count warning banner + modal
- `Documentation.tsx` - User guide

### UI (`src/components/ui/`)
- `template-dialog.tsx` - Template generation modal. Collects: coursecode, examname, examdate, term (all required). Options: numQuestions, includeImageQuestion (LaTeX only), includeCoverPage
- `file-upload.tsx` - File upload with format detection (.tex, .csv, .xlsx, .json)

### Types (`src/lib/types.ts`)
`Question`, `QuestionType`, `Option`, `ExamSettings`, `ExamVersion`, `QuestionMapping`, `User`, `ParsedTemplate`

## Key Concepts

### Question Types (Inferred)
Types are auto-detected - **no type field** in CSV/Excel. MCQ = has options, Open-ended = no options.

### Question Tags
Behavioral modifiers declared via `%{#tag}` in LaTeX or `Tags` column in CSV/Excel:
- **`fixed`** - locks position AND option order
- **`fixed-options:X`** - locks option order only, X = correct answer letter (A-E)
- **`separate-page`** - forces `\newpage` before question
- **Conflict**: `fixed` + `fixed-options` together is invalid

### Question Groups
Setting `groups` defines partitions (e.g., `5,10,15` for 3 groups of 5). Three modes:
- **Standard `5`** - group position fixed, questions shuffle within
- **Parentheses `(5)`** - group position shuffles, questions keep order (dependent questions)
- **Square brackets `[5]`** - group position shuffles, questions shuffle within (topic grouping)
- **Mixed**: `5,(10),[15],20`

## LaTeX Markers

### Settings (`%{#setting}...%{/setting}`)
```latex
%{#setting}
%university=King Fahd University of Petroleum and Minerals
%department=Department of Mathematics
%term=Term 251
%coursecode=MATH 101
%examname=Midterm Exam
%examdate=January 07, 2026
%timeallowed=120 Minutes
%numberofvestions=4
%groups=5,10,15
%examtype=MAJOR
%code_name=CODE
%code_numbering=ALPHA
%paper_size=A4
%includeCoverPage=yes
%seed=MATH101-Midterm-251-Jan07
%{/setting}
```
All fields required except `seed` (auto-generated). `numberofvestions` = version count. `code_numbering`: `ALPHA` or `NUMERIC`. `paper_size`: `A4` or `LETTER`.

### Instructions (`%{#instructions}...%{/instructions}`)
Each line prefixed with `%`. Contains LaTeX commands for exam instructions.

### Preamble (`%{#preamble}...%{/preamble}`) - optional
Custom LaTeX packages/commands. No `%` prefix. Added before `\begin{document}`.

### Questions and Options
```latex
\begin{enumerate}
\item %{#q}What is $2 + 2$?%{/q}
\begin{enumerate}
\item %{#o}Three%{/o}
\item %{#o}Four%{/o}
\end{enumerate}
\end{enumerate}
```
Multi-line questions/options: put `%{#q}`/`%{/q}` or `%{#o}`/`%{/o}` on separate lines.

### Tags in LaTeX
Must be on separate line after `\item`:
```latex
\item %{#fixed}
%{#q}Student ID?%{/q}

\item %{#fixed-options:B}
%{#q}Capital of France?%{/q}

\item %{#separate-page}
%{#q}Essay question%{/q}
```
Can combine `fixed` or `fixed-options` with `separate-page`. Cannot combine `fixed` + `fixed-options`.

### CSV Format
4 sections: `# settings` (key,value pairs), `# instructions` (one per line), `# preamble` (LaTeX commands), `# questions` (required). Questions table: 8 columns (Question Text, Option A-E, Correct, Tags). Math via `$...$`. Types inferred from options.

### Excel Format
4 sheets: Settings (key-value), Instructions (one per row), Preamble (one per row), Questions (8-column table). Only Questions sheet required. Sheet names case-insensitive.

## Rules

### Do Not
- Add authentication or backend endpoints (app is fully client-side, no auth)
- Modify core RNG algorithm (breaks reproducibility)
- Use `console.log` (use `createLogger` from `@/lib/utils/logger`)
- Put business logic inside `logger.group()`/`logger.time()` callbacks (removed in production)
- Use hardcoded metadata in `generateTemplateSettings()` (use user input config object)
- Change `generateTemplateSettings()` to positional parameters (use config object)
### Do
- Keep exam generation client-side
- Use shadcn/ui + Tailwind for UI
- Validate with Zod schemas
- Generate seed from user metadata (coursecode, examname, term, examdate)
- Use config object pattern for functions with 5+ parameters

## Code Style

TypeScript strict mode, 2-space indent, PascalCase components, camelCase functions/variables, named exports, Tailwind CSS with `cn` helper.

## Commands

```bash
npm install          # Install deps
npm run dev          # Dev server (localhost:8080)
npm run build        # Production build
npm run lint         # ESLint
npm test             # All tests (138 tests)
npm test -- <name>   # Run specific test file (settings, versioning, rng, parser, latex)
npm test -- --coverage
```

## Test Summary

138/138 passing, 77.99% core coverage. Tests in `src/lib/core/__tests__/`:

| File | Tests | Statements | Branches |
|------|-------|-----------|----------|
| `rng.test.ts` | 33 | 94.73% | 100% |
| `parser.test.ts` | 15 | 81.29% | 83.75% |
| `latex.test.ts` | 22 | 75.46% | 88.42% |
| `settings.test.ts` | 51 | 100% | 100% |
| `versioning.test.ts` | 21 | 66.85% | 85.96% |

Untested: `tag-validator.ts`, `page-count-analyzer.ts`, CSV/Excel parsers, template generators, UI components.

Framework: Vitest, `vi.useFakeTimers()` for date tests, AAA pattern.
