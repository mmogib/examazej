import { describe, it, expect } from "vitest";
import { parseLatexTemplate } from "../parser";

/**
 * Simplified Parser Tests - Priority 1
 *
 * Tests the LaTeX template parser with CORRECT format:
 * - \begin{enumerate} blocks
 * - %{#q} / %{/q} markers for questions
 * - %{#o} / %{/o} markers for options
 * - %{#tag-name} for tags (fixed, fixed-options, separate-page)
 */

describe("parseLatexTemplate", () => {
  // ============================================================================
  // SECTION 1: Valid Template Parsing
  // ============================================================================

  describe("Valid Templates", () => {
    it("should parse simple MCQ question with options", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#q}
What is 2 + 2?
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    Three
    %{/o}

    \\item
    %{#o}
    Four
    %{/o}

    \\item
    %{#o}
    Five
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].text).toContain("What is 2 + 2?");
      expect(result.questions[0].choices[0]).toHaveLength(3);
      expect(result.questions[0].choices[0][0].text).toContain("Three");
      expect(result.questions[0].choices[0][1].text).toContain("Four");
      expect(result.questions[0].choices[0][2].text).toContain("Five");
    });

    it("should parse open-ended question (no options)", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#q}
Explain photosynthesis in detail.
%{/q}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].text).toContain("Explain photosynthesis");
      expect(result.questions[0].choices[0]).toHaveLength(0);
    });

    it("should parse settings block", () => {
      const latex = `
%{#setting}
% university=KFUPM
% department=Mathematics
% coursecode=MATH 101
% examname=Final Exam
%{/setting}

\\begin{enumerate}
\\item
%{#q}
Test question?
%{/q}
\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.settings).toBeDefined();
      expect(result.settings?.university).toBe("KFUPM");
      expect(result.settings?.department).toBe("Mathematics");
      expect(result.settings?.coursecode).toBe("MATH 101");
      expect(result.settings?.examname).toBe("Final Exam");
    });

    it("should parse preamble block", () => {
      const latex = `
%{#preamble}
\\usepackage{amsmath}
\\usepackage{tikz}
%{/preamble}

\\begin{enumerate}
\\item
%{#q}
Test question?
%{/q}
\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.preamble).toBeDefined();
      expect(result.preamble).toContain("\\usepackage{amsmath}");
      expect(result.preamble).toContain("\\usepackage{tikz}");
    });
  });

  // ============================================================================
  // SECTION 2: Tag Parsing
  // ============================================================================

  describe("Tag Parsing", () => {
    it("should parse 'fixed' tag", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#fixed}
%{#q}
Student ID question
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    Enter your ID
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].fixed).toBe(true);
    });

    it("should parse 'fixed-options' tag with correct answer", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#fixed-options:B}
%{#q}
Which is correct?
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    Option A
    %{/o}

    \\item
    %{#o}
    Option B (Correct)
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].fixedOptions).toBe(true);
      expect(result.questions[0].correctOptionLetter).toBe("B");
    });

    it("should parse 'separate-page' tag", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#separate-page}
%{#q}
Long essay question
%{/q}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].keepOnSeparatePage).toBe(true);
    });

    it("should parse multiple tags (fixed + separate-page)", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#fixed}
%{#separate-page}
%{#q}
Cover page question
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    Answer
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].fixed).toBe(true);
      expect(result.questions[0].keepOnSeparatePage).toBe(true);
    });
  });

  // ============================================================================
  // SECTION 3: Tag Validation (Error Cases)
  // ============================================================================

  describe("Tag Validation", () => {
    it("should throw error for conflicting tags (fixed + fixed-options)", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#fixed}
%{#fixed-options:A}
%{#q}
Invalid question
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    Answer
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      expect(() => parseLatexTemplate(latex)).toThrow(/cannot use both.*fixed.*fixed-options.*together/i);
    });

    it("should throw error for invalid tag name", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#invalid-tag}
%{#q}
Test question
%{/q}

\\end{enumerate}
      `.trim();

      expect(() => parseLatexTemplate(latex)).toThrow(/invalid tag/i);
    });

    it("should throw error for fixed-options without correct answer letter", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#fixed-options}
%{#q}
Missing correct answer
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    Option
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      expect(() => parseLatexTemplate(latex)).toThrow(/requires a correct answer letter/i);
    });
  });

  // ============================================================================
  // SECTION 4: Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle LaTeX math in question text", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#q}
What is $x^2 + y^2$?
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    $x + y$
    %{/o}

    \\item
    %{#o}
    $x^2 + y^2$
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].text).toContain("$x^2 + y^2$");
      expect(result.questions[0].choices[0][0].text).toContain("$x + y$");
    });

    it("should handle multiple questions", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#q}
Question 1?
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    A
    %{/o}
  \\end{enumerate}

\\item
%{#q}
Question 2?
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    B
    %{/o}
  \\end{enumerate}

\\item
%{#q}
Question 3?
%{/q}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].text).toContain("Question 1?");
      expect(result.questions[1].text).toContain("Question 2?");
      expect(result.questions[2].text).toContain("Question 3?");
    });

    it("should handle multiline question text", () => {
      const latex = `
\\begin{enumerate}

\\item
%{#q}
This is a long question
that spans multiple lines
with proper formatting.
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    Answer
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].text).toContain("multiple lines");
    });

    it("should not confuse %{#q} marker with tag names", () => {
      // Regression test for the bug that was fixed
      const latex = `
\\begin{enumerate}

\\item
%{#q}
Regular question without tags
%{/q}
  \\begin{enumerate}
    \\item
    %{#o}
    Answer
    %{/o}
  \\end{enumerate}

\\end{enumerate}
      `.trim();

      const result = parseLatexTemplate(latex);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].fixed).toBeFalsy();
      expect(result.questions[0].fixedOptions).toBeFalsy();
    });
  });
});

// ============================================================================
// TESTING NOTES:
// ============================================================================
//
// These simplified tests cover the critical parser functionality:
// ✅ Valid template parsing (MCQ, open-ended, settings, preamble)
// ✅ Tag parsing (fixed, fixed-options, separate-page)
// ✅ Tag validation (conflicts, invalid tags)
// ✅ Edge cases (math, multiline, multiple questions)
//
// The tests use the CORRECT LaTeX format that the parser expects:
// - \begin{enumerate} / \end{enumerate} blocks
// - %{#q} / %{/q} for question text
// - %{#o} / %{/o} for options
// - %{#tag-name} or %{#tag-name:value} for behavioral tags
//
// ============================================================================
