// Type definitions for the Exam Generator application

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
  seed?: string;
}

export interface QuestionChoice {
  text: string;
}

export interface Question {
  text: string;
  group: number;
  order: number;
  choices: [QuestionChoice[], number, null];
  fixed?: boolean; // If true, question order and options won't be shuffled
}

export interface ExamData {
  name: string;
  ordering: null;
  preamble: string;
  questions: Question[];
  kept_in_one_page: any[];
}

export interface ExamJSON {
  setting: ExamSettings;
  exam: ExamData;
  options_order: Record<string, any>;
}

export interface ParsedLatexTemplate {
  settings?: Partial<ExamSettings>;
  questions: Omit<Question, 'group' | 'order'>[];
  preamble?: string;
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