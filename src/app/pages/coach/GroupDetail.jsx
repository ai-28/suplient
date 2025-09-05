"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
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
import { getGroupProgressData } from '@/app/utils/progressCalculations';

const groupsData = [
  { 
    id: 1, 
    name: "Anxiety Support Group", 
    members: 8, 
    nextSession: "1 June",
    avatars: ["AS", "JD", "MR", "LK", "TS", "NK", "CW", "JB"],
    description: "A supportive environment for individuals dealing with anxiety disorders to share experiences and coping strategies.",
    frequency: "Weekly",
    duration: "90 minutes",
    location: "Room 101",
    capacity: "8-10 members",
    startDate: "March 2024",
    totalSessions: 12,
    completedSessions: 8,
    detailedMembers: [
      { id: 1, name: "John Anderson", initials: "JA", status: "active", joinDate: "March 2024", attendance: "92%", color: "hsl(var(--chart-1))" },
      { id: 2, name: "Alice Rodriguez", initials: "AR", status: "active", joinDate: "March 2024", attendance: "85%", color: "hsl(var(--chart-2))" },
      { id: 3, name: "Michael Thompson", initials: "MT", status: "active", joinDate: "April 2024", attendance: "78%", color: "hsl(var(--chart-3))" },
      { id: 4, name: "Sarah Williams", initials: "SW", status: "active", joinDate: "March 2024", attendance: "96%", color: "hsl(var(--chart-4))" },
      { id: 5, name: "Benjamin Lee", initials: "BL", status: "active", joinDate: "April 2024", attendance: "88%", color: "hsl(var(--chart-5))" },
      { id: 6, name: "Emma Davis", initials: "ED", status: "on-hold", joinDate: "March 2024", attendance: "45%", color: "hsl(var(--muted))" },
      { id: 7, name: "Christopher Wilson", initials: "CW", status: "active", joinDate: "May 2024", attendance: "91%", color: "hsl(var(--chart-1))" },
      { id: 8, name: "Jessica Brown", initials: "JB", status: "active", joinDate: "April 2024", attendance: "83%", color: "hsl(var(--chart-2))" },
    ]
  },
  { 
    id: 2, 
    name: "Depression Recovery Circle", 
    members: 8, 
    nextSession: "15 June",
    avatars: ["LG", "KM", "RT", "TC", "CM", "DR", "NW", "PJ"],
    description: "A compassionate space for those working through depression to find hope and healing together.",
    frequency: "Bi-weekly",
    duration: "120 minutes",
    location: "Room 102",
    capacity: "6-8 members",
    startDate: "February 2024",
    totalSessions: 16,
    completedSessions: 10,
    detailedMembers: [
      { id: 9, name: "Lisa Garcia", initials: "LG", status: "active", joinDate: "February 2024", attendance: "94%", color: "hsl(var(--chart-1))" },
      { id: 10, name: "Kevin Martinez", initials: "KM", status: "active", joinDate: "February 2024", attendance: "87%", color: "hsl(var(--chart-2))" },
      { id: 11, name: "Rachel Taylor", initials: "RT", status: "active", joinDate: "March 2024", attendance: "79%", color: "hsl(var(--chart-3))" },
      { id: 12, name: "Thomas Clark", initials: "TC", status: "active", joinDate: "February 2024", attendance: "92%", color: "hsl(var(--chart-4))" },
      { id: 13, name: "Caroline Miller", initials: "CM", status: "active", joinDate: "April 2024", attendance: "85%", color: "hsl(var(--chart-5))" },
      { id: 14, name: "Daniel Rodriguez", initials: "DR", status: "inactive", joinDate: "March 2024", attendance: "88%", color: "hsl(var(--muted))" },
      { id: 15, name: "Natalie Wilson", initials: "NW", status: "on-hold", joinDate: "February 2024", attendance: "52%", color: "hsl(var(--chart-1))" },
      { id: 16, name: "Patrick Johnson", initials: "PJ", status: "active", joinDate: "April 2024", attendance: "90%", color: "hsl(var(--chart-2))" },
    ]
  },
  {
    id: 3,
    name: "Stress Management Workshop",
    members: 5,
    nextSession: "10 June",
    avatars: ["JS", "MK", "AL", "RB", "TN"],
    description: "Learning effective techniques for managing stress and building resilience.",
    frequency: "Weekly",
    duration: "60 minutes",
    location: "Room 105",
    capacity: "5-7 members",
    startDate: "April 2024",
    totalSessions: 8,
    completedSessions: 3,
    detailedMembers: [
      { id: 23, name: "John Smith", initials: "JS", status: "active", joinDate: "April 2024", attendance: "100%", color: "hsl(var(--chart-1))" },
      { id: 24, name: "Maria Kelly", initials: "MK", status: "active", joinDate: "April 2024", attendance: "87%", color: "hsl(var(--chart-2))" },
      { id: 25, name: "Alex Liu", initials: "AL", status: "active", joinDate: "April 2024", attendance: "93%", color: "hsl(var(--chart-3))" },
      { id: 26, name: "Rebecca Brown", initials: "RB", status: "active", joinDate: "April 2024", attendance: "80%", color: "hsl(var(--chart-4))" },
      { id: 27, name: "Thomas Nixon", initials: "TN", status: "on-hold", joinDate: "April 2024", attendance: "60%", color: "hsl(var(--chart-5))" },
    ]
  },
  {
    id: 6,
    name: "Mindfulness & Meditation Group",
    members: 6,
    nextSession: "20 June",
    avatars: ["AW", "BH", "CD", "EF", "GH", "IJ"],
    description: "Exploring mindfulness practices and meditation techniques for mental wellness.",
    frequency: "Weekly",
    duration: "75 minutes",
    location: "Room 103",
    capacity: "6-8 members",
    startDate: "May 2024",
    totalSessions: 10,
    completedSessions: 4,
    detailedMembers: [
      { id: 17, name: "Anna Williams", initials: "AW", status: "active", joinDate: "May 2024", attendance: "95%", color: "hsl(var(--chart-1))" },
      { id: 18, name: "Brian Hill", initials: "BH", status: "active", joinDate: "May 2024", attendance: "89%", color: "hsl(var(--chart-2))" },
      { id: 19, name: "Catherine Davis", initials: "CD", status: "active", joinDate: "May 2024", attendance: "92%", color: "hsl(var(--chart-3))" },
      { id: 20, name: "Elena Foster", initials: "EF", status: "active", joinDate: "May 2024", attendance: "87%", color: "hsl(var(--chart-4))" },
      { id: 21, name: "Gabriel Hughes", initials: "GH", status: "on-hold", joinDate: "May 2024", attendance: "65%", color: "hsl(var(--chart-5))" },
      { id: 22, name: "Isabella Jones", initials: "IJ", status: "active", joinDate: "May 2024", attendance: "93%", color: "hsl(var(--muted))" },
    ]
  }
];

export default function GroupDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [enrollClientOpen, setEnrollClientOpen] = useState(false);
  
  // Handle tab from URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab');
    if (tabFromUrl && ['overview', 'members', 'analytics'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
  
  const group = groupsData.find(g => g.id === parseInt(id || "1")) || groupsData[0];

  // Generate unified progress data
  const groupProgressData = getGroupProgressData(
    group.id.toString(),
    group.name,
    group.detailedMembers.map(member => ({
      id: member.id?.toString() || member.name.replace(/\s+/g, '').toLowerCase(),
      name: member.name,
      status: member.status === "on-hold" || member.status === "inactive" ? "Inactive" : "Active",
    }))
  );

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
    // Here you would typically update the group data or refetch from API
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
            {"Back to Groups"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddMember} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {"Add Member"}
          </Button>
          <Button onClick={handleGroupSettings} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {"Group Settings"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">{"Overview"}</TabsTrigger>
              <TabsTrigger value="members" className="flex-1">{"Members"}</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">{"Progress Activity"}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-6 h-full">
              {/* Left Column */}
              <div className="space-y-6">
                <GroupInfoPanel 
                  group={group} 
                  onSettings={handleGroupSettings}
                  onAddMember={handleAddMember}
                />
                <GroupTasksPanel groupId={group.id} memberCount={group.members} />
              </div>

              {/* Center Column */}
              <div className="space-y-6">
                <GroupChatInterface 
                  groupId={group.id}
                  groupName={group.name}
                  members={group.members}
                  activeMembers={group.detailedMembers.filter(m => m.status === "active").length}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <GroupNotesPanel />
                <GroupFilesPanel groupId={group.id} />
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
                      {"Analytics"}
                    </CardTitle>
                    <CardDescription>
                      {"Analytics"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={groupProgressData.weeklyAverages}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
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
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                    {member.initials}
                                  </div>
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
      />
    </div>
  );
}