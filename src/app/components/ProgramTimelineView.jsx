"use client"

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Clock, 
  FileText, 
  MessageSquare, 
  Target,
  Calendar,
  Pause,
  Play,
  ExternalLink,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import ClientTasks from '../pages/client/Tasks';

export function ProgramTimelineView({ 
  clientProgram, 
  progress, 
  onMarkComplete, 
  onPauseResume,
  onViewProgram,
  onRestart
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completingElementId, setCompletingElementId] = useState(null);

  const getElementIcon = (type) => {
    switch (type) {
      case 'content': return <FileText className="h-4 w-4" />;
      case 'task': return <Target className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'checkin': return <Circle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };
  
  const isElementCompleted = (elementId) => {
    const completedElements = progress?.completedElementsArray;
    console.log("completedElements", completedElements)
    return Array.isArray(completedElements) && completedElements.includes(elementId);
  };

  const isElementCurrent = (element) => {
    // Calculate scheduled day from week and day
    const scheduledDay = (element.week - 1) * 7 + element.day;
    return scheduledDay <= progress?.currentDay;
  };

  const getElementStatus = (element) => {
    if (isElementCompleted(element?.id)) return 'completed';
    console.log("element", element)
    if (isElementCurrent(element)) return 'current';
    return 'upcoming';
  };

  const handleMarkComplete = async (elementId) => {
    setCompletingElementId(elementId);
    try {
      await onMarkComplete(elementId);
    } finally {
      setCompletingElementId(null);
    }
  };

  const groupedElements = clientProgram?.elements.reduce((acc, element) => {
    const week = element.week;
    if (!acc[week]) acc[week] = [];
    acc[week].push(element);
    return acc;
  }, {});
  const currentWeek = Math.ceil(progress?.currentDay / 7);
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        {/* Program Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{clientProgram?.name}</h3>
              <Badge variant={clientProgram?.status === 'active' ? 'default' : 'secondary'}>
                {clientProgram?.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{clientProgram?.description}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className={`text-center p-3 rounded-lg ${progress?.completionRate >= 100 ? 'bg-green-100' : 'bg-muted/50'}`}>
            <div className={`text-2xl font-bold ${progress?.completionRate >= 100 ? 'text-green-600' : 'text-primary'}`}>
              {Math.round(progress?.completionRate)}%
            </div>
            <div className={`text-xs ${progress?.completionRate >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
              {progress?.completionRate >= 100 ? '🎉 Complete!' : 'Complete'}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{currentWeek}</div>
            <div className="text-xs text-muted-foreground">of {clientProgram?.duration} weeks</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{Array.isArray(progress?.completedElementsArray) ? progress.completedElementsArray.length : 0}</div>
            <div className="text-xs text-muted-foreground">of {progress?.totalElements} tasks</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{progress?.currentDay}</div>
            <div className="text-xs text-muted-foreground">current day</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress?.completionRate)}%</span>
          </div>
          <Progress value={progress?.completionRate} className="h-3" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setIsLoading(true);
              try {
                await onPauseResume();
                toast({
                  title: clientProgram?.status === 'active' ? 'Program Paused' : 'Program Resumed',
                  description: `${clientProgram?.name} has been ${clientProgram?.status === 'active' ? 'paused' : 'resumed'} successfully.`,
                });
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to update program status. Please try again.',
                  variant: 'destructive',
                });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            {clientProgram?.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLoading ? 'Updating...' : clientProgram?.status === 'active' ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {isExpanded ? 'Hide' : 'Show'} Timeline
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewProgram}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            View Program Details
          </Button>
          {clientProgram?.status === 'completed' && onRestart && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsLoading(true);
                try {
                  await onRestart();
                  toast({
                    title: 'Program Restarted',
                    description: `${clientProgram?.name} has been restarted and is ready to begin again.`,
                  });
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to restart program. Please try again.',
                    variant: 'destructive',
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="flex items-center gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <RotateCcw className="h-4 w-4" />
              {isLoading ? 'Restarting...' : 'Restart Program'}
            </Button>
          )}
        </div>

        {/* Expandable Timeline */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            {Object.entries(groupedElements)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([week, elements]) => (
                <div key={week} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={parseInt(week) === currentWeek ? 'default' : 'outline'}>
                      Week {week}
                    </Badge>
                    {parseInt(week) === currentWeek && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    {elements
                      .sort((a, b) => a?.scheduledDay - b?.scheduledDay)
                      .map((element) => {
                        const status = getElementStatus(element);
                        const isCompleted = isElementCompleted(element.id);
                        return (
                          <div 
                            key={element?.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              status === 'completed' ? 'bg-green-50 border-green-200' :
                              status === 'current' ? 'bg-blue-50 border-blue-200' :
                              'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <div className={`p-1 rounded-full ${
                                  status === 'current' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {getElementIcon(element?.type)}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{element?.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  Day {(element?.week - 1) * 7 + element?.day}
                                </Badge>
                                {element?.scheduledTime && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {element?.scheduledTime}
                                  </div>
                                )}
                              </div>
                              {element?.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {element?.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0">
                              {!isCompleted && status === 'current' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkComplete(element?.id)}
                                  disabled={completingElementId === element?.id}
                                  className="text-xs"
                                >
                                  {completingElementId === element?.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Completing...
                                    </>
                                  ) : (
                                    'Mark Complete'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Program Start Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t">
          <Calendar className="h-4 w-4" />
          Started: {new Date(clientProgram?.startDate)?.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}