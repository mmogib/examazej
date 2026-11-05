import type {
  ExamSettings,
  ExamData,
  VersionMapping,
  Question,
  ExamVersion,
} from "../types";
import { generateSettingsBlock } from "./settings";
import { normalizeAcademicIntegrityPledgeText } from "./academic-integrity-pledge";
import { getCorrectLetter, getLockTags } from "./question-flags";
import { APP_VERSION } from "./app-version";
import {
  calculateQuestionPages,
  detectPageCountVariations,
  formatPageCountWarning,
  type PageCountWarning,
} from "../utils/page-count-analyzer";

type BarChartOptions = {
  title?: string;
  caption?: string;
  xlabel?: string;
  ylabel?: string;
  color?: string;
  barWidth?: string;
  width?: string;
  height?: string;
};

// Add this near the top of the file, after the imports
const SEPARATOR_COMMANDS = `\\newcommand{\\bodyoptionseparator}{
\\vspace {0.8cm}
}
\\newcommand{\\questionseparator}{
\\vspace*{\\fill}
}
\\newcommand{\\eogseparator}{
\\vspace*{\\fill}
 \\newpage
}`;

function generateLatexBarChart(
  answerCounts: Array<Record<string, number>>,
  options: BarChartOptions = {}
) {
  // Extract default values with ability to override
  const {
    title = "Answer Option Frequency Across Versions",
    caption = "Frequency of Each Answer Option (Excluding MASTER)",
    xlabel = "Option",
    ylabel = "Frequency",
    color = "cyan!60!blue",
    barWidth = "18pt",
    width = "10cm",
    height = "7cm",
  } = options;

  // Aggregate counts across all versions
  const aggregatedCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  answerCounts.forEach((counts) => {
    Object.keys(aggregatedCounts).forEach((key) => {
      aggregatedCounts[key] += counts[key] || 0;
    });
  });

  // Get the keys and values from the aggregated counts
  const keys = Object.keys(aggregatedCounts);
  const values = Object.values(aggregatedCounts);

  // Calculate ymax (add some padding above the highest value)
  const maxValue = Math.max(...values);
  const ymax = Math.ceil(maxValue * 1.1); // 10% padding, rounded up

  // Generate symbolic x coordinates
  const symbolicCoords = keys.join(",");

  // Generate coordinate pairs for the plot
  const coordinates = keys
    .map((key) => `(${key},${aggregatedCounts[key]})`)
    .join(" ");

  // Generate the complete LaTeX code
  const latexCode = `\\begin{figure}[h!]
  \\centering
  \\begin{tikzpicture}
    \\begin{axis}[
      ybar,
      bar width=${barWidth},
      ymin=0, ymax=${ymax},
      grid=major,
      axis on top,
      symbolic x coords={${symbolicCoords}},
      xtick=data,
      xlabel={${xlabel}},
      ylabel={${ylabel}},
      nodes near coords,
      nodes near coords align={vertical},
      enlarge x limits=0.2,
      width=${width}, height=${height},
      title={${title}},
      tick label style={font=\\small},
      label style={font=\\small},
      title style={font=\\bfseries\\large},
      x tick label style={font=\\bfseries}
    ]
      % You can change the color here
      \\addplot+[ybar,fill=${color}] coordinates {${coordinates}};
    \\end{axis}
  \\end{tikzpicture}
  \\caption{${caption}}
\\end{figure}`;

  return latexCode;
}

export function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\$/g, "\\$")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/_/g, "\\_")
    .replace(/~/g, "\\textasciitilde{}");
}

export interface GenerateLatexResult {
  content: string;
  pageCountWarning: PageCountWarning | null;
}

export function generateLatexDocument(
  settings: ExamSettings,
  masterExam: ExamData,
  versions: ExamData[],
  mappings: VersionMapping[],
  allowTrustedTex = false
): GenerateLatexResult {
  const processText = allowTrustedTex ? (text: string) => text : escapeLatex;

  // Generate settings block (commented) - ensure numberofvestions reflects actual versions count
  const actualVersions = versions.length || settings.numberofvestions;
  const settingsBlock = generateSettingsBlock(settings, actualVersions);

  // Calculate total pages for master version
  const masterTotalPages = calculateQuestionPages(masterExam.questions);

  // Detect page count variations across versions
  const pageCountWarning = detectPageCountVariations(masterExam, versions);

  // Generate warning comment block if variation detected
  const warningCommentBlock = pageCountWarning
    ? `
%% ========================================================================
%% ⚠️⚠️⚠️ WARNING: PAGE COUNT VARIATION DETECTED ⚠️⚠️⚠️
%% ========================================================================
%%
%% Different exam versions have DIFFERENT total page counts!
%% This may cause confusion in the exam hall - proctors might think
%% some exams are incomplete or missing pages.
%%
%% Page count distribution:
${pageCountWarning.distributions
  .map((dist) => `%%   • ${dist.pageCount} pages: ${dist.versionCodes.join(", ")}`)
  .join("\n")}
%%
%% RECOMMENDATIONS:
${pageCountWarning.recommendations
  .map((rec, idx) => `%%   ${idx + 1}. ${rec}`)
  .join("\n")}
%%
%% ========================================================================
`
    : "";

  const showAcademicIntegrityPledge =
    settings.includeCoverPage && settings.includeAcademicIntegrityPledge;
  const academicIntegrityPledgeBlock = showAcademicIntegrityPledge
    ? `
\\vspace*{0.35cm}
\\noindent\\underline{\\textbf{Academic Integrity Pledge:}}\\par
\\vspace*{0.15cm}
\\noindent ${escapeLatex(
        normalizeAcademicIntegrityPledgeText(
          settings.academicIntegrityPledgeText
        )
      )}\\par
\\vspace*{0.45cm}
\\noindent\\hfill\\textbf{Signature:}\\hspace{0.25cm}\\rule{0.58\\textwidth}{0.4pt}
\\vspace*{0.45cm}
`
    : "";

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
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.17}

\\renewcommand{\\theequation}{\\alph{equation}}
\\thicklines
\\pagestyle{myheadings}
%% Predefined commands
${SEPARATOR_COMMANDS}
\\newcommand{\\newcodecover}[1]{${
    settings.includeCoverPage
      ? `

\\newpage
\\thispagestyle{empty}
\\begin{large}
\\begin{center}
        ${processText(settings.university)} \\\\
        ${processText(settings.department)}  \\\\
        \\vspace*{${showAcademicIntegrityPledge ? "1cm" : "4.5cm"}}
        {\\bf \\fbox{ #1 } }  \\hfill {\\bf \\fbox{ #1 }} \\\\
        {\\bf ${processText(settings.coursecode)} }  \\\\
        {\\bf ${processText(settings.examname)} }  \\\\
        {\\bf ${processText(settings.term)} }  \\\\
        {\\bf ${processText(settings.examdate)} }  \\\\
        {\\bf Net Time Allowed: ${processText(settings.timeallowed)} }  \\\\
        \\vspace*{0.2cm}
\\end{center}
${academicIntegrityPledgeBlock}
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
\\begin{center}\\bf{Check that this exam has {\\underline{ ${
          masterExam.questions.length
        } }} questions.} \\end{center}

\\vspace{${showAcademicIntegrityPledge ? "0.6cm" : "2cm"}}

\\underline{\\bf Important Instructions:}

${settings.instructions}

\\end{large}

 \\vspace*{\\fill}
\\newpage
`
      : "\\newpage"
  }
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
${masterExam.preamble || ""}
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
    \\tiny{This exam was prepared using Examazej.}\\\\
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
  const masterQuestionsSection = `\\renewcommand{\\thepage}{\\noindent ${processText(
    settings.term
  )}, ${processText(settings.coursecode)}, ${processText(
    settings.examname
  )} \\hfill Page {\\bf \\arabic{page} of ${masterTotalPages} } \\hfill {\\bf \\fbox{ MASTER }}}
\\setcounter{page}{1}

 %% questions start here
\\begin{large}
\\begin{enumerate}

${(() => {
  let questionsLatex = "";
  let questionsOnCurrentPage = 0;

  masterExam.questions.forEach((question, index) => {
    const isLastQuestion = index === masterExam.questions.length - 1;

    // Handle separate page questions
    if (question.keepOnSeparatePage) {
      // If current page has questions, add separator before starting new page
      if (questionsOnCurrentPage > 0) {
        questionsLatex += "\n\\eogseparator\n";
      }
      // Add the question on its own page
      questionsLatex += `
% question ${index + 1}
\\item ${processText(question.text)}
\\bodyoptionseparator
\\setcounter{equation}{0}

${
  question.choices[0].length > 0
    ? `\\begin{enumerate}${question.choices[0]
        .map(
          (choice, choiceIndex) =>
            `\\item ${processText(
              choice?.text || `question ${index + 1}, Item ${choiceIndex + 1}`
            )}${
              choiceIndex === question.choices[1]
                ? "\\;\\;\\hrulefill {\\small (correct)}"
                : ""
            }`
        )
        .join("\n")}
\\end{enumerate}`
    : ""
}`;

      // Force new page after separate question (unless it's the last)
      if (!isLastQuestion) {
        questionsLatex += "\n\\eogseparator\n";
      }
      questionsOnCurrentPage = 0;
    } else {
      // Regular question handling
      if (questionsOnCurrentPage >= 2) {
        questionsLatex += "\n\\eogseparator\n";
        questionsOnCurrentPage = 0;
      }

      questionsLatex += `
% question ${index + 1}
\\item ${processText(question.text)}
\\bodyoptionseparator
\\setcounter{equation}{0}

${
  question.choices[0].length > 0
    ? `\\begin{enumerate}${question.choices[0]
        .map(
          (choice, choiceIndex) =>
            `\\item ${processText(
              choice?.text || `question ${index + 1}, Item ${choiceIndex + 1}`
            )}${
              choiceIndex === question.choices[1]
                ? "\\;\\;\\hrulefill {\\small (correct)}"
                : ""
            }`
        )
        .join("\n")}
\\end{enumerate}`
    : ""
}`;

      questionsOnCurrentPage++;

      // Add separator after every 2 regular questions (except for the last question)
      if (questionsOnCurrentPage === 2 && !isLastQuestion) {
        questionsLatex += "\n\\eogseparator\n";
        questionsOnCurrentPage = 0;
      } else {
        // Emit \questionseparator (\vspace*{\fill}) for layout consistency —
        // shared with the inter-question case so multi-question pages always
        // get balanced fills (q1 top, q2 mid). On the section's last regular
        // question, the trailing fill is harmless and the next section's
        // \newcodecover handles the page break.
        questionsLatex += "\n\\questionseparator";
      }
    }
  });

  return questionsLatex;
})()}

\\end{enumerate}
\\end{large}`;

  // Generate all versions
  const versionsContent = versions
    .map((version, versionIndex) => {
      const versionCode = version.name.replace("version_", "").toUpperCase();

      // Calculate total pages for this specific version
      const versionTotalPages = calculateQuestionPages(version.questions);

      // Generate questions for this version
      const studentNameIdHeader = settings.includeCoverPage
        ? ""
        : ` \\hfill Name: \\underline{\\hspace{6cm}} \\hfill ID: \\underline{\\hspace{3cm}}`;
      const headerFormat = settings.includeCoverPage
        ? `\\renewcommand{\\thepage}{\\noindent ${processText(
            settings.term
          )}, ${processText(settings.coursecode)}, ${processText(
            settings.examname
          )} \\hfill Page {\\bf \\arabic{page} of ${versionTotalPages} } \\hfill {\\bf \\fbox{ ${
            settings.code_name
          } ${versionCode} }}}`
        : `\\renewcommand{\\thepage}{\\noindent {\\small{${processText(
            settings.term
          )}, ${processText(settings.coursecode)}, ${processText(
            settings.examname
          )}, Page {\\arabic{page}}, ${
            settings.code_name
          } ${versionCode} }}${studentNameIdHeader}}`;
      const versionQuestionsSection = `${headerFormat}
\\setcounter{page}{1}
 %% questions start here
\\begin{large}
\\begin{enumerate}

${(() => {
  let versionQuestionsLatex = "";
  let questionsOnCurrentPage = 0;

  version.questions.forEach((question, index) => {
    const isLastQuestion = index === version.questions.length - 1;

    // Find the original master question number for this version question
    const masterQuestionNumber = (() => {
      const mapping = mappings.find(
        (m) =>
          m.versionQNo === index + 1 &&
          m.version === version.name.replace("version_", "").toUpperCase()
      );
      return mapping ? mapping.masterQNo : index + 1;
    })();

    // Handle separate page questions
    if (question.keepOnSeparatePage) {
      // If current page has questions, add separator before starting new page
      if (questionsOnCurrentPage > 0) {
        versionQuestionsLatex += "\n\\eogseparator\n";
      }
      // Add the question on its own page
      versionQuestionsLatex += `
% question ${index + 1} (question ${masterQuestionNumber} in master)
\\item ${processText(question.text)}
\\bodyoptionseparator
\\setcounter{equation}{0}

${
  question.choices[0].length > 0
    ? `\\begin{enumerate}${question.choices[0]
        .map(
          (choice, choiceIndex) =>
            `\\item  ${processText(
              choice?.text || `question ${index + 1}, Item ${choiceIndex + 1}`
            )}`
        )
        .join("\n")}
\\end{enumerate}`
    : ""
}`;

      // Force new page after separate question (unless it's the last)
      if (!isLastQuestion) {
        versionQuestionsLatex += "\n\\eogseparator\n";
      }
      questionsOnCurrentPage = 0;
    } else {
      // Regular question handling
      if (questionsOnCurrentPage >= 2) {
        versionQuestionsLatex += "\n\\eogseparator\n";
        questionsOnCurrentPage = 0;
      }

      versionQuestionsLatex += `
% question ${index + 1} (question ${masterQuestionNumber} in master)
\\item ${processText(question.text)}
\\bodyoptionseparator
\\setcounter{equation}{0}

${
  question.choices[0].length > 0
    ? `\\begin{enumerate}${question.choices[0]
        .map(
          (choice, choiceIndex) =>
            `\\item  ${processText(
              choice?.text || `question ${index + 1}, Item ${choiceIndex + 1}`
            )}`
        )
        .join("\n")}
\\end{enumerate}`
    : ""
}`;

      questionsOnCurrentPage++;

      if (questionsOnCurrentPage === 2 && !isLastQuestion) {
        versionQuestionsLatex += "\n\\eogseparator\n";
        questionsOnCurrentPage = 0;
      } else {
        // Always emit \questionseparator after a regular question — gives the
        // page balanced fills (q1 top, q2 mid). On the section's last regular
        // question, the trailing fill is harmless and the next section's
        // \newcodecover handles the page break.
        versionQuestionsLatex += "\n\\questionseparator";
      }
    }
  });

  return versionQuestionsLatex;
})()}

\\end{enumerate}
\\end{large}`;

      return `
\\newcodecover{${settings.code_name} ${versionCode}}
${versionQuestionsSection}`;
    })
    .join("");

  // Generate answer key
  const answerKeyPage = `
%% KEY ANSWER Page
\\newpage
\\renewcommand{\\thepage}{\\noindent ${processText(
    settings.coursecode
  )}, ${processText(settings.term)}, ${processText(
    settings.examname
  )} \\hfill {\\bf \\fbox{Answer KEY}}}
\\begin{normalsize}
\\setcounter{page}{1}
\\vspace {1cm}

\\begin{center}

  \\begin{tabular}{|c||c | ${versions.map((v) => "c").join("|")}|}
  \\hline
  Q&MASTER&${versions
    .map((v) => v.name.replace("version_", "").toUpperCase())
    .join("&")} \\\\ \\hline
  ${masterExam.questions
    .map((mQ, qIndex) => {
      // Open-ended questions have no answer letter: show a dash.
      const masterAnswer = getCorrectLetter(mQ) ?? "--";

      const versionAnswers = versions.map((version) => {
        // Find which master question appears at position (qIndex + 1) in this version
        const mapping = mappings.find(
          (m) =>
            m.versionQNo === qIndex + 1 &&
            m.version === version.name.replace("version_", "").toUpperCase()
        );
        const versionQuestion = version.questions[qIndex];
        const answer =
          versionQuestion && getCorrectLetter(versionQuestion) === null
            ? "--"
            : mapping?.correct;

        return mapping
          ? `${answer}\\; {\\tiny $_{${mapping.masterQNo}}$}`
          : `A\\; {\\tiny $_{${qIndex + 1}}$}`;
      });

      return `${qIndex + 1}&${masterAnswer}&${versionAnswers.join("&")}`;
    })
    .join("\\\\ \\hline")}
  \\\\ \\hline
  \\end{tabular}

\\end{center}
\\end{normalsize}`;

  // Calculate answer counts
  const answerCounts = versions.map((version, vIndex) => {
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    masterExam.questions.forEach((masterQuestion, qIndex) => {
      // Open-ended questions have no answer letter to count.
      if (getCorrectLetter(masterQuestion) === null) return;
      const mapping = mappings.find(
        (m) =>
          m.masterQNo === qIndex + 1 &&
          m.version === version.name.replace("version_", "").toUpperCase()
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
\\renewcommand{\\thepage}{\\noindent ${processText(
    settings.coursecode
  )}, ${processText(settings.term)}, ${processText(
    settings.examname
  )} \\hfill {\\bf \\fbox{Answer Counts}}}
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
  ${answerCounts
    .map(
      (counts, index) =>
        `${index + 1}&${counts.A}&${counts.B}&${counts.C}&${counts.D}&${
          counts.E
        }`
    )
    .join("\\\\ \\hline")}
  \\\\ \\hline

  \\end{tabular}

  ${generateLatexBarChart(answerCounts)}

\\end{center}
\\end{normalsize}
\\newpage`;

  const latexContent = `% Made with Examazej ${APP_VERSION}
${settingsBlock}
${warningCommentBlock}${documentPreamble}


\\begin{document}

${masterCoverPage}

${masterVersionPage}
${masterQuestionsSection}
${versionsContent}
${answerKeyPage}
${answerCountsPage}
\\end{document}`;

  return {
    content: latexContent,
    pageCountWarning,
  };
}

export function generateMappingCSV(mappings: VersionMapping[]): string {
  const headers = [
    "Group",
    "Master Q#",
    "Version",
    "Version Q#",
    "Permutation",
    "Correct",
    "Points",
  ];
  const rows = mappings.map((m) => [
    m.group.toString(),
    m.masterQNo.toString(),
    m.version,
    m.versionQNo.toString(),
    m.perm,
    m.correct,
    (m.points || 1).toString(),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

// new functions
export function generateLatexTemplate(
  settings: ExamSettings,
  exam: ExamData,
  actualVersionCount: number
): string {
  // Generate template questions using actual exam data with proper spacing
  const seed = settings.seed;
  const templateQuestions = (() => {
    const questions = exam.questions.map((question, i) => {
      const questionNumber = i + 1;

      // Generate the question tags based on question properties. Every multiple-choice
      // question states its answer explicitly, so re-importing never falls back to "A".
      let questionTags = "";
      for (const lockTag of getLockTags(question)) {
        questionTags += `\n%{#${lockTag}}`;
      }
      const correctLetter = getCorrectLetter(question);
      if (correctLetter) {
        questionTags += `\n%{#correct:${correctLetter}}`;
      }
      if (question.keepOnSeparatePage) {
        questionTags += `\n%{#separate-page}`;
      }

      const questionText = question.text || `Question ${questionNumber} text`;
      const choices = question.choices[0] || [];

      // Only generate options if the question has choices (not open-ended)
      const optionsText =
        choices.length > 0
          ? choices
              .map((choice, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, E
                return `    \\item
    %{#o}
    ${choice.text || `Option ${optionLetter} for question ${questionNumber}`}
    %{/o}`;
              })
              .join("\n\n")
          : "";

      // Format question with or without options based on choice count
      if (choices.length === 0) {
        // Open-ended question (no options)
        return `\n\n% ============================================================ \n% question ${questionNumber} (open-ended)\n%=============================================================\n
\\item ${questionTags}
%{#q}
${questionText}
%{/q}`;
      } else {
        // Multiple choice question
        return `\n\n% ============================================================ \n% question ${questionNumber} (multiple choice)\n%=============================================================\n 
\\item ${questionTags}
%{#q}
${questionText}
%{/q}

  \\begin{enumerate}

${optionsText}

  \\end{enumerate}`;
      }
    });

    // Apply spacing logic matching the master version
    let questionsLatex = "";
    let questionsOnCurrentPage = 0;

    questions.forEach((questionStr, index) => {
      const question = exam.questions[index];
      const isLastQuestion = index === questions.length - 1;

      // Handle separate page questions
      if (question.keepOnSeparatePage) {
        // If current page has questions, add separator before starting new page
        if (questionsOnCurrentPage > 0) {
          questionsLatex += "\n\\eogseparator\n";
        }
        questionsLatex += questionStr;
        // Force new page after separate question (unless it's the last)
        if (!isLastQuestion) {
          questionsLatex += "\n\\eogseparator\n";
        }
        questionsOnCurrentPage = 0;
      } else {
        // Regular question handling (2 per page)
        if (questionsOnCurrentPage >= 2) {
          questionsLatex += "\n\\eogseparator\n";
          questionsOnCurrentPage = 0;
        }

        questionsLatex += questionStr;
        questionsOnCurrentPage++;

        // Add separator after every 2 regular questions (except for the last question)
        if (questionsOnCurrentPage === 2 && !isLastQuestion) {
          questionsLatex += "\n\\eogseparator";
          questionsOnCurrentPage = 0;
        } else if (isLastQuestion) {
          questionsLatex += "\n\\eogseparator\n";
        } else {
          questionsLatex += "\n\\questionseparator\n";
        }
      }
    });

    return questionsLatex;
  })();

  // Use current exam settings for the template with actual generated values
  const templateSettings = {
    ...settings,
    groups: settings.groups,
    numberofvestions: actualVersionCount,
    seed: seed,
  };

  const settingsBlock = generateSettingsBlock(templateSettings);

  return `${settingsBlock}
\\documentclass[leqno,fleqn,12pt]{article}
% exam paper size and margins
\\usepackage[${templateSettings.paper_size.toLowerCase()}paper,top=2cm,bottom=1cm,left=1cm,right=1cm]{geometry}

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

%% Predefined commands
${SEPARATOR_COMMANDS}
\\newcommand{\\newcodecover}[1]{}
%%
%%
%% COPY AND PASTE YOUR CUSTOM COVER PAGE BELOW  THE TAGS {#preamble} and {/preamble} BETWEEN
%% --------------------------------- YOUR CUSTOM COVER PAGE    ---------------------------------
%\\renewcommand{\\newcodecover}[1]{%

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
${exam.preamble || ""}
%{/preamble}
%% --------------------------------- END OF YOUR PACKAGES AND COMMANDS ---------------------------
%%
%% document body
\\begin{document}


\\begin{enumerate}

${templateQuestions}

\\end{enumerate} % end of questions items

%% ================================ RANDOMIZATION EXAMPLES ================================
%% The following are examples showing different types of question randomization.
%% Uncomment and modify these examples as needed for your exam.
%%
%% QUESTION TAGS (each on its own line, between \\item and %{#q}):
%%   %{#correct:X}       the correct option letter (A-E). Without it, option A is correct.
%%   %{#fixed-position}  keep the question's place within its group; options still shuffle
%%   %{#fixed-options}   keep the option order; the question can still move
%%   %{#fixed-options:E} keep only option E in place (e.g. "None of the above"); the
%%                       other options shuffle. Several letters: %{#fixed-options:DE}
%%   %{#fixed}           keep both the place and the option order
%%   %{#separate-page}   put the question on its own page (it must be alone in its group)

%% EXAMPLE 1: Completely Fixed Question (position and option order)
%% Use %{#fixed} when you want a question to appear in the same position
%% in all versions with the same option order
%
% \\item
% %{#fixed}
% %{#correct:A}
% %{#q}
% This question will always appear in the same position in all exam versions.
% The option order will also remain the same across all versions.
% %{/q}
%
%   \\begin{enumerate}
%
%     \\item
%     %{#o}
%     Correct answer (option A, as set by %{#correct:A})
%     %{/o}
%
%     \\item
%     %{#o}
%     Wrong answer option 1
%     %{/o}
%
%     \\item
%     %{#o}
%     Wrong answer option 2
%     %{/o}
%
%     \\item
%     %{#o}
%     Wrong answer option 3
%     %{/o}
%
%     \\item
%     %{#o}
%     Wrong answer option 4
%     %{/o}
%
%   \\end{enumerate}

%% EXAMPLE 2: Fixed Options with Random Position
%% Use %{#fixed-options} to keep the option order while the question position is
%% randomized, and %{#correct:X} to say which option is correct
%
% \\item
% %{#fixed-options}
% %{#correct:C}
% %{#q}
% This question can appear in different positions across versions,
% but the option order will remain the same. The correct answer is option C.
% %{/q}
%
%   \\begin{enumerate}
%
%     \\item
%     %{#o}
%     Wrong answer option 1 (always option A)
%     %{/o}
%
%     \\item
%     %{#o}
%     Wrong answer option 2 (always option B)
%     %{/o}
%
%     \\item
%     %{#o}
%     Correct answer (always option C)
%     %{/o}
%
%     \\item
%     %{#o}
%     Wrong answer option 3 (always option D)
%     %{/o}
%
%     \\item
%     %{#o}
%     Wrong answer option 4 (always option E)
%     %{/o}
%
%   \\end{enumerate}

%% EXAMPLE 2b: Fixed Position with Shuffled Options
%% Use %{#fixed-position} to keep the question in its place while its options shuffle
%
% \\item
% %{#fixed-position}
% %{#correct:B}
% %{#q}
% This question always appears in the same place, but its options are shuffled.
% %{/q}
%
%   \\begin{enumerate}
%
%     \\item
%     %{#o}
%     Wrong answer
%     %{/o}
%
%     \\item
%     %{#o}
%     Correct answer (option B in this master copy)
%     %{/o}
%
%     \\item
%     %{#o}
%     Another wrong answer
%     %{/o}
%
%   \\end{enumerate}

%% EXAMPLE 2c: One Option Kept in Place
%% Use %{#fixed-options:E} to keep option E as E in every version (for example
%% "None of the above") while options A-D shuffle. Say the answer with %{#correct:X}.
%
% \\item
% %{#fixed-options:E}
% %{#correct:B}
% %{#q}
% Which of these numbers is prime?
% %{/q}
%
%   \\begin{enumerate}
%
%     \\item
%     %{#o}
%     $9$
%     %{/o}
%
%     \\item
%     %{#o}
%     $7$
%     %{/o}
%
%     \\item
%     %{#o}
%     $15$
%     %{/o}
%
%     \\item
%     %{#o}
%     $21$
%     %{/o}
%
%     \\item
%     %{#o}
%     None of the above (always option E)
%     %{/o}
%
%   \\end{enumerate}

%% EXAMPLE 3: True/False question (2 options)
%% You can have 2-5 options or none for open-ended questions
%
% \\item
% %{#q}
% This is a true or false question - supports variable option counts
% %{/q}
% 
%   \\begin{enumerate}
% 
%     \\item
%     %{#o}
%     True
%     %{/o}
% 
%     \\item
%     %{#o}
%     False
%     %{/o}
% 
%   \\end{enumerate}

%% EXAMPLE 4: Open-ended question (no options)
%% For essay questions or short-answer format
%
% \\item
% %{#q}
% This is an open-ended question where students write their own answer.
% No options are provided, making it suitable for essay or short-answer format.
% %{/q}

%% =========================== END OF RANDOMIZATION EXAMPLES ===========================

\\end{document}`;
}
