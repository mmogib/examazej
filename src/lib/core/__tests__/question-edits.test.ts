import { describe, expect, it } from "vitest";
import {
  answerChangesKey,
  areLocksChanged,
  copyQuestions,
  findChangedAnswers,
  isQuestionChanged,
  pinsLeaveNothingToShuffle,
  replaceQuestion,
  resetQuestion,
  setCorrectAnswer,
  setOptionsLock,
  setPositionLock,
  setSeparatePage,
  togglePin,
} from "../question-edits";
import { getDefaultSettings } from "../settings";
import { generateExamVersions } from "../versioning";
import type { ExamSettings, Question } from "../../types";

const options = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `o${i}` }));
const q = (extra: Partial<Question> = {}, optionCount = 4): Question => ({
  text: "Q",
  group: 1,
  order: 1,
  choices: [options(optionCount), 0, null],
  keepOnSeparatePage: false,
  ...extra,
});
const locks = (question: Question) => ({
  fixed: question.fixed,
  fixedPosition: question.fixedPosition,
  fixedOptions: question.fixedOptions,
  pinnedOptions: question.pinnedOptions,
});

/** Freezes a value and everything in it, so any mutation throws (test modules are strict). */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe("position lock", () => {
  it("on sets fixedPosition; off clears it", () => {
    const on = setPositionLock(q(), true);
    expect(locks(on)).toEqual({ fixedPosition: true });
    expect(locks(setPositionLock(on, false))).toEqual({});
  });

  it("off on a fixed question keeps the option lock as fixedOptions", () => {
    expect(locks(setPositionLock(q({ fixed: true }), false))).toEqual({ fixedOptions: true });
  });

  it("setting the value it already has changes nothing (same object)", () => {
    const fixed = q({ fixed: true });
    expect(setPositionLock(fixed, true)).toBe(fixed);
    const plain = q();
    expect(setPositionLock(plain, false)).toBe(plain);
  });
});

describe("option lock", () => {
  it("on sets fixedOptions and clears the pins (D7); off does not bring them back", () => {
    const pinned = q({ pinnedOptions: [3] });
    const on = setOptionsLock(pinned, true);
    expect(locks(on)).toEqual({ fixedOptions: true });
    expect(locks(setOptionsLock(on, false))).toEqual({});
  });

  it("off on a fixed question keeps the position lock as fixedPosition", () => {
    expect(locks(setOptionsLock(q({ fixed: true }), false))).toEqual({ fixedPosition: true });
  });

  it("never adds fixedOptions beside fixed, and does nothing on an open-ended question", () => {
    const fixed = q({ fixed: true });
    expect(setOptionsLock(fixed, true)).toBe(fixed);
    const open = q({}, 0);
    expect(setOptionsLock(open, true)).toBe(open);
  });

  it("two switches on are fixedPosition + fixedOptions, never fixed", () => {
    expect(locks(setOptionsLock(setPositionLock(q(), true), true))).toEqual({
      fixedPosition: true,
      fixedOptions: true,
    });
  });
});

describe("back to the uploaded state", () => {
  it("options off and on again on a fixed question gives fixed back, not the pair", () => {
    const uploaded = q({ fixed: true });
    const off = setOptionsLock(uploaded, false, uploaded);
    expect(locks(off)).toEqual({ fixedPosition: true });
    expect(locks(setOptionsLock(off, true, uploaded))).toEqual({ fixed: true });
    // The other way round too.
    const posOff = setPositionLock(uploaded, false, uploaded);
    expect(locks(setPositionLock(posOff, true, uploaded))).toEqual({ fixed: true });
  });

  it("the uploaded pins come back with the uploaded order of flags", () => {
    const uploaded = q({ fixedPosition: true, pinnedOptions: [3] });
    const unpinned = togglePin(uploaded, 3, uploaded);
    expect(locks(unpinned)).toEqual({ fixedPosition: true });
    expect(togglePin(unpinned, 3, uploaded).pinnedOptions).toEqual([3]);
  });

  it("in a (n) group followed by another question, off and on again gives the uploaded versions", () => {
    const settings = {
      ...getDefaultSettings(),
      groups: "(3)",
      numberofvestions: 6,
    } as ExamSettings;
    const exam = [q({ text: "A" }), q({ text: "B", fixed: true }), q({ text: "C" })];
    const before = generateExamVersions(exam, settings, "undo-seed").mappings;

    const uploaded = exam[1];
    const toggled = setOptionsLock(setOptionsLock(uploaded, false, uploaded), true, uploaded);
    const after = generateExamVersions(replaceQuestion(exam, 1, toggled), settings, "undo-seed").mappings;
    expect(after).toEqual(before);

    // Without the restore, the pair would change the next question: the test can tell.
    const pair = replaceQuestion(exam, 1, q({ text: "B", fixedPosition: true, fixedOptions: true }));
    expect(generateExamVersions(pair, settings, "undo-seed").mappings).not.toEqual(before);
  });
});

describe("pins", () => {
  it("toggles one option, kept sorted and unique", () => {
    const one = togglePin(q(), 3);
    const two = togglePin(one, 1);
    expect(two.pinnedOptions).toEqual([1, 3]);
    expect(togglePin(two, 3).pinnedOptions).toEqual([1]);
    expect(togglePin(togglePin(two, 3), 1).pinnedOptions).toBeUndefined();
  });

  it("does nothing on locked options, an open-ended question or an index out of range", () => {
    for (const question of [q({ fixedOptions: true }), q({ fixed: true }), q({}, 0)]) {
      expect(togglePin(question, 1)).toBe(question);
    }
    const plain = q();
    expect(togglePin(plain, 4)).toBe(plain);
    expect(togglePin(plain, -1)).toBe(plain);
    expect(togglePin(plain, 1.5)).toBe(plain);
  });

  it("says when one option or none is left to move", () => {
    expect(pinsLeaveNothingToShuffle(q({ pinnedOptions: [0, 1] }))).toBe(false);
    expect(pinsLeaveNothingToShuffle(q({ pinnedOptions: [0, 1, 2] }))).toBe(true);
    expect(pinsLeaveNothingToShuffle(q({ pinnedOptions: [0, 1, 2, 3] }))).toBe(true);
    expect(pinsLeaveNothingToShuffle(q())).toBe(false);
  });
});

describe("correct answer", () => {
  it("sets the index on a copy of the options", () => {
    const before = q();
    const after = setCorrectAnswer(before, 2);
    expect(after.choices[1]).toBe(2);
    expect(after.choices[0]).not.toBe(before.choices[0]);
    expect(after.choices[0]).toEqual(before.choices[0]);
    expect(after.answerChecked).toBeUndefined();
  });

  it("ignores an index out of range and open-ended questions; the same answer is no change", () => {
    const plain = q();
    expect(setCorrectAnswer(plain, 4)).toBe(plain);
    expect(setCorrectAnswer(plain, 0)).toBe(plain);
    const open = q({}, 0);
    expect(setCorrectAnswer(open, 0)).toBe(open);
  });

  it("on an answer the file did not state, marks it checked, also when confirming the same answer", () => {
    const assumed = q({ answerAssumed: true, pinnedOptions: [3] });
    const confirmed = setCorrectAnswer(assumed, 0);
    expect(confirmed).not.toBe(assumed);
    expect(confirmed.answerChecked).toBe(true);
    expect(confirmed.choices[1]).toBe(0);
    expect(setCorrectAnswer(confirmed, 0)).toBe(confirmed);
    const fromLetter = q({ legacyPin: { answerFromLetter: true }, pinnedOptions: [1] });
    expect(setCorrectAnswer(fromLetter, 2).answerChecked).toBe(true);
  });
});

describe("own page", () => {
  it("sets and clears keepOnSeparatePage", () => {
    const on = setSeparatePage(q(), true);
    expect(on.keepOnSeparatePage).toBe(true);
    expect(setSeparatePage(on, true)).toBe(on);
    expect(setSeparatePage(on, false).keepOnSeparatePage).toBe(false);
  });
});

describe("immutability, Reset and Changed", () => {
  it("no edit mutates its input or the baseline", () => {
    const question = deepFreeze(q({ fixed: true, legacyPin: { answerFromLetter: true }, pinnedOptions: [2] }));
    const baseline = deepFreeze(q({ fixed: true }));
    const pinned = deepFreeze(q({ pinnedOptions: [2] }));
    expect(() => {
      setPositionLock(question, false, baseline);
      setOptionsLock(question, false, baseline);
      togglePin(pinned, 1, baseline);
      setCorrectAnswer(question, 3);
      setSeparatePage(question, true);
      replaceQuestion(deepFreeze([question]), 0, q());
    }).not.toThrow();
    expect(pinned.pinnedOptions).toEqual([2]);
    expect(question).toMatchObject({ fixed: true, legacyPin: { answerFromLetter: true }, pinnedOptions: [2] });
  });

  it("Reset gives a fresh copy of the uploaded question", () => {
    const baseline = [q({ pinnedOptions: [1] })];
    const copy = copyQuestions(baseline);
    const reset = resetQuestion(copy[0]);
    expect(reset).toEqual(baseline[0]);
    expect(reset).not.toBe(copy[0]);
    reset.pinnedOptions?.push(3);
    reset.choices[0][0].text = "changed";
    expect(copy[0].pinnedOptions).toEqual([1]);
    expect(copy[0].choices[0][0].text).toBe("o0");
  });

  it("Changed compares representations: fixed and the pair differ; absent and false do not", () => {
    expect(isQuestionChanged(q({ fixedPosition: true, fixedOptions: true }), q({ fixed: true }))).toBe(true);
    expect(isQuestionChanged(q({ fixed: false, fixedOptions: false }), q())).toBe(false);
    expect(isQuestionChanged(q({ pinnedOptions: [3, 1] }), q({ pinnedOptions: [1, 3] }))).toBe(false);
    expect(isQuestionChanged(q({ answerChecked: true }), q())).toBe(true);
    expect(areLocksChanged(q({ answerChecked: true, choices: [options(4), 2, null] }), q())).toBe(false);
    expect(areLocksChanged(q({ fixedPosition: true }), q())).toBe(true);
  });

  it("lists the changed answers and keys the list", () => {
    const baseline = [q(), q({}, 0), q({ choices: [options(4), 1, null] })];
    const now = [setCorrectAnswer(baseline[0], 3), baseline[1], setCorrectAnswer(baseline[2], 0)];
    const changes = findChangedAnswers(now, baseline);
    expect(changes).toEqual([
      { number: 1, from: "A", to: "D" },
      { number: 3, from: "B", to: "A" },
    ]);
    expect(answerChangesKey(changes)).toBe("1:A>D|3:B>A");
    expect(findChangedAnswers(baseline, baseline)).toEqual([]);
  });
});
