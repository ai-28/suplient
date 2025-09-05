"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { X, Users, Calendar, Clock, MapPin } from "lucide-react";

const availableClients = [
  { id: 1, name: "John Anderson", initials: "JA" },
  { id: 2, name: "Sarah Wilson", initials: "SW" },
  { id: 3, name: "Michael Brown", initials: "MB" },
  { id: 4, name: "Emily Davis", initials: "ED" },
  { id: 5, name: "Robert Johnson", initials: "RJ" },
  { id: 6, name: "Lisa Garcia", initials: "LG" },
  { id: 7, name: "David Miller", initials: "DM" },
  { id: 8, name: "Jessica Taylor", initials: "JT" },
];

export function CreateGroupDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "",
    frequency: "",
    duration: "",
    location: "",
    focusArea: "",
  });
  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMember = (clientId) => {
    const client = availableClients.find(c => c.id.toString() === clientId);
    if (client && !selectedMembers.find(m => m.id === client.id)) {
      setSelectedMembers(prev => [...prev, client]);
    }
  };

  const removeMember = (clientId) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== clientId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.focusArea) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Group Created Successfully",
      description: `${formData.name} has been created with ${selectedMembers.length} members.`,
    });
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      capacity: "",
      frequency: "",
      duration: "",
      location: "",
      focusArea: "",
    });
    setSelectedMembers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            Create New Therapy Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Anxiety Support Group"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="focusArea">Focus Area *</Label>
                <Select onValueChange={(value) => handleInputChange("focusArea", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select focus area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anxiety">Anxiety Management</SelectItem>
                    <SelectItem value="depression">Depression Support</SelectItem>
                    <SelectItem value="trauma">Trauma Recovery</SelectItem>
                    <SelectItem value="addiction">Addiction Recovery</SelectItem>
                    <SelectItem value="grief">Grief & Loss</SelectItem>
                    <SelectItem value="relationships">Relationship Issues</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness & Meditation</SelectItem>
                    <SelectItem value="anger">Anger Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the group's purpose and approach..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Group Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Group Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Select onValueChange={(value) => handleInputChange("capacity", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4-6">4-6 members</SelectItem>
                    <SelectItem value="6-8">6-8 members</SelectItem>
                    <SelectItem value="8-10">8-10 members</SelectItem>
                    <SelectItem value="10-12">10-12 members</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select onValueChange={(value) => handleInputChange("frequency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Session Duration</Label>
                <Select onValueChange={(value) => handleInputChange("duration", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., Room 201, Virtual (Zoom), etc."
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Add Members</h3>
            
            <div className="space-y-2">
              <Label>Select Clients</Label>
              <Select onValueChange={addMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose clients to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients
                    .filter(client => !selectedMembers.find(m => m.id === client.id))
                    .map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Members ({selectedMembers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
              <Users className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}