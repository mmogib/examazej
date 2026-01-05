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
