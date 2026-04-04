# Test Coverage Details

**As of**: Jan 6, 2026
**Overall**: 138/138 tests passing, 77.99% core business logic coverage

---

## Coverage by File

| File | Statements | Branches | Functions | Tests |
|------|-----------|----------|-----------|-------|
| `settings.ts` | 100% | 100% | 100% | 51 |
| `rng.ts` | 94.73% | 100% | 80% | 33 |
| `parser.ts` | 81.29% | 83.75% | 66.66% | 15 |
| `latex.ts` | 75.46% | 88.42% | 75% | 22 |
| `versioning.ts` | 66.85% | 85.96% | 60% | 21 |

## Test Breakdown

### `settings.test.ts` (51 tests)
- `getFormattedCurrentDate()` (5), `getCurrentTerm()` (17), `getDefaultSettings()` (6)
- `generateSettingsBlock()` (7), `generateTemplateSettings()` (16)

### `rng.test.ts` (33 tests)
- Deterministic behavior (4), Shuffle correctness (7), Invalid inputs (4)
- Edge cases (6), Statistical properties (5), Real-world use cases (4)

### `latex.test.ts` (22 tests)
- Document generation (5), Cover page (3), Page count calculation (3)
- Separate-page questions (2), Invalid inputs (2), Edge cases (7)

### `versioning.test.ts` (21 tests)
- Standard format (5), Parentheses format (5), Bracket format (4)
- Mixed formats (3), Edge cases (4)

### `parser.test.ts` (15 tests)
- Valid templates (5), Tag parsing (4), Tag validation (3), Edge cases (3)

## Untested Areas

- `tag-validator.ts`, `page-count-analyzer.ts`
- `csv-parser.ts`, `excel-parser.ts`, `adapter.ts`
- `csv-template.ts`, `excel-template.ts`
- UI components, integration tests
