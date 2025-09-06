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
    paper_size: "A4",
    instructions: `\\begin{enumerate}
    \\begin{normalsize}
        \\item  All types of calculators, smart watches or mobile phones are NOT allowed during the examination.
        \\item  Use HB 2.5 pencils only.
        \\item  Use a good eraser. DO NOT use the erasers attached to the pencil.
        \\item  Write your name, ID number and Section number on the examination paper and in the upper left corner of the answer sheet.
        \\item  When bubbling your ID number and Section number, be sure that the bubbles match with the numbers that you write.
        \\item  The Test Code Number is already bubbled in your answer sheet. Make sure that it is the same as that printed on your question paper.
        \\item  When bubbling, make sure that the bubbled space is fully covered.
        \\item  When erasing a bubble, make sure that you do not leave any trace of penciling.
    \\end{normalsize}
\\end{enumerate}`
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
%		code_numbering=${settings.code_numbering}${settings.seed ? `\n%		seed=${settings.seed}` : ''}
%{/setting}

%{#instructions}
${settings.instructions.split('\n').map(line => `%${line}`).join('\n')}
%{/instructions}`;
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
    paper_size: defaults.paper_size!,
    instructions: defaults.instructions!
  };
}