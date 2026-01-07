# CLAUDE.MD - AI Assistant Context

**Last Updated**: 2026-01-06
**Purpose**: Provide context for AI assistants working on this project

---

## 📅 Next Session Agenda (Jan 7, 2026)

### Priority 1: Additional Testing (Optional)
- **Tag Validation Tests** (`tag-validator.test.ts`)
  - Valid/invalid tags, conflict detection, normalization
  - Context in error messages
- **Page Count Analyzer Tests** (`page-count-analyzer.test.ts`)
  - Detection logic, recommendations, edge cases
- **CSV/Excel Parser Tests** (if needed)
  - Section parsing, validation, error messages
  - Adapter conversion logic

### Priority 2: UI Component Testing (Optional)
- Template Dialog component tests
- File Upload component tests
- Details page group preview tests

### Priority 3: Future Enhancements
- To be discussed with user

---

## 📋 Recent Changes (Jan 2026)

### NEW FEATURE: Square Bracket [5] Grouping Syntax (Jan 6, 2026)
- **FEATURE ADDED**: Three-mode grouping system for flexible question organization
- **THREE GROUPING MODES**:
  1. **Standard `5`**: Group position fixed, questions shuffle within, options shuffle
  2. **Parentheses `(5)`**: Group shuffles position, questions keep order (for dependent questions), options shuffle
  3. **Square Brackets `[5]`**: Group shuffles position, questions shuffle within (for topic-based grouping), options shuffle
- **USE CASES**:
  - Use `(5)` when questions are related and answers depend on previous questions
  - Use `[5]` for topic/chapter/concept grouping where questions should shuffle but stay in same section
  - Use standard `5` for normal grouping with fixed position
- **MIXED GROUPING**: Supports all combinations like `5,(10),[15],20`
- **FILES MODIFIED**:
  - `src/lib/core/versioning.ts` - Added `GroupConfig` type with `shuffleGroupPosition` and `shuffleQuestionsWithin` flags
  - `src/pages/Details.tsx` - Group preview now shows mode labels, fixed regex to handle square brackets (line 228)
  - `src/lib/parsers/adapter.ts` - Fixed validation regex to handle square brackets (line 95)
  - `src/pages/Documentation.tsx` - Updated to "Three Shuffling Modes" section
  - `src/lib/core/__tests__/versioning.test.ts` - Added bracket format tests (21 total tests)

### COMPREHENSIVE TEST SUITE: Priority 1 Complete (Jan 6, 2026)
- **ACHIEVEMENT**: 138/138 tests passing (100%), core business logic coverage: 77.99%
- **NEW TEST FILES CREATED**:
  - `src/lib/core/__tests__/rng.test.ts` (33 tests)
    - Deterministic behavior (reproducibility with same seed)
    - Shuffle function correctness (no loss, no duplicates, preserves elements)
    - Statistical properties (uniform distribution, independence, range validation)
    - Edge cases (empty arrays, single elements, large arrays, duplicates)
    - Real-world use cases (exam question shuffling, option shuffling)
  - `src/lib/core/__tests__/parser.test.ts` (15 tests)
    - Valid template parsing (MCQ, open-ended, settings, preamble)
    - Tag parsing (`fixed`, `fixed-options`, `separate-page`)
    - Tag validation (conflicts, invalid tags, missing correct answer)
    - Edge cases (LaTeX math, multiline text, multiple questions)
  - `src/lib/core/__tests__/latex.test.ts` (22 tests)
    - Document generation (complete LaTeX output, version inclusion, syntax validation)
    - Cover page generation (with/without cover page setting)
    - Page count calculation per version
    - Page count variation detection and warnings
    - Separate-page question handling (`\newpage` insertion)
    - Edge cases (empty questions, large exams, preamble commands, math equations)
- **COVERAGE BREAKDOWN**:
  - `rng.ts`: 94.73% statements, 100% branches, 80% functions
  - `parser.ts`: 81.29% statements, 83.75% branches, 66.66% functions
  - `latex.ts`: 75.46% statements, 88.42% branches, 75% functions
  - `settings.ts`: 100% statements, 100% branches, 100% functions (51 tests)
  - `versioning.ts`: 66.85% statements, 85.96% branches, 60% functions (21 tests)
- **BUGS FIXED DURING TESTING**:
  - Parser tests: Corrected LaTeX format to use `\begin{enumerate}` blocks
  - Parser tests: Fixed tag placement (must be on separate lines after `\item`)
  - Latex tests: Fixed parameter order (settings, masterExam, versions, mappings)
  - Latex tests: Fixed version name assertions (`"CODE A"` not `"version_A"`)
  - RNG tests: Added numeric comparator for array sorting

## 📋 Recent Changes (Jan 2026)

### NEW FEATURE: Page Count Variation Detection & Warnings (Jan 5, 2026)
- **PROBLEM SOLVED**: Different exam versions can have different total page counts when regular questions shuffle before separate-page questions
- **PER-VERSION CALCULATION**: Each shuffled version now calculates its own total page count (not just master)
- **WARNING SYSTEM**: Detects page count variations and warns users with actionable recommendations
- **3-LAYER WARNINGS**:
  1. **LaTeX Comment Block** - Warning added at top of .tex file with distribution and recommendations
  2. **Results Page Banner** - Prominent alert banner showing affected versions and suggestions
  3. **Download Modal** - Confirmation dialog before download requiring user acknowledgment
- **SMART RECOMMENDATIONS**: Analyzes exam structure and suggests fixes (add 'fixed' tag, regroup questions, etc.)
- **FILES CREATED**:
  - `src/lib/utils/page-count-analyzer.ts` - Page count detection and recommendation generator
- **FILES MODIFIED**:
  - `src/lib/core/latex.ts` - Per-version page count calculation, warning comment blocks, new return type `GenerateLatexResult`
  - `src/pages/Results.tsx` - Warning banner, modal dialog, updated download flow
- **BUG FIX**: Fixed parser tag regex that was incorrectly matching question markers (`%{#q}`) as tags, causing "No questions found" error

### BREAKING CHANGE: Tag System Refactor (Jan 5, 2026)
- **UNIFIED TAG SYSTEM**: Question types are now INFERRED, tags are behavioral modifiers
- **REMOVED**: Type column from CSV/Excel formats (BREAKING CHANGE)
- **TAG VALIDATION**: Shared validator across all parsers with conflict detection
- **3 TAGS**: `fixed`, `fixed-options`, `separate-page` (cannot combine fixed + fixed-options)
- **INFERRED TYPES**: MCQ (has options) vs Open-Ended (no options) - no need to declare
- **FILES CREATED**:
  - `src/lib/utils/tag-validator.ts` - Shared tag validation utility
- **FILES MODIFIED**:
  - `src/lib/core/parser.ts` - LaTeX parser with tag validation and error collection
  - `src/lib/parsers/csv-parser.ts` - Removed Type column, uses Tags only
  - `src/lib/parsers/excel-parser.ts` - Removed Type column, uses Tags only
  - `src/lib/generators/csv-template.ts` - Removed Type column from output
  - `src/lib/generators/excel-template.ts` - Removed Type column from output
  - `src/pages/Documentation.tsx` - Updated to reflect tag system
  - `CLAUDE.md` - This file, updated documentation

### NEW FEATURE: CSV & Excel Input Formats (Jan 2, 2026)
- **ADDED**: CSV and Excel (.xlsx) as alternative input formats alongside LaTeX
- **PARSERS**: New parsers for CSV and Excel formats (`src/lib/parsers/`)
  - `csv-parser.ts` - Parses CSV with 4 sections (settings, instructions, preamble, questions)
  - `excel-parser.ts` - Parses Excel with 4 sheets (Settings, Instructions, Preamble, Questions)
  - `adapter.ts` - Converts CSV/Excel data to LaTeX format for seamless integration
- **GENERATORS**: Template generators for all formats (`src/lib/generators/`)
  - `csv-template.ts` - Generates CSV templates with user metadata
  - `excel-template.ts` - Generates Excel templates with 4 sheets
- **TEMPLATE DIALOG**: Enhanced to support all three formats (LaTeX, CSV, Excel)
  - Same metadata collection for all formats (coursecode, examname, etc.)
  - Format-specific help text and options
  - Image question toggle only for LaTeX format
- **FILE UPLOAD**: Now supports .tex, .csv, .xlsx, .json
  - Automatic format detection
  - Preview card showing parsed data
  - Strict validation with clear error messages
- **MATH SUPPORT**: LaTeX math equations ($...$, $$...$$) in CSV/Excel cells
- **ZERO IMPACT**: No changes to existing LaTeX functionality or business logic

### Files Created (CSV/Excel Feature)
1. `src/lib/parsers/csv-parser.ts` - CSV parsing with section markers
2. `src/lib/parsers/excel-parser.ts` - Excel parsing with sheet validation
3. `src/lib/parsers/adapter.ts` - Conversion layer to LaTeX format
4. `src/lib/generators/csv-template.ts` - CSV template generation
5. `src/lib/generators/excel-template.ts` - Excel template generation

### Files Modified (CSV/Excel Feature)
1. `src/pages/Start.tsx` - File upload with format detection, preview, template generation
2. `src/components/ui/template-dialog.tsx` - Multi-format support, conditional rendering
3. `src/components/ui/file-upload.tsx` - Fixed file input reset on remove

### Bug Fixes (Jan 2, 2026)
1. **Fixed**: Image question toggle now only shows for LaTeX format
2. **Fixed**: Template generators use requested question count (not hardcoded examples)
3. **Fixed**: Error state clears when file is removed
4. **Fixed**: Same filename can be re-uploaded after fixing errors (input value reset)

## 📋 Previous Changes (Dec 2025)

### NEW FEATURE: Safe Logger Utility (Dec 30, 2025)
- **ADDED**: Environment-based logging utility (`src/lib/utils/logger.ts`)
- **DEV ONLY**: All debug/info/warn logs only show in development
- **PRODUCTION SAFE**: Logs automatically removed by Vite tree-shaking
- **FEATURES**: Scoped loggers, grouped logs, table view, performance timing
- **INTEGRATED**: Template dialog, settings, and Start page now have comprehensive logging

### Files Modified (Logger Implementation)
1. `src/lib/utils/logger.ts` - **NEW** - Safe logger utility with scoped loggers
2. `src/components/ui/template-dialog.tsx` - Added logging for form events and validation
3. `src/lib/core/settings.ts` - Added logging for seed generation and settings
4. `src/pages/Start.tsx` - Added comprehensive logging with performance timing

### NEW FEATURE: Enhanced Template Dialog (Dec 30, 2025)
- **ADDED**: User-provided exam metadata in template generation dialog
- **NEW FIELDS**: Course Code, Exam Name, Exam Date, Term (all required)
- **NEW TOGGLE**: Include Cover Page option (default: true)
- **IMPROVED**: Seed generation now uses user input instead of hardcoded defaults
- **UX**: Form validation, error messages, auto-populated defaults, mobile-friendly

### Files Modified (Template Feature)
1. `src/lib/core/settings.ts` - Added `getFormattedCurrentDate()`, updated `generateTemplateSettings()` to use config object
2. `src/components/ui/template-dialog.tsx` - Enhanced dialog with 4 required fields + cover page toggle
3. `src/pages/Start.tsx` - Updated `generateTemplate()` function signature

### Migration Complete: Supabase → Hono Auth
- **REMOVED**: Supabase authentication entirely
- **ADDED**: Custom JWT-based auth via Hono API
- **Auth API**: `https://shuffler-auth.mshahrani.website`
- **Storage**: JWT tokens in localStorage
- **Files Deleted**: `MIGRATION.MD`, `MIGRATION_SUMMARY.MD`, `AGENTS.MD`, `src/integrations/supabase/`

### Key Changes (Auth Migration)
1. Created `src/lib/auth.ts` - Custom auth client replacing Supabase
2. Updated `src/pages/Auth.tsx` - Direct Hono API integration
3. Updated `src/pages/Index.tsx` - JWT token verification
4. Updated `src/components/layout/Header.tsx` - Custom User type
5. Updated `README.md` - Removed all Supabase references

**⚠️ IMPORTANT**: This app NO LONGER uses Supabase. Don't suggest adding it back!

---

## 🏗️ Architecture Overview

### What This App Does
**MC Exam Randomizer** generates multiple versions of multiple-choice exams from LaTeX templates. Questions and answer options are shuffled deterministically using seed-based randomization for reproducibility.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite (port 8080)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: TipTap editor + KaTeX (LaTeX math rendering)
- **Auth**: Custom JWT via Hono API (Airtable backend)
- **Routing**: React Router v6

### Authentication Flow
1. User enters access code on `/auth`
2. `POST https://shuffler-auth.mshahrani.website/api/auth/verify`
3. Receives JWT token + user data
4. Token stored in `localStorage` (`auth_token`, `user_data`)
5. Protected routes verify token via `/api/auth/me`
6. Token expires after 30 days

### Core Architecture
- **Client-side only**: All exam generation happens in browser (privacy-focused)
- **No backend**: Auth API is external, no app backend needed
- **Deterministic RNG**: Linear Congruential Generator for reproducible shuffling
- **LaTeX Processing**: Custom parser + generator (no external deps)

---

## 📂 Important Files & Their Purpose

### Core Exam Generation (`src/lib/core/`)
- **`parser.ts`** - Parses LaTeX templates with special markers (`%{#q}`, `%{#o}`)
  - Tag regex uses negative lookahead to avoid matching question/option markers
  - Collects tag validation errors and throws at end with all errors
- **`latex.ts`** - Generates complete LaTeX documents with all versions
  - `generateLatexDocument()` - Returns `GenerateLatexResult` with content and `pageCountWarning`
  - Calculates page count **per version** (not just master) for accurate "Page X of Y" headers
  - Adds warning comment block at top of .tex file if page count variation detected
- **`versioning.ts`** - Creates exam versions, handles shuffling logic
- **`rng.ts`** - Deterministic Random Number Generator (seed-based)
- **`settings.ts`** - Exam settings management
  - `getFormattedCurrentDate()` - Returns formatted date (e.g., "December 30, 2025")
  - `getCurrentTerm()` - Calculates current term code (e.g., "251")
  - `getDefaultSettings()` - Returns default exam settings
  - `generateTemplateSettings(config)` - Creates settings for template generation (uses config object)
  - `generateSettingsBlock(settings)` - Generates LaTeX settings block

### Input Format Parsers (`src/lib/parsers/`)
- **`csv-parser.ts`** - Parses CSV files with 4 sections
  - `parseCSV(content)` - Main parser, returns settings/instructions/preamble/questions
  - `splitIntoSections()` - Splits CSV by `# settings`, `# instructions`, etc.
  - `parseSettingsSection()` - Validates and converts settings (type checking)
  - `parseQuestionsSection()` - Parses question table with columns
  - Strict validation with line numbers in error messages
- **`excel-parser.ts`** - Parses Excel (.xlsx) files with 4 sheets
  - `parseExcel(file)` - Main parser using xlsx library
  - `parseSettingsSheet()` - Reads key-value pairs from Settings sheet
  - `parseQuestionsSheet()` - Reads question table from Questions sheet
  - Sheet names are case-insensitive
- **`adapter.ts`** - Converts CSV/Excel data to LaTeX format
  - `convertToLatexFormat()` - Adapter pattern for seamless integration
  - `validateGroupsMatchQuestions()` - Validates group partition matches question count
  - Zero impact on existing LaTeX flow

### Template Generators (`src/lib/generators/`)
- **`csv-template.ts`** - Generates CSV templates
  - `generateCSVTemplate(settings, exam)` - Creates CSV with user metadata
  - `convertMultilineFieldsToEscapedNewlines()` - Escapes newlines in CSV fields
  - Generates questions from actual exam data (not hardcoded)
- **`excel-template.ts`** - Generates Excel templates
  - `generateExcelTemplate(settings, exam)` - Creates .xlsx with 4 sheets
  - Uses xlsx library to write workbook
  - Returns Blob for download

### Utilities (`src/lib/utils/`)
- **`logger.ts`** - Safe development-only logging utility
  - `logger.debug(...)` - Debug logs (dev only)
  - `logger.info(...)` - Info logs (dev only)
  - `logger.warn(...)` - Warning logs (dev only)
  - `logger.error(...)` - Error logs (always shown, even in production)
  - `logger.group(label, fn)` - Grouped logs with auto-cleanup
  - `logger.table(data)` - Table view for arrays/objects
  - `logger.time(label, fn)` - Performance timing
  - `createLogger(prefix)` - Create scoped logger (e.g., "SETTINGS", "START_PAGE")
- **`tag-validator.ts`** - Shared tag validation across all input formats
  - `validateQuestionTags(tags, context)` - Validates and parses question tags
  - `VALID_TAGS` - Array of valid tags: 'fixed', 'fixed-options', 'separate-page'
  - Detects conflicts (e.g., fixed + fixed-options)
  - Returns normalized `QuestionTags` object
- **`page-count-analyzer.ts`** - Page count variation detection and recommendations (NEW!)
  - `detectPageCountVariations(masterExam, versions)` - Detects when versions have different page counts
  - `formatPageCountWarning(warning)` - Formats warning message for display
  - Returns `PageCountWarning` with distributions and smart recommendations
  - Analyzes exam structure to suggest fixes (add 'fixed' tag, regroup, etc.)

### Authentication (`src/lib/`)
- **`auth.ts`** - JWT auth client (replaces Supabase)
  - `verifyCode(code)` - Login
  - `getCurrentUser()` - Get user from token
  - `signOut()` - Clear localStorage
  - `isAuthenticated()` - Check token validity

### Pages (`src/pages/`)
- **`Landing.tsx`** - Public marketing page
- **`Auth.tsx`** - Login page (access code entry)
- **`Index.tsx`** - Main app container (protected route)
- **`Start.tsx`** - Upload template or generate sample
  - `generateTemplate()` - Creates and downloads LaTeX template file
  - `createExampleQuestions()` - Generates placeholder questions with math examples
- **`Details.tsx`** - Configure exam settings
- **`Results.tsx`** - Download generated files
  - Page count warning banner (always visible if variation detected)
  - Page count warning modal (before download if variation detected)
  - Handles `GenerateLatexResult` return type from `generateLatexDocument()`
- **`Documentation.tsx`** - User guide

### UI Components (`src/components/ui/`)
- **`template-dialog.tsx`** - Template generation modal (NEW FEATURE)
  - Collects exam metadata: coursecode, examname, examdate, term
  - Configures options: numQuestions, includeImageQuestion, includeCoverPage
  - Form validation with touch-based error display
  - Auto-populated defaults for date and term
  - Mobile-responsive with scroll support

### Types (`src/lib/types.ts`)
- `Question`, `QuestionType`, `Option`
- `ExamSettings`, `ExamVersion`, `QuestionMapping`
- `User`, `ParsedTemplate`

---

## 🎯 Key Concepts

### Question Types (Inferred - Not Declared!)
Question types are **automatically detected** based on question structure. You don't specify a type!

1. **Multiple Choice (MCQ)** - Has 2+ options (automatically detected)
2. **Open-Ended** - Has 0 options (automatically detected)
3. **Image Questions** - MCQ/Open-Ended with LaTeX image formatting (documentation concept, not a type)

**IMPORTANT**: There is NO `type` field in CSV/Excel anymore! Types are inferred from whether the question has options.

### Question Tags (Behavioral Modifiers)
Tags modify question behavior. These ARE explicitly declared in the `Tags` column or LaTeX markers:

1. **`fixed`** - Locks BOTH position AND option order (invalid with fixed-options)
2. **`fixed-options`** - Locks option order ONLY, position can shuffle (invalid with fixed)
3. **`separate-page`** - Forces question onto its own page

**Tag Conflicts**: Cannot use `fixed` + `fixed-options` together (validator will error)

### Question Groups
Users configure groups like `"5,10,15"`, `"(5),10,(15)"`, or `"5,(10),[15],20"`

**Three Grouping Modes**:
1. **Standard `5`**: Group position fixed, questions shuffle within, options shuffle
2. **Parentheses `(5)`**: Group shuffles position, questions keep order, options shuffle (use for dependent questions)
3. **Square Brackets `[5]`**: Group shuffles position, questions shuffle within, options shuffle (use for topic-based grouping)

Creates balanced exam sections with flexible control over question and group ordering.

### LaTeX Markers

#### 1. Settings Block (`%{#setting}...%{/setting}`)
**All Available Settings** (all fields required except `seed`):

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

**Field Descriptions:**
- `university` - Institution name (appears on cover page/header)
- `department` - Department name (appears on cover page)
- `term` - Academic term (e.g., "Term 251" = Fall 2025, "252" = Spring 2026, "253" = Summer 2026)
- `coursecode` - Course code (e.g., "MATH 101", "CS 201")
- `examname` - Exam title (e.g., "First Major Exam", "Final Exam")
- `examdate` - Exam date (e.g., "January 07, 2026")
- `timeallowed` - Duration (e.g., "120 Minutes")
- `numberofvestions` - Number of exam versions to generate (e.g., 4 creates versions A, B, C, D)
- `groups` - Question grouping (e.g., "5,10,15" or "(5),10,[15]") - see Grouping Modes below
- `examtype` - Exam type label (e.g., "MAJOR", "QUIZ", "FINAL")
- `code_name` - Version label prefix (e.g., "CODE" → "CODE A", "CODE B")
- `code_numbering` - Version numbering style: `ALPHA` (A,B,C...) or `NUMERIC` (1,2,3...)
- `paper_size` - Paper size: `A4` or `LETTER`
- `includeCoverPage` - Include cover page: `yes` or `no` (default: `yes`)
- `seed` - RNG seed for reproducibility (optional, auto-generated if missing)

**Grouping Modes:**
- **Standard `5`**: Group position fixed, questions shuffle within, options shuffle
- **Parentheses `(5)`**: Group shuffles position, questions keep order (for dependent questions), options shuffle
- **Square Brackets `[5]`**: Group shuffles position, questions shuffle within (for topic grouping), options shuffle
- **Mixed**: `5,(10),[15],20` - Combine all three modes

---

#### 2. Instructions Block (`%{#instructions}...%{/instructions}`)
**Purpose**: Exam instructions printed on first page (before questions)

```latex
%{#instructions}
%\begin{enumerate}
%    \begin{normalsize}
%        \item All types of calculators, smart watches or mobile phones are NOT allowed.
%        \item Use HB 2.5 pencils only.
%        \item Write your name, ID number and Section number on the examination paper.
%    \end{normalsize}
%\end{enumerate}
%{/instructions}
```

**Format Rules:**
- Each line must start with `%` (comment character)
- Can include LaTeX commands (enumerate, itemize, etc.)
- Multi-line instructions supported
- Rendered verbatim (preserves formatting)

---

#### 3. Preamble Block (`%{#preamble}...%{/preamble}`) - **OPTIONAL**
**Purpose**: Custom LaTeX packages and commands for the entire document

```latex
%{#preamble}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{tikz}
\usepackage{graphicx}
\usepackage{circuitikz}
\newcommand{\R}{\mathbb{R}}
\newcommand{\Z}{\mathbb{Z}}
%{/preamble}
```

**Use Cases:**
- **Math Packages**: `amsmath`, `amssymb` for advanced math symbols
- **Graphics**: `tikz`, `graphicx` for diagrams and images
- **Custom Commands**: Define shortcuts (e.g., `\R` for `\mathbb{R}`)
- **Specialized Packages**: `circuitikz` (circuits), `chemfig` (chemistry), `pgfplots` (plots)

**Important Notes:**
- All commands added to document preamble (before `\begin{document}`)
- Applies to ALL questions in ALL versions
- No `%` prefix needed inside preamble block
- Optional - omit entirely if no custom packages needed

---

#### 4. Question Blocks

**Multiple Choice Question (with enumerate):**
```latex
\begin{enumerate}
\item %{#q}What is $2 + 2$?%{/q}
\begin{enumerate}
\item %{#o}Three%{/o}
\item %{#o}Four%{/o}
\item %{#o}Five%{/o}
\end{enumerate}
\end{enumerate}
```

**Multiple Choice Question (inline):**
```latex
\begin{enumerate}
\item %{#q}Calculate $\int x^2 \, dx$%{/q}
\begin{enumerate}
\item %{#o}$\frac{x^3}{3} + C$%{/o}
\item %{#o}$x^3 + C$%{/o}
\item %{#o}$2x + C$%{/o}
\end{enumerate}
\end{enumerate}
```

**Open-Ended Question (no options):**
```latex
%{#q}
Explain the process of photosynthesis in detail.
%{/q}
```

**Multi-line Question:**
```latex
%{#q}
Consider the function $f(x) = x^2 + 3x + 2$.

Find the following:
\begin{itemize}
    \item Vertex
    \item Axis of symmetry
    \item Y-intercept
\end{itemize}
%{/q}
```

**Multi-line Option:**
```latex
\item %{#o}
First line of option
Second line of option
Third line of option
%{/o}
```

---

#### 5. Question Tags (Behavioral Modifiers)

**ALL VALID TAGS**: `fixed`, `fixed-options`, `separate-page`

**Tag Format**: `%{#tag-name}` or `%{#tag-name:value}` (must be on separate line after `\item`)

**⚠️ TAG CONFLICTS**: Cannot use `fixed` + `fixed-options` together!

---

**Tag 1: `%{#fixed}` - Lock Position AND Option Order**

Locks BOTH question position AND option order (options won't shuffle).

```latex
\begin{enumerate}
\item %{#fixed}
%{#q}What is your student ID number?%{/q}
\begin{enumerate}
\item %{#o}Enter your ID%{/o}
\end{enumerate}
\end{enumerate}
```

**Use Cases:**
- Personal info questions (Name, ID, Section)
- Questions that must appear first/last
- Questions with position-dependent context

---

**Tag 2: `%{#fixed-options:X}` - Lock Option Order Only**

Locks option order but allows question position to shuffle. Requires correct answer letter.

**Format**: `%{#fixed-options:B}` where B is the correct answer (A, B, C, D, or E)

```latex
\begin{enumerate}
\item %{#fixed-options:B}
%{#q}Which is the capital of France?%{/q}
\begin{enumerate}
\item %{#o}London%{/o}
\item %{#o}Paris%{/o}
\item %{#o}Berlin%{/o}
\item %{#o}Madrid%{/o}
\end{enumerate}
\end{enumerate}
```

**Use Cases:**
- Options have logical order (chronological, size, alphabetical)
- "All of the above" / "None of the above" options
- Numeric sequences (1, 2, 3, 4...)
- True/False questions

**⚠️ IMPORTANT**: Must specify correct answer letter (`:A`, `:B`, `:C`, `:D`, `:E`)

---

**Tag 3: `%{#separate-page}` - Force New Page**

Forces question to start on a new page. Works with both MCQ and open-ended questions.

```latex
\item %{#separate-page}
%{#q}
Essay Question: Discuss the impact of climate change on global agriculture.
Write at least 500 words.
%{/q}
```

**Use Cases:**
- Essay questions needing full page
- Questions with large diagrams/images
- Questions requiring significant workspace
- Page count control for printing

---

**Tag 4: Multiple Tags Combined**

You can combine `fixed` OR `fixed-options` with `separate-page`:

```latex
\item %{#fixed}
%{#separate-page}
%{#q}Student Information (Full Page)%{/q}
```

```latex
\item %{#fixed-options:A}
%{#separate-page}
%{#q}This question must be on its own page%{/q}
\begin{enumerate}
\item %{#o}Answer A (correct)%{/o}
\item %{#o}Answer B%{/o}
\end{enumerate}
```

**⚠️ INVALID COMBINATION**:
```latex
\item %{#fixed}
%{#fixed-options:B}
%{#q}This will ERROR!%{/q}
```

---

#### 6. Complete Example Template

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
%groups=5,10
%examtype=MAJOR
%code_name=CODE
%code_numbering=ALPHA
%paper_size=A4
%includeCoverPage=yes
%{/setting}

%{#preamble}
\usepackage{amsmath}
\usepackage{tikz}
%{/preamble}

%{#instructions}
%\begin{enumerate}
%    \begin{normalsize}
%        \item All types of calculators are NOT allowed.
%        \item Use HB 2.5 pencils only.
%    \end{normalsize}
%\end{enumerate}
%{/instructions}

\begin{enumerate}

% Question 1: Fixed position (student info)
\item %{#fixed}
%{#q}Write your Student ID Number:%{/q}
\begin{enumerate}
\item %{#o}Enter your ID%{/o}
\end{enumerate}

% Question 2: Regular MCQ (shuffles)
\item %{#q}What is $2 + 2$?%{/q}
\begin{enumerate}
\item %{#o}3%{/o}
\item %{#o}4%{/o}
\item %{#o}5%{/o}
\end{enumerate}

% Question 3: Fixed options (logical order)
\item %{#fixed-options:C}
%{#q}Order these numbers: 1, 3, 2, 4%{/q}
\begin{enumerate}
\item %{#o}4, 3, 2, 1%{/o}
\item %{#o}2, 1, 4, 3%{/o}
\item %{#o}1, 2, 3, 4%{/o}
\item %{#o}All of the above%{/o}
\end{enumerate}

% Question 4: Essay on separate page
\item %{#separate-page}
%{#q}Essay: Explain the Pythagorean theorem and provide two real-world applications.%{/q}

\end{enumerate}
```

### CSV Format
**Structure**: 4 sections marked with `#` headers
```csv
# settings
university,King Fahd University
department,Mathematics
coursecode,MATH 101
examname,Midterm Exam
...

# instructions
Read all questions carefully
Show your work for partial credit

# preamble
\usepackage{amsmath}
\usepackage{tikz}

# questions
Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags
"What is $x^2 + y^2$?","Answer 1","Answer 2","Answer 3","","",B,
"Student ID?","Enter your ID","","","","",A,fixed
"Essay: Explain photosynthesis.",""," ","","","",,"separate-page"
"Which is correct?","Option A","Option B","Option C","","",B,fixed-options
```

**Key Features**:
- Sections are optional except `# questions` (required)
- Settings: key-value pairs (e.g., `coursecode,MATH 101`)
- Questions: CSV table with **8 columns** (Type column REMOVED in v1.4+)
- Math support: Use `$...$` or `$$...$$` in any field
- Multiline fields: Use quotes and literal `\n` for newlines
- Tags column: Comma-separated tags (`fixed`, `fixed-options`, `separate-page`)
- Question types are INFERRED: Has options = MCQ, No options = Open-ended

### Excel Format
**Structure**: 4 sheets (Settings, Instructions, Preamble, Questions)

**Settings Sheet** (key-value table):
| Key | Value |
|-----|-------|
| university | King Fahd University |
| coursecode | MATH 101 |
| examname | Midterm Exam |
| ... | ... |

**Instructions Sheet** (one instruction per row):
| Instruction |
|-------------|
| Read all questions carefully |
| Show your work |

**Preamble Sheet** (one command per row):
| LaTeX Preamble |
|----------------|
| \usepackage{amsmath} |
| \usepackage{tikz} |

**Questions Sheet** (table format):
| Question Text | Option A | Option B | Option C | Option D | Option E | Correct | Tags |
|---------------|----------|----------|----------|----------|----------|---------|------|
| What is $2+2$? | Three | Four | Five | | | B | |
| Student ID? | Enter ID | | | | | A | fixed |
| Essay question? | | | | | | | separate-page |

**Key Features**:
- Sheet names are case-insensitive
- Only Questions sheet is required
- Math support: Use `$...$` in any cell
- Empty cells are allowed (optional columns)
- **8 columns total** (Type column REMOVED in v1.4+)
- Tags: Comma-separated (`fixed`, `fixed-options`, `separate-page`)
- Question types INFERRED from presence of options

### Deterministic Shuffling
- Seed-based RNG ensures reproducibility
- Same seed = same exam version
- Fisher-Yates shuffle with LCG
- All randomization happens in `src/lib/core/rng.ts`

### Template Generation Dialog
**Location**: `src/components/ui/template-dialog.tsx`

**User Flow**:
1. Click "Download Sample Template" button
2. Fill required fields:
   - **Course Code** (empty, placeholder: "e.g., MATH 101, CS 201")
   - **Exam Name** (empty, placeholder: "e.g., First Major Exam")
   - **Exam Date** (pre-filled with current date)
   - **Term** (pre-filled with current term, e.g., "Term 251")
3. Configure template options:
   - Number of Questions (1-100, default: 10)
   - Include Image Question toggle (default: false)
   - Include Cover Page toggle (default: true)
4. Click "Generate Template"

**Validation**:
- All 4 metadata fields are required
- Shows error messages on touched invalid fields
- Button disabled until form is valid
- Touch-based validation (user-friendly)

**Seed Generation**:
- Seed is generated from user-provided metadata: `generateDynamicSeed({ coursecode, examname, term, examdate })`
- This ensures each template has a unique, reproducible seed
- **Changed from**: Hardcoded "MATH XXX", "EXAM NAME" defaults
- **Changed to**: User-provided real exam metadata

**Function Signature**:
```typescript
generateTemplateSettings({
  coursecode: string,
  examname: string,
  examdate: string,
  term: string,
  numQuestions: number,
  includeCoverPage?: boolean
}): ExamSettings
```

---

## 🚨 Important Conventions & Rules

### DO NOT:
- ❌ Add Supabase back (we migrated away from it)
- ❌ Create backend endpoints (client-side only)
- ❌ Add environment variables for auth (hardcoded API URL)
- ❌ Store sensitive data in localStorage beyond JWT
- ❌ Modify core RNG algorithm (reproducibility requirement)
- ❌ Use hardcoded exam metadata in `generateTemplateSettings()` (use user input)
- ❌ Change `generateTemplateSettings()` back to positional parameters (use config object)
- ❌ Use `console.log()` directly for debugging (use logger utility instead)
- ❌ Log sensitive data (passwords, tokens, personal info)
- ❌ **CRITICAL**: Put business logic inside logger callbacks (`logger.group()`, `logger.time()`) - they get removed in production!

### DO:
- ✅ Use `src/lib/auth.ts` for all authentication
- ✅ Keep exam generation client-side
- ✅ Maintain deterministic RNG behavior
- ✅ Follow existing LaTeX marker format
- ✅ Use shadcn/ui components for UI
- ✅ Validate with Zod schemas
- ✅ Generate seed from user-provided metadata (coursecode, examname, term, examdate)
- ✅ Use config object pattern for functions with 5+ parameters
- ✅ Validate required fields in template dialog (UX best practice)
- ✅ Use logger utility for all debugging (`import { createLogger } from '@/lib/utils/logger'`)
- ✅ Create scoped loggers for modules (`const logger = createLogger('MODULE_NAME')`)
- ✅ Use appropriate log levels: debug for verbose, info for important, warn for issues, error for critical

### Code Style
- TypeScript with strict mode
- 2-space indentation
- PascalCase for components
- camelCase for functions/variables
- Named exports preferred
- Tailwind CSS for styling (use `cn` helper)

---

## 🔄 Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:8080)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Git Branches
- `main` - Production branch
- `new-feat` - Current feature branch (modified `Start.tsx`)

### Testing Flow
1. Go to `/auth`
2. Enter valid access code
3. Verify redirect to `/app`
4. Upload/generate template
5. Configure settings
6. Generate and download

---

## 🧪 Testing

### Test Coverage (Jan 6, 2026)

**Location**: `src/lib/core/__tests__/`

**Overall**: 138/138 tests passing (100%), Core business logic: **77.99% coverage**

#### ✅ `rng.test.ts` (33 tests) **NEW**
- **Deterministic Behavior** (4 tests)
  - Same seed produces same sequence
  - Different seeds produce different sequences
  - Reproducible shuffle across multiple calls
  - Consistent sequence after reset
- **Shuffle Function** (7 tests)
  - Array elements shuffled
  - All elements preserved (no loss)
  - No duplicates created
  - Handles strings, objects, arrays
  - Statistical bias test (no position favoring)
- **Invalid Inputs** (4 tests)
  - Empty arrays, single elements, two elements
  - Empty string seeds
- **Edge Cases** (6 tests)
  - Very long seeds, special characters, Unicode
  - Large arrays (1000+ elements)
  - Arrays with duplicate values
  - Numeric seed-like strings
- **Statistical Properties** (5 tests)
  - Values in [0, 1) range
  - Full range generation, uniform distribution
  - No sequential patterns, independence
- **Real-World Use Cases** (4 tests)
  - Exam question shuffling, option shuffling
  - Group shuffling, version consistency
- **Coverage**: 94.73% statements, 100% branches, 80% functions

#### ✅ `parser.test.ts` (15 tests) **NEW**
- **Valid Templates** (5 tests)
  - Simple MCQ with options
  - Open-ended questions (no options)
  - Settings block parsing
  - Preamble block parsing
- **Tag Parsing** (4 tests)
  - `fixed` tag
  - `fixed-options:B` with correct answer
  - `separate-page` tag
  - Multiple tags combined
- **Tag Validation** (3 tests)
  - Conflicting tags (fixed + fixed-options) error
  - Invalid tag name error
  - Missing correct answer letter for fixed-options
- **Edge Cases** (3 tests)
  - LaTeX math in question text
  - Multiple questions parsing
  - Multiline question text
- **Coverage**: 81.29% statements, 83.75% branches, 66.66% functions

#### ✅ `latex.test.ts` (22 tests) **NEW**
- **Valid Document Generation** (5 tests)
  - Complete LaTeX document structure
  - All versions included in output
  - Master exam included
  - Valid LaTeX syntax (begin/end pairs)
  - Exam settings in document
- **Cover Page** (3 tests)
  - Generate when includeCoverPage=true
  - Skip when includeCoverPage=false
  - Correct metadata in cover page
- **Page Count Calculation** (3 tests)
  - Page count per version
  - Detect page count variations
  - Add warning comment when variation detected
  - Return pageCountWarning in result
- **Separate-Page Questions** (2 tests)
  - Handle separate-page tag
  - Add \newpage before separate-page questions
- **Invalid Inputs** (2 tests)
  - Empty questions array
  - Empty versions array
- **Edge Cases** (7 tests)
  - Single version, large exams (20+ questions)
  - All open-ended questions
  - Preamble commands
  - Questions with LaTeX math
  - Many versions (10+)
- **Coverage**: 75.46% statements, 88.42% branches, 75% functions

#### ✅ `versioning.test.ts` (21 tests)
- **Standard Format** (5 tests)
  - Group shuffling behavior (standard grouping)
  - Question ordering within groups
  - Option shuffling (respects `fixedOptions`)
- **Parentheses Format (5)** (5 tests)
  - Group position shuffling
  - Questions keep order within group
  - Options shuffle within questions
  - Respects fixed tag
- **Bracket Format [5]** (4 tests) **NEW**
  - Group position shuffling
  - Questions shuffle within group
  - Options shuffle within questions
  - Respects fixed tag
- **Mixed Formats** (3 tests)
  - Standard + parentheses mix
  - Standard + brackets mix **NEW**
  - All three formats mixed **NEW**
- **Edge Cases** (4 tests)
  - Single group, all parentheses
  - Deterministic RNG behavior
  - Mapping generation
- **Coverage**: 66.85% statements, 85.96% branches, 60% functions

#### ✅ `settings.test.ts` (51 tests)
- **`getFormattedCurrentDate()`** (5 tests)
- **`getCurrentTerm()`** (17 tests)
- **`getDefaultSettings()`** (6 tests)
- **`generateSettingsBlock()`** (7 tests)
- **`generateTemplateSettings()`** (16 tests)
- **Coverage**: 100% statements, 100% branches, 100% functions

### Running Tests
```bash
npm test                    # Run all tests (138 tests)
npm test -- settings        # Run settings tests only (51 tests)
npm test -- versioning      # Run versioning tests only (21 tests)
npm test -- rng             # Run RNG tests only (33 tests)
npm test -- parser          # Run parser tests only (15 tests)
npm test -- latex           # Run LaTeX tests only (22 tests)
npm test -- --coverage      # Run with coverage report
```

### Test Framework
- **Vitest** - Fast, ESM-first test runner
- **vi.useFakeTimers()** - Time-based testing for date/term functions
- **beforeEach()** - Setup mock data for each test
- **describe/it** blocks - Organized test structure
- **AAA Pattern** - Arrange, Act, Assert

---

## 🎯 Future Work & Known Issues

### Potential Enhancements
1. **Token Refresh** - Auto-refresh JWT before expiration
2. **Remember Me** - Persistent login option
3. **Session Timeout** - Auto logout after inactivity
4. **Auth Context** - React Context for auth state
5. **Protected Route Component** - Reusable wrapper
6. **Offline Mode** - Service worker for offline exam generation
7. **Template Library** - Save/load custom templates
8. **Bulk Export** - Export individual PDFs per version

### Test Coverage Gaps (Future Work)
- ✅ ~~**Core Business Logic**~~ - **COMPLETED** (77.99% coverage, 138 tests)
  - ✅ RNG - 94.73% coverage (33 tests)
  - ✅ Parser - 81.29% coverage (15 tests)
  - ✅ LaTeX - 75.46% coverage (22 tests)
  - ✅ Settings - 100% coverage (51 tests)
  - ✅ Versioning - 66.85% coverage (21 tests)
- ❌ **Tag Validator** - `tag-validator.ts` utility tests
- ❌ **Page Count Analyzer** - `page-count-analyzer.ts` utility tests
- ❌ **CSV/Excel Parsers** - `csv-parser.ts`, `excel-parser.ts`, `adapter.ts` tests
- ❌ **Template Generators** - `csv-template.ts`, `excel-template.ts` tests
- ❌ **UI Components** - Template Dialog, File Upload, Details page tests
- ❌ **Integration Tests** - End-to-end user flows

### Known Patterns
- All auth state in `localStorage` (no Context yet)
- Page transitions managed by React Router
- Forms use React Hook Form + Zod
- Math rendering via KaTeX (not MathJax)

---

## 📞 Support & Contact

- **Auth API Issues**: mshahrani@kfupm.edu.sa
- **Access Codes**: Contact administrator
- **Technical Issues**: Check browser console, verify auth API is accessible

---

## 🧠 Quick Reference for AI Assistants

**When user asks to...**

- **Add authentication**: Use `src/lib/auth.ts`, NOT Supabase
- **Modify exam generation**: Check `src/lib/core/` files
- **Add UI components**: Use shadcn/ui pattern, Tailwind CSS
- **Change LaTeX format**: Update `src/lib/core/latex.ts`
- **Add CSV/Excel parsing**: Check `src/lib/parsers/` files
- **Add template generators**: Check `src/lib/generators/` files
- **Add question tags**: Update `VALID_TAGS` in `src/lib/utils/tag-validator.ts` and modify `validateQuestionTags()`
- **Fix auth issues**: Check JWT token in localStorage, verify API
- **Deploy**: Build with `npm run build`, deploy `dist/` folder
- **Modify template dialog**: Update `src/components/ui/template-dialog.tsx`
- **Change template generation**: Update `generateTemplate()` in `src/pages/Start.tsx`
- **Modify seed generation**: Check `generateTemplateSettings()` in `src/lib/core/settings.ts`
- **Add debugging/logging**: Use logger utility (see examples below)

**Common File Locations**:
- Auth logic: `src/lib/auth.ts`
- Logger utility: `src/lib/utils/logger.ts`
- Tag validator: `src/lib/utils/tag-validator.ts`
- Exam generation: `src/lib/core/*.ts`
- Input parsers: `src/lib/parsers/*.ts`
- Template generators: `src/lib/generators/*.ts`
- Template dialog: `src/components/ui/template-dialog.tsx`
- UI components: `src/components/ui/*.tsx`
- Page routes: `src/pages/*.tsx`
- Type definitions: `src/lib/types.ts`

**Template Generation Flow**:
1. User clicks "Download LaTeX/CSV/Excel Template" → Opens `TemplateDialog`
2. User fills: coursecode, examname, examdate, term → Required fields
3. User configures: numQuestions, includeImageQuestion (LaTeX only), includeCoverPage → Optional settings
4. Click "Generate Template" → Calls `generateTemplate(format, ...)` in `Start.tsx`
5. `generateTemplateSettings()` creates settings → Generates seed from metadata
6. Routes to correct generator based on format:
   - LaTeX: `generateLatexTemplate()` creates .tex file
   - CSV: `generateCSVTemplate()` creates .csv file
   - Excel: `generateExcelTemplate()` creates .xlsx blob
7. Downloads to user

**File Upload Flow** (CSV/Excel):
1. User uploads .csv or .xlsx file → `handleFileSelected()` in `Start.tsx`
2. Format detected by file extension
3. Routes to correct parser:
   - CSV: `parseCSV()` → Returns `ParsedCSVData`
   - Excel: `parseExcel()` → Returns `ParsedExcelData`
4. `convertToLatexFormat()` adapter converts to `ParsedLatexTemplate`
5. Groups validation if present: `validateGroupsMatchQuestions()`
6. `createExamFromTemplate()` creates `ExamJSON`
7. Preview card shows parsed data
8. User proceeds to Details page

---

## 🔍 Logger Usage Examples

The logger utility (`src/lib/utils/logger.ts`) provides safe, production-ready logging.

### Basic Usage:

```typescript
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('MY_MODULE');

// Different log levels (dev only, except error)
logger.debug('Detailed debug info', { data });
logger.info('Important milestone reached');
logger.warn('Something unexpected happened');
logger.error('Critical error!'); // Always shown, even in production
```

### ⚠️ CRITICAL: Never Put Business Logic Inside Logger Callbacks

**WRONG** - Business logic inside callbacks (breaks in production):
```typescript
const generateTemplate = () => {
  logger.time('Template Generation', () => {
    // ❌ ALL THIS CODE DISAPPEARS IN PRODUCTION!
    const template = createTemplate();
    downloadFile(template);
  });
};
```

**CORRECT** - Business logic outside, only logging inside:
```typescript
const generateTemplate = () => {
  logger.debug('Starting template generation');

  // ✅ Business logic at function scope
  const template = createTemplate();
  downloadFile(template);

  logger.info('Template generated successfully');
};
```

**Rule**: Logger callbacks (`logger.group()`, `logger.time()`) should **ONLY** contain logger statements, never business logic. In production, everything inside these callbacks is removed by tree-shaking.

### Grouped Logs:

```typescript
logger.group('Processing Data', () => {
  logger.debug('Step 1: Loading data');
  logger.debug('Step 2: Validating data');
  logger.info('Processing complete');
});
```

### Performance Timing:

```typescript
logger.time('Expensive Operation', () => {
  // ... complex operation
});
// Output: Expensive Operation: 125.43ms
```

### Table View:

```typescript
logger.table([
  { id: 1, name: 'Question 1', type: 'MCQ' },
  { id: 2, name: 'Question 2', type: 'Fixed' }
]);
```

### Production Behavior:

- **Development** (`npm run dev`): All logs visible
- **Production** (`npm run build`): Only `error()` logs visible, all others removed by tree-shaking
- **Zero runtime cost**: Debug logs don't exist in production bundle

### Current Implementations:

- **Template Dialog**: Form validation, dialog events
- **Settings**: Seed generation, configuration
- **Start Page**: Template generation with timing

---

**End of CLAUDE.MD**
