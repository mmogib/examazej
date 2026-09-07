import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { ExamJSON } from "@/lib/types";
import { DetailsPage } from "../Details";

const baseExamData: ExamJSON = {
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

let root: Root | undefined;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
    root = undefined;
  }
  document.body.replaceChildren();
});

function createExamData(overrides: Partial<ExamJSON["setting"]> = {}): ExamJSON {
  return {
    ...baseExamData,
    setting: { ...baseExamData.setting, ...overrides },
    exam: {
      ...baseExamData.exam,
      questions: baseExamData.exam.questions.map((question) => ({ ...question })),
    },
    options_order: {},
  };
}

function renderDetails(examData = createExamData()) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      <DetailsPage
        examData={examData}
        onDataUpdated={vi.fn()}
        onBack={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
  });
}

function getButton(name: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Could not find button: ${name}`);
  }
  return button;
}

function getSwitch(name: string): HTMLButtonElement {
  const switches = Array.from(document.querySelectorAll('[role="switch"]'));
  const control = switches.find(
    (candidate) => candidate.getAttribute("aria-label") === name,
  );
  if (!(control instanceof HTMLButtonElement)) {
    throw new Error(`Could not find switch: ${name}`);
  }
  return control;
}

function getTextarea(): HTMLTextAreaElement {
  const textarea = document.querySelector("#academic-integrity-pledge-text");
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error("Could not find the pledge text textarea");
  }
  return textarea;
}

function click(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function changeTextarea(value: string) {
  const textarea = getTextarea();
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  act(() => {
    valueSetter?.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("DetailsPage academic integrity pledge", () => {
  it("disables pledge editing without erasing it when cover pages are off", () => {
    renderDetails();

    click(getButton("Edit pledge"));
    changeTextarea("Retained custom pledge.");
    click(getButton("Save"));
    click(getSwitch("Include Cover Pages"));

    expect(getSwitch("Include Academic Integrity Pledge").disabled).toBe(true);
    expect(document.body.textContent).not.toContain("Edit pledge");

    click(getSwitch("Include Cover Pages"));
    click(getButton("Edit pledge"));
    expect(getTextarea().value).toBe("Retained custom pledge.");
  });

  it.each([
    {
      includeCoverPage: true,
      includeAcademicIntegrityPledge: true,
      expected: true,
    },
    {
      includeCoverPage: false,
      includeAcademicIntegrityPledge: true,
      expected: false,
    },
    {
      includeCoverPage: true,
      includeAcademicIntegrityPledge: false,
      expected: false,
    },
  ])(
    "validates empty pledge text only when cover=$includeCoverPage and pledge=$includeAcademicIntegrityPledge",
    ({ includeCoverPage, includeAcademicIntegrityPledge, expected }) => {
      renderDetails(
        createExamData({
          includeCoverPage,
          includeAcademicIntegrityPledge,
          academicIntegrityPledgeText: " \n\t ",
        }),
      );

      expect(
        document.body.textContent?.includes(
          "Enter academic integrity pledge text or disable the pledge",
        ),
      ).toBe(expected);
    },
  );
});
