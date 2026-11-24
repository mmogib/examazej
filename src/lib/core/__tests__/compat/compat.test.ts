/**
 * Every file gives the same exams as 1.8.4 did, for the same seed: the same versions, answers,
 * mapping files and documents. The expected output was recorded by running `pipeline.ts` on the
 * released code of 1.8.4 (see `README.md` here). Exams printed by releases before 1.8 are not
 * made again (D15); their files are here to show that 1.9 reads them as 1.8.4 did.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildExamPackage } from "../../exam-package";
import { parseLatexTemplate } from "../../parser";
import { importSessionJson } from "../../session-import";
import { mergeSettingsWithDefaults } from "../../settings";
import { generateExamVersions } from "../../versioning";
import type { ExamJSON, ExamSettings, Question } from "../../../types";
import { FIXTURES, generateRun, GROUP_SETTINGS, NEW_FILES, OLD_FILES, readFixture, SEEDS, type Run } from "./pipeline";

const v184 = (JSON.parse(readFileSync(join(FIXTURES, "golden-1.8.4.json"), "utf8")) as { runs: Record<string, Run[]> })
  .runs;

const withGroups = (exam: ExamJSON, groups: string): ExamJSON => ({ ...exam, setting: { ...exam.setting, groups } });

describe("the same exams as 1.8.4, for every file and seed", () => {
  it("covers every fixture, old and new, in every group and seed setting", () => {
    expect(Object.keys(v184).sort()).toEqual([...OLD_FILES, ...NEW_FILES].sort());
    Object.values(v184).forEach((runs) =>
      expect(runs).toHaveLength(GROUP_SETTINGS.length * SEEDS.length)
    );
  });

  it.each([...OLD_FILES, ...NEW_FILES])("%s fixes every setting that would default to today's date", async (name) => {
    // The exam date and the term default to today's; the recorded documents must not depend on it.
    const { setting } = await readFixture(name);
    expect({ examdate: setting.examdate, term: setting.term }).toEqual({ examdate: "June 01, 2026", term: "Term 252" });
  });

  it.each([...OLD_FILES, ...NEW_FILES])("%s: versions, answers, mapping files and documents", async (name) => {
    const exam = await readFixture(name);
    for (const expected of v184[name]) {
      expect(generateRun(exam, expected.groups, expected.seed, true)).toEqual(expected);
    }
  });
});

describe("the Exam Package of every file reopens as the same exam", () => {
  it.each([...OLD_FILES, ...NEW_FILES])("%s, through _template.tex and _session.json", async (name) => {
    const uploaded = await readFixture(name);
    for (const expected of v184[name]) {
      const exam = withGroups(uploaded, expected.groups);
      const settings = { ...exam.setting, numberofvestions: 4, seed: expected.seed } as ExamSettings;
      const { versions, mappings } = generateExamVersions(exam.exam.questions, settings, expected.seed);
      const files = buildExamPackage(
        { ...exam, setting: settings },
        { settings, questions: exam.exam.questions, versions, mappings, seed: expected.seed },
        true
      );

      const template = parseLatexTemplate(files.template);
      const fromTemplate: ExamJSON = {
        setting: mergeSettingsWithDefaults(template.settings) as ExamSettings,
        exam: {
          ...exam.exam,
          questions: template.questions.map((q, i) => ({ ...q, group: 1, order: i + 1 })) as Question[],
        },
        options_order: {},
      };
      expect(fromTemplate.setting.seed).toBe(expected.seed);
      expect(fromTemplate.setting.groups).toBe(expected.groups);
      expect(generateRun(fromTemplate, "", fromTemplate.setting.seed!, false).mappings).toEqual(expected.mappings);

      const fromSession = importSessionJson(files.session).examData;
      expect(fromSession.setting.seed).toBe(expected.seed);
      expect(generateRun(fromSession, "", fromSession.setting.seed!, false).mappings).toEqual(expected.mappings);
    }
  });
});
