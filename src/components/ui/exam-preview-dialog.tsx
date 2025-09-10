import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import type { ExamData, ExamSettings } from '@/lib/types';

interface ExamPreviewDialogProps {
  versions: ExamData[];
  settings: ExamSettings;
  children?: React.ReactNode;
}

export function ExamPreviewDialog({ versions, settings, children }: ExamPreviewDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState('0');
  const [open, setOpen] = useState(false);

  const currentVersion = versions[parseInt(selectedVersion)] || versions[0];

  const renderQuestion = (question: any, index: number) => {
    const questionNumber = index + 1;
    const choices = question.choices?.[0] || [];
    
    return (
      <div key={index} className="mb-8 p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">Question {questionNumber}</Badge>
          {question.fixed && <Badge variant="secondary">Fixed Position</Badge>}
          {question.fixedOptions && <Badge variant="secondary">Fixed Options</Badge>}
        </div>
        
        <div className="mb-4 text-base leading-relaxed">
          <strong>{questionNumber}.</strong> {question.text}
        </div>

        {choices.length > 0 && (
          <div className="ml-6 space-y-2">
            {choices.map((choice: any, choiceIndex: number) => {
              const optionLetter = String.fromCharCode(65 + choiceIndex);
              return (
                <div key={choiceIndex} className="flex items-start gap-3">
                  <span className="font-semibold min-w-[20px]">{optionLetter}.</span>
                  <span>{choice.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {question.keepOnSeparatePage && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="outline" className="text-xs">Separate Page</Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview Exam
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Exam Preview
          </DialogTitle>
          <DialogDescription>
            Preview how your exam will appear to students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Version Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Version:</label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((_, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Version {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Header */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h2 className="text-xl font-bold">{settings.university}</h2>
            <h3 className="text-lg">{settings.department}</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p><strong>Course:</strong> {settings.coursecode}</p>
              <p><strong>Exam:</strong> {settings.examname}</p>
              <p><strong>Date:</strong> {settings.examdate}</p>
              <p><strong>Time Allowed:</strong> {settings.timeallowed}</p>
              <p><strong>Term:</strong> {settings.term}</p>
            </div>
          </div>

          {/* Instructions */}
          {settings.instructions && (
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <p className="text-sm whitespace-pre-wrap">{settings.instructions}</p>
            </div>
          )}

          {/* Questions */}
          <ScrollArea className="max-h-[400px]">
            <div className="pr-4">
              <h4 className="font-semibold mb-4">Questions ({currentVersion?.questions?.length || 0})</h4>
              {currentVersion?.questions?.map((question, index) => 
                renderQuestion(question, index)
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}