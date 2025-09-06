import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileText } from 'lucide-react';

interface InstructionsDialogProps {
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
}

// Convert LaTeX to HTML for initial display
const convertLatexToHtml = (latex: string): string => {
  return latex
    .replace(/\\begin{enumerate}(.*?)\\end{enumerate}/gs, (match, content) => {
      const items = content.split('\\item').filter(Boolean).map((item: string) => 
        `<li>${item.trim().replace(/\n/g, ' ')}</li>`
      ).join('');
      return `<ol>${items}</ol>`;
    })
    .replace(/\\begin{itemize}(.*?)\\end{itemize}/gs, (match, content) => {
      const items = content.split('\\item').filter(Boolean).map((item: string) => 
        `<li>${item.trim().replace(/\n/g, ' ')}</li>`
      ).join('');
      return `<ul>${items}</ul>`;
    })
    .replace(/\\textbf{([^}]*)}/g, '<strong>$1</strong>')
    .replace(/\\textit{([^}]*)}/g, '<em>$1</em>')
    .replace(/\\\\\\/g, '<br>')
    .replace(/\n\n/g, '</p><p>')
    .trim();
};

export function InstructionsDialog({ instructions, onInstructionsChange }: InstructionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localInstructions, setLocalInstructions] = useState(() => convertLatexToHtml(instructions));

  const handleSave = () => {
    onInstructionsChange(localInstructions);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalInstructions(convertLatexToHtml(instructions));
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Edit Instructions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Exam Instructions</DialogTitle>
          <DialogDescription>
            Edit the instructions that appear on each exam version. Use the toolbar to format text and create lists.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <RichTextEditor
            value={localInstructions}
            onChange={setLocalInstructions}
            placeholder="Enter exam instructions here..."
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Instructions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}