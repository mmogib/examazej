import { Shield, FileText, Home, BookOpen, LogOut, User as UserIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { User } from '@/lib/auth';

interface HeaderProps {
  onStartOver?: () => void;
  onShowDocs?: () => void;
  showStartOver?: boolean;
  currentStep?: string;
  user?: User | null;
  onSignOut?: () => void;
}

export function Header({ onStartOver, onShowDocs, showStartOver = false, currentStep, user, onSignOut }: HeaderProps) {
  return (
    <header className="border-b bg-card shadow-card">
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
          
          <div className="flex items-center gap-3">
            <Button
              onClick={onShowDocs}
              variant={currentStep === 'docs' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Documentation
            </Button>
            
            {showStartOver && onStartOver && (
              <Button 
                onClick={onStartOver}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Start Over
              </Button>
            )}

            {user && (
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="px-3 py-2 bg-muted border-muted cursor-default">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserIcon className="h-4 w-4" />
                          <span className="text-xs font-medium truncate max-w-32">
                            {user.name || user.email}
                          </span>
                        </div>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.email}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button
                  onClick={onSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
            
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
      </div>
    </header>
  );
}
