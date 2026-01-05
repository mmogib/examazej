# CLAUDE.MD - AI Assistant Context

**Last Updated**: 2026-01-05
**Purpose**: Provide context for AI assistants working on this project

---

## 📅 Next Session Agenda (Jan 6, 2026)

### Priority 1: Revisit Question Groupings & Enhancements
- Review current grouping syntax (`"5,10,15"` and `"(5),10,(15)"`)
- Discuss potential improvements or pain points
- Consider enhancements:
  - More flexible grouping syntax?
  - Better validation and error messages?
  - UI improvements for group configuration?
  - Edge case handling?

### Priority 2: Write Tests
- **Tag Validation Tests** (`tag-validator.test.ts`)
  - Valid/invalid tags, conflict detection, normalization
  - Context in error messages
- **Page Count Analyzer Tests** (`page-count-analyzer.test.ts`)
  - Detection logic, recommendations, edge cases
- **Parser Tag Handling Tests** (update `parser.test.ts`)
  - Tag regex correctness, multiple tags, error handling

### Priority 3: End-to-End Testing (If Time)
- Test tag system across all input formats
- Verify warning UI behavior
- Integration testing

---

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
Users configure groups like `"5,10,15"` or `"(5),10,(15)"`
- Numbers in parentheses `(5)` → Don't shuffle this group
- Regular numbers `10` → Shuffle this group
- Creates balanced exam sections

### LaTeX Markers
```latex
%% Question: Regular
What is 2 + 2?
%% Option:
Three
%% Option: *
Four (asterisk marks correct answer)
%% Option:
Five
%% End Question
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

### Test Coverage (Dec 30, 2025)

**Location**: `src/lib/core/__tests__/`

#### ✅ `versioning.test.ts` (16 tests)
- Group shuffling behavior (standard, parentheses, mixed formats)
- Question ordering within groups
- Option shuffling (respects `fixedOptions`)
- Mapping generation
- Deterministic RNG behavior
- Edge cases (single group, all parentheses)

#### ✅ `settings.test.ts` (51 tests) **NEW**
- **`getFormattedCurrentDate()`** (5 tests)
  - Date formatting for various months/days
  - Zero-padding for single-digit days
- **`getCurrentTerm()`** (17 tests)
  - Fall term (Aug 15 - Jan 31): suffix `1`
  - Spring term (Feb 1 - Jun 14): suffix `2`
  - Summer term (Jun 15 - Aug 14): suffix `3`
  - Year transitions and edge cases
- **`getDefaultSettings()`** (6 tests)
  - Required fields presence
  - Default values correctness
  - Dynamic date/term generation
  - Instructions text inclusion
- **`generateSettingsBlock()`** (7 tests)
  - LaTeX format correctness
  - `actualVersions` parameter handling
  - `includeCoverPage` flag (yes/no)
  - Seed inclusion/omission
  - Multi-line instructions formatting
- **`generateTemplateSettings()`** (16 tests)
  - User-provided metadata handling
  - Default university/department
  - Group configuration from `numQuestions`
  - `includeCoverPage` default and override
  - Hardcoded defaults (numbering, versions, etc.)
  - Seed generation (deterministic, unique)
  - Complete `ExamSettings` object structure

### Running Tests
```bash
npm test                    # Run all tests
npm test -- settings.test   # Run settings tests only
npm test -- versioning.test # Run versioning tests only
```

### Test Framework
- **Vitest** - Fast, ESM-first test runner
- **vi.useFakeTimers()** - Time-based testing for date/term functions
- **Snapshot testing** - Not currently used, but available if needed

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
- ❌ **Template Dialog** - UI component tests (form validation, touch-based errors)
- ❌ **Start.tsx** - `generateTemplate()` function and integration
- ❌ **LaTeX Generation** - `generateLatexTemplate()` output validation
- ❌ **Parser** - LaTeX template parsing edge cases
- ❌ **Separate-Page** - `keepOnSeparatePage` pagination logic

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
