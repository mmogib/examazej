import { describe, it, expect } from "vitest";
import { validateSeparatePageGrouping } from "@/lib/utils/tag-validator";

type Q = { keepOnSeparatePage?: boolean };

const mkQs = (flags: boolean[]): Q[] =>
  flags.map((f) => ({ keepOnSeparatePage: f }));

describe("validateSeparatePageGrouping", () => {
  describe("Valid configurations", () => {
    it("accepts a separate-page question in its own size-1 group", () => {
      const questions = mkQs([false, false, true]);
      const errors = validateSeparatePageGrouping(questions, "2,1");
      expect(errors).toEqual([]);
    });

    it("accepts bracket-grouped size-1 separate-page group", () => {
      const questions = mkQs([false, false, true]);
      const errors = validateSeparatePageGrouping(questions, "[2],[1]");
      expect(errors).toEqual([]);
    });

    it("accepts parenthesized size-1 separate-page group", () => {
      const questions = mkQs([true, false, false]);
      const errors = validateSeparatePageGrouping(questions, "(1),2");
      expect(errors).toEqual([]);
    });

    it("accepts multiple separate-page questions each alone in size-1 groups", () => {
      const questions = mkQs([true, false, true, false, true]);
      const errors = validateSeparatePageGrouping(questions, "1,1,1,1,1");
      expect(errors).toEqual([]);
    });

    it("accepts no separate-page questions (any grouping)", () => {
      const questions = mkQs([false, false, false, false]);
      const errors = validateSeparatePageGrouping(questions, "2,2");
      expect(errors).toEqual([]);
    });
  });

  describe("Invalid configurations", () => {
    it("rejects separate-page question sharing a size-2 group", () => {
      const questions = mkQs([false, true, false]);
      const errors = validateSeparatePageGrouping(questions, "2,1");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Question 2");
      expect(errors[0]).toContain("separate-page");
      expect(errors[0]).toContain("Group 1");
    });

    it("rejects separate-page question in a size-5 group", () => {
      const questions = mkQs([false, false, true, false, false]);
      const errors = validateSeparatePageGrouping(questions, "5");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Question 3");
    });

    it("rejects bracket-shuffled size-3 group containing separate-page", () => {
      const questions = mkQs([false, true, false]);
      const errors = validateSeparatePageGrouping(questions, "[3]");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Group 1");
    });

    it("reports one error per offending separate-page question", () => {
      // Two separate-page questions in the same size-4 group
      const questions = mkQs([true, false, true, false]);
      const errors = validateSeparatePageGrouping(questions, "4");
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain("Question 1");
      expect(errors[1]).toContain("Question 3");
    });

    it("identifies the correct group index when error is in second group", () => {
      const questions = mkQs([false, false, false, true, false]);
      // Groups: [0..2] size 3, [3..4] size 2. q4 sep-page is in group 2 (size 2)
      const errors = validateSeparatePageGrouping(questions, "3,2");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Question 4");
      expect(errors[0]).toContain("Group 2");
    });
  });

  describe("Defers to other validators", () => {
    it("returns no errors when group sum does not match question count", () => {
      // Syntax/sum validation is handled elsewhere — this validator only checks
      // the separate-page rule when the partition is well-formed
      const questions = mkQs([true, false, false]);
      const errors = validateSeparatePageGrouping(questions, "2,2");
      expect(errors).toEqual([]);
    });

    it("returns no errors when group partition is unparseable", () => {
      const questions = mkQs([true, false]);
      const errors = validateSeparatePageGrouping(questions, "abc");
      expect(errors).toEqual([]);
    });

    it("handles empty question list", () => {
      const errors = validateSeparatePageGrouping([], "");
      expect(errors).toEqual([]);
    });
  });
});
