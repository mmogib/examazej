import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, ArrowLeft, FileText, Table as TableIcon, BarChart3, Settings2, ExternalLink } from 'lucide-react';
import { generateExamVersions, generateCorrectnessSummary } from '@/lib/core/versioning';
import { generateLatexDocument, generateMappingCSV } from '@/lib/core/latex';
import { generateSettingsBlock } from '@/lib/core/settings';
import type { ExamJSON, ExamData, VersionMapping, GenerationState } from '@/lib/types';

interface ResultsPageProps {
  examData: ExamJSON;
  seed: string;
  onBack: () => void;
}

export function ResultsPage({ examData, seed, onBack }: ResultsPageProps) {
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const [allowTrustedTex, setAllowTrustedTex] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate exam versions
    const { versions, mappings } = generateExamVersions(
      examData.exam.questions,
      examData.setting,
      seed
    );

    const state: GenerationState = {
      settings: examData.setting,
      questions: examData.exam.questions,
      versions,
      mappings,
      seed
    };

    setGenerationState(state);
    setLoading(false);
  }, [examData, seed]);

  const downloadLatex = () => {
    if (!generationState) return;

    const latexContent = generateLatexDocument(
      generationState.settings,
      examData.exam,
      generationState.versions,
      generationState.mappings,
      allowTrustedTex
    );

    const blob = new Blob([latexContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examData.setting.coursecode}_${examData.setting.examname.replace(/\s+/g, '_')}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMappingCSV = () => {
    if (!generationState) return;

    const csvContent = generateMappingCSV(generationState.mappings);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examData.setting.coursecode}_mapping.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInOverleaf = () => {
    if (!generationState) return;

    const latexContent = generateLatexDocument(
      generationState.settings,
      examData.exam,
      generationState.versions,
      generationState.mappings,
      allowTrustedTex
    );

    // Create Overleaf project URL with LaTeX content
    const projectName = `${examData.setting.coursecode}_${examData.setting.examname.replace(/\s+/g, '_')}`;
    const overleafUrl = 'https://www.overleaf.com/docs?' + 
      'snip_uri=' + encodeURIComponent(`data:application/x-tex;base64,${btoa(unescape(encodeURIComponent(latexContent)))}`) +
      '&snip_name=' + encodeURIComponent(`${projectName}.tex`);
    
    window.open(overleafUrl, '_blank');
  };

  const downloadTemplate = () => {
    if (!generationState) return;

    const numQuestions = examData.exam.questions.length;
    
    // Generate template questions using actual exam data
    const templateQuestions = examData.exam.questions.map((question, i) => {
      const questionNumber = i + 1;
      
      // Generate the question tags based on question properties
      let questionTags = '';
      if (question.fixed) {
        questionTags = '%{#fixed}';
      } else if (question.fixedOptions && question.correctOptionLetter) {
        questionTags = `%{#fixed-options:${question.correctOptionLetter}}`;
      }
      
      const questionText = question.text || `Question ${questionNumber} text`;
      const choices = question.choices[0] || [];
      
      // Only generate options if the question has choices (not open-ended)
      const optionsText = choices.length > 0 ? 
        choices.map((choice, index) => {
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, E
          return `    \\item
    %{#o}
    ${choice.text || `Option ${optionLetter} for question ${questionNumber}`}
    %{/o}`;
        }).join('\n\n') : '';
      
      // Format question with or without options based on choice count
      if (choices.length === 0) {
        // Open-ended question (no options)
        return `\\item ${questionTags}
%{#q}
${questionText}
%{/q}`;
      } else {
        // Multiple choice question
        return `\\item ${questionTags}
%{#q}
${questionText}
%{/q}

  \\begin{enumerate}

${optionsText}

  \\end{enumerate}`;
      }
    }).join('\n\n');

    // Use current exam settings for the template with actual generated values
    const templateSettings = {
      ...generationState.settings,
      groups: generationState.settings.groups, // Keep the actual groups configuration
      numberofvestions: generationState.versions.length, // Use actual number of versions generated
      seed: generationState.seed // Include the seed used for generation
    };
    
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
    a.download = `${examData.setting.examname.replace(/\s+/g, '_')}_template.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSessionJSON = () => {
    if (!generationState) return;

    const sessionData = {
      ...examData,
      generation: {
        seed,
        generated_at: new Date().toISOString(),
        versions: generationState.versions.length,
        complete_state: {
          settings: generationState.settings,
          questions: generationState.questions,
          versions: generationState.versions,
          mappings: generationState.mappings,
          seed: generationState.seed
        }
      }
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examData.setting.coursecode}_session.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !generationState) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating exam versions...</p>
          </div>
        </div>
      </div>
    );
  }

  const correctnessSummary = generateCorrectnessSummary(
    generationState.questions,
    generationState.mappings
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Generated Results
          </h1>
          <p className="text-muted-foreground">
            Your exam versions are ready for download
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mapping">Mapping</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generation Summary</CardTitle>
                  <CardDescription>
                    Successfully generated {generationState.versions.length} exam versions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.questions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Questions</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.versions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Versions</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.settings.groups.split(',').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Groups</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.mappings.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Mappings</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Exam Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">University:</span> {generationState.settings.university}</div>
                      <div><span className="font-medium">Department:</span> {generationState.settings.department}</div>
                      <div><span className="font-medium">Course:</span> {generationState.settings.coursecode}</div>
                      <div><span className="font-medium">Exam:</span> {generationState.settings.examname}</div>
                      <div><span className="font-medium">Date:</span> {generationState.settings.examdate}</div>
                      <div><span className="font-medium">Time:</span> {generationState.settings.timeallowed}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Generation Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Seed:</span> <code className="bg-muted px-1 rounded">{generationState.seed}</code></div>
                      <div><span className="font-medium">Groups:</span> {generationState.settings.groups}</div>
                      <div><span className="font-medium">Code Style:</span> {generationState.settings.code_numbering}</div>
                      <div><span className="font-medium">Paper Size:</span> {generationState.settings.paper_size}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5" />
                    Question Mapping Table
                  </CardTitle>
                  <CardDescription>
                    Complete mapping of questions and correct answers across all versions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Group</TableHead>
                          <TableHead className="w-20">Master Q</TableHead>
                          <TableHead className="w-20">Version</TableHead>
                          <TableHead className="w-20">Version Q</TableHead>
                          <TableHead className="w-24">Perm</TableHead>
                          <TableHead className="w-20">Correct</TableHead>
                          <TableHead className="w-16">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generationState.mappings.map((mapping, index) => (
                          <TableRow key={index}>
                            <TableCell>{mapping.group}</TableCell>
                            <TableCell>{mapping.masterQNo}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{mapping.version}</Badge>
                            </TableCell>
                            <TableCell>{mapping.versionQNo}</TableCell>
                            <TableCell className="font-mono text-xs">{mapping.perm}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{mapping.correct}</Badge>
                            </TableCell>
                            <TableCell>{mapping.points || 1}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Correct Answer Distribution
                  </CardTitle>
                  <CardDescription>
                    Frequency of each option being correct across all versions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     {correctnessSummary.map((summary, index) => {
                       const masterQuestion = examData.exam.questions[index];
                       const isFixed = masterQuestion?.fixed;
                       const hasOptions = masterQuestion?.choices[0]?.length > 0;
                       return (
                       <div key={index} className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Badge variant="outline" className="w-8 h-6 justify-center">
                             {summary.questionNo}
                           </Badge>
                            {isFixed && (
                              <Badge variant="secondary" className="text-xs">
                                Fixed
                              </Badge>
                            )}
                            {masterQuestion?.fixedOptions && (
                              <Badge variant="outline" className="text-xs">
                                Fixed Options ({masterQuestion.correctOptionLetter})
                              </Badge>
                            )}
                            {!hasOptions && (
                              <Badge variant="outline" className="text-xs">
                                Open-ended
                              </Badge>
                            )}
                           <span className="text-sm font-medium truncate flex-1">
                             {summary.text.length > 80 ? summary.text.substring(0, 80) + "..." : summary.text}
                           </span>
                         </div>
                         {hasOptions ? (
                           <div className="grid grid-cols-5 gap-2">
                             {Object.entries(summary.correctCounts).map(([letter, count]) => (
                               <div key={letter} className="text-center p-2 bg-muted/50 rounded">
                                 <div className="font-bold">{letter}</div>
                                 <div className="text-sm text-muted-foreground">{count}</div>
                               </div>
                              ))}
                             </div>
                         ) : (
                           <div className="text-sm text-muted-foreground italic p-2 bg-muted/30 rounded">
                             No options - students provide their own answers
                           </div>
                         )}
                         </div>
                        );
                      })}
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Version Preview</CardTitle>
                  <CardDescription>
                    Preview of generated exam versions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {generationState.versions.slice(0, 2).map((version, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">
                          {generationState.settings.code_name} {version.name.replace('version_', '')}
                        </h4>
                        <div className="space-y-3">
                           {version.questions.slice(0, 3).map((question, qIndex) => {
                              const isFixed = question.fixed;
                              const isFixedOptions = question.fixedOptions;
                              return (
                              <div key={qIndex} className="text-sm">
                                <div className="font-medium mb-1 flex items-center gap-2">
                                  <span>{qIndex + 1}. {question.text}</span>
                                  {isFixed && (
                                    <Badge variant="secondary" className="text-xs h-4">
                                      Fixed
                                    </Badge>
                                  )}
                                  {isFixedOptions && (
                                    <Badge variant="outline" className="text-xs h-4">
                                      Fixed Options ({question.correctOptionLetter})
                                    </Badge>
                                  )}
                                </div>
                              <div className="ml-4 space-y-1">
                                {question.choices[0].map((choice, cIndex) => (
                                  <div key={cIndex} className={`
                                    ${cIndex === question.choices[1] ? 'text-green-600 font-medium' : 'text-muted-foreground'}
                                  `}>
                                    {String.fromCharCode(65 + cIndex)}. {choice.text}
                                  </div>
                                 ))}
                               </div>
                               </div>
                              );
                            })}
                           {version.questions.length > 3 && (
                            <div className="text-sm text-muted-foreground italic">
                              ... and {version.questions.length - 3} more questions
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {generationState.versions.length > 2 && (
                      <div className="text-center text-muted-foreground">
                        ... and {generationState.versions.length - 2} more versions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="trusted-tex" 
                  checked={allowTrustedTex}
                  onCheckedChange={setAllowTrustedTex}
                />
                <Label htmlFor="trusted-tex" className="text-sm">
                  Allow trusted LaTeX
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, LaTeX commands in questions won't be escaped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Downloads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={downloadLatex}
                variant="hero"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Full Exam
              </Button>
              
              <Button 
                onClick={openInOverleaf}
                variant="default"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open on Overleaf
              </Button>
              
              <Button 
                onClick={downloadTemplate}
                variant="academic"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <Button 
                onClick={downloadMappingCSV}
                variant="outline"
                className="w-full"
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Download Mapping CSV
              </Button>
              
              <Button 
                onClick={downloadSessionJSON}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Save Session JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}