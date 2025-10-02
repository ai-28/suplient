"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { MembershipRequestsPanel } from "@/app/components/MembershipRequestsPanel";
import { 
  Users2, 
  Save, 
  Trash2, 
  UserMinus,
  Calendar,
  Settings,
  UserPlus,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export function GroupSettingsDialog({ open, onOpenChange, group }) {
  const [groupName, setGroupName] = useState(group?.name || "");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("12");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Fetch group members when dialog opens
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!open || !group?.id) return;
      
      setMembersLoading(true);
      try {
        const response = await fetch(`/api/groups/${group.id}/members`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch group members');
        }
        
        const data = await response.json();
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching group members:', error);
        toast.error('Failed to load group members');
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchGroupMembers();
  }, [open, group?.id]);

  const handleSave = () => {
    toast.success(`${groupName} has been successfully updated.`);
    onOpenChange(false);
  };

  const handleRemoveMember = async (memberId, memberName) => {
    try {
      // Call the API to remove the member from the group
      const response = await fetch(`/api/groups/${group.id}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientIds: [memberId]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member from group');
      }

      const result = await response.json();
      
      // Update local state to reflect the removal
      setMembers(members.filter(member => member.id !== memberId));
      toast.success(`${memberName} has been removed from the group.`);
    } catch (error) {
      console.error('Error removing member from group:', error);
      toast.error(error.message || "Failed to remove member from group");
    }
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim() || !group) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Use the membership request system for coach invitations
    inviteClient(
      group.id,
      `client_${Date.now()}`, // Generate a client ID
      newMemberEmail.split('@')[0], // Use email prefix as name
      newMemberEmail
    );
    
    const newMember = {
      id: Math.max(...members.map(m => m.id)) + 1,
      name: newMemberEmail,
      initial: newMemberEmail.charAt(0).toUpperCase(),
      status: "active", // Coach invitations are immediately active
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    setMembers([...members, newMember]);
    setNewMemberEmail("");
    setShowAddMember(false);
  };

  const handleDeleteGroup = () => {
    toast({
      title: "Group Deleted",
      description: `${group?.name} has been permanently deleted.`,
      variant: "destructive",
    });
    onOpenChange(false);
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="bg-gradient-primary rounded-lg p-2">
              <Settings className="h-6 w-6 text-white" />
            </div>
            Group Settings - {group.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="py-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Settings */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users2 className="h-5 w-5 text-primary" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the group's purpose and goals..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>


                <div>
                  <Label htmlFor="capacity">Maximum Capacity</Label>
                  <Select value={capacity} onValueChange={setCapacity}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 members</SelectItem>
                      <SelectItem value="8">8 members</SelectItem>
                      <SelectItem value="10">10 members</SelectItem>
                      <SelectItem value="12">12 members</SelectItem>
                      <SelectItem value="15">15 members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Session Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Next Session
              </h3>
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Scheduled for</p>
                    <p className="text-sm text-muted-foreground">{group.nextSession}</p>
                  </div>
                  <Badge variant="secondary">Confirmed</Badge>
                </div>
              </div>
              </div>
            </div>

            {/* Right Column - Session Schedule */}
            <div className="space-y-6">
              {/* Session Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Next Session
                </h3>
                
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Scheduled for</p>
                      <p className="text-sm text-muted-foreground">{group.nextSession}</p>
                    </div>
                    <Badge variant="secondary">Confirmed</Badge>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-primary" />
                  Members ({membersLoading ? "..." : members.length})
                </h3>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {membersLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading members...</span>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No members yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Add members to get started</p>
                      </div>
                    </div>
                  ) : (
                    members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {member.initial}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(member.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.status === "active" ? "success" : member.status === "pending" ? "warning" : "secondary"}>
                          {member.status}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.name} from this group? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id, member.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    ))
                  )}
                </div>

                {/* Add Member Form */}
                {showAddMember ? (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <Label htmlFor="newMemberEmail">Member Email</Label>
                    <Input
                      id="newMemberEmail"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Enter member email address"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddMember} className="flex-1">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowAddMember(false);
                        setNewMemberEmail("");
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAddMember(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite New Member
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <MembershipRequestsPanel groupId={group?.id} />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{group.name}"? This action cannot be undone. All group data, members, and sessions will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteGroup}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Group
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary text-black hover:text-white">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}