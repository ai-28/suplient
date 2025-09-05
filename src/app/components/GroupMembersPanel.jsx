
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { 
  Users,
  MessageCircle,
  Phone,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Clock,
  UserPlus
} from "lucide-react";
export function GroupMembersPanel({ members, onMessageMember, onMemberClick, groupId }) {
  
  // Convert pending membership requests to member objects for unified display
  const pendingRequests = groupId ? [] : [];
  const pendingMembers = pendingRequests.map(req => ({
    id: parseInt(req.id.replace(/\D/g, '')) || 0, // Extract number from request ID
    name: req.clientName,
    initials: req.clientName.split(' ').map(n => n[0]).join(''),
    status: "on-hold",
    joinDate: new Date(req.timestamp).toLocaleDateString(),
    attendance: "0%",
    requestId: req.id,
    requestType: req.requestType,
    message: req.message
  }));

  // Combine actual members with pending requests
  const allMembers = [...members, ...pendingMembers];
  const activeMembers = allMembers.filter(m => m.status === "active");
  const inactiveMembers = allMembers.filter(m => m.status === "inactive");
  const onHoldMembers = allMembers.filter(m => m.status === "on-hold");

  const getAttendanceColor = (attendance) => {
    const rate = parseInt(attendance);
    if (rate >= 90) return "text-success bg-success/10 border-success/20";
    if (rate >= 75) return "text-warning bg-warning/10 border-warning/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  const calculateAverageAttendance = () => {
    const activeWithAttendance = activeMembers.filter(m => m.attendance && m.attendance !== "0%");
    if (activeWithAttendance.length === 0) return 0;
    const total = activeWithAttendance.reduce((sum, member) => sum + parseInt(member.attendance), 0);
    return Math.round(total / activeWithAttendance.length);
  };

  const handleApproveRequest = (requestId) => {
    // approveRequest(requestId);
  };

  const handleDeclineRequest = (requestId) => {
    //  declineRequest(requestId);
  };

  return (
    <div className="space-y-4">
      {/* Member Statistics Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-4 w-4 text-primary" />
            Member Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 bg-success/5 rounded-lg border border-success/20">
              <div className="text-xl font-bold text-success">{activeMembers.length}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-2 bg-muted/5 rounded-lg border border-muted/20">
              <div className="text-xl font-bold text-muted-foreground">{inactiveMembers.length}</div>
              <div className="text-xs text-muted-foreground">Inactive</div>
            </div>
            <div className="text-center p-2 bg-warning/5 rounded-lg border border-warning/20">
              <div className="text-xl font-bold text-warning">{onHoldMembers.length}</div>
              <div className="text-xs text-muted-foreground">On Hold</div>
            </div>
            <div className="text-center p-2 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-xl font-bold text-primary">{allMembers.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Active Members and On Hold side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Members - takes 50% of the space */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-4 w-4 text-success" />
                Active Members ({activeMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/5 transition-all cursor-pointer"
                    onClick={() => onMemberClick?.(member.id.toString(), member.name)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">Joined {member.joinDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* On Hold - Pending Approval - takes 50% of the space */}
        {onHoldMembers.length > 0 && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-4 w-4 text-warning" />
                  On Hold ({onHoldMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {onHoldMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-2 p-3 border border-border rounded-lg bg-warning/5 border-warning/20 cursor-pointer hover:bg-warning/10 transition-all"
                        onClick={() => !member.requestId && onMemberClick?.(member.id.toString(), member.name)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border-2 border-warning/30">
                            <AvatarFallback className="bg-warning/10 text-warning text-sm">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.requestId ? (
                                member.requestType === "invitation" ? "Invited" : "Requested"
                              ) : (
                                "On hold"
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {member.message && (
                          <p className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded">
                            "{member.message}"
                          </p>
                        )}
                        
                        {member.requestId && (
                          <div className="flex flex-col gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs bg-success/10 border-success/30 text-success hover:bg-success/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveRequest(member.requestId);
                              }}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeclineRequest(member.requestId);
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              Inactive Members ({inactiveMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[120px]">
              <div className="space-y-3">
                {inactiveMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="h-8 w-8 border-2 border-muted/30 cursor-pointer hover:border-muted/50 transition-colors"
                        onClick={() => onMemberClick?.(member.id.toString(), member.name)}
                      >
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onMemberClick?.(member.id.toString(), member.name)}
                      >
                        <p className="font-medium text-sm text-muted-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">Joined {member.joinDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-muted/50 text-muted-foreground bg-muted/10">
                        Inactive
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onMessageMember(member.id)}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
