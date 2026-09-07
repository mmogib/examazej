# Academic Integrity Pledge Design

## Summary

Examazej will optionally place an editable academic-integrity pledge on every student-version cover page. The feature is enabled by default, uses department-approved text by default, and remains independent of the existing cover-page option. The heading and signature line are fixed; instructors may edit only the pledge paragraph.

## Goals

- Add the pledge shown in the department's reference cover to every generated student-version cover by default.
- Let departments and instructors disable the pledge without disabling the cover page.
- Let instructors edit the pledge paragraph through a compact popup editor.
- Preserve the setting and text across LaTeX, CSV, and Excel templates.
- Keep existing templates valid and give them the new default behavior.
- Fit the pledge and existing cover content on one page.

## Non-goals

- Do not add the pledge to the instructor-only master cover or question-page headers.
- Do not make the heading or signature line editable.
- Do not support rich text or user-provided LaTeX in the pledge.
- Do not change the master cover, shuffling logic, or unrelated cover content.

## Default Content

The fixed heading is:

> Academic Integrity Pledge:

The default editable paragraph is:

> I pledge that I do not possess any mobile phone, smartwatch, earphones, or any other communication or smart devices, nor any written or printed material within my reach during this examination. I understand that possession of such devices or material will result in disciplinary action as per university policy.

The fixed signature label is `Signature:` followed by a horizontal signing line.

## Settings Model

Add two required fields to `ExamSettings`:

```ts
includeAcademicIntegrityPledge: boolean;
academicIntegrityPledgeText: string;
```

`getDefaultSettings()` sets the boolean to `true` and the text to the approved paragraph. Keeping visibility and content separate preserves an instructor's customized text when the pledge is temporarily disabled.

The pledge is one logical paragraph. The editor may wrap visually, but line breaks entered by a user are normalized to spaces when saved. Leading and trailing whitespace is trimmed. This gives all supported template formats a readable, single-line setting and avoids format-specific multiline encodings.

## User Interface

### Exam Details

Add a compact pledge row directly below the existing **Include Cover Pages** row:

- **Include Academic Integrity Pledge** switch.
- Short description: the pledge and signature line are added to student covers.
- Small outlined **Edit pledge** button with an edit icon, visible only while the pledge is enabled.

When cover pages are disabled, the pledge switch is disabled and the edit button is hidden. The pledge's saved boolean and text are retained rather than reset.

### New Example Template

Add the same pledge switch and **Edit pledge** button to the template-generation dialog. Both cover and pledge switches default to enabled. This is necessary because this flow downloads a template directly and does not first visit the Exam Details page.

### Pledge Editor

Use one reusable editor-dialog component from both entry points. The dialog contains:

- Title: **Academic Integrity Pledge**.
- Explanatory text that the heading and signature line are fixed.
- A plain multiline textarea containing the editable paragraph.
- **Reset to default**, **Cancel**, and **Save** actions.

The dialog edits a local draft. **Save** trims the value and normalizes whitespace before updating the parent settings. **Cancel**, closing the dialog, or pressing Escape discards the draft. **Reset to default** changes the draft to the approved paragraph; the parent value changes only after **Save**.

If the normalized draft is empty, **Save** remains disabled and an inline message tells the user to enter pledge text or disable the pledge. This prevents a cover containing only a heading and signature line.

## Data Flow and Persistence

The two settings travel through the existing settings flow:

1. Default settings initialize new exams and provide fallback values.
2. The template dialog passes its selected boolean and text to `generateTemplateSettings()`.
3. LaTeX, CSV, and Excel generators serialize both settings.
4. Their corresponding parsers recognize the fields and parse the boolean with the same conventions as `includeCoverPage`.
5. The existing default-plus-parsed-settings merge restores defaults when an older LaTeX, CSV, or Excel template omits either field.
6. Imported JSON is normalized through the same default-settings merge before it enters the Details page, covering legacy JSON files that lack the new fields.
7. The Details page edits the complete settings object.
8. LaTeX generation reads the final settings and renders the pledge only when both `includeCoverPage` and `includeAcademicIntegrityPledge` are true.

The serialized field names are exactly `includeAcademicIntegrityPledge` and `academicIntegrityPledgeText`. The generated text value is single-line plain text. Because the CSV parser takes everything after the first comma as the value, punctuation commas remain intact.

## Student Cover Generation

Within the existing `\newcodecover` command, render this order:

1. University and department.
2. Version-code boxes and exam metadata.
3. Fixed, underlined **Academic Integrity Pledge:** heading.
4. Escaped pledge paragraph.
5. Fixed **Signature:** label and signing line.
6. Existing Name, ID, and Section boxes.
7. Existing question-count confirmation and important instructions.

The pledge paragraph is always passed through `escapeLatex()`, including for trusted `.tex` uploads, because this field is defined as plain text. Characters such as `&`, `%`, `_`, `#`, braces, and backslashes must not be interpreted as LaTeX commands.

The cover's large unused vertical gaps will be reduced and spacing around the pledge will be explicit. No content will be silently moved to another page. The target is a one-page student cover for the default pledge and default instructions.

## Error Handling and Compatibility

- Old LaTeX, CSV, and Excel inputs that omit the new fields receive the default enabled pledge and approved text through the existing template merge. Legacy JSON imports are explicitly normalized with the same defaults before loading.
- Explicit `no`, `false`, or `0` values disable the pledge; `yes`, `true`, or `1` enable it, following the existing boolean parsing conventions.
- An enabled pledge cannot be saved with empty text in either UI entry point.
- Disabling cover pages makes the pledge inapplicable but does not erase its state.
- Malformed or unknown template settings continue to use each parser's existing error behavior.

## Testing

Automated coverage will verify:

- The new default boolean and exact default text.
- Settings-block serialization and LaTeX parsing for enabled, disabled, customized, and omitted values.
- CSV and Excel serialization/parsing for the same cases, including punctuation commas.
- Backward compatibility when older LaTeX, CSV, Excel, and JSON inputs omit both fields.
- LaTeX output with cover on/pledge on, cover on/pledge off, and cover off/pledge retained.
- Unconditional escaping of LaTeX-sensitive characters in customized pledge text.
- Existing cover behavior and the full regression suite.
- Successful lint and production builds.

Manual UI checks will cover both editor entry points, the switch dependency, popup visibility, draft isolation, Save, Cancel, Escape/close, Reset to default, empty-text validation, and round-tripping through all three template formats.

## Compilation and Visual Verification

The agent will run automated tests, lint, and the production build, then provide the user with representative generated `.tex` output and a short inspection checklist. The user, not the agent, will compile the LaTeX exam and inspect the PDF.

The user will confirm:

- The order matches the reference cover.
- The heading is underlined and fixed.
- The paragraph wraps cleanly.
- The signature line is usable.
- Name, ID, and Section boxes remain aligned.
- Default cover content remains on one page.
- Existing instructions remain readable and do not overflow.

Any layout issue reported by the user returns to implementation and automated verification. The feature is not considered visually accepted until the user confirms the compiled PDF.

## Acceptance Criteria

- New exams and new example templates include the approved pledge by default.
- Instructors can independently disable the pledge while retaining cover pages.
- Instructors can edit, cancel, save, and reset pledge text through a popup editor in both relevant UI flows.
- The fixed heading and signature line cannot be edited.
- Turning off cover pages disables pledge controls without losing their values.
- LaTeX, CSV, and Excel templates preserve the pledge state and text.
- Older templates load with the default included pledge.
- Student covers render the pledge in the approved location only when applicable.
- Automated verification passes, and the user approves the compiled PDF layout.
