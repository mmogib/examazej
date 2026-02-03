import { useState } from "react";
import {
  FileText,
  Download,
  Upload,
  ArrowRight,
  BarChart3,
  CheckCircle,
  FileSpreadsheet,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { parseCSV } from "@/lib/parsers/csv-parser";
import { parseExcel } from "@/lib/parsers/excel-parser";
import {
  convertToLatexFormat,
  validateGroupsMatchQuestions,
} from "@/lib/parsers/adapter";
import { generateCSVTemplate } from "@/lib/generators/csv-template";
import { generateExcelTemplate } from "@/lib/generators/excel-template";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("START_PAGE");

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
    const isFixed = false; // orderNumber === (includeImageQuestion ? 2 : 1);

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
  const [parsedPreview, setParsedPreview] = useState<{
    settings: Partial<ExamSettings>;
    questionsCount: number;
    hasInstructions: boolean;
    hasPreamble: boolean;
  } | null>(null);

  const createExamFromTemplate = (template: ParsedLatexTemplate): ExamJSON => {
    const defaults = getDefaultSettings();
    const settings = { ...defaults, ...template.settings };

    const examQuestions = template.questions.map((q, index) => ({
      ...q,
      group: 1,
      order: index + 1,
    }));

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
    setParsedPreview(null);
    setLoading(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "json") {
        const content = await file.text();
        const jsonData = JSON.parse(content) as ExamJSON;
        onDataLoaded(jsonData);
      } else if (extension === "tex") {
        // Existing LaTeX flow - UNCHANGED
        const content = await file.text();
        const parsed = parseLatexTemplate(content);
        const errors = validateParsedTemplate(parsed);

        if (errors.length > 0) {
          setError(`Template validation failed:\n${errors.join("\n")}`);
        } else {
          // Show preview
          setParsedPreview({
            settings: parsed.settings,
            questionsCount: parsed.questions.length,
            hasInstructions: !!parsed.settings.instructions,
            hasPreamble: !!parsed.preamble,
          });

          const examData = createExamFromTemplate(parsed);
          onDataLoaded(examData);
        }
      } else if (extension === "csv") {
        // NEW: CSV parsing
        const content = await file.text();
        const parsed = parseCSV(content);

        // Validate groups if present
        if (parsed.settings.groups && parsed.questions.length > 0) {
          validateGroupsMatchQuestions(
            parsed.settings.groups,
            parsed.questions.length
          );
        }

        // Convert to LaTeX format
        const latexFormat = convertToLatexFormat(parsed);

        // Show preview
        setParsedPreview({
          settings: latexFormat.settings,
          questionsCount: latexFormat.questions.length,
          hasInstructions: !!latexFormat.settings.instructions,
          hasPreamble: !!latexFormat.preamble,
        });

        // Create exam data
        const examData = createExamFromTemplate(latexFormat);
        onDataLoaded(examData);
      } else if (extension === "xlsx") {
        // NEW: Excel parsing
        const parsed = await parseExcel(file);

        // Validate groups if present
        if (parsed.settings.groups && parsed.questions.length > 0) {
          validateGroupsMatchQuestions(
            parsed.settings.groups,
            parsed.questions.length
          );
        }

        // Convert to LaTeX format
        const latexFormat = convertToLatexFormat(parsed);

        // Show preview
        setParsedPreview({
          settings: latexFormat.settings,
          questionsCount: latexFormat.questions.length,
          hasInstructions: !!latexFormat.settings.instructions,
          hasPreamble: !!latexFormat.preamble,
        });

        // Create exam data
        const examData = createExamFromTemplate(latexFormat);
        onDataLoaded(examData);
      } else {
        setError(
          "Unsupported file type. Please upload a .tex, .csv, .xlsx, or .json file."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process file. Please check the format and try again."
      );
      setParsedPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const generateTemplate = async (
    format: "tex" | "csv" | "xlsx",
    coursecode: string,
    examname: string,
    examdate: string,
    term: string,
    numQuestions: number,
    includeImageQuestion: boolean,
    includeCoverPage: boolean
  ) => {
    logger.group(`Generating ${format.toUpperCase()} Template`, () => {
      logger.debug("Parameters", {
        format,
        coursecode,
        examname,
        examdate,
        term,
        numQuestions,
        includeImageQuestion,
        includeCoverPage,
      });
    });

    // Create mock exam data with example questions
    const mockExam: ExamData = {
      name: "master",
      ordering: null,
      preamble: "",
      questions: createExampleQuestions(numQuestions, includeImageQuestion),
      kept_in_one_page: [],
    };

    logger.debug("Example questions created", {
      count: mockExam.questions.length,
    });

    const mockSettings = generateTemplateSettings({
      coursecode,
      examname,
      examdate,
      term,
      numQuestions,
      includeCoverPage,
    });
    const filename = `exam-${coursecode}-${examname}-${numQuestions}-questions.${format}`;
    logger.debug("Settings generated, seed:", mockSettings.seed);

    // Generate based on format
    if (format === "tex") {
      const template = generateLatexTemplate(
        mockSettings,
        mockExam,
        mockSettings.numberofvestions
      );

      logger.info("LaTeX template generated", {
        size: `${(template.length / 1024).toFixed(2)} KB`,
        filename: filename,
      });

      const blob = new Blob([template], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      const csvContent = generateCSVTemplate(mockSettings, mockExam);

      logger.info("CSV template generated", {
        size: `${(csvContent.length / 1024).toFixed(2)} KB`,
        filename: filename,
      });

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "xlsx") {
      const blob = await generateExcelTemplate(mockSettings, mockExam);

      logger.info("Excel template generated", {
        size: `${(blob.size / 1024).toFixed(2)} KB`,
        filename: filename,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    logger.info("Template downloaded successfully");
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
                <Download className="h-5 w-5" />
                Download Template
              </CardTitle>
              <CardDescription>
                Choose your preferred format to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  LaTeX Format (Advanced)
                </h3>
                <TemplateDialog
                  format="tex"
                  onTemplateGenerate={generateTemplate}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">
                  Excel Format
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Easy to edit in Excel or Google Sheets. Supports LaTeX math in
                  cells.
                </p>
                <TemplateDialog
                  format="xlsx"
                  onTemplateGenerate={generateTemplate}
                  triggerButton={
                    <Button variant="outline" className="w-full">
                      <Table2 className="h-4 w-4 mr-2" />
                      Download Excel Template (.xlsx)
                    </Button>
                  }
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">
                  CSV Format
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Plain text format. Easy to version control and edit.
                </p>
                <TemplateDialog
                  format="csv"
                  onTemplateGenerate={generateTemplate}
                  triggerButton={
                    <Button variant="outline" className="w-full">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download CSV Template (.csv)
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Existing Exam
              </CardTitle>
              <CardDescription>
                Upload LaTeX (.tex), Excel (.xlsx), CSV (.csv), or JSON file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                accept=".tex,.csv,.xlsx,.json"
                onFileSelect={handleFileSelected}
                selectedFile={selectedFile}
                onFileRemove={() => {
                  setSelectedFile(null);
                  setParsedPreview(null);
                  setError(null);
                }}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error parsing file</AlertTitle>
                  <AlertDescription className="whitespace-pre-line text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {parsedPreview && !error && !loading && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>File uploaded successfully</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Questions:
                        </span>
                        <Badge variant="secondary">
                          {parsedPreview.questionsCount}
                        </Badge>
                      </div>
                      {parsedPreview.settings.coursecode && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Course:</span>
                          <span className="font-medium">
                            {parsedPreview.settings.coursecode}
                          </span>
                        </div>
                      )}
                      {parsedPreview.settings.examname && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Exam:</span>
                          <span className="font-medium">
                            {parsedPreview.settings.examname}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Instructions:
                        </span>
                        <Badge
                          variant={
                            parsedPreview.hasInstructions
                              ? "default"
                              : "outline"
                          }
                        >
                          {parsedPreview.hasInstructions
                            ? "Included"
                            : "Using defaults"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Preamble:</span>
                        <Badge
                          variant={
                            parsedPreview.hasPreamble ? "default" : "outline"
                          }
                        >
                          {parsedPreview.hasPreamble ? "Custom" : "None"}
                        </Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {selectedFile && !error && !loading && !parsedPreview && (
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
      </div>

      {/* Regrade Tool Section */}
      <div className="mt-8">
        <Card className="group relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 shadow-card transition hover:shadow-elegant hover:border-primary/60">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-primary opacity-30 blur-3xl transition group-hover:opacity-40" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-gradient-to-r from-secondary to-primary opacity-20 blur-3xl" />

          <CardHeader className="relative text-center pb-3">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <BarChart3 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Next Step: Re-grade & Analyze
            </CardTitle>
            <CardDescription className="text-base text-foreground/80 mt-2">
              After receiving exam results from the grading center, use our
              companion tool for efficient re-grading and comprehensive item
              analysis.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative text-center">
            <div className="mb-5 grid gap-2 sm:grid-cols-2 text-left mx-auto max-w-xl">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground/90">
                  Re-grade MCQ exams efficiently
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground/90">
                  Perform detailed item analysis
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground/90">
                  Process KFUPM ITC results
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground/90">
                  100% client-side processing
                </span>
              </div>
            </div>

            <a
              href="https://regrade.mshahrani.website/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="group h-12 gap-2 rounded-xl px-8 text-base font-semibold shadow-elegant ring-2 ring-primary/30 hover:ring-primary/50"
              >
                Go to Regrade Tool
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          </CardContent>
        </Card>
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
                  Write questions in LaTeX, Excel, or CSV format. Choose what
                  works best for you.
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
