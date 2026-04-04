# CLAUDE.MD - AI Assistant Context

**Last Updated**: 2026-04-04
**Version**: 1.5.0

---

## What This App Does

**MC Exam Randomizer** generates multiple versions of multiple-choice exams from LaTeX, CSV, or Excel templates. Questions and answer options are shuffled deterministically using seed-based randomization for reproducibility. All processing is client-side (browser only).

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (port 8080)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: TanStack Query, React Hook Form + Zod
- **Rich Text**: TipTap editor + KaTeX (LaTeX math)
- **Auth**: Custom JWT via Hono API (`https://shuffler-auth.mshahrani.website`)
- **Routing**: React Router v6
- **Testing**: Vitest (138 tests, 77.99% core coverage)

## Project Structure

```
src/
  lib/
    core/           # Business logic (parser, latex, versioning, rng, settings)
    core/__tests__/  # Test suite (rng, parser, latex, versioning, settings)
    parsers/        # CSV, Excel, adapter (converts to LaTeX format)
    generators/     # CSV/Excel template generators
    utils/          # logger, tag-validator, page-count-analyzer, seed-generator
    auth.ts         # JWT auth client
    types.ts        # TypeScript interfaces
  pages/            # Landing, Auth, Index, Start, Details, Results, Documentation
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
- `separate-page` -- Forces question onto new page
- **Conflict**: `fixed` + `fixed-options` cannot be combined

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
- Add Supabase (migrated away permanently)
- Create backend endpoints (client-side only)
- Modify core RNG algorithm (reproducibility requirement)
- Use `console.log()` directly (use `createLogger()` from `src/lib/utils/logger.ts`)
- Put business logic inside `logger.group()` / `logger.time()` callbacks (tree-shaken in production)
- Use hardcoded exam metadata in `generateTemplateSettings()` (use user input)
- Change `generateTemplateSettings()` to positional parameters (use config object)

### DO
- Use `src/lib/auth.ts` for authentication
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
npm test             # Run all 138 tests
npm test -- --coverage  # Coverage report
```

### Git Branches
- `main` -- Production
- `new-feat` -- Current feature branch

## Testing

**138/138 tests passing** in `src/lib/core/__tests__/`:
- `settings.test.ts` (51) -- 100% coverage
- `rng.test.ts` (33) -- 94.73% coverage
- `latex.test.ts` (22) -- 75.46% coverage
- `versioning.test.ts` (21) -- 66.85% coverage
- `parser.test.ts` (15) -- 81.29% coverage

See `notes/test-coverage.md` for detailed breakdown.

### Untested Areas
- Tag validator, page count analyzer
- CSV/Excel parsers and adapter
- Template generators
- UI components
- Integration/E2E tests

## Auth Flow

1. User enters access code at `/auth`
2. `POST /api/auth/verify` -> JWT token + user data
3. Token in `localStorage` (`auth_token`, `user_data`)
4. Protected routes verify via `/api/auth/me`
5. Token expires after 30 days

## File Reference

| Task | Where to look |
|------|--------------|
| Auth | `src/lib/auth.ts` |
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
