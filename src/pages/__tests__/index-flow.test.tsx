import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { getDefaultSettings } from "@/lib/core/settings";
import type { ExamJSON, ExamSettings, ImportInfo, Question } from "@/lib/types";

// The flow is under test, not these pages: Start loads a fixed exam, Results and
// Documentation only show where we are and go back.
vi.mock("../Start", () => ({
  StartPage: ({ onDataLoaded }: { onDataLoaded: (data: ExamJSON, info?: ImportInfo) => void }) => (
    <button onClick={() => onDataLoaded(structuredClone(nextExam ?? EXAM), nextInfo ?? { warnings: [] })}>Load test exam</button>
  ),
}));
vi.mock("../Results", () => ({
  ResultsPage: ({ examData, onBack, olderFile }: { examData: ExamJSON; onBack: () => void; olderFile?: boolean }) => (
    <div data-testid="results">
      {olderFile ? "older file; " : ""}answers {examData.exam.questions.map((q) => q.choices[1]).join(",")}
      <button onClick={onBack}>Back from results</button>
    </div>
  ),
}));
vi.mock("../Documentation", () => ({
  DocumentationPage: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="docs">
      <button onClick={onBack}>Back from docs</button>
    </div>
  ),
}));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => null }));

import Index from "../Index";

const q = (text: string): Question => ({
  text,
  group: 1,
  order: 1,
  choices: [[{ text: "a" }, { text: "b" }, { text: "c" }], 0, null],
  keepOnSeparatePage: false,
});
const EXAM: ExamJSON = {
  setting: {
    ...getDefaultSettings(),
    university: "U",
    department: "D",
    coursecode: "C 101",
    examname: "Final",
    groups: "2",
    numberofvestions: 2,
    seed: "",
  } as ExamSettings,
  exam: { name: "master", ordering: null, preamble: "", kept_in_one_page: [], questions: [q("Q1"), q("Q2")] },
  options_order: {},
};

let root: Root | undefined;
/** The exam the mocked Start page loads, when not the default one. */
let nextExam: ExamJSON | undefined;
let nextInfo: ImportInfo | undefined;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
    root = undefined;
  }
  document.body.replaceChildren();
  nextExam = undefined;
  nextInfo = undefined;
});

const $ = (selector: string) => document.querySelector(selector);
const button = (name: string) =>
  Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === name);
const click = (element: Element | null | undefined) => {
  if (!element) throw new Error("element not found");
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};
const type = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const heading = () => document.querySelector("h1:not(header h1)")?.textContent;
const dialog = () => $('[data-testid="confirm-answers"]');
const chips = () => Array.from(document.querySelectorAll('[data-testid^="chip-"]')).map((c) => c.textContent);

function start() {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root?.render(<Index />));
  click(button("Load test exam"));
}

describe("Details → Questions → Results", () => {
  it("Details offers both routes; Generate now skips the Questions page", () => {
    start();
    expect(heading()).toBe("Exam Configuration");
    click(button("Generate now"));
    expect($('[data-testid="results"]')).not.toBeNull();
    click(button("Back from results"));
    expect(heading()).toBe("Exam Configuration");
    click(button("Next: Review questions"));
    expect(heading()).toBe("Review questions");
  });

  it("confirms changed answers on both routes, keeps the edits on Cancel, and asks again only after a new change", () => {
    start();
    click(button("Next: Review questions"));
    click($('[aria-label="Option C is the correct answer"]'));
    click(button("Generate"));
    expect(dialog()?.textContent).toContain("Q1: A → C");
    click(button("Go back"));
    expect(dialog()).toBeNull();
    expect(heading()).toBe("Review questions");
    expect($('[aria-label="Option C is the correct answer"]')?.getAttribute("aria-checked")).toBe("true");

    // Back to Details: Generate now asks too.
    click(button("Back"));
    click(button("Generate now"));
    expect(dialog()?.textContent).toContain("Q1: A → C");
    click(button("Generate with these answers"));
    expect($('[data-testid="results"]')?.textContent).toContain("answers 2,0");

    // Results' Back returns to where Results was opened from.
    click(button("Back from results"));
    expect(heading()).toBe("Exam Configuration");

    // The same list is not asked again.
    click(button("Next: Review questions"));
    click(button("Generate"));
    expect(dialog()).toBeNull();
    click(button("Back from results"));
    expect(heading()).toBe("Review questions");

    // Another change: asked again, with the new list.
    click($('[data-testid="chip-2"]'));
    click($('[aria-label="Option B is the correct answer"]'));
    click(button("Generate"));
    expect(dialog()?.textContent).toContain("Q1: A → C");
    expect(dialog()?.textContent).toContain("Q2: A → B");
  });

  it("Documentation opens over the step and returns to it with Details' drafts and seed intact", () => {
    start();
    const seed = document.getElementById("seed") as HTMLInputElement;
    const autoSeed = seed.value;
    expect(autoSeed).not.toBe("");
    type(document.getElementById("examname") as HTMLInputElement, "Midterm draft");
    type(document.getElementById("groups") as HTMLInputElement, "1,("); // invalid, as a draft can be

    click(button("Documentation"));
    expect($('[data-testid="docs"]')).not.toBeNull();
    expect(($('[data-testid="step"]') as HTMLElement).hidden).toBe(true);
    click(button("Back from docs"));

    expect(heading()).toBe("Exam Configuration");
    expect((document.getElementById("examname") as HTMLInputElement).value).toBe("Midterm draft");
    expect((document.getElementById("seed") as HTMLInputElement).value).toBe(autoSeed);
    expect((document.getElementById("groups") as HTMLInputElement).value).toBe("1,(");
  });

  it("Documentation from the Questions page keeps the question shown, the filter and the edits", () => {
    start();
    click(button("Next: Review questions"));
    click($('[data-testid="chip-2"]'));
    click($('[aria-label="Option B is the correct answer"]'));
    click(button("Changed"));
    expect(chips()).toEqual(["2"]);
    click(button("Documentation"));
    // The hidden page does not take the arrow keys meanwhile.
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    click(button("Back from docs"));
    expect($('[data-testid="question-title"]')?.textContent).toBe("Question 2 of 2");
    expect(chips()).toEqual(["2"]);
    expect($('[aria-label="Option B is the correct answer"]')?.getAttribute("aria-checked")).toBe("true");
  });

  it("Start over discards the exam, the edits and the confirmed answers", () => {
    start();
    click(button("Next: Review questions"));
    click($('[aria-label="Option C is the correct answer"]'));
    click(button("Generate"));
    click(button("Generate with these answers"));
    expect($('[data-testid="results"]')).not.toBeNull();
    click(button("Start Over"));
    expect(button("Load test exam")).toBeDefined();
    click(button("Load test exam"));
    click(button("Next: Review questions"));
    expect($('[aria-label="Option A is the correct answer"]')?.getAttribute("aria-checked")).toBe("true");
    // The same change as before is asked again: the confirmed list went with Start over.
    click($('[aria-label="Option C is the correct answer"]'));
    click(button("Generate"));
    expect(dialog()?.textContent).toContain("Q1: A → C");
  });

  it("a file made with an older Examazej: the warning on Details and the reminder on Results", () => {
    nextInfo = { warnings: [], source: { format: "latex" } };
    start();
    expect($('[data-testid="older-file-warning"]')).not.toBeNull();
    click(button("Generate now"));
    expect($('[data-testid="results"]')?.textContent).toContain("older file;");
  });

  it("a file stamped by v1.8 or later: no warning, no reminder", () => {
    nextInfo = { warnings: [], source: { format: "latex", appVersion: "1.8.4" } };
    start();
    expect($('[data-testid="older-file-warning"]')).toBeNull();
    click(button("Generate now"));
    expect($('[data-testid="results"]')?.textContent).not.toContain("older file;");
  });

  it("Details notes follow the groups typed there, and leave out the group notes while they cannot be read", () => {
    nextExam = structuredClone(EXAM);
    nextExam.exam.questions[1] = { ...nextExam.exam.questions[1], fixed: true, legacyFixed: true };
    start();
    const notes = () => $('[data-testid="import-warnings"]')?.textContent ?? "";
    const groups = document.getElementById("groups") as HTMLInputElement;
    expect(notes()).toBe("");
    type(groups, "1,(1)");
    expect(notes()).toContain("Question 2 is inside a (n) group and was %{#fixed}");
    type(groups, "1,(");
    expect(notes()).not.toContain("Question 2 is inside a (n) group");
    type(groups, "2");
    expect(notes()).toBe("");
  });
});
