import { DeterministicRNG } from "./rng";
import type {
  Question,
  ExamData,
  VersionMapping,
  ExamSettings,
} from "../types";

/**
 * Generates a 2D array mapping questions and options from master to all versions
 * @param {GenerationState} state - The generation state containing all exam data
 * @param {ExamData} master - The master exam data
 * @returns {string[][]} 2D array where each row represents a question-option mapping
 */
export function generateQuestionOptionMapping(state, master) {
  const { versions, mappings } = state;
  const numVersions = versions.length;

  // Create header row using actual version names
  const header = ["Q", "Option", "Master_Correct"];
  for (let i = 0; i < numVersions; i++) {
    const versionName = versions[i].name;
    header.push(`${versionName}_Q`, `${versionName}_Opt`);
  }

  const rows = [header];

  // Process each question in master
  master.questions.forEach((masterQuestion, masterIdx) => {
    const masterQNo = masterIdx + 1;
    const numOptions = masterQuestion.choices[0]?.length || 0;
    const correctIndex = masterQuestion.choices[1]; // Index of correct answer in master

    // If question has no options, create a single row for the question
    if (numOptions === 0) {
      const row = [masterQNo.toString(), "", ""];

      // Find mapping for this question in each version
      for (let versionIdx = 0; versionIdx < numVersions; versionIdx++) {
        const versionName = versions[versionIdx].name;
        const versionNumber = versionName.split("_")[1] || versionName;

        const mapping = mappings.find(
          (m) => m.masterQNo === masterQNo && m.version === versionNumber
        );

        if (mapping) {
          row.push(mapping.versionQNo.toString(), "");
        } else {
          row.push("", "");
        }
      }

      rows.push(row);
    } else {
      // Create a row for each option
      for (let optIdx = 0; optIdx < numOptions; optIdx++) {
        const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D, E, etc.
        const isCorrectInMaster = optIdx === correctIndex ? "YES" : "";
        const row = [masterQNo.toString(), optionLetter, isCorrectInMaster];

        // Find mapping for this question in each version
        for (let versionIdx = 0; versionIdx < numVersions; versionIdx++) {
          const versionName = versions[versionIdx].name;
          const versionNumber = versionName.split("_")[1] || versionName;

          const mapping = mappings.find(
            (m) => m.masterQNo === masterQNo && m.version === versionNumber
          );

          if (mapping) {
            row.push(mapping.versionQNo.toString());

            // Map the option using the perm string
            if (mapping.perm && mapping.perm.length > optIdx) {
              row.push(mapping.perm[optIdx]);
            } else {
              row.push("");
            }
          } else {
            row.push("", "");
          }
        }

        rows.push(row);
      }
    }
  });

  return rows;
}

export function generateVersionLabel(
  index: number,
  numbering: "ALPHA" | "NUMERIC" | "ROMAN"
): string {
  switch (numbering) {
    case "ALPHA":
      return String.fromCharCode(65 + index); // A, B, C...
    case "NUMERIC":
      return (index + 1).toString(); // 1, 2, 3...
    case "ROMAN": {
      const romanNumerals = [
        "I",
        "II",
        "III",
        "IV",
        "V",
        "VI",
        "VII",
        "VIII",
        "IX",
        "X",
        "XI",
        "XII",
        "XIII",
        "XIV",
        "XV",
        "XVI",
        "XVII",
        "XVIII",
        "XIX",
        "XX",
        "XXI",
        "XXII",
        "XXIII",
        "XXIV",
        "XXV",
        "XXVI",
      ];
      return romanNumerals[index] || (index + 1).toString();
    }
    default:
      return String.fromCharCode(65 + index);
  }
}

export function partitionQuestions(
  questions: Question[],
  groupSizes: number[]
): Question[][] {
  const groups: Question[][] = [];
  let startIndex = 0;

  for (const size of groupSizes) {
    const group = questions
      .slice(startIndex, startIndex + size)
      .map((q, index) => ({
        ...q,
        group: groups.length + 1,
        order: index + 1,
      }));
    groups.push(group);
    startIndex += size;
  }

  return groups;
}

export function generateExamVersions(
  masterQuestions: Question[],
  settings: ExamSettings,
  baseSeed: string
): { versions: ExamData[]; mappings: VersionMapping[] } {
  // Parse group configurations with shuffle flags
  type GroupConfig = {
    size: number;
    shuffleGroup: boolean;
  };

  const groupConfigs: GroupConfig[] = settings.groups.split(",").map((g) => {
    const trimmed = g.trim();
    const hasParens = trimmed.startsWith("(") && trimmed.endsWith(")");
    const size = parseInt(hasParens ? trimmed.slice(1, -1) : trimmed);
    return { size, shuffleGroup: hasParens };
  });

  // Use existing partitionQuestions with just the sizes
  const groupSizes = groupConfigs.map((c) => c.size);
  const questionGroups = partitionQuestions(masterQuestions, groupSizes);

  const numVersions = settings.numberofvestions;

  const versions: ExamData[] = [];
  const mappings: VersionMapping[] = [];

  for (let versionIndex = 0; versionIndex < numVersions; versionIndex++) {
    const versionLabel = generateVersionLabel(
      versionIndex,
      settings.code_numbering
    );
    const versionSeed = `${baseSeed}#${versionLabel}`;
    const rng = new DeterministicRNG(versionSeed);

    const versionQuestions: Question[] = [];
    let questionCounter = 1;

    // Determine which groups can shuffle and their available positions
    const shuffleableGroupIndices: number[] = [];
    const fixedGroupData: Array<{ index: number; position: number }> = [];

    groupConfigs.forEach((config, index) => {
      if (config.shuffleGroup) {
        shuffleableGroupIndices.push(index);
      } else {
        fixedGroupData.push({ index, position: index });
      }
    });

    // Create array of all group indices in order
    const orderedGroupIndices = new Array(groupConfigs.length);

    // Place fixed groups in their original positions
    fixedGroupData.forEach(({ index, position }) => {
      orderedGroupIndices[position] = index;
    });

    // Shuffle the shuffleable group indices
    const shuffledGroupIndices = rng.shuffle([...shuffleableGroupIndices]);

    // Fill remaining positions with shuffled groups
    let shuffledIdx = 0;
    for (let i = 0; i < orderedGroupIndices.length; i++) {
      if (orderedGroupIndices[i] === undefined) {
        orderedGroupIndices[i] = shuffledGroupIndices[shuffledIdx++];
      }
    }

    // Process groups in their new order
    orderedGroupIndices.forEach((groupIndex) => {
      const group = questionGroups[groupIndex];
      const config = groupConfigs[groupIndex];

      // If group is shuffleable (has parens), keep questions in order
      if (config.shuffleGroup) {
        // No shuffling within group - process questions as-is
        group.forEach((question) => {
          let shuffledChoices: any[];
          let newCorrectIndex: number;
          let permString: string;

          if (question.fixedOptions) {
            // Respect fixedOptions even in shuffleable groups
            shuffledChoices = question.choices[0];
            newCorrectIndex = question.choices[1];
            permString = "ABCDE";
          } else {
            // Shuffle options for regular questions
            const actualOptionCount = question.choices[0].length;
            const optionIndices = Array.from(
              { length: actualOptionCount },
              (_, i) => i
            );
            const shuffledIndices = rng.shuffle(optionIndices);
            shuffledChoices = shuffledIndices.map(
              (index) => question.choices[0][index]
            );
            newCorrectIndex = shuffledIndices.indexOf(question.choices[1]);
            permString = shuffledIndices
              .map((i) => String.fromCharCode(65 + i))
              .join("");
          }

          const versionQuestion: Question = {
            ...question,
            order: questionCounter,
            choices: [shuffledChoices, newCorrectIndex, null],
          };

          versionQuestions.push(versionQuestion);

          const masterQNo =
            masterQuestions.findIndex((mq) => mq.text === question.text) + 1;
          const correctLetter = String.fromCharCode(65 + newCorrectIndex);

          mappings.push({
            group: groupIndex + 1,
            masterQNo,
            version: versionLabel,
            versionQNo: questionCounter,
            perm: permString,
            correct: correctLetter,
            points: 1,
          });

          questionCounter++;
        });
      } else {
        // Original behavior: shuffle questions within non-parenthesized groups
        const fixedPositionQuestions = group.filter((q) => q.fixed);
        const fixedOptionsQuestions = group.filter(
          (q) => q.fixedOptions && !q.fixed
        );
        const regularQuestions = group.filter(
          (q) => !q.fixed && !q.fixedOptions
        );

        const shufflableQuestions = [
          ...fixedOptionsQuestions,
          ...regularQuestions,
        ];
        const shuffledQuestions = rng.shuffle(shufflableQuestions);

        const combinedQuestions = [...group].sort((a, b) => {
          if (a.fixed && b.fixed) {
            return group.indexOf(a) - group.indexOf(b);
          }
          if (a.fixed && !b.fixed) {
            return group.indexOf(a) - group.indexOf(b);
          }
          if (!a.fixed && b.fixed) {
            return group.indexOf(a) - group.indexOf(b);
          }
          return group.indexOf(a) - group.indexOf(b);
        });

        let shuffledIndex = 0;
        const finalQuestions = combinedQuestions.map((q) => {
          if (q.fixed) {
            return q;
          } else {
            return shuffledQuestions[shuffledIndex++];
          }
        });

        finalQuestions.forEach((question) => {
          let shuffledChoices: any[];
          let newCorrectIndex: number;
          let permString: string;

          if (question.fixed || question.fixedOptions) {
            shuffledChoices = question.choices[0];
            newCorrectIndex = question.choices[1];
            permString = "ABCDE";
          } else {
            const actualOptionCount = question.choices[0].length;
            const optionIndices = Array.from(
              { length: actualOptionCount },
              (_, i) => i
            );
            const shuffledIndices = rng.shuffle(optionIndices);
            shuffledChoices = shuffledIndices.map(
              (index) => question.choices[0][index]
            );
            newCorrectIndex = shuffledIndices.indexOf(question.choices[1]);
            permString = shuffledIndices
              .map((i) => String.fromCharCode(65 + i))
              .join("");
          }

          const versionQuestion: Question = {
            ...question,
            order: questionCounter,
            choices: [shuffledChoices, newCorrectIndex, null],
          };

          versionQuestions.push(versionQuestion);

          const masterQNo =
            masterQuestions.findIndex((mq) => mq.text === question.text) + 1;
          const correctLetter = String.fromCharCode(65 + newCorrectIndex);

          mappings.push({
            group: groupIndex + 1,
            masterQNo,
            version: versionLabel,
            versionQNo: questionCounter,
            perm: permString,
            correct: correctLetter,
            points: 1,
          });

          questionCounter++;
        });
      }
    });

    const versionData: ExamData = {
      name: `version_${versionLabel}`,
      ordering: null,
      preamble: "",
      questions: versionQuestions,
      kept_in_one_page: [],
    };

    versions.push(versionData);
  }

  return { versions, mappings };
}

export function generateCorrectnessSummary(
  masterQuestions: Question[],
  mappings: VersionMapping[]
): {
  questionNo: number;
  text: string;
  correctCounts: Record<string, number>;
}[] {
  return masterQuestions.map((question, index) => {
    const questionMappings = mappings.filter((m) => m.masterQNo === index + 1);
    const correctCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    questionMappings.forEach((mapping) => {
      correctCounts[mapping.correct]++;
    });

    return {
      questionNo: index + 1,
      text: question.text,
      correctCounts,
    };
  });
}
