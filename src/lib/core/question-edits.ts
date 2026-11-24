/**
 * The edits the Questions page makes to one question, as pure functions: each takes the
 * question (and, for lock edits, the question as uploaded) and returns a new question, or the
 * same object when nothing changes. Inputs are never mutated.
 *
 * Flags are kept as they were read. A switch turned on sets its own flag; `fixed` is never
 * created (two switches on are `fixedPosition` + `fixedOptions`, which the exporters write as
 * those two tags). Inside a `(n)` group `fixed` and that pair draw the RNG differently, so when
 * an edit brings a question's locks and pins back to the uploaded ones, the uploaded flags are
 * restored exactly.
 */

import type { Question } from "../types";
import { areOptionsLocked, isPositionLocked } from "./question-flags";

type LockState = Pick<Question, "fixed" | "fixedPosition" | "fixedOptions" | "pinnedOptions">;

const hasOptions = (question: Question) => question.choices[0].length > 0;

const sortedPins = (pins: number[] | undefined) => [...new Set(pins ?? [])].sort((a, b) => a - b);

/** The question with these lock fields; false flags and empty pins are left out. */
function withLocks(question: Question, locks: LockState): Question {
  const next: Question = { ...question };
  delete next.fixed;
  delete next.fixedPosition;
  delete next.fixedOptions;
  delete next.pinnedOptions;
  if (locks.fixed) next.fixed = true;
  if (locks.fixedPosition) next.fixedPosition = true;
  if (locks.fixedOptions) next.fixedOptions = true;
  const pins = sortedPins(locks.pinnedOptions);
  if (pins.length > 0) next.pinnedOptions = pins;
  return next;
}

/** What a question's locks do: position kept, options kept, which options pinned. */
function effectiveLocks(question: LockState): string {
  const options = areOptionsLocked(question);
  return JSON.stringify([isPositionLocked(question), options, options ? [] : sortedPins(question.pinnedOptions)]);
}

/** After a lock or pin edit: back where it was uploaded means exactly the uploaded flags. */
function settle(next: Question, baseline: Question | undefined): Question {
  if (!baseline || effectiveLocks(next) !== effectiveLocks(baseline)) return next;
  return withLocks(next, {
    fixed: baseline.fixed,
    fixedPosition: baseline.fixedPosition,
    fixedOptions: baseline.fixedOptions,
    pinnedOptions: baseline.pinnedOptions,
  });
}

/** "Keep its place in the group". */
export function setPositionLock(question: Question, on: boolean, baseline?: Question): Question {
  if (on === isPositionLocked(question)) return question;
  if (on) return settle(withLocks(question, { ...question, fixedPosition: true }), baseline);
  // Off: `fixed` keeps its option lock as `fixedOptions`.
  return settle(
    withLocks(question, {
      ...question,
      fixed: false,
      fixedPosition: false,
      fixedOptions: question.fixed || question.fixedOptions,
    }),
    baseline
  );
}

/** "Keep all options in order". On clears the pins (D7); off does not bring them back. */
export function setOptionsLock(question: Question, on: boolean, baseline?: Question): Question {
  if (!hasOptions(question) || on === areOptionsLocked(question)) return question;
  if (on) {
    return settle(withLocks(question, { ...question, fixedOptions: true, pinnedOptions: [] }), baseline);
  }
  // Off: `fixed` keeps its position lock as `fixedPosition`.
  return settle(
    withLocks(question, {
      ...question,
      fixed: false,
      fixedOptions: false,
      fixedPosition: question.fixed || question.fixedPosition,
    }),
    baseline
  );
}

/** Pins or unpins one option. Only on multiple-choice questions whose options are not locked. */
export function togglePin(question: Question, optionIndex: number, baseline?: Question): Question {
  const count = question.choices[0].length;
  if (count === 0 || areOptionsLocked(question)) return question;
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= count) return question;
  const pins = sortedPins(question.pinnedOptions).filter((i) => i < count);
  const nextPins = pins.includes(optionIndex) ? pins.filter((i) => i !== optionIndex) : [...pins, optionIndex];
  return settle(withLocks(question, { ...question, pinnedOptions: nextPins }), baseline);
}

/** True when pins leave one option or none free to move ("no option can move"). */
export function pinsLeaveNothingToShuffle(question: Question): boolean {
  const count = question.choices[0].length;
  if (count === 0 || areOptionsLocked(question)) return false;
  const pinned = sortedPins(question.pinnedOptions).filter((i) => i < count).length;
  return pinned > 0 && count - pinned <= 1;
}

/** The file did not state this question's answer (assumed A, or taken from a pre-1.8 letter). */
export function isAnswerUnstated(question: Question): boolean {
  return Boolean(question.answerAssumed || question.legacyPin?.answerFromLetter);
}

/**
 * Sets the correct answer. On a question whose file did not state its answer, it also marks
 * the answer checked, which ends its note; with the current answer it only does that ("Answer X
 * is correct").
 */
export function setCorrectAnswer(question: Question, optionIndex: number): Question {
  const options = question.choices[0];
  if (options.length === 0) return question;
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) return question;
  const check = isAnswerUnstated(question) && !question.answerChecked;
  if (optionIndex === question.choices[1] && !check) return question;
  const next: Question = { ...question, choices: [options.map((o) => ({ ...o })), optionIndex, null] };
  if (isAnswerUnstated(question)) next.answerChecked = true;
  return next;
}

/** "Put on its own page". */
export function setSeparatePage(question: Question, on: boolean): Question {
  if (on === Boolean(question.keepOnSeparatePage)) return question;
  return { ...question, keepOnSeparatePage: on };
}

/** Reset: a fresh copy of the question as uploaded, never the stored object itself. */
export function resetQuestion(baseline: Question): Question {
  return structuredClone(baseline);
}

/** Deep copies of the uploaded questions, kept as the baseline. */
export function copyQuestions(questions: Question[]): Question[] {
  return structuredClone(questions);
}

/** Replaces question `index` in a new array; the same array when the question did not change. */
export function replaceQuestion(questions: Question[], index: number, next: Question): Question[] {
  if (questions[index] === next) return questions;
  return questions.map((question, i) => (i === index ? next : question));
}

/** What "Changed" compares: the representation of every editable field. */
function editableState(question: Question): string {
  return JSON.stringify([
    Boolean(question.fixed),
    Boolean(question.fixedPosition),
    Boolean(question.fixedOptions),
    sortedPins(question.pinnedOptions),
    question.choices[1],
    Boolean(question.keepOnSeparatePage),
    Boolean(question.answerChecked),
  ]);
}

/** True when the question differs from the uploaded one in anything the page edits. */
export function isQuestionChanged(question: Question, baseline: Question | undefined): boolean {
  return baseline !== undefined && editableState(question) !== editableState(baseline);
}

/** True when the locks or pins differ from the uploaded ones (the versions change). */
export function areLocksChanged(question: Question, baseline: Question | undefined): boolean {
  if (!baseline) return false;
  const locks = (q: Question) =>
    JSON.stringify([Boolean(q.fixed), Boolean(q.fixedPosition), Boolean(q.fixedOptions), sortedPins(q.pinnedOptions)]);
  return locks(question) !== locks(baseline);
}

export interface AnswerChange {
  /** 1-based question number. */
  number: number;
  from: string;
  to: string;
}

/** Multiple-choice questions whose answer differs from the uploaded one. */
export function findChangedAnswers(questions: Question[], baseline: Question[]): AnswerChange[] {
  const changes: AnswerChange[] = [];
  questions.forEach((question, index) => {
    const before = baseline[index];
    if (!before || question.choices[0].length === 0) return;
    if (question.choices[1] !== before.choices[1]) {
      changes.push({
        number: index + 1,
        from: String.fromCharCode(65 + before.choices[1]),
        to: String.fromCharCode(65 + question.choices[1]),
      });
    }
  });
  return changes;
}

/** A key for a list of answer changes: the confirmation asks again only when it changes (D11). */
export function answerChangesKey(changes: AnswerChange[]): string {
  return changes.map((c) => `${c.number}:${c.from}>${c.to}`).join("|");
}
