import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDefaultSettings } from "@/lib/core/settings";
import { copyQuestions } from "@/lib/core/question-edits";
import type { ExamJSON, ExamSettings, Question } from "@/lib/types";
import { QuestionsPage } from "../Questions";

const options = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `opt ${i}` }));
const q = (text: string, extra: Partial<Question> = {}): Question => ({
  text,
  group: 1,
  order: 1,
  choices: [options(4), 0, null],
  keepOnSeparatePage: false,
  ...extra,
});

function exam(questions: Question[], groups: string): ExamJSON {
  return {
    setting: { ...getDefaultSettings(), groups, numberofvestions: 2, seed: "page-seed" } as ExamSettings,
    exam: { name: "master", ordering: null, preamble: "", kept_in_one_page: [], questions },
    options_order: {},
  };
}

let root: Root | undefined;
let latest: ExamJSON | undefined;
let generated = 0;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
    root = undefined;
  }
  document.body.replaceChildren();
  latest = undefined;
  generated = 0;
});

function Harness({ initial }: { initial: ExamJSON }) {
  const [data, setData] = useState(initial);
  const [baseline] = useState(() => copyQuestions(initial.exam.questions));
  return (
    <QuestionsPage
      examData={data}
      baseline={baseline}
      onDataUpdated={(next) => {
        latest = next;
        setData(next);
      }}
      onBack={() => {}}
      onGenerate={() => {
        generated++;
      }}
    />
  );
}

function render(data: ExamJSON) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root?.render(<Harness initial={data} />));
}

const $ = (selector: string) => document.querySelector(selector);
const title = () => $('[data-testid="question-title"]')?.textContent;
const click = (element: Element | null | undefined) => {
  if (!element) throw new Error("element not found");
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};
const button = (name: string) =>
  Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === name);
const switchFor = (label: string) => document.getElementById(
  Array.from(document.querySelectorAll("label")).find((l) => l.textContent === label)?.htmlFor ?? ""
);
const press = (target: EventTarget, key: string) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
const chips = () => Array.from(document.querySelectorAll('[data-testid^="chip-"]')).map((c) => c.textContent);

describe("Questions page", () => {
  it("jumps to a question from its chip and moves with Prev / Next in exam order", () => {
    render(exam([q("Q1"), q("Q2"), q("Q3"), q("Q4")], "2,(2)"));
    expect(title()).toBe("Question 1 of 4");
    click($('[data-testid="chip-3"]'));
    expect(title()).toBe("Question 3 of 4");
    click(button("Next"));
    expect(title()).toBe("Question 4 of 4");
    expect(button("Next")?.disabled).toBe(true);
    click(button("Prev"));
    expect(title()).toBe("Question 3 of 4");
  });

  it("labels each group by what moves", () => {
    render(exam([q("Q1"), q("Q2"), q("Q3"), q("Q4"), q("Q5")], "1,(2),[2]"));
    expect($('[data-testid="group-1"]')?.textContent).toContain("stays in place · questions shuffle");
    expect($('[data-testid="group-2"]')?.textContent).toContain("group moves · order kept");
    expect($('[data-testid="group-3"]')?.textContent).toContain("group moves · questions shuffle");
  });

  it("filters narrow the navigator only; the shown question stays", () => {
    render(exam([q("Q1"), q("Q2", { fixedPosition: true }), q("Q3"), q("Q4")], "4"));
    click($('[data-testid="chip-3"]'));
    click(button("Tagged"));
    expect(chips()).toEqual(["2"]);
    expect(title()).toBe("Question 3 of 4");
    click(button("Next"));
    expect(title()).toBe("Question 4 of 4");
  });

  it("arrow keys change the question, except on a control that uses them", () => {
    render(exam([q("Q1"), q("Q2"), q("Q3")], "3"));
    press(document.body, "ArrowRight");
    expect(title()).toBe("Question 2 of 3");
    const radio = $('[role="radio"]');
    if (!radio) throw new Error("no radio");
    press(radio, "ArrowRight");
    expect(title()).toBe("Question 2 of 3");
    press(switchFor("Keep all options in order") as Element, "ArrowLeft");
    expect(title()).toBe("Question 2 of 3");
    press(document.body, "ArrowLeft");
    expect(title()).toBe("Question 1 of 3");
  });

  it("saves each edit at once and marks the question changed; Reset restores it", () => {
    render(exam([q("Q1", { pinnedOptions: [3] }), q("Q2")], "2"));
    click(switchFor("Keep all options in order"));
    expect(latest?.exam.questions[0]).toMatchObject({ fixedOptions: true });
    expect(latest?.exam.questions[0].pinnedOptions).toBeUndefined();
    expect($('[data-testid="chip-1"]')?.getAttribute("aria-label")).toContain("changed");
    expect($('[data-testid="effect"]')?.textContent).toBe(
      "In every version: it moves within its group; the options stay in order."
    );
    click(button("Reset this question"));
    expect(latest?.exam.questions[0].pinnedOptions).toEqual([3]);
    expect(latest?.exam.questions[0].fixedOptions).toBeUndefined();
    expect($('[data-testid="chip-1"]')?.getAttribute("aria-label")).not.toContain("changed");
  });

  it("pins options, says what moves, and warns when no option can move", () => {
    render(exam([q("Q1")], "1"));
    click($('[aria-label="Pin option D"]'));
    expect($('[data-testid="effect"]')?.textContent).toBe("In every version: it moves within its group; D stays D; A–C shuffle.");
    click($('[aria-label="Pin option A"]'));
    click($('[aria-label="Pin option B"]'));
    expect($('[data-testid="nothing-to-shuffle"]')).not.toBeNull();
    expect(latest?.exam.questions[0].pinnedOptions).toEqual([0, 1, 3]);
  });

  it("sets the correct answer with the radio buttons", () => {
    render(exam([q("Q1")], "1"));
    click($('[aria-label="Option C is the correct answer"]'));
    expect(latest?.exam.questions[0].choices[1]).toBe(2);
  });

  it("shows the stored position lock in a (n) group as text, not a switch", () => {
    render(exam([q("Q1", { fixedPosition: true }), q("Q2")], "(2)"));
    expect($('[data-testid="position-in-ordered-group"]')?.textContent).toContain(
      "In place (the group keeps order anyway) · locked in the file"
    );
    expect(switchFor("Keep its place in the group")).toBeNull();
  });

  it("an old-file question gets a warning with its one-click fix", () => {
    render(exam([q("Q1", { fixed: true, legacyFixed: true }), q("Q2")], "(2)"));
    expect($('[data-testid="note-legacy-fixed"]')?.textContent).toContain("(the other questions are not affected)");
    click(button("Shuffle the options, as before v1.8"));
    expect(latest?.exam.questions[0]).toMatchObject({ fixedPosition: true, legacyFixed: true });
    expect(latest?.exam.questions[0].fixed).toBeUndefined();
    expect($('[data-testid="note-legacy-fixed"]')).toBeNull();
  });

  it("confirms an assumed answer without changing it", () => {
    render(exam([q("Q1", { answerAssumed: true, pinnedOptions: [3] })], "1"));
    expect($('[data-testid="note-answer-assumed"]')).not.toBeNull();
    click(button("Answer A is correct"));
    expect(latest?.exam.questions[0]).toMatchObject({ answerChecked: true, choices: [expect.any(Array), 0, null] });
    expect($('[data-testid="note-answer-assumed"]')).toBeNull();
  });

  it("turns Generate off while an own-page question shares its group", () => {
    render(exam([q("Q1"), q("Q2")], "2"));
    const generate = () => button("Generate");
    expect(generate()?.disabled).toBe(false);
    click(switchFor("Put on its own page"));
    expect($('[data-testid="separate-page-errors"]')).not.toBeNull();
    expect(generate()?.disabled).toBe(true);
    click(switchFor("Put on its own page"));
    expect(generate()?.disabled).toBe(false);
    click(generate());
    expect(generated).toBe(1);
  });

  it("says once, at the top, when locks changed the versions", () => {
    render(exam([q("Q1"), q("Q2")], "2"));
    expect($('[data-testid="locks-changed"]')).toBeNull();
    click($('[aria-label="Option B is the correct answer"]'));
    expect($('[data-testid="locks-changed"]')).toBeNull();
    click(switchFor("Keep its place in the group"));
    expect($('[data-testid="locks-changed"]')).not.toBeNull();
  });
});
