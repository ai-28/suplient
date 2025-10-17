"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { ArrowLeft, Users, MessageCircle, Calendar, Plus, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MembershipRequestDialog } from "@/app/components/MembershipRequestDialog";
import { useGroups } from "@/app/hooks/useGroups";
import { useSession } from "next-auth/react";


function ClientGroupsComponent() {
  const router = useRouter();
  const { data: session } = useSession();
  const [filter, setFilter] = useState("all");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Get groups from database
  const { groups, loading: groupsLoading, error: groupsError } = useGroups();
  
  // Check if user has pending request for a group (TODO: Implement with real API)
  const hasPendingRequest = (groupId) => {
    // For now, always return false since we don't have real membership request data
    return false;
  };

  const filteredGroups = groups.filter(group => {
    if (filter === "joined") return group.isJoined;
    if (filter === "available") return !group.isJoined;
    return true;
  });

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

  const handleJoinGroup = (group) => {
    if (group.groupType === "open") {
      setSelectedGroup(group);
      setRequestDialogOpen(true);
    } else {
      // For invite-only groups, show a message that they need an invitation
    }
  };

  const handleOpenChat = (groupId, groupName) => {
    router.push(`/client/group/${groupId}/chat?groupName=${encodeURIComponent(groupName)}`);
  };

  const handleJoinSession = (groupId, groupName) => {
    // Handle join session logic
    console.log(`Joining session for group ${groupId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => router.push('/client')}>
          <ArrowLeft className="h-5 w-5" />
        </Button> 
        <h1 className="ml-4 text-xl font-semibold">Support Circles</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Groups
          </Button>
          <Button
            variant={filter === "joined" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("joined")}
          >
            My Groups
          </Button>
          <Button
            variant={filter === "available" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("available")}
          >
            Available
          </Button>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.isJoined && (
                        <Badge variant="secondary">Joined</Badge>
                      )}
                      {group.unreadMessages > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {group.unreadMessages}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{group.description}</CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.members}/{group.maxMembers || '∞'} members
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {group.focusArea || 'General'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {group.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{group.focusArea || 'General'}</Badge>
                  <div className="flex space-x-2">
                    {group.isJoined ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenChat(group.id, group.name)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              Join Session
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Join {group.name} Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                You're about to join a session for {group.name}. 
                                Make sure you're in a quiet, private space for the best experience.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleJoinSession(group.id, group.name)}>
                                Join Session
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleJoinGroup(group)}
                        disabled={group.maxMembers && group.members >= group.maxMembers || hasPendingRequest(group.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {group.maxMembers && group.members >= group.maxMembers 
                          ? "Full" 
                          : hasPendingRequest(group.id)
                            ? "Request Pending"
                            : "Request to Join"
                        }
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {filter === "joined" ? "No Joined Groups" : "No Groups Available"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filter === "joined" 
                    ? "You haven't joined any support circles yet."
                    : "No groups match your current filter."
                  }
                </p>
                {filter === "joined" && (
                  <Button onClick={() => setFilter("available")}>
                    Browse Available Groups
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Membership Request Dialog */}
        <MembershipRequestDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          group={selectedGroup}
          clientId={session?.user?.id}
          clientName={session?.user?.name}
          clientEmail={session?.user?.email}
        />
      </div>
    </div>
  );
}

export default ClientGroupsComponent;