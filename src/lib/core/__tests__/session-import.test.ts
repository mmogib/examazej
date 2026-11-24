import { describe, expect, it } from "vitest";
import { importSessionJson } from "../session-import";
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
function session(questions: Question[], groups: string, appVersion?: string): string {
  return JSON.stringify({
    setting: { ...getDefaultSettings(), groups, numberofvestions: 2, seed: "session-seed" },
    exam: { name: "master", ordering: null, preamble: "", questions, kept_in_one_page: [] },
    options_order: {},
    ...(appVersion !== undefined && { app_version: appVersion }),
  });
}

describe("importSessionJson", () => {
  it("marks fixed questions in a session saved before v1.8 and notes the ones in (n) groups", () => {
    const { examData, info } = importSessionJson(
      session([q("Q1", { fixed: true }), q("Q2"), q("Q3", { fixed: true })], "1,(2)")
    );
    expect(examData.exam.questions.map((question) => question.legacyFixed)).toEqual([true, undefined, true]);
    expect(info.madeWith).toBe("Examazej before 1.8 (no app_version)");
    expect(info.warnings).toHaveLength(1);
    expect(info.warnings[0]).toMatch(/^Question 3 is 'fixed' inside a \(n\) group/);
    expect(info.warnings[0]).toContain("using 'fixed-position' instead of 'fixed'");
    expect(info.warnings[0]).toContain("generate and save the session again from the Exam Package");
  });

  it("gives the answer key the same red warning as an old template does", () => {
    const { examData } = importSessionJson(session([q("Q1"), q("Q2", { fixed: true })], "1,(1)"));
    const settings = examData.setting as ExamSettings;
    const { versions, mappings } = generateExamVersions(examData.exam.questions, settings, settings.seed!);
    const { content } = generateLatexDocument(settings, examData.exam, versions, mappings);
    expect(content).toContain("Master question 2 is \\texttt{fixed} inside a (n) group");
  });

  it("adds no note when no fixed question sits in a (n) group", () => {
    const { examData, info } = importSessionJson(session([q("Q1", { fixed: true }), q("Q2")], "2"));
    expect(examData.exam.questions[0].legacyFixed).toBe(true);
    expect(info.warnings).toEqual([]);
  });

  it("leaves a session saved by v1.8 as it is, including markers saved with it", () => {
    const saved = [q("Q1", { fixed: true }), q("Q2", { fixed: true, legacyFixed: true })];
    const { examData, info } = importSessionJson(session(saved, "(2)", "1.8.3"));
    expect(examData.exam.questions.map((question) => question.legacyFixed)).toEqual([undefined, true]);
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
