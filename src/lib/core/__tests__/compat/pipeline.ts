/**
 * Reads a compatibility fixture the way the Start page does, sets groups and seed the way the
 * Details page does, and generates the exam the way Results does. Records what a teacher gets:
 * the version mappings, the options mapping, the answers and (from 1.8.4 on) the LaTeX
 * documents.
 *
 * The same file runs against the code of earlier releases to record their output (see
 * `README.md` here), so it uses only what every release since 1.7.0 has, and finds the
 * modules that moved through `import.meta.glob`.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLatexTemplate } from "../../parser";
import { parseCSV } from "../../../parsers/csv-parser";
import { parseExcel } from "../../../parsers/excel-parser";
import * as adapter from "../../../parsers/adapter";
import { generateExamVersions, generateQuestionOptionMapping } from "../../versioning";
import * as latex from "../../latex";
import type { ExamJSON, ExamSettings, ParsedLatexTemplate, Question } from "../../../types";

type Module = Record<string, unknown>;
const optional = (modules: Record<string, unknown>): Module => (Object.values(modules)[0] as Module) ?? {};
const sessionModule = optional(import.meta.glob("../../session-import.ts", { eager: true }));
const settingsModule = optional(import.meta.glob("../../settings.ts", { eager: true }));

type Merge = (settings: Partial<ExamSettings>) => ExamSettings;
const mergeSettingsWithDefaults = (settingsModule.mergeSettingsWithDefaults ??
  (adapter as Module).mergeSettingsWithDefaults) as Merge;

export const FIXTURES = process.env.COMPAT_FIXTURES ?? join(__dirname, "..", "fixtures", "compat");

/** Files made before v1.8 (for Examazej 1.7) and files made by 1.8.4. */
export const OLD_FILES = ["old.tex", "old-layouts.tex", "old.csv", "old-xlsx.json", "old-session.json"];
export const NEW_FILES = ["new.tex", "new.csv", "new-xlsx.json", "new-session.json"];

/** Each file is generated with its own groups and with these (the last has no (n) group), each with these seeds. */
export const GROUP_SETTINGS = ["", "(3),3,1,[4],1", "[6],(5),1", "6,[5],1"];
export const SEEDS = ["alpha-1", "2026-final", "x9"];
export const VERSIONS = 4;

export interface Run {
  groups: string;
  seed: string;
  /** "A:3=7/BADC/B": in version A, question 3 is master question 7, options BADC, answer B. */
  mappings: string[];
  /** SHA-256 of `_options_mapping.csv`. */
  optionsMappingHash: string;
  /** The master's correct option index per question. */
  answers: number[];
  /** From 1.8.4 on: SHA-256 of `_mapping.csv`, of the exam document and of `_template.tex`. */
  mappingCsvHash?: string;
  documentHash?: string;
  templateHash?: string;
}

function createExamFromTemplate(template: ParsedLatexTemplate): ExamJSON {
  return {
    setting: mergeSettingsWithDefaults(template.settings),
    exam: {
      name: "master",
      ordering: null,
      preamble: template.preamble || "",
      questions: template.questions.map((q, index) => ({ ...q, group: 1, order: index + 1 })) as Question[],
      kept_in_one_page: [],
    },
    options_order: {},
  };
}

async function excelFile(name: string): Promise<File> {
  const { sheets } = JSON.parse(readFileSync(join(FIXTURES, name), "utf8")) as {
    sheets: Record<string, string[][]>;
  };
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  for (const [sheetName, rows] of Object.entries(sheets)) {
    const sheet = workbook.addWorksheet(sheetName);
    rows.forEach((row) => sheet.addRow(row));
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const file = new File([buffer], name.replace(".json", ".xlsx"));
  Object.defineProperty(file, "arrayBuffer", { value: async () => buffer });
  return file;
}

/** The exam as the Start page reads the fixture. */
export async function readFixture(name: string): Promise<ExamJSON> {
  if (name.endsWith(".tex")) return createExamFromTemplate(parseLatexTemplate(readFileSync(join(FIXTURES, name), "utf8")));
  if (name.endsWith(".csv")) {
    return createExamFromTemplate(adapter.convertToLatexFormat(parseCSV(readFileSync(join(FIXTURES, name), "utf8"))));
  }
  if (name.endsWith("-xlsx.json")) {
    return createExamFromTemplate(adapter.convertToLatexFormat(await parseExcel(await excelFile(name))));
  }
  const content = readFileSync(join(FIXTURES, name), "utf8");
  if (typeof sessionModule.importSessionJson === "function") {
    return (sessionModule.importSessionJson as (c: string) => { examData: ExamJSON })(content).examData;
  }
  // 1.7.0 read a session file directly.
  const json = JSON.parse(content) as ExamJSON;
  return { ...json, setting: mergeSettingsWithDefaults(json.setting) };
}

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

/** The parts of a document that name the app's version, or the old-file warning (worded per release). */
export function normalizeDocument(text: string): string {
  return text
    .replace(/Examazej \d+\.\d+\.\d+/g, "Examazej X")
    .replace(/%app_version=\S+/g, "%app_version=X")
    .replace(/\n?\\begin\{tcolorbox\}\[colback=red!6[\s\S]*?\\end\{tcolorbox\}\n\\vspace\{0\.5cm\}\n/g, "");
}

/** Generates the exam with these groups (empty: the file's own) and seed, as Details and Results do. */
export function generateRun(exam: ExamJSON, groups: string, seed: string, withDocuments: boolean): Run {
  const settings: ExamSettings = {
    ...exam.setting,
    groups: groups || exam.setting.groups,
    numberofvestions: VERSIONS,
    seed,
  };
  const questions = exam.exam.questions;
  const { versions, mappings } = generateExamVersions(questions, settings, seed);
  const state = { settings, questions, versions, mappings, seed };
  const run: Run = {
    groups: settings.groups,
    seed,
    mappings: mappings.map((m) => `${m.version}:${m.versionQNo}=${m.masterQNo}/${m.perm}/${m.correct}`),
    optionsMappingHash: sha(
      (generateQuestionOptionMapping(state, exam.exam) as unknown[][]).map((row) => row.join(",")).join("\n")
    ),
    answers: questions.map((q) => q.choices[1]),
  };
  if (withDocuments) {
    run.mappingCsvHash = sha(latex.generateMappingCSV(mappings));
    run.documentHash = sha(normalizeDocument(latex.generateLatexDocument(settings, exam.exam, versions, mappings, true).content));
    run.templateHash = sha(normalizeDocument(latex.generateLatexTemplate(settings, exam.exam, VERSIONS)));
  }
  return run;
}

export async function recordFiles(names: string[], withDocuments: boolean): Promise<Record<string, Run[]>> {
  const out: Record<string, Run[]> = {};
  for (const name of names) {
    const exam = await readFixture(name);
    out[name] = GROUP_SETTINGS.flatMap((groups) => SEEDS.map((seed) => generateRun(exam, groups, seed, withDocuments)));
  }
  return out;
}
