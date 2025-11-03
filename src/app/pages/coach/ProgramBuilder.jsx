"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { AddElementDialog } from "@/app/components/AddElementDialog";
import { ProgramFlowChart } from "@/app/components/ProgramFlowChart";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "@/app/context/LanguageContext";
import { toast } from "sonner";

export default function ProgramBuilder() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 4 // weeks
  });

  const [elements, setElements] = useState([]);
  const [addElementDialog, setAddElementDialog] = useState({
    open: false,
    type: null,
    week: null,
    day: null
  });
  const [isSaving, setIsSaving] = useState(false);


  const openAddElementDialog = (type, week, day) => {
    setAddElementDialog({ open: true, type, week, day });
  };

  const handleAddElement = (elementData) => {
    const newElement = {
      ...elementData,
      id: `element-${Date.now()}`
    };
    setElements(prev => [...prev, newElement]);
  };


  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(t('programs.nameRequired', 'Program name is required'));
      return;
    }

    if (!user) {
      toast.error(t('common.messages.loginRequired', 'You must be logged in to create a program'));
      return;
    }

    setIsSaving(true);
    try {
      const programData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        elements: elements.map(element => {
          // Convert scheduledDay back to week and day
          const week = Math.ceil(element.scheduledDay / 7);
          const day = ((element.scheduledDay - 1) % 7) + 1;
          
          return {
            type: element.type,
            title: element.title,
            week: week,
            day: day,
            scheduledTime: element.scheduledTime || '09:00:00',
            data: element.data || {}
          };
        })
      };

      const response = await fetch('/api/temp_programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('programs.createFailed', 'Failed to create program'));
      }

      const result = await response.json();
      toast.success(t('programs.programCreated', 'Program created successfully!'));
      router.push('/coach/programs');

    } catch (error) {
      console.error('Failed to create program:', error);
      toast.error(error.message || 'Failed to create program');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/coach/programs')}>
            <ArrowLeft className="h-4 w-4" />
            {t('common.buttons.back', 'Back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('programs.createProgram')}</h1>
            <p className="text-muted-foreground">{t('programs.createNewProgram', 'Create a new program')}</p>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('common.messages.loading') : t('common.buttons.save')}
        </Button>
      </div>

      {/* Program Setup - Horizontal Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('programs.programSetup')}</CardTitle>
          <CardDescription>{t('programs.basicInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">{t('programs.programName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('programs.programNamePlaceholder', 'e.g. Anxiety Management Program')}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">{t('programs.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('programs.descriptionPlaceholder', 'What does this program help with?')}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">{t('programs.duration')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="52"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                  className="h-10 w-20"
                />
                <span className="text-sm text-muted-foreground">{t('programs.weeks')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Program Flow Overview */}
      <ProgramFlowChart 
        elements={elements} 
        duration={formData.duration}
        forceCloseDropdowns={addElementDialog.open}
        onElementClick={(element) => {
          // Optional: Handle element clicks if needed
        }}
        onAddElementToDay={(absoluteDay, week, type) => {
          // absoluteDay is already the absolute day number (1-28 for 4 weeks)
          // Calculate day of week from absolute day (1-7, where 1=Monday, 7=Sunday)
          const dayOfWeek = ((absoluteDay - 1) % 7) + 1;
          setAddElementDialog({ open: true, type, week, day: dayOfWeek });
        }}
      />

      <AddElementDialog
        open={addElementDialog.open}
        onOpenChange={(open) => setAddElementDialog({ open, type: null })}
        elementType={addElementDialog.type}
        programDuration={formData.duration}
        defaultWeek={addElementDialog.week || 1}
        preselectedDay={addElementDialog.day}
        preselectedWeek={addElementDialog.week}
        onAddElement={handleAddElement}
      />
      </div>
    );
  }