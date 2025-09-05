import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { ArrowLeft, Users, MessageCircle, Calendar, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MembershipRequestDialog } from "@/app/components/MembershipRequestDialog";
import { useMembershipRequests } from "@/app/hooks/useMembershipRequests";

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
  },
  {
    id: 3,
    name: "Depression Recovery",
    description: "Supporting each other through depression recovery journey",
    members: 15,
    maxMembers: 20,
    nextSession: "Wed, 2:00 PM",
    category: "Support",
    isJoined: false,
    unreadMessages: 0,
    groupType: "open",
    coachId: "coach_1",
    focusArea: "Depression",
    frequency: "weekly",
    duration: "60",
    location: "Online",
    avatars: []
  },
  {
    id: 4,
    name: "Young Adults Mental Health",
    description: "For adults aged 18-25 navigating mental health challenges",
    members: 6,
    maxMembers: 12,
    nextSession: "Fri, 4:00 PM",
    category: "Age-Specific",
    isJoined: false,
    unreadMessages: 0,
    groupType: "open",
    coachId: "coach_3",
    focusArea: "General Mental Health",
    frequency: "weekly",
    duration: "60",
    location: "Online",
    avatars: []
  }
];

export default function ClientGroups() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { getRequestsByGroup } = useMembershipRequests();

  // Mock current user data - in real app this would come from auth context
  const currentUser = {
    id: "client_current",
    name: "Current User",
    email: "current@example.com"
  };

  // Check if user has pending request for a group
  const hasPendingRequest = (groupId) => {
    const groupRequests = getRequestsByGroup(groupId);
    return groupRequests.some(request => 
      request.clientId === currentUser.id && 
      request.status === "pending"
    );
  };

  const filteredGroups = groups.filter(group => {
    if (filter === "joined") return group.isJoined;
    if (filter === "available") return !group.isJoined;
    return true;
  });

  const handleJoinGroup = (group) => {
    if (group.groupType === "open") {
      setSelectedGroup(group);
      setRequestDialogOpen(true);
    } else {
      // For invite-only groups, show a message that they need an invitation
      console.log(`Group ${group.id} is invite-only`);
    }
  };

  const handleOpenChat = (groupId, groupName) => {
    navigate(`/client/group/${groupId}/chat`, { state: { groupName } });
  };

  const handleJoinSession = (groupId, groupName) => {
    // Handle join session logic
    console.log(`Joining session for group ${groupId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/client')}>
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
                        {group.members}/{group.maxMembers} members
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {group.nextSession}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{group.category}</Badge>
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
                                You're about to join the session scheduled for {group.nextSession}. 
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
                        disabled={group.members >= group.maxMembers || hasPendingRequest(group.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {group.members >= group.maxMembers 
                          ? "Full" 
                          : hasPendingRequest(group.id)
                            ? "Request Pending"
                            : group.groupType === "open" 
                              ? "Request to Join" 
                              : "Invite Only"
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
          clientId={currentUser.id}
          clientName={currentUser.name}
          clientEmail={currentUser.email}
        />
      </div>
    </div>
  );
}