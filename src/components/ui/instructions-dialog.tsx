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
  let html = latex;
  
  // First, handle the enumerate with normalsize structure
  const enumerateWithNormalsizeRegex = /\\begin{enumerate}[\s\S]*?\\begin{normalsize}([\s\S]*?)\\end{normalsize}[\s\S]*?\\end{enumerate}/g;
  html = html.replace(enumerateWithNormalsizeRegex, (match, content) => {
    // Handle case where items might be concatenated without proper spacing
    // Split by \item but be more careful about whitespace
    let processedContent = content;
    
    // If we don't have proper newlines, add them before \item
    processedContent = processedContent.replace(/(\s+)\\item/g, '\n\\item');
    
    // Now split by \item and filter out empty entries
    const items = processedContent.split(/\\item\s*/).filter(item => item.trim().length > 0);
    
    const listItems = items.map(item => {
      // Clean up excessive whitespace but preserve sentence structure
      const cleanItem = item.trim().replace(/\s+/g, ' ');
      return `<li><p>${cleanItem}</p></li>`;
    }).join('');
    
    return `<ol>${listItems}</ol>`;
  });
  
  // Handle simple enumerate (fallback)
  const simpleEnumerateRegex = /\\begin{enumerate}([\s\S]*?)\\end{enumerate}/g;
  html = html.replace(simpleEnumerateRegex, (match, content) => {
    let processedContent = content;
    
    // If we don't have proper newlines, add them before \item
    processedContent = processedContent.replace(/(\s+)\\item/g, '\n\\item');
    
    const items = processedContent.split(/\\item\s*/).filter(item => item.trim().length > 0);
    const listItems = items.map(item => {
      const cleanItem = item.trim().replace(/\s+/g, ' ');
      return `<li><p>${cleanItem}</p></li>`;
    }).join('');
    
    return `<ol>${listItems}</ol>`;
  });
  
  // Handle other LaTeX formatting
  html = html.replace(/\\textbf{([^}]*)}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit{([^}]*)}/g, '<em>$1</em>');
  html = html.replace(/\\underline{([^}]*)}/g, '<u>$1</u>');
  
  return html.trim();
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

  // Update local instructions when dialog opens or instructions prop changes
  const handleOpen = (open: boolean) => {
    if (open) {
      setLocalInstructions(convertLatexToHtml(instructions));
    }
    setIsOpen(open);
  };

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
    <Dialog open={isOpen} onOpenChange={handleOpen}>
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