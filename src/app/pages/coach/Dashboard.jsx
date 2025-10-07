"use client"
  
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { PageHeader } from "@/app/components/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, 
  TrendingUp, 
  CheckCircle,
  BarChart3,
  Loader2
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";


const earningsData = [
  { month: "Jul", value: 45000 },
  { month: "Aug", value: 58000 },
  { month: "Sep", value: 52000 },
  { month: "Oct", value: 75000 },
  { month: "Nov", value: 88000 },
  { month: "Dec", value: 125000 },
  { month: "Jan", value: 148000 },
  { month: "Feb", value: 165000 },
  { month: "Mar", value: 220000 },
  { month: "Apr", value: 285000 },
  { month: "May", value: 350000 }
];

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskUpdating, setTaskUpdating] = useState(null);
  const [clientStats, setClientStats] = useState({
    activeClients: 0,
    newClientsThisMonth: 0,
    churnedClientsThisMonth: 0,
    totalClients: 0
  });
  
  console.log("clientStas", clientStats)
  const [clientStatsLoading, setClientStatsLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);


  // Fetch activities
  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await fetch(`/api/activities?coachId=${session?.user?.id}&limit=5`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch today's tasks when component mounts
  useEffect(() => {
    const fetchTodayTasks = async () => {
      setTasksLoading(true);
      try {
        const response = await fetch('/api/coach/tasks/today');
        
        if (!response.ok) {
          throw new Error('Failed to fetch today\'s tasks');
        }
        
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error fetching today\'s tasks:', error);
        toast.error('Failed to load today\'s tasks');
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTodayTasks();
    if (session?.user?.id) {
      fetchActivities();
    }
  }, [session?.user?.id]);

  // Fetch client statistics when component mounts
  useEffect(() => {
    const fetchClientStats = async () => {
      setClientStatsLoading(true);
      try {
        const response = await fetch('/api/coach/clients/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch client statistics');
        }
        
        const data = await response.json();
        setClientStats({
          activeClients: data.activeClients || 0,
          newClientsThisMonth: data.newClientsThisMonth || 0,
          churnedClientsThisMonth: data.churnedClientsThisMonth || 0,
          totalClients: data.totalClients || 0
        });
      } catch (error) {
        console.error('Error fetching client statistics:', error);
        toast.error('Failed to load client statistics');
        setClientStats({
          activeClients: 0,
          newClientsThisMonth: 0,
          churnedClientsThisMonth: 0,
          totalClients: 0
        });
      } finally {
        setClientStatsLoading(false);
      }
    };

    fetchClientStats();
  }, []);

  const handleViewAllTasks = () => {
    router.push('/coach/tasks');
  };

  const handleTaskCompletion = async (taskId, taskText, completed) => {
    setTaskUpdating(taskId);
    try {
      const response = await fetch('/api/coach/tasks/today', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          completed
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const result = await response.json();
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, completed, status: completed ? 'completed' : 'pending' }
            : task
        )
      );
      
      toast.success(result.message);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.message || "Failed to update task");
    } finally {
      setTaskUpdating(null);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader 
        title={"Dashboard"} 
        subtitle={"Dashboard"} 
      />

      {/* First Row - My Tasks and Client Overview */}
      <div className="grid-dashboard">
        {/* My Tasks */}
        <Card className="card-standard">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              {"My Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center p-4">
                <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tasks for today</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex items-center space-x-3 flex-1 cursor-pointer">
                        <Checkbox 
                          id={`task-${task.id}`} 
                          checked={task.completed}
                          disabled={taskUpdating === task.id}
                        />
                        <label 
                          htmlFor={`task-${task.id}`} 
                          className={`text-sm flex-1 cursor-pointer ${
                            task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {task.text}
                        </label>
                        {taskUpdating === task.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {task.completed ? 'Mark as Pending?' : 'Mark as Completed?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {task.completed 
                            ? `Are you sure you want to mark "${task.text}" as pending?`
                            : `Are you sure you want to mark "${task.text}" as completed?`
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleTaskCompletion(task.id, task.text, !task.completed)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {task.completed ? 'Mark as Pending' : 'Mark as Completed'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">• {"Today's Tasks"}</span>
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {tasksLoading ? "..." : tasks.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-foreground">• {"Completed"}</span>
                <Badge variant="secondary" className="bg-green-500 text-white">
                  {tasksLoading ? "..." : tasks.filter(t => t.completed).length}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={handleViewAllTasks}
              >
                {"View All"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Overview */}
        <Card className="card-standard">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              {"Client Overview"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientStatsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading client stats...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">{"Active Clients"}</span>
                  <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                    {clientStats.activeClients}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">{"New Clients This Month"}</span>
                  <Badge className="bg-accent text-accent-foreground text-lg px-3 py-1">
                    {clientStats.newClientsThisMonth}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">{"Churned Clients This Month"}</span>
                  <Badge className="bg-secondary text-secondary-foreground text-lg px-3 py-1">
                    {clientStats.churnedClientsThisMonth}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">{"Total Clients"}</span>
                  <Badge className="bg-muted text-muted-foreground text-lg px-3 py-1">
                    {clientStats.totalClients}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Second Row - Earnings Overview and Latest Activity */}
      <div className="grid-dashboard">
        {/* Earnings Overview */}
        <Card className="card-standard">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              {"Earnings Overview"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-medium)'
                    }}
                    formatter={(value) => [`${(value / 1000).toFixed(0)}k`, 'Earnings']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#colorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Latest Activity */}
        <Card className="card-standard">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-teal" />
                {"Latest Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activitiesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading activities...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activities</p>
                <p className="text-sm">Activities will appear here as clients engage with the platform</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {activity.type === 'signup' && <Users className="h-4 w-4" />}
                    {activity.type === 'task_completed' && <CheckCircle className="h-4 w-4" />}
                    {activity.type === 'daily_checkin' && <TrendingUp className="h-4 w-4" />}
                    {activity.type === 'session_attended' && <BarChart3 className="h-4 w-4" />}
                    {!['signup', 'task_completed', 'daily_checkin', 'session_attended'].includes(activity.type) && <TrendingUp className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </h4>
                      {activity.pointsEarned > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          +{activity.pointsEarned} pts
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}