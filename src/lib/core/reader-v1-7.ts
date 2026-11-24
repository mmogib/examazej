/**
 * How Examazej 1.6.0-1.7.0 read the questions and tags of a LaTeX file: a frozen copy of the
 * question loop of `parseLatexTemplate` and of `validateQuestionTags` from v1.7.0, used only to
 * compare with the current reading of a file made before v1.8 (`parser.ts`).
 *
 * That reader read a tag only when it stood alone on its line, with an option letter A-E in
 * capitals; any other tag was ignored without a word. And a tag written after an open-ended
 * question went to that open-ended question, not to the next one. The current reader reads all
 * of these as written, so the exams made then can differ. Do not "fix" this file: it must keep
 * reading exactly as v1.7.0 did (tests compare it with the output of the real v1.7.0 code).
 */

/** One question as v1.7.0 read it. */
export interface QuestionAsV17 {
  optionCount: number;
  /** The tags v1.7.0 gave it, as written: `fixed`, `fixed-options:X`, `separate-page`. */
  tags: string[];
  fixed: boolean;
  /** From `fixed-options:X`: every option in order. */
  fixedOptions: boolean;
  separatePage: boolean;
  /** The correct option index: X of `fixed-options:X`, otherwise 0. */
  answer: number;
}

const VALID_TAGS_V17 = ["fixed", "fixed-options", "separate-page"];

interface TagV17 {
  tag: string;
  /** The letter of `fixed-options:X`. */
  letter?: string;
}

/** v1.7.0's `validateQuestionTags`: null where it reported an error (the file was refused). */
function flagsOf(tags: TagV17[]): { fixed: boolean; fixedOptions: boolean; separatePage: boolean } | null {
  const normalizedTags = tags.map((t) => t.tag.toLowerCase().trim()).filter((t) => t !== "");
  if (normalizedTags.some((t) => !VALID_TAGS_V17.includes(t))) return null;
  const hasFixed = normalizedTags.includes("fixed");
  const hasFixedOptions = normalizedTags.includes("fixed-options");
  if (hasFixed && hasFixedOptions) return null;
  return { fixed: hasFixed, fixedOptions: hasFixedOptions, separatePage: normalizedTags.includes("separate-page") };
}

/**
 * The questions as v1.7.0 read them, or null when v1.7.0 refused the file (it stopped on any
 * tag error), so no exams were made from it then.
 */
export function readQuestionsAsV17(content: string): QuestionAsV17[] | null {
  const lines = content.split("\n");
  const questions: QuestionAsV17[] = [];
  let refused = false;

  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];
  let currentTags: TagV17[] = [];
  let currentCorrectLetter: string | undefined;
  let enumerateDepth = 0;
  let inQuestionEnumerate = false;
  let inQuestionBlock = false;
  let inOptionBlock = false;
  let currentOptionText = "";

  const save = () => {
    const flags = flagsOf(currentTags);
    if (!flags) refused = true;
    questions.push({
      optionCount: currentOptions.length,
      tags: currentTags.map((t) => (t.letter ? `${t.tag}:${t.letter}` : t.tag.toLowerCase())),
      fixed: flags?.fixed ?? false,
      fixedOptions: flags?.fixedOptions ?? false,
      separatePage: flags?.separatePage ?? false,
      answer: currentCorrectLetter ? currentCorrectLetter.charCodeAt(0) - 65 : 0,
    });
    currentQuestion = null;
    currentOptions = [];
    currentTags = [];
    currentCorrectLetter = undefined;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Skip LaTeX comment lines (but not the markers that start with %)
    if (trimmed.startsWith("%") && !trimmed.startsWith("%{") && !inOptionBlock && !inQuestionBlock) {
      continue;
    }

    if (trimmed.includes("\\begin{enumerate}")) {
      enumerateDepth++;
      if (enumerateDepth === 1) inQuestionEnumerate = true;
      continue;
    }

    if (trimmed.includes("\\end{enumerate}")) {
      // A question with options ends with its options' list.
      if (enumerateDepth === 2 && currentQuestion && currentOptions.length >= 0) {
        save();
        inOptionBlock = false;
        currentOptionText = "";
      }
      // An open-ended question still pending when the question list closes.
      if (enumerateDepth === 1 && currentQuestion !== null) save();
      enumerateDepth--;
      if (enumerateDepth === 0) inQuestionEnumerate = false;
      continue;
    }

    const shouldProcess = inQuestionEnumerate || inQuestionBlock;

    // A tag only when it is the whole line: %{#name} or %{#name:X}, X one of A-E.
    if (shouldProcess) {
      const tagMatch = trimmed.match(/^%\{#(?!q\}|o\}|\/q\}|\/o\})([\w-]+)(?::([A-E]))?\}$/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const tagValue = tagMatch[2];
        if (tagName === "fixed-options") {
          if (tagValue) {
            currentTags.push({ tag: tagName, letter: tagValue });
            currentCorrectLetter = tagValue;
          } else {
            refused = true; // 'fixed-options' without a letter was an error
          }
        } else {
          currentTags.push({ tag: tagName });
        }
        continue;
      }
    }

    if (trimmed.includes("%{#q}")) {
      // A pending open-ended question takes every tag collected so far, including the tags
      // written above this question.
      if (inQuestionEnumerate && currentQuestion !== null) save();
      inQuestionBlock = true;
      const sameLineMatch = trimmed.match(/%\{#q\}(.*?)%\{\/q\}/);
      if (sameLineMatch) {
        currentQuestion = sameLineMatch[1].trim();
        inQuestionBlock = false;
      } else {
        currentQuestion = trimmed.replace("%{#q}", "").trim() || "";
      }
      continue;
    }

    if (trimmed.includes("%{/q}") && inQuestionBlock) {
      const beforeTag = trimmed.replace("%{/q}", "").trim();
      if (beforeTag) currentQuestion = currentQuestion ? currentQuestion + " " + beforeTag : beforeTag;
      inQuestionBlock = false;
      // Outside a question list, a question is saved at once (open-ended).
      if (!inQuestionEnumerate && currentQuestion !== null) save();
      continue;
    }

    if (currentQuestion && line.includes("%{#o}")) {
      const startIdx = line.indexOf("%{#o}") + "%{#o}".length;
      if (line.indexOf("%{/o}", startIdx) !== -1) {
        currentOptions.push(line.slice(startIdx, line.indexOf("%{/o}", startIdx)));
        inOptionBlock = false;
      } else {
        inOptionBlock = true;
        currentOptionText = line.slice(startIdx);
      }
      continue;
    }

    if (inOptionBlock) {
      const endIdx = line.indexOf("%{/o}");
      if (endIdx !== -1) {
        const before = line.slice(0, endIdx);
        currentOptions.push(currentOptionText === "" ? before : currentOptionText + "\n" + before);
        currentOptionText = "";
        inOptionBlock = false;
      } else {
        currentOptionText = currentOptionText === "" ? line : currentOptionText + "\n" + line;
      }
      continue;
    }

    if (inQuestionBlock && trimmed && !trimmed.startsWith("%{")) {
      currentQuestion = currentQuestion ? currentQuestion + "\n" + line : line;
      continue;
    }
  }

  if (currentQuestion !== null) save();
  return refused ? null : questions;
}
