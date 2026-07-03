import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BookOpen,
  FileText,
  Settings,
  Download,
  AlertCircle,
  CheckCircle,
  Shuffle,
  Lock,
  Edit3,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Zap,
  Target,
  Clock,
  Table as TableIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentationPageProps {
  onBack: () => void;
}

export function DocumentationPage({ onBack }: DocumentationPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { toast } = useToast();

  // Search functionality with comprehensive tracking
  const searchSections = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return {
        "getting-started": { count: 0, hasMatches: false },
        "template-format": { count: 0, hasMatches: false },
        "question-types": { count: 0, hasMatches: false },
        advanced: { count: 0, hasMatches: false },
        export: { count: 0, hasMatches: false },
        troubleshooting: { count: 0, hasMatches: false },
      };
    }

    const searchLower = searchTerm.toLowerCase();

    const sections = {
      "getting-started": {
        content: [
          "Quick Start Guide getting started create upload template configure settings generate download",
          "Template dialog Course Code Exam Name Exam Date Term interactive form metadata",
          "Include Cover Page toggle number of questions image question sample",
          "Auto-generated seeds reproducibility unique randomization",
          "What This App Does",
          "Creates multiple randomized versions",
          "Shuffles question order",
          "Generates professional LaTeX documents",
          "Includes answer keys",
        ],
        count: 0,
        hasMatches: false,
      },
      "template-format": {
        content: [
          "LaTeX Template Format markers question option settings",
          "Essential Markers",
          "Question Markers",
          "Option Markers",
          "Settings Block",
          "Complete Question Example",
          "university department term coursecode examname examdate timeallowed numberofvestions groups",
          "examtype code_name code_numbering includeCoverPage paper_size seed",
          "CSV Format excel spreadsheet table simple text editor version control",
          "CSV sections settings instructions preamble questions required",
          "CSV columns Question Text Option Correct Tags behavioral modifiers",
          "Excel Format xlsx spreadsheet Microsoft Google Sheets",
          "Excel sheets Settings Instructions Preamble Questions",
          "Math support LaTeX equations dollar signs inline display",
          "Download template pre-filled examples formatting",
        ],
        count: 0,
        hasMatches: false,
      },
      "question-types": {
        content: [
          "Regular Questions randomized shuffle fixed options open-ended separate page image mathematical",
          "Fixed Questions same position option order",
          "Fixed-Options Questions randomized position fixed option order",
          "Open-Ended Questions essay short-answer written responses",
          "Separate Page Questions complex space diagrams calculations",
          "Image Questions graphics advanced LaTeX formatting",
          "Mathematical Questions LaTeX math calculus algebra amsmath derivatives integration",
          "True False Variable Options 2-5 options",
        ],
        count: 0,
        hasMatches: false,
      },
      advanced: {
        content: [
          "Question Grouping groups balanced mix randomization",
          "Group Shuffling parentheses shuffle group position randomize block", // ADD THIS
          "Smart Seed Generation dynamic seeds automatic randomization refresh",
          "Question Grouping groups balanced mix randomization",
          "Smart Seed Generation dynamic seeds automatic randomization refresh",
          "Cover Page Options master individual student cover pages includeCoverPage",
          "Custom Preamble LaTeX packages styling amsmath graphicx tikz",
        ],
        count: 0,
        hasMatches: false,
      },
      export: {
        content: [
          "LaTeX Document Output generated files master cover answer keys",
          "Version Mapping CSV track question distribution",
          "Options Matrix CSV option mapping answer choices permutation grading tracking",
          "Best Practices Recommendations printing exam distribution",
          "Overleaf Integration",
          "Printing Tips",
        ],
        count: 0,
        hasMatches: false,
      },
      troubleshooting: {
        content: [
          "Common Issues template format missing markers LaTeX errors",
          "No questions found in the template",
          "Question has empty text",
          "Cannot have more than 5 options",
          "Group partition doesn't match question count",
          "Best Practices",
          "Getting Help",
        ],
        count: 0,
        hasMatches: false,
      },
    };

    // Count matches in each section
    Object.keys(sections).forEach((sectionKey) => {
      const section = sections[sectionKey as keyof typeof sections];
      section.content.forEach((text) => {
        if (text.toLowerCase().includes(searchLower)) {
          section.count++;
          section.hasMatches = true;
        }
      });
    });

    return sections;
  };

  const searchResults = searchSections(searchTerm);
  const totalMatches = Object.values(searchResults).reduce(
    (sum, section) => sum + section.count,
    0
  );
  const sectionsWithMatches = Object.entries(searchResults).filter(
    ([_, section]) => section.hasMatches
  );

  // Filter content based on search term
  const shouldShowContent = (content: string) => {
    if (!searchTerm.trim()) return true;
    return content.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Highlight matching text
  const highlightText = (text: string) => {
    if (!searchTerm.trim()) return text;

    const searchRegex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(searchRegex);

    return parts.map((part, index) =>
      searchRegex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-900 rounded px-1"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const CodeBlock = ({ code, label }: { code: string; label: string }) => (
    <div className="relative group">
      <pre className="text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto border">
        {code}
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(code, label)}
      >
        {copiedText === code ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl animate-fade-in">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="hover-scale self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold bg-gradient-primary bg-clip-text text-transparent">
                Documentation
              </h1>
              <p className="text-muted-foreground">
                Master Examazej in minutes
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Quick Setup</p>
                  <p className="text-xs text-muted-foreground">
                    3 steps to your first exam
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Smart Randomization</p>
                  <p className="text-xs text-muted-foreground">
                    Dynamic seed generation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Ready to Print</p>
                  <p className="text-xs text-muted-foreground">
                    Professional LaTeX output
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />

          {/* Search Results Summary */}
          {searchTerm.trim() && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
              {totalMatches > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Found {totalMatches} result{totalMatches !== 1 ? "s" : ""}{" "}
                    across {sectionsWithMatches.length} section
                    {sectionsWithMatches.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {sectionsWithMatches.map(([sectionKey, section]) => (
                      <Badge
                        key={sectionKey}
                        variant="secondary"
                        className="text-xs"
                      >
                        {sectionKey.replace("-", " ")} ({section.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No results found for "{searchTerm}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger
            value="getting-started"
            className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white relative"
          >
            <div className="flex items-center gap-2">
              Getting Started
              {searchResults["getting-started"].hasMatches && (
                <Badge
                  variant="secondary"
                  className="h-5 w-5 p-0 text-xs rounded-full bg-yellow-500 text-white"
                >
                  {searchResults["getting-started"].count}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="template-format"
            className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white relative"
          >
            <div className="flex items-center gap-2">
              Template Format
              {searchResults["template-format"].hasMatches && (
                <Badge
                  variant="secondary"
                  className="h-5 w-5 p-0 text-xs rounded-full bg-yellow-500 text-white"
                >
                  {searchResults["template-format"].count}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="question-types"
            className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white relative"
          >
            <div className="flex items-center gap-2">
              Question Types
              {searchResults["question-types"].hasMatches && (
                <Badge
                  variant="secondary"
                  className="h-5 w-5 p-0 text-xs rounded-full bg-yellow-500 text-white"
                >
                  {searchResults["question-types"].count}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white relative"
          >
            <div className="flex items-center gap-2">
              Advanced
              {searchResults["advanced"].hasMatches && (
                <Badge
                  variant="secondary"
                  className="h-5 w-5 p-0 text-xs rounded-full bg-yellow-500 text-white"
                >
                  {searchResults["advanced"].count}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white relative"
          >
            <div className="flex items-center gap-2">
              Export & Output
              {searchResults["export"].hasMatches && (
                <Badge
                  variant="secondary"
                  className="h-5 w-5 p-0 text-xs rounded-full bg-yellow-500 text-white"
                >
                  {searchResults["export"].count}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="troubleshooting"
            className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white relative"
          >
            <div className="flex items-center gap-2">
              Troubleshooting
              {searchResults["troubleshooting"].hasMatches && (
                <Badge
                  variant="secondary"
                  className="h-5 w-5 p-0 text-xs rounded-full bg-yellow-500 text-white"
                >
                  {searchResults["troubleshooting"].count}
                </Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-6">
          {shouldShowContent(
            "Quick Start Guide getting started create upload template configure settings generate download"
          ) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {highlightText("Quick Start Guide")}
                </CardTitle>
                <CardDescription>
                  {highlightText("Get up and running in 3 simple steps")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex gap-4">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      1
                    </Badge>
                    <div>
                      <h3 className="font-semibold">
                        {highlightText("Create or Upload Template")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {highlightText(
                          "Generate a customized template by filling in your exam details (Course Code, Exam Name, Date, Term) in our interactive dialog, with options for cover pages and image questions. Or upload an existing LaTeX file."
                        )}
                      </p>
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>New!</strong> The template generator now
                          includes an interactive form that collects your exam
                          metadata and auto-generates unique seeds for
                          reproducibility.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      2
                    </Badge>
                    <div>
                      <h3 className="font-semibold">
                        {highlightText("Configure Settings")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {highlightText(
                          "Set exam details like course name, date, number of versions, question grouping, and formatting options like cover pages."
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      3
                    </Badge>
                    <div>
                      <h3 className="font-semibold">
                        {highlightText("Generate & Download")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {highlightText(
                          "Generate randomized exam versions and download the complete Exam Package (.zip) containing the LaTeX document, template, mapping CSVs, and session JSON."
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">
                    {highlightText("What This App Does")}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Shuffle className="h-4 w-4 text-primary mt-0.5" />
                      <span>
                        {highlightText(
                          "Creates multiple randomized versions of your exam"
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Edit3 className="h-4 w-4 text-primary mt-0.5" />
                      <span>
                        {highlightText(
                          "Shuffles question order and option order automatically"
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-primary mt-0.5" />
                      <span>
                        {highlightText(
                          "Generates professional LaTeX documents ready for printing"
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                      <span>
                        {highlightText("Includes answer keys for each version")}
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="template-format" className="space-y-6">
          {shouldShowContent(
            "LaTeX Template Format markers question option settings"
          ) && (
            <Card>
              <CardHeader>
                <CardTitle>LaTeX Template Format</CardTitle>
                <CardDescription>
                  Learn the special markers and syntax for creating exam
                  templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Essential Markers
                    <Badge variant="secondary">Quick Reference</Badge>
                  </h3>
                  <div className="space-y-4">
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                        <div className="bg-primary/10 p-3 rounded-lg flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            Question Markers
                            <ChevronDown className="h-4 w-4" />
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Wrap your question text
                          </p>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <CodeBlock
                          code={`%{#q}
Your question text goes here
%{/q}`}
                          label="Question markers"
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                        <div className="bg-green-500/10 p-3 rounded-lg flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            Option Markers
                            <ChevronDown className="h-4 w-4" />
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Multiple choice options
                          </p>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <CodeBlock
                          code={`\\item
%{#o}
Option text goes here
%{/o}`}
                          label="Option markers"
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                        <div className="bg-blue-500/10 p-3 rounded-lg flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            Settings Block
                            <ChevronDown className="h-4 w-4" />
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Configure your exam
                          </p>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <CodeBlock
                          code={`%{#setting}
%university=Your University Name
%department=Department Name
%term=Fall 2024
%coursecode=MATH 101
%examname=Midterm Exam
%examdate=October 15, 2024
%timeallowed=90 minutes
%numberofvestions=4
%groups=20
%examtype=Multiple Choice
%code_name=A
%code_numbering=ALPHA
%includeCoverPage=yes
%paper_size=A4
%seed=fall2024_midterm_auto
%{/setting}`}
                          label="Settings block"
                        />
                        <Alert className="mt-3">
                          <RefreshCw className="h-4 w-4" />
                          <AlertDescription>
                            Leave <code>seed</code> empty or use default values
                            to enable automatic dynamic seed generation.
                          </AlertDescription>
                        </Alert>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                <Separator />

                <div className="mt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Complete Question Example
                    <Badge variant="outline">Live Example</Badge>
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                    <CodeBlock
                      code={`\\item
%{#q}
What is the capital of France?
%{/q}

  \\begin{enumerate}

    \\item
    %{#o}
    London
    %{/o}

    \\item
    %{#o}
    Paris
    %{/o}

    \\item
    %{#o}
    Berlin
    %{/o}

    \\item
    %{#o}
    Madrid
    %{/o}

  \\end{enumerate}`}
                      label="Complete question example"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CSV Format */}
          {shouldShowContent("CSV Format excel spreadsheet table simple") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-green-500" />
                  CSV Format
                </CardTitle>
                <CardDescription>
                  Plain text format - easy to edit and version control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    CSV format is useful for users who prefer text editors or
                    want to version control their exams with Git.
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-semibold mb-2">Structure</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    CSV files have 4 sections marked with <code>#</code> headers.
                    Only the <code># questions</code> section is required.
                  </p>
                  <CodeBlock
                    code={`# settings
university,King Fahd University
coursecode,MATH 101
examname,Midterm Exam
term,Term 251

# instructions
Read all questions carefully
Show your work for partial credit

# preamble
\\usepackage{amsmath}
\\usepackage{tikz}

# questions
Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags
"What is $2+2$?",Three,Four,Five,,,B,
"Find $\\int x dx$","$x$","$\\frac{x^2}{2}+C$","$2x$",,,B,
"Student ID?","Enter ID",,,,,,A,fixed
"Essay question?",,,,,,,,separate-page`}
                    label="CSV template structure"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Question Columns</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <Badge variant="secondary">Question Text</Badge>
                      <span className="text-muted-foreground">
                        The question content (supports LaTeX math)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Option A-E</Badge>
                      <span className="text-muted-foreground">
                        Answer choices (leave empty for open-ended questions)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Correct</Badge>
                      <span className="text-muted-foreground">
                        Letter of correct answer (A, B, C, D, or E)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Tags</Badge>
                      <span className="text-muted-foreground">
                        Comma-separated: fixed, fixed-options, separate-page
                      </span>
                    </div>
                  </div>

                  <Alert className="mt-4 bg-amber-50 dark:bg-amber-950">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note:</strong> Question types are inferred automatically.
                      If a question has options, it's a multiple-choice question.
                      If it has no options, it's open-ended. No need to specify a type!
                    </AlertDescription>
                  </Alert>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Math Support:</strong> Use <code>$...$</code> for
                    inline math or <code>$$...$$</code> for display math.
                    Example: <code>"What is $x^2 + y^2$?"</code>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Excel Format */}
          {shouldShowContent("Excel Format xlsx spreadsheet table") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-blue-500" />
                  Excel Format
                </CardTitle>
                <CardDescription>
                  Easy to edit in Excel or Google Sheets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Excel format is useful for users who prefer working with
                    spreadsheets in Microsoft Excel or Google Sheets.
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-semibold mb-2">Structure</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Excel files have 4 sheets. Only the <strong>Questions</strong>{" "}
                    sheet is required. Sheet names are case-insensitive.
                  </p>
                  <div className="space-y-3">
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">1. Settings Sheet</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Key-value pairs for exam metadata
                      </p>
                      <div className="bg-muted p-2 rounded text-xs font-mono">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left pr-4">Key</th>
                              <th className="text-left">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>university</td>
                              <td>King Fahd University</td>
                            </tr>
                            <tr>
                              <td>coursecode</td>
                              <td>MATH 101</td>
                            </tr>
                            <tr>
                              <td>examname</td>
                              <td>Midterm Exam</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">2. Instructions Sheet</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        One instruction per row
                      </p>
                      <div className="bg-muted p-2 rounded text-xs">
                        • Read all questions carefully<br />
                        • Show your work for partial credit
                      </div>
                    </div>

                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">3. Preamble Sheet</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        LaTeX packages and custom commands
                      </p>
                      <div className="bg-muted p-2 rounded text-xs font-mono">
                        \usepackage{"{amsmath}"}<br />
                        \usepackage{"{tikz}"}
                      </div>
                    </div>

                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">4. Questions Sheet</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Table with 8 columns (same as CSV format)
                      </p>
                      <div className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left pr-2">Question Text</th>
                              <th className="text-left pr-2">Option A</th>
                              <th className="text-left pr-2">Option B</th>
                              <th className="text-left pr-2">...</th>
                              <th className="text-left pr-2">Correct</th>
                              <th className="text-left pr-2">Tags</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>What is $2+2$?</td>
                              <td>Three</td>
                              <td>Four</td>
                              <td>...</td>
                              <td>B</td>
                              <td></td>
                            </tr>
                            <tr>
                              <td>Student ID?</td>
                              <td>Enter ID</td>
                              <td></td>
                              <td>...</td>
                              <td>A</td>
                              <td>fixed</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Math Support:</strong> Type LaTeX math directly in
                    cells: <code>$x^2 + y^2$</code> or <code>$$\int x dx$$</code>
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-semibold mb-2">Download Template</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Download Excel Template" on the Start page to get a
                    pre-filled template with examples and proper formatting.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="question-types" className="space-y-6">
          <div className="grid gap-6">
            {shouldShowContent(
              "Regular Questions randomized shuffle fixed options open-ended separate page image mathematical"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shuffle className="h-5 w-5 text-blue-500" />
                    Regular Questions
                  </CardTitle>
                  <CardDescription>
                    Default behavior - randomized position and options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">
                    Questions appear in random order across versions, and their
                    options are shuffled.
                  </p>
                  <pre className="text-sm bg-muted p-3 rounded">
                    {`\\item
%{#q}
Which planet is closest to the Sun?
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    Venus
    %{/o}
    \\item
    %{#o}
    Mercury
    %{/o}
    \\item
    %{#o}
    Earth
    %{/o}
    \\item
    %{#o}
    Mars
    %{/o}
  \\end{enumerate}`}
                  </pre>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Fixed Questions same position option order"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-500" />
                    Fixed Questions
                  </CardTitle>
                  <CardDescription>
                    Same position and option order across all versions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">
                    Use{" "}
                    <code className="bg-muted px-1 rounded">%{`{#fixed}`}</code>{" "}
                    for questions that must appear in the same position with the
                    same option order.
                  </p>
                  <pre className="text-sm bg-muted p-3 rounded">
                    {`\\item
%{#fixed}
%{#q}
What is your student ID number?
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    Fill in the bubble sheet
    %{/o}
  \\end{enumerate}`}
                  </pre>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Fixed-Options Questions randomized position fixed option order"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-500" />
                    Fixed-Options Questions
                  </CardTitle>
                  <CardDescription>
                    Randomized position but fixed option order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">
                    Use{" "}
                    <code className="bg-muted px-1 rounded">
                      %{`{#fixed-options:X}`}
                    </code>{" "}
                    where X is the correct answer letter.
                  </p>
                  <pre className="text-sm bg-muted p-3 rounded">
                    {`\\item
%{#fixed-options:B}
%{#q}
Which letter represents the correct answer?
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    Wrong answer A
    %{/o}
    \\item
    %{#o}
    Correct answer B
    %{/o}
    \\item
    %{#o}
    Wrong answer C
    %{/o}
  \\end{enumerate}`}
                  </pre>
                  <Alert className="mt-4 bg-red-50 dark:bg-red-950 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900 dark:text-red-100">
                      <strong>Invalid Combination:</strong> Cannot use both <code className="bg-red-100 dark:bg-red-900 px-1 rounded">fixed</code> and{" "}
                      <code className="bg-red-100 dark:bg-red-900 px-1 rounded">fixed-options</code> tags together.
                      Use <code className="bg-red-100 dark:bg-red-900 px-1 rounded">fixed</code> to lock position AND options,
                      or <code className="bg-red-100 dark:bg-red-900 px-1 rounded">fixed-options</code> to lock options only.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Open-Ended Questions essay short-answer written responses"
            ) && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-green-500" />
                      Open-Ended Questions
                    </CardTitle>
                    <CardDescription>
                      No options - for essay or short-answer questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">
                      Simply omit the enumerate block for questions requiring
                      written responses.
                    </p>
                    <pre className="text-sm bg-muted p-3 rounded">
                      {`\\item
%{#q}
Explain the concept of photosynthesis and its importance in ecosystems.
%{/q}`}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Separate Page Questions
                    </CardTitle>
                    <CardDescription>
                      Force questions to appear on their own page
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">
                      Use{" "}
                      <code className="bg-muted px-1 rounded">
                        %{`{#separate-page}`}
                      </code>{" "}
                      to place a question on its own page, useful for complex
                      questions that need more space.
                    </p>
                    <pre className="text-sm bg-muted p-3 rounded">
                      {`\\item
%{#separate-page}
%{#q}
This is a complex question that requires its own page with lots of space for diagrams, calculations, or detailed explanations.
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    Option A
    %{/o}
    \\item
    %{#o}
    Option B  
    %{/o}
    \\item
    %{#o}
    Option C
    %{/o}
  \\end{enumerate}`}
                    </pre>
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Questions with the separate-page marker will be placed
                        on their own page and won't share space with other
                        questions. This is ideal for image-heavy questions or
                        those requiring significant workspace.
                      </AlertDescription>
                    </Alert>
                    <Alert className="mt-3 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-900 dark:text-red-100">
                        <strong>Grouping rule:</strong> A question with{" "}
                        <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                          separate-page
                        </code>{" "}
                        must be alone in its own group (size 1). Sharing a
                        group with other questions makes the total page count
                        depend on the shuffle outcome — different versions
                        would end up with different page totals. Example: for
                        3 questions where q3 is separate-page, use{" "}
                        <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                          2,1
                        </code>{" "}
                        or{" "}
                        <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                          [2],[1]
                        </code>
                        , not{" "}
                        <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                          3
                        </code>
                        .
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </>
            )}

            {shouldShowContent(
              "Separate Page Questions complex space diagrams calculations"
            ) && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      Image Questions
                    </CardTitle>
                    <CardDescription>
                      Questions with graphics and advanced LaTeX formatting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">
                      For questions that include images, diagrams, or complex
                      formatting, you can use full LaTeX code within the
                      question markers.
                    </p>
                    <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                      {`\\item
%{#q}
    %% play with parameters of the minipage, vspace*, hspace* environments to control positioning
    \\begin{minipage}[t][10cm][t]{0.5\\textwidth}
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi facilisis nulla semper justo convallis feugiat. Mauris ac orci ut nibh iaculis feugiat. Pellentesque nec molestie felis.
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
    Option A text
    %{/o}
    \\item
    %{#o}
    Option B text
    %{/o}
    \\item
    %{#o}
    Option C text
    %{/o}
    \\item
    %{#o}
    Option D text
    %{/o}
    \\item
    %{#o}
    Option E text
    %{/o}
  \\end{enumerate}`}
                    </pre>
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        When downloading a sample template, you can choose to
                        include an image question example. Complex LaTeX
                        formatting within question blocks is preserved and
                        processed correctly.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </>
            )}

            {shouldShowContent(
              "Mathematical Questions LaTeX math calculus algebra amsmath derivatives integration"
            ) && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-indigo-500" />
                      Mathematical Questions
                    </CardTitle>
                    <CardDescription>
                      LaTeX math environments for calculus, algebra, and
                      advanced mathematics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm mb-3">
                      Use LaTeX math environments for mathematical expressions.
                      The template includes{" "}
                      <code className="bg-muted px-1 rounded">
                        \usepackage{`{amsmath}`}
                      </code>{" "}
                      for advanced math support.
                    </p>

                    <div>
                      <h4 className="font-medium mb-2">
                        Calculus - Derivatives
                      </h4>
                      <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                        {`\\item
%{#q}
Find the derivative of $f(x) = 3x^2 + 2x - 1$:
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    $f'(x) = 6x + 2$
    %{/o}
    \\item
    %{#o}
    $f'(x) = 3x + 2$
    %{/o}
    \\item
    %{#o}
    $f'(x) = 6x^2 + 2x$
    %{/o}
  \\end{enumerate}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">
                        Algebra - Systems of Equations
                      </h4>
                      <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                        {`\\item
%{#q}
Solve the system: 
\\begin{align}
2x + y &= 7 \\\\
x - y &= 2
\\end{align}
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    $x = 3, y = 1$
    %{/o}
    \\item
    %{#o}
    $x = 2, y = 3$ 
    %{/o}
    \\item
    %{#o}
    $x = 1, y = 5$
    %{/o}
  \\end{enumerate}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">
                        Integration with Fractions
                      </h4>
                      <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                        {`\\item
%{#q}
Evaluate: $\\int \\frac{x^2 + 1}{x} dx$
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    $\\frac{x^2}{2} + \\ln|x| + C$
    %{/o}
    \\item
    %{#o}
    $x + \\frac{1}{x} + C$
    %{/o}
    \\item
    %{#o}
    $\\frac{x^3}{3} + x + C$
    %{/o}
  \\end{enumerate}`}
                      </pre>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Mathematical LaTeX is fully supported including
                        fractions, integrals, matrices, align environments, and
                        complex mathematical notation. The template
                        automatically includes amsmath package.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </>
            )}

            {shouldShowContent("True False Variable Options 2-5 options") && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>True/False & Variable Options</CardTitle>
                    <CardDescription>
                      Support for 2-5 options per question
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">
                          True/False (2 options)
                        </h4>
                        <pre className="text-sm bg-muted p-3 rounded">
                          {`\\item
%{#q}
The Earth is flat.
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    True
    %{/o}
    \\item
    %{#o}
    False
    %{/o}
  \\end{enumerate}`}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Three options</h4>
                        <pre className="text-sm bg-muted p-3 rounded">
                          {`\\item
%{#q}
Which is largest?
%{/q}

  \\begin{enumerate}
    \\item
    %{#o}
    Earth
    %{/o}
    \\item
    %{#o}
    Moon
    %{/o}
    \\item
    %{#o}
    Sun
    %{/o}
  \\end{enumerate}`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-6">
            {shouldShowContent(
              "Question Grouping groups balanced mix randomization"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle>Question Grouping</CardTitle>
                  <CardDescription>
                    Organize questions into groups for better randomization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    {highlightText(
                      "Group questions to ensure each version has a balanced mix. Groups provide two types of control:"
                    )}
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {highlightText("Basic Grouping (Without Parentheses)")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {highlightText(
                        "Groups stay in their original order, but questions shuffle within each group:"
                      )}
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>
                        • <code className="bg-muted px-1 rounded">20</code> -
                        All questions in one group
                      </li>
                      <li>
                        • <code className="bg-muted px-1 rounded">10,10</code> -
                        Two groups of 10 questions each
                      </li>
                      <li>
                        • <code className="bg-muted px-1 rounded">5,10,5</code>{" "}
                        - Three groups: 5 easy, 10 medium, 5 hard
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      {highlightText("Group Shuffling (With Parentheses)")}
                      <Badge variant="secondary" className="text-xs">
                        New!
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {highlightText(
                        "Wrap group sizes in parentheses to shuffle the groups themselves:"
                      )}
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>
                        •{" "}
                        <code className="bg-muted px-1 rounded">
                          (5),(5),(5),(5)
                        </code>{" "}
                        - All four groups can shuffle positions
                      </li>
                      <li>
                        •{" "}
                        <code className="bg-muted px-1 rounded">
                          5,(10),(5)
                        </code>{" "}
                        - First group stays put, last two can swap
                      </li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      {highlightText(
                        "See the 'Group Shuffling' section below for detailed examples and use cases."
                      )}
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {highlightText(
                        "Questions within each group maintain their structure, ensuring balanced coverage across all exam versions."
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
            {shouldShowContent(
              "Group Shuffling parentheses shuffle group position randomize block"
            ) && (
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shuffle className="h-5 w-5 text-purple-500" />
                    {highlightText("Group Shuffling")}
                    <Badge variant="secondary" className="text-xs">
                      New!
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {highlightText(
                      "Control whether groups themselves shuffle positions"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
                    <Shuffle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800 dark:text-purple-200">
                      <strong>New!</strong> Use parentheses to make groups
                      shuffle their positions while keeping questions in order
                      within each group.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {highlightText("Three Shuffling Modes")}
                    </h4>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="bg-muted/50 p-3 rounded-lg border">
                        <p className="font-semibold text-primary mb-2">
                          Standard Format
                        </p>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          5,5,5,5
                        </code>
                        <ul className="text-sm mt-2 space-y-1">
                          <li>• Groups stay in order</li>
                          <li>• Questions shuffle within</li>
                          <li>• Options shuffle</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                          Parentheses Format
                        </p>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          (5),(5),(5),(5)
                        </code>
                        <ul className="text-sm mt-2 space-y-1">
                          <li>• Groups shuffle positions</li>
                          <li>• Questions keep order</li>
                          <li>• Options shuffle</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="font-semibold text-green-600 dark:text-green-400 mb-2">
                          Bracket Format
                        </p>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          [5],[5],[5],[5]
                        </code>
                        <ul className="text-sm mt-2 space-y-1">
                          <li>• Groups shuffle positions</li>
                          <li>• Questions shuffle within</li>
                          <li>• Options shuffle</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {highlightText("Mixed Mode")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {highlightText(
                        "You can mix all three formats to have fine-grained control:"
                      )}
                    </p>

                    <div className="bg-muted p-3 rounded-lg">
                      <code className="text-sm">5,(10),[15],20</code>
                      <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                        <li>
                          • Group 1 (5 questions): Fixed at position 1, questions
                          shuffle within
                        </li>
                        <li>
                          • Group 2 (10 questions): Can swap with Group 3,
                          questions keep order
                        </li>
                        <li>
                          • Group 3 (15 questions): Can swap with Group 2,
                          questions shuffle within
                        </li>
                        <li>
                          • Group 4 (20 questions): Fixed at position 4, questions
                          shuffle within
                        </li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {highlightText("Use Cases")}
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Essay sections:</span>
                          <span className="text-muted-foreground">
                            {" "}
                            Use{" "}
                            <code className="bg-muted px-1 rounded">
                              (5),(5)
                            </code>{" "}
                            to shuffle entire essay prompt groups while keeping
                            multi-part questions together
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Calculation sets:</span>
                          <span className="text-muted-foreground">
                            {" "}
                            Keep related calculation steps in sequence while
                            varying which set appears first
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Thematic units (parentheses):</span>
                          <span className="text-muted-foreground">
                            {" "}
                            Use{" "}
                            <code className="bg-muted px-1 rounded">
                              (5),(5),(5)
                            </code>{" "}
                            to shuffle entire topic blocks (e.g., "Calculus",
                            "Algebra", "Geometry") while maintaining question
                            progression within each topic
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Topic randomization (brackets):</span>
                          <span className="text-muted-foreground">
                            {" "}
                            Use{" "}
                            <code className="bg-muted px-1 rounded">
                              [10],[10],[10]
                            </code>{" "}
                            to shuffle topic blocks AND randomize questions within
                            each topic for maximum variation (e.g., chemistry chapters
                            where question order doesn't matter)
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> The{" "}
                      <code className="bg-muted px-1 rounded">fixed</code> and{" "}
                      <code className="bg-muted px-1 rounded">
                        fixedOptions
                      </code>{" "}
                      markers are ignored for questions within parenthesized
                      groups, since the entire group maintains its internal
                      order.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Smart Seed Generation dynamic seeds automatic randomization refresh"
            ) && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                    Smart Seed Generation
                  </CardTitle>
                  <CardDescription>
                    Dynamic seeds for fresh randomization every time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>New!</strong> Seeds are now generated
                      automatically using exam details and timestamps for unique
                      randomization.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-medium">Automatic Seed Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      When creating new templates or leaving the seed field
                      empty, the system automatically generates dynamic seeds
                      based on:
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Course code and exam name</li>
                      <li>• Current date and time</li>
                      <li>• Term information</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      Manual Refresh
                      <Badge variant="outline" className="text-xs">
                        Interactive
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Use the refresh button (🔄) next to the seed field to
                      generate a new dynamic seed at any time.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Custom Seeds</h4>
                    <p className="text-sm text-muted-foreground">
                      You can still set custom seeds for reproducible results:
                    </p>
                    <CodeBlock
                      code="%seed=fall2024_midterm_v2"
                      label="Custom seed example"
                    />
                    <p className="text-sm text-muted-foreground">
                      Same seed always produces identical randomization across
                      generations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Cover Page Options master individual student cover pages includeCoverPage"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle>Cover Page Options</CardTitle>
                  <CardDescription>
                    Control cover page generation for different exam types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>New!</strong> When generating a sample template,
                      you can now toggle the "Include Cover Page" option
                      directly in the template generation dialog (enabled by
                      default).
                    </AlertDescription>
                  </Alert>

                  <p className="text-sm">
                    Examazej creates two types of cover pages that
                    serve different purposes:
                  </p>
                  <ul className="text-sm space-y-2 ml-4">
                    <li>
                      • <strong>Master Cover</strong> - Always included,
                      contains exam metadata for instructors
                    </li>
                    <li>
                      • <strong>Individual Version Covers</strong> - Optional
                      student-facing pages with name/ID fields
                    </li>
                  </ul>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Setting Control:</h4>
                    <pre className="text-sm bg-background p-2 rounded border mb-2">
                      {`%includeCoverPage=yes   (default - includes student cover pages)
%includeCoverPage=no   (no cover pages, adds name/ID header to each page)`}
                    </pre>
                    <p className="text-sm text-muted-foreground">
                      When set to <code>no</code>, student name and ID fields
                      are added to the page header instead of a separate cover
                      page.
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">
                      When to disable individual covers:
                    </h4>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>
                        • Short quizzes that don't need formal student
                        information pages
                      </li>
                      <li>
                        • Quick assessments to save paper and reduce printing
                        costs
                      </li>
                      <li>• When using separate bubble answer sheets</li>
                    </ul>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      When <code>includeCoverPage=no</code>, each student
                      version starts directly with questions and includes
                      "Name:" and "ID:" fields in the page header for student
                      identification.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Custom Preamble LaTeX packages styling amsmath graphicx tikz"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Preamble</CardTitle>
                  <CardDescription>
                    Add custom LaTeX packages and styling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                    {`%{#preamble}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{tikz}

% Custom commands
\\newcommand{\\highlight}[1]{\\textbf{#1}}
%{/preamble}`}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-6">
            {shouldShowContent(
              "LaTeX Document Output generated files master cover answer keys"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    LaTeX Document Output
                  </CardTitle>
                  <CardDescription>
                    Understanding the generated files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      Exam Package (.zip) Contents
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Clicking the <strong>Exam Package (.zip)</strong> button
                      downloads a single archive containing five files:
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>
                        • <code>{"{course}_{exam}.tex"}</code> — complete LaTeX
                        document (all versions + answer keys)
                      </li>
                      <li>
                        • <code>{"{course}_{exam}_template.tex"}</code> —
                        editable LaTeX template
                      </li>
                      <li>
                        • <code>{"{course}_{exam}_mapping.csv"}</code> —
                        question position map across versions
                      </li>
                      <li>
                        • <code>{"{course}_{exam}_options_mapping.csv"}</code>{" "}
                        — answer-choice permutation matrix
                      </li>
                      <li>
                        • <code>{"{course}_{exam}_session.json"}</code> — full
                        session state (for reproducibility)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">
                      What's Included in the LaTeX Document
                    </h4>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>
                        • <strong>Master cover page</strong> with exam details
                        and instructions
                      </li>
                      <li>
                        • <strong>Individual cover pages</strong> for student
                        info (optional - can be disabled for quizzes)
                      </li>
                      <li>
                        • <strong>Master version</strong> showing original
                        question order
                      </li>
                      <li>
                        • <strong>All exam versions</strong> with randomized
                        questions
                      </li>
                      <li>
                        • <strong>Answer keys</strong> for each version
                      </li>
                      <li>
                        • <strong>Question mapping</strong> to track question
                        positions
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">
                      LaTeX Processing Options
                    </h4>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>
                        • <strong>Allow trusted LaTeX</strong> (enabled by
                        default): Preserves LaTeX commands in questions for
                        complex formatting
                      </li>
                      <li>
                        • When disabled: LaTeX commands are escaped for plain
                        text display
                      </li>
                    </ul>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      The generated LaTeX file is ready to compile and print.
                      You can modify styling by editing the preamble section.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Version Mapping CSV track question distribution"
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle>Version Mapping CSV</CardTitle>
                  <CardDescription>
                    Track question distribution across versions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    The CSV file contains detailed mapping information showing
                    which questions appear where in each version.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <div className="text-sm font-mono">
                      Group,Master Q#,Version,Version Q#,Permutation,Correct
                      <br />
                      1,1,A,1,ABCDE,A
                      <br />
                      1,1,B,3,BAECD,B
                      <br />
                      1,2,A,2,CADBE,C
                      <br />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Options Matrix CSV option mapping answer choices permutation grading tracking"
            ) && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5 text-blue-500" />
                    {highlightText("Options Matrix CSV")}
                    <Badge variant="secondary" className="text-xs">
                      New!
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {highlightText(
                      "Detailed option-by-option mapping across all versions"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    {highlightText(
                      "The Options Matrix provides a comprehensive view of how each answer choice maps across all exam versions - essential for grading and verification."
                    )}
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {highlightText("What's Different from Question Map?")}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-muted/50 p-3 rounded-lg border">
                        <p className="font-semibold text-primary mb-1">
                          Question Map CSV
                        </p>
                        <p className="text-muted-foreground">
                          Shows which questions moved where
                        </p>
                        <p className="text-xs mt-1">
                          Example: Q5 → Q2 in Version A
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                          Options Matrix CSV
                        </p>
                        <p className="text-muted-foreground">
                          Shows which answer letters moved where
                        </p>
                        <p className="text-xs mt-1">
                          Example: Option C → Option A in Version A
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {highlightText("CSV Structure")}
                    </h4>
                    <div className="bg-muted p-3 rounded-lg overflow-x-auto">
                      <div className="text-xs font-mono whitespace-nowrap">
                        Q, Option, Master_Correct, A_Q, A_Opt, B_Q, B_Opt, C_Q,
                        C_Opt
                        <br />
                        1, A, YES, 1, B, 3, C, 5, A<br />
                        1, B, , 1, A, 3, D, 5, E<br />
                        1, C, , 1, D, 3, A, 5, B<br />
                        1, D, , 1, C, 3, B, 5, D<br />
                        1, E, , 1, E, 3, E, 5, C
                      </div>
                    </div>

                    <div className="text-sm space-y-2">
                      <p className="font-medium">Column Explanation:</p>
                      <ul className="space-y-1 ml-4">
                        <li>
                          • <code className="bg-muted px-1 rounded">Q</code> -
                          Master question number
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-muted px-1 rounded">Option</code>{" "}
                          - Original option letter (A, B, C, D, E)
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-muted px-1 rounded">
                            Master_Correct
                          </code>{" "}
                          - "YES" if this is the correct answer
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-muted px-1 rounded">
                            [Version]_Q
                          </code>{" "}
                          - Question position in that version
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-muted px-1 rounded">
                            [Version]_Opt
                          </code>{" "}
                          - What letter the option became
                        </li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {highlightText("Use Cases")}
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Manual Grading:</span>
                          <span className="text-muted-foreground">
                            {" "}
                            Quickly find where each answer choice appears across
                            versions when students use different versions
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Verification:</span>
                          <span className="text-muted-foreground">
                            {" "}
                            Confirm that option shuffling worked correctly and
                            all choices were properly randomized
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">
                            Answer Distribution:
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            Analyze correct answer distribution to ensure no
                            patterns (e.g., all A's) appear in any version
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">
                            Academic Integrity:
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            Document the randomization for academic records or
                            dispute resolution
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Tip:</strong> Use the Options Matrix when you need
                      to trace specific answer choices. Use the Question Map
                      when you just need to know which questions moved
                      positions.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {shouldShowContent(
              "Best Practices Recommendations printing exam distribution"
            ) && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-blue-500" />
                      Overleaf Integration
                    </CardTitle>
                    <CardDescription>
                      Direct compilation in the cloud
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      The "Open in Overleaf" button provides instant access to
                      your generated exam in Overleaf's online LaTeX editor.
                    </p>

                    <div>
                      <h4 className="font-medium mb-2">
                        What Happens When You Click
                      </h4>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>
                          • Creates a new Overleaf project with your exam
                          content
                        </li>
                        <li>
                          • Uploads the complete LaTeX document with all
                          versions
                        </li>
                        <li>
                          • Opens directly in your browser - no downloads needed
                        </li>
                        <li>• Ready to compile and generate PDF immediately</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Benefits</h4>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• No need to install LaTeX on your computer</li>
                        <li>• Compile and preview instantly in the cloud</li>
                        <li>• Share with colleagues for review or editing</li>
                        <li>• Access your exam from any device</li>
                      </ul>
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        You'll need a free Overleaf account. The generated
                        project is private to your account and can be compiled
                        immediately without any additional setup.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Printing Tips</CardTitle>
                    <CardDescription>
                      Best practices for physical exams
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Compile the LaTeX document using pdflatex or similar
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Print answer keys separately from student versions
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Check page breaks and formatting before mass printing
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Ensure version labels are clearly visible on each page
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <div className="grid gap-6">
            {shouldShowContent(
              "Common Issues template format missing markers LaTeX errors"
            ) && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Common Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        ❌ "No questions found in the template"
                      </h4>
                      <p className="text-sm mb-2">
                        <strong>Cause:</strong> Missing or malformed question
                        markers
                      </p>
                      <p className="text-sm">
                        <strong>Solution:</strong> Ensure each question has
                        proper{" "}
                        <code className="bg-muted px-1 rounded">
                          %{`{#q}`}...%{`{/q}`}
                        </code>{" "}
                        markers
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        ❌ "Question X has empty text"
                      </h4>
                      <p className="text-sm mb-2">
                        <strong>Cause:</strong> Question markers without content
                        between them
                      </p>
                      <p className="text-sm">
                        <strong>Solution:</strong> Add text between the question
                        markers
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        ❌ "Cannot have more than 5 options"
                      </h4>
                      <p className="text-sm mb-2">
                        <strong>Cause:</strong> Too many option markers in a
                        question
                      </p>
                      <p className="text-sm">
                        <strong>Solution:</strong> Remove extra options or split
                        into multiple questions
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        ❌ "Group partition doesn't match question count"
                      </h4>
                      <p className="text-sm mb-2">
                        <strong>Cause:</strong> Group sizes don't add up to
                        total questions
                      </p>
                      <p className="text-sm">
                        <strong>Solution:</strong> Adjust group partition or
                        question count to match
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Start with the provided template and modify gradually
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Test with a small number of questions first</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Use meaningful option text instead of placeholders
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Keep question text concise and clear</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Use consistent formatting throughout your template
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Getting Help</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      If you're still having issues after checking this
                      documentation:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li>
                        1. Verify your template follows the exact syntax shown
                        in examples
                      </li>
                      <li>
                        2. Try the sample template first to ensure the app works
                        correctly
                      </li>
                      <li>
                        3. Check that your LaTeX comments use{" "}
                        <code className="bg-muted px-1 rounded">%%</code>{" "}
                        instead of{" "}
                        <code className="bg-muted px-1 rounded">%</code> for
                        sections you want ignored
                      </li>
                      <li>
                        4. Review error messages carefully - they usually point
                        to the specific issue
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
