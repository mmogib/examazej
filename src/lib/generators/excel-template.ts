import * as XLSX from "xlsx";
import type { ExamData, ExamSettings } from "../types";
import { extractPlainInstructions } from "../parsers/adapter";
import { createLogger } from "../utils/logger";

const logger = createLogger("EXCEL_TEMPLATE_GENERATOR");

/**
 * Generates an Excel template file with 4 sheets and example data
 */
export function generateExcelTemplate(
  settings: ExamSettings,
  exam: ExamData
): Blob {
  logger.debug("Generating Excel template");

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Questions (REQUIRED)
  // Example format (Type column removed, tags used instead):
  // const questionsData = [
  //   [
  //     "Question Text",
  //     "Option A",
  //     "Option B",
  //     "Option C",
  //     "Option D",
  //     "Option E",
  //     "Correct",
  //     "Tags",
  //   ],
  //   ["What is $2 + 2$?", "3", "4", "5", "6", "", "B", ""],
  //   [
  //     "What is the derivative of $x^2$?",
  //     "$x$",
  //     "$2x$",
  //     "$x^2$",
  //     "$2$",
  //     "",
  //     "B",
  //     "",
  //   ],
  //   [
  //     "Calculate $\\int x \\, dx$",
  //     "$x$",
  //     "$x^2$",
  //     "$\\frac{x^2}{2} + C$",
  //     "$2x$",
  //     "",
  //     "C",
  //     "",
  //   ],
  //   [
  //     "Define the concept of a limit in calculus",
  //     "",
  //     "",
  //     "",
  //     "",
  //     "",
  //     "",
  //     "",  // Open-ended: no options, no tags needed
  //   ],
  //   [
  //     "This question will not shuffle positions",
  //     "Option 1",
  //     "Option 2",
  //     "Option 3",
  //     "",
  //     "",
  //     "A",
  //     "fixed",
  //   ],
  //   [
  //     "Question with fixed option order",
  //     "Answer A",
  //     "Answer B",
  //     "Answer C",
  //     "Answer D",
  //     "",
  //     "C",
  //     "fixed-options",
  //   ],
  //   [
  //     "Large question requiring full page (e.g., graph or diagram)",
  //     "See diagram",
  //     "Not diagram",
  //     "Wrong",
  //     "Also wrong",
  //     "",
  //     "A",
  //     "separate-page",
  //   ],
  //   ["True or false question", "True", "False", "", "", "", "A", ""],
  // ];
  const examQuestions = exam.questions.map((q) => {
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

    return [
      q.text,
      options[0],
      options[1],
      options[2],
      options[3],
      options[4],
      correct,
      tagsStr,
    ];
  });
  const questionsData = [
    [
      "Question Text",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Option E",
      "Correct",
      "Tags",
    ],
    ...examQuestions,
  ];
  const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
  XLSX.utils.book_append_sheet(workbook, questionsSheet, "Questions");

  // Sheet 2: Settings (OPTIONAL)
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
  const settingsSheet = XLSX.utils.aoa_to_sheet(settingsData);
  XLSX.utils.book_append_sheet(workbook, settingsSheet, "Settings");

  // Sheet 3: Instructions (OPTIONAL)
  const instructionsLines = extractPlainInstructions(settings.instructions);
  const instructionsData = [
    ["Instruction"],
    ...instructionsLines.map((line) => [line]),
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  // Sheet 4: Preamble (OPTIONAL)
  const preambleData = [
    ["LaTeX Preamble"],
    ["% Add custom LaTeX packages and commands here"],
    ["% Example: \\usepackage{tikz}"],
    ["% Example: \\usepackage{amsmath}"],
    ["% Example: \\newcommand{\\R}{\\mathbb{R}}"],
    [""],
  ];
  const preambleSheet = XLSX.utils.aoa_to_sheet(preambleData);
  XLSX.utils.book_append_sheet(workbook, preambleSheet, "Preamble");

  // Generate blob
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  logger.info("Excel template generated", { size: blob.size });
  return blob;
}
