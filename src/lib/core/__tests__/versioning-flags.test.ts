import { describe, expect, it } from "vitest";
import { getDefaultSettings } from "../settings";
import { generateExamVersions } from "../versioning";
import type { ExamSettings, Question, VersionMapping } from "../../types";

const options = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `o${i}` }));
const q = (text: string, n: number, correct: number, extra: Partial<Question> = {}): Question => ({
  text,
  group: 1,
  order: 1,
  choices: [options(n), correct, null],
  keepOnSeparatePage: false,
  ...extra,
});

const settingsFor = (groups: string, numberofvestions: number) =>
  ({ ...getDefaultSettings(), groups, numberofvestions }) as ExamSettings;

const rowsOf = (mappings: VersionMapping[], version: string) =>
  mappings
    .filter((m) => m.version === version)
    .map((m) => `${m.versionQNo}:Q${m.masterQNo}:${m.perm}:${m.correct}`)
    .join(" ");

describe("shuffle output is unchanged by the tag rework (seed reproducibility)", () => {
  // Every pre-existing flag in every group mode. Captured from v1.7.0 output.
  const questions: Question[] = [
    q("Q1 regular", 4, 1),
    q("Q2 fixed", 4, 0, { fixed: true }),
    q("Q3 fixedOptions", 5, 2, { fixedOptions: true }),
    q("Q4 regular", 3, 0),
    q("Q5 fixed in a (n) group", 4, 0, { fixed: true }),
    q("Q6 fixedOptions", 4, 3, { fixedOptions: true }),
    q("Q7 regular", 5, 4),
    q("Q8 fixed", 3, 0, { fixed: true }),
    q("Q9 open-ended", 0, 0),
    q("Q10 regular", 4, 2),
    q("Q11 open-ended", 0, 0),
  ];

  // v1.7.0 output. The ONLY intended difference is Q5: `fixed` used to let its options
  // shuffle inside a (n) group. It now keeps them (perm ABCDE, answer A), and every other
  // question is byte-for-byte what v1.7.0 produced for this seed.
  const v170: Record<string, { order: string; rows: string }> = {
    A: { order: "Q3 Q2 Q1 Q4 Q5 Q6 Q9 Q8 Q7 Q10 Q11", rows: "1:Q3:ABCDE:C 2:Q2:ABCDE:A 3:Q1:BADC:A 4:Q4:BAC:B 5:Q5:ADCB:A 6:Q6:ABCDE:D 7:Q9::@ 8:Q8:ABCDE:A 9:Q7:BDCEA:D 10:Q10:ADBC:D 11:Q11::@" },
    B: { order: "Q3 Q2 Q1 Q10 Q11 Q9 Q8 Q7 Q4 Q5 Q6", rows: "1:Q3:ABCDE:C 2:Q2:ABCDE:A 3:Q1:ADCB:D 4:Q10:ACBD:B 5:Q11::@ 6:Q9::@ 7:Q8:ABCDE:A 8:Q7:DACBE:E 9:Q4:ACB:A 10:Q5:DCBA:D 11:Q6:ABCDE:D" },
    C: { order: "Q3 Q2 Q1 Q7 Q8 Q9 Q4 Q5 Q6 Q10 Q11", rows: "1:Q3:ABCDE:C 2:Q2:ABCDE:A 3:Q1:BCAD:A 4:Q7:AECBD:B 5:Q8:ABCDE:A 6:Q9::@ 7:Q4:ACB:A 8:Q5:ACBD:A 9:Q6:ABCDE:D 10:Q10:CBDA:A 11:Q11::@" },
    D: { order: "Q1 Q2 Q3 Q4 Q5 Q6 Q10 Q11 Q7 Q8 Q9", rows: "1:Q1:BADC:A 2:Q2:ABCDE:A 3:Q3:ABCDE:C 4:Q4:CBA:C 5:Q5:ADCB:A 6:Q6:ABCDE:D 7:Q10:CBAD:A 8:Q11::@ 9:Q7:ECDAB:A 10:Q8:ABCDE:A 11:Q9::@" },
    E: { order: "Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 Q9 Q10 Q11", rows: "1:Q1:DACB:D 2:Q2:ABCDE:A 3:Q3:ABCDE:C 4:Q4:ABC:A 5:Q5:CABD:B 6:Q6:ABCDE:D 7:Q7:ACDEB:D 8:Q8:ABCDE:A 9:Q9::@ 10:Q10:BDAC:D 11:Q11::@" },
  };

  const { versions, mappings } = generateExamVersions(
    questions,
    settingsFor("3,(3),[3],(2)", 5),
    "golden-seed"
  );

  it("fixed-position instead of fixed in the (n) group reproduces v1.7.0 exactly", () => {
    // What the answer-key warning suggests for files made before v1.8.
    const swapped = questions.map((question) =>
      question.text.startsWith("Q5") ? { ...question, fixed: false, fixedPosition: true } : question
    );
    const swappedRun = generateExamVersions(swapped, settingsFor("3,(3),[3],(2)", 5), "golden-seed");
    for (const label of Object.keys(v170)) {
      expect(rowsOf(swappedRun.mappings, label), label).toBe(v170[label].rows);
    }
  });

  it.each(Object.keys(v170))("version %s matches v1.7.0 except the fixed (n) question", (label) => {
    const version = versions.find((v) => v.name === `version_${label}`)!;
    expect(version.questions.map((x) => x.text.split(" ")[0]).join(" ")).toBe(v170[label].order);
    const expected = v170[label].rows.replace(/(\d+:Q5:)[A-E]+:[A-E]/, "$1ABCDE:A");
    expect(rowsOf(mappings, label)).toBe(expected);
  });
});

describe("fixed-position", () => {
  it("keeps the question's slot in a shuffled group while its options still shuffle", () => {
    const questions = [
      q("first", 4, 0),
      q("anchored", 4, 0, { fixedPosition: true }),
      q("third", 4, 0),
      q("fourth", 4, 0),
    ];
    const { versions, mappings } = generateExamVersions(questions, settingsFor("4", 8), "fp-seed");

    for (const version of versions) {
      expect(version.questions[1].text).toBe("anchored");
    }
    const perms = new Set(mappings.filter((m) => m.masterQNo === 2).map((m) => m.perm));
    expect(perms.size).toBeGreaterThan(1);
  });

  it("keeps the slot within a [n] group, and moves with the group", () => {
    const questions = [
      q("solo", 2, 0),
      q("anchored", 3, 0, { fixedPosition: true }),
      q("other", 3, 0),
    ];
    const { versions } = generateExamVersions(questions, settingsFor("[1],[2]", 8), "fp-group");
    const slots = versions.map((v) => v.questions.findIndex((x) => x.text === "anchored"));
    // The group moves (position 1 or 2 overall)...
    expect(new Set(slots)).toEqual(new Set([0, 1]));
    // ...but inside its group the question always keeps the first slot.
    for (const version of versions) {
      const at = version.questions.findIndex((x) => x.text === "anchored");
      expect(version.questions[at + 1]?.text).toBe("other");
    }
  });

  it("combined with fixed-options locks both, like fixed", () => {
    const questions = [q("first", 4, 2), q("both", 4, 3, { fixedPosition: true, fixedOptions: true }), q("third", 4, 0)];
    const { versions, mappings } = generateExamVersions(questions, settingsFor("3", 6), "fp-both");
    for (const version of versions) expect(version.questions[1].text).toBe("both");
    for (const m of mappings.filter((m) => m.masterQNo === 2)) expect(m.correct).toBe("D");
  });
});

describe("fixed inside a (n) group", () => {
  it("locks the options, and leaves every other question's shuffle untouched", () => {
    const build = (fixed: boolean) => [
      q("before", 4, 0),
      q("target", 4, 1, fixed ? { fixed: true } : {}),
      q("after", 4, 2),
      q("other group", 4, 3),
    ];
    const settings = settingsFor("(3),(1)", 6);
    const locked = generateExamVersions(build(true), settings, "paren-seed");
    const free = generateExamVersions(build(false), settings, "paren-seed");

    for (const m of locked.mappings.filter((m) => m.masterQNo === 2)) {
      expect(m.perm).toBe("ABCDE");
      expect(m.correct).toBe("B");
    }
    const others = (ms: VersionMapping[]) =>
      ms.filter((m) => m.masterQNo !== 2).map((m) => `${m.version}:${m.versionQNo}:${m.perm}`);
    expect(others(locked.mappings)).toEqual(others(free.mappings));
  });
});

describe("pinned options (fixed-options:X)", () => {
  // 5 options; option E ("None of the above") is pinned.
  const build = (pinned?: number[], correct = 0) => [
    q("first", 4, 0),
    q("target", 5, correct, pinned ? { pinnedOptions: pinned } : {}),
    q("third", 4, 1),
    q("fourth", 3, 2),
  ];

  it.each([
    ["standard group", "4"],
    ["[n] group", "[2],[2]"],
    ["(n) group", "(2),(2)"],
  ])("keep their letter in every version while the rest shuffle (%s)", (_label, groups) => {
    const { versions, mappings } = generateExamVersions(build([4]), settingsFor(groups, 10), "pin-seed");
    const target = mappings.filter((m) => m.masterQNo === 2);
    expect(target).toHaveLength(10);
    for (const m of target) expect(m.perm[4]).toBe("E");
    // The other four really do shuffle.
    expect(new Set(target.map((m) => m.perm.slice(0, 4))).size).toBeGreaterThan(1);
    // The rendered options agree with the mapping.
    for (const version of versions) {
      const question = version.questions.find((x) => x.text === "target")!;
      expect(question.choices[0][4].text).toBe("o4");
    }
  });

  it("several pins each keep their letter", () => {
    const { mappings } = generateExamVersions(build([0, 3]), settingsFor("4", 10), "pin-many");
    for (const m of mappings.filter((m) => m.masterQNo === 2)) {
      expect(m.perm[0]).toBe("A");
      expect(m.perm[3]).toBe("D");
    }
  });

  it("a pinned correct answer is the same letter in every version; an unpinned one still moves", () => {
    const pinnedAnswer = generateExamVersions(build([4], 4), settingsFor("4", 10), "pin-answer");
    for (const m of pinnedAnswer.mappings.filter((m) => m.masterQNo === 2)) expect(m.correct).toBe("E");

    const movingAnswer = generateExamVersions(build([4], 1), settingsFor("4", 10), "pin-answer");
    const letters = new Set(movingAnswer.mappings.filter((m) => m.masterQNo === 2).map((m) => m.correct));
    expect(letters.has("E")).toBe(false);
    expect(letters.size).toBeGreaterThan(1);
  });

  it.each(["4", "[2],[2]", "(2),(2)"])(
    "never change the order or shuffle of any other question (groups %s)",
    (groups) => {
      const settings = settingsFor(groups, 8);
      const pinned = generateExamVersions(build([4]), settings, "pin-isolation");
      const plain = generateExamVersions(build(), settings, "pin-isolation");
      const others = (ms: VersionMapping[]) =>
        ms.filter((m) => m.masterQNo !== 2).map((m) => `${m.version}:${m.versionQNo}:${m.perm}`);
      expect(others(pinned.mappings)).toEqual(others(plain.mappings));
      const positions = (ms: VersionMapping[]) =>
        ms.filter((m) => m.masterQNo === 2).map((m) => `${m.version}:${m.versionQNo}`);
      expect(positions(pinned.mappings)).toEqual(positions(plain.mappings));
    }
  );
});
