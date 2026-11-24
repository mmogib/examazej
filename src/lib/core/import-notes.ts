/**
 * Notes about the questions: on the Details page (one note per kind, covering every affected
 * question, so the box stays short) and next to each question on the Questions page.
 *
 * All of them are worked out from the questions as they are now (their tags and the readers'
 * markers `legacyPin` and `answerAssumed`), never stored: an edit on the Questions page updates
 * them, and the two pages never disagree. The readers' own `warnings` are about the file.
 *
 * Exams printed by an older Examazej are not made again: the shuffle and the way tags are read
 * changed over time, and a file does not say which release printed it. A file without
 * `app_version` gets one warning instead (`isOlderFile`, `components/ui/older-file-warning.tsx`),
 * and those exams are graded with the answer key printed with them.
 */

import type { NoteSource, Question } from "../types";
import { isFileBefore, PINNED_OPTIONS_VERSION, readFileVersion } from "./app-version";
import { areOptionsLocked } from "./question-flags";

type NoteFields = Pick<
  Question,
  "choices" | "fixed" | "fixedOptions" | "pinnedOptions" | "legacyPin" | "answerAssumed" | "answerChecked"
>;

/** "Question 3", "Questions 3 and 7", "Questions 3, 7 and 12". */
export function formatQuestionList(numbers: number[]): string {
  if (numbers.length === 1) return `Question ${numbers[0]}`;
  const head = numbers.slice(0, -1).join(", ");
  return `Questions ${head} and ${numbers[numbers.length - 1]}`;
}

const letter = (index: number) => String.fromCharCode(65 + index);

/**
 * The uploaded file has no `app_version` (or an unreadable one): it was made with an older
 * Examazej, whose exams may not come out the same now, even with the same seed.
 */
export function isOlderFile(source: NoteSource | undefined): boolean {
  return Boolean(source) && isFileBefore(readFileVersion(source?.appVersion), PINNED_OPTIONS_VERSION);
}

// ---------------------------------------------------------------------------------------------
// What the notes are about
// ---------------------------------------------------------------------------------------------

/**
 * A `%{#fixed-options:X}` from a file made with an older Examazej, which read it as every option
 * in order; it now keeps only X in place. Shown while the question still has its pins.
 */
export function hasOldPinMeaning(question: NoteFields): boolean {
  return Boolean(question.legacyPin) && !areOptionsLocked(question) && (question.pinnedOptions?.length ?? 0) > 0;
}

/** The answer fell back to A and nobody has checked it yet. */
export function isAnswerAssumed(question: NoteFields): boolean {
  return Boolean(question.answerAssumed && !question.answerChecked && question.choices[0].length > 0);
}

/** The answer was taken from the letter of an old `%{#fixed-options:X}` and nobody has checked it yet. */
export function isAnswerFromLetter(question: NoteFields): boolean {
  return Boolean(question.legacyPin?.answerFromLetter && !question.answerChecked);
}

/** The correct answer is a pinned option, so it has the same letter in every version. */
export function isAnswerPinned(question: NoteFields): boolean {
  return (
    question.choices[0].length > 0 &&
    !areOptionsLocked(question) &&
    Boolean(question.pinnedOptions?.includes(question.choices[1]))
  );
}

// ---------------------------------------------------------------------------------------------
// The Questions page: one question's notes
// ---------------------------------------------------------------------------------------------

export type QuestionNote =
  | { kind: "oldPinMeaning" }
  | { kind: "answerAssumed" }
  | { kind: "answerFromLetter"; letter: string }
  | { kind: "pinnedAnswer"; letter: string };

export function getQuestionNotes(question: NoteFields): QuestionNote[] {
  const notes: QuestionNote[] = [];
  if (hasOldPinMeaning(question)) notes.push({ kind: "oldPinMeaning" });
  if (isAnswerAssumed(question)) notes.push({ kind: "answerAssumed" });
  if (isAnswerFromLetter(question)) notes.push({ kind: "answerFromLetter", letter: letter(question.choices[1]) });
  if (isAnswerPinned(question)) notes.push({ kind: "pinnedAnswer", letter: letter(question.choices[1]) });
  return notes;
}

// ---------------------------------------------------------------------------------------------
// The Details page: one note per kind
// ---------------------------------------------------------------------------------------------

/**
 * The notes about the questions for the Details page, in this order: old `%{#fixed-options:X}`
 * tags, answers taken from their letters, assumed answers, pinned answers.
 */
export function getQuestionNoteSummary(questions: NoteFields[], source: NoteSource = { format: "latex" }): string[] {
  const pick = (test: (question: NoteFields) => boolean) =>
    questions.map((question, index) => (test(question) ? index + 1 : 0)).filter(Boolean);
  const oldPins = pick(hasOldPinMeaning);
  const fromLetter = questions
    .map((question, index) => ({ number: index + 1, letter: letter(question.choices[1]), on: isAnswerFromLetter(question) }))
    .filter((entry) => entry.on);
  const assumed = pick(isAnswerAssumed);
  const pinned = pick(isAnswerPinned);

  const notes: string[] = [];
  if (oldPins.length > 0) notes.push(oldPinMeaningNote(oldPins));
  if (fromLetter.length > 0) notes.push(answerFromLetterNote(fromLetter));
  if (assumed.length > 0) notes.push(missingAnswerPinNote(assumed, source));
  if (pinned.length > 0) notes.push(pinnedAnswerNote(pinned));
  return notes;
}

/** An old `%{#fixed-options:X}` now keeps only X in place; the switch keeps every option in order. */
export function oldPinMeaningNote(questionNumbers: number[]): string {
  const plural = questionNumbers.length > 1;
  return (
    `${formatQuestionList(questionNumbers)} use${plural ? "" : "s"} %{#fixed-options:X}, which an older Examazej ` +
    `read as "keep all options in order"; now it keeps only option X in place and shuffles the other options. ` +
    `To keep all options in order, turn on "Keep all options in order" for ${plural ? "these questions" : "this question"} ` +
    `on the Questions page.`
  );
}

/** Old single-letter pins without %{#correct:X}: the answer was taken from the letter. */
export function answerFromLetterNote(entries: { number: number; letter: string }[]): string {
  const many = entries.length > 1;
  return (
    `The file gives no %{#correct:X} for ${formatQuestionList(entries.map((e) => e.number))}, so ` +
    `${many ? "their answers were" : "its answer was"} taken from the letter in %{#fixed-options:X} ` +
    `(${entries.map((e) => `Q${e.number} ${e.letter}`).join(", ")}), as an older Examazej did. ` +
    `Check ${many ? "them" : "it"} on the Questions page.`
  );
}

/** Pinned questions without %{#correct:X} fall back to answer A; say so. */
export function missingAnswerPinNote(questionNumbers: number[], source: NoteSource = { format: "latex" }): string {
  const plural = questionNumbers.length > 1;
  const fix = source.format === "latex" ? `, or add %{#correct:X} to the file if that is wrong` : "";
  return (
    `${formatQuestionList(questionNumbers)} pin${plural ? "" : "s"} an option with %{#fixed-options:X} ` +
    `but ha${plural ? "ve" : "s"} no %{#correct:X} tag, so the answer is A (the first option). ` +
    `Check ${plural ? "them" : "it"} on the Questions page${fix}.`
  );
}

/** A pinned correct answer is the same letter in every version, which matters for exam integrity. */
export function pinnedAnswerNote(questionNumbers: number[]): string {
  return (
    `In ${formatQuestionList(questionNumbers)} the correct answer is a pinned option, ` +
    `so it has the same letter in every version.`
  );
}
