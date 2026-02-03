import ExcelJS from "exceljs";
import type { ExamData, ExamSettings } from "../types";
import { extractPlainInstructions } from "../parsers/adapter";
import { createLogger } from "../utils/logger";

const logger = createLogger("EXCEL_TEMPLATE_GENERATOR");

/**
 * Generates an Excel template file with 4 sheets and example data
 */
export async function generateExcelTemplate(
  settings: ExamSettings,
  exam: ExamData
): Promise<Blob> {
  logger.debug("Generating Excel template");

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Questions (REQUIRED)
  const questionsSheet = workbook.addWorksheet("Questions");
  const questionsHeader = [
    "Question Text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option E",
    "Correct",
    "Tags",
  ];
  questionsSheet.addRow(questionsHeader);

  for (const q of exam.questions) {
    const options = q.choices[0].map((choice) => choice.text);
    while (options.length < 5) {
      options.push("");
    }
    const correct = q.correctOptionLetter || "A";

    // Build tags array from question properties
    const tags: string[] = [];
    if (q.fixed) {
      tags.push("fixed");
    }
    if (q.fixedOptions) {
      tags.push("fixed-options");
    }
    if (q.keepOnSeparatePage) {
      tags.push("separate-page");
    }
    const tagsStr = tags.join(", ");

    questionsSheet.addRow([
      q.text,
      options[0],
      options[1],
      options[2],
      options[3],
      options[4],
      correct,
      tagsStr,
    ]);
  }

  // Sheet 2: Settings (OPTIONAL)
  const settingsSheet = workbook.addWorksheet("Settings");
  const settingsData = [
    ["Key", "Value"],
    ["university", settings.university],
    ["department", settings.department],
    ["term", settings.term],
    ["coursecode", settings.coursecode],
    ["examname", settings.examname],
    ["examdate", settings.examdate],
    ["timeallowed", settings.timeallowed],
    ["numberofvestions", settings.numberofvestions.toString()],
    ["groups", settings.groups],
    ["code_name", settings.code_name],
    ["code_numbering", settings.code_numbering],
    ["paper_size", settings.paper_size],
    ["includeCoverPage", settings.includeCoverPage ? "yes" : "no"],
    ["seed", settings.seed ? settings.seed.toString() : ""],
  ];
  for (const row of settingsData) {
    settingsSheet.addRow(row);
  }

  // Sheet 3: Instructions (OPTIONAL)
  const instructionsSheet = workbook.addWorksheet("Instructions");
  const instructionsLines = extractPlainInstructions(settings.instructions);
  instructionsSheet.addRow(["Instruction"]);
  for (const line of instructionsLines) {
    instructionsSheet.addRow([line]);
  }

  // Sheet 4: Preamble (OPTIONAL)
  const preambleSheet = workbook.addWorksheet("Preamble");
  const preambleRows = [
    ["LaTeX Preamble"],
    ["% Add custom LaTeX packages and commands here"],
    ["% Example: \\usepackage{tikz}"],
    ["% Example: \\usepackage{amsmath}"],
    ["% Example: \\newcommand{\\R}{\\mathbb{R}}"],
    [""],
  ];
  for (const row of preambleRows) {
    preambleSheet.addRow(row);
  }

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  logger.info("Excel template generated", { size: blob.size });
  return blob;
}
