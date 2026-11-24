import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseLatexTemplate } from "../parser";
import { readQuestionsAsV17 } from "../reader-v1-7";

/**
 * `fixtures/reading-v1-7/` holds small files with every tag layout found to read differently;
 * `read-by-1.7.0.json` is how the real v1.7.0 code read each one (recorded from a checkout of
 * v1.7.0, like the compatibility check in `compat/`).
 */
const DIR = join(__dirname, "fixtures", "reading-v1-7");
type Read = { optionCount: number; fixed: boolean; fixedOptions: boolean; separatePage: boolean; answer: number };
const recorded = JSON.parse(readFileSync(join(DIR, "read-by-1.7.0.json"), "utf8")) as Record<string, Read[] | null>;
const layouts = readdirSync(DIR).filter((name) => name.endsWith(".tex")).sort();

describe("the frozen copy of the v1.7.0 reader", () => {
  it("has a recording for every layout", () => {
    expect(Object.keys(recorded).sort()).toEqual(layouts);
  });

  it.each(layouts)("%s: reads it exactly as v1.7.0 did", (name) => {
    const read = readQuestionsAsV17(readFileSync(join(DIR, name), "utf8"));
    expect(read?.map(({ tags: _tags, ...rest }) => rest) ?? null).toEqual(recorded[name]);
  });

  it("refuses what v1.7.0 refused: a tag it did not know, or fixed-options without a letter", () => {
    const file = (tag: string) =>
      ["\\begin{enumerate}", "\\item", tag, "%{#q}Q%{/q}", "\\begin{enumerate}", "\\item %{#o}a%{/o}", "\\end{enumerate}", "\\end{enumerate}"].join("\n");
    expect(readQuestionsAsV17(file("%{#fixed-position}"))).toBeNull();
    expect(readQuestionsAsV17(file("%{#fixed-options}"))).toBeNull();
    expect(readQuestionsAsV17(file("%{#fixed}"))).not.toBeNull();
  });
});

describe("a file made before v1.8: questions the older Examazej read differently are marked", () => {
  /** Question numbers (1-based) with `legacyRead`. */
  const marked = (name: string) =>
    parseLatexTemplate(readFileSync(join(DIR, name), "utf8"))
      .questions.map((q, i) => (q.legacyRead ? i + 1 : 0))
      .filter(Boolean);

  it.each([
    ["A-shift-fixed.tex", [1, 2]],
    ["A2-shift-pin.tex", [1, 2]],
    ["A3-shift-sep.tex", [1, 2]],
    ["B-item-same-line.tex", [1]],
    ["C-two-tags.tex", [1]],
    ["D-tag-with-q.tex", [1]],
    ["E-lowercase.tex", [1]],
    ["G2-trailing-comment.tex", [1]],
    ["L-chain.tex", [1, 2, 3]],
    ["V-open-own-tag.tex", [1, 2]],
    ["W-crlf-shift.tex", [1, 2]],
  ])("%s: questions %j", (name, questions) => {
    expect(marked(name)).toEqual(questions);
  });

  it.each(["G-trailing-space.tex", "H-uppercase.tex", "I-tag-after-text.tex", "K-trailing-tag.tex", "P-two-lists.tex", "U-two-lines.tex"])(
    "%s: read the same, nothing marked",
    (name) => {
      expect(marked(name)).toEqual([]);
    }
  );

  it("marks what it read, and leaves the older rules' markers off those questions", () => {
    const [open, after] = parseLatexTemplate(readFileSync(join(DIR, "A2-shift-pin.tex"), "utf8")).questions;
    expect(open.legacyRead).toEqual({ tags: ["fixed-options:B"], fixed: false, fixedOptions: true, separatePage: false, answer: 1 });
    expect(after.legacyRead).toEqual({ tags: [], fixed: false, fixedOptions: false, separatePage: false, answer: 0 });
    expect(after.legacyPin).toBeUndefined();
    expect(after).toMatchObject({ pinnedOptions: [1], choices: [expect.any(Array), 1, null] });
  });

  it("a file stamped 1.8 or later is read only as written", () => {
    const content = readFileSync(join(DIR, "A-shift-fixed.tex"), "utf8").replace("%groups=3", "%app_version=1.8.0\n%groups=3");
    expect(parseLatexTemplate(content).questions.some((q) => q.legacyRead)).toBe(false);
  });
});
