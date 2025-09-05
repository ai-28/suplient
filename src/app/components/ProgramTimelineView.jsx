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
  ExternalLink
} from 'lucide-react';

export function ProgramTimelineView({ 
  program, 
  clientProgram, 
  progress, 
  onMarkComplete, 
  onPauseResume,
  onViewProgram
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    return clientProgram.progress.completedElements.includes(elementId);
  };

  const isElementCurrent = (element) => {
    return element.scheduledDay <= clientProgram.progress.currentDay;
  };

  const getElementStatus = (element) => {
    if (isElementCompleted(element.id)) return 'completed';
    if (isElementCurrent(element)) return 'current';
    return 'upcoming';
  };

  const groupedElements = program.elements.reduce((acc, element) => {
    const week = Math.ceil(element.scheduledDay / 7);
    if (!acc[week]) acc[week] = [];
    acc[week].push(element);
    return acc;
  }, {});

  const currentWeek = Math.ceil(clientProgram.progress.currentDay / 7);
  const daysActive = Math.floor((new Date().getTime() - new Date(clientProgram.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const daysBehindAhead = daysActive - clientProgram.progress.currentDay;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        {/* Program Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{program.name}</h3>
              <Badge variant={clientProgram.status === 'active' ? 'default' : 'secondary'}>
                {clientProgram.status}
              </Badge>
              {daysBehindAhead > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {daysBehindAhead} days behind
                </Badge>
              )}
              {daysBehindAhead < 0 && (
                <Badge variant="secondary" className="text-xs">
                  {Math.abs(daysBehindAhead)} days ahead
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{Math.round(progress.completionRate)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{currentWeek}</div>
            <div className="text-xs text-muted-foreground">of {program.duration} weeks</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{progress.completedElements}</div>
            <div className="text-xs text-muted-foreground">of {progress.totalElements} tasks</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{daysActive}</div>
            <div className="text-xs text-muted-foreground">days active</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress.completionRate)}%</span>
          </div>
          <Progress value={progress.completionRate} className="h-3" />
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
                  title: clientProgram.status === 'active' ? 'Program Paused' : 'Program Resumed',
                  description: `${program.name} has been ${clientProgram.status === 'active' ? 'paused' : 'resumed'} successfully.`,
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
            {clientProgram.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLoading ? 'Updating...' : clientProgram.status === 'active' ? 'Pause' : 'Resume'}
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
                      .sort((a, b) => a.scheduledDay - b.scheduledDay)
                      .map((element) => {
                        const status = getElementStatus(element);
                        const isCompleted = isElementCompleted(element.id);
                        
                        return (
                          <div 
                            key={element.id}
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
                                  {getElementIcon(element.type)}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{element.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  Day {element.scheduledDay}
                                </Badge>
                                {element.scheduledTime && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {element.scheduledTime}
                                  </div>
                                )}
                              </div>
                              {element.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {element.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0">
                              {!isCompleted && status === 'current' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onMarkComplete(element.id)}
                                  className="text-xs"
                                >
                                  Mark Complete
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
          Started: {new Date(clientProgram.startDate).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}