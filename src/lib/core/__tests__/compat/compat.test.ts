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
import { generateLatexDocument } from "../../latex";
import { parseLatexTemplate } from "../../parser";
import { importSessionJson } from "../../session-import";
import { generateExamVersions } from "../../versioning";
import type { ExamJSON, ExamSettings } from "../../../types";
import {
  createExamFromTemplate,
  FIXTURES,
  generateRun,
  GROUP_SETTINGS,
  NEW_FILES,
  normalizeDocument,
  OLD_FILES,
  readFixture,
  SEEDS,
  type Run,
} from "./pipeline";

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

describe("the documents are compared without the app's version, and nothing else", () => {
  // The exam document as generated now, with this build's version stamps in it.
  const document = async () => {
    const exam = await readFixture("new.tex");
    const settings = { ...exam.setting, numberofvestions: 2, seed: "normalize-seed" } as ExamSettings;
    const { versions, mappings } = generateExamVersions(exam.exam.questions, settings, "normalize-seed");
    return generateLatexDocument(settings, exam.exam, versions, mappings, true).content;
  };

  it("a version-only change, as the generator writes the stamps, is ignored", async () => {
    const now = await document();
    expect(now).toMatch(/^%\t+app_version=\S+$/m); // the settings block's own spelling
    const bumped = now
      .replace(/^(%\t+app_version=)\S+$/m, "$1" + "99.1.0")
      .replace(/Made with Examazej \S+/, "Made with Examazej 99.1.0");
    expect(bumped).not.toBe(now);
    expect(normalizeDocument(bumped)).toBe(normalizeDocument(now));
  });

  it("a change to the seed, the groups or an answer is not", async () => {
    const now = await document();
    const changed = [
      now.replace(/^(%\t+seed=)\S+$/m, "$1other-seed"),
      now.replace(/^(%\t+groups=)\S+$/m, "$1" + "12"),
      now.replace("{\\small (correct)}", ""),
    ];
    for (const text of changed) {
      expect(text).not.toBe(now);
      expect(normalizeDocument(text)).not.toBe(normalizeDocument(now));
    }
  });
});

describe("the Exam Package of every file reopens as the same exam", () => {
  /** Every version as printed: question text, option texts and answer, plus the mappings. */
  const printed = (exam: ExamJSON, seed: string) => {
    const { versions, mappings } = generateExamVersions(exam.exam.questions, exam.setting, seed);
    return {
      mappings,
      versions: versions.map((v) =>
        v.questions.map((q) => [q.text.trim(), q.choices[0].map((c) => c.text.trim()), q.choices[1]])
      ),
    };
  };

  it.each([...OLD_FILES, ...NEW_FILES])("%s, through _template.tex and _session.json", async (name) => {
    const uploaded = await readFixture(name);
    for (const expected of v184[name]) {
      const exam = withGroups(uploaded, expected.groups);
      const setting = { ...exam.setting, numberofvestions: 4, seed: expected.seed } as ExamSettings;
      const made: ExamJSON = { ...exam, setting };
      const { versions, mappings } = generateExamVersions(exam.exam.questions, setting, expected.seed);
      const files = buildExamPackage(
        made,
        { settings: setting, questions: exam.exam.questions, versions, mappings, seed: expected.seed },
        true
      );
      const original = printed(made, expected.seed);
      expect(original.mappings.map((m) => `${m.version}:${m.versionQNo}=${m.masterQNo}/${m.perm}/${m.correct}`)).toEqual(
        expected.mappings
      );

      // The template, read back as the Start page reads a file: its own settings and preamble.
      const fromTemplate = createExamFromTemplate(parseLatexTemplate(files.template));
      expect(fromTemplate.setting.seed).toBe(expected.seed);
      expect(fromTemplate.setting.groups).toBe(expected.groups);
      expect(fromTemplate.exam.preamble.trim()).toBe(made.exam.preamble.trim());
      expect(printed(fromTemplate, fromTemplate.setting.seed!)).toEqual(original);

      const fromSession = importSessionJson(files.session).examData;
      expect(fromSession.setting.seed).toBe(expected.seed);
      expect(fromSession.exam.preamble).toBe(made.exam.preamble);
      expect(printed(fromSession, fromSession.setting.seed!)).toEqual(original);
    }
  });
});
