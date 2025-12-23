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
    if (element && element.id) {
      // Prioritize data over elementData - data is the transformed/updated version
      // elementData is the raw DB value, data is what the component uses after transformation
      // This ensures edited content shows correctly on subsequent clicks
      let elementData = element.data || element.elementData || {};
      
      // Parse elementData if it's a string (shouldn't be needed if parsed in ProgramEditor, but safety check)
      if (typeof elementData === 'string') {
        try {
          elementData = JSON.parse(elementData);
        } catch (e) {
          console.error('Error parsing elementData:', e);
          elementData = {};
        }
      }
      
      // Ensure elementData is an object, not null or undefined
      if (!elementData || typeof elementData !== 'object' || Array.isArray(elementData)) {
        elementData = {};
      }
      
      setFormData({
        ...element,
        data: { ...elementData } // Create a fresh copy to avoid reference issues
      });
    } else {
      // Reset formData when element is null
      setFormData({});
    }
  }, [element?.id, open]); // Use element.id to ensure proper change detection

  const handleSave = () => {
    if (!formData.id || !formData.type || !formData.scheduledDay) {
      return;
    }

    // Ensure scheduledTime has a default value if not set
    if (!formData.scheduledTime) {
      formData.scheduledTime = '09:00:00';
    }

    // Clean and prepare data object
    let cleanData = {};
    if (formData.data && typeof formData.data === 'object' && !Array.isArray(formData.data)) {
      // Copy only valid properties, avoid corrupted structures
      cleanData = { ...formData.data };
      // Remove any numeric string keys (corrupted data)
      Object.keys(cleanData).forEach(key => {
        if (!isNaN(parseInt(key)) && key.length === 1) {
          delete cleanData[key];
        }
      });
    }

    // For message elements, update title from message text
    if (formData.type === 'message' && cleanData.message) {
      const messageText = cleanData.message;
      formData.title = messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '') || 'Send Message';
    }

    // For non-message elements, title is required
    if (formData.type !== 'message' && !formData.title) {
      return;
    }

    // Create clean element to save
    const elementToSave = {
      ...formData,
      data: cleanData
    };

    onSave(elementToSave);
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
            {/* For message elements, show only the message field */}
            {formData.type === 'message' ? (
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
                  rows={6}
                  className="min-h-[150px]"
                />
              </div>
            ) : (
              <>
                {/* Basic Info */}
                <div className={formData.type === 'task' || formData.type === 'content' ? 'space-y-2' : 'grid grid-cols-2 gap-4'}>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Element title"
                    />
                  </div>
                  {/* Only show scheduled time for checkin and other types, not for task, content, or message */}
                  {(formData.type !== 'task' && formData.type !== 'content' && formData.type !== 'message') && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">Scheduled Time</Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={formData.scheduledTime || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                  )}
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="task">Task</TabsTrigger>
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
              </>
            )}
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