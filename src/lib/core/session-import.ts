/**
 * Reads a saved session (the Exam Package's `_session.json`).
 *
 * A session saved before v1.8 (no `app_version`) gets the same old-file rule as the template
 * readers: its `fixed` questions are marked `legacyFixed`, and the notes and the answer-key
 * warning follow from the marker (`import-notes.ts`). Old sessions hold no letter pins: v1.7
 * saved `%{#fixed-options:X}` as every option locked (`fixedOptions`), which 1.8 reads the same
 * way. A newer session keeps whatever markers it was saved with, so its warnings come back.
 */

import type { ExamJSON, ExamSettings, ImportInfo } from "../types";
import {
  describeFileVersion,
  FIXED_IN_PAREN_GROUP_VERSION,
  getFileVersionNotes,
  isFileBefore,
  readFileVersion,
} from "./app-version";
import { mergeSettingsWithDefaults } from "./settings";

export function importSessionJson(content: string): { examData: ExamJSON; info: ImportInfo } {
  const { app_version: appVersion, ...jsonData } = JSON.parse(content) as ExamJSON & {
    app_version?: string;
  };
  const fileVersion = readFileVersion(appVersion);
  const setting = mergeSettingsWithDefaults(jsonData.setting) as ExamSettings;
  const warnings = getFileVersionNotes(fileVersion);

  let questions = jsonData.exam.questions;
  if (isFileBefore(fileVersion, FIXED_IN_PAREN_GROUP_VERSION)) {
    questions = questions.map((q) => (q.fixed ? { ...q, legacyFixed: true } : q));
  }

  return {
    examData: { ...jsonData, setting, exam: { ...jsonData.exam, questions } },
    info: {
      warnings,
      madeWith: describeFileVersion(fileVersion),
      source: { format: "session", appVersion },
    },
  };
}
