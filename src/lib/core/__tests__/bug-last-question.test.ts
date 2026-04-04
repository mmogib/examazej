import { describe, it, expect } from "vitest";
import { generateExamVersions } from "../versioning";
import type { Question, ExamSettings } from "../../types";

describe("Last question should vary across versions", () => {
  const makeQuestions = (count: number): Question[] =>
    Array.from({ length: count }, (_, i) => ({
      text: `Question ${i + 1}`,
      group: 1,
      order: i + 1,
      choices: [
        [{ text: "A" }, { text: "B" }, { text: "C" }, { text: "D" }],
        0,
        null,
      ],
      fixed: false,
      fixedOptions: false,
      keepOnSeparatePage: false,
    }));

  const makeSettings = (groups: string, numVersions: number): ExamSettings => ({
    university: "U",
    department: "D",
    term: "T",
    coursecode: "C",
    examname: "E",
    examdate: "D",
    timeallowed: "60",
    numberofvestions: numVersions,
    groups,
    examtype: "MAJOR",
    code_name: "CODE",
    code_numbering: "ALPHA",
    paper_size: "A4",
    instructions: "",
    includeCoverPage: true,
    seed: "test",
  });

  it("multiple groups (5,5,5)", () => {
    const { versions } = generateExamVersions(
      makeQuestions(15), makeSettings("5,5,5", 4), "test-seed"
    );
    const lastQs = versions.map((v) => v.questions[v.questions.length - 1].text);
    expect(lastQs.every((q) => q === lastQs[0])).toBe(false);
  });

  it("two groups (7,8)", () => {
    const { versions } = generateExamVersions(
      makeQuestions(15), makeSettings("7,8", 4), "test-seed"
    );
    const lastQs = versions.map((v) => v.questions[v.questions.length - 1].text);
    expect(lastQs.every((q) => q === lastQs[0])).toBe(false);
  });

  it("single group", () => {
    const { versions } = generateExamVersions(
      makeQuestions(10), makeSettings("10", 4), "test-seed"
    );
    const lastQs = versions.map((v) => v.questions[v.questions.length - 1].text);
    expect(lastQs.every((q) => q === lastQs[0])).toBe(false);
  });

  it("consistent across multiple seeds", () => {
    const questions = makeQuestions(15);
    const settings = makeSettings("5,5,5", 4);
    let bugCount = 0;

    for (const seed of ["seed-1", "seed-2", "seed-3", "abc", "xyz"]) {
      const { versions } = generateExamVersions(questions, settings, seed);
      const lastQs = versions.map((v) => v.questions[v.questions.length - 1].text);
      if (lastQs.every((q) => q === lastQs[0])) bugCount++;
    }

    expect(bugCount).toBe(0);
  });
});
