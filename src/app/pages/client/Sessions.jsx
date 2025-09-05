"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Users, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UniversalChatInterface } from "@/app/components/UniversalChatInterface";
import { GroupChatInterface } from "@/app/components/GroupChatInterface";

// Mock groups data - in real app this would come from a proper data source
const groups = [
  {
    id: 1,
    name: "Anxiety Support Circle",
    description: "A safe space to share experiences and coping strategies for anxiety",
    members: 12,
    maxMembers: 15,
    nextSession: "Today, 3:00 PM",
    category: "Support",
    isJoined: true,
    unreadMessages: 3,
    groupType: "open",
    coachId: "coach_1",
    focusArea: "Anxiety",
    frequency: "weekly",
    duration: "60",
    location: "Online",
    avatars: []
  },
  {
    id: 2,
    name: "Mindfulness & Meditation",
    description: "Weekly guided meditation sessions and mindfulness practices",
    members: 8,
    maxMembers: 10,
    nextSession: "Tomorrow, 10:00 AM",
    category: "Practice",
    isJoined: false,
    unreadMessages: 0,
    groupType: "invite-only",
    coachId: "coach_2",
    focusArea: "Mindfulness",
    frequency: "weekly",
    duration: "45",
    location: "Online",
    avatars: []
  }
];

export default function ClientSessions() {
  const router = useRouter();
  
  // Get joined groups
  const joinedGroups = groups.filter(group => group.isJoined);
  
  const handleOpenGroupChat = (groupId, groupName) => {
    router.push(`/client/group/${groupId}/chat`, { state: { groupName } });
  };

  const ChatTab = () => (
    <UniversalChatInterface
      chatId="client-session-1"
      chatType="personal"
      participantName="Coach Clausen"
      participantInitials="CC"
      currentUserId="client-1"
      currentUserRole="client"
      allowScheduling={true}
      title="Coach Clausen"
      className="h-screen rounded-none border-none"
    />
  );

  const GroupsTab = () => {
    // If user is member of exactly one group, show group chat directly
    if (joinedGroups.length === 1) {
      const group = joinedGroups[0];
      return (
        <GroupChatInterface
          groupId={group.id}
          groupName={group.name}
          members={group.members}
          activeMembers={group.members - 2} // Mock active count
        />
      );
    }

    // If multiple groups or no groups, show selection interface
    return (
      <div className="p-4 space-y-4">
        {joinedGroups.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Groups</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/client/groups')}
              >
                Browse All Groups
              </Button>
            </div>
            
            <div className="space-y-3">
              {joinedGroups.map((group) => (
                <Card key={group.id} className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{group.name}</p>
                            {group.unreadMessages > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {group.unreadMessages}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {group.members} members
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOpenGroupChat(group.id, group.name)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Open Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Group Memberships</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              You are not a member of any group yet. Consult with your coach/therapist to learn more about group sessions.
            </p>
            <Button onClick={() => router.push('/client/groups')}>
              Browse Available Groups
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="chat" className="h-full">
        {/* Tab Headers */}
        <div className="border-b border-border bg-card">
          <TabsList className="w-full grid grid-cols-2 h-12 bg-transparent p-0">
            <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              1-1
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Groups
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="chat" className="mt-0">
          <ChatTab />
        </TabsContent>
        
        <TabsContent value="groups" className="mt-0">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}