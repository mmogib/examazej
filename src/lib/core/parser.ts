// LaTeX template parser for the Exam Generator

import { ParsedLatexTemplate, ExamSettings, Question } from "../types";
import { generateDynamicSeed } from "../utils/seed-generator";
import { validateQuestionTags, QuestionTags } from "../utils/tag-validator";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("PARSER");

/**
 * Tag with its source line number for better error messages
 */
interface TagWithLocation {
  tag: string;
  lineNumber: number;
}

/**
 * Create a question object from current parsing state
 * Validates tags and collects errors without throwing immediately
 *
 * @param questionText - The question text
 * @param options - Array of option texts
 * @param tags - Array of tags with their line numbers
 * @param correctLetter - Correct answer letter (for fixed-options)
 * @param questionNumber - Question number (1-indexed)
 * @param errors - Output array to collect validation errors
 * @returns Question object (may have invalid tags if errors occurred)
 */
function createQuestionObject(
  questionText: string,
  options: string[],
  tags: TagWithLocation[],
  correctLetter: string | undefined,
  questionNumber: number,
  errors: string[]
): any {
  // Validate tags (catch errors instead of throwing)
  let validatedTags: QuestionTags;

  try {
    const tagNames = tags.map((t) => t.tag);
    const firstTagLine = tags.length > 0 ? tags[0].lineNumber : undefined;

    validatedTags = validateQuestionTags(tagNames, {
      questionNumber,
      lineNumber: firstTagLine,
    });
  } catch (error) {
    // Collect error, continue with best-effort tags
    errors.push(error instanceof Error ? error.message : String(error));

    // Best-effort: apply tags without validation (allows parsing to continue)
    const tagNames = tags.map((t) => t.tag);
    validatedTags = {
      fixed: tagNames.includes("fixed"),
      fixedOptions: tagNames.includes("fixed-options"),
      separatePage: tagNames.includes("separate-page"),
    };
  }

  // Create question object
  const question: any = {
    text: questionText,
    choices: [
      options.map((text) => ({ text })),
      correctLetter ? correctLetter.charCodeAt(0) - 65 : 0,
      null,
    ],
    keepOnSeparatePage: validatedTags.separatePage,
  };

  if (validatedTags.fixed) {
    question.fixed = true;
  }
  if (validatedTags.fixedOptions) {
    question.fixedOptions = true;
    question.correctOptionLetter = correctLetter;
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

        if (cleanKey === "numberofvestions") {
          (settings as any)[cleanKey] = parseInt(value) || 1;
        } else if (cleanKey === "includeCoverPage") {
          // Convert string to boolean: missing or "yes" = true, "no" = false
          (settings as any)[cleanKey] = value.toLowerCase() !== "no";
        } else {
          (settings as any)[cleanKey] = value;
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
  let currentTags: TagWithLocation[] = []; // NEW: Track tags with line numbers
  let currentCorrectLetter: string | undefined;
  let enumerateDepth = 0;
  let inQuestionEnumerate = false;
  let inQuestionBlock = false;
  let inOptionBlock = false;
  let currentOptionText = "";
  const allValidationErrors: string[] = []; // NEW: Collect all tag validation errors

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
        // console.log("🔥 SAVING QUESTION FROM ENUMERATE END:", {
        //   questionText: currentQuestion,
        //   optionsCount: currentOptions.length,
        //   questionNumber: result.questions.length + 1,
        //   line: i + 1,
        // });

        const question = createQuestionObject(
          currentQuestion,
          currentOptions,
          currentTags,
          currentCorrectLetter,
          result.questions.length + 1,
          allValidationErrors
        );

        result.questions.push(question);
        // console.log(
        //   "✅ Question saved! Total questions now:",
        //   result.questions.length
        // );

        // Reset state for next question
        currentQuestion = null;
        currentOptions = [];
        currentTags = [];
        currentCorrectLetter = undefined;
        inOptionBlock = false;
        currentOptionText = "";
      }

      enumerateDepth--;

      if (enumerateDepth === 0) {
        inQuestionEnumerate = false;
      }
      continue;
    }

    // Process both inside enumerate blocks and standalone question blocks
    const shouldProcess = inQuestionEnumerate || inQuestionBlock;

    // Generic tag detection: matches %{#tag-name} or %{#tag-name:value}
    // Excludes question/option markers (q, o) to prevent conflicts
    if (shouldProcess) {
      // Match pattern: %{#tag-name} or %{#tag-name:value}
      // Negative lookahead (?!q\}|o\}|/q\}|/o\}) prevents matching question/option markers
      const tagMatch = trimmed.match(/^%\{#(?!q\}|o\}|\/q\}|\/o\})([\w-]+)(?::([A-E]))?\}$/);

      if (tagMatch) {
        const tagName = tagMatch[1]; // e.g., "fixed", "fixed-options", "separate-page"
        const tagValue = tagMatch[2]; // e.g., "B" for fixed-options:B

        // console.log("Found tag marker at line:", i + 1, "tag:", tagName);

        // Special handling for fixed-options (needs correct letter)
        if (tagName === "fixed-options") {
          if (tagValue) {
            currentTags.push({ tag: tagName, lineNumber: i + 1 });
            currentCorrectLetter = tagValue;
          } else {
            // Invalid format: fixed-options without letter - collect error
            allValidationErrors.push(
              `Line ${i + 1}: 'fixed-options' tag requires a correct answer letter (e.g., %{#fixed-options:B})`
            );
          }
        } else {
          // All other tags
          currentTags.push({ tag: tagName, lineNumber: i + 1 });
        }

        continue;
      }
    }
    // Handle question start marker (process even outside enumerate blocks)

    if (trimmed.includes("%{#q}")) {
      // console.log("Found question start marker at line:", i + 1);

      inQuestionBlock = true;

      // Check if question is on same line
      const sameLineMatch = trimmed.match(/%\{#q\}(.*?)%\{\/q\}/);
      if (sameLineMatch) {
        currentQuestion = sameLineMatch[1].trim();
        // console.log("Found complete inline question:", currentQuestion);
        inQuestionBlock = false;
      } else {
        // Extract any text after the opening tag
        const afterTag = trimmed.replace("%{#q}", "").trim();
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
      // console.log("Complete question text:", currentQuestion);
      inQuestionBlock = false;

      // If not in enumerate block, save question immediately (for open-ended questions)
      if (!inQuestionEnumerate && currentQuestion !== null) {
        // console.log("🔥 SAVING OPEN-ENDED QUESTION:", {
        //   questionText: currentQuestion,
        //   questionNumber: result.questions.length + 1,
        //   line: i + 1,
        // });

        const question = createQuestionObject(
          currentQuestion,
          currentOptions, // Empty array for open-ended
          currentTags,
          currentCorrectLetter,
          result.questions.length + 1,
          allValidationErrors
        );

        result.questions.push(question);
        // console.log(
        //   "✅ Open-ended question saved! Total questions now:",
        //   result.questions.length
        // );

        // Reset state for next question
        currentQuestion = null;
        currentOptions = [];
        currentTags = [];
        currentCorrectLetter = undefined;
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
    // console.log("🔥 SAVING FINAL QUESTION:", {
    //   questionText: currentQuestion,
    //   optionsCount: currentOptions.length,
    //   questionNumber: result.questions.length + 1,
    // });

    const question = createQuestionObject(
      currentQuestion,
      currentOptions,
      currentTags,
      currentCorrectLetter,
      result.questions.length + 1,
      allValidationErrors
    );

    result.questions.push(question);
    // console.log(
    //   "✅ Final question saved! Total questions now:",
    //   result.questions.length
    // );
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
