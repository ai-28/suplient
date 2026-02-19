"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/app/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Upload, CheckSquare, MessageSquare, FileText, Image, Video, Music, ChevronDown } from "lucide-react";
import { FileExplorer } from "@/app/components/FileExplorer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { EmojiButton } from "@/app/components/EmojiButton";

export function AddElementDialog({
  open,
  onOpenChange,
  elementType,
  programDuration,
  defaultWeek = 1,
  preselectedDay,
  preselectedWeek,
  onAddElement
}) {
  const t = useTranslation();
  const [selectedWeek, setSelectedWeek] = useState(preselectedWeek || defaultWeek);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(preselectedDay || 1);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [libraryFiles, setLibraryFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  
  // Update state when props change
  useEffect(() => {
    if (preselectedWeek) {
      setSelectedWeek(preselectedWeek);
    }
    if (preselectedDay) {
      setSelectedDayOfWeek(preselectedDay);
    }
  }, [preselectedWeek, preselectedDay]);
  
  // Content selection state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('articles');
  
  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('client');
  
  // Message state
  const [messageText, setMessageText] = useState('');
  const messageTextareaRef = useRef(null);
  
  // Content state
  const [contentDescription, setContentDescription] = useState('');
  const contentDescriptionRef = useRef(null);
  const taskDescriptionRef = useRef(null);
  
  // Emoji handlers
  const handleEmojiSelect = (emoji, textareaRef, setter) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentValue = textarea.value || '';
      const newValue = currentValue.slice(0, start) + emoji + currentValue.slice(end);
      setter(newValue);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    } else {
      setter(prev => prev + emoji);
    }
  };
  
  // Helper function to add greeting to content
  const addGreetingToContent = (content, greetingType) => {
    if (!content) return '';
    
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
    if (elementType === 'message') {
      setMessageText(addGreetingToContent(messageText, greetingType));
    } else if (elementType === 'task') {
      setTaskDescription(addGreetingToContent(taskDescription, greetingType));
    } else if (elementType === 'content') {
      setContentDescription(addGreetingToContent(contentDescription, greetingType));
    }
  };

  const getElementInfo = (type) => {
    switch (type) {
      case 'content':
        return {
          title: t('programs.shareFile', 'Share File from Library'),
          icon: <Upload className="h-5 w-5" />,
          description: t('programs.shareFileDescription', 'Share a file from your library with the client')
        };
      case 'task':
        return {
          title: t('programs.createTask', 'Create Task'),
          icon: <CheckSquare className="h-5 w-5" />,
          description: t('programs.createTaskDescription', 'Create a task for the client or yourself')
        };
      case 'message':
        return {
          title: t('programs.sendMessage', 'Send Message'),
          icon: <MessageSquare className="h-5 w-5" />,
          description: t('programs.sendMessageDescription', 'Send an automated message to the client')
        };
      default:
        return {
          title: t('programs.addElement', 'Add Element'),
          icon: null,
          description: t('programs.addElementDescription', 'Add a new element to the program')
        };
    }
  };

  // Library data
  const categories = [
    { id: 'articles', name: t('library.articles', 'Articles'), icon: FileText, color: 'bg-blue-500' },
    { id: 'images', name: t('library.images', 'Images'), icon: Image, color: 'bg-green-500' },
    { id: 'videos', name: t('library.videos', 'Videos'), icon: Video, color: 'bg-purple-500' },
    { id: 'sounds', name: t('library.sounds', 'Audio'), icon: Music, color: 'bg-orange-500' }
  ];

  // Map category to resourceType
  const getResourceType = () => {
    const mapping = {
      videos: 'video',
      images: 'image',
      articles: 'article',
      sounds: 'sound'
    };
    return mapping[selectedCategory] || 'article';
  };

  // Fetch folders for the selected category
  const fetchFolders = useCallback(async () => {
    if (elementType === 'content' && selectedCategory) {
      try {
        setLoadingFolders(true);
        const resourceType = getResourceType();
        const response = await fetch(`/api/library/folders?resourceType=${resourceType}&tree=true`);
        const data = await response.json();
        
        if (data.status) {
          setFolders(data.folders || []);
        } else {
          console.error('Failed to fetch folders:', data.message);
          setFolders([]);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        setFolders([]);
      } finally {
        setLoadingFolders(false);
      }
    }
  }, [elementType, selectedCategory]);

  // Fetch library files from API
  const fetchLibraryFiles = useCallback(async () => {
    if (elementType === 'content') {
      try {
        setLoadingFiles(true);
        const response = await fetch('/api/library/all');
        const data = await response.json();
        
        if (data.status) {
          setLibraryFiles(data.resources || []);
        } else {
          console.error('Failed to fetch library files:', data.message);
          setLibraryFiles([]);
        }
      } catch (error) {
        console.error('Error fetching library files:', error);
        setLibraryFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    }
  }, [elementType]);

  useEffect(() => {
    fetchLibraryFiles();
  }, [fetchLibraryFiles]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'audio': case 'mp3': return <Music className="h-4 w-4" />;
      case 'video': case 'mp4': return <Video className="h-4 w-4" />;
      case 'image': case 'jpg': case 'png': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const toggleFileSelection = (file) => {
    // For program elements, only allow single file selection
    setSelectedFiles(prev => 
      prev.find(f => f.id === file.id)
        ? [] // Deselect if already selected
        : [file] // Select only this file (replace any previous selection)
    );
  };

  const getElementData = (type) => {
    switch (type) {
      case 'content':
        return {
          title: selectedFiles[0]?.name || '',
          description: contentDescription,
          assignedTo: 'client',
          libraryFileId: selectedFiles[0]?.id || '',
          url: selectedFiles[0]?.url || null
        };
      case 'task':
        return {
          title: taskTitle,
          description: taskDescription,
          dueInDays: 7,
          assignedTo: taskAssignedTo
        };
      case 'message':
        return {
          message: messageText,
          isAutomatic: true
        };
    }
  };


  const handleAddElement = () => {
    if (!elementType) return;

    // Convert week and day-of-week to absolute day number
    const scheduledDay = (selectedWeek - 1) * 7 + selectedDayOfWeek;
    const elementInfo = getElementInfo(elementType);

    const newElement = {
      type: elementType,
      scheduledDay,
      scheduledTime: selectedTime,
      title: getElementTitle(),
      data: getElementData(elementType)
    };

    onAddElement(newElement);
    resetDialog();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetDialog();
    onOpenChange(false);
  };

  const getElementTitle = () => {
    switch (elementType) {
      case 'content':
        return selectedFiles[0]?.name || t('programs.shareFile', 'Share File');
      case 'task':
        return taskTitle || t('programs.newTask', 'New Task');
      case 'message':
        return messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '') || t('programs.sendMessage', 'Send Message');
      default:
        return t('programs.newElement', 'New Element');
    }
  };

  const resetDialog = () => {
    setSelectedFiles([]);
    setTaskTitle('');
    setTaskDescription('');
    setTaskAssignedTo('client');
    setMessageText('');
    setContentDescription('');
    setSelectedWeek(preselectedWeek || defaultWeek);
    setSelectedDayOfWeek(preselectedDay || 1);
    setSelectedTime('09:00');
  };

  const isFormValid = () => {
    switch (elementType) {
      case 'content': return selectedFiles.length > 0;
      case 'task': return taskTitle.trim() !== '';
      case 'message': return messageText.trim() !== '';
      default: return false;
    }
  };

  const generateWeekOptions = () => {
    const weeks = [];
    for (let i = 1; i <= programDuration; i++) {
      weeks.push({
        value: i.toString(),
        label: `${t('programs.week', 'Week')} ${i}`
      });
    }
    return weeks;
  };

  if (!elementType) return null;

  const elementInfo = getElementInfo(elementType);
  const dayNames = [
    t('common.days.monday', 'Monday'),
    t('common.days.tuesday', 'Tuesday'),
    t('common.days.wednesday', 'Wednesday'),
    t('common.days.thursday', 'Thursday'),
    t('common.days.friday', 'Friday'),
    t('common.days.saturday', 'Saturday'),
    t('common.days.sunday', 'Sunday')
  ];
  const previewText = `${getElementTitle()} - ${t('programs.week', 'Week')} ${selectedWeek}, ${dayNames[selectedDayOfWeek - 1]}`;

  const renderTimeSelector = () => (
    <div className="space-y-4 pb-4">
      {!(preselectedDay && preselectedWeek) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="week">{t('programs.week', 'Week')}</Label>
            <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder={t('programs.selectWeek', 'Select week')} />
              </SelectTrigger>
              <SelectContent>
                {generateWeekOptions().map(week => (
                  <SelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">{t('programs.dayOfWeek', 'Day of Week')}</Label>
            <Select value={selectedDayOfWeek.toString()} onValueChange={(value) => setSelectedDayOfWeek(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder={t('programs.selectDay', 'Select day')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('common.days.monday', 'Monday')}</SelectItem>
                <SelectItem value="2">{t('common.days.tuesday', 'Tuesday')}</SelectItem>
                <SelectItem value="3">{t('common.days.wednesday', 'Wednesday')}</SelectItem>
                <SelectItem value="4">{t('common.days.thursday', 'Thursday')}</SelectItem>
                <SelectItem value="5">{t('common.days.friday', 'Friday')}</SelectItem>
                <SelectItem value="6">{t('common.days.saturday', 'Saturday')}</SelectItem>
                <SelectItem value="7">{t('common.days.sunday', 'Sunday')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );

  const renderContentSection = () => {
    switch (elementType) {
      case 'content':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 border-b">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </Button>
              ))}
            </div>
            
            <FileExplorer
              files={libraryFiles}
              folders={folders}
              selectedFiles={selectedFiles}
              onFileSelect={toggleFileSelection}
              category={selectedCategory}
              loading={loadingFiles || loadingFolders}
            />
            
            {selectedFiles.length > 0 && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">{t('library.selectedFiles', 'Selected files')}:</p>
                <div className="mt-1 space-y-1">
                  {selectedFiles.map(file => (
                    <p key={file.id} className="text-xs text-muted-foreground">• {file.name}</p>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="contentDescription">{t('common.labels.description', 'Description')}</Label>
                <div className="flex items-center gap-2">
                  <EmojiButton 
                    onEmojiSelect={(emoji) => handleEmojiSelect(emoji, contentDescriptionRef, setContentDescription)}
                    className="h-8 w-8"
                  />
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
              </div>
              <div className="relative">
                <Textarea
                  id="contentDescription"
                  ref={contentDescriptionRef}
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  placeholder={t('programs.enterDescription', 'Enter description (optional)...')}
                  rows={3}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        );
        
      case 'task':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">{t('tasks.taskTitle', 'Task Title')}</Label>
              <Input
                id="taskTitle"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={t('tasks.enterTaskTitle', 'Enter task title...')}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="taskDescription">{t('common.labels.description', 'Description')}</Label>
                <div className="flex items-center gap-2">
                  <EmojiButton 
                    onEmojiSelect={(emoji) => handleEmojiSelect(emoji, taskDescriptionRef, setTaskDescription)}
                    className="h-8 w-8"
                  />
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
              </div>
              <div className="relative">
                <Textarea
                  id="taskDescription"
                  ref={taskDescriptionRef}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder={t('tasks.describeWhatNeedsToBeDone', 'Describe what needs to be done...')}
                  rows={4}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        );
        
      case 'message':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="messageText">{t('common.labels.message', 'Message')}</Label>
                <div className="flex items-center gap-2">
                  <EmojiButton 
                    onEmojiSelect={(emoji) => handleEmojiSelect(emoji, messageTextareaRef, setMessageText)}
                    className="h-8 w-8"
                  />
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
              </div>
              <div className="relative">
                <Textarea
                  id="messageText"
                  ref={messageTextareaRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t('programs.enterMessageToClient', 'Enter the message to send to the client...')}
                  rows={4}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderPreview = () => (
    <div className="border-t pt-4">
      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>{t('common.preview', 'Preview')}:</strong> {previewText}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {elementInfo.icon}
            {elementInfo.title}
          </DialogTitle>
          <DialogDescription>
            {elementInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {renderTimeSelector()}
          {renderContentSection()}
          {(elementType !== 'task' && elementType !== 'message' && elementType !== 'content') && renderPreview()}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              {t('common.buttons.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleAddElement} disabled={!isFormValid()}>
              {t('programs.addElement', 'Add Element')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}