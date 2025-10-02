"use client"

import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Slider } from "@/app/components/ui/slider";
import { ArrowLeft, Save, Target, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Fixed goal fields from the image
const goalFields = [
  {
    id: "sleep_quality",
    name: "Sleep Quality",
    icon: "🌙",
    category: "Health"
  },
  {
    id: "nutrition",
    name: "Nutrition",
    icon: "🥗",
    category: "Health"
  },
  {
    id: "physical_activity",
    name: "Physical Activity",
    icon: "🏃‍♂️",
    category: "Fitness"
  },
  {
    id: "learning",
    name: "Learning",
    icon: "📚",
    category: "Education"
  },
  {
    id: "maintaining_relationships",
    name: "Maintaining Relationships",
    icon: "❤️",
    category: "Social"
  }
];

// Fixed bad habit fields from the image
const badHabitFields = [
  {
    id: "excessive_social_media",
    name: "Excessive Social Media",
    icon: "📱",
    category: "Digital"
  },
  {
    id: "procrastination",
    name: "Procrastination",
    icon: "⏰",
    category: "Productivity"
  },
  {
    id: "negative_thinking",
    name: "Negative Thinking",
    icon: "☁️",
    category: "Mental"
  }
];

// Mock functions to replace missing hooks
const getActiveGoals = () => goalFields;
const getActiveBadHabits = () => badHabitFields;

// Real useDailyTracking hook with API calls
const useDailyTracking = (goals, habits) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const saveDailyEntry = async (formData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save check-in');
      }

      const result = await response.json();
      console.log('Check-in saved:', result);
      return result;
    } catch (error) {
      console.error('Error saving check-in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const getTodayEntry = async (date) => {
    try {
      const response = await fetch(`/api/checkin?date=${date}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch check-in data');
      }

      const result = await response.json();
      return result.checkIn;
    } catch (error) {
      console.error('Error fetching check-in:', error);
      return null;
    }
  };
  
  return { saveDailyEntry, getTodayEntry, isLoading };
};

export default function ClientJournal() {
  const router = useRouter();
  const activeGoals = getActiveGoals();
  const activeBadHabits = getActiveBadHabits();
  const { saveDailyEntry, getTodayEntry, isLoading } = useDailyTracking(activeGoals, activeBadHabits);
  
  // Single form data object with all fields
  const [formData, setFormData] = useState({
    // Goal scores (default to 3 as shown in image)
    sleepQuality: 3,
    nutrition: 3,
    physicalActivity: 3,
    learning: 3,
    maintainingRelationships: 3,
    
    // Bad habit scores (default to 2 as shown in image)
    excessiveSocialMedia: 2,
    procrastination: 2,
    negativeThinking: 2,
    
    // Notes
    notes: "",
    
    // Metadata
    date: new Date().toISOString().split('T')[0],
  });

  const handleSave = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    try {
      const result = await saveDailyEntry(formData);
      
      // Show different messages based on whether it was inserted or updated
      if (result.isUpdate) {
        toast.success("Daily tracking updated successfully! +1 point for engagement");
      } else {
        toast.success("Daily tracking saved successfully! +1 point for engagement");
      }
      
      router.push('/client');
    } catch (error) {
      toast.error(error.message || "Failed to save daily tracking");
      console.error('Error saving daily entry:', error);
    }
  };

  // Helper function to update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getScoreEmoji = (score) => {
    const emojis = ['😔', '😐', '🙂', '😊', '😃', '🤩'];
    return emojis[score] || '🙂';
  };

  const getBadHabitEmoji = (score) => {
    const emojis = ['✅', '🟢', '🟡', '🟠', '🔴', '🚨'];
    return emojis[score] || '🟡';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => router.push('/client')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-3 text-lg font-semibold">Quick Daily Check-in</h1>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isLoading} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Goals */}
        {(
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Goals</h2>
            </div>
            
            <div className="space-y-4">
              {/* Sleep Quality */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌙</span>
                    <span className="font-medium">Sleep Quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getScoreEmoji(formData.sleepQuality)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.sleepQuality}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.sleepQuality]}
                    onValueChange={(value) => updateFormData('sleepQuality', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Poor</span>
                    <span>Amazing</span>
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🥗</span>
                    <span className="font-medium">Nutrition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getScoreEmoji(formData.nutrition)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.nutrition}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.nutrition]}
                    onValueChange={(value) => updateFormData('nutrition', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Poor</span>
                    <span>Amazing</span>
                  </div>
                </div>
              </div>

              {/* Physical Activity */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏃‍♂️</span>
                    <span className="font-medium">Physical Activity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getScoreEmoji(formData.physicalActivity)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.physicalActivity}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.physicalActivity]}
                    onValueChange={(value) => updateFormData('physicalActivity', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Poor</span>
                    <span>Amazing</span>
                  </div>
                </div>
              </div>

              {/* Learning */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📚</span>
                    <span className="font-medium">Learning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getScoreEmoji(formData.learning)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.learning}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.learning]}
                    onValueChange={(value) => updateFormData('learning', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Poor</span>
                    <span>Amazing</span>
                  </div>
                </div>
              </div>

              {/* Maintaining Relationships */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">❤️</span>
                    <span className="font-medium">Maintaining Relationships</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getScoreEmoji(formData.maintainingRelationships)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.maintainingRelationships}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.maintainingRelationships]}
                    onValueChange={(value) => updateFormData('maintainingRelationships', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Poor</span>
                    <span>Amazing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bad Habits */}
        {(
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold">Reduce These</h2>
            </div>
            
            <div className="space-y-4">
              {/* Excessive Social Media */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <span className="font-medium">Excessive Social Media</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getBadHabitEmoji(formData.excessiveSocialMedia)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.excessiveSocialMedia}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.excessiveSocialMedia]}
                    onValueChange={(value) => updateFormData('excessiveSocialMedia', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>None</span>
                    <span>Overdid it</span>
                  </div>
                </div>
              </div>

              {/* Procrastination */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⏰</span>
                    <span className="font-medium">Procrastination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getBadHabitEmoji(formData.procrastination)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.procrastination}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.procrastination]}
                    onValueChange={(value) => updateFormData('procrastination', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>None</span>
                    <span>Overdid it</span>
                  </div>
                </div>
              </div>

              {/* Negative Thinking */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">☁️</span>
                    <span className="font-medium">Negative Thinking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getBadHabitEmoji(formData.negativeThinking)}</span>
                    <span className="text-lg font-semibold min-w-[20px]">{formData.negativeThinking}</span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={[formData.negativeThinking]}
                    onValueChange={(value) => updateFormData('negativeThinking', Math.max(0, Math.min(5, value[0])))}
                    max={5}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>None</span>
                    <span>Overdid it</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Notes */}
        {(
          <div className="space-y-3">
            <h2 className="font-semibold">How was today?</h2>
            <Textarea
              placeholder="Optional quick note about your day..."
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              className="min-h-[80px] bg-card/50 border-none"
              rows={3}
            />
          </div>
        )}

        {/* Empty State - This section is now always hidden since we have fixed fields */}
        {false && (
          <div className="text-center py-8 space-y-4">
            <Target className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">No Active Goals</h3>
              <p className="text-muted-foreground text-sm">
                Set up your goals to start quick daily tracking.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/client/profile')}
              size="sm"
            >
              Set Up Goals
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}