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
