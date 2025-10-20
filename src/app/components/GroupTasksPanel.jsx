"use client"
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { CreateTaskDialog } from "@/app/components/CreateTaskDialog";
import { TaskCompletionModal } from "@/app/components/TaskCompletionModal";
import { 
  Plus,
  Calendar,
  Users,
  Loader2
} from "lucide-react";

export function GroupTasksPanel({ groupId, memberCount }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch group tasks
  const fetchGroupTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/groups/${groupId}/tasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch group tasks');
      }
      
      const result = await response.json();
      setTasks(result.tasks || []);
    } catch (err) {
      console.error('Error fetching group tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks on component mount
  useEffect(() => {
    if (groupId) {
      fetchGroupTasks();
    }
  }, [groupId]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleTaskCreated = (taskData) => {
    // Refresh the tasks list to get the real data from the database
    fetchGroupTasks();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  return (
    <>
      <Card className="shadow-soft border-border bg-card h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
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
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading tasks...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <p className="text-sm text-destructive mb-2">Error: {error}</p>
                  <Button size="sm" variant="outline" onClick={fetchGroupTasks}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
                </div>
              </div>
            ) : (
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
            )}
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
