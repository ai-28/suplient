"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { CalendarIcon, Plus, User, Users, X, Search } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  assignedTo: z.string().optional(),
  selectedClients: z.array(z.string()).optional(),
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

// Mock client data - in real app, this would come from API
const mockClients = [
  { id: "1", name: "John Doe", avatar: "JD" },
  { id: "2", name: "Alice Smith", avatar: "AS" },
  { id: "3", name: "Bob Dylan", avatar: "BD" },
  { id: "4", name: "Emma Wilson", avatar: "EW" },
  { id: "5", name: "Mark Johnson", avatar: "MJ" },
  { id: "sarah-johnson", name: "Sarah Johnson", avatar: "SJ" },
];



export function CreateTaskDialog({ 
  children, 
  mode = "default", 
  groupId, 
  memberCount,
  clientId,
  clientName,
  restrictToClient = false,
  hideGroupTasks = false,
  defaultTab = "personal",
  preSelectClient = false,
  onTaskCreated 
  }) {
  const [open, setOpen] = useState(false);
  const [taskType, setTaskType] = useState(
    mode === "group" ? "group" : restrictToClient ? "client" : defaultTab
  );
  const [selectedClients, setSelectedClients] = useState(
    (restrictToClient || preSelectClient) && clientId ? [clientId] : []
  );
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "",
      selectedClients: (restrictToClient || preSelectClient) && clientId ? [clientId] : [],
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

  const onSubmit = (data) => {
    // Store the task in the assigned tasks system
    if (taskType === "client" || restrictToClient) {
      const clientsToAssign = restrictToClient && clientId ? [clientId] : data.selectedClients || [];
      clientsToAssign.forEach(targetClientId => {
        console.log(data);
      });
    } else if (taskType === "group" && groupId) {
      // For group tasks, we'd need to get all group members and assign to each
      // For now, we'll just create a sample task for client_1 if they're in the group
      
    }
    
    if (onTaskCreated) {
      onTaskCreated(data);
    }
    
    const taskTypeLabel = restrictToClient ? `Task for ${clientName}` : 
                         taskType === "personal" ? "Personal task" : 
                         taskType === "client" ? "Client task" : "Group task";
    
    setOpen(false);
    form.reset();
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      form.reset();
      if (!restrictToClient && !preSelectClient) {
        setSelectedClients([]);
      }
      setClientSearchQuery("");
    } else if (newOpen && preSelectClient && clientId && !selectedClients.includes(clientId)) {
      // Ensure client is selected when dialog opens with preSelectClient
      setSelectedClients([clientId]);
      form.setValue("selectedClients", [clientId]);
    }
    setOpen(newOpen);
  };

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) &&
    !selectedClients.includes(client.id)
  );

  const handleClientSelect = (clientId) => {
    if (!selectedClients.includes(clientId)) {
      const newSelectedClients = [...selectedClients, clientId];
      setSelectedClients(newSelectedClients);
      form.setValue("selectedClients", newSelectedClients);
    }
    setClientSearchOpen(false);
  };

  const handleClientRemove = (clientId) => {
    const newSelectedClients = selectedClients.filter(id => id !== clientId);
    setSelectedClients(newSelectedClients);
    form.setValue("selectedClients", newSelectedClients);
  };

  const getClientName = (clientId) => {
    const found = mockClients.find(client => client.id === clientId);
    if (found) return found.name;
    // Fallback: if we have clientName prop and clientId matches, use it
    if (clientId === clientId && clientName) return clientName;
    return "";
  };

  // If in client-specific mode, show simplified form
  if (restrictToClient) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children || (
            <Button className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Create Task for {clientName}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all"
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

  // If in group mode, don't show tabs - go directly to group task form
  if (mode === "group") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children || (
            <Button className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Create Group Task
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Creating task for group with {memberCount} members
                </p>
              </div>

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
                        placeholder="Enter group task title..." 
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
                        placeholder="Describe what group members need to do..." 
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
                  className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all"
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

  const getTabsList = () => {
    const gridCols = hideGroupTasks ? "grid-cols-2" : "grid-cols-3";
    
    // When defaultTab is "client", put Client Task first
    if (defaultTab === "client") {
      return (
        <TabsList className={`grid w-full ${gridCols} bg-muted mb-6`}>
          <TabsTrigger 
            value="client" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-4 w-4 mr-2" />
            Client Task
          </TabsTrigger>
          <TabsTrigger 
            value="personal" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User className="h-4 w-4 mr-2" />
            My Tasks
          </TabsTrigger>
          {!hideGroupTasks && (
            <TabsTrigger 
              value="group" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4 mr-2" />
              Group Task
            </TabsTrigger>
          )}
        </TabsList>
      );
    }
    
    // Default order
    return (
      <TabsList className={`grid w-full ${gridCols} bg-muted mb-6`}>
        <TabsTrigger 
          value="personal" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <User className="h-4 w-4 mr-2" />
          My Tasks
        </TabsTrigger>
        <TabsTrigger 
          value="client" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Users className="h-4 w-4 mr-2" />
          Client Task
        </TabsTrigger>
        {!hideGroupTasks && (
          <TabsTrigger 
            value="group" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-4 w-4 mr-2" />
            Group Task
          </TabsTrigger>
        )}
      </TabsList>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all">
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

        <Tabs value={taskType} onValueChange={(value) => setTaskType(value)}>
          {getTabsList()}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="personal" className="space-y-6 mt-0">
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
              </TabsContent>

              <TabsContent value="client" className="space-y-6 mt-0">
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
                        <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
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
                          <PopoverContent className="w-[400px] p-0">
                            <div className="p-3 space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search clients..."
                                  value={clientSearchQuery}
                                  onChange={(e) => setClientSearchQuery(e.target.value)}
                                  className="pl-9"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto space-y-1">
                                {filteredClients.length === 0 ? (
                                  <div className="text-sm text-muted-foreground p-2 text-center">
                                    No clients found
                                  </div>
                                ) : (
                                  filteredClients.map((client) => (
                                    <Button
                                      key={client.id}
                                      variant="ghost"
                                      className="w-full justify-start h-auto p-2"
                                      onClick={() => handleClientSelect(client.id)}
                                    >
                                      <div className="flex items-center gap-3 w-full">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                          {client.avatar}
                                        </div>
                                        <span>{client.name}</span>
                                      </div>
                                    </Button>
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
              </TabsContent>

              <TabsContent value="group" className="space-y-6 mt-0">
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
                          placeholder="Enter group task title..." 
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
                          placeholder="Describe what group members need to do..." 
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
              </TabsContent>

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
                  className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all"
                >
                  Create Task
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
