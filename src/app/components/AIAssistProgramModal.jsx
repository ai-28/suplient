"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { QuestionnaireSteps } from "./QuestionnaireSteps";
import { ProgramReviewScreen } from "./ProgramReviewScreen";
import { Sparkles } from "lucide-react";

export function AIAssistProgramModal({ open, onOpenChange }) {
  const [step, setStep] = useState(1); // 1: Questionnaire, 2: Review
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [generatedProgram, setGeneratedProgram] = useState(null);

  const handleQuestionnaireComplete = (data) => {
    setQuestionnaireData(data);
    setStep(2); // Move to generation
  };

  const handleGenerationComplete = (program) => {
    setGeneratedProgram(program);
    setStep(3); // Move to review
  };

  const handleClose = () => {
    // Reset state when closing
    setStep(1);
    setQuestionnaireData(null);
    setGeneratedProgram(null);
    onOpenChange(false);
  };

  const handleImportComplete = () => {
    // Reset and close
    handleClose();
    // Optionally redirect to programs page
    if (typeof window !== 'undefined') {
      window.location.href = '/coach/programs';
    }
  };

  const handleBackToQuestionnaire = () => {
    // Clear generated program when going back to edit prompts
    setGeneratedProgram(null);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assist Program Builder
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Answer a few questions to generate your program"}
            {step === 2 && "Generating your program with AI..."}
            {step === 3 && "Review and edit your generated program"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {step === 1 && (
            <QuestionnaireSteps
              onComplete={handleQuestionnaireComplete}
              onCancel={handleClose}
            />
          )}

          {step === 2 && questionnaireData && (
            <ProgramGenerationStep
              questionnaireData={questionnaireData}
              onComplete={handleGenerationComplete}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && generatedProgram && questionnaireData && (
            <ProgramReviewScreen
              generatedProgram={generatedProgram}
              questionnaireData={questionnaireData}
              onImportComplete={handleImportComplete}
              onBack={handleBackToQuestionnaire}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Premium loading messages that show active, meaningful work
const loadingMessages = [
  { text: "Reviewing your insights...", duration: 2000 },
  { text: "Organizing your data...", duration: 2500 },
  { text: "Researching best practices...", duration: 3000 },
  { text: "Crafting a personalized plan...", duration: 3500 },
  { text: "Adding extra value...", duration: 4000 },
  { text: "Preparing your program...", duration: 4500 }
];

// Generation step component
function ProgramGenerationStep({ questionnaireData, onComplete, onBack }) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(loadingMessages[0].text);
  const [progressIndex, setProgressIndex] = useState(0);

  useEffect(() => {
    generateProgram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotate through premium loading messages
  useEffect(() => {
    if (!isGenerating) return;

    const currentMessage = loadingMessages[progressIndex];
    if (!currentMessage) return;

    const timer = setTimeout(() => {
      setProgress(currentMessage.text);
      setProgressIndex((prev) => {
        const nextIndex = prev + 1;
        // Loop back to start if we've gone through all messages
        return nextIndex >= loadingMessages.length ? 0 : nextIndex;
      });
    }, currentMessage.duration);

    return () => clearTimeout(timer);
  }, [progressIndex, isGenerating, loadingMessages]);

  const generateProgram = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgressIndex(0);
      setProgress(loadingMessages[0].text);
      
      // Let the messages rotate for a bit before starting the actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch('/api/ai/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionnaireData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate program');
      }

      const data = await response.json();
      
      // Final premium message before completion
      setProgress("Finalizing your personalized program...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onComplete(data);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate program');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 py-8">
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center space-y-6 py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-foreground transition-all duration-500">
              {progress}
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              We're carefully crafting a program tailored specifically for your needs. This thoughtful process ensures the highest quality experience.
            </p>
          </div>
          <div className="w-full max-w-md">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(90, 20 + (progressIndex * 12))}%` 
                }}
              />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="text-destructive text-lg font-medium">Error</div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Back
            </button>
            <button
              onClick={generateProgram}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

