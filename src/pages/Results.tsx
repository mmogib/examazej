import { useState, useEffect } from "react";
import JSZip from "jszip";
import overleafIcon from "@/assets/overleaf-icon.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Download,
  ArrowLeft,
  Table as TableIcon,
  BarChart3,
  Settings2,
  ExternalLink,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { ExamPreviewSheet } from "@/components/ui/exam-preview-dialog";
import {
  generateExamVersions,
  generateCorrectnessSummary,
  generateQuestionOptionMapping,
} from "@/lib/core/versioning";
import {
  generateLatexDocument,
  generateMappingCSV,
  generateLatexTemplate,
  type GenerateLatexResult,
} from "@/lib/core/latex";
import { generateSettingsBlock } from "@/lib/core/settings";
import type { PageCountWarning } from "@/lib/utils/page-count-analyzer";
import type {
  ExamJSON,
  ExamData,
  VersionMapping,
  GenerationState,
} from "@/lib/types";

interface ResultsPageProps {
  examData: ExamJSON;
  seed: string;
  onBack: () => void;
}

export function ResultsPage({ examData, seed, onBack }: ResultsPageProps) {
  const [generationState, setGenerationState] =
    useState<GenerationState | null>(null);
  const [allowTrustedTex, setAllowTrustedTex] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pageCountWarning, setPageCountWarning] =
    useState<PageCountWarning | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<(() => void) | null>(
    null
  );
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
      seed,
    };

    setGenerationState(state);
    setLoading(false);
  }, [examData, seed]);

  // Helper function to generate base filename
  const getBaseFilename = () =>
    `${examData.setting.coursecode}_${examData.setting.examname.replace(
      /\s+/g,
      "_"
    )}`;

  // Helper function to submit content to Overleaf
  const submitToOverleaf = (content: string, filename: string) => {
    const form = document.createElement("form");
    form.action = "https://www.overleaf.com/docs";
    form.method = "post";
    form.target = "_blank";
    form.style.display = "none";

    const snippetInput = document.createElement("input");
    snippetInput.type = "hidden";
    snippetInput.name = "snip";
    snippetInput.value = content;
    form.appendChild(snippetInput);

    const nameInput = document.createElement("input");
    nameInput.type = "hidden";
    nameInput.name = "snip_name";
    nameInput.value = filename;
    form.appendChild(nameInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Overleaf button style configuration
  const overleafButtonProps = {
    className: "w-full text-white border-0",
    style: { backgroundColor: "rgb(71, 161, 65)" } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) =>
      (e.currentTarget.style.backgroundColor = "rgb(60, 140, 55)"),
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) =>
      (e.currentTarget.style.backgroundColor = "rgb(71, 161, 65)"),
  };
  const buildAndDownloadBundle = async () => {
    if (!generationState) return;

    const base = getBaseFilename();

    const { content: latexContent } = generateLatexDocument(
      generationState.settings,
      examData.exam,
      generationState.versions,
      generationState.mappings,
      allowTrustedTex
    );

    const template = generateLatexTemplate(
      generationState.settings,
      examData.exam,
      generationState.versions.length
    );

    const mappingCSV = generateMappingCSV(generationState.mappings);

    const optionsMappingTable = generateQuestionOptionMapping(
      generationState,
      examData.exam
    );
    const optionsMappingCSV = optionsMappingTable
      .map((row) => row.join(","))
      .join("\n");

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
          seed: generationState.seed,
        },
      },
    };

    const zip = new JSZip();
    zip.file(`${base}.tex`, latexContent);
    zip.file(`${base}_template.tex`, template);
    zip.file(`${base}_mapping.csv`, mappingCSV);
    zip.file(`${base}_options_mapping.csv`, optionsMappingCSV);
    zip.file(`${base}_session.json`, JSON.stringify(sessionData, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExamBundle = () => {
    if (!generationState) return;

    const { pageCountWarning: warning } = generateLatexDocument(
      generationState.settings,
      examData.exam,
      generationState.versions,
      generationState.mappings,
      allowTrustedTex
    );

    setPageCountWarning(warning);

    if (warning) {
      setPendingDownload(() => buildAndDownloadBundle);
      setShowWarningDialog(true);
    } else {
      buildAndDownloadBundle();
    }
  };

  const performOverleafOpen = () => {
    if (!generationState) return;

    const { content: latexContent, pageCountWarning: warning } =
      generateLatexDocument(
        generationState.settings,
        examData.exam,
        generationState.versions,
        generationState.mappings,
        allowTrustedTex
      );

    // Store warning for display in UI banner
    setPageCountWarning(warning);

    submitToOverleaf(latexContent, `${getBaseFilename()}.tex`);
  };

  const openInOverleaf = () => {
    if (!generationState) return;

    // Generate to check for warnings
    const { pageCountWarning: warning } = generateLatexDocument(
      generationState.settings,
      examData.exam,
      generationState.versions,
      generationState.mappings,
      allowTrustedTex
    );

    // If there's a page count warning, show dialog first
    if (warning) {
      setPageCountWarning(warning);
      setPendingDownload(() => performOverleafOpen);
      setShowWarningDialog(true);
    } else {
      // No warning, open directly
      performOverleafOpen();
    }
  };

  const openTemplateInOverleaf = () => {
    if (!generationState) return;

    const template = generateLatexTemplate(
      generationState.settings,
      examData.exam,
      generationState.versions.length
    );

    submitToOverleaf(template, `${getBaseFilename()}_template.tex`);
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

      {/* Page Count Variation Warning */}
      {pageCountWarning && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            ⚠️ Page Count Variation Detected
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-3">
              <p className="font-medium">
                Different exam versions have different total page counts. This
                may cause confusion in the exam hall - proctors might think
                some exams are incomplete or missing pages.
              </p>

              <div className="bg-background/50 p-3 rounded border">
                <p className="font-semibold mb-2">Page Count Distribution:</p>
                <ul className="space-y-1">
                  {pageCountWarning.distributions.map((dist) => (
                    <li key={dist.pageCount} className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {dist.pageCount} pages
                      </Badge>
                      <span className="text-sm">
                        {dist.versionCodes.join(", ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background/50 p-3 rounded border">
                <p className="font-semibold mb-2">Recommendations:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {pageCountWarning.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ol>
              </div>

              <p className="text-sm text-muted-foreground italic">
                Note: You can still download the exam files. The warning has
                also been added to the LaTeX file as a comment.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                    Successfully generated {generationState.versions.length}{" "}
                    exam versions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.questions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Questions
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.versions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Versions
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.settings.groups.split(",").length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Groups
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {generationState.mappings.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Mappings
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Exam Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">University:</span>{" "}
                        {generationState.settings.university}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span>{" "}
                        {generationState.settings.department}
                      </div>
                      <div>
                        <span className="font-medium">Course:</span>{" "}
                        {generationState.settings.coursecode}
                      </div>
                      <div>
                        <span className="font-medium">Exam:</span>{" "}
                        {generationState.settings.examname}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {generationState.settings.examdate}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>{" "}
                        {generationState.settings.timeallowed}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Generation Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Seed:</span>{" "}
                        <code className="bg-muted px-1 rounded">
                          {generationState.seed}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Groups:</span>{" "}
                        {generationState.settings.groups}
                      </div>
                      <div>
                        <span className="font-medium">Code Style:</span>{" "}
                        {generationState.settings.code_numbering}
                      </div>
                      <div>
                        <span className="font-medium">Paper Size:</span>{" "}
                        {generationState.settings.paper_size}
                      </div>
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
                    Complete mapping of questions and correct answers across all
                    versions
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
                            <TableCell className="font-mono text-xs">
                              {mapping.perm}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {mapping.correct}
                              </Badge>
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
                            <Badge
                              variant="outline"
                              className="w-8 h-6 justify-center"
                            >
                              {summary.questionNo}
                            </Badge>
                            {isFixed && (
                              <Badge variant="secondary" className="text-xs">
                                Fixed
                              </Badge>
                            )}
                            {masterQuestion?.fixedOptions && (
                              <Badge variant="outline" className="text-xs">
                                Fixed Options (
                                {masterQuestion.correctOptionLetter})
                              </Badge>
                            )}
                            {!hasOptions && (
                              <Badge variant="outline" className="text-xs">
                                Open-ended
                              </Badge>
                            )}
                            <span className="text-sm font-medium truncate flex-1">
                              {summary.text.length > 80
                                ? summary.text.substring(0, 80) + "..."
                                : summary.text}
                            </span>
                          </div>
                          {hasOptions ? (
                            <div className="grid grid-cols-5 gap-2">
                              {Object.entries(summary.correctCounts).map(
                                ([letter, count]) => (
                                  <div
                                    key={letter}
                                    className="text-center p-2 bg-muted/50 rounded"
                                  >
                                    <div className="font-bold">{letter}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {count}
                                    </div>
                                  </div>
                                )
                              )}
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
                    {generationState.versions
                      .slice(0, 2)
                      .map((version, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">
                            {generationState.settings.code_name}{" "}
                            {version.name.replace("version_", "")}
                          </h4>
                          <div className="space-y-3">
                            {version.questions
                              .slice(0, 3)
                              .map((question, qIndex) => {
                                const isFixed = question.fixed;
                                const isFixedOptions = question.fixedOptions;
                                return (
                                  <div key={qIndex} className="text-sm">
                                    <div className="font-medium mb-1 flex items-center gap-2">
                                      <span>
                                        {qIndex + 1}. {question.text}
                                      </span>
                                      {isFixed && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs h-4"
                                        >
                                          Fixed
                                        </Badge>
                                      )}
                                      {isFixedOptions && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs h-4"
                                        >
                                          Fixed Options (
                                          {question.correctOptionLetter})
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                      {question.choices[0].map(
                                        (choice, cIndex) => (
                                          <div
                                            key={cIndex}
                                            className={`
                                    ${
                                      cIndex === question.choices[1]
                                        ? "text-green-600 font-medium"
                                        : "text-muted-foreground"
                                    }
                                  `}
                                          >
                                            {String.fromCharCode(65 + cIndex)}.{" "}
                                            {choice.text}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            {version.questions.length > 3 && (
                              <div className="text-sm text-muted-foreground italic">
                                ... and {version.questions.length - 3} more
                                questions
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    {generationState.versions.length > 2 && (
                      <div className="text-center text-muted-foreground">
                        ... and {generationState.versions.length - 2} more
                        versions
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
              <ExamPreviewSheet
                versions={generationState?.versions || []}
                settings={generationState?.settings || examData.setting}
              >
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </ExamPreviewSheet>

              <Button
                onClick={downloadExamBundle}
                variant="hero"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exam Package (.zip)
              </Button>
            </CardContent>
          </Card>

          {/* Overleaf hidden on desktop (D27) — the app is offline; desktop users
              compile from the downloaded .zip. Shown on web only. */}
          {!__DESKTOP__ && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <img src={overleafIcon} alt="Overleaf" className="h-4 w-4" />
                  Overleaf
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={openInOverleaf} {...overleafButtonProps}>
                  <img
                    src={overleafIcon}
                    alt="Overleaf"
                    className="h-4 w-4 mr-2"
                  />
                  Complete Exam
                </Button>

                <Button onClick={openTemplateInOverleaf} {...overleafButtonProps}>
                  <img
                    src={overleafIcon}
                    alt="Overleaf"
                    className="h-4 w-4 mr-2"
                  />
                  Template
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Page Count Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Page Count Variation Warning
            </DialogTitle>
            <DialogDescription>
              Please review this important warning before proceeding with the
              download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-semibold mb-2">
                  Different exam versions have different total page counts!
                </p>
                <p className="text-sm">
                  This may cause confusion in the exam hall - proctors might
                  think some exams are incomplete or missing pages.
                </p>
              </AlertDescription>
            </Alert>

            {pageCountWarning && (
              <>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold mb-2">Page Count Distribution:</p>
                  <div className="space-y-2">
                    {pageCountWarning.distributions.map((dist) => (
                      <div
                        key={dist.pageCount}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Badge variant="outline" className="font-mono">
                          {dist.pageCount} pages
                        </Badge>
                        <span className="text-muted-foreground">
                          {dist.versionCodes.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold mb-2">Recommendations:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    {pageCountWarning.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {rec}
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-sm text-muted-foreground italic">
                  Note: The warning has been added to the LaTeX file as a
                  comment at the top. You can still download and use the files,
                  but be aware of potential confusion during exam distribution.
                </p>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowWarningDialog(false);
                setPendingDownload(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowWarningDialog(false);
                if (pendingDownload) {
                  pendingDownload();
                  setPendingDownload(null);
                }
              }}
            >
              Download Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
