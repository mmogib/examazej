import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentationPageProps {
  onBack: () => void;
}

export function DocumentationPage({ onBack }: DocumentationPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter content based on search term
  const shouldShowContent = (content: string) => {
    if (!searchTerm.trim()) return true;
    return content.toLowerCase().includes(searchTerm.toLowerCase());
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
        variant: "destructive"
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
          <Button onClick={onBack} variant="outline" size="sm" className="hover-scale self-start">
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
                Master the Exam Generator in minutes
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
                  <p className="text-xs text-muted-foreground">3 steps to your first exam</p>
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
                  <p className="text-xs text-muted-foreground">Dynamic seed generation</p>
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
                  <p className="text-xs text-muted-foreground">Professional LaTeX output</p>
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
        </div>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="getting-started" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            Getting Started
          </TabsTrigger>
          <TabsTrigger value="template-format" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            Template Format
          </TabsTrigger>
          <TabsTrigger value="question-types" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            Question Types
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            Advanced
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            Export & Output
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            Troubleshooting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-6">
          {shouldShowContent("Quick Start Guide getting started create upload template configure settings generate download") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Get up and running in 3 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex gap-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">1</Badge>
                  <div>
                    <h3 className="font-semibold">Create or Upload Template</h3>
                    <p className="text-sm text-muted-foreground">Download our sample template (with optional image question sample) and customize it with your questions, or upload an existing LaTeX file.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">2</Badge>
                  <div>
                    <h3 className="font-semibold">Configure Settings</h3>
                    <p className="text-sm text-muted-foreground">Set exam details like course name, date, number of versions, question grouping, and formatting options like cover pages.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">3</Badge>
                  <div>
                    <h3 className="font-semibold">Generate & Download</h3>
                    <p className="text-sm text-muted-foreground">Generate randomized exam versions and download the complete LaTeX document with answer keys.</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">What This App Does</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Shuffle className="h-4 w-4 text-primary mt-0.5" />
                    <span>Creates multiple randomized versions of your exam</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Edit3 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Shuffles question order and option order automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5" />
                    <span>Generates professional LaTeX documents ready for printing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <span>Includes answer keys for each version</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="template-format" className="space-y-6">
          {shouldShowContent("LaTeX Template Format markers question option settings") && (
          <Card>
            <CardHeader>
              <CardTitle>LaTeX Template Format</CardTitle>
              <CardDescription>
                Learn the special markers and syntax for creating exam templates
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
                        <p className="text-sm text-muted-foreground">Wrap your question text</p>
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
                        <p className="text-sm text-muted-foreground">Multiple choice options</p>
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
                        <p className="text-sm text-muted-foreground">Configure your exam</p>
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
                          Leave <code>seed</code> empty or use default values to enable automatic dynamic seed generation.
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
        </TabsContent>

        <TabsContent value="question-types" className="space-y-6">
          <div className="grid gap-6">
            {shouldShowContent("Regular Questions randomized shuffle fixed options open-ended separate page image mathematical") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-blue-500" />
                  Regular Questions
                </CardTitle>
                <CardDescription>Default behavior - randomized position and options</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">Questions appear in random order across versions, and their options are shuffled.</p>
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

            {shouldShowContent("Fixed Questions same position option order") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-500" />
                  Fixed Questions
                </CardTitle>
                <CardDescription>Same position and option order across all versions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">Use <code className="bg-muted px-1 rounded">%{`{#fixed}`}</code> for questions that must appear in the same position with the same option order.</p>
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

            {shouldShowContent("Fixed-Options Questions randomized position fixed option order") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-500" />
                  Fixed-Options Questions
                </CardTitle>
                <CardDescription>Randomized position but fixed option order</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">Use <code className="bg-muted px-1 rounded">%{`{#fixed-options:X}`}</code> where X is the correct answer letter.</p>
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
              </CardContent>
            </Card>
            )}

            {shouldShowContent("Open-Ended Questions essay short-answer written responses") && (
            <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-green-500" />
                  Open-Ended Questions
                </CardTitle>
                <CardDescription>No options - for essay or short-answer questions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">Simply omit the enumerate block for questions requiring written responses.</p>
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
                <CardDescription>Force questions to appear on their own page</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">Use <code className="bg-muted px-1 rounded">%{`{#separate-page}`}</code> to place a question on its own page, useful for complex questions that need more space.</p>
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
                    Questions with the separate-page marker will be placed on their own page and won't share space with other questions. This is ideal for image-heavy questions or those requiring significant workspace.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            </>
            )}

            {shouldShowContent("Separate Page Questions complex space diagrams calculations") && (
            <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Image Questions
                </CardTitle>
                <CardDescription>Questions with graphics and advanced LaTeX formatting</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">For questions that include images, diagrams, or complex formatting, you can use full LaTeX code within the question markers.</p>
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
                    When downloading a sample template, you can choose to include an image question example. Complex LaTeX formatting within question blocks is preserved and processed correctly.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            </>
            )}

            {shouldShowContent("Mathematical Questions LaTeX math calculus algebra amsmath derivatives integration") && (
            <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-indigo-500" />
                  Mathematical Questions
                </CardTitle>
                <CardDescription>LaTeX math environments for calculus, algebra, and advanced mathematics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm mb-3">Use LaTeX math environments for mathematical expressions. The template includes <code className="bg-muted px-1 rounded">\usepackage{`{amsmath}`}</code> for advanced math support.</p>
                
                <div>
                  <h4 className="font-medium mb-2">Calculus - Derivatives</h4>
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
                  <h4 className="font-medium mb-2">Algebra - Systems of Equations</h4>
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
                  <h4 className="font-medium mb-2">Integration with Fractions</h4>
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
                    Mathematical LaTeX is fully supported including fractions, integrals, matrices, align environments, and complex mathematical notation. The template automatically includes amsmath package.
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
                <CardDescription>Support for 2-5 options per question</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">True/False (2 options)</h4>
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
            {shouldShowContent("Question Grouping groups balanced mix randomization") && (
            <Card>
              <CardHeader>
                <CardTitle>Question Grouping</CardTitle>
                <CardDescription>Organize questions into groups for better randomization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Group questions to ensure each version has a balanced mix. For example, if you have 20 questions:
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• <code className="bg-muted px-1 rounded">20</code> - All questions in one group</li>
                  <li>• <code className="bg-muted px-1 rounded">10,10</code> - Two groups of 10 questions each</li>
                  <li>• <code className="bg-muted px-1 rounded">5,10,5</code> - Three groups: 5 easy, 10 medium, 5 hard</li>
                </ul>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Questions within each group are shuffled, but the group structure is maintained across versions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            )}

            {shouldShowContent("Smart Seed Generation dynamic seeds automatic randomization refresh") && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  Smart Seed Generation
                </CardTitle>
                <CardDescription>Dynamic seeds for fresh randomization every time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>New!</strong> Seeds are now generated automatically using exam details and timestamps for unique randomization.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Automatic Seed Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    When creating new templates or leaving the seed field empty, the system automatically generates dynamic seeds based on:
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
                    <Badge variant="outline" className="text-xs">Interactive</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use the refresh button (🔄) next to the seed field to generate a new dynamic seed at any time.
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
                    Same seed always produces identical randomization across generations.
                  </p>
                </div>
              </CardContent>
            </Card>
            )}

            {shouldShowContent("Cover Page Options master individual student cover pages includeCoverPage") && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Page Options</CardTitle>
                <CardDescription>Control cover page generation for different exam types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  The exam generator creates two types of cover pages that serve different purposes:
                </p>
                <ul className="text-sm space-y-2 ml-4">
                  <li>• <strong>Master Cover</strong> - Always included, contains exam metadata for instructors</li>
                  <li>• <strong>Individual Version Covers</strong> - Optional student-facing pages with name/ID fields</li>
                </ul>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Setting Control:</h4>
                  <pre className="text-sm bg-background p-2 rounded border mb-2">
{`%includeCoverPage=yes   (default - includes student cover pages)
%includeCoverPage=no   (no cover pages, adds name/ID header to each page)`}
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    When set to <code>no</code>, student name and ID fields are added to the page header instead of a separate cover page.
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">When to disable individual covers:</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Short quizzes that don't need formal student information pages</li>
                    <li>• Quick assessments to save paper and reduce printing costs</li>
                    <li>• When using separate bubble answer sheets</li>
                  </ul>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    When <code>includeCoverPage=no</code>, each student version starts directly with questions and includes "Name:" and "ID:" fields in the page header for student identification.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            )}

            {shouldShowContent("Custom Preamble LaTeX packages styling amsmath graphicx tikz") && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Preamble</CardTitle>
                <CardDescription>Add custom LaTeX packages and styling</CardDescription>
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
            {shouldShowContent("LaTeX Document Output generated files master cover answer keys") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  LaTeX Document Output
                </CardTitle>
                <CardDescription>Understanding the generated files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">What's Included</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>Master cover page</strong> with exam details and instructions</li>
                    <li>• <strong>Individual cover pages</strong> for student info (optional - can be disabled for quizzes)</li>
                    <li>• <strong>Master version</strong> showing original question order</li>
                    <li>• <strong>All exam versions</strong> with randomized questions</li>
                    <li>• <strong>Answer keys</strong> for each version</li>
                    <li>• <strong>Question mapping</strong> to track question positions</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">LaTeX Processing Options</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>Allow trusted LaTeX</strong> (enabled by default): Preserves LaTeX commands in questions for complex formatting</li>
                    <li>• When disabled: LaTeX commands are escaped for plain text display</li>
                  </ul>
                </div>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    The generated LaTeX file is ready to compile and print. You can modify styling by editing the preamble section.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            )}

            {shouldShowContent("Version Mapping CSV track question distribution") && (
            <Card>
              <CardHeader>
                <CardTitle>Version Mapping CSV</CardTitle>
                <CardDescription>Track question distribution across versions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  The CSV file contains detailed mapping information showing which questions appear where in each version.
                </p>
                <div className="bg-muted p-3 rounded">
                  <div className="text-sm font-mono">
                    Group,Master Q#,Version,Version Q#,Permutation,Correct<br/>
                    1,1,A,1,ABCDE,A<br/>
                    1,1,B,3,BAECD,B<br/>
                    1,2,A,2,CADBE,C<br/>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {shouldShowContent("Best Practices Recommendations printing exam distribution") && (
            <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-500" />
                  Overleaf Integration
                </CardTitle>
                <CardDescription>Direct compilation in the cloud</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  The "Open in Overleaf" button provides instant access to your generated exam in Overleaf's online LaTeX editor.
                </p>
                
                <div>
                  <h4 className="font-medium mb-2">What Happens When You Click</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Creates a new Overleaf project with your exam content</li>
                    <li>• Uploads the complete LaTeX document with all versions</li>
                    <li>• Opens directly in your browser - no downloads needed</li>
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
                    You'll need a free Overleaf account. The generated project is private to your account and can be compiled immediately without any additional setup.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Printing Tips</CardTitle>
                <CardDescription>Best practices for physical exams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Compile the LaTeX document using pdflatex or similar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Print answer keys separately from student versions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Check page breaks and formatting before mass printing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Ensure version labels are clearly visible on each page</span>
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
            {shouldShowContent("Common Issues template format missing markers LaTeX errors") && (
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
                  <h4 className="font-medium text-red-600 mb-2">❌ "No questions found in the template"</h4>
                  <p className="text-sm mb-2"><strong>Cause:</strong> Missing or malformed question markers</p>
                  <p className="text-sm"><strong>Solution:</strong> Ensure each question has proper <code className="bg-muted px-1 rounded">%{`{#q}`}...%{`{/q}`}</code> markers</p>
                </div>

                <div>
                  <h4 className="font-medium text-red-600 mb-2">❌ "Question X has empty text"</h4>
                  <p className="text-sm mb-2"><strong>Cause:</strong> Question markers without content between them</p>
                  <p className="text-sm"><strong>Solution:</strong> Add text between the question markers</p>
                </div>

                <div>
                  <h4 className="font-medium text-red-600 mb-2">❌ "Cannot have more than 5 options"</h4>
                  <p className="text-sm mb-2"><strong>Cause:</strong> Too many option markers in a question</p>
                  <p className="text-sm"><strong>Solution:</strong> Remove extra options or split into multiple questions</p>
                </div>

                <div>
                  <h4 className="font-medium text-red-600 mb-2">❌ "Group partition doesn't match question count"</h4>
                  <p className="text-sm mb-2"><strong>Cause:</strong> Group sizes don't add up to total questions</p>
                  <p className="text-sm"><strong>Solution:</strong> Adjust group partition or question count to match</p>
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
                    <span>Start with the provided template and modify gradually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Test with a small number of questions first</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Use meaningful option text instead of placeholders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Keep question text concise and clear</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Use consistent formatting throughout your template</span>
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
                  If you're still having issues after checking this documentation:
                </p>
                <ul className="text-sm space-y-2">
                  <li>1. Verify your template follows the exact syntax shown in examples</li>
                  <li>2. Try the sample template first to ensure the app works correctly</li>
                  <li>3. Check that your LaTeX comments use <code className="bg-muted px-1 rounded">%%</code> instead of <code className="bg-muted px-1 rounded">%</code> for sections you want ignored</li>
                  <li>4. Review error messages carefully - they usually point to the specific issue</li>
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