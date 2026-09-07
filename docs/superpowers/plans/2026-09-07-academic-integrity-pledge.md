# Academic Integrity Pledge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a default-enabled, optional, editable academic-integrity pledge to every student-version cover page while preserving all supported template formats and the shared web/Electron build.

**Architecture:** Store pledge visibility and plain-text content as two `ExamSettings` fields, centralize the approved text and normalization in one core module, and reuse one pledge-control/dialog component in the Details and new-template flows. Serialize the settings through LaTeX, CSV, Excel, and session JSON; render a LaTeX-only cover block when both the cover and pledge are enabled. Electron receives the feature through the existing shared `src/` renderer bundle and requires no main-process or preload changes.

**Tech Stack:** React 18, TypeScript, shadcn/Radix UI, Tailwind CSS, Vitest/jsdom, Testing Library, ExcelJS, Vite, Electron.

---

## File Structure

**Create:**

- `src/lib/core/academic-integrity-pledge.ts` — approved default text and single-paragraph normalization.
- `src/lib/core/__tests__/academic-integrity-pledge.test.ts` — normalization contract.
- `src/lib/core/__tests__/template-format-pledge.test.ts` — CSV and Excel pledge round trips.
- `src/components/ui/academic-integrity-pledge-control.tsx` — reusable switch row, edit trigger, and draft-isolated popup editor.
- `src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx` — editor and dependency behavior.
- `src/components/ui/__tests__/template-dialog-pledge.test.tsx` — new-template request wiring.
- `src/pages/__tests__/details-pledge.test.tsx` — Details-page cover/pledge dependency.
- `src/test/setup.ts` — Testing Library matchers and cleanup.

**Modify:**

- `src/lib/types.ts` — add the two required pledge fields.
- `src/lib/core/settings.ts` — defaults, default merge, serialization, and template configuration.
- `src/lib/core/parser.ts` — LaTeX setting parsing and legacy defaults.
- `src/lib/parsers/csv-parser.ts` — recognize and parse pledge settings.
- `src/lib/parsers/excel-parser.ts` — recognize and parse pledge settings.
- `src/lib/generators/csv-template.ts` — serialize pledge settings.
- `src/lib/generators/excel-template.ts` — serialize pledge settings.
- `src/pages/Start.tsx` — normalize legacy JSON and pass a configuration object from new-template UI to generators.
- `src/components/ui/template-dialog.tsx` — expose default-enabled pledge controls and return their values.
- `src/pages/Details.tsx` — expose pledge controls and validate enabled text.
- `src/lib/core/latex.ts` — render and space the student-cover pledge block.
- `src/lib/core/__tests__/settings.test.ts` — defaults, merge, and settings-block assertions.
- `src/lib/core/__tests__/parser.test.ts` — LaTeX parsing and legacy behavior.
- `src/lib/core/__tests__/latex.test.ts` — rendering conditions and escaping.
- `src/lib/core/__tests__/bug-last-question.test.ts` — complete required settings fixture.
- `src/lib/core/__tests__/versioning.test.ts` — complete required settings fixture.
- `vitest.config.ts` — load the shared UI-test setup.
- `src/pages/Documentation.tsx` — document the pledge UI and settings.
- `CHANGELOG.md` — add an Unreleased feature note.

No file under `electron/` or any Electron packaging configuration should change.

## Task 1: Add the Domain Contract and Defaults

**Files:**

- Create: `src/lib/core/academic-integrity-pledge.ts`
- Create: `src/lib/core/__tests__/academic-integrity-pledge.test.ts`
- Modify: `src/lib/types.ts:3-20`
- Modify: `src/lib/core/settings.ts:1-191`
- Modify: `src/lib/core/__tests__/settings.test.ts:1-565`
- Modify: `src/lib/core/__tests__/bug-last-question.test.ts:21-38`
- Modify: `src/lib/core/__tests__/versioning.test.ts:7-48`
- Modify: `src/lib/core/__tests__/latex.test.ts:19-43`

- [ ] **Step 1: Write failing normalization and default tests**

Create `src/lib/core/__tests__/academic-integrity-pledge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACADEMIC_INTEGRITY_PLEDGE,
  normalizeAcademicIntegrityPledgeText,
} from "../academic-integrity-pledge";

describe("academic integrity pledge", () => {
  it("provides the approved department wording", () => {
    expect(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE).toBe(
      "I pledge that I do not possess any mobile phone, smartwatch, earphones, or any other communication or smart devices, nor any written or printed material within my reach during this examination. I understand that possession of such devices or material will result in disciplinary action as per university policy."
    );
  });

  it("normalizes an edited pledge to one trimmed paragraph", () => {
    expect(
      normalizeAcademicIntegrityPledgeText("  First line.\n\n  Second line.  ")
    ).toBe("First line. Second line.");
  });

  it("returns an empty string for whitespace-only text", () => {
    expect(normalizeAcademicIntegrityPledgeText(" \n\t ")).toBe("");
  });
});
```

In the `getDefaultSettings` tests in `src/lib/core/__tests__/settings.test.ts`, add:

```ts
expect(settings).toHaveProperty("includeAcademicIntegrityPledge");
expect(settings).toHaveProperty("academicIntegrityPledgeText");
expect(settings.includeAcademicIntegrityPledge).toBe(true);
expect(settings.academicIntegrityPledgeText).toBe(
  DEFAULT_ACADEMIC_INTEGRITY_PLEDGE
);
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run:

```bash
npm test -- --run src/lib/core/__tests__/academic-integrity-pledge.test.ts src/lib/core/__tests__/settings.test.ts
```

Expected: FAIL because the new module, constants, and settings fields do not exist.

- [ ] **Step 3: Implement the default text, normalization, fields, and default merge**

Create `src/lib/core/academic-integrity-pledge.ts`:

```ts
export const DEFAULT_ACADEMIC_INTEGRITY_PLEDGE =
  "I pledge that I do not possess any mobile phone, smartwatch, earphones, or any other communication or smart devices, nor any written or printed material within my reach during this examination. I understand that possession of such devices or material will result in disciplinary action as per university policy.";

export function normalizeAcademicIntegrityPledgeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
```

Add to `ExamSettings` in `src/lib/types.ts` immediately after `includeCoverPage`:

```ts
includeAcademicIntegrityPledge: boolean;
academicIntegrityPledgeText: string;
```

Import the constant into `src/lib/core/settings.ts`, add these defaults after `includeCoverPage`, and add a shared merge helper:

```ts
import {
  DEFAULT_ACADEMIC_INTEGRITY_PLEDGE,
  normalizeAcademicIntegrityPledgeText,
} from "./academic-integrity-pledge";

// Inside getDefaultSettings()
includeCoverPage: true,
includeAcademicIntegrityPledge: true,
academicIntegrityPledgeText: DEFAULT_ACADEMIC_INTEGRITY_PLEDGE,

export function mergeSettingsWithDefaults(
  settings: Partial<ExamSettings> = {}
): Partial<ExamSettings> {
  return { ...getDefaultSettings(), ...settings };
}
```

Add the two required fields to every explicit `ExamSettings` fixture in the four listed test files:

```ts
includeAcademicIntegrityPledge: true,
academicIntegrityPledgeText: "Test academic integrity pledge.",
```

- [ ] **Step 4: Add and run the default-merge regression test**

Import `mergeSettingsWithDefaults` and `DEFAULT_ACADEMIC_INTEGRITY_PLEDGE` in `settings.test.ts`, then add:

```ts
it("adds pledge defaults to legacy settings", () => {
  const merged = mergeSettingsWithDefaults({ includeCoverPage: true });

  expect(merged.includeAcademicIntegrityPledge).toBe(true);
  expect(merged.academicIntegrityPledgeText).toBe(
    DEFAULT_ACADEMIC_INTEGRITY_PLEDGE
  );
});
```

Run:

```bash
npm test -- --run src/lib/core/__tests__/academic-integrity-pledge.test.ts src/lib/core/__tests__/settings.test.ts
npx tsc -b
```

Expected: both commands PASS with no type errors.

- [ ] **Step 5: Commit the domain contract**

```bash
git add src/lib/core/academic-integrity-pledge.ts src/lib/core/__tests__/academic-integrity-pledge.test.ts src/lib/types.ts src/lib/core/settings.ts src/lib/core/__tests__/settings.test.ts src/lib/core/__tests__/bug-last-question.test.ts src/lib/core/__tests__/versioning.test.ts src/lib/core/__tests__/latex.test.ts
git commit -m "feat: add academic integrity pledge settings"
```

## Task 2: Persist and Restore the Pledge Across Every Input Format

**Files:**

- Create: `src/lib/core/__tests__/template-format-pledge.test.ts`
- Modify: `src/lib/core/settings.ts:113-191`
- Modify: `src/lib/core/parser.ts:94-136`
- Modify: `src/lib/parsers/csv-parser.ts:95-175`
- Modify: `src/lib/parsers/excel-parser.ts:91-174`
- Modify: `src/lib/generators/csv-template.ts:54-75`
- Modify: `src/lib/generators/excel-template.ts:55-85`
- Modify: `src/pages/Start.tsx:203-205,241-245`
- Modify: `src/lib/core/__tests__/settings.test.ts`
- Modify: `src/lib/core/__tests__/parser.test.ts`

- [ ] **Step 1: Write failing settings-block and LaTeX-parser tests**

Extend `settings.test.ts`:

```ts
it("serializes normalized pledge settings", () => {
  mockSettings.includeAcademicIntegrityPledge = false;
  mockSettings.academicIntegrityPledgeText = "  Custom\n pledge.  ";

  const result = generateSettingsBlock(mockSettings);

  expect(result).toContain("includeAcademicIntegrityPledge=no");
  expect(result).toContain("academicIntegrityPledgeText=Custom pledge.");
});
```

Extend `parser.test.ts` with a complete minimal template string using the existing question-marker syntax:

```ts
import { DEFAULT_ACADEMIC_INTEGRITY_PLEDGE } from "../academic-integrity-pledge";

it("parses academic integrity pledge settings", () => {
  const result = parseLatexTemplate(`%{#setting}
% numberofvestions=1
% groups=1
% includeAcademicIntegrityPledge=no
% academicIntegrityPledgeText=Custom department pledge.
%{/setting}`);

  expect(result.settings?.includeAcademicIntegrityPledge).toBe(false);
  expect(result.settings?.academicIntegrityPledgeText).toBe(
    "Custom department pledge."
  );
});

it("defaults pledge settings for legacy LaTeX templates", () => {
  const result = parseLatexTemplate(`%{#setting}
% numberofvestions=1
% groups=1
%{/setting}`);

  expect(result.settings?.includeAcademicIntegrityPledge).toBe(true);
  expect(result.settings?.academicIntegrityPledgeText).toBe(
    DEFAULT_ACADEMIC_INTEGRITY_PLEDGE
  );
});
```

- [ ] **Step 2: Write failing CSV and Excel round-trip tests**

Create `src/lib/core/__tests__/template-format-pledge.test.ts` with a full one-question fixture and these assertions:

```ts
import { describe, expect, it } from "vitest";
import { generateCSVTemplate } from "../../generators/csv-template";
import { generateExcelTemplate } from "../../generators/excel-template";
import { parseCSV } from "../../parsers/csv-parser";
import { parseExcel } from "../../parsers/excel-parser";
import type { ExamData, ExamSettings } from "../../types";

const settings: ExamSettings = {
  university: "Test University",
  department: "Test Department",
  term: "Term 261",
  coursecode: "MATH 101",
  examname: "Major Exam I",
  examdate: "September 28, 2026",
  timeallowed: "90 Minutes",
  numberofvestions: 1,
  groups: "1",
  examtype: "MAJOR",
  code_name: "CODE",
  code_numbering: "NUMERIC",
  paper_size: "A4",
  instructions: "\\begin{enumerate}\n\\item Test instruction.\n\\end{enumerate}",
  includeCoverPage: true,
  includeAcademicIntegrityPledge: false,
  academicIntegrityPledgeText: "Custom pledge, with punctuation, retained.",
  seed: "pledge-test",
};

const exam: ExamData = {
  name: "master",
  ordering: null,
  preamble: "",
  kept_in_one_page: [],
  questions: [
    {
      text: "Question?",
      group: 1,
      order: 1,
      choices: [[{ text: "A" }, { text: "B" }], 0, null],
      correctOptionLetter: "A",
      keepOnSeparatePage: false,
    },
  ],
};

describe("academic integrity pledge template formats", () => {
  it("round-trips pledge settings through CSV", () => {
    const parsed = parseCSV(generateCSVTemplate(settings, exam));

    expect(parsed.settings.includeAcademicIntegrityPledge).toBe(false);
    expect(parsed.settings.academicIntegrityPledgeText).toBe(
      settings.academicIntegrityPledgeText
    );
  });

  it("round-trips pledge settings through Excel", async () => {
    const blob = await generateExcelTemplate(settings, exam);
    const file = new File([blob], "pledge-template.xlsx", { type: blob.type });
    const parsed = await parseExcel(file);

    expect(parsed.settings.includeAcademicIntegrityPledge).toBe(false);
    expect(parsed.settings.academicIntegrityPledgeText).toBe(
      settings.academicIntegrityPledgeText
    );
  });
});
```

- [ ] **Step 3: Run the persistence tests and confirm they fail**

Run:

```bash
npm test -- --run src/lib/core/__tests__/settings.test.ts src/lib/core/__tests__/parser.test.ts src/lib/core/__tests__/template-format-pledge.test.ts
```

Expected: FAIL because serializers and parsers do not yet recognize the new fields.

- [ ] **Step 4: Implement settings and template serialization**

In `generateSettingsBlock()`, replace the existing `includeCoverPage`/optional-seed tail with this exact ordering:

```ts
%\t\tincludeCoverPage=${settings.includeCoverPage ? "yes" : "no"}
%\t\tincludeAcademicIntegrityPledge=${
  settings.includeAcademicIntegrityPledge ? "yes" : "no"
}
%\t\tacademicIntegrityPledgeText=${normalizeAcademicIntegrityPledgeText(
  settings.academicIntegrityPledgeText
)}${settings.seed ? `\n%\t\tseed=${settings.seed}` : ""}
```

Extend `generateTemplateSettings()`'s config and result:

```ts
includeAcademicIntegrityPledge?: boolean;
academicIntegrityPledgeText?: string;

// Inside baseSettings
includeAcademicIntegrityPledge:
  config.includeAcademicIntegrityPledge ?? true,
academicIntegrityPledgeText: normalizeAcademicIntegrityPledgeText(
  config.academicIntegrityPledgeText ??
    DEFAULT_ACADEMIC_INTEGRITY_PLEDGE
),
```

Import the normalizer in both generators:

```ts
import { normalizeAcademicIntegrityPledgeText } from "../core/academic-integrity-pledge";
```

Add equivalent rows to both generators:

```ts
// CSV
includeAcademicIntegrityPledge,${settings.includeAcademicIntegrityPledge ? "yes" : "no"}
academicIntegrityPledgeText,${normalizeAcademicIntegrityPledgeText(settings.academicIntegrityPledgeText)}

// Excel settingsData
["includeAcademicIntegrityPledge", settings.includeAcademicIntegrityPledge ? "yes" : "no"],
["academicIntegrityPledgeText", normalizeAcademicIntegrityPledgeText(settings.academicIntegrityPledgeText)],
```

- [ ] **Step 5: Implement parser support and legacy defaults**

In each valid-key list, add:

```ts
"includeAcademicIntegrityPledge",
"academicIntegrityPledgeText",
```

Parse both boolean settings through the same explicit true-value branch. Use this branch in CSV and Excel:

```ts
} else if (
  key === "includeCoverPage" ||
  key === "includeAcademicIntegrityPledge"
) {
  const normalizedValue = value.trim().toLowerCase();
  const boolValue =
    normalizedValue === "yes" ||
    normalizedValue === "true" ||
    normalizedValue === "1";
  (settings as any)[key] = boolValue;
```

Use this analogous branch in the LaTeX parser:

```ts
} else if (
  cleanKey === "includeCoverPage" ||
  cleanKey === "includeAcademicIntegrityPledge"
) {
  const normalizedValue = value.trim().toLowerCase();
  (settings as any)[cleanKey] =
    normalizedValue === "yes" ||
    normalizedValue === "true" ||
    normalizedValue === "1";
```

After LaTeX settings are parsed, apply:

```ts
const defaults = getDefaultSettings();
settings.includeAcademicIntegrityPledge ??=
  defaults.includeAcademicIntegrityPledge;
settings.academicIntegrityPledgeText ??=
  defaults.academicIntegrityPledgeText;
```

Import `getDefaultSettings` into `parser.ts` rather than duplicating the approved text.

- [ ] **Step 6: Normalize legacy JSON imports through the shared default merge**

Replace the local spread in `createExamFromTemplate()` and normalize JSON before `onDataLoaded()`:

```ts
const settings = mergeSettingsWithDefaults(template.settings);

// JSON branch
const jsonData = JSON.parse(content) as ExamJSON;
onDataLoaded({
  ...jsonData,
  setting: mergeSettingsWithDefaults(jsonData.setting) as ExamSettings,
});
```

Import `mergeSettingsWithDefaults` from `settings.ts`. Add this test to `settings.test.ts` to cover explicit legacy values remaining authoritative:

```ts
it("preserves supplied settings while filling pledge defaults", () => {
  const merged = mergeSettingsWithDefaults({
    includeCoverPage: false,
    coursecode: "MATH 201",
  });

  expect(merged.includeCoverPage).toBe(false);
  expect(merged.coursecode).toBe("MATH 201");
  expect(merged.includeAcademicIntegrityPledge).toBe(true);
});
```

- [ ] **Step 7: Run persistence verification and commit**

Run:

```bash
npm test -- --run src/lib/core/__tests__/settings.test.ts src/lib/core/__tests__/parser.test.ts src/lib/core/__tests__/template-format-pledge.test.ts
npx tsc -b
```

Expected: PASS, including comma-preserving CSV and Excel round trips.

Commit:

```bash
git add src/lib/core/settings.ts src/lib/core/parser.ts src/lib/parsers/csv-parser.ts src/lib/parsers/excel-parser.ts src/lib/generators/csv-template.ts src/lib/generators/excel-template.ts src/pages/Start.tsx src/lib/core/__tests__/settings.test.ts src/lib/core/__tests__/parser.test.ts src/lib/core/__tests__/template-format-pledge.test.ts
git commit -m "feat: persist academic integrity pledge settings"
```

## Task 3: Build the Reusable Pledge Control and Popup Editor

**Files:**

- Create: `src/test/setup.ts`
- Create: `src/components/ui/academic-integrity-pledge-control.tsx`
- Create: `src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx`
- Modify: `vitest.config.ts:17-21`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add the project UI-test harness**

Run:

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

Set the Vitest setup file:

```ts
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./src/test/setup.ts"],
```

- [ ] **Step 2: Write failing component tests**

Create `src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AcademicIntegrityPledgeControl } from "../academic-integrity-pledge-control";
import { DEFAULT_ACADEMIC_INTEGRITY_PLEDGE } from "@/lib/core/academic-integrity-pledge";

describe("AcademicIntegrityPledgeControl", () => {
  it("disables the pledge and hides editing when cover pages are off", () => {
    render(
      <AcademicIntegrityPledgeControl
        coverPageEnabled={false}
        included={true}
        text="Custom pledge."
        onIncludedChange={vi.fn()}
        onTextChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole("switch", { name: "Include Academic Integrity Pledge" })
    ).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Edit pledge" })).not.toBeInTheDocument();
  });

  it("isolates drafts, normalizes saved text, and resets to default", async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(
      <AcademicIntegrityPledgeControl
        coverPageEnabled={true}
        included={true}
        text="Current pledge."
        onIncludedChange={vi.fn()}
        onTextChange={onTextChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Edit pledge" }));
    const editor = screen.getByLabelText("Pledge text");
    await user.clear(editor);
    await user.type(editor, "  Edited pledge.  ");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onTextChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Edit pledge" }));
    expect(screen.getByLabelText("Pledge text")).toHaveValue("Current pledge.");
    await user.clear(screen.getByLabelText("Pledge text"));
    await user.type(screen.getByLabelText("Pledge text"), "  Edited   pledge.  ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onTextChange).toHaveBeenLastCalledWith("Edited pledge.");

    await user.click(screen.getByRole("button", { name: "Edit pledge" }));
    await user.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(screen.getByLabelText("Pledge text")).toHaveValue(
      DEFAULT_ACADEMIC_INTEGRITY_PLEDGE
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onTextChange).toHaveBeenCalledWith(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE);
  });

  it("prevents saving an empty enabled pledge", async () => {
    const user = userEvent.setup();
    render(
      <AcademicIntegrityPledgeControl
        coverPageEnabled={true}
        included={true}
        text="Current pledge."
        onIncludedChange={vi.fn()}
        onTextChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Edit pledge" }));
    await user.clear(screen.getByLabelText("Pledge text"));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter pledge text or disable the pledge."
    );
  });
});
```

- [ ] **Step 3: Run the component test and confirm it fails**

Run:

```bash
npm test -- --run src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx
```

Expected: FAIL because `AcademicIntegrityPledgeControl` does not exist.

- [ ] **Step 4: Implement the reusable control and dialog**

Create `src/components/ui/academic-integrity-pledge-control.tsx` with this public interface and behavior:

```tsx
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_ACADEMIC_INTEGRITY_PLEDGE,
  normalizeAcademicIntegrityPledgeText,
} from "@/lib/core/academic-integrity-pledge";

interface AcademicIntegrityPledgeControlProps {
  coverPageEnabled: boolean;
  included: boolean;
  text: string;
  onIncludedChange: (included: boolean) => void;
  onTextChange: (text: string) => void;
}

export function AcademicIntegrityPledgeControl({
  coverPageEnabled,
  included,
  text,
  onIncludedChange,
  onTextChange,
}: AcademicIntegrityPledgeControlProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(text);
  const normalizedDraft = normalizeAcademicIntegrityPledgeText(draft);

  const handleOpenChange = (nextOpen: boolean) => {
    setDraft(text);
    setOpen(nextOpen);
  };

  const handleSave = () => {
    if (!normalizedDraft) return;
    onTextChange(normalizedDraft);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="includeAcademicIntegrityPledge">
            Include Academic Integrity Pledge
          </Label>
          <p className="text-sm text-muted-foreground">
            Add the pledge and signature line to student cover pages
          </p>
        </div>
        <Switch
          id="includeAcademicIntegrityPledge"
          aria-label="Include Academic Integrity Pledge"
          checked={included}
          disabled={!coverPageEnabled}
          onCheckedChange={onIncludedChange}
        />
      </div>

      {coverPageEnabled && included && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit pledge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Academic Integrity Pledge</DialogTitle>
                <DialogDescription>
                  The heading and signature line are fixed. Edit only the pledge paragraph.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="academicIntegrityPledgeText">Pledge text</Label>
                <Textarea
                  id="academicIntegrityPledgeText"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-40 resize-y"
                />
                {!normalizedDraft && (
                  <p role="alert" className="text-sm text-destructive">
                    Enter pledge text or disable the pledge.
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDraft(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE)}
                >
                  Reset to default
                </Button>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!normalizedDraft} onClick={handleSave}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run UI tests and commit**

Run:

```bash
npm test -- --run src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx
npx tsc -b
npx eslint src/components/ui/academic-integrity-pledge-control.tsx src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx src/test/setup.ts
```

Expected: PASS with no accessibility-query, type, or lint failures.

Commit:

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/components/ui/academic-integrity-pledge-control.tsx src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx
git commit -m "feat: add academic integrity pledge editor"
```

## Task 4: Wire the Shared Control Into New Templates and Exam Details

**Files:**

- Create: `src/components/ui/__tests__/template-dialog-pledge.test.tsx`
- Create: `src/pages/__tests__/details-pledge.test.tsx`
- Modify: `src/components/ui/template-dialog.tsx:21-150,326-359`
- Modify: `src/pages/Start.tsx:26-49,335-428`
- Modify: `src/pages/Details.tsx:1-43,104-217,380-402`

- [ ] **Step 1: Write failing new-template integration test**

Create `src/components/ui/__tests__/template-dialog-pledge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TemplateDialog } from "../template-dialog";
import { Button } from "../button";

describe("TemplateDialog academic integrity pledge", () => {
  it("submits the default-enabled pledge and edited text", async () => {
    const user = userEvent.setup();
    const onTemplateGenerate = vi.fn();
    render(
      <TemplateDialog
        format="tex"
        onTemplateGenerate={onTemplateGenerate}
        triggerButton={<Button>Open template dialog</Button>}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open template dialog" }));
    await user.type(screen.getByLabelText(/Course Code/), "MATH 101");
    await user.type(screen.getByLabelText(/Exam Name/), "Major Exam I");
    await user.click(screen.getByRole("button", { name: "Edit pledge" }));
    await user.clear(screen.getByLabelText("Pledge text"));
    await user.type(screen.getByLabelText("Pledge text"), "Custom template pledge.");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Generate Template" }));

    expect(onTemplateGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "tex",
        includeCoverPage: true,
        includeAcademicIntegrityPledge: true,
        academicIntegrityPledgeText: "Custom template pledge.",
      })
    );
  });
});
```

- [ ] **Step 2: Write failing Details dependency test**

Create `src/pages/__tests__/details-pledge.test.tsx` with the complete fixture and dependency test:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DetailsPage } from "../Details";
import type { ExamJSON } from "@/lib/types";

const examData: ExamJSON = {
  setting: {
    university: "Test University",
    department: "Test Department",
    term: "Term 261",
    coursecode: "MATH 101",
    examname: "Major Exam I",
    examdate: "September 28, 2026",
    timeallowed: "90 Minutes",
    numberofvestions: 1,
    groups: "1",
    examtype: "MAJOR",
    code_name: "CODE",
    code_numbering: "NUMERIC",
    paper_size: "A4",
    instructions: "Test instructions.",
    includeCoverPage: true,
    includeAcademicIntegrityPledge: true,
    academicIntegrityPledgeText: "Original pledge.",
    seed: "details-pledge-test",
  },
  exam: {
    name: "master",
    ordering: null,
    preamble: "",
    kept_in_one_page: [],
    questions: [
      {
        text: "Question?",
        group: 1,
        order: 1,
        choices: [[{ text: "A" }, { text: "B" }], 0, null],
        keepOnSeparatePage: false,
      },
    ],
  },
  options_order: {},
};

describe("DetailsPage academic integrity pledge", () => {
it("disables pledge editing without erasing it when cover pages are off", async () => {
  const user = userEvent.setup();
  render(
    <DetailsPage
      examData={examData}
      onDataUpdated={vi.fn()}
      onBack={vi.fn()}
      onContinue={vi.fn()}
    />
  );

  await user.click(screen.getByRole("button", { name: "Edit pledge" }));
  await user.clear(screen.getByLabelText("Pledge text"));
  await user.type(screen.getByLabelText("Pledge text"), "Retained custom pledge.");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await user.click(screen.getByRole("switch", { name: "Include Cover Pages" }));

  expect(
    screen.getByRole("switch", { name: "Include Academic Integrity Pledge" })
  ).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Edit pledge" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("switch", { name: "Include Cover Pages" }));
  await user.click(screen.getByRole("button", { name: "Edit pledge" }));
  expect(screen.getByLabelText("Pledge text")).toHaveValue(
    "Retained custom pledge."
  );
});
});
```

- [ ] **Step 3: Run both integration tests and confirm they fail**

Run:

```bash
npm test -- --run src/components/ui/__tests__/template-dialog-pledge.test.tsx src/pages/__tests__/details-pledge.test.tsx
```

Expected: FAIL because neither parent flow renders or transports the pledge control yet.

- [ ] **Step 4: Convert the template callback to a configuration object and wire state**

Export this type from `template-dialog.tsx` and change the callback signature:

```ts
export interface TemplateGenerationRequest {
  format: TemplateFormat;
  coursecode: string;
  examname: string;
  examdate: string;
  term: string;
  numQuestions: number;
  includeImageQuestion: boolean;
  includeCoverPage: boolean;
  includeAcademicIntegrityPledge: boolean;
  academicIntegrityPledgeText: string;
}

interface TemplateDialogProps {
  format: TemplateFormat;
  triggerButton?: React.ReactNode;
  onTemplateGenerate: (request: TemplateGenerationRequest) => void;
}
```

Add defaulted local state, include it in both reset paths, and submit one object:

```ts
const [includeAcademicIntegrityPledge, setIncludeAcademicIntegrityPledge] =
  useState(true);
const [academicIntegrityPledgeText, setAcademicIntegrityPledgeText] = useState(
  DEFAULT_ACADEMIC_INTEGRITY_PLEDGE
);

onTemplateGenerate({
  format,
  coursecode,
  examname,
  examdate,
  term,
  numQuestions,
  includeImageQuestion,
  includeCoverPage,
  includeAcademicIntegrityPledge,
  academicIntegrityPledgeText,
});
```

Render `AcademicIntegrityPledgeControl` immediately after the cover-page row:

```tsx
<AcademicIntegrityPledgeControl
  coverPageEnabled={includeCoverPage}
  included={includeAcademicIntegrityPledge}
  text={academicIntegrityPledgeText}
  onIncludedChange={setIncludeAcademicIntegrityPledge}
  onTextChange={setAcademicIntegrityPledgeText}
/>
```

In `Start.tsx`, import the request type and replace positional parameters:

```ts
const generateTemplate = async ({
  format,
  coursecode,
  examname,
  examdate,
  term,
  numQuestions,
  includeImageQuestion,
  includeCoverPage,
  includeAcademicIntegrityPledge,
  academicIntegrityPledgeText,
}: TemplateGenerationRequest) => {
```

Pass the final two values to `generateTemplateSettings()`.

- [ ] **Step 5: Wire the Details control and enabled-text validation**

Render the same component below the cover-page row:

```tsx
<AcademicIntegrityPledgeControl
  coverPageEnabled={settings.includeCoverPage}
  included={settings.includeAcademicIntegrityPledge}
  text={settings.academicIntegrityPledgeText}
  onIncludedChange={(included) =>
    handleSettingChange("includeAcademicIntegrityPledge", included)
  }
  onTextChange={(text) =>
    handleSettingChange("academicIntegrityPledgeText", text)
  }
/>
```

Give the existing cover switch an accessible name if the Label association does not expose one in the test:

```tsx
aria-label="Include Cover Pages"
```

Add to `validateSettings()`:

```ts
if (
  settings.includeCoverPage &&
  settings.includeAcademicIntegrityPledge &&
  !normalizeAcademicIntegrityPledgeText(settings.academicIntegrityPledgeText)
) {
  errors.push("Enter academic integrity pledge text or disable the pledge");
}
```

- [ ] **Step 6: Run UI integration verification and commit**

Run:

```bash
npm test -- --run src/components/ui/__tests__/academic-integrity-pledge-control.test.tsx src/components/ui/__tests__/template-dialog-pledge.test.tsx src/pages/__tests__/details-pledge.test.tsx
npx tsc -b
npx eslint src/components/ui/template-dialog.tsx src/components/ui/academic-integrity-pledge-control.tsx src/pages/Start.tsx src/pages/Details.tsx src/components/ui/__tests__/template-dialog-pledge.test.tsx src/pages/__tests__/details-pledge.test.tsx
```

Expected: PASS. The existing template buttons continue passing the same `generateTemplate` function because all calls now use the shared request object.

Commit:

```bash
git add src/components/ui/template-dialog.tsx src/pages/Start.tsx src/pages/Details.tsx src/components/ui/__tests__/template-dialog-pledge.test.tsx src/pages/__tests__/details-pledge.test.tsx
git commit -m "feat: expose pledge controls in exam setup"
```

## Task 5: Render the Pledge on Student Covers

**Files:**

- Modify: `src/lib/core/latex.ts:133-256`
- Modify: `src/lib/core/__tests__/latex.test.ts:184-233`

- [ ] **Step 1: Write failing cover-rendering tests**

Add these tests under the existing `Cover Page` describe block:

```ts
it("renders the fixed pledge frame and customized text when enabled", () => {
  mockSettings.includeCoverPage = true;
  mockSettings.includeAcademicIntegrityPledge = true;
  mockSettings.academicIntegrityPledgeText = "Custom integrity pledge.";

  const result = generateLatexDocument(
    mockSettings,
    mockMasterExam,
    mockVersions,
    mockMappings
  );

  expect(result.content).toContain(
    "\\underline{\\textbf{Academic Integrity Pledge:}}"
  );
  expect(result.content).toContain("Custom integrity pledge.");
  expect(result.content).toContain("\\textbf{Signature:}");
});

it.each([
  { includeCoverPage: true, includeAcademicIntegrityPledge: false },
  { includeCoverPage: false, includeAcademicIntegrityPledge: true },
])("does not render the pledge frame for %o", (overrides) => {
  Object.assign(mockSettings, overrides);

  const result = generateLatexDocument(
    mockSettings,
    mockMasterExam,
    mockVersions,
    mockMappings
  );

  expect(result.content).not.toContain(
    "\\underline{\\textbf{Academic Integrity Pledge:}}"
  );
});

it("always escapes customized pledge text, including trusted LaTeX mode", () => {
  mockSettings.academicIntegrityPledgeText = "Policy & conduct_100% #1";

  const result = generateLatexDocument(
    mockSettings,
    mockMasterExam,
    mockVersions,
    mockMappings,
    true
  );

  expect(result.content).toContain("Policy \\& conduct\\_100\\% \\#1");
});
```

- [ ] **Step 2: Run focused LaTeX tests and confirm they fail**

Run:

```bash
npm test -- --run src/lib/core/__tests__/latex.test.ts
```

Expected: FAIL because no active pledge frame is generated.

- [ ] **Step 3: Build the plain-text pledge block**

Import the normalizer and define the block before the document preamble template:

```ts
import { normalizeAcademicIntegrityPledgeText } from "./academic-integrity-pledge";

const academicIntegrityPledgeBlock =
  settings.includeCoverPage && settings.includeAcademicIntegrityPledge
    ? `
\\vspace*{0.35cm}
\\noindent\\underline{\\textbf{Academic Integrity Pledge:}}\\par
\\vspace*{0.15cm}
\\noindent ${escapeLatex(
  normalizeAcademicIntegrityPledgeText(settings.academicIntegrityPledgeText)
)}\\par
\\vspace*{0.45cm}
\\noindent\\hfill\\textbf{Signature:}\\hspace{0.25cm}\\rule{0.58\\textwidth}{0.4pt}
\\vspace*{0.45cm}
`
    : "";
```

Use `escapeLatex()` directly, not `processText()`, so trusted-template mode cannot turn this plain-text field into executable LaTeX.

- [ ] **Step 4: Insert the block and preserve the pledge-off layout**

In `\newcodecover`, replace the fixed top and post-name gaps with conditional values, and insert the pledge after the centered metadata:

```ts
\\vspace*{${settings.includeAcademicIntegrityPledge ? "1cm" : "4.5cm"}}

// Immediately after \\end{center}
${academicIntegrityPledgeBlock}

// Replace the existing \\vspace{2cm} after the question-count confirmation
\\vspace{${settings.includeAcademicIntegrityPledge ? "0.6cm" : "2cm"}}
```

These conditional gaps preserve the current cover when the pledge is off and reclaim enough vertical space when it is on. Do not touch `masterCoverPage` or `masterVersionPage`.

- [ ] **Step 5: Run LaTeX and regression tests, then commit**

Run:

```bash
npm test -- --run src/lib/core/__tests__/latex.test.ts
npm test -- --run
npx tsc -b
```

Expected: all tests PASS and no required settings fixture remains incomplete.

Commit:

```bash
git add src/lib/core/latex.ts src/lib/core/__tests__/latex.test.ts
git commit -m "feat: render pledge on student cover pages"
```

## Task 6: Update User Documentation

**Files:**

- Modify: `src/pages/Documentation.tsx:74-94,1856-1933`
- Modify: `CHANGELOG.md:1-8`

- [ ] **Step 1: Extend documentation search terms and cover-page guidance**

Add `includeAcademicIntegrityPledge` and `academicIntegrityPledgeText` to the settings search text. Update the Cover Page Options card to document:

```tsx
<li>
  • <strong>Academic Integrity Pledge</strong> — Enabled by default on
  individual student covers; independently optional and editable from the
  pledge popup.
</li>
```

Extend the settings example:

```text
%includeAcademicIntegrityPledge=yes
%academicIntegrityPledgeText=I pledge that I do not possess any mobile phone, smartwatch, earphones, or any other communication or smart devices, nor any written or printed material within my reach during this examination. I understand that possession of such devices or material will result in disciplinary action as per university policy.
```

State that turning off cover pages disables the pledge controls without erasing their saved values, and that the heading and signature line remain fixed.

- [ ] **Step 2: Add an Unreleased changelog entry**

Insert after the changelog introduction:

```md
## [Unreleased]

### Added

- Optional, editable Academic Integrity Pledge on student-version cover pages, enabled by default and preserved across LaTeX, CSV, Excel, JSON, web, and desktop workflows.
```

- [ ] **Step 3: Verify and commit documentation**

Run:

```bash
npx eslint src/pages/Documentation.tsx
npm run build
```

Expected: lint and the production web build PASS.

Commit:

```bash
git add src/pages/Documentation.tsx CHANGELOG.md
git commit -m "docs: document academic integrity pledge"
```

## Task 7: Full Web/Desktop Verification and User Compilation Handoff

**Files:**

- Temporary local file: `notes/generate-academic-integrity-pledge-preview.ts` (gitignored)
- Generated user-review file: `notes/academic-integrity-pledge-preview.tex` (gitignored)

- [ ] **Step 1: Run the complete automated verification suite**

Run:

```bash
npm test -- --run
npm run lint
npx tsc -b
npm run build
npm run build -- --mode desktop
```

Expected:

- All Vitest tests pass.
- ESLint reports no errors.
- TypeScript reports no errors.
- The web build completes into `dist/`.
- Desktop mode completes into `dist/` and `dist-electron/` without modifying `electron/main.ts`, `electron/preload.ts`, or packaging configuration.

Do not run `npm run electron:build`; repository guidance says it writes a large local installer tree. Tagged CI performs the actual Windows packaging.

- [ ] **Step 2: Perform manual shared-UI smoke tests**

Run the web app and desktop development mode separately:

```bash
npm run dev
npm run electron:dev
```

In each mode verify:

1. New LaTeX, CSV, and Excel template dialogs default both switches on.
2. **Edit pledge** opens the popup.
3. Cancel and Escape discard edits.
4. Reset changes only the draft until Save.
5. Empty text disables Save.
6. Turning off cover pages disables the pledge switch and hides Edit.
7. Turning cover pages back on restores the pledge switch state and customized text.
8. An older template and session JSON open with the default pledge.

Stop each development process normally after its checks.

- [ ] **Step 3: Generate the user's LaTeX review artifact**

Create the gitignored `notes/generate-academic-integrity-pledge-preview.ts` with a one-question `ExamData`, one version, one mapping, and these final calls:

```ts
import { writeFileSync } from "node:fs";
import { generateLatexDocument } from "../src/lib/core/latex";
import { getDefaultSettings } from "../src/lib/core/settings";
import type { ExamData, ExamSettings, Question, VersionMapping } from "../src/lib/types";

const question: Question = {
  text: "This is a layout-verification question.",
  group: 1,
  order: 1,
  choices: [[{ text: "Option A" }, { text: "Option B" }], 0, null],
  keepOnSeparatePage: false,
};

const master: ExamData = {
  name: "master",
  ordering: null,
  preamble: "",
  questions: [question],
  kept_in_one_page: [],
};

const version: ExamData = {
  ...master,
  name: "version_1",
  questions: [{ ...question }],
};

const mapping: VersionMapping[] = [
  {
    group: 1,
    masterQNo: 1,
    version: "version_1",
    versionQNo: 1,
    perm: "AB",
    correct: "A",
  },
];

const settings = {
  ...getDefaultSettings(),
  coursecode: "MATH 101",
  examname: "Major Exam I",
  term: "Semester 261",
  examdate: "September 28, 2026",
  timeallowed: "90 Minutes",
  numberofvestions: 1,
  groups: "1",
  code_name: "CODE",
  code_numbering: "NUMERIC",
  includeCoverPage: true,
  includeAcademicIntegrityPledge: true,
} as ExamSettings;

const { content } = generateLatexDocument(
  settings,
  master,
  [version],
  mapping,
  false
);

writeFileSync("notes/academic-integrity-pledge-preview.tex", content, "utf8");
```

Run:

```bash
npx vite-node notes/generate-academic-integrity-pledge-preview.ts
```

Expected: `notes/academic-integrity-pledge-preview.tex` exists and contains the fixed heading, approved paragraph, and signature command. Keep both files local and uncommitted for user review.

- [ ] **Step 4: Hand compilation and layout inspection to the user**

Give the user the absolute clickable path to `notes/academic-integrity-pledge-preview.tex` and ask them to compile it. Their checklist is:

1. Pledge order matches the supplied reference image.
2. Heading is underlined and fixed.
3. Paragraph wraps cleanly.
4. Signature line is long enough to use.
5. Name, ID, and Section boxes remain aligned.
6. Default student cover remains one page.
7. Important Instructions remain readable and do not overflow.

Do not claim visual acceptance until the user confirms the compiled PDF. If they report spacing or pagination problems, return to Task 5, add or refine a regression assertion where possible, adjust only the conditional pledge-on spacing, rerun Task 7 Step 1, and issue a new preview file.

- [ ] **Step 5: Review the final diff and stop before release**

Run:

```bash
git status --short
git log --oneline --decorate -8
git diff main...HEAD --stat
git diff main...HEAD --check
```

Expected: only intended feature/design/plan/documentation changes are committed, temporary `notes/` files remain ignored, and diff checking reports no whitespace errors.

Report the verified state and wait for explicit user approval before running `scripts/release.sh`, because releasing merges to `main`, tags, pushes, deploys the web app, and publishes the Electron installer.
