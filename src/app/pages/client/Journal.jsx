"use client"

import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Slider } from "@/app/components/ui/slider";
import { ArrowLeft, Save, Target, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Demo data for goals
const demoGoals = [
  {
    id: "goal_1",
    name: "Daily Exercise",
    icon: "🏃‍♂️",
    target: 30,
    unit: "minutes",
    currentValue: 25,
    deadline: "2024-12-31"
  },
  {
    id: "goal_2", 
    name: "Mindfulness Practice",
    icon: "🧘‍♀️",
    target: 15,
    unit: "minutes",
    currentValue: 10,
    deadline: "2024-12-31"
  },
  {
    id: "goal_3",
    name: "Read Books",
    icon: "📚",
    target: 20,
    unit: "pages",
    currentValue: 15,
    deadline: "2024-12-31"
  }
];

// Demo data for bad habits
const demoBadHabits = [
  {
    id: "habit_1",
    name: "Screen Time",
    icon: "📱",
    currentValue: 4,
    unit: "hours",
    target: 2
  },
  {
    id: "habit_2",
    name: "Junk Food",
    icon: "🍔",
    currentValue: 2,
    unit: "times",
    target: 0
  }
];

// Mock functions to replace missing hooks
const getActiveGoals = () => demoGoals;
const getActiveBadHabits = () => demoBadHabits;

// Mock useDailyTracking hook
const useDailyTracking = (goals, habits) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const saveDailyEntry = async (goalScores, badHabitScores, notes) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving daily entry:', { goalScores, badHabitScores, notes });
    setIsLoading(false);
  };
  
  const getTodayEntry = () => {
    // Return null to simulate no existing entry
    return null;
  };
  
  return { saveDailyEntry, getTodayEntry, isLoading };
};

export default function ClientJournal() {
  const router = useRouter();
  const activeGoals = getActiveGoals();
  const activeBadHabits = getActiveBadHabits();
  const { saveDailyEntry, getTodayEntry, isLoading } = useDailyTracking(activeGoals, activeBadHabits);
  
  const [goalScores, setGoalScores] = useState({});
  const [badHabitScores, setBadHabitScores] = useState({});
  const [notes, setNotes] = useState("");
  
  // Initialize scores only once when component mounts
  useEffect(() => {
    // Initialize with default scores
    const initialGoalScores = {};
    const initialBadHabitScores = {};
    
    activeGoals.forEach(goal => {
      initialGoalScores[goal.id] = 3;
    });
    
    activeBadHabits.forEach(habit => {
      initialBadHabitScores[habit.id] = 2;
    });
    
    setGoalScores(initialGoalScores);
    setBadHabitScores(initialBadHabitScores);
  }, []); // Empty dependency array - only run once on mount

  const handleGoalScoreChange = (goalId, score) => {
    setGoalScores(prev => ({ ...prev, [goalId]: Math.max(0, Math.min(5, score)) }));
  };

  const handleBadHabitScoreChange = (habitId, score) => {
    setBadHabitScores(prev => ({ ...prev, [habitId]: Math.max(0, Math.min(5, score)) }));
  };

  const handleSave = async () => {
    try {
      await saveDailyEntry(goalScores, badHabitScores, notes);
      toast.success("Daily tracking saved successfully!");
      router.push('/client');
    } catch (error) {
      toast.error("Failed to save daily tracking");
      console.error('Error saving daily entry:', error);
    }
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
        {activeGoals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Goals</h2>
            </div>
            
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="bg-card/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{goal.icon}</span>
                      <span className="font-medium">{goal.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getScoreEmoji(goalScores[goal.id] || 3)}</span>
                      <span className="text-lg font-semibold min-w-[20px]">{goalScores[goal.id] || 3}</span>
                    </div>
                  </div>
                  
                  <div className="px-2">
                    <Slider
                      value={[goalScores[goal.id] || 3]}
                      onValueChange={(value) => handleGoalScoreChange(goal.id, value[0])}
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
              ))}
            </div>
          </div>
        )}

        {/* Bad Habits */}
        {activeBadHabits.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold">Reduce These</h2>
            </div>
            
            <div className="space-y-4">
              {activeBadHabits.map((habit) => (
                <div key={habit.id} className="bg-card/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{habit.icon}</span>
                      <span className="font-medium">{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getBadHabitEmoji(badHabitScores[habit.id] || 2)}</span>
                      <span className="text-lg font-semibold min-w-[20px]">{badHabitScores[habit.id] || 2}</span>
                    </div>
                  </div>
                  
                  <div className="px-2">
                    <Slider
                      value={[badHabitScores[habit.id] || 2]}
                      onValueChange={(value) => handleBadHabitScoreChange(habit.id, value[0])}
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
              ))}
            </div>
          </div>
        )}

        {/* Quick Notes */}
        {(activeGoals.length > 0 || activeBadHabits.length > 0) && (
          <div className="space-y-3">
            <h2 className="font-semibold">How was today?</h2>
            <Textarea
              placeholder="Optional quick note about your day..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] bg-card/50 border-none"
              rows={3}
            />
          </div>
        )}

        {/* Empty State */}
        {activeGoals.length === 0 && activeBadHabits.length === 0 && (
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