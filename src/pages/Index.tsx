import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { StartPage } from './Start';
import type { ExamJSON } from '@/lib/types';

const Index = () => {
  const [examData, setExamData] = useState<ExamJSON | null>(null);
  const [currentStep, setCurrentStep] = useState<'start' | 'details' | 'results'>('start');

  const handleDataLoaded = (data: ExamJSON) => {
    setExamData(data);
    setCurrentStep('details');
  };

  return (
    <div className="min-h-screen bg-gradient-academic">
      <Header />
      <main>
        {currentStep === 'start' && (
          <StartPage onDataLoaded={handleDataLoaded} />
        )}
        {currentStep === 'details' && examData && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-4">Exam Details</h2>
            <p className="text-muted-foreground">Details page coming soon...</p>
          </div>
        )}
        {currentStep === 'results' && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-4">Generated Results</h2>
            <p className="text-muted-foreground">Results page coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
