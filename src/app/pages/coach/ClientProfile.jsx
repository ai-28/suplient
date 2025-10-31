"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
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
  Play,
  Loader2,
  X,
  UserPlus,
  Heart,
  Trophy
} from 'lucide-react';
import { ProgramTimelineView } from '@/app/components/ProgramTimelineView';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useClientProgress } from '@/app/hooks/useClientProgress';
import { useConversationId } from '@/app/hooks/useConversationId';
import { toast } from 'sonner';
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
import { UniversalChatInterface } from "@/app/components/UniversalChatInterface";
import { useSession } from "next-auth/react";
import { CreateTaskDialog } from "@/app/components/CreateTaskDialog";
import { LibraryPickerModal } from "@/app/components/LibraryPickerModal";

import { EnrollClientDialog } from "@/app/components/EnrollClientDialog";
import { CreateNoteDialog } from "@/app/components/CreateNoteDialog";

// Demo data for files (these will be replaced with real data later)

export default function ClientProfile() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  // Safety check to ensure searchParams is available
  if (!searchParams) {
    return <div>Loading...</div>;
  }
  
  // State for UI
  const [activeTab, setActiveTab] = useState("overview");
  const [shareFilesOpen, setShareFilesOpen] = useState(false);
  const [fileToRemove, setFileToRemove] = useState(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  
  // State for real client data
  const [clientData, setClientData] = useState(null);
  const [clientTasks, setClientTasks] = useState([]);
  const [clientSessions, setClientSessions] = useState([]);
  const [clientGroups, setClientGroups] = useState([]);
  const [clientFiles, setClientFiles] = useState([]);
  const [clientNotes, setClientNotes] = useState([]);
  const [clientActivities, setClientActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get conversation ID for chat - memoize to prevent unnecessary re-renders
  const conversationParams = useMemo(() => ({
    clientId: clientData?.userId,
    coachId: session?.user?.id
  }), [clientData?.userId, session?.user?.id]);

  const { conversationId: chatConversationId, loading: conversationLoading } = useConversationId(
    conversationParams.clientId,
    conversationParams.coachId
  );
  
  // Preview states
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  
  // State for programs
  const [programTemplates, setProgramTemplates] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [clientRealPrograms, setClientRealPrograms] = useState([]);

  // Fetch program templates
  const fetchProgramTemplates = async () => {
    try {
      setProgramsLoading(true);
      const response = await fetch('/api/temp_programs');
      if (response.ok) {
        const result = await response.json();
        setProgramTemplates(result.programs || []);
      } else {
        console.error('Failed to fetch program templates');
      }
    } catch (err) {
      console.error('Error fetching program templates:', err);
    } finally {
      setProgramsLoading(false);
    }
  };

  // Fetch client's enrolled programs
  const fetchClientEnrolledPrograms = async () => {
    try {
      const response = await fetch(`/api/programs/client/${id}`);
      if (response.ok) {
        const result = await response.json();
        setClientRealPrograms(result.programs || []);
      } else {
        console.error('Failed to fetch client enrolled programs');
      }
    } catch (err) {
      console.error('Error fetching client enrolled programs:', err);
    }
  };

  // Fetch client activities
  const fetchClientActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await fetch(`/api/activities?clientId=${id}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client activities');
      }
      
      const data = await response.json();
      setClientActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching client activities:', error);
      setClientActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch client data on component mount
  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/clients/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch client data');
        }
        
        const result = await response.json();
        const data = result.data;
        
        // Debug: Log client data including avatar
        console.log('📋 Client data received:', {
          name: data.client?.name,
          avatar: data.client?.avatar,
          hasAvatar: !!data.client?.avatar
        });
        
        setClientData(data.client);
        setClientTasks(data.tasks);
        setClientSessions(data.sessions);
        setClientGroups(data.groupMemberships);
        
        // Fetch notes and resources for this client
        await fetchClientNotes(id);
        await fetchClientResources(id);
        
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
    fetchProgramTemplates();
    fetchClientEnrolledPrograms();
    fetchClientActivities();
  }, [id]);
  
  // Fetch client notes
  const fetchClientNotes = async (clientId) => {
    try {
      const response = await fetch(`/api/notes?clientId=${clientId}`);
      if (response.ok) {
        const result = await response.json();
        setClientNotes(result.notes || []);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const fetchClientResources = async (clientId) => {
    try {
      const response = await fetch(`/api/resources/client/${clientId}`);
      if (response.ok) {
        const result = await response.json();
        setClientFiles(result.resources || []);
      }
    } catch (err) {
      console.error('Error fetching client resources:', err);
    }
  };

  const handlePreview = (file) => {

    
    const directUrl = file.url;
    
    // Determine file type based on resourceType or file extension
    const fileName = file.fileName || file.url.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // Set preview type based on resourceType or file extension
    if (file.resourceType === 'image' || fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'gif' || fileExtension === 'webp') {
      setPreviewType('images');
    } else if (file.resourceType === 'video' || fileExtension === 'mp4' || fileExtension === 'avi' || fileExtension === 'mov' || fileExtension === 'wmv') {
      setPreviewType('videos');
    } else if (file.resourceType === 'sound' || fileExtension === 'mp3' || fileExtension === 'wav' || fileExtension === 'ogg' || fileExtension === 'm4a') {
      setPreviewType('sounds');
    } else if (fileExtension === 'pdf') {
      setPreviewType('pdf');
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(fileExtension)) {
      setPreviewType('document');
    } else {
      setPreviewType('document'); // Default fallback
    }
    
    setPreviewUrl(directUrl);
  };
  

  // Use real program data from database
  const currentClientPrograms = clientRealPrograms;
  // Helper functions to work with current client's programs
  const getProgramById = (programId) => {
    // Find the enrollment record which contains the elements
    const enrollment = clientRealPrograms.find(p => p.id === programId);
    return enrollment; // The enrollment record itself contains the elements
  };
  
  const calculateProgramProgress = (clientProgram) => {
    
    // Validate input
    if (!clientProgram || !clientProgram.id) {
      console.error('Invalid clientProgram:', clientProgram);
      return { 
        programId: null, 
        clientId: null, 
        totalElements: 0, 
        completedElements: 0, 
        completionRate: 0, 
        currentDay: 0,
        currentWeek: 0, 
        wellbeingScores: [], 
        engagementScore: 0 
      };
    }
    
    const program = getProgramById(clientProgram.id);
    console.log('Calculating progress for clientProgram:', clientProgram);
    console.log('Found program:', program);
    console.log('Program elements:', program?.elements);
    console.log('Client completed elements:', clientProgram.completedElements);
    
    if (!program) {
      console.error('Program not found for ID:', clientProgram.id);
    return {
        programId: clientProgram.id, 
        clientId: clientProgram.clientId, 
        totalElements: 0, 
        completedElements: 0, 
        completionRate: 0, 
        currentDay: 0,
        currentWeek: 0, 
        wellbeingScores: [], 
        engagementScore: 0 
      };
    }
    
    const totalElements = program.elements?.length || 0;
    const completedElementsCount = clientProgram.completedElements?.length || 0;
    const completedElementsArray = clientProgram.completedElements || [];
    
    // Handle programs that haven't started yet
    if (!clientProgram.startDate) {
      return {
        programId: clientProgram.id,
      clientId: clientProgram.clientId,
      totalElements,
        completedElements: completedElementsCount,
        completedElementsArray,
        completionRate: 0,
        currentDay: 0,
        currentWeek: 0,
        wellbeingScores: [],
        engagementScore: 0
      };
    }

    // Calculate current day from start date
    const startDate = new Date(clientProgram.startDate);
    const today = new Date();
    
    // Convert local today to UTC for consistent comparison
    const todayUTC = new Date(today.getTime() + (today.getTimezoneOffset() * 60000));
    console.log("todayutc",todayUTC, "startdate",startDate)
    // Handle edge cases
    if (startDate > todayUTC) {
      // Program hasn't started yet (shouldn't happen for active programs)
      return {
        programId: clientProgram.id,
        clientId: clientProgram.clientId,
        totalElements,
        completedElements: completedElementsCount,
        completionRate: 0,
        currentDay: 0,
        currentWeek: 0,
        wellbeingScores: [],
        engagementScore: 0
      };
    }

    const daysSinceStart = Math.floor((todayUTC - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.max(1, daysSinceStart);
    const currentWeek = Math.ceil(currentDay / 7);
    // Check if program should be completed based on duration
    const maxDays = program.duration * 7; // Convert weeks to days
    const isOverdue = currentDay > maxDays;
    const completionRate = totalElements > 0 ? (completedElementsCount / totalElements) * 100 : 0;
    
    return {
      programId: clientProgram.id,
      clientId: clientProgram.clientId,
      totalElements,
      completedElements: completedElementsCount,
      completedElementsArray,
      completionRate,
      currentDay,
      currentWeek,
      maxDays,
      isOverdue,
      wellbeingScores: [],
      engagementScore: Math.min(completionRate, 100)
    };
  };

  const getEnrolledPrograms = () => currentClientPrograms.filter(cp => cp.status === 'enrolled');
  const getActivePrograms = () => currentClientPrograms.filter(cp => cp.status === 'active');
  const getHistoryPrograms = () => currentClientPrograms.filter(cp => cp.status === 'completed' || cp.status === 'paused');
  const getAvailablePrograms = () => {
    // Filter out templates that the client is already enrolled in
    return programTemplates.filter(template => 
      !clientRealPrograms.some(enrolledProgram => 
        enrolledProgram.name === template.name && enrolledProgram.duration === template.duration
      )
    );
  };

  const getNextUpcomingElement = (clientProgram) => {
    const program = getProgramById(clientProgram.id);
    if (!program || !program.elements) return null;
    
    return program.elements.find(el => !clientProgram.completedElements?.includes(el.id));
  };

  const markElementComplete = async (clientProgramId, elementId) => {
    try {
      
      const response = await fetch(`/api/programs/${clientProgramId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markElementComplete',
          elementId: elementId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check if program should be auto-completed (before refreshing)
        await checkAndCompleteProgram(clientProgramId);
        
        // Refresh the client's enrolled programs to update progress
        await fetchClientEnrolledPrograms();
        
        // Show success message
        toast.success('Element marked as complete');
      } else {
        const error = await response.json();
        console.error('Failed to mark element complete:', error);
        toast.error(error.error || 'Failed to mark element as complete');
      }
    } catch (error) {
      console.error('Error marking element complete:', error);
      toast.error('Error marking element as complete');
    }
  };

  const checkAndCompleteProgram = async (clientProgramId) => {
    try {
      // Get fresh program data after the element was marked complete
      const response = await fetch(`/api/programs/client/${id}`);
      if (!response.ok) return;
      
      const result = await response.json();
      const freshPrograms = result.programs || [];
      
      // Find the program in fresh data
      const clientProgram = freshPrograms.find(p => p.id === clientProgramId);
      if (!clientProgram || clientProgram.status !== 'active') return;

      const program = getProgramById(clientProgramId);
      if (!program || !program.elements) return;

      const totalElements = program.elements.length;
      const completedElements = clientProgram.completedElements?.length || 0;
      const completionRate = totalElements > 0 ? (completedElements / totalElements) * 100 : 0;



      // If program is 100% complete, mark it as completed
      if (completionRate >= 100) {
        
        const updateResponse = await fetch(`/api/programs/${clientProgramId}/progress`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'updateStatus',
            status: 'completed'
          }),
        });

        if (updateResponse.ok) {
          // Refresh programs to show updated status
          await fetchClientEnrolledPrograms();
          toast.success('🎉 Program completed! Congratulations!');
        } else {
          console.error('Failed to mark program as completed');
        }
      }
    } catch (error) {
      console.error('Error checking program completion:', error);
    }
  };

  const enrollInProgram = async (templateId) => {
    try {
      
      const response = await fetch('/api/programs/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: templateId,
          clientId: id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refresh the client's enrolled programs to update available programs
        await fetchClientEnrolledPrograms();
        
        // Show success message
        toast.success(`${clientData.name} has been enrolled in the program successfully`);
        
        // Close the dialog
        setEnrollDialogOpen(false);
      } else {
        const error = await response.json();
        console.error('Failed to enroll client:', error);
        toast.error(error.error || 'Failed to enroll client in program');
      }
    } catch (error) {
      console.error('Error enrolling client:', error);
      toast.error('Error enrolling client in program');
    }
  };

  const startProgram = async (programId) => {
    try {
      
      const response = await fetch(`/api/programs/${programId}/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refresh the client's programs to update the status
        await fetchClientEnrolledPrograms();
        
        // Show success message
        toast.success('Program started successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to start program:', error);
        toast.error(error.error || 'Failed to start program');
      }
    } catch (error) {
      console.error('Error starting program:', error);
      toast.error('Error starting program');
    }
  };

  const pauseProgram = async (clientProgramId) => {
    try {
      const response = await fetch(`/api/programs/${clientProgramId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          status: 'paused'
        }),
      });

      if (response.ok) {
        await fetchClientEnrolledPrograms();
        toast.success('Program paused');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to pause program');
      }
    } catch (error) {
      console.error('Error pausing program:', error);
      toast.error('Error pausing program');
    }
  };

  const resumeProgram = async (clientProgramId) => {
    try {
      const response = await fetch(`/api/programs/${clientProgramId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          status: 'active'
        }),
      });

      if (response.ok) {
        await fetchClientEnrolledPrograms();
        toast.success('Program resumed');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to resume program');
      }
    } catch (error) {
      console.error('Error resuming program:', error);
      toast.error('Error resuming program');
    }
  };

  const restartProgram = async (clientProgramId) => {
    try {
      const response = await fetch(`/api/programs/${clientProgramId}/restart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchClientEnrolledPrograms();
        toast.success('🎉 Program restarted successfully! Ready to begin again.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to restart program');
      }
    } catch (error) {
      console.error('Error restarting program:', error);
      toast.error('Error restarting program');
    }
  };


  // Get real client progress data - use clientData.id (the actual client ID)
  const clientId = clientData?.id;
  const { progressData, loading: progressLoading, error: progressError } = useClientProgress(clientId);

  // Use real data if available, otherwise show empty state
  const clientName = clientData?.name || 'Loading...';
  const clientProgressData = progressData ? {
    ...progressData,
    weeklyData: progressData.weeklyData || [],
    currentMetrics: progressData.currentMetrics || { performance: 0, wellbeing: 0 }
  } : {
    weeklyData: [],
    currentMetrics: { performance: 0, wellbeing: 0 },
    stats: { journalCompletionRate: 0, sessionAttendanceRate: 0 }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading client data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading client data: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <User className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Client not found</p>
            <Button onClick={() => router.push('/coach/clients')}>
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    // If searchParams is not available, just go back to clients
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

  const handleShareFiles = async (selectedFiles) => {
    try {
      // Share each selected file with the client
      for (const file of selectedFiles) {
        const response = await fetch('/api/resources/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId: file.id,
            clientIds: [id] // Use the current client ID
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to share ${file.name}`);
        }
      }

      // Refresh the client files list
      await fetchClientResources(id);
    } catch (error) {
      console.error('Error sharing files:', error);
      alert(`Error sharing files: ${error.message}`);
    }
  };

  const handleRemoveFileClick = (file) => {

    setFileToRemove(file);
  };

  const handleConfirmRemove = async () => {

    
    if (fileToRemove && id) {
      console.log('📤 Sending request to remove client from resource:', {
        resourceId: fileToRemove.id,
        clientId: id  // Use the client ID from URL params, not user ID
      });
      
      try {
        const response = await fetch('/api/resources/remove-client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId: fileToRemove.id,
            clientId: id  // Use the client ID from URL params
          }),
        });


        if (response.ok) {
          const result = await response.json();

          
          // Refresh the files list to reflect the change
          await fetchClientResources(id);  // Use client ID from URL params
          
          // Show success message
          toast.success('File removed from client successfully');
        } else {
          const error = await response.json();
          console.error('❌ Failed to remove client from resource:', error.error);
          console.error('❌ Full error response:', error);
          toast.error('Failed to remove file from client');
        }
      } catch (error) {
        console.error('❌ Error removing client from resource:', error);
        toast.error('Error removing file from client');
      }
      
      setFileToRemove(null);
    } else {
      console.error('❌ Missing required data:', {
        fileToRemove: !!fileToRemove,
        clientId: id
      });
    }
  };

  const handleTaskCreated = (taskData) => {
    
    const newTask = {
      id: taskData.id || `temp-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      status: 'pending',
      taskType: 'client',
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setClientTasks(prev => [newTask, ...prev]);
  };

  const handleTaskToggle = async (taskId) => {
    try {
      // Find the current task to get its current status
      const currentTask = clientTasks.find(task => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      // Determine new status based on current completion state
      const newStatus = currentTask.completed ? 'pending' : 'completed';
      
      console.log('🔄 Updating task status:', { taskId, currentStatus: currentTask.status, newStatus });

      // Call API to update task status in database
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to update task status:', errorData);
        toast.error(errorData.error || 'Failed to update task status');
        return;
      }

      const result = await response.json();
      console.log('✅ Task status updated successfully:', result);

      // Update local state to reflect the change
      setClientTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                completed: newStatus === 'completed',
                status: newStatus
              }
            : task
        )
      );

      // Show success message
      toast.success(`Task ${newStatus === 'completed' ? 'completed' : 'marked as pending'}`);
      
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      toast.error('Error updating task status');
    }
  };

  // Note management functions

  const handleUpdateNote = async (noteId, noteData) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: noteData.title,
          description: noteData.description
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setClientNotes(prev => 
          prev.map(note => 
            note.id === noteId ? result.note : note
          )
        );
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClientNotes(prev => prev.filter(note => note.id !== noteId));
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
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
    <div className="max-h-screen bg-gray-50 p-6">
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

          <TabsContent value="overview" className="space-y-6 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-6 h-full min-h-[calc(100vh-300px)]">
              {/* Left Column - Client Details + Tasks */}
              <div className="flex flex-col space-y-6">
                {/* Client Details */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Avatar className="h-20 w-20 mx-auto">
                        {clientData.avatar && (
                          <AvatarImage 
                            src={clientData.avatar} 
                            alt={clientData.name} 
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {clientData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{clientData.name}</h3>
                        <p className="text-sm text-gray-500">
                          Last active: {clientData.lastActive 
                            ? new Date(clientData.lastActive).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div className="space-y-2 text-left">
                        {clientData.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{clientData.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{clientData.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Type: {clientData.type || 'Personal'}</span>
                        </div>
                        {clientData.nextSession && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Next session: {new Date(clientData.nextSession).toLocaleString()}</span>
                          </div>
                        )}
                        {clientData.status && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={clientData.status === 'active' ? 'default' : 'secondary'}>
                              {clientData.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Tasks */}
                <div className="flex-1 flex flex-col">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
                      <CardTitle className="text-sm">Tasks</CardTitle>
                      <CreateTaskDialog 
                        clientId={clientData.id}
                        clientName={clientData.name}
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
                    <CardContent className="flex-1 flex flex-col">
                      <ScrollArea className="flex-1">
                        <div className="space-y-3">
                          {clientTasks.length > 0 ? (
                            clientTasks.map((task) => (
                              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                <Checkbox 
                                  checked={task.completed}
                                  onCheckedChange={() => handleTaskToggle(task.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No tasks assigned yet</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Center Column - Chat Interface */}
              <div className="flex flex-col">
                <Card className="h-full flex flex-col">
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex-1">
                      {conversationLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : chatConversationId ? (
                        <UniversalChatInterface 
                          chatId={chatConversationId}
                          chatType="personal"
                          participantName={clientData.name}
                          participantInitials={clientData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          participantAvatar={clientData.avatar || null}
                          currentUserId={session?.user?.id}
                          currentUserRole="coach"
                          title={clientData.name}
                          className="h-[calc(100vh-100px)]"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Unable to load chat
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Notes & Files */}
              <div className="flex flex-col space-y-6">
                {/* Recent Notes */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm">Notes</CardTitle>
                    <CreateNoteDialog 
                      clientId={id}
                      onNoteCreated={(newNote) => {
                        setClientNotes(prev => [newNote, ...prev]);
                      }}
                    >
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </CreateNoteDialog>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {clientNotes.length > 0 ? (
                          clientNotes.map((note) => (
                            <div key={note.id} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-medium truncate">{note.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {note.description || 'No description'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-5 w-5 p-0"
                                    onClick={() => {
                                      const newTitle = prompt('Edit title:', note.title);
                                      if (newTitle !== null) {
                                        const newDescription = prompt('Edit description:', note.description || '');
                                        if (newDescription !== null) {
                                          handleUpdateNote(note.id, { 
                                            title: newTitle, 
                                            description: newDescription 
                                          });
                                        }
                                      }
                                    }}
                                    title="Edit note"
                                  >
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-5 w-5 p-0 text-red-500 hover:text-red-600"
                                    onClick={() => handleDeleteNote(note.id)}
                                    title="Delete note"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No notes yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Shared Files */}
                <div className="flex-1 flex flex-col">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
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
                    <CardContent className="flex-1 flex flex-col">
                      <ScrollArea className="flex-1">
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
                                  onClick={() => handlePreview(file)}
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
            </div>
            </TabsContent>

          <TabsContent value="programs" className="space-y-6">
            
              <div className="space-y-6">
                {/* Enrolled Programs (Not Started) */}
                {getEnrolledPrograms().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Enrolled Programs ({getEnrolledPrograms().length})
                      </CardTitle>
                      <CardDescription>
                        Programs enrolled but not yet started
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getEnrolledPrograms().map((clientProgram) => {
                          const program = getProgramById(clientProgram.id);
                          
                          if (!program) return null;
                          
                          return (
                            <Card key={clientProgram.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold">{program.name}</h4>
                                    <p className="text-sm text-muted-foreground">{program.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>{program.duration} weeks</span>
                                      <span>{program.elements?.length || 0} elements</span>
                                      <span>Enrolled: {new Date(clientProgram.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      onClick={() => startProgram(clientProgram.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Program
                                    </Button>
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
                        const progress = calculateProgramProgress(clientProgram);
                        const nextElement = getNextUpcomingElement(clientProgram);
                        
                        if (!clientProgram || !progress) return null;
                        
                        return (
                           <ProgramTimelineView
                             key={clientProgram.id}
                             clientProgram={clientProgram}
                             progress={progress}
                             onMarkComplete={(elementId) => markElementComplete(clientProgram.id, elementId)}
                             onPauseResume={() => clientProgram.status === 'active' ? pauseProgram(clientProgram.id) : resumeProgram(clientProgram.id)}
                             onViewProgram={() => router.push(`/coach/programs/${clientProgram.programTemplateId}/edit`)}
                             onRestart={() => restartProgram(clientProgram.id)}
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

                {/* Completed Programs */}
                {getHistoryPrograms().filter(cp => cp.status === 'completed').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Completed Programs ({getHistoryPrograms().filter(cp => cp.status === 'completed').length})
                      </CardTitle>
                      <CardDescription>
                        Programs successfully completed by this client
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {getHistoryPrograms().filter(cp => cp.status === 'completed').map((clientProgram) => {
                          const program = getProgramById(clientProgram.id);
                          const progress = calculateProgramProgress(clientProgram);
                          
                          if (!program || !progress) return null;
                          
                          return (
                            <ProgramTimelineView
                              key={clientProgram.id}
                              clientProgram={clientProgram}
                              progress={progress}
                              onMarkComplete={() => {}} // Disabled for completed programs
                              onPauseResume={() => {}} // Disabled for completed programs
                              onViewProgram={() => router.push(`/coach/programs/${clientProgram.programTemplateId}/edit`)}
                              onRestart={() => restartProgram(clientProgram.id)}
                            />
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Paused Programs */}
                {getHistoryPrograms().filter(cp => cp.status === 'paused').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pause className="h-5 w-5 text-yellow-600" />
                        Paused Programs ({getHistoryPrograms().filter(cp => cp.status === 'paused').length})
                      </CardTitle>
                      <CardDescription>
                        Programs that have been paused
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {getHistoryPrograms().filter(cp => cp.status === 'paused').map((clientProgram) => {
                          const program = getProgramById(clientProgram.id);
                          const progress = calculateProgramProgress(clientProgram);
                          
                          if (!program || !progress) return null;
                          
                          return (
                            <Card key={clientProgram.id} className="border-l-4 border-l-yellow-500">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{program.name}</h4>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                      ⏸️ Paused
                                    </Badge>
                                  </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resumeProgram(clientProgram.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <Play className="h-4 w-4" />
                                      Resume
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {program.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                      Progress: {Math.round(progress.completionRate)}% • Duration: {program.duration} weeks
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/coach/programs/${clientProgram.programTemplateId}/edit`)}
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
                  Groups that {clientData.name} is currently participating in
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
                              <Badge variant={group.stage === 'ongoing' ? 'default' : 'secondary'}>
                                {group.stage}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Joined</p>
                                  <p className="text-muted-foreground">
                                    {new Date(group.joinedDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Frequency</p>
                                  <p className="text-muted-foreground">{group.frequency || 'Not specified'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Members</p>
                                  <p className="text-muted-foreground">
                                    {group.memberCount}/{group.capacity || 'No limit'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Status</p>
                                  <p className="text-muted-foreground capitalize">{group.stage}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="text-sm">
                            <span className="font-medium">Group ID: </span>
                            <span className="text-muted-foreground">{group.id}</span>
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
                    {progressLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading progress data...</span>
                      </div>
                    ) : progressError ? (
                      <div className="flex items-center justify-center h-full text-red-500">
                        <AlertCircle className="h-8 w-8" />
                        <div className="text-center">
                          <p className="font-medium">Error loading progress data</p>
                          <p className="text-sm text-gray-500 mt-1">{progressError}</p>
                        </div>
                      </div>
                    ) : !progressData ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-medium">No progress data available</p>
                          <p className="text-sm text-gray-400 mt-1">Client needs to start activities to see progress</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Debug: Log the weekly data */}
                        {console.log('Weekly data for chart:', clientProgressData.weeklyData)}
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={clientProgressData.weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="week" 
                          tick={{ fontSize: 12 }}
                          interval={0}
                        />
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
                    </>
                    )}
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
                        {progressData ? clientProgressData.currentMetrics.performance.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-sm text-gray-600">Performance Score</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${(progressData ? clientProgressData.currentMetrics.performance : 0) * 10}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {progressData ? clientProgressData.currentMetrics.wellbeing.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-sm text-gray-600">Wellbeing Score</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${(progressData ? clientProgressData.currentMetrics.wellbeing : 0) * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {progressData?.stats?.journalCompletionRate || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Journal Completion</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {progressData?.stats?.sessionAttendanceRate || 0}%
                      </div>
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
              <CardContent className="space-y-4">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading activities...</span>
                  </div>
                ) : clientActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activities</p>
                    <p className="text-sm">Activities will appear here as the client engages with the platform</p>
                  </div>
                ) : (
                  clientActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        {activity.type === 'signup' && <UserPlus className="h-4 w-4" />}
                        {activity.type === 'task_completed' && <CheckCircle className="h-4 w-4" />}
                        {activity.type === 'daily_checkin' && <Heart className="h-4 w-4" />}
                        {activity.type === 'session_attended' && <Calendar className="h-4 w-4" />}
                        {activity.type === 'goal_achieved' && <Trophy className="h-4 w-4" />}
                        {activity.type === 'milestone_reached' && <Target className="h-4 w-4" />}
                        {!['signup', 'task_completed', 'daily_checkin', 'session_attended', 'goal_achieved', 'milestone_reached'].includes(activity.type) && <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {activity.title}
                          </h4>
                          {activity.pointsEarned > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              +{activity.pointsEarned} pts
                            </Badge>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
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
          groupName={`Individual Session with ${clientData.name}`}
          groupMembers={1}
        />


        <EnrollClientDialog
          open={enrollDialogOpen}
          onOpenChange={setEnrollDialogOpen}
          clientName={clientData.name}
          availablePrograms={getAvailablePrograms()}
          onEnroll={enrollInProgram}
          loading={programsLoading}
        />

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Preview</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setPreviewUrl(null);
                    setPreviewType(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                {previewType === 'images' ? (
                  <div>
                    <img 
                      src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                      alt="Preview"
                      className="max-w-full max-h-[70vh] object-contain mx-auto"
                      onLoad={(e) => {
                        console.log('✅ Image loaded successfully via API');
                      }}
                      onError={(e) => {
                        console.error('❌ API image failed to load');
                        e.target.style.display = 'none';
                        // Show fallback message
                        const fallback = document.createElement('div');
                        fallback.className = 'text-center py-8';
                        fallback.innerHTML = `
                          <p class="text-muted-foreground mb-4">Preview failed to load</p>
                          <p class="text-xs text-red-500 mb-2">URL: ${previewUrl}</p>
                          <button 
                            class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            onclick="window.open('${previewUrl}', '_blank')"
                          >
                            Open in New Tab
                          </button>
                        `;
                        e.target.parentNode.appendChild(fallback);
                      }}
                    />
                  </div>
                ) : previewType === 'videos' ? (
                  <video 
                    src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                    controls
                    className="max-w-full max-h-[70vh] mx-auto"
                    onLoadStart={() => {
                      console.log('✅ Video started loading via API');
                    }}
                    onError={(e) => {
                      console.error('❌ API video failed to load');
                      e.target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'text-center py-8';
                      fallback.innerHTML = `
                        <p class="text-muted-foreground mb-4">Video failed to load</p>
                        <p class="text-xs text-red-500 mb-2">URL: ${previewUrl}</p>
                        <button 
                          class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          onclick="window.open('${previewUrl}', '_blank')"
                        >
                          Open in New Tab
                        </button>
                      `;
                      e.target.parentNode.appendChild(fallback);
                    }}
                  />
                ) : previewType === 'sounds' ? (
                  <audio 
                    src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                    controls
                    className="w-full"
                    onLoadStart={() => {
                      console.log('✅ Audio started loading via API');
                    }}
                    onError={(e) => {
                      console.error('❌ API audio failed to load');
                      e.target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'text-center py-8';
                      fallback.innerHTML = `
                        <p class="text-muted-foreground mb-4">Audio failed to load</p>
                        <p class="text-xs text-red-500 mb-2">URL: ${previewUrl}</p>
                        <button 
                          class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          onclick="window.open('${previewUrl}', '_blank')"
                        >
                          Open in New Tab
                        </button>
                      `;
                      e.target.parentNode.appendChild(fallback);
                    }}
                  />
                ) : previewType === 'pdf' ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">PDF Preview</h4>
                      <iframe
                        src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                        className="w-full h-[60vh] border rounded"
                        title="PDF Preview"
                        onLoad={() => {
                          console.log('✅ PDF loaded successfully via API');
                        }}
                        onError={() => {
                          console.error('❌ PDF failed to load via API');
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          const apiUrl = `/api/library/preview?path=${encodeURIComponent(previewUrl)}`;
                          window.open(apiUrl, '_blank');
                        }}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                ) : previewType === 'document' ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Document Preview</h4>
                      <div className="w-full h-[60vh] border rounded bg-gray-50 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h3>
                          <p className="text-sm text-gray-500 mb-6">
                            This document type cannot be previewed directly in the browser. 
                            Please download the file to view it in a compatible application.
                          </p>
                          <div className="space-y-3">
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const apiUrl = `/api/library/preview?path=${encodeURIComponent(previewUrl)}`;
                                window.open(apiUrl, '_blank');
                              }}
                            >
                              Open in New Tab
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                window.open(previewUrl, '_blank');
                              }}
                            >
                              Open Original URL
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        window.open(previewUrl, '_blank');
                      }}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}