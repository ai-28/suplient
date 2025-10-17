"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { ArrowLeft, CheckCircle, Circle, Clock, Target, Calendar, AlertTriangle, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskCelebration } from "@/app/components/TaskCelebration";
import { StreakCounter } from "@/app/components/StreakCounter";
import { toast } from "sonner";

// Demo data for tasks
const demoTasks = [
  {
    id: "task_1",
    title: "Complete morning meditation",
    description: "Practice mindfulness for 15 minutes",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    isCompleted: false,
    category: "daily",
    estimatedTime: 15
  },
  {
    id: "task_2",
    title: "Read anxiety management chapter",
    description: "Read pages 45-60 from the workbook",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
    isCompleted: false,
    category: "weekly",
    estimatedTime: 30
  },
  {
    id: "task_3",
    title: "Practice breathing exercises",
    description: "Do 3 sets of 4-7-8 breathing",
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    isCompleted: true,
    category: "daily",
    estimatedTime: 10
  }
];

// Real useClientTasks hook with API calls
const useClientTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Tasks API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
      setTasks([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);
  
  const visibleTasks = tasks;
  
  const filterTasks = (status) => {
    switch (status) {
      case "completed":
        return tasks.filter(task => task.isCompleted);
      case "overdue":
        return tasks.filter(task => !task.isCompleted && new Date(task.dueDate) < new Date());
      default:
        return tasks.filter(task => !task.isCompleted);
    }
  };
  
  const toggleTaskCompletion = async (taskId, onComplete) => {
    try {
      // Optimistically update the UI first
      const task = tasks.find(t => t.id === taskId);
      if (!task) return false;
      
      const newCompletedState = !task.isCompleted;
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, isCompleted: newCompletedState } : task
      ));
      
      // Call the API to update the database
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: taskId,
          isCompleted: newCompletedState
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task completion');
      }

      const result = await response.json();
      
        // Create activity for task completion
        if (newCompletedState) {
          try {
            const activityResponse = await fetch('/api/activities/task-completed', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                taskData: {
                  id: taskId,
                  title: task.title,
                  description: task.description,
                  points: 5 // Default points for task completion
                }
              }),
            });
            
            if (activityResponse.ok) {
              console.log('✅ Task completion activity created');
            } else {
              console.error('❌ Failed to create task completion activity');
            }
          } catch (activityError) {
            console.error('❌ Error creating task completion activity:', activityError);
          }

          // Create notification for coach
          try {
            const notificationResponse = await fetch('/api/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: task.coachId, // Assuming task has coachId
                type: 'task_completed',
                title: 'Task Completed',
                message: `${session?.user?.name || 'Client'} completed the task: "${task.title}"`,
                data: {
                  taskId: taskId,
                  taskTitle: task.title,
                  clientId: session?.user?.id
                },
                priority: 'normal'
              }),
            });
            
            if (notificationResponse.ok) {
              console.log('✅ Task completion notification created');
            } else {
              console.error('❌ Failed to create task completion notification');
            }
          } catch (notificationError) {
            console.error('❌ Error creating task completion notification:', notificationError);
          }
        }
      
      // Call the completion callback if provided
      if (onComplete && newCompletedState) {
        await onComplete();
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error(error.message || 'Failed to update task completion');
      
      // Revert the optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      ));
      
      return false;
    }
  };
  
  const taskStats = {
    completedTasks: tasks.filter(task => task.isCompleted).length,
    availableTasks: tasks.filter(task => !task.isCompleted).length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(task => task.isCompleted).length / tasks.length) * 100) : 0,
    pendingCount: tasks.filter(task => !task.isCompleted && new Date(task.dueDate) >= new Date()).length,
    overdueCount: tasks.filter(task => !task.isCompleted && new Date(task.dueDate) < new Date()).length
  };
  
  return { 
    visibleTasks, 
    filterTasks, 
    taskStats, 
    toggleTaskCompletion, 
    isLoading, 
    error, 
    refetch: fetchTasks 
  };
};

// Real useClientGamification hook with API data
const useClientGamification = () => {
  const [gamificationData, setGamificationData] = useState({
    streak: 0,
    totalPoints: 0,
    level: 0,
    pointsToNextLevel: 100,
    activeMilestone: "Getting Started"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        const response = await fetch('/api/analytics?period=today');
        if (response.ok) {
          const data = await response.json();
          const level = Math.floor((data.totalEngagementPoints || 0) / 100) + 1;
          const pointsToNextLevel = (level * 100) - (data.totalEngagementPoints || 0);
          
          setGamificationData({
            streak: data.dailyStreak || 0,
            totalPoints: data.totalEngagementPoints || 0,
            level,
            pointsToNextLevel,
            activeMilestone: getMilestoneName(level)
          });
        }
      } catch (error) {
        console.error('Error fetching gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, []);

  const getMilestoneName = (level) => {
    if (level >= 10) return "Master";
    if (level >= 7) return "Expert";
    if (level >= 5) return "Advanced";
    if (level >= 3) return "Intermediate";
    return "Beginner";
  };
  
  const onTaskCompleted = async () => {
    // Refresh gamification data after task completion
    try {
      const response = await fetch('/api/analytics?period=today');
      if (response.ok) {
        const data = await response.json();
        const level = Math.floor((data.totalEngagementPoints || 0) / 100) + 1;
        const pointsToNextLevel = (level * 100) - (data.totalEngagementPoints || 0);
        
        setGamificationData({
          streak: data.dailyStreak || 0,
          totalPoints: data.totalEngagementPoints || 0,
          level,
          pointsToNextLevel,
          activeMilestone: getMilestoneName(level)
        });
      }
    } catch (error) {
      console.error('Error refreshing gamification data:', error);
    }
    
    return { milestone: "Task completed! +1 point" };
  };
  
  return { 
    ...gamificationData, 
    onTaskCompleted, 
    loading 
  };
};

// Mock utility functions
const formatTaskDueDate = (dueDate) => {
  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString();
};

const getTaskStatusBadge = (task) => {
  if (task.isCompleted) return { variant: "default", text: "Completed" };
  if (new Date(task.dueDate) < new Date()) return { variant: "destructive", text: "Overdue" };
  if (task.priority === "high") return { variant: "secondary", text: "High Priority" };
  return { variant: "outline", text: "Active" };
};

export default function ClientTasks() {
  const router = useRouter();
  const [filter, setFilter] = useState("open");
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  
  const { visibleTasks, filterTasks, taskStats, toggleTaskCompletion, isLoading, error } = useClientTasks();
  
  // Gamification system
  const { 
    streak, 
    totalPoints, 
    level, 
    pointsToNextLevel, 
    activeMilestone, 
    onTaskCompleted,
    loading: gamificationLoading
  } = useClientGamification();
  
  const [recentMilestone, setRecentMilestone] = useState(null);
  
  // Mock motivational quotes
  const motivationalQuotes = [
    "Progress, not perfection. 💪",
    "One step at a time. 🌱", 
    "You've got this! ✨",
    "Building resilience daily. 🌟",
    "Growing stronger every day. 🚀"
  ];
  const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];
  

  const handleTaskToggle = async (taskId) => {
    const success = await toggleTaskCompletion(taskId, async () => {
      const result = await onTaskCompleted();
      if (result.milestone) {
        setRecentMilestone(result.milestone);
        setTimeout(() => setRecentMilestone(null), 5000); // Clear after 5 seconds
      }
      setShowCelebration(true);
    });
  };

  const toggleTaskExpansion = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const filteredTasks = (() => {
    switch (filter) {
      case "completed":
        return filterTasks("completed");
      case "overdue":
        return filterTasks("overdue");
      case "open":
      default:
        return visibleTasks.filter(task => !task.isCompleted);
    }
  })();

  const { completedTasks, availableTasks, completionRate } = taskStats;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Loading State */}
      {isLoading && (
        <div className="p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Error loading tasks</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content - only show when not loading and no error */}
      {!isLoading && !error && (
        <>
          {/* Enhanced Header with Gamification */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
                      <Button variant="ghost" size="icon" onClick={() => router.push('/client')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">My Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">{todayQuote}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Simplified Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="open" className="text-sm px-3">
              Open
              {taskStats.pendingCount > 0 && (
                <span className="ml-1 text-xs opacity-70">({taskStats.pendingCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-sm px-3">
              Overdue
              {taskStats.overdueCount > 0 && (
                <span className="ml-1 text-xs opacity-70">({taskStats.overdueCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-sm px-3">
              Completed
              {completedTasks > 0 && (
                <span className="ml-1 text-xs opacity-70">({completedTasks})</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tasks List - Mobile Optimized with Expansion */}
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const statusBadge = getTaskStatusBadge(task);
            const isExpanded = expandedTasks.has(task.id);
            
            return (
              <Card key={task.id} className={`${task.isCompleted ? "bg-muted/50" : ""} transition-all duration-200`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleTaskExpansion(task.id)}>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-4">
                      <Button
                        variant={task.isCompleted ? "default" : "outline"}
                        size="icon"
                        className="mt-1 h-8 w-8 p-0 min-h-[44px] min-w-[44px] rounded-full touch-manipulation"
                        onClick={() => handleTaskToggle(task.id)}
                      >
                        {task.isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className={`font-medium text-base ${
                            task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {((filter === 'open' && !task.isCompleted) || 
                              (filter === 'overdue' && !task.isCompleted && new Date(task.dueDate) < new Date()) || 
                              (filter === 'completed' && task.isCompleted)) && (
                              <Badge variant={statusBadge.variant} className="text-xs">
                                {statusBadge.text}
                              </Badge>
                            )}
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${
                          task.isCompleted ? 'text-muted-foreground line-through' : 'text-muted-foreground'
                        }`}>
                          {task.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatTaskDueDate(task.dueDate)}
                          </div>
                          {task.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {task.estimatedTime}
                            </div>
                          )}
                        </div>
                        
                        <CollapsibleContent className="space-y-3">
                          <div className="pt-2 border-t border-border">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground">Task Details</p>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {task.category && (
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    <span>Category: {task.category}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  <span>Type: {task.category === 'daily' ? 'Daily Activity' : 'Weekly Goal'}</span>
                                </div>
                              </div>
                              
                              
                              {/* Progress Note for Completed Tasks */}
                              {task.isCompleted && (
                                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                                  <p className="text-sm text-success font-medium">✓ Great job! Task completed successfully.</p>
                                  <p className="text-xs text-success/80 mt-1">You earned +10 XP for this completion.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </div>
                  </CardContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  {filter === "completed" 
                    ? "You haven't completed any tasks yet."
                    : filter === "overdue"
                    ? "No overdue tasks - you're up to date!"
                    : "No open tasks to show."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Streak Counter */}
        <StreakCounter 
          streak={streak}
          totalPoints={totalPoints}
          level={level}
          pointsToNextLevel={pointsToNextLevel}
          activeMilestone={activeMilestone}
          recentMilestone={recentMilestone}
        />
      </div>
      
        </>
      )}
      
      <TaskCelebration 
        isVisible={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
    </div>
  );
}