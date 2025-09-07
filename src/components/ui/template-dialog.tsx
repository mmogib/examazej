import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download } from 'lucide-react';

interface TemplateDialogProps {
  onTemplateGenerate: (numQuestions: number) => void;
}

export function TemplateDialog({ onTemplateGenerate }: TemplateDialogProps) {
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [open, setOpen] = useState(false);

  const handleGenerate = () => {
    if (numQuestions > 0 && numQuestions <= 100) {
      onTemplateGenerate(numQuestions);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="academic" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Download Sample Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Exam Template
          </DialogTitle>
          <DialogDescription>
            Generate a LaTeX template with placeholder questions. Specify how many questions you need.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
            <h4 className="font-medium">Template Features:</h4>
            <ul className="space-y-1 text-xs">
              <li><strong>Fixed Questions:</strong> Add <code>%{"{#fixed}"}</code> after any question text to prevent it from being shuffled in position or having its options reordered across versions.</li>
              <li><strong>Fixed Options:</strong> Add <code>%{"{#fixed-options:B}"}</code> (where B is the correct answer) to keep option order fixed while allowing question position to be randomized.</li>
            </ul>
          </div>
        </div>
        <DialogHeader>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={numQuestions < 1 || numQuestions > 100}
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