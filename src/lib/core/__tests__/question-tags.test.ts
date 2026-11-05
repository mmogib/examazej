import { describe, expect, it } from "vitest";
import { parseLatexTemplate } from "../parser";
import { parseCSV } from "../../parsers/csv-parser";
import { convertToLatexFormat } from "../../parsers/adapter";
import { parseExcel } from "../../parsers/excel-parser";
import { validateQuestionTags } from "../../utils/tag-validator";
import {
  describeFileVersion,
  getTemplateVersion,
  isFileBefore,
  PINNED_OPTIONS_VERSION,
  readFileVersion,
} from "../app-version";

/**
 * Question tag model:
 *   %{#fixed}            position + option order locked (unchanged meaning)
 *   %{#fixed-position}   position only (options still shuffle)
 *   %{#fixed-options}    option order only
 *   %{#fixed-options:DE} options D and E keep their letter; the others shuffle
 *   %{#correct:X}        correct answer (LaTeX); absent = A
 * Files without app_version (made before v1.8) read %{#fixed-options:X} with no %{#correct:}
 * as "X is the answer", as v1.7 did.
 */

const BEGIN = "\\begin{enumerate}";
const END = "\\end{enumerate}";

/** A multiple-choice question block: `\item`, tag lines, %{#q}, then `optionCount` options. */
function mcq(text: string, tagLines: string[] = [], optionCount = 3): string[] {
  return [
    "\\item",
    ...tagLines,
    `%{#q}${text}%{/q}`,
    BEGIN,
    ...Array.from({ length: optionCount }, (_, i) => `\\item %{#o}opt${i}%{/o}`),
    END,
  ];
}

function openEnded(text: string, tagLines: string[] = []): string[] {
  return ["\\item", ...tagLines, `%{#q}${text}%{/q}`];
}

function doc(...blocks: string[][]): string {
  return [BEGIN, ...blocks.flat(), END].join("\n");
}

/** A document whose setting block carries `app_version` (as every v1.8+ template does). */
function docV(version: string, ...blocks: string[][]): string {
  return ["%{#setting}", `%app_version=${version}`, "%{/setting}", doc(...blocks)].join("\n");
}

describe("validateQuestionTags (shared by LaTeX, CSV, Excel)", () => {
  it("reads the three independent lock tags", () => {
    expect(validateQuestionTags(["fixed-position"])).toMatchObject({
      fixed: false,
      fixedPosition: true,
      fixedOptions: false,
      warnings: [],
    });
    expect(validateQuestionTags(["fixed-position", "fixed-options"])).toMatchObject({
      fixedPosition: true,
      fixedOptions: true,
      warnings: [],
    });
  });

  it("warns about tags that 'fixed' already implies, and normalizes them away", () => {
    const result = validateQuestionTags(["fixed", "fixed-options", "fixed-position"]);
    expect(result).toMatchObject({ fixed: true, fixedPosition: false, fixedOptions: false });
    expect(result.warnings).toHaveLength(2);
  });

  it("ignores fixed-options on an open-ended question, with a warning", () => {
    const result = validateQuestionTags(["fixed-options"], { optionCount: 0 });
    expect(result.fixedOptions).toBe(false);
    expect(result.warnings[0]).toMatch(/ignored because this question has no options/);
  });

  it("is case-insensitive and rejects unknown tags", () => {
    expect(validateQuestionTags(["FIXED-Position"]).fixedPosition).toBe(true);
    expect(() => validateQuestionTags(["bonus"])).toThrow(/Invalid tag: bonus/);
  });

  it("points CSV/Excel users at the Correct column for correct:X", () => {
    expect(() => validateQuestionTags(["correct:b"], { format: "excel" })).toThrow(
      /correct answer goes in the Correct column/
    );
    expect(() => validateQuestionTags(["correct:b"], { format: "csv" })).toThrow(
      /correct answer goes in the Correct column/
    );
  });
});

describe("validateQuestionTags: fixed-options:X keeps options in place", () => {
  it("reads letters written together, in any case, merging repeats", () => {
    const result = validateQuestionTags(["fixed-options:ed", "Fixed-Options:D"], { optionCount: 5 });
    expect(result).toMatchObject({ fixedOptions: false, pinnedOptions: [3, 4], warnings: [] });
  });

  it("rejects anything but letters A-E written together", () => {
    for (const tag of ["fixed-options:d,e", "fixed-options:", "fixed-options:F", "fixed-options:D E"]) {
      expect(() => validateQuestionTags([tag]), tag).toThrow(/needs option letters A-E written together/);
    }
  });

  it("quotes the tag as written, in LaTeX too", () => {
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#fixed-options:F}"], 5)))).toThrow(
      "Question 1: 'fixed-options:F' needs option letters A-E"
    );
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#fixed-options:D,E}"], 5)))).toThrow(
      "'fixed-options:D,E' needs option letters"
    );
  });

  it("explains CSV's comma-split 'fixed-options:D,E' instead of only rejecting 'e'", () => {
    expect(() => validateQuestionTags(["fixed-options:d", "e"], { format: "csv" })).toThrow(
      /write the letters together, e\.g\. 'fixed-options:DE'/
    );
  });

  it("rejects a letter beyond the question's options", () => {
    expect(() => validateQuestionTags(["fixed-options:e"], { optionCount: 3 })).toThrow(
      /'fixed-options:E' keeps option E in place, but this question has 3 options \(A-C\)/
    );
  });

  it("is redundant next to fixed or plain fixed-options (a warning, pins dropped)", () => {
    for (const lock of ["fixed", "fixed-options"]) {
      const result = validateQuestionTags([lock, "fixed-options:e"], { optionCount: 5 });
      expect(result.pinnedOptions, lock).toEqual([]);
      expect(result.warnings[0], lock).toMatch(/already keeps every option in place, so 'fixed-options:E' is redundant/);
    }
  });

  it("combines with fixed-position", () => {
    const result = validateQuestionTags(["fixed-position", "fixed-options:e"], { optionCount: 5 });
    expect(result).toMatchObject({ fixedPosition: true, pinnedOptions: [4], warnings: [] });
  });

  it("is ignored on an open-ended question, with a warning", () => {
    const result = validateQuestionTags(["fixed-options:a"], { optionCount: 0 });
    expect(result.pinnedOptions).toEqual([]);
    expect(result.warnings[0]).toMatch(/'fixed-options:A' is ignored because this question has no options/);
  });

  it("notes when the pins leave nothing to shuffle", () => {
    const result = validateQuestionTags(["fixed-options:abc"], { optionCount: 4 });
    expect(result.pinnedOptions).toEqual([0, 1, 2]);
    expect(result.warnings[0]).toMatch(/leaves no options to shuffle/);
  });
});

describe("LaTeX: %{#correct:X}", () => {
  it("sets the answer without locking anything", () => {
    const result = parseLatexTemplate(doc(mcq("Q", ["%{#correct:C}"])));
    const q = result.questions[0];
    expect(q.choices[1]).toBe(2);
    expect(q.fixed).toBeFalsy();
    expect(q.fixedOptions).toBeFalsy();
    expect(result.warnings).toBeUndefined();
  });

  it("defaults to A when absent", () => {
    expect(parseLatexTemplate(doc(mcq("Q"))).questions[0].choices[1]).toBe(0);
  });

  it("combines with fixed, so a locked question can have any answer", () => {
    const q = parseLatexTemplate(doc(mcq("Q", ["%{#fixed}", "%{#correct:B}"]))).questions[0];
    expect(q.fixed).toBe(true);
    expect(q.choices[1]).toBe(1);
  });

  it("accepts a lowercase letter and a capitalised tag name", () => {
    const q = parseLatexTemplate(doc(mcq("Q", ["%{#Correct:b}"]))).questions[0];
    expect(q.choices[1]).toBe(1);
  });

  it("rejects a letter beyond the question's options", () => {
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#correct:E}"], 3)))).toThrow(
      /correct answer E .* out of range; this question has 3 options \(A-C\)/
    );
  });

  it("rejects something that is not a single letter A-E", () => {
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#correct:F}"])))).toThrow(/not an answer letter/);
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#correct:BB}"])))).toThrow(/not an answer letter/);
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#correct}"])))).toThrow(/needs a letter/);
  });

  it("rejects contradicting answers", () => {
    expect(() =>
      parseLatexTemplate(doc(mcq("Q", ["%{#correct:B}", "%{#correct:C}"])))
    ).toThrow(/conflicting correct answers B .* and C/);
  });

  it("ignores the answer on an open-ended question, with a warning", () => {
    const result = parseLatexTemplate(doc(openEnded("Essay", ["%{#correct:B}"])));
    expect(result.questions[0].choices[1]).toBe(0);
    expect(result.warnings?.[0]).toMatch(/Question 1: %\{#correct:B\} is ignored .*\(open-ended\)/);
  });
});

describe("LaTeX: lock tags", () => {
  it("fixed-position locks the position only", () => {
    const q = parseLatexTemplate(doc(mcq("Q", ["%{#fixed-position}"]))).questions[0];
    expect(q.fixedPosition).toBe(true);
    expect(q.fixed).toBeFalsy();
    expect(q.fixedOptions).toBeFalsy();
  });

  it("fixed-options on an open-ended question is ignored, with a warning", () => {
    const result = parseLatexTemplate(doc(openEnded("Essay", ["%{#fixed-options}"])));
    expect(result.questions[0].fixedOptions).toBeFalsy();
    expect(result.warnings?.[0]).toMatch(/'fixed-options' is ignored/);
  });

  it("a value on a tag that takes none is an error", () => {
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#fixed:B}"])))).toThrow(
      /%\{#fixed\} does not take a value/
    );
  });
});

describe("LaTeX: %{#fixed-options:X} in a v1.8+ file", () => {
  it("keeps only the named options in place, with the answer from %{#correct:X}", () => {
    const result = parseLatexTemplate(
      docV("1.8.0", mcq("Q", ["%{#fixed-options:E}", "%{#correct:B}"], 5))
    );
    const q = result.questions[0];
    expect(q.pinnedOptions).toEqual([4]);
    expect(q.fixedOptions).toBeFalsy();
    expect(q.choices[1]).toBe(1);
    expect(result.warnings).toBeUndefined();
    expect(result.appVersion).toBe("1.8.0");
    expect(result.settings).not.toHaveProperty("app_version");
  });

  it("accepts several letters, and combines with fixed-position", () => {
    const q = parseLatexTemplate(
      docV("1.8.0", mcq("Q", ["%{#fixed-position} %{#fixed-options:de}", "%{#correct:A}"], 5))
    ).questions[0];
    expect(q).toMatchObject({ fixedPosition: true, pinnedOptions: [3, 4] });
  });

  it("without %{#correct:X} the answer is A, and a note says so", () => {
    const result = parseLatexTemplate(
      docV("1.8.0", mcq("Q1", ["%{#fixed-options:E}"], 5), mcq("Q2"), mcq("Q3", ["%{#fixed-options:C}"]))
    );
    expect(result.questions[0].choices[1]).toBe(0);
    expect(result.questions[2].choices[1]).toBe(0);
    expect(result.warnings).toEqual([
      expect.stringMatching(/^Questions 1 and 3 pin an option .* have no %\{#correct:X\} tag, so the answer is A/),
    ]);
  });

  it("notes, once, every question whose answer is a pinned option", () => {
    const result = parseLatexTemplate(
      docV(
        "1.8.0",
        mcq("Q1", ["%{#fixed-options:E}", "%{#correct:E}"], 5),
        mcq("Q2", ["%{#fixed-options:E}", "%{#correct:A}"], 5),
        mcq("Q3", ["%{#fixed-options:CD}", "%{#correct:D}"], 4)
      )
    );
    expect(result.warnings).toEqual([
      "In Questions 1 and 3 the correct answer is a pinned option, so it has the same letter in every version.",
    ]);
  });

  it("rejects a letter beyond the question's options", () => {
    expect(() => parseLatexTemplate(docV("1.8.0", mcq("Q", ["%{#fixed-options:E}", "%{#correct:A}"], 3)))).toThrow(
      /keeps option E in place, but this question has 3 options/
    );
  });
});

describe("LaTeX: %{#fixed-options:X} in a file from before v1.8", () => {
  it("still pins X, and takes the answer from X when there is no %{#correct:X}", () => {
    for (const tag of ["%{#fixed-options:B}", "%{#fixed-options:b}", "%{#Fixed-Options:B}"]) {
      const result = parseLatexTemplate(doc(mcq("Q", [tag])));
      const q = result.questions[0];
      expect(q.pinnedOptions, tag).toEqual([1]);
      expect(q.fixedOptions, tag).toBeFalsy();
      expect(q.choices[1], tag).toBe(1);
      expect(result.warnings, tag).toHaveLength(1);
    }
  });

  it("explains the change in one note listing every question and the answers it assumed", () => {
    const result = parseLatexTemplate(
      doc(mcq("Q1", ["%{#fixed-options:B}"]), mcq("Q2"), mcq("Q3", ["%{#fixed-options:C}"]))
    );
    expect(result.warnings).toHaveLength(1);
    const note = result.warnings?.[0] ?? "";
    expect(note).toMatch(/^Questions 1 and 3 use %\{#fixed-options:X\}, which changed meaning in v1\.8/);
    expect(note).toContain("This file has no app_version");
    expect(note).toContain("Q1 B, Q3 C.");
    expect(note).toContain("differs from the versions made before v1.8 with the same seed, in all questions");
    expect(note).toContain(
      "make the same exams again by replacing %{#fixed-options:X} with %{#fixed-options} and %{#correct:X} in these questions"
    );
  });

  it("marks the questions so the answer key page can warn", () => {
    const result = parseLatexTemplate(
      doc(mcq("Q1", ["%{#fixed-options:B}"]), mcq("Q2"), mcq("Q3", ["%{#fixed-options:C}", "%{#correct:A}"]))
    );
    expect(result.questions.map((q) => q.legacyPin)).toEqual([
      { answerFromLetter: true },
      undefined,
      { answerFromLetter: false },
    ]);
  });

  it("does not mark pins in a v1.8 file", () => {
    const result = parseLatexTemplate(docV("1.8.0", mcq("Q", ["%{#fixed-options:B}", "%{#correct:B}"])));
    expect(result.questions[0].pinnedOptions).toEqual([1]);
    expect(result.questions[0].legacyPin).toBeUndefined();
  });

  it("the suggested replacement reads as the v1.7 meaning, with no notes", () => {
    // %{#fixed-options} + %{#correct:X} gives exactly the flags v1.7 gave %{#fixed-options:X},
    // so (with the v1.7.0 output pinned in versioning-flags.test.ts) it makes the same exams.
    const result = parseLatexTemplate(doc(mcq("Q", ["%{#fixed-options}", "%{#correct:B}"])));
    const q = result.questions[0];
    expect(q.fixedOptions).toBe(true);
    expect(q.choices[1]).toBe(1);
    expect(q.pinnedOptions).toBeUndefined();
    expect(q.legacyPin).toBeUndefined();
    expect(result.warnings ?? []).toEqual([]);
  });

  it("names the version when the file is stamped with an older one", () => {
    const result = parseLatexTemplate(docV("1.7.0", mcq("Q", ["%{#fixed-options:C}"])));
    expect(result.questions[0].choices[1]).toBe(2);
    expect(result.warnings?.[0]).toContain("This file was made with Examazej 1.7.0");
  });

  it("uses %{#correct:X} when present, and still explains the new meaning", () => {
    const result = parseLatexTemplate(doc(mcq("Q", ["%{#fixed-options:C}", "%{#correct:A}"])));
    expect(result.questions[0].choices[1]).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings?.[0]).toMatch(/^Question 1 uses %\{#fixed-options:X\}/);
    expect(result.warnings?.[0]).not.toContain("the answer was taken from the letter");
  });

  it("several pinned letters with no %{#correct:X} fall back to A, with a note", () => {
    const result = parseLatexTemplate(doc(mcq("Q", ["%{#fixed-options:BC}"], 4)));
    expect(result.questions[0].choices[1]).toBe(0);
    expect(result.warnings).toEqual([
      expect.stringMatching(/^Question 1 uses %\{#fixed-options:X\}/),
      expect.stringMatching(/^Question 1 pins an option .* so the answer is A/),
    ]);
  });

  it("still rejects an out-of-range letter", () => {
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#fixed-options:E}"], 3)))).toThrow(
      /keeps option E in place, but this question has 3 options/
    );
  });
});

describe("%{#fixed} inside a (n) group in a file from before v1.8", () => {
  const groups = (g: string, ...blocks: string[][]) =>
    ["%{#setting}", `%groups=${g}`, "%{/setting}", doc(...blocks)].join("\n");

  it("marks fixed questions and explains the change for those in (n) groups only", () => {
    const result = parseLatexTemplate(
      groups("2,(2)", mcq("Q1", ["%{#fixed}"]), mcq("Q2"), mcq("Q3", ["%{#fixed}"]), mcq("Q4"))
    );
    expect(result.questions.map((q) => q.legacyFixed)).toEqual([true, undefined, true, undefined]);
    expect(result.warnings).toHaveLength(1);
    const note = result.warnings?.[0] ?? "";
    expect(note).toMatch(/^Question 3 is %\{#fixed\} inside a \(n\) group\. Before v1\.8 the options/);
    expect(note).toContain("This file has no app_version");
    expect(note).toContain("using %{#fixed-position} instead of %{#fixed} in this question");
  });

  it("says nothing for a v1.8 file", () => {
    const result = parseLatexTemplate(
      ["%{#setting}", "%app_version=1.8.0", "%groups=(2)", "%{/setting}", doc(mcq("Q1", ["%{#fixed}"]), mcq("Q2"))].join("\n")
    );
    expect(result.questions[0].legacyFixed).toBeUndefined();
    expect(result.warnings ?? []).toEqual([]);
  });

  it("CSV: the same note, in Tags-column words", () => {
    const csv = [
      "# settings", "groups,(2)", "",
      "# questions",
      "Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags",
      '"Q1","a","b","c","","",A,fixed',
      '"Q2","a","b","c","","",B,',
    ].join("\n");
    const result = convertToLatexFormat(parseCSV(csv));
    expect(result.questions[0].legacyFixed).toBe(true);
    expect(result.warnings?.[0]).toMatch(/^Question 1 is 'fixed' inside a \(n\) group/);
    expect(result.warnings?.[0]).toContain("using 'fixed-position' instead of 'fixed'");
    expect(result.warnings?.[0]).toContain("add an app_version row with 1.8.0 to the settings");
    const stamped = convertToLatexFormat(parseCSV(csv.replace("# settings", "# settings\napp_version,1.8.0")));
    expect(stamped.questions[0].legacyFixed).toBeUndefined();
    expect(stamped.warnings ?? []).toEqual([]);
  });
});

describe("app_version stamp", () => {
  it("reads an unreadable stamp as a file from before v1.8, with a note", () => {
    const result = parseLatexTemplate(docV("soon", mcq("Q", ["%{#fixed-options:B}"])));
    expect(result.questions[0].choices[1]).toBe(1);
    expect(result.warnings?.[0]).toMatch(/app_version "soon" is not a version number/);
  });

  it("warns about a file from a newer app", () => {
    const result = parseLatexTemplate(docV("9.0.0", mcq("Q")));
    expect(result.warnings).toEqual([
      expect.stringMatching(/^This file was made with Examazej 9\.0\.0, which is newer than this app/),
    ]);
  });

  it("templates are stamped with a version that uses the v1.8 rules", () => {
    expect(isFileBefore(readFileVersion(getTemplateVersion()), PINNED_OPTIONS_VERSION)).toBe(false);
    expect(isFileBefore(readFileVersion(undefined), PINNED_OPTIONS_VERSION)).toBe(true);
    expect(isFileBefore(readFileVersion("1.7.9"), PINNED_OPTIONS_VERSION)).toBe(true);
    expect(isFileBefore(readFileVersion("1.8"), PINNED_OPTIONS_VERSION)).toBe(false);
  });

  it("describes where a file came from for the Details page", () => {
    expect(describeFileVersion(readFileVersion("1.8.0"))).toBe("Examazej 1.8.0");
    expect(describeFileVersion(readFileVersion(undefined))).toBe("Examazej before 1.8 (no app_version)");
  });
});

describe("LaTeX: tag line syntax", () => {
  it("accepts several tags on one line, and a tag on the \\item line", () => {
    const result = parseLatexTemplate(
      doc(
        ["\\item %{#fixed-position} %{#correct:B}", "%{#q}Q1%{/q}", BEGIN, "\\item %{#o}a%{/o}", "\\item %{#o}b%{/o}", END],
        mcq("Q2", ["%{#fixed}%{#separate-page}"])
      )
    );
    expect(result.questions[0]).toMatchObject({ fixedPosition: true, choices: [expect.any(Array), 1, null] });
    expect(result.questions[1]).toMatchObject({ fixed: true, keepOnSeparatePage: true });
  });

  it("accepts tags followed by %{#q} on the same line, and a trailing LaTeX comment", () => {
    const result = parseLatexTemplate(
      doc(
        ["\\item %{#correct:B} %{#q}Q1%{/q}", BEGIN, "\\item %{#o}a%{/o}", "\\item %{#o}b%{/o}", END],
        mcq("Q2", ["%{#fixed} % keep the ID question first"])
      )
    );
    expect(result.questions[0].text).toBe("Q1");
    expect(result.questions[0].choices[1]).toBe(1);
    expect(result.questions[1].fixed).toBe(true);
  });

  it("reports a tag line it cannot read instead of silently ignoring it", () => {
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#fixed options}"])))).toThrow(
      /Could not read the tag/
    );
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#fixed} stray text"])))).toThrow(
      /Unexpected text after the tag/
    );
  });

  it("still rejects unknown tags, listing correct:X among the valid ones", () => {
    expect(() => parseLatexTemplate(doc(mcq("Q", ["%{#bonus}"])))).toThrow(
      /Invalid tag: bonus.*correct:X/
    );
  });
});

describe("LaTeX: which question a tag belongs to", () => {
  it("a tag after an open-ended question's \\item-ended block belongs to the NEXT question", () => {
    const result = parseLatexTemplate(doc(openEnded("Essay"), mcq("Q2", ["%{#fixed}"])));
    expect(result.questions[0].fixed).toBeFalsy();
    expect(result.questions[1].fixed).toBe(true);
  });

  it("works the same without \\item lines: a tag directly above %{#q} is that question's", () => {
    const result = parseLatexTemplate(
      [BEGIN, "%{#fixed}", "%{#q}Essay%{/q}", "%{#separate-page}", "%{#q}Q2%{/q}", BEGIN, "%{#o}a%{/o}", "%{#o}b%{/o}", END, END].join("\n")
    );
    expect(result.questions[0]).toMatchObject({ text: "Essay", fixed: true, keepOnSeparatePage: false });
    expect(result.questions[1]).toMatchObject({ text: "Q2", keepOnSeparatePage: true });
    expect(result.questions[1].fixed).toBeFalsy();
  });

  it("a tag after an open-ended question's text, before the next \\item, stays with it", () => {
    const result = parseLatexTemplate(
      doc(["\\item", "%{#q}Essay%{/q}", "%{#separate-page}"], mcq("Q2"))
    );
    expect(result.questions[0].keepOnSeparatePage).toBe(true);
    expect(result.questions[1].keepOnSeparatePage).toBe(false);
  });

  it("a tag between a question's text and its options belongs to that question", () => {
    const result = parseLatexTemplate(
      doc(["\\item", "%{#q}Q1%{/q}", "%{#correct:B}", BEGIN, "\\item %{#o}a%{/o}", "\\item %{#o}b%{/o}", END])
    );
    expect(result.questions[0].choices[1]).toBe(1);
  });
});

describe("Excel: Questions sheet messages", () => {
  async function workbookFile(rows: (string | null)[][]) {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Questions");
    rows.forEach((row, index) => {
      if (row.length > 0) sheet.getRow(index + 1).values = row;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const file = new File([buffer], "questions.xlsx");
    Object.defineProperty(file, "arrayBuffer", { value: async () => buffer });
    return file;
  }
  const header = ["Question Text", "Option A", "Option B", "Option C", "Option D", "Option E", "Correct", "Tags"];

  it("names the question and its real sheet row, even after an empty row", async () => {
    const file = await workbookFile([
      header,
      ["Q1", "a", "b", "c", "", "", "A", "fixed-options:F"],
      [],
      ["Q2", "a", "b", "c", "", "", "B", "Shuffle"],
    ]);
    await expect(parseExcel(file)).rejects.toThrow(
      [
        "Found 2 errors in the questions:",
        "",
        "1. Question 1 (row 2): 'fixed-options:F' needs option letters A-E written together, " +
          "e.g. 'fixed-options:E' or 'fixed-options:DE'.",
        "",
        "2. Question 2 (row 4): Invalid tag: Shuffle. Valid tags: fixed, fixed-position, fixed-options, " +
          "separate-page, fixed-options:X",
      ].join("\n")
    );
  });
});

describe("CSV: Tags column", () => {
  const csv = (rows: string[]) =>
    ["# questions", "Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags", ...rows].join("\n");

  it("reads fixed-position and keeps the Correct column as the answer", () => {
    const parsed = parseCSV(csv(['"Q1","a","b","c","","",C,fixed-position']));
    expect(parsed.questions[0]).toMatchObject({ fixedPosition: true, choices: [expect.any(Array), 2, null] });
    expect(parsed.warnings).toEqual([]);
  });

  it("warns (instead of failing) when fixed and fixed-options are combined", () => {
    const parsed = parseCSV(csv(['"Q1","a","b","","","",A,"fixed, fixed-options"']));
    expect(parsed.questions[0].fixed).toBe(true);
    // The question number, and the file line it is on (line 1 is "# questions").
    expect(parsed.warnings?.[0]).toMatch(/^Question 1 \(line 3\): 'fixed' already locks the option order/);
  });

  it("reports every bad row at once, by question number and file line, quoting tags as written", () => {
    const content = [
      "# settings", "coursecode,MATH 101", "",
      "# questions",
      "Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags",
      '"Q1","a","b","c","d","",A,correct:B',
      "",
      '"Q2","a","b","c","d","e",A,fixed-options:F',
      '"Q3","a","b","c","","",A,fixed-options:E',
      '"Q4","a","b","c","d","",C,"fixed-position, fixed-options:D"',
    ].join("\n");
    expect(() => parseCSV(content)).toThrow(
      [
        "Found 3 errors in the questions:",
        "",
        "1. Question 1 (line 6): Invalid tag: correct:B. Valid tags: fixed, fixed-position, fixed-options, " +
          "separate-page, fixed-options:X. In CSV/Excel files the correct answer goes in the Correct column.",
        "",
        "2. Question 2 (line 8): 'fixed-options:F' needs option letters A-E written together, " +
          "e.g. 'fixed-options:E' or 'fixed-options:DE'.",
        "",
        "3. Question 3 (line 9): 'fixed-options:E' keeps option E in place, but this question has 3 options (A-C).",
      ].join("\n")
    );
  });

  it("still reads tags in any case", () => {
    const parsed = parseCSV(csv(['"Q1","a","b","c","d","e",B,"Fixed-Position, FIXED-OPTIONS:e"']));
    expect(parsed.questions[0]).toMatchObject({ fixedPosition: true, pinnedOptions: [4] });
  });

  it("puts a row's own problems (answer letter) in the same list", () => {
    expect(() => parseCSV(csv(['"Q1","a","b","","","",D,', '"Q2","a","b","","","",,']))).toThrow(
      /^Found 2 errors in the questions:\n\n1\. Question 1 \(line 3\): Invalid correct answer 'D'.*\n\n2\. Question 2 \(line 4\): Question has options but no correct answer/s
    );
  });

  it("warns when fixed-options is set on an open-ended question", () => {
    const parsed = parseCSV(csv(['"Essay","","","","","",,fixed-options']));
    expect(parsed.questions[0].fixedOptions).toBe(false);
    expect(parsed.warnings?.[0]).toMatch(/'fixed-options' is ignored/);
  });

  it("reads fixed-options:X as pinned options, with the answer from the Correct column", () => {
    const parsed = parseCSV(
      csv([
        '"Q1","a","b","c","d","None of these",B,fixed-options:E',
        '"Q2","a","b","c","d","e",A,"fixed-position, fixed-options:DE"',
      ])
    );
    expect(parsed.questions[0]).toMatchObject({ pinnedOptions: [4], choices: [expect.any(Array), 1, null] });
    expect(parsed.questions[1]).toMatchObject({ fixedPosition: true, pinnedOptions: [3, 4] });
    expect(parsed.warnings).toEqual([]);
  });

  it("reads app_version from the settings (not as an unknown setting) and notes pinned answers", () => {
    const parsed = parseCSV(
      [
        "# settings",
        "app_version,9.1.0",
        "coursecode,MATH 101",
        "",
        "# questions",
        "Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags",
        '"Q1","a","b","c","","",C,fixed-options:C',
      ].join("\n")
    );
    expect(parsed.appVersion).toBe("9.1.0");
    expect(parsed.settings).not.toHaveProperty("app_version");
    const converted = convertToLatexFormat(parsed);
    expect(converted.appVersion).toBe("9.1.0");
    expect(converted.warnings).toEqual([
      expect.stringMatching(/^This file was made with Examazej 9\.1\.0, which is newer/),
      "In Question 1 the correct answer is a pinned option, so it has the same letter in every version.",
    ]);
  });
});
