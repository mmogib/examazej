/**
 * The `groups` setting, e.g. `5,(3),[3]`:
 *   5    standard: the group keeps its place; its questions shuffle within it
 *   (5)  the group moves; its questions keep their order (dependent questions)
 *   [5]  the group moves; its questions shuffle within it (topic groups)
 */

export interface GroupConfig {
  size: number;
  shuffleGroupPosition: boolean; // true for (5) and [5]
  shuffleQuestionsWithin: boolean; // true for 5 and [5], false for (5)
}

export function parseGroupConfigs(groups: string): GroupConfig[] {
  return groups.split(",").map((g) => {
    const trimmed = g.trim();

    // Check for parentheses: (5)
    const hasParens = trimmed.startsWith("(") && trimmed.endsWith(")");

    // Check for square brackets: [5]
    const hasBrackets = trimmed.startsWith("[") && trimmed.endsWith("]");

    // Extract size
    let size: number;
    if (hasParens) {
      size = parseInt(trimmed.slice(1, -1));
    } else if (hasBrackets) {
      size = parseInt(trimmed.slice(1, -1));
    } else {
      size = parseInt(trimmed);
    }

    // Determine shuffling behavior
    // - shuffleGroupPosition: true for (5) and [5], false for 5
    // - shuffleQuestionsWithin: false only for (5), true for 5 and [5]
    const shuffleGroupPosition = hasParens || hasBrackets;
    const shuffleQuestionsWithin = !hasParens; // false only for (5)

    return { size, shuffleGroupPosition, shuffleQuestionsWithin };
  });
}

/** `5` standard, `(5)` ordered (dependent questions), `[5]` topic. */
export type GroupMode = "standard" | "ordered" | "topic";

export interface GroupLayout {
  /** 1-based group number. */
  number: number;
  /** 0-based index of the group's first question in the master list. */
  start: number;
  size: number;
  mode: GroupMode;
  /** The group as written in the setting, e.g. "(3)". */
  label: string;
}

/** The groups of a valid setting, in master order (the partition `generateExamVersions` uses). */
export function describeGroups(groups: string, questionCount: number): GroupLayout[] {
  const tokens = groups.split(",").map((g) => g.trim());
  const layout: GroupLayout[] = [];
  let start = 0;
  parseGroupConfigs(groups).forEach((config, i) => {
    if (!(config.size > 0) || start >= questionCount) return;
    const size = Math.min(config.size, questionCount - start);
    const mode: GroupMode = !config.shuffleQuestionsWithin
      ? "ordered"
      : config.shuffleGroupPosition
        ? "topic"
        : "standard";
    layout.push({ number: i + 1, start, size, mode, label: tokens[i] });
    start += config.size;
  });
  return layout;
}

/**
 * Problems with a group setting as typed on the Details page, e.g. "Mismatched parentheses in:
 * "(3"" or a sum that differs from the number of questions. Empty when it can be used.
 */
export function getGroupPartitionErrors(groupPartition: string, questionCount: number): string[] {
  const errors: string[] = [];
  const groupTokens = groupPartition.split(",").map((g) => g.trim());
  const groups: number[] = [];

  for (const token of groupTokens) {
    const openParens = (token.match(/\(/g) || []).length;
    const closeParens = (token.match(/\)/g) || []).length;
    const openBrackets = (token.match(/\[/g) || []).length;
    const closeBrackets = (token.match(/\]/g) || []).length;

    if (openParens !== closeParens) {
      errors.push(`Mismatched parentheses in: "${token}"`);
      continue;
    }
    if (openBrackets !== closeBrackets) {
      errors.push(`Mismatched square brackets in: "${token}"`);
      continue;
    }
    if (openParens > 1 || openBrackets > 1) {
      errors.push(`Multiple or nested brackets not allowed: "${token}"`);
      continue;
    }
    if (openParens > 0 && openBrackets > 0) {
      errors.push(`Cannot mix parentheses and brackets: "${token}". Use one or the other`);
      continue;
    }
    // Invalid formats like "(5,10)" or "[5,10]"
    if (openParens === 1 || openBrackets === 1) {
      const innerContent = token.slice(1, -1).trim();
      if (innerContent.includes(",")) {
        errors.push(`Comma inside brackets not allowed: "${token}". Use separate groups instead`);
        continue;
      }
    }

    const num = parseInt(token.replace(/[()[\]]/g, ""));
    if (isNaN(num)) {
      errors.push(`Invalid group size: "${token}"`);
      continue;
    }
    if (num <= 0) {
      errors.push(`Group size must be positive: "${token}"`);
      continue;
    }
    groups.push(num);
  }

  // The sum is checked only when every group was read.
  if (groups.length === groupTokens.length) {
    const groupSum = groups.reduce((sum, g) => sum + g, 0);
    if (groupSum !== questionCount) {
      errors.push(`Group partition must sum to ${questionCount} questions (currently sums to ${groupSum})`);
    }
  }
  return errors;
}

/** 0-based indices of the questions that fall in a `(n)` group. */
export function findQuestionsInParenGroups(questionCount: number, groups: string): number[] {
  const indices: number[] = [];
  let start = 0;
  for (const config of parseGroupConfigs(groups)) {
    if (!(config.size > 0)) break; // malformed setting: reported elsewhere
    if (!config.shuffleQuestionsWithin) {
      for (let i = start; i < Math.min(start + config.size, questionCount); i++) indices.push(i);
    }
    start += config.size;
  }
  return indices;
}
