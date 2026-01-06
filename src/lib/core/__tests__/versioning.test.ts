import { describe, it, expect, beforeEach } from "vitest";
import { generateExamVersions } from "../versioning";
import type { Question, ExamSettings } from "../../types";

describe("generateExamVersions - Group Shuffling", () => {
  let mockQuestions: Question[];
  let baseSettings: ExamSettings;

  beforeEach(() => {
    // Create 20 mock questions
    mockQuestions = Array.from({ length: 20 }, (_, i) => ({
      text: `Question ${i + 1}`,
      group: 1,
      order: i + 1,
      choices: [
        [
          { text: "Option A" },
          { text: "Option B" },
          { text: "Option C" },
          { text: "Option D" },
          { text: "Option E" },
        ],
        0, // correct answer index
        null,
      ],
      fixed: false,
      fixedOptions: false,
      keepOnSeparatePage: false,
    }));

    baseSettings = {
      university: "Test University",
      department: "Test Dept",
      term: "Fall 2024",
      coursecode: "TEST101",
      examname: "Test Exam",
      examdate: "Oct 1, 2024",
      timeallowed: "60 minutes",
      numberofvestions: 2,
      groups: "5,5,5,5",
      examtype: "MAJOR",
      code_name: "VERSION",
      code_numbering: "ALPHA",
      paper_size: "A4",
      instructions: "Test instructions",
      includeCoverPage: true,
      seed: "test-seed",
    };
  });

  describe("Standard Format (no parentheses)", () => {
    it("should keep groups in original order", () => {
      baseSettings.groups = "5,5,5,5";

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Check both versions
      versions.forEach((version) => {
        // Questions 1-5 should come before 6-10, which come before 11-15, etc.
        const questionTexts = version.questions.map((q) => q.text);

        // Find which master questions appear in first 5 positions
        const firstGroup = questionTexts.slice(0, 5);
        const firstGroupNumbers = firstGroup.map((text) =>
          parseInt(text.replace("Question ", ""))
        );

        // All should be from questions 1-5 (in any order)
        firstGroupNumbers.forEach((num) => {
          expect(num).toBeGreaterThanOrEqual(1);
          expect(num).toBeLessThanOrEqual(5);
        });
      });
    });

    it("should shuffle questions within each group", () => {
      baseSettings.groups = "5,5,5,5";
      baseSettings.numberofvestions = 3;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // At least one version should have different order than master
      const firstGroupOrders = versions.map((v) =>
        v.questions
          .slice(0, 5)
          .map((q) => q.text)
          .join(",")
      );

      const allSame = firstGroupOrders.every(
        (order) => order === firstGroupOrders[0]
      );
      expect(allSame).toBe(false);
    });
  });

  describe("Parentheses Format (group shuffling)", () => {
    it("should shuffle group positions with (5),(5),(5),(5)", () => {
      baseSettings.groups = "(5),(5),(5),(5)";
      baseSettings.numberofvestions = 3;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Check that groups appear in different positions across versions
      const firstPositionGroups = versions.map((version) => {
        const firstQuestionText = version.questions[0].text;
        const firstQuestionNum = parseInt(
          firstQuestionText.replace("Question ", "")
        );

        // Determine which group this question belongs to
        if (firstQuestionNum <= 5) return 1;
        if (firstQuestionNum <= 10) return 2;
        if (firstQuestionNum <= 15) return 3;
        return 4;
      });

      // At least one version should have a different group first
      const allSame = firstPositionGroups.every(
        (g) => g === firstPositionGroups[0]
      );
      expect(allSame).toBe(false);
    });

    it("should keep questions in order within parenthesized groups", () => {
      baseSettings.groups = "(5),(5),(5),(5)";

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      versions.forEach((version) => {
        // Find questions from Group 1 (questions 1-5)
        const group1Questions = version.questions
          .filter((q) => {
            const num = parseInt(q.text.replace("Question ", ""));
            return num >= 1 && num <= 5;
          })
          .map((q) => parseInt(q.text.replace("Question ", "")));

        // They should be in ascending order
        for (let i = 1; i < group1Questions.length; i++) {
          expect(group1Questions[i]).toBe(group1Questions[i - 1] + 1);
        }
      });
    });

    it("should still shuffle options within parenthesized groups", () => {
      baseSettings.groups = "(20)"; // One group
      baseSettings.numberofvestions = 2;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Check that at least one question has shuffled options
      let foundShuffledOptions = false;

      for (const version of versions) {
        const firstQuestion = version.questions[0];
        const optionTexts = firstQuestion.choices[0].map((c: any) => c.text);

        // Original order is A, B, C, D, E
        const originalOrder = [
          "Option A",
          "Option B",
          "Option C",
          "Option D",
          "Option E",
        ];

        if (JSON.stringify(optionTexts) !== JSON.stringify(originalOrder)) {
          foundShuffledOptions = true;
          break;
        }
      }

      expect(foundShuffledOptions).toBe(true);
    });
  });

  describe("Bracket Format [5] (group and question shuffling)", () => {
    it("should shuffle group positions with [5],[5],[5],[5]", () => {
      baseSettings.groups = "[5],[5],[5],[5]";
      baseSettings.numberofvestions = 3;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Check that groups appear in different positions across versions
      const firstPositionGroups = versions.map((version) => {
        const firstQuestionText = version.questions[0].text;
        const firstQuestionNum = parseInt(
          firstQuestionText.replace("Question ", "")
        );

        // Determine which group this question belongs to (by master position)
        if (firstQuestionNum <= 5) return 1;
        if (firstQuestionNum <= 10) return 2;
        if (firstQuestionNum <= 15) return 3;
        return 4;
      });

      // At least one version should have a different group first
      const allSame = firstPositionGroups.every(
        (g) => g === firstPositionGroups[0]
      );
      expect(allSame).toBe(false);
    });

    it("should shuffle questions within bracket groups", () => {
      baseSettings.groups = "[5],[5],[5],[5]";
      baseSettings.numberofvestions = 3;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // At least one version should have shuffled questions within a group
      let foundShuffledGroup = false;

      for (const version of versions) {
        // Find questions from Group 1 (questions 1-5)
        const group1Questions = version.questions
          .filter((q) => {
            const num = parseInt(q.text.replace("Question ", ""));
            return num >= 1 && num <= 5;
          })
          .map((q) => parseInt(q.text.replace("Question ", "")));

        // Check if they are NOT in sequential order
        let isSequential = true;
        for (let i = 1; i < group1Questions.length; i++) {
          if (group1Questions[i] !== group1Questions[i - 1] + 1) {
            isSequential = false;
            break;
          }
        }

        if (!isSequential) {
          foundShuffledGroup = true;
          break;
        }
      }

      expect(foundShuffledGroup).toBe(true);
    });

    it("should still shuffle options within bracket groups", () => {
      baseSettings.groups = "[20]"; // One bracket group
      baseSettings.numberofvestions = 2;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Check that at least one question has shuffled options
      let foundShuffledOptions = false;

      for (const version of versions) {
        const firstQuestion = version.questions[0];
        const optionTexts = firstQuestion.choices[0].map((c: any) => c.text);

        // Original order is A, B, C, D, E
        const originalOrder = [
          "Option A",
          "Option B",
          "Option C",
          "Option D",
          "Option E",
        ];

        if (JSON.stringify(optionTexts) !== JSON.stringify(originalOrder)) {
          foundShuffledOptions = true;
          break;
        }
      }

      expect(foundShuffledOptions).toBe(true);
    });

    it("should respect fixed tag in bracket groups", () => {
      // Mark first question as fixed
      mockQuestions[0].fixed = true;

      baseSettings.groups = "[5],[15]";
      baseSettings.numberofvestions = 2;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // First question should stay in first position within its group
      versions.forEach((version) => {
        // Find which group contains Question 1
        const question1Index = version.questions.findIndex(
          (q) => q.text === "Question 1"
        );

        // Check if it's in the first group (first 5 positions)
        if (question1Index < 5) {
          // Question 1 should be first in the group
          const firstGroupQuestions = version.questions.slice(0, 5);
          expect(firstGroupQuestions[0].text).toBe("Question 1");
        } else {
          // If group 1 is not first, Question 1 should still be first within its group
          const group1Start = version.questions.findIndex((q) => {
            const num = parseInt(q.text.replace("Question ", ""));
            return num >= 1 && num <= 5;
          });
          expect(version.questions[group1Start].text).toBe("Question 1");
        }
      });
    });
  });

  describe("Mixed Format", () => {
    it("should handle 5,(10),(5) correctly", () => {
      baseSettings.groups = "5,(10),(5)";
      baseSettings.numberofvestions = 3;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      versions.forEach((version) => {
        // Group 1 (questions 1-5) should always be in first 5 positions
        const firstFiveQuestions = version.questions.slice(0, 5);
        firstFiveQuestions.forEach((q) => {
          const num = parseInt(q.text.replace("Question ", ""));
          expect(num).toBeGreaterThanOrEqual(1);
          expect(num).toBeLessThanOrEqual(5);
        });

        // Groups 2 and 3 should be in positions 6-20 (in either order)
        const remaining = version.questions.slice(5);
        const remainingNums = remaining.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );

        // All should be from questions 6-20
        remainingNums.forEach((num) => {
          expect(num).toBeGreaterThanOrEqual(6);
          expect(num).toBeLessThanOrEqual(20);
        });
      });
    });

    it("should keep group 1 questions shuffled in 5,(10),(5)", () => {
      baseSettings.groups = "5,(10),(5)";
      baseSettings.numberofvestions = 3;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Group 1 questions should be in different orders
      const group1Orders = versions.map((v) =>
        v.questions
          .slice(0, 5)
          .map((q) => q.text)
          .join(",")
      );

      const allSame = group1Orders.every((order) => order === group1Orders[0]);
      expect(allSame).toBe(false);
    });

    it("should keep groups 2 and 3 questions in order in 5,(10),(5)", () => {
      baseSettings.groups = "5,(10),(5)";

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      versions.forEach((version) => {
        // Find Group 2 questions (6-15)
        const group2Questions = version.questions
          .filter((q) => {
            const num = parseInt(q.text.replace("Question ", ""));
            return num >= 6 && num <= 15;
          })
          .map((q) => parseInt(q.text.replace("Question ", "")));

        // Should be sequential
        for (let i = 1; i < group2Questions.length; i++) {
          expect(group2Questions[i]).toBe(group2Questions[i - 1] + 1);
        }

        // Find Group 3 questions (16-20)
        const group3Questions = version.questions
          .filter((q) => {
            const num = parseInt(q.text.replace("Question ", ""));
            return num >= 16 && num <= 20;
          })
          .map((q) => parseInt(q.text.replace("Question ", "")));

        // Should be sequential
        for (let i = 1; i < group3Questions.length; i++) {
          expect(group3Questions[i]).toBe(group3Questions[i - 1] + 1);
        }
      });
    });

    it("should allow groups 2 and 3 to swap positions in 5,(10),(5)", () => {
      baseSettings.groups = "5,(10),(5)";
      baseSettings.numberofvestions = 2; // Just 2 versions is enough

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Check the structure is correct
      versions.forEach((version) => {
        // First 5 should always be from group 1
        const firstFive = version.questions.slice(0, 5);
        firstFive.forEach((q) => {
          const num = parseInt(q.text.replace("Question ", ""));
          expect(num).toBeGreaterThanOrEqual(1);
          expect(num).toBeLessThanOrEqual(5);
        });

        // Remaining 15 should be from groups 2 and 3
        const remaining = version.questions.slice(5);
        const remainingNums = remaining.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );

        remainingNums.forEach((num) => {
          expect(num).toBeGreaterThanOrEqual(6);
          expect(num).toBeLessThanOrEqual(20);
        });
      });

      // Check that groups 2 and 3 appear as complete blocks
      const version1 = versions[0];
      const sixthQuestionNum = parseInt(
        version1.questions[5].text.replace("Question ", "")
      );

      // Verify the group that starts at position 6 is complete
      if (sixthQuestionNum >= 6 && sixthQuestionNum <= 15) {
        // Group 2 is first - verify it's questions 6-15 in order
        const group2Questions = version1.questions.slice(5, 15);
        const group2Nums = group2Questions.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );
        expect(group2Nums).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

        // Group 3 should follow - questions 16-20
        const group3Questions = version1.questions.slice(15, 20);
        const group3Nums = group3Questions.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );
        expect(group3Nums).toEqual([16, 17, 18, 19, 20]);
      } else {
        // Group 3 is first - verify it's questions 16-20 in order
        const group3Questions = version1.questions.slice(5, 10);
        const group3Nums = group3Questions.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );
        expect(group3Nums).toEqual([16, 17, 18, 19, 20]);

        // Group 2 should follow - questions 6-15
        const group2Questions = version1.questions.slice(10, 20);
        const group2Nums = group2Questions.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );
        expect(group2Nums).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      }
    });

    it("should handle 5,(5),[5],5 correctly (all three modes)", () => {
      baseSettings.groups = "5,(5),[5],5";
      baseSettings.numberofvestions = 3;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      versions.forEach((version) => {
        // Group 1 (questions 1-5): Fixed position, should be first
        const firstFiveQuestions = version.questions.slice(0, 5);
        firstFiveQuestions.forEach((q) => {
          const num = parseInt(q.text.replace("Question ", ""));
          expect(num).toBeGreaterThanOrEqual(1);
          expect(num).toBeLessThanOrEqual(5);
        });

        // Group 4 (questions 16-20): Fixed position, should be last
        const lastFiveQuestions = version.questions.slice(15, 20);
        lastFiveQuestions.forEach((q) => {
          const num = parseInt(q.text.replace("Question ", ""));
          expect(num).toBeGreaterThanOrEqual(16);
          expect(num).toBeLessThanOrEqual(20);
        });

        // Groups 2 and 3 (questions 6-15): Can swap positions
        const middleTen = version.questions.slice(5, 15);
        const middleNums = middleTen.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );

        // All should be from questions 6-15
        middleNums.forEach((num) => {
          expect(num).toBeGreaterThanOrEqual(6);
          expect(num).toBeLessThanOrEqual(15);
        });
      });

      // Check behaviors differ between groups
      let foundShuffledInGroup1 = false;
      let foundShuffledInGroup3 = false;
      let foundSequentialInGroup2 = false;

      for (const version of versions) {
        // Group 1 (standard): questions should shuffle
        const group1 = version.questions.slice(0, 5);
        const group1Nums = group1.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );
        let isSequential = true;
        for (let i = 1; i < group1Nums.length; i++) {
          if (group1Nums[i] !== group1Nums[i - 1] + 1) {
            isSequential = false;
            foundShuffledInGroup1 = true;
            break;
          }
        }

        // Group 2 (parentheses): questions should stay in order
        const group2Questions = version.questions
          .filter((q) => {
            const num = parseInt(q.text.replace("Question ", ""));
            return num >= 6 && num <= 10;
          })
          .map((q) => parseInt(q.text.replace("Question ", "")));

        let group2Sequential = true;
        for (let i = 1; i < group2Questions.length; i++) {
          if (group2Questions[i] !== group2Questions[i - 1] + 1) {
            group2Sequential = false;
            break;
          }
        }
        if (group2Sequential) {
          foundSequentialInGroup2 = true;
        }

        // Group 3 (brackets): questions should shuffle
        const group3Questions = version.questions
          .filter((q) => {
            const num = parseInt(q.text.replace("Question ", ""));
            return num >= 11 && num <= 15;
          })
          .map((q) => parseInt(q.text.replace("Question ", "")));

        let group3Sequential = true;
        for (let i = 1; i < group3Questions.length; i++) {
          if (group3Questions[i] !== group3Questions[i - 1] + 1) {
            group3Sequential = false;
            foundShuffledInGroup3 = true;
            break;
          }
        }
      }

      // At least one version should show the different behaviors
      expect(foundShuffledInGroup1).toBe(true); // Standard groups shuffle questions
      expect(foundSequentialInGroup2).toBe(true); // Parentheses groups keep order
      expect(foundShuffledInGroup3).toBe(true); // Bracket groups shuffle questions
    });
  });

  describe("Mapping Generation", () => {
    it("should maintain correct group numbers in mappings", () => {
      baseSettings.groups = "(5),(5),(5),(5)";

      const { mappings } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Check that group numbers are preserved from master
      mappings.forEach((mapping) => {
        if (mapping.masterQNo >= 1 && mapping.masterQNo <= 5) {
          expect(mapping.group).toBe(1);
        } else if (mapping.masterQNo >= 6 && mapping.masterQNo <= 10) {
          expect(mapping.group).toBe(2);
        } else if (mapping.masterQNo >= 11 && mapping.masterQNo <= 15) {
          expect(mapping.group).toBe(3);
        } else {
          expect(mapping.group).toBe(4);
        }
      });
    });

    it("should create correct number of mappings", () => {
      baseSettings.groups = "5,(10),(5)";
      baseSettings.numberofvestions = 3;

      const { mappings } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Should have 20 questions × 3 versions = 60 mappings
      expect(mappings.length).toBe(60);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single parenthesized group", () => {
      baseSettings.groups = "(20)";

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Questions should stay in order (only one group, can't shuffle with itself)
      versions.forEach((version) => {
        const questionNums = version.questions.map((q) =>
          parseInt(q.text.replace("Question ", ""))
        );

        for (let i = 1; i < questionNums.length; i++) {
          expect(questionNums[i]).toBe(questionNums[i - 1] + 1);
        }
      });
    });

    it("should handle all groups with parentheses", () => {
      baseSettings.groups = "(5),(5),(5),(5)";
      baseSettings.numberofvestions = 4;

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // Should create 4 versions successfully
      expect(versions.length).toBe(4);

      // Each version should have 20 questions
      versions.forEach((version) => {
        expect(version.questions.length).toBe(20);
      });
    });

    it("should respect fixedOptions in parenthesized groups", () => {
      // Mark first question with fixedOptions
      mockQuestions[0].fixedOptions = true;
      mockQuestions[0].correctOptionLetter = "A";

      baseSettings.groups = "(20)";

      const { versions } = generateExamVersions(
        mockQuestions,
        baseSettings,
        "test-seed"
      );

      // First question's options should NOT be shuffled
      versions.forEach((version) => {
        const firstQuestion = version.questions[0];
        const optionTexts = firstQuestion.choices[0].map((c: any) => c.text);

        expect(optionTexts).toEqual([
          "Option A",
          "Option B",
          "Option C",
          "Option D",
          "Option E",
        ]);
      });
    });
  });

  describe("Deterministic Behavior", () => {
    it("should produce same results with same seed", () => {
      baseSettings.groups = "(5),(5),(5),(5)";

      const result1 = generateExamVersions(
        mockQuestions,
        baseSettings,
        "same-seed"
      );

      const result2 = generateExamVersions(
        mockQuestions,
        baseSettings,
        "same-seed"
      );

      // First questions should be identical
      expect(result1.versions[0].questions[0].text).toBe(
        result2.versions[0].questions[0].text
      );

      // Option orders should be identical
      expect(result1.versions[0].questions[0].choices[0]).toEqual(
        result2.versions[0].questions[0].choices[0]
      );
    });

    it("should produce different results with different seeds", () => {
      baseSettings.groups = "(5),(5),(5),(5)";

      const result1 = generateExamVersions(
        mockQuestions,
        baseSettings,
        "seed-one"
      );

      const result2 = generateExamVersions(
        mockQuestions,
        baseSettings,
        "seed-two"
      );

      // At least one version should have different first question
      const firstQuestions1 = result1.versions.map((v) => v.questions[0].text);
      const firstQuestions2 = result2.versions.map((v) => v.questions[0].text);

      expect(JSON.stringify(firstQuestions1)).not.toBe(
        JSON.stringify(firstQuestions2)
      );
    });
  });
});
