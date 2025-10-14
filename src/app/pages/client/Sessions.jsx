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
import { useSession } from "next-auth/react";
import { useClientCoach } from "@/app/hooks/useClientCoach";
import { useConversationId } from "@/app/hooks/useConversationId";
import { useGroups } from "@/app/hooks/useGroups";
import { Loader2 } from "lucide-react";

export default function ClientSessions() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Get client's coach and conversation ID
  const { coach, loading: coachLoading, error: coachError } = useClientCoach();
  console.log('🔍 Client Sessions - Coach data:', { coach, coachLoading, coachError });
  const { conversationId, loading: conversationLoading } = useConversationId(
    session?.user?.id,
    coach?.id
  );
  
  // Get groups from database
  const { groups, loading: groupsLoading, error: groupsError } = useGroups();
  
  // Get joined groups (only groups the client is actually a member of)
  const joinedGroups = groups.filter(group => group.isJoined);
  
  const handleOpenGroupChat = (groupId, groupName) => {
    router.push(`/client/group/${groupId}?groupName=${encodeURIComponent(groupName)}`);
  };

  const ChatTab = () => {
    if (coachLoading || conversationLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!coach) {
      return (
        <div className="flex items-center justify-center h-screen text-muted-foreground">
          <div className="text-center">
            <p>No coach assigned</p>
            {coachError && (
              <p className="text-sm text-red-500 mt-2">Error: {coachError}</p>
            )}
          </div>
        </div>
      );
    }

    if (!conversationId) {
      return (
        <div className="flex items-center justify-center h-screen text-muted-foreground">
          Unable to load chat
        </div>
      );
    }

    return (
      <UniversalChatInterface
        chatId={conversationId}
        chatType="personal"
        participantName={coach.name}
        participantInitials={coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        currentUserId={session?.user?.id}
        currentUserRole="client"
        allowScheduling={true}
        title={coach.name}
        className="h-screen rounded-none border-none"
      />
    );
  };

  const GroupsTab = () => {
    if (groupsLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (groupsError) {
      return (
        <div className="flex items-center justify-center h-screen text-muted-foreground">
          Error loading groups: {groupsError}
        </div>
      );
    }

    // If user is member of exactly one group, show group chat directly
    if (joinedGroups.length === 1) {
      const group = joinedGroups[0];
      return (
        <GroupChatInterface
          groupId={group.id}
          groupName={group.name}
          members={group.members}
          activeMembers={group.members} // Use actual member count
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
                            {group.members}/{group.maxMembers || '∞'} members
                            <Badge variant="outline" className="text-xs">
                              {group.focusArea || 'General'}
                            </Badge>
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