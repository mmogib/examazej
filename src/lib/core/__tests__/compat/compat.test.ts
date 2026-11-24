/**
 * Files made before v1.8 and files made by 1.8.4 give the same exams as before, for the same
 * seed: the same versions, answers and mapping files. The expected output was recorded by
 * running `pipeline.ts` on the released code of 1.7.0 and 1.8.4 (see `README.md` here).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildExamPackage } from "../../exam-package";
import { describeGroups } from "../../group-config";
import { findLegacyDifferences } from "../../import-notes";
import { parseLatexTemplate } from "../../parser";
import { fixLegacyFixed, fixLegacyPin, matchOldReading } from "../../question-edits";
import { importSessionJson } from "../../session-import";
import { mergeSettingsWithDefaults } from "../../settings";
import { generateExamVersions } from "../../versioning";
import type { ExamJSON, ExamSettings, Question } from "../../../types";
import { FIXTURES, generateRun, GROUP_SETTINGS, NEW_FILES, OLD_FILES, readFixture, SEEDS, type Run } from "./pipeline";

const golden = (release: string) =>
  (JSON.parse(readFileSync(join(FIXTURES, `golden-${release}.json`), "utf8")) as { runs: Record<string, Run[]> }).runs;
const v184 = golden("1.8.4");
const v170 = golden("1.7.0");

const withGroups = (exam: ExamJSON, groups: string): ExamJSON => ({ ...exam, setting: { ...exam.setting, groups } });

describe("the same exams as 1.8.4, for every file and seed", () => {
  it("covers every fixture, old and new, in every group and seed setting", () => {
    expect(Object.keys(v184).sort()).toEqual([...OLD_FILES, ...NEW_FILES].sort());
    expect(Object.keys(v170).sort()).toEqual([...OLD_FILES].sort());
    [...Object.values(v184), ...Object.values(v170)].forEach((runs) =>
      expect(runs).toHaveLength(GROUP_SETTINGS.length * SEEDS.length)
    );
  });

  it.each([...OLD_FILES, ...NEW_FILES])("%s: versions, answers, mapping files and documents", async (name) => {
    const exam = await readFixture(name);
    for (const expected of v184[name]) {
      expect(generateRun(exam, expected.groups, expected.seed, true)).toEqual(expected);
    }
  });
});

describe("files made before v1.8: the same exams as 1.7.0 once the old-file warnings are fixed", () => {
  /** Presses "Match my old exams" on every question the page warns about with these groups. */
  function pressEveryFix(exam: ExamJSON, groups: string): { exam: ExamJSON; warned: number } {
    const { pins, fixed, read } = findLegacyDifferences(exam.exam.questions, groups);
    const layout = describeGroups(groups, exam.exam.questions.length);
    const modeOf = (index: number) => layout.find((g) => index >= g.start && index < g.start + g.size)?.mode ?? "standard";
    const questions = exam.exam.questions.map((question, index) => {
      let next: Question = question;
      if (pins.some((p) => p.number === index + 1)) next = fixLegacyPin(next, question);
      if (fixed.some((f) => f.number === index + 1)) next = fixLegacyFixed(next, question);
      if (read.some((r) => r.number === index + 1)) next = matchOldReading(next, modeOf(index), question);
      return next;
    });
    return { exam: { ...exam, exam: { ...exam.exam, questions } }, warned: pins.length + fixed.length + read.length };
  }

  /** The answers the older Examazej took where it did not read the tag that gives the answer. */
  function withOldAnswers(exam: ExamJSON): ExamJSON {
    const questions = exam.exam.questions.map((q) =>
      q.legacyRead && q.choices[0].length > 0 ? { ...q, choices: [q.choices[0], q.legacyRead.answer, null] as Question["choices"] } : q
    );
    return { ...exam, exam: { ...exam.exam, questions } };
  }

  it.each(OLD_FILES)("%s", async (name) => {
    const exam = await readFixture(name);
    for (const expected of v170[name]) {
      const { exam: fixedExam } = pressEveryFix(exam, expected.groups);
      // With the answers it took, exactly the exams of 1.7.0, mapping files included.
      expect(generateRun(withOldAnswers(fixedExam), expected.groups, expected.seed, false)).toEqual(expected);
    }
  });

  it("old-layouts.tex: with the answers the file gives, only those questions' answer letters differ", async () => {
    const exam = await readFixture("old-layouts.tex");
    const changed = exam.exam.questions
      .map((q, i) => (q.legacyRead && q.choices[0].length > 0 && q.legacyRead.answer !== q.choices[1] ? i + 1 : 0))
      .filter(Boolean);
    expect(changed).toEqual([4, 6]); // %{#fixed-options:c}, and %{#fixed-options:B} after an open-ended question
    const withoutLetter = (row: string) => row.replace(/\/[A-E@]$/, "");
    for (const expected of v170["old-layouts.tex"]) {
      const run = generateRun(pressEveryFix(exam, expected.groups).exam, expected.groups, expected.seed, false);
      expect(run.mappings.map(withoutLetter)).toEqual(expected.mappings.map(withoutLetter));
      run.mappings.forEach((row, i) => {
        const master = Number(row.split("=")[1].split("/")[0]);
        if (!changed.includes(master)) expect(row).toBe(expected.mappings[i]);
      });
    }
  });

  it("a run with no warning needs no fix: it is already the exam of 1.7.0", async () => {
    // Without a (n) group, only %{#fixed-options:X} (old.tex) can make a difference: a 1.7
    // spreadsheet's 'fixed-options' and a 1.7 session's flags keep all options in order.
    let quiet = 0;
    for (const name of OLD_FILES) {
      const exam = await readFixture(name);
      for (const expected of v170[name].filter((run) => pressEveryFix(exam, run.groups).warned === 0)) {
        expect(generateRun(exam, expected.groups, expected.seed, false)).toEqual(expected);
        quiet++;
      }
    }
    expect(quiet).toBe(3 * SEEDS.length);
  });

  it("without the fixes, the warnings name every question whose exam differs from 1.7.0", async () => {
    for (const name of OLD_FILES) {
      const exam = await readFixture(name);
      for (const expected of v170[name]) {
        const { warned } = pressEveryFix(exam, expected.groups);
        const differs = JSON.stringify(generateRun(exam, expected.groups, expected.seed, false)) !== JSON.stringify(expected);
        expect({ name, groups: expected.groups, seed: expected.seed, warned: warned > 0 }).toEqual({
          name,
          groups: expected.groups,
          seed: expected.seed,
          warned: differs,
        });
      }
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
