/**
 * The files of the Exam Package (the zip that Results downloads), built from the generated
 * versions. Kept apart from the page so the round trip of an edited exam can be tested on
 * exactly the files a user downloads.
 */

import type { ExamJSON, GenerationState } from "../types";
import { getTemplateVersion } from "./app-version";
import { generateLatexDocument, generateLatexTemplate, generateMappingCSV } from "./latex";
import { generateQuestionOptionMapping } from "./versioning";

export interface ExamPackageFiles {
  /** `{base}.tex`: every version and the answer keys. */
  latex: string;
  /** `{base}_template.tex`: the master as a current-version template. */
  template: string;
  /** `{base}_mapping.csv` */
  mapping: string;
  /** `{base}_options_mapping.csv` */
  optionsMapping: string;
  /** `{base}_session.json` */
  session: string;
}

export function buildExamPackage(
  examData: ExamJSON,
  state: GenerationState,
  allowTrustedTex: boolean,
  generatedAt: Date = new Date()
): ExamPackageFiles {
  const { content: latex } = generateLatexDocument(
    state.settings,
    examData.exam,
    state.versions,
    state.mappings,
    allowTrustedTex
  );
  const template = generateLatexTemplate(state.settings, examData.exam, state.versions.length);
  const mapping = generateMappingCSV(state.mappings);
  const optionsMapping = generateQuestionOptionMapping(state, examData.exam)
    .map((row) => row.join(","))
    .join("\n");
  const sessionData = {
    ...examData,
    app_version: getTemplateVersion(),
    generation: {
      seed: state.seed,
      generated_at: generatedAt.toISOString(),
      versions: state.versions.length,
      complete_state: {
        settings: state.settings,
        questions: state.questions,
        versions: state.versions,
        mappings: state.mappings,
        seed: state.seed,
      },
    },
  };
  return { latex, template, mapping, optionsMapping, session: JSON.stringify(sessionData, null, 2) };
}
