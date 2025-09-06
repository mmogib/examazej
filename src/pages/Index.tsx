import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StartPage } from './Start';
import { DetailsPage } from './Details';
import { ResultsPage } from './Results';
import type { ExamJSON } from '@/lib/types';

const Index = () => {
  const [examData, setExamData] = useState<ExamJSON | null>(null);
  const [currentStep, setCurrentStep] = useState<'start' | 'details' | 'results'>('start');
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

  return (
    <div className="min-h-screen bg-gradient-academic flex flex-col">
      <Header 
        onStartOver={handleStartOver}
        showStartOver={currentStep !== 'start'}
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
