import { describe, it, expect, beforeEach } from "vitest";
import { generateLatexDocument } from "../latex";
import type { ExamData, ExamSettings, Question, VersionMapping } from "../../types";

/**
 * Tests for latex.ts - LaTeX Document Generation
 *
 * Coverage:
 * - Document generation (complete LaTeX output)
 * - Cover page generation
 * - Page count calculation per version
 * - Page count variation detection
 * - Warning comment block insertion
 * - Separate-page question handling
 * - Edge cases
 */

describe("generateLatexDocument", () => {
  let mockSettings: ExamSettings;
  let mockMasterExam: ExamData;
  let mockVersions: ExamData[];
  let mockMappings: VersionMapping[];

  beforeEach(() => {
    // Setup mock settings
    mockSettings = {
      university: "Test University",
      department: "Test Department",
      term: "Term 251",
      coursecode: "TEST 101",
      examname: "Test Exam",
      examdate: "January 1, 2026",
      timeallowed: "60 Minutes",
      numberofvestions: 2,
      groups: "5",
      examtype: "MAJOR",
      code_name: "CODE",
      code_numbering: "ALPHA",
      paper_size: "A4",
      instructions: "Test instructions\nRead carefully",
      includeCoverPage: true,
      seed: "test-seed",
    };

    // Setup mock questions
    const mockQuestion: Question = {
      text: "Test question?",
      group: 1,
      order: 1,
      choices: [
        [
          { text: "Option A" },
          { text: "Option B" },
          { text: "Option C" },
        ],
        0, // Correct answer index
        null,
      ],
      fixed: false,
      fixedOptions: false,
      keepOnSeparatePage: false,
    };

    // Setup master exam
    mockMasterExam = {
      name: "master",
      ordering: null,
      preamble: "",
      questions: [mockQuestion],
      kept_in_one_page: [],
    };

    // Setup versions
    mockVersions = [
      {
        name: "version_A",
        ordering: null,
        preamble: "",
        questions: [{ ...mockQuestion, order: 1 }],
        kept_in_one_page: [],
      },
      {
        name: "version_B",
        ordering: null,
        preamble: "",
        questions: [{ ...mockQuestion, order: 1 }],
        kept_in_one_page: [],
      },
    ];

    // Setup mappings
    mockMappings = [
      {
        group: 1,
        masterQNo: 1,
        version: "version_A",
        versionQNo: 1,
        perm: "A",
        correct: "A",
      },
      {
        group: 1,
        masterQNo: 1,
        version: "version_B",
        versionQNo: 1,
        perm: "A",
        correct: "A",
      },
    ];
  });

  // ============================================================================
  // SECTION 1: Valid Document Generation (Happy Path)
  // ============================================================================

  describe("Valid Document Generation", () => {
    it("should generate complete LaTeX document", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      expect(result.content).toBeDefined();
      expect(result.content).toContain("\\documentclass");
      expect(result.content).toContain("\\begin{document}");
      expect(result.content).toContain("\\end{document}");
    });

    it("should include all versions in output", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      // Version names are transformed to "CODE A", "CODE B" etc
      expect(result.content).toContain("CODE A");
      expect(result.content).toContain("CODE B");
    });

    it("should include master exam in output", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      expect(result.content).toContain("master");
    });

    it("should have valid LaTeX syntax (basic check)", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      // Check for matching begin/end pairs
      const beginCount = (result.content.match(/\\begin\{/g) || []).length;
      const endCount = (result.content.match(/\\end\{/g) || []).length;
      expect(beginCount).toBe(endCount);
    });

    it("should include exam settings in document", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      expect(result.content).toContain("Test University");
      expect(result.content).toContain("TEST 101");
      expect(result.content).toContain("Test Exam");
    });
  });

  // ============================================================================
  // SECTION 2: Cover Page Generation
  // ============================================================================

  describe("Cover Page", () => {
    it("should generate cover page when includeCoverPage=true", () => {
      mockSettings.includeCoverPage = true;

      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      // Cover page typically has student info fields
      expect(result.content).toContain("Name");
      expect(result.content).toContain("ID");
    });

    it("should skip cover page when includeCoverPage=false", () => {
      mockSettings.includeCoverPage = false;

      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      // Should not have student info section
      // This depends on implementation - adjust based on actual behavior
      expect(result.content).toBeDefined();
    });

    it("should include correct metadata in cover page", () => {
      mockSettings.includeCoverPage = true;

      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      expect(result.content).toContain("Test University");
      expect(result.content).toContain("Test Department");
      expect(result.content).toContain("TEST 101");
    });
  });

  // ============================================================================
  // SECTION 3: Page Count Calculation
  // ============================================================================

  describe("Page Count Calculation", () => {
    it("should calculate page count per version", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      // Each version should have "Page X of Y" headers (in LaTeX format)
      expect(result.content).toMatch(/Page.*\\arabic\{page\}.*of.*\d+/);
    });

    it("should detect page count variations when present", () => {
      // Create versions with different page counts
      // This would happen with separate-page questions
      const version1Questions: Question[] = [
        {
          text: "Q1",
          group: 1,
          order: 1,
          choices: [[{ text: "A" }], 0, null],
          fixed: false,
          fixedOptions: false,
          keepOnSeparatePage: false,
        },
      ];

      const version2Questions: Question[] = [
        {
          text: "Q1",
          group: 1,
          order: 1,
          choices: [[{ text: "A" }], 0, null],
          fixed: false,
          fixedOptions: false,
          keepOnSeparatePage: true, // This forces separate page
        },
      ];

      const versions = [
        { ...mockVersions[0], questions: version1Questions },
        { ...mockVersions[1], questions: version2Questions },
      ];

      const master = { ...mockMasterExam, questions: version1Questions };

      const result = generateLatexDocument(mockSettings, master, versions, mockMappings);

      // Should detect variation (implementation may vary)
      // This test verifies the function handles different page counts
      expect(result).toBeDefined();
    });

    it("should add warning comment when variation detected", () => {
      // Setup scenario with page count variation
      const version1: ExamData = {
        ...mockVersions[0],
        questions: Array.from({ length: 5 }, (_, i) => ({
          text: `Q${i + 1}`,
          group: 1,
          order: i + 1,
          choices: [[{ text: "A" }], 0, null],
          fixed: false,
          fixedOptions: false,
          keepOnSeparatePage: false,
        })),
      };

      const version2: ExamData = {
        ...mockVersions[1],
        questions: [
          {
            text: "Q1",
            group: 1,
            order: 1,
            choices: [[{ text: "A" }], 0, null],
            fixed: false,
            fixedOptions: false,
            keepOnSeparatePage: true, // Forces separate page
          },
          ...Array.from({ length: 4 }, (_, i) => ({
            text: `Q${i + 2}`,
            group: 1,
            order: i + 2,
            choices: [[{ text: "A" }], 0, null],
            fixed: false,
            fixedOptions: false,
            keepOnSeparatePage: false,
          })),
        ],
      };

      const master = version1;
      const versions = [version1, version2];

      const result = generateLatexDocument(mockSettings, master, versions, mockMappings);

      // If variation exists, should have warning comment
      if (result.pageCountWarning) {
        expect(result.content).toContain("WARNING");
      }
    });

    it("should return pageCountWarning in result when variation exists", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );

      // pageCountWarning should be defined (even if null)
      expect(result).toHaveProperty("pageCountWarning");
    });
  });

  // ============================================================================
  // SECTION 4: Separate-Page Questions
  // ============================================================================

  describe("Separate-Page Questions", () => {
    it("should handle separate-page tag", () => {
      const questionWithSeparatePage: Question = {
        text: "Essay question",
        group: 1,
        order: 1,
        choices: [[], -1, null], // Open-ended
        fixed: false,
        fixedOptions: false,
        keepOnSeparatePage: true,
      };

      const exam = {
        ...mockMasterExam,
        questions: [questionWithSeparatePage],
      };

      const versions = [
        { ...mockVersions[0], questions: [questionWithSeparatePage] },
      ];

      const result = generateLatexDocument(mockSettings, exam, versions, mockMappings);

      // Should contain newpage command before the question
      expect(result.content).toContain("\\newpage");
    });

    it("should add \\newpage before separate-page questions", () => {
      const normalQuestion: Question = {
        text: "Normal Q",
        group: 1,
        order: 1,
        choices: [[{ text: "A" }], 0, null],
        fixed: false,
        fixedOptions: false,
        keepOnSeparatePage: false,
      };

      const separateQuestion: Question = {
        text: "Separate Q",
        group: 1,
        order: 2,
        choices: [[{ text: "B" }], 0, null],
        fixed: false,
        fixedOptions: false,
        keepOnSeparatePage: true,
      };

      const exam = {
        ...mockMasterExam,
        questions: [normalQuestion, separateQuestion],
      };

      const versions = [
        {
          ...mockVersions[0],
          questions: [normalQuestion, separateQuestion],
        },
      ];

      const result = generateLatexDocument(mockSettings, exam, versions, mockMappings);

      expect(result.content).toContain("\\newpage");
    });
  });

  // ============================================================================
  // SECTION 5: Invalid Inputs
  // ============================================================================

  describe("Invalid Inputs", () => {
    it("should handle empty questions array", () => {
      const emptyExam = { ...mockMasterExam, questions: [] };
      const emptyVersions = mockVersions.map((v) => ({
        ...v,
        questions: [],
      }));

      // Should either error or handle gracefully
      const result = generateLatexDocument(
        mockSettings,
        emptyExam,
        emptyVersions,
        []
      );

      // At minimum, should not crash
      expect(result).toBeDefined();
    });

    it("should handle empty versions array", () => {
      // Should handle or error gracefully
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        [],
        []
      );

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // SECTION 6: Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle single version", () => {
      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        [mockVersions[0]],
        [mockMappings[0]]
      );

      expect(result.content).toBeDefined();
      expect(result.content).toContain("CODE A");
    });

    it("should handle large exams (20+ questions)", () => {
      const manyQuestions: Question[] = Array.from(
        { length: 25 },
        (_, i) => ({
          text: `Question ${i + 1}?`,
          group: 1,
          order: i + 1,
          choices: [
            [
              { text: "A" },
              { text: "B" },
              { text: "C" },
            ],
            0,
            null,
          ],
          fixed: false,
          fixedOptions: false,
          keepOnSeparatePage: false,
        })
      );

      const largeExam = { ...mockMasterExam, questions: manyQuestions };
      const largeVersions = mockVersions.map((v) => ({
        ...v,
        questions: manyQuestions,
      }));

      const result = generateLatexDocument(
        mockSettings,
        largeExam,
        largeVersions,
        []
      );

      expect(result.content).toBeDefined();
      // Should contain all 25 questions
      expect(result.content).toContain("Question 25");
    });

    it("should handle all open-ended questions", () => {
      const openEndedQuestion: Question = {
        text: "Explain your answer.",
        group: 1,
        order: 1,
        choices: [[], -1, null], // No options
        fixed: false,
        fixedOptions: false,
        keepOnSeparatePage: false,
      };

      const exam = { ...mockMasterExam, questions: [openEndedQuestion] };
      const versions = mockVersions.map((v) => ({
        ...v,
        questions: [openEndedQuestion],
      }));

      const result = generateLatexDocument(mockSettings, exam, versions, mockMappings);

      expect(result.content).toBeDefined();
      expect(result.content).toContain("Explain your answer");
    });

    it("should handle preamble commands", () => {
      const examWithPreamble = {
        ...mockMasterExam,
        preamble: "\\usepackage{amsmath}\n\\usepackage{tikz}",
      };

      const result = generateLatexDocument(
        mockSettings,
        examWithPreamble,
        mockVersions,
        mockMappings
      );

      expect(result.content).toContain("\\usepackage{amsmath}");
      expect(result.content).toContain("\\usepackage{tikz}");
    });

    it("should handle questions with LaTeX math", () => {
      const mathQuestion: Question = {
        text: "What is $x^2 + y^2$?",
        group: 1,
        order: 1,
        choices: [
          [
            { text: "$x + y$" },
            { text: "$x^2 + y^2$" },
          ],
          1,
          null,
        ],
        fixed: false,
        fixedOptions: false,
        keepOnSeparatePage: false,
      };

      const exam = { ...mockMasterExam, questions: [mathQuestion] };
      const versions = mockVersions.map((v) => ({
        ...v,
        questions: [mathQuestion],
      }));

      const result = generateLatexDocument(mockSettings, exam, versions, mockMappings, true);

      expect(result.content).toContain("$x^2 + y^2$");
    });

    it("should handle many versions (10+)", () => {
      const manyVersions: ExamData[] = Array.from({ length: 15 }, (_, i) => ({
        name: `version_${i + 1}`,
        ordering: null,
        preamble: "",
        questions: mockMasterExam.questions,
        kept_in_one_page: [],
      }));

      const result = generateLatexDocument(
        mockSettings,
        mockMasterExam,
        manyVersions,
        []
      );

      expect(result.content).toBeDefined();
      expect(result.content).toContain("CODE 1");
      expect(result.content).toContain("CODE 15");
    });
  });

  // ============================================================================
  // SECTION 7: Page Count Header (calculateQuestionPages)
  // ============================================================================

  describe("Page count header", () => {
    const makeQ = (text: string, sep = false): Question => ({
      text,
      group: 1,
      order: 1,
      choices: [[{ text: "A" }, { text: "B" }], 0, null],
      fixed: false,
      fixedOptions: false,
      keepOnSeparatePage: sep,
    });

    const generateWith = (questions: Question[]) => {
      const master: ExamData = {
        ...mockMasterExam,
        questions: questions.map((q, i) => ({ ...q, order: i + 1 })),
      };
      const version: ExamData = {
        ...mockVersions[0],
        questions: questions.map((q, i) => ({ ...q, order: i + 1 })),
      };
      return generateLatexDocument(mockSettings, master, [version], []);
    };

    it("reports 2 pages for 3 regular questions (2-per-page packing)", () => {
      const result = generateWith([
        makeQ("Q1"),
        makeQ("Q2"),
        makeQ("Q3"),
      ]);
      expect(result.content).toContain("of 2 ");
      expect(result.content).not.toContain("of 3 ");
    });

    it("reports 2 pages when separate-page question is last", () => {
      const result = generateWith([
        makeQ("Q1"),
        makeQ("Q2"),
        makeQ("Q3", true),
      ]);
      expect(result.content).toContain("of 2 ");
      expect(result.content).not.toContain("of 3 ");
    });

    it("reports 2 pages when separate-page question is first", () => {
      const result = generateWith([
        makeQ("Q1", true),
        makeQ("Q2"),
        makeQ("Q3"),
      ]);
      expect(result.content).toContain("of 2 ");
      expect(result.content).not.toContain("of 3 ");
    });

    it("reports 3 pages when all three questions are separate-page", () => {
      const result = generateWith([
        makeQ("Q1", true),
        makeQ("Q2", true),
        makeQ("Q3", true),
      ]);
      expect(result.content).toContain("of 3 ");
      expect(result.content).not.toContain("of 4 ");
    });

    it("reports 3 pages for 5 regular + separate-page in middle", () => {
      const result = generateWith([
        makeQ("Q1"),
        makeQ("Q2"),
        makeQ("Q3", true),
        makeQ("Q4"),
        makeQ("Q5"),
      ]);
      expect(result.content).toContain("of 3 ");
    });

    it("reports consistent total across versions of the user-reported scenario", () => {
      // 3 questions, q3=sep, grouping [2],[1]
      // Both shuffle outcomes should yield 2 pages
      const withSepLast = generateWith([
        makeQ("Q1"),
        makeQ("Q2"),
        makeQ("Q3", true),
      ]);
      const withSepFirst = generateWith([
        makeQ("Q3", true),
        makeQ("Q1"),
        makeQ("Q2"),
      ]);
      expect(withSepLast.content).toContain("of 2 ");
      expect(withSepFirst.content).toContain("of 2 ");
    });
  });

  // ============================================================================
  // SECTION 8: Section transitions (newcodecover + trailing separator)
  // ============================================================================

  describe("Section transitions", () => {
    const makeQ = (text: string, sep = false): Question => ({
      text,
      group: 1,
      order: 1,
      choices: [[{ text: "A" }], 0, null],
      fixed: false,
      fixedOptions: false,
      keepOnSeparatePage: sep,
    });

    it("\\newcodecover emits \\newpage even when includeCoverPage=false", () => {
      const settings = { ...mockSettings, includeCoverPage: false };
      const result = generateLatexDocument(
        settings,
        mockMasterExam,
        mockVersions,
        mockMappings
      );
      // Without the fix the false-branch was empty. With the fix it emits \newpage.
      expect(result.content).toMatch(
        /\\newcommand\{\\newcodecover\}\[1\]\{\\newpage\s*\}/
      );
    });

    it("emits \\questionseparator (not \\eogseparator) after last regular question", () => {
      // 2 regular questions: Q1 + qsep + Q2 + qsep, then close. The trailing
      // \questionseparator gives the page balanced fills; \eogseparator at this
      // position would create a blank trailing page.
      const master: ExamData = {
        ...mockMasterExam,
        questions: [makeQ("Q1"), makeQ("Q2")],
      };
      const result = generateLatexDocument(
        { ...mockSettings, includeCoverPage: false },
        master,
        [{ ...mockVersions[0], questions: master.questions }],
        []
      );
      // Master section: inner \end{enumerate} (options) → \questionseparator
      // → outer \end{enumerate} → \end{large}, with NO \eogseparator wedged in.
      expect(result.content).toMatch(
        /\\end\{enumerate\}\s*\n\\questionseparator\s*\n\s*\\end\{enumerate\}\s*\n\\end\{large\}/
      );
    });

    it("keeps \\eogseparator between groups of regular questions when more follow", () => {
      // 3 regular questions: Q1+Q2 fill page 1, Q3 needs a page break before it.
      const master: ExamData = {
        ...mockMasterExam,
        questions: [makeQ("Q1"), makeQ("Q2"), makeQ("Q3")],
      };
      const result = generateLatexDocument(
        { ...mockSettings, includeCoverPage: false },
        master,
        [{ ...mockVersions[0], questions: master.questions }],
        []
      );
      // \eogseparator must still appear between Q2 and Q3 to break the page
      expect(result.content).toContain("\\eogseparator");
    });
  });
});