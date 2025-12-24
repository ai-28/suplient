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
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Generation step component
function ProgramGenerationStep({ questionnaireData, onComplete, onBack }) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("Analyzing your requirements...");

  useEffect(() => {
    generateProgram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateProgram = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      setProgress("Analyzing your requirements...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress("Generating program structure...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress("Creating messages...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress("Creating tasks...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress("Creating documents...");
      
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
      setProgress("Generation complete!");
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-lg font-medium">{progress}</p>
          <p className="text-sm text-muted-foreground">
            This may take 30-60 seconds...
          </p>
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

