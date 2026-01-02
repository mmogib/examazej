import type { ExamData, ExamSettings } from "../types";
import { extractPlainInstructions } from "../parsers/adapter";
import { createLogger } from "../utils/logger";

const logger = createLogger("CSV_TEMPLATE_GENERATOR");

// Convert real newlines inside quoted fields to literal "\n".
// This version assumes your CSV rows are otherwise on one line (i.e., you're targeting multiline fields only).
function convertMultilineFieldsToEscapedNewlines(csvText) {
  // Replace CRLF and LF that occur inside quotes.
  // Strategy: scan character-by-character and only replace newlines when inQuotes = true.
  let out = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];

    if (ch === '"') {
      // Handle escaped quotes "" inside quoted fields
      const next = csvText[i + 1];
      if (inQuotes && next === '"') {
        out += '""';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
        out += '"';
      }
      continue;
    }

    // If we're inside a quoted field, convert real newlines to literal \n
    if (inQuotes) {
      if (ch === "\r" && csvText[i + 1] === "\n") {
        out += "\\n";
        i++; // skip \n
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
    }

    out += ch;
  }

  return out;
}

/**
 * Generates a CSV template file with example data and all 4 sections
 */
export function generateCSVTemplate(
  settings: ExamSettings,
  exam: ExamData
): string {
  logger.debug("Generating CSV template");

  let template = `# settings
university,${settings.university}
department,${settings.department}
term,${settings.term}
coursecode,${settings.coursecode}
examname,${settings.examname}
examdate,${settings.examdate}
timeallowed,${settings.timeallowed}
numberofvestions,${settings.numberofvestions}
groups,${settings.groups}
code_name,${settings.code_name}
code_numbering,${settings.code_numbering}
paper_size,${settings.paper_size}
includeCoverPage,${settings.includeCoverPage ? "yes" : "no"}
seed,${settings.seed}

# instructions
${extractPlainInstructions(settings.instructions).join("\n")}

# preamble
% Add custom LaTeX packages and commands here
% Example: \\usepackage{tikz}
% Example: \\newcommand{\\R}{\\mathbb{R}}

# questions
Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Type,Tags
`;
  let questionExamples = ``;
  exam.questions.forEach((q) => {
    const options = q.choices[0].map((choice) => choice.text);
    while (options.length < 5) {
      options.push("");
    }
    const correct = q.correctOptionLetter || "A";
    const type = q.fixed ? "fixed" : "regular";
    questionExamples += `"${q.text}","${options[0]}","${options[1]}","${options[2]}","${options[3]}","${options[4]}","${correct}","${type}"\n`;
  });
  template += questionExamples;

  logger.info("CSV template generated");
  return convertMultilineFieldsToEscapedNewlines(template);
}
