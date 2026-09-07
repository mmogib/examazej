import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACADEMIC_INTEGRITY_PLEDGE,
  normalizeAcademicIntegrityPledgeText,
} from "../academic-integrity-pledge";

describe("academic integrity pledge", () => {
  it("provides the approved department wording", () => {
    expect(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE).toBe(
      "I pledge that I do not possess any mobile phone, smartwatch, earphones, or any other communication or smart devices, nor any written or printed material within my reach during this examination. I understand that possession of such devices or material will result in disciplinary action as per university policy."
    );
  });

  it("normalizes an edited pledge to one trimmed paragraph", () => {
    expect(
      normalizeAcademicIntegrityPledgeText("  First line.\n\n  Second line.  ")
    ).toBe("First line. Second line.");
  });

  it("returns an empty string for whitespace-only text", () => {
    expect(normalizeAcademicIntegrityPledgeText(" \n\t ")).toBe("");
  });
});
