import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { generateCSVTemplate } from "../../generators/csv-template";
import { generateExcelTemplate } from "../../generators/excel-template";
import { parseCSV } from "../../parsers/csv-parser";
import { parseExcel } from "../../parsers/excel-parser";
import type { ExamData, ExamSettings } from "../../types";

const customPledge = "Custom pledge, with punctuation, retained.";

const settings: ExamSettings = {
  university: "Test University",
  department: "Test Department",
  term: "Term 261",
  coursecode: "MATH 101",
  examname: "Major Exam I",
  examdate: "September 28, 2026",
  timeallowed: "90 Minutes",
  numberofvestions: 1,
  groups: "1",
  examtype: "MAJOR",
  code_name: "CODE",
  code_numbering: "NUMERIC",
  paper_size: "A4",
  instructions: "\\begin{enumerate}\n\\item Read each question.\n\\end{enumerate}",
  includeCoverPage: true,
  includeAcademicIntegrityPledge: false,
  academicIntegrityPledgeText: customPledge,
  seed: "pledge-test",
};

const exam: ExamData = {
  name: "master",
  ordering: null,
  preamble: "",
  questions: [
    {
      text: "What is one plus one?",
      choices: [[{ text: "Two" }, { text: "Three" }], 0, null],
      correctOptionLetter: "A",
      group: 1,
      order: 1,
      keepOnSeparatePage: false,
    },
  ],
  kept_in_one_page: [],
};

function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

function createExcelFile(blob: Blob): File {
  const file = new File([blob], "pledge-template.xlsx", { type: blob.type });

  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: () => readBlobAsArrayBuffer(file),
    });
  }

  return file;
}

async function createExcelFileWithNativePledgeVisibility(
  value: number | boolean
): Promise<File> {
  const generatedBlob = await generateExcelTemplate(settings, exam);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readBlobAsArrayBuffer(generatedBlob));

  const settingsSheet = workbook.getWorksheet("Settings");
  if (!settingsSheet) {
    throw new Error("Generated workbook has no Settings sheet");
  }

  let pledgeRowNumber: number | undefined;
  settingsSheet.eachRow((row, rowNumber) => {
    if (row.getCell(1).value === "includeAcademicIntegrityPledge") {
      pledgeRowNumber = rowNumber;
    }
  });

  if (pledgeRowNumber === undefined) {
    throw new Error("Generated workbook has no pledge visibility setting");
  }

  settingsSheet.getCell(`B${pledgeRowNumber}`).value = value;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: generatedBlob.type });
  return createExcelFile(blob);
}

describe("academic integrity pledge template formats", () => {
  it("round-trips pledge settings through CSV", () => {
    const csv = generateCSVTemplate(settings, exam);

    const parsed = parseCSV(csv);

    expect(parsed.settings.includeAcademicIntegrityPledge).toBe(false);
    expect(parsed.settings.academicIntegrityPledgeText).toBe(customPledge);
  });

  it("preserves settings and questions when CSV pledge text has an odd quote", () => {
    const pledgeWithQuote = 'I accept the 6" device rule.';
    const csv = generateCSVTemplate(
      { ...settings, academicIntegrityPledgeText: pledgeWithQuote },
      exam
    );

    const parsed = parseCSV(csv);

    expect(parsed.settings.academicIntegrityPledgeText).toBe(pledgeWithQuote);
    expect(parsed.settings.seed).toBe("pledge-test");
    expect(parsed.questions.length).toBeGreaterThanOrEqual(1);
  });

  it("round-trips pledge settings through Excel", async () => {
    const blob = await generateExcelTemplate(settings, exam);
    const file = createExcelFile(blob);

    const parsed = await parseExcel(file);

    expect(parsed.settings.includeAcademicIntegrityPledge).toBe(false);
    expect(parsed.settings.academicIntegrityPledgeText).toBe(customPledge);
  });

  it.each([0, false])(
    "parses native Excel pledge opt-out value %s as false",
    async (nativeValue) => {
      const file = await createExcelFileWithNativePledgeVisibility(nativeValue);

      const parsed = await parseExcel(file);

      expect(parsed.settings.includeAcademicIntegrityPledge).toBe(false);
    }
  );
});
