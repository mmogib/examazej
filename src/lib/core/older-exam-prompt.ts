/**
 * The prompt the Documentation gives for an AI assistant that turns the PDF of an exam made by an
 * older Examazej into the `_mapping.csv` the Regrade Tool reads (the columns of
 * `generateMappingCSV` in `latex.ts`). Old exams are graded with what was printed, never made
 * again, so the prompt reads the PDF and must not guess.
 */
export const OLDER_EXAM_MAPPING_PROMPT = `The attached PDF is a complete exam made by Examazej: the master version,
every version and the answer key page. Write a CSV file with exactly these
columns:

Group,Master Q#,Version,Version Q#,Permutation,Correct,Points

One row for every question of every version (not the master), in version order.
- Version: the version's name exactly as printed in the PDF. It may be a letter
  (A), a number (1) or a Roman numeral (II). Do not rename it.
- Version Q#: the question's number in that version.
- Master Q#: the number of the same question in the master version. The answer
  key page prints it in small type next to each answer.
- Group: the group of the master question. If I give you the group setting
  (for example 3,(2),[4]: master questions 1-3 are group 1, 4-5 group 2, 6-9
  group 3), use it; otherwise write 1.
- Permutation: the version's options in order, each written as the letter that
  option has in the master version (DEBAC means the version's option A is the
  master's option D). Leave it empty for a question with no options.
- Correct: the correct letter in that version, from the answer key page; @ for
  a question with no options.
- Points: 1.

If you cannot tell for certain which master option a version's option is, do
not guess: leave that Permutation empty and list the question and version after
the CSV. Check every row against the answer key page before you answer.`;
