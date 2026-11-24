/**
 * Reads a saved session (the Exam Package's `_session.json`). Its questions keep the markers
 * they were saved with (`legacyPin`, `answerAssumed`, `answerChecked`), so their notes come back.
 * Markers that 1.8 and the 1.9 development builds wrote for remaking old exams (`legacyFixed`,
 * `legacyRead`) mean nothing any more and are dropped.
 */

import type { ExamJSON, ExamSettings, ImportInfo, Question } from "../types";
import { describeFileVersion, getFileVersionNotes, readFileVersion } from "./app-version";
import { mergeSettingsWithDefaults } from "./settings";

export function importSessionJson(content: string): { examData: ExamJSON; info: ImportInfo } {
  const { app_version: appVersion, ...jsonData } = JSON.parse(content) as ExamJSON & {
    app_version?: string;
  };
  const fileVersion = readFileVersion(appVersion);
  const setting = mergeSettingsWithDefaults(jsonData.setting) as ExamSettings;
  const warnings = getFileVersionNotes(fileVersion);

  const questions = jsonData.exam.questions.map((question) => {
    const { legacyFixed: _legacyFixed, legacyRead: _legacyRead, ...kept } = question as Question & {
      legacyFixed?: unknown;
      legacyRead?: unknown;
    };
    return kept as Question;
  });

  return {
    examData: { ...jsonData, setting, exam: { ...jsonData.exam, questions } },
    info: {
      warnings,
      madeWith: describeFileVersion(fileVersion),
      source: { format: "session", appVersion },
    },
  };
}
