"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Target, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/app/components/ui/carousel";
import { useState } from "react";

export function GoalAnalyticsChart({ 
  data, 
  historicalData = [],
  title,
  description,
  onTimePeriodChange
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  
  // Demo data if no data is provided
  const demoData = [
    { id: 1, name: "Daily Meditation", value: 4, color: "#3b82f6", icon: "🧘" },
    { id: 2, name: "Exercise Routine", value: 3, color: "#10b981", icon: "💪" },
    { id: 3, name: "Reading Habit", value: 5, color: "#8b5cf6", icon: "📚" },
    { id: 4, name: "Water Intake", value: 2, color: "#06b6d4", icon: "💧" }
  ];

  // Demo historical data for line chart
  const demoHistoricalData = [
    { date: "2024-01-15", goalScores: { 1: 4, 2: 3, 3: 5, 4: 2 } },
    { date: "2024-01-14", goalScores: { 1: 5, 2: 4, 3: 4, 4: 3 } },
    { date: "2024-01-13", goalScores: { 1: 3, 2: 2, 3: 5, 4: 1 } },
    { date: "2024-01-12", goalScores: { 1: 4, 2: 5, 3: 3, 4: 4 } },
    { date: "2024-01-11", goalScores: { 1: 5, 2: 4, 3: 5, 4: 3 } },
    { date: "2024-01-10", goalScores: { 1: 2, 2: 3, 3: 4, 4: 2 } },
    { date: "2024-01-09", goalScores: { 1: 4, 2: 4, 3: 5, 4: 1 } }
  ];

  // Use demo data if no data is provided
  const chartData = (data.length > 0 ? data : demoData).map((item, index) => ({
    name: item.name,
    value: Math.max(item.value, 0.5), // Minimum value to ensure visibility
    originalValue: item.value,
    color: item.color,
    icon: item.icon
  }));

  // Calculate total for percentage display
  const totalValue = (data.length > 0 ? data : demoData).reduce((sum, item) => sum + item.value, 0);
  const averageScore = (data.length > 0 ? data : demoData).length > 0 ? totalValue / (data.length > 0 ? data : demoData).length : 0;

  const handleTimePeriodChange = (period) => {
    setSelectedPeriod(period);
    onTimePeriodChange?.(period);
  };

  // Transform historical data for line chart - use real goal scores (1-5)
  const lineChartData = (historicalData.length > 0 ? historicalData : demoHistoricalData).map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...(data.length > 0 ? data : demoData).reduce((acc, goal) => {
      // Use actual goal scores from the daily entry
      acc[goal.name] = entry.goalScores[goal.id] || 0;
      return acc;
    }, {})
  }));

  // Empty state - only show if no goals exist at all
  if ((data.length === 0 && demoData.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
            <p className="text-muted-foreground">
              Set up some goals to see your progress visualization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CircleView = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Circle View</h3>
        <p className="text-sm text-muted-foreground">Today's goal distribution</p>
      </div>
      
      {/* Simple Pie Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background concentric guides */}
            <defs>
              <pattern id="grid" patternUnits="userSpaceOnUse" width="100" height="100">
                <circle cx="50" cy="50" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2"/>
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.1"/>
              </pattern>
            </defs>
            
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={0}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Time period buttons */}
      <div className="flex justify-center gap-1.5">
        <Button 
          key="today"
          variant={selectedPeriod === 'today' ? "secondary" : "outline"} 
          size="sm"
          onClick={() => handleTimePeriodChange('today')}
          className="text-xs px-3 py-1"
        >
          Today
        </Button>
        <Button 
          key="week"
          variant={selectedPeriod === 'week' ? "secondary" : "outline"} 
          size="sm"
          onClick={() => handleTimePeriodChange('week')}
          className="text-xs px-3 py-1"
        >
          Week
        </Button>
        <Button 
          key="month"
          variant={selectedPeriod === 'month' ? "secondary" : "outline"} 
          size="sm"
          onClick={() => handleTimePeriodChange('month')}
          className="text-xs px-3 py-1"
        >
          Month
        </Button>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-1.5">
        {demoData.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs">{item.icon}</span>
            <span className="text-xs font-medium truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">{item.value}/5</span>
          </div>
        ))}
      </div>
    </div>
  );

  const LineGraphView = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Line Graph View</h3>
        <p className="text-sm text-muted-foreground">Progress trends over time</p>
      </div>
      
      {/* Line Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineChartData}>
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={[1, 5]}
              label={{ value: 'Rating (1-5)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />
            <Legend />
            {(data.length > 0 ? data : demoData).map((goal, index) => (
              <Line
                key={`${goal.name}-${index}`}
                type="monotone"
                dataKey={goal.name}
                stroke={goal.color}
                strokeWidth={2}
                dot={{ fill: goal.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: goal.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time period buttons */}
      <div className="flex justify-center gap-1.5">
        <Button 
          variant={selectedPeriod === 'today' ? "secondary" : "outline"} 
          size="sm"
          onClick={() => handleTimePeriodChange('today')}
          className="text-xs px-3 py-1"
        >
          Today
        </Button>
        <Button 
          variant={selectedPeriod === 'week' ? "secondary" : "outline"} 
          size="sm"
          onClick={() => handleTimePeriodChange('week')}
          className="text-xs px-3 py-1"
        >
          Week
        </Button>
        <Button 
          variant={selectedPeriod === 'month' ? "secondary" : "outline"} 
          size="sm"
          onClick={() => handleTimePeriodChange('month')}
          className="text-xs px-3 py-1"
        >
          Month
        </Button>
      </div>

      {/* Goal Legend */}
      <div className="grid grid-cols-2 gap-1.5">
        {(data.length > 0 ? data : demoData).map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-0.5" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs">{item.icon}</span>
            <span className="text-xs font-medium truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              <CarouselItem key="circle-view">
                <CircleView />
              </CarouselItem>
              <CarouselItem key="line-graph-view">
                <LineGraphView />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="absolute top-8 left-4 z-10" />
            <CarouselNext className="absolute top-8 right-4 z-10" />
          </Carousel>
        </div>
      </CardContent>
    </Card>
  );
}
