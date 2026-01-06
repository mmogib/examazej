# Test Coverage Report - MC Exam Randomizer
**Date:** January 6, 2026
**Version:** 1.4.0 (with square bracket grouping feature)

---

## Executive Summary

### Current Test Status
- ✅ **Total Test Files:** 2
- ✅ **Total Tests:** 72 (51 settings + 21 versioning)
- ✅ **Pass Rate:** 100%
- ⚠️ **Coverage:** Partial (core logic only)

### Test Categories
1. **Unit Tests:** ✅ Complete for core modules
2. **Integration Tests:** ❌ Not implemented
3. **E2E Tests:** ❌ Not implemented
4. **UI Component Tests:** ❌ Not implemented

---

## 1. Tested Modules (✅ Complete Coverage)

### 1.1 Core Logic - Settings (`src/lib/core/settings.ts`)
**File:** `src/lib/core/__tests__/settings.test.ts`
**Tests:** 51 tests across 5 describe blocks

#### Coverage Breakdown:
- ✅ **`getFormattedCurrentDate()`** - 5 tests
  - All months formatting
  - Day padding (single/double digit)
  - Year formatting

- ✅ **`getCurrentTerm()`** - 17 tests
  - Fall term (Aug 15 - Jan 31) → suffix `1`
  - Spring term (Feb 1 - Jun 14) → suffix `2`
  - Summer term (Jun 15 - Aug 14) → suffix `3`
  - Year transitions
  - Edge cases (term boundaries)

- ✅ **`getDefaultSettings()`** - 6 tests
  - Required fields presence
  - Default values
  - Dynamic date/term generation
  - Instructions text

- ✅ **`generateSettingsBlock()`** - 7 tests
  - LaTeX format correctness
  - actualVersions parameter
  - includeCoverPage flag
  - Seed inclusion/omission
  - Multi-line instructions

- ✅ **`generateTemplateSettings()`** - 16 tests
  - User metadata handling
  - Default university/department
  - Group configuration
  - includeCoverPage default/override
  - Seed generation (deterministic, unique)
  - Complete ExamSettings structure

**Verdict:** ✅ **Comprehensive** - All functions fully tested with edge cases

---

### 1.2 Core Logic - Versioning (`src/lib/core/versioning.ts`)
**File:** `src/lib/core/__tests__/versioning.test.ts`
**Tests:** 21 tests across 7 describe blocks

#### Coverage Breakdown:
- ✅ **Standard Format (no brackets)** - 2 tests
  - Groups stay in original order
  - Questions shuffle within groups

- ✅ **Parentheses Format `(5)`** - 3 tests
  - Groups shuffle positions
  - Questions keep order within groups
  - Options still shuffle

- ✅ **Bracket Format `[5]`** - 4 tests *(NEW - just added)*
  - Groups shuffle positions
  - Questions shuffle within groups
  - Options shuffle
  - Fixed tag respected

- ✅ **Mixed Format** - 4 tests
  - `5,(10),(5)` handling
  - `5,(5),[5],5` all three modes
  - Group 1 questions shuffled
  - Groups 2-3 swap positions

- ✅ **Mapping Generation** - 2 tests
  - Correct group numbers
  - Correct mapping count

- ✅ **Edge Cases** - 4 tests
  - Single parenthesized group
  - All groups with parentheses
  - fixedOptions respected

- ✅ **Deterministic Behavior** - 2 tests
  - Same seed → same results
  - Different seeds → different results

**Verdict:** ✅ **Comprehensive** - All grouping modes tested including new `[5]` syntax

---

## 2. Untested Modules (❌ No Coverage)

### 2.1 Critical Business Logic

#### **`src/lib/core/parser.ts`** ⚠️ HIGH PRIORITY
**Functions:**
- `parseLatexTemplate()` - LaTeX marker parsing
- Tag regex validation
- Question/option extraction
- Error collection

**Risks:**
- Incorrect parsing breaks entire flow
- Tag validation bugs could allow invalid data
- Error messages might be unclear

**Recommended Tests:**
```
✓ Valid LaTeX template parsing
✓ Invalid markers (missing %{/question}, etc.)
✓ Tag validation (fixed, fixed-options, separate-page)
✓ Tag conflicts (fixed + fixed-options)
✓ Multiple questions with tags
✓ Edge case: Empty template
✓ Edge case: Malformed options
✓ Edge case: Missing correct answer marker (*)
```

---

#### **`src/lib/core/latex.ts`** ⚠️ HIGH PRIORITY
**Functions:**
- `generateLatexDocument()` - Complete LaTeX generation
- `generateCoverPage()` - Cover page rendering
- `generateMasterAndVersions()` - Master + versions
- Page count calculation per version

**Risks:**
- LaTeX syntax errors break compilation
- Page count warnings not triggered
- Cover page formatting issues

**Recommended Tests:**
```
✓ Complete document generation
✓ Page count calculation (per version)
✓ Page count variation detection
✓ Warning comment block insertion
✓ Cover page generation (with/without)
✓ Master exam generation
✓ Version generation (multiple versions)
✓ Separate-page questions
✓ Edge case: No questions
✓ Edge case: Single version
```

---

#### **`src/lib/core/rng.ts`** ⚠️ MEDIUM PRIORITY
**Class:** `DeterministicRNG`
**Methods:**
- Constructor (seed parsing)
- `next()` - LCG implementation
- `shuffle()` - Fisher-Yates algorithm

**Risks:**
- Non-deterministic behavior breaks reproducibility
- Shuffle bias could favor certain positions

**Recommended Tests:**
```
✓ Deterministic: same seed → same sequence
✓ Deterministic: different seeds → different sequences
✓ Shuffle: no bias (statistical test)
✓ Shuffle: all permutations possible
✓ Shuffle: empty array handling
✓ Shuffle: single element array
✓ Edge case: Extreme seed values
```

---

### 2.2 Parser Modules

#### **`src/lib/parsers/csv-parser.ts`** ⚠️ HIGH PRIORITY
**Functions:**
- `parseCSV()` - Main parser
- `splitIntoSections()` - Section splitting
- `parseSettingsSection()` - Settings validation
- `parseQuestionsSection()` - Question table parsing

**Risks:**
- Invalid CSV causes crash
- Type validation missing
- Multiline handling breaks

**Recommended Tests:**
```
✓ Valid CSV with all sections
✓ Valid CSV with only questions
✓ Invalid: Missing questions section
✓ Invalid: Malformed settings
✓ Invalid: Wrong column count
✓ Multiline fields (escaped newlines)
✓ Math equations ($...$)
✓ Tag parsing (fixed, fixed-options, separate-page)
✓ Edge case: Empty file
✓ Edge case: BOM handling
```

---

#### **`src/lib/parsers/excel-parser.ts`** ⚠️ HIGH PRIORITY
**Functions:**
- `parseExcel()` - Main parser
- `parseSettingsSheet()` - Key-value pairs
- `parseQuestionsSheet()` - Table parsing

**Risks:**
- xlsx library errors
- Sheet name case sensitivity
- Empty cells mishandled

**Recommended Tests:**
```
✓ Valid Excel with all 4 sheets
✓ Valid Excel with only Questions sheet
✓ Invalid: Missing Questions sheet
✓ Invalid: Malformed settings
✓ Invalid: Wrong column count
✓ Case-insensitive sheet names
✓ Empty cells handling
✓ Math equations in cells
✓ Tag parsing
✓ Edge case: Corrupted file
```

---

#### **`src/lib/parsers/adapter.ts`** ⚠️ MEDIUM PRIORITY
**Functions:**
- `extractPlainInstructions()` - LaTeX → Plain text
- `convertToLatexFormat()` - CSV/Excel → LaTeX
- `validateGroupsMatchQuestions()` - Group validation

**Risks:**
- Instruction extraction fails
- Group validation allows mismatches
- Conversion loses data

**Recommended Tests:**
```
✓ Extract instructions from LaTeX
✓ Handle missing instructions
✓ Convert CSV data to LaTeX format
✓ Convert Excel data to LaTeX format
✓ Validate groups match question count
✓ Validate with brackets: (5),[5]
✓ Invalid: Sum mismatch
✓ Edge case: No groups provided
```

---

### 2.3 Generator Modules

#### **`src/lib/generators/csv-template.ts`** ⚠️ LOW PRIORITY
**Functions:**
- `generateCSVTemplate()` - Template creation
- `convertMultilineFieldsToEscapedNewlines()` - Escaping

**Recommended Tests:**
```
✓ Generate template with user metadata
✓ Generate correct number of questions
✓ Multiline field escaping
✓ Edge case: numQuestions = 0
```

---

#### **`src/lib/generators/excel-template.ts`** ⚠️ LOW PRIORITY
**Functions:**
- `generateExcelTemplate()` - .xlsx creation

**Recommended Tests:**
```
✓ Generate template with 4 sheets
✓ Generate correct number of questions
✓ Sheet structure validation
✓ Edge case: numQuestions = 0
```

---

### 2.4 Utility Modules

#### **`src/lib/utils/tag-validator.ts`** ⚠️ HIGH PRIORITY
**Functions:**
- `validateQuestionTags()` - Tag validation
- `VALID_TAGS` - Allowed tags

**Risks:**
- Invalid tags accepted
- Conflict detection fails

**Recommended Tests:**
```
✓ Valid tags: fixed, fixed-options, separate-page
✓ Invalid tags: unknown tags rejected
✓ Conflict: fixed + fixed-options
✓ Case sensitivity
✓ Empty tag string
✓ Whitespace handling
✓ Multiple valid tags
✓ Context in error messages
```

---

#### **`src/lib/utils/page-count-analyzer.ts`** ⚠️ MEDIUM PRIORITY
**Functions:**
- `detectPageCountVariations()` - Variation detection
- `formatPageCountWarning()` - Warning formatting

**Risks:**
- False positives/negatives
- Recommendations incorrect

**Recommended Tests:**
```
✓ Detect variation (different page counts)
✓ No variation (same page counts)
✓ Format warning message
✓ Generate recommendations
✓ Edge case: Single version
✓ Edge case: All same page count
```

---

#### **`src/lib/utils/seed-generator.ts`** ⚠️ LOW PRIORITY
**Functions:**
- `generateDynamicSeed()` - Seed generation
- `isDefaultSeed()` - Default check

**Recommended Tests:**
```
✓ Generate unique seeds
✓ Deterministic (same input → same seed)
✓ Detect default seeds
✓ Handle special characters
```

---

#### **`src/lib/utils/logger.ts`** ⚠️ LOW PRIORITY
**Functions:**
- `createLogger()` - Logger creation
- Various log levels

**Recommended Tests:**
```
✓ Logger only logs in dev mode
✓ Logger.error always logs
✓ Scoped loggers work
✓ Grouped logs work
```

---

### 2.5 UI Components (❌ No Tests)

#### **Critical UI Components** ⚠️ MEDIUM PRIORITY
- `src/pages/Start.tsx` - File upload, template generation
- `src/pages/Details.tsx` - Settings configuration
- `src/pages/Results.tsx` - Download, warnings
- `src/components/ui/template-dialog.tsx` - Template form
- `src/components/ui/file-upload.tsx` - File handling

**Recommended Approach:**
- Use React Testing Library
- Test user interactions
- Mock file uploads
- Validate form submissions

---

### 2.6 Authentication (❌ No Tests)

#### **`src/lib/auth.ts`** ⚠️ MEDIUM PRIORITY
**Functions:**
- `verifyCode()` - Login
- `getCurrentUser()` - Token validation
- `signOut()` - Logout
- `isAuthenticated()` - Auth check

**Risks:**
- Token expiration not handled
- Invalid tokens accepted

**Recommended Tests:**
```
✓ Verify valid code
✓ Verify invalid code
✓ Get current user (valid token)
✓ Get current user (expired token)
✓ Get current user (no token)
✓ Sign out clears localStorage
✓ isAuthenticated checks token
```

---

## 3. Test Coverage Goals

### Priority 1: Critical Business Logic (Next 2 Weeks)
1. ✅ **Parser Tests** (`parser.test.ts`)
   - LaTeX template parsing
   - Tag validation
   - Error handling

2. ✅ **LaTeX Generator Tests** (`latex.test.ts`)
   - Document generation
   - Page count calculation
   - Warning system

3. ✅ **RNG Tests** (`rng.test.ts`)
   - Deterministic behavior
   - Shuffle correctness

### Priority 2: Input/Output (Next Month)
4. ✅ **CSV Parser Tests** (`csv-parser.test.ts`)
5. ✅ **Excel Parser Tests** (`excel-parser.test.ts`)
6. ✅ **Adapter Tests** (`adapter.test.ts`)
7. ✅ **Tag Validator Tests** (`tag-validator.test.ts`)

### Priority 3: Integration Tests (Future)
8. ✅ **End-to-End Flow**
   - Upload → Parse → Configure → Generate → Download
9. ✅ **UI Component Tests**
   - Form validation
   - File upload
   - Error states

### Priority 4: Edge Cases (Future)
10. ✅ **Stress Tests**
    - Large exams (100+ questions)
    - Many versions (26 versions)
    - Complex groupings

---

## 4. Recommended Testing Tools

### Current Stack
- ✅ **Vitest** - Fast, ESM-first
- ✅ **vi.useFakeTimers()** - Date mocking

### Additions Needed
- 📦 **React Testing Library** - UI components
- 📦 **@testing-library/user-event** - User interactions
- 📦 **MSW (Mock Service Worker)** - API mocking for auth tests
- 📦 **Playwright/Cypress** - E2E tests (optional)

---

## 5. Test Coverage Metrics (Estimated)

| Module Category | Files | Tested | Coverage % |
|----------------|-------|--------|------------|
| **Core Logic** | 5 | 2 | 40% |
| **Parsers** | 3 | 0 | 0% |
| **Generators** | 2 | 0 | 0% |
| **Utils** | 5 | 0 | 0% |
| **UI Components** | 50+ | 0 | 0% |
| **Auth** | 1 | 0 | 0% |
| **TOTAL** | ~66 | 2 | **~3%** |

**Target Coverage:** 80% for business logic, 60% for UI

---

## 6. Known Test Gaps (By Priority)

### 🔴 Critical (Immediate Attention)
1. ❌ **Parser tag validation** - Could accept invalid tags
2. ❌ **LaTeX generation** - Could produce invalid LaTeX
3. ❌ **CSV/Excel parsing** - Could crash on invalid input

### 🟡 High (Next Sprint)
4. ❌ **Tag validator edge cases** - Conflicts not detected
5. ❌ **Page count analyzer** - False warnings
6. ❌ **Adapter validation** - Group mismatches allowed

### 🟢 Medium (Future)
7. ❌ **RNG determinism** - Not verified statistically
8. ❌ **Template generators** - Output not validated
9. ❌ **Auth flow** - Token handling not tested

### 🔵 Low (Nice to Have)
10. ❌ **UI components** - No interaction tests
11. ❌ **Seed generator** - Uniqueness not verified
12. ❌ **Logger** - Dev/prod behavior not tested

---

## 7. Next Steps

### Immediate Actions (This Week)
1. ✅ Create test files:
   - `src/lib/core/__tests__/parser.test.ts`
   - `src/lib/core/__tests__/latex.test.ts`
   - `src/lib/core/__tests__/rng.test.ts`

2. ✅ Write critical path tests:
   - LaTeX parsing (valid + invalid)
   - Document generation
   - Deterministic RNG

### Short Term (Next 2 Weeks)
3. ✅ Parser tests (CSV, Excel, Adapter)
4. ✅ Validator tests (Tag validator)
5. ✅ Update CLAUDE.md with test expectations

### Medium Term (Next Month)
6. ✅ UI component tests (Start, Details, Results)
7. ✅ Integration tests (full workflow)
8. ✅ Auth tests (login, token validation)

---

## 8. Coverage Improvement Strategy

### Phase 1: Core Logic (80% coverage target)
- Focus on `src/lib/core/`
- All parsing and generation logic
- All utility functions

### Phase 2: Input/Output (60% coverage target)
- CSV/Excel parsers
- Template generators
- Adapters and validators

### Phase 3: UI (40% coverage target)
- Critical user flows
- Form validation
- Error states

### Phase 4: E2E (Happy path + critical errors)
- Upload template → Download exam
- Error scenarios (invalid files, etc.)

---

## 9. Test Quality Metrics

### Current Test Quality: ⭐⭐⭐⭐⭐ Excellent
- ✅ Descriptive test names
- ✅ Clear arrange-act-assert structure
- ✅ Edge cases covered
- ✅ Deterministic (no flaky tests)
- ✅ Fast execution (<3s for 72 tests)

### Improvements Needed:
- 📝 Add code coverage thresholds in `vite.config.ts`
- 📝 Add test documentation
- 📝 Add test data fixtures
- 📝 Add visual regression tests (optional)

---

## 10. Conclusion

### Strengths
✅ **Core logic well-tested** - Settings and versioning have comprehensive coverage
✅ **New features tested immediately** - Square bracket syntax tested on implementation
✅ **High test quality** - Clear, maintainable tests

### Weaknesses
❌ **Parser logic untested** - High-risk gap
❌ **LaTeX generation untested** - Could produce invalid output
❌ **No UI tests** - User experience not validated
❌ **No integration tests** - End-to-end flow not verified

### Overall Assessment
**Current Coverage:** ~3%
**Recommended Coverage:** 80% for business logic, 60% overall
**Risk Level:** 🔴 HIGH - Critical paths untested

### Recommendation
**Immediate action required** on parser and LaTeX generator tests to reduce production risk. UI and integration tests can follow in subsequent sprints.

---

**Report Generated:** January 6, 2026
**Next Review:** After Priority 1 tests completed
