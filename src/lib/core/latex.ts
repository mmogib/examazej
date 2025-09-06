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
  
  // Generate settings block (commented) - ensure numberofvestions reflects actual versions count  
  const actualVersions = versions.length || settings.numberofvestions;
  const settingsBlock = `%{#setting}
% code_name=${settings.code_name}
% code_numbering=${settings.code_numbering}
% coursecode=${settings.coursecode}
% department=${settings.department}
% examdate=${settings.examdate}
% examname=${settings.examname}
% examtype=${settings.examtype}
% groups=${settings.groups}
% numberofvestions=${actualVersions}
% paper_size=${settings.paper_size}
% term=${settings.term}
% timeallowed=${settings.timeallowed}
% university=${settings.university}
%{/setting}`;

  // Document preamble
  const documentPreamble = `\\documentclass[leqno,fleqn,12pt]{article}
% exam paper size and margins
\\usepackage[${settings.paper_size.toLowerCase()}paper,top=2cm,bottom=1cm,left=1cm,right=1cm]{geometry}

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
\\newcommand{\\newcodecover}[1]{

\\newpage
\\thispagestyle{empty}
\\begin{large}
\\begin{center}
        ${processText(settings.university)} \\\\
        ${processText(settings.department)}  \\\\
        \\vspace*{4.5cm}
        {\\bf \\fbox{ #1 } }  \\hfill {\\bf \\fbox{ #1 }} \\\\
        {\\bf ${processText(settings.coursecode)} }  \\\\
        {\\bf ${processText(settings.examname)} }  \\\\
        {\\bf ${processText(settings.term)} }  \\\\
        {\\bf ${processText(settings.examdate)} }  \\\\
        {\\bf Net Time Allowed: ${processText(settings.timeallowed)} }  \\\\
        \\vspace*{0.2cm}
\\end{center}
\\begin{tcbraster}[raster columns=1, raster column skip=0pt, raster equal height, colback=white, before skip=0pt]
\\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
    \\hspace*{-4pt}\\begin{large}\\textbf{Name}\\end{large}
\\end{tcolorbox}
\\begin{tcbraster}[raster columns=2, raster column skip=2pt, raster equal height, colback=white, before skip=0pt]
\\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
    \\hspace*{-4pt}\\begin{large}\\textbf{ID}\\end{large}
\\end{tcolorbox}
\\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
    \\begin{large}\\textbf{Sec}\\end{large}
\\end{tcolorbox}
\\end{tcbraster}
% \\begin{tcbraster}[raster columns=2, raster column skip=2pt, raster equal height, colback=white, before skip=0pt]
% \\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=2cm]
%     \\hspace*{-4pt}\\textbf{Instructor}
% \\end{tcolorbox}
% \\begin{tcolorbox}[coltitle=black, enhanced jigsaw, boxrule=1pt ,segmentation style={solid,black,line width=1pt},sidebyside,lefthand width=1cm]
%     \\textbf{Serial}
% \\end{tcolorbox}
% \\end{tcbraster}
\\end{tcbraster}
\\begin{center}\\bf{Check that this exam has {\\underline{ ${masterExam.questions.length} }} questions.} \\end{center}

\\vspace{2cm}

\\underline{\\bf Important Instructions:}

\\begin{enumerate}
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
\\end{enumerate}
\\end{large}

 \\vspace*{\\fill}
\\newpage

}


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
%\\renewcommand{\\newcodecover}[1]{}
%% --------------------------------- END OF CUSTOM COVER PAGE  ---------------------------------
%%
%%
%%
%% --------------------------------- YOUR OWN PACKAGES AND COMMANDS  ----------------------------
%{#preamble}
${masterExam.preamble || ''}
%{/preamble}
%% --------------------------------- END OF YOUR PACKAGES AND COMMANDS ---------------------------`;

  // Generate master cover page
  const masterCoverPage = `%% MASTER COVER PAGE
\\thispagestyle{empty}
\\begin{large}
    \\begin{center}
        ${processText(settings.university)}\\\\
        ${processText(settings.department)} \\\\
        \\vspace*{2cm}
        {\\bf ${processText(settings.coursecode)} }  \\\\
        {\\bf ${processText(settings.examname)} }  \\\\
        {\\bf ${processText(settings.term)} }  \\\\
        {\\bf ${processText(settings.examdate)} }  \\\\

        \\vspace*{3cm}
        {\\bf{\\Huge{\\fbox{EXAM COVER}}}}\\\\
        \\vspace*{2cm}
        {\\bf Number of versions: ${settings.numberofvestions} }  \\\\
        {\\bf Number of questions: ${masterExam.questions.length} }  \\\\
        % {\\bf Number of Answers: {NUM_OF_ANSWERS}  }  \\\\
        \\vspace*{0.2cm}

    \\vfill

    \\begin{minipage}[b][3ex][b]{0.6\\textwidth}
    \\tiny{This exam was prepared using MC Exam Randomizer.}\\\\
    \\tiny{For questions send an email to Dr. Mohammed Alshahrani (mshahrani@kfupm.edu.sa) }
    \\tiny{You can download it by scanning the code}
    \\end{minipage}
    \\begin{minipage}{0.3\\textwidth}
    \\hfill \\tiny{\\qrcode{https://shuffler.mshahrani.website/}}\\\\
    \\end{minipage}

\\end{center}
\\end{large}
\\newpage`;

  // Generate master version page
  const masterVersionPage = `\\thispagestyle{empty}
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
        {\\bf {\\Huge{MASTER VERSION}}}  \\\\
      \\end{center}
\\end{large}
\\newpage`;

  // Generate master questions with correct answers marked
  const masterQuestionsSection = `\\renewcommand{\\thepage}{\\noindent ${processText(settings.term)}, ${processText(settings.coursecode)}, ${processText(settings.examname)} \\hfill Page {\\bf \\arabic{page} of 5 } \\hfill {\\bf \\fbox{ MASTER }}}
\\setcounter{page}{1}

 %% questions start here
\\begin{large}
\\begin{enumerate}

${masterExam.questions.map((question, index) => {
    const isLastQuestion = index === masterExam.questions.length - 1;
    const separator = (index + 1) % 2 === 0 ? '\\eogseparator' : '\\questionseparator';
    
    return `
\\item ${processText(question.text)}
\\bodyoptionseparator
\\setcounter{equation}{0}

\\begin{enumerate}\\item ${processText(question.choices[0][0]?.text || `question ${index + 1}, Item 1`)}\\;\\;\\hrulefill {\\small (correct)}
\\item ${processText(question.choices[0][1]?.text || `question ${index + 1}, Item 2`)}
\\item ${processText(question.choices[0][2]?.text || `question ${index + 1}, Item 3`)}
\\item ${processText(question.choices[0][3]?.text || `question ${index + 1}, Item 4`)}
\\item ${processText(question.choices[0][4]?.text || `question ${index + 1}, Item 5`)}
\\end{enumerate}
${isLastQuestion ? '\\eogseparator' : separator}`;
  }).join('')}

\\end{enumerate}
\\end{large}`;

  // Generate all versions
  const versionsContent = versions.map((version, versionIndex) => {
    const versionCode = version.name.replace('version_', '').toUpperCase();
    
    // Generate questions for this version
    const versionQuestionsSection = `\\renewcommand{\\thepage}{\\noindent ${processText(settings.term)}, ${processText(settings.coursecode)}, ${processText(settings.examname)} \\hfill Page {\\bf \\arabic{page} of 5 } \\hfill {\\bf \\fbox{ ${settings.code_name} ${versionCode} }}}
\\setcounter{page}{1}
 %% questions start here
\\begin{large}
\\begin{enumerate}

${version.questions.map((question, index) => {
      const isLastQuestion = index === version.questions.length - 1;
      const separator = (index + 1) % 2 === 0 ? '\\eogseparator' : '\\questionseparator';
      
      return `
\\item ${processText(question.text)}
\\bodyoptionseparator
\\setcounter{equation}{0}

\\begin{enumerate}\\item  ${processText(question.choices[0][0]?.text || `question ${index + 1}, Item 1`)}
\\item  ${processText(question.choices[0][1]?.text || `question ${index + 1}, Item 2`)}
\\item  ${processText(question.choices[0][2]?.text || `question ${index + 1}, Item 3`)}
\\item  ${processText(question.choices[0][3]?.text || `question ${index + 1}, Item 4`)}
\\item  ${processText(question.choices[0][4]?.text || `question ${index + 1}, Item 5`)}
\\end{enumerate}
${isLastQuestion ? '\\eogseparator' : separator}`;
    }).join('')}

\\end{enumerate}
\\end{large}`;

    return `
\\newcodecover{${settings.code_name} ${versionCode}}
${versionQuestionsSection}`;
  }).join('');

  // Generate answer key
  const answerKeyPage = `
%% KEY ANSWER Page
\\newpage
\\renewcommand{\\thepage}{\\noindent ${processText(settings.coursecode)}, ${processText(settings.term)}, ${processText(settings.examname)} \\hfill {\\bf \\fbox{Answer KEY}}}
\\begin{normalsize}
\\setcounter{page}{1}
\\vspace {1cm}

\\begin{center}

  \\begin{tabular}{|c||c | ${versions.map(v => 'c').join('|')}|}
  \\hline
  Q&MASTER&${versions.map(v => v.name.replace('version_', '').toUpperCase()).join('&')} \\\\ \\hline
  ${masterExam.questions.map((_, qIndex) => {
    const masterAnswer = 'A'; // Always A for master (first option)
    const versionAnswers = versions.map(version => {
      const mapping = mappings.find(m => 
        m.masterQNo === qIndex + 1 && 
        m.version === version.name.replace('version_', '').toUpperCase()
      );
      // Find the position of this master question in the version
      const versionPosition = mapping ? mapping.versionQNo : qIndex + 1;
      return mapping ? `${mapping.correct}\\; {\\tiny $_{${versionPosition}}$}` : `A\\; {\\tiny $_{${versionPosition}}$}`;
    });
    
    return `${qIndex + 1}&${masterAnswer}&${versionAnswers.join('&')}`;
  }).join('\\\\ \\hline')}
  \\\\ \\hline
  \\end{tabular}

\\end{center}
\\end{normalsize}`;

  // Calculate answer counts
  const answerCounts = versions.map((version, vIndex) => {
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    masterExam.questions.forEach((_, qIndex) => {
      const mapping = mappings.find(m => 
        m.masterQNo === qIndex + 1 && 
        m.version === version.name.replace('version_', '').toUpperCase()
      );
      if (mapping) {
        counts[mapping.correct as keyof typeof counts]++;
      } else {
        counts.A++; // Default to A if no mapping found
      }
    });
    return counts;
  });

  const answerCountsPage = `
%% This is the answer count page
\\newpage
\\renewcommand{\\thepage}{\\noindent ${processText(settings.coursecode)}, ${processText(settings.term)}, ${processText(settings.examname)} \\hfill {\\bf \\fbox{Answer Counts}}}
\\begin{normalsize}
\\begin{center}
\\vspace {1cm}

\\begin{Large}
Answer Counts \\\\
\\end{Large}
\\vspace {1cm}

  \\begin{tabular}{|c||c|c|c|c|c|
}
  \\hline
  V&A&B&C&D&E\\\\ \\hline
  ${answerCounts.map((counts, index) => 
    `${index + 1}&${counts.A}&${counts.B}&${counts.C}&${counts.D}&${counts.E}`
  ).join('\\\\ \\hline')}
  \\\\ \\hline

  \\end{tabular}

\\end{center}
\\end{normalsize}
\\newpage`;

  return `${settingsBlock}
${documentPreamble}


\\begin{document}

${masterCoverPage}

${masterVersionPage}
${masterQuestionsSection}
${versionsContent}
${answerKeyPage}
${answerCountsPage}
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