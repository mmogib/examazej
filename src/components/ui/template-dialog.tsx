import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FileText, Download } from 'lucide-react';
import { getFormattedCurrentDate, getCurrentTerm } from '@/lib/core/settings';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TEMPLATE_DIALOG');

interface TemplateDialogProps {
  onTemplateGenerate: (
    coursecode: string,
    examname: string,
    examdate: string,
    term: string,
    numQuestions: number,
    includeImageQuestion: boolean,
    includeCoverPage: boolean
  ) => void;
}

export function TemplateDialog({ onTemplateGenerate }: TemplateDialogProps) {
  const [coursecode, setCoursecode] = useState("");
  const [examname, setExamname] = useState("");
  const [examdate, setExamdate] = useState(getFormattedCurrentDate());
  const [term, setTerm] = useState("Term " + getCurrentTerm());
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [includeImageQuestion, setIncludeImageQuestion] = useState(false);
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState({
    coursecode: false,
    examname: false,
    examdate: false,
    term: false,
  });

  const handleGenerate = () => {
    logger.debug('Generate button clicked');

    // Mark all fields as touched
    setTouched({
      coursecode: true,
      examname: true,
      examdate: true,
      term: true,
    });

    const isValid =
      coursecode.trim() !== "" &&
      examname.trim() !== "" &&
      examdate.trim() !== "" &&
      term.trim() !== "" &&
      numQuestions > 0 &&
      numQuestions <= 100;

    if (isValid) {
      logger.group('Template Generation Request', () => {
        logger.info('Form validated successfully');
        logger.debug('Exam metadata', {
          coursecode,
          examname,
          examdate,
          term,
        });
        logger.debug('Template options', {
          numQuestions,
          includeImageQuestion,
          includeCoverPage,
        });
      });

      onTemplateGenerate(
        coursecode,
        examname,
        examdate,
        term,
        numQuestions,
        includeImageQuestion,
        includeCoverPage
      );
      setOpen(false);
      // Reset form
      setCoursecode("");
      setExamname("");
      setExamdate(getFormattedCurrentDate());
      setTerm("Term " + getCurrentTerm());
      setNumQuestions(10);
      setIncludeImageQuestion(false);
      setIncludeCoverPage(true);
      setTouched({
        coursecode: false,
        examname: false,
        examdate: false,
        term: false,
      });
      logger.debug('Form reset after successful generation');
    } else {
      logger.warn('Form validation failed', {
        hasCoursecode: coursecode.trim() !== "",
        hasExamname: examname.trim() !== "",
        hasExamdate: examdate.trim() !== "",
        hasTerm: term.trim() !== "",
        validQuestionCount: numQuestions > 0 && numQuestions <= 100,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    logger.debug(`Dialog ${newOpen ? 'opened' : 'closed'}`);
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setCoursecode("");
      setExamname("");
      setExamdate(getFormattedCurrentDate());
      setTerm("Term " + getCurrentTerm());
      setNumQuestions(10);
      setIncludeImageQuestion(false);
      setIncludeCoverPage(true);
      setTouched({
        coursecode: false,
        examname: false,
        examdate: false,
        term: false,
      });
      logger.debug('Form reset on dialog close');
    }
  };

  const isFormValid =
    coursecode.trim() !== "" &&
    examname.trim() !== "" &&
    examdate.trim() !== "" &&
    term.trim() !== "" &&
    numQuestions > 0 &&
    numQuestions <= 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="academic" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Download Sample Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Exam Template
          </DialogTitle>
          <DialogDescription>
            Generate a LaTeX template with placeholder questions. Fill in exam details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exam Metadata Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coursecode">
                Course Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coursecode"
                type="text"
                value={coursecode}
                onChange={(e) => setCoursecode(e.target.value)}
                onBlur={() => setTouched({ ...touched, coursecode: true })}
                placeholder="e.g., MATH 101, CS 201, PHYS 301"
                className={touched.coursecode && !coursecode.trim() ? "border-destructive" : ""}
              />
              {touched.coursecode && !coursecode.trim() && (
                <p className="text-sm text-destructive">Course code is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="examname">
                Exam Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="examname"
                type="text"
                value={examname}
                onChange={(e) => setExamname(e.target.value)}
                onBlur={() => setTouched({ ...touched, examname: true })}
                placeholder="e.g., First Major Exam, Final Exam"
                className={touched.examname && !examname.trim() ? "border-destructive" : ""}
              />
              {touched.examname && !examname.trim() && (
                <p className="text-sm text-destructive">Exam name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="examdate">
                Exam Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="examdate"
                type="text"
                value={examdate}
                onChange={(e) => setExamdate(e.target.value)}
                onBlur={() => setTouched({ ...touched, examdate: true })}
                placeholder="e.g., December 30, 2025"
                className={touched.examdate && !examdate.trim() ? "border-destructive" : ""}
              />
              {touched.examdate && !examdate.trim() && (
                <p className="text-sm text-destructive">Exam date is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">
                Term <span className="text-destructive">*</span>
              </Label>
              <Input
                id="term"
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onBlur={() => setTouched({ ...touched, term: true })}
                placeholder="e.g., Term 251"
                className={touched.term && !term.trim() ? "border-destructive" : ""}
              />
              {touched.term && !term.trim() && (
                <p className="text-sm text-destructive">Term is required</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4 text-sm text-muted-foreground">Template Options</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="num-questions">Number of Questions</Label>
                <Input
                  id="num-questions"
                  type="number"
                  min="1"
                  max="100"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                  placeholder="Enter number of questions"
                />
                <p className="text-sm text-muted-foreground">
                  Between 1 and 100 questions
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="include-image">Include sample image question</Label>
                  <p className="text-sm text-muted-foreground">
                    Add a question with image layout as the first question
                  </p>
                </div>
                <Switch
                  id="include-image"
                  checked={includeImageQuestion}
                  onCheckedChange={setIncludeImageQuestion}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="include-cover">Include cover page</Label>
                  <p className="text-sm text-muted-foreground">
                    Add a cover page to the exam template
                  </p>
                </div>
                <Switch
                  id="include-cover"
                  checked={includeCoverPage}
                  onCheckedChange={setIncludeCoverPage}
                />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
            <h4 className="font-medium">Template Features:</h4>
            <ul className="space-y-1 text-xs">
              <li><strong>Fixed Questions:</strong> Add <code>%{"{#fixed}"}</code> to prevent shuffling</li>
              <li><strong>Fixed Options:</strong> Add <code>%{"{#fixed-options:B}"}</code> to keep option order</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!isFormValid}
            variant="hero"
          >
            <Download className="h-4 w-4 mr-2" />
            Generate Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}