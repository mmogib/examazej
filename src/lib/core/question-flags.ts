import type { Question } from "../types";

type FlagFields = Pick<Question, "fixed" | "fixedPosition" | "fixedOptions">;
type LockFields = FlagFields & Pick<Question, "choices" | "pinnedOptions">;

/** True when the question keeps its slot within its group (`fixed` or `fixed-position`). */
export function isPositionLocked(question: FlagFields): boolean {
  return Boolean(question.fixed || question.fixedPosition);
}

/** True when the question keeps its option order (`fixed` or `fixed-options`). */
export function areOptionsLocked(question: FlagFields): boolean {
  return Boolean(question.fixed || question.fixedOptions);
}

/** Letter of the correct option in this question's own option order, or null if open-ended. */
export function getCorrectLetter(question: Pick<Question, "choices">): string | null {
  const [options, correctIndex] = question.choices;
  if (options.length === 0) return null;
  return String.fromCharCode(65 + correctIndex);
}

/**
 * Letters of the options kept in place by `fixed-options:X`, e.g. "DE"; empty when none apply
 * (no pins, open-ended, or every option is already locked).
 */
export function getPinnedLetters(question: LockFields): string {
  const optionCount = question.choices[0].length;
  if (optionCount === 0 || areOptionsLocked(question)) return "";
  return (question.pinnedOptions ?? [])
    .filter((i) => i < optionCount)
    .map((i) => String.fromCharCode(65 + i))
    .join("");
}

/**
 * The canonical lock tags for a question, as every exporter writes them: `fixed`, or
 * `fixed-position` and/or `fixed-options` / `fixed-options:DE`. An option lock on an
 * open-ended question means nothing, so it is never written.
 */
export function getLockTags(question: LockFields): string[] {
  const hasOptions = question.choices[0].length > 0;
  const position = isPositionLocked(question);
  const options = Boolean(question.fixed || question.fixedOptions) && hasOptions;
  if (question.fixed || (position && options)) return ["fixed"];

  const tags: string[] = [];
  if (position) tags.push("fixed-position");
  if (options) {
    tags.push("fixed-options");
  } else {
    const pinned = getPinnedLetters(question);
    if (pinned) tags.push(`fixed-options:${pinned}`);
  }
  return tags;
}

/** Badge texts for a question's locks, e.g. ["Fixed Position", "Option E fixed"]. */
export function getLockLabels(question: LockFields): string[] {
  return getLockTags(question).map((tag) => {
    if (tag === "fixed") return "Fixed";
    if (tag === "fixed-position") return "Fixed Position";
    if (tag === "fixed-options") return "Fixed Options";
    const letters = tag.slice("fixed-options:".length).split("");
    return letters.length === 1
      ? `Option ${letters[0]} fixed`
      : `Options ${letters.join(", ")} fixed`;
  });
}
