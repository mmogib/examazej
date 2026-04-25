/**
 * Question tag validation utility
 * Validates and parses question tags across all input formats (LaTeX, CSV, Excel)
 */

export interface QuestionTags {
  fixed: boolean;
  fixedOptions: boolean;
  separatePage: boolean;
}

export const VALID_TAGS = ['fixed', 'fixed-options', 'separate-page'] as const;
export type ValidTag = typeof VALID_TAGS[number];

export interface ValidationContext {
  questionNumber?: number;
  lineNumber?: number;
  format?: 'latex' | 'csv' | 'excel';
}

/**
 * Parse and validate question tags
 * Collects all validation errors and throws once with all errors if any found
 *
 * @param tags - Array of tag strings to validate
 * @param context - Optional context for better error messages
 * @returns QuestionTags object with validated boolean flags
 * @throws Error if tags are invalid or conflicting (includes all errors found)
 *
 * @example
 * validateQuestionTags(['fixed', 'separate-page'])
 * // Returns: { fixed: true, fixedOptions: false, separatePage: true }
 *
 * validateQuestionTags(['fixed', 'fixed-options'])
 * // Throws: "Question 5: Cannot use both 'fixed' and 'fixed-options' tags..."
 */
export function validateQuestionTags(
  tags: string[],
  context: ValidationContext = {}
): QuestionTags {
  const errors: string[] = [];

  // Build context string for error messages
  const contextStr = context.questionNumber
    ? `Question ${context.questionNumber}`
    : context.lineNumber
      ? `Line ${context.lineNumber}`
      : 'Question';

  // Normalize tags (lowercase, trim)
  const normalizedTags = tags.map(t => t.toLowerCase().trim()).filter(t => t !== '');

  // Check for invalid tags
  const invalidTags = normalizedTags.filter(t => !VALID_TAGS.includes(t as ValidTag));
  if (invalidTags.length > 0) {
    errors.push(
      `Invalid tag${invalidTags.length > 1 ? 's' : ''}: ${invalidTags.join(', ')}. ` +
      `Valid tags: ${VALID_TAGS.join(', ')}`
    );
  }

  // Check for conflicting tags
  const hasFixed = normalizedTags.includes('fixed');
  const hasFixedOptions = normalizedTags.includes('fixed-options');

  if (hasFixed && hasFixedOptions) {
    errors.push(
      `Cannot use both 'fixed' and 'fixed-options' tags together. ` +
      `Use 'fixed' to lock question position AND option order, or ` +
      `use 'fixed-options' to lock option order only (question position can still shuffle).`
    );
  }

  // If errors found, throw with all error messages
  if (errors.length > 0) {
    const errorMessage = `${contextStr}: ${errors.join(' ')}`;
    throw new Error(errorMessage);
  }

  // Return validated tags
  return {
    fixed: hasFixed,
    fixedOptions: hasFixedOptions,
    separatePage: normalizedTags.includes('separate-page'),
  };
}

/**
 * Parse a group-partition string into numeric group sizes.
 * Returns null if any token is unparseable (caller uses separate syntax validation).
 */
function parseGroupSizes(groupPartition: string): number[] | null {
  const tokens = groupPartition.split(',').map(t => t.trim()).filter(t => t !== '');
  const sizes: number[] = [];
  for (const token of tokens) {
    const cleaned = token.replace(/[()[\]]/g, '');
    const n = parseInt(cleaned, 10);
    if (isNaN(n) || n <= 0) return null;
    sizes.push(n);
  }
  return sizes;
}

export interface SeparatePageQuestionInfo {
  keepOnSeparatePage?: boolean;
}

/**
 * Validate that every `separate-page` question sits alone in its own size-1 group.
 *
 * Sharing a group with other questions makes the total page count depend on where
 * the separate-page question lands after shuffling, producing versions with
 * different page counts. Enforcing size-1 groups keeps the layout invariant.
 *
 * @returns array of error messages (empty if valid)
 */
export function validateSeparatePageGrouping(
  questions: SeparatePageQuestionInfo[],
  groupPartition: string
): string[] {
  const sizes = parseGroupSizes(groupPartition);
  if (sizes === null) return []; // syntax errors handled elsewhere

  const totalFromGroups = sizes.reduce((s, n) => s + n, 0);
  if (totalFromGroups !== questions.length) return []; // partition mismatch handled elsewhere

  const errors: string[] = [];
  let cursor = 0;
  sizes.forEach((size, groupIdx) => {
    const groupQuestions = questions.slice(cursor, cursor + size);
    groupQuestions.forEach((q, offset) => {
      if (q.keepOnSeparatePage && size > 1) {
        const qNo = cursor + offset + 1;
        errors.push(
          `Question ${qNo} has the 'separate-page' tag but shares Group ${groupIdx + 1} (size ${size}) with other questions. ` +
          `Place it in its own size-1 group (e.g., split "${size}" into smaller groups so this question is alone).`
        );
      }
    });
    cursor += size;
  });

  return errors;
}

/**
 * Get human-readable description of tag combination
 * Useful for documentation and error messages
 */
export function getTagDescription(tags: QuestionTags): string {
  const parts: string[] = [];

  if (tags.fixed) {
    parts.push('fixed position and options');
  } else if (tags.fixedOptions) {
    parts.push('fixed options only');
  } else {
    parts.push('shuffled position and options');
  }

  if (tags.separatePage) {
    parts.push('on separate page');
  }

  return parts.join(', ');
}
