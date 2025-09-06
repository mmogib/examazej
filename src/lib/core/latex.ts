import type { ExamSettings, ExamData, VersionMapping } from '../types';

export function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\textasciitilde{}');
}

export function generateLatexDocument(
  settings: ExamSettings,
  masterExam: ExamData,
  versions: ExamData[],
  mappings: VersionMapping[],
  allowTrustedTex = false
): string {
  const processText = allowTrustedTex ? (text: string) => text : escapeLatex;
  
  // Generate settings block
  const settingsBlock = `%{#setting}
%\t\tcode_name=${settings.code_name}
%\t\tcode_numbering=${settings.code_numbering}
%\t\tcoursecode=${settings.coursecode}
%\t\tdepartment=${settings.department}
%\t\texamdate=${settings.examdate}
%\t\texamname=${settings.examname}
%\t\texamtype=${settings.examtype}
%\t\tgroups=${settings.groups}
%\t\tnumberofvestions=${settings.numberofvestions}
%\t\tterm=${settings.term}
%\t\ttimeallowed=${settings.timeallowed}
%\t\tuniversity=${settings.university}
%{/setting}`;

  // Document preamble with enhanced packages and formatting
  const documentPreamble = `\\documentclass[leqno,fleqn,12pt]{article}
% exam paper size and margins
\\usepackage[a4paper,top=2cm,bottom=1cm,left=1cm,right=1cm]{geometry}

% math packages
\\usepackage{mathtools}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}

% graphics packages
\\usepackage{graphicx}
\\usepackage[final]{qrcode}
\\usepackage[most]{tcolorbox}

\\renewcommand{\\theequation}{\\alph{equation}}
\\thicklines
\\pagestyle{myheadings}
%% Predefined commands
\\newcommand{\\bodyoptionseparator}{
\\vspace {0.8cm}
}
\\newcommand{\\questionseparator}{
\\vspace*{\\fill}
}
\\newcommand{\\eogseparator}{
\\vspace*{\\fill}
 \\newpage
}
\\newcommand{\\newcodecover}[1]{}


%% put your preamble between the two tags {#preamble} and {/preamble} below
%% You can also redefine the following commans
%% \\bodyoptionseparator, \\questionseparator, \\eogseparator, \\newcodecover
%% by typing
%\\renewcommand{\\bodyoptionseparator}{
%\\vspace {0.8cm}
%}
%\\renewcommand{\\questionseparator}{
%\\vspace*{\\fill}
%}
%\\renewcommand{\\eogseparator}{
%\\vspace*{\\fill}
 %\\newpage}

%%
%%
%% COPY AND PASTE YOUR CUSTOM COVER PAGE BELOW  THE TAGS {#preamble} and {/preamble} BETWEEN
%% --------------------------------- YOUR CUSTOM COVER PAGE  ---------------------------------
%\\renewcommand{\\newcodecover}[1]{

%\\newpage
%\\thispagestyle{empty}
%\\begin{large}
%\\begin{center}
%        {UNIVERSITY_NAME} \\\\
%        {DEPT_NAME}  \\\\
%        \\vspace*{4.5cm}
%        {\\bf \\fbox{ #1 } }  \\hfill {\\bf \\fbox{ #1 }} \\\\
%        {\\bf {COURSE_CODE} }  \\\\
%        {\\bf {EXAM_NAME} }  \\\\
%        {\\bf {TERM} }  \\\\
%        {\\bf {EXAM_DATE} }  \\\\
%        {\\bf Net Time Allowed: {TIME_ALLOWED} }  \\\\
%        \\vspace*{0.2cm}
%\\end{center}
%\\begin{tcbraster}[raster columns=1, raster column skip=0pt, raster equal height, colback=white, before skip=0pt]
%\\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
%    \\hspace*{-4pt}\\begin{large}\\textbf{Name}\\end{large}
%\\end{tcolorbox}
%\\begin{tcbraster}[raster columns=2, raster column skip=2pt, raster equal height, colback=white, before skip=0pt]
%\\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
%    \\hspace*{-4pt}\\begin{large}\\textbf{ID}\\end{large}
%\\end{tcolorbox}
%\\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
%    \\begin{large}\\textbf{Sec}\\end{large}
%\\end{tcolorbox}
%\\end{tcbraster}
%% \\begin{tcbraster}[raster columns=2, raster column skip=2pt, raster equal height, colback=white, before skip=0pt]
%% \\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=2cm]
%%     \\hspace*{-4pt}\\textbf{Instructor}
%% \\end{tcolorbox}
%% \\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
%%     \\textbf{Serial}
%% \\end{tcolorbox}
%% \\end{tcbraster}
%\\end{tcbraster}
%\\begin{center}\\bf{Check that this exam has {\\underline{ {NUM_OF_QUESTIONS} }} questions.} \\end{center}
%
%\\vspace{2cm}

%\\underline{\\bf Important Instructions:}
 %
%\\begin{enumerate}
%    \\begin{normalsize}
%        \\item  All types of calculators, smart watches or mobile phones are NOT allowed during the examination.
%        \\item  Use HB 2.5 pencils only.
%        \\item  Use a good eraser. DO NOT use the erasers attached to the pencil.
%        \\item  Write your name, ID number and Section number on the examination paper and in the upper left corner of the answer sheet.
%        \\item  When bubbling your ID number and Section number, be sure that the bubbles match with the numbers that you write.
%        \\item  The Test Code Number is already bubbled in your answer sheet. Make sure that it is the same as that printed on your question paper.
%        \\item  When bubbling, make sure that the bubbled space is fully covered.
%        \\item  When erasing a bubble, make sure that you do not leave any trace of penciling.
%    \\end{normalsize}
%\\end{enumerate}
%\\end{large}
%
 %\\vspace*{\\fill}
%\\newpage

%}
%% --------------------------------- END OF CUSTOM COVER PAGE  ---------------------------------
%%
%%
%%
%% --------------------------------- YOUR OWN PACKAGES AND COMMANDS  ----------------------------
%{#preamble}
${masterExam.preamble || ''}
%{/preamble}
%% --------------------------------- END OF YOUR PACKAGES AND COMMANDS ---------------------------`;

  // Generate all versions
  const versionsContent = versions.map((version, versionIndex) => {
    const versionCode = version.name.replace('version_', '');
    
    // Cover page for this version
    const coverPage = `%% This is the cover page for version ${versionCode}
\\thispagestyle{empty}
\\begin{large}
  \\begin{center}
        ${processText(settings.university)} \\\\
        ${processText(settings.department)}  \\\\
        {\\bf ${processText(settings.coursecode)} } \\\\
        {\\bf ${processText(settings.examname)}  } \\\\
        {\\bf  ${processText(settings.term)} }  \\\\
        {\\bf ${processText(settings.examdate)} }  \\\\
        {\\bf Net Time Allowed: ${processText(settings.timeallowed)} }  \\\\
        \\vspace*{6cm}
        {\\bf {\\Huge{VERSION ${versionCode}}}}  \\\\
        \\vspace*{2cm}
        {\\bf Check that this exam has {\\underline{ ${version.questions.length} }} questions.}  \\\\
        \\end{center}
  \\end{large}
\\newpage`;

    // Header for subsequent pages
    const pageHeader = `\\renewcommand{\\thepage}{\\noindent ${processText(settings.term)}, ${processText(settings.coursecode)}, ${processText(settings.examname)} \\hfill Page {\\bf \\arabic{page} of ${Math.ceil(version.questions.length / 2) + 1} } \\hfill {\\bf \\fbox{ ${versionCode} }}}
\\setcounter{page}{1}`;

    // Generate questions with proper formatting
    const questionsSection = `\\begin{large}
\\begin{enumerate}

${version.questions.map((question, index) => {
      const isLastQuestion = index === version.questions.length - 1;
      const separator = (index + 1) % 2 === 0 ? '\\eogseparator' : '\\questionseparator';
      
      return `% question ${index + 1}
\\item
%{#q}
${processText(question.text)}
%{/q}

\\bodyoptionseparator
\\setcounter{equation}{0}

\\begin{enumerate}\\item
%{#o}
${processText(question.choices[0][0]?.text || `question ${index + 1}, Item 1`)}
%{/o}
\\item
%{#o}
${processText(question.choices[0][1]?.text || `question ${index + 1}, Item 2`)}
%{/o}
\\item
%{#o}
${processText(question.choices[0][2]?.text || `question ${index + 1}, Item 3`)}
%{/o}
\\item
%{#o}
${processText(question.choices[0][3]?.text || `question ${index + 1}, Item 4`)}
%{/o}
\\item
%{#o}
${processText(question.choices[0][4]?.text || `question ${index + 1}, Item 5`)}
%{/o}
\\end{enumerate}
${isLastQuestion ? '' : separator}`;
    }).join('\n\n')}

\\end{enumerate}
\\end{large}

\\newpage`;

    return `${coverPage}
${pageHeader}

 %% questions start here for version ${versionCode}
${questionsSection}`;
  }).join('\n\n');

  return `${settingsBlock}
${documentPreamble}

\\begin{document}

${versionsContent}

\\end{document}`;
}

export function generateMappingCSV(mappings: VersionMapping[]): string {
  const headers = ['Group', 'Master Q#', 'Version', 'Version Q#', 'Permutation', 'Correct', 'Points'];
  const rows = mappings.map(m => [
    m.group.toString(),
    m.masterQNo.toString(),
    m.version,
    m.versionQNo.toString(),
    m.perm,
    m.correct,
    (m.points || 1).toString()
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}