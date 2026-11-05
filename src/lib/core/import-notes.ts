/**
 * Notes shown on the Details page after upload (pinned options, files made before v1.8), and
 * the matching warning on the answer key page. Each note covers every affected question at
 * once, so the notes box stays short.
 */

import type { Question } from "../types";
import { describeFileOrigin, type FileVersion } from "./app-version";
import { findQuestionsInParenGroups } from "./group-config";

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
 * Numbers (1-based) of the `fixed` questions from a pre-1.8 file that sit in a `(n)` group of
 * `groups`: their options were shuffled before v1.8 and are locked now.
 */
export function findLegacyFixedInParenGroups(
  questions: Pick<Question, "legacyFixed">[],
  groups: string | undefined
): number[] {
  if (!groups) return [];
  const inParens = new Set(findQuestionsInParenGroups(questions.length, groups));
  const numbers: number[] = [];
  questions.forEach((question, index) => {
    if (question.legacyFixed && inParens.has(index)) numbers.push(index + 1);
  });
  return numbers;
}

/** Explains to a pre-1.8 file that its `fixed` questions in `(n)` groups now keep their options. */
export function legacyFixedNote(
  numbers: number[],
  format: "latex" | "spreadsheet",
  file: FileVersion
): string {
  const latex = format === "latex";
  const tag = (name: string) => (latex ? `%{#${name}}` : `'${name}'`);
  const plural = numbers.length > 1;
  const these = plural ? "these questions" : "this question";
  const stop = latex
    ? "add %app_version=1.8.0 to the setting block"
    : "add an app_version row with 1.8.0 to the settings";
  return (
    `${formatQuestionList(numbers)} ${plural ? "are" : "is"} ${tag("fixed")} inside a (n) group. Before v1.8 ` +
    `the options of such a question were shuffled by mistake; since v1.8 they stay in order, so ` +
    `${plural ? "their answers differ" : "its answers differ"} from the answer keys made before v1.8 with the ` +
    `same seed (the other questions are not affected), and the answer key page carries a warning. ` +
    `${describeFileOrigin(file)}. To grade exams printed before v1.8, use the answer keys saved then, or make ` +
    `the same exams again by using ${tag("fixed-position")} instead of ${tag("fixed")} in ${these}. To keep ` +
    `the options in order and stop this note, ${stop}, or download the template again from the Exam Package.`
  );
}

/**
 * The red warning box for the answer key page when the exam came from a pre-1.8 file whose key
 * differs from the keys v1.7 made: options pinned with %{#fixed-options:X}, or `fixed`
 * questions inside `(n)` groups (of `groups`, the groups the exam is generated with).
 * Null when neither applies. LaTeX, needs tcolorbox.
 */
export function legacyAnswerKeyWarning(
  questions: Pick<Question, "choices" | "legacyPin" | "legacyFixed">[],
  groups: string | undefined
): string | null {
  const pinned: number[] = [];
  const fromLetter: number[] = [];
  const letters: string[] = [];
  questions.forEach((question, index) => {
    if (!question.legacyPin) return;
    pinned.push(index + 1);
    if (question.legacyPin.answerFromLetter) {
      fromLetter.push(index + 1);
      letters.push(`${index + 1}: ${String.fromCharCode(65 + question.choices[1])}`);
    }
  });
  const fixed = findLegacyFixedInParenGroups(questions, groups);
  if (pinned.length === 0 && fixed.length === 0) return null;

  const tag = (text: string) => `\\texttt{\\%\\{\\#${text}\\}}`;
  const code = (text: string) => `\\texttt{${text}}`;
  const masters = (numbers: number[]) =>
    formatQuestionList(numbers).replace("Question", "master question");
  const Masters = (numbers: number[]) => masters(numbers).replace("master", "Master");

  const reasons: string[] = [];
  const remedies: string[] = [];
  if (pinned.length > 0) {
    reasons.push(
      `${Masters(pinned)} ${pinned.length > 1 ? "use" : "uses"} ${tag("fixed-options:X")} in a file made ` +
        `before v1.8. Since v1.8 this tag keeps only option X in place and shuffles the other options, so ` +
        `every version and this whole key differ from the ones made from the same file before v1.8, even ` +
        `with the same seed.`
    );
    remedies.push(
      `replace ${tag("fixed-options:X")} with ${tag("fixed-options")} and ${tag("correct:X")} in ${masters(pinned)}`
    );
  }
  if (fixed.length > 0) {
    reasons.push(
      `${Masters(fixed)} ${fixed.length > 1 ? "are" : "is"} ${code("fixed")} inside a (n) group in a file ` +
        `made before v1.8. Before v1.8 the options of such a question were shuffled by mistake; since v1.8 ` +
        `they stay in order, so ${fixed.length > 1 ? "their answers" : "its answers"} in this key differ ` +
        `from the ones made before v1.8 with the same seed. This does not affect the other questions.`
    );
    remedies.push(`use the tag ${code("fixed-position")} instead of ${code("fixed")} in ${masters(fixed)}`);
  }

  const items = [
    `To grade exams printed before v1.8, use the answer key and mapping files saved then, not this key, ` +
      `or make the same exams again: ${remedies.join("; and ")}.`,
  ];
  if (fromLetter.length > 0) {
    const many = fromLetter.length > 1;
    items.push(
      `The file gives no ${tag("correct:X")} for ${masters(fromLetter)}, so ${many ? "their answers were" : "its answer was"} ` +
        `taken from the letter in the tag (${letters.join(", ")}). Check ${many ? "them" : "it"} by hand.`
    );
  }
  return `
\\begin{tcolorbox}[colback=red!6, colframe=red!75!black, coltitle=white, fonttitle=\\bfseries,
  title={WARNING: this answer key differs from keys made before Examazej 1.8}]
${reasons.join("\n\n")}
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
