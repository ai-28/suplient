"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { LibraryPickerModal } from '@/app/components/LibraryPickerModal';

export function EditElementDialog({ element, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({});
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  useEffect(() => {
    if (element) {
      setFormData(element);
    }
  }, [element]);

  const handleSave = () => {
    if (!formData.id || !formData.type || !formData.scheduledDay || !formData.scheduledTime || !formData.title) {
      return;
    }

    onSave(formData);
    onOpenChange(false);
  };

  const handleLibraryFileSelect = (files) => {
    if (files.length > 0) {
      const file = files[0];
      const contentData = {
        libraryFileId: file.id.toString(),
        fileName: file.name,
        fileType: file.type,
        category: file.category
      };

      setFormData(prev => ({
        ...prev,
        title: file.name,
        data: contentData
      }));
    }
    setShowLibraryPicker(false);
  };

  if (!element) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Program Element</DialogTitle>
            <DialogDescription>
              Update the details of this program element
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Element title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Scheduled Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this element"
                rows={3}
              />
            </div>

            {/* Type-specific content */}
            <Tabs value={formData.type} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="task">Task</TabsTrigger>
                <TabsTrigger value="message">Message</TabsTrigger>
                <TabsTrigger value="checkin">Check-in</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label>Library File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.data?.fileName || ''}
                      readOnly
                      placeholder="No file selected"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowLibraryPicker(true)}
                    >
                      Browse Library
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="task" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Task Description</Label>
                  <Textarea
                    id="taskDescription"
                    value={formData.data?.description || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      data: { ...(prev.data), description: e.target.value, title: formData.title || '' }
                    }))}
                    placeholder="Describe what the client needs to do"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueInDays">Due in Days (Optional)</Label>
                  <Input
                    id="dueInDays"
                    type="number"
                    min="1"
                    value={formData.data?.dueInDays || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      data: { ...(prev.data), dueInDays: e.target.value ? parseInt(e.target.value) : undefined, title: formData.title || '', description: (prev.data)?.description || '' }
                    }))}
                    placeholder="Number of days to complete"
                  />
                </div>
              </TabsContent>

              <TabsContent value="message" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="messageContent">Message</Label>
                  <Textarea
                    id="messageContent"
                    value={formData.data?.message || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      data: { ...(prev.data), message: e.target.value, isAutomatic: (prev.data)?.isAutomatic || false }
                    }))}
                    placeholder="Enter your message to the client"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="checkin" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Check-in questions are currently view-only in this dialog. Use the check-in builder for full editing.
                </div>
                {formData.data?.questions?.map((question, index) => (
                  <div key={question.id} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">{question.question}</div>
                    <div className="text-xs text-muted-foreground mt-1">Type: {question.type}</div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LibraryPickerModal
        open={showLibraryPicker}
        onOpenChange={setShowLibraryPicker}
        onShareFiles={handleLibraryFileSelect}
      />
    </>
  );
}