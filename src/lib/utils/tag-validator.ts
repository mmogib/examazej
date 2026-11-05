/**
 * Question tag validation utility
 * Validates and parses question tags across all input formats (LaTeX, CSV, Excel)
 *
 * Lock tags are independent:
 *   fixed-position    -- keep the question's slot within its group (options still shuffle)
 *   fixed-options     -- keep the option order (the question can still move)
 *   fixed-options:DE  -- keep only options D and E in place; the others shuffle around them
 *   fixed             -- shorthand for fixed-position + fixed-options
 * The correct answer is not a tag here: LaTeX uses %{#correct:X} (read by the LaTeX
 * parser), CSV/Excel use the Correct column.
 */

export interface QuestionTags {
  fixed: boolean;
  fixedPosition: boolean;
  fixedOptions: boolean;
  /** Option indices kept in place by `fixed-options:X` (sorted, no duplicates). */
  pinnedOptions: number[];
  separatePage: boolean;
}

export interface TagValidationResult extends QuestionTags {
  /** Non-blocking problems, without a location prefix (callers add their own). */
  warnings: string[];
}

export const VALID_TAGS = ['fixed', 'fixed-position', 'fixed-options', 'separate-page'] as const;
export type ValidTag = typeof VALID_TAGS[number];

export interface ValidationContext {
  /** Where the question is, used as the message prefix, e.g. "Question 3 (line 14)". */
  location?: string;
  questionNumber?: number;
  lineNumber?: number;
  format?: 'latex' | 'csv' | 'excel';
  /** Number of options; 0 means open-ended. Omit when unknown. */
  optionCount?: number;
}

const letterOf = (index: number) => String.fromCharCode(65 + index);

/**
 * Parse and validate question tags. A tag may carry a value after a colon; only
 * `fixed-options` takes one (option letters A-E written together, e.g. `fixed-options:DE`).
 * `correct:X` is handled by the LaTeX parser before this is called.
 *
 * @throws Error listing every problem in the tags (unknown tags, bad or out-of-range letters)
 *
 * @example
 * validateQuestionTags(['fixed-position', 'fixed-options:e'], { optionCount: 5 })
 * // { fixed: false, fixedPosition: true, fixedOptions: false, pinnedOptions: [4], ... }
 */
export function validateQuestionTags(
  tags: string[],
  context: ValidationContext = {}
): TagValidationResult {
  const contextStr = context.location
    ? context.location
    : context.questionNumber
    ? `Question ${context.questionNumber}`
    : context.lineNumber
      ? `Line ${context.lineNumber}`
      : 'Question';

  // Tags match in any case; messages quote them as written.
  const writtenTags = tags.map(t => t.trim()).filter(t => t !== '');

  const names: string[] = [];
  const invalidTags: string[] = [];
  const errors: string[] = [];
  const pins = new Set<number>();
  const pinTags: string[] = [];

  for (const tag of writtenTags) {
    const colon = tag.indexOf(':');
    const name = (colon === -1 ? tag : tag.slice(0, colon)).trim().toLowerCase();
    const value = colon === -1 ? undefined : tag.slice(colon + 1).trim();

    if (!VALID_TAGS.includes(name as ValidTag)) {
      invalidTags.push(tag);
      continue;
    }
    if (value === undefined) {
      names.push(name);
      continue;
    }
    if (name !== 'fixed-options') {
      errors.push(`'${name}' does not take a value (found '${tag}').`);
      names.push(name);
      continue;
    }
    if (!/^[a-e]+$/i.test(value)) {
      errors.push(
        `'${tag}' needs option letters A-E written together, e.g. 'fixed-options:E' or 'fixed-options:DE'.`
      );
      continue;
    }
    const letters = value.toUpperCase();
    const indices = [...letters].map(letter => letter.charCodeAt(0) - 65);
    const optionCount = context.optionCount;
    if (optionCount !== undefined && optionCount > 0) {
      const outside = indices.filter(i => i >= optionCount);
      if (outside.length > 0) {
        errors.push(
          `'fixed-options:${letters}' keeps option ${outside.map(letterOf).join(', ')} in place, ` +
          `but this question has ${optionCount} option${optionCount === 1 ? '' : 's'} (A-${letterOf(optionCount - 1)}).`
        );
        continue;
      }
    }
    indices.forEach(i => pins.add(i));
    pinTags.push(`fixed-options:${letters}`);
  }

  if (invalidTags.length > 0) {
    const validList =
      context.format === 'latex'
        ? `${VALID_TAGS.join(', ')}, fixed-options:X, correct:X`
        : `${VALID_TAGS.join(', ')}, fixed-options:X`;
    let message =
      `Invalid tag${invalidTags.length > 1 ? 's' : ''}: ${invalidTags.join(', ')}. ` +
      `Valid tags: ${validList}`;
    const isSpreadsheet = context.format === 'csv' || context.format === 'excel';
    if (isSpreadsheet && invalidTags.some(t => /^correct:/i.test(t))) {
      message += `. In CSV/Excel files the correct answer goes in the Correct column.`;
    }
    if (invalidTags.some(t => /^[a-e]$/i.test(t))) {
      message += `. To keep several options in place, write the letters together, e.g. 'fixed-options:DE'.`;
    }
    errors.unshift(message);
  }

  if (errors.length > 0) {
    throw new Error(`${contextStr}: ${errors.join(' ')}`);
  }

  const fixed = names.includes('fixed');
  let fixedPosition = names.includes('fixed-position');
  let fixedOptions = names.includes('fixed-options');
  let pinnedOptions = [...pins].sort((a, b) => a - b);
  const pinWritten = pinTags.map(t => `'${t}'`).join(' and ');
  const warnings: string[] = [];

  if (fixed && fixedOptions) {
    warnings.push(`'fixed' already locks the option order, so 'fixed-options' is redundant.`);
    fixedOptions = false;
  }
  if (fixed && fixedPosition) {
    warnings.push(`'fixed' already locks the position, so 'fixed-position' is redundant.`);
    fixedPosition = false;
  }
  if (pinnedOptions.length > 0 && (fixed || fixedOptions)) {
    warnings.push(
      `'${fixed ? 'fixed' : 'fixed-options'}' already keeps every option in place, so ${pinWritten} is redundant.`
    );
    pinnedOptions = [];
  }
  if (context.optionCount === 0 && fixedOptions) {
    warnings.push(`'fixed-options' is ignored because this question has no options (open-ended).`);
    fixedOptions = false;
  }
  if (context.optionCount === 0 && pinnedOptions.length > 0) {
    warnings.push(`${pinWritten} is ignored because this question has no options (open-ended).`);
    pinnedOptions = [];
  }
  if (
    context.optionCount !== undefined &&
    context.optionCount > 0 &&
    pinnedOptions.length > 0 &&
    pinnedOptions.length >= context.optionCount - 1
  ) {
    warnings.push(`${pinWritten} leaves no options to shuffle, so it works like plain 'fixed-options'.`);
  }

  return {
    fixed,
    fixedPosition,
    fixedOptions,
    pinnedOptions,
    separatePage: names.includes('separate-page'),
    warnings,
  };
}

/** "Found 2 errors in the questions:" followed by a numbered list, as the LaTeX reader does (CSV/Excel rows). */
export function formatRowErrors(errors: string[]): string {
  return (
    `Found ${errors.length} error${errors.length > 1 ? "s" : ""} in the questions:\n\n` +
    errors.map((err, idx) => `${idx + 1}. ${err}`).join("\n\n")
  );
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
  const position = tags.fixed || tags.fixedPosition;
  const options = tags.fixed || tags.fixedOptions;
  const pinned = !options && tags.pinnedOptions.length > 0;
  const pinnedText = `option${tags.pinnedOptions.length > 1 ? 's' : ''} ${tags.pinnedOptions
    .map(letterOf)
    .join(', ')} kept in place`;

  if (position && options) {
    parts.push('fixed position and options');
  } else if (position) {
    parts.push(pinned ? `fixed position, ${pinnedText}` : 'fixed position only');
  } else if (options) {
    parts.push('fixed options only');
  } else if (pinned) {
    parts.push(pinnedText);
  } else {
    parts.push('shuffled position and options');
  }

  if (tags.separatePage) {
    parts.push('on separate page');
  }

  return parts.join(', ');
}
