import { describe, expect, it } from "vitest";
import { generateMappingCSV } from "../latex";
import { OLDER_EXAM_MAPPING_PROMPT } from "../older-exam-prompt";
import { generateVersionLabel } from "../versioning";

/** The AI prompt in the Documentation that turns an old exam PDF into the Regrade Tool's mapping file. */
describe("the prompt for an old exam's mapping file", () => {
  it("asks for exactly the columns of _mapping.csv", () => {
    const header = generateMappingCSV([]).split("\n")[0];
    expect(header).toBe("Group,Master Q#,Version,Version Q#,Permutation,Correct,Points");
    expect(OLDER_EXAM_MAPPING_PROMPT).toContain(`\n${header}\n`);
  });

  it("keeps every version's name as printed, whichever numbering the exam used", () => {
    // The three numberings Examazej prints (and old releases printed) as version names.
    expect([0, 1].map((i) => generateVersionLabel(i, "ALPHA"))).toEqual(["A", "B"]);
    expect([0, 1].map((i) => generateVersionLabel(i, "NUMERIC"))).toEqual(["1", "2"]);
    expect([0, 1].map((i) => generateVersionLabel(i, "ROMAN"))).toEqual(["I", "II"]);
    expect(OLDER_EXAM_MAPPING_PROMPT).toContain("the version's name exactly as printed in the PDF");
    expect(OLDER_EXAM_MAPPING_PROMPT).toContain("a letter\n  (A), a number (1) or a Roman numeral (II). Do not rename it.");
    expect(OLDER_EXAM_MAPPING_PROMPT).not.toMatch(/version letter/i);
  });

  it("does not let the assistant guess an option it cannot match", () => {
    expect(OLDER_EXAM_MAPPING_PROMPT).toContain("do\nnot guess: leave that Permutation empty and list the question and version");
    expect(OLDER_EXAM_MAPPING_PROMPT).toContain("Check every row against the answer key page");
  });
});
