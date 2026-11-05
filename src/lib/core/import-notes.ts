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
  const these = plural ? "these questions" : "this question";
  return (
    `${list} use${plural ? "" : "s"} %{#fixed-options:X}, which changed meaning in v1.8: it now keeps only ` +
    `option X in place and shuffles the other options (before v1.8 it kept all options in order and made X the answer). ` +
    `${describeFileOrigin(file)}${answers} ` +
    `Because of this, every version made from this file differs from the versions made before v1.8 with the ` +
    `same seed, in all questions, so the answer key page carries a warning. To grade exams printed before v1.8, ` +
    `use the answer keys and mapping files saved then, or make the same exams again by replacing ` +
    `%{#fixed-options:X} with %{#fixed-options} and %{#correct:X} in ${these}. To keep the new meaning and stop ` +
    `this note, add %{#correct:X} to ${these} and %app_version=1.8.0 to the setting block, or download the ` +
    `template again from the Exam Package.`
  );
}

/**
 * The red warning box for the answer key page of an exam made from a pre-1.8 file that pins
 * options with %{#fixed-options:X}; null when no question does. LaTeX, needs tcolorbox.
 */
export function legacyPinAnswerKeyWarning(
  questions: Pick<Question, "choices" | "legacyPin">[]
): string | null {
  const legacy: number[] = [];
  const fromLetter: number[] = [];
  const letters: string[] = [];
  questions.forEach((question, index) => {
    if (!question.legacyPin) return;
    legacy.push(index + 1);
    if (question.legacyPin.answerFromLetter) {
      fromLetter.push(index + 1);
      letters.push(`${index + 1}: ${String.fromCharCode(65 + question.choices[1])}`);
    }
  });
  if (legacy.length === 0) return null;

  const tag = (text: string) => `\\texttt{\\%\\{\\#${text}\\}}`;
  const masters = (numbers: number[]) =>
    formatQuestionList(numbers).replace("Question", "master question");
  const plural = legacy.length > 1;
  const items = [
    `To grade exams printed before v1.8, use the answer key and mapping files saved then, not this key, ` +
      `or make the same exams again by replacing ${tag("fixed-options:X")} with ${tag("fixed-options")} and ` +
      `${tag("correct:X")} in ${plural ? "these questions" : "this question"}.`,
  ];
  if (fromLetter.length > 0) {
    const many = fromLetter.length > 1;
    items.push(
      `The file gives no ${tag("correct:X")} for ${masters(fromLetter)}, so ${many ? "their answers were" : "its answer was"} ` +
        `taken from the letter in the tag (${letters.join(", ")}). Check ${many ? "them" : "it"} by hand.`
    );
  }
  const list = masters(legacy).replace("master", "Master");
  return `
\\begin{tcolorbox}[colback=red!6, colframe=red!75!black, coltitle=white, fonttitle=\\bfseries,
  title={WARNING: this answer key differs from keys made before Examazej 1.8}]
${list} ${plural ? "use" : "uses"} ${tag("fixed-options:X")} in a file made before v1.8. Since v1.8 this tag
keeps only option X in place and shuffles the other options, so every version and this whole key differ from
the ones made from the same file before v1.8, even with the same seed.
\\begin{itemize}
${items.map((item) => `\\item ${item}`).join("\n")}
\\end{itemize}
\\end{tcolorbox}
\\vspace{0.5cm}
`;
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
