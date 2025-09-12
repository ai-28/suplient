"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { CalendarIcon, Clock, Users, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
import { useClients } from "@/app/hooks/useClients";
import { useGroups } from "@/app/hooks/useGroups";

export function EditSessionDialog({ 
  open, 
  onOpenChange, 
  session, 
  onSessionUpdated 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sessionType, setSessionType] = useState("individual");

  const { availableClients, clientsLoading, clientsError } = useClients();
  const { groups, groupsLoading, groupsError } = useGroups();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm();

  // Initialize form when session changes
  useEffect(() => {
    if (session && open) {
      // Parse session date and time
      const sessionDate = new Date(session.sessionDate);
      setSelectedDate(sessionDate);
      setSelectedTime(session.sessionTime.substring(0, 5)); // HH:MM format
      
      // Set session type
      setSessionType(session.sessionType || "individual");
      
      // Set client or group
      if (session.clientId) {
        setSelectedClient(session.clientId);
        setSelectedGroup(null);
      } else if (session.groupId) {
        setSelectedGroup(session.groupId);
        setSelectedClient(null);
      }
      
      // Set form values
      setValue("title", session.title || "");
      setValue("description", session.description || "");
      setValue("duration", session.duration || 60);
      setValue("location", session.location || "");
      setValue("meetingLink", session.meetingLink || "");
      setValue("status", session.status || "scheduled");
      setValue("mood", session.mood || "neutral");
      setValue("notes", session.notes || "");
    }
  }, [session, open, setValue]);

  const onSubmit = async (data) => {
    if (!session) return;
    
    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!selectedDate) {
        toast.error("Please select a date");
        return;
      }
      
      if (!selectedTime) {
        toast.error("Please select a time");
        return;
      }
      
      if (sessionType === "individual" && !selectedClient) {
        toast.error("Please select a client");
        return;
      }
      
      if (sessionType === "group" && !selectedGroup) {
        toast.error("Please select a group");
        return;
      }

      // Prepare session data
      const sessionData = {
        title: data.title,
        description: data.description,
        sessionDate: selectedDate.toISOString(),
        sessionTime: selectedTime + ":00", // Convert to HH:MM:SS format
        duration: parseInt(data.duration),
        sessionType: sessionType,
        clientId: sessionType === "individual" ? selectedClient : null,
        groupId: sessionType === "group" ? selectedGroup : null,
        location: data.location || null,
        meetingLink: data.meetingLink || null,
        status: data.status,
        mood: data.mood,
        notes: data.notes || null
      };

      // Make API call to update session
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update session');
      }

      toast.success("Session updated successfully!");
      onSessionUpdated?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error(error.message || "Failed to update session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = (clientId) => {
    setSelectedClient(clientId);
    setSelectedGroup(null);
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
    setSelectedClient(null);
  };

  const getClientName = (clientId) => {
    const client = availableClients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Edit Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Session Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Type</label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual Session</SelectItem>
                <SelectItem value="group">Group Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Selection (for Individual Sessions) */}
          {sessionType === "individual" && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Client
              </label>
              <Select value={selectedClient || ""} onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading clients...
                      </div>
                    </SelectItem>
                  ) : clientsError ? (
                    <SelectItem value="error" disabled>
                      Error loading clients
                    </SelectItem>
                  ) : availableClients.length === 0 ? (
                    <SelectItem value="no-clients" disabled>
                      No clients available
                    </SelectItem>
                  ) : (
                    availableClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Group Selection (for Group Sessions) */}
          {sessionType === "group" && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Group
              </label>
              <Select value={selectedGroup || ""} onValueChange={handleGroupSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  {groupsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading groups...
                      </div>
                    </SelectItem>
                  ) : groupsError ? (
                    <SelectItem value="error" disabled>
                      Error loading groups
                    </SelectItem>
                  ) : groups.length === 0 ? (
                    <SelectItem value="no-groups" disabled>
                      No groups available
                    </SelectItem>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Title</label>
            <Input
              {...register("title", { required: "Title is required" })}
              placeholder="Enter session title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Enter session description"
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                {...register("duration", { 
                  required: "Duration is required",
                  min: { value: 15, message: "Minimum 15 minutes" },
                  max: { value: 480, message: "Maximum 8 hours" }
                })}
                type="number"
                min="15"
                max="480"
                placeholder="60"
              />
              {errors.duration && (
                <p className="text-sm text-destructive">{errors.duration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={watch("status")} onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location and Meeting Link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                {...register("location")}
                placeholder="Enter location"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Link</label>
              <Input
                {...register("meetingLink")}
                placeholder="Enter meeting link"
              />
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mood</label>
            <Select value={watch("mood")} onValueChange={(value) => setValue("mood", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">😊 Excellent</SelectItem>
                <SelectItem value="good">😐 Good</SelectItem>
                <SelectItem value="neutral">😑 Neutral</SelectItem>
                <SelectItem value="poor">😞 Poor</SelectItem>
                <SelectItem value="terrible">😢 Terrible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              {...register("notes")}
              placeholder="Enter session notes"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Session...
                </>
              ) : (
                "Update Session"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

