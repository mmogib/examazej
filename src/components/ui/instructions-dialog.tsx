import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface InstructionsDialogProps {
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
}

export function InstructionsDialog({ instructions, onInstructionsChange }: InstructionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localInstructions, setLocalInstructions] = useState(instructions);

  // Update local instructions when dialog opens
  const handleOpen = (open: boolean) => {
    if (open) {
      setLocalInstructions(instructions);
    }
    setIsOpen(open);
  };

  const handleSave = () => {
    onInstructionsChange(localInstructions);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalInstructions(instructions);
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
            Edit the LaTeX instructions that appear on each exam version.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Textarea
            value={localInstructions}
            onChange={(e) => setLocalInstructions(e.target.value)}
            placeholder="Enter exam instructions here..."
            className="w-full h-96 resize-none font-mono text-sm"
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