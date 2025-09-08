import { Shield, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PrivacyNotice() {
  return (
    <Card className="border-accent bg-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-accent-foreground">
          <Shield className="h-5 w-5" />
          Privacy Guarantee
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Lock className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-accent-foreground">100% Local Processing</p>
            <p className="text-accent-foreground/80">
              All exam generation happens in your browser. No data is uploaded to servers.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Eye className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-accent-foreground">No Tracking</p>
            <p className="text-accent-foreground/80">
              No analytics, telemetry, or user behavior monitoring.
            </p>
          </div>
        </div>
        
        <div className="text-xs text-accent-foreground/70 pt-2 border-t border-accent/30">
          Your exam content remains private and secure on your device.
        </div>
      </CardContent>
    </Card>
  );
}