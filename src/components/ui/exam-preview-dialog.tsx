import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { ExamData, ExamSettings } from '@/lib/types';

// Component to render LaTeX content
function LaTeXRenderer({ content }: { content: string }) {
  if (!content) return <span></span>;
  
  // Simple LaTeX detection and rendering
  const parts = content.split(/(\$\$[^$]+\$\$|\$[^$]+\$|\\begin\{[^}]+\}.*?\\end\{[^}]+\})/);
  
  return (
    <span>
      {parts.map((part, index) => {
        // Display math ($$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          try {
            return <BlockMath key={index} math={math} />;
          } catch {
            return <span key={index} className="text-red-500 bg-red-50 px-1 rounded">{part}</span>;
          }
        }
        // Inline math ($...$)
        else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          try {
            return <InlineMath key={index} math={math} />;
          } catch {
            return <span key={index} className="text-red-500 bg-red-50 px-1 rounded">{part}</span>;
          }
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

interface ExamPreviewSheetProps {
  versions: ExamData[];
  settings: ExamSettings;
  children?: React.ReactNode;
}

export function ExamPreviewSheet({ versions, settings, children }: ExamPreviewSheetProps) {
  const [selectedVersion, setSelectedVersion] = useState('0');
  const [open, setOpen] = useState(false);

  const currentVersion = versions[parseInt(selectedVersion)] || versions[0];

  const renderQuestion = (question: any, index: number) => {
    const questionNumber = index + 1;
    const choices = question.choices?.[0] || [];
    
    return (
      <div key={index} className="group p-5 border border-border/50 rounded-xl bg-card/50 hover:bg-card transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{questionNumber}</span>
            </div>
            {question.fixed && <Badge variant="default" className="text-xs">Fixed Position</Badge>}
            {question.fixedOptions && <Badge variant="secondary" className="text-xs">Fixed Options</Badge>}
          </div>
        </div>
        
        <div className="mb-4 text-base leading-relaxed pl-11">
          <LaTeXRenderer content={question.text} />
        </div>

        {choices.length > 0 && (
          <div className="pl-11 space-y-3">
            {choices.map((choice: any, choiceIndex: number) => {
              const optionLetter = String.fromCharCode(65 + choiceIndex);
              return (
                <div key={choiceIndex} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold">{optionLetter}</span>
                  </div>
                  <span className="text-sm leading-relaxed">
                    <LaTeXRenderer content={choice.text} />
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {question.keepOnSeparatePage && (
          <div className="mt-4 pt-3 border-t border-border/50 pl-11">
            <Badge variant="outline" className="text-xs">Separate Page</Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview Exam
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[800px] sm:max-w-[90vw]">
        <SheetHeader className="space-y-4">
          <SheetTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Exam Preview
          </SheetTitle>
          <SheetDescription>
            Preview how your exam will appear to students
          </SheetDescription>
          
          {/* Version Selector */}
          <div className="flex items-center gap-4 pt-2">
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
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Exam Header */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg border">
              <h2 className="text-2xl font-bold text-primary">{settings.university}</h2>
              <h3 className="text-lg text-muted-foreground">{settings.department}</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold">Course:</span> {settings.coursecode}</div>
                <div><span className="font-semibold">Date:</span> {settings.examdate}</div>
                <div><span className="font-semibold">Exam:</span> {settings.examname}</div>
                <div><span className="font-semibold">Time:</span> {settings.timeallowed}</div>
                <div><span className="font-semibold">Term:</span> {settings.term}</div>
              </div>
            </div>

            {/* Instructions */}
            {settings.instructions && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Instructions:</h4>
                <p className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">{settings.instructions}</p>
              </div>
            )}

            {/* Questions */}
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Questions 
                <Badge variant="secondary">{currentVersion?.questions?.length || 0} total</Badge>
              </h4>
              
              <div className="space-y-6">
                {currentVersion?.questions?.map((question, index) => 
                  renderQuestion(question, index)
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}