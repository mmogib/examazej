/**
 * Page count variation detection and analysis utility
 * Detects when different exam versions have different total page counts
 * and provides recommendations to fix the issue
 */

import type { ExamData, ExamVersion, Question } from "../types";

export interface PageCountDistribution {
  pageCount: number;
  versionCodes: string[];
}

export interface PageCountWarning {
  hasVariation: boolean;
  distributions: PageCountDistribution[];
  minPages: number;
  maxPages: number;
  affectedVersions: string[];
  recommendations: string[];
}

/**
 * Calculate total pages for a list of questions
 * Replicates the logic from latex.ts calculateQuestionPages
 */
function calculateQuestionPages(questions: Question[]): number {
  if (questions.length === 0) return 0;

  const maxQuestionsPerPage = 2;

  const { currentPage } = questions.reduce(
    (acc, question) => {
      if (question.keepOnSeparatePage) {
        const pageIncrement = acc.questionsOnCurrentPage > 0 ? 2 : 1;
        return {
          currentPage: acc.currentPage + pageIncrement,
          questionsOnCurrentPage: 0,
        };
      } else {
        const needNewPage = acc.questionsOnCurrentPage >= maxQuestionsPerPage;
        return {
          currentPage: acc.currentPage + (needNewPage ? 1 : 0),
          questionsOnCurrentPage: needNewPage
            ? 1
            : acc.questionsOnCurrentPage + 1,
        };
      }
    },
    { currentPage: 1, questionsOnCurrentPage: 0 }
  );

  return currentPage;
}

/**
 * Generate actionable recommendations based on exam structure
 */
function generateRecommendations(
  exam: ExamData,
  distributions: PageCountDistribution[]
): string[] {
  const recommendations: string[] = [];

  // Find questions with separate-page tag
  const separatePageQuestions = exam.questions
    .map((q, idx) => ({ ...q, number: idx + 1 }))
    .filter((q) => q.keepOnSeparatePage);

  if (separatePageQuestions.length === 0) {
    // No separate-page questions - shouldn't happen, but handle gracefully
    return [
      "This shouldn't happen - page count varies without separate-page questions. Please report this issue.",
    ];
  }

  // Find regular questions that appear before separate-page questions in the same group
  const problematicQuestions = exam.questions
    .map((q, idx) => ({ question: q, index: idx, number: idx + 1 }))
    .filter(({ question, index }) => {
      // Skip if this is a separate-page question
      if (question.keepOnSeparatePage) return false;

      // Check if any later question in the same group has separate-page
      const hasLaterSeparatePageInGroup = exam.questions
        .slice(index + 1)
        .some((laterQ) => {
          // Check if in same group (simplified - you may need group boundary logic)
          return laterQ.keepOnSeparatePage && laterQ.group === question.group;
        });

      return hasLaterSeparatePageInGroup;
    });

  // Recommendation 1: Add 'fixed' tag to separate-page questions
  if (separatePageQuestions.length > 0) {
    recommendations.push(
      `Add 'fixed' tag to questions with 'separate-page' tag (Q${separatePageQuestions.map((q) => q.number).join(", Q")}) ` +
        `to prevent them from shuffling and ensure consistent page counts across all versions.`
    );
  }

  // Recommendation 2: Put separate-page questions in their own fixed group
  recommendations.push(
    `Alternatively, place all separate-page questions in a separate group with parentheses ` +
      `(e.g., groups="5,(3),7" where the 3 questions are separate-page questions) ` +
      `to keep them in fixed positions.`
  );

  // Recommendation 3: Move separate-page questions to the end
  const lastQuestionNumber = exam.questions.length;
  const hasNonSeparateAfterSeparate = separatePageQuestions.some(
    (q) => q.number < lastQuestionNumber
  );

  if (hasNonSeparateAfterSeparate) {
    recommendations.push(
      `Move all separate-page questions to the end of the exam to minimize page count variation.`
    );
  }

  // Recommendation 4: If only 1 page difference, suggest adding one more separate-page
  const [minPages, maxPages] = [
    Math.min(...distributions.map((d) => d.pageCount)),
    Math.max(...distributions.map((d) => d.pageCount)),
  ];

  if (maxPages - minPages === 1 && problematicQuestions.length > 0) {
    recommendations.push(
      `Add 'separate-page' tag to question ${problematicQuestions[0].number} ` +
        `to make all versions ${maxPages} pages (consistent page count).`
    );
  }

  return recommendations;
}

/**
 * Detect page count variations across exam versions
 *
 * @param masterExam - The master exam data
 * @param versions - Array of shuffled exam versions
 * @param settings - Exam settings (for version codes)
 * @returns PageCountWarning object if variation detected, null otherwise
 */
export function detectPageCountVariations(
  masterExam: ExamData,
  versions: ExamVersion[]
): PageCountWarning | null {
  const pageCountMap = new Map<number, string[]>();

  // Calculate master version page count
  const masterPages = calculateQuestionPages(masterExam.questions);
  pageCountMap.set(masterPages, ["MASTER"]);

  // Calculate each version's page count
  versions.forEach((version, idx) => {
    const versionPages = calculateQuestionPages(version.questions);
    const versionCode = version.code || `Version ${idx + 1}`;

    if (!pageCountMap.has(versionPages)) {
      pageCountMap.set(versionPages, []);
    }
    pageCountMap.get(versionPages)!.push(versionCode);
  });

  // Check if variation exists
  if (pageCountMap.size <= 1) {
    return null; // No variation, all versions have same page count
  }

  // Build distributions array
  const distributions: PageCountDistribution[] = Array.from(
    pageCountMap.entries()
  ).map(([pageCount, versionCodes]) => ({
    pageCount,
    versionCodes,
  }));

  // Sort by page count
  distributions.sort((a, b) => a.pageCount - b.pageCount);

  const allVersions = distributions.flatMap((d) => d.versionCodes);
  const pageCounts = distributions.map((d) => d.pageCount);

  return {
    hasVariation: true,
    distributions,
    minPages: Math.min(...pageCounts),
    maxPages: Math.max(...pageCounts),
    affectedVersions: allVersions,
    recommendations: generateRecommendations(masterExam, distributions),
  };
}

/**
 * Format warning message for display
 */
export function formatPageCountWarning(warning: PageCountWarning): string {
  const lines: string[] = [
    "⚠️ PAGE COUNT VARIATION DETECTED ⚠️",
    "",
    "Different exam versions have different total page counts:",
    "",
  ];

  warning.distributions.forEach((dist) => {
    lines.push(
      `  • ${dist.pageCount} pages: ${dist.versionCodes.join(", ")}`
    );
  });

  lines.push(
    "",
    "⚠️ WARNING: This may cause confusion in the exam hall!",
    "Proctors might think some exams are incomplete or missing pages.",
    "",
    "RECOMMENDATIONS:",
    ""
  );

  warning.recommendations.forEach((rec, idx) => {
    lines.push(`  ${idx + 1}. ${rec}`);
  });

  return lines.join("\n");
}
