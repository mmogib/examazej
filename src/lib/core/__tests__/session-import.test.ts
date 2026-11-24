import { describe, expect, it } from "vitest";
import { importSessionJson } from "../session-import";
import { getQuestionNoteSummary } from "../import-notes";
import { getDefaultSettings } from "../settings";
import { generateExamVersions } from "../versioning";
import { generateLatexDocument } from "../latex";
import type { ExamSettings, Question } from "../../types";

const options = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `o${i}` }));
const q = (text: string, extra: Partial<Question> = {}): Question => ({
  text,
  group: 1,
  order: 1,
  choices: [options(4), 0, null],
  keepOnSeparatePage: false,
  ...extra,
});

/** A session file as the Exam Package saves it; `app_version` only when given. */
function session(questions: object[], groups: string, appVersion?: string): string {
  return JSON.stringify({
    setting: { ...getDefaultSettings(), groups, numberofvestions: 2, seed: "session-seed" },
    exam: { name: "master", ordering: null, preamble: "", questions, kept_in_one_page: [] },
    options_order: {},
    ...(appVersion !== undefined && { app_version: appVersion }),
  });
}

describe("importSessionJson", () => {
  it("reads a session saved by an older Examazej as it is, and says where it came from", () => {
    const questions = [q("Q1", { fixed: true }), q("Q2"), q("Q3", { fixed: true })];
    const { examData, info } = importSessionJson(session(questions, "1,(2)"));
    expect(examData.exam.questions).toEqual(questions);
    expect(info.madeWith).toBe("an older Examazej (no app_version)");
    expect(info.warnings).toEqual([]);
    expect(info.source).toEqual({ format: "session", appVersion: undefined });
    expect(getQuestionNoteSummary(examData.exam.questions, info.source)).toEqual([]);
  });

  it("drops the markers 1.8 wrote for remaking old exams, and keeps the others", () => {
    const saved = [
      { ...q("Q1", { fixed: true }), legacyFixed: true },
      {
        ...q("Q2", { pinnedOptions: [1], legacyPin: { answerFromLetter: true }, answerChecked: true }),
        legacyRead: { tags: [], fixed: false, fixedOptions: false, separatePage: false, answer: 0 },
      },
    ];
    const { examData } = importSessionJson(session(saved, "2", "1.8.4"));
    expect(examData.exam.questions[0]).not.toHaveProperty("legacyFixed");
    expect(examData.exam.questions[1]).not.toHaveProperty("legacyRead");
    expect(examData.exam.questions[1]).toMatchObject({ legacyPin: { answerFromLetter: true }, answerChecked: true });
  });

  it("the answer key of an old session carries no warning box", () => {
    const { examData } = importSessionJson(session([q("Q1"), q("Q2", { fixed: true })], "1,(1)"));
    const settings = examData.setting as ExamSettings;
    const { versions, mappings } = generateExamVersions(examData.exam.questions, settings, settings.seed!);
    const { content } = generateLatexDocument(settings, examData.exam, versions, mappings);
    expect(content).not.toContain("WARNING: this answer key");
  });

  it("leaves a session saved by v1.8 as it is", () => {
    const { examData, info } = importSessionJson(session([q("Q1", { fixed: true }), q("Q2")], "(2)", "1.8.3"));
    expect(examData.exam.questions[0]).toMatchObject({ fixed: true });
    expect(info.warnings).toEqual([]);
    expect(info.madeWith).toBe("Examazej 1.8.3");
  });

  it("notes a session from a newer app, like the template readers do", () => {
    const { info } = importSessionJson(session([q("Q1")], "1", "99.0.0"));
    expect(info.warnings[0]).toMatch(/^This file was made with Examazej 99\.0\.0, which is newer than this app/);
  });

  it("fills missing settings with the defaults", () => {
    const content = JSON.parse(session([q("Q1")], "1", "1.8.3"));
    delete content.setting.examtype;
    const { examData } = importSessionJson(JSON.stringify(content));
    expect(examData.setting.examtype).toBe(getDefaultSettings().examtype);
  });
});
