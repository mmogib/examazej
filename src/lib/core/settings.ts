import type { ExamSettings } from '../types';

export function getDefaultSettings(): Partial<ExamSettings> {
  // Get current date in the requested format
  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const formattedDate = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate().toString().padStart(2, '0')}, ${currentDate.getFullYear()}`;

  return {
    university: "King Fahd University of Petroleum and Minerals",
    department: "Department of Mathematics",
    coursecode: "MATH XXX",
    examname: "EXAM NAME",
    examdate: formattedDate,
    timeallowed: "120 Minutes",
    numberofvestions: 4,
    term: "T241",
    examtype: "MAJOR",
    code_name: "VERSION",
    code_numbering: "ALPHA",
    paper_size: "A4"
  };
}

export function generateSettingsBlock(settings: ExamSettings, actualVersions?: number): string {
  const versionCount = actualVersions !== undefined ? actualVersions : settings.numberofvestions;
  
  return `%{#setting}
%		university=${settings.university}
%		department=${settings.department}
%		term=${settings.term}
%		coursecode=${settings.coursecode}
%		examname=${settings.examname}
%		examdate=${settings.examdate}
%		timeallowed=${settings.timeallowed}
%		numberofvestions=${versionCount}
%		groups=${settings.groups}
%		examtype=${settings.examtype}
%		code_name=${settings.code_name}
%		code_numbering=${settings.code_numbering}
%{/setting}`;
}

export function generateTemplateSettings(numQuestions: number): ExamSettings {
  const defaults = getDefaultSettings();
  
  return {
    university: defaults.university!,
    department: defaults.department!,
    term: defaults.term!,
    coursecode: defaults.coursecode!,
    examname: defaults.examname!,
    examdate: defaults.examdate!,
    timeallowed: defaults.timeallowed!,
    numberofvestions: defaults.numberofvestions!,
    groups: numQuestions.toString(), // Full randomization for template
    examtype: defaults.examtype!,
    code_name: defaults.code_name!,
    code_numbering: defaults.code_numbering!,
    paper_size: defaults.paper_size!
  };
}