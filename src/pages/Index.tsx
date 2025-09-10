import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StartPage } from './Start';
import { DetailsPage } from './Details';
import { ResultsPage } from './Results';
import { DocumentationPage } from './Documentation';
import { supabase } from '@/integrations/supabase/client';
import type { ExamJSON } from '@/lib/types';
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [examData, setExamData] = useState<ExamJSON | null>(null);
  const [currentStep, setCurrentStep] = useState<'start' | 'details' | 'results' | 'docs'>('start');
  const [generationSeed, setGenerationSeed] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-academic flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-academic flex flex-col">
      <Header 
        onStartOver={handleStartOver}
        onShowDocs={handleShowDocs}
        showStartOver={currentStep !== 'start'}
        currentStep={currentStep}
        user={user}
        onSignOut={handleSignOut}
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
