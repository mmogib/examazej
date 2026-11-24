/**
 * Records a release's output for the compatibility fixtures (see `README.md` here). Run from a
 * checkout of that release, never from the current code.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { FIXTURES, NEW_FILES, OLD_FILES, readFixture, recordFiles } from "./pipeline";

/** A session file as that release's Exam Package writes it (`{base}_session.json`). */
async function writeSession(from: string, to: string, appVersion: string | undefined) {
  const exam = await readFixture(from);
  const seed = `${to.replace(".json", "")}-seed`;
  const session = {
    ...exam,
    setting: { ...exam.setting, seed },
    ...(appVersion ? { app_version: appVersion } : {}),
    generation: { seed, versions: exam.setting.numberofvestions },
  };
  writeFileSync(join(FIXTURES, to), JSON.stringify(session, null, 2) + "\n");
}

export async function recordRelease(release: "1.7.0" | "1.8.4") {
  if (release === "1.7.0") {
    await writeSession("old.tex", "old-session.json", undefined);
    const runs = await recordFiles(OLD_FILES, false);
    writeFileSync(join(FIXTURES, "golden-1.7.0.json"), JSON.stringify({ release, runs }, null, 1) + "\n");
  } else {
    await writeSession("new.tex", "new-session.json", "1.8.4");
    const runs = await recordFiles([...OLD_FILES, ...NEW_FILES], true);
    writeFileSync(join(FIXTURES, "golden-1.8.4.json"), JSON.stringify({ release, runs }, null, 1) + "\n");
  }
}
