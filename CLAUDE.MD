# CLAUDE.MD - AI Assistant Context

**Last Updated**: 2026-07-05
**Version**: 1.6.5

---

## What This App Does

**Examazej** (tagline: *Multiple-Choice Exam Randomizer*) generates multiple versions of multiple-choice exams from LaTeX, CSV, or Excel templates. Questions and answer options are shuffled deterministically using seed-based randomization for reproducibility. All processing is client-side (browser only). No authentication -- open access.

> **Branding:** the app was unified under the single name **Examazej** (English *Exam* + Arabic *مزيج / mazeej*, "blend/mix") in v1.6.2 — replacing the prior inconsistent names (Shuffler / Exam Generator / MC Exam Randomizer / Exam Shuffler).

## Desktop App (Examazej) — v1.7.0 SHIPPED ✅ (Phases 0–5 done; auto-update proven on personal + KFUPM-managed machines; Phase 6 signing now OPTIONAL for KFUPM)

**Live as of 2026-09-08 — v0.1 pilot functionally complete; latest shipped v1.7.0.** The Windows desktop app ships as a thin **Electron** shell around the *same* web build. Shipping is one command — `./scripts/release.sh patch` runs the strict pre-release quality gate, then bumps + tags + pushes, which triggers Netlify (web deploy) **and** CI (`.github/workflows/desktop-release.yml`, windows-latest) that builds the unsigned NSIS installer and auto-publishes it to the GitHub Release. The guided **`/download`** page serves the latest `.exe` + sha256 from `/releases/latest`. **Auto-update is proven end-to-end** (electron-updater: check-on-launch → silent download → subtle "Restart now" toast → install-on-quit; verified live v1.6.3→v1.6.4, and v1.6.4→v1.6.5 on **both a personal machine and a KFUPM-managed machine** — AD domain-joined, Netskope TLS-inspection proxy, standard non-admin user — both updated flawlessly). The gate requires a zero-vulnerability production audit.

**Phase 6 (code signing) — reassessed 2026-07-05, now OPTIONAL for KFUPM.** On-machine checks proved KFUPM managed machines run the **unsigned per-user installer + auto-update fine**: no WDAC, permissive (audit-only) AppLocker, PowerShell FullLanguage, SmartScreen only a one-time "Run anyway", and the sole real gate (local admin) is sidestepped by the per-user install. So signing is **not needed for internal users** — only for **external / other-university / personal** machines. If pursued: **Azure Trusted Signing is geo-blocked for KSA and issues no EV**, and **EV no longer bypasses SmartScreen** (removed 2024) → lean = **cloud-HSM OV cert under KFUPM's identity**, or **KFUPM's own internal CA** (ADCS root trusted domain-wide) for internal signing. Full analysis + university-meeting checklist: `notes/desktop-code-signing.md` (local/gitignored). Full plan: `notes/desktop-app-plan.md`. Key decisions:

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
- **Testing**: Vitest (318 tests)

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
Lock tags are independent; "position" means the slot within the question's group.
- `fixed` -- Locks position AND option order (shorthand for the next two)
- `fixed-position` -- Locks position only; options still shuffle
- `fixed-options` -- Locks option order only; ignored (with a warning) on open-ended
- `correct:X` -- LaTeX only: correct option letter A-E; absent = A. CSV/Excel use the `Correct` column
- `fixed-options:X` -- Keeps option X (several: `fixed-options:DE`) at its letter in every version; the rest shuffle (`pinnedOptions` = indices). Shuffle draws the RNG exactly like an unpinned question, so a pin never changes other questions
- `separate-page` -- Forces question onto its own page
- Redundant combos (`fixed` + `fixed-options`/`fixed-position`) warn, never error; a bad or out-of-range answer letter is an error
- **Answer truth**: `choices[1]` is the correct index everywhere; `correctOptionLetter` is deprecated (old sessions only). Use `getCorrectLetter()` / `getLockTags()` / `getLockLabels()` from `src/lib/core/question-flags.ts`
- **Exporters** write the canonical lock tags plus `%{#correct:X}` on every MCQ, so a re-imported template reproduces the same versions for the same seed
- Parser warnings (`ParsedLatexTemplate.warnings`) are shown on the Details page (notes text in `src/lib/core/import-notes.ts`)

### File Versions (`app_version`)
- Every template the app writes (LaTeX `%app_version=`, CSV/Excel settings row, session JSON) carries `app_version`; logic in `src/lib/core/app-version.ts`
- Missing or unreadable stamp = file made before v1.8.0. **Any change to what a tag means must be gated on the file's version** (add a constant like `PINNED_OPTIONS_VERSION` and bump `NEWEST_RULES_VERSION`)
- The only rule today: in a pre-1.8 LaTeX file, `fixed-options:X` without `correct:` takes X as the answer (v1.7 meaning), with one explanatory note
- `getTemplateVersion()` stamps max(package version, newest rules version), so dev builds before the release bump still write a v1.8 stamp
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
npm run verify:release  # Canonical audit, lint, typecheck, test, and build gate
npm run test:run     # Run the complete test suite once
npm run test:coverage  # Coverage report
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
Bumps version, commits, tags, merges to main, and pushes. Run from a clean feature
branch. Before changing any release state, the script requires
`npm run verify:release` to pass.

## Testing

Run `npm run verify:release` before release or integration. It enforces:

- zero production dependency vulnerabilities at the configured audit level
- zero ESLint errors or warnings
- a clean TypeScript project build
- the complete Vitest and quality-runner test suites
- warning-free clean builds for both web and Electron targets

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
