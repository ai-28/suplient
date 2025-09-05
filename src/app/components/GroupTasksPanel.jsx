"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { CreateTaskDialog } from "@/app/components/CreateTaskDialog";
import { TaskCompletionModal } from "@/app/components/TaskCompletionModal";
import { 
  Plus,
  Calendar,
  Users
} from "lucide-react";

export function GroupTasksPanel({ groupId, memberCount }) {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Complete Anxiety Assessment",
      description: "Fill out the weekly anxiety tracking form",
      dueDate: "Today",
      assignedCount: memberCount,
      completedCount: 5,
      completions: [
        { memberId: 1, memberName: "John Anderson", memberInitials: "JA", completed: true, completedAt: "2024-01-14" },
        { memberId: 2, memberName: "Alice Rodriguez", memberInitials: "AR", completed: true, completedAt: "2024-01-14" },
        { memberId: 3, memberName: "Michael Thompson", memberInitials: "MT", completed: false },
        { memberId: 4, memberName: "Sarah Williams", memberInitials: "SW", completed: true, completedAt: "2024-01-13" },
        { memberId: 5, memberName: "Benjamin Lee", memberInitials: "BL", completed: true, completedAt: "2024-01-14" },
        { memberId: 6, memberName: "Emma Davis", memberInitials: "ED", completed: false },
        { memberId: 7, memberName: "Christopher Wilson", memberInitials: "CW", completed: true, completedAt: "2024-01-14" },
        { memberId: 8, memberName: "Jessica Brown", memberInitials: "JB", completed: false },
      ]
    },
    {
      id: 2,
      title: "Practice Breathing Exercise",
      description: "Complete 10-minute daily breathing practice",
      dueDate: "Tomorrow",
      assignedCount: memberCount,
      completedCount: 3,
      completions: [
        { memberId: 1, memberName: "John Anderson", memberInitials: "JA", completed: true, completedAt: "2024-01-13" },
        { memberId: 2, memberName: "Alice Rodriguez", memberInitials: "AR", completed: false },
        { memberId: 3, memberName: "Michael Thompson", memberInitials: "MT", completed: false },
        { memberId: 4, memberName: "Sarah Williams", memberInitials: "SW", completed: true, completedAt: "2024-01-14" },
        { memberId: 5, memberName: "Benjamin Lee", memberInitials: "BL", completed: false },
        { memberId: 6, memberName: "Emma Davis", memberInitials: "ED", completed: false },
        { memberId: 7, memberName: "Christopher Wilson", memberInitials: "CW", completed: true, completedAt: "2024-01-13" },
        { memberId: 8, memberName: "Jessica Brown", memberInitials: "JB", completed: false },
      ]
    },
    {
      id: 3,
      title: "Read Chapter 3",
      description: "Review coping strategies material",
      dueDate: "June 5",
      assignedCount: memberCount,
      completedCount: 2,
      completions: [
        { memberId: 1, memberName: "John Anderson", memberInitials: "JA", completed: false },
        { memberId: 2, memberName: "Alice Rodriguez", memberInitials: "AR", completed: true, completedAt: "2024-01-12" },
        { memberId: 3, memberName: "Michael Thompson", memberInitials: "MT", completed: false },
        { memberId: 4, memberName: "Sarah Williams", memberInitials: "SW", completed: true, completedAt: "2024-01-13" },
        { memberId: 5, memberName: "Benjamin Lee", memberInitials: "BL", completed: false },
        { memberId: 6, memberName: "Emma Davis", memberInitials: "ED", completed: false },
        { memberId: 7, memberName: "Christopher Wilson", memberInitials: "CW", completed: false },
        { memberId: 8, memberName: "Jessica Brown", memberInitials: "JB", completed: false },
      ]
    }
  ]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleTaskCreated = (taskData) => {
    const newTask = {
      id: Date.now(),
      title: taskData.title,
      description: taskData.description || "",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString() : "No due date",
      assignedCount: memberCount,
      completedCount: 0,
      completions: []
    };
    
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  return (
    <>
      <Card className="shadow-soft border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-sm">Group Tasks</CardTitle>
            <CreateTaskDialog 
              mode="group" 
              groupId={groupId}
              memberCount={memberCount}
              onTaskCreated={handleTaskCreated}
            >
              <Button 
                size="sm" 
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </CreateTaskDialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm text-foreground font-medium">{task.title}</h4>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{task.dueDate}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {task.completedCount}/{task.assignedCount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all" 
                        style={{ width: `${(task.completedCount / task.assignedCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <TaskCompletionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={selectedTask}
      />
    </>
  );
}
