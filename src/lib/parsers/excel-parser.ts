import ExcelJS from "exceljs";
import type { Question, ExamSettings } from "../types";
import { createLogger } from "../utils/logger";
import { validateQuestionTags } from "../utils/tag-validator";

const logger = createLogger("EXCEL_PARSER");

export interface ParsedExcelData {
  settings: Partial<ExamSettings>;
  instructions: string[];
  preamble: string;
  questions: Omit<Question, "group" | "order">[];
}

/**
 * Convert an ExcelJS worksheet into a 2D array (like sheet_to_json with header:1)
 */
function worksheetToArray(worksheet: ExcelJS.Worksheet): any[][] {
  const rows: any[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values: any[] = [];
    // ExcelJS row.values is 1-indexed (index 0 is undefined)
    for (let col = 1; col <= row.cellCount; col++) {
      const cell = row.getCell(col);
      values.push(cell.value ?? "");
    }
    rows.push(values);
  });
  return rows;
}

/**
 * Parse Excel file with sheets: Questions (required), Settings, Instructions, Preamble (optional)
 */
export async function parseExcel(file: File): Promise<ParsedExcelData> {
  logger.info("Starting Excel parsing", { filename: file.name });

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheetNames = workbook.worksheets.map((ws) => ws.name);

  logger.debug("Workbook loaded", {
    sheetNames,
  });

  // Check for required Questions sheet
  if (!sheetNames.some((name) => name.toLowerCase() === "questions")) {
    throw new Error(
      "Excel file must contain a 'Questions' sheet. Found sheets: " +
        sheetNames.join(", ")
    );
  }

  // Helper to find a worksheet by case-insensitive name
  const findSheet = (targetName: string): ExcelJS.Worksheet | undefined => {
    return workbook.worksheets.find(
      (ws) => ws.name.toLowerCase() === targetName.toLowerCase()
    );
  };

  // Parse each sheet
  const settingsSheet = findSheet("settings");
  const settings = settingsSheet ? parseSettingsSheet(settingsSheet) : {};

  const instructionsSheet = findSheet("instructions");
  const instructions = instructionsSheet
    ? parseInstructionsSheet(instructionsSheet)
    : [];

  const preambleSheet = findSheet("preamble");
  const preamble = preambleSheet ? parsePreambleSheet(preambleSheet) : "";

  const questionsSheet = findSheet("questions")!;
  const questions = parseQuestionsSheet(questionsSheet);

  logger.info("Excel parsing completed", {
    settingsCount: Object.keys(settings).length,
    instructionsCount: instructions.length,
    hasPreamble: !!preamble,
    questionsCount: questions.length,
  });

  return { settings, instructions, preamble, questions };
}

/**
 * Parse Settings sheet (2 columns: Key, Value)
 */
function parseSettingsSheet(
  worksheet: ExcelJS.Worksheet
): Partial<ExamSettings> {
  const data = worksheetToArray(worksheet);

  if (data.length < 2) {
    logger.warn("Settings sheet is empty or has no data rows");
    return {};
  }

  const settings: Partial<ExamSettings> = {};

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const key = String(row[0] || "").trim();
    const value = String(row[1] || "").trim();

    if (!key || !value) continue;

    // Validate key
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
      "seed",
    ];

    if (!validKeys.includes(key)) {
      throw new Error(
        `Settings sheet row ${i + 1}: Unknown setting key '${key}'. Valid keys: ${validKeys.join(", ")}`
      );
    }

    // Type conversion
    if (key === "numberofvestions") {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        throw new Error(
          `Settings sheet row ${i + 1}: 'numberofvestions' must be a number, got '${value}'`
        );
      }
      (settings as any)[key] = num;
    } else if (key === "includeCoverPage") {
      const boolValue =
        value.toLowerCase() === "yes" ||
        value.toLowerCase() === "true" ||
        value === "1";
      (settings as any)[key] = boolValue;
    } else if (key === "code_numbering") {
      if (!["ALPHA", "NUMERIC", "ROMAN"].includes(value)) {
        throw new Error(
          `Settings sheet row ${i + 1}: 'code_numbering' must be ALPHA, NUMERIC, or ROMAN, got '${value}'`
        );
      }
      (settings as any)[key] = value;
    } else if (key === "paper_size") {
      if (!["A4", "Letter"].includes(value)) {
        throw new Error(
          `Settings sheet row ${i + 1}: 'paper_size' must be A4 or Letter, got '${value}'`
        );
      }
      (settings as any)[key] = value;
    } else {
      (settings as any)[key] = value;
    }
  }

  logger.debug("Parsed settings from Excel", settings);
  return settings;
}

/**
 * Parse Instructions sheet (1 column: Instruction)
 */
function parseInstructionsSheet(worksheet: ExcelJS.Worksheet): string[] {
  const data = worksheetToArray(worksheet);

  if (data.length < 2) {
    logger.warn("Instructions sheet is empty or has no data rows");
    return [];
  }

  const instructions: string[] = [];

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 1) continue;

    const instruction = String(row[0] || "").trim();
    if (instruction) {
      instructions.push(instruction);
    }
  }

  logger.debug(`Parsed ${instructions.length} instructions from Excel`);
  return instructions;
}

/**
 * Parse Preamble sheet (1 column of LaTeX code)
 */
function parsePreambleSheet(worksheet: ExcelJS.Worksheet): string {
  const data = worksheetToArray(worksheet);

  if (data.length < 2) {
    logger.warn("Preamble sheet is empty or has no data rows");
    return "";
  }

  const preambleLines: string[] = [];

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 1) continue;

    const line = String(row[0] || "").trim();
    if (line) {
      preambleLines.push(line);
    }
  }

  const preamble = preambleLines.join("\n");
  logger.debug("Parsed preamble from Excel", {
    lineCount: preambleLines.length,
  });

  return preamble;
}

/**
 * Parse Questions sheet (table format)
 */
function parseQuestionsSheet(
  worksheet: ExcelJS.Worksheet
): Omit<Question, "group" | "order">[] {
  const data = worksheetToArray(worksheet);

  if (data.length < 2) {
    throw new Error("Questions sheet is empty or has no data rows");
  }

  // Parse header
  const headers = data[0].map((h: any) => String(h || "").trim());

  // Validate required columns
  const requiredColumns = ["Question Text", "Correct"];
  const missingColumns = requiredColumns.filter(
    (col) => !headers.some((h) => h.toLowerCase() === col.toLowerCase())
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Questions sheet is missing required columns: ${missingColumns.join(", ")}`
    );
  }

  // Find column indices
  const colIndices = {
    questionText: headers.findIndex(
      (h) => h.toLowerCase() === "question text"
    ),
    optionA: headers.findIndex((h) => h.toLowerCase() === "option a"),
    optionB: headers.findIndex((h) => h.toLowerCase() === "option b"),
    optionC: headers.findIndex((h) => h.toLowerCase() === "option c"),
    optionD: headers.findIndex((h) => h.toLowerCase() === "option d"),
    optionE: headers.findIndex((h) => h.toLowerCase() === "option e"),
    correct: headers.findIndex((h) => h.toLowerCase() === "correct"),
    tags: headers.findIndex((h) => h.toLowerCase() === "tags"),
  };

  const questions: Omit<Question, "group" | "order">[] = [];

  // Parse data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    try {
      const question = parseQuestionRow(row, colIndices, i + 1);
      questions.push(question);
    } catch (error) {
      throw new Error(
        `Questions sheet row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (questions.length === 0) {
    throw new Error("No valid questions found in Questions sheet");
  }

  logger.debug(`Parsed ${questions.length} questions from Excel`);
  return questions;
}

/**
 * Parse a single question row
 */
function parseQuestionRow(
  row: any[],
  colIndices: Record<string, number>,
  rowNumber: number
): Omit<Question, "group" | "order"> {
  const questionText = String(row[colIndices.questionText] || "").trim();
  if (!questionText) {
    throw new Error("Question text is empty");
  }

  // Parse options
  const options = [
    String(row[colIndices.optionA] || "").trim(),
    String(row[colIndices.optionB] || "").trim(),
    String(row[colIndices.optionC] || "").trim(),
    String(row[colIndices.optionD] || "").trim(),
    String(row[colIndices.optionE] || "").trim(),
  ].filter((opt) => opt !== "");

  // Parse correct answer
  const correctLetter = String(row[colIndices.correct] || "")
    .trim()
    .toUpperCase();
  let correctIndex = 0;

  if (options.length > 0) {
    if (!correctLetter) {
      throw new Error(
        "Question has options but no correct answer specified"
      );
    }

    correctIndex = correctLetter.charCodeAt(0) - 65; // A=0, B=1, etc.

    if (correctIndex < 0 || correctIndex >= options.length) {
      throw new Error(
        `Invalid correct answer '${correctLetter}'. Question has ${options.length} options (A-${String.fromCharCode(65 + options.length - 1)})`
      );
    }
  }

  // Parse and validate tags
  const tagsStr = String(row[colIndices.tags] || "").trim();
  const tagList = tagsStr
    ? tagsStr.split(",").map((t) => t.trim().toLowerCase())
    : [];

  // Validate tags using shared validator
  const validatedTags = validateQuestionTags(tagList, {
    questionNumber: rowNumber,
    format: 'excel',
  });

  return {
    text: questionText,
    choices: [options.map((text) => ({ text })), correctIndex, null],
    fixed: validatedTags.fixed,
    fixedOptions: validatedTags.fixedOptions,
    correctOptionLetter: validatedTags.fixedOptions ? correctLetter : undefined,
    keepOnSeparatePage: validatedTags.separatePage,
  };
}
