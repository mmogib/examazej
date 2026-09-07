import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_ACADEMIC_INTEGRITY_PLEDGE,
  normalizeAcademicIntegrityPledgeText,
} from "@/lib/core/academic-integrity-pledge";

interface AcademicIntegrityPledgeControlProps {
  coverPageEnabled: boolean;
  included: boolean;
  text: string;
  onIncludedChange: (included: boolean) => void;
  onTextChange: (text: string) => void;
}

export function AcademicIntegrityPledgeControl({
  coverPageEnabled,
  included,
  text,
  onIncludedChange,
  onTextChange,
}: AcademicIntegrityPledgeControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(text);
  const normalizedDraft = normalizeAcademicIntegrityPledgeText(draft);
  const draftIsEmpty = normalizedDraft.length === 0;

  const handleOpenChange = (open: boolean) => {
    setDraft(text);
    setIsOpen(open);
  };

  const handleSave = () => {
    if (draftIsEmpty) return;

    onTextChange(normalizedDraft);
    handleOpenChange(false);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor="include-academic-integrity-pledge">
          Include Academic Integrity Pledge
        </Label>
        <p className="text-sm text-muted-foreground">
          Add the pledge and signature line to student cover pages
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {coverPageEnabled && included && (
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil aria-hidden="true" />
                Edit pledge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Academic Integrity Pledge</DialogTitle>
                <DialogDescription>
                  The heading and signature line are fixed. Edit only the pledge paragraph.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="academic-integrity-pledge-text">Pledge text</Label>
                <Textarea
                  id="academic-integrity-pledge-text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-40"
                />
                {draftIsEmpty && (
                  <p role="alert" className="text-sm text-destructive">
                    Enter pledge text or disable the pledge.
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE)}
                >
                  Reset to default
                </Button>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={draftIsEmpty} onClick={handleSave}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Switch
          id="include-academic-integrity-pledge"
          aria-label="Include Academic Integrity Pledge"
          checked={included}
          disabled={!coverPageEnabled}
          onCheckedChange={onIncludedChange}
        />
      </div>
    </div>
  );
}
