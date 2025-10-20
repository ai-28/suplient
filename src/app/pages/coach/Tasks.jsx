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
import { useTasks } from "@/app/hooks/useTasks";

// Helper function to format task due date
const formatTaskDueDate = (dueDate) => {
  if (!dueDate) return 'No due date';
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date < today) return `${Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper functions
const getTaskStatus = (task) => {
  if (task.status === 'completed') return { label: 'Completed', variant: 'success' };
  
  if (!task.dueDate) return { label: 'No due date', variant: 'secondary' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate < today) return { label: 'Overdue', variant: 'destructive' };
  if (dueDate.toDateString() === today.toDateString()) return { label: 'Due Today', variant: 'info' };
  return { label: 'Upcoming', variant: 'secondary' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'No due date';
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
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
  
  // Use real data from database
  const { 
    personalTasks, 
    clientTasks, 
    groupTasks, 
    stats, 
    loading, 
    error, 
    refetchTasks,
    updateTaskStatus
  } = useTasks();

  const filterClientTasks = (tasks) => {
    if (clientFilter === "all") return tasks;
    if (clientFilter === "today") return tasks.filter(task => getTaskStatus(task).label === "Due Today");
    if (clientFilter === "overdue") return tasks.filter(task => getTaskStatus(task).label === "Overdue");
    if (clientFilter === "completed") return tasks.filter(task => task.status === "completed");
    if (clientFilter === "open") return tasks.filter(task => task.status !== "completed");
    return tasks;
  };

  const filterMyTasks = (tasks) => {
    if (myTaskFilter === "all") return tasks;
    if (myTaskFilter === "today") return tasks.filter(task => getTaskStatus(task).label === "Due Today");
    if (myTaskFilter === "overdue") return tasks.filter(task => getTaskStatus(task).label === "Overdue");
    if (myTaskFilter === "completed") return tasks.filter(task => task.status === "completed");
    if (myTaskFilter === "open") return tasks.filter(task => task.status !== "completed");
    return tasks;
  };

  const filterGroupTasks = (tasks) => {
    if (groupTaskFilter === "all") return tasks;
    if (groupTaskFilter === "today") return tasks.filter(task => getTaskStatus(task).label === "Due Today");
    if (groupTaskFilter === "overdue") return tasks.filter(task => getTaskStatus(task).label === "Overdue");
    if (groupTaskFilter === "completed") return tasks.filter(task => task.status === "completed");
    if (groupTaskFilter === "open") return tasks.filter(task => task.status !== "completed");
    return tasks;
  };

  // Tab-specific stats calculators
  const getClientTaskStats = () => {
    return {
      totalTasks: clientTasks.length,
      totalCompleted: clientTasks.filter(task => task.status === "completed").length,
      overdueTasks: clientTasks.filter(task => getTaskStatus(task).label === "Overdue").length
    };
  };

  const getMyTaskStats = () => {
    return {
      totalTasks: personalTasks.length,
      totalCompleted: personalTasks.filter(task => task.status === "completed").length,
      overdueTasks: personalTasks.filter(task => getTaskStatus(task).label === "Overdue").length
    };
  };

  const getGroupTaskStats = () => {
    return {
      totalTasks: groupTasks.length,
      totalCompleted: groupTasks.filter(task => task.status === "completed").length,
      overdueTasks: groupTasks.filter(task => getTaskStatus(task).label === "Overdue").length
    };
  };

  // Always show combined KPI stats from all task types
  const kpiStats = useMemo(() => {
    // Calculate combined stats from all task types
    const allTasks = [...personalTasks, ...clientTasks, ...groupTasks];
    
    return {
      totalTasks: allTasks.length,
      totalCompleted: allTasks.filter(task => task.status === "completed").length,
      overdueTasks: allTasks.filter(task => getTaskStatus(task).label === "Overdue").length
    };
  }, [personalTasks, clientTasks, groupTasks]);

  // Generate real chart data based on actual tasks
  const generateChartData = (tasks) => {
    const today = new Date();
    const months = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push({
        month: monthName,
        completed: 0,
        pending: 0,
        overdue: 0
      });
    }

    // Count tasks by month and status
    tasks.forEach(task => {
      if (!task.createdAt) return;
      
      const taskDate = new Date(task.createdAt);
      const monthIndex = months.findIndex(m => {
        const monthDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
        const chartMonthDate = new Date(today.getFullYear(), today.getMonth() - (5 - months.indexOf(m)), 1);
        return monthDate.getTime() === chartMonthDate.getTime();
      });
      
      if (monthIndex === -1) return;
      
      const taskStatus = getTaskStatus(task);
      
      if (task.status === 'completed') {
        months[monthIndex].completed++;
      } else if (taskStatus.label === 'Overdue') {
        months[monthIndex].overdue++;
      } else {
        months[monthIndex].pending++;
      }
    });

    return months;
  };

  // Dynamic chart data based on active tab using real data
  const getChartData = () => {
    let chartData;
    switch (activeTab) {
      case 'client-tasks':
        chartData = generateChartData(clientTasks);
        break;
      case 'my-tasks':
        chartData = generateChartData(personalTasks);
        break;
      case 'group-tasks':
        chartData = generateChartData(groupTasks);
        break;
      default:
        // Overall combined data
        chartData = generateChartData([...personalTasks, ...clientTasks, ...groupTasks]);
        break;
    }
    
    console.log(`📊 Chart data for ${activeTab}:`, chartData);
    return chartData;
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

  const handleTaskStatusChange = async (taskId, currentStatus) => {
    try {
      console.log('🔄 Updating task status:', { taskId, currentStatus });
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      console.log('📝 New status will be:', newStatus);
      
      await updateTaskStatus(taskId, newStatus);
      console.log('✅ Task status updated successfully');
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      // You could add a toast notification here to show the error to the user
    }
  };

  const filteredClientTasks = useMemo(() => {
    let tasks = filterClientTasks(clientTasks);
    if (searchTerm) {
      tasks = tasks.filter(task => 
        (task.clientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tasks;
  }, [clientTasks, clientFilter, searchTerm]);

  const filteredMyTasks = useMemo(() => {
    let tasks = filterMyTasks(personalTasks);
    if (searchTerm) {
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tasks;
  }, [personalTasks, myTaskFilter, searchTerm]);

  const filteredGroupTasks = useMemo(() => {
    let tasks = filterGroupTasks(groupTasks);
    if (searchTerm) {
      tasks = tasks.filter(task => 
        (task.groupName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tasks;
  }, [groupTasks, groupTaskFilter, searchTerm]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader 
        title={"Tasks"} 
        subtitle={"Manage your tasks"}
      >
        <CreateTaskDialog onTaskCreated={refetchTasks} />
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
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">Loading tasks...</div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-destructive">Error loading tasks: {error}</div>
                    </div>
                  ) : filteredClientTasks.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">No client tasks found</div>
                    </div>
                  ) : (
                    filteredClientTasks.map((task) => {
                      const status = getTaskStatus(task);
                      console.log('📋 Rendering client task:', { id: task.id, title: task.title, status: task.status, completed: task.status === 'completed' });
                      
                      return (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-sm animate-fade-in"
                        >
                          <Checkbox 
                            id={`client-task-${task.id}`} 
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleTaskStatusChange(task.id, task.status)}
                            className="transition-transform hover:scale-110"
                          />
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {task.clientId ? task.clientId.slice(0, 2).toUpperCase() : 'CL'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <label 
                                htmlFor={`client-task-${task.id}`} 
                                className={`text-sm font-medium cursor-pointer transition-all ${
                                  task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                Client Task
                              </label>
                            </div>
                            <p className={`text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{formatTaskDueDate(task.dueDate)}</span>
                              <Badge variant={status.variant} className="text-xs h-4 px-1.5">
                                {status.label}
                              </Badge>
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
                    })
                  )}
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
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">Loading tasks...</div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-destructive">Error loading tasks: {error}</div>
                    </div>
                  ) : filteredMyTasks.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">No personal tasks found</div>
                    </div>
                  ) : (
                    filteredMyTasks.map((task) => {
                      const status = getTaskStatus(task);
                      console.log('📋 Rendering task:', { id: task.id, title: task.title, status: task.status, completed: task.status === 'completed' });
                      
                      return (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-sm animate-fade-in"
                        >
                          <Checkbox 
                            id={`my-task-${task.id}`} 
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleTaskStatusChange(task.id, task.status)}
                            className="transition-transform hover:scale-110"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <label 
                                htmlFor={`my-task-${task.id}`} 
                                className={`text-sm font-medium cursor-pointer transition-all ${
                                  task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {task.title}
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                              <Badge variant={status.variant} className="text-xs h-4 px-1.5">
                                {status.label}
                              </Badge>
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
                    })
                  )}
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
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">Loading tasks...</div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-destructive">Error loading tasks: {error}</div>
                    </div>
                  ) : filteredGroupTasks.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">No group tasks found</div>
                    </div>
                  ) : (
                    filteredGroupTasks.map((task) => {
                      const status = getTaskStatus(task);
                      console.log('📋 Rendering group task:', { id: task.id, title: task.title, status: task.status, completed: task.status === 'completed' });
                      
                      return (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-sm animate-fade-in"
                        >
                          <Checkbox 
                            id={`group-task-${task.id}`} 
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleTaskStatusChange(task.id, task.status)}
                            className="transition-transform hover:scale-110"
                          />
                          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                            <UsersRound className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <label 
                                htmlFor={`group-task-${task.id}`} 
                                className={`text-sm font-medium cursor-pointer transition-all ${
                                  task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                Group Task
                              </label>
                            </div>
                            <p className={`text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                              <Badge variant={status.variant} className="text-xs h-4 px-1.5">
                                {status.label}
                              </Badge>
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
                    })
                  )}
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
