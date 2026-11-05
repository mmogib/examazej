import type { Question, ExamSettings } from "../types";
import { unescapeNewlines } from "../utils";
import { createLogger } from "../utils/logger";
import { formatRowErrors, validateQuestionTags } from "../utils/tag-validator";

const logger = createLogger("CSV_PARSER");

export interface ParsedCSVData {
  settings: Partial<ExamSettings>;
  instructions: string[];
  preamble: string;
  questions: Omit<Question, "group" | "order">[];
  /** Non-blocking problems found while reading the file. */
  warnings?: string[];
  /** The `app_version` setting as written (file metadata, not an exam setting). */
  appVersion?: string;
}

/**
 * Parse CSV with sections: # settings, # instructions, # preamble, # questions
 */
export function parseCSV(content: string): ParsedCSVData {
  logger.info("Starting CSV parsing");

  const lines = content.split("\n").map((line) => line.trim());
  const sections = splitIntoSections(lines);

  const meta: { appVersion?: string } = {};
  const settings = sections.settings
    ? parseSettingsSection(sections.settings, meta)
    : {};

  const instructions = sections.instructions
    ? parseInstructionsSection(sections.instructions)
    : [];

  const preamble = sections.preamble
    ? parsePreambleSection(sections.preamble)
    : "";

  if (!sections.questions || sections.questions.length === 0) {
    throw new Error(
      "Questions section is required. Add '# questions' section with question data."
    );
  }

  const warnings: string[] = [];
  const questions = parseQuestionsSection(
    sections.questions,
    warnings,
    sections.questionLineNumbers ?? []
  );

  logger.info("CSV parsing completed", {
    settingsCount: Object.keys(settings).length,
    instructionsCount: instructions.length,
    hasPreamble: !!preamble,
    questionsCount: questions.length,
  });

  return { settings, instructions, preamble, questions, warnings, appVersion: meta.appVersion };
}

/**
 * Split CSV into sections based on # markers
 */
function splitIntoSections(lines: string[]): {
  settings?: string[];
  instructions?: string[];
  preamble?: string[];
  questions?: string[];
  /** The file line (1-based) of each line in `questions`, for messages. */
  questionLineNumbers?: number[];
} {
  const sections: Record<string, string[]> = {};
  const lineNumbers: Record<string, number[]> = {};
  let currentSection: string | null = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line || line.trim() === "") continue;

    // Check for section marker
    if (line.startsWith("#")) {
      const sectionName = line
        .slice(1)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      currentSection = sectionName;
      sections[sectionName] = [];
      lineNumbers[sectionName] = [];
      logger.debug(`Found section: ${sectionName}`);
    } else if (currentSection) {
      sections[currentSection].push(line);
      lineNumbers[currentSection].push(index + 1);
    }
  }

  return {
    settings: sections.settings,
    instructions: sections.instructions,
    preamble: sections.preamble,
    questions: sections.questions,
    questionLineNumbers: lineNumbers.questions,
  };
}

/**
 * Parse settings section (key,value pairs)
 */
function parseSettingsSection(
  lines: string[],
  meta: { appVersion?: string }
): Partial<ExamSettings> {
  const settings: Partial<ExamSettings> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commaIndex = line.indexOf(",");

    if (commaIndex === -1) {
      logger.warn(`Settings line ${i + 1} has no comma, skipping: ${line}`);
      continue;
    }

    const key = line.slice(0, commaIndex).trim();
    const value = line.slice(commaIndex + 1).trim();

    if (!key) {
      logger.warn(`Settings line ${i + 1} has empty key, skipping`);
      continue;
    }

    if (key === "app_version") {
      meta.appVersion = value;
      continue;
    }

    // Validate key is a valid ExamSettings property
    const validKeys = [
      "university",
      "department",
      "term",
      "coursecode",
      "examname",
      "examdate",
      "timeallowed",
      "numberofvestions",
      "groups",
      "examtype",
      "code_name",
      "code_numbering",
      "paper_size",
      "includeCoverPage",
      "includeAcademicIntegrityPledge",
      "academicIntegrityPledgeText",
      "seed",
    ];

    if (!validKeys.includes(key)) {
      throw new Error(
        `Settings line ${
          i + 1
        }: Unknown setting key '${key}'. Valid keys: ${validKeys.join(", ")}`
      );
    }

    // Type conversion
    if (key === "numberofvestions") {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        throw new Error(
          `Settings line ${
            i + 1
          }: 'numberofvestions' must be a number, got '${value}'`
        );
      }
      assignSetting(settings, key as keyof ExamSettings, num);
    } else if (
      key === "includeCoverPage" ||
      key === "includeAcademicIntegrityPledge"
    ) {
      const boolValue =
        value.toLowerCase() === "yes" ||
        value.toLowerCase() === "true" ||
        value === "1";
      assignSetting(settings, key as keyof ExamSettings, boolValue);
    } else if (key === "code_numbering") {
      if (!["ALPHA", "NUMERIC", "ROMAN"].includes(value)) {
        throw new Error(
          `Settings line ${
            i + 1
          }: 'code_numbering' must be ALPHA, NUMERIC, or ROMAN, got '${value}'`
        );
      }
      assignSetting(settings, key as keyof ExamSettings, value);
    } else if (key === "paper_size") {
      if (!["A4", "Letter"].includes(value)) {
        throw new Error(
          `Settings line ${
            i + 1
          }: 'paper_size' must be A4 or Letter, got '${value}'`
        );
      }
      assignSetting(settings, key as keyof ExamSettings, value);
    } else {
      assignSetting(settings, key as keyof ExamSettings, value);
    }
  }

  logger.debug("Parsed settings", settings);
  return settings;
}

function assignSetting(
  settings: Partial<ExamSettings>,
  key: keyof ExamSettings,
  value: ExamSettings[keyof ExamSettings]
): void {
  Object.assign(settings, { [key]: value });
}

/**
 * Parse instructions section (full lines, ignore delimiters)
 */
function parseInstructionsSection(lines: string[]): string[] {
  return lines.filter((line) => line.trim() !== "");
}

/**
 * Parse preamble section (full lines, joined with newlines)
 */
function parsePreambleSection(lines: string[]): string {
  return lines.filter((line) => line.trim() !== "").join("\n");
}

/**
 * Parse questions section (CSV table)
 */
function parseQuestionsSection(
  lines: string[],
  warnings: string[],
  lineNumbers: number[]
): Omit<Question, "group" | "order">[] {
  if (lines.length === 0) {
    throw new Error("Questions section is empty");
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Validate required columns
  const requiredColumns = ["Question Text", "Correct"];
  const missingColumns = requiredColumns.filter(
    (col) => !headers.some((h) => h.toLowerCase() === col.toLowerCase())
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Questions table is missing required columns: ${missingColumns.join(
        ", "
      )}`
    );
  }

  // Find column indices
  const colIndices = {
    questionText: headers.findIndex((h) => h.toLowerCase() === "question text"),
    optionA: headers.findIndex((h) => h.toLowerCase() === "option a"),
    optionB: headers.findIndex((h) => h.toLowerCase() === "option b"),
    optionC: headers.findIndex((h) => h.toLowerCase() === "option c"),
    optionD: headers.findIndex((h) => h.toLowerCase() === "option d"),
    optionE: headers.findIndex((h) => h.toLowerCase() === "option e"),
    correct: headers.findIndex((h) => h.toLowerCase() === "correct"),
    tags: headers.findIndex((h) => h.toLowerCase() === "tags"),
  };

  const questions: Omit<Question, "group" | "order">[] = [];

  // Parse data rows. Every bad row is reported together, so one upload shows all problems.
  const errors: string[] = [];
  let questionNumber = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === "") continue;
    questionNumber++;
    const location = lineNumbers[i]
      ? `Question ${questionNumber} (line ${lineNumbers[i]})`
      : `Question ${questionNumber}`;

    try {
      const question = parseQuestionRow(line, colIndices, location, warnings);
      questions.push(question);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (errors.length > 0) {
    throw new Error(formatRowErrors(errors));
  }

  if (questions.length === 0) {
    throw new Error("No valid questions found in questions section");
  }

  logger.debug(`Parsed ${questions.length} questions`);
  return questions;
}

/**
 * Parse a CSV line respecting quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse a single question row
 */
function parseQuestionRow(
  line: string,
  colIndices: Record<string, number>,
  location: string,
  warnings: string[]
): Omit<Question, "group" | "order"> {
  const cells = parseCSVLine(line);

  const questionText = cells[colIndices.questionText]?.trim();
  if (!questionText) {
    throw new Error(`${location}: Question text is empty`);
  }

  // Parse options
  const options = [
    cells[colIndices.optionA]?.trim(),
    cells[colIndices.optionB]?.trim(),
    cells[colIndices.optionC]?.trim(),
    cells[colIndices.optionD]?.trim(),
    cells[colIndices.optionE]?.trim(),
  ].filter((opt) => opt && opt !== "");

  // Parse correct answer
  const correctLetter = cells[colIndices.correct]?.trim().toUpperCase();
  let correctIndex = 0;

  if (options.length > 0) {
    if (!correctLetter) {
      throw new Error(`${location}: Question has options but no correct answer specified`);
    }

    correctIndex = correctLetter.charCodeAt(0) - 65; // A=0, B=1, etc.

    if (correctIndex < 0 || correctIndex >= options.length) {
      throw new Error(
        `${location}: Invalid correct answer '${correctLetter}'. Question has ${
          options.length
        } options (A-${String.fromCharCode(65 + options.length - 1)})`
      );
    }
  }

  // Parse and validate tags
  const tagsStr = cells[colIndices.tags]?.trim() || "";
  const tagList = tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [];

  // Validate tags using shared validator (any case; messages quote them as written)
  const validatedTags = validateQuestionTags(tagList, {
    location,
    format: 'csv',
    optionCount: options.length,
  });
  for (const warning of validatedTags.warnings) {
    warnings.push(`${location}: ${warning}`);
  }

  return {
    text: unescapeNewlines(questionText),
    choices: [
      options.map((text) => ({ text: unescapeNewlines(text) })),
      correctIndex,
      null,
    ],
    fixed: validatedTags.fixed,
    fixedPosition: validatedTags.fixedPosition,
    fixedOptions: validatedTags.fixedOptions,
    ...(validatedTags.pinnedOptions.length > 0 && {
      pinnedOptions: validatedTags.pinnedOptions,
    }),
    keepOnSeparatePage: validatedTags.separatePage,
  };
}
