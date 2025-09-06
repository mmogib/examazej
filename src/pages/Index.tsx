import { useState } from 'react';
import { Header } from '@/components/layout/Header';
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

  console.log('Index rendering, currentStep:', currentStep);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Header />
      <main>
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
    </div>
  );
};

export default Index;
