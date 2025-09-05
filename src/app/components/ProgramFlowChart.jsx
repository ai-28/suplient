"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ChevronLeft, ChevronRight, FileText, CheckSquare, MessageSquare, ClipboardCheck, Plus, Upload } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

const ELEMENT_COLORS = {
  content: 'bg-blue-500',
  task: 'bg-green-500',
  message: 'bg-orange-500',
  checkin: 'bg-purple-500'
};

const ELEMENT_TYPES = {
  content: 'Content',
  task: 'Task',
  message: 'Message',
  checkin: 'Check-in'
};

const ELEMENT_ICONS = {
  content: FileText,
  task: CheckSquare,
  message: MessageSquare,
  checkin: ClipboardCheck
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ProgramFlowChart({ elements, duration, highlightedElementId, onElementClick, onAddElementToDay }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(1);

  // Group elements by week and day (filtered to current 4-week view)
  const weeklyData = React.useMemo(() => {
    const weeks = [];
    const currentWeekEnd = Math.min(currentWeekStart + 3, duration);
    
    for (let week = currentWeekStart; week <= currentWeekEnd; week++) {
      const weekStart = (week - 1) * 7 + 1;
      const weekEnd = week * 7;
      
      const days = [];
      for (let day = weekStart; day <= weekEnd; day++) {
        const dayElements = elements.filter(el => el.scheduledDay === day);
        const dayOfWeek = ((day - 1) % 7);
        
        days.push({
          day,
          dayOfWeek,
          dayName: DAY_NAMES[dayOfWeek],
          elements: dayElements.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
        });
      }
      
      weeks.push({
        week,
        days,
        elementCount: days.reduce((count, day) => count + day.elements.length, 0)
      });
    }
    
    return weeks;
  }, [elements, duration, currentWeekStart]);

  const totalElements = elements.length;
  const currentWeekEnd = Math.min(currentWeekStart + 3, duration);
  const currentViewElements = weeklyData.reduce((count, week) => count + week.elementCount, 0);
  
  const canGoPrevious = currentWeekStart > 1;
  const canGoNext = currentWeekEnd < duration;
  
  const handlePreviousWeeks = () => {
    setCurrentWeekStart(Math.max(1, currentWeekStart - 4));
  };
  
  const handleNextWeeks = () => {
    setCurrentWeekStart(Math.min(duration - 3, currentWeekStart + 4));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Program Flow Overview</CardTitle>
            <CardDescription>
              Weeks {currentWeekStart}-{currentWeekEnd} of {duration} • {currentViewElements} of {totalElements} elements
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {duration > 4 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePreviousWeeks}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous Month
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNextWeeks}
                  disabled={!canGoNext}
                >
                  Next Month
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-2">
          {Object.entries(ELEMENT_TYPES).map(([type, label]) => {
            const count = elements.filter(el => el.type === type).length;
            const Icon = ELEMENT_ICONS[type];
            
            return (
              <div key={type} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", ELEMENT_COLORS[type])} />
                <Icon className="w-3 h-3" />
                <span className="text-xs font-medium">{label}</span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {weeklyData.map(({ week, days, elementCount }) => (
            <div key={week} className="space-y-3">
              {/* Week Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Week {week}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {elementCount} {elementCount === 1 ? 'element' : 'elements'}
                </Badge>
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map(({ day, dayOfWeek, dayName, elements: dayElements }) => (
                  <div
                    key={day}
                    className={cn(
                      "min-h-[80px] p-2 border border-border rounded-lg bg-card relative group",
                      dayElements.length > 0 ? "border-primary/20 bg-primary/5" : "border-dashed hover:border-primary/40 hover:bg-primary/10"
                    )}
                  >
                    {/* Day Header */}
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      <div>{dayName}</div>
                      <div className="text-[10px]">Day {day}</div>
                    </div>
                    
                    {/* Add Element Button */}
                    {onAddElementToDay && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-primary/20"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onAddElementToDay(dayOfWeek + 1, week, 'content')}>
                              <Upload className="h-4 w-4 mr-2" />
                              Share File
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddElementToDay(dayOfWeek + 1, week, 'task')}>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Create Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddElementToDay(dayOfWeek + 1, week, 'message')}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    
                    {/* Elements */}
                    <div className="space-y-1">
                      {dayElements.map((element) => {
                        const Icon = ELEMENT_ICONS[element.type];
                        const isCoachTask = element.type === 'task' && element.data?.assignedTo === 'coach';
                        
                        return (
                          <div
                            key={element.id}
                            className={cn(
                              "text-xs p-1.5 rounded cursor-pointer transition-all hover:scale-105 hover:shadow-sm relative",
                              ELEMENT_COLORS[element.type],
                              "text-white",
                              highlightedElementId === element.id ? 'ring-2 ring-yellow-400 animate-pulse scale-110' : ''
                            )}
                            onClick={() => onElementClick?.(element)}
                            title={`${element.scheduledTime} - ${element.title || ELEMENT_TYPES[element.type]}${isCoachTask ? ' (Coach Task)' : ''}`}
                          >
                            <div className="flex items-center gap-1">
                              <Icon className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium text-[10px]">
                                {element.scheduledTime}
                              </span>
                              {isCoachTask && (
                                <div className="w-2 h-2 rounded-full bg-yellow-300 border border-yellow-500" title="Coach Task" />
                              )}
                            </div>
                            <div className="mt-0.5 text-[10px] leading-tight truncate">
                              {element.title || ELEMENT_TYPES[element.type]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}