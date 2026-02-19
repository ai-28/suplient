"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Calendar, Clock } from "lucide-react";
import { useTranslation } from "@/app/context/LanguageContext";

// Helper: Get task status for display
const getTaskStatus = (task, t) => {
  if (task.completed || task.status === 'completed') {
    return { label: t('common.status.completed', 'Completed'), variant: 'success' };
  }
  
  if (!task.dueDate) {
    return { label: t('tasks.noDueDate', 'No due date'), variant: 'secondary' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate < today) {
    return { label: t('tasks.overdue', 'Overdue'), variant: 'destructive' };
  }
  if (dueDate.toDateString() === today.toDateString()) {
    return { label: t('tasks.dueToday', 'Due Today'), variant: 'default' };
  }
  return { label: t('tasks.upcoming', 'Upcoming'), variant: 'secondary' };
};

// Helper: Parse UTC timestamp correctly
const parseAsUTC = (input) => {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.endsWith('Z') || trimmed.match(/[+-]\d{2}:?\d{2}$/)) {
      return new Date(trimmed);
    }
    const normalized = trimmed.replace(/\s+/, 'T');
    return new Date(normalized + 'Z');
  }
  return new Date(input);
};

export function TaskDetailModal({ open, onOpenChange, task, onToggleComplete, showCheckbox = true }) {
  const t = useTranslation();

  if (!task) return null;

  const status = getTaskStatus(task, t);
  const dueDate = task.dueDate ? parseAsUTC(task.dueDate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold pr-4">{task.title || task.task || t('tasks.untitledTask', 'Untitled Task')}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('tasks.taskDetails', 'View task details for')} {task.title || task.task || t('tasks.untitledTask', 'Untitled Task')}
              </DialogDescription>
            </div>
            {showCheckbox && onToggleComplete && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Checkbox 
                  checked={task.completed || task.status === 'completed'}
                  onCheckedChange={onToggleComplete}
                  id="task-complete-checkbox"
                />
                <label 
                  htmlFor="task-complete-checkbox" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {t('tasks.markAsCompleted', 'Mark as completed')}
                </label>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
          {/* Task Description */}
          {task.description && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">{t('tasks.description', 'Description')}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {task.description}
              </p>
            </div>
          )}

          {/* Task Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {dueDate 
                  ? t('tasks.dueDate', 'Due date') + ': ' + dueDate.toLocaleDateString()
                  : t('tasks.noDueDate', 'No due date')
                }
              </span>
            </div>

            {task.scheduledTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('tasks.scheduledTime', 'Scheduled time')}: {task.scheduledTime}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
