import { describe, expect, it } from "vitest";
import { parseCSV } from "../../parsers/csv-parser";
import { parseExcel } from "../../parsers/excel-parser";
import { convertToLatexFormat } from "../../parsers/adapter";
import { generateCSVTemplate } from "../../generators/csv-template";
import { generateExcelTemplate } from "../../generators/excel-template";
import { parseLatexTemplate } from "../parser";
import { generateLatexDocument, generateLatexTemplate } from "../latex";
import { mergeSettingsWithDefaults } from "../settings";
import { generateExamVersions } from "../versioning";
import { APP_VERSION, getTemplateVersion } from "../app-version";
import type { ExamData, ExamSettings, ParsedLatexTemplate, Question } from "../../types";

// A CSV exam whose answers are NOT all "A", with every lock tag, pinned options and an
// open-ended question.
const CSV = [
  "# settings",
  "groups,8",
  "numberofvestions,3",
  "seed,roundtrip-seed",
  "",
  "# questions",
  "Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags",
  '"Q1 plain, answer C","4","6","5","7","",C,',
  '"Q2 fixed-position, answer B","6","9","12","","",B,fixed-position',
  '"Q3 fixed-options, answer D","a","b","c","d","",D,fixed-options',
  '"Q4 fixed, answer B","x","y","z","","",B,fixed',
  '"Q5 open-ended","","","","","",,',
  '"Q6 plain, answer A","p","q","","","",A,',
  '"Q7 option E pinned, answer B","9","7","15","21","None",B,fixed-options:E',
  '"Q8 fixed-position + D and E pinned, answer A","2","4","6","All","None",A,"fixed-position, fixed-options:DE"',
].join("\n");

function toExam(template: ParsedLatexTemplate) {
  const settings = mergeSettingsWithDefaults(template.settings) as ExamSettings;
  const questions = template.questions.map((q, i) => ({ ...q, group: 1, order: i + 1 })) as Question[];
  const exam: ExamData = {
    name: "master",
    ordering: null,
    preamble: template.preamble || "",
    questions,
    kept_in_one_page: [],
  };
  return { settings, exam };
}

const signature = (q: Question) => ({
  options: q.choices[0].map((c) => c.text.trim()),
  correct: q.choices[1],
  fixed: Boolean(q.fixed),
  fixedPosition: Boolean(q.fixedPosition),
  fixedOptions: Boolean(q.fixedOptions),
  pinnedOptions: q.pinnedOptions ?? [],
  separatePage: q.keepOnSeparatePage,
});

/** Rows of the answer-key table: [Q, MASTER, ...versions] with the subscripts stripped. */
function answerKeyRows(content: string): string[][] {
  const start = content.indexOf("Q&MASTER");
  const table = content.slice(start, content.indexOf("\\end{tabular}", start));
  return table
    .split("\\\\")
    .slice(1)
    .map((row) => row.replace(/\\hline/g, "").trim())
    .filter(Boolean)
    .map((row) => row.split("&").map((cell) => cell.replace(/\\;.*$/, "").trim()));
}

describe("answer key", () => {
  const { settings, exam } = toExam(convertToLatexFormat(parseCSV(CSV)));
  const { versions, mappings } = generateExamVersions(exam.questions, settings, settings.seed!);
  const { content } = generateLatexDocument(settings, exam, versions, mappings);
  const rows = answerKeyRows(content);

  it("MASTER column shows each question's real answer, not 'A'", () => {
    expect(rows.map((r) => r[1])).toEqual(["C", "B", "D", "B", "--", "A", "B", "A"]);
  });

  it("version columns show a dash for an open-ended question instead of '@'", () => {
    expect(content).not.toMatch(/&@\\;/);
    for (const version of versions) {
      const at = version.questions.findIndex((q) => q.text.startsWith("Q5"));
      const column = versions.indexOf(version) + 2;
      expect(rows[at][column]).toBe("--");
    }
  });

  it("answer counts leave open-ended questions out", () => {
    const countsTable = content.slice(content.indexOf("V&A&B&C&D&E"));
    const firstRow = countsTable.split("\\\\")[1].replace(/\\hline/g, "").trim().split("&").map(Number);
    const [, ...letterCounts] = firstRow;
    expect(letterCounts.reduce((sum, n) => sum + n, 0)).toBe(7); // 8 questions, 1 open-ended
  });

  it("says which app version made the exam file", () => {
    expect(content.startsWith(`% Made with Examazej ${APP_VERSION}\n%{#setting}`)).toBe(true);
  });
});

describe("LaTeX template export", () => {
  const { settings, exam } = toExam(convertToLatexFormat(parseCSV(CSV)));
  const template = generateLatexTemplate(settings, exam, 3);
  // Active tag lines only (the template's commented-out examples start with "%").
  const activeTags = template
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^%\{#(fixed|correct|separate)/.test(line))
    .join("\n");

  it("writes the answer for every multiple-choice question and the canonical lock tags", () => {
    expect(activeTags.match(/%\{#correct:[A-E]\}/g)).toEqual([
      "%{#correct:C}",
      "%{#correct:B}",
      "%{#correct:D}",
      "%{#correct:B}",
      "%{#correct:A}",
      "%{#correct:B}",
      "%{#correct:A}",
    ]);
    expect(activeTags.match(/%\{#fixed[a-z-]*(?::[A-E]+)?\}/g)).toEqual([
      "%{#fixed-position}",
      "%{#fixed-options}",
      "%{#fixed}",
      "%{#fixed-options:E}",
      "%{#fixed-position}",
      "%{#fixed-options:DE}",
    ]);
  });

  it("stamps app_version, so the file is read by the v1.8 rules", () => {
    expect(template).toContain(`%\t\tapp_version=${getTemplateVersion()}\n`);
    expect(parseLatexTemplate(template).appVersion).toBe(getTemplateVersion());
  });

  it("teaches %{#fixed-options:E} with its current meaning in the examples", () => {
    expect(template).toMatch(/%% EXAMPLE 2c: One Option Kept in Place/);
    expect(template).toContain("% %{#fixed-options:E}\n% %{#correct:B}");
  });

  it("re-imports to the same questions, answers and locks, with no warnings", () => {
    const reparsed = parseLatexTemplate(template);
    expect(reparsed.warnings).toBeUndefined();
    expect(reparsed.questions.map((q) => signature(q as Question))).toEqual(
      exam.questions.map(signature)
    );
  });

  it("re-imports to the exact same versions for the same seed", () => {
    const original = generateExamVersions(exam.questions, settings, "same-seed");
    const reimported = toExam(parseLatexTemplate(template));
    const again = generateExamVersions(reimported.exam.questions, reimported.settings, "same-seed");
    expect(again.mappings).toEqual(original.mappings);
  });
});

describe("CSV / Excel template export", () => {
  const { settings, exam } = toExam(convertToLatexFormat(parseCSV(CSV)));

  it("CSV keeps every answer and lock through export and re-import", () => {
    const reparsed = parseCSV(generateCSVTemplate(settings, exam));
    expect(reparsed.warnings).toEqual([]);
    expect(reparsed.appVersion).toBe(getTemplateVersion());
    expect(reparsed.questions.map((q) => signature(q as Question))).toEqual(
      exam.questions.map(signature)
    );
  });

  it("Excel keeps every answer and lock through export and re-import", async () => {
    const blob = await generateExcelTemplate(settings, exam);
    const file = new File([blob], "roundtrip.xlsx", { type: blob.type });
    if (typeof file.arrayBuffer !== "function") {
      Object.defineProperty(file, "arrayBuffer", {
        value: () =>
          new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
          }),
      });
    }
    const reparsed = await parseExcel(file);
    expect(reparsed.warnings).toEqual([]);
    expect(reparsed.appVersion).toBe(getTemplateVersion());
    expect(reparsed.questions.map((q) => signature(q as Question))).toEqual(
      exam.questions.map(signature)
    );
  });
});
