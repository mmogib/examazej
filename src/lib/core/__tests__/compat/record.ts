/**
 * Records 1.8.4's output for the compatibility fixtures (see `README.md` here). Run from a
 * checkout of v1.8.4, never from the current code. `old-session.json` stays as it is: it was
 * written by 1.7.0's code, as a session saved by an older Examazej.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { FIXTURES, NEW_FILES, OLD_FILES, readFixture, recordFiles } from "./pipeline";

/** A session file as 1.8.4's Exam Package writes it (`{base}_session.json`). */
async function writeSession(from: string, to: string, appVersion: string) {
  const exam = await readFixture(from);
  const seed = `${to.replace(".json", "")}-seed`;
  const session = {
    ...exam,
    setting: { ...exam.setting, seed },
    app_version: appVersion,
    generation: { seed, versions: exam.setting.numberofvestions },
  };
  writeFileSync(join(FIXTURES, to), JSON.stringify(session, null, 2) + "\n");
}

export async function recordRelease(release: "1.8.4") {
  await writeSession("new.tex", "new-session.json", release);
  const runs = await recordFiles([...OLD_FILES, ...NEW_FILES], true);
  writeFileSync(join(FIXTURES, "golden-1.8.4.json"), JSON.stringify({ release, runs }, null, 1) + "\n");
}
