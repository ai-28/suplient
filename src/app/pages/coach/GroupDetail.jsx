"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/app/context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { 
  ArrowLeft, 
  Calendar, 
  Settings, 
  UserPlus,
  MessageCircle,
  MoreVertical,
  Activity,
  TrendingUp,
  Clock,
  Users,
  FileText,
  Video,
  CheckCircle,
  Eye
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { GroupSettingsDialog } from "@/app/components/GroupSettingsDialog";
import { ScheduleSessionDialog } from "@/app/components/ScheduleSessionDialog";
import { GroupChatInterface } from "@/app/components/GroupChatInterface";
import { GroupInfoPanel } from "@/app/components/GroupInfoPanel";
import { GroupMembersPanel } from "@/app/components/GroupMembersPanel";
import { GroupTasksPanel } from "@/app/components/GroupTasksPanel";
import { GroupNotesPanel } from "@/app/components/GroupNotesPanel";
import { GroupFilesPanel } from "@/app/components/GroupFilesPanel";
import { AddMemberToGroupDialog } from "@/app/components/AddMemberToGroupDialog";
import { useGroupProgress } from '@/app/hooks/useGroupProgress';

// Helper function to format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper function to format time for display
const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default function GroupDetail() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslation();
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [enrollClientOpen, setEnrollClientOpen] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get real group progress data
  const { progressData, loading: progressLoading, error: progressError } = useGroupProgress(id);
  
  // Fetch group data
  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/groups/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group data');
      }
      
      const result = await response.json();
      setGroupData(result.group);
    } catch (err) {
      console.error('Error fetching group data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab from URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab');
    if (tabFromUrl && ['overview', 'members', 'analytics'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
  
  // Fetch group data on component mount
  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('groups.loadingGroupData', 'Loading group data...')}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('common.messages.error')}: {error}</p>
          <Button onClick={fetchGroupData}>{t('common.buttons.tryAgain', 'Try Again')}</Button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!groupData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('groups.groupNotFound', 'Group not found')}</p>
          <Button onClick={() => router.push('/coach/groups')}>{t('groups.backToGroups', 'Back to Groups')}</Button>
        </div>
      </div>
    );
  }

  // Get session-based data (frequency, duration, location)
  const getSessionBasedData = () => {
    if (!groupData.sessions || groupData.sessions.length === 0) {
      return {
        frequency: 'Not specified',
        duration: 'Not specified',
        location: 'Not specified'
      };
    }

    // Get most common values from sessions
    const sessions = groupData.sessions;
    const durations = sessions.map(s => s.duration).filter(Boolean);
    const locations = sessions.map(s => s.location).filter(Boolean);
    
    // Calculate frequency based on session dates
    const sessionDates = sessions.map(s => new Date(s.sessionDate)).sort();
    let frequency = 'Not specified';
    if (sessionDates.length > 1) {
      const avgDaysBetween = (sessionDates[sessionDates.length - 1] - sessionDates[0]) / (sessionDates.length - 1) / (1000 * 60 * 60 * 24);
      if (avgDaysBetween <= 7) frequency = 'Weekly';
      else if (avgDaysBetween <= 14) frequency = 'Bi-weekly';
      else if (avgDaysBetween <= 30) frequency = 'Monthly';
      else frequency = 'Irregular';
    }

    // Use next session's duration and location if available, otherwise fall back to most common
    let duration = 'Not specified';
    let location = 'Not specified';

    if (groupData.nextSession) {
      duration = groupData.nextSession.duration ? `${groupData.nextSession.duration} minutes` : 'Not specified';
      location = groupData.nextSession.location || 'Not specified';
    } 

    return {
      frequency,
      duration,
      location
    };
  };

  const sessionData = getSessionBasedData();

  // Transform group data to match expected format
  const group = {
    id: groupData.id,
    name: groupData.name,
    members: groupData.memberCount,
    nextSession: groupData.nextSession ? formatDate(groupData.nextSession.date) : 'No upcoming session',
    avatars: groupData.members?.map(member => member.initials) || [],
    description: groupData.description || 'No description available',
    frequency: sessionData.frequency,
    duration: sessionData.duration,
    location: sessionData.location,
    capacity: groupData.capacity ? `${groupData.capacity} members` : 'Not specified',
    startDate: groupData.createdAt ? formatDate(groupData.createdAt) : 'Not specified',
    totalSessions: groupData.totalSessions || 0,
    completedSessions: groupData.completedSessions || 0,
    detailedMembers: groupData.members?.map((member, index) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      initials: member.initials,
      status: member.status,
      joinDate: formatDate(member.joinDate),
      attendance: member.attendance,
      color: `hsl(var(--chart-${(index % 5) + 1}))`
    })) || []
  };

  console.log("group",groupData)

  
  // Use real data if available, otherwise show empty state
  const groupProgressData = progressData ? {
    ...progressData,
    weeklyAverages: progressData.weeklyAverages || [],
    members: progressData.members || []
  } : {
    weeklyAverages: [],
    members: [],
    stats: { totalMembers: 0, activeMembers: 0, totalCheckIns: 0, totalTasksCompleted: 0, totalSessionsAttended: 0, totalSessionsScheduled: 0 }
  };
console.log(groupProgressData)
  const handleMemberOverviewClick = (memberId, memberName) => {
    // Navigate to member's profile overview from member name/avatar clicks
    router.push(`/coach/clients/${memberId}?from=group&groupId=${id}&groupTab=${activeTab}&tab=overview&memberName=${encodeURIComponent(memberName)}`);
  };

  const handleMemberProgressClick = (memberId, memberName) => {
    // Navigate to member's profile progress from "View Details" button clicks
    router.push(`/coach/clients/${memberId}?from=group&groupId=${id}&groupTab=${activeTab}&tab=progress&memberName=${encodeURIComponent(memberName)}`);
  };

  const handleAddMember = () => {
    setEnrollClientOpen(true);
  };

  const handleScheduleSession = () => {
    setScheduleDialogOpen(true);
  };

  const handleGroupSettings = () => {
    setGroupSettingsOpen(true);
  };

    const handleMessageMember = (memberName) => {
    console.log(`Messaging ${memberName}`);
  };

  const handleMemberAdded = (memberData) => {
    console.log(`Added member: ${memberData.name} (${memberData.email}) via ${memberData.type}`);
    // Refresh the group data to show the new member
    fetchGroupData();
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/coach/groups")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('groups.backToGroups', 'Back to Groups')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddMember} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {t('groups.addMember', 'Add Member')}
          </Button>
          <Button onClick={handleGroupSettings} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('groups.groupSettings', 'Group Settings')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">{t('common.labels.overview', 'Overview')}</TabsTrigger>
              <TabsTrigger value="members" className="flex-1">{t('groups.members', 'Members')}</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">{t('groups.progressActivity', 'Progress Activity')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="px-6 py-4 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-6 h-full min-h-[calc(100vh-200px)]">
              {/* Left Column */}
              <div className="flex flex-col space-y-6">
                <GroupInfoPanel 
                  group={group} 
                  onSettings={handleGroupSettings}
                  onAddMember={handleAddMember}
                />
                <div className="flex-1 flex flex-col">
                  <GroupTasksPanel groupId={group.id} memberCount={group.members} />
                </div>
              </div>

              {/* Center Column */}
              <div className="flex flex-col justify-end h-full">
                <GroupChatInterface 
                  groupId={group.id}
                  groupName={group.name}
                  members={group.members}
                  activeMembers={group.detailedMembers.filter(m => m.status === "active").length}
                />
              </div>

              {/* Right Column */}
              <div className="flex flex-col space-y-6">
                <GroupNotesPanel groupId={group.id} />
                <div className="flex-1 flex flex-col">
                  <GroupFilesPanel groupId={group.id} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="px-6 py-4">
            <GroupMembersPanel 
              members={group.detailedMembers}
              groupId={group.id}
              onMemberClick={handleMemberOverviewClick}
                onMessageMember={(memberId) => {
                const member = group.detailedMembers.find(m => m.id === memberId);
                if (member) handleMessageMember(member.name);
              }}
            />
          </TabsContent>
        
          <TabsContent value="analytics" className="px-6 py-4">
            <div className="space-y-6 pb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t('groups.analytics', 'Analytics')}
                    </CardTitle>
                    <CardDescription>
                      {t('groups.analyticsDescription', 'View group progress and activity')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="h-[400px]">
                      {progressLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading progress data...</p>
                          </div>
                        </div>
                      ) : progressError ? (
                        <div className="flex items-center justify-center h-full text-red-500">
                          <div className="text-center">
                            <div className="text-red-500 mb-2">⚠️</div>
                            <p className="font-medium">Error loading progress data</p>
                            <p className="text-sm text-gray-500 mt-1">{progressError}</p>
                          </div>
                        </div>
                      ) : !progressData ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-medium">No progress data available</p>
                            <p className="text-sm text-gray-400 mt-1">Group needs activity to see progress</p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={groupProgressData.weeklyAverages}>
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
                                  const data = payload[0].payload;
                                  return (
                                     <div className="bg-white p-3 border rounded-lg shadow-lg">
                                       <p className="font-medium">{label}</p>
                                       <p className="text-blue-600">
                                         {"Performance"}: {data.performance}
                                       </p>
                                       <p className="text-green-600">
                                         {"Wellbeing"}: {data.wellbeing}
                                       </p>
                                       <p className="text-sm text-gray-500 mt-1">
                                         {"Based on members"}: {data.memberCount}
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
                              strokeWidth={3}
                              name={"Group Performance"}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="wellbeing" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              name={"Group Wellbeing"}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Member Summary Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>{"Member Progress"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{"Member"}</TableHead>
                            <TableHead>{"Status"}</TableHead>
                            <TableHead>{"Current Performance"}</TableHead>
                            <TableHead>{"Current Wellbeing"}</TableHead>
                            <TableHead>{"Actions"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupProgressData.members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    {member.avatar && (
                                      <AvatarImage 
                                        src={member.avatar} 
                                        alt={member.name} 
                                        className="object-cover"
                                      />
                                    )}
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                      {member.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{member.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={member.status === "Active" ? "default" : "secondary"}>
                                  {member.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500"
                                      style={{ width: `${member.currentMetrics.performance * 10}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{member.currentMetrics.performance}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500"
                                      style={{ width: `${member.currentMetrics.wellbeing * 10}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{member.currentMetrics.wellbeing}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMemberProgressClick(member.id, member.name)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  {"View Details"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <GroupSettingsDialog 
        open={groupSettingsOpen} 
        onOpenChange={setGroupSettingsOpen}
        group={group}
      />
      <ScheduleSessionDialog 
        open={scheduleDialogOpen} 
        onOpenChange={setScheduleDialogOpen}
        groupName={group.name}
        groupMembers={group.members}
      />
      <AddMemberToGroupDialog
        open={enrollClientOpen}
        onOpenChange={setEnrollClientOpen}
        groupName={group.name}
        onAddMember={handleMemberAdded}
        groupId={group.id}
      />
    </div>
  );
}