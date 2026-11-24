/**
 * Plain-language descriptions of what a question's tags do, for the Questions page.
 */

import type { Question } from "../types";
import type { GroupMode } from "./group-config";
import { areOptionsLocked, isPositionLocked } from "./question-flags";

export const letter = (index: number) => String.fromCharCode(65 + index);

/** "A–D", "A, C", "B, C, E": three or more letters in a row are written as a range. */
export function letterRanges(indices: number[]): string {
  const runs: string[] = [];
  let i = 0;
  while (i < indices.length) {
    let j = i;
    while (j + 1 < indices.length && indices[j + 1] === indices[j] + 1) j++;
    runs.push(
      j - i >= 2 ? `${letter(indices[i])}–${letter(indices[j])}` : indices.slice(i, j + 1).map(letter).join(", ")
    );
    i = j + 1;
  }
  return runs.join(", ");
}

/** The pins that act: sorted, in range, none when all options are locked. */
export function activePins(question: Question): number[] {
  const count = question.choices[0].length;
  if (areOptionsLocked(question)) return [];
  return [...new Set(question.pinnedOptions ?? [])].filter((i) => i < count).sort((a, b) => a - b);
}

/** True when the question carries any lock, pin or own-page tag. */
export function isTagged(question: Question): boolean {
  return (
    isPositionLocked(question) ||
    (question.choices[0].length > 0 && areOptionsLocked(question)) ||
    activePins(question).length > 0 ||
    question.keepOnSeparatePage
  );
}

/**
 * What happens to this question in every version, e.g. "In every version: it moves within its
 * group; E stays E; A–D shuffle."
 */
export function describeEffect(question: Question, mode: GroupMode): string {
  const groupMoves = mode !== "standard";
  const place =
    mode === "ordered" || isPositionLocked(question)
      ? groupMoves
        ? "it keeps its place in its group, and the group moves"
        : "it keeps its place"
      : groupMoves
        ? "it moves within its group, and the group moves"
        : "it moves within its group";
  const count = question.choices[0].length;
  let options = "";
  if (count > 0) {
    if (areOptionsLocked(question)) {
      options = "the options stay in order";
    } else {
      const pins = activePins(question);
      const free = Array.from({ length: count }, (_, i) => i).filter((i) => !pins.includes(i));
      if (pins.length === 0) options = "all options shuffle";
      else {
        const kept = pins.map((i) => `${letter(i)} stays ${letter(i)}`).join(", ");
        options = free.length > 1 ? `${kept}; ${letterRanges(free)} shuffle` : `${kept}; no option can move`;
      }
    }
  }
  return `In every version: ${place}${options ? `; ${options}` : ""}.`;
}
