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
      return `  \\item
  %{#q} Question ${questionNumber} - Replace this with your actual question. %{/q}
  \\begin{enumerate}
    %{#o} Option A for question ${questionNumber} %{/o}
    %{#o} Correct answer for question ${questionNumber} %{/o}
    %{#o} Option C for question ${questionNumber} %{/o}
    %{#o} Option D for question ${questionNumber} %{/o}
    %{#o} Option E for question ${questionNumber} %{/o}
  \\end{enumerate}`;
    }).join('\n\n');

    const template = `%{#setting}
%    university=Your University
%    department=Your Department
%    term=Current Term
%    coursecode=COURSE101
%    examname=Exam Name
%    examdate=Exam Date
%    timeallowed=Time Allowed
%    numberofvestions=${numQuestions}
%    groups=${numQuestions}
%    examtype=MAJOR
%    code_name=VERSION
%    code_numbering=ALPHA
%    paper_size=A4
%{/setting}

\\begin{enumerate}
${templateQuestions}
\\end{enumerate}`;

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
%    university=Your University
%    department=Department of Mathematics
%    term=Fall 2024
%    coursecode=MATH101
%    examname=Midterm Examination
%    examdate=November 15, 2024
%    timeallowed=2 hours
%    numberofvestions=10
%    groups=5,5
%    examtype=MAJOR
%    code_name=VERSION
%    code_numbering=ALPHA
%    paper_size=A4
%{/setting}

\\begin{enumerate}
  \\item
  %{#q} What is the derivative of $x^2 + 3x + 1$? %{/q}
  \\begin{enumerate}
    %{#o} $2x + 3$ %{/o}
    %{#o} $x^2 + 3$ %{/o}
    %{#o} $2x + 1$ %{/o}
    %{#o} $x + 3$ %{/o}
    %{#o} $2x^2 + 3x$ %{/o}
  \\end{enumerate}

  \\item
  %{#q} Find the integral of $\\sin(x)$. %{/q}
  \\begin{enumerate}
    %{#o} $-\\cos(x) + C$ %{/o}
    %{#o} $\\cos(x) + C$ %{/o}
    %{#o} $\\tan(x) + C$ %{/o}
    %{#o} $-\\sin(x) + C$ %{/o}
    %{#o} $\\sec(x) + C$ %{/o}
  \\end{enumerate}
\\end{enumerate}`;
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