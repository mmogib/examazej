import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StartPage } from './Start';
import { DetailsPage } from './Details';
import { ResultsPage } from './Results';
import { DocumentationPage } from './Documentation';
import type { ExamJSON } from '@/lib/types';

const Index = () => {
  const [examData, setExamData] = useState<ExamJSON | null>(null);
  const [currentStep, setCurrentStep] = useState<'start' | 'details' | 'results' | 'docs'>('start');
  const [generationSeed, setGenerationSeed] = useState<string>('');

  const handleDataLoaded = (data: ExamJSON) => {
    setExamData(data);
    setCurrentStep('details');
  };

  const handleDataUpdated = (data: ExamJSON) => {
    setExamData(data);
  };

  const handleBackToStart = () => {
    setCurrentStep('start');
  };

  const handleBackToDetails = () => {
    setCurrentStep('details');
  };

  const handleContinueToResults = (seed: string) => {
    setGenerationSeed(seed);
    setCurrentStep('results');
  };

  const handleStartOver = () => {
    setCurrentStep('start');
    setExamData(null);
    setGenerationSeed('');
  };

  const handleShowDocs = () => {
    setCurrentStep('docs');
  };

  const handleBackFromDocs = () => {
    setCurrentStep('start');
  };

  return (
    <div className="min-h-screen bg-gradient-academic flex flex-col">
      <Header
        onStartOver={handleStartOver}
        onShowDocs={handleShowDocs}
        showStartOver={currentStep !== 'start'}
        currentStep={currentStep}
      />
      <main className="flex-1">
        {currentStep === 'start' && (
          <StartPage onDataLoaded={handleDataLoaded} />
        )}
        {currentStep === 'details' && examData && (
          <DetailsPage 
            examData={examData}
            onDataUpdated={handleDataUpdated}
            onBack={handleBackToStart}
            onContinue={handleContinueToResults}
          />
        )}
        {currentStep === 'results' && examData && generationSeed && (
          <ResultsPage 
            examData={examData}
            seed={generationSeed}
            onBack={handleBackToDetails}
          />
        )}
        {currentStep === 'docs' && (
          <DocumentationPage onBack={handleBackFromDocs} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
