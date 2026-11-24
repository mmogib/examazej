import { describe, expect, it } from "vitest";
import { getQuestionNoteSummary, getQuestionNotes, isOlderFile } from "../import-notes";
import { resetQuestion, setCorrectAnswer, setOptionsLock, togglePin } from "../question-edits";
import type { Question } from "../../types";

/**
 * The notes about the questions, on Details (one per kind) and on the Questions page (per
 * question), worked out from the questions as they are now. Exams printed by an older Examazej
 * are not made again (D15), so no note offers to; the notes are about the questions themselves.
 */

const options = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `o${i}` }));
const q = (text: string, extra: Partial<Question> = {}, optionCount = 4): Question => ({
  text,
  group: 1,
  order: 1,
  choices: [options(optionCount), 0, null],
  keepOnSeparatePage: false,
  ...extra,
});
/** An old `%{#fixed-options:B}`: pinned B, answer B taken from the letter. */
const oldPin = (text = "Q", answerFromLetter = true) =>
  q(text, { legacyPin: { answerFromLetter }, pinnedOptions: [1], choices: [options(4), 1, null] });
const kinds = (question: Question) => getQuestionNotes(question).map((note) => note.kind);

describe("an old %{#fixed-options:X}: the note says what it means now", () => {
  it("shows while the question keeps its pins, and points to the switch", () => {
    expect(kinds(oldPin())).toContain("oldPinMeaning");
    expect(getQuestionNoteSummary([oldPin("Q1"), q("Q2"), oldPin("Q3", false)])[0]).toBe(
      'Questions 1 and 3 use %{#fixed-options:X}, which an older Examazej read as "keep all options in order"; ' +
        "now it keeps only option X in place and shuffles the other options. To keep all options in order, turn on " +
        '"Keep all options in order" for these questions on the Questions page.'
    );
  });

  it("goes once all options are kept in order, or the pins are gone", () => {
    const uploaded = oldPin();
    expect(kinds(setOptionsLock(uploaded, true, uploaded))).not.toContain("oldPinMeaning");
    expect(kinds(togglePin(uploaded, 1, uploaded))).not.toContain("oldPinMeaning");
    expect(kinds(resetQuestion(uploaded))).toContain("oldPinMeaning");
  });

  it("is not shown for a pin from a current file", () => {
    expect(kinds(q("Q", { pinnedOptions: [1], choices: [options(4), 1, null] }))).toEqual(["pinnedAnswer"]);
  });
});

describe("answers", () => {
  it("an answer taken from the letter keeps its note until it is checked; Reset brings it back", () => {
    const uploaded = oldPin("Q1");
    expect(kinds(uploaded)).toEqual(["oldPinMeaning", "answerFromLetter", "pinnedAnswer"]);
    expect(getQuestionNoteSummary([uploaded])[1]).toBe(
      "The file gives no %{#correct:X} for Question 1, so its answer was taken from the letter in " +
        "%{#fixed-options:X} (Q1 B), as an older Examazej did. Check it on the Questions page."
    );
    const locked = setOptionsLock(uploaded, true, uploaded);
    expect(kinds(locked)).toEqual(["answerFromLetter"]);
    const checked = setCorrectAnswer(locked, 1);
    expect(checked).toMatchObject({ answerChecked: true, choices: [expect.any(Array), 1, null] });
    expect(kinds(checked)).toEqual([]);
    expect(kinds(resetQuestion(uploaded))).toContain("answerFromLetter");
  });

  it("an assumed answer keeps its note when the pins go, until it is checked", () => {
    const uploaded = q("Q1", { answerAssumed: true, pinnedOptions: [3] });
    const note = /^Question 1 pins an option .* so the answer is A/;
    expect(getQuestionNoteSummary([uploaded])).toEqual([expect.stringMatching(note)]);
    const unpinned = togglePin(uploaded, 3, uploaded);
    expect(getQuestionNoteSummary([unpinned])).toEqual([expect.stringMatching(note)]);
    expect(getQuestionNoteSummary([setCorrectAnswer(unpinned, 0)])).toEqual([]);
    expect(getQuestionNoteSummary([resetQuestion(uploaded)])).toEqual([expect.stringMatching(note)]);
  });

  it("a pinned answer is the same letter in every version, unless the options are locked", () => {
    const pinned = q("Q", { pinnedOptions: [2], choices: [options(4), 2, null] });
    expect(getQuestionNotes(pinned)).toEqual([{ kind: "pinnedAnswer", letter: "C" }]);
    expect(getQuestionNoteSummary([pinned])).toEqual([
      "In Question 1 the correct answer is a pinned option, so it has the same letter in every version.",
    ]);
    expect(getQuestionNotes({ ...pinned, fixedOptions: true })).toEqual([]);
  });

  it("an open-ended question gets no answer note", () => {
    expect(getQuestionNotes(q("Q", { answerAssumed: true }, 0))).toEqual([]);
  });
});

describe("the Details page lists one note per kind, in a fixed order", () => {
  it("old tags, answers from the letter, assumed answers, pinned answers", () => {
    const notes = getQuestionNoteSummary([
      q("Q1", { pinnedOptions: [0] }),
      q("Q2", { answerAssumed: true, pinnedOptions: [1, 2] }),
      oldPin("Q3"),
    ]);
    expect(notes).toEqual([
      expect.stringMatching(/^Question 3 uses %\{#fixed-options:X\}, which an older Examazej/),
      expect.stringMatching(/^The file gives no %\{#correct:X\} for Question 3,/),
      expect.stringMatching(/^Question 2 pins an option with/),
      expect.stringMatching(/^In Questions 1 and 3 the correct answer is a pinned option/),
    ]);
  });

  it("an assumed answer in a spreadsheet does not tell you to edit LaTeX", () => {
    const [note] = getQuestionNoteSummary([q("Q1", { answerAssumed: true, pinnedOptions: [1, 2] })], {
      format: "spreadsheet",
    });
    expect(note).not.toContain("add %{#correct:X} to the file");
  });
});

describe("which files are old", () => {
  it("a file without app_version, or with an unreadable one, before 1.8", () => {
    expect(isOlderFile({ format: "latex" })).toBe(true);
    expect(isOlderFile({ format: "spreadsheet", appVersion: "not a version" })).toBe(true);
    expect(isOlderFile({ format: "session", appVersion: "1.7.0" })).toBe(true);
    expect(isOlderFile({ format: "latex", appVersion: "1.8.0" })).toBe(false);
    expect(isOlderFile({ format: "latex", appVersion: "1.9.0" })).toBe(false);
    expect(isOlderFile(undefined)).toBe(false);
  });
});
