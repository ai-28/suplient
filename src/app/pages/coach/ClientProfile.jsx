"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { ScheduleSessionDialog } from "@/app/components/ScheduleSessionDialog";
import { 
  ArrowLeft, 
  MessageCircle, 
  Plus, 
  Calendar, 
  FileText, 
  Share2, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Activity,
  User, 
  Phone, 
  Mail, 
  CheckCircle,
  Video,
  Download,
  Target,
  Eye,
  Minus,
  ImageIcon,
  Users,
  MapPin,
  Pause,
  Play
} from 'lucide-react';
import { ProgramTimelineView } from '@/app/components/ProgramTimelineView';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { generateTherapeuticProgressData } from '@/app/utils/progressCalculations';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import ClientChatInterface from "@/app/components/ClientChatInterface";
import { CreateTaskDialog } from "@/app/components/CreateTaskDialog";
import { LibraryPickerModal } from "@/app/components/LibraryPickerModal";

import { EnrollClientDialog } from "@/app/components/EnrollClientDialog";

const moodProgressData = [
  { week: "Week 1", mood: 4.2 },
  { week: "Week 2", mood: 5.1 },
  { week: "Week 3", mood: 5.8 },
  { week: "Week 4", mood: 6.2 },
  { week: "Week 5", mood: 7.1 },
  { week: "Week 6", mood: 7.8 },
  { week: "Week 7", mood: 8.2 },
  { week: "Week 8", mood: 8.5 }
];

const files = [
  { 
    id: 1, 
    name: "Assessment Form.pdf", 
    type: "PDF", 
    size: "245 KB", 
    sharedDate: "2 days ago",
    sharedBy: "Dr. Sarah Johnson"
  },
  { 
    id: 2, 
    name: "Session Recording.mp4", 
    type: "Video", 
    size: "15 MB", 
    sharedDate: "1 week ago",
    sharedBy: "Dr. Sarah Johnson"
  },
  { 
    id: 3, 
    name: "Progress Chart.jpg", 
    type: "Image", 
    size: "89 KB", 
    sharedDate: "2 weeks ago",
    sharedBy: "Dr. Sarah Johnson"
  }
];

const initialClientTasks = [
  { id: 1, text: "Complete daily mood check-in", completed: false, date: "Today", priority: "High" },
  { id: 2, text: "Practice breathing exercises", completed: true, date: "Yesterday", priority: "Medium" },
  { id: 3, text: "Journal about today's emotions", completed: false, date: "Today", priority: "Low" },
  { id: 4, text: "Read assigned chapter", completed: true, date: "2 days ago", priority: "Medium" }
];

const recentActivity = [
  { type: "journal", description: "Added new journal entry about anxiety", time: "2 hours ago" },
  { type: "task", description: "Completed breathing exercises", time: "5 hours ago" },
  { type: "session", description: "Attended weekly coaching session", time: "1 day ago" },
  { type: "message", description: "Sent message to coach", time: "2 days ago" }
];

const notes = [
  { id: 1, title: "Session Notes", content: "Client showed improvement...", date: "Today" },
  { id: 2, title: "Progress Update", content: "Discussed coping strategies...", date: "Yesterday" }
];

// Client's group memberships data
const clientGroups = [
  {
    id: 1,
    name: "Anxiety Support Circle",
    description: "A supportive space for managing anxiety together",
    members: 8,
    maxMembers: 12,
    joinedDate: "Feb 2024",
    nextSession: "Today, 3:00 PM",
    sessionFrequency: "Weekly",
    status: "Active",
    attendance: 85,
    role: "Member"
  },
  {
    id: 2,
    name: "Morning Meditation Group",
    description: "Start your day with guided meditation and mindfulness",
    members: 6,
    maxMembers: 10,
    joinedDate: "Jan 2024",
    nextSession: "Tomorrow, 8:00 AM",
    sessionFrequency: "Daily",
    status: "Active",
    attendance: 92,
    role: "Member"
  }
];

export default function ClientProfile() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Safety check to ensure searchParams is available
  if (!searchParams) {
    return <div>Loading...</div>;
  }
  
  const [activeTab, setActiveTab] = useState("overview");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [shareFilesOpen, setShareFilesOpen] = useState(false);
  const [fileToRemove, setFileToRemove] = useState(null);
  const [clientFiles, setClientFiles] = useState(files);
  const [clientTasks, setClientTasks] = useState(initialClientTasks);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [clientPrograms, setClientPrograms] = useState([]);

  const [localClientPrograms, setLocalClientPrograms] = useState(clientPrograms);
  // Get programs and client programs data
const programs = [
  {
    id: 1,
    name: "Program 1",
    elements: [
      { id: 1, title: "Element 1", type: "task" },
      { id: 2, title: "Element 2", type: "content" },
      { id: 3, title: "Element 3", type: "checkin" }
    ]
  },
  
];

  
  // Local state for client programs to handle pause/resume

  
  // Update local state when clientPrograms change
  useEffect(() => {
    setLocalClientPrograms(clientPrograms);
  }, [clientPrograms]);

  // Filter client programs for this specific client
  const currentClientPrograms = localClientPrograms.filter(cp => cp.clientId === id);

  // Helper functions to work with current client's programs
  const getProgramById = (programId) => programs.find(p => p.id === programId);
  
  const calculateProgramProgress = (clientProgram) => {
    const program = getProgramById(clientProgram.programId);
    if (!program) return { programId: clientProgram.programId, clientId: clientProgram.clientId, totalElements: 0, completedElements: 0, completionRate: 0, currentWeek: 1, wellbeingScores: [], engagementScore: 0 };
    
    const totalElements = program.elements.length;
    const completedElements = clientProgram.progress.completedElements.length;
    const completionRate = totalElements > 0 ? (completedElements / totalElements) * 100 : 0;
    const currentWeek = Math.ceil(clientProgram.progress.currentDay / 7);
    
    return {
      programId: clientProgram.programId,
      clientId: clientProgram.clientId,
      totalElements,
      completedElements,
      completionRate,
      currentWeek,
      wellbeingScores: [],
      engagementScore: Math.min(completionRate, 100)
    };
  };

  const getActivePrograms = () => currentClientPrograms.filter(cp => cp.status === 'active');
  const getCompletedPrograms = () => currentClientPrograms.filter(cp => cp.status === 'completed');
  const getPausedPrograms = () => currentClientPrograms.filter(cp => cp.status === 'paused');
  const getHistoryPrograms = () => currentClientPrograms.filter(cp => cp.status === 'completed' || cp.status === 'paused');
  const getAvailablePrograms = () => programs.filter(p => !currentClientPrograms.some(cp => cp.programId === p.id));

  const getNextUpcomingElement = (clientProgram) => {
    const program = getProgramById(clientProgram.programId);
    if (!program) return null;
    
    return program.elements.find(el => !clientProgram.progress.completedElements.includes(el.id));
  };

  const markElementComplete = (clientProgramId, elementId) => {
    updateProgress(clientProgramId, elementId);
  };

  const enrollInProgram = async (programId) => {
    await enrollClient(programId, id || 'client-1');
  };

  const pauseProgram = (clientProgramId) => {
    setClientPrograms(prev => 
      prev.map(cp => 
        cp.id === clientProgramId 
          ? { ...cp, status: 'paused' }
          : cp
      )
    );
  };

  const resumeProgram = (clientProgramId) => {
    setClientPrograms(prev => 
      prev.map(cp => 
        cp.id === clientProgramId 
          ? { ...cp, status: 'active' }
          : cp
      )
    );
  };


  // Generate client progress data
  // Find client name dynamically
  const clients = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Alex Bob" },
    { id: 3, name: "Sarah Wilson" },
    { id: 4, name: "Mike Johnson" },
    { id: 5, name: "Emma Davis" },
    // Add other clients as needed
  ];
  const currentClient = clients.find(c => c.id === parseInt(id || '1'));
  const clientName = currentClient?.name || 'Unknown Client';
  
  const clientProgressData = generateTherapeuticProgressData(
    id || 'client-1',
    clientName,
    'Active'
  );

  const handleBack = () => {
    if (!searchParams) {
      router.push('/coach/clients');
      return;
    }
    
    const fromGroup = searchParams.get('from') === 'group';
    const groupId = searchParams.get('groupId');
    const groupTab = searchParams.get('groupTab') || 'overview';
    
    if (fromGroup && groupId) {
      router.push(`/coach/group/${groupId}?tab=${groupTab}`);
    } else {
      router.push('/coach/clients');
    }
  };

  const handleShareFiles = (selectedFiles) => {
    const newFiles = selectedFiles.map((file, index) => ({
      id: clientFiles.length + index + 1,
      name: file.name,
      type: file.type,
      size: file.size,
      sharedDate: "Just now",
      sharedBy: "Dr. Sarah Johnson"
    }));
    
    setClientFiles(prev => [...newFiles, ...prev]);
    console.log("Shared files with client:", selectedFiles);
  };

  const handleViewFile = (fileId) => {
    const file = clientFiles.find(f => f.id === fileId);
    console.log("Viewing file:", file?.name);
  };

  const handleRemoveFileClick = (file) => {
    setFileToRemove(file);
  };

  const handleConfirmRemove = () => {
    if (fileToRemove) {
      setClientFiles(prev => prev.filter(f => f.id !== fileToRemove.id));
      console.log("Removed file with ID:", fileToRemove.id);
      setFileToRemove(null);
    }
  };

  const handleTaskCreated = (taskData) => {
    const newTask = {
      id: clientTasks.length + 1,
      text: taskData.title,
      completed: false,
      date: "Today",
      priority: "Medium"
    };
    
    setClientTasks(prev => [newTask, ...prev]);
    console.log("Created task for client:", taskData);
  };

  const handleTaskToggle = (taskId ) => {
    setClientTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case "pdf": return <FileText className="h-4 w-4 text-red-500" />;
      case "video": case "mp4": return <Video className="h-4 w-4 text-blue-500" />;
      case "image": case "jpg": case "png": return <ImageIcon className="h-4 w-4 text-green-500" />;
      case "doc": case "docx": return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {"Back to Clients"}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{clientName}</h1>
              <p className="text-gray-600">Personal coaching client</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIsScheduleDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="programs" className="flex-1">Programs</TabsTrigger>
            <TabsTrigger value="groups" className="flex-1">Groups</TabsTrigger>
            <TabsTrigger value="progress" className="flex-1">Progress & Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-6">
              {/* Left Column - Client Details + Tasks */}
              <div className="space-y-6">
                {/* Client Details */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Avatar className="h-20 w-20 mx-auto">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          SJ
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">Sarah Johnson</h3>
                        <p className="text-sm text-gray-500">Last login 2 days ago</p>
                      </div>
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>+45 12345678</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>sarah@example.com</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Type: Personal</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Next session: Tomorrow 2:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Tasks */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm">Tasks</CardTitle>
                    <CreateTaskDialog 
                      clientId="sarah-johnson"
                      clientName="Sarah Johnson"
                      hideGroupTasks={true}
                      defaultTab="client"
                      preSelectClient={true}
                      onTaskCreated={handleTaskCreated}
                    >
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </CreateTaskDialog>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {clientTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Checkbox 
                              checked={task.completed}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                {task.text}
                              </p>
                              <span className="text-xs text-gray-500">{task.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Center Column - Chat Interface */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-0">
                    <div className="h-[600px]">
                      <ClientChatInterface 
                        clientName="Sarah Johnson" 
                        clientInitials="SJ" 
                        clientType="personal"
                        clientId="sarah-johnson"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Notes & Files */}
              <div className="space-y-6">
                {/* Recent Notes */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm">Notes</CardTitle>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {notes.map((note) => (
                          <div key={note.id} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                            <h4 className="text-xs font-medium truncate">{note.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</p>
                            <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Shared Files */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm">Shared Files</CardTitle>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => setShareFilesOpen(true)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {clientFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.type} • {file.size}</p>
                                <p className="text-xs text-gray-500">Shared {file.sharedDate}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleViewFile(file.id)}
                                title="Preview file"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleRemoveFileClick(file)}
                                title="Remove file"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
            </TabsContent>

          <TabsContent value="programs" className="space-y-6">
            
              <div className="space-y-6">
                {/* Active Programs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Active Programs ({getActivePrograms().length})
                    </CardTitle>
                    <CardDescription>
                      Programs currently in progress for this client
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getActivePrograms().map((clientProgram) => {
                        const program = getProgramById(clientProgram.programId);
                        const progress = calculateProgramProgress(clientProgram);
                        const nextElement = getNextUpcomingElement(clientProgram);
                        
                        if (!program) return null;
                        
                        return (
                           <ProgramTimelineView
                             key={clientProgram.id}
                             program={program}
                             clientProgram={clientProgram}
                             progress={progress}
                             onMarkComplete={(elementId) => markElementComplete(clientProgram.id, elementId)}
                             onPauseResume={() => clientProgram.status === 'active' ? pauseProgram(clientProgram.id) : resumeProgram(clientProgram.id)}
                             onViewProgram={() => router.push(`/coach/programs/${program.id}/edit`)}
                           />
                        );
                      })}
                      
                      {getActivePrograms().length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No active programs for this client.</p>
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => setEnrollDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Enroll in Program
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Program History (Completed and Paused) */}
                {getHistoryPrograms().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Program History ({getHistoryPrograms().length})
                      </CardTitle>
                      <CardDescription>
                        Completed and paused programs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {getHistoryPrograms().map((clientProgram) => {
                          const program = getProgramById(clientProgram.programId);
                          const progress = calculateProgramProgress(clientProgram);
                          
                          if (!program) return null;
                          
                          return (
                            <Card key={clientProgram.id} className={`border-l-4 ${clientProgram.status === 'completed' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{program.name}</h4>
                                    <Badge variant={clientProgram.status === 'completed' ? 'default' : 'secondary'}>
                                      {clientProgram.status === 'completed' ? 'Completed' : 'Paused'}
                                    </Badge>
                                  </div>
                                  {clientProgram.status === 'paused' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resumeProgram(clientProgram.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <Play className="h-4 w-4" />
                                      Resume
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {program.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                      Completed: {Math.round(progress.completionRate)}% • Duration: {program.duration} weeks
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/coach/programs/${program.id}/edit`)}
                                        title="View Program Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
             
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Group Memberships ({clientGroups.length})
                </CardTitle>
                <CardDescription>
                  Groups that {searchParams && searchParams.get('memberName') ? searchParams.get('memberName') : 'Sarah'} is currently participating in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientGroups.map((group) => (
                    <Card key={group.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{group.name}</h3>
                              <Badge variant={group.status === 'Active' ? 'default' : 'secondary'}>
                                {group.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Joined</p>
                                  <p className="text-muted-foreground">{group.joinedDate}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Frequency</p>
                                  <p className="text-muted-foreground">{group.sessionFrequency}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Members</p>
                                  <p className="text-muted-foreground">{group.members}/{group.maxMembers}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Attendance</p>
                                  <p className="text-muted-foreground">{group.attendance}%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="text-sm">
                            <span className="font-medium">Next session: </span>
                            <span className="text-muted-foreground">{group.nextSession}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/coach/group/${group.id}`)}
                            >
                              View Group
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/coach/group/${group.id}?tab=members`)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Members
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {clientGroups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>This client is not currently a member of any groups.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Individual Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Individual Progress Tracking
                  </CardTitle>
                  <CardDescription>
                    Performance and wellbeing progression over 8 weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={clientProgressData.weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-blue-600">
                                    Performance: {payload[0]?.value}
                                  </p>
                                  <p className="text-green-600">
                                    Wellbeing: {payload[1]?.value}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="performance" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Performance"
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="wellbeing" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Wellbeing"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Metrics</CardTitle>
                  <CardDescription>Latest performance and wellbeing scores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {clientProgressData.currentMetrics.performance}
                      </div>
                      <div className="text-sm text-gray-600">Performance Score</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${clientProgressData.currentMetrics.performance * 10}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {clientProgressData.currentMetrics.wellbeing}
                      </div>
                      <div className="text-sm text-gray-600">Wellbeing Score</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${clientProgressData.currentMetrics.wellbeing * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">92%</div>
                      <div className="text-sm text-gray-600">Journal Completion</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">85%</div>
                      <div className="text-sm text-gray-600">Session Attendance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'journal' ? 'bg-purple-100 text-purple-600' :
                        activity.type === 'task' ? 'bg-green-100 text-green-600' :
                        activity.type === 'session' ? 'bg-blue-100 text-blue-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {activity.type === 'journal' ? <FileText className="h-4 w-4" /> :
                         activity.type === 'task' ? <CheckCircle2 className="h-4 w-4" /> :
                         activity.type === 'session' ? <Calendar className="h-4 w-4" /> :
                         <MessageCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <LibraryPickerModal
          open={shareFilesOpen}
          onOpenChange={setShareFilesOpen}
          onShareFiles={handleShareFiles}
        />

        <AlertDialog open={!!fileToRemove} onOpenChange={() => setFileToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{fileToRemove?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRemove}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Remove File
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ScheduleSessionDialog
          open={isScheduleDialogOpen}
          onOpenChange={setIsScheduleDialogOpen}
          groupName="Individual Session with Sarah Johnson"
          groupMembers={1}
        />


        <EnrollClientDialog
          open={enrollDialogOpen}
          onOpenChange={setEnrollDialogOpen}
          clientName="Sarah Johnson"
          availablePrograms={getAvailablePrograms()}
          onEnroll={enrollInProgram}
        />
      </div>
    </div>
  );
}