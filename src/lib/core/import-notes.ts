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

import type { LegacyReading, NoteSource, Question } from "../types";
import {
  describeFileOrigin,
  describeFileVersion,
  isFileBefore,
  PINNED_OPTIONS_VERSION,
  readFileVersion,
} from "./app-version";
import { describeGroups, findQuestionsInParenGroups, type GroupMode } from "./group-config";
import { areOptionsLocked, isPositionLocked } from "./question-flags";

type NoteFields = Pick<
  Question,
  | "choices"
  | "fixed"
  | "fixedPosition"
  | "fixedOptions"
  | "pinnedOptions"
  | "keepOnSeparatePage"
  | "legacyPin"
  | "legacyFixed"
  | "legacyRead"
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
 * draws an option shuffle v1.7 did not draw, so other questions may differ too. A question with
 * one option draws nothing either way: other questions differ only when `outOfPlace` (its
 * group's question shuffle differs from v1.7's, `legacyPinsOutOfPlace`); otherwise only its own
 * line of the mapping file does (options "A", where v1.7 wrote "ABCDE").
 */
export function legacyPinReach(question: NoteFields, outOfPlace = false): LegacyReach | null {
  if (!question.legacyPin || question.fixedOptions) return null;
  return question.choices[0].length >= 2 || outOfPlace ? "wider" : "this";
}

/**
 * 0-based indices of the pre-1.8 pins whose group shuffles its questions in a different order
 * than v1.7 did. In `5` / `[n]` groups the question shuffle lists the `fixedOptions` questions
 * first (versioning.ts), and v1.7 read these pins as `fixedOptions`, so a pin that is not
 * `fixedOptions` now can change its group's order even when it draws no option shuffle. Every
 * such pin of a group whose order differs is listed. None when the groups are unknown.
 */
export function legacyPinsOutOfPlace(questions: NoteFields[], groups: string | undefined): Set<number> {
  const out = new Set<number>();
  if (!groups) return out;
  for (const group of describeGroups(groups, questions.length)) {
    if (group.mode === "ordered") continue;
    const movable = Array.from({ length: group.size }, (_, k) => group.start + k).filter(
      (i) => !isPositionLocked(questions[i])
    );
    const listed = (optionsLocked: (i: number) => boolean) => [
      ...movable.filter(optionsLocked),
      ...movable.filter((i) => !optionsLocked(i)),
    ];
    const now = listed((i) => Boolean(questions[i].fixedOptions));
    const then = listed((i) => Boolean(questions[i].fixedOptions || questions[i].legacyPin));
    if (now.every((i, k) => i === then[k])) continue;
    movable.forEach((i) => {
      if (questions[i].legacyPin && !questions[i].fixedOptions) out.add(i);
    });
  }
  return out;
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

type ShuffleFields = Pick<
  Question,
  "choices" | "fixed" | "fixedPosition" | "fixedOptions" | "pinnedOptions" | "keepOnSeparatePage"
>;

/**
 * What `generateExamVersions` does with a question in a group of this mode, as a value two
 * questions can be compared by: its place in the question shuffle, its options (kept, drawn and
 * kept, pinned, shuffled) and its own page. Two questions with the same value come out the same
 * in every version, mapping file included.
 */
function shuffleBehaviour(question: ShuffleFields, mode: GroupMode): { place: string; options: string; page: boolean } {
  const count = question.choices[0].length;
  const pins = [...new Set(question.pinnedOptions ?? [])].filter((i) => i < count).sort((a, b) => a - b);
  // Pins on fewer than two options move nothing and are written like a shuffle.
  const pinned = count >= 2 && pins.length > 0 ? `pins ${pins.join("")}` : "shuffled";
  let options: string;
  let place: string;
  if (mode === "ordered") {
    place = "in order";
    if (question.fixedOptions) options = "kept";
    else if (question.fixed) options = count >= 2 ? "drawn and kept" : "kept";
    else options = pinned;
  } else {
    place = isPositionLocked(question) ? "locked" : question.fixedOptions ? "listed first" : "listed";
    options = areOptionsLocked(question) ? "kept" : pinned;
  }
  return { place, options, page: Boolean(question.keepOnSeparatePage) };
}

/**
 * The tags that make, in a group of this mode, the exam the older Examazej made from a question
 * it read as `reading`: its `fixed` shuffled the options inside a `(n)` group (the same as a
 * position lock alone), and its `fixed-options:X` kept every option in order.
 */
export function legacyReadingTarget(
  reading: LegacyReading,
  mode: GroupMode
): Pick<Question, "fixed" | "fixedPosition" | "fixedOptions" | "keepOnSeparatePage"> {
  return {
    fixed: reading.fixed && mode !== "ordered",
    fixedPosition: reading.fixed && mode === "ordered",
    fixedOptions: reading.fixedOptions,
    keepOnSeparatePage: reading.separatePage,
  };
}

/**
 * A question of a file made before v1.8 whose tags the older Examazej read differently
 * (`legacyRead`): does it still come out differently from the exams made then, in a group of
 * this mode? "this" when only its own line of the mapping file or its page differs, "wider"
 * when its place or its option shuffle does (so other questions may differ too). Its answer is
 * not compared: it stays the one the file gives (an open-ended question's takes the old one).
 */
export function legacyReadReach(question: NoteFields, mode: GroupMode | undefined): LegacyReach | null {
  const reading = question.legacyRead;
  if (!reading || !mode) return null;
  const target = { ...question, ...legacyReadingTarget(reading, mode), pinnedOptions: undefined };
  const now = shuffleBehaviour(question, mode);
  const then = shuffleBehaviour(target, mode);
  const openEndedAnswer = question.choices[0].length === 0 && question.choices[1] !== reading.answer;
  if (now.place === then.place && now.options === then.options && now.page === then.page && !openEndedAnswer) {
    return null;
  }
  const moves = question.choices[0].length >= 2 && now.options !== then.options;
  return now.place !== then.place || moves ? "wider" : "this";
}

/** The group mode of each question; none when the groups are unknown. */
function groupModesOf(questionCount: number, groups: string | undefined): (GroupMode | undefined)[] {
  const modes: (GroupMode | undefined)[] = Array.from({ length: questionCount }, () => undefined);
  if (!groups) return modes;
  for (const group of describeGroups(groups, questionCount)) {
    for (let k = 0; k < group.size; k++) modes[group.start + k] = group.mode;
  }
  return modes;
}

interface Affected {
  number: number;
  reach: LegacyReach;
}

/** Each question's old-file reaches under these groups (null: no warning). */
function legacyReachesOf(
  questions: NoteFields[],
  groups: string | undefined
): { pin: LegacyReach | null; fixed: LegacyReach | null; read: LegacyReach | null }[] {
  const inParens = parenGroupMembers(questions.length, groups);
  const outOfPlace = legacyPinsOutOfPlace(questions, groups);
  const modes = groupModesOf(questions.length, groups);
  return questions.map((question, index) => ({
    pin: legacyPinReach(question, outOfPlace.has(index)),
    fixed: legacyFixedReach(question, inParens.has(index)),
    read: legacyReadReach(question, modes[index]),
  }));
}

/** Every question whose old-file warning applies, with its reach. */
export function findLegacyDifferences(
  questions: NoteFields[],
  groups: string | undefined
): { pins: Affected[]; fixed: Affected[]; read: Affected[] } {
  const pins: Affected[] = [];
  const fixed: Affected[] = [];
  const read: Affected[] = [];
  legacyReachesOf(questions, groups).forEach((reach, index) => {
    if (reach.pin) pins.push({ number: index + 1, reach: reach.pin });
    if (reach.fixed) fixed.push({ number: index + 1, reach: reach.fixed });
    if (reach.read) read.push({ number: index + 1, reach: reach.read });
  });
  return { pins, fixed, read };
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

/**
 * The older Examazej took another answer for this question (it did not read the tag that gives
 * the current one), and nobody has checked it yet.
 */
export function isLegacyAnswerChanged(question: NoteFields): boolean {
  return Boolean(
    question.legacyRead &&
      question.choices[0].length > 0 &&
      question.legacyRead.answer !== question.choices[1] &&
      !question.answerChecked
  );
}

/**
 * The uploaded file has no `app_version` (or an unreadable one): it was made with an older
 * Examazej, whose exams may not come out the same now, even with the same seed.
 */
export function isOlderFile(source: NoteSource | undefined): boolean {
  return Boolean(source) && isFileBefore(readFileVersion(source?.appVersion), PINNED_OPTIONS_VERSION);
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
  | { kind: "legacyRead"; reach: LegacyReach }
  | { kind: "legacyReadAnswer"; then: string }
  | { kind: "answerAssumed" }
  | { kind: "answerFromLetter"; letter: string }
  | { kind: "pinnedAnswer"; letter: string };

/** Each question's notes under these groups, for the Questions page. */
export function getQuestionNotes(questions: NoteFields[], groups: string | undefined): QuestionNote[][] {
  return legacyReachesOf(questions, groups).map((reach, index) => {
    const question = questions[index];
    const notes: QuestionNote[] = [];
    if (reach.pin) notes.push({ kind: "legacyPin", reach: reach.pin });
    if (reach.fixed) notes.push({ kind: "legacyFixed", reach: reach.fixed });
    if (reach.read) notes.push({ kind: "legacyRead", reach: reach.read });
    if (isLegacyAnswerChanged(question) && question.legacyRead) {
      notes.push({ kind: "legacyReadAnswer", then: letter(question.legacyRead.answer) });
    }
    if (isAnswerAssumed(question)) notes.push({ kind: "answerAssumed" });
    if (isAnswerFromLetter(question)) {
      notes.push({ kind: "answerFromLetter", letter: letter(question.choices[1]) });
    }
    if (isAnswerPinned(question)) notes.push({ kind: "pinnedAnswer", letter: letter(question.choices[1]) });
    return notes;
  });
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
  return `These questions came from a file made with the older Examazej (this file was saved by ${describeFileVersion(file)})`;
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
  const { pins, fixed, read } = findLegacyDifferences(questions, groups);
  const fromLetter: { number: number; letter: string }[] = [];
  const assumed: number[] = [];
  const pinnedAnswers: number[] = [];
  const oldAnswers: { number: number; then: string; now: string }[] = [];
  questions.forEach((question, index) => {
    if (isLegacyAnswerChanged(question) && question.legacyRead) {
      oldAnswers.push({ number: index + 1, then: letter(question.legacyRead.answer), now: letter(question.choices[1]) });
    }
    if (isAnswerFromLetter(question)) {
      fromLetter.push({ number: index + 1, letter: letter(question.choices[1]) });
    }
    if (isAnswerAssumed(question)) assumed.push(index + 1);
    if (isAnswerPinned(question)) pinnedAnswers.push(index + 1);
  });

  // While a question's pin warning applies, that note also gives its answer letter. While every
  // such answer is still pinned, it also says they are the same letter in every version, and the
  // pinned-answer note leaves them out; otherwise the pinned-answer note says it where it holds.
  const inPinNote = new Set(pins.map((p) => p.number));
  const inferred = fromLetter.filter((e) => inPinNote.has(e.number));
  const fromLetterRest = fromLetter.filter((e) => !inPinNote.has(e.number));
  const stillPinned = inferred.length > 0 && inferred.every((e) => pinnedAnswers.includes(e.number));
  const inPinNoteAsPinned = new Set(stillPinned ? inferred.map((e) => e.number) : []);

  const notes: string[] = [];
  if (pins.length > 0) notes.push(legacyPinNote(pins.map((p) => p.number), source, inferred, stillPinned));
  if (fromLetterRest.length > 0) notes.push(answerFromLetterNote(fromLetterRest));
  if (fixed.length > 0) notes.push(legacyFixedNote(fixed, source));
  if (read.length > 0) notes.push(legacyReadNote(read.map((r) => r.number), source));
  if (oldAnswers.length > 0) notes.push(legacyAnswerNote(oldAnswers));
  if (assumed.length > 0) notes.push(missingAnswerPinNote(assumed, source));
  const pinnedRest = pinnedAnswers.filter((n) => !inPinNoteAsPinned.has(n));
  if (pinnedRest.length > 0) notes.push(pinnedAnswerNote(pinnedRest));
  return notes;
}

/** Explains the new meaning of %{#fixed-options:X} to a file made before v1.8. */
export function legacyPinNote(
  numbers: number[],
  source: NoteSource,
  inferred: { number: number; letter: string }[] = [],
  inferredPinned = true
): string {
  const list = formatQuestionList(numbers);
  const plural = numbers.length > 1;
  const answers =
    inferred.length > 0
      ? `; as the older Examazej did, the answer was taken from the letter` +
        (inferredPinned ? `, so it is the same letter in every version: ` : ` in the tag: `) +
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
    `${list} came with %{#fixed-options:X}, whose meaning has changed: the older Examazej ` +
    `kept all options in order and made X the answer; now it keeps only option X in place and shuffles the other ` +
    `options. ${originSentence(source)}${answers} ` +
    `With ${plural ? "their" : "its"} current tags, the exams made from this file differ from your old exams with ` +
    `the same seed, in ${these} and possibly in the other questions too, so the answer key page carries a warning. ` +
    `To grade your old exams, use the answer keys and mapping files saved with them. To undo this ` +
    `difference, press "Match my old exams" on the Questions page${inFile}. ` +
    `To keep the new meaning and stop this note, ${stop}.`
  );
}

/** Pre-1.8 single-letter pins without %{#correct:X}: the answer was taken from the letter. */
export function answerFromLetterNote(entries: { number: number; letter: string }[]): string {
  const many = entries.length > 1;
  return (
    `The file gives no %{#correct:X} for ${formatQuestionList(entries.map((e) => e.number))}, so, as the older ` +
    `Examazej did, ${many ? "their answers were" : "its answer was"} taken from the letter in the tag ` +
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
        } the option shuffle the older Examazej drew, the later questions in each version may differ too`;
  const inFile =
    source.format === "session"
      ? ""
      : ` (in the file: ${tag("fixed-position")} and no other lock or pin tag in ${these})`;
  return (
    `${formatQuestionList(numbers)} ${plural ? "are" : "is"} inside a (n) group and ${plural ? "were" : "was"} ` +
    `${tag("fixed")} in a file made with the older Examazej, which shuffled the options of ` +
    `such a question by mistake. With ${plural ? "their" : "its"} current tags they do not shuffle as they did ` +
    `then, so ${plural ? "their" : "its"} answers differ ` +
    `from your old answer keys with the same seed${scope}, and the answer key page carries a ` +
    `warning. ${originSentence(source)}. To grade your old exams, ` +
    `use the answer keys and mapping files saved with them. To undo this difference, press "Match my old ` +
    `exams" on the Questions page${inFile}. To keep the current tags and stop this note, ${stopAdvice(source)}.`
  );
}

/** A file made before v1.8 whose tags the older Examazej read differently (`legacyRead`). */
export function legacyReadNote(numbers: number[], source: NoteSource): string {
  const plural = numbers.length > 1;
  return (
    `The older Examazej read the tags of ${formatQuestionList(numbers)} differently: it ` +
    `ignored a tag it could not read (one on the same line as \\item, %{#q} or another tag, one followed by a ` +
    `comment, or one with a small option letter, as in %{#fixed-options:b}), or gave a tag written after an ` +
    `open-ended question to that question. So the exams made with it differ from these, in ${plural ? "these questions" : "this question"} and ` +
    `possibly in the other questions too, and the answer key page carries a warning. ${originSentence(source)}. To grade ` +
    `your old exams, use the answer keys and mapping files saved with them. To undo this difference, press "Match ` +
    `my old exams" on the Questions page. ` +
    `To keep the tags as written and stop this note, ${stopAdvice(source)}.`
  );
}

/** The older Examazej took another answer, because it did not read the tag that gives this one. */
export function legacyAnswerNote(entries: { number: number; then: string; now: string }[]): string {
  const many = entries.length > 1;
  return (
    `The older Examazej took another answer for ${formatQuestionList(entries.map((e) => e.number))}, because it did ` +
    `not read the tag that gives the answer: ${entries.map((e) => `Q${e.number} ${e.then}, now ${e.now}`).join("; ")}. ` +
    `The answer keys made with it were wrong for ${many ? "these questions" : "this question"}. Check ` +
    `${many ? "them" : "it"} on the Questions page.`
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
  const { pins, fixed, read } = findLegacyDifferences(questions, groups);
  if (pins.length === 0 && fixed.length === 0 && read.length === 0) return null;
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
  const buttons: number[] = [];
  if (pinned.length > 0) {
    reasons.push(
      `${Masters(pinned)} ${pinned.length > 1 ? "use" : "uses"} ${tag("fixed-options:X")} in a file made ` +
        `with the older Examazej, which kept all options in order for this tag; now it ` +
        `keeps only option X in place and shuffles the other options. With ` +
        `${pinned.length > 1 ? "their" : "its"} current tags, the versions and this key differ from the ones ` +
        `the older Examazej made from the same file, even with the ` +
        `same seed: in ${pinned.length > 1 ? "these questions" : "this question"} and possibly in the other questions too.`
    );
    remedies.push(
      `replace ${tag("fixed-options:X")} with ${tag("fixed-options")} and ${tag("correct:X")} in ${masters(pinned)}`
    );
    buttons.push(...pinned);
  }
  if (fixedNumbers.length > 0) {
    const many = fixedNumbers.length > 1;
    const scope =
      wider.length === 0
        ? "This does not affect the other questions."
        : `Because ${masters(wider)} no longer draw${wider.length > 1 ? "" : "s"} the option shuffle ` +
          `the older Examazej drew, the later questions in each version may differ too.`;
    reasons.push(
      `${Masters(fixedNumbers)} ${many ? "are" : "is"} inside a (n) group and ${many ? "were" : "was"} ` +
        `${code("fixed")} in a file made with the older Examazej, which shuffled the ` +
        `options of such a question by mistake. With ${many ? "their" : "its"} current tags they do not shuffle ` +
        `as they did then, so ${many ? "their answers" : "its answers"} in this key differ from the ones it made ` +
        `with the same seed. ${scope}`
    );
    remedies.push(`use the tag ${code("fixed-position")} and no other lock or pin tag in ${masters(fixedNumbers)}`);
    buttons.push(...fixedNumbers);
  }
  if (read.length > 0) {
    const readNumbers = read.map((r) => r.number);
    const many = readNumbers.length > 1;
    reasons.push(
      `The older Examazej read the tags of ${masters(readNumbers)} differently: it ignored ` +
        `a tag it could not read, or gave a tag written after an open-ended question to that question. So the ` +
        `versions and this key differ from the ones it made from the same file, even with the same seed: in ` +
        `${many ? "these questions" : "this question"} and possibly in the other questions too.`
    );
    buttons.push(...readNumbers);
  }

  const items = [
    `To grade the exams the older Examazej made, use the answer key and mapping files saved with them, not ` +
      `this key.` +
      (remedies.length > 0 ? ` To undo these differences in the file: ${remedies.join("; and ")}.` : ""),
    `In Examazej, \`\`Match my old exams'' on the Questions page undoes them, for ${masters(
      [...new Set(buttons)].sort((a, b) => a - b)
    )}.`,
  ];
  const oldAnswers = questions
    .map((question, index) => ({ question, number: index + 1 }))
    .filter(({ question }) => isLegacyAnswerChanged(question));
  if (oldAnswers.length > 0) {
    items.push(
      `The older Examazej took another answer for ${masters(oldAnswers.map((a) => a.number))}, because it did ` +
        `not read the tag that gives it (${oldAnswers
          .map(({ question, number }) => `${number}: ${letter(question.legacyRead?.answer ?? 0)}, now ${letter(question.choices[1])}`)
          .join("; ")}); the answer keys made with it were wrong there.`
    );
  }
  if (fromLetter.length > 0) {
    const many = fromLetter.length > 1;
    items.push(
      `The file gives no ${tag("correct:X")} for ${masters(fromLetter)}, so ${many ? "their answers were" : "its answer was"} ` +
        `taken from the letter in the tag (${letters.join(", ")}). Check ${many ? "them" : "it"} by hand.`
    );
  }
  return `
\\begin{tcolorbox}[colback=red!6, colframe=red!75!black, coltitle=white, fonttitle=\\bfseries,
  title={WARNING: this answer key differs from the keys an older Examazej made}]
${reasons.join("\n\n\\medskip\n")}
\\begin{itemize}
${items.map((item) => `\\item ${item}`).join("\n")}
\\end{itemize}
\\end{tcolorbox}
\\vspace{0.5cm}
`;
}
