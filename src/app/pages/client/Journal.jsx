"use client"

import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Slider } from "@/app/components/ui/slider";
import { ArrowLeft, Save, Target, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/app/context/LanguageContext";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";

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
  const t = useTranslation();
  const activeGoals = getActiveGoals();
  const activeBadHabits = getActiveBadHabits();
  const { saveDailyEntry, getTodayEntry, isLoading } = useDailyTracking(activeGoals, activeBadHabits);
  
  // Selected date for check-in (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  
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

  // Load existing check-in data when date changes
  useEffect(() => {
    const loadEntryForDate = async () => {
      if (!selectedDate) return;
      
      const dateString = selectedDate.toISOString().split('T')[0];
      setIsLoadingEntry(true);
      
      try {
        const existingEntry = await getTodayEntry(dateString);
        
        if (existingEntry) {
          // Load existing data - API returns fields directly, not nested in responses
          setFormData(prev => ({
            ...prev,
            date: dateString,
            sleepQuality: existingEntry.sleepQuality ?? 3,
            nutrition: existingEntry.nutrition ?? 3,
            physicalActivity: existingEntry.physicalActivity ?? 3,
            learning: existingEntry.learning ?? 3,
            maintainingRelationships: existingEntry.maintainingRelationships ?? 3,
            excessiveSocialMedia: existingEntry.excessiveSocialMedia ?? 2,
            procrastination: existingEntry.procrastination ?? 2,
            negativeThinking: existingEntry.negativeThinking ?? 2,
            notes: existingEntry.notes ?? "",
          }));
        } else {
          // Reset to defaults for new date
          setFormData(prev => ({
            ...prev,
            date: dateString,
            sleepQuality: 3,
            nutrition: 3,
            physicalActivity: 3,
            learning: 3,
            maintainingRelationships: 3,
            excessiveSocialMedia: 2,
            procrastination: 2,
            negativeThinking: 2,
            notes: "",
          }));
        }
      } catch (error) {
        console.error('Error loading entry:', error);
        // Reset to defaults on error
        setFormData(prev => ({
          ...prev,
          date: dateString,
        }));
      } finally {
        setIsLoadingEntry(false);
      }
    };

    loadEntryForDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleSave = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    try {
      const result = await saveDailyEntry(formData);
      
      // Create activity for daily check-in
      try {
        const activityResponse = await fetch('/api/activities/daily-checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkinData: {
              id: result.checkIn?.id || `checkin-${Date.now()}`,
              responses: formData,
              mood: formData.notes || 'Daily check-in completed'
            }
          }),
        });
        
        if (activityResponse.ok) {
          console.log('✅ Daily check-in activity created');
        } else {
          console.error('❌ Failed to create daily check-in activity');
        }
      } catch (activityError) {
        console.error('❌ Error creating daily check-in activity:', activityError);
      }
      
      // Show different messages based on whether it was inserted or updated
      if (result.isUpdate) {
        toast.success(t('journal.updatedSuccess', "Daily tracking updated successfully! +1 point for engagement"));
      } else {
        toast.success(t('journal.savedSuccess', "Daily tracking saved successfully! +1 point for engagement"));
      }
      
      router.push('/client');
    } catch (error) {
      toast.error(error.message || t('journal.saveFailed', "Failed to save daily tracking"));
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
      <div className="flex items-center p-3 border-b border-border bg-card fixed top-0 left-0 right-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/client')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-3 text-lg font-semibold">{t('journal.quickCheckIn', 'Quick Daily Check-in')}</h1>
        <div className="ml-auto flex flex-col items-end gap-2">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  "min-w-[140px]"
                )}
                disabled={isLoadingEntry}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "MMM d, yyyy")
                ) : (
                  <span>{t('journal.selectDate', 'Select date')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                initialFocus
                disabled={(date) => {
                  // Allow past dates, but disable future dates
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);
                  return date > today;
                }}
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleSave} disabled={isLoading || isLoadingEntry} size="sm" className="w-full min-w-[140px]">
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? t('common.messages.saving', 'Saving...') : t('common.buttons.save', 'Save')}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 mt-16 mb-24">
        {/* Loading indicator when loading entry */}
        {/* {isLoadingEntry && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{t('journal.loadingEntry', 'Loading check-in data...')}</p>
            </div>
          </div>
        )} */}
        
        {/* Goals */}
        {!isLoadingEntry && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t('journal.goals', 'Goals')}</h2>
            </div>
            
            <div className="space-y-4">
              {/* Sleep Quality */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌙</span>
                    <span className="font-medium">{t('journal.sleepQuality', 'Sleep Quality')}</span>
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
                    <span>{t('journal.poor', 'Poor')}</span>
                    <span>{t('journal.amazing', 'Amazing')}</span>
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🥗</span>
                    <span className="font-medium">{t('journal.nutrition', 'Nutrition')}</span>
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
                    <span>{t('journal.poor', 'Poor')}</span>
                    <span>{t('journal.amazing', 'Amazing')}</span>
                  </div>
                </div>
              </div>

              {/* Physical Activity */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏃‍♂️</span>
                    <span className="font-medium">{t('journal.physicalActivity', 'Physical Activity')}</span>
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
                    <span>{t('journal.poor', 'Poor')}</span>
                    <span>{t('journal.amazing', 'Amazing')}</span>
                  </div>
                </div>
              </div>

              {/* Learning */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📚</span>
                    <span className="font-medium">{t('journal.learning', 'Learning')}</span>
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
                    <span>{t('journal.poor', 'Poor')}</span>
                    <span>{t('journal.amazing', 'Amazing')}</span>
                  </div>
                </div>
              </div>

              {/* Maintaining Relationships */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">❤️</span>
                    <span className="font-medium">{t('journal.maintainingRelationships', 'Maintaining Relationships')}</span>
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
                    <span>{t('journal.poor', 'Poor')}</span>
                    <span>{t('journal.amazing', 'Amazing')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bad Habits */}
        {!isLoadingEntry && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold">{t('journal.reduceThese', 'Reduce These')}</h2>
            </div>
            
            <div className="space-y-4">
              {/* Excessive Social Media */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <span className="font-medium">{t('journal.excessiveSocialMedia', 'Excessive Social Media')}</span>
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
                    <span>{t('journal.none', 'None')}</span>
                    <span>{t('journal.overdidIt', 'Overdid it')}</span>
                  </div>
                </div>
              </div>

              {/* Procrastination */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⏰</span>
                    <span className="font-medium">{t('journal.procrastination', 'Procrastination')}</span>
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
                    <span>{t('journal.none', 'None')}</span>
                    <span>{t('journal.overdidIt', 'Overdid it')}</span>
                  </div>
                </div>
              </div>

              {/* Negative Thinking */}
              <div className="bg-card/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">☁️</span>
                    <span className="font-medium">{t('journal.negativeThinking', 'Negative Thinking')}</span>
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
                    <span>{t('journal.none', 'None')}</span>
                    <span>{t('journal.overdidIt', 'Overdid it')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Notes */}
        {!isLoadingEntry && (
          <div className="space-y-3">
            <h2 className="font-semibold">{t('journal.howWasToday', 'How was today?')}</h2>
            <Textarea
              placeholder={t('journal.optionalNote', "Optional quick note about your day...")}
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
              <h3 className="font-semibold">{t('journal.noActiveGoals', 'No Active Goals')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('journal.setupGoalsDesc', 'Set up your goals to start quick daily tracking.')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/client/profile')}
              size="sm"
            >
              {t('journal.setUpGoals', 'Set Up Goals')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}