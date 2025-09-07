import { useState } from 'react';
import { FileText, Download, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { TemplateDialog } from '@/components/ui/template-dialog';
import { parseLatexTemplate, validateParsedTemplate } from '@/lib/core/parser';
import { generateTemplateSettings, generateSettingsBlock, getDefaultSettings } from '@/lib/core/settings';
import type { ExamJSON, ParsedLatexTemplate, ExamSettings } from '@/lib/types';

interface StartPageProps {
  onDataLoaded: (data: ExamJSON) => void;
}

export function StartPage({ onDataLoaded }: StartPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExamFromTemplate = (template: ParsedLatexTemplate): ExamJSON => {
    const defaults = getDefaultSettings();
    const settings = { ...defaults, ...template.settings };
    
    return {
      setting: settings as ExamSettings,
      exam: {
        name: 'master',
        ordering: null,
        preamble: template.preamble || '',
        questions: template.questions.map((q, index) => ({
          ...q,
          group: 1,
          order: index + 1
        })),
        kept_in_one_page: []
      },
      options_order: {}
    };
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setLoading(true);

    try {
      const content = await file.text();
      
      if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(content) as ExamJSON;
        onDataLoaded(jsonData);
      } else if (file.name.endsWith('.tex')) {
        const parsed = parseLatexTemplate(content);
        const errors = validateParsedTemplate(parsed);
        
        if (errors.length > 0) {
          setError(`Template validation failed:\n${errors.join('\n')}`);
        } else {
          const examData = createExamFromTemplate(parsed);
          onDataLoaded(examData);
        }
      } else {
        setError('Unsupported file type. Please upload a .tex or .json file.');
      }
    } catch (err) {
      setError('Failed to process file. Please check the format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateTemplate = (numQuestions: number) => {
    const templateQuestions = Array.from({ length: numQuestions }, (_, i) => {
      const questionNumber = i + 1;
      // Add %{#fixed} comment for the first question as an example
      const fixedComment = questionNumber === 1 ? `%{#fixed}
` : '';
      return `\\item
${fixedComment}%{#q}
This is the body of question ${questionNumber}${questionNumber === 1 ? ' (this question will appear in the same position across all versions)' : ''}
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    question ${questionNumber}, Item 1
    %{/o}

    \\item
    %{#o}
    question ${questionNumber}, Item 2
    %{/o}

    \\item
    %{#o}
    question ${questionNumber}, Item 3
    %{/o}

    \\item
    %{#o}
    question ${questionNumber}, Item 4
    %{/o}

    \\item
    %{#o}
    question ${questionNumber}, Item 5
    %{/o}

  \\end{enumerate}`;
    }).join('\n\n');

    const templateSettings = generateTemplateSettings(numQuestions);
    const settingsBlock = generateSettingsBlock(templateSettings);

    const template = `${settingsBlock}
\\documentclass{article}
\\usepackage{graphicx}
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

%% EXAMPLE 1: Completely Fixed Question (position and option order)
%% Use %{#fixed} when you want a question to appear in the same position 
%% in all versions with the same option order
%
% \\item %{#fixed}
% %{#q}
% This question will always appear in the same position in all exam versions.
% The option order will also remain the same across all versions.
% %{/q}
% 
%   \\begin{enumerate}
% 
%     \\item
%     %{#o}
%     Correct answer (will always be option A)
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
%% Use %{#fixed-options:X} where X is the correct option letter (A, B, C, D, E)
%% This keeps the option order the same but allows the question position to be randomized
%
% \\item %{#fixed-options:C}
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

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-template-${numQuestions}-questions.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Create Professional MCQ Exams
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate randomized exam versions with automatic answer keys. 
          Built for university professors who value privacy and precision.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Existing Exam
              </CardTitle>
              <CardDescription>
                Upload a LaTeX template (.tex) or existing exam JSON file to continue working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                accept=".tex,.json"
                onFileSelect={handleFileSelected}
                selectedFile={selectedFile}
                onFileRemove={() => setSelectedFile(null)}
              />
              
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
                </div>
              )}
              
              {selectedFile && !error && !loading && (
                <div className="flex items-center justify-between p-3 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      {selectedFile.name}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Template
              </CardTitle>
              <CardDescription>
                Download our sample LaTeX template to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <TemplateDialog onTemplateGenerate={generateTemplate} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <PrivacyNotice />
        
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">1. Prepare Your Exam</h3>
                <p className="text-sm text-muted-foreground">
                  Write questions in our LaTeX template format or upload an existing file
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">2. Configure Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Set exam details, randomization parameters, and version count
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">3. Generate & Download</h3>
                <p className="text-sm text-muted-foreground">
                  Get your randomized exam versions with automatic answer keys
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}