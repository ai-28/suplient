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
import { X, Users, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useClients } from "@/app/hooks/useClients";
import { useTranslation } from "@/app/context/LanguageContext";
import { toast } from "sonner";

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "",
    focusArea: "",
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslation();
  
  // Fetch real clients from database
  const { availableClients, loading: clientsLoading, error: clientsError } = useClients();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.focusArea) {
      toast.error(t('common.messages.error'), {
        description: t('groups.createGroup')
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          focusArea: formData.focusArea,
          selectedMembers: selectedMembers.map(member => member.id), // Include selected member IDs
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create group");
      }
      
      // Show success message
      toast.success(t('groups.groupCreated'), {
        description: `${formData.name}`
      });
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        capacity: "",
        focusArea: "",
      });
      setSelectedMembers([]);
      onOpenChange(false);
      
      // Call callback to refresh groups list
      if (onGroupCreated) {
        onGroupCreated(result.group);
      }
      
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(t('common.messages.operationFailed'), {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            {t('groups.createGroup')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('common.labels.description')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('groups.createGroup')} *</Label>
                <Input
                  id="name"
                  placeholder={t('groups.createGroup')}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="focusArea">{t('common.labels.status')} *</Label>
                <Select onValueChange={(value) => handleInputChange("focusArea", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.labels.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anxiety">{t('groups.focusAreas.anxiety', 'Anxiety Management')}</SelectItem>
                    <SelectItem value="depression">{t('groups.focusAreas.depression', 'Depression Support')}</SelectItem>
                    <SelectItem value="trauma">{t('groups.focusAreas.trauma', 'Trauma Recovery')}</SelectItem>
                    <SelectItem value="addiction">{t('groups.focusAreas.addiction', 'Addiction Recovery')}</SelectItem>
                    <SelectItem value="grief">{t('groups.focusAreas.grief', 'Grief & Loss')}</SelectItem>
                    <SelectItem value="relationships">{t('groups.focusAreas.relationships', 'Relationship Issues')}</SelectItem>
                    <SelectItem value="mindfulness">{t('groups.focusAreas.mindfulness', 'Mindfulness & Meditation')}</SelectItem>
                    <SelectItem value="anger">{t('groups.focusAreas.anger', 'Anger Management')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('common.labels.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('common.labels.description')}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Group Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('settings.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">{t('groups.groupMembers')}</Label>
                <Select onValueChange={(value) => handleInputChange("capacity", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.labels.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4-6">4-6 {t('groups.members')}</SelectItem>
                    <SelectItem value="6-8">6-8 {t('groups.members')}</SelectItem>
                    <SelectItem value="8-10">8-10 {t('groups.members')}</SelectItem>
                    <SelectItem value="10-12">10-12 {t('groups.members')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('groups.addMember')}</h3>
            
            <div className="space-y-2">
              <Label>{t('clients.title')}</Label>
              {clientsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-muted-foreground">{t('common.messages.loading')}</div>
                </div>
              ) : clientsError ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-destructive">{t('common.messages.error')}: {clientsError}</div>
                </div>
              ) : availableClients.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-muted-foreground">{t('clients.noClients')}</div>
                </div>
              ) : (
                <Select onValueChange={addMember}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('groups.addMember')} />
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
              )}
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <Label>{t('groups.groupMembers')} ({selectedMembers.length})</Label>
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
              disabled={isLoading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isLoading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.messages.loading')}
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  {t('groups.createGroup')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}