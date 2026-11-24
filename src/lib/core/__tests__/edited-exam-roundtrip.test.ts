import { describe, expect, it } from "vitest";
import { parseLatexTemplate } from "../parser";
import { buildExamPackage } from "../exam-package";
import { mergeSettingsWithDefaults } from "../settings";
import { generateExamVersions } from "../versioning";
import { importSessionJson } from "../session-import";
import { getQuestionNoteSummary } from "../import-notes";
import {
  fixLegacyFixed,
  fixLegacyPin,
  setCorrectAnswer,
  setOptionsLock,
  togglePin,
} from "../question-edits";
import { parseCSV } from "../../parsers/csv-parser";
import { convertToLatexFormat } from "../../parsers/adapter";
import { generateCSVTemplate } from "../../generators/csv-template";
import type { ExamData, ExamJSON, ExamSettings, GenerationState, ParsedLatexTemplate, Question } from "../../types";

const BEGIN = "\\begin{enumerate}";
const END = "\\end{enumerate}";
const mcq = (text: string, tags: string[], opts: string[]) => [
  "\\item",
  ...tags,
  `%{#q}${text}%{/q}`,
  BEGIN,
  ...opts.map((o) => `\\item %{#o}${o}%{/o}`),
  END,
];
const four = (prefix: string) => [`${prefix} one`, `${prefix} two`, `${prefix} three`, `${prefix} four`];

// A file made before v1.8 (no app_version) with groups in all three modes, old-file tags, two
// questions with the same wording and an open-ended one.
const OLD_FILE = [
  "%{#setting}",
  "%groups=3,(3),[3]",
  "%numberofvestions=6",
  "%seed=edit-seed",
  "%{/setting}",
  BEGIN,
  ...mcq("Q1 plain", [], four("a")),
  ...mcq("Q2 answer B", ["%{#correct:B}"], four("b")),
  ...mcq("Q3 old pin, answer from the letter", ["%{#fixed-options:B}"], four("c")),
  ...mcq("Q4 old fixed in (n)", ["%{#fixed}"], four("d")),
  ...mcq("Q5 position lock in (n)", ["%{#fixed-position}", "%{#correct:C}"], four("e")),
  ...mcq("Q6 plain in (n)", [], four("f")),
  ...mcq("Same wording", ["%{#correct:C}"], four("g")),
  ...mcq("Same wording", ["%{#fixed-options:D}"], four("h")),
  "\\item",
  "%{#q}Q9 open-ended%{/q}",
  END,
].join("\n");

function toExam(template: ParsedLatexTemplate): { settings: ExamSettings; exam: ExamData } {
  const settings = mergeSettingsWithDefaults(template.settings) as ExamSettings;
  const questions = template.questions.map((q, i) => ({ ...q, group: 1, order: i + 1 })) as Question[];
  return { settings, exam: { name: "master", ordering: null, preamble: template.preamble || "", questions, kept_in_one_page: [] } };
}

/** Every version as printed: question text, option texts and answer, plus the mappings. */
function generated(questions: Question[], settings: ExamSettings, seed = settings.seed ?? "") {
  expect(seed).not.toBe("");
  const { versions, mappings } = generateExamVersions(questions, settings, seed);
  return {
    mappings,
    versions: versions.map((v) =>
      v.questions.map((q) => [q.text.trim(), q.choices[0].map((c) => c.text.trim()), q.choices[1]])
    ),
  };
}

describe("an exam edited on the Questions page reopens as the same exam", () => {
  const { settings, exam } = toExam(parseLatexTemplate(OLD_FILE));
  const uploaded = exam.questions;
  const edited = [...uploaded];
  // N-1 pins: A, B and C stay; only D could move, so nothing moves.
  edited[0] = togglePin(togglePin(togglePin(uploaded[0], 0, uploaded[0]), 1, uploaded[0]), 2, uploaded[0]);
  edited[1] = setCorrectAnswer(uploaded[1], 3);
  edited[2] = setCorrectAnswer(fixLegacyPin(uploaded[2], uploaded[2]), 1); // repaired and checked
  edited[3] = fixLegacyFixed(uploaded[3], uploaded[3]); // repaired
  edited[4] = setOptionsLock(uploaded[4], true, uploaded[4]); // the pair inside (n)
  const editedExam: ExamData = { ...exam, questions: edited };
  // The Exam Package, as Results builds it for this exam and seed.
  const examData: ExamJSON = { setting: settings, exam: editedExam, options_order: {} };
  const { versions, mappings } = generateExamVersions(edited, settings, "edit-seed");
  const state: GenerationState = { settings, questions: edited, versions, mappings, seed: "edit-seed" };
  const files = buildExamPackage(examData, state, true);

  it("the edits are the ones intended", () => {
    expect(edited[0].pinnedOptions).toEqual([0, 1, 2]);
    expect(edited[2]).toMatchObject({ fixedOptions: true, answerChecked: true, legacyPin: { answerFromLetter: true } });
    expect(edited[2].pinnedOptions).toBeUndefined();
    expect(edited[3]).toMatchObject({ fixedPosition: true, legacyFixed: true });
    expect(edited[3].fixed).toBeUndefined();
    expect(edited[4]).toMatchObject({ fixedPosition: true, fixedOptions: true });
    expect(edited[7].legacyPin).toEqual({ answerFromLetter: true });
    // Only the unrepaired old pin (Q8) still has a note, with its answer from the letter; and
    // Q1's answer A is now pinned.
    expect(getQuestionNoteSummary(edited, settings.groups)).toEqual([
      expect.stringMatching(/^Question 8 came with %\{#fixed-options:X\}.*This file has no app_version.*Q8 D\./),
      "In Question 1 the correct answer is a pinned option, so it has the same letter in every version.",
    ]);
  });

  it("through _template.tex", () => {
    const reopened = toExam(parseLatexTemplate(files.template));
    expect(reopened.settings.groups).toBe("3,(3),[3]");
    expect(reopened.settings.seed).toBe("edit-seed");
    expect(generated(reopened.exam.questions, reopened.settings)).toEqual(generated(edited, settings));
    // A template is a current-version file: it states every answer and carries no markers.
    expect(reopened.exam.questions.some((q) => q.legacyPin || q.legacyFixed || q.answerAssumed)).toBe(false);
  });

  it("through _session.json, which keeps the markers and the checked answer", () => {
    const { examData: reopened, info } = importSessionJson(files.session);
    expect(reopened.setting.seed).toBe("edit-seed");
    expect(JSON.parse(files.session).generation.seed).toBe("edit-seed");
    expect(generated(reopened.exam.questions, reopened.setting)).toEqual(generated(edited, settings));
    expect(reopened.exam.questions[2]).toMatchObject({ answerChecked: true, legacyPin: { answerFromLetter: true } });
    expect(getQuestionNoteSummary(reopened.exam.questions, reopened.setting.groups, info.source)).toEqual([
      expect.stringMatching(
        /^Question 8 came with %\{#fixed-options:X\}.*These questions came from a file made with the older Examazej \(this file was saved by Examazej \d/
      ),
      "In Question 1 the correct answer is a pinned option, so it has the same letter in every version.",
    ]);
  });

  it("an answer-only edit changes only that question's answer letters", () => {
    const before = generated(uploaded, settings).mappings;
    const answerOnly = [...uploaded];
    answerOnly[1] = setCorrectAnswer(uploaded[1], 3);
    const after = generated(answerOnly, settings).mappings;
    expect(after.map(({ correct, ...rest }) => rest)).toEqual(before.map(({ correct, ...rest }) => rest));
    after.forEach((m, i) => {
      if (m.masterQNo !== 2) expect(m.correct).toBe(before[i].correct);
    });
    expect(after.filter((m) => m.masterQNo === 2).map((m) => m.correct)).not.toEqual(
      before.filter((m) => m.masterQNo === 2).map((m) => m.correct)
    );
  });
});

describe("CSV quotes", () => {
  const head = ["# settings", "groups,2", "numberofvestions,2", "seed,s", "", "# questions",
    "Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags"];

  it("reads doubled quotes as Excel and Google Sheets write them", () => {
    const parsed = parseCSV([...head, '"Interpret ""a,b"".","say ""hi""",y,,,,B,', '"Q2","q",r,,,,A,'].join("\n"));
    expect(parsed.questions[0].text).toBe('Interpret "a,b".');
    expect(parsed.questions[0].choices[0].map((c) => c.text)).toEqual(['say "hi"', "y"]);
    expect(parsed.questions[0].choices[1]).toBe(1);
  });

  it("keeps empty quoted fields empty", () => {
    const parsed = parseCSV([...head, '"Q1","x","y","","","","A",""', '"Q2","p","q","","","","B",""'].join("\n"));
    expect(parsed.questions[0].choices[0].map((c) => c.text)).toEqual(["x", "y"]);
    expect(parsed.questions[1].choices[1]).toBe(1);
  });

  it("the CSV writer and reader keep quotes, commas and new lines", () => {
    const base = toExam(convertToLatexFormat(parseCSV([...head, "plain,x,y,,,,B,", "Q2,p,q,,,,A,fixed-position"].join("\n"))));
    const questions = base.exam.questions.map((q) => ({ ...q }));
    questions[0] = {
      ...questions[0],
      text: 'Interpret "a,b", then\nexplain "why".',
      choices: [[{ text: '"x"' }, { text: "a, b" }], 1, null],
    };
    const again = parseCSV(generateCSVTemplate(base.settings, { ...base.exam, questions }));
    expect(again.questions[0].text).toBe('Interpret "a,b", then\nexplain "why".');
    expect(again.questions[0].choices[0].map((c) => c.text)).toEqual(['"x"', "a, b"]);
    expect(again.questions[0].choices[1]).toBe(1);
    expect(again.questions[1]).toMatchObject({ fixedPosition: true, choices: [expect.any(Array), 0, null] });
  });
});
