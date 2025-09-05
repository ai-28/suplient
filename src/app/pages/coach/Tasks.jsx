"use client"

import { useRouter } from "next/navigation";  
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { PageHeader } from "@/app/components/PageHeader";
import { StatsCard } from "@/app/components/StatsCard";
import { 
  ClipboardList, 
  Users, 
  User, 
  Plus, 
  Edit,
  BarChart3,
  CheckCircle,
  Clock,
  Target,
  Calendar,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  CircleCheck,
  Circle,
  UsersRound,
  TrendingUp,
  TrendingDown,
  Search,
  
} from "lucide-react";
import { useState, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { CreateTaskDialog } from "@/app/components/CreateTaskDialog";
import { EditTaskDialog } from "@/app/components/EditTaskDialog";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

// Combined client tasks data
const allClientTasks = [
  { id: 1, client: "John Doe", task: "Complete daily meditation", status: "open", avatar: "JD", dueDate: "2024-01-15" },
  { id: 2, client: "Bob Dylan", task: "Journal writing exercise", status: "closed", avatar: "BD", dueDate: "2024-01-12" },
  { id: 3, client: "Alice Smith", task: "Breathing exercises session", status: "open", avatar: "AS", dueDate: "2024-01-15" },
  { id: 4, client: "Emma Wilson", task: "Review weekly progress", status: "open", avatar: "EW", dueDate: "2024-01-15" },
  { id: 5, client: "Mark Johnson", task: "Complete anxiety worksheet", status: "open", avatar: "MJ", dueDate: "2024-01-10" },
  { id: 6, client: "Sarah Brown", task: "Submit self-assessment form", status: "open", avatar: "SB", dueDate: "2024-01-08" },
  { id: 7, client: "David Miller", task: "Weekly therapy homework", status: "open", avatar: "DM", dueDate: "2024-01-18" },
  { id: 8, client: "Lisa Chen", task: "Mindfulness practice log", status: "open", avatar: "LC", dueDate: "2024-01-20" },
  { id: 9, client: "Tom Wilson", task: "Anxiety management plan", status: "closed", avatar: "TW", dueDate: "2024-01-14" },
  { id: 10, client: "Kate Brown", task: "Sleep hygiene checklist", status: "open", avatar: "KB", dueDate: "2024-01-22" }
];

// Combined personal tasks data
const allMyTasks = [
  { id: 1, task: "Review client progress reports", completed: true, dueDate: "2024-01-14" },
  { id: 2, task: "Prepare group session materials", completed: false, dueDate: "2024-01-16" },
  { id: 3, task: "Call new client referrals", completed: false, dueDate: "2024-01-15" },
  { id: 4, task: "Update treatment plans", completed: false, dueDate: "2024-01-15" },
  { id: 5, task: "Submit monthly report", completed: false, dueDate: "2024-01-12" },
  { id: 6, task: "Schedule team meeting", completed: false, dueDate: "2024-01-10" },
  { id: 7, task: "Update client documentation", completed: false, dueDate: "2024-01-18" },
  { id: 8, task: "Attend supervision meeting", completed: true, dueDate: "2024-01-13" },
  { id: 9, task: "Research new therapy techniques", completed: false, dueDate: "2024-01-20" },
  { id: 10, task: "Complete professional development course", completed: false, dueDate: "2024-01-25" },
  // Membership request tasks
  { id: 11, task: "Review membership request from Emma Thompson for Anxiety Support Group", completed: false, dueDate: "2024-01-23", type: "membership_request", groupId: 3, requestId: "req_1" },
  { id: 12, task: "Review membership request from David Chen for Teen Support Group", completed: false, dueDate: "2024-01-24", type: "membership_request", groupId: 4, requestId: "req_2" }
];

// Group tasks data
const allGroupTasks = [
  { id: 1, groupName: "Anxiety Support Group", task: "Complete weekly check-in survey", status: "open", dueDate: "2024-01-15", assignedCount: 8, completedCount: 5 },
  { id: 2, groupName: "Mindfulness Circle", task: "Practice daily meditation", status: "open", dueDate: "2024-01-14", assignedCount: 12, completedCount: 9 },
  { id: 3, groupName: "Depression Recovery", task: "Submit mood tracking journal", status: "open", dueDate: "2024-01-10", assignedCount: 6, completedCount: 2 },
  { id: 4, groupName: "Teen Support Group", task: "Read coping strategies handout", status: "open", dueDate: "2024-01-18", assignedCount: 10, completedCount: 7 },
  { id: 5, groupName: "PTSD Recovery", task: "Complete breathing exercise log", status: "closed", dueDate: "2024-01-12", assignedCount: 5, completedCount: 5 },
  { id: 6, groupName: "Anxiety Support Group", task: "Practice grounding techniques", status: "open", dueDate: "2024-01-20", assignedCount: 8, completedCount: 3 },
  { id: 7, groupName: "Mindfulness Circle", task: "Watch mindfulness video", status: "open", dueDate: "2024-01-22", assignedCount: 12, completedCount: 8 },
  { id: 8, groupName: "Depression Recovery", task: "Complete self-care checklist", status: "open", dueDate: "2024-01-16", assignedCount: 6, completedCount: 4 }
];

// Helper functions
const getTaskStatus = (task) => {
  const today = new Date("2024-01-15");
  const dueDate = new Date(task.dueDate);
  
  if (dueDate < today) return "overdue";
  if (dueDate.toDateString() === today.toDateString()) return "today";
  return "upcoming";
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date("2024-01-15");  
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date < today) return `${Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Tasks() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [clientFilter, setClientFilter] = useState("all");
  const [myTaskFilter, setMyTaskFilter] = useState("all");
  const [groupTaskFilter, setGroupTaskFilter] = useState("all");
  const [editingTask, setEditingTask] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use new task system
  const allClientTasks = [];
  const coachTaskStats = {
    totalTasks: 0,
    completedTasks: 0,
    overdueCount: 0
  };

  const filterClientTasks = (tasks) => {
    if (clientFilter === "all") return tasks;
    if (clientFilter === "today") return tasks.filter(task => task.status === "due_today");
    if (clientFilter === "overdue") return tasks.filter(task => task.status === "overdue");
    if (clientFilter === "completed") return tasks.filter(task => task.status === "completed");
    if (clientFilter === "open") return tasks.filter(task => !task.isCompleted);
    return tasks;
  };

  const filterMyTasks = (tasks) => {
    if (myTaskFilter === "all") return tasks;
    if (myTaskFilter === "today") return tasks.filter(task => getTaskStatus(task) === "today");
    if (myTaskFilter === "overdue") return tasks.filter(task => getTaskStatus(task) === "overdue");
    if (myTaskFilter === "completed") return tasks.filter(task => task.completed);
    if (myTaskFilter === "open") return tasks.filter(task => !task.completed);
    return tasks;
  };

  const filterGroupTasks = (tasks) => {
    if (groupTaskFilter === "all") return tasks;
    if (groupTaskFilter === "today") return tasks.filter(task => getTaskStatus(task) === "today");
    if (groupTaskFilter === "overdue") return tasks.filter(task => getTaskStatus(task) === "overdue");
    if (groupTaskFilter === "completed") return tasks.filter(task => task.status === "closed");
    if (groupTaskFilter === "open") return tasks.filter(task => task.status === "open");
    return tasks;
  };

  // Tab-specific stats calculators
  const getClientTaskStats = () => {
    return {
      totalTasks: coachTaskStats.totalTasks,
      totalCompleted: coachTaskStats.completedTasks,
      overdueTasks: coachTaskStats.overdueCount
    };
  };

  const getMyTaskStats = () => {
    const today = new Date("2024-01-15");
    const completedTasks = allMyTasks.filter(task => task.completed).length;
    const overdueTasks = allMyTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < today && !task.completed;
    }).length;

    return {
      totalTasks: allMyTasks.length,
      totalCompleted: completedTasks,
      overdueTasks
    };
  };

  const getGroupTaskStats = () => {
    const today = new Date("2024-01-15");
    const completedTasks = allGroupTasks.filter(task => task.status === "closed").length;
    const overdueTasks = allGroupTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < today && task.status === "open";
    }).length;

    return {
      totalTasks: allGroupTasks.length,
      totalCompleted: completedTasks,
      overdueTasks
    };
  };

  // Dynamic KPI stats based on active tab
  const kpiStats = useMemo(() => {
    switch (activeTab) {
      case 'client-tasks':
        return getClientTaskStats();
      case 'my-tasks':
        return getMyTaskStats();
      case 'group-tasks':
        return getGroupTaskStats();
      default:
        // Default to overall stats (all combined)
        const totalMyTasks = allMyTasks.length;
        const totalGroupTasks = allGroupTasks.length;
        const totalTasks = coachTaskStats.totalTasks + totalMyTasks + totalGroupTasks;
        
        const completedMyTasks = allMyTasks.filter(task => task.completed).length;
        const completedGroupTasks = allGroupTasks.filter(task => task.status === "closed").length;
        const totalCompleted = coachTaskStats.completedTasks + completedMyTasks + completedGroupTasks;
        
        const today = new Date("2024-01-15");
        const myOverdue = allMyTasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate < today && !task.completed;
        }).length;
        
        const groupOverdue = allGroupTasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate < today && task.status === "open";
        }).length;
        
        const overdueTasks = coachTaskStats.overdueCount + myOverdue + groupOverdue;

        return {
          totalTasks,
          totalCompleted,
          overdueTasks
        };
    }
  }, [activeTab, coachTaskStats, allMyTasks, allGroupTasks]);

  // Dynamic chart data based on active tab
  const getChartData = () => {
    switch (activeTab) {
      case 'client-tasks':
        return [
          { month: "Sep", completed: 12, pending: 8, overdue: 1 },
          { month: "Oct", completed: 15, pending: 10, overdue: 2 },
          { month: "Nov", completed: 18, pending: 12, overdue: 1 },
          { month: "Dec", completed: 22, pending: 14, overdue: 3 },
          { month: "Jan", completed: 25, pending: 16, overdue: 2 }
        ];
      case 'my-tasks':
        return [
          { month: "Sep", completed: 20, pending: 5, overdue: 1 },
          { month: "Oct", completed: 24, pending: 6, overdue: 2 },
          { month: "Nov", completed: 28, pending: 7, overdue: 2 },
          { month: "Dec", completed: 32, pending: 6, overdue: 2 },
          { month: "Jan", completed: 35, pending: 7, overdue: 3 }
        ];
      case 'group-tasks':
        return [
          { month: "Sep", completed: 13, pending: 2, overdue: 1 },
          { month: "Oct", completed: 13, pending: 2, overdue: 1 },
          { month: "Nov", completed: 14, pending: 1, overdue: 1 },
          { month: "Dec", completed: 14, pending: 2, overdue: 1 },
          { month: "Jan", completed: 15, pending: 2, overdue: 3 }
        ];
      default:
        // Overall combined data
        return [
          { month: "Sep", completed: 45, pending: 15, overdue: 3 },
          { month: "Oct", completed: 52, pending: 18, overdue: 5 },
          { month: "Nov", completed: 60, pending: 20, overdue: 4 },
          { month: "Dec", completed: 68, pending: 22, overdue: 6 },
          { month: "Jan", completed: 75, pending: 25, overdue: 8 }
        ];
    }
  };

  const getChartTitle = () => {
    switch (activeTab) {
      case 'client-tasks':
        return 'Client Task Trends';
      case 'my-tasks':
        return 'Personal Task Trends';
      case 'group-tasks':
        return 'Group Task Trends';
      default:
        return 'Overall Task Trends';
    }
  };

  const getChartSubtitle = () => {
    switch (activeTab) {
      case 'client-tasks':
        return 'Tasks assigned from client programs';
      case 'my-tasks':
        return 'Your personal tasks and requests';
      case 'group-tasks':
        return 'Tasks across all managed groups';
      default:
        return 'Combined view of all your managed tasks';
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleTaskUpdated = (updatedData) => {
    console.log("Task updated:", updatedData);
    // In a real app, this would update the task in the backend
    // For now, we'll just log it
  };

  const filteredClientTasks = useMemo(() => {
    let tasks = filterClientTasks(allClientTasks);
    if (searchTerm) {
      tasks = tasks.filter(task => 
        task.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tasks;
  }, [allClientTasks, clientFilter, searchTerm]);

  const filteredMyTasks = useMemo(() => {
    let tasks = filterMyTasks(allMyTasks);
    if (searchTerm) {
      tasks = tasks.filter(task => 
        task.task.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tasks;
  }, [myTaskFilter, searchTerm]);

  const filteredGroupTasks = useMemo(() => {
    let tasks = filterGroupTasks(allGroupTasks);
    if (searchTerm) {
      tasks = tasks.filter(task => 
        task.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tasks;
  }, [groupTaskFilter, searchTerm]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader 
        title={"Tasks"} 
        subtitle={"Manage your tasks"}
      >
        <CreateTaskDialog />
      </PageHeader>

      {/* Simplified KPI Statistics - Only 3 Essential Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={"Total Tasks"}
          value={kpiStats.totalTasks}
          icon={ClipboardList}
          iconColor="bg-gradient-primary"
          trend={{
            icon: TrendingUp,
            text: "Active tasks",
            color: "text-success"
          }}
        />
        <StatsCard
          title={"Completed Tasks"}
          value={kpiStats.totalCompleted}
          icon={CheckCircle}
          iconColor="bg-primary"
          trend={{
            icon: TrendingUp,
            text: "Great progress!",
            color: "text-success"
          }}
        />
        <StatsCard
          title="Overdue Tasks"
          value={kpiStats.overdueTasks}
          icon={AlertTriangle}
          iconColor="bg-destructive"
          trend={{
            icon: AlertTriangle,
            text: "Needs attention",
            color: "text-destructive"
          }}
        />
      </div>

      {/* Main Content Row - Task Management Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Task Management - Takes 2/3 of space */}
        <Card className="card-standard lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-full grid-cols-3 bg-muted">
                  <TabsTrigger value="my-tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    My Tasks
                  </TabsTrigger>
                  <TabsTrigger value="client-tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Client Tasks
                  </TabsTrigger>
                  <TabsTrigger value="group-tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Group Tasks
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Enhanced Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <TabsContent value="client-tasks" className="px-6 pb-6">
              <div className="space-y-4">
                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={clientFilter === "all" ? "default" : "outline"}
                    onClick={() => setClientFilter("all")}
                    className="h-8 hover-scale"
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={clientFilter === "today" ? "default" : "outline"}
                    onClick={() => setClientFilter("today")}
                    className="h-8 hover-scale"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant={clientFilter === "open" ? "default" : "outline"}
                    onClick={() => setClientFilter("open")}
                    className="h-8 hover-scale"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant={clientFilter === "overdue" ? "default" : "outline"}
                    onClick={() => setClientFilter("overdue")}
                    className="h-8 hover-scale"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Overdue
                  </Button>
                  <Button
                    size="sm"
                    variant={clientFilter === "completed" ? "default" : "outline"}
                    onClick={() => setClientFilter("completed")}
                    className="h-8 hover-scale"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Button>
                </div>

                {/* Enhanced Task List */}
                <div className="max-h-[32rem] overflow-y-auto space-y-3">
                  {filteredClientTasks.map((task) => {
                    const status = getTaskStatus(task);
                    
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-sm animate-fade-in"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {task.clientId.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">Client {task.clientId}</p>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{formatTaskDueDate(task.dueDate)}</span>
                                <Badge variant={status.variant} className="text-xs h-4 px-1.5">
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.isCompleted ? (
                            <CircleCheck className="h-5 w-5 text-success" />
                          ) : (
                            <Circle className="h-5 w-5 text-info" />
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover-scale"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="my-tasks" className="px-6 pb-6">
              <div className="space-y-4">
                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={myTaskFilter === "all" ? "default" : "outline"}
                    onClick={() => setMyTaskFilter("all")}
                    className="h-8 hover-scale"
                  >
                      All
                  </Button>
                  <Button
                    size="sm"
                    variant={myTaskFilter === "today" ? "default" : "outline"}
                    onClick={() => setMyTaskFilter("today")}
                    className="h-8 hover-scale"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                      Today
                  </Button>
                  <Button
                    size="sm"
                    variant={myTaskFilter === "open" ? "default" : "outline"}
                    onClick={() => setMyTaskFilter("open")}
                    className="h-8 hover-scale"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                      Open
                  </Button>
                  <Button
                    size="sm"
                    variant={myTaskFilter === "overdue" ? "default" : "outline"}
                    onClick={() => setMyTaskFilter("overdue")}
                    className="h-8 hover-scale"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                  </Button>
                  <Button
                    size="sm"
                    variant={myTaskFilter === "completed" ? "default" : "outline"}
                    onClick={() => setMyTaskFilter("completed")}
                    className="h-8 hover-scale"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                  </Button>
                </div>

                {/* Enhanced Task List */}
                <div className="max-h-[32rem] overflow-y-auto space-y-3">
                  {filteredMyTasks.map((task) => {
                    const status = getTaskStatus(task);
                    
                    return (
                         <div 
                         key={task.id} 
                         className={`flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-sm animate-fade-in ${
                           task.type === 'membership_request' ? 'cursor-pointer' : ''
                         }`}
                         onClick={() => {
                           if (task.type === 'membership_request' && task.groupId) {
                            router.push(`/coach/group/${task.groupId}?tab=members&settings=true&requestsTab=true`);
                           }
                         }}
                       >
                        <Checkbox 
                          id={`my-task-${task.id}`} 
                          checked={task.completed}
                          className="transition-transform hover:scale-110"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <label 
                              htmlFor={`my-task-${task.id}`} 
                              className={`text-sm font-medium cursor-pointer transition-all ${
                                task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {task.task}
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                            {status === "overdue" && !task.completed && (
                              <Badge variant="destructive" className="text-xs h-4 px-1.5 animate-pulse">Overdue</Badge>
                            )}
                            {status === "today" && !task.completed && (
                              <Badge variant="info" className="text-xs h-4 px-1.5">Due Today</Badge>
                            )}
                            {task.completed && (
                              <Badge variant="success" className="text-xs h-4 px-1.5">Completed</Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover-scale"
                          onClick={() => handleEditTask(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="group-tasks" className="px-6 pb-6">
              <div className="space-y-4">
                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={groupTaskFilter === "all" ? "default" : "outline"}
                    onClick={() => setGroupTaskFilter("all")}
                    className="h-8 hover-scale"
                  >
                      All
                  </Button>
                  <Button
                    size="sm"
                    variant={groupTaskFilter === "today" ? "default" : "outline"}
                    onClick={() => setGroupTaskFilter("today")}
                    className="h-8 hover-scale"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                      Today
                  </Button>
                  <Button
                    size="sm"
                    variant={groupTaskFilter === "open" ? "default" : "outline"}
                    onClick={() => setGroupTaskFilter("open")}
                    className="h-8 hover-scale"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                      Open
                  </Button>
                  <Button
                    size="sm"
                    variant={groupTaskFilter === "overdue" ? "default" : "outline"}
                    onClick={() => setGroupTaskFilter("overdue")}
                    className="h-8 hover-scale"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                  </Button>
                  <Button
                    size="sm"
                    variant={groupTaskFilter === "completed" ? "default" : "outline"}
                    onClick={() => setGroupTaskFilter("completed")}
                    className="h-8 hover-scale"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                  </Button>
                </div>

                {/* Enhanced Task List */}
                <div className="max-h-[32rem] overflow-y-auto space-y-3">
                  {filteredGroupTasks.map((task) => {
                    const status = getTaskStatus(task);
                    const progressPercentage = (task.completedCount / task.assignedCount) * 100;
                    
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-sm animate-fade-in"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                            <UsersRound className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">{task.groupName}</p>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{task.task}</p>
                            <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                              <span className="text-xs text-muted-foreground">
                                {task.completedCount}/{task.assignedCount} completed ({Math.round(progressPercentage)}%)
                              </span>
                              {status === "overdue" && task.status === "open" && (
                                <Badge variant="destructive" className="text-xs h-4 px-1.5 animate-pulse">Overdue</Badge>
                              )}
                              {status === "today" && task.status === "open" && (
                                <Badge variant="info" className="text-xs h-4 px-1.5">Due Today</Badge>
                              )}
                              {task.status === "closed" && (
                                <Badge variant="success" className="text-xs h-4 px-1.5">Completed</Badge>
                              )}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status === 'open' ? (
                            <Circle className="h-5 w-5 text-info" />
                          ) : (
                            <CircleCheck className="h-5 w-5 text-success" />
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover-scale"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Simplified Analytics Panel - Takes 1/3 of space */}
        <div className="space-y-6">
          {/* Task Trends Chart - Only Essential Analytics */}
          <Card className="shadow-soft border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-secondary" />
                {getChartTitle()}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{getChartSubtitle()}</p>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-medium)',
                        color: 'hsl(var(--popover-foreground))',
                        fontSize: 12
                      }}
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    />
                    <Bar
                      dataKey="completed"
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      fill="hsl(var(--accent))"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="overdue"
                      fill="hsl(var(--destructive))"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span className="text-muted-foreground">Overdue</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={editingTask}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}
