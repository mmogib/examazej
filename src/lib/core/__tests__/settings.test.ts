import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getFormattedCurrentDate,
  getCurrentTerm,
  getDefaultSettings,
  generateSettingsBlock,
  generateTemplateSettings,
} from "../settings";
import type { ExamSettings } from "../../types";

describe("settings.ts", () => {
  describe("getFormattedCurrentDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should format date correctly for single-digit day", () => {
      vi.setSystemTime(new Date("2025-01-05"));
      const result = getFormattedCurrentDate();
      expect(result).toBe("January 05, 2025");
    });

    it("should format date correctly for double-digit day", () => {
      vi.setSystemTime(new Date("2025-12-30"));
      const result = getFormattedCurrentDate();
      expect(result).toBe("December 30, 2025");
    });

    it("should format date correctly for February", () => {
      vi.setSystemTime(new Date("2025-02-14"));
      const result = getFormattedCurrentDate();
      expect(result).toBe("February 14, 2025");
    });

    it("should format date correctly for mid-year months", () => {
      vi.setSystemTime(new Date("2025-06-15"));
      const result = getFormattedCurrentDate();
      expect(result).toBe("June 15, 2025");
    });

    it("should pad single-digit days with zero", () => {
      vi.setSystemTime(new Date("2025-03-01"));
      const result = getFormattedCurrentDate();
      expect(result).toBe("March 01, 2025");
    });
  });

  describe("getCurrentTerm", () => {
    describe("Fall Term (suffix: 1)", () => {
      it("should return Fall term for August 15", () => {
        const result = getCurrentTerm(new Date("2024-08-15"));
        expect(result).toBe("241"); // Fall 2024
      });

      it("should return Fall term for September", () => {
        const result = getCurrentTerm(new Date("2024-09-20"));
        expect(result).toBe("241");
      });

      it("should return Fall term for October", () => {
        const result = getCurrentTerm(new Date("2024-10-15"));
        expect(result).toBe("241");
      });

      it("should return Fall term for November", () => {
        const result = getCurrentTerm(new Date("2024-11-25"));
        expect(result).toBe("241");
      });

      it("should return Fall term for December", () => {
        const result = getCurrentTerm(new Date("2024-12-30"));
        expect(result).toBe("241");
      });

      it("should return Fall term for January (continuation of previous Fall)", () => {
        const result = getCurrentTerm(new Date("2025-01-15"));
        expect(result).toBe("241"); // Still Fall 2024
      });

      it("should return Fall term for January 31", () => {
        const result = getCurrentTerm(new Date("2025-01-31"));
        expect(result).toBe("241"); // Still Fall 2024
      });
    });

    describe("Spring Term (suffix: 2)", () => {
      it("should return Spring term for February 1", () => {
        const result = getCurrentTerm(new Date("2025-02-01"));
        expect(result).toBe("242"); // Spring 2025 (based on Fall 2024)
      });

      it("should return Spring term for March", () => {
        const result = getCurrentTerm(new Date("2025-03-15"));
        expect(result).toBe("242");
      });

      it("should return Spring term for April", () => {
        const result = getCurrentTerm(new Date("2025-04-20"));
        expect(result).toBe("242");
      });

      it("should return Spring term for May", () => {
        const result = getCurrentTerm(new Date("2025-05-10"));
        expect(result).toBe("242");
      });

      it("should return Spring term for June 1-14", () => {
        const result = getCurrentTerm(new Date("2025-06-10"));
        expect(result).toBe("242");
      });

      it("should return Spring term for June 14 (last day)", () => {
        const result = getCurrentTerm(new Date("2025-06-14"));
        expect(result).toBe("242");
      });
    });

    describe("Summer Term (suffix: 3)", () => {
      it("should return Summer term for June 15", () => {
        const result = getCurrentTerm(new Date("2025-06-15"));
        expect(result).toBe("243"); // Summer 2025 (based on Fall 2024)
      });

      it("should return Summer term for July", () => {
        const result = getCurrentTerm(new Date("2025-07-20"));
        expect(result).toBe("243");
      });

      it("should return Summer term for August 1-14", () => {
        const result = getCurrentTerm(new Date("2025-08-10"));
        expect(result).toBe("243");
      });

      it("should return Summer term for August 14 (last day)", () => {
        const result = getCurrentTerm(new Date("2025-08-14"));
        expect(result).toBe("243");
      });
    });

    describe("Edge cases and year transitions", () => {
      it("should handle August 14 (last day of Summer)", () => {
        const result = getCurrentTerm(new Date("2024-08-14"));
        expect(result).toBe("233"); // Summer 2024 (based on Fall 2023)
      });

      it("should handle August 15 (first day of Fall)", () => {
        const result = getCurrentTerm(new Date("2024-08-15"));
        expect(result).toBe("241"); // Fall 2024
      });

      it("should handle year 2023", () => {
        const result = getCurrentTerm(new Date("2023-10-01"));
        expect(result).toBe("231"); // Fall 2023
      });

      it("should handle year 2026", () => {
        const result = getCurrentTerm(new Date("2026-03-15"));
        expect(result).toBe("252"); // Spring 2026 (based on Fall 2025)
      });

      it("should pad year correctly for years ending in single digit", () => {
        const result = getCurrentTerm(new Date("2009-09-01"));
        expect(result).toBe("091"); // Fall 2009
      });
    });
  });

  describe("getDefaultSettings", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return settings with all required fields", () => {
      vi.setSystemTime(new Date("2025-12-30"));
      const settings = getDefaultSettings();

      expect(settings).toHaveProperty("university");
      expect(settings).toHaveProperty("department");
      expect(settings).toHaveProperty("coursecode");
      expect(settings).toHaveProperty("examname");
      expect(settings).toHaveProperty("examdate");
      expect(settings).toHaveProperty("timeallowed");
      expect(settings).toHaveProperty("numberofvestions");
      expect(settings).toHaveProperty("term");
      expect(settings).toHaveProperty("examtype");
      expect(settings).toHaveProperty("code_name");
      expect(settings).toHaveProperty("code_numbering");
      expect(settings).toHaveProperty("paper_size");
      expect(settings).toHaveProperty("instructions");
      expect(settings).toHaveProperty("includeCoverPage");
    });

    it("should set correct default values", () => {
      vi.setSystemTime(new Date("2025-12-30"));
      const settings = getDefaultSettings();

      expect(settings.university).toBe(
        "King Fahd University of Petroleum and Minerals"
      );
      expect(settings.department).toBe("Department of Mathematics");
      expect(settings.coursecode).toBe("MATH XXX");
      expect(settings.examname).toBe("EXAM NAME");
      expect(settings.timeallowed).toBe("120 Minutes");
      expect(settings.numberofvestions).toBe(4);
      expect(settings.examtype).toBe("MAJOR");
      expect(settings.code_name).toBe("CODE");
      expect(settings.code_numbering).toBe("ALPHA");
      expect(settings.paper_size).toBe("A4");
      expect(settings.includeCoverPage).toBe(true);
    });

    it("should generate current date in correct format", () => {
      vi.setSystemTime(new Date("2025-12-30"));
      const settings = getDefaultSettings();

      expect(settings.examdate).toBe("December 30, 2025");
    });

    it("should generate current term correctly", () => {
      vi.setSystemTime(new Date("2025-12-30"));
      const settings = getDefaultSettings();

      expect(settings.term).toBe("Term 251"); // December = Fall term
    });

    it("should include instructions text", () => {
      const settings = getDefaultSettings();

      expect(settings.instructions).toContain("\\begin{enumerate}");
      expect(settings.instructions).toContain("calculators");
      expect(settings.instructions).toContain("HB 2.5 pencils");
      expect(settings.instructions).toContain("Test Code Number");
    });

    it("should update term dynamically based on current date", () => {
      // Test Spring term
      vi.setSystemTime(new Date("2025-03-15"));
      const springSettings = getDefaultSettings();
      expect(springSettings.term).toBe("Term 242");

      // Test Summer term
      vi.setSystemTime(new Date("2025-07-20"));
      const summerSettings = getDefaultSettings();
      expect(summerSettings.term).toBe("Term 243");
    });
  });

  describe("generateSettingsBlock", () => {
    let mockSettings: ExamSettings;

    beforeEach(() => {
      mockSettings = {
        university: "Test University",
        department: "Test Department",
        term: "Term 251",
        coursecode: "MATH 101",
        examname: "First Major Exam",
        examdate: "December 30, 2025",
        timeallowed: "120 Minutes",
        numberofvestions: 4,
        groups: "5,10,5",
        examtype: "MAJOR",
        code_name: "CODE",
        code_numbering: "ALPHA",
        paper_size: "A4",
        instructions: "Test instructions line 1\nTest instructions line 2",
        includeCoverPage: true,
        seed: "test-seed-123",
      };
    });

    it("should generate LaTeX settings block with all fields", () => {
      const result = generateSettingsBlock(mockSettings);

      expect(result).toContain("%{#setting}");
      expect(result).toContain("%{/setting}");
      expect(result).toContain("university=Test University");
      expect(result).toContain("department=Test Department");
      expect(result).toContain("term=Term 251");
      expect(result).toContain("coursecode=MATH 101");
      expect(result).toContain("examname=First Major Exam");
      expect(result).toContain("examdate=December 30, 2025");
      expect(result).toContain("timeallowed=120 Minutes");
      expect(result).toContain("numberofvestions=4");
      expect(result).toContain("groups=5,10,5");
      expect(result).toContain("examtype=MAJOR");
      expect(result).toContain("code_name=CODE");
      expect(result).toContain("code_numbering=ALPHA");
      expect(result).toContain("includeCoverPage=yes");
      expect(result).toContain("seed=test-seed-123");
    });

    it("should use actualVersions parameter when provided", () => {
      const result = generateSettingsBlock(mockSettings, 8);

      expect(result).toContain("numberofvestions=8");
      expect(result).not.toContain("numberofvestions=4");
    });

    it("should use settings.numberofvestions when actualVersions is undefined", () => {
      const result = generateSettingsBlock(mockSettings);

      expect(result).toContain("numberofvestions=4");
    });

    it("should handle includeCoverPage=false", () => {
      mockSettings.includeCoverPage = false;
      const result = generateSettingsBlock(mockSettings);

      expect(result).toContain("includeCoverPage=no");
    });

    it("should omit seed when not provided", () => {
      delete mockSettings.seed;
      const result = generateSettingsBlock(mockSettings);

      expect(result).not.toContain("seed=");
    });

    it("should format instructions with % prefix on each line", () => {
      const result = generateSettingsBlock(mockSettings);

      expect(result).toContain("%{#instructions}");
      expect(result).toContain("%{/instructions}");
      expect(result).toContain("%Test instructions line 1");
      expect(result).toContain("%Test instructions line 2");
    });

    it("should handle multi-line instructions correctly", () => {
      mockSettings.instructions = "Line 1\nLine 2\nLine 3";
      const result = generateSettingsBlock(mockSettings);

      const lines = result.split("\n");
      const instructionLines = lines.filter((line) =>
        line.startsWith("%Line")
      );

      expect(instructionLines).toHaveLength(3);
      expect(instructionLines[0]).toBe("%Line 1");
      expect(instructionLines[1]).toBe("%Line 2");
      expect(instructionLines[2]).toBe("%Line 3");
    });
  });

  describe("generateTemplateSettings", () => {
    it("should generate settings with user-provided metadata", () => {
      const config = {
        coursecode: "CS 201",
        examname: "Final Exam",
        examdate: "January 15, 2026",
        term: "Term 252",
        numQuestions: 15,
        includeCoverPage: true,
      };

      const result = generateTemplateSettings(config);

      expect(result.coursecode).toBe("CS 201");
      expect(result.examname).toBe("Final Exam");
      expect(result.examdate).toBe("January 15, 2026");
      expect(result.term).toBe("Term 252");
      expect(result.includeCoverPage).toBe(true);
    });

    it("should use defaults for university and department", () => {
      const config = {
        coursecode: "MATH 101",
        examname: "Test",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 10,
      };

      const result = generateTemplateSettings(config);

      expect(result.university).toBe(
        "King Fahd University of Petroleum and Minerals"
      );
      expect(result.department).toBe("Department of Mathematics");
    });

    it("should set groups based on numQuestions", () => {
      const config = {
        coursecode: "PHYS 101",
        examname: "Quiz",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 25,
      };

      const result = generateTemplateSettings(config);

      expect(result.groups).toBe("25");
    });

    it("should default includeCoverPage to true when not provided", () => {
      const config = {
        coursecode: "MATH 101",
        examname: "Test",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 10,
      };

      const result = generateTemplateSettings(config);

      expect(result.includeCoverPage).toBe(true);
    });

    it("should respect includeCoverPage=false when provided", () => {
      const config = {
        coursecode: "MATH 101",
        examname: "Test",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 10,
        includeCoverPage: false,
      };

      const result = generateTemplateSettings(config);

      expect(result.includeCoverPage).toBe(false);
    });

    it("should set hardcoded defaults correctly", () => {
      const config = {
        coursecode: "MATH 101",
        examname: "Test",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 10,
      };

      const result = generateTemplateSettings(config);

      expect(result.numberofvestions).toBe(4);
      expect(result.code_numbering).toBe("NUMERIC");
      expect(result.timeallowed).toBe("120 Minutes");
      expect(result.examtype).toBe("MAJOR");
      expect(result.code_name).toBe("CODE");
      expect(result.paper_size).toBe("A4");
    });

    it("should generate a seed", () => {
      const config = {
        coursecode: "CS 201",
        examname: "Final Exam",
        examdate: "January 15, 2026",
        term: "Term 252",
        numQuestions: 20,
      };

      const result = generateTemplateSettings(config);

      expect(result.seed).toBeDefined();
      expect(typeof result.seed).toBe("string");
      expect(result.seed.length).toBeGreaterThan(0);
    });

    it("should generate different seeds for different inputs", () => {
      const config1 = {
        coursecode: "MATH 101",
        examname: "Exam A",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 10,
      };

      const config2 = {
        coursecode: "MATH 102",
        examname: "Exam A",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 10,
      };

      const result1 = generateTemplateSettings(config1);
      const result2 = generateTemplateSettings(config2);

      expect(result1.seed).not.toBe(result2.seed);
    });

    it("should generate same seed for identical inputs (deterministic)", () => {
      const config = {
        coursecode: "PHYS 201",
        examname: "Midterm",
        examdate: "Oct 15, 2025",
        term: "Term 251",
        numQuestions: 30,
      };

      const result1 = generateTemplateSettings(config);
      const result2 = generateTemplateSettings(config);

      expect(result1.seed).toBe(result2.seed);
    });

    it("should include instructions from defaults", () => {
      const config = {
        coursecode: "MATH 101",
        examname: "Test",
        examdate: "Dec 1, 2025",
        term: "Term 251",
        numQuestions: 10,
      };

      const result = generateTemplateSettings(config);

      expect(result.instructions).toBeDefined();
      expect(result.instructions).toContain("calculators");
      expect(result.instructions).toContain("HB 2.5 pencils");
    });

    it("should return a complete ExamSettings object", () => {
      const config = {
        coursecode: "CS 301",
        examname: "Final Project",
        examdate: "May 20, 2026",
        term: "Term 252",
        numQuestions: 50,
        includeCoverPage: false,
      };

      const result = generateTemplateSettings(config);

      // Verify all required ExamSettings fields are present
      expect(result).toHaveProperty("university");
      expect(result).toHaveProperty("department");
      expect(result).toHaveProperty("term");
      expect(result).toHaveProperty("coursecode");
      expect(result).toHaveProperty("examname");
      expect(result).toHaveProperty("examdate");
      expect(result).toHaveProperty("timeallowed");
      expect(result).toHaveProperty("numberofvestions");
      expect(result).toHaveProperty("groups");
      expect(result).toHaveProperty("examtype");
      expect(result).toHaveProperty("code_name");
      expect(result).toHaveProperty("code_numbering");
      expect(result).toHaveProperty("paper_size");
      expect(result).toHaveProperty("instructions");
      expect(result).toHaveProperty("includeCoverPage");
      expect(result).toHaveProperty("seed");

      // Verify types
      expect(typeof result.university).toBe("string");
      expect(typeof result.department).toBe("string");
      expect(typeof result.numberofvestions).toBe("number");
      expect(typeof result.includeCoverPage).toBe("boolean");
      expect(typeof result.seed).toBe("string");
    });
  });
});
