import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ArrowLeft
} from 'lucide-react';

interface DocumentationPageProps {
  onBack: () => void;
}

export function DocumentationPage({ onBack }: DocumentationPageProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Documentation</h1>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Complete guide to creating and managing exams with the Exam Generator
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="template-format">Template Format</TabsTrigger>
          <TabsTrigger value="question-types">Question Types</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="export">Export & Output</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-6">
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
                    <p className="text-sm text-muted-foreground">Download our sample template and customize it with your questions, or upload an existing LaTeX file.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">2</Badge>
                  <div>
                    <h3 className="font-semibold">Configure Settings</h3>
                    <p className="text-sm text-muted-foreground">Set exam details like course name, date, number of versions, and question grouping.</p>
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
        </TabsContent>

        <TabsContent value="template-format" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LaTeX Template Format</CardTitle>
              <CardDescription>
                Learn the special markers and syntax for creating exam templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Essential Markers</h3>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Question Markers</h4>
                    <pre className="text-sm bg-background p-2 rounded border">
{`%{#q}
Your question text goes here
%{/q}`}
                    </pre>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Option Markers</h4>
                    <pre className="text-sm bg-background p-2 rounded border">
{`\\item
%{#o}
Option text goes here
%{/o}`}
                    </pre>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Settings Block</h4>
                    <pre className="text-sm bg-background p-2 rounded border">
{`%{#setting}
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
%paper_size=A4
%seed=exam2024
%{/setting}`}
                    </pre>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Complete Question Example</h3>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
{`\\item
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
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="question-types" className="space-y-6">
          <div className="grid gap-6">
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
    \\item %{#o}Venus%{/o}
    \\item %{#o}Mercury%{/o}
    \\item %{#o}Earth%{/o}
    \\item %{#o}Mars%{/o}
  \\end{enumerate}`}
                </pre>
              </CardContent>
            </Card>

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
    \\item %{#o}Fill in the bubble sheet%{/o}
  \\end{enumerate}`}
                </pre>
              </CardContent>
            </Card>

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
    \\item %{#o}Wrong answer A%{/o}
    \\item %{#o}Correct answer B%{/o}
    \\item %{#o}Wrong answer C%{/o}
  \\end{enumerate}`}
                </pre>
              </CardContent>
            </Card>

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
    \\item %{#o}True%{/o}
    \\item %{#o}False%{/o}
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
    \\item %{#o}Earth%{/o}
    \\item %{#o}Moon%{/o}
    \\item %{#o}Sun%{/o}
  \\end{enumerate}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Reproducible Randomization</CardTitle>
                <CardDescription>Use seeds to generate consistent results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  The seed value ensures that running the generator multiple times with the same settings produces identical results.
                </p>
                <div className="bg-muted p-3 rounded">
                  <code className="text-sm">%seed=exam2024fall</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Change the seed to get different randomizations, or keep it the same for consistent results.
                </p>
              </CardContent>
            </Card>

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
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-6">
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
                    <li>• <strong>Cover page</strong> with exam details and instructions</li>
                    <li>• <strong>Master version</strong> showing original question order</li>
                    <li>• <strong>All exam versions</strong> with randomized questions</li>
                    <li>• <strong>Answer keys</strong> for each version</li>
                    <li>• <strong>Question mapping</strong> to track question positions</li>
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
          </div>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <div className="grid gap-6">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}