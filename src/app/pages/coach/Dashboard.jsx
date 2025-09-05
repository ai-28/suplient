"use client"
  
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { PageHeader } from "@/app/components/PageHeader";
import { useRouter } from "next/navigation";
import { 
  Users, 
  TrendingUp, 
  CheckCircle,
  BarChart3
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

  const activities = [
    { name: "John", action: "completedTask", time: `5 minAgo`, type: "success" },
    { name: "Louis", action: "got5DaysStreak", time: `2 hoursAgo`, type: "achievement" },
    { name: "Bob", action: "loggedInAfter2Weeks", time: `1 dayAgo`, type: "login" }
  ];

  const tasks = [
    { id: 1, text: "Call Henry - Ask about work progress", completed: false },
    { id: 2, text: "Invoice pending - Send reminder to client", completed: false }
  ];

  const handleViewAllTasks = () => {
    router.push('/tasks');
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
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Checkbox id={`task-${task.id}`} />
                <label htmlFor={`task-${task.id}`} className="text-sm text-foreground flex-1 cursor-pointer">
                  {task.text}
                </label>
              </div>
            ))}
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">• {"Todays Tasks"}</span>
                <Badge variant="secondary" className="bg-primary text-primary-foreground">2</Badge>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-foreground">• {"Overdue Tasks"}</span>
                <Badge variant="secondary" className="bg-accent text-accent-foreground">8</Badge>
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
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-foreground font-medium">{"Active Clients"}</span>
              <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">64</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-foreground font-medium">{"New Clients Month"}</span>
              <Badge className="bg-accent text-accent-foreground text-lg px-3 py-1">35</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-foreground font-medium">{"Churned Clients Month"}</span>
              <Badge className="bg-secondary text-secondary-foreground text-lg px-3 py-1">4</Badge>
            </div>
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
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {activity.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.name}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <div className="flex-shrink-0">
                  {activity.type === 'success' && <CheckCircle className="h-4 w-4 text-primary" />}
                  {activity.type === 'achievement' && <TrendingUp className="h-4 w-4 text-accent" />}
                  {activity.type === 'login' && <Users className="h-4 w-4 text-secondary" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}