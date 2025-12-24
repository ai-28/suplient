"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, CheckSquare, MessageSquare, Upload, AlertTriangle } from "lucide-react";
import { AddElementDialog } from "@/app/components/AddElementDialog";
import { EditElementDialog } from "@/app/components/EditElementDialog";
import { ProgramFlowChart } from "@/app/components/ProgramFlowChart";
import { useTranslation } from "@/app/context/LanguageContext";
import { toast } from "sonner";


export default function ProgramEditor() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslation();
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isProgram, setIsProgram] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 4, // weeks
  });

  const [elements, setElements] = useState([]);
  const [addElementDialog, setAddElementDialog] = useState({
    open: false,
    type: null,
    preselectedDay: null,
    preselectedWeek: null
  });
  const [editElementDialog, setEditElementDialog] = useState({
      open: false,
    element: null
  });
  const [highlightedElementId, setHighlightedElementId] = useState(null);

  // Fetch program data
  const fetchProgram = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch as program first, then fallback to template
      let response = await fetch(`/api/programs/${id}`);
      let isProgram = response.ok;
      
      if (!response.ok) {
        // Fallback to template if not found as program
        response = await fetch(`/api/temp_programs/${id}`);
        isProgram = false;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch program');
      }
      
      const data = await response.json();
      setProgram(data.program);
      setIsProgram(isProgram);
      
      setFormData({
        name: data.program.name || "",
        description: data.program.description || "",
        duration: data.program.duration || 4
      });
      
      // Transform elements to ProgramFlowChart expected format
      const transformedElements = (data.program.elements || []).map(element => {
        // Parse elementData if it's a string from database
        let elementData = element.elementData || element.data || {};
        
        // If elementData is a string, parse it
        if (typeof elementData === 'string') {
          try {
            elementData = JSON.parse(elementData);
          } catch (e) {
            console.error('Error parsing elementData for element:', element.id, e);
            elementData = {};
          }
        }
        
        // Ensure elementData is an object, not null or array
        if (!elementData || typeof elementData !== 'object' || Array.isArray(elementData)) {
          elementData = {};
        }
        
        return {
          ...element,
          // Calculate absolute day from week and day-of-week (day is 1-7, week is 1+)
          scheduledDay: element.week && element.day ? (element.week - 1) * 7 + element.day : (element.scheduledDay || 1),
          scheduledTime: element.scheduledTime || '09:00',
          type: element.type || 'content',
          // Map elementData from database to data for component (now properly parsed)
          data: elementData
        };
      });
      console.log("transformedElements", transformedElements);
      
      setElements(transformedElements);
    } catch (err) {
      console.error('Error fetching program:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) {
      fetchProgram();
    }
  }, [id]);

  if (loading) {
    return (
      <div className={`container mx-auto ${isMobile ? 'px-4 py-4' : 'py-8'}`}>
        <div className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-12'}`}>
          <div className="text-center">
            <div className={`animate-spin rounded-full ${isMobile ? 'h-6 w-6' : 'h-8 w-8'} border-b-2 border-primary mx-auto mb-4`}></div>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>{t('programs.loadingProgram', 'Loading program...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`container mx-auto ${isMobile ? 'px-4 py-4' : 'py-8'}`}>
        <div className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-12'}`}>
          <div className="text-center">
            <AlertTriangle className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-red-500 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>{t('programs.errorLoadingProgram', 'Error Loading Program')}</h3>
            <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>{error}</p>
            <Button onClick={fetchProgram} variant="outline" size={isMobile ? "sm" : "default"}>
              {t('common.buttons.tryAgain', 'Try Again')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className={`container mx-auto ${isMobile ? 'px-4 py-4' : 'py-8'}`}>
        <div className="text-center">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground mb-4`}>{t('programs.programNotFound', 'Program Not Found')}</h1>
          <Button onClick={() => router.push('/coach/programs')} size={isMobile ? "sm" : "default"}>
            {t('programs.backToPrograms', 'Back to Programs')}
          </Button>
        </div>
      </div>
    );
  }

  const handleAddElementToDay = (day, week, type) => {
    setAddElementDialog({ 
      open: true, 
      type, 
      preselectedDay: day, 
      preselectedWeek: week 
    });
  };

  const handleAddElement = (elementData) => {
    const newElement = {
      ...elementData,
      id: `element-${Date.now()}`
    };
    setElements(prev => [...prev, newElement]);
    
    // Highlight the newly added element
    setHighlightedElementId(newElement.id);
    setTimeout(() => setHighlightedElementId(null), 3000);
  };

  const handleEditElement = (element) => {
    setEditElementDialog({ open: true, element });
  };

  const handleUpdateElement = (updatedElement) => {
    setElements(prev => prev.map(el => el.id === updatedElement.id ? updatedElement : el));
    setEditElementDialog({ open: false, element: null });
  };

  const handleDeleteElement = (elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    setEditElementDialog({ open: false, element: null });
    toast.success('Element deleted. Click Save to apply changes.');
  };


  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(t('common.messages.fillRequiredFields', 'Please fill in the required fields'));
      return;
    }

    try {
      setSaving(true);
      
      // Use the correct API endpoint based on whether it's a program or template
      const apiEndpoint = isProgram ? `/api/programs/${id}` : `/api/temp_programs/${id}`;
      
      // Convert scheduledDay back to week and day for database storage
      const elementsForSave = elements.map(element => {
        // If element already has week and day, use them; otherwise calculate from scheduledDay
        const week = element.week || Math.ceil(element.scheduledDay / 7);
        const day = element.day || ((element.scheduledDay - 1) % 7) + 1;
        
        return {
          type: element.type,
          title: element.title,
          week: week,
          day: day,
          scheduledTime: element.scheduledTime || '09:00:00',
          data: element.data || {}
        };
      });

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          duration: formData.duration,
          elements: elementsForSave
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update program');
      }

      toast.success(isProgram ? 'Program updated successfully!' : 'Program template updated successfully!');
      router.push('/coach/programs');
    } catch (error) {
      console.error('Failed to update program:', error);
      toast.error(error.message || 'Failed to update program');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`container mx-auto ${isMobile ? 'px-4 py-4 pb-24' : 'py-8'} space-y-8 ${isMobile ? 'space-y-4' : ''}`}>
      {/* Header */}
      <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
        <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-4'}`}>
          <Button variant="ghost" size={isMobile ? "sm" : "sm"} onClick={() => router.push('/coach/programs')} className={isMobile ? 'text-xs px-2 h-8' : ''}>
            <ArrowLeft className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
            {!isMobile && t('common.buttons.back', 'Back')}
          </Button>
          <div className={isMobile ? 'flex-1 text-center' : ''}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-foreground`}>
              {isProgram ? t('programs.viewProgram', 'View Program') : t('programs.editProgramTemplate', 'Edit Program Template')}
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : ''}`}>{formData.name}</p>
            {isProgram && (
              <Badge variant="secondary" className={`mt-2 ${isMobile ? 'text-xs px-1.5 py-0' : ''}`}>
                {t('programs.activeProgramInstance', 'Active Program Instance')}
              </Badge>
            )}
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving} className={`flex items-center ${isMobile ? 'gap-1 w-full text-xs h-8' : 'gap-2'}`} size={isMobile ? "sm" : "default"}>
          {saving && (
            <div className={`animate-spin rounded-full ${isMobile ? 'h-3 w-3' : 'h-4 w-4'} border-b-2 border-white`}></div>
          )}
          {saving ? t('common.messages.loading') : (isProgram ? t('programs.updateProgram', 'Update Program') : t('programs.saveTemplate', 'Save Template'))}
        </Button>
      </div>

      {/* Program Setup - Horizontal Layout */}
      <Card className={`border-2 border-border/60 shadow-md bg-card/95 ${isMobile ? 'p-3' : ''}`}>
        <CardHeader className={isMobile ? 'pb-3 px-0' : ''}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>{t('programs.programSetup')}</CardTitle>
          <CardDescription className={isMobile ? 'text-xs' : ''}>{t('programs.basicInfo')}</CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? 'px-0' : ''}>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
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
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 300) {
                    setFormData(prev => ({ ...prev, description: value }));
                  }
                }}
                placeholder={t('programs.descriptionPlaceholder', 'What does this program help with?')}
                className="resize-none"
                rows={5}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/300 {t('common.labels.characters')}
              </div>
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

      {/* Program Flow Overview with Integrated Actions */}
      <div className="relative">
        <ProgramFlowChart 
          elements={elements} 
          duration={formData.duration}
          highlightedElementId={highlightedElementId}
          forceCloseDropdowns={addElementDialog.open}
          onElementClick={handleEditElement}
          onAddElementToDay={handleAddElementToDay}
        />
      </div>

      <AddElementDialog
        open={addElementDialog.open}
        onOpenChange={(open) => setAddElementDialog({ open, type: null })}
        elementType={addElementDialog.type}
        programDuration={formData.duration}
        preselectedDay={addElementDialog.preselectedDay}
        preselectedWeek={addElementDialog.preselectedWeek}
        onAddElement={handleAddElement}
      />

      <EditElementDialog
        element={editElementDialog.element}
        open={editElementDialog.open}
        onOpenChange={(open) => setEditElementDialog({ open, element: null })}
        onSave={handleUpdateElement}
        onDelete={handleDeleteElement}
      />
    </div>
  );
}