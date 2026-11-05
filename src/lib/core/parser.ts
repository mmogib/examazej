// LaTeX template parser for Examazej

import { ParsedLatexTemplate, ExamSettings, Question } from "../types";
import { generateDynamicSeed } from "../utils/seed-generator";
import {
  validateQuestionTags,
  VALID_TAGS,
  type QuestionTags,
  type ValidTag,
} from "../utils/tag-validator";
import { createLogger } from "@/lib/utils/logger";
import { getDefaultSettings } from "./settings";
import {
  getFileVersionNotes,
  isFileBefore,
  PINNED_OPTIONS_VERSION,
  readFileVersion,
} from "./app-version";
import {
  findPinnedAnswerQuestions,
  legacyPinNote,
  missingAnswerPinNote,
  pinnedAnswerNote,
  type LegacyPinEntry,
} from "./import-notes";

const logger = createLogger("PARSER");

/**
 * A tag read from a `%{#name}` or `%{#name:value}` marker, with its source line.
 */
interface TagWithLocation {
  name: string; // lower-cased
  value?: string; // text after the colon, if any
  lineNumber: number;
}

/** Markers that are document structure, never question tags. */
const STRUCTURAL_MARKERS = new Set(["q", "o", "setting", "preamble", "instructions"]);
const TAG_TOKEN = /^%\{#([A-Za-z][A-Za-z0-9_-]*)(?::([^}]*))?\}\s*/;
const ANSWER_LETTER = /^[A-Ea-e]$/;

type TagLineResult =
  | { tags: Omit<TagWithLocation, "lineNumber">[]; remainder: string }
  | { error: string };

/**
 * Read one or more tag markers at the start of `content` (already trimmed, with any leading
 * `\item` removed). Returns null when the line does not start with a tag at all.
 * A trailing LaTeX comment is allowed; a `%{#q}` after the tags is returned as `remainder`.
 */
function readTagLine(content: string): TagLineResult | null {
  if (!content.startsWith("%{#")) return null;
  const firstName = content.match(/^%\{#([^}:]*)/)?.[1].trim().toLowerCase() ?? "";
  if (STRUCTURAL_MARKERS.has(firstName)) return null;

  const tags: Omit<TagWithLocation, "lineNumber">[] = [];
  let rest = content;
  let match: RegExpMatchArray | null;
  while ((match = rest.match(TAG_TOKEN))) {
    const name = match[1].toLowerCase();
    if (STRUCTURAL_MARKERS.has(name)) break;
    tags.push({ name, value: match[2]?.trim() });
    rest = rest.slice(match[0].length);
  }

  if (tags.length === 0) {
    return {
      error: `Could not read the tag "${content}". Tags look like %{#fixed} or %{#correct:B}.`,
    };
  }
  if (rest === "" || /^%(?!\{)/.test(rest)) return { tags, remainder: "" };
  if (rest.startsWith("%{#q}")) return { tags, remainder: rest };
  return {
    error: `Unexpected text after the tag in "${content}". Put tags on their own line, before %{#q}.`,
  };
}

/** Per-file state for pinned options (`%{#fixed-options:X}`), filled while questions are read. */
interface PinState {
  /** The file predates v1.8, when %{#fixed-options:X} also set the answer. */
  legacy: boolean;
  /** Legacy-file questions that pin options (for the "changed meaning" note). */
  legacyEntries: LegacyPinEntry[];
  /** Questions that pin options, have no %{#correct:X} and so fall back to answer A. */
  missingAnswer: number[];
}

/**
 * Create a question object from current parsing state.
 * Resolves its tags (including the answer letter) and collects errors and warnings
 * without throwing, so every problem in the file is reported at once.
 *
 * @param questionText - The question text
 * @param options - Array of option texts
 * @param tags - Tags collected for this question, with their line numbers
 * @param questionNumber - Question number (1-indexed)
 * @param errors - Output array for validation errors
 * @param warnings - Output array for non-blocking warnings
 * @param pins - Per-file pinned-option state (read and updated)
 */
function createQuestionObject(
  questionText: string,
  options: string[],
  tags: TagWithLocation[],
  questionNumber: number,
  errors: string[],
  warnings: string[],
  pins: PinState
): Omit<Question, "group" | "order"> {
  const where = `Question ${questionNumber}`;
  const names: string[] = [];
  let correctLetter: string | undefined;
  let correctSource = "";

  const setCorrect = (tag: TagWithLocation, raw: string) => {
    const written = `%{#${tag.name}:${raw}}`;
    if (!ANSWER_LETTER.test(raw)) {
      errors.push(
        `${where} (line ${tag.lineNumber}): "${raw}" in ${written} is not an answer letter. Use a single letter A-E.`
      );
      return;
    }
    const letter = raw.toUpperCase();
    if (correctLetter && correctLetter !== letter) {
      errors.push(
        `${where} (line ${tag.lineNumber}): conflicting correct answers ${correctLetter} (${correctSource}) and ${letter} (${written}).`
      );
      return;
    }
    correctLetter = letter;
    correctSource = written;
  };

  for (const tag of tags) {
    if (tag.name === "correct") {
      if (!tag.value) {
        errors.push(
          `${where} (line ${tag.lineNumber}): %{#correct} needs a letter, e.g. %{#correct:B}.`
        );
        continue;
      }
      setCorrect(tag, tag.value);
    } else if (tag.name === "fixed-options" && tag.value !== undefined) {
      // %{#fixed-options:DE} keeps those options in place; the validator reads the letters.
      names.push(`fixed-options:${tag.value}`);
    } else {
      if (tag.value !== undefined && VALID_TAGS.includes(tag.name as ValidTag)) {
        errors.push(
          `${where} (line ${tag.lineNumber}): %{#${tag.name}} does not take a value (found %{#${tag.name}:${tag.value}}).`
        );
      }
      names.push(tag.name);
    }
  }

  let flags: QuestionTags;
  try {
    const validated = validateQuestionTags(names, {
      questionNumber,
      format: "latex",
      optionCount: options.length,
    });
    flags = validated;
    for (const warning of validated.warnings) warnings.push(`${where}: ${warning}`);
  } catch (error) {
    // Collect error, continue with best-effort tags so every problem is reported
    errors.push(error instanceof Error ? error.message : String(error));
    flags = {
      fixed: names.includes("fixed"),
      fixedPosition: names.includes("fixed-position"),
      fixedOptions: names.includes("fixed-options"),
      pinnedOptions: [],
      separatePage: names.includes("separate-page"),
    };
  }

  // No answer tag means the first option is correct (A).
  let correctIndex = 0;
  if (correctLetter) {
    const index = correctLetter.charCodeAt(0) - 65;
    if (options.length === 0) {
      warnings.push(
        `${where}: ${correctSource} is ignored because this question has no options (open-ended).`
      );
    } else if (index >= options.length) {
      const last = String.fromCharCode(64 + options.length);
      errors.push(
        `${where}: the correct answer ${correctLetter} (${correctSource}) is out of range; ` +
          `this question has ${options.length} option${options.length === 1 ? "" : "s"} (A-${last}).`
      );
    } else {
      correctIndex = index;
    }
  }

  // Pinned options. Before v1.8, %{#fixed-options:X} also made X the answer, so a file from
  // then keeps that answer when it has no %{#correct:X}; every other pinned question without
  // one falls back to A, and a note says so.
  const pinned = flags.pinnedOptions;
  let inferredAnswer: string | undefined;
  if (pinned.length > 0) {
    if (!correctLetter) {
      if (pins.legacy && pinned.length === 1) {
        correctIndex = pinned[0];
        inferredAnswer = String.fromCharCode(65 + pinned[0]);
      } else {
        pins.missingAnswer.push(questionNumber);
      }
    }
    if (pins.legacy) pins.legacyEntries.push({ questionNumber, inferredAnswer });
  }

  const question: Omit<Question, "group" | "order"> = {
    text: questionText,
    choices: [options.map((text) => ({ text })), correctIndex, null],
    keepOnSeparatePage: flags.separatePage,
  };

  if (flags.fixed) question.fixed = true;
  if (flags.fixedPosition) question.fixedPosition = true;
  if (flags.fixedOptions) question.fixedOptions = true;
  if (pinned.length > 0) question.pinnedOptions = pinned;
  if (pinned.length > 0 && pins.legacy) {
    question.legacyPin = { answerFromLetter: inferredAnswer !== undefined };
  }

  return question;
}

export function parseLatexTemplate(content: string): ParsedLatexTemplate {
  // console.log("==== STARTING LATEX PARSING ====");
  // console.log("Parsing LaTeX template, content length:", content.length);
  const lines = content.split("\n");
  const result: ParsedLatexTemplate = {
    questions: [],
  };

  // console.log("Total lines to process:", lines.length);

  // Parse settings section
  const settingStart = lines.findIndex((line) => line.trim() === "%{#setting}");
  const settingEnd = lines.findIndex((line) => line.trim() === "%{/setting}");

  if (settingStart !== -1 && settingEnd !== -1) {
    const settingLines = lines.slice(settingStart + 1, settingEnd);
    const settings: Partial<ExamSettings> = {};

    for (const line of settingLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("%") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.substring(1).split("=");
        const value = valueParts.join("=").trim();
        const cleanKey = key.trim();

        if (cleanKey === "app_version") {
          // File metadata, not an exam setting
          result.appVersion = value;
        } else if (cleanKey === "numberofvestions") {
          assignSetting(settings, cleanKey as keyof ExamSettings, parseInt(value) || 1);
        } else if (
          cleanKey === "includeCoverPage" ||
          cleanKey === "includeAcademicIntegrityPledge"
        ) {
          assignSetting(
            settings,
            cleanKey as keyof ExamSettings,
            ["yes", "true", "1"].includes(value.toLowerCase())
          );
        } else {
          assignSetting(settings, cleanKey as keyof ExamSettings, value);
        }
      }
    }

    // Set dynamic seed if not present
    if (!settings.seed) {
      settings.seed = generateDynamicSeed({
        coursecode: settings.coursecode,
        examname: settings.examname,
        term: settings.term,
        examdate: settings.examdate,
      });
    }

    // Set default includeCoverPage if not present
    if (settings.includeCoverPage === undefined) {
      settings.includeCoverPage = true;
    }

    const defaults = getDefaultSettings();
    if (settings.includeAcademicIntegrityPledge === undefined) {
      settings.includeAcademicIntegrityPledge =
        defaults.includeAcademicIntegrityPledge;
    }
    if (settings.academicIntegrityPledgeText === undefined) {
      settings.academicIntegrityPledgeText =
        defaults.academicIntegrityPledgeText;
    }

    result.settings = settings;
  }

  // Parse preamble section
  const preambleStart = lines.findIndex(
    (line) => line.trim() === "%{#preamble}"
  );
  const preambleEnd = lines.findIndex((line) => line.trim() === "%{/preamble}");

  if (preambleStart !== -1 && preambleEnd !== -1) {
    const preambleLines = lines.slice(preambleStart + 1, preambleEnd);
    result.preamble = preambleLines.join("\n");
  }

  // Parse instructions section
  const instructionsStart = lines.findIndex(
    (line) => line.trim() === "%{#instructions}"
  );
  const instructionsEnd = lines.findIndex(
    (line) => line.trim() === "%{/instructions}"
  );

  if (instructionsStart !== -1 && instructionsEnd !== -1) {
    const instructionsLines = lines.slice(
      instructionsStart + 1,
      instructionsEnd
    );
    // Remove the % prefix from each line and join
    const instructions = instructionsLines
      .map((line) => (line.startsWith("%") ? line.substring(1) : line))
      .join("\n");

    if (result.settings) {
      result.settings.instructions = instructions;
    } else {
      result.settings = { instructions };
    }
  }

  // Parse questions with proper marker handling
  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];
  let currentTags: TagWithLocation[] = [];
  let enumerateDepth = 0;
  let inQuestionEnumerate = false;
  let inQuestionBlock = false;
  let inOptionBlock = false;
  let currentOptionText = "";
  const allValidationErrors: string[] = []; // Every tag problem, reported together
  const allWarnings: string[] = [];
  const fileVersion = readFileVersion(result.appVersion);
  const pins: PinState = {
    legacy: isFileBefore(fileVersion, PINNED_OPTIONS_VERSION),
    legacyEntries: [],
    missingAnswer: [],
  };
  // How many of currentTags were written up to the end of the current question's text.
  let tagsOwnedByCurrent = 0;

  // Save the question being built and reset the per-question state.
  const saveCurrentQuestion = () => {
    result.questions.push(
      createQuestionObject(
        currentQuestion ?? "",
        currentOptions,
        currentTags,
        result.questions.length + 1,
        allValidationErrors,
        allWarnings,
        pins
      )
    );
    currentQuestion = null;
    currentOptions = [];
    currentTags = [];
    tagsOwnedByCurrent = 0;
  };

  // console.log('Starting question parsing with', lines.length, 'lines');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("%{#q}")) logger.debug(`Line ${i + 1}: ${trimmed}`);
    // Skip LaTeX comment lines (but not our special markers that start with %)
    if (
      trimmed.startsWith("%") &&
      !trimmed.startsWith("%{") &&
      !inOptionBlock &&
      !inQuestionBlock
    ) {
      continue;
    }

    // Track enumerate depth
    if (trimmed.includes("\\begin{enumerate}")) {
      enumerateDepth++;
      // console.log(
      //   "Found enumerate begin, depth:",
      //   enumerateDepth,
      //   "at line:",
      //   i + 1
      // );
      if (enumerateDepth === 1) {
        inQuestionEnumerate = true;
      }
      continue;
    }

    if (trimmed.includes("\\end{enumerate}")) {
      // console.log(
      //   "Found enumerate end, depth was:",
      //   enumerateDepth,
      //   "at line:",
      //   i + 1
      // );

      // Save question when ending options enumerate
      if (
        enumerateDepth === 2 &&
        currentQuestion &&
        currentOptions.length >= 0
      ) {
        saveCurrentQuestion();
        inOptionBlock = false;
        currentOptionText = "";
      }

      // Save pending open-ended question when outer enumerate closes
      if (enumerateDepth === 1 && currentQuestion !== null) {
        saveCurrentQuestion();
      }

      enumerateDepth--;

      if (enumerateDepth === 0) {
        inQuestionEnumerate = false;
      }
      continue;
    }

    // Process both inside enumerate blocks and standalone question blocks
    const shouldProcess = inQuestionEnumerate || inQuestionBlock;

    // `content` is the line with any leading top-level \item (and tags) consumed.
    let content = trimmed;

    // A top-level \item starts the next question. Finish a pending open-ended question
    // first, so tags written after this \item belong to the NEW question (an open-ended
    // question has no options block to close it).
    if (
      enumerateDepth === 1 &&
      !inQuestionBlock &&
      !inOptionBlock
    ) {
      const itemMatch = trimmed.match(/^\\item(?![A-Za-z@])\s*/);
      if (itemMatch) {
        if (currentQuestion !== null) saveCurrentQuestion();
        content = trimmed.slice(itemMatch[0].length);
        if (content === "") continue;
      }
    }

    // Tag markers: %{#name} or %{#name:value}, one or more per line (q/o markers excluded)
    if (shouldProcess) {
      const tagLine = readTagLine(content);
      if (tagLine) {
        if ("error" in tagLine) {
          allValidationErrors.push(`Line ${i + 1}: ${tagLine.error}`);
          continue;
        }
        for (const tag of tagLine.tags) {
          currentTags.push({ ...tag, lineNumber: i + 1 });
        }
        if (tagLine.remainder === "") continue;
        content = tagLine.remainder; // a %{#q} on the same line as the tags
      }
    }

    // Handle question start marker (process even outside enumerate blocks)
    if (content.includes("%{#q}")) {
      // Save pending open-ended question inside enumerate before starting a new one.
      // Tags written after its text closed sit directly above this %{#q}: they are
      // the new question's, not the pending one's.
      if (inQuestionEnumerate && currentQuestion !== null) {
        const tagsForNewQuestion = currentTags.slice(tagsOwnedByCurrent);
        currentTags = currentTags.slice(0, tagsOwnedByCurrent);
        saveCurrentQuestion();
        currentTags = tagsForNewQuestion;
      }

      inQuestionBlock = true;

      // Check if question is on same line
      const sameLineMatch = content.match(/%\{#q\}(.*?)%\{\/q\}/);
      if (sameLineMatch) {
        currentQuestion = sameLineMatch[1].trim();
        inQuestionBlock = false;
        tagsOwnedByCurrent = currentTags.length;
      } else {
        // Extract any text after the opening tag
        const afterTag = content.replace("%{#q}", "").trim();
        currentQuestion = afterTag || "";
      }

      continue;
    }
    // Handle question end marker
    if (trimmed.includes("%{/q}") && inQuestionBlock) {
      // console.log("Found question end marker at line:", i + 1);
      const beforeTag = trimmed.replace("%{/q}", "").trim();
      if (beforeTag) {
        currentQuestion = currentQuestion
          ? currentQuestion + " " + beforeTag
          : beforeTag;
      }
      inQuestionBlock = false;
      tagsOwnedByCurrent = currentTags.length;

      // If not in enumerate block, save question immediately (for open-ended questions)
      if (!inQuestionEnumerate && currentQuestion !== null) {
        saveCurrentQuestion();
      }
      continue;
    }
    // ===== OPTION HANDLING (VERBATIM) =====

    // Start of an option (may be inline or start of multi-line block)
    if (currentQuestion && line.includes("%{#o}")) {
      const openTag = "%{#o}";
      const closeTag = "%{/o}";
      const startIdx = line.indexOf(openTag) + openTag.length;

      // Case 1: opening and closing on the SAME line
      const endIdxSame = line.indexOf(closeTag, startIdx);
      if (endIdxSame !== -1) {
        const exactInner = line.slice(startIdx, endIdxSame); // keep verbatim (no trim)
        currentOptions.push(exactInner);
        inOptionBlock = false;
      } else {
        // Case 2: multi-line block begins here
        inOptionBlock = true;
        currentOptionText = line.slice(startIdx); // remainder after %{#o}, verbatim
      }
      continue;
    }

    // Inside a multi-line option block
    if (inOptionBlock) {
      const closeTag = "%{/o}";
      const endIdx = line.indexOf(closeTag);

      if (endIdx !== -1) {
        // Found closing tag on this line; capture everything BEFORE it
        const beforeTagRaw = line.slice(0, endIdx); // verbatim
        if (currentOptionText === "") {
          currentOptionText = beforeTagRaw;
        } else {
          currentOptionText += "\n" + beforeTagRaw;
        }
        currentOptions.push(currentOptionText);
        currentOptionText = "";
        inOptionBlock = false;
      } else {
        // Regular line inside option block; append FULL line verbatim
        if (currentOptionText === "") {
          currentOptionText = line;
        } else {
          currentOptionText += "\n" + line;
        }
      }
      continue;
    }
    // Collect question text between markers (including LaTeX commands)
    if (inQuestionBlock && trimmed && !trimmed.startsWith("%{")) {
      currentQuestion = currentQuestion ? currentQuestion + "\n" + line : line;
      // console.log("Collecting question text:", trimmed);
      continue;
    }
  }

  // Save the last question if exists and complete
  if (currentQuestion !== null) {
    saveCurrentQuestion();
  }

  // File-level notes first, then per-question warnings, then the pinned-option summaries.
  const notes = getFileVersionNotes(fileVersion);
  if (pins.legacyEntries.length > 0) {
    notes.push(legacyPinNote(pins.legacyEntries, fileVersion));
  }
  allWarnings.unshift(...notes);
  if (pins.missingAnswer.length > 0) {
    allWarnings.push(missingAnswerPinNote(pins.missingAnswer));
  }
  // Questions whose answer came from a legacy tag are already covered by the legacy note.
  const inferred = new Set(
    pins.legacyEntries.filter((e) => e.inferredAnswer).map((e) => e.questionNumber)
  );
  const pinnedAnswers = findPinnedAnswerQuestions(result.questions).filter((n) => !inferred.has(n));
  if (pinnedAnswers.length > 0) {
    allWarnings.push(pinnedAnswerNote(pinnedAnswers));
  }
  if (allWarnings.length > 0) {
    result.warnings = allWarnings;
  }

  // console.log("==== PARSING COMPLETE ====");
  // console.log("Final question count:", result.questions.length);
  // console.log(
  //   "Questions:",
  //   result.questions.map((q, i) => `${i + 1}. "${q.text.substring(0, 50)}..."`)
  // );

  // Check for tag validation errors before returning
  if (allValidationErrors.length > 0) {
    const errorMessage =
      `Found ${allValidationErrors.length} tag validation error${
        allValidationErrors.length > 1 ? "s" : ""
      }:\n\n` +
      allValidationErrors.map((err, idx) => `${idx + 1}. ${err}`).join("\n\n");

    throw new Error(errorMessage);
  }

  return result;
}

function assignSetting(
  settings: Partial<ExamSettings>,
  key: keyof ExamSettings,
  value: ExamSettings[keyof ExamSettings]
): void {
  Object.assign(settings, { [key]: value });
}

export function validateParsedTemplate(parsed: ParsedLatexTemplate): string[] {
  const errors: string[] = [];

  if (parsed.questions.length === 0) {
    errors.push("No questions found in the template");
  }

  parsed.questions.forEach((question, index) => {
    if (!question.text.trim()) {
      errors.push(`Question ${index + 1} has empty text`);
    }

    if (question.choices[0].length > 5) {
      errors.push(
        `Question ${index + 1} cannot have more than 5 options, found ${
          question.choices[0].length
        }`
      );
    }

    question.choices[0].forEach((choice, choiceIndex) => {
      if (!choice.text.trim()) {
        errors.push(
          `Question ${index + 1}, option ${choiceIndex + 1} is empty`
        );
      }
    });
  });

  return errors;
}
