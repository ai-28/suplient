"use client"

import { useState, useEffect, useCallback } from "react";
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
import { Upload, CheckSquare, MessageSquare, FileText, Image, Video, Music, Folder, ChevronRight, ChevronDown } from "lucide-react";

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
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('client');
  
  // Message state
  const [messageText, setMessageText] = useState('');

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
    setSelectedFiles(prev => 
      prev.find(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // Group files by folder path
  const groupFilesByFolder = (files) => {
    const grouped = {
      root: [] // Files without folder
    };

    files.forEach(file => {
      if (file.folderPath) {
        if (!grouped[file.folderPath]) {
          grouped[file.folderPath] = [];
        }
        grouped[file.folderPath].push(file);
      } else {
        grouped.root.push(file);
      }
    });

    return grouped;
  };

  // Render folder hierarchy
  const renderFileList = (files) => {
    const grouped = groupFilesByFolder(files);
    const folderPaths = Object.keys(grouped).filter(key => key !== 'root').sort();
    
    return (
      <div className="space-y-1">
        {/* Root files (no folder) */}
        {grouped.root.length > 0 && (
          <div className="space-y-1">
            {grouped.root.map(file => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-accent cursor-pointer ml-0"
                onClick={() => toggleFileSelection(file)}
              >
                <Checkbox
                  checked={selectedFiles.some(f => f.id === file.id)}
                  onChange={() => toggleFileSelection(file)}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {file.type}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Files in folders */}
        {folderPaths.map(folderPath => {
          const isExpanded = expandedFolders.has(folderPath);
          const folderFiles = grouped[folderPath];
          const pathParts = folderPath.split(' / ');
          const folderName = pathParts[pathParts.length - 1];
          const indentLevel = pathParts.length - 1;

          return (
            <div key={folderPath} className="space-y-1">
              {/* Folder header */}
              <div
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer"
                style={{ paddingLeft: `${(indentLevel * 16) + 8}px` }}
                onClick={() => toggleFolder(folderPath)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-muted-foreground truncate">
                  {folderName}
                </span>
                <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                  {folderFiles.length}
                </Badge>
              </div>

              {/* Folder files */}
              {isExpanded && (
                <div className="space-y-1">
                  {folderFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      style={{ paddingLeft: `${(indentLevel * 16) + 32}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFileSelection(file);
                      }}
                    >
                      <Checkbox
                        checked={selectedFiles.some(f => f.id === file.id)}
                        onChange={() => toggleFileSelection(file)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                            {folderPath && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground truncate">{folderPath}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {file.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getElementData = (type) => {
    switch (type) {
      case 'content':
        return {
          title: selectedFiles[0]?.name || '',
          description: '',
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
    setSelectedWeek(preselectedWeek || defaultWeek);
    setSelectedDayOfWeek(preselectedDay || 1);
    setSelectedTime('09:00');
    setExpandedFolders(new Set());
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
    <div className="space-y-4 border-b pb-4">
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
            
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {loadingFiles ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">{t('library.loadingFiles', 'Loading files...')}</p>
                    </div>
                  </div>
                ) : libraryFiles
                  .filter(file => file.category === selectedCategory)
                  .length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t('library.noFilesInCategory', 'No files found in this category')}</p>
                    </div>
                  </div>
                ) : (
                  renderFileList(libraryFiles.filter(file => file.category === selectedCategory))
                )}
              </div>
            </ScrollArea>
            
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
              <Label htmlFor="taskDescription">{t('common.labels.description', 'Description')}</Label>
              <Textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder={t('tasks.describeWhatNeedsToBeDone', 'Describe what needs to be done...')}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('tasks.assignTo', 'Assign To')}</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="assign-client"
                    name="assignedTo"
                    value="client"
                    checked={taskAssignedTo === 'client'}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <Label htmlFor="assign-client" className="text-sm font-normal">{t('tasks.assignToClient', 'Assign to Client')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="assign-coach"
                    name="assignedTo"
                    value="coach"
                    checked={taskAssignedTo === 'coach'}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <Label htmlFor="assign-coach" className="text-sm font-normal">{t('tasks.assignToMeCoach', 'Assign to Me (Coach)')}</Label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'message':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="messageText">{t('common.labels.message', 'Message')}</Label>
              <Textarea
                id="messageText"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('programs.enterMessageToClient', 'Enter the message to send to the client...')}
                rows={4}
              />
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{t('common.note', 'Note')}:</strong> {t('programs.messageWillBeSentAutomatically', 'This message will be sent automatically on the scheduled day and time.')}
              </p>
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
      <DialogContent className="sm:max-w-lg">
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
          {renderPreview()}

          <div className="flex justify-end gap-2 pt-4 border-t">
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