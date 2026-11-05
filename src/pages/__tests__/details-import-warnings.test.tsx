import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { getDefaultSettings } from "@/lib/core/settings";
import type { ExamJSON, ExamSettings } from "@/lib/types";
import { DetailsPage } from "../Details";

const examData: ExamJSON = {
  setting: {
    ...getDefaultSettings(),
    groups: "1",
    numberofvestions: 1,
    seed: "warnings-test",
  } as ExamSettings,
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

function renderDetails(importWarnings?: string[], madeWith?: string) {
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
        importWarnings={importWarnings}
        madeWith={madeWith}
      />,
    );
  });
}

describe("Details page import warnings", () => {
  it("lists every warning from the uploaded file", () => {
    renderDetails([
      "Question 3 uses %{#fixed-options:X}, which changed meaning in v1.8.",
      "Question 5: %{#correct:B} is ignored because this question has no options (open-ended).",
    ]);

    const box = document.querySelector('[data-testid="import-warnings"]');
    expect(box?.textContent).toContain("2 notes about your file");
    expect(Array.from(box?.querySelectorAll("li") ?? []).map((li) => li.textContent)).toEqual([
      "Question 3 uses %{#fixed-options:X}, which changed meaning in v1.8.",
      "Question 5: %{#correct:B} is ignored because this question has no options (open-ended).",
    ]);
  });

  it("shows nothing when the file had no warnings", () => {
    renderDetails();
    expect(document.querySelector('[data-testid="import-warnings"]')).toBeNull();
  });

  it("shows which app made the file in the summary, and hides the line when unknown", () => {
    renderDetails([], "Examazej before 1.8 (no app_version)");
    expect(document.querySelector('[data-testid="made-with"]')?.textContent).toBe(
      "Made withExamazej before 1.8 (no app_version)"
    );
    act(() => root?.unmount());
    root = undefined;
    document.body.replaceChildren();

    renderDetails([]);
    expect(document.querySelector('[data-testid="made-with"]')).toBeNull();
  });
});
