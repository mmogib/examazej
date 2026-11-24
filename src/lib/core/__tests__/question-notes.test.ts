import { describe, expect, it } from "vitest";
import {
  getQuestionNoteSummary,
  getQuestionNotes,
  legacyAnswerKeyWarning,
  legacyFixedReach,
  legacyPinReach,
  type LegacyReach,
} from "../import-notes";
import { generateLatexTemplate } from "../latex";
import { parseLatexTemplate } from "../parser";
import {
  fixLegacyFixed,
  fixLegacyPin,
  resetQuestion,
  setCorrectAnswer,
  setOptionsLock,
  setPositionLock,
  togglePin,
} from "../question-edits";
import { getDefaultSettings } from "../settings";
import { generateExamVersions } from "../versioning";
import type { ExamData, ExamSettings, Question } from "../../types";

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

describe("a pre-1.8 %{#fixed-options:A} on a one-option question", () => {
  // It draws no option shuffle either way; v1.7 listed it with the fixedOptions questions,
  // first in the question shuffle of a 5 / [n] group (versioning.ts), and wrote its options
  // as "ABCDE" in the mapping file.
  const one = (extra: Partial<Question> = {}) =>
    q("B", { legacyPin: { answerFromLetter: true }, pinnedOptions: [0], ...extra }, 1);
  const v17 = q("B", { legacyPin: { answerFromLetter: true }, fixedOptions: true }, 1);
  const pinReachIn = (exam: Question[], groups: string, index: number) =>
    getQuestionNotes(exam, groups)[index].find((note) => note.kind === "legacyPin")?.reach ?? null;
  // The mapping file writes "ABCDE" for a question whose options are locked, whatever their
  // number, and "A" for a shuffled one-option question; versions and answers are the same.
  const printed = (exam: Question[], groups: string) => {
    const settings = { ...getDefaultSettings(), groups, numberofvestions: 8 } as ExamSettings;
    return generateExamVersions(exam, settings, "reach-seed").mappings.map(({ perm: _perm, ...rest }) => rest);
  };

  it.each(["4", "[4]"])("behind a regular question, its group's order differs (groups %s)", (groups) => {
    const exam = [q("A"), one(), q("C"), q("D")];
    expect(pinReachIn(exam, groups, 1)).toBe("wider");
    expectReachMatchesShuffle(groups, one(), v17, "wider");
    expect(legacyAnswerKeyWarning(exam, groups)).toContain("Master question 2 uses");
  });

  it("in a (n) group only its line of the mapping file differs", () => {
    const exam = [q("A"), one(), q("C"), q("D")];
    expect(pinReachIn(exam, "(4)", 1)).toBe("this");
    expect(printed(exam, "(4)")).toEqual(printed([q("A"), v17, q("C"), q("D")], "(4)"));
    expectReachMatchesShuffle("(4)", one(), v17, "this");
  });

  it("first in its group, or with no other question free to move, only its line differs", () => {
    const first = [one(), q("B2"), q("C"), q("D")];
    expect(pinReachIn(first, "4", 0)).toBe("this");
    expect(printed(first, "4")).toEqual(printed([v17, q("B2"), q("C"), q("D")], "4"));
    expect(pinReachIn([q("A", { fixedPosition: true }), one(), q("C", { fixedPosition: true })], "3", 1)).toBe("this");
  });

  it("the fix button makes the order of v1.7, and the warning goes", () => {
    const exam = [q("A"), one(), q("C"), q("D")];
    const fixed = [exam[0], fixLegacyPin(exam[1], exam[1]), exam[2], exam[3]];
    expect(pinReachIn(fixed, "4", 1)).toBeNull();
    const settings = { ...getDefaultSettings(), groups: "4", numberofvestions: 8 } as ExamSettings;
    expect(generateExamVersions(fixed, settings, "reach-seed").mappings).toEqual(
      generateExamVersions([exam[0], v17, exam[2], exam[3]], settings, "reach-seed").mappings
    );
  });
});

describe("a pre-1.8 fixed question in (n): the explanation and the remedy fit its current tags", () => {
  // States that still differ from v1.7 but no longer have `fixed`.
  const states: [string, Partial<Question>][] = [
    ["fixed, then fixed and pinned", { fixedPosition: true, pinnedOptions: [2] }],
    ["options locked alone", { fixedOptions: true }],
    ["both locks as a pair", { fixedPosition: true, fixedOptions: true }],
  ];

  it.each(states)("%s", (_name, flags) => {
    const exam = [q("Q1"), q("Q2", { legacyFixed: true, ...flags }), q("Q3")];
    const [note] = getQuestionNoteSummary(exam, "1,(2)");
    expect(note).toMatch(/^Question 2 is inside a \(n\) group and was %\{#fixed\} in a file made with the older Examazej/);
    expect(note).toContain("With its current tags they do not shuffle as they did then");
    expect(note).toContain("(in the file: %{#fixed-position} and no other lock or pin tag in this question)");
    expect(note).not.toContain("instead of");
    const key = legacyAnswerKeyWarning(exam, "1,(2)") ?? "";
    expect(key).toContain("use the tag \\texttt{fixed-position} and no other lock or pin tag in master question 2");
    expect(key).not.toContain("they are not");

    // What the remedy says, written in the file, and what the fix button does, both make v1.7's
    // shuffle (options shuffled freely; the same as a position lock alone).
    const settings = { ...getDefaultSettings(), groups: "1,(2)", numberofvestions: 8 } as ExamSettings;
    const v17 = [exam[0], q("Q2", { legacyFixed: true, fixedPosition: true }), exam[2]];
    const button = [exam[0], fixLegacyFixed(exam[1], exam[1]), exam[2]];
    const remedy: ExamData = { name: "master", ordering: null, preamble: "", kept_in_one_page: [], questions: v17 };
    const reread = parseLatexTemplate(generateLatexTemplate(settings, remedy, 1)).questions.map(
      (question, i) => ({ ...question, group: 1, order: i + 1 }) as Question
    );
    expect(reread[1]).toMatchObject({ fixedPosition: true });
    expect(reread[1].fixedOptions ?? false).toBe(false);
    expect(reread[1].pinnedOptions ?? []).toEqual([]);
    const mappings = (exam: Question[]) => generateExamVersions(exam, settings, "remedy-seed").mappings;
    expect(mappings(button)).toEqual(mappings(v17));
    expect(mappings(reread)).toEqual(mappings(v17));
    expect(getQuestionNoteSummary(button, "1,(2)")).toEqual([]);
  });
});

describe("Details notes follow the questions as they are now", () => {
  const legacyPinQ = (text: string, answerFromLetter = false) =>
    q(text, { legacyPin: { answerFromLetter }, pinnedOptions: [1], choices: [options(4), 1, null] });

  it("partial repair lists only the questions still affected; Reset brings a warning back", () => {
    const uploaded = [legacyPinQ("Q1"), q("Q2"), legacyPinQ("Q3")];
    const repaired = [fixLegacyPin(uploaded[0], uploaded[0]), uploaded[1], uploaded[2]];
    const notes = getQuestionNoteSummary(repaired, "3");
    expect(notes[0]).toMatch(/^Question 3 came with %\{#fixed-options:X\}/);
    expect(legacyAnswerKeyWarning(repaired, "3")).toContain("Master question 3 uses");
    expect(legacyAnswerKeyWarning(repaired, "3")).not.toContain("master question 1");

    const reset = [resetQuestion(uploaded[0]), uploaded[1], uploaded[2]];
    expect(getQuestionNoteSummary(reset, "3")[0]).toMatch(/^Questions 1 and 3 came with %\{#fixed-options:X\}/);

    const allRepaired = repaired.map((question, i) => (i === 2 ? fixLegacyPin(question, uploaded[2]) : question));
    expect(legacyAnswerKeyWarning(allRepaired, "3")).toBeNull();
  });

  it("a fixed question's note follows the groups, in and out of (n)", () => {
    const exam = [q("Q1"), q("Q2", { legacyFixed: true, fixed: true }), q("Q3")];
    expect(getQuestionNoteSummary(exam, "1,(2)")[0]).toMatch(/^Question 2 is inside a \(n\) group and was %\{#fixed\}/);
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
      "The file gives no %{#correct:X} for Question 1, so, as the older Examazej did, its answer was taken from the letter in the tag (Q1 B). Check it on the Questions page.",
    ]);
    expect(getQuestionNoteSummary([setCorrectAnswer(repaired, 1)], "1")).toEqual([]);
  });

  it("the Questions page gets the same kinds of note, question by question", () => {
    expect(getQuestionNotes([q("Q", { legacyFixed: true, fixed: true })], "(1)")).toEqual([
      [{ kind: "legacyFixed", reach: "this" }],
    ]);
    expect(getQuestionNotes([legacyPinQ("Q", true)], "1")).toEqual([
      [
        { kind: "legacyPin", reach: "wider" },
        { kind: "answerFromLetter", letter: "B" },
        { kind: "pinnedAnswer", letter: "B" },
      ],
    ]);
    expect(getQuestionNotes([q("Q", { answerAssumed: true, pinnedOptions: [2] })], "1")).toEqual([
      [{ kind: "answerAssumed" }],
    ]);
    expect(getQuestionNotes([q("Q")], "(1)")).toEqual([[]]);
  });

  it("an answer taken from the letter is the same letter in every version only while it is pinned", () => {
    const uploaded = legacyPinQ("Q1", true);
    const unpinned = togglePin(uploaded, 1, uploaded);
    expect(unpinned.pinnedOptions).toBeUndefined();
    const notes = getQuestionNoteSummary([unpinned], "1");
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain("the answer was taken from the letter in the tag: Q1 B.");
    expect(notes[0]).not.toContain("same letter");
    expect(getQuestionNotes([unpinned], "1")[0].map((note) => note.kind)).toEqual(["legacyPin", "answerFromLetter"]);
    // It does move: B is not B in every version.
    const settings = { ...getDefaultSettings(), groups: "1", numberofvestions: 8 } as ExamSettings;
    const letters = generateExamVersions([unpinned], settings, "letter-seed").mappings.map((m) => m.correct);
    expect(new Set(letters).size).toBeGreaterThan(1);

    // One still pinned, one not: the pin note makes no claim; the pinned-answer note names the one.
    const both = [legacyPinQ("Q1", true), unpinned];
    const [pinNote, pinnedNote] = getQuestionNoteSummary(both, "2");
    expect(pinNote).toContain("the answer was taken from the letter in the tag: Q1 B, Q2 B.");
    expect(pinnedNote).toBe("In Question 1 the correct answer is a pinned option, so it has the same letter in every version.");
  });
});
