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
    console.log('🔥 CREATING EXAM FROM TEMPLATE');
    console.log('Template questions count:', template.questions.length);
    console.log('Template questions:', template.questions.map((q, i) => `${i+1}. "${q.text.substring(0, 50)}..."`));
    
    const defaults = getDefaultSettings();
    const settings = { ...defaults, ...template.settings };
    
    const examQuestions = template.questions.map((q, index) => ({
      ...q,
      group: 1,
      order: index + 1
    }));
    
    console.log('Final exam questions count:', examQuestions.length);
    console.log('Final exam questions:', examQuestions.map((q, i) => `${i+1}. "${q.text.substring(0, 50)}..."`));
    
    const result = {
      setting: settings as ExamSettings,
      exam: {
        name: 'master',
        ordering: null,
        preamble: template.preamble || '',
        questions: examQuestions,
        kept_in_one_page: []
      },
      options_order: {}
    };
    
    console.log('✅ EXAM CREATED - Final questions count:', result.exam.questions.length);
    return result;
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

  const generateTemplate = (numQuestions: number, includeImageQuestion = false) => {
    // Create image question if requested
    const imageQuestion = includeImageQuestion ? `% question 1
\\item
%{#q}
    %% play with parameters of the minipage, vspace*, hspace* environments to control the positioning of your text and figures
    \\begin{minipage}[t][10cm][t]{0.5\\textwidth}
    Consider the definite integral:
    $$\\int_{0}^{\\pi} \\sin(2x) \\, dx$$
    
    The graph shows $y = \\sin(2x)$ over the interval $[0, \\pi]$. Use the fundamental theorem of calculus to evaluate this integral, or analyze the geometric interpretation using the areas above and below the x-axis.
    
    Recall that $\\sin(2x)$ has period $\\pi$, and note the symmetry properties that may help simplify your calculation.
    \\end{minipage}
    \\begin{minipage}[t][5cm][t]{0.5\\textwidth}
    %% replace the image(example-image) with your own
    \\vspace*{0.5cm}\\hspace*{1cm}%
    \\includegraphics[width=70mm,height=80mm]{example-image}
    \\end{minipage}
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    $-2$
    %{/o}

    \\item
    %{#o}
    $0$
    %{/o}

    \\item
    %{#o}
    $2$
    %{/o}

    \\item
    %{#o}
    $\\pi$
    %{/o}

    \\item
    %{#o}
    $-\\pi$
    %{/o}

  \\end{enumerate}` : '';

    const regularQuestionCount = includeImageQuestion ? numQuestions - 1 : numQuestions;
    const templateQuestions = Array.from({ length: regularQuestionCount }, (_, i) => {
      const questionNumber = includeImageQuestion ? i + 2 : i + 1;
      // Add %{#fixed} comment for the first non-image question as an example
      const fixedComment = (!includeImageQuestion && questionNumber === 1) || (includeImageQuestion && questionNumber === 2) ? `%{#fixed}
` : '';
      
      // Make question 2 (or 3 if image is included) a mathematical calculus question
      const isMathQuestion = (!includeImageQuestion && questionNumber === 2) || (includeImageQuestion && questionNumber === 3);
      
      if (isMathQuestion) {
        return `% question ${questionNumber}
\\item
%{#q}
Find the derivative of the following function:
$$f(x) = 3x^4 - 2x^3 + 5x^2 - 7x + 1$$
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    $f'(x) = 12x^3 - 6x^2 + 10x - 7$
    %{/o}

    \\item
    %{#o}
    $f'(x) = 12x^3 - 6x^2 + 5x - 7$
    %{/o}

    \\item
    %{#o}
    $f'(x) = 3x^3 - 2x^2 + 5x - 7$
    %{/o}

    \\item
    %{#o}
    $f'(x) = 12x^4 - 6x^3 + 10x^2 - 7x$
    %{/o}

    \\item
    %{#o}
    $f'(x) = 12x^3 - 6x^2 + 10x + 7$
    %{/o}

  \\end{enumerate}`;
      }
      
      // Make the next question an algebra system of equations
      const isAlgebraQuestion = (!includeImageQuestion && questionNumber === 3) || (includeImageQuestion && questionNumber === 4);
      
      if (isAlgebraQuestion) {
        return `% question ${questionNumber}
\\item
%{#q}
Solve the following system of linear equations:
\\begin{align}
2x + 3y &= 7 \\\\
x - y &= 1
\\end{align}
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    $x = 2, y = 1$
    %{/o}

    \\item
    %{#o}
    $x = 1, y = 2$
    %{/o}

    \\item
    %{#o}
    $x = 3, y = 0$
    %{/o}

    \\item
    %{#o}
    $x = 0, y = 3$
    %{/o}

    \\item
    %{#o}
    $x = 4, y = -1$
    %{/o}

  \\end{enumerate}`;
      }
      
      return `% question ${questionNumber}
\\item
${fixedComment}%{#q}
This is the body of question ${questionNumber}${(!includeImageQuestion && questionNumber === 1) || (includeImageQuestion && questionNumber === 2) ? ' (this question will appear in the same position across all versions)' : ''}
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
    });

    const allQuestions = includeImageQuestion 
      ? [imageQuestion, ...templateQuestions]
      : templateQuestions;

    // Add proper spacing for 2 questions per page default
    const questionsWithSpacing = (() => {
      let questionsLatex = '';
      let questionsOnCurrentPage = 0;
      
      allQuestions.forEach((question, index) => {
        const isLastQuestion = index === allQuestions.length - 1;
        
        // Check if we need a new page (2 questions per page rule)
        if (questionsOnCurrentPage >= 2) {
          questionsLatex += '\n\\eogseparator\n';
          questionsOnCurrentPage = 0;
        }
        
        questionsLatex += question;
        questionsOnCurrentPage++;
        
        // Add appropriate separator
        if (questionsOnCurrentPage === 2 && !isLastQuestion) {
          questionsLatex += '\n\\eogseparator\n';
          questionsOnCurrentPage = 0;
        } else if (isLastQuestion) {
          questionsLatex += '\n\\eogseparator';
        } else {
          questionsLatex += '\n\\questionseparator\n';
        }
      });
      
      return questionsLatex;
    })();

    const templateSettings = generateTemplateSettings(numQuestions);
    const settingsBlock = generateSettingsBlock(templateSettings);

    const template = `${settingsBlock}
\\documentclass{article}
\\usepackage{graphicx}
\\usepackage{mathtools}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
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

${questionsWithSpacing}

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

%% EXAMPLE 2: Mathematical Question with Complex LaTeX Environments
%% Shows how to use advanced LaTeX math environments in questions
%
% \\item
% %{#q}
% Given the piecewise function:
% $$f(x) = \\begin{cases} 
% x^2 - 1 & \\text{if } x \\leq 0 \\\\
% \\sqrt{x} + 1 & \\text{if } 0 < x < 4 \\\\
% \\frac{1}{x-3} & \\text{if } x \\geq 4
% \\end{cases}$$
% Find $\\lim_{x \\to 0^+} f(x)$.
% %{/q}
% 
%   \\begin{enumerate}
% 
%     \\item
%     %{#o}
%     $1$
%     %{/o}
% 
%     \\item
%     %{#o}
%     $0$
%     %{/o}
% 
%     \\item
%     %{#o}
%     $-1$
%     %{/o}
% 
%     \\item
%     %{#o}
%     Does not exist
%     %{/o}
% 
%     \\item
%     %{#o}
%     $\\infty$
%     %{/o}
% 
%   \\end{enumerate}

%% EXAMPLE 3: Fixed Options with Random Position (Mathematical)
%% Use %{#fixed-options:X} where X is the correct option letter (A, B, C, D, E)
%% This keeps the option order the same but allows the question position to be randomized
%
% \\item %{#fixed-options:C}
% %{#q}
% Evaluate the following matrix determinant:
% $$\\begin{vmatrix}
% 2 & -1 & 3 \\\\
% 0 & 4 & 1 \\\\
% 5 & 2 & -2
% \\end{vmatrix}$$
% %{/q}
% 
%   \\begin{enumerate}
% 
%     \\item
%     %{#o}
%     $-42$
%     %{/o}
% 
%     \\item
%     %{#o}
%     $28$
%     %{/o}
% 
%     \\item
%     %{#o}
%     $-78$ % Correct answer (always option C)
%     %{/o}
% 
%     \\item
%     %{#o}
%     $56$
%     %{/o}
% 
%     \\item
%     %{#o}
%     $0$
%     %{/o}
% 
%   \\end{enumerate}

%% EXAMPLE 4: True/False question (2 options)
%% You can have 2-5 options or none for open-ended questions
%
% \\item
% %{#q}
% True or False: For any differentiable function $f(x)$, if $f'(c) = 0$ for some $c$ in the domain, then $f$ has a local extremum at $x = c$.
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

%% EXAMPLE 5: Open-ended Mathematical Question (no options)
%% For problems requiring detailed solutions or proofs
%
% \\item
% %{#q}
% Prove that $\\lim_{n \\to \\infty} \\frac{n^2 + 3n + 1}{2n^2 - n + 5} = \\frac{1}{2}$ using the definition of limits.
% Show all steps in your proof and justify each limit law used.
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
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Generate randomized exam versions with automatic answer keys. 
          Built for university professors who value privacy and precision.
        </p>
        
        <div className="max-w-xl mx-auto">
          <PrivacyNotice />
        </div>
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
                <div className="flex items-center justify-between p-3 rounded-md border border-success/20 bg-success/10">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      {selectedFile.name}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-success" />
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

      <div className="space-y-6 mt-8">        
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
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-medium mb-2">2. Configure Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Set exam details, randomization parameters, and version count
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-accent-foreground" />
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