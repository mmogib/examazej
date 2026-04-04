# Planning & Discussion Notes

**Last Updated**: 2026-04-04

---

## Current Status

- **Version**: 1.5.0
- **Branch**: `new-feat`
- **Tests**: 138/138 passing, 77.99% core coverage
- **Last major work**: Jan 6, 2026 (square bracket grouping, test suite)

## Open Items

### Testing Gaps
- [ ] `tag-validator.ts` -- unit tests
- [ ] `page-count-analyzer.ts` -- unit tests
- [ ] `csv-parser.ts`, `excel-parser.ts`, `adapter.ts` -- parser tests
- [ ] `csv-template.ts`, `excel-template.ts` -- generator tests
- [ ] UI component tests (template dialog, file upload, details page)
- [ ] Integration / E2E tests

### Potential Enhancements
- [ ] Token refresh (auto-refresh JWT before expiration)
- [ ] Remember me / persistent login
- [ ] Session timeout (auto logout after inactivity)
- [ ] Auth Context (React Context for auth state)
- [ ] Protected Route component (reusable wrapper)
- [ ] Offline mode (service worker for offline generation)
- [ ] Template library (save/load custom templates)
- [ ] Bulk export (individual PDFs per version)

---

## Discussion Log

_Use this section to capture decisions, trade-offs, and context from planning sessions._

### 2026-04-04 -- Project Review
- Trimmed CLAUDE.md from ~1215 lines to ~120 lines
- Created notes/ folder for planning and detailed references
- Moved verbose LaTeX/CSV/Excel format docs, test coverage details, and logger guide to notes/
