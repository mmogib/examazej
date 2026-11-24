/**
 * Notes about the questions: on the Details page (one note per kind, covering every affected
 * question, so the box stays short), next to each question on the Questions page, and the
 * matching warning on the answer key page.
 *
 * All of them are worked out from the questions as they are now (their tags and the readers'
 * markers) and the groups, never stored: an edit on the Questions page or a change of groups
 * updates them, and the three places never disagree. The readers only record markers
 * (`legacyPin`, `legacyFixed`, `answerAssumed`); their own `warnings` are about the file.
 */

import type { NoteSource, Question } from "../types";
import {
  describeFileOrigin,
  describeFileVersion,
  isFileBefore,
  PINNED_OPTIONS_VERSION,
  readFileVersion,
} from "./app-version";
import { findQuestionsInParenGroups } from "./group-config";
import { areOptionsLocked } from "./question-flags";

type NoteFields = Pick<
  Question,
  | "choices"
  | "fixed"
  | "fixedPosition"
  | "fixedOptions"
  | "pinnedOptions"
  | "legacyPin"
  | "legacyFixed"
  | "answerAssumed"
  | "answerChecked"
>;

/** "Question 3", "Questions 3 and 7", "Questions 3, 7 and 12". */
export function formatQuestionList(numbers: number[]): string {
  if (numbers.length === 1) return `Question ${numbers[0]}`;
  const head = numbers.slice(0, -1).join(", ");
  return `Questions ${head} and ${numbers[numbers.length - 1]}`;
}

const letter = (index: number) => String.fromCharCode(65 + index);

// ---------------------------------------------------------------------------------------------
// Files made before v1.8: does a marked question still come out differently from v1.7, and how
// far does the difference reach? Decided by what the shuffle does with the current tags
// (versioning.ts), never by comparing tag shapes.
// ---------------------------------------------------------------------------------------------

/** "this": only this question's answers differ from v1.7's; "wider": other questions may too. */
export type LegacyReach = "this" | "wider";

/**
 * A pre-1.8 `%{#fixed-options:X}`, which v1.7 read as every option locked (`fixedOptions`: no
 * option shuffle drawn). With `fixedOptions` the question comes out as in v1.7. Anything else
 * draws an option shuffle v1.7 did not draw (and, in `5` / `[n]` groups, puts the question in a
 * different place of the question shuffle), so other questions may differ too.
 */
export function legacyPinReach(question: NoteFields): LegacyReach | null {
  if (!question.legacyPin || question.choices[0].length < 2) return null;
  return question.fixedOptions ? null : "wider";
}

/**
 * A pre-1.8 `fixed` question inside a `(n)` group, whose options v1.7 shuffled by mistake.
 * Shuffling them freely is v1.7's behaviour. `fixed` (draws the shuffle and discards it) and
 * pins (draw the full shuffle) keep v1.7's draws, so only this question differs.
 * `fixedOptions` draws nothing, so the later questions may differ too. Outside `(n)` groups
 * v1.7 handled `fixed` correctly; a question with fewer than two options never differs.
 */
export function legacyFixedReach(question: NoteFields, inParenGroup: boolean): LegacyReach | null {
  if (!question.legacyFixed || !inParenGroup || question.choices[0].length < 2) return null;
  if (question.fixedOptions) return "wider";
  if (question.fixed || (question.pinnedOptions?.length ?? 0) > 0) return "this";
  return null;
}

interface Affected {
  number: number;
  reach: LegacyReach;
}

/** Every question whose old-file warning applies, with its reach. */
export function findLegacyDifferences(
  questions: NoteFields[],
  groups: string | undefined
): { pins: Affected[]; fixed: Affected[] } {
  const inParens = parenGroupMembers(questions.length, groups);
  const pins: Affected[] = [];
  const fixed: Affected[] = [];
  questions.forEach((question, index) => {
    const pinReach = legacyPinReach(question);
    if (pinReach) pins.push({ number: index + 1, reach: pinReach });
    const fixedReach = legacyFixedReach(question, inParens.has(index));
    if (fixedReach) fixed.push({ number: index + 1, reach: fixedReach });
  });
  return { pins, fixed };
}

/** 0-based indices of the questions in `(n)` groups; none when the groups are unknown. */
export function parenGroupMembers(questionCount: number, groups: string | undefined): Set<number> {
  return new Set(groups ? findQuestionsInParenGroups(questionCount, groups) : []);
}

// ---------------------------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------------------------

/** The answer fell back to A and nobody has checked it yet. */
export function isAnswerAssumed(question: NoteFields): boolean {
  return Boolean(question.answerAssumed && !question.answerChecked && question.choices[0].length > 0);
}

/** The answer was taken from a pre-1.8 pinned letter and nobody has checked it yet. */
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
  | { kind: "legacyPin"; reach: LegacyReach }
  | { kind: "legacyFixed"; reach: LegacyReach }
  | { kind: "answerAssumed" }
  | { kind: "answerFromLetter"; letter: string }
  | { kind: "pinnedAnswer"; letter: string };

export function getQuestionNotes(question: NoteFields, inParenGroup: boolean): QuestionNote[] {
  const notes: QuestionNote[] = [];
  const pinReach = legacyPinReach(question);
  if (pinReach) notes.push({ kind: "legacyPin", reach: pinReach });
  const fixedReach = legacyFixedReach(question, inParenGroup);
  if (fixedReach) notes.push({ kind: "legacyFixed", reach: fixedReach });
  if (isAnswerAssumed(question)) notes.push({ kind: "answerAssumed" });
  if (isAnswerFromLetter(question)) {
    notes.push({ kind: "answerFromLetter", letter: letter(question.choices[1]) });
  }
  if (isAnswerPinned(question)) notes.push({ kind: "pinnedAnswer", letter: letter(question.choices[1]) });
  return notes;
}

// ---------------------------------------------------------------------------------------------
// The Details page: one note per kind
// ---------------------------------------------------------------------------------------------

const DEFAULT_SOURCE: NoteSource = { format: "latex" };

/**
 * Where the old-file questions came from. A file stamped 1.8 or later (a session saved by this
 * app keeps the markers of the file it was made from) is not itself the old file.
 */
function originSentence(source: NoteSource): string {
  const file = readFileVersion(source.appVersion);
  if (isFileBefore(file, PINNED_OPTIONS_VERSION)) return describeFileOrigin(file);
  return `These questions came from a file made before v1.8 (this file was saved by ${describeFileVersion(file)})`;
}

/** How to stop an old-file note by changing the file, by kind of file. */
function stopAdvice(source: NoteSource): string {
  switch (source.format) {
    case "latex":
      return "add %app_version=1.8.0 to the setting block, or download the template again from the Exam Package";
    case "spreadsheet":
      return "add an app_version row with 1.8.0 to the settings, or download the template again from the Exam Package";
    case "session":
      return "open the template from the Exam Package instead of this session file";
  }
}

/**
 * The notes about the questions for the Details page, in this order: pre-1.8 pins (with the
 * answers taken from their letters), answers taken from the letter whose pin warning no longer
 * applies, pre-1.8 `fixed` in `(n)` groups, assumed answers, pinned answers. `groups` is the
 * group setting to judge `(n)` membership by; undefined skips the group notes.
 */
export function getQuestionNoteSummary(
  questions: NoteFields[],
  groups: string | undefined,
  source: NoteSource = DEFAULT_SOURCE
): string[] {
  const { pins, fixed } = findLegacyDifferences(questions, groups);
  const fromLetter: { number: number; letter: string }[] = [];
  const assumed: number[] = [];
  const pinnedAnswers: number[] = [];
  questions.forEach((question, index) => {
    if (isAnswerFromLetter(question)) {
      fromLetter.push({ number: index + 1, letter: letter(question.choices[1]) });
    }
    if (isAnswerAssumed(question)) assumed.push(index + 1);
    if (isAnswerPinned(question)) pinnedAnswers.push(index + 1);
  });

  // While a question's pin warning applies, that note also gives its answer letter and says it is
  // the same letter in every version, so the pinned-answer note leaves it out.
  const inPinNote = new Set(pins.map((p) => p.number));
  const inferred = fromLetter.filter((e) => inPinNote.has(e.number));
  const fromLetterRest = fromLetter.filter((e) => !inPinNote.has(e.number));
  const inferredNumbers = new Set(inferred.map((e) => e.number));

  const notes: string[] = [];
  if (pins.length > 0) notes.push(legacyPinNote(pins.map((p) => p.number), source, inferred));
  if (fromLetterRest.length > 0) notes.push(answerFromLetterNote(fromLetterRest));
  if (fixed.length > 0) notes.push(legacyFixedNote(fixed, source));
  if (assumed.length > 0) notes.push(missingAnswerPinNote(assumed, source));
  const pinnedRest = pinnedAnswers.filter((n) => !inferredNumbers.has(n));
  if (pinnedRest.length > 0) notes.push(pinnedAnswerNote(pinnedRest));
  return notes;
}

/** Explains the new meaning of %{#fixed-options:X} to a file made before v1.8. */
export function legacyPinNote(
  numbers: number[],
  source: NoteSource,
  inferred: { number: number; letter: string }[] = []
): string {
  const list = formatQuestionList(numbers);
  const plural = numbers.length > 1;
  const answers =
    inferred.length > 0
      ? `; as before v1.8, the answer was taken from the letter, so it is the same letter in every version: ` +
        inferred.map((e) => `Q${e.number} ${e.letter}`).join(", ") +
        ". Check " + (inferred.length > 1 ? "these answers" : "this answer") + " on the Questions page."
      : ".";
  const these = plural ? "these questions" : "this question";
  const inFile =
    source.format === "latex"
      ? ` (in the file: replace %{#fixed-options:X} with %{#fixed-options} and %{#correct:X} in ${these})`
      : "";
  const stop =
    source.format === "latex"
      ? `add %{#correct:X} to ${these} and %app_version=1.8.0 to the setting block, or download the template again from the Exam Package`
      : stopAdvice(source);
  return (
    `${list} use${plural ? "" : "s"} %{#fixed-options:X}, which changed meaning in v1.8: it now keeps only ` +
    `option X in place and shuffles the other options (before v1.8 it kept all options in order and made X the answer). ` +
    `${originSentence(source)}${answers} ` +
    `Because of this, the versions made from this file differ from the versions made before v1.8 with the ` +
    `same seed, in ${these} and possibly in the other questions too, so the answer key page carries a warning. ` +
    `To grade exams printed before v1.8, use the answer keys and mapping files saved then, or make the same ` +
    `exams again with "Keep all options in order, as before v1.8" on the Questions page${inFile}. ` +
    `To keep the new meaning and stop this note, ${stop}.`
  );
}

/** Pre-1.8 single-letter pins without %{#correct:X}: the answer was taken from the letter. */
export function answerFromLetterNote(entries: { number: number; letter: string }[]): string {
  const many = entries.length > 1;
  return (
    `The file gives no %{#correct:X} for ${formatQuestionList(entries.map((e) => e.number))}, so, as before ` +
    `v1.8, ${many ? "their answers were" : "its answer was"} taken from the letter in the tag ` +
    `(${entries.map((e) => `Q${e.number} ${e.letter}`).join(", ")}). Check ${many ? "them" : "it"} on the Questions page.`
  );
}

/** Explains to a pre-1.8 file that its `fixed` questions in `(n)` groups now keep their options. */
export function legacyFixedNote(entries: Affected[], source: NoteSource): string {
  const numbers = entries.map((e) => e.number);
  const wider = entries.filter((e) => e.reach === "wider").map((e) => e.number);
  const latex = source.format === "latex";
  const tag = (name: string) => (latex ? `%{#${name}}` : `'${name}'`);
  const plural = numbers.length > 1;
  const these = plural ? "these questions" : "this question";
  const scope =
    wider.length === 0
      ? " (the other questions are not affected)"
      : `; because ${formatQuestionList(wider)} no longer draw${
          wider.length > 1 ? "" : "s"
        } the option shuffle v1.7 drew, the later questions in each version may differ too`;
  const inFile =
    source.format === "session" ? "" : ` (in the file: using ${tag("fixed-position")} instead of ${tag("fixed")} in ${these})`;
  return (
    `${formatQuestionList(numbers)} ${plural ? "are" : "is"} ${tag("fixed")} inside a (n) group in a file ` +
    `made before v1.8. Before v1.8 the options of such a question were shuffled by mistake; with ` +
    `${plural ? "their" : "its"} current tags they are not, so ${plural ? "their" : "its"} answers differ ` +
    `from the answer keys made before v1.8 with the same seed${scope}, and the answer key page carries a ` +
    `warning. ${originSentence(source)}. To grade exams printed before v1.8, ` +
    `use the answer keys saved then, or make the same exams again with "Shuffle the options, as before ` +
    `v1.8" on the Questions page${inFile}. To keep the current tags and stop this note, ${stopAdvice(source)}.`
  );
}

/** Pinned questions without %{#correct:X} fall back to answer A; say so. */
export function missingAnswerPinNote(questionNumbers: number[], source: NoteSource = DEFAULT_SOURCE): string {
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

// ---------------------------------------------------------------------------------------------
// The answer key page
// ---------------------------------------------------------------------------------------------

/**
 * The red warning box for the answer key page when the exam came from a pre-1.8 file whose key
 * differs from the keys v1.7 made: options pinned with %{#fixed-options:X}, or `fixed`
 * questions inside `(n)` groups (of `groups`, the groups the exam is generated with), judged as
 * on the Details page. Null when neither applies. LaTeX, needs tcolorbox.
 */
export function legacyAnswerKeyWarning(questions: NoteFields[], groups: string | undefined): string | null {
  const { pins, fixed } = findLegacyDifferences(questions, groups);
  if (pins.length === 0 && fixed.length === 0) return null;
  const pinned = pins.map((p) => p.number);
  const fixedNumbers = fixed.map((f) => f.number);
  const wider = fixed.filter((f) => f.reach === "wider").map((f) => f.number);
  const fromLetter: number[] = [];
  const letters: string[] = [];
  questions.forEach((question, index) => {
    if (isAnswerFromLetter(question)) {
      fromLetter.push(index + 1);
      letters.push(`${index + 1}: ${letter(question.choices[1])}`);
    }
  });

  const tag = (text: string) => `\\texttt{\\%\\{\\#${text}\\}}`;
  const code = (text: string) => `\\texttt{${text}}`;
  const masters = (numbers: number[]) => formatQuestionList(numbers).replace("Question", "master question");
  const Masters = (numbers: number[]) => masters(numbers).replace("master", "Master");

  const reasons: string[] = [];
  const remedies: string[] = [];
  const buttons: string[] = [];
  if (pinned.length > 0) {
    reasons.push(
      `${Masters(pinned)} ${pinned.length > 1 ? "use" : "uses"} ${tag("fixed-options:X")} in a file made ` +
        `before v1.8. Since v1.8 this tag keeps only option X in place and shuffles the other options, so ` +
        `the versions and this key differ from the ones made from the same file before v1.8, even with the ` +
        `same seed: in ${pinned.length > 1 ? "these questions" : "this question"} and possibly in the other questions too.`
    );
    remedies.push(
      `replace ${tag("fixed-options:X")} with ${tag("fixed-options")} and ${tag("correct:X")} in ${masters(pinned)}`
    );
    buttons.push(`\`\`Keep all options in order, as before v1.8'' for ${masters(pinned)}`);
  }
  if (fixedNumbers.length > 0) {
    const many = fixedNumbers.length > 1;
    const scope =
      wider.length === 0
        ? "This does not affect the other questions."
        : `Because ${masters(wider)} no longer draw${wider.length > 1 ? "" : "s"} the option shuffle ` +
          `made before v1.8, the later questions in each version may differ too.`;
    reasons.push(
      `${Masters(fixedNumbers)} ${many ? "are" : "is"} ${code("fixed")} inside a (n) group in a file ` +
        `made before v1.8. Before v1.8 the options of such a question were shuffled by mistake; with ` +
        `${many ? "their" : "its"} current tags they are not, so ${many ? "their answers" : "its answers"} in ` +
        `this key differ from the ones made before v1.8 with the same seed. ${scope}`
    );
    remedies.push(`use the tag ${code("fixed-position")} instead of ${code("fixed")} in ${masters(fixedNumbers)}`);
    buttons.push(`\`\`Shuffle the options, as before v1.8'' for ${masters(fixedNumbers)}`);
  }

  const items = [
    `To grade exams printed before v1.8, use the answer key and mapping files saved then, not this key, ` +
      `or make the same exams again: ${remedies.join("; and ")}.`,
    `In Examazej, the Questions page does the same: ${buttons.join("; and ")}.`,
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
