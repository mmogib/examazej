import { useState } from "react";
import { FileText, Download, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { PrivacyNotice } from "@/components/ui/privacy-notice";
import { TemplateDialog } from "@/components/ui/template-dialog";
import { parseLatexTemplate, validateParsedTemplate } from "@/lib/core/parser";
import {
  generateTemplateSettings,
  generateSettingsBlock,
  getDefaultSettings,
} from "@/lib/core/settings";
import type {
  ExamJSON,
  ParsedLatexTemplate,
  ExamSettings,
  Question,
  ExamData,
} from "@/lib/types";
import { generateLatexTemplate } from "@/lib/core/latex";

interface StartPageProps {
  onDataLoaded: (data: ExamJSON) => void;
}

// Add this helper function inside Start.tsx, before generateTemplate()
const createExampleQuestions = (
  numQuestions: number,
  includeImageQuestion: boolean
): Question[] => {
  const questions: Question[] = [];

  // Add image question if requested
  if (includeImageQuestion) {
    questions.push({
      text: `%% play with parameters of the minipage, vspace*, hspace* environments to control the positioning of your text and figures
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
    \\end{minipage}`,
      choices: [
        [
          { text: "$-2$" },
          { text: "$0$" },
          { text: "$2$" },
          { text: "$\\pi$" },
          { text: "$-\\pi$" },
        ],
        0,
        null,
      ],
      group: 1,
      order: 1,
      fixed: false,
      fixedOptions: false,
      keepOnSeparatePage: false,
    });
  }

  const regularQuestionCount = includeImageQuestion
    ? numQuestions - 1
    : numQuestions;

  for (let i = 0; i < regularQuestionCount; i++) {
    const questionNumber = includeImageQuestion ? i + 2 : i + 1;
    const orderNumber = questions.length + 1;

    // First non-image question is fixed as an example
    const isFixed = orderNumber === (includeImageQuestion ? 2 : 1);

    // Question 2 (or 3 if image included) is a calculus question
    const isMathQuestion = questionNumber === (includeImageQuestion ? 3 : 2);

    // Question 3 (or 4 if image included) is an algebra question
    const isAlgebraQuestion = questionNumber === (includeImageQuestion ? 4 : 3);

    if (isMathQuestion) {
      questions.push({
        text: `Find the derivative of the following function:
$$f(x) = 3x^4 - 2x^3 + 5x^2 - 7x + 1$$`,
        choices: [
          [
            { text: "$f'(x) = 12x^3 - 6x^2 + 10x - 7$" },
            { text: "$f'(x) = 12x^3 - 6x^2 + 5x - 7$" },
            { text: "$f'(x) = 3x^3 - 2x^2 + 5x - 7$" },
            { text: "$f'(x) = 12x^4 - 6x^3 + 10x^2 - 7x$" },
            { text: "$f'(x) = 12x^3 - 6x^2 + 10x + 7$" },
          ],
          0,
          null,
        ],
        group: 1,
        order: orderNumber,
        fixed: false,
        fixedOptions: false,
        keepOnSeparatePage: false,
      });
    } else if (isAlgebraQuestion) {
      questions.push({
        text: `Solve the following system of linear equations:
\\begin{align}
2x + 3y &= 7 \\\\
x - y &= 1
\\end{align}`,
        choices: [
          [
            { text: "$x = 2, y = 1$" },
            { text: "$x = 1, y = 2$" },
            { text: "$x = 3, y = 0$" },
            { text: "$x = 0, y = 3$" },
            { text: "$x = 4, y = -1$" },
          ],
          0,
          null,
        ],
        group: 1,
        order: orderNumber,
        fixed: false,
        fixedOptions: false,
        keepOnSeparatePage: false,
      });
    } else {
      // Regular placeholder question
      const fixedNote = isFixed
        ? " (this question will appear in the same position across all versions)"
        : "";
      questions.push({
        text: `This is the body of question ${questionNumber}${fixedNote}`,
        choices: [
          [
            { text: `question ${questionNumber}, Item 1` },
            { text: `question ${questionNumber}, Item 2` },
            { text: `question ${questionNumber}, Item 3` },
            { text: `question ${questionNumber}, Item 4` },
            { text: `question ${questionNumber}, Item 5` },
          ],
          0,
          null,
        ],
        group: 1,
        order: orderNumber,
        fixed: isFixed,
        fixedOptions: false,
        keepOnSeparatePage: false,
      });
    }
  }

  return questions;
};

export function StartPage({ onDataLoaded }: StartPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExamFromTemplate = (template: ParsedLatexTemplate): ExamJSON => {
    // console.log("🔥 CREATING EXAM FROM TEMPLATE");
    // console.log("Template questions count:", template.questions.length);
    // console.log(
    //   "Template questions:",
    //   template.questions.map(
    //     (q, i) => `${i + 1}. "${q.text.substring(0, 50)}..."`
    //   )
    // );

    const defaults = getDefaultSettings();
    const settings = { ...defaults, ...template.settings };

    const examQuestions = template.questions.map((q, index) => ({
      ...q,
      group: 1,
      order: index + 1,
    }));

    // console.log("Final exam questions count:", examQuestions.length);
    // console.log(
    //   "Final exam questions:",
    //   examQuestions.map((q, i) => `${i + 1}. "${q.text.substring(0, 50)}..."`)
    // );

    const result = {
      setting: settings as ExamSettings,
      exam: {
        name: "master",
        ordering: null,
        preamble: template.preamble || "",
        questions: examQuestions,
        kept_in_one_page: [],
      },
      options_order: {},
    };

    // console.log(
    //   "✅ EXAM CREATED - Final questions count:",
    //   result.exam.questions.length
    // );
    return result;
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setLoading(true);

    try {
      const content = await file.text();

      if (file.name.endsWith(".json")) {
        const jsonData = JSON.parse(content) as ExamJSON;
        onDataLoaded(jsonData);
      } else if (file.name.endsWith(".tex")) {
        const parsed = parseLatexTemplate(content);
        const errors = validateParsedTemplate(parsed);
        if (errors.length > 0) {
          setError(`Template validation failed:\n${errors.join("\n")}`);
        } else {
          const examData = createExamFromTemplate(parsed);
          onDataLoaded(examData);
        }
      } else {
        setError("Unsupported file type. Please upload a .tex or .json file.");
      }
    } catch (err) {
      setError(
        "Failed to process file. Please check the format and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const generateTemplate = (
    numQuestions: number,
    includeImageQuestion = false
  ) => {
    // Create mock exam data with example questions
    const mockExam: ExamData = {
      name: "master",
      ordering: null,
      preamble: "",
      questions: createExampleQuestions(numQuestions, includeImageQuestion),
      kept_in_one_page: [],
    };

    const mockSettings = generateTemplateSettings(numQuestions);

    // Use the shared function from latex.ts
    const template = generateLatexTemplate(
      mockSettings,
      mockExam,
      mockSettings.numberofvestions
    );

    // Download the template
    const blob = new Blob([template], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
          Generate randomized exam versions with automatic answer keys. Built
          for university professors who value privacy and precision.
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
                Upload a LaTeX template (.tex) or existing exam JSON file to
                continue working
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
                  <p className="text-sm text-destructive whitespace-pre-line">
                    {error}
                  </p>
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
                  Write questions in our LaTeX template format or upload an
                  existing file
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
