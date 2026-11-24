import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StartPage } from './Start';
import { DetailsPage } from './Details';
import { QuestionsPage } from './Questions';
import { ResultsPage } from './Results';
import { DocumentationPage } from './Documentation';
import { answerChangesKey, copyQuestions, findChangedAnswers, type AnswerChange } from '@/lib/core/question-edits';
import { isOlderFile } from '@/lib/core/import-notes';
import type { ExamJSON, ImportInfo, Question } from '@/lib/types';

type Step = 'start' | 'details' | 'questions' | 'results';

const Index = () => {
  const [examData, setExamData] = useState<ExamJSON | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('start');
  const [generationSeed, setGenerationSeed] = useState<string>('');
  const [importInfo, setImportInfo] = useState<ImportInfo>({ warnings: [] });
  // The questions as uploaded: "Changed", Reset and the changed-answers check compare with them.
  const [baseline, setBaseline] = useState<Question[]>([]);
  // The list of changed answers last confirmed; asked again only when the list differs (D11).
  const [confirmedAnswers, setConfirmedAnswers] = useState('');
  // The step Results was opened from, where its Back button returns.
  const [resultsFrom, setResultsFrom] = useState<'details' | 'questions'>('details');
  const [pendingResults, setPendingResults] = useState<{
    from: 'details' | 'questions';
    changes: AnswerChange[];
  } | null>(null);
  // Documentation is shown over the current step, which stays mounted (hidden) so that its
  // drafts (Details' settings, an automatic seed, the question shown) survive the visit.
  const [docsOpen, setDocsOpen] = useState(false);

  const handleDataLoaded = (data: ExamJSON, info: ImportInfo = { warnings: [] }) => {
    setExamData(data);
    setImportInfo(info);
    setBaseline(copyQuestions(data.exam.questions));
    setConfirmedAnswers('');
    setCurrentStep('details');
  };

  const handleDataUpdated = (data: ExamJSON) => {
    setExamData(data);
  };

  /** The one way into Results: changed answers are confirmed first. */
  const requestResults = (from: 'details' | 'questions', data: ExamJSON | null = examData) => {
    if (!data) return;
    const changes = findChangedAnswers(data.exam.questions, baseline);
    if (changes.length > 0 && answerChangesKey(changes) !== confirmedAnswers) {
      setPendingResults({ from, changes });
      return;
    }
    setResultsFrom(from);
    setCurrentStep('results');
  };

  const confirmResults = () => {
    if (!pendingResults) return;
    setConfirmedAnswers(answerChangesKey(pendingResults.changes));
    setResultsFrom(pendingResults.from);
    setPendingResults(null);
    setCurrentStep('results');
  };

  const handleDetailsContinue = (seed: string, target: 'questions' | 'results', data: ExamJSON) => {
    setGenerationSeed(seed);
    if (target === 'questions') setCurrentStep('questions');
    else requestResults('details', data);
  };

  const handleStartOver = () => {
    setCurrentStep('start');
    setExamData(null);
    setGenerationSeed('');
    setImportInfo({ warnings: [] });
    setBaseline([]);
    setConfirmedAnswers('');
    setPendingResults(null);
    setDocsOpen(false);
  };

  // The header's Documentation button and the desktop Help menu both open the docs this way.
  const openDocs = useCallback(() => {
    setPendingResults(null);
    setDocsOpen(true);
    window.scrollTo?.(0, 0);
  }, []);

  // Desktop native menu "Help → Documentation" opens the same docs view (T8/D13).
  useEffect(() => {
    if (!__DESKTOP__) return;
    return window.examazej?.onShowDocs(openDocs);
  }, [openDocs]);

  return (
    <div className="min-h-screen bg-gradient-academic flex flex-col">
      <Header
        onStartOver={handleStartOver}
        onShowDocs={openDocs}
        showStartOver={currentStep !== 'start'}
        currentStep={docsOpen ? 'docs' : currentStep}
      />
      <main className="flex-1">
        <div hidden={docsOpen} data-testid="step">
          {currentStep === 'start' && (
            <StartPage onDataLoaded={handleDataLoaded} />
          )}
          {currentStep === 'details' && examData && (
            <DetailsPage
              examData={examData}
              onDataUpdated={handleDataUpdated}
              onBack={() => setCurrentStep('start')}
              onContinue={handleDetailsContinue}
              importWarnings={importInfo.warnings}
              importSource={importInfo.source}
              madeWith={importInfo.madeWith}
            />
          )}
          {currentStep === 'questions' && examData && (
            <QuestionsPage
              examData={examData}
              baseline={baseline}
              onDataUpdated={handleDataUpdated}
              onBack={() => setCurrentStep('details')}
              onGenerate={() => requestResults('questions')}
              active={!docsOpen}
            />
          )}
          {currentStep === 'results' && examData && generationSeed && (
            <ResultsPage
              examData={examData}
              seed={generationSeed}
              onBack={() => setCurrentStep(resultsFrom)}
              olderFile={isOlderFile(importInfo.source)}
            />
          )}
        </div>
        {docsOpen && (
          <DocumentationPage onBack={() => setDocsOpen(false)} />
        )}
      </main>
      <Footer />

      <AlertDialog open={pendingResults !== null} onOpenChange={(open) => !open && setPendingResults(null)}>
        <AlertDialogContent data-testid="confirm-answers">
          <AlertDialogHeader>
            <AlertDialogTitle>Check the changed answers</AlertDialogTitle>
            <AlertDialogDescription>
              These answers differ from the uploaded file. The answer keys will use the new ones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {pendingResults?.changes.map((c) => (
              <li key={c.number}>
                Q{c.number}: {c.from} → {c.to}
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResults}>Generate with these answers</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
