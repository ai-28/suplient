"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, CheckSquare, MessageSquare, Upload } from "lucide-react";
import { AddElementDialog } from "@/app/components/AddElementDialog";
import { EditElementDialog } from "@/app/components/EditElementDialog";
import { ProgramFlowChart } from "@/app/components/ProgramFlowChart";

export default function ProgramEditor() {
  const { id } = useParams();
  const router = useRouter();
  console.log("id", id);
  const programs = [
    {
      id: "1",
      name: "Anxiety Management Program",
      description: "A comprehensive 8-week program designed to help clients manage anxiety through cognitive behavioral therapy techniques, mindfulness practices, and gradual exposure therapy.",
      duration: 8,
      category: "anxiety",
      isTemplate: true,
      targetConditions: ["Generalized Anxiety Disorder", "Social Anxiety", "Panic Disorder"],
      elements: [
        {
          id: "element-1",
          type: "session",
          title: "Introduction to Anxiety",
          description: "Understanding what anxiety is and how it affects the body and mind",
          week: 1,
          day: 1,
          duration: 60,
          content: "This session introduces the concept of anxiety, its physiological responses, and the fight-or-flight mechanism."
        },
        {
          id: "element-2",
          type: "exercise",
          title: "Deep Breathing Exercise",
          description: "Learn the 4-7-8 breathing technique for immediate anxiety relief",
          week: 1,
          day: 2,
          duration: 15,
          content: "Practice the 4-7-8 breathing technique: inhale for 4 counts, hold for 7, exhale for 8."
        },
        {
          id: "element-3",
          type: "assessment",
          title: "Anxiety Assessment",
          description: "Complete the GAD-7 questionnaire to track anxiety levels",
          week: 1,
          day: 3,
          duration: 20,
          content: "Fill out the Generalized Anxiety Disorder Assessment (GAD-7) to establish baseline anxiety levels."
        },
        {
          id: "element-4",
          type: "session",
          title: "Cognitive Restructuring",
          description: "Identify and challenge negative thought patterns",
          week: 2,
          day: 1,
          duration: 60,
          content: "Learn to identify cognitive distortions and replace them with more balanced thoughts."
        },
        {
          id: "element-5",
          type: "homework",
          title: "Thought Record Journal",
          description: "Daily practice of recording and challenging anxious thoughts",
          week: 2,
          day: 2,
          duration: 30,
          content: "Keep a daily thought record, noting situations, automatic thoughts, and alternative perspectives."
        }
      ]
    },
    {
      id: "2",
      name: "Depression Recovery Program",
      description: "A structured 12-week program focusing on behavioral activation, cognitive therapy, and building healthy routines to combat depression.",
      duration: 12,
      category: "depression",
      isTemplate: true,
      targetConditions: ["Major Depressive Disorder", "Persistent Depressive Disorder"],
      elements: [
        {
          id: "element-6",
          type: "session",
          title: "Understanding Depression",
          description: "Learn about the symptoms and causes of depression",
          week: 1,
          day: 1,
          duration: 60,
          content: "Overview of depression symptoms, causes, and the biopsychosocial model of depression."
        },
        {
          id: "element-7",
          type: "exercise",
          title: "Behavioral Activation",
          description: "Start with small, achievable activities to increase positive experiences",
          week: 1,
          day: 2,
          duration: 45,
          content: "Create a list of pleasurable activities and schedule at least one per day."
        },
        {
          id: "element-8",
          type: "assessment",
          title: "PHQ-9 Assessment",
          description: "Complete the Patient Health Questionnaire to assess depression severity",
          week: 1,
          day: 3,
          duration: 15,
          content: "Fill out the PHQ-9 questionnaire to establish baseline depression levels."
        },
        {
          id: "element-9",
          type: "session",
          title: "Building Healthy Routines",
          description: "Establish consistent sleep, exercise, and eating patterns",
          week: 2,
          day: 1,
          duration: 60,
          content: "Develop a structured daily routine including sleep hygiene, exercise, and meal planning."
        },
        {
          id: "element-10",
          type: "homework",
          title: "Activity Scheduling",
          description: "Plan and execute daily activities to improve mood",
          week: 2,
          day: 2,
          duration: 30,
          content: "Schedule specific activities for each day of the week, including both necessary and pleasurable tasks."
        }
      ]
    },
    {
      id: "3",
      name: "Stress Management Program",
      description: "A 6-week program teaching stress reduction techniques, time management, and relaxation strategies for better work-life balance.",
      duration: 6,
      category: "stress",
      isTemplate: true,
      targetConditions: ["Work Stress", "Chronic Stress", "Burnout"],
      elements: [
        {
          id: "element-11",
          type: "session",
          title: "Stress Awareness",
          description: "Understanding stress triggers and physical responses",
          week: 1,
          day: 1,
          duration: 60,
          content: "Identify personal stress triggers and learn about the body's stress response system."
        },
        {
          id: "element-12",
          type: "exercise",
          title: "Progressive Muscle Relaxation",
          description: "Learn to relax muscle groups systematically",
          week: 1,
          day: 2,
          duration: 20,
          content: "Practice progressive muscle relaxation by tensing and releasing muscle groups from head to toe."
        },
        {
          id: "element-13",
          type: "assessment",
          title: "Stress Assessment",
          description: "Complete the Perceived Stress Scale to measure stress levels",
          week: 1,
          day: 3,
          duration: 10,
          content: "Fill out the Perceived Stress Scale (PSS) to establish baseline stress levels."
        },
        {
          id: "element-14",
          type: "session",
          title: "Time Management Skills",
          description: "Learn prioritization and scheduling techniques",
          week: 2,
          day: 1,
          duration: 60,
          content: "Master time management techniques including the Eisenhower Matrix and time blocking."
        },
        {
          id: "element-15",
          type: "homework",
          title: "Daily Stress Log",
          description: "Track stress levels and coping strategies used",
          week: 2,
          day: 2,
          duration: 15,
          content: "Keep a daily log of stress levels, triggers, and effectiveness of coping strategies."
        }
      ]
    },
    {
      id: "4",
      name: "Self-Esteem Building Program",
      description: "An 8-week program focused on building self-confidence, challenging negative self-talk, and developing a positive self-image.",
      duration: 8,
      category: "self-esteem",
      isTemplate: true,
      targetConditions: ["Low Self-Esteem", "Negative Self-Image", "Self-Doubt"],
      elements: [
        {
          id: "element-16",
          type: "session",
          title: "Understanding Self-Esteem",
          description: "Learn about the components of healthy self-esteem",
          week: 1,
          day: 1,
          duration: 60,
          content: "Explore the difference between self-esteem and self-confidence, and identify areas for growth."
        },
        {
          id: "element-17",
          type: "exercise",
          title: "Strengths Inventory",
          description: "Identify and celebrate personal strengths and achievements",
          week: 1,
          day: 2,
          duration: 45,
          content: "Create a comprehensive list of personal strengths, skills, and past achievements."
        },
        {
          id: "element-18",
          type: "assessment",
          title: "Self-Esteem Assessment",
          description: "Complete the Rosenberg Self-Esteem Scale",
          week: 1,
          day: 3,
          duration: 15,
          content: "Fill out the Rosenberg Self-Esteem Scale to establish baseline self-esteem levels."
        },
        {
          id: "element-19",
          type: "session",
          title: "Challenging Negative Self-Talk",
          description: "Learn to identify and replace negative internal dialogue",
          week: 2,
          day: 1,
          duration: 60,
          content: "Practice identifying negative self-talk patterns and replacing them with positive affirmations."
        },
        {
          id: "element-20",
          type: "homework",
          title: "Daily Affirmations",
          description: "Practice positive self-talk and affirmations daily",
          week: 2,
          day: 2,
          duration: 10,
          content: "Create and practice daily positive affirmations that resonate with personal values and goals."
        }
      ]
    }
  ]
  const program = programs.find(p => p.id === id);

  // Function to update program (demo version)
  const updateProgram = (id, updatedData) => {
    const index = programs.findIndex(p => p.id === id);
    if (index !== -1) {
      programs[index] = { ...programs[index], ...updatedData };
      return programs[index];
    }
    return null;
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 4, // weeks
    isTemplate: false
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


  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        description: program.description,
        duration: program.duration,
        isTemplate: program.isTemplate
      });
      setElements([...program.elements]);
    }
  }, [program]);

  if (!program) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Program Not Found</h1>
          <Button onClick={() => router.push('/coach/programs')}>
            Back to Programs
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


  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please fill in the required fields');
      return;
    }

    try {
      updateProgram(program.id, {
        ...formData,
        category: program.category || 'general',
        targetConditions: program.targetConditions || [],
        elements
      });
      router.push('/coach/programs');
    } catch (error) {
      console.error('Failed to update program:', error);
      alert('Failed to update program');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/coach/programs')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Program</h1>
            <p className="text-muted-foreground">{formData.name}</p>
          </div>
        </div>
        
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {/* Program Setup - Horizontal Layout */}
      <Card className="border-2 border-border/60 shadow-md bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">Program Setup</CardTitle>
          <CardDescription>Basic information about your program</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Program Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Anxiety Management Program"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 300) {
                    setFormData(prev => ({ ...prev, description: value }));
                  }
                }}
                placeholder="What does this program help with?"
                className="resize-none"
                rows={5}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/300 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">Duration</Label>
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
                <span className="text-sm text-muted-foreground">weeks</span>
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
      />
    </div>
  );
}