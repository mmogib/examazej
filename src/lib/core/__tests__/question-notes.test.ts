import { describe, expect, it } from "vitest";
import {
  getQuestionNoteSummary,
  getQuestionNotes,
  legacyAnswerKeyWarning,
  legacyFixedReach,
  legacyPinReach,
  type LegacyReach,
} from "../import-notes";
import { fixLegacyPin, resetQuestion, setCorrectAnswer, setOptionsLock, togglePin } from "../question-edits";
import { getDefaultSettings } from "../settings";
import { generateExamVersions } from "../versioning";
import type { ExamSettings, Question } from "../../types";

const options = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `o${i}` }));
const q = (text: string, extra: Partial<Question> = {}, optionCount = 4): Question => ({
  text,
  group: 1,
  order: 1,
  choices: [options(optionCount), 0, null],
  keepOnSeparatePage: false,
  ...extra,
});

/** Mappings of version questions, split into the target question's and everyone else's. */
function mappingsOf(exam: Question[], groups: string, target: number) {
  const settings = { ...getDefaultSettings(), groups, numberofvestions: 8 } as ExamSettings;
  const { mappings } = generateExamVersions(exam, settings, "reach-seed");
  return {
    own: mappings.filter((m) => m.masterQNo === target),
    others: mappings.filter((m) => m.masterQNo !== target),
  };
}

/**
 * Checks a reach against what the generator does: compared with what v1.7 made of the
 * question (`v17`), "this" changes only the question itself, "wider" changes others too, and
 * null changes nothing.
 */
function expectReachMatchesShuffle(
  groups: string,
  question: Question,
  v17: Question,
  reach: LegacyReach | null
) {
  const exam = (middle: Question) => [q("A"), middle, q("C"), q("D")];
  const now = mappingsOf(exam(question), groups, 2);
  const then = mappingsOf(exam(v17), groups, 2);
  if (reach === null) {
    expect(now).toEqual(then);
  } else if (reach === "this") {
    expect(now.others).toEqual(then.others);
    expect(now.own).not.toEqual(then.own);
  } else {
    expect(now.others).not.toEqual(then.others);
  }
}

describe("a pre-1.8 fixed question in a (n) group: reach by what the shuffle does", () => {
  // v1.7 shuffled its options: the same as a position lock alone (versioning-flags.test.ts).
  const v17 = q("B", { legacyFixed: true, fixedPosition: true });
  const states: [string, Partial<Question>, LegacyReach | null][] = [
    ["no locks", {}, null],
    ["position lock only", { fixedPosition: true }, null],
    ["fixed (draws and discards)", { fixed: true }, "this"],
    ["a pin (full draw)", { pinnedOptions: [3] }, "this"],
    ["fixedOptions (draws nothing)", { fixedOptions: true }, "wider"],
    ["fixedPosition + fixedOptions", { fixedPosition: true, fixedOptions: true }, "wider"],
  ];

  it.each(states)("%s", (_name, flags, reach) => {
    const question = q("B", { legacyFixed: true, ...flags });
    expect(legacyFixedReach(question, true)).toBe(reach);
    expectReachMatchesShuffle("(4)", question, v17, reach);
  });

  it("does not apply outside (n) groups, nor to a question with fewer than two options", () => {
    expect(legacyFixedReach(q("B", { legacyFixed: true, fixed: true }), false)).toBeNull();
    expect(legacyFixedReach(q("B", { legacyFixed: true, fixed: true }, 0), true)).toBeNull();
    expect(legacyFixedReach(q("B", { legacyFixed: true, fixed: true }, 1), true)).toBeNull();
  });
});

describe("a pre-1.8 %{#fixed-options:X}: reach by what the shuffle does", () => {
  // v1.7 read it as every option locked.
  const v17 = q("B", { legacyPin: { answerFromLetter: false }, fixedOptions: true });
  const pin = (extra: Partial<Question>) => q("B", { legacyPin: { answerFromLetter: false }, ...extra });

  it.each(["(4)", "4", "[4]"])("fixedOptions comes out as in v1.7 (groups %s)", (groups) => {
    const question = pin({ fixedOptions: true });
    expect(legacyPinReach(question)).toBeNull();
    expectReachMatchesShuffle(groups, question, v17, null);
  });

  it("an added position lock is not an old-file difference in a (n) group", () => {
    const question = pin({ fixedOptions: true, fixedPosition: true });
    expect(legacyPinReach(question)).toBeNull();
    expectReachMatchesShuffle("(4)", question, v17, null);
  });

  it.each(["(4)", "4", "[4]"])("a pin or no lock reaches the other questions (groups %s)", (groups) => {
    for (const flags of [{ pinnedOptions: [1] }, {}]) {
      const question = pin(flags);
      expect(legacyPinReach(question)).toBe("wider");
      expectReachMatchesShuffle(groups, question, v17, "wider");
    }
  });
});

describe("Details notes follow the questions as they are now", () => {
  const legacyPinQ = (text: string, answerFromLetter = false) =>
    q(text, { legacyPin: { answerFromLetter }, pinnedOptions: [1], choices: [options(4), 1, null] });

  it("partial repair lists only the questions still affected; Reset brings a warning back", () => {
    const uploaded = [legacyPinQ("Q1"), q("Q2"), legacyPinQ("Q3")];
    const repaired = [fixLegacyPin(uploaded[0], uploaded[0]), uploaded[1], uploaded[2]];
    const notes = getQuestionNoteSummary(repaired, "3");
    expect(notes[0]).toMatch(/^Question 3 uses %\{#fixed-options:X\}/);
    expect(legacyAnswerKeyWarning(repaired, "3")).toContain("Master question 3 uses");
    expect(legacyAnswerKeyWarning(repaired, "3")).not.toContain("master question 1");

    const reset = [resetQuestion(uploaded[0]), uploaded[1], uploaded[2]];
    expect(getQuestionNoteSummary(reset, "3")[0]).toMatch(/^Questions 1 and 3 use %\{#fixed-options:X\}/);

    const allRepaired = repaired.map((question, i) => (i === 2 ? fixLegacyPin(question, uploaded[2]) : question));
    expect(legacyAnswerKeyWarning(allRepaired, "3")).toBeNull();
  });

  it("a fixed question's note follows the groups, in and out of (n)", () => {
    const exam = [q("Q1"), q("Q2", { legacyFixed: true, fixed: true }), q("Q3")];
    expect(getQuestionNoteSummary(exam, "1,(2)")[0]).toMatch(/^Question 2 is %\{#fixed\} inside a \(n\) group/);
    expect(getQuestionNoteSummary(exam, "3")).toEqual([]);
    expect(getQuestionNoteSummary(exam, "1,[2]")).toEqual([]);
    expect(getQuestionNoteSummary(exam, undefined)).toEqual([]);
  });

  it("says when the later questions may differ too, on Details and on the answer key", () => {
    const exam = [q("Q1"), q("Q2", { legacyFixed: true, fixedOptions: true }), q("Q3")];
    expect(getQuestionNoteSummary(exam, "(3)")[0]).toContain("the later questions in each version may differ too");
    const key = legacyAnswerKeyWarning(exam, "(3)") ?? "";
    expect(key).toContain("the later questions in each version may differ too");
    expect(key).not.toContain("This does not affect the other questions.");
  });

  it("an assumed answer keeps its note when the pins go, until the answer is checked; Reset brings it back", () => {
    const uploaded = q("Q1", { answerAssumed: true, pinnedOptions: [3] });
    const note = /^Question 1 pins an option .* so the answer is A/;
    expect(getQuestionNoteSummary([uploaded], "1")).toEqual([expect.stringMatching(note)]);
    const unpinned = togglePin(uploaded, 3, uploaded);
    expect(getQuestionNoteSummary([unpinned], "1")).toEqual([expect.stringMatching(note)]);
    const locked = setOptionsLock(uploaded, true, uploaded);
    expect(getQuestionNoteSummary([locked], "1")).toEqual([expect.stringMatching(note)]);
    const checked = setCorrectAnswer(unpinned, 0);
    expect(checked.choices[1]).toBe(0);
    expect(getQuestionNoteSummary([checked], "1")).toEqual([]);
    expect(getQuestionNoteSummary([resetQuestion(uploaded)], "1")).toEqual([expect.stringMatching(note)]);
  });

  it("an answer taken from the letter gets its own note once the pin warning is repaired", () => {
    const uploaded = legacyPinQ("Q1", true);
    const [pinNote] = getQuestionNoteSummary([uploaded], "1");
    expect(pinNote).toContain("the answer was taken from the letter, so it is the same letter in every version: Q1 B.");
    expect(getQuestionNoteSummary([uploaded], "1")).toHaveLength(1);

    const repaired = fixLegacyPin(uploaded, uploaded);
    expect(getQuestionNoteSummary([repaired], "1")).toEqual([
      "The file gives no %{#correct:X} for Question 1, so, as before v1.8, its answer was taken from the letter in the tag (Q1 B). Check it on the Questions page.",
    ]);
    expect(getQuestionNoteSummary([setCorrectAnswer(repaired, 1)], "1")).toEqual([]);
  });

  it("the Questions page gets the same notes, one question at a time", () => {
    expect(getQuestionNotes(q("Q", { legacyFixed: true, fixed: true }), true)).toEqual([
      { kind: "legacyFixed", reach: "this" },
    ]);
    expect(getQuestionNotes(legacyPinQ("Q", true), false)).toEqual([
      { kind: "legacyPin", reach: "wider" },
      { kind: "answerFromLetter", letter: "B" },
      { kind: "pinnedAnswer", letter: "B" },
    ]);
    expect(getQuestionNotes(q("Q", { answerAssumed: true, pinnedOptions: [2] }), false)).toEqual([
      { kind: "answerAssumed" },
    ]);
    expect(getQuestionNotes(q("Q"), true)).toEqual([]);
  });
});
