import { Shield, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
export function Header() {
  return <header className="border-b bg-card shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-hero text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">MCQ Exam Generator</h1>
              <p className="text-sm text-muted-foreground">Professional MCQ Exam Creation Tool</p>
            </div>
          </div>
          
          <Card className="px-3 py-2 bg-accent/50 border-accent">
            <div className="flex items-center gap-2 text-accent-foreground">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium">
                100% Private & Local
              </span>
            </div>
          </Card>
        </div>
      </div>
    </header>;
}