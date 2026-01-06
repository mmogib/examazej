import type { ParsedLatexTemplate, ExamSettings, Question } from "../types";
import type { ParsedCSVData } from "./csv-parser";
import type { ParsedExcelData } from "./excel-parser";
import { getDefaultSettings } from "../core/settings";
import { createLogger } from "../utils/logger";

const logger = createLogger("PARSER_ADAPTER");

/**
 * Extracts plain instruction lines from LaTeX-formatted instructions
 * Strips \begin{enumerate}, \begin{normalsize}, \item, etc.
 * Returns array of plain instruction text
 */
export function extractPlainInstructions(latexInstructions: string): string[] {
  const lines = latexInstructions.split("\n");
  const plainInstructions: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that start with \item
    if (trimmed.startsWith("\\item")) {
      // Remove \item and any leading/trailing whitespace
      const instruction = trimmed.replace(/^\\item\s*/, "").trim();
      if (instruction) {
        plainInstructions.push(instruction);
      }
    }
  }

  logger.debug("Extracted plain instructions", {
    count: plainInstructions.length,
  });

  return plainInstructions;
}

/**
 * Converts parsed CSV/Excel data to the format matching LaTeX parser output
 * This allows CSV/Excel to plug into the existing exam generation flow
 */
export function convertToLatexFormat(
  parsed: ParsedCSVData | ParsedExcelData
): ParsedLatexTemplate {
  logger.debug("Converting parsed data to LaTeX format");

  // Merge instructions into settings if present
  const settings: Partial<ExamSettings> = { ...parsed.settings };

  if (parsed.instructions.length > 0) {
    // CSV/Excel has instructions - wrap them in LaTeX enumerate/normalsize environments
    const items = parsed.instructions
      .map((line) => `        \\item ${line}`)
      .join("\n");
    settings.instructions = `\\begin{enumerate}
    \\begin{normalsize}
${items}
    \\end{normalsize}
\\end{enumerate}`;
    logger.debug("Instructions wrapped in LaTeX environments", {
      instructionCount: parsed.instructions.length,
    });
  } else {
    // No instructions provided - use default instructions
    const defaults = getDefaultSettings();
    settings.instructions = defaults.instructions;
    logger.debug("Using default instructions");
  }

  const result: ParsedLatexTemplate = {
    settings,
    questions: parsed.questions,
    preamble: parsed.preamble || "",
  };

  logger.debug("Conversion complete", {
    hasSettings: Object.keys(settings).length > 0,
    hasInstructions: !!settings.instructions,
    hasPreamble: !!result.preamble,
    questionCount: result.questions.length,
  });

  return result;
}

/**
 * Validates that groups configuration matches question count
 */
export function validateGroupsMatchQuestions(
  groups: string,
  questionCount: number
): void {
  const groupSizes = groups.split(",").map((g) => {
    const trimmed = g.trim();
    // Remove parentheses and square brackets if present
    const cleaned = trimmed.replace(/[\(\)\[\]]/g, "");
    return parseInt(cleaned, 10);
  });

  const sum = groupSizes.reduce((acc, size) => acc + size, 0);

  if (sum !== questionCount) {
    throw new Error(
      `Groups configuration mismatch: groups sum to ${sum} (${groups}) but file has ${questionCount} questions`
    );
  }

  logger.debug("Groups validation passed", { groups, questionCount });
}
