import { describe, expect, it } from "vitest";
import {
  getQuestionNoteSummary,
  getQuestionNotes,
  legacyAnswerKeyWarning,
  legacyReadReach,
} from "../import-notes";
import { parseLatexTemplate } from "../parser";
import { matchOldReading, resetQuestion, setCorrectAnswer, setPositionLock } from "../question-edits";
import { importSessionJson } from "../session-import";
import { getDefaultSettings } from "../settings";
import { generateExamVersions } from "../versioning";
import type { ExamSettings, LegacyReading, Question } from "../../types";

/**
 * A question of a file made before v1.8 that the older Examazej read differently (`legacyRead`):
 * whether it still differs is judged by what the shuffle does, and "Match my old exams" gives the
 * exam it made.
 */
const options = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `o${i}` }));
const q = (text: string, extra: Partial<Question> = {}, count = 4): Question => ({
  text,
  group: 1,
  order: 1,
  choices: [options(count), 0, null],
  keepOnSeparatePage: false,
  ...extra,
});
const reading = (extra: Partial<LegacyReading> = {}): LegacyReading => ({
  tags: [],
  fixed: false,
  fixedOptions: false,
  separatePage: false,
  answer: 0,
  ...extra,
});
const mappings = (exam: Question[], groups: string) => {
  const settings = { ...getDefaultSettings(), groups, numberofvestions: 8 } as ExamSettings;
  return generateExamVersions(exam, settings, "reading-seed").mappings;
};

describe("a question the older Examazej read differently", () => {
  // Read as written: Q2 has %{#fixed}. The older reader gave that tag to Q1, an open-ended
  // question, and Q2 got none.
  const open = q("Q1", { legacyRead: reading({ tags: ["fixed"], fixed: true }) }, 0);
  const tagged = q("Q2", { fixed: true, legacyRead: reading() });
  const exam = [open, tagged, q("Q3"), q("Q4")];
  const oldExam = [q("Q1", { fixed: true }, 0), q("Q2"), q("Q3"), q("Q4")];

  it.each(["4", "[4]"])("differs, and the fix makes the older exam (groups %s)", (groups) => {
    expect(legacyReadReach(open, groups === "4" ? "standard" : "topic")).toBe("wider");
    expect(legacyReadReach(tagged, groups === "4" ? "standard" : "topic")).toBe("wider");
    expect(mappings(exam, groups)).not.toEqual(mappings(oldExam, groups));
    const mode = groups === "4" ? "standard" : "topic";
    const fixed = exam.map((question) => matchOldReading(question, mode, question));
    expect(mappings(fixed, groups)).toEqual(mappings(oldExam, groups));
    expect(getQuestionNotes(fixed, groups).flat()).toEqual([]);
  });

  it("a fixed question in a (n) group: the older exam shuffled its options, so the fix keeps only its place", () => {
    const fixedRead = q("Q", { legacyRead: reading({ tags: ["fixed"], fixed: true }) });
    const fixed = matchOldReading(fixedRead, "ordered", fixedRead);
    expect(fixed).toMatchObject({ fixedPosition: true });
    expect(fixed.fixed).toBeUndefined();
    // As v1.7 made it: `fixed` in a (n) group shuffled the options like no lock at all.
    expect(mappings([fixed, q("B")], "(2)")).toEqual(mappings([q("Q"), q("B")], "(2)"));
    // The same reading in a standard group: place and options kept.
    expect(matchOldReading(fixedRead, "standard", fixedRead)).toMatchObject({ fixed: true });
  });

  it("an edit that gives the older reading by hand ends the warning too", () => {
    const untagged = q("Q", { legacyRead: reading({ tags: ["fixed"], fixed: true }) });
    expect(legacyReadReach(untagged, "standard")).toBe("wider");
    const locked = setPositionLock(setPositionLock(untagged, true), true);
    expect(legacyReadReach(locked, "standard")).toBe("wider"); // place kept, options not yet
    expect(legacyReadReach({ ...untagged, fixed: true }, "standard")).toBeNull();
  });

  it("only its page differs: this question only", () => {
    const paged = q("Q", { keepOnSeparatePage: true, legacyRead: reading() });
    expect(legacyReadReach(paged, "standard")).toBe("this");
    expect(matchOldReading(paged, "standard", paged).keepOnSeparatePage).toBe(false);
  });

  it("an open-ended question takes the answer index the older reader gave it (only its mapping line shows it)", () => {
    const open = q("Q", { legacyRead: reading({ tags: ["fixed-options:B"], fixedOptions: true, answer: 1 }) }, 0);
    const fixed = matchOldReading(open, "ordered", open);
    expect(fixed).toMatchObject({ fixedOptions: true, choices: [[], 1, null] });
    expect(legacyReadReach(fixed, "ordered")).toBeNull();
    expect(mappings([fixed], "(1)")[0]).toMatchObject({ perm: "ABCDE", correct: "B" });
  });

  it("keeps the answer the file gives, notes the old one until it is confirmed; Reset brings the note back", () => {
    const uploaded = q("Q", { pinnedOptions: [2], choices: [options(4), 2, null], legacyRead: reading({ answer: 0 }) });
    const fixed = matchOldReading(uploaded, "standard", uploaded);
    expect(fixed.choices[1]).toBe(2);
    expect(fixed.pinnedOptions).toBeUndefined();
    expect(getQuestionNotes([fixed], "1")).toEqual([[{ kind: "legacyReadAnswer", then: "A" }]]);
    expect(getQuestionNoteSummary([fixed], "1")).toEqual([
      "The older Examazej took another answer for Question 1, because it did not read the tag that gives the " +
        "answer: Q1 A, now C. The answer keys made with it were wrong for this question. Check it on the Questions page.",
    ]);
    const confirmed = setCorrectAnswer(fixed, 2);
    expect(confirmed.answerChecked).toBe(true);
    expect(getQuestionNotes([confirmed], "1")).toEqual([[]]);
    expect(getQuestionNotes([resetQuestion(uploaded)], "1")[0].map((n) => n.kind)).toEqual([
      "legacyRead",
      "legacyReadAnswer",
      "pinnedAnswer",
    ]);
  });

  it("needs the groups, like the other old-file warnings", () => {
    expect(getQuestionNotes([tagged], undefined)).toEqual([[]]);
    expect(getQuestionNoteSummary([tagged], undefined)).toEqual([]);
  });
});

describe("the answer key and the session file", () => {
  const file = [
    "\\begin{enumerate}",
    "\\item",
    "%{#q}Explain.%{/q}",
    "\\item",
    "%{#fixed-options:B}",
    "%{#q}After the open-ended one%{/q}",
    "\\begin{enumerate}",
    "\\item %{#o}a%{/o}",
    "\\item %{#o}b%{/o}",
    "\\item %{#o}c%{/o}",
    "\\end{enumerate}",
    "\\end{enumerate}",
  ].join("\n");

  it("the answer key warns and names the button and the old answer", () => {
    const { questions } = parseLatexTemplate(file);
    const key = legacyAnswerKeyWarning(questions as Question[], "2") ?? "";
    expect(key).toContain("read the tags of master questions 1 and 2 differently");
    expect(key).toContain("``Match my old exams'' on the Questions page undoes them, for master questions 1 and 2.");
    expect(key).toContain("The older Examazej took another answer for master question 2");
    expect(key).toContain("(2: A, now B)");
  });

  it("a session file keeps the marker, so the note and the fix come back", () => {
    const { questions, settings } = parseLatexTemplate(file);
    const saved = JSON.stringify({
      setting: { ...getDefaultSettings(), ...settings, groups: "2" },
      exam: { name: "master", ordering: null, preamble: "", kept_in_one_page: [], questions },
      options_order: {},
      app_version: "1.9.0",
    });
    const reopened = importSessionJson(saved).examData.exam.questions;
    expect(reopened[1].legacyRead).toEqual(questions[1].legacyRead);
    expect(getQuestionNotes(reopened, "2")[1].map((n) => n.kind)).toEqual([
      "legacyRead",
      "legacyReadAnswer",
      "pinnedAnswer",
    ]);
  });
});
