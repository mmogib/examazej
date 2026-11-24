import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const amber =
  "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400";

/**
 * Details page, for a file without `app_version`: exams made from it now may not be the ones
 * an older Examazej printed, even with the same seed, so those are graded with their own key.
 */
export function OlderFileWarning() {
  return (
    <Alert className={`mb-6 ${amber}`} data-testid="older-file-warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Made with an older Examazej</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          If you are making new exams, ignore this. If you want the exams you printed back then, these may not be
          the same, even with the same seed: the way exams are shuffled and tags are read has changed since. To
          grade the exams printed then, use the answer key printed with them: the answer key page of the old exam
          document or PDF lists each version&apos;s answers, with the master question number in small print.
        </p>
        <p className="text-xs">
          If you only have the PDF, an AI assistant can turn that answer key into a mapping file for the Regrade
          Tool: Documentation, &quot;Grading exams made with an older Examazej&quot;, has a ready prompt. Use an AI
          tool your university allows, only for exams already given, and check its result against the PDF.
        </p>
      </AlertDescription>
    </Alert>
  );
}

/** Results page: the same warning in one line. */
export function OlderFileReminder() {
  return (
    <Alert className={`mb-6 ${amber}`} data-testid="older-file-reminder">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        Made from a file of an older Examazej: if you meant to make the exams printed back then again, these may
        differ, even with the same seed. Grade those with the answer key printed with them.
      </AlertDescription>
    </Alert>
  );
}
