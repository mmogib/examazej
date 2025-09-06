import React, { useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onFileRemove?: () => void;
  className?: string;
  label?: string;
  description?: string;
}

export function FileUpload({
  accept = '.tex,.json',
  maxSize = 5,
  onFileSelect,
  selectedFile,
  onFileRemove,
  className,
  label = 'Upload File',
  description = 'Select a LaTeX template (.tex) or JSON file'
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }
    
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChange(file);
        }}
        className="hidden"
      />
      
      {selectedFile ? (
        <Card className="border-success bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {onFileRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFileRemove}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={cn(
            'border-2 border-dashed transition-smooth cursor-pointer hover:border-primary/50',
            dragOver && 'border-primary bg-primary/5'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">{label}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to browse • Max {maxSize}MB
                </p>
              </div>
              <Button variant="academic" size="sm">
                Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}