"use client"

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { CalendarIcon, Plus, User, Users, X, Search } from "lucide-react";
import { useClients } from "@/app/hooks/useClients";
import { useGroupsForTasks } from "@/app/hooks/useGroupsForTasks";

import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  assignedTo: z.string().optional(),
  selectedClients: z.array(z.string()).optional(),
  selectedGroup: z.string().optional(),
  isRepetitive: z.boolean().optional(),
  repetitiveFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  repetitiveCount: z.number().min(1).max(50).optional(),
}).refine((data) => {
  // If not repetitive, due date is required
  if (!data.isRepetitive && !data.dueDate) {
    return false;
  }
  return true;
}, {
  message: "Due date is required for one-time tasks",
  path: ["dueDate"],
});


export function CreateTaskDialog({ 
  children, 
  onTaskCreated,
  clientId,
  clientName,
  hideGroupTasks = false,
  mode = null,
  groupId = null,
  memberCount = 0
  }) {
  const [open, setOpen] = useState(false);
  
  // Fetch real data from database
  const { availableClients, loading: clientsLoading, error: clientsError } = useClients();
  const { groups, loading: groupsLoading, error: groupsError } = useGroupsForTasks();
  const [taskType, setTaskType] = useState(
    mode === "group" ? "group" : 
    clientId ? "client" : "personal"
  );
  const [selectedClients, setSelectedClients] = useState(clientId ? [clientId] : []);
  const [selectedGroup, setSelectedGroup] = useState(
    mode === "group" && groupId ? { id: groupId, memberCount } : null
  );
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const popoverContentRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "",
      selectedClients: clientId ? [clientId] : [],
      selectedGroup: mode === "group" && groupId ? groupId : "",
      isRepetitive: false,
      repetitiveFrequency: "weekly",
      repetitiveCount: 1,
    },
  });

  const watchIsRepetitive = form.watch("isRepetitive");
  const watchRepetitiveFrequency = form.watch("repetitiveFrequency");

  const getNextDueDate = () => {
    const today = new Date();
    switch (watchRepetitiveFrequency) {
      case "daily":
        return addDays(today, 1);
      case "weekly":
        return addWeeks(today, 1);
      case "monthly":
        return addMonths(today, 1);
      default:
        return addWeeks(today, 1);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Add task type and selected group/client info to the data
      const taskData = {
        ...data,
        taskType,
        selectedGroup: selectedGroup ? {
          id: selectedGroup.id,
          name: selectedGroup.name,
          memberCount: selectedGroup.memberCount
        } : null,
        selectedClients: selectedClients.length > 0 ? selectedClients : (clientId ? [clientId] : null)
      };

      console.log('Creating task with data:', taskData);
      console.log('Selected clients state:', selectedClients);

      // Send to backend API - use group tasks API when in group mode
      const apiUrl = mode === "group" && groupId 
        ? `/api/groups/${groupId}/tasks`
        : '/api/tasks';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const result = await response.json();
    
    // Handle different response formats
    if (onTaskCreated) {
      if (mode === "group" && result.task) {
        // Group tasks API returns { task: {...} }
        onTaskCreated(result.task);
      } else if (result.tasks && result.tasks.length > 0) {
        // Regular tasks API returns { tasks: [...] }
        onTaskCreated(result.tasks[0]);
      }
    }
    
    setOpen(false);
    form.reset();
    } catch (error) {
      console.error('Error creating task:', error);
      // You might want to show a toast notification here
      alert('Failed to create task: ' + error.message);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      form.reset();
      // Only reset selectedClients if not in client context
      if (!clientId) {
        setSelectedClients([]);
      } else {
        setSelectedClients([clientId]);
      }
      setSelectedGroup(null);
      setClientSearchQuery("");
      setGroupSearchQuery("");
    }
    setOpen(newOpen);
  };

  const filteredClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) &&
    !selectedClients.includes(client.id)
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) &&
    (!selectedGroup || selectedGroup.id !== group.id)
  );

  const handleClientSelect = (clientId) => {
    console.log('🔍 Selecting client:', clientId, 'Current selected:', selectedClients);
    if (!selectedClients.includes(clientId)) {
      const newSelectedClients = [...selectedClients, clientId];
      console.log('✅ Adding client to selection:', newSelectedClients);
      setSelectedClients(newSelectedClients);
      form.setValue("selectedClients", newSelectedClients);
      // Clear search query after selection for better UX
      setClientSearchQuery("");
    } else {
      console.log('⚠️ Client already selected:', clientId);
    }
    // Don't close popover automatically - let user select multiple clients
    // Popover will close when clicking outside or pressing Escape
  };

  const handleClientRemove = (clientId) => {
    const newSelectedClients = selectedClients.filter(id => id !== clientId);
    setSelectedClients(newSelectedClients);
    form.setValue("selectedClients", newSelectedClients);
  };

  const handleGroupSelect = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setSelectedGroup(group);
      form.setValue("selectedGroup", groupId);
      // Clear search query after selection
      setGroupSearchQuery("");
    }
    // Don't close popover automatically - but for groups we only select one, so close it
    setGroupSearchOpen(false);
  };

  const handleGroupRemove = () => {
    setSelectedGroup(null);
    form.setValue("selectedGroup", "");
  };

  const getClientName = (clientId) => {
    const found = availableClients.find(client => client.id === clientId);
    return found ? found.name : "";
  };

  // Create a reusable form field component to avoid duplication
  const renderFormFields = () => (
    <>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Task Title
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter task title..." 
                        className="bg-background border-border focus:border-primary"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add task description..." 
                        className="bg-background border-border focus:border-primary min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRepetitive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Repetitive Task
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Automatically create future tasks when this one is completed or becomes overdue
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {watchIsRepetitive && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  <FormField
                    control={form.control}
                    name="repetitiveFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Frequency
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="repetitiveCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Number of Repetitions
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            max="50"
                            placeholder="Enter number of repetitions..." 
                            className="bg-background border-border focus:border-primary"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          How many times should this task be repeated? (1-50)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-foreground font-medium">Next Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(getNextDueDate(), "PPP")}
                    </p>
                  </div>
                </div>
              )}

              {!watchIsRepetitive && (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Due Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal bg-background border-border hover:bg-muted",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
    </>
  );

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children || (
            <Button className="bg-gradient-primary text-[#1A2D4D] shadow-medium hover:shadow-strong transition-all"
            variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
            Create New Task
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Task Type Selection - hide when in client context or group mode */}
            {!hideGroupTasks && mode !== "group" && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Task Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={taskType === "personal" ? "default" : "outline"}
                    onClick={() => setTaskType("personal")}
                    className="justify-start"
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Tasks
                  </Button>
                  <Button 
                    type="button" 
                    variant={taskType === "client" ? "default" : "outline"}
                    onClick={() => setTaskType("client")}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Client Task
                  </Button>
                  <Button 
                    type="button"
                    variant={taskType === "group" ? "default" : "outline"}
                    onClick={() => setTaskType("group")}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Group Task
                  </Button>
                </div>
              </div>
            )}

            {/* Client Selection - only show for client tasks and when not in client context */}
            {taskType === "client" && !hideGroupTasks && (
                <FormField
                  control={form.control}
                  name="selectedClients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Assign to Clients
                      </FormLabel>
                      <div className="space-y-2">
                        {selectedClients.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedClients.map((clientId) => (
                              <Badge 
                                key={clientId} 
                                variant="secondary" 
                                className="flex items-center gap-1"
                              >
                                {getClientName(clientId)}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => handleClientRemove(clientId)}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Popover 
                          open={clientSearchOpen} 
                          onOpenChange={setClientSearchOpen}
                          modal={false}
                        >
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              role="combobox"
                              aria-expanded={clientSearchOpen}
                              className="w-full justify-between bg-background border-border hover:bg-muted"
                            >
                              <div className="flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                {selectedClients.length === 0 
                                  ? "Search and select clients..." 
                                  : `${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''} selected`
                                }
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            ref={popoverContentRef}
                            className="w-[400px] p-0 z-[60] pointer-events-auto"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onPointerDownOutside={(e) => {
                              // Check if the click is actually inside our popover content
                              if (popoverContentRef.current && popoverContentRef.current.contains(e.target)) {
                                // Click is inside popover, don't close
                                e.preventDefault();
                                return;
                              }
                              // Check if clicking inside the dialog (but outside popover)
                              const target = e.target;
                              const dialog = document.querySelector('[role="dialog"]');
                              const isTrigger = target.closest && target.closest('button[role="combobox"]');
                              if (dialog && dialog.contains(target) && !isTrigger) {
                                // Keep popover open when clicking elsewhere in dialog
                                e.preventDefault();
                              }
                            }}
                            onEscapeKeyDown={() => {
                              setClientSearchOpen(false);
                            }}
                          >
                            <div className="p-3 space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search clients..."
                                  value={clientSearchQuery}
                                  onChange={(e) => {
                                    setClientSearchQuery(e.target.value);
                                  }}
                                  className="pl-9"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto space-y-1">
                                {clientsLoading ? (
                                  <div className="text-sm text-muted-foreground p-2 text-center">
                                    Loading clients...
                                  </div>
                                ) : clientsError ? (
                                  <div className="text-sm text-destructive p-2 text-center">
                                    Error loading clients: {clientsError}
                                  </div>
                                ) : filteredClients.length === 0 ? (
                                  <div className="text-sm text-muted-foreground p-2 text-center">
                                    No clients found
                                  </div>
                                ) : (
                                  filteredClients.map((client) => (
                                    <div
                                      key={client.id}
                                      className="w-full text-left cursor-pointer hover:bg-muted rounded-md p-2 transition-colors flex items-center gap-3 select-none"
                                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                                      onPointerDown={(e) => {
                                        console.log('📌 PointerDown event fired for:', client.id, client.name, e);
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleClientSelect(client.id);
                                      }}
                                      onMouseDown={(e) => {
                                        console.log('🖱️ MouseDown event fired for:', client.id, client.name, e);
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleClientSelect(client.id);
                                      }}
                                      onClick={(e) => {
                                        console.log('👆 Click event fired for:', client.id, client.name, e);
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleClientSelect(client.id);
                                      }}
                                    >
                                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                                        {client.initials}
                                      </div>
                                      <span className="flex-1">{client.name}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You can select multiple clients for the same task
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {/* Show selected client when in client context */}
            {hideGroupTasks && clientId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Assign to Client
                </label>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {clientName ? clientName.split(' ').map(n => n[0]).join('').toUpperCase() : 'C'}
                  </div>
                  <span className="font-medium">{clientName || 'Selected Client'}</span>
                </div>
              </div>
            )}

            {/* Group Selection - only show for group tasks */}
            {taskType === "group" && (
                <FormField
                  control={form.control}
                name="selectedGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                      {mode === "group" ? "Selected Group" : "Select Group"}
                      </FormLabel>
                    <div className="space-y-2">
                      {selectedGroup && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {selectedGroup.avatar || 'G'}
                      </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{selectedGroup.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedGroup.memberCount} members</p>
                          </div>
                          {mode !== "group" && (
                            <X 
                              className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" 
                              onClick={handleGroupRemove}
                            />
                          )}
                  </div>
                )}
                      {mode !== "group" && (
                        <Popover 
                          open={groupSearchOpen} 
                          onOpenChange={setGroupSearchOpen}
                          modal={false}
                        >
                          <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                            role="combobox"
                            aria-expanded={groupSearchOpen}
                            className="w-full justify-between bg-background border-border hover:bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              {!selectedGroup 
                                ? "Search and select a group..." 
                                : selectedGroup.name
                              }
                            </div>
                              </Button>
                          </PopoverTrigger>
                        <PopoverContent 
                          className="w-[400px] p-0 z-[60] pointer-events-auto"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                          onPointerDownOutside={(e) => {
                            // Check if the click is actually inside our popover content
                            const target = e.target;
                            const dialog = document.querySelector('[role="dialog"]');
                            const isTrigger = target.closest && target.closest('button[role="combobox"]');
                            if (dialog && dialog.contains(target) && !isTrigger) {
                              // Keep popover open when clicking elsewhere in dialog
                              e.preventDefault();
                            }
                          }}
                          onEscapeKeyDown={() => {
                            setGroupSearchOpen(false);
                          }}
                        >
                          <div className="p-3 space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                                placeholder="Search groups..."
                                value={groupSearchQuery}
                                onChange={(e) => setGroupSearchQuery(e.target.value)}
                                className="pl-9"
                              />
                      </div>
                            <div className="max-h-[200px] overflow-y-auto space-y-1">
                              {groupsLoading ? (
                                <div className="text-sm text-muted-foreground p-2 text-center">
                                  Loading groups...
                                </div>
                              ) : groupsError ? (
                                <div className="text-sm text-destructive p-2 text-center">
                                  Error loading groups: {groupsError}
                                </div>
                              ) : filteredGroups.length === 0 ? (
                                <div className="text-sm text-muted-foreground p-2 text-center">
                                  No groups found
                                </div>
                              ) : (
                                filteredGroups.map((group) => (
                                  <div
                                    key={group.id}
                                    className="w-full text-left cursor-pointer hover:bg-muted rounded-md p-3 transition-colors flex items-center gap-3 select-none"
                                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleGroupSelect(group.id);
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleGroupSelect(group.id);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleGroupSelect(group.id);
                                    }}
                                  >
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                                      {group.avatar}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{group.name}</p>
                                      <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mode === "group" 
                        ? "This task will be assigned to all group members" 
                        : "Select a group to assign this task to all group members"
                      }
                    </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

            {/* Common form fields */}
            {renderFormFields()}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="border-border hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-primary text-[#1A2D4D] shadow-medium hover:shadow-strong transition-all"
                >
                  Create Task
                </Button>
              </div>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
