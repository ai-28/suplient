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



export function ScheduleSessionDialog({ 
  open, 
  onOpenChange, 
  groupName, 
  groupMembers 
}) {
  const [date, setDate] = useState();
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    duration: "90",
    location: "",
    sessionType: "",
    notes: "",
    reminderTime: "24",
    maxAttendees: groupMembers.toString(),
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !formData.time || !formData.sessionType) {
      toast({
        title: "Missing Information",
        description: "Please fill in the date, time, and session type.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Session Scheduled Successfully",
      description: `${formData.title || "Group session"} scheduled for ${format(date, "PPP")} at ${formData.time}.`,
    });
    
    // Reset form
    setDate(undefined);
    setFormData({
      title: "",
      time: "",
      duration: "90",
      location: "",
      sessionType: "",
      notes: "",
      reminderTime: "24",
      maxAttendees: groupMembers.toString(),
    });
    onOpenChange(false);
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
              <Select onValueChange={(value) => handleInputChange("sessionType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Group Session</SelectItem>
                  <SelectItem value="assessment">Assessment Session</SelectItem>
                  <SelectItem value="workshop">Workshop/Activity</SelectItem>
                  <SelectItem value="check-in">Check-in Session</SelectItem>
                  <SelectItem value="closure">Closure Session</SelectItem>
                  <SelectItem value="intake">New Member Intake</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              className="bg-gradient-primary text-white hover:shadow-medium"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}