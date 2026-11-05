// Type definitions for Examazej

export interface ExamSettings {
  university: string;
  department: string;
  term: string;
  coursecode: string;
  examname: string;
  examdate: string;
  timeallowed: string;
  numberofvestions: number;
  groups: string;
  examtype: string;
  code_name: string;
  code_numbering: 'ALPHA' | 'NUMERIC' | 'ROMAN';
  paper_size: 'A4' | 'Letter';
  instructions: string;
  includeCoverPage: boolean;
  includeAcademicIntegrityPledge: boolean;
  academicIntegrityPledgeText: string;
  seed?: string;
}

export interface QuestionChoice {
  text: string;
}

export interface Question {
  text: string;
  group: number;
  order: number;
  /** [options, index of the correct option (the single source of truth), null] */
  choices: [QuestionChoice[], number, null];
  fixed?: boolean; // Locks BOTH the question's position within its group and its option order
  fixedPosition?: boolean; // Locks only the position within its group; options still shuffle
  fixedOptions?: boolean; // Locks only the option order; the position can still change
  /**
   * Indices (into this question's own options) of options that keep their letter in every
   * version while the others shuffle around them: `%{#fixed-options:E}`.
   */
  pinnedOptions?: number[];
  /**
   * Set when the pin came from `%{#fixed-options:X}` in a file made before v1.8, where that
   * tag locked every option. Versions made from such a file differ from the ones made before
   * v1.8 with the same seed, so the answer key page warns about it.
   */
  legacyPin?: {
    /** True when the file had no `%{#correct:X}` and the answer was taken from the letter. */
    answerFromLetter: boolean;
  };
  /**
   * Set on a `fixed` question from a file made before v1.8. Inside a `(n)` group, v1.7
   * shuffled such a question's options by mistake, so the answer key page warns when it
   * lands in one.
   */
  legacyFixed?: boolean;
  /**
   * @deprecated Read the answer from `choices[1]` (see `getCorrectLetter`). Older session
   * files carry this field; nothing writes or reads it any more.
   */
  correctOptionLetter?: string;
  keepOnSeparatePage: boolean; // If true, question will be placed on its own page
}

export interface ExamData {
  name: string;
  ordering: null;
  preamble: string;
  questions: Question[];
  kept_in_one_page: unknown[];
}

export interface ExamVersion extends ExamData {
  code?: string;
}

export interface ExamJSON {
  setting: ExamSettings;
  exam: ExamData;
  options_order: Record<string, unknown>;
}

export interface ParsedLatexTemplate {
  settings?: Partial<ExamSettings>;
  questions: Omit<Question, 'group' | 'order'>[];
  preamble?: string;
  /** Non-blocking problems found while reading the file (ignored tags, older files). */
  warnings?: string[];
  /** The file's `app_version` stamp as written; absent in files made before v1.8.0. */
  appVersion?: string;
}

/** What the upload step learned about the file, shown on the Details page. */
export interface ImportInfo {
  warnings: string[];
  /** Which app made the file, e.g. "Examazej 1.8.0"; omitted when unknown. */
  madeWith?: string;
}

export interface VersionMapping {
  group: number;
  masterQNo: number;
  version: string;
  versionQNo: number;
  perm: string;
  correct: string;
  points?: number;
}

export interface GenerationState {
  settings: ExamSettings;
  questions: Question[];
  versions: ExamData[];
  mappings: VersionMapping[];
  seed: string;
}
