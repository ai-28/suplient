"use client"
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Badge } from "@/app/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Users, AlertCircle, Bell } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
import { toast } from 'sonner';
import { useClients } from "@/app/hooks/useClients";
import { useGroups } from "@/app/hooks/useGroups";


export function ScheduleSessionDialog({ 
  open, 
  onOpenChange, 
  onSessionCreated,
  groupName, 
  groupMembers 
}) {
  const [date, setDate] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Fetch real data
  const { availableClients, loading: clientsLoading } = useClients();
  const { groups, loading: groupsLoading } = useGroups();
  
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    duration: "60",
    location: "",
    sessionType: "",
    notes: "",
    reminderTime: "24",
    maxAttendees: groupMembers?.toString() || "8",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!date || !formData.time || !formData.sessionType) {
      toast.error("Please fill in the date, time, and session type.");
      return;
    }

    if (formData.sessionType === 'individual' && !selectedClient) {
      toast.error("Please select a client for individual sessions.");
      return;
    }

    if (formData.sessionType === 'group' && !selectedGroup) {
      toast.error("Please select a group for group sessions.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare session data
      const sessionData = {
        title: formData.title || (formData.sessionType === 'individual' ? `${selectedClient.name} Session` : `${selectedGroup.name} Session`),
        description: formData.notes || null,
        sessionDate: date.toISOString().split('T')[0], // YYYY-MM-DD format
        sessionTime: formData.time,
        duration: parseInt(formData.duration),
        sessionType: formData.sessionType,
        clientId: formData.sessionType === 'individual' ? selectedClient.id : null,
        groupId: formData.sessionType === 'group' ? selectedGroup.id : null,
        location: formData.location || null,
        meetingLink: null, // Could be added later
        status: 'scheduled',
        mood: 'neutral',
        notes: formData.notes || null
      };

      // Create session via API
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const result = await response.json();
      
      toast.success("Session scheduled successfully!");
      
      // Reset form
      setDate(undefined);
      setSelectedClient(null);
      setSelectedGroup(null);
      setFormData({
        title: "",
        time: "",
        duration: "60",
        location: "",
        sessionType: "",
        notes: "",
        reminderTime: "24",
        maxAttendees: groupMembers?.toString() || "8",
      });
      
      // Notify parent component
      if (onSessionCreated) {
        onSessionCreated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.message || 'Failed to schedule session');
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Schedule Session - {groupName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Session Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                placeholder={`${groupName} - Group Session`}
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionType">Session Type *</Label>
              <Select onValueChange={(value) => {
                handleInputChange("sessionType", value);
                setSelectedClient(null);
                setSelectedGroup(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Session</SelectItem>
                  <SelectItem value="group">Group Session</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Selection for Individual Sessions */}
            {formData.sessionType === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="client">Select Client *</Label>
                <Select onValueChange={(value) => {
                  if (value === "loading" || value === "no-clients") return;
                  const client = availableClients.find(c => c.id === value);
                  setSelectedClient(client);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsLoading ? (
                      <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                    ) : availableClients.length === 0 ? (
                      <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                    ) : (
                      availableClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Group Selection for Group Sessions */}
            {formData.sessionType === 'group' && (
              <div className="space-y-2">
                <Label htmlFor="group">Select Group *</Label>
                <Select onValueChange={(value) => {
                  if (value === "loading" || value === "no-groups") return;
                  const group = groups.find(g => g.id === value);
                  setSelectedGroup(group);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupsLoading ? (
                      <SelectItem value="loading" disabled>Loading groups...</SelectItem>
                    ) : groups.length === 0 ? (
                      <SelectItem value="no-groups" disabled>No groups available</SelectItem>
                    ) : (
                      groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.memberCount} members)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Date & Time</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Select onValueChange={(value) => handleInputChange("time", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration (minutes)
                </Label>
                <Select onValueChange={(value) => handleInputChange("duration", value)} defaultValue="90">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                    <SelectItem value="150">150 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttendees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Max Attendees
                </Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxAttendees}
                  onChange={(e) => handleInputChange("maxAttendees", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location & Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Location & Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Select onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room-101">Room 101 - Main Therapy Room</SelectItem>
                  <SelectItem value="room-102">Room 102 - Group Activity Room</SelectItem>
                  <SelectItem value="room-201">Room 201 - Conference Room</SelectItem>
                  <SelectItem value="virtual-zoom">Virtual - Zoom Meeting</SelectItem>
                  <SelectItem value="virtual-teams">Virtual - Microsoft Teams</SelectItem>
                  <SelectItem value="outdoor">Outdoor Space</SelectItem>
                  <SelectItem value="other">Other (specify in notes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderTime" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Send Reminder
              </Label>
              <Select onValueChange={(value) => handleInputChange("reminderTime", value)} defaultValue="24">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="120">2 hours before</SelectItem>
                  <SelectItem value="24">24 hours before</SelectItem>
                  <SelectItem value="48">48 hours before</SelectItem>
                  <SelectItem value="none">No reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Session Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions, topics to cover, materials needed, etc."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
              <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-accent">Important Reminders:</p>
                <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                  <li>All group members will be notified about this session</li>
                  <li>Session materials should be prepared in advance</li>
                  <li>Check room availability and setup requirements</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-primary text-[#1A2D4D] hover:shadow-medium"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {isLoading ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}