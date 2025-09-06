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
    .replace(/\\underline{\\bf ([^}]*)}/g, '<p><strong>$1</strong></p>')
    .replace(/\\begin{enumerate}\s*\\begin{normalsize}(.*?)\\end{normalsize}\s*\\end{enumerate}/gs, (match, content) => {
      const items = content.split(/\\item\s+/).filter(Boolean).map((item: string) => 
        `<li><p>${item.trim().replace(/\s+/g, ' ')}</p></li>`
      ).join('');
      return `<ol>${items}</ol>`;
    })
    .replace(/\\begin{itemize}\s*\\begin{normalsize}(.*?)\\end{normalsize}\s*\\end{itemize}/gs, (match, content) => {
      const items = content.split(/\\item\s+/).filter(Boolean).map((item: string) => 
        `<li><p>${item.trim().replace(/\s+/g, ' ')}</p></li>`
      ).join('');
      return `<ul>${items}</ul>`;
    })
    .replace(/\\begin{enumerate}(.*?)\\end{enumerate}/gs, (match, content) => {
      const items = content.split(/\\item\s+/).filter(Boolean).map((item: string) => 
        `<li><p>${item.trim().replace(/\s+/g, ' ')}</p></li>`
      ).join('');
      return `<ol>${items}</ol>`;
    })
    .replace(/\\begin{itemize}(.*?)\\end{itemize}/gs, (match, content) => {
      const items = content.split(/\\item\s+/).filter(Boolean).map((item: string) => 
        `<li><p>${item.trim().replace(/\s+/g, ' ')}</p></li>`
      ).join('');
      return `<ul>${items}</ul>`;
    })
    .replace(/\\textbf{([^}]*)}/g, '<strong>$1</strong>')
    .replace(/\\textit{([^}]*)}/g, '<em>$1</em>')
    .replace(/\\\\\\/g, '<br>')
    .replace(/\n\n/g, '</p><p>')
    .trim();
};

// Convert HTML back to LaTeX when saving
const convertHtmlToLatex = (html: string): string => {
  return html
    .replace(/<p><strong>(.*?)<\/strong><\/p>/g, '\\underline{\\bf $1}')
    .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
    .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
    .replace(/<u>(.*?)<\/u>/g, '\\underline{$1}')
    .replace(/<s>(.*?)<\/s>/g, '\\sout{$1}')
    .replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
      const items = content.replace(/<li><p>(.*?)<\/p><\/li>/g, '        \\item $1').replace(/<li>(.*?)<\/li>/g, '        \\item $1');
      return `\\begin{enumerate}\n    \\begin{normalsize}\n${items}\n    \\end{normalsize}\n\\end{enumerate}`;
    })
    .replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
      const items = content.replace(/<li><p>(.*?)<\/p><\/li>/g, '        \\item $1').replace(/<li>(.*?)<\/li>/g, '        \\item $1');
      return `\\begin{itemize}\n    \\begin{normalsize}\n${items}\n    \\end{normalsize}\n\\end{itemize}`;
    })
    .replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}')
    .replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}')
    .replace(/<h3>(.*?)<\/h3>/g, '\\subsubsection{$1}')
    .replace(/<p style="text-align: center">(.*?)<\/p>/g, '\\begin{center}$1\\end{center}')
    .replace(/<p style="text-align: right">(.*?)<\/p>/g, '\\begin{flushright}$1\\end{flushright}')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<br\s*\/?>/g, '\\\\\n')
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove any remaining HTML tags
    .trim();
};

export function InstructionsDialog({ instructions, onInstructionsChange }: InstructionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localInstructions, setLocalInstructions] = useState(() => convertLatexToHtml(instructions));

  const handleSave = () => {
    // Convert HTML back to LaTeX before saving
    const latexInstructions = convertHtmlToLatex(localInstructions);
    onInstructionsChange(latexInstructions);
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