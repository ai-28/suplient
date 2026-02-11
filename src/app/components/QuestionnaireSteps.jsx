"use client"

import { useState } from "react";
import { useTranslation } from "@/app/context/LanguageContext";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function QuestionnaireSteps({ onComplete, onCancel }) {
  const t = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    programName: "",
    programDescription: "",
    duration: 4,
    targetAudience: "",
    
    // Step 2: Content Preferences
    tonePreference: "supportive",
    contentDepth: "moderate",
    language: "en",
    
    // Step 3: Structure Preferences
    messageFrequency: "every-2-3-days",
    taskTypes: [],
    documentStructure: "moderate",
    
    // Step 4: Customization
    specificTopics: "",
    specialInstructions: ""
  });

  const totalSteps = 4;

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTaskType = (type) => {
    setFormData(prev => ({
      ...prev,
      taskTypes: prev.taskTypes.includes(type)
        ? prev.taskTypes.filter(t => t !== type)
        : [...prev.taskTypes, type]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.programName.trim() && formData.duration > 0;
      case 2:
        return true; // All optional
      case 3:
        return true; // All optional
      case 4:
        return true; // All optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error(t('programs.fillRequiredFields', 'Please fill in all required fields'));
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (!validateStep(currentStep)) {
      toast.error(t('programs.fillRequiredFields', 'Please fill in all required fields'));
      return;
    }
    onComplete(formData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2ContentPreferences formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3StructurePreferences formData={formData} updateFormData={updateFormData} toggleTaskType={toggleTaskType} />;
      case 4:
        return <Step4Customization formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('programs.stepOf', 'Step {current} of {total}').replace('{current}', currentStep).replace('{total}', totalSteps)}</span>
          <span className="text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 pb-4 border-t">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? t('common.buttons.cancel', 'Cancel') : t('common.buttons.back', 'Back')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!validateStep(currentStep)}
          className="w-full sm:w-auto"
        >
          {currentStep === totalSteps ? (
            <>
              {t('programs.generateProgram', 'Generate Program')}
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              {t('common.buttons.next', 'Next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Step 1: Basic Information
function Step1BasicInfo({ formData, updateFormData }) {
  const t = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('programs.basicInformation', 'Basic Information')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('programs.tellUsAboutProgram', 'Tell us about your program')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="programName">{t('programs.programName', 'Program Name')} *</Label>
          <Input
            id="programName"
            value={formData.programName}
            onChange={(e) => updateFormData("programName", e.target.value)}
            placeholder={t('programs.programNamePlaceholder', 'e.g., Anxiety Management Program')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="programDescription">{t('programs.programDescription', 'Program Description')}</Label>
          <Textarea
            id="programDescription"
            value={formData.programDescription}
            onChange={(e) => updateFormData("programDescription", e.target.value)}
            placeholder={t('programs.programDescriptionPlaceholder', 'Describe what this program helps with, the goals, target audience...')}
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">{t('programs.durationWeeks', 'Duration (Weeks)')} *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="52"
              value={formData.duration}
              onChange={(e) => updateFormData("duration", parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">{t('programs.targetAudience', 'Target Audience')}</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => updateFormData("targetAudience", e.target.value)}
              placeholder={t('programs.targetAudiencePlaceholder', 'e.g., Individual clients, Groups')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Content Preferences
function Step2ContentPreferences({ formData, updateFormData }) {
  const t = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('programs.contentPreferences', 'Content Preferences')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('programs.howShouldContentBeWritten', 'How should the content be written?')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tonePreference">{t('programs.tonePreference', 'Tone Preference')}</Label>
          <Select
            value={formData.tonePreference}
            onValueChange={(value) => updateFormData("tonePreference", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supportive">{t('programs.toneSupportive', 'Supportive and Warm')}</SelectItem>
              <SelectItem value="professional">{t('programs.toneProfessional', 'Professional and Clinical')}</SelectItem>
              <SelectItem value="motivational">{t('programs.toneMotivational', 'Motivational and Energetic')}</SelectItem>
              <SelectItem value="educational">{t('programs.toneEducational', 'Educational and Informative')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contentDepth">{t('programs.contentDepth', 'Content Depth')}</Label>
          <Select
            value={formData.contentDepth}
            onValueChange={(value) => updateFormData("contentDepth", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brief">{t('programs.depthBrief', 'Brief Overviews')}</SelectItem>
              <SelectItem value="moderate">{t('programs.depthModerate', 'Moderate Detail')}</SelectItem>
              <SelectItem value="comprehensive">{t('programs.depthComprehensive', 'Comprehensive Guides')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">{t('programs.language', 'Language')}</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => updateFormData("language", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('programs.languageEnglish', 'English')}</SelectItem>
              <SelectItem value="da">{t('programs.languageDanish', 'Danish')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Step 3: Structure Preferences
function Step3StructurePreferences({ formData, updateFormData, toggleTaskType }) {
  const t = useTranslation();
  const taskTypeOptions = [
    { id: "reflection", label: t('programs.taskTypeReflection', 'Reflection Exercises') },
    { id: "action", label: t('programs.taskTypeAction', 'Action Items') },
    { id: "journaling", label: t('programs.taskTypeJournaling', 'Journaling Prompts') },
    { id: "assessment", label: t('programs.taskTypeAssessment', 'Assessment Questions') },
    { id: "homework", label: t('programs.taskTypeHomework', 'Homework Assignments') }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('programs.structurePreferences', 'Structure Preferences')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('programs.howShouldProgramBeStructured', 'How should the program be structured?')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="messageFrequency">{t('programs.messageFrequency', 'Message Frequency')}</Label>
          <Select
            value={formData.messageFrequency}
            onValueChange={(value) => updateFormData("messageFrequency", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('programs.frequencyDaily', 'Daily')}</SelectItem>
              <SelectItem value="every-2-3-days">{t('programs.frequencyEvery2To3Days', 'Every 2-3 Days')}</SelectItem>
              <SelectItem value="weekly">{t('programs.frequencyWeekly', 'Weekly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('programs.taskTypes', 'Task Types')}</Label>
          <div className="space-y-2 border rounded-md p-4">
            {taskTypeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={formData.taskTypes.includes(option.id)}
                  onCheckedChange={() => toggleTaskType(option.id)}
                />
                <Label
                  htmlFor={option.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentStructure">{t('programs.documentStructure', 'Document Structure')}</Label>
          <Select
            value={formData.documentStructure}
            onValueChange={(value) => updateFormData("documentStructure", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">{t('programs.structureSimple', 'Simple (Overview Only)')}</SelectItem>
              <SelectItem value="moderate">{t('programs.structureModerate', 'Moderate (Sections + Exercises)')}</SelectItem>
              <SelectItem value="comprehensive">{t('programs.structureComprehensive', 'Comprehensive (Detailed Guides)')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Step 4: Customization
function Step4Customization({ formData, updateFormData }) {
  const t = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('programs.additionalCustomization', 'Additional Customization')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('programs.addSpecificRequirementsOptional', 'Add any specific requirements (optional)')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="specificTopics">{t('programs.specificTopicsTechniques', 'Specific Topics/Techniques to Include')}</Label>
          <Textarea
            id="specificTopics"
            value={formData.specificTopics}
            onChange={(e) => updateFormData("specificTopics", e.target.value)}
            placeholder={t('programs.specificTopicsPlaceholder', 'e.g., Include mindfulness exercises, Use CBT framework, Focus on breathing techniques')}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialInstructions">{t('programs.specialInstructions', 'Special Instructions')}</Label>
          <Textarea
            id="specialInstructions"
            value={formData.specialInstructions}
            onChange={(e) => updateFormData("specialInstructions", e.target.value)}
            placeholder={t('programs.specialInstructionsPlaceholder', 'e.g., Keep language simple, Include video references, Add progress tracking')}
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

