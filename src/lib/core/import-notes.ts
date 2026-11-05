/**
 * Notes about pinned options (`%{#fixed-options:X}`) shown on the Details page after upload.
 * Each note covers every affected question at once, so the notes box stays short.
 */

import type { Question } from "../types";
import { describeFileOrigin, type FileVersion } from "./app-version";

/** "Question 3", "Questions 3 and 7", "Questions 3, 7 and 12". */
export function formatQuestionList(numbers: number[]): string {
  if (numbers.length === 1) return `Question ${numbers[0]}`;
  const head = numbers.slice(0, -1).join(", ");
  return `Questions ${head} and ${numbers[numbers.length - 1]}`;
}

export interface LegacyPinEntry {
  questionNumber: number;
  /** The answer letter taken from the tag (pre-1.8 rule), when the question had no %{#correct:X}. */
  inferredAnswer?: string;
}

/** Explains the new meaning of %{#fixed-options:X} to a file made before v1.8. */
export function legacyPinNote(entries: LegacyPinEntry[], file: FileVersion): string {
  const list = formatQuestionList(entries.map((e) => e.questionNumber));
  const plural = entries.length > 1;
  const inferred = entries.filter((e) => e.inferredAnswer);
  const answers =
    inferred.length > 0
      ? `; as before v1.8, the answer was taken from the letter, so it is the same letter in every version: ` +
        inferred.map((e) => `Q${e.questionNumber} ${e.inferredAnswer}`).join(", ") +
        "."
      : ".";
  return (
    `${list} use${plural ? "" : "s"} %{#fixed-options:X}, which changed meaning in v1.8: it now keeps only ` +
    `option X in place and shuffles the other options (before v1.8 it kept all options in order and made X the answer). ` +
    `${describeFileOrigin(file)}${answers} ` +
    `To keep all options in order instead, use %{#fixed-options}. To stop this note, add %{#correct:X} to ` +
    `${plural ? "these questions" : "this question"} and %app_version=1.8.0 to the setting block, or download ` +
    `the template again from the Exam Package.`
  );
}

/** Pinned questions without %{#correct:X} fall back to answer A; say so. */
export function missingAnswerPinNote(questionNumbers: number[]): string {
  const plural = questionNumbers.length > 1;
  return (
    `${formatQuestionList(questionNumbers)} pin${plural ? "" : "s"} an option with %{#fixed-options:X} ` +
    `but ha${plural ? "ve" : "s"} no %{#correct:X} tag, so the answer is A (the first option). ` +
    `Add %{#correct:X} if that is wrong.`
  );
}

/** Numbers (1-based) of questions whose correct answer is one of their pinned options. */
export function findPinnedAnswerQuestions(
  questions: Pick<Question, "choices" | "pinnedOptions">[]
): number[] {
  const numbers: number[] = [];
  questions.forEach((question, index) => {
    if (question.choices[0].length > 0 && question.pinnedOptions?.includes(question.choices[1])) {
      numbers.push(index + 1);
    }
  });
  return numbers;
}

/** A pinned correct answer is the same letter in every version, which matters for exam integrity. */
export function pinnedAnswerNote(questionNumbers: number[]): string {
  return (
    `In ${formatQuestionList(questionNumbers)} the correct answer is a pinned option, ` +
    `so it has the same letter in every version.`
  );
}
