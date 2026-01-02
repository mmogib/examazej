# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-02

### Added
- **CSV Input Format Support**
  - Parse CSV files with 4 sections: settings, instructions, preamble, questions
  - Section-based format with `# settings`, `# instructions`, `# preamble`, `# questions` markers
  - Strict validation with detailed error messages including line numbers
  - LaTeX math support in CSV cells using `$...$` syntax
- **Excel Input Format Support**
  - Parse Excel (.xlsx) files with 4 sheets: Settings, Instructions, Preamble, Questions
  - Sheet names are case-insensitive for flexibility
  - Key-value settings format in Settings sheet
  - LaTeX math support in Excel cells
- **CSV Template Generator**
  - Download pre-filled CSV templates with user metadata
  - Plain text instructions (one per line)
  - Automatic conversion to LaTeX format on upload
- **Excel Template Generator**
  - Download pre-filled Excel templates with user metadata
  - 4 sheets with examples and proper formatting
  - Plain text instructions in Instructions sheet
- **Template Dialog Enhancements**
  - Multi-format support (LaTeX, CSV, Excel)
  - Format-specific help text and options
  - Conditional rendering of format-specific toggles
- **File Upload Preview**
  - Preview card showing parsed data after upload
  - Display question count, course code, exam name
  - Shows instructions and preamble status
- **Adapter Pattern**
  - Seamless conversion of CSV/Excel data to LaTeX format
  - Zero impact on existing LaTeX functionality
  - Automatic wrapping of instructions in LaTeX environments
- **Documentation**
  - CSV format documentation with examples
  - Excel format documentation with 4-sheet structure
  - Search support for CSV/Excel keywords
  - Template download instructions

### Fixed
- Image question toggle now only shows for LaTeX format (hidden for CSV/Excel)
- Template generators now use requested question count instead of hardcoded examples
- Error state clears when file is removed from upload
- Same filename can be re-uploaded after fixing errors (file input value reset)
- CSV/Excel instructions now properly wrapped in `\begin{enumerate}\begin{normalsize}...\end{normalsize}\end{enumerate}` environments
- Default instructions used when CSV/Excel has no instructions section

### Changed
- Template dialog now supports three formats instead of one
- File upload component accepts `.tex`, `.csv`, `.xlsx`, `.json` files
- `generateTemplate()` function signature updated with format as first parameter
- Start page UI reorganized with three template download sections

## [1.2.1] - 2025-12-30

### Added
- Safe logger utility with environment-based logging
- Scoped loggers for modules (SETTINGS, START_PAGE, TEMPLATE_DIALOG)
- Performance timing with `logger.time()`
- Grouped logs with `logger.group()`

### Changed
- Template dialog collects user metadata (coursecode, examname, examdate, term)
- Seed generation uses user-provided metadata instead of hardcoded defaults
- `generateTemplateSettings()` uses config object pattern instead of positional parameters

## [1.2.0] - 2025-12-XX

### Added
- Custom JWT-based authentication via Hono API
- Airtable backend for user management

### Removed
- Supabase authentication entirely
- All Supabase-related dependencies and files

## [1.1.0] - 2025-XX-XX

### Added
- Initial release with LaTeX template support
- Multiple question types (regular, fixed, fixed-options, open-ended, separate-page, image)
- Question groups with shuffle control
- Deterministic seed-based randomization
- Answer key generation
- Version tracking with CSV mapping
- Overleaf integration

---

## Version Guidelines

- **MAJOR** version (X.0.0) - Incompatible API changes
- **MINOR** version (1.X.0) - New features, backward compatible
- **PATCH** version (1.2.X) - Bug fixes, backward compatible

[1.3.0]: https://github.com/yourusername/exam-shuffler/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/yourusername/exam-shuffler/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/yourusername/exam-shuffler/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yourusername/exam-shuffler/releases/tag/v1.1.0
