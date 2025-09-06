import { useState } from 'react';
import { FileText, Download, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { TemplateDialog } from '@/components/ui/template-dialog';
import { parseLatexTemplate, validateParsedTemplate } from '@/lib/core/parser';
import type { ExamJSON, ParsedLatexTemplate } from '@/lib/types';
interface StartPageProps {
  onDataLoaded: (data: ExamJSON) => void;
}
export function StartPage({
  onDataLoaded
}: StartPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };
  const handleFileRemove = () => {
    setSelectedFile(null);
    setError(null);
  };
  const processFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const text = await selectedFile.text();
      if (selectedFile.name.endsWith('.json')) {
        // Parse JSON file
        try {
          const jsonData = JSON.parse(text) as ExamJSON;
          onDataLoaded(jsonData);
        } catch (err) {
          setError('Invalid JSON format. Please check your file.');
        }
      } else if (selectedFile.name.endsWith('.tex')) {
        // Parse LaTeX template
        const parsed: ParsedLatexTemplate = parseLatexTemplate(text);
        const validationErrors = validateParsedTemplate(parsed);
        if (validationErrors.length > 0) {
          setError(`Template validation failed:\n${validationErrors.join('\n')}`);
          return;
        }

        // Convert to ExamJSON format
        const examData: ExamJSON = {
          setting: {
            university: '',
            department: '',
            term: '',
            coursecode: '',
            examname: '',
            examdate: '',
            timeallowed: '',
            numberofvestions: parsed.questions.length,
            groups: '',
            // Will be set in the details page
            examtype: 'MAJOR',
            code_name: 'VERSION',
            code_numbering: 'ALPHA',
            paper_size: 'A4',
            ...parsed.settings
          },
          exam: {
            name: 'master',
            ordering: null,
            preamble: '',
            questions: parsed.questions.map((q, index) => ({
              ...q,
              group: 1,
              // Will be reassigned based on partition
              order: index + 1
            })),
            kept_in_one_page: []
          },
          options_order: {}
        };
        onDataLoaded(examData);
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
      return `\\item
%{#q}
This is the body of question ${questionNumber}
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

    const template = `%{#setting}
%		university=King Fahd University of Petroleum and Minerals
%		department=Department of Mathematics
%		term=T241
%		coursecode=MATH557
%		examname=Exam 1
%		examdate=November 07, 2025
%		timeallowed=120 Minutes
%		numberofvestions=${numQuestions}
%		groups=5,10,5
%		examtype=MAJOR
%		code_name=VERSION
%		code_numbering=ALPHA
%{/setting}
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

  const downloadTemplate = () => {
    const template = `%{#setting}
%		university=King Fahd University of Petroleum and Minerals
%		department=Department of Mathematics
%		term=T241
%		coursecode=MATH557
%		examname=Exam 1
%		examdate=November 07, 2025
%		timeallowed=120 Minutes
%		numberofvestions=4
%		groups=5,10,5
%		examtype=MAJOR
%		code_name=VERSION
%		code_numbering=ALPHA
%{/setting}
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

\\item
%{#q}
This is the body of question 1
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    question 1, Item 1
    %{/o}

    \\item
    %{#o}
    question 1, Item 2
    %{/o}

    \\item
    %{#o}
    question 1, Item 3
    %{/o}

    \\item
    %{#o}
    question 1, Item 4
    %{/o}

    \\item
    %{#o}
    question 1, Item 5
    %{/o}

  \\end{enumerate}

\\item
%{#q}
This is the body of question 2
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    question 2, Item 1
    %{/o}

    \\item
    %{#o}
    question 2, Item 2
    %{/o}

    \\item
    %{#o}
    question 2, Item 3
    %{/o}

    \\item
    %{#o}
    question 2, Item 4
    %{/o}

    \\item
    %{#o}
    question 2, Item 5
    %{/o}

  \\end{enumerate}

\\item
%{#q}
This is the body of question 3
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    question 3, Item 1
    %{/o}

    \\item
    %{#o}
    question 3, Item 2
    %{/o}

    \\item
    %{#o}
    question 3, Item 3
    %{/o}

    \\item
    %{#o}
    question 3, Item 4
    %{/o}

    \\item
    %{#o}
    question 3, Item 5
    %{/o}

  \\end{enumerate}

\\item
%{#q}
This is the body of question 4
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    question 4, Item 1
    %{/o}

    \\item
    %{#o}
    question 4, Item 2
    %{/o}

    \\item
    %{#o}
    question 4, Item 3
    %{/o}

    \\item
    %{#o}
    question 4, Item 4
    %{/o}

    \\item
    %{#o}
    question 4, Item 5
    %{/o}

  \\end{enumerate}

\\end{enumerate} % end of questions items
\\end{document}`;
    const blob = new Blob([template], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam-template.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Create Professional MCQ Exams</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate randomized exam versions with automatic answer keys. 
          Built for university professors who value privacy and precision.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Exam Content
              </CardTitle>
              <CardDescription>
                Start by uploading a LaTeX template or importing a previous session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} onFileRemove={handleFileRemove} accept=".tex,.json" label="Choose LaTeX Template or JSON" description="Upload .tex template or .json session file" />
              
              {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
                </div>}
              
              {selectedFile && <div className="flex gap-3">
                  <Button onClick={processFile} disabled={loading} variant="hero" className="flex-1">
                    {loading ? 'Processing...' : 'Continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Need a Template?
              </CardTitle>
              <CardDescription>
                Download our sample LaTeX template to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={downloadTemplate} variant="academic" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Download Sample Template
              </Button>
              
              <TemplateDialog onTemplateGenerate={generateTemplate} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PrivacyNotice />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">✓ Deterministic Randomization</div>
                <div className="text-muted-foreground">Consistent results with same seed</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">✓ Group-Based Questions</div>
                <div className="text-muted-foreground">Organize by topics or difficulty</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">✓ Automatic Answer Keys</div>
                <div className="text-muted-foreground">Generate mapping tables & summaries</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">✓ LaTeX Output</div>
                <div className="text-muted-foreground">Professional typeset documents</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}