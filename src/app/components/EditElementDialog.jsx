"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { LibraryPickerModal } from '@/app/components/LibraryPickerModal';
import { Eye, Download, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

export function EditElementDialog({ element, open, onOpenChange, onSave, onDelete }) {
  const [formData, setFormData] = useState({});
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [loadingResource, setLoadingResource] = useState(false);

  const handleViewContent = async () => {
    const libraryFileId = formData.data?.libraryFileId;
    if (!libraryFileId) return;

    try {
      setLoadingResource(true);
      const response = await fetch(`/api/resources/${libraryFileId}`);
      if (!response.ok) throw new Error('Failed to fetch resource');
      
      const data = await response.json();
      window.open(data.resource.url, '_blank');
    } catch (error) {
      console.error('Error viewing resource:', error);
      alert('Failed to open document. Please try again.');
    } finally {
      setLoadingResource(false);
    }
  };

  const handleDownloadContent = async () => {
    const libraryFileId = formData.data?.libraryFileId;
    if (!libraryFileId) return;

    try {
      setLoadingResource(true);
      const response = await fetch(`/api/resources/${libraryFileId}`);
      if (!response.ok) throw new Error('Failed to fetch resource');
      
      const data = await response.json();
      const link = document.createElement('a');
      link.href = data.resource.url;
      link.download = data.resource.fileName || formData.data?.fileName || formData.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setLoadingResource(false);
    }
  };

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
        title: file.name,
        description: formData.data?.description || '',
        assignedTo: formData.data?.assignedTo || 'client',
        libraryFileId: file.id.toString(),
        url: file.url || null
      };

      setFormData(prev => ({
        ...prev,
        title: file.name,
        data: contentData
      }));
    }
    setShowLibraryPicker(false);
  };

  // Helper function to add greeting to content
  const addGreetingToContent = (content, greetingType) => {
    if (!content) content = '';
    
    let greeting = '';
    if (greetingType === 'firstName') {
      greeting = 'Hi {client First Name},\n\n';
    } else if (greetingType === 'fullName') {
      greeting = 'Hi {client Full Name},\n\n';
    }
    
    // Check if greeting already exists at the start
    if (content.startsWith('Hi {client First Name}') || content.startsWith('Hi {client Full Name}')) {
      // Replace existing greeting
      const lines = content.split('\n');
      if (lines[0].startsWith('Hi {client')) {
        lines[0] = greeting.trim();
        return lines.join('\n');
      }
    }
    
    // Add greeting at the top
    return greeting + content;
  };

  // Handle greeting selection
  const handleGreetingSelect = (greetingType) => {
    if (formData.type === 'message') {
      const currentMessage = formData.data?.message || '';
      setFormData(prev => ({
        ...prev,
        data: { ...(prev.data), message: addGreetingToContent(currentMessage, greetingType), isAutomatic: (prev.data)?.isAutomatic || false }
      }));
    } else if (formData.type === 'task') {
      const currentDescription = formData.data?.description || '';
      setFormData(prev => ({
        ...prev,
        data: { ...(prev.data), description: addGreetingToContent(currentDescription, greetingType), title: formData.title || '' }
      }));
    } else if (formData.type === 'content') {
      const currentDescription = formData.data?.description || '';
      setFormData(prev => ({
        ...prev,
        data: { ...(prev.data), description: addGreetingToContent(currentDescription, greetingType) }
      }));
    }
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="messageContent">Message</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-8">
                        Add Greeting <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleGreetingSelect('firstName')}>
                        First Name
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGreetingSelect('fullName')}>
                        Full Name
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

                {/* Type-specific content */}
                {formData.type === 'task' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="taskDescription">Task Description</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="h-8">
                              Add Greeting <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleGreetingSelect('firstName')}>
                              First Name
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGreetingSelect('fullName')}>
                              Full Name
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                  </div>
                ) : formData.type === 'content' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Library File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={formData.data?.fileName || formData.data?.title || ''}
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
                      {formData.data?.libraryFileId && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleViewContent}
                            disabled={loadingResource}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Document
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="contentDescription">Description</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="h-8">
                              Add Greeting <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleGreetingSelect('firstName')}>
                              First Name
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGreetingSelect('fullName')}>
                              Full Name
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Textarea
                        id="contentDescription"
                        value={formData.data?.description || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          data: { ...(prev.data), description: e.target.value }
                        }))}
                        placeholder="Describe the file or what the client should do with it"
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <Tabs value={formData.type} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="task">Task</TabsTrigger>
                      <TabsTrigger value="checkin">Check-in</TabsTrigger>
                    </TabsList>

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
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            {onDelete && element?.id && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  toast('Delete Element', {
                    description: 'Are you sure you want to delete this element? This action cannot be undone.',
                    action: {
                      label: 'Delete',
                      onClick: () => {
                        onDelete(element.id);
                        onOpenChange(false);
                      }
                    },
                    cancel: {
                      label: 'Cancel',
                      onClick: () => {}
                    },
                    duration: 5000
                  });
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
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