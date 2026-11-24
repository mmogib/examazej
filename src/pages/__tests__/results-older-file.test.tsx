import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDefaultSettings } from "@/lib/core/settings";
import type { ExamJSON, ExamSettings } from "@/lib/types";
import { ResultsPage } from "../Results";

/** The real Results page: the one-line reminder for an exam made from an older Examazej's file. */
const EXAM: ExamJSON = {
  setting: { ...getDefaultSettings(), groups: "2", numberofvestions: 2, seed: "results-seed" } as ExamSettings,
  exam: {
    name: "master",
    ordering: null,
    preamble: "",
    kept_in_one_page: [],
    questions: [1, 2].map((n) => ({
      text: `Q${n}`,
      group: 1,
      order: n,
      choices: [[{ text: "a" }, { text: "b" }, { text: "c" }], 0, null],
      keepOnSeparatePage: false,
    })),
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

function render(olderFile: boolean | undefined) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root?.render(<ResultsPage examData={EXAM} seed="results-seed" onBack={() => {}} olderFile={olderFile} />));
}

describe("Results page and files made with an older Examazej", () => {
  it("shows the reminder for such a file", () => {
    render(true);
    const reminder = document.querySelector('[data-testid="older-file-reminder"]')?.textContent ?? "";
    expect(reminder).toContain("Made from a file of an older Examazej");
    expect(reminder).toContain("Grade those with the answer key printed with them.");
  });

  it("shows nothing for any other file", () => {
    render(false);
    expect(document.querySelector('[data-testid="older-file-reminder"]')).toBeNull();
    act(() => root?.unmount());
    render(undefined);
    expect(document.querySelector('[data-testid="older-file-reminder"]')).toBeNull();
  });
});
