"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoalAnalyticsChart } from "@/app/components/GoalAnalyticsChart";
import { StreakCounter } from "@/app/components/StreakCounter";

// Demo data for goals
const demoGoals = [
  { id: 1, title: "Daily Meditation", category: "Mindfulness", target: "10 minutes", progress: 80, color: "bg-blue-500" },
  { id: 2, title: "Exercise Routine", category: "Fitness", target: "30 minutes", progress: 65, color: "bg-green-500" },
  { id: 3, title: "Reading Habit", category: "Learning", target: "20 pages", progress: 90, color: "bg-purple-500" },
  { id: 4, title: "Water Intake", category: "Health", target: "8 glasses", progress: 75, color: "bg-cyan-500" }
];

// Demo data for daily entries
const demoEntries = [
  { date: "2024-01-15", score: 85, goals: [1, 2, 3], habits: [1] },
  { date: "2024-01-14", score: 92, goals: [1, 2, 3, 4], habits: [] },
  { date: "2024-01-13", score: 78, goals: [1, 3], habits: [1, 2] },
  { date: "2024-01-12", score: 88, goals: [1, 2, 4], habits: [1] },
  { date: "2024-01-11", score: 95, goals: [1, 2, 3, 4], habits: [] },
  { date: "2024-01-10", score: 82, goals: [1, 3, 4], habits: [1] },
  { date: "2024-01-09", score: 89, goals: [1, 2, 3], habits: [1] }
];

// Demo data for bad habits
const demoBadHabits = [
  { id: 1, title: "Late Night Snacking", category: "Health", frequency: 3 },
  { id: 2, title: "Procrastination", category: "Productivity", frequency: 2 }
];

// Custom hooks with demo data
const useGoalTracking = () => {
  return {
    getActiveGoals: () => demoGoals,
    getActiveBadHabits: () => demoBadHabits,
    calculateOverallScore: () => 87
  };
};

const useDailyTracking = (activeGoals, activeBadHabits) => {
  return {
    getTodayEntry: () => demoEntries[0],
    getWeeklyAverage: () => 87,
    getMonthlyAverage: () => 85,
    getGoalDistribution: () => demoGoals,
    currentStreak: 7,
    calculatePeriodStats: () => ({ completed: 24, total: 28, percentage: 85.7 }),
    entries: demoEntries
  };
};

// Translation function - replace with your actual translation setup
const t = (key) => {
  const translations = {
    "dashboard.client.title": "Client Dashboard",
    "dashboard.client.nextSession": "Next Session",
    "buttons.join": "Join"
  };
  return translations[key] || key;
};

export default function ClientDashboard() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today");
  
  const { getActiveGoals, getActiveBadHabits, calculateOverallScore } = useGoalTracking();
  const activeGoals = getActiveGoals();
  const activeBadHabits = getActiveBadHabits();
  const { 
    getTodayEntry, 
    getWeeklyAverage, 
    getMonthlyAverage, 
    getGoalDistribution,
    currentStreak,
    calculatePeriodStats,
    entries
  } = useDailyTracking(activeGoals, activeBadHabits);

  // Get historical data based on selected period
  const getHistoricalData = (period) => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    
    switch (period) {
      case 'today':
        startDate.setDate(endDate.getDate());
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 6);
        break;
      case 'month':
        startDate.setDate(endDate.getDate() - 29);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return entries.filter(entry => 
      entry.date >= startDateStr && entry.date <= endDateStr
    ).sort((a, b) => a.date.localeCompare(b.date));
  };

  const handleTimePeriodChange = (period) => {
    setActiveTab(period);
  };

  const upcomingSessions = [
    { id: 1, therapist: "Dr. Sarah Johnson", date: "Today", time: "2:00 PM", type: "Individual" },
    { id: 2, therapist: "Group Session", date: "Tomorrow", time: "10:00 AM", type: "Group" },
  ];

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Date Navigation */}
      <div className="flex items-center justify-center p-4 bg-card border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="mx-8 text-center">
          <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
                  
        
        {/* Analytics Chart */}
        <GoalAnalyticsChart 
          data={getGoalDistribution()}
          historicalData={getHistoricalData(activeTab)}
          onTimePeriodChange={handleTimePeriodChange}
        />  

        {/* Next Session */}
        {upcomingSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("dashboard.client.nextSession")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{upcomingSessions[0].therapist}</p>
                  <p className="text-sm text-muted-foreground">
                    {upcomingSessions[0].date} at {upcomingSessions[0].time}
                  </p>
                </div>
                <Button size="sm">{t("buttons.join")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Streak Counter */}
        <StreakCounter
          streak={currentStreak}
          totalPoints={currentStreak * 10}
          level={Math.floor(currentStreak / 7) + 1}
          pointsToNextLevel={((Math.floor(currentStreak / 7) + 1) * 70) - (currentStreak * 10)}
        />
      </div>

    </div>
  );
}
